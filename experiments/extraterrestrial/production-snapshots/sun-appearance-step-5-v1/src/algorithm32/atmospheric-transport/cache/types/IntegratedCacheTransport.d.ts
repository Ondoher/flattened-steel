/** GPU-integrated stored scattering-density transport operation. */
export class IntegratedCacheTransport implements CacheBuildContributor {
	/**
	 * Call this method to create the source-independent fused transport module.
	 * @param context - The resolved stored-field transport operation.
	 * @returns The integrated transport module.
	 */
	createCacheModule(context: CacheBuildContext): CacheBuildModule;
}
