/** Value that identifies the uniform Lambertian spectral ground model. */
export const UNIFORM_LAMBERTIAN_GROUND_MODEL = 'uniform-lambertian-spectral-ground-v1';

/** Value that identifies an explicitly configured uniform Lambertian boundary by default. */
export const DEFAULT_UNIFORM_LAMBERTIAN_GROUND_ID = 'algorithm32-uniform-lambertian-ground-v1';

/** Value that identifies the initial built-in uniform-Lambertian material. */
export const UNIFORM_LAMBERTIAN_GROUND_MATERIAL = 'grass';

/** Value that identifies the retained Bruneton grass table after exact Native-15 bin averaging. */
export const GRASS_ALBEDO_PROVENANCE_IDENTITY = 'algorithm32-bruneton-grass-native-15-bin-average-v1';

/**
 * Native-15 bin-average grass albedo derived from the retained Bruneton 45-sample table by piecewise-linear integration with constant endpoint extension.
 *
 * @type {readonly number[]}
 */
export const GRASS_NATIVE_15_ALBEDO_VALUES = [
	0.019048226950354637, 0.02364468085106386, 0.029747517730496487, 0.03198794326241139, 0.03727375886524819,
	0.07302127659574442, 0.08300354609929061, 0.0623652482269502, 0.05144397163120558, 0.03979361702127652,
	0.05599361702127641, 0.24616808510638172, 0.5058297872340412, 0.5784297872340411, 0.5869829787234028,
];

/** Value that converts hemispherical Lambertian reflectance into BRDF. */
export const LAMBERTIAN_BRDF_SCALE = 1 / Math.PI;

/** Value that identifies packets derived by the uniform Lambertian boundary. */
export const UNIFORM_LAMBERTIAN_BRDF_PROVENANCE_PREFIX = 'algorithm32-uniform-lambertian-brdf-v1';

/** Value that identifies the interchangeable ground-BRDF construction capability. */
export const GROUND_CACHE_REFLECTANCE_SYMBOL = 'ground.reflectance';

/** Value that identifies the uniform Lambertian ground's construction module. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_MODULE_ID = 'algorithm32-uniform-lambertian-ground-cache-module-v1';

/** Value that identifies the typed spectral BRDF construction binding. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_ID = 'uniform-lambertian-ground-cache-brdf';

/** Name the typed spectral BRDF construction binding in GLSL. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BINDING_NAME = 'uCacheGroundBrdf';

/** Value that identifies the uniform Lambertian BRDF accessor source block. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_BLOCK_ID = 'uniform-lambertian-ground-cache-brdf-function';

/** Name the uniform Lambertian BRDF accessor in construction GLSL. */
export const UNIFORM_LAMBERTIAN_GROUND_CACHE_BRDF_FUNCTION_NAME = 'cacheGroundBrdf';
