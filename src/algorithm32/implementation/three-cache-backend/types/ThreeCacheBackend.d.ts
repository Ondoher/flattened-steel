/** Three-dimensional vector used for one cache shader uniform. */
type ThreeCacheBackendVector3 = {
	/** First vector component. */
	x: number;
	/** Second vector component. */
	y: number;
	/** Third vector component. */
	z: number;
};

/** Four-dimensional vector used to capture one renderer rectangle. */
type ThreeCacheBackendVector4 = {
	/** First vector component. */
	x: number;
	/** Second vector component. */
	y: number;
	/** Third vector component. */
	z: number;
	/** Fourth vector component. */
	w: number;
};

/** Three-dimensional vector constructor used by cache uniforms. */
type ThreeCacheBackendVector3Constructor = new (x: number, y: number, z: number) => ThreeCacheBackendVector3;

/** Four-dimensional vector constructor used by renderer-state capture. */
type ThreeCacheBackendVector4Constructor = new () => ThreeCacheBackendVector4;

/** Mutable Three uniform value installed for a cache shader binding. */
type ThreeCacheBackendUniform = {
	/** Current value supplied to the shader uniform. */
	value: unknown;
};

/** Mutable Three texture state required by scalar cache resources. */
type ThreeCacheBackendTexture = {
	/** Source upload readiness, allowing allocation without a host-sized data array. */
	source: {dataReady: boolean};
	/** Pixel format of the texture. */
	format: number;
	/** Scalar data type of the texture. */
	type: number;
	/** GPU internal format of the texture. */
	internalFormat: string | null;
	/** Minification filter of the texture. */
	minFilter: number;
	/** Magnification filter of the texture. */
	magFilter: number;
	/** Horizontal wrap mode of the texture. */
	wrapS: number;
	/** Vertical wrap mode of the texture. */
	wrapT: number;
	/** Mipmap-generation state of the texture. */
	generateMipmaps: boolean;
	/** Scalar unpack alignment of the texture. */
	unpackAlignment: number;
	/** Pending GPU upload state of the texture. */
	needsUpdate: boolean;
	/** Call this method to release the texture's renderer resource. */
	dispose(): void;
};

/** Exact constructor options for one scalar R32F array render target. */
type ThreeCacheBackendScalarArrayTargetOptions = Readonly<{
	/** Red pixel format required by the scalar target. */
	format: 1028;
	/** Float scalar type required by the scalar target. */
	type: 1015;
	/** R32F GPU internal format required by the scalar target. */
	internalFormat: 'R32F';
	/** Nearest-neighbor minification filter required by the scalar target. */
	minFilter: 1003;
	/** Nearest-neighbor magnification filter required by the scalar target. */
	magFilter: 1003;
	/** Edge-clamping horizontal wrap mode required by the scalar target. */
	wrapS: 1001;
	/** Edge-clamping vertical wrap mode required by the scalar target. */
	wrapT: 1001;
	/** Disabled mipmap generation for the scalar target. */
	generateMipmaps: false;
	/** Disabled depth buffer for the scalar target. */
	depthBuffer: false;
	/** Disabled stencil buffer for the scalar target. */
	stencilBuffer: false;
}>;

/** Scalar array render target owned by one cache field. */
type ThreeCacheBackendScalarArrayTarget = {
	/** Scalar array texture attached to the render target. */
	texture: ThreeCacheBackendTexture;
	/** Call this method to release the render target and its texture. */
	dispose(): void;
};

/** Scalar array render-target constructor used by cache fields. */
type ThreeCacheBackendScalarArrayTargetConstructor = new (
	width: number,
	height: number,
	layers: number,
	options: ThreeCacheBackendScalarArrayTargetOptions,
) => ThreeCacheBackendScalarArrayTarget;

/** Data texture owned by one compiled cache program. */
type ThreeCacheBackendDataTexture = ThreeCacheBackendTexture;

/** Two-dimensional scalar data-texture constructor used by packed bindings. */
type ThreeCacheBackendDataTextureConstructor = new (
	data: Float32Array | Uint16Array | Int32Array,
	width: number,
	height: number,
) => ThreeCacheBackendDataTexture;

