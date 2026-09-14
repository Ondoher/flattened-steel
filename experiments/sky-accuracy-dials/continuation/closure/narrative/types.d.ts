/** Where a numerical or operational control changes the calculation.
 * - **"runtime"** - Changes reconstruction or integration of retained fields.
 * - **"generation"** - Changes construction of the scattering fields.
 * - **"both"** - Includes generation and runtime choices or coupled representation work.
 */
type SkyClosureStage = 'runtime' | 'generation' | 'both';

/** One factor's fixed scientific question and authenticated historical context. */
type SkyClosureFactor = Readonly<{
	/** Stable join key for the factor coverage table. */ factorId: string;
	/** Calculation stage at which the control acts. */ stage: SkyClosureStage;
	/** Controllable quantity or method. */ controls: string;
	/** Historical tested settings and separately labelled continuation settings. */ range: string;
	/** Which changes require new fields or retained query support. */ regeneration: string;
	/** Original qualitative expectation and any later locked prediction. */ originalPrediction: string;
	/** Historical experiment and planned discriminating continuation comparison. */ method: string;
	/** Findings already established by the first campaign; never a future result. */ historicalOutcome: string;
	/** Question that authenticated continuation assessments must answer. */ currentEvidenceQuestion: string;
	/** Limits on attribution, scope and transfer to other settings. */ restrictions: readonly string[];
}>;

/** Independently reported scientific conclusion category.
 * - **"understanding"** - Evidence explains a mechanism or an observed failure.
 * - **"numerical-control"** - A stated numerical error is controlled within its reference scope.
 * - **"predictable-response"** - A prospectively registered response has been assessed.
 * - **"measurement-improving-accuracy"** - Numerical and measured improvement satisfy the declared qualification.
 * - **"unresolved"** - Missing evidence, failed predictions or remaining attribution limits.
 */
type SkyClosureClaimCategory =
	'understanding' | 'numerical-control' | 'predictable-response' | 'measurement-improving-accuracy' | 'unresolved';

/** Full-qualification decision, distinct from execution acceptance.
 * - **"qualified"** - Supplied full-boundary evidence meets the declared qualification gates.
 * - **"not-qualified"** - An executed qualification assessment does not meet its scientific gates.
 * - **"skipped"** - An explicit decision declines qualification for the documented reason.
 * - **"not-executed"** - No full-qualification assessment has executed.
 */
type SkyClosureQualificationStatus = 'qualified' | 'not-qualified' | 'skipped' | 'not-executed';

/** Scientific statement supplied by the authenticated assessment owner. */
type SkyClosureClaim = Readonly<{
	/** Strength and role of the supplied conclusion. */ category: SkyClosureClaimCategory;
	/** Plain-text conclusion, including its scope and qualification limits. */ statement: string;
	/** Report-relative links to immutable supporting artifacts or runs. */ evidence: readonly string[];
}>;

/** Immutable figure link with an explicit numerical or measurement boundary. */
type SkyClosureReportFigure = Readonly<{
	/** Report-relative artifact path supplied by the figure owner. */ path: string;
	/** Plain-text description of the figure. */ caption: string;
	/** Historical, screening, component or qualified full-boundary scope. */ scope: string;
}>;

/** Terminal inventory counts; the invalid-accounted category is separate. */
type SkyClosureReportCounts = Readonly<{
	/** Authenticated accepted records, without implying scientific qualification. */ accepted: number;
	/** Authenticated rejected records retained as evidence. */ rejected: number;
	/** Authenticated failed records retained and charged. */ failed: number;
	/** Authenticated interrupted records retained and charged. */ interrupted: number;
	/** Pinned invalid records used only for accounting, excluded from other counts. */ invalidAccounted: number;
}>;

/** Declared boundaries of the evidence shown by the report. */
type SkyClosureReportScopes = Readonly<{
	/** Scope and identities of previously completed full-boundary evidence. */ historicalFull: string;
	/** Actual new measurement boundary, with any missing full evaluation explicit. */ newMeasurements: string;
	/** Selected component references and their ray/channel or local-density boundary. */ components: string;
}>;

/** Scientific C5 outcome already authenticated by the report's caller. */
type SkyClosureReportQualification = Readonly<{
	/** Explicit qualification or non-execution classification. */ status: SkyClosureQualificationStatus;
	/** Evidence-supported explanation of the decision. */ reason: string;
}>;

/** Complete pure-renderer input; the caller owns authentication and calculation. */
type SkyClosureReportView = Readonly<{
	/** Plain-text report title. */ title: string;
	/** Exact C0 run path recorded as provenance text. */ registrationRun: string;
	/** Complete mutually exclusive terminal categories for the stated inventory. */ counts: SkyClosureReportCounts;
	/** Evidence boundaries that must remain separate in the narrative. */ scopes: SkyClosureReportScopes;
	/** Full-qualification decision with its actual reason. */ c5: SkyClosureReportQualification;
	/** Supplied assessment conclusions, never calculated from prose or selected scores. */ claims: readonly SkyClosureClaim[];
	/** Static factor questions and historical context from buildCoverage. */ factors: readonly SkyClosureFactor[];
	/** Exact figure links supplied by the figure owner. */ figures: readonly SkyClosureReportFigure[];
	/** Additional material limitations of the supplied evidence. */ limitations: readonly string[];
	/** Plain-text accounting scope and resource costs; identifies exclusion of an open reporting run. */ resourceSummary: string;
}>;

/** One matched four-channel selected-point measurement comparison. */
type SkyClosurePointFigureValue = Readonly<{
	/** Exact selected condition. */ time: string;
	/** Grid-index column, not an angular coordinate. */ gridX: number;
	/** Grid-index row, not an angular coordinate. */ gridY: number;
	/** Frozen probe identity, if any channels exist at the point. */ probeId: string | null;
	/** Number of distinct retained channels among the required four. */ channelCount: number;
	/** Raw N4 measured-residual RMSE in spectral mW; null if incomplete. */ raw: number | null;
	/** Factored N4 measured-residual RMSE in spectral mW; null if incomplete. */ factored: number | null;
	/** Factored minus raw RMSE in spectral mW; null if incomplete. */ delta: number | null;
}>;
