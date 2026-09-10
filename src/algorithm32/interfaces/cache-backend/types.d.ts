/** Contract that exposes one opaque resident GPU field. */
interface GpuCacheField {
	/** Id value. */ readonly id: CacheFieldId;
	/** Storage value. */ readonly storage: CacheFieldStorage;
	/** Backend id value. */ readonly backendId: string;
	/** Call this method to dispose. */ dispose(): void;
}

/** Contract that exposes one opaque compiled cache-construction program. */
interface CacheGpuProgram {
	/** Id value. */ readonly id: string;
	/** Source hash value. */ readonly sourceHash: string;
	/** Call this method to dispose. */ dispose(): void;
}

/** Submit one wavelength layer of one construction pass. */
type CacheLayerSubmission = Readonly<{
	/** Program value. */ program: CacheGpuProgram;
	/** Inputs value. */ inputs: readonly Readonly<{
		/** Id value. */ id: CacheFieldId;
		/** Field value. */ field: GpuCacheField;
	}>[];
	/** Output value. */ output: GpuCacheField;
	/** Layer value. */ layer: number;
	/** Bindings value. */ bindings: readonly CacheBinding[];
}>;

/** Contract that exposes one opaque runtime binding for a completed field. */
interface CacheRuntimeBinding {
	/** Id value. */ readonly id: string;
	/** Value that identifies the shader value populated by the owning renderer backend. */
	readonly valueKey: CacheRuntimeValueKey;
	/** Field id value. */ readonly fieldId: CacheFieldId;
	/** Backend id value. */ readonly backendId: string;
}

/** Immutable texture formats accepted by the resident-asset upload boundary.
 * - **"R32F"** - One Float32 scalar per texel.
 * - **"RGBA32F"** - Four Float32 packet components per texel.
 * - **"R16UI"** - One unsigned 16-bit direction index per texel.
 * - **"RG16UI"** - Unsigned 16-bit resident slot and block-row addresses.
 * - **"RGBA32I"** - Four signed 32-bit altitude-ledger components.
 */
type CacheImmutableTextureFormat = 'R32F' | 'RGBA32F' | 'R16UI' | 'RG16UI' | 'RGBA32I';

/** Executable shape of one immutable resident texture. */
type CacheImmutableTextureStorage = Readonly<{
	/** GPU texel format. */ readonly format: CacheImmutableTextureFormat;
	/** Texture width. */ readonly width: number;
	/** Texture height. */ readonly height: number;
	/** Array-layer count; R16UI assets use one layer. */ readonly layers: number;
}>;

/** Request to validate, upload, and bind one immutable resident texture. */
type CacheImmutableTextureUploadRequest = Readonly<{
	/** Stable texture identity. */ readonly id: string;
	/** Exact executable texture storage. */ readonly storage: CacheImmutableTextureStorage;
	/** Typed immutable source values. */ readonly values: Float32Array | Uint16Array | Int32Array;
	/** Shader value populated by the resulting binding. */ readonly valueKey: CacheRuntimeValueKey;
}>;

/** Opaque owner of one completely uploaded immutable texture and binding. */
interface CacheImmutableTexture {
	/** Stable texture identity. */ readonly id: string;
	/** Exact executable texture storage. */ readonly storage: CacheImmutableTextureStorage;
	/** Backend ownership identity. */ readonly backendId: string;
	/** Opaque runtime binding for this texture. */ readonly runtimeBinding: CacheRuntimeBinding;
	/** Call this method to dispose the texture exactly once. */ dispose(): void;
}

/**
 * Shader value populated by one completed GPU field.
 *
 * - **"cache.cumulativeScatteringDensity"** - The retained cumulative atmospheric scattering field.
 * - **"cache.sceneCumulativeScatteringDensity"** - The dense scene packet field during rollout.
 * - **"cache.sceneLogicalToUniqueDirection"** - The dense scene direction-index map during rollout.
 * - **"cache.sharedPacketAtlas"** - The persistent shared RGBA packet array.
 * - **"cache.sharedRowAddress"** - The scene-row to resident-slot address table.
 * - **"cache.sharedAltitudeLedger"** - The signed scene/altitude interpolation ledger.
 * - **"cache.celestial.sunTransport"** - The distant-Sun direct-transport field.
 * - **"cache.celestial.starTransport"** - The stellar point-set direct-transport field.
 * - **"cache.celestial.localSunRadiance"** - The Flat finite-Sun radiance field.
 * - **"lighting.receiverEnvironmentIrradiance"** - One receiver-local native-basis irradiance packet.
 */
type CacheRuntimeValueKey =
	| 'cache.cumulativeScatteringDensity'
	| 'cache.sceneCumulativeScatteringDensity'
	| 'cache.sceneLogicalToUniqueDirection'
	| 'cache.sharedPacketAtlas'
	| 'cache.sharedRowAddress'
	| 'cache.sharedAltitudeLedger'
	| 'cache.celestial.sunTransport'
	| 'cache.celestial.starTransport'
	| 'cache.celestial.localSunRadiance'
	| 'lighting.receiverEnvironmentIrradiance';

/** Request for one typed runtime binding over a resident field. */
type CacheRuntimeBindingRequest = Readonly<{
	/** Resident field represented by the binding. */
	readonly field: GpuCacheField;
	/** Shader value populated by the binding. */
	readonly valueKey: CacheRuntimeValueKey;
}>;

/** Group completed cache bindings owned by one backend. */
type CacheRuntimeBindings = Readonly<{
	/** Backend id value. */ backendId: string;
	/** Bindings value. */ bindings: readonly CacheRuntimeBinding[];
}>;

