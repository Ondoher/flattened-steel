import CubedSphereDirectionDomain from './CubedSphereDirectionDomain.js';
import Fibonacci34DirectionDomain from './Fibonacci34DirectionDomain.js';
import {
	CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH,
	SPHERICAL_NATIVE_POSITION_ID_BY_COUNT,
} from './domain-consts.js';
import PairedFibonacci34DirectionDomain from
	'./PairedFibonacci34DirectionDomain.js';
import SphericalNativePositionDomain from './SphericalNativePositionDomain.js';

/** Store the supported executable native spherical position owners. */
export const NATIVE_4_POSITION_DOMAIN_OWNER =
	new SphericalNativePositionDomain({
		id: SPHERICAL_NATIVE_POSITION_ID_BY_COUNT[4],
		count: 4,
	});
export const NATIVE_16_POSITION_DOMAIN_OWNER =
	new SphericalNativePositionDomain({
		id: SPHERICAL_NATIVE_POSITION_ID_BY_COUNT[16],
		count: 16,
	});
export const NATIVE_48_POSITION_DOMAIN_OWNER =
	new SphericalNativePositionDomain({
		id: SPHERICAL_NATIVE_POSITION_ID_BY_COUNT[48],
		count: 48,
	});

/** Store the selected executable spherical/distant Fibonacci-34 quadrature. */
export const FIBONACCI_34_DIRECTION_DOMAIN_OWNER =
	new Fibonacci34DirectionDomain();

/** Retain Fibonacci-34 declarative metadata for diagnostics. */
export const FIBONACCI_34_DIRECTION_DOMAIN =
	FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor;

/** Store the selected executable paired-Fibonacci-34 incoming quadrature. */
export const PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER =
	new PairedFibonacci34DirectionDomain();

/** Retain its declarative identity for descriptors and diagnostics. */
export const PAIRED_FIBONACCI_34_DIRECTION_DOMAIN =
	PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER.descriptor;

/** Store the supported executable source-local cubed-sphere owners. */
export const CUBED_SPHERE_W3_DIRECTION_DOMAIN_OWNER =
	new CubedSphereDirectionDomain({
		id: CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH[3],
		faceWidth: 3,
	});
export const CUBED_SPHERE_W9_DIRECTION_DOMAIN_OWNER =
	new CubedSphereDirectionDomain({
		id: CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH[9],
		faceWidth: 9,
	});
export const CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER =
	new CubedSphereDirectionDomain({
		id: CUBED_SPHERE_DIRECTION_ID_BY_FACE_WIDTH[27],
		faceWidth: 27,
	});

/** Retain the established Native-48 compatibility constants. */
export const NATIVE_48_POSITION_COUNT =
	NATIVE_48_POSITION_DOMAIN_OWNER.count;
export const NATIVE_48_POSITION_NODES =
	NATIVE_48_POSITION_DOMAIN_OWNER.nodes;
export const NATIVE_48_POSITION_DOMAIN =
	NATIVE_48_POSITION_DOMAIN_OWNER.descriptor;

/** Retain the established W27 compatibility constants. */
export const CUBED_SPHERE_W27_DIRECTION_COUNT =
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.directionCount;
export const CUBED_SPHERE_W27_FACES =
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.faces;
export const CUBED_SPHERE_W27_UNIT_VECTORS =
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.unitVectors;
export const CUBED_SPHERE_W27_DIRECTION_DOMAIN =
	CUBED_SPHERE_W27_DIRECTION_DOMAIN_OWNER.descriptor;
