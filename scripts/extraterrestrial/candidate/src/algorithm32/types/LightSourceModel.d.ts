/**
 * Provide the configured Algorithm32 light-source facts used by algorithm
 * execution and runtime shader setup.
 */
interface LightSourceModel {
	/**
	 * Identify this configured light-source model instance for compatibility and
	 * cache keys.
	 */
	readonly id: string;

	/**
	 * Return a serializable descriptor for compatibility checks.
	 *
	 * @returns The configured light-source descriptor.
	 */
	describe(): LightSourceModelDescriptor;

	/**
	 * Create this source kind's cache controller for one renderer attachment.
	 * The configured source remains renderer-independent; the returned
	 * controller owns source-specific cache construction and publication.
	 *
	 * @param request - Supplies the renderer-owned backend and optional scheduler.
	 * @returns The source-specific cache controller.
	 */
	createCacheController(request: CacheControllerRequest): CacheController;

	/**
	 * Sample direct lighting at one geometry-resolved source-relative position.
	 *
	 * @param request - Supplies source-relative position, atmosphere
	 * coordinate, and spectral basis facts.
	 * @returns The direct lighting sample.
	 */
	sampleDirectLighting(request: unknown): DirectLightingSample;

	/**
	 * Resolve the source-owned path limit for sample-to-source transmittance.
	 *
	 * @param request - Supplies source-relative position and direct lighting
	 * facts.
	 * @returns The source path limit.
	 */
	resolveSourcePathLimit(request: unknown): SourcePathLimit;

	/**
	 * Optionally contribute light-source-owned shader source, symbols, and
	 * bindings for the active descriptor.
	 *
	 * @param request - Supplies the active shader descriptor and setup context.
	 * @returns The light-source shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];

	/**
	 * Optionally resolve source-owned neutral renderer scene-light scales for a
	 * local observer or scene frame.
	 *
	 * @param request - Supplies source-specific scene-light facts.
	 * @returns The resolved neutral scene-light scales.
	 */
	resolveSceneLightScales?(request: LightSourceSceneLightScalesRequest): LightSourceSceneLightScales;

	/**
	 * Add or create optional renderer-lighting helpers for endpoint scene
	 * rendering. If the request supplies a scene, the source may mount the
	 * created lights itself.
	 *
	 * @param request - Supplies runtime renderer-lighting setup facts.
	 * @returns The created renderer-lighting objects.
	 */
	addSceneLighting?(request: LightSourceThreeLightingRequest): LightSourceThreeLightingObjects;

	/**
	 * Optionally configure an app-authored Three object or mesh tree to cast
	 * and receive source-owned renderer shadows.
	 *
	 * @param object - Supplies the Three object to configure.
	 * @param request - Supplies optional shadow flag overrides.
	 * @returns The configured Three object.
	 */
	configureThreeShadowObject?(object: unknown, request?: {
		/** Store the cast shadow. */
		readonly castShadow?: boolean;
		/** Store the receive shadow. */
		readonly receiveShadow?: boolean;
		/** Store the include descendants. */
		readonly includeDescendants?: boolean;
		/** Identify the shadow policy. */
		readonly shadowPolicy?: string;
		/** Store the source key. */
		readonly sourceKey?: string;
	}): unknown;
}
