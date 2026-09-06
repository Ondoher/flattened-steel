/** Accepted transient distant-Sun GPU construction request. */
type DistantSunAcceptedCacheBuildRequest = ScatteringCacheBuildRequest;

/** Shared executable field storage for scattering and radiance plan fields. */
type DistantSunCacheFieldDomains = Readonly<{
	/** Storage shared by pure and cumulative scattering-density fields. */
	readonly scattering: CacheFieldStorage;

	/** Storage shared by pure transported-radiance fields. */
	readonly radiance: CacheFieldStorage;
}>;

/** Complete owner inputs for one distant-Sun cache pass. */
type DistantSunCachePassDefinition = Readonly<{
	/** Stable pass identifier. */
	readonly id: string;

	/** Physical and numerical context supplied to every pass contributor. */
	readonly context: CacheBuildContext;

	/** Ordered owners contributing modules to the pass. */
	readonly contributors: readonly CacheBuildContributor[];

	/** Whether the pass includes the selected ground owner. */
	readonly includeGround?: boolean;

	/** Optional reflective ground contributor; null represents canonical black ground. */
	readonly groundBoundary?: CacheBuildContributor | null;
}>;

/** Controller for distant-Sun GPU cache construction within one runtime attachment. */
class DistantSunCacheController {
	/**
	 * Creates one controller without taking ownership of its backend.
	 * @param request - The request accepted by the operation.
	 */
	constructor(request: DistantSunCacheControllerConfiguration);

	/** Atomically published active cache. */
	readonly active: DistantSunCache | null;

	/**
	 * Call this method to derive one source-owned cache build plan without executing it.
	 * @returns - The result produced by the operation.
	 */
	createBuildPlan(): CacheBuildPlan;

	/**
	 * Call this method to construct or reuse one complete cumulative scattering cache.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<DistantSunCache>;

	/** Call this method to cancel staging and release the active cache without owning the backend. */
	dispose(): void;
}
