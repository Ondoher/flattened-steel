import {
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER,
} from './consts.js';
import CubedSphereDirectionDomain from './CubedSphereDirectionDomain.js';
import {
	CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH,
} from './domain-consts.js';

export {
	CUBED_SPHERE_W27_DIRECTION_COUNT,
	CUBED_SPHERE_W27_DIRECTION_DOMAIN,
	CUBED_SPHERE_W27_FACES,
	CUBED_SPHERE_W27_UNIT_VECTORS,
} from './consts.js';

/**
 * Create the selected source-local W27 outgoing reconstruction descriptor.
 *
 * @param {Partial<Pick<DirectionDomainDefinition, 'id'>>} [options] - Supplies
 * an optional identity override.
 * @returns {DirectionDomainDescriptor} The readonly direction descriptor.
 */
export function createCubedSphereW27DirectionDomain(options = {}) {
	if (options === null || typeof options !== 'object' || Array.isArray(options)) {
		throw new TypeError(
			'Cubed-sphere W27 direction-domain options must be an object.',
		);
	}

	return new CubedSphereDirectionDomain({
		id: options.id === undefined
			? CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH[27]
			: options.id,
		faceWidth: 27,
	}).descriptor;
}

/**
 * Flatten a W27 face-local node in face-major, v-major, u-minor order.
 *
 * @param {number} faceIndex - Supplies the face index.
 * @param {number} uIndex - Supplies the horizontal node index.
 * @param {number} vIndex - Supplies the vertical node index.
 * @returns {number} The flattened storage index.
 */
export function flattenCubedSphereW27NodeIndex(
	faceIndex,
	uIndex,
	vIndex,
) {
	return CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.flattenNodeIndex(
		faceIndex,
		uIndex,
		vIndex,
	);
}

/**
 * Reverse the selected W27 flattened storage order.
 *
 * @param {number} index - Supplies the flattened node index.
 * @returns {CubedSphereW27NodeAddress} The face-local address.
 */
export function unflattenCubedSphereW27NodeIndex(index) {
	return CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unflattenNodeIndex(index);
}

/**
 * Resolve the selected Star W27 dominant-face bilinear construction stencil.
 *
 * @param {UnitVector3} direction - Supplies a source-local unit direction.
 * @returns {ScatteringCacheDirectionStencil} One to four W27 taps.
 */
export function createCubedSphereW27DirectionStencil(direction) {
	return CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.resolveStencil(direction);
}

export default CUBED_SPHERE_W27_DIRECTION_DOMAIN;
