/** Explicit terminal run disposition. */
// - **"accepted"** - Declared proof gates passed.
// - **"rejected"** - Completed comparison rejected the hypothesis.
// - **"failed"** - Execution could not establish the proof.
// - **"interrupted"** - Execution was deliberately interrupted.
type CacheReuseTerminalState = 'accepted' | 'rejected' | 'failed' | 'interrupted';
/** Progress event appended to the open run. */
type CacheReuseProgress = {
	/** Current operation. */ phase: string;
	/** Human-readable activity. */ message: string;
	/** Finished items when countable. */ completed?: number;
	/** Requested items when countable. */ total?: number;
	/** Final disposition only at termination. */ state?: CacheReuseTerminalState;
};
/** Scene request whose configuration identity authenticates all numerical dependencies. */
type CacheReuseSceneRequest = {
	/** Caller-owned scene identity. */ id: string;
	/** Complete numerical configuration identity, never inferred from time proximity. */ configurationIdentity: string;
	/** Ordered altitude/Sun-angle index pairs. */ coordinates: readonly (readonly number[])[];
};
/** Shared work inventory and original request ordering. */
type CacheReusePlan = {
	/** Unique coordinate operations under complete configuration identities. */ inventory: {
		/** Numerical dependency identity. */ configurationIdentity: string;
		/** Altitude and Sun-angle indexes. */ coordinate: number[];
	}[];
	/** Requested scene maps, preserving duplicates and order. */ scenes: {
		/** Original scene identity. */ id: string;
		/** Ordered indexes into inventory. */ slots: number[];
	}[];
	/** Total requested rows before deduplication. */ requestedRows: number;
};

/** Texture layout and optional initialization data. */
type CacheReuseTextureSpec = {
	/** Texel width. */ width: number;
	/** Texel height. */ height: number;
	/** WebGL storage format, default R32F. */ internalFormat?: number;
	/** WebGL channel format, default RED. */ format?: number;
	/** WebGL scalar type, default FLOAT. */ type?: number;
	/** Uploaded values, or fully overwritten scratch allocation. */ data?: Float32Array | Int32Array | null;
};

/** Authenticated application control graph and numerical baseline. */
type CacheReuseControls = {
	/** Immutable qualified run path. */ root: string;
	/** Qualified package acceptance and measurement record. */ acceptance: Record<string, any>;
	/** Authenticated parent records keyed by evidence role. */ parents: Record<string, any>;
	/** Original scene metadata and union coordinates. */ inventory: SharedGenerationInventory;
	/** Authenticated shared package metadata graph. */ graph: SharedGenerationGraph;
};

/** Explicit GPU job with input-driven channel selection. */
type CacheReuseGpuJob = {
	/** Requested calculation identity. */ id: string;
	/** Complete numerical compiler input. */ buildRequest?: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordered packed output row layout. */ ledger?: Pick<
		DistantSunSceneCacheLedgerRecord,
		'rows' | 'retainedBlockCount'
	>;
	/** Requested channel indexes. */ wavelengths: number[];
};

/** Capability-scoped proof host inputs. */
type CacheReuseHostOptions = {
	/** Run owner, including immutable output and progress. */ run: CacheReuseRun;
	/** Ordered execution jobs. */ jobs: CacheReuseGpuJob[];
	/** Exact allowlisted browser source bytes. */ sources: Map<string, string | Buffer>;
	/** Validating sink for job, channel, row and bounded bytes. */ acceptTile: (
		job: number,
		channel: number,
		row: number,
		bytes: Buffer,
	) => Promise<void>;
	/** Caller cancellation. */ signal: AbortSignal;
	/** Overall execution deadline in milliseconds. */ maximumMilliseconds?: number;
};

/** Evidence-run capability used by controls, sinks, and hosts. */
interface CacheReuseRun {
	/** Repository-contained filesystem capability. */ files: SharedGenerationFiles;
	/** Current exclusive output directory. */ root: string;
	/** Scientific artifacts to be sealed. */ artifacts: DistantSunSharedCacheFileIdentity[];
	/** Call this method to authenticate and register a parent. */
	read(relative: string, expected?: DistantSunSharedCacheFileIdentity | null, maximum?: number): Promise<Buffer>;
	/** Call this method to persist an exclusive JSON or byte artifact. */
	write(name: string, value: unknown): Promise<DistantSunSharedCacheFileIdentity>;
	/** Call this method to flush progress. */
	progress(event: CacheReuseProgress): void;
}

/** Completed browser job measurements. */
type CacheReuseGpuResult = {
	/** Successful browser completion; sinks independently establish exactness. */ accepted: boolean;
	/** Complete ordered job diagnostics. */ jobs: Record<string, unknown>[];
	/** Numeric allocation and reuse counters. */ stats: Record<string, number>;
	/** Browser elapsed time including tile delivery and host comparisons. */ elapsedMilliseconds: number;
	/** Texture residency after release. */ finalResidentBytes: number;
};

/** Authenticated persisted union and its exact addressing layout. */
type CacheReusePersistedDefinition = {
	/** Complete numerical dependency identity. */ configurationIdentity: string;
	/** Authenticated payload identity. */ artifact: DistantSunSharedCacheFileIdentity;
	/** Ordered row coordinates. */ coordinates: readonly (readonly number[])[];
	/** Spectral channel count. */ channels: number;
	/** Byte width of a single unique-direction row. */ rowBytes: number;
};

/** Verified scientific artifact set plus supplemental retained-workspace identities. */
type CacheReuseVerifiedRun = {
	/** Immutable parent run path. */ root: string;
	/** All declared artifact checks passed. */ accepted: boolean;
	/** Number of original scientific artifacts. */ scientificArtifactCount: number;
	/** Number of all retained ordinary files. */ retainedFileCount: number;
	/** Total retained bytes, including runtime workspace. */ retainedBytes: number;
	/** Measured identities without mutating the source run. */ identities: DistantSunSharedCacheFileIdentity[];
	/** Original result, not a new numerical acceptance decision. */ result: unknown;
	/** Precise verifier claim and limitations. */ scope: string;
};
