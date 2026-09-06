/**
 * Configure the canonical Algorithm32 atmosphere profile.
 */
type CanonicalAtmosphereConfig = {
	/**
	 * Store atmosphere constants.
	 */
	readonly constants: CanonicalAtmosphereConstants;

	/**
	 * Store the wavelength basis used by atmosphere calculations.
	 */
	readonly spectralBasis: SpectralBasis;
};

/**
 * Store constants for canonical atmosphere density, scattering, and phase.
 */
type CanonicalAtmosphereConstants = {
	/**
	 * Store the spherical ground radius with its physical unit.
	 */
	readonly bottomRadius: Distance;

	/**
	 * Store the spherical top-of-atmosphere radius with its physical unit.
	 */
	readonly topRadius: Distance;

	/**
	 * Store Rayleigh scale height with its physical unit.
	 */
	readonly rayleighScaleHeight: Distance;

	/**
	 * Store Mie scale height with its physical unit.
	 */
	readonly mieScaleHeight: Distance;

	/**
	 * Store Rayleigh beta coefficient scale with wavelength in micrometers.
	 */
	readonly rayleighCoefficientScale: number;

	/**
	 * Store Angstrom aerosol alpha.
	 */
	readonly mieAngstromAlpha: number;

	/**
	 * Store Angstrom aerosol beta.
	 */
	readonly mieAngstromBeta: number;

	/**
	 * Store Mie single-scattering albedo.
	 */
	readonly mieSingleScatteringAlbedo: number;

	/**
	 * Store Mie phase asymmetry parameter.
	 */
	readonly miePhaseFunctionG: number;

	/**
	 * Identify whether ozone absorption participates in the selected profile.
	 */
	readonly ozoneAbsorptionEnabled: boolean;
};
