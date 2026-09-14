/** Counted integration method compared on identical captured fields.
 * - **"adaptive"** - Refined segment allocation, charging every queried trial node.
 * - **"uniform"** - Equal subdivision count in every physical altitude segment.
 */
type SkyMechanismAdaptiveMethod = 'adaptive' | 'uniform';

/** Registered first-order reconstruction background for the V comparison.
 * - **"v-raw"** - Raw first-order source-density reconstruction.
 * - **"v-factored"** - Final first-order species-factored reconstruction.
 */
type SkyMechanismAdaptiveCase = 'v-raw' | 'v-factored';

/** Reuse the evaluator's declared four/five scalar reconstruction cost contract. */
type SkyMechanismAdaptiveScalarCount = SkyAdaptiveOptions['scalarReconstructionsPerNode'];

/** Minimum physical coordinate shared by operational and reference records. */
type SkyMechanismAdaptiveCoordinate = Readonly<{
	/** Canonical measurement time. */ time: string;
	/** Canonical grid column. */ gridX: number;
	/** Canonical grid row. */ gridY: number;
}>;

/** Exact named-column matches used to select one manufactured result row. */
type SkyMechanismAdaptiveRowSelector = Readonly<Record<string, SkyContinuationAnalysisCell>>;

/** One already authenticated operational channel, without captured recurrence fields. */
type SkyMechanismAdaptiveChannel = Readonly<{
	/** Original Direct40 channel. */ channel: number;
	/** Exact parent diagnostic artifact. */ artifact: DialFileIdentity;
	/** Complete ordinary and frozen-component operational evidence. */ value: SkyAdaptiveCaptureEvidence;
}>;

/** Minimal pure evaluation input, also usable by manufactured proofs. */
type SkyMechanismAdaptiveInput = Readonly<{
	/** Registered V background identity. */ caseId: string;
	/** Authenticated capture seal identity. */ sourceIdentity: DialFileIdentity;
	/** All six registered numerical channels. */ channels: readonly SkyMechanismAdaptiveChannel[];
	/** Reproduced fixed-field envelopes keyed by channel/probe/representation/order. */ envelopes: ReadonlyMap<
		string,
		SkyContinuationProbeDiagnostic
	>;
}>;

/** Separate component, measurement and runtime-work products. */
type SkyMechanismAdaptiveAssessment = Readonly<{
	/** Every frozen scalar comparison, including unavailable allowances. */ table: SkyContinuationAnalysisTable;
	/** Three-time ordinary-screen Kider scores; extra-time probes are excluded. */ scores: SkyContinuationAnalysisTable;
	/** Per-channel scope and checkpoint counts, not elapsed GPU-job timing. */ work: SkyContinuationAnalysisTable;
	/** Counts of explicit local comparisons and limited measured responses. */ summary: SkyMechanismPackageSummary;
}>;

/** Local mutable counters accumulated once per scalar comparison. */
type SkyMechanismAdaptiveCounts = {
	/** Comparisons passing the empirical response-size gate. */ adequate: number;
	/** Qualified positive absolute-error reductions. */ improved: number;
	/** Qualified negative absolute-error reductions. */ worsened: number;
	/** Missing allowances or effects below their gate. */ unresolved: number;
};

/** Pure manufactured assessment checks; does not qualify atmospheric behavior. */
type SkyMechanismAdaptiveAssessmentProof = Readonly<{
	/** Exact proof identity. */ schemaId: 'sky-mechanism-adaptive-assessment-proof-v1';
	/** Number of completed mathematical and admission assertions. */ checks: number;
}>;
