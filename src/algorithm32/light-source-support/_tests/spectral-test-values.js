import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	SpectralBasis,
	SpectralPacket,
} from '../../spectral-values/index.js';

/**
 * Call this function to create a compact canonical spectral basis for light-source tests.
 *
 * @param {number} channelCount - The number of channels in the test basis.
 * @param {string} [id] - The unique identifier for the test basis.
 * @returns {SpectralBasis} - The test basis.
 */
export function createTestSpectralBasis(channelCount, id = `light-source-test-${channelCount}-channel-basis`) {
	return new SpectralBasis({
		id,
		semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
		channels: Array.from(
			{length: channelCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param _unusedValue - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_unusedValue, index) => ({
				id: `channel-${index}`,
				center: {value: 450 + index * 50, units: 'nanometers'},
				width: {value: 50, units: 'nanometers'},
			}),
		),
	});
}

/**
 * Call this function to create source irradiance with an explicit test basis and interpretation.
 *
 * @param {readonly number[]} values - The irradiance values for the test packet.
 * @param {SpectralBasis} [basis] - The spectral basis for the test packet.
 * @returns {SpectralIrradiancePacket} - The irradiance packet.
 */
export function createTestSourceIrradiance(values, basis = createTestSpectralBasis(values.length)) {
	return /** @type {SpectralIrradiancePacket} */ (
		new SpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
			units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
			values,
			provenanceIdentity: `test-source-irradiance:${basis.contentHash}:${values.join(',')}`,
		})
	);
}

/**
 * Call this function to create spectral radiance with an explicit test basis and interpretation.
 *
 * @param {readonly number[]} values - The radiance values for the test packet.
 * @param {SpectralBasis} basis - The spectral basis for the test packet.
 * @returns {SpectralRadiancePacket} - The radiance packet.
 */
export function createTestRadiance(values, basis) {
	return /** @type {SpectralRadiancePacket} */ (
		new SpectralPacket({
			basis,
			quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
			units: SPECTRAL_UNITS.RADIANCE_DENSITY,
			values,
			provenanceIdentity: `test-radiance:${basis.contentHash}:${values.join(',')}`,
		})
	);
}
