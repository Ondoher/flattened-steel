/** Deterministic repository random generator supplied by the animation owner. */
interface TheHoursObservatoryRandomSource {
	/** Call this method to reset the explicit replay seed. */
	randomize(seed: number): void;
	/** Call this method to obtain the next unit-interval value. */
	random(): number;
}

/** Geometry-owned spherical surface mapping consumed by procedural construction. */
interface TheHoursObservatoryGroundGeometry {
	/** Call this method to obtain the geometry-owned ground visual and exact raycast surface. */
	createThreeEndpointObjects(request: GeometryThreeEndpointObjectsRequest): GeometryThreeEndpointObjects;
	/** Call this method to map horizontal scene coordinates and radial elevation. */
	mapGroundOffsetToScenePoint(offset: ScenePosition, request: GeometryGroundOffsetScenePointRequest): ScenePosition;
}

/** Scene dependencies and deterministic construction parameters. */
type TheHoursObservatorySceneConfiguration = Readonly<{
	/** Three namespace shared with the rendering owner. */
	three: object;
	/** Scene that receives the owned observatory group. */
	scene: object;
	/** Physical spherical surface mapper. */
	geometry: TheHoursObservatoryGroundGeometry;
	/** Repository-owned deterministic random generator. */
	random: TheHoursObservatoryRandomSource;
	/** Explicit integer construction seed retained in provenance. */
	seed: number;
	/** Sunrise direction in east/up/south scene coordinates. */
	sunriseDirectionScene: readonly number[];
	/** Sunset direction in east/up/south scene coordinates. */
	sunsetDirectionScene: readonly number[];
}>;

/** Observable procedural scene and draw-call facts. */
type TheHoursObservatorySceneDescription = Readonly<{
	/** Human-readable artistic identity. */
	name: string;
	/** Deterministic seed. */
	seed: number;
	/** Authored object count before static geometry batching. */
	authoredObjectCount: number;
	/** Ordinary meshes used by the current capture pipeline. */
	meshCount: number;
	/** Triangle count across the scene. */
	triangleCount: number;
	/** Ordinary meshes casting into the shared Sun shadow map. */
	shadowCasterCount: number;
	/** Ordinary meshes receiving direct-light shadows. */
	shadowReceiverCount: number;
	/** Radial extent of the sandstone terraces, in meters. */
	plazaRadiusMeters: number;
	/** Hero center in scene units. */
	heroCenterScene: readonly number[];
	/** Compatible scene-input policy. */
	sceneInputPolicy: string;
}>;

/** Shared distant-Sun lighting dependencies and local shadow coverage. */
type TheHoursDesertSceneLightingConfiguration = Readonly<{
	/** Three namespace shared with the rendering owner. */
	three: object;
	/** Parent receiving the owned source-light group. */
	parent: object;
	/** Lambertian evaluator constructor from the same module graph as the receiver packets. */
	neutralLambertianClass: new () => TheHoursObservatoryLambertianEvaluator;
	/** Neutral reflectance constant supplied by that same module graph. */
	neutralReflectance: number;
	/** Width and height of the single orthographic shadow map, in meters. */
	shadowExtentMeters?: number;
	/** Shadow target in scene-axis coordinates expressed in meters. */
	shadowFocusMeters?: readonly number[];
	/** Strength of the unoccluded lower-hemisphere sand-reflection approximation, in [0,1]; zero disables it. */
	groundBounceStrength?: number;
}>;

/** Renderer-owned neutral Lambertian spectral evaluator used without duplicating packet classes. */
interface TheHoursObservatoryLambertianEvaluator {
	/** Call this method to evaluate the renderer's compatible spectral packets. */
	evaluate(request: NeutralLambertianSceneLightingRequest): NeutralLambertianSceneLightingResponse;
}

/** Renderer-owned spectral projection required by the cloned physical-to-renderer bridge. */
interface TheHoursObservatoryColorProjection {
	/** Optional Figure 1 display constants supplied by the selected production color model. */
	readonly displayConstants?: Figure1DisplayConstants;
	/** Call this method to project a physical spectrum into signed linear-sRGB channels. */
	radianceToLinearSrgb(radiance: SpectralRadiancePacket): readonly number[];
}

