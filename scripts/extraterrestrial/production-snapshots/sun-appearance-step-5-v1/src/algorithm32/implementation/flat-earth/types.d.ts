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
