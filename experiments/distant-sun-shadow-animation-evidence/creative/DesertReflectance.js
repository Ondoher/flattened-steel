/**
 * Source-informed, illustrative dry-sand reflectance and local reflected light.
 * See ground-reflectance.md for the reference, approximate values, and the
 * explicit exclusion of atmospheric multiple-scattering ground feedback.
 */
export const DesertReflectance = {
	/**
	 * Call this method to construct the fixed Native15 dry-sand reflectance.
	 *
	 * @param {SpectralPacket} referencePacket - Live packet supplying its Native15 basis and class identity.
	 * @returns {SpectralPacket} - Dimensionless wavelength-dependent reflectance.
	 */
	createPacket(referencePacket) {
		const basis = referencePacket.basis;
		const Packet = /** @type {CreativeSpectralPacketConstructor} */ (referencePacket.constructor);
		if (basis.channelCount !== 15 || basis.id !== 'algorithm32-native-15-spectral-basis-v1')
			throw new RangeError('Creative sand requires the exact Native15 basis.');
		return new Packet({
			basis,
			semantics: basis.semantics,
			quantity: 'spectral-reflectance',
			units: '1',
			values: [0.08, 0.11, 0.16, 0.21, 0.25, 0.29, 0.33, 0.36, 0.39, 0.415, 0.435, 0.455, 0.475, 0.49, 0.505],
			provenanceIdentity: 'the-hours-illustrative-dry-sand-native15-v1',
		});
	},

	/**
	 * Call this method to derive a local ground-facing irradiance approximation
	 * from the Algorithm32 horizontal direct and diffuse spectral illumination.
	 * For uniform Lambertian ground, the ground-facing hemispherical irradiance
	 * is rho(lambda) times the incident horizontal irradiance. This local fill
	 * does not feed reflected energy into the existing black-ground sky caches.
	 *
	 * @param {ReceiverEnvironmentLightMeasurement} receiverLight - Exact current Algorithm32 illumination.
	 * @returns {SpectralPacket} - Spectral irradiance available from the lower hemisphere.
	 */
	reflectedIrradiance(receiverLight) {
		const direct = receiverLight.directHorizontal;
		const diffuse = receiverLight.diffuseHorizontal;
		const reflectance = this.createPacket(direct);
		const Packet = /** @type {CreativeSpectralPacketConstructor} */ (direct.constructor);
		return new Packet({
			basis: direct.basis,
			semantics: direct.semantics,
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			values: direct.values.map((value, index) => (value + diffuse.values[index]) * reflectance.values[index]),
			provenanceIdentity: `${receiverLight.identity}:the-hours-local-sand-bounce:${reflectance.contentHash}`,
		});
	},
};
