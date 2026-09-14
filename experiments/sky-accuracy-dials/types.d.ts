/** Ambient contracts owned by this contained experiment. */

/** Exact outcome paths from the serial full-boundary experiment campaign. */
type DialFullCampaignResult = {
	/** Reproduced Native48 control, all 17 times and 40 channels. */ baseline: string;
	/** Source-path middle level. */ source40: string;
	/** Source-path prospectively predicted finer level. */ source80: string;
	/** Recurrence-path middle level. */ transport80: string;
	/** Recurrence-path prospectively predicted finer level. */ transport160: string;
	/** Prospectively predicted source80/transport160 combination. */ combined: string;
	/** Altitude-segmented two/four substeps. */ segmentedLower: string;
	/** Prospectively predicted altitude-segmented eight substeps. */ segmentedFine: string;
	/** Immutable accepted or rejected scientific assessments, in source/transport/combined/view order. */ predictionChecks: string[];
};

/** Authenticated compact input control document. */
type DialInputs = {
	/** Fixed schema identifier. */
	schemaId: string;
	/** Original retained 48-node request. */
	native48: SkyBuildRequest;
	/** Previously tested 51-node request, for development parity. */
	native51: SkyBuildRequest;
	/** Exact fitted condition geometry. */
	scenes: SkyScene[];
};

/** An explicitly named numerical intervention. */
type DialCase = {
	/** Short stable configuration name. */
	id: string;
	/** Independent overrides on the pinned Native48 control. */
	controls: SkyControlInput;
	/** Prospectively declared identifying invariants and effect hypothesis. */
	hypothesis: string;
};

/** Scientific selection for an executed configuration.
 * - **"screen"** - Three declared development times and six wavelengths.
 * - **"full"** - All 17 times and all 40 wavelengths.
 * - **"repeat"** - Three development times at wavelength index 24.
 */
type DialExecutionSelection = 'screen' | 'full' | 'repeat';

/** Compact artifact references for one completed configuration. */
type DialExecutionResult = {
	/** Exact run output directory. */
	run: string;
	/** Final immutable seal identity. */
	seal: DialFileIdentity;
	/** Whether actual execution and all declared transport checks passed. */
	accepted: boolean;
};

/** Same-configuration comparison against retained binary64 CPU view evidence. */
type DialParityResult = {
	/** Number of spectral scalars compared. */ count: number;
	/** Largest absolute spectral-radiance difference. */ maximumAbsoluteError: number;
	/** Root mean squared difference in spectral-radiance units. */ rmsDifference: number;
	/** Count outside the preregistered tolerance. */ failures: number;
	/** Whether every scalar passed. */ passed: boolean;
	/** Explicit comparison equation. */ tolerance: string;
	/** Authenticated retained comparison authority. */ expectedIdentity: DialFileIdentity;
};

/** One selected model's Kider score. */
type DialRunScoreRow = {
	/** First-order representation. */ representation: SkyRepresentation;
	/** Final ray integration count. */ q: number;
	/** Solar reconstruction. */ solar: SkySolarInterpolation;
	/** Actual cumulative scattering order. */ order: number;
	/** Stable configuration identifier. */ configId: string;
	/** Registered or explicitly screened score. */ score: DialBoundaryScore;
};

/** Compact score inventory for an immutable GPU experiment. */
type DialRunScores = {
	/** Source output directory. */ run: string;
	/** Authenticated source seal. */ seal: DialFileIdentity;
	/** Whether all registered measurement coordinates are represented. */ fullRegisteredBoundary: boolean;
	/** One score for each evaluated representation/view/order. */ rows: DialRunScoreRow[];
};

/** Exact control and target extraction instructions retained with a prediction. */
type DialPredictionSelector = {
	/** Earlier control evidence directory. */ controlRun: string;
	/** Selected first-order representation. */ representation: SkyRepresentation;
	/** Control final-view interval count. */ controlQ: number;
	/** Predicted target final-view interval count. */ targetQ: number;
	/** Common solar interpolation rule. */ solar: SkySolarInterpolation;
	/** Common actual cumulative scattering order. */ order: number;
};

/** One authenticated channel retained in memory for a single analysis operation. */
type DialLoadedChannel = {
	/** Exact Direct40 index. */ channel: number;
	/** Recorded representation/view/order/ray shape. */ shape: SkyEvaluationShape;
	/** Compact little-endian binary64 spectra. */ bytes: Buffer;
};

