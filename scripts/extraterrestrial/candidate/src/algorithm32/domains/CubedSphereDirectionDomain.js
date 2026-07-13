import { DirectionDomainDescriptor } from './DirectionDomainDescriptor.js';
import {
	CUBED_SPHERE_DIRECTION_SCHEMA_REVISION,
	CUBED_SPHERE_DIRECTION_TOLERANCE,
	CUBED_SPHERE_EXACT_NODE_COORDINATE_TOLERANCE,
	CUBED_SPHERE_FACE_COUNT,
	CUBED_SPHERE_FACE_DEFINITIONS,
	CUBED_SPHERE_GENERATOR_REVISION,
	CUBED_SPHERE_SUPPORTED_FACE_WIDTHS,
} from './domain-consts.js';
import { canonicalZero } from './domainDescriptorSupport.js';

/**
 * Own one executable boundary-inclusive cubed-sphere reconstruction domain
 * independently of its declarative descriptor copy.
 */
export default class CubedSphereDirectionDomain {
	/** @readonly @type {DirectionDomainDescriptor} */
	descriptor;
	/** @readonly @type {number} */
	faceWidth;
	/** @readonly @type {number} */
	cellWidth;
	/** @readonly @type {number} */
	faceNodeCount;
	/** @readonly @type {number} */
	directionCount;
	/** @readonly @type {readonly CubedSphereFace[]} */
	faces;
	/** @readonly @type {readonly UnitVector3[]} */
	unitVectors;
	/** @readonly @type {CubedSpherePositiveFaceCenterIndices} */
	positiveFaceCenterIndices;

	/**
	 * Accept one complete supported domain definition.
	 *
	 * @param {CubedSphereDirectionDomainDefinition} definition - Supplies the
	 * candidate definition.
	 * @returns {{ id: string, faceWidth: number }} The accepted definition.
	 */
	_acceptDefinition(definition) {
		if (!CUBED_SPHERE_SUPPORTED_FACE_WIDTHS.includes(
			definition.faceWidth,
		)) {
			throw new RangeError(
				'CubedSphereDirectionDomain faceWidth must be one of 3, 9, or 27.',
			);
		}

		return {
			id: definition.id,
			faceWidth: definition.faceWidth,
		};
	}

	/**
	 * Copy the selected literal face convention.
	 *
	 * @returns {readonly CubedSphereFace[]} The executable faces.
	 */
	_createFaces() {
		return CUBED_SPHERE_FACE_DEFINITIONS.map((definition) => ({
			id: definition.id,
			normal: this._copyVector(definition.normal),
			uAxis: this._copyVector(definition.uAxis),
			vAxis: this._copyVector(definition.vAxis),
		}));
	}

	/**
	 * Copy one exact three-component vector with canonical zero components.
	 *
	 * @param {readonly number[]} vector - Supplies the source components.
	 * @returns {UnitVector3} The copied vector.
	 */
	_copyVector(vector) {
		return [
			canonicalZero(vector[0]),
			canonicalZero(vector[1]),
			canonicalZero(vector[2]),
		];
	}

	/**
	 * Generate source-local vectors in the retained binary64 operation order.
	 *
	 * @param {{ faceWidth: number, cellWidth: number, faceNodeCount: number,
	 * directionCount: number, faces: readonly CubedSphereFace[] }} facts -
	 * Supplies executable domain dimensions and faces.
	 * @returns {readonly UnitVector3[]} The executable vectors.
	 */
	_createUnitVectors(facts) {
		return Array.from(
			{ length: facts.directionCount },
			(_unused, index) =>
				this._createSourceLocalDirection(
					index,
					facts,
				),
		);
	}

	/**
	 * Generate one source-local cubed-sphere vector.
	 *
	 * @param {number} index - Supplies the flattened node index.
	 * @param {{ faceWidth: number, cellWidth: number, faceNodeCount: number,
	 * faces: readonly CubedSphereFace[] }} facts - Supplies domain facts.
	 * @returns {UnitVector3} The generated unit vector.
	 */
	_createSourceLocalDirection(index, facts) {
		const faceIndex = Math.floor(index / facts.faceNodeCount);
		const localIndex = index - faceIndex * facts.faceNodeCount;
		const vIndex = Math.floor(localIndex / facts.faceWidth);
		const uIndex = localIndex - vIndex * facts.faceWidth;
		const descriptor = facts.faces[faceIndex];
		const uNumerator = 2 * uIndex - facts.cellWidth;
		const vNumerator = 2 * vIndex - facts.cellWidth;
		const cubePoint = [0, 1, 2].map((component) => canonicalZero(
			descriptor.normal[component] * facts.cellWidth
			+ descriptor.uAxis[component] * uNumerator
			+ descriptor.vAxis[component] * vNumerator,
		));

		// Retain Star's identity-basis projection pass. It normalizes a second
		// time and contributes observable binary64 rounding.
		return this._normalize(
			this._normalize(cubePoint),
		);
	}

