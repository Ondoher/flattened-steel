/** Type that describes direct lighting supplied by a configured light source. */
type DirectLightingSample = {
	/** Value that stores source spectral irradiance aligned to the active spectral basis. */
	sourceIrradiance: SpectralIrradiancePacket;

	/** Value that stores the normalized direction from the sample point toward the light. */
	directionToLight: UnitVector3;

	/** Value that stores source-path transmittance when the source owns a precomputed value. */
	sourceTransmittance?: SpectralTransmittancePacket;

	/** Value that stores owner-specific metadata for validation or diagnostics. */
	metadata?: unknown;
};

/** Type that describes how far a source path may travel before geometry or source policy terminates it. */
type SourcePathLimit = {
	/** Value that stores the maximum source-path distance, or null when the source is directional. Units travel with the value. */
	maxDistance: Distance | null;

	/** Explanation of the source-owned path limit policy. */
	reason: string;
};
