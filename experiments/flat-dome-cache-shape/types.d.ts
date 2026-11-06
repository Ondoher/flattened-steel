/**
 * Ambient contracts owned by this contained experiment.
 */

/**
 * Exact byte identity of an immutable input or generated artifact.
 */
type DomeFileIdentity = {
	/** Repository-relative path. */ path: string;
	/** Exact byte length. */ bytes: number;
	/** Lowercase SHA-256 digest. */ sha256: string;
};

/**
 * Terminal evidence disposition.
 * - **"accepted"** - Declared checks passed for the stated scope.
 * - **"rejected"** - A scientific candidate failed its stated question.
 * - **"failed"** - Operational or implementation failure.
 * - **"interrupted"** - Execution ended before its question was answered.
 */
type DomeRunState = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/**
 * Writer for one new evidence run, permanently closed by finish.
 */
type DomeRun = {
	/** Experiment-local monotonic run identity. */ id: string;
	/** Verified absolute run root. */ root: string;
	/** Creates one direct artifact without overwriting prior bytes. */
	write(filename: string, value: unknown): void;
	/** Appends a flushed progress event. */
	progress(phase: string, message: string, counts?: Record<string, unknown>): void;
	/** Closes artifacts and publishes one final manifest. */
	finish(state: DomeRunState, summary: Record<string, unknown>): void;
};

/**
 * Physical forward-ray interval inside the finite atmospheric cap.
 */
type DomeInterval = {
	/** Distance to first atmospheric point in meters. */ entry: number;
	/** Distance to last atmospheric point in meters. */ exit: number;
	/** Exit meets the opaque ground disk. */ ground: boolean;
};

/**
 * Analytic proof observation with an explicit absolute tolerance.
 */
type DomeProofCheck = {
	/** Physical identity. */ name: string;
	/** Calculated result. */ actual: number;
	/** Analytic result. */ expected: number;
	/** Absolute difference. */ error: number;
	/** Absolute numeric tolerance. */ tolerance: number;
};

/**
 * Retained outcome of an installed external process.
 */
type DomeProcessResult = {
	/** Exit code; null when launch failed. */ code: number | null;
	/** Raw standard output. */ stdout: string;
	/** Raw standard error. */ stderr: string;
	/** Optional launch error. */ error?: string;
};

/**
 * Valid two-center geometry at one altitude and normalized Sun-distance row.
 */
type DomeRowBounds = {
	/** Horizontal source-subpoint distance in meters. */ rho: number;
	/** Smallest reachable cap distance in meters. */ lower: number;
	/** Largest reachable cap distance in meters. */ upper: number;
};

/**
 * Physical node in the canonical reflection half-domain.
 */
type DomeTopologyNode = {
	/** Physical x,y,z meters. */ point: number[];
	/** Shortest sample-to-dome distance in meters. */ distance: number;
};

/**
 * Ragged storage row with explicit physical boundary support.
 */
type DomeTopologyRow = DomeRowBounds & {
	/** First owned node. */ offset: number;
	/** Number of allocated nodes. */ count: number;
	/** Physical altitude in meters. */ z: number;
	/** Normalized source-subpoint distance. */ beta: number;
};

/**
 * Actual valid-node cache layout for a fixed source configuration.
 */
type DomeTopology = {
	/** Nominal slice count. */ count: number;
	/** Source map radius in meters. */ sourceRadius: number;
	/** Frozen source-distance row count. */ betaCount: number;
	/** Physical altitude nodes in meters. */ altitudes: number[];
	/** Complete allocated physical nodes. */ nodes: DomeTopologyNode[];
	/** Row ownership in altitude-major order. */ rows: DomeTopologyRow[];
	/** Allocated nodes added for valid-domain boundary support. */ boundarySupportNodes: number;
};

/**
 * Angular quadrature direction and exact reflection addressing.
 */
type DomeDirection = {
	/** Unit physical direction. */ vector: number[];
	/** Solid-angle weight in steradians. */ weight: number;
	/** Index under y-axis reflection. */ mirror: number;
};

/**
 * Shared physical ray used for cache and independent-guide comparisons.
 */
type DomeCase = {
	/** Stable physical case identity. */ id: string;
	/** Source map radius in meters. */ sourceRadius: number;
	/** Origin altitude in meters. */ altitude: number;
	/** Fraction of maximum cap clearance. */ fraction: number;
	/** Origin cap clearance in meters. */ distance: number;
	/** Physical world origin in meters. */ origin: number[];
	/** Unit view direction. */ direction: number[];
	/** Atmospheric entry distance in meters. */ entry: number;
	/** Atmospheric exit distance in meters. */ end: number;
	/** Human-readable viewing direction. */ view: string;
};

/**
 * Pure mathematical Gauss-Legendre rule on the unit interval.
 */
type SkyDirectRule = {
	/** Quadrature abscissae. */ nodes: number[];
	/** Positive integration weights. */ weights: number[];
};
