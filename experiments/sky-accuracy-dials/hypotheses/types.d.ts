/** Authenticated H9 comparison packet; spherical and Flat groups remain separate. */
type HypothesisJoinedPacket = {
	/** Matched H-profile scalar decompositions. */ joined: SmallRayJoinedRow[];
	/** Independently identified Native48 scalar decompositions. */ alternate: SmallRayAlternateRow[];
};
/** Frozen numerical stage and resource authority, unrelated to closed packages. */
type HypothesisAdmission = {
	/** Distinguishes this package from earlier allocations. */ schemaId: 'sky-h10-h14-admission-v1';
	/** Exact governing plan. */ plan: DialFileIdentity;
	/** Completed/failed historical run count at admission; not a retry allowance. */ priorRunCount: number;
	/** Historical GPU-producing run count, conservatively identified by recipe. */ priorGpuRunCount: number;
	/** New GPU attempts permitted, serially. */ maximumGpuAttempts: number;
	/** Maximum aggregate execution milliseconds. */ maximumMilliseconds: number;
	/** Stage-specific wall-clock caps, including cleanup. */ stageMilliseconds: Record<string, number>;
	/** Maximum retained new evidence bytes. */ maximumBytes: number;
	/** Physical/witness and prospective prediction registration. */ registration: unknown;
};
/** Sparse spherical numerical job; no full sky output or cache retention. */
type HypothesisSphericalInput = {
	/** Authenticated complete compiler request. */ request: SkyBuildRequest;
	/** Original component probes. */ probes: SkyReferenceProbe[];
	/** Requested point-spectrum indices. */ channels: number[];
	/** Pure recurrence orders, four or six. */ maximumOrder: 4 | 6;
	/** Deadline including reserved parent cleanup. */ deadline: number;
	/** Original final view uses quadratic 30 for Native48, independent reference for H. */ kind: HypothesisProfileKind;
};
/** Sparse per-ray spherical evaluation, in radiance-density watts. */
type HypothesisSphericalRow = {
	/** Original witness identity. */ probeId: string;
	/** Direct40 index. */ channel: number;
	/** Actual cumulative order. */ order: number;
	/** Original raw reconstruction under the selected final view. */ rawW: number;
	/** Same fields under independent final-view quadrature. */ refinedW: number;
	/** Empirical quadrature allowance. */ refinedAllowanceW: number;
	/** Whether independent quadratures qualified. */ refinedResolved: boolean;
	/** Refined raw pure-order radiances, not a nonlinear additive error allocation. */ pureW: number[];
};
/** Result from the bounded browser capability. */
type HypothesisSphericalResult = {
	/** Optional compact queried fields preserved before reader evaluation. */ sparse?: HypothesisSparseCapture;
	/** Actual device facts. */ renderer: string;
	/** Compact scalar outputs. */ rows: HypothesisSphericalRow[];
	/** Compiler allocation and timing evidence; no textures retained. */ reports: SkyGpuCompilerReport[];
};
/** Sparse GPU inputs retained for reproducible reader repair; never full textures. */
type HypothesisSparseCapture = {
	/** Original spectral channel. */ channel: number;
	/** Exact sparse scalar query order. */ coordinates: SkyFieldCoordinate[];
	/** Base64-encoded pure Float32 fields in order. */ encoded: string[];
	/** Exact binary scalar convention. */ scalarFormat: 'float32-le-v1';
};
/** A source-backed reference setup comparison. */
type HypothesisAuditEntry = {
	/** Compared quantity. */ field: string;
	/** Match, difference or unresolved provenance. */ status: HypothesisAuditStatus;
	/** Exact interpretation and remaining limit. */ detail: string;
	/** Local pinned source identities supporting this entry. */ sources: DialFileIdentity[];
};
/** Spherical stage selection.
 * - **"H11"** - H-profile reconstruction/order comparison.
 * - **"H12"** - Native48 low-ray attribution.
 */
