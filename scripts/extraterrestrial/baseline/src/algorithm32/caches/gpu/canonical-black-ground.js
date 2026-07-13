import {
	CANONICAL_BLACK_GROUND_MODULE_ID,
	createCacheBuildModule,
} from './cacheBuildContracts.js';

/**
 * Create the shared zero-reflection construction module selected when a cache
 * build omits a reflective ground boundary.
 *
 * @param {CacheBuildContext} _context - Supplies one resolved scatter pass.
 * @returns {CacheBuildModule} Return the canonical black-ground module.
 */
export function createCanonicalBlackGroundCacheModule(_context) {
	return createCacheBuildModule({
		id: CANONICAL_BLACK_GROUND_MODULE_ID,
		owner: 'ground',
		provides: ['ground.reflectance'],
		requires: [],
		blocks: [],
		bindings: [],
	});
}
