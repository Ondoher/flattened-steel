const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Benchmark-owned dense paired-Fibonacci convergence domain.
 *
 * @implements {WeightedDirectionDomain}
 */
export default class DensePairedFibonacciDirectionDomain {
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

	/**
	 * Creates one dense paired-Fibonacci domain for a bounded convergence test.
	 *
	 * @param {number} directionCount - The positive even direction count.
	 */
	constructor(directionCount) {
		if (!Number.isInteger(directionCount) || directionCount < 2 || directionCount % 2 !== 0) {
			throw new RangeError('Dense paired-Fibonacci direction count must be a positive even integer.');
		}
		const pairCount = directionCount / 2;
		const unitVectors = [];
		for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
			const x = (pairIndex + 0.5) / pairCount;
			const radial = Math.sqrt(1 - x * x);
			const angle = -GOLDEN_ANGLE * pairIndex;
			const direction = /** @type {UnitVector3} */ ([x, radial * Math.cos(angle), radial * Math.sin(angle)]);
			unitVectors.push(direction, [-direction[0], -direction[1], -direction[2]]);
		}

		this.id = `b1-diagnostic-paired-fibonacci-${directionCount}-v1`;
		this.directionCount = directionCount;
		this.pairCount = pairCount;
		this.unitVectors = unitVectors;
		this.integrationWeights = {
			values: Array(directionCount).fill((4 * Math.PI) / directionCount),
			units: 'steradians',
		};
	}
}
