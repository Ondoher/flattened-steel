import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
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
import {assertAltitudeTargetCase, altitudeTargetAttempts, readAltitudeTarget} from './target-read.mjs';
import {readOriginalAltitudePrediction} from './predict-run.mjs';
import {predictAltitudeConvergence, assessAltitudeConvergence} from './index.mjs';
import {altitudeConvergenceProof} from './proof.mjs';

const allocatedBytes = 3 * 1024 ** 2,
	terminalReserve = 768 * 1024;
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
/** Add only the authenticated held F4 to the unchanged original F1/F8 inputs.
 * This constructs the registered three-setting model input, not a fitted model choice.
 * @param {SkyAltitudePredictionInput} original @param {readonly SkyAltitudeTarget[]} targets
 * @returns {SkyAltitudePredictionInput}
 */
export function nextAltitudePredictionInput(original, targets) {
	assert.equal(original.stage, 'p51');
	predictAltitudeConvergence(original);
	assert.equal(targets.length, 4);
	const groups = original.groups.map((group, i) => {
		const target = targets[i];
		assert.equal(target.probeId, group.probeId);
		assert.equal(target.channel, group.channel);
		assert.ok(Number.isFinite(target.value));
		assert.ok(target.allowance === null || (Number.isFinite(target.allowance) && target.allowance >= 0));
		return {...group, f4: {value: target.value, allowance: target.allowance}};
	});
	return {stage: 'p63', groups: structuredClone(groups)};
}
/** Keep numerical admission separate from a forecast's passed/failed magnitude and sign outcomes.
 * @param {{diagnostics:readonly {probes:readonly {methodId:string,errorAllowance:number|null}[]}[],sharedKnots:{state:SkyVolumeCheckState},targets:readonly SkyAltitudeTarget[]}} target
 * @returns {{state:SkyVolumeCheckState,sharedKnots:SkyVolumeCheckState,envelopeCount:number,admittedEnvelopeCount:number,selectedTargetsAdmitted:boolean}}
 */
export function altitudeForecastPrerequisites(target) {
	const envelopes = target.diagnostics.flatMap((diagnostic) =>
			diagnostic.probes.filter((row) => row.methodId === 'reference-envelope'),
		),
		admittedEnvelopeCount = envelopes.filter((row) => row.errorAllowance !== null).length,
		selectedTargetsAdmitted = target.targets.length === 4 && target.targets.every((row) => row.allowance !== null);
	assert.equal(envelopes.length, 2 * 40 * 4 * 2);
	assert.ok(['passed', 'failed', 'unresolved'].includes(target.sharedKnots.state));
	for (const row of envelopes)
		assert.ok(row.errorAllowance === null || (Number.isFinite(row.errorAllowance) && row.errorAllowance >= 0));
	for (const row of target.targets)
		assert.ok(
			Number.isFinite(row.value) &&
				(row.allowance === null || (Number.isFinite(row.allowance) && row.allowance >= 0)),
		);
	const allEnvelopes = admittedEnvelopeCount === envelopes.length;
	return {
		state:
			target.sharedKnots.state === 'failed'
				? 'failed'
				: target.sharedKnots.state === 'passed' && allEnvelopes && selectedTargetsAdmitted
					? 'passed'
					: 'unresolved',
		sharedKnots: target.sharedKnots.state,
		envelopeCount: envelopes.length,
		admittedEnvelopeCount,
		selectedTargetsAdmitted,
	};
}
/** Focused sequencing-input proof; no target data or evidence is written.
 * @returns {{schemaId:string,checks:number}}
 */
