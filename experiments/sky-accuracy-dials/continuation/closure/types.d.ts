/** Explicit conditional-phase outcome without a full qualification claim.
 * - **"skipped"** - The bounded campaign deliberately omits C5 for the recorded reason.
 * - **"not-executed"** - C5 remains unexecuted at a limited closure snapshot.
 */
type SkyClosureC5Status = 'skipped' | 'not-executed';
/** Ordinary radiance capture scope, excluding component quantities.
 * - **"screen"** - The registered three-time, six-numerical-channel boundary.
 * - **"full"** - The complete seventeen-time, forty-numerical-channel boundary.
 */
type SkyClosureModelScope = 'screen' | 'full';
/** Explicit closure decision; no full qualification is inferred from a screen. */
type SkyClosureC5Decision = Readonly<{
	/** Why the conditional phase did not establish qualification. */ status: SkyClosureC5Status;
	/** Concrete reference, resource, or coverage limitation. */ reason: string;
	/** Accepted or rejected assessment runs supporting the decision. */ evidenceRuns: readonly string[];
	/** Considered candidates, if any; these are not qualified controls. */ candidateCaseIds?: readonly string[];
}>;
/** Exact optional assessment selections; omission preserves an incomplete phase. */
type SkyClosureOptions = Readonly<{
	/** Accepted C3 assessment, or null when the bounded phase was not assessed. */ mechanismAssessmentRun?:
		string | null;
	/** Accepted C2 assessment, or null when the bounded phase was not assessed. */ ladderAssessmentRun?: string | null;
	/** Accepted C4 diagnostics, including scientifically rejected forecasts. */ interactionAssessmentRuns?: readonly string[];
	/** Mandatory explicit conditional-phase decision. */ c5Decision: SkyClosureC5Decision;
}>;
/** Narrow consumed terminal fields; complete artifact validation stays with verifyRun. */
type SkyClosureTerminal = Readonly<{
	/** Exact immutable run path. */ run: string;
	/** Infrastructure outcome. */ state: DialRunState;
	/** Publication timestamp. */ finishedAt: string;
	/** Complete declared ordinary artifact inventory. */ artifacts: readonly DialArtifact[];
	/** Parent identities and bounded continuation job discriminators. */ recipe: Readonly<{
		/** Exact consumed parents. */ parents: readonly DialFileIdentity[];
		/** Work classification for accounting. */ parameters: Readonly<{
			/** Original C0 owner. */ continuationRegistration: string;
			/** CPU or GPU job debit. */ jobKind: SkyContinuationJobKind;
			/** Scope charged by the original producer. */ scope: SkyContinuationJobScope;
			/** Original phase allocation. */ phase: SkyContinuationJobPhase;
			/** Case on construction or named analysis runs. */ caseId?: string;
		}>;
	}>;
	/** Consumed terminal accounting and discriminator facts. */ result: Readonly<{
		/** Actual entire-job elapsed debit. */ jobElapsedMilliseconds?: number;
		/** Constructed or assessed case. */ caseId?: string;
		/** Joint target on prediction/assessment runs. */ targetCaseId?: string;
		/** Plain producer failure detail where present. */ message?: string;
		/** Producer failure may be a string or an object and is rendered safely. */ failure?: unknown;
	}>;
}>;
/** One authenticated continuation run, including accounting-only invalid evidence. */
type SkyClosureRun = Readonly<{
	/** Stable sequence-local inventory key. */ index: number;
	/** Repository-relative source run. */ run: string;
	/** Exact seal identity. */ seal: DialFileIdentity;
	/** Authenticated terminal subset. */ terminal: SkyClosureTerminal;
	/** Complete bytes including the seal, counted once. */ retainedBytes: number;
	/** Invalid proof exception is never accepted science. */ invalid: SkyContinuationInvalidEvidence | null;
}>;
/** Authenticated artifact and schema-preserving JSON value. */
type SkyClosureJson = Readonly<{
	/** Exact source artifact. */ identity: DialFileIdentity;
	/** Parsed value, validated by the owning consumer before use. */ value: unknown;
}>;
/** A normalized retained table with its original evidence and physical scope. */
type SkyClosureTable = Readonly<{
	/** Output-local table key. */ id: string;
	/** Meaning and admissible interpretation. */ description: string;
	/** Exact consumed artifacts. */ sources: readonly DialFileIdentity[];
	/** Explicit normalized columns and primitive rows. */ table: SkyContinuationAnalysisTable;
}>;
/** One recomputed ordinary N1-N4 model; component quantities are excluded. */
type SkyClosureModel = Readonly<{
	/** Unique normalized model key. */ index: number;
	/** Owning continuation inventory key. */ runIndex: number;
	/** Original constructed case. */ caseId: string;
	/** Actual screen or complete output selection. */ scope: SkyClosureModelScope;
	/** Exact reconstruction grouping. */ representation: SkyRepresentation;
	/** Subdivisions in the declared view rule. */ view: number;
	/** Exact solar reconstruction. */ solar: SkySolarInterpolation;
	/** Cumulative order 1 through 4. */ order: number;
	/** All retained numerical channels. */ numericalChannels: readonly number[];
	/** Complete selected score, with 39 excluded. */ score: DialBoundaryScore;
}>;
/** Source-preserving compact figure, never a new atmospheric calculation. */
type SkyClosureFigure = Readonly<{
	/** Exclusive output-local filename. */ name: string;
	/** Exact SVG text or copied immutable bytes. */ contents: string | Buffer;
	/** Visible interpretation. */ caption: string;
	/** Historical/full, screen, or component scope. */ scope: string;
	/** Direct data/artifact parents. */ sources: readonly DialFileIdentity[];
}>;
/** Parsed C1 summary subset, while its exact complete JSON remains an artifact. */
type SkyClosureJ1Summary = Readonly<{
	/** Exact accepted schema. */ schemaId: 'sky-continuation-physical-j1-assessment-v1';
	/** Complete independent scalar references. */ physicalResolvedCount: number;
	/** Complete two-representation comparisons. */ completeComparisonCount: number;
	/** Registered group checks. */ groupCount: number;
	/** Groups passing local numerical reduction. */ groupReductionQualifiedCount: number;
	/** Full biased-probe group, not the B1 score boundary. */ overall: SkyJ1AssessmentGroup;
	/** Original scientific restrictions. */ limitations: readonly string[];
}>;
/** Parsed C2 summary subset with deliberately unresolved whole-N4 allowance. */
type SkyClosureLadderSummary = Readonly<{
	/** Exact accepted schema. */ schemaId: 'sky-continuation-reference-ladder-assessment-v1';
	/** Actual contiguous R0-Rk cases. */ prefix: readonly string[];
	/** Unexecuted rungs remain explicit. */ missingCases: readonly string[];
	/** Whole finite-order reference status. */ finiteN4ReferenceAdequate: false;
	/** Missing material errors prevent a total allowance. */ totalReferenceAllowanceW: null;
	/** Local view-integration group counts only. */ localView: Readonly<{
		/** Total groups retained. */ groupCount: number;
		/** Reduction gate passed. */ qualified: number;
		/** Reduction gate failed. */ rejected: number;
		/** Reference unavailable. */ unavailable: number;
	}>;
	/** Consumed capture identities and selectors. */ sources: readonly Readonly<{
		/** Exact source run. */ run: string;
		/** Exact seal. */ seal: DialFileIdentity;
		/** Registered rung. */ caseId: string;
	}>[];
	/** Retained normalized tables. */ artifacts: readonly DialFileIdentity[];
	/** Original scope restrictions. */ limitations: readonly string[];
}>;
/** Whole assessment payload retained by the C4 owner. */
type SkyClosureInteractionAssessment = Readonly<{
	/** Exact original schema. */ schemaId: 'sky-interaction-assessment-v1';
	/** Registered joint case. */ targetCaseId: string;
	/** Exact earlier forecast seal. */ prediction: DialFileIdentity;
	/** Exact later target seal. */ target: DialFileIdentity;
	/** Explicit screen boundary. */ scope: 'screen';
	/** No fourteen-time assessment. */ held14Assessed: false;
	/** No complete seventeen-time assessment. */ full17Assessed: false;
	/** No independently adequate N4 reference. */ numericalAccuracyQualified: false;
	/** Exact frozen scientific gates. */ gates: DialContinuationScientificGates;
	/** Complete eight selector assessments. */ rows: readonly SkyInteractionAssessmentRow[];
	/** Optional causal invariance evidence. */ causalCheck: SkyInteractionCausalCheck | null;
	/** Preserved scientific restrictions. */ limitations: readonly string[];
}>;
/** Authenticated C4 inputs, evaluated without allocating another evidence run. */
type SkyClosureInteraction = Readonly<{
	/** Assessment inventory entry. */ source: SkyClosureRun;
	/** Exact compressed assessment artifact. */ artifact: DialFileIdentity;
	/** Original complete assessment JSON. */ record: SkyClosureInteractionAssessment;
	/** Recomputed original immutable forecast. */ prediction: SkyInteractionPredictionRead;
	/** Authenticated actual fourth vertex. */ target: SkyInteractionSource;
	/** Complete target inventory for declared artifact ownership. */ targetSource: SkyClosureRun;
}>;
/** Bounded pure verification result recorded by the final runner. */
type SkyClosureProof = Readonly<{
	/** Exact proof schema. */ schemaId: 'sky-continuation-closure-proof-v1';
	/** Number of successful independent checks. */ checks: number;
	/** Largest direct-versus-expanded SSE residual. */ maximumSseResidual: number;
	/** No atmospheric execution was performed. */ scope: string;
}>;
