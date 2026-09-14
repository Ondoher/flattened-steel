import assert from 'node:assert/strict';
import {assertLadderPrefix} from './read.mjs';
import {assertGroundDirection, groundDirectionComponentAllowance} from '../geometry.mjs';
import {
	compareResponses,
	completeNorm,
	deltaMetrics,
	difference,
	localReductionGate,
	totalQualifiedAllowance,
} from './evaluate.mjs';

/** Exercise missing coverage, order/prefix admission and finite vector gates without IO or a solver.
 * @returns {SkyLadderProof} Counted manufactured checks; not qualification of a physical remainder.
 */
export function referenceLadderProof() {
	let checks = 0;
	/** @param {unknown} actual @param {unknown} expected @returns {void} */
	const equal = (actual, expected) => {
		assert.deepEqual(actual, expected);
		checks++;
	};
	/** @type {SkyVector3} */ const axial = [1, 0, 0];
	assertGroundDirection(axial, axial);
	checks++;
	assertGroundDirection([1, groundDirectionComponentAllowance, 0], axial);
	checks++;
	for (const invalid of /** @type {readonly SkyVector3[]} */ ([
		[1, 2 * groundDirectionComponentAllowance, 0],
		[2, 0, 0],
		[1, 1e-8, 0],
		[1, 0, NaN],
	])) {
		assert.throws(() => assertGroundDirection(invalid, axial));
		checks++;
	}
	for (const ids of [['r0'], Array.from({length: 12}, (_, index) => `r${index}`)]) {
		assertLadderPrefix(ids);
		checks++;
	}
	for (const ids of [
		[],
		['r1'],
		['r0', 'r2'],
		['r0', 'r1', 'r1'],
		['r0', 'r2', 'r1'],
		Array.from({length: 13}, (_, index) => `r${index}`),
	]) {
		assert.throws(() => assertLadderPrefix(ids));
		checks++;
	}
	equal(completeNorm([]), null);
	equal(completeNorm([3, 4]), 5);
	equal(completeNorm([3, null, 4]), null);
	equal(difference([1, null, 3], [4, 8, null]), [3, null, null]);
	assert.throws(() => difference([1], [1, 2]));
	checks++;
	equal(deltaMetrics([3, -4, 0], 1), {
		count: 3,
		availableCount: 3,
		normW: 5,
		rmsW: 5 / Math.sqrt(3),
		meanW: -1 / 3,
		twiceObservedNormW: 10,
		significantCount: 2,
		positiveCount: 1,
		negativeCount: 1,
	});
	equal(deltaMetrics([3, null], 1).normW, null);
	equal(deltaMetrics([], 1).significantCount, null);
	equal(compareResponses([0, 0], [0, 0], 1), {normRatio: null, cosine: null, differenceNormW: 0});
	equal(compareResponses([3, 4], [-6, -8], 0.1), {normRatio: 2, cosine: -1, differenceNormW: 15});
	equal(compareResponses([3, null], [6, 8], 0.1).normRatio, null);
	/** @type {SkyLadderComponent} */ const qualified = {
		component: 'view',
		support: 'independent methods',
		twiceObservedNormW: null,
		qualifiedAllowanceW: 0.1,
		qualified: true,
		reason: 'Manufactured admitted component.',
	};
	equal(totalQualifiedAllowance([qualified]), 0.1);
	equal(
		totalQualifiedAllowance([
			qualified,
			{...qualified, component: 'angular', qualified: false, qualifiedAllowanceW: null},
		]),
		null,
	);
	equal(totalQualifiedAllowance([]), null);
	/** @type {SkyLadderReductionGates} */ const gates = {
		maximumAllowanceToReduction: 0.2,
		strictReductionAllowanceMultiplier: 2,
	};
	equal(localReductionGate(1, 0.1, gates), true);
	equal(localReductionGate(1, 0.21, gates), false);
	equal(localReductionGate(0, 0, gates), false);
	equal(localReductionGate(-1, 0, gates), false);
	equal(localReductionGate(1, null, gates), null);
	// Equal response magnitudes with opposite signs are material background dependence.
	equal(compareResponses([3, 4], [-3, -4], 1).differenceNormW, 10);
	// Cancellation can improve a measured score while removal of a known error worsens it.
	const numerical = [3, -4],
		remaining = [-5, 2],
		residual = numerical.map((value, index) => value + remaining[index]);
	const sse = (/** @type {readonly number[]} */ values) => values.reduce((sum, value) => sum + value ** 2, 0);
	equal(
		sse(residual),
		sse(numerical) +
			sse(remaining) +
			2 * numerical.reduce((sum, value, index) => sum + value * remaining[index], 0),
	);
	assert.ok(sse(remaining) > sse(residual));
	checks++;
	return {schemaId: 'sky-continuation-reference-ladder-proof-v1', checks};
}