/** Observable resource and spectral provenance of the cloned lighting owner. */
type TheHoursDesertSceneLightingDescription = Readonly<{
	/** Owned light count. */
	sourceLightCount: number;
	/** Algorithm32 diffuse-irradiance environment light count. */
	ambientLightCount: number;
	/** Algorithm32 direct-normal Sun light count. */
	directionalLightCount: number;
	/** Owned directional-light target count. */
	targetCount: number;
	/** Current environment light intensity. */
	ambientIntensity: number;
	/** Unmodified Algorithm32 upper-hemisphere light intensity. */
	skyAmbientIntensity: number;
	/** Intensity of the separate approximate sand-reflection hemisphere. */
	groundBounceIntensity: number;
	/** Configured strength of the local reflected-light approximation. */
	groundBounceStrength: number;
	/** Current direct light intensity. */
	directionalIntensity: number;
	/** Whether the renderer has allocated the required 4096-square shadow map. */
	shadowMapsInstalled: boolean;
	/** Number of allocated shadow maps. */
	shadowMapCount: number;
	/** Allocated shadow width, in pixels. */
	shadowMapWidth: number;
	/** Allocated shadow height, in pixels. */
	shadowMapHeight: number;
	/** Shared default shadow layer count. */
	shadowLayerCount: number;
	/** Physical coverage of the shadow camera, in meters. */
	shadowExtentMeters: number;
	/** Latest Algorithm32 receiver-light measurement identity. */
	receiverLightIdentity: string | null;
	/** Cloned spectral bridge identity. */
	lightingPolicy: string;
}>;

/** Renderer-independent camera configuration supplied by the creative adapter. */
type TheHoursCameraConfiguration = {
	/** Caller-owned perspective camera from the live Three runtime. */
	camera: import('three').PerspectiveCamera;
	/** Complete film duration in seconds. */
	durationSeconds: number;
};
/** Exact scene-space camera pose retained for deterministic playback. */
type TheHoursCameraSnapshot = {
	/** Observer-local east/up/south camera position in meters. */
	positionMeters: number[];
	/** Unit scene-space viewing direction. */
	viewDirection: number[];
	/** Vertical field of view in degrees. */
	fieldOfViewDegrees: number;
	/** Viewing elevation above the horizon in degrees. */
	elevationDegrees: number;
};

/** Minimal astronomical state consumed by the unchanged camera choreography. */
type TheHoursSolarFrame = Readonly<{
	/** Position within the original sixty-second score. */
	animationSeconds: number;
	/** Exact solar zenith in degrees. */
	solarZenithDegrees: number;
	/** Unit direction in observer-local east/up/south coordinates. */
	directionToSunScene: UnitVector3;
}>;

/** Region display-code statistics from one decoded RGB frame. */
type TheHoursPixelRegion = {
	/** Mean red display code in the region. */ meanRed: number;
	/** Mean green display code in the region. */ meanGreen: number;
	/** Mean blue display code in the region. */ meanBlue: number;
	/** Rec.709-weighted display-code mean, not physical luminance. */ meanLuma: number;
	/** Mean absolute RGB change from the preceding frame. */ adjacentRgbMeanAbsolute: number | null;
	/** Centered mean absolute RGB curvature at the preceding frame. */ previousFrameRgbCurvature: number | null;
};

/** Ordered measurements for one decoded frame. */
type TheHoursPixelFrame = {
	/** Zero-based presentation index. */ frameIndex: number;
	/** Measurements in the four pinned masks. */ regions: Record<string, TheHoursPixelRegion>;
};

/** Cache identity fields needed to align source and decoded traces. */
type TheHoursMeasuredSceneFrame = {
	/** Original choreography time in seconds. */ animationSeconds: number;
	/** Exact astronomical zenith in degrees. */ solarZenithDegrees: number;
	/** Original dense-cache identity when shared state is absent. */ cacheIdentity: string;
	/** Published current shared scene ordinal, or dark state. */ sharedScene?: string | null;
};

