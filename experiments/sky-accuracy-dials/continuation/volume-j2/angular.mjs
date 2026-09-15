import assert from 'node:assert/strict';
import {dot, localDirection} from '../../numerics/math.js';
import {medium, phase} from '../../numerics/direct.js';
import {gaussLegendreRule} from '../reference/physical/quadrature.mjs';
import {componentGauss} from '../j2/angular.mjs';

/** Locate the registered radial heights along two unchanged C0 viewing rays.
 * @param {DialContinuationRegistrationRead} registration - Original authenticated C0 geometry.
 * @param {SkyTransportSpec} spec - Matched physical radii.
 * @returns {SkyVolumeJ2Target[]} Eight prospective volume targets.
 */
export function volumeJ2Targets(registration, spec) {
	return ['p-0930-5-7', 'p-1230-3-5'].flatMap((probeId) => {
		const index = registration.probes.findIndex((probe) => probe.probeId === probeId);
		assert.ok(index >= 0, `Missing frozen probe ${probeId}`);
		const ray = registration.record.probeRays[index];
		const radius = Math.hypot(...ray.origin),
			projection = dot(ray.origin, ray.direction);
		assert.ok(Math.abs(radius - spec.planet.bottomRadiusMeters) < 1e-6 && projection > 0);
		return [0.001, 1, 1000, 8000].map((heightMeters) => {
			const targetRadius = spec.planet.bottomRadiusMeters + heightMeters;
			const delta = (targetRadius - radius) * (targetRadius + radius);
			const distanceMeters = delta / (Math.sqrt(projection * projection + delta) + projection);
			/** @type {SkyVector3} */ const origin = [
				ray.origin[0] + distanceMeters * ray.direction[0],
				ray.origin[1] + distanceMeters * ray.direction[1],
				ray.origin[2] + distanceMeters * ray.direction[2],
			];
			return {
				id: `${probeId}:h${heightMeters}`,
				probeId,
				heightMeters,
				distanceMeters,
				surfaceOrigin: [...ray.origin],
				origin,
				direction: [...ray.direction],
			};
		});
	});
}

/** Split the full incoming sphere at the exact ground horizon and radial tangent.
 * @param {number} bottom - Ground radius in metres.
 * @param {SkyVector3} origin - Positive-height position.
 * @param {number} [radialCount] - Gaussian nodes in each separate interval.
 * @param {number} [azimuthCount] - Even midpoint samples around the complete circle.
 * @returns {SkyVolumeJ2Group[]} Positive-weight local reflection groups.
 */
export function volumeJ2Groups(bottom, origin, radialCount = 8, azimuthCount = 16) {
	assert.ok([8, 16, 32, 64].includes(radialCount) && [16, 32, 64, 128].includes(azimuthCount));
	const radius = Math.hypot(...origin),
		height = radius - bottom;
	assert.ok(height > 1e-6);
	const horizon = -Math.sqrt(height * (radius + bottom)) / radius;
	const ends = [-1, horizon, 0, 1],
		step = (2 * Math.PI) / azimuthCount;
	/** @type {SkyVolumeBranch[]} */ const branches = ['volume-ground', 'volume-escaping', 'volume-outward'];
	const roots = radialCount === 8 ? gaussLegendreRule(8) : componentGauss(radialCount);
	/** @type {SkyVolumeJ2Group[]} */ const groups = [];
	for (let segment = 0; segment < 3; segment++) {
		const half = (ends[segment + 1] - ends[segment]) / 2,
			centre = (ends[segment + 1] + ends[segment]) / 2;
		for (const root of roots) {
			const mu = centre + half * root.node,
				radial = Math.sqrt(1 - mu * mu);
			for (let index = 0; index < azimuthCount / 2; index++) {
				const angle = (index + 0.5) * step,
					x = radial * Math.cos(angle),
					y = radial * Math.sin(angle);
				groups.push({
					branch: branches[segment],
					incident: {direction: [x, y, mu], mirror: [x, -y, mu], weight: half * root.weight * step},
				});
			}
		}
	}
	return groups;
}

