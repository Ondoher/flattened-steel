/** One authenticated channel with compact component and operational evidence. */
type SkyMechanismAssessmentDiagnostic = Readonly<{
	/** Direct40 channel ordinal. */ channel: number;
	/** Exact retained compressed input. */ artifact: DialFileIdentity;
	/** Validated component, adaptive, and optional ground records. */ value: SkyContinuationChannelDiagnostics;
}>;
/** A complete admitted C3 screen or its exact historical H parent. */
type SkyMechanismAssessmentCapture = Readonly<{
	/** Exact registered case. */ caseId: string;
	/** Immutable accepted terminal and seal. */ input: SkyMechanismAcceptedRun;
	/** Original spectra, numerical controls, and axes. */ loaded: DialLoadedSpectra;
	/** Every consumed input artifact. */ artifacts: readonly DialFileIdentity[];
	/** Exact coordinate-union identity; only matching unions permit field hash comparisons. */ coordinateSha256: string;
	/** Per-channel source-field identities. */ channels: readonly SkyContinuationAnalysisChannel[];
	/** Decoded diagnostic channels. */ diagnostics: readonly SkyMechanismAssessmentDiagnostic[];
	/** Recomputed six-rule envelopes by channel/probe/representation/order. */ envelopes: ReadonlyMap<
		string,
		SkyContinuationProbeDiagnostic
	>;
}>;
/** Counts of scalar comparisons across explicitly overlapping budgets and orders. */
type SkyMechanismComparisonCounts = Readonly<{
	/** Absolute error reductions or increases separated from the empirical allowance. */ adequate: number;
	/** Qualified positive error reductions. */ improved: number;
	/** Qualified negative error reductions. */ worsened: number;
	/** Missing allowance or response too small for the registered separation gate. */ unresolved: number;
}>;
/** Retrospective mechanism evidence, never a prospective prediction result. */
type SkyMechanismPackageSummary = Readonly<{
	/** Plain scientific classification with explicit scope. */ classification: string;
	/** At least one measured nonzero response. */ observedResponse: boolean;
	/** Local, limited numerical reference comparisons. */ localNumericalComparisons: SkyMechanismComparisonCounts;
	/** C3 observations cannot acquire a prospective label after execution. */ prospectivePrediction: 'not-tested-by-C3';
	/** Number of explicitly scoped Kider comparisons with positive gain. */ kiderImprovementCount: number;
	/** Whole-solver accuracy is not qualified by these component checks. */ combinedAccuracyQualified: false;
	/** Material scope and uncertainty limits. */ limitations: readonly string[];
}>;
/** Authenticated immutable local J2 input and its exact controls. */
type SkyMechanismLocalJ2Read = Readonly<{
	/** Accepted original input. */ input: SkyMechanismAcceptedRun;
	/** Exact reference JSON identity. */ artifact: DialFileIdentity;
	/** Exact frozen derivation defining finite controls. */ definition: DialFileIdentity;
	/** Validated reference and unchanged null allowances. */ record: SkyJ2ReferenceDocument;
}>;
/** Exact finite control inventory consumed from the historical J2 derivation. */
type SkyMechanismJ2Definition = Readonly<{
	/** Original immutable operation. */ recipe: Readonly<{
		/** Parameters used for every retained angular sum. */ parameters: Readonly<{
			/** Four explicit finite S/T controls. */ finiteControls: readonly SkyJ2FiniteControl[];
			/** Registered independent incoming product rules. */ rules: readonly SkyJ2Rule[];
			/** Four channels. */ channels: readonly number[];
			/** Exact supplied ground geometry. */ targets: readonly SkyJ2Target[];
		}>;
	}>;
}>;
/** Narrow finite-ladder summary consumed without promoting it to an oracle. */
type SkyMechanismLadderSummary = Readonly<{
	/** Exact existing assessment schema. */ schemaId: string;
	/** Original contiguous R0..Rk source inventory. */ sources: readonly Readonly<{
		/** Immutable original capture. */ run: string;
		/** Exact source seal. */ seal: DialFileIdentity;
		/** Original rung identity. */ caseId: string;
	}>[];
	/** Independently justified whole-N4 adequacy, currently false. */ finiteN4ReferenceAdequate: boolean;
	/** Null when any material numerical component is unresolved. */ totalReferenceAllowanceW: number | null;
	/** Whether all seventeen times and forty numerical channels were assessed. */ fullRegisteredBoundary: boolean;
	/** Existing ladder assessment is retrospective. */ prospective: boolean;
}>;
/** Complete authenticated input graph for the bounded C3 CPU assessment. */
type SkyMechanismAssessmentInputs = Readonly<{
	/** Original C0 authority. */ registration: DialContinuationRegistrationRead;
	/** Original prospective mechanism catalog. */ catalog: SkyMechanismRegistrationRead;
	/** H, final-J1 H, and the ten exact C3 sources. */ captures: readonly SkyMechanismAssessmentCapture[];
	/** Independent local J2 with limited adequacy. */ localJ2: SkyMechanismLocalJ2Read;
	/** Accepted contiguous ladder evidence. */ ladder: SkyMechanismAcceptedRun;
	/** Exact ladder summary artifact. */ ladderArtifact: DialFileIdentity;
	/** Validated finite-ladder scope and adequacy. */ ladderSummary: SkyMechanismLadderSummary;
	/** All consumed direct immutable input identities. */ parents: readonly DialFileIdentity[];
}>;
/** Pure density/incoming response products ready for bounded retention. */
type SkyMechanismResponseEvaluation = Readonly<{
	/** Ordinary Kider scores, excluding channel39. */ scores: SkyContinuationAnalysisTable;
	/** Signed response, geometric strata, and exact SSE identities. */ contrasts: SkyContinuationAnalysisTable;
	/** Complete six-channel density contrasts in declared f64 order. */ spectra: Buffer;
	/** One row for each binary spectral slice. */ spectrumLayout: SkyContinuationAnalysisTable;
	/** Matched first-order spectra and conditional coordinate/hash checks. */ invariance: SkyContinuationAnalysisTable;
	/** Field-local reference integration checks; not field correctness. */ fixedFields: SkyContinuationAnalysisTable;
	/** Pure J2 observations versus qualified or unresolved references. */ incoming: SkyContinuationAnalysisTable;
	/** Exact finite S/T controls, separate from endpoint/aspect GPU observations. */ finiteControls: SkyContinuationAnalysisTable;
	/** Density mechanism classification. */ densitySummary: SkyMechanismPackageSummary;
	/** Incoming mechanism classification. */ incomingSummary: SkyMechanismPackageSummary;
}>;
/** One fixed geometric score/spectral group; memberships may overlap. */
type SkyMechanismMetricGroup = Readonly<{
	/** Exact group identity. */ id: string;
	/** Included ordinary screen times. */ times: readonly string[];
	/** Included y*9+x ray identities. */ rayIndices: readonly number[];
}>;
/** One signed scalar reference comparison.
 * - **"improved"** - Positive absolute-error reduction passes the unchanged allowance gates.
 * - **"worsened"** - Negative reduction passes the symmetric magnitude-separation gates.
 * - **"unresolved"** - Reference allowance is unavailable or fails effect-separation gates.
 */
