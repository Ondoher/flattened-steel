/**
 * Value that declares the base owner symbols required by each cache operation.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 *
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
	transport: ['geometry.transportPath', 'cache.outputLayout'],
	accumulate: ['cache.outputLayout'],
};

/**
 * Value that declares the additional capabilities used only by reflective scatter.
 *
 * @type {readonly string[]}
 *
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

/** Fixed position-stencil width used by integrated stored-field transport. */
export const INTEGRATED_CACHE_TRANSPORT_POSITION_TAP_COUNT = 4;

/** Fixed direction-stencil width used by integrated stored-field transport. */
export const INTEGRATED_CACHE_TRANSPORT_DIRECTION_TAP_COUNT = 4;

/** Owner capabilities required by integrated stored-field transport. */
export const INTEGRATED_CACHE_TRANSPORT_REQUIREMENTS = [
	'atmosphere.medium',
	'geometry.cachePosition',
	'geometry.integratedTransportRay',
	'geometry.constructionPositionStencil',
	'geometry.constructionDirectionStencil',
	'cache.storedScatteringDensity',
	'cache.outputLayout',
];
