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
