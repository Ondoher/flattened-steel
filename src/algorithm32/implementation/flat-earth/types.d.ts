/** Shared interpolation stencil on one geometry-owned physical axis. */
type FlatCacheAxisStencil = Readonly<{
	/** Lower node index. */ readonly lowerIndex: number;
	/** Upper node index. */ readonly upperIndex: number;
	/** Positive lower interpolation weight. */ readonly lowerWeight: number;
	/** Positive upper interpolation weight, zero for an exact node. */ readonly upperWeight: number;
}>;

/** Accepted controls for v9 ragged physical positions; spectral/medium-derived refinement stays profile-owned. */
type FlatCompactTopologyRequest = Readonly<{
	/** Finite source-center height above flat ground. */ readonly sourceHeight: Distance;
	/** Slab top altitude above flat ground. */ readonly atmosphereTop: Distance;
	/** Source-centered horizontal coverage radius. */ readonly coverageRadius: Distance;
	/** Ordered complete altitude controls, including ground and top. */ readonly altitudes: readonly Distance[];
	/** Ordered physical band endpoints from zero through the cylinder's farthest source distance. */ readonly bandRadii: readonly Distance[];
	/** Maximum spectral extinction coefficient at each altitude; physical inverse lengths aligned with altitudes. */ readonly boundaryExtinction: readonly InverseDistance[];
	/** Positive ordered dimensionless multiples of local extinction length added inward from the cylinder. */ readonly boundaryExtinctionLengthMultiples: readonly number[];
	/** Complete control/profile/medium derivation identity; it does not execute configuration. */ readonly provenanceIdentity: string;
}>;

/** Physical scattering band identity, independent of compact positions and source-amplitude intervals. */
type FlatCompactBand = Readonly<{
	/** Stable physical band address. */ readonly id: number;
	/** Inner Euclidean source-distance endpoint. */ readonly innerRadius: Distance;
	/** Outer Euclidean source-distance endpoint. */ readonly outerRadius: Distance;
	/** False only for proven empty bands strictly below the slab's nearest distance. */ readonly admitted: boolean;
}>;

/** One readonly compact physical position in source-centered cylindrical coordinates. */
type FlatCompactNode = Readonly<{
	/** Contiguous allocated position address. */ readonly index: number;
	/** Owning altitude-row address. */ readonly rowIndex: number;
	/** Physical scattering band identity; never an amplitude-band address. */ readonly bandId: number;
	/** Altitude above flat ground. */ readonly altitude: Distance;
	/** Source-axis horizontal distance. */ readonly horizontalDistance: Distance;
	/** Euclidean source-center distance. */ readonly sourceDistance: Distance;
	/** Stable distance beyond the row's source-axis distance. */ readonly radiusExcess: Distance;
}>;

/** One contiguous ragged altitude row; no rectangular radial axis is implied. */
type FlatCompactRow = Readonly<{
	/** Altitude above flat ground. */ readonly altitude: Distance;
	/** First allocated compact position. */ readonly offset: number;
	/** Actual allocated positions in this row. */ readonly count: number;
	/** Ordered physical radius-excess controls aligned with the row's positions. */ readonly radiusExcesses: readonly Distance[];
}>;

/** Source-centered physical query admitted only with complete positive spatial support. */
type FlatCompactPositionQuery = Readonly<{
	/** Nonnegative horizontal distance from the finite source's axis. */ readonly horizontalDistance: Distance;
	/** Altitude above flat ground. */ readonly altitude: Distance;
}>;

