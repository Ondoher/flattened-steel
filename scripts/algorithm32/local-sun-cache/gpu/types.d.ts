/** Offline qualification mode.
 * - **"fields"** - Every occupied physical field scalar against independent controls.
 * - **"runtime"** - Ordinary GPU lookup and complete/shortened view rays.
 * - **"omission"** - Exact equivalent unculled occupied fields and zero slots.
 * - **"cleanup"** - Required admission/cancellation/failure resource release.
 * - **"zero"** - Analytic black-source GPU fields and runtime queries.
 */
type LocalSunGpuQualificationMode = 'fields' | 'runtime' | 'omission' | 'cleanup' | 'zero';
/** Qualification disposition.
 * - **"passed"** - All declared comparisons passed.
 * - **"failed"** - A declared comparison or execution gate failed.
 */
type LocalSunGpuProofState = 'passed' | 'failed';
/** Complete independently frozen GPU input inventory. */
type LocalSunGpuIndependentFields = Readonly<{
	/** Producer extraction schema. */ schema: string;
	/** Terminal extraction disposition. */ state: LocalSunGpuProofState;
	/** Complete authenticated physical fields. */ fields: readonly LocalSunGpuSavedField[];
}>;
/** Owned sequential candidate-field transfer handle. */
type LocalSunGpuFieldWriter = {
	/** Owned descriptor, cleared after close. */ fd: number | null;
	/** Exact next accepted byte offset. */ received: number;
};
/** Observed process/free-memory sample, separate from logical GPU accounting. */
type LocalSunGpuHostSample = Readonly<{
	/** Time since job admission. */ elapsedMilliseconds: number;
	/** Host-reported available physical memory. */ freeBytes: number;
	/** Sum of owned Node/Chrome working sets; shared pages may repeat. */ ownedProcessBytes: number;
}>;
/** Renderer observation classification; neither value claims supported accelerated hardware qualification.
 * - **"software"** - Renderer explicitly identifies a software implementation.
 * - **"unknown"** - Renderer does not identify a software implementation; acceleration is not inferred.
 */
type LocalSunGpuRendererAssessment = 'software' | 'unknown';
/** Actual owned browser renderer identity retained independently of capability counts. */
type LocalSunGpuRendererIdentity = Readonly<{
	/** Context-reported WebGL version. */ version: string;
	/** Context-reported vendor. */ vendor: string;
	/** Context-reported renderer implementation. */ renderer: string;
	/** Explicit software recognition without claiming hardware coverage. */ assessment: LocalSunGpuRendererAssessment;
}>;
/** Explicit offline run selection. */
type LocalSunGpuQualificationRequest = Readonly<{
	/** Actual requested ordinary order. */ order: SupportedCacheScatteringOrder;
	/** New five-digit immutable output serial. */ serial: string;
	/** Bounded proof unit. */ mode: LocalSunGpuQualificationMode;
}>;
/** Authenticated physical inputs supplied to the owned browser entry. */
type LocalSunGpuBrowserProofRequest = Readonly<{
	/** Frozen P0 seed/input controls; candidate construction never reads expected numerical outputs. */ p0: LocalSunP0Fixture;
	/** Independently frozen selected physical spectra. */ controls: LocalSunPhysicalControls;
	/** Actual construction order. */ order: SupportedCacheScatteringOrder;
	/** Complete occupied-field comparison/export enabled. */ full: boolean;
	/** Ordinary runtime proof enabled. */ runtime: boolean;
	/** Equivalent unculled proof enabled. */ omission: boolean;
	/** Resource cleanup proof enabled. */ cleanup: boolean;
	/** Analytic source intensity control; omitted is the physical reference selection. */ sourceScale?: 0 | 1;
}>;
/** Owned offline browser RPC surface. */
interface LocalSunGpuProofBrowserScope {
	/** Call this method to execute one bounded qualification unit in its owned browser. */
	runCompactGpu(request: LocalSunGpuBrowserProofRequest): Promise<LocalSunGpuBrowserProofReport>;
}
/** Scalar comparison at the original quantity absolute floor and relative 0.002 gate. */
type LocalSunGpuScalarResidual = {
	/** Number of compared physical scalars. */ count: number;
	/** Failed scalar comparisons. */ failures: number;
	/** Maximum error divided by the frozen allowed error. */ maximumRatio: number;
	/** Maximum absolute error in the field's physical units, when recorded. */ maximumAbsolute?: number;
	/** Worst direction-fastest packed address, when recorded. */ worstIndex?: number;
	/** Complete occupied-field comparison distinct from selected scalar controls. */ whole?: LocalSunGpuScalarResidual;
};
/** Complete actual field observation with independently qualified selected/common inputs. */
type LocalSunGpuFieldObservation = Readonly<{
	/** Pure/cumulative logical field identity. */ id: string;
	/** Executed scalar R32F packing. */ storage: CacheFieldStorage;
	/** Every nonfinite scalar, without hiding values. */ nonfinite: number;
	/** Every negative scalar, without clamping. */ negative: number;
	/** Exact candidate FP32 payload identity. */ sha256: string;
	/** Selected and optional whole-field numerical comparisons. */ comparison: LocalSunGpuScalarResidual;
}>;
/** Live compact cache capability required by resource proofs. */
type LocalSunGpuRetainedCache = GpuScatteringCache &
	Readonly<{
		/** Actual retained field/auxiliary accounting and preallocation admission. */ resources: LocalSunCompactGpuResourceReport;
	}>;
