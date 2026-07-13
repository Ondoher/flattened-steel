/** Identify the owner of one cache-construction module. */
type CacheBuildOwner =
	| "lightSource"
	| "atmosphere"
	| "geometry"
	| "ground"
	| "transport"
	| "cache";

/** Identify one logical cache-construction operation. */
type CachePassKind =
	| "primary-j1"
	| "direct-l1"
	| "scatter"
	| "transport"
	| "accumulate";

/** Identify one supported internal scattering order. */
type CacheOrder = 1 | 2 | 3 | 4;

/** Identify where one construction-source block is emitted. */
type CacheShaderPhase = "declare" | "function" | "main";

/** Supply one deterministically ordered construction-source block. */
type CacheShaderBlock = Readonly<{
	id: string;
	phase: CacheShaderPhase;
	order: number;
	source: string;
}>;

/** Identify one declarative construction binding. */
type CacheBindingKind = "uniform" | "data" | "define";

/** Identify how often one construction binding may change. */
type CacheBindingFrequency = "build" | "pass" | "layer";

/** Supply normalized packed physical data without exposing renderer resources. */
type CacheData = Readonly<{
	id: string;
	quantity: string;
	units: string;
	shape: readonly number[];
	values: readonly number[];
	contentHash: string;
}>;

/** Supply packed physical data before its stable identity is derived. */
type CacheDataDefinition = Readonly<Omit<CacheData, "contentHash">>;

/**
 * Carry one geometry-resolved transport kernel in the selected Star logical
 * shape, adapted to scalar CacheData textures.
 */
type CacheTransportData = Readonly<{
	/** Store the number of position-major output queries. */
	queryCount: number;
	/** Store the fixed packed-tap capacity of every query. */
	tapCount: number;
	/** Store direction index, position index, and active flag for every tap. */
	sources: CacheData;
	/** Store spectral T * ds * interpolation coefficients for every tap. */
	coefficients: CacheData;
}>;

/**
 * Expose one coherent executable construction lattice independently of
 * descriptor-only metadata.
 */
interface CacheConstructionDomains {
	/** Identify the exact construction-domain selection. */
	readonly id: string;
	/** Store position-domain metadata for field descriptors. */
	readonly positionDomain: PositionDomainDescriptor;
	/** Store executable ordered position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Store the executable position extent. */
	readonly positionCount: number;
	/** Store incoming-direction metadata for radiance fields. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable incoming-radiance directions. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Store one integration weight per incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Store the executable incoming-direction extent. */
	readonly incomingDirectionCount: number;
	/** Store outgoing-direction metadata for scattering fields. */
	readonly outgoingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable outgoing-scattering directions. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Store the executable outgoing-direction extent. */
	readonly outgoingDirectionCount: number;
	/** Resolve one source-local direction through the selected outgoing domain. */
	resolveOutgoingDirectionStencil(
		direction: UnitVector3,
	): ScatteringCacheDirectionStencil;
}

/** Supply physical collaborators for geometry-owned transport packing. */
type CacheTransportDataRequest = Readonly<{
	/** Supply atmosphere-owned extinction sampling. */
	atmosphere: Pick<AtmosphereModel, "sampleMedium">;
	/** Supply the source-selected executable construction lattice. */
	domains: CacheConstructionDomains;
	/** Supply the source-owned physical direction toward the source. */
	directionToSource: UnitVector3;
	/** Supply the accepted construction path interval count. */
	intervalCount: number;
}>;

/** Supply geometry-resolved packed transport data to a source-owned plan. */
interface CacheTransportDataProvider {
	createTransportData(request: CacheTransportDataRequest): CacheTransportData;
}

/** Carry one supported cache-construction binding value. */
type CacheBindingValue =
	| number
	| boolean
	| UnitValue
	| Position
	| UnitVector3
	| SpectralPacket
	| CacheData;

/** Describe one shader binding independently of its value. */
type CacheBindingSpec = Readonly<{
	id: string;
	name: string;
	kind: CacheBindingKind;
	shaderType: string;
	frequency: CacheBindingFrequency;
}>;

/** Pair one uniform specification with the value its shader type accepts. */
type CacheUniformBinding =
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "uniform";
			shaderType: "float";
		}>;
		value: number | UnitValue;
	}>
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "uniform";
			shaderType: "int";
		}>;
		value: number;
	}>
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "uniform";
			shaderType: "bool";
		}>;
		value: boolean;
	}>
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "uniform";
			shaderType: "vec3";
		}>;
		value: Position | UnitVector3;
	}>
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "uniform";
			shaderType: `float[${number}]`;
		}>;
		value: SpectralPacket;
	}>;

