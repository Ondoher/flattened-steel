export const SPHERICAL_GROUND_BOUNDARY_ROUNDOFF_ULPS = 32;

/** Store the accepted executable source-frame basis tolerance. */
export const SCATTERING_CACHE_BASIS_TOLERANCE = 1e-10;

/** Select the alternate Fibonacci reference near its primary pole. */
export const FIBONACCI_REFERENCE_SWITCH_DOT = 0.95;

/** @type {UnitVector3} */
export const SCATTERING_CACHE_X_AXIS = [1, 0, 0];
/** @type {UnitVector3} */
export const SCATTERING_CACHE_Y_AXIS = [0, 1, 0];
/** @type {UnitVector3} */
export const SCATTERING_CACHE_Z_AXIS = [0, 0, 1];

/** Store the shared numerical tolerance for flat plane and dome intersections. */
export const FLAT_GEOMETRY_BOUNDARY_EPSILON = 1e-9;

/** Store the identity transform used before a renderer supplies live matrices. */
export const FLAT_GEOMETRY_IDENTITY_MATRIX4 = [
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,
];

/** Store the selected observer-local mapping for z-up flat model space. */
/** @type {{ up: UnitVector3, right: UnitVector3, forward: UnitVector3 }} */
export const FLAT_OBSERVER_LOCAL_SCENE_FRAME = {
	up: [0, 0, 1],
	right: [1, 0, 0],
	forward: [0, -1, 0],
};

/** Select the production local-cache altitude placement over the configured top. */
/** @type {readonly (readonly [number, number])[]} */
export const FLAT_LOCAL_CACHE_DEFAULT_Z_NODE_FRACTIONS = [
	[0, 1],
	[1, 400],
	[1, 200],
	[1, 100],
	[3, 200],
	[3, 100],
	[1, 20],
	[7, 100],
	[1, 10],
	[7, 50],
	[1, 5],
	[1, 4],
	[3, 8],
	[1, 2],
	[5, 8],
	[3, 4],
	[7, 8],
	[99, 100],
	[1, 1],
];

/** Select the production local-cache radial placement over the configured bound. */
/** @type {readonly (readonly [number, number])[]} */
export const FLAT_LOCAL_CACHE_DEFAULT_RHO_NODE_FRACTIONS = [
	[0, 1],
	[1, 96],
	[1, 48],
	[1, 24],
	[1, 12],
	[1, 8],
	[1, 4],
	[3, 8],
	[1, 2],
	[5, 8],
	[3, 4],
	[7, 8],
	[15, 16],
	[47, 48],
	[1, 1],
];

/**
 * Supply a generic geometry-only path discretization when a direct caller
 * omits one. Source/cache construction always passes its selected count.
 */
export const FLAT_ATMOSPHERE_PATH_DEFAULT_INTERVAL_COUNT = 10;

/**
 * Select the rotationally arbitrary but deterministic radial representative
 * used at the source subpoint. It is independent of observers and view caps.
 *
 * @type {UnitVector3}
 */
export const FLAT_LOCAL_CACHE_RHO_ZERO_RADIAL_DIRECTION = [1, 0, 0];

/** Identify the reusable construction capabilities supplied by flat geometry. */
export const FLAT_GEOMETRY_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': [
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
	],
	'direct-l1': [
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
	],
	scatter: [
		'geometry.cachePosition',
		'geometry.sourceFrame',
	],
	transport: [
		'geometry.transportPath',
	],
	accumulate: [],
};

/** Identify the flat hit and construction-index reflective capability. */
export const FLAT_GEOMETRY_GROUND_REFLECTION_SYMBOL =
	'geometry.groundReflection';

/** Declare the base construction capabilities supplied by spherical geometry. */
export const SPHERICAL_GEOMETRY_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': [
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
	],
	'direct-l1': [
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
	],
	scatter: [
		'geometry.cachePosition',
		'geometry.sourceFrame',
	],
	transport: [
		'geometry.transportPath',
	],
	accumulate: [],
};

/** Identify the spherical hit and retained-index reflective capability. */
export const SPHERICAL_GEOMETRY_GROUND_REFLECTION_SYMBOL =
	'geometry.groundReflection';
