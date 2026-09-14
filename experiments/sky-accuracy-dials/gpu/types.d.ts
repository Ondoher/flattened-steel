/** Authenticated repository source. */
type SkyGpuSourceIdentity = Readonly<{
	/** Repository-relative path. */ path: string;
	/** Exact byte count. */ byteLength: number;
	/** Exact SHA-256. */ sha256: string;
}>;
/** Compact recipe; expanded maps remain in RAM. */
type SkyGpuControl = Readonly<{
	/** Exact compiler request. */ buildRequest: SkyBuildRequest;
	/** Registered condition order. */ scenes: readonly SkyScene[];
	/** Validated independent factors. */ controls: SkyControls;
	/** Unique channels in execution order. */ channels: readonly number[];
	/** Optional registered continuation-only capture recipe; absent for historical runners. */ continuation?: SkyContinuationCaptureControl;
}>;
/** One compact component-probe result, separate from the fixed main spectrum shape. */
type SkyContinuationProbeDiagnostic = Readonly<{
	/** Frozen probe identity, a bounded slug. */ probeId: string;
	/** Registered measurement scene identity. */ sceneId: string;
	/** Registered capture time in HH:MM form. */ time: string;
	/** Measurement grid column, 0 through 8. */ gridX: number;
	/** Measurement grid row, 0 through 8. */ gridY: number;
	/** Bounded integration/reconstruction method slug owned by the frozen case recipe. */ methodId: string;
	/** Bounded representation slug owned by the frozen case recipe. */ representationId: string;
	/** Cumulative scattering stage, 1 through 4. */ order: number;
	/** Nonnegative spectral radiance in the envelope's fixed units. */ value: number;
	/** Nonnegative empirical numerical allowance; null means unresolved, never exact. */ errorAllowance: number | null;
	/** Actual integrand evaluations, including rejected adaptive trials. */ evaluationCount: number;
	/** Explicit reasons that restrict this row's reference claim. */ limitations?: readonly string[];
}>;
/** Compact continuation evidence uploaded inside the authenticated channel metadata. */
type SkyContinuationChannelDiagnostics = Readonly<{
	/** Exact admitted diagnostic schema. */ schemaId: 'sky-continuation-channel-diagnostics-v1';
	/** Prevents interpreting selected difficult rays as whole-sky measurements. */ scope: 'component-probes';
	/** Fixed spectral radiance units for every value and allowance. */ units: 'W m^-2 sr^-1 nm^-1';
	/** Unique precomputed sample locations used by these diagnostics, including reference-only support. */ queryCount: number;
	/** Total runtime evaluations across the retained diagnostic rows. */ evaluationCount: number;
	/** Independent column evaluations performed once during support preparation. */ preparationEvaluationCount: number;
	/** Meaning of method allowances and the combined reference allowance. */ allowancePolicy: string;
	/** At most 4096 distinct probe/method/representation/order results for this channel. */ probes: readonly SkyContinuationProbeDiagnostic[];
	/** Separately scoped ground source densities, with their compact raw-tap derivation. */ groundDensities?: SkyGroundDensityEvidence;
	/** Separately scoped ordinary-screen adaptive/uniform comparison with complete runtime query costs. */ operations?: SkyAdaptiveCaptureEvidence;
}>;
/** Main spectra with optional compact diagnostics; spectra retain the ordinary shape contract. */
type SkyGpuEvaluation = SkyOrderEvaluation &
	Readonly<{
		/** Additional component-only evidence, never additional main-spectrum rays. */ diagnostics?: SkyContinuationChannelDiagnostics;
	}>;
