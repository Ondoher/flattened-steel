import assert from 'node:assert/strict';
import {createPhysicalMethodBudget, integrateColumns} from '../reference/physical/columns.mjs';
import {volumeAttenuation} from '../volume-reference/method.mjs';
import {viewAngularRules} from './geometry.mjs';

/** Explicit order shared by component summation and reporting. @type {readonly SkySecondOrderComponent[]} */
export const viewComponents = Object.freeze([
	'atmosphereRayleigh',
	'atmosphereMie',
	'groundRayleigh',
	'groundMie',
	'combined',
]);

/** Resolve observer-to-point attenuation independently of all incident L1 paths.
 * Uses the unchanged column tolerance law in optical-depth units, with separate
 * coarse/fine and independent-method comparisons. The allowance is empirical.
 * @param {SkyTransportSpec} spec - Matched physical atmosphere.
 * @param {SkySecondOrderViewNode} node - Positive-height original-view query.
 * @param {readonly number[]} channels - Selected spectral indices.
 * @param {() => void} [guard] - Caller resource and heartbeat guard.
 * @returns {SkySecondOrderTransmission} Complete columns and admitted attenuation.
 */
export function secondOrderViewTransmission(spec, node, channels, guard) {
	/** @type {SkySecondOrderViewColumns[]} */ const columns = [];
	/** @type {SkyPhysicalReferenceMethod[]} */ const methods = ['gauss', 'simpson'];
	for (const method of methods) {
		const budget = createPhysicalMethodBudget(method, 'simpson-expanded-medium', guard);
		for (const toleranceScale of [4, 1]) {
			budget.toleranceScale = toleranceScale;
			columns.push({
				method,
				toleranceScale,
				columns: integrateColumns(
					spec,
					node.surfaceOrigin,
					node.direction,
					node.distanceMeters,
					method,
					budget,
				),
			});
		}
	}
	return {
		columns,
		mediumEvaluations: columns.reduce((sum, row) => sum + row.columns.evaluations, 0),
		channels: channels.map((channel) => {
			assert.ok(Number.isInteger(channel) && channel >= 0 && channel < spec.domains.spectrum.channels.length);
			const spectral = spec.domains.spectrum.channels[channel];
			const available = columns.every(
				({columns: row}) =>
					row.converged &&
					[row.rayleighMeters, row.mieMeters, row.errorRayleighMeters, row.errorMieMeters].every(
						(value) => value !== null && Number.isFinite(value) && value >= 0,
					),
			);
			if (!available) return {channel, gauss: null, simpson: null, mean: null, allowance: null, resolved: false};
			const tau = columns.map(
				({columns: row}) =>
					spectral.rayleighScatteringPerMeter * row.rayleighMeters +
					spectral.mieExtinctionPerMeter * row.mieMeters,
			);
			const error = columns.map(
				({columns: row}) =>
					spectral.rayleighScatteringPerMeter * row.errorRayleighMeters +
					spectral.mieExtinctionPerMeter * row.errorMieMeters,
			);
			const tolerance = tau.map((value) => 1e-9 + 1e-8 * Math.abs(value));
			const resolved =
				error.every((value, index) => value <= columns[index].toleranceScale * tolerance[index]) &&
				Math.abs(tau[0] - tau[1]) <= 4 * tolerance[0] + tolerance[1] &&
				Math.abs(tau[2] - tau[3]) <= 4 * tolerance[2] + tolerance[3] &&
				Math.abs(tau[1] - tau[3]) <= tolerance[1] + tolerance[3];
			const gauss = volumeAttenuation(tau[1], error[1]),
				simpson = volumeAttenuation(tau[3], error[3]);
			const pass = Math.max(
				Math.abs(Math.exp(-tau[0]) - gauss.value),
				Math.abs(Math.exp(-tau[2]) - simpson.value),
			);
			return {
				channel,
				gauss: resolved ? gauss.value : null,
				simpson: resolved ? simpson.value : null,
				mean: resolved ? (gauss.value + simpson.value) / 2 : null,
				allowance: resolved
					? gauss.allowance + simpson.allowance + Math.abs(gauss.value - simpson.value) + pass
					: null,
				resolved,
			};
		}),
	};
}

