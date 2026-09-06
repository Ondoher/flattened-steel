import Fibonacci34DirectionDomain from './Fibonacci34DirectionDomain.js';

/**
 * Object that owns the reflection-completed ordinary Fibonacci-68 quadrature.
 * @implements {WeightedDirectionDomain}
 */
export default class ReflectionCompletedFibonacci68DirectionDomain {
	/** Incoming-domain identity. @readonly @type {string} */
	id;
	/** Number of incoming directions. @readonly @type {number} */
	directionCount;
	/** Source-local unit directions. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Solid-angle integration weights. @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/** Creates the selected reflection-completed production quadrature. */
	constructor() {
		const ordinaryDomain = new Fibonacci34DirectionDomain();

		this.id = 'algorithm32-reflection-completed-fibonacci-68-incoming-v1';
		this.directionCount = ordinaryDomain.directionCount * 2;
		this.unitVectors = ordinaryDomain.unitVectors.flatMap(
			/**
			 * Retain one ordinary direction and add its exact source-plane reflection.
			 *
			 * @param {UnitVector3} direction - The ordinary Fibonacci direction.
			 * @returns {readonly UnitVector3[]} - The original and reflected directions.
			 */
			(direction) => [
				[direction[0], direction[1], direction[2]],
				[direction[0], -direction[1], direction[2]],
			],
		);
		this.integrationWeights = {
			values: ordinaryDomain.integrationWeights.values.flatMap((weight) => [weight * 0.5, weight * 0.5]),
			units: 'steradians',
		};
	}
}
