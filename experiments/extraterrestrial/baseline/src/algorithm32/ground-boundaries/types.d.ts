/** Configure one spatially uniform Lambertian ground boundary. */
type UniformLambertianGroundBoundaryOptions = Readonly<{
	/** Identify this explicitly configured boundary. */
	readonly id?: string;
	/** Supply the profile-owned spectral hemispherical reflectance. */
	readonly albedo: SpectralReflectancePacket;
}>;
