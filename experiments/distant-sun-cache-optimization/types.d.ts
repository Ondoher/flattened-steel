/** Scalar value supported by JSON. */
type CacheOptimizationJsonScalar = string | number | boolean | null;

/** Recursively serializable JSON value. */
type CacheOptimizationJsonValue =
	| CacheOptimizationJsonScalar
	| readonly CacheOptimizationJsonValue[]
	| {[key: string]: CacheOptimizationJsonValue};

/** Named JSON object boundary whose properties are recursively serializable. */
type CacheOptimizationJsonObject = {
	/** JSON property selected by its schema-owned name. */
	[key: string]: CacheOptimizationJsonValue;
};

/** Immutable identity of one contained file. */
type CacheOptimizationFileIdentity = Readonly<{
	/** Normalized path relative to the identity owner's root. */
	path: string;
	/** Exact file length in bytes. */
	byteLength: number;
	/** Lowercase hexadecimal SHA-256 of the file bytes. */
	sha256: string;
}>;

/** Current Git identity recorded without changing Git state. */
type CacheOptimizationGitIdentity = Readonly<{
	/** Full starting commit identity. */
	commit: string;
	/** Porcelain records for every changed or untracked path. */
	worktreeStatus: readonly string[];
}>;

/** Definition used to initialize one immutable experiment run. */
type CacheOptimizationExperimentRunDefinition = Readonly<{
	/** Descriptive kebab-case suffix for the allocated run identity. */
	slug: string;
	/** Exact command that owns the run. */
	command: string;
	/** Pinned input contract serialized into the run. */
	inputs: CacheOptimizationJsonObject;
	/** Derivation and implementation identities serialized into the run. */
	provenance: CacheOptimizationJsonObject;
	/** Execution-environment identity serialized into the run. */
	environment: CacheOptimizationJsonObject;
	/** Documentary and comparison identities serialized into the run. */
	references: CacheOptimizationJsonObject;
}>;

/**
 * Terminal conclusion for an immutable experiment run.
 *
 * - **"accepted"** - The run satisfied every declared gate.
 * - **"rejected"** - The run completed and missed a candidate gate.
 * - **"failed"** - Infrastructure or execution prevented a valid comparison.
 * - **"interrupted"** - Cancellation ended the run before comparison.
 */
type CacheOptimizationExperimentRunConclusion = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/** Minimum terminal result required before sealing. */
type CacheOptimizationTerminalResult = CacheOptimizationJsonObject & Readonly<{
	/** Versioned schema identity for the result payload. */
	schemaId: string;
	/** Owning immutable run identity. */
	runId: string;
	/** Terminal lifecycle conclusion. */
	conclusion: CacheOptimizationExperimentRunConclusion;
	/** Whether and only whether the conclusion is accepted. */
	accepted: boolean;
}>;

/** Final values used to seal one immutable experiment run. */
type CacheOptimizationExperimentRunFinalization = Readonly<{
	/** Terminal lifecycle conclusion. */
	conclusion: CacheOptimizationExperimentRunConclusion;
	/** Machine-readable terminal result owned by the run. */
	result: CacheOptimizationTerminalResult;
	/** Human-readable Markdown terminal report. */
	report: string;
}>;

/** Optional countable progress associated with one run phase. */
type CacheOptimizationExperimentProgressCount = Readonly<{
	/** Completed work items. */
	completed: number;
	/** Total work items expected for the phase. */
	total: number;
}>;

/** Identity and path of one initialized experiment run. */
type CacheOptimizationExperimentRunIdentity = Readonly<{
	/** Allocated six-digit-prefixed run identity. */
	runId: string;
	/** Absolute directory exclusively owned by the open run. */
	runDirectory: string;
}>;

/** Transactional publisher for the monotonic run counter. */
interface CacheOptimizationRunCounterPublisher {
	(counterPath: string, temporaryCounterPath: string, next: number): Promise<void>;
}

/** Scheduler used by the heartbeat owner to acquire a cancellable interval. */
interface CacheOptimizationHeartbeatScheduler {
	(callback: () => void, intervalMilliseconds: number): () => void;
}

/** Exclusive writer used for one uniquely owned terminal temporary file. */
interface CacheOptimizationTerminalFileWriter {
	(path: string, value: string, options: CacheOptimizationExclusiveWriteOptions): Promise<void>;
}

/** Exclusive-create options passed to the terminal temporary-file writer. */
type CacheOptimizationExclusiveWriteOptions = Readonly<{
	/** Node exclusive-create write flag. */
	flag: 'wx';
}>;

/** Atomic rename used to publish one terminal file. */
interface CacheOptimizationTerminalFileRenamer {
	(source: string, target: string): Promise<void>;
}

/** Cleanup operation for one uniquely owned terminal temporary file. */
interface CacheOptimizationTerminalFileRemover {
	(target: string): Promise<void>;
}

/** Deployed package-set report fields consumed by C0. */
type CacheOptimizationPackageReport = CacheOptimizationJsonObject & Readonly<{
	/** Versioned deployed package-report schema identity. */
	schemaId: string;
	/** Accepted production qualification state. */
	accepted: true;
	/** Package-root-relative runtime catalog path. */
	catalogPath: string;
	/** SHA-256 of the runtime catalog bytes. */
	catalogSha256: string;
	/** Number of deployed scene packages. */
	packageCount: number;
	/** Sum of complete package bytes. */
	totalByteLength: number;
	/** Number of distinct shared coordinate identities. */
	sharedCoordinateHashCount: number;
}>;

