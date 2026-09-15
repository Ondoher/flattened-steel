/** Authenticated original-grid decomposition; no later exact-solar columns enter the candidate. */
type SkySourceRefinementBaseline = Readonly<{
	schemaId: 'sky-source-grid-v1';
	rows: readonly SkySourcePhaseRow[];
	groups: readonly SkySourceReconstructionGroup[];
}>;
/** Complete immutable inputs, kept out of the compact forecast artifact. */
type SkySourceRefinementInput = Readonly<{
	gridRun: string;
	predictionRun: string;
	targetRun: string;
	identities: readonly DialFileIdentity[];
	input: SkySourceAuditInput;
	prediction: SkySourceAuditPredictionRecord;
	target: SkySourceReconstructionTarget;
	columns: readonly SkySourceReconstructionColumn[];
	baseline: SkySourceRefinementBaseline;
}>;
/** Species columns at one of the sixteen original altitude/solar anchors. */
type SkySourceRefinementAnchor = Readonly<{
	coordinateId: string;
	rayleighMeters: SkySourceReconstructionValue;
	mieMeters: SkySourceReconstructionValue;
}>;
/** Compact component values in density units locally and radiance units after projection. */
type SkySourceRefinementValues = Readonly<{
	reference: SkySourceReconstructionValue;
	density160: SkySourceReconstructionValue;
	error160: SkySourceReconstructionValue;
	density320: SkySourceReconstructionValue;
	error320: SkySourceReconstructionValue;
	response: SkySourceReconstructionValue;
}>;
type SkySourceRefinementPredictionRow = Readonly<{
	probeId: string;
	channel: number;
	sampleIndex: number;
	altitudeMeters: number;
	weightMeters: number;
	values: SkySourceRefinementValues;
}>;
type SkySourceRefinementPredictionGroup = Readonly<{
	probeId: string;
	channel: number;
	sampleCount: number;
	values: SkySourceRefinementValues;
}>;
/** The three registered predicates, in their fixed declaration order. */
type SkySourceRefinementChecks = Readonly<{
	negative: SkySourceAuditState;
	ratio: SkySourceAuditState;
	response: SkySourceAuditState;
}>;
type SkySourceRefinementComparison = Readonly<{
	predictedResponse: SkySourceReconstructionValue;
	predictionError: SkySourceReconstructionValue;
	errorRatio: number | null;
	errorRatioInterval: readonly [number, number] | null;
	checks: SkySourceRefinementChecks;
}>;
/** No atmospheric S320 value is evaluated while constructing this object. */
type SkySourceRefinementForecast = Readonly<{
	schemaId: 'sky-source-refinement-forecast-v1';
	gridRun: string;
	baselineIntervals: 160;
	targetIntervals: 320;
	targetAlreadyExecuted: false;
	anchors: readonly SkySourceRefinementAnchor[];
	rows: readonly SkySourceRefinementPredictionRow[];
	groups: readonly SkySourceRefinementPredictionGroup[];
	baselineReplay: Readonly<{rows: number; groups: number; modes: readonly string[]; exactComparisons: number}>;
}>;
/** Actual explicit-count work, including the retained S160 parity checks. */
type SkySourceRefinementWork = {geometrySamples: number; speciesDensityEvaluations: number};
type SkySourceRefinementTarget = Readonly<{
	schemaId: 'sky-source-refinement-target-v1';
	gridRun: string;
	baselineIntervals: 160;
	targetIntervals: 320;
	anchors: readonly Readonly<{
		coordinateId: string;
		geometry: SkySourceAuditGeometry;
		finite160: SkySourceAuditFinite;
		finite320: SkySourceAuditFinite;
	}>[];
	rows: readonly (SkySourceRefinementPredictionRow & SkySourceRefinementComparison)[];
	groups: readonly (SkySourceRefinementPredictionGroup & SkySourceRefinementComparison)[];
	predicates: readonly SkySourceAuditState[];
	localPredicates: readonly SkySourceAuditState[];
	work: SkySourceRefinementWork;
}>;
