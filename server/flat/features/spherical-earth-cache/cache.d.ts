/**
 * Registered immutable package capability, independent of route presentation.
 */
export interface FlatSphericalCacheService extends EventBus {
	/**
	 * Call this method to obtain authenticated package operations.
	 *
	 * @returns - Initialized package owner, or rejection after a load failure.
	 */
	load(): Promise<DistantSunSharedCachePackageService>;
}
