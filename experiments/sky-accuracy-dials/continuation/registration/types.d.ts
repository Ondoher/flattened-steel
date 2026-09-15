/** One frozen component-probe ray and its selection evidence. */
type DialContinuationProbeRay = Readonly<{
	/** Capture time from the fixed five-time component scope. */ time: string;
	/** Canonical gridY*9+gridX identity. */ rayIndex: number;
	/** Original grid column. */ gridX: number;
	/** Original grid row. */ gridY: number;
	/** Reasons for selecting this ray; selection order is preserved separately. */ reasons: readonly string[];
	/** Baseline point SSE over all 31 registered channels, in squared spectral-radiance watts. */ baselinePointSquaredError: number;
	/** Elevation from the executed benchmark geometry, in degrees. */ elevationDegrees: number;
	/** Angular separation from the fitted Sun, in degrees. */ sunSeparationDegrees: number;
	/** Canonical-world observer origin in metres. */ origin: SkyVector3;
	/** Canonical-world unit outgoing direction. */ direction: SkyVector3;
	/** Atmospheric ray length in metres. */ lengthMeters: number;
}>;

/** One registered future construction/capture slot; no output exists at C0. */
type DialContinuationCaseSlot = Readonly<{
	/** Stable C1/R0-R11/C3/C4/C5 slot identity. */ id: string;
	/** Governing continuation phase. */ phase: string;
	/** Registered control/reference slots needed to define this case. */ parentIds: readonly string[];
	/** Scientific operation or question; unknown magnitudes remain explicit. */ operation: string;
	/** Exact canonical case when predetermined; null means selection must be registered later. */ constructionCase: SkyContinuationCase | null;
	/** Reserved construction/capture debit if this slot requires new execution. */ constructionSlots: number;
	/** Additional full-boundary capture debit. */ fullCaptureSlots: number;
	/** Existing slot that may supply this result only after exact selector/provenance checks. */ possibleReuseOf:
		string | null;
	/** Required output/representation scope. */ selectorRequirement: string;
	/** Prediction rule required before target execution, if any. */ predictionRequirement: string;
	/** Future accepted output identity; null explicitly records an unexecuted slot. */ outputIdentity: DialFileIdentity | null;
}>;

/** Reserved bytes and constructions for one continuation phase. */
type DialContinuationPhaseAllocation = Readonly<{
	/** Phase or failure reserve name. */ phase: SkyContinuationAllocationPhase;
	/** Maximum new construction/capture debits. */ constructionSlots: number;
	/** Maximum full-capture debits within the construction allowance. */ fullCaptureSlots: number;
	/** Phase retained-output allowance, including metadata and seals. */ retainedBytes: number;
}>;

/** Hard independent continuation resource limits frozen before scientific execution. */
type DialContinuationResourceCaps = Readonly<{
	/** Total experiment retained evidence, including the original campaign. */ totalRetainedBytes: number;
	/** Maximum new continuation retained output. */ newRetainedBytes: number;
	/** Maximum simultaneous owned disk scratch. */ liveScratchBytes: number;
	/** Minimum available disk space before and during jobs. */ minimumFreeDiskBytes: number;
	/** Global construction/capture debit ceiling, including failures and timeouts. */ constructionSlots: number;
	/** Global full-boundary capture ceiling, even when construction is shared. */ fullCaptureSlots: number;
	/** Simultaneously active GPU jobs. */ concurrentGpuJobs: number;
	/** Summed elapsed GPU-job milliseconds including capture/readback. */ gpuJobElapsedMilliseconds: number;
	/** Summed elapsed CPU-only reference/analysis job milliseconds. */ cpuJobElapsedMilliseconds: number;
	/** Per-screen timeout, additionally bounded by remaining campaign time. */ screenTimeoutMilliseconds: number;
	/** Per-full timeout requiring C1 host support, additionally bounded by remaining campaign time. */ fullTimeoutMilliseconds: number;
	/** Maximum estimated scalar recurrence field storage, distinct from disk scratch. */ scalarFieldBytes: number;
	/** Minimum available host-memory headroom during jobs. */ hostHeadroomBytes: number;
	/** Maximum combined runner/browser private memory, derived from initial available memory. */ processPrivateBytes: number;
	/** Initial available-memory fraction that further limits private memory. */ initialAvailableMemoryFraction: number;
	/** Maximum local continuous-L1/J2 space/wavelength queries after the one-query pilot. */ localJ2QueryCount: number;
	/** Maximum new model revision per work package after failure, within its remaining slots. */ modelRevisionsPerWorkPackage: number;
	/** Per-phase allocations and mandatory report/failure reserves. */ phaseAllocations: readonly DialContinuationPhaseAllocation[];
}>;