export function altitudeAssessmentProof() {
	let checks = 0;
	/** @param {unknown} ok */ const check = (ok) => {
		assert.ok(ok);
		checks++;
	};
	/** @param {()=>unknown} operation */ const rejects = (operation) => {
		assert.throws(operation);
		checks++;
	};
	/** @type {SkyAltitudePredictionInput} */ const original = {stage: 'p51', groups: []};
	const groups = /** @type {SkyAltitudeGroup[]} */ (
		['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) =>
			[0, 8].map((channel) => ({
				probeId,
				channel,
				f1: {value: 2, allowance: 1e-8},
				f8: {value: 1.015625, allowance: 2e-8},
			})),
		)
	);
	const source = {...original, groups},
		targets = groups.map((group) => ({
			probeId: group.probeId,
			channel: group.channel,
			value: 1.0625,
			allowance: 3e-8,
		}));
	const frozen = JSON.stringify({source, targets}),
		next = nextAltitudePredictionInput(source, targets),
		prediction = predictAltitudeConvergence(next);
	check(JSON.stringify({source, targets}) === frozen);
	check(next.stage === 'p63' && next.groups.length === 4);
	for (const [i, group] of next.groups.entries()) {
		check(group.f1.value === source.groups[i].f1.value && group.f8.value === source.groups[i].f8.value);
		check(group.f4.value === targets[i].value && group.f4.allowance === targets[i].allowance);
		check(prediction.rows[i].models.length === 2);
	}
	rejects(() => nextAltitudePredictionInput(source, targets.slice(1)));
	rejects(() => nextAltitudePredictionInput(source, [...targets].reverse()));
	rejects(() =>
		nextAltitudePredictionInput(
			source,
			targets.map((row) => ({...row, value: NaN})),
		),
	);
	rejects(() => nextAltitudePredictionInput(next, targets));
	/** @type {{diagnostics:{probes:{methodId:string,errorAllowance:number|null}[]}[],sharedKnots:{state:SkyVolumeCheckState},targets:SkyAltitudeTarget[]}} */
	const gate = {
		diagnostics: [0, 1].map(() => ({
			probes: Array.from({length: 320}, () => ({methodId: 'reference-envelope', errorAllowance: 0})),
		})),
		sharedKnots: {state: 'passed'},
		targets,
	};
	check(altitudeForecastPrerequisites(gate).state === 'passed');
	gate.diagnostics[0].probes[0].errorAllowance = null;
	check(altitudeForecastPrerequisites(gate).state === 'unresolved');
	gate.sharedKnots.state = 'failed';
	check(altitudeForecastPrerequisites(gate).state === 'failed');
	gate.diagnostics[0].probes[0].errorAllowance = 0;
	gate.sharedKnots.state = 'unresolved';
	check(altitudeForecastPrerequisites(gate).state === 'unresolved');
	gate.sharedKnots.state = 'passed';
	gate.targets = targets.map((row) => ({...row, allowance: null}));
	check(altitudeForecastPrerequisites(gate).state === 'unresolved');
	return {schemaId: 'sky-altitude-assessment-sequence-proof-v1', checks};
}
/** Replay a P51/P63 target and preserve every originally registered gate.
 * P51 assessment additionally seals both P63 models before any P63 attempt, but
 * only when every target envelope and the bounded shared-knot invariant is admitted.
 * P63 assessment verifies F4 against the exact P51 target retained by its prediction.
 * @param {string} registrationRun @param {string} targetRun @param {SkyAltitudeTargetCase} caseId
 * @returns {Promise<{run:string,seal:DialFileIdentity,nextPredictionCreated:boolean}>}
 */
