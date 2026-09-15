import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readAngularFrameControl} from '../angular-frame-control/read.mjs';

export const angularEndpointOriginalRun = 'tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes';
export const angularEndpointPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-endpoint-plan.md';

/** Reuse the authenticated physical and analytic inputs, then authenticate the
 * exact placement-control producer and its three retained replay values.
 * @param {DialContinuationRegistrationRead} registration
 * @returns {SkyAngularEndpointInput}
 */
export function readAngularEndpoint(registration) {
	const input = readAngularFrameControl(registration);
	const parent = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00218-af-control');
	assert.equal(parent.seal.sha256, '0e6a899f7b0658fac209066458c4b3529d04138eb7aff87f6b2350f8455f65f0');
	const terminal = /** @type {SkyAngularFrameControlTerminal} */ (
		JSON.parse(readRepository(parent.seal.path, parent.seal).toString())
	);
	assert.equal(terminal.recipe.parameters.caseId, 'angular-frame-control');
	assert.equal(terminal.recipe.parameters.continuationRegistration, registration.run);
	assert.ok(
		terminal.recipe.parents.some(
			(id) =>
				id.path === registration.seal.path &&
				id.sha256 === registration.seal.sha256 &&
				id.byteLength === registration.seal.byteLength,
		),
	);
	/** @type {DialFileIdentity[]} */ const identities = [...input.identities, parent.seal];
	for (const suffix of [
		'/angular-frame-control/index.mjs',
		'/angular-frame-control/read.mjs',
		'/angular-frame-control/run.mjs',
		'/angular-frame/geometry.mjs',
		'/numerics/math.js',
		'/numerics/direct.js',
		'/j2/angular.mjs',
		'/reference/physical/quadrature.mjs',
	]) {
		const matches = terminal.recipe.parameters.sourceIdentities.filter((id) => id.path.endsWith(suffix));
		assert.equal(matches.length, 1);
		readRepository(matches[0].path, matches[0]);
		identities.push(matches[0]);
	}
	const assessment = mechanismArtifact(parent, 'assessment.json');
	const replay = /** @type {SkyAngularFrameControlResult} */ (
		JSON.parse(readRepository(assessment.path, assessment).toString())
	);
	assert.equal(replay.schemaId, 'sky-angular-frame-control-v1');
	assert.deepEqual(replay.target, input.target);
	assert.equal(replay.g, input.spec.atmosphere.miePhaseFunctionG);
	assert.deepEqual(replay.reference, input.original.reference);
	assert.ok(replay.referenceAdequate);
	assert.equal(replay.rows.length, 6);
	assert.equal(Object.keys(replay.implementationChecks).length, 19);
	assert.ok(Object.values(replay.implementationChecks).every((state) => state === 'passed'));
	assert.equal(replay.predicates.length, 17);
	assert.equal(replay.predicates.filter((state) => state === 'passed').length, 14);
	assert.equal(new Set(replay.rows.map((row) => row.id)).size, 6);
	identities.push(assessment, mechanismArtifact(parent, 'sources-delta.json.gz'));
	return {...input, replay: replay.rows, identities: [...new Map(identities.map((id) => [id.path, id])).values()]};
}
