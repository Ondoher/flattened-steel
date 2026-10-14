/** Ordinary public geometry/source pairing.
 *
 * - **"spherical/distant"** - Spherical geometry with a distant Sun.
 * - **"flat/local"** - Flat geometry with a finite local Sun.
 */
type Flat32Pairing = 'spherical/distant' | 'flat/local';

/** Explicit compact candidate selection; omission retains the rectangular control.
 *
 * - **"compact-v9-native15"** - Qualified v9 compact physical family with native15 spectra.
 */
type Flat32LocalSunCachePolicy = 'compact-v9-native15';

/** Application-owned action with no additional user input. */
type Flat32ControlAction = () => void;
/** Application-owned selection of one numbered location/time control. */
type Flat32ControlSelectionAction = (index: number) => void;
/** Application-owned signed delta in the control's hours or minutes. */
type Flat32ControlAdjustmentAction = (offset: number) => void;

/** Optional Flat32 lifecycle and performance hooks exposed by the browser host. */
interface Window {
	/** Release the installed browser application. */
	__flat32Cleanup?: () => void;
	/** Collected shader performance observations. */
	__flat32PerformanceSamples?: ShaderPerformanceSample[];
}

/** Exact supported display-response identities.
 *
 * - **"basic-bruneton"** - Unchanged physical qualification display control.
 * - **"color-reset-slope-078-p9"** - Existing production-default response.
 * - **"color-reset-slope-078-p2"** - Separately selectable monotonic-brightness successor.
 * - **"ferwerda-control"** - Explicit reference adaptation control.
 */
type Flat32ColorModelId =
	'basic-bruneton' | 'color-reset-slope-078-p9' | 'color-reset-slope-078-p2' | 'ferwerda-control';

/** Display responses whose fixed constants require only a model identity.
 *
 * - **"basic-bruneton"** - Unchanged Bruneton display control.
 * - **"color-reset-slope-078-p9"** - Existing production-default response.
 * - **"color-reset-slope-078-p2"** - Selectable monotonic successor.
 */
type Flat32FixedColorModelId = 'basic-bruneton' | 'color-reset-slope-078-p9' | 'color-reset-slope-078-p2';

/** Explicit adaptation control identity.
 *
 * - **"ferwerda-control"** - Reference adaptation configuration.
 */
type Flat32AdaptationColorModelId = 'ferwerda-control';

/** Caller-owned exact display selection; omission at application ingress retains p9. */
type Flat32ColorDisplayModelConfiguration =
	| Readonly<{
			/** Exact fixed-response identity. */
			readonly model: Flat32FixedColorModelId;
	  }>
	| Readonly<{
			/** Explicit adaptation-control identity. */
			readonly model: Flat32AdaptationColorModelId;
			/** Nonnegative reference adaptation luminance, in cd m^-2. */
			readonly adaptationLuminanceCdPerSquareMeter: number;
	  }>;

/** Supported bright-star catalog selections.
 *
 * - **"brightest-500"** - The 500 brightest catalog stars.
 * - **"brightest-2000"** - The extended 2000-star catalog. */
type Flat32StellarCatalogId = 'brightest-500' | 'brightest-2000';
/** Supported source-linear stellar presentation filters.
 *
 * - **"human-mesopic-luminance-v1"** - Mesopic luminance response.
 * - **"human-low-light-chroma-v1"** - Low-light chroma response. */
type Flat32PresentationFilterId = 'human-mesopic-luminance-v1' | 'human-low-light-chroma-v1';
/** Caller-owned stellar filter selection and its response parameters.
 *
 * - **human-mesopic-luminance-v1** - Mesopic luminance response with a rod-contribution bound.
 * - **human-low-light-chroma-v1** - Low-light chroma response with a chroma-retention bound. */
type Flat32PresentationFilterConfiguration =
	| Readonly<{
			/** Exact selected presentation filter. */
			readonly id: 'human-mesopic-luminance-v1';
			/** Apply the response in source-linear space. */
			readonly stage: 'source-linear';
			/** Apply the response to stellar sources. */
			readonly target: 'stellar';
			/** Whether this filter participates. */
			readonly enabled: boolean;
			/** Filter-specific response bounds. */
			readonly parameters: Readonly<{
				/** Maximum rod contribution to mesopic luminance. */ readonly maximumRodContribution: number;
			}>;
	  }>
	| Readonly<{
			/** Exact selected presentation filter. */
			readonly id: 'human-low-light-chroma-v1';
			/** Apply the response in source-linear space. */
			readonly stage: 'source-linear';
			/** Apply the response to stellar sources. */
			readonly target: 'stellar';
			/** Whether this filter participates. */
			readonly enabled: boolean;
			/** Filter-specific response bounds. */
			readonly parameters: Readonly<{
				/** Maximum retained chroma in low-light response. */ readonly maximumChromaRetention: number;
			}>;
	  }>;

