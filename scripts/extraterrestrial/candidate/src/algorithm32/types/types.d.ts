/**
 * Store one normalized three-dimensional vector.
 */
type UnitVector3 = readonly [number, number, number];

/**
 * Describe direct lighting supplied by a configured light source.
 */
type DirectLightingSample = {
	/**
	 * Store source spectral irradiance aligned to the active spectral basis.
	 */
	sourceIrradiance: SpectralIrradiancePacket;

	/**
	 * Store the normalized direction from the sample point toward the light.
	 */
	directionToLight: UnitVector3;

	/**
	 * Store source-path transmittance when the source owns a precomputed value.
	 */
	sourceTransmittance?: SpectralTransmittancePacket;

	/**
	 * Store owner-specific metadata for validation or diagnostics.
	 */
	metadata?: unknown;
}

/**
 * Describe how far a source path may travel before geometry or source policy
 * terminates it.
 */
type SourcePathLimit = {
	/**
	 * Store the maximum source-path distance, or null when the source is
	 * directional. Units travel with the value.
	 */
	maxDistance: Distance | null;

	/**
	 * Explain the source-owned path limit policy.
	 */
	reason: string;
}

/**
 * Describe one ground boundary without exposing private implementation state.
 */
type GroundBoundaryDescriptor = Readonly<{
	/** Identify the descriptor kind. */
	kind: "algorithm32-ground-boundary";

	/** Identify the configured boundary instance. */
	id: string;

	/** Identify the immutable boundary descriptor schema. */
	schemaRevision: string;

	/** Identify the boundary implementation model. */
	model: string;

	/** Identify the BRDF quantity and unit representation. */
	quantity: "spectral-brdf";
	/** Identify the physical units. */
	units: "sr^-1";

	/** Identify the boundary BRDF contract. */
	brdf: string;

	/** Identify the spectral basis used by the boundary. */
	spectralBasisHash: string;

	/** Identify the profile-supplied albedo content. */
	albedoHash: string;

	/** Store the stable cache-compatibility content identity. */
	contentHash: string;
}>;

/** Describe a geometry-owned ground hit. */
type GroundIntersection = Readonly<{
	/** Store the physical position. */
	position: Position;
	/** Store the outward unit normal. */
	normal: UnitVector3;
	/** Store the physical distance. */
	distance: Distance;
}>;

/** Describe inputs for one ground-boundary BRDF evaluation. */
type GroundBrdfRequest = Readonly<{
	/** Store the geometry-resolved ground hit. */
	hit: GroundIntersection;
	/** Store the direction from the hit toward the sampled incoming field. */
	incomingDirection: UnitVector3;
	/** Store the direction from the hit toward the reflected-radiance receiver. */
	outgoingDirection: UnitVector3;
	/** Store the exact requested spectral basis. */
	spectralBasis: SpectralBasis;
}>;

/** Describe one incoming/outgoing direction pair for phase evaluation. */
type ScatteringPhaseRequest = {
	/** Store the incoming physical direction. */
	incomingDirection: UnitVector3;
	/** Store the evaluated view direction. */
	viewDirection: UnitVector3;
}

/** Identify one immutable construction dependency by exact content. */
type CacheDescriptorIdentity = {
	/** Identify this value. */
	readonly id: string;
	/** Identify the normalized content. */
	readonly contentHash: string;
}

/** Identify supported first-release cumulative cache maxima. */
type SupportedCacheScatteringOrder = 1 | 2 | 4;

/** Supply cache-construction controls before descriptor normalization. */
type CacheConstructionControlsDefinition = {
	/** Store the stable controls identity. */
	readonly id: string;

	/** Override the current controls schema revision. */
	readonly schemaRevision?: string;

	/** Store the construction transport interval count. */
	readonly transportIntervalCount: number;

	/** Store the requested cumulative scattering maximum. */
	readonly maximumScatteringOrder: SupportedCacheScatteringOrder;
};

/** Describe cache-construction controls. */
type CacheConstructionControlsDescriptor = {
	/** Identify the contract kind. */
	readonly kind: "cache-construction-controls";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Store the transport integration interval count. */
	readonly transportIntervalCount: number;
	/** Store the requested maximum scattering order. */
	readonly maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Identify the normalized content. */
	readonly contentHash: string;
}

/** Describe the scalar array-texture layout used by one field. */
type ScalarArrayTextureLayoutDescriptor = {
	/** Identify the contract kind. */
	readonly kind: "scalar-array-texture-layout";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the storage format. */
	readonly format: "R32F";
	/** Identify the numeric precision. */
	readonly precision: "binary32";
	/** Describe the storage-axis mapping. */
	readonly axes: {
		/** Store the x. */
		readonly x: "direction";
		/** Store the y. */
		readonly y: "position";
		/** Store the layer. */
		readonly layer: "wavelength";
	};
	/** Describe the storage dimensions. */
	readonly shape: {
		/** Store the direction extent. */
		readonly direction: number;
		/** Store the physical position. */
		readonly position: number;
		/** Store the wavelength extent. */
		readonly wavelength: number;
	};
	/** Store the scalar channel count. */
	readonly channelCount: 1;
	/** Store the required storage size. */
	readonly storage: {
		/** Store the byte count. */
		readonly value: number;
		/** Identify byte units. */
		readonly units: "bytes";
	};
	/** Identify the normalized content. */
	readonly contentHash: string;
}

/** Supply an R32F scalar array-texture layout before normalization. */
type ScalarArrayTextureLayoutDefinition = {
	/** Store the stable layout identity. */
	readonly id: string;

	/** Override the current layout schema revision. */
	readonly schemaRevision?: string;

	/** Store the direction-axis size. */
	readonly directionCount: number;

	/** Store the position-axis size. */
	readonly positionCount: number;

	/** Store the wavelength-layer count. */
	readonly wavelengthCount: number;
};

/** Configure declarative binary64 dense-array storage for a CPU field. */
type DenseScalarArrayLayoutDefinition = Readonly<{
	/** Identify this value. */
	id: string;
	/** Identify the schema revision. */
	schemaRevision?: string;
	/** Store the direction count. */
	directionCount: number;
	/** Store the position count. */
	positionCount: number;
	/** Store the wavelength count. */
	wavelengthCount: number;
}>;

/** Describe declarative binary64 dense-array storage used by a CPU field. */
type DenseScalarArrayLayoutDescriptor = {
	/** Identify the contract kind. */
	readonly kind: "dense-scalar-array-layout";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the storage format. */
	readonly format: "Float64Array";
	/** Identify the numeric precision. */
	readonly precision: "binary64";
	/** Describe the storage-axis mapping. */
	readonly axes: {
		/** Identify the fastest-varying axis. */
		readonly fastest: "direction";
		/** Identify the middle-varying axis. */
		readonly middle: "position";
		/** Identify the slowest-varying axis. */
		readonly slowest: "wavelength";
	};
	/** Describe the storage dimensions. */
	readonly shape: {
		/** Store the direction extent. */
		readonly direction: number;
		/** Store the physical position. */
		readonly position: number;
		/** Store the wavelength extent. */
		readonly wavelength: number;
	};
	/** Store the number of resident scalar values. */
	readonly scalarCount: number;
	/** Store the required storage size. */
	readonly storage: {
		/** Store the byte count. */
		readonly value: number;
		/** Identify byte units. */
		readonly units: "bytes";
	};
	/** Identify the normalized content. */
	readonly contentHash: string;
}

/** Identify whether a field contains one pure order or a cumulative sum. */
type SpectralFieldOrder =
	| {
		/** Identify a pure scattering order. */
		readonly kind: "pure";
		/** Store the pure scattering-order number. */
		readonly value: number;
	}
	| {
		/** Identify the contract kind. */
		readonly kind: "cumulative-through";
		/** Store the scalar value. */
		readonly value: number;
		/** Store the included pure scattering orders. */
		readonly included: readonly number[];
	};

