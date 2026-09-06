interface Window {
	__flat32Cleanup?: () => void;
	__flat32PerformanceSamples?: ShaderPerformanceSample[];
}

type Flat32ColorModelId = 'basic-bruneton' | 'color-reset-slope-078-p9' | 'ferwerda-control';

type Flat32ColorDisplayModelConfiguration =
	| Readonly<{
			readonly model: 'basic-bruneton' | 'color-reset-slope-078-p9';
	  }>
	| Readonly<{
			readonly model: 'ferwerda-control';
			readonly adaptationLuminanceCdPerSquareMeter: number;
	  }>;

type Flat32StellarCatalogId = 'brightest-500' | 'brightest-2000';
type Flat32PresentationFilterId = 'human-mesopic-luminance-v1' | 'human-low-light-chroma-v1';
type Flat32PresentationFilterConfiguration =
	| Readonly<{
			readonly id: 'human-mesopic-luminance-v1';
			readonly stage: 'source-linear';
			readonly target: 'stellar';
			readonly enabled: boolean;
			readonly parameters: Readonly<{readonly maximumRodContribution: number}>;
	  }>
	| Readonly<{
			readonly id: 'human-low-light-chroma-v1';
			readonly stage: 'source-linear';
			readonly target: 'stellar';
			readonly enabled: boolean;
			readonly parameters: Readonly<{readonly maximumChromaRetention: number}>;
	  }>;

interface Flat32ProductionSelections {
	readonly colorDisplayModelConfiguration: Flat32ColorDisplayModelConfiguration;
	readonly celestialSourcesEnabled: boolean;
	readonly stellarCatalog: Flat32StellarCatalogId;
	readonly presentationFilters: readonly Flat32PresentationFilterConfiguration[];
	readonly presentationFilterConfigurationIdentity: string;
}

interface Flat32ApplicationConfiguration {
	readonly cameraFieldOfViewDegrees?: number;
	readonly initialFlatTimeIndex?: number;
	readonly initialModeKind?: 'spherical-distant' | 'flat-local';
	readonly maximumScatteringOrder?: SupportedCacheScatteringOrder;
	readonly reviewObjectsEnabled?: boolean;
	readonly celestialSourcesEnabled?: boolean;
	readonly colorDisplayModelConfiguration?: Flat32ColorDisplayModelConfiguration;
	readonly stellarCatalog?: Flat32StellarCatalogId;
	readonly brightest2000StellarCatalogDefinition?: Brightest2000StellarCatalogDefinition;
	readonly scotopicLuminanceWeights?: ArrayLike<number>;
	readonly presentationFilters?: readonly Flat32PresentationFilterConfiguration[];
	readonly cameraDirectionScene?: readonly [number, number, number];
	readonly performanceCallback?: ShaderPerformanceCallback;
	readonly atmosphereShaderEnabled?: boolean;
	readonly resolveDistantSunSceneCacheAsset?: (
		solarZenithDegrees: number,
		request?: Readonly<{signal?: AbortSignal}>,
	) => Flat32DistantSunCacheResolution | Promise<Flat32DistantSunCacheResolution>;
}

type Flat32RenderOperation = () => void;
interface Flat32ContextLifecycleParticipant {
	/** Invalidate renderer-owned handles synchronously on context loss. */
	handleContextLoss(): void;
	/** Recreate renderer-owned resources before frame rendering resumes. */
	handleContextRestoration(): void | Promise<void>;
}
type Flat32AtmosphereFailureHandler = (message: string) => void;
type Flat32PointerLookChangeHandler = (locked: boolean) => void;
type Flat32ModeKind = 'spherical-distant' | 'flat-local';
type Flat32Mode = import('./SphericalDistantMode.js').SphericalDistantMode | import('./FlatLocalMode.js').FlatLocalMode;

/** Configure one isolated Algorithm32 runtime candidate. */
interface Flat32AlgorithmRuntimeConfiguration {
	/** Supply the scene owner. */
	sceneRuntime: import('./ThreeSceneRuntime.js').ThreeSceneRuntime;
	/** Supply ordinary endpoint-scene content. */
	endpointScene: import('./EndpointScene.js').EndpointScene;
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
}

