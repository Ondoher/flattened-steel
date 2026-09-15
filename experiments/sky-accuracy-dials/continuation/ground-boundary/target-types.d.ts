/** Registered raw J2-only ground interventions. */
type SkyGroundBoundaryCaseId = 'ground-j2-p48-raw' | 'ground-j2-p55-raw';
/** Original sparse-union control with separate endpoint proof support. */
type SkyGroundBoundaryTargetControl = SkyGpuControl &
	Readonly<{
		/** Explicit target schema. */ executionSchemaId: 'sky-ground-boundary-control-v1';
		/** Prospective target identity. */ caseId: SkyGroundBoundaryCaseId;
		/** Four actual regenerated orders. */ actualOrders: readonly [1, 2, 3, 4];
		/** Root-owned deadline including a separate finalization reserve. */ deadlineEpochMilliseconds: number;
		/** Separate raw endpoint support; never added to the historical parity union. */ groundProofProbes: readonly SkyContinuationProbe[];
	}>;
/** Exact unmodified J2 sparse evidence from the same live original L1. */
type SkyGroundBoundaryShadowProof = Readonly<{
	/** Versioned additional callback identity. */ schemaId: 'sky-ground-boundary-shadow-proof-v1';
	/** Complete original sparse-union length. */ coordinateCount: number;
	/** Original ordered Uint32 xy pairs. */ coordinateSha256: string;
	/** Separate captured field. */ fieldId: 'J2-shadow';
	/** Original immutable comparison field. */ originalFieldId: 'J2';
	/** Actual scalar count. */ count: number;
	/** Minimum finite field value. */ minimum: number;
	/** Maximum finite field value. */ maximum: number;
	/** Exact Float32 little-endian values hash. */ pureSha256: string;
}>;
/** Actual lifecycle event; optional fields are validated according to operation. */
type SkyGroundBoundaryTargetLedger = Readonly<{
	/** Allocation, pass, readback or release. */ operation: string;
	/** Exact recurrence stage identity. */ id: string;
	/** Actual scalar bytes for allocation/release. */ bytes?: number;
	/** Resulting live scalar bytes. */ liveBytes?: number;
	/** Shader output stage for a pass. */ outputField?: string;
	/** Ordered texture input identities. */ inputFields?: readonly string[];
	/** Actual post-delete texture observation. */ isTextureAfterDelete?: boolean;
	/** Number of all selected readback scalars. */ scalarCount?: number;
	/** Largest transient readback buffer. */ maximumReadbackBytes?: number;
	/** Exact canonical chunk-manifest digest. */ manifestSha256?: string;
}>;
/** Actual root-independent GPU pass/readback elapsed measurement. */
type SkyGroundBoundaryTargetTiming = Readonly<{
	/** Recurrence pass or complete hash stage. */ id: string;
	/** Observed elapsed duration. */ milliseconds: number;
	/** Output stage; null for readback. */ outputField: string | null;
	/** Consumed exact stage identities. */ inputFields: readonly string[];
}>;
/** New actual compiler report plus separately intercepted sparse shadow callback. */
type SkyGroundBoundaryTargetCompilerReport = SkyGroundBoundaryCompilerReport &
	Readonly<{
		/** Exact common GLSL returned by the authenticated browser generator and actually supplied to every fragment. */ commonShaderSource: string;
		/** Original full-union shadow identity, separate from corrected fields. */ shadowProof: SkyGroundBoundaryShadowProof;
		/** Actual same-context query, performed before recurrence compilation. */ arithmeticPrecision: SkyGroundArithmeticPrecision;
		/** Actual lifecycle retained without species reruns. */ ledger: readonly SkyGroundBoundaryTargetLedger[];
		/** Actual pass and hash work. */ timings: readonly SkyGroundBoundaryTargetTiming[];
	}>;

