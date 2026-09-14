/** Sparse three-order species fields in capture coordinate order. */
type SkyHigherDensitySpeciesFields = Readonly<{
	/** Pure Rayleigh J2, J3 and J4 density or lighting arrays. */ rayleigh: readonly Float32Array[];
	/** Pure Mie J2, J3 and J4 density or lighting arrays. */ mie: readonly Float32Array[];
}>;
/** Separate raw first order and Float32 higher-order species left folds. */
type SkyDensityOrderFields = Readonly<{
	/** Exact unaltered captured J1 field. */ first: Float32Array;
	/** Zero, J2, J2+J3 and (J2+J3)+J4, rounded after each addition. */ rayleigh: readonly Float32Array[];
	/** Corresponding separate Mie accumulation. */ mie: readonly Float32Array[];
}>;
