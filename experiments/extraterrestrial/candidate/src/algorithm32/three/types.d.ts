/**
 * Configure an exact spherical Three ground endpoint.
 */
type ExactSphereGroundObjectConfig = {
	/**
	 * Store the sphere radius with its scene unit.
	 */
	readonly radius: SceneDistance;

	/**
	 * Store the sphere center with its scene unit.
	 */
	readonly center: ScenePosition;

	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale: SceneScale;

	/**
	 * Store optional material/profile id.
	 */
	readonly spectralReferenceId?: string | null;

	/**
	 * Store optional object name.
	 */
	readonly name?: string;
};

/**
 * Configure an exact flat Three ground endpoint.
 */
type ExactFlatGroundObjectConfig = {
	/**
	 * Store the plane center with its scene unit.
	 */
	readonly center?: ScenePosition;

	/**
	 * Store the plane width with its scene unit.
	 */
	readonly width: SceneDistance;

	/**
	 * Store the plane depth with its scene unit.
	 */
	readonly depth: SceneDistance;

	/**
	 * Store the renderer scene-to-physical scale.
	 */
	readonly sceneScale: SceneScale;

	/**
	 * Store optional material/profile id.
	 */
	readonly spectralReferenceId?: string | null;

	/**
	 * Store optional object name.
	 */
	readonly name?: string;
};

type ThreeCacheBackendRequest = Readonly<{
	THREE: typeof import("three");
	renderer: import("three").WebGLRenderer;
}>;
