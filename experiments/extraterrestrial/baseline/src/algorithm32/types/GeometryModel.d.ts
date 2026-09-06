/**
 * Provide configured Algorithm32 geometry facts used by algorithm execution
 * and runtime shader setup.
 */
interface GeometryModel {
	/**
	 * Identify this configured geometry model instance for compatibility and
	 * cache keys.
	 */
	readonly id: string;

	/**
	 * Return a serializable descriptor for compatibility checks.
	 *
	 * @returns The configured geometry descriptor.
	 */
	describe(): GeometryModelDescriptor;

	/**
	 * Return the model-space frame descriptor for this geometry.
	 *
	 * @returns The geometry frame descriptor.
	 */
	getFrameDescriptor(): GeometryFrameDescriptor;

	/**
	 * Resolve the finite view ray segment Algorithm32 should integrate.
	 *
	 * @param request - Supplies geometry-owned view ray request facts.
	 * @returns The resolved view ray segment.
	 */
	resolveViewRaySegment(request: GeometryViewRayRequest): RaySegment;

	/**
	 * Resolve model-space position into atmosphere coordinates.
	 *
	 * @param position - Supplies the model-space position to resolve.
	 * @returns The atmosphere coordinate.
	 */
	resolveAtmosphereCoordinate(position: Position): AtmosphereCoordinate;

	/**
	 * Optionally express a model-space position relative to the geometry-owned
	 * ground anchor used for precision-preserving shader reconstruction.
	 *
	 * @param position - Supplies the model-space position.
	 * @returns The ground-anchor-relative position with units retained as data.
	 */
	resolveGroundRelativePosition?(position: Position): Position;

	/**
	 * Resolve a model-space path into an atmosphere path for optical depth.
	 *
	 * @param request - Supplies path endpoints, direction, and source/path
	 * limits.
	 * @returns The atmosphere path.
	 */
	resolveAtmospherePath(request: AtmospherePathRequest): AtmospherePath;

	/**
	 * Resolve a model-space sample into source-relative coordinates.
	 *
	 * @param request - Supplies position, atmosphere coordinate, and view
	 * direction facts.
	 * @returns The source-relative position.
	 */
	resolveSourceRelativePosition(request: unknown): SourceRelativePosition;

	/**
	 * Resolve a physical sample point into actual position-domain cache nodes and
	 * weights. Geometry owns this physical reconstruction; caches never infer it
	 * from texture dimensions.
	 *
	 * @param request - Supplies the physical position and its geometry-resolved
	 * atmosphere coordinate. The concrete geometry owns the executable node set.
	 * @returns The resolved physical position stencil.
	 */
	resolveScatteringCachePositionStencil(request: ScatteringCachePositionStencilRequest): ScatteringCachePositionStencil;

	/**
	 * Resolve the geometry-selected construction-time position lookup. A
	 * concrete geometry may retain a containing-bin policy or use the same
	 * actual-node interpolation as final-view reconstruction.
	 *
	 * @param request - Supplies the physical position and its geometry-resolved
	 * atmosphere coordinate. The concrete geometry owns the construction lookup.
	 * @returns The construction-time position stencil.
	 */
	resolveScatteringCacheConstructionPositionStencil(
		request: ScatteringCachePositionStencilRequest
	): ScatteringCachePositionStencil;

	/**
	 * Express an outgoing physical direction in the source-relative frame used
	 * by a scattering-cache direction domain.
	 *
	 * @param request - Supplies the physical position and outgoing direction.
	 * The concrete geometry owns the source-relative reconstruction frame.
	 * @returns The framed direction to resolve through the cache domain.
	 */
	expressScatteringCacheDirection(request: ScatteringCacheDirectionRequest): UnitVector3;

	/**
	 * Resolve an outgoing physical direction into the active scattering-cache
	 * direction stencil. The concrete geometry owns the source-relative frame
	 * and executable direction-domain reconstruction.
	 *
	 * @param request - Supplies the physical position and outgoing direction.
	 * @returns The resolved direction-domain stencil.
	 */
	resolveScatteringCacheDirectionStencil(
		request: ScatteringCacheDirectionRequest
	): ScatteringCacheDirectionStencil;

