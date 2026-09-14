/** Authenticated continuous first-order reference shared by the finite ladder. */
type SkyLadderPhysicalRead = Readonly<{
	/** Exact immutable physical-reference run. */ run: string;
	/** Complete consumed seal, control and reference artifact identities. */ parents: readonly DialFileIdentity[];
	/** Revalidated independent method results on all forty frozen probes. */ record: SkyPhysicalReferenceReport;
}>;

/** Pinned physical control including the exact work-policy identity. */
type SkyLadderPhysicalControl = SkyJ1AssessmentPhysicalControl &
	Readonly<{
		/** Exact recorded numerical limits and tolerances. */ numericalPolicy: SkyPhysicalReferencePolicy;
	}>;

/** Nullable scalar decomposition; an unresolved term is never replaced by zero. */
type SkyLadderPhysicalValue = Readonly<{
	/** Independently integrated grouped first order. */ firstW: number | null;
	/** Fixed-field first-order integration allowance. */ firstAllowanceW: number | null;
	/** Independently integrated grouped fourth order. */ fourthW: number | null;
	/** Fixed-field fourth-order integration allowance. */ fourthAllowanceW: number | null;
	/** Mean admitted continuous physical first-order reference. */ physicalW: number | null;
	/** Independent physical-reference allowance. */ physicalAllowanceW: number | null;
	/** Matched Kider spectral radiance. */ measuredW: number;
	/** Signed first-order numerical difference. */ numericalW: number | null;
	/** Sum of first-order fixed-field and physical allowances. */ numericalAllowanceW: number | null;
	/** Fourth-order measured residual. */ residualW: number | null;
	/** Remaining residual, containing higher-order numerical and model/observation discrepancy. */ remainingW:
		number | null;
	/** Sum of fourth-order, first-order and physical allowances. */ remainingAllowanceW: number | null;
}>;

/** Complete group norms and compensation terms; empty groups retain null values. */
type SkyLadderPhysicalStats = Readonly<{
	/** Required scalar count, without pruning missing entries. */ count: number;
	/** Number with a resolved first-order numerical allowance. */ firstResolvedCount: number;
	/** Number with resolved first/fourth/physical allowances. */ decompositionResolvedCount: number;
	/** Complete first-order numerical-error norm. */ errorNormW: number | null;
	/** Euclidean norm of summed scalar first-order allowances. */ errorAllowanceNormW: number | null;
	/** First-order error RMS over the biased component sample. */ errorRmsW: number | null;
	/** Sum of squared first-order numerical differences. */ numericalSseW2: number | null;
	/** Sum of squared remaining discrepancies. */ remainingSseW2: number | null;
	/** Signed sum of twice the numerical/remaining product. */ crossTermW2: number | null;
	/** Sum of squared fourth-order measurement residuals. */ residualSseW2: number | null;
	/** Fourth-order component measurement RMSE, never full B1. */ componentRmseMilliwatt: number | null;
	/** Euclidean allowance on remaining discrepancies, excluding observation uncertainty. */ remainingAllowanceNormW:
		number | null;
	/** Euclidean fixed-field fourth-order integration allowance. */ residualAllowanceNormW: number | null;
	/** Algebraic difference of residual SSE and the three-term decomposition. */ identityResidualW2: number | null;
}>;

/** Compact first-order ladder assessment tables retained by the parent run owner. */
type SkyLadderPhysicalTables = Readonly<{
	/** Every rung and frozen scalar, including unresolved members. */ points: SkyContinuationAnalysisTable;
	/** Registered component groups with R0-to-rung numerical-reduction gates. */ groups: SkyContinuationAnalysisTable;
	/** Source coverage, selector identities and qualified/missing counts. */ coverage: SkyContinuationAnalysisTable;
}>;