/** Measurement inventory values frozen before C0 execution. */
type CacheOptimizationMeasurementInventory = CacheOptimizationJsonObject & Readonly<{
	/** Number of deployed scene packages. */
	packageCount: number;
	/** Number of distinct cache coordinates. */
	distinctCoordinateCount: number;
	/** Expected deployed package bytes. */
	expectedTotalByteLength: number;
	/** Required artifact identity categories. */
	requiredIdentityChecks: readonly CacheOptimizationRequiredIdentityCheck[];
}>;

/**
 * Required production artifact identity category.
 *
 * - **"catalog"** - Runtime catalog identity.
 * - **"package-report"** - Package-set report identity.
 * - **"scene-manifest"** - Per-scene manifest identity.
 * - **"row-ledger"** - Packed-row ledger identity.
 * - **"spectral-payload"** - Exact spectral payload identity.
 * - **"logical-to-unique-index"** - Logical-index mapping identity.
 */
type CacheOptimizationRequiredIdentityCheck =
	| 'catalog'
	| 'package-report'
	| 'scene-manifest'
	| 'row-ledger'
	| 'spectral-payload'
	| 'logical-to-unique-index';

/**
 * Frozen runtime-scenario identity.
 *
 * - **"cold-90"** - Initial 90-degree load.
 * - **"exact-reuse-90"** - Same-identity reuse.
 * - **"adjacent-91"** - Adjacent replacement.
 * - **"nonadjacent-30"** - Nonadjacent replacement.
 * - **"warm-90"** - Warm return replacement.
 * - **"failed-replacement"** - Last-good failure case.
 * - **"superseded-91-by-92"** - In-flight supersession case.
 * - **"caller-cancelled-93"** - Caller cancellation case.
 * - **"context-restoration-92"** - WebGL restoration case.
 * - **"dark-boundary"** - Resolver darkness-boundary case.
 */
type CacheOptimizationRuntimeScenarioId =
	| 'cold-90'
	| 'exact-reuse-90'
	| 'adjacent-91'
	| 'nonadjacent-30'
	| 'warm-90'
	| 'failed-replacement'
	| 'superseded-91-by-92'
	| 'caller-cancelled-93'
	| 'context-restoration-92'
	| 'dark-boundary';

/**
 * Frozen runtime-scenario operation kind.
 *
 * - **"cold-load"** - Initial load.
 * - **"same-identity-reuse"** - Reuse without replacement.
 * - **"replacement"** - Changed-identity replacement.
 * - **"warm-replacement"** - Replacement with warm metadata.
 * - **"last-good-preservation"** - Failed replacement retaining the active cache.
 * - **"in-flight-supersession"** - Later work superseding earlier work.
 * - **"in-flight-cancellation"** - Caller cancellation before publication.
 * - **"webgl-context-cycle"** - Context loss and restoration.
 * - **"resolver-boundary"** - Ready-to-dark resolver transition.
 */
type CacheOptimizationRuntimeScenarioKind =
	| 'cold-load'
	| 'same-identity-reuse'
	| 'replacement'
	| 'warm-replacement'
	| 'last-good-preservation'
	| 'in-flight-supersession'
	| 'in-flight-cancellation'
	| 'webgl-context-cycle'
	| 'resolver-boundary';

/** One lifecycle scenario frozen by the C0 measurement contract. */
type CacheOptimizationRuntimeScenario = CacheOptimizationJsonObject & Readonly<{
	/** Stable scenario identity and result-stage key. */
	id: CacheOptimizationRuntimeScenarioId;
	/** Human-readable lifecycle operation kind. */
	kind: CacheOptimizationRuntimeScenarioKind;
	/** Solar-zenith input or ordered inputs in degrees. */
	solarZenithDegrees: number | readonly number[];
}>;

/** Metric names grouped by comparison dimension. */
type CacheOptimizationMeasurementVocabulary = CacheOptimizationJsonObject & Readonly<{
	/** Canonical unavailable metric representation. */
	unavailableValue: null;
	/** Stored-artifact metric names. */
	storage: readonly CacheOptimizationStorageMeasurementName[];
	/** HTTP transport metric names. */
	transport: readonly CacheOptimizationTransportMeasurementName[];
	/** Browser and host latency metric names. */
	latency: readonly CacheOptimizationLatencyMeasurementName[];
	/** Codec-stage metric names. */
	codec: readonly CacheOptimizationCodecMeasurementName[];
	/** Browser, process, GPU, Worker, and staging-memory metric names. */
	memory: readonly CacheOptimizationMemoryMeasurementName[];
	/** Offline generation-stage metric names. */
	generation: readonly CacheOptimizationGenerationMeasurementName[];
	/** Exact reconstruction metric names. */
	exactness: readonly CacheOptimizationExactnessMeasurementName[];
}>;

/**
 * Frozen storage metric name.
 *
 * - **"artifactCount"** - Complete stored artifact count.
 * - **"byteLength"** - Complete stored byte length.
 */
type CacheOptimizationStorageMeasurementName = 'artifactCount' | 'byteLength';
/**
 * Frozen transport metric name.
 *
 * - **"requestCount"** - Completed request count.
 * - **"responseByteLength"** - Completed response bytes.
 * - **"uniqueRequestCount"** - Distinct requested paths.
 */
type CacheOptimizationTransportMeasurementName = 'requestCount' | 'responseByteLength' | 'uniqueRequestCount';
/**
 * Frozen latency metric name.
 *
 * - **"browserElapsedMilliseconds"** - Browser-observed duration.
 * - **"hostWallMilliseconds"** - Host-observed wall duration.
 */
type CacheOptimizationLatencyMeasurementName = 'browserElapsedMilliseconds' | 'hostWallMilliseconds';
/**
 * Frozen codec metric name.
 *
 * - **"encodeMilliseconds"** - Compression duration.
 * - **"decodeMilliseconds"** - Decompression duration.
 * - **"inverseShuffleMilliseconds"** - Reversible unshuffle duration.
 * - **"workerQueueMilliseconds"** - Worker scheduling delay.
 */
