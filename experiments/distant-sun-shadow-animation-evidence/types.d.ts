/**
 * Schema identity for the checked-in initial-still control.
 *
 * - **"distant-sun-shadow-animation-evidence-initial-still-control-v1"** - Initial still control schema.
 */
type ShadowStillControlSchemaId = 'distant-sun-shadow-animation-evidence-initial-still-control-v1';

/**
 * Schema identity for an initial-still result.
 *
 * - **"distant-sun-shadow-animation-evidence-initial-still-result-v1"** - Initial still result schema.
 */
type ShadowStillResultSchemaId = 'distant-sun-shadow-animation-evidence-initial-still-result-v1';

/**
 * Schema identity for an initial-still artifact manifest.
 *
 * - **"distant-sun-shadow-animation-evidence-artifact-manifest-v1"** - Initial still artifact-manifest schema.
 */
type ShadowStillManifestSchemaId = 'distant-sun-shadow-animation-evidence-artifact-manifest-v1';

/**
 * Terminal qualification state owned by an immutable still run.
 *
 * - **"accepted"** - Every executable qualification gate passed.
 * - **"rejected"** - The run completed but at least one qualification gate failed.
 */
type ShadowStillTerminalState = 'accepted' | 'rejected';

/**
 * Terminal progress state written by the runner lifecycle.
 *
 * - **"accepted"** - Every executable qualification gate passed.
 * - **"rejected"** - The run completed but at least one qualification gate failed.
 * - **"failed"** - Infrastructure or execution prevented qualification.
 */
type ShadowStillProgressTerminalState = ShadowStillTerminalState | 'failed';

/**
 * Pinned scene location selected by the initial-still control.
 *
 * - **"San Jose"** - Production San Jose astronomical observation preset.
 */
type ShadowStillLocation = 'San Jose';

/**
 * Lossless image encoding selected by the initial-still control.
 *
 * - **"png"** - Lossless Portable Network Graphics capture.
 */
type ShadowStillCaptureFormat = 'png';

/** Content identity of one immutable parent file. */
type ShadowStillParentControl = Readonly<{
	/** Repository-relative path of the parent file. */
	path: string;
	/** Lowercase SHA-256 digest that the parent file must retain. */
	sha256: string;
}>;

/** Camera parameters that own the initial still's reproducible composition. */
type ShadowStillCameraControl = Readonly<{
	/** Vertical perspective field of view in degrees. */
	verticalFieldOfViewDegrees: number;
	/** Stable identifier for the camera-direction construction policy. */
	directionPolicy: string;
	/** Dimensionless contribution of the computed sunset vector. */
	futureSunsetDirectionWeight: number;
	/** Dimensionless contribution of the canonical negative-Z box line. */
	canonicalBoxLineDirectionWeight: number;
	/** Dimensionless downward scene-vector component used for foreground framing. */
	downwardFramingComponent: number;
}>;

/** Pixel dimensions and encoding owned by the initial-still capture. */
type ShadowStillCaptureControl = Readonly<{
	/** Native capture width in pixels. */
	width: number;
	/** Native capture height in pixels. */
	height: number;
	/** Lossless image encoding for the capture. */
	format: ShadowStillCaptureFormat;
}>;

/** Expected production review-object and shadow-map counts and dimensions. */
type ShadowStillSceneControl = Readonly<{
	/** Required number of visible production review-object shadow casters. */
	expectedReviewObjectCount: number;
	/** Required number of allocated per-object shadow maps. */
	expectedShadowMapCount: number;
	/** Required shadow-map width in pixels. */
	expectedShadowMapWidth: number;
	/** Required shadow-map height in pixels. */
	expectedShadowMapHeight: number;
}>;

/** Complete immutable input contract for the initial still. */
type ShadowStillControl = Readonly<{
	/** Versioned schema identity for this control. */
	schemaId: ShadowStillControlSchemaId;
	/** Immutable production and prior-experiment inputs authenticated before execution. */
	parents: readonly ShadowStillParentControl[];
	/** Exact loopback production application URL used by the browser. */
	productionUrl: string;
	/** Production astronomical location selected for the scene. */
	location: ShadowStillLocation;
	/** Zero-based production globe-time preset index for sunset. */
	globeTimePresetIndex: number;
	/** Signed offset from computed sunset in minutes. */
	sunsetOffsetMinutes: number;
	/** Camera composition parameters. */
	camera: ShadowStillCameraControl;
	/** Lossless native image-output parameters. */
	capture: ShadowStillCaptureControl;
	/** Expected production scene and shadow resources. */
	scene: ShadowStillSceneControl;
}>;

