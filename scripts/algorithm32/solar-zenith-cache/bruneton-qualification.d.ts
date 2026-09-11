/** Authenticated reference capture identity; the production profile owns the calculation's solar zenith. */
type BrunetonQualificationScene = {
	/** Stable scene identifier. */ id: string;
	/** Local EDT capture time on 2013-05-27. */ time: string;
	/** Measured symmetry fit, degrees in the benchmark's horizontal frame. */ fittedAzimuthDegrees: number;
};

/** One midpoint interval of the qualified Q30 view equation. */
type BrunetonQualificationSample = {
	/** Interval length in meters. */ step: number;
	/** Midpoint altitude in meters above the spherical ground. */ altitude: number;
	/** Expanded logical cache indexes and dimensionless reconstruction weights. */ taps: {
		index: number;
		weight: number;
	}[];
};
