/**
 * Ambient contracts owned by this contained experiment.
 */

/**
 * Exact byte identity of an immutable input or generated artifact.
 */
type DomeFileIdentity = {
	/**
	 * Repository-relative path.
	 */
	path: string;

	/**
	 * Exact byte length.
	 */
	bytes: number;

	/**
	 * Lowercase SHA-256 digest.
	 */
	sha256: string;
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
	/**
	 * Experiment-local monotonic run identity.
	 */
	id: string;

	/**
	 * Verified absolute run root.
	 */
	root: string;

	/**
	 * Creates one direct artifact without overwriting prior bytes.
	 *
	 * @param {string} filename - Direct run member to create.
	 * @param {unknown} value - JSON value, UTF-8 text, or encoded bytes.
	 * @returns {void} - Writes the artifact exclusively.
	 */
	write(filename: string, value: unknown): void;

	/**
	 * Appends a flushed progress event.
	 *
	 * @param {string} phase - Current execution phase.
	 * @param {string} message - Observable progress statement.
	 * @param {Record<string, unknown>} [counts] - Optional measured counters.
	 * @returns {void} - Appends one event to the active run.
	 */
	progress(phase: string, message: string, counts?: Record<string, unknown>): void;

	/**
	 * Closes artifacts and publishes one final manifest.
	 *
	 * @param {DomeRunState} state - Terminal disposition for this declared scope.
	 * @param {Record<string, unknown>} summary - Evidence and qualification limits.
	 * @returns {void} - Seals the run against further writes.
	 */
	finish(state: DomeRunState, summary: Record<string, unknown>): void;
};

/**
 * Physical forward-ray interval inside the finite atmospheric cap.
 */
type DomeInterval = {
	/**
	 * Distance to first atmospheric point in meters.
	 */
	entry: number;

	/**
	 * Distance to last atmospheric point in meters.
	 */
	exit: number;

	/**
	 * Exit meets the opaque ground disk.
	 */
	ground: boolean;
};

/**
 * Analytic proof observation with an explicit absolute tolerance.
 */
type DomeProofCheck = {
	/**
	 * Physical identity.
	 */
	name: string;

	/**
	 * Calculated result.
	 */
	actual: number;

	/**
	 * Analytic result.
	 */
	expected: number;

	/**
	 * Absolute difference.
	 */
	error: number;

	/**
	 * Absolute numeric tolerance.
	 */
	tolerance: number;
};

/**
 * Retained outcome of an installed external process.
 */
type DomeProcessResult = {
	/**
	 * Exit code; null when launch failed.
	 */
	code: number | null;

	/**
	 * Raw standard output.
	 */
	stdout: string;

	/**
	 * Raw standard error.
	 */
	stderr: string;

	/**
	 * Optional launch error.
	 */
	error?: string;
};

/**
 * Valid two-center geometry at one altitude and normalized Sun-distance row.
 */
type DomeRowBounds = {
	/**
	 * Horizontal source-subpoint distance in meters.
	 */
	rho: number;

	/**
	 * Smallest reachable cap distance in meters.
	 */
	lower: number;

	/**
	 * Largest reachable cap distance in meters.
	 */
	upper: number;
};

/**
 * Physical node in the canonical reflection half-domain.
 */
type DomeTopologyNode = {
	/**
	 * Physical x,y,z meters.
	 */
	point: number[];

	/**
	 * Shortest sample-to-dome distance in meters.
	 */
	distance: number;
};

/**
 * Ragged storage row with explicit physical boundary support.
 */
type DomeTopologyRow = DomeRowBounds & {
	/**
	 * First owned node.
	 */
	offset: number;

	/**
	 * Number of allocated nodes.
	 */
	count: number;

	/**
	 * Physical altitude in meters.
	 */
	z: number;

	/**
	 * Normalized source-subpoint distance.
	 */
	beta: number;
};

/**
 * Actual valid-node cache layout for a fixed source configuration.
 */
type DomeTopology = {
	/**
	 * Nominal slice count.
	 */
	count: number;

	/**
	 * Source map radius in meters.
	 */
	sourceRadius: number;

	/**
	 * Frozen source-distance row count.
	 */
	betaCount: number;

	/**
	 * Physical altitude nodes in meters.
	 */
	altitudes: number[];

	/**
	 * Complete allocated physical nodes.
	 */
	nodes: DomeTopologyNode[];

	/**
	 * Row ownership in altitude-major order.
	 */
	rows: DomeTopologyRow[];

	/**
	 * Allocated nodes added for valid-domain boundary support.
	 */
	boundarySupportNodes: number;
};

/**
 * Angular quadrature direction and exact reflection addressing.
 */