/** Immutable source buffers authenticated before extracting several related models. */
type DialLoadedSpectra = {
	/** Exact accepted source seal. */ sealIdentity: DialFileIdentity;
	/** Executed numerical case. */ caseId: string;
	/** Complete compact generation recipe. */ control: SkyGpuControl;
	/** One buffer per recorded wavelength in recipe order. */ spectra: DialLoadedChannel[];
};

/** Category of a discovered immutable run.
 * - **"gpu"** - Accepted normal N1-N4 streaming GPU evidence.
 * - **"prediction"** - Sealed prospective prediction registration.
 * - **"prediction-assessment"** - Retained empirical prediction evaluation, including misses.
 * - **"order-diagnostic"** - Separately admitted two-channel N1-N6 diagnostic scores.
 * - **"other"** - Another terminal scientific run, including separately schemed order diagnostics.
 * - **"open"** - No terminal seal existed at the discovery snapshot.
 */
type DialSummaryRunKind = 'gpu' | 'prediction' | 'prediction-assessment' | 'order-diagnostic' | 'other' | 'open';

/** Retained selection from either explicitly identified driver.
 * - **"screen"** - Three development conditions, with the driver's declared channels.
 * - **"full"** - Normal N4 driver over all seventeen conditions and forty channels.
 * - **"repeat"** - Normal N4 repeatability sample on one channel.
 * - **"all-times"** - N6 diagnostic over all seventeen conditions and two channels.
 */
type DialSummarySourceSelection = DialExecutionSelection | SkySixSelection;

/** Minimal typed seal result fields used for discovery; unrelated scientific payloads stay in their source artifacts. */
type DialSummarySealResult = {
	/** Normal GPU case identifier, when present. */ readonly caseId?: string;
	/** Executed coordinate selection, when present. */ readonly selection?: DialSummarySourceSelection;
	/** Explicit additional-driver order ledger, when present. */ readonly actualOrders?: readonly number[];
	/** Required retained N1-N4 identity check for the N6 driver. */ readonly prefixParityPassed?: boolean;
	/** Prediction registration or assessment identity. */ readonly predictionId?: string;
	/** Registered target model identity. */ readonly targetConfigId?: string;
	/** Exact prediction serialization digest. */ readonly predictionSha256?: string;
	/** Whether a numerical prediction assessment passed. */ readonly passed?: boolean;
	/** Plain terminal failure detail, when present. */ readonly message?: string;
	/** GPU failure detail, when present. */ readonly failure?: DialSummaryFailure | null;
};

/** Bounded failure message retained without copying arbitrary result payloads. */
type DialSummaryFailure = {
	/** Original source-run error message. */ readonly message: string;
};

/** Existing immutable run seal fields required by the summary owner. */
type DialSummarySourceSeal = {
	/** Immutable-run schema identity. */ readonly schemaId: string;
	/** Repository-relative source run. */ readonly run: string;
	/** Terminal execution or hypothesis state. */ readonly state: DialRunState;
	/** Terminal publication timestamp. */ readonly finishedAt: string;
	/** Typed discovery fields; full evidence remains in the source run. */ readonly result: DialSummarySealResult;
	/** Parent identities and operation. */ readonly recipe: DialDerivation;
	/** Exact retained artifact inventory. */ readonly artifacts: readonly DialArtifact[];
	/** Verified scratch cleanup facts. */ readonly cleanup: DialCleanup;
};

/** Read-only discovery snapshot for one source run. */
type DialSummaryDiscoveredRun = {
	/** Repository-relative run directory. */ readonly path: string;
	/** Terminal seal, or null for an open run. */ readonly seal: DialSummarySourceSeal | null;
	/** Exact seal identity, or null for an open run. */ readonly identity: DialFileIdentity | null;
};

/** Public compact campaign-summary execution result. */
type DialCampaignSummaryResult = {
	/** New immutable summary run directory. */ readonly run: string;
	/** Its authenticated terminal seal. */ readonly seal: DialFileIdentity;
	/** Whether derivation and verification succeeded; not a claim that every prediction passed. */ readonly accepted: boolean;
	/** Number of normal accepted GPU runs summarized. */ readonly gpuRunCount: number;
	/** Number of representation/view/order score rows. */ readonly scoreRowCount: number;
	/** Number of locked predictions inventoried. */ readonly predictionCount: number;
	/** Number of separately admitted two-channel N6 diagnostics. */ readonly orderDiagnosticCount: number;
	/** Actual complete retained summary directory bytes, including its seal and progress. */ readonly retainedArtifactBytes: number;
};

