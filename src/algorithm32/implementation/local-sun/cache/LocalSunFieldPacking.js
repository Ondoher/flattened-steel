/** Object that owns executable direction-fastest storage for one local-Sun field. */
export default class LocalSunFieldPacking {
	/**
	 * Kind value.
	 *
	 *  @readonly @type {"local-sun-field-packing"}
	 *
	 */
	kind;
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
	 * Position count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	positionCount;
	/**
	 * Wavelength count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	wavelengthCount;
	/**
	 * Scalar count value.
	 *
	 *  @readonly @type {number}
	 *
	 */
	scalarCount;
	/**
	 * Creates local-Sun storage from accepted logical dimensions.
	 *
	 * @param {LocalSunFieldPackingDefinition} definition - Supplies identity and dimensions.
	 *
	 */
	constructor(definition) {
		this.kind = 'local-sun-field-packing';
		this.id = definition.id;
		this.directionCount = definition.directionCount;
		this.positionCount = definition.positionCount;
		this.wavelengthCount = definition.wavelengthCount;
		this.scalarCount = definition.directionCount * definition.positionCount * definition.wavelengthCount;
	}

	/**
	 * Called by local sun field packing to require a zero-based safe integer within a bound.
	 *
	 * @param {number} value - Supplies the candidate.
	 * @param {number} count - Supplies the exclusive bound.
	 * @param {string} label - Supplies the coordinate label.
	 * @returns {void} -
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_assertIndex(value, count, label) {
		if (!Number.isSafeInteger(value) || value < 0 || value >= count) {
			throw new RangeError(`${label} must be a safe integer in [0, ${count}).`);
		}
	}

	/**
	 * Call this method to return the direction-fastest scalar offset.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - Supplies logical coordinates.
	 * @returns {number} - The scalar offset.
	 */
	offset(coordinates) {
		this._assertIndex(coordinates.directionIndex, this.directionCount, 'directionIndex');
		this._assertIndex(coordinates.positionIndex, this.positionCount, 'positionIndex');
		this._assertIndex(coordinates.wavelengthIndex, this.wavelengthCount, 'wavelengthIndex');

		return (
			coordinates.directionIndex +
			this.directionCount * (coordinates.positionIndex + this.positionCount * coordinates.wavelengthIndex)
		);
	}

	/**
	 * Call this method to recover logical coordinates from one scalar offset.
	 *
	 * @param {number} offset - Supplies a scalar offset.
	 * @returns {DirectionalSpectralFieldCoordinates} - The logical coordinates.
	 */
	coordinatesAt(offset) {
		this._assertIndex(offset, this.scalarCount, 'offset');
		const wavelengthStride = this.directionCount * this.positionCount;
		const wavelengthIndex = Math.floor(offset / wavelengthStride);
		const wavelengthRemainder = offset - wavelengthIndex * wavelengthStride;
		const positionIndex = Math.floor(wavelengthRemainder / this.directionCount);
		const directionIndex = wavelengthRemainder - positionIndex * this.directionCount;

		return {directionIndex, positionIndex, wavelengthIndex};
	}
}