/** One ranked temporal curvature event. */
type TheHoursTemporalEvent = {
	/** Center presentation frame. */ index: number;
	/** Center regional mean display-code luma. */ luma: number;
	/** Signed preceding difference. */ incoming: number;
	/** Signed following difference. */ outgoing: number;
	/** Whether the two signed differences reverse direction. */ reversal: boolean;
	/** Absolute second difference. */ curvature: number;
	/** Whether either adjacent interval publishes a new cache scene. */ cacheAdjacent: boolean;
	/** Centered RGB mean absolute second difference. */ rgbCurvature: number;
};

/** Complete cache-boundary temporal gate for four image masks. */
type TheHoursTemporalResult = {
	/** Frames publishing a changed scene. */ boundaries: number[];
	/** Region-specific measurements and acceptance. */ regions: Record<
		string,
		{
			/** Mean boundary temporal curvature. */ boundaryMean: number;
			/** Mean stable temporal curvature. */ stableMean: number;
			/** Boundary mean divided by stable mean. */ ratio: number;
			/** Highest ranked curvature events. */ strongest: TheHoursTemporalEvent[];
			/** Reversing cache-adjacent events among the strongest. */ reversingBoundaryPeaks: number;
			/** Distinct cache publications producing those extrema; a pulse's two sides count once. */ reversingPublications: number[];
			/** Fraction of eligible frames adjacent to cache publication. */ boundaryFraction: number;
			/** Whether the pinned quantitative and recurring-peak gates pass. */ pass: boolean;
		}
	>;
	/** Whether every region passes. */ pass: boolean;
};

/** Display-code excursion against the expected direction of daylight change. */
type TheHoursHorizonResult = {
	/** Every retained complete horizon window meets the sky gate. */ pass: boolean;
	/** Allowed upper-sky excursion on the 0-255 mean display-code scale. */ maximumUpperExcursion: number;
	/** Individual sunrise or sunset measurements. */ windows: TheHoursHorizonWindow[];
};

/** One complete horizon crossing measured independently of cache-publication events. */
type TheHoursHorizonWindow = {
	/** Original score's morning/evening interval. */ name: string;
	/** Retained frames spanning solar zenith 89.5-91.5 degrees. */ frameCount: number;
	/** Regional directional excursion and single-frame step. */ regions: Record<string, TheHoursHorizonExcursion>;
	/** Upper sky has no excursion exceeding the declared one-code allowance. */ pass: boolean;
};

/** Wrong-direction display brightness changes in one retained image region. */
type TheHoursHorizonExcursion = {
	/** Largest accumulated wrong-direction change from a preceding extremum. */ excursion: number;
	/** Largest wrong-direction change between adjacent frames. */ maximumOpposingStep: number;
};

/** Four pinned native image masks. */
type TheHoursPixelRegions = Record<string, TheHoursPixelRegion>;

/** Exact artifact identity beneath a declared input or output root. */
type TheHoursArtifactIdentity = Readonly<{
	/** Canonical relative artifact path in its declared root. */
	path: string;
	/** Exact number of bytes. */
	byteLength: number;
	/** Lowercase SHA-256 digest of complete bytes. */
	sha256: string;
}>;

/** Proof run filesystem configuration. */
type TheHoursRunConfiguration = Readonly<{
	/** Ignored repository-relative task runs directory. */
	outputRoot: string;
	/** Explicit read-only relocated evidence root. */
	evidenceRoot: string;
}>;

/** Final automated proof disposition.
 *
 * - **"accepted"** - Automated operation and its declared gates passed.
 * - **"rejected"** - Operation completed with a failed scientific gate.
 * - **"failed"** - Operation could not complete safely.
 */
type TheHoursRunDisposition = 'accepted' | 'rejected' | 'failed';

/** Original solved astronomical event and Hermite clock tangent. */
type TheHoursTimelineKey = Readonly<{
	/** Original score time, in seconds. */ seconds: number;
	/** UTC event instant in milliseconds since epoch. */ milliseconds: number;
	/** Original clock tangent, UTC milliseconds per score second. */ slope: number;
}>;

/** Authenticated original frame state. */
type TheHoursOriginalFrame = Readonly<{
	/** Exact UTC observation. */ instant: string;
	/** Original solar zenith in degrees. */ solarZenithDegrees: number;
	/** Original recoverable camera pose. */ camera: TheHoursCameraSnapshot;
}>;

