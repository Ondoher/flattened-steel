import { createDenseScalarArrayLayout } from '../caches/DenseScalarArrayLayout.js';

/** Own executable direction-fastest storage for one local-Sun field. */
export default class LocalSunFieldPacking {
	/** @readonly @type {"local-sun-field-packing"} */
	kind;
	/** @readonly @type {string} */
	id;
	/** @readonly @type {number} */
	directionCount;
	/** @readonly @type {number} */
	positionCount;
	/** @readonly @type {number} */
	wavelengthCount;
	/** @readonly @type {number} */
	scalarCount;
	/** @readonly @type {DenseScalarArrayLayoutDescriptor} */
	layout;

	/**
	 * Create local-Sun storage from accepted logical dimensions.
	 *
	 * @param {LocalSunFieldPackingDefinition} definition - Supplies identity and dimensions.
	 */
	constructor(definition) {
		this.kind = 'local-sun-field-packing';
		this.id = definition.id;
		this.directionCount = definition.directionCount;
		this.positionCount = definition.positionCount;
		this.wavelengthCount = definition.wavelengthCount;
		this.scalarCount = definition.directionCount
			* definition.positionCount
			* definition.wavelengthCount;
		this.layout = createDenseScalarArrayLayout({
			id: `${definition.id}-layout`,
			directionCount: definition.directionCount,
			positionCount: definition.positionCount,
			wavelengthCount: definition.wavelengthCount,
		});
	}

	/**
	 * Require a zero-based safe integer within a bound.
	 *
	 * @param {number} value - Supplies the candidate.
	 * @param {number} count - Supplies the exclusive bound.
	 * @param {string} label - Supplies the coordinate label.
	 * @returns {void}
	 */
	_assertIndex(value, count, label) {
		if (!Number.isSafeInteger(value)
			|| value < 0
			|| value >= count) {
			throw new RangeError(
				`${label} must be a safe integer in [0, ${count}).`,
			);
		}
	}

	/**
	 * Return the direction-fastest scalar offset.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - Supplies logical coordinates.
	 * @returns {number} The scalar offset.
	 */
	offset(coordinates) {
		this._assertIndex(
			coordinates.directionIndex,
			this.directionCount,
			'directionIndex',
		);
		this._assertIndex(
			coordinates.positionIndex,
			this.positionCount,
			'positionIndex',
		);
		this._assertIndex(
			coordinates.wavelengthIndex,
			this.wavelengthCount,
			'wavelengthIndex',
		);

		return coordinates.directionIndex
			+ this.directionCount * (
				coordinates.positionIndex
				+ this.positionCount * coordinates.wavelengthIndex
			);
	}

	/**
	 * Recover logical coordinates from one scalar offset.
	 *
	 * @param {number} offset - Supplies a scalar offset.
	 * @returns {DirectionalSpectralFieldCoordinates} The logical coordinates.
	 */
	coordinatesAt(offset) {
		this._assertIndex(offset, this.scalarCount, 'offset');
		const wavelengthStride = this.directionCount * this.positionCount;
		const wavelengthIndex = Math.floor(offset / wavelengthStride);
		const wavelengthRemainder = offset - wavelengthIndex * wavelengthStride;
		const positionIndex = Math.floor(
			wavelengthRemainder / this.directionCount,
		);
		const directionIndex = wavelengthRemainder
			- positionIndex * this.directionCount;

		return { directionIndex, positionIndex, wavelengthIndex };
	}
}
