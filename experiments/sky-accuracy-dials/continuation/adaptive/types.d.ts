/** The finite dyadic subdivision levels admitted within a physical altitude segment. */
type SkyAdaptiveLevel = 1 | 2 | 4 | 8 | 16;

/** One distinct midpoint query; midpoint sets at different levels are disjoint. */
type SkyAdaptiveNode = Readonly<{
	/** Dense identity within this ray's 31P union. */ id: number;
	/** Observer-to-top physical segment index. */ segmentIndex: number;
	/** Uniform subdivision count within the segment. */ level: SkyAdaptiveLevel;
	/** Zero-based subinterval within the level. */ substepIndex: number;
	/** Observer distance at subinterval start, metres. */ start: number;
	/** Observer distance at subinterval end, metres. */ end: number;
	/** Arithmetic midpoint observer distance, metres. */ distance: number;
	/** Positive subinterval length, metres. */ step: number;
}>;

/** Geometric subdivision tables; construction does not evaluate medium or fields. */
type SkyAdaptiveSegment = Readonly<{
	/** Positive physical altitude interval in metres. */ interval: SkyPathInterval;
	/** Ordered node identifiers for each permitted uniform level. */ levels: Readonly<
		Record<SkyAdaptiveLevel, readonly number[]>
	>;
}>;

/** Bounded geometric support shared by counted adaptive and uniform integration. */
type SkyAdaptiveRay = Readonly<{
	/** Observer-to-top physical altitude segments. */ segments: readonly SkyAdaptiveSegment[];
	/** Complete 31P midpoint union in segment/level/substep order. */ nodes: readonly SkyAdaptiveNode[];
}>;

/** One prepared physical ray and its local field-reconstruction samples. */
type SkyAdaptiveViewRay = Readonly<{
	/** Caller-frozen physical and measurement identity. */ probe: SkyReferenceProbe;
	/** Permitted geometric query union. */ geometry: SkyAdaptiveRay;
	/** Sparse reconstruction sample indexed by geometric node id. */ samples: readonly SkyViewSample[];
}>;

/** Ephemeral captured-field support; its preparation cost is distinct from runtime sampling. */
type SkyAdaptiveViewPlan = Readonly<{
	/** Explicit bounded-support schema. */ schemaId: 'sky-adaptive-view-plan-v1';
	/** Local sparse field coordinates in append order. */ coordinates: readonly SkyFieldCoordinate[];
	/** Caller-ordered physical rays. */ rays: readonly SkyAdaptiveViewRay[];
	/** Total geometric midpoint locations prepared, exactly 31 times all segment counts. */ preparedQueryCount: number;
	/** All five levels, including the trial-only level-one locations. */ levels: readonly SkyAdaptiveLevel[];
}>;

/** Separate first-order and cumulative higher-order densities at one joint query. */
type SkyAdaptiveNodeValue = Readonly<{
	/** Nonnegative total extinction coefficient, inverse metres. */ extinctionPerMeter: number;
	/** J1, J2, J2+J3, J2+J3+J4, in W m^-3 sr^-1 nm^-1. */ densities: readonly [number, number, number, number];
}>;

/** One joint medium/reconstruction callback; every uncached invocation is charged first. */
type SkyAdaptiveNodeEvaluator = (node: SkyAdaptiveNode) => SkyAdaptiveNodeValue;

/** Caller-declared reconstruction cost of the identical joint evaluator used by both rules. */
type SkyAdaptiveOptions = Readonly<{
	/** Four raw reconstructions or five when J1 uses separate species lighting fields. */ scalarReconstructionsPerNode:
		4 | 5;
	/** Retain meshes only for caller-selected sparse diagnostic rays. */ retainMesh: boolean;
}>;

/** Exact logical callback counts; support construction and GPU captures are separate costs. */
type SkyAdaptiveCounters = Readonly<{
	/** All unique callback invocations, including discarded coarse/trial values. */ queriedNodes: number;
	/** One physical-medium call per joint node. */ mediumEvaluations: number;
	/** Joint query count times the declared four/five reconstruction cost. */ scalarReconstructions: number;
	/** Cached node reads that required no further callback. */ cacheHits: number;
}>;

/** One bounded integration checkpoint, with explicit grouping and optional sparse mesh. */
type SkyAdaptiveCheckpoint = Readonly<{
	/** Runtime joint-query ceiling; unspent capacity remains unspent. */ budget: number;
	/** Actually used midpoint intervals, excluding discarded coarser nodes. */ activeNodeCount: number;
	/** Counted work through this checkpoint, including all trials. */ counters: SkyAdaptiveCounters;
	/** Separately integrated J1, H2, H3, H4 radiances. */ componentRadiancesW: readonly number[];
	/** Grouped N1, N2, N3, N4 radiances; J1 is added after integration. */ groupedRadiancesW: readonly number[];
	/** Final observer-to-top attenuation. */ transmittance: number;
	/** Selected active subdivision level per altitude segment, only when requested. */ mesh:
		readonly SkyAdaptiveLevel[] | null;
	/** Next top-priority refinement cost, or zero when all levels are exhausted. */ nextRefinementCost: number;
}>;

