/** Options for one-time astronomical and diffuse-light preparation. */
type CreativeSolarInitializeOptions = {
	/** Complete output duration in seconds; defaults to sixty. */
	durationSeconds?: number;
	/** Premeasure one-second diffuse samples; false measures every requested frame directly. */
	prepareLighting?: boolean;
	/** Optional awaited progress publisher for long-running preparation. */
	onProgress?: (progress: CreativeSolarProgress) => void | Promise<void>;
};

/** Countable receiver-light preparation progress. */
type CreativeSolarProgress = {
	/** Current preparation phase used by the immutable run's progress publisher. */
	phase: string;
	/** Completed physical measurements. */
	completed: number;
	/** Total planned measurements. */
	total: number;
	/** Human-readable preparation state. */
	message: string;
};

/** One astronomical event and its monotone clock tangent. */
type CreativeSolarTimelineKey = {
	/** Animation position in seconds. */
	seconds: number;
	/** UTC milliseconds since the Unix epoch. */
	milliseconds: number;
	/** Event solar zenith in degrees. */
	solarZenithDegrees: number;
	/** Clock derivative in astronomical milliseconds per animation second. */
	slope: number;
};

/** One physical receiver-light sample retained for interpolation. */
type CreativeSolarLightingSample = {
	/** Animation position in seconds. */
	seconds: number;
	/** Exact sample observation in canonical ISO UTC. */
	instant: string;
	/** Complete production physical receiver-light measurement. */
	measurement: ReceiverEnvironmentLightMeasurement;
};

/** Frame state returned before camera choreography and rendering. */
type CreativeSolarFrame = {
	/** Position in the output video, in seconds. */
	animationSeconds: number;
	/** Exact astronomical observation in ISO UTC. */
	instant: string;
	/** Solar zenith in degrees. */
	solarZenithDegrees: number;
	/** Unit source direction in production model coordinates. */
	directionToSunModel: UnitVector3;
	/** Unit source direction in Three scene coordinates. */
	directionToSunScene: UnitVector3;
	/** Complete current direct and diffuse illumination. */
	receiverLight: ReceiverEnvironmentLightMeasurement;
	/** Selected production spectral display model. */
	colorDisplayModel: Color;
	/** Resident qualified scene-cache identity or procedural dark identity. */
	cacheIdentity: string;
	/** Whether this apply operation replaced the GPU runtime. */
	modeChanged: boolean;
	/** Exact-time configured geometry for caller-owned projection and scene mapping. */
	geometry: CreativeSolarGeometry;
};

/** Serializable current timeline and lighting derivation description. */
type CreativeSolarDescription = {
	/** Complete output duration in seconds. */
	durationSeconds: number;
	/** Production observation location. */
	location: string;
	/** Solved events, clock tangents, and canonical ISO instants. */
	timeline: (CreativeSolarTimelineKey & {/** Canonical ISO UTC event time. */ instant: string})[];
	/** Exact source direction at geometric sunrise, after initialization. */
	sunriseDirectionScene: UnitVector3 | null;
	/** Exact source direction at geometric sunset, after initialization. */
	sunsetDirectionScene: UnitVector3 | null;
	/** Explicit actual light-measurement and interpolation policy. */
	lightingPolicy: string;
	/** Number of retained one-second GPU receiver samples. */
	lightingSampleCount: number;
	/** Number of runtime cache transitions during preparation and rendering. */
	modeChangeCount: number;
};

/** Existing production spectral operations retaining the bundle's packet constructor identity. */
type CreativeSolarSpectralOperations = {
	/** Physical scalar multiplication with complete derivation identity. */
	scaleSpectralPacket(packet: SpectralPacket, scalar: number): SpectralPacket;
	/** Compatible physical spectrum addition with complete derivation identity. */
	addSpectralPackets(first: SpectralPacket, last: SpectralPacket): SpectralPacket;
};

