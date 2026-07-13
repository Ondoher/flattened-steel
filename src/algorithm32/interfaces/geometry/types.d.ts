/** Geographic receiver location used for construction-time placement. */
type GeographicLocation = Readonly<{
	/** Geodetic latitude in a supported angle unit. */
	readonly latitude: Angle;
	/** Longitude in a supported angle unit. */
	readonly longitude: Angle;
}>;

/** Observation supplied to geometry during facade construction. */
type GeometryObservation = Readonly<{
	/** Exact canonical ISO-8601 UTC instant. */
	readonly instant: string;
	/** Geographic receiver location. */
	readonly location: GeographicLocation;
}>;

/**
 * Epoch-relative stellar transform selected by spherical celestial geometry.
 *
 * The transform is evaluated once for the fixed configured observation. It is
 * not a live clock or animation contract.
 */
type StellarEpochRelativeTransformIdentity = Readonly<{
	/** IAU 2000 three-angle precession from the catalog epoch to the observation instant. */
	readonly precession: 'iau-2000-three-angle';
	/** USNO mean sidereal-time rotation used at the observation instant. */
	readonly siderealTime: 'usno-mean-sidereal-time';
	/** Approximation that uses configured UTC as UT1. */
	readonly ut1Approximation: 'utc-as-ut1';
	/** Approximation that uses configured UTC as terrestrial time. */
	readonly terrestrialTimeApproximation: 'utc-as-tt';
	/** Receiver-local right-handed output basis ordered east, north, and up. */
	readonly localFrame: 'east-north-up-rh-v1';
}>;

/** Renderer-neutral fixed camera and viewport snapshot for celestial generation. */
type CelestialRenderViewSnapshot = Readonly<{
	/** Stable content identity of every projection-affecting view fact. */
	readonly identity: string;
	/** Perspective projection selected by the accepted first production stage. */
	readonly projection: 'perspective';
	/** Column-major model-to-clip matrix containing exactly 16 finite values. */
	readonly modelViewProjectionMatrix: readonly number[];
	/** Column-major inverse perspective-projection matrix containing exactly 16 finite values. */
	readonly inverseProjectionMatrix: readonly number[];
	/** Screen extent used for top-left row-major half-open pixel classification. */
	readonly viewportSize: PixelSize;
}>;

/** Geometry operations required by the standard stellar generation shader. */
interface StellarScreenPaletteGeometryCapability {
	/**
	 * Return the exact epoch-relative time/location transform implemented by geometry.
	 *
	 * @returns - The fixed-observation stellar transform identity.
	 */
	describeStellarEpochRelativeTransform(): StellarEpochRelativeTransformIdentity;

	/**
	 * Contribute shader operations that transform catalog directions through the configured observation and current view.
	 *
	 * @param request - The accepted model and fixed observation snapshot.
	 * @returns - The geometry-owned generation-stage contribution.
	 */
	createStellarGenerationShaderContribution(
		request: Readonly<{readonly observation: GeometryObservation}>,
	): StellarGenerationGeometryShaderContribution;
}

/**
 * Geometry-resolved atmospheric light-source placement kind.
 *
 * - **"distant-direction"** - A normalized direction toward an effectively infinite source.
 * - **"finite-position"** - A finite source center in model coordinates.
 */
type LightSourcePlacementKind = 'distant-direction' | 'finite-position';

/** Geometry-resolved placement installed on an atmospheric light source. */
type GeometryResolvedLightSourcePlacement =
	| Readonly<{
			/** Distant directional placement kind. */
			readonly kind: 'distant-direction';
			/** Normalized model-space direction toward the light. */
			readonly directionToLight: UnitVector3;
	  }>
	| Readonly<{
			/** Finite positional placement kind. */
			readonly kind: 'finite-position';
			/** Finite source center in model coordinates. */
			readonly position: Position;
	  }>;

/** Request through which Algorithm32 asks geometry to bind one light source. */
type GeometryLightSourceConfigurationRequest = Readonly<{
	/** Candidate geometry-configurable atmospheric light source. */
	readonly lightSource: GeometryConfigurableLightSource;
	/** Normalized construction-time observation. */
	readonly observation: GeometryObservation;
	/** Exact geometry-space placement to install instead of deriving it from the observation. */
	readonly placement?: GeometryResolvedLightSourcePlacement;
	/** Already-accepted execution domains available during geometry collaborator construction. */
	readonly domains?: Algorithm32ExecutionDomains;
}>;

/** Model-space facts for source-relative position resolution. */
type GeometrySourceRelativePositionRequest = Readonly<{
	/** Physical model-space sample position. */
	readonly position: Position;
	/** Geometry-resolved atmosphere coordinate for the sample, when available. */
	readonly atmosphereCoordinate?: AtmosphereCoordinate;
	/** Normalized model-space view direction at the sample, when available. */
	readonly viewDirection?: UnitVector3;
}>;

/** Scene-scale facts for geometry-owned scene/model mapping. */
type GeometrySceneScaleRequest = Readonly<{
	/** Renderer scene-to-physical scale. */
	readonly sceneScale?: SceneScale;
}>;

