import assert from 'node:assert/strict';
import {readRepository, verifyRun} from '../../../io/files.mjs';
import {admitPhysicalReferenceChannel} from '../../reference/physical/admission.mjs';
import {physicalReferencePolicy} from '../../reference/physical/policy.mjs';

/** Authenticate the single pre-existing physical-J1 reference and reproduce every admission.
 * The exact pinned run cannot be replaced by a favorable alternative or a schema-only assertion.
 * @param {DialContinuationRegistrationRead} registration - Authenticated C0 registration.
 * @returns {SkyLadderPhysicalRead} Consumed identities and complete checked method evidence.
 */
export function readPhysicalFirst(registration) {
	const run = 'tmp/experiments/sky-accuracy-dials/runs/00109-c1-physical-j1';
	const sealIdentity = verifyRun(run);
	assert.equal(sealIdentity.byteLength, 209177);
	assert.equal(sealIdentity.sha256, '2e25adfe8ebecaf9da1cb036e435a1c30ada827a6bcb9e54757df3ad0cdb3995');
	/** @type {SkyJ1AssessmentSeal} */ const seal = JSON.parse(
		readRepository(sealIdentity.path, sealIdentity).toString(),
	);
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.run, run);
	assert.equal(seal.recipe.parameters.continuationRegistration, registration.run);
	assert.equal(seal.recipe.parameters.phase, 'C1');
	assert.equal(seal.recipe.parameters.jobKind, 'cpu');
	assert.equal(seal.recipe.parameters.scope, 'component');
	assert.equal(seal.result.caseId, 'physical-j1-reference');
	/** @type {DialFileIdentity[]} */ const parents = [sealIdentity];
	/** Read one consumed artifact against its exact terminal identity.
	 * @param {string} name - Sealed artifact basename. @returns {Buffer} Authenticated bytes.
	 */
	const read = (name) => {
		const artifact = seal.artifacts.find((item) => item.path === `${run}/${name}`);
		assert.ok(artifact, `Missing physical-reference artifact ${name}.`);
		parents.push(artifact);
		return readRepository(artifact.path, artifact);
	};
	/** @type {SkyLadderPhysicalControl} */ const control = JSON.parse(read('control.json').toString());
	assert.deepEqual(control.registration, registration.seal);
	assert.deepEqual(control.input, registration.record.inputs);
	assert.deepEqual(control.channels, [0, 8, 24, 30]);
	assert.deepEqual(control.channels, registration.record.scopes.probeChannels);
	assert.equal(registration.probes.length, 40);
	assert.equal(registration.record.probeRays.length, 40);
	const expected = registration.record.probeRays.map((ray, index) => ({
		id: registration.probes[index].probeId,
		time: ray.time,
		gridX: ray.gridX,
		gridY: ray.gridY,
		ray: {origin: ray.origin, direction: ray.direction, length: ray.lengthMeters},
	}));
	assert.deepEqual(control.probes, expected);
	assert.equal(control.profile, 'simpson-expanded-medium');
	assert.deepEqual(control.numericalPolicy, physicalReferencePolicy(control.profile));
	/** @type {SkyPhysicalReferenceReport} */ const record = JSON.parse(read('reference.json').toString());
	assert.equal(record.schemaId, 'sky-independent-physical-j1-reference-v1');
	assert.equal(record.units, 'W m^-2 sr^-1 nm^-1');
	assert.equal(record.profile, control.profile);
	assert.deepEqual(record.numericalPolicy, control.numericalPolicy);
	assert.equal(record.rows.length, 160);
	assert.equal(record.probes.length, 40);
	for (const [probeIndex, probe] of expected.entries()) {
		const detail = record.probes[probeIndex];
		assert.equal(detail.probeId, probe.id);
		assert.deepEqual(
			detail.methods.map((method) => method.method),
			['gauss', 'simpson'],
		);
		for (const method of detail.methods) {
			assert.equal(method.converged, true);
			assert.deepEqual(method.reasons, []);
			assert.deepEqual(
				method.passes.map((pass) => pass.toleranceScale),
				[4, 1],
			);
			assert.ok(method.passes.every((pass) => pass.converged && pass.reason === null));
			assert.equal(
				method.mediumEvaluations,
				method.passes.reduce((sum, pass) => sum + pass.mediumEvaluations, 0),
			);
			assert.equal(
				method.outerEvaluations,
				method.passes.reduce((sum, pass) => sum + pass.outerEvaluations, 0),
			);
			assert.ok(method.mediumEvaluations <= control.numericalPolicy.maximumMediumEvaluations[method.method]);
			assert.ok(method.outerEvaluations <= control.numericalPolicy.maximumOuterEvaluations);
			for (const pass of method.passes) {
				for (const count of [
					pass.mediumEvaluations,
					pass.outerEvaluations,
					pass.columnCalls,
					pass.maximumColumnEvaluationsUsed,
				])
					assert.ok(Number.isInteger(count) && count >= 0);
				assert.ok(Number.isFinite(pass.elapsedMilliseconds) && pass.elapsedMilliseconds >= 0);
				assert.ok(pass.maximumColumnEvaluationsUsed <= control.numericalPolicy.maximumColumnEvaluations);
			}
			for (const values of [
				method.values,
				method.coarseValues,
				method.refinementDifferences,
				method.outerErrors,
				method.innerAllowances,
			]) {
				assert.ok(values && values.length === 4);
				assert.ok(values.every((value) => Number.isFinite(value) && value >= 0));
			}
		}
		for (const [channelIndex, channel] of control.channels.entries()) {
			const row = record.rows[probeIndex * 4 + channelIndex];
			assert.equal(row.probeId, probe.id);
			assert.equal(row.time, probe.time);
			assert.equal(row.gridX, probe.gridX);
			assert.equal(row.gridY, probe.gridY);
			assert.equal(row.channel, channel);
			const [a, b] = detail.methods;
			const admitted = admitPhysicalReferenceChannel(a, b, channelIndex);
			assert.equal(row.gaussWatts, a.values[channelIndex]);
			assert.equal(row.simpsonWatts, b.values[channelIndex]);
			for (const key of ['resolved', 'methodDifferenceWatts', 'empiricalAllowanceWatts', 'reasons'])
				assert.deepEqual(row[key], admitted[key]);
			assert.equal(row.resolved, true);
		}
	}
	assert.equal(record.resolved, true);
	return {run, parents, record};
}