/** Integrate complete physical intervals, never silently treating a missing node as zero.
 * @param {readonly SkySecondOrderViewNode[]} nodes - Complete frozen outer rule.
 * @param {readonly SkySecondOrderPoint[]} points - Actual completed or reused points.
 * @param {readonly number[]} channels - Exact selected spectrum.
 * @returns {SkySecondOrderIntegral[]} Three angular-rule estimates and separate inner allowances.
 */
export function integrateSecondOrderView(nodes, points, channels) {
	assert.equal(new Set(nodes.map((node) => node.id)).size, nodes.length);
	assert.equal(new Set(points.map((point) => point.node.id)).size, points.length);
	for (const point of points)
		assert.deepEqual(
			point.node,
			nodes.find((node) => node.id === point.node.id),
		);
	/** @type {(number|'all')[]} */ const intervals = ['all', ...new Set(nodes.map((node) => node.interval))];
	/** @type {SkySecondOrderIntegral[]} */ const integrals = [];
	for (const interval of intervals)
		for (const channel of channels)
			for (const rule of viewAngularRules)
				for (const component of viewComponents) {
					let complete = true,
						valueWatts = 0,
						incidentAllowanceWatts = 0,
						viewAllowanceWatts = 0;
					const selected = nodes.filter((node) => interval === 'all' || node.interval === interval);
					for (const node of selected) {
						const point = points.find((row) => row.node.id === node.id),
							angular = point?.angular.find((row) => row.rule === rule);
						const source = angular?.rows.find((row) => row.channel === channel)?.[component],
							transmission = point?.transmission.channels.find((row) => row.channel === channel);
						if (
							!angular?.geometryPassed ||
							!angular.incidentsPassed ||
							!source?.resolved ||
							!transmission?.resolved
						) {
							complete = false;
							continue;
						}
						assert.ok(
							[
								source.mean,
								source.incidentAllowance,
								transmission.mean,
								transmission.allowance,
								node.weightMeters,
							].every((value) => value !== null && Number.isFinite(value) && value >= 0),
						);
						valueWatts += node.weightMeters * source.mean * transmission.mean;
						incidentAllowanceWatts += node.weightMeters * transmission.mean * source.incidentAllowance;
						viewAllowanceWatts +=
							node.weightMeters * (source.mean + source.incidentAllowance) * transmission.allowance;
					}
					integrals.push({
						interval,
						channel,
						rule,
						component,
						complete,
						valueWatts: complete ? valueWatts : null,
						incidentAllowanceWatts: complete ? incidentAllowanceWatts : null,
						viewAllowanceWatts: complete ? viewAllowanceWatts : null,
					});
				}
	return integrals;
}

/** Assess actual per-point admissions and identities before any reference interpretation.
 * @param {readonly SkySecondOrderPoint[]} points - Only actually evaluated points.
 * @returns {SkySecondOrderCheck[]} Explicit predictions, separate from outer/angular adequacy.
 */
export function secondOrderPointChecks(points) {
	/** @type {SkySecondOrderCheck[]} */ const checks = [];
	for (const point of points) {
		checks.push({
			id: `${point.node.id}:view-attenuation`,
			state: point.transmission.channels.every((row) => row.resolved) ? 'passed' : 'unresolved',
		});
		for (const angular of point.angular) {
			checks.push({
				id: `${point.node.id}:${angular.rule}:geometry`,
				state: angular.geometryPassed ? 'passed' : 'failed',
			});
			checks.push({
				id: `${point.node.id}:${angular.rule}:incident-admission`,
				state: angular.incidentsPassed ? 'passed' : 'unresolved',
			});
			for (const row of angular.rows)
				checks.push({
					id: `${point.node.id}:${angular.rule}:ch${row.channel}:component-identity`,
					state: row.sumIdentityPassed ? 'passed' : row.combined.resolved ? 'failed' : 'unresolved',
				});
		}
	}
	return checks;
}
