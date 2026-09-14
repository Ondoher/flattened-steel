/** Validated resolutions for one isolated second-order refinement prediction. */
type DialRefinementCounts = Readonly<{
	/** Resolution of the first retained calculation. */ coarse: number;
	/** Strictly finer resolution of the second retained calculation. */ medium: number;
	/** Supported, strictly finer resolution to predict before execution. */ target: number;
}>;

/** In-memory admission proofs; these do not execute a solver or retain evidence. */
type DialPredictionContractProof = Readonly<{
	/** Total positive and negative admission checks completed. */ checks: number;
	/** Descriptions of valid control relationships accepted by the contracts. */ acceptedCases: readonly string[];
	/** Descriptions of invalid control relationships rejected by the contracts. */ rejectedCases: readonly string[];
}>;
