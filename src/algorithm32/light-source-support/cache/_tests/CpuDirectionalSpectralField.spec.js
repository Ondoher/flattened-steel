import {CpuDirectionalSpectralField} from '../CpuDirectionalSpectralField.js';

describe('CpuDirectionalSpectralField', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns direct field facts and private binary64 storage through sealing', /** Called by Jasmine to exercise the named behavior. */ () => {
		const fixture = createFixture();
		const field = new CpuDirectionalSpectralField(fixture);

		expect(field.id).toBe(fixture.id);
		expect(field.provenanceIdentity).toBe(fixture.provenanceIdentity);
		expect(field.order).toEqual(fixture.order);
		expect(field.scalarCount).toBe(8);
		expect(field.isSealed).toBeFalse();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => field.createReader(),
		).toThrowError(/sealed before reading/u);

		const writer = field.createWriter();
		expect(writer.id).toBe(field.id);
		expect(writer.provenanceIdentity).toBe(field.provenanceIdentity);
		expect(writer.order).toEqual(field.order);
		expect(writer.scalarCount).toBe(field.scalarCount);
		writer.fill(1.5);
		writer.writeScalar(
			{
				directionIndex: 1,
				positionIndex: 0,
				wavelengthIndex: 1,
			},
			7.25,
		);
		writer.writeScalarAtOffset(2, -3.5);

		expect(field.seal()).toBe(field);
		expect(field.seal()).toBe(field);
		expect(field.isSealed).toBeTrue();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => field.createWriter(),
		).toThrowError(/sealed/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => writer.fill(0),
		).toThrowError(/sealed/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => writer.writeScalarAtOffset(0, 0),
		).toThrowError(/sealed/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				writer.writeScalar(
					{
						directionIndex: 0,
						positionIndex: 0,
						wavelengthIndex: 0,
					},
					0,
				),
		).toThrowError(/sealed/u);

		const reader = field.createReader();
		expect(reader.id).toBe(field.id);
		expect(reader.provenanceIdentity).toBe(field.provenanceIdentity);
		expect(reader.order).toEqual(field.order);
		expect(reader.scalarCount).toBe(field.scalarCount);
		expect(reader.readScalarAtOffset(0)).toBe(1.5);
		expect(reader.readScalarAtOffset(2)).toBe(-3.5);
		expect(
			reader.readScalar({
				directionIndex: 1,
				positionIndex: 0,
				wavelengthIndex: 1,
			}),
		).toBe(7.25);
	});

	it('rejects non-finite values and invalid direct or packing offsets', /** Called by Jasmine to exercise the named behavior. */ () => {
		const field = new CpuDirectionalSpectralField(createFixture());
		const writer = field.createWriter();

		for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => writer.fill(value),
			).toThrowError(/finite/u);
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => writer.writeScalarAtOffset(0, value),
			).toThrowError(/finite/u);
		}

		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => writer.writeScalarAtOffset(0.5, 1),
		).toThrowError(/integer/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => writer.writeScalarAtOffset(-1, 1),
		).toThrowError(/between/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => writer.writeScalarAtOffset(field.scalarCount, 1),
		).toThrowError(/between/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				writer.writeScalar(
					{
						directionIndex: 2,
						positionIndex: 0,
						wavelengthIndex: 0,
					},
					1,
				),
		).toThrowError(/directionIndex/u);

		field.seal();
		const reader = field.createReader();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => reader.readScalarAtOffset(0.5),
		).toThrowError(/integer/u);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => reader.readScalarAtOffset(field.scalarCount),
		).toThrowError(/between/u);
	});
});

/**
 * Called by this module to create fixture.
 * @returns - The result produced by the operation.
 */
function createFixture() {
	return {
		id: 'test-binary64-field',
		provenanceIdentity: 'test-cpu-field-fixture',
		order: {kind: 'pure', value: 1},
		packing: createPacking(2, 2, 2),
	};
}

/**
 * Called by this module to create packing.
 * @param directionCount - The direction count value accepted by the operation.
 * @param positionCount - The position count value accepted by the operation.
 * @param wavelengthCount - The wavelength count value accepted by the operation.
 * @returns - The result produced by the operation.
 */
function createPacking(directionCount, positionCount, wavelengthCount) {
	const scalarCount = directionCount * positionCount * wavelengthCount;

	return {
		id: 'test-cpu-field-packing',
		scalarCount,
		/**
		 * Call this method to offset.
		 * @param request - The request accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ offset(request = {}) {
			const directionIndex = checkedIndex(request.directionIndex, directionCount, 'directionIndex');
			const positionIndex = checkedIndex(request.positionIndex, positionCount, 'positionIndex');
			const wavelengthIndex = checkedIndex(request.wavelengthIndex, wavelengthCount, 'wavelengthIndex');
			return directionIndex + directionCount * (positionIndex + positionCount * wavelengthIndex);
		},
		/**
		 * Call this method to coordinates at.
		 * @param offset - The offset value accepted by the operation.
		 * @returns - The result produced by the operation.
		 */ coordinatesAt(offset) {
			const checkedOffset = checkedIndex(offset, scalarCount, 'offset');
			const wavelengthStride = directionCount * positionCount;
			const wavelengthIndex = Math.floor(checkedOffset / wavelengthStride);
			const remainder = checkedOffset - wavelengthIndex * wavelengthStride;
			const positionIndex = Math.floor(remainder / directionCount);

			return {
				directionIndex: remainder - positionIndex * directionCount,
				positionIndex,
				wavelengthIndex,
			};
		},
	};
}

/**
 * Called by this module to checked index.
 * @param value - The value accepted by the operation.
 * @param count - The count value accepted by the operation.
 * @param label - The diagnostic label accepted by the operation.
 * @returns - The result produced by the operation.
 * @throws {RangeError} - When an accepted value is outside the supported range.
 */
function checkedIndex(value, count, label) {
	if (!Number.isInteger(value) || value < 0 || value >= count) {
		throw new RangeError(`${label} must identify a declared packing coordinate.`);
	}

	return value;
}
