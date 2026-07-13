import {PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER} from '../../../src/algorithm32/sampling-domains/index.js';

/**
 * Benchmark-owned reflection completion of the production paired-and-rotated
 * 68-direction quadrature.
 *
 * @implements {WeightedDirectionDomain}
 */
export default class ReflectionCompletedFibonacci136DirectionDomain {
	/** Incoming-domain identity. @readonly @type {string} */
	id;
	/** Number of incoming directions. @readonly @type {number} */
	directionCount;
	/** Number of exact antipodal pairs. @readonly @type {number} */
	pairCount;
	/** Source-local unit directions. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Solid-angle integration weights. @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/** Creates the experimental reflection-completed incoming quadrature. */
	constructor() {
		const productionDomain = PAIRED_ROTATED_FIBONACCI_68_DIRECTION_DOMAIN_OWNER;
		const integrationWeight = productionDomain.integrationWeights.values[0] * 0.5;
		this.id = 'b1-reflection-completed-paired-rotated-fibonacci-136-v1';
		this.directionCount = productionDomain.directionCount * 2;
		this.pairCount = productionDomain.pairCount * 2;
		this.unitVectors = productionDomain.unitVectors.flatMap(
			/**
			 * Called by construction to retain one direction and its source-frame reflection.
			 *
			 * @param {UnitVector3} direction - The production direction.
			 * @returns {readonly UnitVector3[]} - The original and reflected directions.
			 */
			(direction) => [
				[direction[0], direction[1], direction[2]],
				[direction[0], -direction[1], direction[2]],
			],
		);
		this.integrationWeights = {
			values: Array.from({length: this.directionCount}, () => integrationWeight),
			units: 'steradians',
		};
	}
}
