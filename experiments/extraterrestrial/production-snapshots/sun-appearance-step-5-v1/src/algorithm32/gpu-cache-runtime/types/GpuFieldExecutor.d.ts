/** Plan fields and remaining-consumer counts indexed for one execution. */
type GpuFieldIndexedPlan = Readonly<{
	/** Field specifications keyed by logical field identifier. */
	fieldSpecs: Map<CacheFieldId, CacheFieldSpec>;
	/** Remaining pass-consumer counts keyed by logical field identifier. */
	consumerCounts: Map<CacheFieldId, number>;
}>;

/** Accepted diagnostic probe with copied, bounded coordinates. */
type GpuFieldAcceptedProbe = Readonly<{
	/** Logical field selected by the probe. */
	field: CacheFieldId;
	/** Copied scalar coordinates selected within the field. */
	coordinates: readonly DirectionalSpectralFieldCoordinates[];
}>;

/** Execution options accepted against the indexed build plan. */
type GpuFieldAcceptedExecutionOptions = Readonly<{
	/** Optional cancellation signal. */
	signal?: AbortSignal;
	/** Optional safe-boundary scheduler. */
	scheduler?: CacheBuildScheduler;
	/** Optional selected-scalar readback capability. */
	probeReader?: CacheProbeReader;
	/** Accepted diagnostic probes keyed by logical field identifier. */
	probes: Map<CacheFieldId, GpuFieldAcceptedProbe>;
}>;

/** Renderer-neutral GPU executor for trusted scalar-field plans. */
class GpuFieldExecutor {
	/**
	 * Creates a renderer-neutral executor for one backend and field-pass assembler.
	 * @param request - The construction collaborators.
	 */
	constructor(request: GpuFieldExecutorConfiguration);

	/**
	 * Call this method to execute one complete scalar-field staging graph.
	 * @param plan - The caller-owned field execution plan.
	 * @param options - The optional execution choices.
	 * @returns - The completed field artifact.
	 */
	execute(plan: GpuFieldExecutionPlan, options?: GpuFieldExecutionOptions): Promise<GpuFieldArtifact>;

	/**
	 * Call this method to mark the executor unavailable without disposing its backend.
	 * @returns - No return value.
	 */
	dispose(): void;
}
