/**
 * Registered app-owned stellar source capability.
 */
export interface StellarCatalog extends EventBus {
	/**
	 * Call this method to read a loaded star's canonical J2000 direction.
	 *
	 * @param memberId - Stable catalog member identity.
	 * @returns - Independent direction for geometry-owned placement.
	 */
	getDirection(memberId: string): UnitVector3;

	/**
	 * Call this method to share an authenticated load without sharing renderer resources.
	 *
	 * @param signal - Optional caller lifetime; cancellation does not cancel another view.
	 * @returns - Complete production source and Algorithm32 human presentation filters.
	 */
	load(signal?: AbortSignal): Promise<StellarResources>;
}