	/**
	 * Resolve the physical ground intersection and outward normal for a
	 * geometry-bounded ray. The ground boundary evaluates the BRDF; geometry
	 * does not evaluate BRDF values.
	 *
	 * @param ray - Supplies the physical ray to test.
	 * @returns The nearest valid ground hit, or null when the ray misses.
	 */
	resolveGroundIntersection(ray: Ray): GroundIntersection | null;

	/**
	 * Optionally resolve a cache-owned build coordinate into the ray segment
	 * used to generate that cache value.
	 *
	 * @param coordinate - Supplies the cache-owned build coordinate.
	 * @returns The resolved cache build ray segment, or null when the
	 * coordinate has no in-atmosphere contribution.
	 */
	resolveCacheBuildRay(coordinate: CacheBuildCoordinate): RaySegment | null;

	/**
	 * Optionally map an observer-local Three scene point into the geometry's
	 * model-space physical position.
	 *
	 * @param point - Supplies the observer-local Three scene point.
	 * @param request - Supplies scene scale facts.
	 * @returns The model-space position.
	 */
	mapObserverLocalScenePointToModelPosition(
		point: ScenePosition,
		request?: {
			/** Store the scene-to-model scale. */
			readonly sceneScale?: SceneScale;
		}
	): Position;

	/**
	 * Optionally map an observer-local Three scene direction into the
	 * geometry's model-space direction.
	 *
	 * @param direction - Supplies the observer-local Three scene direction.
	 * @returns The model-space direction.
	 */
	mapObserverLocalSceneDirectionToModelDirection?(
		direction: UnitVector3
	): UnitVector3;

	/**
	 * Optionally map an app-authored ground offset into the configured Three
	 * scene frame before app objects or scene-depth inputs operate on it.
	 *
	 * @param offset - Supplies horizontal scene offset `[x, z]`.
	 * @param request - Supplies scene scale and optional height above ground.
	 * @returns The configured Three scene point.
	 */
	mapGroundOffsetToScenePoint?(
		offset: ScenePosition,
		request?: {
			/** Store the scene-to-model scale. */
			readonly sceneScale?: SceneScale;
			/** Store the requested height above the ground. */
			readonly heightAboveGround?: SceneDistance;
		}
	): ScenePosition;

	/**
	 * Optionally project a renderer scene point onto the geometry-owned ground
	 * receiver along a scene-space direction. Implementations may enforce
	 * geometry-local receiver rules so app-authored local shadows cannot choose
	 * unrelated far-side ground intersections.
	 *
	 * @param point - Supplies the scene point to project.
	 * @param direction - Supplies the scene-space projection direction.
	 * @param request - Supplies scene scale and optional locality guards.
	 * @returns The configured Three scene ground point.
	 */
	projectScenePointToGroundAlongDirection?(
		point: ScenePosition,
		direction: UnitVector3,
		request?: GeometryGroundProjectionRequest
	): ScenePosition;

	/**
	 * Optionally create geometry-owned Three endpoint objects, including visible
	 * ground objects and exact scene-hit/raycast inputs.
	 *
	 * @param request - Supplies scene scale, material, segmentation, and
	 * metadata overrides.
	 * @returns The geometry-owned Three endpoint objects.
	 */
	createThreeEndpointObjects?(request: GeometryThreeEndpointObjectsRequest): GeometryThreeEndpointObjects;

	/**
	 * Optionally resolve the default scene-depth capture cap for
	 * geometry-owned endpoints.
	 *
	 * @param request - Supplies optional camera, scene-scale, endpoint extent,
	 * and minimum cap facts.
	 * @returns The scene-depth cap in Algorithm32 meters.
	 */
	resolveSceneDepthMax?(request: GeometrySceneDepthMaxRequest): Distance;

	/**
	 * Optionally contribute geometry-owned shader source, symbols, and bindings
	 * for the active descriptor.
	 *
	 * @param request - Supplies the active shader descriptor and setup context.
	 * @returns The geometry shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}