/** Executable geometry-owned compact topology and spatial support; angular/field transport remains separate. */
interface FlatCompactTopology {
	/** Identity derived from accepted executable controls, never a configuration lookup key. */ readonly id: string;
	/** Complete input/profile derivation identity. */ readonly provenanceIdentity: string;
	/** Source-center height above ground. */ readonly sourceHeight: Distance;
	/** Slab top altitude. */ readonly atmosphereTop: Distance;
	/** Source-centered horizontal cylinder radius. */ readonly coverageRadius: Distance;
	/** Actual allocated physical positions. */ readonly positionCount: number;
	/** Readonly physical nodes, independent of packing dimensions. */ readonly nodes: readonly FlatCompactNode[];
	/** Readonly contiguous altitude rows. */ readonly rows: readonly FlatCompactRow[];
	/** All physical bands including omissions without allocated positions. */ readonly bands: readonly FlatCompactBand[];
	/** Proven empty physical band identities. */ readonly omittedBands: readonly number[];
	/** Geometry-derived amplitude support extrema, distinct from spatial bands. */ readonly sourceDistanceBounds: SourceDistanceBounds;
	/**
	 * Call this method to resolve an allocated compact address.
	 *
	 * @param index - Contiguous position address.
	 * @returns - Readonly physical node; an unallocated address throws.
	 */
	positionAt(index: number): FlatCompactNode;
	/**
	 * Call this method to resolve complete positive spatial support.
	 *
	 * @param query - Source-centered physical coordinates.
	 * @returns - Compact indices/weights; outside support throws without clamping.
	 */
	resolvePositionStencil(query: FlatCompactPositionQuery): ScatteringCachePositionStencil;
}

/** Physical reconstruction query for a topology created by a paired flat geometry. */
type FlatCompactNodePositionRequest = Readonly<{
	/** Structural topology with matching source height/slab. */ topology: FlatCompactTopology;
	/** Actual allocated compact node address. */ positionIndex: number;
}>;

/** Geometry-owned bounded compact ray request; outside origins reject rather than clamp. */
type FlatCompactRayRequest = Readonly<{
	/** Geometry-paired compact support. */ topology: FlatCompactTopology;
	/** Physical admitted origin. */ position: Position;
	/** Physical unit ray direction. */ physicalDirection: UnitVector3;
	/** Optional physical truncation, shorter than the nearest boundary. */ maximumDistance?: Distance;
}>;
/** Executable geometry-owned compact ray; its sampler distinguishes physical boundaries from interior prefixes. */
interface FlatCompactRay {
	/** Physical admitted origin. */ readonly origin: Position;
	/** Physical unit direction. */ readonly direction: UnitVector3;
	/** Physical bounded length. */ readonly length: Distance;
	/** Ground, top, cylinder or explicitly shortened endpoint. */ readonly boundary:
		'ground' | 'top-atmosphere' | 'cache-radial-boundary' | 'shortened';
	/**
	 * Call this method to resolve a physical position on the closed bounded ray.
	 * @param distance - Unit-bearing distance from the origin.
	 * @returns - Supported physical position; only the exact physical endpoint receives analytic boundary rounding.
	 */
	positionAt(distance: Distance): Position;
}

/** Physical reconstruction query for a topology created by a paired flat geometry. */
type FlatCompactReconstructionRequest = ScatteringCacheDirectionRequest &
	Readonly<{
		/** Executable compact topology, with matching source height and slab. */ readonly topology: FlatCompactTopology;
	}>;

/** One positive compact spatial contribution and its geometry-resolved angular support. */
type FlatCompactReconstructionTap = Readonly<{
	/** Actual allocated compact position address. */ readonly positionIndex: number;
	/** Positive spatial weight; angular products are applied separately. */ readonly positionWeight: number;
	/** W27 support resolved for this tap, including the axis canonical-meridian limit. */ readonly directionStencil: ScatteringCacheDirectionStencil;
}>;

/** Type that configures flat Earth atmosphere geometry. */
type FlatEarthGeometryConfig = {
	/** Value that stores observer position with its physical unit. */
	readonly observerPosition?: Position;

	/** Value that stores top atmosphere altitude with its physical unit. */
	readonly topAltitude: Distance;

	/** Value that stores the local source center height above the flat ground. */
	readonly localLightSourceHeight: Distance;

	/** Value that stores the azimuthal-equidistant projection radius. */
	readonly projectionRadius: Distance;

	/** Value that stores optional sky ray cap with its physical unit for unbounded flat rays. */
	readonly sceneSkyRayLimit?: Distance | null;

	/** Value that stores optional observer-centered dome configuration. */
	readonly observerCenteredDome?: FlatObserverCenteredDomeConfig | null;

	/** Value that stores diagnostic retention limit. */
	readonly runtimeDiagnosticLimit?: number;

	/** Value that stores optional explicit altitude nodes for the local cache. Omission scales the selected 19-node altitude placement profile from ground through the configured atmosphere top. */
	readonly cacheAltitudeNodes?: readonly Distance[];

	/** Value that stores optional explicit source-subpoint radial nodes for the local cache. Omission scales the selected 15-node radial placement profile through the configured radial construction bound. */
	readonly cacheRadialNodes?: readonly Distance[];
};

