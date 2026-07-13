/** Cache operations object. */
export class CacheOperations implements CacheBuildContributor {
	/**
	 * Call this method to create cache module.
	 * @param context - The execution context accepted by the operation.
	 * @returns - The result produced by the operation.
	 */ createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
