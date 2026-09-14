/** Authenticated ordinary capture used only for exact CPU support-map parity. */
type SkyContinuationProofHistory = Readonly<{
	/** Original successful run, never reopened by this proof. */ run: string;
	/** Historical compact controls and fitted scene order. */ control: SkyGpuControl;
	/** Actual browser support inventory from the original execution. */ expected: SkyGpuPlanSummary;
	/** Exact original view source and its retained snapshot. */ originalSources: readonly DialFileIdentity[];
}>;

/** Serializable input to the CPU proof worker; no output capability is transferred. */
type SkyContinuationProofWork = Readonly<{
	/** Distinct worker task identity, not a public evidence command. */ task: 'sky-continuation-c1-proofs';
	/** Authenticated original physical inputs and scene geometry. */ inputs: DialInputs;
	/** Retained measurement table bytes decoded as UTF-8. */ measurementText: string;
	/** Exact source of the measurement table. */ measurementIdentity: DialFileIdentity;
	/** Original independent CPU spectral table decoded as UTF-8. */ baselineText: string;
	/** Exact original CPU table identity. */ baselineIdentity: DialFileIdentity;
	/** Screen and full ordinary captures with their original view selectors. */ history: readonly SkyContinuationProofHistory[];
}>;

/** One exact ordinary support-map reproduction, without recurrence execution. */
type SkyContinuationSupportProof = Readonly<{
	/** Original accepted capture identity. */ run: string;
	/** Original source identities and immutable snapshots. */ originalSources: readonly DialFileIdentity[];
	/** Exact reproduced browser coordinate count. */ coordinateCount: number;
	/** SHA-256 of ordered little-endian Uint32 x/y coordinate pairs. */ coordinateSha256: string;
	/** Main rays in the original registered scene order. */ rayCount: number;
	/** Original view variants, including the screen's Q30/Q60 union. */ viewCount: number;
}>;

/** Positive and negative checks of the browser diagnostic metadata boundary. */
type SkyContinuationDiagnosticsProof = Readonly<{
	/** Accepted fixture descriptions; these contain manufactured values. */ accepted: readonly string[];
	/** Malformed fixture descriptions rejected by the real validator. */ rejected: readonly string[];
	/** Total assertion count. */ checks: number;
}>;

/** Exact structural limits of the largest C1-admitted scalar-field profile. */
type SkyContinuationLayoutProof = Readonly<{
	/** Explicit derived profile identity, including incoming placement. */ buildRequestId: string;
	/** Canonical complete admitted controls. */ controls: SkyControls;
	/** Exact compiler field dimensions and scalar live-field estimate. */ layout: SkyDerivedProfile['layout'];
	/** Explicit distinction between structural proof and actual device allocation. */ scope: string;
}>;

/** Compact successful CPU proof calculations retained in one immutable artifact. */
type SkyContinuationProofReport = Readonly<{
	/** Distinct C1 proof schema. */ schemaId: 'sky-continuation-c1-proof-v1';
	/** Independent score and mathematical-control assertions. */ analysis: DialAnalysisProof;
	/** Positive and negative prediction-control admission checks. */ predictionContracts: DialPredictionContractProof;
	/** Manufactured phase and integration observations, including endpoint-aware Mie rules. */ mechanisms: SkyMechanismProofResult;
	/** Browser diagnostic positive/negative contract checks. */ diagnostics: SkyContinuationDiagnosticsProof;
	/** Maximum admitted structural dimensions; no allocation claim. */ maximumLayout: SkyContinuationLayoutProof;
	/** Independent binary64 physical-reference manufactured checks. */ physicalReference: SkyPhysicalReferenceProof;
	/** Independent fixed-field quadrature and support manufactured checks. */ fixedFieldReference: SkyFixedReferenceProofResult;
	/** Exact old ordinary-map parity, separately scoped from added probe support. */ supportParity: readonly SkyContinuationSupportProof[];
	/** Interpretation limits that no manufactured proof can remove. */ limitations: readonly string[];
}>;

/** Monitorable phase transition from the bounded CPU worker. */
type SkyContinuationProofProgress = Readonly<{
	/** Distinguishes progress from the terminal calculation payload. */ kind: 'progress';
	/** Deterministic phase name. */ phase: string;
	/** Human-readable current calculation. */ message: string;
}>;

/** Successful calculation payload from the bounded CPU worker. */
type SkyContinuationProofCompletion = Readonly<{
	/** Distinguishes the calculation result from progress. */ kind: 'result';
	/** All self-verifying proof results. */ report: SkyContinuationProofReport;
}>;

/** Internal worker messages, with no filesystem or GPU capability. */
type SkyContinuationProofMessage = SkyContinuationProofProgress | SkyContinuationProofCompletion;

/** Verified terminal identity returned to the serial continuation orchestrator. */
type SkyContinuationProofResult = Readonly<{
	/** New immutable CPU proof run. */ run: string;
	/** Exact verified terminal seal. */ seal: DialFileIdentity;
	/** Actual retained bytes including metadata and terminal seal. */ retainedBytes: number;
	/** Charged wall time of the admitted CPU job. */ jobElapsedMilliseconds: number;
}>;
