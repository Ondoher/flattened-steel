import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {repository} from './io.mjs';
import {apex, diskRadius, radiusAt, interval} from './geometry.mjs';

const dataUrl = pathToFileURL(path.join(repository, 'src/algorithm32/profiles/native-15/consts.js'));
const {CANONICAL_SPECTRAL_CHANNELS} = await import(dataUrl.href);

/**
 * Explicit normalized physical packet for the isolated comparison.
 */
export const medium = {
	geometry: 'flat', sourceKind: 'finite', radius: 6360000, topAltitude: apex,
	rayleighHeight: 8000, mieHeight: 1200, albedo: 0.8, g: 0.7,
	wavelengths: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.wavelength.value),
	widths: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.wavelengthBinWidth.value),
	rayleigh: CANONICAL_SPECTRAL_CHANNELS.map((c) => 0.00000124062 * (c.wavelength.value / 1000) ** -4),
	mie: CANONICAL_SPECTRAL_CHANNELS.map((c) => (0.04 / 1200) * (c.wavelength.value / 1000) ** -0.8),
	sourceIrradiance: CANONICAL_SPECTRAL_CHANNELS.map((c) => c.sourceIrradiance.value),
	sourcePosition: [diskRadius / 2, 0, 4828032], sourceDirection: [0, 0, 1],
	referenceDistance: 4800000, incidentScale: 1,
};

/**
 * Generates a reflection-complete cube-surface direction grid and spherical-area weights.
 *
 * @param {number} resolution - Integer face half-width.
 * @returns {DomeDirection[]} - Physical directions, normalized area weights, and reflection indices.
 */
export function directions(resolution = 2) {
	/** @type {DomeDirection[]} */
	const result = [];
	for (let x = -resolution; x <= resolution; x++) {
		for (let y = -resolution; y <= resolution; y++) {
			for (let z = -resolution; z <= resolution; z++) {
				if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) !== resolution) {
					continue;
				}
				const length = Math.hypot(x, y, z);
				result.push({vector: [x / length, y / length, z / length], weight: 0, mirror: 0});
			}
		}
	}
	const samples = 32768;
	for (let i = 0; i < samples; i++) {
		const z = 1 - 2 * (i + 0.5) / samples;
		const phi = i * Math.PI * (3 - Math.sqrt(5));
		const x = Math.sqrt(1 - z * z) * Math.cos(phi);
		const y = Math.sqrt(1 - z * z) * Math.sin(phi);
		let best = -Infinity;
		let index = 0;
		for (let j = 0; j < result.length; j++) {
			const v = result[j].vector;
			const score = x * v[0] + y * v[1] + z * v[2];
			if (score > best) {
				best = score;
				index = j;
			}
		}
		result[index].weight += 4 * Math.PI / samples;
	}
	for (const direction of result) {
		direction.mirror = result.findIndex((other) => Math.abs(direction.vector[0] - other.vector[0]) < 1e-12 && Math.abs(direction.vector[1] + other.vector[1]) < 1e-12 && Math.abs(direction.vector[2] - other.vector[2]) < 1e-12);
	}
	for (let i = 0; i < result.length; i++) {
		const other = result[result[i].mirror];
		const weight = (result[i].weight + other.weight) / 2;
		result[i].weight = weight;
		other.weight = weight;
	}
	return result;
}

/**
 * Defines common physical rays independent of candidate node positions.
 *
 * @param {boolean} [pilot] - Select the first small comparison subset.
 * @returns {DomeCase[]} - Reproducible physical comparison rays.
 */
export function cases(pilot = false) {
	const heights = pilot ? [2, 1000, 40000] : [2, 100, 1000, 5000, 10000, 20000, 40000];
	const fractions = pilot ? [0.01, 0.25, 0.75] : [0, 0.001, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1];
	const sources = pilot ? [0.5] : [0.375, 0.5, 0.625];
	/** @type {DomeCase[]} */
	const result = [];
	for (const sourceFraction of sources) {
		const sourceRadius = sourceFraction * diskRadius;
		for (const z of heights) {
			for (const fraction of fractions) {
				const distance = (apex - z) * fraction;
				const r = radiusAt(z, distance);
				const origin = [r * 0.5, r * Math.sqrt(0.75), z];
				const sx = sourceRadius - origin[0];
				const sy = -origin[1];
				const length = Math.hypot(sx, sy);
				for (const [label, elevation, sign] of /** @type {Array<[string, number, number]>} */ ([['away-low', 5, -1], ['sunward', 30, 1], ...pilot ? [] : [['zenith', 90, 1]]])) {
					const e = elevation * Math.PI / 180;
					const direction = [sign * Math.cos(e) * sx / length, sign * Math.cos(e) * sy / length, Math.sin(e)];
					const segment = interval(origin, direction);
					result.push({id: `s${sourceFraction}-z${z}-d${fraction}-${label}`, sourceRadius, altitude: z, fraction, distance, origin, direction, entry: segment.entry, end: segment.exit, view: label});
				}
			}
		}
	}
	return result;
}
