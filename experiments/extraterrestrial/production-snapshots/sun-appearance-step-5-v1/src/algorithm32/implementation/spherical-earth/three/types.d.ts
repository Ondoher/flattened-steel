/** Type that configures an exact spherical Three ground endpoint. */
type ExactSphereGroundObjectConfig = {
	/** Value that stores the sphere radius with its scene unit. */
	readonly radius: SceneDistance;

	/** Value that stores the sphere center with its scene unit. */
	readonly center: ScenePosition;

	/** Value that stores the renderer scene-to-physical scale. */
	readonly sceneScale: SceneScale;

	/** Value that stores optional material/profile id. */
	readonly spectralReferenceId?: string | null;

	/** Value that stores optional object name. */
	readonly name?: string;
};
