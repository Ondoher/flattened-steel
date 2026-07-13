/**
 * Adapt one Three/WebGL2 renderer to the opaque GPU cache-construction
 * contract.
 */
export class ThreeCacheBackend implements CacheGpuBackend, CacheProbeReader {
	constructor(request: ThreeCacheBackendRequest);

	readonly id: string;
	readonly capabilities: CacheGpuCapabilities;

	allocateField(field: CacheFieldSpec): GpuCacheField;
	compile(shader: CacheShader): Promise<CacheGpuProgram>;
	/** Submit one layer and restore every renderer state value before returning. */
	submitLayer(request: CacheLayerSubmission): void;
	createRuntimeBinding(field: GpuCacheField): CacheRuntimeBinding;
	/** Resolve opaque bindings and install their private renderer resources. */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	readSelectedScalars(request: CacheProbeRequest): Promise<CacheProbeResult>;
	dispose(): void;
}
