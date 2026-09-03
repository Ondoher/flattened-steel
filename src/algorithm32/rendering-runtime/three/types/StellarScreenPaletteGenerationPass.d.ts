/** Fixed construction facts for the standard-pipeline stellar generation pass. */
type StellarScreenPaletteGenerationPassConfiguration = Readonly<{
	/** Three namespace that owns all renderer resources. */
	readonly THREE: typeof import('three');
	/** Immutable stellar source and generation-stage owner. */
	readonly source: StellarScreenPaletteSource;
	/** Geometry that owns fixed-observation transform and projection GLSL. */
	readonly geometry: GeometryModel & StellarScreenPaletteGeometryCapability;
	/** Exact fixed observation configured on geometry. */
	readonly observation: GeometryObservation;
	/** Live perspective camera captured at frame boundaries. */
	readonly camera: ShaderRuntimeCelestialViewCamera;
	/** Initial unit-bearing viewport dimensions. */
	readonly viewportSize: PixelSize;
	/** Exact live Color, filter, and receiver-light compatibility facts. */
	readonly getPresentationCompatibility?: () => StellarPresentationCompatibility;
	/** Optional non-fatal frame diagnostic logger. */
	readonly logger?: Console | null;
}>;

/** Renderer-private extension of one opaque published output resource. */
type StellarScreenPaletteThreeOutputResource = CelestialGenerationOutputResource &
	Readonly<{
		/** Three texture sampled by the later standard-pipeline consumer. */
		readonly texture: unknown;
	}>;
