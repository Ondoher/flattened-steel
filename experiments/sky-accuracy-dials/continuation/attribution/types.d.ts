/** Inputs for an exact order decomposition of the existing component discrepancy. */
type SkyOrderAttributionRequest = Readonly<{
	/** Original accepted C0 run. */ registrationRun: string;
	/** Accepted raw H capture with independently integrated grouped orders. */ captureRun: string;
	/** Accepted physical-J1 compensation assessment of that capture. */ assessmentRun: string;
}>;
/** Authenticated terminal and its complete artifact inventory. */
type SkyOrderAttributionParent = Readonly<{
	/** Verified terminal file identity. */ identity: DialFileIdentity;
	/** Exact retained terminal schema subset with explicit parent derivations. */ seal: SkyOrderAttributionSeal;
}>;
/** Terminal subset extending the existing C1 reader with the derivation used here. */
type SkyOrderAttributionSeal = SkyJ1AssessmentSeal & Readonly<{
	/** Registered parameters and exact consumed parent identities. */ recipe: SkyOrderAttributionRecipe;
}>;
/** Original construction parameters with the additional parent edge needed for attribution. */
type SkyOrderAttributionRecipe = SkyContinuationAnalysisRecipe & Readonly<{
	/** Exact original input and evidence identities. */ parents: readonly DialFileIdentity[];
}>;
/** Signed decomposition on one original component sample; all radiances are W m^-2 sr^-1 nm^-1. */
type SkyOrderAttributionRow = Readonly<{
	/** Original selected point identity. */ probeId: string;
	/** Original benchmark time. */ time: string;
	/** Direct40 spectral channel. */ channel: number;
	/** Physical first-order reference minus Kider measurement. */ physicalFirstResidual: number;
	/** Grouped cumulative N1-N4 radiances from one fixed-field reference method. */ cumulative: readonly number[];
	/** Physical-first residual followed by effective J2, J3 and J4 additions. */ contributions: readonly number[];
	/** Conservative component integration allowances, in the same order as contributions; measurement uncertainty is excluded. */ allowances: readonly (number | null)[];
	/** Original raw first-order numerical error. */ firstNumerical: number;
	/** Remaining discrepancy after replacement of first order by physical reference. */ remaining: number;
	/** Twice firstNumerical times each contribution, in squared radiance units. */ cancellationContributions: readonly number[];
	/** Absolute telescoping identity residual, in radiance units. */ identityResidual: number;
}>;
/** Parallel descriptive group summaries; these classify contributions, not independently established higher-order errors. */
type SkyOrderAttributionGroup = Readonly<{
	/** All selected probes or an exact time identifier. */ id: string;
	/** Number of contributing original spectral scalars. */ count: number;
	/** Signed mean contribution in mW m^-2 sr^-1 nm^-1. */ meanContributionsMilliwatt: readonly number[];
	/** RMS contribution in mW m^-2 sr^-1 nm^-1. */ rmsContributionsMilliwatt: readonly number[];
	/** Four by four signed dot products in squared radiance watts. */ contributionDotProducts: readonly (readonly number[])[];
	/** Sum of 2*n*component, in squared radiance watts. */ cancellationContributions: readonly number[];
	/** Signed mean remaining discrepancy in radiance milliwatts. */ meanRemainingMilliwatt: number;
	/** RMS remaining discrepancy in radiance milliwatts. */ rmsRemainingMilliwatt: number;
	/** Count of negative remaining discrepancies. */ negativeCount: number;
	/** Count of positive remaining discrepancies. */ positiveCount: number;
	/** Absolute SSE telescope residual, in squared radiance watts. */ squaredIdentityResidual: number;
}>;
/** Small self-verifying algebra proof independent of atmospheric fixtures. */
type SkyOrderAttributionProof = Readonly<{
	/** Explicit manufactured-proof identity. */ schemaId: string;
	/** Number of checked cases, including rejection cases. */ checks: number;
}>;
