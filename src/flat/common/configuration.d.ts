/**
 * Geographic place metadata, independent of city-index row ordering.
 */
type ConfiguredCity = {
	/**
	 * Stable compound identity retained across dataset reordering.
	 */
	id: string;
	/**
	 * City name as supplied by the dataset.
	 */
	name: string;
	/**
	 * Country code as supplied by the dataset.
	 */
	country: string;
	/**
	 * First administrative-area code as supplied by the dataset.
	 */
	admin1: string;
	/**
	 * Optional full administrative-area name from the catalog's region lookup.
	 */
	admin1Name?: string;
};

/**
 * Shared geographic location; observer height remains a separate per-view setting.
 */
type ConfiguredLocation = {
	/**
	 * Latitude in degrees, north positive, within [-90, 90].
	 */
	latitude: number;
	/**
	 * Longitude in degrees, east positive, within [-180, 180].
	 */
	longitude: number;
	/**
	 * Optional city provenance; absent for manually entered coordinates.
	 */
	city?: ConfiguredCity;
};

/**
 * Accepted application properties; missing properties are defaulted by each consuming feature.
 */
type ApplicationConfiguration = {
	/**
	 * Shared location used by all open views when present.
	 */
	location?: ConfiguredLocation;
	/**
	 * Shared instant from animation-loop as integer Unix epoch milliseconds; configuration does not duplicate its ownership.
	 */
	timestamp?: EpochTimestamp;
};

/**
 * Properties identified by the configuration changed event after an accepted update.
 */
type ConfigurationProperty = keyof ApplicationConfiguration;
