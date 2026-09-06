/**
 * Describe the geometry surface required by pure scattering-density
 * transport. The source owns cache coordinates; geometry owns their physical
 * rays, construction lookup, and direction-frame conversions.
 */
type PureScatteringDensityTransportGeometry = Pick<
	GeometryModel,
	| "resolveAtmosphereCoordinate"
	| "expressScatteringCacheDirection"
> & Readonly<{
	/**
	 * Resolve one source-owned cache coordinate into its physical construction
	 * ray.
	 *
	 * @param coordinate - Supplies the cache coordinate.
	 * @returns The construction ray, or null when it has no atmospheric path.
	 */
	resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;
}>;

/** Describe the atmosphere surface required during stored-field transport. */
type PureScatteringDensityTransportAtmosphere = Pick<
	AtmosphereModel,
	"sampleMedium"
>;

/**
 * Describe the spectral-calculator surface used by the selected endpoint
 * trapezoid transport port.
 */
type PureScatteringDensityTransportCalculator = Readonly<{
	/**
	 * Build endpoint-inclusive trapezoidal integration points.
	 *
	 * @param raySegment - Supplies the physical construction ray.
	 * @param pathIntervalCount - Supplies the retained interval control.
	 * @returns The ordered integration points.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(
		raySegment: RaySegment,
		pathIntervalCount: number,
	): readonly PathIntegrationPoint[];

	/**
	 * Compute Beer-Lambert transmittance over one trapezoidal path segment.
	 *
	 * @param previousExtinction - Supplies the previous endpoint extinction.
	 * @param currentExtinction - Supplies the current endpoint extinction.
	 * @param intervalLength - Supplies the unit-bearing segment length.
	 * @returns The spectral segment transmittance.
	 */
	computeTrapezoidSegmentTransmittance(
		previousExtinction: SpectralExtinctionCoefficientPacket,
		currentExtinction: SpectralExtinctionCoefficientPacket,
		intervalLength: Distance,
	): SpectralTransmittancePacket;
}>;

/**
 * Resolve a source-owned scattering-density direction stencil. Concrete
 * sources own executable direction mapping; the generic transport operation
 * does not interpret descriptor interpolation metadata.
 */
type PureScatteringDensityDirectionStencilResolver = (
	direction: UnitVector3,
) => ScatteringCacheDirectionStencil;

/** Supply a physical sample to executable construction-position lookup. */
type PureScatteringDensityPositionStencilRequest = Readonly<{
	/** Store the physical position along the construction ray. */
	position: Position;
	/** Store geometry's atmosphere coordinate at the physical position. */
	atmosphereCoordinate: AtmosphereCoordinate;
}>;

/** Resolve source-selected executable construction-position taps. */
type PureScatteringDensityPositionStencilResolver = (
	request: PureScatteringDensityPositionStencilRequest,
) => ScatteringCachePositionStencil;

/** Supply logical field state to a source-owned build-coordinate resolver. */
type PureScatteringDensityBuildCoordinateRequest = Readonly<{
	/** Store the position-domain index being transported. */
	positionIndex: number;
	/** Store the radiance-direction index being transported. */
	directionIndex: number;
	/** Store the source-owned executable physical position node. */
	positionNode: PositionDomainNode;
	/** Store the geometry-framed physical construction direction. */
	incomingDirection: UnitVector3;
}>;

/**
 * Resolve a source-owned cache coordinate without teaching generic transport
 * the concrete source's position-domain meaning.
 */
type PureScatteringDensityBuildCoordinateResolver = (
	request: PureScatteringDensityBuildCoordinateRequest,
) => CacheBuildCoordinate;

/** Supply logical field state to source-owned physical direction mapping. */
type PureScatteringDensityPhysicalRadianceDirectionRequest = Readonly<{
	/** Store the position-domain index being transported. */
	positionIndex: number;
	/** Store the source-owned executable physical position node. */
	positionNode: PositionDomainNode;
	/** Store the radiance-direction index being transported. */
	directionIndex: number;
	/** Store the source-owned executable radiance direction. */
	cacheDirection: UnitVector3;
}>;

