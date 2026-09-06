import {
	DistantSunFieldPacking,
} from '../DistantSunFieldPacking.js';
import {
	DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION,
} from '../consts.js';

describe('DistantSunFieldPacking', () => {
	it('creates its readonly metadata layout from the same definition', () => {
		const packing = createTestPacking();

		expect(packing.kind).toBe('distant-sun-field-packing');
		expect(packing.id).toBe('test-distant-sun-packing');
		expect(packing.directionCount).toBe(3);
		expect(packing.positionCount).toBe(2);
		expect(packing.wavelengthCount).toBe(2);
		expect(packing.scalarCount).toBe(12);
		expect(packing.layout).toEqual(jasmine.objectContaining({
			kind: 'dense-scalar-array-layout',
			id: 'test-distant-sun-packing-layout',
			format: 'Float64Array',
			precision: 'binary64',
			axes: {
				fastest: 'direction',
				middle: 'position',
				slowest: 'wavelength',
			},
			shape: {
				direction: 3,
				position: 2,
				wavelength: 2,
			},
			scalarCount: 12,
			storage: { value: 96, units: 'bytes' },
		}));
	});

	it('uses direction-fastest, position-middle, wavelength-slowest offsets', () => {
		const packing = createTestPacking();

		expect(packing.offset({
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex: 0,
		})).toBe(0,
		);
		expect(packing.offset({
			directionIndex: 2,
			positionIndex: 0,
			wavelengthIndex: 0,
		})).toBe(2,
		);
		expect(packing.offset({
			directionIndex: 0,
			positionIndex: 1,
			wavelengthIndex: 0,
		})).toBe(3,
		);
		expect(packing.offset({
			directionIndex: 0,
			positionIndex: 0,
			wavelengthIndex: 1,
		})).toBe(6,
		);
		expect(packing.offset({
			directionIndex: 2,
			positionIndex: 1,
			wavelengthIndex: 1,
		})).toBe(11,
		);
	});

	it('round trips every coordinate in a complete multidimensional packing', () => {
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

	it('owns native Fibonacci-34 L and W27 J binary64 packings', () => {
		const radiancePacking =
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
				.radiancePacking;
		const scatteringDensityPacking =
			DEFAULT_DISTANT_SUN_CONSTRUCTION_DOMAIN_SELECTION
				.scatteringDensityPacking;
		expect(radiancePacking.layout.shape).toEqual({
			direction: 34,
			position: 48,
			wavelength: 15,
		});
		expect(radiancePacking.layout.storage)
			.toEqual({ value: 195840, units: 'bytes' });
		expect(scatteringDensityPacking.layout.shape).toEqual({
			direction: 4374,
			position: 48,
			wavelength: 15,
		});
		expect(scatteringDensityPacking.layout.storage)
			.toEqual({ value: 25194240, units: 'bytes' });

		for (const packing of [
			radiancePacking,
			scatteringDensityPacking,
		]) {
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

	it('rejects fractional, negative, and upper-bound indices', () => {
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
				expect(() => packing.offset({ ...valid, [key]: invalidValue }))
					.toThrowError(new RegExp(key, 'u'));
			}
		}

		for (const invalidOffset of [-1, 0.5, 12]) {
			expect(() => packing.coordinatesAt(invalidOffset))
				.toThrowError(/offset/u);
		}
	});
});

function createTestPacking() {
	return new DistantSunFieldPacking({
		id: 'test-distant-sun-packing',
		directionCount: 3,
		positionCount: 2,
		wavelengthCount: 2,
	});
}
