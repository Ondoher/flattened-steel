import assert from 'node:assert/strict';
import {identity, readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {secondOrderReplacement} from '../second-order-analysis/index.mjs';

const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/second-order-transfer-plan.md';

/** Select the original condition or authenticate the separately registered transfer.
 * Accepted evidence records do not suffice: the morning reference itself must
 * have every original outer/angular admission and uncertainty gate passed.
 * @param {DialContinuationRegistrationRead} registration
 * @param {string} [admissionRun]
 * @returns {SkySecondOrderCondition}
 */
export function readSecondOrderCondition(registration, admissionRun) {
	if (admissionRun === undefined)
		return {
			probeId: 'p-0930-5-7',
			time: '09:30',
			transferPlan: null,
			transferBytes: null,
			admissionRun: null,
			identities: [],
		};
	assert.ok(typeof admissionRun === 'string' && admissionRun.length > 0);
	const parent = acceptedMechanismInput(admissionRun);
	const parameters =
		/** @type {{continuationRegistration:string,caseId:string,numericalSources:readonly DialFileIdentity[],condition?:SkySecondOrderCondition}} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
	assert.equal(parameters.continuationRegistration, registration.run);
	assert.equal(parameters.caseId, 'second-order-angular-assessment');
	assert.ok(!parameters.condition?.transferPlan, 'The transfer admission must be the original morning reference.');
	assert.equal(
		/** @type {SkySecondOrderTransferTerminal} */ (/** @type {unknown} */ (parent.terminal)).result
			.referenceAdequate,
		true,
	);
	const artifact = mechanismArtifact(parent, 'reference-assessment.json');
	/** @type {SkySecondOrderTransferAdmissionDocument} */ const reference = JSON.parse(
		readRepository(artifact.path, artifact).toString(),
	);
	assert.equal(reference.schemaId, 'sky-second-order-reference-assessment-v1');
	assert.equal(reference.outerChecks.length, 12);
	assert.equal(reference.angularChecks.length, 10);
	assert.ok([...reference.outerChecks, ...reference.angularChecks].every((row) => row.state === 'passed'));
	assert.deepEqual(
		reference.channels.map((row) => row.channel),
		[0, 8],
	);
	for (const row of reference.channels) {
		assert.ok(
			row.adequate && row.state === 'passed' && row.outerAdmissionsComplete && row.angularAdmissionsComplete,
		);
		assert.ok(row.referenceWatts !== null && Number.isFinite(row.referenceWatts) && row.referenceWatts > 0);
		assert.ok(
			row.allowanceWatts !== null &&
				Number.isFinite(row.allowanceWatts) &&
				row.allowanceWatts >= 0 &&
				row.allowanceWatts <= 5e-5 &&
				row.allowanceWatts <= row.relativeThresholdWatts,
		);
	}
	assert.equal(parameters.numericalSources.length, 22);
	for (const source of parameters.numericalSources) readRepository(source.path, source);
	const transferBytes = readRepository(planPath),
		transferPlan = identity(planPath, transferBytes);
	assert.ok(
		transferBytes.toString().includes('compensation-attribution-v1') &&
			transferBytes.toString().includes('p-1230-3-5'),
	);
	return {
		probeId: 'p-1230-3-5',
		time: '12:30',
		transferPlan,
		transferBytes,
		admissionRun,
		identities: [parent.seal, artifact, transferPlan, ...parameters.numericalSources],
	};
}

/** Evaluate the held lower-reference and lost-compensation predictions.
 * Measurement values are fixed observations here; empirical allowances cover
 * numerical inputs only. Original effective third/fourth orders remain frozen.
 * @param {SkyOrderAttributionRow} row
 * @param {SkySecondOrderReferenceChannel} reference
 * @returns {SkySecondOrderTransferOutcome}
 */
export function assessSecondOrderTransferCompensation(row, reference) {
	assert.equal(row.probeId, 'p-1230-3-5');
	assert.equal(row.channel, reference.channel);
	assert.ok([0, 8].includes(row.channel));
	assert.ok(reference.referenceWatts !== null && Number.isFinite(reference.referenceWatts));
	assert.equal(row.allowances.length, 4);
	assert.ok(row.allowances.every((value) => value === null || (Number.isFinite(value) && value >= 0)));
	const replacement = secondOrderReplacement(
		row.physicalFirstResidual,
		row.contributions.slice(1),
		reference.referenceWatts,
	);
	const correctionAllowanceWatts =
		reference.allowanceWatts === null || row.allowances[1] === null
			? null
			: reference.allowanceWatts + row.allowances[1];
	const beforeResidualAllowanceWatts = row.allowances.some((value) => value === null)
		? null
		: row.allowances.reduce((sum, value) => sum + value, 0);
	const admitted = reference.adequate && correctionAllowanceWatts !== null && beforeResidualAllowanceWatts !== null;
	const delta = replacement.deltaWatts,
		e = replacement.beforeResidualWatts;
	const scoreAllowanceWattsSquared = !admitted
		? null
		: 2 * Math.abs(delta) * beforeResidualAllowanceWatts +
			2 * Math.abs(e + delta) * correctionAllowanceWatts +
			2 * beforeResidualAllowanceWatts * correctionAllowanceWatts +
			correctionAllowanceWatts ** 2;
	return {
		probeId: row.probeId,
		channel: row.channel,
		referenceAdequate: reference.adequate,
		replacement,
		correctionAllowanceWatts,
		beforeResidualAllowanceWatts,
		scoreAllowanceWattsSquared,
		referenceBelowH: !admitted ? 'unresolved' : delta < -correctionAllowanceWatts ? 'passed' : 'failed',
		negativeResidual: !admitted ? 'unresolved' : e < -beforeResidualAllowanceWatts ? 'passed' : 'failed',
		scoreWorsens: !admitted
			? 'unresolved'
			: delta < -correctionAllowanceWatts &&
				  e < -beforeResidualAllowanceWatts &&
				  replacement.squaredScoreChange > scoreAllowanceWattsSquared
				? 'passed'
				: 'failed',
	};
}

