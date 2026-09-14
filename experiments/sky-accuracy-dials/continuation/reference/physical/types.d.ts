/** Independent physical quadrature formulation.
 * - **"gauss"** - Adaptive distance-domain Gauss-Legendre 8/16 comparison.
 * - **"simpson"** - Adaptive Simpson; outer rays use square-root altitude.
 */
type SkyPhysicalReferenceMethod = 'gauss' | 'simpson';

/** Adaptive acceptance strategy for outer radiance integration only.
 * - **"local"** - Preserve the original fraction-scaled leaf acceptance and traversal.
 * - **"global"** - Refine the complete partition until each summed error meets the original whole-domain tolerance.
 */
type SkyPhysicalOuterStrategy = 'local' | 'global';

/** Simpson samples and complete child coarse estimates retained for one leaf. */
type SkyPhysicalGlobalSimpsonSamples = Readonly<{
	/** Original left endpoint vector. */ left: readonly number[];
	/** Original interval midpoint vector. */ middle: readonly number[];
	/** Original right endpoint vector. */ right: readonly number[];
	/** Left-half midpoint vector already evaluated for the leaf fine estimate. */ leftMiddle: readonly number[];
	/** Right-half midpoint vector already evaluated for the leaf fine estimate. */ rightMiddle: readonly number[];
	/** Complete coarse Simpson estimate for the left child. */ leftCoarse: readonly number[];
	/** Complete coarse Simpson estimate for the right child. */ rightCoarse: readonly number[];
}>;

/** One complete leaf in a global adaptive quadrature partition. */
type SkyPhysicalGlobalLeaf = Readonly<{
	/** Lower integration coordinate. */ start: number;
	/** Upper integration coordinate. */ end: number;
	/** Number of bisections from the original interval. */ depth: number;
	/** Complete fine estimate, without extrapolation. */ values: readonly number[];
	/** Absolute fine/coarse differences for this whole leaf. */ errors: readonly number[];
	/** Reusable Simpson samples; null for independently sampled Gauss leaves. */ simpson: SkyPhysicalGlobalSimpsonSamples | null;
}>;

/** Local/global behavior on a manufactured smooth-primary/tiny-jump vector. */
type SkyPhysicalGlobalAuxiliaryProof = Readonly<{
	/** Independent quadrature family used by both strategies. */ method: SkyPhysicalReferenceMethod;
	/** Legacy result at exactly the same tolerances and cap. */ local: SkyPhysicalQuadratureResult;
	/** Global result at exactly the same tolerances and cap. */ global: SkyPhysicalQuadratureResult;
}>;

/** Bounded manufactured verification of global error allocation; no physical evidence run. */
type SkyPhysicalGlobalProof = Readonly<{
	/** Distinct manufactured proof identity. */ schemaId: string;
	/** Number of actual mathematical, failure and admission assertions. */ checks: number;
	/** Largest analytic polynomial/vector integration discrepancy. */ maximumPolynomialError: number;
	/** Largest discrepancy against the analytic narrow-peak integral. */ maximumPeakError: number;
	/** Same-tolerance local/global comparisons for the tiny auxiliary jump. */ tinyAuxiliary: readonly SkyPhysicalGlobalAuxiliaryProof[];
	/** Finite empirical estimator and unsampled-feature limitations. */ limitations: readonly string[];
}>;

/** Explicit bounded physical-reference work profile.
 * - **"standard"** - Preserve the original 262144 medium-pair allowance for both methods and all fixed-field callers.
 * - **"simpson-expanded-medium"** - Permit 1048576 medium pairs only for explicitly selected physical-J1 Simpson; all other limits and tolerances remain unchanged.
 */
type SkyPhysicalReferenceProfile = 'standard' | 'simpson-expanded-medium';

/** Method-specific medium-pair ceilings shared by the two tolerance passes. */
type SkyPhysicalMethodMediumLimits = Readonly<{
	/** Physical Gauss and default fixed-field ceiling. */ gauss: number;
	/** Physical Simpson ceiling selected by the named profile. */ simpson: number;
}>;

/** Frozen numerical work/admission policy, recorded before physical computation. */
type SkyPhysicalReferencePolicy = Readonly<{
	/** Explicit selected work profile. */ profile: SkyPhysicalReferenceProfile;
	/** Per-physical-ray medium-pair ceilings for each method. */ maximumMediumEvaluations: SkyPhysicalMethodMediumLimits;
	/** Shared outer-evaluation ceiling across both passes of one ray/method. */ maximumOuterEvaluations: number;
	/** Evaluation ceiling for each separate geometric column. */ maximumColumnEvaluations: number;
	/** Exact unchanged tolerance and numerical admission policy. */ tolerancePolicy: string;
}>;

