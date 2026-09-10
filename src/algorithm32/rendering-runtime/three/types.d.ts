/** Mutable coordinate candidate exposed by a scene-input capture camera. */
type SceneInputCaptureVectorLike = {
	/** Optional x coordinate. */
	readonly x?: unknown;
	/** Optional y coordinate. */
	readonly y?: unknown;
	/** Optional z coordinate. */
	readonly z?: unknown;
};

/** Mutable Three vector used at the scene-input camera boundary. */
type SceneInputCaptureVector = {
	/** Current x coordinate. */
	x: number;
	/** Current y coordinate. */
	y: number;
	/** Current z coordinate. */
	z: number;
	/**
	 * Call this method to replace all three coordinates.
	 *
	 * @param x - The next x coordinate.
	 * @param y - The next y coordinate.
	 * @param z - The next z coordinate.
	 * @returns - The updated vector when supplied by the renderer.
	 */
	set(x: number, y: number, z: number): unknown;
};

/** Three camera surface exposed to the scene-input capture pass. */
type SceneInputCaptureCamera = {
	/** Optional camera position candidate used when no world-position method exists. */
	readonly position?: SceneInputCaptureVectorLike;
	/**
	 * Call this method to write the camera world position when the camera provides it.
	 *
	 * @param target - The mutable destination vector.
	 * @returns - The renderer-specific world-position result.
	 */
	getWorldPosition?(target: SceneInputCaptureVector): unknown;
};

/** Three object surface traversed by the scene-input capture pass. */
type SceneInputCaptureObject = {
	/** Current object visibility. */
	visible: boolean;
	/** Renderer-neutral object metadata. */
	readonly userData?: Readonly<Record<string, unknown>>;
};

/** Operation that visits one object exposed by scene-input traversal. */
type SceneInputCaptureObjectVisitor =
	/**
	 * Called by scene-input traversal to visit one exposed object.
	 * @param object - The visited scene object.
	 */ (object: SceneInputCaptureObject) => void;

/** Three scene surface exposed to the scene-input capture pass. */
type SceneInputCaptureScene = {
	/** Current renderer override material. */
	overrideMaterial?: unknown;
	/** Current renderer scene background. */
	background?: unknown;
	/**
	 * Call this method to visit scene objects when traversal is available.
	 *
	 * @param callback - The object visitor.
	 * @returns - No return value.
	 */
	traverse?(callback: SceneInputCaptureObjectVisitor): void;
};

/** Opaque Three color object preserved across scene-input capture. */
type SceneInputCaptureColor = object;

/** Mutable Three texture exposed by the scene-input capture pass. */
type SceneInputCaptureTexture = {
	/** Optional renderer diagnostic name. */
	name?: string;
	/** Optional mipmap-generation flag. */
	generateMipmaps?: boolean;
};

/** Three render-target surface used by the scene-input capture pass. */
type SceneInputCaptureRenderTarget = {
	/** Value that renders-target texture exposed to runtime bindings. */
	readonly texture: SceneInputCaptureTexture;
	/** Current target width in pixels. */
	width: number;
	/** Current target height in pixels. */
	height: number;
	/**
	 * Call this method to resize the target when the renderer provides it.
	 *
	 * @param widthPixels - The next width in pixels.
	 * @param heightPixels - The next height in pixels.
	 * @returns - No return value.
	 */
	setSize?(widthPixels: number, heightPixels: number): void;
	/** Call this method to release the target when disposal is available. */
	dispose?(): void;
};

