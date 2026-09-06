/**
 * Configure a distant sun light source.
 */
type DistantSunLightSourceConfig = {
	/**
	 * Store the normalized or normalizable direction from sample to source.
	 */
	readonly directionToLight: UnitVector3;

	/**
	 * Store source spectral irradiance with its basis and units.
	 */
	readonly sourceIrradiance: SpectralIrradiancePacket;

	/**
	 * Store apparent source angular radius.
	 */
	readonly angularRadius: Angle;
};

/**
 * Configure a finite local sun light source.
 */
type LocalSunLightSourceConfig = {
	/**
	 * Store source-owned key used in descriptors and cache compatibility.
	 */
	readonly sourceKey: string;

	/**
	 * Store the canonical physical position of the finite source.
	 */
	readonly position: Position;

	/**
	 * Store source spectral irradiance with its basis and units.
	 */
	readonly sourceIrradiance: SpectralIrradiancePacket;

	/**
	 * Store the reference distance for incident-scale calibration.
	 */
	readonly referenceDistance: Distance;

	/**
	 * Store the neutral spectral incident scale at the reference distance.
	 */
	readonly referenceSpectralIncidentScale: number;

	/**
	 * Store source radius.
	 */
	readonly radius: Distance;

	/**
	 * Store whether inverse-square distance falloff is applied.
	 */
	readonly distanceFalloff?: boolean;

	/**
	 * Store source-path optical-depth integration intervals. Omission selects
	 * the production count of fifteen.
	 */
	readonly sourceTransmittanceIntervalCount?: number;
};

/** Store one normalized finite local-Sun configuration snapshot. */
type LocalSunLightSourceConfiguration = Omit<
	LocalSunLightSourceConfig,
	"distanceFalloff" | "sourceTransmittanceIntervalCount"
> & Readonly<{
	/** Store the accepted inverse-square falloff selection. */
	readonly distanceFalloff: boolean;
	/** Store the accepted source-path integration interval count. */
	readonly sourceTransmittanceIntervalCount: number;
}>;

/** Supply normalized source facts used to derive fixed shell facts. */
type LocalSunShellFactSourceConfiguration = Pick<
	LocalSunLightSourceConfiguration,
	| "position"
	| "sourceIrradiance"
	| "referenceDistance"
	| "referenceSpectralIncidentScale"
	| "radius"
	| "distanceFalloff"
>;

/** Describe source facts retained in the fixed shell identity. */
type LocalSunShellFactSourceDescriptor = Readonly<{
	/** Store the normalized physical source position. */
	readonly position: Position;
	/** Identify the source spectral irradiance packet. */
	readonly sourceIrradianceHash: string;
	/** Store the inverse-square reference distance. */
	readonly referenceDistance: Distance;
	/** Store the neutral spectral scale at the reference distance. */
	readonly referenceSpectralIncidentScale: number;
	/** Store the finite source radius. */
	readonly radius: Distance;
	/** Store whether inverse-square falloff is enabled. */
	readonly distanceFalloff: boolean;
}>;

/** Describe the unit-bearing whole-flat-world shell domain. */
type LocalSunShellFactDomainDescriptor = Readonly<{
	/** Store the minimum source distance represented by the shell cache. */
	readonly minimumDistance: Distance;
	/** Store the maximum source distance represented by the shell cache. */
	readonly maximumDistance: Distance;
	/** Store the source's horizontal offset from the world center. */
	readonly horizontalOffset: Distance;
	/** Store the source height above the flat world. */
	readonly sourceHeight: Distance;
	/** Store the selected flat-world map radius. */
	readonly mapRadius: Distance;
	/** Store the selected atmosphere apex height. */
	readonly atmosphereApex: Distance;
}>;

/** Store executable normalized source facts used to derive shell values. */
type LocalSunShellExecutableSourceFacts = Readonly<{
	/** Store the physical source position. */
	readonly position: Position;
	/** Identify the source spectral irradiance packet. */
	readonly sourceIrradianceHash: string;
	/** Store the inverse-square reference distance. */
	readonly referenceDistance: Distance;
	/** Store the neutral spectral scale at the reference distance. */
	readonly referenceSpectralIncidentScale: number;
	/** Store the finite source radius. */
	readonly radius: Distance;
	/** Store whether inverse-square falloff is enabled. */
	readonly distanceFalloff: boolean;
}>;

/** Store executable whole-flat-world source-distance domain facts. */
type LocalSunShellExecutableDomain = Readonly<{
	/** Store the minimum represented source distance. */
	readonly minimumDistance: Distance;
	/** Store the maximum represented source distance. */
	readonly maximumDistance: Distance;
	/** Store the source horizontal offset. */
	readonly horizontalOffset: Distance;
	/** Store the source height. */
	readonly sourceHeight: Distance;
	/** Store the flat-world map radius. */
	readonly mapRadius: Distance;
	/** Store the atmosphere apex. */
	readonly atmosphereApex: Distance;
}>;

/** Describe the canonical fixed shell-fact identity. */
type LocalSunShellFactDescriptor = Readonly<{
	/** Identify this metadata kind. */
	readonly kind: "local-sun-shell-facts";
	/** Identify the fixed fact set. */
	readonly id: "algorithm32-local-sun-shell-facts";
	/** Identify the fact metadata schema. */
	readonly schemaRevision: "algorithm32-local-sun-shell-facts-v1";
	/** Report the fixed shell count. */
	readonly shellCount: 2048;
	/** Report the fixed boundary count. */
	readonly boundaryCount: 2049;
	/** Describe how the fixed facts are constructed and applied. */
	readonly policy: Readonly<{
		/** Identify the shell-boundary distribution. */
		readonly boundaries: "equal-inverse-square-source-distance";
		/** Identify exact internal-boundary ownership. */
		readonly internalBoundaryOwnership: "higher-index";
		/** Identify the held incident-amplitude policy. */
		readonly heldIncidentScale:
			"arithmetic-mean-boundary-inverse-square";
		/** Identify the recurrence term that consumes held amplitude. */
		readonly application: "primary-j1-amplitude-only";
	}>;
	/** Describe source identity facts. */
	readonly source: LocalSunShellFactSourceDescriptor;
	/** Describe source-distance domain facts. */
	readonly domain: LocalSunShellFactDomainDescriptor;
	/** Identify the normalized metadata content. */
	readonly identity: string;
}>;

/** Supply trusted storage to the fixed fact owner. */
type LocalSunShellFactCacheDefinition = Readonly<{
	/** Supply independent identity metadata. */
	readonly descriptor: LocalSunShellFactDescriptor;
	/** Supply ordered binary64 shell boundaries. */
	readonly boundaries: Float64Array;
	/** Supply one binary64 held scale per shell. */
	readonly heldIncidentScales: Float64Array;
	/** Supply the executable lower clamp. */
	readonly minimumDistance: Distance;
	/** Supply the executable upper clamp. */
	readonly maximumDistance: Distance;
}>;

/** Describe one resolved containing shell. */
type LocalSunResolvedShell = Readonly<{
	/** Store the higher-boundary-owned shell index. */
	readonly shellIndex: number;
	/** Store the precomputed held incident scale. */
	readonly heldIncidentScale: number;
	/** Store the accepted or clamped source distance. */
	readonly distanceFromSource: Distance;
	/** Report whether the requested distance was clamped. */
	readonly clamped: boolean;
}>;

/** Report retained binary64 payload owned by the shell-fact cache. */
type LocalSunShellFactResourceUsage = Readonly<{
	/** Report ordered boundary storage. */
	readonly boundaries: UnitValue<"bytes">;
	/** Report held incident-scale storage. */
	readonly heldIncidentScales: UnitValue<"bytes">;
	/** Report the complete retained binary64 payload. */
	readonly total: UnitValue<"bytes">;
}>;

/** Describe the fixed N=2048 local-Sun shell facts. */
interface LocalSunShellFactCache {
	/** Store independent fact identity metadata. */
	readonly descriptor: LocalSunShellFactDescriptor;
	/** Return an independent copy of ordered binary64 boundaries. */
	readonly boundaries: Float64Array;
	/** Return an independent copy of binary64 held incident scales. */
	readonly heldIncidentScales: Float64Array;
	/** Report retained binary64 payload without exposing mutable storage. */
	readonly resourceUsage: LocalSunShellFactResourceUsage;
	/** Resolve one finite source distance to its containing shell. */
	resolveShell(
		distanceFromSourceMeters: number,
	): LocalSunResolvedShell;
}

