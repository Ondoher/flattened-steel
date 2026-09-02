/** Object that owns executable direction-fastest storage for one distant-Sun field. */
export class DistantSunFieldPacking {
	/**
	 * Kind value.
	 *
	 *  @readonly @type {"distant-sun-field-packing"}
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
	 * Creates source-owned executable packing from typed logical field counts.
	 *
	 * @param {DistantSunFieldPackingDefinition} definition - Supplies packing
	 * identity and direction, position, and wavelength counts.
	 *
	 */
	constructor(definition) {
		const {id, directionCount, positionCount, wavelengthCount} = definition;

		this.kind = 'distant-sun-field-packing';
		this.id = id;
		this.directionCount = directionCount;
		this.positionCount = positionCount;
		this.wavelengthCount = wavelengthCount;
		this.scalarCount = directionCount * positionCount * wavelengthCount;
	}

	/**
	 * Called by distant sun field packing to require one zero-based safe integer within an executable bound.
	 *
	 * @param {number} value - Supplies the candidate index.
	 * @param {number} count - Supplies the exclusive upper bound.
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
	 * Call this method to return one direction-fastest linear scalar offset.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - Supplies
	 * logical scalar coordinates.
	 * @returns {number} - Return the zero-based linear offset.
	 */
	offset(coordinates) {
		const {directionIndex, positionIndex, wavelengthIndex} = coordinates;
		this._assertIndex(directionIndex, this.directionCount, 'directionIndex');
		this._assertIndex(positionIndex, this.positionCount, 'positionIndex');
		this._assertIndex(wavelengthIndex, this.wavelengthCount, 'wavelengthIndex');

		return directionIndex + this.directionCount * (positionIndex + this.positionCount * wavelengthIndex);
	}

	/**
	 * Call this method to recover logical coordinates from one declared scalar offset.
	 *
	 * @param {number} offset - Supplies the zero-based linear offset.
	 * @returns {DirectionalSpectralFieldCoordinates} - Return readonly logical scalar coordinates.
	 */
	coordinatesAt(offset) {
		this._assertIndex(offset, this.scalarCount, 'offset');
		const wavelengthStride = this.directionCount * this.positionCount;
		const wavelengthIndex = Math.floor(offset / wavelengthStride);
		const wavelengthRemainder = offset - wavelengthIndex * wavelengthStride;
		const positionIndex = Math.floor(wavelengthRemainder / this.directionCount);
		const directionIndex = wavelengthRemainder - positionIndex * this.directionCount;

		return {
			directionIndex,
			positionIndex,
			wavelengthIndex,
		};
	}
}
