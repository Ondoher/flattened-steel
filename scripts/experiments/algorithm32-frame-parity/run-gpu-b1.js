import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

import {makeCube} from '../b3-matched-atmosphere-solver/cube.js';
import {CAPTURE_TIMES, loadKiderDataset} from '../b1-directional-sky-radiance/benchmark.js';
import {ProductionRun} from '../b1-directional-sky-radiance/ProductionRun.js';
import {publishProductionB1Result} from '../b1-directional-sky-radiance/publish-production-result.js';
import {FrameParityGpuHost} from './FrameParityGpuHost.js';

function parseArguments(argv) {
	const options = {conditions: [...CAPTURE_TIMES], order: 4, ground: 'production', boundaryAltitudeMeters: 2};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--conditions') options.conditions = argv[++index].split(',');
		else if (argv[index] === '--order') options.order = Number(argv[++index]);
		else if (argv[index] === '--output') options.output = resolve(argv[++index]);
		else if (argv[index] === '--cpu-values') options.cpuValues = resolve(argv[++index]);
		else if (argv[index] === '--ground') options.ground = argv[++index];
		else if (argv[index] === '--boundary-altitude') options.boundaryAltitudeMeters = Number(argv[++index]);
		else throw new Error(`Unknown argument: ${argv[index]}`);
	}
	if (!options.output) throw new Error('--output is required.');
	if (![1, 2, 3, 4].includes(options.order)) throw new RangeError('--order must be 1, 2, 3, or 4.');
	if (!['production', 'black'].includes(options.ground))
		throw new RangeError('--ground must be production or black.');
	if (![0, 0.001, 2].includes(options.boundaryAltitudeMeters)) {
		throw new RangeError('--boundary-altitude must be 0, 0.001, or 2.');
	}
	if (options.conditions.some((time) => !CAPTURE_TIMES.includes(time))) {
		throw new RangeError('--conditions must contain canonical B1 times.');
	}
	if (options.cpuValues && options.conditions.length !== 1) {
		throw new Error('--cpu-values requires one condition.');
	}
	return options;
}

function sha256(value) {
	return createHash('sha256').update(value).digest('hex');
}

function writeJson(path, value) {
	const text = `${JSON.stringify(value, null, 2)}\n`;
	writeFileSync(path, text, {encoding: 'utf8', flag: 'wx'});
	return sha256(text);
}

function tableHeader() {
	return ['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join(
		'\t',
	);
}

