/** Ambient contracts owned by this contained experiment. */

/** Exclusive host-resource wrapper identity inherited by its owned child tree. */
type LocalSunHeavyExecutionOwnership = {
	/** Live wrapper process identifier. */ pid:number;
	/** Unpredictable ownership nonce, retained in the matching lock. */ nonce:string;
	/** New immutable wrapper evidence run. */ run:string;
};

/** One exact state around a frozen standard angle on the 24-hour/60-second clock. */
type LocalSunShellTemporalState = {
	/** Trajectory slot, zero through 119. */ slot:number;
	/** Signed ideal 30-Hz frame offset from the standard angle. */ frameOffset:number;
	/** Signed presentation-time offset, seconds. */ presentationSeconds:number;
	/** Complete ordinary exact physical state; no candidate values. */ state:LocalSunFrozenPlacement;
};

/** Independent positive Gauss-Legendre tap on minus-one to one. */
type LocalSunNativeGaussianTap = {
	/** Gaussian abscissa. */ node:number;
	/** Positive integral weight. */ weight:number;
};

/** The actual page canvas or its transferred renderer-owned offscreen counterpart. */
type LocalSunShellApplicationCanvas = HTMLCanvasElement|OffscreenCanvas;

/** Offscreen application worker wire protocol.
 * - **"execute"** - Transfer one canvas and exact experiment recipe into its owner.
 * - **"artifact"** - Deliver one source-bound artifact to the checked host.
 * - **"ack"** - Confirm the checked host persisted that artifact.
 * - **"complete"** - Return the complete serialized proof after resource cleanup.
 * - **"failed"** - Return an observable failure; host terminates the owned worker.
 */
type LocalSunShellApplicationWireKind = 'execute'|'artifact'|'ack'|'complete'|'failed';

/** One owned application worker protocol envelope. */
type LocalSunShellApplicationWire = {
	/** Protocol operation. */ kind:LocalSunShellApplicationWireKind;
	/** Exact transferred presentation canvas for execution only. */ canvas?:OffscreenCanvas;
	/** Exact source/numerical/application proof recipe for execution only. */ recipe?:LocalSunRotationRecipe;
	/** Proof-local artifact acknowledgement sequence. */ id?:number;
	/** Checked generated artifact basename. */ name?:string;
	/** Serialized artifact, result, or safe failure text. */ payload?:string;
};

/** Worker entry capability; lifecycle belongs to its page-side caller. */
interface LocalSunShellApplicationWorkerScope {
	/** Handle execution and host artifact acknowledgements. */ onmessage:(event:MessageEvent<LocalSunShellApplicationWire>)=>void;
	/** Send proof artifacts or a terminal outcome. */ postMessage(message:LocalSunShellApplicationWire):void;
}

/** Page-side worker preparation evidence, separate from worker scheduling gaps. */
type LocalSunShellApplicationHostMeasurement = {
	/** Complete worker proof result, serialized after owned GPU cleanup. */ result:string;
	/** Largest observed page event-loop gap, milliseconds. */ maximumResponsivenessGapMilliseconds:number;
	/** End-to-end worker/application wall time, milliseconds. */ elapsedMilliseconds:number;
};

/** Exact live and canonical identities expected by frame preparation. */
type LocalSunShellFrameIdentity = Readonly<{
	/** Complete live source, observer, receiver and view state. */ identity:string;
	/** Full physical and numerical cache construction identity. */ cacheIdentity:string;
}>;

/** Serialized exact-state publication with renderer leases and cancellation. */
interface LocalSunShellFramePublicationContract {
	/** Latest complete borrowed frame; asynchronous consumers acquire a lease. */ readonly active:LocalSunShellPublishedFrame|null;
	/** Frozen combined logical payload ceiling, bytes. */ readonly maximumBytes:number;
	/** Largest conservatively admitted logical payload, bytes. */ readonly peakAdmittedBytes:number;
	/** Observable cleanup failures; publication outcome remains deterministic. */ readonly cleanupErrors:readonly string[];
	/** Lease the complete active frame until idempotent release. */ acquireFrame():LocalSunShellFrameLease;
	/** Prepare and atomically publish; rejected staging preserves the active frame. */ request(request:LocalSunShellFrameRequest):Promise<LocalSunShellPublishedFrame>;
	/** Cancel staging and release publication ownership; renderer leases remain valid. */ dispose():void;
}

/** Frame-owned retained receiver program, released after in-flight work settles. */
type LocalSunShellReceiverProgram = {
	/** Owned compiled receiver material, or null before preparation/after disposal. */ material:THREE.RawShaderMaterial|null;
	/** Complete compiled source identity input. */ source:string;
};

/** Exact-state receiver preparation without presentation interpolation. */
interface LocalSunShellReceiverContract {
	/** Retained frame-owned receiver program. */ readonly program:LocalSunShellReceiverProgram;
	/** Prepare the exact same-state direct/diffuse/adaptation packet. */ prepare(request:LocalSunShellReceiverRequest,observation:GeometryObservation,identity:string):Promise<ReceiverEnvironmentLightMeasurement>;
	/** Retire owned receiver resources after pending preparations settle. */ dispose():void;
}

/** Receiver request whose canonical directions are supplied by its owner. */
type LocalSunShellReceiverRequest = Omit<LocalSunRotationGpuRayRequest,'directions'>;

/** One measured public backend resource lifetime transition. */
type LocalSunShellBackendResourceEvent = {
	/** Allocation/release category. */ kind:string;
	/** Actual public resource identity. */ id:string;
	/** Signed logical payload change, bytes. */ bytes:number;
	/** Current field payload, bytes. */ fields:number;
	/** Current pending/live immutable program payload, bytes. */ data:number;
	/** Combined simultaneous payload, bytes. */ total:number;
};

/** Detached public backend allocation evidence. */
type LocalSunShellBackendResourceSnapshot = {
	/** Current field payload, bytes. */ fields:number;
	/** Current immutable program payload, bytes. */ data:number;
	/** Largest simultaneous backend payload, bytes. */ peak:number;
	/** Complete detached lifetime inventory. */ events:LocalSunShellBackendResourceEvent[];
	/** Accounting scope and exclusions. */ claim:string;
};

/** Public backend allocation observer; resource ownership stays with the backend. */
interface LocalSunShellResourceProofContract {
	/** Current committed field payload, bytes. */ fields:number;
	/** Current pending/live program payload, bytes. */ data:number;
	/** Largest simultaneous backend payload, bytes. */ peak:number;
	/** Complete resource lifetime events. */ events:LocalSunShellBackendResourceEvent[];
	/** Record a checked signed resource transition. */ record(kind:string,id:string,bytes:number):void;
	/** Instrument a newly owned backend before construction. */ attach(backend:CacheGpuBackend):void;
	/** Return detached logical allocation evidence. */ snapshot():LocalSunShellBackendResourceSnapshot;
}

/** A live opaque GL resource's explicit suballocation inventory. */
type LocalSunShellGlAllocation = {
	/** Proof-local resource sequence. */ id:number;
	/** Resource category. */ kind:string;
	/** Per-face/per-level or whole storage payload, bytes. */ parts:Map<string,number>;
};

/** One observed GL allocation/deletion transition. */
type LocalSunShellGlEvent = {
	/** Proof-local resource sequence. */ id:number;
	/** Resource category. */ kind:string;
	/** Native allocation or deletion operation. */ operation:string;
	/** Signed explicit payload change, bytes. */ change:number;
	/** Simultaneous explicit payload, bytes. */ total:number;
};

/** Detached GL resource identity and remaining payload. */
type LocalSunShellGlLiveResource = {
	/** Proof-local resource sequence. */ id:number;
	/** Resource category. */ kind:string;
	/** Explicit payload still allocated, bytes. */ bytes:number;
};