/** Describe identity fields common to every directional field representation. */
type DirectionalSpectralFieldIdentityDescriptor = {
	/** Identify the contract kind. */
	readonly kind: "directional-spectral-field";
	/** Identify this value. */
	readonly id: string;
	/** Identify the schema revision. */
	readonly schemaRevision: string;
	/** Identify the spectral sample semantics. */
	readonly sampleSemantics: SpectralSampleSemantics;
	/** Identify the value provenance. */
	readonly provenanceIdentity: string;
	/** Identify the spectral basis. */
	readonly basis: SpectralBasis;
	/** Store the physical position domain. */
	readonly positionDomain: PositionDomainDescriptor;
	/** Store the physical direction domain. */
	readonly directionDomain: DirectionDomainDescriptor;
	/** Identify the normalized content. */
	readonly contentHash: string;
}

/** Pair precision with the only storage layout that truthfully represents it. */
type DirectionalSpectralFieldStorageDescriptor =
	| {
		/** Identify the numeric precision. */
		readonly precision: "binary32";
		/** Store the matching physical storage layout. */
		readonly layout: ScalarArrayTextureLayoutDescriptor;
	}
	| {
		/** Identify the numeric precision. */
		readonly precision: "binary64";
		/** Store the matching physical storage layout. */
		readonly layout: DenseScalarArrayLayoutDescriptor;
	};

/** Describe fields shared by radiance and scattering-density descriptors. */
type DirectionalSpectralFieldDescriptorBase =
	DirectionalSpectralFieldIdentityDescriptor
	& DirectionalSpectralFieldStorageDescriptor;

/** Describe one typed directional spectral field. */
type DirectionalSpectralFieldDescriptor =
	| (DirectionalSpectralFieldDescriptorBase & {
		/** Identify the physical quantity. */
		readonly quantity: "spectral-radiance-density";
		/** Identify the physical units. */
		readonly units: "W m^-2 sr^-1 nm^-1";
		/** Identify the direction domain role. */
		readonly directionRole: "incoming-radiance";
		/** Identify the pure or cumulative scattering order. */
		readonly order: SpectralFieldOrder;
	})
	| (DirectionalSpectralFieldDescriptorBase & {
		/** Identify the physical quantity. */
		readonly quantity: "spectral-scattering-density";
		/** Identify the physical units. */
		readonly units: "W m^-3 sr^-1 nm^-1";
		/** Identify the direction domain role. */
		readonly directionRole: "outgoing-scattering-density";
		/** Identify the pure or cumulative scattering order. */
		readonly order: SpectralFieldOrder;
	});

/** Supply a field order before descriptor normalization. */
type SpectralFieldOrderDefinition =
	| {
		/** Identify a pure scattering order. */
		readonly kind: "pure";
		/** Store the pure scattering-order number. */
		readonly value: number;
	}
	| {
		/** Identify the contract kind. */
		readonly kind: "cumulative-through";
		/** Store the scalar value. */
		readonly value: number;
		/** Store the included pure scattering orders. */
		readonly included?: readonly number[];
	};

/** Supply one directional spectral field before descriptor normalization. */
type DirectionalSpectralFieldDefinition = {
	/** Store the stable field identity. */
	readonly id: string;

	/** Override the current field schema revision. */
	readonly schemaRevision?: string;

	/** Identify the physical spectral quantity. */
	readonly quantity: "spectral-radiance-density" | "spectral-scattering-density";

	/** Identify the physical spectral units. */
	readonly units: "W m^-2 sr^-1 nm^-1" | "W m^-3 sr^-1 nm^-1";

	/** Identify the direction domain's physical role. */
	readonly directionRole: "incoming-radiance" | "outgoing-scattering-density";

	/** Store the spectral sampling basis. */
	readonly basis: SpectralBasis;

	/** Store the physical position domain. */
	readonly positionDomain: PositionDomainDescriptor;

	/** Store the physical direction domain. */
	readonly directionDomain: DirectionDomainDescriptor;

	/** Store the CPU or GPU field layout. */
	readonly layout: DenseScalarArrayLayoutDescriptor | ScalarArrayTextureLayoutDescriptor;

	/** Identify the matching numeric precision. */
	readonly precision: "binary32" | "binary64";

	/** Identify the pure or cumulative scattering order. */
	readonly order: SpectralFieldOrderDefinition;

	/** Identify the data provenance used to construct the field. */
	readonly provenanceIdentity: string;
};

/** Describe one directional field backed by the CPU binary64 representation. */
type CpuDirectionalSpectralFieldDescriptor =
	DirectionalSpectralFieldDescriptor & {
		/** Identify the numeric precision. */
		readonly precision: "binary64";
		/** Store the matching physical storage layout. */
		readonly layout: DenseScalarArrayLayoutDescriptor;
	};

/** Describe a cumulative scattering-density field, including internal targets. */
type CumulativeScatteringDensityFieldDescriptor =
	DirectionalSpectralFieldDescriptorBase & {
		/** Identify the physical quantity. */
		readonly quantity: "spectral-scattering-density";
		/** Identify the physical units. */
		readonly units: "W m^-3 sr^-1 nm^-1";
		/** Identify the direction domain role. */
		readonly directionRole: "outgoing-scattering-density";
		/** Identify the pure or cumulative scattering order. */
		readonly order: {
			/** Identify the contract kind. */
			readonly kind: "cumulative-through";
			/** Store the scalar value. */
			readonly value: number;
			/** Store the included pure scattering orders. */
			readonly included: readonly number[];
		};
	};

/** Describe any internal or publishable cumulative CPU-oracle target. */
type CpuCumulativeScatteringDensityFieldDescriptor =
	CumulativeScatteringDensityFieldDescriptor & {
		/** Identify the numeric precision. */
		readonly precision: "binary64";
		/** Store the matching physical storage layout. */
		readonly layout: DenseScalarArrayLayoutDescriptor;
	};

/** Restrict a cumulative field to one supported publishable cache maximum. */
type PublishableCumulativeScatteringDensityFieldDescriptor =
	CumulativeScatteringDensityFieldDescriptor & {
		/** Identify the pure or cumulative scattering order. */
		readonly order: {
			/** Identify the contract kind. */
			readonly kind: "cumulative-through";
			/** Store the scalar value. */
			readonly value: SupportedCacheScatteringOrder;
			/** Store the included pure scattering orders. */
			readonly included: readonly number[];
		};
	};

/** Describe the only cumulative storage representation accepted by GPU builds. */
type GpuPublishableCumulativeScatteringDensityFieldDescriptor =
	PublishableCumulativeScatteringDensityFieldDescriptor & {
		/** Identify the numeric precision. */
		readonly precision: "binary32";
		/** Store the matching physical storage layout. */
		readonly layout: ScalarArrayTextureLayoutDescriptor;
	};

/** Address one scalar in a directional spectral field. */
type DirectionalSpectralFieldCoordinates = Readonly<{
	/** Store the direction-domain index. */
	directionIndex: number;
	/** Store the position-domain index. */
	positionIndex: number;
	/** Store the wavelength-basis index. */
	wavelengthIndex: number;
}>;

/** Describe the minimum source-owned executable packing used by CPU storage. */
interface DirectionalSpectralFieldPacking {
	/** Store descriptive metadata emitted from the executable packing facts. */
	readonly layout: DenseScalarArrayLayoutDescriptor;

	/** Store the executable number of addressable scalars. */
	readonly scalarCount: number;

	/**
	 * Resolve the packed scalar offset for field coordinates.
	 *
	 * @param coordinates - Supplies the field coordinates.
	 * @returns The packed scalar offset.
	 */
	offset(coordinates: DirectionalSpectralFieldCoordinates): number;