/** Independently implementable view preparation and evaluation around the authenticated recurrence. */
interface SkyGpuBrowserEvaluation {
	/** Prepare the ordinary views plus any declared sparse-support union; retain the ordinary ray/selector shape. */ prepare(
		buildRequest: SkyBuildRequest,
		scenes: readonly SkyScene[],
		controls: SkyControls,
		continuation?: SkyContinuationCaptureControl,
	): SkyViewPlan;
	/** Consume the four matched sparse fields before channel disposal; returned spectra must match the recipe. */ evaluate(
		buildRequest: SkyBuildRequest,
		plan: SkyViewPlan,
		channel: number,
		pureOrders: readonly Float32Array[],
	): SkyGpuEvaluation | Promise<SkyGpuEvaluation>;
}
/** Exact sparse readback value. */
type SkyGpuFieldProbe = Readonly<{
	/** Texture column. */ x: number;
	/** Texture row. */ y: number;
	/** Float32 value promoted to Number. */ value: number;
}>;
/** Recorded production wavelength. */
type SkyGpuWavelength = Readonly<{
	/** Channel ordinal. */ index: number;
	/** Nanometre center. */ centerNanometers: number;
}>;
/** Recorded production field layout. */
type SkyGpuFieldLayout = Readonly<{
	/** Outgoing width. */ widthJ: number;
	/** Incoming width. */ widthL: number;
	/** Solar times altitude rows. */ height: number;
	/** Scalar byte count. */ scalarBytes: number;
}>;
/** Actual device limits. */
type SkyGpuCapabilities = Readonly<{
	/** Maximum texture extent. */ maximumTextureSize: number;
	/** Maximum viewport extents. */ maximumViewport: readonly number[];
}>;
/** Consumed compiler diagnostics; additional fields are retained opaquely. */
type SkyGpuCompilerReport = Readonly<{
	/** Production schema. */ schemaId: string;
	/** Executed wavelength. */ wavelength: SkyGpuWavelength;
	/** Actual dimensions. */ fieldLayout: SkyGpuFieldLayout;
	/** Device limits. */ capabilities: SkyGpuCapabilities;
	/** Peak recurrence allocation. */ peakLiveFieldBytes: number;
	/** Required zero final allocation. */ finalLiveFieldBytes: number;
	/** Required empty scene-cache list. */ compiledCaches: readonly unknown[];
	/** Unchanged additional diagnostic metadata. */ [key: string]: unknown;
}>;
/** One extraction event, including empty unrequested transport fields. */
type SkyGpuFieldEvent = Readonly<{
	/** J1..J4 or L1..L3 field identifier. */ fieldId: string;
	/** Channel ordinal. */ wavelengthIndex: number;
	/** Requested coordinate order; empty for fields without requested coordinates. */ values: readonly SkyGpuFieldProbe[];
}>;
/** Invocation of the authenticated compiler capability. */
type SkyGpuCompileRequest = Readonly<{
	/** Isolated WebGL2 context. */ gl: WebGL2RenderingContext;
	/** Exact physical/numerical request. */ buildRequest: SkyBuildRequest;
	/** Current channel. */ wavelengthIndex: number;
	/** Prohibits scene-cache allocation. */ compileSceneCaches: false;
	/** Shared sparse coordinates by field. */ fieldProbeCoordinates: Readonly<
		Record<string, SkyViewPlan['coordinates']>
	>;
	/** Awaited progress callback. */ reportProgress: (stage: string) => Promise<void>;
	/** Awaited sparse callback. */ onFieldProbes: (event: SkyGpuFieldEvent) => Promise<void>;
}>;
/** Explicit dynamically imported production compiler capability. */
interface SkyGpuCompilerModule {
	/** Compile one channel through J4 with sparse readback only. */ compileDistantSunSceneCacheWavelength(
		request: SkyGpuCompileRequest,
	): Promise<SkyGpuCompilerReport>;
}
/** Sparse field validity and exact identities. */
type SkyGpuFieldCheck = Readonly<{
	/** Pure order identifier. */ fieldId: string;
	/** Sparse scalar count. */ count: number;
	/** Minimum finite value. */ minimum: number;
	/** Maximum finite value. */ maximum: number;
	/** Float32 little-endian pure hash. */ pureSha256: string;
	/** Float32 little-endian cumulative hash. */ cumulativeSha256: string;
}>;
/** Length-prefixed JSON preceding binary64 spectra. */
type SkyGpuChannelHeader = Readonly<{
	/** Current channel. */ channel: number;
	/** Representation/view/order/ray counts. */ shape: SkyOrderEvaluation['shape'];
	/** J1 through J4 checks. */ fieldChecks: readonly SkyGpuFieldCheck[];
	/** Complete production diagnostic report. */ compilerReport: SkyGpuCompilerReport;
	/** View evaluation duration. */ evaluationMilliseconds: number;
	/** Validated compact component evidence when an admitted continuation capability supplied it. */ diagnostics?: SkyContinuationChannelDiagnostics;
}>;
/** Retained compact channel metadata. */
type SkyGpuChannelSummary = SkyGpuChannelHeader &
	Readonly<{
		/** Binary64 little-endian spectra identity. */ spectraSha256: string;
	}>;
