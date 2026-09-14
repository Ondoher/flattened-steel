/** Constructor values for the production offline distant-Sun scene-cache compiler. */
type DistantSunSceneCacheOfflineCompilerDefinition = Readonly<{
	/** Absolute Chrome executable path used for WebGL2 construction. */
	readonly chromePath: string;
	/** Optional bounded compiler timeout in milliseconds. */
	readonly timeoutMilliseconds?: number;
}>;

/** One browser progress observation retained in the compiler report. */
type DistantSunSceneCacheCompilerProgress = Readonly<{
	/** Stable compiler stage. */
	readonly stage: string;
	/** Host timestamp in Unix milliseconds. */
	readonly time: number;
}>;

/** Browser execution result and diagnostics returned to the package writer. */
type DistantSunSceneCacheCompilerBrowserExecution = Readonly<{
	/** Decoded browser compiler result. */
	readonly result: Readonly<Record<string, unknown>>;
	/** Chrome diagnostic standard error. */
	readonly stderr: string;
}>;

/** Exact derivative buffers produced from the uncompressed W27 oracle. */
type DistantSunSceneCacheSeamEncoding = Readonly<{
	/** Unique-direction R32F payload bytes. */
	readonly payload: Buffer;
	/** Logical-direction to unique-direction Uint16 bytes. */
	readonly logicalToUniqueIndex: Buffer;
}>;

/** Request for one complete offline scene-cache package build. */
type DistantSunSceneCacheOfflineCompileRequest = DistantSunSceneCacheCompilerOptions &
	Readonly<{
		/** Absolute or process-relative path of a nonexistent output directory. */
		readonly outputDirectory: string;
		/** Exact scene to compile; omission selects the first qualified nautical scene. */
		readonly scene?: DistantSunSceneCacheCompilerScene;
	}>;

/** Compiler artifact before the runtime packager assigns a scalar selection interval. */
type DistantSunSceneCacheOfflineManifest = Omit<DistantSunSceneCacheManifestRecord, 'selection'>;

/** Complete result of one offline scene-cache package build. */
type DistantSunSceneCacheOfflineCompileResult = Readonly<{
	/** Absolute emitted package directory. */
	readonly outputDirectory: string;
	/** Content-addressed manifest filename. */
	readonly manifestPath: string;
	/** Manifest SHA-256 hash. */
	readonly manifestSha256: string;
	/** Complete manifest record. */
	readonly manifest: DistantSunSceneCacheOfflineManifest;
	/** Complete compiler report. */
	readonly report: Readonly<Record<string, unknown>>;
}>;
