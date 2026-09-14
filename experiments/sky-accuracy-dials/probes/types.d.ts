/** Inputs for deterministic manufactured mechanism checks; no measured sky data. */
type SkyMechanismProofRequest = Readonly<{
	/** Actual incoming rules to evaluate without modifying or renormalizing them. */
	incomingDomains: readonly SkyIncomingDomain[];
}>;

/** Adaptive Simpson reference integral, independently formed from angular rules. */
type SkyAdaptiveIntegral = Readonly<{
	/** Integral including the local Richardson correction. */ value: number;
	/** Sum of accepted local error estimates; not a rigorous interval bound. */ estimatedAbsoluteError: number;
	/** Number of scalar integrand evaluations. */ evaluations: number;
}>;

/** Angular-rule response of a unit constant incident radiance field. */
type SkyPhaseOrientationSummary = Readonly<{
	/** Lowest integral across the declared outgoing orientations. */ minimum: number;
	/** Highest integral across the declared outgoing orientations. */ maximum: number;
	/** Largest absolute deviation from the known integral one. */ maximumAbsoluteError: number;
	/** Root mean square deviation from one across orientations. */ rmsError: number;
	/** Orientation with the largest absolute error. */ worstDirection: SkyVector3;
}>;

/** Phase-weighted quadrature results for one unchanged incoming rule. */
type SkyPhaseRuleProof = Readonly<{
	/** Incoming-rule identity supplied by the caller. */ ruleId: string;
	/** Number of incoming directions. */ directionCount: number;
	/** Sum of unchanged positive solid-angle weights. */ weightSumSteradians: number;
	/** Rayleigh constant-field integration statistics. */ rayleigh: SkyPhaseOrientationSummary;
	/** Cornette-Shanks constant-field integration statistics at g=0.7. */ mie: SkyPhaseOrientationSummary;
}>;

/** Independent reference and orientation sweep of normalized physical phases. */
type SkyPhaseProof = Readonly<{
	/** Exact full-sphere integral of each selected phase function. */ exactIntegral: number;
	/** Mie asymmetry used by both references and quadrature sweeps. */ mieG: number;
	/** Fixed independently generated outgoing orientations. */ outgoingDirections: readonly SkyVector3[];
	/** Independent one-dimensional Rayleigh reference. */ rayleighReference: SkyAdaptiveIntegral;
	/** Independent one-dimensional Mie reference. */ mieReference: SkyAdaptiveIntegral;
	/** Difference after tightening the adaptive Mie reference tolerance. */ mieReferenceRefinementDifference: number;
	/** Observed errors for every supplied incoming rule; poor rules are retained. */ rules: readonly SkyPhaseRuleProof[];
}>;

/** Rayleigh algebraic moment closure measured on one incoming rule. */
type SkyRayleighRuleProof = Readonly<{
	/** Incoming-rule identity. */ ruleId: string;
	/** Largest difference between direct and moment evaluation on identical nodes. */ maximumClosureDifference: number;
	/** Largest direct-integral error against the analytic polynomial solution. */ maximumAnalyticError: number;
	/** Discrete zeroth moment of the manufactured incident radiance. */ zerothMoment: number;
	/** Discrete second moment in xx, yy, zz, xy, xz, yz order. */ secondMoment: readonly number[];
}>;

/** Exact Rayleigh moment identity and remaining incoming-quadrature error. */
type SkyRayleighMomentProof = Readonly<{
	/** Manufactured nonnegative radiance as an explicit scalar expression. */ radianceEquation: string;
	/** Analytic outgoing response as an explicit scalar expression. */ analyticResponseEquation: string;
	/** Analytic zeroth moment. */ analyticZerothMoment: number;
	/** Analytic second moment in xx, yy, zz, xy, xz, yz order. */ analyticSecondMoment: readonly number[];
	/** Independent adaptive polynomial-moment comparison error. */ referenceMaximumAbsoluteError: number;
	/** Same-node algebraic and continuum comparisons for each rule. */ rules: readonly SkyRayleighRuleProof[];
}>;