/** Mutable accounting shared by both accuracy passes of one ray/formulation. */
type SkyPhysicalReferenceBudget = {
	/** Named work profile authorizing this budget. */ profile: SkyPhysicalReferenceProfile;
	/** Explicit physical-J1 method; null identifies the unchanged generic column budget. */ physicalMethod: SkyPhysicalReferenceMethod | null;
	/** Actual evaluations of one pair of exponential density profiles. */ mediumEvaluations: number;
	/** Maximum profile-pair evaluations for this ray and formulation. */ maximumMediumEvaluations: number;
	/** Actual outer integrand evaluations across both passes. */ outerEvaluations: number;
	/** Maximum outer integrand evaluations across both passes. */ maximumOuterEvaluations: number;
	/** Maximum evaluations admitted for an individual column integral. */ maximumColumnEvaluations: number;
	/** Number of geometric column invocations, including unresolved columns. */ columnCalls: number;
	/** Largest observed column evaluation count; physical callers reset this measurement at each pass boundary. */ columnEvaluationHighWater: number;
	/** Multiplier on admitted absolute and relative tolerances. */ toleranceScale: number;
	/** Last synchronous heartbeat callback time in milliseconds. */ lastProgressMilliseconds: number;
	/** Optional heartbeat/cancellation callback; throwing aborts the caller. */ onProgress?: () => void;
};

/** A bounded vector quadrature result; unresolved estimates are never accepted as zero. */
type SkyPhysicalQuadratureResult = {
	/** Best complete estimate, or null if no complete interval was evaluated. */ values: number[] | null;
	/** Sum of absolute coarse/fine differences; empirical, not a rigorous bound. */ errors: number[] | null;
	/** Actual integrand evaluations for this integration invocation. */ evaluations: number;
	/** Whether the selected local-leaf or global-partition criterion passes within the work caps. */ converged: boolean;
	/** Explicit stopping reason; null on convergence. */ reason: string | null;
};

/** Two reusable geometric columns; spectral coefficients are applied afterward. */
type SkyPhysicalColumnResult = {
	/** Integral of the Rayleigh relative density along the path in metres. */ rayleighMeters: number | null;
	/** Integral of the Mie relative density along the path in metres. */ mieMeters: number | null;
	/** Empirical Rayleigh column integration remainder in metres. */ errorRayleighMeters: number | null;
	/** Empirical Mie column integration remainder in metres. */ errorMieMeters: number | null;
	/** Actual profile-pair evaluations for this column. */ evaluations: number;
	/** Whether both profile integrals resolved within their tolerances and caps. */ converged: boolean;
	/** Explicit unresolved reason; null on convergence. */ reason: string | null;
};

/** Two accuracy passes of one first-order physical ray formulation. */
type SkyPhysicalMethodResult = {
	/** Independent quadrature family. */ method: SkyPhysicalReferenceMethod;
	/** Best complete radiance estimate in channel order; fine pass when available, otherwise unresolved coarse estimate. */ values:
		number[] | null;
	/** Complete coarse-pass radiance used to reconstruct the declared pass-agreement tolerance. */ coarseValues:
		number[] | null;
	/** Absolute coarse/fine pass differences in radiance units, or null. */ refinementDifferences: number[] | null;
	/** Fine-pass outer quadrature difference estimates in radiance units, or null. */ outerErrors: number[] | null;
	/** Integrated empirical attenuation error allowances in radiance units, or null. */ innerAllowances:
		number[] | null;
	/** Actual profile-pair evaluations across both passes. */ mediumEvaluations: number;
	/** Actual outer evaluations across both passes. */ outerEvaluations: number;
	/** Whether both outer passes satisfy the selected strategy and all columns satisfy unchanged local criteria; independent admission is recorded per row. */ converged: boolean;
	/** Explicit unresolved reasons. */ reasons: string[];
	/** Per-tolerance-pass work, timing and stopping accounting in execution order. */ passes: SkyPhysicalPassDiagnostics[];
};

/** Compact diagnostics of one physical method's tolerance pass. */
type SkyPhysicalPassDiagnostics = {
	/** Multiplier 4 for the coarse pass or 1 for the fine pass. */ toleranceScale: number;
	/** Nonnegative monotonic elapsed time for this pass, including cooperative callbacks, in milliseconds. */ elapsedMilliseconds: number;
	/** Actual density-pair evaluations consumed in this pass. */ mediumEvaluations: number;
	/** Actual outer-integrand evaluations consumed in this pass. */ outerEvaluations: number;
	/** Number of geometric source/view column calls in this pass. */ columnCalls: number;
	/** Largest actual evaluation count of any column in this pass. */ maximumColumnEvaluationsUsed: number;
	/** Whether the selected outer strategy and local column criteria pass within every work limit. */ converged: boolean;
	/** Explicit stopping reason; null on convergence. */ reason: string | null;
};

