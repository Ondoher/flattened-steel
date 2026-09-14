import assert from 'node:assert/strict';
import path from 'node:path';
import {browserSources, loadInputs} from '../../execution.mjs';
import {readRepository} from '../../io/files.mjs';
import {deriveProfile} from '../../numerics/profile.js';
import {readRegistration} from '../registration/run.mjs';
import {admitJob} from '../resources.mjs';
import {mechanismCase} from './cases.mjs';
import {
	acceptedMechanismInput,
	mechanismAllocationRun,
	mechanismArtifact,
	mechanismAttempts,
	readMechanismRegistration,
} from './registration.mjs';

/** Actual species source IDs, independently of the four spectral-order outputs.
 * @type {readonly string[]}
 */
export const densityFieldIds = ['J1', 'J2-rayleigh', 'J2-mie', 'J3-rayleigh', 'J3-mie', 'J4-rayleigh', 'J4-mie'];

/** Authenticate a held interaction prediction without reading a future target.
 * @param {string} predictionRun - Accepted immutable prediction run.
 * @param {DialContinuationRegistrationRead} registration - Original campaign.
 * @param {SkyMechanismRegistrationRead} caseRegistration - Exact prospective cases.
 * @param {SkyMechanismCase} candidate - Complete requested target.
 * @returns {SkyMechanismAcceptedRun} Accepted prediction with all declared parents authenticated.
 */
