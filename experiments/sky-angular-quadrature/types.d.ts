/** Exact identity of a consumed or retained ordinary file. */
type AngularFileIdentity = {
	/** Normalized repository-relative path. */
	readonly path: string;
	/** Exact encoded byte count. */
	readonly byteLength: number;
	/** Lowercase SHA-256 of the bytes. */
	readonly sha256: string;
};

/** Immutable run outcomes.
 * - **"accepted"** - Execution and its declared acceptance checks passed.
 * - **"rejected"** - Valid execution falsified a declared acceptance check.
 * - **"failed"** - Execution or evidence validation failed.
 * - **"interrupted"** - Execution was stopped before its checks finished.
 */
type AngularRunState = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/** Current storage measurements in bytes. */
type AngularStorage = {
	/** Available bytes on the output filesystem. */
	readonly freeBytes: number;
	/** Total retained evidence including all runs. */
	readonly retainedBytes: number;
	/** Total live reproducible scratch. */
	readonly scratchBytes: number;
};

/** Explicit parent identities and operation for a derived artifact. */
type AngularDerivation = {
	/** Exact input files; source run seals remain immutable. */
	readonly parents: readonly AngularFileIdentity[];
	/** Equation or executable operation. */
	readonly operation: string;
	/** Material parameters used by the operation. */
	readonly parameters?: unknown;
};

/** Retained file together with how it was produced. */
type AngularArtifact = AngularFileIdentity & {
	/** Complete input and operation record. */
	readonly derivation: AngularDerivation;
};

/** Result of removing one verified, experiment-owned scratch directory. */
type AngularCleanup = {
	/** Exact directory verified before recursive deletion. */
	readonly path: string;
	/** Owning immutable run path. */
	readonly owner: string;
	/** Largest measured scratch byte count. */
	readonly highWaterBytes: number;
	/** Whether cleanup completed and the directory is absent. */
	readonly absent: boolean;
};

/** Append-only execution record and exclusive output capability. */
interface AngularRun {
	/** Normalized repository-relative run directory. */
	readonly path: string;
	/** Absolute owned scratch directory, for the isolated browser. */
	readonly scratchPath: string;
	/** Write a new artifact exclusively, after storage and containment checks. */
	write(name: string, value: unknown, derivation?: AngularDerivation): AngularFileIdentity;
	/** Append and flush a monitorable event. */
	progress(phase: string, message: string, completed?: number, total?: number): void;
	/** Check the storage thresholds before further expensive work. */
	guard(): AngularStorage;
	/** Authenticate and delete only this run's declared reproducible scratch. */
	cleanup(): AngularCleanup;
	/** Close all evidence and publish the immutable terminal manifest. */
	finish(state: AngularRunState, result: unknown): AngularFileIdentity;
}

/** Explicit positive solid-angle integration inventory; weights are steradians. */
type AngularRule = {
	/** Stable construction identity. */ readonly id: string;
	/** Physical or explicitly framed unit vectors. */ readonly directions: readonly (readonly number[])[];
	/** Positive solid-angle weights in matching order. */ readonly weights: readonly number[];
	/** Explicit orientation for a refined rule; absent in immutable original rules means their registered dual-frame screen. */ readonly frame?: AngularFrame;
};

/** Physical basis selected before rule evaluation.
 * - **"source"** - Authenticated source-aligned basis.
 * - **"receiver"** - Receiver up and source-facing tangent basis.
 */
type AngularFrame = 'source' | 'receiver';

/** One source-only spectral preview row, with compatible Native15 density spectra. */
type AngularSwatchRow = {
	/** Physical query and stage label. */ readonly label: string;
	/** Baseline/candidate/reference labels in spectrum order. */ readonly names: readonly string[];
	/** Source densities in W m^-3 sr^-1 nm^-1, Native15 channel order. */ readonly spectra: readonly (readonly number[])[];
};

/** Frozen Q0 controls reused by subsequent runs. */
type AngularRegistration = {
	/** Original H33 physical material/source packet. */ readonly input: HorizonMigrationMedium;
	/** Authenticated H33 receiver definitions. */ readonly receivers: readonly HorizonSecondOrderReceiver[];
	/** New candidate inventories before evaluation. */ readonly candidates: readonly AngularRule[];
	/** Exact retained paper build request, distinct from H33. */ readonly paper: SkyBuildRequest;
	/** All original benchmark times and source geometry. */ readonly scenes: readonly SkyScene[];
};