/** Preserve separate Rayleigh/Mie phase weights for both mirrored directions.
 * @param {SkyTransportSpec} spec - Matched medium.
 * @param {SkyVolumeJ2Target} target - Positive-height location and frozen view direction.
 * @param {number} channel - Direct40 index.
 * @param {SkyJ2Incident} incident - Local vectors and per-member solid angle.
 * @returns {readonly number[]} Rayleigh then Mie coefficients in inverse metres.
 */
export function volumeJ2Weights(spec, target, channel, incident) {
	const outgoing = localDirection(target.origin, target.direction);
	const coefficients = medium(spec, channel, Math.hypot(...target.origin) - spec.planet.bottomRadiusMeters);
	const weights = [0, 0];
	for (const direction of [incident.direction, ...(incident.mirror ? [incident.mirror] : [])]) {
		const phases = phase(spec, Math.max(-1, Math.min(1, dot(outgoing, direction))));
		for (let species = 0; species < 2; species++)
			weights[species] += incident.weight * coefficients[species + 1] * phases[species];
	}
	return weights;
}

/** Form complete angular sums without turning unavailable incident values into zero.
 * @param {SkyTransportSpec} spec - Matched medium.
 * @param {SkyVolumeJ2Target} target - Frozen volume point.
 * @param {readonly number[]} channels - Selected spectrum.
 * @param {readonly SkyVolumeJ2Group[]} groups - Complete angular rule.
 * @param {readonly SkyVolumeJ2Node[]} nodes - Representative evidence for this point, excluding mirror checks.
 * @returns {SkyVolumeJ2Row[]} Four separate physical contributions and sum identities.
 */
export function sumVolumeJ2(spec, target, channels, groups, nodes) {
	return channels.map((channel) => {
		/** @type {SkyVolumeJ2Sum[]} */ const sums = Array.from({length: 5}, () => ({
			gauss: 0,
			simpson: 0,
			allowance: 0,
			resolved: nodes.length === groups.length,
		}));
		for (const [index, group] of groups.entries()) {
			const row = nodes.find((node) => node.index === index)?.channels.find((value) => value.channel === channel);
			const [rayleigh, mie] = volumeJ2Weights(spec, target, channel, group.incident);
			const values = [row?.atmosphere, row?.atmosphere, row?.directGround, row?.directGround, row?.total];
			const weights = [rayleigh, mie, rayleigh, mie, rayleigh + mie];
			for (let component = 0; component < sums.length; component++) {
				const value = values[component],
					sum = sums[component],
					weight = weights[component];
				if (!value?.resolved) {
					sum.resolved = false;
					continue;
				}
				assert.ok(
					[value.gaussWatts, value.simpsonWatts, value.empiricalAllowanceWatts, weight].every(
						(v) => v !== null && Number.isFinite(v) && v >= 0,
					),
				);
				sum.gauss += weight * value.gaussWatts;
				sum.simpson += weight * value.simpsonWatts;
				sum.allowance += weight * value.empiricalAllowanceWatts;
			}
		}
		const estimates = sums.map((sum) => ({
			resolved: sum.resolved,
			gauss: sum.resolved ? sum.gauss : null,
			simpson: sum.resolved ? sum.simpson : null,
			mean: sum.resolved ? (sum.gauss + sum.simpson) / 2 : null,
			incidentAllowance: sum.resolved ? sum.allowance : null,
		}));
		const complete = estimates.every((value) => value.resolved);
		const total = estimates.slice(0, 4).reduce((sum, value) => sum + (value.mean ?? 0), 0);
		const sumDifference = complete ? Math.abs(total - estimates[4].mean) : null;
		const arithmeticAllowance =
			128 * Number.EPSILON * groups.length * Math.max(1e-30, total, estimates[4].mean ?? 0);
		return {
			channel,
			atmosphereRayleigh: estimates[0],
			atmosphereMie: estimates[1],
			groundRayleigh: estimates[2],
			groundMie: estimates[3],
			combined: estimates[4],
			sumDifference,
			arithmeticAllowance,
			sumIdentityPassed: complete && sumDifference <= arithmeticAllowance,
		};
	});
}