/** Configure transactional supported-mode ownership. */
interface Flat32ModeControllerConfiguration {
	/** Select atmosphere composition or the direct lit scene. */
	atmosphereEnabled?: boolean;
	/** Create the requested supported mode. */
	createMode: (
		kind: Flat32ModeKind,
		state: Flat32ApplicationState,
		request: Readonly<{readonly signal: AbortSignal}>,
	) => Flat32Mode | Promise<Flat32Mode>;
	/** Optionally create an observable runtime boundary for focused tests. */
	createRuntime?: (
		configuration: Flat32AlgorithmRuntimeConfiguration,
	) => import('./Algorithm32Runtime.js').Algorithm32Runtime;
	/** Supply ordinary endpoint-scene content. */
	endpointScene: import('./EndpointScene.js').EndpointScene;
	/** Receive scene preparation before candidate preflight. */
	onPreparing: (kind: Flat32ModeKind, mode: Flat32Mode) => void;
	/** Restore the last published scene after candidate failure. */
	onReverted: (kind: Flat32ModeKind, mode: Flat32Mode) => void;
	/** Receive runtime failures. */
	onFailure: Flat32AtmosphereFailureHandler;
	/** Receive a successfully published mode and state. */
	onPublished: (kind: Flat32ModeKind, mode: Flat32Mode, state: Flat32ApplicationState) => void;
	/** Supply the Three scene and isolated-composer owner. */
	sceneRuntime: import('./ThreeSceneRuntime.js').ThreeSceneRuntime;
}

interface Flat32LocationTimeState {
	locationIndex: number;
	flatTimeIndex: number;
	globeTimeIndex: number;
	globeHourOffset: number;
	locationLabel: string;
	timeLabel: string;
	timeBasis: 'flat' | 'globe';
	observation: GeometryObservation;
}

interface Flat32ApplicationState extends Flat32LocationTimeState {
	modeKind: 'spherical-distant' | 'flat-local';
}

/** Describe one source-derived orthographic shadow camera. */
interface Flat32ShadowCameraDefinition {
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
}

/** Describe one fixed matte review object. */
interface Flat32ReviewObjectDefinition {
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
}

/** Describe one completed Algorithm32 preflight frame. */
interface Flat32AtmospherePreflight {
	/** Store the shader/runtime diagnostic snapshot. */
	diagnostics: Flat32ShaderDiagnostics;
	/** Store the composed output pixel. */
	outputPixel: readonly [number, number, number, number];
	/** Store the captured scene-input pixel. */
	sceneInputPixel: readonly [number, number, number, number];
}

/** Describe runtime diagnostic facts required for publication. */
interface Flat32ShaderDiagnostics {
	/** Store shader installation state. */
	status?: string;
	/** Store per-frame runtime diagnostics. */
	runtime?: Flat32ShaderRuntimeDiagnostics;
}

/** Describe the runtime facts checked after a composed frame. */
interface Flat32ShaderRuntimeDiagnostics {
	/** Store the completed frame count. */
	frameCount?: number;
	/** Store the number of runtime render failures. */
	renderErrorCount?: number;
	/** Store the most recent runtime failure when present. */
	lastRenderError?: string | null;
}

/** Describe the Three program diagnostic consulted by preflight. */
interface Flat32ProgramDiagnostic {
	/** Store whether Three considers the program runnable. */
	runnable?: boolean;
}

/** Describe the minimum Three program state checked by Flat32. */
interface Flat32ProgramInfo {
	/** Store optional program diagnostics. */
	diagnostics?: Flat32ProgramDiagnostic;
}

interface LocalSunLightingSummary {
	sourceLightCount: number;
	ambientLightCount: number;
	directionalLightCount: number;
	targetCount: number;
	ambientIntensity: number;
	directionalIntensity: number;
	shadowMapsInstalled: boolean;
	shadowMapCount: number;
	shadowMapWidth: number;
	shadowMapHeight: number;
	shadowLayerCount: number;
}

interface Flat32SceneSummary extends LocalSunLightingSummary {
	shadowCasterCount: number;
	shadowReceiverCount: number;
}

interface SphericalDistantModeSummary {
	pairing: 'spherical/distant';
	distantSunCacheState: 'ready' | 'dark';
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	positionCount: number;
	incomingDirectionCount: number;
	outgoingDirectionCount: number;
	spectralChannelCount: number;
}

/** Live spherical/distant scene placement and its cache-selection scalar. */
interface Flat32DistantSunSceneState {
	readonly observation: GeometryObservation;
	readonly geometry: import('../algorithm32/implementation/spherical-earth/SphericalEarthGeometry.js').SphericalEarthGeometry;
	readonly directionToSourceModel: UnitVector3;
	readonly observerSolarZenith: Angle;
	readonly solarZenithDegrees: number;
}

type Flat32DistantSunCacheResolution =
	| Readonly<{
			readonly status: 'ready';
			readonly requestedSolarZenithDegrees: number;
			readonly representativeSolarZenithDegrees: number;
			readonly asset: DistantSunSceneCacheAssetSelection;
	  }>
	| Readonly<{
			readonly status: 'dark' | 'unsupported';
			readonly requestedSolarZenithDegrees: number;
	  }>;

interface Flat32AtmosphereSummary extends SphericalDistantModeSummary {
	pairing: 'spherical/distant' | 'flat/local';
	observerDomeEnabled?: boolean;
	runtimeFrameCount: number;
	renderErrorCount: number;
	sceneDepthMax: Distance;
	setupDurationMilliseconds: number;
	outputPixel: readonly [number, number, number, number];
	sceneInputPixel: readonly [number, number, number, number];
}