/** Minimal complete original choreography input. */
type TheHoursOriginalTrace = Readonly<{
	/** Complete 1800-frame original source states. */ frames: readonly TheHoursOriginalFrame[];
	/** Original solved solar clock. */ solar: Readonly<{
		/** Nine exact event positions and clock tangents. */ timeline: readonly TheHoursTimelineKey[];
		/** Unit sunrise scene direction. */ sunriseDirectionScene: UnitVector3;
		/** Unit sunset scene direction. */ sunsetDirectionScene: UnitVector3;
	}>;
}>;

/** One retained integer-second measured environment endpoint. */
type TheHoursLightingSample = Readonly<{
	/** Original score time, in integer seconds. */ seconds: number;
	/** Complete actual GPU receiver-light measurement. */ measurement: ReceiverEnvironmentLightMeasurement;
}>;

/** Exact production candidate inputs owned by one active run. */
type TheHoursPackageInputConfiguration = Readonly<{
	/** Active run capability; parent reads authenticate immutable inputs. */
	run: TheHoursRunCapability;
	/** Evidence-root-relative selected package directory. */
	packageRoot: string;
	/** Pinned package-relative report identity. */
	report: TheHoursArtifactIdentity;
}>;
/** Complete cubic support at one scene ordinal. */
type TheHoursStencilProof = Readonly<{
	/** Exact representative catalog ordinal. */ ordinal: number;
	/** Production scene identity. */ sceneId: string;
	/** Complete cubic block support. */ requiredBlockIds: readonly string[];
}>;
/** Complete authenticated package and preserved generation provenance. */
type TheHoursPackageProof = Readonly<{
	/** Canonical package set identity. */ packageSetIdentity: string;
	/** Original pinned report. */ report: TheHoursArtifactIdentity;
	/** Selected complete native configuration. */ configurationIdentity: string;
	/** Count of representative scenes. */ sceneCount: number;
	/** Number of complete authenticated compressed blocks. */ encodedBlocks: number;
	/** Every verified package artifact. */ authenticatedArtifacts: readonly DistantSunSharedCacheFileIdentity[];
	/** All 109 complete cubic supports. */ stencilInventory: readonly TheHoursStencilProof[];
	/** Largest required support set. */ maximumCubicBlocks: number;
	/** Original report derivation, retained without changes. */ preservedDerivation: unknown;
}>;
/** One globally bounded illuminance interval in the analytic monotonic proof. */
type TheHoursMonotonicInterval = Readonly<{
	/** Inclusive lower nonnegative illuminance. */ lowerLux: number;
	/** Upper illuminance; null means positive infinity. */ upperLux: number | null;
	/** Bound strictly below one on negative gain elasticity. */ negativeElasticityUpperBound: number;
}>;
/** Analytic proof of positive brightness derivative on the entire nonnegative axis. */
type TheHoursMonotonicProof = Readonly<{
	/** Differentiated common gain equation. */ equation: string;
	/** Ordered intervals covering the whole domain. */ bounds: readonly TheHoursMonotonicInterval[];
}>;
/** Actual two-atlas allocation and float-readback proof. */
type TheHoursGpuBudgetProof = Readonly<{
	/** Unmasked renderer from the measured context. */ renderer: string;
	/** Exact hardware, browser major and backend admission identity. */ targetId: string;
	/** Unchanged two-atlas byte ceiling. */ maximumBytes: number;
	/** Number of independently written and read layers. */ layersProbed: number;
}>;
/** Actual production model CPU/GLSL agreement. */
type TheHoursGpuModelProof = Readonly<{
	/** Exact display response identity. */ model: string;
	/** Number of admitted illuminance samples. */ samples: number;
	/** Largest relative CPU/GLSL gain difference. */ maximumGainRelativeError: number;
	/** Largest final RGB absolute difference. */ maximumDisplayAbsoluteError: number;
}>;
/** Analytic and measured display proof across all three controls. */
type TheHoursGpuColorProof = Readonly<{
	/** Global analytic monotonicity proof. */ monotonicity: TheHoursMonotonicProof;
	/** Every actual production shader/CPU comparison. */ models: readonly TheHoursGpuModelProof[];
}>;
/** Actual browser capability and color proof. */
type TheHoursGpuProofResult = Readonly<{
	/** Admitted two-atlas target. */ budget: TheHoursGpuBudgetProof;
	/** Actual CPU and GLSL behavior. */ color: TheHoursGpuColorProof;
}>;
/** Complete native replay controls, provided after parent authentication. */
type TheHoursBrowserConfiguration = Readonly<{
	/** Explicit AVC workflow target bitrate. */ bitrate?: number;
	/** Authenticated original full choreography. */ original: TheHoursOriginalTrace;
	/** Native frame width in pixels. */ width: number;
	/** Native frame height in pixels. */ height: number;
	/** Explicit production response identity. */ colorModel: Flat32FixedColorModelId;
	/** Explicit scene-linear precision; retained half-float or measured full-float candidate. */ sceneColorPrecision?: Flat32SceneColorPrecision;
	/** First position within the original sixty-second score. */ startSeconds: number;
	/** Complete clip duration, in seconds. */ durationSeconds: number;
	/** Original short-control camera, absent for the full choreography. */ fixedCamera?: TheHoursCameraSnapshot;
	/** Original human stellar filters in their retained order. */ originalPresentationFilters: readonly Flat32PresentationFilterConfiguration[];
	/** Local authenticated media-tool module URL. */ mediabunnyModuleUrl: string;
	/** Exact package and actual target admission. */ asset: Flat32SharedCacheAssetSelection;
}>;
/** One complete physical and native source frame before encoding. */
type TheHoursSceneFrame = TheHoursMeasuredSceneFrame &
	Readonly<{
		/** Exact original astronomical UTC instant. */ instant: string;
		/** Exact-time physical Sun direction. */ directionToSunModel: UnitVector3;
		/** Recoverable native camera pose. */ camera: TheHoursCameraSnapshot;
		/** Native-pixel source means in all pinned masks. */ sourceRegions: TheHoursPixelRegions;
		/** Complete coherent cache state. */ sharedCache: DistantSunSharedCacheControllerDiagnostics;
		/** Identity of combined exact direct and measured/interpolated environment. */ receiverLightIdentity: string;
		/** Complete actual physical receiver-light values. */ receiverLight: ReceiverEnvironmentLightMeasurement;
		/** Scene light and shared-shadow resource facts. */ lighting: TheHoursDesertSceneLightingDescription;
		/** Public runtime fallback and shader facts. */ runtime: Flat32RuntimeEvidenceSnapshot;
		/** Display input identity and physical illuminance. */ color: TheHoursFrameColor;
	}>;
