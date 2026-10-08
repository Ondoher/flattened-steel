/** Incoming quadrature selection for the independent production B1 profile.
 * - **"production-68"** - Reflection-completed production F68 quadrature and Q30 view.
 * - **"ordinary-fibonacci-34"** - Ordinary F34 diagnostic quadrature.
 * - **"bruneton-angular-288"** - Bruneton angular grid with 288 directions.
 * - **"bruneton-angular-392"** - Bruneton angular grid with 392 directions.
 * - **"bruneton-angular-512"** - Bruneton angular grid with 512 directions.
 * - **"paired-fibonacci-272"** - Paired Fibonacci diagnostic with 272 directions.
 * - **"paired-fibonacci-544"** - Paired Fibonacci diagnostic with 544 directions.
 * - **"reflection-completed-ordinary-68"** - Reflected ordinary Fibonacci diagnostic with 68 directions.
 * - **"reflection-completed-136"** - Reflection-completed diagnostic with 136 directions.
 */
type B1IncomingDirectionVariant =
	| 'production-68'
	| 'ordinary-fibonacci-34'
	| 'bruneton-angular-288'
	| 'bruneton-angular-392'
	| 'bruneton-angular-512'
	| 'paired-fibonacci-272'
	| 'paired-fibonacci-544'
	| 'reflection-completed-ordinary-68'
	| 'reflection-completed-136';

/** Production B1 profile construction options; defaults retain the original Native48/F68/Direct40/N4 profile.
 * Native51 changes only the explicit altitude construction nodes and their dependent geometry identity.
 */
type B1ProductionProfileOptions = Readonly<{
	/** Local EDT capture time on the registered 2013-05-27 measurement day. */
	time: string;
	/** Measured solar azimuth fit in degrees in the benchmark's horizontal frame. */
	fittedAzimuthDegrees: number;
	/** Maximum cumulative scattering order; default four. */
	maximumScatteringOrder?: Algorithm32ExecutionScatteringOrder;
	/** Incoming quadrature; default production F68. Other choices retain their existing Q40 diagnostic view. */
	incomingDirectionVariant?: B1IncomingDirectionVariant;
	/** Explicit altitude construction selection; omission retains the original Native48 profile identity. */
	positionDomain?: SphericalNativePositionDomainSelection;
}>;

/** Registered B1 condition facts consumed by exact profile compatibility. */
type B1AssetCondition = Readonly<{
	/** Stable benchmark condition identity. */ readonly id: string;
	/** Local capture time on the registered benchmark day. */ readonly localTime: string;
}>;

/** Shader-only diagnostic capability for the exact benchmark outgoing directions and native spectral readout. */
interface B1SpectralReadoutOwner {
	/** Call this method to contribute benchmark ray injection and terminal native spectral readout. */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution;
}

/** Browser/GPU resources created and disposed by one B1 proof session. */
type B1GpuProofRendererResources = Readonly<{
	/** Three renderer whose disposal is owned by the proof session. */ readonly renderer: import('three').WebGLRenderer;
	/** WebGL2 context borrowed by the renderer and probe backend. */ readonly context: WebGL2RenderingContext;
	/** Canvas privately owned by the proof session. */ readonly canvas: HTMLCanvasElement;
}>;

/** Exact immutable B1 asset selected for one benchmark source. */
type B1VerifiedCacheAssetSelection = Readonly<{
	/** Static URL root containing the complete authenticated asset. */ readonly assetRoot: string;
	/** Asset-relative serialized manifest path. */ readonly manifestPath: string;
	/** Lowercase SHA-256 identity of the serialized manifest. */ readonly manifestSha256: string;
	/** Complete asset compatibility identity. */ readonly assetIdentity: string;
	/** Registered condition used to authenticate the execution profile. */ readonly condition: B1AssetCondition;
}>;

/** Manifest facts consumed by legacy and receiver-local B1 cache upload. */
type B1AssetCacheManifestRecord = Readonly<{
	/** Validated legacy or receiver-local schema identity. */ readonly schemaId: string;
	/** Complete authenticated cache identity. */ readonly assetIdentity: string;
	/** Content-addressed cumulative-field payload. */ readonly cumulativeScatteringDensity: DistantSunSceneCachePayloadReference;
	/** Content-addressed logical-direction index payload. */ readonly logicalToUniqueIndex: DistantSunSceneCachePayloadReference;
	/** Receiver-local block ledger; present for the receiver-local schema. */ readonly ledger?: DistantSunSceneCacheLedgerRecord;
	/** Validated receiver-local solar lookup policy. */ readonly solarInterpolation?: DistantSunSolarInterpolationMethod;
}>;

/** Validated manifest capability borrowed by B1 attachment resources. */
interface B1AssetCacheManifest {
	/** Immutable authenticated payload and reconstruction facts. */ readonly record: B1AssetCacheManifestRecord;
	/** Call this method to reject a profile or registered condition that does not match this exact asset. */
	requireCompatibility(profile: Algorithm32ExecutionProfile, condition: B1AssetCondition): void;
}

/** Ownership transferred to one immutable legacy B1 GPU resource. */
type B1AssetCacheResourceDefinition = Readonly<{
	/** Authenticated immutable manifest borrowed by the resource. */ readonly manifest: B1AssetCacheManifest;
	/** Uploaded texture whose disposal ownership transfers to the resource. */ readonly texture: CacheImmutableTexture;
}>;

/** Borrowed construction facts retained by one B1 attachment-local loader. */
type B1AssetCacheLoaderDefinition = Readonly<{
	/** Renderer-owned texture upload capability; the loader does not dispose the backend. */ readonly backend: CacheGpuBackend;
	/** Exact immutable asset selection borrowed by the loader. */ readonly asset: B1VerifiedCacheAssetSelection;
	/** Complete execution profile authenticated against the selected asset. */ readonly profile: Algorithm32ExecutionProfile;
}>;

/** Source construction facts retained before renderer attachment. */
type B1AssetBackedSourceDefinition = Readonly<{
	/** Complete profile supplying the unattenuated source spectrum. */ readonly profile: Algorithm32ExecutionProfile;
	/** Exact asset selection; null is retained so controller creation can reject a missing selection. */ readonly asset: B1VerifiedCacheAssetSelection | null;
}>;

/** Renderer attachment facts required by the exact B1 source override. */
type B1AssetCacheBackendRequest = Readonly<{
	/** Renderer-owned immutable-texture upload backend. */ readonly backend: CacheGpuBackend;
}>;

/** Attachment-local construction and disposal capability exposed by the exact B1 source. */
interface B1AssetCacheControllerCapability {
	/** Call this method to load or reuse the complete exact cache; failed or cancelled loads reject. */
	createScatteringCache(request?: ScatteringCacheBuildRequest): Promise<GpuScatteringCache>;
	/** Call this method to release the owned cache and reject future loading; repeated disposal is safe. */
	dispose(): void;
}