/** Complete owned-context allocation evidence; physical driver overhead is separate. */
type LocalSunShellGlSnapshot = {
	/** Current explicit payload, bytes. */ bytes:number;
	/** Largest simultaneous payload, bytes. */ peak:number;
	/** Detached remaining resource allocations. */ live:LocalSunShellGlLiveResource[];
	/** Number of events in the final complete inventory prefix at this snapshot. */ eventCount:number;
	/** Complete detached lifetime transitions, or empty for a per-frame prefix reference. */ events:LocalSunShellGlEvent[];
	/** Accounting scope and exclusions. */ claim:string;
};

/** Observe only the experiment-owned WebGL context's resource lifetimes. */
interface LocalSunShellGlResourceContract {
	/** Current explicit allocation payload, bytes. */ bytes:number;
	/** Largest simultaneous allocation payload, bytes. */ peak:number;
	/** Observe a native successful suballocation. */ set(resource:WebGLTexture|WebGLRenderbuffer|WebGLBuffer|null,kind:string,part:string,bytes:number):void;
	/** Retire the deleted opaque resource's suballocations. */ release(resource:WebGLTexture|WebGLRenderbuffer|WebGLBuffer|null):void;
	/** Attach before creating a renderer over this owned context. */ attach(gl:WebGL2RenderingContext):void;
	/** Return detached allocation-backed evidence. */ snapshot(includeEvents?:boolean):LocalSunShellGlSnapshot;
}

/** Ordinary per-object shadow and exact receiver-light facts. */
type LocalSunShellSceneLight = {
	/** Ordinary object name. */ name:string;
	/** Scene-space shadow target. */ target:number[];
	/** Scene-space finite-source light position. */ position:number[];
	/** Scene-space direction toward the finite source. */ direction:number[];
	/** Exact receiver lighting identity. */ receiverIdentity:string;
	/** Measured spectral packet identity. */ spectralIdentity:string;
	/** Ordinary shadow map dimensions. */ mapSize:number[];
	/** Ordinary shadow bias. */ bias:number;
	/** Ordinary normal bias. */ normalBias:number;
	/** Ordinary filter radius. */ radius:number;
	/** Measured direct-light intensity. */ intensity:number;
	/** Object-specific shadow layer. */ layer:number;
};

/** Detached ordinary-scene and preserved-frame presentation facts. */
type LocalSunShellSceneSnapshot = {
	/** Unchanged ordinary scene summary. */ ordinary:Flat32SceneSummary;
	/** Whether complete old pixels are displayed during staging. */ suspended:boolean;
	/** Whether complete displayed pixels exist. */ rendered:boolean;
	/** Six ordinary lights with exact same-state facts. */ lights:LocalSunShellSceneLight[];
};

/** Frame-owned ordinary scene with exact-state lighting and preserved pixels. */
interface LocalSunShellSceneContract {
	/** Frame-owned scene shared with preparation. */ readonly scene:THREE.Scene;
	/** Frozen ordinary camera. */ readonly camera:THREE.PerspectiveCamera;
	/** Apply exact measured light and finite-source directions. */ setLighting(owners:LocalSunRotationOwners,receiver:ReceiverEnvironmentLightMeasurement,directionToSource:UnitVector3):void;
	/** Prepare both owned scene materials before publication. */ prepare(renderer:THREE.WebGLRenderer):Promise<void>;
	/** Render the complete live state or preserved pixels. */ render(renderer:THREE.WebGLRenderer,view:LocalSunControlViewPass,composer:ShaderRuntimeComposer):void;
	/** Preserve displayed pixels and retire lazy shadow-map storage. */ suspend():void;
	/** Resume the exact old state after rejected staging. */ resume():void;
	/** Report ordinary scene and exact-state compatibility facts. */ describe():LocalSunShellSceneSnapshot;
	/** Retire owned scene resources after the last renderer lease. */ dispose():void;
}

/** One proof-scoped reader over an already authenticated immutable native inventory. */
interface LocalSunNativeParentReader {
	/** Result metadata obtained through complete inventory authentication. */ readonly metadata:LocalSunParentArtifact;
	/** Revalidate the unchanged manifest, contained path and exact selected bytes before each use. */ read(artifact:string):Promise<LocalSunParentArtifact>;
}

/** Independent native tensor fields and canonical flat physical medium; candidate values are prohibited. */
type LocalSunNativeTensorStencil = {
	/** Complete binary64 tensor addresses. */ indices:number[];
	/** Corresponding nonnegative weights. */ weights:number[];
};
/** Independent native tensor fields and canonical flat physical medium; candidate values are prohibited. */
type LocalSunNativeFieldGrid = {
	/** Slab top, meters. */ top:number;
	/** Vacuum cylinder radius, meters. */ radius:number;
	/** Independent altitude support, meters. */ altitudes:number[];
	/** Independent horizontal radius support, meters. */ radial:number[];
	/** Independent outgoing polar cosines including poles. */ polar:number[];
	/** Uniform cyclic outgoing azimuth count. */ azimuthCount:number;
	/** Ground-level Rayleigh extinction per channel, inverse meters. */ betaR:number[];
	/** Ground-level Mie extinction per channel, inverse meters. */ betaM:number[];
	/** Rayleigh density height, meters. */ rayleighHeight:number;
	/** Mie density height, meters. */ mieHeight:number;
	/** Three orders J2/J3/J4, each holding fifteen binary64 normalized source functions. */ fields:Float64Array[][];
};

/** Source-independent finite-view transport operator measurement. */
type LocalSunNativeKernelMassResult = {
	/** Fifteen positive attenuation/extinction weight sums. */ mass:number[];
	/** Actual Gaussian quadrature taps in the retained physical segment. */ samples:number;
};
/** Finite independently solved observer-dome path in canonical source coordinates. */
type LocalSunNativeViewPath = {
	/** Physical start point, meters. */ point:number[];
	/** Unit physical propagation direction. */ direction:number[];
	/** Complete physical segment length, meters. */ length:number;
	/** Complete physical endpoint, meters. */ end:number[];
	/** Exact analytic per-channel finite-path transmission. */ transmittance:number[];
};
/** Independent binary64 complete-view integration with per-order separation. */
type LocalSunNativeViewCapture = {
	/** Complete control/candidate view and exact receiver inventories. */ results:(LocalSunShellTransmissionCapturePath & {
		/** Captured receiver spectra; only diffuse irradiance enters this physical comparison. */ receiver:{
			/** Exact measured diffuse horizontal irradiance. */ diffuseHorizontal:{/** Fifteen spectral densities. */ values:number[]};
		};
	})[];
};
/** Independent binary64 complete-view integration with per-order separation. */
type LocalSunNativeReceiverTap = {
	/** Physical flat-world unit direction toward the upper hemisphere. */ direction:number[];
	/** Positive cosine-weighted solid-angle contribution, steradians. */ weight:number;
};

/** Independent binary64 complete-view integration with per-order separation. */
type LocalSunNativeViewMeasurement = {
	/** Identified complete-view evidence schema. */ schema:string;
	/** All ninety-six complete independently integrated physical views. */ views:(LocalSunNativeViewResult & {/** Geometric endpoint discrepancy, meters. */ endpointDifferenceMeters:number})[];
	/** Complete independent cosine-weighted direction integrations. */ receiver:(LocalSunNativeViewResult & {/** Explicit cosine-weighted solid-angle contribution, or legacy uniform pi/count. */ weight?:number})[];
	/** All fifteen independently integrated horizontal irradiance channels. */ irradiance:number[];
	/** Optional four-order positive upper bounds for a declared, unrenormalized omitted horizon interval. */ receiverHorizonTailBounds?:number[][];
	/** Optional physical phase control variate; raw ray measurements remain unchanged. */ receiverPrimaryControl?:LocalSunReceiverPrimaryControl;
};

/** One complete-view or receiver three-level convergence packet. */
type LocalSunNativeViewConvergencePacket = {
	/** Quantity/order identity. */ quantity:string;
	/** Complete-view index, or null for integrated receiver irradiance. */ ray:number|null;
	/** Finest independent spectral values. */ reference:number[];
	/** Absolute changes between the first two refinements. */ delta1:number[];
	/** Absolute changes between the last two refinements. */ delta2:number[];
	/** Twice the last change, retained as empirical uncertainty. */ uncertainty:number[];
	/** Positive omitted-horizon upper bound; sum it once when combining different reference axes. */ additionalTail?:number[];
	/** Uncertainty divided by the unchanged physical acceptance tolerance. */ budgetFraction:number[];
	/** Frozen reduction and budget gate outcome for every spectral channel. */ converged:boolean[];
};

