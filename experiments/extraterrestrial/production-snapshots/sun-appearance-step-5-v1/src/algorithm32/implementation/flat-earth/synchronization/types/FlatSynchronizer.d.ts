/** Accepted orbit facts used to construct one synchronized position packet. */
type FlatSynchronizerPositionRequest = {
	/** Calibration mode represented by the position. */
	readonly mode: FlatSynchronizationMode;

	/** Latitude at the daily orbit anchor. */
	readonly startLatitude: Angle;

	/** Longitude at the daily orbit anchor. */
	readonly startLongitude: Angle;

	/** Daily orbit anchor as an ISO timestamp. */
	readonly startTime: string;

	/** Clockwise orbit angle elapsed since the anchor. */
	readonly orbitAngle: Angle;

	/** Signed elapsed time from the anchor. */
	readonly elapsed: Duration;
};

/** UTC world anchor used by flat-Sun synchronization calculations. */
type FlatSynchronizerWorldAnchor = {
	/** Latitude where the standard Sun is overhead for the UTC date. */
	readonly startLatitude: Angle;

	/** Greenwich longitude for the daily world anchor. */
	readonly startLongitude: Angle;

	/** Greenwich apparent solar-noon instant for the UTC date. */
	readonly startTime: Date;
};
