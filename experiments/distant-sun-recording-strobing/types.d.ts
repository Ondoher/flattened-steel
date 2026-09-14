/** Ambient contracts owned by the distant-Sun recording strobing experiment. */

/** Terminal disposition of an immutable evidence run.
 * - **"accepted"** - The declared run-specific proof passed.
 * - **"rejected"** - The candidate failed its acceptance question.
 * - **"failed"** - Execution could not complete.
 * - **"interrupted"** - Execution stopped before completion.
 */
type StrobingTerminalState = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/** Flushed activity event for a monitorable experiment operation. */
type StrobingProgress = {
	/** Current operation phase. */
	phase: string;
	/** Description of current work. */
	message: string;
	/** Completed work items, when countable. */
	completed?: number;
	/** Total work items, when countable. */
	total?: number;
	/** Terminal disposition, present only at completion. */
	state?: StrobingTerminalState;
};

/** Exact byte identity relative to the declared source or run root. */
type StrobingFileIdentity = {
	/** Normalized root-relative file path. */
	path: string;
	/** Exact byte length. */
	byteLength: number;
	/** SHA-256 of the file bytes. */
	sha256: string;
};

/** Complete ordered identity of a run's evidence files. */
type StrobingArtifactSet = {
	/** Individually authenticated artifacts in deterministic path order. */
	artifacts: StrobingFileIdentity[];
	/** SHA-256 of JSON.stringify(artifacts). */
	artifactSetSha256: string;
};

/** Retained historical manifest, inspected without changing its source. */
type StrobingParentManifest = StrobingArtifactSet & {
	/** Parent acceptance state. */
	state: StrobingTerminalState;
	/** Parent-relative operational paths excluded from evidence. */
	excludedPaths: string[];
};

/** Selected fields from one original deterministic film state. */
type StrobingParentFrame = {
	/** Position on the original sixty-second choreography. */
	animationSeconds: number;
	/** Original UTC observation time. */
	instant: string;
	/** Continuous astronomical solar zenith, in degrees. */
	solarZenithDegrees: number;
	/** Original published cache identity. */
	cacheIdentity: string;
	/** Whether the original run published a cache transition. */
	modeChanged: boolean;
	/** Retained camera configuration. */
	camera: Record<string, unknown>;
};

/** Original film score consumed as immutable control input. */
type StrobingParentTrace = {
	/** Seed for deterministic scene geometry. */
	seed: number;
	/** Original ordered frame states. */
	frames: StrobingParentFrame[];
};
/** Region display-code statistics from one decoded RGB frame. */
type StrobingPixelRegion = {
	/** Mean red display code in the region. */ meanRed: number;
	/** Mean green display code in the region. */ meanGreen: number;
	/** Mean blue display code in the region. */ meanBlue: number;
	/** Rec.709-weighted display-code mean, not physical luminance. */ meanLuma: number;
	/** Mean absolute RGB change from the preceding frame. */ adjacentRgbMeanAbsolute: number | null;
	/** Centered mean absolute RGB curvature at the preceding frame. */ previousFrameRgbCurvature: number | null;
};

/** Ordered measurements for one decoded frame. */
type StrobingPixelFrame = {
	/** Zero-based presentation index. */ frameIndex: number;
	/** Measurements in the four pinned masks. */ regions: Record<string, StrobingPixelRegion>;
};

/** Cache identity fields needed to align source and decoded traces. */
type StrobingMeasuredSceneFrame = {
	/** Original choreography time in seconds. */ animationSeconds: number;
	/** Exact astronomical zenith in degrees. */ solarZenithDegrees: number;
	/** Original dense-cache identity when shared state is absent. */ cacheIdentity: string;
	/** Published current shared scene ordinal, or dark state. */ sharedScene?: string | null;
};

/** One ranked temporal curvature event. */
type StrobingTemporalEvent = {
	/** Center presentation frame. */ index: number;
	/** Center regional mean display-code luma. */ luma: number;
	/** Signed preceding difference. */ incoming: number;
	/** Signed following difference. */ outgoing: number;
	/** Whether the two signed differences reverse direction. */ reversal: boolean;
	/** Absolute second difference. */ curvature: number;
	/** Whether either adjacent interval publishes a new cache scene. */ cacheAdjacent: boolean;
	/** Centered RGB mean absolute second difference. */ rgbCurvature: number;
};

