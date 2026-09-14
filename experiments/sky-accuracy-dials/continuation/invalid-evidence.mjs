import assert from 'node:assert/strict';
import {readRepository, verifyRun} from '../io/files.mjs';

/** Exact failed post-seal verification; this identity never becomes accepted proof evidence. */
const rejectedSeal = {
	path: 'tmp/experiments/sky-accuracy-dials/runs/00100-c1-proofs/sealed.json',
	byteLength: 91654,
	sha256: 'def05094bf846146ca10786f5d49b0a8bf14580dd991d5b734658f8bb1296b4d',
};

/** Account for the one authenticated progress-invalid record without relaxing verifyRun.
 * Complete inventory and artifact hashes are checked by the strict verifier before its
 * expected heartbeat rejection; every event is also inspected because that verifier
 * stops at the first gap. Unknown identities or any other failure remain blockers.
 * @param {string} run - Exact immutable run directory.
 * @param {string} registration - Owning C0 identity.
 * @returns {SkyContinuationInvalidEvidence|null} Accounting-only exclusion, or null for ordinary runs.
 */
export function accountInvalidEvidence(run, registration) {
	if (`${run}/sealed.json` !== rejectedSeal.path) return null;
	const seal = JSON.parse(readRepository(rejectedSeal.path, rejectedSeal).toString());
	assert.equal(seal.recipe.parameters.continuationRegistration, registration);
	assert.equal(seal.recipe.parameters.jobKind, 'cpu');
	assert.equal(seal.recipe.parameters.scope, 'component');
	assert.equal(seal.recipe.parameters.phase, 'C1');
	assert.equal(seal.result.jobElapsedMilliseconds, 59345);
	assert.throws(
		() => verifyRun(run),
		(error) =>
			error instanceof assert.AssertionError && error.message === 'Progress heartbeat gap exceeds contract.',
	);
	const events = readRepository(`${run}/progress.jsonl`)
		.toString()
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	assert.equal(events.length, 13);
	const gaps = [];
	for (let index = 1; index < events.length; index++) {
		const gap = Date.parse(events[index].timestamp) - Date.parse(events[index - 1].timestamp);
		assert.ok(Number.isFinite(gap) && gap >= 0);
		if (gap > 35000) gaps.push({index, milliseconds: gap});
	}
	assert.deepEqual(gaps, [{index: 2, milliseconds: 52485}]);
	return {
		seal: rejectedSeal,
		classification: 'invalid-evidence-accounted-only',
		reason: 'Post-seal verification rejected the 52.485-second synchronous snapshot heartbeat gap. Preserve all bytes and charge the attempt; none of its calculations qualify as accepted proof.',
		jobElapsedMilliseconds: seal.result.jobElapsedMilliseconds,
	};
}