/** Opaque GPU backend operations required by offline proofs, without implementation selection. */
type LocalSunGpuProofBackend = CacheGpuBackend &
	Readonly<{
		/** Call this method to read a complete field through a live opaque runtime binding.
		 * @param binding - Backend-owned field binding.
		 * @returns - Complete layer-major physical scalars and their executed storage.
		 */ readRuntimeBindingField(binding: CacheRuntimeBinding): Promise<CacheScalarFieldReadback>;
	}>;
/** Renderer operations needed for the offline ordinary-runtime probe. */
type LocalSunGpuProofRenderer = Pick<ThreeCacheBackendRendererOperations, 'getContext' | 'setRenderTarget'> &
	Readonly<{
		/** Call this method to render owned renderer-native scene/camera handles.
		 * @param scene - Owned proof scene.
		 * @param camera - Owned proof camera.
		 */ render(scene: object, camera: object): void;
		/** Call this method to select the numeric proof viewport.
		 * @param x - Pixel origin x.
		 * @param y - Pixel origin y.
		 * @param width - Viewport width.
		 * @param height - Viewport height.
		 */ setViewport(x: number, y: number, width: number, height: number): void;
		/** Call this method to inspect the owned floating-point diagnostic target.
		 * @param target - Owned target.
		 * @param x - Pixel origin x.
		 * @param y - Pixel origin y.
		 * @param width - Readback width.
		 * @param height - Readback height.
		 * @param values - Owned complete RGBA destination.
		 */ readRenderTargetPixels(
			target: object,
			x: number,
			y: number,
			width: number,
			height: number,
			values: Float32Array,
		): void;
	}>;
