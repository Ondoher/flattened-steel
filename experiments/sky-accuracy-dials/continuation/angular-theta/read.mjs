import assert from 'node:assert/strict';
import {readRepository} from '../../io/files.mjs';
import {readAngularFrameInput} from '../angular-frame/read.mjs';
import {acceptedMechanismInput, mechanismArtifact} from '../mechanisms/registration.mjs';
import {phase} from '../../numerics/direct.js';
import {clamp, dot} from '../../numerics/math.js';
import {incidentWorld} from '../j2/angular.mjs';
import {thetaGroups} from './geometry.mjs';

/** Old stages supply matched numerical values, not an automatically admitted oracle.
 * The new geometry replays only the already-known analytic theta16x64 field.
 * @param {DialContinuationRegistrationRead} registration @returns {SkyAngularThetaInput}
 */
export function readAngularThetaInput(registration) {
	const original = readAngularFrameInput(registration);
	/** @type {DialFileIdentity[]} */ const identities = [...original.identities];
	const stages = /** @type {const} */ ([
		['00213-af-sun16', '97469b4eb92a7bc8ed6339ad93f78cc01c28ba6efcadbda9c640034610655f7c', 'sun16'],
		['00215-af-radial32', '8f5b2a930e3f7e24be7eb3cc35c7ee84be6033cbcf86534060770cbe8289b5b9', 'radial32'],
		['00216-af-radial64', '2821e9f54c56cde460d6a623e34e6532d798b80ec6e60fbd982613cf65b7dce1', 'radial64'],
	]);
	const rows = stages.map(([name, hash, stage]) => {
		const parent = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/' + name);
		assert.equal(parent.seal.sha256, hash);
		const id = mechanismArtifact(parent, 'reference.json');
		const document = /** @type {SkyAngularFrameDocument} */ (JSON.parse(readRepository(id.path, id).toString()));
		assert.equal(document.schemaId, 'sky-angular-frame-stage-v1');
		assert.equal(document.packageId, 'angular-frame-morning-v1');
		assert.equal(document.stage, stage);
		assert.deepEqual(document.registration, registration.seal);
		assert.deepEqual(document.target, original.target);
		assert.deepEqual(document.channels, [0, 8]);
		assert.ok(document.matrixComplete && document.rows && !document.partialCountsUnavailable);
		assert.equal(document.retainedNodeCount, document.expectedCount);
		assert.ok(document.checks.every((c) => c.state === 'passed'));
		const terminal = /** @type {SkyAngularFrameTerminal} */ (
			JSON.parse(readRepository(parent.seal.path, parent.seal).toString())
		);
		const physicalSources = terminal.recipe.parameters.sourceIdentities.filter(
			(source) =>
				source.path.includes('/volume-reference/') ||
				source.path.includes('/reference/physical/') ||
				source.path.includes('/volume-worker/') ||
				[
					'/volume-j2/angular.mjs',
					'/volume-j2/assess.mjs',
					'/j2/angular.mjs',
					'/numerics/math.js',
					'/numerics/direct.js',
				].some((suffix) => source.path.endsWith(suffix)),
		);
		assert.ok(physicalSources.some((source) => source.path.endsWith('/volume-worker/pool.mjs')));
		for (const source of physicalSources) readRepository(source.path, source);
		identities.push(parent.seal, id, mechanismArtifact(parent, 'sources-delta.json.gz'), ...physicalSources);
		return document.rows;
	});
	const endpoint = acceptedMechanismInput('tmp/experiments/sky-accuracy-dials/runs/00219-af-endpoint');
	assert.equal(endpoint.seal.sha256, 'be5d89cab17e47d10975f7a942dbe715d6f862814cc2b8775d153f7d4f9dfe7f');
	const endpointId = mechanismArtifact(endpoint, 'assessment.json');
	const endpointResult = /** @type {SkyAngularEndpointResult} */ (
		JSON.parse(readRepository(endpointId.path, endpointId).toString())
	);
	assert.equal(endpointResult.schemaId, 'sky-angular-endpoint-control-v1');
	assert.deepEqual(endpointResult.target, original.target);
	assert.equal(endpointResult.g, original.spec.atmosphere.miePhaseFunctionG);
	assert.ok(Object.values(endpointResult.implementationChecks).every((state) => state === 'passed'));
	const matches = endpointResult.rows.filter((row) => row.id === 'theta16-a64');
	assert.equal(matches.length, 1);
	const retained = matches[0];
	assert.equal(retained.directionCount, 3072);
	const endpointTerminal = /** @type {SkyAngularFrameControlTerminal} */ (
		JSON.parse(readRepository(endpoint.seal.path, endpoint.seal).toString())
	);
	const producer = endpointTerminal.recipe.parameters.sourceIdentities.filter((source) =>
		source.path.endsWith('/angular-endpoint-control/index.mjs'),
	);
	assert.equal(producer.length, 1);
	readRepository(producer[0].path, producer[0]);
	let value = 0,
		scale = 0;
	for (const {incident} of thetaGroups(original.spec.planet.bottomRadiusMeters, original.target.origin, 16, 64)) {
		assert.ok(incident.mirror);
		for (const local of [incident.direction, incident.mirror]) {
			const world = incidentWorld(original.target.origin, local);
			const term =
				incident.weight *
				phase(original.spec, clamp(world[2], -1, 1))[1] *
				phase(original.spec, clamp(dot(original.target.direction, world), -1, 1))[1];
			value += term;
			scale += Math.abs(term);
		}
	}
	const allowance = 8192 * Number.EPSILON * scale + 1e-13;
	const difference = value - retained.full.value;
	const comparisonAllowance = allowance + retained.full.allowance;
	const analyticReplay = {
		value,
		allowance,
		difference,
		comparisonAllowance,
		passed: Math.abs(difference) <= comparisonAllowance,
	};
	assert.ok(analyticReplay.passed, 'Theta radial-frame conversion must replay the known analytic field.');
	identities.push(endpoint.seal, endpointId, mechanismArtifact(endpoint, 'sources-delta.json.gz'), ...producer);
	return {
		spec: original.spec,
		target: original.target,
		mu16: rows[0],
		radial32: rows[1],
		radial64: rows[2],
		analyticReplay,
		identities: [...new Map(identities.map((id) => [id.path, id])).values()],
	};
}
