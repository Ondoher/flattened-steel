import assert from 'node:assert/strict';
import {gaussRule, miePhase} from '../horizon/diagnosis-transport.mjs';

/** Cartesian dot product. @param {readonly number[]} a @param {readonly number[]} b @returns {number} */
export function dot(a, b) {return a.reduce((sum, x, i) => sum + x * b[i], 0);}

/** Normalize a nonzero Cartesian direction. @param {readonly number[]} v @returns {number[]} */
export function unit(v) {const n = Math.hypot(...v); assert.ok(n > 0); return v.map(x => x / n);}

/** Evaluate a physical ray. @param {readonly number[]} p @param {readonly number[]} v @param {number} t @returns {number[]} */
export function along(p, v, t) {return p.map((x, i) => x + v[i] * t);}

/** Stable roots of a sphere in binary64, independently of installed intersection helpers.
 * @param {number[]} p @param {number[]} v @param {number} radius @returns {number[]}
 */
export function roots(p, v, radius) {
	const r = Math.hypot(...p), b = dot(p, v), c = (r - radius) * (r + radius), d = b * b - c;
	if (d < 0) return [];
	const q = -b - Math.sign(b || 1) * Math.sqrt(d);
	return (q === 0 ? [0] : [q, c / q]).sort((a, b) => a - b);
}

/** Geometric altitude without a cache coordinate transform. @param {HorizonAuditInput} input @param {number[]} p @returns {number} */
export function altitude(input, p) {return input.geometry === 'flat' ? p[2] : Math.hypot(...p) - input.radius;}

/** Independently choose the first physical top/ground intersection; no scene depth or observer dome.
 * @param {HorizonAuditInput} input @param {number[]} p @param {number[]} v @returns {HorizonAuditBoundary}
 */
export function bounds(input, p, v) {
	const z = altitude(input, p);
	assert.ok(z > -1e-6 && z <= input.topAltitude + 1e-6);
	let top = Infinity, ground = Infinity;
	if (input.geometry === 'flat') {
		if (v[2] > 0) top = Math.max(0, (input.topAltitude - z) / v[2]);
		if (v[2] < 0) ground = Math.max(0, -z / v[2]);
	} else {
		top = roots(p, v, input.radius + input.topAltitude).filter(t => t >= -1e-7).at(-1) ?? Infinity;
		if (dot(p, v) < 0) ground = roots(p, v, input.radius).find(t => t >= -1e-7) ?? Infinity;
	}
	const distance = Math.min(top, ground);
	return {top, ground, distance, endsOnGround: ground <= top};
}

/** Independent dome exit; its physical/model status remains separate from the slab boundary.
 * @param {HorizonAuditInput} input @param {number[]} p @param {number[]} v @returns {number}
 */
export function domeExit(input, p, v) {return roots([p[0], p[1], p[2] - input.domeCenterZ], v, input.domeRadius).at(-1);}

/** Exact exponential column, stable at horizontal directions and across downward segments.
 * @param {number} z @param {number} mu @param {number} length @param {number} height @returns {number}
 */
export function flatColumn(z, mu, length, height) {
	const q = mu * length / height;
	return Math.exp(-z / height) * length * (Math.abs(q) < 1e-8 ? 1 - q / 2 + q * q / 6 : -Math.expm1(-q) / q);
}

const rules = new Map([8, 16, 24, 32].map(n => [n, gaussRule(n)]));

/** Fixed geometric distance segmentation, independent of candidate values.
 * @param {number} start @param {number} end @returns {number[]}
 */
function segments(start, end) {
	const cuts = [start];
	for (let d = 250; d < end; d *= 2) if (d > start) cuts.push(d);
	return [...cuts, end];
}

/** Two-species density columns, using analytic flat columns or segmented spherical Gauss quadrature.
 * @param {HorizonAuditInput} input @param {number[]} p @param {number[]} v @param {number} length
 * @param {number} [count] @returns {number[]}
 */
export function columns(input, p, v, length, count = 16) {
	assert.ok(length >= 0 && Number.isFinite(length));
	const heights = [input.rayleighHeight, input.mieHeight];
	if (input.geometry === 'flat') return heights.map(h => flatColumn(p[2], v[2], length, h));
	const rule = rules.get(count), result = [0, 0], cuts = segments(0, length);
	assert.ok(rule);
	for (let s = 1; s < cuts.length; s++) {
		const width = cuts[s] - cuts[s - 1];
		for (let i = 0; i < count; i++) {
			const z = altitude(input, along(p, v, cuts[s - 1] + width * rule.nodes[i]));
			assert.ok(z > -1e-5);
			for (let k = 0; k < 2; k++) result[k] += width * rule.weights[i] * Math.exp(-Math.max(0, z) / heights[k]);
		}
	}
	return result;
}

/** Exact-point N1 source with independently derived source path, combined extinction and finite-source dilution.
 * @param {HorizonAuditInput} input @param {number[]} p @param {number[]} outgoing @param {number} [count]
 * @returns {HorizonAuditSource}
 */