/** Normalized display, celestial and presentation selections shared by scene consumers. */
type Flat32ProductionSelections = {
	/** Selected scene-linear display response and its physical adaptation controls. */
	readonly colorDisplayModelConfiguration: Flat32ColorDisplayModelConfiguration;
	/** Scene-linear storage required by the selected display response; p2 uses float32. */
	readonly sceneColorPrecision: Flat32SceneColorPrecision;
	/** Whether visible celestial-source rendering is selected. */
	readonly celestialSourcesEnabled: boolean;
	/** Exact selected bright-star catalog. */
	readonly stellarCatalog: Flat32StellarCatalogId;
	/** Ordered source-presentation filter selections. */
	readonly presentationFilters: readonly Flat32PresentationFilterConfiguration[];
	/** Identity of the selected ordered filter configuration. */
	readonly presentationFilterConfigurationIdentity: string;
};

/** Caller-owned initial scene, physical-cache and presentation selections. */
type Flat32ApplicationConfiguration = {
	/** Explicit compact candidate; omission retains the rectangular control. */
	readonly localSunCachePolicy?: Flat32LocalSunCachePolicy;
	/** Initial camera vertical field of view in degrees. */
	readonly cameraFieldOfViewDegrees?: number;
	/** Initial predefined local-Sun observation index. */
	readonly initialFlatTimeIndex?: number;
	/** Initial atmospheric geometry/source pairing. */
	readonly initialModeKind?: 'spherical-distant' | 'flat-local';
	/** Explicit order for both modes; omission uses distant N4 and compact local N1. */
	readonly maximumScatteringOrder?: SupportedCacheScatteringOrder;
	/** Include the fixed matte review objects. */
	readonly reviewObjectsEnabled?: boolean;
	/** Include visible celestial sources. */
	readonly celestialSourcesEnabled?: boolean;
	/** Selected display response and adaptation controls. */
	readonly colorDisplayModelConfiguration?: Flat32ColorDisplayModelConfiguration;
	/** Selected bright-star catalog. */
	readonly stellarCatalog?: Flat32StellarCatalogId;
	/** Authenticated extended stellar catalog definition. */
	readonly brightest2000StellarCatalogDefinition?: Brightest2000StellarCatalogDefinition;
	/** Measured spectral weights for low-light luminance. */
	readonly scotopicLuminanceWeights?: ArrayLike<number>;
	/** Ordered source-linear stellar filter selections. */
	readonly presentationFilters?: readonly Flat32PresentationFilterConfiguration[];
	/** Initial unit camera direction in scene coordinates. */
	readonly cameraDirectionScene?: readonly [number, number, number];
	/** Receive shader performance observations. */
	readonly performanceCallback?: ShaderPerformanceCallback;
	/** Enable atmosphere composition initially. */
	readonly atmosphereShaderEnabled?: boolean;
	/** Resolve the requested solar angle with optional caller cancellation. */
	readonly resolveDistantSunSceneCacheAsset?: (
		solarZenithDegrees: number,
		request?: Flat32DistantSunCacheResolutionRequest,
	) => Flat32DistantSunCacheResolution | Promise<Flat32DistantSunCacheResolution>;
};

/** Render one complete installed scene frame. */
type Flat32RenderOperation = () => void;
/** Renderer-resource owner participating in context loss and restoration. */
interface Flat32ContextLifecycleParticipant {
	/** Invalidate renderer-owned handles synchronously on context loss. */
	handleContextLoss(): void;
	/** Recreate renderer-owned resources before frame rendering resumes. */
	handleContextRestoration(): void | Promise<void>;
}
/** Remove a registered renderer-resource owner from future context cycles. */
type Flat32ContextLifecycleRemoval = () => void;
/** Receive a human-readable atmosphere preparation or rendering failure. */
type Flat32AtmosphereFailureHandler = (message: string) => void;
/** Receive changes to pointer-lock camera control. */
type Flat32PointerLookChangeHandler = (locked: boolean) => void;
/** Supported atmospheric geometry and source pairings.
 *
 * - **"spherical-distant"** - Spherical geometry with a distant source.
 * - **"flat-local"** - Flat geometry with a finite local source. */
type Flat32ModeKind = 'spherical-distant' | 'flat-local';

/** Caller-owned physical and presentation selections for a flat/local mode. */
type Flat32LocalModeConfiguration = Readonly<{
	/** Explicit candidate activation; omission retains the existing control. */ localSunCachePolicy?: Flat32LocalSunCachePolicy;
	/** Authenticated extended catalog for selected stellar consumers. */ brightest2000StellarCatalogDefinition?: Brightest2000StellarCatalogDefinition;
	/** Measured spectral weights for shared low-light filters. */ scotopicLuminanceWeights?: ArrayLike<number>;
	/** Physical length represented by one scene unit. */ sceneScale: SceneScale;
	/** Accepted geographic receiver and exact instant. */ observation: GeometryObservation;
	/** Qualified number of scattering orders. */ maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Include visible celestial sources. */ celestialSourcesEnabled?: boolean;
	/** Independently selected display response. */ colorDisplayModelConfiguration?: Flat32ColorDisplayModelConfiguration;
	/** Selected stellar catalog. */ stellarCatalog?: Flat32StellarCatalogId;
	/** Ordered presentation filter selections. */ presentationFilters?: readonly Flat32PresentationFilterConfiguration[];
}>;