/** Three renderer surface exposed to the scene-input capture pass. */
type SceneInputCaptureRenderer = {
	/**
	 * Call this method to select the active render target.
	 *
	 * @param target - The next render target or the default framebuffer.
	 * @returns - No return value.
	 */
	setRenderTarget(target: SceneInputCaptureRenderTarget | null): void;
	/**
	 * Call this method to render the configured scene and camera.
	 *
	 * @param scene - The scene to render.
	 * @param camera - The camera used for rendering.
	 * @returns - No return value.
	 */
	render(scene: SceneInputCaptureScene, camera: SceneInputCaptureCamera): void;
	/**
	 * Call this method to return the current render target when available.
	 * @returns - The result produced by the operation.
	 */
	getRenderTarget?(): SceneInputCaptureRenderTarget | null;
	/**
	 * Call this method to copy the current clear color when available.
	 *
	 * @param target - The destination color object.
	 * @returns - The current clear color.
	 */
	getClearColor?(target: SceneInputCaptureColor): SceneInputCaptureColor;
	/**
	 * Call this method to return the current clear alpha when available.
	 * @returns - The result produced by the operation.
	 */
	getClearAlpha?(): number;
	/**
	 * Call this method to replace the clear color and alpha when available.
	 *
	 * @param color - The renderer-specific clear color.
	 * @param alpha - The optional clear alpha.
	 * @returns - No return value.
	 */
	setClearColor?(color: unknown, alpha?: number): void;
	/**
	 * Call this method to clear selected renderer buffers when available.
	 *
	 * @param color - Whether to clear the color buffer.
	 * @param depth - Whether to clear the depth buffer.
	 * @param stencil - Whether to clear the stencil buffer.
	 * @returns - No return value.
	 */
	clear?(color?: boolean, depth?: boolean, stencil?: boolean): void;
};

/** Caller-visible Three namespace boundary for scene-input capture construction. */
type SceneInputCaptureThreeNamespace = {
	/** WebGL render-target constructor runtime value. */
	readonly WebGLRenderTarget: unknown;
	/** Shader-material constructor runtime value. */
	readonly ShaderMaterial: unknown;
	/** Three-dimensional vector constructor runtime value. */
	readonly Vector3: unknown;
	/** Optional color constructor runtime value. */
	readonly Color?: unknown;
	/** RGBA texture-format runtime value. */
	readonly RGBAFormat: unknown;
	/** Unsigned-byte texture-type runtime value. */
	readonly UnsignedByteType: unknown;
	/** Nearest-neighbor texture-filter runtime value. */
	readonly NearestFilter: unknown;
};

/** Construction data for the renderer-produced scene-input capture pass. */
type SceneInputCaptureConfiguration = {
	/** Caller-provided Three namespace boundary. */
	readonly THREE: SceneInputCaptureThreeNamespace;

	/** Live scene rendered before the Algorithm32 pass. */
	readonly scene: SceneInputCaptureScene;

	/** Live camera used to render the scene. */
	readonly camera: SceneInputCaptureCamera;

	/** Unit-bearing capture viewport dimensions. */
	readonly viewportSize: PixelSize;

	/** Largest representable scene-hit distance. */
	readonly sceneDepthMax?: Distance;

	/** Renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;

	/** Optional performance callback for capture passes. */
	readonly performanceCallback?: ShaderPerformanceCallback;

	/** Pass-invocation cadence used for performance samples. */
	readonly performanceSampleIntervalFrames?: number;

	/** Maximum unresolved GPU queries retained per capture pass. */
	readonly performanceMaxPendingQueries?: number;
};

/** Runtime binding values produced by the scene-input capture pass. */
type SceneInputCaptureBindingValues = {
	/** Packed depth texture consumed by the runtime shader. */
	readonly 'runtime.sceneDepthTexture': SceneInputCaptureTexture;

	/** Explicit hit-mask texture consumed by the runtime shader. */
	readonly 'runtime.sceneHitTexture': SceneInputCaptureTexture;

	/** Viewport dimensions consumed by the runtime shader. */
	readonly 'runtime.viewportSize': PixelSize;
};

/**
 * Scene-input capture resource lifecycle status.
 *
 * - **"ready"** - Capture resources are available.
 * - **"disposed"** - Capture resources have been released.
 */
type SceneInputCaptureStatus = 'ready' | 'disposed';

/** Runtime diagnostics for the renderer-owned scene-input capture pass. */
type SceneInputCaptureDiagnostics = {
	/** Diagnostic kind. */
	readonly kind: 'algorithm32-scene-input-capture-pass';
	/** Resource lifecycle status. */
	readonly status: SceneInputCaptureStatus;
	/** Renderer capture policy. */
	readonly capturePolicy: 'renderer-override-material-distance-plus-hit-mask';
	/** Scene-depth texture encoding. */
	readonly sceneDepthEncoding: 'rgb24-normalized-physical-distance';
	/** Scene-hit mask encoding. */
	readonly sceneHitMaskEncoding: 'r8-explicit-hit-mask';
	/** Largest representable scene-hit distance. */
	readonly sceneDepthMax: Distance;
	/** Renderer scene-to-physical scale. */
	readonly sceneScale: SceneScale;
	/** Current unit-bearing viewport size. */
	readonly viewportSize: PixelSize;
	/** Completed capture-frame count. */
	readonly frameCount: number;
};

