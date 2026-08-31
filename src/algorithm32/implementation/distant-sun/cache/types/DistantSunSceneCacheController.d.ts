/** Exact prebuilt scene-cache selection retained by one distant-Sun source. */
type DistantSunSceneCacheAssetSelection = Readonly<{
	/** Static URL root containing the complete content-addressed package. */ readonly assetRoot: string;
	/** Exact load and compatibility request, excluding per-attempt cancellation. */ readonly loadRequest: Omit<
		DistantSunSceneCacheLoadRequest,
		'signal'
	>;
}>;

/** Construction values for one attachment-owned asset controller. */
type DistantSunSceneCacheControllerDefinition = Readonly<{
	readonly backend: CacheGpuBackend;
	readonly asset: DistantSunSceneCacheAssetSelection;
	/** Optional focused-proof loader factory; ordinary production uses the exact asset loader. */
	readonly loaderFactory?: DistantSunSceneCacheLoaderFactory;
}>;

/** Minimum complete-cache loader behavior consumed transactionally by the controller. */
type DistantSunSceneCacheLoader = Readonly<{
	load(request: DistantSunSceneCacheLoadRequest): Promise<import('../DistantSunSceneCache.js').default>;
}>;

/** Create one loader scoped to an exact asset root. */
type DistantSunSceneCacheLoaderFactory = (asset: DistantSunSceneCacheAssetSelection) => DistantSunSceneCacheLoader;

/** Optional cancellation supplied to one controller publication generation. */
type DistantSunSceneCachePublicationRequest = Readonly<{readonly signal?: AbortSignal}>;

/** Logical resource limits and last completed transition measured by the controller. */
type DistantSunSceneCacheControllerResourceReport = Readonly<{
	readonly maximumResidentTextureBytes: UnitValue<'bytes'>;
	readonly maximumAtomicTransitionTextureBytes: UnitValue<'bytes'>;
	readonly maximumTransitionWithStagingBytes: UnitValue<'bytes'>;
	readonly activeResidentTextureBytes: UnitValue<'bytes'>;
	readonly lastTransitionTextureBytes: UnitValue<'bytes'>;
	readonly lastTransitionWithStagingBytes: UnitValue<'bytes'>;
}>;
