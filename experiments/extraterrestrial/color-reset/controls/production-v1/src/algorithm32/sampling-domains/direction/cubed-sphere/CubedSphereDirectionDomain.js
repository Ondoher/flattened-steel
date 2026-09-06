import ScalarMath from '../../../math/ScalarMath.js';
import VectorMath from '../../../math/VectorMath.js';

/**
 * Executable boundary-inclusive cubed-sphere reconstruction domain.
 * @implements {ReconstructionDirectionDomain}
 */
export default class CubedSphereDirectionDomain {
	/**
	 * Unique identifier for the executable domain.
	 *
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * Number of nodes along one face edge.
	 *
	 * @readonly
	 * @type {number}
	 */
	faceWidth;
	/**
	 * Number of cells along one face edge.
	 *
	 * @readonly
	 * @type {number}
	 */
	cellWidth;
	/**
	 * Number of nodes on one face.
	 *
	 * @readonly
	 * @type {number}
	 */
	faceNodeCount;
	/**
	 * Total number of directions in the domain.
	 *
	 * @readonly
	 * @type {number}
	 */
	directionCount;
	/**
	 * Ordered executable face definitions.
	 *
	 * @readonly
	 * @type {readonly CubedSphereFace[]}
	 */
	faces;
	/**
	 * Source-local unit vectors in flattened storage order.
	 *
	 * @readonly
	 * @type {readonly UnitVector3[]}
	 */
	unitVectors;
	/**
	 * Unique source-local unit vectors in first-logical-occurrence order.
	 *
	 * @readonly
	 * @type {readonly UnitVector3[]}
	 */
	uniqueUnitVectors;
	/**
	 * Exact logical-direction to unique-direction indices.
	 *
	 * @readonly
	 * @type {Uint16Array}
	 */
	logicalToUniqueDirectionIndices;
	/**
	 * Number of unique physical directions after exact Float32 seam identity.
	 *
	 * @readonly
	 * @type {number}
	 */
	uniqueDirectionCount;
	/**
	 * Absent integration weights for this reconstruction-only domain.
	 *
	 * @readonly
	 * @type {null}
	 */
	integrationWeights;
	/**
	 * Flattened positive-axis face-center indices.
	 *
	 * @readonly
	 * @type {CubedSpherePositiveFaceCenterIndices}
	 */
	positiveFaceCenterIndices;

	/**
	 * Called by domain construction and lookup to canonicalize signed zero without changing nonzero components. Conditional result values are selected from the accepted input and current state.
	 *
	 * @param {number} value - The physical component.
	 * @returns {number} - Canonical zero or the original value.
	 */
	_canonicalZero(value) {
		return value === 0 ? 0 : value;
	}