/** Independently owned atmosphere mode used by transactional runtime installation. */
interface Flat32Mode {
	/** Production facade owned by this mode. */ readonly algorithm32: Algorithm32Facade;
	/** Physical geometry owned by this mode. */ readonly geometry: GeometryModel;
	/** Scene-to-physical scale. */ readonly sceneScale: SceneScale;
	/** Return the configured domain and pairing facts. */ describe(): Flat32ModeSummary;
	/** Release this mode's resources once. */ dispose(): void;
}

/** Configured domains of a supported atmosphere mode. */
type Flat32ModeSummary = Omit<SphericalDistantModeSummary, 'pairing' | 'distantSunCacheState'> & {
	/** Physical pairing. */ pairing: Flat32Pairing;
	/** Distant source cache state when this is a spherical mode. */ distantSunCacheState?: Flat32DistantSunCacheState;
	/** Local observer dome selection when this is a flat mode. */ observerDomeEnabled?: boolean;
};

/** Isolated composer resources owned by one preparation transaction. */
type Flat32AtmosphereComposerResources = Readonly<{
	/** Composer that borrows the configured scene. */ composer: import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	/** Render target owned by the composer transaction. */ renderTarget: import('three').WebGLRenderTarget;
	/** Scene input pass installed in the composer. */ renderPass: import('three/examples/jsm/postprocessing/RenderPass.js').RenderPass;
}>;

/** Independently implementable scene and renderer coordination required by atmosphere installation. */
interface Flat32SceneRuntimeCapability {
	/** Scene receiving atmosphere integration. */ readonly scene: import('three').Scene;
	/** Output canvas and diagnostic data. */ readonly canvas: HTMLCanvasElement;
	/** Current perspective camera. */ readonly camera: import('three').PerspectiveCamera;
	/** Renderer borrowed for installation and rendering. */ readonly renderer: import('three').WebGLRenderer;
	/** Current unit-bearing output extent. */ readonly viewportSize: PixelSize;
	/** Register context loss and restoration ownership; return its remover. */ addContextLifecycleParticipant(
		participant: Flat32ContextLifecycleParticipant,
	): Flat32ContextLifecycleRemoval;
	/** Publish a complete prepared state between frames. */ atFrameBoundary(
		operation: () => void,
		signal: AbortSignal,
	): Promise<void>;
	/** Request new matching shadow maps. */ refreshShadowMaps(): void;
	/** Borrow the ordinary atmosphere composer. */ prepareAtmosphereComposer(): import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	/** Create an independently owned preparation composer. */ createAtmosphereComposer(): Flat32AtmosphereComposerResources;
	/** Install the completed atmosphere frame operation. */ installRenderOperation(
		operation: Flat32RenderOperation,
	): void;
	/** Restore the direct lit scene. */ restoreDirectRendering(): void;
}

/** Independently implementable atmosphere runtime publication and teardown. */
interface Flat32AlgorithmRuntimeCapability {
	/** Stage a complete explicit compact frame without publication. */ prepareLocalFrame(
		request: LocalSunFrameRequest,
		signal?: AbortSignal,
	): Promise<PreparedLocalSunFrame>;
	/** Publish one complete compact packet at the application frame boundary. */ publishPreparedLocalFrame(
		frame: PreparedLocalSunFrame,
		signal: AbortSignal,
	): Promise<LocalSunFramePublication>;
	/** Await backend teardown after pending stages and final valid borrowers release. */ whenLocalFrameResourcesReleased(): Promise<void>;
	/** Prepare and preflight the isolated candidate. */ setup(): Promise<Flat32AtmosphereSummary>;
	/** Publish the complete candidate. */ publish(): void;
	/** Select composition or direct rendering. */ setAtmosphereEnabled(enabled: boolean): void;
	/** Report whether stable shared-cache updates are supported. */ canUpdateSharedScene(): boolean;
	/** Prepare and publish one matching shared scene. */ updateSharedScene(
		state: Flat32ApplicationState,
		request: Flat32SharedSceneUpdateRequest,
	): Promise<Flat32AtmosphereSummary>;
	/** Release resources and optionally restore direct rendering. */ dispose(
		request?: Flat32RuntimeDisposalRequest,
	): void;
}

/** Teardown ownership selected by a runtime transaction. */
type Flat32RuntimeDisposalRequest = Readonly<{
	/** Restore direct rendering unless a replacement has already published. */ restoreRendering?: boolean;
}>;

/** Physical observation and observer geometry for a distant scene. */
type Flat32DistantSunSceneConfiguration = Readonly<{
	/** Accepted time and location. */ observation: GeometryObservation;
	/** Physical height above spherical ground. */ observerHeight: Distance;
	/** Model-space local vertical. */ observerUpDirection: UnitVector3;
}>;

/** Caller-owned endpoint scene selection. */
type Flat32EndpointSceneConfiguration = Readonly<{
	/** Include the fixed matte review objects. */ reviewObjectsEnabled?: boolean;
}>;

