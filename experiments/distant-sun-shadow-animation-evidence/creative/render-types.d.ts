/** Renderer-independent camera configuration supplied by the creative adapter. */
type CreativeCameraConfiguration = {
	/** Caller-owned perspective camera from the live Three runtime. */
	camera: CreativePerspectiveCamera;
	/** Complete film duration in seconds. */
	durationSeconds: number;
};
/** Exact scene-space camera pose retained for deterministic playback. */
type CreativeCameraSnapshot = {
	/** Observer-local east/up/south camera position in meters. */
	positionMeters: number[];
	/** Unit scene-space viewing direction. */
	viewDirection: number[];
	/** Vertical field of view in degrees. */
	fieldOfViewDegrees: number;
	/** Viewing elevation above the horizon in degrees. */
	elevationDegrees: number;
};
/** Existing Three vector coordinates with the camera's coordinate assignment capability. */
type CreativeCameraVector = ThreeCacheBackendVector3 & {
	/** Direct coordinate assignment in the existing Three object. */
	set(x: number, y: number, z: number): object;
};

/** Narrow caller-owned Three perspective-camera capability used by choreography. */
interface CreativePerspectiveCamera {
	/** Near clipping plane in scene kilometers. */
	near: number;
	/** Far clipping plane in scene kilometers. */
	far: number;
	/** Vertical field of view in degrees. */
	fov: number;
	/** Mutable observer-local camera position. */
	position: CreativeCameraVector;
	/** Mutable scene up direction. */
	up: CreativeCameraVector;
	/** Call this method to direct the camera toward one scene position. */
	lookAt(x: number, y: number, z: number): void;
	/** Call this method to publish clipping and field-of-view changes. */
	updateProjectionMatrix(): void;
	/** Call this method to publish the current camera transform. */
	updateMatrixWorld(force: boolean): void;
}

/** Current scene and its independently owned spectral-light description. */
type CreativeSceneSummary = ObservatorySceneDescription & DesertSceneLightingDescription;

/** Creative endpoint wrapper accepted by the unchanged production mode controller. */
interface CreativeEndpointScene {
	/** Call this method to report the installed creative endpoint. */
	install(): CreativeSceneSummary;
	/** Call this method to retain the same endpoint across atmospheric mode changes. */
	applyMode(): void;
	/** Call this method to describe the scene and its current spectral illumination. */
	describe(): CreativeSceneSummary;
	/** Call this method to publish the current source direction and spectral light. */
	updateDistantSunLighting(direction: UnitVector3, receiver: ReceiverEnvironmentLightMeasurement, color: Color): void;
	/** Call this method to report exact scene endpoint positions for atmospheric integration. */
	getSceneDepthEndpointPositions(): readonly ScenePosition[];
	/** Call this method to dispose the owned scene and light resources. */
	dispose(): void;
}

/** Shader runtime failure facts used to reject a fallback frame. */
type CreativeAtmosphereDiagnostics = {
	/** Runtime facts when an installed production shader exists. */
	runtime?: {
		/** Number of failed composer frames. */
		renderErrorCount?: number;
		/** Most recent render error, if any. */
		lastRenderError?: string | null;
	};
};

/** Failure facts from one source-local generation stage. */
type CreativeGenerationDiagnostics = {
	/** Number of failed atomic source generations. */
	failedGenerationCount: number;
	/** Most recent generation error, if any. */
	lastError: string | null;
};

/** Joint source publication and child failure facts required for a valid frame. */
type CreativeCelestialDiagnostics = {
	/** Existing all-or-zero atomic source publication. */
	publicationState: CelestialGenerationPublicationState;
	/** Required source-local Sun generation facts. */
	sun: CreativeGenerationDiagnostics;
	/** Stellar generation facts when the selected mode includes stars. */
	stellar: CreativeGenerationDiagnostics | null;
};

/** Resident creative runtime with explicit production failure and endpoint hooks. */
type CreativeRenderRuntime = CreativeSolarRuntime & {
	/** Whether atmosphere rendering remains installed instead of the direct fallback. */
	_installed: boolean;
	/** Endpoint wrapper updated without replacing production source. */
	_endpointScene: CreativeEndpointScene;
	/** Existing shader handle with its diagnostic and source-publication operations. */
	_shaderHandle: CreativeSolarShaderHandle & {
		/** Current source generation coordinator. */
		_buildResult: {
			/** Existing exact-time hooks with publication diagnostics. */
			celestialGenerationParticipant: CreativeSolarCelestial & {
				/** Call this method to invalidate source output before rendering. */
				markDirty(reason: CelestialGenerationDirtyReason): void;
				/** Call this method to report joint source completion and errors. */
				getDiagnostics(): CreativeCelestialDiagnostics;
			};
		};
		/** Call this method to inspect installed atmosphere-frame diagnostics. */
		getDiagnostics(): CreativeAtmosphereDiagnostics;
	};
};

