/** Offline qualification mode.
 * - **"fields"** - Every occupied physical field scalar against independent controls.
 * - **"runtime"** - Ordinary GPU lookup and complete/shortened view rays.
 * - **"omission"** - Exact equivalent unculled occupied fields and zero slots.
 * - **"cleanup"** - Required admission/cancellation/failure resource release.
 * - **"zero"** - Analytic black-source GPU fields and runtime queries.
 * - **"reuse"** - Canonical field reuse and complete local-frame preparation/publication.
 * - **"trajectory"** - All 120 authenticated exact states of one accepted P5 trajectory.
 */
type LocalSunGpuQualificationMode = 'fields' | 'runtime' | 'omission' | 'cleanup' | 'zero' | 'reuse' | 'trajectory';

/** Accepted P5 trajectory identity, preserving the frozen 120-slot observation sequence.
 * - **"flat-0"** - Window centered on the accepted Flat0 observation.
 * - **"flat-45"** - Window centered on the accepted Flat45 observation.
 * - **"flat-90"** - Window centered on the accepted Flat90 observation.
 * - **"flat-135"** - Window centered on the accepted Flat135 observation.
 * - **"flat-180"** - Window centered on the accepted Flat180 observation.
 */
type LocalSunGpuTrajectoryId = 'flat-0' | 'flat-45' | 'flat-90' | 'flat-135' | 'flat-180';

/** Installed CommonJS factory with an explicit Node interoperability boundary. */
type LocalSunGpuCommonJsFactory = () => import('rollup').Plugin;

/** Rollup-owned diagnostic delivered to the bounded proof host. */
type LocalSunGpuRollupWarning = import('rollup').RollupWarning;

/** Babel-owned JavaScript member path used for exact NODE_ENV substitution. */
type LocalSunGpuEnvironmentMemberPath = import('@babel/traverse').NodePath<import('@babel/types').MemberExpression>;

/** Optional bounded JavaScript environment substitution, with no additional source map. */
type LocalSunGpuEnvironmentTransformResult = Readonly<{
	/** Transformed module JavaScript, with no GLSL or physical-equation substitutions. */ code: string;
	/** No additional map for the bounded transform. */ map: null;
}> | null;

