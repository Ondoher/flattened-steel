/** Shader-configuration error with its machine-readable failure details. */
type ShaderConfigurationError = Error & {
	/** Stable machine-readable shader-validation failure code. */
	code: string;

	/** Compatibility report that caused shader assembly to fail. */
	details: ShaderSymbolValidationReport;
};

/** Contribution-owned source line used for deterministic assembly ordering. */
type ShaderContributionLineEntry = Readonly<{
	/** Contribution that owns the source line. */
	contribution: ShaderContribution;

	/** Source line ordered within its contribution group. */
	line: string;
}>;

/**
 * Contribution property containing ordered shader source blocks.
 *
 * - **"functions"** - Function-definition source blocks.
 * - **"mainHooks"** - Main-function hook source blocks.
 */
type ShaderSourceBlockProperty = 'functions' | 'mainHooks';
