import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {checkedAbsolute, createRun, identity, readRepository, sha256, verifyRun} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput} from '../mechanisms/registration.mjs';
import {resourceExtensionSources} from '../resource-extension/read.mjs';
import {readAngularThetaInput} from './read.mjs';
import {thetaCase, thetaState, executeTheta} from './execute.mjs';
import {thetaGeometryProof} from './geometry.mjs';
import {assessTheta, thetaAssessmentProof, thetaAssessmentReport} from './assessment.mjs';
import {
	thetaPackageId,
	thetaPlanPath,
	thetaPackageBytes,
	thetaPackageMilliseconds,
	readAngularThetaRuns,
	thetaPackageUsage,
	thetaFineForecast,
	thetaCosts,
	thetaRunnerProof,
	assertThetaStageAvailable,
	thetaAdmittedDocument,
} from './records.mjs';

/** @param {DialContinuationToolIdentity} expected @returns {Promise<void>} */
async function authenticateNode(expected) {
	assert.equal(checkedAbsolute(process.execPath), expected.path);
	assert.equal(process.version, expected.version);
	const hash = createHash('sha256');
	let bytes = 0;
	for await (const chunk of createReadStream(expected.path)) {
		hash.update(chunk);
		bytes += chunk.length;
	}
	assert.equal(bytes, expected.byteLength);
	assert.equal(hash.digest('hex'), expected.sha256);
}

/** Read-only source/input, measured-forecast and resource admission; no workers or run allocation.
 * @param {SkyAngularThetaCommand} stage @param {string} registrationRun @param {string|null} [pilotRun]
 * @returns {Promise<SkyAngularThetaPreparation>}
 */
