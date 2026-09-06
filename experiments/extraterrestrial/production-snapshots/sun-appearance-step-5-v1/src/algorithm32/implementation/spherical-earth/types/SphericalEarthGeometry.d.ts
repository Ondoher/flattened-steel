/** Normalized physical ray used only by spherical atmosphere-path sampling. */
type SphericalAtmospherePathRay = Readonly<{
	/** Physical ray origin in meters. */
	readonly origin: readonly [number, number, number];
	/** Normalized physical ray direction. */
	readonly direction: UnitVector3;
}>;