/**
 * Qualified cache state used by the contained adapter.
 * - **"ready"** - Asset-backed atmospheric scattering below 108 degrees.
 * - **"dark"** - Procedural exact-zero scattering at and beyond 108 degrees.
 */
type CreativeSolarCacheState = 'ready' | 'dark';

/** Production geometry operations used by exact-time celestial publication. */
type CreativeSolarGeometry = GeometryModel &
	CelestialGeometryCapability &
	StellarScreenPaletteGeometryCapability & {
		/** Exact geometry observation and bound source direction. */
		configuration: {
			/** Canonical observation snapshot required by stellar identity. */
			observation: GeometryObservation;
			/** Unit source direction in production model coordinates. */
			directionToSource: UnitVector3;
		};
		/** Model-to-scene unit-direction mapping. */
		expressCelestialDirectionInScene(direction: UnitVector3): UnitVector3;
	};

/** CPU facade internals deliberately exposed only to this contained adapter. */
type CreativeSolarAlgorithm = {
	/** Accepted legacy production configuration and exact normalized observation. */
	config: {/** Complete accepted model configuration. */ config: LegacyConfig};
	/** Current physical receiver-light publication. */
	receiverLight: ReceiverEnvironmentLightMeasurement;
	/** Production direct/diffuse spectral combination owner. */
	_localLightLevelCalculator: LocalLightLevelCalculator;
	/** Current runtime light publication holder. */
	_receiverEnvironmentLightController: {
		/** Last complete light measurement. */ _active: ReceiverEnvironmentLightMeasurement;
	};
	/** Live physical exposure and stellar-presentation values. */
	_colorRuntimeBindingValues: Record<string, unknown>;
	/** Production exposure update from physical receiver luminance. */
	setAdaptingLuminance(luminance: UnitValue<'cd m^-2'>): unknown;
};

/** Temporary CPU mode or resident production mode used by the adapter. */
type CreativeSolarMode = {
	/** Exact configured production geometry. */
	geometry: CreativeSolarGeometry;
	/** Physical facade, measurements, and accepted configuration. */
	algorithm32: CreativeSolarAlgorithm;
	/** Source-owned immutable selected scene-cache asset. */
	lightSource: {/** Normalized placed source configuration. */ configuration: DistantSunLightSourceConfiguration};
	/** Disposal of the temporary facade without changing external geometry objects. */
	dispose(): void;
};

/** Mutable Three uniform wrapper used by the contained adapter. */
type CreativeSolarUniform = {/** Current shader value. */ value: unknown};

/** Production celestial participants with explicitly scoped mutable experiment hooks. */
type CreativeSolarCelestial = {
	/** Source-local Sun tile generation pass. */
	_sun: {
		/** Actual production Three namespace for receiver measurement. */
		_THREE: object;
		/** Current observer-local geometry. */
		_geometry: CreativeSolarGeometry;
		/** Current canonical astronomical observation. */
		_observation: GeometryObservation;
		/** Full horizon-qualified source placement. */
		_placement: CelestialResolvedPlacement;
		/** Invalidation before the caller renders. */
		markDirty(reason: CelestialGenerationDirtyReason): void;
	};
	/** Optional production stellar screen-palette generation pass. */
	_stellar: {
		/** Current exact configured geometry. */
		_geometry: CreativeSolarGeometry;
		/** Exact observation object shared with geometry. */
		_observation: GeometryObservation;
		/** Current geometry-generated astronomical uniform defaults. */
		_geometryContribution: StellarGenerationGeometryShaderContribution;
		/** Point-index draw uniform values. */
		_pointUniforms: Record<string, CreativeSolarUniform>;
		/** Sparse-palette draw uniform values. */
		_paletteUniforms: Record<string, CreativeSolarUniform>;
		/** Invalidation before the caller renders. */
		markDirty(reason: CelestialGenerationDirtyReason): void;
	} | null;
};

