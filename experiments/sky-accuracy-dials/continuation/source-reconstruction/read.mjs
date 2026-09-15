import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readSourceAuditInput} from '../source-column-audit/read.mjs';
import {
	sourceAuditGeometry,
	admitSourceAuditReference,
	sourceAuditTau,
	assessSourceAudit,
} from '../source-column-audit/index.mjs';
import {reconstructionValue} from './index.mjs';

/** Authenticate immutable source audit inputs and only the unchanged numerical
 * collaborators used here. The original full source snapshot stays a retained
 * parent; unrelated later ground-boundary/sequence edits are not executed here.
 * @param {DialContinuationRegistrationRead} registration @param {string} predictionRun @param {string} targetRun
 * @returns {SkySourceReconstructionInput}
 */
export function readSourceReconstruction(registration, predictionRun, targetRun) {
	const predicted = acceptedMechanismInput(predictionRun),
		target = acceptedMechanismInput(targetRun);
	const definitions = [
		{parent: predicted, caseId: 'source-column-predict'},
		{parent: target, caseId: 'source-column-s160'},
	];
	/** @type {DialFileIdentity[]} */ const identities = [predicted.seal, target.seal];
	/** @type {DialFileIdentity[]} */ const relevantSources = [];
	for (const {parent, caseId} of definitions) {
		const params =
			/** @type {{continuationRegistration:string,caseId:string,jobKind:string,phase:string,sourceIdentities:readonly DialFileIdentity[]}} */ (
				/** @type {unknown} */ (parent.terminal.recipe.parameters)
			);
		assert.equal(params.continuationRegistration, registration.run);
		assert.equal(params.caseId, caseId);
		assert.equal(params.jobKind, 'cpu');
		assert.equal(params.phase, 'C5');
		const selected = params.sourceIdentities.filter(
			(id) =>
				id.path.startsWith('experiments/sky-accuracy-dials/numerics/') ||
				id.path.startsWith('experiments/sky-accuracy-dials/continuation/source-column-audit/') ||
				id.path.startsWith('experiments/sky-accuracy-dials/continuation/reference/') ||
				id.path.startsWith('experiments/sky-accuracy-dials/continuation/volume-reference/') ||
				id.path === 'experiments/sky-accuracy-dials/continuation/cases.mjs',
		);
		for (const suffix of [
			'/numerics/direct.js',
			'/numerics/math.js',
			'/numerics/view.js',
			'/source-column-audit/index.mjs',
			'/source-column-audit/read.mjs',
			'/reference/physical/columns.mjs',
			'/volume-reference/method.mjs',
			'/volume-reference/geometry.mjs',
		])
			assert.ok(
				selected.some((id) => id.path.endsWith(suffix)),
				'Missing relevant numerical source ' + suffix,
			);
		for (const id of selected) readRepository(id.path, id);
		if (relevantSources.length) assert.deepEqual(selected, relevantSources);
		else relevantSources.push(...selected);
	}
	const inputId = mechanismArtifact(predicted, 'inputs.json'),
		targetInputId = mechanismArtifact(target, 'inputs.json');
	const input = /** @type {SkySourceAuditInput} */ (JSON.parse(readRepository(inputId.path, inputId).toString()));
	assert.deepEqual(JSON.parse(readRepository(targetInputId.path, targetInputId).toString()), input);
	const reconstructed = readSourceAuditInput(registration);
	assert.deepEqual(input, reconstructed.input);
	identities.push(inputId, targetInputId, ...reconstructed.identities, ...relevantSources);
	const predictionId = mechanismArtifact(predicted, 'prediction.json'),
		targetId = mechanismArtifact(target, 'target.json'),
		assessmentId = mechanismArtifact(target, 'assessment.json');
	const prediction = /** @type {SkySourceAuditPredictionRecord} */ (
		JSON.parse(readRepository(predictionId.path, predictionId).toString())
	);
	const finite = /** @type {SkySourceReconstructionTarget} */ (
		JSON.parse(readRepository(targetId.path, targetId).toString())
	);
	const assessment = /** @type {SkySourceReconstructionAssessment} */ (
		JSON.parse(readRepository(assessmentId.path, assessmentId).toString())
	);
	assert.equal(prediction.schemaId, 'sky-source-column-prediction-v1');
	assert.deepEqual(prediction.registration, registration.seal);
	assert.equal(prediction.targetAlreadyExecuted, false);
	assert.equal(finite.schemaId, 'sky-source-column-target-v1');
	assert.equal(finite.predictionRun, predictionRun);
	assert.equal(assessment.schemaId, 'sky-source-column-assessment-v1');
	assert.equal(assessment.predictionRun, predictionRun);
	assert.equal(prediction.rows.length, 48);
	assert.equal(finite.rows.length, 48);
	assert.equal(assessment.rows.length, 96);
	assert.deepEqual(
		prediction.rows.map((row) => row.coordinate),
		input.coordinates,
	);
	readRepository(prediction.forecastPlan.path, prediction.forecastPlan);
	identities.push(predictionId, targetId, assessmentId, prediction.forecastPlan);
	const originalSnapshot = mechanismArtifact(predicted, 'sources.json.gz');
	identities.push(originalSnapshot, mechanismArtifact(target, 'sources.json.gz'));
	/** @type {SkySourceReconstructionColumn[]} */ const columns = [];
	const spec = input.buildRequest.transportSpec;
	for (let index = 0; index < prediction.rows.length; index++) {
		const row = prediction.rows[index],
			held = finite.rows[index];
		assert.equal(held.coordinateId, row.coordinate.id);
		assert.equal(row.baseline.intervals, 80);
		assert.equal(held.finite.intervals, 160);
		assert.deepEqual(row.geometry, sourceAuditGeometry(spec, row.coordinate));
		for (const channel of [0, 8]) {
			const forecast = row.forecasts.find((item) => item.channel === channel);
			assert.ok(forecast);
			const reference = admitSourceAuditReference(spec, row.geometry, row.passes, channel);
			assert.deepEqual(reference, forecast.reference);
			assert.ok(
				reference.resolved && reference.transmission !== null && reference.transmissionAllowance !== null,
			);
			const s80 = Math.exp(-sourceAuditTau(spec, row.baseline, channel));
			assert.equal(s80, forecast.baselineTransmission);
			const targetTau = sourceAuditTau(spec, held.finite, channel),
				checked = assessSourceAudit(forecast, targetTau);
			const retained = assessment.rows.find(
				(item) => item.coordinateId === row.coordinate.id && item.channel === channel,
			);
			assert.deepEqual(checked, retained);
			assert.ok(Object.values(checked.checks).every((state) => state === 'passed'));
			const s160 = Math.exp(-targetTau);
			columns.push({
				coordinate: row.coordinate,
				channel,
				s80: reconstructionValue(s80, 64 * Number.EPSILON * Math.abs(s80)),
				s160: reconstructionValue(s160, 64 * Number.EPSILON * Math.abs(s160)),
				reference: reconstructionValue(reference.transmission, reference.transmissionAllowance),
			});
		}
	}
	assert.equal(columns.length, 96);
	assert.equal(input.samples.length, 32);
	assert.deepEqual(
		input.rays.map((row) => row.probeId),
		['p-0930-5-7', 'p-1230-3-5'],
	);
	return {
		input,
		columns,
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
		compatibility: {relevantSources, originalSnapshot},
	};
}
