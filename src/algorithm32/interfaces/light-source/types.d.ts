/** Atmospheric-light capability configured by the selected geometry. */
interface GeometryConfigurableLightSource {
	/** Placement family accepted by this source. */
	readonly geometryPlacementKind: LightSourcePlacementKind;

	/**
	 * Call this method to install one geometry-resolved construction-time placement.
	 *
	 * @param placement - The normalized placement resolved by geometry.
	 */
	configureGeometryPlacement(placement: GeometryResolvedLightSourcePlacement): void;
}

/** Optional overrides for configuring a Three shadow object tree. */
type LightSourceThreeShadowConfigurationRequest = Readonly<{
	/** Optional cast-shadow selection. */
	readonly castShadow?: boolean;
	/** Optional receive-shadow selection. */
	readonly receiveShadow?: boolean;
	/** Optional descendant-traversal selection. */
	readonly includeDescendants?: boolean;
	/** Optional source shadow-policy override. */
	readonly shadowPolicy?: string;
	/** Optional source identity override. */
	readonly sourceKey?: string;
	/** Optional renderer layer index. */
	readonly layerIndex?: number;
}>;

/** Contract that provides the configured Algorithm32 light-source facts used by algorithm execution and runtime shader setup. */
interface LightSourceModel {
	/** Value that identifies this configured light-source model instance for compatibility and cache keys. */
	readonly id: string;

	/** Top-of-atmosphere irradiance density retained before and after geometry placement. */
	readonly sourceIrradiance?: SpectralIrradiancePacket;

	/**
	 * Call this method to create this source kind's cache controller for one renderer attachment. The configured source remains renderer-independent; the returned controller owns source-specific cache construction and publication.
	 *
	 * @param request - Supplies the renderer-owned backend and optional scheduler.
	 * @returns - The source-specific cache controller.
	 */
	createCacheController(request: CacheControllerRequest): CacheController;

	/**
	 * Call this method to sample direct lighting at one geometry-resolved source-relative position.
	 *
	 * @param request - Supplies source-relative position, atmosphere
	 * coordinate, and spectral basis facts.
	 * @returns - The direct lighting sample.
	 */
	sampleDirectLighting(request: unknown): DirectLightingSample;

	/**
	 * Call this method to resolve the source-owned path limit for sample-to-source transmittance.
	 *
	 * @param request - Supplies source-relative position and direct lighting
	 * facts.
	 * @returns - The source path limit.
	 */
	resolveSourcePathLimit(request: unknown): SourcePathLimit;

	/**
	 * Call this method to optionally contribute light-source-owned shader source, symbols, and bindings for the active shader build.
	 *
	 * @param request - Supplies direct accepted shader build facts.
	 * @returns - The light-source shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];

	/**
	 * Call this method to optionally resolve source-owned neutral renderer scene-light scales for a local observer or scene frame.
	 *
	 * @param request - Supplies source-specific scene-light facts.
	 * @returns - The resolved neutral scene-light scales.
	 */
	resolveSceneLightScales?(request: LightSourceSceneLightScalesRequest): LightSourceSceneLightScales;

	/**
	 * Call this method to add or create optional renderer-lighting helpers for endpoint scene rendering. If the request supplies a scene, the source may mount the created lights itself.
	 *
	 * @param request - Supplies runtime renderer-lighting setup facts.
	 * @returns - The created renderer-lighting objects.
	 */
	addSceneLighting?(request: LightSourceThreeLightingRequest): LightSourceThreeLightingObjects;

	/**
	 * Call this method to optionally configure an app-authored Three object or mesh tree to cast and receive source-owned renderer shadows.
	 *
	 * @param object - Supplies the Three object to configure.
	 * @param request - Supplies optional shadow flag overrides.
	 * @returns - The configured Three object.
	 */
	configureThreeShadowObject?(object: unknown, request?: LightSourceThreeShadowConfigurationRequest): unknown;
}
/** Geometry-derived finite-source support extrema consumed by source-owned amplitude partitions.
 * Lengths are Euclidean source-center distances; neither field values nor spectral data are stored here.
 */
type SourceDistanceBounds = Readonly<{
	/** Nearest admitted source-center distance, finite and positive. */ readonly minimumDistance: Distance;
	/** Farthest admitted source-center distance, strictly above the minimum. */ readonly maximumDistance: Distance;
}>;
