/** Exact construction lattice shared by the distant-Sun field and support mask. */
type DistantSunCelestialConstructionLatticeShape = Readonly<{
	/** Horizon-normalized source-direction coordinate count. */
	readonly directionCount: 11;
	/** Receiver-altitude coordinate count. */
	readonly receiverCount: 13;
}>;

/** Exact native-15 logical shape of the spherical distant-Sun transport field. */
type DistantSunCelestialFieldShape = DistantSunCelestialConstructionLatticeShape &
	Readonly<{
		/** Native spectral-channel count. */
		readonly channelCount: 15;
	}>;

/** One exact scalar coordinate in the spherical distant-Sun transport field. */
type DistantSunCelestialFieldCoordinate = Readonly<{
	/** Horizon-normalized direction-node index. */
	readonly directionIndex: number;
	/** Receiver-altitude-node index. */
	readonly receiverIndex: number;
	/** Native spectral-channel index. */
	readonly wavelengthIndex: number;
}>;

/** Canonical physical and numerical identity of one distant-Sun logical field. */
type DistantSunCelestialLogicalFieldDescription = Readonly<{
	/** Stable logical-field identifier. */
	readonly id: string;
	/** Canonical identity of every executable logical-field fact. */
	readonly contentHash: string;
	/** Stable distant-Sun source identifier. */
	readonly sourceId: string;
	/** Canonical identity of the source definition and surface radiance. */
	readonly sourceDefinitionHash: string;
	/** Canonical identity of the geometry-owned construction domain. */
	readonly domainIdentity: string;
	/** Canonical identity of the atmosphere extinction behavior. */
	readonly atmosphereTransportIdentity: string;
	/** Canonical identity of the source-path numerical integration controls. */
	readonly numericalIdentity: string;
	/** Exact logical field shape. */
	readonly shape: DistantSunCelestialFieldShape;
	/** Spectral radiance-density quantity stored by the field. */
	readonly quantity: 'spectral-radiance-density';
	/** Spectral radiance-density units stored by the field. */
	readonly units: 'W m^-2 sr^-1 nm^-1';
}>;

/** Complete binary64 reference field over the spherical distant-Sun domain. */
type DistantSunCelestialCpuField = Readonly<{
	/** Canonical logical description shared with GPU construction. */
	readonly description: DistantSunCelestialLogicalFieldDescription;
	/** Exact CPU-derived support mask for the construction lattice. */
	readonly supportMask: DistantSunCelestialSupportMask;
	/** Receiver-major, direction-minor, wavelength-innermost binary64 values. */
	readonly values: Float64Array;
}>;

/** Distant-Sun source behavior required by binary64 logical-field construction. */
interface DistantSunCelestialLogicalCacheSource extends DistantSunCelestialSource, CelestialSourceProvider {}

/** Construction inputs for one binary64 distant-Sun logical field. */
type DistantSunCelestialCpuCacheBuildRequest = Readonly<{
	/** Complete execution model supplying atmosphere and profile authority. */
	readonly model: Algorithm32ExecutionModel;
	/** Geometry-owned spherical celestial contribution domain. */
	readonly domain: CelestialContributionDomainDescription;
	/** Geometry-resolved distant-Sun placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>;
	/** Canonical source definition and surface-radiance owner. */
	readonly source: DistantSunCelestialLogicalCacheSource;
}>;

/**
 * Classification returned by one binary64 distant-Sun field lookup.
 *
 * - **"clear"** - Both stencils are valid and the interpolated field value is returned.
 * - **"ground-horizon"** - Geometry classifies the source direction as ground blocked and exact zero is returned.
 * - **"out-of-domain"** - At least one stencil lies outside the field domain and exact zero is returned.
 */
type DistantSunCelestialCpuLookupClassification = 'clear' | 'ground-horizon' | 'out-of-domain';

/** Geometry-owned stencils accepted by one binary64 field lookup. */
type DistantSunCelestialCpuLookupRequest = Readonly<{
	/** Receiver-altitude reconstruction stencil. */
	readonly receiverStencil: CelestialReceiverStencil;
	/** Horizon-normalized direction reconstruction stencil. */
	readonly directionStencil: CelestialDirectionStencil;
}>;

/** Result of one binary64 distant-Sun field lookup. */
type DistantSunCelestialCpuLookupResult = Readonly<{
	/** Geometry support classification represented by this result. */
	readonly classification: DistantSunCelestialCpuLookupClassification;
	/** Interpolated spectral radiance or exact zero for invalid support. */
	readonly radiance: SpectralRadiancePacket;
}>;

