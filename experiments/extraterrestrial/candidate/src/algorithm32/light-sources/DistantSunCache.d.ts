/** Own one completed distant-Sun cumulative GPU cache artifact. */
export class DistantSunCache implements GpuScatteringCache {
	/** Take ownership of one completely constructed staging artifact. */
	constructor(artifact: CacheBuildArtifact);

	/** Store the completed cumulative cache identity. */
	readonly descriptor: ScatteringCacheDescriptor;

	/** Return opaque bindings for the privately owned cumulative field. */
	getRuntimeBindings(): CacheRuntimeBindings;

	/** Contribute the Native-48 by W27 cumulative final-view lookup. */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution;

	/** Release the completed cumulative GPU field. Repeated disposal is safe. */
	dispose(): void;
}
