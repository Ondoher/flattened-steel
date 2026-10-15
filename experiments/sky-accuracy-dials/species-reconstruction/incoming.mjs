// Finite L1 adaptation of the read-only DistantSunBinary64Reference radiance(1)
// equations. No domain-sized arrays, previous cache fields or angular refinement.
import assert from 'node:assert/strict';
import {sourceFrame, unit, dot} from '../numerics/math.js';
import {directDensity, medium, sourceTransmittance} from '../numerics/direct.js';

/** Stable forward boundary, including the original 1 mm positive-root policy.
 * @param {SkyVector3} point @param {SkyVector3} direction @param {number} radius
 * @returns {number} Positive distance or Infinity when no positive crossing exists.
 */
function boundary(point, direction, radius) {
	const r = Math.hypot(...point),
		b = dot(point, direction),
		c = (r - radius) * (r + radius);
	if (b * b < c) return Infinity;
	const root = Math.sqrt(b * b - c),
		far = -b - (b >= 0 ? root : -root),
		near = far === 0 ? 0 : c / far;
	return [near, far].sort((a, b) => a - b).find((x) => x > 1e-3) ?? Infinity;
}

/** Match the binary64 opaque-ground visibility test.
 * @param {SkyTransportSpec} spec @param {SkyVector3} point @returns {boolean}
 */
function visible(spec, point) {
	const r = Math.hypot(...point),
		h = Math.max(0, r - spec.planet.bottomRadiusMeters);
	return h <= 4 * Number.EPSILON * spec.planet.bottomRadiusMeters
		? point[2] >= 0
		: point[2] >= 0 || point[2] ** 2 < h * (r + spec.planet.bottomRadiusMeters);
}

/** Evaluate a position without changing the physical ray.
 * @param {SkyVector3} p @param {SkyVector3} v @param {number} d @returns {SkyVector3}
 */
function along(p, v, d) {
	return [p[0] + v[0] * d, p[1] + v[1] * d, p[2] + v[2] * d];
}

/** Split the finite path at closest approach and genuine source-visibility changes.
 * @param {SkyTransportSpec} spec @param {SkyVector3} p @param {SkyVector3} v @param {number} length
 * @returns {number[]} Ordered branch endpoints.
 */
function breaks(spec, p, v, length) {
	const a = v[0] ** 2 + v[1] ** 2,
		b = 2 * (p[0] * v[0] + p[1] * v[1]),
		c = p[0] ** 2 + p[1] ** 2 - spec.planet.bottomRadiusMeters ** 2,
		roots = [],
		result = [0];
	if (Math.abs(a) > 1e-15 && b * b >= 4 * a * c)
		roots.push((-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a), (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a));
	else if (Math.abs(a) <= 1e-15 && Math.abs(b) > 1e-15) roots.push(-c / b);
	const tangent = -dot(p, v);
	if (tangent > 1e-3 && tangent < length - 1e-3) result.push(tangent);
	for (const d of roots)
		if (d > 1e-3 && d < length - 1e-3) {
			const delta = Math.min(1, d / 4, (length - d) / 4);
			if (
				visible(spec, along(p, v, d - delta)) !== visible(spec, along(p, v, d + delta)) &&
				result.every((x) => Math.abs(x - d) > 0.01)
			)
				result.push(d);
		}
	return [...result, length].sort((a, b) => a - b);
}

/** Freeze actual coupled finite-rule L1 at one receiver for all original F68 directions.
 * This shared input uses original S20/T40 trapezoids and one direct-ground term.
 * It is not a converged continuous incoming-light reference.
 * @param {SkyTransportSpec} spec @param {SkyVector3} point @param {()=>void} guard
 * @returns {SpeciesIncident} No cache reconstruction occurs in this incoming calculation.
 */
