import assert from 'node:assert/strict';
import {incidentGroups, localJ2Rules} from '../j2/angular.mjs';
import {angularGroups, angularRules, angularRunName, radialNodes, reuseAddress, stageRules} from './rules.mjs';
import {angularOutcomes, angularPredictions, angularRankings, angularRow} from './evaluate.mjs';

/** Exercise analytic moments, exact reuse, reflection and prediction failures without a physical ray.
 * @returns {SkyAngularProof} Measured manufactured discrepancies and verified assertions.
 */
export function angularProof() {
	let checks = 0,
		maximumMomentError = 0,
		maximumSolidAngleError = 0;
	const original = localJ2Rules.map(incidentGroups),
		originalRegistry = JSON.stringify(localJ2Rules);
	/** @type {readonly SkyAngularStage[]} */
	const stages = ['derive', 'development', 'predict', 'fine'];
	for (const stage of stages) {
		const name = angularRunName(stage);
		assert.match(name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
		assert.ok(name.length <= 16);
		checks += 2;
	}
	assert.equal(new Set(stages.map(angularRunName)).size, stages.length);
	assert.equal(angularRunName('development'), 'j2-ang-dev');
	checks += 2;
	for (const rule of angularRules) {
		const radial = radialNodes(rule),
			groups = angularGroups(rule);
		const degrees =
			rule.radial === 'full-positive'
				? Array.from({length: rule.muCount}, (_, index) => 2 * index)
				: Array.from(
						{length: rule.radial === 'hemisphere' ? 2 * rule.muCount : rule.muCount},
						(_, index) => index,
					);
		for (const degree of degrees) {
			const moment = radial.reduce((sum, node) => sum + node.weight * node.node ** degree, 0);
			const error = Math.abs(moment - 1 / (degree + 1));
			maximumMomentError = Math.max(maximumMomentError, error);
			assert.ok(error < 3e-14);
			checks++;
		}
		const solidAngle = groups.reduce((sum, group) => sum + group.weight * (group.mirror ? 2 : 1), 0);
		maximumSolidAngleError = Math.max(maximumSolidAngleError, Math.abs(solidAngle - 2 * Math.PI));
		assert.ok(Math.abs(solidAngle - 2 * Math.PI) < 1e-12);
		checks++;
		const expanded = groups.flatMap((group) => [group.direction, ...(group.mirror ? [group.mirror] : [])]);
		assert.equal(new Set(expanded.map((vector) => JSON.stringify(vector))).size, expanded.length);
		checks++;
		for (const [index, group] of groups.entries()) {
			assert.ok(group.weight > 0 && Number.isFinite(group.weight));
			assert.ok(group.direction[2] > 0 && Math.abs(Math.hypot(...group.direction) - 1) < 1e-14);
			checks += 2;
			const address = reuseAddress(rule, index);
			if (address) {
				assert.deepEqual(group.direction, original[address.ruleIndex][address.index].direction);
				assert.deepEqual(group.mirror, original[address.ruleIndex][address.index].mirror);
				checks += 2;
			}
		}
		assert.throws(() => reuseAddress(rule, -1));
		checks++;
		assert.throws(() => reuseAddress(rule, groups.length));
		checks++;
	}
	assert.equal(JSON.stringify(localJ2Rules), originalRegistry);
	checks++;
	assert.throws(() => angularGroups({...angularRules[0], azimuthCount: 256}));
	checks++;
	assert.equal(stageRules('predict').length, 0);
	checks++;
	const fineGroups = stageRules('fine').flatMap(angularGroups);
	assert.equal(new Set(fineGroups.map((group) => JSON.stringify(group.direction))).size * 2, 8320);
	checks++;
	const deriveGroups = stageRules('derive').flatMap((rule) =>
		angularGroups(rule).filter((_, index) => !reuseAddress(rule, index)),
	);
	assert.equal(deriveGroups.length * 2, 512);
	checks++;
	const example = angularGroups(angularRules[7])[3];
	const asymmetric = (/** @type {SkyVector3} */ vector) => (1 + 0.2 * vector[0] + 0.7 * vector[1]) ** 2;
	assert.ok(
		Math.abs(asymmetric(example.direction) + asymmetric(example.mirror) - 2 * asymmetric(example.direction)) > 0.01,
	);
	checks++;
	/** @type {SkyJ2Target} */ const target = {
		id: 'manufactured',
		time: 'manufactured',
		gridX: 0,
		gridY: 0,
		origin: [1, 0, 0],
		direction: [1, 0, 0],
	};
	/** @type {Record<string,number>} */ const values = {
		'hemi8-az64-mid': 1.001,
		'hemi16-az64-mid': 1.0001,
		'hemi32-az64-mid': 1.00000011,
		'hemi32-az64-end': 1.00000012,
		'hemi32-az128-end': 1.0000001,
		'squared32-az128-end': 1,
		'full16-az32-mid': 1.03,
		'full32-az32-mid': 1.003,
		'full64-az32-end': 1.002,
		'full64-az64-end': 1.002,
		'full64-az128-end': 1.002,
		'full64-az32-mid': 1.002,
		'full64-az64-mid': 1.002,
	};
	/** @type {SkyJ2RuleResult[]} */ const results = Object.entries(values).map(([ruleId, value]) => ({
		time: target.time,
		ruleId,
		expectedNodes: 1,
		completedNodes: 1,
		finiteAngularResolved: true,
		rows: [{targetId: target.id, channel: 0, gauss: value, simpson: value, allowance: 1e-12, finite: []}],
	}));
	const predictions = angularPredictions([target], [0], results);
	assert.equal(predictions.length, 1);
	checks++;
	assert.equal(predictions[0].magnitudePredictionResolved, false);
	checks++;
	assert.ok(predictions[0].forecastRadius > 2 * Math.abs(predictions[0].observedCorrection));
	checks++;
	const outcomes = angularOutcomes(predictions, results);
	assert.equal(outcomes[0].angularAdequate, true);
	checks++;
	assert.equal(outcomes[0].correctionShrinks, true);
	checks++;
	assert.equal(outcomes[0].closerToMapped, true);
	checks++;
	assert.equal(outcomes[0].comparisonResolved, true);
	checks++;
	assert.equal(outcomes[0].insideForecast, true);
	checks++;
	const rankings = angularRankings(outcomes, results);
	assert.equal(rankings.length, 6);
	checks++;
	assert.ok(rankings.every((row) => row.reductionQualified));
	checks++;
	const noisy = results.map((rule) =>
		rule.ruleId === 'squared32-az128-end' ? {...rule, rows: rule.rows.map((row) => ({...row, gauss: 1.1}))} : rule,
	);
	const rejected = angularOutcomes(predictions, noisy);
	assert.equal(rejected[0].angularAdequate, false);
	checks++;
	assert.equal(rejected[0].empiricalAllowance, null);
	checks++;
	assert.ok(angularRankings(rejected, noisy).every((row) => !row.reductionQualified));
	checks++;
	const nonshrinking = results.map((rule) =>
		rule.ruleId === 'hemi32-az64-mid' ? {...rule, rows: rule.rows.map((row) => ({...row, gauss: 1.1}))} : rule,
	);
	const failedPrediction = angularOutcomes(predictions, nonshrinking);
	assert.equal(failedPrediction[0].correctionShrinks, false);
	checks++;
	assert.equal(failedPrediction[0].insideForecast, false);
	checks++;
	assert.equal(failedPrediction[0].empiricalAllowance, null);
	checks++;
	assert.throws(() => angularRow([], 'missing', target.id, 0));
	checks++;
	assert.throws(() => angularRow([...results, results[0]], results[0].ruleId, target.id, 0));
	checks++;
	return {schemaId: 'sky-j2-angular-proof-v1', checks, maximumMomentError, maximumSolidAngleError};
}
