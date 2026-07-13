/**
 * Create zero-valued binary64 working storage.
 *
 * This implementation-only utility operates on values whose physical
 * interpretation has already been accepted at an owning boundary. It does no
 * validation and never publishes a unitless spectral value.
 *
 * @param {number} channelCount - Supplies the accepted spectral channel count.
 * @returns {Float64Array<ArrayBuffer>} Zero-valued working storage.
 */
export function zeroSpectralValues(channelCount) {
	return new Float64Array(channelCount);
}

/**
 * Create unit-valued binary64 working storage.
 *
 * @param {number} channelCount - Supplies the accepted spectral channel count.
 * @returns {Float64Array<ArrayBuffer>} Unit-valued working storage.
 */
export function oneSpectralValues(channelCount) {
	return new Float64Array(channelCount).fill(1);
}

/**
 * Convert finite optical-depth values to transmittance values.
 *
 * @param {ArrayLike<number>} opticalDepth - Supplies dimensionless optical depth.
 * @returns {Float64Array<ArrayBuffer>} Dimensionless transmittance.
 */
export function sourceTransmittanceValues(opticalDepth) {
	return Float64Array.from(opticalDepth, (value) => Math.exp(-value));
}

/**
 * Compute endpoint/trapezoid transmittance over one normalized meter segment.
 *
 * @param {ArrayLike<number>} previousExtinctionPerMeter - Supplies previous endpoint extinction.
 * @param {ArrayLike<number>} currentExtinctionPerMeter - Supplies current endpoint extinction.
 * @param {number} intervalLengthMeters - Supplies normalized segment length.
 * @returns {Float64Array<ArrayBuffer>} Dimensionless segment transmittance.
 */
export function trapezoidSegmentTransmittanceValues(
	previousExtinctionPerMeter,
	currentExtinctionPerMeter,
	intervalLengthMeters,
) {
	return Float64Array.from(previousExtinctionPerMeter, (previous, index) =>
		Math.exp(
			-0.5
			* (previous + currentExtinctionPerMeter[index])
			* intervalLengthMeters,
		));
}

/**
 * Combine normalized inverse-meter scattering values with phase values.
 *
 * @param {ArrayLike<number>} rayleighScatteringPerMeter - Supplies Rayleigh scattering.
 * @param {ArrayLike<number>} mieScatteringPerMeter - Supplies Mie scattering.
 * @param {number} rayleighPhasePerSteradian - Supplies Rayleigh phase.
 * @param {number} miePhasePerSteradian - Supplies Mie phase.
 * @returns {Float64Array<ArrayBuffer>} Phase-weighted scattering in m^-1 sr^-1.
 */
export function phaseWeightedScatteringValues(
	rayleighScatteringPerMeter,
	mieScatteringPerMeter,
	rayleighPhasePerSteradian,
	miePhasePerSteradian,
) {
	return Float64Array.from(rayleighScatteringPerMeter, (rayleigh, index) =>
		rayleigh * rayleighPhasePerSteradian
		+ mieScatteringPerMeter[index] * miePhasePerSteradian);
}

/**
 * Compute direct in-scattering over one normalized meter path measure.
 *
 * @param {ArrayLike<number>} viewTransmittance - Supplies observer survival.
 * @param {ArrayLike<number>} sourceTransmittance - Supplies source-path survival.
 * @param {ArrayLike<number>} sourceIrradianceWattsPerSquareMeterPerNanometer - Supplies source irradiance density.
 * @param {ArrayLike<number>} scatteringPerMeterPerSteradian - Supplies phase-weighted scattering.
 * @param {number} measureMeters - Supplies normalized path measure.
 * @returns {Float64Array<ArrayBuffer>} Radiance density values.
 */
export function directInScatteringValues(
	viewTransmittance,
	sourceTransmittance,
	sourceIrradianceWattsPerSquareMeterPerNanometer,
	scatteringPerMeterPerSteradian,
	measureMeters,
) {
	return Float64Array.from(viewTransmittance, (viewSurvival, index) =>
		viewSurvival
		* sourceTransmittance[index]
		* sourceIrradianceWattsPerSquareMeterPerNanometer[index]
		* scatteringPerMeterPerSteradian[index]
		* measureMeters);
}

/**
 * Multiply accepted same-basis working spectra componentwise.
 *
 * @param {ArrayLike<number>} left - Supplies the left working values.
 * @param {ArrayLike<number>} right - Supplies the right working values.
 * @returns {Float64Array<ArrayBuffer>} The componentwise product.
 */
export function multiplySpectralValues(left, right) {
	return Float64Array.from(left, (value, index) => value * right[index]);
}

/**
 * Accumulate one accepted same-basis spectrum into mutable working storage.
 *
 * @param {Float64Array<ArrayBufferLike>} target - Supplies mutable accumulation storage.
 * @param {ArrayLike<number>} contribution - Supplies the contribution.
 * @returns {void}
 */
export function accumulateSpectralValues(target, contribution) {
	for (let index = 0; index < target.length; index += 1) {
		target[index] += contribution[index];
	}
}
