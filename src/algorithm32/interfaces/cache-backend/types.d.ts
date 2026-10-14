/** Contract that exposes one opaque resident GPU field. */
interface GpuCacheField {
	/** Stable logical field identity assigned by the construction plan. */ readonly id: CacheFieldId;
	/** Executable dimensions and scalar format retained by the field owner. */ readonly storage: CacheFieldStorage;
	/** Identity of the only backend allowed to resolve this opaque handle. */ readonly backendId: string;
	/** Call this method to retire this field and release its renderer storage once. */ dispose(): void;
}
/** Complete layer-major physical R32F diagnostic readback through an opaque binding. */
type CacheScalarFieldReadback = Readonly<{
	/** Executed field packing. */ storage: CacheFieldStorage;
	/** Owned complete readback buffer; it never aliases the resident field. */ values: Float32Array;
}>;

/** Contract that exposes one opaque compiled cache-construction program. */
interface CacheGpuProgram {
	/** Stable construction-pass identity supplied by its shader owner. */ readonly id: string;
	/** Identity of the exact assembled shader source used for compilation. */ readonly sourceHash: string;
	/** Call this method to release all renderer resources owned by this program once. */ dispose(): void;
}

/** Borrowed input field paired with its construction-plan binding identity. */
type CacheLayerInput = Readonly<{
	/** Logical input identity resolved by the submitted shader. */ id: CacheFieldId;
	/** Live backend-owned input field; submission does not transfer ownership. */ field: GpuCacheField;
}>;

/** Submit one wavelength layer of one construction pass. */
type CacheLayerSubmission = Readonly<{
	/** Live compiled program borrowed for this synchronous submission. */ program: CacheGpuProgram;
	/** Complete borrowed inputs matched to the program's logical field identities. */ inputs: readonly CacheLayerInput[];
	/** Backend-owned field receiving this layer's physical scalar values. */ output: GpuCacheField;
	/** Zero-based wavelength layer within the output field. */ layer: number;
	/** Complete typed uniforms and data bindings required by the program. */ bindings: readonly CacheBinding[];
}>;

/** Contract that exposes one opaque runtime binding for a completed field. */
interface CacheRuntimeBinding {
	/** Stable renderer-issued identity of this opaque binding. */ readonly id: string;
	/** Value that identifies the shader value populated by the owning renderer backend. */
	readonly valueKey: CacheRuntimeValueKey;
	/** Logical field or immutable representation identity referenced by this binding. */ readonly fieldId: CacheFieldId;
	/** Identity of the backend that privately resolves the bound texture. */ readonly backendId: string;
}

/** Complete cache-owned live publication consumed without shader recompilation. */
type CacheRuntimePublication = Readonly<{
	/** Identity that changes whenever bindings or cache-owned scalar values change. */
	identity: string;
	/** Complete current opaque cache bindings; an empty collection denotes a procedural state. */
	bindings: CacheRuntimeBindings;
	/** Current cache-owned uniform values, keyed by shader declaration value keys. */
	values: Readonly<Record<string, unknown>>;
}>;

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
	/** Request exact texel sampling; omission preserves linear RGBA32F asset filtering. */ readonly filtering?: 'nearest';
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
 * - **"cache.compactPositions"** - Canonical ragged-node physical positions.
 * - **"cache.compactExcesses"** - Ragged-node stable Euclidean radius excesses.
 * - **"cache.compactIncomingDirections"** - Local horizon-partitioned incoming vectors.
 * - **"cache.compactOutgoingDirections"** - Local W27 outgoing vectors.
 * - **"cache.compactIncomingWeights"** - Positive incoming solid-angle weights.
 * - **"cache.compactNodeFactors"** - Per-node Native15 normalization logarithms.
 * - **"cache.sceneCumulativeScatteringDensity"** - The dense scene packet field during rollout.
 * - **"cache.sceneLogicalToUniqueDirection"** - The dense scene direction-index map during rollout.
 * - **"cache.sharedPacketAtlas"** - The persistent shared RGBA packet array.
 * - **"cache.sharedRowAddress"** - The scene-row to resident-slot address table.
 * - **"cache.sharedCoordinateAddress"** - Complete cubic solar/altitude coordinate addresses.
 * - **"cache.sharedAltitudeLedger"** - The signed scene/altitude interpolation ledger.
 * - **"cache.celestial.sunTransport"** - The distant-Sun direct-transport field.
 * - **"cache.celestial.starTransport"** - The stellar point-set direct-transport field.
 * - **"cache.celestial.localSunRadiance"** - The Flat finite-Sun radiance field.
 * - **"lighting.receiverEnvironmentIrradiance"** - One receiver-local native-basis irradiance packet.
 */
