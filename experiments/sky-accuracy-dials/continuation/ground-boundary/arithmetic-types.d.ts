/** Closed outward binary64 interval. */
type SkyGroundArithmeticInterval = readonly [lower: number, upper: number];
/** Advertised actual fragment numeric-format representation. */
type SkyGroundArithmeticFormat = Readonly<{
	/** Negative exponent range. */ rangeMin: number;
	/** Positive exponent range. */ rangeMax: number;
	/** Fraction bits reported by the implementation. */ precision: number;
}>;
/** Same-context prerequisite for exact normal-binary32 texture conversion. */
type SkyGroundArithmeticPrecision = Readonly<{
	/** Explicit metadata schema. */ schemaId: string;
	/** Actual precision of the original unqualified sampler's return type. */ low: SkyGroundArithmeticFormat;
	/** Actual subsequent arithmetic storage. */ high: SkyGroundArithmeticFormat;
}>;
/** Selected exact-ground support, fixed before target results exist. */
type SkyGroundArithmeticNode = Readonly<{
	/** Outgoing field column. */ x: number;
	/** Exact-ground solar row. */ y: number;
	/** Original packed local outgoing vector. */ outgoingDirectionFloat32: SkyVector3;
}>;
/** Enclosed actual anchored source arithmetic. */
type SkyGroundArithmeticSource = Readonly<{
	/** Direct Lambertian spectral radiance. */ b0: SkyGroundArithmeticInterval;
	/** Actual ground Rayleigh coefficient. */ betaR: SkyGroundArithmeticInterval;
	/** Actual ground Mie scattering coefficient. */ betaM: SkyGroundArithmeticInterval;
	/** Actual S80 source transmittance. */ transmission: SkyGroundArithmeticInterval;
	/** Actual normalized representative-point solar cosine. */ incidence: SkyGroundArithmeticInterval;
	/** Actual S80 optical depth. */ opticalDepth: SkyGroundArithmeticInterval;
}>;
/** Packed-vector phase values and independent highp enclosures. */
type SkyGroundArithmeticPhase = Readonly<{
	/** Every actual GPU-enclosed Mie pow base must lie in the frozen admitted domain. */ powBase: SkyGroundArithmeticInterval;
	/** Published operation-bound Rayleigh enclosure. */ rayleigh: SkyGroundArithmeticInterval;
	/** Published pow/composition-bound Mie enclosure. */ mie: SkyGroundArithmeticInterval;
	/** Descriptive binary64 packed-vector Rayleigh value. */ idealRayleigh: number;
	/** Descriptive binary64 packed-vector Mie value. */ idealMie: number;
}>;
/** Frozen per-node coefficients, without any corrected or shadow field value. */
type SkyGroundArithmeticPlanRow = SkyGroundArithmeticNode &
	Readonly<{
		/** Original solar index. */ solarZenithIndex: number;
		/** Positive-side direct source enclosure. */ source: SkyGroundArithmeticSource;
		/** Exact sum of GPU-enclosed new lower-hemisphere terms before product/accumulation rounding. */ addedUnaccumulated: SkyGroundArithmeticInterval;
		/** Maximum ratio of allowed old/new scattering factors, over all512 directions. */ maxScatteringRatio: number;
		/** Maximum old/new positive upper term ratio including sampler L1/weight and all phase/coefficient variation. */ maxUpperTermRatio: number;
		/** Smallest admitted actual pow base over512 terms. */ minimumPowBase: number;
		/** Largest admitted actual pow base over512 terms. */ maximumPowBase: number;
		/** Frozen multiplier of the nonnegative original shadow in the comparison allowance. */ oldShadowMultiplier: number;
		/** Descriptive packed sum using the B0 interval midpoint, not a claimed exact B0. */ idealPacked: number;
		/** Analytic half-space Rayleigh addition using the same B0 midpoint. */ analyticRayleigh: number;
		/** Separate actual-packed Rayleigh deviation from the analytic half. */ packedRayleighDeviation: number;
		/** Actual512 packed direction/weight Rayleigh half-space sum. */ packedRayleighHalfspace: number;
		/** Actual512 packed direction/weight Mie half-space sum. */ packedMieHalfspace: number;
	}>;
