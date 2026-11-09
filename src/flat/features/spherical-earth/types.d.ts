/**
 * One view's scene preparation and accepted observation.
 */
type SphericalEarthSceneState = {
	/**
	 * Per-view synchronization notification and workspace availability.
	 */
	sync: CameraSyncViewState;
	/**
	 * Accepted per-view shader presentation and effective Sun multipliers.
	 */
	shader: SphericalEarthShaderOptions;
	/**
	 * Scoped accepted camera values and pending interaction state.
	 */
	camera: SphericalEarthCameraState;
	/**
	 * Visible scene lifecycle phase.
	 */
	status: 'waiting' | 'preparing' | 'ready' | 'error';
	/**
	 * Latest requested exact observation, absent until shared location/time exist.
	 */
	observation: GeometryObservation | null;
	/**
	 * Exact observation of the coherent frame currently displayed.
	 */
	renderedObservation: GeometryObservation | null;
	/**
	 * Concrete preparation or renderer failure, presented as text.
	 */
	error: string | null;
};

/**
 * Feature view notification for an exact workspace view.
 */
type SphericalEarthStateChange = {viewId: string; state: SphericalEarthSceneState};

/**
 * Session-owned preparation state without the model-owned camera and shader projections.
 */
type SphericalEarthSceneLifecycleState = Omit<SphericalEarthSceneState, 'camera' | 'shader' | 'sync'>;

/**
 * Prepared values and owning presentation capability for the page.
 */
type SphericalEarthPageProps = {
	/**
	 * Exact workspace view identity.
	 */
	viewId: string;
	/**
	 * Owning view; all renderer intents pass through this capability.
	 */
	sceneView: SphericalEarthViewService;
	/**
	 * Initial scene presentation.
	 */
	initialState: SphericalEarthSceneState;
};

/**
 * Feature-private renderer lifecycle used by the session.
 */
interface SphericalEarthRuntimeCapability {
	/**
	 * Call this method to determine whether preparation can retry while retaining its displayed frame.
	 *
	 * @returns - Whether graphics ownership remains valid.
	 */
	canRetryRetained(): boolean;

	/**
	 * Call this method to apply model-owned shader choices and redraw retained resources.
	 */
	refreshShaderOptions(): void;

	/**
	 * Call this method to prepare and publish an exact observation on the canvas.
	 *
	 * @param observation - Exact shared location and instant.
	 * @param signal - Cancellation belonging to this session update.
	 * @param observerHeight - Requested physical elevation; defaults to the accepted model value.
	 * @returns - Completion after coherent publication.
	 */
	prepare(
		observation: GeometryObservation,
		signal: AbortSignal,
		observerHeight?: Distance,
	): Promise<SphericalEarthFramePublication>;

	/**
	 * Call this method to change framing on the retained camera without reconstructing the cache.
	 *
	 * @param degrees - Accepted vertical perspective FOV.
	 */
	setFieldOfView(degrees: number): void;

	/**
	 * Call this method to apply a received orientation without publishing a user-change callback.
	 *
	 * @param orientation - Requested local quaternion.
	 */
	setOrientation(orientation: CameraSyncOrientation): void;

	/**
	 * Call this method to aim the retained camera at the displayed source.
	 */
	centerOnSun(): void;

	/**
	 * Call this method to aim at the displayed catalog position of Polaris.
	 */
	centerOnPolaris(): void;

	/**
	 * Call this method to cancel rendering and release owned GPU resources after pending work ends.
	 *
	 * @returns - Completion of renderer release.
	 */
	dispose(): Promise<void>;
}

/**
 * Internal renderer factory; the session owns the resulting instance.
 */
type SphericalEarthRuntimeFactory = (
	canvas: HTMLCanvasElement,
	model: SphericalEarthModelService,
	viewId: string,
	onFailure: (error: Error) => void,
	onCameraChange: (change: SphericalEarthCameraChange) => void,
) => SphericalEarthRuntimeCapability;

/**
 * A completed frame publication, with cleanup failures separated from installation failure.
 */
type SphericalEarthFramePublication = Readonly<{
	/**
	 * Retirement failures after the new frame was successfully displayed and committed.
	 */
	retirementErrors: readonly unknown[];
}>;

/**
 * Registered feature model capability, owning independent camera records.
 */
type SphericalEarthModelService = import('./models/spherical-earth-model.js').SphericalEarthModel;

/**
 * Production scene-display color model selected for this feature.
 */
type SphericalEarthColorModel =
	import('../../../algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js').ColorResetAltitudeHalfV1ColorDisplayModel;

/**
 * Renderer diagnostics used to reject a failed shader frame before publication.
 */
type SphericalEarthShaderDiagnostics = {runtime?: {frameCount: number; renderErrorCount: number}};

/**
 * Actual Three program compilation outcome when diagnostics are available.
 */
type SphericalEarthProgramDiagnostics = {diagnostics?: {runnable?: boolean}};

/**
 * Renderer-produced unit quaternion in Three scene coordinates.
 */
type SphericalEarthCameraOrientation = [number, number, number, number];