type SkyMechanismReductionStatus = 'improved' | 'worsened' | 'unresolved';
/** Pure independently scoped reference comparison; missing uncertainty is never zero. */
type SkyMechanismReduction = Readonly<{
	/** Signed absolute-error reduction; positive is favorable. */ reduction: number;
	/** Gate result for the actual numerical quantity and reference scope. */ status: SkyMechanismReductionStatus;
}>;
/** Separate density-unit outputs and limited comparison counts. */
type SkyMechanismIncomingEvaluation = Readonly<{
	/** GPU pure-J2 changes and continuous-L1 angular envelopes. */ table: SkyContinuationAnalysisTable;
	/** Four finite S/T controls for the two midpoint rules. */ finite: SkyContinuationAnalysisTable;
	/** Scalar local numerical comparisons, with unresolved allowances retained. */ counts: SkyMechanismComparisonCounts;
}>;
/** Focused manufactured assessment checks; no atmospheric job is executed. */
type SkyMechanismAssessmentProof = Readonly<{
	/** Exact proof schema identity. */ schemaId: 'sky-mechanism-assessment-proof-v1';
	/** Total passed mathematical, layout, and admission checks. */ checks: number;
	/** Explicit adaptive scope/cost proof. */ adaptive: SkyMechanismAdaptiveAssessmentProof;
}>;
/** Original GPU execution status and browser coordinate identity. */
type SkyMechanismExecutionRecord = Readonly<{
	/** Null on failed execution; accepted inputs require a completed browser report. */ execution: SkyGpuHostResult | null;
}>;
/** Canonical compact C3 summary consumed by closure, with exact artifact identities. */
type SkyMechanismAssessmentSummary = Readonly<{
	/** Closed assessment schema. */ schemaId: 'sky-mechanism-assessment-v1';
	/** Exact consumed source graph. */ sources: Readonly<{
		/** Original C0 seal. */ registration: DialFileIdentity;
		/** Exact prospective catalog seal. */ catalog: DialFileIdentity;
		/** Required00106 resource authority. */ allocation: DialFileIdentity;
		/** H pair and all ten C3 source seals. */ captures: readonly Readonly<{
			/** Exact case discriminator. */ caseId: string;
			/** Exact immutable construction seal. */ seal: DialFileIdentity;
		}>[];
		/** Exact accepted local J2 seal. */ localJ2: DialFileIdentity;
		/** Exact accepted contiguous ladder assessment seal. */ ladderAssessment: DialFileIdentity;
	}>;
	/** Numerical and measurement scopes cannot be interchanged. */ scope: Readonly<{
		/** Original three screen times. */ times: readonly string[];
		/** Six numerical channels. */ channels: readonly number[];
		/** Five channels used for measurements. */ scoreChannels: readonly number[];
		/** Ordinary grouped subdivisions. */ views: readonly number[];
		/** Cumulative stages. */ orders: readonly number[];
		/** Exactly243 ordinary rays, excluding sixteen extra component rays. */ ordinaryRayCount: number;
	}>;
	/** Separate V/D/I mechanism conclusions. */ packages: Readonly<{
		/** Adaptive final integration. */ view: SkyMechanismPackageSummary;
		/** Higher-order density representation and altitude. */ density: SkyMechanismPackageSummary;
		/** Incoming placement, aspect, and count. */ incoming: SkyMechanismPackageSummary;
	}>;
	/** Reference coverage does not imply full numerical qualification. */ referenceAdequacy: Readonly<{
		/** No independently adequate whole-N4 envelope is available. */ wholeN4: false;
		/** Qualified scalar local J2 envelopes. */ localJ2Adequate: number;
		/** All requested local J2 outputs, including unresolved coordinates. */ localJ2Total: number;
	}>;
	/** All ten registered C3 outcomes are required; no favorable repeat selection. */ completeRegisteredMatrix: true;
	/** C5 proposal, not an execution or fabricated qualification. */ c5Decision: Readonly<{
		/** Missing whole-solver reference prevents C5 admission. */ status: 'skip-proposed';
		/** Empty when no complete accuracy case is admissible. */ candidateCaseIds: readonly string[];
		/** Explicit scientific admission reason. */ reason: string;
	}>;
	/** Exact normalized tables and binary numerical artifacts. */ artifacts: readonly DialFileIdentity[];
	/** Scientific interpretation limits. */ limitations: readonly string[];
}>;
/** Authenticated C3 closure-consumption capability. */
type SkyMechanismAssessmentRead = Readonly<{
	/** Exact accepted summary run seal. */ seal: DialFileIdentity;
	/** Validated typed summary. */ summary: SkyMechanismAssessmentSummary;
	/** Exact summary and declared data artifacts. */ artifacts: readonly DialFileIdentity[];
}>;