/** One channel/probe physical reference comparison. */
type SkyPhysicalReferenceRow = {
	/** Caller-owned deterministic probe identity. */ probeId: string;
	/** Registered capture time. */ time: string;
	/** Canonical grid column. */ gridX: number;
	/** Canonical grid row. */ gridY: number;
	/** Direct40 spectral channel index. */ channel: number;
	/** Best distance-domain estimate; qualified only when resolved, or null when unavailable. */ gaussWatts:
		number | null;
	/** Best altitude-domain estimate; qualified only when resolved, or null when unavailable. */ simpsonWatts:
		number | null;
	/** Absolute method discrepancy, or null when unavailable. */ methodDifferenceWatts: number | null;
	/** Empirical remaining-error allowance, or null when either method is unresolved. */ empiricalAllowanceWatts:
		number | null;
	/** Whether declared quadrature convergence, pass refinement and method-agreement gates all passed. */ resolved: boolean;
	/** Explicit numerical admission failures; empty only for resolved rows. */ reasons: string[];
};

/** Admission of a channel after all independent physical consistency gates. */
type SkyPhysicalChannelAdmission = {
	/** Absolute fine-method difference, retained even after a gate failure. */ methodDifferenceWatts: number | null;
	/** Empirical remaining-error allowance; null unless every admission gate passed. */ empiricalAllowanceWatts:
		number | null;
	/** Whether declared quadrature convergence and the consistency policy both passed. */ resolved: boolean;
	/** Explicit gate failures; empty only on acceptance. */ reasons: string[];
};

/** Compact independent first-order physical reference evidence. */
type SkyPhysicalReferenceReport = {
	/** Distinct physical-reference output schema. */ schemaId: string;
	/** Explicit selected work profile; changes no accuracy or admission tolerance. */ profile: SkyPhysicalReferenceProfile;
	/** Same frozen policy owner used to authorize the method budgets. */ numericalPolicy: SkyPhysicalReferencePolicy;
	/** Radiance unit shared by values and allowances. */ units: string;
	/** Explicit common-model and finite-reference limitations. */ limitations: string[];
	/** Deterministic component-level spectral comparisons. */ rows: SkyPhysicalReferenceRow[];
	/** Method-level accounting and refinement diagnostics for each probe. */ probes: SkyPhysicalProbeDetail[];
	/** Whether every admitted probe/channel is numerically resolved. */ resolved: boolean;
};

/** Method-level diagnostics for one caller-identified physical ray. */
type SkyPhysicalProbeDetail = {
	/** Caller-owned deterministic probe identity. */ probeId: string;
	/** Independent formulations in Gauss, then Simpson order. */ methods: SkyPhysicalMethodResult[];
};

/** Physical-ray channel result without unrelated benchmark grid metadata. */
type SkyPhysicalSurfaceChannel = Readonly<
	SkyPhysicalChannelAdmission & {
		/** Direct40 spectral channel. */ channel: number;
		/** Fine or explicitly unresolved Gauss estimate, in radiance watts. */ gaussWatts: number | null;
		/** Fine or explicitly unresolved Simpson estimate, in radiance watts. */ simpsonWatts: number | null;
	}
>;

/** Independent physical evaluation of one arbitrary outward surface ray. */
type SkyPhysicalSurfaceResult = Readonly<{
	/** Independent Gauss and Simpson methods in that order. */ methods: readonly SkyPhysicalMethodResult[];
	/** Per-channel estimates and admission gates. */ channels: readonly SkyPhysicalSurfaceChannel[];
	/** True only when every returned channel passes every gate. */ resolved: boolean;
}>;

/** A complete adaptive interval estimate and its empirical remainder. */
type SkyPhysicalIntervalEstimate = {
	/** Best complete vector integral for the interval. */ values: number[];
	/** Absolute coarse/fine differences summed over the complete retained leaf partition. */ errors: number[];
};

/** Analytic distance map of the independent square-root-altitude coordinate. */
type SkyPhysicalAltitudeCoordinate = {
	/** Distance from the observer along the outward ray in metres. */ distance: number;
	/** Derivative of distance with respect to sqrt(altitude increment). */ jacobian: number;
};

/** Manufactured independent-reference proof summary. */
type SkyPhysicalReferenceProof = {
	/** Distinct proof schema identity. */ schemaId: string;
	/** Number of checked mathematical and failure-path assertions. */ checks: number;
	/** Largest absolute polynomial moment error. */ maximumPolynomialError: number;
	/** Largest relative vertical exponential-column error. */ maximumVerticalRelativeError: number;
	/** Largest absolute radiance error against the homogeneous slab solution. */ maximumSlabAbsoluteError: number;
};
