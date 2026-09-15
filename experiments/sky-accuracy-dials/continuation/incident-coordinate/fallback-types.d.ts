/** A retained comparison between an original and candidate fine component. */
type SkyIncidentFineComparison = Readonly<{
	/** Component-major atmosphere/ground/total index. */ index: number;
	/** Original fine method. */ originalMethod: SkyPhysicalReferenceMethod;
	/** Candidate fine method, including exact reused Gauss. */ candidateMethod: SkyPhysicalReferenceMethod;
	/** Original complete fine value in spectral W. */ originalWatts: number;
	/** Candidate fine value; null when unavailable. */ candidateWatts: number | null;
	/** Absolute observed change; null when unavailable. */ differenceWatts: number | null;
	/** Sum of both original fine tolerances and column allowances. */ allowanceWatts: number | null;
	/** Missing comparisons never pass. */ passed: boolean;
}>;

/** Compact complete evidence for one attempted coordinate fallback. */
type SkyIncidentFallbackRecord = Readonly<{
	/** Distinct fallback evidence schema. */ schemaId: 'sky-incident-coordinate-fallback-v1';
	/** Original worker task identity. */ id: string;
	/** Exact JSON identity of the original unresolved result. */ originalResultSha256: string;
	/** Exact original physical geometry JSON identity. */ geometrySha256: string;
	/** Original result schema, never relabeled. */ originalSchemaId: string;
	/** Original failed component admissions, including their values and reasons. */ originalChannels: readonly SkyVolumeChannel[];
	/** Original Gauss and Simpson evidence, including coarse/fine values and work. */ originalMethods: readonly SkyPhysicalMethodResult[];
	/** Original bounded work profile. */ profile: SkyPhysicalReferenceProfile;
	/** Remaining Simpson capacity after the original Simpson work. */ remainingCaps: Readonly<{
		/** Maximum new medium evaluations. */ maximumMediumEvaluations: number;
		/** Maximum new outer evaluations. */ maximumOuterEvaluations: number;
	}>;
	/** New coordinate's complete or explicitly unresolved Simpson attempt. */ candidateSimpson: SkyPhysicalMethodResult;
	/** Candidate component admission under the unchanged numerical rules. */ candidateChannels: readonly SkyVolumeChannel[];
	/** Admission before the mandatory old-fine consistency comparisons. */ candidateResolved: boolean;
	/** Every old/new method pair and every represented component. */ comparisons: readonly SkyIncidentFineComparison[];
	/** True only if admission and every comparison pass. */ replaced: boolean;
	/** Parent-thread duration of this attempt and its evidence assembly. */ mainThreadMilliseconds: number;
}>;

/** Additional work not represented in the returned rows' method records. */
type SkyIncidentFallbackWork = {
	/** Discarded old Simpson work after replacement, otherwise new attempted work. */ mediumEvaluations: number;
	/** Discarded old Simpson work after replacement, otherwise new attempted work. */ outerEvaluations: number;
	/** Complete parent-thread fallback duration, never added to worker durations. */ mainThreadMilliseconds: number;
};

/** Synchronous retention callback invoked before the next guard after a completed attempt.
 * Retain evidence and counters without throwing or invoking a guard. The work
 * increment is relative to returnedRow; if retaining the original worker row
 * instead, add record.candidateSimpson work to that original row's method work.
 */
type SkyIncidentFallbackObserver = (
	/** Complete attempt, including rejected candidates. */ record: SkyIncidentFallbackRecord,
	/** Row that would be returned on successful batch completion. */ returnedRow: SkyVolumeWorkerRow,
	/** This attempt's omitted-method work and parent execution duration. */ extraWorkForAttempt: SkyIncidentFallbackWork,
	/** Unchanged original unresolved result. */ originalWitness: SkyVolumeResult,
) => void;

/** Explicit unavailable work for a candidate method interrupted before it returns its budget. */
type SkyIncidentFallbackInterruption = Readonly<{
	/** Interrupted attempts cannot be confused with completed admission records. */ schemaId: 'sky-incident-coordinate-interrupted-v1';
	/** Exact unfinished worker task identity. */ id: string;
	/** Original unresolved result JSON identity. */ originalResultSha256: string;
	/** Original geometry JSON identity. */ geometrySha256: string;
	/** Original complete method evidence, never overwritten by the interrupted candidate. */ originalMethods: readonly SkyPhysicalMethodResult[];
	/** Exact caps that governed the interrupted new method. */ remainingCaps: SkyIncidentFallbackRecord['remainingCaps'];
	/** No complete returned method is available. */ candidateSimpson: null;
	/** The method did not expose partial budget counters. */ mediumEvaluations: null;
	/** The method did not expose partial budget counters. */ outerEvaluations: null;
	/** Measured parent time before the method threw. */ mainThreadMilliseconds: number;
	/** Original thrown error text; the thrown identity is preserved separately. */ failure: string;
}>;

/** Retain an unfinished attempt without a guard or exception before the original error is rethrown. */
type SkyIncidentFallbackInterruptionObserver = (
	/** Exact unfinished attempt identity and explicitly unavailable work. */ interruption: SkyIncidentFallbackInterruption,
	/** Original result for bounded witness retention. */ originalWitness: SkyVolumeResult,
) => void;

/** Ordered worker rows plus honest fallback provenance and incremental accounting. */
type SkyIncidentFallbackResult = Readonly<{
	/** Original row objects except for successfully admitted replacements. */ rows: SkyVolumeWorkerRow[];
	/** One compact record for every actual new Simpson attempt. */ records: readonly SkyIncidentFallbackRecord[];
	/** Add to the method work totals in rows; do not add worker elapsed time. */ extraWork: SkyIncidentFallbackWork;
	/** At most eight complete original unresolved results, unchanged. */ originalWitnesses: readonly SkyVolumeResult[];
}>;

/** Manufactured fallback checks or the separately requested eight-witness exercise. */
type SkyIncidentFallbackProof = Readonly<{
	/** Explicit proof scope identity. */ schemaId: string;
	/** Number of successful assertions. */ checks: number;
	/** Actual attempted replacements in this exercise. */ attempted: number;
	/** Actual accepted replacements in this exercise. */ replaced: number;
}>;
