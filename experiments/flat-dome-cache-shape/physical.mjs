import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {repository} from './io.mjs';
import {apex, diskRadius, radiusAt, interval} from './geometry.mjs';
import {gauss} from './math.mjs';

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
 * Resolves horizon-focused tensor quadrature without finite-weight tangent rays.
 *
 * @param {number} [polar] - Even Gauss polar count.
 * @param {number} [azimuthal] - Even azimuth count.
 * @returns {DomeDirection[]} - Reflection-complete solid-angle quadrature.
 */
export function transportDirections(polar = 8, azimuthal = 12) {
	const rule = gauss(polar);
	/** @type {DomeDirection[]} */
	const result = [];
	for (let i = 0; i < polar; i++) {
		const t = 3 * (2 * rule.nodes[i] - 1);
		const mu = Math.sinh(t) / Math.sinh(3);
		const weight = rule.weights[i] * 6 * Math.cosh(t) / Math.sinh(3) * 2 * Math.PI / azimuthal;
		for (let j = 0; j < azimuthal; j++) {
			const phi = 2 * Math.PI * (j + 0.5) / azimuthal;
			const horizontal = Math.sqrt(1 - mu * mu);
			result.push({vector: [horizontal * Math.cos(phi), horizontal * Math.sin(phi), mu], weight, mirror: i * azimuthal + azimuthal - 1 - j});
		}
	}
	const sum = result.reduce((total, d) => total + d.weight, 0);
	for (const d of result) {
		d.weight *= 4 * Math.PI / sum;
	}
	// Exact polar outgoing addresses have zero incoming weight, so they add no
	// artificial point mass to the solid-angle integration.
	result.push({vector: [0, 0, 1], weight: 0, mirror: result.length});
	result.push({vector: [0, 0, -1], weight: 0, mirror: result.length});
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
					result.push({id: `s${sourceFraction}-z${z}-d${fraction}-${label}`, sourceRadius, altitude: z, fraction, distance, origin, direction, entry: fraction === 0 ? 0 : segment.entry, end: fraction === 0 ? 0 : segment.exit, view: label});
				}
			}
		}
	}
	return result;
}

/**
 * Freezes separate validation rays before any full count-series output is inspected.
 *
 * @returns {DomeCase[]} - Off-panel heights, clearances, and physical azimuths.
 */
export function validationCases() {
	/** @type {DomeCase[]} */
	const result = [];
	for (const sourceFraction of [0.375, 0.5, 0.625]) {
		for (const z of [25, 750, 2500, 8500, 16500, 32500]) {
			for (const fraction of [0.0037, 0.073, 0.371, 0.863]) {
				const sourceRadius = sourceFraction * diskRadius;
				const distance = (apex - z) * fraction;
				const r = radiusAt(z, distance);
				const theta = fraction < 0.1 ? 0.371 * Math.PI : 0.217 * Math.PI;
				const origin = [r * Math.cos(theta), r * Math.sin(theta), z];
				const horizontal = [sourceRadius - origin[0], -origin[1]];
				const length = Math.hypot(...horizontal);
				for (const [label, degrees, sign] of /** @type {Array<[string, number, number]>} */ ([['away', 7, -1], ['sunward', 37, 1]])) {
					const elevation = degrees * Math.PI / 180;
					const direction = [sign * horizontal[0] / length * Math.cos(elevation), sign * horizontal[1] / length * Math.cos(elevation), Math.sin(elevation)];
					const segment = interval(origin, direction);
					result.push({id: `validation-s${sourceFraction}-z${z}-d${fraction}-${label}`, sourceRadius, altitude: z, fraction, distance, origin, direction, entry: segment.entry, end: segment.exit, view: label});
				}
			}
		}
	}
	return result;
}

/**
 * Freezes boundary and mirror controls separately from the accuracy-tier matrix.
 *
 * @returns {DomeCase[]} - Analytically classified vacuum/entry and reflection cases.
 */
export function controlCases() {
	/** @type {DomeCase[]} */
	const result = [];
	for (const sourceFraction of [0.375, 0.5, 0.625]) {
		const sourceRadius = sourceFraction * diskRadius;
		const origin = [0, 0, apex + 500];
		const direction = [0, 0, -1];
		const segment = interval(origin, direction);
		result.push({id: `control-entry-s${sourceFraction}`, sourceRadius, altitude: apex + 500, fraction: 0, distance: 500, origin, direction, entry: segment.entry, end: segment.exit, view: 'outside-down'});
		result.push({id: `control-vacuum-s${sourceFraction}`, sourceRadius, altitude: 2, fraction: 0, distance: 0, origin: [diskRadius, 0, 2], direction: [1, 0, 0], entry: 0, end: 0, view: 'rim-outward-vacuum'});
		const base = cases().find((item) => item.sourceRadius === sourceRadius && item.altitude === 1000 && item.fraction === 0.25 && item.view === 'sunward');
		result.push({...base, id: `control-mirror-s${sourceFraction}`, origin: [base.origin[0], -base.origin[1], base.origin[2]], direction: [base.direction[0], -base.direction[1], base.direction[2]]});
	}
	return result;
}
