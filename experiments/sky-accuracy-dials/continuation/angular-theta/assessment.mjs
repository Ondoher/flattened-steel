import assert from 'node:assert/strict';
import {
	reconstructionValue as value,
	reconstructionSum as sum,
	reconstructionDifference as difference,
} from '../source-reconstruction/index.mjs';
import {phaseMagnitudeGate} from '../source-reconstruction/phase.mjs';

const roles = /** @type {const} */ (['mu16', 'theta16', 'theta32', 'radial32', 'radial64']);
const components = /** @type {const} */ ([
	'atmosphereRayleigh',
	'atmosphereMie',
	'groundRayleigh',
	'groundMie',
	'combined',
]);

/** Keep independent-coordinate and incident uncertainty in every comparison.
 * @param {number} channel @param {SkyAngularFrameComponent} component
 * @param {Readonly<Record<SkyAngularThetaRole,SkySourceReconstructionValue>>} values
 * @returns {SkyAngularThetaComponent}
 */
function assessComponent(channel, component, values) {
	for (const role of roles) value(values[role].value, values[role].allowance);
	const refinementChanges = [
		difference(values.theta32, values.theta16),
		difference(values.radial64, values.radial32),
		difference(values.theta32, values.radial64),
	];
	const angularCentralAllowance = 2 * Math.max(...refinementChanges.map((v) => Math.abs(v.value)));
	const boundedAngular = 2 * Math.max(...refinementChanges.map((v) => Math.abs(v.value) + v.allowance));
	const centre = sum([values.theta32, values.radial64], [0.5, 0.5]);
	const reference = value(centre.value, centre.allowance + boundedAngular);
	const errors = /** @type {Record<SkyAngularThetaRole,SkySourceReconstructionValue>} */ (
		Object.fromEntries(roles.map((role) => [role, difference(values[role], reference)]))
	);
	const lower = Math.abs(errors.mu16.value) - errors.mu16.allowance;
	const referenceAdmitted = lower <= 0 ? 'unresolved' : reference.allowance <= 0.1 * lower ? 'passed' : 'failed';
	const response = difference(values.theta16, values.mu16);
	return {
		channel,
		component,
		values,
		reference,
		angularCentralAllowance,
		angularInputAllowance: boundedAngular - angularCentralAllowance,
		refinementChanges,
		errors,
		response,
		referenceAdmitted,
		checks: {
			positive:
				response.value > response.allowance
					? 'passed'
					: response.value < -response.allowance
						? 'failed'
						: 'unresolved',
			candidate80:
				referenceAdmitted === 'passed' ? phaseMagnitudeGate(errors.theta16, errors.mu16, 0.2) : 'unresolved',
		},
	};
}

/** @param {readonly SkyVolumeJ2Row[]} rows @param {number} channel
 * @param {SkyAngularFrameComponent} component @returns {SkySourceReconstructionValue}
 */
function estimate(rows, channel, component) {
	const row = rows.find((r) => r.channel === channel);
	assert.ok(row);
	const selected = row[component];
	assert.ok(selected.resolved && selected.mean !== null && selected.incidentAllowance !== null);
	return value(selected.mean, selected.incidentAllowance + row.arithmeticAllowance);
}

/** Only authenticated accepted-complete documents may be passed by the runner.
 * Missing/failed stages retain four unresolved predictions.
 * @param {SkyAngularThetaInput} input @param {SkyAngularThetaDocument|null} pilot
 * @param {SkyAngularThetaDocument|null} fine @returns {SkyAngularThetaAssessment}
 */
export function assessTheta(input, pilot, fine) {
	/** @type {SkyAngularThetaStage[]} */ const missingOrIncomplete = [];
	if (!pilot?.matrixComplete) missingOrIncomplete.push('pilot');
	if (!fine?.matrixComplete) missingOrIncomplete.push('fine');
	if (missingOrIncomplete.length)
		return {
			schemaId: 'sky-angular-theta-assessment-v1',
			packageId: 'angular-theta-attribution-v1',
			allStagesComplete: false,
			missingOrIncomplete,
			components: [],
			predicates: ['unresolved', 'unresolved', 'unresolved', 'unresolved'],
		};
	assert.ok(pilot && fine);
	for (const [document, stage] of /** @type {const} */ ([
		[pilot, 'pilot'],
		[fine, 'fine'],
	])) {
		assert.equal(document.schemaId, 'sky-angular-theta-stage-v1');
		assert.equal(document.packageId, 'angular-theta-attribution-v1');
		assert.equal(document.stage, stage);
		assert.deepEqual(document.target, input.target);
		assert.deepEqual(document.channels, [0, 8]);
		assert.ok(document.rows && !document.partialCountsUnavailable);
	}
	assert.ok(pilot.rows && fine.rows);
	const selected = {
		mu16: input.mu16,
		theta16: pilot.rows,
		theta32: fine.rows,
		radial32: input.radial32,
		radial64: input.radial64,
	};
	const result = [0, 8].flatMap((channel) =>
		components.map((component) => {
			const values = /** @type {Record<SkyAngularThetaRole,SkySourceReconstructionValue>} */ (
				Object.fromEntries(roles.map((role) => [role, estimate(selected[role], channel, component)]))
			);
			return assessComponent(channel, component, values);
		}),
	);
	const predicates = result.filter((r) => r.component === 'combined').flatMap((r) => Object.values(r.checks));
	assert.equal(predicates.length, 4);
	return {
		schemaId: 'sky-angular-theta-assessment-v1',
		packageId: 'angular-theta-attribution-v1',
		allStagesComplete: true,
		missingOrIncomplete: [],
		components: result,
		predicates,
	};
}

