/** Contract that provides the configured ground BRDF used during scattering-cache construction. */
interface GroundBoundary {
	/** Value that identifies this configured ground boundary for cache compatibility and lifecycle content identities. */
	readonly id: string;

	/** Value that identifies the executable boundary model. */
	readonly model: string;

	/**
	 * Retain the profile-owned spectral hemispherical reflectance accepted by
	 * this boundary.
	 */
	readonly albedo: SpectralReflectancePacket;

	/**
	 * Call this method to evaluate the spectral BRDF at a geometry-owned ground hit.
	 *
	 * @param request - Supplies the hit, direction pair, and requested basis.
	 * @returns - The typed spectral BRDF.
	 */
	evaluateBrdf(request: GroundBrdfRequest): SpectralBrdfPacket;
}
/** Inputs for one ground-boundary BRDF evaluation. */
type GroundBrdfRequest = Readonly<{
	/** Value that stores the geometry-resolved ground hit. */
	hit: GroundIntersection;
	/** Value that stores the direction from the hit toward the sampled incoming field. */
	incomingDirection: UnitVector3;
	/** Value that stores the direction from the hit toward the reflected-radiance receiver. */
	outgoingDirection: UnitVector3;
	/** Value that stores the exact requested spectral basis. */
	spectralBasis: SpectralBasis;
}>;
