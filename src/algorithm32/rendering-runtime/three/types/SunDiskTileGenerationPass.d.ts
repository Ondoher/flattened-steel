/** Fixed construction facts for one source-local continuous-coverage Sun tile pass. */
type SunDiskTileGenerationPassConfiguration = Readonly<{
	/** Three namespace that owns the renderer resources. */
	readonly THREE: typeof import('three');
	/** Accepted distant or finite celestial source roster. */
	readonly roster: CelestialSourceRoster;
	/** Geometry that owns the resolved source placement. */
	readonly geometry: GeometryModel & CelestialGeometryCapability;
	/** Fixed clock and location snapshot for this configuration. */
	readonly observation: GeometryObservation;
	/** Live perspective camera captured at frame boundaries. */
	readonly camera: ShaderRuntimeCelestialViewCamera;
	/** Initial unit-bearing viewport dimensions. */
	readonly viewportSize: PixelSize;
	/** Conversion between physical meters and renderer scene units. */
	readonly sceneScale: SceneScale;
	/** Optional non-fatal frame diagnostic logger. */
	readonly logger?: Console | null;
}>;
