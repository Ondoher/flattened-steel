/** Matched physical requests; only the contained compiler stencil differs. */
type AltitudeHorizonControl = {
	/** Exact deployed Native48/Native15/F68 receiver-local controls. */ readonly baseline: DistantSunSceneCacheCompilerBuildRequest;
	/** Same physical and numerical controls, with an independent diagnostic identity. */ readonly candidate: DistantSunSceneCacheCompilerBuildRequest;
};

/** One compiled spectral channel with sparse pure-order invariance witnesses. */
type AltitudeCompiledChannel = {
	/** Ordered Float32 sum of J1 through J4 at the requested coordinates. */
	readonly total: Float32Array;
	/** J1 through J4 at the registered sparse source-density probes. */
	readonly orders: readonly (readonly number[])[];
};

/** Aggregate display-space measurements within one camera-elevation band. */
type AltitudeImageBand = {
	/** Number of included pixel centers. */
	readonly count: number;
	/** Mean encoded sRGB red, green and blue bytes in that order. */
	readonly rgb: readonly number[];
	/** Mean inverse-sRGB display luminance, normalized to display white. */
	readonly luminance: number;
	/** Ratio of summed encoded red to summed encoded blue. */
	readonly redBlueRatio: number;
	/** Difference between largest and smallest mean RGB divided by the largest. */
	readonly chroma: number;
};
