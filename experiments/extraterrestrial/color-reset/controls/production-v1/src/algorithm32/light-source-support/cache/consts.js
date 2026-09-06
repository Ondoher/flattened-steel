/** Value that stores the executable production path-integration interval count. */
export const DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT = 15;

/** Value that identifies supported first-release cumulative cache maxima. */
export const SUPPORTED_CACHE_SCATTERING_ORDERS = [1, 2, 4];

/**
 * Direct cache-construction options for the default N4 graph.
 *
 *  @type {CacheConstructionOptions}
 */
export const DEFAULT_CACHE_CONSTRUCTION_OPTIONS = {
	transportIntervalCount: DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT,
	maximumScatteringOrder: 4,
};