	/**
	 * Resolve field coordinates at a packed scalar offset.
	 *
	 * @param offset - Supplies the packed scalar offset.
	 * @returns The resolved field coordinates.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Configure one private binary64 CPU directional field. */
type CpuDirectionalSpectralFieldDefinition = Readonly<{
	/** Store field identity and reporting metadata. */
	descriptor: CpuDirectionalSpectralFieldDescriptor;
	/** Store the source-owned executable packing. */
	packing: DirectionalSpectralFieldPacking;
}>;

/** Read sealed CPU field values without exposing resident storage. */
type CpuDirectionalSpectralFieldReader = Readonly<{
	/** Store field identity and reporting metadata. */
	descriptor: CpuDirectionalSpectralFieldDescriptor;
	/** Store the number of resident scalar values. */
	scalarCount: number;
	/**
	 * Read one scalar at physical field coordinates.
	 *
	 * @param coordinates - Supplies the field coordinates.
	 * @returns The stored scalar value.
	 */
	readScalar(coordinates: DirectionalSpectralFieldCoordinates): number;
	/**
	 * Read one scalar at a packed offset.
	 *
	 * @param offset - Supplies the packed scalar offset.
	 * @returns The stored scalar value.
	 */
	readScalarAtOffset(offset: number): number;
}>;

/** Mutate an unpublished CPU field without exposing resident storage. */
type CpuDirectionalSpectralFieldWriter = Readonly<{
	/** Store field identity and reporting metadata. */
	descriptor: CpuDirectionalSpectralFieldDescriptor;
	/** Store the number of resident scalar values. */
	scalarCount: number;
	/**
	 * Write one scalar at physical field coordinates.
	 *
	 * @param coordinates - Supplies the field coordinates.
	 * @param value - Supplies the scalar value.
	 * @returns No return value.
	 */
	writeScalar(
		coordinates: DirectionalSpectralFieldCoordinates,
		value: number,
	): void;
	/**
	 * Write one scalar at a packed offset.
	 *
	 * @param offset - Supplies the packed scalar offset.
	 * @param value - Supplies the scalar value.
	 * @returns No return value.
	 */
	writeScalarAtOffset(offset: number, value: number): void;
	/**
	 * Fill every scalar with one value.
	 *
	 * @param value - Supplies the scalar value.
	 * @returns No return value.
	 */
	fill(value: number): void;
}>;

/** Describe the lifecycle surface of one private binary64 CPU field. */
interface CpuDirectionalSpectralFieldContract {
	/** Store field identity and reporting metadata. */
	readonly descriptor: CpuDirectionalSpectralFieldDescriptor;
	/** Store the number of resident scalar values. */
	readonly scalarCount: number;
	/** Indicate whether the field is sealed. */
	readonly isSealed: boolean;
	/**
	 * Create the unpublished field writer.
	 *
	 * @returns The mutable field writer.
	 */
	createWriter(): CpuDirectionalSpectralFieldWriter;
	/**
	 * Seal the field against further writes.
	 *
	 * @returns This sealed field contract.
	 */
	seal(): CpuDirectionalSpectralFieldContract;
	/**
	 * Create a reader for the sealed field.
	 *
	 * @returns The sealed field reader.
	 */
	createReader(): CpuDirectionalSpectralFieldReader;
}

/**
 * Supply a synchronous physical scattering calculation. Output begins at
 * zero, and unwritten scalars intentionally remain zero.
 */
interface ScatteringOrderKernel {
	/**
	 * Build one pure scattering order from the preceding pure radiance.
	 *
	 * @param request - Supplies the input reader and output writer.
	 * @returns No return value.
	 */
	buildPureScatteringOrder(request: Readonly<{
		/** Store the preceding pure radiance field. */
		previousRadiance: CpuDirectionalSpectralFieldReader;
		/** Store the pure scattering output field. */
		outputScattering: CpuDirectionalSpectralFieldWriter;
	}>): void;
}

/** Supply one pure-radiance to pure-scattering field build. */
type NextScatteringOrderBuildRequest = Readonly<{
	/** Store the preceding pure radiance field. */
	previousRadiance: CpuDirectionalSpectralFieldContract;
	/** Store the pure scattering output field. */
	outputScattering: CpuDirectionalSpectralFieldContract;
	/** Store the synchronous scattering kernel. */
	kernel: ScatteringOrderKernel;
}>;

/** Supply contiguous pure scattering fields and their cumulative target. */
type PureScatteringFieldAccumulationRequest = Readonly<{
	/** Store contiguous pure scattering fields. */
	pureFields: readonly CpuDirectionalSpectralFieldContract[];
	/** Store the cumulative output field. */
	cumulativeField: CpuDirectionalSpectralFieldContract;
	/** Store the source-owned executable shared scattering-field packing. */
	packing: DirectionalSpectralFieldPacking;
}>;

/** Describe one source-owned cumulative scattering cache. */
type ScatteringCacheDescriptor = {
	/** Identify the scattering-cache contract kind. */
	readonly kind: "scattering-cache";
	/** Identify the source-owned cache. */
	readonly id: string;
	/** Identify the cache schema revision. */
	readonly schemaRevision: string;
	/** Store the publishable cumulative scattering field. */
	readonly field: PublishableCumulativeScatteringDensityFieldDescriptor;
	/** Store the incoming-direction quadrature domain. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;
	/** Store cache-construction controls. */
	readonly controls: CacheConstructionControlsDescriptor;
	/** Store all transport-relevant construction identities. */
	readonly constructionIdentities: {
		/** Identify the atmospheric source state. */
		readonly source: CacheDescriptorIdentity;
		/** Identify the atmosphere state. */
		readonly atmosphere: CacheDescriptorIdentity;
		/** Identify the physical geometry state. */
		readonly geometry: CacheDescriptorIdentity;
		/** Identify the ground-boundary state. */
		readonly boundary: CacheDescriptorIdentity;
	};
	/** Identify the normalized cache descriptor content. */
	readonly contentHash: string;
}

/** Supply construction identities for a source-owned scattering cache. */
type ScatteringCacheConstructionIdentitiesDefinition = {
	/** Identify the atmospheric source state. */
	readonly source: CacheDescriptorIdentity;

	/** Identify the atmosphere state. */
	readonly atmosphere: CacheDescriptorIdentity;

	/** Identify the physical geometry state. */
	readonly geometry: CacheDescriptorIdentity;

	/** Identify the ground boundary, or omit it for canonical black ground. */
	readonly boundary?: CacheDescriptorIdentity;
};

/** Supply a scattering-cache descriptor before normalization. */
type ScatteringCacheDescriptorDefinition = {
	/** Store the stable cache identity. */
	readonly id: string;

	/** Override the current cache schema revision. */
	readonly schemaRevision?: string;

	/** Store the cumulative scattering-density field. */
	readonly field: PublishableCumulativeScatteringDensityFieldDescriptor;

	/** Store the independently indexed incoming quadrature domain. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;

	/** Store construction controls. */
	readonly controls: CacheConstructionControlsDescriptor;

	/** Store every transport-relevant construction identity. */
	readonly constructionIdentities: ScatteringCacheConstructionIdentitiesDefinition;
};

/** Describe geometry's physical cache-position stencil request. */
type ScatteringCachePositionStencilRequest = {
	/** Store the physical sample position. */
	position: Position;
	/** Store geometry's atmosphere coordinate for the physical sample position. */
	atmosphereCoordinate: AtmosphereCoordinate;
}

/** Describe a weighted position-domain stencil. */
type ScatteringCachePositionStencil = {
	/** Store the resolved position-domain indices. */
	indices: readonly number[];
	/** Store the interpolation weights. */
	weights: readonly number[];
}

/** Describe geometry's source-frame direction request. */
type ScatteringCacheDirectionRequest = {
	/** Store the physical sample position. */
	position: Position;
	/** Store the physical outgoing direction. */
	physicalOutgoingDirection: UnitVector3;
}

/** Describe geometry's inverse source-frame direction request. */
type ScatteringCacheFramedDirectionRequest = {
	/**
	 * Store the physical sample position for position-varying source frames.
	 * Spherical/distant frames may omit it.
	 */
	readonly position?: Position;
	/** Store the source-local cache direction. */
	readonly cacheDirection: UnitVector3;
}

/** Describe a weighted direction-domain stencil. */
type ScatteringCacheDirectionStencil = {
	/** Store the resolved direction-domain indices. */
	indices: readonly number[];
	/** Store the interpolation weights. */
	weights: readonly number[];
}

/** Describe one resolved cumulative-cache sample request. */
type ScatteringCacheSampleRequest = {
	/** Store the geometry-resolved position stencil. */
	positionStencil: ScatteringCachePositionStencil;
	/** Store the direction-domain stencil. */
	directionStencil: ScatteringCacheDirectionStencil;
}

/** Describe public physical inputs for a source-owned scattering-cache build. */
type ScatteringCacheBuildRequest = Readonly<{
	/** Supply the configured atmosphere and its GPU construction contribution. */
	atmosphere: AtmosphereModel & CacheBuildContributor;
	/** Supply the configured geometry and its GPU construction contribution. */
	geometry: GeometryModel & CacheBuildContributor;
	/** Supply an optional reflecting boundary and its construction contribution. */
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
	/** Supply the accepted spectral basis. */
	spectralBasis: SpectralBasis;
	/** Select N1, N2, or default N4 construction. */
	maximumScatteringOrder?: SupportedCacheScatteringOrder;

	/** Cancel this construction request. */
	signal?: AbortSignal;
}>;

/** Identify the physical measure owned by an extraterrestrial source. */
type ExtraterrestrialSourceKind = "point" | "extended";

/** Describe a spectral source packet that may cross the extraterrestrial boundary. */
type ExtraterrestrialSpectralDensityPacket = {
	/** Identify the physical spectral quantity. */
	quantity: "spectral-irradiance-density" | "spectral-radiance-density";
	/** Identify the physical spectral units. */
	units: "W m^-2 nm^-1" | "W m^-2 sr^-1 nm^-1";
	/** Identify the spectral basis. */
	spectral: SpectralBasis;
	/** Store the ordered spectral values. */
	values: readonly number[];
	/** Store the source-data provenance. */
	provenance: unknown;
	/** Store the source-data uncertainty description. */
	uncertainty: unknown;
	/** Identify the normalized source state. */
	fingerprint: string;
}

/** Describe source-owned geometry without embedding source radiometry. */
type ExtraterrestrialGeometryDescriptor = {
	/** Identify the source geometry kind. */
	kind: string;
	/** Identify the source geometry owner. */
	owner: string;
	/** Identify the normalized geometry state. */
	fingerprint: string;
}

/** Describe one immutable point or extended extraterrestrial source. */
type ExtraterrestrialSourceDescriptor = {
	/** Identify the configured extraterrestrial source. */
	id: string;
	/** Identify the source kind. */
	kind: ExtraterrestrialSourceKind;
	/** Store the source-owned geometry. */
	geometry: ExtraterrestrialGeometryDescriptor;
	/** Store the typed spectral source measure. */
	spectralMeasure: ExtraterrestrialSpectralDensityPacket;
	/** Store source provenance. */
	provenance: unknown;
	/** Identify the normalized source state. */
	fingerprint: string;
}

/** Describe a finite or directional source depth. */
type ExtraterrestrialSourceDepth =
	| {
		/** Identify finite source depth. */
		kind: "finite";
		/** Store the finite source distance. */
		distance: Distance;
	}
	| {
		/** Identify directional source depth. */
		kind: "infinite";
	};

/** Describe one exact source direction used for visibility and transport. */
type ExactExtraterrestrialSourceRay = {
	/** Store the extraterrestrial source descriptor. */
	source: ExtraterrestrialSourceDescriptor;
	/** Store the exact camera-space source direction. */
	directionCamera: UnitVector3;
	/** Store the source depth policy. */
	depth: ExtraterrestrialSourceDepth;
}

/** Describe geometry-only visibility at one exact extraterrestrial ray. */
type ExtraterrestrialVisibilityResult = {
	/** Indicate whether the exact source ray is visible. */
	visible: boolean;
	/** Store the resolved occluder when present. */
	occluder: unknown | null;
}

/** Describe one typed spectral transmittance result. */
type ExtraterrestrialTransmittanceSample = {
	/** Identify the spectral-transmittance quantity. */
	quantity: "spectral-transmittance";
	/** Identify dimensionless transmittance units. */
	units: "1";
	/** Identify the spectral basis. */
	spectral: SpectralBasis;
	/** Store the ordered spectral values. */
	values: readonly number[];
}

/** Describe a pixel-domain spectral radiance contribution after transport. */
type ExtraterrestrialPixelContribution = {
	/** Store the horizontal pixel coordinate. */
	pixelX: number;
	/** Store the vertical pixel coordinate. */
	pixelY: number;
	/** Store the pixel solid angle. */
	pixelSolidAngle: SolidAngle;
	/** Identify the spectral-radiance-density quantity. */
	quantity: "spectral-radiance-density";
	/** Identify spectral-radiance-density units. */
	units: "W m^-2 sr^-1 nm^-1";
	/** Identify the spectral basis. */
	spectral: SpectralBasis;
	/** Store the ordered spectral values. */
	values: readonly number[];
}

/** Describe a point-source request. Response weights distribute transmitted flux. */
type PointExtraterrestrialSourceRequest = {
	/** Store the point-source contract. */
	source: ExtraterrestrialSource;
	/** Store the exact camera-space source direction. */
	directionCamera: UnitVector3;
	/** Store the source depth policy. */
	depth: ExtraterrestrialSourceDepth;
}

/** Describe an extended-source request. Quadrature belongs to the integrator. */
type ExtendedExtraterrestrialSourceRequest = {
	/** Store the extended-source contract. */
	source: ExtraterrestrialSource;
	/** Store the source depth policy. */
	depth: ExtraterrestrialSourceDepth;
	/** Store the directional quadrature. */
	quadrature: unknown;
}
/** Describe one geometry-resolved coordinate used during cache construction. */
type CacheBuildCoordinate = {
	/**
	 * Store the stable cache-local coordinate key.
	 */
	coordinateKey: string;

	/**
	 * Store numeric lookup coordinates in cache-owned order.
	 */
	coordinates: readonly number[];

	/**
	 * Store an optional altitude bin index.
	 */
	altitudeBinIndex?: number;

	/**
	 * Store an optional incoming-direction index.
	 */
	directionIndex?: number;

	/**
	 * Store an optional source-relative vertical bin index.
	 */
	zBinIndex?: number;

	/**
	 * Store an optional source-relative radial bin index.
	 */
	rhoBinIndex?: number;

	/**
	 * Store optional physical altitude for cache construction.
	 */
	altitude?: Distance;

	/**
	 * Store optional physical source-relative radial distance.
	 */
	rho?: Distance;

	/**
	 * Store the incoming direction represented by the coordinate.
	 */
	incomingDirection?: UnitVector3;

	/**
	 * Store owner-specific coordinate metadata.
	 */
	metadata?: unknown;
}

/**
 * Describe a configured light-source model without exposing private
 * implementation state.
 */
type LightSourceModelDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	kind: "algorithm32-light-source-model";

