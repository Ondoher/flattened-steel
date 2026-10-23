import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Immutable package selected by the server deployment; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = 'ccd1432c9647feab02f134288a9d2899f8d701182793f12361c1451de9f94970';
/** Application-owned interpolation selected by the approved deployment. */
export const SHARED_PACKAGE_SOLAR_INTERPOLATION = /** @type {const} */ ('monotone-cubic');
/** Historical P4 memory measurement retained for diagnostics; never a runtime admission gate. */
export const SHARED_PACKAGE_TRANSITION_QUALIFICATION = /** @type {const} */ ({
	evidenceId: 'sha256:be6251513e360b6b57bc8f0f9db899849e9e9701038767e5d8fd5a827bd75f0b',
	targetId: 'NVIDIA GeForce RTX 2060 / Chrome 154 / ANGLE D3D11',
	maximumBytes: 859963392,
});
/** Exact selected package report. */
export const SHARED_PACKAGE_REPORT = /** @type {const} */ ({
	path: 'package-set.json',
	byteLength: 3870,
	sha256: '30545b387b3d66e1f828514af8d28a10ab5f77f1193c6980178bc867ecaa864c',
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
	return new DistantSunSharedCachePackageService(
		SHARED_PACKAGE_ROOT,
		SHARED_PACKAGE_SOLAR_INTERPOLATION,
		SHARED_PACKAGE_TRANSITION_QUALIFICATION,
		'corrected60-sun035',
	).load(SHARED_PACKAGE_REPORT);
}
