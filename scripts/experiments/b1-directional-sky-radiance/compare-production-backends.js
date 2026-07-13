import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

import {ProductionRun} from './ProductionRun.js';

/**
 * Called by backend comparison to parse one generated B1 table.
 *
 * @param {string} path - The finalized table path.
 * @returns {Map<string, readonly number[]>} - Spectra keyed by time and grid coordinate.
 */
function readSpectra(path) {
	const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
	const spectra = new Map();
	for (const line of lines.slice(1)) {
		const fields = line.split('\t');
		const key = fields.slice(1, 4).join('/');
		const values = fields.slice(4).map(Number);
		if (fields[0] !== 'proposed' || values.length !== 40 || values.some((value) => !Number.isFinite(value))) {
			throw new Error(`Malformed generated B1 row in ${path}: ${key}.`);
		}
		if (spectra.has(key)) throw new Error(`Duplicate generated B1 row in ${path}: ${key}.`);
		spectra.set(key, values);
	}
	return spectra;
}

/**
 * Call this function to compare two finalized B1 spectral tables pointwise.
 *
 * @param {string} cpuTablePath - The binary64 reference table.
 * @param {string} gpuTablePath - The production GPU table.
 * @returns {{valueCount: number, rmse: number, maximumAbsoluteDifference: number, maximumRelativeDifference: number, worstSample: object}} - The parity metrics.
 */
export function compareSpectralTables(cpuTablePath, gpuTablePath) {
	const cpu = readSpectra(cpuTablePath);
	const gpu = readSpectra(gpuTablePath);
	if (cpu.size !== gpu.size) throw new Error('CPU and GPU B1 tables contain different row counts.');
	let squaredDifferenceSum = 0;
	let valueCount = 0;
	let maximumAbsoluteDifference = -1;
	let maximumRelativeDifference = 0;
	let worstSample = null;
	for (const [key, cpuValues] of cpu) {
		const gpuValues = gpu.get(key);
		if (!gpuValues) throw new Error(`GPU B1 table is missing row ${key}.`);
		for (let channelIndex = 0; channelIndex < 40; channelIndex += 1) {
			const absoluteDifference = Math.abs(cpuValues[channelIndex] - gpuValues[channelIndex]);
			const relativeDifference =
				cpuValues[channelIndex] === 0 ? 0 : absoluteDifference / Math.abs(cpuValues[channelIndex]);
			squaredDifferenceSum += absoluteDifference * absoluteDifference;
			valueCount += 1;
			maximumRelativeDifference = Math.max(maximumRelativeDifference, relativeDifference);
			if (absoluteDifference > maximumAbsoluteDifference) {
				maximumAbsoluteDifference = absoluteDifference;
				worstSample = {
					row: key,
					channelIndex,
					cpu: cpuValues[channelIndex],
					gpu: gpuValues[channelIndex],
					absoluteDifference,
					relativeDifference,
				};
			}
		}
	}
	return {
		valueCount,
		rmse: Math.sqrt(squaredDifferenceSum / valueCount),
		maximumAbsoluteDifference,
		maximumRelativeDifference,
		worstSample,
	};
}

/**
 * Call this function to compare matching orders from one CPU and one GPU production run.
 *
 * @param {string} firstRunPath - One finalized production run.
 * @param {string} secondRunPath - The other finalized production run.
 * @returns {object} - The backend identity and pointwise metrics by order.
 */
export function compareProductionBackends(firstRunPath, secondRunPath) {
	const first = ProductionRun.load(firstRunPath, {requireCanonical: false});
	const second = ProductionRun.load(secondRunPath, {requireCanonical: false});
	const cpu = first.manifest.backend === 'cpu-reference-binary64' ? first : second;
	const gpu = first.manifest.backend === 'gpu-production-shaders-r32f' ? first : second;
	if (
		cpu === gpu ||
		cpu.manifest.backend !== 'cpu-reference-binary64' ||
		gpu.manifest.backend !== 'gpu-production-shaders-r32f'
	) {
		throw new Error('Backend comparison requires exactly one CPU-reference run and one GPU-shader run.');
	}
	if (JSON.stringify(cpu.manifest.conditions) !== JSON.stringify(gpu.manifest.conditions)) {
		throw new Error('CPU and GPU production runs must contain the same ordered conditions.');
	}
	if (JSON.stringify(cpu.manifest.orders) !== JSON.stringify(gpu.manifest.orders)) {
		throw new Error('CPU and GPU production runs must contain the same ordered scattering orders.');
	}
	const comparisons = cpu.manifest.orders.map((order) => {
		const cpuOutput = cpu.outputsByOrder.get(order);
		const gpuOutput = gpu.outputsByOrder.get(order);
		if (!cpuOutput || !gpuOutput) throw new Error(`Both production runs must contain J${order}.`);
		return {order, ...compareSpectralTables(cpuOutput.tablePath, gpuOutput.tablePath)};
	});
	return {
		schema: 'algorithm32-current-production-b1-backend-comparison-v1',
		cpuRunId: cpu.manifest.runId,
		gpuRunId: gpu.manifest.runId,
		conditions: cpu.manifest.conditions,
		orders: cpu.manifest.orders,
		comparisons,
	};
}

const invoked = process.argv[1] && pathToFileURL(process.argv[1]).href;
if (invoked === import.meta.url) {
	try {
		if (process.argv.length !== 4) {
			throw new Error('Usage: node compare-production-backends.js <cpu-or-gpu-run> <other-run>');
		}
		process.stdout.write(
			`${JSON.stringify(compareProductionBackends(process.argv[2], process.argv[3]), null, 2)}\n`,
		);
	} catch (error) {
		console.error(error instanceof Error ? error.stack : error);
		process.exitCode = 1;
	}
}
