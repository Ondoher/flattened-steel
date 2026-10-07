/** Final first-order representation used with an unchanged analytic L1 recurrence.
 * - **"raw"** - Reconstruct retained scalar J1.
 * - **"factored"** - Reconstruct separate lighting coefficients and apply query density.
 */
type SkyContinuationFirstOrder = 'raw' | 'factored';
/** Higher scattering representation, including its reconstruction grouping.
 * - **"combined-raw"** - Existing combined scalar density fields.
 * - **"split-raw"** - Separately stored Rayleigh and Mie densities.
 * - **"factored"** - Separately stored lighting, multiplied by query density.
 */
type SkyContinuationHigherRepresentation = 'combined-raw' | 'split-raw' | 'factored';
/** Extra evaluation scope carried by a continuation capture.
 * - **"none"** - Retain only the declared ordinary spectral views.
 * - **"component"** - Add the frozen component reference queries.
 * - **"adaptive"** - Add component references and bounded adaptive trial queries.
 */
type SkyContinuationReferenceMode = 'none' | 'component' | 'adaptive';
/** One frozen component query on the canonical benchmark grid. */
type SkyContinuationProbe = Readonly<{
	/** Stable bounded identifier. */ probeId: string;
	/** Registered local capture time. */ time: string;
	/** Canonical grid column. */ gridX: number;
	/** Canonical grid row. */ gridY: number;
}>;
/** Compact continuation-specific evaluator selection, never an expanded support. */
type SkyContinuationCaptureControl = Readonly<{
	/** First-order reconstruction intervention. */ finalFirstOrder: SkyContinuationFirstOrder;
	/** Explicit later-order representation; absent preserves the combined raw recurrence. */ higherRepresentation?: SkyContinuationHigherRepresentation;
	/** Ground-knot reconstruction witnesses, distinct from view-integral probes. */ groundDensityProbes?: readonly SkyContinuationProbe[];
	/** Independently identified extra evaluation methods. */ referenceMode: SkyContinuationReferenceMode;
	/** Frozen diagnostic coordinates, including extra-time probes where requested. */ probes: readonly SkyContinuationProbe[];
	/** Complete scene geometries for exactly the diagnostic times. */ probeScenes: readonly SkyScene[];
}>;
/** Named continuation construction and its frozen scientific purpose. */
type SkyContinuationCase = Readonly<{
	/** Unique admitted case name. */ id: string;
	/** Plan work package that owns this construction. */ phase: SkyContinuationJobPhase;
	/** Complete changes from the working H control. */ controls: SkyControlInput;
	/** First-order output intervention; higher orders remain unchanged in C1/C2. */ finalFirstOrder: SkyContinuationFirstOrder;
	/** Question or original qualitative prediction, never a fitted target response. */ hypothesis: string;
}>;
/** Measured resources at an owned GPU job observation. */
type SkyContinuationMemoryObservation = Readonly<{
	/** UTC observation time. */ timestamp: string;
	/** GPU job elapsed time including capture/readback. */ elapsedMilliseconds: number;
	/** Runner plus owned browser descendant private bytes. */ privateBytes: number;
	/** Current host free physical memory. */ availableBytes: number;
	/** Number of owned processes counted. */ processCount: number;
}>;
/** Kind of resource-debited continuation work.
 * - **"gpu"** - One GPU construction or charged full capture.
 * - **"cpu"** - CPU-only reference, proof or analysis.
 */
type SkyContinuationJobKind = 'gpu' | 'cpu';
/** Registered scope of an admitted continuation job.
 * - **"screen"** - Three-time six-channel construction.
 * - **"full"** - Seventeen-time forty-channel construction/capture.
 * - **"component"** - Separately labelled proof/reference/analysis.
 */
type SkyContinuationJobScope = 'screen' | 'full' | 'component';
/** Phase charged for a newly admitted continuation job.
 * - **"C1"** - Numerical support, proofs and pilot construction.
 * - **"C2"** - Finite-N4 reference ladder and its analysis.
 * - **"C3"** - Independent diagnostic mechanisms and adaptive construction.
 * - **"C4"** - Component representation trials.
 * - **"C5"** - Full-boundary construction and prediction assessment.
 * - **"C6"** - Mandatory final reports and qualification analysis.
 */