/** Strict cross-engine common-source derivation; shader hashes themselves remain exact. */
type SkyGroundBoundaryCommonComparison = Readonly<{
	/** Versioned narrow comparison. */ schemaId: string;
	/** Exact independently generated Node common bytes. */ nodeSha256: string;
	/** Exact browser common bytes supplied to the shaders. */ browserSha256: string;
	/** Only one- or two-binary64-ULP cosine differences with identical Float32 encodings are permitted. */ differingCosineIndexes: readonly number[];
}>;
/** Two authenticated already-adequate physical morning channels. */
type SkyGroundBoundaryMorningReference = Readonly<{
	/** Exact accepted morning assessment. */ run: string;
	/** Pinned seal and reference artifact. */ identities: readonly DialFileIdentity[];
	/** Complete combined az64/G8 reference with its empirical allowance. */ channels: readonly Readonly<{
		/** Original channel. */ channel: number;
		/** Admitted physical P2. */ referenceWatts: number;
		/** Empirical reference allowance. */ allowanceWatts: number;
	}>[];
}>;
/** Physical comparison availability is separate from a positive intervention sign. */
type SkyGroundBoundaryPhysicalComparison =
	| Readonly<{
			/** Adequate physical parent exists. */ state: 'available';
			/** Matched physical P2. */ referenceWatts: number;
			/** Parent empirical allowance. */ referenceAllowanceWatts: number;
			/** Original effective P2 minus physical reference. */ beforeErrorWatts: number;
			/** Corrected effective P2 minus physical reference. */ afterErrorWatts: number;
	  }>
	| Readonly<{
			/** Matched reference is not yet admitted. */ state: 'unresolved';
			/** Explicit missing parent explanation. */ reason: string;
	  }>;
/** Effective grouped E2-E1 measurement and prospective positive sign predicate. */
type SkyGroundBoundaryP2Row = Readonly<{
	/** One selected original C0 ray. */ probeId: string;
	/** Original zero/eight channel. */ channel: number;
	/** Historical grouped E2-E1. */ beforeWatts: number;
	/** Regenerated grouped E2-E1. */ afterWatts: number;
	/** Corrected minus original P2. */ deltaWatts: number;
	/** Original E1 plus E2 fixed-field view allowance. */ beforeAllowanceWatts: number | null;
	/** Corrected E1 plus E2 fixed-field view allowance. */ afterAllowanceWatts: number | null;
	/** All four independent envelope allowances, null if incomplete. */ comparisonAllowanceWatts: number | null;
	/** Strict delta greater than comparison allowance; missing evidence unresolved. */ state: SkyVolumeCheckState;
	/** Descriptive physical comparison, with no inferred Kider forecast. */ physical: SkyGroundBoundaryPhysicalComparison;
}>;
/** Complete or explicitly incomplete local ground arithmetic admission. */
type SkyGroundBoundaryNumericalAdmission = Readonly<{
	/** Explicit independently bounded arithmetic schema. */ schemaId: 'sky-ground-boundary-numerical-admission-v2';
	/** All selected endpoint comparisons and runtime prerequisites. */ state: SkyVolumeCheckState;
	/** True only after both complete channel comparisons pass. */ primitiveBoundsComplete: boolean;
	/** Frozen primitive and operand-conversion policy. */ policy: SkyGroundArithmeticPolicy;
	/** Actual completed channel comparisons; missing channels remain unresolved. */ channels: readonly SkyGroundArithmeticChannelAdmission[];
	/** Exact scope or missing/failed prerequisite. */ reason: string;
}>;
/** One frozen channel's pre-target bound. */
type SkyGroundArithmeticChannelPlan = Readonly<{
	/** Original zero/eight channel. */ channel: number;
	/** Bound computed before target samples. */ plan: SkyGroundArithmeticPlan;
}>;
/** One retained actual channel's local numerical verdict. */
type SkyGroundArithmeticChannelAdmission = Readonly<{
	/** Original zero/eight channel. */ channel: number;
	/** Immutable actual comparison artifact. */ artifact: DialFileIdentity;
	/** Literal comparison outcome. */ state: string;
}>;
/** Minimal immutable target dispatch contract, not a replacement for the full derivation. */
type SkyGroundBoundaryRunParameters = Readonly<{
	/** Owning run schema stage. */ extensionStage: string;
	/** Exact original C0. */ continuationRegistration: string;
	/** Prospective target. */ caseId: SkyGroundBoundaryCaseId;
}>;
/** Closed channel metadata; large actual report/diagnostics have separate authenticated gzip identities. */
type SkyGroundBoundaryChannelMetadata = Omit<SkyGpuChannelSummary, 'compilerReport' | 'diagnostics'> &
	Readonly<{
		/** Explicit regenerated four-order schema. */ schemaId: 'sky-ground-boundary-spectra-v1';
		/** Actual order sequence. */ actualOrders: readonly number[];
		/** Physical spectral radiance units. */ units: string;
		/** Exact little-endian Float64 spectra. */ spectra: DialFileIdentity;
		/** Full original seven-method rows. */ diagnosticArtifact: DialFileIdentity;
		/** Actual new compiler protocol and shadow proof. */ boundaryArtifact: DialFileIdentity;
		/** Explicit tensor flattening. */ layout: string;
	}>;