/** Caller-owned spherical mode selections; geometry remains independently supplied. */
type Flat32SphericalDistantModeConfiguration<Geometry extends GeometryModel = GeometryModel> = Readonly<{
	/** Coherent accepted observation and geometry. */ sceneState: Flat32DistantSunSceneState<Geometry>;
	/** Physical length represented by one scene unit. */ sceneScale: SceneScale;
	/** Physical Sun angular radius. */ sourceAngularRadius: Angle;
	/** Qualified number of scattering orders. */ maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Optional authenticated dense scene asset. */ sceneCacheAsset?: DistantSunSceneCacheAssetSelection;
	/** Optional authenticated shared-cache runtime selection. */ sharedCache?: DistantSunSharedCacheSelection;
	/** Explicit distant cache state. */ distantSunCacheState?: Flat32DistantSunCacheState;
	/** Include Sun and stellar presentation. */ celestialSourcesEnabled?: boolean;
	/** Separately selected display response. */ colorDisplayModelConfiguration?: Flat32ColorDisplayModelConfiguration;
	/** Selected stellar catalog. */ stellarCatalog?: Flat32StellarCatalogId;
	/** Authenticated bright-star catalog definition. */ brightest2000StellarCatalogDefinition?: Brightest2000StellarCatalogDefinition;
	/** Selected presentation filters. */ presentationFilters?: readonly Flat32PresentationFilterConfiguration[];
	/** Optional measured low-light weights. */ scotopicLuminanceWeights?: ArrayLike<number>;
}>;

/** Configure one isolated Algorithm32 runtime candidate. */
type Flat32AlgorithmRuntimeConfiguration = {
	/** Supply the scene owner. */
	sceneRuntime: Flat32SceneRuntimeCapability;
	/** Supply ordinary endpoint-scene content. */
	endpointScene: Flat32EndpointLighting;
	/** Supply the supported atmospheric mode. */
	mode: Flat32Mode;
	/** Receive runtime failures. */
	onFailure: Flat32AtmosphereFailureHandler;
	/** Supply an isolated composer. */
	composer: import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	/** Supply the isolated composer's render target. */
	composerRenderTarget: import('three').WebGLRenderTarget;
	/** Defer installation until the mode transaction publishes. */
	deferPublication: true;
	/** Select atmosphere composition or the direct lit scene. */
	atmosphereEnabled?: boolean;
};

/** Configure transactional supported-mode ownership. */
type Flat32ModeControllerConfiguration = {
	/** Select atmosphere composition or the direct lit scene. */
	atmosphereEnabled?: boolean;
	/** Create the requested supported mode. */
	createMode: (
		kind: Flat32ModeKind,
		state: Flat32ApplicationState,
		request: Readonly<{readonly signal: AbortSignal}>,
	) => Flat32Mode | Promise<Flat32Mode>;
	/** Optionally create an observable runtime boundary for focused tests. */
	createRuntime?: (configuration: Flat32AlgorithmRuntimeConfiguration) => Flat32AlgorithmRuntimeCapability;
	/** Supply ordinary endpoint-scene content. */
	endpointScene: Flat32EndpointLighting;
	/** Receive scene preparation before candidate preflight. */
	onPreparing: (kind: Flat32ModeKind, mode: Flat32Mode) => void;
	/** Restore the last published scene after candidate failure. */
	onReverted: (kind: Flat32ModeKind, mode: Flat32Mode) => void;
	/** Receive runtime failures. */
	onFailure: Flat32AtmosphereFailureHandler;
	/** Receive a successfully published mode and state. */
	onPublished: (kind: Flat32ModeKind, mode: Flat32Mode, state: Flat32ApplicationState) => void;
	/** Supply the Three scene and isolated-composer owner. */
	sceneRuntime: Flat32SceneRuntimeCapability;
};

/** Selected location and time values delivered to scene-mode consumers. */
type Flat32LocationTimeState = {
	/** Index of the selected predefined geographic location. */ locationIndex: number;
	/** Index of the selected local-Sun observation. */ flatTimeIndex: number;
	/** Index of the selected distant-Sun observation. */ globeTimeIndex: number;
	/** Distant-Sun time offset in hours. */ globeHourOffset: number;
	/** Human-readable selected location label. */ locationLabel: string;
	/** Human-readable selected observation-time label. */ timeLabel: string;
	/** `flat` selects local-Sun time; `globe` selects distant-Sun time. */ timeBasis: 'flat' | 'globe';
	/** Exact geographic location and instant for physical scene placement. */ observation: GeometryObservation;
};

/** Location/time state paired with the selected atmospheric scene mode. */
type Flat32ApplicationState = Flat32LocationTimeState & {
	/** Exact selected atmospheric geometry/source pairing. */ modeKind: Flat32ModeKind;
};

/** Describe one source-derived orthographic shadow camera. */
type Flat32ShadowCameraDefinition = {
	/** Store the lower camera bound. */
	bottom: number;
	/** Store the far camera bound. */
	far: number;
	/** Store the left camera bound. */
	left: number;
	/** Store the near camera bound. */
	near: number;
	/** Store the right camera bound. */
	right: number;
	/** Store the upper camera bound. */
	top: number;
};

