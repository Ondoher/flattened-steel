import assert from 'node:assert/strict';
import {scoreDeltaIdentity, spectralDelta, factorialContrast} from '../../analysis/metrics.mjs';
import {compareMechanismReference, interactionResidualIdentity} from './evaluate.mjs';
import {adaptiveMechanismAssessmentProof} from './adaptive/proof.mjs';

/** Verify exact signs, null handling and residual algebra independently of captured fields.
 * @returns {SkyMechanismAssessmentProof} Manufactured evidence only; no atmospheric accuracy claim.
 */
export function mechanismAssessmentProof() {
	let checks = 0;
	for (const [before, after, reference, allowance, expected] of /** @type {const} */ ([
		[3, 2, 1, 0.1, 'improved'],
		[2, 3, 1, 0.1, 'worsened'],
		[3, 2, 1, null, 'unresolved'],
		[3, 2, 1, 0.21, 'unresolved'],
		[3, 3, 1, 0, 'unresolved'],
		[3, 2, 1, 0, 'improved'],
	])) {
		assert.equal(compareMechanismReference(before, after, reference, allowance).status, expected);
		checks++;
	}
	assert.throws(() => compareMechanismReference(1, 2, 3, -1));
	checks++;
	assert.throws(() => compareMechanismReference(1, NaN, 3, 0));
	checks++;
	/** @type {DialAnalysisBoundary} */ const a = {
		configId: 'manufactured-a',
		quantity: 'radiance',
		units: 'W m^-2 sr^-1 nm^-1',
		times: ['09:30'],
		channels: [0],
		rayIndices: [0, 1, 2],
		sourceIdentity: {path: 'manufactured/a', byteLength: 1, sha256: 'a'.repeat(64)},
		values: Float64Array.from([2, 4, 7]),
	};
	const measured = {...a, values: Float64Array.from([3, 5, 5])},
		b = {...a, values: Float64Array.from([3, 3, 6])},
		c = {...a, values: Float64Array.from([2.5, 4.25, 6.5])},
		additive = {
			...a,
			values: Float64Array.from(a.values, (value, index) => b.values[index] + c.values[index] - value),
		};
	const identity = scoreDeltaIdentity(a, measured, spectralDelta(a, b));
	assert.equal(identity.residualCrossTerm, -4);
	checks++;
	assert.equal(identity.deltaSquaredNorm, 3);
	checks++;
	assert.equal(identity.actualSquaredErrorChange, -1);
	checks++;
	assert.equal(identity.identityResidual, 0);
	checks++;
	const factorial = factorialContrast(a, b, c, additive, measured, 1e-8);
	assert.equal(factorial.interactionNorm, 0);
	checks++;
	assert.equal(factorial.squaredErrorInteraction, factorial.additiveSquaredErrorCrossTerm);
	checks++;
	assert.notEqual(factorial.squaredErrorInteraction, 0);
	checks++;
	const joint = {
		...additive,
		values: Float64Array.from(additive.values, (value, index) => value + [0.1, -0.2, 0.3][index]),
	};
	const changed = factorialContrast(a, b, c, joint, measured, 1e-8);
	for (let index = 0; index < 3; index++) {
		assert.ok(Math.abs(changed.interaction.values[index] - [0.1, -0.2, 0.3][index]) < 1e-14);
		checks++;
	}
	const correction = scoreDeltaIdentity(additive, measured, changed.interaction);
	assert.ok(Math.abs(correction.identityResidual) < 1e-14);
	checks++;
	const bytes = Buffer.alloc(24);
	changed.interaction.values.forEach((value, index) => bytes.writeDoubleLE(value, index * 8));
	for (let index = 0; index < 3; index++) {
		assert.equal(bytes.readDoubleLE(index * 8), changed.interaction.values[index]);
		checks++;
	}
	const low = {...a, values: Float64Array.from([0, 0, 0])};
	const negativePrediction = interactionResidualIdentity(a, low, low, joint, measured);
	assert.ok(Math.abs(negativePrediction.identityResidual) < 1e-12);
	checks++;
	const negativeFactorial = factorialContrast(a, low, low, joint, measured, 1e-8);
	assert.ok(
		Math.abs(
			negativeFactorial.squaredErrorInteraction -
				negativeFactorial.additiveSquaredErrorCrossTerm -
				negativePrediction.actualSquaredErrorChange,
		) < 1e-12,
	);
	checks++;
	const adaptive = adaptiveMechanismAssessmentProof();
	return {schemaId: 'sky-mechanism-assessment-proof-v1', checks: checks + adaptive.checks, adaptive};
}
