/**
 * Configure spherical Earth atmosphere geometry.
 */
type SphericalEarthGeometryConfig = {
	/**
	 * Store ground radius with its physical unit.
	 */
	readonly bottomRadius: Distance;

	/**
	 * Store top atmosphere radius with its physical unit.
	 */
	readonly topRadius: Distance;

	/**
	 * Store observer height above the ground radius with its physical unit.
	 */
	readonly observerHeight?: Distance;

	/**
	 * Store observer up direction.
	 */
	readonly observerUpDirection?: UnitVector3;

	/**
	 * Store how Three scene directions map into spherical model space.
	 */
	readonly sceneFrame?: SphericalEarthSceneFrameConfig | null;

	/**
	 * Store the configured direction from a sample toward the source.
	 */
	readonly directionToSource?: UnitVector3;

	/**
	 * Store the selected spherical cache position-domain node count.
	 */
	readonly cacheAltitudeBinCount?: number;

	/**
	 * Store minimum cache altitude with its physical unit.
	 */
	readonly cacheBoundaryAltitude?: Distance;

	/**
	 * Store source-path optical-depth integration interval count.
	 */
	readonly sourceTransmittanceIntervalCount?: number;
};

/**
 * Configure scene-direction basis mapping for spherical shader setup.
 */
type SphericalEarthSceneFrameConfig = {
	/**
	 * Use observer-local axes or direct model-space axes.
	 */
	readonly kind: "observer-local" | "model-space";
};

/** Describe one source-aligned physical direction basis. */
type ScatteringCacheDirectionFrame = {
	/** Store the physical source-aligned x axis. */
	readonly xAxis: UnitVector3;
	/** Store the physical source-aligned y axis. */
	readonly yAxis: UnitVector3;
	/** Store the physical source-aligned z axis. */
	readonly zAxis: UnitVector3;
};

/**
 * Configure flat Earth atmosphere geometry.
 */
type FlatEarthGeometryConfig = {
	/**
	 * Store observer position with its physical unit.
	 */
	readonly observerPosition?: Position;

	/**
	 * Store the source-owned local-light position paired into geometry for
	 * source-relative coordinate reconstruction.
	 */
	readonly sourcePosition: Position;

	/**
	 * Store top atmosphere altitude with its physical unit.
	 */
	readonly topAltitude: Distance;

	/**
	 * Store the reusable local-cache radial construction bound. This is a
	 * cache-domain fact and must not be derived from observer or view limits.
	 */
	readonly cacheRadialMaximum: Distance;

	/**
	 * Store optional sky ray cap with its physical unit for unbounded flat rays.
	 */
	readonly sceneSkyRayLimit?: Distance | null;

	/**
	 * Store optional observer-centered dome configuration.
	 */
	readonly observerCenteredDome?: FlatObserverCenteredDomeConfig | null;

	/**
	 * Store diagnostic retention limit.
	 */
	readonly runtimeDiagnosticLimit?: number;

	/**
	 * Store optional explicit altitude nodes for the local cache. Omission
	 * scales the selected 19-node altitude placement profile from ground
	 * through the configured atmosphere top.
	 */
	readonly cacheAltitudeNodes?: readonly Distance[];

	/**
	 * Store optional explicit source-subpoint radial nodes for the local cache.
	 * Omission scales the selected 15-node radial placement profile through
	 * the configured radial construction bound.
	 */
	readonly cacheRadialNodes?: readonly Distance[];
};

/** Store normalized executable flat geometry configuration. */
type FlatEarthGeometryConfiguration = Readonly<{
	/** Store the normalized observer position. */
	observerPosition: Position;
	/** Store the normalized finite-source position. */
	sourcePosition: Position;
	/** Store the source projection on the ground plane. */
	sourceSubpoint: Position;
	/** Store the top atmosphere altitude. */
	topAltitude: Distance;
	/** Store the optional final-view parallel-ray cap. */
	sceneSkyRayLimit: Distance | null;
	/** Store the optional final-view-only observer dome. */
	observerCenteredDome: FlatObserverCenteredDomeDescriptor | null;
	/** Store retained diagnostic capacity. */
	runtimeDiagnosticLimit: number;
	/** Store the observer-local scene frame. */
	observerLocalSceneFrame: Readonly<{
		up: UnitVector3;
		right: UnitVector3;
		forward: UnitVector3;
	}>;
	/** Store selected local-cache altitude nodes. */
	cacheAltitudeNodes: readonly Distance[];
	/** Store selected local-cache radial nodes. */
	cacheRadialNodes: readonly Distance[];
	/** Record whether altitude nodes entered through explicit configuration. */
	cacheAltitudeNodesExplicit: boolean;
	/** Record whether radial nodes entered through explicit configuration. */
	cacheRadialNodesExplicit: boolean;
	/** Store the selected reusable radial construction bound. */
	cacheRadialMaximum: Distance;
	/** Store the deterministic radial axis at rho zero. */
	cacheRadialFallbackDirection: UnitVector3;
}>;

/** Describe the right-handed local radial/tangent/vertical direction frame. */
type FlatLocalCacheDirectionFrame = Readonly<{
	/** Store the horizontal direction away from the source subpoint. */
	radial: UnitVector3;
	/** Store the horizontal positive tangent direction. */
	tangent: UnitVector3;
	/** Store the model-space vertical direction. */
	vertical: UnitVector3;
}>;

/** Describe interpolation on one ordered flat-cache axis. */
type FlatCacheAxisStencil = Readonly<{
	/** Store the lower node index. */
	lowerIndex: number;
	/** Store the upper node index. */
	upperIndex: number;
	/** Store the lower interpolation weight. */
	lowerWeight: number;
	/** Store the upper interpolation weight. */
	upperWeight: number;
}>;

