/**
 * Logical cache-construction operation represented by one pass.
 *
 * - **"primary-j1"** - Primary single-scattering-density construction.
 * - **"direct-l1"** - Direct primary-radiance construction.
 * - **"scatter"** - Later-order scattering-density construction.
 * - **"transport"** - Scattering-density to radiance transport.
 * - **"accumulate"** - Pure-radiance accumulation into the cumulative field.
 */
type CachePassKind = 'primary-j1' | 'direct-l1' | 'scatter' | 'transport' | 'accumulate';

/** Type that identifies one supported internal scattering order. */
type CacheOrder = 1 | 2 | 3 | 4 | 5;

/** Type that supplies normalized packed physical data without exposing renderer resources. */
type CacheData = Readonly<{
	/** Id value. */ id: string;
	/** Quantity value. */ quantity: string;
	/** Units value. */ units: string;
	/** Shape value. */ shape: readonly number[];
	/** Values value. */ values: readonly number[];
	/** Content hash value. */ contentHash: string;
}>;

/**
 * Canonical cache-data property replaced during definition acceptance.
 *
 * - **"contentHash"** - The stable identity derived after payload normalization.
 * - **"values"** - The canonical array replaced by caller-supplied array-like values.
 */
type CacheDataDefinitionExcludedProperty = 'contentHash' | 'values';

/** Packed physical-data input before copying and stable identity derivation. */
type CacheDataDefinition = Readonly<
	Omit<CacheData, CacheDataDefinitionExcludedProperty> & {
		/** Array-like scalar payload copied into the cache-data value. */
		values: ArrayLike<number>;
	}
>;

/** Source-owned facts included in exact cache-plan reuse identity. */
type CachePlanReuseFacts = Readonly<Record<string, unknown>>;

/** Type that identifies one source-owned logical field. */
type CacheFieldId = string;

/** Type that supplies executable R32F allocation facts. */
type CacheFieldStorage = Readonly<{
	/** Data format of the allocated cache field. */ format: 'R32F';
	/** Width value. */ width: number;
	/** Height value. */ height: number;
	/** Layers value. */ layers: number;
}>;

/** Pairing of one logical field id with its allocation request. */
type CacheFieldSpec = Readonly<{
	/** Id value. */ id: CacheFieldId;
	/** Storage value. */ storage: CacheFieldStorage;
}>;

/** Renderer-neutral scalar-field allocation request. */
type GpuFieldSpec = CacheFieldSpec;

/** Type that describes the reflective illumination source owned by one scatter pass. */
type CacheGroundReflection =
	| Readonly<{
			/** Value that selects direct source illumination for J2. */
			kind: 'direct-source';
	  }>
	| Readonly<{
			/** Value that selects pure L(k - 2) illumination for Jk, k >= 3. */
			kind: 'pure-radiance';
			/** Value that identifies the pure radiance field that illuminates the ground. */
			illumination: CacheFieldSpec;
	  }>;

/** Type that describes one logical GPU cache-construction pass. */
type CachePass = Readonly<{
	/** Id value. */ id: string;
	/** Kind value. */ kind: CachePassKind;
	/** Order value. */ order: CacheOrder;
	/** Inputs value. */ inputs: readonly CacheFieldId[];
	/** Output value. */ output: CacheFieldId;
	/** Modules value. */ modules: readonly CacheBuildModule[];
}>;

/** Renderer-neutral field pass whose semantic operation remains caller-owned. */
type GpuFieldPass = Readonly<{
	/** Stable pass identifier. */ id: string;
	/** Logical input field identifiers. */ inputs: readonly CacheFieldId[];
	/** Logical output field identifier. */ output: CacheFieldId;
	/** Declared modules assembled for the pass. */ modules: readonly CacheBuildModule[];
}>;

/** Complete renderer-neutral scalar-field execution graph. */
type GpuFieldExecutionPlan = Readonly<{
	/** Fields allocated during execution. */ fields: readonly GpuFieldSpec[];
	/** Ordered field-producing passes. */ passes: readonly GpuFieldPass[];
	/** Field retained as the completed result. */ result: CacheFieldId;
	/** Shader value populated by the completed runtime binding. */ valueKey: CacheRuntimeValueKey;
}>;

/** Type that describes a complete source-owned construction graph. */
type CacheBuildPlan = Readonly<{
	/** Value that identifies the complete executable logical graph. */
	identity: CacheReuseIdentity;
	/** Fields value. */ fields: readonly CacheFieldSpec[];
	/** Passes value. */ passes: readonly CachePass[];
	/** Result value. */ result: CacheFieldId;
}>;

