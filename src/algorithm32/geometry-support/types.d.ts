/** Type that describes a geometry-owned ground hit. */
type GroundIntersection = Readonly<{
	/** Value that stores the physical position. */
	position: Position;
	/** Value that stores the outward unit normal. */
	normal: UnitVector3;
	/** Value that stores the physical distance. */
	distance: Distance;
}>;

/** Type that describes an atmosphere coordinate resolved by geometry. */
type AtmosphereCoordinate = {
	/** Value that stores altitude above the active atmosphere bottom boundary. */
	altitude: Distance;

	/** Value that stores optional horizontal distance from a finite source subpoint when required by the selected flat/local cache. */
	rho?: Distance;
};

/** Type that describes one sampled atmosphere path point. */
type AtmospherePathSample = {
	/** Value that stores the atmosphere coordinate represented by this path sample. */
	atmosphereCoordinate: AtmosphereCoordinate;

	/** Value that stores the effective path measure represented by this sample. */
	measure: Distance;

	/** Value that stores the interval length from the previous sample. */
	intervalLengthFromPrevious: Distance;
};

/** Type that describes a request to resolve a physical ray into an atmosphere path. */
type AtmospherePathRequest = {
	/** Value that stores the model-space ray to resolve. */
	readonly ray: Ray;
	/** Value that stores the optional path start distance. */
	readonly startDistance?: Distance;
	/** Value that stores the optional explicit path end distance. */
	readonly endDistance?: Distance;
	/** Value that stores the optional source-owned path limit. */
	readonly sourcePathLimit?: SourcePathLimit;
	/** Value that stores the optional integration sample count. */
	readonly sampleCount?: number;
};

/** Type that describes a geometry-owned atmosphere path for optical-depth integration. */
type AtmospherePath = {
	/** Value that stores the start coordinate. */
	start: AtmosphereCoordinate;

	/** Value that stores the end coordinate. */
	end: AtmosphereCoordinate;

	/** Value that stores total physical path length. */
	length: Distance;

	/** Value that stores optional integration samples. */
	samples?: readonly AtmospherePathSample[];

	/** Value that stores true when the path is blocked by ground before reaching the source. */
	blockedByGround?: boolean;

	/** Value that stores owner-specific metadata for validation or diagnostics. */
	metadata?: unknown;
};

/** Type that describes a position in the source-owned frame after geometry resolution. */
type SourceRelativePosition = {
	/** Value that stores the direction from the source toward the sample point. */
	directionFromSource: UnitVector3;

	/** Value that stores the direction from the sample point toward the source when useful. */
	directionToSource?: UnitVector3;

	/** Value that stores measured distance from the finite source, or null for directional sources. */
	distanceFromSource: Distance | null;

	/** Value that stores radial distance from the source subpoint when the active cache family needs it. */
	radialDistanceFromSourceSubpoint?: Distance;

	/** Value that stores resolved physical altitude when the active cache family needs it. */
	altitude?: Distance;

	/** Value that stores owner-specific metadata for validation or diagnostics. */
	metadata?: unknown;
};

/** Type that describes one model-space ray. */
type Ray = {
	/** Value that stores the model-space ray origin. */
	origin: Position;

	/** Value that stores the normalized model-space ray direction. */
	direction: UnitVector3;
};

/** Type that describes a finite geometry-resolved view ray segment. */
type RaySegment = {
	/** Value that stores the ray integrated by Algorithm32. */
	ray: Ray;

	/** Value that stores the starting physical distance along the ray. */
	startDistance: Distance;

	/** Value that stores the ending physical distance along the ray. */
	endDistance: Distance;

	/** Value that stores optional geometry-owned endpoint or boundary metadata. */
	metadata?: unknown;
};

/**
 * Ground-boundary ownership mode for one geometry-resolved view ray.
 *
 * - **"clip"** - Geometry clips the ray at its ground intersection.
 * - **"scene-hit-owned"** - A renderer scene hit owns the ground endpoint.
 */
type GeometryViewRayGroundBoundaryMode = 'clip' | 'scene-hit-owned';

/** Type that supplies optional geometry-owned facts used to resolve one finite view ray. */
type GeometryViewRayRequest = Readonly<{
	/** Override the geometry's configured observer origin. */
	origin?: Position;
	/** Override the geometry's configured view direction. */
	direction?: UnitVector3;
	/** Limit the resolved segment to an earlier physical endpoint. */
	endDistance?: Distance;
	/** Value that selects whether spherical ground clips the ray or is owned by a scene hit. */
	groundBoundaryMode?: GeometryViewRayGroundBoundaryMode;
}>;

