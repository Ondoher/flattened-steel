/** Contract that provides configured Algorithm32 atmosphere-medium facts used by algorithm execution and runtime shader setup. */
interface AtmosphereModel {
	/** Value that identifies this configured atmosphere model instance for compatibility and cache keys. */
	readonly id: string;

	/** Value that stores the validated wavelength basis shared by atmosphere outputs. */
	readonly spectralBasis: SpectralBasis;

	/**
	 * Call this method to sample medium coefficients at one geometry-resolved atmosphere coordinate.
	 *
	 * @param coordinate - Supplies the atmosphere coordinate to sample.
	 * @returns - The sampled atmosphere medium coefficients.
	 */
	sampleMedium(coordinate: AtmosphereCoordinate): AtmosphereSample;

	/**
	 * Call this method to integrate optical depth along one geometry-owned atmosphere path.
	 *
	 * @param path - Supplies the atmosphere path to integrate.
	 * @returns - The optical-depth sample.
	 */
	integrateOpticalDepth(path: AtmospherePath): OpticalDepthSample;

	/**
	 * Call this method to sample Rayleigh and Mie phase facts for an incoming/outgoing direction pair.
	 *
	 * @param request - Describes the incoming and outgoing directions to sample.
	 * @returns - The sampled phase-function facts.
	 */
	samplePhase(request: ScatteringPhaseRequest): PhaseSample;

	/**
	 * Call this method to optionally contribute atmosphere-owned shader source, symbols, and bindings for the active shader build.
	 *
	 * @param request - Supplies direct accepted shader build facts.
	 * @returns - The atmosphere shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}
/** Incoming/outgoing direction pair for phase evaluation. */
type ScatteringPhaseRequest = {
	/** Value that stores the incoming physical direction. */
	incomingDirection: UnitVector3;
	/** Value that stores the evaluated view direction. */
	viewDirection: UnitVector3;
};
/** Medium coefficients sampled at one atmosphere coordinate. */
type AtmosphereSample = {
	/** Value that stores total extinction coefficients. */
	extinction: SpectralExtinctionCoefficientPacket;

	/** Value that stores total scattering coefficients. */
	scattering: SpectralScatteringCoefficientPacket;

	/** Value that stores Rayleigh scattering coefficients. */
	rayleighScattering: SpectralScatteringCoefficientPacket;

	/** Value that stores Mie scattering coefficients. */
	mieScattering: SpectralScatteringCoefficientPacket;

	/** Value that stores Mie extinction coefficients. */
	mieExtinction: SpectralExtinctionCoefficientPacket;

	/** Value that stores absorption coefficients. */
	absorption: SpectralAbsorptionCoefficientPacket;

	/** Value that stores normalized density facts used to derive the coefficients. */
	density: unknown;
};
/** Optical-depth integration output. */
type OpticalDepthSample =
	| Readonly<{
			/** Value that identifies a normally integrated atmosphere path. */
			blockedByGround: false;
			/** Value that stores finite spectral optical depth. */
			opticalDepth: SpectralOpticalDepthPacket;
			/** Value that stores the corresponding finite spectral transmittance. */
			transmittance: SpectralTransmittancePacket;
	  }>
	| Readonly<{
			/** Value that identifies a path obstructed by the ground boundary. */
			blockedByGround: true;
			/** Ground obstruction has no finite atmosphere-only optical depth. */
			opticalDepth: null;
			/** Value that stores zero spectral transmittance for the obstructed path. */
			transmittance: SpectralTransmittancePacket;
	  }>;
/** Phase-function values for one incoming/outgoing direction pair. */
type PhaseSample = {
	/** Value that stores Rayleigh phase value with inverse-solid-angle units. */
	rayleighPhase: InverseSolidAngle;

	/** Value that stores Mie phase value with inverse-solid-angle units. */
	miePhase: InverseSolidAngle;
};
