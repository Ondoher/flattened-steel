import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {loadInputs} from '../../execution.mjs';
import {readRepository, sha256} from '../../io/files.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {volumeJ2Groups, volumeJ2Targets, sumVolumeJ2} from '../volume-j2/angular.mjs';
import {incidentWorld} from '../j2/angular.mjs';

/** Authenticate only the retained factorial and replay its exact geometry/sums.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularBackgroundInput}
 */
export function readAngularBackground(registration) {
	readRepository(registration.record.inputs.path, registration.record.inputs);
	const spec = loadInputs().native48.transportSpec;
	/** @type {DialFileIdentity[]} */ const identities = [registration.record.inputs];
	/** @type {SkyAngularBackgroundCell[]} */ const cells = [];
	const targetId = 'p-0930-5-7:h1000';
	const expected = volumeJ2Targets(registration, spec).find((t) => t.id === targetId);
	assert.ok(expected);
	for (const [run, stage] of [
		['00161-volume-j2-pilot', 'pilot'],
		['00162-volume-j2-ang', 'angular'],
	]) {
		const parent = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/' + run);
		const params = /** @type {SkySourcePhaseParentParameters} */ (
			/** @type {unknown} */ (parent.terminal.recipe.parameters)
		);
		assert.equal(params.continuationRegistration, registration.run);
		assert.equal(params.jobKind, 'cpu');
		assert.equal(params.phase, 'C5');
		assert.equal(params.caseId, 'volume-j2-' + stage);
		const sourceIds = [
			'/numerics/direct.js',
			'/numerics/math.js',
			'/volume-j2/angular.mjs',
			'/j2/angular.mjs',
			'/reference/physical/quadrature.mjs',
			'/execution.mjs',
		].map((suffix) => {
			const id = params.sourceIdentities.find((r) => r.path.endsWith(suffix));
			assert.ok(id);
			readRepository(id.path, id);
			return id;
		});
		const referenceId = mechanismArtifact(parent, 'reference.json'),
			nodeId = mechanismArtifact(parent, 'incident-nodes.json.gz');
		const doc = /** @type {SkyAngularBackgroundDocument} */ (
			JSON.parse(readRepository(referenceId.path, referenceId).toString())
		);
		assert.equal(doc.schemaId, 'sky-volume-j2-' + stage + '-v1');
		assert.equal(doc.continuationRegistration, registration.run);
		assert.ok(doc.matrixComplete && doc.predictionsPassed);
		assert.deepEqual(doc.channels, [0, 8]);
		const artifact = /** @type {DialArtifact} */ (parent.terminal.artifacts.find((r) => r.path === nodeId.path));
		assert.ok(artifact?.derivation);
		const encoding = /** @type {SkyAngularBackgroundEncoding} */ (artifact.derivation.parameters);
		assert.ok(
			Number.isSafeInteger(encoding.uncompressedByteLength) &&
				encoding.uncompressedByteLength > 0 &&
				encoding.uncompressedByteLength <= 32 * 1024 ** 2,
		);
		const bytes = gunzipSync(readRepository(nodeId.path, nodeId), {
			maxOutputLength: encoding.uncompressedByteLength,
		});
		assert.equal(bytes.length, encoding.uncompressedByteLength);
		assert.equal(sha256(bytes), encoding.uncompressedSha256);
		const allNodes = /** @type {SkyVolumeJ2Node[]} */ (JSON.parse(bytes.toString()));
		const selected =
			stage === 'pilot'
				? [{id: 'r8-a16', target: expected, radialCount: 8, azimuthCount: 16}]
				: (doc.cases ?? []).filter(
						(c) => c.target.probeId === expected.probeId && c.target.heightMeters === 1000,
					);
		assert.equal(selected.length, stage === 'pilot' ? 1 : 3);
		for (const item of selected) {
			assert.deepEqual({...item.target, id: targetId}, expected);
			const index = doc.targets.findIndex((t) => t.id === item.target.id);
			assert.ok(index >= 0);
			assert.deepEqual(doc.targets[index], item.target);
			const groups = volumeJ2Groups(
				spec.planet.bottomRadiusMeters,
				item.target.origin,
				item.radialCount,
				item.azimuthCount,
			);
			const selectedNodes = allNodes.filter((n) => n.targetId === item.target.id),
				nodes = selectedNodes.filter((n) => n.mirrorOf === null);
			assert.equal(nodes.length, groups.length);
			assert.equal(selectedNodes.length, nodes.length + 2);
			for (const node of selectedNodes) {
				const group = groups[node.mirrorOf ?? node.index];
				assert.ok(group);
				const local = node.mirrorOf === null ? group.incident.direction : group.incident.mirror;
				assert.ok(local);
				assert.deepEqual(node.direction, incidentWorld(item.target.origin, local));
				assert.equal(node.branch, group.branch);
				assert.deepEqual(
					node.channels.map((c) => c.channel),
					[0, 8],
				);
				assert.ok(
					node.channels.every((c) => c.atmosphere.resolved && c.directGround.resolved && c.total.resolved),
				);
			}
			const rows = sumVolumeJ2(spec, item.target, [0, 8], groups, nodes);
			assert.deepEqual(rows, doc.rows[index]);
			cells.push({id: item.id, target: item.target, groups, nodes, rows});
		}
		identities.push(parent.seal, referenceId, nodeId, ...sourceIds);
	}
	assert.deepEqual(
		cells.map((c) => c.id),
		['r8-a16', 'r16-a16', 'r8-a32', 'r16-a32'],
	);
	return {spec, cells, identities: [...new Map(identities.map((id) => [id.path, id])).values()]};
}
