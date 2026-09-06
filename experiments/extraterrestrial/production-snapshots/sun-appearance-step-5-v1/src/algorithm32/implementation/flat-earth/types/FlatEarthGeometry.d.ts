/** Ordered dimensionless node-placement fractions used only by FlatEarthGeometry. */
type FlatEarthGeometryNodePlacementFractions = readonly (readonly [number, number])[];

/** Normalized physical ray in meters used only by flat atmosphere-path sampling. */
type FlatEarthGeometryNormalizedMeterRay = Readonly<{
	/** Physical ray origin in meters. */
	readonly origin: readonly [number, number, number];
	/** Normalized physical ray direction. */
	readonly direction: UnitVector3;
}>;