/** Complete cache-boundary temporal gate for four image masks. */
type StrobingTemporalResult = {
	/** Frames publishing a changed scene. */ boundaries: number[];
	/** Region-specific measurements and acceptance. */ regions: Record<
		string,
		{
			/** Mean boundary temporal curvature. */ boundaryMean: number;
			/** Mean stable temporal curvature. */ stableMean: number;
			/** Boundary mean divided by stable mean. */ ratio: number;
			/** Highest ranked curvature events. */ strongest: StrobingTemporalEvent[];
			/** Reversing cache-adjacent events among the strongest. */ reversingBoundaryPeaks: number;
			/** Distinct cache publications producing those extrema; a pulse's two sides count once. */ reversingPublications: number[];
			/** Fraction of eligible frames adjacent to cache publication. */ boundaryFraction: number;
			/** Whether the pinned quantitative and recurring-peak gates pass. */ pass: boolean;
		}
	>;
	/** Whether every region passes. */ pass: boolean;
};
/** Shutdown capability for the experiment-owned loopback server. */
interface StrobingServerHandle {
	/** Close active connections and release the listener. */ close(): Promise<void>;
}
/** Existing physical compiler request with one explicit experiment numerical parameter. */
type StrobingCompilerBuildRequest = DistantSunSceneCacheCompilerBuildRequest & {
	/** Original transport specification plus the declared surface-limit evaluation. */
	transportSpec: DistantSunSceneCacheCompilerBuildRequest['transportSpec'] & {
		/** Unchanged recurrence accuracy parameters and experiment surface limit. */
		numerical: DistantSunSceneCacheCompilerBuildRequest['transportSpec']['numerical'] & {
			/** Positive metre height at which the logical ground row's one-sided limit is evaluated. */
			surfaceLimitMeters: number;
		};
	};
};
/** Authenticated experiment run included in the final evidence index. */
type StrobingIndexedRun = {
	/** Sequential immutable run identifier. */ id: string;
	/** Terminal execution outcome, distinct from the scientific gate outcome. */ state: StrobingTerminalState;
	/** Complete included-artifact identity. */ artifactSetSha256: string;
	/** Recorded operation result; individual gate booleans remain explicit. */ result: Record<string, unknown>;
	/** Retained MP4 artifacts, including rejected-candidate diagnostics. */ videos: StrobingFileIdentity[];
	/** Parent manifest identity. */ manifest: StrobingFileIdentity;
};
/** Narrow controller collaborators consumed by the contained interpolation policy. */
type StrobingCubicController = {
	/** Admitted packet atlas layer count. */ _layers: number;
	/** Declared deterministic scene route. */ _route: number[];
	/** Authenticated immutable scene block inventory. */ _graph: DistantSunSharedCachePackageGraph;
};

/** Frozen bundle derivative and its controller installation source. */
type StrobingBundlePatch = {
	/** Complete derivative bundle, served only in the contained page. */ source: string;
	/** Exact installation source included in capture provenance. */ injection: string;
};

/** Complete required cubic residency window. */
type StrobingCubicWindow = {
	/** Ordered unique block identities required by the interpolation stencil. */ ids: string[];
	/** No speculative scene is selected by this policy; the value is -1. */ predicted: number;
};

/** Canonical frame wrapper shared by capture analysis and annotation consumers. */
type StrobingSceneTrace = {
	/** Deterministic ordered scene observations. */ frames: StrobingMeasuredSceneFrame[];
};

/** Recorded terminal operation payload used by the evidence index. */
type StrobingRunResult = {
	/** Operation-specific facts, including scientific gates independently of execution state. */ result: Record<
		string,
		unknown
	>;
};

/** Original evidence authority authenticated before implementation. */
type StrobingPinnedParent = {
	/** Repository-relative immutable source run directory. */ sourceRoot: string;
	/** Complete original artifact manifest with its exact included inventory. */ manifest: StrobingParentManifest;
};
/** Contained physical-to-display response selection.
 * - **"original-p9"** - Unchanged production Color Reset response.
 * - **"monotone-p2"** - Broader sunset gain with a positive proportional-light response slope.
 * - **"no-sunset-boost"** - Causal ablation removing only the sunset gain amplitude.
 */
type StrobingColorResponse = 'original-p9' | 'monotone-p2' | 'no-sunset-boost';

/** Frozen bundle and explicit derivation returned by the contained color patch. */
type StrobingColorPatchResult = {
	/** Bundle text after the selected constants substitution. */ source: string;
	/** Human-readable operation with original and replacement constants. */ description: string;
};

/** Read-only gain operations exposed by the selected native Color Reset model. */
interface StrobingColorDiagnostics {
	/** Inspect the exact pre-tone-map gain for physical receiver illuminance. */
	displayGain(illuminance: UnitValue): number;
	/** Inspect d(log gain)/d(log illuminance) for the same physical input. */
	displayGainLogElasticity(illuminance: UnitValue): number;
}

/** Native model inspection used only by the contained analytic proof. */
interface StrobingColorProofModel extends StrobingColorDiagnostics {
	/** Read-only material curve constants from the derived native model. */
	readonly curve: ColorResetSlope078P9Curve;
	/** Inspect the generated shader without creating or mutating a renderer. */
	_displayEncodeBlock(): string;
}

/** Display-code excursion against the expected direction of daylight change. */
type StrobingHorizonResult = {
	/** Every retained complete horizon window meets the sky gate. */ pass: boolean;
	/** Allowed upper-sky excursion on the 0-255 mean display-code scale. */ maximumUpperExcursion: number;
	/** Individual sunrise or sunset measurements. */ windows: StrobingHorizonWindow[];
};

/** One complete horizon crossing measured independently of cache-publication events. */
type StrobingHorizonWindow = {
	/** Original score's morning/evening interval. */ name: string;
	/** Retained frames spanning solar zenith 89.5-91.5 degrees. */ frameCount: number;
	/** Regional directional excursion and single-frame step. */ regions: Record<string, StrobingHorizonExcursion>;
	/** Upper sky has no excursion exceeding the declared one-code allowance. */ pass: boolean;
};

/** Wrong-direction display brightness changes in one retained image region. */
type StrobingHorizonExcursion = {
	/** Largest accumulated wrong-direction change from a preceding extremum. */ excursion: number;
	/** Largest wrong-direction change between adjacent frames. */ maximumOpposingStep: number;
};

/** Minimal authenticated horizon proof index consumed by animation delivery. */
type StrobingHorizonEvidence = {
	/** Ordered sunset-control, ablation, selected sunset, and selected sunrise records. */ records: {
		/** Sealed source capture run identity. */ captureId: string;
		/** Sealed three-path analysis run identity. */ analysisId: string;
	}[];
};