/** Deliberately adversarial Float32 accumulation with exactly representable inputs. */
type SkyPrecisionProof = Readonly<{
	/** Exact positive sum, also reproduced in binary64. */ exactSum: number;
	/** Number of identical small terms added after one. */ smallTermCount: number;
	/** Exact power-of-two small term. */ smallTerm: number;
	/** Left-to-right Float32 sum with one first. */ largeFirstFloat32: number;
	/** Left-to-right Float32 sum with one last. */ smallFirstFloat32: number;
	/** Balanced-pair Float32 sum preserving original leaf order. */ pairwiseFloat32: number;
	/** Binary64 serial reference. */ binary64: number;
	/** Worst-order absolute error. */ largeFirstAbsoluteError: number;
	/** Standard gamma_n absolute bound for positive exact inputs and rounded additions. */ forwardErrorBound: number;
	/** A small positive four-order surrogate, independent of any production field. */ orderTerms: readonly number[];
	/** Float32 cumulative sum of the four-order surrogate. */ fourOrderFloat32: number;
	/** Binary64 sum of the four-order surrogate. */ fourOrderBinary64: number;
	/** Explicit limitation of the manufactured arithmetic experiment. */ scope: string;
}>;

/** Observed nonadditivity of the production scalar solar cubic. */
type SkyCubicGroupingProof = Readonly<{
	/** Four equally spaced samples of manufactured first order. */ firstOrderSamples: readonly number[];
	/** Four equally spaced samples of manufactured higher orders. */ higherOrderSamples: readonly number[];
	/** Interpolation fraction within the middle interval. */ fraction: number;
	/** Cubic evaluated on the component-wise sum. */ cumulative: number;
	/** Sum of separate cubic evaluations. */ grouped: number;
	/** Cumulative minus grouped reconstruction. */ groupingDifference: number;
	/** Independent first-order replacement value. */ replacementFirstOrder: number;
	/** Replacement plus the frozen cumulative higher-order increment. */ frozenIncrementReplacement: number;
	/** Replacement plus the separately reconstructed higher-order field. */ coherentGroupedReplacement: number;
	/** Maximum positive-homogeneity residual across a fixed interior sweep. */ maximumHomogeneityResidual: number;
	/** Production owner actually exercised by this check. */ implementationPath: string;
}>;

/** One midpoint quadrature result for a known smooth integrand. */
type SkyMidpointLevel = Readonly<{
	/** Number of integration intervals. */ intervals: number;
	/** Weighted midpoint integral. */ integral: number;
	/** Signed approximation minus exact integral. */ error: number;
}>;

/** Observed second-order convergence and a lower-level prediction. */
type SkyMidpointLadder = Readonly<{
	/** Human-readable placement equation. */ placement: string;
	/** Results at 30, 60 and 120 intervals. */ levels: readonly SkyMidpointLevel[];
	/** Adjacent absolute-error ratios. */ errorRatios: readonly number[];
	/** Prediction of the 60-to-120 change from the 30-to-60 change divided by four. */ predictedLastDelta: number;
	/** Observed 60-to-120 change. */ observedLastDelta: number;
	/** Absolute relative error of that change prediction. */ relativePredictionError: number;
}>;

/** Known-function path integration check, with no atmospheric reference claim. */
type SkyMidpointProof = Readonly<{
	/** Smooth positive integrand and integration limits. */ integrandEquation: string;
	/** Exact analytic integral. */ exactIntegral: number;
	/** Uniform and quadratic physical-distance midpoint ladders. */ ladders: readonly SkyMidpointLadder[];
}>;

/** Direct uniform-cell quadratures of a constant source attenuated by constant extinction. */
type SkyHomogeneousTransportLevel = Readonly<{
	/** Number of equal physical-distance cells. */ intervals: number;
	/** Half-cell optical depth, kappa*Delta/2. */ x: number;
	/** Direct endpoint trapezoid sum in the proof's arbitrary consistent radiance units. */ trapezoidRadiance: number;
	/** Direct physical midpoint sum in the same radiance units. */ midpointRadiance: number;
	/** Direct trapezoid sum divided by analytic radiance. */ trapezoidRatio: number;
	/** Direct midpoint sum divided by analytic radiance. */ midpointRatio: number;
	/** Independently evaluated geometric-series ratio x*coth(x). */ exactTrapezoidRatio: number;
	/** Independently evaluated geometric-series ratio x/sinh(x). */ exactMidpointRatio: number;
	/** Signed trapezoid ratio minus one. */ trapezoidRelativeError: number;
	/** Signed midpoint ratio minus one. */ midpointRelativeError: number;
}>;

