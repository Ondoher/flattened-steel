import assert from 'node:assert/strict';
import {identity, readRepository, verifyRun} from '../../io/files.mjs';

/** Exact closed package authorization; original campaign limits remain immutable. */
export const remainingPackageId = 'remaining-factors-v1';
const through = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00225-remain-account/sealed.json',
	byteLength: 294659,
	sha256: 'b927afb9919d4b6c22c389b1d8448a15effdb60b7d7d3b53a32ae3e4aae0fbc6',
};
const planPath = 'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/remaining-observation-plan.md';

/** Construct the single-purpose authorization from exact preserved accounting evidence.
 * @returns {SkyRemainingGpuAuthorization}
 */
export function remainingGpuAuthorization() {
	assert.deepEqual(verifyRun(through.path.slice(0, -12)), through);
	const previous = JSON.parse(readRepository(through.path, through).toString());
	assert.equal(previous.state, 'accepted');
	assert.equal(previous.result.runHigherFactorial, false);
	return {
		schemaId: 'sky-remaining-gpu-authorization-v1',
		packageId: remainingPackageId,
		through,
		plan: identity(planPath),
		originalSlots: 36,
		additionalSlots: 2,
		deadline: '2026-09-15T19:39:00Z',
		caseId: 'remaining-observation-v1',
	};
}

/** Validate one post-cap attempt without recursively invoking campaign accounting.
 * @param {SkyRemainingGpuAuthorization} value @param {readonly DialFileIdentity[]} parents
 * @param {number} priorGpuJobs @param {string} caseId @param {string} finishedAt
 */
export function validateRemainingGpu(value, parents, priorGpuJobs, caseId, finishedAt) {
	assert.deepEqual(value, remainingGpuAuthorization());
	assert.equal(caseId, value.caseId);
	assert.ok(priorGpuJobs >= value.originalSlots && priorGpuJobs < value.originalSlots + value.additionalSlots);
	for (const required of [value.through, value.plan])
		assert.ok(
			parents.some(
				(id) =>
					id.path === required.path && id.sha256 === required.sha256 && id.byteLength === required.byteLength,
			),
		);
	assert.ok(
		Date.parse(finishedAt) <= Date.parse(value.deadline) + 300000,
		'Only bounded finalization may extend beyond the package deadline.',
	);
}
