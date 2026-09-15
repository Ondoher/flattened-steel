import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {outputRelative, readRepository, resolveRepository, sha256, verifyRun} from '../../io/files.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {angularFrameCase} from './execute.mjs';

export const angularFramePackageId = 'angular-frame-morning-v1';
export const angularFramePlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-frame-plan.md';
export const angularFramePackageBytes = 16 * 1024 ** 2;
export const angularFramePackageMilliseconds = 60 * 60 * 1000;

/** @param {readonly SkyVolumeJ2Node[]} nodes @param {readonly SkyAngularFrameBatchRecord[]} batches
 * @param {number} expectedCount @param {boolean} partialCountsUnavailable @returns {SkyAngularFrameCosts}
 */
export function angularFrameCosts(nodes, batches, expectedCount, partialCountsUnavailable) {
	assert.ok(Number.isSafeInteger(expectedCount) && expectedCount >= 0);
	for (const n of nodes)
		assert.ok(
			[n.elapsedMilliseconds, n.mediumEvaluations, n.outerEvaluations].every((x) => Number.isFinite(x) && x >= 0),
		);
	return {
		expectedCount,
		retainedNodeCount: nodes.length,
		aggregateIncidentMilliseconds: nodes.reduce((s, n) => s + n.elapsedMilliseconds, 0),
		slowestIncidentMilliseconds: nodes.reduce((s, n) => Math.max(s, n.elapsedMilliseconds), 0),
		mediumEvaluations: nodes.reduce((s, n) => s + n.mediumEvaluations, 0),
		outerEvaluations: nodes.reduce((s, n) => s + n.outerEvaluations, 0),
		compressedNodeBytes: batches.reduce((s, b) => s + b.artifact.byteLength, 0),
		partialCountsUnavailable,
	};
}

/** Authenticate every retained completed batch; this performs no radiance integration.
 * @param {SkyAngularFrameRunEntry} entry @returns {SkyVolumeJ2Node[]}
 */
export function readAngularFrameNodes(entry) {
	assert.ok(entry.document);
	/** @type {SkyVolumeJ2Node[]} */ const nodes = [];
	for (const batch of entry.document.nodeBatches) {
		assert.equal(batch.firstOffset, nodes.length);
		assert.ok(Number.isSafeInteger(batch.count) && batch.count > 0 && batch.count <= 256);
		assert.ok(batch.artifact.path.startsWith(entry.run + '/nodes-'));
		const retained = entry.terminal.artifacts.filter((a) => a.path === batch.artifact.path);
		assert.equal(retained.length, 1);
		assert.deepEqual(
			{path: retained[0].path, byteLength: retained[0].byteLength, sha256: retained[0].sha256},
			batch.artifact,
		);
		assert.ok(
			Number.isSafeInteger(batch.uncompressedByteLength) &&
				batch.uncompressedByteLength > 0 &&
				batch.uncompressedByteLength <= 4 * 1024 ** 2,
		);
		const bytes = gunzipSync(readRepository(batch.artifact.path, batch.artifact), {
			maxOutputLength: batch.uncompressedByteLength,
		});
		assert.equal(bytes.length, batch.uncompressedByteLength);
		assert.equal(sha256(bytes), batch.uncompressedSha256);
		const decoded = /** @type {SkyVolumeJ2Node[]} */ (JSON.parse(bytes.toString()));
		assert.ok(Array.isArray(decoded));
		assert.equal(decoded.length, batch.count);
		for (const n of decoded) {
			assert.equal(n.targetId, entry.document.target.id);
			assert.ok(Number.isSafeInteger(n.index) && n.index >= 0);
			assert.ok(n.mirrorOf === null || n.mirrorOf === n.index);
			assert.ok(n.direction.length === 3 && n.direction.every(Number.isFinite));
			assert.deepEqual(
				n.channels.map((c) => c.channel),
				[0, 8],
			);
		}
		nodes.push(...decoded);
	}
	assert.equal(nodes.length, entry.document.retainedNodeCount);
	assert.deepEqual(
		angularFrameCosts(
			nodes,
			entry.document.nodeBatches,
			entry.document.expectedCount,
			entry.document.partialCountsUnavailable,
		),
		entry.document.costs,
	);
	return nodes;
}

/** Closed package inventory. Failed/assessment records contribute usage even when no
 * reference.json exists; accepted incomplete diagnostics remain explicit.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularFrameRunEntry[]}
 */