/**
 * Flat-world observation instant selected from one geographic date basis.
 *
 * - **"closest-angle"** - Resolve the daily orbit instant at the requested clockwise angle from closest approach.
 * - **"solar-noon"** - Resolve local apparent solar noon.
 * - **"sunrise"** - Resolve sunrise, falling back to solar noon when the Sun does not cross the horizon.
 * - **"sunset"** - Resolve sunset, falling back to solar noon when the Sun does not cross the horizon.
 */
type FlatEarthObservationInstantKind = 'closest-angle' | 'solar-noon' | 'sunrise' | 'sunset';

/** Request used by flat geometry to select an observation instant. */
type FlatEarthObservationInstantRequest = Readonly<{
	/** Canonical UTC instant whose date supplies the seasonal solar state. */
	dateBasis: string;
	/** Geographic location whose local daily event is selected. */
	location: GeographicLocation;
	/** Daily event or closest-approach policy to select. */
	kind: FlatEarthObservationInstantKind;
	/** Clockwise orbit angle required by the closest-angle policy. */
	angle?: Angle;
}>;

/** Type that stores normalized executable flat geometry configuration. */
type FlatEarthGeometryConfiguration = Readonly<{
	/** Value that stores the normalized observer position. */
	observerPosition: Position;
	/** Value that stores the normalized finite-source position. */
	sourcePosition: Position;
	/** Value that stores the source projection on the ground plane. */
	sourceSubpoint: Position;
	/** Value that stores the top atmosphere altitude. */
	topAltitude: Distance;
	/** Value that stores the local source center height. */
	localLightSourceHeight: Distance;
	/** Value that stores the geographic projection radius. */
	projectionRadius: Distance;
	/** Value that stores the optional final-view parallel-ray cap. */
	sceneSkyRayLimit: Distance | null;
	/** Value that stores the optional final-view-only observer dome. */
	observerCenteredDome: FlatObserverCenteredDomeFacts | null;
	/** Value that stores retained diagnostic capacity. */
	runtimeDiagnosticLimit: number;
	/** Value that stores the observer-local scene frame. */
	observerLocalSceneFrame: Readonly<{
		/** Up value. */ up: UnitVector3;
		/** Right value. */ right: UnitVector3;
		/** Forward value. */ forward: UnitVector3;
	}>;
	/** Value that stores selected local-cache altitude nodes. */
	cacheAltitudeNodes: readonly Distance[];
	/** Value that stores selected local-cache radial nodes. */
	cacheRadialNodes: readonly Distance[];
	/** Value that records whether altitude nodes entered through explicit configuration. */
	cacheAltitudeNodesExplicit: boolean;
	/** Value that records whether radial nodes entered through explicit configuration. */
	cacheRadialNodesExplicit: boolean;
	/** Value that stores the selected reusable radial construction bound. */
	cacheRadialMaximum: Distance;
	/** Value that stores the deterministic radial axis at rho zero. */
	cacheRadialFallbackDirection: UnitVector3;
	/** Value that stores the observation used to resolve the finite source. */
	observation: GeometryObservation;
}>;

/** Intrinsic flat configuration retained before source placement is resolved. */
type FlatEarthGeometryShapeConfiguration = Readonly<
	Omit<
		FlatEarthGeometryConfiguration,
		'sourcePosition' | 'sourceSubpoint' | 'cacheRadialNodes' | 'cacheRadialMaximum' | 'observation'
	> &
		Readonly<{
			/** Optional caller-selected radial nodes awaiting a resolved bound. */
			cacheRadialNodes: readonly Distance[] | undefined;
		}>
