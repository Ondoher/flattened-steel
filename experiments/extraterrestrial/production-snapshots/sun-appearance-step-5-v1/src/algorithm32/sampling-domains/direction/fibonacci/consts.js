import Fibonacci34DirectionDomain from './Fibonacci34DirectionDomain.js';
import PairedFibonacci34DirectionDomain from './PairedFibonacci34DirectionDomain.js';
import PairedRotatedFibonacci68DirectionDomain from './PairedRotatedFibonacci68DirectionDomain.js';
import ReflectionCompletedFibonacci68DirectionDomain from './ReflectionCompletedFibonacci68DirectionDomain.js';

/** Selected executable spherical/distant Fibonacci-34 quadrature. */
export const FIBONACCI_34_DIRECTION_DOMAIN_OWNER = new Fibonacci34DirectionDomain();

/** Selected reflection-completed ordinary Fibonacci-68 production quadrature. */
export const REFLECTION_COMPLETED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER =
	new ReflectionCompletedFibonacci68DirectionDomain();

/** Selected executable paired-Fibonacci-34 incoming quadrature. */
export const PAIRED_FIBONACCI_34_DIRECTION_DOMAIN_OWNER = new PairedFibonacci34DirectionDomain();

/** Orientation-balanced paired-Fibonacci-68 incoming quadrature. */
export const PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER = new PairedRotatedFibonacci68DirectionDomain();