/** Type that configures geometry-owned scene-point projection to the ground receiver. */
type GeometryGroundProjectionRequest = {
	/** Value that stores the renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;

	/**
	 * Treat points already this close to, or inside, the local surface as
	 * belonging to the nearby receiver point.
	 */
	readonly surfaceTolerance?: SceneDistance;

	/** Value that rejects ray hits farther than this scene-unit distance from the original point. */
	readonly maxLocalDistance?: SceneDistance;

	/** Value that rejects ray hits whose surface normal dot with the local projected surface normal is lower than this value. */
	readonly localNormalDotMin?: number;
};

/**
 * Visible support classification for a distant uniform Sun disk.
 *
 * - **"full"** - The complete disk is above the geometry horizon.
 * - **"partial"** - The geometry horizon crosses the disk.
 * - **"empty"** - The complete disk is below the geometry horizon.
 */
type DistantSunVisibleSupportClassification = 'full' | 'partial' | 'empty';

/** Visible support facts for one distant uniform Sun disk. */
type DistantSunVisibleSupport = Readonly<{
	/** Disk support profile. */
	readonly kind: 'uniform-disk';
	/** Apparent angular radius in radians. */
	readonly angularRadiusRadians: number;
	/** Visible disk classification at the configured receiver. */
	readonly classification: DistantSunVisibleSupportClassification;
	/** Visible fraction of the uniform disk in [0, 1]. */
	readonly visibleFraction: number;
}>;

/** Geometry-resolved placement of one configured celestial source. */
type CelestialResolvedPlacement =
	| Readonly<{
			/** Stable source identifier. */
			readonly sourceId: string;
			/** Distant uniform-Sun placement kind. */
			readonly kind: 'distant-uniform-sun';
			/** Model-space unit direction toward the source. */
			readonly directionToSource: UnitVector3;
			/** Geometry-owned visible disk support at the configured receiver. */
			readonly support: DistantSunVisibleSupport;
	  }>
	| Readonly<{
			/** Stable source identifier. */
			readonly sourceId: string;
			/** Static stellar point-set placement kind. */
			readonly kind: 'static-stellar-point-set';
			/** Model-space member directions in canonical member order. */
			readonly memberDirections: readonly UnitVector3[];
	  }>
	| Readonly<{
			/** Stable source identifier. */
			readonly sourceId: string;
			/** Finite local-Sun placement kind. */
			readonly kind: 'finite-local-sun';
			/** Model-space physical center of the finite source. */
			readonly center: Position;
	  }>;

/** Geometry-owned static domain description used by one celestial cache family. */
type CelestialContributionDomainDescription = Readonly<{
	/** Stable domain identifier. */
	readonly id: string;
	/** Canonical identity of the complete domain facts. */
	readonly contentHash: string;
	/** Capability family supported by this domain. */
	readonly family: CelestialCapabilityFamily;
	/** Ordered physical receiver-altitude nodes. */
	readonly altitudeNodes: readonly Distance[];
	/** Ordered source-direction coordinates interpreted by the geometry owner. */
	readonly directionCoordinates: readonly number[];
}>;

/** One geometry-owned construction sample for a celestial cache field. */
type CelestialBuildSample = Readonly<{
	/** Source represented by this sample. */
	readonly sourceId: string;
	/** Physical receiver position. */
	readonly receiverPosition: Position;
	/** Model-space unit direction toward the source. */
	readonly directionToSource: UnitVector3;
	/** Atmosphere coordinate at the receiver. */
	readonly atmosphereCoordinate: AtmosphereCoordinate;
	/** Source path integrated for direct atmosphere transport. */
	readonly sourcePath: AtmospherePath;
	/** Whether the source contributes at this sample. */
	readonly supported: boolean;
}>;

/** Receiver-stencil classification. */
type CelestialReceiverStencilClassification = 'valid' | 'out-of-domain';

/** Direction-stencil classification. */
type CelestialDirectionStencilClassification = 'clear' | 'ground-horizon' | 'out-of-domain';