/** Independent binary64 complete-view integration with per-order separation. */
type LocalSunNativeViewResult = {
	/** Complete physical viewing path. */ path:LocalSunNativeViewPath;
	/** L1/L2/L3/L4 arrays with all fifteen spectral channels. */ orders:number[][];
	/** Sum of all four physical radiance orders. */ total:number[];
	/** Executed positive integration taps. */ samples:number;
	/** Retained prefix after independently bounded optical-tail truncation, meters. */ retainedLength:number;
};

/** Conservative selected-profile resource admission, measured separately from physical driver memory. */
type LocalSunShellResourceBounds = {
	/** Retained field and cache-local numeric support, bytes. */ retainedCacheBytes:number;
	/** Staging peak including temporary host program copies, bytes. */ peakBuildBytes:number;
	/** Shared phase and old/new frame numeric payload outside cache owners, bytes. */ otherPersistentBytes:number;
	/** One shared transferred Float32 phase allocation, bytes. */ sharedHostPhaseBytes:number;
	/** Conservative concurrent backend host-copy ceiling, bytes. */ maximumHostProgramCopyBytes:number;
	/** Scope and excluded process overhead. */ claim:string;
};

/** Independently callable invariant phase preparation input. */
type LocalSunShellPhaseRequest = {
	/** Stable matrix identity. */ id:string;
	/** Incoming physical unit directions. */ incoming:readonly UnitVector3[];
	/** Outgoing physical unit directions. */ outgoing:readonly UnitVector3[];
};
/** One terminal phase-worker reply. */
type LocalSunShellPhaseReply = {/** Complete successful transfer. */ ok:true; /** Owned scalar matrix. */ data:CacheData} |
	{/** Preparation failed. */ ok:false; /** Safe failure description. */ error:string};
/** Worker entry contract, distinct from the page global. */
interface LocalSunShellPhaseWorkerScope {
	/** Accept one phase request. */ onmessage:(event:MessageEvent<LocalSunShellPhaseRequest>)=>void;
	/** Transfer the owned result bytes to the host. */ postMessage(reply:LocalSunShellPhaseReply,transfer:Transferable[]):void;
}
/** Authenticated independent native-reference input and result used by convergence proofs. */
type LocalSunShellTransmissionCapturePath = {
	/** Whether this is the selected experimental mesh. */ candidate:boolean;
	/** Captured physical CPU segments and spectra. */ cpuRays:LocalSunRotationRayResult[];
	/** Matching GPU spectra at the same directions. */ gpuRays:LocalSunRotationGpuRayResult[];
};
/** Authenticated independent native-reference input and result used by convergence proofs. */
type LocalSunNativeReferenceLevel = {
	/** Physical source/medium and independently selected numerical support. */ input: {
		/** Independent horizontal support, meters. */ radial:number[];
		/** Independent altitude support, meters. */ altitudes:number[];
		/** Independent incoming polar cosines. */ mu:number[];
		/** Optional independently nested outgoing interpolation support. */ outgoingMu?:number[];
		/** Cyclic incoming azimuth resolution. */ phi:number;
		/** Simpson interval count. */ intervals:number;
		/** Batch-common optical-tail path policy. */ spectralBatch:number;
		/** Independently evaluated physical queries. */ queries:{/** Physical point, meters. */ point:number[]; /** Unit direction. */ direction:number[]}[];
	};
	/** Full independently computed spectral query packets. */ result:{
		/** Per-query quantities, each with all fifteen spectral channels. */ packets:Record<string,number[]>[];
	};
};

/** Shell layout controls, all lengths in meters. */
/** Host-authenticated first fresh-shell capture input. */
type LocalSunShellCaptureRequest = {
	/** Exact frozen orbital placement. */ state: LocalSunFrozenPlacement;
	/** Executable shell mesh. */ layout: LocalSunShellLayout;
	/** Reduced control grid, never a selected-profile pass. */ diagnostic: boolean;
	/** Explicit incoming-quadrature policy; absent preserves the original F68 prototype. */ incoming?:LocalSunShellIncomingPolicy;
	/** Prepare phase off-thread and yield between GPU layers in the app-development capture. */ cooperative?:boolean;
	/** Explicit candidate path-coordinate and optical-tail policy. */ transport?:LocalSunShellTransportPolicy;
	/** Use the identified analytic-column/positive-interval view and receiver rule. */ runtime?:boolean;
	/** Add a bounded common-input L2 quadrature diagnosis; never physical qualification. */ fieldProbe?:boolean;
};
/** Explicit experimental transport policies with unchanged physical acceptance limits. */
type LocalSunShellTransportPolicy = 'uniform120'|'square48-tail64'|'square120-tail64'|'column48-tail64';
/** Gaussian candidate polar quadrature node. */
type LocalSunShellPolarNode = {
	/** Direction cosine on [-1,1]. */ mu:number;
	/** Positive dimensionless polar integration weight. */ weight:number;
};
/** Continuous primary accuracy observations at pinned physical queries. */
type LocalSunIndependentAngularNode = {
	/** Unit physical direction. */ direction:UnitVector3;
	/** Integration weight, steradians. */ weight:number;
};
/** Owned scalar texture carrying shell interpolation support. */
type LocalSunShellNodeTexture = THREE.DataTexture;
/** Independent endpoint-refined azimuth quadrature tap. */
type LocalSunReferenceAzimuthNode = {
	/** Sorted physical angle, radians. */ phi:number;
	/** Positive radian integration weight. */ weight:number;
};
/** One independently positioned spectral scattering query. */
type LocalSunShellSecondaryQuery = {
	/** Source-relative physical x/y/z, meters. */ point:number[];
	/** Physical outgoing unit direction. */ direction:UnitVector3;
	/** Measured pure-order packets, keyed by J1/J2/J3/J4. */ orders:Record<string,number[]>;
};
/** Captured comparison subset read by an independent physical reference runner. */
type LocalSunShellSecondaryCapture = {
	/** Fresh comparison paths. */ results:{
		/** Whether this is the shell candidate. */ candidate:boolean;
		/** Independent physical query positions and measured orders. */ secondary:LocalSunShellSecondaryQuery[];
	}[];
};
/** Independent secondary-reference subset consumed by a later diagnosis. */
type LocalSunShellSecondaryProofSubset = {
	/** Selected physical point comparisons. */ results:{
		/** Canonical source-relative point, meters. */ point:number[];
		/** Frozen physical point ordinal. */ index:number;
		/** Physical outgoing unit vectors. */ outgoing:UnitVector3[];
		/** Measured GPU J2 packets. */ observed:number[][];
		/** Independently refined J2 packets. */ reference:number[][];
		/** Per-channel empirical reference uncertainty. */ uncertainty:number[][];
		/** Whether the unchanged reference convergence gates passed. */ converged:boolean;
	}[];
};
/** Continuous primary accuracy observations at pinned physical queries. */
type LocalSunShellPrimaryProof = {
	/** Proof schema. */ schema:string;
	/** Per-query measured candidate, independent reference and uncertainty. */ samples:{
		/** Primary source-density or transported primary-radiance quantity. */ quantity:string;
		/** Canonical source-relative x/y and altitude, meters. */ position:number[];
		/** Selected angular node. */ directionIndex:number;
		/** Unit propagation direction. */ direction:readonly number[];
		/** Measured GPU Native15 values. */ observed:number[];
		/** Independent binary64 Native15 values. */ reference:number[];
		/** Frozen per-channel physical tolerance observations. */ physical:LocalSunRotationResidual;
		/** Separately retained path refinements, when present. */ levels?:{/** Uniform Simpson interval count. */ intervals:number; /** Independent Native15 radiance. */ values:number[]}[];
		/** Maximum normalized successive changes. */ referenceDifferences?:number[];
		/** Whether path-only uncertainty/convergence meets the frozen rule. */ converged?:boolean;
	}[];
	/** Explicit scope of this bounded reference. */ claim:string;
};
/** Isolated browser capture capability. */
interface LocalSunShellBrowserBridge {
	/** Execute one new fresh control/candidate comparison. */ shellCapture(request:LocalSunShellCaptureRequest):Promise<string>;
}
/** Browser capture subset consumed by the host; full numerical facts remain serialized. */
type LocalSunShellHostCapture = {
	/** Capture version. */ schema:string;
	/** GL errors after both fresh paths. */ glErrors:number[];
	/** Each image and invalid-field observations. */ results:{
		/** Lossless browser image data URL. */ image:string;
		/** Complete readback finite/sign observations. */ field:{
			/** Nonfinite scalar count. */ nonfinite:number;
			/** Scalars below the declared absolute negative allowance. */ negative:number;
		};
	}[];
};
type LocalSunShellLayoutRequest = {
	/** Fixed source height above the slab. */ height: number;
	/** Atmosphere top. */ top: number;
	/** Source-centered horizontal construction truncation. */ maximumRho: number;
	/** Strictly ordered ground-to-top samples. */ altitudes: number[];
	/** Strictly ordered zero-to-one shell-resolution seeds. */ radialFractions: number[];
	/** Add ground-referenced shells across the near-axis radius-excess range. */ axisSupport?: boolean;
};
/** One conservative physical shell band. */
type LocalSunShellBand = {
	/** Stable physical identifier, including skipped bands. */ id: number;
	/** Inner Euclidean radius. */ inner: number;
	/** Outer Euclidean radius. */ outer: number;
	/** Tangent and uncertain bands remain admitted. */ admitted: boolean;
};
/** One compact scattering-field position. */
type LocalSunShellLayoutNode = {
	/** Compact sample address. */ index: number;
	/** Altitude reconstruction row. */ rowIndex: number;
	/** Physical shell identifier. */ band: number;
	/** Physical altitude. */ z: number;
	/** Physical horizontal offset. */ rho: number;
	/** Diagnostic Euclidean radius; not the precision lookup coordinate. */ radius: number;
	/** Cancellation-free radius relative to the row axis. */ excess: number;
	/** Unculled proof-only slot whose physical shell is outside the slab. */ emptyBand?: boolean;
};
/** Adjacent one-dimensional reconstruction samples. */
type LocalSunShellAxisTap = {
	/** Lower address. */ lower: number;
	/** Upper address. */ upper: number;
	/** Upper interpolation weight. */ weight: number;
};
/** Executable compact Euclidean shell topology. */
type LocalSunShellLayout = {
	/** Optional geometric bisection of physical boundary extinction-length support. */ boundaryExtinctionLengthMultiples?:number[];
	/** Layout version. */ schema: string;
	/** Explicit numerical reconstruction identity; absent preserves physical linear interpolation. */ reconstruction?:LocalSunShellReconstructionPolicy;
	/** Preserve Euclidean radius across altitude rows; absent is the historical horizontal-row control. */ interpolation?:'euclidean-radius';
	/** Source height. */ height: number;
	/** Slab top. */ top: number;
	/** Declared source-centered construction truncation. */ maximumRho: number;
	/** Ordered physical shell boundary radii. */ radii: number[];
	/** All physical bands, with conservative admission. */ bands: LocalSunShellBand[];
	/** Only admitted scattering samples. */ nodes: LocalSunShellLayoutNode[];
	/** Altitude rows with explicit axis and outer support. */ rows: {
		/** Altitude. */ z: number;
		/** Compact sample addresses. */ indices: number[];
		/** Radius-excess interpolation nodes. */ excesses: number[];
	}[];
	/** Physical bands receiving neither samples nor build work. */ omittedBands: number[];
	/** Occupied prefix length when an unculled proof retains explicit empty slots. */ occupiedNodeCount?: number;
};