type CacheOptimizationCodecMeasurementName =
	| 'encodeMilliseconds'
	| 'decodeMilliseconds'
	| 'inverseShuffleMilliseconds'
	| 'workerQueueMilliseconds';
/**
 * Frozen memory and resource metric name.
 *
 * - **"browserHeapBeforeBytes"** - Browser heap before work.
 * - **"browserHeapAfterBytes"** - Browser heap after work.
 * - **"peakBrowserHeapBytes"** - Peak sampled browser heap.
 * - **"peakWorkerHeapBytes"** - Peak Worker heap.
 * - **"peakProcessResidentBytes"** - Peak Node resident set.
 * - **"peakProcessHeapBytes"** - Peak Node heap.
 * - **"peakGpuResidentBytes"** - Peak logical GPU residency.
 * - **"peakDiskStagingBytes"** - Peak staging-disk use.
 * - **"activeResidentTextureBytes"** - Final active texture residency.
 * - **"lastTransitionTextureBytes"** - Final transition texture bytes.
 * - **"lastTransitionWithStagingBytes"** - Final transition and staging bytes.
 */
type CacheOptimizationMemoryMeasurementName =
	| 'browserHeapBeforeBytes'
	| 'browserHeapAfterBytes'
	| 'peakBrowserHeapBytes'
	| 'peakWorkerHeapBytes'
	| 'peakProcessResidentBytes'
	| 'peakProcessHeapBytes'
	| 'peakGpuResidentBytes'
	| 'peakDiskStagingBytes'
	| 'activeResidentTextureBytes'
	| 'lastTransitionTextureBytes'
	| 'lastTransitionWithStagingBytes';
/**
 * Frozen generation metric name.
 *
 * - **"setupMilliseconds"** - Generator setup duration.
 * - **"calculationMilliseconds"** - Field calculation duration.
 * - **"readbackMilliseconds"** - GPU readback duration.
 * - **"stagingMilliseconds"** - Disk staging duration.
 * - **"encodingMilliseconds"** - Encoding duration.
 * - **"validationMilliseconds"** - Validation duration.
 * - **"publicationMilliseconds"** - Publication duration.
 * - **"totalMilliseconds"** - Complete generation duration.
 */
type CacheOptimizationGenerationMeasurementName =
	| 'setupMilliseconds'
	| 'calculationMilliseconds'
	| 'readbackMilliseconds'
	| 'stagingMilliseconds'
	| 'encodingMilliseconds'
	| 'validationMilliseconds'
	| 'publicationMilliseconds'
	| 'totalMilliseconds';
/**
 * Frozen exactness metric name.
 *
 * - **"checkedByteLength"** - Bytes covered by authentication.
 * - **"expectedSha256"** - Expected content identity.
 * - **"actualSha256"** - Recomputed content identity.
 * - **"matches"** - Exact identity equality result.
 */
type CacheOptimizationExactnessMeasurementName =
	| 'checkedByteLength'
	| 'expectedSha256'
	| 'actualSha256'
	| 'matches';

/**
 * Frozen qualitative candidate requirement.
 *
 * - **"exact decoded reconstruction"** - Preserve every decoded byte.
 * - **"bounded allocation before decode"** - Reject oversized allocation before decoding.
 * - **"subscriber-isolated cancellation"** - Cancel one subscriber independently.
 * - **"stale-result rejection"** - Reject superseded asynchronous results.
 * - **"last-good transactional publication"** - Preserve the active cache until complete replacement.
 * - **"texture-free darkness at and above 108 degrees"** - Retain the production dark boundary.
 */
type CacheOptimizationNonNegotiableRequirement =
	| 'exact decoded reconstruction'
	| 'bounded allocation before decode'
	| 'subscriber-isolated cancellation'
	| 'stale-result rejection'
	| 'last-good transactional publication'
	| 'texture-free darkness at and above 108 degrees';

/** Quantitative candidate limits frozen before experimentation. */
type CacheOptimizationCandidateBounds = CacheOptimizationJsonObject & Readonly<{
	/** Maximum complete deployed candidate bytes. */
	completeDeployedByteLengthMaximum: number;
	/** Maximum complete offline generation time in milliseconds. */
	completeGenerationMillisecondsMaximum: number;
	/** Maximum decoded bytes for one block. */
	decodedBlockByteLengthMaximum: number;
	/** Target total retained decoded-block bytes. */
	decodedRetentionTargetBytes: number;
}>;

/** Frozen C0 metric vocabulary, scenarios, and availability policy. */
type CacheOptimizationMeasurementContract = CacheOptimizationJsonObject & Readonly<{
	/** Versioned measurement-contract schema identity. */
	schemaId: string;
	/** Human-readable purpose and comparison scope. */
	purpose: string;
	/** Frozen production inventory expectations. */
	inventory: CacheOptimizationMeasurementInventory;
	/** Ten required production lifecycle scenarios in execution order. */
	runtimeScenarios: readonly CacheOptimizationRuntimeScenario[];
	/** Metric names grouped by comparison dimension. */
	measurements: CacheOptimizationMeasurementVocabulary;
	/** Rule governing explicit unavailable measurements. */
	availabilityRule: string;
	/** Quantitative acceptance limits for optimization candidates. */
	candidateBounds: CacheOptimizationCandidateBounds;
	/** Qualitative requirements that no candidate may trade away. */
	nonNegotiable: readonly CacheOptimizationNonNegotiableRequirement[];
}>;

