/** Per-ray arithmetic over the 31 registered spectral channels. */
type DialResidualPoint = DialAnalysisRay & {
	/** Capture time in local EDT. */ readonly time: string;
	/** Zero-based horizontal grid coordinate. */ readonly gridX: number;
	/** Zero-based vertical grid coordinate; rows increase downward in the figure. */ readonly gridY: number;
	/** Whether the ray is within 15 degrees of the fitted Sun. */ readonly nearSun: boolean;
	/** Whether elevation is at most 20 degrees. */ readonly lowElevation: boolean;
	/** Arithmetic mean measured spectral radiance in W m^-2 sr^-1 nm^-1. */ readonly measuredMeanW: number;
	/** Arithmetic mean control spectral radiance in the same units. */ readonly controlMeanW: number;
	/** Arithmetic mean candidate spectral radiance in the same units. */ readonly candidateMeanW: number;
	/** Mean signed control-minus-measurement residual in spectral-radiance units. */ readonly controlResidualMeanW: number;
	/** Mean signed candidate-minus-measurement residual in spectral-radiance units. */ readonly candidateResidualMeanW: number;
	/** Control sum of squared spectral residuals, in squared W spectral-radiance units. */ readonly controlSse: number;
	/** Candidate sum of squared spectral residuals, in squared W spectral-radiance units. */ readonly candidateSse: number;
	/** Control spectral RMSE in mW m^-2 sr^-1 nm^-1. */ readonly controlRmseMilliwatt: number;
	/** Candidate spectral RMSE in mW m^-2 sr^-1 nm^-1. */ readonly candidateRmseMilliwatt: number;
	/** Candidate-minus-control RMSE; positive means worse measured agreement. */ readonly rmseChangeMilliwatt: number;
	/** Fraction of this condition's control SSE supplied by this point. */ readonly controlConditionSseShare: number;
	/** Fraction of this condition's candidate SSE supplied by this point. */ readonly candidateConditionSseShare: number;
	/** Sum of squared C4 candidate-minus-control spectral changes. */ readonly deltaEnergy: number;
	/** Sum of squared C1 candidate-minus-control spectral changes. */ readonly firstOrderDeltaEnergy: number;
	/** Sum of squared changes in the reconstructed C4-C1 increment. */ readonly higherOrderDeltaEnergy: number;
	/** Twice the dot product of the C1 and C4-C1 changes; energies are not additive without it. */ readonly orderCrossTerm: number;
	/** Mean signed C4 candidate-minus-control radiance change. */ readonly deltaMeanW: number;
	/** Mean signed C1 candidate-minus-control radiance change. */ readonly firstOrderDeltaMeanW: number;
	/** Mean signed change of the C4-C1 increment. */ readonly higherOrderDeltaMeanW: number;
	/** Twice the control residual dot the numerical spectral change. */ readonly residualCrossTerm: number;
};

/** Additive residual and numerical-response totals for an explicitly counted point set. */
type DialResidualTotals = {
	/** Number of selected time/ray points. */ readonly pointCount: number;
	/** Number of selected point/channel values. */ readonly scalarCount: number;
	/** Sum of control squared residuals. */ readonly controlSse: number;
	/** Sum of candidate squared residuals. */ readonly candidateSse: number;
	/** Pooled control RMSE in mW m^-2 sr^-1 nm^-1; null for an empty set. */ readonly controlRmseMilliwatt:
		number | null;
	/** Pooled candidate RMSE in mW m^-2 sr^-1 nm^-1; null for an empty set. */ readonly candidateRmseMilliwatt:
		number | null;
	/** Sum of squared C4 spectral changes. */ readonly deltaEnergy: number;
	/** Sum of squared C1 spectral changes. */ readonly firstOrderDeltaEnergy: number;
	/** Sum of squared C4-C1 spectral changes. */ readonly higherOrderDeltaEnergy: number;
	/** Sum of twice the first/higher-order change dot products. */ readonly orderCrossTerm: number;
	/** Sum of twice the control residual/numerical change dot products. */ readonly residualCrossTerm: number;
};

/** Geometrically selected sets; near-Sun and low-elevation totals deliberately overlap. */
type DialResidualGroups = {
	/** All selected points. */ readonly all: DialResidualTotals;
	/** Rays within 15 degrees of the Sun. */ readonly nearSun: DialResidualTotals;
	/** Rays at or below 20 degrees elevation. */ readonly lowElevation: DialResidualTotals;
	/** Explicit intersection of the two named groups. */ readonly overlap: DialResidualTotals;
	/** Explicit union of the two named groups. */ readonly union: DialResidualTotals;
	/** Rays in neither group. */ readonly neither: DialResidualTotals;
};

/** One time's spatial concentration and additive attribution. */
type DialResidualCondition = {
	/** Capture time in local EDT. */ readonly time: string;
	/** Geometric subsets and their overlap. */ readonly groups: DialResidualGroups;
	/** Five largest control-SSE points, descending with ray-index tie breaking. */ readonly topControl: readonly DialResidualPoint[];
	/** Five largest candidate-SSE points, descending with ray-index tie breaking. */ readonly topCandidate: readonly DialResidualPoint[];
	/** Whether the largest-SSE ray is identical before and after. */ readonly worstPointUnchanged: boolean;
};

/** Complete authenticated, reproducible residual attribution for two full N4 runs. */
type DialResidualReport = {
	/** Versioned report schema identity. */ readonly schemaId: string;
	/** Exact parent seals and measurement/control input identities. */ readonly parents: readonly DialFileIdentity[];
	/** Complete admitted control configuration. */ readonly control: SkyGpuControl;
	/** Complete admitted candidate configuration. */ readonly candidate: SkyGpuControl;
	/** Exact scored time/ray/channel coordinates. */ readonly selection: DialAnalysisSelection;
	/** Radiance unit; SSE and energy use its square. */ readonly units: string;
	/** Explicit equations and interpretation boundaries. */ readonly equations: readonly string[];
	/** Canonical full-boundary control score. */ readonly controlScore: DialBoundaryScore;
	/** Canonical full-boundary candidate score. */ readonly candidateScore: DialBoundaryScore;
	/** All 1,377 points in time then Y-major order. */ readonly points: readonly DialResidualPoint[];
	/** Seventeen time-specific concentration summaries. */ readonly conditions: readonly DialResidualCondition[];
	/** All-time geometric subset totals. */ readonly groups: DialResidualGroups;
	/** Number of times retaining the same worst ray. */ readonly worstPointUnchangedCount: number;
	/** Largest relative roundoff residual in verified SSE and energy identities. */ readonly maximumRelativeIdentityError: number;
};
