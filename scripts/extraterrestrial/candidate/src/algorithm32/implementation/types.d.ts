/**
 * Supplies construction dependencies for the CPU/reference algorithm execution
 * collaborator.
 */
type ReferenceDependencies = {
	/**
	 * Store the facade-owned shared model consumed by reference evaluations.
	 */
	readonly model: SharedModel;

	/**
	 * Store an optional default cumulative CPU scattering cache for reference
	 * evaluation.
	 */
	readonly scatteringCache?: CpuScatteringCache;

	/**
	 * Store optional execution controls from facade configuration.
	 */
	readonly executionControls?: ExecutionConfig;

	/**
	 * Store an optional calculator double for focused tests.
	 */
	readonly calculator?: SpectralCalculator;
};

/**
 * Supplies construction dependencies for the shared spectral calculator.
 */
type SpectralCalculatorDependencies = {
	/**
	 * Store the configured geometry model.
	 */
	readonly geometry?: GeometryModel;

	/**
	 * Store the configured atmosphere model.
	 */
	readonly atmosphere?: AtmosphereModel;

	/**
	 * Store the configured light-source model.
	 */
	readonly lightSource?: LightSourceModel;

	/**
	 * Store the active spectral basis.
	 */
	readonly spectralBasis?: SpectralBasis;

	/**
	 * Store optional numerical execution controls.
	 */
	readonly executionControls?: ExecutionConfig;
};

/**
 * Describe the shared spectral-calculation surface consumed across
 * Algorithm32. The implementation class satisfies this ambient contract;
 * consumers name it directly without importing a declaration-only type.
 */
interface SpectralCalculator {
	/** Store the accepted calculation dependencies. */
	readonly dependencies: Readonly<SpectralCalculatorDependencies>;

	/** Build endpoint/trapezoid integration points for a finite ray segment. */
	buildEndpointTrapezoidPathIntegrationPoints(
		viewRaySegment: RaySegment,
		pathIntervalCount: number,
	): readonly PathIntegrationPoint[];

	/** Compute source-path transmittance from finite source optical depth. */
	computeSourceTransmittance(
		sourceOpticalDepth: SpectralOpticalDepthPacket,
	): SpectralTransmittancePacket;

	/** Compute endpoint/trapezoid transmittance for one path interval. */
	computeTrapezoidSegmentTransmittance(
		previousExtinction: SpectralExtinctionCoefficientPacket,
		currentExtinction: SpectralExtinctionCoefficientPacket,
		intervalLength: Distance,
	): SpectralTransmittancePacket;

	/** Combine scattering coefficients with their phase values. */
	computeDirectScattering(
		rayleighScattering: SpectralScatteringCoefficientPacket,
		mieScattering: SpectralScatteringCoefficientPacket,
		rayleighPhase: InverseSolidAngle,
		miePhase: InverseSolidAngle,
	): SpectralPhaseWeightedScatteringCoefficientPacket;

	/** Compute direct source in-scattering for one path point. */
	computeDirectInScattering(
		viewTransmittance: SpectralTransmittancePacket,
		sourceTransmittance: SpectralTransmittancePacket,
		sourceIrradiance: SpectralIrradiancePacket,
		scattering: SpectralPhaseWeightedScatteringCoefficientPacket,
		measure: Distance,
	): SpectralRadiancePacket;

	/** Compute source-owned direct-primary radiance for cache construction. */
	computeDirectRadiance(
		viewRaySegment: RaySegment,
		pathIntegrationPoints: readonly PathIntegrationPoint[],
	): PathRadiance;

	/** Integrate cumulative local scattering density over a view ray. */
	computeRadiance(
		viewRaySegment: RaySegment,
		pathIntegrationPoints: readonly PathIntegrationPoint[],
		options: ComputeRadianceOptions,
	): PathRadiance;
}

/**
 * Store one endpoint/trapezoid path integration point.
 */
type PathIntegrationPoint = {
	/**
	 * Store the point index along the path.
	 */
	readonly pointIndex: number;

	/**
	 * Store distance along the ray.
	 */
	readonly distanceAlongRay: Distance;

	/**
	 * Store interval length from the previous point.
	 */
	readonly intervalLengthFromPrevious: Distance;

	/**
	 * Store endpoint/trapezoid weight.
	 */
	readonly trapezoidWeight: number;

	/**
	 * Store effective path measure represented by this point.
	 */
	readonly measure: Distance;
};

/**
 * Store spectral radiance computed along one path.
 */
type PathRadiance = {
	/**
	 * Store path-added spectral radiance.
	 */
	readonly pathRadiance: SpectralRadiancePacket;

	/**
	 * Store final view-path transmittance.
	 */
	readonly transmittance: SpectralTransmittancePacket;

	/**
	 * Store optional implementation diagnostics for tests and future tooling.
	 */
	readonly diagnostics?: unknown;
};

/**
 * Store the cumulative cache required for one reference radiance computation.
 */