/** CPU-derived exact support mask for all distant-Sun construction nodes. */
type DistantSunCelestialSupportMask = Readonly<{
	/** Canonical identity of the domain and ordered mask values. */
	readonly contentHash: string;
	/** Exact two-dimensional construction lattice represented by the mask. */
	readonly shape: DistantSunCelestialConstructionLatticeShape;
	/** Receiver-major, direction-minor support values encoded as zero or one. */
	readonly values: readonly (0 | 1)[];
}>;

/** Family-private construction context shared by distant-Sun owner modules. */
type DistantSunCelestialCacheModuleContext = Readonly<{
	/** Geometry-owned spherical celestial contribution domain. */
	readonly domain: CelestialContributionDomainDescription;
	/** Geometry-resolved distant-Sun placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>;
	/** Exact CPU-derived support mask for the construction lattice. */
	readonly supportMask: DistantSunCelestialSupportMask;
	/** Native-15 output field produced by the pass. */
	readonly output: DistantSunCelestialGpuFieldSpec;
	/** Trapezoidal source-path interval count selected by the execution profile. */
	readonly sourcePathIntervalCount: number;
}>;

/** Family-private capability supplying one distant-Sun construction module. */
interface DistantSunCelestialCacheModuleContributor {
	/**
	 * Call this method to contribute one owner-specific part of distant-Sun direct transport.
	 *
	 * @param context - The exact distant-Sun construction context.
	 * @returns - The identified owner module.
	 */
	createDistantSunCelestialCacheModule(context: DistantSunCelestialCacheModuleContext): CacheBuildModule;
}

/** Private sealed binary64 distant-Sun logical cache. */
interface DistantSunCelestialCpuCacheContract {
	/** Canonical logical field description. */
	readonly description: DistantSunCelestialLogicalFieldDescription;
	/** Exact CPU-derived support mask. */
	readonly supportMask: DistantSunCelestialSupportMask;
	/** Number of resident binary64 scalars. */
	readonly scalarCount: 2145;
	/**
	 * Call this method to read one validated scalar coordinate.
	 *
	 * @param coordinate - The exact field coordinate.
	 * @returns - The stored binary64 scalar.
	 */
	readScalar(coordinate: DistantSunCelestialFieldCoordinate): number;
	/**
	 * Call this method to copy the complete field for bounded reference and parity work.
	 *
	 * @returns - An independently owned binary64 field snapshot.
	 */
	snapshot(): DistantSunCelestialCpuField;
	/**
	 * Call this method to reconstruct one spectral packet from geometry-owned stencils.
	 *
	 * @param request - The exact receiver and direction stencils.
	 * @returns - Interpolated radiance or exact zero outside supported geometry.
	 */
	lookup(request: DistantSunCelestialCpuLookupRequest): DistantSunCelestialCpuLookupResult;
}

/** Exact owners retained by the stateless distant-Sun celestial GPU builder. */
type DistantSunCelestialGpuBuilderConfiguration = Readonly<{
	/** Complete configured execution model. */
	readonly model: SharedModel;
	/** Existing configured atmospheric and celestial Sun. */
	readonly source: DistantSunCelestialLogicalCacheSource & DistantSunCelestialCacheModuleContributor;
	/** External renderer backend that owns constructed fields. */
	readonly backend: CacheGpuBackend;
}>;

/** Optional execution controls for one trusted distant-Sun celestial plan. */
type DistantSunCelestialGpuExecutionOptions = Readonly<{
	/** Optional cancellation signal. */
	readonly signal?: AbortSignal;
	/** Optional safe-boundary scheduler. */
	readonly scheduler?: CacheBuildScheduler;
	/** Optional backend-owned bounded probe reader. */
	readonly probeReader?: CacheProbeReader;
	/** Selected distant-Sun scalar coordinates to capture during construction. */
	readonly probeCoordinates?: readonly DistantSunCelestialFieldCoordinate[];
}>;

/** Completed uninstalled GPU construction with its exact CPU oracle. */
type DistantSunCelestialGpuBuildResult = Readonly<{
	/** Trusted plan that produced the result. */
	readonly plan: DistantSunCelestialCachePlan;
	/** Sealed binary64 oracle used for support and selected parity probes. */
	readonly cpuReference: DistantSunCelestialCpuCacheContract;
	/** Resident field, opaque binding, diagnostics, and disposal owner. */
	readonly artifact: GpuFieldArtifact;
}>;

