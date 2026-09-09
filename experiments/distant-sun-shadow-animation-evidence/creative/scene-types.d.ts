/** Deterministic repository random generator supplied by the animation owner. */
interface ObservatoryRandomSource {
	/** Call this method to reset the explicit replay seed. */
	randomize(seed: number): void;
	/** Call this method to obtain the next unit-interval value. */
	random(): number;
}

/** Geometry-owned spherical surface mapping consumed by procedural construction. */
interface ObservatoryGroundGeometry {
	/** Call this method to obtain the geometry-owned ground visual and exact raycast surface. */
	createThreeEndpointObjects(request: GeometryThreeEndpointObjectsRequest): GeometryThreeEndpointObjects;
	/** Call this method to map horizontal scene coordinates and radial elevation. */
	mapGroundOffsetToScenePoint(offset: ScenePosition, request: GeometryGroundOffsetScenePointRequest): ScenePosition;
}

/** Scene dependencies and deterministic construction parameters. */
type ObservatorySceneConfiguration = Readonly<{
	/** Three namespace shared with the rendering owner. */
	three: object;
	/** Scene that receives the owned observatory group. */
	scene: object;
	/** Physical spherical surface mapper. */
	geometry: ObservatoryGroundGeometry;
	/** Repository-owned deterministic random generator. */
	random: ObservatoryRandomSource;
	/** Explicit integer construction seed retained in provenance. */
	seed: number;
	/** Sunrise direction in east/up/south scene coordinates. */
	sunriseDirectionScene: readonly number[];
	/** Sunset direction in east/up/south scene coordinates. */
	sunsetDirectionScene: readonly number[];
}>;

/** Observable procedural scene and draw-call facts. */
type ObservatorySceneDescription = Readonly<{
	/** Human-readable artistic identity. */
	name: string;
	/** Deterministic seed. */
	seed: number;
	/** Authored object count before static geometry batching. */
	authoredObjectCount: number;
	/** Ordinary meshes used by the current capture pipeline. */
	meshCount: number;
	/** Triangle count across the scene. */
	triangleCount: number;
	/** Ordinary meshes casting into the shared Sun shadow map. */
	shadowCasterCount: number;
	/** Ordinary meshes receiving direct-light shadows. */
	shadowReceiverCount: number;
	/** Radial extent of the sandstone terraces, in meters. */
	plazaRadiusMeters: number;
	/** Hero center in scene units. */
	heroCenterScene: readonly number[];
	/** Compatible scene-input policy. */
	sceneInputPolicy: string;
}>;

/** Shared distant-Sun lighting dependencies and local shadow coverage. */
type DesertSceneLightingConfiguration = Readonly<{
	/** Three namespace shared with the rendering owner. */
	three: object;
	/** Parent receiving the owned source-light group. */
	parent: object;
	/** Lambertian evaluator constructor from the same module graph as the receiver packets. */
	neutralLambertianClass: new () => ObservatoryLambertianEvaluator;
	/** Neutral reflectance constant supplied by that same module graph. */
	neutralReflectance: number;
	/** Width and height of the single orthographic shadow map, in meters. */
	shadowExtentMeters?: number;
	/** Shadow target in scene-axis coordinates expressed in meters. */
	shadowFocusMeters?: readonly number[];
	/** Strength of the unoccluded lower-hemisphere sand-reflection approximation, in [0,1]; zero disables it. */
	groundBounceStrength?: number;
}>;

/** Renderer-owned neutral Lambertian spectral evaluator used without duplicating packet classes. */
interface ObservatoryLambertianEvaluator {
	/** Call this method to evaluate the renderer's compatible spectral packets. */
	evaluate(request: NeutralLambertianSceneLightingRequest): NeutralLambertianSceneLightingResponse;
}

/** Renderer-owned spectral projection required by the cloned physical-to-renderer bridge. */
interface ObservatoryColorProjection {
	/** Optional Figure 1 display constants supplied by the selected production color model. */
	readonly displayConstants?: Figure1DisplayConstants;
	/** Call this method to project a physical spectrum into signed linear-sRGB channels. */
	radianceToLinearSrgb(radiance: SpectralRadiancePacket): readonly number[];
}

/** Observable resource and spectral provenance of the cloned lighting owner. */
type DesertSceneLightingDescription = Readonly<{
	/** Owned light count. */
	sourceLightCount: number;
	/** Algorithm32 diffuse-irradiance environment light count. */
	ambientLightCount: number;
	/** Algorithm32 direct-normal Sun light count. */
	directionalLightCount: number;
	/** Owned directional-light target count. */
	targetCount: number;
	/** Current environment light intensity. */
	ambientIntensity: number;
	/** Unmodified Algorithm32 upper-hemisphere light intensity. */
	skyAmbientIntensity: number;
	/** Intensity of the separate approximate sand-reflection hemisphere. */
	groundBounceIntensity: number;
	/** Configured strength of the local reflected-light approximation. */
	groundBounceStrength: number;
	/** Current direct light intensity. */
	directionalIntensity: number;
	/** Whether the renderer has allocated the required 4096-square shadow map. */
	shadowMapsInstalled: boolean;
	/** Number of allocated shadow maps. */
	shadowMapCount: number;
	/** Allocated shadow width, in pixels. */
	shadowMapWidth: number;
	/** Allocated shadow height, in pixels. */
	shadowMapHeight: number;
	/** Shared default shadow layer count. */
	shadowLayerCount: number;
	/** Physical coverage of the shadow camera, in meters. */
	shadowExtentMeters: number;
	/** Latest Algorithm32 receiver-light measurement identity. */
	receiverLightIdentity: string | null;
	/** Cloned spectral bridge identity. */
	lightingPolicy: string;
}>;