	/**
	 * Create the selected positive-axis face-center indices.
	 *
	 * @param {CubedSphereDirectionDomain} domain - Supplies the owner.
	 * @returns {CubedSpherePositiveFaceCenterIndices} The center indices.
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
	 * Create declarative metadata from executable owner facts.
	 *
	 * @param {string} id - Supplies the configured identity.
	 * @param {CubedSphereDirectionDomain} domain - Supplies executable facts.
	 * @returns {DirectionDomainDescriptor} The independent metadata descriptor.
	 */
	_createDescriptor(id, domain) {
		const uniquePhysicalDirectionCount =
			6 * (domain.faceWidth - 2) ** 2
			+ 12 * (domain.faceWidth - 2)
			+ 8;

		return new DirectionDomainDescriptor({
			id,
			schemaRevision: CUBED_SPHERE_DIRECTION_SCHEMA_REVISION,
			generatorRevision: CUBED_SPHERE_GENERATOR_REVISION,
			frame: {
				kind: 'source-local-cubed-sphere-pinned-frame-v1',
				coordinates: 'source-local',
				handedness: 'right',
				xAxisRole: 'toward-source',
				yAxisRole: 'cross-projected-up-with-source',
				zAxisRole: 'projected-up',
				worldProjection: {
					kind: 'projected-up-least-aligned-fallback-v1',
					primaryReference: [0, 0, 1],
					fallback: 'least-aligned-cartesian-axis',
					parallelTolerance: 1e-10,
				},
			},
			topology: {
				kind: 'six-face-boundary-inclusive-cubed-sphere',
				faceWidth: domain.faceWidth,
				cellWidth: domain.cellWidth,
				faceNodeCount: domain.faceNodeCount,
				storedDirectionCount: domain.directionCount,
				uniquePhysicalDirectionCount,
				flatteningOrder: 'face-major-then-v-then-u',
				faceOrder: domain.faces.map((entry) => entry.id),
				faces: domain.faces,
				faceConventionRevision: 'right-handed-gnomonic-faces-v1',
				seamStorage:
					'duplicate-identical-physical-edge-and-corner-nodes',
			},
			interpolation: {
				kind: 'dominant-face-bilinear',
				revision: 'seam-aware-boundary-nodes-v1',
				coordinateProjection: 'gnomonic-linear-cube-face',
				faceTieBreakOrder: domain.faces.map((entry) => entry.id),
				exactNodeCoordinateTolerance:
					CUBED_SPHERE_EXACT_NODE_COORDINATE_TOLERANCE,
				seamContinuity: 'c0-for-identical-physical-node-values',
			},
			precision: 'binary64-generated',
			count: domain.directionCount,
			unitVectors: domain.unitVectors,
			integrationWeights: null,
		});
	}

	/**
	 * Normalize one nonzero vector.
	 *
	 * @param {readonly number[]} vector - Supplies vector components.
	 * @returns {UnitVector3} The normalized vector.
	 */
	_normalize(vector) {
		const length = Math.hypot(...vector);

		return [
			canonicalZero(vector[0] / length),
			canonicalZero(vector[1] / length),
			canonicalZero(vector[2] / length),
		];
	}

	/**
	 * Assert one zero-based integer index.
	 *
	 * @param {number} value - Supplies the candidate.
	 * @param {number} count - Supplies the exclusive bound.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {void}
	 */
	_assertIndex(value, count, label) {
		if (!Number.isInteger(value) || value < 0 || value >= count) {
			throw new RangeError(
				`${label} must be an integer in [0, ${count}).`,
			);
		}
	}

