import {gauss} from './math.mjs';
import {interval} from './geometry.mjs';
import {medium} from './physical.mjs';

/**
 * Evaluates an exact exponential-altitude column over a finite straight segment.
 *
 * @param {number} altitude - Starting altitude in meters.
 * @param {number} vertical - Unit direction's vertical component.
 * @param {number} distance - Segment length in meters.
 * @param {number} height - Density scale height in meters.
 * @returns {number} - Density-weighted length in meters.
 */
export function column(altitude, vertical, distance, height) {
	const exponent = vertical * distance / height;
	const ratio = Math.abs(exponent) < 1e-8 ? 1 - exponent / 2 + exponent * exponent / 6 : -Math.expm1(-exponent) / exponent;
	return Math.exp(-Math.max(0, altitude) / height) * distance * ratio;
}

/**
 * Integrates first-order diffuse radiance directly, without any cache or interpolation.
 *
 * @param {DomeCase} item - Physical ray.
 * @param {number} channel - Native15 channel.
 * @param {number} [count] - Gauss-Legendre order on logarithmic physical distance.
 * @returns {number} - Spectral radiance in W m^-2 sr^-1 nm^-1.
 */
export function direct(item, channel, count = 128) {
	const length = item.end - item.entry;
	if (length <= 0) {
		return 0;
	}
	const rule = gauss(count);
	const source = [item.sourceRadius, 0, 4828032];
	const br = medium.rayleigh[channel];
	const bm = medium.mie[channel];
	const logEnd = Math.log1p(length / 1000);
	let total = 0;
	for (let i = 0; i < rule.nodes.length; i++) {
		const local = 1000 * Math.expm1(logEnd * rule.nodes[i]);
		const t = item.entry + local;
		const x = item.origin.map((value, k) => value + t * item.direction[k]);
		const delta = source.map((value, k) => value - x[k]);
		const distance = Math.hypot(...delta);
		const sun = delta.map((value) => value / distance);
		const boundary = interval(x, sun);
		const sunLength = Math.min(distance, boundary.exit);
		const tauSun = br * column(x[2], sun[2], sunLength, 8000) + bm * column(x[2], sun[2], sunLength, 1200);
		const startAltitude = item.origin[2] + item.entry * item.direction[2];
		const tauView = br * column(startAltitude, item.direction[2], local, 8000) + bm * column(startAltitude, item.direction[2], local, 1200);
		const cosine = sun.reduce((sum, value, k) => sum + value * item.direction[k], 0);
		const pr = 3 * (1 + cosine * cosine) / (16 * Math.PI);
		const g = 0.7;
		const pm = 3 * (1 - g * g) * (1 + cosine * cosine) / (8 * Math.PI * (2 + g * g) * (1 + g * g - 2 * g * cosine) ** 1.5);
		const density = br * Math.exp(-x[2] / 8000) * pr + 0.8 * bm * Math.exp(-x[2] / 1200) * pm;
		const incident = medium.sourceIrradiance[channel] * (4800000 / distance) ** 2;
		total += rule.weights[i] * (local + 1000) * logEnd * density * incident * Math.exp(-tauSun - tauView);
	}
	return total;
}