/** Geometry-provided interpolation stencil over celestial receiver coordinates. */
type CelestialReceiverStencil = Readonly<{
	/** Canonical identity of the complete stencil facts. */
	readonly contentHash: string;
	/** Receiver-domain classification. */
	readonly classification: CelestialReceiverStencilClassification;
	/** Whether the receiver belongs to the declared domain. */
	readonly valid: boolean;
	/** Physical altitude resolved for the receiver. */
	readonly altitude: Distance;
	/** Receiver coordinate indices. */
	readonly indices: readonly [number, number];
	/** Receiver interpolation weights. */
	readonly weights: readonly [number, number];
}>;

/** Geometry-provided interpolation stencil over celestial direction coordinates. */
type CelestialDirectionStencil = Readonly<{
	/** Canonical identity of the complete stencil facts. */
	readonly contentHash: string;
	/** Direction/support classification. */
	readonly classification: CelestialDirectionStencilClassification;
	/** Whether the direction belongs to the declared domain. */
	readonly valid: boolean;
	/** Horizon-normalized direction coordinate, or null outside valid support. */
	readonly directionCoordinate: number | null;
	/** Direction coordinate indices. */
	readonly indices: readonly [number, number];
	/** Direction interpolation weights. */
	readonly weights: readonly [number, number];
}>;

/** Distant-Sun query facts in one spherical celestial packet. */
type SphericalDistantSunQuery = Readonly<{
	/** Geometry-resolved distant-Sun placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'distant-uniform-sun'}>;
	/** Direction stencil for the Sun center at the configured receiver. */
	readonly directionStencil: CelestialDirectionStencil;
}>;

/** Stellar point-set query facts in one spherical celestial packet. */
type SphericalStellarPointSetQuery = Readonly<{
	/** Geometry-resolved static stellar point-set placement. */
	readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'static-stellar-point-set'}>;
	/** Direction stencils in exact stellar member order. */
	readonly memberDirectionStencils: readonly CelestialDirectionStencil[];
}>;

/** Complete spherical geometry-derived query facts used by celestial shader assembly. */
type SphericalCelestialQueryPacket = Readonly<{
	/** Stable identity of the query facts. */
	readonly contentHash: string;
	/** Spherical distant-Sun and stellar-point-set family discriminator. */
	readonly family: 'spherical-sun-stars-radial-v1';
	/** Identity of the geometry-owned celestial contribution domain. */
	readonly domainIdentity: string;
	/** Construction-time observation represented by the packet. */
	readonly observation: GeometryObservation;
	/** Physical configured receiver position. */
	readonly receiverPosition: Position;
	/** Receiver-altitude stencil shared by the source queries. */
	readonly receiverStencil: CelestialReceiverStencil;
	/** Distant-Sun query. */
	readonly sun: SphericalDistantSunQuery;
	/** Optional static stellar point-set query. */
	readonly stars: SphericalStellarPointSetQuery | null;
}>;

/** Flat finite-Sun query facts retained by one configured build. */
type FlatFiniteSunCelestialQueryPacket = Readonly<{
	/** Stable identity of the query facts. */
	readonly contentHash: string;
	/** Flat finite-local-Sun family discriminator. */
	readonly family: 'flat-local-finite-sun-v1';
	/** Identity of the source-relative contribution domain. */
	readonly domainIdentity: string;
	/** Construction-time observation represented by the packet. */
	readonly observation: GeometryObservation;
	/** Physical configured receiver position. */
	readonly receiverPosition: Position;
	/** Sole finite local-Sun query. */
	readonly sun: Readonly<{
		/** Geometry-resolved finite local-Sun placement. */
		readonly placement: Extract<CelestialResolvedPlacement, {readonly kind: 'finite-local-sun'}>;
	}>;
}>;

/** Complete geometry-derived query packet for a supported celestial family. */
type CelestialQueryPacket = SphericalCelestialQueryPacket | FlatFiniteSunCelestialQueryPacket;

/** Trusted geometry request for publishing one celestial-cache query stencil to shader assembly. */
type CelestialCacheShaderContributionRequest = ShaderContributionRequest &
	Readonly<{
		/** Complete geometry-derived query packet retained by the active shader build. */
		readonly queryPacket: CelestialQueryPacket;
	}>;

/** Request to resolve all configured celestial source placements. */
type CelestialPlacementResolutionRequest = Readonly<{
	/** Configured celestial roster. */
	readonly roster: CelestialSourceRoster;
	/** Construction-time observation. */
	readonly observation: GeometryObservation;
}>;