/** Scene-scale and ground-height facts for geometry-owned ground-offset mapping. */
type GeometryGroundOffsetScenePointRequest = GeometrySceneScaleRequest &
	Readonly<{
		/** Requested height above the geometry-owned ground. */
		readonly heightAboveGround?: SceneDistance;
	}>;

/** Contract that provides configured Algorithm32 geometry facts used by algorithm execution and runtime shader setup. */
interface GeometryModel {
	/** Value that identifies this configured geometry model instance for compatibility and cache keys. */
	readonly id: string;

	/**
	 * Call this method to resolve and install one construction-time atmospheric light-source placement.
	 *
	 * @param request - The candidate source and normalized observation.
	 */
	configureLightSource(request: GeometryLightSourceConfigurationRequest): GeometryResolvedLightSourcePlacement;

	/** Retain the accepted execution domains used by cache reconstruction. */
	configureExecutionDomains?(domains: Algorithm32ExecutionDomains): void;

	/**
	 * Call this method to resolve the finite view ray segment Algorithm32 should integrate.
	 *
	 * @param request - Supplies geometry-owned view ray request facts.
	 * @returns - The resolved view ray segment.
	 */
	resolveViewRaySegment(request: GeometryViewRayRequest): RaySegment;

	/**
	 * Call this method to resolve model-space position into atmosphere coordinates.
	 *
	 * @param position - Supplies the model-space position to resolve.
	 * @returns - The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position: Position): AtmosphereCoordinate;

	/**
	 * Call this method to optionally express a model-space position relative to the geometry-owned ground anchor used for precision-preserving shader reconstruction.
	 *
	 * @param position - Supplies the model-space position.
	 * @returns - The ground-anchor-relative position with units retained as data.
	 */
	resolveGroundRelativePosition?(position: Position): Position;

	/**
	 * Call this method to resolve a model-space path into an atmosphere path for optical depth.
	 *
	 * @param request - Supplies path endpoints, direction, and source/path
	 * limits.
	 * @returns - The atmosphere path.
	 */
	resolveAtmospherePath(request: AtmospherePathRequest): AtmospherePath;

	/**
	 * Call this method to resolve a model-space sample into source-relative coordinates.
	 *
	 * @param request - Supplies position, atmosphere coordinate, and view
	 * direction facts.
	 * @returns - The source-relative position.
	 */
	resolveSourceRelativePosition(request: GeometrySourceRelativePositionRequest): SourceRelativePosition;