/** Describe one fixed matte review object. */
type Flat32ReviewObjectDefinition = {
	/** Store the material color. */
	color: number;
	/** Store the stable object name. */
	name: string;
	/** Store the scene-space object position. */
	position: [number, number, number];
	/** Store the scene-space Y rotation. */
	rotationY: number;
	/** Store the object dimensions. */
	size: [number, number, number];
	/** Store the source-derived shadow camera. */
	shadowCamera: Flat32ShadowCameraDefinition;
	/** Store the light target position. */
	shadowFocus: [number, number, number];
	/** Store the source-light distance. */
	sourceLightDistance: number;
};

/** Describe one completed Algorithm32 preflight frame. */
type Flat32AtmospherePreflight = {
	/** Store the shader/runtime diagnostic snapshot. */
	diagnostics: Flat32ShaderDiagnostics;
	/** Store the composed output pixel. */
	outputPixel: readonly [number, number, number, number];
	/** Store the captured scene-input pixel. */
	sceneInputPixel: readonly [number, number, number, number];
};

/** Describe runtime diagnostic facts required for publication. */
type Flat32ShaderDiagnostics = {
	/** Store shader installation state. */
	status?: string;
	/** Store per-frame runtime diagnostics. */
	runtime?: Flat32ShaderRuntimeDiagnostics;
};

/** Describe the runtime facts checked after a composed frame. */
type Flat32ShaderRuntimeDiagnostics = {
	/** Observed complete celestial generation state, when the runtime owns that participant. */
	celestialGeneration?: Flat32CelestialGenerationDiagnostics | null;
	/** Observed stellar pass generation state, when present. */
	stellarGeneration?: Flat32CelestialPassDiagnostics | null;
	/** Store the completed frame count. */
	frameCount?: number;
	/** Store the number of runtime render failures. */
	renderErrorCount?: number;
	/** Store the most recent runtime failure when present. */
	lastRenderError?: string | null;
};

/** Consumer-visible projection of one completed Sun or stellar generation. */
type Flat32CelestialPassCompletion = Pick<CelestialSunTileGeneration, 'completion'>;

/** Consumer-visible publication projection; generation resources remain owned by the engine. */
type Flat32CelestialPassPublication = Readonly<{
	/** Completed generation marker, or unavailable before publication. */ active?: Flat32CelestialPassCompletion | null;
}>;

/** Observed pass facts used only for application diagnostics, never numerical authority. */
type Flat32CelestialPassDiagnostics = Readonly<{
	/** Provider-reported lifecycle state. */ status: string;
	/** Number of completed generations. */ generationCount: number;
	/** Provider-owned publication observation, when available. */ publicationState?: Flat32CelestialPassPublication;
}>;

/** Observed Sun pass with its existing coverage policy identity. */
type Flat32SunPassDiagnostics = Flat32CelestialPassDiagnostics &
	Readonly<{
		/** Provider-reported coverage policy identity. */ policyIdentity: string;
	}>;

/** Observed aggregate celestial runtime facts used by the application diagnostic canvas. */
type Flat32CelestialGenerationDiagnostics = Readonly<{
	/** Provider-reported aggregate lifecycle state. */ status: string;
	/** Sun pass observation, when configured. */ sun?: Flat32SunPassDiagnostics | null;
}>;

/** Describe the Three program diagnostic consulted by preflight. */
type Flat32ProgramDiagnostic = {
	/** Store whether Three considers the program runnable. */
	runnable?: boolean;
};

/** Describe the minimum Three program state checked by Flat32. */
type Flat32ProgramInfo = {
	/** Store optional program diagnostics. */
	diagnostics?: Flat32ProgramDiagnostic;
};

/** Observed source lighting and shadow-map allocation for the endpoint scene. */
type LocalSunLightingSummary = {
	/** Number of installed source lights. */
	sourceLightCount: number;
	/** Number of ambient lights. */
	ambientLightCount: number;
	/** Number of directional lights. */
	directionalLightCount: number;
	/** Number of light target objects. */
	targetCount: number;
	/** Ambient light intensity. */
	ambientIntensity: number;
	/** Directional light intensity. */
	directionalIntensity: number;
	/** Whether matching shadow maps are installed. */
	shadowMapsInstalled: boolean;
	/** Number of installed shadow maps. */
	shadowMapCount: number;
	/** Shadow-map width in pixels. */
	shadowMapWidth: number;
	/** Shadow-map height in pixels. */
	shadowMapHeight: number;
	/** Number of shadow-map layers. */
	shadowLayerCount: number;
};

/** Endpoint lighting observations with shadow caster and receiver counts. */
type Flat32SceneSummary = LocalSunLightingSummary & {
	/** Number of scene objects casting shadows. */
	shadowCasterCount: number;
	/** Number of scene objects receiving shadows. */
	shadowReceiverCount: number;
};

/** Selected spherical/distant pairing and physical cache-domain dimensions. */
type SphericalDistantModeSummary = {
	/** Spherical geometry paired with a distant source. */
	pairing: 'spherical/distant';
	/** Whether the selected cache is lighted and ready or texture-free dark. */
	distantSunCacheState: Flat32DistantSunCacheState;
	/** Qualified maximum scattering order. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Number of cache positions. */
	positionCount: number;
	/** Number of incoming transport directions. */
	incomingDirectionCount: number;
	/** Number of outgoing radiance directions. */
	outgoingDirectionCount: number;
	/** Number of spectral channels. */
	spectralChannelCount: number;
};

