/**
 * Geometry-model method required by pure scattering-density transport.
 *
 * - **"resolveAtmosphereCoordinate"** - Physical-position to atmosphere-coordinate resolution.
 * - **"expressScatteringCacheDirection"** - Cache-frame to physical-direction conversion.
 */
type PureScatteringDensityTransportGeometryMethod = 'resolveAtmosphereCoordinate' | 'expressScatteringCacheDirection';

/** Type that describes the geometry surface required by pure scattering-density transport. The source owns cache coordinates; geometry owns their physical rays, construction lookup, and direction-frame conversions. */
type PureScatteringDensityTransportGeometry = Pick<GeometryModel, PureScatteringDensityTransportGeometryMethod> &
	Readonly<{
		/**
		 * Call this method to resolve one source-owned cache coordinate into its physical construction ray.
		 *
		 * @param coordinate - Supplies the cache coordinate.
		 * @returns - The construction ray, or null when it has no atmospheric path.
		 */
		resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;
	}>;

/** Type that describes the atmosphere surface required during stored-field transport. */
type PureScatteringDensityTransportAtmosphere = Pick<AtmosphereModel, 'sampleMedium'>;

/** Type that describes the spectral-calculator surface used by the selected endpoint trapezoid transport port. */
type PureScatteringDensityTransportCalculator = Readonly<{
	/**
	 * Call this method to build endpoint-inclusive trapezoidal integration points.
	 *
	 * @param raySegment - Supplies the physical construction ray.
	 * @param pathIntervalCount - Supplies the retained interval option.
	 * @returns - The ordered integration points.
	 */
	buildEndpointTrapezoidPathIntegrationPoints(
		raySegment: RaySegment,
		pathIntervalCount: number,
	): readonly PathIntegrationPoint[];

	/**
	 * Call this method to compute Beer-Lambert transmittance over one trapezoidal path segment.
	 *
	 * @param previousExtinction - Supplies the previous endpoint extinction.
	 * @param currentExtinction - Supplies the current endpoint extinction.
	 * @param intervalLength - Supplies the unit-bearing segment length.
	 * @returns - The spectral segment transmittance.
	 */
	computeTrapezoidSegmentTransmittance(
		previousExtinction: SpectralExtinctionCoefficientPacket,
		currentExtinction: SpectralExtinctionCoefficientPacket,
		intervalLength: Distance,
	): SpectralTransmittancePacket;
}>;

/** Type that resolves a source-owned scattering-density direction stencil. Concrete sources own executable direction mapping; the generic transport operation does not interpret source-specific interpolation metadata. */
type PureScatteringDensityDirectionStencilResolver =
	/**
	 * Called by pure scattering density direction stencil resolver to handle one invocation of the declared operation.
	 * @param direction - The direction value accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (direction: UnitVector3) => ScatteringCacheDirectionStencil;

/** Type that supplies a physical sample to executable construction-position lookup. */
type PureScatteringDensityPositionStencilRequest = Readonly<{
	/** Value that stores the physical position along the construction ray. */
	position: Position;
	/** Value that stores geometry's atmosphere coordinate at the physical position. */
	atmosphereCoordinate: AtmosphereCoordinate;
}>;

/** Type that resolves source-selected executable construction-position taps. */
type PureScatteringDensityPositionStencilResolver =
	/**
	 * Called by pure scattering density position stencil resolver to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: PureScatteringDensityPositionStencilRequest) => ScatteringCachePositionStencil;

/** Type that supplies logical field state to a source-owned build-coordinate resolver. */
type PureScatteringDensityBuildCoordinateRequest = Readonly<{
	/** Value that stores the position-domain index being transported. */
	positionIndex: number;
	/** Value that stores the radiance-direction index being transported. */
	directionIndex: number;
	/** Value that stores the source-owned executable physical position node. */
	positionNode: PositionDomainNode;
	/** Value that stores the geometry-framed physical construction direction. */
	incomingDirection: UnitVector3;
}>;

