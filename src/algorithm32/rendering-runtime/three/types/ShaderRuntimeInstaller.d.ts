/** Accepted runtime binding values keyed by provider-neutral value key. */
type ShaderRuntimeBindingValues = Record<string, unknown>;

/** Camera position surface used while resolving geometry-owned scene depth. */
type ShaderRuntimeCameraCandidate = {
	/** Optional candidate position coordinates. */
	position?: {
		/** Candidate x coordinate. */
		x?: unknown;
		/** Candidate y coordinate. */
		y?: unknown;
		/** Candidate z coordinate. */
		z?: unknown;
	};
};

/** Normalized scene-input capture configuration resolved during runtime installation. */
type ShaderRuntimeSceneInputCaptureConfig = {
	/** Unit-bearing viewport dimensions. */
	readonly viewportSize: PixelSize;
	/** Largest representable scene-hit distance. */
	readonly sceneDepthMax: Distance;
	/** Renderer scene-to-physical scale. */
	readonly sceneScale: SceneScale;
};

/** Renderer-produced scene-input capture state and binding patch. */
type ShaderRuntimeSceneInputBindings = {
	/** Optional capture pass created for missing renderer inputs. */
	readonly sceneInputCapture: SceneInputCapture | null;
	/** Renderer-produced binding values keyed by provider-neutral value key. */
	readonly bindingValues: ShaderRuntimeBindingValues;
};

/** Three camera surface from which rendering runtime captures a renderer-neutral celestial view. */
type ShaderRuntimeCelestialViewCamera = Readonly<{
	/** Perspective-camera discriminator required by stellar generation. */
	readonly isPerspectiveCamera?: boolean;
	/** Column-major projection matrix elements. */
	readonly projectionMatrix: Readonly<{readonly elements: readonly number[]}>;
	/** Column-major inverse camera-world matrix elements. */
	readonly matrixWorldInverse: Readonly<{readonly elements: readonly number[]}>;
	/** Optional renderer-maintained inverse perspective matrix. */
	readonly projectionMatrixInverse?: Readonly<{readonly elements: readonly number[]}>;
	/** Refresh current camera matrices before capture when supported. */
	readonly updateMatrixWorld?: () => void;
}>;

/** Runtime owner that captures exact camera/projection/viewport compatibility at a frame boundary. */
interface ShaderRuntimeCelestialViewSnapshotProvider {
	/**
	 * Capture a renderer-neutral view snapshot for generation and completion checks.
	 *
	 * @param camera - Current runtime camera.
	 * @param viewportSize - Current runtime viewport dimensions.
	 * @returns - Exact view snapshot consumed by standard celestial stages.
	 */
	capture(camera: ShaderRuntimeCelestialViewCamera, viewportSize: PixelSize): CelestialRenderViewSnapshot;
}