/** Analytic comparisons cover improvement, wrong-sign response,
 * inadequate independent reference, and a coherent shifted reference.
 * @returns {{checks:number,scope:string}}
 */
export function thetaAssessmentProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Theta assessment proof ' + (checks + 1));
		checks++;
	}
	const base = {
		mu16: value(0.9, 1e-8),
		theta16: value(0.99999, 1e-8),
		theta32: value(1, 1e-8),
		radial32: value(1.00001, 1e-8),
		radial64: value(1, 1e-8),
	};
	const good = assessComponent(0, 'combined', base);
	check(good.referenceAdmitted === 'passed');
	check(Object.values(good.checks).every((s) => s === 'passed'));
	check(good.angularCentralAllowance > 0 && good.angularInputAllowance > 0);
	const wrong = assessComponent(0, 'combined', {...base, theta16: value(0.8, 1e-8)});
	check(wrong.checks.positive === 'failed');
	check(wrong.referenceAdmitted !== 'passed' && wrong.checks.candidate80 === 'unresolved');
	const shifted = assessComponent(0, 'combined', {
		mu16: value(0.99),
		theta16: value(1.1),
		theta32: value(1.1),
		radial32: value(1.1),
		radial64: value(1.1),
	});
	check(shifted.checks.positive === 'passed' && shifted.checks.candidate80 === 'passed');
	const biased = assessComponent(0, 'combined', {...base, theta32: value(1.2)});
	check(biased.referenceAdmitted === 'unresolved' && biased.checks.candidate80 === 'unresolved');
	const uncertain = assessComponent(0, 'combined', {...base, radial64: value(1, 0.1)});
	check(uncertain.referenceAdmitted !== 'passed' && uncertain.checks.candidate80 === 'unresolved');
	const zero = assessComponent(
		0,
		'groundMie',
		/** @type {Record<SkyAngularThetaRole,SkySourceReconstructionValue>} */ (
			Object.fromEntries(roles.map((role) => [role, value(0)]))
		),
	);
	check(zero.referenceAdmitted === 'unresolved');
	check(Object.values(zero.checks).every((s) => s === 'unresolved'));
	check(good.reference.allowance > 0 && good.errors.theta16.allowance > good.reference.allowance);
	return {
		checks,
		scope: 'Manufactured independent-coordinate admission, propagated incident allowances, response versus accuracy, shared-reference limits and zero-component ambiguity.',
	};
}

/** @param {SkyAngularThetaAssessment} result @returns {string} */
export function thetaAssessmentReport(result) {
	return [
		'# Atmospheric theta-coordinate attribution',
		'',
		'Fixed morning h1000, channels0/8; scattering densities in W m^-3 sr^-1 nm^-1. Empirical reference allowances include independent-coordinate refinement and incident uncertainty.',
		'',
		...(result.allStagesComplete
			? []
			: [
					'Missing/incomplete stages: ' +
						result.missingOrIncomplete.join(', ') +
						'. Accuracy remains unresolved.',
					'',
				]),
		'| Channel | Component | Reference | Reference allowance | Matched mu16 error | Theta16 error | Reference admitted | Positive response | At least80% reduction |',
		'| ---: | --- | ---: | ---: | ---: | ---: | --- | --- | --- |',
		...result.components.map(
			(r) =>
				'| ' +
				[
					r.channel,
					r.component,
					r.reference.value,
					r.reference.allowance,
					r.errors.mu16.value,
					r.errors.theta16.value,
					r.referenceAdmitted,
					r.checks.positive,
					r.checks.candidate80,
				].join(' | ') +
				' |',
		),
		'',
		'Only the two combined rows supply the four registered predictions. Physical components remain explicit. This does not qualify another geometry, complete viewing radiance, later recurrence, GPU arithmetic or Kider agreement.',
		'',
	].join('\n');
}