/** Deployed catalog entry consumed by C0. */
type CacheOptimizationCatalogEntry = CacheOptimizationJsonObject & Readonly<{
	/** Stable package identity. */
	id: string;
	/** Representative solar-zenith angle in degrees. */
	representativeSolarZenithDegrees: number;
	/** Catalog-root-relative package directory ending with a separator. */
	assetPath: string;
	/** Package-relative scene-manifest path. */
	manifestPath: string;
	/** SHA-256 of the scene manifest. */
	manifestSha256: string;
	/** Expected production cache identity. */
	cacheIdentity: string;
	/** Production loader expectations passed through unchanged. */
	expected: DistantSunSceneCacheExpectedCompatibility;
	/** Complete package length in bytes. */
	byteLength: number;
}>;

/** Deployed runtime catalog consumed by C0. */
type CacheOptimizationRuntimeCatalog = CacheOptimizationJsonObject & Readonly<{
	/** Versioned runtime-catalog schema identity. */
	schemaId: string;
	/** Accepted production qualification state. */
	accepted: true;
	/** Solar-zenith boundary at which the resolver selects darkness, in degrees. */
	darkFromSolarZenithDegrees: number;
	/** Ordered deployed package entries. */
	packages: readonly CacheOptimizationCatalogEntry[];
}>;

/** Production artifact reference authenticated by C0. */
type CacheOptimizationProductionArtifact = CacheOptimizationJsonObject & CacheOptimizationFileIdentity;

/** Scene manifest fields consumed by C0. */
type CacheOptimizationSceneManifest = CacheOptimizationJsonObject & Readonly<{
	/** Versioned scene-manifest schema identity. */
	schemaId: string;
	/** Content-derived production cache identity. */
	cacheIdentity: string;
	/** Package-relative packed-row-ledger path. */
	ledgerPath: string;
	/** SHA-256 of the packed-row ledger. */
	ledgerSha256: string;
	/** Exact spectral payload identity. */
	exactSeamPayload: CacheOptimizationProductionArtifact;
	/** Logical-to-unique index identity. */
	logicalToUniqueIndex: CacheOptimizationProductionArtifact;
}>;

/** Packed ledger row fields consumed by C0. */
type CacheOptimizationLedgerRow = CacheOptimizationJsonObject & Readonly<{
	/** Zero-based altitude coordinate index. */
	altitudeIndex: number;
	/** First inclusive solar-zenith coordinate index. */
	firstSolarZenithIndex: number;
	/** Last inclusive solar-zenith coordinate index. */
	lastSolarZenithIndex: number;
	/** Number of packed spectral rows represented by the ledger row. */
	packedRowCount: number;
}>;

/** Packed row ledger consumed by C0. */
type CacheOptimizationRowLedger = CacheOptimizationJsonObject & Readonly<{
	/** Versioned packed-ledger schema identity. */
	schemaId: string;
	/** Ordered altitude spans represented by the package payload. */
	rows: readonly CacheOptimizationLedgerRow[];
}>;

/** One authenticated deployed package retained by the C0 inventory. */
type CacheOptimizationInventoryPackage = CacheOptimizationJsonObject & Readonly<{
	/** Stable package identity. */
	id: string;
	/** Representative solar-zenith angle in degrees. */
	representativeSolarZenithDegrees: number;
	/** Catalog-root-relative package directory. */
	assetPath: string;
	/** Content-derived cache identity. */
	cacheIdentity: string;
	/** Complete package size in bytes. */
	byteLength: number;
	/** Number of logical spectral rows. */
	rowCount: number;
	/** Scene-manifest content identity. */
	manifest: CacheOptimizationFileIdentity;
	/** Packed-row-ledger content identity. */
	ledger: CacheOptimizationFileIdentity;
	/** Exact spectral-payload content identity. */
	payload: CacheOptimizationFileIdentity;
	/** Logical-to-unique-index content identity. */
	logicalToUniqueIndex: CacheOptimizationFileIdentity;
}>;

/** Complete authenticated inventory retained as immutable C0 evidence. */
type CacheOptimizationInventoryPins = CacheOptimizationJsonObject & Readonly<{
	/** Versioned inventory schema identity. */
	schemaId: string;
	/** Accepted inventory-authentication state. */
	accepted: true;
	/** Number of deployed packages. */
	packageCount: number;
	/** Sum of package bytes. */
	totalByteLength: number;
	/** Number of stored logical row occurrences. */
	rowOccurrenceCount: number;
	/** Number of distinct coordinate identities. */
	distinctCoordinateCount: number;
	/** Exact bytes per spectral row. */
	rowByteLength: number;
	/** Inventory authentication wall time in milliseconds. */
	elapsedMilliseconds: number;
	/** Per-package authenticated identities. */
	packages: readonly CacheOptimizationInventoryPackage[];
}>;

/** Production loader request sent to the browser control. */
type CacheOptimizationBrowserLoadRequest = Readonly<Omit<DistantSunSceneCacheLoadRequest, 'signal'>>;

/** Browser asset request derived from one deployed catalog entry. */
type CacheOptimizationBrowserAsset = Readonly<{
	/** Proof-host URL root for the selected package. */
	assetRoot: string;
	/** Production loader request for the selected package. */
	loadRequest: CacheOptimizationBrowserLoadRequest;
}>;

/**
 * Browser-control asset role.
 *
 * - **"cold90"** - Initial 90-degree package.
 * - **"adjacent91"** - Adjacent 91-degree package.
 * - **"nonadjacent30"** - Nonadjacent 30-degree package.
 * - **"warm90"** - Warm-return 90-degree package.
 * - **"delayed91"** - Delayed superseded package.
 * - **"replacement92"** - Latest supersession and restoration package.
 * - **"delayed93"** - Delayed caller-cancelled package.
 */
type CacheOptimizationBrowserAssetRole =
	| 'cold90'
	| 'adjacent91'
	| 'nonadjacent30'
	| 'warm90'
	| 'delayed91'
	| 'replacement92'
	| 'delayed93';

