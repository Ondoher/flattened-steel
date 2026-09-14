import {fileURLToPath} from 'node:url';
import DistantSunSharedCachePackageService from './DistantSunSharedCachePackageService.js';

/** Immutable package selected by the server deployment; selection never mutates package bytes. */
export const SHARED_PACKAGE_IDENTITY = '2243c1ab2c2d529131759b32d72cee2a2e4b32098e1cc450c0d48cf34ed4edc7';
/** Exact selected package report. */
export const SHARED_PACKAGE_REPORT = Object.freeze({
	path: 'package-set.json',
	byteLength: 3268,
	sha256: 'cfb287edddcbeabb90224af61e6d253fc0ff78b92eb3bb6dc50b758cb3c3ac4e',
});
/** Repository-local immutable deployment destination. */
export const SHARED_PACKAGE_ROOT = fileURLToPath(
	new URL(`../../data/shared-block/${SHARED_PACKAGE_IDENTITY}/`, import.meta.url),
);

/** Authenticate the complete deployed metadata graph before serving any selection. */
export async function createProductionSharedCacheService() {
	return new DistantSunSharedCachePackageService(SHARED_PACKAGE_ROOT).load(SHARED_PACKAGE_REPORT);
}
