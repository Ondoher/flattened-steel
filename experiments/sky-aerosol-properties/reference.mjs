import assert from 'node:assert/strict';

/** Gauss-Legendre integration rule on [0,1]. Only mathematical rule nodes are retained.
 * @param {number} count @returns {AerosolRule}
 */
const rules=new Map();
export function gauss(count) {
 if(rules.has(count))return rules.get(count);
	assert.ok(Number.isInteger(count) && count >= 2 && count <= 512);
	const nodes = [],
		weights = [];
	for (let i = 0; i < count; i++) {
		let z = Math.cos((Math.PI * (i + 0.75)) / (count + 0.5)),
			derivative = 0;
		for (let iteration = 0; iteration < 40; iteration++) {
			let p = 1,
				previous = 0;
			for (let j = 1; j <= count; j++) {
				const old = p;
				p = ((2 * j - 1) * z * p - (j - 1) * previous) / j;
				previous = old;
			}
			derivative = (count * (z * p - previous)) / (z * z - 1);
			const next = z - p / derivative;
			if (Math.abs(next - z) < 2e-15) {
				z = next;
				break;
			}
			z = next;
		}
		nodes.push((1 + z) / 2);
		weights.push(1 / ((1 - z * z) * derivative * derivative));
	}
	const result={nodes,weights};rules.set(count,result);return result;
}


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
 * @param {AerosolMedium} m @param {readonly number[]} x @returns {number} Altitude in meters.
 */
export function height(m, x) {
	return m.geometry === 'flat' ? x[2] : Math.hypot(...x) - m.radius;
}
/** Stable shell or slab exit, including one-sided opaque ground.
 * @param {AerosolMedium} m @param {readonly number[]} x @param {readonly number[]} v
 * @returns {AerosolBoundary} Nearest physical boundary, not an observer dome.
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
 * @param {AerosolMedium} m @param {readonly number[]} x @param {readonly number[]} v
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
 * @param {AerosolMedium} m @param {readonly number[]} x @param {number} c @param {number} n
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
 * @param {AerosolGroup} group @param {number} n @returns {AerosolDirect} Radiance and direct pre-attenuation bins.
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