type HypothesisSphericalStage = 'H11' | 'H12';
/** Separate spherical numerical baselines.
 * - **"H"** - Retained 00103 H component profile.
 * - **"Native48"** - Retained 00000 original profile and Q30 final view.
 */
type HypothesisProfileKind = 'H' | 'Native48';
/** Reference setup comparison classification.
 * - **"match"** - Inspected source definitions agree within the stated field.
 * - **"difference"** - An explicit representation or setting differs.
 * - **"unknown"** - Required execution provenance or effective setting is missing.
 */
type HypothesisAuditStatus = 'match' | 'difference' | 'unknown';
/** Resolved squared-error change against one shared uncertain reference.
 * - **"improves"** - Entire registered change interval is negative.
 * - **"worsens"** - Entire registered change interval is positive.
 * - **"unresolved"** - Change interval contains zero.
 */
type HypothesisErrorDirection = 'improves' | 'worsens' | 'unresolved';
/** Shared-reference before/after error comparison. */
type HypothesisErrorComparison = {
	/** Candidate minus control radiance, W. */ deltaW: number;
	/** Change in squared error, W squared. */ deltaSSE: number;
	/** Lower/upper change after shared-reference and numerical uncertainty. */ interval: number[];
	/** Whether sign is resolved. */ direction: HypothesisErrorDirection;
};
/** One exact angular phase contrast, not a radiance contrast. */
type HypothesisPhaseRow = {
	/** Retained ray identity. */ ray: string;
	/** Scattering cosine in the source-aligned frame. */ cosine: number;
	/** Full-sphere normalized analytic phase density. */ continuousPerSr: number;
	/** Normalized 20-moment adapter representation. */ adapter20PerSr: number;
	/** Represented divided by continuous phase. */ ratio: number;
};
/** Complete pinned-source phase audit. */
type HypothesisAuditResult = {
	/** Match/difference/unknown source evidence. */ ledger: HypothesisAuditEntry[];
	/** Forward-only coefficients divided by their zeroth coefficient. */ moments: number[];
	/** Independent full-sphere analytic moments. */ fullSphereMoments: number[];
	/** Full-sphere analytic normalization check. */ normalization: number;
	/** Full-sphere law's forward-hemisphere probability. */ forwardMass: number;
	/** Exact witness phase contrasts. */ phaseRows: HypothesisPhaseRow[];
	/** Frozen qualitative prediction and scope. */ prediction: unknown;
};
/** Audit artifact's retained arithmetic accounting extension. */
type HypothesisAuditRead = HypothesisAuditResult & {
	/** Recomputed prior order differences; not fresh numerical evidence. */ accounting: unknown[];
};
/** Required portion of the original control snapshot. */
type HypothesisNativeSnapshot = {
	/** Entire Native48 compiler input. */ native48: SkyBuildRequest;
	/** Original fitted solar/view geometry. */ scenes: SkyScene[];
};
/** Required portion of retained matched-order diagnostics. */
type HypothesisOrderDiagnosticsRead = {
	/** Original order/view envelopes. */ rows: SkyMatchedOrderRow[];
};
/** Raw replay observation and its prospectively selected screen. */
type HypothesisReplayRow = {
	/** Registered witness identity. */ probeId: string;
	/** Direct40 index. */ channel: number;
	/** Cumulative actual order. */ order: number;
	/** Authenticated retained radiance. */ targetW: number;
	/** New raw radiance. */ actualW: number;
	/** New minus retained radiance. */ differenceW: number;
	/** Unchanged engineering screen, not a certified bound. */ allowanceW: number;
	/** Whether the replay screen passes. */ passed: boolean;
};
/** Browser-owned loopback callbacks and pure numerical capability. */
interface HypothesisBrowserCapability extends SkySixCommonModule {
	/** Run only the frozen sparse spherical matrix. */
	runSpherical(
		input: HypothesisSphericalInput,
		progress: (message: string) => Promise<void>,
		retain: (value: HypothesisSphericalResult) => Promise<void>,
		compiler: SkySixCommonModule,
	): Promise<void>;
}
/** Isolated page globals created by bundling and Puppeteer callbacks. */
type HypothesisBrowserScope = {
	/** Bundled local numerical entry. */ HypothesisBrowser: HypothesisBrowserCapability;
	/** Owning run's deadline/progress callback. */ hypothesisProgress: (message: string) => Promise<void>;
	/** Owning run's compact output callback. */ hypothesisRetain: (value: HypothesisSphericalResult) => Promise<void>;
};
/** Original raw driver contract with an explicit terminal order. */
type HypothesisRawCompileRequest = SkySixCompileRequest & {
	/** Earlier fields retain exactly the same prefix. */ maximumOrder: 4 | 6;
};
/** Required observation shape from the accepted paired capture. */
type HypothesisFlatObservation = {
	/** Original application facts. */ facts: {
		/** Selected location/time state. */ state: {
			/** Exact instant and geodetic location. */ observation: GeometryObservation;
		};
	};
};
/** Physical geometry and extinction facts at one flat point. */
type HypothesisFlatFacts = {
	/** Finite source distance, m. */ distance: number;
	/** Source zenith cosine. */ mu: number;
	/** Rayleigh/Mie relative densities. */ rho: number[];
	/** Rayleigh/Mie source density columns, m. */ columns: number[];
	/** Rayleigh/Mie phase densities, sr inverse. */ phases: number[];
};
/** Independent Float32 control and species payload at one allocated node/direction. */
type HypothesisFlatNode = {
	/** Production CPU J1 rounded to field storage precision. */ combined: Float32Array;
	/** Independently authored Rayleigh/Mie payloads. */ species: Float32Array[];
};
/** Raw and corrected species readings at a query or integrated ray. */
type HypothesisFlatSample = {
	/** Current combined-J control in Native15 channel order. */ raw: number[];
	/** Independent raw Rayleigh/Mie payload reconstruction. */ split: number[][];
	/** New normalized-column N1 reconstruction by species. */ corrected: number[][];
};
/** Actual sparse-cache usage and numerical parity limits. */
type HypothesisFlatCacheReport = {
	/** Geometry-owned topology identity. */ topologyIdentity: string;
	/** Complete profile identity. */ profileIdentity: string;
	/** Total possible allocated positions. */ positionCount: number;
	/** Spatial positions actually cached. */ visitedPhysicalNodes: number;
	/** Position/direction combinations actually cached. */ visitedDirectionalNodes: number;
	/** Query count. */ samples: number;
	/** Maximum independent node/species sum relative difference. */ nodeParityRelative: number;
	/** Maximum Float32 reconstructed species sum relative difference. */ splitParityRelative: number;
	/** Maximum unrounded column-invariant residual, m. */ constantResidualMaximum: number;
	/** Retained-in-memory scalar control payload bytes. */ rawPayloadBytes: number;
	/** Retained-in-memory column payload bytes. */ correctedPayloadBytes: number;
	/** Scientific and GPU qualification limits. */ limit: string;
};
/** Independently substitutable sparse N1 cache diagnostic capability. */
interface HypothesisSparseCache {
	/** Evaluate both representations at an already qualified physical query. */ sample(
		point: number[],
		direction: SkyVector3,
	): HypothesisFlatSample;
	/** Inspect accumulated numerical and resource facts. */ report(): HypothesisFlatCacheReport;
}
/** One complete three-representation Flat ray comparison. */
type HypothesisFlatComparison = {
	/** Original view elevation. */ elevationDegrees: number;
	/** Frozen physical/source and ray packet. */ inputs: HorizonTransportInput;
	/** Fine raw combined-J spectrum. */ raw: number[];
	/** Coarse raw combined-J spectrum. */ rawLow: number[];
	/** Fine raw species contributions. */ rawSpecies: number[][];
	/** Fine corrected total spectrum. */ corrected: number[];
	/** Fine corrected species contributions. */ correctedSpecies: number[][];
	/** Coarse corrected total spectrum. */ correctedLow: number[];
	/** Retained continuous total spectrum. */ reference: number[];
	/** Retained continuous species contributions. */ referenceSpecies: number[][];
	/** Corrected minus retained reference. */ signedErrors: number[];
	/** Empirical refinement allowance per channel. */ comparisonAllowances: number[];
	/** Whether every channel meets the registered screen. */ passed: boolean;
	/** Unchanged bin-integrated projection of raw spectrum. */ rawColor: HorizonColorReading;
	/** Same projection of corrected spectrum. */ correctedColor: HorizonColorReading;
	/** Same projection of retained reference. */ referenceColor: HorizonColorReading;
	/** Actual sparse payload and parity facts. */ cache: HypothesisFlatCacheReport;
};
/** Independent phase-only P1 species reading at one quadrature level. */
type HypothesisPhaseP1Reading = {
	/** Analytic-CS control total, W. */ total: number;
	/** Rayleigh emission at unchanged combined extinction. */ rayleigh: number;
	/** Mie emission at unchanged combined extinction. */ mie: number;
	/** Same species weights with the adapter's represented Mie phase. */ adapter: number;
};
/** One fixed-paper phase-only diagnostic, not a new external/all-order solution. */
type HypothesisPhaseP1Row = {
	/** Original witness identifier. */ ray: string;
	/** Direct40 index. */ channel: number;
	/** Adapter divided by analytic phase. */ phaseRatio: number;
	/** Fine quadrature reading. */ control: HypothesisPhaseP1Reading;
	/** Coarse quadrature reading. */ coarse: HypothesisPhaseP1Reading;
	/** Adapter minus control P1. */ p1ChangeW: number;
	/** Empirical P1 refinement allowance. */ refinementAllowanceW: number;
	/** Authenticated prior independent fine P1. */ retainedP1W: number;
	/** Unchanged prior all-order estimate. */ retainedAllOrder: SmallRayEstimate;
	/** Scope of the contrast. */ limit: string;
};
/** Retained optional H10 P1 contrast. */
type HypothesisPhaseP1Packet = {
	/** Six exact ray/channel contrasts. */ rows: HypothesisPhaseP1Row[];
};
/** Retained Native48 first-order factorial output. */
type HypothesisNativeMatrixPacket = {
	/** Original row/level identities. */ layout: readonly SkyTargetedRayLayout[];
	/** Corresponding spectral indices. */ channels: number[];
	/** Compact GPU readback and device facts. */ matrix: SkyTargetedGpuResult;
};
/** Retained matched Flat comparison. */
type HypothesisFlatPacket = {
	/** All three original center rays. */ rows: HypothesisFlatComparison[];
};
/** Scientific hypothesis decision; support is explicitly scope-limited.
 * - **"supported within tested boundary"** - Registered evidence supports the named tested mechanism.
 * - **"challenged"** - The tested prediction fails within its stated boundary.
 * - **"unresolved"** - A required discriminating comparison remains unavailable or uncertain.
 */
type HypothesisDecision = 'supported within tested boundary' | 'challenged' | 'unresolved';
/** One bounded hypothesis conclusion, including untested extensions. */
type HypothesisDecisionRecord = {
	/** Original hypothesis letter. */ hypothesis: string;
	/** Decision for the stated scope. */ decision: HypothesisDecision;
	/** Exact tested mechanism. */ boundary: string;
	/** Observed result and uncertainty meaning. */ finding: string;
	/** Explicit limit or missing comparison. */ remaining: string;
};
/** Retained assessment fields needed to preserve the original execution decisions. */
type HypothesisQuestionPacket = {
	/** Questions, selected actions and reasons carried forward from the parent assessment. */
	questionDecisions: {
		/** Question encountered during execution. */
		question: string;
		/** Action selected at that boundary. */
		decision: string;
		/** Evidence or constraint behind the action. */
		reason: string;
	}[];
};
