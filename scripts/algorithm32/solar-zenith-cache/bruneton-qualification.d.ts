/** Authenticated reference capture identity; the production profile owns the calculation's solar zenith. */
type BrunetonQualificationScene = {
	/** Stable scene identifier. */ id: string;
	/** Local EDT capture time on 2013-05-27. */ time: string;
	/** Measured symmetry fit, degrees in the benchmark's horizontal frame. */ fittedAzimuthDegrees: number;
};

/** Explicit scope for a diagnostic Q30 preparation, distinct from full benchmark qualification. */
type BrunetonQualificationPreparationOptions = Readonly<{
	/** Explicit ordered packet scene IDs for a bounded diagnostic; omission retains the full 17-scene requirement. */
	sceneIds?: readonly string[];
}>;

/** One weighted cache value in the caller-declared linear or cubic storage layout. */
type BrunetonQualificationTap = {
	/** Scalar index within one wavelength's Float32 rows. */ index: number;
	/** Dimensionless reconstruction weight. */ weight: number;
};

/** Solar cubic reconstruction at one altitude, after W27 directional interpolation. */
type BrunetonQualificationCubicAltitude = {
	/** Linear altitude weight, applied after solar interpolation. */ weight: number;
	/** Dimensionless solar interval fraction in [0,1]. */ fraction: number;
	/** Directional taps before the lower knot; omitted only at the physical lower endpoint. */ previous?: BrunetonQualificationTap[];
	/** Directional taps at the lower solar knot. */ lower: BrunetonQualificationTap[];
	/** Directional taps at the upper solar knot. */ upper: BrunetonQualificationTap[];
	/** Directional taps after the upper knot; omitted only at the physical upper endpoint. */ next?: BrunetonQualificationTap[];
};

/** One midpoint interval of the qualified Q30 view equation and its exclusive reconstruction layout. */
type BrunetonQualificationSample = {
	/** Interval length in meters. */ step: number;
	/** Midpoint altitude in meters above the spherical ground. */ altitude: number;
} & (
	| {
			/** Expanded scene logical indexes and dimensionless linear weights. */ taps: BrunetonQualificationTap[];
			/** Linear samples do not carry cubic reconstruction. */ cubic?: never;
	  }
	| {
			/** Shared unique-direction indexes grouped by solar knot and altitude. */ cubic: BrunetonQualificationCubicAltitude[];
			/** Cubic samples do not carry collapsed linear weights. */ taps?: never;
	  }
);