	/**
	 * Identify the configured light-source model instance.
	 */
	id: string;

	/**
	 * Store a stable compatibility fingerprint for cache and shader resources.
	 */
	fingerprint: string;
}

/**
 * Describe an atmosphere coordinate resolved by geometry.
 */
type AtmosphereCoordinate = {
	/**
	 * Store altitude above the active atmosphere bottom boundary.
	 */
	altitude: Distance;

	/**
	 * Store optional horizontal distance from a finite source subpoint when
	 * required by the selected flat/local cache.
	 */
	rho?: Distance;
}

/**
 * Describe one sampled atmosphere path point.
 */
type AtmospherePathSample = {
	/**
	 * Store the atmosphere coordinate represented by this path sample.
	 */
	atmosphereCoordinate: AtmosphereCoordinate;

	/**
	 * Store the effective path measure represented by this sample.
	 */
	measure: Distance;

	/**
	 * Store the interval length from the previous sample.
	 */
	intervalLengthFromPrevious: Distance;
}

/** Describe a request to resolve a physical ray into an atmosphere path. */
type AtmospherePathRequest = {
	/** Store the model-space ray to resolve. */
	readonly ray: Ray;
	/** Store the optional path start distance. */
	readonly startDistance?: Distance;
	/** Store the optional explicit path end distance. */
	readonly endDistance?: Distance;
	/** Store the optional source-owned path limit. */
	readonly sourcePathLimit?: SourcePathLimit;
	/** Store the optional integration sample count. */
	readonly sampleCount?: number;
}

