/** One scalar spectral ray; physical contains betaR, betaM, irradiance, ground albedo. */
type SkyMcGroup = Readonly<{
	/** Diagnostic ray index. */ ray: number;
	/** Spectral component index. */ channel: number;
	/** Camera position in km. */ origin: number[];
	/** Unit sight direction. */ direction: number[];
	/** Scalar physical coefficients. */ physical: number[];
}>;
/** Frozen stochastic resolution controls. */
type SkyMcProfile = Readonly<{
	/** Configuration label. */ name: string;
	/** Solar optical-depth quadrature, 32 or 64. */ transmission: number;
	/** Independent batches per scalar ray. */ batches: number;
	/** First interaction subject to compensated termination. */ rouletteStart: number;
	/** Initial-state offset; equal offsets pair attenuation refinements. */ seedOffset: number;
}>;
/** Browser execution request. */
type SkyMcRequest = Readonly<{
	/** Fixed physical ray/channel combinations. */ groups: readonly SkyMcGroup[];
	/** Fixed resolution and replication matrix. */ profiles: readonly SkyMcProfile[];
	/** Independent paths in each batch, multiple of 256. */ pathsPerBatch: number;
	/** Browser work deadline, excluding host cleanup reserve. */ maximumMilliseconds: number;
}>;
/** Compact independently generated batch evidence. */
type SkyMcBatch = Readonly<{
	/** Profile identifier. */ profile: string;
	/** Scalar ray/channel selector. */ group: number;
	/** Independent batch index. */ batch: number;
	/** Means for total, first, second, third-and-higher radiance. */ means: number[];
	/** Largest visited interaction count. */ maximumDepth: number;
}>;
/** Execution identity and separately reported shader compilation. */
type SkyMcExecution = Readonly<{
	/** Hardware renderer. */ renderer: string;
	/** Compile and link elapsed time. */ compileMilliseconds: number;
	/** All browser execution and readback elapsed time. */ milliseconds: number;
	/** Completed group batches. */ completed: number;
}>;
/** Monte Carlo batch-mean estimate, in spectral W units. */
type SkyMcEstimate = Readonly<{
	/** Sample average. */ mean: number;
	/** Estimated sampling standard error. */ standardError: number;
	/** Approximate marginal 95% interval half-width, conservative t factor for >=32 batches. */ halfWidth95: number;
	/** Number of independent batch means. */ batches: number;
}>;