/** Spectra delivered to the owning run writer. */
type SkyGpuChannel = SkyGpuChannelSummary &
	Readonly<{
		/** Representation/view/order/scene/X/Y-major values. */ values: Float64Array;
	}>;
/** Flushed root-owned progress event. */
type SkyGpuProgress = Readonly<{
	/** Execution phase. */ phase: string;
	/** Readable current observation. */ message: string;
	/** Completed channels. */ completed?: number;
	/** Requested channels. */ total?: number;
}>;
/** Actual renderer observation. */
type SkyGpuRenderer = SkyGpuCapabilities &
	Readonly<{
		/** Unmasked vendor if available. */ vendor: string;
		/** Unmasked renderer if available. */ renderer: string;
		/** WebGL version. */ version: string;
		/** GLSL version. */ shadingLanguageVersion: string;
	}>;
/** Compact sparse plan identity. */
type SkyGpuPlanSummary = Readonly<{
	/** Unique coordinate count. */ coordinateCount: number;
	/** Uint32 little-endian x/y sequence hash. */ coordinateSha256: string;
	/** Scene/X/Y-major rays per view. */ rayCount: number;
	/** View-count/solar-operator combinations. */ viewCount: number;
}>;
/** Browser completion observations. */
type SkyGpuBrowserResult = Readonly<{
	/** Schema identity. */ schemaId: 'sky-gpu-browser-result-v1';
	/** Completed channels. */ channels: readonly number[];
	/** Actual hardware and limits. */ renderer: SkyGpuRenderer;
	/** Reproducible map summary. */ plan: SkyGpuPlanSummary;
	/** Maximum measured recurrence bytes. */ peakLiveFieldBytes: number;
	/** Browser execution duration. */ elapsedMilliseconds: number;
	/** Explicit owned-context loss was requested. */ contextLossRequested: boolean;
}>;
/** Root-owned recipe, boundaries, and evidence callbacks. */
type SkyGpuHostOptions = Readonly<{
	/** Canonical repository identity. */ repositoryRoot: string;
	/** Unique experiment scratch owner directory. */ scratchDirectory: string;
	/** Canonical explicit browser executable. */ chromePath: string;
	/** Compact recipe. */ control: SkyGpuControl;
	/** Exact browser module allowlist. */ sourceIdentities: readonly SkyGpuSourceIdentity[];
	/** Safe root-owned source reader. */ readSource: (path: string) => Promise<Uint8Array>;
	/** Awaited spectra persistence before next channel. */ onChannel: (channel: SkyGpuChannel) => Promise<void>;
	/** Flushed progress and budget guard. */ onProgress: (progress: SkyGpuProgress) => Promise<void>;
	/** Timeout capped at 7,500,000 milliseconds. */ timeoutMilliseconds?: number;
	/** Allowlisted dynamic compiler entry. */ compilerModulePath?: string;
	/** Experiment-owned browser entry; defaults to the four-order runner. */ browserModulePath?: string;
	/** Explicit admitted recurrence length; defaults to four.
	 * - **4** - Original production compiler and normal experiment result.
	 * - **6** - Contained extended-order diagnostic and its separate completion schema.
	 */ expectedOrderCount?: 4 | 6;
	/** Exact completion schema paired with the admitted order count. */ compilerReportSchema?: string;
	/** Exact source-field sequence; species compilers have seven fields for four cumulative orders. */ expectedFieldIds?: readonly string[];
	/** Optional initial and periodic resource admission. Throw/reject to stop the owned capture; honor cancellation and finish owned writes before settling. */ observeResources?: (
		observation: SkyGpuResourceObservationRequest,
	) => Promise<void>;
}>;
/** Owned process identities supplied to the caller's measured resource admission policy. */
type SkyGpuResourceObservationRequest = Readonly<{
	/** This authenticated capture host's process ID. */ hostPid: number;
	/** Exact spawned Chrome root process ID; descendants belong to this root's lifetime. */ chromePid: number;
	/** Milliseconds since this GPU host invocation began. */ elapsedMilliseconds: number;
	/** Aborted when this observation fails or exceeds its 10-second deadline. */ signal: AbortSignal;
}>;
/** Canonical executable identity. */
type SkyGpuExecutable = Readonly<{
	/** Canonical absolute path. */ path: string;
	/** Exact byte count. */ byteLength: number;
	/** Exact SHA-256. */ sha256: string;
}>;
/** Exact installed browser-automation tool identities. */
type SkyGpuAutomationIdentity = Readonly<{
	/** Installed package version. */ version: string;
	/** Dynamically resolved module entry. */ entry: SkyGpuExecutable;
	/** Installed package manifest. */ manifest: SkyGpuExecutable;
}>;
/** Mutable host cleanup observations. */
type SkyGpuCleanup = {
	/** Browser closure completed. */ browserClosed: boolean;
	/** Exact owned child exited. */ childExited: boolean;
	/** Listener and connections closed. */ serverClosed: boolean;
	/** Exact-child fallback termination was needed. */ forcedChildKill: boolean;
};
/** Completed host evidence including failures. */
type SkyGpuHostResult = Readonly<{
	/** Schema identity. */ schemaId: 'sky-gpu-host-result-v1';
	/** All execution/authentication/cleanup gates passed. */ executionSucceeded: boolean;
	/** Preserved error or null. */ failure: string | null;
	/** Browser completion when available. */ browser: SkyGpuBrowserResult | null;
	/** Completed channel metadata. */ channels: readonly SkyGpuChannelSummary[];
	/** Exact modules served. */ servedSources: readonly SkyGpuSourceIdentity[];
	/** Served identities matched after execution. */ servedSourcesReauthenticated: boolean;
	/** Executed browser identity. */ chrome: SkyGpuExecutable;
	/** Actual connected browser version. */ browserVersion: string | null;
	/** Installed automation identities when loaded. */ automation: SkyGpuAutomationIdentity | null;
	/** Executing Node version. */ nodeVersion: string;
	/** Last 64 KiB of stderr. */ stderrTail: string;
	/** Explicit cleanup observations. */ cleanup: SkyGpuCleanup;
	/** Host duration. */ elapsedMilliseconds: number;
}>;
/** Attach to the exact spawned browser. */
type SkyGpuConnectOptions = Readonly<{
	/** Owned debugger endpoint. */ browserWSEndpoint: string;
	/** Preserve browser viewport. */ defaultViewport: null;
}>;
/** Bounded navigation before asynchronous computation. */
type SkyGpuNavigateOptions = Readonly<{
	/** Initial module-ready milestone. */ waitUntil: 'domcontentloaded';
	/** Navigation timeout. */ timeout: number;
}>;
/** Dynamic installed automation capability. */
interface SkyGpuAutomationModule {
	/** Attach to owned Chrome. */ connect(options: SkyGpuConnectOptions): Promise<SkyGpuAutomationBrowser>;
}
/** Minimal owned-browser automation. */
interface SkyGpuAutomationBrowser {
	/** Create execution page. */ newPage(): Promise<SkyGpuAutomationPage>;
	/** Read the actual owned browser version. */ version(): Promise<string>;
	/** Close owned browser. */ close(): Promise<void>;
	/** Drop failed automation connection. */ disconnect(): void;
}
/** Minimal execution-page capability. */
interface SkyGpuAutomationPage {
	/** Navigate to authenticated local entry. */ goto(url: string, options: SkyGpuNavigateOptions): Promise<unknown>;
	/** Observe page/module failure. */ on(event: 'pageerror', callback: (error: Error) => void): void;
}
/** Byte stream consumed under an explicit upload limit. */
interface SkyGpuBodyStream extends AsyncIterable<Uint8Array> {}
/** Owned diagnostic stream. */
interface SkyGpuStderr {
	/** Observe bounded stderr bytes. */ on(event: 'data', callback: (bytes: Uint8Array) => void): unknown;
}
/** Exact spawned process cleanup capability. */
interface SkyGpuOwnedChrome {
	/** Exact spawned process ID; absent only when process creation failed. */ readonly pid?: number;
	/** Observed termination code. */ readonly exitCode: number | null;
	/** Observed termination signal. */ readonly signalCode: string | null;
	/** Diagnostic pipe. */ readonly stderr: SkyGpuStderr;
	/** Observe spawn failure. */ once(event: 'error', callback: (error: Error) => void): unknown;
	/** Observe owned process exit. */ once(
		event: 'exit',
		callback: (code: number | null, signal: string | null) => void,
	): unknown;
	/** Terminate only the owned process. */ kill(): boolean;
}
