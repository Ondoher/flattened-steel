import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

import {compareSpectralTables} from './compare-production-backends.js';

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