/**
 * Describe a geometry-owned atmosphere path for optical-depth integration.
 */
type AtmospherePath = {
	/**
	 * Store the start coordinate.
	 */
	start: AtmosphereCoordinate;

	/**
	 * Store the end coordinate.
	 */
	end: AtmosphereCoordinate;

	/**
	 * Store total physical path length.
	 */
	length: Distance;

	/**
	 * Store optional integration samples.
	 */
	samples?: readonly AtmospherePathSample[];

	/**
	 * Store true when the path is blocked by ground before reaching the source.
	 */
	blockedByGround?: boolean;

	/**
	 * Store owner-specific metadata for validation or diagnostics.
	 */
	metadata?: unknown;
}

/**
 * Describe a position in the source-owned frame after geometry resolution.
 */
type SourceRelativePosition = {
	/**
	 * Store the direction from the source toward the sample point.
	 */
	directionFromSource: UnitVector3;

	/**
	 * Store the direction from the sample point toward the source when useful.
	 */
	directionToSource?: UnitVector3;

	/**
	 * Store measured distance from the finite source, or null for directional
	 * sources.
	 */
	distanceFromSource: Distance | null;

	/**
	 * Store radial distance from the source subpoint when the active cache
	 * family needs it.
	 */
	radialDistanceFromSourceSubpoint?: Distance;

	/**
	 * Store resolved physical altitude when the active cache family needs it.
	 */
	altitude?: Distance;

	/**
	 * Store owner-specific metadata for validation or diagnostics.
	 */
	metadata?: unknown;
}

/**
 * Store medium coefficients sampled at one atmosphere coordinate.
 */
type AtmosphereSample = {
	/**
	 * Store total extinction coefficients.
	 */
	extinction: SpectralExtinctionCoefficientPacket;

	/**
	 * Store total scattering coefficients.
	 */
	scattering: SpectralScatteringCoefficientPacket;

	/**
	 * Store Rayleigh scattering coefficients.
	 */
	rayleighScattering: SpectralScatteringCoefficientPacket;

	/**
	 * Store Mie scattering coefficients.
	 */
	mieScattering: SpectralScatteringCoefficientPacket;

	/**
	 * Store Mie extinction coefficients.
	 */
	mieExtinction: SpectralExtinctionCoefficientPacket;

	/**
	 * Store absorption coefficients.
	 */
	absorption: SpectralAbsorptionCoefficientPacket;

	/**
	 * Store normalized density facts used to derive the coefficients.
	 */
	density: unknown;
}

/**
 * Store optical-depth integration output.
 */
type OpticalDepthSample =
	| Readonly<{
		/** Identify a normally integrated atmosphere path. */
		blockedByGround: false;
		/** Store finite spectral optical depth. */
		opticalDepth: SpectralOpticalDepthPacket;
		/** Store the corresponding finite spectral transmittance. */
		transmittance: SpectralTransmittancePacket;
	}>
	| Readonly<{
		/** Identify a path obstructed by the ground boundary. */
		blockedByGround: true;
		/** Ground obstruction has no finite atmosphere-only optical depth. */
		opticalDepth: null;
		/** Store zero spectral transmittance for the obstructed path. */
		transmittance: SpectralTransmittancePacket;
	}>;

/**
 * Store phase-function values for one incoming/outgoing direction pair.
 */
type PhaseSample = {
	/**
	 * Store Rayleigh phase value with inverse-solid-angle units.
	 */
	rayleighPhase: InverseSolidAngle;

	/**
	 * Store Mie phase value with inverse-solid-angle units.
	 */
	miePhase: InverseSolidAngle;
}

/**
 * Describe a configured atmosphere model without exposing private
 * implementation state.
 */
type AtmosphereModelDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	kind: "algorithm32-atmosphere-model";

	/**
	 * Identify the configured atmosphere model instance.
	 */
	id: string;

	/**
	 * Store a stable compatibility fingerprint for cache and shader resources.
	 */
	fingerprint: string;
}

/**
 * Describe one model-space ray.
 */
type Ray = {
	/**
	 * Store the model-space ray origin.
	 */
	origin: Position;

	/**
	 * Store the normalized model-space ray direction.
	 */
	direction: UnitVector3;
}

/**
 * Describe a finite geometry-resolved view ray segment.
 */
type RaySegment = {
	/**
	 * Store the ray integrated by Algorithm32.
	 */
	ray: Ray;

	/**
	 * Store the starting physical distance along the ray.
	 */
	startDistance: Distance;

	/**
	 * Store the ending physical distance along the ray.
	 */
	endDistance: Distance;

	/**
	 * Store optional geometry-owned endpoint or boundary metadata.
	 */
	metadata?: unknown;
}

/**
 * Supply optional geometry-owned facts used to resolve one finite view ray.
 */
type GeometryViewRayRequest = Readonly<{
	/** Override the geometry's configured observer origin. */
	origin?: Position;
	/** Override the geometry's configured view direction. */
	direction?: UnitVector3;
	/** Limit the resolved segment to an earlier physical endpoint. */
	endDistance?: Distance;
	/** Select whether spherical ground clips the ray or is owned by a scene hit. */
	groundBoundaryMode?: "clip" | "scene-hit-owned";
}>;

/**
 * Describe the model-space frame used by the configured geometry.
 */
type GeometryFrameDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	kind: "algorithm32-geometry-frame";

	/**
	 * Store the world up axis in model coordinates.
	 */
	up: readonly [number, number, number];

	/**
	 * Store the units used by model-space coordinates.
	 */
	units: DistanceUnits;
}

/**
 * Describe a configured geometry model without exposing private implementation
 * state.
 */
type GeometryModelDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	kind: string;

	/**
	 * Identify the configured geometry model instance.
	 */
	id?: string;

	/**
	 * Store a stable compatibility fingerprint for cache and shader resources.
	 */
	fingerprint?: string;

	/** Store the optional spherical ground radius. */
	bottomRadius?: Distance;

	/** Store the optional spherical top-of-atmosphere radius. */
	topRadius?: Distance;

	/** Store the optional direction from a sample toward a distant source. */
	directionToSource?: UnitVector3;

	/** Store the optional minimum distant-cache altitude. */
	cacheBoundaryAltitude?: Distance;
}

/**
 * Describe the inputs needed to convert Algorithm32 spectral output to
 * display-facing color data.
 */
type ColorConversionRequest = {
	/**
	 * Store completed spectral radiance aligned to the active spectral basis.
	 */
	radiance: SpectralRadiancePacket;
}

/**
 * Describe HDR linear composition of spectral atmospheric path radiance over
 * the renderer-captured scene RGB.
 */
type SceneDisplayCompositionRequest = {
	/**
	 * Store spectral radiance added along the view path.
	 */
	pathRadiance: SpectralRadiancePacket;

	/**
	 * Store spectral transmittance accumulated inside the atmosphere.
	 */
	transmittance: SpectralTransmittancePacket;

	/**
	 * Store HDR renderer-linear sRGB captured before final display conversion.
	 */
	sceneLinearSrgb: readonly [number, number, number];

	/**
	 * Identify the captured HDR scene color space. Display-encoded input is
	 * deliberately unsupported because it has already lost scene-linear range.
	 */
	sceneColorSpace?: "linear-srgb";

	/**
	 * Bypass scene attenuation for a background/no-endpoint path.
	 */
	applySceneTransmittance?: boolean;
}

