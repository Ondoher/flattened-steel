import SphericalNativePositionDomain from './SphericalNativePositionDomain.js';

/** Supported executable native spherical position owners. */
export const NATIVE_4_POSITION_DOMAIN_OWNER = new SphericalNativePositionDomain({
	id: 'algorithm32-native-4-position-v2',
	count: 4,
});
/** Native 16 position domain owner constant. */
export const NATIVE_16_POSITION_DOMAIN_OWNER = new SphericalNativePositionDomain({
	id: 'algorithm32-native-16-position-v2',
	count: 16,
});
/** Native 48 position domain owner constant. */
export const NATIVE_48_POSITION_DOMAIN_OWNER = new SphericalNativePositionDomain({
	id: 'algorithm32-native-48-position-v2',
	count: 48,
});

/** Established Native-48 position count. */
export const NATIVE_48_POSITION_COUNT = NATIVE_48_POSITION_DOMAIN_OWNER.count;

/** Established Native-48 position nodes. */
export const NATIVE_48_POSITION_NODES = NATIVE_48_POSITION_DOMAIN_OWNER.nodes;
