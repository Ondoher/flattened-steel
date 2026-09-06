/**
 * Object that owns the executable paired-Fibonacci-34 incoming quadrature.
 * @implements {WeightedDirectionDomain}
 */
export default class PairedFibonacci34DirectionDomain {
	/**
	 * Id value.
	 *
	 *  @readonly @type {string}
	 *
	 */
	id;
	/**
	 * Direction count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	directionCount;
	/**
	 * Number of paired directions.
	 *
	 *  @readonly @type {number}
	 *
	 */
	pairCount;
	/**
	 * Unit vectors value.
	 *
	 *  @readonly @type {readonly UnitVector3[]}
	 *
	 */
	unitVectors;
	/**
	 * Integration weights value.
	 *
	 *  @readonly @type {SolidAngleWeights}
	 *
	 */
	integrationWeights;

	/**
	 * Called by the constructor to copy the exact selected production vectors.
	 * Pinning these values keeps the executable domain and its content identity
	 * stable across JavaScript engines.
	 *
	 * Accepted Stage 9.6 paired-domain authority SHA-256:
	 * `28d3af0f7d80b726458dd4b0a158608bae5167f9c75edff0b4e6147907fd5c65`.
	 *
	 * @returns {readonly UnitVector3[]} - The copied production vectors.
	 */
	_createUnitVectors() {
		return [
			[0.029411764705882353, 0.9995673804686135, 0],
			[-0.029411764705882353, -0.9995673804686135, 0],
			[0.08823529411764706, -0.7344928888297714, -0.6728556525217496],
			[-0.08823529411764706, 0.7344928888297714, 0.6728556525217496],
			[0.14705882352941177, 0.08647521023124194, 0.9853404185547286],
			[-0.14705882352941177, -0.08647521023124194, -0.9853404185547286],
			[0.20588235294117646, 0.5954041234944898, -0.7765992444453981],
			[-0.20588235294117646, -0.5954041234944898, 0.7765992444453981],
			[0.2647058823529412, -0.9495879623539826, 0.16796873994931993],
			[-0.2647058823529412, 0.9495879623539826, -0.16796873994931993],
			[0.3235294117647059, 0.7983765439406489, 0.5078618058178509],
			[-0.3235294117647059, -0.7983765439406489, -0.5078618058178509],
			[0.38235294117647056, -0.23987862412859257, -0.892336525118117],
			[-0.38235294117647056, 0.23987862412859257, 0.892336525118117],
			[0.4411764705882353, -0.41362735298985337, 0.7964142983761122],
			[-0.4411764705882353, 0.41362735298985337, -0.7964142983761122],
			[0.5, 0.813476104932415, -0.29708016881640964],
			[-0.5, -0.813476104932415, 0.29708016881640964],
			[0.5588235294117647, -0.7665473823801899, -0.3164196162406141],
			[-0.5588235294117647, 0.7665473823801899, 0.3164196162406141],
			[0.6176470588235294, 0.333335975491162, 0.712319617987599],
			[-0.6176470588235294, -0.333335975491162, -0.712319617987599],
			[0.6764705882352942, 0.22041348246789388, -0.7027129143533443],
			[-0.6764705882352942, -0.22041348246789388, 0.7027129143533443],
			[0.7352941176470589, -0.5863953004239032, 0.3398280626940532],
			[-0.7352941176470589, 0.5863953004239032, -0.3398280626940532],
			[0.7941176470588235, 0.5935884415205595, 0.13049875372183153],
			[-0.7941176470588235, -0.5935884415205595, -0.13049875372183153],
			[0.8529411764705882, -0.3002216107411105, -0.4270343474768535],
			[-0.8529411764705882, 0.3002216107411105, 0.4270343474768535],
			[0.9117647058823529, -0.05278100354538891, 0.40730736154900044],
			[-0.9117647058823529, 0.05278100354538891, -0.40730736154900044],
			[0.9705882352941176, 0.18408593454310446, -0.1551478205197947],
			[-0.9705882352941176, -0.18408593454310446, 0.1551478205197947],
		].map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param vector - The vector value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (vector) => /** @type {UnitVector3} */ ([vector[0], vector[1], vector[2]]),
		);
	}

	/** Creates the fixed production paired-Fibonacci-34 quadrature. */
	constructor() {
		const unitVectors = this._createUnitVectors();
		const integrationWeights = {
			values: Array.from(
				{length: 34},
				/**
				 * Called by the surrounding operation to handle one callback invocation.
				 * @returns - The callback result returned to its caller.
				 */ () => 0.36959913571644626,
			),
			units: /** @type {const} */ ('steradians'),
		};

		this.id = 'algorithm32-paired-fibonacci-34-incoming-v1';
		this.directionCount = 34;
		this.pairCount = 17;
		this.unitVectors = unitVectors;
		this.integrationWeights = integrationWeights;
	}
}
