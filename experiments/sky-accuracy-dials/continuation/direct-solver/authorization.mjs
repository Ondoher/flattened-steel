import assert from 'node:assert/strict';
import {identity, verifyRun} from '../../io/files.mjs';
/** Owner-requested direct solver package; unrelated historical attempts stay closed. */
export const directPackageId = 'direct-idealization-v1';
/** @returns {SkyDirectGpuAuthorization} */
export function directAuthorization() {
	const through = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00228-solar-register');
	assert.equal(through.sha256, '494d17ecf89840773902d0fdd0d4aeff4cfcbad2217046bc081a8d1f30cb7c2c');
	return {
		through,
		plan: identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/direct-solver-plan.md'),
		priorAttempts: 38,
		additionalAttempts: 1,
		deadline: '2026-09-15T19:39:00Z',
	};
}
/** @param {SkyDirectGpuAuthorization} value @param {readonly DialFileIdentity[]} parents @param {number} prior @param {string} caseId @param {string} finished */
export function validateDirect(value, parents, prior, caseId, finished) {
	assert.deepEqual(value, directAuthorization());
	assert.equal(prior, 38);
	assert.equal(caseId, directPackageId);
	for (const id of [value.through, value.plan])
		assert.ok(parents.some((p) => p.path === id.path && p.sha256 === id.sha256 && p.byteLength === id.byteLength));
	assert.ok(Date.parse(finished) <= Date.parse(value.deadline) + 300000);
}
