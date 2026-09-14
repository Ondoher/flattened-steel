import assert from 'node:assert/strict';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';

const noonRoot =
	'tmp/production-algorithm32/distant-sun-strobing-promotion/noon-plan-8c1a18ac-7d0e-4585-98bc-0856a9a01190';
const native48Root = 'tmp/algorithm32/point-local-cache-compiler/bruneton-43b887b4-91f8-4c7d-86fb-fcb372eb3b86';
const comparisonRoot =
	'tmp/production-algorithm32/distant-sun-strobing-promotion/near-ground-direct40-comparison-ae181aa3-07db-44dd-ac0a-5cb08ab23027';
const gpuRoot =
	'tmp/production-algorithm32/distant-sun-strobing-promotion/p2-benchmark-5fa5a979-a66f-4d75-94cf-8db63801a80d';

/** Accepted compact input run used by subsequent numerical experiments. */
export const inputRun = 'tmp/experiments/sky-accuracy-dials/runs/00000-inputs';

/** Snapshot only the compact, authenticated controls and spectral authorities.
 * @returns {string} - Accepted immutable input run path.
 */
export function snapshotInputs() {
	const parents = /** @type {DialFileIdentity[]} */ ([]);
	/** @param {string} file @param {string|DialFileIdentity} expected @returns {Buffer} */
	function read(file, expected) {
		const bytes = readRepository(file, expected);
		parents.push(identity(file, bytes));
		return bytes;
	}
	const noonSeal = JSON.parse(
		read(`${noonRoot}/sealed.json`, '7d511238ea7878eaa24cb83d5732b6db361f74ea393cb81816d71ef66dfab102').toString(),
	);
	assert.ok(noonSeal.accepted && noonSeal.executionSucceeded);
	const planIdentity = noonSeal.artifacts.find((item) => item.path === `${noonRoot}/plan.json`);
	assert.equal(planIdentity.sha256, 'd32a1cd2face12f22843d251f3477f45bc9b835d9642f80ffa096a536c8e2312');
	const plan = JSON.parse(read(planIdentity.path, planIdentity).toString());
	assert.equal(plan.schemaId, 'native51-noon-diagnostic-plan-v1');
	assert.deepEqual(
		plan.domains.map((item) => item.id),
		['native48', 'native51'],
	);
	const profilesPath = 'tmp/experiments/point-local-cache-builder/00000-profiles/profiles.json';
	const profiles = JSON.parse(
		read(profilesPath, 'c4bdd4751ff9f470c570f7f582526cda25a4976c70dda9bd87974e68d976fa00').toString(),
	);
	assert.equal(profiles.scenes.length, 17);
	assert.ok(
		profiles.scenes.every(
			(scene) =>
				scene.observerAltitudeMeters === 0 &&
				Number.isFinite(scene.zenithDegrees) &&
				Number.isFinite(scene.fittedAzimuthDegrees),
		),
	);
	const measurementPath = 'references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv';
	const measurements = read(measurementPath, 'a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74');
	const oldSeal = JSON.parse(
		read(
			`${native48Root}/sealed.json`,
			'a42fe97fa0a23e407ff9715782cecb77d7ceaeff6dc3b9c79bd9d8ab24feae91',
		).toString(),
	);
	assert.ok(oldSeal.executionSucceeded ?? oldSeal.accepted);
	const oldIdentity = oldSeal.artifacts.find((item) => item.path === `${native48Root}/b1.tsv`);
	assert.ok(oldIdentity);
	const native48 = read(oldIdentity.path, oldIdentity);
	const compSealIdentity = plan.parents.find((item) => item.path === `${comparisonRoot}/sealed.json`);
	const compSeal = JSON.parse(read(compSealIdentity.path, compSealIdentity).toString());
	assert.ok(compSeal.accepted && compSeal.executionSucceeded);
	const newIdentity = compSeal.artifacts.find((item) => item.path === `${comparisonRoot}/cpu-b1.tsv`);
	assert.equal(newIdentity.sha256, '75fa3f1332b50f38541c11b5fe31d0302146c310f2a8a3a23ea3f0a3bd5fdd80');
	const native51 = read(newIdentity.path, newIdentity);
	const gpuSeal = JSON.parse(
		read(`${gpuRoot}/sealed.json`, '738da9e953b93ccc01c8faeb52e65027326ce2d3a1f4e24526f2b7f7a879f5b0').toString(),
	);
	assert.ok(gpuSeal.executionSucceeded ?? gpuSeal.accepted);
	const gpuTable = `${gpuRoot}/generation/b1-directional-sky-radiance/gpu/algorithm32-current-production-gpu-j4.tsv`;
	const gpu = read(gpuTable, 'bc946f9a1e6b1784573f32d7e16eaafe42b1ebb5b8f4f48fc5a4acf2b923d9bf');
	const recipe = {
		parents,
		operation:
			'Authenticate accepted parent seals and consumed artifact hashes; extract Native48/51 Direct40 build requests and exact 17 scene geometries; copy compact Kider and prior CPU/GPU spectral boundaries without changing or depending on retained full fields.',
		parameters: {channels: 40, scoredChannels: 31, scenes: 17, raysPerScene: 81},
	};
	const run = createRun('inputs', recipe);
	try {
		run.write('controls.json', {
			schemaId: 'sky-accuracy-inputs-v1',
			native48: plan.domains[0].buildRequest,
			native51: plan.domains[1].buildRequest,
			scenes: profiles.scenes,
			parentPlan: planIdentity,
			units: plan.units,
		});
		run.write('measurements.tsv', measurements);
		run.write('native48-cpu.tsv', native48);
		run.write('native51-cpu.tsv', native51);
		run.write('native48-gpu.tsv', gpu);
		run.write('authority.json', {
			parents,
			reusedSourceDerivation: {
				operation: plan.operation,
				sources: plan.sources,
				tools: plan.tools,
				parents: plan.parents,
			},
			knownDevelopmentEvidence: [
				'Native48 and Native51 complete B1 scores',
				'Seven noon rays and pure-order diagnostic results',
			],
			claim: 'Copied benchmark measurements are previously observed. Only future intervention outcomes can be prospectively withheld.',
		});
		for (const parent of parents) readRepository(parent.path, parent);
		run.progress('authenticated', 'Pinned controls and compact comparison spectra copied and reauthenticated.');
		run.finish('accepted', {conditionCount: 17, rayCount: 81, channelCount: 40, copiedFullFields: false});
	} catch (error) {
		run.finish('failed', {message: String(error), stack: error.stack});
		throw error;
	}
	verifyRun(run.path);
	return run.path;
}
