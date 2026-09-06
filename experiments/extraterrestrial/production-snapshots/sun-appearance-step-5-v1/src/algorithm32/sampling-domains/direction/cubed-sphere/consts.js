import CubedSphereDirectionDomain from './CubedSphereDirectionDomain.js';

/** Supported executable source-local cubed-sphere owners. */
export const CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER = new CubedSphereDirectionDomain({
	id: 'algorithm32-cubed-sphere-w3-outgoing-v1',
	faceWidth: 3,
});
/** Cubed sphere w9 direction domain owner constant. */
export const CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER = new CubedSphereDirectionDomain({
	id: 'algorithm32-cubed-sphere-w9-outgoing-v1',
	faceWidth: 9,
});
/** Cubed sphere w27 direction domain owner constant. */
export const CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER = new CubedSphereDirectionDomain({
	id: 'algorithm32-cubed-sphere-w27-outgoing-v1',
	faceWidth: 27,
});

/** Established W27 direction count. */
export const CUBED_SPHERE_W27_DIRECTION_COUNT = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount;

/** Established W27 face definitions. */
export const CUBED_SPHERE_W27_FACES = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faces;

/** Established W27 unit vectors. */
export const CUBED_SPHERE_W27_UNIT_VECTORS = CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors;
