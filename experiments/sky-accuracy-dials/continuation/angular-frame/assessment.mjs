import assert from 'node:assert/strict';
import {
	reconstructionValue as value,
	reconstructionSum as sum,
	reconstructionDifference as difference,
} from '../source-reconstruction/index.mjs';
import {phaseMagnitudeGate} from '../source-reconstruction/phase.mjs';

const roles = /** @type {const} */ (['original', 'candidate', 'sun16', 'sun32', 'radial32', 'radial64']);
const components = /** @type {const} */ ([
	'atmosphereRayleigh',
	'atmosphereMie',
	'groundRayleigh',
	'groundMie',
	'combined',
]);
const stages = /** @type {const} */ (['pilot', 'sun16', 'sun32', 'radial32', 'radial64']);

/** Propagate both independent-coordinate refinement uncertainty and incident
 * input allowances; no finest angular rule becomes an oracle by declaration.
 * @param {number} channel @param {SkyAngularFrameComponent} component
 * @param {Readonly<Record<SkyAngularFrameRole,SkySourceReconstructionValue>>} values
 * @returns {SkyAngularFrameComponentAssessment}
 */
function assessComponent(channel, component, values) {
	for (const role of roles) value(values[role].value, values[role].allowance);
	const refinementChanges = [
		difference(values.sun32, values.sun16),
		difference(values.radial64, values.radial32),
		difference(values.sun32, values.radial64),
	];
	const angularCentralAllowance = 2 * Math.max(...refinementChanges.map((v) => Math.abs(v.value)));
	const boundedAngular = 2 * Math.max(...refinementChanges.map((v) => Math.abs(v.value) + v.allowance));
	const centre = sum([values.sun32, values.radial64], [0.5, 0.5]);
	const reference = value(centre.value, centre.allowance + boundedAngular);
	const errors = /** @type {Record<SkyAngularFrameRole,SkySourceReconstructionValue>} */ (
		Object.fromEntries(roles.map((role) => [role, difference(values[role], reference)]))
	);
	const coarseLower = Math.abs(errors.original.value) - errors.original.allowance;
	const referenceAdmitted =
		coarseLower <= 0 ? 'unresolved' : reference.allowance <= 0.1 * coarseLower ? 'passed' : 'failed';
	const response = difference(values.candidate, values.original);
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
			negative:
				response.value < -response.allowance
					? 'passed'
					: response.value > response.allowance
						? 'failed'
						: 'unresolved',
			candidate80:
				referenceAdmitted === 'passed'
					? phaseMagnitudeGate(errors.candidate, errors.original, 0.2)
					: 'unresolved',
			refinement50:
				referenceAdmitted === 'passed' ? phaseMagnitudeGate(errors.sun16, errors.candidate, 0.5) : 'unresolved',
		},
	};
}

/** @param {readonly SkyVolumeJ2Row[]} rows @param {number} channel @param {SkyAngularFrameComponent} component
 * @returns {SkySourceReconstructionValue}
 */
function estimate(rows, channel, component) {
	const row = rows.find((r) => r.channel === channel);
	assert.ok(row);
	const selected = row[component];
	assert.ok(selected.resolved && selected.mean !== null && selected.incidentAllowance !== null);
	return value(selected.mean, selected.incidentAllowance + row.arithmeticAllowance);
}

/** All required data are immutable accepted records from the same registered point.
 * Partial reference packages remain explicitly unqualified.
 * @param {SkyAngularFrameInput} input @param {readonly SkyAngularFrameRunEntry[]} entries
 * @returns {SkyAngularFrameAssessment}
 */
export function assessAngularFrame(input, entries) {
	const selected = stages.map((stage) => {
		const matches = entries.filter(
			(entry) =>
				entry.document?.stage === stage && entry.terminal.state === 'accepted' && entry.document.matrixComplete,
		);
		assert.ok(matches.length <= 1, 'Ambiguous completed angular frame stage ' + stage);
		return matches[0]?.document;
	});
	const missingOrIncomplete = stages.filter((_, i) => !selected[i]);
	if (missingOrIncomplete.length)
		return {
			schemaId: 'sky-angular-frame-assessment-v1',
			packageId: 'angular-frame-morning-v1',
			allStagesComplete: false,
			missingOrIncomplete,
			components: [],
			predicates: Array(6).fill('unresolved'),
		};
	for (const document of selected) {
		assert.ok(document);
		assert.deepEqual(document.target, input.target);
		assert.deepEqual(document.channels, [0, 8]);
		assert.ok(document.rows);
	}
	const original = input.baseline.find((r) => r.id === 'r8-a16');
	assert.ok(original);
	const result = [0, 8].flatMap((channel) =>
		components.map((component) => {
			const values = /** @type {Record<SkyAngularFrameRole,SkySourceReconstructionValue>} */ (
				Object.fromEntries(
					roles.map((role, index) => {
						if (role === 'original') return [role, estimate(original.rows, channel, component)];
						const rows = selected[index - 1]?.rows;
						assert.ok(rows);
						return [role, estimate(rows, channel, component)];
					}),
				)
			);
			return assessComponent(channel, component, values);
		}),
	);
	const predicates = result.filter((r) => r.component === 'combined').flatMap((r) => Object.values(r.checks));
	assert.equal(predicates.length, 6);
	return {
		schemaId: 'sky-angular-frame-assessment-v1',
		packageId: 'angular-frame-morning-v1',
		allStagesComplete: true,
		missingOrIncomplete: [],
		components: result,
		predicates,
	};
}

