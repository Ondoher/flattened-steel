import assert from 'node:assert/strict';
import {dot, localDirection, unit} from '../../numerics/math.js';
import {componentGauss, incidentWorld} from '../j2/angular.mjs';

/** Same unique physical root and arithmetic used by the 00219 theta control.
 * @param {number} a @param {number} b @param {number} q @returns {number}
 */
function boundaryTheta(a, b, q) {
	assert.ok([a, b, q].every(Number.isFinite) && a > Math.abs(q));
	const theta = Math.atan2(b, a) + Math.acos(q / Math.hypot(a, b));
	assert.ok(theta > 0 && theta < Math.PI);
	assert.ok(Math.abs(a * Math.cos(theta) + b * Math.sin(theta) - q) <= 256 * Number.EPSILON);
	return theta;
}

/** Matched physical partitions in theta, expressed in the original radial local
 * frame. A weight belongs to each member, not to the whole reflection group.
 * The 16x64 pair exists only to replay the authenticated 00219 analytic control.
 * @param {number} bottom @param {SkyVector3} origin
 * @param {SkyThetaPolarCount} polarCount @param {SkyThetaAzimuthCount} azimuthCount
 * @returns {SkyVolumeJ2Group[]}
 */
export function thetaGroups(bottom, origin, polarCount, azimuthCount) {
	assert.ok(Number.isFinite(bottom) && bottom > 0);
	assert.ok(origin.length === 3 && origin.every(Number.isFinite));
	assert.ok(
		(polarCount === 16 && (azimuthCount === 32 || azimuthCount === 64)) ||
			(polarCount === 32 && azimuthCount === 64),
		'Unregistered theta count pair.',
	);
	const radius = Math.hypot(...origin),
		height = radius - bottom;
	assert.ok(height > 1e-6);
	const radial = unit(origin),
		horizon = -Math.sqrt(height * (radius + bottom)) / radius;
	assert.ok(radial[2] > Math.abs(horizon) && Math.hypot(radial[0], radial[1]) > 1e-8);
	const first = unit([radial[0], radial[1], 0]),
		second = /** @type {SkyVector3} */ ([-first[1], first[0], 0]);
	const step = (2 * Math.PI) / azimuthCount,
		roots = componentGauss(polarCount);
	const branches = /** @type {const} */ (['volume-ground', 'volume-escaping', 'volume-outward']);
	/** @type {SkyVolumeJ2Group[]} */ const groups = [];
	for (let i = 0; i < azimuthCount / 2; i++) {
		const phi = (i + 0.5) * step,
			c = Math.cos(phi),
			s = Math.sin(phi);
		const basis = /** @type {SkyVector3} */ ([c * first[0] + s * second[0], c * first[1] + s * second[1], 0]);
		const b = dot(radial, basis);
		const ends = [Math.PI, boundaryTheta(radial[2], b, horizon), boundaryTheta(radial[2], b, 0), 0];
		assert.ok(ends.every((x, index) => index === 0 || x < ends[index - 1]));
		for (let segment = 0; segment < 3; segment++) {
			const low = ends[segment + 1],
				high = ends[segment],
				half = (high - low) / 2,
				centre = (high + low) / 2;
			for (const root of roots) {
				const theta = centre + half * root.node,
					sine = Math.sin(theta),
					cosine = Math.cos(theta);
				const weight = half * root.weight * step * sine;
				assert.ok(theta > low && theta < high && Number.isFinite(weight) && weight > 0);
				/** @param {1|-1} sign @returns {SkyVector3} */ const world = (sign) => [
					sine * (c * first[0] + sign * s * second[0]),
					sine * (c * first[1] + sign * s * second[1]),
					cosine,
				];
				const direction = localDirection(origin, world(1)),
					mirror = localDirection(origin, world(-1));
				assert.ok(Math.abs(direction[0] - mirror[0]) <= 512 * Number.EPSILON);
				assert.ok(Math.abs(direction[1] + mirror[1]) <= 512 * Number.EPSILON);
				assert.ok(Math.abs(direction[2] - mirror[2]) <= 512 * Number.EPSILON);
				for (const [local, expected] of [
					[direction, world(1)],
					[mirror, world(-1)],
				]) {
					assert.ok(Math.abs(Math.hypot(...local) - 1) <= 512 * Number.EPSILON);
					const restored = incidentWorld(origin, local),
						radialCosine = dot(radial, restored);
					assert.ok(Math.abs(Math.hypot(...restored) - 1) <= 128 * Number.EPSILON);
					assert.ok(restored.every((x, axis) => Math.abs(x - expected[axis]) <= 512 * Number.EPSILON));
					assert.equal(
						radialCosine < horizon
							? 'volume-ground'
							: radialCosine < 0
								? 'volume-escaping'
								: 'volume-outward',
						branches[segment],
					);
					assert.equal(
						local[2] < horizon ? 'volume-ground' : local[2] < 0 ? 'volume-escaping' : 'volume-outward',
						branches[segment],
					);
				}
				groups.push({branch: branches[segment], incident: {direction, mirror, weight}});
			}
		}
	}
	assert.equal(groups.length, (3 * polarCount * azimuthCount) / 2);
	assert.ok(
		Math.abs(groups.reduce((sum, group) => sum + 2 * group.incident.weight, 0) - 4 * Math.PI) <=
			8192 * Number.EPSILON * 4 * Math.PI,
	);
	return groups;
}

