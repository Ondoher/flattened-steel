import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync, gunzipSync} from 'node:zlib';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {validateMatchedOrderDiagnostics} from '../matched-orders/diagnostics.mjs';
import {readMatchedOrdersParent, assertMatchedOrdersPrefix} from '../matched-orders/read.mjs';
import {readMatchedOrderAssessment} from '../matched-order-analysis/index.mjs';
import {predictMatchedAltitudeOrders} from './index.mjs';
import {matchedOrderTransferProof} from './proof.mjs';
import {assessMatchedAltitudeResponse} from './assess.mjs';
import {matchedOrderTransferAssessmentProof} from './assess-proof.mjs';

const predictionRun = 'tmp/experiments/sky-accuracy-dials/runs/00172-matched-predict',
	targetRun = 'tmp/experiments/sky-accuracy-dials/runs/00173-matched-p55-n6',
	p55PrefixRun = 'tmp/experiments/sky-accuracy-dials/runs/00132-c-d55-raw',
	planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/matched-order-transfer-plan.md',
	allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the pinned original C0 runtime before and after evidence construction.
 * @param {DialContinuationToolIdentity} expected @returns {Promise<void>}
 */
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

/** Reproduce every original grouped N1..N4 row, beyond the four scored groups.
 * @param {SkyMatchedOrderDiagnostics} actual @param {DialFileIdentity} originalId
 * @returns {void} Exact complete original prefix rows.
 */
function assertOriginalRows(actual, originalId) {
	const original = validateChannelDiagnostics(
		JSON.parse(
			gunzipSync(readRepository(originalId.path, originalId), {maxOutputLength: 2 * 1024 ** 2}).toString(),
		),
	);
	const oldRows = original.probes.filter((row) => row.representationId === 'grouped'),
		newRows = actual.rows.filter((row) => row.order <= 4);
	assert.equal(oldRows.length, 40 * 4 * 7);
	assert.equal(newRows.length, oldRows.length);
	const byAddress = new Map(oldRows.map((row) => [`${row.probeId}:${row.order}:${row.methodId}`, row]));
	assert.equal(byAddress.size, oldRows.length);
	for (const row of newRows) assert.deepEqual(row, byAddress.get(`${row.probeId}:${row.order}:${row.methodId}`));
}

/** Read the exact pre-target prediction and matched target, including full prefix and envelope parity.
 * @param {DialContinuationRegistrationRead} registration - Original C0 owner.
 * @returns {SkyOrderTransferAssessmentRead} Complete read-only derivation.
 */
