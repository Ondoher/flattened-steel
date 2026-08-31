/** Accepted manifest surface retained by a resident scene cache. */
type DistantSunSceneCacheAcceptedManifest = Readonly<{
	/** Fully validated external record. */ readonly record: DistantSunSceneCacheManifestRecord;
	/** Require an exact compatibility identity. */ requireCacheIdentity(cacheIdentity: string): void;
}>;

/** Construction values for one completely uploaded point-local scene cache. */
type DistantSunSceneCacheDefinition = Readonly<{
	/** Accepted exact manifest. */ readonly manifest: DistantSunSceneCacheAcceptedManifest;
	/** Accepted executable packed-row ledger. */ readonly ledger: DistantSunSceneCacheLedger;
	/** Uploaded exact-seam RGBA32F channel groups. */ readonly cumulativeTexture: CacheImmutableTexture;
	/** Uploaded logical-W27 to unique-direction R16UI index. */ readonly directionIndexTexture: CacheImmutableTexture;
}>;

/** Logical resource payloads owned while one exact scene cache is loaded. */
type DistantSunSceneCacheResourceReport = Readonly<{
	/** Immutable RGBA32F and R16UI texture texels, excluding opaque driver overhead. */
	readonly residentTextureBytes: UnitValue<'bytes'>;
	/** Validated typed-array payload retained through candidate upload. */
	readonly hostStagingBytes: UnitValue<'bytes'>;
}>;
