/** Construction dependencies for the runtime shader build coordinator. */
type ShaderBuilderDependencies = {
	/** Facade-owned shared model consumed by shader builds. */
	readonly model: SharedModel;

	/** Optional deterministic shader assembler collaborator. */
	readonly assembler?: ShaderAssembler;

	/** Optional core transport implementation. */
	readonly transport?: Algorithm32Transport;
};

/** Runtime shader-build coordination surface retained by the Algorithm32 facade. */
interface ShaderBuildCoordinator {
	/** Facade-owned shared model consumed by shader builds. */
	readonly model: SharedModel;

	/**
	 * Call this method to build runtime shader artifacts for one attachment request.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	build(request: ShaderBuildRequest): Promise<ShaderBuildResult>;

	/**
	 * Call this method to retain a new accepted facade configuration snapshot.
	 * @param config - The config value accepted by the operation.
	 */
	refreshConfig(config: ConfigSnapshot): void;

	/** Call this method to terminate the shader-build coordinator lifecycle. */
	dispose(): void;
}

/** Construction dependencies for deterministic shader assembly preparation. */
type ShaderAssemblyPreparerDependencies = {
	/** Facade-owned shared model whose providers contribute shader declarations. */
	readonly model: SharedModel;

	/** Deterministic assembler for accepted provider contributions. */
	readonly assembler: ShaderAssembler;

	/** Core transport provider for automatic configured-model assembly. */
	readonly transport: Algorithm32Transport;
};

/** Accepted request for runtime shader artifacts. */
type ShaderBuildRequest = {
	/** Caller-owned Three runtime attachment request. */
	readonly setup: ShaderSetupRequest;

	/** Accepted facade configuration snapshot. */
	readonly config?: ConfigSnapshot;

	/** Optional owner-supplied shader contributions. */
	readonly contributions?: readonly ShaderContribution[];

	/** Optional symbols required by the shared main skeleton. */
	readonly mainRequiredSymbols?: readonly string[];

	/** Optional symbols supplied by the runtime skeleton. */
	readonly systemProvidedSymbols?: readonly string[];

	/** Optional initial runtime binding values indexed by value key. */
	readonly bindingValues?: Record<string, unknown>;

	/** Currently installed result considered for exact cache reuse. */
	readonly previousBuildResult?: ShaderBuildResult;

	/** Cancellation signal for source-owned cache construction. */
	readonly signal?: AbortSignal;
};

/** Runtime shader artifacts produced for facade attachment. */
type ShaderBuildResult = {
	/** Shared model version used while building the artifacts. */
	readonly modelVersion: number;

	/** Setup request accepted by the builder. */
	readonly setup: ShaderSetupRequest;

	/** Optional accepted shader assembly. */
	readonly assembly?: ShaderAssemblyResult;

	/** Optional sorted shader binding requirements. */
	readonly bindingRequirements?: readonly ShaderBindingRequirement[];

	/** Optional installed runtime pass state. */
	readonly runtime?: ShaderRuntimeArtifact;

	/** Optional standard-pipeline celestial generation owner installed before the O(1) consumer. */
	readonly celestialGenerationParticipant?: CelestialGenerationRuntimeParticipant | null;

	/** Source-created controller owned by this runtime attachment. */
	readonly scatteringCacheController?: CacheController | null;

	/** Complete GPU cache published to this attachment. */
	readonly scatteringCache?: GpuScatteringCache | null;

	/** Exact source-controller ownership identity. */
	readonly scatteringCacheControllerIdentity?: ShaderCacheControllerIdentity | null;

	/** Optional spherical distant-Sun celestial controller owned by this attachment. */
	readonly distantSunCelestialCacheController?: DistantSunCelestialCacheController | null;

	/** Optional spherical distant-Sun celestial resource published to this attachment. */
	readonly distantSunCelestialCache?: DistantSunCelestialCacheResource | null;

	/** Exact distant-Sun celestial controller reuse identity. */
	readonly distantSunCelestialCacheIdentity?: DistantSunCelestialCacheControllerIdentity | null;

	/** Optional stellar point-set controller owned by this attachment. */
	readonly stellarPointSetCacheController?: StellarPointSetCacheController | null;

	/** Optional stellar point-set resource published to this attachment. */
	readonly stellarPointSetCache?: StellarPointSetCacheResource | null;

	/** Exact stellar point-set controller reuse identity. */
	readonly stellarPointSetCacheIdentity?: StellarPointSetCacheControllerIdentity | null;

	/** Optional Flat finite-Sun controller owned by this attachment. */
	readonly flatFiniteSunCacheController?: FlatFiniteSunCacheController | null;

	/** Optional Flat finite-Sun resource published to this attachment. */
	readonly flatFiniteSunCache?: FlatFiniteSunCacheResource | null;

	/** Exact Flat finite-Sun controller reuse identity. */
	readonly flatFiniteSunCacheIdentity?: FlatFiniteSunCacheControllerIdentity | null;

	/** Value that builds diagnostics. */
	readonly diagnostics: unknown;
};