	/**
	 * Called by construction to accept one complete supported domain definition.
	 *
	 * @param {CubedSphereDirectionDomainDefinition} definition - The candidate definition.
	 * @returns {CubedSphereDirectionDomainDefinition} - The accepted definition.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_acceptDefinition(definition) {
		if (![3, 9, 27].includes(definition.faceWidth)) {
			throw new RangeError('CubedSphereDirectionDomain faceWidth must be one of 3, 9, or 27.');
		}

		return {
			id: definition.id,
			faceWidth: definition.faceWidth,
		};
	}

	/**
	 * Called by construction to copy the selected literal face convention.
	 *
	 * @returns {readonly CubedSphereFace[]} - The executable faces.
	 */
	_createFaces() {
		return [
			{
				id: 'positive-x',
				normal: [1, 0, 0],
				uAxis: [0, 1, 0],
				vAxis: [0, 0, 1],
			},
			{
				id: 'negative-x',
				normal: [-1, 0, 0],
				uAxis: [0, -1, 0],
				vAxis: [0, 0, 1],
			},
			{
				id: 'positive-y',
				normal: [0, 1, 0],
				uAxis: [-1, 0, 0],
				vAxis: [0, 0, 1],
			},
			{
				id: 'negative-y',
				normal: [0, -1, 0],
				uAxis: [1, 0, 0],
				vAxis: [0, 0, 1],
			},
			{
				id: 'positive-z',
				normal: [0, 0, 1],
				uAxis: [1, 0, 0],
				vAxis: [0, 1, 0],
			},
			{
				id: 'negative-z',
				normal: [0, 0, -1],
				uAxis: [-1, 0, 0],
				vAxis: [0, 1, 0],
			},
		].map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param definition - The definition value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (definition) => ({
				id: definition.id,
				normal: this._copyVector(definition.normal),
				uAxis: this._copyVector(definition.uAxis),
				vAxis: this._copyVector(definition.vAxis),
			}),
		);
	}

	/**
	 * Called by face construction to copy one exact vector with canonical zero components.
	 *
	 * @param {readonly number[]} vector - The source components.
	 * @returns {UnitVector3} - The copied vector.
	 */
	_copyVector(vector) {
		return [this._canonicalZero(vector[0]), this._canonicalZero(vector[1]), this._canonicalZero(vector[2])];
	}

	/**
	 * Called by construction to generate source-local vectors in the retained binary64 operation order.
	 *
	 * @param {CubedSphereDirectionGenerationFacts} facts - The executable domain dimensions and faces.
	 * @returns {readonly UnitVector3[]} - The executable vectors.
	 */
	_createUnitVectors(facts) {
		return Array.from(
			{length: facts.directionCount},
			/**
			 * Called by the surrounding operation to handle one callback invocation.
			 * @param _unused - The intentionally unused callback value.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (_unused, index) => this._createSourceLocalDirection(index, facts),
		);
	}

	/**
	 * Called by construction to derive the exact Float32 seam codec used by resident cubed-sphere assets.
	 *
	 * @param {readonly UnitVector3[]} unitVectors - The logical direction vectors.
	 * @returns {CubedSphereExactSeamMapping} - The unique vectors and logical index map.
	 */
	_createExactSeamMapping(unitVectors) {
		const uniqueIndexByKey = new Map();
		const uniqueUnitVectors = [];
		const logicalToUniqueDirectionIndices = new Uint16Array(unitVectors.length);

		for (let logicalIndex = 0; logicalIndex < unitVectors.length; logicalIndex += 1) {
			const unitVector = unitVectors[logicalIndex];
			const key = unitVector.map(Math.fround).join(',');
			let uniqueIndex = uniqueIndexByKey.get(key);

			if (uniqueIndex === undefined) {
				uniqueIndex = uniqueUnitVectors.length;
				uniqueIndexByKey.set(key, uniqueIndex);
				uniqueUnitVectors.push(unitVector);
			}

			logicalToUniqueDirectionIndices[logicalIndex] = uniqueIndex;
		}

		return {
			uniqueUnitVectors,
			logicalToUniqueDirectionIndices,
		};
	}

	/**
	 * Called by domain generation to create one source-local cubed-sphere vector.
	 *
	 * @param {number} index - The flattened node index.
	 * @param {CubedSphereDirectionGenerationFacts} facts - The executable domain dimensions and faces.
	 * @returns {UnitVector3} - The generated unit vector.
	 */
	_createSourceLocalDirection(index, facts) {
		const faceIndex = Math.floor(index / facts.faceNodeCount);
		const localIndex = index - faceIndex * facts.faceNodeCount;
		const faceVIndex = Math.floor(localIndex / facts.faceWidth);
		const faceUIndex = localIndex - faceVIndex * facts.faceWidth;
		const face = facts.faces[faceIndex];
		const uNumerator = 2 * faceUIndex - facts.cellWidth;
		const vNumerator = 2 * faceVIndex - facts.cellWidth;
		const cubePoint = [0, 1, 2].map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param component - The component value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (component) =>
				this._canonicalZero(
					face.normal[component] * facts.cellWidth +
						face.uAxis[component] * uNumerator +
						face.vAxis[component] * vNumerator,
				),
		);

		// Retain the production identity-basis projection pass. It normalizes a second
		// time and contributes observable binary64 rounding.
		return this._normalize(this._normalize(cubePoint));
	}

	/**
	 * Called by construction to create the selected positive-axis face-center indices.
	 *
	 * @param {CubedSphereDirectionDomain} domain - The executable domain owner.
	 * @returns {CubedSpherePositiveFaceCenterIndices} - The center indices.
	 */
	_createPositiveFaceCenterIndices(domain) {
		const center = (domain.faceWidth - 1) / 2;

		return {
			positiveX: domain.flattenNodeIndex(0, center, center),
			positiveY: domain.flattenNodeIndex(2, center, center),
			positiveZ: domain.flattenNodeIndex(4, center, center),
		};
	}

	/**
	 * Called by domain generation to normalize one nonzero vector.
	 *
	 * @param {readonly number[]} vector - The vector components.
	 * @returns {UnitVector3} - The normalized vector.
	 */
	_normalize(vector) {
		const length = Math.hypot(...vector);

		return [
			this._canonicalZero(vector[0] / length),
			this._canonicalZero(vector[1] / length),
			this._canonicalZero(vector[2] / length),
		];
	}

	/**
	 * Called by addressing methods to assert one zero-based integer index.
	 *
	 * @param {number} value - The candidate index.
	 * @param {number} count - The exclusive upper bound.
	 * @param {string} label - The diagnostic label.
	 * @returns {void} - No value.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertIndex(value, count, label) {
		if (!Number.isInteger(value) || value < 0 || value >= count) {
			throw new RangeError(`${label} must be an integer in [0, ${count}).`);
		}
	}

	/**
	 * Called by stencil resolution to validate one source-local unit direction.
	 *
	 * @param {UnitVector3} value - The source-local direction.
	 * @param {string} label - The diagnostic label.
	 * @returns {UnitVector3} - The accepted direction.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertUnitDirection(value, label) {
		const direction = /** @type {UnitVector3} */ ([
			this._canonicalZero(value[0]),
			this._canonicalZero(value[1]),
			this._canonicalZero(value[2]),
		]);
		const length = Math.hypot(...direction);
		if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-6) {
			throw new RangeError(`${label} must be a finite three-component unit vector.`);
		}

		return direction;
	}

	/**
	 * Called by stencil resolution to select the dominant face using retained face-order tie breaking.
	 *
	 * @param {UnitVector3} direction - The source-local direction.
	 * @param {readonly CubedSphereFace[]} faces - The ordered face definitions.
	 * @returns {number} - The selected face index.
	 */
	_selectDominantFace(direction, faces) {
		let selectedFaceIndex = 0;
		let selectedProjection = Number.NEGATIVE_INFINITY;

		for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
			const projection = VectorMath.dot(direction, faces[faceIndex].normal);
			if (projection > selectedProjection) {
				selectedProjection = projection;
				selectedFaceIndex = faceIndex;
			}
		}

		return selectedFaceIndex;
	}

	/**
	 * Called by stencil resolution to map a normalized face coordinate onto the node grid.
	 *
	 * @param {number} value - The normalized coordinate in [-1, 1].
	 * @param {number} cellWidth - The number of cells along the face edge.
	 * @returns {number} - The continuous grid coordinate.
	 */
	_normalizedCoordinateToGrid(value, cellWidth) {
		return ScalarMath.clamp((value + 1) * 0.5 * cellWidth, 0, cellWidth);
	}

	/**
	 * Called by stencil resolution to resolve one grid coordinate into its retained interpolation pair. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {number} value - The continuous grid coordinate.
	 * @param {number} faceWidth - The number of nodes along the face edge.
	 * @returns {CubedSphereGridLocation} - The grid location.
	 */
	_gridLocation(value, faceWidth) {
		const nearest = Math.round(value);
		if (Math.abs(value - nearest) <= 1e-10) {
			return {
				lower: nearest,
				upper: nearest,
				fraction: 0,
				exact: true,
			};
		}

		const lower = Math.floor(value);
		const upper = Math.min(lower + 1, faceWidth - 1);

		return {
			lower,
			upper,
			fraction: value - lower,
			exact: false,
		};
	}

	/**
	 * Called by stencil resolution to add one positive interpolation tap and combine duplicate indices.
	 *
	 * @param {Map<number, number>} taps - The accumulated interpolation taps.
	 * @param {number} index - The flattened direction index.
	 * @param {number} weight - The interpolation weight.
	 * @returns {void} - No value.
	 */
	_addTap(taps, index, weight) {
		if (weight <= 0) {
			return;
		}

		taps.set(index, (taps.get(index) ?? 0) + weight);
	}

	/**
	 * Called by stencil resolution to normalize accumulated interpolation taps in insertion order.
	 *
	 * @param {Map<number, number>} taps - The accumulated interpolation taps.
	 * @returns {ScatteringCacheDirectionStencil} - The normalized stencil.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_createNormalizedStencil(taps) {
		const indices = [];
		const weights = [];

		for (const [index, weight] of taps) {
			if (weight > 0) {
				indices.push(index);
				weights.push(weight);
			}
		}

		const total = weights.reduce(
			/**
			 * Called by Array.prototype.reduce to accumulate one collection value.
			 * @param sum - The sum value accepted by the operation.
			 * @param weight - The weight value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (sum, weight) => sum + weight,
			0,
		);
		if (!(total > 0) || !Number.isFinite(total)) {
			throw new RangeError('Cubed-sphere stencil must have a positive finite weight sum.');
		}

		for (let index = 0; index < weights.length; index += 1) {
			weights[index] /= total;
		}

		return {indices, weights};
	}

	/**
	 * Creates one supported source-local cubed-sphere domain.
	 *
	 * @param {CubedSphereDirectionDomainDefinition} definition - The domain identity and selected face width.
	 */
	constructor(definition) {
		const accepted = this._acceptDefinition(definition);
		const cellWidth = accepted.faceWidth - 1;
		const faceNodeCount = accepted.faceWidth * accepted.faceWidth;
		const directionCount = 6 * faceNodeCount;
		const faces = this._createFaces();
		const unitVectors = this._createUnitVectors({
			faceWidth: accepted.faceWidth,
			cellWidth,
			faceNodeCount,
			directionCount,
			faces,
		});
		const exactSeamMapping = this._createExactSeamMapping(unitVectors);

		this.id = accepted.id;
		this.faceWidth = accepted.faceWidth;
		this.cellWidth = cellWidth;
		this.faceNodeCount = faceNodeCount;
		this.directionCount = directionCount;
		this.faces = faces;
		this.unitVectors = unitVectors;
		this.uniqueUnitVectors = exactSeamMapping.uniqueUnitVectors;
		this.logicalToUniqueDirectionIndices = exactSeamMapping.logicalToUniqueDirectionIndices;
		this.uniqueDirectionCount = exactSeamMapping.uniqueUnitVectors.length;
		this.integrationWeights = null;
		this.positiveFaceCenterIndices = this._createPositiveFaceCenterIndices(this);
	}

	/**
	 * Call this method to flatten a face-local node in face-major, v-major, u-minor order.
	 *
	 * @param {number} faceIndex - The zero-based face index.
	 * @param {number} faceUIndex - The zero-based horizontal node index.
	 * @param {number} faceVIndex - The zero-based vertical node index.
	 * @returns {number} - The flattened storage index.
	 */
	flattenNodeIndex(faceIndex, faceUIndex, faceVIndex) {
		this._assertIndex(faceIndex, 6, 'faceIndex');
		this._assertIndex(faceUIndex, this.faceWidth, 'uIndex');
		this._assertIndex(faceVIndex, this.faceWidth, 'vIndex');

		return faceIndex * this.faceNodeCount + faceVIndex * this.faceWidth + faceUIndex;
	}

	/**
	 * Call this method to reverse the selected flattened storage order.
	 *
	 * @param {number} index - The flattened node index.
	 * @returns {CubedSphereNodeAddress} - The face-local address.
	 */
	unflattenNodeIndex(index) {
		this._assertIndex(index, this.directionCount, 'index');
		const faceIndex = Math.floor(index / this.faceNodeCount);
		const localIndex = index - faceIndex * this.faceNodeCount;
		const faceVIndex = Math.floor(localIndex / this.faceWidth);
		const faceUIndex = localIndex - faceVIndex * this.faceWidth;

		return {
			faceIndex,
			faceId: this.faces[faceIndex].id,
			uIndex: faceUIndex,
			vIndex: faceVIndex,
		};
	}

	/**
	 * Call this method to resolve the retained dominant-face bilinear construction stencil. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
	 *
	 * @param {UnitVector3} direction - The source-local unit direction.
	 * @returns {ScatteringCacheDirectionStencil} - One to four interpolation taps.
	 */
	resolveStencil(direction) {
		const localDirection = this._assertUnitDirection(direction, 'Cubed-sphere lookup direction');
		const faceIndex = this._selectDominantFace(localDirection, this.faces);
		const face = this.faces[faceIndex];
		const denominator = VectorMath.dot(localDirection, face.normal);
		const faceUCoordinate = ScalarMath.clamp(VectorMath.dot(localDirection, face.uAxis) / denominator, -1, 1);
		const faceVCoordinate = ScalarMath.clamp(VectorMath.dot(localDirection, face.vAxis) / denominator, -1, 1);
		const uLocation = this._gridLocation(
			this._normalizedCoordinateToGrid(faceUCoordinate, this.cellWidth),
			this.faceWidth,
		);
		const vLocation = this._gridLocation(
			this._normalizedCoordinateToGrid(faceVCoordinate, this.cellWidth),
			this.faceWidth,
		);

		if (uLocation.exact && vLocation.exact) {
			return {
				indices: [this.flattenNodeIndex(faceIndex, uLocation.lower, vLocation.lower)],
				weights: [1],
			};
		}

		const taps = new Map();
		this._addTap(
			taps,
			this.flattenNodeIndex(faceIndex, uLocation.lower, vLocation.lower),
			(1 - uLocation.fraction) * (1 - vLocation.fraction),
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(faceIndex, uLocation.upper, vLocation.lower),
			uLocation.fraction * (1 - vLocation.fraction),
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(faceIndex, uLocation.lower, vLocation.upper),
			(1 - uLocation.fraction) * vLocation.fraction,
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(faceIndex, uLocation.upper, vLocation.upper),
			uLocation.fraction * vLocation.fraction,
		);

		return this._createNormalizedStencil(taps);
	}
}
