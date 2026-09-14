/** Scientific role of an analysis vector.
 * - **"radiance"** - Directional spectral radiance at the physical B1 boundary.
 * - **"delta"** - Signed change in that radiance, candidate minus control.
 */
type DialAnalysisQuantity = 'radiance' | 'delta';

/** Explicit coordinate selection; all indices refer to the canonical Direct40/9x9 boundary. */
type DialAnalysisSelection = {
	/** Capture times in chronological order. */
	readonly times: readonly string[];
	/** Channel indices in increasing order. */
	readonly channels: readonly number[];
	/** Direction indices in increasing order, gridY * 9 + gridX. */
	readonly rayIndices: readonly number[];
};

/** Flat scientific boundary, never a displayed RGB quantity. */
type DialAnalysisBoundary = DialAnalysisSelection & {
	/** Configuration or measurement identifier. */
	readonly configId: string;
	/** Physical radiance or signed radiance change. */
	readonly quantity: DialAnalysisQuantity;
	/** Exact point spectral-radiance units. */
	readonly units: string;
	/** Time-major, ray-major, channel-major values in W m^-2 sr^-1 nm^-1. */
	readonly values: Float64Array;
	/** Authenticated source identity supplied by the IO boundary. */
	readonly sourceIdentity: DialFileIdentity;
};

/** Exact parser selection for one complete TSV model. */
type DialBoundaryParseOptions = {
	/** Explicit model for a table with a model column; omitted for measurements. */
	readonly modelId?: string;
	/** Configuration identity assigned to the parsed values. */
	readonly configId: string;
	/** Authenticated file identity; parsing does not perform filesystem IO. */
	readonly sourceIdentity: DialFileIdentity;
};

/** One score over explicitly named channels and rays. */
type DialConditionScore = {
	/** Capture time. */
	readonly time: string;
	/** Number of scalar residuals. */
	readonly sampleCount: number;
	/** Sum of squared residuals in squared spectral-radiance units. */
	readonly squaredError: number;
	/** Root mean squared error in W m^-2 sr^-1 nm^-1. */
	readonly rmseW: number;
	/** Root mean squared error in mW m^-2 sr^-1 nm^-1. */
	readonly rmseMilliwatt: number;
};

/** Scores retaining both the historical aggregation order and pooled arithmetic. */
type DialBoundaryScore = {
	/** Exact evaluated coordinates. */
	readonly selection: DialAnalysisSelection;
	/** Whether all 17 x 81 x 31 registered score coordinates were evaluated. */
	readonly fullRegisteredBoundary: boolean;
	/** Individual capture scores. */
	readonly conditions: readonly DialConditionScore[];
	/** Historical sqrt(mean(per-condition RMSE squared)), in mW spectral-radiance units. */
	readonly aggregateRmseMilliwatt: number;
	/** Pooled sqrt(total SSE / total count), in mW spectral-radiance units. */
	readonly pooledRmseMilliwatt: number;
	/** Descriptive arithmetic mean of condition RMSE; not the published aggregate. */
	readonly meanConditionRmseMilliwatt: number;
	/** Total squared residual. */
	readonly squaredError: number;
	/** Total number of scalar residuals. */
	readonly sampleCount: number;
};

/** Geometric ray facts in one declared frame. */
type DialAnalysisRay = {
	/** Canonical gridY * 9 + gridX direction index. */
	readonly rayIndex: number;
	/** Elevation above the observer horizon, degrees. */
	readonly elevationDegrees: number;
	/** Angular distance to the fitted Sun vector, degrees. */
	readonly sunSeparationDegrees: number;
};

/** Independent geometric subset; subsets may overlap, so scores must not be summed. */
type DialGeometricStratum = {
	/** Stable condition/angular subset identifier. */
	readonly id: string;
	/** Capture time. */
	readonly time: string;
	/** Explicit geometric membership. */
	readonly rayIndices: readonly number[];
};

/** Exact residual/delta quadratic expansion. */
type DialScoreDeltaIdentity = {
	/** Twice control residual dot predicted radiance change. */
	readonly residualCrossTerm: number;
	/** Squared norm of the radiance change. */
	readonly deltaSquaredNorm: number;
	/** Predicted SSE change: cross term plus squared norm. */
	readonly predictedSquaredErrorChange: number;
	/** Directly recomputed candidate SSE minus control SSE. */
	readonly actualSquaredErrorChange: number;
	/** Difference between the two arithmetic routes. */
	readonly identityResidual: number;
};

