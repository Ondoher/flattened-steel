import assert from 'node:assert/strict';
import {gauss} from '../continuation/direct-solver/math.mjs';

/** Euclidean dot product; callers supply three finite components.
 * @param {readonly number[]} a @param {readonly number[]} b @returns {number} Scalar product.
 */
export function dot(a, b) {
	return a.reduce((s, x, i) => s + x * b[i], 0);
}
/** Normalize a nonzero physical vector.
 * @param {readonly number[]} v @returns {number[]} Unit vector. Invalid zero vectors fail the assertion.
 */
export function unit(v) {
	const n = Math.hypot(...v);
	assert.ok(n > 0 && Number.isFinite(n));
	return v.map((x) => x / n);
}
/** Evaluate a position along a physical ray.
 * @param {readonly number[]} x @param {readonly number[]} v @param {number} t @returns {number[]} Position in meters.
 */
export function along(x, v, t) {
	return x.map((a, i) => a + t * v[i]);
}
/** Physical altitude; no cache coordinates are involved.
 * @param {HorizonReferenceMedium} m @param {readonly number[]} x @returns {number} Altitude in meters.
 */
export function height(m, x) {
	return m.geometry === 'flat' ? x[2] : Math.hypot(...x) - m.radius;
}
/** Stable shell or slab exit, including one-sided opaque ground.
 * @param {HorizonReferenceMedium} m @param {readonly number[]} x @param {readonly number[]} v
 * @returns {HorizonReferenceBoundary} Nearest physical boundary, not an observer dome.
 */
export function boundary(m, x, v) {
	if (m.geometry === 'flat')
		return {
			distance: v[2] > 0 ? (m.topAltitude - x[2]) / v[2] : v[2] < 0 ? -x[2] / v[2] : Infinity,
			ground: v[2] < 0,
		};
	const r = Math.hypot(...x),
		b = dot(x, v),
		c = (r - m.radius) * (r + m.radius),
		d = b * b - c;
	if (b < 0 && d >= 0) return {distance: Math.max(0, c / (-b + Math.sqrt(d))), ground: true};
	const ct = (r - m.radius - m.topAltitude) * (r + m.radius + m.topAltitude),
		root = Math.sqrt(Math.max(0, b * b - ct));
	return {distance: Math.max(0, b >= 0 ? -ct / (b + root) : -b + root), ground: false};
}
/** Analytic exponential column, stabilized at small slope with expm1.
 * @param {number} h @param {number} vz @param {number} t @param {number} H
 * @returns {number} Integrated relative density in meters.
 */
export function slabColumn(h, vz, t, H) {
	const a = (vz * t) / H;
	return Math.exp(-h / H) * t * (Math.abs(a) < 1e-8 ? 1 - a / 2 + (a * a) / 6 : -Math.expm1(-a) / a);
}
/** Independent path extinction, exact in a slab and Gauss-integrated in a shell.
 * @param {HorizonReferenceMedium} m @param {readonly number[]} x @param {readonly number[]} v
 * @param {number} t @param {number} c @param {number} n @returns {number} Optical depth.
 */
export function opticalDepth(m, x, v, t, c, n = 128) {
	if (m.geometry === 'flat')
		return (
			m.rayleigh[c] * slabColumn(x[2], v[2], t, m.rayleighHeight) +
			m.mie[c] * slabColumn(x[2], v[2], t, m.mieHeight)
		);
	const q = gauss(n);
	let sum = 0;
	for (let i = 0; i < n; i++) {
		const h = Math.max(0, height(m, along(x, v, t * q.nodes[i])));
		sum += q.weights[i] * (m.rayleigh[c] * Math.exp(-h / m.rayleighHeight) + m.mie[c] * Math.exp(-h / m.mieHeight));
	}
	return t * sum;
}
/** Independent normalized Rayleigh and Cornette-Shanks values.
 * @param {number} cosine @param {number} g @returns {number[]} Phase densities per steradian.
 */
export function phase(cosine, g) {
	return [
		(3 * (1 + cosine * cosine)) / (16 * Math.PI),
		(3 * (1 - g * g) * (1 + cosine * cosine)) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5),
	];
}
/** Direct illumination including finite-source dilution and independent extinction.
 * @param {HorizonReferenceMedium} m @param {readonly number[]} x @param {number} c @param {number} n
 * @returns {number[]} Toward-source unit direction followed by attenuated irradiance density.
 */
export function illumination(m, x, c, n = 128) {
	const delta = m.sourcePosition.map((s, i) => s - x[i]),
		distance = Math.hypot(...delta),
		v = m.sourceKind === 'finite' ? unit(delta) : m.sourceDirection;
	const edge = boundary(m, x, v);
	if (edge.ground) return [...v, 0];
	const length = m.sourceKind === 'finite' ? Math.min(edge.distance, distance) : edge.distance;
	return [
		...v,
		m.sourceIrradiance[c] *
			m.incidentScale *
			(m.sourceKind === 'finite' ? (m.referenceDistance / distance) ** 2 : 1) *
			Math.exp(-opticalDepth(m, x, v, length, c, n)),
	];
}
/** Binary64 first order with logarithmic view substitution; independent of production view integration.
 * @param {HorizonReferenceGroup} group @param {number} n @returns {HorizonReferenceDirect} Radiance and direct pre-attenuation bins.
 */