>;

/** Exact one-shot construction binding retained by flat geometry. */
type FlatEarthGeometryLightSourceBinding = Readonly<{
	/** Exact configured source object. */
	lightSource: GeometryConfigurableLightSource;
	/** Exact normalized observation. */
	observation: GeometryObservation;
}>;

/** Physical flat-geometry operations required by scattering-cache construction. */
type FlatScatteringCacheGeometryOwner = Readonly<{
	/**
	 * Call this method to resolve distance to the top atmosphere boundary.
	 *
	 * @param origin - The physical ray origin.
	 * @param direction - The normalized physical ray direction.
	 * @returns - The boundary distance in meters, or null when the ray misses.
	 */
	distanceToTopAtmosphereBoundary(origin: Position, direction: UnitVector3): number | null;

	/**
	 * Call this method to resolve distance to the ground boundary.
	 *
	 * @param origin - The physical ray origin.
	 * @param direction - The normalized physical ray direction.
	 * @returns - The boundary distance in meters, or null when the ray misses.
	 */
	distanceToGroundBoundary(origin: Position, direction: UnitVector3): number | null;

	/**
	 * Call this method to resolve a physical position into atmosphere coordinates.
	 *
	 * @param position - The physical model-space position.
	 * @returns - The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position: Position): AtmosphereCoordinate;
}>;

/** Type that stores one flattened flat/local position node's physical metadata. */
type FlatLocalCachePositionNodeMetadata = Readonly<{
	/** Value that stores its canonical representative physical position. */
	position: Position;
	/** Value that stores altitude above the ground plane. */
	z: Distance;
	/** Value that stores horizontal distance from the source subpoint. */
	rho: Distance;
	/** Value that stores the altitude-axis index. */
	zIndex: number;
	/** Value that stores the radial-axis index. */
	rhoIndex: number;
}>;

/** Type that selects one geometry-owned flat/local position domain. */
type FlatLocalCachePositionDomainRequest = Readonly<{
	/** Value that selects generated altitude-node count when explicit nodes are absent. */
	zCount?: number;
	/** Value that selects generated radial-node count when explicit nodes are absent. */
	rhoCount?: number;
}>;

/** Type that exposes one coherent executable flat/local position-domain selection. */
type FlatLocalCachePositionDomain = Readonly<{
	/** Value that identifies the executable position domain. */
	id: string;
	/** Value that stores flattened z-major, rho-minor executable nodes. */
	nodes: readonly PositionDomainNode[];
	/** Value that stores executable altitude nodes. */
	zNodes: readonly Distance[];
	/** Value that stores executable radial nodes. */
	rhoNodes: readonly Distance[];
	/** Value that stores altitude-axis extent. */
	zCount: number;
	/** Value that stores radial-axis extent. */
	rhoCount: number;
	/** Value that stores flattened position extent. */
	count: number;
}>;

/** Type that stores executable flat/local position axes recovered from a domain. */
type FlatLocalCachePositionDomainAxes = Readonly<{
	/** Value that stores altitude nodes. */
	zNodes: readonly Distance[];
	/** Value that stores radial nodes. */
	rhoNodes: readonly Distance[];
	/** Value that stores altitude-axis extent. */
	zCount: number;
	/** Value that stores radial-axis extent. */
	rhoCount: number;
}>;

/** Type that supplies flat/local position reconstruction with optional executable axes. */
type FlatScatteringCachePositionStencilRequest = ScatteringCachePositionStencilRequest &
	Readonly<{
		/** Value that selects explicit executable axes for a bounded construction domain. */
		positionAxes?: FlatLocalCachePositionDomainAxes;
	}>;

/** Type that supplies the physical position required by a local radial direction frame. */
type FlatScatteringCacheFramedDirectionRequest = ScatteringCacheFramedDirectionRequest &
	Readonly<{
		/** Value that stores the physical position whose radial frame is active. */
		position: Position;
	}>;

/** Type that supplies the flat executable axes added to shared construction domains. */
type FlatLocalCacheConstructionDomains = CacheConstructionDomains &
	FlatLocalCachePositionDomainAxes &
	Readonly<{
		/** Value that stores the executable spectral channel extent. */
		spectralChannelCount: number;
	}>;

/**
 * Shared transport-request property replaced by the flat/local specialization.
 *
 * - **"directionToSource"** - The fixed source direction omitted because the local radial frame varies by path sample.
 * - **"domains"** - The shared domain contract replaced by flat/local executable axes.
 */
type FlatCacheTransportDataRequestExcludedProperty = 'directionToSource' | 'domains';

/** Type that supplies local geometry transport packing without a fixed source direction. The local radial frame is resolved independently at every path sample. */
type FlatCacheTransportDataRequest = Readonly<
	Omit<CacheTransportDataRequest, FlatCacheTransportDataRequestExcludedProperty> &
		Readonly<{
			/** Value that supplies local executable position axes with shared domains. */
			domains: FlatLocalCacheConstructionDomains;
		}>
>;

/** Accepted collaborators for geometry-owned compact GPU semantics. */
type FlatLocalCacheTransformDefinition = Readonly<{
	/** Physical source center used by construction. */ canonicalSource: Position;
	/** Exact live source center at the requested observation. */ liveSource: Position;
	/** Live horizontal frame rotation in radians. */ rotationRadians: number;
}>;

/** Independent public geometry construction for one live observation. */
type FlatLocalFrameGeometryRequest = Readonly<{
	/** Normalized exact geographic observation. */ observation: GeometryObservation;
	/** New source to pair with the new geometry. */ lightSource: LightSourceModel & GeometryConfigurableLightSource;
	/** Physical observer/receiver location. */ receiverPosition: Position;
	/** Optional explicit finite-source center; omitted resolves the observation. */ sourcePosition?: Position;
}>;

/** Accepted collaborators for geometry-owned compact GPU semantics. */
type FlatCompactCacheShaderDefinition = Readonly<{
	/** Bound flat geometry, including canonical physical placement. */ geometry: FlatCompactCacheShaderGeometry;
	/** Qualified ragged topology and physical support. */ topology: FlatCompactTopology;
	/** Horizon-partitioned positive incoming quadrature. */ incomingDirections: WeightedDirectionDomain;
	/** W27 outgoing domain in the same rotated frame. */ outgoingDirections: CubedSphereDirectionDomain;
}>;
/** Geometry-owned physical node placement and canonical flat configuration used by shader contributors. */
type FlatCompactCacheShaderGeometry = GeometryModel &
	Readonly<{
		/** Canonical paired source/geometry placement and physical geometry facts. */ configuration: FlatEarthGeometryConfiguration;
		/** Call this method to resolve an actual ragged node into the canonical physical meridian. */
		resolveCompactLocalSunCacheNodePosition(request: FlatCompactNodePositionRequest): Position;
	}>;

/** Type that configures an observer-centered flat atmosphere dome. */
type FlatObserverCenteredDomeConfig = {
	/** Value that stores the dome center policy. */
	readonly centerPolicy?: 'observer-centered';

	/** Value that stores dome apex altitude with its physical unit. */
	readonly apexAltitude: Distance;

	/** Value that stores maximum observer view-ray extent with its physical unit. */
	readonly maxObserverViewRayExtent: Distance;
};

/** Type that stores derived observer-centered dome facts. */
type FlatObserverCenteredDomeFacts = {
	/** Value that identifies the center policy. */
	readonly centerPolicy: 'observer-centered';
	/** Value that stores the apex altitude. */
	readonly apexAltitude: Distance;
	/** Value that stores the max observer view ray extent. */
	readonly maxObserverViewRayExtent: Distance;
	/** Value that stores the observer altitude. */
	readonly observerAltitude: Distance;
	/** Value that stores the sphere center. */
	readonly sphereCenter: Position;
	/** Value that stores the sphere radius. */
	readonly sphereRadius: Distance;
};