/** Compact source inventory preserving failed and rejected runs. */
type DialSummaryInventoryRow = {
	/** Stable source directory. */ readonly run: string;
	/** Scientific run category. */ readonly kind: DialSummaryRunKind;
	/** Terminal state, or null when open at discovery. */ readonly state: DialRunState | null;
	/** Exact immutable seal, when available. */ readonly seal: DialFileIdentity | null;
	/** Retained source-run bytes, excluding transient scratch. */ readonly retainedBytes: number | null;
	/** Original failure message or null. */ readonly failure: string | null;
	/** Whether a retained prediction evaluation passed, if this is an assessment. */ readonly predictionPassed:
		boolean | null;
};

/** Compact execution costs for an authenticated normal GPU run. */
type DialSummaryGpuRun = {
	/** Index used by score rows to avoid repeating long source paths. */ readonly index: number;
	/** Exact accepted source directory. */ readonly run: string;
	/** Exact terminal source seal. */ readonly seal: DialFileIdentity;
	/** Named numerical intervention. */ readonly caseId: string;
	/** Full, screening or repeat scope. */ readonly selection: DialExecutionSelection;
	/** Complete original executed numerical controls. */ readonly controls: DialSummaryRetainedControls;
	/** Actual view placement; old controls require authenticated historical source derivation. */ readonly viewRule: SkyViewRule;
	/** Exact control artifact or historical evaluator source establishing the rule. */ readonly viewRuleSource: DialFileIdentity;
	/** Executed capture times. */ readonly times: readonly string[];
	/** Retained Direct40 channels. */ readonly channels: readonly number[];
	/** Browser execution duration including compilation and view evaluation, milliseconds. */ readonly browserElapsedMilliseconds: number;
	/** Start-to-seal duration, milliseconds. */ readonly wallElapsedMilliseconds: number;
	/** Reported peak live recurrence-field bytes; excludes driver and CPU allocations. */ readonly peakLiveFieldBytes: number;
	/** Complete retained source directory bytes. */ readonly retainedBytes: number;
	/** Measured scratch high-water bytes. */ readonly scratchHighWaterBytes: number;
};

/** Original retained controls; the first immutable schema predates explicit view-rule selection. */
type DialSummaryRetainedControls = Omit<SkyControls, 'viewRule'> & {
	/** Explicit rule in newer controls; absence requires the exact historical quadratic evaluator identity. */ readonly viewRule?: SkyViewRule;
};

/** Known complete historical spectrum and its exact fixed-score reproduction. */
type DialSummaryHistorical = {
	/** Explicit historical model and backend name. */ readonly id: string;
	/** Authenticated source table. */ readonly source: DialFileIdentity;
	/** Complete 17-condition registered score. */ readonly score: DialBoundaryScore;
};

/** Strongest selected point change, measured relative to historical Native48 CPU N4/Q30. */
type DialSummaryPointChange = {
	/** Canonical horizontal coordinate. */ readonly gridX: number;
	/** Canonical vertical coordinate. */ readonly gridY: number;
	/** Historical point spectral RMSE, mW m^-2 sr^-1 nm^-1. */ readonly baselineRmseMilliwatt: number;
	/** Candidate point spectral RMSE in the same units. */ readonly candidateRmseMilliwatt: number;
	/** Candidate minus historical point RMSE, negative is better. */ readonly changeMilliwatt: number;
};

/** One time's measurement score and optional N4 physical change summary. */
type DialSummaryCondition = {
	/** Capture time. */ readonly time: string;
	/** Number of scalar measurement residuals. */ readonly sampleCount: number;
	/** Candidate Kider RMSE, mW spectral-radiance units. */ readonly rmseMilliwatt: number;
	/** Historical Native48 CPU N4/Q30 RMSE on identical score coordinates. */ readonly baselineRmseMilliwatt: number;
	/** Candidate minus historical RMSE, negative is better. */ readonly changeMilliwatt: number;
	/** Signed mean N4 radiance change on scored channels, mW spectral-radiance units; null for earlier orders. */ readonly meanSpectralChangeMilliwatt:
		number | null;
	/** RMS N4 physical radiance change, mW spectral-radiance units; null for earlier orders. */ readonly rmsSpectralChangeMilliwatt:
		number | null;
	/** Point with largest absolute RMSE change among all 81, null for earlier orders. */ readonly strongestPointChange: DialSummaryPointChange | null;
};

