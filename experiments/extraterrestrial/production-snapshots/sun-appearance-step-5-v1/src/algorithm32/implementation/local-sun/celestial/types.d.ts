/** Exact published-field description owned by a Flat finite-Sun plan. */
type FlatFiniteSunCacheDescriptor = Readonly<{
	/** Stable finite-Sun source identifier. */
	readonly sourceId: string;
	/** Geometry-owned domain identity. */
	readonly domainIdentity: string;
	/** Scalar R32F field storage. */
	readonly storage: CacheFieldStorage;
	/** Spectral channel count stored by the field. */
	readonly channelCount: 15;
	/** Spectral radiance-density quantity stored by the field. */
	readonly quantity: 'spectral-radiance-density';
	/** Spectral radiance-density units stored by the field. */
	readonly units: 'W m^-2 sr^-1 nm^-1';
	/** Runtime binding key owned by the finite-Sun field. */
	readonly valueKey: 'cache.celestial.localSunRadiance';
}>;

/** Logical direct-radiance plan for the Flat finite-Sun celestial field. */
type FlatFiniteSunCachePlan = Readonly<{
	/** Stable executable plan identity. */
	readonly identity: CacheReuseIdentity;
	/** Finite-Sun source represented by the field. */
	readonly sourceId: string;
	/** Geometry-owned domain used for construction and lookup. */
	readonly domain: CelestialContributionDomainDescription;
	/** Celestial field descriptor owned by this plan. */
	readonly descriptor: FlatFiniteSunCacheDescriptor;
	/** Neutral one-field execution graph. */
	readonly execution: GpuFieldExecutionPlan;
}>;

/** Exact reuse inputs for one Flat finite-Sun controller. */
type FlatFiniteSunCacheControllerIdentity = Readonly<{
	/** Concrete backend instance across which resources never move. */
	readonly backend: CacheGpuBackend;
	/** Optional build scheduler. */
	readonly scheduler: CacheBuildScheduler | null;
	/** Exact finite-Sun source owner. */
	readonly source: FiniteLocalSunCelestialSource;
	/** Exact Flat geometry owner. */
	readonly geometry: GeometryModel;
}>;

/** Construction collaborators for the Flat finite-Sun GPU builder. */
type FlatFiniteSunGpuBuilderConfiguration = Readonly<{
	/** Complete configured model. */
	readonly model: SharedModel;
	/** Externally owned GPU backend. */
	readonly backend: CacheGpuBackend;
}>;

/** Exact one-field source-radiance module context. */
type FlatFiniteSunCacheModuleContext = Readonly<{
	/** One-by-one-by-native-channel output field. */
	readonly output: GpuFieldSpec;
}>;

/** Source capability that contributes static finite-Sun cache radiance. */
interface FlatFiniteSunCacheModuleContributor {
	/**
	 * Call this method to contribute the source-owned cache-render module.
	 * @param context - Exact output-field context.
	 * @returns - Source-owned construction module.
	 */
	createFlatFiniteSunCacheModule(context: FlatFiniteSunCacheModuleContext): CacheBuildModule;
}

/** Optional execution controls for one Flat finite-Sun field build. */
type FlatFiniteSunGpuExecutionOptions = Readonly<{
	/** Optional construction scheduler. */
	readonly scheduler?: CacheBuildScheduler;
	/** Optional cancellation signal. */
	readonly signal?: AbortSignal;
}>;

/** Construction collaborators for one attachment-owned finite-Sun controller. */
type FlatFiniteSunCacheControllerConfiguration = Readonly<{
	/** Complete configured model. */
	readonly model: SharedModel;
	/** Externally owned GPU backend. */
	readonly backend: CacheGpuBackend;
	/** Optional construction scheduler. */
	readonly scheduler?: CacheBuildScheduler;
}>;

/** Published Flat finite-Sun resource. */
interface FlatFiniteSunCacheResource extends CelestialCacheResource {
	/** Finite-Sun source represented by this resource. */
	readonly sourceId: string;
	/**
	 * Call this method to contribute the one-texel cache lookup.
	 * @returns - Cache-owned lookup contribution.
	 */
	createShaderContribution(): ShaderContribution;
	/**
	 * Call this method to contribute the live finite-disk raster.
	 * @param request - Trusted source and geometry facts.
	 * @returns - Live finite-disk contribution.
	 */
	createLiveShaderContribution(request: FlatFiniteSunLiveShaderContributionRequest): ShaderContribution;
}

/** Construction request for one Flat finite-Sun resource. */
type FlatFiniteSunCacheResourceConfiguration = Readonly<{
	/** Trusted completed plan. */
	readonly plan: FlatFiniteSunCachePlan;
	/** Completed GPU field artifact transferred to the resource. */
	readonly artifact: GpuFieldArtifact;
}>;

/** Request to construct or reuse one Flat finite-Sun resource. */
type FlatFiniteSunCacheBuildRequest = Readonly<{
	/** Optional cancellation signal. */
	readonly signal?: AbortSignal;
}>;

/** Trusted request for the live Flat finite-Sun disk contribution. */
type FlatFiniteSunLiveShaderContributionRequest = ShaderContributionRequest &
	Readonly<{
		/** Configured finite local-Sun source. */
		readonly source: FiniteLocalSunCelestialSource;
		/** Geometry-resolved finite local-Sun placement. */
		readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'finite-local-sun'}>;
	}>;

/** Controller for only the Flat finite-Sun resource. */
interface FlatFiniteSunCacheController {
	/** Currently published resource, or null before a successful build. */
	readonly active: FlatFiniteSunCacheResource | null;
	/**
	 * Call this method to construct, reuse, or replace the finite-Sun resource. Construction failure or cancellation rejects without replacing the currently published resource.
	 *
	 * @param request - The accepted finite-Sun plan and optional cancellation signal.
	 * @returns - The completely constructed or exactly reused resource.
	 */
	build(request: FlatFiniteSunCacheBuildRequest): Promise<FlatFiniteSunCacheResource>;
	/**
	 * Call this method to dispose controller-owned resources idempotently.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Flat-finite-Sun-specific runtime binding collection. */
type FlatFiniteSunRuntimeBindings = CelestialRuntimeBindings;