/** Aggregate display-pixel measurements derived from the lossless capture. */
type ShadowStillPixelInspection = Readonly<{
	/** Decoded image width in pixels. */
	width: number;
	/** Decoded image height in pixels. */
	height: number;
	/** Count of distinct RGB triplets in the deterministic sampled-pixel subset. */
	uniqueSampledColors: number;
	/** Mean Rec. 709 display-code luma across all decoded pixels. */
	meanLuma: number;
	/** Fraction of decoded pixels with luma below eight display-code values. */
	darkPixelFraction: number;
	/** Fraction of decoded pixels with luma above 247 display-code values. */
	brightPixelFraction: number;
}>;

/** Content identity and run-relative path of one generated artifact. */
type ShadowStillArtifactIdentity = Readonly<{
	/** Slash-separated run-relative artifact path. */
	path: string;
	/** Artifact size in bytes. */
	byteLength: number;
	/** Lowercase SHA-256 digest of the artifact bytes. */
	sha256: string;
}>;

/** Shadow-resource facts published by the production endpoint scene. */
type ShadowStillEndpointFacts = Readonly<{
	/** Number of installed shadow-casting review objects. */
	shadowCasterCount: number;
	/** Number of allocated per-object shadow maps. */
	shadowMapCount: number;
	/** Common shadow-map width in pixels. */
	shadowMapWidth: number;
	/** Common shadow-map height in pixels. */
	shadowMapHeight: number;
}>;

/** Complete dynamic production endpoint description retained by the runner. */
type ShadowStillEndpointDescription = Readonly<Record<string, unknown>>;

/** Minimum retained scene facts independently checked by the verifier. */
type ShadowStillVerifiedSceneFacts = Readonly<{
	/** Published camera vertical field of view in degrees. */
	cameraFieldOfViewDegrees: number;
	/** Published endpoint shadow-resource facts. */
	endpoint: ShadowStillEndpointFacts;
}>;

/** Minimum retained result contract independently checked after run finalization. */
type ShadowStillResult = Readonly<{
	/** Versioned schema identity for the result. */
	schemaId: ShadowStillResultSchemaId;
	/** Terminal qualification state of the completed run. */
	state: ShadowStillTerminalState;
	/** Identity of the lossless native-resolution capture. */
	capture: ShadowStillArtifactIdentity;
	/** Aggregate decoded display-pixel measurements. */
	pixels: ShadowStillPixelInspection;
	/** Camera and endpoint facts required by independent verification. */
	sceneFacts: ShadowStillVerifiedSceneFacts;
}>;

/** Retained complete identity ledger for one immutable run directory. */
type ShadowStillArtifactManifest = Readonly<{
	/** Versioned schema identity for the artifact manifest. */
	schemaId: ShadowStillManifestSchemaId;
	/** Terminal qualification state shared with the result. */
	state: ShadowStillTerminalState;
	/** Sorted identities for every manifested run artifact. */
	artifacts: readonly ShadowStillArtifactIdentity[];
	/** Lowercase SHA-256 digest of the serialized artifact identity array. */
	artifactSetSha256: string;
}>;

/** Three-component vector behavior used by the instrumented Three.js scene. */
interface ShadowStillVector3 {
	/** Scene-space X component. */
	x: number;
	/** Scene-space Y component. */
	y: number;
	/** Scene-space Z component. */
	z: number;
	/** Call this method to replace all three vector components. */
	set(x: number, y: number, z: number): void;
	/** Call this method to copy the vector components into a new array. */
	toArray(): number[];
	/** Call this method to create an independently mutable vector copy. */
	clone(): ShadowStillVector3;
	/** Call this method to add another vector-like value in place. */
	add(value: ShadowStillVectorInput): ShadowStillVector3;
	/** Call this method to project the vector through the supplied camera in place. */
	project(camera: ShadowStillCamera): ShadowStillVector3;
}

/** Readonly vector components accepted by mutable Three.js vector operations. */
type ShadowStillVectorInput = Readonly<{
	/** Scene-space X component. */
	x: number;
	/** Scene-space Y component. */
	y: number;
	/** Scene-space Z component. */
	z: number;
}>;

/** Perspective-camera behavior used to publish the experiment composition. */
interface ShadowStillCamera {
	/** Mutable vertical field of view in degrees. */
	fov: number;
	/** Mutable scene-space camera position. */
	position: ShadowStillVector3;
	/** Mutable scene-space camera up vector. */
	up: ShadowStillVector3;
	/** Call this method to orient the camera toward one scene-space point. */
	lookAt(x: number, y: number, z: number): void;
	/** Call this method to rebuild projection state after changing the field of view. */
	updateProjectionMatrix(): void;
	/** Call this method to publish the current world transform. */
	updateMatrixWorld(force: boolean): void;
}

/** Live astronomical scene state resolved by the production application. */
type ShadowStillDistantSceneState = Readonly<{
	/** Astronomical observation that owns the resolved instant. */
	observation: ShadowStillObservation;
	/** Solar zenith angle at the observation in degrees. */
	solarZenithDegrees: number;
	/** Normalized production model-space direction toward the Sun. */
	directionToSourceModel: readonly number[];
}>;