/** Store one flattened flat/local position node's physical metadata. */
type FlatLocalCachePositionNodeMetadata = Readonly<{
	/** Store its canonical representative physical position. */
	position: Position;
	/** Store altitude above the ground plane. */
	z: Distance;
	/** Store horizontal distance from the source subpoint. */
	rho: Distance;
	/** Store the altitude-axis index. */
	zIndex: number;
	/** Store the radial-axis index. */
	rhoIndex: number;
}>;

/** Select one geometry-owned flat/local position domain. */
type FlatLocalCachePositionDomainRequest = Readonly<{
	/** Select generated altitude-node count when explicit nodes are absent. */
	zCount?: number;
	/** Select generated radial-node count when explicit nodes are absent. */
	rhoCount?: number;
}>;

/** Expose one coherent executable flat/local position-domain selection. */
type FlatLocalCachePositionDomain = Readonly<{
	/** Store descriptive position-domain metadata. */
	descriptor: PositionDomainDescriptor;
	/** Store flattened z-major, rho-minor executable nodes. */
	nodes: readonly PositionDomainNode[];
	/** Store executable altitude nodes. */
	zNodes: readonly Distance[];
	/** Store executable radial nodes. */
	rhoNodes: readonly Distance[];
	/** Store altitude-axis extent. */
	zCount: number;
	/** Store radial-axis extent. */
	rhoCount: number;
	/** Store flattened position extent. */
	count: number;
}>;

/** Store executable flat/local position axes recovered from a domain. */
type FlatLocalCachePositionDomainAxes = Readonly<{
	/** Store altitude nodes. */
	zNodes: readonly Distance[];
	/** Store radial nodes. */
	rhoNodes: readonly Distance[];
	/** Store altitude-axis extent. */
	zCount: number;
	/** Store radial-axis extent. */
	rhoCount: number;
}>;

/** Supply flat/local position reconstruction with optional executable axes. */
type FlatScatteringCachePositionStencilRequest =
	ScatteringCachePositionStencilRequest & Readonly<{
		/** Select explicit executable axes for a bounded construction domain. */
		positionAxes?: FlatLocalCachePositionDomainAxes;
	}>;

/** Supply the physical position required by a local radial direction frame. */
type FlatScatteringCacheFramedDirectionRequest =
	ScatteringCacheFramedDirectionRequest & Readonly<{
		/** Store the physical position whose radial frame is active. */
		position: Position;
	}>;

/** Store flat/local coordinate metadata used by generic transport. */
type FlatLocalCacheBuildCoordinateMetadata = Readonly<{
	/** Store the physical construction position. */
	position: Position;
	/** Store its flattened position index when useful. */
	positionIndex?: number;
}>;

/** Describe one selected reusable construction boundary. */
type FlatReusableBoundary = Readonly<{
	/** Identify the selected domain edge. */
	kind: "ground" | "top-atmosphere" | "cache-radial-boundary";
	/** Store physical distance to that edge in meters. */
	distance: number;
}>;

/** Store one aggregated packed transport tap. */
type FlatTransportTap = Readonly<{
	/** Store source scattering-direction index. */
	sourceDirectionIndex: number;
	/** Store source position index. */
	sourcePositionIndex: number;
	/** Store one coefficient per spectral channel. */
	coefficients: Float64Array;
}>;

/** Supply the flat executable axes added to shared construction domains. */
type FlatLocalCacheConstructionDomains =
	CacheConstructionDomains
	& FlatLocalCachePositionDomainAxes
	& Readonly<{
		/** Store the executable spectral channel extent. */
		spectralChannelCount: number;
	}>;

/** Supply one flat/local packed transport query. */
type FlatTransportQueryRequest = Readonly<{
	/** Supply atmosphere-owned medium sampling. */
	atmosphere: Pick<AtmosphereModel, "sampleMedium">;
	/** Supply the exact executable position and outgoing-direction domains. */
	domains: FlatLocalCacheConstructionDomains;
	/** Supply the output position node. */
	positionNode: PositionDomainNode;
	/** Supply one local outgoing radiance direction. */
	cacheDirection: UnitVector3;
	/** Supply selected path interval count. */
	intervalCount: number;
}>;

/**
 * Supply local geometry transport packing without a fixed source direction.
 * The local radial frame is resolved independently at every path sample.
 */
type FlatCacheTransportDataRequest = Readonly<
	Omit<CacheTransportDataRequest, "directionToSource" | "domains">
	& Readonly<{
		/** Supply local executable position axes with shared domains. */
		domains: FlatLocalCacheConstructionDomains;
	}>
>;

/**
 * Configure an observer-centered flat atmosphere dome.
 */
type FlatObserverCenteredDomeConfig = {
	/**
	 * Store the dome center policy.
	 */
	readonly centerPolicy?: "observer-centered";

	/**
	 * Store dome apex altitude with its physical unit.
	 */
	readonly apexAltitude: Distance;

	/**
	 * Store maximum observer view-ray extent with its physical unit.
	 */
	readonly maxObserverViewRayExtent: Distance;
};

/**
 * Store derived observer-centered dome facts.
 */
type FlatObserverCenteredDomeDescriptor = {
	/** Identify the center policy. */
	readonly centerPolicy: "observer-centered";
	/** Store the apex altitude. */
	readonly apexAltitude: Distance;
	/** Store the max observer view ray extent. */
	readonly maxObserverViewRayExtent: Distance;
	/** Store the observer altitude. */
	readonly observerAltitude: Distance;
	/** Store the sphere center. */
	readonly sphereCenter: Position;
	/** Store the sphere radius. */
	readonly sphereRadius: Distance;
};
