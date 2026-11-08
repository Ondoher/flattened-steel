/**
 * Registered feature-owned stellar source capability.
 */
export interface StellarCatalog extends EventBus {
	/**
	 * Call this method to share an authenticated load without sharing renderer resources.
	 *
	 * @param signal - Optional caller lifetime; cancellation does not cancel another view.
	 * @returns - Complete production source and Algorithm32 human presentation filters.
	 */
	load(signal?: AbortSignal): Promise<FlatEarthStellarResources>;
}
