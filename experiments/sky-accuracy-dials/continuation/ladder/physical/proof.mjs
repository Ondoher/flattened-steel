import assert from 'node:assert/strict';
import {decomposePhysicalFirst, physicalStatistics} from './evaluate.mjs';
import {localReductionGate} from '../evaluate.mjs';

/** Verify compensation, unchanged controls and missing-data propagation on manufactured scalars.
 * @returns {SkyLadderProof} Focused mathematical evidence, not atmospheric reference qualification.
 */
export function physicalFirstProof() {
	let checks = 0;
	/** Count a verified manufactured assertion.
	 * @param {unknown} actual - Computed value. @param {unknown} expected - Independently specified result.
	 * @returns {void}
	 */
	const equal = (actual, expected) => {
		assert.deepEqual(actual, expected);
		checks++;
	};
	const a = decomposePhysicalFirst(3, 0.125, 7, 0.25, 4, 0.125, 5);
	equal(a.numericalW, -1);
	equal(a.remainingW, 3);
	equal(a.residualW, 2);
	equal(a.numericalAllowanceW, 0.25);
	equal(a.remainingAllowanceW, 0.5);
	const stats = physicalStatistics([a, a]);
	equal(stats.numericalSseW2, 2);
	equal(stats.remainingSseW2, 18);
	equal(stats.crossTermW2, -12);
	equal(stats.residualSseW2, 8);
	equal(stats.identityResidualW2, 0);
	equal(stats.errorNormW, Math.sqrt(2));
	equal(stats.errorAllowanceNormW, Math.sqrt(0.125));
	const corrected = decomposePhysicalFirst(4, 0.125, 8, 0.25, 4, 0.125, 5);
	equal(corrected.numericalW, 0);
	equal(corrected.remainingW, 3);
	equal(physicalStatistics([corrected]).residualSseW2, 9);
	const propagated = decomposePhysicalFirst(4, 0.125, 9, 0.25, 4, 0.125, 5);
	equal(propagated.remainingW, 4);
	const missing = decomposePhysicalFirst(null, null, 7, 0.25, 4, 0.125, 5);
	equal(missing.numericalW, null);
	equal(missing.numericalAllowanceW, null);
	equal(physicalStatistics([a, missing]).errorNormW, null);
	equal(physicalStatistics([a, missing]).crossTermW2, null);
	equal(physicalStatistics([a, missing]).residualSseW2, 8);
	const unresolved = decomposePhysicalFirst(3, null, 7, 0.25, 4, 0.125, 5);
	equal(physicalStatistics([unresolved]).errorNormW, null);
	const noFourth = decomposePhysicalFirst(3, 0.125, null, null, 4, 0.125, 5);
	equal(physicalStatistics([noFourth]).errorNormW, 1);
	equal(physicalStatistics([noFourth]).remainingSseW2, null);
	for (const key of [
		'errorNormW',
		'numericalSseW2',
		'remainingSseW2',
		'crossTermW2',
		'residualSseW2',
		'componentRmseMilliwatt',
	])
		equal(physicalStatistics([])[key], null);
	const gates = {maximumAllowanceToReduction: 0.2, strictReductionAllowanceMultiplier: 2};
	equal(localReductionGate(0, 0, gates), false);
	equal(localReductionGate(1, 0.125, gates), true);
	equal(localReductionGate(1, 0.25, gates), false);
	equal(localReductionGate(1, null, gates), null);
	assert.throws(() => decomposePhysicalFirst(3, -1, 7, 0.25, 4, 0.125, 5));
	checks++;
	assert.throws(() => decomposePhysicalFirst(Number.NaN, 0, 7, 0.25, 4, 0.125, 5));
	checks++;
	return {schemaId: 'sky-ladder-physical-first-proof-v1', checks};
}
