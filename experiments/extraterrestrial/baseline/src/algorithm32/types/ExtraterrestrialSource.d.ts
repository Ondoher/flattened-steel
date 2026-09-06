/**
 * Provide immutable source-owned extraterrestrial radiometry. The atmospheric
 * scattering cache does not consume or invalidate these sources.
 */
interface ExtraterrestrialSource {
	/**
	 * Return the source descriptor and typed spectral measure.
	 *
	 * @returns The configured extraterrestrial-source descriptor.
	 */
	describe(): ExtraterrestrialSourceDescriptor;
}

/** Resolve geometric visibility without reading source brightness or raster coverage. */
interface ExtraterrestrialVisibilityResolver {
	/**
	 * Resolve geometric visibility for one exact source ray.
	 *
	 * @param ray - Supplies the exact source ray to test.
	 * @returns The geometric visibility result.
	 */
	resolve(ray: ExactExtraterrestrialSourceRay): ExtraterrestrialVisibilityResult;
}

/** Sample Algorithm32 view transmittance at an exact extraterrestrial ray. */
interface ExtraterrestrialTransmittanceSampler {
	/**
	 * Sample view transmittance for one exact source ray.
	 *
	 * @param ray - Supplies the exact source ray to sample.
	 * @returns The sampled extraterrestrial transmittance.
	 */
	sample(ray: ExactExtraterrestrialSourceRay): ExtraterrestrialTransmittanceSample;
}

/**
 * Transport one unresolved point source: resolve exact visibility and
 * transmittance once, then distribute the transmitted irradiance through a
 * normalized response. Implementations must account for off-frame response.
 */
interface PointExtraterrestrialSourceAccumulator {
	/**
	 * Accumulate one unresolved source into pixel contributions.
	 *
	 * @param request - Supplies the source, transport, and response facts.
	 * @returns The accumulated pixel contributions.
	 */
	accumulate(request: PointExtraterrestrialSourceRequest): readonly ExtraterrestrialPixelContribution[];
}

/**
 * Transport one resolved extended source with directional quadrature. Each
 * sample receives its own visibility and transmittance evaluation.
 */
interface ExtendedExtraterrestrialSourceIntegrator {
	/**
	 * Integrate one resolved source into pixel contributions.
	 *
	 * @param request - Supplies the source and directional quadrature facts.
	 * @returns The integrated pixel contributions.
	 */
	integrate(request: ExtendedExtraterrestrialSourceRequest): readonly ExtraterrestrialPixelContribution[];
}
