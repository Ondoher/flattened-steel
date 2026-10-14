/** Type that identifies one executable cache plan for exact reuse comparison. */
type CacheReuseIdentity = {
	/** Stable executable cache-plan identifier. */
	readonly id: string;
	/** Value that identifies the normalized content. */
	readonly contentHash: string;
};

/** Type that identifies supported first-release cumulative cache maxima. */
type SupportedCacheScatteringOrder = 1 | 2 | 3 | 4 | 5;

/** Type that stores direct options for a selected cache-construction graph. */
type CacheConstructionOptions = {
	/** Value that stores the transport integration interval count. */
	readonly transportIntervalCount: number;
	/** Value that stores the requested maximum scattering order. */
	readonly maximumScatteringOrder: SupportedCacheScatteringOrder;
};

/** Type that identifies whether a field contains one pure order or a cumulative sum. */
type SpectralFieldOrder =
	| {
			/** Value that identifies a pure scattering order. */
			readonly kind: 'pure';
			/** Value that stores the pure scattering-order number. */
			readonly value: number;
	  }
	| {
			/** Cumulative-through discriminator for a sum of pure orders. */
			readonly kind: 'cumulative-through';
			/** Maximum scattering order included in the cumulative field. */
			readonly value: number;
			/** Value that stores the included pure scattering orders. */
			readonly included: readonly number[];
	  };

/** Type that supplies a field order before executable field construction. */
type SpectralFieldOrderDefinition =
	| {
			/** Value that identifies a pure scattering order. */
			readonly kind: 'pure';
			/** Value that stores the pure scattering-order number. */
			readonly value: number;
	  }
	| {
			/** Cumulative-through discriminator for a sum of pure orders. */
			readonly kind: 'cumulative-through';
			/** Maximum scattering order included in the cumulative field. */
			readonly value: number;
			/** Value that stores the included pure scattering orders. */
			readonly included?: readonly number[];
	  };

/** Coordinates of one scalar in a directional spectral field. */
type DirectionalSpectralFieldCoordinates = Readonly<{
	/** Value that stores the direction-domain index. */
	directionIndex: number;
	/** Value that stores the position-domain index. */
	positionIndex: number;
	/** Value that stores the wavelength-basis index. */
	wavelengthIndex: number;
}>;

/** Contract that describes the minimum source-owned executable packing used by CPU storage. */
interface DirectionalSpectralFieldPacking {
	/** Value that identifies the executable packing owner. */
	readonly id: string;

	/** Value that stores the executable number of addressable scalars. */
	readonly scalarCount: number;

	/**
	 * Call this method to resolve the packed scalar offset for field coordinates.
	 *
	 * @param coordinates - Physical field coordinates.
	 * @returns - The packed scalar offset.
	 */
	offset(coordinates: DirectionalSpectralFieldCoordinates): number;

