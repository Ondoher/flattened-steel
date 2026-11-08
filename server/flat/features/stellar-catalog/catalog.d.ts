/**
 * Transport-neutral authenticated operational package capability.
 */
export interface StellarCatalog extends EventBus {
	/**
	 * Call this method to load a complete package or retry after an operational failure.
	 *
	 * @param kind - Catalog or human presentation data; omission selects the catalog.
	 * @returns - Authenticated package inventory.
	 */
	load(kind?: FlatStellarPackageKind): Promise<ReadonlyMap<string, FlatStellarAsset>>;
}
