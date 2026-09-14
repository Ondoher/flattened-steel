import assert from 'node:assert/strict';
import {createProductQuadrature} from '../../numerics/profile.js';
import {dot, unit} from '../../numerics/math.js';
import {componentGauss, incidentGroups, localJ2Rules} from './angular.mjs';
import {accumulateNode, angularEnvelopes, createSums} from './evaluate.mjs';
import {localJ2FiniteControls} from './finite.mjs';

/** Verify fixed angular admission, positive coverage, moments and reflection algebra.
 * No physical benchmark ray or cache is evaluated.
 * @returns {SkyJ2Proof} Measured manufactured discrepancies and assertion count.
 */
export function localJ2Proof() {
	let checks = 0,
		maximumMomentError = 0,
		maximumSolidAngleError = 0;
	for (const count of [16, 32, 64]) {
		const nodes = componentGauss(count);
		for (let degree = 0; degree < 2 * count; degree++) {
			const observed = nodes.reduce((sum, node) => sum + node.weight * node.node ** degree, 0);
			const error = Math.abs(observed - (degree % 2 === 0 ? 2 / (degree + 1) : 0));
			maximumMomentError = Math.max(maximumMomentError, error);
			assert.ok(error < 3e-14);
			checks++;
		}
	}
	for (const rule of localJ2Rules) {
		const groups = incidentGroups(rule),
			expanded = groups.flatMap((group) => [group.direction, ...(group.mirror ? [group.mirror] : [])]);
		assert.equal(expanded.length, (rule.muCount * rule.azimuthCount) / 2);
		checks++;
		assert.equal(new Set(expanded.map((vector) => JSON.stringify(vector))).size, expanded.length);
		checks++;
		assert.ok(
			groups.every(
				(group) =>
					group.weight > 0 && group.direction[2] > 0 && Math.abs(Math.hypot(...group.direction) - 1) < 1e-14,
			),
		);
		checks++;
		const solidAngle = groups.reduce((sum, group) => sum + group.weight * (group.mirror ? 2 : 1), 0);
		maximumSolidAngleError = Math.max(maximumSolidAngleError, Math.abs(solidAngle - 2 * Math.PI));
		assert.ok(Math.abs(solidAngle - 2 * Math.PI) < 1e-12);
		checks++;
		for (const outgoing of [[0, 0, 1], unit([1, 2, 3]), unit([-3, 7, 2])]) {
			const value = groups.reduce(
				(sum, group) =>
					sum +
					group.weight *
						[group.direction, ...(group.mirror ? [group.mirror] : [])].reduce(
							(subtotal, incoming) =>
								subtotal + (3 * (1 + dot(incoming, outgoing) ** 2)) / (16 * Math.PI),
							0,
						),
				0,
			);
			assert.ok(Math.abs(value - 0.5) < 1e-13);
			checks++;
		}
		if (rule.muCount <= 32) {
			const original = createProductQuadrature(rule.muCount, rule.azimuthCount, rule.placement);
			const expected = original.unitVectors.filter((vector) => vector[2] > 0);
			assert.deepEqual(expanded, expected);
			checks++;
			assert.deepEqual(
				groups.flatMap((group) => (group.mirror ? [group.weight, group.weight] : [group.weight])),
				original.integrationWeightsSteradians.slice(original.directionCount / 2),
			);
			checks++;
		}
	}
	const group = incidentGroups(localJ2Rules[0])[3],
		outgoing = unit([1, 4, 2]);
	const first = (1 + dot(outgoing, group.direction)) ** 4,
		mirrored = (1 + dot(outgoing, group.mirror)) ** 4;
	const asymmetricMirrorDifference = Math.abs(first + mirrored - 2 * first);
	assert.ok(asymmetricMirrorDifference > 0.1);
	checks++;
	assert.throws(() => componentGauss(128));
	checks++;
	assert.throws(() => incidentGroups({...localJ2Rules[0], azimuthCount: 64}));
	checks++;
	const invalidNode = {
		gauss: [0],
		simpson: [0],
		allowances: [null],
		resolved: false,
		mediumEvaluations: 0,
		outerEvaluations: 0,
		elapsedMilliseconds: 0,
		finite: [],
	};
	// Admission must reject before consulting geometry or spectral coefficients.
	assert.throws(() => accumulateNode(null, [], [0], group, invalidNode, []));
	checks++;
	assert.throws(() =>
		accumulateNode(null, [], [0], group, {...invalidNode, resolved: true, allowances: [0], gauss: [NaN]}, []),
	);
	checks++;
	/** @type {SkyJ2Target} */ const target = {
		id: 'manufactured',
		time: 'manufactured',
		gridX: 0,
		gridY: 0,
		origin: [1, 0, 0],
		direction: [0, 0, 1],
	};
	assert.deepEqual(localJ2FiniteControls, [
		{source: 80, transport: 160},
		{source: 160, transport: 160},
		{source: 80, transport: 320},
		{source: 160, transport: 320},
	]);
	checks++;
	const finiteSums = createSums([target], [0, 8, 24, 30], localJ2FiniteControls.length);
	assert.equal(finiteSums.length, 4);
	checks++;
	assert.ok(finiteSums.every((row) => row.finite.length === 4 && row.finite.every((value) => value === 0)));
	checks++;
	const missing = angularEnvelopes([target], [0], []);
	assert.equal(missing[0].angularAdequate, false);
	assert.equal(missing[0].empiricalAllowance, null);
	checks += 2;
	/** @type {SkyJ2RuleResult[]} */ const synthetic = localJ2Rules.map((rule, index) => ({
		ruleId: rule.id,
		time: target.time,
		expectedNodes: 1,
		completedNodes: 1,
		finiteAngularResolved: true,
		rows: [
			{
				targetId: target.id,
				channel: 0,
				gauss: [1.00002, 1.000004, 1, 1.000001][index],
				simpson: [1.00002, 1.000004, 1, 1.000001][index],
				allowance: 1e-10,
				finite: [],
			},
		],
	}));
	const accepted = angularEnvelopes([target], [0], synthetic)[0];
	assert.equal(accepted.angularAdequate, true);
	assert.ok(accepted.empiricalAllowance > 0);
	checks += 2;
	const absent = angularEnvelopes([target], [0], synthetic.slice(0, 3))[0];
	assert.equal(absent.angularAdequate, false);
	assert.equal(absent.empiricalAllowance, null);
	checks += 2;
	const noisy = synthetic.map((result, index) =>
		index === 3 ? {...result, rows: result.rows.map((row) => ({...row, gauss: 1.00001}))} : result,
	);
	const rejected = angularEnvelopes([target], [0], noisy)[0];
	assert.equal(rejected.angularAdequate, false);
	assert.equal(rejected.empiricalAllowance, null);
	checks += 2;
	return {
		schemaId: 'sky-local-j2-proof-v1',
		checks,
		maximumMomentError,
		maximumSolidAngleError,
		asymmetricMirrorDifference,
	};
}