type DomeDirection = {
	/**
	 * Unit physical direction.
	 */
	vector: number[];

	/**
	 * Solid-angle weight in steradians.
	 */
	weight: number;

	/**
	 * Index under y-axis reflection.
	 */
	mirror: number;
};

/**
 * Shared physical ray used for cache and independent-guide comparisons.
 */
type DomeCase = {
	/**
	 * Stable physical case identity.
	 */
	id: string;

	/**
	 * Source map radius in meters.
	 */
	sourceRadius: number;

	/**
	 * Origin altitude in meters.
	 */
	altitude: number;

	/**
	 * Fraction of maximum cap clearance.
	 */
	fraction: number;

	/**
	 * Origin cap clearance in meters.
	 */
	distance: number;

	/**
	 * Physical world origin in meters.
	 */
	origin: number[];

	/**
	 * Unit view direction.
	 */
	direction: number[];

	/**
	 * Atmospheric entry distance in meters.
	 */
	entry: number;

	/**
	 * Atmospheric exit distance in meters.
	 */
	end: number;

	/**
	 * Human-readable viewing direction.
	 */
	view: string;
};

/**
 * Pure mathematical Gauss-Legendre rule on the unit interval.
 */
type SkyDirectRule = {
	/**
	 * Quadrature abscissae.
	 */
	nodes: number[];

	/**
	 * Positive integration weights.
	 */
	weights: number[];
};

/**
 * Generated deterministic cache-construction and view-reconstruction shaders.
 */
type DomeShaderSources = {
	/**
	 * Builds one pure higher-order source-function field.
	 */
	build: string;

	/**
	 * Reconstructs first through fourth order radiance for common rays.
	 */
	view: string;
};

/**
 * Explicit serializable physical inputs for actual GPU construction.
 */
type DomeGpuRequest = {
	/**
	 * Deterministic build and query sources.
	 */
	shaders: DomeShaderSources;

	/**
	 * Frozen angular direction count.
	 */
	directionCount: number;

	/**
	 * Independent physical configurations and cold-field builds.
	 */
	datasets: {
		/**
		 * Unique build/replicate label.
		 */
		label?: string;

		/**
		 * Valid-domain position grid.
		 */
		layout: DomeTopology;

		/**
		 * Common physical rays for reconstruction.
		 */
		cases: DomeCase[];
	}[];
};

/**
 * Physical color and one explicitly exposed display representation.
 */
type DomeColor = {
	/**
	 * CIE1931 radiant XYZ integrated over the selected bins.
	 */
	xyz: number[];

	/**
	 * Photopic luminance in cd m^-2.
	 */
	luminance: number;

	/**
	 * Common-exposure linear sRGB.
	 */
	linear: number[];

	/**
	 * Displayed eight-bit sRGB.
	 */
	rgb: number[];

	/**
	 * CIELab under the fixed common D65 display white.
	 */
	lab: number[];

	/**
	 * True when display clipping or gamut exclusion occurred.
	 */
	clipped: boolean;
};

/**
 * Independent channel observation with retained scattering-order batches.
 */
type DomeReferenceRow = {
	id: string;
	channel: number;
	pureOrders: number[];
	total: number;
	totalHalfWidth95: number;
	orderBatches: number[][];
};

/**
 * Candidate's physical ray reconstruction in pure orders one through four.
 */
type DomeCachedRay = {
	id: string;
	orders: number[][];
};

/**
 * Radiometric discrepancy and the independently measured sampling resolution.
 */
type DomeOrderError = {
	absolute: number;
	relative: number;
	dark: boolean;
	referenceIntegrated: number;
	integratedHalf95: number;
	conservativeBandHalf95: number;
	relativeHalf95: number;
};

/**
 * Matched cache/probe physical spectra with pure-order and color differences.
 */
type DomeComparison = {
	id: string;
	spectra: number[][];
	perOrder: DomeOrderError[];
	integratedAbsolute: number;
	relativeSpectral: number;
	luminanceRelative: number;
	deltaE76: number;
	colors: DomeColor[];
};

/**
 * Equal-case distribution statistics; vacuum cases are reported separately.
 */
type DomeAccuracySummary = {
	cases: number;
	nonDark: number;
	dark: number;
	spectral: DomeDistribution;
	absolute: DomeDistribution;
	luminance: DomeDistribution;
	deltaE76: DomeDistribution;
	uncertainty: DomeDistribution;
	conservativeBandUncertainty: DomeDistribution;
	pureOrders: DomeDistribution[];
	worst: {id: string; relative: number; uncertainty: number} | null;
};

/**
 * Nearest-rank summary of finite observations.
 */
type DomeDistribution = {
	median: number;
	p95: number;
	maximum: number;
};
