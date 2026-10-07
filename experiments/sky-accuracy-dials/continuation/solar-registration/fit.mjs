import assert from 'node:assert/strict';
import {
	getSampleDirection,
	sampleHemisphericalScalar,
} from '../../../../scripts/experiments/b1-directional-sky-radiance/benchmark.js';

/** The published periodic ring interpolation, with no samples from another ring.
 * @param {SkySolarGrid} grid @param {number} ring @param {number} angle @returns {number}
 */
export function sampleRing(grid, ring, angle) {
	/** @param {number} index @returns {number} */
	function sample(index) {
		const n = 8 * ring,
			i = ((index % n) + n) % n;
		const dx = Math.max(-ring, Math.min(ring, Math.abs(i - 4 * ring) - 2 * ring));
		const dy = Math.max(-ring, Math.min(ring, Math.abs(((i + 6 * ring) % n) - 4 * ring) - 2 * ring));
		return grid[4 + dx][4 + dy];
	}
	const u = (angle / Math.PI) * 4 * ring,
		i = Math.floor(u),
		f = u - i;
	const p = sample(i - 1),
		a = sample(i),
		b = sample(i + 1),
		n = sample(i + 2);
	return (a * 2 + (-p + b + (p * 2 - a * 5 + b * 4 - n + (-p + a * 3 - b * 3 + n) * f) * f) * f) * 0.5;
}

/** Reproduce the original floating-point search endpoints and addition order.
 * @param {number} initial @returns {number[]}
 */
export function searchAngles(initial) {
	const radians = Math.PI / 180,
		maximum = (initial + 20) * radians;
	let candidate = (initial - 20) * radians;
	const result = [candidate];
	do {
		candidate += 0.2 * radians;
		result.push(candidate);
	} while (candidate < maximum);
	return result;
}

/** Compute fixed reflection objectives and transfer every subset's selected axis.
 * @param {SkySolarGrid} grid @param {SkySolarCondition} condition @param {string} band
 * @param {()=>void} progress @param {boolean} [refined] @returns {SkySolarFitCalculation}
 */
export function fitGrid(grid, condition, band, progress, refined = false) {
	const radialCount = refined ? 32 : 16,
		azimuthCount = refined ? 128 : 64;
	const subsets = refined ? ['all-refined'] : ['all', 'lower', 'higher', 'inner-rings', 'outer-rings'];
	const angles = searchAngles(condition.theoreticalDegrees),
		curves = subsets.map(() => []),
		denominators = subsets.map(() => 0),
		pairs = subsets.map(() => 0),
		negative = subsets.map(() => 0);
	const samples = [];
	for (let i = 0; i < radialCount; i++)
		for (let j = 0; j < azimuthCount; j++) {
			const mu = (i + 0.5) / radialCount,
				zenith = Math.acos(mu),
				azimuth = (j / azimuthCount) * 2 * Math.PI;
			const value = sampleHemisphericalScalar(grid, zenith, azimuth),
				groups = refined ? [0] : [0, mu < 0.5 ? 1 : 2];
			samples.push({zenith, azimuth, value, ring: 0, groups});
		}
	if (!refined)
		for (let ring = 1; ring <= 4; ring++)
			for (let j = 0; j < 64; j++) {
				const azimuth = (j / 64) * 2 * Math.PI;
				samples.push({
					zenith: 0,
					azimuth,
					value: sampleRing(grid, ring, azimuth),
					ring,
					groups: [ring <= 2 ? 3 : 4],
				});
			}
	for (const s of samples)
		for (const group of s.groups) {
			denominators[group] += 2 * Math.abs(s.value);
			pairs[group]++;
			if (s.value < 0) negative[group]++;
		}
	assert.ok(denominators.every((d) => d > 0 && Number.isFinite(d)));
	for (const [index, axis] of angles.entries()) {
		if (index % 16 === 0) progress();
		const loss = subsets.map(() => 0);
		for (const sample of samples) {
			const reflected = sample.ring
				? sampleRing(grid, sample.ring, axis * 2 - sample.azimuth)
				: sampleHemisphericalScalar(grid, sample.zenith, axis * 2 - sample.azimuth);
			const error = Math.abs(sample.value - reflected);
			assert.ok(Number.isFinite(error));
			for (const group of sample.groups) loss[group] += error;
		}
		for (const [group, value] of loss.entries()) curves[group].push(value / denominators[group]);
	}
	/** @param {number} degrees @returns {number} */
	const nearest = (degrees) =>
		angles.reduce(
			(best, a, i) =>
				Math.abs((a * 180) / Math.PI - degrees) < Math.abs((angles[best] * 180) / Math.PI - degrees) ? i : best,
			0,
		);
	const originalIndex = nearest(condition.fittedDegrees),
		theoreticalIndex = nearest(condition.theoreticalDegrees);
	const rows = subsets.map((subset, group) => {
		const curve = curves[group],
			best = curve.reduce((b, value, i) => (value < curve[b] ? i : b), 0);
		const near = angles.filter((_, i) => curve[i] <= curve[best] + 0.01),
			bestDegrees = (angles[best] * 180) / Math.PI;
		return {
			time: condition.time,
			band,
			subset,
			pairs: pairs[group],
			bestDegrees,
			theoryDifferenceDegrees: bestDegrees - condition.theoreticalDegrees,
			originalDifferenceDegrees: bestDegrees - condition.fittedDegrees,
			minimumLoss: curve[best],
			originalLoss: curve[originalIndex],
			theoreticalLoss: curve[theoreticalIndex],
			nearMinimumWidthDegrees: ((near.at(-1) - near[0]) * 180) / Math.PI,
			atSearchEdge: best === 0 || best === angles.length - 1,
			transferredLosses: Object.fromEntries(subsets.map((name, i) => [name, curves[i][best]])),
			negativeSamples: negative[group],
		};
	});
	return {
		rows,
		angles: angles.map((a) => (a * 180) / Math.PI),
		losses: Object.fromEntries(subsets.map((name, i) => [name, curves[i]])),
	};
}

