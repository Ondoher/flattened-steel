/** Frozen parameters and exact production shader text for a diagnostic GPU draw. */
type SunCoverageDiagnosticInput = Readonly<{
	/** Actual projected Sun radius from the parent capture, pixels. */ radius: number;
	/** Actual bottom-left screen centre from the parent capture, pixels. */ center: readonly number[];
	/** Source-local coverage samples per output-pixel axis. */ samples: number;
	/** Square source-local tile extent, texels. */ resolution: number;
	/** Unchanged production full-screen vertex shader. */ vertex: string;
	/** Unchanged production analytic-coverage fragment shader. */ fragment: string;
	/** Unchanged production coverage-consumer function. */ consumer: string;
}>;
/** One source-local texel whose pixel box cannot intersect the mathematical circle. */
type SunCoverageOutsideSample = Readonly<{
	/** Tile column. */ x: number;
	/** Tile row. */ y: number;
	/** GPU R32F value at that texel. */ coverage: number;
}>;
/** One actual consumer lookup at an output pixel near the Sun. */
type SunCoverageScreenSample = Readonly<{
	/** Output image column. */ x: number;
	/** Output image row, top-left convention. */ y: number;
	/** Actual GPU linearly filtered coverage. */ coverage: number;
	/** Pixel box is mathematically disjoint from the circle. */ outside: boolean;
}>;
/** Complete raw readback plus compact geometric support analysis. */
type SunCoverageDiagnosticResult = Readonly<{
	/** Diagnostic schema. */ schema: string;
	/** Material and dimensions used for the readback. */ input: SunCoverageDiagnosticInput;
	/** Raw R32F tile values, bottom-left row-major. */ tile: readonly number[];
	/** Number of mathematically disjoint texel samples. */ outsideCount: number;
	/** Disjoint texels with strictly positive actual GPU coverage. */ positiveOutsideCount: number;
	/** Largest spurious coverage among disjoint texels. */ maximumOutsideCoverage: number;
	/** Largest 32 disjoint positive samples. */ largestOutside: readonly SunCoverageOutsideSample[];
	/** Actual filtered lookups for the ten-by-ten output-pixel region. */ screen: readonly SunCoverageScreenSample[];
	/** Final WebGL error. */ glError: number;
	/** GPU/driver identity reported by the context. */ renderer: string;
	/** Scope of the diagnostic rather than a physics or color claim. */ scope: string;
}>;
/** Host entry point exposed by the diagnostic bundle. */
interface SunCoverageDiagnosticBridge {
	/** Execute only the coverage and consumer draws, then release all GPU resources. */ readSunCoverage(
		input: SunCoverageDiagnosticInput,
	): Promise<SunCoverageDiagnosticResult>;
}