/** Describe continuous direct-light metadata consumed by J1 construction. */
type LocalSunContinuousDirectLightingMetadata = Readonly<{
	/** Store the normalized physical source distance. */
	readonly distanceFromSource: Distance;
	/** Store the continuous incident scale. */
	readonly incidentScale: number;
}> & Readonly<Record<string, unknown>>;

/** Describe the physical local-Sun surface required by J1 construction. */
type LocalSunConstructionContinuousSource = Readonly<{
	/** Identify the configured physical source. */
	readonly id: string;
	/** Expose normalized physical facts needed to scale spectral irradiance. */
	readonly configuration: Pick<
		LocalSunLightSourceConfiguration,
		"sourceIrradiance"
	>;
	/** Return physical source identity metadata. */
	describe(): object;
	/** Sample continuous direct lighting at one physical position. */
	sampleDirectLighting(request?: object): DirectLightingSample;
	/** Resolve the finite source path limit. */
	resolveSourcePathLimit(request: unknown): SourcePathLimit;
	/** Preserve the physical source's controller boundary. */
	createCacheController(
		request: CacheControllerRequest,
	): CacheController;
}>;

/** Supply one construction-only local-Sun light-source adapter. */
type LocalSunConstructionLightSourceDefinition = Readonly<{
	/** Supply the continuous physical source. */
	readonly source: LocalSunConstructionContinuousSource;
	/** Supply the source-paired executable shell facts. */
	readonly shellFactCache: LocalSunShellFactCache;
}>;

/**
 * Describe the flat-world synchronized local Sun position.
 */
type FlatSynchronizedPosition = {
	/**
	 * Identify the calibration mode used to produce this position.
	 */
	readonly mode: "world" | "closest";

	/**
	 * Store the resolved flat Sun latitude.
	 */
	readonly latitude: Angle;

	/**
	 * Store the resolved flat Sun longitude.
	 */
	readonly longitude: Angle;

	/**
	 * Store the latitude where the standard Sun is overhead for the UTC date.
	 */
	readonly startLatitude: Angle;

	/**
	 * Store the daily orbit anchor longitude.
	 */
	readonly startLongitude: Angle;

	/**
	 * Store the orbit anchor as an ISO timestamp.
	 */
	readonly startTime: string;

	/**
	 * Store the orbit angle elapsed since the anchor.
	 */
	readonly orbitAngle: Angle;

	/**
	 * Store the signed elapsed time from the anchor.
	 */
	readonly elapsed: Duration;

	/**
	 * Store the fixed daily orbit period.
	 */
	readonly orbitPeriod: Duration;
};

/** Configure source-owned executable packing for one distant-Sun CPU field. */
type DistantSunFieldPackingDefinition = Readonly<{
	/** Identify this value. */
	id: string;
	/** Store the direction count. */
	directionCount: number;
	/** Store the position count. */
	positionCount: number;
	/** Store the wavelength count. */
	wavelengthCount: number;
}>;