/** Resolve a source-owned radiance direction into physical model space. */
type PureScatteringDensityPhysicalRadianceDirectionResolver = (
	request: PureScatteringDensityPhysicalRadianceDirectionRequest,
) => UnitVector3;

/** Supply one pure stored scattering-density to radiance transport build. */
type PureScatteringDensityTransportRequest = Readonly<{
	/** Store the sealed pure Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Store the mutable pure Lk output field. */
	outputRadiance: CpuDirectionalSpectralFieldContract;
	/** Store geometry-owned construction and frame operations. */
	geometry: PureScatteringDensityTransportGeometry;
	/** Store atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Store endpoint trapezoid and transmittance operations. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Store the pure scattering order being transported. */
	scatteringOrder: number;
	/** Store source-owned executable position nodes. */
	positionNodes: readonly PositionDomainNode[];
	/** Store the executable number of position nodes. */
	positionCount: number;
	/** Store source-owned executable radiance directions. */
	radianceUnitVectors: readonly UnitVector3[];
	/** Store the executable number of radiance directions. */
	radianceDirectionCount: number;
	/** Store the executable spectral channel count. */
	spectralChannelCount: number;
	/** Store source-selected executable construction-position lookup. */
	resolvePositionStencil: PureScatteringDensityPositionStencilResolver;
	/** Store the source-owned executable scattering-direction lookup. */
	resolveDirectionStencil: PureScatteringDensityDirectionStencilResolver;
	/** Store the source-owned executable cache-coordinate mapping. */
	resolveBuildCoordinate: PureScatteringDensityBuildCoordinateResolver;
	/** Store source-owned radiance-to-physical direction mapping. */
	resolvePhysicalRadianceDirection:
		PureScatteringDensityPhysicalRadianceDirectionResolver;
	/** Store the selected construction path interval count. */
	pathIntervalCount: number;
	/** Optionally report bounded position progress without changing arithmetic. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Describe one synchronous CPU cache construction progress update. */
type CpuCacheBuildProgress = Readonly<{
	/** Identify the active construction phase. */
	phase: "primary-scattering" | "transport" | "later-order-scattering" | "accumulation";
	/** Identify the pure scattering or radiance order. */
	order: number;
	/** Report the completed executable position count. */
	completed: number;
	/** Report the total executable position count. */
	total: number;
}>;

/** Observe CPU cache construction progress. */
type CpuCacheBuildProgressCallback = (
	progress: CpuCacheBuildProgress,
) => void;

/** Describe the runtime transport contribution surface. */
interface Algorithm32Transport {
	/** Return the symbols required by the complete runtime shader main path. */
	mainRequiredShaderSymbols(): readonly string[];
	/** Create the transport-owned shader contribution. */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution;
}

/** Describe geometry required by the physical later-order scattering kernel. */
type LaterOrderScatteringGeometry = Pick<
	GeometryModel,
	"resolveAtmosphereCoordinate"
>;

/** Describe atmosphere operations required by later-order scattering. */
type LaterOrderScatteringAtmosphere = Pick<
	AtmosphereModel,
	"sampleMedium" | "samplePhase"
>;

/** Describe phase-weighted spectral scattering calculation. */
type LaterOrderScatteringCalculator = Readonly<{
	/**
	 * Combine local Rayleigh and Mie coefficients with one phase pair.
	 *
	 * @param rayleighScattering - Supplies spectral Rayleigh coefficients.
	 * @param mieScattering - Supplies spectral Mie coefficients.
	 * @param rayleighPhase - Supplies the Rayleigh phase value.
	 * @param miePhase - Supplies the Mie phase value.
	 * @returns The phase-weighted spectral scattering coefficients.
	 */
	computeDirectScattering(
		rayleighScattering: SpectralScatteringCoefficientPacket,
		mieScattering: SpectralScatteringCoefficientPacket,
		rayleighPhase: InverseSolidAngle,
		miePhase: InverseSolidAngle,
	): SpectralPhaseWeightedScatteringCoefficientPacket;
}>;

/** Supply one executable position node to source-owned reconstruction. */
type LaterOrderScatteringPositionRequest = Readonly<{
	/** Store the position-domain index. */
	positionIndex: number;
	/** Store the source-owned executable position node. */
	positionNode: PositionDomainNode;
}>;

/** Reconstruct one source-owned position node in physical model space. */
type LaterOrderScatteringPositionResolver = (
	request: LaterOrderScatteringPositionRequest,
) => Position;

/** Supply one executable direction to source-owned physical mapping. */
type LaterOrderScatteringDirectionRequest = Readonly<{
	/** Store the position-domain index. */
	positionIndex: number;
	/** Store the source-owned executable position node. */
	positionNode: PositionDomainNode;
	/** Store the reconstructed physical position. */
	position: Position;
	/** Store the direction-domain index. */
	directionIndex: number;
	/** Store the source-owned executable direction vector. */
	cacheDirection: UnitVector3;
}>;

/** Express one source-local executable direction in physical model space. */
type LaterOrderScatteringDirectionResolver = (
	request: LaterOrderScatteringDirectionRequest,
) => UnitVector3;

/** Supply one source-owned incoming-radiance augmentation at a cache node. */
type LaterOrderIncomingRadianceContributionRequest = Readonly<{
	/** Store the position-domain index. */
	positionIndex: number;
	/** Store the source-owned executable position node. */
	positionNode: PositionDomainNode;
	/** Store the reconstructed physical position. */
	position: Position;
	/** Store the active spectral basis. */
	spectralBasis: SpectralBasis;
	/** Store the executable number of incoming directions. */
	incomingDirectionCount: number;
	/** Store every incoming direction in physical model space. */
	physicalIncomingDirections: readonly UnitVector3[];
	/** Store mutable pure L(k-1) spectra for source-owned augmentation. */
	incomingRadiance: readonly Float64Array[];
}>;

/** Add source-owned physical radiance before generic phase integration. */
type LaterOrderIncomingRadianceContributor = (
	request: LaterOrderIncomingRadianceContributionRequest,
) => void;

/** Configure the selected physical pure-radiance to pure-scattering kernel. */
type PhysicalLaterOrderScatteringKernelRequest = Readonly<{
	/** Store geometry-owned atmosphere-coordinate mapping. */
	geometry: LaterOrderScatteringGeometry;
	/** Store atmosphere-owned medium and phase sampling. */
	atmosphere: LaterOrderScatteringAtmosphere;
	/** Store phase-weighted spectral coefficient calculation. */
	calculator: LaterOrderScatteringCalculator;
	/** Store the pure scattering order being constructed. */
	scatteringOrder: number;
	/** Store source-owned executable position nodes. */
	positionNodes: readonly PositionDomainNode[];
	/** Store the executable number of positions. */
	positionCount: number;
	/** Store source-owned executable incoming directions. */
	incomingUnitVectors: readonly UnitVector3[];
	/** Store the executable number of incoming directions. */
	incomingDirectionCount: number;
	/** Store executable unit-bearing incoming quadrature weights. */
	incomingIntegrationWeights: SolidAngleWeights;
	/** Store source-owned executable outgoing directions. */
	outgoingUnitVectors: readonly UnitVector3[];
	/** Store the executable number of outgoing directions. */
	outgoingDirectionCount: number;
	/** Store the active executable spectral basis. */
	spectralBasis: SpectralBasis;
	/** Store the executable spectral channel count. */
	spectralChannelCount: number;
	/** Reconstruct one source-owned position in physical model space. */
	resolvePhysicalPosition: LaterOrderScatteringPositionResolver;
	/** Express incoming-radiance directions in physical model space. */
	resolvePhysicalIncomingDirection: LaterOrderScatteringDirectionResolver;
	/** Express outgoing-scattering directions in physical model space. */
	resolvePhysicalOutgoingDirection: LaterOrderScatteringDirectionResolver;
	/** Optionally augment incoming radiance through a source-owned operation. */
	contributeIncomingRadiance?: LaterOrderIncomingRadianceContributor;
	/** Optionally report bounded position progress without changing arithmetic. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Supply accepted field readers and writers to the synchronous kernel. */
type LaterOrderScatteringKernelInvocation = Readonly<{
	/** Store the sealed pure L(k-1) reader. */
	previousRadiance: CpuDirectionalSpectralFieldReader;
	/** Store the mutable pure Jk writer. */
	outputScattering: CpuDirectionalSpectralFieldWriter;
}>;