function predictionInput(predictionRun, registration, caseRegistration, candidate) {
	const input = acceptedMechanismInput(predictionRun),
		artifact = mechanismArtifact(input, 'prediction.json');
	const record = /** @type {SkyMechanismPrediction} */ (
		JSON.parse(readRepository(artifact.path, artifact).toString())
	);
	assert.equal(record.schemaId, 'sky-mechanism-prediction-v1');
	assert.deepEqual(record.registration, registration.seal);
	assert.deepEqual(record.mechanismRegistration, caseRegistration.seal);
	assert.equal(record.targetCaseId, candidate.id);
	assert.deepEqual(record.targetCase, candidate);
	assert.equal(record.model, 'additive');
	assert.equal(record.scope, 'screen');
	assert.equal(record.targetAlreadyExecuted, false);
	assert.deepEqual(record.viewIntervals, [8, 16]);
	assert.deepEqual(record.representations, ['grouped']);
	assert.deepEqual(record.channels, registration.record.scopes.screen.channels);
	assert.deepEqual(record.times, registration.record.scopes.screen.times);
	assert.equal(input.terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(input.terminal.recipe.parameters.jobKind, 'cpu');
	assert.equal(input.terminal.recipe.parameters.phase, 'C4');
	for (const parent of [
		record.registration,
		record.mechanismRegistration,
		record.parents.baseline,
		record.parents.first,
		record.parents.second,
	]) {
		assert.deepEqual(acceptedMechanismInput(path.posix.dirname(parent.path)).seal, parent);
		assert.ok(
			input.terminal.recipe.parents.some(
				(item) =>
					item.path === parent.path && item.sha256 === parent.sha256 && item.byteLength === parent.byteLength,
			),
			'Prediction omitted an exact source parent.',
		);
	}
	assert.equal(record.predictedSpectrumArtifacts.length, record.channels.length);
	assert.equal(new Set(record.predictedSpectrumArtifacts.map((item) => item.path)).size, record.channels.length);
	for (const predicted of record.predictedSpectrumArtifacts) {
		assert.equal(
			predicted.byteLength,
			2 * 4 * registration.record.scopes.screen.times.length * 81 * 8,
			'A prediction channel must contain every grouped view/order/screen ray as f64le.',
		);
		const authenticated = mechanismArtifact(input, path.posix.basename(predicted.path));
		assert.deepEqual(authenticated, predicted);
		readRepository(predicted.path, predicted);
	}
	assert.ok(record.sourceIdentities.length > 0);
	for (const source of record.sourceIdentities) readRepository(source.path, source);
	const predictionSequence = Number(path.posix.basename(input.run).slice(0, 5));
	for (const attempt of mechanismAttempts(registration.run).filter((item) => item.caseId === candidate.id))
		assert.ok(
			Number(path.posix.basename(attempt.run).slice(0, 5)) > predictionSequence,
			'The prediction was sealed after an attempted target.',
		);
	return input;
}

/** Authenticate a complete mechanism screen before allocating any output or GPU work.
 * @param {string} registrationRun - Original C0 registration.
 * @param {string} caseRegistrationRun - Prospective mechanism catalog.
 * @param {string} caseId - Exact C3/C4 case identity.
 * @param {SkyMechanismOptions} [options] - Explicit mandatory prediction where applicable.
 * @returns {SkyPreparedMechanism} Checked controls, source closure, and resource forecast.
 */
export function prepareMechanism(registrationRun, caseRegistrationRun, caseId, options = {}) {
	assert.ok(Object.keys(options).every((key) => ['predictionRun', 'allocationRun'].includes(key)));
	assert.equal(options.allocationRun ?? mechanismAllocationRun, mechanismAllocationRun);
	const registration = readRegistration(registrationRun),
		caseRegistration = readMechanismRegistration(registrationRun, caseRegistrationRun),
		candidate = mechanismCase(caseId),
		inputs = loadInputs();
	assert.deepEqual(
		caseRegistration.record.cases.find((item) => item.id === caseId),
		candidate,
	);
	const profile = deriveProfile(inputs.native48, candidate.controls),
		selection = registration.record.scopes.screen,
		admission = admitJob(registration, 'gpu', 'screen', 4 * 1024 ** 2, candidate.phase);
	assert.ok(admission.usage.allocationAmendment);
	assert.deepEqual(admission.usage.allocationAmendment.seal, caseRegistration.record.allocation);
	const attempts = mechanismAttempts(registration.run);
	assert.ok(
		!attempts.some((item) => item.caseId === candidate.id && item.state === 'accepted'),
		'This mechanism already has an accepted target.',
	);
	const phaseLimit = candidate.phase === 'C3' ? 10 : 4;
	assert.ok(
		attempts.filter((item) => item.phase === candidate.phase).length < phaseLimit,
		'The mechanism phase construction allowance is exhausted.',
	);
	const species = candidate.higherRepresentation !== 'combined-raw';
	const domains = profile.buildRequest.transportSpec.domains;
	const estimatedPeakFieldBytes = species
		? 4 *
			domains.position.count *
			domains.solarZenith.count *
			(domains.outgoing.directionCount + 3 * domains.incoming.directionCount)
		: profile.layout.estimatedPeakFieldBytes;
	assert.ok(
		estimatedPeakFieldBytes <= registration.budgets.scalarFieldBytes,
		'Sequential species fields exceed the scalar-memory cap.',
	);
	assert.equal(
		candidate.predictionRequired,
		typeof options.predictionRun === 'string',
		'Exactly the three joint cases require a prospective prediction parent.',
	);
	const prediction = options.predictionRun
		? predictionInput(options.predictionRun, registration, caseRegistration, candidate)
		: null;
	const browserModulePath = species
		? 'experiments/sky-accuracy-dials/continuation/mechanisms/browser.js'
		: 'experiments/sky-accuracy-dials/continuation/browser.js';
	const compilerModulePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
	/** @type {SkyGpuControl} */
	const control = {
		buildRequest: profile.buildRequest,
		controls: profile.controls,
		scenes: inputs.scenes.filter((scene) => selection.times.includes(scene.time)),
		channels: selection.channels,
		continuation: {
			finalFirstOrder: candidate.finalFirstOrder,
			higherRepresentation: candidate.higherRepresentation,
			referenceMode: candidate.referenceMode,
			probes: registration.probes,
			probeScenes: registration.probeScenes,
			groundDensityProbes: caseRegistration.record.groundDensityProbes,
		},
	};
	const sources = browserSources([browserModulePath, compilerModulePath]);
	return {
		registration,
		caseRegistration,
		candidate,
		profile,
		estimatedPeakFieldBytes,
		selection,
		admission,
		control,
		sources,
		browserModulePath,
		compilerModulePath,
		compilerReportSchema: species
			? 'sky-density-wavelength-result-v1'
			: 'algorithm32-distant-sun-offline-wavelength-result-v1',
		expectedFieldIds: species ? densityFieldIds : ['J1', 'J2', 'J3', 'J4'],
		prediction,
	};
}
