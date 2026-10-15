import assert from 'node:assert/strict';
import {gaussRule, miePhase} from '../horizon/diagnosis-transport.mjs';
import {altitude, along, bounds, dot, integrate, unit} from './math.mjs';

/** Boundary-split solid-angle rule around physical local up; independent of the installed source-aligned rule.
 * @param {HorizonAuditInput} input @param {number[]} point @param {number} count
 * @returns {HorizonAuditAngularRule} Positive solid-angle samples.
 */
export function angularRule(input, point, count) {
	const up = input.geometry === 'flat' ? [0, 0, 1] : unit(point), east = [1, 0, 0];
	const north = unit([up[1] * east[2] - up[2] * east[1], up[2] * east[0] - up[0] * east[2], up[0] * east[1] - up[1] * east[0]]);
	const z = altitude(input, point), radius = input.radius + z;
	const tangent = input.geometry === 'flat' ? 0 : -Math.sqrt(Math.max(0, 1 - (input.radius / radius) ** 2));
	const cuts = [-1, tangent, 0, 1].filter((x, i, all) => all.indexOf(x) === i).sort((a, b) => a - b);
	const rule = gaussRule(count), directions = [], weights = [], azimuthCount = 2 * count;
	for (let j = 1; j < cuts.length; j++) for (let i = 0; i < count; i++) {
		const mu = cuts[j - 1] + (cuts[j] - cuts[j - 1]) * rule.nodes[i], r = Math.sqrt(1 - mu * mu);
		for (let a = 0; a < azimuthCount; a++) {
			const phi = 2 * Math.PI * (a + .5) / azimuthCount;
			directions.push(up.map((x, axis) => x * mu + r * (east[axis] * Math.cos(phi) + north[axis] * Math.sin(phi))));
			weights.push(rule.weights[i] * (cuts[j] - cuts[j - 1]) * 2 * Math.PI / azimuthCount);
		}
	}
	return {directions, weights};
}

/** Integrate continuous N1 incoming light into a sparse pure-P2 source at fixed paper material.
 * Both app modes use canonical-black ground: a downward incident ray can contain
 * atmospheric scattering but no reflected-ground radiance. No all-order field is substituted.
 * @param {HorizonAuditInput} input @param {number[]} point @param {number[]} outgoing
 * @param {number[][]} directions @param {number[]} weights @param {()=>void} guard
 * @returns {HorizonAuditAngular}
 */
export function incomingSource(input, point, outgoing, directions, weights, guard) {
	const count = input.rayleigh.length, species = [Array(count).fill(0), Array(count).fill(0)];
	const regions = {ground: Array(count).fill(0), grazing: Array(count).fill(0), sky: Array(count).fill(0)};
	const up = input.geometry === 'flat' ? [0, 0, 1] : unit(point), z = altitude(input, point);
	for (let i = 0; i < directions.length; i++) {
		if (i % 16 === 0) guard();
		const v = directions[i], path = bounds(input, point, v);
		assert.ok(path.distance >= 0 && Number.isFinite(path.distance));
		const light = integrate(input, point, v, 0, path.distance, 8).spectrum;
		const mu = dot(v, up), cosine = dot(v, outgoing), phases = [3 * (1 + cosine * cosine) / (16 * Math.PI), miePhase(cosine, input.g)];
		const region = Math.abs(mu) < .1 ? 'grazing' : path.endsOnGround ? 'ground' : 'sky';
		for (let c = 0; c < count; c++) {
			const r = light[c] * weights[i] * phases[0] * input.rayleigh[c] * Math.exp(-z / input.rayleighHeight);
			const m = light[c] * weights[i] * phases[1] * input.mie[c] * input.albedo * Math.exp(-z / input.mieHeight);
			species[0][c] += r; species[1][c] += m; regions[region][c] += r + m;
		}
	}
	return {solidAngle: weights.reduce((a, b) => a + b, 0), species, regions,
		groundFractions: Array(count).fill(0), directions: directions.length};
}