/** Empirical numerical-reference and prediction gates, not statistical confidence claims. */
type DialContinuationScientificGates = Readonly<{
	/** Existing implementation radiance floor in W spectral-radiance units. */ implementationFloorW: number;
	/** Required significant-scalar sign agreement in every declared group. */ minimumSignAgreement: number;
	/** Largest relative spectral-vector forecast error in every declared group. */ maximumRelativeVectorError: number;
	/** Starting multiplier on each largest supported component remainder/disagreement. */ referenceRemainderMultiplier: number;
	/** Maximum reference allowance as a fraction of claimed numerical reduction D. */ maximumAllowanceToReduction: number;
	/** Required norm improvement relative to the same reference allowance U. */ strictReductionAllowanceMultiplier: number;
	/** Largest resolved relative numerical-error reduction forecast error. */ maximumNumericalReductionForecastError: number;
	/** Minimum useful Kider RMSE improvement in both full and prospective scopes, in mW. */ minimumUsefulKiderImprovementMilliwatt: number;
	/** Relative allowance on forecast score improvement. */ scoreForecastRelativeAllowance: number;
	/** Absolute score forecast floor, in mW. */ scoreForecastAbsoluteAllowanceMilliwatt: number;
	/** How components and independent checks form the empirical reference envelope. */ referenceEquation: string;
	/** Unresolved terms and unsupported extrapolation cannot be treated as zero. */ referenceLimitations: readonly string[];
	/** Group identities assessed independently at each selected time. */ angularGroups: readonly string[];
}>;

/** Exact external executable bytes used for registration. */
type DialContinuationToolIdentity = Readonly<{
	/** Canonical absolute path, checked for links/junctions. */ path: string;
	/** Executable file byte count. */ byteLength: number;
	/** SHA-256 of all executable bytes. */ sha256: string;
	/** Reported runtime version. */ version: string;
}>;

/** Current host measurements; historical GPU facts are deliberately excluded. */
type DialContinuationHost = Readonly<{
	/** UTC measurement timestamp. */ measuredAt: string;
	/** Operating-system platform. */ platform: string;
	/** Operating-system release. */ release: string;
	/** Process architecture. */ architecture: string;
	/** Logical processor count. */ logicalProcessors: number;
	/** Runtime-recommended available processor parallelism. */ availableParallelism: number;
	/** Total physical memory reported by node:os. */ totalMemoryBytes: number;
	/** Available/free physical memory reported by node:os.freemem at registration. */ availableMemoryBytes: number;
	/** Identity of the actual Node executable. */ node: DialContinuationToolIdentity;
	/** Why GPU renderer/dimensions are not yet current verified facts. */ deviceProbePending: string;
}>;

/** One authenticated original terminal run; rejection/failure remains preserved evidence. */
type DialContinuationHistoricalRun = Readonly<{
	/** Exact original sequence, zero through 98. */ sequence: number;
	/** Immutable repository-relative run path. */ run: string;
	/** Exact authenticated original seal. */ seal: DialFileIdentity;
	/** Preserved original terminal outcome. */ state: DialRunState;
	/** Total bytes of original artifacts plus the original seal. */ retainedBytes: number;
}>;

/** Evidence returned after a new C0 registration has been sealed and verified. */
type DialContinuationRegistrationResult = Readonly<{
	/** New immutable C0 run. */ run: string;
	/** Verified terminal seal identity. */ seal: DialFileIdentity;
	/** Exact bytes retained by this registration including its seal. */ retainedBytes: number;
	/** Number of authenticated original terminal runs. */ historicalRunCount: number;
	/** Number of frozen rays across the five component conditions. */ probeRayCount: number;
}>;

/** Original serialized C0 counters, preserved exactly as frozen before continuation work. */
type DialContinuationInitialCounters = Readonly<{
	/** Consumed GPU construction/capture slots. */ gpuConstructions: number;
	/** Consumed full-boundary capture slots. */ fullCaptures: number;
	/** Summed GPU-job wall time. */ gpuElapsedMilliseconds: number;
	/** Summed CPU-only reference/analysis job wall time. */ cpuElapsedMilliseconds: number;
	/** New continuation retained bytes, excluding all original evidence. */ newRetainedBytes: number;
}>;

