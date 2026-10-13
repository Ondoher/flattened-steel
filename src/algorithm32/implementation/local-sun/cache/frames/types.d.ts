/** Operations consumed from a geometry-owned immutable horizontal cache map. */
interface FlatLocalCacheTransformCapability {
	/** Map a physical live point to construction coordinates. */ toCanonicalPosition(position: Position): Position;
	/** Express a live unit direction in construction coordinates. */ toCanonicalDirection(
		direction: UnitVector3,
	): UnitVector3;
	/** Map a construction point into the live scene. */ toLivePosition(position: Position): Position;
	/** Contribute executable transforms without patching assembled shader text. */ createShaderFunctions(): readonly ShaderSourceBlock[];
	/** Supply exact staged geometry transform values without changing program source. */ createShaderUniforms(): readonly ShaderUniformDeclaration[];
}
/** Exact live profile input; source placement is resolved by geometry when omitted. */
type LocalSunLiveProfileRequest = Readonly<{
	/** Exact geographic observation. */ observation: GeometryObservation;
	/** Unit-bearing receiver/model point. */ receiverPosition: Position;
	/** Optional explicit source center for admitted physical motion proofs. */ sourcePosition?: Position;
}>;
/** Existing compact cache operations consumed by a leased runtime view. */
interface LocalSunFrameCacheOwner {
	/** Expose only opaque field/auxiliary handles. */ getRuntimeBindings(): CacheRuntimeBindings;
	/** Contribute physical lookup through the geometry-owned live map. */ createFrameShaderContribution(
		transform: FlatLocalCacheTransformCapability,
	): ShaderContribution;
}
/** Once-only decrement of a registry borrow. */
type LocalSunFrameLeaseRelease = () => void;
/** Reject a borrow whose WebGL context is invalid. */
type LocalSunFrameLeaseValidation = () => void;
/** Registry-owned collaborators passed to an individual cache view. */
type LocalSunFrameCacheLeaseDefinition = Readonly<{
	/** Canonical physical cache retained by the registry. */ owner: LocalSunFrameCacheOwner;
	/** Geometry-owned live mapping. */ transform: FlatLocalCacheTransformCapability;
	/** Release this borrow without disposing other consumers. */ release: LocalSunFrameLeaseRelease;
	/** Require the captured context to remain current. */ validate: LocalSunFrameLeaseValidation;
}>;
/** Retained canonical construction and borrower accounting. */
type LocalSunFrameCacheEntry = {
	/** Canonical physical/numerical identity including backend capabilities. */ key: string;
	/** Retained accepted construction facts. */ profile: LocalSunCompactConstructionProfile;
	/** Sole construction/disposal owner. */ controller: CacheController;
	/** Completed canonical compact field. */ cache: LocalSunFrameCacheOwner;
	/** Logical bytes retained by this entry. */ retainedBytes: number;
	/** Number of outstanding borrowed views. */ borrowers: number;
	/** Retirement prevents new borrowers. */ retired: boolean;
	/** Lost-context/disposal state of the physical resources. */ disposed: boolean;
	/** Backend context generation captured during construction. */ contextRevision: number;
};
/** One accepted live ray whose complete support must be resolved before preparation. */
type LocalSunFrameSupportRay = Readonly<{
	/** Physical ray origin. */ origin: Position;
	/** Unit physical direction. */ direction: UnitVector3;
	/** Optional shortened segment length. */ length?: Distance;
}>;
/** Complete user-requested state distinct from canonical construction identity. */
type LocalSunFrameRequest = Readonly<{
	/** Genuine live profile, independently paired with its source and geometry. */ profile: LocalSunCompactConstructionProfile;
	/** Exact accepted frame rays; at least one is required. */ viewRays: readonly LocalSunFrameSupportRay[];
	/** Identity of presentation state used by the staged shader and lighting. */ presentationIdentity: string;
	/** Complete additional owned GPU bytes beyond registry-retained fields. */ otherOwnedGpuBytes: UnitValue<'bytes'>;
}>;
/** Exact geometry/source and measured-adaptation inputs staged for celestial consumers. */
type LocalSunFrameCelestialInputs = Readonly<{
	/** Exact frame observation. */ observation: GeometryObservation;
	/** Resolved physical center of the finite source. */ sourcePosition: Position;
	/** Exact receiver location. */ receiverPosition: Position;
	/** Finite-source physical radius. */ sourceRadius: Distance;
	/** Measured adaptation matching this frame. */ stellarAdaptationLuminance: UnitValue<'cd m^-2'>;
	/** Identity of the measured direct/diffuse receiver state. */ receiverLightIdentity: string;
}>;
/** Renderer-owned complete frame operation. */
type LocalSunFrameRenderOperation = () => void;
/** Independently staged shader, bindings, receiver and celestial input aggregate. */
type LocalSunPreparedFrameContents = Readonly<{
	/** Actual renderer preflight observations, when supplied by the ordinary preparation owner. */ preflight?: LocalSunFramePreflight;
	/** Optional reversible ordinary endpoint lighting prepared without publication. */ sceneLighting?: LocalSunFrameSceneLighting;
	/** Actual shader compilation and frame preflight succeeded. */ shaderReady: true;
	/** Exact measured direct/diffuse light, with native basis and provenance. */ receiverLight: ReceiverEnvironmentLightMeasurement;
	/** Exact matching celestial inputs; resource generation is P4. */ celestialInputs: LocalSunFrameCelestialInputs;
	/** All geometry/source/cache shader binding values for this frame. */ bindingValues: Record<string, unknown>;
	/** Render this complete staged frame, without mutating another frame. */ renderFrame: LocalSunFrameRenderOperation;
	/** Release shader/receiver/celestial candidate resources exactly once. */ dispose(): void;
}>;

