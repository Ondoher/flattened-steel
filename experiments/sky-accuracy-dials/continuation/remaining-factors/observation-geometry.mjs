import assert from 'node:assert/strict';
import {linearStencil, cross, dot, unit} from '../../numerics/math.js';
import {viewPathIntervals} from '../../numerics/view.js';
import {phase} from '../../numerics/direct.js';

/** Build the fixed pointing/cone directions, preserving a unit-length original control.
 * @param {SkyVector3} origin @param {SkyVector3} direction
 * @returns {SkyObservationDirection[]}
 */
export function observationDirections(origin, direction) {
	const up = unit(origin),
		vertical = dot(up, direction);
	const elevationTangent =
		vertical > 1 - 1e-12
			? unit([0, 0, 1].map((x, i) => x - up[2] * up[i]))
			: unit(up.map((x, i) => x - vertical * direction[i]));
	const across = unit(cross(direction, elevationTangent));
	/** @param {number} angle @param {readonly number[]} tangent @returns {SkyVector3} */
	const tilt = (angle, tangent) => unit(direction.map((x, i) => Math.cos(angle) * x + Math.sin(angle) * tangent[i]));
	/** @type {SkyObservationDirection[]} */ const result = [{variant: 'ideal', direction, weight: 1}];
	for (const sign of [-1, 1]) {
		const angle = (sign * 0.5 * Math.PI) / 180;
		result.push({
			variant: 'elevation-' + (sign < 0 ? 'minus' : 'plus'),
			direction: tilt(angle, elevationTangent),
			weight: 1,
		});
		const axisCross = cross(up, direction);
		result.push({
			variant: 'azimuth-' + (sign < 0 ? 'minus' : 'plus'),
			direction: unit(
				direction.map(
					(x, i) =>
						Math.cos(angle) * x + Math.sin(angle) * axisCross[i] + (1 - Math.cos(angle)) * vertical * up[i],
				),
			),
			weight: 1,
		});
	}
	for (const fullAngle of [1, 8])
		for (const rings of [1, 2]) {
			const radius = ((fullAngle / 2) * Math.PI) / 180;
			for (let ring = 0; ring < rings; ring++)
				for (let azimuth = 0; azimuth < 4; azimuth++) {
					const q = (ring + 0.5) / rings,
						theta = Math.acos(1 - q * (1 - Math.cos(radius))),
						phi = (2 * Math.PI * azimuth) / 4;
					const tangent = elevationTangent.map((x, i) => Math.cos(phi) * x + Math.sin(phi) * across[i]);
					result.push({
						variant: `cone-${fullAngle}-${rings * 4}`,
						direction: tilt(theta, tangent),
						weight: 1 / (rings * 4),
					});
				}
		}
	for (const variant of new Set(result.map((r) => r.variant)))
		assert.ok(Math.abs(result.filter((r) => r.variant === variant).reduce((s, r) => s + r.weight, 0) - 1) < 1e-14);
	assert.ok(result.every((r) => Math.abs(Math.hypot(...r.direction) - 1) < 1e-12 && dot(up, r.direction) > 0));
	return result;
}

/** Geometry preparation only: all density-column and radiance integrations run on GPU.
 * @param {SkyBuildRequest} request @param {DialContinuationRegistrationRead} registration
 * @param {readonly SkyJ1AssessmentRow[]} references @param {()=>void} progress
 * @returns {SkyObservationPayload}
 */
export function prepareObservation(request, registration, references, progress) {
	const spec = request.transportSpec,
		heights = spec.domains.position.nodes.map((n) => n.altitudeMeters),
		angles = spec.domains.solarZenith.nodes.map((n) => n.solarZenithDegrees),
		channels = [0, 8, 24, 30];
	const samples = [],
		anchors = [],
		rays = [];
	/** @type {SkyObservationRay[]} */ const rowLayout = [];
	/** @type {Map<string,number>} */ const anchorMap = new Map();
	/** @param {number} altitude @param {number} solar @returns {number} */
	function anchor(altitude, solar) {
		const key = altitude + ':' + solar;
		let id = anchorMap.get(key);
		if (id === undefined) {
			const mu = Math.cos((angles[solar] * Math.PI) / 180);
			assert.ok(mu > 0);
			id = anchors.length / 4;
			anchors.push(heights[altitude], mu, 0, 0);
			anchorMap.set(key, id);
		}
		return id;
	}
	for (const [probeIndex, original] of registration.record.probeRays.entries()) {
		progress();
		for (const perturbation of observationDirections(original.origin, original.direction)) {
			const direction = perturbation.direction,
				origin = original.origin,
				projection = dot(origin, direction);
			const length =
				-projection +
				Math.sqrt(projection * projection - (dot(origin, origin) - spec.planet.topRadiusMeters ** 2));
			const ray = {origin, direction, length},
				ph = phase(spec, direction[2]);
			for (const subdivisions of [8, 16]) {
				const intervals = viewPathIntervals(spec, ray, 'altitude-segmented', subdivisions),
					offset = samples.length / 16;
				assert.ok(intervals.length <= 768);
				for (const interval of intervals) {
					const distance = (interval.start + interval.end) / 2,
						point = origin.map((x, i) => x + distance * direction[i]);
					const radius = Math.hypot(...point),
						height = Math.max(0, radius - spec.planet.bottomRadiusMeters),
						mu = point[2] / radius;
					const altitude = linearStencil(heights, height),
						solar = linearStencil(angles, (Math.acos(Math.min(1, Math.max(-1, mu))) * 180) / Math.PI);
					const last = angles.length - 1,
						lower = solar.indices.length === 2 ? solar.indices[0] : Math.min(solar.indices[0], last - 1),
						upper = lower + 1;
					const f = solar.indices.length === 2 ? solar.weights[1] : solar.indices[0] === 0 ? 0 : 1;
					const solarIndices = [Math.max(0, lower - 1), lower, upper, Math.min(last, upper + 1)];
					samples.push(
						height,
						interval.end - interval.start,
						f,
						altitude.weights[1] ?? 0,
						Number(lower === 0),
						Number(upper === last),
						mu,
						0,
						...solarIndices.map((s) => anchor(altitude.indices[0], s)),
						...solarIndices.map((s) => anchor(altitude.indices[1] ?? altitude.indices[0], s)),
					);
				}
				rays.push(offset, intervals.length, ph[0], ph[1]);
				rowLayout.push({
					probeIndex,
					probeId: registration.probes[probeIndex].probeId,
					subdivisions,
					sampleCount: intervals.length,
					variant: perturbation.variant,
					weight: perturbation.weight,
					direction,
				});
			}
		}
	}
	assert.equal(rowLayout.length, 40 * 29 * 2);
	return {
		planet: [
			spec.planet.bottomRadiusMeters,
			spec.planet.topRadiusMeters - spec.planet.bottomRadiusMeters,
			spec.atmosphere.rayleighScaleHeightMeters,
			spec.atmosphere.mieScaleHeightMeters,
		],
		channels,
		spectra: channels.flatMap((c) => {
			const s = spec.domains.spectrum.channels[c];
			return [
				s.rayleighScatteringPerMeter,
				s.mieExtinctionPerMeter,
				s.sourceIrradianceDensityWattsPerSquareMeterPerNanometer,
				spec.atmosphere.mieSingleScatteringAlbedo,
			];
		}),
		anchors,
		samples,
		rays,
		rowLayout,
		references,
	};
}