/** Physical response input for one complete scene. */
type TheHoursFrameColor = Readonly<{
	/** Explicit production display identity. */ model: string;
	/** Total horizontal photopic input in lux. */ illuminanceLux: number;
}>;
/** Original ideal-cadence state supplied to the recorder. */
type TheHoursReplayState = Readonly<{
	/** Original choreography seconds. */ animationSeconds: number;
}>;
/** Exact recorder encoder selection and all capability probes. */
type TheHoursEncoderSelection = Readonly<{
	/** Selected declared codec policy. */ selectedCandidateId: string;
	/** Actual selected encoder controls. */ selectedConfig: Readonly<Record<string, unknown>>;
	/** Complete attempted probe results. */ outcomes: readonly AnimationEvidenceEncoderProbe[];
}>;
/** Complete production source trace and original-workflow output facts. */
type TheHoursBrowserResult = Readonly<{
	/** Every native source frame in output order. */ frames: readonly TheHoursSceneFrame[];
	/** Every ideal output slot and retained capture receipt. */ recording: AnimationEvidenceRecorderResult;
	/** Actual successful encoder policy. */ encoderSelection: TheHoursEncoderSelection;
	/** Deterministic original observatory facts. */ scene: TheHoursObservatorySceneDescription;
	/** Complete bounded byte delivery facts. */ chunkSink: AnimationEvidenceChunkSinkDiagnostics;
}>;
/** Loopback host dependencies, owned by the same active proof. */
type TheHoursHostConfiguration = Readonly<{
	/** Active output capability. */ run: TheHoursRunCapability;
	/** Authenticated read-only artifact capability. */ inputs: TheHoursInputArtifacts;
}>;