export function direct(group, n = 128) {
	const {medium: m, origin: o, direction: v, channel: c, end} = group,
		q = gauss(n),
		edges = [0, 1e4, 5e4, 1e5, 3e5, 1e6, end],
		bins = Array(6).fill(0),
		beforeBins = Array(6).fill(0),
		species = [0, 0];
	for (let bin = 0; bin < 6; bin++) {
		const a = Math.min(edges[bin], end),
			b = Math.min(edges[bin + 1], end);
		if (b <= a) continue;
		const la = Math.log1p(a / 1000),
			lb = Math.log1p(b / 1000);
		for (let i = 0; i < n; i++) {
			const t = 1000 * Math.expm1(la + (lb - la) * q.nodes[i]),
				jac = (t + 1000) * (lb - la) * q.weights[i],
				x = along(o, v, t),
				h = Math.max(0, height(m, x)),
				s = illumination(m, x, c, n),
				p = phase(dot(v, s.slice(0, 3)), m.g),
				T = Math.exp(-opticalDepth(m, o, v, t, c, n));
			const terms = [
				m.rayleigh[c] * Math.exp(-h / m.rayleighHeight) * p[0] * s[3] * jac,
				m.mie[c] * m.albedo * Math.exp(-h / m.mieHeight) * p[1] * s[3] * jac,
			];
			for (let k = 0; k < 2; k++) species[k] += terms[k] * T;
			beforeBins[bin] += terms[0] + terms[1];
			bins[bin] += (terms[0] + terms[1]) * T;
		}
	}
	return {
		total: bins.reduce((s, x) => s + x, 0),
		before: beforeBins.reduce((s, x) => s + x, 0),
		species,
		bins,
		beforeBins,
	};
}
/** Conservative Student interval (at least 16 batches); sampling uncertainty only.
 * @param {readonly number[]} values @returns {HorizonReferenceEstimate} Mean and uncertainty; malformed batches fail assertions.
 */
export function estimate(values) {
	assert.ok(values.length >= 16 && values.every(Number.isFinite));
	const mean = values.reduce((s, x) => s + x, 0) / values.length,
		se = Math.sqrt(values.reduce((s, x) => s + (x - mean) ** 2, 0) / (values.length * (values.length - 1)));
	return {mean, standardError: se, halfWidth95: 2.13145 * se, batches: values.length};
}
/** Analytic and separately coded Simpson proof controls; does not validate physical inputs or Monte Carlo convergence.
 * @param {readonly HorizonReferenceMedium[]} media @returns {HorizonReferenceProof} Assertion count and column discrepancy; failures abort before GPU admission.
 */
export function proofs(media) {
	let checks = 0,
		error = 0;
	for (const H of [1200, 8000])
		for (const vz of [-0.9, 0, 1e-12, 0.05, 1]) {
			const h = 1000,
				t = vz < 0 ? 500 : 15000,
				N = 8192;
			let sum = 0;
			for (let i = 0; i <= N; i++)
				sum += (i === 0 || i === N ? 1 : i % 2 ? 4 : 2) * Math.exp(-(h + (vz * t * i) / N) / H);
			const ref = (sum * t) / (3 * N),
				actual = slabColumn(h, vz, t, H),
				e = Math.abs(actual / ref - 1);
			error = Math.max(error, e);
			assert.ok(e < 1e-10);
			checks++;
			assert.ok(Math.abs(Math.exp(-actual * 0.001) * Math.exp(actual * 0.001) - 1) < 1e-12);
			checks++;
		}
	const N = 32768;
	for (const g of [0, 0.7, 0.85]) {
		let r = 0,
			m = 0;
		for (let i = 0; i <= N; i++) {
			const w = i === 0 || i === N ? 1 : i % 2 ? 4 : 2,
				p = phase(-1 + (2 * i) / N, g);
			r += w * p[0];
			m += w * p[1];
		}
		assert.ok(Math.abs((r * 4 * Math.PI) / (3 * N) - 1) < 1e-10);
		assert.ok(Math.abs((m * 4 * Math.PI) / (3 * N) - 1) < 1e-8);
		checks += 2;
	}
	const flat = media[0],
		sphere = media[1];
	assert.equal(boundary(flat, [0, 0, 5], [0, 0, -1]).distance, 5);
	assert.equal(boundary(flat, [0, 0, 5], [0, 0, 1]).distance, 99995);
	assert.equal(boundary(sphere, [0, 0, sphere.radius], [0, 0, -1]).distance, 0);
	assert.ok(!boundary(sphere, [0, 0, sphere.radius], [1, 0, 0]).ground);
	checks += 4;
	const tau = 0.7,
		L = 1000,
		j = 0.002,
		exact = (j * L * -Math.expm1(-tau)) / tau;
	let integral = 0;
	for (let i = 0; i < N; i++) integral += (Math.exp((-tau * (i + 0.5)) / N) * j * L) / N;
	assert.ok(Math.abs(integral / exact - 1) < 1e-9);
	checks++;
	assert.equal(Math.exp(-0), 1);
	assert.equal(0 * exact, 0);
	checks += 2;
	const o = [0, 0, 5],
		d = Math.hypot(...flat.sourcePosition.map((x, i) => x - o[i]));
	assert.ok(Math.abs(((2 * flat.referenceDistance) / (2 * d)) ** 2 - (flat.referenceDistance / d) ** 2) < 1e-15);
	checks++;
	return {
		checks,
		maximumColumnError: error,
		descriptions: [
			'Vacuum and zero-scattering source',
			'Analytic constant-source Beer integral',
			'Independent composite-Simpson exponential columns and reversed attenuation identity',
			'Independent composite-Simpson phase normalization',
			'One-sided slab/shell ground and tangent exits',
			'Inverse-square observer normalization identity',
			'GPU seed/roulette, source quadrature and CPU64 N1 checks retained separately',
		],
	};
}
