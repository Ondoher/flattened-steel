import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Selected immutable production package, independent of application mounting. */
export const DISTANT_SUN_PACKAGE_IDENTITY = '1e35e0ce4b064690d48ff9639c4c7a1ad557e1eb752716c9f2105a3ac8354e4b';

/** Exact external report authenticated before package access. */
export const DISTANT_SUN_PACKAGE_REPORT = {
	path: 'package-set.json',
	byteLength: 3682,
	sha256: '85d8230697d6ea7ac18ac2a83ac2d526ed59cd9476c65dca3d251a2ebf508d68',
};

/**
 * Call this function to authenticate the current physical package within an explicit data root.
 *
 * @param {string} root - Operational package directory supplied by the application.
 * @returns {Promise<DistantSunSharedCachePackageService>} - Complete authenticated metadata owner.
 */
export function loadDistantSunPackage(root) {
	return new DistantSunSharedCachePackageService(root, 'monotone-cubic', undefined, 'corrected60-sun035').load(
		DISTANT_SUN_PACKAGE_REPORT,
	);
}