/** Independently implementable read-only authenticated artifact delivery. */
interface TheHoursInputArtifacts {
	/** Call this method to authenticate and resolve one exact declared ordinary artifact. */
	path(relative: string): Promise<string>;
}
/** Shared ideal-cadence recorder controls. */
type TheHoursRecorderConfiguration = Readonly<{
	/** Exact native presentation canvas. */ presentation: OffscreenCanvas;
	/** Native output width. */ width: number;
	/** Native output height. */ height: number;
	/** Original interval duration. */ durationSeconds: number;
	/** Original score start. */ startSeconds: number;
	/** Pinned local media module. */ mediabunnyModuleUrl: string;
	/** Declared video target bitrate; omission retains 40Mbps. */ bitrate?: number;
	/** Explicit encoder preference; omission retains the original hardware-first policy. */ hardwareAcceleration?: HardwareAcceleration;
	/** Render or reconstruct the exact original presentation at score time. */ render(seconds: number): Promise<void>;
	/** Retain one lossless source frame when requested. */ capture?(slot: number): Promise<unknown>;
}>;
/** Complete shared original recording workflow result. */
type TheHoursRecordingResult = Readonly<{
	/** Exact output slots and native capture receipts. */ recording: AnimationEvidenceRecorderResult;
	/** Actual codec capability selection. */ encoderSelection: TheHoursEncoderSelection;
	/** Complete bounded delivery facts. */ chunkSink: AnimationEvidenceChunkSinkDiagnostics;
}>;
/** Retained lossless source replay with explicit media controls. */
type TheHoursReplayConfiguration = Readonly<{
	/** Exact native width. */ width: number;
	/** Exact native height. */ height: number;
	/** Original selected score interval. */ startSeconds: number;
	/** Original interval duration. */ durationSeconds: number;
	/** Pinned local media module. */ mediabunnyModuleUrl: string;
	/** Explicit target bitrate. */ bitrate: number;
	/** Explicit encoder preference; omission retains the original hardware-first policy. */ hardwareAcceleration?: HardwareAcceleration;
	/** Every original native regional RGB/code mean. */ sourceMeans: readonly TheHoursPixelRegions[];
}>;
/** Exact native replay validation and complete recording facts. */
type TheHoursReplayResult = TheHoursRecordingResult &
	Readonly<{
		/** Maximum regional RGB/code mean change after exact PNG reconstruction. */ maximumNativeMeanDifference: number;
	}>;
