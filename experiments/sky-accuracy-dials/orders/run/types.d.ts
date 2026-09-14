/** Exact production-prefix comparison reported by the browser. */
type DialOrdersPrefixProof = Readonly<{
	/** Sparse coordinate count for the parent's original view union. */ coordinateCount: number;
	/** Uint32 little-endian coordinate identity. */ coordinateSha256: string;
	/** Exact parent representation/view/four-order/ray shape. */ shape: SkyEvaluationShape;
	/** Pure and Float32 cumulative identities for J1 through J4. */ fieldChecks: readonly SkyGpuFieldCheck[];
	/** Complete parent's four-order binary64 spectra identity. */ spectraSha256: string;
	/** Actual six-order evaluator's first-four-stage equality on the primary view plan, when executed. */ sixOrderEvaluatorPrefix?: Readonly<{
		/** Compared binary64 scalar count on every primary ray and representation. */ comparisons: number;
		/** Required exact scalar equality. */ bitExact: boolean;
	}>;
}>;

/** Authenticated retained four-order channel used as a parity authority. */
type DialOrdersParentChannel = Readonly<{
	/** Exact retained metadata bytes. */ metadata: DialFileIdentity;
	/** Exact retained binary64 spectra bytes. */ spectra: DialFileIdentity;
	/** Expected original browser output. */ expected: DialOrdersPrefixProof;
}>;

/** Accepted matching screen, authenticated before extended GPU work. */
type DialOrdersParent = Readonly<{
	/** Immutable screen directory. */ run: string;
	/** Exact accepted parent seal. */ seal: DialFileIdentity;
	/** Exact original browser recipe, including its view union. */ control: SkyGpuControl;
	/** Parent artifacts that establish configuration, execution, and parity. */ artifacts: readonly DialFileIdentity[];
	/** Ordered authorities for channels zero and eight. */ channels: readonly DialOrdersParentChannel[];
}>;

/** Compact controls distinguishing actual extended recurrence from the pinned N4 request. */
type DialOrdersControl = SkySixControl &
	Readonly<{
		/** Explicit schema for the contained six-stage driver. */ executionSchemaId: string;
		/** Actual pure scattering stages executed by the new driver. */ actualOrders: readonly number[];
	}>;

/** One channel's retained equality evidence, including mismatches on failure. */
type DialOrdersParityChannel = Readonly<{
	/** Direct40 channel index. */ channel: number;
	/** Original authenticated channel metadata. */ parentMetadata: DialFileIdentity;
	/** Original authenticated four-order spectral bytes. */ parentSpectra: DialFileIdentity;
	/** Expected coordinate, field, and spectral identities. */ expected: DialOrdersPrefixProof;
	/** Actual browser proof; null if absent or malformed. */ actual: DialOrdersPrefixProof | null;
	/** Whether all original prefix identities matched exactly. */ passed: boolean;
	/** Preserved assertion error, if any. */ failure: string | null;
}>;

/** One compact channel retained for local six-order analysis. */
type DialOrdersRetainedChannel = Readonly<{
	/** Direct40 channel index. */ channel: number;
	/** Explicit six-order shape. */ shape: SkyEvaluationShape;
	/** Authenticated derived spectral file. */ spectra: DialFileIdentity;
	/** Exact little-endian binary64 bytes. */ bytes: Buffer;
}>;

/** Measurement fit of one actual cumulative stage on the two diagnostic channels. */
type DialOrdersScore = Readonly<{
	/** First-order representation. */ representation: SkyRepresentation;
	/** Actual cumulative scattering stage from one through six. */ order: number;
	/** Physical boundary score, always labelled as partial channel coverage. */ score: DialBoundaryScore;
}>;
