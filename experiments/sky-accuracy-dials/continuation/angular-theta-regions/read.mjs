import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {readAngularThetaInput} from '../angular-theta/read.mjs';
import {readAngularThetaRuns, readAngularThetaNodes, thetaAdmittedDocument} from '../angular-theta/records.mjs';

export const thetaRegionsPlanPath =
	'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/angular-theta-regions-plan.md';
export const thetaRegionsPackageId = 'angular-theta-regions-v1';
export const thetaRegionsCaseId = 'angular-theta-regions';
/** @type {readonly DialFileIdentity[]} */
export const thetaRegionsParentSeals = [
	{
		path: 'tmp/experiments/sky-accuracy-dials/runs/00220-at-pilot/sealed.json',
		byteLength: 307000,
		sha256: 'd1b237dd8b628de5b82ed33f5e5b2dc5d26c0e18d6b336b8e42a2f4cae5eef26',
	},
	{
		path: 'tmp/experiments/sky-accuracy-dials/runs/00221-at-fine/sealed.json',
		byteLength: 314579,
		sha256: 'eea066a73776ea2f12bfb96588eb891d9833406b3766b3ad32cddb300d4d8b03',
	},
	{
		path: 'tmp/experiments/sky-accuracy-dials/runs/00222-at-assess/sealed.json',
		byteLength: 304312,
		sha256: '2a2d372d0d03620aef3d760da5e21f86158d2626ff38c423abab0ecdc082c462',
	},
];

/** @param {SkyAngularThetaRunEntry} entry @param {string} name @returns {DialFileIdentity} */
function artifact(entry, name) {
	const matches = entry.terminal.artifacts.filter((id) => id.path === entry.run + '/' + name);
	assert.equal(matches.length, 1);
	const {path, byteLength, sha256} = matches[0];
	const id = {path, byteLength, sha256};
	readRepository(path, id);
	return id;
}

/** Authenticate the complete saved batches and their unchanged source/model provenance.
 * Does not calculate the registered regional values or invoke an incident solver.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyThetaRegionsRead}
 */
export function readThetaRegions(registration) {
	const input = readAngularThetaInput(registration);
	const entries = readAngularThetaRuns(registration);
	const selected = thetaRegionsParentSeals.map((seal, index) => {
		const matches = entries.filter((entry) => entry.seal.path === seal.path);
		assert.equal(matches.length, 1);
		const entry = matches[0];
		assert.deepEqual(entry.seal, seal);
		assert.equal(entry.terminal.state, 'accepted');
		assert.equal(entry.terminal.result.failure, null);
		assert.equal(entry.terminal.recipe.parameters.stage, ['pilot', 'fine', 'assess'][index]);
		assert.equal(entry.terminal.recipe.parameters.continuationRegistration, registration.run);
		const parameters = /** @type {SkyThetaRegionsParentParameters} */ (entry.terminal.recipe.parameters);
		assert.deepEqual(parameters.node, registration.record.host.node);
		return entry;
	});
	const pilot = thetaAdmittedDocument(selected, 'pilot'),
		fine = thetaAdmittedDocument(selected, 'fine');
	assert.ok(pilot && fine, 'Only the complete accepted pilot and fine incident matrices may be partitioned.');
	assert.deepEqual(pilot.target, input.target);
	assert.deepEqual(fine.target, input.target);
	assert.deepEqual(pilot.plan, fine.plan);
	assert.equal(pilot.expectedCount, 770);
	assert.equal(fine.expectedCount, 3074);
	/** @type {Map<string,DialFileIdentity>} */ const identities = new Map();
	/** @param {DialFileIdentity} id @returns {void} */
	function retain(id) {
		const previous = identities.get(id.path);
		if (previous) assert.deepEqual(previous, id, 'All stages must share exact consumed source identities.');
		else {
			readRepository(id.path, id);
			identities.set(id.path, id);
		}
	}
	for (const id of input.identities) retain(id);
	for (const entry of selected) {
		retain(entry.seal);
		for (const source of entry.terminal.recipe.parameters.sourceIdentities) retain(source);
		for (const parent of entry.terminal.recipe.parents) retain(parent);
		for (const name of ['inputs.json', 'sources-delta.json.gz', 'angular-theta-plan.md'])
			retain(artifact(entry, name));
		const originalInputId = artifact(entry, 'inputs.json');
		const originalInput = /** @type {SkyThetaRegionsRetainedThetaInput} */ (
			JSON.parse(readRepository(originalInputId.path, originalInputId).toString())
		);
		assert.deepEqual(originalInput, {
			target: input.target,
			channels: [0, 8],
			mu16: input.mu16,
			radial32: input.radial32,
			radial64: input.radial64,
			analyticReplay: input.analyticReplay,
			identities: input.identities,
		});
	}
	retain(artifact(selected[0], 'reference.json'));
	retain(artifact(selected[1], 'reference.json'));
	for (const batch of [...pilot.nodeBatches, ...fine.nodeBatches]) retain(batch.artifact);
	const assessmentArtifact = artifact(selected[2], 'assessment.json');
	retain(assessmentArtifact);
	const assessment = /** @type {SkyAngularThetaAssessment} */ (
		JSON.parse(readRepository(assessmentArtifact.path, assessmentArtifact).toString())
	);
	assert.equal(assessment.schemaId, 'sky-angular-theta-assessment-v1');
	assert.equal(assessment.packageId, 'angular-theta-attribution-v1');
	assert.equal(assessment.allStagesComplete, true);
	assert.deepEqual(assessment.missingOrIncomplete, []);
	assert.ok(
		selected[2].terminal.recipe.parents.some(
			(id) => id.path === selected[0].seal.path && id.sha256 === selected[0].seal.sha256,
		),
	);
	assert.ok(
		selected[2].terminal.recipe.parents.some(
			(id) => id.path === selected[1].seal.path && id.sha256 === selected[1].seal.sha256,
		),
	);
	return {
		input,
		pilot,
		pilotNodes: readAngularThetaNodes(selected[0]),
		fine,
		fineNodes: readAngularThetaNodes(selected[1]),
		assessment: {seal: selected[2].seal, artifact: assessmentArtifact},
		identities: [...identities.values()],
	};
}
