/** Private override-material surface owned by the scene-input capture pass. */
type SceneInputCaptureMaterial = {
	/** Material depth-test flag. */
	depthTest: boolean;
	/** Material depth-write flag. */
	depthWrite: boolean;
	/** Mutable shader uniforms keyed by GLSL name. */
	readonly uniforms: Record<
		string,
		{
			/** Current shader-compatible value. */
			value: unknown;
		}
	>;
	/** Call this method to release the material when disposal is available. */
	dispose?(): void;
};

/** Private Three resource-construction surface owned by the scene-input capture pass. */
type SceneInputCaptureResourceNamespace = {
	/** WebGL render-target constructor used for capture textures. */
	readonly WebGLRenderTarget: new (
		widthPixels: number,
		heightPixels: number,
		configuration: object,
	) => SceneInputCaptureRenderTarget;
	/** Shader-material constructor used for scene overrides. */
	readonly ShaderMaterial: new (configuration: object) => SceneInputCaptureMaterial;
	/** Three-dimensional vector constructor used for camera position. */
	readonly Vector3: new () => SceneInputCaptureVector;
	/** Optional color constructor used to preserve renderer clear state. */
	readonly Color?: new () => SceneInputCaptureColor;
	/** RGBA texture-format runtime value. */
	readonly RGBAFormat: unknown;
	/** Unsigned-byte texture-type runtime value. */
	readonly UnsignedByteType: unknown;
	/** Nearest-neighbor texture-filter runtime value. */
	readonly NearestFilter: unknown;
};

/** Renderer clear-state snapshot preserved across scene-input capture. */
type SceneInputCaptureRendererClearState = {
	/** Renderer clear color. */
	readonly color: SceneInputCaptureColor;
	/** Renderer clear alpha. */
	readonly alpha: number;
};

/** Visibility snapshot for one scene object excluded from capture. */
type SceneInputCaptureVisibilitySnapshot = {
	/** Scene object hidden during capture. */
	readonly object: SceneInputCaptureObject;
	/** Object visibility before capture. */
	readonly visible: boolean;
};
