/** Three-component scene vector used only by spherical scene adaptation. */
type SphericalSceneVector3 = readonly [number, number, number];

/**
 * Type used by SphericalGeometrySceneAdapter to map a scene point to its physical model position.
 *
 * @param point - The scene point coordinates.
 * @param metersPerSceneUnit - The physical meters represented by one scene unit.
 * @returns - The model-space position in meters.
 *
 */
type SphericalScenePointToModelPosition =
	/**
	 * Called by spherical scene point to model position to handle one invocation of the declared operation.
	 * @param point - The point value accepted by the operation.
	 * @param metersPerSceneUnit - The meters per scene unit value accepted by the operation.
	 * @returns - The callback result returned to its caller.
	 */ (point: readonly number[], metersPerSceneUnit: number) => readonly number[];

/** Non-negative sphere-ray intersection used by spherical ground projection. */
type SphericalSphereRayHit = Readonly<{
	/** Distance from the ray origin in scene units. */
	readonly distance: number;
	/** Intersection point in scene units. */
	readonly point: SphericalSceneVector3;
}>;

/** Untrusted property packet used while accepting a spherical visual-mesh request. */
type SphericalGroundVisualMeshCandidate = {
	/** Candidate mesh kind. */
	readonly kind?: unknown;
	/** Candidate local-patch half width. */
	readonly xExtent?: unknown;
	/** Candidate local-patch minimum depth coordinate. */
	readonly zMin?: unknown;
	/** Candidate local-patch maximum depth coordinate. */
	readonly zMax?: unknown;
	/** Candidate visual surface lift. */
	readonly surfaceLift?: unknown;
};

/** Normalized spherical visual-mesh request used by endpoint construction. */
type SphericalGroundVisualMesh = Readonly<{
	/** Selected mesh kind. */
	readonly kind: SphericalGroundVisualMeshKind;
	/** Optional local-patch half width. */
	readonly xExtent?: SceneDistance;
	/** Optional local-patch minimum depth coordinate. */
	readonly zMin?: SceneDistance;
	/** Optional local-patch maximum depth coordinate. */
	readonly zMax?: SceneDistance;
	/** Optional visual surface lift. */
	readonly surfaceLift?: SceneDistance;
}>;

/** Internal request for sampled local spherical ground-patch construction. */
type SphericalLocalGroundPatchRequest = Readonly<{
	/** Sphere radius in scene units. */
	readonly radius: SceneDistance;
	/** Horizontal segment count. */
	readonly widthSegments: number;
	/** Depth segment count. */
	readonly heightSegments: number;
	/** Observer altitude in scene units. */
	readonly observerAltitude: SceneDistance;
	/** Sphere center in scene units. */
	readonly center: ScenePosition;
	/** Normalized visual-mesh request. */
	readonly groundVisualMesh: SphericalGroundVisualMesh;
}>;

/** Minimal Three camera packet used while resolving scene depth. */
type SphericalThreeCameraCandidate = Readonly<{
	/** Optional Three position value. */
	readonly position?: unknown;
}>;
