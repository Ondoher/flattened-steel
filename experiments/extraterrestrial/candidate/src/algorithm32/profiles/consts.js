import { CANONICAL_SPECTRAL_CHANNELS } from '../constants/Algorithm32CanonicalData.js';

/** Identify the native production-profile schema. */
export const PROFILE_SCHEMA_REVISION = 'algorithm32-native-production-profile-v1';

/** Identify the native physical-profile schema. */
export const PHYSICAL_PROFILE_SCHEMA_REVISION = 'algorithm32-native-physical-profile-v1';

/** Identify the native numerical-profile schema. */
export const NUMERICAL_PROFILE_SCHEMA_REVISION = 'algorithm32-native-numerical-profile-v1';

/** Identify the selected default native production profile. */
export const DEFAULT_PROFILE_ID = 'algorithm32-native-production-default-v1';

/** Identify the selected default native production-profile revision. */
export const DEFAULT_PROFILE_REVISION = 1;

/** Identify the selected native production role. */
export const DEFAULT_PROFILE_ROLE = 'native-production-default';

/** Identify the canonical native source packet provenance. */
export const SOURCE_PROVENANCE_IDENTITY =
	'algorithm32-canonical-data-native-15-source-v1';

/** Own the executable native spectral layer count independently of metadata. */
export const NATIVE_15_SPECTRAL_CHANNEL_COUNT = CANONICAL_SPECTRAL_CHANNELS.length;