/** Live spherical/distant scene placement and its cache-selection scalar. */
type Flat32DistantSunSceneState<Geometry extends GeometryModel = GeometryModel> = {
	/** Accepted geographic location and instant. */
	readonly observation: GeometryObservation;
	/** Geometry owning this scene placement. */
	readonly geometry: Geometry;
	/** Unit direction toward the source in model coordinates. */
	readonly directionToSourceModel: UnitVector3;
	/** Unit-bearing observer solar zenith angle. */
	readonly observerSolarZenith: Angle;
	/** Solar zenith angle in degrees for cache selection. */
	readonly solarZenithDegrees: number;
};

/** Caller-owned cancellation input for one distant-Sun cache resolution. */
type Flat32DistantSunCacheResolutionRequest = {
	/** Optional signal that cancels only this caller's unresolved continuation. */
	readonly signal?: AbortSignal;
};

/** Shared event capability inherited by every registered Flat32 application service. */
type EventBus = import('@polylith/core').EventBus;

/**
 * HTTP methods supported by the standard Flat32 JSON transport.
 *
 * - **"GET"** - Retrieve one JSON resource without a request body.
 * - **"POST"** - Create or invoke a resource with optional JSON feature data.
 * - **"PUT"** - Replace a resource with optional JSON feature data.
 * - **"PATCH"** - Partially update a resource with optional JSON feature data.
 * - **"DELETE"** - Delete a resource with optional JSON feature data.
 */
type Flat32IoMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** One feature request normalized by the standard Flat32 JSON transport. */
type Flat32IoJsonRequest = Readonly<{
	/** Supported HTTP method. */
	readonly method: Flat32IoMethod;
	/** Absolute or application-relative route owned by the feature caller. */
	readonly route: string | URL;
	/** Optional feature data serialized as one JSON request body. */
	readonly data?: unknown;
	/** Optional caller-owned cancellation signal. */
	readonly signal?: AbortSignal;
}>;

/**
 * Distant-Sun cache package representation selected during the rollout bridge.
 *
 * - **"algorithm32-distant-sun-dense-scene-v1"** - Current independently packaged complete dense scene.
 * - **"algorithm32-distant-sun-shared-block-v1"** - New shared spectral-block package set.
 */
type Flat32DistantSunCacheFormatId =
	'algorithm32-distant-sun-dense-scene-v1' | 'algorithm32-distant-sun-shared-block-v1';

/**
 * Non-ready result of resolving one distant-Sun cache selection.
 *
 * - **"dark"** - The requested angle is in the texture-free dark domain.
 * - **"unsupported"** - The requested angle is outside the catalog's supported lighted domain.
 */
type Flat32DistantSunCacheNonReadyStatus = 'dark' | 'unsupported';

/** Resolved distant-Sun cache selection. Shared dark results retain the authenticated shared asset; ready results identify the representative lighted angle and selected asset; dense non-ready results carry the requested angle without an asset. */
type Flat32DistantSunCacheResolution =
	| Readonly<{
			/** Exact resolution schema identity. */
			readonly schemaId: 'flat32-distant-sun-cache-resolution-v2';
			/** Selected cache package representation. */
			readonly cacheFormat: 'algorithm32-distant-sun-shared-block-v1';
			/** Whether this selection is ready, dark or unsupported. */
			readonly status: 'dark';
			/** Exact requested solar angle in degrees. */
			readonly requestedSolarZenithDegrees: number;
			/** Authenticated selected cache asset. */
			readonly asset: Flat32SharedCacheAssetSelection;
	  }>
	| Readonly<{
			/** Exact resolution schema identity. */
			readonly schemaId: 'flat32-distant-sun-cache-resolution-v2';
			/** Selected cache package representation. */
			readonly cacheFormat: 'algorithm32-distant-sun-dense-scene-v1';
			/** Whether this selection is ready, dark or unsupported. */
			readonly status: 'ready';
			/** Exact requested solar angle in degrees. */
			readonly requestedSolarZenithDegrees: number;
			/** Representative angle of the resolved lighted cache. */
			readonly representativeSolarZenithDegrees: number;
			/** Authenticated selected cache asset. */
			readonly asset: DistantSunSceneCacheAssetSelection;
	  }>
	| Readonly<{
			/** Exact resolution schema identity. */
			readonly schemaId: 'flat32-distant-sun-cache-resolution-v2';
			/** Selected cache package representation. */
			readonly cacheFormat: 'algorithm32-distant-sun-shared-block-v1';
			/** Whether this selection is ready, dark or unsupported. */
			readonly status: 'ready';
			/** Exact requested solar angle in degrees. */
			readonly requestedSolarZenithDegrees: number;
			/** Representative angle of the resolved lighted cache. */
			readonly representativeSolarZenithDegrees: number;
			/** Authenticated selected cache asset. */
			readonly asset: Flat32SharedCacheAssetSelection;
	  }>
	| Readonly<{
			/** Exact resolution schema identity. */
			readonly schemaId: 'flat32-distant-sun-cache-resolution-v2';
			/** Selected cache package representation. */
			readonly cacheFormat: 'algorithm32-distant-sun-dense-scene-v1';
			/** Whether this selection is ready, dark or unsupported. */
			readonly status: Flat32DistantSunCacheNonReadyStatus;
			/** Exact requested solar angle in degrees. */
			readonly requestedSolarZenithDegrees: number;
	  }>;

