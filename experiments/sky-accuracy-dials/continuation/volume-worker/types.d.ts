import type {Worker} from 'node:worker_threads';

declare global {
	/** One independently evaluated physical ray; identities are unique within a batch. */
	type SkyVolumeWorkerTask = Readonly<{
		/** Caller-owned nonempty ray identity. */ id: string;
		/** Receiver position in metres. */ origin: SkyVector3;
		/** Unit look direction toward arriving radiance. */ direction: SkyVector3;
	}>;

	/** One complete result; numerical admission is unchanged by scheduling. */
	type SkyVolumeWorkerRow = Readonly<{
		/** Exact caller task identity. */ id: string;
		/** Unmodified independent volume result, including unresolved outcomes. */ result: SkyVolumeResult;
		/** Worker evaluation wall time in milliseconds, excluding queue and startup time. */ elapsedMilliseconds: number;
	}>;

	/** Fixed worker and caller resource controls for the entire pool lifetime. */
	type SkyVolumeWorkerOptions = Readonly<{
		/** Integer number of workers, from one through four. */ workerCount: number;
		/** Absolute finite future deadline, in Unix epoch milliseconds. */ deadlineEpochMilliseconds: number;
		/** Synchronous caller heartbeat/resource guard; thrown identity cancels the pool. */ guard: () => void;
		/** Arrival notification only; count starts at one in each batch, never a numerical reduction. */ onComplete?: (
			completedCount: number,
			id: string,
		) => void;
	}>;

	/** Bounded reusable executor; caller owns source authentication, evidence and accounting. */
	type SkyVolumeWorkerPool = Readonly<{
		/** Evaluate zero through 4096 unique rays in exact caller order; concurrent batches reject. */ evaluate: (
			tasks: readonly SkyVolumeWorkerTask[],
		) => Promise<SkyVolumeWorkerRow[]>;
		/** Idempotently cancel pending work and terminate/join every worker. */ close: () => Promise<void>;
	}>;

	/** Structured-cloned immutable configuration supplied to each worker once. */
	type SkyVolumeWorkerData = Readonly<{
		/** Fixed physical input. */ spec: SkyTransportSpec;
		/** Fixed spectral channel order. */ channels: readonly number[];
		/** Shared absolute execution cutoff. */ deadlineEpochMilliseconds: number;
	}>;

	/** One outstanding task per worker, addressed by its caller array position. */
	type SkyVolumeWorkerRequest = Readonly<{
		/** Position in the active batch. */ index: number;
		/** Independently evaluated physical ray. */ task: SkyVolumeWorkerTask;
	}>;

	/** Successful worker reply; execution failures use the worker error event. */
	type SkyVolumeWorkerReply = Readonly<{
		/** Unchanged batch position. */ index: number;
		/** Complete physical result. */ row: SkyVolumeWorkerRow;
	}>;

	/** Mutable main-thread scheduling state for one worker. */
	type SkyVolumeWorkerSlot = {
		/** Owned Node thread. */ worker: Worker;
		/** Outstanding batch position, or null when idle. */ index: number | null;
	};

	/** Mutable scheduling state; null result slots cannot escape as fabricated values. */
	type SkyVolumeWorkerBatch = {
		/** Private copies immune to caller mutation. */ tasks: readonly SkyVolumeWorkerTask[];
		/** Indexed completed results. */ rows: (SkyVolumeWorkerRow | null)[];
		/** Next unassigned position. */ next: number;
		/** Actual completed result count. */ completed: number;
		/** Promise completion after the entire ordered batch exists. */ resolve: (rows: SkyVolumeWorkerRow[]) => void;
		/** Promise failure after all workers have joined; preserves the original thrown value. */ reject: (
			error: unknown,
		) => void;
	};

	/** Local in-memory proof outcome, never sealed scientific evidence. */
	type SkyVolumeWorkerProof = Readonly<{
		/** Versioned focused proof identity. */ schemaId: string;
		/** Original immutable sequential incident source. */ pilotSeal: DialFileIdentity;
		/** Selected original incident addresses, in requested order. */ selectedIds: readonly string[];
		/** Actual exact comparisons and lifecycle assertions. */ checks: number;
		/** Monotonic local proof wall time in milliseconds. */ elapsedMilliseconds: number;
	}>;

	/** Every numerical/work diagnostic, with nondeterministic pass timing removed. */
	type SkyVolumeWorkerComparableMethod = Omit<SkyPhysicalMethodResult, 'passes'> & {
		/** Original tolerance-pass diagnostics except elapsed wall time. */ passes: Omit<
			SkyPhysicalPassDiagnostics,
			'elapsedMilliseconds'
		>[];
	};

	/** Minimal authenticated pilot seal fields consumed by the focused local proof. */
	type SkyVolumeWorkerPilotSeal = Readonly<{
		/** Original execution outcome. */ state: string;
		/** Exact artifact identities verified before decoding. */ artifacts: readonly DialFileIdentity[];
	}>;
}