/** Independent physical source and analytic transmission invariants. */
type LocalSunRotationSourceChecks = {
	/** Sentinel positions checked. */ samples: number;
	/** Source-distance invariance residual. */ maximumDistanceResidualMeters: number;
	/** Unattenuated spectrum versus the independent inverse-square equation. */ maximumInverseSquareRelative: number;
	/** Analytic top-path transmission rotational residual. */ maximumTransmissionResidual: number;
};

/** Complete finite-cylinder admission record. */
type LocalSunRotationCoverage = {
	/** Covered physical ray indices. */ admitted: number[];
	/** Excluded rays with their measured largest excess. */ excluded: {
		/** Ray index. */ index: number;
		/** Excess outside a physical boundary, meters. */ maximumExcessMeters: number;
	}[];
	/** Explicit coordinate-roundoff allowance, not domain expansion. */ roundoffToleranceMeters: number;
	/** Admission rule and clamp exclusion. */ rule: string;
};

/** Display-byte residuals are separate from physical field comparisons. */
type LocalSunRotationImageResidual = {
	/** Synthetic rotation. */ degrees: number;
	/** Number of RGB bytes compared. */ count: number;
	/** Maximum absolute byte difference. */ maximum: number;
	/** Nearest-rank p95 absolute difference. */ p95: number;
	/** Fixed comparison-panel order and amplification. */ panels: string;
};

/** Image-caption inputs passed across the isolated page boundary. */
type LocalSunRotationCaptionInputs = {
	/** Optional explicit rotation/displacement caption. */ poseLabel?:string;
	/** Source PNG data URL. */ source: string;
	/** Source width, pixels. */ width: number;
	/** Source height, pixels. */ height: number;
	/** Synthetic rotation label. */ degrees: number;
	/** Frozen orbital-time control identity. */ stateId: string;
};

/** Browser capability used to derive captions without retaining a viewer. */
interface LocalSunRotationCaptionPage {
	/** Evaluate one isolated caption operation. */ evaluate<T>(
		operation: (input: LocalSunRotationCaptionInputs) => Promise<T>,
		input: LocalSunRotationCaptionInputs,
	): Promise<T>;
}

/** Recorded field comparison; raw arrays were measured before hashing. */
type LocalSunRotationFieldComparison = {
	/** Public field identity. */ id: string;
	/** Complete field dimensions. */ storage: CacheFieldStorage;
	/** Measured raw-byte SHA-256. */ sha256: string;
	/** Every measured scalar comparison. */ reuse: LocalSunRotationResidual;
};

/** Numerical subset consumed by the post-run qualifier; detailed rays stay in angle artifacts. */
type LocalSunRotationAngleSummary = {
	/** Synthetic angle. */ degrees: number;
	/** Complete field comparisons. */ fields: LocalSunRotationFieldComparison[];
	/** Cumulative off-grid and boundary comparisons. */ spatial: LocalSunRotationSpatialResult;
	/** Pure-order reconstruction comparisons. */ orderSpatial: LocalSunRotationSpatialResult[];
	/** One-millimetre physical axis approach, distinct from rotational covariance. */ axisApproach: LocalSunRotationResidual;
	/** Independent source sentinels. */ sourceInvariants: LocalSunRotationSourceChecks;
	/** World-fixed physical ray admission. */ coverage: LocalSunRotationCoverage;
	/** Equivalent rotated ray admission. */ equivalentCoverage: LocalSunRotationCoverage;
	/** Fresh/reused CPU ray comparison. */ rayReuse: LocalSunRotationResidual;
	/** Fresh/reused GPU ray comparison. */ gpuReuse: LocalSunRotationResidual;
	/** CPU/GPU fresh radiance comparison. */ cpuGpu: LocalSunRotationResidual;
	/** CPU/GPU transmission comparison. */ transmission: LocalSunRotationResidual;
	/** Rotated CPU ray comparison. */ equivalentCpuResidual: LocalSunRotationResidual;
	/** Rotated GPU ray comparison. */ equivalentGpuResidual: LocalSunRotationResidual;
	/** Largest CPU/GPU endpoint error, meters. */ endpointMaximumMeters: number;
	/** Rays exceeding the frozen endpoint bound. */ endpointFailures: number;
	/** Cache build and field-readback wall time. */ buildMilliseconds: number;
};