/** Trusted immutable shared-package root returned by the explicit deployment selection. */
type Flat32SharedCacheAssetSelection = {
	/** Same-origin immutable package directory URL. */ rootUrl: string;
	/** Content-addressed package-set identity matching the final root directory. */ packageSetIdentity: string;
	/** Exact trusted package-set report bytes. */ report: DistantSunSharedCacheFileIdentity;
	/** Optional independently qualified dual-atlas transition policy for this target. */ transitionQualification?: DistantSunSharedCacheMemoryQualification;
	/** Explicit solar lookup; omission retains the linear control. */ solarInterpolation?: DistantSunSolarInterpolationMethod;
};

/** Published atmosphere mode, composed-frame observations and setup timing. */
type Flat32AtmosphereSummary = Omit<SphericalDistantModeSummary, 'pairing' | 'distantSunCacheState'> & {
	/** Distant cache readiness; absent for flat/local modes. */ distantSunCacheState?: Flat32DistantSunCacheState;
	/** Published spherical/distant or flat/local geometry/source pairing. */
	pairing: Flat32Pairing;
	/** Whether the local observer dome is selected. */
	observerDomeEnabled?: boolean;
	/** Number of successfully composed runtime frames. */
	runtimeFrameCount: number;
	/** Number of runtime rendering failures. */
	renderErrorCount: number;
	/** Maximum unit-bearing encoded scene depth. */
	sceneDepthMax: Distance;
	/** Preparation duration in milliseconds. */
	setupDurationMilliseconds: number;
	/** Composed scene-linear RGBA output pixel. */
	outputPixel: readonly [number, number, number, number];
	/** Captured scene-linear RGBA input pixel. */
	sceneInputPixel: readonly [number, number, number, number];
};
/** Independently prepared physical inputs for one coherent distant-Sun scene. */
type Flat32PreparedDistantScene = {
	/** Accepted observation, geometry, and exact Sun direction. */ sceneState: Flat32DistantSunSceneState;
	/** Independent candidate source for receiver-light measurement. */ source: LightSourceModel &
		DistantSunCelestialSource;
	/** Call this method to assign the prepared source and geometry state at a frame boundary. */ publish(): void;
};
/** One bounded frame-boundary state publication and its caller cancellation. */
type Flat32FrameBoundaryOperation = {
	/** Call this method to assign the complete prepared state. */ operation(): void;
	/** Call this method to resolve completed publication. */ resolve(): void;
	/** Call this method to reject unavailable or failed publication. */ reject(reason: unknown): void;
	/** Caller cancellation signal. */ signal: AbortSignal;
	/** Call this method to remove a canceled queued publication. */ cancel(): void;
};

/** Renderer cadence selected by the scene owner.
 *
 * - **"animation-frame"** - Ordinary browser animation-frame rendering.
 * - **"manual"** - Caller-owned complete frame stepping between publications.
 */
type Flat32FrameCadence = 'animation-frame' | 'manual';

/** Caller-owned scene rendering configuration. */
type Flat32SceneRuntimeConfiguration = Readonly<{
	/** Cadence; omission selects ordinary browser animation frames. */
	frameCadence?: Flat32FrameCadence;
	/** Scene-linear color storage; omission retains the existing half-float path. */
	sceneColorPrecision?: Flat32SceneColorPrecision;
}>;

/** Explicit scene-linear storage precision before physical display gain.
 *
 * - **"float16"** - Existing half-float production control.
 * - **"float32"** - Full float precision for measured low-light composition.
 */
type Flat32SceneColorPrecision = 'float16' | 'float32';

/** Independently implementable opaque endpoint and lighting capability. */
interface Flat32EndpointLighting {
	/** Prepare exact-state local endpoint lighting without changing the scene. */ prepareLocalSunLighting?(
		sourceScenePosition: ScenePosition,
		receiverLight: ReceiverEnvironmentLightMeasurement,
		color: Color,
	): LocalSunFrameSceneLighting;
	/** Apply matching physical source and receiver lighting before rendering. */
	updateDistantSunLighting(
		directionToSource: UnitVector3,
		receiverLight: ReceiverEnvironmentLightMeasurement,
		color: Color,
	): void;
	/** Return geometry bounds used to resolve physical scene depth. */
	getSceneDepthEndpointPositions(): readonly ScenePosition[];
}

/** Optional premeasured environment input to stable shared-scene publication. */
type Flat32ScenePublicationRequest = Readonly<{
	/** Physical diffuse irradiance and adaptation for this observation; direct spectra remain exact-time. */
	environmentSample?: ReceiverEnvironmentSample;
}>;

