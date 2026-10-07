/** One positive scalar sky on the canonical 9 by 9 measurement grid. */
type SkySolarGrid = readonly (readonly number[])[];
/** Original capture geometry and exact scalar spectral projections. */
type SkySolarCondition = Readonly<{
	/** Local EDT capture label. */ time: string;
	/** Original theoretical solar zenith. */ zenithDegrees: number;
	/** Original theoretical solar azimuth. */ theoreticalDegrees: number;
	/** Original measurement-derived solar azimuth. */ fittedDegrees: number;
	/** Integrated forty-channel and four separate channel grids. */ grids: Readonly<Record<string, SkySolarGrid>>;
}>;
/** Read-only authenticated input boundary. */
type SkySolarInputs = Readonly<{
	/** All seventeen capture conditions. */ conditions: readonly SkySolarCondition[];
	/** Exact consumed file identities and seals. */ parents: readonly DialFileIdentity[];
}>;
/** One descriptive symmetry-fit result; angles are degrees. */
type SkySolarFitRow = Readonly<{
	/** Capture label. */ time: string;
	/** Spectral projection or analytic control. */ band: string;
	/** Geometry subset. */ subset: string;
	/** Number of reflected quadrature pairs. */ pairs: number;
	/** Grid-search minimum. */ bestDegrees: number;
	/** Minimum minus theoretical solar azimuth. */ theoryDifferenceDegrees: number;
	/** Minimum minus original fitted azimuth. */ originalDifferenceDegrees: number;
	/** Minimum normalized absolute reflection loss. */ minimumLoss: number;
	/** Same subset loss at the original fitted axis. */ originalLoss: number;
	/** Same subset loss at the theoretical axis. */ theoreticalLoss: number;
	/** Width of all sampled axes within the descriptive one-percent loss increment. */ nearMinimumWidthDegrees: number;
	/** Whether the selected minimum touches the finite search boundary. */ atSearchEdge: boolean;
	/** Loss on every subset at this row's selected axis. */ transferredLosses: Readonly<Record<string, number>>;
	/** Negative left-hand interpolated samples in this subset. */ negativeSamples: number;
}>;
/** Transient complete curves supporting exact selection and cross-band checks. */
type SkySolarFitCalculation = Readonly<{
	/** All retained subset minima and evaluation summaries. */ rows: readonly SkySolarFitRow[];
	/** Original floating-point angle search, in degrees. */ angles: readonly number[];
	/** Normalized curves by named subset. */ losses: Readonly<Record<string, readonly number[]>>;
}>;
/** Axis from one spectral channel evaluated on an unselected spectral grid. */
type SkySolarSpectralTransfer = Readonly<{
	/** Capture identity. */ time: string;
	/** Channel used to choose the axis. */ trainingBand: string;
	/** Distinct channel evaluated at that axis. */ evaluationBand: string;
	/** Transferred direction. */ axisDegrees: number;
	/** Full-sky loss at the transferred axis. */ loss: number;
	/** Full-sky loss at the original integrated-spectrum axis. */ originalLoss: number;
	/** Full-sky best loss for the evaluation channel, descriptive only. */ evaluationMinimumLoss: number;
}>;
/** One capture's predicted geometry under a descriptive global hypothesis. */
type SkySolarHypothesisPrediction = Readonly<{
	/** Original capture. */ time: string;
	/** Withheld odd-indexed capture. */ held: boolean;
	/** Predicted solar azimuth including fitted constant zero offset. */ azimuthDegrees: number;
	/** Wrapped difference from the measurement-derived original axis. */ errorDegrees: number;
	/** Solar zenith change implied by the same clock offset. */ zenithChangeDegrees: number;
}>;
/** Small descriptive geometric model; not a recommended calibration. */
type SkySolarHypothesis = Readonly<{
	/** Constant azimuth zero, clock, or combined model. */ model: string;
	/** Clock offset selected on even-indexed captures. */ offsetMinutes: number;
	/** Constant azimuth zero offset selected on training captures. */ zeroDegrees: number;
	/** Training angular RMS. */ trainingRmsDegrees: number;
	/** Odd-indexed capture angular RMS. */ heldRmsDegrees: number;
	/** All predictions including implied zenith changes. */ predictions: readonly SkySolarHypothesisPrediction[];
}>;
/** Complete fixed registration assessment. */
type SkySolarAssessment = Readonly<{
	/** Measurement and known-axis control fits. */ fits: readonly SkySolarFitRow[];
	/** Cross-channel checks with disjoint selected wavelengths. */ spectralTransfers: readonly SkySolarSpectralTransfer[];
	/** All original azimuths replayed within the prospective allowance. */ replayChecks: number;
	/** Descriptive geometric hypothesis comparisons. */ hypotheses: readonly SkySolarHypothesis[];
}>;
