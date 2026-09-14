/** Scientific state of one frozen physical-reference probe.
 * - **"resolved"** - Both independent formulations resolved their declared tolerances.
 * - **"unresolved"** - A returned calculation retained an unresolved numerical limit.
 * - **"interrupted"** - The job deadline stopped this calculation before a report was returned.
 * - **"not-attempted"** - Pilot admission or remaining resources prevented execution.
 */
type SkyPhysicalProbeRunState = 'resolved' | 'unresolved' | 'interrupted' | 'not-attempted';

/** Bounded cost and resolution evidence for one caller-authenticated ray. */
type SkyPhysicalProbeExecution = Readonly<{
	/** Exact frozen C0 probe identifier. */ probeId: string;
	/** Scientific execution/resolution state. */ state: SkyPhysicalProbeRunState;
	/** Measured elapsed milliseconds, or null for an unattempted probe. */ elapsedMilliseconds: number | null;
	/** Returned medium-profile pair count across both methods, or null if unavailable. */ mediumEvaluations:
		number | null;
	/** Returned outer evaluation count across both methods, or null if unavailable. */ outerEvaluations: number | null;
	/** Explicit reason for unresolved/interrupted/unattempted work. */ reason: string | null;
	/** Immutable individual report when the numerical API returned one. */ report: DialFileIdentity | null;
}>;

/** Pilot-based continuation decision; the timing projection is not a guaranteed work bound. */
type SkyPhysicalPilotAdmission = Readonly<{
	/** First frozen probe selected before any physical reference is evaluated. */ probeId: string;
	/** Whether both formulations returned a resolved pilot. */ resolved: boolean;
	/** Actual pilot elapsed milliseconds. */ elapsedMilliseconds: number;
	/** Explicit multiplier on measured pilot time. */ projectionMultiplier: number;
	/** Remaining probe count after the pilot. */ remainingProbeCount: number;
	/** Estimated remaining milliseconds using the declared multiplier. */ projectedRemainingMilliseconds: number;
	/** Actual remaining job allowance at the decision. */ remainingAllowanceMilliseconds: number;
	/** Whether the remaining probes were admitted. */ proceed: boolean;
	/** Human-readable accepted/restricted decision. */ reason: string;
}>;

/** CPU-only memory observation; RSS is not a private-bytes measurement. */
type SkyPhysicalCpuMemory = Readonly<{
	/** UTC observation time. */ timestamp: string;
	/** Elapsed job milliseconds. */ elapsedMilliseconds: number;
	/** Process resident set reported by Node. */ residentSetBytes: number;
	/** Available host physical memory reported by node:os. */ availableHostBytes: number;
}>;

/** Immutable physical-reference runner handoff; acceptance concerns execution, not full-solver accuracy. */
type SkyPhysicalRunResult = Readonly<{
	/** New CPU-only component run. */ run: string;
	/** Explicit work profile frozen before the first physical computation. */ profile: SkyPhysicalReferenceProfile;
	/** Exact verified terminal seal. */ seal: DialFileIdentity;
	/** Whether infrastructure, provenance and sealing succeeded. */ accepted: boolean;
	/** Whether all forty frozen rays and four channels resolved by both methods. */ referenceResolved: boolean;
	/** Number of probe reports returned by the physical evaluator. */ completedProbeCount: number;
	/** Number of channel rows whose two methods resolved. */ resolvedRowCount: number;
}>;

/** Exact immutable baseline artifacts authorizing the single named numerical work revision. */
type SkyPhysicalRevisionParent = Readonly<{
	/** Original limited physical-pilot run, never discovered by latest-run selection. */ run: string;
	/** Fully verified terminal parent identity. */ seal: DialFileIdentity;
	/** Matched original physical controls and computational caps. */ control: DialFileIdentity;
	/** Retained original numerical work-limit outcome. */ pilot: DialFileIdentity;
	/** Why this computational revision is distinct from an accuracy-tolerance change. */ reason: string;
}>;

/** Minimal immutable original-pilot seal contract consumed by the retry runner. */
type SkyPhysicalRevisionSeal = Readonly<{
	/** Exact prior run path. */ run: string;
	/** Prior terminal execution state. */ state: DialRunState;
	/** Parent controls and continuation-registration identity. */ recipe: SkyPhysicalRevisionRecipe;
	/** Verified retained artifact inventory. */ artifacts: readonly DialArtifact[];
	/** Original pilot execution conclusion. */ result: SkyPhysicalOriginalResult;
}>;

/** Historical derivation with the precise routing fields consumed by this revision. */
type SkyPhysicalRevisionRecipe = Omit<DialDerivation, 'parameters'> &
	Readonly<{
		/** Registered historical execution routing. */ parameters: SkyPhysicalOriginalParameters;
	}>;

/** Minimal immutable historical execution routing, checked before reuse. */
type SkyPhysicalOriginalParameters = Readonly<{
	/** Exact original C0 run path. */ continuationRegistration: string;
	/** Original accounted compute category. */ jobKind: SkyContinuationJobKind;
	/** Original registered output scope. */ scope: SkyContinuationJobScope;
}>;

/** Original limited physical-pilot execution summary. */
type SkyPhysicalOriginalResult = Readonly<{
	/** Original physical reference case identity. */ caseId: string;
	/** Whether the complete frozen reference set qualified. */ referenceResolved: boolean;
	/** Number of returned physical-probe reports. */ completedProbeCount: number;
}>;

/** Historical default controls, consumed without assuming newer telemetry fields exist. */
type SkyPhysicalOriginalControl = Readonly<{
	/** Original continuation-registration identity. */ registration: DialFileIdentity;
	/** Original matched physical-input identity. */ input: DialFileIdentity;
	/** Original registered component channels. */ channels: readonly number[];
	/** Original frozen physical probes. */ probes: readonly SkyReferenceProbe[];
	/** Original method-shared computational limits. */ numericalBudget: Pick<
		SkyPhysicalReferenceBudget,
		'maximumMediumEvaluations' | 'maximumOuterEvaluations' | 'maximumColumnEvaluations'
	>;
}>;

/** Historical pilot subset, avoiding a false claim that older records contain new policy telemetry. */
type SkyPhysicalOriginalPilot = Readonly<{
	/** Original overall admission outcome. */ resolved: boolean;
	/** Original channel/probe admission identities. */ rows: readonly Pick<
		SkyPhysicalReferenceRow,
		'probeId' | 'channel' | 'resolved'
	>[];
	/** Original independent method work-limit evidence. */ probes: readonly SkyPhysicalOriginalProbe[];
}>;

/** Historical independent method evidence retained before per-pass telemetry was introduced. */
type SkyPhysicalOriginalProbe = Readonly<{
	/** Original registered physical-probe identity. */ probeId: string;
	/** Only fields present in the original limited pilot are required. */ methods: readonly Pick<
		SkyPhysicalMethodResult,
		'method' | 'converged' | 'mediumEvaluations' | 'reasons'
	>[];
}>;
