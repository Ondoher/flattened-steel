/** Owner of one completed distant-Sun cumulative GPU cache artifact. */
export class DistantSunCache implements GpuScatteringCache {
	/**
	 * Creates a distant sun cache instance that takes ownership of one completely constructed staging artifact.
	 * @param artifact - The artifact value accepted by the operation.
	 */
	constructor(artifact: CacheBuildArtifact);

	/**
	 * Call this method to return opaque bindings for the privately owned cumulative field.
	 * @returns - The result produced by the operation.
	 */
	getRuntimeBindings(): CacheRuntimeBindings;

	/**
	 * Call this method to contribute the Native-48 by W27 cumulative final-view lookup.
	 * @returns - The result produced by the operation.
	 */
	createShaderContribution(): ShaderContribution;

	/** Call this method to release the completed cumulative GPU field. Repeated disposal is safe. */
	dispose(): void;
}
