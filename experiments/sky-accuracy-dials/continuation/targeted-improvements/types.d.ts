/** Packed numeric section names.
 * - **planet**: shared radii and density heights.
 * - **spectra**: four channel tuples.
 * - **anchors**: unique source geometry.
 * - **samples**: fixed reconstruction metadata and taps.
 * - **rays**: sample ranges and physical phases.
 */
type SkyTargetedGeometrySection = 'planet' | 'spectra' | 'anchors' | 'samples' | 'rays';
/** Packed geometry and physical inputs for one fixed GPU matrix. */
type SkyTargetedPayload = Readonly<{
	/** Bottom radius, top height and the two density scale heights, metres. */ planet: readonly number[];
	/** Rayleigh extinction, Mie extinction, irradiance and Mie scattering albedo per channel. */ spectra: readonly number[];
	/** Channel identities matching the spectral texture. */ channels: readonly number[];
	/** Height and solar cosine, padded to RGBA, for each shared source anchor. */ anchors: readonly number[];
	/** Ten RGBA texels per sample: metadata and eight reconstruction taps. */ samples: readonly number[];
	/** Sample offset, count, and analytic Rayleigh/Mie phases for each ray/level. */ rays: readonly number[];
	/** Probe index and subdivision level matching each GPU output row. */ rowLayout: readonly SkyTargetedRayLayout[];
	/** Authenticated full-view comparison and measurement rows. */ references: readonly SkyJ1AssessmentRow[];
}>;
/** One row in the GPU output texture. */
type SkyTargetedRayLayout = Readonly<{
	/** Position in the frozen 40-probe array. */ probeIndex: number;
	/** Original probe identity. */ probeId: string;
	/** Midpoint subdivisions per altitude interval. */ subdivisions: number;
	/** Actual total sample count. */ sampleCount: number;
}>;
/** GPU shader sources passed as immutable inputs. */
type SkyTargetedShaders = Readonly<{
	/** Full-screen vertex shader. */ vertex: string;
	/** Finite source-column precomputation shader. */ columns: string;
	/** Complete viewing-ray shader with loop-free sample helpers. */ rays: string;
}>;
/** Browser result containing only compact outputs, timing and platform facts. */
type SkyTargetedGpuResult = Readonly<{
	/** RGBA row-major output; red is first-order spectral radiance. */ values: readonly number[];
	/** Source-column RGBA values at S80 then S160. */ columns: readonly number[];
	/** Renderer name used to reject software execution. */ renderer: string;
	/** WebGL version. */ version: string;
	/** GPU source pass elapsed wall time including synchronization. */ columnMilliseconds: number;
	/** GPU ray pass elapsed wall time including synchronization. */ rayMilliseconds: number;
	/** Texture width of the compact ray result. */ width: number;
	/** Texture height of the compact ray result. */ height: number;
	/** Explicit context release status. */ contextReleased: boolean;
}>;
/** One scalar candidate result and its existing reference decomposition. */
type SkyTargetedScalar = Readonly<{
	/** Probe identity. */ probeId: string;
	/** Measurement time. */ time: string;
	/** Spectral channel. */ channel: number;
	/** Closed matrix index, 0..12. */ mode: number;
	/** Source intervals, 80 or 160. */ sourceCount: number;
	/** GPU level-eight radiance. */ first8W: number;
	/** GPU level-sixteen radiance. */ first16W: number;
	/** Retained physical first-order reference. */ physicalW: number;
	/** Frozen original higher-order light. */ higherW: number;
	/** Measured spectral radiance. */ measuredW: number;
	/** Diagnostic numerical-direction guard, not a certified bound. */ guardW: number;
	/** First-order numerical discrepancy. */ numericalW: number;
	/** Remaining higher-order/model/observation discrepancy. */ remainingW: number;
	/** Full substituted residual against measurement. */ residualW: number;
	/** Earlier-view residual for direction stability checks. */ residual8W: number;
}>;
/** Small named aggregate with the cancellation accounting retained. */
type SkyTargetedGroup = Readonly<{
	/** Aggregate or time selector. */ group: string;
	/** Matrix mode. */ mode: number;
	/** Source integration count. */ sourceCount: number;
	/** Scalar count. */ count: number;
	/** Selected-probe Kider proxy RMSE in spectral mW. */ rmse: number;
	/** First-order numerical RMS in spectral mW. */ numericalRms: number;
	/** Numerical-error sum of squares in spectral W squared. */ numericalSse: number;
	/** Remaining-discrepancy sum of squares. */ remainingSse: number;
	/** Signed 2*n*r cross term. */ crossTerm: number;
	/** L2 diagnostic guard in spectral W. */ guardNorm: number;
}>;
/** Original GPU-field parity witness. */
type SkyTargetedParity = Readonly<{
	/** Frozen ray identity. */ probeId: string;
	/** Spectral channel. */ channel: number;
	/** New raw minus retained raw radiance. */ differenceW: number;
	/** Combined diagnostic allowance. */ guardW: number;
	/** Whether the witness falls within that allowance. */ withinGuard: boolean;
}>;
/** Signed factorial vectors and their cancellation products. */
type SkyTargetedFactorial = Readonly<{
	/** Finite source interval count. */ sourceCount: number;
	/** Complete individual inclusion-exclusion vectors. */ vectors: readonly SkyTargetedFactorVector[];
	/** Aggregate term summaries in mask order. */ terms: readonly SkyTargetedFactorTerm[];
	/** Pairwise inner products, including the intercept. */ dotProducts: readonly (readonly number[])[];
}>;
/** One factor vector at a retained comparison scalar. */
type SkyTargetedFactorVector = Readonly<{
	/** Probe identity. */ probeId: string;
	/** Measurement time. */ time: string;
	/** Spectral channel. */ channel: number;
	/** Intercept and seven effect values in spectral W. */ terms: readonly number[];
}>;
/** Small factorial summary. */
type SkyTargetedFactorTerm = Readonly<{
	/** Bit-mask effect identity. */ term: number;
	/** Signed mean effect in spectral W. */ signedMeanW: number;
	/** Effect RMS in spectral W. */ rmsW: number;
}>;
/** Directional comparison with the original raw S80 control. */
type SkyTargetedComparison = Readonly<{
	/** Aggregate or time selector. */ group: string;
	/** Source intervals. */ sourceCount: number;
	/** Matrix mode. */ mode: number;
	/** Positive is a proxy RMSE improvement. */ proxyGainMw: number;
	/** Positive is a first-order numerical RMS improvement. */ numericalGainMw: number;
	/** Diagnostic guard on numerical RMS direction. */ numericalGuardRmsMw: number;
	/** Whether both view levels give the same score direction. */ viewDirectionAgrees: boolean;
	/** Frozen 0.01 spectral mW useful-gain threshold. */ usefulProxyGain: boolean;
	/** Numerical reduction larger than the diagnostic guard. */ numericalReductionResolved: boolean;
	/** Change in known first-order error squares. */ deltaNumericalSse: number;
	/** Change in signed cancellation with the fixed remaining discrepancy. */ deltaCrossTerm: number;
}>;
/** Complete scored matrix, preserving every scalar and signed interaction. */
type SkyTargetedAssessment = Readonly<{
	/** Decoded candidate rows. */ rows: readonly SkyTargetedScalar[];
	/** Aggregate and time-stratified scores. */ groups: readonly SkyTargetedGroup[];
	/** Raw-control witnesses against retained GPU evidence. */ parity: readonly SkyTargetedParity[];
	/** Three-factor signed decomposition at both source counts. */ factorials: readonly SkyTargetedFactorial[];
	/** Direction and cancellation screens. */ comparisons: readonly SkyTargetedComparison[];
}>;
/** Authenticated inputs consumed before GPU execution. */
type SkyTargetedInputs = Readonly<{
	/** Unchanged original GPU build request. */ request: SkyBuildRequest;
	/** Matched physical reference and measurement rows. */ references: readonly SkyJ1AssessmentRow[];
	/** Seals and exact artifact identities for every source. */ parents: readonly DialFileIdentity[];
	/** Retained S80 column witnesses and geometry. */ columnPrediction: SkyTargetedColumnPrediction;
	/** Retained S160 matching column witnesses. */ columnTarget: SkyTargetedColumnTarget;
}>;
/** Minimal consumed S80 source-column record. */
type SkyTargetedColumnPrediction = Readonly<{
	/** Frozen column coordinates and values. */ rows: readonly SkyTargetedColumnPrior[];
}>;
/** Minimal source coordinate and S80 integration. */
type SkyTargetedColumnPrior = Readonly<{
	/** Original source geometry. */ coordinate: SkyTargetedColumnCoordinate;
	/** Original finite source columns. */ baseline: SkyTargetedFiniteColumn;
}>;
/** Authenticated source geometry. */
type SkyTargetedColumnCoordinate = Readonly<{
	/** Frozen identity. */ id: string;
	/** Height in metres. */ altitudeMeters: number;
	/** Solar cosine. */ solarCosine: number;
}>;
/** Minimal S160 target record. */
type SkyTargetedColumnTarget = Readonly<{
	/** Frozen target values. */ rows: readonly SkyTargetedColumnTargetRow[];
}>;
/** One S160 result linked to its original source coordinate. */
type SkyTargetedColumnTargetRow = Readonly<{
	/** Frozen coordinate identity. */ coordinateId: string;
	/** Finite columns. */ finite: SkyTargetedFiniteColumn;
}>;
/** Geometric species columns in metres. */
type SkyTargetedFiniteColumn = Readonly<{
	/** Rayleigh density integral. */ rayleighMeters: number;
	/** Mie density integral. */ mieMeters: number;
}>;
/** New GPU versus old finite-integration witness. */
type SkyTargetedColumnWitness = Readonly<{
	/** Retained matching geometry identity. */ coordinateId: string;
	/** Source intervals. */ sourceCount: number;
	/** GPU minus retained Rayleigh column. */ differenceRayleighMeters: number;
	/** GPU minus retained Mie column. */ differenceMieMeters: number;
	/** Both differences within fixed Float32 directional guard. */ withinGuard: boolean;
}>;
/** Minimal consumed independent-reference boundary. */
type SkyTargetedReferenceRecord = Readonly<{
	/** Independently integrated reference scalars. */ rows: readonly SkyTargetedReferenceRow[];
}>;
/** Minimal independent-reference row used to cross-check the assessment artifact. */
type SkyTargetedReferenceRow = Readonly<{
	/** Probe identity. */ probeId: string;
	/** Channel identity. */ channel: number;
	/** Admitted physical reference. */ resolved: boolean;
	/** Gauss-method spectral radiance. */ gaussWatts: number;
	/** Simpson-method spectral radiance. */ simpsonWatts: number;
}>;
