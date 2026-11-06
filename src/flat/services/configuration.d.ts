/**
 * Application-wide configuration capability: owns location and delegates current time to animation-loop.
 * The changed event supplies a defensive snapshot and an array of ConfigurationProperty names.
 */
interface ConfigurationService extends EventBus {
	/**
	 * Call this method to read accepted properties, leaving consumer-owned defaults unresolved.
	 *
	 * @returns - Defensive configuration snapshot.
	 */
	get(): ApplicationConfiguration;

	/**
	 * Call this method to replace the shared location with valid geographic coordinates.
	 *
	 * @param location - Geographic coordinates and optional city identity.
	 * @returns - Whether the accepted location changed.
	 * @throws {RangeError} - Coordinates are nonfinite or outside geographic bounds.
	 */
	setLocation(location: ConfiguredLocation): boolean;

	/**
	 * Call this method to seek the shared animation clock to a timestamp.
	 *
	 * @param timestamp - Integer milliseconds since the Unix epoch, independent of entry/display format.
	 * @returns - Whether the accepted timestamp changed.
	 * @throws {RangeError} - The timestamp is not an integer within the JavaScript Date range.
	 */
	setTimestamp(timestamp: EpochTimestamp): boolean;
}
