/**
 * Supported spherical ground visual-receiver mesh kind.
 *
 * - **"sphere"** - The complete spherical visual receiver.
 * - **"local-spherical-patch"** - The locally sampled spherical visual receiver.
 */
type SphericalGroundVisualMeshKind = 'sphere' | 'local-spherical-patch';

/** Type that configures the optional spherical ground visual receiver mesh. */
type SphericalGroundVisualMeshRequest = {
	/** Selected visual mesh shape. */
	readonly kind?: SphericalGroundVisualMeshKind;

	/**
	 * Override local patch half width in scene units.
	 */
	readonly xExtent?: SceneDistance;

	/**
	 * Override local patch minimum forward/depth coordinate in scene units.
	 */
	readonly zMin?: SceneDistance;

	/**
	 * Override local patch maximum forward/depth coordinate in scene units.
	 */
	readonly zMax?: SceneDistance;

	/**
	 * Lift local patch vertices outward from the spherical surface in scene
	 * units. This is useful for visual-only receiver overlays that should not
	 * z-fight the canonical ground receiver.
	 */
	readonly surfaceLift?: SceneDistance;
};

/** Type that configures spherical Earth atmosphere geometry. */
type SphericalEarthGeometryConfig = {
	/** Value that stores ground radius with its physical unit. */
	readonly bottomRadius: Distance;

	/** Value that stores top atmosphere radius with its physical unit. */
	readonly topRadius: Distance;

	/** Value that stores observer height above the ground radius with its physical unit. */
	readonly observerHeight?: Distance;

	/** Value that stores observer up direction. */
	readonly observerUpDirection?: UnitVector3;

	/** Value that stores how Three scene directions map into spherical model space. */
	readonly sceneFrame?: SphericalEarthSceneFrameConfig | null;

	/** Value that stores the selected spherical cache position-domain node count. */
	readonly cacheAltitudeBinCount?: number;

	/** Value that stores minimum cache altitude with its physical unit. */
	readonly cacheBoundaryAltitude?: Distance;

	/** Value that stores source-path optical-depth integration interval count. */
	readonly sourceTransmittanceIntervalCount?: number;
};

/**
 * Type that selects how Three scene axes map into spherical model space.
 *
 * - **"observer-local"** - Use the frame derived from the observer up direction.
 * - **"model-space"** - Use Three scene axes directly as model-space axes.
 */
type SphericalEarthSceneFrameKind = 'observer-local' | 'model-space';

/** Type that configures scene-direction basis mapping for spherical shader setup. */
type SphericalEarthSceneFrameConfig = {
	/**
	 * Use observer-local axes or direct model-space axes.
	 */
	readonly kind: SphericalEarthSceneFrameKind;
};

/** Type that stores a normalized scene-to-model frame owned by spherical geometry. */
type SphericalEarthSceneFrame = Readonly<{
	/** Value that identifies how Three scene axes map into spherical model space. */
	kind: SphericalEarthSceneFrameKind;
	/** Value that stores the model-space up direction. */
	up: UnitVector3;
	/** Value that stores the model-space right direction. */
	right: UnitVector3;
	/** Value that stores the model-space forward direction. */
	forward: UnitVector3;
}>;

/** Type that stores normalized executable spherical geometry configuration. */
type SphericalEarthGeometryConfiguration = Readonly<{
	/** Value that stores the normalized ground radius. */
	bottomRadius: Distance;
	/** Value that stores the normalized top-atmosphere radius. */
	topRadius: Distance;
	/** Value that stores the normalized observer height above ground. */
	observerHeight: Distance;
	/** Value that stores the observer's model-space up direction. */
	observerUpDirection: UnitVector3;
	/** Value that stores the derived observer-local frame. */
	observerLocalSceneFrame: SphericalEarthSceneFrame;
	/** Value that stores the selected executable scene-to-model frame. */
	sceneFrame: SphericalEarthSceneFrame;
	/** Value that stores the direction from a sample toward the source. */
	directionToSource: UnitVector3;
	/** Value that stores the construction-time observation used to resolve the source. */
	observation: GeometryObservation;
	/** Value that stores the selected cache altitude-bin count. */
	cacheAltitudeBinCount: number;
	/** Value that stores the normalized minimum cache altitude. */
	cacheBoundaryAltitude: Distance;
	/** Value that stores the source-path integration interval count. */
	sourceTransmittanceIntervalCount: number;
}>;

/** Intrinsic spherical configuration retained before source placement is resolved. */
type SphericalEarthGeometryShapeConfiguration = Readonly<
	Omit<SphericalEarthGeometryConfiguration, 'directionToSource' | 'observation'>
>;

/** Exact one-shot construction binding retained by spherical geometry. */
type SphericalEarthGeometryLightSourceBinding = Readonly<{
	/** Exact configured source object. */
	lightSource: GeometryConfigurableLightSource;
	/** Exact normalized observation. */
	observation: GeometryObservation;
}>;