	/**
	 * Call this method to resolve a physical sample point into actual position-domain cache nodes and weights. Geometry owns this physical reconstruction; caches never infer it from texture dimensions.
	 *
	 * @param request - Supplies the physical position and its geometry-resolved
	 * atmosphere coordinate. The concrete geometry owns the executable node set.
	 * @returns - The resolved physical position stencil.
	 */
	resolveScatteringCachePositionStencil(
		request: ScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;

	/**
	 * Call this method to resolve the geometry-selected construction-time position lookup. A concrete geometry may retain a containing-bin policy or use the same actual-node interpolation as final-view reconstruction.
	 *
	 * @param request - Supplies the physical position and its geometry-resolved
	 * atmosphere coordinate. The concrete geometry owns the construction lookup.
	 * @returns - The construction-time position stencil.
	 */
	resolveScatteringCacheConstructionPositionStencil(
		request: ScatteringCachePositionStencilRequest,
	): ScatteringCachePositionStencil;

	/**
	 * Call this method to express an outgoing physical direction in the source-relative frame used by a scattering-cache direction domain.
	 *
	 * @param request - Supplies the physical position and outgoing direction.
	 * The concrete geometry owns the source-relative reconstruction frame.
	 * @returns - The framed direction to resolve through the cache domain.
	 */
	expressScatteringCacheDirection(request: ScatteringCacheDirectionRequest): UnitVector3;

	/**
	 * Call this method to resolve an outgoing physical direction into the active scattering-cache direction stencil. The concrete geometry owns the source-relative frame and executable direction-domain reconstruction.
	 *
	 * @param request - Supplies the physical position and outgoing direction.
	 * @returns - The resolved direction-domain stencil.
	 */
	resolveScatteringCacheDirectionStencil(request: ScatteringCacheDirectionRequest): ScatteringCacheDirectionStencil;

	/**
	 * Call this method to resolve the physical ground intersection and outward normal for a geometry-bounded ray. The ground boundary evaluates the BRDF; geometry does not evaluate BRDF values.
	 *
	 * @param viewRay - Supplies the physical ray to test.
	 * @returns - The nearest valid ground hit, or null when the ray misses.
	 */
	resolveGroundIntersection(viewRay: Ray): GroundIntersection | null;

	/**
	 * Call this method to optionally resolve a cache-owned build coordinate into the ray segment used to generate that cache value.
	 *
	 * @param coordinate - Supplies the cache-owned build coordinate.
	 * @returns - The resolved cache build ray segment, or null when the
	 * coordinate has no in-atmosphere contribution.
	 */
	resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;

	/**
	 * Call this method to optionally map an observer-local Three scene point into the geometry's model-space physical position.
	 *
	 * @param point - Supplies the observer-local Three scene point.
	 * @param request - Supplies scene scale facts.
	 * @returns - The model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(point: ScenePosition, request?: GeometrySceneScaleRequest): Position;

	/**
	 * Call this method to optionally map an observer-local Three scene direction into the geometry's model-space direction.
	 *
	 * @param direction - Supplies the observer-local Three scene direction.
	 * @returns - The model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection?(direction: UnitVector3): UnitVector3;

	/**
	 * Call this method to optionally map an app-authored ground offset into the configured Three scene frame before app objects or scene-depth inputs operate on it.
	 *
	 * @param offset - Supplies horizontal scene offset `[x, z]`.
	 * @param request - Supplies scene scale and optional height above ground.
	 * @returns - The configured Three scene point.
	 */
	mapGroundOffsetToScenePoint?(offset: ScenePosition, request?: GeometryGroundOffsetScenePointRequest): ScenePosition;

	/**
	 * Call this method to optionally project a renderer scene point onto the geometry-owned ground receiver along a scene-space direction. Implementations may enforce geometry-local receiver rules so app-authored local shadows cannot choose unrelated far-side ground intersections.
	 *
	 * @param point - Supplies the scene point to project.
	 * @param direction - Supplies the scene-space projection direction.
	 * @param request - Supplies scene scale and optional locality guards.
	 * @returns - The configured Three scene ground point.
	 */
	projectScenePointToGroundAlongDirection?(
		point: ScenePosition,
		direction: UnitVector3,
		request?: GeometryGroundProjectionRequest,
	): ScenePosition;

	/**
	 * Call this method to optionally create geometry-owned Three endpoint objects, including visible ground objects and exact scene-hit/raycast inputs.
	 *
	 * @param request - Supplies scene scale, material, segmentation, and
	 * metadata overrides.
	 * @returns - The geometry-owned Three endpoint objects.
	 */
	createThreeEndpointObjects?(request?: GeometryThreeEndpointObjectsRequest): GeometryThreeEndpointObjects;

	/**
	 * Call this method to optionally resolve the default scene-depth capture cap for geometry-owned endpoints.
	 *
	 * @param request - Supplies optional camera, scene-scale, endpoint extent,
	 * and minimum cap facts.
	 * @returns - The scene-depth cap in Algorithm32 meters.
	 */
	resolveSceneDepthMax?(request?: GeometrySceneDepthMaxRequest): Distance;

	/**
	 * Call this method to optionally contribute geometry-owned shader source, symbols, and bindings from the live geometry owner.
	 *
	 * @param request - Supplies shader setup context.
	 * @returns - The geometry shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}

/** Optional geometry capability required by an enabled celestial source roster. */
interface CelestialGeometryCapability {
	/** Celestial capability family implemented by this geometry. */
	readonly celestialCapabilityFamily: CelestialCapabilityFamily;

	/**
	 * Express a normalized model-space celestial direction in renderer scene axes.
	 * Distant-source renderers require this when the geometry scene frame is not identity.
	 */
	expressCelestialDirectionInScene?(modelDirection: UnitVector3): UnitVector3;

	/**
	 * Call this method to return the static celestial contribution domain owned by this geometry.
	 *
	 * @returns - The geometry-owned celestial contribution domain.
	 */
	describeCelestialContributionDomain(): CelestialContributionDomainDescription;

	/**
	 * Call this method to resolve configured celestial source placements into the geometry model frame.
	 *
	 * @param request - The accepted roster and construction-time observation.
	 * @returns - The geometry-resolved placements in roster order.
	 */
	resolveCelestialPlacements(request: CelestialPlacementResolutionRequest): readonly CelestialResolvedPlacement[];

	/**
	 * Call this method to derive one construction sample for a source-family celestial cache.
	 *
	 * @param request - The domain, placement, and selected cache coordinates.
	 * @returns - The geometry-owned celestial construction sample.
	 */
	createCelestialBuildSample(request: CelestialBuildSampleRequest): CelestialBuildSample;

	/**
	 * Call this method to create immutable query facts for runtime celestial cache lookup.
	 *
	 * @param roster - The accepted celestial source roster.
	 * @param placements - The geometry-resolved placements in roster order.
	 * @returns - The complete geometry-derived query packet.
	 */
	createCelestialQueryPacket(
		roster: CelestialSourceRoster,
		placements: readonly CelestialResolvedPlacement[],
	): CelestialQueryPacket;

	/**
	 * Call this method to contribute the geometry-owned celestial-cache stencil representation.
	 *
	 * @param request - The configured model and complete geometry-derived query packet.
	 * @returns - The geometry-owned stencil type contribution.
	 */
	createCelestialCacheShaderContribution(request: CelestialCacheShaderContributionRequest): ShaderContribution;
}
