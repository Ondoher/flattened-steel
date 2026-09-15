import assert from 'node:assert/strict';
import {volumeDot} from '../volume-reference/geometry.mjs';

/** Map radius from closest approach, avoiding an artificial zero-Jacobian boundary layer.
 * @param {SkyVolumeGeometry} geometry - Original admitted unit-direction physical ray.
 * @param {SkyVolumeSegment} segment - Original monotone-radius and visibility interval.
 * @returns {SkyVolumeMap} Positive measure with the original inward/outward orientation.
 */
export function closestApproachAltitudeMap(geometry, segment) {
	const o = geometry.origin,
		v = geometry.direction,
		p = volumeDot(o, v);
	const b = Math.hypot(o[1] * v[2] - o[2] * v[1], o[2] * v[0] - o[0] * v[2], o[0] * v[1] - o[1] * v[0]);
	const outward = p + (segment.startMeters + segment.endMeters) / 2 >= 0;
	const lowDistance = outward ? segment.startMeters : segment.endMeters,
		sign = outward ? 1 : -1;
	const q0 = Math.abs(p + lowDistance),
		length = segment.endMeters - segment.startMeters;
	assert.ok(Number.isFinite(b) && Number.isFinite(q0) && Number.isFinite(length) && length >= 0 && b + q0 > 0);
	const q1 = q0 + length,
		r0 = Math.hypot(b, q0),
		r1 = Math.hypot(b, q1);
	const t0 = q0 / Math.sqrt(r0 + b),
		t1 = q1 / Math.sqrt(r1 + b);
	const endCoordinate = (length * (2 * q0 + length)) / ((r1 + r0) * (t1 + t0));
	return {
		endCoordinate,
		evaluate: (coordinate) => {
			const t = t0 + coordinate,
				root = Math.sqrt(2 * b + t * t),
				q = t * root;
			const increment =
				q + q0 === 0 ? 0 : (coordinate * (2 * t0 + coordinate) * (2 * b + t * t + t0 * t0)) / (q + q0);
			return {distance: lowDistance + sign * increment, jacobian: (2 * (b + t * t)) / root};
		},
	};
}