/** Type that supplies renderer-owned uniforms that receive opaque completed-cache bindings. */
type CacheRuntimeBindingInstallRequest = Readonly<{
	/** Bindings value. */ bindings: CacheRuntimeBindings;
	/** Uniforms value. */ uniforms: Record<string, {/** Value value. */ value: unknown}>;
}>;

/** Type that describes renderer capabilities that affect construction identity. */
type CacheGpuCapabilities = Readonly<{
	/** Id value. */ id: string;
	/** Api value. */ api: string;
	/** Scalar format value. */ scalarFormat: 'R32F';
	/** Supports array render targets value. */ supportsArrayRenderTargets: boolean;
	/** Supports float sampling value. */ supportsFloatSampling: boolean;
	/** Maximum texture size value. */ maximumTextureSize: number;
	/** Maximum array layers value. */ maximumArrayLayers: number;
}>;

/** Isolate renderer-specific GPU construction behind opaque handles. */
interface CacheGpuBackend {
	/** Id value. */ readonly id: string;
	/** Capabilities value. */ readonly capabilities: CacheGpuCapabilities;
	/**
	 * Call this method to allocate field.
	 * @param field - The field value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ allocateField(field: CacheFieldSpec): GpuCacheField;
	/**
	 * Call this method to compile.
	 * @param shader - The shader value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ compile(shader: CacheShader): CacheGpuProgram | Promise<CacheGpuProgram>;
	/**
	 * Call this method to submit one layer and restore every renderer state value before returning.
	 * @param request - The request accepted by the operation.
	 */
	submitLayer(request: CacheLayerSubmission): void;
	/**
	 * Call this method to create runtime binding.
	 * @param request - The resident field and its caller-selected shader value.
	 * @returns - The result produced by the operation.
	 */ createRuntimeBinding(request: CacheRuntimeBindingRequest): CacheRuntimeBinding;
	/**
	 * Call this method to validate and upload one immutable resident texture.
	 * @param request - Exact typed payload, storage, identity, and shader value.
	 * @returns - Opaque uploaded texture owner and runtime binding.
	 */
	uploadImmutableTexture(request: CacheImmutableTextureUploadRequest): CacheImmutableTexture;
	/**
	 * Call this method to resolve opaque bindings privately and install their renderer resources.
	 * @param request - The request accepted by the operation.
	 */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	/** Call this method to dispose. */ dispose(): void;
}

/** Persistent RGBA32F array allocation with an explicit payload budget. */
type CachePersistentArrayRequest = Readonly<{
	/** Stable array identity. */
	id: string;
	/** Exact RGBA32F storage shape. */
	storage: CacheImmutableTextureStorage;
	/** Shader value supplied by the stable binding. */
	valueKey: CacheRuntimeValueKey;
	/** Caller-declared maximum allocation in bytes, excluding driver overhead. */
	maximumBytes: number;
}>;

/** Opaque persistent array with stable shader binding across layer replacements. */
interface CachePersistentArray {
	/** Stable array identity. */
	readonly id: string;
	/** Immutable storage dimensions and format. */
	readonly storage: CacheImmutableTextureStorage;
	/** Backend ownership identity. */
	readonly backendId: string;
	/** Stable opaque runtime binding. */
	readonly runtimeBinding: CacheRuntimeBinding;
	/** Exact allocated GPU payload size. */
	readonly byteLength: number;
	/** Call this method to dispose the array exactly once. */
	dispose(): void;
}

/** Complete authenticated layer replacement request. */
type CachePersistentArrayUpload = Readonly<{
	/** Backend-owned array handle. */
	array: CachePersistentArray;
	/** Unprotected destination layer. */
	layer: number;
	/** Authenticated logical block and decoded/layout identity. */
	identity: string;
	/** Complete layer of RGBA32F values, copied synchronously without retaining host bytes. */
	values: Float32Array;
}>;

/** Persistent array state after upload, context loss, or restoration. */
type CachePersistentArrayState = Readonly<{
	/** Context generation, advanced on each loss. */
	generation: number;
	/** Whether GPU storage is unavailable. */
	unavailable: boolean;
	/** Authenticated identity of each successfully uploaded layer. */
	layerIdentities: readonly (string | undefined)[];
	/** Currently protected published layers. */
	protectedLayers: readonly number[];
}>;

/** Selected exact texel address for bounded backend diagnostics. */
type CacheTextureTexel = Readonly<{
	/** Column within one layer. */
	x: number;
	/** Row within one layer. */
	y: number;
	/** Array layer, zero for 2D metadata. */
	layer: number;
}>;

/** Narrow persistent-array extension to the ordinary cache backend. */
interface CachePacketAtlasBackend extends CacheGpuBackend {
	/** Call this method to allocate a bounded array; unsupported capability or allocation failure throws. */
	allocatePersistentArray(request: CachePersistentArrayRequest): CachePersistentArray;
	/** Call this method to replace an unprotected layer; failed uploads never establish an identity. */
	uploadPersistentArrayLayer(request: CachePersistentArrayUpload): void;
	/** Call this method to protect the complete set of published layers; missing or invalid layers throw. */
	protectPersistentArrayLayers(array: CachePersistentArray, layers: readonly number[]): void;
	/** Call this method to inspect uploaded identities and context readiness through an opaque handle. */
	getPersistentArrayState(array: CachePersistentArray): CachePersistentArrayState;
	/** Call this method to read at most 256 selected RGBA texels for exact diagnostics. */
	readTextureTexels(
		texture: CacheImmutableTexture | CachePersistentArray,
		coordinates: readonly CacheTextureTexel[],
	): Float32Array | Int32Array | Uint32Array;
}

/** Yield construction only at executor-declared safe boundaries. */
interface CacheBuildScheduler {
	/**
	 * Call this method to yield control.
	 * @returns - The result produced by the operation.
	 */ yieldControl(): Promise<void>;
}
