/**
 * Registered feature-owned CityCatalog capability.
 */
export interface CityCatalog extends EventBus {
	/**
	 * Call this method to reset owned data and cancel an earlier request before startup.
	 */
	start(): void;

	/**
	 * Call this method after dependency readiness to resolve deployment-aware HTTP transport.
	 */
	ready(): void;

	/**
	 * Call this method to cancel an owned request while preserving an already loaded catalog.
	 */
	stop(): void;

	/**
	 * Call this method to read the catalog's current loading state.
	 *
	 * @returns - Idle, loading, ready, or error.
	 */
	getStatus(): CityCatalogStatus;

	/**
	 * Call this method to load once, share an in-flight request, or retry a failed load.
	 *
	 * @returns - Completion of the current catalog load.
	 */
	load(): Promise<void>;

	/**
	 * Call this method to search the whole index before choosing the highest-ranked results.
	 *
	 * @param query - City name and optional country code, region code, or region-name terms.
	 * @returns - Ranked suggestions retaining every exact city-name match.
	 */
	search(query: string): ConfiguredCity[];

	/**
	 * Call this method to resolve selected-city coordinates independently of result ordering.
	 *
	 * @param id - Stable city identity from a search result.
	 * @returns - Defensive location, or null for an unavailable selection.
	 */
	getLocation(id: string): ConfiguredLocation | null;
}
