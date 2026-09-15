import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {loadInputs} from '../../execution.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {volumeJ2Targets} from '../volume-j2/angular.mjs';

export const angularFrameControlOriginalRun = 'tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes';
const geometryRun = 'tmp/experiments/sky-accuracy-dials/runs/00212-af-pilot';
export const angularFrameControlPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-frame-control-plan.md';

/** Authenticate retained inputs and unchanged numerical helpers; no phase or
 * atmospheric integrations are evaluated by this reader.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularFrameControlInput}
 */
export function readAngularFrameControl(registration) {
	const original = acceptedMechanismInput(angularFrameControlOriginalRun),
		pilot = acceptedMechanismInput(geometryRun);
	assert.equal(original.seal.sha256, '8b3f2728fdc6481f44f8662f9fa346125bd632c1bc01997e43d9d7e65de0e06d');
	assert.equal(pilot.seal.sha256, 'aca481d26f1f4c1f76bdd8f06ceab8beb62338c74a55d857ee4c9809a21e7933');
	/** @type {DialFileIdentity[]} */ const identities = [original.seal, pilot.seal, registration.record.inputs];
	for (const [parent, expectedCase, suffixes] of /** @type {const} */ ([
		[
			original,
			'angular-lobes',
			[
				'/angular-lobes/index.mjs',
				'/angular-lobes/run.mjs',
				'/numerics/direct.js',
				'/numerics/math.js',
				'/j2/angular.mjs',
				'/volume-j2/angular.mjs',
				'/source-reconstruction/index.mjs',
				'/execution.mjs',
				'/inputs.mjs',
			],
		],
		[
			pilot,
			'angular-frame-pilot',
			[
				'/angular-frame/geometry.mjs',
				'/numerics/direct.js',
				'/numerics/math.js',
				'/j2/angular.mjs',
				'/reference/physical/quadrature.mjs',
			],
		],
	])) {
		const terminal = /** @type {SkyAngularFrameControlTerminal} */ (
			JSON.parse(readRepository(parent.seal.path, parent.seal).toString())
		);
		const parameters = terminal.recipe.parameters;
		assert.equal(parameters.caseId, expectedCase);
		assert.equal(parameters.continuationRegistration, registration.run);
		assert.ok(
			terminal.recipe.parents.some(
				(id) => id.path === registration.seal.path && id.sha256 === registration.seal.sha256,
			),
		);
		for (const suffix of suffixes) {
			const matches = parameters.sourceIdentities.filter((id) => id.path.endsWith(suffix));
			assert.equal(matches.length, 1);
			readRepository(matches[0].path, matches[0]);
			identities.push(matches[0]);
		}
	}
	const inputsId = mechanismArtifact(original, 'inputs.json'),
		resultId = mechanismArtifact(original, 'assessment.json');
	const inputs = /** @type {{spec:SkyTransportSpec,targets:SkyVolumeJ2Target[]}} */ (
		JSON.parse(readRepository(inputsId.path, inputsId).toString())
	);
	const result = /** @type {SkyAngularLobesResult} */ (
		JSON.parse(readRepository(resultId.path, resultId).toString())
	);
	assert.equal(result.schemaId, 'sky-angular-lobes-v1');
	assert.equal(result.g, 0.7);
	assert.equal(result.rows.length, 2);
	readRepository(registration.record.inputs.path, registration.record.inputs);
	assert.deepEqual(loadInputs().native48.transportSpec, inputs.spec);
	const target = volumeJ2Targets(registration, inputs.spec).find((t) => t.id === 'p-0930-5-7:h1000');
	assert.ok(target);
	const rows = result.rows.filter((r) => r.target.id === target.id);
	assert.equal(rows.length, 1);
	const row = rows[0],
		reference = row.reference;
	assert.deepEqual(row.target, target);
	assert.deepEqual(
		inputs.targets.find((t) => t.id === target.id),
		target,
	);
	assert.equal(reference.degree, 128);
	assert.equal(reference.allowance, reference.tailAllowance + reference.arithmeticAllowance);
	assert.equal(reference.crosscheck.directionCount, 64 * 256);
	assert.equal(reference.crosscheckDifference, Math.abs(reference.crosscheck.value - reference.value));
	assert.equal(reference.crosscheckTolerance, 1e-10 + 1e-9 * Math.abs(reference.value));
	assert.equal(reference.admitted, reference.crosscheckDifference <= reference.crosscheckTolerance);
	assert.equal(row.rules['sun32-a12'].estimate.directionCount, 384);
	const geometryId = mechanismArtifact(pilot, 'reference.json');
	const geometry = /** @type {SkyAngularFrameDocument} */ (
		JSON.parse(readRepository(geometryId.path, geometryId).toString())
	);
	assert.equal(geometry.schemaId, 'sky-angular-frame-stage-v1');
	assert.equal(geometry.stage, 'pilot');
	assert.deepEqual(geometry.registration, registration.seal);
	assert.deepEqual(geometry.target, target);
	assert.deepEqual(geometry.candidate, {
		stage: 'pilot',
		frame: 'sun',
		radialCount: 8,
		azimuthCount: 16,
		fullDirectionCount: 384,
	});
	identities.push(
		inputsId,
		resultId,
		geometryId,
		mechanismArtifact(original, 'sources.json.gz'),
		mechanismArtifact(pilot, 'sources-delta.json.gz'),
	);
	return {
		spec: inputs.spec,
		target,
		original: row,
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
	};
}
