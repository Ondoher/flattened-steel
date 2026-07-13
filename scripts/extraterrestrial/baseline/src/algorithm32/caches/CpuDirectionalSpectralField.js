/**
 * Validate one finite field scalar.
 *
 * @param {unknown} value - Supplies the candidate scalar.
 * @param {string} label - Supplies a diagnostic label.
 * @returns {number} The validated scalar.
 */
function finiteScalar(value, label) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${label} must be finite.`);
	}

	return value;
}

/**
 * Own one mutable-then-sealed binary64 directional spectral field.
 *
 * The resident Float64Array remains private. Mutation and observation happen
 * only through short-lived writer and reader capabilities so a field
 * cannot be read before publication or changed after publication.
 */
export class CpuDirectionalSpectralField {
	/** @type {CpuDirectionalSpectralFieldDescriptor} */
	_descriptor;
	/** @type {(coordinates: DirectionalSpectralFieldCoordinates) => number} */
	_offset;
	/** @type {Float64Array} */
	_values;
	/** @type {boolean} */
	_isSealed = false;

	/**
	 * Create binary64 CPU storage from typed metadata and executable packing.
	 *
	 * @param {CpuDirectionalSpectralFieldDefinition} definition - Supplies the
	 * field descriptor and executable packing owned by the concrete cache.
	 */
	constructor(definition) {
		const packing = definition.packing;

		this._descriptor = definition.descriptor;
		this._offset = packing.offset.bind(packing);
		this._values = new Float64Array(packing.scalarCount);
	}

	/** @returns {CpuDirectionalSpectralFieldDescriptor} The readonly descriptor. */
	get descriptor() {
		return this._descriptor;
	}

	/** @returns {number} The number of resident binary64 scalar values. */
	get scalarCount() {
		return this._values.length;
	}

	/** @returns {boolean} Whether mutation has ended and reading is available. */
	get isSealed() {
		return this._isSealed;
	}

	/** @returns {void} */
	_assertMutable() {
		if (this._isSealed) {
			throw new Error('CPU directional spectral field is sealed and cannot be mutated.');
		}
	}

	/**
	 * Validate one scalar storage offset.
	 *
	 * @param {unknown} value - Supplies the candidate offset.
	 * @param {string} [label] - Supplies a diagnostic label.
	 * @returns {number} The validated offset.
	 */
	_validatedOffset(value, label = 'CPU field scalar offset') {
		if (typeof value !== 'number' || !Number.isInteger(value)) {
			throw new TypeError(`${label} must be an integer.`);
		}

		if (value < 0 || value >= this._values.length) {
			throw new RangeError(
				`${label} must be between 0 and ${this._values.length - 1}.`,
			);
		}

		return value;
	}

	/**
	 * Resolve and validate one logical field coordinate.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} request - Supplies coordinates.
	 * @returns {number} The validated scalar offset.
	 */
	_resolveOffset(request) {
		return this._validatedOffset(this._offset(request), 'CPU field packing offset');
	}

	/**
	 * Create a mutation capability while the field remains mutable.
	 *
	 * A captured writer checks field state on every call and therefore cannot
	 * mutate the field after it has been sealed.
	 *
	 * @returns {CpuDirectionalSpectralFieldWriter} Return the writer capability.
	 */
	createWriter() {
		this._assertMutable();

		/**
		 * Write one scalar addressed by logical field coordinates.
		 *
		 * @param {DirectionalSpectralFieldCoordinates} request - Supplies field coordinates.
		 * @param {number} value - Supplies the scalar value.
		 * @returns {void}
		 */
		const writeScalar = (request, value) => {
			this._assertMutable();
			const scalar = finiteScalar(value, 'CPU field scalar value');
			const offset = this._resolveOffset(request);
			this._values[offset] = scalar;
		};

		/**
		 * Write one scalar addressed by its dense storage offset.
		 *
		 * @param {number} offset - Supplies the dense scalar offset.
		 * @param {number} value - Supplies the scalar value.
		 * @returns {void}
		 */
		const writeScalarAtOffset = (offset, value) => {
			this._assertMutable();
			const scalar = finiteScalar(value, 'CPU field scalar value');
			this._values[this._validatedOffset(offset)] = scalar;
		};

		/**
		 * Fill every resident scalar with one value.
		 *
		 * @param {number} value - Supplies the fill scalar.
		 * @returns {void}
		 */
		const fill = (value) => {
			this._assertMutable();
			this._values.fill(finiteScalar(value, 'CPU field fill value'));
		};

		return {
			descriptor: this._descriptor,
			scalarCount: this._values.length,
			writeScalar,
			writeScalarAtOffset,
			fill,
		};
	}

	/**
	 * End mutation permanently and make reader creation available.
	 *
	 * @returns {CpuDirectionalSpectralField} Return this field.
	 */
	seal() {
		this._isSealed = true;
		return this;
	}

	/**
	 * Create a read capability after the field has been sealed.
	 *
	 * @returns {CpuDirectionalSpectralFieldReader} Return the reader capability.
	 */
	createReader() {
		if (!this._isSealed) {
			throw new Error('CPU directional spectral field must be sealed before reading.');
		}

		/**
		 * Read one scalar addressed by logical field coordinates.
		 *
		 * @param {DirectionalSpectralFieldCoordinates} request - Supplies field coordinates.
		 * @returns {number} Return the stored scalar.
		 */
		const readScalar = (request) => this._values[this._resolveOffset(request)];

		/**
		 * Read one scalar addressed by its dense storage offset.
		 *
		 * @param {number} offset - Supplies the dense scalar offset.
		 * @returns {number} Return the stored scalar.
		 */
		const readScalarAtOffset = (offset) => this._values[this._validatedOffset(offset)];

		return {
			descriptor: this._descriptor,
			scalarCount: this._values.length,
			readScalar,
			readScalarAtOffset,
		};
	}
}