export async function runAltitudeAssessment(registrationRun, targetRun, caseId) {
	const started = Date.now();
	assertAltitudeTargetCase(caseId);
	const registration = readRegistration(registrationRun),
		admission = admitJob(registration, 'cpu', 'component', allocatedBytes, 'C5');
	await authenticateNode(registration.record.host.node);
	const target = readAltitudeTarget(registration, targetRun, caseId),
		original = readOriginalAltitudePrediction(registration),
		isP51 = caseId === 'altitude-p51';
	/** @type {SkyAltitudeTargetRead|null} */ let p51Parent = null;
	/** @type {DialFileIdentity[]} */ const explicitPredictionIdentities = [];
	if (isP51) {
		assert.deepEqual(target.prediction.prediction.inputs, original.input);
		// The scanner uses accountInvalidEvidence for only the authenticated historical exception.
		assert.ok(
			!altitudeTargetAttempts(registration).some((row) => row.caseId === 'altitude-p63'),
			'Both P63 forecasts must be sealed before every P63 target attempt.',
		);
	} else {
		const forecast = acceptedMechanismInput(target.prediction.run),
			artifact = mechanismArtifact(forecast, 'prediction.json');
		const record = JSON.parse(readRepository(artifact.path, artifact).toString());
		assert.equal(record.schemaId, 'sky-altitude-held-prediction-v1');
		assert.ok(typeof record.parentTargetRun === 'string' && record.parentTargetRun !== targetRun);
		p51Parent = readAltitudeTarget(registration, record.parentTargetRun, 'altitude-p51');
		assert.deepEqual(p51Parent.prediction.prediction.inputs, original.input);
		assert.equal(altitudeForecastPrerequisites(p51Parent).state, 'passed');
		assert.deepEqual(
			target.prediction.prediction.inputs,
			nextAltitudePredictionInput(original.input, p51Parent.targets),
		);
		const p51Seal = p51Parent.identities.find((row) => row.path === p51Parent.run + '/sealed.json');
		assert.ok(p51Seal);
		assert.ok(
			forecast.terminal.recipe.parents.some(
				(row) =>
					row.path === p51Seal.path && row.sha256 === p51Seal.sha256 && row.byteLength === p51Seal.byteLength,
			),
		);
		assert.ok(
			Number(path.posix.basename(p51Parent.run).slice(0, 5)) <
				Number(path.posix.basename(target.prediction.run).slice(0, 5)),
		);
		explicitPredictionIdentities.push(forecast.seal, artifact);
	}
	const assessment = assessAltitudeConvergence(target.prediction.prediction, target.targets),
		prerequisites = altitudeForecastPrerequisites(target),
		nextInput = isP51 ? nextAltitudePredictionInput(original.input, target.targets) : null,
		nextPrediction = isP51 && prerequisites.state === 'passed' ? predictAltitudeConvergence(nextInput) : null,
		sources = sourceIdentities(),
		plan = target.prediction.plan,
		planBytes = target.prediction.planBytes,
		outputCase = isP51 ? 'altitude-p63-predict' : 'altitude-p63-assess';
	if (nextPrediction)
		for (const row of nextPrediction.rows)
			assert.deepEqual(
				row.models.map((model) => model.model),
				['smooth-only', 'competing-rate'],
			);
	const parents = [
		...new Map(
			[
				registration.seal,
				registration.record.inputs,
				plan,
				...target.identities,
				...original.identities,
				...(p51Parent?.identities ?? []),
				...explicitPredictionIdentities,
				...(admission.usage.allocationAmendment ? [admission.usage.allocationAmendment.seal] : []),
				...(admission.usage.invalidEvidence ?? []).map((row) => row.seal),
			].map((row) => [row.path, row]),
		).values(),
	];
	/** @type {DialDerivation} */ const recipe = {
		parents,
		operation: isP51
			? 'Authenticate and replay the held P51 response forecast, retain every outcome, and prospectively freeze both originally registered P63 rate models using unchanged original F1/F8 and the admitted observed F4.'
			: 'Authenticate the held P63 forecast and its exact P51 parent F4, then evaluate both originally registered models without refitting or selecting a winner.',
		parameters: {
			extensionId: 'compensation-attribution-v1',
			extensionStage: outputCase,
			caseId: outputCase,
			continuationRegistration: registration.run,
			jobKind: 'cpu',
			scope: 'component',
			phase: 'C5',
			admission,
			sourceIdentities: sources,
			node: registration.record.host.node,
			forecastPlan: plan,
			parentTargetRun: targetRun,
			assessedTargetCaseId: caseId,
			assessedPredictionRun: target.prediction.run,
			targetCaseId: isP51 ? 'altitude-p63' : null,
			targetAlreadyExecuted: isP51 ? false : null,
			nextPredictionPlanned: nextPrediction !== null,
			maximumJobMilliseconds: Math.min(300000, admission.timeoutMilliseconds),
			finalizationReserveMilliseconds: 30000,
			physicalReferenceAdequate: false,
		},
	};
	const run = createRun(isP51 ? 'alt-p63-predict' : 'alt-p63-assess', recipe),
		definition = identity(run.path + '/definition.json');
	let written = definition.byteLength,
		failure = /** @type {Error|null} */ (null),
		nextPredictionWritten = false;
	/** @param {string} name @param {unknown} value @param {DialDerivation} [derivation] @param {boolean} [finalizing] @returns {DialFileIdentity} */
	function write(
		name,
		value,
		derivation = {
			parents: [definition],
			operation:
				'Derive ' +
				name +
				' from the exact authenticated held forecast and target using the registered altitude equations.',
		},
		finalizing = false,
	) {
		assert.ok(Date.now() - started < Math.min(300000, admission.timeoutMilliseconds) - (finalizing ? 0 : 30000));
		run.guard();
		const bytes = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value) + '\n');
		assert.ok(written + bytes.length < allocatedBytes - terminalReserve);
		const artifact = run.write(name, bytes, derivation);
		written += artifact.byteLength;
		return artifact;
	}
	try {
		run.progress('assessment', 'Replaying the held altitude response and preserving all prospective gates.');
		write('altitude-convergence-plan.md', planBytes, {
			parents: [plan],
			operation: 'Copy the exact plan which governed the held altitude forecast.',
		});
		const sourceBytes = Buffer.from(
			JSON.stringify(
				sources.map((source) => ({...source, base64: readRepository(source.path, source).toString('base64')})),
			),
		);
		write('sources.json.gz', gzipSync(sourceBytes, {level: 9}), {
			parents: sources,
			operation: 'Encode exact source bytes as base64 JSON and gzip level9.',
			parameters: {
				schemaId: 'sky-source-base64-snapshot-v1',
				uncompressedByteLength: sourceBytes.length,
				uncompressedSha256: sha256(sourceBytes),
			},
		});
		write('proof.json', {math: altitudeConvergenceProof(), sequence: altitudeAssessmentProof()});
		write('inputs.json', {
			schemaId: 'sky-altitude-assessment-inputs-v1',
			targetRun,
			caseId,
			original: original.input,
			frozenPrediction: target.prediction.prediction,
			targets: target.targets,
			sharedKnots: target.sharedKnots,
			prerequisites,
			p51ParentRun: p51Parent?.run ?? null,
			p51Targets: p51Parent?.targets ?? null,
			nextPredictionInput: nextInput,
		});
		write('assessment.json', assessment, {
			parents: [definition, ...target.identities],
			operation:
				'Replay every frozen per-group and vector 25 percent response gate, five-allowance magnitude significance rule and individual sign floor. Retain both P63 models and all failures.',
		});
		if (nextPrediction) {
			write(
				'prediction.json',
				{
					schemaId: 'sky-altitude-held-prediction-v1',
					registration: registration.seal,
					forecastPlan: plan,
					targetCaseId: 'altitude-p63',
					targetAlreadyExecuted: false,
					parentTargetRun: targetRun,
					prediction: nextPrediction,
				},
				{
					parents: [definition, ...target.identities, ...original.identities],
					operation:
						'Freeze F16=5F8/4-F4/4 and F16=F1/56-5F4/8+45F8/28 using original F1/F8 and exact admitted P51 F4. No P63 target or subsequent model selection enters the calculation.',
				},
			);
			nextPredictionWritten = true;
		} else if (isP51) {
			write('prediction-blocked.json', {
				schemaId: 'sky-altitude-next-prediction-blocked-v1',
				targetCaseId: 'altitude-p63',
				prerequisites,
				reason: 'A P63 forecast requires all P51 target envelopes and bounded shared J1/J2 knots to be admitted. The P51 assessment remains retained; no target-admitting prediction.json exists.',
			});
		}
		for (const source of [...parents, ...sources]) readRepository(source.path, source);
		await authenticateNode(registration.record.host.node);
	} catch (error) {
		failure = error instanceof Error ? error : new Error(String(error));
	}
	const cleanup = run.cleanup();
	try {
		write(
			'execution.json',
			{
				completed: failure === null,
				gpuJobsExecuted: 0,
				cleanup,
				failure: failure?.message ?? null,
				assessedTargetCaseId: caseId,
				nextPredictionCreated: nextPredictionWritten,
				prerequisites,
				parentsReauthenticated: failure === null,
				sourcesReauthenticated: failure === null,
				physicalReferenceAdequate: false,
			},
			undefined,
			true,
		);
	} catch (error) {
		failure = new Error((failure ? failure.message + '; ' : '') + String(error));
	}
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		extensionId: 'compensation-attribution-v1',
		extensionStage: outputCase,
		caseId: outputCase,
		assessedTargetCaseId: caseId,
		targetRun,
		nextPredictionCreated: nextPredictionWritten,
		nextForecastPrerequisites: prerequisites,
		models: assessment.models.map((model) => ({
			model: model.model,
			vector: model.vector.state,
			groups: model.allGroupMagnitudes,
		})),
		jobElapsedMilliseconds: Date.now() - started,
		allocatedBytes,
		gpuJobsExecuted: 0,
		physicalReferenceAdequate: false,
		failure: failure?.message ?? null,
	});
	assert.deepEqual(verifyRun(run.path), seal);
	const terminal = JSON.parse(readRepository(seal.path, seal).toString());
	assert.ok(seal.byteLength + terminal.artifacts.reduce((sum, row) => sum + row.byteLength, 0) <= allocatedBytes);
	if (failure) throw new Error('Altitude assessment failed in ' + run.path + ': ' + failure.message);
	return {run: run.path, seal, nextPredictionCreated: nextPredictionWritten};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	assert.equal(process.argv.length, 5);
	const [registrationRun, targetRun, caseId] = process.argv.slice(2);
	assertAltitudeTargetCase(caseId);
	console.log(JSON.stringify(await runAltitudeAssessment(registrationRun, targetRun, caseId)));
}