/** Renderer-owned scene-input capture surface. */
interface SceneInputCapture {
	/** Whether the composer may execute this capture pass. */
	enabled: boolean;
	/** Current depth texture. */
	readonly depthTexture: SceneInputCaptureTexture;
	/** Current explicit hit-mask texture. */
	readonly hitTexture: SceneInputCaptureTexture;
	/** Current unit-bearing viewport size. */
	readonly viewportSize: PixelSize;
	/**
	 * Call this method to return runtime binding values for the captured inputs.
	 * @returns - The result produced by the operation.
	 */
	bindingValues(): SceneInputCaptureBindingValues;
	/**
	 * Call this method to resize owned targets.
	 * @param width - The width value accepted by the operation.
	 * @param height - The height value accepted by the operation.
	 */
	setSize(width: number, height: number): void;
	/**
	 * Call this method to capture the configured scene inputs.
	 * @param renderer - The renderer value accepted by the operation.
	 */
	capture(renderer: SceneInputCaptureRenderer): void;
	/**
	 * Call this method to render the capture operation.
	 * @param renderer - The renderer value accepted by the operation.
	 */
	render(renderer: SceneInputCaptureRenderer): void;
	/**
	 * Call this method to return implementation diagnostics.
	 * @returns - The result produced by the operation.
	 */
	getDiagnostics(): SceneInputCaptureDiagnostics;
	/** Call this method to release owned resources. */
	dispose(): void;
}

/** Mutable runtime uniform value installed on a Three shader pass. */
type ShaderRuntimeUniform = {
	/** Current shader-compatible value. */
	value: unknown;
};

/** Runtime uniform map keyed by GLSL uniform name or cache value key. */
type ShaderRuntimeUniformMap = Record<string, ShaderRuntimeUniform>;

/** Operation that adds or removes one pass at a renderer-composer boundary. */
type ShaderRuntimeComposerPassOperation =
	/**
	 * Called by runtime installation or disposal to update one composer pass.
	 * @param pass - The renderer pass to add or remove.
	 */ (pass: unknown) => void;

/** Optional Three composer surfaces used to install and remove runtime passes. */
type ShaderRuntimeComposer = {
	/**
	 * Value that appends a renderer pass.
	 *
	 * @param pass - The pass to append.
	 * @returns - No return value.
	 *
	 */
	addPass?: ShaderRuntimeComposerPassOperation;
	/**
	 * Value that removes a renderer pass.
	 *
	 * @param pass - The pass to remove.
	 * @returns - No return value.
	 *
	 */
	removePass?: ShaderRuntimeComposerPassOperation;
	/** Mutable ordered renderer passes when no removal method is available. */
	passes?: unknown[];
};

/** Type for an installed runtime shader artifact. */
type ShaderRuntimeArtifact = {
	/** Call this method to publish an accepted celestial observation without rebuilding the installed shader. */
	publishObservation?(observation: GeometryObservation): void;
	/**
	 * Call this method to prepare the installed program for its first render.
	 *
	 * @param renderer - Supplies the runtime renderer.
	 * @returns - The result produced by the operation.
	 */
	prepare(renderer: ShaderRuntimePassRenderer): Promise<void>;

	/**
	 * Call this method to dispose the privately owned installed pass and scene-input resources.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;

	/**
	 * Call this method to return internal runtime diagnostics.
	 *
	 * @returns - The runtime diagnostics snapshot.
	 */
	getDiagnostics(): unknown;

	/** Optional standard-pipeline owner for stellar and Sun output generation. */
	readonly celestialGenerationParticipant?: CelestialGenerationRuntimeParticipant | null;
};

/** Operation that refreshes runtime uniforms from caller-owned live bindings. */
type ShaderRuntimeUniformRefresher =
	/** Called by the runtime pass to refresh uniforms from live bindings. */ () => void;