	/**
	 * Validate one source-local unit direction.
	 *
	 * @param {UnitVector3} value - Supplies the source-local direction.
	 * @param {string} label - Supplies the diagnostic label.
	 * @returns {UnitVector3} The accepted direction.
	 */
	_assertUnitDirection(value, label) {
		const direction = /** @type {UnitVector3} */ ([
			canonicalZero(value[0]),
			canonicalZero(value[1]),
			canonicalZero(value[2]),
		]);
		const length = Math.hypot(...direction);
		if (!Number.isFinite(length)
			|| Math.abs(length - 1) > CUBED_SPHERE_DIRECTION_TOLERANCE) {
			throw new RangeError(
				`${label} must be a finite three-component unit vector.`,
			);
		}

		return direction;
	}

	/**
	 * Select the dominant face using retained face-order tie breaking.
	 *
	 * @param {UnitVector3} direction - Supplies a source-local direction.
	 * @param {readonly CubedSphereFace[]} faces - Supplies ordered faces.
	 * @returns {number} The selected face index.
	 */
	_selectDominantFace(direction, faces) {
		let selectedFaceIndex = 0;
		let selectedProjection = Number.NEGATIVE_INFINITY;

		for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
			const projection = this._dot(
				direction,
				faces[faceIndex].normal,
			);
			if (projection > selectedProjection) {
				selectedProjection = projection;
				selectedFaceIndex = faceIndex;
			}
		}

