import assert from 'node:assert/strict';
import {createProductQuadrature} from '../sky-accuracy-dials/numerics/profile.js';
import {gaussRule, miePhase} from '../sky-accuracy-dials/horizon/diagnosis-transport.mjs';
import {dot, unit} from '../sky-accuracy-dials/horizon-audit/math.mjs';

/** Positive fixed rules; counts are chosen before evaluation. @returns {AngularRule[]} */
export function candidates() {
	return [
		[8, 16],
		[16, 32],
		[32, 64],
	].map(([mu, phi]) => {
		const rule = createProductQuadrature(mu, phi);
		return {
			id: `angular-gl-${mu}x${phi}-v1`,
			directions: rule.unitVectors.map((v) => Array.from(v)),
			weights: rule.integrationWeightsSteradians.slice(),
		};
	});
}

/** Concentrate positive cosine nodes around the physical horizon; no residual fitting.
 * @param {readonly number[]} [counts] Positive Gaussian counts per band.
 * @param {number} [azimuthCount] Uniform azimuth count.
 * @returns {AngularRule[]} Prospectively registered systematic refinements.
 */
export function horizonCandidates(counts = [4, 6, 8], azimuthCount = 32) {
	const cuts = [-1, -0.2, -0.02, -0.002, 0, 0.002, 0.02, 0.2, 1];
	return counts.map((count) => {
		const q = gaussRule(count),
			directions = [],
			weights = [];
		for (let j = 1; j < cuts.length; j++)
			for (let k = 0; k < count; k++)
				for (let a = 0; a < azimuthCount; a++) {
					const mu = cuts[j - 1] + q.nodes[k] * (cuts[j] - cuts[j - 1]),
						r = Math.sqrt(1 - mu * mu),
						phi = (2 * Math.PI * (a + 0.5)) / azimuthCount;
					directions.push([r * Math.cos(phi), r * Math.sin(phi), mu]);
					weights.push((q.weights[k] * (cuts[j] - cuts[j - 1]) * 2 * Math.PI) / azimuthCount);
				}
		return {
			id: `angular-horizon-${count}x${azimuthCount}-v1`,
			frame: /** @type {const} */ ('receiver'),
			directions,
			weights,
		};
	});
}

/** Receiver-local axes with first tangent toward the projected source.
 * @param {readonly number[]} point @param {readonly number[]} sun @returns {number[][]}
 */
export function receiverFrame(point, sun) {
	const z = unit(point),
		projected = sun.map((v, i) => v - dot(z, sun) * z[i]);
	const x = Math.hypot(...projected) > 1e-12 ? unit(projected) : unit([1, 0, 0].map((v, i) => v - z[0] * z[i]));
	const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
	return [x, y, z];
}

/** Authenticate the physical source-aligned basis, including its reference-axis branch.
 * @param {readonly number[]} sun @returns {number[][]} Orthonormal right-handed axes.
 */
export function frame(sun) {
	const x = unit(sun),
		reference = Math.abs(x[2]) < 0.95 ? [0, 0, 1] : [0, 1, 0];
	const z = unit(reference.map((v, i) => v - dot(reference, x) * x[i]));
	const y = unit([z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]);
	assert.ok(Math.abs(dot(x, y)) < 1e-12 && Math.abs(dot(y, z)) < 1e-12);
	return [x, y, z];
}

/** Rotate a fixed local inventory without changing its weights.
 * @param {AngularRule} rule @param {readonly (readonly number[])[]} axes @returns {AngularRule}
 */
export function rotate(rule, axes) {
	return {
		...rule,
		directions: rule.directions.map((v) =>
			unit([0, 1, 2].map((i) => v.reduce((s, x, k) => s + x * axes[k][i], 0))),
		),
	};
}

/** Integrate two normalized phase functions; return their unrenormalized masses.
 * @param {AngularRule} rule @param {readonly number[]} outgoing @param {number} g @returns {number[]}
 */
export function moments(rule, outgoing, g) {
	const result = [0, 0];
	for (let i = 0; i < rule.directions.length; i++) {
		const mu = dot(rule.directions[i], outgoing),
			w = rule.weights[i];
		result[0] += (w * 3 * (1 + mu * mu)) / (16 * Math.PI);
		result[1] += w * miePhase(mu, g);
	}
	return result;
}

/** Independent phase-resolving product integral around the queried outgoing axis.
 * Not an executable candidate; the orientation depends on the query.
 * @param {number} count @param {readonly number[]} outgoing @returns {AngularRule}
 */
export function phaseReference(count, outgoing) {
	const z = unit(outgoing),
		ref = Math.abs(z[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
	const x = unit(ref.map((v, i) => v - dot(ref, z) * z[i]));
	const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
	const q = gaussRule(count),
		directions = [],
		weights = [];
	for (let i = 0; i < count; i++)
		for (let a = 0; a < count * 2; a++) {
			const mu = 2 * q.nodes[i] - 1,
				r = Math.sqrt(1 - mu * mu),
				phi = (2 * Math.PI * (a + 0.5)) / (count * 2);
			directions.push(z.map((v, k) => v * mu + r * (x[k] * Math.cos(phi) + y[k] * Math.sin(phi))));
			weights.push((q.weights[i] * 2 * Math.PI) / count);
		}
	return {id: `query-aligned-reference-${count}`, directions, weights};
}
