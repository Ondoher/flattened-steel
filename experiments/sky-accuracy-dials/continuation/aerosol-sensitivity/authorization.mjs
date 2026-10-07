import assert from 'node:assert/strict';
import {identity, verifyRun} from '../../io/files.mjs';
export const aerosolPackageId = 'aerosol-sensitivity-v1';
/** @returns {SkyDirectGpuAuthorization} */
export function aerosolAuthorization() {
	const through = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00233-angular-residual');
	assert.equal(through.sha256, '2200d50a2857f2012936aac70f2b03a222c3e94ac4add95a12c0e7e6f031fb05');
	return {
		through,
		plan: identity(
			'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/aerosol-sensitivity-plan.md',
		),
		priorAttempts: 41,
		additionalAttempts: 1,
		deadline: '2026-09-16T01:35:49Z',
	};
}
/** @param {SkyDirectGpuAuthorization} value @param {readonly DialFileIdentity[]} parents @param {number} prior @param {string} caseId @param {string} finished */
export function validateAerosol(value, parents, prior, caseId, finished) {
	assert.deepEqual(value, aerosolAuthorization());
	assert.equal(prior, 41);
	assert.equal(caseId, aerosolPackageId);
	for (const id of [value.through, value.plan])
		assert.ok(parents.some((p) => p.path === id.path && p.sha256 === id.sha256 && p.byteLength === id.byteLength));
	assert.ok(Date.parse(finished) <= Date.parse(value.deadline) + 300000);
}
/** @param {readonly DialContinuationPhaseAllocation[]} allocations @returns {DialContinuationPhaseAllocation[]} */
export function aerosolAllocations(allocations) {
	assert.equal(allocations.find((a) => a.phase === 'C5')?.retainedBytes, 125 * 1024 ** 2);
	assert.equal(allocations.find((a) => a.phase === 'C6')?.retainedBytes, 11 * 1024 ** 2);
	return allocations.map((a) => ({
		...a,
		retainedBytes: a.retainedBytes + (a.phase === 'C5' ? 1024 ** 2 : a.phase === 'C6' ? -(1024 ** 2) : 0),
	}));
}
