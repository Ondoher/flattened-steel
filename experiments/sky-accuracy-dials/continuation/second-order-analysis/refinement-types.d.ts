/** Scalar complete view and its inner-only numerical allowance. */
type SkySecondOrderOuterValue = Readonly<{
	/** Complete physical second-order estimate in spectral radiance watts. */ value: number;
	/** Incident plus final-view uncertainty; angular/outer errors are excluded. */ innerAllowance: number;
}>;

/** Numerical value with the complete allowance appropriate to its stated scope. */
type SkySecondOrderAccuracyValue = Readonly<{
	/** Spectral radiance in W m^-2 sr^-1 nm^-1. */ value: number;
	/** Complete declared empirical uncertainty for this comparison, in the same units. */ allowance: number;
}>;

/** Exact outer configurations used by the prospectively registered comparison. */
type SkySecondOrderOuterComparison = Readonly<{
	/** Original complete Gaussian4 estimate. */ gauss4: SkySecondOrderOuterValue;
	/** Independent four-panel Simpson estimate, absent until completed. */ simpson4?: SkySecondOrderOuterValue;
	/** Complete eight-node-per-interval Gaussian estimate. */ gauss8?: SkySecondOrderOuterValue;
	/** Complete eight-panel-per-interval Simpson estimate. */ simpson8?: SkySecondOrderOuterValue;
}>;

/** One prospective outer-response predicate, separate from reference adequacy. */
type SkySecondOrderOuterCheck = Readonly<{
	/** Registered prediction identity. */ id: string;
	/** Explicit pass/failure or missing-target state. */ state: SkyVolumeCheckState;
	/** Observed absolute comparison in spectral radiance watts. */ differenceWatts: number | null;
	/** Exact frozen right-hand side, including original inner allowances. */ thresholdWatts: number | null;
}>;

/** Error-reduction test against an already admitted physical component reference. */
type SkySecondOrderDialAccuracy = Readonly<{
	/** Signed candidate-minus-reference numerical difference. */ candidateErrorWatts: number;
	/** Signed control-minus-reference numerical difference. */ controlErrorWatts: number;
	/** Upper empirical absolute-error envelope for the candidate. */ candidateErrorUpperWatts: number;
	/** Lower empirical absolute-error envelope for the control. */ controlErrorLowerWatts: number;
	/** Complete registered right-hand side, 20% of the lower control error. */ thresholdWatts: number;
	/** Passed reduction, failed prediction, or inadequately resolved control error. */ state: SkyVolumeCheckState;
}>;
