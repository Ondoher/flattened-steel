/** Type that configures an exact flat Three ground endpoint. */
type ExactFlatGroundObjectConfig = {
	/** Value that stores the plane center with its scene unit. */
	readonly center?: ScenePosition;

	/** Value that stores the plane width with its scene unit. */
	readonly width: SceneDistance;

	/** Value that stores the plane depth with its scene unit. */
	readonly depth: SceneDistance;

	/** Value that stores the renderer scene-to-physical scale. */
	readonly sceneScale: SceneScale;

	/** Value that stores optional material/profile id. */
	readonly spectralReferenceId?: string | null;

	/** Value that stores optional object name. */
	readonly name?: string;
};