/** Type that describes one complete construction fragment shader. */
type CacheShader = Readonly<{
	/** Id value. */ id: string;
	/** Source value. */ source: string;
	/** Source hash value. */ sourceHash: string;
	/** Bindings value. */ bindings: readonly CacheBinding[];
	/** Output value. */ output: CacheFieldSpec;
}>;

/** Assemble one logical pass and its executor-resolved output field. */
interface CacheAssembler {
	/**
	 * Call this method to assemble.
	 * @param pass - The pass value accepted by the operation.
	 * @param output - The output value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}

/** Contract that assembles one renderer-neutral field pass. */
interface GpuFieldAssembler {
	/**
	 * Call this method to assemble one field-producing pass.
	 * @param pass - The caller-owned logical field pass.
	 * @param output - The executor-resolved output field.
	 * @returns - The complete field-construction shader.
	 */
	assemble(pass: GpuFieldPass, output: GpuFieldSpec): CacheShader;
}

/** Construction collaborators for a renderer-neutral cache GPU executor. */
type CacheGpuExecutorConfiguration = Readonly<{
	/** Renderer-specific GPU construction backend. */
	backend: CacheGpuBackend;

	/** Provider-neutral cache-pass assembler. */
	assembler: CacheAssembler;
}>;

/** Construction collaborators for the neutral scalar-field GPU executor. */
type GpuFieldExecutorConfiguration = Readonly<{
	/** Renderer-specific GPU construction backend. */
	backend: CacheGpuBackend;
	/** Caller-provided renderer-neutral pass assembler. */
	assembler: GpuFieldAssembler;
}>;

/** Request bounded selected-scalar readback from one live field. */
type CacheProbeRequest = Readonly<{
	/** Field value. */ field: GpuCacheField;
	/** Coordinates value. */ coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Type that declares selected scalar coordinates for one logical field. */
type CacheProbe = Readonly<{
	/** Field value. */ field: CacheFieldId;
	/** Coordinates value. */ coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Type that returns selected scalar values without exposing full-field readback. */
type CacheProbeResult = Readonly<{
	/** Field id value. */ fieldId: CacheFieldId;
	/** Stored cache-field samples. */ samples: readonly Readonly<{
		/** Coordinates value. */ coordinates: DirectionalSpectralFieldCoordinates;
		/** Value value. */ value: number;
	}>[];
}>;

/** Contract that supplies the optional selected-scalar diagnostic capability. */
interface CacheProbeReader {
	/**
	 * Call this method to read selected scalars.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
}

/** Type that configures one staging-plan execution. */
type CacheExecutionOptions = Readonly<{
	/** Scheduler value. */ scheduler?: CacheBuildScheduler;
	/** Signal value. */ signal?: AbortSignal;
	/** Probe reader value. */ probeReader?: CacheProbeReader;
	/** Probes value. */ probes?: readonly CacheProbe[];
}>;

/** Type that describes diagnostics captured for one completed pass. */
type CachePassDiagnostic = Readonly<{
	/** Id value. */ id: string;
	/** Submission duration value. */ submissionDuration?: Duration;
	/** Probe value. */ probe?: CacheProbeResult;
}>;

/** Type that records exact logical GPU payload requested during one completed build. */
type CacheBuildMemoryDiagnostics = Readonly<{
	/** Peak field storage value. */ peakFieldStorage: UnitValue<'bytes'>;
	/** Peak packed data storage value. */ peakPackedDataStorage: UnitValue<'bytes'>;
	/** Peak tracked storage value. */ peakTrackedStorage: UnitValue<'bytes'>;
	/** Resident field storage value. */ residentFieldStorage: UnitValue<'bytes'>;
}>;

/** Type that describes diagnostics captured for one completed build. */
type CacheBuildDiagnostics = Readonly<{
	/** Passes value. */ passes: readonly CachePassDiagnostic[];
	/** Memory value. */ memory: CacheBuildMemoryDiagnostics;
}>;

/** Type that owns the completed staging result and its runtime binding. */
type CacheBuildArtifact = Readonly<{
	/** Result value. */ result: GpuCacheField;
	/** Runtime bindings value. */ runtimeBindings: CacheRuntimeBindings;
	/** Diagnostics value. */ diagnostics: CacheBuildDiagnostics;
	/** Call this method to dispose. */ dispose(): void;
}>;

/** Completed neutral GPU field and its caller-selected runtime binding. */
type GpuFieldArtifact = CacheBuildArtifact;

/** Execution options for one neutral field graph. */
type GpuFieldExecutionOptions = CacheExecutionOptions;
