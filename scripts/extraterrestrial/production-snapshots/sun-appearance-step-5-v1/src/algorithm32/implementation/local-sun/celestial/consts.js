/** Logical field identifier for Flat finite-Sun surface radiance. */
export const FLAT_FINITE_SUN_FIELD_ID = 'flat-finite-sun-surface-radiance';

/** GPU pass identifier for Flat finite-Sun surface radiance. */
export const FLAT_FINITE_SUN_PASS_ID = 'flat-finite-sun-surface-radiance-pass';

/** Exact scalar storage selected for Flat finite-Sun surface radiance. */
export const FLAT_FINITE_SUN_STORAGE = /** @type {const} */ ({
	format: 'R32F',
	width: 1,
	height: 1,
	layers: 15,
});

/** Runtime sampler name for the Flat finite-Sun radiance field. */
export const FLAT_FINITE_SUN_SAMPLER_NAME = 'uFlatFiniteSunRadianceCache';