/** Adjacent homogeneous-medium quadrature errors under interval-count doubling. */
type SkyHomogeneousTransportRefinement = Readonly<{
	/** Coarse level's number of cells. */ coarseIntervals: number;
	/** Fine level's number of cells; twice the coarse count. */ fineIntervals: number;
	/** Coarse divided by fine signed trapezoid error; positive. */ trapezoidErrorRatio: number;
	/** Coarse divided by fine signed midpoint error; positive. */ midpointErrorRatio: number;
	/** Whether the coarse half-cell optical depth meets the declared quadratic threshold. */ quadraticRegime: boolean;
}>;

/** One manufactured optical depth evaluated at 20, 40 and 80 uniform cells. */
type SkyHomogeneousTransportLadder = Readonly<{
	/** Total dimensionless optical depth kappa*D. */ opticalDepth: number;
	/** Constant extinction coefficient in inverse proof-distance units. */ extinction: number;
	/** Analytic integrated radiance j*(1-exp(-kappa*D))/kappa. */ exactRadiance: number;
	/** Direct sums, signed errors and independent exact ratios at each count. */ levels: readonly SkyHomogeneousTransportLevel[];
	/** Monotonic approach and conditional quadratic-error checks. */ refinements: readonly SkyHomogeneousTransportRefinement[];
}>;

/** Analytic homogeneous-medium outer-quadrature calibration, separate from actual atmosphere attribution. */
type SkyHomogeneousTransportProof = Readonly<{
	/** Constant physical path length D in arbitrary distance units. */ pathLength: number;
	/** Constant emitted/scattered radiance per distance j in consistent proof units. */ sourceDensity: number;
	/** Exact attenuated source integral and closed-form solution. */ radianceEquation: string;
	/** Cell parameter and exact trapezoid/midpoint radiance ratio equations. */ ratioEquations: string;
	/** Largest coarse x for enforcing leading quadratic bias and approximately fourfold error reduction. */ quadraticRegimeMaximumX: number;
	/** Independent optical-depth cases with monotonic refinements. */ ladders: readonly SkyHomogeneousTransportLadder[];
	/** Explicit exclusions from the mechanism-only claim. */ scope: string;
}>;

/** Raw-density interpolation error at one uniform grid resolution. */
type SkyDensityLevel = Readonly<{
	/** Number of cells across the manufactured altitude range. */ intervals: number;
	/** Root mean square raw interpolation error on the fixed independent validation nodes. */ rmsError: number;
	/** Largest raw interpolation error on the validation nodes. */ maximumAbsoluteError: number;
	/** Mean raw approximation minus analytic density sum. */ meanSignedError: number;
	/** Largest factorized reconstruction error with constant lighting coefficients. */ factorizedMaximumAbsoluteError: number;
}>;

/** Manufactured density factorization result and explicit applicability limit. */
type SkyDensityFactorizationProof = Readonly<{
	/** Analytic mixed-density source used as ground truth. */ sourceEquation: string;
	/** Upper altitude in metres; lower bound is zero. */ upperAltitudeMeters: number;
	/** Number of independent midpoint validation samples. */ validationCount: number;
	/** Uniform raw-cache refinement ladder. */ levels: readonly SkyDensityLevel[];
	/** Exactness condition and remaining real-atmosphere error. */ scope: string;
}>;

/** Compact self-verifying mechanism calibration, suitable for an immutable proof run. */
type SkyMechanismProofResult = Readonly<{
	/** Schema identity. */ schemaId: string;
	/** Explicit distinction between manufactured proofs and measured-sky qualification. */ scope: string;
	/** Primary mathematical implementation references, not measurement data. */ references: readonly string[];
	/** Independent phase integrals and orientation sweeps. */ incomingPhase: SkyPhaseProof;
	/** Exact moment closure and numerical moment error. */ rayleighMoments: SkyRayleighMomentProof;
	/** Float32 accumulation stress result. */ precision: SkyPrecisionProof;
	/** Nonlinear grouping result. */ cubicGrouping: SkyCubicGroupingProof;
	/** Midpoint prediction and convergence result. */ midpoint: SkyMidpointProof;
	/** Opposite outer-quadrature biases and conditional quadratic convergence in a homogeneous medium. */ homogeneousTransport: SkyHomogeneousTransportProof;
	/** Density reconstruction result under explicitly constant lighting. */ densityFactorization: SkyDensityFactorizationProof;
	/** Exact invariant checks required to return a result. */ passedInvariants: readonly string[];
}>;

