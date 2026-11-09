/**
 * Cache generation choices used by both the deployment fingerprint and actual compiler invocation.
 */
type GlobeCacheBuildSettings = {
	/**
	 * Selected radial integration policy, currently anchored-radial.
	 */
	numericalPolicy: string;
	/**
	 * Selected interpolation between solar scenes.
	 */
	solarInterpolation: string;
	/**
	 * Selected transport/scattering approximation.
	 */
	scatteringAccuracy: string;
	/**
	 * Required observer-height coverage in meters above the ground.
	 */
	maximumObserverAltitudeMeters: number;
};

/**
 * Identity of one source file or control-metadata file, without cache payload data.
 */
type GlobeCacheInputFile = {
	/**
	 * Repository-relative source path or control-root-relative metadata path.
	 */
	path: string;
	/**
	 * SHA-256 of source text with LF line endings, or exact control bytes.
	 */
	sha256: string;
	/**
	 * Exact byte length for a control file; source text identities omit it.
	 */
	byteLength?: number;
};

/**
 * Portable cache input record carried separately from the immutable compiler run.
 */
type GlobeCacheInputRecord = {
	/**
	 * SHA-256 of the other fields in their documented stable serialization order.
	 */
	fingerprint: string;
	/**
	 * Identity schema revision.
	 */
	schema: string;
	/**
	 * Selected compiler settings.
	 */
	settings: GlobeCacheBuildSettings;
	/**
	 * Sorted exact control-file identities, excluding archive-container and provenance-only details.
	 */
	controls: GlobeCacheInputFile[];
	/**
	 * Sorted normalized engine/compiler/deployment-source identities.
	 */
	sources: GlobeCacheInputFile[];
};

/**
 * Compiler-result fields consumed by deployment, with an optional portable input fingerprint.
 * The original compiler's additional provenance fields remain in the serialized receipt.
 */
type GlobeCacheBuildReceipt = {
	/**
	 * Whether the underlying compiler accepted the completed package.
	 */
	accepted: boolean;
	/**
	 * Repository-relative published package location in its sealed run.
	 */
	publishedRoot: string;
	/**
	 * Generated package identity.
	 */
	packageSetIdentity: string;
	/**
	 * Exact package-set report SHA-256.
	 */
	packageSetSha256: string;
	/**
	 * Portable desired-input identity, absent on older builds.
	 */
	inputFingerprint?: string;
	/**
	 * Source/control/settings identities used to derive the fingerprint.
	 */
	cacheInputs?: GlobeCacheInputRecord;
};

/**
 * Cache reuse decision for this checkout.
 * - **"unchanged"** - Recorded inputs match and package files are available.
 * - **"changed"** - Current cache inputs differ from the recorded build.
 * - **"missing"** - A recorded package is absent or incomplete.
 * - **"unrecorded"** - No usable input record establishes compatibility.
 */
type GlobeCacheReuseState = 'unchanged' | 'changed' | 'missing' | 'unrecorded';

/**
 * Lightweight deployment check; cache block contents are not rehashed.
 */
type GlobeCacheReuseStatus = {
	/**
	 * Current checkout's desired cache input identity.
	 */
	fingerprint: string;
	/**
	 * Whether this checks an installed package instead of local build output.
	 */
	installed: boolean;
	/**
	 * Decision and reason category.
	 */
	state: GlobeCacheReuseState;
	/**
	 * Whether the available package can be reused for the current inputs.
	 */
	reusable: boolean;
	/**
	 * Whether recorded inputs match; null when no usable record exists.
	 */
	inputsMatch: boolean | null;
	/**
	 * Operator-facing explanation.
	 */
	reason: string;
	/**
	 * Known package identity, when recorded.
	 */
	packageSetIdentity?: string;
	/**
	 * Local or transferred source-run package location, when recorded.
	 */
	publishedRoot?: string;
	/**
	 * Whether a matching installed package needs its server selection reapplied.
	 */
	activationRequired?: boolean;
};
