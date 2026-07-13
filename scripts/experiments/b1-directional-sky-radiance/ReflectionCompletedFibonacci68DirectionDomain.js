import {FIBONACCI_34_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';

/**
 * Benchmark-owned reflection completion of the ordinary Fibonacci-34
 * incoming quadrature.
 *
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

	/** Creates the experimental reflection-completed ordinary quadrature. */
	constructor() {
		const integrationWeights = FIBONACCI_34_DIRECTION_DOMAIN_OWNER.integrationWeights.values;
		this.id = 'b1-reflection-completed-ordinary-fibonacci-68-v1';
		this.directionCount = FIBONACCI_34_DIRECTION_DOMAIN_OWNER.directionCount * 2;
		this.unitVectors = FIBONACCI_34_DIRECTION_DOMAIN_OWNER.unitVectors.flatMap(
			/**
			 * Called by construction to retain one direction and its source-frame reflection.
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
			values: integrationWeights.flatMap((weight) => [weight * 0.5, weight * 0.5]),
			units: 'steradians',
		};
	}
}
