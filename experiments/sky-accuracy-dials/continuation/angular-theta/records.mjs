import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {outputRelative, readRepository, resolveRepository, sha256, verifyRun} from '../../io/files.mjs';
import {accountInvalidEvidence} from '../invalid-evidence.mjs';
import {thetaCase} from './execute.mjs';

export const thetaPackageId = 'angular-theta-attribution-v1';
export const thetaPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-theta-plan.md';
export const thetaPackageBytes = 8 * 1024 ** 2;
export const thetaPackageMilliseconds = 20 * 60 * 1000;

// Task counters keep the existing ordered-batch contract.
export {angularFrameCosts as thetaCosts} from '../angular-frame/records.mjs';
import {angularFrameCosts as thetaCosts} from '../angular-frame/records.mjs';

/** A failed attempt consumes its stage; any assessment terminal closes this package.
 * @param {readonly SkyAngularThetaStageRecord[]} entries @param {SkyAngularThetaCommand} stage
 * @returns {void}
 */
export function assertThetaStageAvailable(entries, stage) {
	assert.ok(['pilot', 'fine', 'assess'].includes(stage));
	assert.ok(
		!entries.some((e) => e.terminal.recipe.parameters.stage === stage),
		'A package stage may execute only once, including failed attempts.',
	);
	assert.ok(
		!entries.some((e) => e.terminal.recipe.parameters.stage === 'assess'),
		'The final assessment closes this package.',
	);
}

/** Failed or incomplete numerical documents never supply assessment values.
 * @param {readonly SkyAngularThetaAssessmentEntry[]} entries @param {SkyAngularThetaStage} stage
 * @returns {SkyAngularThetaDocument|null}
 */
export function thetaAdmittedDocument(entries, stage) {
	const matches = entries.filter((e) => e.terminal.recipe.parameters.stage === stage);
	assert.ok(matches.length <= 1);
	const entry = matches[0],
		document = entry?.document;
	return entry?.terminal.state === 'accepted' &&
		document?.matrixComplete &&
		!document.partialCountsUnavailable &&
		document.failure === null
		? document
		: null;
}

/** Authenticate every retained completed batch; this performs no radiance integration.
 * @param {SkyAngularThetaRunEntry} entry @returns {SkyVolumeJ2Node[]}
 */