/** Exact browser-control assets keyed by their lifecycle roles. */
type CacheOptimizationBrowserAssets = Readonly<{
	/** Initial 90-degree package. */
	cold90: CacheOptimizationBrowserAsset;
	/** Adjacent 91-degree package. */
	adjacent91: CacheOptimizationBrowserAsset;
	/** Nonadjacent 30-degree package. */
	nonadjacent30: CacheOptimizationBrowserAsset;
	/** Warm-return 90-degree package. */
	warm90: CacheOptimizationBrowserAsset;
	/** Delayed superseded package. */
	delayed91: CacheOptimizationBrowserAsset;
	/** Latest supersession and restoration package. */
	replacement92: CacheOptimizationBrowserAsset;
	/** Delayed caller-cancelled package. */
	delayed93: CacheOptimizationBrowserAsset;
}>;

/** C0 assets and catalog supplied to the browser baseline. */
type CacheOptimizationBrowserControl = Readonly<{
	/** Accepted deployed catalog. */
	catalog: CacheOptimizationRuntimeCatalog;
	/** Valid scenario assets keyed by their control role. */
	assets: CacheOptimizationBrowserAssets;
	/** Deliberately incompatible asset used to prove failure preservation. */
	failedAsset: CacheOptimizationBrowserAsset;
}>;

/** Per-path proof-host response counters. */
type CacheOptimizationNetworkPathMetrics = Readonly<{
	/** Number of completed static responses. */
	count: number;
	/** Sum of completed response bytes. */
	byteLength: number;
}>;

/** Proof-host response counters keyed by normalized URL path. */
type CacheOptimizationNetworkPathMap = {
	/** Counters for one normalized request path. */
	[urlPath: string]: CacheOptimizationNetworkPathMetrics;
};

/** Cumulative static-response counters exposed by the C0 proof host. */
type CacheOptimizationNetworkSnapshot = Readonly<{
	/** Total completed static requests. */
	requestCount: number;
	/** Total completed static-response bytes. */
	responseByteLength: number;
	/** Number of normalized request paths observed. */
	uniqueRequestCount: number;
	/** Per-path cumulative response counters. */
	paths: CacheOptimizationNetworkPathMap;
}>;

/** Scenario-local network counters without the cumulative path map. */
type CacheOptimizationNetworkDifference = Readonly<{
	/** Requests completed during the scenario. */
	requestCount: number;
	/** Response bytes completed during the scenario. */
	responseByteLength: number;
	/** Paths whose request count increased during the scenario. */
	uniqueRequestCount: number;
}>;

/** Rejected browser operation identity, including non-Error caller reasons. */
type CacheOptimizationRejectionIdentity = Readonly<{
	/** JavaScript type of the rejected value. */
	type: string;
	/** Error name or null when the rejected value has none. */
	name: string | null;
	/** Stable human-readable rejection message. */
	message: string;
}>;

/** Abort-classified browser rejection identity. */
type CacheOptimizationAbortRejectionIdentity = Omit<CacheOptimizationRejectionIdentity, 'name'> &
	Readonly<{
		/** Canonical DOM abort classification. */
		name: 'AbortError';
	}>;

/** One asynchronous operation invoked by a focused infrastructure proof. */
interface CacheOptimizationAsyncOperation {
	(): Promise<unknown>;
}

/** Stable diagnostic returned after an infrastructure operation rejects. */
type CacheOptimizationInfrastructureRejection = Readonly<{
	/** Stable proof-case identity. */
	label: string;
	/** Confirmation that the operation rejected. */
	rejected: true;
	/** JavaScript error name or rejected-value type. */
	name: string;
	/** Human-readable rejection message. */
	message: string;
}>;

/** Labeled invalid JSON value exercised by the infrastructure proof. */
type CacheOptimizationInvalidJsonCase = [label: string, value: unknown];

/** Shared timing and transport values for one measured browser lifecycle scenario. */
type CacheOptimizationBrowserMeasurementBase = Readonly<{
	/** Browser-observed operation time in milliseconds. */
	browserElapsedMilliseconds: number;
	/** Browser heap bytes before the operation, or null when unavailable. */
	browserHeapBeforeBytes: number | null;
	/** Browser heap bytes after the operation, or null when unavailable. */
	browserHeapAfterBytes: number | null;
	/** Maximum sampled browser heap bytes, or null when unavailable. */
	peakBrowserHeapBytes: number | null;
	/** Scenario-local proof-host response work. */
	network: CacheOptimizationNetworkDifference;
}>;

/**
 * Measured browser-stage identity, excluding the unmeasured dark boundary.
 *
 * - **"cold-90"** - Initial cache publication.
 * - **"exact-reuse-90"** - Same-object reuse.
 * - **"adjacent-91"** - Adjacent replacement.
 * - **"nonadjacent-30"** - Nonadjacent replacement.
 * - **"warm-90"** - Warm return replacement.
 * - **"failed-replacement"** - Failed replacement preservation.
 * - **"superseded-91-by-92"** - Superseded in-flight work.
 * - **"caller-cancelled-93"** - Caller-aborted work.
 * - **"context-restoration-92"** - Context-restored publication.
 */
type CacheOptimizationBrowserStageId = Exclude<CacheOptimizationRuntimeScenarioId, 'dark-boundary'>;

/**
 * Browser stage that publishes a complete cache and resource snapshot.
 *
 * - **"cold-90"** - Initial cache publication.
 * - **"adjacent-91"** - Adjacent replacement.
 * - **"nonadjacent-30"** - Nonadjacent replacement.
 * - **"warm-90"** - Warm return replacement.
 * - **"context-restoration-92"** - Context-restored publication.
 */
type CacheOptimizationCachePublicationStageId =
	| 'cold-90'
	| 'adjacent-91'
	| 'nonadjacent-30'
	| 'warm-90'
	| 'context-restoration-92';