/** Score for one explicit representation/view/order model in a normal GPU run. */
type DialSummaryScoreRow = {
	/** Index into the exact GPU-run provenance inventory. */ readonly runIndex: number;
	/** Complete model selector. */ readonly configId: string;
	/** First-order representation. */ readonly representation: SkyRepresentation;
	/** Number interpreted by the separately retained view rule. */ readonly viewCount: number;
	/** Solar interpolation operator. */ readonly solar: SkySolarInterpolation;
	/** Actual cumulative order from the normal four-order driver. */ readonly order: number;
	/** Explicit score channels, always a subset of 0-30. */ readonly scoreChannels: readonly number[];
	/** Whether every registered 17 x 81 x 31 score coordinate was evaluated. */ readonly fullRegisteredBoundary: boolean;
	/** Historical condition-RMS aggregate, mW spectral-radiance units. */ readonly aggregateRmseMilliwatt: number;
	/** Historical Native48 CPU N4/Q30 aggregate on the same selection. */ readonly baselineAggregateRmseMilliwatt: number;
	/** Candidate minus historical aggregate RMSE. */ readonly aggregateChangeMilliwatt: number;
	/** Every selected capture time, never a best-condition subset. */ readonly conditions: readonly DialSummaryCondition[];
};

/** One prospective score forecast at a capture time, without inventing unregistered predictions. */
type DialSummaryPredictionCondition = {
	/** Canonical capture time; full targets retain all 17 entries. */ readonly time: string;
	/** Whether this time was covered by the immutable prediction. */ readonly predicted: boolean;
	/** Actual later target Kider RMSE, mW spectral-radiance units. */ readonly actualRmseMilliwatt: number;
	/** Locked model's forecast RMSE, or null for a time not prospectively predicted. */ readonly predictedRmseMilliwatt:
		number | null;
	/** Forecast minus actual RMSE, or null when unpredicted. */ readonly forecastErrorMilliwatt: number | null;
	/** Largest absolute arithmetic residual in the exact SSE expansion for this condition. */ readonly scoreIdentityResidual:
		number | null;
};

/** A sealed prediction linked to one later target that explicitly cites it as a parent. */
type DialSummaryPredictionTarget = {
	/** Exact later accepted GPU source run. */ readonly targetRun: string;
	/** Exact candidate seal. */ readonly targetSeal: DialFileIdentity;
	/** Explicit score channels shared by the locked prediction and target, restricted to 0-30. */ readonly scoreChannels: readonly number[];
	/** Exact point directions used for both forecast and actual scores. */ readonly rayIndices: readonly number[];
	/** Number of capture times covered by the locked prediction. */ readonly predictedConditionCount: number;
	/** True only if the record predicted every registered score scalar across all 17 times. */ readonly full17ProspectiveScore: boolean;
	/** Historical condition-RMS aggregate over prospectively predicted coordinates only. */ readonly predictedAggregateRmseMilliwatt: number;
	/** Actual aggregate over precisely the same predicted coordinates. */ readonly actualAggregateRmseMilliwatt: number;
	/** All target times, with explicit missing prediction values. */ readonly conditions: readonly DialSummaryPredictionCondition[];
};

/** Registration and retained assessments, including all failures and misses. */
type DialSummaryPrediction = {
	/** Exact registration run. */ readonly run: string;
	/** Exact registration seal. */ readonly seal: DialFileIdentity;
	/** Registration identity. */ readonly predictionId: string;
	/** Declared target model selector. */ readonly targetConfigId: string;
	/** Earlier reconstruction versus prospective intervention. */ readonly scope: DialPredictionScope;
	/** Existing measurement data were already known. */ readonly unseenMeasurementData: false;
	/** Locked point-radiance uncertainty floor, W spectral-radiance units. */ readonly floorW: number;
	/** Exact registration capture scope. */ readonly times: readonly string[];
	/** Exact registration spectral scope. */ readonly channels: readonly number[];
	/** Retained prediction-check run paths, whatever their terminal state. */ readonly assessmentRuns: readonly string[];
	/** Outcome for every later accepted GPU target citing this prediction. */ readonly targets: readonly DialSummaryPredictionTarget[];
};