export function readAngularFrameRuns(registration) {
	const start = Number(registration.run.split('/').at(-1).slice(0, 5));
	/** @type {SkyAngularFrameRunEntry[]} */ const entries = [];
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = outputRelative + '/runs/' + name,
			excluded = accountInvalidEvidence(run, registration.run);
		const seal = excluded?.seal ?? verifyRun(run);
		const terminal = /** @type {SkyAngularFrameTerminal} */ (
			JSON.parse(readRepository(seal.path, seal).toString())
		);
		const params = terminal.recipe.parameters;
		if (params.packageId !== angularFramePackageId) continue;
		assert.equal(excluded, null);
		assert.equal(params.continuationRegistration, registration.run);
		assert.equal(params.jobKind, 'cpu');
		assert.equal(params.scope, 'component');
		assert.equal(params.phase, 'C5');
		assert.ok(
			Number.isFinite(terminal.result.jobElapsedMilliseconds) && terminal.result.jobElapsedMilliseconds >= 0,
		);
		const retainedBytes = seal.byteLength + terminal.artifacts.reduce((s, a) => s + a.byteLength, 0);
		assert.ok(Number.isSafeInteger(retainedBytes) && retainedBytes > 0);
		const refs = terminal.artifacts.filter((a) => a.path === run + '/reference.json');
		assert.ok(refs.length <= 1);
		if (!refs.length) {
			entries.push({run, seal, terminal, retainedBytes});
			continue;
		}
		const id = refs[0],
			document = /** @type {SkyAngularFrameDocument} */ (JSON.parse(readRepository(id.path, id).toString()));
		assert.equal(document.schemaId, 'sky-angular-frame-stage-v1');
		assert.equal(document.packageId, angularFramePackageId);
		assert.deepEqual(document.registration, registration.seal);
		assert.equal(document.stage, params.stage);
		assert.deepEqual(document.candidate, angularFrameCase(document.stage));
		assert.equal(document.plan.path, angularFramePlanPath);
		readRepository(document.plan.path, document.plan);
		assert.ok(
			terminal.recipe.parents.some(
				(p) =>
					p.path === document.plan.path &&
					p.sha256 === document.plan.sha256 &&
					p.byteLength === document.plan.byteLength,
			),
		);
		assert.equal(document.target.id, 'p-0930-5-7:h1000');
		assert.deepEqual(document.channels, [0, 8]);
		assert.equal(document.expectedCount, document.candidate.fullDirectionCount / 2 + 2);
		if (document.matrixComplete) {
			assert.equal(document.retainedNodeCount, document.expectedCount);
			assert.equal(document.partialCountsUnavailable, false);
			assert.ok(document.rows && document.rows.length === 2 && document.rows.every((r) => r.combined.resolved));
			assert.ok(document.checks.length > 0 && document.checks.every((c) => c.state === 'passed'));
		}
		const entry = {run, seal, terminal, retainedBytes, document};
		readAngularFrameNodes(entry);
		entries.push(entry);
	}
	return entries;
}

/** @param {readonly {retainedBytes:number,terminal:{result:{jobElapsedMilliseconds:number}}}[]} entries @returns {SkyAngularFramePackageUsage} */
export function angularFramePackageUsage(entries) {
	assert.ok(
		entries.every(
			(e) =>
				Number.isSafeInteger(e.retainedBytes) &&
				e.retainedBytes > 0 &&
				Number.isFinite(e.terminal.result.jobElapsedMilliseconds) &&
				e.terminal.result.jobElapsedMilliseconds >= 0,
		),
	);
	const retainedBytes = entries.reduce((s, e) => s + e.retainedBytes, 0),
		elapsedMilliseconds = entries.reduce((s, e) => s + e.terminal.result.jobElapsedMilliseconds, 0);
	assert.ok(retainedBytes <= angularFramePackageBytes && elapsedMilliseconds <= angularFramePackageMilliseconds);
	return {retainedBytes, elapsedMilliseconds, runCount: entries.length};
}

/** Measured factor-two forecast, with declared four-worker concurrency and90s overhead.
 * @param {SkyAngularFrameDocument} pilot @param {number} expectedCount @param {number} overheadBytes
 * @returns {SkyAngularFrameForecast}
 */
export function angularFrameReferenceForecast(pilot, expectedCount, overheadBytes) {
	assert.equal(pilot.stage, 'pilot');
	assert.ok(pilot.matrixComplete && !pilot.partialCountsUnavailable);
	const cost = pilot.costs;
	assert.equal(cost.retainedNodeCount, 194);
	assert.equal(cost.expectedCount, 194);
	assert.ok(
		cost.compressedNodeBytes > 0 && cost.aggregateIncidentMilliseconds > 0 && cost.slowestIncidentMilliseconds > 0,
	);
	assert.ok(
		Number.isSafeInteger(expectedCount) &&
			expectedCount > 0 &&
			Number.isSafeInteger(overheadBytes) &&
			overheadBytes >= 1024 ** 2,
	);
	const aggregateRateMilliseconds = cost.aggregateIncidentMilliseconds / cost.retainedNodeCount;
	const parallelWorkMilliseconds = (2 * aggregateRateMilliseconds * expectedCount) / 4;
	const nodeBytes = Math.ceil(((2 * cost.compressedNodeBytes) / cost.retainedNodeCount) * expectedCount);
	return {
		expectedCount,
		overheadBytes,
		nodeBytes,
		totalBytes: overheadBytes + nodeBytes,
		aggregateRateMilliseconds,
		slowestIncidentMilliseconds: cost.slowestIncidentMilliseconds,
		parallelWorkMilliseconds,
		startupAndFinalizationMilliseconds: 90000,
		jobMilliseconds: Math.ceil(parallelWorkMilliseconds + 90000),
	};
}