export function readMatchedAltitudeResponse(registration) {
	const prediction = acceptedMechanismInput(predictionRun),
		target = acceptedMechanismInput(targetRun);
	assert.equal(prediction.seal.byteLength, 205390);
	assert.equal(prediction.seal.sha256, '847e043ff9584b1ac34937cf838e4aa859217b6cd5cabc64a4a5fa2e2208e0fc');
	assert.equal(target.seal.byteLength, 216523);
	assert.equal(target.seal.sha256, '7f4f417986fa86a1778c69e0e34815b78ac25be70bdf50353a945ab7124843ad');
	for (const source of [prediction, target]) {
		assert.equal(source.terminal.recipe.parameters.continuationRegistration, registration.run);
		assert.equal(source.terminal.recipe.parameters.scope, 'component');
		assert.equal(source.terminal.recipe.parameters.phase, 'C5');
	}
	assert.equal(prediction.terminal.recipe.parameters.caseId, 'matched-p55-predict');
	assert.equal(prediction.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(target.terminal.recipe.parameters.caseId, 'matched-p55-n6');
	assert.equal(target.terminal.recipe.parameters.jobKind, 'gpu');
	const h = readMatchedOrderAssessment(registration),
		parent = readMatchedOrdersParent(registration, p55PrefixRun),
		predictionId = mechanismArtifact(prediction, 'p55-prediction.json'),
		planId = mechanismArtifact(prediction, 'matched-order-transfer-plan.md'),
		prefixId = mechanismArtifact(target, 'prefix.json'),
		controlId = mechanismArtifact(target, 'control.json');
	const payload = JSON.parse(readRepository(predictionId.path, predictionId).toString()),
		prefix = JSON.parse(readRepository(prefixId.path, prefixId).toString()),
		control = JSON.parse(readRepository(controlId.path, controlId).toString()),
		planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes);
	assert.equal(plan.sha256, '76b6ae1980b3b398e27fb08680d5258b58825b7ee080fb659bfba37d0568118b');
	assert.equal(planId.sha256, plan.sha256);
	assert.equal(planId.byteLength, plan.byteLength);
	assert.equal(payload.schemaId, 'sky-matched-p55-prediction-v1');
	assert.deepEqual(payload.forecastPlan, plan);
	assert.equal(payload.targetP55N5N6Read, false);
	assert.equal(payload.inputs.length, 4);
	assert.equal(payload.rows.length, 4);
	assert.deepEqual(payload.rows, payload.inputs.map(predictMatchedAltitudeOrders));
	for (const id of [prediction.seal, predictionId, planId, plan])
		assert.ok(
			target.terminal.recipe.parents.some(
				(row) => row.path === id.path && row.sha256 === id.sha256 && row.byteLength === id.byteLength,
			),
			`Target lacks prospective parent ${id.path}.`,
		);
	assert.ok(
		prediction.terminal.recipe.parents.some(
			(row) => row.path === parent.identities[0].path && row.sha256 === parent.identities[0].sha256,
		),
	);
	const predictionSources = /** @type {{sourceIdentities:readonly DialFileIdentity[]}} */ (
		/** @type {unknown} */ (prediction.terminal.recipe.parameters)
	).sourceIdentities;
	const modelSource = predictionSources.find(
		(row) => row.path === 'experiments/sky-accuracy-dials/continuation/matched-order-transfer/index.mjs',
	);
	assert.ok(modelSource);
	readRepository(modelSource.path, modelSource);
	assert.equal(prefix.schemaId, 'sky-matched-order-prefix-v1');
	assert.equal(prefix.parentRun, p55PrefixRun);
	assert.equal(prefix.passed, true);
	assert.equal(prefix.channels.length, 2);
	assert.ok(Number.isSafeInteger(control.deadlineEpochMilliseconds));
	const {deadlineEpochMilliseconds, ...stableControl} = control;
	assert.deepEqual(stableControl, {
		...parent.control,
		channels: [0, 8],
		prefixControl: parent.control,
		executionSchemaId: 'sky-matched-six-order-control-v1',
		actualOrders: [1, 2, 3, 4, 5, 6],
	});
	const identities = [
		prediction.seal,
		target.seal,
		predictionId,
		planId,
		plan,
		prefixId,
		controlId,
		modelSource,
		...h.identities,
		...parent.identities,
	];
	const targetDiagnostics = [0, 8].map((channel) => {
		const authority = parent.channels.find((row) => row.channel === channel),
			parity = prefix.channels.find((row) => row.channel === channel);
		assert.ok(authority && parity);
		assert.equal(parity.passed, true);
		assert.deepEqual(parity.expected, authority.expected);
		assertMatchedOrdersPrefix(parity.actual, authority.expected);
		const id = mechanismArtifact(target, `channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`);
		identities.push(id);
		const diagnostic = validateMatchedOrderDiagnostics(
			JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
			registration.probes,
			channel,
		);
		assert.equal(diagnostic.queryCount, authority.referenceQueryCount);
		assert.equal(diagnostic.preparationEvaluationCount, authority.referencePreparationEvaluationCount);
		for (const row of diagnostic.rows)
			assert.equal(row.sceneId, registration.probeScenes.find((scene) => scene.time === row.time).id);
		const oldP55 = authority.identities.find((row) => row.path.endsWith('-diagnostics.json.gz'));
		assert.ok(oldP55);
		assertOriginalRows(diagnostic, oldP55);
		const oldH = h.identities.find(
			(row) =>
				row.path ===
				`tmp/experiments/sky-accuracy-dials/runs/00103-c-r0-scr/channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`,
		);
		assert.ok(oldH);
		assertOriginalRows(
			h.diagnostics.find((row) => row.channel === channel),
			oldH,
		);
		return diagnostic;
	});
	/** @type {SkyOrderTransferAssessmentInput[]} */ const inputs = payload.inputs.map(
		(/** @type {SkyOrderTransferInput} */ frozen, /** @type {number} */ index) => {
			assert.equal(frozen.h.length, 6);
			assert.equal(frozen.p.length, 4);
			const observed = targetDiagnostics.find((row) => row.channel === frozen.channel),
				hd = h.diagnostics.find((row) => row.channel === frozen.channel);
			assert.ok(observed && hd);
			/** @param {SkyMatchedOrderDiagnostics} source @returns {SkyOrderTransferValue[]} */
			const envelopes = (source) =>
				[1, 2, 3, 4, 5, 6].map((order) => {
					const rows = source.rows.filter(
						(row) =>
							row.probeId === frozen.probeId &&
							row.order === order &&
							row.methodId === 'reference-envelope',
					);
					assert.equal(rows.length, 1);
					return {value: rows[0].value, allowance: rows[0].errorAllowance};
				});
			assert.deepEqual(frozen.h, envelopes(hd));
			const actual = envelopes(observed);
			assert.deepEqual(frozen.p, actual.slice(0, 4));
			const originals = h.original.filter(
				(row) => row.probeId === frozen.probeId && row.channel === frozen.channel,
			);
			assert.equal(originals.length, 1);
			return {frozen, prediction: payload.rows[index], target: actual, original: originals[0]};
		},
	);
	const allEnvelopes = targetDiagnostics.flatMap((row) =>
		row.rows.filter((item) => item.methodId === 'reference-envelope'),
	);
	return {
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
		inputs,
		predictionRun,
		targetRun,
		plan,
		planBytes,
		targetEnvelopeCounts: {
			total: allEnvelopes.length,
			admitted: allEnvelopes.filter((row) => row.errorAllowance !== null).length,
		},
	};
}