/** Phase of the synchronous, disk-free first-order density diagnostic.
 * - **"prepare"** - Validate inputs and construct the requested view support.
 * - **"coefficients"** - Construct one channel's separate physical species fields.
 * - **"integrate"** - Integrate that channel's four first-order representations.
 * - **"complete"** - All channels have produced finite nonnegative radiances.
 */
type SkyDensityEvaluationPhase = 'prepare' | 'coefficients' | 'integrate' | 'complete';

/** Monitorable progress from a density diagnostic; the caller owns any persistence. */
type SkyDensityEvaluationProgress = Readonly<{
	/** Current numerical phase. */ phase: SkyDensityEvaluationPhase;
	/** Number of completely integrated channels. */ completed: number;
	/** Number of channels requested. */ total: number;
	/** Current Direct40 channel when a channel is active. */ channel?: number;
	/** Human-readable work description. */ message: string;
}>;

/** Callback that synchronously receives progress and may throw to cancel evaluation. */
type SkyDensityEvaluationProgressHandler = (progress: SkyDensityEvaluationProgress) => void;

/** Physical source facts reused by all outgoing coordinates at one altitude/solar knot. */
type SkyDensityLightingKnot = Readonly<{
	/** Tangent, across and up axes in the world whose source points along positive Z. */
	frame: readonly SkyVector3[];
	/** Extinction, Rayleigh scattering and Mie scattering at the knot, each in inverse metres. */
	coefficients: SkyVector3;
	/** Collimated beam irradiance times source transmittance, in W m^-2 nm^-1. */
	illumination: number;
}>;

/** Separate first-order species quantities sampled on the same sparse support. */
type SkyDensitySpeciesFields = Readonly<{
	/** Float32 E*T_source*p_R, excluding physical density, in W m^-2 sr^-1 nm^-1. */
	rayleighLighting: Float32Array;
	/** Float32 E*T_source*p_M, excluding physical density, in W m^-2 sr^-1 nm^-1. */
	mieLighting: Float32Array;
	/** Float32 beta_R*E*T_source*p_R at each construction knot, in W m^-3 sr^-1 nm^-1. */
	rayleighDensity: Float32Array;
	/** Float32 beta_M*E*T_source*p_M at each construction knot, in W m^-3 sr^-1 nm^-1. */
	mieDensity: Float32Array;
}>;

/** Flattening dimensions shared by every retained first-order density boundary. */
type SkyDensityEvaluationShape = Readonly<{
	/** Number of scenes in supplied scene order. */ sceneCount: number;
	/** Width and height of the registered square measurement grid; always nine. */ gridWidth: number;
	/** Number of spectral channels, in supplied channel order. */ channelCount: number;
}>;

/** Four compact first-order radiance boundaries using identical requested path quadrature. */
type SkyDensityFactorizationEvaluation = Readonly<{
	/** Result schema identity. */ schemaId: string;
	/** Fixed physical and numerical build request identity. */ buildRequestId: string;
	/** Supplied registered scenes in exact output order. */ scenes: readonly SkyScene[];
	/** Direct40 channel indexes in exact output order. */ channels: readonly number[];
	/** Complete accepted controls, including the explicitly selected view rule. */ controls: SkyControls;
	/** Dimensions of each separate radiance array. */ shape: SkyDensityEvaluationShape;
	/** Explicit scalar-index equation; no Y-major analysis-boundary transposition is implicit. */ layout: string;
	/** Physical units of all four output arrays. */ units: string;
	/** Numerical comparison and recurrence limitations. */ referenceScope: string;
	/** Equations defining the physically separate species fields. */ speciesEquations: string;
	/** Changes isolated by the split-species control, including storage quantization. */ splitControlScope: string;
	/** Float32 combined analytic J1 probes reconstructed by the original scalar operator. */ rawJ1: Float64Array;
	/** Separate Float32 Rayleigh/Mie J1 probes reconstructed separately and summed at query points. */ splitSpeciesJ1: Float64Array;
	/** Reconstructed species lighting multiplied by physical species density at each query midpoint. */ factoredJ1: Float64Array;
	/** Direct physical J1 evaluated at the same midpoints with the same source/path quadrature. */ continuousJ1: Float64Array;
}>;

