import {directDensity, medium} from '../../numerics/direct.js';
import {dot} from '../../numerics/math.js';
import {incidentWorld, outwardLength} from './angular.mjs';

/** Complete finite S/T factorial, including the matched finer reference background.
 * @readonly @type {readonly SkyJ2FiniteControl[]}
 */
export const localJ2FiniteControls = [
	{source: 80, transport: 160},
	{source: 160, transport: 160},
	{source: 80, transport: 320},
	{source: 160, transport: 320},
];

/** Evaluate the supplied straight physical ray with an explicit three-coordinate result.
 * @param {SkyVector3} origin - Ground origin.
 * @param {SkyVector3} direction - Unit world direction.
 * @param {number} distance - Physical distance along the ray.
 * @returns {SkyVector3} World position in metres.
 */
function pointAt(origin, direction, distance) {
	return [
		origin[0] + direction[0] * distance,
		origin[1] + direction[1] * distance,
		origin[2] + direction[2] * distance,
	];
}

/** Opaque-ground visibility matched to DistantSunBinary64Reference.visible.
 * @param {SkyTransportSpec} spec - Physical model.
 * @param {SkyVector3} point - Physical location.
 * @returns {boolean} Whether the +Z direct source is visible.
 */
function visible(spec, point) {
	const radius = Math.hypot(...point),
		bottom = spec.planet.bottomRadiusMeters;
	const height = Math.max(0, radius - bottom);
	return height <= 4 * Number.EPSILON * bottom
		? point[2] >= 0
		: point[2] >= 0 || point[2] ** 2 < height * (radius + bottom);
}

/** Source visibility and closest-approach breaks, adapted from the pinned binary64 owner.
 * @param {SkyTransportSpec} spec - Fixed geometry.
 * @param {SkyVector3} origin - Supplied exact ground point; no solar-angle round trip.
 * @param {SkyVector3} direction - Normalized incident direction.
 * @param {number} length - Outward distance to the atmospheric top.
 * @returns {number[]} Increasing physical segment boundaries.
 */
function breaks(spec, origin, direction, length) {
	const a = direction[0] ** 2 + direction[1] ** 2;
	const b = 2 * (origin[0] * direction[0] + origin[1] * direction[1]);
	const c = origin[0] ** 2 + origin[1] ** 2 - spec.planet.bottomRadiusMeters ** 2;
	const candidates = [],
		points = [0],
		tangent = -dot(origin, direction);
	if (Math.abs(a) > 1e-15) {
		const discriminant = b * b - 4 * a * c;
		if (discriminant >= 0)
			candidates.push((-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a));
	} else if (Math.abs(b) > 1e-15) candidates.push(-c / b);
	if (tangent > 1e-3 && tangent < length - 1e-3) points.push(tangent);
	for (const distance of candidates)
		if (distance > 1e-3 && distance < length - 1e-3) {
			const delta = Math.min(1, distance / 4, (length - distance) / 4);
			const before = pointAt(origin, direction, distance - delta);
			const after = pointAt(origin, direction, distance + delta);
			if (
				visible(spec, before) !== visible(spec, after) &&
				points.every((value) => Math.abs(value - distance) > 0.01)
			)
				points.push(distance);
		}
	return [...points, length].sort((a, b) => a - b);
}

/** Bounded first-order finite S/T control, adapted from DistantSunBinary64Reference.radiance(1).
 * This is binary64 at the exact supplied point and intended angular vectors, not GPU
 * Float32 parity or a spatial/solar reconstruction. Negative local cosine is exactly
 * zero at the pinned ground knot; positive outward rays cannot receive a ground term.
 * @param {SkyTransportSpec} spec - Fixed physical model.
 * @param {SkyVector3} origin - Exact physical ground point.
 * @param {SkyVector3} local - Unit incident receiver-local direction.
 * @param {readonly number[]} channels - Admitted spectral indices.
 * @param {number} sourceIntervals - Registered S80 or S160 trapezoid count.
 * @param {number} transportIntervals - Registered T160 or T320 trapezoid count per branch.
 * @param {() => void} guard - Live cancellation/progress callback.
 * @returns {number[]} Channel-order radiances in W m^-2 sr^-1 nm^-1.
 */
export function evaluateFiniteGroundL1(spec, origin, local, channels, sourceIntervals, transportIntervals, guard) {
	if (
		![80, 160].includes(sourceIntervals) ||
		![160, 320].includes(transportIntervals) ||
		Math.abs(Math.hypot(...origin) - spec.planet.bottomRadiusMeters) > 1e-6 ||
		Math.abs(Math.hypot(...local) - 1) > 1e-12 ||
		!channels.length ||
		new Set(channels).size !== channels.length ||
		channels.some((channel) => !Number.isInteger(channel) || !spec.domains.spectrum.channels[channel])
	)
		throw new RangeError('Finite local L1 requires registered counts, channels and exact ground geometry.');
	guard();
	if (local[2] < 0) return channels.map(() => 0);
	const model = {
		...spec,
		numerical: {
			...spec.numerical,
			sourcePathTransmittanceIntervalCount: sourceIntervals,
			transportIntervalCount: transportIntervals,
		},
	};
	const direction = incidentWorld(origin, local),
		length = outwardLength(origin, direction, spec.planet.topRadiusMeters);
	const boundaries = breaks(spec, origin, direction, length);
	return channels.map((channel) => {
		let transmittance = 1,
			radiance = 0;
		for (let segment = 1; segment < boundaries.length; segment++) {
			const step = (boundaries[segment] - boundaries[segment - 1]) / transportIntervals;
			let previousExtinction = 0;
			for (let sample = 0; sample <= transportIntervals; sample++) {
				if (sample % 16 === 0) guard();
				const distance = boundaries[segment - 1] + sample * step;
				const point = pointAt(origin, direction, distance);
				const extinction = medium(model, channel, Math.hypot(...point) - model.planet.bottomRadiusMeters)[0];
				if (sample > 0) transmittance *= Math.exp(-0.5 * (previousExtinction + extinction) * step);
				radiance +=
					transmittance *
					directDensity(model, channel, point, direction) *
					step *
					(sample === 0 || sample === transportIntervals ? 0.5 : 1);
				previousExtinction = extinction;
			}
		}
		if (!(radiance >= 0) || !Number.isFinite(radiance)) throw new Error('Finite local L1 is invalid.');
		return radiance;
	});
}
