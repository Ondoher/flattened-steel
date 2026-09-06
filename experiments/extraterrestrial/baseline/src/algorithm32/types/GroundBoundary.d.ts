/**
 * Provide the configured ground BRDF used during scattering-cache
 * construction.
 */
interface GroundBoundary {
	/**
	 * Identify this configured ground boundary for cache compatibility and
	 * lifecycle content identities.
	 */
	readonly id: string;

	/**
	 * Retain the profile-owned spectral hemispherical reflectance accepted by
	 * this boundary.
	 */
	readonly albedo: SpectralReflectancePacket;

	/**
	 * Return a serializable description of the boundary quantity and BRDF.
	 *
	 * @returns The configured ground-boundary descriptor.
	 */
	describe(): GroundBoundaryDescriptor;

	/**
	 * Evaluate the spectral BRDF at a geometry-owned ground hit.
	 *
	 * @param request - Supplies the hit, direction pair, and requested basis.
	 * @returns The typed spectral BRDF.
	 */
	evaluateBrdf(request: GroundBrdfRequest): SpectralBrdfPacket;
}