/** Completed inputs transferred into one published distant-Sun celestial resource. */
type DistantSunCelestialCacheResourceConfiguration = Readonly<{
	/** Trusted plan whose identity and descriptor the resource publishes. */
	readonly plan: DistantSunCelestialCachePlan;
	/** Completely constructed artifact whose field lifetime transfers to the resource. */
	readonly artifact: GpuFieldArtifact;
}>;

/** Trusted production request for the distant-Sun live raster shader contribution. */
type DistantSunCelestialLiveShaderContributionRequest = CelestialCacheShaderContributionRequest &
	Readonly<{
		/** Configured source that owns the Sun direction, angular radius, and definition identity. */
		readonly source: DistantSunCelestialCacheSource;
	}>;

/** Exact `R32F` storage selected for the spherical distant-Sun field. */
type DistantSunCelestialFieldStorage = Readonly<{
	/** Scalar binary32 render-target format. */
	readonly format: 'R32F';
	/** Horizon-normalized direction-node count. */
	readonly width: 11;
	/** Receiver-altitude-node count. */
	readonly height: 13;
	/** Native spectral-channel array-layer count. */
	readonly layers: 15;
}>;

/** Exact resident-field specification for one distant-Sun GPU build. */
type DistantSunCelestialGpuFieldSpec = Readonly<{
	/** Stable direct-transport field identifier. */
	readonly id: CacheFieldId;
	/** Exact 11 by 13 by 15 scalar storage. */
	readonly storage: DistantSunCelestialFieldStorage;
}>;

/** Exact one-field, one-pass neutral GPU graph for distant-Sun direct transport. */
type DistantSunCelestialGpuExecutionPlan = Readonly<{
	/** Sole field allocated by this family. */
	readonly fields: readonly [DistantSunCelestialGpuFieldSpec];
	/** Sole direct-transport pass interpreted only by this family. */
	readonly passes: readonly [GpuFieldPass];
	/** Field retained as the completed result. */
	readonly result: CacheFieldId;
	/** Distant-Sun runtime value populated by the completed binding. */
	readonly valueKey: 'cache.celestial.sunTransport';
}>;

/** Exact published-field descriptor owned by a spherical distant-Sun plan. */
type DistantSunCelestialCacheDescriptor = Readonly<{
	/** Stable descriptor identifier. */
	readonly id: string;
	/** Canonical identity of every descriptor fact. */
	readonly contentHash: string;
	/** Logical physical and numerical field description. */
	readonly logicalField: DistantSunCelestialLogicalFieldDescription;
	/** Scalar R32F field storage. */
	readonly storage: DistantSunCelestialFieldStorage;
	/** Runtime binding key owned by the distant-Sun field. */
	readonly valueKey: 'cache.celestial.sunTransport';
}>;

/** Complete executable direct-transport plan for the spherical distant-Sun field. */
type DistantSunCelestialCachePlan = Readonly<{
	/** Stable executable plan identity. */
	readonly identity: CacheReuseIdentity;
	/** Geometry-owned domain used for construction and lookup. */
	readonly domain: CelestialContributionDomainDescription;
	/** Exact support mask used by CPU and GPU construction. */
	readonly supportMask: DistantSunCelestialSupportMask;
	/** Published field descriptor owned by this plan. */
	readonly descriptor: DistantSunCelestialCacheDescriptor;
	/** Neutral one-field GPU execution plan. */
	readonly execution: DistantSunCelestialGpuExecutionPlan;
}>;

/** Inputs retained by one dedicated distant-Sun celestial controller. */
type DistantSunCelestialCacheControllerConfiguration = Readonly<{
	/** Complete configured execution model. */
	readonly model: SharedModel;
	/** Concrete backend that owns every constructed field. */
	readonly backend: CacheGpuBackend;
	/** Optional safe-boundary scheduler. */
	readonly scheduler?: CacheBuildScheduler;
}>;

/** Exact ownership inputs used to decide distant-Sun controller reuse. */
type DistantSunCelestialCacheControllerIdentity = Readonly<{
	/** Exact distant-Sun source owner. */
	readonly source: DistantSunCelestialCacheSource;
	/** Exact geometry owner supplying the spherical celestial capability. */
	readonly geometry: GeometryModel & CelestialGeometryCapability;
	/** Exact atmosphere transport owner. */
	readonly atmosphere: AtmosphereModel;
	/** Concrete backend instance across which resources never move. */
	readonly backend: CacheGpuBackend;
	/** Optional build scheduler. */
	readonly scheduler: CacheBuildScheduler | null;
}>;

