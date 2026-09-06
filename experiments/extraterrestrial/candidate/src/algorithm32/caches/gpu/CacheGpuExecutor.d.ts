/** Execute trusted typed cache plans through a renderer-neutral GPU backend. */
export class CacheGpuExecutor {
	constructor(request: Readonly<{
		backend: CacheGpuBackend;
		assembler: CacheAssembler;
	}>);

	/** Execute one complete staging graph. */
	execute(
		plan: CacheBuildPlan,
		options?: CacheExecutionOptions,
	): Promise<CacheBuildArtifact>;

	/** Mark this executor unavailable without disposing its backend. */
	dispose(): void;
}

export default CacheGpuExecutor;