/** Type that resolves a source-owned cache coordinate without teaching generic transport the concrete source's position-domain meaning. */
type PureScatteringDensityBuildCoordinateResolver =
	/**
	 * Called by pure scattering density build coordinate resolver to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: PureScatteringDensityBuildCoordinateRequest) => CacheBuildCoordinate;

/** Type that supplies logical field state to source-owned physical direction mapping. */
type PureScatteringDensityPhysicalRadianceDirectionRequest = Readonly<{
	/** Value that stores the position-domain index being transported. */
	positionIndex: number;
	/** Value that stores the source-owned executable physical position node. */
	positionNode: PositionDomainNode;
	/** Value that stores the radiance-direction index being transported. */
	directionIndex: number;
	/** Value that stores the source-owned executable radiance direction. */
	cacheDirection: UnitVector3;
}>;

/** Type that resolves a source-owned radiance direction into physical model space. */
type PureScatteringDensityPhysicalRadianceDirectionResolver =
	/**
	 * Called by pure scattering density physical radiance direction resolver to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: PureScatteringDensityPhysicalRadianceDirectionRequest) => UnitVector3;

/** Type that supplies one pure stored scattering-density to radiance transport build. */
type PureScatteringDensityTransportRequest = Readonly<{
	/** Value that stores the sealed pure Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Value that stores the mutable pure Lk output field. */
	outputRadiance: CpuDirectionalSpectralFieldContract;
	/** Value that stores geometry-owned construction and frame operations. */
	geometry: PureScatteringDensityTransportGeometry;
	/** Value that stores atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Value that stores endpoint trapezoid and transmittance operations. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Value that stores the pure scattering order being transported. */
	scatteringOrder: number;
	/** Value that stores source-owned executable position nodes. */
	positionNodes: readonly PositionDomainNode[];
	/** Value that stores the executable number of position nodes. */
	positionCount: number;
	/** Value that stores source-owned executable radiance directions. */
	radianceUnitVectors: readonly UnitVector3[];
	/** Value that stores the executable number of radiance directions. */
	radianceDirectionCount: number;
	/** Value that stores the executable spectral channel count. */
	spectralChannelCount: number;
	/** Value that stores source-selected executable construction-position lookup. */
	resolvePositionStencil: PureScatteringDensityPositionStencilResolver;
	/** Value that stores the source-owned executable scattering-direction lookup. */
	resolveDirectionStencil: PureScatteringDensityDirectionStencilResolver;
	/** Value that stores the source-owned executable cache-coordinate mapping. */
	resolveBuildCoordinate: PureScatteringDensityBuildCoordinateResolver;
	/** Value that stores source-owned radiance-to-physical direction mapping. */
	resolvePhysicalRadianceDirection: PureScatteringDensityPhysicalRadianceDirectionResolver;
	/** Value that stores the selected construction path interval count. */
	pathIntervalCount: number;
	/** Optional callback that reports bounded position progress without changing arithmetic. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/**
 * Active phase of one synchronous CPU cache construction update.
 *
 * - **"primary-scattering"** - Primary scattering-density construction.
 * - **"transport"** - Scattering-density to radiance transport.
 * - **"later-order-scattering"** - Later-order scattering-density construction.
 * - **"accumulation"** - Pure-radiance accumulation into the cumulative field.
 */
type CpuCacheBuildProgressPhase = 'primary-scattering' | 'transport' | 'later-order-scattering' | 'accumulation';

/** Type that describes one synchronous CPU cache construction progress update. */
type CpuCacheBuildProgress = Readonly<{
	/** Value that identifies the active construction phase. */
	phase: CpuCacheBuildProgressPhase;
	/** Value that identifies the pure scattering or radiance order. */
	order: number;
	/** Report the completed executable position count. */
	completed: number;
	/** Report the total executable position count. */
	total: number;
}>;

/** Observe CPU cache construction progress. */
type CpuCacheBuildProgressCallback =
	/**
	 * Called by cpu cache build progress callback to handle one invocation of the declared operation.
	 * @param progress - The progress value accepted by the operation.
	 */ (progress: CpuCacheBuildProgress) => void;

/** Contract that describes the runtime transport contribution surface. */
interface Algorithm32Transport {
	/**
	 * Call this method to return the symbols required by the complete runtime shader main path.
	 * @returns - The result produced by the operation.
	 */
	mainRequiredShaderSymbols(): readonly string[];
	/**
	 * Call this method to create the transport-owned shader contribution.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution;
}

/** Type that describes geometry required by the physical later-order scattering kernel. */
type LaterOrderScatteringGeometry = Pick<GeometryModel, 'resolveAtmosphereCoordinate'>;

/**
 * Atmosphere-model method required by later-order scattering.
 *
 * - **"sampleMedium"** - Local atmospheric-medium sampling.
 * - **"samplePhase"** - Local scattering-phase sampling.
 */
type LaterOrderScatteringAtmosphereMethod = 'sampleMedium' | 'samplePhase';

/** Type that describes atmosphere operations required by later-order scattering. */
type LaterOrderScatteringAtmosphere = Pick<AtmosphereModel, LaterOrderScatteringAtmosphereMethod>;

/** Type that describes phase-weighted spectral scattering calculation. */
type LaterOrderScatteringCalculator = Readonly<{
	/**
	 * Call this method to combine local Rayleigh and Mie coefficients with one phase pair.
	 *
	 * @param rayleighScattering - Supplies spectral Rayleigh coefficients.
	 * @param mieScattering - Supplies spectral Mie coefficients.
	 * @param rayleighPhase - Supplies the Rayleigh phase value.
	 * @param miePhase - Supplies the Mie phase value.
	 * @returns - The phase-weighted spectral scattering coefficients.
	 */
	computeDirectScattering(
		rayleighScattering: SpectralScatteringCoefficientPacket,
		mieScattering: SpectralScatteringCoefficientPacket,
		rayleighPhase: InverseSolidAngle,
		miePhase: InverseSolidAngle,
	): SpectralPhaseWeightedScatteringCoefficientPacket;
}>;

/** Type that supplies one executable position node to source-owned reconstruction. */
type LaterOrderScatteringPositionRequest = Readonly<{
	/** Value that stores the position-domain index. */
	positionIndex: number;
	/** Value that stores the source-owned executable position node. */
	positionNode: PositionDomainNode;
}>;

/** Reconstruct one source-owned position node in physical model space. */
type LaterOrderScatteringPositionResolver =
	/**
	 * Called by later order scattering position resolver to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: LaterOrderScatteringPositionRequest) => Position;

/** Type that supplies one executable direction to source-owned physical mapping. */
type LaterOrderScatteringDirectionRequest = Readonly<{
	/** Value that stores the position-domain index. */
	positionIndex: number;
	/** Value that stores the source-owned executable position node. */
	positionNode: PositionDomainNode;
	/** Value that stores the reconstructed physical position. */
	position: Position;
	/** Value that stores the direction-domain index. */
	directionIndex: number;
	/** Value that stores the source-owned executable direction vector. */
	cacheDirection: UnitVector3;
}>;

/** Express one source-local executable direction in physical model space. */
type LaterOrderScatteringDirectionResolver =
	/**
	 * Called by later order scattering direction resolver to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: LaterOrderScatteringDirectionRequest) => UnitVector3;

/** Type that supplies one source-owned incoming-radiance augmentation at a cache node. */
type LaterOrderIncomingRadianceContributionRequest = Readonly<{
	/** Value that stores the position-domain index. */
	positionIndex: number;
	/** Value that stores the source-owned executable position node. */
	positionNode: PositionDomainNode;
	/** Value that stores the reconstructed physical position. */
	position: Position;
	/** Value that stores the active spectral basis. */
	spectralBasis: SpectralBasis;
	/** Value that stores the executable number of incoming directions. */
	incomingDirectionCount: number;
	/** Value that stores every incoming direction in physical model space. */
	physicalIncomingDirections: readonly UnitVector3[];
	/** Value that stores mutable pure L(k-1) spectra for source-owned augmentation. */
	incomingRadiance: readonly Float64Array[];
}>;

/** Type that adds source-owned physical radiance before generic phase integration. */
type LaterOrderIncomingRadianceContributor =
	/**
	 * Called by later order incoming radiance contributor to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 */ (request: LaterOrderIncomingRadianceContributionRequest) => void;

/** Type that configures the selected physical pure-radiance to pure-scattering kernel. */
type PhysicalLaterOrderScatteringKernelRequest = Readonly<{
	/** Value that stores geometry-owned atmosphere-coordinate mapping. */
	geometry: LaterOrderScatteringGeometry;
	/** Value that stores atmosphere-owned medium and phase sampling. */
	atmosphere: LaterOrderScatteringAtmosphere;
	/** Value that stores phase-weighted spectral coefficient calculation. */
	calculator: LaterOrderScatteringCalculator;
	/** Value that stores the pure scattering order being constructed. */
	scatteringOrder: number;
	/** Value that stores source-owned executable position nodes. */
	positionNodes: readonly PositionDomainNode[];
	/** Value that stores the executable number of positions. */
	positionCount: number;
	/** Value that stores source-owned executable incoming directions. */
	incomingUnitVectors: readonly UnitVector3[];
	/** Value that stores the executable number of incoming directions. */
	incomingDirectionCount: number;
	/** Value that stores executable unit-bearing incoming quadrature weights. */
	incomingIntegrationWeights: SolidAngleWeights;
	/** Value that stores source-owned executable outgoing directions. */
	outgoingUnitVectors: readonly UnitVector3[];
	/** Value that stores the executable number of outgoing directions. */
	outgoingDirectionCount: number;
	/** Value that stores the active executable spectral basis. */
	spectralBasis: SpectralBasis;
	/** Value that stores the executable spectral channel count. */
	spectralChannelCount: number;
	/** Reconstruct one source-owned position in physical model space. */
	resolvePhysicalPosition: LaterOrderScatteringPositionResolver;
	/** Express incoming-radiance directions in physical model space. */
	resolvePhysicalIncomingDirection: LaterOrderScatteringDirectionResolver;
	/** Express outgoing-scattering directions in physical model space. */
	resolvePhysicalOutgoingDirection: LaterOrderScatteringDirectionResolver;
	/** Optional callback that augments incoming radiance through a source-owned operation. */
	contributeIncomingRadiance?: LaterOrderIncomingRadianceContributor;
	/** Optional callback that reports bounded position progress without changing arithmetic. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Type that supplies accepted field readers and writers to the synchronous kernel. */
type LaterOrderScatteringKernelInvocation = Readonly<{
	/** Value that stores the sealed pure L(k-1) reader. */
	previousRadiance: CpuDirectionalSpectralFieldReader;
	/** Value that stores the mutable pure Jk writer. */
	outputScattering: CpuDirectionalSpectralFieldWriter;
}>;
/** Complete borrowed-cache arguments for binary64 positive-column final-view transport. */
type PositiveColumnViewReferenceRequest = Readonly<{
	/** Genuine accepted execution model. */ model: SharedModel;
	/** Accepted atmosphere capability with actual exponential coefficients. */ atmosphere: CanonicalCacheColumnAtmosphere;
	/** Geometry-owned complete physical segment. */ segment: RaySegment;
	/** Accepted endpoint schedule. */ points: readonly PathIntegrationPoint[];
	/** Qualified read-only cumulative CPU field query. */ scatteringCache: CumulativeScatteringDensityCache;
}>;
/** Ordinary execution atmosphere with the accepted Native15 two-exponential view-column capability. */
type PositiveColumnViewAtmosphere = AtmosphereModel & CanonicalCacheColumnAtmosphere;
/** Complete model supplied to shared transport shader assembly. */
type Algorithm32TransportShaderRequest = Readonly<{
	/** Accepted physical, numerical and spectral execution model. */ model: SharedModel;
}>;
/** Shader path-placement policy used by shared transport.
 * - **"uniform-distance"** - Uniform physical-distance endpoints.
 * - **"quadratic-near-observer-v1"** - Qualified Q30 near-observer boundaries.
 * - **"tangent-density-adaptive-v1"** - Full tangent-density endpoint adaptation.
 * - **"tangent-density-adaptive-soft-v1"** - Blended tangent-density endpoint adaptation.
 */
type Algorithm32ViewPathSampleKind =
	| 'uniform-distance'
	| 'quadratic-near-observer-v1'
	| 'tangent-density-adaptive-v1'
	| 'tangent-density-adaptive-soft-v1';