/** Complete selected or diagnostic capture summary retained by the host. */
type LocalSunRotationCapture = {
	/** Supported output version. */ schema: string;
	/** Whether spatial axes were reduced. */ diagnostic: boolean;
	/** Exact requested angles. */ angles: number[];
	/** Per-angle numerical results. */ results: LocalSunRotationAngleSummary[];
	/** Display comparisons with common fresh adaptation. */ images: LocalSunRotationImageResidual[];
	/** Unhandled GL errors; required empty. */ glErrors: number[];
};

/** Frozen P2 recipe, authenticated by the Node host before browser transfer. */
/** Complete prepared exact-state publication; it is owned until its final lease releases. */
type LocalSunShellPublishedFrame = Readonly<{
	/** Optional ordinary colored-box scene owned by this exact frame. */ scene?:LocalSunShellSceneContract;
	/** Render the complete ordinary scene or its preserved suspended snapshot. */ renderScene?:()=>void;
	/** Immutable live-frame identity, including placement/time. */ identity:string;
	/** Complete canonical physical/numerical cache identity; caller owns qualification. */ cacheIdentity:string;
	/** Exact source owner facts, including finite position and spectrum. */ source:LocalSunLightSourceConfiguration;
	/** Matching observation and receiver state, without presentation interpolation. */ observation:GeometryObservation;
	/** Newly measured direct/diffuse/adaptation packet. */ receiver:ReceiverEnvironmentLightMeasurement;
	/** Matching scene light/shadow direction, derived at the same receiver position. */ directionToSource:UnitVector3;
	/** Prepared view uses the same backend and complete resident fields. */ viewPass:LocalSunControlViewPass;
	/** Opaque complete cache for paired transport proof. */ cache:GpuScatteringCache;
	/** Resource-owned backend for this exact field lifetime. */ backend:CacheGpuBackend & CacheProbeReader;
	/** Frame-owned model/geometry for coverage and CPU proof. */ owners:LocalSunRotationOwners;
	/** Actual application stage wall times; benchmark admission requires an exclusive repeated run. */ stageMilliseconds:{/** Facade/view/cache assembly and GPU construction. */ setup:number; /** View program compilation/preparation. */ view:number; /** Exact receiver sampling/reduction and adaptation. */ receiver:number};
	/** Actual runtime shader identities for diagnosing placement-induced program changes. */ shaderIdentities:{/** Complete sky view fragment source. */ view:string; /** Complete receiver transport fragment source. */ receiver:string};
	/** Dispose owned view/model resources; borrowed controllers are released separately. */ dispose:()=>void;
}>;

/** One shared cache owner, leased by prepared/published frames. */
interface LocalSunShellOwnedCacheController extends CacheController {
	/** Backend owned and retired with the controller; borrowed frames must use it. */ readonly backend:CacheGpuBackend & CacheProbeReader;
}

/** One shared cache owner, leased by prepared/published frames. */
type LocalSunShellSharedResource = {
	/** Accepted identity including all construction inputs. */ identity:string;
	/** Controller owns its cache, executor and backend; only the publication owner disposes it. */ controller:LocalSunShellOwnedCacheController;
	/** Complete owned resident cache, once constructed. */ cache:GpuScatteringCache|null;
	/** Shared first build completion, never a placement update. */ pending:Promise<GpuScatteringCache>|null;
	/** Number of live borrowed-controller leases. */ leases:number;
	/** Checked retained logical field/support bytes; excludes driver overhead. */ retainedBytes:number;
	/** Resource has been finally retired. */ disposed:boolean;
};

/** Frame record kept while renderer consumers still hold leases. */
type LocalSunShellFrameRecord = {
	/** Fully prepared exact state. */ frame:LocalSunShellPublishedFrame;
	/** Live publication owner plus external snapshots. */ leases:number;
	/** Borrowed cache-controller handles for this frame. */ borrowed:CacheController[];
	/** Exactly-once frame cleanup. */ disposed:boolean;
};

/** Leased frame snapshot for a renderer operation spanning an asynchronous boundary. */
type LocalSunShellFrameLease = Readonly<{
	/** Stable prepared frame until release. */ frame:LocalSunShellPublishedFrame;
	/** Idempotent release; never disposes another live frame's cache. */ release:()=>void;
}>;

/** Context supplied only to the current serialized preparation. */
type LocalSunShellFramePreparation = Readonly<{
	/** Supersession/caller cancellation, including receiver preparation. */ signal:AbortSignal;
	/** Acquire one frame-owned controller/backend lease over the shared canonical fields. */ borrowController:(factory:()=>LocalSunShellOwnedCacheController)=>LocalSunShellOwnedCacheController;
}>;

/** Complete requested application frame and conservative logical resource admission. */
type LocalSunShellFrameRequest = Readonly<{
	/** Expected prepared live-frame identity. */ identity:string;
	/** Frozen full construction identity; placement exclusion needs numerical admission. */ cacheIdentity:string;
	/** Exact cumulative field/support retention after build. */ retainedCacheBytes:number;
	/** Conservative complete new-build peak, including its retained fields. */ peakBuildBytes:number;
	/** Persistent immutable/view bytes present during preparation. */ otherPersistentBytes:number;
	/** Optional caller cancellation. */ signal?:AbortSignal;
	/** Prepare all exact-state view and lighting facts before atomic publication. */ prepare:(context:LocalSunShellFramePreparation)=>Promise<LocalSunShellPublishedFrame>;
}>;

/** Frozen P2 recipe, authenticated by the Node host before browser transfer. */
type LocalSunRotationRecipe = {
	/** Authenticated exact-time states; synthetic rotation and lifecycle recipes cannot be combined. */ shellTemporalStates?:LocalSunShellTemporalState[];
	/** Fresh forces a separately built cache per exact state; reuse retains the canonical numerical field. */ shellTemporalMode?:LocalSunShellTemporalMode;
	/** Execute the actual application in an owned transferred-canvas worker; page responsiveness is measured independently. */ shellWorker?:boolean;
	/** Render the ordinary six-box scene with exact measured lighting and unchanged per-object shadow maps. */ shellScene?:boolean;
	/** Optional bounded physical Mie albedo replacement; all density/extinction/phase controls remain pinned. */ shellMieAlbedo?:number;
	/** Exercise successful height, Mie-albedo and source-power replacement after the initial frame. */ shellReplacements?:boolean;
	/** Exercise actual observer movement and a source-centered coverage exit with a new compact domain. */ shellCoverageExit?:boolean;
	/** Exercise actual owned GPU failure/cancellation and frame-lease behavior after the happy path. */ shellLifecycle?:boolean;
	/** Exercise prepared exact-state application publication; no motion encoding. */ shellApplication?:boolean;
	/** Host-frozen application and worker executable identities. */ shellImplementationIdentity?:string;
	/** New experiment-owned shell layout; absent retains P2 control. */ shellLayout?: LocalSunShellLayout;
	/** Select owned analytic-column runtime integration instead of the control rule. */ shellRuntime?:boolean;
	/** Distinct incoming quadrature for an explicitly revised shell numerical policy. */ shellIncoming?:LocalSunIncomingDirectionDomain;
	/** Experimental horizontal source displacement, meters. */ shellPlacementOffset?:readonly [number,number];
	/** Optional observer displacement for an equivalent physical-frame check, meters. */ shellObserverOffset?:readonly [number,number];
	/** Optional explicit shell poses with unique artifact keys. */ shellPoses?:{/** Synthetic rotation, degrees. */ degrees:number; /** Source displacement, meters. */ offset:readonly [number,number]; /** Unique numeric artifact key. */ key:number}[];
	/** Current-resolved Flat 0, never a holdout candidate. */ state: LocalSunFrozenPlacement;
	/** Select bounded z5/rho5 or selected z19/rho15; both retain N4/W27/F68/15 channels. */ diagnostic: boolean;
	/** Synthetic fixed-offset degrees, always beginning with zero. */ angles: number[];
	/** Produce a short reused-path motion clip after comparisons. */ motion: boolean;
	/** Explicit corrective candidate; absent preserves original control. */ candidate?: LocalSunCorrectionCandidate;
};

