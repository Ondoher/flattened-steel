/** Type that configures numerical execution behavior for one Algorithm32 facade instance. */
type ExecutionConfig = {
	/** Value that stores default view-path interval count for CPU/reference evaluation. */
	pathIntervalCount?: number;

	/** Value that stores source transmittance integration count when source paths need it. */
	sourceTransmittanceIntervalCount?: number;

	/** Value that selects the cumulative cache maximum. Omission resolves to order 4 at the facade boundary. */
	maximumScatteringOrder?: SupportedCacheScatteringOrder;

	/** Value that stores optional shader transport optimization facts. */
	pathSampleDistribution?: ShaderPathSampleDistribution | null;
};

/**
 * View-path sample-distribution policy.
 *
 * - **"uniform-distance"** - Equal-distance placement along the view path.
 * - **"quadratic-near-observer-v1"** - Quadratic interval boundaries with one midpoint sample per interval.
 * - **"tangent-density-adaptive-v1"** - Full tangent-density adaptive placement.
 * - **"tangent-density-adaptive-soft-v1"** - Soft-blended tangent-density adaptive placement.
 */
type ShaderPathSampleDistributionKind =
	| 'uniform-distance'
	| 'quadratic-near-observer-v1'
	| 'tangent-density-adaptive-v1'
	| 'tangent-density-adaptive-soft-v1';

/** Type that configures shader view-path sample placement. */
type ShaderPathSampleDistribution = {
	/** Value that identifies the sample-distribution policy. */
	kind: ShaderPathSampleDistributionKind;
};

/** Legacy application configuration from which Algorithm32 assembles the Native-15 execution profile. */
type LegacyConfig = {
	/** Value that provides the configured light-source model used by Algorithm32 evaluation and shader setup. */
	lightSource: LightSourceModel;

	/** Value that provides the configured atmosphere model used by Algorithm32 evaluation and shader setup. */
	atmosphere: AtmosphereModel;

	/** Value that provides the configured geometry model used by Algorithm32 evaluation and shader setup. */
	geometry: GeometryModel;

	/** Construction-time geographic observation configured on geometry and the atmospheric light source. */
	observation: GeometryObservation;

	/** Optional exact geometry placement selected by a manifest-backed source state. */
	sourcePlacement?: GeometryResolvedLightSourcePlacement;

	/** Optional celestial source roster normalized into the Native-15 execution profile. */
	celestialSources?: CelestialSourceRoster | null;

	/** Value that provides the configured ground boundary used by cache construction, or omit it to select the canonical black-ground behavior. */
	groundBoundary?: GroundBoundary | null;

	/** Value that provides optional configured display conversion used by shader setup and CPU/offline display tooling. */
	color?: Color;
	/** Optional ordered view-presentation filter owner. */
	presentationFilterRegistry?: ViewPresentationFilterRegistry | null;

	/** Value that configures numerical execution behavior. */
	execution?: ExecutionConfig;

	/** Value that configures optional runtime shader behavior. */
	shader?: ShaderRuntimeConfig;

	/** Explicit execution profiles are mutually exclusive with legacy component configuration. */
	profile?: never;
};

/** Complete execution-profile configuration supplied by a trusted profile owner. */
type ExecutionProfileConfig = {
	/** Complete value-agnostic profile retained exactly by the aggregate model. */
	profile: Algorithm32ExecutionProfile;
	/** Optional display conversion used by shader setup and CPU/offline display tooling. */
	color?: Color;
	/** Optional ordered view-presentation filter owner. */
	presentationFilterRegistry?: ViewPresentationFilterRegistry | null;
	/** Optional runtime shader behavior. */
	shader?: ShaderRuntimeConfig;
	/** Legacy component fields cannot be mixed with an explicit profile. */
	lightSource?: never;
	atmosphere?: never;
	geometry?: never;
	observation?: never;
	sourcePlacement?: never;
	groundBoundary?: never;
	execution?: never;
	celestialSources?: never;
};

/** Type that configures one Algorithm32 facade instance through exactly one construction form. */
type Config = LegacyConfig | ExecutionProfileConfig;

/** Type that describes the accepted configuration state of one facade instance. */
type ConfigSnapshot = {
	/** Value that stores the accepted facade configuration. */
	config: Config;

	/** Value that stores the monotonically increasing configuration version. */
	version: number;
};

