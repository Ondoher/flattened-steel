/** Scene-linear RGB components before the display response, in red, green, blue order. */
type HorizonLinearRgb = [red: number, green: number, blue: number];

/** Color-matching quadrature used to separate parity from within-bin approximation.
 * - **"midpoint"** - Sample matching functions at each channel center.
 * - **"bin-integrated"** - Integrate matching functions with constant density inside each bin.
 */
type HorizonCmfRule = 'midpoint' | 'bin-integrated';

/** Independent signed color reading before exposure or clipping. */
type HorizonColorReading = {
    /** Photometrically scaled CIE X/Y/Z; Y is luminance. */ xyz: number[];
    /** CIE x/y, or null for black. */ xy: number[] | null;
    /** Photopic luminance in cd m^-2 for input radiance W m^-2 sr^-1 nm^-1. */ luminanceCdPerM2: number;
    /** Signed linear sRGB in the same photometric scale. */ rgb: number[];
    /** Indices whose signed RGB values are negative, before clipping. */ negativeChannels: number[];
    /** Signed red divided by blue, or null for a zero denominator. */ redBlueRatio: number | null;
};

/** Independent color arithmetic controls, retained with each H3 result. */
type HorizonColorControls = {
    /** D65 XYZ transformed to unit linear sRGB. */ white: number[];
    /** Constant spectral-density color across the full declared basis. */ equalEnergy: HorizonColorReading;
    /** Maximum relative basis-impulse additivity residual. */ maximumLinearityRelative: number;
    /** Publisher-authenticated original CSV checksum. */ cieMd5: string;
};

/** Geometric medium in the continuous diagnostic.
 * - **"flat"** - Exponential density above a plane.
 * - **"spherical"** - Exponential density above a spherical surface.
 */
type HorizonDiagnosticGeometry = 'flat' | 'spherical';

/** Source propagation for controlled physical contrasts.
 * - **"finite"** - Actual local point-source position with inverse-square dilution.
 * - **"parallel"** - Fixed direction and declared incident irradiance scale.
 */
type HorizonDiagnosticSource = 'finite' | 'parallel';

/** Continuous N1 inputs extending the frozen local physical packet. */
type HorizonTransportInput = Omit<HorizonContinuousInputs, 'length'> & {
    /** Explicit flat observer-dome extent; absent for physical atmosphere exit. */ length?: number;
    /** Explicit medium geometry. */ geometry: HorizonDiagnosticGeometry;
    /** Explicit source propagation. */ sourceKind: HorizonDiagnosticSource;
    /** Unit direction for a parallel source. */ sourceDirection: number[];
    /** Spherical bottom radius, meters. */ radius: number;
    /** Atmosphere top above the surface, meters. */ topAltitude: number;
    /** Parallel irradiance multiplier, dimensionless. */ incidentScale: number;
};

/** Non-overlapping numerical strata of the same completed Simpson sum. */
type HorizonTransportStratum = {
    /** Inclusive lower distance in meters. */ lowMeters: number;
    /** Upper distance in meters; last stratum includes the endpoint. */ highMeters: number;
    /** Native15 Rayleigh radiance contributions. */ rayleigh: number[];
    /** Native15 Mie radiance contributions. */ mie: number[];
};

/** Completed continuous N1 path integration and selected physical observations. */
type HorizonTransportReading = {
    /** Physical path length in meters. */ length: number;
    /** Native15 total radiance W m^-2 sr^-1 nm^-1. */ spectrum: number[];
    /** Rayleigh emission with combined extinction. */ rayleigh: number[];
    /** Mie emission with combined extinction. */ mie: number[];
    /** Distance-partitioned contributions; quadrature strata, not independently integrated bins. */ strata: HorizonTransportStratum[];
    /** Selected physical observations along the path. */ samples: HorizonTransportSample[];
    /** Relative partition additivity residual. */ maximumAdditiveRelative: number;
};

/** Physical observations at one Simpson node; optical depths are dimensionless. */
type HorizonTransportSample = {
    /** Distance from the observer, meters. */ distanceMeters: number;
    /** Local altitude above the model surface, meters. */ altitudeMeters: number;
    /** Rayleigh/Mie density columns toward the source, meters. */ sourceColumns: number[];
    /** Rayleigh/Mie density columns toward the observer, meters. */ viewColumns: number[];
    /** Native15 source-path optical depths. */ sourceTau: number[];
    /** Native15 view-path optical depths. */ viewTau: number[];
    /** Native15 source-path transmissions. */ sourceTransmittance: number[];
    /** Native15 view-path transmissions. */ viewTransmittance: number[];
    /** Cosine between sky-view direction and direction toward the source. */ cosine: number;
    /** Rayleigh phase, sr^-1. */ phaseRayleigh: number;
    /** Cornette-Shanks Mie phase, sr^-1. */ phaseMie: number;
    /** Irradiance dilution relative to the source's reference distance. */ dilution: number;
    /** Rayleigh density relative to its sea-level value. */ densityRayleigh: number;
    /** Mie density relative to its sea-level value. */ densityMie: number;
};

/** Positive Gauss-Legendre column rule over the unit interval. */
type HorizonGaussRule = {
    /** Interior abscissae in [0,1]. */ nodes: number[];
    /** Integration weights, summing to one. */ weights: number[];
};

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
