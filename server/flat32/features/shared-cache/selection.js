import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Qualified immutable production package; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = '7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99';
/** Exact P2 report accepted by P7. */
export const SHARED_PACKAGE_REPORT = Object.freeze({
	path: 'package-set.json',
	byteLength: 3268,
	sha256: 'eee22091d2f1deb8e992f22be47243a07e7f4bc9462d25ee89683352cca19069',
});
/** Repository-local immutable deployment destination. */
export const SHARED_PACKAGE_ROOT = fileURLToPath(
	new URL(`../../data/shared-block/${SHARED_PACKAGE_IDENTITY}/`, import.meta.url),
);

/** Authenticate the complete deployed metadata graph before serving any selection. */
export async function createProductionSharedCacheService() {
	return new DistantSunSharedCachePackageService(SHARED_PACKAGE_ROOT).load(SHARED_PACKAGE_REPORT);
}