/** Read-only authenticated historical observation inputs; no candidate output or numerical gold is taken from this shape. */
type LocalSunGpuTrajectoryInputs = Readonly<{
	/** Historical schema identity. */ schema: 'shell-temporal-states-v1';
	/** All five original, ordered observation windows. */ trajectories: readonly Readonly<{
		/** Accepted window identity. */ id: LocalSunGpuTrajectoryId;
		/** Exact historical slots, each retaining its original time, observer and source placement. */ states: readonly Readonly<{
			/** Original slot, from zero through 119. */ slot: number;
			/** Exact historical geometry data used only as independent input/control. */ state: Readonly<{
				/** Geographic and UTC observation. */ observation: GeometryObservation;
				/** Independently retained observer/source positions in meters. */ geometry: Readonly<{
					/** Physical observer position. */ observerPosition: Position;
					/** Independently resolved finite source position. */ sourcePosition: Position;
				}>;
			}>;
		}>[];
	}>[];
}>;
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
	/** Required only by trajectory mode, with N1 and exactly120 original slots. */ trajectory?: LocalSunGpuTrajectoryId;
	/** Optional exact composer precision for explicit frame reuse proof; default float32. */ sceneColorPrecision?: Flat32SceneColorPrecision;
	/** Actual requested ordinary order. */ order: SupportedCacheScatteringOrder;
	/** New five-digit immutable output serial. */ serial: string;
	/** Bounded proof unit. */ mode: LocalSunGpuQualificationMode;
}>;
/** Authenticated physical inputs supplied to the owned browser entry. */
type LocalSunGpuBrowserProofRequest = Readonly<{
	/** Optional authenticated exact trajectory poses, replacing only the offline proof's default motion cases. */ trajectoryPoses?: readonly LocalSunFrameGpuPose[];
	/** Explicit complete-frame composer storage, independent from R32F physical fields. */ sceneColorPrecision?: Flat32SceneColorPrecision;
	/** Exact independently retained day controls, only for the explicit reuse lane. */ movement?: readonly LocalSunFrameGpuMovementState[];
	/** Independently qualified P2 complete cumulative field identity. */ qualifiedFieldHash?: string;
	/** Frozen P0 seed/input controls; candidate construction never reads expected numerical outputs. */ p0: LocalSunP0Fixture;
	/** Independently frozen selected physical spectra. */ controls: LocalSunPhysicalControls;
	/** Actual construction order. */ order: SupportedCacheScatteringOrder;
	/** Complete occupied-field comparison/export enabled. */ full: boolean;
	/** Ordinary runtime proof enabled. */ runtime: boolean;
	/** Equivalent unculled proof enabled. */ omission: boolean;
	/** Resource cleanup proof enabled. */ cleanup: boolean;
	/** Complete local frame preparation/reuse proof enabled. */ reuse?: boolean;
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
	/** Optional complete local frame reuse/publication proof. */ reuse?: LocalSunFrameGpuProofReport;
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

/** Actual hardware/resource owners supplied to the complete-frame proof. */
type LocalSunFrameGpuRenderer = import('three').WebGLRenderer;
/** Actual retained Three program, owned solely by the offline physical probe. */
type LocalSunFrameGpuMaterial = import('three').RawShaderMaterial;
/** Mutable owner uniform values prepared for Three shader installation. */
type LocalSunFrameGpuUniforms = Record<string, import('three').IUniform>;
/** Opaque cache binding destination values, independently supplied to the real backend. */
type LocalSunFrameGpuCacheUniforms = Record<string, {/** Destination uniform state. */ value: unknown}>;
/** Actual hardware/resource owners supplied to the complete-frame proof. */
type LocalSunFrameGpuProofRequest = Readonly<{
	/** Optional predeclared exact trajectory poses; omission retains the original sixteen-case proof. */ poses?: readonly LocalSunFrameGpuPose[];
	/** Selected ordinary compositor precision, default float32. */ sceneColorPrecision?: Flat32SceneColorPrecision;
	/** Independently qualified canonical cumulative GPU identity. */ expectedFieldHash: string;
	/** Exact historical observations and geometry placement controls. */ movement: readonly LocalSunFrameGpuMovementState[];
	/** Genuine independently qualified physical family. */ profile: LocalSunCompactConstructionProfile;
	/** Externally owned WebGL backend and receiver readback. */ backend: LocalSunGpuProofBackend & CacheProbeReader;
	/** Current owned browser renderer. */ renderer: import('three').WebGLRenderer;
	/** Per-copy canonical field/auxiliary bytes, after the initial proof owner has released its field. */ retainedBytes: number;
}>;

/** Independent physical sample inputs and current external GPU owners. */
type LocalSunFrameGpuSamplesConfiguration = Readonly<{
	/** Optional P5 optimization: retain the last independent CPU oracle for identical profile/query inputs over this immutable field set. */ retainMatchedCpuOracle?: boolean;
	/** Genuine current backend with opaque cache bindings. */ backend: LocalSunGpuProofBackend;
	/** Current owned renderer. */ renderer: import('three').WebGLRenderer;
	/** Authenticated independent CPU physical fields. */ fields: readonly Float32Array[];
}>;
/** Private independent CPU oracle retained only by one probe owner over its authenticated immutable fields. */
type LocalSunFrameGpuCpuOracle = Readonly<{
	/** Exact profile identity and complete FP32 physical query tuple. */ key: string;
	/** Independent binary64 J/L/T and endpoint values, never derived from either candidate GPU output. */ values: Float64Array;
}>;

/** Physical sample quantities and their independently compared residuals. */
type LocalSunFrameGpuSampleResult = Readonly<{
	/** Independent CPU values reused for an exact matched profile/query tuple; every GPU comparison still executes. */ cpuOracleReused: boolean;
	/** Every negative J/L/T sample, without hiding or clamping it. */ negative: number;
	/** Query-major, Native15-channel-major J-or-L / T / endpoint triplets. */ values: readonly number[];
	/** Query quantity and complete/shortened endpoint selection. */ queries: readonly Readonly<{
		mode: 0 | 1 | 2;
		maximum: number;
	}>[];
	/** Original CPU/GPU quantity gate observations. */ cpu: LocalSunGpuScalarResidual;
	/** Independent physical endpoint count and maximum absolute discrepancy. */ endpoints: Readonly<{
		count: number;
		maximumError: number;
	}>;
}>;
/** Complete frame identity and actual binding observations. */
type LocalSunFrameGpuFrameObservation = Readonly<{
	/** Reused/fresh comparison's exact-input CPU oracle reuse flags; first matching reuse is independently cross-checked. */ cpuOracleReused: readonly [
		boolean,
		boolean,
	];
	/** Every negative physical GPU query value. */ negativeSamples: number;
	/** Exact geographic observation staged for every consumer. */ observation: GeometryObservation;
	/** Exact physical receiver position. */ receiverPosition: Position;
	/** Reused complete-frame preparation duration in milliseconds, including receiver/shader work. */ prepareMilliseconds: number;
	/** Independent complete control preparation duration in milliseconds. */ freshPrepareMilliseconds: number;
	/** Exact measured-adaptation identity. */ adaptation: LocalSunGpuScalarResidual;
	/** Predeclared motion or actual observation fixture. */ label: string;
	/** Actual graph submissions for the reused field; zero after the initial build. */ reusedSubmissions: number;
	/** Actual submissions for the independently rebuilt canonical control. */ freshSubmissions: number;
	/** Matched lookup, radiance, transmission and endpoint comparisons. */ physical: LocalSunGpuScalarResidual;
	/** Matched direct/diffuse receiver spectra and measured adaptation. */ receiver: LocalSunGpuScalarResidual;
	/** Matched actual composed pixels. */ output: LocalSunGpuScalarResidual;
	/** Independent CPU-field lookup/view comparison, at the original gate. */ cpu: LocalSunGpuScalarResidual;
	/** Independent complete/shortened endpoint observations. */ endpoints: Readonly<{
		count: number;
		maximumError: number;
	}>;
	/** Exact reused physical quantities supporting the reported comparisons. */ samples: readonly number[];
	/** Exact live state and generation. */ identity: string;
	/** Canonical physical/numerical construction state. */ constructionIdentity: string;
	/** Exact live source center. */ sourcePosition: Position;
	/** Actual measured receiver state identity. */ receiverIdentity: string;
	/** Actual opaque field/auxiliary count. */ bindings: number;
	/** Earlier frame remains held until replacement is prepared. */ priorHeldDuringPreparation: boolean;
}>;
/** Actual complete-frame preparation and canonical reuse result. */
type LocalSunFrameGpuProofReport = Readonly<{
	/** Actual ordinary composer precision used for every frame. */ sceneColorPrecision: Flat32SceneColorPrecision;
	/** Real backend resource accounting, distinct from driver memory and reserved renderer resources. */ ownership: Readonly<{
		/** Peak live fields, auxiliary/program data and primitive-buffer bytes. */ peakObservedPayloadBytes: number;
		/** External retained field and conservative complete-frame reservation. */ reservedExternalAndFrameBytes: number;
		/** Observed peak plus external/reserved payload, below the frozen ceiling. */ completeObservedAdmissionBytes: number;
		/** Successful real handles remaining after final lease disposal. */ handlesAfterDisposal: number;
		/** Successful observed allocation payload remaining after disposal. */ bytesAfterDisposal: number;
	}>;
	/** Complete initial retained canonical field. */ baselineHash: LocalSunFrameGpuHash;
	/** Separately constructed canonical control, inspected in full. */ freshHash: LocalSunFrameGpuHash;
	/** Precisely states construction sharing and independent authority. */ comparisonMeaning: string;
	/** Declared complete-frame gates passed. */ state: LocalSunGpuProofState;
	/** Actual prepared/published observations. */ frames: readonly LocalSunFrameGpuFrameObservation[];
}>;

/** Independently constructed field receiving a bounded whole-field digest.
 * - **"retained"** - Canonical field retained by the reused-frame control.
 * - **"fresh"** - Separately rebuilt canonical comparison field.
 */
type LocalSunFrameGpuHashLabel = 'retained' | 'fresh';
/** Offline initial-field readiness gate and serialized real renderer preparation. */
type LocalSunFrameGpuStageSequencer = {
	/** Initial independently completed canonical caches. */ readyCount: number;
	/** Awaiting first canonical field, before admitting the second build. */ firstReady: Promise<void>;
	/** Awaiting both independent fields before retaining view/receiver programs. */ pairReady: Promise<void>;
	/** Notify first-field readiness. */ releaseFirst(): void;
	/** Notify the initial pair or release cancelled staging. */ releasePair(): void;
	/** Serial real shader/receiver stage completion. */ tail: Promise<void>;
};
/** Bounded host-owned streaming SHA-256 accumulation, with no duplicate full browser buffers. */
type LocalSunFrameGpuDigestState = {
	/** Native incremental digest owner for this one field. */ hash: import('node:crypto').Hash;
	/** Exact cumulative received field bytes. */ received: number;
	/** Completed hash, after exact byte-length validation. */ sha256: string | null;
};
/** Completed bounded whole-field digest from the owned host. */
type LocalSunFrameGpuDigestReply = Readonly<{
	/** Exact input field bytes hashed. */ bytes: number;
	/** Complete raw FP32 field SHA-256. */ sha256: string;
}>;
/** Complete field identity/validity observation. */
type LocalSunFrameGpuHash = Readonly<{
	/** Exact complete FP32 payload identity. */ sha256: string;
	/** All stored scalar values inspected. */ scalars: number;
	/** Every observed negative value, without clamping. */ negative: number;
}>;
/** Authenticated immutable historical orbital fixture. */
type LocalSunFrameGpuMovementState = Readonly<{
	/** Exact instant and geographic site. */ observation: GeometryObservation;
	/** Independently retained physical source center. */ sourcePosition: Position;
	/** Independently retained receiver coordinates. */ receiverPosition: Position;
}>;
/** Predeclared actual-motion frame selection. */
type LocalSunFrameGpuPose = LocalSunLiveProfileRequest &
	Readonly<{
		/** Explicit comparison case identity. */ label: string;
		/** Independent day geometry control when placement is resolved. */ expectedSourcePosition?: Position;
	}>;
/** Actual ordinary composer capability and bounded readback. */
type LocalSunFrameGpuScene = Readonly<{
	/** Genuine scene/renderer/preparation owners. */ capability: Flat32LocalFrameSceneCapability;
	/** Read the actual last completed composed target. */ readOutput(): readonly number[];
}>;