/** Public Algorithm32 facade lifecycle and evaluation contract. */
interface Algorithm32Facade {
	/** Current accepted facade configuration snapshot. */
	readonly config: ConfigSnapshot;
	/** Current receiver-local Color brightness proxy. */
	readonly brightnessProxy: UnitValue<'cd m^-2'>;
	/** Current receiver total-horizontal photopic illuminance used by Color Reset. */
	readonly totalHorizontalIlluminance: UnitValue<'lux'>;
	/** Last complete direct, diffuse, and total-horizontal receiver-light publication. */
	readonly receiverLight: ReceiverEnvironmentLightMeasurement;
	/** Current configured light-source photopic brightness. */
	readonly sourceBrightness: UnitValue<'cd m^-2'>;

	/**
	 * Call this method to replace the complete facade configuration synchronously.
	 *
	 * @param config - The replacement configuration.
	 * @returns - The accepted configuration snapshot.
	 */
	setConfig(config: Config): ConfigSnapshot;

	/**
	 * Publish the current receiver-local adapting luminance and update the unsmoothed global Color exposure target.
	 * @param adaptingLuminanceProxy - Current receiver-local adapting luminance.
	 * @returns - Accepted luminance and derived target modifier.
	 */
	setAdaptingLuminance(adaptingLuminanceProxy: UnitValue<'cd m^-2'>): LocalExposureAdaptation;

	/**
	 * Call this method to build and attach one runtime shader integration.
	 *
	 * @param request - Caller-owned renderer attachment values.
	 * @returns - The installed shader handle.
	 */
	setupShader(request: ShaderSetupRequest): Promise<ShaderHandle>;

	/**
	 * Call this method to evaluate one CPU/reference view request.
	 *
	 * @param request - The evaluation request.
	 * @returns - The spectral evaluation result.
	 */
	evaluate(request: EvaluationRequest): EvaluationResult;

	/** Call this method to dispose facade-owned resources idempotently. */
	dispose(): void;
}

/** Type that configures optional runtime shader behavior. */
type ShaderRuntimeConfig = {
	/** Value that selects the runtime shader mode. */
	mode?: string;

	/** Value that stores the largest renderer-produced scene-hit distance encoded for the runtime shader. */
	sceneDepthMax?: Distance;

	/** Value that stores the renderer scene-to-physical scale. */
	sceneScale?: SceneScale;

	/** Value that configures shader cache/resource policy. */
	cachePolicy?: unknown;

	/** Value that configures runtime capability failure policy. */
	capabilityPolicy?: unknown;

	/** Value that configures render-target, HDR, depth, and color-space policy. */
	renderTargetPolicy?: unknown;
};

/** Type that provides caller-owned Three/runtime handles for shader setup. */
type ShaderSetupRequest = {
	/** Value that provides the caller's existing postprocess composer. */
	composer: unknown;

	/** Value that provides the scene rendered before the Algorithm32 atmosphere pass. */
	scene: unknown;

	/** Value that provides the camera used to render the scene and derive atmosphere rays. */
	camera: unknown;

	/** Value that provides the optional Three namespace when the integration needs caller constructors. */
	THREE?: unknown;

	/** Value that provides the composer-owned opaque GPU cache backend used by every cache controller attached to this composer. */
	cacheBackend: CacheGpuBackend;

	/** Optional callback that yields cache construction at executor-defined boundaries. */
	cacheBuildScheduler?: CacheBuildScheduler;
	/** Additional owned GPU bytes including old frames, other caches and shader/shadow resources; required for explicit compact selection. */
	otherOwnedGpuBytes?: UnitValue<'bytes'>;

	/** Cancel an in-progress source-owned cache construction. */
	signal?: AbortSignal;

	/** Value that provides initial viewport dimensions for setup-created runtime resources. The composer may later resize the installed pass. */
	viewportSize: PixelSize;

	/** Value that provides the largest renderer-produced scene-hit distance encoded for the runtime shader. */
	sceneDepthMax?: Distance;

	/** Value that provides the renderer scene-to-physical scale. */
	sceneScale?: SceneScale;

	/** Value that provides an optional runtime logger for non-fatal frame failures. */
	logger?: Console;

	/** Value that provides an optional shader-pass performance callback. When omitted, the runtime does not create pass timers or GPU timer queries. */
	performanceCallback?: ShaderPerformanceCallback;

	/** Value that provides the pass invocation cadence for performance timer samples. Defaults to every frame when omitted. */
	performanceSampleIntervalFrames?: number;

	/**
	 * Limit unresolved GPU timer queries per timed pass. Defaults to one.
	 */
	performanceMaxPendingQueries?: number;

	/** Value that provides optional initial runtime binding values by shader value key. */
	bindingValues?: Record<string, unknown>;
};

/**
 * Shader-pass performance event phase.
 *
 * - **"cpu-submit"** - CPU submission timing sample.
 * - **"gpu-elapsed"** - Completed GPU elapsed-time sample.
 * - **"gpu-query-error"** - GPU timing-query failure sample.
 */
