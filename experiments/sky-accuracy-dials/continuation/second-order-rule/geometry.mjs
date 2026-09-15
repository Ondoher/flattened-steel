import assert from 'node:assert/strict';
import {dot} from '../../numerics/math.js';
import {gaussLegendre} from '../../numerics/profile.js';
import {secondOrderViewNodes, viewHeightBreaks} from '../second-order-view/geometry.mjs';

/** Stable distance to an exact radial height on an outward surface ray.
 * @param {number} radius - Ground radius in metres.
 * @param {number} projection - Original surface origin dotted with the original unit view.
 * @param {number} height - Exact nonnegative radial height in metres.
 * @returns {number} Physical distance in metres, with zero preserved exactly.
 */
function distanceAtHeight(radius, projection, height) {
	const delta = height * (2 * radius + height);
	return delta / (Math.sqrt(projection * projection + delta) + projection);
}

/** Construct a fixed final-view rule without evaluating radiation or writing evidence.
 * Simpson retains separate contributions at shared positive-height endpoints.
 * Its sole omitted node is the exact ground endpoint, whose transformed weight
 * is analytically zero for a bounded physical source; no epsilon point is used.
 * @param {DialContinuationRegistrationRead} registration - Authenticated original C0 rays.
 * @param {SkyTransportSpec} spec - Unchanged physical radii.
 * @param {string} probeId - Frozen p-0930-5-7 or p-1230-3-5 view.
 * @param {SkySecondOrderOuterKind} kind - Independent coordinate and quadrature family.
 * @param {number} count - Four, eight or sixteen Gaussian nodes or even Simpson panels per interval.
 * @returns {SkySecondOrderOuterRule} Complete ordered terms and explicit ground-endpoint metadata.
 */
export function secondOrderOuterRule(registration, spec, probeId, kind, count) {
	assert.ok(['gauss-height', 'gauss-distance', 'simpson-height'].includes(kind), 'Unsupported outer rule.');
	assert.ok([4, 8, 16].includes(count), 'Outer count must be four, eight or sixteen.');
	assert.ok(['p-0930-5-7', 'p-1230-3-5'].includes(probeId), 'Unknown frozen view.');
	if (kind === 'gauss-height')
		return {
			kind,
			count,
			nodes: secondOrderViewNodes(registration, spec, probeId, count),
			groundEndpointAnalyticZero: false,
		};
	const probeIndex = registration.probes.findIndex((probe) => probe.probeId === probeId);
	assert.ok(probeIndex >= 0, 'Frozen view is missing from registration.');
	const ray = registration.record.probeRays[probeIndex];
	const radius = spec.planet.bottomRadiusMeters;
	assert.equal(spec.planet.topRadiusMeters - radius, viewHeightBreaks.at(-1));
	assert.ok(Math.abs(Math.hypot(...ray.origin) - radius) < 1e-6);
	assert.ok(Math.abs(Math.hypot(...ray.direction) - 1) < 1e-12);
	const projection = dot(ray.origin, ray.direction);
	assert.ok(Number.isFinite(projection) && projection > 0, 'Frozen view must point outward.');
	/** @type {SkySecondOrderViewNode[]} */
	const nodes = [];
	/** Retain one interval contribution without merging shared physical endpoints.
	 * @param {number} interval - Original physical shell index.
	 * @param {number} localIndex - Gaussian node or Simpson endpoint/interior index.
	 * @param {number} heightMeters - Radial height, snapped to exact boundaries when present.
	 * @param {number} distanceMeters - Distance along the unchanged original view.
	 * @param {number} weightMeters - Positive path integration weight.
	 */
	function append(interval, localIndex, heightMeters, distanceMeters, weightMeters) {
		assert.ok(
			heightMeters > 0 && weightMeters > 0 && [heightMeters, distanceMeters, weightMeters].every(Number.isFinite),
		);
		/** @type {SkyVector3} */
		const origin = [
			ray.origin[0] + distanceMeters * ray.direction[0],
			ray.origin[1] + distanceMeters * ray.direction[1],
			ray.origin[2] + distanceMeters * ray.direction[2],
		];
		assert.ok(Math.abs(Math.hypot(...origin) - radius - heightMeters) < 1e-6);
		nodes.push({
			id: `${probeId}:${kind}:${count}:i${interval}:n${localIndex}`,
			probeId,
			index: nodes.length,
			interval,
			heightMeters,
			distanceMeters,
			weightMeters,
			origin,
			surfaceOrigin: [...ray.origin],
			direction: [...ray.direction],
		});
	}
	for (let interval = 0; interval < viewHeightBreaks.length - 1; interval++) {
		const low = viewHeightBreaks[interval],
			high = viewHeightBreaks[interval + 1];
		if (kind === 'gauss-distance') {
			const start = distanceAtHeight(radius, projection, low),
				end = distanceAtHeight(radius, projection, high);
			for (const [localIndex, root] of gaussLegendre(count).entries()) {
				const distance = (start + end) / 2 + (root.node * (end - start)) / 2;
				const delta = distance * (distance + 2 * projection);
				const height = delta / (Math.sqrt(radius * radius + delta) + radius);
				append(interval, localIndex, height, distance, (root.weight * (end - start)) / 2);
			}
		} else {
			const start = Math.sqrt(low),
				end = Math.sqrt(high),
				step = (end - start) / count;
			for (let localIndex = 0; localIndex <= count; localIndex++) {
				// Dyadic fractions give exactly shared interior coordinates across 4/8/16.
				const coordinate =
					localIndex === 0
						? start
						: localIndex === count
							? end
							: start + (end - start) * (localIndex / count);
				const height = localIndex === 0 ? low : localIndex === count ? high : coordinate * coordinate;
				const delta = height * (2 * radius + height);
				const jacobian = (2 * coordinate * (radius + height)) / Math.sqrt(projection * projection + delta);
				const coefficient = localIndex === 0 || localIndex === count ? 1 : localIndex % 2 ? 4 : 2;
				const weight = (step / 3) * coefficient * jacobian;
				if (interval === 0 && localIndex === 0) {
					assert.equal(height, 0);
					assert.equal(weight, 0);
					continue;
				}
				append(interval, localIndex, height, distanceAtHeight(radius, projection, height), weight);
			}
		}
	}
	return {kind, count, nodes, groundEndpointAnalyticZero: kind === 'simpson-height'};
}
