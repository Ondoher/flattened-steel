/** Type that configures the canonical Algorithm32 atmosphere profile. */
type CanonicalAtmosphereConfig = {
	/** Optional value that overrides the implementation-owned atmosphere constants. */
	readonly constants?: CanonicalAtmosphereConstants;
	/** Optional selected spectral basis; omission selects Native-15. */
	readonly spectralBasis?: SpectralBasis;
	/** Optional exact sea-level Rayleigh scattering coefficients aligned to the selected basis. */
	readonly seaLevelRayleighScattering?: SpectralScatteringCoefficientPacket;
	/** Optional exact sea-level Mie extinction coefficients aligned to the selected basis. */
	readonly seaLevelMieExtinction?: SpectralExtinctionCoefficientPacket;
};

/** Type that stores constants for canonical atmosphere density, scattering, and phase. */
type CanonicalAtmosphereConstants = {
	/** Value that stores the spherical ground radius with its physical unit. */
	readonly bottomRadius: Distance;

	/** Value that stores the spherical top-of-atmosphere radius with its physical unit. */
	readonly topRadius: Distance;

	/** Value that stores Rayleigh scale height with its physical unit. */
	readonly rayleighScaleHeight: Distance;

	/** Value that stores Mie scale height with its physical unit. */
	readonly mieScaleHeight: Distance;

	/** Value that stores Rayleigh beta coefficient scale with wavelength in micrometers. */
	readonly rayleighCoefficientScale: number;

	/** Value that stores Angstrom aerosol alpha. */
	readonly mieAngstromAlpha: number;

	/** Value that stores Angstrom aerosol beta. */
	readonly mieAngstromBeta: number;

	/** Value that stores Mie single-scattering albedo. */
	readonly mieSingleScatteringAlbedo: number;

	/** Value that stores Mie phase asymmetry parameter. */
	readonly miePhaseFunctionG: number;

	/** Value that identifies whether ozone absorption participates in the selected profile. */
	readonly ozoneAbsorptionEnabled: boolean;
};
