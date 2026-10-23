import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Immutable package selected by the server deployment; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = '1edb5237d6ecaa161225e4b76892e996071acba47a524a82dc34e584e2931ec7';
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
	byteLength: 3682,
	sha256: 'd995b259539895acadefe2fcdc0c29a14fe429214ec5f80f78e5e4eb4d511445',
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
