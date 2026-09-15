import assert from 'node:assert/strict';
import {outputRelative, readRepository} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {readSourceReconstruction} from '../source-reconstruction/read.mjs';

/** Authenticate the exact corrected original-grid case and its original source-column parents.
 * Source-count execution belongs only to the separate target API.
 * @param {DialContinuationRegistrationRead} registration @param {string} gridRun
 * @returns {SkySourceRefinementInput}
 */
export function readSourceRefinement(registration, gridRun) {
	assert.equal(gridRun, outputRelative + '/runs/00205-source-grid');
	const parent = acceptedMechanismInput(gridRun);
	const parameters =
		/** @type {{caseId:string,extensionId:string,continuationRegistration:string,jobKind:string,phase:string,predictionRun:string,targetRun:string,sourceIdentities:readonly DialFileIdentity[]}} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
	assert.equal(parameters.caseId, 'source-grid');
	assert.equal(parameters.extensionId, 'compensation-attribution-v1');
	assert.equal(parameters.continuationRegistration, registration.run);
	assert.equal(parameters.jobKind, 'cpu');
	assert.equal(parameters.phase, 'C5');
	const {predictionRun, targetRun} = parameters;
	assert.equal(predictionRun, outputRelative + '/runs/00188-src-column-pred');
	assert.equal(targetRun, outputRelative + '/runs/00189-src-column-s160');
	const sources = ['grid.mjs', 'index.mjs', 'phase.mjs', 'column.mjs', 'transmission.mjs', 'read.mjs'].map((name) => {
		const matches = parameters.sourceIdentities.filter((id) => id.path.endsWith('/source-reconstruction/' + name));
		assert.equal(matches.length, 1);
		readRepository(matches[0].path, matches[0]);
		return matches[0];
	});
	const original = readSourceReconstruction(registration, predictionRun, targetRun);
	const decompositionId = mechanismArtifact(parent, 'decomposition.json');
	const baseline = /** @type {SkySourceRefinementBaseline} */ (
		JSON.parse(readRepository(decompositionId.path, decompositionId).toString())
	);
	assert.equal(baseline.schemaId, 'sky-source-grid-v1');
	assert.equal(baseline.rows.length, 64);
	assert.equal(baseline.groups.length, 4);
	assert.ok(baseline.groups.every((g) => Object.values(g.checks).every((state) => state === 'passed')));
	const predicted = acceptedMechanismInput(predictionRun),
		target = acceptedMechanismInput(targetRun);
	const predictionId = mechanismArtifact(predicted, 'prediction.json'),
		targetId = mechanismArtifact(target, 'target.json');
	const prediction = /** @type {SkySourceAuditPredictionRecord} */ (
		JSON.parse(readRepository(predictionId.path, predictionId).toString())
	);
	const finite = /** @type {SkySourceReconstructionTarget} */ (
		JSON.parse(readRepository(targetId.path, targetId).toString())
	);
	assert.equal(prediction.schemaId, 'sky-source-column-prediction-v1');
	assert.equal(finite.schemaId, 'sky-source-column-target-v1');
	assert.deepEqual(prediction.registration, registration.seal);
	assert.equal(finite.predictionRun, predictionRun);
	const identities = [
		...original.identities,
		parent.seal,
		decompositionId,
		mechanismArtifact(parent, 'sources.json.gz'),
		...sources,
		predictionId,
		targetId,
	];
	const unique = new Map();
	for (const id of identities) {
		if (unique.has(id.path)) assert.deepEqual(unique.get(id.path), id);
		unique.set(id.path, id);
	}
	return {
		gridRun,
		predictionRun,
		targetRun,
		identities: [...unique.values()],
		input: original.input,
		columns: original.columns,
		prediction,
		target: finite,
		baseline,
	};
}
