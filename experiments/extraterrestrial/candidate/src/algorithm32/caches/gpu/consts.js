/**
 * Declare the base owner symbols required by each cache operation.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 */
export const CACHE_OPERATION_REQUIREMENTS = {
	'primary-j1': [],
	'direct-l1': [],
	scatter: [
		'atmosphere.medium',
		'atmosphere.phase',
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'lightSource.direction',
		'cache.outputLayout',
	],
	transport: [
		'geometry.transportPath',
		'cache.outputLayout',
	],
	accumulate: ['cache.outputLayout'],
};

/**
 * Declare the additional capabilities used only by reflective scatter.
 *
 * @type {readonly string[]}
 */
export const REFLECTIVE_SCATTER_REQUIREMENTS = [
	'atmosphere.finiteSegmentTransmittance',
	'atmosphere.sourceTransmittance',
	'geometry.groundReflection',
	'ground.reflectance',
	'lightSource.irradiance',
];

/** Fix the geometry-to-reflective-scatter construction-position stencil width. */
export const CACHE_GROUND_CONSTRUCTION_POSITION_TAP_COUNT = 4;