/** Known symmetric angular field sampled on the actual sparse measurement grid.
 * @param {SkySolarCondition} condition @param {number} g @returns {SkySolarGrid}
 */
export function analyticGrid(condition, g) {
	const theta = (condition.zenithDegrees * Math.PI) / 180,
		phi = (condition.theoreticalDegrees * Math.PI) / 180;
	return Array.from({length: 9}, (_, x) =>
		Array.from({length: 9}, (_, y) => {
			const d = getSampleDirection(x, y),
				mu = Math.cos(d.zenithRadians),
				cosine =
					mu * Math.cos(theta) +
					Math.sin(d.zenithRadians) * Math.sin(theta) * Math.cos(d.azimuthRadians - phi);
			return 1 + 2 * (1 - mu) + (1 - g * g) / (1 + g * g - 2 * g * cosine) ** 1.5;
		}),
	);
}

/** Self-verifying node, periodicity, scale and constant-field controls.
 * @returns {number}
 */
export function registrationProof() {
	let checks = 0;
	const grid = Array.from({length: 9}, (_, x) => Array.from({length: 9}, (_, y) => 1 + x + 9 * y));
	for (let x = 0; x < 9; x++)
		for (let y = 0; y < 9; y++) {
			const d = getSampleDirection(x, y),
				r = Math.max(Math.abs(x - 4), Math.abs(y - 4));
			assert.ok(
				Math.abs(sampleHemisphericalScalar(grid, d.zenithRadians, d.azimuthRadians) - grid[x][y]) < 1e-11,
			);
			checks++;
			if (r) {
				assert.ok(Math.abs(sampleRing(grid, r, d.azimuthRadians) - grid[x][y]) < 1e-11);
				checks++;
				assert.ok(Math.abs(sampleRing(grid, r, d.azimuthRadians + 2 * Math.PI) - grid[x][y]) < 1e-11);
				checks++;
			}
		}
	const condition = {time: 'manufactured', zenithDegrees: 40, theoreticalDegrees: 123, fittedDegrees: 123, grids: {}};
	const flat = fitGrid(
		grid.map((row) => row.map(() => 1)),
		condition,
		'flat',
		() => {},
	);
	assert.ok(flat.rows.every((r) => r.minimumLoss === 0 && r.nearMinimumWidthDegrees > 39));
	checks++;
	const ordinary = fitGrid(grid, condition, 'scale', () => {}),
		scaled = fitGrid(
			grid.map((row) => row.map((v) => v * 8)),
			condition,
			'scale',
			() => {},
		);
	for (const [i, row] of ordinary.rows.entries()) {
		assert.equal(row.bestDegrees, scaled.rows[i].bestDegrees);
		assert.equal(row.minimumLoss, scaled.rows[i].minimumLoss);
		checks++;
	}
	return checks;
}