/** Shared-scene publication inputs with caller-owned cancellation. */
type Flat32SharedSceneUpdateRequest = Flat32ScenePublicationRequest &
	Readonly<{
		/** Explicit complete compact request; ordinary scene selection is P4. */ localFrameRequest?: LocalSunFrameRequest;
		/** Signal that cancels preparation before complete publication. */
		signal: AbortSignal;
	}>;

/** Installed runtime diagnostics available without mutable rendering resources. */
type Flat32RuntimeEvidenceSnapshot = Readonly<{
	/** Whether the Algorithm32 path remains installed. */
	installed: boolean;
	/** Completed Algorithm32 frame count. */
	frameCount: number;
	/** Scalar shader installation and version facts; no renderer resources. */
	shader: Flat32ShaderEvidenceSnapshot | null;
	/** Independent copy of observed shader failures. */
	shaderErrors: readonly string[];
}>;

/** Renderer-independent shader installation facts. */
type Flat32ShaderEvidenceSnapshot = Readonly<{
	/** Current shader installation status. */ status: string;
	/** Current configured physical model version. */ modelVersion: number;
}>;

/** Complete renderer-owned inputs for local shader and receiver staging. */
type Flat32LocalFrameSceneCapability = Pick<
	Flat32SceneRuntimeCapability,
	'scene' | 'camera' | 'renderer' | 'viewportSize' | 'createAtmosphereComposer'
>;

/** Complete renderer-owned inputs for local shader and receiver staging. */
type Flat32LocalFramePreparerConfiguration = Readonly<{
	/** Optional existing per-pass GPU timing consumer; no collection when absent. */ performanceCallback?: ShaderPerformanceCallback;
	/** Optional genuine live celestial roster creation; canonical construction remains independent. */ createCelestialSources?: (
		profile: LocalSunCompactConstructionProfile,
	) => CelestialSourceRoster | null;
	/** Optional selected shared stellar vision filters. */ presentationFilterRegistry?: ViewPresentationFilterRegistry;
	/** Optional ordinary scene lighting transaction owner. */ endpointScene?: Flat32EndpointLighting;
	/** Creates an independently owned display model for each staged frame. */
	createColorModel: () => Color;
	/** External scene/renderer/composer creation owner. */ sceneRuntime: Flat32LocalFrameSceneCapability;
	/** Exact physical length represented by scene units. */ sceneScale: SceneScale;
	/** Geometry-owned maximum encoded scene endpoint depth. */ sceneDepthMax: Distance;
}>;

/** Actual ordinary local-frame prepublication pixel observations. */
type Flat32LocalFramePreflight = LocalSunFramePreflight;

/** Renderer-owned camera facts passed to geometry for complete physical support admission. */
type Flat32LocalFrameViewRequest = Readonly<{
	/** Current camera origin in scene units. */ cameraPosition: ScenePosition;
	/** Current scene-frame forward direction. */ cameraDirection: UnitVector3;
	/** Symmetric perspective diagonal half-angle. */ halfAngle: Angle;
}>;

/** Ordinary shader counters used to reject incomplete composed frames. */
type Flat32LocalFrameProgramDiagnostics = Readonly<{
	/** Renderer compile/link report for the actual program. */ diagnostics?: Readonly<{
		/** Actual program link viability. */ runnable: boolean;
	}>;
}>;

/** Ordinary shader counters used to reject incomplete composed frames. */
type Flat32LocalFrameShaderDiagnostics = Readonly<{
	/** Actual installed runtime counters. */ runtime?: Readonly<{
		/** Successfully rendered composed frames. */ frameCount?: number;
		/** Reported render/compile failures. */ renderErrorCount?: number;
	}>;
}>;

/** Direct-construction configuration for the production atmosphere runtime. */
type Flat32RuntimeConfiguration = Readonly<{
	/** Explicit admitted compact frame owner; normal selection/adoption remains separate. */
	localFrameController?: LocalSunFramePublicationController;
	/** Runtime-owned scene/rendering coordinator. */
	sceneRuntime: Flat32SceneRuntimeCapability;
	/** Independently owned opaque endpoint lighting. */
	endpointScene: Flat32EndpointLighting;
	/** Supported atmosphere mode. */
	mode: Flat32Mode;
	/** Failure sink; a failed runtime restores ordinary scene rendering. */
	onFailure: Flat32AtmosphereFailureHandler;
	/** Isolated composer, otherwise borrowed from scene runtime. */
	composer?: import('three/examples/jsm/postprocessing/EffectComposer.js').EffectComposer;
	/** Isolated composer's owned target. */
	composerRenderTarget?: import('three').WebGLRenderTarget;
	/** Delay installation until controller publication. */
	deferPublication?: boolean;
	/** Initial atmosphere composition state; enabled by default. */
	atmosphereEnabled?: boolean;
	/** Optional performance measurement callback. */
	performanceCallback?: ShaderPerformanceCallback;
}>;
/** Distant cache readiness exposed by ordinary application summaries.
 *
 * - **"ready"** - A compatible source cache is installed.
 * - **"dark"** - The qualified dark selection needs no source cache.
 */
type Flat32DistantSunCacheState = 'ready' | 'dark';
