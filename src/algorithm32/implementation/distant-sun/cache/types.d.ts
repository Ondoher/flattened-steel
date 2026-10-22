/** Configured facade surface retained by the distant-Sun cache provider. */
type DistantSunCacheProviderSource = DistantSunCacheSource & DistantSunPrimaryScatteringLightSource;

/** Selected bounded decoder implementation.
 * - **"native"** - Feature-detected browser Zstandard stream.
 * - **"wasm"** - Pinned decoder-only WebAssembly fallback.
 */
type DistantSunSharedCacheDecoderKind = 'native' | 'wasm';
/** Feature-detected native stream constructor, including optional browser Zstandard support. */
type DistantSunSharedCacheNativeStreamConstructor = new (format: string) => TransformStream<Uint8Array, Uint8Array>;
/** Transferred block preparation input. */
type DistantSunSharedCachePreparationRequest = {
	/** Authenticated configuration-owned block descriptor. */
	block: DistantSunSharedCacheBlockDescriptor;
	/** Exclusively owned complete encoded frame. */
	encoded: ArrayBuffer;
	/** Exact W27 map copied for transfer. */
	logicalToUniqueIndex: Uint16Array;
	/** Authenticated exact direction-map identity. */
	logicalToUniqueIndexSha256: string;
};
/** Bounded stage measurements for one prepared packet. */
type DistantSunSharedCachePreparationTimings = {
	/** Encoded and direction-map authentication duration. */
	authenticationMilliseconds: number;
	/** Decoder duration, including first initialization. */
	decodeMilliseconds: number;
	/** Inverse shuffle, decoded authentication, and spectral validation duration. */
	inverseAndValidationMilliseconds: number;
	/** Exact packet construction duration. */
	packetMilliseconds: number;
	/** Actual decoder implementation. */
	decoder: DistantSunSharedCacheDecoderKind;
};
/** Complete authenticated packet and its preparation timings. */
type DistantSunSharedCachePreparationResult = {
	/** Exclusively transferred packet storage. */
	packet: DistantSunSharedCachePacketBlock;
	/** Bounded stage measurements. */
	timings: DistantSunSharedCachePreparationTimings;
};
/** Worker protocol operation.
 * - **"prepare"** - Transfer and authenticate one block.
 * - **"cancel"** - Cancel the active matching block.
 */
type DistantSunSharedCacheWorkerOperation = 'prepare' | 'cancel';
/** Main-thread to Worker protocol. */
type DistantSunSharedCacheWorkerMessage = {
	/** Monotonically increasing job identity. */
	requestId: number;
	/** Protocol operation. */
	kind: DistantSunSharedCacheWorkerOperation;
	/** Transferred preparation values, present for prepare. */
	request?: DistantSunSharedCachePreparationRequest;
};
/** Worker terminal response. */
type DistantSunSharedCacheWorkerResponse = {
	/** Original job identity. */
	requestId: number;
	/** Authenticated result on success. */
	result?: DistantSunSharedCachePreparationResult;
	/** Safe failure diagnostic on rejection. */
	error?: string;
};
/** Persistent asynchronous preparation capability. */
interface DistantSunSharedCachePreparationClient {
	/**
	 * Call this method to transfer one preparation request; failure or cancellation rejects.
	 * @param request - Exclusively owned input buffers.
	 * @param signal - Subscriber-accounted cancellation.
	 * @returns - Authenticated packet and timings.
	 */
	prepare(
		request: DistantSunSharedCachePreparationRequest,
		signal: AbortSignal,
	): Promise<DistantSunSharedCachePreparationResult>;
	/** Call this method to reject pending work and release all Worker resources. */
	dispose(): void;
}
/** Worker-client construction options. */
type DistantSunSharedCacheWorkerClientDefinition = {
	/** Built same-origin module Worker URL. */
	workerUrl: string;
	/** Worker construction capability. */
	createWorker?: (url: string) => Worker;
};
/** Queued Worker job with one terminal subscriber continuation. */
type DistantSunSharedCacheWorkerJob = {
	/** Monotonically increasing job identity. */
	requestId: number;
	/** Transferred input, released after dispatch. */
	request?: DistantSunSharedCachePreparationRequest;
	/** Cancellation source. */
	signal: AbortSignal;
	/** Matching abort listener. */
	cancel: () => void;
	/** Success continuation. */
	resolve: (value: DistantSunSharedCachePreparationResult) => void;
	/** Failure continuation. */
	reject: (reason: unknown) => void;
};
/** Explicit packet retention owner category.
 * - **"published"** - Active GPU window lifetime.
 * - **"candidate"** - Unpublished transaction lifetime.
 * - **"predicted"** - Predicted future window lifetime.
 * - **"prepared-route"** - Explicitly budgeted route lifetime.
 */
type DistantSunSharedCachePinKind = 'published' | 'candidate' | 'predicted' | 'prepared-route';
/** Pin owner and optional route-specific admission ceiling. */
type DistantSunSharedCachePin = {
	/** Resource lifetime category. */
	kind: DistantSunSharedCachePinKind;
	/** Stable transaction, window, or route owner. */
	owner: string;
	/** Required prepared-route host ceiling, including pending packets. */
	maximumBytes?: number;
};
/** Retained or reserved packet with explicit pin ownership. */
type DistantSunSharedCacheRetentionEntry = {
	/** Decoded and direction-layout compatibility identity. */
	signature: string;
	/** Authenticated packet, absent while preparation is pending. */
	packet?: DistantSunSharedCachePacketBlock;
	/** Independently releasable pin tokens. */
	pins: Map<symbol, DistantSunSharedCachePin>;
	/** Monotonic least-recently-used sequence. */
	lastUse: number;
};
/** Packet lease whose arrays remain owned by the transport cache. */
type DistantSunSharedCachePacketLease = {
	/** Borrowed immutable packet; consumers must neither modify nor transfer its buffer. */
	packet: DistantSunSharedCachePacketBlock;
	/** Call this method to change the explicit pin owner or category. */
	repin: (pin: DistantSunSharedCachePin) => void;
	/** Call this method to release this lease exactly once; repeated calls are harmless. */
	release: () => void;
};
/** Complete browser block subscription. */
type DistantSunSharedCacheBlockRequest = {
	/** Contained content-addressed complete artifact URL. */
	url: string;
	/** Authenticated block descriptor. */
	block: DistantSunSharedCacheBlockDescriptor;
	/** Authenticated canonical W27 direction map. */
	logicalToUniqueIndex: Uint16Array;
	/** Exact direction-map identity. */
	logicalToUniqueIndexSha256: string;
	/** Explicit packet lifetime owner. */
	pin: DistantSunSharedCachePin;
	/** Independent subscriber cancellation. */
	signal: AbortSignal;
};
/** Transport dependencies and memory admission policy. */
type DistantSunSharedCacheTransportDefinition = {
	/** Persistent preparation capability. */
	preparer: DistantSunSharedCachePreparationClient;
	/** Complete artifact fetch capability. */
	fetch?: typeof fetch;
	/** Total pinned packet admission ceiling. */
	maximumPinnedBytes?: number;
};

/** Bounded retention resource totals. */
type DistantSunSharedCacheRetentionDiagnostics = {
	/** Bytes reserved by live pins, including pending preparation. */
	pinnedBytes: number;
	/** Unpinned retained packet bytes. */
	unpinnedBytes: number;
	/** Reserved packet bytes still awaiting preparation. */
	pendingBytes: number;
	/** Number of independently releasable pins per lifetime category. */
	pins: Record<DistantSunSharedCachePinKind, number>;
	/** Total evictions since construction. */
	evictions: number;
	/** Configured admission ceiling. */
	maximumPinnedBytes: number;
};

/** Bounded transport counters and current resource facts. */
type DistantSunSharedCacheTransportDiagnostics = {
	/** Total admitted subscriber requests. */
	requests: number;
	/** Subscribers joined to existing preparations. */
	coalesced: number;
	/** Requests served from retained packets. */
	reused: number;
	/** Successfully completed artifact preparations. */
	completed: number;
	/** Canceled subscribers. */
	canceled: number;
	/** Failed artifact preparations excluding cancellation. */
	failed: number;
	/** Maximum simultaneous complete artifact jobs. */
	peakActive: number;
	/** Most recent job queue delay. */
	lastQueueMilliseconds: number;
	/** Most recent complete network read duration. */
	lastFetchMilliseconds: number;
	/** Active complete artifact jobs. */
	active: number;
	/** Queued complete artifact jobs. */
	queued: number;
	/** Coalesced artifact map entries. */
	inflight: number;
	/** Most recently completed Worker stages. */
	lastPreparation?: DistantSunSharedCachePreparationTimings;
	/** Current pin and LRU facts. */
	retention: DistantSunSharedCacheRetentionDiagnostics;
};
/** Subscriber continuation for one coalesced artifact preparation. */
type DistantSunSharedCacheTransportSubscriber = {
	/** Independent subscriber cancellation. */
	signal: AbortSignal;
	/** Original logical block identity, which may alias identical encoded bytes. */
	logicalBlockId: string;
	/** Reserved pin token. */
	token: symbol;
	/** Matching cancellation listener. */
	cancel: () => void;
	/** Success continuation. */
	resolve: (lease: DistantSunSharedCachePacketLease) => void;
	/** Failure continuation. */
	reject: (reason: unknown) => void;
};
/** One complete network-to-packet job shared by active subscribers. */
type DistantSunSharedCacheTransportJob = {
	/** Encoded artifact identity. */
	key: string;
	/** Snapshot of the first compatible request. */
	request: DistantSunSharedCacheBlockRequest;
	/** Underlying cancellation after the final subscriber leaves. */
	cancellation: AbortController;
	/** Independently cancelable subscribers. */
	subscribers: Set<DistantSunSharedCacheTransportSubscriber>;
	/** Queue admission timestamp. */
	queuedAt: number;
};

/** Definition of source-owned executable packing for one distant-Sun CPU field. */
type DistantSunFieldPackingDefinition = Readonly<{
	/** Unique identifier for the field packing. */
	id: string;
	/** Number of executable directions. */
	directionCount: number;
	/** Number of executable positions. */
	positionCount: number;
	/** Number of executable wavelengths. */
	wavelengthCount: number;
}>;