/**
 * Supported per-view sky composition choices.
 * - **"full"** - Physical atmosphere and Sun presentation.
 * - **"no-atmosphere"** - Keep composition and the solar disc, bypass atmospheric view transport.
 * - **"shader-off"** - Render the underlying Three scene directly.
 */
type SphericalEarthSkyRenderMode = 'full' | 'no-atmosphere' | 'shader-off';

/**
 * Derived presentation settings for one view, independent of physical cache inputs.
 */
type SphericalEarthShaderOptions = {
	/**
	 * Canonical selected presentation mode.
	 */
	mode: SphericalEarthSkyRenderMode;
	/**
	 * Whether atmospheric view transport is enabled.
	 */
	atmosphereEnabled: boolean;
	/**
	 * Effective Sun illumination fraction, zero when atmosphere is disabled.
	 */
	sunIlluminationScale: number;
	/**
	 * Visible solar-disc brightness fraction, retained at one (100%).
	 */
	sunDiscBrightnessScale: number;
	/**
	 * Neutral fill: zero in Full, one in Shader off, and 0.03 in No atmosphere before display-gain compensation.
	 */
	ambientLightIntensity: number;
};

/**
 * Localized native-select choice used by the feature controls.
 */
type SphericalEarthControlOption = {
	/**
	 * Stable numeric camera value or supported shader mode.
	 */
	value: number | SphericalEarthSkyRenderMode;
	/**
	 * Localization phrase key for the choice.
	 */
	label: string;
};

/**
 * Accepted per-view camera values, independent of shared time/location.
 */
type SphericalEarthCameraValues = {
	/**
	 * Whether this view shows its directional ribbon.
	 */
	compassVisible: boolean;

	/**
	 * Actual accepted elevation in meters.
	 */
	observerHeightMeters: number;
	/**
	 * Vertical perspective angle in degrees.
	 */
	fieldOfViewDegrees: number;
	/**
	 * Accepted unit quaternion in scene coordinates.
	 */
	orientation: SphericalEarthCameraOrientation;
};

/**
 * Camera projection including transient pointer-lock and pending elevation state.
 */
type SphericalEarthCameraState = SphericalEarthCameraValues & {
	/**
	 * Current horizontal camera heading, clockwise degrees from north.
	 */
	headingDegrees: number;

	/**
	 * Requested elevation while a previous complete frame is still displayed.
	 */
	pendingHeightMeters: number | null;
	/**
	 * Native pointer-lock presentation status.
	 */
	lookStatus: 'idle' | 'locked' | 'error';
};

/**
 * Adapter-reported orientation and native input status.
 */
type SphericalEarthCameraChange = {
	/**
	 * Accepted renderer camera orientation.
	 */
	orientation: SphericalEarthCameraOrientation;
	/**
	 * Native pointer-lock status for this surface.
	 */
	lookStatus: SphericalEarthCameraState['lookStatus'];
};

/**
 * Mount properties for the feature's scoped camera toolbar contribution.
 */
type SphericalEarthViewToolsProps = SphericalEarthPageProps & {
	/**
	 * Whether controls are presented in their configuration section.
	 */
	panel?: boolean;
};

/**
 * Retained Three perspective camera used by the private input adapter.
 */
type SphericalEarthThreeCamera = import('three').PerspectiveCamera;

/**
 * Source-owned Three light used by the presentation adapter.
 */
type SphericalEarthThreeLight = import('three').Light;

/**
 * Owning Three renderer used by the presentation adapter.
 */
type SphericalEarthThreeRenderer = import('three').WebGLRenderer;

/**
 * Independent physical scene facts, kept separate from retained display resources.
 */
type SphericalEarthSceneFacts = {
	geometry: SphericalEarthPhysicalGeometry;
	observation: GeometryObservation;
	height: Distance;
	direction: UnitVector3;
	zenith: number;
};

/**
 * Engine geometry owned by this spherical view.
 */
type SphericalEarthPhysicalGeometry =
	import('../../../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js').SphericalEarthGeometry;

/**
 * Live source and shared-cache attachment.
 */
type SphericalEarthSun =
	import('../../../algorithm32/implementation/distant-sun/DistantSunLightSource.js').DistantSunLightSource;

/**
 * Retained renderer resources, with physical lights distinct from presentation fill.
 */
type SphericalEarthPreparedScene = {
	/**
	 * Fixed ground bounds reused when updating live scene-depth encoding.
	 */
	depthEndpoints: ScenePosition[];

	algorithm: import('../../../algorithm32/implementation/algorithm32/Algorithm32.js').Algorithm32;
	geometry: SphericalEarthPhysicalGeometry;
	source: SphericalEarthSun;
	scene: import('three').Scene;
	camera: import('three').PerspectiveCamera;
	color: SphericalEarthColorModel;
	composer: import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	bindings: Algorithm32BindingValues;
	direct: import('three').DirectionalLight;
	diffuse: import('three').HemisphereLight;
	ambientLight: import('three').AmbientLight;
	lighting: {lights: import('three').Light[]};
	sunLightIntensities: number[];
	handle: ShaderHandle | null;
};
