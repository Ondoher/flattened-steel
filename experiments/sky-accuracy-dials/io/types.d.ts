/** Exact identity of a consumed or retained ordinary file. */
type DialFileIdentity = {
	/** Normalized repository-relative path. */
	path: string;
	/** Exact encoded byte count. */
	byteLength: number;
	/** Lowercase SHA-256 of the bytes. */
	sha256: string;
};

/** Immutable run outcomes.
 * - **"accepted"** - Execution and its declared acceptance checks passed.
 * - **"rejected"** - Valid execution falsified a declared acceptance check.
 * - **"failed"** - Execution or evidence validation failed.
 * - **"interrupted"** - Execution was stopped before its checks finished.
 */
type DialRunState = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/** Current storage measurements in bytes. */
type DialStorage = {
	/** Available bytes on the output filesystem. */
	freeBytes: number;
	/** Total retained evidence including all runs. */
	retainedBytes: number;
	/** Total live reproducible scratch. */
	scratchBytes: number;
};

/** Explicit parent identities and operation for a derived artifact. */
type DialDerivation = {
	/** Exact input files; source run seals remain immutable. */
	parents: DialFileIdentity[];
	/** Equation or executable operation. */
	operation: string;
	/** Material parameters used by the operation. */
	parameters?: unknown;
};

/** Retained file together with how it was produced. */
type DialArtifact = DialFileIdentity & {
	/** Complete input and operation record. */
	derivation: DialDerivation;
};

/** Result of removing one verified, experiment-owned scratch directory. */
type DialCleanup = {
	/** Exact directory verified before recursive deletion. */
	path: string;
	/** Owning immutable run path. */
	owner: string;
	/** Largest measured scratch byte count. */
	highWaterBytes: number;
	/** Whether cleanup completed and the directory is absent. */
	absent: boolean;
};

/** Append-only execution record and exclusive output capability. */
interface DialRun {
	/** Normalized repository-relative run directory. */
	readonly path: string;
	/** Absolute owned scratch directory, for the isolated browser. */
	readonly scratchPath: string;
	/** Write a new artifact exclusively, after storage and containment checks. */
	write(name: string, value: unknown, derivation?: DialDerivation): DialFileIdentity;
	/** Append and flush a monitorable event. */
	progress(phase: string, message: string, completed?: number, total?: number): void;
	/** Check the storage thresholds before further expensive work. */
	guard(): DialStorage;
	/** Authenticate and delete only this run's declared reproducible scratch. */
	cleanup(): DialCleanup;
	/** Close all evidence and publish the immutable terminal manifest. */
	finish(state: DialRunState, result: unknown): DialFileIdentity;
}