/** Synthetic geometry, Jacobian and mirror checks at every registered count.
 * No retained phase-product value or atmospheric incident integral is evaluated.
 * @returns {SkyThetaGeometryProof}
 */
export function thetaGeometryProof() {
	let checks = 0;
	/** @param {boolean} condition @returns {void} */ function check(condition) {
		assert.ok(condition, 'Theta geometry proof ' + (checks + 1));
		checks++;
	}
	for (const a of [0.3, 0.7, 0.95])
		for (const b of [-0.8, 0, 0.8])
			for (const q of [-0.02, 0, 0.02]) {
				const theta = boundaryTheta(a, b, q);
				check(Math.abs(a * Math.cos(theta) + b * Math.sin(theta) - q) <= 256 * Number.EPSILON);
			}
	for (const count of [16, 32])
		for (const [low, high] of [
			[0, 0.1],
			[0.3, 2.6],
			[2.3, Math.PI],
		]) {
			const half = (high - low) / 2,
				centre = (high + low) / 2;
			const terms = componentGauss(count).map((root) => half * root.weight * Math.sin(centre + half * root.node));
			const actual = terms.reduce((sum, x) => sum + x, 0),
				exact = Math.cos(low) - Math.cos(high);
			check(terms.every((x) => x > 0));
			check(Math.abs(actual - exact) <= 8192 * Number.EPSILON * (Math.abs(actual) + Math.abs(exact)));
		}
	const bottom = 6371000;
	for (const [height, azimuth] of [
		[1, 0],
		[1000, 0.7],
	]) {
		const radius = bottom + height;
		const origin = /** @type {SkyVector3} */ ([
			radius * Math.sqrt(1 - 0.7 ** 2) * Math.cos(azimuth),
			radius * Math.sqrt(1 - 0.7 ** 2) * Math.sin(azimuth),
			radius * 0.7,
		]);
		for (const [polarCount, azimuthCount] of /** @type {const} */ ([
			[16, 32],
			[32, 64],
			[16, 64],
		])) {
			const groups = thetaGroups(bottom, origin, polarCount, azimuthCount);
			check(groups.length === (3 * polarCount * azimuthCount) / 2);
			check(groups.every((g) => Number.isFinite(g.incident.weight) && g.incident.weight > 0));
			check(
				Math.abs(groups.reduce((sum, g) => sum + 2 * g.incident.weight, 0) - 4 * Math.PI) <=
					8192 * Number.EPSILON * 4 * Math.PI,
			);
			for (const branch of ['volume-ground', 'volume-escaping', 'volume-outward'])
				check(groups.filter((g) => g.branch === branch).length === (polarCount * azimuthCount) / 2);
			check(
				groups.every(
					({incident}) =>
						incident.mirror &&
						Math.abs(incident.direction[0] - incident.mirror[0]) <= 512 * Number.EPSILON &&
						Math.abs(incident.direction[1] + incident.mirror[1]) <= 512 * Number.EPSILON &&
						Math.abs(incident.direction[2] - incident.mirror[2]) <= 512 * Number.EPSILON,
				),
			);
			check(
				groups.every(({incident}) => {
					assert.ok(incident.mirror);
					const w = incidentWorld(origin, incident.direction),
						m = incidentWorld(origin, incident.mirror);
					return (
						Math.abs(w[2] - m[2]) <= 512 * Number.EPSILON &&
						Math.abs(dot(unit(origin), w) - dot(unit(origin), m)) <= 512 * Number.EPSILON
					);
				}),
			);
		}
	}
	assert.throws(() => boundaryTheta(0.01, 0.7, -0.02));
	checks++;
	assert.throws(() => thetaGroups(bottom, [0, 0, bottom + 1000], 16, 32));
	checks++;
	assert.throws(() => thetaGroups(bottom, [1, 0, bottom + 1000], 32, 32));
	checks++;
	return {
		checks,
		scope: 'Synthetic unique physical boundaries, analytic sin(theta) Jacobian integrals, positive solid angle, branch counts, local/world unit vectors and source-plane mirror parity at pilot/fine/replay counts. No retained geometry, phase control or atmospheric integration.',
	};
}