/**
 * Describe display-facing color values produced from Algorithm32 spectral
 * output.
 */
type ColorSample = {
	/**
	 * Store display color channels in the descriptor's output color space.
	 */
	channels: readonly number[];

	/**
	 * Store the output color space used by the channel values.
	 */
	colorSpace: string;
}

/**
 * Describe a configured color conversion provider without exposing private
 * implementation state.
 */
type ColorDescriptor = {
	/**
	 * Identify the descriptor kind.
	 */
	kind: "algorithm32-color";

	/**
	 * Identify the configured color conversion instance.
	 */
	id: string;

	/**
	 * Store the output color space produced by this converter.
	 */
	colorSpace: string;

	/** Identify the spectral-to-display conversion. */
	conversionKind: string;

	/** Store the full display-conversion contract. */
	displayConversion: DisplayConversionDescriptor;

	/**
	 * Store a stable compatibility fingerprint for shader resources.
	 */
	fingerprint: string;
}

/**
 * Configure numerical execution behavior for one Algorithm32 facade instance.
 */
type ExecutionConfig = {
	/**
	 * Store default view-path interval count for CPU/reference evaluation.
	 */
	pathIntervalCount?: number;

	/**
	 * Store source transmittance integration count when source paths need it.
	 */
	sourceTransmittanceIntervalCount?: number;

	/**
	 * Select the cumulative cache maximum. Omission resolves to order 4 at the
	 * facade boundary.
	 */
	maximumScatteringOrder?: SupportedCacheScatteringOrder;

	/**
	 * Store optional shader transport optimization facts.
	 */
	pathSampleDistribution?: ShaderPathSampleDistribution | null;
}

/**
 * Store the complete numerical controls used by one Algorithm32 quality
 * profile.
 */
type Algorithm32NumericalControls = {
	/** Store the view-path interval count. */
	readonly pathIntervalCount: number;
	/** Store the source-transmittance interval count. */
	readonly sourceTransmittanceIntervalCount: number;
}

/**
 * Configure shader view-path sample placement.
 */
type ShaderPathSampleDistribution = {
	/**
	 * Identify the sample-distribution policy.
	 */
	kind: "uniform-distance" | "tangent-density-adaptive-v1" | "tangent-density-adaptive-soft-v1";
}

/**
 * Configure one Algorithm32 facade instance.
 */
type Config = {
	/**
	 * Provide the configured light-source model used by Algorithm32 evaluation
	 * and shader setup.
	 */
	lightSource: LightSourceModel;

	/**
	 * Provide the configured atmosphere model used by Algorithm32 evaluation and
	 * shader setup.
	 */
	atmosphere: AtmosphereModel;

	/**
	 * Provide the configured geometry model used by Algorithm32 evaluation and
	 * shader setup.
	 */
	geometry: GeometryModel;

	/**
	 * Provide the configured ground boundary used by cache construction, or
	 * omit it to select the canonical black-ground behavior.
	 */
	groundBoundary?: GroundBoundary | null;

	/**
	 * Provide optional configured display conversion used by shader setup and
	 * CPU/offline display tooling.
	 */
	color?: Color;

	/**
	 * Configure the spectral basis requested by Algorithm32.
	 */
	spectral: SpectralBasis;

	/**
	 * Configure numerical execution behavior.
	 */
	execution?: ExecutionConfig;

	/**
	 * Configure optional runtime shader behavior.
	 */
	shader?: ShaderRuntimeConfig;
}

/**
 * Describe the accepted configuration state of one facade instance.
 */
type ConfigSnapshot = {
	/**
	 * Store the accepted facade configuration.
	 */
	config: Config;

	/**
	 * Store the monotonically increasing configuration version.
	 */
	version: number;

	/**
	 * Store the shared model descriptor snapshot for this configuration.
	 */
	model: SharedModelSnapshot;
}

/** Store a complete but unpublished facade configuration replacement. */
type Algorithm32PreparedConfig = {
	/** Store the facade version against which this state was prepared. */
	readonly baseVersion: number;
	/** Store the version to publish. */
	readonly version: number;
	/** Store the accepted configuration. */
	readonly config: Config;
	/** Store the prepared shared model. */
	readonly model: import("../models/SharedModel.js").SharedModel;
	/** Store the prepared CPU/reference collaborator. */
	readonly reference: import("../implementation/Reference.js").Reference;
	/** Store the prepared runtime shader builder. */
	readonly shaderBuilder: import("../implementation/ShaderBuilder.js").ShaderBuilder;
	/** Store the public snapshot corresponding to this state. */
	readonly snapshot: ConfigSnapshot;
}

/**
 * Configure optional runtime shader behavior.
 */
type ShaderRuntimeConfig = {
	/**
	 * Select the runtime shader mode.
	 */
	mode?: string;

	/**
	 * Store the largest renderer-produced scene-hit distance encoded for the
	 * runtime shader.
	 */
	sceneDepthMax?: Distance;

	/**
	 * Store the renderer scene-to-physical scale.
	 */
	sceneScale?: SceneScale;

	/**
	 * Configure shader cache/resource policy.
	 */
	cachePolicy?: unknown;

	/**
	 * Configure runtime capability failure policy.
	 */
	capabilityPolicy?: unknown;

	/**
	 * Configure render-target, HDR, depth, and color-space policy.
	 */
	renderTargetPolicy?: unknown;
}

/**
 * Configure geometry-owned scene-point projection to the ground receiver.
 */
type GeometryGroundProjectionRequest = {
	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale?: SceneScale;

	/**
	 * Treat points already this close to, or inside, the local surface as
	 * belonging to the nearby receiver point.
	 */
	readonly surfaceTolerance?: SceneDistance;

	/**
	 * Reject ray hits farther than this scene-unit distance from the original
	 * point.
	 */
	readonly maxLocalDistance?: SceneDistance;

	/**
	 * Reject ray hits whose surface normal dot with the local projected surface
	 * normal is lower than this value.
	 */
	readonly localNormalDotMin?: number;
}

/**
 * Configure geometry-owned Three endpoint object creation.
 */
type GeometryThreeEndpointObjectsRequest = {
	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale?: SceneScale;

	/**
	 * Store optional material/profile id for the returned endpoint objects.
	 */
	readonly spectralReferenceId?: string;
	/**
	 * Store optional Three numeric material color.
	 */
	readonly visualMaterialColor?: number;

	/**
	 * Store optional display-space material rgba channels.
	 */
	readonly visualMaterialDisplayRgba?: readonly [number, number, number, number] | readonly [number, number, number];

	/**
	 * Select whether the visual ground uses an unlit or Lambert material.
	 */
	readonly visualMaterialLighting?: "basic" | "lambert";

	/**
	 * Configure optional renderer shadow receiving on geometry-owned visual
	 * endpoint objects.
	 */
	readonly shadow?: GeometryEndpointShadowRequest | null;

	/**
	 * Override flat-ground render extent.
	 */
	readonly groundExtent?: Distance;

	/**
	 * Store visual geometry width/radial segment count.
	 */
	readonly widthSegments?: number;

	/**
	 * Store visual geometry height/depth segment count.
	 */
	readonly heightSegments?: number;

	/**
	 * Select the spherical ground visual receiver mesh. The exact raycast
	 * endpoint remains the ground-hit authority.
	 */
	readonly groundVisualMesh?: SphericalGroundVisualMeshRequest | "sphere" | "local-spherical-patch";

	/**
	 * Store an optional base object name.
	 */
	readonly name?: string;
}

/**
 * Configure geometry-owned visual endpoint shadow receiving.
 */