/** Receiver measurement dependencies already owned by the initialized runtime. */
type CreativeSolarMeasurementRequest = {
	/** Actual production Three namespace. */
	THREE: object;
	/** Existing hardware renderer. */
	renderer: object;
	/** Existing cache backend. */
	backend: object;
};

/** Scoped shader handle surface used for delegated exact-time receiver measurement. */
type CreativeSolarShaderHandle = {
	/** Facade receiving an atomic measurement; replaced only on an ephemeral adapter object. */
	_facade: CreativeSolarAlgorithm;
	/** Existing installed build and celestial participants. */
	_buildResult: {/** Current celestial generators. */ celestialGenerationParticipant: CreativeSolarCelestial};
	/** Production receiver sampler through the inherited installed cache. */
	measureReceiverEnvironmentLight(
		request: CreativeSolarMeasurementRequest,
	): Promise<ReceiverEnvironmentLightMeasurement>;
};

/** Scoped resident runtime hooks without importing the application bundle again. */
type CreativeSolarRuntime = {
	/** Installed production shader handle. */
	_shaderHandle: CreativeSolarShaderHandle;
	/** Production cache backend shared by the active shader and measurement sampler. */
	_cacheBackend: object;
	/** Composer whose physical atmosphere pass exposes mutable uniforms. */
	_composer: {
		/** Ordered production passes. */ passes: {
			/** Optional physical shader uniform map. */ uniforms?: Record<string, CreativeSolarUniform>;
		}[];
	};
};

/** Application operations required by the contained astronomical adapter. */
type CreativeSolarApplication = {
	/** Actual existing spectral operation namespace exposed from the production bundle. */
	_creativeSpectralMath: CreativeSolarSpectralOperations;
	/** Current selected observation. */
	_state: Flat32ApplicationState;
	/** Production location and clock-preset transitions. */
	_locationTimeController: {
		/** Next configured location. */
		nextLocation(state: Flat32ApplicationState): Flat32ApplicationState;
		/** Geometric sunrise, noon, or sunset preset selection. */
		selectGlobeTime(state: Flat32ApplicationState, index: number): Flat32ApplicationState;
	};
	/** Existing observer scene and deterministic rendering state. */
	_sceneRuntime: {
		/** Outstanding production animation-frame handle. */
		_frameRequest: number | null;
		/** Production RAF scheduling state. */
		_started: boolean;
		/** Existing hardware renderer. */
		renderer: object;
		/** Shadow invalidation for the complete caller-owned render. */
		refreshShadowMaps(): void;
	};
	/** Production mode transaction and current runtime. */
	_modeController: {
		/** Complete currently published mode. */
		_activeMode: CreativeSolarMode;
		/** Complete currently published GPU runtime. */
		_activeRuntime: CreativeSolarRuntime;
		/** Atomic production cache, shader, celestial, and receiver-light replacement. */
		switchTo(kind: string, state: Flat32ApplicationState): Promise<object | null>;
	};
	/** Caller-owned scene-light wrapper. */
	_endpointScene: {
		/** Current astronomical direction and physical direct/diffuse light publication. */
		updateDistantSunLighting(
			direction: UnitVector3,
			measurement: ReceiverEnvironmentLightMeasurement,
			color: Color,
		): void;
	};
	/** Cancellation of delayed UI-driven mode changes. */
	_cancelLocationTimeRefresh(): void;
	/** Pure astronomical scene-state construction. */
	_createSphericalDistantSceneState(state: Flat32ApplicationState): Flat32DistantSunSceneState<CreativeSolarGeometry>;
	/** CPU-only source, geometry, spectral color, and direct-light construction. */
	_createSphericalDistantMode(
		state: Flat32DistantSunSceneState,
		asset: DistantSunSceneCacheAssetSelection | undefined,
		cacheState: CreativeSolarCacheState,
	): CreativeSolarMode;
};