		return selectedFaceIndex;
	}

	/**
	 * Return one three-component dot product.
	 *
	 * @param {readonly number[]} left - Supplies the first vector.
	 * @param {readonly number[]} right - Supplies the second vector.
	 * @returns {number} The scalar product.
	 */
	_dot(left, right) {
		return left[0] * right[0]
			+ left[1] * right[1]
			+ left[2] * right[2];
	}

	/**
	 * Clamp one scalar to a closed interval.
	 *
	 * @param {number} value - Supplies the scalar.
	 * @param {number} minimum - Supplies the lower bound.
	 * @param {number} maximum - Supplies the upper bound.
	 * @returns {number} The clamped scalar.
	 */
	_clamp(value, minimum, maximum) {
		return Math.max(minimum, Math.min(maximum, value));
	}

	/**
	 * Map a normalized face coordinate onto the node grid.
	 *
	 * @param {number} value - Supplies a coordinate in [-1, 1].
	 * @param {number} cellWidth - Supplies the cell width.
	 * @returns {number} The continuous grid coordinate.
	 */
	_normalizedCoordinateToGrid(value, cellWidth) {
		return this._clamp(
			(value + 1) * 0.5 * cellWidth,
			0,
			cellWidth,
		);
	}

	/**
	 * Resolve one grid coordinate into its retained interpolation pair.
	 *
	 * @param {number} value - Supplies the grid coordinate.
	 * @param {number} faceWidth - Supplies the face width.
	 * @returns {{ lower: number, upper: number, fraction: number,
	 * exact: boolean }} The grid location.
	 */
	_gridLocation(value, faceWidth) {
		const nearest = Math.round(value);
		if (Math.abs(value - nearest)
			<= CUBED_SPHERE_EXACT_NODE_COORDINATE_TOLERANCE) {
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
	 * Add one positive interpolation tap, combining duplicate indices.
	 *
	 * @param {Map<number, number>} taps - Supplies accumulated taps.
	 * @param {number} index - Supplies the flattened index.
	 * @param {number} weight - Supplies the interpolation weight.
	 * @returns {void}
	 */
	_addTap(taps, index, weight) {
		if (weight <= 0) {
			return;
		}

		taps.set(index, (taps.get(index) ?? 0) + weight);
	}

	/**
	 * Normalize accumulated interpolation taps in insertion order.
	 *
	 * @param {Map<number, number>} taps - Supplies accumulated taps.
	 * @returns {ScatteringCacheDirectionStencil} The normalized stencil.
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

		const total = weights.reduce((sum, weight) => sum + weight, 0);
		if (!(total > 0) || !Number.isFinite(total)) {
			throw new RangeError(
				'Cubed-sphere stencil must have a positive finite weight sum.',
			);
		}

		for (let index = 0; index < weights.length; index += 1) {
			weights[index] /= total;
		}

		return { indices, weights };
	}

	/**
	 * Create one supported source-local cubed-sphere domain.
	 *
	 * @param {CubedSphereDirectionDomainDefinition} definition - Supplies the
	 * domain identity and selected face width.
	 */
	constructor(definition) {
		const accepted =
			this._acceptDefinition(definition);
		const cellWidth = accepted.faceWidth - 1;
		const faceNodeCount = accepted.faceWidth * accepted.faceWidth;
		const directionCount = CUBED_SPHERE_FACE_COUNT * faceNodeCount;
		const faces = this._createFaces();
		const unitVectors = this._createUnitVectors({
			faceWidth: accepted.faceWidth,
			cellWidth,
			faceNodeCount,
			directionCount,
			faces,
		});

		this.faceWidth = accepted.faceWidth;
		this.cellWidth = cellWidth;
		this.faceNodeCount = faceNodeCount;
		this.directionCount = directionCount;
		this.faces = faces;
		this.unitVectors = unitVectors;
		this.positiveFaceCenterIndices =
			this._createPositiveFaceCenterIndices(this);
		this.descriptor = this._createDescriptor(
			accepted.id,
			this,
		);
	}

	/**
	 * Flatten a face-local node in face-major, v-major, u-minor order.
	 *
	 * @param {number} faceIndex - Supplies the face index.
	 * @param {number} uIndex - Supplies the horizontal node index.
	 * @param {number} vIndex - Supplies the vertical node index.
	 * @returns {number} The flattened storage index.
	 */
	flattenNodeIndex(faceIndex, uIndex, vIndex) {
		this._assertIndex(
			faceIndex,
			CUBED_SPHERE_FACE_COUNT,
			'faceIndex',
		);
		this._assertIndex(
			uIndex,
			this.faceWidth,
			'uIndex',
		);
		this._assertIndex(
			vIndex,
			this.faceWidth,
			'vIndex',
		);

		return faceIndex * this.faceNodeCount
			+ vIndex * this.faceWidth
			+ uIndex;
	}

	/**
	 * Reverse the selected flattened storage order.
	 *
	 * @param {number} index - Supplies the flattened node index.
	 * @returns {CubedSphereNodeAddress} The face-local address.
	 */
	unflattenNodeIndex(index) {
		this._assertIndex(
			index,
			this.directionCount,
			'index',
		);
		const faceIndex = Math.floor(index / this.faceNodeCount);
		const localIndex = index - faceIndex * this.faceNodeCount;
		const vIndex = Math.floor(localIndex / this.faceWidth);
		const uIndex = localIndex - vIndex * this.faceWidth;

		return {
			faceIndex,
			faceId: this.faces[faceIndex].id,
			uIndex,
			vIndex,
		};
	}

	/**
	 * Resolve the retained dominant-face bilinear construction stencil.
	 *
	 * @param {UnitVector3} direction - Supplies a source-local unit direction.
	 * @returns {ScatteringCacheDirectionStencil} One to four interpolation taps.
	 */
	resolveStencil(direction) {
		const localDirection = this._assertUnitDirection(
			direction,
			'Cubed-sphere lookup direction',
		);
		const faceIndex = this._selectDominantFace(
			localDirection,
			this.faces,
		);
		const faceDescriptor = this.faces[faceIndex];
		const denominator = this._dot(
			localDirection,
			faceDescriptor.normal,
		);
		const u = this._clamp(
			this._dot(
				localDirection,
				faceDescriptor.uAxis,
			) / denominator,
			-1,
			1,
		);
		const v = this._clamp(
			this._dot(
				localDirection,
				faceDescriptor.vAxis,
			) / denominator,
			-1,
			1,
		);
		const uLocation = this._gridLocation(
			this._normalizedCoordinateToGrid(
				u,
				this.cellWidth,
			),
			this.faceWidth,
		);
		const vLocation = this._gridLocation(
			this._normalizedCoordinateToGrid(
				v,
				this.cellWidth,
			),
			this.faceWidth,
		);

		if (uLocation.exact && vLocation.exact) {
			return {
				indices: [this.flattenNodeIndex(
					faceIndex,
					uLocation.lower,
					vLocation.lower,
				)],
				weights: [1],
			};
		}

		const taps = new Map();
		this._addTap(
			taps,
			this.flattenNodeIndex(
				faceIndex,
				uLocation.lower,
				vLocation.lower,
			),
			(1 - uLocation.fraction) * (1 - vLocation.fraction),
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(
				faceIndex,
				uLocation.upper,
				vLocation.lower,
			),
			uLocation.fraction * (1 - vLocation.fraction),
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(
				faceIndex,
				uLocation.lower,
				vLocation.upper,
			),
			(1 - uLocation.fraction) * vLocation.fraction,
		);
		this._addTap(
			taps,
			this.flattenNodeIndex(
				faceIndex,
				uLocation.upper,
				vLocation.upper,
			),
			uLocation.fraction * vLocation.fraction,
		);

		return this._createNormalizedStencil(taps);
	}
}