/** Scientific summary document retained by the new run. */
type DialCampaignSummaryDocument = {
	/** Versioned compact report schema. */ readonly schemaId: string;
	/** Discovery snapshot timestamp. */ readonly discoveredAt: string;
	/** Current storage snapshot timestamp. */ readonly storageMeasuredAt: string;
	/** Current storage counts, with no assumed capacity from external copies. */ readonly storage: DialStorage;
	/** All terminal and open runs present at discovery. */ readonly inventory: readonly DialSummaryInventoryRow[];
	/** Known complete comparison authorities. */ readonly historical: readonly DialSummaryHistorical[];
	/** Executed controls and measured costs for accepted normal GPU evidence. */ readonly gpuRuns: readonly DialSummaryGpuRun[];
	/** Every model's complete selected-condition scores. */ readonly scores: readonly DialSummaryScoreRow[];
	/** Locked predictions and their actual later targets. */ readonly predictions: readonly DialSummaryPrediction[];
	/** Separately scoped two-channel N4/N5/N6 tables, never normal B1 score rows. */ readonly orderDiagnostics: readonly DialSummaryOrderDiagnostic[];
	/** Explicit scientific interpretation limits. */ readonly limitations: readonly string[];
};

/** Normal GPU host fields needed for summary classification and costs. */
type DialSummaryExecution = {
	/** Actual GPU execution result, absent on an early failure. */ readonly execution: DialSummaryGpuExecution | null;
};

/** Narrow actual-host result, kept distinct from separate higher-order diagnostic schemas. */
type DialSummaryGpuExecution = {
	/** Must be sky-gpu-host-result-v1 for normal streaming evidence. */ readonly schemaId: string;
	/** Actual host completion flag. */ readonly executionSucceeded: boolean;
	/** Browser facts used for measured costs. */ readonly browser: DialSummaryBrowserCost;
};

/** Measured browser costs rather than a performance estimate. */
type DialSummaryBrowserCost = {
	/** Actual browser result schema. */ readonly schemaId: string;
	/** Measured browser time, milliseconds. */ readonly elapsedMilliseconds: number;
	/** Peak live recurrence-field bytes, excluding other allocations. */ readonly peakLiveFieldBytes: number;
};

/** Explicit retained two-channel score-document schema owned by the N6 producer. */
type DialSummaryOrderScoreDocument = {
	/** Must equal sky-six-order-scores-v1. */ readonly schemaId: string;
	/** Underlying physical spectral-radiance units. */ readonly units: string;
	/** Must be the exact diagnostic point channels zero and eight. */ readonly channels: readonly number[];
	/** Must remain false for the two-channel diagnostic. */ readonly fullRegisteredBoundary: boolean;
	/** Retained producer statement identifying partial B1 coverage. */ readonly scope: string;
	/** All representations and six actually executed cumulative stages. */ readonly rows: readonly DialOrdersScore[];
};

/** Minimal retained discriminator inspected before selecting any spectral decoder. */
type DialSummaryDriverTag = {
	/** Explicit additional-driver schema; absence denotes the original normal N4 control. */ readonly executionSchemaId?: string;
	/** Explicit additional-driver order ledger, prohibited without its schema. */ readonly actualOrders?: readonly number[];
};

/** Exact retained prefix-parity claim; detailed channel proofs remain in the source artifact. */
type DialSummaryOrderParity = {
	/** Must equal sky-six-order-prefix-parity-v1. */ readonly schemaId: string;
	/** Accepted production-prefix comparison run. */ readonly parentRun: string;
	/** Exact immutable production-prefix comparison seal. */ readonly parentSeal: DialFileIdentity;
	/** One complete equality record for each of channels zero and eight. */ readonly channels: readonly DialOrdersParityChannel[];
	/** Must be true before the diagnostic is admitted. */ readonly passed: boolean;
};

/** Compact N4/N5/N6 score row copied from authenticated producer scores. */
type DialSummaryOrderRow = {
	/** Selected first-order reconstruction contract. */ readonly representation: SkyRepresentation;
	/** Actual cumulative stage, restricted to four, five or six in this report. */ readonly order: number;
	/** Aggregate partial-channel RMSE, mW m^-2 sr^-1 nm^-1. */ readonly aggregateRmseMilliwatt: number;
	/** All selected time scores with their original SSE/count arithmetic. */ readonly conditions: readonly DialConditionScore[];
};