/** Assignment-only lighting transaction coordinated with complete frame installation. */
interface LocalSunFrameSceneLighting {
	/** Publish the exact measured candidate lighting. */ publish(): void;
	/** Restore prior lighting if renderer installation rejects. */ revert(): void;
}

/** Observed prepublication scene input and composed output; excludes later lighting publication. */
type LocalSunFramePreflight = Readonly<{
	/** Actual staged composed RGBA pixel. */ outputPixel: readonly [number, number, number, number];
	/** Actual staged ordinary scene-input RGBA pixel. */ sceneInputPixel: readonly [number, number, number, number];
}>;
/** External GPU construction and probe-reading capabilities consumed by complete frames. */
interface LocalSunFrameBackend extends CacheGpuBackend, CacheProbeReader {}
/** Staging facts delivered to the renderer-owned preparation operation. */
type LocalSunFrameStageRequest = Readonly<{
	/** Declared complete additional allocation peak, including candidate shaders/receiver/composer resources. */ otherOwnedGpuBytes: UnitValue<'bytes'>;
	/** Genuine exact-state profile. */ profile: LocalSunCompactConstructionProfile;
	/** Borrowed construction cache exposed as an ordinary controller. */ cacheController: CacheController;
	/** Current backend, replaced explicitly after context restoration. */ backend: LocalSunFrameBackend;
	/** Unique generation and exact requested facts. */ identity: string;
	/** Cancel or reject stale preparation. */ signal: AbortSignal;
}>;
/** Renderer-side operation that prepares a complete frame through normal shader/receiver owners. */
type LocalSunFrameStageFactory = (request: LocalSunFrameStageRequest) => Promise<LocalSunPreparedFrameContents>;
/** Frame-controller dependencies with no application/default activation policy. */
type LocalSunFrameControllerConfiguration = Readonly<{
	/** External current GPU backend and scalar receiver reduction. */ backend: LocalSunFrameBackend;
	/** Explicit renderer-owned complete staging operation. */ stageFrame: LocalSunFrameStageFactory;
	/** Optional bounded cache-build scheduler. */ scheduler?: CacheBuildScheduler;
}>;
/** Prepared complete frame; controller owns its lifecycle and publication eligibility. */
type PreparedLocalSunFrame = Readonly<{
	/** Exact request generation, separate from construction reuse. */ generation: number;
	/** Canonical physical/numerical construction identity. */ constructionIdentity: string;
	/** Exact live observation, physical/presentation and generation identity. */ identity: string;
	/** Immutable physical transform from this frame to construction. */ transform: FlatLocalCacheTransformCapability;
	/** Independently paired live profile. */ profile: LocalSunCompactConstructionProfile;
	/** Complete staged renderer, receiver and celestial state. */ contents: LocalSunPreparedFrameContents;
	/** Borrow resources for another current-frame consumer. */ borrowCache(): GpuScatteringCache;
}>;
/** Controller-private prepared frame ownership, separate from its public readonly packet. */
type LocalSunFrameRecord = {
	/** Public complete frame. */ frame: PreparedLocalSunFrame;
	/** Exact requested state for checks and restoration. */ request: LocalSunFrameRequest;
	/** Sole cache entry retained by this frame's lease. */ entry: LocalSunFrameCacheEntry;
	/** Owned frame lease; disposal is idempotent across shader teardown. */ lease: GpuScatteringCache &
		CacheController;
	/** Frame retirement/disposal state. */ retired: boolean;
};

/** Explicit source-owned complete-frame preparation and publication capability. */
type LocalSunFramePublication = Readonly<{
	/** Complete frame that was successfully committed. */ frame: PreparedLocalSunFrame;
	/** Retirement errors reported separately from the successful commit. */ retirementErrors: readonly unknown[];
}>;

/** Explicit source-owned complete-frame preparation and publication capability. */
/** Synchronous renderer installation which rejects before changing rendering and does not mutate the controller. */
type LocalSunFrameRenderInstallation = () => void;
/** Explicit source-owned complete-frame preparation and publication capability. */
interface LocalSunFramePublicationController {
	/** Settles after disposal, pending cleanup and final valid cache borrower release. */ whenReleased(): Promise<void>;
	/** Single displayed aggregate, or no available frame after loss. */ readonly active: PreparedLocalSunFrame | null;
	/** Stage exact physical/receiver/shader state without replacing the displayed frame. */ prepareLocalFrame(
		request: LocalSunFrameRequest,
		signal?: AbortSignal,
	): Promise<PreparedLocalSunFrame>;
	/** Commit one complete current-generation packet and report post-commit retirement independently. */ publishPreparedLocalFrame(
		frame: PreparedLocalSunFrame,
		install?: LocalSunFrameRenderInstallation,
	): LocalSunFramePublication;
	/** Cancel pending work while retaining the displayed frame. */ cancelPreparation(): void;
	/** Invalidate lost-context resources and withdraw rendering. */ handleContextLoss(): void;
	/** Rebuild a complete retained request on the restored backend. */ restoreContext(
		backend: LocalSunFrameBackend,
	): Promise<PreparedLocalSunFrame | null>;
	/** Retire frames and allow final borrower-driven resource release. */ dispose(): void;
}