type ComputeRadianceOptions = {
	/** Store the resident cumulative CPU cache to sample. */
	readonly scatteringCache: CpuScatteringCache;
};

/**
 * Supplies construction dependencies for the runtime shader builder.
 */
type ShaderBuilderDependencies = {
	/**
	 * Store the facade-owned shared model consumed by shader builds.
	 */
	readonly model: SharedModel;

	/**
	 * Store an optional shader assembler collaborator.
	 */
	readonly assembler?: ShaderAssembler;

	/**
	 * Store an optional shader descriptor builder collaborator.
	 */
	readonly descriptorBuilder?: ShaderDescriptorBuilder;

	/**
	 * Store an optional core transport implementation.
	 */
	readonly transport?: Algorithm32Transport;
};

/** Supply optional lifecycle context for one shader build. */
type ShaderBuildRequestOptions = {
	/** Reuse the installed cache only when its complete identity is unchanged. */
	readonly previousBuildResult?: ShaderBuildResult;
	/** Cancel source-owned cache construction. */
	readonly signal?: AbortSignal;
};

/**
 * Supplies one accepted request to build runtime shader artifacts.
 */
type ShaderBuildRequest = {
	/**
	 * Store the caller-owned Three runtime attachment request.
	 */
	readonly setup: ShaderSetupRequest;

	/**
	 * Store the accepted facade configuration snapshot.
	 */
	readonly config?: ConfigSnapshot;

	/**
	 * Store the optional shader descriptor to assemble during setup.
	 */
	readonly descriptor?: Algorithm32ShaderDescriptor;

	/**
	 * Store optional owner-supplied shader contributions.
	 */
	readonly contributions?: readonly ShaderContribution[];

	/**
	 * Store optional symbols required by the shared main skeleton.
	 */
	readonly mainRequiredSymbols?: readonly string[];

	/**
	 * Store optional symbols supplied by the runtime skeleton.
	 */
	readonly systemProvidedSymbols?: readonly string[];

	/**
	 * Store optional initial runtime binding values by value key.
	 */
	readonly bindingValues?: Record<string, unknown>;

	/** Store the currently installed result considered for exact cache reuse. */
	readonly previousBuildResult?: ShaderBuildResult;

	/** Cancel source-owned cache construction. */
	readonly signal?: AbortSignal;
};

/**
 * Supplies construction data for the renderer-produced scene input capture pass.
 */
type SceneInputCaptureConfiguration = {
	/**
	 * Store the caller-provided Three namespace.
	 */
	readonly THREE: unknown;

	/**
	 * Store the live scene rendered before the Algorithm32 pass.
	 */
	readonly scene: unknown;

	/**
	 * Store the live camera used to render the scene.
	 */
	readonly camera: unknown;

	/**
	 * Store the unit-bearing capture viewport dimensions.
	 */
	readonly viewportSize: PixelSize;

	/**
	 * Store the largest representable scene-hit distance.
	 */
	readonly sceneDepthMax?: Distance;

	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale?: SceneScale;

	/** Store an optional performance callback for capture passes. */
	readonly performanceCallback?: (sample: ShaderPerformanceSample) => void;

	/** Store the pass invocation cadence used for performance samples. */
	readonly performanceSampleIntervalFrames?: number;

	/** Store the maximum unresolved GPU queries retained per capture pass. */
	readonly performanceMaxPendingQueries?: number;
};

/**
 * Describes runtime binding values produced by the scene input capture pass.
 */
type SceneInputCaptureBindingValues = {
	/**
	 * Store the packed depth texture consumed by the runtime shader.
	 */
	readonly 'runtime.sceneDepthTexture': unknown;

	/**
	 * Store the explicit hit-mask texture consumed by the runtime shader.
	 */
	readonly 'runtime.sceneHitTexture': unknown;

	/**
	 * Store viewport dimensions consumed by the runtime shader.
	 */
	readonly 'runtime.viewportSize': PixelSize;
};

/** Describe the renderer-owned scene-input capture surface. */
interface SceneInputCapture {
	/** Store the current depth texture. */
	readonly depthTexture: unknown;
	/** Store the current explicit hit-mask texture. */
	readonly hitTexture: unknown;
	/** Store the current unit-bearing viewport size. */
	readonly viewportSize: PixelSize;
	/** Return runtime binding values for the captured inputs. */
	bindingValues(): SceneInputCaptureBindingValues;
	/** Resize owned targets. */
	setSize(width: number, height: number): void;
	/** Capture the configured scene inputs. */
	capture(renderer: unknown): void;
	/** Render the capture operation. */
	render(renderer: unknown): void;
	/** Return implementation diagnostics. */
	getDiagnostics(): unknown;
	/** Release owned resources. */
	dispose(): void;
}

/**
 * Describes an installed runtime shader artifact.
 */