export function incomingAt(spec, point, guard) {
	const axes = sourceFrame(point),
		spectrum = spec.domains.spectrum.channels[8],
		bottom = spec.planet.bottomRadiusMeters;
	const directions = spec.domains.incoming.unitVectors.map((local) =>
		unit([0, 1, 2].map((i) => axes[0][i] * local[0] + axes[1][i] * local[1] + axes[2][i] * local[2])),
	);
	const radiances = directions.map((v, index) => {
		guard();
		if (
			Math.max(0, Math.hypot(...point) - bottom) <= 4 * Number.EPSILON * bottom &&
			spec.domains.incoming.unitVectors[index][2] < 0
		)
			return 0;
		const ground = boundary(point, v, bottom),
			top = boundary(point, v, spec.planet.topRadiusMeters),
			length = Math.min(ground, top);
		if (!(length > 0 && Number.isFinite(length))) return 0;
		const cuts = breaks(spec, point, v, length),
			count = spec.numerical.transportIntervalCount;
		let transmission = 1,
			radiance = 0;
		for (let segment = 1; segment < cuts.length; segment++) {
			const step = (cuts[segment] - cuts[segment - 1]) / count;
			let previous = 0;
			for (let j = 0; j <= count; j++) {
				const p = along(point, v, cuts[segment - 1] + j * step),
					extinction = medium(spec, 8, Math.hypot(...p) - bottom)[0];
				if (j) transmission *= Math.exp(-0.5 * (previous + extinction) * step);
				radiance += transmission * directDensity(spec, 8, p, v) * step * (j === 0 || j === count ? 0.5 : 1);
				previous = extinction;
			}
		}
		if (ground < Infinity && Math.abs(ground - length) <= 1 && spectrum.groundAlbedo > 0) {
			const p = along(point, v, length);
			radiance +=
				(transmission *
					spectrum.sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
					sourceTransmittance(spec, 8, p) *
					Math.max(0, unit(p)[2]) *
					spectrum.groundAlbedo) /
				Math.PI;
		}
		assert.ok(Number.isFinite(radiance) && radiance >= 0);
		return radiance;
	});
	return {point, axes, directions, radiances};
}

/** Independent binary64 world-angle source arithmetic with compensated species sums.
 * Shares only the frozen physical incoming packet and domain weights with the producer.
 * @param {SkyTransportSpec} spec @param {SpeciesIncident} incident @param {SkyVector3} outgoing
 * @returns {SpeciesSource} Exact-query finite-rule comparison target before storage.
 */
export function referenceSource(spec, incident, outgoing) {
	const g = spec.atmosphere.miePhaseFunctionG,
		sums = [0, 0],
		corrections = [0, 0];
	for (let i = 0; i < incident.radiances.length; i++) {
		const c = Math.max(-1, Math.min(1, dot(outgoing, incident.directions[i]))),
			p = [
				(3 * (1 + c * c)) / (16 * Math.PI),
				(3 * (1 - g * g) * (1 + c * c)) /
					(8 * Math.PI * (2 + g * g) * Math.pow(Math.max(1e-7, 1 + g * g - 2 * g * c), 1.5)),
			];
		for (let s = 0; s < 2; s++) {
			const y =
					incident.radiances[i] * spec.domains.incoming.integrationWeightsSteradians[i] * p[s] -
					corrections[s],
				t = sums[s] + y;
			corrections[s] = t - sums[s] - y;
			sums[s] = t;
		}
	}
	const h = Math.max(0, Math.hypot(...incident.point) - spec.planet.bottomRadiusMeters),
		spectrum = spec.domains.spectrum.channels[8];
	return {
		rayleigh:
			sums[0] * spectrum.rayleighScatteringPerMeter * Math.exp(-h / spec.atmosphere.rayleighScaleHeightMeters),
		mie:
			sums[1] *
			spectrum.mieExtinctionPerMeter *
			spec.atmosphere.mieSingleScatteringAlbedo *
			Math.exp(-h / spec.atmosphere.mieScaleHeightMeters),
	};
}