/** Array scalar data-texture constructor used by packed bindings. */
type ThreeCacheBackendDataArrayTextureConstructor = new (
	data: Float32Array | Uint16Array | Int32Array | null,
	width: number,
	height: number,
	depth: number,
) => ThreeCacheBackendDataTexture;

/** Buffer attribute installed on the fullscreen cache geometry. */
type ThreeCacheBackendBufferAttribute = object;

/** Buffer-attribute constructor used for fullscreen triangle positions. */
type ThreeCacheBackendBufferAttributeConstructor = new (
	array: Float32Array,
	itemSize: number,
) => ThreeCacheBackendBufferAttribute;

/** Buffer geometry owned by one compiled cache program. */
type ThreeCacheBackendBufferGeometry = {
	/**
	 * Call this method to install a named vertex attribute.
	 * @param name - The name value accepted by the operation.
	 * @param attribute - The attribute value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	setAttribute(name: string, attribute: ThreeCacheBackendBufferAttribute): ThreeCacheBackendBufferGeometry;
	/** Call this method to release the geometry's renderer resource. */
	dispose(): void;
};

/** Buffer-geometry constructor used for the fullscreen cache pass. */
type ThreeCacheBackendBufferGeometryConstructor = new () => ThreeCacheBackendBufferGeometry;

/** Exact constructor options for one raw cache shader material. */
type ThreeCacheBackendRawShaderMaterialOptions = Readonly<{
	/** GLSL 3 version required by the cache shader. */
	glslVersion: '300 es';
	/** Fullscreen vertex shader source of the cache program. */
	vertexShader: string;
	/** Assembled fragment shader source of the cache program. */
	fragmentShader: string;
	/** Mutable uniform values installed for the cache program. */
	uniforms: Record<string, ThreeCacheBackendUniform>;
	/** Disabled blending mode for scalar cache writes. */
	blending: 0;
	/** Disabled depth test for the fullscreen cache pass. */
	depthTest: false;
	/** Disabled depth writes for the fullscreen cache pass. */
	depthWrite: false;
	/** Disabled tone mapping for physical scalar cache values. */
	toneMapped: false;
	/** Opaque material state for scalar cache writes. */
	transparent: false;
}>;

/** Raw shader material owned by one compiled cache program. */
type ThreeCacheBackendRawShaderMaterial = {
	/** Mutable uniform values installed for the cache program. */
	uniforms: Record<string, ThreeCacheBackendUniform>;
	/** Call this method to release the material's renderer resource. */
	dispose(): void;
};

/** Raw-shader-material constructor used for cache programs. */
type ThreeCacheBackendRawShaderMaterialConstructor = new (
	options: ThreeCacheBackendRawShaderMaterialOptions,
) => ThreeCacheBackendRawShaderMaterial;

/** Fullscreen mesh owned by one compiled cache program. */
type ThreeCacheBackendMesh = {
	/** Frustum-culling state of the fullscreen mesh. */
	frustumCulled: boolean;
};

/** Fullscreen-mesh constructor used for cache programs. */
type ThreeCacheBackendMeshConstructor = new (
	geometry: ThreeCacheBackendBufferGeometry,
	material: object,
) => ThreeCacheBackendMesh;

