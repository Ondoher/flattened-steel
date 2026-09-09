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

/** Exact material identities expected by the contained production loader proof. */
type CacheOptimizationExpectedCompatibility = Readonly<{
	/** Immutable scene-Sun identity expected by the cache loader. */
	sceneSun: CacheOptimizationE1SceneSun;
	/** Atmosphere model identity. */
	atmosphereIdentity: string;
	/** Geometry model identity. */
	geometryIdentity: string;
	/** Ground-boundary identity. */
	groundIdentity: string;
	/** Numerical configuration identity. */
	numericalIdentity: string;
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
	expected: CacheOptimizationExpectedCompatibility;
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
type CacheOptimizationProductionArtifact = CacheOptimizationFileIdentity & Readonly<{
	/** Production artifact codec identity. */
	codecId: string;
}>;

/** Scalar physical measurement with an explicit unit. */
type CacheOptimizationMeasuredValue<TUnits extends string> = Readonly<{
	/** Finite physical value. */
	value: number;
	/** Unit in which the value is expressed. */
	units: TUnits;
}>;

/** Immutable source-package derivation outputs. */
type CacheOptimizationSourceDerivationOutputs = Readonly<{
	/** SHA-256 of the derived row ledger. */
	ledgerSha256: string;
	/** SHA-256 of the derived exact spectral payload. */
	exactSha256: string;
	/** SHA-256 of the shared logical-to-unique index. */
	logicalToUniqueIndexSha256: string;
}>;

/** Immutable derivation record retained by a production scene manifest. */
type CacheOptimizationSourceDerivation = Readonly<{
	/** Versioned production derivation schema. */
	schemaId: 'algorithm32-distant-sun-bin-covered-runtime-derivation-v1';
	/** SHA-256 of the source inventory index. */
	parentInventoryIndexSha256: string;
	/** Ordered source cache identities used to assemble the scene. */
	parentCacheIdentities: readonly string[];
	/** Human-readable derivation operation. */
	operation: string;
	/** Scene-selection parameters applied by the derivation. */
	parameters: CacheOptimizationE1SceneSelection;
	/** Repository-relative generator implementation path. */
	implementation: string;
	/** Content identities produced by the derivation. */
	outputs: CacheOptimizationSourceDerivationOutputs;
}>;

/** Scene manifest fields consumed by C0. */
type CacheOptimizationSceneManifest = Readonly<{
	/** Versioned scene-manifest schema identity. */
	schemaId: 'algorithm32-distant-sun-runtime-scene-cache-manifest-v2';
	/** Content-derived production cache identity. */
	cacheIdentity: string;
	/** Half-open scene-selection interval. */
	selection: CacheOptimizationE1SceneSelection;
	/** Scene-Sun identity and direction. */
	sceneSun: CacheOptimizationE1SceneSun;
	/** Atmosphere-model identity. */
	atmosphereIdentity: string;
	/** Geometry-model identity. */
	geometryIdentity: string;
	/** Ground-boundary identity. */
	groundIdentity: string;
	/** Numerical-configuration identity. */
	numericalIdentity: string;
	/** Package-relative packed-row-ledger path. */
	ledgerPath: string;
	/** SHA-256 of the packed-row ledger. */
	ledgerSha256: string;
	/** Exact spectral payload identity. */
	exactSeamPayload: CacheOptimizationProductionArtifact;
	/** Logical-to-unique index identity. */
	logicalToUniqueIndex: CacheOptimizationProductionArtifact;
	/** Complete immutable source derivation. */
	derivation: CacheOptimizationSourceDerivation;
}>;

/** Physical support contract retained by a packed row ledger. */
type CacheOptimizationLedgerSupport = Readonly<{
	/** Stable support-model identity. */
	id: 'san-jose-fixed-observer-complete-rotation-v1';
	/** Atmosphere bottom radius. */
	bottomRadius: CacheOptimizationMeasuredValue<'meters'>;
	/** Atmosphere top radius. */
	topRadius: CacheOptimizationMeasuredValue<'meters'>;
	/** Observer altitude above the bottom radius. */
	observerAltitude: CacheOptimizationMeasuredValue<'meters'>;
	/** Observer solar-zenith angle. */
	observerSolarZenith: CacheOptimizationMeasuredValue<'radians'>;
	/** Confirmation that complete camera rotation was retained. */
	completeCameraRotation: true;
	/** Retained arbitrary-shortened-endpoint policy flag. */
	arbitraryShortenedEndpoint: true;
}>;

/** Packed ledger row fields consumed by C0. */
type CacheOptimizationLedgerRow = Readonly<{
	/** Zero-based altitude coordinate index. */
	altitudeIndex: number;
	/** Physical altitude represented by this row. */
	altitude: CacheOptimizationMeasuredValue<'meters'>;
	/** First inclusive solar-zenith coordinate index. */
	firstSolarZenithIndex: number;
	/** Last inclusive solar-zenith coordinate index. */
	lastSolarZenithIndex: number;
	/** First packed row represented by the span. */
	firstPackedRow: number;
	/** Number of packed spectral rows represented by the ledger row. */
	packedRowCount: number;
}>;

/** Packed row ledger consumed by C0. */
type CacheOptimizationRowLedger = Readonly<{
	/** Versioned packed-ledger schema identity. */
	schemaId: 'algorithm32-distant-sun-packed-row-ledger-v1';
	/** Scene-Sun identity duplicated by the source ledger. */
	sceneSun: CacheOptimizationE1SceneSun;
	/** Physical support used to retain coordinate rows. */
	support: CacheOptimizationLedgerSupport;
	/** Number of retained coordinate rows. */
	retainedBlockCount: number;
	/** Ordered altitude spans represented by the package payload. */
	rows: readonly CacheOptimizationLedgerRow[];
	/** Source oracle payload byte length before exact-seam conversion. */
	oracleByteLength: number;
	/** Exact-seam payload plus logical-index byte length. */
	exactSeamByteLength: number;
}>;

/** One authenticated deployed package retained by the C0 inventory. */
type CacheOptimizationInventoryPackage = Readonly<{
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
type CacheOptimizationInventoryPins = Readonly<{
	/** Versioned inventory schema identity. */
	schemaId: 'distant-sun-cache-optimization-c0-inventory-pins-v1';
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
	/** Semantic E1 graph verification when the accepted run uses the v2 E1 schema. */
	semanticVerification?: CacheOptimizationE1CandidateVerification;
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

/** Immutable C0 parent identity required by E1. */
type CacheOptimizationE1ParentIdentity = Readonly<{
	/** Six-digit immutable run identity. */
	runId: string;
	/** SHA-256 of the parent's canonical artifact set. */
	artifactSetSha256: string;
}>;

/**
 * E1 coordinate-tile identity.
 *
 * - **"2x8"** - Two altitude indices by eight solar-zenith indices.
 * - **"4x8"** - Four altitude indices by eight solar-zenith indices.
 * - **"4x16"** - Four altitude indices by sixteen solar-zenith indices.
 * - **"8x8"** - Eight altitude indices by eight solar-zenith indices.
 */
type CacheOptimizationE1LayoutId = '2x8' | '4x8' | '4x16' | '8x8';

/** Pinned Zstandard comparison level. */
type CacheOptimizationE1ZstandardLevel = 1 | 3 | 6;

/** Reversible Float32 byte-lane transform identity. */
type CacheOptimizationE1ShuffleId = 'float32-byte-lane-v1';

/** One E1 coordinate-tile shape. */
type CacheOptimizationE1Layout = Readonly<{
	/** Stable tile identity. */
	id: CacheOptimizationE1LayoutId;
	/** Maximum altitude indices per tile. */
	altitudeCount: number;
	/** Maximum solar-zenith indices per tile. */
	solarZenithCount: number;
}>;

/** Frozen E1 winner-selection policy. */
type CacheOptimizationE1SelectionPolicy = Readonly<{
	/** Primary comparison metric. */
	primaryMetric: 'completeByteLength';
	/** Allowed proportional growth from the smallest passing candidate. */
	maximumGrowthRatioFromMinimum: number;
	/** Ordered tie-breaking metrics inside the materiality band. */
	withinBandPriority: readonly ['coldEncodedByteLength', 'coldRequestCount', 'encodeMilliseconds'];
}>;

/** Frozen E1 resource limits. */
type CacheOptimizationE1Bounds = Readonly<{
	/** Maximum encoded blocks plus metadata bytes. */
	maximumCompleteByteLength: number;
	/** Maximum decoded size of one block. */
	maximumDecodedBlockByteLength: number;
	/** Maximum reconstructed bytes for one authenticated production scene. */
	maximumScenePayloadByteLength: number;
	/** Maximum complete E1 runner wall time. */
	maximumTotalElapsedMilliseconds: number;
	/** Maximum decoded bytes retained by the verifier. */
	decodedRetentionByteLength: number;
}>;

/** Frozen request-model scenes. */
type CacheOptimizationE1Scenarios = Readonly<{
	/** Initial cold scene angle. */
	coldSceneDegrees: number;
	/** Scene adjacent to the cold selection. */
	adjacentSceneDegrees: number;
	/** Nonadjacent replacement scene. */
	nonadjacentSceneDegrees: number;
	/** Already-retained warm scene. */
	warmSceneDegrees: number;
}>;

/** Frozen E1 candidate matrix, parent, scenarios, and resource bounds. */
type CacheOptimizationE1CandidateContract = Readonly<{
	/** Versioned contract schema. */
	schemaId: 'distant-sun-cache-optimization-e1-candidate-contract-v1';
	/** Coordinate tilings to compare. */
	layouts: readonly CacheOptimizationE1Layout[];
	/** Zstandard levels to compare for every layout. */
	zstandardLevels: readonly CacheOptimizationE1ZstandardLevel[];
	/** Required reversible transform. */
	shuffle: CacheOptimizationE1ShuffleId;
	/** Required immutable C0 parent. */
	acceptedC0: CacheOptimizationE1ParentIdentity;
	/** Winner-selection policy. */
	selectionPolicy: CacheOptimizationE1SelectionPolicy;
	/** Resource limits. */
	bounds: CacheOptimizationE1Bounds;
	/** Request-model scene selections. */
	scenarios: CacheOptimizationE1Scenarios;
}>;

/** Codec wall times for one complete candidate build. */
type CacheOptimizationE1CodecMetrics = Readonly<{
	/** Byte-shuffle wall time in milliseconds. */
	shuffleMilliseconds: number;
	/** Zstandard encoding wall time in milliseconds. */
	encodeMilliseconds: number;
	/** Zstandard decoding wall time in milliseconds. */
	decodeMilliseconds: number;
	/** Inverse-shuffle wall time in milliseconds. */
	inverseShuffleMilliseconds: number;
}>;

/** Modeled work for one request scenario. */
type CacheOptimizationE1RequestScenarioMetrics = Readonly<{
	/** Total block and metadata requests. */
	requestCount: number;
	/** Total encoded block and metadata bytes. */
	encodedByteLength: number;
	/** Content-addressed block requests. */
	blockRequestCount: number;
	/** Metadata requests. */
	metadataRequestCount: number;
	/** Metadata bytes. */
	metadataByteLength: number;
}>;

/** Adjacent-scene block reuse. */
type CacheOptimizationE1NeighborReuse = Readonly<{
	/** Blocks shared with the predecessor. */
	sharedBlockCount: number;
	/** Blocks required by the adjacent scene. */
	requiredBlockCount: number;
}>;

/** Decoded-row overfetch distribution. */
type CacheOptimizationE1Overfetch = Readonly<{
	/** Minimum scene ratio. */
	minimumRatio: number;
	/** Arithmetic mean scene ratio. */
	meanRatio: number;
	/** Maximum scene ratio. */
	maximumRatio: number;
}>;

/** Modeled request and reuse measurements for one candidate. */
type CacheOptimizationE1RequestMetrics = Readonly<{
	/** Exact assumptions of the request model. */
	model: string;
	/** Cold-scene work. */
	cold: CacheOptimizationE1RequestScenarioMetrics;
	/** Adjacent replacement work after cold retention. */
	adjacent: CacheOptimizationE1RequestScenarioMetrics;
	/** Nonadjacent replacement work after adjacent retention. */
	nonadjacent: CacheOptimizationE1RequestScenarioMetrics;
	/** Exact warm-reuse work. */
	warm: CacheOptimizationE1RequestScenarioMetrics;
	/** Adjacent-scene block reuse. */
	neighborReuse: CacheOptimizationE1NeighborReuse;
	/** Decoded-row overfetch distribution. */
	overfetch: CacheOptimizationE1Overfetch;
}>;

/** Compact measurements retained for one fully built E1 candidate. */
type CacheOptimizationE1CandidateSummary = Readonly<{
	/** Layout and codec profile identity. */
	id: string;
	/** Coordinate-tile identity. */
	layoutId: CacheOptimizationE1LayoutId;
	/** Zstandard compression level. */
	zstandardLevel: CacheOptimizationE1ZstandardLevel;
	/** Logical block count. */
	blockCount: number;
	/** Distinct content-addressed encoded artifacts. */
	uniqueBlockArtifactCount: number;
	/** Encoded bytes after content deduplication. */
	encodedByteLength: number;
	/** Published metadata bytes. */
	metadataByteLength: number;
	/** Published metadata artifact count. */
	metadataArtifactCount: number;
	/** Encoded blocks plus metadata bytes. */
	completeByteLength: number;
	/** Largest decoded logical block. */
	maximumDecodedBlockByteLength: number;
	/** Blocks that passed codec round-trip. */
	exactBlockCount: number;
	/** Codec timing measurements. */
	codec: CacheOptimizationE1CodecMetrics;
	/** Request-model measurements. */
	requests: CacheOptimizationE1RequestMetrics;
}>;

/** Exact published-scene reconstruction result. */
type CacheOptimizationE1Exactness = Readonly<{
	/** Reconstructed scene count. */
	sceneCount: number;
	/** Total reconstructed payload bytes. */
	checkedByteLength: number;
	/** Observed differing bytes. */
	byteDifferenceCount: 0;
	/** Confirmation that every payload hash matched. */
	matches: true;
}>;

/** Result bounds with measured pass decisions. */
type CacheOptimizationE1ResultBounds = CacheOptimizationE1Bounds & Readonly<{
	/** Whether the winner passes complete-size limits. */
	completeByteLengthPasses: true;
	/** Whether the winner passes decoded-block limits. */
	decodedBlockByteLengthPasses: true;
	/** Whether every reconstructed scene passes its allocation limit. */
	scenePayloadByteLengthPasses: true;
	/** Whether complete runner wall time passes its limit. */
	totalElapsedMillisecondsPasses: true;
}>;

/** Accepted terminal evidence for the E1 format and compression comparison. */
type CacheOptimizationE1Result = Readonly<{
	/** Versioned accepted-result schema. */
	schemaId: 'distant-sun-cache-optimization-e1-result-v2';
	/** Immutable E1 run identity. */
	runId: string;
	/** Accepted terminal conclusion. */
	conclusion: 'accepted';
	/** Accepted-state flag. */
	accepted: true;
	/** Authenticated C0 parent. */
	parent: CacheOptimizationE1ParentIdentity;
	/** Exact published-graph reconstruction result. */
	exactness: CacheOptimizationE1Exactness;
	/** Complete 4-layout by 3-level comparison matrix. */
	candidates: readonly CacheOptimizationE1CandidateSummary[];
	/** Winner selected by the frozen policy. */
	recommendation: CacheOptimizationE1CandidateSummary;
	/** Frozen limits and winner decisions. */
	bounds: CacheOptimizationE1ResultBounds;
	/** Complete runner wall time. */
	totalElapsedMilliseconds: number;
	/** Explicit boundary on the evidence claim. */
	claimBoundary: string;
}>;

/** E1 direction-table contract. */
type CacheOptimizationE1DirectionLayout = Readonly<{
	/** Production direction codec identity. */
	id: 'algorithm32-distant-sun-w27-exact-seam-u16-v1';
	/** Number of unique direction vectors. */
	uniqueDirectionCount: 4058;
	/** Number of logical direction indices. */
	logicalDirectionCount: 4374;
	/** SHA-256 of the logical-to-unique index. */
	logicalToUniqueIndexSha256: string;
}>;

/** E1 spectral layout contract. */
type CacheOptimizationE1SpectralLayout = Readonly<{
	/** Native spectral basis identity. */
	id: 'Native15';
	/** Spectral channel count. */
	channelCount: 15;
	/** Production payload channel ordering. */
	order: 'wavelength-major';
}>;

/** One indexed coordinate domain. */
type CacheOptimizationE1IndexDomain = Readonly<{
	/** First inclusive index. */
	firstIndex: number;
	/** Number of available indices. */
	count: number;
}>;

/** Coordinate domains captured by the candidate configuration. */
type CacheOptimizationE1CoordinateDomains = Readonly<{
	/** Altitude index domain. */
	altitude: CacheOptimizationE1IndexDomain;
	/** Solar-zenith index domain and angular width. */
	solarZenith: CacheOptimizationE1IndexDomain & Readonly<{/** Width of one bin in degrees. */ binWidthDegrees: number}>;
}>;

/** Canonical block-grid ordering. */
type CacheOptimizationE1BlockGrid = Readonly<{
	/** Altitude indices per tile. */
	altitudeCount: number;
	/** Solar-zenith indices per tile. */
	solarZenithCount: number;
	/** Coordinate ordering inside each block. */
	coordinateOrder: 'altitude-then-solar-zenith';
	/** Byte ordering inside each decoded block. */
	payloadOrder: 'wavelength-then-coordinate-then-direction';
	/** Confirmation that absent coordinates consume no rows. */
	omitUnpopulatedCoordinates: true;
}>;

/** Zstandard publication contract. */
type CacheOptimizationE1Codec = Readonly<{
	/** Compression format. */
	id: 'zstandard';
	/** Selected compression level. */
	level: CacheOptimizationE1ZstandardLevel;
	/** Runtime and codec implementation identity. */
	implementation: string;
}>;

/** Published E1 configuration manifest. */
type CacheOptimizationE1ConfigurationManifest = Readonly<{
	/** Versioned configuration schema. */
	schemaId: 'distant-sun-cache-configuration-manifest-v1';
	/** SHA-256 of the canonical physical and layout facts. */
	configurationIdentity: string;
	/** Atmosphere model identity. */
	atmosphereIdentity: string;
	/** Geometry model identity. */
	geometryIdentity: string;
	/** Ground-boundary identity. */
	groundIdentity: string;
	/** Numerical configuration identity. */
	numericalIdentity: string;
	/** Direction-table facts. */
	directionLayout: CacheOptimizationE1DirectionLayout;
	/** Spectral-layout facts. */
	spectralLayout: CacheOptimizationE1SpectralLayout;
	/** Physical coordinate domains. */
	coordinateDomains: CacheOptimizationE1CoordinateDomains;
	/** Canonical block-grid facts. */
	blockGrid: CacheOptimizationE1BlockGrid;
	/** Selected logical tile. */
	layout: CacheOptimizationE1Layout;
	/** Selected compression profile. */
	codec: CacheOptimizationE1Codec;
	/** Selected reversible shuffle. */
	shuffle: CacheOptimizationE1ShuffleId;
	/** Decoded bytes per coordinate row. */
	rowByteLength: number;
	/** Number of uniquely owned coordinates. */
	distinctCoordinateCount: number;
	/** Content identity of the block index. */
	blockIndex: CacheOptimizationFileIdentity;
}>;

/** One altitude/solar-zenith coordinate tuple. */
type CacheOptimizationE1Coordinate = readonly [altitudeIndex: number, solarZenithIndex: number];

/** Derivation retained for one logical block. */
type CacheOptimizationE1BlockDerivation = Readonly<{
	/** Source C0 run identity. */
	parentRunId: string;
	/** Source C0 artifact-set identity. */
	parentArtifactSetSha256: string;
	/** Human-readable transformation. */
	operation: string;
	/** Candidate configuration identity. */
	configurationIdentity: string;
}>;

/** Published content-addressed block descriptor. */
type CacheOptimizationE1Block = Readonly<{
	/** Configuration-qualified logical tile identity. */
	id: string;
	/** First coordinate indices of the tile. */
	tile: Readonly<{/** First altitude index. */ altitudeIndex: number; /** First solar-zenith index. */ solarZenithIndex: number}>;
	/** Populated coordinate rows. */
	rowCount: number;
	/** Uncompressed unshuffled byte count. */
	decodedByteLength: number;
	/** SHA-256 of uncompressed unshuffled bytes. */
	decodedSha256: string;
	/** Zstandard artifact byte count. */
	encodedByteLength: number;
	/** SHA-256 of Zstandard bytes. */
	encodedSha256: string;
	/** Candidate-relative Zstandard artifact path. */
	path: string;
	/** Ordered coordinate ownership table. */
	coordinates: readonly CacheOptimizationE1Coordinate[];
	/** Complete source and operation identity. */
	derivation: CacheOptimizationE1BlockDerivation;
}>;

/** Published E1 block index. */
type CacheOptimizationE1BlockIndex = Readonly<{
	/** Versioned block-index schema. */
	schemaId: 'distant-sun-cache-block-index-v1';
	/** Decoded bytes per coordinate row. */
	rowByteLength: number;
	/** Number of uniquely owned coordinates. */
	distinctCoordinateCount: number;
	/** Logical block descriptors. */
	blocks: readonly CacheOptimizationE1Block[];
}>;

/** Root of one published E1 candidate graph. */
type CacheOptimizationE1PackageSetReport = Readonly<{
	/** Versioned package-set schema. */
	schemaId: 'distant-sun-cache-package-set-report-v1';
	/** Authenticated C0 parent. */
	parent: CacheOptimizationE1ParentIdentity;
	/** Immutable generator, implementation-set, and source-catalog identity. */
	build: CacheOptimizationE1BuildIdentity;
	/** Configuration-manifest identity. */
	configuration: CacheOptimizationFileIdentity;
	/** Semantic configuration identity repeated at the graph root. */
	configurationIdentity: string;
	/** Selected codec identity repeated at the graph root. */
	codec: CacheOptimizationE1Codec;
	/** Runtime-catalog identity. */
	catalog: CacheOptimizationFileIdentity;
	/** SHA-256 of the canonical catalog-selection contract. */
	catalogSelectionIdentity: string;
}>;

/** Immutable build inputs owned by the E1 graph root. */
type CacheOptimizationE1BuildIdentity = Readonly<{
	/** Generator source identity. */
	generator: CacheOptimizationFileIdentity;
	/** SHA-256 of the ordered implementation file-identity set. */
	implementationSetSha256: string;
	/** Authenticated production catalog from which selection behavior was retained. */
	sourceCatalog: CacheOptimizationFileIdentity;
}>;

/** One runtime-catalog scene entry. */
type CacheOptimizationE1CatalogEntry = Readonly<{
	/** Stable scene identity. */
	id: string;
	/** Representative selection angle. */
	representativeSolarZenithDegrees: number;
	/** Scene-manifest identity. */
	manifest: CacheOptimizationFileIdentity;
}>;

/** Published E1 runtime catalog. */
type CacheOptimizationE1RuntimeCatalog = Readonly<{
	/** Versioned runtime-catalog schema. */
	schemaId: 'distant-sun-cache-runtime-catalog-v1';
	/** Catalog-wide production selection and dark-boundary behavior. */
	selection: CacheOptimizationE1CatalogSelection;
	/** Complete ordered scene entries. */
	scenes: readonly CacheOptimizationE1CatalogEntry[];
}>;

/** Catalog-wide production scene-selection contract retained by E1. */
type CacheOptimizationE1CatalogSelection = Readonly<{
	/** Selection algorithm identity. */
	kind: 'ledger-covered-nearest-integer-half-up-v1';
	/** Inclusive texture-free dark boundary in degrees. */
	darkFromSolarZenithDegrees: 108;
	/** First catalog scene angle in degrees. */
	startSolarZenithDegrees: 0;
	/** Last catalog scene angle in degrees. */
	endSolarZenithDegrees: 108;
	/** Catalog scene-angle increment in degrees. */
	incrementDegrees: 1;
	/** Minimum selectable input angle in degrees. */
	minimumInputDegrees: 0;
	/** Exclusive maximum selectable input angle in degrees. */
	maximumInputExclusiveDegrees: 108;
}>;

/** One scene's consecutive rows inside a logical block. */
type CacheOptimizationE1SceneSegment = Readonly<{
	/** Zero-based block-index position. */
	blockIndex: number;
	/** First row within the decoded block. */
	firstBlockRow: number;
	/** Consecutive row count. */
	rowCount: number;
}>;

/** Half-open production scene-selection interval, including the retained terminal 108-degree boundary package. */
type CacheOptimizationE1SceneSelection = Readonly<{
	/** Representative scene angle in degrees; only the terminal package may equal the exclusive maximum at 108 degrees. */
	representativeSolarZenithDegrees: number;
	/** Inclusive input angle in degrees. */
	minimumInputDegrees: number;
	/** Exclusive input angle in degrees. */
	maximumInputExclusiveDegrees: number;
}>;

/** Production scene-Sun identity and direction. */
type CacheOptimizationE1SceneSun = Readonly<{
	/** Stable scene-Sun identity. */
	id: string;
	/** ISO instant used to construct the scene. */
	instant: string;
	/** Unit direction in up/east/north order. */
	directionToSourceUpEastNorth: readonly [number, number, number];
	/** Source-model identity. */
	sourceIdentity: string;
}>;

/** Production compatibility identities retained by a scene. */
type CacheOptimizationE1SceneCompatibility = Readonly<{
	/** Production cache identity. */
	cacheIdentity: string;
	/** Atmosphere-model identity. */
	atmosphereIdentity: string;
	/** Geometry-model identity. */
	geometryIdentity: string;
	/** Ground-boundary identity. */
	groundIdentity: string;
	/** Numerical-configuration identity. */
	numericalIdentity: string;
}>;

/** Published E1 scene manifest. */
type CacheOptimizationE1SceneManifest = Readonly<{
	/** Versioned scene schema. */
	schemaId: 'distant-sun-cache-scene-manifest-v1';
	/** Stable production scene identity. */
	id: string;
	/** Representative selection angle. */
	representativeSolarZenithDegrees: number;
	/** Production selection contract. */
	selection: CacheOptimizationE1SceneSelection;
	/** Production scene-Sun identity. */
	sceneSun: CacheOptimizationE1SceneSun;
	/** Runtime compatibility identities. */
	compatibility: CacheOptimizationE1SceneCompatibility;
	/** Original packed-coordinate ledger. */
	ledger: CacheOptimizationRowLedger;
	/** SHA-256 of the original production manifest. */
	sourceManifestSha256: string;
	/** SHA-256 of the expected reconstructed payload. */
	payloadSha256: string;
	/** Expected reconstructed payload bytes. */
	payloadByteLength: number;
	/** Ordered references into published blocks. */
	segments: readonly CacheOptimizationE1SceneSegment[];
}>;

/** Unique encoded-block size facts derived from a serialized E1 graph. */
type CacheOptimizationE1GraphSizeSummary = Readonly<{
	/** Number of distinct content-addressed block artifacts. */
	uniqueBlockArtifactCount: number;
	/** Total bytes in distinct encoded block artifacts. */
	encodedByteLength: number;
	/** Largest decoded logical block in bytes. */
	maximumDecodedBlockByteLength: number;
}>;

/** Semantic verification of one serialized E1 candidate graph. */
type CacheOptimizationE1CandidateVerification = CacheOptimizationE1Exactness & Readonly<{
	/** Authenticated graph-root identity. */
	packageSet: CacheOptimizationFileIdentity;
	/** Complete sorted candidate-relative artifact paths traversed by the graph. */
	artifactPaths: readonly string[];
	/** Authenticated coordinate-tile identity. */
	layoutId: CacheOptimizationE1LayoutId;
	/** Authenticated Zstandard level. */
	zstandardLevel: CacheOptimizationE1ZstandardLevel;
	/** Authenticated metadata artifact count. */
	metadataArtifactCount: number;
	/** Total authenticated metadata bytes. */
	metadataByteLength: number;
	/** Authenticated logical block count. */
	blockCount: number;
	/** Authenticated unique content-addressed block count. */
	uniqueBlockArtifactCount: number;
	/** Total authenticated encoded block bytes. */
	encodedByteLength: number;
	/** Total authenticated metadata and encoded block bytes. */
	completeByteLength: number;
	/** Largest authenticated decoded block in bytes. */
	maximumDecodedBlockByteLength: number;
	/** Authenticated unique coordinate count. */
	distinctCoordinateCount: number;
}>;

/** Optional progress callback invoked after one published scene verifies. */
interface CacheOptimizationE1SceneVerifiedOperation {
	/** @param completed - Verified scene count. @param total - Total scene count. @param sceneId - Latest verified scene identity. */
	(completed: number, total: number, sceneId: string): Promise<void>;
}

/** Allocation and progress policy for semantic E1 verification. */
type CacheOptimizationE1CandidateVerificationPolicy = Readonly<{
	/** Maximum decoded block bytes retained concurrently. */
	decodedRetentionByteLength: number;
	/** Maximum complete encoded candidate and metadata bytes. */
	maximumCompleteByteLength: number;
	/** Maximum reconstructed scene bytes accepted before allocation. */
	maximumScenePayloadByteLength: number;
	/** Optional scene-completion observer. */
	onSceneVerified?: CacheOptimizationE1SceneVerifiedOperation;
}>;

/**
 * C0 package artifact role authenticated before E1 extraction.
 *
 * - **"manifest"** - Scene package manifest.
 * - **"ledger"** - Packed coordinate-row ledger.
 * - **"payload"** - Exact Native15 Float32 payload.
 * - **"logicalToUniqueIndex"** - Logical-to-unique direction index.
 */
type CacheOptimizationPackageArtifactName = 'manifest' | 'ledger' | 'payload' | 'logicalToUniqueIndex';

/** Mutable extraction record for one distinct source coordinate. */
type CacheOptimizationE1SourceCoordinate = {
	/** Stable altitude/solar-zenith key. */
	key: string;
	/** Zero-based altitude index. */
	altitudeIndex: number;
	/** Zero-based solar-zenith index. */
	solarZenithIndex: number;
	/** C0-root-relative source payload path. */
	payloadPath: string;
	/** Packed row within the source payload. */
	payloadPackedRow: number;
	/** Total source payload rows. */
	payloadRowCount: number;
	/** Assigned row within the canonical E1 staging file. */
	canonicalRow?: number;
};

/** Source scene retained during E1 extraction. */
type CacheOptimizationE1SourceScene = Readonly<{
	/** Stable production scene identity. */
	id: string;
	/** Representative selection angle. */
	representativeSolarZenithDegrees: number;
	/** Production selection contract. */
	selection: CacheOptimizationE1SceneSelection;
	/** Production scene-Sun contract. */
	sceneSun: CacheOptimizationE1SceneSun;
	/** Production compatibility identities. */
	compatibility: CacheOptimizationE1SceneCompatibility;
	/** Authenticated source ledger. */
	ledger: CacheOptimizationRowLedger;
	/** Authenticated source-manifest SHA-256. */
	sourceManifestSha256: string;
	/** Expected payload SHA-256. */
	payloadSha256: string;
	/** Expected payload byte count. */
	payloadByteLength: number;
	/** Ordered coordinate keys. */
	coordinates: readonly string[];
}>;

/** Published scene fields before the schema discriminator is added. */
type CacheOptimizationE1SceneMetadata = Omit<CacheOptimizationE1SceneManifest, 'schemaId'>;

/** Physical and layout facts common to every E1 candidate. */
type CacheOptimizationE1SourceConfiguration = Readonly<{
	/** Atmosphere model identity. */
	atmosphereIdentity: string;
	/** Geometry model identity. */
	geometryIdentity: string;
	/** Ground-boundary identity. */
	groundIdentity: string;
	/** Numerical configuration identity. */
	numericalIdentity: string;
	/** Direction-layout facts. */
	directionLayout: CacheOptimizationE1DirectionLayout;
	/** Spectral-layout facts. */
	spectralLayout: CacheOptimizationE1SpectralLayout;
	/** Coordinate-domain facts. */
	coordinateDomains: CacheOptimizationE1CoordinateDomains;
}>;

/** Authenticated source inventory prepared for E1 candidate generation. */
type CacheOptimizationE1SourceInventory = Readonly<{
	/** Distinct coordinates by stable key. */
	coordinates: Map<string, CacheOptimizationE1SourceCoordinate>;
	/** Canonically ordered distinct coordinates. */
	orderedCoordinates: readonly CacheOptimizationE1SourceCoordinate[];
	/** Ordered source scenes. */
	scenes: readonly CacheOptimizationE1SourceScene[];
	/** Shared physical and numerical configuration. */
	configuration: CacheOptimizationE1SourceConfiguration;
}>;

/** Location of a coordinate inside a logical block. */
type CacheOptimizationE1BlockLocation = Readonly<{
	/** Zero-based block-index position. */
	blockIndex: number;
	/** Zero-based coordinate row within the block. */
	blockRow: number;
}>;

/** Serialized content-addressed metadata document. */
type CacheOptimizationE1MetadataDocument<T extends CacheOptimizationJsonObject = CacheOptimizationJsonObject> = Readonly<{
	/** Candidate-relative content identity. */
	identity: CacheOptimizationFileIdentity;
	/** Parsed JSON payload. */
	value: T;
	/** Pretty-printed UTF-8 JSON bytes. */
	bytes: Buffer;
}>;

/** Configuration facts and their canonical identity. */
type CacheOptimizationE1ConfigurationContract = Readonly<{
	/** Physical, numerical, and block-grid facts. */
	facts: CacheOptimizationE1SourceConfiguration & Readonly<{/** Candidate block grid. */ blockGrid: CacheOptimizationE1BlockGrid}>;
	/** SHA-256 of canonical configuration JSON. */
	identity: string;
}>;

/** Complete in-memory metadata publication bundle. */
type CacheOptimizationE1MetadataBundle = Readonly<{
	/** Root, catalog, configuration, index, and scene documents. */
	artifacts: readonly CacheOptimizationE1MetadataDocument[];
	/** Logical block descriptors. */
	blocks: readonly CacheOptimizationE1Block[];
	/** Published scene manifests. */
	scenes: readonly CacheOptimizationE1SceneMetadata[];
	/** Decoded bytes per coordinate row. */
	rowByteLength: number;
	/** Shared root/catalog/configuration/index bytes. */
	globalByteLength: number;
	/** All metadata bytes. */
	metadataByteLength: number;
	/** Identity of the ordered metadata artifact identities. */
	identitySha256: string;
}>;

/** Fully built candidate including private publication metadata. */
type CacheOptimizationE1BuiltCandidate = CacheOptimizationE1CandidateSummary & Readonly<{
	/** Complete metadata bundle omitted from the terminal summary. */
	metadata: CacheOptimizationE1MetadataBundle;
}>;

/** Independent fixed-vector proof for the byte-lane transform. */
type CacheOptimizationE1ByteShuffleProof = Readonly<{
	/** Versioned proof schema. */
	schemaId: 'distant-sun-cache-optimization-e1-byte-shuffle-proof-v1';
	/** Fixed interleaved input bytes. */
	source: readonly number[];
	/** Independently declared shuffled bytes. */
	expected: readonly number[];
	/** Actual shuffled bytes. */
	actual: readonly number[];
	/** Actual inverse-shuffled bytes. */
	inverse: readonly number[];
	/** Confirmation that wrong-type and misaligned inputs rejected. */
	malformedInputsRejected: true;
}>;

/** Narrow random-access file capability used by E1 staging I/O. */
interface CacheOptimizationRandomAccessFileHandle {
	/** Read bytes into a caller-owned buffer. */
	read(buffer: Uint8Array, offset: number, length: number, position: number): Promise<Readonly<{/** Bytes placed in the buffer. */ bytesRead: number}>>;
	/** Write caller-owned bytes at an exact position. */
	write(buffer: Uint8Array, offset: number, length: number, position: number): Promise<Readonly<{/** Bytes written from the buffer. */ bytesWritten: number}>>;
}

/** Immutable browser-consumed metadata identity. */
type CacheOptimizationE2FileIdentity = Readonly<{path: string; byteLength: number; sha256: string}>;
/** Browser-safe E1 catalog projection. */
type CacheOptimizationE2Catalog = Readonly<{scenes: readonly Readonly<{degrees: number; manifest: CacheOptimizationE2FileIdentity}>[]}>;
/** Browser-safe E1 configuration projection. */
type CacheOptimizationE2Configuration = Readonly<{blockIndex: CacheOptimizationE2FileIdentity; channelCount: number; uniqueDirectionCount: number; rowByteLength: number}>;
/** Browser-safe E1 shared-block descriptor. */
type CacheOptimizationE2Block = Readonly<{encodedSha256: string; decodedSha256: string; encodedByteLength: number; decodedByteLength: number; path: string; rowCount: number}>;
/** Browser-safe E1 shared-block index. */
type CacheOptimizationE2BlockIndex = Readonly<{blocks: readonly CacheOptimizationE2Block[]}>;
/** Browser-safe E1 scene segment. */
type CacheOptimizationE2Segment = Readonly<{blockIndex: number; firstBlockRow: number; rowCount: number}>;
/** Browser-safe E1 scene projection. */
type CacheOptimizationE2Scene = Readonly<{segments: readonly CacheOptimizationE2Segment[]; payloadByteLength: number; payloadSha256: string}>;
/** Successful Worker decode reply. */
type CacheOptimizationE2WorkerSuccess = Readonly<{id: number; decoded: ArrayBuffer; queueMilliseconds: number; decodeMilliseconds: number; inverseShuffleMilliseconds: number; workerHeapBytes: number | null}>;
/** Failed Worker decode reply. */
type CacheOptimizationE2WorkerFailure = Readonly<{id: number; error: Readonly<{name: string; message: string}>}>;
/** Closed reply received from the decoder Worker. */
type CacheOptimizationE2WorkerResponse = CacheOptimizationE2WorkerSuccess | CacheOptimizationE2WorkerFailure;
/** Pending main-thread promise handlers for one Worker request. */
type CacheOptimizationE2WorkerPending = Readonly<{resolve: (value: CacheOptimizationE2WorkerSuccess) => void; reject: (reason: unknown) => void}>;
/** Decoded-block fetch result supplied to a scene transaction. */
type CacheOptimizationE2BlockResult = Readonly<{value: Uint8Array; reused: boolean; transferMilliseconds: number; queueMilliseconds: number; decodeMilliseconds: number; inverseShuffleMilliseconds: number; workerHeapBytes: number | null}>;
/** Shared artifact request and subscriber ownership state. */
type CacheOptimizationE2InflightBlock = {promise: Promise<CacheOptimizationE2BlockResult>; controller: AbortController; subscribers: number};
/** Observed client transport counters. */
type CacheOptimizationE2TransportMetrics = Readonly<{requestCount: number; uniqueRequestCount: number; maximumObservedRequests: number; peakMainHeapBytes: number | null; peakWorkerHeapBytes: number | null}>;
/** Per-scene reconstruction, upload, and publication measurement. */
type CacheOptimizationE2SceneRecord = CacheOptimizationJsonObject & Readonly<{degrees: number; requiredBlockCount: number; reusedBlockCount: number; newlyDecodedBlockCount: number; encodedByteLength: number; decodedByteLength: number; workerQueueMilliseconds: number; decompressionMilliseconds: number; inverseShuffleMilliseconds: number; transferMilliseconds: number; uploadMilliseconds: number; publicationMilliseconds: number; elapsedMilliseconds: number; retainedBytes: number; published: boolean; payloadSha256: string}>;
/** Accepted browser E2 proof payload. */
type CacheOptimizationE2BrowserResult = CacheOptimizationJsonObject & Readonly<{schemaId: 'distant-sun-cache-optimization-e2-browser-result-v1'; accepted: true; decoder: CacheOptimizationJsonObject; concurrency: 4; retentionTargetBytes: 67108864; retainedBytes: number; heapBeforeBytes: number | null; heapAfterBytes: number | null; mainThreadResponsivenessTicks: number; metrics: CacheOptimizationE2TransportMetrics; perSceneDecompaction: readonly CacheOptimizationE2SceneRecord[]; faults: CacheOptimizationJsonObject}>;
/** Accepted E2 terminal evidence envelope. */
type CacheOptimizationE2Result = CacheOptimizationTerminalResult & Readonly<{schemaId: 'distant-sun-cache-optimization-e2-result-v1'; conclusion: 'accepted'; accepted: true; parent: Readonly<{runId: '000041-e1-format-compression'; artifactSetSha256: '19d79885512d628ad874501b3c854b86eae2dfc374910bdae1dbc6569c96cf4a'}>; browser: CacheOptimizationE2BrowserResult; claimBoundary: string}>;
