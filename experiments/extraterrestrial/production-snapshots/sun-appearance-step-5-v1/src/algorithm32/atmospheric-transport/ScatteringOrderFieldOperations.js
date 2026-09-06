/**
 * Called by this module to require an input field to be sealed before it can be consumed.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - The field to inspect.
 * @param {string} label - The diagnostic label.
 * @returns {void} - No return value.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertSealedField(field, label) {
	if (field.isSealed !== true) {
		throw new TypeError(`${label} must be sealed before it can be consumed.`);
	}
}

/**
 * Called by this module to require a field to remain mutable while it is an output target.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - The field to inspect.
 * @param {string} label - The diagnostic label.
 * @returns {void} - No return value.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertMutableField(field, label) {
	if (field.isSealed !== false) {
		throw new TypeError(`${label} must be mutable before construction.`);
	}
}

/**
 * Called by this module to limit a writer capability to a caller-controlled lifetime. Revocation rejects every later write, including writes retained by a Promise after a synchronous kernel invocation completes.
 *
 * @param {CpuDirectionalSpectralFieldWriter} writer - The owned field writer.
 * @returns {RevocableCpuDirectionalSpectralFieldWriter} - The writer capability
 * and its revocation operation.
 *
 */
function createRevocableWriter(writer) {
	let isActive = true;

	/**
	 * Called by the revocable writer methods to reject use after revocation.
	 *
	 * @returns {void} - No return value.
	 * @throws {Error} - When the operation cannot complete its caller-observable contract.
	 */
	function assertActive() {
		if (!isActive) {
			throw new Error('scattering-order output writer is no longer active.');
		}
	}

	/**
	 * Called by a scattering-order kernel to write one scalar through the active
	 * coordinate writer.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - The field coordinates.
	 * @param {number} value - The scalar value.
	 * @returns {void} - No return value.
	 */
	function writeScalar(coordinates, value) {
		assertActive();
		writer.writeScalar(coordinates, value);
	}

	/**
	 * Called by a scattering-order kernel to write one scalar through the active
	 * dense offset writer.
	 *
	 * @param {number} offset - The scalar offset.
	 * @param {number} value - The scalar value.
	 * @returns {void} - No return value.
	 */
	function writeScalarAtOffset(offset, value) {
		assertActive();
		writer.writeScalarAtOffset(offset, value);
	}

	/**
	 * Called by a scattering-order kernel to fill the active output field with
	 * one scalar.
	 *
	 * @param {number} value - The fill scalar.
	 * @returns {void} - No return value.
	 */
	function fill(value) {
		assertActive();
		writer.fill(value);
	}

	/**
	 * Called by field orchestration to revoke every subsequent write through
	 * this capability.
	 *
	 * @returns {void} - No return value.
	 */
	function revoke() {
		isActive = false;
	}

	return {
		writer: {
			id: writer.id,
			provenanceIdentity: writer.provenanceIdentity,
			order: writer.order,
			scalarCount: writer.scalarCount,
			writeScalar,
			writeScalarAtOffset,
			fill,
		},
		revoke,
	};
}

/**
 * Called by this module to restore a mutable output to deterministic zero after a failed operation.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - The mutable field.
 * @param {CpuDirectionalSpectralFieldWriter} writer - The active field writer.
 * @returns {void} - No return value.
 *
 */
function zeroMutableField(field, writer) {
	if (field.isSealed === false) {
		writer.fill(0);
	}
}

/**
 * Called by this module to build one pure scattering-density order from the preceding pure radiance order. The operation owns output initialization, synchronous writer revocation, sealing, and deterministic rollback.
 *
 * @param {NextScatteringOrderBuildRequest} request - The fields and synchronous
 * scattering kernel.
 * @returns {CpuDirectionalSpectralFieldContract} - The sealed output field.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
function buildNextScatteringOrder(request) {
	const outputScattering = request.outputScattering;
	assertMutableField(outputScattering, 'output scattering field');
	const outputWriter = outputScattering.createWriter();
	outputWriter.fill(0);

	try {
		const previousRadiance = request.previousRadiance;

		if (previousRadiance === outputScattering) {
			throw new TypeError('previous radiance and output scattering fields must not alias.');
		}

		assertSealedField(previousRadiance, 'previous radiance field');
		const kernel = request.kernel;

		const revocableOutput = createRevocableWriter(outputWriter);
		/** @type {unknown} */
		let result;

		try {
			result = kernel.buildPureScatteringOrder({
				previousRadiance: previousRadiance.createReader(),
				outputScattering: revocableOutput.writer,
			});
		} finally {
			revocableOutput.revoke();
		}

		if (
			result !== null &&
			(typeof result === 'object' || typeof result === 'function') &&
			'then' in result &&
			typeof result.then === 'function'
		) {
			Promise.resolve(result).catch(
				/**
				 * Called by the promise rejection handler to handle one callback invocation.
				 * @returns - The callback result returned to its caller.
				 */ () => undefined,
			);
			throw new TypeError('next scattering-order kernel must complete synchronously.');
		}

		outputScattering.seal();
		return outputScattering;
	} catch (error) {
		zeroMutableField(outputScattering, outputWriter);
		throw error;
	}
}

/**
 * Called by this module to sum contiguous sealed pure scattering-density orders into one cumulative target. The target is sealed only after every finite scalar sum succeeds and is restored to zero after failure.
 *
 * @param {PureScatteringFieldAccumulationRequest} request - The pure inputs and
 * cumulative target.
 * @returns {CpuDirectionalSpectralFieldContract} - The sealed cumulative field.
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 * @throws {Error} - When the operation cannot complete its caller-observable contract.
 */
function accumulatePureScatteringFields(request) {
	const cumulativeField = request.cumulativeField;
	assertMutableField(cumulativeField, 'cumulative scattering field');
	const cumulativeWriter = cumulativeField.createWriter();
	cumulativeWriter.fill(0);

	try {
		const pureFields = request.pureFields.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param field - The field value accepted by the operation.
			 * @param index - The zero-based index accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
			 */ (field, index) => {
				if (field === cumulativeField) {
					throw new TypeError('pure and cumulative scattering fields must not alias.');
				}

				assertSealedField(field, `pure scattering field ${index + 1}`);
				return field;
			},
		);

		if (new Set(pureFields).size !== pureFields.length) {
			throw new TypeError('pure scattering fields must not alias each other.');
		}

		const readers = pureFields.map(
			/**
			 * Called by Array.prototype.map to transform one collection value.
			 * @param field - The field value accepted by the operation.
			 * @returns - The callback result returned to its caller.
			 */ (field) => field.createReader(),
		);
		for (let offset = 0; offset < request.packing.scalarCount; offset += 1) {
			const coordinates = request.packing.coordinatesAt(offset);
			let sum = 0;
			for (const reader of readers) {
				sum += reader.readScalar(coordinates);
			}

			if (!Number.isFinite(sum)) {
				throw new RangeError(`cumulative scattering scalar ${offset} must remain finite.`);
			}

			cumulativeWriter.writeScalar(coordinates, sum);
		}

		cumulativeField.seal();
		return cumulativeField;
	} catch (error) {
		zeroMutableField(cumulativeField, cumulativeWriter);
		throw error;
	}
}

/** Scattering-order field lifecycle, rollback, build, and accumulation operations. */
export const ScatteringOrderFieldOperations = {
	accumulatePureScatteringFields,
	assertMutableField,
	assertSealedField,
	buildNextScatteringOrder,
	createRevocableWriter,
	zeroMutableField,
};
