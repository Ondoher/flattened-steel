/** Completed local-Sun field with cache-owned opaque binding and resource lifetime. */
class LocalSunCache implements GpuScatteringCache {
	/** Creates a cache that takes ownership of the completed artifact. */
	constructor(
		artifact: CacheBuildArtifact,
		resources: LocalSunCacheResourceReport | LocalSunCompactGpuResourceReport,
	);
	/** Actual construction and retained logical payload. */
	readonly resources: LocalSunCacheResourceReport | LocalSunCompactGpuResourceReport;
	/** Call this method to return backend-owned opaque field bindings. */
	getRuntimeBindings(): CacheRuntimeBindings;
	/** Call this method to contribute ordinary cumulative density lookup. */
	createShaderContribution(): ShaderContribution;
	/** Call this method to release the owned field and binding exactly once. */
	dispose(): void;
}
