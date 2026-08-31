/** Browser-compatible external asset-loader construction values. */
type DistantSunSceneCacheAssetLoaderDefinition = Readonly<{
	/** Externally owned immutable-texture backend. */ readonly backend: CacheGpuBackend;
	/** URL root containing one content-addressed package. */ readonly assetRoot: string;
	/** Optional fetch adapter for focused proofs. */ readonly fetch?: typeof fetch;
	/** Optional SHA-256 adapter for focused proofs. */ readonly subtleCrypto?: SubtleCrypto;
}>;

/** Exact material identities required before a scene cache can upload. */
type DistantSunSceneCacheExpectedCompatibility = Readonly<{
	readonly sceneSun: DistantSunSceneSunIdentity;
	readonly atmosphereIdentity: string;
	readonly geometryIdentity: string;
	readonly groundIdentity: string;
	readonly numericalIdentity: string;
}>;

/** Request for one exact content-addressed scene-cache package. */
type DistantSunSceneCacheLoadRequest = Readonly<{
	readonly manifestPath: string;
	readonly manifestSha256: string;
	readonly cacheIdentity: string;
	readonly expected: DistantSunSceneCacheExpectedCompatibility;
	readonly signal?: AbortSignal;
}>;