/** Seal every held model outcome, even when the original primary forecast fails.
 * @param {string} registrationRun - Original accepted C0 registration.
 * @returns {Promise<{run:string,seal:DialFileIdentity,qualification:SkyVolumeCheckState}>} New immutable CPU evidence.
 */
export async function runMatchedAltitudeResponse(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readMatchedAltitudeResponse(registration),
		assessment = assessMatchedAltitudeResponse(input.inputs),
		sources = sourceIdentities();
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				...input.identities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Reauthenticate and replay the exact frozen P55 response predictions; authenticate matched H/P55 full N4 prefixes and six-order envelopes; assess every original response-only gate and retain the same-measurement finite-order SSE identity without refitting.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'matched-p55-assess',
			caseId: 'matched-p55-assess',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			predictionRun,
			targetRun,
			forecastPlan: input.plan,
			maximumJobMilliseconds: Math.min(300000, admission.timeoutMilliseconds),
			finalizationReserveMilliseconds: 30000,
			physicalSubstitutionAssessed: false,
			predictionReplayedWithoutRefitting: true,
		},
	};
	const run = createRun('p55-assess', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the authenticated original prediction, matched target and exact retained implementation.`,
		},
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - 30000);
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${JSON.stringify(value)}\n`);
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const id = run.write(name, bytes, derivation);
		written += id.byteLength;
		return id;
	}
	try {
		run.progress('assessment', 'Replaying both frozen models and retaining all held P55 response gates.');
		write('matched-order-transfer-plan.md', input.planBytes, {
			parents: [input.plan],
			operation: 'Preserve the exact original held-response plan.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level 9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', {
			prediction: matchedOrderTransferProof(),
			assessment: matchedOrderTransferAssessmentProof(),
			originalGroupedPrefixRowsCompared: 2 * 2 * 40 * 4 * 7,
			originalBothRepresentationPrefixRowsAuthenticatedByDigest: 2 * 2 * 40 * 4 * 2 * 7,
			targetEnvelopeCounts: input.targetEnvelopeCounts,
		});
		write('inputs.json', {
			schemaId: 'sky-matched-p55-assessment-inputs-v1',
			predictionRun,
			targetRun,
			rows: input.inputs,
		});
		write('assessment.json', assessment, {
			parents: [definition, ...input.identities],
			operation:
				'Evaluate the registered 25 percent group/aggregate response norms, resolved sign floor/rate, unchanged noninferiority gate and separate conservative superiority comparison; derive N4/N6 SSE contrasts from original00152 measurement identities.',
		});
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {
			completed: true,
			gpuJobsExecuted: 0,
			parentsReauthenticated: true,
			sourcesReauthenticated: true,
			modelsReplayedExactly: true,
			targetEnvelopeCounts: input.targetEnvelopeCounts,
			physicalSubstitutionAssessed: false,
		});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'matched-p55-assess',
		caseId: 'matched-p55-assess',
		scalarResponses: assessment.scalars.length,
		tails: assessment.tails.length,
		primaryQualification: assessment.primaryQualification,
		physicalSubstitutionAssessed: false,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error(`Matched P55 response assessment failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal, qualification: assessment.primaryQualification};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runMatchedAltitudeResponse(process.argv[2]), null, 2));
}
