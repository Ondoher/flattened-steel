/** Stable identifier for the shared omitted-boundary module without source-kind coupling. */
export const CANONICAL_BLACK_GROUND_MODULE_ID = 'algorithm32-canonical-black-ground-scatter-module-v1';

/** Canonical zero-reflection cache-module definition for omitted reflective ground. */
export const CANONICAL_BLACK_GROUND_CACHE_MODULE_DEFINITION = /** @type {CacheBuildModuleDefinition} */ ({
	id: CANONICAL_BLACK_GROUND_MODULE_ID,
	owner: 'ground',
	provides: ['ground.reflectance'],
	requires: [],
	blocks: [],
	bindings: [],
});
