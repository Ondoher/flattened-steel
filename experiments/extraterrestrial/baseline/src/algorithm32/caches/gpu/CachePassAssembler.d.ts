/** Assemble renderer-neutral owner modules into one construction shader. */
export class CachePassAssembler implements CacheAssembler {
	/** Assemble one logical pass and its executor-resolved output field. */
	assemble(pass: CachePass, output: CacheFieldSpec): CacheShader;
}

export default CachePassAssembler;
