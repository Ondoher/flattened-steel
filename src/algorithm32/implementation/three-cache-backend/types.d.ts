/** Private renderer-preservation capability shared by persistent texture operations. */
interface ThreeCacheRendererPreserver {
	/** Call this method to execute one operation while restoring caller-owned renderer state. */
	run<T>(operation: () => T): T;
}

/** Persistent array's renderer-owned dependencies and immutable allocation request. */
type ThreeCachePersistentArrayDefinition = {
	/** Backend-owned Three/WebGL dependencies. */
	backend: ThreeCacheBackendRecord;
	/** Immutable storage request and allocation budget. */
	request: CachePersistentArrayRequest;
	/** Existing backend renderer-state preservation capability. */
	preserve: ThreeCacheRendererPreserver;
};

/** Private persistent array capability, never exposed through a runtime handle. */
interface ThreeCachePersistentArrayOwner {
	/** Call this method to resolve the live Three texture inside the renderer adapter. */
	resolveTexture(): ThreeCacheBackendTexture;
	/** Call this method to upload a complete unprotected layer. */
	upload(layer: number, identity: string, values: Float32Array): void;
	/** Call this method to replace the protected published-layer set. */
	protect(layers: readonly number[]): void;
	/** Call this method to inspect context and uploaded identities. */
	state(): CachePersistentArrayState;
	/** Call this method to detach listeners and dispose GPU storage. */
	dispose(): void;
}

/** Three runtime values required by the cache backend boundary. */
type ThreeCacheBackendNamespace = Readonly<{
	/** Three release-revision runtime value. */
	REVISION: unknown;
	/** Red texture-format runtime value. */
	RedFormat: unknown;
	/** RGBA texture-format runtime value. */
	RGBAFormat: unknown;
	/** Red integer texture-format runtime value. */
	RedIntegerFormat: unknown;
	/** Two-component integer metadata format. */
	RGIntegerFormat: unknown;
	/** Four-component integer metadata format. */
	RGBAIntegerFormat: unknown;
	/** Signed 32-bit integer texture type. */
	IntType: unknown;
	/** Float texture-type runtime value. */
	FloatType: unknown;
	/** Unsigned-short texture-type runtime value. */
	UnsignedShortType: unknown;
	/** Nearest-neighbor filter runtime value. */
	NearestFilter: unknown;
	/** Linear filter runtime value. */
	LinearFilter: unknown;
	/** Edge-clamping wrap runtime value. */
	ClampToEdgeWrapping: unknown;
	/** GLSL 3 version runtime value. */
	GLSL3: unknown;
	/** Disabled-blending runtime value. */
	NoBlending: unknown;
	/** Three-dimensional vector-constructor runtime value. */
	Vector3: unknown;
	/** Four-dimensional vector-constructor runtime value. */
	Vector4: unknown;
	/** Scalar array render-target-constructor runtime value. */
	WebGLArrayRenderTarget: unknown;
	/** Two-dimensional data-texture-constructor runtime value. */
	DataTexture: unknown;
	/** Array data-texture-constructor runtime value. */
	DataArrayTexture: unknown;
	/** Buffer-geometry-constructor runtime value. */
	BufferGeometry: unknown;
	/** Buffer-attribute-constructor runtime value. */
	BufferAttribute: unknown;
	/** Raw-shader-material-constructor runtime value. */
	RawShaderMaterial: unknown;
	/** Mesh-constructor runtime value. */
	Mesh: unknown;
	/** Scene-constructor runtime value. */
	Scene: unknown;
	/** Camera-constructor runtime value. */
	Camera: unknown;
}>;

/** Renderer runtime values required by the cache backend boundary. */
type ThreeCacheBackendRenderer = Readonly<{
	/** Renderer-capabilities runtime value. */
	capabilities: unknown;
	/** WebGL-context-access runtime value. */
	getContext: unknown;
	/** Active-render-target-access runtime value. */
	getRenderTarget: unknown;
	/** Active-cube-face-access runtime value. */
	getActiveCubeFace: unknown;
	/** Active-mip-level-access runtime value. */
	getActiveMipmapLevel: unknown;
	/** Viewport-access runtime value. */
	getViewport: unknown;
	/** Scissor-rectangle-access runtime value. */
	getScissor: unknown;
	/** Scissor-test-state-access runtime value. */
	getScissorTest: unknown;
	/** Value that renders-target-selection runtime value. */
	setRenderTarget: unknown;
	/** Viewport-selection runtime value. */
	setViewport: unknown;
	/** Scissor-rectangle-selection runtime value. */
	setScissor: unknown;
	/** Scissor-test-selection runtime value. */
	setScissorTest: unknown;
	/** Optional asynchronous compilation runtime value. */
	compileAsync?: unknown;
	/** Synchronous compilation runtime value. */
	compile: unknown;
	/** Eager texture-upload runtime value. */
	initTexture: unknown;
	/** Scene-rendering runtime value. */
	render: unknown;
}>;

/** Three namespace and renderer request accepted by the cache backend. */
type ThreeCacheBackendRequest = Readonly<{
	/** Three runtime namespace adapted by the cache backend. */
	THREE: ThreeCacheBackendNamespace;
	/** Renderer runtime value adapted by the cache backend. */
	renderer: ThreeCacheBackendRenderer;
}>;

/** Browser renderer identity and implementation assessment reported by the Three/WebGL lane. */
type ThreeWebglRendererDiagnostic = Readonly<{
	/** Renderer-vendor identity reported by WebGL. */
	vendor: string;
	/** Renderer implementation identity reported by WebGL. */
	renderer: string;
	/** Hardware, software, or unavailable renderer assessment. */
	assessment: string;
}>;

/** Captured browser renderer-state restoration operation. */
type ThreeWebglRendererStateRestoration = Readonly<{
	/** Call this method to restore the captured renderer state. */
	restore(): void;
}>;

/** Browser-owned resources for one fullscreen scalar-writing pass. */
type ThreeWebglScalarPassResources<Material, Geometry, Scene, Camera> = Readonly<{
	/** Raw shader material used by the scalar pass. */
	material: Material;
	/** Fullscreen triangle geometry used by the scalar pass. */
	geometry: Geometry;
	/** Scene containing the fullscreen scalar-pass mesh. */
	scene: Scene;
	/** Camera used to submit the fullscreen scalar pass. */
	camera: Camera;
	/** Call this method to release the pass-owned material and geometry. */
	dispose(): void;
}>;
