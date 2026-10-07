import assert from 'node:assert/strict';
import {identity, verifyRun} from '../../io/files.mjs';
/** Owner-requested extension to alternate non-near-Sun rays. */
export const alternatePackageId = 'direct-alternate-rays-v1';
/** @returns {SkyDirectGpuAuthorization} */
export function alternateAuthorization() {
	const through = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00231-reference-match');
	assert.equal(through.sha256, 'eec39850444983bbde01e0df8848d34749de7e01f7f41082b1ffd2299ed12aec');
	return {
		through,
		plan: identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/alternate-rays-plan.md'),
		priorAttempts: 40,
		additionalAttempts: 1,
		deadline: '2026-09-15T22:44:00Z',
	};
}
/** @param {SkyDirectGpuAuthorization} value @param {readonly DialFileIdentity[]} parents @param {number} prior @param {string} caseId @param {string} finished */
export function validateAlternate(value, parents, prior, caseId, finished) {
	assert.deepEqual(value, alternateAuthorization());
	assert.equal(prior, 40);
	assert.equal(caseId, alternatePackageId);
	for (const id of [value.through, value.plan])
		assert.ok(parents.some((p) => p.path === id.path && p.sha256 === id.sha256 && p.byteLength === id.byteLength));
	assert.ok(Date.parse(finished) <= Date.parse(value.deadline) + 300000);
}
/** Apply exactly the prospectively authorized 1 MiB conserved transfer, never twice.
 * @param {readonly DialContinuationPhaseAllocation[]} allocations
 * @returns {DialContinuationPhaseAllocation[]}
 */
export function alternateAllocations(allocations) {
	const c5 = allocations.find((a) => a.phase === 'C5'),
		c6 = allocations.find((a) => a.phase === 'C6');
	assert.equal(c5?.retainedBytes, 124 * 1024 ** 2);
	assert.equal(c6?.retainedBytes, 12 * 1024 ** 2);
	const next = allocations.map((a) => ({
		...a,
		retainedBytes: a.retainedBytes + (a.phase === 'C5' ? 1024 ** 2 : a.phase === 'C6' ? -(1024 ** 2) : 0),
	}));
	assert.equal(
		next.reduce((s, a) => s + a.retainedBytes, 0),
		allocations.reduce((s, a) => s + a.retainedBytes, 0),
	);
	return next;
}