export function source(input, p, outgoing, count = 16) {
	const z = Math.max(0, altitude(input, p));
	const delta = input.sourceKind === 'finite' ? input.sourcePosition.map((x, i) => x - p[i]) : input.sourceDirection;
	const distance = Math.hypot(...delta), direction = unit(delta), path = bounds(input, p, direction);
	const col = path.endsOnGround ? [0, 0] : columns(input, p, direction, Math.max(0, path.distance), count);
	const dilution = input.sourceKind === 'finite' ? (input.referenceDistance / distance) ** 2 : input.incidentScale;
	const cosine = Math.max(-1, Math.min(1, dot(outgoing, direction)));
	const phases = [3 * (1 + cosine * cosine) / (16 * Math.PI), miePhase(cosine, input.g)];
	const r = Math.exp(-z / input.rayleighHeight), m = Math.exp(-z / input.mieHeight);
	const species = [[], []], extinction = [];
	for (let c = 0; c < input.rayleigh.length; c++) {
		const beam = path.endsOnGround ? 0 : input.sourceIrradiance[c] * dilution * Math.exp(-input.rayleigh[c] * col[0] - input.mie[c] * col[1]);
		species[0].push(beam * input.rayleigh[c] * r * phases[0]);
		species[1].push(beam * input.mie[c] * m * input.albedo * phases[1]);
		extinction.push(input.rayleigh[c] * r + input.mie[c] * m);
	}
	return {species, extinction, columns: col, sourceDirection: direction, dilution, altitude: z};
}

/** Segmented continuous N1 integral with analytic/independent view columns; optional held source changes no other operation.
 * @param {HorizonAuditInput} input @param {number[]} origin @param {number[]} v @param {number} start @param {number} end
 * @param {number} [count] @param {HorizonAuditSourceSampler} [sampler] @returns {HorizonAuditIntegral}
 */
export function integrate(input, origin, v, start, end, count = 16, sampler) {
	const rule = rules.get(count), n = input.rayleigh.length, species = [Array(n).fill(0), Array(n).fill(0)];
	assert.ok(rule && end >= start && Number.isFinite(end));
	const cuts = segments(start, end);
	for (let s = 1; s < cuts.length; s++) {
		const width = cuts[s] - cuts[s - 1];
		for (let i = 0; i < count; i++) {
			const t = cuts[s - 1] + width * rule.nodes[i], p = along(origin, v, t), col = columns(input, origin, v, t, count);
			const f = sampler ? [sampler(p, v), Array(n).fill(0)] : source(input, p, v, count).species;
			for (let c = 0; c < n; c++) {
				const w = width * rule.weights[i] * Math.exp(-input.rayleigh[c] * col[0] - input.mie[c] * col[1]);
				for (let k = 0; k < 2; k++) species[k][c] += w * f[k][c];
			}
		}
	}
	const col = columns(input, origin, v, end, count);
	return {species, spectrum: species[0].map((x, c) => x + species[1][c]),
		transmission: input.rayleigh.map((x, c) => Math.exp(-x * col[0] - input.mie[c] * col[1]))};
}

/** Faithful binary64 replay of the installed view policies on a fixed source, without GPU precision or cache changes.
 * @param {HorizonAuditInput} input @param {number[]} origin @param {number[]} v @param {number} length
 * @param {number} count @param {HorizonAuditSourceSampler} [sampler] @returns {number[]}
 */
export function replay(input, origin, v, length, count, sampler) {
	const result = Array(input.rayleigh.length).fill(0), transmission = result.map(() => 1);
	if (input.geometry === 'spherical') {
		for (let i = 0; i < count; i++) {
			const a = length * (i / count) ** 2, b = length * ((i + 1) / count) ** 2, width = b - a;
			const p = along(origin, v, (a + b) / 2), f = source(input, p, v), j = sampler ? sampler(p, v) : f.species[0].map((x, c) => x + f.species[1][c]);
			for (let c = 0; c < result.length; c++) {
				const half = Math.exp(-0.5 * width * f.extinction[c]);
				result[c] += transmission[c] * half * j[c] * width;
				transmission[c] *= half * half;
			}
		}
		return result;
	}
	const exponent = -v[2] * length / input.rayleighHeight;
	let previousT = 0, previous = result.slice();
	for (let i = 0; i <= count; i++) {
		const fraction = i / count, increment = fraction ** 2 * Math.expm1(exponent);
		const logarithm = Math.abs(increment) < .001 ? increment - increment ** 2 / 2 + increment ** 3 / 3 : Math.log1p(increment);
		const t = i === 0 ? 0 : i === count ? length : Math.abs(exponent) < .001 ? length * fraction ** 2 : Math.max(0, Math.min(length, -input.rayleighHeight / v[2] * logarithm));
		const p = along(origin, v, t), f = source(input, p, v), j = sampler ? sampler(p, v) : f.species[0].map((x, c) => x + f.species[1][c]);
		const col = columns(input, along(origin, v, previousT), v, t - previousT);
		for (let c = 0; c < result.length; c++) {
			const current = j[c] / Math.max(1e-30, f.extinction[c]);
			if (i) {
				const tau = input.rayleigh[c] * col[0] + input.mie[c] * col[1];
				const total = tau < .01 ? tau * (1 - tau / 2 + tau ** 2 / 6 - tau ** 3 / 24) : -Math.expm1(-tau);
				const upper = tau < .01 ? tau * (.5 - tau / 3 + tau ** 2 / 8 - tau ** 3 / 30) : (total - tau * Math.exp(-tau)) / tau;
				result[c] += transmission[c] * ((total - upper) * previous[c] + upper * current);
				transmission[c] *= Math.exp(-tau);
			}
			previous[c] = current;
		}
		previousT = t;
	}
	return result;
}
