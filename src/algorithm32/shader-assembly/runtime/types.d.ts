/**
 * Outcome of one shader-symbol compatibility validation.
 *
 * - **"accepted"** - Every required symbol has one accepted provider.
 * - **"rejected"** - A duplicate, missing, or otherwise fatal symbol conflict exists.
 */
type ShaderSymbolValidationStatus = 'accepted' | 'rejected';

/** Type for one shader symbol validation report. */
type ShaderSymbolValidationReport = {
	/** Value that stores whether validation accepted or rejected the request. */
	readonly status: ShaderSymbolValidationStatus;

	/** Value that stores sorted provided symbols. */
	readonly providedSymbols: readonly string[];

	/** Value that stores sorted required symbols. */
	readonly requiredSymbols: readonly string[];

	/** Value that stores symbols provided by multiple contributions. */
	readonly duplicateProvidedSymbols: readonly string[];

	/** Value that stores required symbols not provided by contributions or the runtime skeleton. */
	readonly missingRequiredSymbols: readonly string[];

	/** Value that stores provided symbols not required by the request. */
	readonly unusedProvidedSymbols: readonly string[];

	/** Value that stores non-fatal validation messages. */
	readonly warnings: readonly string[];

	/** Value that stores fatal validation messages. */
	readonly errors: readonly string[];
};

/** Type that supplies one shader assembly request. */
type ShaderAssemblyRequest = {
	/** Value that stores owner-supplied shader contributions. */
	readonly contributions: readonly ShaderContribution[];

	/** Value that stores symbols required by the shared main skeleton. */
	readonly mainRequiredSymbols: readonly string[];

	/** Value that stores symbols supplied by the runtime skeleton rather than a contribution. */
	readonly systemProvidedSymbols?: readonly string[];

	/** Optional ordered standard-pipeline stages that must complete before the assembled consumer executes. */
	readonly generationStages?: readonly CelestialGenerationStageDescription[];
};

/** Type for one accepted shader assembly result. */
type ShaderAssemblyResult = {
	/** Value that stores the accepted assembly status. */
	readonly status: 'accepted';

	/** Value that stores the assembled fragment shader source. */
	readonly fragmentShaderSource: string;

	/** Value that stores a stable hash of the assembled source. */
	readonly sourceHash: string;

	/** Value that stores sorted accepted contributions. */
	readonly contributions: readonly ShaderContribution[];

	/** Value that stores the validation report used for assembly. */
	readonly validationReport: ShaderSymbolValidationReport;

	/** Value that stores sorted runtime binding requirements. */
	readonly bindingRequirements: readonly ShaderBindingRequirement[];

	/** Ordered standard-pipeline generation stages retained for runtime installation. */
	readonly generationStages?: readonly CelestialGenerationStageDescription[];

	/** Value that stores internal assembly diagnostics. */
	readonly diagnostics: unknown;
};

/** Type for a shader assembler collaborator. */
type ShaderAssembler = {
	/**
	 * Call this method to assemble one shader request.
	 *
	 * @param request - Supplies the validated shader assembly request.
	 * @returns - The assembled shader source and binding declarations.
	 */
	assemble(request: ShaderAssemblyRequest): ShaderAssemblyResult;
};

/** Type that supplies construction options for the shader assembler. */
type ShaderAssemblerConfiguration = {
	/** Value that stores an optional validation collaborator. */
	readonly validator?: ShaderCompatibilityValidator;
};

/** Contract that describes the compatibility validator consumed by shader assemblers. */
interface ShaderCompatibilityValidator {
	/**
	 * Call this method to validate contribution and symbol compatibility.
	 * @param request - The request accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	validate(request: ShaderAssemblyRequest): ShaderSymbolValidationReport;
}
