/** Type that supplies construction dependencies for the shared spectral calculator. */
type SpectralCalculatorDependencies =
	| Readonly<{
			/** Aggregate model that owns the accepted execution profile and components. */ model: SharedModel;
			/** Full execution models already own their accepted basis. */ spectralBasis?: never;
	  }>
	| Readonly<{
			/** Basis-only arithmetic has no execution model. */ model?: never;
			/** Genuine basis for source-neutral packet and phase arithmetic. */ spectralBasis: SpectralBasis;
	  }>;

/**
 * Spectral-calculator method shared by direct-primary radiance builders.
 *
 * - **"buildEndpointTrapezoidPathIntegrationPoints"** - Endpoint-inclusive trapezoidal path sampling.
 * - **"computeDirectRadiance"** - Direct source-radiance integration along the sampled path.
 */
type PrimaryRadianceCalculatorMethod = 'buildEndpointTrapezoidPathIntegrationPoints' | 'computeDirectRadiance';

/** Contract that describes the shared spectral-calculation surface consumed across Algorithm32. The implementation class satisfies this ambient contract; consumers name it directly without importing a declaration-only type. */
interface SpectralCalculator {
	/** Value that stores the accepted calculation dependencies. */
	readonly dependencies: Readonly<SpectralCalculatorDependencies>;

	/**
	 * Call this method to build endpoint/trapezoid integration points for a finite ray segment.
	 * @param viewRaySegment - The view ray segment value accepted by the operation.
	 * @param pathIntervalCount - The path interval count value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(
		viewRaySegment: RaySegment,
		pathIntervalCount: number,
	): readonly PathIntegrationPoint[];

	/** Build quadratic-boundary midpoint points for the qualified distant-Sun view path. */
	buildQuadraticMidpointPathIntegrationPoints(
		viewRaySegment: RaySegment,
		pathIntervalCount: number,
	): readonly PathIntegrationPoint[];

	/**
	 * Call this method to compute source-path transmittance from finite source optical depth.
	 * @param sourceOpticalDepth - The source optical depth value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	computeSourceTransmittance(sourceOpticalDepth: SpectralOpticalDepthPacket): SpectralTransmittancePacket;

	/**
	 * Call this method to compute endpoint/trapezoid transmittance for one path interval.
	 * @param previousExtinction - The previous extinction value accepted by the operation.
	 * @param currentExtinction - The current extinction value accepted by the operation.
	 * @param intervalLength - The interval length value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	computeTrapezoidSegmentTransmittance(
		previousExtinction: SpectralExtinctionCoefficientPacket,
		currentExtinction: SpectralExtinctionCoefficientPacket,
		intervalLength: Distance,
	): SpectralTransmittancePacket;

	/**
	 * Call this method to combine scattering coefficients with their phase values.
	 * @param rayleighScattering - The rayleigh scattering value accepted by the operation.
	 * @param mieScattering - The mie scattering value accepted by the operation.
	 * @param rayleighPhase - The rayleigh phase value accepted by the operation.
	 * @param miePhase - The mie phase value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	computeDirectScattering(
		rayleighScattering: SpectralScatteringCoefficientPacket,
		mieScattering: SpectralScatteringCoefficientPacket,
		rayleighPhase: InverseSolidAngle,
		miePhase: InverseSolidAngle,
	): SpectralPhaseWeightedScatteringCoefficientPacket;

	/**
	 * Call this method to compute direct source in-scattering for one path point.
	 * @param viewTransmittance - The view transmittance value accepted by the operation.
	 * @param sourceTransmittance - The source transmittance value accepted by the operation.
	 * @param sourceIrradiance - The source irradiance value accepted by the operation.
	 * @param scattering - The scattering value accepted by the operation.
	 * @param measure - The measure value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	computeDirectInScattering(
		viewTransmittance: SpectralTransmittancePacket,
		sourceTransmittance: SpectralTransmittancePacket,
		sourceIrradiance: SpectralIrradiancePacket,
		scattering: SpectralPhaseWeightedScatteringCoefficientPacket,
		measure: Distance,
	): SpectralRadiancePacket;

	/**
	 * Call this method to compute source-owned direct-primary radiance for cache construction.
	 * @param viewRaySegment - The view ray segment value accepted by the operation.
	 * @param pathIntegrationPoints - The path integration points value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	computeDirectRadiance(
		viewRaySegment: RaySegment,
		pathIntegrationPoints: readonly PathIntegrationPoint[],
	): PathRadiance;

	/**
	 * Call this method to integrate cumulative local scattering density over a view ray.
	 * @param viewRaySegment - The view ray segment value accepted by the operation.
	 * @param pathIntegrationPoints - The path integration points value accepted by the operation.
	 * @param options - The optional operation choices.
	 * @returns - The result produced by the operation.
	 */
	computeRadiance(
		viewRaySegment: RaySegment,
		pathIntegrationPoints: readonly PathIntegrationPoint[],
		options: ComputeRadianceOptions,
	): PathRadiance;
}

/** Type that stores one endpoint/trapezoid path integration point. */
type PathIntegrationPoint = {
	/** Numerical interpretation of this sample. */
	readonly integrationKind?: 'endpoint-trapezoid' | 'quadratic-midpoint';
	/** Value that stores the point index along the path. */
	readonly pointIndex: number;

	/** Value that stores distance along the ray. */
	readonly distanceAlongRay: Distance;

	/** Value that stores interval length from the previous point. */
	readonly intervalLengthFromPrevious: Distance;

	/** Value that stores endpoint/trapezoid weight. */
	readonly trapezoidWeight: number;

	/** Value that stores effective path measure represented by this point. */
	readonly measure: Distance;
};

/** Type that stores spectral radiance computed along one path. */
type PathRadiance = {
	/** Value that stores path-added spectral radiance. */
	readonly pathRadiance: SpectralRadiancePacket;

	/** Value that stores final view-path transmittance. */
	readonly transmittance: SpectralTransmittancePacket;

	/** Value that stores optional implementation diagnostics for tests and future tooling. */
	readonly diagnostics?: unknown;
};

/** Type that stores the cumulative cache required for one reference radiance computation. */
type ComputeRadianceOptions = {
	/** Value that stores the resident cumulative CPU cache to sample. */
	readonly scatteringCache: CpuScatteringCache;
};
