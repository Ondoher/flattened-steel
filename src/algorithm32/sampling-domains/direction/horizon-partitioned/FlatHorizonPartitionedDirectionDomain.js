/** Selected flat-horizon Gaussian polar40 and cyclic midpoint-azimuth48 incoming measure.
 * Geometry owns transformations from this radial/tangent/vertical basis into physical space.
 * This fixed domain does not select an execution profile or qualify scattering fields.
 *
 * @implements {WeightedDirectionDomain}
 */
export default class FlatHorizonPartitionedDirectionDomain {
	/** Versioned executable policy identity. @readonly @type {string} */
	id;
	/** Fixed incoming sample count. @readonly @type {number} */
	directionCount;
	/** Ordered immutable flat-basis unit vectors. @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** Positive immutable solid-angle measure. @readonly @type {SolidAngleWeights} */
	integrationWeights;
	/** Ordered cosine partitions refining the flat horizon and poles. @readonly @type {readonly number[]} */
	polarBandEdges;
	/** Gaussian order per band, separate from direction count. @readonly @type {readonly number[]} */
	polarBandCounts;
	/** Fixed cyclic sample count per polar node. @readonly @type {number} */
	azimuthCount;
	/** Dimensionless half-step cyclic sample offset. @readonly @type {number} */
	azimuthOffset;
	/** Flat frame meaning, independent of live source placement. @readonly @type {string} */
	coordinateMeaning;

	/** Called by domain construction to generate the retained four/eight-point Gaussian polar rule.
	 * Descending root order matches the independently preserved selected policy.
	 *
	 * @param {number} count - Selected Gaussian order, four or eight.
	 * @returns {readonly FlatHorizonPolarNode[]} - Positive immutable samples on [-1,1].
	 * @throws {RangeError} - An unsupported order or a nonconvergent root is encountered.
	 */
	_polarRule(count) {
		if (count !== 4 && count !== 8) throw new RangeError('Selected flat polar order must be four or eight.');
		/** Ordered Gaussian samples owned only by this construction. @type {FlatHorizonPolarNode[]} */
		let result = [];
		for (let index = 0; index < count; index++) {
			let x = Math.cos((Math.PI * (index + 0.75)) / (count + 0.5));
			let derivative = 0;
			let converged = false;
			for (let iteration = 0; iteration < 40; iteration++) {
				let previous = 1;
				let current = x;
				for (let degree = 2; degree <= count; degree++) {
					let next = ((2 * degree - 1) * x * current - (degree - 1) * previous) / degree;
					previous = current;
					current = next;
				}
				derivative = (count * (x * current - previous)) / (x * x - 1);
				let next = x - current / derivative;
				if (Math.abs(next - x) < 1e-15) {
					x = next;
					converged = true;
					break;
				}
				x = next;
			}
			if (!converged) throw new RangeError('Selected flat polar Gaussian root did not converge.');
			result.push(Object.freeze({mu: x, weight: 2 / ((1 - x * x) * derivative * derivative)}));
		}
		return Object.freeze(result);
	}

	/** Creates the fixed selected local incoming domain with 1,920 positive weighted directions.
	 * The ordering is polar-band ascending, Gaussian root descending, azimuth ascending.
	 *
	 * @throws {RangeError} - A Gaussian root, sample or total solid-angle measure is invalid.
	 */
	constructor() {
		let edges = Object.freeze([-1, -0.1, -0.01, -0.001, 0, 0.001, 0.01, 0.1, 1]);
		let counts = Object.freeze([8, 4, 4, 4, 4, 4, 4, 8]);
		/** Ordered executable direction storage, frozen before publication. @type {UnitVector3[]} */
		let vectors = [];
		/** Positive solid-angle storage frozen before publication. @type {number[]} */
		let weights = [];
		for (let band = 0; band < counts.length; band++) {
			let half = (edges[band + 1] - edges[band]) / 2;
			let center = (edges[band + 1] + edges[band]) / 2;
			for (let node of this._polarRule(counts[band])) {
				let mu = center + half * node.mu;
				let radius = Math.sqrt(1 - mu * mu);
				for (let azimuth = 0; azimuth < 48; azimuth++) {
					let phi = (2 * Math.PI * (azimuth + 0.5)) / 48;
					let weight = (node.weight * half * 2 * Math.PI) / 48;
					if (!(weight > 0 && Number.isFinite(weight) && Number.isFinite(radius)))
						throw new RangeError('Selected flat incoming sample is invalid.');
					vectors.push(Object.freeze([radius * Math.cos(phi), radius * Math.sin(phi), mu]));
					weights.push(weight);
				}
			}
		}
		let mass = weights.reduce((sum, weight) => sum + weight, 0);
		if (vectors.length !== 1920 || Math.abs(mass - 4 * Math.PI) > 1e-11)
			throw new RangeError('Selected flat incoming measure is not a positive full-sphere quadrature.');
		this.id = 'algorithm32-flat-horizon-polar40-midpoint-azimuth48-incoming-v1';
		this.directionCount = vectors.length;
		this.unitVectors = Object.freeze(vectors);
		this.integrationWeights = Object.freeze({values: Object.freeze(weights), units: 'steradians'});
		this.polarBandEdges = edges;
		this.polarBandCounts = counts;
		this.azimuthCount = 48;
		this.azimuthOffset = 0.5;
		this.coordinateMeaning =
			'flat-radial-tangent-vertical; positive Z is slab up; geometry owns physical transforms';
		Object.freeze(this);
	}
}