/** Isolated application adapter extending the existing astronomical integration contract. */
type CreativeApplication = CreativeSolarApplication & {
	/** Existing scene, camera, and deterministic render callback. */
	_sceneRuntime: {
		/** Caller-owned Three scene consumed through the scene owner's scoped contract. */
		scene: object;
		/** Existing Three perspective camera. */
		camera: CreativePerspectiveCamera;
		/** Existing native-resolution WebGL canvas. */
		canvas: HTMLCanvasElement;
		/** Call this method to render exactly one complete scene/atmosphere frame. */
		_renderOperation(): void;
	};
	/** Production controller's current scene and installed renderer. */
	_modeController: {
		/** Resident mode with the geometry-owned ground construction capability. */
		_activeMode: CreativeSolarMode & {/** Physical ground mapper. */ geometry: ObservatoryGroundGeometry};
		/** Resident physical renderer and failure state. */
		_activeRuntime: CreativeRenderRuntime;
		/** Endpoint retained across mode changes. */
		_endpointScene: CreativeEndpointScene;
	};
	/** Creative scene/light wrapper installed in the unchanged application. */
	_endpointScene: CreativeEndpointScene;
	/** Current endpoint description retained by the application. */
	_sceneSummary: CreativeSceneSummary;
};

/** Native packet constructor retrieved from a live packet without duplicating its module graph. */
type CreativeSpectralPacketConstructor = new (definition: SpectralPacketDefinition) => SpectralPacket;
/** Browser render ingress owned and validated by the Node launcher. */
type CreativeRenderConfiguration = {
	/** Requested preview or full-film operation. */
	mode: CreativeNodeMode;
	/** Native output width in pixels. */
	width: number;
	/** Native output height in pixels. */
	height: number;
	/** Fixed output frame rate. */
	framesPerSecond: number;
	/** Complete film duration in seconds. */
	durationSeconds: number;
	/** Deterministic scene seed. */
	seed: number;
	/** Exact pinned Three ESM URL. */
	threeModuleUrl: string;
	/** Exact pinned Mediabunny ESM URL. */
	mediabunnyModuleUrl: string;
};
/** One retained ideal frame's application-independent description. */
type CreativeFrameTrace = {
	/** Exact ideal film time in seconds. */
	animationSeconds: number;
	/** Exact physical observation time in canonical ISO UTC. */
	instant: string;
	/** Solar zenith in degrees. */
	solarZenithDegrees: number;
	/** Unit model-space direction toward the Sun. */
	directionToSunModel: UnitVector3;
	/** Exact camera pose retained for replay. */
	camera: CreativeCameraSnapshot;
	/** Resident scattering cache or procedural-dark identity. */
	cacheIdentity: string;
	/** Whether this frame rebuilt the physical GPU runtime. */
	modeChanged: boolean;
	/** Exact/interpolated physical receiver-light derivation identity. */
	receiverLightIdentity: string;
	/** Current local scene illumination and shadow state. */
	lighting: DesertSceneLightingDescription;
};

/** Typed animation state carried through the shared recorder's opaque state boundary. */
type CreativeReplayState = {/** Ideal film position in seconds. */ animationSeconds: number};

/** Shared codec-selection publication retained by the creative renderer. */
type CreativeEncoderSelection = Readonly<{
	/** Candidate proven by a real encoder probe. */
	selectedCandidateId: string;
	/** Existing generic selection's normalized WebCodecs fields. */
	selectedConfig: Readonly<Record<string, unknown>>;
	/** Every attempted capability probe in order. */
	outcomes: readonly AnimationEvidenceEncoderProbe[];
}>;

/** Creative render publication with complete recoverable scene/media metadata. */
type CreativeRenderResult = {
	/** Authored film title. */
	title: string;
	/** Explicit offline ideal-cadence capture policy. */
	approach: string;
	/** Validated launcher configuration. */
	configuration: CreativeRenderConfiguration;
	/** Deterministic scene construction facts. */
	scene: ObservatorySceneDescription;
	/** Astronomical timing and physical-light derivation. */
	solar: CreativeSolarDescription;
	/** Node-owned PNG artifact receipts. */
	snapshots: unknown[];
	/** Encoder probe evidence when recording video. */
	encoderSelection: CreativeEncoderSelection | null;
	/** Shared deterministic recorder result when recording video. */
	recording: AnimationEvidenceRecorderResult | null;
	/** Final WebGL error enumeration. */
	webglError: number;
	/** Final WebGL context-loss flag. */
	contextLost: boolean;
};
/** Explicit browser bridge installed only by the contained launcher. */
interface Window {
	/** Read-only-source application instance owned by this capture. */
	__creativeApplication: CreativeApplication;
	/** Matching Three namespace from the existing browser bundle. */
	__creativeThree: object;
	/** Native bundled spectral-light evaluator, preserving packet class identity. */
	__creativeNeutralLambertianSceneLighting: new () => ObservatoryLambertianEvaluator;
	/** Native bundled neutral-reflectance constant used by the renderer bridge. */
	__creativeNeutralReflectance: number;
	/** Bounded PNG publication bridge. */
	__creativeCapture(name: string, dataUrl: string): Promise<unknown>;
	/** Ordered, offset-checked video byte publication bridge. */
	__creativeWriteVideoChunk(index: number, byteOffset: number, base64: string): Promise<unknown>;
	/** Single final media publication bridge. */
	__creativeFinalizeVideo(metadata: Record<string, unknown>): Promise<unknown>;
	/** One-time recoverable animation trace publication bridge. */
	__creativeWriteTrace(trace: Record<string, unknown>): Promise<unknown>;
	/** Progress record publication bridge. */
	__creativeProgress(event: CreativeNodeProgress): Promise<void>;
}
