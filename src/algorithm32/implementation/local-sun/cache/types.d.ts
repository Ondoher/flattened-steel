/** Geometry-owned physical coordinates and compact node/reconstruction support required by the cache. */
interface LocalSunCompactReconstructionGeometry extends Pick<
	GeometryModel,
	'resolveAtmosphereCoordinate' | 'resolveSourceRelativePosition'
> {
	/**
	 * Call this method to resolve complete physical compact support.
	 * @param request - Physical query with paired topology.
	 * @returns - Positive spatial taps with per-tap angular support; unsupported input throws.
	 */
	resolveCompactLocalSunCacheStencil(
		request: FlatCompactReconstructionRequest,
	): readonly FlatCompactReconstructionTap[];
	/**
	 * Call this method to place an allocated node in the canonical source meridian.
	 * @param request - Paired topology and allocated index.
	 * @returns - Physical node position; unsupported pairing/address throws.
	 */
	resolveCompactLocalSunCacheNodePosition(request: FlatCompactNodePositionRequest): Position;
}

/** Fixed collaborators for geometric-density interpolation, without changes to their physical models. */
type LocalSunCompactReconstructionDefinition = Readonly<{
	/** Geometry-owned coordinates and compact support. */ geometry: LocalSunCompactReconstructionGeometry;
	/** Structural compact domain paired with the geometry height/slab. */ topology: FlatCompactTopology;
	/** Existing Native15 medium owner; positive extinction is required. */ atmosphere: Pick<
		AtmosphereModel,
		'spectralBasis' | 'sampleMedium'
	>;
}>;

/** Positive spatial/angular support with dimensionless spectral restoration ratios. */
type LocalSunCompactSpectralTap = FlatCompactReconstructionTap &
	Readonly<{
		/** Native15 query/node factor ratios; these are never normalized as interpolation weights. */ spectralScales: readonly number[];
	}>;

/** Physical J query with a read-only field collaborator and retained parent provenance. */
type LocalSunCompactDensitySampleRequest = ScatteringCacheDirectionRequest &
	Readonly<{
		/** Stored physical scattering-density reader; no normalized or radiance samples. */ reader: Pick<
			CpuDirectionalSpectralFieldReader,
			'readScalar'
		>;
		/** Original physical field identity propagated to the reconstructed packet. */ provenanceIdentity: string;
	}>;

/** Existing physical owners plus geometry-owned compact ray capability. */
type LocalSunCompactTransportDefinition = Readonly<{
	/** Complete compact coordinate/ray owner. */ geometry: LocalSunCompactReconstructionGeometry &
		Readonly<{
			/** Call this method to resolve a closed physical compact ray. @param request - Paired support and physical ray. @returns - Supported geometry-owned ray. */
			resolveCompactLocalSunCacheRay(request: FlatCompactRayRequest): FlatCompactRay;
		}>;
	/** Geometry-paired structural topology. */ topology: FlatCompactTopology;
	/** Existing Native15 two-exponential physical medium. */ atmosphere: CanonicalCacheColumnAtmosphere;
}>;
/** Physical selected-ray request, before geometry resolves bounds. */
type LocalSunCompactTransportRayRequest = Omit<FlatCompactRayRequest, 'topology'>;
/** Physical read-only scattering-density input and original identity. */
type LocalSunCompactTransportRequest = LocalSunCompactTransportRayRequest &
	Pick<LocalSunCompactDensitySampleRequest, 'reader' | 'provenanceIdentity'>;
/** Cache policy plan with distinct full-ray and per-channel retained-prefix semantics. */
type LocalSunCompactTransportRayPlan = Readonly<{
	/** Actual executable numerical policy. */ policyId: string;
	/** Closed geometry-owned physical ray. */ ray: FlatCompactRay;
	/** Native15 ordered prefixes. */ channels: readonly Readonly<{
		/** Physical retained prefix length. */ retainedLength: Distance;
		/** True only when the prefix reaches the full geometry ray endpoint. */ physicalEnd: boolean;
		/** Closed ordered 49 physical distances. */ distances: readonly Distance[];
	}>[];
}>;
/** Physical transported radiance plus transmittance to each retained prefix, not necessarily the full physical ray. */
type LocalSunCompactTransportResult = Readonly<{
	/** Complete qualified ray selection. */ plan: LocalSunCompactTransportRayPlan;
	/** Physical spectral radiance. */ radiance: SpectralPacket;
	/** Dimensionless retained-prefix transmittance. */ transmittance: SpectralPacket;
}>;