/** Full two-factor spectral contrast and its separate score interaction. */
type DialFactorialContrast = {
	/** Signed combined response minus both main effects. */
	readonly interaction: DialAnalysisBoundary;
	/** Euclidean norm of the spectral interaction. */
	readonly interactionNorm: number;
	/** Norm divided by the sum of main-effect norms, with the declared scalar floor. */
	readonly relativeInteraction: number;
	/** SSE(AB) - SSE(A) - SSE(B) + SSE(control). */
	readonly squaredErrorInteraction: number;
	/** Twice the dot product of the two spectral main effects; exists even for additive radiance. */
	readonly additiveSquaredErrorCrossTerm: number;
};

/** Whether a prediction is a new intervention claim or reconstruction of known outcomes.
 * - **"prospective-intervention"** - Target output is withheld until after a sealed prediction.
 * - **"development-reconstruction"** - Known output or mechanism reconstruction, never a holdout claim.
 */
type DialPredictionScope = 'prospective-intervention' | 'development-reconstruction';

/** Development evidence admitted before a target executes. */
type DialPredictionDevelopment = {
	/** Configuration that produced the input. */
	readonly configId: string;
	/** Exact immutable artifact identity. */
	readonly artifact: DialFileIdentity;
	/** Exact known output coordinates; required to admit an earlier screen of the same target configuration. */
	readonly selection?: DialAnalysisSelection;
};

/** Caller-specified prospective registration, independent of candidate values. */
type DialPredictionRegistration = {
	/** Unique prediction identifier. */
	readonly id: string;
	/** Target configuration identity. */
	readonly targetConfigId: string;
	/** Known reconstruction versus withheld intervention. */
	readonly scope: DialPredictionScope;
	/** Earlier development evidence; may not include a prospective target. */
	readonly development: readonly DialPredictionDevelopment[];
	/** Positive uncertainty floor per spectral scalar, W m^-2 sr^-1 nm^-1. */
	readonly floorW: number;
	/** Immutable derivation for repeatability/reference uncertainty used to set the floor. */
	readonly floorEvidence: readonly DialFileIdentity[];
};

/** Serializable prediction to seal before generating the target. */
type DialSpectralPrediction = DialPredictionRegistration &
	DialAnalysisSelection & {
		/** Schema for this explicit prediction boundary. */
		readonly schema: string;
		/** Control configuration for delta = target - control. */
		readonly baselineConfigId: string;
		/** Exact control evidence. */
		readonly baselineIdentity: DialFileIdentity;
		/** Point spectral-radiance units. */
		readonly units: string;
		/** False: all measurement times have already been seen. */
		readonly unseenMeasurementData: false;
		/** Reproducible predictor equation and assumptions. */
		readonly mechanism: string;
		/** Signed predicted target-minus-control values, same coordinate order as the selection. */
		readonly delta: readonly number[];
		/** Empirical minimum sign agreement, fixed before execution. */
		readonly minimumSignAgreement: number;
		/** Empirical maximum relative vector error, fixed before execution. */
		readonly maximumRelativeVectorError: number;
	};

/** Authenticated timing and content facts supplied by the immutable run owner. */
type DialPredictionEvaluationEvidence = {
	/** SHA-256 of JSON.stringify(prediction), authenticated by the prediction run. */
	readonly predictionSha256: string;
	/** Successful prediction run seal identity. */
	readonly predictionSeal: DialFileIdentity;
	/** ISO timestamp of sealed prediction publication. */
	readonly lockedAt: string;
	/** ISO timestamp recorded before candidate generation starts. */
	readonly candidateStartedAt: string;
	/** Exact evaluated candidate identity, reauthenticated by the run owner. */
	readonly candidateIdentity: DialFileIdentity;
};

/** One condition/geometry-specific empirical prediction check. */
type DialPredictionGroupResult = {
	/** Explicit subset identifier. */
	readonly id: string;
	/** Number of scalar outcomes checked. */
	readonly sampleCount: number;
	/** Count with either predicted or actual magnitude above the uncertainty floor. */
	readonly resolvedCount: number;
	/** Fraction with both signs resolved and agreeing; null for entirely negligible changes. */
	readonly signAgreement: number | null;
	/** Euclidean prediction error divided by max(actual delta norm, floor * sqrt(count)). */
	readonly relativeVectorError: number;
	/** Whether the registered empirical gates passed for this subset. */
	readonly passed: boolean;
};