export function readAngularThetaNodes(entry) {
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
		thetaCosts(
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
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularThetaRunEntry[]}
 */
export function readAngularThetaRuns(registration) {
	const start = Number(registration.run.split('/').at(-1).slice(0, 5));
	/** @type {SkyAngularThetaRunEntry[]} */ const entries = [];
	for (const name of readdirSync(resolveRepository(outputRelative + '/runs')).sort()) {
		if (Number(name.slice(0, 5)) <= start) continue;
		const run = outputRelative + '/runs/' + name,
			excluded = accountInvalidEvidence(run, registration.run);
		const seal = excluded?.seal ?? verifyRun(run);
		const terminal = /** @type {SkyAngularThetaTerminal} */ (
			JSON.parse(readRepository(seal.path, seal).toString())
		);
		const params = terminal.recipe.parameters;
		if (params.packageId !== thetaPackageId) continue;
		assert.ok(['pilot', 'fine', 'assess'].includes(params.stage));
		assert.equal(params.caseId, 'angular-theta-' + params.stage);
		assert.equal(params.extensionId, 'compensation-attribution-v1');
		assert.equal(params.extensionStage, params.caseId);
		assertThetaStageAvailable(entries, params.stage);
		const plans = terminal.recipe.parents.filter((p) => p.path === thetaPlanPath);
		assert.equal(plans.length, 1);
		readRepository(plans[0].path, plans[0]);
		assert.ok(Array.isArray(params.sourceIdentities) && params.sourceIdentities.length > 0);

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
		assert.notEqual(params.stage, 'assess');
		const id = refs[0],
			document = /** @type {SkyAngularThetaDocument} */ (JSON.parse(readRepository(id.path, id).toString()));
		assert.equal(document.schemaId, 'sky-angular-theta-stage-v1');
		assert.equal(document.packageId, thetaPackageId);
		assert.deepEqual(document.registration, registration.seal);
		assert.equal(document.stage, params.stage);
		assert.deepEqual(document.candidate, thetaCase(document.stage));
		assert.deepEqual(document.candidate, params.candidate);
		assert.equal(document.plan.path, thetaPlanPath);
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
		if (terminal.state === 'accepted') assert.equal(document.failure, null);
		if (document.matrixComplete) {
			assert.equal(document.retainedNodeCount, document.expectedCount);
			assert.equal(document.partialCountsUnavailable, false);
			assert.ok(document.rows && document.rows.length === 2 && document.rows.every((r) => r.combined.resolved));
			assert.ok(document.checks.length > 0 && document.checks.every((c) => c.state === 'passed'));
		}
		const entry = {run, seal, terminal, retainedBytes, document};
		readAngularThetaNodes(entry);
		entries.push(entry);
	}
	return entries;
}

/** @param {readonly SkyAngularThetaUsageEntry[]} entries @returns {SkyAngularFramePackageUsage} */
export function thetaPackageUsage(entries) {
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
	assert.ok(retainedBytes <= thetaPackageBytes && elapsedMilliseconds <= thetaPackageMilliseconds);
	return {retainedBytes, elapsedMilliseconds, runCount: entries.length};
}

/** Measured factor-two forecast, with declared four-worker concurrency and90s overhead.
 * @param {SkyAngularThetaDocument} pilot @param {number} expectedCount @param {number} overheadBytes
 * @returns {SkyAngularFrameForecast}
 */
export function thetaFineForecast(pilot, expectedCount, overheadBytes) {
	assert.equal(pilot.stage, 'pilot');
	assert.ok(pilot.matrixComplete && !pilot.partialCountsUnavailable);
	const cost = pilot.costs;
	assert.equal(cost.retainedNodeCount, 770);
	assert.equal(cost.expectedCount, 770);
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
 * @returns {SkyAngularThetaRunnerProof}
 */
export function thetaRunnerProof() {
	let checks = 0;
	const candidate = thetaCase('pilot');
	const costs = thetaCosts([], [], 770, true);
	assert.equal(costs.partialCountsUnavailable, true);
	checks++;
	assert.equal(costs.retainedNodeCount, 0);
	checks++;
	/** @type {SkyAngularThetaDocument} */ const pilot = {
		schemaId: 'sky-angular-theta-stage-v1',
		packageId: thetaPackageId,
		registration: {path: 'fixture', byteLength: 1, sha256: 'a'.repeat(64)},
		plan: {path: thetaPlanPath, byteLength: 1, sha256: 'a'.repeat(64)},
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
		expectedCount: 770,
		retainedNodeCount: 770,
		completedBatches: 1,
		partialCountsUnavailable: false,
		rows: [],
		checks: [],
		nodeBatches: [],
		costs: {
			...costs,
			partialCountsUnavailable: false,
			retainedNodeCount: 770,
			compressedNodeBytes: 77000,
			aggregateIncidentMilliseconds: 77000,
			slowestIncidentMilliseconds: 1000,
		},
		failure: null,
	};
	for (const stage of /** @type {const} */ (['fine'])) {
		const expected = thetaCase(stage).fullDirectionCount / 2 + 2,
			f = thetaFineForecast(pilot, expected, 1024 ** 2);
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
		{costs: {...pilot.costs, retainedNodeCount: 769}},
	]) {
		assert.throws(() => thetaFineForecast({...pilot, ...change}, 770, 1024 ** 2));
		checks++;
	}
	assert.deepEqual(thetaPackageUsage([]), {retainedBytes: 0, elapsedMilliseconds: 0, runCount: 0});
	checks++;
	const mixed = [
		{retainedBytes: 100, terminal: {state: 'failed', result: {jobElapsedMilliseconds: 30}}},
		{retainedBytes: 200, terminal: {state: 'accepted', result: {jobElapsedMilliseconds: 40}}},
	];
	assert.deepEqual(thetaPackageUsage(mixed), {retainedBytes: 300, elapsedMilliseconds: 70, runCount: 2});
	checks++;
	assert.throws(() =>
		thetaPackageUsage([{retainedBytes: thetaPackageBytes + 1, terminal: {result: {jobElapsedMilliseconds: 1}}}]),
	);
	checks++;
	assert.throws(() =>
		thetaPackageUsage([
			{retainedBytes: 1, terminal: {result: {jobElapsedMilliseconds: thetaPackageMilliseconds + 1}}},
		]),
	);
	checks++;
	assert.throws(() => thetaPackageUsage([{retainedBytes: -1, terminal: {result: {jobElapsedMilliseconds: 1}}}]));
	checks++;
	/** @type {SkyAngularThetaStageRecord[]} */ const failedStages = [
		{terminal: {recipe: {parameters: {stage: 'pilot'}}}},
	];
	assert.throws(() => assertThetaStageAvailable(failedStages, 'pilot'));
	checks++;
	assert.doesNotThrow(() => assertThetaStageAvailable(failedStages, 'assess'));
	checks++;
	assert.throws(() => assertThetaStageAvailable([{terminal: {recipe: {parameters: {stage: 'assess'}}}}], 'fine'));
	checks++;
	/** @type {SkyAngularThetaAssessmentEntry} */ const completeEntry = {
		terminal: {state: 'accepted', recipe: {parameters: {stage: 'pilot'}}},
		document: pilot,
	};
	assert.equal(thetaAdmittedDocument([completeEntry], 'pilot'), pilot);
	checks++;
	assert.equal(
		thetaAdmittedDocument([{...completeEntry, terminal: {...completeEntry.terminal, state: 'failed'}}], 'pilot'),
		null,
	);
	checks++;
	assert.equal(
		thetaAdmittedDocument([{...completeEntry, document: {...pilot, matrixComplete: false}}], 'pilot'),
		null,
	);
	checks++;
	assert.equal(
		thetaAdmittedDocument([{...completeEntry, document: {...pilot, partialCountsUnavailable: true}}], 'pilot'),
		null,
	);
	checks++;
	assert.equal(thetaAdmittedDocument([], 'fine'), null);
	checks++;
	return {
		checks,
		scope: 'Explicit work counts, incomplete work preservation and rejected incomplete pilot forecasts; factor-two compressed-byte and aggregate/four-worker time forecasting with separate slowest-task diagnostics. Failed stages stay single-use and charged; assessment closes the package and excludes failed/incomplete numerical values. No workers or evidence.',
	};
}
