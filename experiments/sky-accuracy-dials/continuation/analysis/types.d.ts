/** Compact JSON/CSV cell with an explicit null for unresolved quantities. */
type SkyContinuationAnalysisCell = string | number | boolean | null;
/** One bounded table retaining column identities rather than repeating field names per row. */
type SkyContinuationAnalysisTable = Readonly<{
	/** Ordered machine-readable columns, including physical units where applicable. */ columns: readonly string[];
	/** Rows in declared column order. */ rows: readonly (readonly SkyContinuationAnalysisCell[])[];
}>;
/** Authenticated subset of a continuation construction's immutable terminal manifest. */
type SkyContinuationAnalysisSeal = Readonly<{
	/** Accepted execution is required before scientific analysis. */ state: DialRunState;
	/** Complete exact artifact identities used to authenticate each consumed file. */ artifacts: readonly DialFileIdentity[];
	/** Construction derivation and registered job parameters. */ recipe: SkyContinuationAnalysisRecipe;
}>;
/** Consumed registration and execution identities, without open-ended parameter access. */
type SkyContinuationAnalysisRecipe = Readonly<{
	/** Frozen construction/job identity. */ parameters: SkyContinuationAnalysisParameters;
}>;
/** Values required to admit a C1/C2 construction as analysis evidence. */
type SkyContinuationAnalysisParameters = Readonly<{
	/** Exact C0 registration run. */ continuationRegistration: string;
	/** Required GPU construction discriminator. */ jobKind: SkyContinuationJobKind;
	/** Original construction/capture scope. */ scope: SkyContinuationJobScope;
	/** Governing phase, restricted to C1 or C2 by the reader. */ phase: string;
}>;
/** Per-channel retained metadata with exact compressed diagnostic identity. */
type SkyContinuationAnalysisChannel = SkyGpuChannelSummary &
	Readonly<{
		/** Exact binary64 spectrum artifact. */ spectra: DialFileIdentity;
		/** Losslessly compressed component evidence; null on channels outside the probe scope. */ diagnosticArtifact: DialFileIdentity | null;
	}>;
/** One authenticated decoded component channel kept only during the bounded CPU operation. */
type SkyContinuationAnalysisDiagnostic = Readonly<{
	/** Direct40 channel ordinal. */ channel: number;
	/** Exact original compressed evidence identity. */ artifact: DialFileIdentity;
	/** Validated diagnostic schema, scope, work counts and reference rows. */ record: SkyContinuationChannelDiagnostics;
}>;
/** Authenticated compact source buffers and metadata shared by the analysis operations. */
type SkyContinuationAnalysisSource = Readonly<{
	/** Immutable construction run. */ run: string;
	/** Explicit C1/C2 source phase. */ phase: string;
	/** Construction scope retained separately from analysis job scope. */ scope: SkyContinuationJobScope;
	/** Compact main-spectrum buffers and selectors. */ loaded: DialLoadedSpectra;
	/** Unchanged registered scorer output for all stored selectors. */ scores: DialRunScores;
	/** Complete per-channel field checks. */ channels: readonly SkyContinuationAnalysisChannel[];
	/** Channel-specific fixed-field component references. */ diagnostics: readonly SkyContinuationAnalysisDiagnostic[];
	/** Hash of the complete sparse coordinate union, needed for field parity. */ coordinateSha256: string;
}>;
/** Mutable accumulator for one explicit reference scope, never an infinite-order reference. */
type SkyContinuationReferenceAccumulator = {
	/** Frozen condition. */ time: string;
	/** Direct40 index. */ channel: number;
	/** Explicit raw/factored grouping identity. */ representation: string;
	/** Cumulative stage. */ order: number;
	/** Number of component rays. */ count: number;
	/** Number whose empirical fixed-field allowance is resolved. */ resolved: number;
	/** Sum of squared empirical allowances for resolved components only. */ squaredAllowance: number;
	/** Largest resolved scalar allowance. */ maximumAllowance: number;
	/** Sum of squared reference radiance. */ squaredReference: number;
	/** Number of rays also available in ordinary midpoint views. */ aligned: number;
	/** Sum of squared midpoint-8 minus reference values. */ squaredError8: number;
	/** Sum of squared midpoint-16 minus reference values. */ squaredError16: number;
	/** Distinct explicit unresolved-reference reasons. */ limitations: Set<string>;
};
/** Exact dependency and final-view parity result for the C1 causal pair. */
type SkyContinuationCausalResult = Readonly<{
	/** True only when both registered matched C1 captures were supplied. */ assessed: boolean;
	/** Null when not assessed; otherwise conjunction of coordinate, field and raw-spectrum parity. */ passed:
		boolean | null;
	/** Exact compared source seals. */ parents: readonly DialFileIdentity[];
	/** Whether complete sparse support hashes agree. */ coordinateParity: boolean | null;
	/** Number of matched channel/order pure-field hashes checked. */ higherOrderChecks: number;
	/** Exact J2-J4 values have matching coordinates and pure hashes. */ higherOrderParity: boolean | null;
	/** Number of matched raw cumulative radiance scalars. */ rawScalarChecks: number;
	/** Exact numerical identity of raw cumulative results in every retained view/order/channel. */ rawCumulativeParity:
		boolean | null;
	/** Explicit limitation and interpretation of the final-view intervention. */ interpretation: string;
}>;