/** Prediction evaluation without conflating numerical change with measurement fit. */
type DialPredictionEvaluation = {
	/** Prediction identity. */
	readonly predictionId: string;
	/** Whether authenticated timing and declared input separation support a prospective claim. */
	readonly prospective: boolean;
	/** False because measurements are known; only intervention outcomes can be withheld. */
	readonly unseenMeasurementData: false;
	/** All declared nonempty condition and geometry subsets. */
	readonly groups: readonly DialPredictionGroupResult[];
	/** Conjunction of all evaluated empirical gates. */
	readonly passed: boolean;
};

/** Plot series carrying explicit abscissae and units supplied by its report owner. */
type DialPlotSeries = {
	/** Human-readable series identity. */
	readonly label: string;
	/** Ordered numeric x coordinates. */
	readonly x: readonly number[];
	/** Numeric y coordinates corresponding exactly to x. */
	readonly y: readonly number[];
};

/** Self-contained scientific SVG request; no filesystem operations occur. */
type DialPlotOptions = {
	/** Scientific quantity and scope. */
	readonly title: string;
	/** Interpretation and evidence limits. */
	readonly description: string;
	/** Axis label including units. */
	readonly xLabel: string;
	/** Axis label including units. */
	readonly yLabel: string;
	/** Input series. */
	readonly series: readonly DialPlotSeries[];
	/** Exact artifact or derivation identities retained as SVG metadata. */
	readonly provenance: unknown;
	/** Optional explicit tick labels, such as capture times. */
	readonly xTicks?: readonly DialPlotTick[];
};

/** One explicitly labelled numeric axis coordinate. */
type DialPlotTick = {
	/** Axis coordinate. */
	readonly value: number;
	/** Human-readable coordinate. */
	readonly label: string;
};

/** Options for a numerical-change report with separately selected Kider scoring. */
type DialComparisonReportOptions = {
	/** Human-readable intervention name. */
	readonly title: string;
	/** Explicit score channels, default registered 0-30. */
	readonly scoreChannels?: readonly number[];
	/** Exact parent identities and derivation description. */
	readonly provenance: unknown;
};

/** Compact scalar summaries preserving signed and unsigned spectral effects. */
type DialSpectralChangeSummary = {
	/** Canonical Direct40 index. */
	readonly channel: number;
	/** Point wavelength in nanometres. */
	readonly wavelengthNanometers: number;
	/** Signed average candidate-minus-control radiance, W spectral-radiance units. */
	readonly meanChangeW: number;
	/** Root mean square candidate-minus-control radiance, W spectral-radiance units. */
	readonly rmsChangeW: number;
};

/** Compact report products returned to the immutable IO owner. */
type DialComparisonReport = {
	/** Control scores on the explicitly selected channels. */
	readonly controlScore: DialBoundaryScore;
	/** Candidate scores on exactly the same channels. */
	readonly candidateScore: DialBoundaryScore;
	/** Per-channel physical spectral response. */
	readonly spectralChanges: readonly DialSpectralChangeSummary[];
	/** Signed candidate-minus-control aggregate RMSE, mW spectral-radiance units. */
	readonly aggregateChangeMilliwatt: number;
	/** Positive magnitude and worsening/improvement wording, or undefined percentage at zero baseline. */
	readonly interpretation: string;
	/** Readable scope, numerical changes and separate measurement results. */
	readonly markdown: string;
	/** All condition scores with a separate aggregate row. */
	readonly csv: string;
	/** Standalone figure of physical spectral changes. */
	readonly spectralSvg: string;
	/** Standalone figure of Kider RMSE. */
	readonly scoreSvg: string;
};

/** Focused proof output; the caller retains this in a new immutable run. */
type DialAnalysisProof = {
	/** Number of independent assertions and rejection cases exercised. */
	readonly checks: number;
	/** Historical score of the supplied baseline. */
	readonly baselineScore: DialBoundaryScore;
	/** Actual aggregate parity error, when a historical oracle was supplied. */
	readonly aggregateOracleDifference: number | null;
	/** Equations and failure boundaries checked without fitting any candidate. */
	readonly mechanisms: readonly string[];
};
