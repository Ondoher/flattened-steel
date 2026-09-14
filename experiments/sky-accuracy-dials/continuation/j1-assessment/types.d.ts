/** Authenticated terminal subset consumed by the physical-J1 assessment. */
type SkyJ1AssessmentParent = Readonly<{
	/** Exact run path. */ run: string;
	/** Verified immutable terminal identity. */ identity: DialFileIdentity;
	/** Required accepted state and declared artifact inventory. */ seal: SkyJ1AssessmentSeal;
}>;
/** Shared terminal fields needed to bind CPU/GPU evidence to C0. */
type SkyJ1AssessmentSeal = SkyContinuationAnalysisSeal &
	Readonly<{
		/** Recorded canonical run path. */ run: string;
		/** Exact execution result discriminator. */ result: Readonly<{
			/** Named construction/reference case. */ caseId?: string;
		}>;
	}>;
/** Explicit physical control subset, including compatibility with the original standard pilot. */
type SkyJ1AssessmentPhysicalControl = Readonly<{
	/** Exact C0 seal. */ registration: DialFileIdentity;
	/** Exact frozen physical input. */ input: DialFileIdentity;
	/** Four selected Direct40 channels. */ channels: readonly number[];
	/** Forty frozen world-space rays. */ probes: readonly SkyReferenceProbe[];
	/** Explicit profile in current runs; absent only in the known original standard pilot. */ profile?: SkyPhysicalReferenceProfile;
}>;
/** One authenticated H construction and all compact component envelopes. */
type SkyJ1AssessmentCapture = Readonly<{
	/** Authenticated original parent. */ parent: SkyJ1AssessmentParent;
	/** Exact ordinary spectra and controls. */ loaded: DialLoadedSpectra;
	/** Coordinate union identity required for field comparisons. */ coordinateSha256: string;
	/** Original field checks in channel order. */ channels: readonly SkyContinuationAnalysisChannel[];
	/** Fully reproduced envelopes keyed by channel/probe/representation/order. */ envelopes: ReadonlyMap<
		string,
		SkyContinuationProbeDiagnostic
	>;
	/** Exact identities of consumed compressed diagnostic files. */ diagnostics: readonly DialFileIdentity[];
}>;
/** Scalar grouped field values, physical discrepancy and measured-residual decomposition. */
type SkyJ1AssessmentCase = Readonly<{
	/** Grouped first-order fixed-field reference, spectral W. */ firstOrderW: number;
	/** Grouped N4 fixed-field reference, spectral W. */ fourthOrderW: number;
	/** Empirical fixed-field first-order integration allowance; null is unresolved. */ firstOrderAllowanceW:
		number | null;
	/** Empirical fixed-field N4 integration allowance; null is unresolved. */ fourthOrderAllowanceW: number | null;
	/** Signed J1 numerical discrepancy L1 minus admitted physical J1. */ numericalW: number | null;
	/** Absolute J1 numerical discrepancy. */ absoluteFirstOrderErrorW: number | null;
	/** Sum of fixed-field J1 and physical-reference allowances. */ numericalAllowanceW: number | null;
	/** Measured N4 residual L4 minus measurement, retained even without physical resolution. */ residualW: number;
	/** Remaining residual L4 minus L1 plus physical J1 minus measurement. */ remainingW: number | null;
	/** Sum of L4, L1 and physical numerical allowances; excludes observation/model uncertainty. */ remainingAllowanceW:
		number | null;
	/** Twice the signed numerical/remaining product, in squared spectral W. */ crossTermW2: number | null;
	/** Roundoff residual of r minus n minus p. */ identityResidualW: number | null;
}>;
/** One frozen component channel with both final-J1 representations. */
type SkyJ1AssessmentRow = Readonly<{
	/** Frozen component identity. */ probeId: string;
	/** Registered condition. */ time: string;
	/** Canonical grid column. */ gridX: number;
	/** Canonical grid row. */ gridY: number;
	/** Direct40 channel ordinal. */ channel: number;
	/** Registered elevation used for descriptive overlapping strata. */ elevationDegrees: number;
	/** Registered source separation used for descriptive overlapping strata. */ sunSeparationDegrees: number;
	/** Original measured spectral radiance, W. */ measuredW: number;
	/** Mean of admitted physical Gauss/Simpson values; null when unresolved. */ physicalW: number | null;
	/** Physical empirical numerical allowance, not observation uncertainty. */ physicalAllowanceW: number | null;
	/** Explicit missing or unresolved reference reasons. */ reasons: readonly string[];
	/** Raw grouped fixed-field values and decomposition. */ raw: SkyJ1AssessmentCase;
	/** Factored grouped fixed-field values and decomposition. */ factored: SkyJ1AssessmentCase;
	/** Raw absolute error minus factored absolute error; positive improves J1. */ reductionW: number | null;
	/** Conservative sum of the two J1 discrepancy allowances. */ reductionAllowanceW: number | null;
	/** Null without references; otherwise the frozen numerical-reduction gate. */ reductionQualified: boolean | null;
	/** Difference of factored and raw reconstructed higher-order contributions. */ higherOrderDifferenceW: number;
	/** Sum of four fixed-field allowances on that difference. */ higherOrderDifferenceAllowanceW: number | null;
}>;
/** Norm and compensation terms within one explicitly selected component group. */
type SkyJ1AssessmentCaseGroup = Readonly<{
	/** L2 norm of first-order numerical errors; null if any selected reference is unresolved. */ numericalNormW:
		number | null;
	/** Euclidean empirical numerical allowance. */ numericalAllowanceNormW: number | null;
	/** Sum of squared first-order numerical errors. */ numericalSseW2: number | null;
	/** Sum of squared remaining residuals, including higher-order numerical/model/observation errors. */ remainingSseW2:
		number | null;
	/** Signed sum of 2*n*p; negative values indicate cancellation. */ crossTermW2: number | null;
	/** Sum of squared N4 measured residuals over the entire selected group. */ residualSseW2: number;
	/** Biased four-channel component RMSE, not full B1 score, in spectral mW. */ componentRmseMilliwatt: number;
	/** Difference between residual SSE and its complete three-term decomposition. */ identityResidualW2: number | null;
	/** Euclidean allowance on the remaining residual, excluding observation/model uncertainty. */ remainingAllowanceNormW:
		number | null;
}>;
/** Named group assessment without excluding unresolved members. */
type SkyJ1AssessmentGroup = Readonly<{
	/** Stable descriptive selector, with overlapping geometry explicitly disclosed. */ id: string;
	/** Number of original component scalars. */ count: number;
	/** Number with all physical and fixed-field references resolved. */ resolvedCount: number;
	/** Raw grouped decomposition. */ raw: SkyJ1AssessmentCaseGroup;
	/** Factored grouped decomposition. */ factored: SkyJ1AssessmentCaseGroup;
	/** Raw error norm minus factored error norm; positive improves J1. */ reductionW: number | null;
	/** Euclidean norm of conservative scalar reduction allowances. */ reductionAllowanceW: number | null;
	/** Null if any selected reference is unresolved. */ reductionQualified: boolean | null;
	/** Norm of the pair's reconstructed higher-order contribution difference. */ higherOrderDifferenceNormW: number;
	/** Sum-based propagated allowance norm for the pair comparison. */ higherOrderDifferenceAllowanceNormW:
		number | null;
	/** Union of selected unresolved-reference reasons. */ reasons: readonly string[];
}>;
