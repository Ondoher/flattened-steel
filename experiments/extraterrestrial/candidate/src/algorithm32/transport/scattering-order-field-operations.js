/**
 * Require an input field to be sealed before it can be consumed.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - Supplies the field to inspect.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function assertSealedField(field, label) {
	if (field.isSealed !== true) {
		throw new TypeError(`${label} must be sealed before it can be consumed.`);
	}
}

/**
 * Require a field to remain mutable while it is an output target.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - Supplies the field to inspect.
 * @param {string} label - Supplies the diagnostic label.
 * @returns {void}
 */
function assertMutableField(field, label) {
	if (field.isSealed !== false) {
		throw new TypeError(`${label} must be mutable before construction.`);
	}
}

/**
 * Limit a kernel to writes made during its synchronous invocation. A returned
 * Promise may retain this capability, but every later write is rejected and
 * therefore cannot alter a failed or published output field.
 *
 * @param {CpuDirectionalSpectralFieldWriter} writer - Supplies the owned field writer.
 * @returns {{ writer: CpuDirectionalSpectralFieldWriter, revoke: () => void }}
 * Return the revocable writer packet.
 */
function createRevocableWriter(writer) {
	let isActive = true;

	/**
	 * Assert that the writer capability remains active.
	 *
	 * @returns {void}
	 */
	function assertActive() {
		if (!isActive) {
			throw new Error(
				'scattering-order output writer is no longer active.',
			);
		}
	}

	/**
	 * Write one scalar through the active coordinate writer.
	 *
	 * @param {DirectionalSpectralFieldCoordinates} coordinates - Supplies field coordinates.
	 * @param {number} value - Supplies the scalar value.
	 * @returns {void}
	 */
	function writeScalar(coordinates, value) {
		assertActive();
		writer.writeScalar(coordinates, value);
	}

	/**
	 * Write one scalar through the active dense offset writer.
	 *
	 * @param {number} offset - Supplies the scalar offset.
	 * @param {number} value - Supplies the scalar value.
	 * @returns {void}
	 */
	function writeScalarAtOffset(offset, value) {
		assertActive();
		writer.writeScalarAtOffset(offset, value);
	}

	/**
	 * Fill the active output field with one scalar.
	 *
	 * @param {number} value - Supplies the fill scalar.
	 * @returns {void}
	 */
	function fill(value) {
		assertActive();
		writer.fill(value);
	}

	/**
	 * Revoke all subsequent writes through this capability.
	 *
	 * @returns {void}
	 */
	function revoke() {
		isActive = false;
	}

	return {
		writer: {
			descriptor: writer.descriptor,
			scalarCount: writer.scalarCount,
			writeScalar,
			writeScalarAtOffset,
			fill,
		},
		revoke,
	};
}

/**
 * Restore a mutable output to deterministic zero after any failed operation.
 *
 * @param {CpuDirectionalSpectralFieldContract} field - Supplies the mutable field.
 * @param {CpuDirectionalSpectralFieldWriter} writer - Supplies its active writer.
 * @returns {void}
 */
function zeroMutableField(field, writer) {
	if (field.isSealed === false) {
		writer.fill(0);
	}
}

/**
 * Build one pure scattering-density order from the preceding pure radiance
 * order. The operation owns validation and output state; the supplied kernel
 * receives only a sealed reader and a writer active for that synchronous call.
 * Output is zero-initialized, so scalars the kernel intentionally leaves
 * unwritten remain zero.
 *
 * @param {NextScatteringOrderBuildRequest} request - Supplies the fields and
 * synchronous scattering kernel.
 * @returns {CpuDirectionalSpectralFieldContract} Return the sealed output field.
 */
export function buildNextScatteringOrder(request) {
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

		if (result !== null
			&& (typeof result === 'object' || typeof result === 'function')
			&& 'then' in result && typeof result.then === 'function') {
			Promise.resolve(result).catch(() => undefined);
			throw new TypeError(
				'next scattering-order kernel must complete synchronously.',
			);
		}

		outputScattering.seal();
		return outputScattering;
	} catch (error) {
		zeroMutableField(outputScattering, outputWriter);
		throw error;
	}
}

/**
 * Sum contiguous sealed pure scattering-density orders into one cumulative
 * target. The target is sealed only after every finite scalar sum succeeds.
 *
 * @param {PureScatteringFieldAccumulationRequest} request - Supplies pure
 * inputs and the cumulative target.
 * @returns {CpuDirectionalSpectralFieldContract} Return the sealed cumulative field.
 */
export function accumulatePureScatteringFields(request) {
	const cumulativeField = request.cumulativeField;
	assertMutableField(cumulativeField, 'cumulative scattering field');
	const cumulativeWriter = cumulativeField.createWriter();
	cumulativeWriter.fill(0);

	try {
		const pureFields = request.pureFields.map((field, index) => {
			if (field === cumulativeField) {
				throw new TypeError('pure and cumulative scattering fields must not alias.');
			}

			assertSealedField(field, `pure scattering field ${index + 1}`);
			return field;
		});

		if (new Set(pureFields).size !== pureFields.length) {
			throw new TypeError('pure scattering fields must not alias each other.');
		}

		const readers = pureFields.map((field) => field.createReader());
		for (let offset = 0; offset < request.packing.scalarCount; offset += 1) {
			const coordinates = request.packing.coordinatesAt(offset);
			let sum = 0;
			for (const reader of readers) {
				sum += reader.readScalar(coordinates);
			}

			if (!Number.isFinite(sum)) {
				throw new RangeError(
					`cumulative scattering scalar ${offset} must remain finite.`,
				);
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