/** Describe source-owned executable packing for one distant-Sun CPU field. */
interface DistantSunFieldPacking extends DirectionalSpectralFieldPacking {
	/** Identify the contract kind. */
	readonly kind: "distant-sun-field-packing";
	/** Identify this value. */
	readonly id: string;
	/** Store the executable direction extent. */
	readonly directionCount: number;
	/** Store the executable position extent. */
	readonly positionCount: number;
	/** Store the executable wavelength extent. */
	readonly wavelengthCount: number;
	/**
	 * Coordinates at.
	 *
	 * @param offset - Supplies the offset.
	 * @returns The coordinates at result.
	 */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Configure one coherent executable distant-Sun construction-domain selection. */
type DistantSunConstructionDomainSelectionDefinition = Readonly<{
	/** Identify the exact position/direction/packing selection. */
	readonly id: string;
	/** Supply executable spherical native position facts. */
	readonly positionDomainOwner: SphericalNativePositionDomain;
	/** Supply incoming-radiance direction metadata. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;
	/** Supply executable incoming-radiance unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Supply one executable quadrature weight per incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Supply executable cubed-sphere outgoing facts. */
	readonly outgoingDirectionDomainOwner: CubedSphereDirectionDomain;
	/** Supply the exact spectral basis that determines field channel count. */
	readonly spectralBasis: SpectralBasis;
	/** Identify the incoming-radiance field packing. */
	readonly radiancePackingId: string;
	/** Identify the outgoing-scattering field packing. */
	readonly scatteringDensityPackingId: string;
}>;

/** Select one executable production lattice for distant-Sun construction. */
interface DistantSunConstructionDomainSelection
	extends CacheConstructionDomains {
	/** Identify the contract kind. */
	readonly kind: "distant-sun-construction-domain-selection";
	/** Identify this exact position/direction/packing selection. */
	readonly id: string;
	/** Store the selected physical position-domain metadata. */
	readonly positionDomain: PositionDomainDescriptor;
	/** Store the selected executable position nodes. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Store the selected position extent. */
	readonly positionCount: number;
	/** Store the executable ground radius. */
	readonly bottomRadius: Distance;
	/** Store the executable atmosphere-top radius. */
	readonly topRadius: Distance;
	/** Store the incoming-radiance direction-domain metadata. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable incoming-radiance unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Store one solid-angle integration weight per incoming direction. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Store the incoming-radiance direction extent. */
	readonly incomingDirectionCount: number;
	/** Store the outgoing-scattering direction-domain metadata. */
	readonly outgoingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable outgoing-scattering unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Store the outgoing-scattering direction extent. */
	readonly outgoingDirectionCount: number;
	/** Store the selected positive-axis face-center indices. */
	readonly outgoingPositiveFaceCenterIndices: Readonly<{
		readonly positiveX: number;
		readonly positiveY: number;
		readonly positiveZ: number;
	}>;
	/** Store the executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Store the executable spectral channel extent. */
	readonly spectralChannelCount: number;
	/** Store executable incoming-radiance field packing. */
	readonly radiancePacking: DistantSunFieldPacking;
	/** Store executable outgoing-scattering field packing. */
	readonly scatteringDensityPacking: DistantSunFieldPacking;
	/**
	 * Resolve one source-local outgoing direction into selected construction
	 * taps.
	 */
	resolveOutgoingDirectionStencil(
		direction: UnitVector3,
	): ScatteringCacheDirectionStencil;
}

/** Configure one pure distant-Sun CPU field. */
type DistantSunCpuPureFieldDefinition = Readonly<{
	/** Identify this value. */
	id: string;
	/** Store the order. */
	order: number;
	/** Identify the value provenance. */
	provenanceIdentity?: string;
	/** Select an executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
}>;

/** Configure one cumulative distant-Sun CPU scattering field. */
type DistantSunCpuCumulativeFieldDefinition = Readonly<{
	/** Identify this value. */
	id: string;
	/** Include internal through-3 targets without making N=3 publishable. */
	cumulativeThroughOrder: number;
	/** Identify the value provenance. */
	provenanceIdentity?: string;
	/** Select an executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
}>;

/** Supply normalized metadata to the private distant-Sun CPU field factory. */
type DistantSunCpuFieldBuildDefinition = Readonly<{
	/** Identify the field. */
	id: string;
	/** Identify the physical field quantity. */
	quantity: "spectral-radiance-density" | "spectral-scattering-density";
	/** Identify the physical field unit. */
	units: "W m^-2 sr^-1 nm^-1" | "W m^-3 sr^-1 nm^-1";
	/** Identify how the physical direction domain is used. */
	directionRole: "incoming-radiance" | "outgoing-scattering-density";
	/** Store the field's physical direction domain. */
	directionDomain: DirectionDomainDescriptor;
	/** Store the source-owned executable field packing. */
	packing: DistantSunFieldPacking;
	/** Store the pure or cumulative scattering order. */
	order: SpectralFieldOrderDefinition;
	/** Identify the field provenance when it differs from the production default. */
	provenanceIdentity?: string;
	/** Store the executable domain selection accepted by the public factory. */
	domainSelection: DistantSunConstructionDomainSelection;
}>;

/**
 * Describe the atmosphere surface required to build distant-Sun primary
 * scattering density.
 */
type DistantSunPrimaryScatteringAtmosphere = Pick<
	AtmosphereModel,
	"describe" | "sampleMedium" | "integrateOpticalDepth" | "samplePhase"
> & Readonly<{
	/** Store the atmosphere spectral basis aligned to its spectral outputs. */
	readonly spectralBasis: SpectralBasis;
}>;

/**
 * Describe the geometry surface required to reconstruct distant-Sun primary
 * scattering density over the selected position domain.
 */
type DistantSunPrimaryScatteringGeometry = Pick<
	GeometryModel,
	| "describe"
	| "resolveAtmosphereCoordinate"
	| "resolveAtmospherePath"
> & Readonly<{
	/** Resolve one native altitude and source direction into a physical ray. */
	resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;
}>;

/**
 * Describe the distant atmospheric source surface required to build primary
 * scattering density.
 */
type DistantSunPrimaryScatteringLightSource = Pick<
	LightSourceModel,
	"describe" | "sampleDirectLighting" | "resolveSourcePathLimit"
>;

/** Configure one synchronous distant-Sun pure-J1 CPU construction. */
type DistantSunPrimaryScatteringDensityBuildRequest = Readonly<{
	/** Supply the wavelength-aligned physical atmosphere. */
	atmosphere: DistantSunPrimaryScatteringAtmosphere;
	/** Supply spherical geometry that reconstructs native altitude nodes. */
	geometry: DistantSunPrimaryScatteringGeometry;
	/** Supply distant-source direction and path policy. */
	lightSource: DistantSunPrimaryScatteringLightSource;
	/** Supply the native typed production profile; omitted selects the default. */
	profile?: NativeProductionProfile;
	/** Override the pure-J1 field identity. */
	id?: string;
	/** Override the field provenance identity. */
	provenanceIdentity?: string;
	/** Select an executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
}>;

/** Store normalized local-Sun endpoint lighting facts. */
type LocalSunEndpointLightingFacts = Readonly<{
	/** Store the physical direct-lighting sample. */
	directLighting: DirectLightingSample;
	/** Store source-owned sample metadata. */
	metadata: Readonly<Record<string, unknown>>;
	/** Store incident scaling at the observer. */
	observerIncidentScale: number;
	/** Store the accepted scene-light calibration scalar. */
	calibrationScalar: number;
	/** Store accepted ambient intensity bounds. */
	ambientIntensityRange: Readonly<{
		/** Store the minimum ambient intensity. */
		min: number;
		/** Store the maximum ambient intensity. */
		max: number;
	}>;
	/** Store the unit-bearing ambient light scale. */
	ambientLightScale: Dimensionless;
	/** Identify the endpoint scene-light scaling policy. */
	endpointSceneLightScalePolicy: "endpoint-material-shading" | "observer-incident-scale";
	/** Store the resulting endpoint incident scale. */
	endpointSceneIncidentScale: number;
	/** Store the resolved ambient intensity. */
	ambientIntensity: number;
}>;

/** Define executable scalar storage for one local-Sun field. */
type LocalSunFieldPackingDefinition = Readonly<{
	/** Identify the packing. */
	id: string;
	/** Store direction count. */
	directionCount: number;
	/** Store flattened position count. */
	positionCount: number;
	/** Store spectral channel count. */
	wavelengthCount: number;
}>;

/** Describe executable local-Sun field packing. */
interface LocalSunFieldPacking extends DirectionalSpectralFieldPacking {
	/** Identify local-Sun packing. */
	readonly kind: "local-sun-field-packing";
	/** Identify this packing. */
	readonly id: string;
	/** Store direction count. */
	readonly directionCount: number;
	/** Store position count. */
	readonly positionCount: number;
	/** Store wavelength count. */
	readonly wavelengthCount: number;
	/** Store scalar count. */
	readonly scalarCount: number;
	/** Store matching readonly layout metadata. */
	readonly layout: DenseScalarArrayLayoutDescriptor;
	/** Recover logical coordinates from an offset. */
	coordinatesAt(offset: number): DirectionalSpectralFieldCoordinates;
}

/** Describe geometry's executable flattened z-by-rho position owner. */
type LocalSunPositionDomainOwner = Readonly<{
	/** Store declarative position-domain identity. */
	descriptor: PositionDomainDescriptor;
	/** Store z-major, rho-fast flattened nodes. */
	nodes: readonly PositionDomainNode[];
	/** Store ordered altitude nodes. */
	zNodes: readonly Distance[];
	/** Store ordered radial nodes. */
	rhoNodes: readonly Distance[];
	/** Store altitude-node count. */
	zCount: number;
	/** Store radial-node count. */
	rhoCount: number;
	/** Store flattened node count. */
	count: number;
}>;

/** Supply one local-Sun construction-domain selection. */
type LocalSunConstructionDomainSelectionDefinition = Readonly<{
	/** Identify the coherent domain selection. */
	id: string;
	/** Supply geometry's executable z-by-rho position owner. */
	positionDomainOwner: LocalSunPositionDomainOwner;
	/** Supply executable outgoing cubed-sphere mapping. */
	outgoingDirectionDomainOwner: CubedSphereDirectionDomain;
	/** Supply the spectral basis. */
	spectralBasis: SpectralBasis;
	/** Identify incoming-radiance packing. */
	radiancePackingId: string;
	/** Identify outgoing-density packing. */
	scatteringDensityPackingId: string;
}>;

/** Describe one coherent executable local-Sun domain selection. */
interface LocalSunConstructionDomainSelection {
	/** Identify this owner contract. */
	readonly kind: "local-sun-construction-domain-selection";
	/** Identify the coherent domain selection. */
	readonly id: string;
	/** Store declarative position-domain metadata. */
	readonly positionDomain: PositionDomainDescriptor;
	/** Store executable z-major, rho-fast flattened positions. */
	readonly positionNodes: readonly PositionDomainNode[];
	/** Store executable altitude nodes. */
	readonly zNodes: readonly Distance[];
	/** Store executable radial nodes. */
	readonly rhoNodes: readonly Distance[];
	/** Store the altitude-node count. */
	readonly zCount: number;
	/** Store the radial-node count. */
	readonly rhoCount: number;
	/** Store the flattened position count. */
	readonly positionCount: number;
	/** Store the executable spectral basis. */
	readonly spectralBasis: SpectralBasis;
	/** Store the executable spectral channel count. */
	readonly spectralChannelCount: number;
	/** Store declarative incoming-direction metadata. */
	readonly incomingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable paired-Fibonacci-34 unit vectors. */
	readonly incomingUnitVectors: readonly UnitVector3[];
	/** Store executable paired-Fibonacci-34 solid-angle weights. */
	readonly incomingIntegrationWeights: SolidAngleWeights;
	/** Store the executable incoming-direction count. */
	readonly incomingDirectionCount: number;
	/** Store declarative outgoing-direction metadata. */
	readonly outgoingDirectionDomain: DirectionDomainDescriptor;
	/** Store executable cubed-sphere outgoing unit vectors. */
	readonly outgoingUnitVectors: readonly UnitVector3[];
	/** Store the executable outgoing-direction count. */
	readonly outgoingDirectionCount: number;
	/** Store executable positive-axis face-center addresses. */
	readonly outgoingPositiveFaceCenterIndices:
		CubedSpherePositiveFaceCenterIndices;
	/** Store executable incoming-radiance packing. */
	readonly radiancePacking: LocalSunFieldPacking;
	/** Store executable outgoing scattering-density packing. */
	readonly scatteringDensityPacking: LocalSunFieldPacking;
	/** Resolve one source-local outgoing direction into W-domain taps. */
	resolveOutgoingDirectionStencil(
		direction: UnitVector3,
	): ScatteringCacheDirectionStencil;
}

/** Supply optional convergence-domain overrides. */
type LocalSunConstructionDomainGeometryOptions = Readonly<{
	/** Override altitude-node count. */
	zCount?: number;
	/** Override radial-node count. */
	rhoCount?: number;
	/** Override selection id. */
	id?: string;
	/** Override outgoing owner. */
	outgoingDirectionDomainOwner?: CubedSphereDirectionDomain;
	/** Override spectral basis. */
	spectralBasis?: SpectralBasis;
	/** Override radiance packing id. */
	radiancePackingId?: string;
	/** Override density packing id. */
	scatteringDensityPackingId?: string;
}>;

/** Describe geometry capable of constructing the local position domain. */
type LocalSunConstructionDomainGeometry = Readonly<{
	/** Create geometry-owned z-by-rho nodes. */
	createLocalSunCachePositionDomain(
		request?: Readonly<{ zCount?: number; rhoCount?: number }>,
	): LocalSunPositionDomainOwner;
}>;

/** Supply the flat geometry capabilities required by local-Sun GPU construction. */
type LocalSunCacheBuildGeometry =
	GeometryModel
	& CacheBuildContributor
	& LocalSunConstructionDomainGeometry
	& Readonly<{
		/** Expose accepted flat physical configuration to the source module. */
		configuration: FlatEarthGeometryConfiguration;
		/** Pack position-dependent local transport taps. */
		createTransportData(
			request: FlatCacheTransportDataRequest,
		): CacheTransportData;
	}>;

/** Supply the local source contribution with privately owned shell facts. */
type LocalSunCacheBuildSource =
	CacheBuildContributor
	& Readonly<{
		/** Expose normalized physical source facts to trusted orchestration. */
		configuration: LocalSunLightSourceConfiguration;
		/** Report source facts, uploads, packed transport, and executor storage. */
		createResourceReport(
			plan: LocalSunCachePlan,
			diagnostics: CacheBuildDiagnostics,
		): LocalSunCacheResourceReport;
	}>;

/** Report source-owned logical payloads attached to a local build plan. */
type LocalSunCachePlanResourceFacts = Readonly<{
	/** Report one reused N4 transport payload, or zero for N1/N2. */
	readonly packedTransportData: UnitValue<"bytes">;
}>;

/** Extend the generic executable graph with local source resource facts. */
type LocalSunCachePlan = CacheBuildPlan & Readonly<{
	/** Carry typed resource facts without reconstructing module bindings. */
	readonly resources: LocalSunCachePlanResourceFacts;
}>;

/** Report actual local-Sun construction and completed-cache payloads. */
type LocalSunCacheResourceReport = Readonly<{
	/** Report retained binary64 source facts. */
	readonly sourceFacts: LocalSunShellFactResourceUsage;
	/** Report the primary-J1 boundary texture payload. */
	readonly boundaryTexture: UnitValue<"bytes">;
	/** Report one logical N4 packed-transport payload, or zero for N1/N2. */
	readonly packedTransportData: UnitValue<"bytes">;
	/** Report observed executor field and packed-data peaks and residency. */
	readonly executor: CacheBuildMemoryDiagnostics;
}>;

/** Supply physical owners needed to derive one local-Sun GPU build graph. */
type LocalSunCacheBuildPlanRequest = Readonly<{
	/** Supply the source-owned primary programs and private shell facts. */
	source: LocalSunCacheBuildSource;
	/** Supply medium, phase, extinction, and transmittance programs. */
	atmosphere: AtmosphereModel & CacheBuildContributor;
	/** Supply flat positions, frames, bounds, directions, and transport data. */
	geometry: LocalSunCacheBuildGeometry;
	/** Supply an optional reflective boundary; omission selects black ground. */
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
	/** Select the supported requested N1, N2, or N4 graph. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Override the production lattice only for an internal diagnostic build. */
	domainSelection?: LocalSunConstructionDomainSelection;
}>;

/** Supply one local-Sun pure field definition. */
type LocalSunCpuPureFieldDefinition = Readonly<{
	/** Identify the field. */
	id: string;
	/** Store pure scattering order. */
	order: number;
	/** Override algorithm provenance. */
	provenanceIdentity?: string;
	/** Supply coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Supply one local-Sun cumulative field definition. */
type LocalSunCpuCumulativeFieldDefinition = Readonly<{
	/** Identify the field. */
	id: string;
	/** Store cumulative through-order. */
	cumulativeThroughOrder: number;
	/** Override algorithm provenance. */
	provenanceIdentity?: string;
	/** Supply coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Supply normalized metadata for one local-Sun field allocation. */
type LocalSunCpuFieldBuildDefinition = Readonly<{
	/** Identify the allocated field. */
	id: string;
	/** Identify the stored spectral quantity. */
	quantity:
		"spectral-radiance-density"
		| "spectral-scattering-density";
	/** Identify the stored canonical units. */
	units:
		"W m^-2 sr^-1 nm^-1"
		| "W m^-3 sr^-1 nm^-1";
	/** Identify the field direction role. */
	directionRole:
		"incoming-radiance"
		| "outgoing-scattering-density";
	/** Retain declarative direction metadata. */
	directionDomain: DirectionDomainDescriptor;
	/** Supply executable local field packing. */
	packing: LocalSunFieldPacking;
	/** Identify the pure or cumulative order. */
	order: SpectralFieldOrderDefinition;
	/** Override field algorithm provenance. */
	provenanceIdentity?: string;
	/** Supply coherent executable domains. */
	domainSelection: LocalSunConstructionDomainSelection;
}>;

/** Express one local source-frame direction through executable geometry. */
type LocalSunPhysicalDirectionGeometry = Readonly<{
	/** Express one local cache direction at its physical position. */
	expressPhysicalScatteringCacheDirection(
		request: FlatScatteringCacheFramedDirectionRequest,
	): UnitVector3;
}>;

/** Resolve local construction taps through explicit executable z/rho axes. */
type LocalSunConstructionPositionLookupGeometry = Readonly<{
	/** Resolve one selected local construction-position stencil. */
	resolveScatteringCacheConstructionPositionStencil(
		request: FlatScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;
}>;

/** Describe flat geometry required by local-Sun primary J1 construction. */
type LocalSunPrimaryScatteringDensityGeometry = Pick<
	GeometryModel,
	| "resolveAtmosphereCoordinate"
	| "resolveAtmospherePath"
	| "resolveSourceRelativePosition"
> & LocalSunPhysicalDirectionGeometry;

/** Supply local-Sun primary J1 construction. */
type LocalSunPrimaryScatteringDensityBuildRequest = Readonly<{
	/** Supply atmosphere medium and transmittance operations. */
	atmosphere: AtmosphereModel;
	/** Supply flat source-relative geometry operations. */
	geometry: LocalSunPrimaryScatteringDensityGeometry;
	/** Supply construction-only shell-held direct lighting. */
	lightSource: LightSourceModel;
	/** Identify the executable spectral channels. */
	spectralBasis: SpectralBasis;
	/** Select source-path transmittance intervals. */
	sourceTransmittanceIntervalCount: number;
	/** Supply executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Override the allocated pure-J1 identity. */
	id?: string;
	/** Override the primary-J1 provenance identity. */
	provenanceIdentity?: string;
	/** Observe bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Describe flat geometry required by continuous direct-primary L1. */
type LocalSunPrimaryRadianceGeometry =
	LocalSunPhysicalDirectionGeometry & Readonly<{
	/** Resolve one construction ray from an executable cache coordinate. */
	resolveCacheBuildRay(
		coordinate: CacheBuildCoordinate,
	): RaySegment;
}>;

/** Describe the calculator operations required by continuous L1. */
type LocalSunPrimaryRadianceCalculator = Pick<
	SpectralCalculator,
	"buildEndpointTrapezoidPathIntegrationPoints" | "computeDirectRadiance"
>;

/** Supply local-Sun direct-primary L1 construction. */
type LocalSunPrimaryRadianceBuildRequest = Readonly<{
	/** Supply flat construction rays and direction mapping. */
	geometry: LocalSunPrimaryRadianceGeometry;
	/** Supply continuous direct-radiance path integration. */
	calculator: LocalSunPrimaryRadianceCalculator;
	/** Supply executable position, incoming-direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Override the selected construction path interval count. */
	pathIntervalCount?: number;
	/** Override the allocated pure-L1 identity. */
	id?: string;
	/** Override the direct-primary provenance identity. */
	provenanceIdentity?: string;
	/** Observe bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Supply one stored-field local-Sun transport. */
type LocalSunScatteringDensityTransportGeometry =
	PureScatteringDensityTransportGeometry
	& LocalSunPhysicalDirectionGeometry
	& LocalSunConstructionPositionLookupGeometry;

/** Supply one stored-field local-Sun transport. */
type LocalSunScatteringDensityTransportRequest = Readonly<{
	/** Store the sealed pure J2 or J3 input. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Identify the pure stored order being transported. */
	scatteringOrder: 2 | 3;
	/** Supply flat construction and source-frame operations. */
	geometry: LocalSunScatteringDensityTransportGeometry;
	/** Supply atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Supply path quadrature and transmittance calculation. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Supply executable local construction facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Override the selected construction interval count. */
	pathIntervalCount?: number;
	/** Override the allocated pure-radiance identity. */
	id?: string;
	/** Observe bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Describe local geometry required by later-order scattering and reflection. */
type LocalSunLaterOrderScatteringGeometry =
	LaterOrderScatteringGeometry
	& LocalSunPhysicalDirectionGeometry
	& LocalSunConstructionPositionLookupGeometry
	& Pick<
		GeometryModel,
		| "resolveAtmospherePath"
		| "resolveGroundIntersection"
		| "resolveSourceRelativePosition"
	>;

/** Configure local-Sun later-order scattering without reflection. */
type LocalSunLaterOrderScatteringKernelRequest = Readonly<{
	/** Supply flat scattering and optional ground geometry. */
	geometry: LocalSunLaterOrderScatteringGeometry;
	/** Supply medium, phase, and transmittance operations. */
	atmosphere: LaterOrderScatteringAtmosphere & AtmosphereModel;
	/** Supply spectral scattering operations. */
	calculator: LaterOrderScatteringCalculator;
	/** Supply executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Identify the pure scattering-density order being constructed. */
	scatteringOrder: 2 | 3 | 4;
	/** Supply pure L(k-2) only when reflective higher-order ground needs it. */
	groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null;
	/** Supply the selected boundary or canonical omission. */
	groundBoundary: GroundBoundary | null;
	/** Supply direct source lighting for reflective J2 only. */
	lightSource: LightSourceModel;
	/** Select source-path transmittance intervals for ground reflection. */
	sourceTransmittanceIntervalCount: number;
	/** Observe bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Configure inherited local-Sun reflective-ground scattering. */
type LocalSunReflectiveGroundScatteringKernelRequest =
	LocalSunLaterOrderScatteringKernelRequest & Readonly<{
		groundBoundary: GroundBoundary;
	}>;

/** Build one pure transported-radiance field. */
type LocalSunCpuTransportedRadianceBuilder = (
	request: Readonly<{
		/** Store the sealed pure J2 or J3 input. */
		scatteringDensity: CpuDirectionalSpectralFieldContract;
		/** Identify the pure stored order being transported. */
		scatteringOrder: 2 | 3;
		/** Identify the allocated pure-radiance output. */
		id: string;
	}>,
) => CpuDirectionalSpectralFieldContract;

/** Supply unchanged local pure-order recurrence operations. */
type LocalSunCpuCacheOperations = Readonly<{
	/** Create one physical pure-order scattering kernel. */
	createScatteringKernel(request: Readonly<{
		/** Identify the pure scattering-density order. */
		scatteringOrder: 2 | 3 | 4;
		/** Supply pure L(k-2) only for reflective higher-order ground. */
		groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null;
	}>): ScatteringOrderKernel;
	/** Build generic stored-field pure L2 or L3. */
	buildTransportedRadiance: LocalSunCpuTransportedRadianceBuilder;
	/** Identify later-order scattering provenance. */
	scatteringProvenanceIdentity: string;
}>;

/** Supply the internal local-Sun CPU cache build. */
type LocalSunCpuCacheBuildRequest = Readonly<{
	/** Supply atmosphere medium, phase, and transmittance operations. */
	atmosphere: AtmosphereModel;
	/** Supply flat construction and cache lookup geometry. */
	geometry: LocalSunCpuCacheGeometry;
	/** Supply construction-only shell-held primary lighting. */
	lightSource: LightSourceModel;
	/** Supply the accepted physical/numerical profile. */
	profile: NativeProductionProfile;
	/** Identify the executable spectral channels. */
	spectralBasis: SpectralBasis;
	/** Select source-path transmittance intervals. */
	sourceTransmittanceIntervalCount: number;
	/** Supply executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Supply spectral transport and scattering operations. */
	calculator: SpectralCalculator;
	/** Identify construction owners and controls. */
	constructionIdentities: ScatteringCacheConstructionIdentitiesDefinition;
	/** Supply the selected boundary or canonical omission. */
	groundBoundary?: GroundBoundary | null;
	/** Select requested N1, N2, or N4 construction. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Override recurrence owners only at the internal diagnostic seam. */
	operations?: LocalSunCpuCacheOperations;
	/** Observe bounded construction progress. */
	onProgress?: CpuCacheBuildProgressCallback;
}>;

/** Supply the configured flat capabilities required by local CPU construction. */
type LocalSunCpuCacheGeometry =
	GeometryModel
	& LocalSunConstructionDomainGeometry
	& PureScatteringDensityTransportGeometry
	& LocalSunPhysicalDirectionGeometry
	& LocalSunConstructionPositionLookupGeometry
	& Readonly<{
		/** Expose geometry's paired source position. */
		configuration: Pick<
			FlatEarthGeometryConfiguration,
			"sourcePosition"
		>;
	}>;

/** Supply physical collaborators to the public local-Sun CPU build. */
type LocalSunCpuCacheRequest = Readonly<{
	/** Supply atmosphere medium, phase, and transmittance operations. */
	atmosphere: AtmosphereModel;
	/** Supply paired flat geometry. */
	geometry: LocalSunCpuCacheGeometry;
	/** Override the native production profile for a scoped build. */
	profile?: NativeProductionProfile;
	/** Identify construction owners and controls. */
	constructionIdentities: ScatteringCacheConstructionIdentitiesDefinition;
	/** Supply the selected boundary or canonical omission. */
	groundBoundary?: GroundBoundary | null;
	/** Select requested N1, N2, or N4 construction. */
	maximumScatteringOrder?: SupportedCacheScatteringOrder;
	/** Override the source-owned count for a scoped CPU diagnostic build. */
	sourceTransmittanceIntervalCount?: number;
}>;

/** Describe one completed local-Sun binary64 build. */
type LocalSunCpuCacheResult = Readonly<{
	/** Identify the requested and completed maximum order. */
	maximumScatteringOrder: SupportedCacheScatteringOrder;
	/** Retain sealed pure J fields in ascending order. */
	pureScatteringDensityByOrder:
		readonly CpuDirectionalSpectralFieldContract[];
	/** Retain sealed pure L fields in ascending order. */
	pureRadianceByOrder:
		readonly CpuDirectionalSpectralFieldContract[];
	/** Store the sealed cumulative J-through-N field. */
	cumulativeScatteringDensity:
		CpuDirectionalSpectralFieldContract;
	/** Describe the completed cache result. */
	descriptor: ScatteringCacheDescriptor;
}>;

/** Store owners captured by local-Sun recurrence callbacks. */
type LocalSunCpuRecurrenceContext = Readonly<{
	/** Retain the accepted public CPU request. */
	request: LocalSunCpuCacheRequest;
	/** Supply spectral transport and scattering operations. */
	calculator: SpectralCalculator;
	/** Supply executable position, direction, basis, and packing facts. */
	domainSelection: LocalSunConstructionDomainSelection;
	/** Select source-path transmittance intervals. */
	sourceTransmittanceIntervalCount: number;
}>;

/** Describe the Three object surface used by distant-source lighting. */
type DistantThreeObject = {
	/** Store the renderer object name. */
	name: string;
	/** Store the mutable renderer position interface. */
	position: {
		/**
		 * Assign renderer position coordinates.
		 *
		 * @param coordinates - Supplies renderer coordinates.
		 * @returns No return value.
		 */
		set(...coordinates: number[]): void;
	};
	/** Store renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
};

/** Describe the Three directional-light surface used by a distant source. */
type DistantThreeDirectionalLight = DistantThreeObject & {
	/** Store the directional-light target. */
	target: DistantThreeObject;
	/** Indicate whether this light casts renderer shadows. */
	castShadow: boolean;
	/** Store optional renderer shadow configuration. */
	shadow?: {
		/** Store optional shadow-map dimensions. */
		mapSize?: {
			/** Store the shadow-map width. */
			width: number;
			/** Store the shadow-map height. */
			height: number;
		};
		/** Store optional directional shadow-camera state. */
		camera?: {
			/** Store the camera left plane. */
			left: number;
			/** Store the camera right plane. */
			right: number;
			/** Store the camera top plane. */
			top: number;
			/** Store the camera bottom plane. */
			bottom: number;
			/** Store the camera near plane. */
			near: number;
			/** Store the camera far plane. */
			far: number;
			/**
			 * Rebuild renderer projection state after camera changes.
			 *
			 * @returns No return value.
			 */
			updateProjectionMatrix?(): void;
		};
		/** Store renderer shadow bias. */
		bias: number;
		/** Store renderer shadow normal bias. */
		normalBias: number;
		/** Store renderer shadow blur radius. */
		radius: number;
		/** Store renderer shadow intensity. */
		intensity: number;
	};
};

/** Describe the Three constructors used by distant-source lighting. */
type DistantThreeNamespace = {
	/** Construct a renderer object. */
	Object3D: new () => DistantThreeObject;
	/** Construct a renderer directional light. */
	DirectionalLight: new (
		color: number,
		intensity: number,
	) => DistantThreeDirectionalLight;
	/** Construct a renderer ambient light. */
	AmbientLight: new (color: number, intensity: number) => DistantThreeObject;
};

/** Describe the common Three light surface used by local-source lighting. */
type LocalThreeLight = {
	/** Store the renderer light name. */
	name: string;
	/** Store renderer light intensity. */
	intensity: number;
	/** Store the mutable renderer position interface. */
	position: {
		/**
		 * Assign renderer position coordinates.
		 *
		 * @param coordinates - Supplies renderer coordinates.
		 * @returns No return value.
		 */
		set(...coordinates: number[]): void;
	};
	/** Store renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
	/** Indicate whether this light casts renderer shadows. */
	castShadow?: boolean;
};

/** Describe the Three object surface used by local-source lighting. */
type LocalThreeObject = {
	/** Store the renderer object name. */
	name: string;
	/** Store the mutable renderer position interface. */
	position: {
		/**
		 * Assign renderer position coordinates.
		 *
		 * @param coordinates - Supplies renderer coordinates.
		 * @returns No return value.
		 */
		set(...coordinates: number[]): void;
	};
	/** Store renderer-neutral Algorithm32 metadata. */
	userData: Record<string, unknown>;
};

/** Describe the Three directional-light surface used by a local source. */
type LocalThreeDirectionalLight = LocalThreeLight & {
	/** Store the directional-light target. */
	target: LocalThreeObject;
	/** Store optional renderer shadow configuration. */
	shadow?: {
		/** Store optional shadow-map dimensions. */
		mapSize?: {
			/** Store the shadow-map width. */
			width: number;
			/** Store the shadow-map height. */
			height: number;
		};
		/** Store optional directional shadow-camera state. */
		camera?: {
			/** Store the camera left plane. */
			left: number;
			/** Store the camera right plane. */
			right: number;
			/** Store the camera top plane. */
			top: number;
			/** Store the camera bottom plane. */
			bottom: number;
			/** Store the camera near plane. */
			near: number;
			/** Store the camera far plane. */
			far: number;
			/**
			 * Rebuild renderer projection state after camera changes.
			 *
			 * @returns No return value.
			 */
			updateProjectionMatrix?(): void;
		};
		/** Store renderer shadow bias. */
		bias: number;
		/** Store renderer shadow normal bias. */
		normalBias: number;
		/** Store renderer shadow blur radius. */
		radius: number;
		/** Store renderer shadow intensity. */
		intensity: number;
	};
};

/** Describe the Three constructors used by local-source lighting. */
type LocalThreeNamespace = {
	/** Construct a renderer object. */
	Object3D: new () => LocalThreeObject;
	/** Construct a renderer ambient light. */
	AmbientLight: new (color: number, intensity: number) => LocalThreeLight;
	/** Construct a renderer point light. */
	PointLight: new (
		color: number,
		intensity: number,
		distance?: number,
		decay?: number,
	) => LocalThreeLight;
	/** Construct a renderer directional light. */
	DirectionalLight: new (
		color: number,
		intensity: number,
	) => LocalThreeDirectionalLight;
};

/** Describe the mutable Three object surface configured for source shadows. */
type ThreeShadowNode = {
	/** Indicate whether this object casts renderer shadows. */
	castShadow?: boolean;
	/** Indicate whether this object receives renderer shadows. */
	receiveShadow?: boolean;
	/** Store renderer-neutral Algorithm32 metadata. */
	userData?: Record<string, unknown>;
	/** Store the optional renderer layer interface. */
	layers?: {
		/**
		 * Enable one renderer layer.
		 *
		 * @param layerIndex - Supplies the renderer layer index.
		 * @returns No return value.
		 */
		enable?(layerIndex: number): void;
	};
	/**
	 * Traverse this object and its descendants.
	 *
	 * @param callback - Supplies the node visitor.
	 * @returns No return value.
	 */
	traverse?(callback: (node: unknown) => void): void;
};

/**
 * Describe spherical geometry required by the source-owned direct L1 build.
 */
type DistantSunPrimaryRadianceGeometry =
	DistantSunPrimaryScatteringGeometry & Pick<
		GeometryModel,
		"resolveSourceRelativePosition"
	> & Readonly<{
		/** Express one executable Fibonacci radiance direction in physical space. */
		expressPhysicalIncomingRadianceDirection(
			cacheDirection: UnitVector3,
		): UnitVector3;
	}>;

/**
 * Describe the canonical calculator surface shared by direct L1 and the
 * later-order recurrence.
 */
type DistantSunPrimaryRadianceCalculator = Pick<
	SpectralCalculator,
	"buildEndpointTrapezoidPathIntegrationPoints" | "computeDirectRadiance"
>;

/** Configure one synchronous distant-Sun pure-L1 CPU construction. */
type DistantSunPrimaryRadianceBuildRequest = Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	"geometry"
> & Readonly<{
	/** Supply spherical geometry and its source-relative direction mapping. */
	geometry: DistantSunPrimaryRadianceGeometry;
	/** Supply the source-created canonical spectral calculator. */
	calculator: DistantSunPrimaryRadianceCalculator;
	/** Supply the accepted executable path-integration interval count. */
	transportIntervalCount: number;
}>;

/** Supply physical inputs used to create the one source-owned calculator. */
type DistantSunCpuSpectralCalculatorRequest = Omit<
	DistantSunPrimaryRadianceBuildRequest,
	"calculator" | "id" | "provenanceIdentity"
>;

/**
 * Supply a distant source's direct CPU primary-radiance build request.
 *
 * The source instance supplies itself; this request contains only the
 * atmosphere, spherical geometry, selected native profile, and field identity.
 */
type DistantSunCpuPrimaryRadianceFieldRequest = Omit<
	DistantSunPrimaryRadianceBuildRequest,
	"lightSource" | "calculator" | "transportIntervalCount"
> & Readonly<{
	/**
	 * Select an offline executable interval count; omission retains the
	 * production count of 15.
	 */
	transportIntervalCount?: number;
}>;

/** Describe spherical distant-Sun geometry used by later-order scattering. */
type DistantSunLaterOrderScatteringGeometry =
	LaterOrderScatteringGeometry & Readonly<{
		/** Reconstruct one executable native position through geometry-owned facts. */
		resolveScatteringCacheConstructionPosition(
			positionNode: PositionDomainNode,
		): Position;
		/** Express one executable Fibonacci incoming direction in physical space. */
		expressPhysicalIncomingRadianceDirection(
			cacheDirection: UnitVector3,
		): UnitVector3;
		/** Express one executable W27 outgoing direction in physical space. */
		expressPhysicalOutgoingScatteringDirection(
			cacheDirection: UnitVector3,
		): UnitVector3;
	}>;

/** Add geometry operations required only by reflective-ground scattering. */
type DistantSunGroundReflectionGeometry =
	DistantSunLaterOrderScatteringGeometry & Pick<
		GeometryModel,
		| "resolveAtmospherePath"
		| "resolveGroundIntersection"
		| "resolveScatteringCacheConstructionPositionStencil"
	>;

/** Add atmosphere transport required only by reflective-ground scattering. */
type DistantSunGroundReflectionAtmosphere =
	LaterOrderScatteringAtmosphere & Pick<AtmosphereModel, "integrateOpticalDepth">;

/** Describe direct-source operations used by the J2 ground term. */
type DistantSunGroundReflectionLightSource = Pick<
	LightSourceModel,
	"sampleDirectLighting" | "resolveSourcePathLimit"
>;

/** Configure physical collaborators shared by every ground mode. */
type DistantSunLaterOrderScatteringKernelConfigurationBase = Readonly<{
	/** Select executable domains; omission retains production Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
	/** Store spherical native-domain geometry. */
	geometry: DistantSunLaterOrderScatteringGeometry;
	/** Store atmosphere-owned medium and phase sampling. */
	atmosphere: LaterOrderScatteringAtmosphere;
	/** Store phase-weighted spectral coefficient calculation. */
	calculator: LaterOrderScatteringCalculator;
	/** Supply the executable physical direction from a sample toward the source. */
	directionToLight: UnitVector3;
	/** Store pure L(k-2) when the requested order can illuminate ground. */
	groundIlluminationRadiance?: CpuDirectionalSpectralFieldContract | null;
}>;

/** Configure the exact omitted-boundary path. */
type DistantSunBlackGroundScatteringKernelConfiguration =
	DistantSunLaterOrderScatteringKernelConfigurationBase & Readonly<{
		/** Omit reflection while preserving the canonical black path. */
		groundBoundary?: null;
	}>;

/** Configure source-owned reflective-ground transport. */
type DistantSunReflectiveGroundScatteringKernelConfiguration = Omit<
	DistantSunLaterOrderScatteringKernelConfigurationBase,
	"geometry" | "atmosphere"
> & Readonly<{
	/** Supply geometry-owned ground hits and atmosphere paths. */
	geometry: DistantSunGroundReflectionGeometry;
	/** Supply atmosphere-owned optical-depth integration. */
	atmosphere: DistantSunGroundReflectionAtmosphere;
	/** Supply the configured BRDF owner. */
	groundBoundary: GroundBoundary;
	/** Supply the distant source for direct J2 illumination. */
	lightSource: DistantSunGroundReflectionLightSource;
	/** Store the selected source/hit transport interval count. */
	sourceTransmittanceIntervalCount: number;
}>;

/** Configure one distant-Sun later-order kernel independently of its order. */
type DistantSunLaterOrderScatteringKernelConfiguration =
	| DistantSunBlackGroundScatteringKernelConfiguration
	| DistantSunReflectiveGroundScatteringKernelConfiguration;

/** Configure an omitted-boundary distant-Sun later-order kernel. */
type DistantSunBlackGroundScatteringKernelRequest =
	DistantSunBlackGroundScatteringKernelConfiguration & Readonly<{
		/** Identify the pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4;
	}>;

/** Configure a reflective-ground distant-Sun later-order kernel. */
type DistantSunReflectiveGroundScatteringKernelRequest =
	DistantSunReflectiveGroundScatteringKernelConfiguration & Readonly<{
		/** Identify the pure Jk order being constructed. */
		scatteringOrder: 2 | 3 | 4;
	}>;

/** Configure the source-owned distant-Sun later-order scattering adapter. */
type DistantSunLaterOrderScatteringKernelRequest =
	| DistantSunBlackGroundScatteringKernelRequest
	| DistantSunReflectiveGroundScatteringKernelRequest;

/** Store source-specific facts accepted once at the adapter boundary. */
type DistantSunLaterOrderScatteringContext = Readonly<{
	/** Store the accepted adapter request. */
	request: DistantSunLaterOrderScatteringKernelRequest;
	/** Store the accepted executable position and direction domains. */
	domainSelection: DistantSunConstructionDomainSelection;
}>;

/**
 * Describe spherical distant-Sun geometry required by stored-field
 * scattering-density transport.
 */
type DistantSunScatteringDensityTransportGeometry =
	PureScatteringDensityTransportGeometry & Readonly<{
		/** Express one executable Fibonacci radiance direction in physical space. */
		expressPhysicalIncomingRadianceDirection(
			cacheDirection: UnitVector3,
		): UnitVector3;
		/** Resolve construction-time position taps from geometry-owned facts. */
		resolveScatteringCacheConstructionPositionStencil(
			request: ScatteringCachePositionStencilRequest,
		): ScatteringCachePositionStencil;
	}>;

/** Supply one source-owned distant-Sun stored-field transport build. */
type DistantSunScatteringDensityTransportRequest = Readonly<{
	/** Store the sealed native-48/W27/native-15 pure Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Identify the diagnostic J1 or production J2/J3 order being transported. */
	scatteringOrder: 1 | 2 | 3;
	/** Store spherical construction and source-frame operations. */
	geometry: DistantSunScatteringDensityTransportGeometry;
	/** Store atmosphere medium sampling. */
	atmosphere: PureScatteringDensityTransportAtmosphere;
	/** Store endpoint trapezoid and transmittance operations. */
	calculator: PureScatteringDensityTransportCalculator;
	/** Select an executable production domain; omission retains Native48/W27. */
	domainSelection?: DistantSunConstructionDomainSelection;
	/** Supply the accepted executable path-integration interval count. */
	transportIntervalCount: number;
	/** Override the allocated pure Lk field identity. */
	id?: string;
}>;

/**
 * Build one source-owned transported-radiance order from sealed pure
 * scattering density. Production binds this callback to the distant-Sun
 * physical transport adapter; focused orchestration tests may supply a
 * deterministic implementation.
 */
type DistantSunCpuTransportedRadianceBuilder = (
request: Readonly<{
	/** Store the sealed pure Jk input field. */
	scatteringDensity: CpuDirectionalSpectralFieldContract;
	/** Identify the pure J2 or J3 order being transported. */
	scatteringOrder: 2 | 3;
	/** Store the source-owned boundary-dependent Lk field id. */
	id: string;
}>,
) => CpuDirectionalSpectralFieldContract;

/** Supply the recurrence operations used after source-specific J1 and L1. */
type DistantSunCpuCacheOperations = Readonly<{
/** Create each pure L(k-1) -> Jk scattering-density kernel synchronously. */
createScatteringKernel(request: Readonly<{
	/** Identify the pure Jk order being constructed. */
	scatteringOrder: 2 | 3 | 4;
	/** Store pure L(k-2), or null for J2. */
	groundIlluminationRadiance: CpuDirectionalSpectralFieldContract | null;
}>): ScatteringOrderKernel;
/** Identify the numerical implementation executed by the supplied kernel. */
scatteringProvenanceIdentity: string;
/** Build J2 -> L2 and J3 -> L3 when the requested graph needs them. */
buildTransportedRadiance?: DistantSunCpuTransportedRadianceBuilder;
}>;

/** Common completed nonresident CPU cache result data. */
type DistantSunCpuCacheResultBase = Readonly<{
/** Store the final sealed cumulative scattering-density field. */
cumulativeScatteringDensity: CpuDirectionalSpectralFieldContract;
/** Describe the completed final cumulative field. */
descriptor: ScatteringCacheDescriptor;
}>;

/** Describe the complete requested N=1 CPU build result. */
type DistantSunCpuCacheResultN1 =
DistantSunCpuCacheResultBase & Readonly<{
	/** Discriminate the requested recurrence graph. */
	maximumScatteringOrder: 1;
	/** Store pure J1 in ascending order. */
	pureScatteringDensityByOrder: readonly [CpuDirectionalSpectralFieldContract];
	/** N=1 constructs no transported-radiance field. */
	pureRadianceByOrder: readonly [];
}>;

/** Describe the complete requested N=2 CPU build result. */
type DistantSunCpuCacheResultN2 =
DistantSunCpuCacheResultBase & Readonly<{
	/** Discriminate the requested recurrence graph. */
	maximumScatteringOrder: 2;
	/** Store pure J1 and J2 in ascending order. */
	pureScatteringDensityByOrder: readonly [
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
	];
	/** Store only direct-primary L1; N=2 constructs no L2. */
	pureRadianceByOrder: readonly [CpuDirectionalSpectralFieldContract];
}>;

/** Describe the complete requested N=4 CPU build result. */
type DistantSunCpuCacheResultN4 =
DistantSunCpuCacheResultBase & Readonly<{
	/** Discriminate the requested recurrence graph. */
	maximumScatteringOrder: 4;
	/** Store pure J1 through J4 in ascending order. */
	pureScatteringDensityByOrder: readonly [
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
	];
	/** Store direct L1 followed by transported L2 and L3; L4 is absent. */
	pureRadianceByOrder: readonly [
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
		CpuDirectionalSpectralFieldContract,
	];
}>;

/** Describe every supported requested distant-Sun CPU build result. */
type DistantSunCpuCacheResult =
| DistantSunCpuCacheResultN1
| DistantSunCpuCacheResultN2
| DistantSunCpuCacheResultN4;

/** Supply physical collaborators and identities shared by every CPU build. */
type DistantSunCpuCacheBuildRequestBase =
Omit<
	DistantSunPrimaryScatteringDensityBuildRequest,
	"id" | "provenanceIdentity"
> & Readonly<{
	/** Identify every transport-relevant physical construction input. */
	constructionIdentities: ScatteringCacheConstructionIdentitiesDefinition;
	/** Supply a configured BRDF owner; omission retains canonical black ground. */
	groundBoundary?: GroundBoundary | null;
	/**
	 * Select an offline executable interval count; omission retains the
	 * production count of 15.
	 */
	transportIntervalCount?: number;
}>;

/** Supply the stronger geometry surface required when direct L1 is built. */
type DistantSunCpuCacheMultipleScatteringBuildRequestBase = Omit<
DistantSunCpuCacheBuildRequestBase,
"geometry"
> & Readonly<{
geometry: DistantSunPrimaryRadianceGeometry;
/** Supply the source-created calculator shared with direct-primary L1. */
calculator: DistantSunPrimaryRadianceCalculator;
}>;

/** Supply one internal source-owned N=1 recurrence request. */
type DistantSunCpuCacheBuildRequestN1 =
DistantSunCpuCacheBuildRequestBase & Readonly<{
	/** Select the J1-only pass graph explicitly. */
	maximumScatteringOrder: 1;
	/** N=1 accepts no unused later-order operation seam. */
	operations?: never;
}>;

/** Supply one internal source-owned N=2 recurrence request. */
type DistantSunCpuCacheBuildRequestN2 =
DistantSunCpuCacheMultipleScatteringBuildRequestBase & Readonly<{
	/** Select the J1, L1, J2 pass graph explicitly. */
	maximumScatteringOrder: 2;
	/** Supply the pure scattering kernel; transport remains unused. */
	operations: DistantSunCpuCacheOperations;
}>;

/** Supply one internal source-owned N=4 recurrence request. */
type DistantSunCpuCacheBuildRequestN4 =
DistantSunCpuCacheMultipleScatteringBuildRequestBase & Readonly<{
	/** Select the J1 through J4 pass graph explicitly. */
	maximumScatteringOrder: 4;
	/** Supply both later-order recurrence operations. */
	operations: DistantSunCpuCacheOperations & Readonly<{
		buildTransportedRadiance: DistantSunCpuTransportedRadianceBuilder;
	}>;
}>;

/** Supply any supported internal source-owned CPU recurrence request. */
type DistantSunCpuCacheBuildRequest =
| DistantSunCpuCacheBuildRequestN1
| DistantSunCpuCacheBuildRequestN2
| DistantSunCpuCacheBuildRequestN4;

/** Physical inputs supplied to the source-owned public N=1 build. */
type DistantSunCpuCacheRequestN1Base = Omit<
DistantSunCpuCacheBuildRequestBase,
"lightSource"
>;

/** Physical inputs supplied to public multiple-scattering builds. */
type DistantSunCpuCacheMultipleScatteringRequestBase = Omit<
DistantSunCpuCacheMultipleScatteringBuildRequestBase,
"lightSource" | "geometry" | "calculator"
> & Readonly<{
geometry:
	DistantSunPrimaryRadianceGeometry
	& DistantSunLaterOrderScatteringGeometry;
}>;

/** Require the explicit profile facts owned by reflective ground. */
type DistantSunReflectiveGroundProfile = Omit<
	NativeProductionProfile,
	"spectral" | "physical"
> & Readonly<{
	/** Store the exact native basis used by the configured boundary. */
	spectral: NativeProductionProfile["spectral"] & Readonly<{
		basis: SpectralBasis;
	}>;
	/** Store the explicitly configured profile-owned albedo. */
	physical: NativePhysicalProfile & Readonly<{
		ground: Readonly<{
			albedo: SpectralReflectancePacket;
		}>;
	}>;
}>;

/** Configure multiple scattering with the exact omitted-black boundary. */
type DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	"groundBoundary"
> & Readonly<{
	/** Omit reflection while preserving the canonical black path. */
	groundBoundary?: null;
}>;

/** Configure multiple scattering with an explicit profile-owned boundary. */
type DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase = Omit<
	DistantSunCpuCacheMultipleScatteringRequestBase,
	"groundBoundary" | "geometry" | "atmosphere" | "profile"
> & Readonly<{
	/** Supply geometry-owned ground hits, position sampling, and paths. */
	geometry:
		DistantSunCpuCacheMultipleScatteringRequestBase["geometry"]
		& DistantSunGroundReflectionGeometry;
	/** Supply atmosphere-owned optical-depth integration. */
	atmosphere:
		DistantSunCpuCacheMultipleScatteringRequestBase["atmosphere"]
		& DistantSunGroundReflectionAtmosphere;
	/** Supply the BRDF owner configured from the same profile albedo. */
	groundBoundary: GroundBoundary;
	/** Supply the explicit profile that owns the boundary albedo. */
	profile: DistantSunReflectiveGroundProfile;
}>;

/** Select an explicit public N=1 build without later-order collaborators. */
type DistantSunCpuCacheRequestN1 =
DistantSunCpuCacheRequestN1Base & Readonly<{
	maximumScatteringOrder: 1;
}>;

/** Select an omitted-black public N=2 build. */
type DistantSunCpuCacheBlackGroundRequestN2 =
	DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase & Readonly<{
		maximumScatteringOrder: 2;
	}>;

/** Select a reflective public N=2 build. */
type DistantSunCpuCacheReflectiveGroundRequestN2 =
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase & Readonly<{
		maximumScatteringOrder: 2;
	}>;

/** Select an explicit public N=2 build. */
type DistantSunCpuCacheRequestN2 =
	| DistantSunCpuCacheBlackGroundRequestN2
	| DistantSunCpuCacheReflectiveGroundRequestN2;

/** Select an omitted-black explicit or default public N=4 build. */
type DistantSunCpuCacheBlackGroundRequestN4 = Omit<
	DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase,
	"geometry"
> & Readonly<{
	maximumScatteringOrder?: 4;
	geometry:
		DistantSunCpuCacheBlackGroundMultipleScatteringRequestBase["geometry"]
		& DistantSunScatteringDensityTransportGeometry;
}>;

/** Select a reflective explicit or default public N=4 build. */
type DistantSunCpuCacheReflectiveGroundRequestN4 = Omit<
	DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase,
	"geometry"
> & Readonly<{
	maximumScatteringOrder?: 4;
	geometry:
		DistantSunCpuCacheReflectiveGroundMultipleScatteringRequestBase["geometry"]
		& DistantSunScatteringDensityTransportGeometry;
}>;

/** Select the explicit or default public N=4 build. */
type DistantSunCpuCacheRequestN4 =
	| DistantSunCpuCacheBlackGroundRequestN4
	| DistantSunCpuCacheReflectiveGroundRequestN4;

/** Supply one public source-owned N=1, N=2, or default-N=4 CPU build. */
type DistantSunCpuCacheRequest =
| DistantSunCpuCacheRequestN1
| DistantSunCpuCacheRequestN2
| DistantSunCpuCacheRequestN4;

/** Store source-owned physical collaborators captured by CPU recurrence methods. */
type DistantSunCpuRecurrenceContext = Readonly<{
	/** Store the accepted public multiple-scattering request. */
	request: DistantSunCpuCacheRequestN2 | DistantSunCpuCacheRequestN4;
	/** Store the accepted executable position and direction domains. */
	domainSelection: DistantSunConstructionDomainSelection;
	/** Store the accepted executable path-integration interval count. */
	transportIntervalCount: number;
	/** Store the source-created shared spectral calculator. */
	calculator: SpectralCalculator;
	/** Store the accepted explicit or omitted-boundary default profile. */
	profile: NativeProductionProfile;
	/** Store the executable physical direction toward the source. */
	directionToLight: UnitVector3;
}>;

/** Supply owners shared by every distant-Sun GPU build plan. */
type DistantSunCacheBuildPlanRequestBase = Readonly<{
	/** Supply the configured distant-source construction contributor. */
	source: CacheBuildContributor & Readonly<{
		configuration: Pick<
			DistantSunLightSourceConfig,
			"directionToLight" | "sourceIrradiance"
		>;
	}>;
	/** Supply the configured atmosphere construction contributor. */
	atmosphere: CacheBuildContributor & Readonly<{
		spectralBasis: SpectralBasis;
	}>;
	/**
	 * Select a scoped construction lattice; omission retains production
	 * Native48/Fibonacci34/W27.
	 */
	domainSelection?: DistantSunConstructionDomainSelection;
	/**
	 * Select direct-plan comparison controls; omission retains the production
	 * order-specific 15-interval controls.
	 */
	constructionControls?: CacheConstructionControlsDescriptor;
	/** Supply an executable reflective boundary; omission retains canonical black. */
	groundBoundary?: (GroundBoundary & CacheBuildContributor) | null;
}>;

/** Supply owners for a plan that stops before stored-field transport. */
type DistantSunCacheBuildPlanRequestN1OrN2 =
	DistantSunCacheBuildPlanRequestBase & Readonly<{
		geometry: CacheBuildContributor;
		maximumScatteringOrder: 1 | 2;
	}>;

/** Supply owners for an N4 plan that requires packed transport data. */
type DistantSunCacheBuildPlanRequestN4 =
	DistantSunCacheBuildPlanRequestBase & Readonly<{
		atmosphere:
			DistantSunCacheBuildPlanRequestBase["atmosphere"]
			& Pick<AtmosphereModel, "sampleMedium">;
		geometry: CacheBuildContributor & CacheTransportDataProvider;
		maximumScatteringOrder: 4;
	}>;

/** Supply the concrete owners needed to derive one distant-Sun GPU plan. */
type DistantSunCacheBuildPlanRequest =
	| DistantSunCacheBuildPlanRequestN1OrN2
	| DistantSunCacheBuildPlanRequestN4;

/** Supply the configured distant source used by its per-runtime controller. */
type DistantSunCacheSource = CacheBuildContributor & Readonly<{
	/** Store normalized source-owned construction values. */
	configuration: DistantSunLightSourceConfig;
}>;