/** Ordinary runtime proof collaborators. */
type LocalSunRuntimeProofRequest = Readonly<{
	/** Genuine complete physical construction profile. */ profile: LocalSunCompactConstructionProfile;
	/** Accepted ordinary execution model. */ model: SharedModel;
	/** Live ordinary compact lookup contributor and opaque bindings. */ cache: GpuScatteringCache;
	/** Actual opaque backend and uniform installer. */ backend: LocalSunGpuProofBackend;
	/** Owned renderer operations used only by this proof. */ renderer: LocalSunGpuProofRenderer;
	/** Independent cumulative truncation. */ order: SupportedCacheScatteringOrder;
}>;
/** Matched physical GPU lookup or ray query. */
type LocalSunGpuPhysicalQuery = Readonly<{
	/** FP32-matched world position in meters. */ position: UnitVector3;
	/** Normalized physical ray direction. */ direction: UnitVector3;
	/** Zero lookup, one ray, or two explicit rejected support. */ mode: 0 | 1 | 2;
	/** Explicit shortened length in meters; negative means the complete physical ray. */ maximum: number;
}>;
/** Independent physical spectrum and optional complete-ray expectation. */
type LocalSunGpuPhysicalExpectation = Readonly<{
	/** Physical J or L values in Native15 order. */ radiance: readonly number[];
	/** Complete analytic transmission when the query is a ray. */ transmission?: readonly number[];
	/** Complete/shortened physical ray length in meters. */ length?: number;
}>;
/** CPU/ordinary GPU runtime comparisons, distinct from appearance. */
type LocalSunRuntimeProofReport = {
	/** Explicit negative-radius, cylinder, below-ground and above-top rejection queries. */ rejectedQueries: number;
	/** Physical lookup queries. */ lookups: number;
	/** All compared lookup channels. */ lookupScalars: number;
	/** Complete/shortened physical rays. */ rays: number;
	/** All compared ray channels. */ rayScalars: number;
	/** Binary64 view operation versus independent retained equations. */ independentCpuMaximumRatio: number;
	/** Maximum GPU physical-J lookup gate fraction. */ lookupMaximumRatio: number;
	/** Maximum GPU physical-L view gate fraction. */ radianceMaximumRatio: number;
	/** Maximum transmission gate fraction. */ transmissionMaximumRatio: number;
	/** Maximum matched endpoint-distance residual, meters. */ endpointMaximumError: number;
	/** Failed comparisons; no tolerance fitting. */ failures: number;
	/** Mechanically assembled ordinary-consumer shader identity. */ assemblyHash: string;
	/** Geometry-owned boundary meanings and physical lengths. */ endpoints: readonly Readonly<{
		/** Actual complete or shortened endpoint meaning. */ boundary: FlatCompactRay['boundary'];
		/** Complete/shortened length in meters. */ length: number;
	}>[];
};
/** Equivalent omission proof inputs; empty slots never enter production. */
type LocalSunOmissionProofRequest = Readonly<{
	/** Genuine occupied construction profile. */ profile: LocalSunCompactConstructionProfile;
	/** Actual backend used for the compact construction. */ backend: LocalSunGpuProofBackend;
	/** Complete compact payload hashes frozen before the unculled control. */ compactHashes: ReadonlyMap<
		string,
		string
	>;
	/** Already retained logical GPU payload, bytes. */ retainedBytes: number;
}>;
/** Exact compact/unculled field identity and empty-slot observations. */
type LocalSunOmissionFieldObservation = Readonly<{
	/** Pure/cumulative physical field. */ id: string;
	/** Exact occupied FP32 identity. */ sha256: string;
	/** Empty slots with nonzero values. */ emptyNonzero: number;
	/** All nonfinite values. */ nonfinite: number;
	/** Actual occupied scalar count. */ occupiedScalars: number;
	/** Actual empty scalar count. */ emptyScalars: number;
}>;
/** Exact omission result without physical-accuracy or hardware-memory claims. */
type LocalSunOmissionProofReport = Readonly<{
	/** Real occupied positions. */ occupiedNodes: number;
	/** One proven empty slot per omitted band/altitude row. */ emptySlots: number;
	/** Equivalent unculled position count. */ totalPositions: number;
	/** Exact identities and zero-slot checks. */ observations: readonly LocalSunOmissionFieldObservation[];
	/** Executor logical resource peaks. */ resources: CacheBuildMemoryDiagnostics;
	/** Complete conservative admission subtotal including retained control and proof resources, bytes. */ estimatedOwnedBytes: number;
}>;
/** Real-backend staging failure proof inputs. */
type LocalSunGpuCleanupProofRequest = Readonly<{
	/** Actual backend with temporary proof-owned failure instrumentation. */ backend: LocalSunGpuProofBackend;
	/** Already complete cache that candidate cleanup must preserve. */ priorCache: LocalSunGpuRetainedCache;
	/** Construct an explicit accepted physical profile; this never mutates the prior cache. */ createProfile(
		order: SupportedCacheScatteringOrder,
	): LocalSunCompactConstructionProfile;
}>;
/** Failure-injection observations with separately owned resource counts. */
type LocalSunGpuCleanupObservation = Readonly<{
	/** Required staging/admission failure case. */ fault: LocalSunGpuCleanupFault;
	/** Actual rejection diagnostic. */ failure: string;
	/** Candidate field allocations. */ allocations: number;
	/** Peak actual declared candidate payload, bytes. */ peakCandidateLogicalBytes: number;
	/** Candidate handles left after cleanup. */ remainingCandidateHandles: number;
	/** Candidate payload left after cleanup, bytes. */ remainingCandidateBytes: number;
	/** Prior opaque bindings still install successfully. */ priorBindingsRemainLive: boolean;
}>;
/** Required independently injected candidate failure.
 * - **"budget"** - Reject before allocation above the owned GPU ceiling.
 * - **"capability"** - Reject insufficient array/texture capabilities.
 * - **"pre-abort"** - Reject an already cancelled build.
 * - **"compile"** - Reject compilation failure.
 * - **"allocation"** - Release compilation resources after field allocation failure.
 * - **"submission"** - Release staging fields/programs after render failure.
 * - **"aux-upload"** - Release completed field and partially uploaded auxiliary textures.
 * - **"cancel-after-compile"** - Release compiled resources after cancellation.
 */
