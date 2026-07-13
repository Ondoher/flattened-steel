import {appendFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

import {Algorithm32} from '../../../src/algorithm32/implementation/algorithm32/Algorithm32.js';
import {SharedModel} from '../../../src/algorithm32/implementation/algorithm32/model/SharedModel.js';
import {DistantSunCpuCache} from '../../../src/algorithm32/implementation/distant-sun/cache/DistantSunCpuCache.js';
import {SphericalEarthGeometry} from '../../../src/algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js';
import {UniformLambertianGroundBoundary} from '../../../src/algorithm32/implementation/uniform-lambertian-ground/UniformLambertianGroundBoundary.js';
import {SpectralPacket, SPECTRAL_QUANTITIES, SPECTRAL_UNITS} from '../../../src/algorithm32/spectral-values/index.js';
import {CanonicalValueHash} from '../../../src/algorithm32/value-identity/CanonicalValueHash.js';
import {loadKiderDataset} from '../b1-directional-sky-radiance/benchmark.js';
import {computeTheoreticalSunDirection, getSampleDirection} from '../b1-directional-sky-radiance/benchmark-domain.js';
import {createBrunetonProductionProfile} from '../b1-directional-sky-radiance/production-profile.js';

const RETAINED_TABLE = resolve(
	'references/results/B1-3 Saved Results/b1-directional-sky-radiance/algorithm32-paper-j2-direct-40.tsv',
);

function parseArguments(argv) {
	const options = {
		conditions: ['11:15'],
		frame: 'retained-z-up',
		order: 2,
		ground: 'production',
		boundaryAltitudeMeters: 2,
	};
	for (let index = 0; index < argv.length; index += 1) {
		if (argv[index] === '--conditions') {
			options.conditions = argv[++index].split(',');
		} else if (argv[index] === '--frame') {
			options.frame = argv[++index];
		} else if (argv[index] === '--order') {
			options.order = Number(argv[++index]);
		} else if (argv[index] === '--ground') {
			options.ground = argv[++index];
		} else if (argv[index] === '--output') {
			options.output = resolve(argv[++index]);
		} else if (argv[index] === '--boundary-altitude') {
			options.boundaryAltitudeMeters = Number(argv[++index]);
		} else {
			throw new Error(`Unknown argument: ${argv[index]}`);
		}
	}
	if (!['retained-z-up', 'current-x-up', 'current-z-rotation-90'].includes(options.frame)) {
		throw new RangeError(`Unsupported frame: ${options.frame}`);
	}
	if (!options.output) throw new Error('--output is required.');
	if (![1, 2].includes(options.order)) throw new RangeError('--order must be 1 or 2.');
	if (!['production', 'black'].includes(options.ground)) {
		throw new RangeError('--ground must be production or black.');
	}
	if (![0, 2].includes(options.boundaryAltitudeMeters)) {
		throw new RangeError('--boundary-altitude must be 0 or 2.');
	}
	return options;
}

function currentDirection(zenithDegrees, azimuthDegrees) {
	const zenith = (zenithDegrees * Math.PI) / 180;
	const azimuth = (azimuthDegrees * Math.PI) / 180;
	const horizontal = Math.sin(zenith);
	return [Math.cos(zenith), horizontal * Math.sin(azimuth), horizontal * Math.cos(azimuth)];
}

function rotateZ90(direction) {
	return [-direction[1], direction[0], direction[2]];
}

function retainedDirection(zenithDegrees, azimuthDegrees) {
	const zenith = (zenithDegrees * Math.PI) / 180;
	const azimuth = (azimuthDegrees * Math.PI) / 180;
	const horizontal = Math.sin(zenith);
	return [horizontal * Math.cos(azimuth), horizontal * Math.sin(azimuth), Math.cos(zenith)];
}

function createFrameProfile(condition, frame, boundaryAltitudeMeters, maximumScatteringOrder, groundVariant) {
	const base = createBrunetonProductionProfile({
		time: condition.time,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
		maximumScatteringOrder,
	});
	const theoreticalSun = computeTheoreticalSunDirection(condition.time);
	const currentDirectionToLight = currentDirection(theoreticalSun.zenithDegrees, condition.sun.fittedAzimuthDegrees);
	const directionToLight =
		frame === 'retained-z-up'
			? retainedDirection(theoreticalSun.zenithDegrees, condition.sun.fittedAzimuthDegrees)
			: frame === 'current-x-up'
				? currentDirectionToLight
				: rotateZ90(currentDirectionToLight);
	const observerUpDirection =
		frame === 'retained-z-up' ? [0, 0, 1] : frame === 'current-x-up' ? [1, 0, 0] : [0, 1, 0];
	const geometry = new SphericalEarthGeometry({
		bottomRadius: {value: 6360000, units: 'meters'},
		topRadius: {value: 6420000, units: 'meters'},
		observerHeight: {value: 0, units: 'meters'},
		observerUpDirection,
		cacheAltitudeBinCount: 48,
		cacheBoundaryAltitude: {value: boundaryAltitudeMeters, units: 'meters'},
		sourceTransmittanceIntervalCount: 20,
	});
	const basePositionDomain = base.domains.positions;
	const positionDomain = Object.assign(Object.create(Object.getPrototypeOf(basePositionDomain)), basePositionDomain, {
		id: `${basePositionDomain.id}-boundary-${boundaryAltitudeMeters}m`,
		boundaryAltitude: {value: boundaryAltitudeMeters, units: 'meters'},
		nodes: basePositionDomain.nodes.map((node, index) =>
			index === 0
				? {
						...node,
						coordinate: {value: boundaryAltitudeMeters, units: 'meters'},
						role: 'minimum-in-atmosphere-altitude',
					}
				: node,
		),
	});
	const models = {
		...base.models,
		geometry,
		groundBoundary:
			groundVariant === 'production'
				? base.models.groundBoundary
				: new UniformLambertianGroundBoundary({
						id: 'frame-parity-cpu-black-ground',
						albedo: new SpectralPacket({
							basis: base.models.groundBoundary.albedo.basis,
							quantity: SPECTRAL_QUANTITIES.REFLECTANCE,
							units: SPECTRAL_UNITS.DIMENSIONLESS,
							values: base.models.groundBoundary.albedo.values.map(() => 0),
							provenanceIdentity: 'algorithm32-frame-parity:cpu-black-ground',
						}),
					}),
		sourcePlacement: {
			...base.models.sourcePlacement,
			placement: {kind: 'distant-direction', directionToLight},
		},
	};
	return {
		...base,
		id: `${base.id}-${frame}`,
		contentHash: CanonicalValueHash.sha256Value({
			base: base.contentHash,
			frame,
			directionToLight,
			boundaryAltitudeMeters,
			maximumScatteringOrder,
			groundVariant,
		}),
		domains: {...base.domains, positions: positionDomain},
		models,
	};
}

function createViewDirection(gridX, gridY, frame) {
	const direction = getSampleDirection(gridX, gridY);
	if (frame === 'retained-z-up') return retainedDirection(direction.zenithDegrees, direction.azimuthDegrees);
	const current = currentDirection(direction.zenithDegrees, direction.azimuthDegrees);
	return frame === 'current-x-up' ? current : rotateZ90(current);
}

function loadRetainedRows(conditionTimes) {
	const [header, ...lines] = readFileSync(RETAINED_TABLE, 'utf8').trim().split(/\r?\n/u);
	const columns = header.split('\t');
	const timeIndex = columns.indexOf('time');
	return new Map(
		lines
			.map((line) => line.split('\t'))
			.filter((values) => conditionTimes.includes(values[timeIndex]))
			.map((values) => [`${values[1]}:${values[2]}:${values[3]}`, values.slice(4).map(Number)]),
	);
}

function compareRows(rows, retainedRows) {
	let squared = 0;
	let signed = 0;
	let maximumAbsolute = -1;
	let maximumLocation = null;
	let count = 0;
	for (const row of rows) {
		const retained = retainedRows.get(`${row.time}:${row.gridX}:${row.gridY}`);
		if (!retained) throw new Error(`Missing retained row ${row.time}:${row.gridX}:${row.gridY}.`);
		for (let channelIndex = 0; channelIndex < row.values.length; channelIndex += 1) {
			const difference = row.values[channelIndex] - retained[channelIndex];
			const absolute = Math.abs(difference);
			squared += difference * difference;
			signed += difference;
			count += 1;
			if (absolute > maximumAbsolute) {
				maximumAbsolute = absolute;
				maximumLocation = {time: row.time, gridX: row.gridX, gridY: row.gridY, channelIndex, difference};
			}
		}
	}
	return {
		count,
		absoluteRms: Math.sqrt(squared / count),
		signedMean: signed / count,
		maximumAbsolute,
		maximumLocation,
	};
}

async function main() {
	const options = parseArguments(process.argv.slice(2));
	mkdirSync(options.output, {recursive: true});
	const progressPath = resolve(options.output, 'progress.log');
	const record = (message) => {
		const line = `${new Date().toISOString()} ${message}`;
		appendFileSync(progressPath, `${line}\n`, 'utf8');
		process.stderr.write(`${line}\n`);
	};
	writeFileSync(progressPath, '', 'utf8');
	const dataset = loadKiderDataset();
	const rows = [];
	for (const time of options.conditions) {
		const condition = dataset.conditions.find((candidate) => candidate.time === time);
		if (!condition) throw new Error(`Unknown B1 condition ${time}.`);
		record(`${time} profile construction started`);
		const profile = createFrameProfile(
			condition,
			options.frame,
			options.boundaryAltitudeMeters,
			options.order,
			options.ground,
		);
		const algorithm = new Algorithm32({profile});
		const model = new SharedModel({version: 1, profile});
		const startedAt = performance.now();
		const buildResult = profile.models.lightSource.buildCpuScatteringCache({
			model,
			onProgress(event) {
				record(`${time} ${event.phase} J${event.order} ${event.completed}/${event.total}`);
			},
		});
		const cache = new DistantSunCpuCache(buildResult);
		record(`${time} cache complete in ${(performance.now() - startedAt).toFixed(1)} ms`);
		for (let gridX = 0; gridX < 9; gridX += 1) {
			for (let gridY = 0; gridY < 9; gridY += 1) {
				const result = algorithm.evaluate({
					viewRay: {direction: createViewDirection(gridX, gridY, options.frame)},
					scatteringCache: cache,
				});
				rows.push({time, gridX, gridY, values: [...result.pathRadiance.values]});
			}
		}
		cache.dispose();
		algorithm.dispose();
		record(`${time} evaluation complete`);
	}
	const comparison = compareRows(rows, loadRetainedRows(options.conditions));
	writeFileSync(
		resolve(options.output, 'result.json'),
		`${JSON.stringify(
			{
				conditions: options.conditions,
				frame: options.frame,
				order: options.order,
				ground: options.ground,
				boundaryAltitudeMeters: options.boundaryAltitudeMeters,
				comparison,
			},
			null,
			2,
		)}\n`,
	);
	writeFileSync(resolve(options.output, 'values.json'), `${JSON.stringify(rows)}\n`);
	record(`complete RMS=${comparison.absoluteRms} max=${comparison.maximumAbsolute}`);
}

await main();
