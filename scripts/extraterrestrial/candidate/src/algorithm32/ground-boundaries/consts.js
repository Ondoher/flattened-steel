/** Identify the ground-boundary descriptor schema. */
export const GROUND_BOUNDARY_SCHEMA_REVISION = 'algorithm32-ground-boundary-v1';

/** Identify the uniform Lambertian spectral ground model. */
export const UNIFORM_LAMBERTIAN_GROUND_MODEL =
	'uniform-lambertian-spectral-ground-v1';

/** Identify an explicitly configured uniform Lambertian boundary by default. */
export const DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID =
	'algorithm32-uniform-lambertian-ground-v1';

/** Convert hemispherical Lambertian reflectance into BRDF. */
export const LAMBERTIAN_BRDF_SCALE = 1 / Math.PI;

/** Identify packets derived by the uniform Lambertian boundary. */
export const UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX =
	'algorithm32-uniform-lambertian-brdf-v1';

/** Identify the interchangeable ground-BRDF construction capability. */
export const GROUND_CACHE_REFLECTANCE_SYMBOL = 'ground.reflectance';

/** Identify the uniform Lambertian ground's construction module. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID =
	'algorithm32-uniform-lambertian-ground-cache-module-v1';

/** Identify the typed spectral BRDF construction binding. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID =
	'uniform-lambertian-ground-cache-brdf';

/** Name the typed spectral BRDF construction binding in GLSL. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME =
	'uCacheGroundBrdf';

/** Identify the uniform Lambertian BRDF accessor source block. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID =
	'uniform-lambertian-ground-cache-brdf-function';

/** Name the uniform Lambertian BRDF accessor in construction GLSL. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME =
	'cacheGroundBrdf';