type SkyContinuationJobPhase = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
/** Immutable retained-byte ledger buckets, including the original registration.
 * - **"C0"** - Actual bytes of the one sealed original registration.
 * - **"C1"** - Registered support and pilot attempts, including failures.
 * - **"C2"** - Registered reference-ladder attempts, including failures.
 * - **"C3"** - Registered mechanism attempts, including failures.
 * - **"C4"** - Registered representation attempts, including failures.
 * - **"C5"** - Registered full-boundary attempts, including failures.
 * - **"C6"** - Final report and qualification attempts, including failures.
 * - **"failure-and-sealing-reserve"** - The specifically admitted extra invalid attempt; ordinary failed jobs keep their phase allocation.
 */
type SkyContinuationAllocationPhase = 'C0' | SkyContinuationJobPhase | 'failure-and-sealing-reserve';
/** Admission decision made from authenticated completed jobs and actual storage. */
type SkyContinuationAdmission = Readonly<{
	/** Exact prospective authorization when a scoped package consumes post-cap GPU attempts. */ gpuAuthorization?:
		SkyRemainingGpuAuthorization | SkyDirectGpuAuthorization;
	/** All previous completed resource debits. */ usage: DialContinuationResourceCounters;
	/** Forecast next retained bytes, including its sealing allowance. */ allocatedBytes: number;
	/** Current job timeout narrowed by remaining campaign time. */ timeoutMilliseconds: number;
	/** Explicit retained-byte bucket checked before this new job. */ phase: SkyContinuationJobPhase;
	/** Effective byte ceiling for this phase after any authenticated amendment. */ phaseRetainedLimitBytes: number;
	/** Actual completed bytes already charged to this phase. */ phaseRetainedBytes: number;
	/** Remaining report/failure reserve protected by this admission. */ protectedReserveBytes: number;
}>;
/** Authenticated CPU preflight; constructing this value never allocates a run or GPU field. */
type SkyContinuationPrepared = Readonly<{
	/** Frozen campaign control. */ registration: DialContinuationRegistrationRead;
	/** Exact registered construction. */ candidate: SkyContinuationCase;
	/** Derived physical request and scalar-layout estimate. */ profile: SkyDerivedProfile;
	/** Ordinary scoring/capture selection. */ selection: DialAnalysisSelection;
	/** Current campaign resource allowance. */ admission: SkyContinuationAdmission;
	/** Compact browser/evaluator control. */ control: SkyGpuControl;
	/** Authenticated static and explicit dynamic module closure. */ sources: readonly DialFileIdentity[];
}>;
/** A pinned failed verification retained only to reconcile consumed resources. */
type SkyContinuationInvalidEvidence = Readonly<{
	/** Exact immutable seal identity. */ seal: DialFileIdentity;
	/** Accounting classification; never accepted scientific evidence. */ classification: 'invalid-evidence-accounted-only';
	/** Verified failure and exclusion from claims. */ reason: string;
	/** Actual consumed job time. */ jobElapsedMilliseconds: number;
}>;

/** The one explicit prospective transfer of unused C0/R0 bytes into C3. */
type SkyContinuationAllocationBasis = Readonly<{
	/** Closed allocation-amendment schema; no generic override fields are accepted. */ schemaId: 'sky-continuation-allocation-amendment-v1';
	/** Exact original C0 seal, whose contents and acceptance rules remain unchanged. */ registration: DialFileIdentity;
	/** Exact successful C1 R0 capture reused for the C2 R0 screen slot. */ reusedR0: DialFileIdentity;
	/** Original compact R0 controls proving the retained selector support. */ reuseControl: DialFileIdentity;
	/** Original successful R0 GPU execution and spectral-readback evidence. */ reuseExecution: DialFileIdentity;
	/** All original resource ceilings and phase allocations, without alteration. */ registeredLimits: DialContinuationResourceCaps;
	/** Exact original C0 phase caps and unchanged construction/full-capture slots. */ originalPhaseAllocations: readonly DialContinuationPhaseAllocation[];
	/** Effective caps after the sole C0/C2-to-C3 transfer. */ effectivePhaseAllocations: readonly DialContinuationPhaseAllocation[];
	/** Exact registered transfer and conserved-byte equation. */ equation: string;
	/** Why final spectra cannot replace the missing transient adaptive fields. */ reason: string;
	/** Explicitly limited R0 reuse claim; no reuse of discarded fields is implied. */ reuseScope: string;
}>;

/** Authenticated successful allocation amendment consumed by future admissions. */
type SkyContinuationAllocationAmendmentRead = Readonly<{
	/** Exact immutable amendment seal. */ seal: DialFileIdentity;
	/** Validated specific transfer and its original evidence. */ record: SkyContinuationAllocationBasis;
}>;