/** Successful cache publication and controller-resource observation. */
type CacheOptimizationPublishedCacheObservation = CacheOptimizationJsonObject & Readonly<{
	/** Published cache identity. */
	cacheIdentity: string;
	/** Controller resources after publication. */
	resources: CacheOptimizationControllerResources;
}>;

/** Same-identity reuse observation. */
type CacheOptimizationExactReuseObservation = CacheOptimizationJsonObject & Readonly<{
	/** Reused cache identity. */
	cacheIdentity: string;
	/** Confirmation that the same object instance was returned. */
	reusedSameObject: true;
}>;

/** Last-good preservation after a failed replacement. */
type CacheOptimizationFailedReplacementObservation = CacheOptimizationJsonObject & Readonly<{
	/** Error classification. */
	name: string;
	/** Error diagnostic. */
	message: string;
	/** Confirmation that the active cache was preserved. */
	preservedActive: true;
}>;

/** Superseded request and latest-publication observation. */
type CacheOptimizationSupersessionObservation = CacheOptimizationJsonObject & Readonly<{
	/** Abort-classified superseded rejection. */
	supersededError: CacheOptimizationAbortRejectionIdentity;
	/** Identity published by the later request. */
	publishedCacheIdentity: string;
	/** Controller resources after latest publication. */
	resources: CacheOptimizationControllerResources;
}>;

/** Caller cancellation and last-good preservation observation. */
type CacheOptimizationCancellationObservation = CacheOptimizationJsonObject & Readonly<{
	/** Abort-classified caller cancellation. */
	cancellationError: CacheOptimizationAbortRejectionIdentity;
	/** Confirmation that the active cache was preserved. */
	preservedActive: true;
}>;

/** Closed browser-stage observation values. */
type CacheOptimizationBrowserObservation =
	| CacheOptimizationPublishedCacheObservation
	| CacheOptimizationExactReuseObservation
	| CacheOptimizationFailedReplacementObservation
	| CacheOptimizationSupersessionObservation
	| CacheOptimizationCancellationObservation;

/** One measured browser lifecycle scenario with its stage-specific observation. */
type CacheOptimizationBrowserMeasurement = CacheOptimizationBrowserMeasurementBase &
	(
		| {
				/** Cache-publication scenario identity. */
				id: CacheOptimizationCachePublicationStageId;
				/** Published cache and resource state. */
				value: CacheOptimizationPublishedCacheObservation;
		  }
		| {
				/** Same-identity reuse scenario identity. */
				id: 'exact-reuse-90';
				/** Reused cache identity and object proof. */
				value: CacheOptimizationExactReuseObservation;
		  }
		| {
				/** Failed-replacement scenario identity. */
				id: 'failed-replacement';
				/** Last-good preservation observation. */
				value: CacheOptimizationFailedReplacementObservation;
		  }
		| {
				/** In-flight supersession scenario identity. */
				id: 'superseded-91-by-92';
				/** Superseded rejection and latest publication. */
				value: CacheOptimizationSupersessionObservation;
		  }
		| {
				/** Caller-cancellation scenario identity. */
				id: 'caller-cancelled-93';
				/** Cancellation rejection and last-good preservation. */
				value: CacheOptimizationCancellationObservation;
		  }
	);

/** Byte-valued production GPU resource observation. */
type CacheOptimizationByteResource = CacheOptimizationJsonObject & Readonly<{
	/** Resource quantity in bytes. */
	value: number;
	/** Fixed unit identity. */
	units: CacheOptimizationResourceUnit;
}>;

/**
 * Resource measurement unit.
 *
 * - **"bytes"** - Exact byte count.
 */
type CacheOptimizationResourceUnit = 'bytes';

/** Production cache-controller resource snapshot. */
type CacheOptimizationControllerResources = CacheOptimizationJsonObject & Readonly<{
	/** Maximum bytes retained by one resident texture set. */
	maximumResidentTextureBytes: CacheOptimizationByteResource;
	/** Maximum bytes retained across an atomic old/new texture transition. */
	maximumAtomicTransitionTextureBytes: CacheOptimizationByteResource;
	/** Maximum transition bytes including loader staging. */
	maximumTransitionWithStagingBytes: CacheOptimizationByteResource;
	/** Currently resident texture bytes. */
	activeResidentTextureBytes: CacheOptimizationByteResource;
	/** Texture bytes involved in the most recent transition. */
	lastTransitionTextureBytes: CacheOptimizationByteResource;
	/** Most recent transition bytes including loader staging. */
	lastTransitionWithStagingBytes: CacheOptimizationByteResource;
}>;

/**
 * Resolver state around the darkness boundary.
 *
 * - **"ready"** - A scene cache is selected.
 * - **"dark"** - No texture cache is selected.
 */
type CacheOptimizationDarkBoundaryStatus = 'ready' | 'dark';

/** One resolver observation around the texture-free darkness boundary. */
type CacheOptimizationDarkBoundaryObservation = CacheOptimizationJsonObject & Readonly<{
	/** Queried solar-zenith angle in degrees. */
	solarZenithDegrees: number;
	/** Resolver status observed for the query. */
	status: CacheOptimizationDarkBoundaryStatus;
	/** Selected representative angle in degrees, or null for darkness. */
	representativeSolarZenithDegrees: number | null;
}>;

/** WebGL implementation identity observed by the browser control. */
type CacheOptimizationGpuIdentity = CacheOptimizationJsonObject & Readonly<{
	/** WebGL version string. */
	api: string;
	/** Unmasked renderer string when supported. */
	renderer: string;
}>;

