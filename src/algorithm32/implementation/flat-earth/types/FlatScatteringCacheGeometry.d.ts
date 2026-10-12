/** Right-handed local radial/tangent/vertical direction frame. */
type FlatLocalCacheDirectionFrame = Readonly<{
	/** Horizontal direction away from the source subpoint. */
	radial: UnitVector3;
	/** Horizontal positive tangent direction. */
	tangent: UnitVector3;
	/** Model-space vertical direction. */
	vertical: UnitVector3;
}>;

/** Flat/local coordinate metadata used by generic transport. */
type FlatLocalCacheBuildCoordinateMetadata = Readonly<{
	/** Physical construction position. */
	position: Position;
	/** Flattened position index when useful. */
	positionIndex?: number;
}>;

/**
 * Domain edge selected as one reusable flat-cache construction boundary.
 *
 * - **"ground"** - The ground-plane boundary.
 * - **"top-atmosphere"** - The top-atmosphere boundary.
 * - **"cache-radial-boundary"** - The finite radial edge of the reusable cache domain.
 */
type FlatReusableBoundaryKind = 'ground' | 'top-atmosphere' | 'cache-radial-boundary';

/** Selected reusable construction boundary. */
type FlatReusableBoundary = Readonly<{
	/** Selected domain edge. */
	kind: FlatReusableBoundaryKind;
	/** Physical distance to the edge in meters. */
	distance: number;
}>;

/** Aggregated packed transport tap. */
type FlatTransportTap = Readonly<{
	/** Source scattering-direction index. */
	sourceDirectionIndex: number;
	/** Source position index. */
	sourcePositionIndex: number;
	/** Coefficient for each spectral channel. */
	coefficients: Float64Array;
}>;

/** Physical inputs for one flat/local packed transport query. */
type FlatTransportQueryRequest = Readonly<{
	/** Atmosphere-owned medium sampling. */
	atmosphere: Pick<AtmosphereModel, 'sampleMedium'>;
	/** Exact executable position and outgoing-direction domains. */
	domains: FlatLocalCacheConstructionDomains;
	/** Output position node. */
	positionNode: PositionDomainNode;
	/** Local outgoing radiance direction. */
	cacheDirection: UnitVector3;
	/** Selected path interval count. */
	intervalCount: number;
}>;

/** One canonical active-tap row emitted during flat/local transport enumeration. */
type FlatTransportQueryTapVisitor = (
	query: Readonly<{
		/** Position-major, direction-minor transport query index. */
		queryIndex: number;
		/** Active, aggregated taps in their canonical insertion order. */
		taps: readonly FlatTransportTap[];
	}>,
) => void;

/** Compact CPU-owned CSR transport data for the Flat/local interim path. */
type FlatIndexedTransportData = Readonly<{
	/** Number of position-major, incoming-direction-minor output queries. */
	queryCount: number;
	/** Number of stored active interpolation taps. */
	activeTapCount: number;
	/** Exclusive CSR row boundaries with one final active-tap count entry. */
	queryOffsets: Uint32Array;
	/** One outgoing scattering-direction index per active tap. */
	sourceDirectionIndices: Uint32Array;
	/** One source position index per active tap. */
	sourcePositionNodeIds: Uint32Array;
	/** Native-15 Float32 coefficients in active-tap-major channel order. */
	coefficients: Float32Array;
}>;

/** GPU-bindable R32F resources for Flat/local indexed transport data. */
type FlatIndexedTransportGpuData = Readonly<{
	/** Discriminant for the active-only shader path. */
	kind: 'indexed';
	/** Number of position-major, incoming-direction-minor output queries. */
	queryCount: number;
	/** Number of stored active interpolation taps. */
	activeTapCount: number;
	/** Shared width of the 2D CSR offset and tap textures. */
	textureWidth: number;
	/** R32F CSR row boundaries. */
	queryOffsets: CacheData;
	/** R32F source-direction addresses. */
	sourceDirectionIndices: CacheData;
	/** R32F source-position addresses. */
	sourcePositionNodeIds: CacheData;
	/** R32F native-15 tap-major coefficient layers. */
	coefficients: CacheData;
}>;
