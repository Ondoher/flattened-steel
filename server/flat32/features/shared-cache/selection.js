import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Immutable package selected by the server deployment; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = '2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7';
/** Application-owned interpolation selection; retained until deployment approval. */
export const SHARED_PACKAGE_SOLAR_INTERPOLATION = /** @type {const} */ ('linear');
/** Exact selected package report. */
export const SHARED_PACKAGE_REPORT = /** @type {const} */ ({
	path: 'package-set.json',
	byteLength: 3268,
	sha256: 'cfb287edddcbeabb90224af61e6d253fc0ff78b92eb3bb6dc50b758cb3c3ac4e',
});
/** Repository-local immutable deployment destination. */
export const SHARED_PACKAGE_ROOT = fileURLToPath(
	new URL(`../../data/shared-block/${SHARED_PACKAGE_IDENTITY}/`, import.meta.url),
);

/** Called by server startup to authenticate the complete deployed metadata graph.
 *
 * @returns {Promise<DistantSunSharedCachePackageService>} - Authenticated selected service; invalid package bytes reject startup.
 */
export async function createProductionSharedCacheService() {
	return new DistantSunSharedCachePackageService(SHARED_PACKAGE_ROOT, SHARED_PACKAGE_SOLAR_INTERPOLATION).load(
		SHARED_PACKAGE_REPORT,
	);
}