/** Resource debits reconstructed from all immutable continuation terminal records. */
type DialContinuationResourceCounters = DialContinuationInitialCounters &
	Readonly<{
		/** Exact invalid records charged to this campaign and excluded from claims. */ invalidEvidence?: readonly SkyContinuationInvalidEvidence[];
		/** Latest authenticated fixed amendment/extension, or null before the original amendment. */ allocationAmendment:
			SkyContinuationAllocationAmendmentRead | SkyContinuationResourceExtensionRead | null;
		/** Effective exact phase caps, retaining all original construction/full-capture slots. */ effectivePhaseAllocations: readonly DialContinuationPhaseAllocation[];
		/** Actual artifact-plus-seal bytes by declared phase, including failures; only the explicit extra invalid attempt uses the failure reserve. */ retainedBytesByPhase: Readonly<
			Record<SkyContinuationAllocationPhase, number>
		>;
	}>;

/** Fixed sample scopes; probe rays are selected separately for each probe time. */
type DialContinuationScopes = Readonly<{
	/** Three development times, six numerical channels, all rays. */ screen: DialAnalysisSelection;
	/** Seventeen times, 40 retained channels, all rays. */ full: DialAnalysisSelection;
	/** Fourteen non-screen times for previously unexecuted intervention outputs. */ prospective: DialAnalysisSelection;
	/** Five component-reference times. */ probeTimes: readonly string[];
	/** Four component-reference wavelengths by Direct40 index. */ probeChannels: readonly number[];
	/** Registered channels used for point SSE selection and Kider scores. */ scoreChannels: readonly number[];
	/** Existing all-time partial-spectral N4-N6 scope. */ orderDiagnostic: DialAnalysisSelection;
}>;

/** Immutable C0 record; later jobs link to this exact artifact and seal. */
type DialContinuationRegistrationRecord = Readonly<{
	/** Registration schema identity. */ schemaId: string;
	/** New C0 run identity. */ run: string;
	/** UTC registration timestamp. */ registeredAt: string;
	/** Exact governing execution plan. */ plan: DialFileIdentity;
	/** Exact source-review baseline required for this implementation unit. */ reviewBaseline: DialFileIdentity;
	/** Exact compact input snapshot control artifact. */ inputs: DialFileIdentity;
	/** Exact initial baseline full capture. */ baseline: DialFileIdentity;
	/** Exact first-campaign summary artifact. */ summary: DialFileIdentity;
	/** All 99 original terminal records, including failures and rejected predictions. */ historicalRuns: readonly DialContinuationHistoricalRun[];
	/** Baseline storage before this registration is allocated. */ initialStorage: DialStorage;
	/** Current host measurements and pending device-probe obligation. */ host: DialContinuationHost;
	/** Static ceilings narrowed by measured initial host memory. */ budgets: DialContinuationResourceCaps;
	/** Zero counters before the first continuation operation; later records must debit actual usage. */ initialCounters: DialContinuationInitialCounters;
	/** Canonical development, component, full and assessment scopes. */ scopes: DialContinuationScopes;
	/** Detailed frozen probe geometry, ordering and baseline-error evidence. */ probeRays: readonly DialContinuationProbeRay[];
	/** Exact component scene geometries in probe-time order. */ probeScenes: readonly SkyScene[];
	/** Deterministic selection equation and tie-breaking convention. */ selectionRecipe: string;
	/** Actual C1/C2 controls from the canonical continuation case owner. */ constructionCases: readonly SkyContinuationCase[];
	/** Reserved future case/capture ledger; no scientific outputs exist at C0. */ caseLedger: readonly DialContinuationCaseSlot[];
	/** Frozen reference and forecast gates. */ scientificGates: DialContinuationScientificGates;
	/** Obligations that registration alone does not establish. */ pendingAdmission: readonly string[];
}>;

/** Authenticated registration view shared with the continuation execution owner. */
type DialContinuationRegistrationRead = Readonly<{
	/** Verified registration run path. */ run: string;
	/** Exact terminal registration seal. */ seal: DialFileIdentity;
	/** Complete frozen record. */ record: DialContinuationRegistrationRecord;
	/** Browser capture probe coordinates in frozen selection order. */ probes: readonly SkyContinuationProbe[];
	/** Fixed diagnostic scene geometries. */ probeScenes: readonly SkyScene[];
	/** Registration-specific resource limits. */ budgets: DialContinuationResourceCaps;
	/** Storage baseline used to debit all subsequent retained output. */ initialStorage: DialStorage;
	/** Initial zero debits; subsequent run recipes/elapsed records own actual use. */ initialCounters: DialContinuationInitialCounters;
}>;
