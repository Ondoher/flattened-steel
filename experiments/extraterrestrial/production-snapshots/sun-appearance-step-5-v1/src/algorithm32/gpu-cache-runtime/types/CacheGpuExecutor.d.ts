/** Scattering-plan adapter over the neutral scalar-field GPU executor. */
class CacheGpuExecutor {
	/**
	 * Creates a renderer-neutral executor for one backend and cache-pass assembler.
	 * @param request - The request accepted by the operation.
	 */
	constructor(request: CacheGpuExecutorConfiguration);

	/**
	 * Call this method to execute one complete staging graph.
	 * @param plan - The plan value accepted by the operation.
	 * @param options - The optional operation choices.
	 * @returns - The result produced by the operation.
	 */
	execute(plan: CacheBuildPlan, options?: CacheExecutionOptions): Promise<CacheBuildArtifact>;

	/** Call this method to mark the executor unavailable without disposing its backend. */
	dispose(): void;
}
