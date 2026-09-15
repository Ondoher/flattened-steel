/** One checked replacement in the original raw scatter fragment. */
type SkyGroundBoundaryReplacement = Readonly<{
	/** Exact unique original source bytes. */ original: string;
	/** Declared replacement bytes. */ replacement: string;
}>;

/** Exact scalar texture address, distinct from any view interpolation weight. */
type SkyGroundBoundaryCoordinate = Readonly<{
	/** Outgoing column. */ x: number;
	/** Flattened solar/altitude row. */ y: number;
}>;

/** Original compiler request with separate bounded ground verification support. */
type SkyGroundBoundaryCompileRequest = SkySixCompileRequest &
	Readonly<{
		/** One through 128 unique exact-ground coordinates; not extra scored rays. */ groundProbeCoordinates: readonly SkyGroundBoundaryCoordinate[];
	}>;

/** Fill one reusable contiguous Float32 readback buffer without retaining it. */
type SkyGroundBoundaryRowReader = (firstRow: number, rowCount: number, values: Float32Array) => void;
/** Awaited caller-owned deadline/resource progress hook. */
type SkyGroundBoundaryProgress = (stage: string) => Promise<void>;

/** Exact bytes of one complete non-ground solar block. */
type SkyGroundBoundaryHashChunk = Readonly<{
	/** First included texture row. */ firstRow: number;
	/** Number of included contiguous rows. */ rowCount: number;
	/** Actual Float32 byte count. */ byteLength: number;
	/** SHA-256 of the exact chunk bytes. */ sha256: string;
}>;

/** Complete ordered non-ground inventory, not a sampled equality claim. */
type SkyGroundBoundaryFieldHash = Readonly<{
	/** Versioned field-manifest schema. */ schemaId: string;
	/** Outgoing texture columns. */ width: number;
	/** Heights per solar block. */ altitudeCount: number;
	/** Number of complete solar blocks. */ solarCount: number;
	/** Exactly all rows except position index zero in each block. */ selection: string;
	/** Bytes are unmodified little-endian Float32 values. */ encoding: string;
	/** Ordered complete chunk identities. */ chunks: readonly SkyGroundBoundaryHashChunk[];
	/** Number of included scalar values. */ scalarCount: number;
	/** Largest reusable readback buffer, excluding transient digest copy. */ maximumReadbackBytes: number;
	/** Digest of the versioned ordered manifest, not concatenated raw-field SHA-256. */ manifestSha256: string;
}>;

/** Exact shared-domain equality after both complete inventories were hashed. */
type SkyGroundBoundaryParity = Readonly<{
	/** Original unmodified scatter inventory. */ shadow: SkyGroundBoundaryFieldHash;
	/** Corrected scatter inventory on the same rows. */ corrected: SkyGroundBoundaryFieldHash;
	/** True only after exact manifest digest equality. */ equal: true;
}>;

/** Observed raw source change at one declared exact-ground verification coordinate. */
type SkyGroundBoundaryGroundSample = Readonly<{
	/** Outgoing scalar column. */ x: number;
	/** Flattened ground row. */ y: number;
	/** Original solar knot index. */ solarZenithIndex: number;
	/** Exact Float32-packed outgoing vector used by the shaders. */ outgoingDirectionFloat32: SkyVector3;
	/** Original raw J2 shadow value. */ shadowValue: number;
	/** New raw J2 value. */ correctedValue: number;
	/** Binary64 subtraction of the two Float32 observations. */ difference: number;
}>;

/** Structural L1 ownership proof backed by the actual pass ledger and object assertions. */
type SkyGroundBoundaryL1Preservation = Readonly<{
	/** Versioned structural proof, not a claimed historical/full-field L1 hash. */ schemaId: string;
	/** Original live radiance field. */ fieldId: string;
	/** One allocation/draw creates this texture. */ createdOnce: true;
	/** Both scatter passes read original L1. */ scatterInputFieldIds: readonly string[];
	/** Their distinct output field identities. */ scatterOutputFieldIds: readonly string[];
	/** Exact JavaScript/WebGL object identity checked after both passes. */ sameTextureObject: true;
	/** Every actual draw rejects output/input texture aliasing. */ outputAliasingRejected: true;
	/** No texture uploads occur after original allocation. */ uploadsAfterCreation: 0;
	/** No subsequent draw attaches L1 as an output. */ drawsTargetingL1AfterCreation: 0;
	/** Shadow released before corrected J2 allocation. */ shadowReleasedBeforeCorrected: true;
}>;

