/**
 * Calibration mode for a flat-world synchronized local Sun position.
 *
 * - **"world"** - UTC world calibration anchored to Greenwich apparent solar noon.
 * - **"closest"** - Caller-supplied closest-approach calibration.
 */
type FlatSynchronizationMode = 'world' | 'closest';

/** Caller-supplied closest-approach point for flat-Sun synchronization. */
type FlatSynchronizationClosestPoint = Readonly<{
	/** Closest-approach latitude. */
	latitude: Angle;
	/** Closest-approach longitude. */
	longitude: Angle;
}>;

/** Flat-world synchronized local Sun position. */
type FlatSynchronizedPosition = {
	/** Calibration mode used to produce this position. */
	readonly mode: FlatSynchronizationMode;

	/** Resolved flat Sun latitude. */
	readonly latitude: Angle;

	/** Resolved flat Sun longitude. */
	readonly longitude: Angle;

	/** Latitude where the standard Sun is overhead for the UTC date. */
	readonly startLatitude: Angle;

	/** Daily orbit anchor longitude. */
	readonly startLongitude: Angle;

	/** Orbit anchor as an ISO timestamp. */
	readonly startTime: string;

	/** Orbit angle elapsed since the anchor. */
	readonly orbitAngle: Angle;

	/** Signed elapsed time from the anchor. */
	readonly elapsed: Duration;

	/** Fixed daily orbit period. */
	readonly orbitPeriod: Duration;
};
