import {apex, clearance, radiusAt} from './geometry.mjs';

/**
 * Frozen altitude support for the first count comparison, in meters.
 */
export const altitudes = [0, 250, 500, 1000, 1500, 3000, 5000, 7000, 10000, 14000, 17000, 20000, 22500, 25000, 31250, 37500, 50000, 62500, 75000, 87500, 99000, 100000];

/**
 * Computes the reachable source-distance and dome-distance row geometry.
 *
 * @param {number} altitude - Physical altitude in meters.
 * @param {number} beta - Normalized source-subpoint radius coordinate.
 * @param {number} sourceRadius - Source horizontal distance from the map center.
 * @returns {DomeRowBounds} - Source radius and reachable dome-clearance interval.
 */
export function bounds(altitude, beta, sourceRadius) {
	const maximum = radiusAt(altitude, 0);
	const minimumRho = Math.max(0, sourceRadius - maximum);
	const rho = minimumRho + beta * (sourceRadius + maximum - minimumRho);
	const minimumMapRadius = Math.abs(sourceRadius - rho);
	const maximumMapRadius = Math.min(maximum, sourceRadius + rho);
	const lower = Math.max(0, clearance([maximumMapRadius, 0, altitude]));
	const upper = Math.max(lower, clearance([minimumMapRadius, 0, altitude]));
	return {rho, lower, upper};
}

/**
 * Converts valid two-center coordinates to the canonical positive-y half-domain.
 *
 * @param {number} altitude - Altitude in meters.
 * @param {number} distance - Shortest sample-to-cap distance in meters.
 * @param {number} rho - Horizontal distance to the Sun subpoint.
 * @param {number} sourceRadius - Horizontal source position on the positive x axis.
 * @returns {number[]} - Canonical physical point in meters.
 */
export function position(altitude, distance, rho, sourceRadius) {
	const r = radiusAt(altitude, distance);
	if (sourceRadius === 0) {
		return [r, 0, altitude];
	}
	const x = (r * r + sourceRadius * sourceRadius - rho * rho) / (2 * sourceRadius);
	const product = (sourceRadius + rho + r) * (-sourceRadius + rho + r) * (sourceRadius - rho + r) * (sourceRadius + rho - r);
	const y = Math.sqrt(Math.max(0, product)) / (2 * sourceRadius);
	return [x, y, altitude];
}

/**
 * Constructs valid-domain rows with nominal quadratic slices and counted boundary support.
 *
 * @param {number} count - Nominal dome-distance slice count.
 * @param {number} sourceRadius - Physical source distance from the map center.
 * @param {number} [betaCount] - Frozen source-distance axis count.
 * @param {number[]} [zNodes] - Frozen physical altitude support.
 * @returns {DomeTopology} - Explicit nodes and ragged row ownership.
 */
export function topology(count, sourceRadius, betaCount = 17, zNodes = altitudes) {
	/** @type {DomeTopologyNode[]} */
	const nodes = [];
	/** @type {DomeTopologyRow[]} */
	const rows = [];
	let support = 0;
	const collapsed = new Map();
	for (const z of zNodes) {
		for (let j = 0; j < betaCount; j++) {
			const beta = j / (betaCount - 1);
			const row = bounds(z, beta, sourceRadius);
			const nominal = Array.from({length: count}, (_, i) => (apex - z) * (i / (count - 1)) ** 2).filter((d) => d >= row.lower && d <= row.upper);
			const distances = [...nominal, row.lower, row.upper].sort((a, b) => a - b).filter((d, i, all) => i === 0 || d - all[i - 1] > 1e-7);
			const point = distances.length === 1 ? position(z, distances[0], row.rho, sourceRadius) : null;
			const key = point ? JSON.stringify([...point, distances[0]]) : null;
			if (key && collapsed.has(key)) {
				rows.push({offset: collapsed.get(key), count: 1, z, beta, ...row});
				continue;
			}
			if (key) {
				collapsed.set(key, nodes.length);
			}
			support += distances.filter((d) => !nominal.some((n) => Math.abs(n - d) <= 1e-7)).length;
			rows.push({offset: nodes.length, count: distances.length, z, beta, ...row});
			for (const distance of distances) {
				nodes.push({point: position(z, distance, row.rho, sourceRadius), distance});
			}
		}
	}
	return {count, sourceRadius, betaCount, altitudes: zNodes, nodes, rows, boundarySupportNodes: support};
}
