import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {readAngularBackground} from '../angular-background/read.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';

/** Original incident references remain data; no same-point angular oracle is inferred.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularFrameInput}
 */
export function readAngularFrameInput(registration) {
	const original = readAngularBackground(registration);
	const target = original.cells[0].target;
	assert.equal(target.id, 'p-0930-5-7:h1000');
	for (const cell of original.cells) assert.deepEqual({...cell.target, id: target.id}, target);
	const manufactured = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00210-angular-lobes');
	const pilot = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00161-volume-j2-pilot');
	const parameters = /** @type {SkySourcePhaseParentParameters} */ (
		/** @type {unknown} */ (pilot.terminal.recipe.parameters)
	);
	const incidentSources = parameters.sourceIdentities.filter(
		(id) =>
			id.path.startsWith('experiments/sky-accuracy-dials/continuation/volume-reference/') ||
			id.path.startsWith('experiments/sky-accuracy-dials/continuation/reference/physical/'),
	);
	assert.ok(incidentSources.some((id) => id.path.endsWith('/volume-reference/index.mjs')));
	assert.ok(incidentSources.some((id) => id.path.endsWith('/reference/physical/columns.mjs')));
	for (const id of incidentSources) readRepository(id.path, id);
	return {
		spec: original.spec,
		target,
		baseline: original.cells.map((cell) => ({id: cell.id, rows: cell.rows})),
		identities: [
			...original.identities,
			...incidentSources,
			manufactured.seal,
			mechanismArtifact(manufactured, 'assessment.json'),
			mechanismArtifact(manufactured, 'sources.json.gz'),
		],
	};
}