type ShaderRuntimeArtifact = {
	/**
	 * Prepare the installed program for its first render.
	 *
	 * @param renderer - Supplies the runtime renderer.
	 */
	prepare(renderer: unknown): Promise<void>;

	/**
	 * Dispose the privately owned installed pass and scene-input resources.
	 *
	 * @returns No return value.
	 */
	dispose(): void;

	/**
	 * Return internal runtime diagnostics.
	 *
	 * @returns The runtime diagnostics snapshot.
	 */
	getDiagnostics(): unknown;
};

/**
 * Supplies construction data for the runtime shader pass.
 */
type ShaderRuntimePassConfiguration = {
	/**
	 * Store the caller-provided Three namespace.
	 */
	readonly THREE: unknown;

	/**
	 * Store the fragment shader source to install.
	 */
	readonly fragmentShaderSource: string;

	/**
	 * Store the fragment source hash.
	 */
	readonly sourceHash: string;

	/**
	 * Store pass uniforms.
	 */
	readonly uniforms: Record<string, {
		/** Store the current uniform value. */
		value: unknown;
	}>;

	/**
	 * Store the accepted unit-bearing viewport dimensions.
	 */
	readonly viewportSize: PixelSize;

	/**
	 * Store optional preceding renderer-produced scene input texture provider.
	 */
	readonly sceneInputCapture?: SceneInputCapture | null;

	/** Refresh uniforms backed by the caller-owned live binding record. */
	readonly refreshUniformValues?: (() => void) | null;

	/**
	 * Store an optional runtime logger.
	 */
	readonly logger?: Console | null;

	/** Store an optional performance callback for the runtime pass. */
	readonly performanceCallback?: (sample: ShaderPerformanceSample) => void;

	/** Store the pass invocation cadence used for performance samples. */
	readonly performanceSampleIntervalFrames?: number;

	/** Store the maximum unresolved GPU queries retained by the runtime pass. */
	readonly performanceMaxPendingQueries?: number;
};

/**
 * Describes runtime shader artifacts produced by the shader builder for facade
 * attachment.
 */
type ShaderBuildResult = {
	/**
	 * Store the shared model version used while building the artifacts.
	 */
	readonly modelVersion: number;

	/**
	 * Store the setup request accepted by the builder.
	 */
	readonly setup: ShaderSetupRequest;

	/**
	 * Store optional accepted shader assembly.
	 */
	readonly assembly?: ShaderAssemblyResult;

	/**
	 * Store optional sorted shader binding requirements.
	 */
	readonly bindingRequirements?: readonly ShaderBindingRequirement[];

	/**
	 * Store optional installed runtime pass state.
	 */
	readonly runtime?: ShaderRuntimeArtifact;

	/** Own the source-created controller for this runtime attachment. */
	readonly cacheController?: CacheController | null;

	/** Store the complete GPU cache published to this attachment. */
	readonly cache?: GpuScatteringCache | null;

	/** Store the exact construction identity used for safe cache reuse. */
	readonly cacheIdentity?: ShaderCacheIdentity | null;

	/**
	 * Store build diagnostics.
	 */
	readonly diagnostics: unknown;
};

/** Identify every input that determines one runtime attachment cache. */
type ShaderCacheIdentity = {
	/** Identify the concrete backend instance; cache resources never cross it. */
	readonly backend: CacheGpuBackend;
	/** Identify renderer/cache capabilities that affect construction. */
	readonly backendCapabilitiesId: string;
	/** Identify the optional scheduler owned by the runtime attachment. */
	readonly cacheBuildScheduler: CacheBuildScheduler | null;
	/** Identify the complete configured atmospheric source. */
	readonly sourceFingerprint: string;
	/** Identify the complete configured atmosphere. */
	readonly atmosphereFingerprint: string;
	/** Identify the complete configured geometry. */
	readonly geometryFingerprint: string;
	/** Identify the optional boundary contents. */
	readonly boundaryContentHash: string | null;
	/** Identify the spectral basis contents. */
	readonly spectralContentHash: string;
	/** Identify the requested cumulative maximum. */
	readonly maximumScatteringOrder: SupportedCacheScatteringOrder;
};

/**
 * Describes setup-time context synthesized by ShaderBuilder for automatic
 * configured-model assembly.
 */
type ShaderBuildContext = {
	/**
	 * Store whether this context is assembling from the configured model.
	 */
	readonly automaticAssembly: boolean;

	/** Store the controller created for this runtime attachment. */
	readonly cacheController: CacheController | null;

	/**
	 * Store optional built cache used as a shader contribution provider.
	 */
	readonly cache: GpuScatteringCache | null;

	/** Store exact inputs used to decide cache reuse. */
	readonly cacheIdentity: ShaderCacheIdentity | null;

	/** Identify whether this build created and therefore owns a new controller. */
	readonly createdCacheController: boolean;

	/**
	 * Store default main symbols for automatic assembly.
	 */
	readonly mainRequiredSymbols?: readonly string[] | null;
};