/** Request to derive one celestial cache construction sample. */
type CelestialBuildSampleRequest = Readonly<{
	/** Geometry-owned celestial contribution domain. */
	readonly domain: CelestialContributionDomainDescription;
	/** Geometry-resolved source placement. */
	readonly placement: CelestialResolvedPlacement;
	/** Receiver coordinate index. */
	readonly receiverIndex: number;
	/** Direction coordinate index. */
	readonly directionIndex: number;
}>;

/**
 * Visual-material lighting policy for geometry-owned endpoint objects.
 *
 * - **"basic"** - Unlit basic material behavior.
 * - **"lambert"** - Lambert-lit material behavior.
 */
type GeometryVisualMaterialLighting = 'basic' | 'lambert';

/** Geometry-owned Three endpoint-object construction request. */
type GeometryThreeEndpointObjectsRequest = {
	/** Renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;

	/** Optional material or profile identifier for the endpoint objects. */
	readonly spectralReferenceId?: string;
	/** Optional Three numeric material color. */
	readonly visualMaterialColor?: number;

	/** Optional display-space material RGBA channels. */
	readonly visualMaterialDisplayRgba?: readonly [number, number, number, number] | readonly [number, number, number];

	/** Visual-ground material lighting policy. */
	readonly visualMaterialLighting?: GeometryVisualMaterialLighting;

	/** Optional renderer shadow-receiver configuration for visual endpoint objects. */
	readonly shadow?: GeometryEndpointShadowRequest | null;

	/** Optional flat-ground render extent override. */
	readonly groundExtent?: Distance;

	/** Visual-geometry width or radial segment count. */
	readonly widthSegments?: number;

	/** Visual-geometry height or depth segment count. */
	readonly heightSegments?: number;

	/**
	 * Spherical-ground visual receiver mesh; the exact raycast endpoint remains
	 * the ground-hit authority.
	 */
	readonly groundVisualMesh?: SphericalGroundVisualMeshRequest | SphericalGroundVisualMeshKind;

	/** Optional base object name. */
	readonly name?: string;
};

/** Geometry-owned visual-endpoint shadow-receiver request. */
type GeometryEndpointShadowRequest = {
	/** Whether geometry-owned ground shadow receiving is enabled. */
	readonly enabled?: boolean;

	/** Whether the visual endpoint receives Three shadows. */
	readonly receiveShadow?: boolean;

	/** Optional shadow-policy metadata. */
	readonly shadowPolicy?: string;
};

/** Unknown-valued form of a geometry endpoint-shadow request at ingress. */
type GeometryEndpointShadowRequestCandidate = {
	/** Candidate enablement value. */
	readonly enabled?: unknown;

	/** Candidate shadow-receiving value. */
	readonly receiveShadow?: unknown;

	/** Candidate shadow-policy value. */
	readonly shadowPolicy?: unknown;
};

/** Geometry-owned Three endpoint objects. */
type GeometryThreeEndpointObjects = {
	/** Visible objects for the application scene or composer render. */
	readonly visualObjects: readonly unknown[];

	/** Exact raycast/input objects for scene-hit ownership. */
	readonly raycastObjects: readonly unknown[];

	/** Owner-specific placement, scale, and material metadata. */
	readonly metadata: unknown;
};

/** Type that configures geometry-owned scene-depth cap resolution. */
type GeometrySceneDepthMaxRequest = {
	/** Value that provides the active camera when available. */
	readonly camera?: unknown;

	/** Value that provides camera position in physical coordinates. */
	readonly cameraPosition?: Position;

	/** Value that provides camera position in renderer scene coordinates. */
	readonly cameraScenePosition?: ScenePosition;

	/** Value that stores the renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;

	/**
	 * Override geometry-owned endpoint extent when the
	 * geometry uses a finite ground plane.
	 */
	readonly groundExtent?: Distance;

	/** Value that stores the smallest acceptable cap. */
	readonly minimum?: Distance;

	/** Value that provides one physical endpoint extent. */
	readonly endpointExtent?: Distance;

	/** Value that provides one physical endpoint position. */
	readonly endpointPosition?: Position;

	/** Value that provides physical endpoint positions. */
	readonly endpointPositions?: readonly Position[];

	/** Value that provides one renderer-scene endpoint extent. */
	readonly endpointSceneExtent?: SceneDistance;

	/** Value that provides one renderer-scene endpoint position. */
	readonly endpointScenePosition?: ScenePosition;

	/** Value that provides renderer-scene endpoint positions. */
	readonly endpointScenePositions?: readonly ScenePosition[];
};
