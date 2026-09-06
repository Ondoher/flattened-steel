/** Definition of one cumulative distant-Sun CPU scattering field. */
type DistantSunCpuCumulativeFieldDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Highest cumulative internal target order; order 3 remains non-publishable. */
	cumulativeThroughOrder: number;
	/** Optional field provenance identity. */
	provenanceIdentity?: string;
	/** Executable production domain selected by the retained profile. */
	domainSelection: DistantSunConstructionDomainSelection;
}>;

/** Normalized metadata for distant-Sun CPU field allocation. */
type DistantSunCpuFieldBuildDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Source-owned executable field packing. */
	packing: DistantSunFieldPacking;
	/** Pure or cumulative scattering order. */
	order: SpectralFieldOrderDefinition;
	/** Optional field provenance identity when it differs from the production default. */
	provenanceIdentity?: string;
	/** Executable domain selection used by the provider allocator. */
	domainSelection: DistantSunConstructionDomainSelection;
}>;

/**
 * Type used by distant-Sun CPU recurrence orchestration to build one transported- radiance order from sealed pure scattering density. Production binds this callback to the source-owned physical transport evaluator; focused orchestration tests may supply a deterministic implementation.
 *
 * @param request - The sealed scattering field, order, and output identity.
 * @returns - The constructed pure-radiance field.
 *
 */
type DistantSunCpuTransportedRadianceBuilder =
	/**
	 * Called by distant sun cpu transported radiance builder to handle one invocation of the declared operation.
	 * @param request - The request accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (request: CpuTransportedRadianceBuildRequest) => CpuDirectionalSpectralFieldContract;

/** Recurrence operations used after source-specific J1 and L1. */
type DistantSunCpuCacheOperations = Readonly<{
	/**
	 * Call this method to create each pure L(k-1) to Jk scattering-density
	 * kernel synchronously.
	 *
	 * @param request - The scattering-order and ground-illumination request.
	 * @returns - The configured scattering-order kernel.
	 */
	createScatteringKernel(request: CpuScatteringKernelBuildRequest): ScatteringOrderKernel;
	/** Numerical implementation identity of the supplied kernel. */
	scatteringProvenanceIdentity: string;
	/**
	 * Value used by recurrence orchestration to build J2 to L2 and J3 to L3 when the selected graph requires them.
	 *
	 * @param request - The sealed scattering field, order, and output identity.
	 * @returns - The constructed pure-radiance field.
	 *
	 */
	buildTransportedRadiance?: DistantSunCpuTransportedRadianceBuilder;
}>;

/** Internal source-owned N=1 recurrence request. */
type DistantSunCpuCacheBuildRequestN1 = DistantSunCpuCacheBuildRequestBase &
	Readonly<{
		/** Explicit J1-only pass-graph selection. */
		maximumScatteringOrder: 1;
		/** N=1 accepts no unused later-order operation seam. */
		operations?: never;
	}>;

/** Internal source-owned N=2 recurrence request. */
type DistantSunCpuCacheBuildRequestN2 = DistantSunCpuCacheMultipleScatteringBuildRequestBase &
	Readonly<{
		/** Explicit J1, L1, and J2 pass-graph selection. */
		maximumScatteringOrder: 2;
		/** Pure-scattering kernel operations; transport remains unused. */
		operations: DistantSunCpuCacheOperations;
	}>;

/** Internal source-owned higher-order recurrence request. */
type DistantSunCpuCacheBuildRequestN4 = DistantSunCpuCacheMultipleScatteringBuildRequestBase &
	Readonly<{
		/** Explicit J1-through-J3, J4, or J5 pass-graph selection. */
		maximumScatteringOrder: 3 | 4 | 5;
		/** Complete later-order recurrence operations. */
		operations: DistantSunCpuCacheOperations &
			Readonly<{
				/**
				 * Value used by N4 recurrence orchestration to build stored-field radiance for the next scattering order.
				 *
				 * @param request - The sealed scattering field, order, and output identity.
				 * @returns - The constructed pure-radiance field.
				 *
				 */
				buildTransportedRadiance: DistantSunCpuTransportedRadianceBuilder;
			}>;
	}>;

/** Any supported internal source-owned CPU recurrence request. */
type DistantSunCpuCacheBuildRequest =
	DistantSunCpuCacheBuildRequestN1 | DistantSunCpuCacheBuildRequestN2 | DistantSunCpuCacheBuildRequestN4;

/** Complete N4 recurrence operations supplied by the cache provider. */
type DistantSunCpuFourthOrderCacheOperations = DistantSunCpuCacheOperations &
	Readonly<{
		/**
		 * Value used by N4 recurrence orchestration to build stored-field radiance for the next scattering order.
		 *
		 * @param request - The sealed scattering field, order, and output identity.
		 * @returns - The constructed pure-radiance field.
		 *
		 */
		buildTransportedRadiance: DistantSunCpuTransportedRadianceBuilder;
	}>;

/** Source-owned physical collaborators captured by CPU recurrence methods. */
type DistantSunCpuRecurrenceContext = Readonly<{
	/** Accepted public multiple-scattering request. */
	request:
		| DistantSunCpuCacheRequestN2
		| DistantSunCpuCacheRequestN3
		| DistantSunCpuCacheRequestN4
		| DistantSunCpuCacheRequestN5;
	/** Accepted executable position and direction domains. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Accepted executable path-integration interval count. */
	transportIntervalCount: number;
	/** Source-created shared spectral calculator. */
	calculator: SpectralCalculator;
	/** Accepted explicit or omitted-boundary default profile. */
	profile: Algorithm32ExecutionProfile;
}>;

/** Completed pure fields and identities used to assemble the cumulative result. */
type DistantSunCpuCumulativeResultRequest = Readonly<{
	/** Final scattering order of the completed recurrence. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Pure scattering-density fields in ascending order. */
	pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
	/** Boundary-dependent suffix retained by every field identity. */
	boundaryIdentitySuffix: string;
	/** Executable construction-domain selection. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Executed path-integration interval count. */
	transportIntervalCount: number;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Sealed cumulative field and executed construction options. */
type DistantSunCpuCumulativeResult = Readonly<{
	/** Final sealed cumulative scattering-density field. */
	cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Cache-construction options that completed. */
	options: CacheConstructionOptions;
}>;