/** Trusted request from configured-model setup to derive a distant-Sun field plan. */
type DistantSunCelestialCachePlanRequest = Readonly<{
	/** Geometry-resolved distant-Sun placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>;
	/** Immutable spherical query packet validated against the same roster and geometry. */
	readonly query: SphericalCelestialQueryPacket;
}>;

/** Request to construct, reuse, or replace one distant-Sun celestial resource. */
type DistantSunCelestialCacheBuildRequest = DistantSunCelestialCachePlanRequest &
	Readonly<{
		/** Optional caller cancellation signal. */
		readonly signal?: AbortSignal;
	}>;

/** Distant-Sun-specific runtime binding over the published field. */
type DistantSunCelestialRuntimeBinding = CacheRuntimeBinding &
	Readonly<{
		/** Distant-Sun direct-transport runtime key. */
		readonly valueKey: 'cache.celestial.sunTransport';
	}>;

/** Exact one-binding collection published by a distant-Sun resource. */
type DistantSunCelestialRuntimeBindings = Readonly<{
	/** Renderer backend that owns the field and binding. */
	readonly backendId: string;
	/** Sole distant-Sun direct-transport binding. */
	readonly bindings: readonly [DistantSunCelestialRuntimeBinding];
}>;

/** Published distant-Sun celestial resource. */
interface DistantSunCelestialCacheResource extends CelestialCacheResource {
	/** Distant-Sun source represented by this resource. */
	readonly sourceId: string;
	/** Exact physical, numerical, layout, and binding descriptor. */
	readonly descriptor: DistantSunCelestialCacheDescriptor;
	/**
	 * Call this method to return the sole opaque distant-Sun runtime binding.
	 *
	 * @returns - The exact distant-Sun runtime binding collection.
	 */
	getRuntimeBindings(): DistantSunCelestialRuntimeBindings;
	/**
	 * Call this method to contribute geometry-stencil-based field lookup without a live disk consumer.
	 *
	 * @returns - The cache-owned bilinear lookup shader contribution.
	 */
	createShaderContribution(): ShaderContribution;
	/**
	 * Call this method to contribute the fixed live disk raster over this completed field.
	 *
	 * @param request - The trusted configured source and geometry query facts.
	 * @returns - The live distant-Sun raster shader contribution.
	 */
	createLiveShaderContribution(request: DistantSunCelestialLiveShaderContributionRequest): ShaderContribution;
	/**
	 * Call this method to read a bounded set of selected field scalars for diagnostics.
	 *
	 * @param probeReader - The backend-owned bounded probe capability.
	 * @param coordinates - The exact scalar coordinates to inspect.
	 * @returns - The selected scalar samples.
	 */
	readSelectedScalars(
		probeReader: CacheProbeReader,
		coordinates: readonly DistantSunCelestialFieldCoordinate[],
	): Promise<CacheProbeResult>;
}

/** Controller for only the spherical distant-Sun celestial resource. */
interface DistantSunCelestialCacheController {
	/** Currently published resource, or null before a successful build. */
	readonly active: DistantSunCelestialCacheResource | null;
	/**
	 * Call this method to derive the complete trusted one-field GPU plan without executing it.
	 *
	 * @param request - Geometry placement and query facts from configured-model setup.
	 * @returns - The complete distant-Sun execution plan.
	 */
	createBuildPlan(request: DistantSunCelestialCachePlanRequest): DistantSunCelestialCachePlan;
	/**
	 * Call this method to construct, reuse, or replace the distant-Sun resource.
	 * Construction failure or cancellation rejects without replacing the currently
	 * published resource.
	 *
	 * @param request - The trusted geometry facts and optional cancellation signal.
	 * @returns - The completely constructed or exactly reused resource.
	 */
	build(request: DistantSunCelestialCacheBuildRequest): Promise<DistantSunCelestialCacheResource>;
	/**
	 * Call this method to dispose controller-owned resources idempotently.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Internal distant-Sun source capability that creates its celestial controller. */
interface DistantSunCelestialCacheSource extends DistantSunCelestialLogicalCacheSource {
	/**
	 * Call this method to create one attachment-owned distant-Sun celestial controller.
	 *
	 * @param request - The configured model, external backend, and optional scheduler.
	 * @returns - The dedicated distant-Sun celestial controller.
	 */
	createDistantSunCelestialCacheController(
		request: DistantSunCelestialCacheControllerConfiguration,
	): DistantSunCelestialCacheController;
}
