import {
	SPECTRAL_QUANTITIES,
	SPECTRAL_SAMPLE_SEMANTICS,
	SPECTRAL_UNITS,
	createSpectralBasis,
	createSpectralPacket,
} from '../../quantities/index.js';

/**
 * Create a compact canonical spectral basis for light-source tests.
 *
 * @param {number} channelCount - Supplies the number of test channels.
 * @param {string} [id] - Identifies the test basis.
 * @returns {SpectralBasis} The test basis.
 */
export function createTestSpectralBasis(
	channelCount,
	id = `light-source-test-${channelCount}-channel-basis`,
) {
	return createSpectralBasis({
		id,
		semantics: SPECTRAL_SAMPLE_SEMANTICS.BIN_AVERAGE,
		channels: Array.from({ length: channelCount }, (_, index) => ({
			id: `channel-${index}`,
			center: { value: 450 + index * 50, units: 'nanometers' },
			width: { value: 50, units: 'nanometers' },
		})),
	});
}

/**
 * Create source irradiance with an explicit test basis and interpretation.
 *
 * @param {readonly number[]} values - Supplies irradiance values.
 * @param {SpectralBasis} [basis] - Supplies the test basis.
 * @returns {SpectralIrradiancePacket} The irradiance packet.
 */
export function createTestSourceIrradiance(
	values,
	basis = createTestSpectralBasis(values.length),
) {
	return /** @type {SpectralIrradiancePacket} */ (createSpectralPacket({
		basis,
		quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY,
		units: SPECTRAL_UNITS.IRRADIANCE_DENSITY,
		values,
		provenanceIdentity: `test-source-irradiance:${basis.contentHash}:${values.join(',')}`,
	}));
}

/**
 * Create spectral radiance with an explicit test basis and interpretation.
 *
 * @param {readonly number[]} values - Supplies radiance values.
 * @param {SpectralBasis} basis - Supplies the test basis.
 * @returns {SpectralRadiancePacket} The radiance packet.
 */
export function createTestRadiance(values, basis) {
	return /** @type {SpectralRadiancePacket} */ (createSpectralPacket({
		basis,
		quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY,
		units: SPECTRAL_UNITS.RADIANCE_DENSITY,
		values,
		provenanceIdentity: `test-radiance:${basis.contentHash}:${values.join(',')}`,
	}));
}
