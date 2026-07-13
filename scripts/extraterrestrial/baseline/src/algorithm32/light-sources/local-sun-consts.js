import {
	createCacheConstructionControlsDescriptor,
} from '../caches/CacheConstructionControlsDescriptor.js';

/** Select the default endpoint ambient-light intensity range. */
export const LOCAL_SUN_DEFAULT_SCENE_AMBIENT_INTENSITY_RANGE = {
	min: 0.06,
	max: 0.5,
};

/** Declare accepted endpoint shadow request properties. */
export const LOCAL_SUN_SHADOW_REQUEST_PROPERTIES = [
	'enabled',
	'objects',
];

/** Declare accepted endpoint shadow-object request properties. */
export const LOCAL_SUN_SHADOW_OBJECT_REQUEST_PROPERTIES = [
	'objectKey',
	'layerIndex',
	'focus',
	'extent',
	'cameraLeft',
	'cameraRight',
	'cameraTop',
	'cameraBottom',
	'lightDistance',
	'cameraNear',
	'cameraFar',
	'mapSize',
	'bias',
	'normalBias',
	'radius',
	'shadowIntensity',
];

/** Declare accepted endpoint indirect-fill request properties. */
export const LOCAL_SUN_ENDPOINT_INDIRECT_FILL_REQUEST_PROPERTIES = [
	'enabled',
	'policy',
	'intensityRatio',
	'distance',
];

/** Identify the completed local-Sun cumulative runtime sampler. */
export const LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME =
	'uLocalSunCumulativeScatteringDensityCache';

/** Identify local-Sun binary32 GPU field provenance. */
export const LOCAL_SUN_GPU_FIELD_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-gpu-fields-v3';

/** Identify the source-owned local-Sun cache construction graph. */
export const LOCAL_SUN_CACHE_PLAN_ID =
	'algorithm32-local-sun-cache-construction-v3';

/** Identify the deterministic local-Sun GPU cache fingerprint schema. */
export const LOCAL_SUN_CACHE_FINGERPRINT_SCHEMA_REVISION =
	'algorithm32-local-sun-gpu-cache-fingerprint-v3';

/** Select the production local-cache transport interval count. */
export const LOCAL_SUN_TRANSPORT_INTERVAL_COUNT = 15;

/** Select production local-source optical-depth integration intervals. */
export const LOCAL_SUN_SOURCE_TRANSMITTANCE_INTERVAL_COUNT = 15;

/** Select the accepted fixed local-Sun shell-fact policy. */
/** @type {2048} */
export const LOCAL_SUN_SHELL_COUNT = 2_048;
/** @type {2049} */
export const LOCAL_SUN_SHELL_BOUNDARY_COUNT =
	/** @type {2049} */ (LOCAL_SUN_SHELL_COUNT + 1);
/** Select the fixed higher-index shell-boundary search iteration count. */
export const LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT =
	Math.ceil(Math.log2(LOCAL_SUN_SHELL_BOUNDARY_COUNT));
export const LOCAL_SUN_SHELL_MAP_RADIUS_METERS =
	Math.PI * 6_371.0088 * 1_000;
export const LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS = 100_000;
export const LOCAL_SUN_SHELL_FACT_SCHEMA =
	'algorithm32-local-sun-shell-facts-v1';
export const LOCAL_SUN_SHELL_FACT_ID =
	'algorithm32-local-sun-shell-facts';

/** Store the selected local-Sun z-by-rho position-grid dimensions. */
export const LOCAL_SUN_DEFAULT_Z_NODE_COUNT = 19;
export const LOCAL_SUN_DEFAULT_RHO_NODE_COUNT = 15;

/** Identify the source-owned local-Sun construction domain and packings. */
export const LOCAL_SUN_CONSTRUCTION_DOMAIN_ID =
	'algorithm32-local-sun-z19-rho15-paired-fibonacci34-w27-v2';
export const LOCAL_SUN_RADIANCE_PACKING_ID =
	'algorithm32-local-sun-z19-rho15-paired-fibonacci34-radiance-packing-v2';
export const LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID =
	'algorithm32-local-sun-z19-rho15-w27-scattering-density-packing-v1';

/** Identify local-Sun binary64 field algorithms. */
export const LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-paired-fibonacci34-shell-cpu-field-v3';
export const LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-shell-held-primary-scattering-density-cpu-v2';
export const LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY =
	'algorithm32-star-local-sun-continuous-primary-radiance-cpu-sha256-77456669363bae06c114514b52c63735f1dd4ec38975f2160d5e2e1a106f7f8d';
export const LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-continuous-l1-generic-recurrence-cpu-v3';

/** Store local-Sun N1 and N2 construction-control descriptors. */
export const LOCAL_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS =
	createCacheConstructionControlsDescriptor({
		id: 'algorithm32-local-sun-cpu-first-order-controls-v1',
		transportIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: 1,
	});
export const LOCAL_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS =
	createCacheConstructionControlsDescriptor({
		id: 'algorithm32-local-sun-cpu-second-order-controls-v1',
		transportIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: 2,
	});
export const LOCAL_SUN_CPU_FOURTH_ORDER_CACHE_CONTROLS =
	createCacheConstructionControlsDescriptor({
		id: 'algorithm32-local-sun-cpu-fourth-order-controls-v1',
		transportIntervalCount: LOCAL_SUN_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: 4,
	});

/** Identify the completed local-Sun cumulative runtime shader contribution. */
export const LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID =
	'cache-local-sun-cumulative-scattering';

/** Identify the local point Sun at the shared final-view assembly boundary. */
export const LOCAL_SUN_RUNTIME_SHADER_CONTRIBUTION_ID =
	'light-source-local-sun-runtime-identity';

/**
 * Declare the construction capabilities supplied by the local point Sun.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 */
export const LOCAL_SUN_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': [
		'lightSource.direction',
		'lightSource.primaryJ1',
	],
	'direct-l1': [
		'lightSource.direction',
		'lightSource.directL1',
	],
	scatter: ['lightSource.direction'],
	transport: [],
	accumulate: [],
};

/**
 * Declare the construction dependencies of the local point Sun.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 */
export const LOCAL_SUN_CACHE_REQUIREMENTS_BY_PASS = {
	'primary-j1': [
		'atmosphere.medium',
		'atmosphere.phase',
		'atmosphere.sourceTransmittance',
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
		'cache.outputLayout',
	],
	'direct-l1': [
		'atmosphere.medium',
		'atmosphere.phase',
		'atmosphere.sourceTransmittance',
		'geometry.cachePosition',
		'geometry.sourceFrame',
		'geometry.sourcePath',
		'cache.outputLayout',
	],
	scatter: [],
	transport: [],
	accumulate: [],
};

/** Identify position-dependent source irradiance used by reflected J2. */
export const LOCAL_SUN_CACHE_IRRADIANCE_SYMBOL =
	'lightSource.irradiance';
