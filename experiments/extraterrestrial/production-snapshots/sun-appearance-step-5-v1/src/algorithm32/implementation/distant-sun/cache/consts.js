import {DEFAULT_CACHE_CONSTRUCTION_OPTIONS} from '../../../light-source-support/cache/consts.js';
import {DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT} from '../../../light-source-support/cache/consts.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from '../../../sampling-domains/direction/cubed-sphere/consts.js';
import {REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../sampling-domains/direction/fibonacci/consts.js';
import {
	NATIVE_4_POSITION_DOMAIN_OWNER,
	NATIVE_16_POSITION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../../../sampling-domains/position/spherical-native/consts.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../../../profiles/native-15/native-15-profile.js';
import DistantSunConstructionDomainSelection from './DistantSunConstructionDomainSelection.js';

/** Value that declares the base construction capabilities supplied by a distant Sun. */
export const DISTANT_SUN_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': ['lightSource.direction', 'lightSource.primaryJ1'],
	'direct-l1': ['lightSource.direction', 'lightSource.directL1'],
	scatter: ['lightSource.direction'],
	transport: ['lightSource.direction'],
	accumulate: [],
};

/** Value that declares the base construction dependencies of a distant Sun. */
export const DISTANT_SUN_CACHE_REQUIREMENTS_BY_PASS = {
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

/** Value that identifies source-owned spectral irradiance for direct ground reflection. */
export const DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL = 'lightSource.irradiance';

/** Value that identifies source-owned GPU field provenance across construction domains. */
export const DISTANT_SUN_GPU_FIELD_PROVENANCE_IDENTITY = 'algorithm32-distant-sun-gpu-cache-plan-v1';

/** Value that identifies the production implementation used by distant-Sun CPU fields. */
export const DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY = 'algorithm32-distant-sun-cpu-field-v1';

/** Value that identifies the selected distant-Sun primary scattering-density CPU field. */
export const DISTANT_SUN_CPU_PURE_J1_ID = 'algorithm32-distant-sun-cpu-pure-j1-v1';
/** Distant sun cpu primary scattering provenance identity constant. */
export const DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-distant-sun-primary-scattering-density-cpu-v1';
/** Distant sun primary scattering direction tolerance constant. */
export const DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE = 1e-12;
/**
 * Source local toward distant sun constant.
 *
 *  @type {UnitVector3}
 *
 */
export const SOURCE_LOCAL_TOWARD_DISTANT_SUN = [1, 0, 0];

/** Value that identifies the selected distant-Sun direct-primary CPU field. */
export const DISTANT_SUN_CPU_PURE_L1_ID = 'algorithm32-distant-sun-cpu-pure-l1-v1';
/** Distant sun cpu primary radiance provenance identity constant. */
export const DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY =
	'algorithm32-production-distant-sun-direct-primary-radiance-cpu-v1';
/** Distant sun primary direction tolerance constant. */
export const DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE = 1e-12;

/** Tolerance used to accept normalized distant-Sun physical directions. */
export const UNIT_VECTOR_TOLERANCE = 1e-10;

/** W27 is face-major with 27-by-27 faces; each center uses u = v = 13. */
export const W27_POSITIVE_X_FACE_CENTER_INDEX = 364;
/** W27 positive y face center index constant. */
export const W27_POSITIVE_Y_FACE_CENTER_INDEX = 1822;
/** W27 positive z face center index constant. */
export const W27_POSITIVE_Z_FACE_CENTER_INDEX = 3280;

/** Value that stores the executable production CPU path-integration interval count. */
export const DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT = DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT;

/** Value that stores the native production distant-Sun construction-domain selection. */
export const DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION = new DistantSunConstructionDomainSelection({
	id: 'algorithm32-distant-sun-cpu-native48-w27-v1',
	positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
	incomingDirectionDomainOwner: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	outgoingDirectionDomainOwner: CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	radiancePackingId: 'algorithm32-distant-sun-reflection-completed-fibonacci-68-radiance-packing-v1',
	scatteringDensityPackingId: 'algorithm32-distant-sun-w27-scattering-density-packing-v1',
});

/** Value that stores the reduced Native16/W9 full-field production selection. */
export const NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION = new DistantSunConstructionDomainSelection({
	id: 'algorithm32-distant-sun-cpu-native16-w9-parity-v1',
	positionDomainOwner: NATIVE_16_POSITION_DOMAIN_OWNER,
	incomingDirectionDomainOwner: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	outgoingDirectionDomainOwner: CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	radiancePackingId: 'algorithm32-distant-sun-native16-reflection-completed-fibonacci-68-radiance-packing-v1',
	scatteringDensityPackingId: 'algorithm32-distant-sun-native16-w9-scattering-density-packing-v1',
});

/** Value that stores the tiny Native4/W3 explicit-zero production selection. */
export const NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION = new DistantSunConstructionDomainSelection({
	id: 'algorithm32-distant-sun-cpu-native4-w3-parity-v1',
	positionDomainOwner: NATIVE_4_POSITION_DOMAIN_OWNER,
	incomingDirectionDomainOwner: REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER,
	outgoingDirectionDomainOwner: CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	spectralBasis: NATIVE_15_SPECTRAL_BASIS,
	radiancePackingId: 'algorithm32-distant-sun-native4-reflection-completed-fibonacci-68-radiance-packing-v1',
	scatteringDensityPackingId: 'algorithm32-distant-sun-native4-w3-scattering-density-packing-v1',
});

/**
 * Source-owned CPU N1 cache options.
 *
 *  @type {CacheConstructionOptions}
 */
export const DISTANT_SUN_CPU_FIRST_ORDER_CACHE_OPTIONS = {
	transportIntervalCount: DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
	maximumScatteringOrder: 1,
};

/**
 * Source-owned CPU N2 cache options.
 *
 *  @type {CacheConstructionOptions}
 */
export const DISTANT_SUN_CPU_SECOND_ORDER_CACHE_OPTIONS = {
	transportIntervalCount: DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
	maximumScatteringOrder: 2,
};
