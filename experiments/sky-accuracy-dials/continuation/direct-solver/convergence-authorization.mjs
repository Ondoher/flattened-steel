import assert from 'node:assert/strict';
import {identity, verifyRun} from '../../io/files.mjs';
/** Renewed owner-authorized convergence package, independent of the consumed first run. */
export const convergencePackageId = 'direct-convergence-v1';
/** @returns {SkyDirectGpuAuthorization} */
export function convergenceAuthorization() {
	const through = verifyRun('tmp/experiments/sky-accuracy-dials/runs/00229-direct-ideal');
	assert.equal(through.sha256, 'f7d3e898966e443fad7834d587c127f94aaf88e1bdb093bd95fddb32278905a2');
	return {
		through,
		plan: identity(
			'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/direct-convergence-plan.md',
		),
		priorAttempts: 39,
		additionalAttempts: 1,
		deadline: '2026-09-15T22:44:00Z',
	};
}
/** Authenticate this package without changing any previous package's authority.
 * @param {SkyDirectGpuAuthorization} value @param {readonly DialFileIdentity[]} parents
 * @param {number} prior @param {string} caseId @param {string} finished
 */
export function validateConvergence(value, parents, prior, caseId, finished) {
	assert.deepEqual(value, convergenceAuthorization());
	assert.equal(prior, 39);
	assert.equal(caseId, convergencePackageId);
	for (const id of [value.through, value.plan])
		assert.ok(parents.some((p) => p.path === id.path && p.sha256 === id.sha256 && p.byteLength === id.byteLength));
	assert.ok(Date.parse(finished) <= Date.parse(value.deadline) + 300000);
}