/** Construction factor admitted by the first-order representation relationship.
 * - **"sourceIntervals"** - Refine direct source-path attenuation integration.
 * - **"transportIntervals"** - Refine later-order recurrence path integration.
 */
type DialRepresentationConstructionFactor = 'sourceIntervals' | 'transportIntervals';

/** Compact signed spectral statistics, with the empirical floor used only to classify signs. */
type DialRepresentationSpectralStatistics = Readonly<{
	/** Number of aligned spectral scalars. */ sampleCount: number;
	/** Euclidean norm in W m^-2 sr^-1 nm^-1. */ normW: number;
	/** Root mean square in mW m^-2 sr^-1 nm^-1. */ rmsMilliwatt: number;
	/** Signed arithmetic mean in mW m^-2 sr^-1 nm^-1. */ meanMilliwatt: number;
	/** Maximum absolute scalar in mW m^-2 sr^-1 nm^-1. */ maximumAbsoluteMilliwatt: number;
	/** Number of scalars strictly above the positive sign floor. */ positiveAboveFloor: number;
	/** Number of scalars strictly below the negative sign floor. */ negativeBelowFloor: number;
	/** Number with absolute value at most the floor. */ withinFloor: number;
}>;

/** Exact coordinate of the largest absolute representation interaction. */
type DialRepresentationInteractionPoint = Readonly<{
	/** Registered local capture time. */ time: string;
	/** Registered horizontal grid index, zero through eight. */ gridX: number;
	/** Registered vertical grid index, zero through eight. */ gridY: number;
	/** Direct40 channel index. */ channel: number;
	/** Authenticated channel center wavelength in nanometres. */ wavelengthNanometers: number;
	/** Physical view elevation from the local horizon, in degrees. */ elevationDegrees: number;
	/** View/source angular separation in degrees. */ sunSeparationDegrees: number;
	/** Signed interaction at this point in mW m^-2 sr^-1 nm^-1. */ interactionMilliwatt: number;
}>;

/** One condition's interaction energy restricted to an independently defined angular subset. */
type DialRepresentationConditionStratum = Readonly<{
	/** Registered time and geometric category identity. */ id: string;
	/** Number of included all-channel spectral scalars. */ sampleCount: number;
	/** Sum of squared interaction in squared spectral W units. */ squaredNormW: number;
	/** Fraction of the complete condition's interaction energy; null when it is exactly zero. */ fractionOfConditionEnergy:
		number | null;
}>;

/** Full spectral interaction and angular energy breakdown for one capture condition. */
type DialRepresentationConditionGeometry = Readonly<{
	/** Registered local capture time. */ time: string;
	/** Signed interaction statistics over all 81 directions and 40 channels. */ statistics: DialRepresentationSpectralStatistics;
	/** Fixed geometric categories, including overlapping elevation and Sun-angle axes. */ strata: readonly DialRepresentationConditionStratum[];
}>;

/** Angular-category interaction energy pooled over the full time boundary. */
type DialRepresentationPooledStratum = Readonly<{
	/** Geometry category identity without a capture time. */ id: string;
	/** Number of included all-channel spectral scalars. */ sampleCount: number;
	/** Sum of squared interaction in squared spectral W units. */ squaredNormW: number;
	/** Fraction of total spectral interaction energy; null when it is exactly zero. */ fractionOfTotalEnergy:
		number | null;
}>;

/** Compact geometric localization of a full-boundary representation factorial. */
type DialRepresentationInteractionGeometry = Readonly<{
	/** Explanation that elevation categories overlap Sun-angle categories. */ overlap: string;
	/** Numerical spectral scope and limitation for roundoff-only interactions. */ energyScope: string;
	/** One complete geometry summary per registered capture time. */ times: readonly DialRepresentationConditionGeometry[];
	/** Angular energy fractions pooled across all capture times. */ pooled: readonly DialRepresentationPooledStratum[];
	/** Largest absolute spectral interaction with exact authenticated geometry. */ maximumPoint: DialRepresentationInteractionPoint;
}>;
