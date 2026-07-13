import {DistantSunFieldPacking} from '../DistantSunFieldPacking.js';
import {DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION} from '../consts.js';

describe('DistantSunFieldPacking', /** Called by Jasmine to register the named test suite. */ () => {
	it('owns its direct extents and scalar count', /** Called by Jasmine to exercise the named behavior. */ () => {
		const packing = createTestPacking();

		expect(packing.kind).toBe('distant-sun-field-packing');
		expect(packing.id).toBe('test-distant-sun-packing');
		expect(packing.directionCount).toBe(3);
		expect(packing.positionCount).toBe(2);
		expect(packing.wavelengthCount).toBe(2);
		expect(packing.scalarCount).toBe(12);
	});

	it('uses direction-fastest, position-middle, wavelength-slowest offsets', /** Called by Jasmine to exercise the named behavior. */ () => {
		const packing = createTestPacking();

		expect(
			packing.offset({
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 0,
			}),
		).toBe(0);
		expect(
			packing.offset({
				directionIndex: 2,
				positionIndex: 0,
				wavelengthIndex: 0,
			}),
		).toBe(2);
		expect(
			packing.offset({
				directionIndex: 0,
				positionIndex: 1,
				wavelengthIndex: 0,
			}),
		).toBe(3);
		expect(
			packing.offset({
				directionIndex: 0,
				positionIndex: 0,
				wavelengthIndex: 1,
			}),
		).toBe(6);
		expect(
			packing.offset({
				directionIndex: 2,
				positionIndex: 1,
				wavelengthIndex: 1,
			}),
		).toBe(11);
	});

	it('round trips every coordinate in a complete multidimensional packing', /** Called by Jasmine to exercise the named behavior. */ () => {
		const packing = createTestPacking();

		for (let wavelengthIndex = 0; wavelengthIndex < 2; wavelengthIndex += 1) {
			for (let positionIndex = 0; positionIndex < 2; positionIndex += 1) {
				for (let directionIndex = 0; directionIndex < 3; directionIndex += 1) {
					const coordinates = {
						directionIndex,
						positionIndex,
						wavelengthIndex,
					};
					const offset = packing.offset(coordinates);
					expect(packing.coordinatesAt(offset)).toEqual(coordinates);
				}
			}
		}
	});

	it('owns native reflection-completed Fibonacci-68 L and W27 J binary64 packings', /** Called by Jasmine to exercise the named behavior. */ () => {
		const radiancePacking = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.radiancePacking;
		const scatteringDensityPacking = DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION.scatteringDensityPacking;
		expect(radiancePacking.directionCount).toBe(68);
		expect(radiancePacking.positionCount).toBe(48);
		expect(radiancePacking.wavelengthCount).toBe(15);
		expect(radiancePacking.scalarCount).toBe(48960);
		expect(scatteringDensityPacking.directionCount).toBe(4374);
		expect(scatteringDensityPacking.positionCount).toBe(48);
		expect(scatteringDensityPacking.wavelengthCount).toBe(15);
		expect(scatteringDensityPacking.scalarCount).toBe(3149280);

		for (const packing of [radiancePacking, scatteringDensityPacking]) {
			const lastOffset = packing.scalarCount - 1;
			const lastCoordinates = {
				directionIndex: packing.directionCount - 1,
				positionIndex: packing.positionCount - 1,
				wavelengthIndex: packing.wavelengthCount - 1,
			};
			expect(packing.offset(lastCoordinates)).toBe(lastOffset);
			expect(packing.coordinatesAt(lastOffset)).toEqual(lastCoordinates);
		}
	});

	it('rejects fractional, negative, and upper-bound indices', /** Called by Jasmine to exercise the named behavior. */ () => {
		const packing = createTestPacking();
		const valid = {
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex: 0,
		};

		for (const [key, invalidValues] of Object.entries({
			directionIndex: [-1, 0.5, 3],
			positionIndex: [-1, 0.5, 2],
			wavelengthIndex: [-1, 0.5, 2],
		})) {
			for (const invalidValue of invalidValues) {
				expect(
					/**
					 * Called by Jasmine to invoke the operation whose outcome is asserted.
					 * @returns - The callback result returned to its caller.
					 */ () => packing.offset({...valid, [key]: invalidValue}),
				).toThrowError(new RegExp(key, 'u'));
			}
		}

		for (const invalidOffset of [-1, 0.5, 12]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => packing.coordinatesAt(invalidOffset),
			).toThrowError(/offset/u);
		}
	});
});

/**
 * Called by this module to create test packing.
 * @returns - The result produced by the operation.
 */
function createTestPacking() {
	return new DistantSunFieldPacking({
		id: 'test-distant-sun-packing',
		directionCount: 3,
		positionCount: 2,
		wavelengthCount: 2,
	});
}