/** @returns {{checks:number,scope:string}} */
export function angularFrameAssessmentProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Angular frame assessment proof ' + (checks + 1));
		checks++;
	}
	const base = {
		original: value(1.1, 1e-8),
		candidate: value(1.01, 1e-8),
		sun16: value(1.00001, 1e-8),
		sun32: value(1, 1e-8),
		radial32: value(1.00001, 1e-8),
		radial64: value(1, 1e-8),
	};
	const passed = assessComponent(0, 'combined', base);
	check(passed.referenceAdmitted === 'passed');
	check(Object.values(passed.checks).every((s) => s === 'passed'));
	check(passed.angularCentralAllowance > 0);
	check(passed.angularInputAllowance > 0);
	const opposite = assessComponent(0, 'combined', {...base, candidate: value(0.8, 1e-8)});
	check(opposite.checks.negative === 'passed');
	check(opposite.checks.candidate80 === 'failed');
	const worse = assessComponent(0, 'combined', {...base, candidate: value(1.2, 1e-8)});
	check(worse.checks.negative === 'failed');
	check(worse.checks.candidate80 === 'failed');
	const uncertain = assessComponent(0, 'combined', {...base, sun32: value(1, 0.1)});
	check(uncertain.referenceAdmitted !== 'passed');
	check(uncertain.checks.candidate80 === 'unresolved');
	check(uncertain.checks.refinement50 === 'unresolved');
	const divergent = assessComponent(0, 'combined', {...base, radial32: value(0.95, 1e-8)});
	check(divergent.referenceAdmitted !== 'passed');
	check(divergent.reference.allowance > 0.1);
	const zero = assessComponent(
		0,
		'groundMie',
		/** @type {Record<SkyAngularFrameRole,SkySourceReconstructionValue>} */ (
			Object.fromEntries(roles.map((r) => [r, value(0)]))
		),
	);
	check(zero.referenceAdmitted === 'unresolved');
	check(Object.values(zero.checks).every((s) => s === 'unresolved'));
	return {
		checks,
		scope: 'Manufactured independent-coordinate reference admission, propagated incident uncertainty, compensating-sign traps, contrary convergence and unresolved zero controls.',
	};
}

/** @param {SkyAngularFrameAssessment} result @returns {string} */
export function angularFrameAssessmentReport(result) {
	return [
		'# Atmospheric angular-frame assessment',
		'',
		'Fixed morning h1000, channels0/8. Values are second-order scattering densities in W m^-3 sr^-1 nm^-1. Reference allowances are empirical and include incident uncertainty.',
		'',
		...(result.allStagesComplete
			? []
			: [
					'Required references are missing or incomplete: ' +
						result.missingOrIncomplete.join(', ') +
						'. No absolute angular accuracy is qualified.',
					'',
				]),
		'| Channel | Component | Reference | Reference allowance | Original error | Candidate error | Sun16 error | Reference admitted | Negative response | Candidate >=80% | Sun16 >=50% |',
		'| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |',
		...result.components.map(
			(r) =>
				'| ' +
				[
					r.channel,
					r.component,
					r.reference.value,
					r.reference.allowance,
					r.errors.original.value,
					r.errors.candidate.value,
					r.errors.sun16.value,
					r.referenceAdmitted,
					...Object.values(r.checks),
				].join(' | ') +
				' |',
		),
		'',
		'Only the two combined rows supply the six registered predictions. Every physical component is retained to expose compensating changes. This does not qualify another geometry, complete viewing radiance, later-order recurrence, production arithmetic or Kider agreement.',
		'',
	].join('\n');
}
