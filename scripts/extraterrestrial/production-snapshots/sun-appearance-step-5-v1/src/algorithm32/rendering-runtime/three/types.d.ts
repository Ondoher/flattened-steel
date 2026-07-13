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
};

/** Operation that refreshes runtime uniforms from caller-owned live bindings. */
type ShaderRuntimeUniformRefresher =
	/** Called by the runtime pass to refresh uniforms from live bindings. */ () => void;

/** Operation executed immediately before the normal Color draw after live uniforms are current. */
type ShaderRuntimePreRenderOperation =
	/**
	 * Called by the runtime pass for one frame.
	 * @param renderer - The active renderer.
	 * @param deltaTimeSeconds - Composer frame time in seconds.
	 */
	(renderer: ShaderRuntimePassRenderer, deltaTimeSeconds: number) => void;

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

	/** Optional operation run immediately before the normal Color draw. */
	readonly beforeRender?: ShaderRuntimePreRenderOperation | null;

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

/** Binding values published by the Color-owned sky-exposure runtime resource. */
type SkyExposureRuntimeBindingValues = Readonly<{
	/** One-pixel R32F texture containing the effective Figure-1 display coefficient. */
	readonly 'color.skyExposureCoefficientTexture': ShaderRuntimePassTexture;
}>;

/**
 * Lifecycle state of the Color-owned sky-exposure runtime resource.
 *
 * - **"ready"** - The fixed HDR resources are available for rendering.
 * - **"disposed"** - The fixed HDR resources have been released.
 */
type SkyExposureRuntimeStatus = 'ready' | 'disposed';

/**
 * Temporal behavior currently represented by one sky-exposure resource.
 *
 * - **"instantaneous"** - The current frame uses its exact target coefficient.
 * - **"smoothed"** - The resource retains and advances exposure history.
 */
type SkyExposureTemporalMode = 'instantaneous' | 'smoothed';

/** Per-frame input supplied by the renderer runtime to the sky-exposure resource. */
type SkyExposureRenderRequest = Readonly<{
	/** Elapsed frame time in seconds, used only when temporal smoothing is active. */
	readonly deltaTimeSeconds: number;
}>;

/** Explicit diagnostic readback from the one-pixel sky-exposure result. */
type SkyExposureMeasurementDiagnostics = Readonly<{
	/** Measured atmospheric-only photopic sky illuminance in lux. */
	readonly skyIlluminanceLux: number;

	/** Unsmoothed exposure factor selected from the measured sky illuminance. */
	readonly targetExposureFactor: number;

	/** Exposure factor represented by the currently published coefficient. */
	readonly currentExposureFactor: number;

	/** Effective coefficient multiplied into completed scene-linear RGB. */
	readonly effectiveDisplayCoefficient: number;

	/** Diffuse-sky reference illuminance in lux. */
	readonly referenceIlluminanceLux: number;

	/** Lower illuminance bound in lux used before reciprocal exposure. */
	readonly illuminanceFloorLux: number;

	/** Minimum accepted exposure factor. */
	readonly minimumExposureFactor: number;

	/** Maximum accepted exposure factor. */
	readonly maximumExposureFactor: number;

	/** Temporal behavior represented by the current value. */
	readonly temporalMode: SkyExposureTemporalMode;
}>;

/** Resource and lifecycle diagnostics that require no normal-frame GPU readback. */
type SkyExposureRuntimeDiagnostics = Readonly<{
	/** Stable diagnostic kind. */
	readonly kind: 'algorithm32-sky-exposure-runtime';

	/** Current resource lifecycle state. */
	readonly status: SkyExposureRuntimeStatus;

	/** Fixed dimensions of the atmospheric luminance sample field. */
	readonly sampleGridSize: PixelSize;

	/** HDR format of the atmospheric luminance sample field. */
	readonly sampleTextureFormat: 'R32F';

	/** HDR format of the published one-pixel exposure coefficient. */
	readonly coefficientTextureFormat: 'R32F';

	/** Temporal behavior implemented by the resource. */
	readonly temporalMode: SkyExposureTemporalMode;

	/** Number of completed sky-exposure updates. */
	readonly frameCount: number;

	/** Character count of the per-texel atmospheric sample shader. */
	readonly sampleShaderSourceCharacterCount: number;

	/** Character count of the one-pixel illuminance-reduction shader. */
	readonly reductionShaderSourceCharacterCount: number;

	/** Character count of the one-pixel coefficient shader. */
	readonly coefficientShaderSourceCharacterCount: number;

	/** Wall-clock duration of the most recent complete program preparation. */
	readonly preparationDurationSeconds: number | null;
}>;