/** Exactness and local work evidence for one completed channel. */
type SkyGroundBoundaryChannelAdmission = Readonly<{
	/** Original channel. */ channel: number;
	/** Full historical J1/shadow-J2 union matched. */ sparseUnionParityPassed: true;
	/** Every non-ground J2 field byte matched. */ nonGroundParityPassed: true;
	/** Same L1, no alias or rewrite, original reflection schedule. */ l1StructuralProofPassed: true;
	/** Exact original shadow scope. */ shadow: SkyGroundBoundaryShadowProof;
	/** Actual endpoint proof observations. */ groundSampleCount: number;
	/** All forty-probe N1-N4 view envelopes admitted. */ envelopesAdmitted: boolean;
	/** Actual view evaluation cost. */ evaluationCount: number;
	/** Original shared reference-column preparation cost. */ preparationEvaluationCount: number;
	/** Includes extra scatter and both full hash durations. */ timings: readonly SkyGroundBoundaryTargetTiming[];
	/** Includes shadow allocation/release/pass. */ ledger: readonly SkyGroundBoundaryTargetLedger[];
}>;
/** Retained explicit failure; no missing values become fabricated successes. */
type SkyGroundBoundaryFailure = Readonly<{
	/** Original failure string. */ message: string;
	/** Original stack when supplied by an Error. */ stack?: string;
}>;
/** Complete authenticated numerical evidence for one selected wavelength. */
type SkyGroundBoundaryReadChannel = Readonly<{
	/** Original channel. */ channel: number;
	/** Full original representations/views and actual N1-N4 shape. */ shape: SkyEvaluationShape;
	/** Complete regenerated radiance tensor. */ values: Float64Array;
	/** Full forty-probe seven-method envelopes. */ diagnostics: SkyContinuationChannelDiagnostics;
	/** Complete actual new compiler payload. */ report: SkyGroundBoundaryTargetCompilerReport;
	/** Reproduced endpoint numerical inclusion tests. */ arithmetic: SkyGroundArithmeticAssessment;
	/** Original shadow exactness evidence. */ shadow: SkyGroundBoundaryShadowProof;
	/** Morning and noon selected P2 records. */ p2: readonly SkyGroundBoundaryP2Row[];
}>;
/** Read-only authenticated target with measurement and numerical claims kept distinct. */
type SkyGroundBoundaryTargetRead = Readonly<{
	/** Immutable new capture. */ run: string;
	/** Registered P48/P55 target. */ caseId: SkyGroundBoundaryCaseId;
	/** Complete consumed parent and target identities. */ identities: readonly DialFileIdentity[];
	/** Original selectors plus separate endpoint proof extension. */ control: SkyGroundBoundaryTargetControl;
	/** Both complete regenerated four-order channel records. */ channels: readonly SkyGroundBoundaryReadChannel[];
	/** Four primary ray/channel P2 records. */ p2: readonly SkyGroundBoundaryP2Row[];
	/** Separately authenticated composed local arithmetic admission. */ groundAdmission: SkyGroundBoundaryNumericalAdmission;
}>;
/** Focused self-verifying target contract and allowance algebra proof. */
type SkyGroundBoundaryTargetProof = Readonly<{
	/** Separate local-only proof schema. */ schemaId: string;
	/** Number of actual assertions executed. */ checks: number;
	/** No physical/GPU evidence executed. */ gpuExecuted: false;
}>;