/** Focused manufactured forecast/accounting checks; no workers or immutable output.
 * @returns {{checks:number,scope:string}}
 */
export function angularFrameRunnerProof() {
	let checks = 0;
	const candidate = angularFrameCase('pilot');
	const costs = angularFrameCosts([], [], 194, true);
	assert.equal(costs.partialCountsUnavailable, true);
	checks++;
	assert.equal(costs.retainedNodeCount, 0);
	checks++;
	/** @type {SkyAngularFrameDocument} */ const pilot = {
		schemaId: 'sky-angular-frame-stage-v1',
		packageId: angularFramePackageId,
		registration: {path: 'fixture', byteLength: 1, sha256: 'a'.repeat(64)},
		plan: {path: angularFramePlanPath, byteLength: 1, sha256: 'a'.repeat(64)},
		stage: 'pilot',
		candidate,
		target: {
			id: 'fixture',
			probeId: 'fixture',
			heightMeters: 1000,
			distanceMeters: 1,
			surfaceOrigin: [0, 0, 1],
			origin: [0, 0, 1001],
			direction: [0, 0, 1],
		},
		channels: [0, 8],
		matrixComplete: true,
		expectedCount: 194,
		retainedNodeCount: 194,
		completedBatches: 1,
		partialCountsUnavailable: false,
		rows: [],
		checks: [],
		nodeBatches: [],
		costs: {
			...costs,
			partialCountsUnavailable: false,
			retainedNodeCount: 194,
			compressedNodeBytes: 19400,
			aggregateIncidentMilliseconds: 19400,
			slowestIncidentMilliseconds: 1000,
		},
		failure: null,
	};
	for (const stage of /** @type {const} */ (['sun16', 'sun32', 'radial32', 'radial64'])) {
		const expected = angularFrameCase(stage).fullDirectionCount / 2 + 2,
			f = angularFrameReferenceForecast(pilot, expected, 1024 ** 2);
		assert.equal(f.nodeBytes, 200 * expected);
		checks++;
		assert.equal(f.parallelWorkMilliseconds, 50 * expected);
		checks++;
		assert.equal(f.jobMilliseconds, 50 * expected + 90000);
		checks++;
		assert.equal(f.slowestIncidentMilliseconds, 1000);
		checks++;
	}
	for (const change of [
		{matrixComplete: false},
		{partialCountsUnavailable: true},
		{costs: {...pilot.costs, compressedNodeBytes: 0}},
		{costs: {...pilot.costs, retainedNodeCount: 193}},
	]) {
		assert.throws(() => angularFrameReferenceForecast({...pilot, ...change}, 770, 1024 ** 2));
		checks++;
	}
	assert.deepEqual(angularFramePackageUsage([]), {retainedBytes: 0, elapsedMilliseconds: 0, runCount: 0});
	checks++;
	const mixed = [
		{retainedBytes: 100, terminal: {state: 'failed', result: {jobElapsedMilliseconds: 30}}},
		{retainedBytes: 200, terminal: {state: 'accepted', result: {jobElapsedMilliseconds: 40}}},
	];
	assert.deepEqual(angularFramePackageUsage(mixed), {retainedBytes: 300, elapsedMilliseconds: 70, runCount: 2});
	checks++;
	assert.throws(() =>
		angularFramePackageUsage([
			{retainedBytes: angularFramePackageBytes + 1, terminal: {result: {jobElapsedMilliseconds: 1}}},
		]),
	);
	checks++;
	assert.throws(() =>
		angularFramePackageUsage([
			{retainedBytes: 1, terminal: {result: {jobElapsedMilliseconds: angularFramePackageMilliseconds + 1}}},
		]),
	);
	checks++;
	assert.throws(() =>
		angularFramePackageUsage([{retainedBytes: -1, terminal: {result: {jobElapsedMilliseconds: 1}}}]),
	);
	checks++;
	return {
		checks,
		scope: 'Explicit work counts, incomplete work preservation and rejected incomplete pilot forecasts; factor-two compressed-byte and aggregate/four-worker time forecasting with separate slowest-task diagnostics. No workers or evidence.',
	};
}