type LocalSunGpuCleanupFault =
	| 'budget'
	| 'capability'
	| 'pre-abort'
	| 'compile'
	| 'allocation'
	| 'submission'
	| 'aux-upload'
	| 'cancel-after-compile';
/** Opaque disposable resource tracked by offline candidate instrumentation. */
type LocalSunGpuCandidateHandle = CacheGpuProgram | GpuCacheField | CacheImmutableTexture;
/** Owned mutable candidate accounting for one failure injection. */
type LocalSunGpuCandidateState = {
	/** Still-live candidate resource handles. */ handles: Set<LocalSunGpuCandidateHandle>;
	/** Current owned candidate payload bytes. */ allocatedBytes: number;
	/** Maximum observed owned candidate payload bytes. */ peakBytes: number;
};
/** Complete resource failure proof. */
type LocalSunGpuCleanupProofReport = Readonly<{
	/** Every declared required failure with ownership evidence. */ observations: readonly LocalSunGpuCleanupObservation[];
}>;
/** Immutable binary field saved in a new production qualification run. */
type LocalSunGpuSavedField = Readonly<{
	/** Actual field identity. */ id: string;
	/** Run-relative binary artifact. */ path: string;
	/** Exact FP32 payload bytes. */ bytes: number;
	/** Exact artifact hash. */ sha256: string;
}>;
/** Browser qualification result; final completion also requires the independent standards ledger. */
type LocalSunGpuBrowserProofReport = {
	/** Actual numerical disposition. */ state: LocalSunGpuProofState;
	/** Executed ordinary order. */ order: SupportedCacheScatteringOrder;
	/** Complete field observations. */ observations: readonly LocalSunGpuFieldObservation[];
	/** Admission and actual executor/retained payload reporting. */ resources: LocalSunCompactGpuResourceReport;
	/** Browser construction and selected-readback elapsed time, milliseconds. */ milliseconds: number;
	/** Accepted hardware API capabilities. */ capabilities: CacheGpuCapabilities;
	/** Actual renderer/tool observation; distinct from supported-hardware qualification. */ rendererIdentity: LocalSunGpuRendererIdentity;
	/** Actual complete physical/numerical profile identity. */ profileHash: string;
	/** Opaque field and auxiliary runtime binding count. */ runtimeBindings: number;
	/** Actual final WebGL error status. */ glError: number;
	/** Optional ordinary-consumer physical proof. */ runtime?: LocalSunRuntimeProofReport;
	/** Optional exact omission control. */ omission?: LocalSunOmissionProofReport;
	/** Optional resource failure proof. */ cleanup?: LocalSunGpuCleanupProofReport;
	/** New-run saved physical fields, when exported. */ fields?: readonly LocalSunGpuSavedField[];
};