/** Exact preregistered precision assumptions and operation limits. */
type SkyGroundArithmeticPolicy = Readonly<{
	/** Versioned policy identity. */ schemaId: string;
	/** Official established error-bound source. */ specification: string;
	/** Relevant precision/conversion sections. */ sections: readonly string[];
	/** Actual reported lowp-return precision is propagated conservatively; no bit-exact fetch inference is required. */ samplerRelative: number;
	/** One-ULP relative basic operation bound. */ basicRelative: number;
	/** Division bound including rounding-mode margin. */ divisionUlps: number;
	/** Inverse-root bound including rounding-mode margin. */ inverseSquareRootUlps: number;
	/** Constant in exp/exp2 ULP bound. */ expUlpsConstant: number;
	/** Absolute-argument coefficient in exp/exp2 ULP bound. */ expUlpsSlope: number;
	/** Fixed admitted positive Mie pow domain. */ miePowInputRange: readonly number[];
	/** Exact Mie exponent. */ miePowExponent: number;
	/** Original positive angular inventory. */ incomingCount: number;
	/** Required actual sampler-return storage precision. */ requiredLowFloatPrecision: number;
	/** Required actual arithmetic storage precision. */ requiredHighFloatPrecision: number;
	/** Normal binary32 lower exponent requirement. */ requiredRangeMin: number;
	/** Binary32 upper exponent requirement. */ requiredRangeMax: number;
	/** Explicit nongeneric coverage. */ primitiveScope: string;
}>;
/** Prospective local enclosure, independent of target residuals. */
type SkyGroundArithmeticPlan = Readonly<{
	/** Versioned plan schema. */ schemaId: string;
	/** Published primitive and exact conversion contract. */ policy: SkyGroundArithmeticPolicy;
	/** Derived bounded-domain pow relative error. */ powRelative: number;
	/** Gamma514 with epsilon2^-23. */ gamma: number;
	/** Separate conservative subnormal/rounding absolute allowance. */ flushAllowance: number;
	/** Complete selected coordinates. */ rows: readonly SkyGroundArithmeticPlanRow[];
	/** Runtime format requirement, never assumed silently. */ prerequisite: string;
	/** Exact structural and scientific scope. */ scope: string;
}>;
/** Actual corrected-minus-shadow ground value inside a frozen comparison envelope. */
type SkyGroundArithmeticAssessmentRow = Readonly<{
	/** Ground column. */ x: number;
	/** Ground solar row. */ y: number;
	/** Descriptive pre-target interval-midpoint packed sum. */ expected: number;
	/** Actual subtraction of two Float32 outputs. */ actualDifference: number;
	/** Conservative lower difference bound. */ lower: number;
	/** Conservative upper difference bound. */ upper: number;
	/** Propagated source, coefficient and phase enclosure around the descriptive estimate. */ sourceAndPhaseAllowance: number;
	/** Original nonnegative shadow times the frozen old/new comparison multiplier. */ originalShadowComparisonAllowance: number;
	/** Remaining products, accumulation and underflow allowance. */ accumulationAllowance: number;
	/** Separate angular packing discrepancy of Rayleigh's analytic halfspace. */ packedRayleighDeviation: number;
	/** Literal interval inclusion result. */ state: string;
}>;
/** Local arithmetic admission only, separate from physical-reference adequacy. */
type SkyGroundArithmeticAssessment = Readonly<{
	/** Versioned assessment schema. */ schemaId: string;
	/** All observed selected ground values. */ rows: readonly SkyGroundArithmeticAssessmentRow[];
	/** Complete local inclusion result. */ state: string;
	/** Explicit boundary of the claim. */ scope: string;
}>;
/** Local in-memory arithmetic proof, with no shader or GPU execution. */
type SkyGroundArithmeticProof = Readonly<{
	/** Stable proof identity. */ schemaId: string;
	/** Actual assertion count. */ checks: number;
	/** No GPU computations or evidence allocation. */ gpuExecuted: false;
}>;