/** Per-channel normalized discrepancy between exact-time fresh/reused derivatives. */
type LocalSunShellTemporalDerivativeResidual = {
	/** Maximum normalized fresh/reused first-difference discrepancy. */ first:number;
	/** Maximum normalized fresh/reused second-difference discrepancy. */ second:number;
};

/** Required observed subset of one exact-time GPU application frame. */
type LocalSunShellTemporalFrame = {
	/** Exact frozen presentation slot. */ artifactKey:number;
	/** Exact physical observation, without presentation interpolation. */ observation:Observation;
	/** Actual same-frame finite source and spectra. */ source:LocalSunLightSourceConfiguration;
	/** Measured exact-state receiver spectra. */ receiver:ReceiverEnvironmentLightMeasurement;
	/** Complete 96-direction, 15-channel GPU rays. */ measuredGpuPackets:{/** Path radiance. */ radiance:number[]; /** Transmission. */ transmittance:number[]}[];
	/** Whether the actual GPU cache owner was retained. */ reused:boolean;
	/** Same-frame CPU/GPU proof counters. */ cpuGpu:LocalSunRotationResidual;
	/** Same-frame transmission proof counters. */ transmission:LocalSunRotationResidual;
	/** Maximum observed endpoint discrepancy, metres. */ endpointMaximumMeters:number;
	/** Complete ray admission with no unqualified outside sample. */ coverage:{/** Admitted ray indices. */ admitted:number[]; /** Excluded ray indices. */ excluded:number[]};
	/** Wall time including pending GPU work and receiver completion. */ preparedMilliseconds:number;
	/** Seven wall-time render samples after one warmup, when selected. */ warmFrameMilliseconds?:number[];
};

/** Sealed exact-time application measurements; physical qualification is separate. */
type LocalSunShellTemporalCapture = {
	/** Application capture schema identity. */ schema:string;
	/** Actual ordered GPU frames. */ results:LocalSunShellTemporalFrame[];
	/** Observed combined conservative logical payload. */ applicationPayload:{/** Maximum bytes. */ upperBytes:number};
	/** Independently observed actual page scheduling. */ pageResponsiveness:{/** Maximum gap, milliseconds. */ maximumGapMilliseconds:number};
};

/** Experiment proof hook over a newly owned backend; ordinary frames omit it. */
type LocalSunShellFrameProofHook = (backend:CacheGpuBackend & CacheProbeReader)=>void;

/** Staged P2 correction identities.
 * - **"axis"** - Co-rotating axis/frame correction only.
 * - **"local"** - Axis correction and source-relative build arithmetic.
 * - **"covered"** - Local arithmetic and complete rotation coverage.
 * - **"precision"** - Covered candidate with higher-precision endpoints.
 */
type LocalSunCorrectionCandidate = 'axis' | 'local' | 'covered' | 'precision';

/** Independently owned physical components of one fresh synthetic placement. */
type LocalSunRotationOwners = {
	/** Active source-relative geometry. */ geometry: FlatEarthGeometry;
	/** Finite physical source with pinned power and height. */ source: LocalSunLightSource;
	/** Exact spatial/angular domains. */ domains: LocalSunConstructionDomainSelection;
	/** Accepted Native15 execution profile. */ profile: Algorithm32ExecutionProfile;
	/** Public rendering facade. */ facade: Algorithm32;
	/** Explicit public shared model for CPU/GPU diagnostic transport. */ model: SharedModel;
};

/** Complete resident GPU field read back before executor disposal. */
type LocalSunRotationField = {
	/** Scalar texture dimensions. */ storage: CacheFieldStorage;
	/** Complete layer-major measured FP32 values. */ values: Float32Array;
};

/** Identical physical reconstruction inputs shared across pure/cumulative proof fields. */
type LocalSunShellSpatialPoint = {
	/** Physical query, meters. */ position:Position;
	/** Positive compact node taps and spectral reconstruction factors. */ taps:{/** Compact node address. */ index:number; /** Spatial weight. */ weight:number; /** Fifteen physical factor ratios. */ spectral:number[]}[];
};

/** Fields evaluated together at every existing spatial/angle proof query. */
type LocalSunShellSpatialFieldPair = {
	/** Complete fresh measured field. */ fresh:LocalSunRotationField;
	/** Complete canonical measured field. */ reused:LocalSunRotationField;
};

/** Frozen channel-limit evaluation; all failures remain counted. */
type LocalSunRotationResidual = {
	/** Compared scalar count. */ count: number;
	/** Largest absolute residual in quantity units. */ maximumAbsolute: number;
	/** Largest error divided by absolute-plus-relative limit. */ maximumRatio: number;
	/** Scalars exceeding their individual limit. */ failures: number;
	/** Nonfinite scalar pairs, also counted as failures. */ nonfinite: number;
	/** Scalars below the negative tolerance. */ negative: number;
	/** Flattened index of worst finite ratio. */ worstIndex: number;
};

/** CPU common-path result on measured field values; not an independent physical oracle. */
type LocalSunRotationRayResult = {
	/** Fifteen radiance-density channels. */ radiance: number[];
	/** Fifteen dimensionless transmission channels. */ transmittance: number[];
	/** Exact resolved finite ray segment. */ segment: RaySegment;
	/** Physical integration samples used to check coverage. */ samples: Position[];
};

/** GPU common-path diagnostic ray result. */
type LocalSunRotationGpuRayResult = {
	/** Fifteen radiance channels. */ radiance: number[];
	/** Fifteen transmission channels. */ transmittance: number[];
	/** GPU start distance in meters. */ start: number;
	/** GPU end distance in meters. */ end: number;
	/** High-part endpoint readback in meters. */ endHigh: number;
	/** Low-part endpoint, zero for the original diagnostic. */ endLow: number;
};

/** Inputs to the experiment-owned production-transport diagnostic ingress. */
type LocalSunRotationGpuRayRequest = {
	/** Yield while GPU readback is pending; exact readback values are unchanged. */ cooperativeReadback?:boolean;
	/** Use the ordinary receiver's FP32 normalized direction ingress. */ receiverDirections?:boolean;
	/** Cancel between completed GPU operations without disposing in-flight resources. */ signal?:AbortSignal;
	/** Frame-owned receiver program retention; its owner disposes the material. */ programRetention?:LocalSunShellReceiverProgram;
	/** Physical frame and accepted profile. */ owners: LocalSunRotationOwners;
	/** Live fresh or canonical cache. */ cache: GpuScatteringCache;
	/** Opaque GPU resource adapter. */ backend: ThreeCacheBackend;
	/** Caller-owned Three renderer. */ renderer: LocalSunRotationRenderer;
	/** World-fixed or rotated unit vectors. */ directions: readonly UnitVector3[];
};

/** Render and readback operations used by the experiment's diagnostic adapter. */
interface LocalSunRotationRenderer extends ShaderRuntimePassRenderer {
	/** Cooperative fence-backed readback, with target lifetime retained until completion. */ readRenderTargetPixelsAsync(target:object,x:number,y:number,width:number,height:number,values:Float32Array):Promise<ArrayLike<number>>;
	/** Current target restored after probes. */ getRenderTarget(): object | null;
	/** Read RGBA float diagnostic pixels. */ readRenderTargetPixels(
		target: object,
		x: number,
		y: number,
		width: number,
		height: number,
		values: Float32Array,
	): void;
}

/** Mutable uniform handles shared with the installed diagnostic material. */
type LocalSunRotationUniformMap = Record<string, {/** Borrowed renderer value. */ value: unknown}>;

/** Capture the first view-cache installation without changing its lifecycle. */
type LocalSunRotationBindingCapture = {
	/** Public backend request retained for explicit reuse substitution. */ current: CacheRuntimeBindingInstallRequest | null;
};

