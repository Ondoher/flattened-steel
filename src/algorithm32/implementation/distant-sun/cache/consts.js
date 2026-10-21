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

/** Schema identity for one accepted point-local distant-Sun scene-cache manifest. */
export const DISTANT_SUN_SCENE_CACHE_MANIFEST_SCHEMA_ID = 'algorithm32-distant-sun-scene-cache-manifest-v1';
/** Runtime-only manifest excludes construction oracles and declares its scalar selection interval. */
export const DISTANT_SUN_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID =
	'algorithm32-distant-sun-runtime-scene-cache-manifest-v2';
/** Runtime manifest with an executable scattering/mapping policy. */
export const DISTANT_SUN_ACCURACY_RUNTIME_SCENE_CACHE_MANIFEST_SCHEMA_ID =
	'algorithm32-distant-sun-runtime-scene-cache-manifest-v3';
/** Schema identity for one packed altitude/local-solar-zenith row ledger. */
export const DISTANT_SUN_SCENE_CACHE_LEDGER_SCHEMA_ID = 'algorithm32-distant-sun-packed-row-ledger-v1';
/** Codec identity for the uncompressed logical W27 correctness oracle. */
export const DISTANT_SUN_SCENE_CACHE_ORACLE_CODEC_ID = 'algorithm32-distant-sun-w27-r32f-oracle-v1';
/** Codec identity for exact W27 physical-seam deduplication. */
export const DISTANT_SUN_SCENE_CACHE_EXACT_SEAM_CODEC_ID = 'algorithm32-distant-sun-w27-exact-seam-u16-v1';

/** Schema identity for the production shared-cache package-set report. */
export const DISTANT_SUN_SHARED_CACHE_PACKAGE_SET_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-package-set-report-v1';
/** Schema identity for the production shared-cache runtime catalog. */
export const DISTANT_SUN_SHARED_CACHE_RUNTIME_CATALOG_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-runtime-catalog-v1';
/** Schema identity for one production shared-cache configuration manifest. */
export const DISTANT_SUN_SHARED_CACHE_CONFIGURATION_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-configuration-manifest-v1';
/** Shared configuration with an executable scattering/mapping policy. */
export const DISTANT_SUN_SHARED_CACHE_ACCURACY_CONFIGURATION_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-configuration-manifest-v2';
/** Schema identity for one production shared-cache block index. */
export const DISTANT_SUN_SHARED_CACHE_BLOCK_INDEX_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-block-index-v1';
/** Schema identity for one production shared-cache scene manifest. */
export const DISTANT_SUN_SHARED_CACHE_SCENE_MANIFEST_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-scene-manifest-v1';
/** Schema identity for the selected Zstandard shared-cache codec profile. */
export const DISTANT_SUN_SHARED_CACHE_CODEC_PROFILE_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-codec-profile-v1';
/** Schema identity for complete production cache-artifact derivation. */
export const DISTANT_SUN_SHARED_CACHE_DERIVATION_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-derivation-v1';
/** Schema identity for one packet-ready shared spectral block. */
export const DISTANT_SUN_SHARED_CACHE_PACKET_BLOCK_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-packet-block-v1';
/** Schema identity for one authenticated resident atlas slot. */
export const DISTANT_SUN_SHARED_CACHE_RESIDENT_SLOT_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-resident-slot-v1';
/** Schema identity for one scene-row to resident-slot address table. */
export const DISTANT_SUN_SHARED_CACHE_ROW_ADDRESS_SCHEMA_ID = 'algorithm32-distant-sun-shared-cache-row-address-v1';
/** Schema identity for one scene/altitude interpolation ledger table. */
export const DISTANT_SUN_SHARED_CACHE_ALTITUDE_LEDGER_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-altitude-ledger-v1';
/** Schema identity for one predictively prepared animation route. */
export const DISTANT_SUN_SHARED_CACHE_PREPARED_ROUTE_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-prepared-route-v1';
/** Schema identity for one atomically published cache selection. */
export const DISTANT_SUN_SHARED_CACHE_PUBLICATION_SCHEMA_ID =
	'algorithm32-distant-sun-shared-cache-publication-snapshot-v1';

