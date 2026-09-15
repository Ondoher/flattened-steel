import assert from 'node:assert/strict';
import {dot} from '../../numerics/math.js';
import {gaussLegendre} from '../../numerics/profile.js';
import {volumeJ2Groups} from '../volume-j2/angular.mjs';
import {componentGauss} from '../j2/angular.mjs';

/** Declared physical integration boundaries, in metres above the opaque ground. */
export const viewHeightBreaks = Object.freeze([0, 1875, 8000, 24000, 60000]);
/** Frozen local angular comparison order. @type {readonly SkySecondOrderAngularRule[]} */
export const viewAngularRules = Object.freeze(['ordinary-coarse', 'ordinary-fine', 'mapped-fine']);

/** Stable outward surface-ray distance and Jacobian in square-root height.
 * @param {number} radius - Ground radius in metres.
 * @param {number} projection - Original surface origin dotted with unit view, in metres.
 * @param {number} coordinate - Square root of nonnegative radial altitude.
 * @returns {SkyPhysicalAltitudeCoordinate} Physical path distance and ds/dsqrt(h).
 */
export function viewHeightCoordinate(radius, projection, coordinate) {
	assert.ok(
		radius > 0 && projection > 0 && coordinate >= 0 && [radius, projection, coordinate].every(Number.isFinite),
	);
	const height = coordinate * coordinate,
		delta = height * (2 * radius + height);
	const tangent = Math.sqrt(projection * projection + delta);
	return {distance: delta / (tangent + projection), jacobian: (2 * coordinate * (radius + height)) / tangent};
}

/** Freeze a complete viewing quadrature before any physical incident evaluation.
 * @param {DialContinuationRegistrationRead} registration - Authenticated original C0 geometry.
 * @param {SkyTransportSpec} spec - Matched physical radii.
 * @param {string} [probeId] - Original outward surface probe.
 * @param {number} [count] - Gaussian nodes per physical interval.
 * @returns {SkySecondOrderViewNode[]} Exact ordered positive-height queries.
 */
export function secondOrderViewNodes(registration, spec, probeId = 'p-0930-5-7', count = 4) {
	assert.ok(['p-0930-5-7', 'p-1230-3-5'].includes(probeId) && [4, 8, 16].includes(count));
	const index = registration.probes.findIndex((probe) => probe.probeId === probeId);
	assert.ok(index >= 0);
	const ray = registration.record.probeRays[index],
		radius = spec.planet.bottomRadiusMeters;
	assert.equal(spec.planet.topRadiusMeters - radius, viewHeightBreaks.at(-1));
	assert.ok(
		Math.abs(Math.hypot(...ray.origin) - radius) < 1e-6 && Math.abs(Math.hypot(...ray.direction) - 1) < 1e-12,
	);
	const projection = dot(ray.origin, ray.direction);
	/** @type {SkySecondOrderViewNode[]} */ const nodes = [];
	for (let interval = 0; interval < viewHeightBreaks.length - 1; interval++) {
		const start = Math.sqrt(viewHeightBreaks[interval]),
			end = Math.sqrt(viewHeightBreaks[interval + 1]);
		for (const [localIndex, root] of gaussLegendre(count).entries()) {
			const coordinate = (start + end) / 2 + (root.node * (end - start)) / 2;
			const {distance: distanceMeters, jacobian} = viewHeightCoordinate(radius, projection, coordinate);
			/** @type {SkyVector3} */ const origin = [
				ray.origin[0] + distanceMeters * ray.direction[0],
				ray.origin[1] + distanceMeters * ray.direction[1],
				ray.origin[2] + distanceMeters * ray.direction[2],
			];
			const heightMeters = coordinate * coordinate;
			assert.ok(Math.abs(Math.hypot(...origin) - radius - heightMeters) < 1e-6);
			nodes.push({
				id: `${probeId}:g${count}:i${interval}:n${localIndex}`,
				probeId,
				index: nodes.length,
				interval,
				heightMeters,
				distanceMeters,
				weightMeters: (root.weight * (end - start) * jacobian) / 2,
				origin,
				surfaceOrigin: [...ray.origin],
				direction: [...ray.direction],
			});
		}
	}
	return nodes;
}

/** Independent horizon-concentrated cosine placement with its exact positive Jacobian.
 * @param {number} bottom - Opaque ground radius.
 * @param {SkyVector3} origin - Positive-height query.
 * @param {SkySecondOrderAngularRule} rule - Frozen ordinary or mapped comparison.
 * @returns {SkyVolumeJ2Group[]} Complete full-sphere representatives and their mirror weights.
 */
export function secondOrderAngularGroups(bottom, origin, rule) {
	assert.ok(viewAngularRules.includes(rule));
	if (rule !== 'mapped-fine')
		return volumeJ2Groups(
			bottom,
			origin,
			rule === 'ordinary-coarse' ? 8 : 16,
			rule === 'ordinary-coarse' ? 16 : 32,
		);
	const radius = Math.hypot(...origin),
		height = radius - bottom;
	assert.ok(height > 1e-6);
	const horizon = -Math.sqrt(height * (radius + bottom)) / radius;
	const edges = [-1, horizon, 0, 1],
		step = (2 * Math.PI) / 32;
	/** @type {SkyVolumeBranch[]} */ const branches = ['volume-ground', 'volume-escaping', 'volume-outward'];
	/** @type {SkyVolumeJ2Group[]} */ const groups = [];
	for (let segment = 0; segment < 3; segment++)
		for (const root of componentGauss(16)) {
			const u = (root.node + 1) / 2,
				length = edges[segment + 1] - edges[segment];
			const mu = segment === 0 ? horizon - length * u * u : edges[segment] + length * u * u;
			const radial = Math.sqrt(1 - mu * mu),
				weight = root.weight * length * u * step;
			for (let index = 0; index < 16; index++) {
				const angle = (index + 0.5) * step,
					x = radial * Math.cos(angle),
					y = radial * Math.sin(angle);
				groups.push({
					branch: branches[segment],
					incident: {direction: [x, y, mu], mirror: [x, -y, mu], weight},
				});
			}
		}
	return groups;
}
