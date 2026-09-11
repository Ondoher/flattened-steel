/** Accepted manifest surface retained by a resident scene cache. */
type DistantSunSceneCacheAcceptedManifest = Readonly<{
	/** Validated identity and payload sizes used by the resident resource. */ readonly record: DistantSunSceneCacheResidentManifestRecord;
	/** Require an exact compatibility identity. */ requireCacheIdentity(cacheIdentity: string): void;
}>;

/** Format-independent metadata consumed after an asset's own validation succeeds. */
type DistantSunSceneCacheResidentManifestRecord = Readonly<{
	/** Exact identity of the accepted asset. */ readonly cacheIdentity: string;
	/** Size of the unique-direction field. */ readonly exactSeamPayload: Pick<
		DistantSunSceneCacheManifestRecord['exactSeamPayload'],
		'byteLength'
	>;
	/** Size of the direction-index payload. */ readonly logicalToUniqueIndex: Pick<
		DistantSunSceneCacheManifestRecord['logicalToUniqueIndex'],
		'byteLength'
	>;
}>;

/** Construction values for one completely uploaded point-local scene cache. */
type DistantSunSceneCacheDefinition = Readonly<{
	/** Choose texture filtering or explicit shader bilinear weights; defaults to texture filtering. */ readonly directionInterpolation?:
		'texture-bilinear' | 'shader-bilinear';
	/** Explicit atlas channel count; omitted for the established Native15 package. */ readonly spectralChannelCount?: number;
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