/** Logical recurrence storage; actual process and GPU overhead remain runner observations. */
type SkyGroundBoundaryMemory = Readonly<{
	/** One outgoing scalar texture. */ jBytes: number;
	/** One incoming scalar texture. */ lBytes: number;
	/** Peak under the enforced sequential-shadow schedule. */ peakScalarBytes: number;
	/** Descriptive alternative cost if both J2 textures were retained. */ simultaneousShadowBytes: number;
	/** Original unchanged scalar cap. */ maximumScalarBytes: number;
	/** Actual selected schedule. */ shadowReleasedBeforeCorrected: true;
}>;

/** Inputs required for a separate independent CPU boundary prediction. */
type SkyGroundBoundaryPredictionInputs = Readonly<{
	/** Exact original arguments to the authenticated common shader generator. */ commonParameters: SkySixCommonParameters;
	/** Original direction xyz and steradian weight operands after Float32 packing. */ incomingPackedFloat32: readonly number[];
	/** Strict receiver-local lower hemisphere. */ groundHemisphere: string;
	/** Clarifies irradiance units rather than radiance naming. */ sourceQuantity: string;
	/** Direct attenuation multiplies spectral irradiance. */ sourceTransmittanceOperation: string;
}>;

/** Actual source transformation identities, independent of numerical admission. */
type SkyGroundBoundaryShaderDerivation = Readonly<{
	/** Original full scatter shader bytes including common source. */ originalScatterSha256: string;
	/** Corrected full scatter shader bytes including common source. */ correctedScatterSha256: string;
	/** Exact intervention and stage-selection operation. */ operation: string;
}>;

/** Compact actual intervention evidence; the runner owns source and physical admissions. */
type SkyGroundBoundaryCompilerEvidence = Readonly<{
	/** Distinct compiler evidence schema. */ schemaId: string;
	/** Four actual scattering orders, never relabeled six-order data. */ actualOrders: readonly number[];
	/** Additional unmodified scatter output. */ shadowFieldId: string;
	/** Captured propagated pure source fields. */ correctedFieldIds: readonly string[];
	/** Complete exact equality outside the sole intervened altitude row. */ nonGroundParity: SkyGroundBoundaryParity;
	/** Actual same-texture/no-alias preservation evidence. */ l1Preservation: SkyGroundBoundaryL1Preservation;
	/** Small explicitly requested raw endpoint observations. */ groundSamples: readonly SkyGroundBoundaryGroundSample[];
	/** Frozen and enforced recurrence storage. */ memory: SkyGroundBoundaryMemory;
	/** Exact encoded/angular/source input derivation. */ predictionInputs: SkyGroundBoundaryPredictionInputs;
	/** Original/new shader identities. */ shaderDerivation: SkyGroundBoundaryShaderDerivation;
	/** Pending physical and Float32-allowance assessment; compiler parity alone cannot pass it. */ groundNumericalGate: string;
	/** Historical evidence is sparse and its validation belongs to the authenticating caller. */ historicalParityScope: string;
}>;

/** New compiler protocol; the original broad report contract remains unchanged. */
type SkyGroundBoundaryCompilerReport = SkyGpuCompilerReport &
	Readonly<{
		/** Must be sky-ground-boundary-wavelength-result-v1. */ schemaId: 'sky-ground-boundary-wavelength-result-v1';
		/** All newly typed boundary evidence. */ boundary: SkyGroundBoundaryCompilerEvidence;
	}>;

/** Self-verifying source, hash coverage, memory and half-space algebra proof. */
type SkyGroundBoundaryProof = Readonly<{
	/** Distinct local proof identity. */ schemaId: string;
	/** Number of actual executed assertions. */ checks: number;
	/** Largest observed packed Rayleigh half-space deviation in the manufactured proof. */ maximumPackedRayleighDeviation: number;
	/** Physical GPU compilation and radiation are not performed by this entry. */ gpuExecuted: false;
}>;