/** Accepted result produced inside the C0 browser. */
type CacheOptimizationBrowserBaselineResult = CacheOptimizationJsonObject & Readonly<{
	/** Versioned browser-result schema identity. */
	schemaId: string;
	/** Accepted browser-control state. */
	accepted: true;
	/** Browser-observed WebGL implementation identity. */
	gpu: CacheOptimizationGpuIdentity;
	/** Nine measured lifecycle scenarios. */
	stages: readonly CacheOptimizationBrowserMeasurement[];
	/** Resolver observations around the production darkness boundary. */
	darkBoundary: readonly CacheOptimizationDarkBoundaryObservation[];
	/** Final cache-controller resource snapshot before disposal. */
	finalResources: CacheOptimizationControllerResources;
	/** Final WebGL error code, required to be zero. */
	webglError: number;
}>;

/** Host-owned wrapper around the accepted browser result. */
type CacheOptimizationBrowserHostResult = CacheOptimizationJsonObject & Readonly<{
	/** Versioned browser-host-result schema identity. */
	schemaId: string;
	/** Accepted host-orchestration state. */
	accepted: true;
	/** Browser product and version identity. */
	browserVersion: string;
	/** Host-observed browser-run wall time in milliseconds. */
	hostWallMilliseconds: number;
	/** Cumulative proof-host static-response work. */
	requestTotals: CacheOptimizationNetworkSnapshot;
	/** Browser console and request-failure diagnostics. */
	consoleMessages: readonly string[];
	/** Accepted result returned by the browser module. */
	result: CacheOptimizationBrowserBaselineResult;
}>;

/** Top-level C0 inventory summary used for comparisons. */
type CacheOptimizationC0InventorySummary = CacheOptimizationJsonObject & Readonly<{
	/** Number of deployed packages. */
	packageCount: number;
	/** Sum of deployed package bytes. */
	totalByteLength: number;
	/** Number of stored logical row occurrences. */
	rowOccurrenceCount: number;
	/** Number of distinct coordinate identities. */
	distinctCoordinateCount: number;
	/** Exact bytes per spectral row. */
	rowByteLength: number;
	/** Inventory authentication wall time in milliseconds. */
	elapsedMilliseconds: number;
}>;

/** Stored production-control footprint. */
type CacheOptimizationStorageMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Number of deployed catalog, report, and package artifacts. */
	artifactCount: number;
	/** Complete deployed bytes. */
	byteLength: number;
}>;

/** Production-control HTTP transport work. */
type CacheOptimizationTransportMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Total static requests observed by the proof host. */
	requestCount: number;
	/** Total successfully completed response bytes. */
	responseByteLength: number;
	/** Number of distinct normalized request paths. */
	uniqueRequestCount: number;
}>;

/** Production-control browser and host latency. */
type CacheOptimizationLatencyMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Cold browser publication time in milliseconds. */
	browserElapsedMilliseconds: number;
	/** Complete browser-control host wall time in milliseconds. */
	hostWallMilliseconds: number;
}>;

/** Codec timings unavailable for the uncompressed production control. */
type CacheOptimizationCodecMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Encode time in milliseconds, unavailable for C0. */
	encodeMilliseconds: null;
	/** Decode time in milliseconds, unavailable for C0. */
	decodeMilliseconds: null;
	/** Inverse byte-shuffle time in milliseconds, unavailable for C0. */
	inverseShuffleMilliseconds: null;
	/** Worker queue time in milliseconds, unavailable for C0. */
	workerQueueMilliseconds: null;
}>;

/** Production-control memory and resource observations. */
type CacheOptimizationMemoryMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Cold-stage browser heap bytes before publication, or null when unavailable. */
	browserHeapBeforeBytes: number | null;
	/** Cold-stage browser heap bytes after publication, or null when unavailable. */
	browserHeapAfterBytes: number | null;
	/** Maximum sampled browser heap bytes. */
	peakBrowserHeapBytes: number;
	/** Maximum Worker heap bytes, unavailable because C0 has no Worker. */
	peakWorkerHeapBytes: null;
	/** Maximum sampled Node resident-set bytes. */
	peakProcessResidentBytes: number;
	/** Maximum sampled Node V8 heap bytes. */
	peakProcessHeapBytes: number;
	/** Maximum logical GPU transition bytes. */
	peakGpuResidentBytes: number;
	/** Maximum disk staging bytes, unavailable because C0 has no staging. */
	peakDiskStagingBytes: null;
	/** Controller resources resident after the final restoration. */
	activeResidentTextureBytes: number;
	/** Texture bytes involved in the final restoration transition. */
	lastTransitionTextureBytes: number;
	/** Final restoration bytes including loader staging. */
	lastTransitionWithStagingBytes: number;
}>;

/** Generation timings unavailable because C0 authenticates existing packages. */
type CacheOptimizationGenerationMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Setup time in milliseconds, unavailable for C0. */
	setupMilliseconds: null;
	/** Calculation time in milliseconds, unavailable for C0. */
	calculationMilliseconds: null;
	/** GPU readback time in milliseconds, unavailable for C0. */
	readbackMilliseconds: null;
	/** Staging time in milliseconds, unavailable for C0. */
	stagingMilliseconds: null;
	/** Encoding time in milliseconds, unavailable for C0. */
	encodingMilliseconds: null;
	/** Validation time in milliseconds, unavailable for C0. */
	validationMilliseconds: null;
	/** Publication time in milliseconds, unavailable for C0. */
	publicationMilliseconds: null;
	/** Complete generation time in milliseconds, unavailable for C0. */
	totalMilliseconds: null;
}>;

/** Exact production package-set authentication result. */
type CacheOptimizationExactnessMeasurements = CacheOptimizationJsonObject & Readonly<{
	/** Package bytes covered by authentication. */
	checkedByteLength: number;
	/** Expected deployed catalog SHA-256. */
	expectedSha256: string;
	/** Recomputed deployed catalog SHA-256. */
	actualSha256: string;
	/** Exact hash equality result. */
	matches: true;
}>;