/** Complete spatial and seam comparison results. */
type LocalSunRotationSpatialResult = {
	/** Number of physical query/direction combinations. */ queries: number;
	/** Distinct direction sentinels including perturbed seams. */ directions: number;
	/** Spatial node, midpoint and boundary probes. */ spatialPoints: number;
	/** Canonical values sampled in the fresh geometry's frame. */ directFrame: LocalSunRotationResidual;
	/** Strict inverse-rotation query away from axis fallback. */ inverseTransformAwayFromAxis: LocalSunRotationResidual;
	/** Strict inverse-rotation query at the fallback axis. */ inverseTransformAtAxis: LocalSunRotationResidual;
	/** Canonical source position in meters. */ canonicalSource: readonly number[];
};

/** Independently callable browser/host proof boundary. */
interface LocalSunRotationBridge {
	/** Execute the actual transferred-canvas application and retain separate page scheduling evidence. */ localSunShellApplicationWorker(recipe:LocalSunRotationRecipe):Promise<string>;
	/** Execute one diagnostic or selected rotation matrix. */ localSunRotation(
		recipe: LocalSunRotationRecipe,
	): Promise<string>;
	/** Flush a uniquely named artifact through the checked run host. */ localSunRotationArtifact(
		name: string,
		json: string,
	): Promise<void>;
}

/** Independently usable owner of one allocated evidence run. */
interface LocalSunExperimentRunContract {
	/** Checked absolute run directory. */ readonly root: string;
	/** Allocated sequence and label. */ readonly name: string;
	/** Whether terminal inventory has been published. */ sealed: boolean;
	/** Serialized progress-write completion. */ tail: Promise<void>;
	/** Active heartbeat handle until finalization. */ heartbeat: NodeJS.Timeout;
	/** Append and flush an ordered progress event. */ progress(
		phase: string,
		message: string,
		state?: LocalSunEnvironmentRunState,
	): Promise<void>;
	/** Write an artifact once within the run. */ write(relative: string, bytes: string | Uint8Array): Promise<void>;
	/** Inventory closed artifacts and publish the terminal manifest. */ finish(
		state: LocalSunEnvironmentRunState,
		failure?: string | null,
	): Promise<void>;
}

/** Independently callable browser capture boundary. */
interface LocalSunControlBridge {
	/** Capture a selected-profile control and return its serialized facts. */ localSunControl(): Promise<string>;
}

/** Public view-pass operations borrowed from production installation. */
type LocalSunControlViewPass = {
	/** Select the default framebuffer. */ renderToScreen: boolean;
	/** Render with the caller's black sky-only scene input. */ render(
		renderer: ShaderRuntimePassRenderer,
		output: ShaderRuntimePassRenderTarget | null,
		input: ShaderRuntimePassRenderTarget,
	): void;
};

/** Selected-profile control output before image bytes are split into an artifact. */
type LocalSunControlCapture = {
	/** Versioned capture identity. */ schema: string;
	/** Production-resolved exact location and instant. */ observation: GeometryObservation;
	/** Selected angular, spectral and order inventory. */ profile: Flat32ModeSummary;
	/** Physical source placement and spatial axes. */ geometry: FlatEarthGeometryConfiguration;
	/** Public allocation requests, not measured device memory. */ allocations: LocalSunControlAllocation[];
	/** Uploaded immutable texture payloads observed at the backend boundary. */ immutableAllocations: LocalSunControlImmutableAllocation[];
	/** Complete view preparation and exact-state receiver measurement wall time. */ preparedMilliseconds: number;
	/** Five warm frame wall times, each ending with an explicit GPU drain. */ frameMilliseconds: number[];
	/** Fresh exact-state receiver measurement, no temporal smoothing. */ receiverLight: unknown;
	/** Backend-admitted storage capabilities. */ capabilities: unknown;
	/** Actual GPU renderer identity. */ hardware: string;
	/** Renderer resource counts; not native device-memory byte telemetry. */ rendererMemory: unknown;
	/** Wall time including a GPU completion drain. */ buildMilliseconds: number;
	/** Production diagnostics at capture. */ diagnostics: unknown;
	/** Lossless image data URL before runner extraction. */ image?: string;
};

/** An immutable texture upload observed through the public backend. */
type LocalSunControlImmutableAllocation = {
	/** Declared input identity. */ id: string;
	/** Exact typed payload bytes. */ bytes: number;
	/** Dimensions and format. */ storage: CacheImmutableTextureUploadRequest['storage'];
};

/** A cache backend's public field allocation. */
type LocalSunControlAllocation = {
	/** Declared field identity. */ id: string;
	/** Scalar array dimensions and format. */ storage: CacheFieldSpec['storage'];
	/** Logical scalar bytes requested, excludes driver overhead. */ bytes: number;
};

/** Exact public production placement without a cache build. */
type LocalSunFrozenPlacement = {
	/** Exact observation used by the public resolver. */ observation: GeometryObservation;
	/** Configured geometry and axes. */ geometry: FlatEarthGeometryConfiguration;
	/** Actual selected domains. */ summary: Flat32ModeSummary;
	/** Public finite-source calibration. */ source: LocalSunLightSourceConfiguration;
	/** Selected path and scattering controls. */ execution: Algorithm32Config['execution'];
};

/** Read-only subset of the historical visual fixture used for overlap checks. */
type LocalSunHistoricalFixture = {
	/** Historical exact source placements. */ states: {
		/** Stable flat-angle id. */ id: string;
		/** Physical x/y/z meters. */ centerMeters: number[];
	}[];
};

/** Invariant and convergence observations from continuous transmission. */
type LocalSunReferenceCalibration = {
	/** Versioned result. */ schema: string;
	/** Maximum reciprocal channel error. */ reciprocityError: number;
	/** Maximum composed-segment channel error. */ compositionError: number;
	/** Exact unit transmission at zero distance. */ zeroPathPassed: boolean;
	/** Trapezoid convergence against the analytic column. */ quadrature: {
		/** Number of uniform intervals. */ intervals: number;
		/** Difference from the analytic density column, meters. */ densityColumnErrorMeters: number;
	}[];
	/** Exact limits of this calibration claim. */ claim: string;
};

/** Sealed run shape authenticated before reading a parent artifact. */
type LocalSunParentManifest = {
	/** Supported version. */ schema: string;
	/** Unique parent name. */ run: string;
	/** Terminal disposition. */ state: LocalSunEnvironmentRunState;
	/** Closed artifact identities. */ artifacts: LocalSunEnvironmentArtifactIdentity[];
};

/** Authenticated immutable parent input. */
type LocalSunParentArtifact = {
	/** Parent run. */ run: string;
	/** Exact manifest hash. */ manifestSha256: string;
	/** Manifest-listed artifact. */ artifact: string;
	/** Exact artifact hash. */ artifactSha256: string;
	/** Artifact contents for derivation. */ bytes: Uint8Array;
};

/** Gate fields consumed during resource calibration; the entire fixture is retained by hash. */
type LocalSunGateCalibrationInputs = {
	/** Supported gate version. */ schema: string;
	/** Required quantity definitions, opaque during resource calibration. */ quantities: unknown[];
	/** Frozen resource criteria. */ resources: {
		/** Combined active/staging payload ceiling. */ maximumCombinedLogicalPayloadBytes: number;
		/** Maximum full cache-build wall time. */ maximumBuildMilliseconds: number;
		/** Maximum shader and receiver preparation time. */ maximumPreparedMilliseconds: number;
	};
};

/** Terminal run disposition.
 * - **"accepted"** - The run passed its declared setup capability gates.
 * - **"rejected"** - A candidate was evaluated and rejected.
 * - **"failed"** - Execution or a required setup gate failed.
 * - **"interrupted"** - Execution ended before evaluation completed.
 */
type LocalSunEnvironmentRunState = 'accepted' | 'rejected' | 'failed' | 'interrupted';

