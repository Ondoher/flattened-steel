import {createHash} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {loadKiderDataset} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {
	compareSpectralTables,
	PRODUCTION_GPU_PARITY_LIMITS,
} from '../../experiments/b1-directional-sky-radiance/compare-production-backends.js';
import {ProductionGpuHost} from '../../experiments/b1-directional-sky-radiance/ProductionGpuHost.js';

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DIAGNOSTIC_OUTPUT_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial');

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

function requireOutputDirectory(requestedPath) {
	const outputDirectory = path.resolve(requestedPath);
	if (!outputDirectory.startsWith(`${DIAGNOSTIC_OUTPUT_ROOT}${path.sep}`)) {
		throw new Error('Single-asset parity diagnostics must remain below tmp/extraterrestrial.');
	}
	mkdirSync(outputDirectory, {recursive: false});
	return outputDirectory;
}

function selectCpuCondition(cpuTablePath, localTime) {
	const lines = readFileSync(cpuTablePath, 'utf8').trim().split(/\r?\n/u);
	const selected = [lines[0], ...lines.slice(1).filter((line) => line.split('\t', 3)[1] === localTime)];
	if (selected.length !== 82) throw new Error(`CPU reference does not contain exactly 81 ${localTime} rows.`);
	return `${selected.join('\n')}\n`;
}

function createGpuTable(localTime, spectra) {
	if (!Array.isArray(spectra) || spectra.length !== 81) {
		throw new Error('Single-asset GPU diagnostic did not return 81 spectra.');
	}
	const lines = [
		['model', 'time', 'grid_x', 'grid_y', ...Array.from({length: 40}, (_, index) => `lambda_${index}`)].join('\t'),
	];
	for (let gridX = 0; gridX < 9; gridX += 1) {
		for (let gridY = 0; gridY < 9; gridY += 1) {
			const values = spectra[gridY * 9 + gridX];
			if (values?.length !== 40 || values.some((value) => !Number.isFinite(value) || value < 0)) {
				throw new Error(`Invalid GPU spectrum at ${localTime}/${gridX}/${gridY}.`);
			}
			lines.push(
				['proposed', localTime, gridX, gridY, ...values.map((value) => value.toPrecision(17))].join('\t'),
			);
		}
	}
	return `${lines.join('\n')}\n`;
}

export async function runSingleAssetParityDiagnostic({
	assetDirectory,
	productionRevision,
	cpuTablePath,
	outputDirectory: requestedOutputDirectory,
	localTime = '09:30',
}) {
	const condition = loadKiderDataset().conditions.find((candidate) => candidate.time === localTime);
	if (!condition) throw new Error(`Unknown canonical B1 condition: ${localTime}.`);
	const outputDirectory = requireOutputDirectory(requestedOutputDirectory);
	const diagnosticCondition = {
		id: `b1-${localTime}`,
		localTime,
		fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
	};
	const host = new ProductionGpuHost({
		diagnosticAssetDirectory: path.resolve(assetDirectory),
		diagnosticCondition,
		productionRevision,
	});
	let result;
	try {
		await host.open();
		result = await host.generateCondition({
			time: localTime,
			fittedAzimuthDegrees: condition.sun.fittedAzimuthDegrees,
			maximumScatteringOrder: 4,
		});
	} finally {
		await host.close();
	}

	const cpuText = selectCpuCondition(path.resolve(cpuTablePath), localTime);
	const gpuText = createGpuTable(localTime, result.values);
	const cpuName = `cpu-reference-${localTime.replace(':', '')}.tsv`;
	const gpuName = `gpu-diagnostic-${localTime.replace(':', '')}.tsv`;
	const cpuPath = path.join(outputDirectory, cpuName);
	const gpuPath = path.join(outputDirectory, gpuName);
	writeFileSync(cpuPath, cpuText, {encoding: 'utf8', flag: 'wx'});
	writeFileSync(gpuPath, gpuText, {encoding: 'utf8', flag: 'wx'});
	const comparison = compareSpectralTables(cpuPath, gpuPath);
	const report = {
		schema: 'algorithm32-b1-single-asset-parity-diagnostic-v1',
		condition: localTime,
		order: 4,
		gate: {
			accepted:
				comparison.rmse <= PRODUCTION_GPU_PARITY_LIMITS.rmse &&
				comparison.maximumAbsoluteDifference <= PRODUCTION_GPU_PARITY_LIMITS.maximumAbsoluteDifference,
			limits: PRODUCTION_GPU_PARITY_LIMITS,
		},
		comparison,
		derivation: {
			productionRevision,
			assetSetIdentity: result.assetSetIdentity,
			assetIdentity: result.assetIdentity,
			cpuTable: {name: cpuName, sha256: sha256(cpuText)},
			gpuTable: {name: gpuName, sha256: sha256(gpuText)},
		},
		gpu: {
			capabilities: result.capabilities,
			shaderDiagnostics: result.shaderDiagnostics,
			shaderSourceMetrics: result.shaderSourceMetrics,
			executionTimings: result.executionTimings,
		},
	};
	const reportText = `${JSON.stringify(report, null, 2)}\n`;
	writeFileSync(path.join(outputDirectory, 'parity-report.json'), reportText, {encoding: 'utf8', flag: 'wx'});
	return report;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
	const [assetDirectory, productionRevision, cpuTablePath, outputDirectory, localTime = '09:30'] =
		process.argv.slice(2);
	if (!assetDirectory || !productionRevision || !cpuTablePath || !outputDirectory) {
		throw new Error(
			'Usage: node run-single-asset-parity-diagnostic.js <asset-directory> <production-revision> <cpu-table> <fresh-output-directory> [local-time]',
		);
	}
	const report = await runSingleAssetParityDiagnostic({
		assetDirectory,
		productionRevision,
		cpuTablePath,
		outputDirectory,
		localTime,
	});
	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