/** Pair one packed-data specification with its normalized values. */
type CacheDataBinding = Readonly<{
	spec: CacheBindingSpec & Readonly<{
		kind: "data";
		shaderType: "sampler2D" | "sampler2DArray";
		frequency: "build" | "pass";
	}>;
	value: CacheData;
}>;

/** Pair one compile-time specification with its scalar literal. */
type CacheDefineBinding =
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "define";
			shaderType: "int" | "float";
			frequency: "build" | "pass";
		}>;
		value: number;
	}>
	| Readonly<{
		spec: CacheBindingSpec & Readonly<{
			kind: "define";
			shaderType: "bool";
			frequency: "build" | "pass";
		}>;
		value: boolean;
	}>;

/** Pair one construction binding specification with its typed value. */
type CacheBinding = CacheUniformBinding | CacheDataBinding | CacheDefineBinding;

/** Supply one owner module before its stable identity is derived. */
type CacheBuildModuleDefinition = Readonly<{
	id: string;
	owner: CacheBuildOwner;
	provides: readonly string[];
	requires: readonly string[];
	blocks: readonly CacheShaderBlock[];
	bindings: readonly CacheBinding[];
}>;

/** Describe one identified owner-supplied construction module. */
type CacheBuildModule = CacheBuildModuleDefinition & Readonly<{
	contentHash: string;
}>;

/** Supply the structural GPU-construction capability owned by a model. */
interface CacheBuildContributor {
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}

/** Identify one source-owned logical field. */
type CacheFieldId = string;

/** Describe a binary32 scalar array-texture field. */
type GpuCacheFieldDescriptor = DirectionalSpectralFieldDescriptor & Readonly<{
	precision: "binary32";
	layout: ScalarArrayTextureLayoutDescriptor;
}>;

/** Supply executable R32F allocation facts independently of metadata. */
type CacheFieldStorage = Readonly<{
	format: "R32F";
	width: number;
	height: number;
	layers: number;
}>;

/** Pair one logical field id and allocation with descriptive metadata. */
type CacheFieldSpec = Readonly<{
	id: CacheFieldId;
	storage: CacheFieldStorage;
	descriptor: GpuCacheFieldDescriptor;
}>;

/** Describe the reflective illumination source owned by one scatter pass. */
type CacheGroundReflection =
	| Readonly<{
		/** Select direct source illumination for J2. */
		kind: "direct-source";
	}>
	| Readonly<{
		/** Select pure L(k - 2) illumination for Jk, k >= 3. */
		kind: "pure-radiance";
		/** Identify the pure radiance field that illuminates the ground. */
		illumination: CacheFieldSpec;
	}>;

/** Supply one typed pass view to an owner contributor. */
type CacheBuildContext = Readonly<{
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldSpec[];
	output: CacheFieldSpec;
	controls: CacheConstructionControlsDescriptor;
	/** Supply the source-selected executable construction lattice. */
	domains: CacheConstructionDomains;
	/** Supply an executable path interval count to a direct-radiance pass. */
	pathIntervalCount?: number;
	/** Supply one precomputed kernel only to a transport pass. */
	transportData?: CacheTransportData;
	/** Supply reflective-ground work only to a reflective scatter pass. */
	groundReflection?: CacheGroundReflection;
}>;

/** Describe one logical GPU cache-construction pass. */
type CachePass = Readonly<{
	id: string;
	kind: CachePassKind;
	order: CacheOrder;
	inputs: readonly CacheFieldId[];
	output: CacheFieldId;
	modules: readonly CacheBuildModule[];
}>;

/** Describe a complete source-owned construction graph. */
type CacheBuildPlan = Readonly<{
	/** Identify the complete executable logical graph. */
	identity: CacheDescriptorIdentity;
	descriptorDefinition: ScatteringCacheDescriptorDefinition;
	fields: readonly CacheFieldSpec[];
	passes: readonly CachePass[];
	result: CacheFieldId;
	/** Identify the renderer uniform value populated for the completed field. */
	runtimeValueKey?: string;
}>;

/** Describe one complete construction fragment shader. */
type CacheShader = Readonly<{
	id: string;
	source: string;
	sourceHash: string;
	bindings: readonly CacheBinding[];
	output: CacheFieldSpec;
}>;

/** Assemble one logical pass and its executor-resolved output field. */
interface CacheAssembler {
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}

