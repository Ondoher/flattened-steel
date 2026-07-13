/** Executable final-view options resolved for Algorithm32 transport. */
type Algorithm32ResolvedTransportOptions = Readonly<{
	/** Accepted path-integration interval count. */
	pathIntervalCount: number;
	/** Accepted shader path-sample distribution or the default-selection sentinel. */
	pathSampleDistribution: ShaderPathSampleDistribution | null;
}>;
