import { createDenseScalarArrayLayout } from '../caches/DenseScalarArrayLayout.js';

/** Own the executable packing paired with one readonly layout descriptor. */
export class DistantSunFieldPacking {
	/** @readonly @type {"distant-sun-field-packing"} */
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
	 * Create source-owned executable packing from typed logical field counts.
	 *
	 * @param {DistantSunFieldPackingDefinition} definition - Supplies packing
	 * identity and direction, position, and wavelength counts.
	 */
	constructor(definition) {
		const {
			id,
			directionCount,
			positionCount,
			wavelengthCount,
		} = definition;

		this.kind = 'distant-sun-field-packing';
		this.id = id;
		this.directionCount = directionCount;
		this.positionCount = positionCount;
		this.wavelengthCount = wavelengthCount;
		this.scalarCount = directionCount * positionCount * wavelengthCount;
		this.layout = createDenseScalarArrayLayout({
			id: `${this.id}-layout`,
			directionCount,
			positionCount,
			wavelengthCount,
		});
	}

	/**
	 * Require one zero-based safe integer within an executable bound.
	 *
	 * @param {number} value - Supplies the candidate index.
	 * @param {number} count - Supplies the exclusive upper bound.
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
	 * Return one direction-fastest linear scalar offset.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - Supplies
	 * logical scalar coordinates.
	 * @returns {number} Return the zero-based linear offset.
	 */
	offset(coordinates) {
		const { directionIndex, positionIndex, wavelengthIndex } = coordinates;
		this._assertIndex(
			directionIndex,
			this.directionCount,
			'directionIndex',
		);
		this._assertIndex(
			positionIndex,
			this.positionCount,
			'positionIndex',
		);
		this._assertIndex(
			wavelengthIndex,
			this.wavelengthCount,
			'wavelengthIndex',
		);

		return directionIndex
			+ this.directionCount * (
				positionIndex + this.positionCount * wavelengthIndex
			);
	}

	/**
	 * Recover logical coordinates from one declared scalar offset.
	 *
	 * @param {number} offset - Supplies the zero-based linear offset.
	 * @returns {DirectionalSpectralFieldCoordinates} Return readonly logical scalar coordinates.
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

		return {
			directionIndex,
			positionIndex,
			wavelengthIndex,
		};
	}
}