/** Physical local-Sun facade consumed by cache construction. */
type LocalSunCacheProviderSource = LightSourceModel &
	LocalSunConstructionContinuousSource &
	Readonly<{
		/** Complete normalized source configuration retained by the facade. */
		readonly configuration: LocalSunLightSourceConfiguration;
	}>;

/** Constructor values for a local-Sun cache provider. */
type LocalSunCacheProviderDefinition = Readonly<{
	/** Physical source facade retained for continuous-lighting dispatch. */
	readonly source: LocalSunCacheProviderSource;
	/** Normalized source configuration retained by reference. */
	readonly configuration: LocalSunLightSourceConfiguration;
	/** Explicit geometry-derived amplitude support; omission retains the named ordinary Flat32 control domain. */
	readonly sourceDistanceBounds?: SourceDistanceBounds;
}>;

/**
 * Source-configuration properties retained by local-Sun shell facts.
 *
 * - **"position"** - Physical finite-source position.
 * - **"referenceDistance"** - Distance at which incident scaling is calibrated.
 * - **"referenceSpectralIncidentScale"** - Spectral incident scale at the reference distance.
 * - **"radius"** - Physical finite-source radius.
 * - **"distanceFalloff"** - Accepted inverse-square falloff selection.
 */
type LocalSunShellFactSourceConfigurationProperty =
	'position' | 'referenceDistance' | 'referenceSpectralIncidentScale' | 'radius' | 'distanceFalloff';

/** Normalized source facts used to derive fixed shell facts. */
type LocalSunShellFactSourceConfiguration = Pick<
	LocalSunLightSourceConfiguration,
	LocalSunShellFactSourceConfigurationProperty
>;

/** Construction data for one fixed source-paired shell-fact owner. */
type LocalSunShellFactCacheConfiguration = Readonly<{
	/** Normalized physical source facts. */
	readonly sourceConfiguration: LocalSunShellFactSourceConfiguration;
	/** Explicit source-centered physical support; outside lookup rejects instead of clamping. Omission retains the existing production control. */
	readonly sourceDistanceBounds?: SourceDistanceBounds;
}>;

/** Resolved containing shell. */
type LocalSunResolvedShell = Readonly<{
	/** Higher-boundary-owned shell index. */
	readonly shellIndex: number;
	/** Precomputed held incident scale. */
	readonly heldIncidentScale: number;
	/** Accepted or clamped source distance. */
	readonly distanceFromSource: Distance;
	/** Requested-distance clamping state. */
	readonly clamped: boolean;
}>;

/** Retained binary64 payload owned by the shell-fact cache. */
type LocalSunShellFactResourceUsage = Readonly<{
	/** Ordered boundary storage. */
	readonly boundaries: UnitValue<'bytes'>;
	/** Held incident-scale storage. */
	readonly heldIncidentScales: UnitValue<'bytes'>;
	/** Complete retained binary64 payload. */
	readonly total: UnitValue<'bytes'>;
}>;

