import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

import {CAPTURE_TIMES} from './benchmark.js';
import {ProductionRun} from './ProductionRun.js';

function sha256(text) {
	return createHash('sha256').update(text).digest('hex');
}

function createCompleteRun(directory) {
	const outputs = [];
	for (const order of ProductionRun.REQUIRED_ORDERS) {
		const table = `j${order}.tsv`;
		const provenance = `j${order}-provenance.json`;
		const cube = `j${order}-cube.json`;
		const tableText = `table-${order}\n`;
		const provenanceText = `${JSON.stringify({
			runId: 'test-run',
			backend: 'cpu-reference-binary64',
			order,
			rowCount: CAPTURE_TIMES.length * 81,
			completeCanonicalBoundary: true,
			table: {name: table, sha256: sha256(tableText)},
		})}\n`;
		const cubeText = `{"order":${order}}\n`;
		writeFileSync(join(directory, table), tableText);
		writeFileSync(join(directory, provenance), provenanceText);
		writeFileSync(join(directory, cube), cubeText);
		const output = {
			order,
			table,
			tableSha256: sha256(tableText),
			provenance,
			provenanceSha256: sha256(provenanceText),
			cube,
			cubeSha256: sha256(cubeText),
		};
		if (order === 4) {
			const defaultProvenanceText = '{"profile":"default"}\n';
			output.defaultProvenance = 'default-provenance.json';
			output.defaultProvenanceSha256 = sha256(defaultProvenanceText);
			writeFileSync(join(directory, output.defaultProvenance), defaultProvenanceText);
		}
		outputs.push(output);
	}
	writeFileSync(
		join(directory, 'manifest.json'),
		JSON.stringify({
			schema: ProductionRun.MANIFEST_SCHEMA,
			runId: 'test-run',
			status: 'COMPLETE',
			backend: 'cpu-reference-binary64',
			conditions: CAPTURE_TIMES,
			orders: ProductionRun.REQUIRED_ORDERS,
			outputs,
		}),
	);
}

test('resolves the Bruneton J4 scorer input from one complete production-run manifest', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		const run = ProductionRun.load(directory);
		const paths = ProductionRun.candidatePaths(run);
		assert.match(paths.proposedPath, /j4\.tsv$/);
		assert.match(paths.proposedProvenancePath, /default-provenance\.json$/);
		assert.match(paths.proposedCubePath, /j4-cube\.json$/);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});

test('rejects a production-run file changed after manifest finalization', () => {
	const directory = mkdtempSync(join(tmpdir(), 'algorithm32-production-run-'));
	try {
		createCompleteRun(directory);
		writeFileSync(join(directory, 'j4.tsv'), 'changed\n');
		assert.throws(() => ProductionRun.load(directory), /SHA-256/);
	} finally {
		rmSync(directory, {recursive: true, force: true});
	}
});
