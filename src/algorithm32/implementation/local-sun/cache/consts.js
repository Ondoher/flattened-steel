/** Value that identifies the completed local-Sun cumulative runtime sampler. */
export const LOCAL_SUN_CUMULATIVE_SCATTERING_SAMPLER_NAME = 'uLocalSunCumulativeScatteringDensityCache';

/** Value that identifies the source-owned local-Sun cache construction graph. */
export const LOCAL_SUN_CACHE_PLAN_ID = 'algorithm32-local-sun-cache-construction-v4';

/** Value that identifies the deterministic local-Sun GPU cache reuse-key schema. */
export const LOCAL_SUN_CACHE_REUSE_KEY_SCHEMA_REVISION = 'algorithm32-local-sun-gpu-cache-reuse-key-v4';

/**
 * Accepted fixed local-Sun shell-fact count.
 *
 *  @type {2048}
 */
export const LOCAL_SUN_SHELL_COUNT = 2_048;
/**
 * Local sun shell boundary count constant.
 *
 *  @type {2049}
 *
 */
export const LOCAL_SUN_SHELL_BOUNDARY_COUNT = /** @type {2049} */ (LOCAL_SUN_SHELL_COUNT + 1);
/** Value that selects the fixed higher-index shell-boundary search iteration count. */
export const LOCAL_SUN_SHELL_SEARCH_ITERATION_COUNT = Math.ceil(Math.log2(LOCAL_SUN_SHELL_BOUNDARY_COUNT));
/** Local sun shell map radius meters constant. */
export const LOCAL_SUN_SHELL_MAP_RADIUS_METERS = Math.PI * 6_371.0088 * 1_000;
/** Local sun shell atmosphere apex meters constant. */
export const LOCAL_SUN_SHELL_ATMOSPHERE_APEX_METERS = 100_000;
/** Local sun shell fact id constant. */
export const LOCAL_SUN_SHELL_FACT_ID = 'algorithm32-local-sun-shell-facts';

/** Value that stores the selected local-Sun z-by-rho position-grid dimensions. */
export const LOCAL_SUN_DEFAULT_Z_NODE_COUNT = 19;
/** Local sun default rho node count constant. */
export const LOCAL_SUN_DEFAULT_RHO_NODE_COUNT = 15;

/** Value that identifies the source-owned local-Sun construction domain and packings. */
export const LOCAL_SUN_CONSTRUCTION_DOMAIN_ID =
	'algorithm32-local-sun-z19-rho15-reflection-completed-fibonacci68-w27-v5';
/** Local sun radiance packing id constant. */
export const LOCAL_SUN_RADIANCE_PACKING_ID =
	'algorithm32-local-sun-z19-rho15-reflection-completed-fibonacci68-radiance-packing-v5';
/** Local sun scattering density packing id constant. */
export const LOCAL_SUN_SCATTERING_DENSITY_PACKING_ID =
	'algorithm32-local-sun-z19-rho15-w27-scattering-density-packing-v1';

/** Value that identifies local-Sun binary64 field algorithms. */
export const LOCAL_SUN_CPU_FIELD_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-reflection-completed-fibonacci68-shell-cpu-field-v6';
/** Local sun cpu primary scattering provenance identity constant. */
export const LOCAL_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-shell-held-primary-scattering-density-cpu-v2';
/** Local sun cpu primary radiance provenance identity constant. */
export const LOCAL_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY =
	'algorithm32-production-local-sun-continuous-primary-radiance-cpu-v1';
/** Local sun cpu recurrence provenance identity constant. */
export const LOCAL_SUN_CPU_RECURRENCE_PROVENANCE_IDENTITY =
	'algorithm32-local-sun-continuous-l1-generic-recurrence-cpu-v3';

/** Value that identifies the completed local-Sun cumulative runtime shader contribution. */
export const LOCAL_SUN_CACHE_SHADER_CONTRIBUTION_ID = 'cache-local-sun-cumulative-scattering';

/**
 * Value that declares the construction capabilities supplied by the local point Sun.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 *
 */
export const LOCAL_SUN_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': ['lightSource.direction', 'lightSource.primaryJ1'],
	'direct-l1': ['lightSource.direction', 'lightSource.directL1'],
	scatter: ['lightSource.direction'],
	transport: [],
	accumulate: [],
};

/**
 * Value that declares the construction dependencies of the local point Sun.
 *
 * @type {Readonly<Record<CachePassKind, readonly string[]>>}
 *
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

/** Value that identifies position-dependent source irradiance used by reflected J2. */
export const LOCAL_SUN_CACHE_IRRADIANCE_SYMBOL = 'lightSource.irradiance';
/** Comparison-only admission signature of the P1/P2 qualified physical/domain family.
 * Derived from accepted P0 inputs and whole-field P2 control identity; never constructs configuration.
 * Source scale 1 is physically qualified; zero is the analytic black-source control.
 */
export const LOCAL_SUN_COMPACT_QUALIFIED_RUNTIME_FAMILY =
	'sha256:a08bde33cee4570d588b20c6e2e7fb461805b0058245a4d8900cdf20d4cd8d1a';