/** Astronomical observation identity retained from production state. */
type ShadowStillObservation = Readonly<{
	/** UTC ISO-8601 observation instant. */
	instant: string;
}>;

/** Active production geometry configuration inspected by the harness. */
type ShadowStillGeometryConfiguration = Readonly<{
	/** Normalized production model-space direction toward the Sun. */
	directionToSource: readonly number[];
}>;

/** Active production atmosphere geometry inspected by the harness. */
type ShadowStillGeometry = Readonly<{
	/** Current source-direction configuration. */
	configuration: ShadowStillGeometryConfiguration;
}>;

/** Active production mode inspected for publication equality. */
type ShadowStillActiveMode = Readonly<{
	/** Current spherical/distant atmosphere geometry. */
	geometry: ShadowStillGeometry;
}>;

/** Production mode-controller surface inspected by the harness. */
type ShadowStillModeController = Readonly<{
	/** Currently published render mode. */
	_activeMode: ShadowStillActiveMode;
}>;

/** Production scene-runtime surface driven by the harness. */
type ShadowStillSceneRuntime = Readonly<{
	/** Mutable perspective camera for the proof frame. */
	camera: ShadowStillCamera;
	/** WebGL canvas whose frame counter proves publication. */
	canvas: HTMLCanvasElement;
	/** Call this method to require regeneration of the dynamic shadow maps. */
	refreshShadowMaps(): void;
}>;

/** User-data fields retained on one production review mesh. */
type ShadowStillMeshUserData = Readonly<{
	/** Stable production review-object identity when the mesh is a box. */
	shadowObjectKey?: string;
}>;

/** Production endpoint mesh inspected for transform and shadow facts. */
type ShadowStillMesh = Readonly<{
	/** Three.js scene object name. */
	name: string;
	/** Mutable mapped scene-space position. */
	position: ShadowStillVector3;
	/** Whether the mesh casts into its isolated shadow layer. */
	castShadow: boolean;
	/** Whether the mesh receives directional shadows. */
	receiveShadow: boolean;
	/** Experiment-relevant production metadata. */
	userData: ShadowStillMeshUserData;
}>;

/** Allocated shadow-map dimensions inspected on a directional light. */
type ShadowStillMap = Readonly<{
	/** Allocated map width in pixels. */
	width: number;
	/** Allocated map height in pixels. */
	height: number;
}>;

/** Optional directional shadow resource inspected on a production light. */
type ShadowStillShadow = Readonly<{
	/** Allocated map, or null before allocation. */
	map?: ShadowStillMap | null;
}>;

/** User-data fields retained on one production scene light. */
type ShadowStillLightUserData = Readonly<{
	/** Current normalized scene-space direction toward the source. */
	directionToSource?: readonly number[];
}>;

/** Production scene light inspected for direction and shadow allocation. */
type ShadowStillLight = Readonly<{
	/** Three.js scene light name. */
	name: string;
	/** Current renderer light intensity. */
	intensity: number;
	/** Whether the light owns a directional shadow pass. */
	castShadow: boolean;
	/** Experiment-relevant production metadata. */
	userData: ShadowStillLightUserData;
	/** Optional directional shadow resource. */
	shadow?: ShadowStillShadow;
}>;

/** Production distant-Sun lighting surface inspected by the harness. */
type ShadowStillLighting = Readonly<{
	/** Installed production hemisphere and directional lights. */
	_lights: readonly ShadowStillLight[];
}>;

/** Production endpoint-scene surface inspected by the harness. */
type ShadowStillEndpointScene = Readonly<{
	/** Current production scene-summary operation. */
	describe(): ShadowStillEndpointDescription;
	/** Installed ground and review-object meshes. */
	_meshes: readonly ShadowStillMesh[];
	/** Installed production distant-Sun lighting owner. */
	_lighting: ShadowStillLighting;
}>;

/** Narrow production application capability exposed only inside the contained browser. */
interface ShadowStillApplication {
	/** Current production application state used to resolve astronomical input. */
	readonly _state: unknown;
	/** Pending coalesced location/time refresh timer, or null after dispatch. */
	readonly _locationTimeRefreshTimer: number | null;
	/** Production mode-publication owner. */
	readonly _modeController: ShadowStillModeController;
	/** Production Three.js runtime owner. */
	readonly _sceneRuntime: ShadowStillSceneRuntime;
	/** Production ground, review-object, and lighting owner. */
	readonly _endpointScene: ShadowStillEndpointScene;
	/** Call this method to resolve live astronomical geometry from current production state. */
	_createSphericalDistantSceneState(state: unknown): ShadowStillDistantSceneState;
}

/** Browser global extended by the contained instrumentation seam. */
interface Window {
	/** Production application exposed only in the instrumented proof page lifecycle. */
	readonly __shadowStillApplication: ShadowStillApplication;
}