function compareCpuValues(rows, path) {
	const cpuRows = JSON.parse(readFileSync(path, 'utf8'));
	const cpuByKey = new Map(cpuRows.map((row) => [`${row.time}:${row.gridX}:${row.gridY}`, row.values]));
	let squared = 0;
	let maximumAbsolute = 0;
	let maximumLocation = null;
	let count = 0;
	for (const row of rows) {
		const cpu = cpuByKey.get(`${row.time}:${row.gridX}:${row.gridY}`);
		if (!cpu) throw new Error(`CPU comparison is missing ${row.time}:${row.gridX}:${row.gridY}.`);
		for (let channelIndex = 0; channelIndex < row.values.length; channelIndex += 1) {
			const difference = row.values[channelIndex] - cpu[channelIndex];
			const absolute = Math.abs(difference);
			squared += difference * difference;
			count += 1;
			if (absolute > maximumAbsolute) {
				maximumAbsolute = absolute;
				maximumLocation = {time: row.time, gridX: row.gridX, gridY: row.gridY, channelIndex, difference};
			}
		}
	}
	const absoluteRms = Math.sqrt(squared / count);
	return {
		count,
		absoluteRms,
		maximumAbsolute,
		maximumLocation,
		thresholds: {absoluteRms: 5e-7, maximumAbsolute: 2e-6},
		passed: absoluteRms <= 5e-7 && maximumAbsolute <= 2e-6,
	};
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	mkdirSync(options.output, {recursive: true});
	const runDirectory = resolve(options.output, 'b1-directional-sky-radiance/gpu');
	mkdirSync(runDirectory, {recursive: true});
	const progressLogPath = resolve(options.output, 'progress.log');
	const host = new FrameParityGpuHost({progressLogPath});
	const dataset = loadKiderDataset();
	const rows = [];
	const cubeValues = [];
	const profiles = [];
	let capabilities = null;
	const startedAt = new Date().toISOString();
	try {
		await host.open();
		for (const time of options.conditions) {
			const condition = dataset.conditions.find((candidate) => candidate.time === time);
			process.stderr.write(`[Frame B1 ${time} J${options.order}] GPU generation started\n`);
			const result = await host.generateCondition({
				time,
				fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
				maximumScatteringOrder: options.order,
				groundVariant: options.ground,
				boundaryAltitudeMeters: options.boundaryAltitudeMeters,
			});
			capabilities ??= result.capabilities;
			profiles.push({...result.profile, time, fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees});
			const conditionCube = [];
			for (let gridX = 0; gridX < 9; gridX += 1) {
				for (let gridY = 0; gridY < 9; gridY += 1) {
					const values = result.values[gridY * 9 + gridX];
					rows.push({time, gridX, gridY, values});
					conditionCube.push(values.slice(0, 31));
				}
			}
			cubeValues.push(conditionCube);
			process.stderr.write(`[Frame B1 ${time} J${options.order}] complete\n`);
		}
	} finally {
		await host.close();
	}

	writeJson(join(runDirectory, 'values.json'), rows);
	if (options.cpuValues) {
		const comparison = compareCpuValues(rows, options.cpuValues);
		writeJson(join(runDirectory, 'cpu-gpu-comparison.json'), comparison);
		if (!comparison.passed) throw new Error(`Retained-frame CPU/GPU parity failed: ${JSON.stringify(comparison)}`);
	}

	const lines = [tableHeader()];
	for (const row of rows) {
		lines.push(
			['proposed', row.time, row.gridX, row.gridY, ...row.values.map((value) => value.toPrecision(17))].join(
				'\t',
			),
		);
	}
	const table = `${lines.join('\n')}\n`;
	const tableName = `algorithm32-retained-frame-gpu-j${options.order}.tsv`;
	const tableSha256 = sha256(table);
	writeFileSync(join(runDirectory, tableName), table, {encoding: 'utf8', flag: 'wx'});
	const runId = `current-production-retained-frame-b1-gpu-${new Date().toISOString().replace(/[-:.]/g, '')}`;
	const completeBoundary = options.conditions.length === CAPTURE_TIMES.length;
	const provenance = {
		schema: 'algorithm32-current-production-b1-provenance-v2',
		runId,
		backend: 'gpu-production-shaders-r32f',
		executionBoundary: 'current production GPU cache and final-view shaders under retained-Z-up frame mapping',
		gpuCapabilities: capabilities,
		modelNameInBenchmarkTables: 'proposed',
		profileId: `paper-j${options.order}-retained-z-up-frame-diagnostic`,
		presentationName: `Algorithm32 Paper J${options.order} Retained Z-Up Frame Diagnostic`,
		physicalProfileId: 'algorithm32-paper-comparison-v1',
		physicalProfileContentHash: 'sha256:d47601d954167ca8775c0a88cd8ca9b9527ae8e74a6f42ae6041eec3244aeecc',
		frame: 'retained-z-up',
		groundVariant: options.ground,
		boundaryAltitudeMeters: options.boundaryAltitudeMeters,
		order: options.order,
		rowCount: rows.length,
		completeCanonicalBoundary: completeBoundary,
		spectralChannelCount: 40,
		nativeSpectralBoundary: {
			channelCount: 40,
			centersNanometers: Array.from({length: 40}, (_, index) => 360 + (470 * index) / 40),
			sampleSemantics: 'point-sampled-spectral-density',
			projection: 'identity-direct-40',
		},
		numericalControls: {
			pathIntervalCount: 40,
			sourceTransmittanceIntervalCount: 20,
			incidentDirectionCount: 34,
			incidentAltitudeBinCount: 48,
			incomingDirectionDomain: 'algorithm32-fibonacci-34-incoming-v1',
			scatteringOutputDomain: 'source-aligned-boundary-inclusive-gnomonic-cubed-sphere-w27',
			scatteringOutputFaceWidth: 27,
			scatteringOutputDirectionCount: 4374,
			positionNodeCount: 48,
			positionLookup: 'view-only-linear-physical-altitude-over-actual-nodes',
			maximumScatteringOrder: options.order,
		},
		table: {name: tableName, sha256: tableSha256, byteLength: Buffer.byteLength(table)},
		profiles,
	};
	const provenanceName = `algorithm32-retained-frame-gpu-j${options.order}-provenance.json`;
	const provenanceSha256 = writeJson(join(runDirectory, provenanceName), provenance);
	const outputRecord = {
		order: options.order,
		table: tableName,
		tableSha256,
		provenance: provenanceName,
		provenanceSha256,
	};
	if (completeBoundary) {
		const cubeName = `algorithm32-retained-frame-gpu-j${options.order}-cube.json`;
		outputRecord.cube = cubeName;
		outputRecord.cubeSha256 = writeJson(
			join(runDirectory, cubeName),
			makeCube(cubeValues, {
				source: 'retained-frame current-production GPU diagnostic',
				runId,
				order: options.order,
			}),
		);
	}
	if (options.order === 4) {
		const defaultName = 'algorithm32-retained-frame-gpu-default-provenance.json';
		outputRecord.defaultProvenance = defaultName;
		outputRecord.defaultProvenanceSha256 = writeJson(join(runDirectory, defaultName), {
			...provenance,
			profileId: 'paper',
			presentationName: 'Algorithm32 Paper',
		});
	}
	const manifest = {
		schema: ProductionRun.MANIFEST_SCHEMA,
		runId,
		backend: 'gpu-production-shaders-r32f',
		gpuCapabilities: capabilities,
		gpuProgressLogPath: progressLogPath,
		status: 'COMPLETE',
		startedAt,
		completedAt: new Date().toISOString(),
		conditions: options.conditions,
		orders: [options.order],
		profileFamily: 'paper',
		frame: 'retained-z-up',
		groundVariant: options.ground,
		boundaryAltitudeMeters: options.boundaryAltitudeMeters,
		outputs: [outputRecord],
	};
	writeJson(join(runDirectory, 'manifest.json'), manifest);
	const publication =
		completeBoundary && options.order === 4
			? publishProductionB1Result(join(runDirectory, 'manifest.json'), {outputRoot: options.output})
			: null;
	process.stdout.write(`${JSON.stringify({...manifest, runDirectory, publication}, null, 2)}\n`);
}

await main();
