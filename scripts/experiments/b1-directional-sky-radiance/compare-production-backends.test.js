import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

import {
	assertProductionGpuParity,
	compareSpectralTables,
	PRODUCTION_GPU_PARITY_LIMITS,
} from './compare-production-backends.js';

function table(values) {
	return `model\ttime\tgrid_x\tgrid_y\t${Array.from({length: 40}, (_, index) => `lambda_${index}`).join('\t')}\nproposed\t09:30\t0\t0\t${values.join('\t')}\n`;
}

test('compares finalized CPU and GPU spectra pointwise', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-b1-backend-comparison-'));
	try {
		const cpuPath = join(directory, 'cpu.tsv');
		const gpuPath = join(directory, 'gpu.tsv');
		const cpu = Array.from({length: 40}, (_, index) => index + 1);
		const gpu = cpu.map((value) => value + 0.25);
		writeFileSync(cpuPath, table(cpu));
		writeFileSync(gpuPath, table(gpu));
		const comparison = compareSpectralTables(cpuPath, gpuPath);
		assert.equal(comparison.valueCount, 40);
		assert.equal(comparison.rmse, 0.25);
		assert.equal(comparison.maximumAbsoluteDifference, 0.25);
		assert.equal(comparison.worstSample.row, '09:30/0/0');
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('applies the predeclared R32F parity envelope conjunctively', () => {
	assert.deepEqual(
		assertProductionGpuParity([
			{
				order: 4,
				rmse: PRODUCTION_GPU_PARITY_LIMITS.rmse,
				maximumAbsoluteDifference: PRODUCTION_GPU_PARITY_LIMITS.maximumAbsoluteDifference,
			},
		]),
		{accepted: true, limits: PRODUCTION_GPU_PARITY_LIMITS},
	);
	assert.throws(
		() =>
			assertProductionGpuParity([
				{order: 4, rmse: PRODUCTION_GPU_PARITY_LIMITS.rmse + 1e-12, maximumAbsoluteDifference: 0},
			]),
		/predeclared R32F envelope/u,
	);
	assert.throws(
		() =>
			assertProductionGpuParity([
				{
					order: 4,
					rmse: 0,
					maximumAbsoluteDifference: PRODUCTION_GPU_PARITY_LIMITS.maximumAbsoluteDifference + 1e-12,
				},
			]),
		/predeclared R32F envelope/u,
	);
});

test('rejects negative spectral values before comparison', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-b1-backend-comparison-'));
	try {
		const cpuPath = join(directory, 'cpu.tsv');
		const gpuPath = join(directory, 'gpu.tsv');
		writeFileSync(cpuPath, table(Array(40).fill(0)));
		writeFileSync(gpuPath, table([-1, ...Array(39).fill(0)]));
		assert.throws(() => compareSpectralTables(cpuPath, gpuPath), /Malformed generated B1 row/u);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});