/** Selected shared-cache decoded spectral scalar representation. */
export const DISTANT_SUN_SHARED_CACHE_DECODED_SCALAR_ID = 'float32-little-endian';
/** Selected shared-cache reversible byte-layout transform. */
export const DISTANT_SUN_SHARED_CACHE_SHUFFLE_ID = 'float32-byte-lane-v1';
/** Selected shared-cache compression format. */
export const DISTANT_SUN_SHARED_CACHE_COMPRESSION_ID = 'zstandard';
/** Selected shared-cache Zstandard compression level. */
export const DISTANT_SUN_SHARED_CACHE_ZSTANDARD_LEVEL = 6;
/** Selected shared-cache altitude indices per block tile. */
export const DISTANT_SUN_SHARED_CACHE_BLOCK_ALTITUDE_COUNT = 8;
/** Selected shared-cache local-solar-zenith indices per block tile. */
export const DISTANT_SUN_SHARED_CACHE_BLOCK_SOLAR_ZENITH_COUNT = 8;
/** Largest populated coordinate-row count in one shared block. */
export const DISTANT_SUN_SHARED_CACHE_MAXIMUM_BLOCK_ROW_COUNT = 64;
/** Largest decoded shared-block allocation accepted by the v1 format. */
export const DISTANT_SUN_SHARED_CACHE_MAXIMUM_DECODED_BLOCK_BYTES = 16 * 1024 * 1024;
/** Number of exact-seam W27 directions stored for one coordinate row. */
export const DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT = 4058;
/** Number of logical W27 directions expanded into the packet atlas. */
export const DISTANT_SUN_SHARED_CACHE_LOGICAL_DIRECTION_COUNT = 4374;
/** Number of Native15 spectral channels stored in each shared block. */
export const DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT = 15;
/** Decoded bytes in one wavelength-complete shared coordinate row. */
export const DISTANT_SUN_SHARED_CACHE_ROW_BYTE_LENGTH =
	DISTANT_SUN_SHARED_CACHE_UNIQUE_DIRECTION_COUNT *
	DISTANT_SUN_SHARED_CACHE_SPECTRAL_CHANNEL_COUNT *
	Float32Array.BYTES_PER_ELEMENT;
/** Selected packet-atlas layer width in RGBA texels. */
export const DISTANT_SUN_SHARED_CACHE_PACKET_WIDTH = 648;
/** Selected packet-atlas layer height in RGBA texels. */
export const DISTANT_SUN_SHARED_CACHE_PACKET_HEIGHT = 1728;
/** Selected bounded packet-atlas resident layer count. */
export const DISTANT_SUN_SHARED_CACHE_DEFAULT_RESIDENT_LAYER_COUNT = 24;
/** Unavailable row-address component stored in RG16UI metadata. */
export const DISTANT_SUN_SHARED_CACHE_UNAVAILABLE_ROW_ADDRESS = 0xffff;

/** Fixed byte length of one packet-ready RGBA32F block. */
export const DISTANT_SUN_SHARED_CACHE_PACKET_BYTES = 648 * 1728 * 4 * 4;
/** Maximum concurrent complete artifact preparations across browser transactions. */
export const DISTANT_SUN_SHARED_CACHE_REQUEST_LIMIT = 4;
/** Ordinary unpinned packet retention budget. */
export const DISTANT_SUN_SHARED_CACHE_LRU_BYTES = 64 * 1024 * 1024;
/** Default host pin admission budget, excluding the separately bounded LRU and active decode. */
export const DISTANT_SUN_SHARED_CACHE_PIN_BYTES = 768 * 1024 * 1024;
/** Maximum complete browser metadata graph allocation before JSON parsing. */
export const DISTANT_SUN_SHARED_CACHE_METADATA_BYTES = 32 * 1024 * 1024;
/** Maximum encoded frame length accepted before network or decoder allocation. */
export const DISTANT_SUN_SHARED_CACHE_MAXIMUM_ENCODED_BYTES = 16 * 1024 * 1024;
/** Deadline for one Worker preparation, including initialization and authentication. */
export const DISTANT_SUN_SHARED_CACHE_WORKER_TIMEOUT = 30_000;
/** Qualified decoder-only fallback source supplied by the pinned Three r180 installation. */
export const DISTANT_SUN_SHARED_CACHE_DECODER_SHA256 =
	'5cbf818e842628a4464e748594a6deae18ceddda3c2f541e7b3a0ff5fc7611e2';

/** Largest four-layer RGBA32F runtime derivative, including its logical-direction index. */
export const DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES = 185_326_380;
/** Largest qualified two-cache atomic-publication footprint. */
export const DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_BYTES = 2 * DISTANT_SUN_SCENE_CACHE_MAXIMUM_RESIDENT_BYTES;
/** Largest qualified transition footprint while one candidate payload remains staged on the host. */
export const DISTANT_SUN_SCENE_CACHE_MAXIMUM_TRANSITION_WITH_STAGING_BYTES = 717_171_648;

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
