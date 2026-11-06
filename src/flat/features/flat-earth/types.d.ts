/**
 * Public presentation capability owned by the Flat Earth view.
 */
type FlatEarthViewService = import('./views/flat-earth.js').FlatEarthView;

/**
 * Public controller capability for scoped Flat Earth sessions.
 */
type FlatEarthControllerService = import('./controller.js').FlatEarthController;

/**
 * Feature-owned graphics context and canonical construction lifetime.
 */
type FlatEarthGraphicsResources = import('./runtime/FlatEarthGraphics.js').FlatEarthGraphics;

/**
 * Feature-internal startup resource constructor.
 */
type FlatEarthGraphicsFactory = () => FlatEarthGraphicsResources;

/**
 * Surface reserved for one view, with startup ownership transferred when its runtime attaches.
 */
type FlatEarthSurface = {
	/**
	 * Exact canvas retaining its original WebGL context.
	 */
	canvas: HTMLCanvasElement;
	/**
	 * Unclaimed startup resource, or null once the runtime owns disposal.
	 */
	graphics: FlatEarthGraphicsResources | null;
};

/**
 * One view's scene preparation and accepted observation.
 */
type FlatEarthSceneState = {
	/**
	 * Scoped accepted camera values and pending interaction state.
	 */
	camera: FlatEarthCameraState;
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
type FlatEarthStateChange = {viewId: string; state: FlatEarthSceneState};

/**
 * Prepared values and owning presentation capability for the page.
 */
type FlatEarthPageProps = {
	/**
	 * Exact workspace view identity.
	 */
	viewId: string;
	/**
	 * Owning view; all renderer intents pass through this capability.
	 */
	sceneView: FlatEarthViewService;
	/**
	 * Initial scene presentation.
	 */
	initialState: FlatEarthSceneState;
};

/**
 * Feature-private renderer lifecycle used by the session.
 */
interface FlatEarthRuntimeCapability {
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
	): Promise<FlatEarthFramePublication>;

	/**
	 * Call this method to change framing on the retained camera without reconstructing the cache.
	 *
	 * @param degrees - Accepted vertical perspective FOV.
	 */
	setFieldOfView(degrees: number): void;

	/**
	 * Call this method to aim the retained camera at the displayed source.
	 */
	centerOnSun(): void;

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
type FlatEarthRuntimeFactory = (
	canvas: HTMLCanvasElement,
	model: FlatEarthModelService,
	viewId: string,
	onFailure: (error: Error) => void,
	onCameraChange: (change: FlatEarthCameraChange) => void,
) => FlatEarthRuntimeCapability;

/**
 * Complete prepared engine resources for one coherent frame.
 */
type FlatEarthPreparedScene = {
	/**
	 * Canonical construction/backend identity admitted by the engine owner.
	 */
	constructionIdentity: string;
	/**
	 * Number of prepared/displayed packet borrows retaining this scene.
	 */
	references: number;
	/**
	 * Exact currently installed live profile.
	 */
	profile: LocalSunCompactConstructionProfile;
	/**
	 * Stable non-owning shader binding over compatible per-packet leases.
	 */
	cacheBinding: import('../../../algorithm32/implementation/local-sun/cache/frames/LocalSunRuntimeCacheBinding.js').LocalSunRuntimeCacheBinding;
	/**
	 * Source-owned retained endpoint lighting.
	 */
	lighting: LightSourceThreeLightingObjects;
	/**
	 * Shader handle retained across ordinary observation updates.
	 */
	handle: ShaderHandle | null;
	/**
	 * Frame-private camera retaining the current view pose.
	 */
	camera: import('three').PerspectiveCamera;
	/**
	 * Frame-specific production display model.
	 */
	color: FlatEarthColorModel;
	/**
	 * Production facade and owned cache/shader handles.
	 */
	algorithm: import('../../../algorithm32/implementation/algorithm32/Algorithm32.js').Algorithm32;
	/**
	 * Isolated scene containing geometry-owned ground and source lights.
	 */
	scene: import('three').Scene;
	/**
	 * Frame-private composer and color target.
	 */
	composer: import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	/**
	 * Common camera and display bindings.
	 */
	bindings: Algorithm32BindingValues;
};

/**
 * A completed frame publication, with cleanup failures separated from installation failure.
 */
type FlatEarthFramePublication = Readonly<{
	/**
	 * Retirement failures after the new frame was successfully displayed and committed.
	 */
	retirementErrors: readonly unknown[];
}>;

/**
 * Registered feature model capability, owning independent camera records.
 */
type FlatEarthModelService = import('./models/FlatEarthModel.js').FlatEarthModel;

/**
 * Concrete physical geometry supplied by the production profile.
 */
type FlatEarthPhysicalGeometry =
	import('../../../algorithm32/implementation/flat-earth/FlatEarthGeometry.js').FlatEarthGeometry;

/**
 * Concrete finite source supplied by the production profile.
 */
type FlatEarthLocalSun =
	import('../../../algorithm32/implementation/local-sun/LocalSunLightSource.js').LocalSunLightSource;

/**
 * Production scene-display color model selected for this feature.
 */
type FlatEarthColorModel =
	import('../../../algorithm32/implementation/color-reset-altitude-half-v1/ColorResetAltitudeHalfV1ColorDisplayModel.js').ColorResetAltitudeHalfV1ColorDisplayModel;

/**
 * Renderer diagnostics used to reject a failed shader frame before publication.
 */
type FlatEarthShaderDiagnostics = {runtime?: {frameCount: number; renderErrorCount: number}};

/**
 * Actual Three program compilation outcome when diagnostics are available.
 */
type FlatEarthProgramDiagnostics = {diagnostics?: {runnable?: boolean}};

/**
 * Renderer-produced unit quaternion in Three scene coordinates.
 */
type FlatEarthCameraOrientation = [number, number, number, number];

/**
 * Accepted per-view camera values, independent of shared time/location.
 */
type FlatEarthCameraValues = {
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
	orientation: FlatEarthCameraOrientation;
};

/**
 * Camera projection including transient pointer-lock and pending elevation state.
 */
type FlatEarthCameraState = FlatEarthCameraValues & {
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
type FlatEarthCameraChange = {
	/**
	 * Accepted renderer camera orientation.
	 */
	orientation: FlatEarthCameraOrientation;
	/**
	 * Native pointer-lock status for this surface.
	 */
	lookStatus: FlatEarthCameraState['lookStatus'];
};

/**
 * Mount properties for the feature's scoped camera toolbar contribution.
 */
type FlatEarthViewToolsProps = FlatEarthPageProps & {
	/**
	 * Whether controls are presented in their configuration section.
	 */
	panel?: boolean;
};

/**
 * Retained Three perspective camera used by the private input adapter.
 */
type FlatEarthThreeCamera = import('three').PerspectiveCamera;