/** Three prefix-related adaptive results from one counted evaluation session. */
type SkyAdaptiveRayResult = Readonly<{
	/** Explicit adaptive result schema. */ schemaId: 'sky-adaptive-ray-result-v1';
	/** Complete finite geometric support, not the number of runtime evaluations. */ preparedQueryCount: number;
	/** Runtime checkpoints at 4P, 8P and 16P. */ checkpoints: readonly SkyAdaptiveCheckpoint[];
	/** Deliberate limits of the retrospective refinement indicator. */ indicatorPolicy: string;
}>;

/** Transfer across one segment or ray for a fixed four-component midpoint rule. */
type SkyAdaptiveTransfer = Readonly<{
	/** Product of the same two half-step attenuation factors used by the final fold. */ attenuation: number;
	/** Four separate component source integrals from the interval origin. */ sources: readonly number[];
}>;

/** Mutable algorithm-private state; no caller-owned records are mutated. */
type SkyAdaptiveSegmentState = {
	/** Current selected level. */ level: SkyAdaptiveLevel;
	/** Previous/coarser segment estimate used by the priority heuristic. */ coarse: SkyAdaptiveTransfer;
	/** Active segment estimate. */ fine: SkyAdaptiveTransfer;
};

/** Algorithm-private counted cache, never shared between adaptive and uniform comparisons. */
type SkyAdaptiveCache = Readonly<{
	/** Budgeted joint callback access by node identity. */ get: (id: number) => SkyAdaptiveNodeValue;
	/** Increase the current ceiling for the next prefix checkpoint. */ setBudget: (budget: number) => void;
	/** Snapshot of actual callback and cache-use counts. */ counters: () => SkyAdaptiveCounters;
}>;

/** Optional physically factored first-order lighting fields in this plan's coordinate order. */
type SkyAdaptiveFactoredFirstOrder = Readonly<{
	/** Rayleigh lighting, with local physical density applied during the joint query. */ rayleighLighting: Float32Array;
	/** Mie lighting, with local physical density applied during the joint query. */ mieLighting: Float32Array;
}>;

/** Shared wavelength fields prepared once before per-ray adaptive or uniform evaluation. */
type SkyAdaptiveFieldSet = Readonly<{
	/** Raw J1 followed by three left-fold Float32 cumulative higher-order fields. */ components: readonly Float32Array[];
	/** Optional first-order species correction; later orders remain fixed. */ factored: SkyAdaptiveFactoredFirstOrder | null;
}>;

/** Manufactured proof record; caller owns immutable recording and source identities. */
type SkyAdaptiveProofResult = Readonly<{
	/** Distinct pure manufactured-proof identity. */ schemaId: 'sky-adaptive-proof-v1';
	/** Number of successful independent assertions. */ checks: number;
	/** Maximum uniform-versus-independent-fold roundoff discrepancy. */ maximumUniformParityError: number;
	/** Largest composition discrepancy for the transfer identity. */ maximumTransferError: number;
	/** Constant-slab midpoint errors for uniform 4/8/16. */ slabErrors: readonly number[];
	/** Quadratic manufactured errors for uniform 4/8/16. */ polynomialErrors: readonly number[];
	/** Explicit counterexample and physical-claim boundaries. */ scope: string;
}>;

/** Manufactured whole-capture integration proof; no GPU or measurement outcome is evaluated. */
type SkyCaptureSupportProofResult = Readonly<{
	/** Distinct capture-boundary proof identity. */ schemaId: 'sky-capture-support-proof-v1';
	/** Number of successful integration and malformed-input rejection assertions. */ checks: number;
	/** Retained-stencil ground witnesses exercised. */ groundProbeCount: number;
	/** Ordinary plus extra-time adaptive rays exercised in each representation. */ adaptiveRayCount: number;
	/** Shared support locations prepared, including unused trial locations. */ preparedQueryCount: number;
	/** Sparse coordinates in the local adaptive capture. */ adaptiveCoordinateCount: number;
	/** Raw and factored maximum discrepancy against independently evaluated ordinary controls. */ maximumUniformParityErrors: readonly number[];
	/** Largest UTF-8 JSON operational envelope across raw/factored manufactured cases. */ maximumAdaptiveEvidenceBytes: number;
	/** Largest UTF-8 JSON diagnostic envelope including operations and ground, with no physical-reference rows. */ maximumManufacturedEnvelopeBytes: number;
	/** Milliseconds spent in each named synchronous stage. */ stageMilliseconds: Readonly<Record<string, number>>;
	/** Explicit synthetic-field and reference limitations. */ scope: string;
}>;
