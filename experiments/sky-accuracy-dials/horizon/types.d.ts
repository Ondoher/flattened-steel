/** Scene-linear RGB components before the display response, in red, green, blue order. */
type HorizonLinearRgb = [red: number, green: number, blue: number];

/** One physical sky ray sampled using the installed camera projection. */
type HorizonRayObservation = {
	/** Screen coordinates in the original viewport, bottom-up. */
	uv: number[];
	/** Nominal center-ray elevation in degrees above scene horizontal, corrected for camera pitch. */
	elevationDegrees: number;
	/** Float32 RGBA stages: display, composed RGB, path RGB, direction/length,
	 * hit/depth/endpoint/lux, four radiance groups, then four transmission groups.
	 * Groups retain fifteen physical channels and a zero padding slot. */
	stages: number[][];
};

/** Actual browser observation, including private implementation facts for this diagnostic only. */
type HorizonObservation = {
	/** Exact application state, shader and binding descriptions. */
	facts: Record<string, unknown>;
	/** Original installed fragment shader, retained for reproduction. */
	shader: string;
	/** Derived observational shader; cache and transport computations remain unchanged. */
	probeShader: string;
	/** Ordered ray measurements. */
	rays: HorizonRayObservation[];
};

/** Frozen physical inputs for independent continuous local single-scattering integration. */
type HorizonContinuousInputs = {
	/** Physical unit viewing direction in the flat model frame. */ direction: number[];
	/** Original geometry-selected segment length in meters. */ length: number;
	/** Actual finite Sun center in model meters. */ sourcePosition: number[];
	/** Native15 irradiance density at the reference distance, W m^-2 nm^-1. */ sourceIrradiance: number[];
	/** Native15 sea-level Rayleigh scattering coefficients in inverse meters. */ rayleigh: number[];
	/** Native15 sea-level Mie extinction coefficients in inverse meters. */ mie: number[];
	/** Mie single-scattering albedo. */ albedo: number;
	/** Mie phase asymmetry. */ g: number;
	/** Rayleigh density scale height in meters. */ rayleighHeight: number;
	/** Mie density scale height in meters. */ mieHeight: number;
	/** Irradiance reference distance in meters. */ referenceDistance: number;
};

/** Emission partition, always retaining the full combined extinction.
 * - **"total"** - Full Rayleigh plus Mie source.
 * - **"rayleigh"** - Rayleigh source only, for additive attribution.
 * - **"mie"** - Mie source only, for additive attribution.
 */
type HorizonScatteringComponent = 'total' | 'rayleigh' | 'mie';

/** Minimal private-state observation surface of the existing application; never a production API. */
type HorizonApplicationObservation = {
	/** Installed application state. */
	_state: unknown;
	/** Selected application presentation. */
	_productionSelections: unknown;
	/** Live scene renderer and camera, borrowed for synchronous readback. */
	_sceneRuntime: HorizonSceneObservation;
	/** Installed composer and mode diagnostic state. */
	_modeController: HorizonModeObservation;
};

/** Borrowed scene resources used for observation. */
type HorizonSceneObservation = {
	/** Renderer whose installed texture bindings are borrowed. */ renderer: HorizonRenderer;
	/** Actual current view. */ camera: HorizonCamera;
};

/** Minimum current-mode observation, without exposing its production lifecycle. */
type HorizonModeObservation = {
	/** Published runtime. */ _activeRuntime: HorizonRuntimeObservation;
};

/** Distant-runtime composer fallback; compact frames use the observed pass registry. */
type HorizonRuntimeObservation = {
	/** Composer currently owned by this runtime. */ _composer: HorizonComposerObservation;
};

/** Minimal pass inventory for locating the active physical shader. */
type HorizonComposerObservation = {
	/** Ordered installed passes. */ passes: HorizonPassObservation[];
};

/** Runtime pass observation; no rendering or mutation capability is exposed here. */
type HorizonPassObservation = {
	/** Optional material, absent on non-material composer passes. */ material?: HorizonShaderMaterial;
	/** Retirement marker from a constructed runtime pass. */ _disposed?: boolean;
};

/** Capability to copy a Three vector or quaternion into ordinary numeric storage. */
interface HorizonArraySnapshot {
	/** Return caller-owned numeric components. */ toArray(): number[];
}

/** Borrowed uniform handle; the observer does not replace its value. */
type HorizonUniformObservation = {
	/** Actual runtime scalar, vector, matrix or texture. */ value: unknown;
};

/** Borrowed renderer operations used by the independent observation target. */
interface HorizonRenderer {
	/** Read the target restored after observation. */
	getRenderTarget(): unknown;
	/** Bind a borrowed target or the default framebuffer. */
	setRenderTarget(target: unknown): void;
	/** Render one independently owned diagnostic scene. */
	render(scene: unknown, camera: unknown): void;
	/** Copy one RGBA Float32 pixel into caller-owned storage. */
	readRenderTargetPixels(target: unknown, x: number, y: number, width: number, height: number, output: Float32Array): void;
	/** Read hardware identity and GL error state. */
	getContext(): WebGL2RenderingContext;
}

/** Camera fields whose actual values qualify the chosen sky rays. */
interface HorizonCamera {
	/** Current scene position. */
	position: HorizonArraySnapshot;
	/** Current scene orientation. */
	quaternion: HorizonArraySnapshot;
	/** Current perspective aspect ratio. */
	aspect: number;
	/** Current vertical field of view, in degrees. */
	getEffectiveFOV(): number;
}

/** Installed shader data borrowed without changing live material or uniform owners. */
type HorizonShaderMaterial = {
	/** Exact original vertex source. */
	vertexShader: string;
	/** Exact original fragment source. */
	fragmentShader: string;
	/** Borrowed uniform handles, including cache textures. */
	uniforms: Record<string, HorizonUniformObservation>;
};

/** Experiment-only browser ingress installed by the observational bundle. */
interface Window {
	/** Runtime passes observed at construction in the experiment-served bundle only. */
	__horizonPasses?: HorizonPassObservation[];
	/** Reference exposed in the served experiment copy of the application bundle. */
	__horizonApplication: HorizonApplicationObservation;
	/** Synchronous observation that borrows and restores the renderer target. */
	__observeHorizon: () => HorizonObservation;
}
