import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync, gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {
	checkedAbsolute,
	createRun,
	identity,
	readRepository,
	sha256,
	sourceIdentities,
	verifyRun,
} from '../../io/files.mjs';
import {acceptControls, deriveProfile} from '../../numerics/profile.js';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {mechanismCase} from '../mechanisms/cases.mjs';
import {validateChannelDiagnostics} from '../capture/diagnostics.js';
import {checkedEnvelope} from '../ladder/read.mjs';
import {predictMatchedAltitudeOrders} from '../matched-order-transfer/index.mjs';
import {matchedOrderTransferProof} from '../matched-order-transfer/proof.mjs';
import {readMatchedOrderAssessment, assessMatchedOrders} from './index.mjs';
import {matchedOrderAssessmentProof} from './proof.mjs';

const topic = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials',
	planPath = `${topic}/matched-order-plan.md`,
	transferPath = `${topic}/matched-order-transfer-plan.md`,
	allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 768 * 1024;

/** Authenticate the pinned C0 runtime without retaining executable bytes.
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

/** Read only the immutable original P55 N4 input, excluding any future target.
 * @param {DialContinuationRegistrationRead} registration
 * @returns {{identities:DialFileIdentity[],diagnostics:SkyContinuationChannelDiagnostics[]}}
 */
