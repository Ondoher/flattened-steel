import {
	DEFAULT_CACHE_CONSTRUCTION_CONTROLS,
	createCacheConstructionControlsDescriptor,
} from '../caches/CacheConstructionControlsDescriptor.js';
import {
	DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT,
} from '../caches/consts.js';
import {
	CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER,
	NATIVE_4_POSITION_DOMAIN_OWNER,
	NATIVE_16_POSITION_DOMAIN_OWNER,
	NATIVE_48_POSITION_DOMAIN_OWNER,
} from '../domains/consts.js';
import {
	NATIVE_15_SPECTRAL_BASIS,
} from '../profiles/native-15-profile.js';
import DistantSunConstructionDomainSelection from
	'./DistantSunConstructionDomainSelection.js';

/** Declare the base construction capabilities supplied by a distant Sun. */
export const DISTANT_SUN_CACHE_SYMBOLS_BY_PASS = {
	'primary-j1': [
		'lightSource.direction',
		'lightSource.primaryJ1',
	],
	'direct-l1': [
		'lightSource.direction',
		'lightSource.directL1',
	],
	scatter: ['lightSource.direction'],
	transport: ['lightSource.direction'],
	accumulate: [],
};

/** Declare the base construction dependencies of a distant Sun. */
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

/** Identify source-owned spectral irradiance for direct ground reflection. */
export const DISTANT_SUN_CACHE_IRRADIANCE_SYMBOL =
	'lightSource.irradiance';

/** Identify source-owned GPU field provenance across construction domains. */
export const DISTANT_SUN_GPU_FIELD_PROVENANCE_IDENTITY =
	'algorithm32-distant-sun-gpu-cache-plan-v1';

/** Identify the production implementation used by distant-Sun CPU fields. */
export const DISTANT_SUN_CPU_FIELD_PROVENANCE_IDENTITY =
	'algorithm32-distant-sun-cpu-field-v1';

/** Identify the selected distant-Sun primary scattering-density CPU field. */
export const DISTANT_SUN_CPU_PURE_J1_ID =
	'algorithm32-distant-sun-cpu-pure-j1-v1';
export const DISTANT_SUN_CPU_PRIMARY_SCATTERING_PROVENANCE_IDENTITY =
	'algorithm32-distant-sun-primary-scattering-density-cpu-v1';
export const DISTANT_SUN_PRIMARY_SCATTERING_DIRECTION_TOLERANCE = 1e-12;
/** @type {UnitVector3} */
export const SOURCE_LOCAL_TOWARD_DISTANT_SUN = ([1, 0, 0]);

/** Identify the selected distant-Sun direct-primary CPU field. */
export const DISTANT_SUN_CPU_PURE_L1_ID =
	'algorithm32-distant-sun-cpu-pure-l1-v1';
export const DISTANT_SUN_CPU_PRIMARY_RADIANCE_PROVENANCE_IDENTITY =
	'algorithm32-star-create-l1-field-direct-sha256-98aa61f7cf441226eef38f40043ea729b5b1feb93cbea4d9160b7a4c33ead24a';
export const DISTANT_SUN_PRIMARY_DIRECTION_TOLERANCE = 1e-12;

/** Tolerance used to accept normalized distant-Sun physical directions. */
export const UNIT_VECTOR_TOLERANCE = 1e-10;

/** W27 is face-major with 27-by-27 faces; each center uses u = v = 13. */
export const W27_POSITIVE_X_FACE_CENTER_INDEX = 364;
export const W27_POSITIVE_Y_FACE_CENTER_INDEX = 1822;
export const W27_POSITIVE_Z_FACE_CENTER_INDEX = 3280;

/** Store the executable production CPU path-integration interval count. */
export const DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT =
	DEFAULT_CACHE_TRANSPORT_INTERVAL_COUNT;

/** Store the native production distant-Sun construction-domain selection. */
export const DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'algorithm32-distant-sun-cpu-native48-w27-v1',
		positionDomainOwner: NATIVE_48_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
		incomingUnitVectors:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
		incomingIntegrationWeights:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'algorithm32-distant-sun-fibonacci-34-radiance-packing-v1',
		scatteringDensityPackingId:
			'algorithm32-distant-sun-w27-scattering-density-packing-v1',
	});

/** Store the reduced Native16/W9 full-field Star parity selection. */
export const NATIVE16_W9_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'algorithm32-distant-sun-cpu-native16-w9-parity-v1',
		positionDomainOwner: NATIVE_16_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
		incomingUnitVectors:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
		incomingIntegrationWeights:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'algorithm32-distant-sun-native16-fibonacci-34-radiance-packing-v1',
		scatteringDensityPackingId:
			'algorithm32-distant-sun-native16-w9-scattering-density-packing-v1',
	});

/** Store the tiny Native4/W3 explicit-zero Star parity selection. */
export const NATIVE4_W3_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION =
	new DistantSunConstructionDomainSelection({
		id: 'algorithm32-distant-sun-cpu-native4-w3-parity-v1',
		positionDomainOwner: NATIVE_4_POSITION_DOMAIN_OWNER,
		incomingDirectionDomain:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor,
		incomingUnitVectors:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors,
		incomingIntegrationWeights:
			FIBONACCI_34_DIRECTION_DOMAIN_OWNER
				.integrationWeights,
		outgoingDirectionDomainOwner:
			CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER,
		spectralBasis: NATIVE_15_SPECTRAL_BASIS,
		radiancePackingId:
			'algorithm32-distant-sun-native4-fibonacci-34-radiance-packing-v1',
		scatteringDensityPackingId:
			'algorithm32-distant-sun-native4-w3-scattering-density-packing-v1',
	});

/** Store the source-owned CPU N1 cache controls. */
export const DISTANT_SUN_CPU_FIRST_ORDER_CACHE_CONTROLS =
	createCacheConstructionControlsDescriptor({
		id: 'algorithm32-distant-sun-cpu-first-order-controls-v1',
		transportIntervalCount: DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: 1,
	});

/** Store the source-owned CPU N2 cache controls. */
export const DISTANT_SUN_CPU_SECOND_ORDER_CACHE_CONTROLS =
	createCacheConstructionControlsDescriptor({
		id: 'algorithm32-distant-sun-cpu-second-order-controls-v1',
		transportIntervalCount: DISTANT_SUN_CPU_TRANSPORT_INTERVAL_COUNT,
		maximumScatteringOrder: 2,
	});