/** Private scene containing one fullscreen cache mesh. */
type ThreeCacheBackendScene = {
	/**
	 * Call this method to attach the fullscreen mesh to the scene.
	 * @param mesh - The mesh value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	add(mesh: ThreeCacheBackendMesh): ThreeCacheBackendScene;
};

/** Scene constructor used for the fullscreen cache pass. */
type ThreeCacheBackendSceneConstructor = new () => ThreeCacheBackendScene;

/** Camera used to submit one fullscreen cache pass. */
type ThreeCacheBackendCamera = object;

/** Camera constructor used for the fullscreen cache pass. */
type ThreeCacheBackendCameraConstructor = new () => ThreeCacheBackendCamera;

/** Exact Three resource constructors and constants used inside the cache backend. */
type ThreeCacheBackendResourceNamespace = Readonly<{
	/** Three release revision used in the backend capability identity. */
	REVISION: string;
	/** Red texture format constant used by scalar cache resources. */
	RedFormat: 1028;
	/** RGBA texture format constant used by packed cache resources. */
	RGBAFormat: 1023;
	/** Red integer texture format constant used by index resources. */
	RedIntegerFormat: 1029;
	/** Two-component unsigned integer metadata format. */
	RGIntegerFormat: number;
	/** Four-component signed integer metadata format. */
	RGBAIntegerFormat: number;
	/** Signed 32-bit integer texture type. */
	IntType: number;
	/** Float texture data-type constant used by scalar cache resources. */
	FloatType: 1015;
	/** Unsigned-short data-type constant used by index resources. */
	UnsignedShortType: 1012;
	/** Nearest-neighbor filter constant used by scalar cache resources. */
	NearestFilter: 1003;
	/** Linear filter constant used by packed sampling resources. */
	LinearFilter: 1006;
	/** Edge-clamping wrap constant used by scalar cache resources. */
	ClampToEdgeWrapping: 1001;
	/** GLSL 3 version constant used by cache materials. */
	GLSL3: '300 es';
	/** Disabled-blending constant used by cache materials. */
	NoBlending: 0;
	/** Three-dimensional vector constructor used for shader uniforms. */
	Vector3: ThreeCacheBackendVector3Constructor;
	/** Four-dimensional vector constructor used for renderer-state capture. */
	Vector4: ThreeCacheBackendVector4Constructor;
	/** Scalar array render-target constructor used for cache fields. */
	WebGLArrayRenderTarget: ThreeCacheBackendScalarArrayTargetConstructor;
	/** Two-dimensional data-texture constructor used for packed bindings. */
	DataTexture: ThreeCacheBackendDataTextureConstructor;
	/** Array data-texture constructor used for packed bindings. */
	DataArrayTexture: ThreeCacheBackendDataArrayTextureConstructor;
	/** Buffer-geometry constructor used for the fullscreen cache pass. */
	BufferGeometry: ThreeCacheBackendBufferGeometryConstructor;
	/** Buffer-attribute constructor used for fullscreen triangle positions. */
	BufferAttribute: ThreeCacheBackendBufferAttributeConstructor;
	/** Raw-shader-material constructor used for cache programs. */
	RawShaderMaterial: ThreeCacheBackendRawShaderMaterialConstructor;
	/** Mesh constructor used for the fullscreen cache pass. */
	Mesh: ThreeCacheBackendMeshConstructor;
	/** Scene constructor used for the fullscreen cache pass. */
	Scene: ThreeCacheBackendSceneConstructor;
	/** Camera constructor used for the fullscreen cache pass. */
	Camera: ThreeCacheBackendCameraConstructor;
}>;

/** Renderer capability facts consumed inside the cache backend. */
type ThreeCacheBackendRendererCapabilities = Readonly<{
	/** WebGL2 support reported by the renderer. */
	isWebGL2: boolean;
}>;

/** Exact renderer operations used inside the cache backend. */
type ThreeCacheBackendRendererOperations = Readonly<{
	/** Renderer capability facts inspected by the cache boundary. */
	capabilities: ThreeCacheBackendRendererCapabilities;
	/**
	 * Call this method to access the renderer's WebGL context.
	 * @returns - The result produced by the operation.
	 */
	getContext(): WebGLRenderingContext | WebGL2RenderingContext;
	/**
	 * Call this method to access the renderer's active render target.
	 * @returns - The result produced by the operation.
	 */
	getRenderTarget(): object | null;
	/**
	 * Call this method to access the renderer's active cube face.
	 * @returns - The result produced by the operation.
	 */
	getActiveCubeFace(): number;
	/**
	 * Call this method to access the renderer's active mip level.
	 * @returns - The result produced by the operation.
	 */
	getActiveMipmapLevel(): number;
	/**
	 * Call this method to copy the renderer viewport into a vector.
	 * @param target - The target value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	getViewport(target: ThreeCacheBackendVector4): ThreeCacheBackendVector4;
	/**
	 * Call this method to copy the renderer scissor rectangle into a vector.
	 * @param target - The target value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	getScissor(target: ThreeCacheBackendVector4): ThreeCacheBackendVector4;
	/**
	 * Call this method to access the renderer's scissor-test state.
	 * @returns - The result produced by the operation.
	 */
	getScissorTest(): boolean;
	/**
	 * Call this method to select a render target, layer, and mip level.
	 * @param target - The target value accepted by the operation.
	 * @param activeLayer - The active layer value accepted by the operation.
	 * @param activeMipmapLevel - The active mipmap level value accepted by the operation.
	 */
	setRenderTarget(target: object | null, activeLayer?: number, activeMipmapLevel?: number): void;
	/**
	 * Call this method to restore a captured viewport vector. This overload accepts one captured viewport vector.
	 * @param viewport - The viewport value accepted by the operation.
	 */
	setViewport(viewport: ThreeCacheBackendVector4): void;
	/**
	 * Call this method to select a numeric viewport rectangle. This overload accepts explicit x, y, width, and height scalars.
	 * @param x - The x value accepted by the operation.
	 * @param y - The y value accepted by the operation.
	 * @param width - The width value accepted by the operation.
	 * @param height - The height value accepted by the operation.
	 */
	setViewport(x: number, y: number, width: number, height: number): void;
	/**
	 * Call this method to restore a captured scissor vector. This overload accepts one captured scissor vector.
	 * @param scissor - The scissor value accepted by the operation.
	 */
	setScissor(scissor: ThreeCacheBackendVector4): void;
	/**
	 * Call this method to select a numeric scissor rectangle. This overload accepts explicit x, y, width, and height scalars.
	 * @param x - The x value accepted by the operation.
	 * @param y - The y value accepted by the operation.
	 * @param width - The width value accepted by the operation.
	 * @param height - The height value accepted by the operation.
	 */
	setScissor(x: number, y: number, width: number, height: number): void;
	/**
	 * Call this method to select whether scissor testing is enabled.
	 * @param enabled - The enabled value accepted by the operation.
	 */
	setScissorTest(enabled: boolean): void;
	/**
	 * Call this method to optional asynchronous cache-program compilation operation.
	 * @param scene - The scene value accepted by the operation.
	 * @param camera - The camera value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	compileAsync?(scene: ThreeCacheBackendScene, camera: ThreeCacheBackendCamera): Promise<void>;
	/**
	 * Call this method to compile one cache-program scene synchronously.
	 * @param scene - The scene value accepted by the operation.
	 * @param camera - The camera value accepted by the operation.
	 */
	compile(scene: ThreeCacheBackendScene, camera: ThreeCacheBackendCamera): void;
	/**
	 * Call this method to render one cache-program scene.
	 * @param scene - The scene value accepted by the operation.
	 * @param camera - The camera value accepted by the operation.
	 */
	render(scene: ThreeCacheBackendScene, camera: ThreeCacheBackendCamera): void;
	/** Call this method to eagerly initialize one immutable data texture. */
	initTexture(texture: ThreeCacheBackendTexture): void;
	/** Internal renderer texture properties used only by the adapter. */
	properties: {get(texture: ThreeCacheBackendTexture): {__webglTexture?: WebGLTexture}};
	/** Call this method to invalidate cached WebGL state after eager texture initialization. */
	resetState(): void;
}>;

/** Renderer state required by cache operations that temporarily mutate Three. */
type ThreeCacheBackendRendererRecord = Readonly<{
	/** Three namespace used by the renderer. */
	THREE: ThreeCacheBackendResourceNamespace;
	/** Renderer whose state is preserved around cache work. */
	renderer: ThreeCacheBackendRendererOperations;
	/** WebGL2 context underlying the renderer. */
	context: WebGL2RenderingContext;
}>;

/** Accepted capability inspection for one Three cache backend. */
type ThreeCacheBackendCapabilityInspection = Readonly<{
	/** WebGL2 context accepted by the backend. */
	context: WebGL2RenderingContext;
	/** Validated cache capabilities of the renderer. */
	capabilities: CacheGpuCapabilities;
}>;

/** Private mutable lifecycle state owned by one Three cache backend. */
type ThreeCacheBackendRecord = ThreeCacheBackendRendererRecord & {
	/** Active opaque fields owned by the backend. */
	fields: Set<GpuCacheField>;
	/** Active opaque programs owned by the backend. */
	programs: Set<CacheGpuProgram>;
	/** Active immutable resident textures owned by the backend. */
	immutableTextures: Set<CacheImmutableTexture>;
	/** Opaque persistent arrays owned by this backend. */
	persistentArrays: Map<CachePersistentArray, ThreeCachePersistentArrayOwner>;
	/** Sequence used to identify runtime bindings. */
	runtimeBindingSequence: number;
	/** Disposal state of the backend. */
	disposed: boolean;
};

/** Private mutable lifecycle state for one immutable resident texture. */
type ThreeCacheBackendImmutableTextureRecord = {
	/** Backend state that owns the texture. */ backend: ThreeCacheBackendRecord;
	/** Private renderer texture. */ texture: ThreeCacheBackendTexture;
	/** Disposal state. */ disposed: boolean;
};

/** Private mutable lifecycle state for one opaque cache field. */
type ThreeCacheBackendFieldRecord = {
	/** Backend state that owns the field. */
	backend: ThreeCacheBackendRecord;
	/** Field identity retained by the opaque handle. */
	id: CacheFieldId;
	/** Executable storage layout of the field. */
	storage: CacheFieldStorage;
	/** Scalar array render target allocated for the field. */
	target: ThreeCacheBackendScalarArrayTarget;
	/** Disposal state of the field. */
	disposed: boolean;
};

/** Uniform map and disposable data textures prepared for one cache program. */
type ThreeCacheBackendMaterialBindings = Readonly<{
	/** Three uniform values keyed by shader name. */
	uniforms: Record<string, ThreeCacheBackendUniform>;
	/** Disposable textures created from packed data bindings. */
	dataResources: ThreeCacheBackendDataTexture[];
}>;

/** Private Three resources allocated for one compiled cache program. */
type ThreeCacheBackendProgramResources = Readonly<{
	/** Fullscreen triangle geometry used by the cache pass. */
	geometry: ThreeCacheBackendBufferGeometry;
	/** Raw shader material used by the cache pass. */
	material: ThreeCacheBackendRawShaderMaterial;
	/** Private scene containing the fullscreen pass mesh. */
	scene: ThreeCacheBackendScene;
	/** Private camera used to submit the fullscreen pass. */
	camera: ThreeCacheBackendCamera;
	/** Disposable textures created from packed data bindings. */
	dataResources: ThreeCacheBackendDataTexture[];
}>;

/** Private mutable lifecycle state for one opaque cache program. */
type ThreeCacheBackendProgramRecord = ThreeCacheBackendProgramResources & {
	/** Backend state that owns the program. */
	backend: ThreeCacheBackendRecord;
	/** Output field specification retained by the program. */
	output: CacheFieldSpec;
	/** Disposal state of the program. */
	disposed: boolean;
};

/** Private association between one runtime binding and its owned field. */
type ThreeCacheBackendRuntimeBindingRecord = Readonly<{
	/** Backend state that owns the binding. */
	backend: ThreeCacheBackendRecord;
	/** Opaque cache field associated with the binding. */
	field?: GpuCacheField;
	/** Opaque immutable texture associated with the binding. */
	immutableTexture?: CacheImmutableTexture;
	/** Opaque persistent texture array associated with the binding. */
	persistentArray?: CachePersistentArray;
}>;

/** Restoration callback for caller-owned renderer state. */
type ThreeCacheBackendRendererStateRestorer =
	/** Called by three cache backend renderer state restorer to handle one invocation of the declared operation. */ () => void;

/** Renderer operation executed while caller-owned state is preserved. */
type ThreeCacheBackendRendererOperation<T> =
	/**
	 * Called by three cache backend renderer operation to handle one invocation of the declared operation.
	 * @returns - The callback result returned to its caller.
	 */ () => T;

/** Three/WebGL2 adapter for Algorithm32's opaque GPU cache backend contract. */
class ThreeCacheBackend implements CacheGpuBackend, CachePacketAtlasBackend, CacheProbeReader {
	/**
	 * Creates a Three/WebGL2 cache backend after validating the renderer's
	 * scalar-array capabilities and framebuffer support.
	 *
	 * @param request - Three namespace and renderer adapted by the backend.
	 */
	constructor(request: ThreeCacheBackendRequest);

	/** Unique identity of the backend and its opaque resource handles. */
	readonly id: string;
	/** Validated GPU cache capabilities of the adapted renderer. */
	readonly capabilities: CacheGpuCapabilities;

	/**
	 * Call this method to allocate one opaque scalar-array cache field owned by
	 * this backend.
	 *
	 * @param field - Field identity and executable storage layout.
	 * @returns - Opaque disposable cache field.
	 */
	allocateField(field: CacheFieldSpec): GpuCacheField;
	/**
	 * Call this method to allocate and compile one opaque cache program while
	 * preserving caller-owned renderer state.
	 *
	 * @param shader - Assembled cache fragment shader.
	 * @returns - Opaque disposable compiled program.
	 */
	compile(shader: CacheShader): Promise<CacheGpuProgram>;
	/**
	 * Call this method to submit one cache wavelength layer while restoring every
	 * caller-owned renderer state value before returning or throwing.
	 *
	 * @param request - Program, fields, bindings, and layer for one submission.
	 */
	submitLayer(request: CacheLayerSubmission): void;
	/**
	 * Call this method to create one opaque runtime binding for a resident field
	 * owned by this backend.
	 *
	 * @param request - Resident field and caller-selected shader value.
	 * @returns - Opaque runtime binding.
	 */
	createRuntimeBinding(request: CacheRuntimeBindingRequest): CacheRuntimeBinding;
	/** Validate and eagerly upload one immutable resident texture. */
	uploadImmutableTexture(request: CacheImmutableTextureUploadRequest): CacheImmutableTexture;
	/** Call this method to allocate a bounded persistent RGBA32F array. */
	allocatePersistentArray(request: CachePersistentArrayRequest): CachePersistentArray;
	/** Call this method to replace one unprotected persistent-array layer. */
	uploadPersistentArrayLayer(request: CachePersistentArrayUpload): void;
	/** Call this method to atomically replace the published-layer protection set. */
	protectPersistentArrayLayers(array: CachePersistentArray, layers: readonly number[]): void;
	/** Call this method to inspect context generation and authenticated upload state. */
	getPersistentArrayState(array: CachePersistentArray): CachePersistentArrayState;
	/** Call this method to read bounded exact RGBA texels through opaque handles. */
	readTextureTexels(
		texture: CacheImmutableTexture | CachePersistentArray,
		coordinates: readonly CacheTextureTexel[],
	): Float32Array | Int32Array | Uint32Array;
	/**
	 * Call this method to resolve opaque bindings and install their private
	 * textures into already-created renderer uniforms.
	 *
	 * @param request - Runtime bindings and renderer uniforms.
	 */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	/**
	 * Call this method to read one complete resident scalar-array field through
	 * its opaque runtime binding while restoring renderer state.
	 *
	 * @param binding - Resident field binding owned by this backend.
	 * @returns Layer-major scalar field values and their storage layout.
	 */
	readRuntimeBindingField(
		binding: CacheRuntimeBinding,
	): Promise<Readonly<{storage: CacheFieldStorage; values: Float32Array}>>;
	/**
	 * Call this method to read selected field scalars while restoring caller-owned
	 * renderer state.
	 *
	 * @param request - Opaque field and selected scalar coordinates.
	 * @returns - Selected field scalars.
	 */
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
	/** Call this method to dispose every field and program owned by this adapter. */
	dispose(): void;
}