/** One actual complete native production scene publication. */
type TheHoursSceneTraversalCase = Readonly<{
	/** Required representative scene ordinal. */ ordinal: number;
	/** Chosen angle in that scene's visible interval. */ targetZenithDegrees: number;
	/** Actual production astronomical zenith. */ actualZenithDegrees: number;
	/** Synthetic qualification observer and exact UTC instant. */ observation: GeometryObservation;
	/** Actual coherent configured source direction. */ sourceDirection: readonly number[];
	/** Actual complete cache publication and allocation counters. */ cache: DistantSunSharedCacheControllerDiagnostics;
	/** Actual GPU-measured physical receiver light. */ receiver: ReceiverEnvironmentLightMeasurement;
	/** Matching opaque lighting and shadow resource facts. */ lighting: TheHoursDesertSceneLightingDescription;
	/** Actual installation and shader error facts. */ runtime: Flat32RuntimeEvidenceSnapshot;
}>;
/** Complete all-scene source/receiver/cache publication and unchanged memory qualification. */
type TheHoursSceneTraversalResult = Readonly<{
	/** All 109 actual coherent publications. */ scenes: readonly TheHoursSceneTraversalCase[];
	/** Exact number of exercised scenes. */ count: number;
	/** Largest observed cache allocation. */ maximumCacheGpuBytes: number;
	/** Complete scene and coherence gates passed. */ pass: boolean;
}>;
interface Window {
	/** Call this method to report bounded progress to the active run. */
	__theHoursProgress(value: Readonly<Record<string, unknown>>): Promise<void>;
	/** Call this method to persist one new complete lossless native frame. */
	__theHoursCapture(slot: number, encoded: string): Promise<unknown>;
	/** Call this method to retain measured physical endpoints. */
	__theHoursWriteJson(relative: string, value: unknown): Promise<void>;
	/** Call this method to append the next bounded video batch. */
	__theHoursVideoChunk(index: number, encoded: string): Promise<void>;
	/** Call this method to finalize the sequential video stream. */
	__theHoursVideoFinalize(): Promise<void>;
}
/** Exact decoder measurement dimensions. */
type TheHoursMediaDimensions = Readonly<{
	/** Number of pixel columns. */ width: number;
	/** Number of pixel rows, divisible into three masks. */ height: number;
}>;
/** Declared closed proof run and artifact-set identity. */
type TheHoursArtifactManifest = Readonly<{
	/** Versioned production proof schema. */ schemaId: string;
	/** Honest automated disposition. */ disposition: TheHoursRunDisposition;
	/** Every final ordinary artifact. */ artifacts: readonly TheHoursArtifactIdentity[];
	/** SHA-256 of the canonical serialized artifact list. */ artifactSetSha256: string;
}>;
/** Pinned retained proof input supplied to independent analysis. */
type TheHoursRetainedInputConfiguration = Readonly<{
	/** New child run with read-only parent capability. */ run: TheHoursRunCapability;
	/** Exact completed capture run. */ parentRoot: string;
	/** Externally pinned manifest byte identity. */ manifest: TheHoursArtifactIdentity;
}>;
/** Selected immutable short-control configuration used solely as authenticated data. */
type TheHoursOriginalControl = Readonly<{
	/** Retained explicit display curve. */ colorResponse: string;
	/** Original deterministic scene seed. */ seed: number;
	/** Complete short-control duration. */ durationSeconds: number;
	/** Original ideal presentation cadence. */ framesPerSecond: number;
	/** Per-diagnostic original fixed camera. */ fixedCamera: TheHoursCameraSnapshot;
}>;
/** Exact native lower-region extremum beside an original publication. */
type TheHoursRecurrenceEvent = Readonly<{
	/** Exact original sixty-second frame identity. */ originalFrameIndex: number;
	/** Previous native lower-region mean display code. */ previous: number;
	/** Center native lower-region mean display code. */ value: number;
	/** Next native lower-region mean display code. */ next: number;
	/** Signed preceding change. */ incoming: number;
	/** Signed following change. */ outgoing: number;
	/** Absolute second difference in mean codes. */ curvature: number;
	/** Changes reverse at the event center. */ reversal: boolean;
}>;
/** Retained exact neighborhood of one original physical publication. */
type TheHoursRecurrencePublication = Readonly<{
	/** Original named publication, independent of strongest ranking. */ originalFrameIndex: number;
	/** Published cache identity. */ publishedScene: string;
	/** Immediately preceding published cache identity. */ previousScene: string;
	/** Both possible sides of the pulse with unmodified values. */ events: readonly TheHoursRecurrenceEvent[];
	/** Any adjacent center reverses direction. */ reversal: boolean;
}>;
/** Exact original-publication recurrence guard. */
type TheHoursRecurrenceProof = Readonly<{
	/** Both immutable original target identities. */ publications: readonly TheHoursRecurrencePublication[];
	/** Distinct named publications still producing pulses. */ reversingPublications: readonly number[];
	/** Original accepted distinct-publication allowance. */ maximumDistinctPublications: number;
	/** Both targets satisfy the original allowance. */ pass: boolean;
}>;

