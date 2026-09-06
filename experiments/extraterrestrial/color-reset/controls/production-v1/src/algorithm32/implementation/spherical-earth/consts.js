/** Floating-point ULP allowance for spherical ground-boundary intersections. */
export const SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS = 32;

/** Spherical distant-Sun and stellar-point-set celestial capability family. */
export const SPHERICAL_CELESTIAL_CAPABILITY_FAMILY = /** @type {const} */ ('spherical-sun-stars-radial-v1');

/** Stable spherical celestial `(h,u)` domain identifier. */
export const SPHERICAL_CELESTIAL_DOMAIN_ID = 'spherical-celestial-hu-domain-v1';

/**
 * Accepted spherical celestial receiver-altitude fractions of atmosphere height.
 *
 * These retain the qualified 0, 250, 500, 750, 1,000, 5,000, 10,000,
 * 15,000, 25,000, 35,000, 42,500, 50,000, and 60,000 meter nodes for the
 * standard 60 km atmosphere while preserving the same normalized lattice for
 * another accepted spherical atmosphere height.
 */
export const SPHERICAL_CELESTIAL_ALTITUDE_FRACTIONS = [
	0,
	1 / 240,
	1 / 120,
	1 / 80,
	1 / 60,
	1 / 12,
	1 / 6,
	1 / 4,
	5 / 12,
	7 / 12,
	17 / 24,
	5 / 6,
	1,
];

/** Accepted horizon-normalized spherical celestial direction coordinates. */
export const SPHERICAL_CELESTIAL_DIRECTION_COORDINATES = [
	0, 0.03125, 0.0625, 0.09375, 0.125, 0.25, 0.5, 0.75, 0.875, 0.9375, 1,
];

/** Identity matrix for default spherical geometry shader bindings. */
export const SPHERICAL_GEOMETRY_IDENTITY_MATRIX4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * Direct model-space scene frame for spherical geometry.
 *
 * @type {SphericalEarthSceneFrame}
 */
export const SPHERICAL_MODEL_SPACE_SCENE_FRAME = {
	kind: 'model-space',
	up: [0, 1, 0],
	right: [1, 0, 0],
	forward: [0, 0, 1],
};

/** Accepted executable source-frame basis tolerance. */
export const SCATTERING_CACHE_BASIS_TOLERANCE = 1e-10;

/** Dot-product threshold for the alternate Fibonacci reference axis. */
export const FIBONACCI_REFERENCE_SWITCH_DOT = 0.95;

/**
 * Positive x axis for spherical scattering-cache frames.
 *
 * @type {UnitVector3}
 */
export const SCATTERING_CACHE_X_AXIS = [1, 0, 0];
/**
 * Positive y axis for spherical scattering-cache frames.
 *
 * @type {UnitVector3}
 */
export const SCATTERING_CACHE_Y_AXIS = [0, 1, 0];
/**
 * Positive z axis for spherical scattering-cache frames.
 *
 * @type {UnitVector3}
 */
export const SCATTERING_CACHE_Z_AXIS = [0, 0, 1];

/** Construction capabilities supplied by spherical geometry for each cache pass. */
export const SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': ['geometry.cachePosition', 'geometry.sourceFrame', 'geometry.sourcePath'],
	'direct-l1': ['geometry.cachePosition', 'geometry.sourceFrame', 'geometry.sourcePath'],
	scatter: ['geometry.cachePosition', 'geometry.sourceFrame'],
	transport: [
		'geometry.cachePosition',
		'geometry.integratedTransportRay',
		'geometry.constructionPositionStencil',
		'geometry.constructionDirectionStencil',
	],
	accumulate: [],
};

/** Spherical hit and retained-index reflective capability symbol. */
export const SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL = 'geometry.groundReflection';
