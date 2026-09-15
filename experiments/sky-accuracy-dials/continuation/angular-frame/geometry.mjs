import assert from 'node:assert/strict';
import {dot, localDirection, unit} from '../../numerics/math.js';
import {gaussLegendreRule} from '../reference/physical/quadrature.mjs';
import {componentGauss, incidentWorld} from '../j2/angular.mjs';

/** The registered lit geometry crosses each radial boundary exactly once.
 * @param {number} a @param {number} b @param {number} boundary @returns {number}
 */
function boundaryCosine(a, b, boundary) {
	assert.ok([a, b, boundary].every(Number.isFinite));
	assert.ok(a > Math.abs(boundary), 'This geometry does not have the registered unique polar boundary.');
	const length = Math.hypot(a, b),
		angle = Math.atan2(b, a) + Math.acos(boundary / length);
	assert.ok(angle > 0 && angle < Math.PI);
	const cosine = Math.cos(angle),
		replayed = a * cosine + b * Math.sqrt(Math.max(0, 1 - cosine * cosine));
	assert.ok(Math.abs(replayed - boundary) <= 256 * Number.EPSILON);
	return cosine;
}

/** Preserve ground/tangent partitions while moving the polar axis toward the Sun.
 * Both members are expressed in the existing radial local frame for unchanged
 * incident evaluation and outgoing phase weighting.
 * @param {number} bottom @param {SkyVector3} origin @param {number} radialCount @param {number} azimuthCount
 * @returns {SkyVolumeJ2Group[]}
 */
export function sunFrameGroups(bottom, origin, radialCount, azimuthCount) {
	assert.ok(Number.isFinite(bottom) && bottom > 0);
	assert.ok([8, 16, 32, 64].includes(radialCount) && [16, 32, 64, 128].includes(azimuthCount));
	const radius = Math.hypot(...origin),
		height = radius - bottom;
	assert.ok(height > 1e-6);
	const radial = unit(origin),
		a = radial[2],
		horizon = -Math.sqrt(height * (radius + bottom)) / radius;
	assert.ok(a > Math.abs(horizon) && Math.hypot(radial[0], radial[1]) > 1e-8);
	const first = unit([radial[0], radial[1], 0]),
		second = /** @type {SkyVector3} */ ([-first[1], first[0], 0]);
	const roots = radialCount === 8 ? gaussLegendreRule(8) : componentGauss(radialCount),
		step = (2 * Math.PI) / azimuthCount;
	/** @type {SkyVolumeJ2Group[]} */ const groups = [];
	/** @type {SkyVolumeBranch[]} */ const branches = ['volume-ground', 'volume-escaping', 'volume-outward'];
	for (let index = 0; index < azimuthCount / 2; index++) {
		const phi = (index + 0.5) * step,
			c = Math.cos(phi),
			s = Math.sin(phi);
		const basis = /** @type {SkyVector3} */ ([c * first[0] + s * second[0], c * first[1] + s * second[1], 0]);
		const b = dot(radial, basis),
			ends = [-1, boundaryCosine(a, b, horizon), boundaryCosine(a, b, 0), 1];
		assert.ok(ends[0] < ends[1] && ends[1] < ends[2] && ends[2] < ends[3]);
		for (let segment = 0; segment < 3; segment++) {
			const half = (ends[segment + 1] - ends[segment]) / 2,
				centre = (ends[segment + 1] + ends[segment]) / 2;
			for (const root of roots) {
				const mu = centre + half * root.node,
					tangent = Math.sqrt(Math.max(0, 1 - mu * mu));
				/** @param {number} sign @returns {SkyVector3} */ const world = (sign) => [
					tangent * (c * first[0] + sign * s * second[0]),
					tangent * (c * first[1] + sign * s * second[1]),
					mu,
				];
				const direction = localDirection(origin, world(1)),
					mirror = localDirection(origin, world(-1));
				assert.ok(Math.abs(direction[0] - mirror[0]) <= 512 * Number.EPSILON);
				assert.ok(Math.abs(direction[1] + mirror[1]) <= 512 * Number.EPSILON);
				assert.ok(Math.abs(direction[2] - mirror[2]) <= 512 * Number.EPSILON);
				for (const local of [direction, mirror]) {
					assert.ok(Math.abs(Math.hypot(...local) - 1) <= 512 * Number.EPSILON);
					const radialCosine = local[2];
					assert.equal(
						radialCosine < horizon
							? 'volume-ground'
							: radialCosine < 0
								? 'volume-escaping'
								: 'volume-outward',
						branches[segment],
					);
				}
				groups.push({
					branch: branches[segment],
					incident: {direction, mirror, weight: half * root.weight * step},
				});
			}
		}
	}
	assert.equal(groups.length, (3 * radialCount * azimuthCount) / 2);
	assert.ok(
		Math.abs(groups.reduce((sum, g) => sum + 2 * g.incident.weight, 0) - 4 * Math.PI) <=
			8192 * Number.EPSILON * 4 * Math.PI,
	);
	return groups;
}

/** @returns {{checks:number,scope:string}} */
export function angularFrameGeometryProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Angular frame geometry proof ' + (checks + 1));
		checks++;
	}
	for (const a of [0.3, 0.7, 0.95])
		for (const b of [-0.8, 0, 0.8])
			for (const q of [-0.02, 0, 0.02]) {
				const mu = boundaryCosine(a, b, q);
				check(Math.abs(a * mu + b * Math.sqrt(1 - mu * mu) - q) <= 256 * Number.EPSILON);
			}
	const bottom = 6371000;
	for (const height of [1, 1000, 8000])
		for (const azimuth of [0, 0.7]) {
			const r = bottom + height,
				x = Math.sqrt(1 - 0.7 ** 2);
			const origin = /** @type {SkyVector3} */ ([r * x * Math.cos(azimuth), r * x * Math.sin(azimuth), r * 0.7]);
			const groups = sunFrameGroups(bottom, origin, 8, 16);
			check(groups.length === 192);
			check(Math.abs(groups.reduce((v, g) => v + 2 * g.incident.weight, 0) - 4 * Math.PI) < 1e-12);
			check(groups.every((g) => g.incident.weight > 0));
			for (const branch of ['volume-ground', 'volume-escaping', 'volume-outward'])
				check(groups.filter((g) => g.branch === branch).length === 64);
			for (const index of [0, groups.length - 1]) {
				const g = groups[index];
				assert.ok(g.incident.mirror);
				const w = incidentWorld(origin, g.incident.direction),
					m = incidentWorld(origin, g.incident.mirror);
				check(Math.abs(w[2] - m[2]) < 1e-14);
				check(Math.abs(dot(unit(origin), w) - dot(unit(origin), m)) < 1e-14);
			}
		}
	assert.throws(() => boundaryCosine(0.01, 0.7, -0.02));
	checks++;
	assert.throws(() => sunFrameGroups(bottom, [0, 0, bottom + 1000], 8, 16));
	checks++;
	return {
		checks,
		scope: 'Synthetic unique polar boundary roots, physical branch partition, positive solid-angle rule, rotated source-plane mirror symmetry and unsupported-geometry rejection. No atmospheric incident integration.',
	};
}