	/**
	 * Call this method to resolve field coordinates at a packed scalar offset.
	 *
	 * @param offset - Packed scalar offset.
	 * @returns - The resolved field coordinates.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Type that configures one private binary64 CPU directional field. */
type CpuDirectionalSpectralFieldDefinition = Readonly<{
	/** Value that identifies the field. */
	id: string;
	/** Value that identifies the physical provenance of stored values. */
	provenanceIdentity: string;
	/** Value that identifies the pure or cumulative scattering order. */
	order: SpectralFieldOrder;
	/** Value that stores the source-owned executable packing. */
	packing: DirectionalSpectralFieldPacking;
}>;

/** Type that reads sealed CPU field values without exposing resident storage. */
type CpuDirectionalSpectralFieldReader = Readonly<{
	/** Value that identifies the field. */
	id: string;
	/** Value that identifies the physical provenance of stored values. */
	provenanceIdentity: string;
	/** Value that identifies the pure or cumulative scattering order. */
	order: SpectralFieldOrder;
	/** Value that stores the number of resident scalar values. */
	scalarCount: number;
	/**
	 * Call this method to read one scalar at physical field coordinates.
	 *
	 * @param coordinates - Physical field coordinates.
	 * @returns - The stored scalar value.
	 */
	readScalar(coordinates: DirectionalSpectralFieldCoordinates): number;
	/**
	 * Call this method to read one scalar at a packed offset.
	 *
	 * @param offset - Packed scalar offset.
	 * @returns - The stored scalar value.
	 */
	readScalarAtOffset(offset: number): number;
}>;

/** Mutable capability for an unpublished CPU field without exposed resident storage. */
type CpuDirectionalSpectralFieldWriter = Readonly<{
	/** Field identifier. */
	id: string;
	/** Physical provenance identity of the stored values. */
	provenanceIdentity: string;
	/** Pure or cumulative scattering order represented by the field. */
	order: SpectralFieldOrder;
	/** Number of resident scalar values. */
	scalarCount: number;
	/**
	 * Call this method to write one scalar at physical field coordinates.
	 *
	 * @param coordinates - The field coordinates.
	 * @param value - The scalar value.
	 * @returns - No return value.
	 */
	writeScalar(coordinates: DirectionalSpectralFieldCoordinates, value: number): void;
	/**
	 * Call this method to write one scalar at a packed offset.
	 *
	 * @param offset - The packed scalar offset.
	 * @param value - The scalar value.
	 * @returns - No return value.
	 */
	writeScalarAtOffset(offset: number, value: number): void;
	/**
	 * Call this method to fill every scalar with one value.
	 *
	 * @param value - The scalar value.
	 * @returns - No return value.
	 */
	fill(value: number): void;
}>;

/** Lifecycle contract for one private binary64 CPU field. */
interface CpuDirectionalSpectralFieldContract {
	/** Field identifier. */
	readonly id: string;
	/** Physical provenance identity of the stored values. */
	readonly provenanceIdentity: string;
	/** Pure or cumulative scattering order represented by the field. */
	readonly order: SpectralFieldOrder;
	/** Number of resident scalar values. */
	readonly scalarCount: number;
	/** Whether the field is sealed against subsequent writes. */
	readonly isSealed: boolean;
	/**
	 * Call this method to create the unpublished field writer.
	 *
	 * @returns - The mutable field writer.
	 */
	createWriter(): CpuDirectionalSpectralFieldWriter;
	/**
	 * Call this method to seal the field against further writes.
	 *
	 * @returns - This sealed field contract.
	 */
	seal(): CpuDirectionalSpectralFieldContract;
	/**
	 * Call this method to create a reader for the sealed field.
	 *
	 * @returns - The sealed field reader.
	 */
	createReader(): CpuDirectionalSpectralFieldReader;
}

/** Input and output capabilities for one synchronous scattering-order kernel invocation. */
type ScatteringOrderKernelInvocation = Readonly<{
	/** Sealed reader for the preceding pure radiance field. */
	previousRadiance: CpuDirectionalSpectralFieldReader;
	/** Mutable writer for the pure scattering output field. */
	outputScattering: CpuDirectionalSpectralFieldWriter;
}>;

/** Operation that ends the writable lifetime of a directional spectral field writer. */
type CpuDirectionalSpectralFieldWriterRevoker =
	/** Called by a revocable writer owner to end the writer's writable lifetime. */ () => void;

/** Writer capability paired with the operation that ends its writable lifetime. */
type RevocableCpuDirectionalSpectralFieldWriter = Readonly<{
	/** Writer capability available until revocation. */
	writer: CpuDirectionalSpectralFieldWriter;
	/** Operation that rejects every subsequent write through the capability. */
	revoke: CpuDirectionalSpectralFieldWriterRevoker;
}>;

/**
 * Synchronous physical scattering calculation whose output begins at zero and
 * whose intentionally unwritten scalars remain zero.
 */
interface ScatteringOrderKernel {
	/**
	 * Call this method to build one pure scattering order from the preceding
	 * pure radiance.
	 *
	 * @param request - The input reader and output writer.
	 * @returns - No return value.
	 */
	buildPureScatteringOrder(request: ScatteringOrderKernelInvocation): void;
}

/** Shared request for one source-owned pure transported-radiance build. */
type CpuTransportedRadianceBuildRequest = Readonly<{
	/** Sealed pure J2 or J3 input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Pure J2 or J3 order transported into radiance. */
	scatteringOrder: 2 | 3 | 4;
	/** Source-owned pure-radiance output identity. */
	id: string;
}>;

/** Shared request for one source-owned pure scattering-kernel build. */
type CpuScatteringKernelBuildRequest = Readonly<{
	/** Pure J2, J3, or J4 order being constructed. */
	scatteringOrder: 2 | 3 | 4 | 5;
	/** Pure L(k-2) field for reflective higher-order ground, or null when unused. */
	groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null;
}>;

/** Request for one pure-radiance to pure-scattering field build. */
type NextScatteringOrderBuildRequest = Readonly<{
	/** Preceding pure radiance field. */
	previousRadiance: CpuDirectionalSpectralFieldContract;
	/** Pure scattering output field. */
	outputScattering: CpuDirectionalSpectralFieldContract;
	/** Synchronous scattering kernel. */
	kernel: ScatteringOrderKernel;
}>;

/** Request containing contiguous pure scattering fields and their cumulative target. */
type PureScatteringFieldAccumulationRequest = Readonly<{
	/** Contiguous pure scattering fields. */
	pureFields: readonly CpuDirectionalSpectralFieldContract[];
	/** Cumulative output field. */
	cumulativeField: CpuDirectionalSpectralFieldContract;
	/** Source-owned executable shared scattering-field packing. */
	packing: DirectionalSpectralFieldPacking;
}>;

/** Type that describes geometry's physical cache-position stencil request. */
type ScatteringCachePositionStencilRequest = {
	/** Value that stores the physical sample position. */
	position: Position;
	/** Value that stores geometry's atmosphere coordinate for the physical sample position. */
	atmosphereCoordinate: AtmosphereCoordinate;
};

/** Type that describes a weighted position-domain stencil. */
type ScatteringCachePositionStencil = {
	/** Value that stores the resolved position-domain indices. */
	indices: readonly number[];
	/** Value that stores the interpolation weights. */
	weights: readonly number[];
};

/** Type that describes geometry's source-frame direction request. */
type ScatteringCacheDirectionRequest = {
	/** Value that stores the physical sample position. */
	position: Position;
	/** Value that stores the physical outgoing direction. */
	physicalOutgoingDirection: UnitVector3;
};

/** Type that describes geometry's inverse source-frame direction request. */
type ScatteringCacheFramedDirectionRequest = {
	/** Value that stores the physical sample position for position-varying source frames. Spherical/distant frames may omit it. */
	readonly position?: Position;
	/** Value that stores the source-local cache direction. */
	readonly cacheDirection: UnitVector3;
};

/** Type that describes a weighted direction-domain stencil. */
type ScatteringCacheDirectionStencil = {
	/** Value that stores the resolved direction-domain indices. */
	indices: readonly number[];
	/** Value that stores the interpolation weights. */
	weights: readonly number[];
};

/** Pairing-neutral physical context for one cumulative scattering-cache sample. */
type ScatteringCacheSampleContext = Readonly<{
	/** Physical model-space sample position. */
	readonly position: Position;
	/** Geometry-resolved atmosphere coordinate at the physical position. */
	readonly atmosphereCoordinate: AtmosphereCoordinate;
	/** Physical model-space outgoing direction viewed from the sample. */
	readonly physicalOutgoingDirection: UnitVector3;
}>;

/** Request that pairs physical sample context with the active geometry interpreter. */
type ScatteringCacheSampleRequest = Readonly<{
	/** Pairing-neutral physical sample context. */
	readonly context: ScatteringCacheSampleContext;
	/** Active geometry that interprets the physical context for the concrete cache. */
	readonly geometry: GeometryModel;
}>;

/** Type that describes transient inputs for a source-owned scattering-cache build. */
type ScatteringCacheBuildRequest = Readonly<{
	/** Additional GPU payload outside this controller for compact-cache diagnostics. It does not impose a browser admission ceiling; ordinary display/shadow targets are accounted separately. */
	otherOwnedGpuBytes?: UnitValue<'bytes'>;
	/** Optional caller cancellation for this construction request. */
	signal?: AbortSignal;
}>;

/** Type that describes one geometry-resolved coordinate used during cache construction. */
type CacheBuildCoordinate = {
	/** Value that stores the stable cache-local coordinate key. */
	coordinateKey: string;

	/** Value that stores numeric lookup coordinates in cache-owned order. */
	coordinates: readonly number[];

	/** Value that stores an optional altitude bin index. */
	altitudeBinIndex?: number;

	/** Value that stores an optional incoming-direction index. */
	directionIndex?: number;

	/** Value that stores an optional source-relative vertical bin index. */
	zBinIndex?: number;

	/** Value that stores an optional source-relative radial bin index. */
	rhoBinIndex?: number;

	/** Value that stores optional physical altitude for cache construction. */
	altitude?: Distance;

	/** Value that stores optional physical source-relative radial distance. */
	rho?: Distance;

	/** Value that stores the incoming direction represented by the coordinate. */
	incomingDirection?: UnitVector3;

	/** Value that stores owner-specific coordinate metadata. */
	metadata?: unknown;
};

/** Contract that provides the common Algorithm32-facing contract for one source-owned, observer-independent cumulative scattering cache. This interface is not a universal concrete cache implementation. Each atmospheric light-source kind owns its concrete cache type, physical domains, source-relative mapping, storage layout, and primary-field builder. */
interface ScatteringCache {
	/**
	 * Call this method to release the resources owned by this cache. Repeated disposal is safe.
	 *
	 * @returns - No return value.
	 */
	dispose(): void;
}

/** Contract that provides synchronous resolved sampling for a resident CPU oracle cache. */
interface CpuScatteringCache extends ScatteringCache {
	/** Value that identifies the physical provenance of returned spectral samples. */
	readonly sampleProvenanceIdentity: string;

