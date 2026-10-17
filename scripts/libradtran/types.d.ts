/** Explicit existing WSL installation; all properties are readonly run inputs. */
type LibradtranInstallation = {
	/** Registered WSL distribution name. */
	readonly distribution: string;
	/** Nonprivileged Linux account owning the existing installation. */
	readonly user: string;
	/** Absolute Windows WSL launcher path. */
	readonly wslExecutable: string;
	/** Absolute Linux uvspec executable path. */
	readonly executable: string;
	/** Absolute Linux solver data directory, read without modification. */
	readonly dataDirectory: string;
	/** Required version text returned by uvspec -v. */
	readonly expectedVersion: string;
	/** Required lowercase executable SHA-256 from build provenance. */
	readonly expectedSha256: string;
};

/** Supported commands.
 * - **"doctor"** - Verify the solver and record its data identity.
 * - **"smoke"** - Execute the bundled three-wavelength radiance check.
 * - **"run"** - Execute an owner-authored case bundle.
 */
type LibradtranCommand = 'doctor' | 'smoke' | 'run';

/** Immutable CLI ingress after argument validation. */
type LibradtranOptions = {
	/** Requested operation. */
	readonly command: LibradtranCommand;
	/** Absolute existing installation JSON path. */
	readonly installationPath: string;
	/** Absolute source case directory; null for doctor. */
	readonly caseDirectory: string | null;
	/** Solver execution limit in seconds; independent of launch/data setup. */
	readonly timeoutSeconds: number;
};

/** Trusted repository-authored scientific configuration; no field certifies accuracy or sandboxing. */
type LibradtranCase = {
	/** Scientific question or operational check. */
	readonly purpose: string;
	/** Declared geometry and known solver approximations. */
	readonly geometry: string;
	/** Physical meaning and column layout of raw solver stdout. */
	readonly quantity: string;
	/** Units for each declared output quantity. */
	readonly units: string;
	/** Known exclusions, unmatched inputs and unqualified accuracy claims. */
	readonly limitations: readonly string[];
};

/** Retained source-file identity before execution. */
type LibradtranFile = {
	/** Run-relative path with forward slashes. */
	readonly path: string;
	/** Exact retained file length in bytes. */
	readonly bytes: number;
	/** Lowercase SHA-256 of retained bytes. */
	readonly sha256: string;
};

/** Host-owned request consumed by the copied Linux worker. */
type LibradtranRequest = {
	/** Versioned command/evidence contract. */
	readonly schema: string;
	/** Requested operation. */
	readonly command: LibradtranCommand;
	/** Existing solver configuration captured before launch. */
	readonly installation: LibradtranInstallation;
	/** Linux path to this fresh run directory. */
	readonly runDirectory: string;
	/** Complete original source files and copied worker identities. */
	readonly inputs: readonly LibradtranFile[];
	/** Case metadata; null for doctor. */
	readonly case: LibradtranCase | null;
	/** Solver execution limit in seconds. */
	readonly timeoutSeconds: number;
	/** Windows command arguments, including distribution and account. */
	readonly launchArguments: readonly string[];
	/** Original source case location, retained only as provenance. */
	readonly sourceCase: string | null;
};

/** Shared context of one maintained proof invocation. */
type LibradtranProofContext = {
	/** Script-derived repository root. */
	readonly repository: string;
	/** Fresh ignored directory owning all fixtures and proof results. */
	readonly directory: string;
	/** Existing installation selected for the real integration checks. */
	readonly installation: LibradtranInstallation;
};

/** Captured subprocess observation; owned by one verification record. */
type LibradtranProofObservation = {
	/** Human-readable behavioral assertion name. */
	readonly name: string;
	/** CLI arguments following its script path. */
	readonly argumentsList: readonly string[];
	/** Process exit status; null when terminated without normal exit. */
	readonly status: number | null;
	/** Captured stdout, including the allocated run location. */
	readonly stdout: string;
	/** Captured diagnostic stderr. */
	readonly stderr: string;
	/** Allocated run path, or null for an ingress rejection before allocation. */
	readonly runDirectory: string | null;
	/** End-to-end host duration in milliseconds. */
	readonly elapsedMilliseconds: number;
};

/** Final worker execution disposition.
 * - **"failed"** - Execution or identity qualification failed.
 * - **"succeeded"** - Execution checks passed; physical accuracy remains unqualified.
 */
type LibradtranRunStatus = 'failed' | 'succeeded';

/** Captured worker failure diagnostic. */
type LibradtranFailure = {
	/** Python exception class name. */
	readonly type: string;
	/** Human-readable cause and recovery context. */
	readonly message: string;
};

/** Operational smoke observation, not an accuracy score. */
type LibradtranSmokeCheck = {
	/** Declared operational assertion. */
	readonly check: string;
	/** Wavelength/radiance rows retained in raw solver units. */
	readonly rows: readonly (readonly number[])[];
	/** Explicitly false physical-accuracy qualification. */
	readonly accuracyQualified: false;
};

/** Worker evidence fields consumed by the maintained verifier. */
type LibradtranResult = {
	/** Final execution disposition. */
	readonly status: LibradtranRunStatus;
	/** Explicitly false scientific-accuracy qualification. */
	readonly accuracyQualified: false;
	/** Diagnostic present for a failed worker record. */
	readonly error?: LibradtranFailure;
	/** Operational controls present for a successful smoke command. */
	readonly smoke?: LibradtranSmokeCheck;
	/** Complete worker-retained artifact identities before host receipt finalization. */
	readonly artifacts: readonly LibradtranFile[];
};