type GeometryEndpointShadowRequest = {
	/**
	 * Enable geometry-owned ground shadow receiving.
	 */
	readonly enabled?: boolean;

	/**
	 * Store whether the visual endpoint should receive Three shadows.
	 */
	readonly receiveShadow?: boolean;

	/**
	 * Store optional shadow policy metadata.
	 */
	readonly shadowPolicy?: string;
}

/**
 * Configure the optional spherical ground visual receiver mesh.
 */
type SphericalGroundVisualMeshRequest = {
	/**
	 * Select the visual mesh shape.
	 */
	readonly kind?: "sphere" | "local-spherical-patch";

	/**
	 * Override local patch half width in scene units.
	 */
	readonly xExtent?: SceneDistance;

	/**
	 * Override local patch minimum forward/depth coordinate in scene units.
	 */
	readonly zMin?: SceneDistance;

	/**
	 * Override local patch maximum forward/depth coordinate in scene units.
	 */
	readonly zMax?: SceneDistance;

	/**
	 * Lift local patch vertices outward from the spherical surface in scene
	 * units. This is useful for visual-only receiver overlays that should not
	 * z-fight the canonical ground receiver.
	 */
	readonly surfaceLift?: SceneDistance;
}
/**
 * Return geometry-owned Three endpoint objects.
 */
type GeometryThreeEndpointObjects = {
	/**
	 * Store visible objects the app should add to the scene/composer render.
	 */
	readonly visualObjects: readonly unknown[];

	/**
	 * Store exact raycast/input objects for scene-hit ownership.
	 */
	readonly raycastObjects: readonly unknown[];

	/**
	 * Store owner-specific placement, scale, and material metadata.
	 */
	readonly metadata: unknown;
}

/**
 * Configure geometry-owned scene-depth cap resolution.
 */
type GeometrySceneDepthMaxRequest = {
	/**
	 * Provide the active camera when available.
	 */
	readonly camera?: unknown;

	/**
	 * Provide camera position in physical coordinates.
	 */
	readonly cameraPosition?: Position;

	/**
	 * Provide camera position in renderer scene coordinates.
	 */
	readonly cameraScenePosition?: ScenePosition;

	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale?: SceneScale;

	/**
	 * Override geometry-owned endpoint extent when the
	 * geometry uses a finite ground plane.
	 */
	readonly groundExtent?: Distance;

	/**
	 * Store the smallest acceptable cap.
	 */
	readonly minimum?: Distance;

	/** Provide one physical endpoint extent. */
	readonly endpointExtent?: Distance;

	/** Provide one physical endpoint position. */
	readonly endpointPosition?: Position;

	/** Provide physical endpoint positions. */
	readonly endpointPositions?: readonly Position[];

	/** Provide one renderer-scene endpoint extent. */
	readonly endpointSceneExtent?: SceneDistance;

	/** Provide one renderer-scene endpoint position. */
	readonly endpointScenePosition?: ScenePosition;

	/** Provide renderer-scene endpoint positions. */
	readonly endpointScenePositions?: readonly ScenePosition[];
}

/**
 * Configure source-owned neutral scene-light scale resolution.
 */
type LightSourceSceneLightScalesRequest = {
	/**
	 * Provide source-relative facts for local finite-source light scaling.
	 */
	readonly sourceRelativePosition?: SourceRelativePosition;

	/**
	 * Provide the source direction in scene space.
	 */
	readonly directionToSource?: UnitVector3;

	/**
	 * Store local scene up direction at the observer.
	 */
	readonly observerUp?: UnitVector3;

	/**
	 * Store the source-up dot-product value where twilight ambient begins.
	 */
	readonly twilightStartSourceUpDot?: number;

	/**
	 * Store the source-up dot-product value where ambient reaches full daylight.
	 */
	readonly fullAmbientSourceUpDot?: number;
}

/**
 * Describe source-owned neutral scene-light scales.
 */
type LightSourceSceneLightScales = {
	/**
	 * Store the neutral direct source-light scale.
	 */
	readonly directLightScale: Dimensionless;

	/**
	 * Store the neutral ambient/fill scene-light scale.
	 */
	readonly ambientLightScale: Dimensionless;

	/**
	 * Store the preferred aggregate neutral local-light scale.
	 */
	readonly localLightScale: Dimensionless;

	/**
	 * Store the source direction dot local up direction.
	 */
	readonly sourceUpDot?: number;

	/**
	 * Store owner-specific policy metadata.
	 */
	readonly policy?: string;
}

/**
 * Configure source-owned Three endpoint lighting object creation.
 */
type LightSourceThreeLightingRequest = {
	/**
	 * Provide the caller's Three namespace with lighting constructors.
	 */
	readonly THREE: unknown;

	/**
	 * Optionally provide the Three scene to receive created lighting objects.
	 */
	readonly scene?: unknown;

	/**
	 * Provide source-relative facts for local finite-source lighting.
	 */
	readonly sourceRelativePosition?: SourceRelativePosition;

	/**
	 * Provide the finite source scene-space position for local sources.
	 */
	readonly sourcePosition?: ScenePosition;

	/**
	 * Provide the observer scene-space position used for local source direction.
	 */
	readonly observerPosition?: ScenePosition;

	/**
	 * Provide the focus/target scene-space point for distant directional lights.
	 */
	readonly focus?: ScenePosition;

	/**
	 * Provide the source direction in scene space.
	 */
	readonly directionToSource?: UnitVector3;

	/**
	 * Override distant directional light placement distance in scene units.
	 */
	readonly lightDistance?: SceneDistance;

	/**
	 * Override distant source Three light intensity.
	 */
	readonly intensity?: number;

	/**
	 * Store local source endpoint light calibration scalar.
	 */
	readonly calibrationScalar?: number;

	/**
	 * Store ambient fill intensity.
	 */
	readonly ambientIntensity?: number;

	/**
	 * Store source-scaled ambient fill intensity bounds.
	 */
	readonly ambientIntensityRange?: LightSourceSceneAmbientIntensityRange;

	/**
	 * Configure optional endpoint indirect fill for local sources.
	 */
	readonly endpointIndirectFill?: LightSourceThreeEndpointIndirectFillRequest;

	/**
	 * Store diagnostic endpoint color/shading status.
	 */
	readonly endpointColorStatus?: string;

	/**
	 * Select how local endpoint scene lights are scaled.
	 */
	readonly endpointSceneLightScalePolicy?: "endpoint-material-shading" | "observer-incident-scale";

	/**
	 * Configure optional Three shadow-map support.
	 */
	readonly shadow?: LightSourceThreeShadowRequest;
}

/**
 * Return source-owned Three lighting objects.
 */
type LightSourceThreeLightingObjects = {
	/**
	 * Store Three lights the app should add to the scene/composer render.
	 */
	readonly lights: readonly unknown[];

	/**
	 * Store required non-light scene objects such as directional-light targets.
	 */
	readonly sceneObjects?: readonly unknown[];

	/**
	 * Store owner-specific placement, intensity, shadow, and scale metadata.
	 */
	readonly metadata: unknown;
}

/**
 * Configure source-scaled ambient intensity bounds.
 */
type LightSourceSceneAmbientIntensityRange = {
	/**
	 * Store the minimum ambient intensity.
	 */
	readonly min?: number;

	/**
	 * Store the maximum ambient intensity.
	 */
	readonly max?: number;
}

/**
 * Configure optional source-owned Three shadow helpers.
 */
type LightSourceThreeShadowRequest = {
	/**
	 * Enable or disable shadow object creation/configuration.
	 */
	readonly enabled: boolean;

	/**
	 * Store keyed shadow objects. Each object request creates one
	 * source-owned directional shadow light focused on that object.
	 */
	readonly objects: readonly LightSourceThreeShadowObjectRequest[];
}

/**
 * Configure one source-owned Three shadow object.
 */
