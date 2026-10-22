import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Immutable package selected by the server deployment; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = '8d185961cab8beb1e461cd1256be2875bb9a99e9f39e515b9288b92e5d2f6d37';
/** Application-owned interpolation selected by the approved deployment. */
export const SHARED_PACKAGE_SOLAR_INTERPOLATION = /** @type {const} */ ('monotone-cubic');
/** Measured P4 target qualification; the browser admits it only on the matching GPU and browser major. */
export const SHARED_PACKAGE_TRANSITION_QUALIFICATION = /** @type {const} */ ({
	evidenceId: 'sha256:be6251513e360b6b57bc8f0f9db899849e9e9701038767e5d8fd5a827bd75f0b',
	targetId: 'NVIDIA GeForce RTX 2060 / Chrome 154 / ANGLE D3D11',
	maximumBytes: 859963392,
});
/** Exact selected package report. */
export const SHARED_PACKAGE_REPORT = /** @type {const} */ ({
	path: 'package-set.json',
	byteLength: 3061,
	sha256: '76fcb62e8e70eececbbb7213591534042a38b8b28cfd577fda529de95034f5f7',
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
