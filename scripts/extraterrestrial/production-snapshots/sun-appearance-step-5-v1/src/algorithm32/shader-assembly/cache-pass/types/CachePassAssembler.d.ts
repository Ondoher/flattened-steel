/** Source block paired with its deterministic cache-module position. */
type CacheShaderBlockEntry = Readonly<{
	/** Cache-module shader block. */
	block: CacheShaderBlock;
	/** Deterministic position of the owning module. */
	moduleIndex: number;
}>;

/** Renderer-neutral assembler of owner modules into cache-pass shaders. */
class CachePassAssembler implements CacheAssembler {
	/**
	 * Call this method to assemble one logical pass and its executor-resolved output field.
	 * @param pass - The pass value accepted by the operation.
	 * @param output - The output value accepted by the operation.
	 * @returns - The result produced by the operation.
	 */
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}
