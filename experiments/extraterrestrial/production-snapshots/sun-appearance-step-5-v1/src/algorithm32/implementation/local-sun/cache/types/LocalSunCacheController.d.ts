/** Accepted transient local-Sun GPU construction request. */
type LocalSunAcceptedCacheBuildRequest = ScatteringCacheBuildRequest;

/** Shared executable storage for scattering-density and radiance plan fields. */
type LocalSunCacheFieldDomains = Readonly<{
	/** Storage shared by pure and cumulative scattering-density fields. */
	readonly scattering: CacheFieldStorage;
	/** Storage shared by pure transported-radiance fields. */
	readonly radiance: CacheFieldStorage;
}>;

/** Optional executable facts attached to one local-Sun cache-pass context. */
type LocalSunCachePassOptions = Readonly<{
	/** Optional direct-radiance path interval count. */
	pathIntervalCount?: number;
	/** Optional ground-reflection illumination contract for a scatter pass. */
	groundReflection?: CacheGroundReflection;
}>;

/** Complete owner inputs for one local-Sun cache pass. */
type LocalSunCachePassDefinition = Readonly<{
	/** Stable pass identifier. */
	id: string;
	/** Physical and numerical context supplied to every pass contributor. */
	context: CacheBuildContext;
	/** Concrete owners contributing cache-build modules. */
	contributors: readonly CacheBuildContributor[];
	/** Whether the pass includes a ground-boundary contribution. */
	includeGround?: boolean;
	/** Reflective boundary contributor or canonical black-ground omission. */
	groundBoundary?: CacheBuildContributor | null;
}>;

/** Owners and fields for one local-Sun stored-field transport pass. */
type LocalSunCacheTransportPassRequest = Readonly<{
	/** Stable pass identifier. */
	id: string;
	/** Pure radiance order produced by the pass. */
	order: 2 | 3 | 4;
	/** Pure scattering-density input field. */
	input: CacheFieldSpec;
	/** Pure transported-radiance output field. */
	output: CacheFieldSpec;
	/** Accepted cache-construction options. */
	options: CacheConstructionOptions;
	/** Selected local-Sun construction domains. */
	domains: LocalSunConstructionDomainSelection;
	/** Flat-geometry cache-module contributor. */
	geometry: CacheBuildContributor;
	/** Atmosphere medium and extinction cache-module contributor. */
	atmosphere: CacheBuildContributor;
	/** GPU-integrated stored-field transport operation owner. */
	integratedTransport: IntegratedCacheTransport;
}>;

/** Owners and fields for one local-Sun scatter-and-accumulate pass pair. */
type LocalSunCacheScatterPassRequest = Readonly<{
	/** Pure scattering-density order produced by the pair. */
	order: 2 | 3 | 4 | 5;
	/** Previous pure transported-radiance field. */
	previousRadiance: CacheFieldSpec;
	/** Earlier pure-radiance field used for ground illumination, when applicable. */
	groundIllumination: CacheFieldSpec | null;
	/** Pure scattering-density output field. */
	output: CacheFieldSpec;
	/** Previous cumulative scattering-density field. */
	previousCumulative: CacheFieldSpec;
	/** New cumulative scattering-density field. */
	cumulative: CacheFieldSpec;
	/** Accepted cache-construction options. */
	options: CacheConstructionOptions;
	/** Selected local-Sun construction domains. */
	domains: LocalSunConstructionDomainSelection;
	/** Flat-geometry cache-module contributor. */
	geometry: CacheBuildContributor;
	/** Atmosphere cache-module contributor. */
	atmosphere: CacheBuildContributor;
	/** Local-Sun cache-module contributor. */
	source: CacheBuildContributor;
	/** Generic accumulation and transport operation owner. */
	operations: CacheOperations;
	/** Reflective boundary contributor or canonical black-ground omission. */
	groundBoundary: CacheBuildContributor | null;
}>;

/** Controller for local-Sun GPU cache construction within one runtime attachment. */
class LocalSunCacheController {
	/**
	 * Creates one controller without taking ownership of its GPU backend.
	 *
	 * @param request - The construction collaborators.
	 */
	constructor(request: LocalSunCacheControllerConfiguration);

	/** Atomically published active cache. */
	readonly active: LocalSunCache | null;

	/**
	 * Call this method to derive one source-owned cache build plan without executing it.
	 *
	 * @param request - The physical owners, domain selection, and requested maximum.
	 * @returns - The source-owned local-Sun cache build plan.
	 */
	createBuildPlan(): LocalSunCachePlan;

	/**
	 * Call this method to construct or reuse one complete cumulative scattering cache.
	 *
	 * @param request - The accepted physical owners and construction options.
	 * @returns - The cache that became active.
	 */
	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<LocalSunCache>;

	/** Call this method to cancel staging and release the active cache without owning the backend. */
	dispose(): void;
}
