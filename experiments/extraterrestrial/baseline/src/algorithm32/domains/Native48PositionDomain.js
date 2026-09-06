import {
	NATIVE_48_POSITION_DOMAIN,
} from './consts.js';
import {
	SPHERICAL_NATIVE_POSITION_ID_BY_COUNT,
} from './domain-consts.js';
import SphericalNativePositionDomain from './SphericalNativePositionDomain.js';

export {
	NATIVE_48_POSITION_COUNT,
	NATIVE_48_POSITION_DOMAIN,
	NATIVE_48_POSITION_NODES,
} from './consts.js';

/**
 * Create the selected native 48-node spherical position descriptor.
 *
 * The generic owner evaluates the retained formula in the same binary64
 * operation order as the imported Algorithm32 cache.
 *
 * @param {Partial<Pick<PositionDomainDefinition, 'id'>>} [options] - Supplies
 * an optional identity override.
 * @returns {PositionDomainDescriptor} The readonly position descriptor.
 */
export function createNative48PositionDomain(options = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError(
			'Native-48 position-domain options must be an object.',
		);
	}

	return new SphericalNativePositionDomain({
		id: options.id === undefined
			? SPHERICAL_NATIVE_POSITION_ID_BY_COUNT[48]
			: options.id,
		count: 48,
	}).descriptor;
}

export default NATIVE_48_POSITION_DOMAIN;