type ShaderPerformanceEvent = 'cpu-submit' | 'gpu-elapsed' | 'gpu-query-error';

/** Type that describes one optional shader-pass performance sample. */
type ShaderPerformanceSample = {
	/** Value that stores the pass that produced the sample. */
	passName: string;

	/** Value that stores the event phase for the sample. */
	event: ShaderPerformanceEvent;

	/** Value that stores the correlated sample id shared by CPU and GPU events. */
	sampleId: number;

	/** Value that stores callback emission time. */
	timestamp: Duration;

	/** Value that stores CPU submit duration when available. */
	cpuSubmitDuration?: Duration;

	/** Value that stores GPU elapsed duration when available. */
	gpuDuration?: Duration | null;

	/** Value that stores whether GPU timer query support was available. */
	gpuAvailable?: boolean;

	/** Value that stores whether the GPU disjoint flag invalidated the sample. */
	disjoint?: boolean;

	/** Value that stores optional failure detail for timer-query setup/readback. */
	errorMessage?: string;

	/**
	 * Allow pass-specific metadata.
	 */
	[key: string]: unknown;
};

/** Operation that receives one completed shader performance sample. */
type ShaderPerformanceCallback =
	/**
	 * Called by shader performance measurement to publish one completed sample.
	 * @param sample - The completed performance sample.
	 */ (sample: ShaderPerformanceSample) => void;

/**
 * Control an installed Algorithm32 runtime shader integration.
 */
interface ShaderHandle {
	/** Call this method to measure a complete candidate receiver state without publishing it. */
	prepareReceiverEnvironmentLight(
		request: Algorithm32ReceiverPreparationRequest,
	): Promise<ReceiverEnvironmentLightMeasurement>;
	/** Call this method to publish matching prepared receiver light and celestial observation. */
	publishReceiverEnvironmentLight(
		measurement: ReceiverEnvironmentLightMeasurement,
		observation: GeometryObservation,
	): void;
	/** Measure the installed common-path environment and publish complete receiver light. */
	measureReceiverEnvironmentLight(
		request: Readonly<{
			readonly THREE: unknown;
			readonly renderer: ShaderRuntimePassRenderer;
			readonly backend: CacheGpuBackend & CacheProbeReader;
			readonly signal?: AbortSignal;
			readonly diagnostics?: boolean;
		}>,
	): Promise<ReceiverEnvironmentLightMeasurement>;
	/**
	 * Call this method to prepare the installed runtime program for its first render.
	 *
	 * @param renderer - Supplies the runtime renderer.
	 * @returns - The result produced by the operation.
	 */
	prepare(renderer: ShaderRuntimePassRenderer): Promise<void>;

	/** Mark installed celestial screen products dirty without rebuilding the shader graph. */
	markCelestialViewDirty(): void;

	/** Invalidate renderer-owned celestial resources after WebGL context loss. */
	handleContextLoss(): void;

	/** Require normal celestial regeneration after WebGL context restoration. */
	handleContextRestoration(): void;

	/**
	 * Call this method to replace the facade/runtime shader configuration and refresh resources required by the installed pass.
	 *
	 * @param config - Supplies the replacement Algorithm32 configuration.
	 * @returns - The accepted configuration snapshot.
	 */
	setConfig(config: Config, options?: ConfigReplacementOptions): Promise<ConfigSnapshot>;

	/**
	 * Call this method to return deferred shader diagnostics placeholder data.
	 *
	 * @returns - Deferred diagnostics placeholder data.
	 */
	getDiagnostics(): unknown;

	/**
	 * Call this method to dispose resources owned by the installed runtime shader integration.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Type that describes one CPU/reference evaluation request. */
type EvaluationRequest = {
	/** Value that stores an optional geometry-owned view-ray request packet. */
	viewRay?: GeometryViewRayRequest;

	/** Override the configured cumulative CPU scattering cache. */
	scatteringCache?: CpuScatteringCache;
};

/** Type that describes one CPU/reference evaluation result. */
type EvaluationResult = {
	/** Value that stores spectral path radiance aligned to the configured spectral basis. */
	pathRadiance: SpectralRadiancePacket;

	/** Value that stores spectral transmittance aligned to the configured spectral basis. */
	transmittance: SpectralTransmittancePacket;

	/** Value that stores the geometry-resolved ray segment used for validation. */
	viewRaySegment?: RaySegment;

	/** Value that stores path integration points used for validation. */
	pathIntegrationPoints?: readonly PathIntegrationPoint[];
};
