import { DistantSunCache } from './DistantSunCache.js';

/** Own distant-Sun GPU cache construction for exactly one runtime attachment. */
export class DistantSunCacheController {
	/** Create one controller without taking ownership of its backend. */
	constructor(request: Readonly<{
		source: DistantSunCacheSource;
		backend: CacheGpuBackend;
		scheduler?: CacheBuildScheduler;
	}>);

	/** Store the atomically published active cache. */
	readonly active: DistantSunCache | null;

	/** Construct or reuse one complete cumulative scattering cache. */
	createScatteringCache(
		request: ScatteringCacheBuildRequest,
	): Promise<DistantSunCache>;

	/** Cancel staging and release the active cache without owning the backend. */
	dispose(): void;
}