/** Source-owned executable packing for one distant-Sun CPU field. */
interface DistantSunFieldPacking extends DirectionalSpectralFieldPacking {
	/** Distant-Sun field-packing contract kind. */
	readonly kind: 'distant-sun-field-packing';
	/** Unique identifier for the field packing. */
	readonly id: string;
	/** Executable direction extent. */
	readonly directionCount: number;
	/** Executable position extent. */
	readonly positionCount: number;
	/** Executable wavelength extent. */
	readonly wavelengthCount: number;
	/**
	 * Call this method to resolve field coordinates for a flat storage offset.
	 *
	 * @param offset - The flat field offset.
	 * @returns - The resolved field coordinates.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Definition of one coherent executable distant-Sun construction-domain selection. */
type DistantSunConstructionDomainSelectionDefinition = Readonly<{
	/** Unique identifier for the exact position, direction, and packing selection. */
	readonly id: string;
	/** Owner of the executable spherical-native position facts. */
	readonly positionDomainOwner: SphericalNativePositionDomain;
	/** Owner of the executable incoming-radiance direction facts. */
	readonly incomingDirectionDomainOwner: Fibonacci34DirectionDomain;
	/** Owner of the executable cubed-sphere outgoing-direction facts. */
	readonly outgoingDirectionDomainOwner: CubedSphereDirectionDomain;
	/** Exact spectral basis that determines the field channel count. */
	readonly spectralBasis: SpectralBasis;
	/** Identifier for the incoming-radiance field packing. */
	readonly radiancePackingId: string;
	/** Identifier for the outgoing-scattering field packing. */
	readonly scatteringDensityPackingId: string;
}>;

/** Executable production lattice for distant-Sun construction. */
interface DistantSunConstructionDomainSelection extends CacheConstructionDomains {
	/** Distant-Sun construction-domain-selection contract kind. */
	readonly kind: 'distant-sun-construction-domain-selection';
	/** Unique identifier for the exact position, direction, and packing selection. */
	readonly id: string;
	/** Selected executable physical position domain. */
	readonly positionDomain: SphericalNativePositionDomain;
	/** Selected executable position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Selected position extent. */
	readonly positionCount: number;
	/** Executable ground radius. */
	readonly bottomRadius: Distance;
	/** Executable atmosphere-top radius. */
	readonly topRadius: Distance;
	/** Executable incoming-radiance direction domain. */
	readonly incomingDirectionDomain: Fibonacci34DirectionDomain;
	/** Executable incoming-radiance unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Solid-angle integration weight for each incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Incoming-radiance direction extent. */
	readonly incomingDirectionCount: number;
	/** Executable outgoing-scattering direction domain. */
	readonly outgoingDirectionDomain: CubedSphereDirectionDomain;
	/** Executable outgoing-scattering unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Outgoing-scattering direction extent. */
	readonly outgoingDirectionCount: number;
	/** Selected positive-axis face-center indices. */
	readonly outgoingPositiveFaceCenterIndices: Readonly<{
		/** Positive-X face-center index. */
		readonly positiveX: number;
		/** Positive-Y face-center index. */
		readonly positiveY: number;
		/** Positive-Z face-center index. */
		readonly positiveZ: number;
	}>;
	/** Executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Executable spectral channel extent. */
	readonly spectralChannelCount: number;
	/** Executable incoming-radiance field packing. */
	readonly radiancePacking: DistantSunFieldPacking;
	/** Executable outgoing-scattering field packing. */
	readonly scatteringDensityPacking: DistantSunFieldPacking;
	/**
	 * Call this method to resolve one source-local outgoing direction into
	 * selected construction taps.
	 *
	 * @param direction - The source-local outgoing direction.
	 * @returns - The selected construction-direction stencil.
	 */
	resolveOutgoingDirectionStencil(direction: UnitVector3): ScatteringCacheDirectionStencil;
}

/** Definition of one pure distant-Sun CPU field. */
type DistantSunCpuPureFieldDefinition = Readonly<{
	/** Unique identifier for the field. */
	id: string;
	/** Pure field order. */
	order: number;
	/** Optional field provenance identity. */
	provenanceIdentity?: string;
	/** Optional executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
}>;

/** Operation that allocates one mutable pure distant-Sun CPU field. */
type DistantSunCpuPureFieldAllocator =
	/**
	 * Called by distant-Sun CPU evaluators to allocate one pure field.
	 * @param definition - The pure-field definition.
	 * @returns - The allocated mutable field contract.
	 */ (definition: DistantSunCpuPureFieldDefinition) => CpuDirectionalSpectralFieldContract;

/** Field-allocation operations supplied to the distant-Sun primary evaluator. */
type DistantSunCpuPrimaryFieldAllocators = Readonly<{
	/**
	 * Value used by the primary evaluator to allocate a pure-radiance field through the owning provider.
	 *
	 * @param definition - The pure-radiance field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureRadianceField: DistantSunCpuPureFieldAllocator;
	/**
	 * Value used by the primary evaluator to allocate a pure-scattering-density field through the owning provider.
	 *
	 * @param definition - The pure-scattering-density field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureScatteringDensityField: DistantSunCpuPureFieldAllocator;
}>;

/** Field-allocation operations supplied to the distant-Sun multiple-scattering evaluator. */
type DistantSunCpuMultipleScatteringFieldAllocators = Readonly<{
	/**
	 * Value used by the multiple-scattering evaluator to allocate a pure-radiance field through the owning provider.
	 *
	 * @param definition - The pure-radiance field definition.
	 * @returns - The allocated mutable field contract.
	 *
	 */
	createPureRadianceField: DistantSunCpuPureFieldAllocator;
}>;

/**
 * Atmosphere method names required by distant-Sun primary scattering.
 *
 * - **"sampleMedium"** - Medium-property sampling at one atmosphere coordinate.
 * - **"integrateOpticalDepth"** - Optical-depth integration along one bounded path.
 * - **"samplePhase"** - Phase-function sampling for one scattering angle.
 */
type DistantSunPrimaryScatteringAtmosphereMethod = 'sampleMedium' | 'integrateOpticalDepth' | 'samplePhase';

/** Atmosphere surface required for distant-Sun primary scattering density. */
type DistantSunPrimaryScatteringAtmosphere = Pick<AtmosphereModel, DistantSunPrimaryScatteringAtmosphereMethod> &
	Readonly<{
		/** Atmosphere spectral basis aligned with its spectral outputs. */
		readonly spectralBasis: SpectralBasis;
	}>;

/**
 * Geometry method names required by distant-Sun primary scattering.
 *
 * - **"resolveAtmosphereCoordinate"** - Atmosphere-coordinate resolution for one physical position.
 * - **"resolveAtmospherePath"** - Bounded atmosphere-path resolution for one ray.
 */
type DistantSunPrimaryScatteringGeometryMethod = 'resolveAtmosphereCoordinate' | 'resolveAtmospherePath';

/** Geometry surface required for primary scattering over the selected position domain. */
type DistantSunPrimaryScatteringGeometry = Pick<GeometryModel, DistantSunPrimaryScatteringGeometryMethod> &
	Readonly<{
		/**
		 * Call this method to resolve one native altitude and source direction into
		 * a physical ray.
		 *
		 * @param coordinate - The native cache-build coordinate.
		 * @returns - The bounded physical ray, or null when none exists.
		 */
		resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;
	}>;

/**
 * Direct-lighting method names shared by distant-Sun scattering paths.
 *
 * - **"sampleDirectLighting"** - Direct source-lighting sampling at one physical position.
 * - **"resolveSourcePathLimit"** - Source-owned transmittance-path limit resolution.
 */
type DistantSunDirectLightingMethod = 'sampleDirectLighting' | 'resolveSourcePathLimit';

/** Distant atmospheric source surface required for primary scattering density. */
type DistantSunPrimaryScatteringLightSource = Pick<LightSourceModel, DistantSunDirectLightingMethod>;

/** Request for one synchronous distant-Sun pure-J1 CPU construction. */
type DistantSunPrimaryScatteringDensityBuildRequest = Readonly<{
	/** Aggregate execution model that owns profile and physical collaborators. */
	model: SharedModel;
	/** Wavelength-aligned physical atmosphere. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Spherical geometry that reconstructs native altitude nodes. */
	geometry: DistantSunPrimaryScatteringGeometry;
	/** Distant-source direction and path policy. */
	lightSource: DistantSunPrimaryScatteringLightSource;
	/** Aggregate profile retained by the execution model. */
	profile?: Algorithm32ExecutionProfile;
	/** Optional pure-J1 field identity override. */
	id?: string;
	/** Optional field provenance identity override. */
	provenanceIdentity?: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Spherical geometry required by the source-owned direct-L1 build. */
type DistantSunPrimaryRadianceGeometry = DistantSunPrimaryScatteringGeometry &
	Pick<GeometryModel, 'resolveSourceRelativePosition'> &
	Readonly<{
		/**
		 * Call this method to express one executable Fibonacci radiance direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
	}>;

/** Canonical calculator surface shared by direct L1 and later-order recurrence. */
type DistantSunPrimaryRadianceCalculator = Pick<SpectralCalculator, PrimaryRadianceCalculatorMethod>;

/** Request for one synchronous distant-Sun pure-L1 CPU construction. */
type DistantSunPrimaryRadianceBuildRequest = Omit<DistantSunPrimaryScatteringDensityBuildRequest, 'geometry'> &
	Readonly<{
		/** Spherical geometry and its source-relative direction mapping. */
		geometry: DistantSunPrimaryRadianceGeometry;
		/** Source-created canonical spectral calculator. */
		calculator: DistantSunPrimaryRadianceCalculator;
		/** Accepted executable path-integration interval count. */
		transportIntervalCount: number;
	}>;

/**
 * Properties excluded from a distant-Sun CPU spectral-calculator request.
 *
 * - **"calculator"** - Calculator reconstructed from the retained physical collaborators.
 * - **"id"** - Field identity owned by the subsequent build operation.
 * - **"provenanceIdentity"** - Numerical provenance identity owned by the subsequent build operation.
 */
type DistantSunCpuSpectralCalculatorRequestExcludedProperty = 'calculator' | 'id' | 'provenanceIdentity';

/** Aggregate-model input for the one source-owned calculator. */
type DistantSunCpuSpectralCalculatorRequest = Readonly<{
	/** Aggregate execution model that owns profile and physical collaborators. */
	model: SharedModel;
}>;

/** Primary-scattering request accepted by the configured evaluator. */
type DistantSunCpuPrimaryScatteringEvaluationRequest = Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	'lightSource'
>;

/** Primary-radiance request accepted by the configured evaluator. */
type DistantSunCpuPrimaryRadianceEvaluationRequest = Omit<DistantSunPrimaryRadianceBuildRequest, 'lightSource'>;

/** Spectral-calculator request accepted by the configured evaluator. */
type DistantSunCpuSpectralCalculatorEvaluationRequest = DistantSunCpuSpectralCalculatorRequest;

/** Spherical distant-Sun geometry used by later-order scattering. */
type DistantSunLaterOrderScatteringGeometry = LaterOrderScatteringGeometry &
	Readonly<{
		/**
		 * Call this method to reconstruct one executable native position through
		 * geometry-owned facts.
		 *
		 * @param positionNode - The executable native-position node.
		 * @returns - The reconstructed physical position.
		 */
		resolveScatteringCacheConstructionPosition(positionNode: PositionDomainNode): Position;
		/**
		 * Call this method to express one executable Fibonacci incoming direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
		/**
		 * Call this method to express one executable W27 outgoing direction in
		 * physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space outgoing-scattering direction.
		 */
		expressPhysicalOutgoingScatteringDirection(cacheDirection: UnitVector3): UnitVector3;
	}>;

/**
 * Geometry method names required only by distant-Sun ground reflection.
 *
 * - **"resolveAtmospherePath"** - Atmosphere-path resolution between construction endpoints.
 * - **"resolveGroundIntersection"** - Ground-hit resolution for one physical ray.
 * - **"resolveScatteringCacheConstructionPositionStencil"** - Construction-position stencil resolution at a ground hit.
 */
type DistantSunGroundReflectionGeometryMethod =
	'resolveAtmospherePath' | 'resolveGroundIntersection' | 'resolveScatteringCacheConstructionPositionStencil';

/** Geometry operations required only by reflective-ground scattering. */
type DistantSunGroundReflectionGeometry = DistantSunLaterOrderScatteringGeometry &
	Pick<GeometryModel, DistantSunGroundReflectionGeometryMethod>;

/** Atmosphere transport required only by reflective-ground scattering. */
type DistantSunGroundReflectionAtmosphere = LaterOrderScatteringAtmosphere &
	Pick<AtmosphereModel, 'integrateOpticalDepth'>;

/** Direct-source operations used by the J2 ground term. */
type DistantSunGroundReflectionLightSource = Pick<LightSourceModel, DistantSunDirectLightingMethod>;

/** Physical collaborators shared by every ground mode. */
type DistantSunLaterOrderScatteringKernelConfigurationBase = Readonly<{
	/** Executable domains selected by the retained profile. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Spherical native-domain geometry. */
	geometry: DistantSunLaterOrderScatteringGeometry;
	/** Atmosphere-owned medium and phase sampling. */
	atmosphere: LaterOrderScatteringAtmosphere;
	/** Phase-weighted spectral coefficient calculation. */
	calculator: LaterOrderScatteringCalculator;
	/** Executable physical direction from a sample toward the source. */
	directionToLight: UnitVector3;
	/** Pure L(k-2) field when the requested order can illuminate ground. */
	groundIlluminationRadiance?: CpuDirectionalSpectralFieldContract | null;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Exact omitted-boundary configuration. */
type DistantSunBlackGroundScatteringKernelConfiguration = DistantSunLaterOrderScatteringKernelConfigurationBase &
	Readonly<{
		/** Null reflective boundary that preserves the canonical black path. */
		groundBoundary?: null;
	}>;

/**
 * Base properties replaced by reflective-ground scattering collaborators.
 *
 * - **"geometry"** - Geometry strengthened with ground-reflection operations.
 * - **"atmosphere"** - Atmosphere strengthened with optical-depth integration.
 */
type DistantSunReflectiveGroundScatteringKernelConfigurationExcludedProperty = 'geometry' | 'atmosphere';

/** Source-owned reflective-ground transport configuration. */
type DistantSunReflectiveGroundScatteringKernelConfiguration = Omit<
	DistantSunLaterOrderScatteringKernelConfigurationBase,
	DistantSunReflectiveGroundScatteringKernelConfigurationExcludedProperty
> &
	Readonly<{
		/** Geometry-owned ground hits and atmosphere paths. */
		geometry: DistantSunGroundReflectionGeometry;
		/** Atmosphere-owned optical-depth integration. */
		atmosphere: DistantSunGroundReflectionAtmosphere;
		/** Configured BRDF owner. */
		groundBoundary: GroundBoundary;
		/** Distant source for direct J2 illumination. */
		lightSource: DistantSunGroundReflectionLightSource;
		/** Selected source/hit transport interval count. */
		sourceTransmittanceIntervalCount: number;
	}>;

/** Distant-Sun later-order kernel configuration independent of its order. */
type DistantSunLaterOrderScatteringKernelConfiguration =
	DistantSunBlackGroundScatteringKernelConfiguration | DistantSunReflectiveGroundScatteringKernelConfiguration;

/** Omitted-boundary distant-Sun later-order kernel request. */
type DistantSunBlackGroundScatteringKernelRequest = DistantSunBlackGroundScatteringKernelConfiguration &
	Readonly<{
		/** Pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4 | 5;
	}>;

/** Reflective-ground distant-Sun later-order kernel request. */
type DistantSunReflectiveGroundScatteringKernelRequest = DistantSunReflectiveGroundScatteringKernelConfiguration &
	Readonly<{
		/** Pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4 | 5;
	}>;

/** Omitted-boundary kernel request accepted by the configured evaluator. */
type DistantSunCpuBlackGroundKernelEvaluationRequest = Omit<
	DistantSunBlackGroundScatteringKernelRequest,
	'directionToLight'
>;

/**
 * Provider-captured properties excluded from reflective-ground evaluator requests.
 *
 * - **"directionToLight"** - Configured source direction captured by the evaluator.
 * - **"lightSource"** - Configured source facade captured by the evaluator.
 */
type DistantSunCpuReflectiveGroundKernelEvaluationExcludedProperty = 'directionToLight' | 'lightSource';

/** Reflective-ground kernel request accepted by the configured evaluator. */
type DistantSunCpuReflectiveGroundKernelEvaluationRequest = Omit<
	DistantSunReflectiveGroundScatteringKernelRequest,
	DistantSunCpuReflectiveGroundKernelEvaluationExcludedProperty
>;

/** Later-order kernel request accepted by the configured evaluator. */
type DistantSunCpuLaterOrderKernelEvaluationRequest =
	DistantSunCpuBlackGroundKernelEvaluationRequest | DistantSunCpuReflectiveGroundKernelEvaluationRequest;

/** Spherical distant-Sun geometry required by stored-field transport. */
type DistantSunScatteringDensityTransportGeometry = PureScatteringDensityTransportGeometry &
	Readonly<{
		/**
		 * Call this method to express one executable Fibonacci radiance direction
		 * in physical space.
		 *
		 * @param cacheDirection - The executable cache direction.
		 * @returns - The physical-space incoming-radiance direction.
		 */
		expressPhysicalIncomingRadianceDirection(cacheDirection: UnitVector3): UnitVector3;
		/**
		 * Call this method to resolve construction-time position taps from
		 * geometry-owned facts.
		 *
		 * @param request - The position-stencil request.
		 * @returns - The resolved construction-position stencil.
		 */
		resolveScatteringCacheConstructionPositionStencil(
			request: ScatteringCachePositionStencilRequest,
		): ScatteringCachePositionStencil;
	}>;

/** Request for one source-owned distant-Sun stored-field transport build. */
type DistantSunScatteringDensityTransportRequest = Readonly<{
	/** Sealed Native48/W27/Native-15 pure-Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Diagnostic J1 or production J2/J3 order being transported. */
	scatteringOrder: 1 | 2 | 3 | 4;
	/** Spherical construction and source-frame operations. */
	geometry: DistantSunScatteringDensityTransportGeometry;
	/** Atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Endpoint-trapezoid and transmittance operations. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Executable production domain selected by the retained profile. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Accepted executable path-integration interval count. */
	transportIntervalCount: number;
	/** Optional allocated pure-Lk field identity override. */
	id?: string;
	/** Optional observer of bounded synchronous construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Common completed nonresident CPU cache result data. */
type DistantSunCpuCacheResultBase = Readonly<{
	/** Executable domains and basis used to construct the resident artifact. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Final sealed cumulative scattering-density field. */
	cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Cache-construction options that completed. */
	options: CacheConstructionOptions;
}>;

/** Complete requested N=1 CPU build result. */
type DistantSunCpuCacheResultN1 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 1;
		/** Pure J1 field in ascending order. */
		pureScatteringDensityByOrder: readonly [CpuDirectionalSpectralFieldContract];
		/** N=1 constructs no transported-radiance field. */
		pureRadianceByOrder: readonly [];
	}>;

/** Complete requested N=2 CPU build result. */
type DistantSunCpuCacheResultN2 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 2;
		/** Pure J1 and J2 fields in ascending order. */
		pureScatteringDensityByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
		/** Direct-primary L1 field; N=2 constructs no L2 field. */
		pureRadianceByOrder: readonly [CpuDirectionalSpectralFieldContract];
	}>;

/** Complete requested N=3 CPU build result. */
type DistantSunCpuCacheResultN3 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 3;
		/** Pure J1 through J3 fields in ascending order. */
		pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
		/** Pure L1 and L2 fields in ascending order. */
		pureRadianceByOrder: readonly CpuDirectionalSpectralFieldContract[];
	}>;

/** Complete requested N=4 CPU build result. */
type DistantSunCpuCacheResultN4 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 4;
		/** Pure J1 through J4 fields in ascending order. */
		pureScatteringDensityByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
		/** Direct L1 followed by transported L2 and L3 fields; L4 is absent. */
		pureRadianceByOrder: readonly [
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
			CpuDirectionalSpectralFieldContract,
		];
	}>;

/** Complete requested N=5 CPU build result. */
type DistantSunCpuCacheResultN5 = DistantSunCpuCacheResultBase &
	Readonly<{
		/** Requested recurrence-graph discriminator. */
		maximumScatteringOrder: 5;
		/** Pure J1 through J5 fields in ascending order. */
		pureScatteringDensityByOrder: readonly CpuDirectionalSpectralFieldContract[];
		/** Pure L1 through L4 fields in ascending order. */
		pureRadianceByOrder: readonly CpuDirectionalSpectralFieldContract[];
	}>;

/**
 * Identity properties excluded from the common distant-Sun CPU cache build request.
 *
 * - **"id"** - Per-field identity assigned by recurrence orchestration.
 * - **"provenanceIdentity"** - Per-field provenance assigned by recurrence orchestration.
 */
type DistantSunCpuCacheBuildRequestBaseExcludedProperty = 'id' | 'provenanceIdentity';

/** Physical collaborators and identities shared by every CPU build. */
type DistantSunCpuCacheBuildRequestBase = Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	DistantSunCpuCacheBuildRequestBaseExcludedProperty
> &
	Readonly<{
		/** Configured BRDF owner, or null for black ground. */
		groundBoundary?: GroundBoundary | null;
		/** Executable construction domains selected by the retained profile. */
		domainSelection: DistantSunConstructionDomainSelection;
		/** Profile-selected executable interval count. */
		transportIntervalCount: number;
	}>;

/** Stronger geometry surface required when direct L1 is built. */
type DistantSunCpuCacheMultipleScatteringBuildRequestBase = Omit<DistantSunCpuCacheBuildRequestBase, 'geometry'> &
	Readonly<{
		/** Geometry surface required for direct L1. */
		geometry: DistantSunPrimaryRadianceGeometry;
		/** Source-created calculator shared with direct-primary L1. */
		calculator: DistantSunPrimaryRadianceCalculator;
	}>;

/** Physical inputs supplied to the source-owned public N=1 build. */
type DistantSunCpuCacheRequestN1Base = Omit<DistantSunCpuCacheBuildRequestBase, 'lightSource'>;

/**
 * Provider-owned properties excluded from public distant-Sun multiple-scattering requests.
 *
 * - **"lightSource"** - Configured source captured by the provider.
 * - **"geometry"** - Geometry replaced by the combined direct and later-order surface.
 * - **"calculator"** - Spectral calculator constructed by the provider.
 */
type DistantSunCpuCacheMultipleScatteringRequestBaseExcludedProperty = 'lightSource' | 'geometry' | 'calculator';

/** Physical inputs supplied to public multiple-scattering builds. */
type DistantSunCpuCacheMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringBuildRequestBase,
	DistantSunCpuCacheMultipleScatteringRequestBaseExcludedProperty
> &
	Readonly<{
		/** Geometry surface shared by direct and later-order scattering. */
		geometry: DistantSunPrimaryRadianceGeometry & DistantSunLaterOrderScatteringGeometry;
	}>;

/**
 * Native-profile sections replaced by explicit reflective-ground facts.
 *
 * - **"spectral"** - Spectral section strengthened with the exact configured basis.
 * - **"physical"** - Physical section strengthened with explicit ground albedo.
 */
type DistantSunReflectiveGroundProfileExcludedProperty = 'spectral' | 'physical';

/** Explicit profile facts owned by reflective ground. */
type DistantSunReflectiveGroundProfile = Omit<
	NativeProductionProfile,
	DistantSunReflectiveGroundProfileExcludedProperty
> &
	Readonly<{
		/** Exact native basis used by the configured boundary. */
		spectral: NativeProductionProfile['spectral'] &
			Readonly<{
				/** Native spectral basis used by the configured boundary. */
				basis: SpectralBasis;
			}>;
		/** Explicitly configured profile-owned albedo. */
		physical: NativePhysicalProfile &
			Readonly<{
				/** Explicit physical ground facts. */
				ground: Readonly<{
					/** Profile-owned spectral albedo. */
					albedo: SpectralReflectancePacket;
				}>;
			}>;
	}>;

/** Multiple-scattering request with the exact omitted-black boundary. */
type DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	'groundBoundary'
> &
	Readonly<{
		/** Null reflective boundary that preserves the canonical black path. */
		groundBoundary?: null;
	}>;

/**
 * Properties replaced by an explicit reflective-ground CPU cache request.
 *
 * - **"groundBoundary"** - Boundary replaced by the required configured BRDF owner.
 * - **"geometry"** - Geometry strengthened with ground-reflection operations.
 * - **"atmosphere"** - Atmosphere strengthened with optical-depth integration.
 * - **"profile"** - Profile strengthened with explicit boundary-owned spectral facts.
 */
type DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBaseExcludedProperty =
	'groundBoundary' | 'geometry' | 'atmosphere' | 'profile';

/** Multiple-scattering request with an explicit profile-owned boundary. */
type DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBaseExcludedProperty
> &
	Readonly<{
		/** Geometry-owned ground hits, position sampling, and paths. */
		geometry: DistantSunCpuCacheMultipleScatteringRequestBase['geometry'] & DistantSunGroundReflectionGeometry;
		/** Atmosphere-owned optical-depth integration. */
		atmosphere: DistantSunCpuCacheMultipleScatteringRequestBase['atmosphere'] &
			DistantSunGroundReflectionAtmosphere;
		/** BRDF owner configured from the same profile albedo. */
		groundBoundary: GroundBoundary;
		/** Explicit profile that owns the boundary albedo. */
		profile: DistantSunReflectiveGroundProfile;
	}>;

/** Explicit public N=1 build request without later-order collaborators. */
type DistantSunCpuCacheRequestN1 = DistantSunCpuCacheRequestN1Base &
	Readonly<{
		/** Explicit J1-only pass-graph selection. */
		maximumScatteringOrder: 1;
	}>;

/** Omitted-black public N=2 build request. */
type DistantSunCpuCacheBlackGroundRequestN2 = DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase &
	Readonly<{
		/** Explicit J1, L1, and J2 pass-graph selection. */
		maximumScatteringOrder: 2;
	}>;

/** Reflective-ground public N=2 build request. */
type DistantSunCpuCacheReflectiveGroundRequestN2 = DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase &
	Readonly<{
		/** Explicit J1, L1, and J2 pass-graph selection. */
		maximumScatteringOrder: 2;
	}>;

/** Explicit public N=2 build request. */
type DistantSunCpuCacheRequestN2 = DistantSunCpuCacheBlackGroundRequestN2 | DistantSunCpuCacheReflectiveGroundRequestN2;

/** Omitted-black explicit or default public N=4 build request. */
type DistantSunCpuCacheBlackGroundRequestN4 = Omit<
	DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase,
	'geometry'
> &
	Readonly<{
		/** Explicit or default J1-through-J4 pass-graph selection. */
		maximumScatteringOrder?: 4;
		/** Geometry surface required by the complete N4 recurrence. */
		geometry: DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase['geometry'] &
			DistantSunScatteringDensityTransportGeometry;
	}>;

/** Reflective-ground explicit or default public N=4 build request. */
type DistantSunCpuCacheReflectiveGroundRequestN4 = Omit<
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase,
	'geometry'
> &
	Readonly<{
		/** Explicit or default J1-through-J4 pass-graph selection. */
		maximumScatteringOrder?: 4;
		/** Geometry surface required by the complete reflective N4 recurrence. */
		geometry: DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase['geometry'] &
			DistantSunScatteringDensityTransportGeometry;
	}>;

/** Explicit or default public N=4 build request. */
type DistantSunCpuCacheRequestN4 = DistantSunCpuCacheBlackGroundRequestN4 | DistantSunCpuCacheReflectiveGroundRequestN4;

/** Explicit public N=3 build request using the higher-order geometry surface. */
type DistantSunCpuCacheRequestN3 = Omit<DistantSunCpuCacheRequestN4, 'maximumScatteringOrder'> &
	Readonly<{maximumScatteringOrder?: 3}>;

/** Explicit public N=5 build request using the higher-order geometry surface. */
type DistantSunCpuCacheRequestN5 = Omit<DistantSunCpuCacheRequestN4, 'maximumScatteringOrder'> &
	Readonly<{maximumScatteringOrder?: 5}>;

/**
 * Geometry method names observed by the distant-Sun primary-radiance evaluator fixture.
 *
 * - **"expressPhysicalIncomingRadianceDirection"** - Physical incoming-direction mapping observed by the fixture.
 * - **"resolveCacheBuildRay"** - Construction-ray resolution observed by the fixture.
 */
type DistantSunPrimaryRadianceGeometrySpyMethod = 'expressPhysicalIncomingRadianceDirection' | 'resolveCacheBuildRay';

/** Ground-contribution controls for one distant-Sun evaluator fixture. */
type DistantSunGroundContributionEvaluationOptions = Readonly<{
	/** Pure J2, J3, or J4 order under evaluation. */
	scatteringOrder: 2 | 3 | 4 | 5;
	/** Physical normal at the selected ground hit. */
	normal: UnitVector3;
	/** Source-to-ground transmittance scalar. */
	sourceTransmittance: number;
	/** Ground-to-construction-position transmittance scalar. */
	groundToPositionTransmittance: number;
	/** Optional pure L1 ground illumination used by J3. */
	groundIlluminationRadiance?: CpuDirectionalSpectralFieldContract | null;
	/** Optional explicit-ground selection. */
	reflectiveGround?: boolean;
	/** Optional explicit BRDF scalar. */
	brdfValue?: number;
	/** Optional preceding pure-radiance scalar. */
	previousRadianceValue?: number;
	/** Optional construction-position stencil. */
	positionStencil?: ScatteringCachePositionStencil;
	/** Optional distinct final-view position stencil. */
	finalViewPositionStencil?: ScatteringCachePositionStencil;
	/** Optional distance to the selected ground hit. */
	groundHitDistance?: number;
}>;

/** Selected distant-Sun ground contribution and observed operation counts. */
type DistantSunGroundContributionEvaluationResult = Readonly<{
	/** Selected output scalar. */
	value: number;
	/** Number of source-path resolutions. */
	sourcePathCount: number;
	/** Number of return-path resolutions. */
	returnPathCount: number;
	/** Number of direct source-lighting samples. */
	sourceLightingCount: number;
	/** Legacy construction-position stencil count. */
	positionStencilCount: number;
	/** Number of construction-position stencil resolutions. */
	constructionPositionStencilCount: number;
	/** Number of final-view position stencil resolutions. */
	finalViewPositionStencilCount: number;
}>;
/** Fixed-observer spherical support used to close one distant-Sun scene inventory. */
type DistantSunSceneCacheSupport = Readonly<{
	/** Stable support identity. */
	readonly id: string;
	/** Spherical bottom radius. */
	readonly bottomRadius: Distance;
	/** Spherical top radius. */
	readonly topRadius: Distance;
	/** Fixed observer altitude above the spherical ground. */
	readonly observerAltitude: Distance;
	/** Observer-local solar-zenith angle for the scene Sun state. */
	readonly observerSolarZenith: Angle;
	/** Complete camera-orientation support marker. */
	readonly completeCameraRotation: true;
	/** Whether every geometry-shortened endpoint from zero to the atmosphere exit is supported. */
	readonly arbitraryShortenedEndpoint: true;
}>;

/** Exact distant-Sun state that identifies one independently loadable scene cache. */
type DistantSunSceneSunIdentity = Readonly<{
	/** Stable scene identity. */
	readonly id: string;
	/** Exact canonical UTC instant represented by the scene. */
	readonly instant: string;
	/** Unit direction toward the distant Sun in the scene's retained observer-local up/east/north frame. */
	readonly directionToSourceUpEastNorth: UnitVector3;
	/** Stable radiometric source identity. */
	readonly sourceIdentity: string;
}>;

/** Definition used to build one interpolation-closed packed-row ledger. */
type DistantSunSceneCacheLedgerDefinition = Readonly<{
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed spatial support closed by the ledger. */
	readonly support: DistantSunSceneCacheSupport;
	/** Executable Native48 altitude domain. */
	readonly positionDomain: PositionDomain;
	/** Executable Z180 local-solar-zenith domain. */
	readonly solarZenithDomain: SolarZenithDomain;
	/** Executable logical W27 outgoing domain. */
	readonly outgoingDirectionDomain: CubedSphereDirectionDomain;
	/** Executable Native15 spectral basis. */
	readonly spectralBasis: SpectralBasis;
}>;

/** Executable domains used to validate an external packed-row ledger. */
type DistantSunSceneCacheLedgerDomainDefinition = Omit<DistantSunSceneCacheLedgerDefinition, 'sceneSun' | 'support'>;

/** One altitude owner's interpolation-closed retained local-solar-zenith rows. */
type DistantSunSceneCacheLedgerRow = Readonly<{
	/** Native48 altitude-node index. */
	readonly altitudeIndex: number;
	/** Physical altitude represented by the node. */
	readonly altitude: Distance;
	/** Inclusive first retained Z180 node. */
	readonly firstSolarZenithIndex: number;
	/** Inclusive last retained Z180 node. */
	readonly lastSolarZenithIndex: number;
	/** First packed payload row for this altitude node. */
	readonly firstPackedRow: number;
	/** Number of packed rows owned by this altitude node. */
	readonly packedRowCount: number;
}>;

/** Executable interpolation-closed packed-row ledger for one distant-Sun scene cache. */
interface DistantSunSceneCacheLedger {
	/** Ledger schema identity. */
	readonly schemaId: string;
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed spatial support. */
	readonly support: DistantSunSceneCacheSupport;
	/** Ordered altitude ledger rows. */
	readonly rows: readonly DistantSunSceneCacheLedgerRow[];
	/** Total retained altitude/local-solar-zenith blocks. */
	readonly retainedBlockCount: number;
	/** Logical uncompressed R32F byte length. */
	readonly oracleByteLength: number;
	/** Exact-seam R32F payload plus Uint16 map byte length. */
	readonly exactSeamByteLength: number;
	/** Call this method to resolve one retained altitude/Z180 coordinate to its packed row. */
	lookupPackedRow(altitudeIndex: number, solarZenithIndex: number): number;
	/** Call this method to return the serialized external ledger record. */
	toRecord(): DistantSunSceneCacheLedgerRecord;
}

/** Serialized packed-row ledger record emitted beside a scene-cache payload. */
type DistantSunSceneCacheLedgerRecord = Readonly<{
	/** Ledger schema identity. */
	readonly schemaId: string;
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Fixed spatial support. */
	readonly support: DistantSunSceneCacheSupport;
	/** Ordered altitude ledger rows. */
	readonly rows: readonly DistantSunSceneCacheLedgerRow[];
	/** Total retained altitude/local-solar-zenith blocks. */
	readonly retainedBlockCount: number;
	/** Logical uncompressed R32F byte length. */
	readonly oracleByteLength: number;
	/** Exact-seam R32F payload plus Uint16 map byte length. */
	readonly exactSeamByteLength: number;
}>;

/** Content-addressed payload reference in a distant-Sun scene-cache manifest. */
type DistantSunSceneCachePayloadReference = Readonly<{
	/** Asset-relative payload path. */
	readonly path: string;
	/** Exact payload byte length. */
	readonly byteLength: number;
	/** Lowercase SHA-256 content hash. */
	readonly sha256: string;
	/** Payload codec identity. */
	readonly codecId: string;
}>;

/** Serialized production manifest for one complete distant-Sun scene cache. */
type DistantSunSceneCacheManifestRecord = Readonly<{
	/** Executable numerical/mapping selection; absent in immutable legacy manifests. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Manifest schema identity. */
	readonly schemaId: string;
	/** Stable complete-cache compatibility identity. */
	readonly cacheIdentity: string;
	/** Scalar resolver interval owned by this runtime-only package. */
	readonly selection: Readonly<{
		readonly representativeSolarZenithDegrees: number;
		readonly minimumInputDegrees: number;
		readonly maximumInputExclusiveDegrees: number;
	}>;
	/** Exact scene Sun state. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Stable atmosphere identity. */
	readonly atmosphereIdentity: string;
	/** Stable spherical geometry identity. */
	readonly geometryIdentity: string;
	/** Stable ground-boundary identity. */
	readonly groundIdentity: string;
	/** Stable Native48/Z180/W27/F68/Native15/N4/Q30 domain and numerical identity. */
	readonly numericalIdentity: string;
	/** Asset-relative packed-row ledger path. */
	readonly ledgerPath: string;
	/** SHA-256 hash of the exact serialized ledger bytes. */
	readonly ledgerSha256: string;
	/** Exact W27 seam-deduplicated payload. */
	readonly exactSeamPayload: DistantSunSceneCachePayloadReference;
	/** Exact logical-W27 to unique-direction Uint16 payload. */
	readonly logicalToUniqueIndex: DistantSunSceneCachePayloadReference;
	/** Complete compiler and parent-input derivation record. */
	readonly derivation: Readonly<Record<string, unknown>>;
}>;

/** Content identity and contained location of one immutable shared-cache file. */
type DistantSunSharedCacheFileIdentity = Readonly<{
	/** Package-root-relative canonical POSIX path. */
	readonly path: string;
	/** Exact serialized file length in bytes. */
	readonly byteLength: number;
	/** Lowercase SHA-256 of the exact serialized bytes. */
	readonly sha256: string;
}>;

/** Authored implementation identity retained by durable cache derivation. */
type DistantSunSharedCacheImplementationIdentity = Readonly<{
	/** Stable implementation identifier. */
	readonly id: string;
	/** Exact implementation version. */
	readonly version: string;
	/** Lowercase SHA-256 of the material implementation source. */
	readonly sha256: string;
}>;

/** Material tool identity retained by durable cache derivation. */
type DistantSunSharedCacheToolIdentity = Readonly<{
	/** Stable tool identifier. */
	readonly id: string;
	/** Exact tool version. */
	readonly version: string;
}>;

/** Role-qualified parent artifact retained by one shared-cache derivation. */
type DistantSunSharedCacheDerivationParent = Readonly<{
	/** Unique semantic role of the parent in this derivation. */
	readonly role: string;
	/** Exact immutable parent artifact identity. */
	readonly artifact: DistantSunSharedCacheFileIdentity;
}>;

/** Role-qualified output identity retained by one shared-cache derivation. */
type DistantSunSharedCacheDerivationOutput = Readonly<{
	/** Unique semantic role of the output in this derivation. */
	readonly role: string;
	/** Exact output length in bytes. */
	readonly byteLength: number;
	/** Lowercase SHA-256 of the exact output bytes. */
	readonly sha256: string;
}>;

/** Complete durable parent, operation, implementation, tool, parameter, and output provenance. */
type DistantSunSharedCacheDerivation = Readonly<{
	/** Versioned derivation schema identity. */
	readonly schemaId: string;
	/** Ordered immutable input artifacts and their semantic roles. */
	readonly parents: readonly DistantSunSharedCacheDerivationParent[];
	/** Stable transformation operation identifier. */
	readonly operationId: string;
	/** Stable equation or mapping identifier applied by the operation. */
	readonly equationId: string;
	/** Material production implementation identity. */
	readonly implementation: DistantSunSharedCacheImplementationIdentity;
	/** Ordered material runtime and build tool identities. */
	readonly tools: readonly DistantSunSharedCacheToolIdentity[];
	/** Lowercase SHA-256 of the canonical material parameter record. */
	readonly parametersSha256: string;
	/** Ordered exact outputs produced by the operation. */
	readonly outputs: readonly DistantSunSharedCacheDerivationOutput[];
}>;

/** Selected lossless compression, shuffle, scalar, and implementation profile. */
type DistantSunSharedCacheCodecProfile = Readonly<{
	/** Versioned codec-profile schema identity. */
	readonly schemaId: string;
	/** Stable selected codec-profile identifier. */
	readonly id: string;
	/** Selected Zstandard compression format identifier. */
	readonly compression: string;
	/** Selected Zstandard compression level. */
	readonly level: number;
	/** Reversible Float32 byte-lane shuffle identifier. */
	readonly shuffle: string;
	/** Decoded little-endian Float32 scalar identifier. */
	readonly decodedScalar: string;
	/** Exact codec implementation used to produce artifacts. */
	readonly implementation: DistantSunSharedCacheImplementationIdentity;
}>;

/** Production generator identity retained by the shared-cache graph root. */
type DistantSunSharedCacheGeneratorIdentity = DistantSunSharedCacheImplementationIdentity;

/** Root report for one immutable production shared-cache package set. */
type DistantSunSharedCachePackageSetReport = Readonly<{
	/** Versioned package-set schema identity. */
	readonly schemaId: string;
	/** Lowercase SHA-256 semantic identity of the complete package set. */
	readonly packageSetIdentity: string;
	/** Complete derivation from immutable parent evidence to the package set. */
	readonly derivation: DistantSunSharedCacheDerivation;
	/** Exact production generator identity. */
	readonly generator: DistantSunSharedCacheGeneratorIdentity;
	/** Selected lossless codec profile. */
	readonly codecProfile: DistantSunSharedCacheCodecProfile;
	/** Ordered configuration-manifest artifacts available in the set. */
	readonly configurations: readonly DistantSunSharedCacheFileIdentity[];
	/** Exact runtime-catalog artifact selected by this set. */
	readonly runtimeCatalog: DistantSunSharedCacheFileIdentity;
}>;

/** Frozen nearest-integer half-up selection and darkness boundary. */
type DistantSunSharedCacheCatalogSelection = Readonly<{
	/** Production scene-selection algorithm identifier. */
	readonly kind: string;
	/** Inclusive texture-free darkness boundary in degrees. */
	readonly darkFromSolarZenithDegrees: number;
	/** First catalog scene angle in degrees. */
	readonly startSolarZenithDegrees: number;
	/** Last retained catalog scene angle in degrees. */
	readonly endSolarZenithDegrees: number;
	/** Scene-angle increment in degrees. */
	readonly incrementDegrees: number;
	/** Minimum supported input angle in degrees. */
	readonly minimumInputDegrees: number;
	/** Exclusive maximum cache-backed input angle in degrees. */
	readonly maximumInputExclusiveDegrees: number;
}>;

/** One ordered scene-manifest entry in the production shared-cache catalog. */
type DistantSunSharedCacheCatalogEntry = Readonly<{
	/** Stable scene identity. */
	readonly id: string;
	/** Representative local solar-zenith angle in degrees. */
	readonly representativeSolarZenithDegrees: number;
	/** Exact scene-manifest file identity. */
	readonly manifest: DistantSunSharedCacheFileIdentity;
}>;

/** Complete production scene-selection catalog for one shared-cache configuration. */
type DistantSunSharedCacheRuntimeCatalog = Readonly<{
	/** Versioned runtime-catalog schema identity. */
	readonly schemaId: string;
	/** Lowercase SHA-256 of the selected physical and numerical configuration. */
	readonly configurationIdentity: string;
	/** Frozen production selection policy. */
	readonly selection: DistantSunSharedCacheCatalogSelection;
	/** All 109 scenes in ascending representative-angle order. */
	readonly scenes: readonly DistantSunSharedCacheCatalogEntry[];
}>;

/** Exact-seam W27 layout and authenticated logical-to-unique map identity. */
type DistantSunSharedCacheDirectionLayout = Readonly<{
	/** Production exact-seam direction-codec identifier. */
	readonly id: string;
	/** Number of stored unique W27 directions. */
	readonly uniqueDirectionCount: number;
	/** Number of logical face-grid W27 directions. */
	readonly logicalDirectionCount: number;
	/** Exact Uint16 logical-to-unique index artifact. */
	readonly logicalToUniqueIndex: DistantSunSharedCacheFileIdentity;
}>;

/** Native15 spectral storage order and scalar identity. */
type DistantSunSharedCacheSpectralLayout = Readonly<{
	/** Native spectral basis identifier. */
	readonly id: string;
	/** Number of spectral basis channels. */
	readonly channelCount: number;
	/** Wavelength-major decoded block ordering. */
	readonly order: string;
	/** Decoded little-endian Float32 scalar identity. */
	readonly scalar: string;
}>;

/** One zero-based indexed coordinate domain. */
type DistantSunSharedCacheIndexDomain = Readonly<{
	/** First inclusive executable index. */
	readonly firstIndex: number;
	/** Number of executable indices. */
	readonly count: number;
}>;

/** Native48 altitude and Z180 local-solar-zenith coordinate domains. */
type DistantSunSharedCacheCoordinateDomains = Readonly<{
	/** Native48 altitude index domain. */
	readonly altitude: DistantSunSharedCacheIndexDomain;
	/** Z180 angle-index domain and one-degree bin width. */
	readonly solarZenith: DistantSunSharedCacheIndexDomain & Readonly<{readonly binWidthDegrees: number}>;
}>;

/** Selected 8x8 shared-block geometry and decoded ordering. */
type DistantSunSharedCacheBlockGrid = Readonly<{
	/** Altitude indices per tile. */
	readonly altitudeCount: number;
	/** Local-solar-zenith indices per tile. */
	readonly solarZenithCount: number;
	/** Altitude-first then solar-zenith coordinate ordering identifier. */
	readonly coordinateOrder: string;
	/** Wavelength-first then coordinate then direction decoded ordering identifier. */
	readonly payloadOrder: string;
	/** Marker that coordinates absent from the inventory union consume no rows. */
	readonly omitUnpopulatedCoordinates: boolean;
}>;

/** Physical, numerical, domain, block-grid, codec, and index identity for one shared inventory. */
type DistantSunSharedCacheConfigurationManifest = Readonly<{
	/** Executable numerical/mapping selection; required by the accuracy-v2 schema. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Versioned configuration-manifest schema identity. */
	readonly schemaId: string;
	/** Lowercase SHA-256 of canonical physical, numerical, and layout facts. */
	readonly configurationIdentity: string;
	/** Stable atmosphere model identity. */
	readonly atmosphereIdentity: string;
	/** Stable spherical geometry identity. */
	readonly geometryIdentity: string;
	/** Stable ground-boundary identity. */
	readonly groundIdentity: string;
	/** Stable Native48/Z180/W27/F68/Native15/N4/Q30 numerical identity. */
	readonly numericalIdentity: string;
	/** Exact-seam direction layout and logical map identity. */
	readonly directionLayout: DistantSunSharedCacheDirectionLayout;
	/** Native15 spectral layout. */
	readonly spectralLayout: DistantSunSharedCacheSpectralLayout;
	/** Native48 and Z180 coordinate domains. */
	readonly coordinateDomains: DistantSunSharedCacheCoordinateDomains;
	/** Selected 8x8 block-grid contract. */
	readonly blockGrid: DistantSunSharedCacheBlockGrid;
	/** Selected lossless codec profile. */
	readonly codecProfile: DistantSunSharedCacheCodecProfile;
	/** Exact configuration-owned block-index artifact. */
	readonly blockIndex: DistantSunSharedCacheFileIdentity;
}>;

/** One altitude and local-solar-zenith coordinate in canonical index space. */
type DistantSunSharedCacheCoordinate = readonly [altitudeIndex: number, solarZenithIndex: number];

/** Logical decoded byte identity without an encoded artifact path. */
type DistantSunSharedCacheDecodedBlockIdentity = Readonly<{
	/** Exact unshuffled decoded byte length. */
	readonly byteLength: number;
	/** Lowercase SHA-256 of the exact unshuffled decoded bytes. */
	readonly sha256: string;
}>;

/** One logical 8x8 tile and its independently identified encoded artifact. */
type DistantSunSharedCacheBlockDescriptor = Readonly<{
	/** Configuration-qualified logical decoded block identity. */
	readonly id: string;
	/** First altitude and local-solar-zenith indices in the tile. */
	readonly tile: Readonly<{readonly altitudeIndex: number; readonly solarZenithIndex: number}>;
	/** Number of populated coordinate rows. */
	readonly rowCount: number;
	/** Populated coordinates in canonical altitude-then-solar-zenith order. */
	readonly coordinates: readonly DistantSunSharedCacheCoordinate[];
	/** Logical decoded byte identity, independent of compression. */
	readonly decoded: DistantSunSharedCacheDecodedBlockIdentity;
	/** Content-addressed compressed artifact identity. */
	readonly encoded: DistantSunSharedCacheFileIdentity;
	/** Selected codec-profile identifier. */
	readonly codecProfileId: string;
	/** Selected reversible byte-lane shuffle identifier. */
	readonly shuffle: string;
	/** Complete block extraction, shuffle, compression, and output derivation. */
	readonly derivation: DistantSunSharedCacheDerivation;
}>;

/** Complete nonoverlapping coordinate ownership index for one shared-cache configuration. */
type DistantSunSharedCacheBlockIndex = Readonly<{
	/** Versioned block-index schema identity. */
	readonly schemaId: string;
	/** Lowercase SHA-256 of the owning configuration. */
	readonly configurationIdentity: string;
	/** Exact decoded Native15/W27 byte length per coordinate row. */
	readonly rowByteLength: number;
	/** Number of distinct coordinates owned by all blocks. */
	readonly distinctCoordinateCount: number;
	/** Logical blocks in canonical tile order. */
	readonly blocks: readonly DistantSunSharedCacheBlockDescriptor[];
}>;

/** Half-open scalar input interval selecting one representative scene. */
type DistantSunSharedCacheSceneSelection = Readonly<{
	/** Representative local solar-zenith angle in degrees. */
	readonly representativeSolarZenithDegrees: number;
	/** Inclusive minimum input angle in degrees. */
	readonly minimumInputDegrees: number;
	/** Exclusive maximum input angle in degrees. */
	readonly maximumInputExclusiveDegrees: number;
}>;

/** Physical and numerical identities required to consume one shared-cache scene. */
type DistantSunSharedCacheSceneCompatibility = Readonly<{
	/** Lowercase SHA-256 of the complete shared configuration. */
	readonly configurationIdentity: string;
	/** Stable atmosphere model identity. */
	readonly atmosphereIdentity: string;
	/** Stable spherical geometry identity. */
	readonly geometryIdentity: string;
	/** Stable ground-boundary identity. */
	readonly groundIdentity: string;
	/** Stable Native48/Z180/W27/F68/Native15/N4/Q30 numerical identity. */
	readonly numericalIdentity: string;
}>;

/** Exact identity of the reconstructed dense control payload for one scene. */
type DistantSunSharedCacheReconstructedPayloadIdentity = DistantSunSharedCacheDecodedBlockIdentity;

/** One production scene's ledger, ordered coordinates, block needs, and dense-control identity. */
type DistantSunSharedCacheSceneManifest = Readonly<{
	/** Versioned shared scene-manifest schema identity. */
	readonly schemaId: string;
	/** Stable representative scene identity. */
	readonly id: string;
	/** Representative local solar-zenith angle in degrees. */
	readonly representativeSolarZenithDegrees: number;
	/** Exact half-open scalar selection interval. */
	readonly selection: DistantSunSharedCacheSceneSelection;
	/** Exact physical Sun identity and unit direction. */
	readonly sceneSun: DistantSunSceneSunIdentity;
	/** Required physical and numerical configuration identities. */
	readonly compatibility: DistantSunSharedCacheSceneCompatibility;
	/** Interpolation-closed Native48/Z180 scene ledger. */
	readonly ledger: DistantSunSceneCacheLedgerRecord;
	/** Coordinates in exact reconstructed packed-row order. */
	readonly coordinates: readonly DistantSunSharedCacheCoordinate[];
	/** Logical block identities in first-use scene order. */
	readonly requiredBlockIds: readonly string[];
	/** Exact dense-control payload identity reconstructed from the required blocks. */
	readonly reconstructedPayload: DistantSunSharedCacheReconstructedPayloadIdentity;
	/** Complete scene assembly and reconstructed-output derivation. */
	readonly derivation: DistantSunSharedCacheDerivation;
}>;

/** One logical sample destination in the persistent RGBA packet atlas. */
type DistantSunSharedCachePacketDestination = Readonly<{
	/** Resident array-texture layer. */
	readonly layer: number;
	/** Packet-layer texel row. */
	readonly y: number;
	/** Packet-layer texel column. */
	readonly x: number;
	/** RGBA component index. */
	readonly component: number;
}>;

/** Authenticated decoded inputs required to construct one packet-ready block. */
type DistantSunSharedCachePacketBuildRequest = Readonly<{
	/** Configuration-qualified logical decoded block identity. */
	readonly logicalBlockId: string;
	/** Lowercase SHA-256 of the decoded wavelength-major bytes. */
	readonly decodedSha256: string;
	/** Number of populated coordinate rows. */
	readonly blockRowCount: number;
	/** Authenticated decoded wavelength-major Native15 Float32 values. */
	readonly decodedValues: Float32Array;
	/** Executable W27 logical-to-unique Uint16 index. */
	readonly logicalToUniqueIndex: Uint16Array;
	/** Lowercase SHA-256 of the exact logical-to-unique index bytes. */
	readonly logicalToUniqueIndexSha256: string;
}>;

/** Fixed single-layer RGBA32F packet storage and upload orientation. */
type DistantSunSharedCachePacketStorage = Readonly<{
	/** RGBA32F packet texture format. */
	readonly format: string;
	/** Packet layer width in RGBA texels. */
	readonly width: number;
	/** Packet layer height in RGBA texels. */
	readonly height: number;
	/** Single-layer packet-block depth. */
	readonly layers: number;
	/** Marker that RGBA values are stored with x as the fastest texel coordinate. */
	readonly xFastest: boolean;
	/** Marker that packet construction does not invert the y axis. */
	readonly flipY: boolean;
}>;

/** One complete packet-ready block validated before GPU upload. */
type DistantSunSharedCachePacketBlock = Readonly<{
	/** Versioned packet-block schema identity. */
	readonly schemaId: string;
	/** Configuration-qualified logical decoded block identity. */
	readonly logicalBlockId: string;
	/** Lowercase SHA-256 of the authenticated decoded source bytes. */
	readonly decodedSha256: string;
	/** Lowercase SHA-256 of the authenticated W27 seam map. */
	readonly logicalToUniqueIndexSha256: string;
	/** Number of populated coordinate rows. */
	readonly blockRowCount: number;
	/** Fixed packet-layer storage facts. */
	readonly storage: DistantSunSharedCachePacketStorage;
	/** X-fastest RGBA32F values including exact-zero padding. */
	readonly values: Float32Array;
}>;

/**
 * Authenticated resident-slot lifecycle state.
 *
 * - **"uploaded"** - The complete packet block upload succeeded and is eligible for publication.
 */
type DistantSunSharedCacheResidentSlotState = 'uploaded';

/** One successfully uploaded authenticated block and atlas-slot binding. */
type DistantSunSharedCacheResidentSlot = Readonly<{
	/** Versioned resident-slot schema identity. */
	readonly schemaId: string;
	/** Publication generation that owns the slot binding. */
	readonly generation: number;
	/** Zero-based persistent atlas layer. */
	readonly slotIndex: number;
	/** Uploaded and authenticated slot state. */
	readonly state: DistantSunSharedCacheResidentSlotState;
	/** Configuration-qualified logical block identity. */
	readonly logicalBlockId: string;
	/** Lowercase SHA-256 of the uploaded block's decoded bytes. */
	readonly decodedSha256: string;
	/** Number of populated rows addressable in the uploaded packet block. */
	readonly blockRowCount: number;
}>;

/** Complete RG16UI mapping from scene packed rows to resident slots and block rows. */
type DistantSunSharedCacheRowAddressTable = Readonly<{
	/** Versioned row-address schema identity. */
	readonly schemaId: string;
	/** Publication generation that owns every address. */
	readonly generation: number;
	/** Unsigned two-component metadata texture format. */
	readonly format: string;
	/** Maximum scene packed-row extent. */
	readonly width: number;
	/** Fixed 109-scene catalog extent. */
	readonly height: number;
	/** Allocated packet-atlas layer count. */
	readonly residentLayerCount: number;
	/** Packed-row count for every scene ordinal. */
	readonly sceneRowCounts: readonly number[];
	/** Uint16 sentinel stored in both components for unavailable rows. */
	readonly unavailableValue: number;
	/** Scene-major RG16UI values storing resident slot then block row. */
	readonly values: Uint16Array;
}>;

/** Complete RGBA32I mapping from scene/altitude coordinates to interpolation spans. */
type DistantSunSharedCacheAltitudeLedgerTable = Readonly<{
	/** Versioned altitude-ledger schema identity. */
	readonly schemaId: string;
	/** Publication generation that owns every ledger entry. */
	readonly generation: number;
	/** Signed four-component metadata texture format. */
	readonly format: string;
	/** Fixed Native48 altitude extent. */
	readonly width: number;
	/** Fixed 109-scene catalog extent. */
	readonly height: number;
	/** Scene-major RGBA32I values storing first zenith, last zenith, first packed row, and zero. */
	readonly values: Int32Array;
}>;

/**
 * Predictive route preparation completion state.
 *
 * - **"partial"** - A bounded prefix or subset is prepared and later blocks remain scheduled.
 * - **"ready"** - Every required route block is prepared within the declared memory ceiling.
 */
type DistantSunSharedCachePreparedRouteStatus = 'partial' | 'ready';

/** Bounded host-retention state for one declared animation route. */
type DistantSunSharedCachePreparedRoute = Readonly<{
	/** Versioned prepared-route schema identity. */
	readonly schemaId: string;
	/** Preparation generation invalidated by route replacement. */
	readonly generation: number;
	/** Stable caller-owned route identity. */
	readonly routeId: string;
	/** Lowercase SHA-256 of the selected physical/numerical configuration. */
	readonly configurationIdentity: string;
	/** Lowercase SHA-256 of the exact runtime catalog. */
	readonly catalogSha256: string;
	/** Ordered scene ordinals, including repeated or reverse traversal. */
	readonly sceneOrdinals: readonly number[];
	/** Unique logical block identities required by the route. */
	readonly requiredBlockIds: readonly string[];
	/** Unique required logical block identities currently prepared. */
	readonly preparedBlockIds: readonly string[];
	/** Caller-declared compressed, decoded, and packet-ready host-memory ceiling in bytes. */
	readonly hostMemoryCeilingBytes: number;
	/** Current route-owned retained host bytes. */
	readonly retainedBytes: number;
	/** Whether preparation is partial or complete. */
	readonly status: DistantSunSharedCachePreparedRouteStatus;
}>;

/**
 * Atomically visible cache publication state.
 *
 * - **"ready"** - One complete shared scene is addressable through authenticated resident blocks.
 * - **"dark"** - The texture-free state at or above 108 degrees is active.
 */
type DistantSunSharedCachePublicationStatus = 'ready' | 'dark';

/** One coherent frame-boundary shared-cache publication or texture-free dark state. */
type DistantSunSharedCachePublicationSnapshot = Readonly<{
	/** Versioned publication-snapshot schema identity. */
	readonly schemaId: string;
	/** Generation shared by slots, row addresses, and altitude ledger. */
	readonly generation: number;
	/** Ready or texture-free dark publication state. */
	readonly status: DistantSunSharedCachePublicationStatus;
	/** Published scene ordinal, or null for the dark state. */
	readonly sceneOrdinal: number | null;
	/** Published representative local solar-zenith angle in degrees, or null for darkness. */
	readonly representativeSolarZenithDegrees: number | null;
	/** Logical blocks required by the published scene. */
	readonly requiredBlockIds: readonly string[];
	/** Authenticated resident slots visible to the publication. */
	readonly residentSlots: readonly DistantSunSharedCacheResidentSlot[];
	/** Complete row-address table, or null for darkness. */
	readonly rowAddressTable: DistantSunSharedCacheRowAddressTable | null;
	/** Complete altitude-ledger table, or null for darkness. */
	readonly altitudeLedgerTable: DistantSunSharedCacheAltitudeLedgerTable | null;
}>;
/** Authenticated package graph privately copied into each runtime controller. */
type DistantSunSharedCachePackageGraph = {
	/** Physical and numerical compatibility owner. */
	configuration: DistantSunSharedCacheConfigurationManifest;
	/** Complete canonical coordinate ownership. */
	blockIndex: DistantSunSharedCacheBlockIndex;
	/** All 109 authenticated scenes in ordinal order. */
	scenes: DistantSunSharedCacheSceneManifest[];
	/** Authenticated executable W27 seam map. */
	logicalToUniqueIndex: Uint16Array;
	/** Catalog artifact identity. */
	catalogSha256: string;
};
/** Browser ingress for one trusted immutable package root. */
type DistantSunSharedCachePackageRequest = {
	/** Same-origin root directory URL with a trailing slash. */
	rootUrl: string;
	/** Trusted root-report file identity from deployment selection. */
	report: DistantSunSharedCacheFileIdentity;
	/** Whole-graph cancellation signal. */
	signal: AbortSignal;
	/** Optional complete-file network capability. */
	fetch?: typeof fetch;
};
/** Authenticated metadata and contained artifact addressing capability. */
interface DistantSunSharedCachePackageSource {
	/** Call this method to obtain a private authenticated metadata snapshot. */
	getGraph(): DistantSunSharedCachePackageGraph;
	/** Call this method to resolve one authenticated logical block to its contained URL. */
	getBlockUrl(id: string): string;
}
/** Borrowed process-wide block preparation capability. */
interface DistantSunSharedCachePacketSource {
	/** Call this method to acquire a separately releasable authenticated packet pin. */
	request(request: DistantSunSharedCacheBlockRequest): Promise<DistantSunSharedCachePacketLease>;
}
/** Uploaded atlas slot with its optional retained host pin. */
type DistantSunSharedCacheAtlasSlot = {
	/** Zero-based resident layer. */
	index: number;
	/** Authenticated logical block descriptor. */
	block: DistantSunSharedCacheBlockDescriptor;
	/** Active or predictive host pin, absent for unpinned GPU reuse. */
	lease?: DistantSunSharedCachePacketLease;
	/** Monotonic deterministic LRU sequence. */
	lastUse: number;
};
/** Explicit target qualification required for optional memory policies. */
type DistantSunSharedCacheMemoryQualification = {
	/** Immutable qualification evidence identity. */
	evidenceId: string;
	/** Qualified device/driver target identity. */
	targetId: string;
	/** Qualified GPU allocation ceiling excluding driver overhead. */
	maximumBytes: number;
};
/** Exact larger-atlas route qualification. */
type DistantSunSharedCacheRouteQualification = DistantSunSharedCacheMemoryQualification & {
	/** Exact unique qualified route block set. */
	blockIds: readonly string[];
};
/** Runtime capabilities and bounded atlas layout for one shared-cache controller. */
type DistantSunSharedCacheControllerDefinition = {
	/** Expected numerical/mapping policy, checked against the authenticated package. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Explicit candidate reconstruction; omission preserves the deployed linear control. */
	solarInterpolation?: DistantSunSolarInterpolationMethod;
	/** Borrowed renderer resource owner. */
	backend: CachePacketAtlasBackend;
	/** Borrowed process-wide packet transport. */
	transport: DistantSunSharedCachePacketSource;
	/** Authenticated package metadata owner. */
	package: DistantSunSharedCachePackageSource;
	/** Fixed GPU layer capacity, defaulting to 24. */
	layers?: number;
	/** Historical qualification-harness allowance, retained for existing callers; not a runtime allocation gate. */
	maximumGpuBytes?: number;
	/** Required qualification for any nondefault atlas capacity. */
	routeQualification?: DistantSunSharedCacheRouteQualification;
	/** Historical transition evidence retained for existing qualification callers; not required for runtime allocation. */
	transitionQualification?: DistantSunSharedCacheMemoryQualification;
};
/** Declared route position and velocity for one predictive request. */
type DistantSunSharedCacheSceneRequest = {
	/** Exact index in the declared ordered route, disambiguating repeats. */
	routeIndex?: number;
	/** Signed progression speed; its magnitude selects up to one second of look-ahead. */
	velocityDegreesPerSecond?: number;
};
/** Complete controller-owned frame whose borrowed resources are valid until the next publication. */
type DistantSunSharedCacheFrame = {
	/** Fixed accepted numerical/mapping policy. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Fixed reconstruction contract; absent only for the legacy linear control. */
	solarInterpolation?: DistantSunSolarInterpolationMethod;
	/** Complete validated scene and row-address selection. */
	snapshot: DistantSunSharedCachePublicationSnapshot;
	/** Owned immutable GPU metadata released on retirement. */
	metadataTextures: CacheImmutableTexture[];
	/** Opaque shader binding handles installed with the scene ordinal before rendering. */
	bindings: CacheRuntimeBinding[];
	/** Host-pinned current/predicted block window. */
	predictedBlockIds: string[];
	/** Internal atlas capability, absent for texture-free darkness. */
	atlas: DistantSunSharedCacheAtlasOwner | undefined;
};
/** Solar-angle reconstruction mode.
 * - **"linear"** - Deployed two-knot interpolation control.
 * - **"monotone-cubic"** - Complete four-knot shape-preserving candidate.
 */
type DistantSunSolarInterpolationMethod = 'linear' | 'monotone-cubic';

/** Authenticated metadata consumed by cubic support planning before atlas attachment. */
type DistantSunSharedCacheSupportInventory = Pick<DistantSunSharedCachePackageGraph, 'blockIndex' | 'scenes'>;

/** Direct coordinate-address upload derived from authenticated resident blocks. */
type DistantSunSharedCacheCoordinateTable = Readonly<{
	/** Integer two-component texture format. */ format: CacheImmutableTextureFormat;
	/** Solar-domain sample count. */ width: number;
	/** Altitude-domain sample count. */ height: number;
	/** Slot and block-row pairs, with explicit unavailable sentinels. */ values: Uint16Array;
}>;
/** Internal atlas lifecycle capability used by the controller-owned frame. */
interface DistantSunSharedCacheAtlasOwner {
	/** Opaque allocation handle. */
	readonly array: CachePersistentArray;
	/** Call this method to check whether GPU contents still match uploaded records. */
	isCurrent(): boolean;
	/** Call this method to reset invalidated GPU records after restoration. */
	resetAfterRestoration(): void;
	/** Call this method to check admission without overwriting published blocks. */
	canFit(ids: readonly string[]): boolean;
	/** Call this method to obtain current uploaded slot records for metadata construction. */
	getSlots(): DistantSunSharedCacheAtlasSlot[];
	/** Call this method to install one authenticated packet under candidate reservations. */
	install(
		block: DistantSunSharedCacheBlockDescriptor,
		lease: DistantSunSharedCachePacketLease,
		reserved: ReadonlySet<string>,
	): boolean;
	/** Call this method to release unpublished candidate pins. */
	discardCandidate(): void;
	/** Call this method to pin a complete published and predicted window. */
	protect(published: readonly string[], predicted: readonly string[], owner: string): void;
	/** Call this method to release owned host pins and GPU allocation. */
	dispose(): void;
}
/** Bounded predictive preparation and publication diagnostics. */
type DistantSunSharedCacheControllerDiagnostics = {
	/** Requested scene count. */ requests: number;
	/** Completed packet-layer upload count. */ uploads: number;
	/** Existing uploaded layer reuse count. */ reused: number;
	/** Atomically published scene count. */ published: number;
	/** Frame boundaries that held the prior publication. */ held: number;
	/** Superseded preparation count. */ canceled: number;
	/** Failed preparation count. */ failures: number;
	/** Attempted isolated dual-atlas transition count after successful allocation. */ transitions: number;
	/** Most recent complete preparation duration. */ lastPreparationMilliseconds: number;
	/** Most recent failure message, cleared on successful preparation. */ lastError: string;
	/** First predicted scene ordinal, or -1 when no complete future scene fits. */ predictedScene: number;
	/** Monotonic requested generation. */ generation: number;
	/** Published scene ordinal, or null before publication and in darkness. */ sceneOrdinal: number | null;
	/** Whether a complete current candidate awaits its frame boundary. */ candidateReady: boolean;
	/** Exact currently allocated atlas bytes, excluding driver overhead. */ gpuBytes: number;
};
/** Authenticated shared-cache selection before a renderer attachment exists. */
type DistantSunSharedCacheSelection = Omit<DistantSunSharedCacheControllerDefinition, 'backend'> & {
	/** Catalog ordinal 0-108, or null when the requested input angle is at least 108 degrees. */
	sceneOrdinal: number | null;
};

/** Direction reconstruction policy for a resident receiver-local scene cache.
 * - **"texture-bilinear"** - Established hardware-filtered sampling.
 * - **"shader-bilinear"** - Explicit Float32 bilinear weights for qualification.
 */
type DistantSunSceneDirectionInterpolationMethod = 'texture-bilinear' | 'shader-bilinear';

/** Construction values for one completely uploaded point-local scene cache. */
type DistantSunSceneCacheDefinition = Readonly<{
	/** Expected numerical/mapping policy, checked against the accepted manifest. */ scatteringAccuracy?: DistantSunScatteringAccuracyMethod;
	/** Executable altitude owner; omission retains the established Native48 domain. */ readonly positionDomain?: PositionDomain;
	/** Solar interpolation selected by the authenticated asset; omission preserves linear sampling. */ readonly solarInterpolation?: DistantSunSolarInterpolationMethod;
	/** Choose texture filtering or explicit shader bilinear weights; defaults to texture filtering. */ readonly directionInterpolation?: DistantSunSceneDirectionInterpolationMethod;
	/** Explicit atlas channel count; omitted for the established Native15 package. */ readonly spectralChannelCount?: number;
	/** Accepted exact manifest. */ readonly manifest: DistantSunSceneCacheAcceptedManifest;
	/** Accepted executable packed-row ledger. */ readonly ledger: DistantSunSceneCacheLedger;
	/** Uploaded exact-seam RGBA32F channel groups. */ readonly cumulativeTexture: CacheImmutableTexture;
	/** Uploaded logical-W27 to unique-direction R16UI index. */ readonly directionIndexTexture: CacheImmutableTexture;
}>;
/** Stable shared-scene preparation and atomic publication capability. */
interface DistantSunSharedScenePublication {
	/** Prepare complete support while retaining the visible scene. */ prepareScene(
		sceneOrdinal: number | null,
		options: DistantSunSharedCacheSceneRequest,
		signal?: AbortSignal,
	): Promise<DistantSunSharedCacheFrame | undefined>;
	/** Publish exactly the completed preparation generation. */ publishPrepared(
		generation: number,
	): DistantSunSharedCacheFrame;
	/** Cancel only unpublished preparation. */ cancelPreparation(): void;
}

/** Ordered required and predicted block window for one scene. */
type DistantSunSharedBlockWindow = {
	/** Complete ordered block identities. */ ids: string[];
	/** First predicted scene ordinal. */ predicted: number;
};
/** Executable distant-Sun numerical policy. Omission at ingress retains legacy.
 * corrected60 changes only higher-order transport and discrete Mie mass;
 * corrected60-sun035 additionally changes outgoing representation. Neither
 * changes atmosphere, incoming quadrature, direct N1 or final-view integration.
 */
type DistantSunScatteringAccuracyMethod = 'legacy' | 'corrected60' | 'corrected60-sun035';