/** Expose one opaque resident GPU field. */
interface GpuCacheField {
	readonly descriptor: GpuCacheFieldDescriptor;
	readonly storage: CacheFieldStorage;
	readonly backendId: string;
	dispose(): void;
}

/** Expose one opaque compiled cache-construction program. */
interface CacheGpuProgram {
	readonly id: string;
	readonly sourceHash: string;
	dispose(): void;
}

/** Submit one wavelength layer of one construction pass. */
type CacheLayerSubmission = Readonly<{
	program: CacheGpuProgram;
	inputs: readonly Readonly<{
		id: CacheFieldId;
		field: GpuCacheField;
	}>[];
	output: GpuCacheField;
	layer: number;
	bindings: readonly CacheBinding[];
}>;

/** Expose one opaque runtime binding for a completed field. */
interface CacheRuntimeBinding {
	readonly id: string;
	/** Identify the shader value populated by the owning renderer backend. */
	readonly valueKey: string;
	readonly descriptor: GpuCacheFieldDescriptor;
	readonly backendId: string;
}

/** Group completed cache bindings owned by one backend. */
type CacheRuntimeBindings = Readonly<{
	backendId: string;
	bindings: readonly CacheRuntimeBinding[];
}>;

/** Supply renderer-owned uniforms that receive opaque completed-cache bindings. */
type CacheRuntimeBindingInstallRequest = Readonly<{
	bindings: CacheRuntimeBindings;
	uniforms: Record<string, { value: unknown }>;
}>;

/** Describe renderer capabilities that affect construction identity. */
type CacheGpuCapabilities = Readonly<{
	id: string;
	api: string;
	scalarFormat: "R32F";
	supportsArrayRenderTargets: boolean;
	supportsFloatSampling: boolean;
	maximumTextureSize: number;
	maximumArrayLayers: number;
}>;

/** Request bounded selected-scalar readback from one live field. */
type CacheProbeRequest = Readonly<{
	field: GpuCacheField;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Declare selected scalar coordinates for one logical field. */
type CacheProbe = Readonly<{
	field: CacheFieldId;
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Return selected scalar values without exposing full-field readback. */
type CacheProbeResult = Readonly<{
	descriptor: GpuCacheFieldDescriptor;
	samples: readonly Readonly<{
		coordinates: DirectionalSpectralFieldCoordinates;
		value: number;
	}>[];
}>;

/** Supply the optional selected-scalar diagnostic capability. */
interface CacheProbeReader {
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
}

/** Isolate renderer-specific GPU construction behind opaque handles. */
interface CacheGpuBackend {
	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;
	allocateField(field: CacheFieldSpec): GpuCacheField;
	compile(
		shader: CacheShader
	): CacheGpuProgram | Promise<CacheGpuProgram>;
	/** Submit one layer and restore every renderer state value before returning. */
	submitLayer(request: CacheLayerSubmission): void;
	createRuntimeBinding(field: GpuCacheField, valueKey?: string): CacheRuntimeBinding;
	/** Resolve opaque bindings privately and install their renderer resources. */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	dispose(): void;
}

/** Yield construction only at executor-declared safe boundaries. */
interface CacheBuildScheduler {
	yieldControl(): Promise<void>;
}

/** Configure one staging-plan execution. */
type CacheExecutionOptions = Readonly<{
	scheduler?: CacheBuildScheduler;
	signal?: AbortSignal;
	probeReader?: CacheProbeReader;
	probes?: readonly CacheProbe[];
}>;

/** Describe diagnostics captured for one completed pass. */
type CachePassDiagnostic = Readonly<{
	id: string;
	submissionDuration?: Duration;
	probe?: CacheProbeResult;
}>;

/** Record exact logical GPU payload requested during one completed build. */
type CacheBuildMemoryDiagnostics = Readonly<{
	peakFieldStorage: UnitValue<"bytes">;
	peakPackedDataStorage: UnitValue<"bytes">;
	peakTrackedStorage: UnitValue<"bytes">;
	residentFieldStorage: UnitValue<"bytes">;
}>;

/** Describe diagnostics captured for one completed build. */
type CacheBuildDiagnostics = Readonly<{
	passes: readonly CachePassDiagnostic[];
	memory: CacheBuildMemoryDiagnostics;
}>;

/** Own the completed staging result and its runtime binding. */
type CacheBuildArtifact = Readonly<{
	descriptor: ScatteringCacheDescriptor;
	result: GpuCacheField;
	runtimeBindings: CacheRuntimeBindings;
	diagnostics: CacheBuildDiagnostics;
	dispose(): void;
}>;