/** Browser capability facts; these do not qualify atmospheric calculations. */
type LocalSunEnvironmentBrowserFacts = {
	/** Whether a WebGL2 context was obtained. */
	webgl2: boolean;
	/** Whether float-color render targets are exposed. */
	floatColor: boolean;
	/** Reported renderer identity, or null without a context. */
	renderer: string | null;
	/** Reported vendor identity, or null without a context. */
	vendor: string | null;
	/** Maximum texture side length in pixels. */
	maximumTextureSize: number;
	/** Fragment-stage texture image unit count. */
	fragmentTextureUnits: number;
	/** Whether the browser exposes the WebCodecs encoder API. */
	videoEncoder: boolean;
	/** Whether the loopback document has a secure browser context. */
	secureContext: boolean;
};

/** Exact identity of one closed run artifact. */
type LocalSunEnvironmentArtifactIdentity = {
	/** Run-relative path using forward slashes. */
	path: string;
	/** Exact closed byte count. */
	byteLength: number;
	/** SHA-256 of those bytes. */
	sha256: string;
};

/** Streaming artifact identity; the full payload is not retained. */
type LocalSunArtifactDigest = {
	/** Exact number of bytes observed. */ byteLength:number;
	/** SHA-256 of every observed byte. */ sha256:string;
};

/** One sampled aggregate of the guard and its owned child tree. */
type LocalSunHostResourceSample = {
	/** Native collector's internal elapsed census/read time, milliseconds. */ collectorMilliseconds?:number;
	/** Committed private memory summed across owned processes. */ privateBytes:number;
	/** Resident working sets; shared pages can be counted more than once. */ workingSetBytes:number;
	/** Owned process identifiers present at measurement. */ pids:number[];
	/** Available machine physical memory, bytes. */ freeBytes:number;
	/** UTC measurement instant. */ timestamp:string;
};

/** Independently integrated receiver ray with its positive angular weight. */
type LocalSunNativeWeightedView = LocalSunNativeViewResult & {
	/** Cosine-weighted solid-angle contribution. */ weight:number;
};

/** Reference-only primary phase subtraction and restored angular mean. */
type LocalSunReceiverPrimaryControl = {
	/** Signed Native15 correction to primary irradiance. */ correction:number[];
	/** Positive phase-integration and roundoff uncertainty. */ errorBounds:number[];
	/** Physical polar row and coefficients fitted solely from existing reference rays. */ rows:LocalSunReceiverPrimaryControlRow[];
	/** Exact derivation method and limitations. */ operation:string;
};

/** Reproducible primary model at one constant physical polar cosine. */
type LocalSunReceiverPrimaryControlRow = {
	/** Physical vertical cosine. */ mu:number;
	/** Sum of original positive angular weights. */ mass:number;
	/** Maximum/minimum scattering-cosine sample indices in the row. */ extrema:number[];
	/** Rayleigh/Mie coefficients per spectral channel. */ coefficients:number[][];
	/** Analytic Rayleigh mean and successive Gaussian Mie means. */ means:{rayleigh:number;mie:number[]};
};

/** Independent positive receiver polar integration rule.
 * - **"gauss"** - Gaussian polar control.
 * - **"gauss-square"** - Gaussian squared polar variable.
 * - **"gauss-sinh5"** - Gaussian horizon-focused variable.
 * - **"trapezoid-sinh5"** - Positive composite horizon-focused variable.
 */
type LocalSunNativeReceiverRule = 'gauss'|'gauss-square'|'gauss-sinh5'|'trapezoid-sinh5';

/** Independent reference polar change of variable.
 * - **"uniform"** - Untransformed polar coordinate.
 * - **"sinh5"** - Horizon-focused sinh variable with scale five.
 * - **"sinh10"** - Horizon-focused sinh variable with scale ten.
 */
type LocalSunNativePolarTransform = 'uniform'|'sinh5'|'sinh10';

/** Independent incoming azimuth integration rule.
 * - **"uniform"** - Uniform periodic angular samples.
 * - **"quadrant-gauss"** - Endpoint-refined quadrant Gaussian samples.
 */
type LocalSunNativeAzimuthRule = 'uniform'|'quadrant-gauss';

/** Actual construction policy for an exact-time trajectory.
 * - **"fresh"** - Independently build each exact frame's cache.
 * - **"reuse"** - Retain compatible canonical fields between frames.
 */
type LocalSunShellTemporalMode = 'fresh'|'reuse';

/** Versioned incoming shell construction quadrature.
 * - **"control"** - Original production incoming rule.
 * - **"partitioned"** - Separately partitioned product rule.
 * - **"partitioned-midpoint48"** - Midpoint product successor.
 */
type LocalSunShellIncomingPolicy = 'control'|'partitioned'|'partitioned-midpoint48';

/** Positive shell reconstruction normalization.
 * - **"incident-density"** - Direct-attenuated incident normalization.
 * - **"geometric-density"** - Geometric/extinction normalization.
 */
type LocalSunShellReconstructionPolicy = 'incident-density'|'geometric-density';

/** Nested outgoing interpolation support's sine exponent.
 * - **2** - Original symmetric sine-squared support.
 * - **4** - Nested refinement with denser horizon support.
 */
type LocalSunNativeOutgoingPower = 2|4;

/** Authenticated native constants and axes used by the separate operator-bound proof.
 * The original input's other properties are preserved when deriving the replay input.
 */
type LocalSunNativeOperatorInput = {
	/** Source altitude above the flat ground, metres. */ height:number;
	/** Upper atmosphere altitude, metres. */ top:number;
	/** Rayleigh density scale height, metres. */ rayleighHeight:number;
	/** Mie density scale height, metres. */ mieHeight:number;
	/** Cornette-Shanks asymmetry, in [0,1). */ g:number;
	/** Mie scattering albedo, in [0,1]. */ albedo:number;
	/** Fifteen ground-level Rayleigh extinction coefficients, inverse metres. */ betaR:number[];
	/** Fifteen ground-level Mie extinction coefficients, inverse metres. */ betaM:number[];
	/** Fifteen unattenuated source irradiances at the reference distance. */ irradiance:number[];
	/** Nonnegative source power multiplier. */ sourceScale:number;
	/** Positive source normalization distance, metres. */ referenceDistance:number;
	/** Native integration interval parameter. */ intervals:number;
	/** Executed incoming polar cosine nodes. */ mu:number[];
	/** Executed periodic incoming azimuth count. */ phi:number;
	/** Native periodic origin offset, zero or one half. */ phiOffset:number;
	/** Number of spectral channels sharing a packet path, one through three. */ spectralBatch:number;
	/** Exact query inventory whose kernel cases must all be replayed. */ queries:LocalSunNativeOperatorQuery[];
	/** Ordered horizontal-distance field support, metres. */ radial:number[];
	/** Ordered field altitude support, metres. */ altitudes:number[];
};

/** One exact physical point and propagation direction in the native replay inventory. */
type LocalSunNativeOperatorQuery = {
	/** Three-dimensional physical Cartesian point, metres. */ point:number[];
	/** Three-dimensional unit propagation direction. */ direction:number[];
};

/** Analytic upper envelope for one normalized continuous primary source channel. */
type LocalSunNativePrimaryEnvelope = {
	/** Maximum interval endpoint bound on J1 divided by local extinction. */ maximum:number;
	/** Lower and upper altitude endpoints of the maximizing interval, metres. */ interval:number[];
};

/** Source-independent positive-kernel maxima from the exact frozen native helpers. */
type LocalSunNativePositiveOperatorMeasurement = {
	/** Versioned replay result identity. */ schema:'native-positive-operator-v1';
	/** Primary and higher-order maximum transport masses, fifteen channels each. */ maximumKernelMass:number[][];
	/** Maximum executed outgoing grid phase-row mass. */ phaseGridMaximum:number;
	/** Maximum exact query outgoing phase-row mass. */ phaseQueryMaximum:number;
	/** Largest actual quadrature count recorded by the native path helper. */ maximumPathSamples:number;
	/** Count of replayed transport kernel cases. */ cases:number;
	/** Number of replayed field positions. */ positions:number;
	/** Number of distinct exact query points. */ queryPoints:number;
	/** Measured elapsed replay time, milliseconds. */ elapsedMilliseconds:number;
};