export async function prepareAngularTheta(stage, registrationRun, pilotRun = null) {
	assert.ok(['pilot', 'fine', 'assess'].includes(stage));
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const entries = readAngularThetaRuns(registration),
		usage = thetaPackageUsage(entries);
	assertThetaStageAvailable(entries, stage);
	const input = readAngularThetaInput(registration),
		plan = identity(thetaPlanPath),
		planBytes = readRepository(plan.path, plan);
	const snapshot = resourceExtensionSources(
		acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes'),
	);
	const packed = Buffer.from(
		JSON.stringify(snapshot.delta.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
	);
	const sourceBytes = gzipSync(packed, {level: 9});
	const candidate = stage === 'assess' ? null : thetaCase(stage),
		expectedCount = candidate ? candidate.fullDirectionCount / 2 + 2 : 0;
	/** @type {SkyAngularThetaRunEntry|null} */ let pilot = null;
	if (stage === 'pilot') assert.equal(pilotRun, null);
	else {
		assert.ok(pilotRun);
		pilot = entries.find((e) => e.run === pilotRun) ?? null;
		assert.ok(pilot && pilot.terminal.recipe.parameters.stage === 'pilot');
		assert.ok(
			pilot.terminal.recipe.parents.some(
				(id) => id.path === plan.path && id.sha256 === plan.sha256 && id.byteLength === plan.byteLength,
			),
		);
		if (pilot.document) {
			assert.deepEqual(pilot.document.plan, plan);
			assert.deepEqual(pilot.document.target, input.target);
		}
		if (stage === 'fine')
			assert.ok(
				pilot.terminal.state === 'accepted' &&
					pilot.document?.matrixComplete &&
					!pilot.document.partialCountsUnavailable,
				'Reference expansion requires the complete admitted measured pilot.',
			);
	}
	// All reused package evidence retains its original plan and exact numerical collaborators.
	for (const entry of entries) {
		assert.ok(
			entry.terminal.recipe.parents.some(
				(id) => id.path === plan.path && id.sha256 === plan.sha256 && id.byteLength === plan.byteLength,
			),
		);
		if (entry.document) {
			assert.deepEqual(entry.document.plan, plan);
			assert.deepEqual(entry.document.target, input.target);
		}
		for (const id of entry.terminal.recipe.parameters.sourceIdentities.filter(
			(id) =>
				id.path.includes('/numerics/') ||
				id.path.includes('/volume-reference/') ||
				id.path.includes('/volume-worker/') ||
				id.path.includes('/reference/physical/') ||
				id.path.endsWith('/angular-frame/geometry.mjs') ||
				id.path.endsWith('/angular-theta/execute.mjs') ||
				id.path.endsWith('/angular-theta/geometry.mjs') ||
				id.path.endsWith('/volume-j2/angular.mjs') ||
				id.path.endsWith('/volume-j2/assess.mjs') ||
				id.path.endsWith('/j2/angular.mjs'),
		))
			readRepository(id.path, id);
	}
	const sealReserveBytes = 768 * 1024;
	const overheadBytes = Math.max(
		1024 ** 2,
		sourceBytes.length +
			Buffer.byteLength(JSON.stringify({sources: snapshot.sources, inputIdentities: input.identities})) * 2 +
			sealReserveBytes +
			256 * 1024,
	);
	/** @type {SkyAngularFrameForecast} */ const forecast =
		stage === 'pilot' || stage === 'assess'
			? {
					expectedCount,
					overheadBytes,
					nodeBytes: stage === 'pilot' ? 512 * 1024 : 0,
					totalBytes: overheadBytes + (stage === 'pilot' ? 512 * 1024 : 0),
					aggregateRateMilliseconds: null,
					slowestIncidentMilliseconds: null,
					parallelWorkMilliseconds: null,
					startupAndFinalizationMilliseconds: 90000,
					jobMilliseconds: 300000,
				}
			: thetaFineForecast(/** @type {SkyAngularThetaDocument} */ (pilot.document), expectedCount, overheadBytes);
	const cap = stage === 'pilot' || stage === 'assess' ? 2 * 1024 ** 2 : 3 * 1024 ** 2;
	assert.ok(forecast.totalBytes <= cap, 'Measured node/snapshot forecast exceeds the per-record byte cap.');
	const allocatedBytes =
		stage === 'pilot' || stage === 'assess' ? cap : Math.ceil(forecast.totalBytes / (64 * 1024)) * 64 * 1024;
	const assessmentReserveBytes = stage === 'assess' ? 0 : 2 * 1024 ** 2,
		assessmentReserveMilliseconds = stage === 'assess' ? 0 : 300000;
	assert.ok(
		usage.retainedBytes + allocatedBytes + assessmentReserveBytes <= thetaPackageBytes,
		'Angular package allowance must preserve the final assessment allocation.',
	);
	assert.ok(
		usage.elapsedMilliseconds + forecast.jobMilliseconds + assessmentReserveMilliseconds <=
			thetaPackageMilliseconds,
		'Angular package forecast must preserve final assessment time.',
	);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	assert.equal(admission.usage.allocationAmendment?.record.schemaId, 'sky-continuation-resource-extension-v1');
	await authenticateNode(registration.record.host.node);
	const maximumJobMilliseconds = Math.min(
		stage === 'pilot' || stage === 'assess' ? 300000 : thetaPackageMilliseconds,
		admission.timeoutMilliseconds,
		thetaPackageMilliseconds - usage.elapsedMilliseconds - assessmentReserveMilliseconds,
	);
	assert.ok(
		forecast.jobMilliseconds <= maximumJobMilliseconds,
		'Measured time forecast exceeds remaining package/campaign time.',
	);
	assert.ok(Date.now() - started < maximumJobMilliseconds - 30000);
	const parents = [
		...new Map(
			[
				registration.seal,
				plan,
				...input.identities,
				snapshot.baseSnapshot,
				admission.usage.allocationAmendment.seal,
				...entries.map((e) => e.seal),
				...(admission.usage.invalidEvidence ?? []).map((e) => e.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	const caseId = 'angular-theta-' + stage;
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			stage === 'assess'
				? 'Assess the frozen angular-theta predictions from authenticated same-point stage records; missing references remain unresolved.'
				: 'Evaluate only the registered fixed angular theta using unchanged independent incident physics; retain every completed batch and separate physical admission from later angular accuracy.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			packageId: thetaPackageId,
			stage,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			allocatedBytes,
			pilotRun,
			candidate,
			forecast,
			packageUsage: usage,
			sourceIdentities: snapshot.sources,
			node: registration.record.host.node,
			maximumJobMilliseconds,
			finalizationReserveMilliseconds: 30000,
			workerCount: stage === 'assess' ? 0 : 4,
			batchSize: 256,
			sourceSnapshotBase: snapshot.baseSnapshot,
		},
	};
	return {
		started,
		registration,
		entries,
		usage,
		input,
		plan,
		planBytes,
		snapshot,
		packed,
		sourceBytes,
		candidate,
		expectedCount,
		sealReserveBytes,
		forecast,
		allocatedBytes,
		maximumJobMilliseconds,
		parents,
		caseId,
		recipe,
	};
}

/** One separately bounded pilot/reference record or the final pure assessment.
 * @param {SkyAngularThetaCommand} stage @param {string} registrationRun @param {string|null} [pilotRun]
 * @returns {Promise<SkyAngularThetaRunResult>}
 */
export async function runAngularTheta(stage, registrationRun, pilotRun = null) {
	const {
		started,
		registration,
		entries,
		usage,
		input,
		plan,
		planBytes,
		snapshot,
		packed,
		sourceBytes,
		candidate,
		expectedCount,
		sealReserveBytes,
		forecast,
		allocatedBytes,
		maximumJobMilliseconds,
		parents,
		caseId,
		recipe,
	} = await prepareAngularTheta(stage, registrationRun, pilotRun);
	const run = createRun('at-' + stage, recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength,
		persistedCount = 0,
		lastStorage = 0,
		lastProgress = Date.now();
	const state = thetaState();
	state.expectedCount = expectedCount;
	/** @type {SkyAngularFrameBatchRecord[]} */ const batches = [];
	/** @type {Awaited<ReturnType<typeof executeTheta>>|null} */ let result = null;
	/** @type {SkyAngularThetaAssessment|null} */ let assessment = null;
	/** @type {Error|null} */ let failure = null;
	/** @param {string} name @param {unknown} contents @param {DialDerivation} [derivation] @param {boolean} [terminal] */
	function write(
		name,
		contents,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' + name + ' from the exact angular-theta case, retained inputs and observed completed work.',
		},
		terminal = false,
	) {
		assert.ok(
			Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000),
			'Angular theta finalization deadline exceeded.',
		);
		const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(JSON.stringify(contents) + '\n');
		assert.ok(
			written + bytes.length <= allocatedBytes - sealReserveBytes,
			'Angular theta artifact forecast exhausted; preserve seal reserve.',
		);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	/** Completed state is journaled before any subsequent batch starts; the final
	 * reserve also retries a batch whose original callback was interrupted.
	 * @returns {void}
	 */
	function flushNodes() {
		while (persistedCount < state.nodes.length) {
			const nodes = state.nodes.slice(persistedCount, persistedCount + 256),
				raw = Buffer.from(JSON.stringify(nodes));
			const compressed = gzipSync(raw, {level: 9}),
				firstOffset = persistedCount;
			const encoding = {
				firstOffset,
				count: nodes.length,
				uncompressedByteLength: raw.length,
				uncompressedSha256: sha256(raw),
			};
			const artifact = write(
				'nodes-' + String(batches.length).padStart(4, '0') + '.json.gz',
				compressed,
				{
					parents: [definition],
					operation:
						'Retain this completed ordered batch of SkyVolumeJ2Node incident estimates, allowances and per-task work; encode JSON and gzip without modifying numerical values.',
					parameters: {schemaId: 'sky-angular-theta-nodes-v1', ...encoding},
				},
				true,
			);
			batches.push({artifact, ...encoding});
			persistedCount += nodes.length;
		}
	}
	/** @returns {void} */ function guard() {
		const now = Date.now();
		assert.ok(now - started < maximumJobMilliseconds - 30000, 'Angular theta work deadline exceeded.');
		if (now - lastStorage >= 5000) {
			run.guard();
			lastStorage = now;
		}
		if (now - lastProgress >= 20000) {
			run.progress(
				caseId,
				'Bounded incident workers active; completed batches remain sealed inputs to this record.',
				state.nodes.length,
				state.expectedCount,
			);
			lastProgress = now;
		}
	}
	try {
		run.progress(caseId, 'Authenticated original point, latest resource extension and measured package forecast.');
		write('angular-theta-plan.md', planBytes, {
			parents: [plan],
			operation: 'Preserve exact prospective sampling, reference gates and package limits.',
		});
		write('sources-delta.json.gz', sourceBytes, {
			parents: [snapshot.baseSnapshot, ...snapshot.delta],
			operation:
				'Combine immutable00210source archive with all changed/new current files; omitted current sources match original identities and no deletion is allowed.',
			parameters: {
				schemaId: 'sky-source-base64-delta-v1',
				baseSnapshot: snapshot.baseSnapshot,
				uncompressedByteLength: packed.length,
				uncompressedSha256: sha256(packed),
				currentSourceIdentities: snapshot.sources,
			},
		});
		write('inputs.json', {
			target: input.target,
			channels: [0, 8],
			mu16: input.mu16,
			radial32: input.radial32,
			radial64: input.radial64,
			analyticReplay: input.analyticReplay,
			identities: input.identities,
		});
		write('proof.json', {
			geometry: thetaGeometryProof(),
			analyticReplay: input.analyticReplay,
			runner: thetaRunnerProof(),
			...(stage === 'assess' ? {assessment: thetaAssessmentProof()} : {}),
		});
		if (stage === 'assess') {
			assessment = assessTheta(
				input,
				thetaAdmittedDocument(entries, 'pilot'),
				thetaAdmittedDocument(entries, 'fine'),
			);
			write('assessment.json', assessment);
			write('report.md', Buffer.from(thetaAssessmentReport(assessment)));
		} else {
			assert.ok(candidate);
			result = await executeTheta(input, candidate, state, {
				deadlineEpochMilliseconds: started + maximumJobMilliseconds - 30000,
				guard,
				onBatch: () => {
					flushNodes();
					run.progress(caseId, 'Completed incident batch retained.', state.nodes.length, state.expectedCount);
					lastProgress = Date.now();
				},
			});
		}
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	try {
		flushNodes();
		if (stage !== 'assess') {
			assert.ok(candidate);
			write('unresolved-witnesses.json', state.unresolvedWitnesses, undefined, true);
			/** @type {SkyAngularThetaDocument} */ const document = {
				schemaId: 'sky-angular-theta-stage-v1',
				packageId: thetaPackageId,
				registration: registration.seal,
				plan,
				stage,
				candidate,
				target: input.target,
				channels: [0, 8],
				matrixComplete: state.matrixComplete,
				expectedCount: state.expectedCount,
				retainedNodeCount: state.nodes.length,
				completedBatches: state.completedBatches,
				partialCountsUnavailable: state.partialCountsUnavailable,
				rows: result?.rows ?? null,
				checks: result?.checks ?? [],
				nodeBatches: batches,
				costs: thetaCosts(state.nodes, batches, state.expectedCount, state.partialCountsUnavailable),
				failure: failure?.message ?? null,
			};
			write('reference.json', document, undefined, true);
			write(
				'report.md',
				Buffer.from(
					[
						'# Angular theta stage ' + stage,
						'',
						'Matrix complete: ' +
							document.matrixComplete +
							'. Retained incident nodes: ' +
							document.retainedNodeCount +
							'/' +
							document.expectedCount +
							'.',
						'Physical admission checks are distinct from the later frozen angular accuracy predicates. Incomplete results do not establish an angular oracle.',
						'Aggregate incident milliseconds: ' +
							document.costs.aggregateIncidentMilliseconds +
							'; slowest: ' +
							document.costs.slowestIncidentMilliseconds +
							'.',
						'Partial work counters unavailable: ' + document.partialCountsUnavailable + '.',
						failure ? 'Execution failure: ' + failure.message : '',
						'',
					].join('\n'),
				),
				undefined,
				true,
			);
		}
		for (const id of [...parents, ...snapshot.sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				completed: failure === null,
				matrixComplete: stage === 'assess' ? null : state.matrixComplete,
				retainedNodeCount: persistedCount,
				completedNodeCount: state.nodes.length,
				partialCountsUnavailable: state.partialCountsUnavailable,
				workerTeardownAwaited: true,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				gpuJobsExecuted: 0,
				cleanup,
				failure: failure?.message ?? null,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: caseId,
		caseId,
		packageId: thetaPackageId,
		stage,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		matrixComplete: stage === 'assess' ? null : state.matrixComplete,
		retainedNodeCount: persistedCount,
		partialCountsUnavailable: state.partialCountsUnavailable,
		predicateCount: assessment?.predicates.length ?? 0,
		passedPredicates: assessment?.predicates.filter((s) => s === 'passed').length ?? 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = /** @type {SkyAngularThetaTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	const retainedBytes = seal.byteLength + terminal.artifacts.reduce((s, a) => s + a.byteLength, 0);
	assert.ok(retainedBytes <= allocatedBytes && usage.retainedBytes + retainedBytes <= thetaPackageBytes);
	assert.ok(usage.elapsedMilliseconds + terminal.result.jobElapsedMilliseconds <= thetaPackageMilliseconds);
	if (failure) throw new Error('Angular theta ' + stage + ' failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal, matrixComplete: stage === 'assess' ? null : state.matrixComplete};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length === 4 || process.argv.length === 5);
	const stage = /** @type {SkyAngularThetaCommand} */ (process.argv[2]);
	console.log(JSON.stringify(await runAngularTheta(stage, process.argv[3], process.argv[4] ?? null)));
}