/** Exact ownership inputs for one runtime source-cache controller. */
type ShaderCacheControllerIdentity = {
	/** Live source owner whose controller can be reused. */
	readonly source: LightSourceModel;
	/** Concrete backend instance across which cache resources never move. */
	readonly backend: CacheGpuBackend;
	/** Optional scheduler owned by the runtime attachment. */
	readonly scheduler: CacheBuildScheduler | null;
};

/** One independently owned cache controller published through a shader build. */
type ShaderBuildOwnedCacheController =
	| CacheController
	| DistantSunCelestialCacheController
	| StellarPointSetCacheController
	| FlatFiniteSunCacheController;

/** Ordered controller collection extracted from one shader build result. */
type ShaderBuildOwnedCacheControllers = readonly ShaderBuildOwnedCacheController[];

/** Controller identities preserved while one shader build result is retired. */
type ShaderBuildPreservedCacheControllers = ReadonlySet<ShaderBuildOwnedCacheController>;

/** Setup-time lifecycle context for automatic configured-model assembly. */
type ShaderBuildContext = {
	/** Whether the configured model supplies automatic assembly inputs. */
	readonly automaticAssembly: boolean;

	/** Standard-pipeline celestial generation owner selected for this attachment. */
	readonly celestialGenerationParticipant?: CelestialGenerationRuntimeParticipant | null;

	/** Controller selected for this runtime attachment. */
	readonly scatteringCacheController: CacheController | null;

	/** Optional built cache used as a shader contribution provider. */
	readonly scatteringCache: GpuScatteringCache | null;

	/** Exact inputs used to decide source-controller reuse. */
	readonly scatteringCacheControllerIdentity: ShaderCacheControllerIdentity | null;

	/** Whether this build created and therefore owns a new controller. */
	readonly createdScatteringCacheController: boolean;

	/** Optional spherical distant-Sun celestial controller selected for this build. */
	readonly distantSunCelestialCacheController: DistantSunCelestialCacheController | null;

	/** Optional spherical distant-Sun celestial resource selected for this build. */
	readonly distantSunCelestialCache: DistantSunCelestialCacheResource | null;

	/** Exact distant-Sun celestial controller reuse identity. */
	readonly distantSunCelestialCacheIdentity: DistantSunCelestialCacheControllerIdentity | null;

	/** Whether this build created the distant-Sun celestial controller. */
	readonly createdDistantSunCelestialCacheController: boolean;

	/** Complete geometry-derived celestial query retained for enabled shader assembly. */
	readonly celestialQueryPacket: CelestialQueryPacket | null;

	/** Optional stellar point-set controller selected for this build. */
	readonly stellarPointSetCacheController: StellarPointSetCacheController | null;

	/** Optional stellar point-set resource selected for this build. */
	readonly stellarPointSetCache: StellarPointSetCacheResource | null;

	/** Exact stellar point-set controller reuse identity. */
	readonly stellarPointSetCacheIdentity: StellarPointSetCacheControllerIdentity | null;

	/** Whether this build created the stellar point-set controller. */
	readonly createdStellarPointSetCacheController: boolean;

	/** Optional Flat finite-Sun controller selected for this build. */
	readonly flatFiniteSunCacheController: FlatFiniteSunCacheController | null;

	/** Optional Flat finite-Sun resource selected for this build. */
	readonly flatFiniteSunCache: FlatFiniteSunCacheResource | null;

	/** Exact Flat finite-Sun controller reuse identity. */
	readonly flatFiniteSunCacheIdentity: FlatFiniteSunCacheControllerIdentity | null;

	/** Whether this build created the Flat finite-Sun controller. */
	readonly createdFlatFiniteSunCacheController: boolean;

	/** Default main symbols for automatic assembly. */
	readonly mainRequiredSymbols?: readonly string[] | null;
};