/** Pure incoming N1 field at fixed receiver, shared across outgoing queries. */
type AngularIncidentField = {
	/** Exact physical solid-angle inventory. */ readonly rule: AngularRule;
	/** First-species then spectral radiance for each incoming direction. */ readonly incident: readonly HorizonSecondOrderIncident[];
};

/** One manufactured-field qualification result. */
type AngularManufacturedResult = {
	/** Construction inventory. */ readonly id: string;
	/** Queried outgoing elevation in degrees. */ readonly elevation: number;
	/** Queried azimuth relative to Sun in degrees. */ readonly heading: number;
	/** Source zenith angle in degrees. */ readonly sunZenith: number;
	/** Nonconstant positive manufactured field label. */ readonly field: string;
	/** Rayleigh/Mie weighted integrals. */ readonly values: readonly number[];
	/** Independent refined integrals. */ readonly reference: readonly number[];
	/** Fine/coarse fractional reference changes. */ readonly refinement: readonly number[];
	/** Candidate fractional errors. */ readonly relative: readonly number[];
};

/** Final-view controls; incoming construction lives exclusively in buildRequest. */
type AngularViewControls = Omit<SkyControls, 'incoming'>;
/** GPU capture recipe with explicitly appended horizon witnesses. */
type AngularGpuControl = Omit<SkyGpuControl, 'controls'> & {
	/** Final integration/reconstruction selection, without an incoming-rule default. */ readonly controls: AngularViewControls;
	/** Append nine matched 5m, 14-degree-Sun horizon/upper-control rays. */ readonly horizonWitness: boolean;
};
/** Host boundary for this experiment's compact GPU recipe. */
type AngularGpuHostOptions = Omit<SkyGpuHostOptions, 'control'> & {
	/** Authoritative construction and independent final-view recipe. */ readonly control: AngularGpuControl;
};
/** Compiler report augmented by diagnostic pure-order ray radiances. */
type AngularGpuReport = SkyGpuChannelHeader['compilerReport'] & {
	/** Pure J1-J4 integrated separately through identical view reconstruction, W m^-2 sr^-1 nm^-1. */ readonly pureRaySpectra: readonly (readonly number[])[];
};
/** Per-channel capture header with explicitly owned extra diagnostics. */
type AngularChannelHeader = Omit<SkyGpuChannelHeader, 'compilerReport'> & {
	/** Compiler completion ledger and pure-order ray diagnostics. */ readonly compilerReport: AngularGpuReport;
};

/** Matched scalar values for a diagnostic bar chart. */
type AngularScalarRow = {
	/** Geometry or wavelength label. */ readonly label: string;
	/** Optional baseline radiance density, W m^-2 sr^-1 nm^-1. */ readonly baseline?: number;
	/** Optional candidate radiance density in the same units. */ readonly candidate?: number;
};
/** Registered post-pilot execution allocation. */
type AngularAllocation = {
	/** Aggregate propagation, scoring and verification cap in milliseconds. */ readonly maximumMilliseconds: number;
	/** Per-job deadlines in milliseconds, by declared kind/stage. */ readonly jobs: Readonly<Record<string, number>>;
	/** Explicit independently finer angular inventory. */ readonly refinement: AngularRule;
	/** Frozen full-paper acceptance thresholds in mW m^-2 sr^-1 nm^-1. */ readonly thresholds: Readonly<
		Record<string, number>
	>;
};

/** Authenticated channel artifact and its compact spectra. */
type AngularCapturedChannel = {
	/** Checked GPU transport metadata. */ readonly metadata: AngularCapturedMetadata;
	/** Cumulative-order then scene/X/Y and appended-horizon radiances. */ readonly values: Float64Array;
};
/** Checked channel header and the exact retained binary artifact identity. */
type AngularCapturedMetadata = AngularChannelHeader & {
	/** Exact little-endian binary64 radiance artifact. */ readonly spectra: AngularFileIdentity;
};
/** Immutable completed GPU capture input to the final analysis. */
type AngularCapture = {
	/** Parent run seal identity. */ readonly seal: AngularFileIdentity;
	/** Exact construction and view controls. */ readonly control: AngularGpuControl;
	/** Ordered channel records. */ readonly channels: readonly AngularCapturedChannel[];
};
