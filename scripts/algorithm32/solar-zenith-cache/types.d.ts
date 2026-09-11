/** Exact scene and support supplied to the offline distant-Sun cache compiler. */
type DistantSunSceneCacheCompilerScene = Readonly<{
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed scene support closed by the ledger. */
	readonly support: DistantSunSceneCacheSupport;
}>;

/** Serialized recurrence request consumed by the browser GPU compiler. */
type DistantSunSceneCacheCompilerBuildRequest = Readonly<{
	/** Qualified compiler identity. */
	id: string;
	/** Complete serialized numerical inputs. */
	transportSpec: DistantSunSceneCacheTransportSpec;
}>;

/** Physical and numerical data consumed by the unchanged offline recurrence. */
type DistantSunSceneCacheTransportSpec = {
	/** Stable serialized specification identity. */ id: string;
	/** Physical source data. */ source: DistantSunSceneCacheCompilerSource;
	/** Planet radii and identity. */ planet: DistantSunSceneCacheCompilerPlanet;
	/** Atmospheric coefficients and ozone data. */ atmosphere: DistantSunSceneCacheCompilerAtmosphere;
	/** Ground identity. */ ground: Readonly<Record<string, string>>;
	/** Frozen interval counts and order. */ numerical: Readonly<Record<string, number>>;
	/** Frozen sample domains. */ domains: DistantSunSceneCacheCompilerDomains;
	/** Optional accepted coordinate convention. */ shaderProfile?: DistantSunSceneCacheCompilerShaderProfile;
};
/** Serialized source irradiance and optional source-aligned direction. */
type DistantSunSceneCacheCompilerSource = {
	/** Source identity. */ id: string;
	/** Native15 irradiance density values. */ spectralIrradianceDensity: readonly number[];
	/** Optional source-aligned direction. */ directionToLight?: readonly number[];
};
/** Spherical planet geometry in meters. */
type DistantSunSceneCacheCompilerPlanet = {
	/** Geometry identity. */ id: string;
	/** Ground radius in meters. */ bottomRadiusMeters: number;
	/** Atmosphere radius in meters. */ topRadiusMeters: number;
};
/** Frozen atmospheric numerical coefficients. */
type DistantSunSceneCacheCompilerAtmosphere = {
	/** Atmosphere identity. */ id: string;
	/** Rayleigh density scale in meters. */ rayleighScaleHeightMeters: number;
	/** Mie density scale in meters. */ mieScaleHeightMeters: number;
	/** Rayleigh scattering scale per meter. */ rayleighCoefficientScalePerMeter: number;
	/** Mie wavelength exponent. */ mieAngstromAlpha: number;
	/** Mie extinction scale. */ mieAngstromBeta: number;
	/** Mie single-scattering ratio. */ mieSingleScatteringAlbedo: number;
	/** Mie asymmetry parameter. */ miePhaseFunctionG: number;
	/** Ozone absorption specification. */ ozone: DistantSunSceneCacheCompilerOzone;
};
/** Ozone profile and absorption table. */
type DistantSunSceneCacheCompilerOzone = {
	/** Stable ozone identity. */ id: string;
	/** Absorption selection. */ absorptionEnabled: boolean;
	/** Table temperature in kelvin. */ temperatureKelvin: number;
	/** Column density in Dobson units. */ dobsonUnits: number;
	/** Dobson-unit molecule conversion. */ dobsonUnitMoleculesPerSquareMeter: number;
	/** Integrated profile extent in meters. */ densityIntegralMeters: number;
	/** Profile knot altitudes in meters. */ profileAltitudesMeters: Readonly<Record<string, number>>;
	/** Cross-section samples. */ crossSectionTable: DistantSunSceneCacheCompilerCrossSections;
	/** Optional peak molecular density per cubic meter. */ maximumDensityPerCubicMeter?: number;
};
/** Uniform wavelength-grid molecular cross sections. */
type DistantSunSceneCacheCompilerCrossSections = {
	/** First wavelength in nanometers. */ minimumNanometers: number;
	/** Last wavelength in nanometers. */ maximumNanometers: number;
	/** Sample spacing in nanometers. */ spacingNanometers: number;
	/** Cross-section unit identifier. */ units: string;
	/** Cross sections in square meters. */ values: readonly number[];
};
/** Optional shader coordinate selection preserved from the accepted compiler. */
type DistantSunSceneCacheCompilerShaderProfile = {
	/** Coordinate convention identity. */ coordinateContract?: string;
};
/** One frozen coordinate axis with scalar-valued sample records. */
type DistantSunSceneCacheCompilerAxis = {
	/** Domain identity. */ id: string;
	/** Sample count. */ count: number;
	/** Exact coordinates and ordinals. */ nodes: readonly Readonly<Record<string, number>>[];
};
/** Serialized angular domain and optional cubed-sphere or quadrature data. */
type DistantSunSceneCacheCompilerDirections = {
	/** Direction-domain identity. */ id: string;
	/** Direction count. */ directionCount: number;
	/** Unit vectors in established order. */ unitVectors: readonly (readonly number[])[];
	/** Optional cubed-sphere face width. */ faceWidth?: number;
	/** Optional cubed-sphere face-center indices. */ positiveFaceCenterIndices?: Readonly<Record<string, number>>;
	/** Optional quadrature weights in steradians. */ integrationWeightsSteradians?: readonly number[];
};
/** Native spectral sample with optional physical coefficient overrides. */
type DistantSunSceneCacheCompilerChannel = {
	/** Stable sample identity. */ id: string;
	/** Center wavelength in nanometers. */ centerNanometers: number;
	/** Sample width in nanometers. */ binWidthNanometers: number;
	/** Incident irradiance density. */ sourceIrradianceDensityWattsPerSquareMeterPerNanometer: number;
	/** Optional Rayleigh scattering per meter. */ rayleighScatteringPerMeter?: number;
	/** Optional Mie extinction per meter. */ mieExtinctionPerMeter?: number;
	/** Optional ground albedo. */ groundAlbedo?: number;
};
/** Frozen spectral basis in compiler serialization. */
type DistantSunSceneCacheCompilerSpectrum = {
	/** Spectral-basis identity. */ id: string;
	/** Ordered Native15 samples. */ channels: readonly DistantSunSceneCacheCompilerChannel[];
};
/** Exact axes, directions, and wavelengths consumed by the compiler. */
type DistantSunSceneCacheCompilerDomains = {
	/** Altitude domain. */ position: DistantSunSceneCacheCompilerAxis;
	/** Solar-zenith domain. */ solarZenith: DistantSunSceneCacheCompilerAxis;
	/** Incoming quadrature domain. */ incoming: DistantSunSceneCacheCompilerDirections;
	/** Outgoing cubed-sphere domain. */ outgoing: DistantSunSceneCacheCompilerDirections;
	/** Native15 spectral domain. */ spectrum: DistantSunSceneCacheCompilerSpectrum;
};
/** Complete scene extraction request for one recurrence. */
type DistantSunSceneCacheCompilerExtraction = {
	/** Stable cache identity. */ cacheIdentity: string;
	/** Exact populated-row extraction ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
};
/** Caller-owned spectral layer delivered after GPU readback. */
type DistantSunSceneCacheCompilerLayer = {
	/** Extraction ordinal. */ cacheIndex: number;
	/** Native15 wavelength ordinal. */ wavelengthIndex: number;
	/** Exact logical W27 values owned by the callback. */ values: Float32Array<ArrayBuffer>;
};
/** Bounded contiguous readback tile; each callback settles before the next tile. */
type DistantSunSceneCacheCompilerReadbackTile = DistantSunSceneCacheCompilerLayer & {
	/** First populated extraction row. */ firstPackedRow: number;
	/** Number of complete rows, from one through 64. */ rowCount: number;
};
/** Optional order-specific extraction used by retained proof callers. */
type DistantSunSceneCacheCompilerOrderLayer = DistantSunSceneCacheCompilerLayer & {
	/** Completed scattering order. */ order: number;
};
/** Exact diagnostic sample coordinate. */
type DistantSunSceneCacheCompilerProbeCoordinate = {
	/** Human-readable probe identity. */ label: string;
	/** Direction column. */ x: number;
	/** Packed source row. */ y: number;
};
/** One diagnostic field readback. */
type DistantSunSceneCacheCompilerFieldProbes = {
	/** Field identity. */ fieldId: string;
	/** Wavelength ordinal. */ wavelengthIndex: number;
	/** Probe values in requested order. */ values: DistantSunSceneCacheCompilerProbeValue[];
};
/** Diagnostic coordinate with its exact GPU value. */
type DistantSunSceneCacheCompilerProbeValue = DistantSunSceneCacheCompilerProbeCoordinate & {
	/** Readback scalar. */ value: number;
};
/** One complete wavelength execution with optional bounded extraction callbacks. */
type DistantSunSceneCacheWavelengthRequest = {
	/** Caller-owned WebGL2 context. */ gl: WebGL2RenderingContext;
	/** Exact compiler inputs. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Native15 ordinal, default seven. */ wavelengthIndex?: number;
	/** Awaited progress observer; rejection cancels execution. */ reportProgress?: (stage: string) => Promise<void>;
	/** Whether to accumulate scene extraction fields. */ compileSceneCaches?: boolean;
	/** Ordered extraction definitions. */ sceneCacheRequests?: DistantSunSceneCacheCompilerExtraction[];
	/** Legacy complete-layer receiver. */ onSceneCacheLayer?: (
		layer: DistantSunSceneCacheCompilerLayer,
	) => Promise<void>;
	/** Optional bounded receiver replacing complete-layer delivery. */ onSceneCacheTile?:
		((tile: DistantSunSceneCacheCompilerReadbackTile) => Promise<void>) | null;
	/** Requested tile bound, one through 64 rows. */ sceneCacheReadbackRowCount?: number;
	/** Optional order-specific diagnostic receiver. */ onSceneCacheOrderLayer?:
		((layer: DistantSunSceneCacheCompilerOrderLayer) => Promise<void>) | null;
	/** Optional field-specific probe coordinates. */ fieldProbeCoordinates?: Readonly<
		Record<string, DistantSunSceneCacheCompilerProbeCoordinate[]>
	>;
	/** Optional diagnostic probe receiver. */ onFieldProbes?:
		((probes: DistantSunSceneCacheCompilerFieldProbes) => Promise<void>) | null;
};
/** JSON-safe compiler execution diagnostics; individual retained proof consumers validate their required fields. */
type DistantSunSceneCacheWavelengthResult = Readonly<Record<string, unknown>>;

/** One explicitly requested receiver-local scene. */
type DistantSunPointLocalScene = {
	/** Caller-owned scene identity. */ id: string;
	/** Observer-to-Sun zenith angle in degrees. */ zenithDegrees: number;
	/** Observer height above the spherical ground in meters. */ observerAltitudeMeters: number;
	/** Optional observation instant or exact input label. */ instant?: string;
	/** Optional complete per-scene production-profile identity. */ profileIdentity?: Readonly<Record<string, string>>;
};
/** One bounded group of shared altitude/local-Sun-angle coordinates. */
type DistantSunPointLocalBlock = {
	/** Production 8x8 tile origin. */ tile: {altitudeIndex: number; solarZenithIndex: number};
	/** Populated coordinates retained by this bounded block. */ coordinates: number[][];
};
/** One requested scene and its ordered reconstruction indexes. */
type DistantSunPointLocalSceneInventory = {
	/** Position in the caller's scene list. */ ordinal: number;
	/** Exact caller input. */ request: DistantSunPointLocalScene;
	/** Interpolation-closed production ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
	/** Coordinate keys in scene payload order. */ keys: string[];
	/** Index into the shared coordinate inventory for every scene row. */ indexes: number[];
};
/** Complete input-driven receiver-local shared inventory. */
type DistantSunPointLocalInventory = {
	/** Complete physical and numerical compiler request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordered scene consumers, including duplicates. */ scenes: DistantSunPointLocalSceneInventory[];
	/** Sorted unique altitude/local-Sun-angle coordinates. */ coordinates: number[][];
	/** Bounded block ownership. */ blocks: DistantSunPointLocalBlock[];
	/** Little-endian logical-to-unique W27 map. */ directionBytes: Buffer;
	/** Seam-deduplicated outgoing-direction count. */ uniqueDirectionCount: number;
	/** Logical W27 outgoing-direction count. */ logicalDirectionCount: number;
	/** Materialized spectral-channel count. */ channelCount: number;
	/** Materialized indexes into the complete spectral basis. */ wavelengths: number[];
	/** Maximum decoded bytes in one encoded block. */ maximumDecodedBlockBytes: number;
	/** Maximum encoded bytes in one stored block. */ maximumEncodedBlockBytes: number;
	/** Compiler extraction ledger for the complete union. */ unionLedger: DistantSunSceneCacheLedgerRecord;
};
/** One encoded point-local cache block. */
type DistantSunPointLocalPackageBlock = DistantSunPointLocalBlock & {
	/** Canonical block ordinal. */ ordinal: number;
	/** Decoded staging identity. */ decoded: {byteLength: number; sha256: string};
	/** Encoded repository artifact. */ encoded: DistantSunSharedCacheFileIdentity;
	/** Reversible codec identity. */ codec: string;
};
/** Serialized production point-local cache. */
type DistantSunPointLocalPackageRecord = {
	/** Format identity. */ schemaId: string;
	/** Complete package content identity. */ packageIdentity: string;
	/** Compiler identity. */ compilerIdentity: string;
	/** Serialized physical/numerical request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Physical quantity and units. */ physicalQuantity: Readonly<Record<string, string>>;
	/** Serialized dimensions and ordering. */ layout: {
		id: string;
		channelCount: number;
		wavelengthIndexes: number[];
		logicalDirectionCount: number;
		uniqueDirectionCount: number;
		coordinateCount: number;
		maximumDecodedBlockBytes: number;
		maximumEncodedBlockBytes: number;
	};
	/** Sorted shared coordinate inventory. */ coordinates: number[][];
	/** Ordered scene reconstruction indexes. */ scenes: DistantSunPointLocalSceneInventory[];
	/** Complete bounded block inventory. */ blocks: DistantSunPointLocalPackageBlock[];
	/** Logical-to-unique W27 map. */ directionMap: DistantSunSharedCacheFileIdentity;
};
/** Inputs to the point-local package finalizer. */
type DistantSunPointLocalPackageWriteRequest = {
	/** Repository artifact owner. */ files: SharedGenerationFiles;
	/** New package root. */ root: string;
	/** Completed decoded staging root. */ stagingRoot: string;
	/** Validated inventory. */ inventory: DistantSunPointLocalInventory;
	/** Production implementation identity. */ implementation: DistantSunSharedCacheImplementationIdentity & {
		sources?: Readonly<Record<string, unknown>>[];
	};
	/** Browser/GPU execution evidence. */ gpu: SharedGenerationGpuResult;
	/** Caller cancellation. */ signal: AbortSignal;
	/** Durable packaging progress. */ progress?: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** One production point-local compiler invocation. */
type DistantSunPointLocalCompileRequest = {
	/** New repository-relative run directory. */ outputDirectory: string;
	/** Complete physical/numerical construction request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Ordered scene list. */ scenes: DistantSunPointLocalScene[];
	/** Selected spectral indexes. */ wavelengths: number[];
	/** Caller-owned cancellation. */ signal: AbortSignal;
	/** Optional durable progress observer. */ onProgress?: (
		event: Readonly<Record<string, unknown>>,
	) => void | Promise<void>;
};
/** Accepted compiler result and work accounting. */
type DistantSunPointLocalCompileResult = {
	/** Successful completion. */ accepted: boolean;
	/** Production compiler identity. */ compilerIdentity: string;
	/** Repository-relative immutable run root. */ outputDirectory: string;
	/** Serialized cache identity. */ packageIdentity: string;
	/** Package manifest artifact. */ manifest: DistantSunSharedCacheFileIdentity;
	/** Input artifact. */ input: DistantSunSharedCacheFileIdentity;
	/** Implementation artifact. */ implementation: DistantSunSharedCacheFileIdentity;
	/** Requested scene count. */ sceneCount: number;
	/** Materialized channel count. */ channelCount: number;
	/** Unique coordinate count. */ coordinateCount: number;
	/** Encoded block count. */ blockCount: number;
	/** Decoded shared staging bytes. */ stagedBytes: number;
	/** Browser/GPU execution evidence. */ gpu: SharedGenerationGpuResult;
	/** Complete wall time in milliseconds. */ elapsedMilliseconds: number;
};

/** Complete normalized input set for one offline distant-Sun scene-cache build. */
type DistantSunSceneCacheCompilerInputSet = Readonly<{
	/** Stable production compiler identity. */
	readonly compilerIdentity: string;
	/** Complete numerical compatibility identity. */
	readonly numericalIdentity: string;
	/** Exact scene and support. */
	readonly scene: DistantSunSceneCacheCompilerScene;
	/** Executable packed-row ledger. */
	readonly ledger: DistantSunSceneCacheLedger;
	/** Browser-GPU recurrence request. */
	readonly buildRequest: DistantSunSceneCacheCompilerBuildRequest;
}>;

/** Canonical destination of one union coordinate in direct block staging. */
type SharedGenerationStagingLocation = {
	/** Ordered canonical block index. */ block: number;
	/** Populated row within that block. */ row: number;
};
/** Exact result of a bounded source read. */
type SharedGenerationReadResult = {
	/** Number of bytes actually read. */ bytesRead: number;
};
/** Exact result of a bounded destination write. */
type SharedGenerationWriteResult = {
	/** Number of bytes actually persisted. */ bytesWritten: number;
};
/** Required ordinary-file facts. */
type SharedGenerationFileFacts = {
	/** Logical file length. */ size: number;
};
/** Narrow offline file capability implemented by the Node-owned handle. */
interface SharedGenerationFileHandle {
	/** Reads at an absolute offset into bounded storage. */ read(
		bytes: Uint8Array,
		offset: number,
		length: number,
		position: number,
	): Promise<SharedGenerationReadResult>;
	/** Writes a bounded range at an absolute offset. */ write(
		bytes: Uint8Array,
		offset: number,
		length: number,
		position: number,
	): Promise<SharedGenerationWriteResult>;
	/** Persists one complete artifact. */ writeFile(bytes: Uint8Array): Promise<void>;
	/** Flushes outstanding writes. */ sync(): Promise<void>;
	/** Releases the handle. */ close(): Promise<void>;
	/** Fixes the target's logical extent. */ truncate(length: number): Promise<void>;
	/** Returns the source's logical extent. */ stat(): Promise<SharedGenerationFileFacts>;
}
/** Repository-contained offline artifact capability. */
interface SharedGenerationFiles {
	/** Resolves a real ordinary repository path. */ resolve(relativePath: string): Promise<string>;
	/** Creates contained ordinary directories. */ directory(relativePath: string): Promise<string>;
	/** Exclusively creates an open-run file. */ create(relativePath: string): Promise<SharedGenerationFileHandle>;
	/** Reads a bounded authenticated artifact. */ read(
		relativePath: string,
		expected?: DistantSunSharedCacheFileIdentity | null,
		maximumBytes?: number,
	): Promise<Buffer>;
	/** Writes an exclusive complete artifact. */ write(
		relativePath: string,
		bytes: Uint8Array,
	): Promise<DistantSunSharedCacheFileIdentity>;
	/** Replaces the current open run's progress. */ progress(relativePath: string, value: unknown): Promise<void>;
	/** Computes exact byte identity. */ hash(bytes: string | Uint8Array): string;
}
/** Private host's tile-delivery capability. */
interface SharedGenerationTileSink {
	/** Persists an ordered bounded tile. */ accept(
		channel: number,
		firstRow: number,
		bytes: Uint8Array,
	): Promise<void>;
}
/** Bounded request stream consumed by the private host. */
interface SharedGenerationIncomingMessage extends AsyncIterable<Buffer> {}
/** Local response-writing capability. */
interface SharedGenerationServerResponse {
	/** Emits explicit response framing. */ writeHead(
		status: number,
		headers: Readonly<Record<string, string>>,
	): unknown;
	/** Completes the response body. */ end(body: string | Uint8Array): unknown;
}
/** Canonical production tile origin. */
type SharedGenerationTile = DistantSunSharedCacheBlockDescriptor['tile'];
/** Measured graphics implementation. */
type SharedGenerationGpuIdentity = {
	/** WebGL API identity. */ api: string;
	/** Driver renderer identity. */ renderer: string;
};
/** Independently reconstructed control payload. */
type SharedGenerationSceneVerification = {
	/** Canonical scene identity. */ id: string;
	/** Payload byte count. */ byteLength: number;
	/** Exact reconstructed digest. */ sha256: string;
	/** Whether every byte matched. */ exact: boolean;
};
/** Expected persisted metadata root before publication. */
type SharedGenerationGraphRequest = {
	/** Contained artifact reader. */ files: SharedGenerationFiles;
	/** Unpublished package directory. */ candidateRoot: string;
	/** Authenticated package-set root. */ reportArtifact: DistantSunSharedCacheFileIdentity;
	/** Caller-owned cancellation. */ signal: AbortSignal;
};
/** Fully authenticated persisted metadata graph. */
type SharedGenerationGraph = {
	/** Persisted package-set report. */ report: DistantSunSharedCachePackageSetReport;
	/** Persisted configuration. */ configuration: DistantSunSharedCacheConfigurationManifest;
	/** Persisted block ownership. */ blockIndex: DistantSunSharedCacheBlockIndex;
	/** Persisted scene catalog. */ catalog: DistantSunSharedCacheRuntimeCatalog;
	/** Persisted scene manifests in ordinal order. */ scenes: DistantSunSharedCacheSceneManifest[];
	/** Authenticated metadata size. */ metadataBytes: number;
	/** Authenticated metadata and direction-index artifacts. */ metadataArtifactCount: number;
};
/** A verified immutable control scene and its exact coordinate order. */
type SharedGenerationScene = {
	/** Canonical scene ordinal. */ ordinal: number;
	/** Contained control directory. */ base: string;
	/** Accepted dense manifest. */ manifest: DistantSunSceneCacheManifestRecord;
	/** Accepted packed-row ledger. */ ledger: DistantSunSceneCacheLedgerRecord;
	/** Altitude:zenith keys in packed-row order. */ coordinates: string[];
	/** Immutable parent manifest identity. */ manifestArtifact: DistantSunSharedCacheFileIdentity;
};
/** A populated 8x8 tile before encoding. */
type SharedGenerationBlock = {
	/** Aligned tile origin. */ tile: SharedGenerationTile;
	/** Populated coordinates in canonical order. */ coordinates: DistantSunSharedCacheCoordinate[];
};
/** Authenticated shared union and exact compiler parameters. */
type SharedGenerationInventory = {
	/** Complete ordered control set. */ scenes: SharedGenerationScene[];
	/** Exact sorted union. */ coordinates: DistantSunSharedCacheCoordinate[];
	/** Complete sorted block set. */ blocks: SharedGenerationBlock[];
	/** Common extraction ledger. */ unionLedger: DistantSunSceneCacheLedgerRecord;
	/** Serialized compiler request. */ buildRequest: DistantSunSceneCacheCompilerBuildRequest;
	/** Exact logical-to-unique u16 bytes. */ directionBytes: Buffer;
	/** Authenticated catalog parent. */ catalogArtifact: DistantSunSharedCacheFileIdentity;
};
/** Browser-produced execution measurements for the common-field recurrence. */
type SharedGenerationGpuResult = {
	/** Successful completion. */ accepted: boolean;
	/** Entire GPU host execution time. */ elapsedMilliseconds: number;
	/** Per-wavelength compiler evidence. */ wavelengths: Readonly<Record<string, unknown>>[];
	/** Browser implementation identity. */ userAgent: string;
	/** Actual renderer and API identifiers. */ gpu: SharedGenerationGpuIdentity;
	/** Largest requested readback allocation. */ maximumReadbackBytes: number;
	/** Simultaneously live union accumulators. */ unionAccumulatorBytes: number;
};
/** Common host request shared by the private compiler and run owner. */
type SharedGenerationHostRequest = {
	/** Optional stricter host deadline in milliseconds; defaults to the 900,000 ms production ceiling. */ maximumMilliseconds?: number;
	/** Repository filesystem owner. */ files: SharedGenerationFiles;
	/** Exclusive open run root. */ runRoot: string;
	/** Accepted control union. */ inventory: SharedGenerationInventory;
	/** Direct tile receiver. */ staging: SharedGenerationTileSink;
	/** Local Chrome executable. */ chromePath: string;
	/** Caller-owned cancellation signal. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** Complete finalizer request with immutable derivation parents. */
type SharedGenerationPackageRequest = {
	/** Contained artifact owner. */ files: SharedGenerationFiles;
	/** Accepted control metadata. */ inventory: SharedGenerationInventory;
	/** Unpublished package root. */ candidateRoot: string;
	/** Complete block staging root. */ stagingRoot: string;
	/** Exact implementation identity. */ implementation: DistantSunSharedCacheImplementationIdentity;
	/** Derivation parents. */ parents: DistantSunSharedCacheDerivationParent[];
	/** Exact numerical parameter digest. */ parametersSha256: string;
	/** Browser implementation identity. */ browserVersion: string;
	/** Caller cancellation. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** Complete candidate metadata graph returned by the finalizer. */
type SharedGenerationPackageResult = {
	/** Executable package root. */ report: DistantSunSharedCachePackageSetReport;
	/** Root artifact identity. */ reportArtifact: DistantSunSharedCacheFileIdentity;
	/** Accepted physical/numerical configuration. */ configuration: DistantSunSharedCacheConfigurationManifest;
	/** Accepted block index. */ blockIndex: DistantSunSharedCacheBlockIndex;
	/** Accepted ordered catalog. */ catalog: DistantSunSharedCacheRuntimeCatalog;
	/** Total compressed payload bytes. */ encodedBytes: number;
};
/** Independent reconstruction inputs. */
type SharedGenerationVerificationRequest = {
	/** Contained filesystem. */ files: SharedGenerationFiles;
	/** Immutable control set. */ inventory: SharedGenerationInventory;
	/** Candidate metadata. */ candidate: SharedGenerationPackageResult;
	/** Unpublished candidate root. */ candidateRoot: string;
	/** Exact decoded staging root. */ stagingRoot: string;
	/** Cancellation signal. */ signal: AbortSignal;
	/** Durable progress receiver. */ progress: (event: Readonly<Record<string, unknown>>) => Promise<void>;
};
/** All-scene exactness and allocation evidence. */
type SharedGenerationVerificationResult = {
	/** True only after every exact comparison. */ accepted: boolean;
	/** Independently reconstructed identities. */ scenes: SharedGenerationSceneVerification[];
	/** Total immutable control bytes compared. */ comparedBytes: number;
	/** Encoded block validation time. */ blockVerificationMilliseconds: number;
	/** Full verification time. */ elapsedMilliseconds: number;
	/** Bounded row comparison allocation. */ comparisonBufferBytes: number;
	/** Authenticated persisted metadata artifacts. */ metadataArtifactCount: number;
	/** Authenticated persisted metadata byte count. */ metadataBytes: number;
};
/** Explicit generator execution dependencies. */
type SharedGenerationRequest = {
	/** Local GPU-capable Chrome executable. */ chromePath: string;
	/** Caller-owned cancellation. */ signal: AbortSignal;
	/** Observes completed durable progress events; rejection cancels generation before publication. */ onProgress?: (
		event: Readonly<Record<string, unknown>>,
	) => void | Promise<void>;
};
/** Accepted immutable run and measured production limits. */
type SharedGenerationRunResult = {
	/** Successful acceptance. */ accepted: boolean;
	/** Unique run identity. */ runId: string;
	/** New content-addressed publication directory. */ publishedRoot: string;
	/** Package graph identity. */ packageSetIdentity: string;
	/** Root report digest. */ packageSetSha256: string;
	/** Complete candidate bytes. */ candidateBytes: number;
	/** Complete open run footprint before final acceptance records. */ workingBytesBeforePublication: number;
	/** Declared logical working-disk ceiling. */ maximumWorkingBytes: number;
	/** Declared Node process memory ceiling, excluding browser/driver overhead. */ maximumNodeRssBytes: number;
	/** Unique block staging bytes. */ stagedBytes: number;
	/** Eliminated duplicated scene staging bytes. */ avoidedSceneStagingBytes: number;
	/** Complete generation wall time. */ elapsedMilliseconds: number;
	/** Compression and metadata wall time. */ compressionAndMetadataMilliseconds: number;
	/** Independent verification wall time. */ verificationMilliseconds: number;
	/** Observed peak host RSS. */ peakRssBytes: number;
	/** Observed peak Node array-buffer allocation. */ peakArrayBufferBytes: number;
	/** Maximum requested GPU readback bytes. */ maximumReadbackBytes: number;
	/** Exact union accumulator allocation. */ unionAccumulatorBytes: number;
	/** Verified scene count. */ sceneCount: number;
	/** Complete block count. */ blockCount: number;
	/** Exact source implementation. */ implementation: DistantSunSharedCacheImplementationIdentity;
	/** Immutable derivation roots. */ parents: DistantSunSharedCacheDerivationParent[];
};
/** Chromium's optional measured JavaScript heap extension. */
type SharedQualificationPerformance = Performance & {
	/** Browser-observed heap allocation, excluding GPU and native process memory. */
	memory?: {usedJSHeapSize: number};
};
/** CommonJS plugin's callable runtime export across its legacy declaration boundary. */
type SharedQualificationCommonJsFactory = () => import('rollup').Plugin;

/** Candidate shared packet rendering or immutable dense numerical control. */
type SharedQualificationSelection = 'shared' | 'dense';
/** Coherence observed after actual production render calls. */
type SharedQualificationCoherence = {
	/** Maximum simultaneous atlas bytes observed after render. */ peakGpuBytes: number;
	/** Maximum explicit host pins observed after render. */ peakPinnedBytes: number;
	/** Maximum browser JavaScript heap bytes observed after render. */ peakHeapBytes: number;
	/** Rendered frame count. */ frames: number;
	/** Bounded failed selection comparisons. */ failures: {
		ordinal: number | null;
		actual: number | null;
		identity: string;
	}[];
	/** Published generation changes. */ generations: {generation: number; ordinal: number | null; identity: string}[];
};
/** Measured application state at a qualification boundary. */
type SharedQualificationSnapshot = {
	/** Public rendering diagnostics. */ canvas: DOMStringMap;
	/** Atmospheric source direction. */ direction: number[];
	/** Geometry source direction. */ geometryDirection: number[];
	/** Receiver-light snapshot identity. */ receiverIdentity: string;
	/** Whether the initial runtime is retained. */ sameRuntime: boolean;
	/** Whether the initial shader handle is retained. */ sameHandle: boolean;
	/** Compiled program identities. */ programs: number[];
	/** Renderer-owned live counts. */ rendererMemory: {geometries: number; textures: number};
	/** Shared residency facts, absent for the dense control. */ cache?: DistantSunSharedCacheControllerDiagnostics;
	/** Worker and host retention facts. */ transport?: DistantSunSharedCacheTransportDiagnostics;
	/** WebGL error code. */ glError: number;
	/** Physical framebuffer dimensions. */ drawingBuffer: number[];
	/** Reported driver identity. */ gpu: string;
	/** Browser-observed JavaScript heap bytes. */ heapBytes?: number;
	/** Post-render selection observations. */ coherence: SharedQualificationCoherence;
};
/** Complete rendered RGBA8 framebuffer in WebGL row order. */
type SharedQualificationPixels = {width: number; height: number; base64: string};
/** One physical time change through the production controller. */
type SharedQualificationTransition = {
	/** Requested solar zenith. */ degrees: number;
	/** Preparation and publication wall time. */ elapsedMilliseconds: number;
	/** State before the request. */ before: SharedQualificationSnapshot;
	/** State after publication. */ after: SharedQualificationSnapshot;
	/** GPU query observations collected during preparation. */ samples: ShaderPerformanceSample[];
	/** Bounded receiver-light stage timings. */ preparationStages: {operation: string; milliseconds: number}[];
};
/** Timing observations outside recording work. */
type SharedQualificationMeasurement = {
	/** Completed-frame wall durations in milliseconds. */ durations: number[];
	/** Asynchronously available GPU timing queries. */ samples: ShaderPerformanceSample[];
	/** State after measurement. */ state: SharedQualificationSnapshot;
};
/** Exact resident block comparison counts. */
type SharedQualificationProbe = {blocks: number; scalars: number; totalBlocks: number};
/** Entire catalog traversal while visible rendering is paused. */
type SharedQualificationInventoryEntry = SharedQualificationProbe & {
	/** Catalog ordinal. */ ordinal: number;
	/** Residency after publication. */ diagnostics: DistantSunSharedCacheControllerDiagnostics;
};
/** Actual application fault and restoration observations. */
type SharedQualificationLifecycle = {
	/** Superseded request was rejected. */ supersession: boolean;
	/** Complete last-good state. */ beforeMiss: SharedQualificationSnapshot;
	/** Preserved state after an unqualified jump. */ afterMiss: SharedQualificationSnapshot;
	/** Texture-free data state. */ dark: SharedQualificationTransition;
	/** Latest observation before losing the context. */ beforeLoss: SharedQualificationSnapshot;
	/** Restored matching observation. */ afterLoss: SharedQualificationSnapshot;
};
/** Independent dense-control bit oracle for one shared block. */
type SharedQualificationOracleBlock = {
	/** Authenticated block identity. */ blockId: string;
	/** Populated row count. */ rowCount: number;
	/** Immutable dense payload identities and row selections. */ parents: {
		row: number;
		coordinate: readonly number[];
		artifact: DistantSunSharedCacheFileIdentity;
		denseRow: number;
		denseRowCount: number;
	}[];
	/** Exact expected RGBA bits at independently chosen packet coordinates. */ samples: {
		row: number;
		face: number;
		u: number;
		v: number;
		packet: number;
		expected: number[];
	}[];
	/** Equation used to derive expected bits from dense inputs. */ operation: string;
};
