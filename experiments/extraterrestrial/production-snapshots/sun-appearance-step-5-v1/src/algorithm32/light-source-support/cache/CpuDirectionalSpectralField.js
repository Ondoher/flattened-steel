/** Object that owns one mutable-then-sealed binary64 directional spectral field. The resident Float64Array remains private. Mutation and observation happen only through short-lived writer and reader capabilities so a field cannot be read before publication or changed after publication. */
export class CpuDirectionalSpectralField {
	/**
	 * Id value.
	 *
	 *  @readonly @type {string}
	 *
	 */
	id;
	/**
	 * Provenance identity value.
	 *
	 *  @readonly @type {string}
	 *
	 */
	provenanceIdentity;
	/**
	 * Order value.
	 *
	 *  @readonly @type {SpectralFieldOrder}
	 *
	 */
	order;
	/**
	 * Offset value.
	 *
	 *  @type {(coordinates: DirectionalSpectralFieldCoordinates) => number}
	 *
	 */
	_offset;
	/**
	 * Values value.
	 *
	 *  @type {Float64Array}
	 *
	 */
	_values;
	/**
	 * Is sealed value.
	 *
	 *  @type {boolean}
	 *
	 */
	_isSealed = false;

	/**
	 * Creates binary64 CPU storage from direct field facts and executable packing.
	 *
	 * @param {CpuDirectionalSpectralFieldDefinition} definition - Supplies the
	 * field identity and executable packing owned by the concrete cache.
	 *
	 */
	constructor(definition) {
		const packing = definition.packing;

		this.id = definition.id;
		this.provenanceIdentity = definition.provenanceIdentity;
		this.order =
			definition.order.kind === 'pure'
				? {kind: 'pure', value: definition.order.value}
				: {
						kind: 'cumulative-through',
						value: definition.order.value,
						included: [...definition.order.included],
					};
		this._offset = packing.offset.bind(packing);
		this._values = new Float64Array(packing.scalarCount);
	}

	/**
	 * Scalar count value.
	 *
	 *  @returns {number} - The number of resident binary64 scalar values.
	 */
	get scalarCount() {
		return this._values.length;
	}

	/**
	 * Is sealed value.
	 *
	 *  @returns {boolean} - Whether mutation has ended and reading is available.
	 */
	get isSealed() {
		return this._isSealed;
	}

	/**
	 * Called by CpuDirectionalSpectralField writers to validate one finite
	 * scalar before field mutation.
	 *
	 * @param {unknown} value - Supplies the candidate scalar.
	 * @param {string} label - Supplies a diagnostic label.
	 * @returns {number} - The validated scalar.
	 * @throws {TypeError} - When the candidate is not a finite number.
	 */
	_finiteScalar(value, label) {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new TypeError(`${label} must be finite.`);
		}

		return value;
	}

	/**
	 * Called by cpu directional spectral field to assert mutable.
	 *
	 *  @returns {void} -
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	_assertMutable() {
		if (this._isSealed) {
			throw new Error('CPU directional spectral field is sealed and cannot be mutated.');
		}
	}

	/**
	 * Called by cpu directional spectral field to validate one scalar storage offset.
	 *
	 * @param {unknown} value - Supplies the candidate offset.
	 * @param {string} [label] - Supplies a diagnostic label.
	 * @returns {number} - The validated offset.
	 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
	 * @throws {RangeError} - When an accepted value is outside the supported range.
	 */
	_validatedOffset(value, label = 'CPU field scalar offset') {
		if (typeof value !== 'number' || !Number.isInteger(value)) {
			throw new TypeError(`${label} must be an integer.`);
		}

		if (value < 0 || value >= this._values.length) {
			throw new RangeError(`${label} must be between 0 and ${this._values.length - 1}.`);
		}

		return value;
	}

	/**
	 * Called by cpu directional spectral field to resolve and validate one logical field coordinate.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} request - Supplies coordinates.
	 * @returns {number} - The validated scalar offset.
	 */
	_resolveOffset(request) {
		return this._validatedOffset(this._offset(request), 'CPU field packing offset');
	}

	/**
	 * Call this method to create a mutation capability while the field remains mutable. A captured writer checks field state on every call and therefore cannot mutate the field after it has been sealed.
	 *
	 * @returns {CpuDirectionalSpectralFieldWriter} - Return the writer capability.
	 */
	createWriter() {
		this._assertMutable();

		/**
		 * Called by write scalar to write one scalar addressed by logical field coordinates.
		 *
		 * @param {DirectionalSpectralFieldCoordinates} request - Supplies field coordinates.
		 * @param {number} value - Supplies the scalar value.
		 * @returns {void} -
		 */
		const writeScalar = (request, value) => {
			this._assertMutable();
			const scalar = this._finiteScalar(value, 'CPU field scalar value');
			const offset = this._resolveOffset(request);
			this._values[offset] = scalar;
		};

		/**
		 * Called by write scalar at offset to write one scalar addressed by its dense storage offset.
		 *
		 * @param {number} offset - Supplies the dense scalar offset.
		 * @param {number} value - Supplies the scalar value.
		 * @returns {void} -
		 */
		const writeScalarAtOffset = (offset, value) => {
			this._assertMutable();
			const scalar = this._finiteScalar(value, 'CPU field scalar value');
			this._values[this._validatedOffset(offset)] = scalar;
		};

		/**
		 * Called by fill to fill every resident scalar with one value.
		 *
		 * @param {number} value - Supplies the fill scalar.
		 * @returns {void} -
		 */
		const fill = (value) => {
			this._assertMutable();
			this._values.fill(this._finiteScalar(value, 'CPU field fill value'));
		};

		return {
			id: this.id,
			provenanceIdentity: this.provenanceIdentity,
			order: this.order,
			scalarCount: this._values.length,
			writeScalar,
			writeScalarAtOffset,
			fill,
		};
	}

	/**
	 * Call this method to end mutation permanently and make reader creation available.
	 *
	 * @returns {CpuDirectionalSpectralField} - Return this field.
	 */
	seal() {
		this._isSealed = true;
		return this;
	}

	/**
	 * Call this method to create a read capability after the field has been sealed.
	 *
	 * @returns {CpuDirectionalSpectralFieldReader} - Return the reader capability.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	createReader() {
		if (!this._isSealed) {
			throw new Error('CPU directional spectral field must be sealed before reading.');
		}

		/**
		 * Called by read scalar to read one scalar addressed by logical field coordinates.
		 *
		 * @param {DirectionalSpectralFieldCoordinates} request - Supplies field coordinates.
		 * @returns {number} - Return the stored scalar.
		 */
		const readScalar = (request) => this._values[this._resolveOffset(request)];

		/**
		 * Called by read scalar at offset to read one scalar addressed by its dense storage offset.
		 *
		 * @param {number} offset - Supplies the dense scalar offset.
		 * @returns {number} - Return the stored scalar.
		 */
		const readScalarAtOffset = (offset) => this._values[this._validatedOffset(offset)];

		return {
			id: this.id,
			provenanceIdentity: this.provenanceIdentity,
			order: this.order,
			scalarCount: this._values.length,
			readScalar,
			readScalarAtOffset,
		};
	}
}
