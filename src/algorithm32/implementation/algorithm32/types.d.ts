/** Production-shaped model doubles used by facade specifications. */
type Algorithm32FacadeModelDoubles = {
	/** Light-source model double. */
	readonly lightSource: object;
	/** Atmosphere model double. */
	readonly atmosphere: object;
	/** Geometry model double. */
	readonly geometry: object;
};

/** Facade-accepted configuration normalized without cloning component models or an explicit profile. */
type Algorithm32ResolvedConfig =
	| (LegacyConfig & Readonly<{readonly execution: ExecutionConfig; readonly shader: ShaderRuntimeConfig}>)
	| (ExecutionProfileConfig & Readonly<{readonly shader: ShaderRuntimeConfig}>);

/** Optional lifecycle context for one shader build. */
type ShaderBuildRequestOptions = {
	/** Previously installed result eligible for exact source-controller reuse. */
	readonly previousBuildResult?: ShaderBuildResult;
	/** Cancellation signal for source-owned cache construction. */
	readonly signal?: AbortSignal;
};

/** Complete unpublished Algorithm32 facade configuration replacement. */
type Algorithm32PreparedConfig = {
	/** Facade version against which the replacement was prepared. */
	readonly baseVersion: number;
	/** Facade version published with the replacement. */
	readonly version: number;
	/** Accepted facade configuration with internal native values. */
	readonly config: Algorithm32ResolvedConfig;
	/** Prepared shared model. */
	readonly model: SharedModel;
	/** Prepared CPU/reference collaborator. */
	readonly reference: ReferenceExecution;
	/** Prepared receiver-local lighting and exposure calculator. */
	readonly localLightLevelCalculator: LocalLightLevelCalculator;
	readonly receiverEnvironmentLightController: ReceiverEnvironmentLightController;
	/** Initial unsmoothed exposure modifier derived from the receiver-local brightness proxy. */
	readonly exposureModifier: number;
	/** Initial receiver-local brightness proxy; Ferwerda protects exact zero in its equations. */
	readonly brightnessProxy: number;
	/** Initial receiver total-horizontal photopic illuminance in lux. */
	readonly totalHorizontalIlluminance: number;
	/** Initial physical-sky median approximation for stellar presentation. */
	readonly stellarAdaptationLuminance: number;
	readonly receiverLightIdentity: string;
	/** Initial configured source brightness used for the scene-luminance scale. */
	readonly sourceBrightness: number;
	/** Prepared runtime shader-build coordinator. */
	readonly shaderBuilder: ShaderBuildCoordinator;
	/** Public snapshot corresponding to the prepared replacement. */
	readonly snapshot: ConfigSnapshot;
};

/** Facade operations used by one installed Algorithm32 shader handle. */
interface Algorithm32ShaderHandleFacade {
	/** Call this method to adopt a fully prepared receiver state at the live scene publication boundary. */
	_adoptPreparedReceiverLight(measurement: ReceiverEnvironmentLightMeasurement): void;
	readonly _model: SharedModel;
	readonly _localLightLevelCalculator: LocalLightLevelCalculator;
	_publishReceiverEnvironmentLight(
		request: ReceiverEnvironmentLightBuildRequest,
	): Promise<ReceiverEnvironmentLightMeasurement>;
	/**
	 * Called by algorithm32 shader handle facade to prepare a replacement facade configuration without publishing it.
	 * @param config - The config value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_prepareConfig(config: Config): Algorithm32PreparedConfig;

	/**
	 * Called by algorithm32 shader handle facade to create a shader build request from accepted facade state.
	 * @param setup - The setup value accepted by the operation.
	 * @param config - The config value accepted by the operation.
	 * @param options - The optional operation choices.
	 * @returns - The result produced by the operation.
	 */
	_createShaderBuildRequest(
		setup: ShaderSetupRequest,
		config: ConfigSnapshot,
		options?: ShaderBuildRequestOptions,
	): ShaderBuildRequest;

	/**
	 * Called by algorithm32 shader handle facade to publish one completely prepared facade configuration.
	 * @param prepared - The prepared value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	_commitPreparedConfig(prepared: Algorithm32PreparedConfig): ConfigSnapshot;

	/**
	 * Called by algorithm32 shader handle facade to dispose collaborators belonging to an unpublished configuration.
	 * @param prepared - The prepared value accepted by the operation.
	 */
	_discardPreparedConfig(prepared: Algorithm32PreparedConfig): void;

	/**
	 * Called by algorithm32 shader handle facade to forget one disposed shader handle.
	 * @param handle - The handle value accepted by the operation.
	 */
	_forgetShaderHandle(handle: ShaderHandle): void;
}

/** Facade ownership and installed runtime state for one Algorithm32 shader handle. */
type Algorithm32ShaderHandleState = {
	/** Facade that owns the handle. */
	readonly facade: Algorithm32ShaderHandleFacade;
	/** Original shader setup request used for rebuilds. */
	readonly setup: ShaderSetupRequest;
	/** Currently installed shader build result. */
	readonly buildResult: ShaderBuildResult;
};
/** Independent receiver-light preparation for an unpublished live scene. */
type Algorithm32ReceiverPreparationRequest = {
	/** Renderer library capability. */ THREE: unknown;
	/** Renderer used for bounded environment sampling. */ renderer: unknown;
	/** Renderer-owned cache and reduction backend. */ backend: CacheGpuBackend & CacheProbeReader;
	/** Candidate configured physical geometry. */ geometry: GeometryModel;
	/** Candidate configured distant source with unchanged irradiance and radius. */ lightSource: LightSourceModel &
		DistantSunCelestialSource;
	/** Candidate observation. */ observation: GeometryObservation;
	/** Borrowed complete candidate cache facade. */ scatteringCache: GpuScatteringCache;
	/** Complete candidate selection identity. */ identity: string;
	/** Preparation cancellation. */ signal?: AbortSignal;
	/** Optional derived environment sample; exact-time direct spectra are computed by the physical owner. */ environmentSample?: ReceiverEnvironmentSample;
};
