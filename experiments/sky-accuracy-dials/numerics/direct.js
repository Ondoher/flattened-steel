import {dot} from './math.js';

/** Binary64 physical coefficients, adapted from DistantSunBinary64Reference.medium.
 * @param {SkyTransportSpec} spec - Fixed physical model.
 * @param {number} channel - Direct40 index.
 * @param {number} altitude - Height in metres.
 * @returns {SkyVector3} Extinction, Rayleigh scattering and Mie scattering per metre.
 */
export function medium(spec, channel, altitude) {
	const spectral = spec.domains.spectrum.channels[channel],
		atmosphere = spec.atmosphere;
	const rayleigh =
		spectral.rayleighScatteringPerMeter * Math.exp(-Math.max(0, altitude) / atmosphere.rayleighScaleHeightMeters);
	const mie = spectral.mieExtinctionPerMeter * Math.exp(-Math.max(0, altitude) / atmosphere.mieScaleHeightMeters);
	return [rayleigh + mie, rayleigh, mie * atmosphere.mieSingleScatteringAlbedo];
}

/** Analytic normalized Rayleigh and Cornette-Shanks phase functions.
 * @param {SkyTransportSpec} spec - Fixed phase parameters.
 * @param {number} cosine - Direction cosine.
 * @returns {readonly number[]} Rayleigh and Mie phase densities per steradian.
 */
export function phase(spec, cosine) {
	const g = spec.atmosphere.miePhaseFunctionG;
	return [
		(3 / (16 * Math.PI)) * (1 + cosine * cosine),
		((((3 / (8 * Math.PI)) * (1 - g * g)) / (2 + g * g)) * (1 + cosine * cosine)) /
			Math.max(1 + g * g - 2 * g * cosine, 1e-7) ** 1.5,
	];
}

/** Direct collimated-source attenuation with the matched binary64 reference equations.
 * Visibility includes the reference surface-rounding bound; optical depth uses the
 * explicitly selected trapezoid count. This evaluates no incoming angular grid.
 * @param {SkyTransportSpec} spec - Fixed physical and source integration controls.
 * @param {number} channel - Direct40 index.
 * @param {SkyVector3} point - World point with source along +Z.
 * @returns {number} Direct beam transmittance.
 */
export function sourceTransmittance(spec, channel, point) {
	const bottom = spec.planet.bottomRadiusMeters,
		radius = Math.hypot(...point),
		height = Math.max(0, radius - bottom);
	const visible =
		height <= 4 * Number.EPSILON * bottom
			? point[2] >= 0
			: point[2] >= 0 || point[2] * point[2] < height * (radius + bottom);
	if (!visible) return 0;
	const top = spec.planet.topRadiusMeters,
		projection = dot(point, [0, 0, 1]),
		constant = (radius - top) * (radius + top),
		discriminant = projection * projection - constant;
	if (discriminant < 0) return 1;
	const root = Math.sqrt(discriminant),
		far = -projection - (projection >= 0 ? root : -root),
		near = far === 0 ? 0 : constant / far;
	const length = [near, far].sort((a, b) => a - b).find((value) => value > 1e-3) ?? Infinity;
	if (!Number.isFinite(length)) return 1;
	const count = spec.numerical.sourcePathTransmittanceIntervalCount,
		step = length / count;
	let depth = 0;
	for (let index = 0; index <= count; index++)
		depth +=
			(index === 0 || index === count ? 0.5 : 1) *
			step *
			medium(spec, channel, Math.hypot(point[0], point[1], point[2] + index * step) - bottom)[0];
	return Math.exp(-depth);
}

/** Continuous pure first-order scattering density; physical density and phase are never cached.
 * @param {SkyTransportSpec} spec - Fixed physical model.
 * @param {number} channel - Direct40 index.
 * @param {SkyVector3} point - Physical midpoint.
 * @param {SkyVector3} direction - Unit world viewing direction.
 * @returns {number} Source density in W m^-3 sr^-1 nm^-1.
 */
export function directDensity(spec, channel, point, direction) {
	const coefficients = medium(spec, channel, Math.hypot(...point) - spec.planet.bottomRadiusMeters),
		phases = phase(spec, direction[2]);
	return (
		spec.domains.spectrum.channels[channel].sourceIrradianceDensityWattsPerSquareMeterPerNanometer *
		sourceTransmittance(spec, channel, point) *
		(coefficients[1] * phases[0] + coefficients[2] * phases[1])
	);
}