type CacheRuntimeValueKey =
	| 'cache.compactPositions'
	| 'cache.compactExcesses'
	| 'cache.compactIncomingDirections'
	| 'cache.compactOutgoingDirections'
	| 'cache.compactIncomingWeights'
	| 'cache.compactNodeFactors'
	| 'cache.cumulativeScatteringDensity'
	| 'cache.sceneCumulativeScatteringDensity'
	| 'cache.sceneLogicalToUniqueDirection'
	| 'cache.sharedPacketAtlas'
	| 'cache.sharedRowAddress'
	| 'cache.sharedCoordinateAddress'
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
	/** Shared backend ownership identity required for every binding in this collection. */ backendId: string;
	/** Complete borrowed bindings whose resource owners outlive runtime installation. */ bindings: readonly CacheRuntimeBinding[];
}>;

/** Mutable renderer uniform slot populated by opaque cache-binding installation. */
type CacheRuntimeUniform = {
	/** Current renderer-private texture or scalar value; installation replaces it without transferring ownership. */ value: unknown;
};

/** Type that supplies renderer-owned uniforms that receive opaque completed-cache bindings. */
type CacheRuntimeBindingInstallRequest = Readonly<{
	/** Complete borrowed bindings owned by the installing backend. */ bindings: CacheRuntimeBindings;
	/** Caller-owned mutable shader uniform slots indexed by declared runtime value key. */ uniforms: Record<
		string,
		CacheRuntimeUniform
	>;
}>;

/** Type that describes renderer capabilities that affect construction identity. */
type CacheGpuCapabilities = Readonly<{
	/** Stable identity of the inspected renderer capabilities, included in construction reuse keys. */ id: string;
	/** Diagnostic renderer/API revision label. */ api: string;
	/** Physical scalar construction format; each texel stores one Float32 value. */ scalarFormat: 'R32F';
	/** Whether the device can render into scalar texture-array layers. */ supportsArrayRenderTargets: boolean;
	/** Whether shader sampling supports floating-point textures. */ supportsFloatSampling: boolean;
	/** Device maximum width or height in texels for one texture layer. */ maximumTextureSize: number;
	/** Device maximum number of layers in a texture array. */ maximumArrayLayers: number;
}>;

/** Isolate renderer-specific GPU construction behind opaque handles. */
interface CacheGpuBackend {
	/** Call this method to pack a completed scalar field into immutable four-float spectral groups on the GPU.
	 * Optional for scalar-only backends; compact runtime construction requires it.
	 * Source ownership stays with the caller. Allocation/compile/copy failures throw
	 * without publishing a texture; the caller retains its prior complete cache.
	 *
	 * @param request - Owned source field and destination identity/binding key.
	 * @returns - Completed immutable packed runtime texture.
	 */
	packRuntimeField?(request: CacheRuntimeFieldPackingRequest): CacheImmutableTexture;
	/** Stable identity of this renderer backend and all handles it issues. */ readonly id: string;
	/** Inspected immutable device facts used by construction and reuse compatibility. */ readonly capabilities: CacheGpuCapabilities;
	/**
	 * Call this method to allocate field.
	 *
	 * @param field - The field value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ allocateField(field: CacheFieldSpec): GpuCacheField;
	/**
	 * Call this method to compile.
	 *
	 * @param shader - The shader value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ compile(shader: CacheShader): CacheGpuProgram | Promise<CacheGpuProgram>;
	/**
	 * Call this method to submit one layer and restore every renderer state value before returning.
	 *
	 * @param request - The request accepted by the operation.
	 */
	submitLayer(request: CacheLayerSubmission): void;
	/**
	 * Call this method to create runtime binding.
	 *
	 * @param request - The resident field and its caller-selected shader value.
	 * @returns - The result produced by the operation.
	 */ createRuntimeBinding(request: CacheRuntimeBindingRequest): CacheRuntimeBinding;
	/**
	 * Call this method to validate and upload one immutable resident texture.
	 *
	 * @param request - Exact typed payload, storage, identity, and shader value.
	 * @returns - Opaque uploaded texture owner and runtime binding.
	 */
	uploadImmutableTexture(request: CacheImmutableTextureUploadRequest): CacheImmutableTexture;
	/**
	 * Call this method to resolve opaque bindings privately and install their renderer resources.
	 *
	 * @param request - The request accepted by the operation.
	 */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	/** Call this method to dispose. */ dispose(): void;
}

/** GPU-only spectral packing with unchanged direction/position coordinates. */
type CacheRuntimeFieldPackingRequest = Readonly<{
	/** Completed scalar source borrowed only during conversion. */ source: GpuCacheField;
	/** Versioned representation identity supplied by its cache owner. */ id: string;
	/** Runtime shader binding supplied by the packed texture. */ valueKey: CacheRuntimeValueKey;
}>;

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
	 *
	 * @returns - The result produced by the operation.
	 */ yieldControl(): Promise<void>;
}