/** Exact manufactured sign, cancellation and score-bound checks.
 * @returns {{schemaId:string,checks:number}} Local algebra only.
 */
export function secondOrderTransferProof() {
	let checks = 0;
	const check = (/** @type {boolean} */ value) => {
		assert.ok(value);
		checks++;
	};
	/** @type {SkySecondOrderReferenceChannel} */ const ref = {
		channel: 0,
		referenceWatts: 0.01,
		allowanceWatts: 1e-7,
		originalHWatts: 0.015,
		contrastWatts: 0.005,
		absoluteThresholdWatts: 5e-5,
		relativeThresholdWatts: 0.001,
		outerAdmissionsComplete: true,
		angularAdmissionsComplete: true,
		outerChecksPassed: true,
		angularChecksPassed: true,
		adequate: true,
		state: 'passed',
		terms: {
			refinedIncidentAllowanceWatts: 0,
			refinedViewAllowanceWatts: 0,
			innerAllowanceWatts: 0,
			gaussDifferenceWatts: 0,
			gauss8InnerAllowanceWatts: 0,
			gauss4InnerAllowanceWatts: 0,
			gaussOuterAllowanceWatts: 0,
			simpsonDifferenceWatts: 0,
			simpson8InnerAllowanceWatts: 0,
			simpsonOuterAllowanceWatts: 0,
			outerAllowanceWatts: 0,
			angularAbsoluteCorrectionWatts: 0,
			angularIncidentAllowanceWatts: 0,
			angularViewAllowanceWatts: 0,
			angularAllowanceWatts: 0,
			mappedAbsoluteDifferenceWatts: 0,
			mappedIncidentAllowanceWatts: 0,
			mappedViewAllowanceWatts: 0,
			mappedAllowanceWatts: 0,
		},
	};
	/** @type {SkyOrderAttributionRow} */ const row = {
		probeId: 'p-1230-3-5',
		time: '12:30',
		channel: 0,
		physicalFirstResidual: -0.08,
		cumulative: [0.05, 0.065, 0.069, 0.071],
		contributions: [-0.08, 0.015, 0.004, 0.002],
		allowances: [1e-7, 2e-7, 1e-7, 1e-7],
		firstNumerical: 0.005,
		remaining: -0.059,
		cancellationContributions: [0, 0, 0, 0],
		identityResidual: 0,
	};
	const pass = assessSecondOrderTransferCompensation(row, ref);
	check(pass.referenceBelowH === 'passed');
	check(pass.negativeResidual === 'passed');
	check(pass.scoreWorsens === 'passed');
	check(pass.replacement.maximumSquaredIdentityResidual <= 1e-15);
	check(assessSecondOrderTransferCompensation(row, {...ref, adequate: false}).scoreWorsens === 'unresolved');
	check(
		assessSecondOrderTransferCompensation({...row, allowances: [null, 0, 0, 0]}, ref).referenceBelowH ===
			'unresolved',
	);
	check(assessSecondOrderTransferCompensation({...row, physicalFirstResidual: 0.08}, ref).scoreWorsens === 'failed');
	check(assessSecondOrderTransferCompensation(row, {...ref, referenceWatts: 0.02}).referenceBelowH === 'failed');
	check(assessSecondOrderTransferCompensation(row, {...ref, referenceWatts: 0.015}).scoreWorsens === 'failed');
	for (const de of [-1, 1])
		for (const dd of [-1, 1]) {
			const e = pass.replacement.beforeResidualWatts + de * pass.beforeResidualAllowanceWatts;
			const d = pass.replacement.deltaWatts + dd * pass.correctionAllowanceWatts;
			check(
				Math.abs(2 * e * d + d * d - pass.replacement.squaredScoreChange) <=
					pass.scoreAllowanceWattsSquared + 1e-17,
			);
		}
	return {schemaId: 'sky-second-order-transfer-proof-v1', checks};
}
