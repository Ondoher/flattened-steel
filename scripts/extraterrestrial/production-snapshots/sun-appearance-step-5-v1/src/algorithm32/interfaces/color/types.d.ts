/** Contract that provides caller-owned conversion from Algorithm32 spectral output to display-facing color data. */
interface Color {
	/** Value that identifies this configured color conversion instance for compatibility checks. */
	readonly id: string;

	/**
	 * Call this method to convert one spectral sample into display-facing color values. The returned sample contains display values derived from one already-completed spectral radiance packet without mutating Algorithm32 spectral facts.
	 *
	 * @param request - Supplies the spectral sample and display conversion
	 * context.
	 * @returns - The converted display color sample.
	 */
	convert(request: ColorConversionRequest): ColorSample;

	/**
	 * Call this method to project path radiance through E8, then combine it with the captured scene RGB through the pinned production display-boundary approximation.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	composeSceneLinearSrgb(request: SceneDisplayCompositionRequest): readonly [number, number, number];

	/**
	 * Call this method to compose the captured scene and atmospheric path at the display boundary, then apply the declared final display mapping.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	composeSceneDisplayRgb(request: SceneDisplayCompositionRequest): readonly [number, number, number];

	/**
	 * Call this method to optionally contribute display-conversion shader source, symbols, and bindings for the active shader build.
	 *
	 * @param request - Supplies direct accepted shader build facts.
	 * @returns - The color shader contribution or contributions.
	 */
	createShaderContribution?(request: ShaderContributionRequest): ShaderContribution | readonly ShaderContribution[];
}
/** Inputs needed to convert Algorithm32 spectral output to display-facing color data. */
type ColorConversionRequest = {
	/** Value that stores completed spectral radiance aligned to the active spectral basis. */
	radiance: SpectralRadiancePacket;
};

/**
 * Color-space interpretation of captured scene display channels.
 *
 * - **"linear-srgb"** - Renderer-linear sRGB channel values.
 * - **"display-rgb"** - Display-encoded RGB channel values.
 */
type SceneDisplayColorSpace = 'linear-srgb' | 'display-rgb';

/** Type that describes the production display-boundary composition of spectral atmospheric path radiance over the renderer-captured scene RGB. */
type SceneDisplayCompositionRequest = {
	/** Value that stores spectral radiance added along the view path. */
	pathRadiance: SpectralRadiancePacket;

	/** Value that stores spectral transmittance accumulated inside the atmosphere. */
	transmittance: SpectralTransmittancePacket;

	/** Value that stores the captured scene RGB supplied to the display compositor. */
	sceneDisplayRgb: readonly [number, number, number];

	/** Value that identifies whether the captured values are renderer-linear sRGB or are already display encoded. */
	sceneColorSpace?: SceneDisplayColorSpace;

	/**
	 * Bypass scene attenuation for a background/no-endpoint path.
	 */
	applySceneTransmittance?: boolean;
};
/** Display-facing color values produced from Algorithm32 spectral output. */
type ColorSample = {
	/** Value that stores display color channels in the converter's output color space. */
	channels: readonly number[];

	/** Value that stores the output color space used by the channel values. */
	colorSpace: string;
};
