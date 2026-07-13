/** Contract that exposes one opaque resident GPU field. */
interface GpuCacheField {
	/** Id value. */ readonly id: CacheFieldId;
	/** Storage value. */ readonly storage: CacheFieldStorage;
	/** Backend id value. */ readonly backendId: string;
	/** Call this method to dispose. */ dispose(): void;
}

/** Contract that exposes one opaque compiled cache-construction program. */
interface CacheGpuProgram {
	/** Id value. */ readonly id: string;
	/** Source hash value. */ readonly sourceHash: string;
	/** Call this method to dispose. */ dispose(): void;
}

/** Submit one wavelength layer of one construction pass. */
type CacheLayerSubmission = Readonly<{
	/** Program value. */ program: CacheGpuProgram;
	/** Inputs value. */ inputs: readonly Readonly<{
		/** Id value. */ id: CacheFieldId;
		/** Field value. */ field: GpuCacheField;
	}>[];
	/** Output value. */ output: GpuCacheField;
	/** Layer value. */ layer: number;
	/** Bindings value. */ bindings: readonly CacheBinding[];
}>;

/** Contract that exposes one opaque runtime binding for a completed field. */
interface CacheRuntimeBinding {
	/** Id value. */ readonly id: string;
	/** Value that identifies the shader value populated by the owning renderer backend. */
	readonly valueKey: CacheRuntimeValueKey;
	/** Field id value. */ readonly fieldId: CacheFieldId;
	/** Backend id value. */ readonly backendId: string;
}

/**
 * Shader value populated by one completed GPU field.
 *
 * - **"cache.cumulativeScatteringDensity"** - The retained cumulative atmospheric scattering field.
 * - **"cache.celestial.sunTransport"** - The distant-Sun direct-transport field.
 * - **"cache.celestial.starTransport"** - The stellar point-set direct-transport field.
 * - **"cache.celestial.localSunRadiance"** - The Flat finite-Sun radiance field.
 * - **"lighting.receiverEnvironmentIrradiance"** - One receiver-local native-basis irradiance packet.
 */
type CacheRuntimeValueKey =
	| 'cache.cumulativeScatteringDensity'
	| 'cache.celestial.sunTransport'
	| 'cache.celestial.starTransport'
	| 'cache.celestial.localSunRadiance'
	| 'lighting.receiverEnvironmentIrradiance';

/** Request for one typed runtime binding over a resident field. */
type CacheRuntimeBindingRequest = Readonly<{
	/** Resident field represented by the binding. */
	readonly field: GpuCacheField;
	/** Shader value populated by the binding. */
	readonly valueKey: CacheRuntimeValueKey;
}>;

/** Group completed cache bindings owned by one backend. */
type CacheRuntimeBindings = Readonly<{
	/** Backend id value. */ backendId: string;
	/** Bindings value. */ bindings: readonly CacheRuntimeBinding[];
}>;

/** Type that supplies renderer-owned uniforms that receive opaque completed-cache bindings. */
type CacheRuntimeBindingInstallRequest = Readonly<{
	/** Bindings value. */ bindings: CacheRuntimeBindings;
	/** Uniforms value. */ uniforms: Record<string, {/** Value value. */ value: unknown}>;
}>;

/** Type that describes renderer capabilities that affect construction identity. */
type CacheGpuCapabilities = Readonly<{
	/** Id value. */ id: string;
	/** Api value. */ api: string;
	/** Scalar format value. */ scalarFormat: 'R32F';
	/** Supports array render targets value. */ supportsArrayRenderTargets: boolean;
	/** Supports float sampling value. */ supportsFloatSampling: boolean;
	/** Maximum texture size value. */ maximumTextureSize: number;
	/** Maximum array layers value. */ maximumArrayLayers: number;
}>;

/** Isolate renderer-specific GPU construction behind opaque handles. */
interface CacheGpuBackend {
	/** Id value. */ readonly id: string;
	/** Capabilities value. */ readonly capabilities: CacheGpuCapabilities;
	/**
	 * Call this method to allocate field.
	 * @param field - The field value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ allocateField(field: CacheFieldSpec): GpuCacheField;
	/**
	 * Call this method to compile.
	 * @param shader - The shader value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ compile(shader: CacheShader): CacheGpuProgram | Promise<CacheGpuProgram>;
	/**
	 * Call this method to submit one layer and restore every renderer state value before returning.
	 * @param request - The request accepted by the operation.
	 */
	submitLayer(request: CacheLayerSubmission): void;
	/**
	 * Call this method to create runtime binding.
	 * @param request - The resident field and its caller-selected shader value.
	 * @returns - The result produced by the operation.
	 */ createRuntimeBinding(request: CacheRuntimeBindingRequest): CacheRuntimeBinding;
	/**
	 * Call this method to resolve opaque bindings privately and install their renderer resources.
	 * @param request - The request accepted by the operation.
	 */
	installRuntimeBindings(request: CacheRuntimeBindingInstallRequest): void;
	/** Call this method to dispose. */ dispose(): void;
}

/** Yield construction only at executor-declared safe boundaries. */
interface CacheBuildScheduler {
	/**
	 * Call this method to yield control.
	 * @returns - The result produced by the operation.
	 */ yieldControl(): Promise<void>;
}