/** Three namespace values needed by the private Color-owned exposure passes. */
type SkyExposureRuntimeThreeNamespace = ShaderRuntimePassThreeNamespace &
	Readonly<{
		/** WebGL render-target constructor runtime value. */
		readonly WebGLRenderTarget: unknown;
		/** Single-channel texture format runtime value. */
		readonly RedFormat: unknown;
		/** 32-bit floating-point texture type runtime value. */
		readonly FloatType: unknown;
		/** Nearest-neighbor texture filter runtime value. */
		readonly NearestFilter: unknown;
		/** Renderer-neutral no-color-space runtime value. */
		readonly NoColorSpace?: unknown;
	}>;

/** Construction values for the Color-owned sky-exposure field and reduction passes. */
type SkyExposureRuntimeConfiguration = Readonly<{
	/** Three namespace used to allocate private GPU resources. */
	readonly THREE: SkyExposureRuntimeThreeNamespace;
	/** Complete accepted Algorithm32 fragment source from which the atmospheric-only meter is derived. */
	readonly fragmentShaderSource: string;
	/** Runtime uniforms and resident cache bindings shared with ordinary atmospheric transport. */
	readonly uniforms: ShaderRuntimeUniformMap;
	/** Geometry-owned fixed observer-upper-hemisphere quadrature. */
	readonly plan: SkyExposureMeterPlan;
	/** Established Figure-1 display coefficient before exposure. */
	readonly paperFigure1ToneMapK: number;
	/** Optional pass-performance callback. */
	readonly performanceCallback?: ShaderPerformanceCallback;
	/** Pass-invocation cadence used for performance samples. */
	readonly performanceSampleIntervalFrames?: number;
	/** Maximum unresolved GPU queries retained by each pass timer. */
	readonly performanceMaxPendingQueries?: number;
}>;

/** Three renderer capabilities required by the sky-exposure runtime resource. */
interface SkyExposureRuntimeRenderer extends ShaderRuntimePassRenderer {
	/**
	 * Call this method to return the renderer target that exposure passes must restore.
	 *
	 * @returns - The active render target or the default framebuffer.
	 */
	getRenderTarget(): ShaderRuntimePassRenderTarget | null;

	/**
	 * Call this method to select an exposure target or restore the caller's target.
	 *
	 * @param target - The next render target or the default framebuffer.
	 * @returns - No return value.
	 */
	setRenderTarget(target: ShaderRuntimePassRenderTarget | null): void;

	/**
	 * Call this method to render one private exposure pass.
	 *
	 * @param scene - The private exposure scene.
	 * @param camera - The private exposure camera.
	 * @returns - No return value.
	 */
	render(scene: object, camera: object): void;

	/**
	 * Read the one-pixel diagnostic result only when explicit inspection is requested.
	 *
	 * @param target - The exposure render target.
	 * @param x - The left pixel coordinate.
	 * @param y - The lower pixel coordinate.
	 * @param width - The read width in pixels.
	 * @param height - The read height in pixels.
	 * @param destination - The float destination supplied by the inspector.
	 * @returns - No return value.
	 */
	readRenderTargetPixels(
		target: ShaderRuntimePassRenderTarget,
		x: number,
		y: number,
		width: number,
		height: number,
		destination: Float32Array,
	): void;
}

/** Internal Color-owned runtime capability that measures sky brightness and publishes one exposure coefficient. */
interface SkyExposureRuntimeResource {
	/** One-pixel coefficient texture consumed by the final Color pass. */
	readonly coefficientTexture: ShaderRuntimePassTexture;

	/**
	 * Call this method to return the exact binding patch consumed by the final Color pass.
	 *
	 * @returns - The one-pixel exposure texture binding.
	 */
	bindingValues(): SkyExposureRuntimeBindingValues;

	/**
	 * Call this method to prepare privately owned meter programs before the first normal frame. The promise rejects when the resource is disposed or renderer compilation fails.
	 *
	 * @param renderer - The renderer that owns the exposure programs.
	 * @returns - Completion after the private programs are ready.
	 */
	prepare(renderer: SkyExposureRuntimeRenderer): Promise<void>;

	/**
	 * Call this method to measure atmospheric sky brightness and publish the current coefficient.
	 *
	 * @param renderer - The renderer that executes the exposure passes.
	 * @param request - The current frame timing input.
	 * @returns - No return value.
	 */
	render(renderer: SkyExposureRuntimeRenderer, request: SkyExposureRenderRequest): void;

	/**
	 * Call this method to perform an explicit diagnostic readback outside normal frame rendering.
	 *
	 * @param renderer - The renderer that reads the one-pixel result.
	 * @returns - The measured exposure values and bounds.
	 */
	inspect(renderer: SkyExposureRuntimeRenderer): SkyExposureMeasurementDiagnostics;

	/**
	 * Call this method to return resource and lifecycle diagnostics without a GPU readback.
	 *
	 * @returns - The current resource diagnostics.
	 */
	getDiagnostics(): SkyExposureRuntimeDiagnostics;

	/**
	 * Call this method to release every privately owned sample, reduction, and history resource.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

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
