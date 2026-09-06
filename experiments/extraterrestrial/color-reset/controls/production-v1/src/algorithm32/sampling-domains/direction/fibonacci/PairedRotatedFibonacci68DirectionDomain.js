import PairedFibonacci34DirectionDomain from './PairedFibonacci34DirectionDomain.js';

/**
 * Paired-Fibonacci incoming quadrature combined with its quarter-turn copy.
 * The second orientation reduces the finite-direction bias that first becomes
 * visible in Flat/local fourth-order scattering while retaining exact
 * antipodes, zero first moment, and total solid-angle weight.
 * @implements {WeightedDirectionDomain}
 */
export default class PairedRotatedFibonacci68DirectionDomain {
	/** Id value. @readonly @type {string} */
	id;
	/** Direction count value. @readonly @type {number} */
	directionCount;
	/** Number of exact antipodal pairs. @readonly @type {number} */
	pairCount;
	/** Unit vectors value. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Integration weights value. @readonly @type {SolidAngleWeights} */
	integrationWeights;

	/** Creates the orientation-balanced production incoming quadrature. */
	constructor() {
		const baseDomain = new PairedFibonacci34DirectionDomain();
		const selectedVectors = baseDomain.unitVectors.map(
			/**
			 * Called by construction to copy one selected direction.
			 * @param {UnitVector3} direction - The selected direction.
			 * @returns {UnitVector3} - The copied direction.
			 */
			(direction) => [direction[0], direction[1], direction[2]],
		);
		const rotatedVectors = baseDomain.unitVectors.map(
			/**
			 * Called by construction to rotate one selected direction by 90 degrees about the radial axis.
			 * @param {UnitVector3} direction - The selected direction.
			 * @returns {UnitVector3} - The rotated direction.
			 */
			(direction) => [direction[0], -direction[2], direction[1]],
		);
		const directionCount = baseDomain.directionCount * 2;
		const integrationWeight = baseDomain.integrationWeights.values[0] * 0.5;

		this.id = 'algorithm32-paired-rotated-fibonacci-68-incoming-v1';
		this.directionCount = directionCount;
		this.pairCount = baseDomain.pairCount * 2;
		this.unitVectors = [...selectedVectors, ...rotatedVectors];
		this.integrationWeights = {
			values: Array.from({length: directionCount}, () => integrationWeight),
			units: 'steradians',
		};
	}
}