/** Exact task-local selection of accepted short qualification manifests. */
type TheHoursShortSelection = Readonly<{
	/** Versioned complete short-proof selection schema. */ schemaId: string;
	/** One unique manifest for each required short operation. */ proofs: readonly Readonly<{
		/** Registered daylight, sunrise, sunset or early-ground operation. */ name: string;
		/** Exact accepted sealed qualification manifest identity. */ manifest: TheHoursArtifactIdentity;
	}>[];
}>;
/** Authenticated short result fields required for full-film admission. */
type TheHoursShortQualification = Readonly<{
	/** Exact matched physical/source capture root. */ parentRoot: string;
	/** Aggregate source and encoded scientific gate. */ pass: boolean;
	/** Complete short presentation count. */ frameCount: number;
	/** Declared original-workflow candidate bitrate. */ workflowBitrate: number;
	/** Native source detector result. */ sourceTemporal: TheHoursTemporalResult;
	/** Original scaled lossless detector result. */ originalSourceTemporal: TheHoursTemporalResult;
	/** Independent x264 detector result. */ encodedTemporal: TheHoursTemporalResult;
	/** Original-workflow candidate detector result. */ workflowTemporal: TheHoursTemporalResult;
	/** Maximum exact-native decoded mean discrepancy. */ maximumNativeMeanDifference: number;
	/** Exact source replay and original-workflow facts. */ replay: TheHoursReplayResult;
	/** Complete sunrise/sunset detector results, absent for other clips. */ horizon: Record<
		string,
		TheHoursHorizonResult
	> | null;
	/** Explicit retained112/125 publication results, present for early-ground. */ recurrence: Record<
		string,
		TheHoursRecurrenceProof
	> | null;
}>;
/** Full-film admission with explicit resolution-specific encoder policies. */
type TheHoursShortAdmission = Readonly<{
	/** Pinned gate, closed manifests and authenticated result artifacts. */ parents: readonly TheHoursArtifactIdentity[];
	/** Qualified native4K workflow bitrate. */ filmBitrate: number;
	/** Qualified720p diagnostic workflow bitrate. */ diagnosticBitrate: number;
}>;

/** Retained public encoder packet evidence used to verify full-film cadence. */
type TheHoursVideoOutput = Readonly<{
	/** All encoded video packets in delivery order. */ packets: readonly TheHoursEncodedPacket[];
}>;

/** Exact encoded-packet position and presentation timestamp. */
type TheHoursEncodedPacket = Readonly<{
	/** Zero-based position in the finalized video packet roster. */ packetIndex: number;
	/** Exact original30FPS rounded presentation timestamp. */ timestampMicroseconds: number;
}>;

/** Bounded full-film outcome fields consumed by the delivery owner. */
type TheHoursFilmQualificationSummary = Readonly<{
	/** Exact closed native-film parent root. */ parentRoot: string;
	/** Aggregate full-film scientific result. */ pass: boolean;
}>;

/** Concrete linked review-media index with an explicit human inspection gate. */
type TheHoursDeliveryResult = Readonly<{
	/** Automated full-film scientific result, independent of delivery completion. */ automatedPass: boolean;
	/** Required native-resolution owner acceptance remains pending. */ ownerInspection: string;
	/** Unannotated originals and synchronized derived comparisons. */ links: readonly Readonly<{
		/** Human-readable artifact description. */ label: string;
		/** Task-local relative media reference. */ href: string;
	}>[];
}>;
/** Repository-derived output ownership and authenticated immutable-parent access. */
interface TheHoursRunCapability {
	/** Absolute root derived from the owning repository module. */ readonly repositoryRoot: string;
	/** Allocate one exclusive run. */ allocate(label: string): Promise<string>;
	/** Resolve an ordinary immutable parent artifact. */ parentPath(relative: string): Promise<string>;
	/** Authenticate exact parent bytes. */ authenticate(
		expected: TheHoursArtifactIdentity,
	): Promise<TheHoursArtifactIdentity>;
	/** Read a bounded authenticated parent value. */ parentJson(expected: TheHoursArtifactIdentity): Promise<unknown>;
	/** Create an exclusive output directory. */ directory(relative: string): Promise<string>;
	/** Resolve an ordinary output artifact. */ outputPath(relative: string): Promise<string>;
	/** Write one new output artifact. */ write(relative: string, bytes: string | Uint8Array): Promise<void>;
	/** Write one new JSON artifact. */ writeJson(relative: string, value: unknown): Promise<void>;
	/** Append active progress. */ progress(value: Readonly<Record<string, unknown>>): Promise<void>;
	/** Seal output once with its honest disposition. */ finish(
		disposition: TheHoursRunDisposition,
		result: unknown,
	): Promise<string>;
}