type LightSourceThreeShadowObjectRequest = {
	/**
	 * Store optional object key metadata.
	 */
	readonly objectKey?: string;

	/**
	 * Store optional Three layer index used to scope a source-owned shadow
	 * camera to matching casters.
	 */
	readonly layerIndex?: number;

	/**
	 * Store the shadow focus/target scene-space point.
	 */
	readonly focus?: ScenePosition;

	/**
	 * Store orthographic shadow extent in scene units.
	 */
	readonly extent?: SceneDistance;

	/**
	 * Store optional asymmetric orthographic shadow camera bounds.
	 */
	readonly cameraLeft?: SceneDistance;
	/** Store the camera right extent. */
	readonly cameraRight?: SceneDistance;
	/** Store the camera top extent. */
	readonly cameraTop?: SceneDistance;
	/** Store the camera bottom extent. */
	readonly cameraBottom?: SceneDistance;

	/**
	 * Store light placement distance in scene units.
	 */
	readonly lightDistance?: SceneDistance;

	/**
	 * Store shadow camera near plane in scene units.
	 */
	readonly cameraNear?: SceneDistance;

	/**
	 * Store shadow camera far plane in scene units.
	 */
	readonly cameraFar?: SceneDistance;

	/**
	 * Store shadow-map width and height in pixels.
	 */
	readonly mapSize?: PixelSize;

	/**
	 * Store shadow bias.
	 */
	readonly bias?: number;

	/**
	 * Store normal shadow bias in scene units.
	 */
	readonly normalBias?: SceneDistance;

	/**
	 * Store Three shadow PCF radius in pixels.
	 */
	readonly radius?: PixelDistance;

	/**
	 * Store Three shadow opacity for source-owned shadow maps.
	 */
	readonly shadowIntensity?: number;
}

/**
 * Configure optional local endpoint indirect fill lighting.
 */
type LightSourceThreeEndpointIndirectFillRequest = {
	/**
	 * Enable or disable indirect fill lighting.
	 */
	readonly enabled: boolean;

	/**
	 * Select the fill approximation policy.
	 */
	readonly policy?: "general-ambient-fill" | "opposite-directional-fill" | "source-direction-falloff-fill";

	/**
	 * Store fill intensity relative to the source-driven endpoint light.
	 */
	readonly intensityRatio?: number;

	/**
	 * Store fill placement distance in scene units.
	 */
	readonly distance?: SceneDistance;
}

/**
 * Provide caller-owned Three/runtime handles for shader setup.
 */
type ShaderSetupRequest = {
	/**
	 * Provide the caller's existing postprocess composer.
	 */
	composer: unknown;

	/**
	 * Provide the scene rendered before the Algorithm32 atmosphere pass.
	 */
	scene: unknown;

	/**
	 * Provide the camera used to render the scene and derive atmosphere rays.
	 */
	camera: unknown;

	/**
	 * Provide the optional Three namespace when the integration needs caller
	 * constructors.
	 */
	THREE?: unknown;

	/**
	 * Provide the composer-owned opaque GPU cache backend used by every cache
	 * controller attached to this composer.
	 */
	cacheBackend: CacheGpuBackend;

	/** Optionally yield cache construction at executor-defined boundaries. */
	cacheBuildScheduler?: CacheBuildScheduler;

	/** Cancel an in-progress source-owned cache construction. */
	signal?: AbortSignal;

	/**
	 * Provide initial viewport dimensions for setup-created runtime resources.
	 * The composer may later resize the installed pass.
	 */
	viewportSize: PixelSize;

	/**
	 * Provide the largest renderer-produced scene-hit distance encoded for the
	 * runtime shader.
	 */
	sceneDepthMax?: Distance;

	/**
	 * Provide the renderer scene-to-physical scale.
	 */
	sceneScale?: SceneScale;

	/**
	 * Provide an optional runtime logger for non-fatal frame failures.
	 */
	logger?: Console;

	/**
	 * Provide an optional shader-pass performance callback. When omitted, the
	 * runtime does not create pass timers or GPU timer queries.
	 */
	performanceCallback?: (sample: ShaderPerformanceSample) => void;

	/**
	 * Provide the pass invocation cadence for performance timer samples.
	 * Defaults to every frame when omitted.
	 */
	performanceSampleIntervalFrames?: number;

	/**
	 * Limit unresolved GPU timer queries per timed pass. Defaults to one.
	 */
	performanceMaxPendingQueries?: number;

	/**
	 * Provide optional initial runtime binding values by shader value key.
	 */
	bindingValues?: Record<string, unknown>;
}

/**
 * Describe one optional shader-pass performance sample.
 */
type ShaderPerformanceSample = {
	/**
	 * Store the pass that produced the sample.
	 */
	passName: string;

	/**
	 * Store the event phase for the sample.
	 */
	event: "cpu-submit" | "gpu-elapsed" | "gpu-query-error";

	/**
	 * Store the correlated sample id shared by CPU and GPU events.
	 */
	sampleId: number;

	/**
	 * Store callback emission time.
	 */
	timestamp: Duration;

	/**
	 * Store CPU submit duration when available.
	 */
	cpuSubmitDuration?: Duration;

	/**
	 * Store GPU elapsed duration when available.
	 */
	gpuDuration?: Duration | null;

	/**
	 * Store whether GPU timer query support was available.
	 */
	gpuAvailable?: boolean;

	/**
	 * Store whether the GPU disjoint flag invalidated the sample.
	 */
	disjoint?: boolean;

	/**
	 * Store optional failure detail for timer-query setup/readback.
	 */
	errorMessage?: string;

	/**
	 * Allow pass-specific metadata.
	 */
	[key: string]: unknown;
}

/**
 * Control an installed Algorithm32 runtime shader integration.
 */
interface ShaderHandle {
	/**
	 * Prepare the installed runtime program for its first render.
	 *
	 * @param renderer - Supplies the runtime renderer.
	 */
	prepare(renderer: unknown): Promise<void>;

	/**
	 * Replace the facade/runtime shader configuration and refresh resources
	 * required by the installed pass.
	 *
	 * @param config - Supplies the replacement Algorithm32 configuration.
	 * @returns The accepted configuration snapshot.
	 */
	setConfig(config: Config): Promise<ConfigSnapshot>;

	/**
	 * Return deferred shader diagnostics placeholder data.
	 *
	 * @returns Deferred diagnostics placeholder data.
	 */
	getDiagnostics(): unknown;

	/**
	 * Dispose resources owned by the installed runtime shader integration.
	 *
	 * @returns No return value.
	 */
	dispose(): void;
}

/**
 * Supply the owner and runtime state required by an Algorithm32 shader handle.
 */
type Algorithm32ShaderHandleState = {
	/** Store the facade that owns the handle. */
	readonly facade: import("../Algorithm32.js").Algorithm32;

	/** Store the original shader setup request used for rebuilds. */
	readonly setup: ShaderSetupRequest;

	/** Store the currently installed shader build result. */
	readonly buildResult: ShaderBuildResult;
};

/**
 * Describe one CPU/reference evaluation request.
 */
type EvaluationRequest = {
	/**
	 * Store an optional geometry-owned view-ray request packet.
	 */
	viewRay?: GeometryViewRayRequest;

	/**
	 * Override default path interval count for this evaluation.
	 */
	pathIntervalCount?: number;

	/** Override the configured cumulative CPU scattering cache. */
	scatteringCache?: CpuScatteringCache;

}

/**
 * Describe one CPU/reference evaluation result.
 */
type EvaluationResult = {
	/**
	 * Store spectral path radiance aligned to the configured spectral basis.
	 */
	pathRadiance: SpectralRadiancePacket;

	/**
	 * Store spectral transmittance aligned to the configured spectral basis.
	 */
	transmittance: SpectralTransmittancePacket;

	/**
	 * Store the geometry-resolved ray segment used for validation.
	 */
	viewRaySegment?: RaySegment;

	/**
	 * Store path integration points used for validation.
	 */
	pathIntegrationPoints?: readonly PathIntegrationPoint[];
}