	/**
	 * Call this method to sample the cache from pairing-neutral physical context.
	 *
	 * @param request - Resolved position and direction stencils.
	 * @returns - The cumulative local spectral scattering density.
	 */
	sampleCumulativeScatteringDensity(request: ScatteringCacheSampleRequest): SpectralScatteringDensityPacket;
}

/** Contract that provides final-view shader assembly and opaque bindings for a GPU-resident cumulative scattering cache. */
interface GpuScatteringCache extends ScatteringCache {
	/**
	 * Call this method to contribute source-specific final-view lookup code and bindings.
	 *
	 * @param request - Direct accepted shader build facts.
	 * @returns - One or more runtime shader contributions.
	 */
	createShaderContribution(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];

	/**
	 * Call this method to return opaque runtime bindings for the privately owned cumulative field.
	 *
	 * @returns - The result produced by the operation.
	 */
	getRuntimeBindings(): CacheRuntimeBindings;
	/** Call this method to obtain an optional complete live publication without rebuilding shader source. */
	getRuntimePublication?(): CacheRuntimePublication;
}

/** Type that supplies one renderer attachment's cache-construction capability. */
type CacheControllerRequest = Readonly<{
	/** Aggregate execution model retained by the source-specific controller. */
	model: SharedModel;
	/** Value that supplies the renderer-owned cache backend. */
	backend: CacheGpuBackend;
	/** Optional callback that yields construction at executor-declared safe boundaries. */
	scheduler?: CacheBuildScheduler;
}>;

/** Contract that owns source-specific cache staging and publication for one runtime consumer. */
interface CacheController {
	/** Value that stores the complete cache currently published to this consumer. */
	readonly active: GpuScatteringCache | null;

	/**
	 * Call this method to construct, reuse, and publish one complete source-owned cache.
	 *
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	createScatteringCache(request: ScatteringCacheBuildRequest): Promise<GpuScatteringCache>;

	/** Call this method to cancel staging and release the active cache. */
	dispose(): void;
}
