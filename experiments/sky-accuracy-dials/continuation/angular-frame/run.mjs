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
import {readAngularFrameInput} from './read.mjs';
import {angularFrameCase, angularFrameState, executeAngularFrame} from './execute.mjs';
import {angularFrameGeometryProof} from './geometry.mjs';
import {assessAngularFrame, angularFrameAssessmentProof, angularFrameAssessmentReport} from './assessment.mjs';
import {
	angularFramePackageId,
	angularFramePlanPath,
	angularFramePackageBytes,
	angularFramePackageMilliseconds,
	readAngularFrameRuns,
	angularFramePackageUsage,
	angularFrameReferenceForecast,
	angularFrameCosts,
	angularFrameRunnerProof,
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
 * @param {SkyAngularFrameStage|'assess'} stage @param {string} registrationRun @param {string|null} [pilotRun]
 */
export async function prepareAngularFrame(stage, registrationRun, pilotRun = null) {
	assert.ok(['pilot', 'sun16', 'sun32', 'radial32', 'radial64', 'assess'].includes(stage));
	const started = Date.now(),
		registration = readRegistration(registrationRun);
	const entries = readAngularFrameRuns(registration),
		usage = angularFramePackageUsage(entries);
	assert.ok(
		!entries.some((e) => e.terminal.recipe.parameters.caseId === 'angular-frame-' + stage),
		'A package stage may execute only once, including failed attempts.',
	);
	assert.ok(
		!entries.some((e) => e.terminal.recipe.parameters.caseId === 'angular-frame-assess'),
		'The final assessment closes this package.',
	);
	const input = readAngularFrameInput(registration),
		plan = identity(angularFramePlanPath),
		planBytes = readRepository(plan.path, plan);
	const snapshot = resourceExtensionSources(
		acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes'),
	);
	const packed = Buffer.from(
		JSON.stringify(snapshot.delta.map((id) => ({...id, base64: readRepository(id.path, id).toString('base64')}))),
	);
	const sourceBytes = gzipSync(packed, {level: 9});
	const candidate = stage === 'assess' ? null : angularFrameCase(stage),
		expectedCount = candidate ? candidate.fullDirectionCount / 2 + 2 : 0;
	/** @type {SkyAngularFrameRunEntry|null} */ let pilot = null;
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
		if (stage !== 'assess')
			assert.ok(
				pilot.terminal.state === 'accepted' &&
					pilot.document?.matrixComplete &&
					!pilot.document.partialCountsUnavailable,
				'Reference expansion requires the complete admitted measured pilot.',
			);
		// Later documentation may differ; every executed numerical collaborator is exact.
		for (const id of pilot.terminal.recipe.parameters.sourceIdentities.filter(
			(id) =>
				id.path.includes('/numerics/') ||
				id.path.includes('/volume-reference/') ||
				id.path.includes('/volume-worker/') ||
				id.path.includes('/reference/physical/') ||
				id.path.endsWith('/angular-frame/execute.mjs') ||
				id.path.endsWith('/angular-frame/geometry.mjs') ||
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
			: angularFrameReferenceForecast(
					/** @type {SkyAngularFrameDocument} */ (pilot.document),
					expectedCount,
					overheadBytes,
				);
	const cap = stage === 'pilot' || stage === 'assess' ? 3 * 1024 ** 2 : 6 * 1024 ** 2;
	assert.ok(forecast.totalBytes <= cap, 'Measured node/snapshot forecast exceeds the per-record byte cap.');
	const allocatedBytes =
		stage === 'pilot' || stage === 'assess' ? cap : Math.ceil(forecast.totalBytes / (64 * 1024)) * 64 * 1024;
	const assessmentReserveBytes = stage === 'assess' ? 0 : 3 * 1024 ** 2,
		assessmentReserveMilliseconds = stage === 'assess' ? 0 : 300000;
	assert.ok(
		usage.retainedBytes + allocatedBytes + assessmentReserveBytes <= angularFramePackageBytes,
		'Angular package allowance must preserve the final assessment allocation.',
	);
	assert.ok(
		usage.elapsedMilliseconds + forecast.jobMilliseconds + assessmentReserveMilliseconds <=
			angularFramePackageMilliseconds,
		'Angular package forecast must preserve final assessment time.',
	);
	const admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	assert.equal(admission.usage.allocationAmendment?.record.schemaId, 'sky-continuation-resource-extension-v1');
	await authenticateNode(registration.record.host.node);
	const maximumJobMilliseconds = Math.min(
		stage === 'pilot' || stage === 'assess' ? 300000 : angularFramePackageMilliseconds,
		admission.timeoutMilliseconds,
		angularFramePackageMilliseconds - usage.elapsedMilliseconds - assessmentReserveMilliseconds,
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
	const caseId = 'angular-frame-' + stage;
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			stage === 'assess'
				? 'Assess the frozen angular-frame predictions from authenticated same-point stage records; missing references remain unresolved.'
				: 'Evaluate only the registered fixed angular frame using unchanged independent incident physics; retain every completed batch and separate physical admission from later angular accuracy.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: caseId,
			caseId,
			packageId: angularFramePackageId,
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
 * @param {SkyAngularFrameStage|'assess'} stage @param {string} registrationRun @param {string|null} [pilotRun]
 * @returns {Promise<{run:string,seal:DialFileIdentity,matrixComplete:boolean|null}>}
 */
export async function runAngularFrame(stage, registrationRun, pilotRun = null) {
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
	} = await prepareAngularFrame(stage, registrationRun, pilotRun);
	const run = createRun('af-' + stage, recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength,
		persistedCount = 0,
		lastStorage = 0,
		lastProgress = Date.now();
	const state = angularFrameState();
	state.expectedCount = expectedCount;
	/** @type {SkyAngularFrameBatchRecord[]} */ const batches = [];
	/** @type {Awaited<ReturnType<typeof executeAngularFrame>>|null} */ let result = null;
	/** @type {SkyAngularFrameAssessment|null} */ let assessment = null;
	/** @type {Error|null} */ let failure = null;
	/** @param {string} name @param {unknown} contents @param {DialDerivation} [derivation] @param {boolean} [terminal] */
	function write(
		name,
		contents,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' + name + ' from the exact angular-frame case, retained inputs and observed completed work.',
		},
		terminal = false,
	) {
		assert.ok(
			Date.now() - started < maximumJobMilliseconds - (terminal ? 0 : 30000),
			'Angular frame finalization deadline exceeded.',
		);
		const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(JSON.stringify(contents) + '\n');
		assert.ok(
			written + bytes.length <= allocatedBytes - sealReserveBytes,
			'Angular frame artifact forecast exhausted; preserve seal reserve.',
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
					parameters: {schemaId: 'sky-angular-frame-nodes-v1', ...encoding},
				},
				true,
			);
			batches.push({artifact, ...encoding});
			persistedCount += nodes.length;
		}
	}
	/** @returns {void} */ function guard() {
		const now = Date.now();
		assert.ok(now - started < maximumJobMilliseconds - 30000, 'Angular frame work deadline exceeded.');
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
		write('angular-frame-plan.md', planBytes, {
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
			baseline: input.baseline,
			identities: input.identities,
		});
		write('proof.json', {
			geometry: angularFrameGeometryProof(),
			runner: angularFrameRunnerProof(),
			...(stage === 'assess' ? {assessment: angularFrameAssessmentProof()} : {}),
		});
		if (stage === 'assess') {
			assessment = assessAngularFrame(input, entries);
			write('assessment.json', assessment);
			write('report.md', Buffer.from(angularFrameAssessmentReport(assessment)));
		} else {
			assert.ok(candidate);
			result = await executeAngularFrame(input, candidate, state, {
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
			/** @type {SkyAngularFrameDocument} */ const document = {
				schemaId: 'sky-angular-frame-stage-v1',
				packageId: angularFramePackageId,
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
				costs: angularFrameCosts(state.nodes, batches, state.expectedCount, state.partialCountsUnavailable),
				failure: failure?.message ?? null,
			};
			write('reference.json', document, undefined, true);
			write(
				'report.md',
				Buffer.from(
					[
						'# Angular frame stage ' + stage,
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
		packageId: angularFramePackageId,
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
	const terminal = /** @type {SkyAngularFrameTerminal} */ (JSON.parse(readRepository(seal.path, seal).toString()));
	const retainedBytes = seal.byteLength + terminal.artifacts.reduce((s, a) => s + a.byteLength, 0);
	assert.ok(retainedBytes <= allocatedBytes && usage.retainedBytes + retainedBytes <= angularFramePackageBytes);
	assert.ok(usage.elapsedMilliseconds + terminal.result.jobElapsedMilliseconds <= angularFramePackageMilliseconds);
	if (failure) throw new Error('Angular frame ' + stage + ' failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal, matrixComplete: stage === 'assess' ? null : state.matrixComplete};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.ok(process.argv.length === 4 || process.argv.length === 5);
	const stage = /** @type {SkyAngularFrameStage|'assess'} */ (process.argv[2]);
	console.log(JSON.stringify(await runAngularFrame(stage, process.argv[3], process.argv[4] ?? null)));
}