/** Type that supplies construction data for the runtime shader pass. */
type ShaderRuntimePassConfiguration = {
	/**
	 * Caller-provided Three namespace boundary.
	 */
	readonly THREE: ShaderRuntimePassThreeNamespace;

	/** Value that stores the fragment shader source to install. */
	readonly fragmentShaderSource: string;

	/** Value that stores the fragment source hash. */
	readonly sourceHash: string;

	/** Value that stores pass uniforms. */
	readonly uniforms: ShaderRuntimeUniformMap;

	/** Value that stores the accepted unit-bearing viewport dimensions. */
	readonly viewportSize: PixelSize;

	/** Value that stores optional preceding renderer-produced scene input texture provider. */
	readonly sceneInputCapture?: SceneInputCapture | null;

	/** Refresh uniforms backed by the caller-owned live binding record. */
	readonly refreshUniformValues?: ShaderRuntimeUniformRefresher | null;

	/** Value that stores an optional runtime logger. */
	readonly logger?: Console | null;

	/** Value that stores an optional performance callback for the runtime pass. */
	readonly performanceCallback?: ShaderPerformanceCallback;

	/** Value that stores the pass invocation cadence used for performance samples. */
	readonly performanceSampleIntervalFrames?: number;

	/** Value that stores the maximum unresolved GPU queries retained by the runtime pass. */
	readonly performanceMaxPendingQueries?: number;
};

/** Mutable Three texture surface exposed at the runtime-pass composer boundary. */
type ShaderRuntimePassTexture = {
	/** Optional renderer diagnostic name. */
	readonly name?: string;
};

/** Three render-target surface exposed at the runtime-pass composer boundary. */
type ShaderRuntimePassRenderTarget = {
	/** Optional texture or texture array supplying scene color or renderer diagnostics. */
	readonly texture?: ShaderRuntimePassTexture | readonly ShaderRuntimePassTexture[];
};

/** Three renderer surface exposed to the runtime shader pass. */
type ShaderRuntimePassRenderer = {
	/** Renderer color-buffer auto-clear flag. */
	readonly autoClearColor?: boolean;
	/** Renderer depth-buffer auto-clear flag. */
	readonly autoClearDepth?: boolean;
	/** Renderer stencil-buffer auto-clear flag. */
	readonly autoClearStencil?: boolean;
	/**
	 * Call this method to compile the private runtime scene and camera asynchronously when available.
	 *
	 * @param scene - The private runtime scene.
	 * @param camera - The private runtime camera.
	 * @returns - Completion of asynchronous compilation.
	 */
	compileAsync?(scene: object, camera: object): Promise<unknown>;
	/**
	 * Call this method to compile the private runtime scene and camera.
	 *
	 * @param scene - The private runtime scene.
	 * @param camera - The private runtime camera.
	 * @returns - No return value.
	 */
	compile(scene: object, camera: object): void;
	/**
	 * Call this method to select the active render target when available.
	 *
	 * @param target - The next composer target or the default framebuffer.
	 * @returns - No return value.
	 */
	setRenderTarget?(target: ShaderRuntimePassRenderTarget | null): void;
	/**
	 * Call this method to clear selected renderer buffers when available.
	 *
	 * @param color - Whether to clear the color buffer.
	 * @param depth - Whether to clear the depth buffer.
	 * @param stencil - Whether to clear the stencil buffer.
	 * @returns - No return value.
	 */
	clear?(color?: boolean, depth?: boolean, stencil?: boolean): void;
	/**
	 * Call this method to render the private runtime scene and camera when available.
	 *
	 * @param scene - The private runtime scene.
	 * @param camera - The private runtime camera.
	 * @returns - No return value.
	 */
	render?(scene: object, camera: object): void;
};

/** Caller-visible Three namespace boundary for runtime-pass construction. */
type ShaderRuntimePassThreeNamespace = {
	/** Raw shader-material constructor runtime value. */
	readonly RawShaderMaterial: unknown;
	/** Plane-geometry constructor runtime value. */
	readonly PlaneGeometry: unknown;
	/** Mesh constructor runtime value. */
	readonly Mesh: unknown;
	/** Scene constructor runtime value. */
	readonly Scene: unknown;
	/** Orthographic-camera constructor runtime value. */
	readonly OrthographicCamera: unknown;
	/** Optional GLSL 3 renderer constant. */
	readonly GLSL3?: unknown;
};