function readOriginalP55(registration) {
	const source = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00132-c-d55-raw'),
		candidate = mechanismCase('d55-raw'),
		controlId = mechanismArtifact(source, 'control.json');
	assert.equal(source.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(source.terminal.recipe.parameters.caseId, 'd55-raw');
	assert.equal(source.terminal.recipe.parameters.phase, candidate.phase);
	assert.equal(source.terminal.recipe.parameters.jobKind, 'gpu');
	assert.equal(source.terminal.recipe.parameters.scope, 'screen');
	/** @type {SkyGpuControl} */ const control = JSON.parse(readRepository(controlId.path, controlId).toString());
	assert.deepEqual(control.buildRequest, deriveProfile(loadInputs().native48, candidate.controls).buildRequest);
	assert.deepEqual(
		{...acceptControls(control.controls), viewIntervals: [8, 16], representations: ['grouped']},
		{...acceptControls(candidate.controls), viewIntervals: [8, 16], representations: ['grouped']},
	);
	assert.ok([8, 16].every((n) => control.controls.viewIntervals.includes(n)));
	assert.deepEqual(control.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(
		control.scenes,
		registration.probeScenes.filter((scene) => registration.record.scopes.screen.times.includes(scene.time)),
	);
	assert.deepEqual(control.continuation.probes, registration.probes);
	assert.deepEqual(control.continuation.probeScenes, registration.probeScenes);
	assert.equal(control.continuation.finalFirstOrder, 'raw');
	assert.equal(control.continuation.referenceMode, 'component');
	assert.equal(control.continuation.higherRepresentation ?? 'combined-raw', candidate.higherRepresentation);
	const identities = [source.seal, controlId];
	const diagnostics = [0, 8].map((channel) => {
		const id = mechanismArtifact(source, `channel-${String(channel).padStart(2, '0')}-diagnostics.json.gz`);
		identities.push(id);
		return validateChannelDiagnostics(
			JSON.parse(gunzipSync(readRepository(id.path, id), {maxOutputLength: 2 * 1024 ** 2}).toString()),
		);
	});
	return {identities, diagnostics};
}

/** Retain a prospective P55 transfer prediction and descriptive matched H compensation assessment.
 * No target P55 N5/N6 artifact is read. The target run must happen subsequently.
 * @param {string} registrationRun - Exact original C0 owner.
 * @returns {Promise<{run:string,seal:DialFileIdentity,rows:number}>} Verified accepted CPU evidence.
 */
export async function runMatchedOrderAssessment(registrationRun) {
	const started = Date.now(),
		registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const input = readMatchedOrderAssessment(registration),
		p55 = readOriginalP55(registration),
		assessment = assessMatchedOrders(input.original, input.diagnostics),
		sources = sourceIdentities();
	const planBytes = readRepository(planPath),
		plan = identity(planPath, planBytes),
		transferBytes = readRepository(transferPath),
		transferPlan = identity(transferPath, transferBytes);
	assert.equal(plan.sha256, 'd19f4f2e98b40c39d36c7c806e4a4fae18a5e313e932a1cee350eec261988a25');
	assert.ok(transferBytes.toString().includes('matched-p55-predict'));
	const predictionInputs = assessment.rows.map((row) => {
		const channel = p55.diagnostics[[0, 8].indexOf(row.channel)];
		return {
			probeId: row.probeId,
			channel: row.channel,
			h: row.cumulativeWatts.map((value, i) => ({value, allowance: row.cumulativeAllowancesWatts[i]})),
			p: [1, 2, 3, 4].map((order) => {
				const methods = channel.probes.filter(
					(r) => r.probeId === row.probeId && r.order === order && r.representationId === 'grouped',
				);
				for (const method of methods) assert.equal(method.time, row.time);
				const envelope = checkedEnvelope(methods);
				return {value: envelope.value, allowance: envelope.errorAllowance};
			}),
		};
	});
	const predictions = predictionInputs.map(predictMatchedAltitudeOrders);
	assert.equal(predictions.length, 4);
	assert.ok(predictions.every((row) => row.admitted));
	for (const row of predictions)
		assert.deepEqual(
			row.forecasts.map((f) => f.model),
			['damped-log-ratio', 'last-log-step'],
		);
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				transferPlan,
				...input.identities,
				...p55.identities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((id) => [id.path, id]),
		).values(),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation:
			'Authenticate original H N1..N4 parity and actual H N5/N6; derive the frozen P1-only residual assessment and register both P55 response models from original P55 N1..N4 before reading or executing its target N5/N6.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: 'matched-p55-predict',
			assessmentStage: 'matched-h-order-assessment',
			caseId: 'matched-p55-predict',
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			forecastPlan: transferPlan,
			maximumJobMilliseconds: Math.min(300000, admission.timeoutMilliseconds),
			finalizationReserveMilliseconds: 30000,
			physicalSubstitutionAssessed: false,
			targetP55N5N6Read: false,
		},
	};
	const run = createRun('matched-predict', recipe),
		definition = identity(`${run.path}/definition.json`);
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null);
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation: `Derive ${name} from the recorded immutable parents and exact implementation.`,
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
		run.progress(
			'assessment',
			'Retaining the four matched H residual assessments and prospective P55 transfer predictions.',
		);
		write('matched-order-plan.md', planBytes, {
			parents: [plan],
			operation: 'Copy the exact original matched-order prospective plan.',
		});
		write('matched-order-transfer-plan.md', transferBytes, {
			parents: [transferPlan],
			operation: 'Copy the exact prospective P55 transfer plan before its target execution.',
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
		write('proof.json', {assessment: matchedOrderAssessmentProof(), transfer: matchedOrderTransferProof()});
		write('matched-h-assessment.json', assessment);
		write(
			'p55-prediction.json',
			{
				schemaId: 'sky-matched-p55-prediction-v1',
				forecastPlan: transferPlan,
				inputs: predictionInputs,
				rows: predictions,
				targetP55N5N6Read: false,
				limitations: [
					'Input intervals propagate numerical view allowances only; model error is not bounded.',
					'These are held predictions for a future matched P55 capture, not measured responses.',
				],
			},
			{
				parents: [definition, transferPlan, ...input.identities, ...p55.identities],
				operation:
					'Apply the two prospectively fixed P55/H log-ratio models to H N1..N6 and original P55 N1..N4 only.',
			},
		);
		for (const id of [...parents, ...sources]) readRepository(id.path, id);
		await authenticateNode(registration.record.host.node);
		write('execution.json', {
			completed: true,
			gpuJobsExecuted: 0,
			parentsReauthenticated: true,
			sourcesReauthenticated: true,
			physicalSubstitutionAssessed: false,
			predictionRows: predictions.length,
		});
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: 'matched-p55-predict',
		caseId: 'matched-p55-predict',
		rows: assessment.rows.length,
		predictionRows: predictions.length,
		predictionsAdmitted: predictions.every((row) => row.admitted),
		physicalSubstitutionAssessed: false,
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error(`Matched-order assessment failed in ${run.path}: ${failure.message}`);
	return {run: run.path, seal, rows: assessment.rows.length};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 3);
	console.log(JSON.stringify(await runMatchedOrderAssessment(process.argv[2]), null, 2));
}
