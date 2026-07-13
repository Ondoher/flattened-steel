/** Store the leading character used by GLSL preprocessor directives. */
export const GLSL_DIRECTIVE_PREFIX = String.fromCharCode(35);

/** Store the default context for assembly-only shader builds. */
export const EMPTY_SHADER_BUILD_CONTEXT = {
	automaticAssembly: false,
	cacheController: null,
	cache: null,
	cacheIdentity: null,
	createdCacheController: false,
	celestialCacheController: null,
	celestialCache: null,
	celestialCacheIdentity: null,
	createdCelestialCacheController: false,
	mainRequiredSymbols: null,
};
