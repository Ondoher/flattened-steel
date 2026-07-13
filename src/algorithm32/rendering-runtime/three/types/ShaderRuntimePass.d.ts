/** Private raw shader-material surface owned by the runtime pass. */
type ShaderRuntimePassMaterial = {
	/** Call this method to release the material when disposal is available. */
	dispose?(): void;
};

/** Private fullscreen geometry surface owned by the runtime pass. */
type ShaderRuntimePassGeometry = {
	/** Call this method to release the geometry when disposal is available. */
	dispose?(): void;
};

/** Private fullscreen mesh object owned by the runtime pass. */
type ShaderRuntimePassMesh = object;

/** Private scene surface owned by the runtime pass. */
type ShaderRuntimePassScene = {
	/**
	 * Call this method to attach the fullscreen mesh.
	 *
	 * @param mesh - The private fullscreen mesh.
	 * @returns - No return value.
	 */
	add(mesh: ShaderRuntimePassMesh): void;
};

/** Private orthographic camera object owned by the runtime pass. */
type ShaderRuntimePassCamera = object;

/** Private Three resource-construction surface owned by the runtime pass. */
type ShaderRuntimePassResourceNamespace = {
	/** Raw shader-material constructor used for the runtime program. */
	readonly RawShaderMaterial: new (configuration: object) => ShaderRuntimePassMaterial;
	/** Plane-geometry constructor used for the fullscreen surface. */
	readonly PlaneGeometry: new (width: number, height: number) => ShaderRuntimePassGeometry;
	/** Mesh constructor used for the fullscreen draw. */
	readonly Mesh: new (
		geometry: ShaderRuntimePassGeometry,
		material: ShaderRuntimePassMaterial,
	) => ShaderRuntimePassMesh;
	/** Scene constructor used for the private fullscreen draw. */
	readonly Scene: new () => ShaderRuntimePassScene;
	/** Orthographic-camera constructor used for the private fullscreen draw. */
	readonly OrthographicCamera: new (
		left: number,
		right: number,
		topCoordinate: number,
		bottom: number,
		near: number,
		farPlaneDistance: number,
	) => ShaderRuntimePassCamera;
	/** Optional GLSL 3 renderer constant. */
	readonly GLSL3?: unknown;
};

/** Runtime construction data for one ordered celestial generation shader stage. */
type ShaderRuntimeCelestialGenerationPassConfiguration = Readonly<{
	/** Declarative standard-pipeline stage to install. */
	readonly stage: CelestialGenerationStageDescription;
	/** Exact view compatibility required by the staged outputs. */
	readonly view: CelestialRenderViewSnapshot;
	/** Renderer-owned persistent and transient targets indexed by stage output id. */
	readonly outputs: Readonly<
		Record<string, CelestialGenerationOutputResource | CelestialGenerationTransientResource>
	>;
	/** Optional cancellation checked before publication boundaries. */
	readonly signal?: AbortSignal;
}>;