/** Complete metric groups emitted by the C0 production control. */
type CacheOptimizationC0Measurements = CacheOptimizationJsonObject & Readonly<{
	/** Stored-footprint measurements. */
	storage: CacheOptimizationStorageMeasurements;
	/** HTTP transport measurements. */
	transport: CacheOptimizationTransportMeasurements;
	/** Browser and host latency measurements. */
	latency: CacheOptimizationLatencyMeasurements;
	/** Explicitly unavailable codec timings. */
	codec: CacheOptimizationCodecMeasurements;
	/** Browser, process, GPU, Worker, and staging-resource measurements. */
	memory: CacheOptimizationMemoryMeasurements;
	/** Explicitly unavailable generation-stage timings. */
	generation: CacheOptimizationGenerationMeasurements;
	/** Exact package-set authentication. */
	exactness: CacheOptimizationExactnessMeasurements;
}>;

/** Terminal C0 production-control result. */
type CacheOptimizationC0Result = CacheOptimizationTerminalResult & Readonly<{
	/** Authenticated deployed-inventory summary. */
	inventory: CacheOptimizationC0InventorySummary;
	/** Real-browser lifecycle observations. */
	browser: CacheOptimizationBrowserHostResult;
	/** Complete metric groups defined by the frozen contract. */
	measurements: CacheOptimizationC0Measurements;
	/** Explicit statement limiting the claims supported by C0. */
	claimBoundary: string;
}>;

/** Minimal loopback server capability retained by the proof-host owner. */
interface CacheOptimizationProofServer {
	/** Stops accepting connections and reports asynchronous close failure. */
	close(callback: (error?: Error) => void): unknown;
}

/** Live loopback proof-host resources. */
type CacheOptimizationProofHost = {
	/** Loopback origin URL ending with a separator. */
	url: string;
	/** Listening server stopped by the browser-run owner. */
	server: CacheOptimizationProofServer;
	/** Per-path static-response counters. */
	metrics: Map<string, CacheOptimizationNetworkPathMetrics>;
	/** Host-internal request diagnostics never returned to clients. */
	errors: CacheOptimizationProofHostError[];
};

/** Durable internal proof-host diagnostic retained without exposing it to clients. */
type CacheOptimizationProofHostError = Readonly<{
	/** Requested URL, or null when unavailable. */
	url: string | null;
	/** Error classification, or null when unavailable. */
	name: string | null;
	/** Stable error message. */
	message: string;
	/** Optional diagnostic stack. */
	stack: string | null;
}>;

/** One sealed artifact record. */
type CacheOptimizationArtifactRecord = CacheOptimizationFileIdentity;

/** Terminal artifact manifest written last. */
type CacheOptimizationArtifactManifest = Readonly<{
	/** Versioned artifact-manifest schema identity. */
	schemaId: string;
	/** Owning immutable run identity. */
	runId: string;
	/** Terminal lifecycle conclusion. */
	conclusion: CacheOptimizationExperimentRunConclusion;
	/** SHA-256 of the canonical artifact identity array. */
	artifactSetSha256: string;
	/** Sorted identities for every pre-manifest run artifact. */
	artifacts: readonly CacheOptimizationArtifactRecord[];
	/** ISO timestamp recorded when sealing completed. */
	finalizedAt: string;
}>;

/** Append-only progress event. */
type CacheOptimizationProgressEvent = Readonly<{
	/** ISO event timestamp. */
	timestamp: string;
	/** Stable run phase identifier. */
	phase: string;
	/** Human-readable current-operation description. */
	message: string;
	/** Completed work items when the phase is countable. */
	completed?: number;
	/** Total work items when the phase is countable. */
	total?: number;
	/** Terminal conclusion present only on the final event. */
	state?: CacheOptimizationExperimentRunConclusion;
}>;

/** Asynchronous browser operation measured as one C0 scenario. */
interface CacheOptimizationBrowserOperation {
	(): Promise<CacheOptimizationBrowserObservation>;
}

/**
 * WebGL context event awaited by the browser control.
 *
 * - **"webglcontextlost"** - Context-loss event whose default action must be prevented.
 * - **"webglcontextrestored"** - Context-restoration event that permits resource rebuilding.
 */
type CacheOptimizationContextEventName = 'webglcontextlost' | 'webglcontextrestored';

/** Peak Node process resources sampled during the C0 run. */
type CacheOptimizationProcessResourceSample = {
	/** Maximum sampled resident-set bytes. */
	peakProcessResidentBytes: number;
	/** Maximum sampled V8 heap bytes. */
	peakProcessHeapBytes: number;
};

/** Owner that stops C0 process-resource sampling exactly once. */
interface CacheOptimizationProcessResourceSampler {
	/** Stops sampling and returns the final peak values. */
	stop(): CacheOptimizationProcessResourceSample;
}

/** Read-only verification summary for one sealed run. */
type CacheOptimizationSealedRunVerification = Readonly<{
	/** Verified immutable run identity. */
	runId: string;
	/** Verified terminal lifecycle conclusion. */
	conclusion: CacheOptimizationExperimentRunConclusion;
	/** Number of pre-manifest artifacts authenticated. */
	artifactCount: number;
	/** Recomputed SHA-256 of the canonical artifact identity array. */
	artifactSetSha256: string;
}>;

/** Browser performance extension used only when precise heap reporting is enabled. */
type CacheOptimizationPerformanceMemory = {
	/** Current used JavaScript heap bytes. */
	usedJSHeapSize: number;
};

/** Chromium's optional precise-memory extension to the Performance API. */
interface Performance {
	/** Precise heap information when Chrome exposes it. */
	memory?: CacheOptimizationPerformanceMemory;
}
