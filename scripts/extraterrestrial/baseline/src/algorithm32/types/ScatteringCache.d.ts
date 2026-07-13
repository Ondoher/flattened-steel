/**
 * Provide the common Algorithm32-facing contract for one source-owned,
 * observer-independent cumulative scattering cache.
 *
 * This interface is not a universal concrete cache implementation. Each
 * atmospheric light-source kind owns its concrete cache type, physical
 * domains, source-relative mapping, storage layout, and primary-field builder.
 */
interface ScatteringCache {
	/**
	 * Store the immutable cache identity and physical quantity description.
	 */
	readonly descriptor: ScatteringCacheDescriptor;

	/**
	 * Release the resources owned by this cache. Repeated disposal is safe.
	 *
	 * @returns No return value.
	 */
	dispose(): void;
}

/**
 * Provide synchronous resolved sampling for a resident CPU oracle cache.
 */
interface CpuScatteringCache extends ScatteringCache {
	/**
	 * Sample the cache from geometry-resolved physical position and direction
	 * stencils.
	 *
	 * @param request - Supplies resolved position and direction stencils.
	 * @returns The cumulative local spectral scattering density.
	 */
	sampleResolved(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
}

/**
 * Provide final-view shader assembly and opaque bindings for a GPU-resident
 * cumulative scattering cache.
 */
interface GpuScatteringCache extends ScatteringCache {
	/**
	 * Contribute source-specific final-view lookup code and bindings.
	 *
	 * @param request - Supplies the active final-view shader descriptor.
	 * @returns One or more runtime shader contributions.
	 */
	createShaderContribution(
		request: ShaderContributionRequest,
	): ShaderContribution | readonly ShaderContribution[];

	/**
	 * Return opaque runtime bindings for the privately owned cumulative field.
	 */
	getRuntimeBindings(): CacheRuntimeBindings;
}

/** Supply one renderer attachment's cache-construction capability. */
type CacheControllerRequest = Readonly<{
	/** Supply the renderer-owned cache backend. */
	backend: CacheGpuBackend;
	/** Optionally yield construction at executor-declared safe boundaries. */
	scheduler?: CacheBuildScheduler;
}>;

/** Own source-specific cache staging and publication for one runtime consumer. */
interface CacheController {
	/** Store the complete cache currently published to this consumer. */
	readonly active: GpuScatteringCache | null;

	/** Construct, reuse, and publish one complete source-owned cache. */
	createScatteringCache(
		request: ScatteringCacheBuildRequest,
	): Promise<GpuScatteringCache>;

	/** Cancel staging and release the active cache. */
	dispose(): void;
}
