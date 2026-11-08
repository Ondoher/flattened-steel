import {Service} from '@polylith/core';
import {fileURLToPath} from 'node:url';
import {loadDistantSunPackage, DISTANT_SUN_PACKAGE_IDENTITY} from '../../../common/distant-sun-package.js';

/**
 * Flat-owned cache deployment and authenticated package lifetime.
 *
 * @implements {FlatSphericalCacheService}
 */
export class SphericalCache extends Service {
	/**
	 * Creates an independently deployed cache capability; no other app is required.
	 *
	 * @param {unknown} registry - Owning application registry.
	 * @param {string} [root] - Explicit operational package directory.
	 */
	constructor(
		registry,
		root = process.env.FLAT_DISTANT_SUN_CACHE_ROOT ??
			fileURLToPath(new URL(`../../data/distant-sun-shared/${DISTANT_SUN_PACKAGE_IDENTITY}/`, import.meta.url)),
	) {
		super('spherical-earth-cache', registry);
		this.root = root;
		this.pending = null;
		this.implement(['load']);
	}

	/**
	 * Call this method to share package authentication and permit retry after missing/invalid data.
	 *
	 * @returns {Promise<DistantSunSharedCachePackageService>} - Complete metadata and immutable delivery capability.
	 */
	load() {
		if (!this.pending) {
			this.pending = loadDistantSunPackage(this.root).catch((error) => {
				this.pending = null;
				throw error;
			});
		}
		return this.pending;
	}
}

new SphericalCache();