/** Fixed N=2048 local-Sun shell facts. */
interface LocalSunShellFactCache {
	/** Executable shell-fact owner identity. */
	readonly id: string;
	/** Executable shell count. */
	readonly shellCount: number;
	/** Executable boundary count. */
	readonly boundaryCount: number;
	/** Executable lower clamp. */
	readonly minimumDistance: Distance;
	/** Executable upper clamp. */
	readonly maximumDistance: Distance;
	/** Independent copy of ordered binary64 boundaries. */
	readonly boundaries: Float64Array;
	/** Independent copy of binary64 held incident scales. */
	readonly heldIncidentScales: Float64Array;
	/** Retained binary64 payload without mutable storage exposure. */
	readonly resourceUsage: LocalSunShellFactResourceUsage;
	/**
	 * Call this method to resolve one finite source distance to its containing shell.
	 * @param distanceFromSourceMeters - The distance from source meters value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveShell(distanceFromSourceMeters: number): LocalSunResolvedShell;
}

/** Physical local-Sun contract required by J1 construction. */
type LocalSunConstructionContinuousSource = Readonly<{
	/** Unique identifier for the configured physical source. */
	readonly id: string;
	/** Normalized physical facts used to scale spectral irradiance. */
	readonly configuration: Pick<LocalSunLightSourceConfiguration, 'sourceIrradiance'>;
	/**
	 * Call this method to sample continuous direct lighting at one physical position.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	sampleDirectLighting(request?: object): DirectLightingSample;
	/**
	 * Call this method to resolve the finite source path limit.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveSourcePathLimit(request: unknown): SourcePathLimit;
	/**
	 * Call this method to create the physical source's cache controller.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createCacheController(request: CacheControllerRequest): CacheController;
}>;

/** Continuous source and shell facts for one construction-only local-Sun adapter. */
type LocalSunConstructionLightSourceDefinition = Readonly<{
	/** Continuous physical source. */
	readonly source: LocalSunConstructionContinuousSource;
	/** Source-paired executable shell facts. */
	readonly shellFactCache: LocalSunShellFactCache;
}>;

/** Executable scalar-storage dimensions for one local-Sun field. */
type LocalSunFieldPackingDefinition = Readonly<{
	/** Unique identifier for the packing. */
	id: string;
	/** Number of directions. */
	directionCount: number;
	/** Number of flattened positions. */
	positionCount: number;
	/** Number of spectral channels. */
	wavelengthCount: number;
}>;

/** Executable scalar packing for one local-Sun field. */
interface LocalSunFieldPacking extends DirectionalSpectralFieldPacking {
	/** Contract kind for local-Sun field packing. */
	readonly kind: 'local-sun-field-packing';
	/** Unique identifier for the packing. */
	readonly id: string;
	/** Number of directions. */
	readonly directionCount: number;
	/** Number of positions. */
	readonly positionCount: number;
	/** Number of wavelengths. */
	readonly wavelengthCount: number;
	/** Number of packed scalars. */
	readonly scalarCount: number;
	/**
	 * Call this method to recover logical coordinates from an offset.
	 * @param offset - The offset value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Geometry-owned executable flattened z-by-rho position domain. */
type LocalSunPositionDomainOwner = Readonly<{
	/** Unique identifier for the executable position domain. */
	id: string;
	/** Z-major, rho-fast flattened position nodes. */
	nodes: readonly PositionDomainNode[];
	/** Ordered altitude nodes. */
	zNodes: readonly Distance[];
	/** Ordered radial nodes. */
	rhoNodes: readonly Distance[];
	/** Number of altitude nodes. */
	zCount: number;
	/** Number of radial nodes. */
	rhoCount: number;
	/** Number of flattened position nodes. */
	count: number;
}>;

/** Supported Fibonacci incoming quadrature owners for local-Sun construction and diagnostics. */
type LocalSunIncomingDirectionDomain =
	Fibonacci34DirectionDomain | PairedFibonacci34DirectionDomain | PairedRotatedFibonacci68DirectionDomain;

/** Executable owners and identities for one local-Sun construction-domain selection. */
type LocalSunConstructionDomainSelectionDefinition = Readonly<{
	/** Unique identifier for the coherent domain selection. */
	id: string;
	/** Geometry-owned executable z-by-rho position domain. */
	positionDomainOwner: LocalSunPositionDomainOwner;
	/** Executable incoming Fibonacci direction domain. */
	incomingDirectionDomainOwner: LocalSunIncomingDirectionDomain;
	/** Executable outgoing cubed-sphere direction domain. */
	outgoingDirectionDomainOwner: CubedSphereDirectionDomain;
	/** Spectral basis for every construction field. */
	spectralBasis: SpectralBasis;
	/** Unique identifier for incoming-radiance packing. */
	radiancePackingId: string;
	/** Unique identifier for outgoing scattering-density packing. */
	scatteringDensityPackingId: string;
}>;

/** Coherent executable local-Sun construction-domain selection. */
interface LocalSunConstructionDomainSelection {
	/** Contract kind for a local-Sun construction-domain selection. */
	readonly kind: 'local-sun-construction-domain-selection';
	/** Unique identifier for the coherent domain selection. */
	readonly id: string;
	/** Executable position domain. */
	readonly positionDomain: LocalSunPositionDomainOwner;
	/** Executable z-major, rho-fast flattened positions. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Executable altitude nodes. */
	readonly zNodes: readonly Distance[];
	/** Executable radial nodes. */
	readonly rhoNodes: readonly Distance[];
	/** Number of altitude nodes. */
	readonly zCount: number;
	/** Number of radial nodes. */
	readonly rhoCount: number;
	/** Number of flattened position nodes. */
	readonly positionCount: number;
	/** Executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Number of executable spectral channels. */
	readonly spectralChannelCount: number;
	/** Executable incoming-direction domain. */
	readonly incomingDirectionDomain: LocalSunIncomingDirectionDomain;
	/** Executable Fibonacci unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Executable Fibonacci solid-angle weights. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Number of executable incoming directions. */
	readonly incomingDirectionCount: number;
	/** Executable outgoing-direction domain. */
	readonly outgoingDirectionDomain: CubedSphereDirectionDomain;
	/** Executable cubed-sphere outgoing unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Number of executable outgoing directions. */
	readonly outgoingDirectionCount: number;
	/** Executable positive-axis face-center addresses. */
	readonly outgoingPositiveFaceCenterIndices: CubedSpherePositiveFaceCenterIndices;
	/** Executable incoming-radiance packing. */
	readonly radiancePacking: LocalSunFieldPacking;
	/** Executable outgoing scattering-density packing. */
	readonly scatteringDensityPacking: LocalSunFieldPacking;
	/**
	 * Call this method to resolve one source-local outgoing direction into W-domain taps.
	 * @param direction - The direction value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

/** Optional convergence-domain overrides for a local-Sun construction selection. */
type LocalSunConstructionDomainGeometryOptions = Readonly<{
	/** Optional altitude-node count. */
	zCount?: number;
	/** Optional radial-node count. */
	rhoCount?: number;
	/** Optional selection identifier. */
	id?: string;
	/** Optional incoming Fibonacci direction-domain owner. */
	incomingDirectionDomainOwner?: LocalSunIncomingDirectionDomain;
	/** Optional outgoing direction-domain owner. */
	outgoingDirectionDomainOwner?: CubedSphereDirectionDomain;
	/** Optional construction spectral basis. */
	spectralBasis?: SpectralBasis;
	/** Optional incoming-radiance packing identifier. */
	radiancePackingId?: string;
	/** Optional outgoing scattering-density packing identifier. */
	scatteringDensityPackingId?: string;
}>;

/** Geometry contract capable of constructing the local position domain. */
type LocalSunConstructionDomainGeometry = Readonly<{
	/**
	 * Call this method to create geometry-owned z-by-rho nodes.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createLocalSunCachePositionDomain(request?: FlatLocalCachePositionDomainRequest): LocalSunPositionDomainOwner;
}>;

/** Flat-geometry capabilities required by local-Sun GPU construction. */
type LocalSunCacheBuildGeometry = GeometryModel &
	CacheBuildContributor &
	LocalSunConstructionDomainGeometry &
	Readonly<{
		/** Accepted flat physical configuration. */
		configuration: FlatEarthGeometryConfiguration;
	}>;

/** Local source contribution with privately owned shell facts. */
type LocalSunCacheBuildSource = CacheBuildContributor &
	Readonly<{
		/** Normalized physical source facts. */
		configuration: LocalSunLightSourceConfiguration;
		/**
		 * Call this method to report source facts, uploads, zero packed-transport accounting, and executor storage.
		 * @param plan - The plan value accepted by the operation.
		 * @param diagnostics - The diagnostics value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */
		createResourceReport(plan: LocalSunCachePlan, diagnostics: CacheBuildDiagnostics): LocalSunCacheResourceReport;
	}>;

/** Construction owners retained by one local-Sun GPU cache source. */
type LocalSunCacheSourceDefinition = Readonly<{
	/** Physical source exposing its normalized configuration. */
	source: Pick<LocalSunCacheProviderSource, 'configuration'>;
	/** Source-paired fixed shell facts. */
	shellFactCache: LocalSunShellFactCache;
}>;

/** Source-owned logical payloads attached to a local build plan. */
type LocalSunCachePlanResourceFacts = Readonly<{
	/** Production Flat transport payload, fixed at zero bytes for every supported graph. */
	readonly packedTransportData: UnitValue<'bytes'>;
}>;

/** Generic executable graph extended with local source resource facts. */
type LocalSunCachePlan = CacheBuildPlan &
	Readonly<{
		/** Typed resource facts independent of module-binding reconstruction. */
		readonly resources: LocalSunCachePlanResourceFacts;
	}>;

/** Actual local-Sun construction and completed-cache payloads. */
type LocalSunCacheResourceReport = Readonly<{
	/** Retained binary64 source facts. */
	readonly sourceFacts: LocalSunShellFactResourceUsage;
	/** Primary-J1 boundary texture payload. */
	readonly boundaryTexture: UnitValue<'bytes'>;
	/** Production Flat transport payload, fixed at zero bytes. */
	readonly packedTransportData: UnitValue<'bytes'>;
	/** Observed executor field and packed-data peaks and residency. */
	readonly executor: CacheBuildMemoryDiagnostics;
}>;

/** Physical owners and options for one controller-derived local-Sun GPU build graph. */
type LocalSunCacheControllerPlanRequest = Readonly<{
	/** Medium, phase, extinction, and transmittance contributor. */
	atmosphere: AtmosphereModel & CacheBuildContributor;
	/** Flat positions, frames, bounds, directions, and integrated-transport geometry contributor. */
	geometry: LocalSunCacheBuildGeometry;
	/** Optional reflective boundary; omission selects canonical black ground. */
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
	/** Requested N1, N2, or N4 graph maximum. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Optional non-production lattice for an internal diagnostic build. */
	domainSelection?: LocalSunConstructionDomainSelection;
}>;

/** Construction collaborators for one local-Sun GPU cache controller. */
type LocalSunCacheControllerConfiguration = Readonly<{
	/** Aggregate execution model retained for the controller lifetime. */
	model: SharedModel;
	/** Configured local-Sun cache contributor. */
	source: LocalSunCacheBuildSource;
	/** Externally owned GPU backend. */
	backend: CacheGpuBackend;
	/** Optional cache-build scheduler. */
	scheduler?: CacheBuildScheduler;
}>;

/** Identity, order, provenance, and domains for one local-Sun pure field. */
type LocalSunCpuPureFieldDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Pure scattering order. */
	order: number;
	/** Optional algorithm provenance identity. */
	provenanceIdentity?: string;
	/** Coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Identity, through-order, provenance, and domains for one local-Sun cumulative field. */
type LocalSunCpuCumulativeFieldDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Cumulative through-order. */
	cumulativeThroughOrder: number;
	/** Optional algorithm provenance identity. */
	provenanceIdentity?: string;
	/** Coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Geometry contract for expressing local source-frame directions. */
type LocalSunPhysicalDirectionGeometry = Readonly<{
	/**
	 * Call this method to express one local cache direction at its physical position.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	expressPhysicalScatteringCacheDirection(request: FlatScatteringCacheFramedDirectionRequest): UnitVector3;
}>;

/** Geometry contract for resolving local construction taps through executable z/rho axes. */
type LocalSunConstructionPositionLookupGeometry = Readonly<{
	/**
	 * Call this method to resolve one selected local construction-position stencil.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	resolveScatteringCacheConstructionPositionStencil(
		request: FlatScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;
}>;

/** Configured flat-geometry capabilities required by local CPU construction. */
type LocalSunCpuCacheGeometry = GeometryModel &
	LocalSunConstructionDomainGeometry &
	PureScatteringDensityTransportGeometry &
	LocalSunPhysicalDirectionGeometry &
	LocalSunConstructionPositionLookupGeometry &
	Readonly<{
		/** Geometry-paired source position. */
		configuration: Pick<FlatEarthGeometryConfiguration, 'sourcePosition'>;
	}>;

/** Geometry capabilities required by stored-field local-Sun transport. */
type LocalSunScatteringDensityTransportGeometry = PureScatteringDensityTransportGeometry &
	LocalSunPhysicalDirectionGeometry &
	LocalSunConstructionPositionLookupGeometry;

/** Field, physical collaborators, domains, and options for one stored-field local-Sun transport. */
type LocalSunScatteringDensityTransportRequest = Readonly<{
	/** Sealed pure J2 or J3 input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Pure stored order being transported. */
	scatteringOrder: 2 | 3 | 4;
	/** Flat construction and source-frame geometry owner. */
	geometry: LocalSunScatteringDensityTransportGeometry;
	/** Atmosphere medium-sampling owner. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Path-quadrature and transmittance calculator. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Executable local construction facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Accepted stored-field transport interval count. */
	pathIntervalCount: number;
	/** Optional allocated pure-radiance identity. */
	id?: string;
	/** Optional observer of bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/**
 * Geometry method names required by local-Sun later-order scattering.
 *
 * - **"resolveAtmospherePath"** - Bounded atmosphere-path resolution for one ray.
 * - **"resolveGroundIntersection"** - Ground-hit resolution for one physical ray.
 * - **"resolveSourceRelativePosition"** - Finite-source-relative position resolution.
 */
type LocalSunLaterOrderScatteringGeometryMethod =
	'resolveAtmospherePath' | 'resolveGroundIntersection' | 'resolveSourceRelativePosition';

/** Local-geometry capabilities required by later-order scattering and reflection. */
type LocalSunLaterOrderScatteringGeometry = LaterOrderScatteringGeometry &
	LocalSunPhysicalDirectionGeometry &
	LocalSunConstructionPositionLookupGeometry &
	Pick<GeometryModel, LocalSunLaterOrderScatteringGeometryMethod>;

/** Physical collaborators and options for local-Sun later-order scattering. */
type LocalSunLaterOrderScatteringKernelRequest = Readonly<{
	/** Flat scattering and optional ground-geometry owner. */
	geometry: LocalSunLaterOrderScatteringGeometry;
	/** Medium, phase, and transmittance owner. */
	atmosphere: LaterOrderScatteringAtmosphere & AtmosphereModel;
	/** Spectral scattering calculator. */
	calculator: LaterOrderScatteringCalculator;
	/** Executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Pure scattering-density order being constructed. */
	scatteringOrder: 2 | 3 | 4 | 5;
	/** Pure L(k-2) field for reflective higher-order ground, or null when unused. */
	groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null;
	/** Selected reflective boundary or canonical omission. */
	groundBoundary: GroundBoundary | null;
	/** Direct source-lighting owner used only by reflective J2. */
	lightSource: LightSourceModel;
	/** Number of source-path transmittance intervals for ground reflection. */
	sourceTransmittanceIntervalCount: number;
	/** Optional observer of bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Callable contract for building one pure transported-radiance field. */
type LocalSunCpuTransportedRadianceBuilder =
	/**
	 * Called by local sun cpu transported radiance builder to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: CpuTransportedRadianceBuildRequest) => CpuDirectionalSpectralFieldContract;

/** Local pure-order recurrence operation contract. */
type LocalSunCpuCacheOperations = Readonly<{
	/**
	 * Call this method to create one physical pure-order scattering kernel.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createScatteringKernel(request: CpuScatteringKernelBuildRequest): ScatteringOrderKernel;
	/** Stored-field pure L2 or L3 builder. */
	buildTransportedRadiance: LocalSunCpuTransportedRadianceBuilder;
	/** Later-order scattering provenance identity. */
	scatteringProvenanceIdentity: string;
}>;

/** Physical collaborators, domains, options, and operations for one internal local-Sun CPU cache build. */
type LocalSunCpuCacheBuildRequest = Readonly<{
	/** Atmosphere medium, phase, and transmittance owner. */
	atmosphere: AtmosphereModel;
	/** Flat construction and cache-lookup geometry owner. */
	geometry: LocalSunCpuCacheGeometry;
	/** Construction-only shell-held primary-lighting owner. */
	lightSource: LightSourceModel;
	/** Accepted physical and numerical profile. */
	profile: Algorithm32ExecutionProfile;
	/** Executable spectral basis. */
	spectralBasis: SpectralBasis;
	/** Number of source-path transmittance intervals. */
	sourceTransmittanceIntervalCount: number;
	/** Number of cache-transport integration intervals. */
	transportIntervalCount: number;
	/** Executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Spectral transport and scattering calculator. */
	calculator: SpectralCalculator;
	/** Selected reflective boundary or canonical omission. */
	groundBoundary?: GroundBoundary | null;
	/** Requested N1, N2, or N4 construction maximum. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Optional recurrence-operation override for the internal diagnostic seam. */
	operations?: LocalSunCpuCacheOperations;
	/** Optional observer of bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Isolated recurrence choices accepted by the local-Sun CPU cache fixture. */
type LocalSunCpuCacheFixtureRecurrenceRequest = Readonly<{
	/** Requested N1, N2, or N4 recurrence maximum. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Optional primary-J1 source override. */
	primaryLightSource?: LightSourceModel;
	/** Optional physical and numerical profile override. */
	profile?: NativeProductionProfile;
	/** Optional reflective boundary override. */
	groundBoundary?: GroundBoundary | null;
}>;

/** Local-Sun facade surface retained by the CPU cache test fixture. */
type LocalSunCpuCacheTestSource = LocalSunCacheProviderSource &
	Readonly<{
		/**
		 * Call this method to build one source-owned CPU scattering cache.
		 *
		 * @param request - Physical collaborators and optional recurrence overrides.
		 * @returns - The completed CPU cache.
		 */
		buildCpuScatteringCache(request: LocalSunCpuCacheRequest): LocalSunCpuCacheResult;
	}>;

/** Local-Sun provider seams retained by the CPU cache test fixture. */
type LocalSunCpuCacheTestProvider = Readonly<{
	/**
	 * Called by local sun cpu cache test provider to execute the bounded internal recurrence.
	 *
	 * @param request - Complete internal CPU cache request.
	 * @returns - The completed CPU cache.
	 *
	 */
	_buildCpuCache(request: LocalSunCpuCacheBuildRequest): LocalSunCpuCacheResult;
	/**
	 * Called by local sun cpu cache test provider to construct one later-order scattering kernel.
	 *
	 * @param request - Later-order physical collaborators and options.
	 * @returns - The configured scattering kernel.
	 *
	 */
	_createLaterOrderScatteringKernel(request: LocalSunLaterOrderScatteringKernelRequest): ScatteringOrderKernel;
	/**
	 * Called by local sun cpu cache test provider to construct one stored-field radiance order.
	 *
	 * @param request - Stored field and physical transport collaborators.
	 * @returns - The completed pure-radiance field.
	 *
	 */
	_buildTransportedRadiance(request: LocalSunScatteringDensityTransportRequest): CpuDirectionalSpectralFieldContract;
}>;

/** Physical owners, executable domains, and probes retained by a local-Sun CPU cache fixture. */
type LocalSunCpuCacheTestFixture = Readonly<{
	/** Canonical atmosphere used by the fixture. */
	atmosphere: AtmosphereModel;
	/** Flat construction and lookup geometry used by the fixture. */
	geometry: LocalSunCpuCacheGeometry;
	/** Continuous finite-source facade used by the fixture. */
	lightSource: LocalSunCpuCacheTestSource;
	/** Shell-held primary-J1 adapter used by the fixture. */
	constructionLightSource: LightSourceModel;
	/** Provider exposing the bounded internal recurrence seams. */
	cacheProvider: LocalSunCpuCacheTestProvider;
	/** Source-path transmittance interval count used by the fixture. */
	sourceTransmittanceIntervalCount: number;
	/** Executable local construction-domain selection. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Scattering-density coordinates sampled by the fixture. */
	probes: readonly DirectionalSpectralFieldCoordinates[];
	/** Pure-radiance coordinates sampled by the fixture. */
	radianceProbes: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Completed local-Sun cache artifact double with observable disposal state. */
type LocalSunCacheDisposalTestArtifact = CacheBuildArtifact &
	Readonly<{
		/** Number of disposal requests completed by the artifact double. */
		readonly disposeCount: number;
	}>;

/** One selected scalar retained by a local-Sun GPU transport authority. */
type LocalSunGpuTransportProbeSample = Readonly<{
	/** Direction, position, and wavelength coordinates of the selected scalar. */
	readonly coordinates: DirectionalSpectralFieldCoordinates;
	/** Retained scalar radiance value. */
	readonly value: number;
}>;

/** Selected L2 and L3 values retained by a local-Sun GPU transport authority. */
type LocalSunGpuTransportSnapshot = Readonly<{
	/** Authority snapshot identity. */
	readonly id: string;
	/** Selected second-order radiance values. */
	readonly l2: readonly LocalSunGpuTransportProbeSample[];
	/** Selected third-order radiance values. */
	readonly l3: readonly LocalSunGpuTransportProbeSample[];
}>;

/** Residual diagnostics for one selected fused-transport authority comparison. */
type LocalSunGpuTransportResidualSummary = Readonly<{
	/** Comparison identity. */
	readonly label: string;
	/** Largest absolute scalar residual. */
	readonly maximumAbsoluteResidual: number;
	/** Nearest-rank p95 absolute scalar residual. */
	readonly p95AbsoluteResidual: number;
	/** Largest relative scalar residual, excluding undefined zero-authority ratios. */
	readonly maximumRelativeResidual: number;
	/** Nearest-rank p95 relative scalar residual. */
	readonly p95RelativeResidual: number;
	/** Largest Float32 encoding distance. */
	readonly maximumUlpResidual: number;
	/** Nearest-rank p95 Float32 encoding distance. */
	readonly p95UlpResidual: number;
}>;

/** Existing physical owners retained by the explicit compact construction profile. */
type LocalSunCompactProfileModels = Readonly<{
	/** Geometry owns all coordinates, placement and ray support. */ geometry: FlatEarthGeometry;
	/** Unchanged accepted exponential medium. */ atmosphere: CanonicalAtmosphere;
	/** Existing bound finite source. */ lightSource: LocalSunLightSource;
	/** Explicit black atmospheric ground. */ groundBoundary: null;
}>;
/** Complete authored compact seed inputs; medium-dependent refinement is derived by the profile. */
type LocalSunCompactTopologyControls = Readonly<{
	/** Explicit source-centered cylinder radius. */ coverageRadius: Distance;
	/** Ground-through-top altitude seeds. */ altitudes: readonly Distance[];
	/** Complete Euclidean-radius bands from zero to the farthest cylinder source distance. */ bandRadii: readonly Distance[];
	/** Positive ordered extinction-length refinement multiples. */ boundaryExtinctionLengthMultiples: readonly number[];
}>;
/** Complete physical input graph and topology controls for compact construction. */
type LocalSunCompactConstructionProfileDefinition = LocalSunCompactProfileModels &
	Readonly<{
		/** Explicit controls; automatic changed-height seed generation remains open. */ topologyControls: LocalSunCompactTopologyControls;
		/** Input ancestry identity, never an executable descriptor. */ provenanceIdentity: string;
	}>;
/** Tagged complete numerical selections; analytic source integration consumes no sampled count. */
type LocalSunCompactNumericalPolicies = Readonly<{
	/** Cache source-column policy. */ sourcePathTransmittance: Readonly<{kind: 'analytic-exponential-column-v1'}>;
	/** Existing executable cache policy, with all material parameters. */ cacheTransport: Readonly<{
		/** Geometry-dependent placement policy. */ kind: 'local-squared-rayleigh-column-v1';
		/** Executable transport policy identity. */ id: string;
		/** Positive retained prefix interval count. */ intervalCount: number;
		/** Dimensionless per-channel attenuation prefix cutoff. */ opticalDepthCutoff: number;
		/** Bounded optical prefix search iterations. */ prefixSearchIterations: number;
	}>;
	/** Prospective view selection, not yet connected to runtime consumers. */ viewPath: Readonly<{
		/** Positive local view-column policy. */ kind: 'local-positive-column-v1';
		/** Selected positive view interval count. */ intervalCount: number;
	}>;
	/** Shared requested cumulative order; complete recurrence remains open. */ maximumScatteringOrder: 4;
	/** CPU reference and GPU scalar payload semantics. */ precision: Readonly<{
		/** Reference scalar precision. */ cpu: 'binary64';
		/** Prospective GPU storage format. */ gpu: 'scalar-r32f';
	}>;
}>;
/** Real compact position adapter and executable domains, without rectangular axis properties. */
type LocalSunCompactConstructionDomains = Readonly<{
	/** Discriminant distinct from rectangular local domains. */ kind: 'local-sun-compact-construction-domains';
	/** Geometry-owned real ragged topology. */ topology: FlatCompactTopology;
	/** Actual physical node/count adapter. */ positions: PositionDomain;
	/** Qualified polar40/azimuth48 incoming measure. */ incomingDirections: WeightedDirectionDomain;
	/** Shared W27 outgoing owner. */ outgoingDirections: CubedSphereDirectionDomain;
	/** Logical physical incoming packing; no resident buffer. */ radiancePacking: LocalSunFieldPacking;
	/** Logical outgoing J packing; no resident buffer. */ scatteringDensityPacking: LocalSunFieldPacking;
}>;
/** Complete declared overlap input to the estimate; additional bytes must include all other owned resources. */
type LocalSunCompactResourceEstimateRequest = Readonly<{
	/** Retained old scattering fields. */ retainedScatteringFields: number;
	/** Every other declared owned GPU resource. */ otherOwnedGpuBytes: UnitValue<'bytes'>;
}>;
/** Logical full-field estimates, distinct from measured or admitted runtime allocations. */
type LocalSunCompactResourceEstimate = Readonly<{
	/** One full physical J field in FP32 bytes. */
	readonly scatteringFieldBytes: UnitValue<'bytes'>;
	/** One incoming L field in FP32 bytes. */
	readonly incomingRadianceBytes: UnitValue<'bytes'>;
	/** Full incoming/outgoing phase payload in FP32 bytes. */
	readonly phaseBytes: UnitValue<'bytes'>;
	/** Conservative three-J/one-L/phase construction subtotal. */
	readonly newConstructionSubtotalBytes: UnitValue<'bytes'>;
	/** Declared retained old scattering fields. */
	readonly retainedScatteringBytes: UnitValue<'bytes'>;
	/** All caller-declared remaining owned resources. */
	readonly otherOwnedGpuBytes: UnitValue<'bytes'>;
	/** Complete declared subtotal, including overlap and additional bytes. */
	readonly totalOwnedGpuEstimateBytes: UnitValue<'bytes'>;
	/** P0 production logical allocation ceiling. */
	readonly ownedGpuCeilingBytes: UnitValue<'bytes'>;
	/** Arithmetic fit only; it does not authorize or measure allocation. */
	readonly estimateFitsCeiling: boolean;
	/** Five J and three L retained N4 binary64 buffers, excluding other working memory. */
	readonly fullCpuRetainedSpectralBytes: UnitValue<'bytes'>;
	/** This estimate operation allocates no spectral field. */
	readonly spectralBuffersAllocated: 0;
}>;