/** Separately admitted higher-order diagnostic; no normal four-order decoder is used. */
type DialSummaryOrderDiagnostic = {
	/** Stable index into the separate diagnostic inventory. */ readonly index: number;
	/** Immutable diagnostic run directory. */ readonly run: string;
	/** Exact accepted source seal. */ readonly seal: DialFileIdentity;
	/** Exact retained score table, used directly without spectral decoding. */ readonly scoreArtifact: DialFileIdentity;
	/** Exact six-order control document. */ readonly controlArtifact: DialFileIdentity;
	/** Exact retained successful prefix-parity document. */ readonly parityArtifact: DialFileIdentity;
	/** Named physical/numerical case. */ readonly caseId: string;
	/** Screen or all-times diagnostic selection. */ readonly selection: SkySixSelection;
	/** Explicit stages actually executed; always one through six. */ readonly actualOrders: readonly number[];
	/** Explicit diagnostic wavelengths by Direct40 channel index. */ readonly channels: readonly number[];
	/** Every selected capture time. */ readonly times: readonly string[];
	/** Explicit first-order representations in producer order. */ readonly representations: readonly SkyRepresentation[];
	/** Underlying radiance units, distinct from the score's mW units. */ readonly radianceUnits: string;
	/** False: two channels cannot qualify the registered B1 boundary. */ readonly fullRegisteredBoundary: false;
	/** Producer's explicit two-channel limitation. */ readonly scope: string;
	/** Actual final-view interval placement. */ readonly viewRule: SkyViewRule;
	/** One requested final-view count for this diagnostic. */ readonly viewCount: number;
	/** One requested solar interpolation for this diagnostic. */ readonly solar: SkySolarInterpolation;
	/** Complete retained N4/N5/N6 scores across all representations. */ readonly rows: readonly DialSummaryOrderRow[];
};

/** Primitive cell preserved losslessly by the normalized summary CSV codec. */
type DialSummaryCsvCell = string | number | boolean | null;

/** One tabular serialization with an explicit header row and named index joins. */
type DialSummaryCsvTable = readonly (readonly DialSummaryCsvCell[])[];

/** Table identifiers for the normalized CSV set.
 * - **"runs.csv"** - Normal GPU run index to exact source identities and scope.
 * - **"models.csv"** - Model index to complete representation/view/order selector.
 * - **"scorecard.csv"** - Every normal-model condition and aggregate score.
 * - **"order-runs.csv"** - Separate N6 diagnostic index and source identities.
 * - **"order-models.csv"** - Separate diagnostic model index and order selector.
 * - **"order-scores.csv"** - Every N4/N5/N6 diagnostic condition and aggregate score.
 */
type DialSummaryCsvName =
	'runs.csv' | 'models.csv' | 'scorecard.csv' | 'order-runs.csv' | 'order-models.csv' | 'order-scores.csv';

/** Explicit normalized tables returned internally before serialization. */
type DialSummaryTables = ReadonlyMap<DialSummaryCsvName, DialSummaryCsvTable>;

/** Bounded independent arithmetic/serialization checks retained with the summary. */
type DialSummaryVerification = {
	/** Versioned summary-verification schema. */ readonly schemaId: string;
	/** Every declared summary model selector occurs once. */ readonly uniqueModelSelectors: boolean;
	/** Count of normal representation/view/order models checked. */ readonly modelCount: number;
	/** Number of normal condition rows checked. */ readonly conditionRowCount: number;
	/** Number of separately verified N6 source diagnostics. */ readonly orderDiagnosticCount: number;
	/** Number of separate diagnostic condition rows checked. */ readonly orderConditionRowCount: number;
	/** Number of CSV data rows decoded and compared losslessly. */ readonly csvDataRowCount: number;
	/** Every indexed CSV key resolves to its documented parent table. */ readonly csvJoinsValid: boolean;
	/** All reconstructed aggregates match within the reported numerical tolerance. */ readonly aggregateChecksPassed: boolean;
	/** Largest aggregate arithmetic difference, in mW spectral-radiance units. */ readonly maximumAggregateDifferenceMilliwatt: number;
};
