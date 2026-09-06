import {
	DENSE_SCALAR_ARRAY_LAYOUT_SCHEMA_REVISION,
	assertDenseScalarArrayLayout,
	createDenseScalarArrayLayout,
} from '../DenseScalarArrayLayout.js';

describe('DenseScalarArrayLayout', () => {
	it('declares the native W27 field as direction-fastest binary64 storage', () => {
		const layout = createNativeW27Layout();

		expect(layout).toEqual(jasmine.objectContaining({
			kind: 'dense-scalar-array-layout',
			id: 'test-native-w27-binary64',
			schemaRevision: DENSE_SCALAR_ARRAY_LAYOUT_SCHEMA_REVISION,
			format: 'Float64Array',
			precision: 'binary64',
			axes: {
				fastest: 'direction',
				middle: 'position',
				slowest: 'wavelength',
			},
			shape: {
				direction: 4374,
				position: 48,
				wavelength: 15,
			},
			scalarCount: 3149280,
			storage: {
				value: 25194240,
				units: 'bytes',
			},
		}));
		expect(layout.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/u);
		expect(assertDenseScalarArrayLayout(layout)).toBe(layout);
	});

	it('reports the smaller Fibonacci-34 radiance-field storage exactly', () => {
		const layout = createDenseScalarArrayLayout({
			id: 'test-native-fibonacci-binary64',
			directionCount: 34,
			positionCount: 48,
			wavelengthCount: 15,
		});

		expect(layout.scalarCount).toBe(24480);
		expect(layout.storage).toEqual({ value: 195840, units: 'bytes' });
	});

	it('reproduces the same metadata identity for the same dimensions', () => {
		const first = createNativeW27Layout();
		const second = createNativeW27Layout();

		expect(first.contentHash).toBe(second.contentHash);
		expect(first).toEqual(second);
	});

	it('rejects malformed dimensions and inconsistent metadata', () => {
		expect(() => createDenseScalarArrayLayout())
			.toThrowError(/must be an object/u);
		expect(() => createDenseScalarArrayLayout({
			id: 'null-schema',
			schemaRevision: null,
			directionCount: 1,
			positionCount: 1,
			wavelengthCount: 1,
		})).toThrowError(/schema revision/u);
		expect(() => createDenseScalarArrayLayout({
			id: 'zero-direction',
			directionCount: 0,
			positionCount: 48,
			wavelengthCount: 15,
		})).toThrowError(/direction count/u);
		expect(() => createDenseScalarArrayLayout({
			id: 'unsafe-shape',
			directionCount: Number.MAX_SAFE_INTEGER,
			positionCount: 2,
			wavelengthCount: 1,
		})).toThrowError(/safe integer/u);

		const layout = createNativeW27Layout();
		expect(() => assertDenseScalarArrayLayout({
			...layout,
			precision: 'binary32',
		})).toThrowError(/Float64Array binary64/u);
		expect(() => assertDenseScalarArrayLayout({
			...layout,
			axes: { ...layout.axes, fastest: 'wavelength' },
		})).toThrowError(/direction, position, then wavelength/u);
		expect(() => assertDenseScalarArrayLayout({
			...layout,
			storage: { value: 1, units: 'bytes' },
		})).toThrowError(/storage does not match/u);
		expect(() => assertDenseScalarArrayLayout({
			...layout,
			contentHash: 'sha256:tampered',
		})).toThrowError(/content hash/u);
	});

	it('accepts an equivalent metadata copy', () => {
		const layout = createNativeW27Layout();

		expect(assertDenseScalarArrayLayout({ ...layout })).toEqual(layout);
		expect(assertDenseScalarArrayLayout(({
			...layout,
			shape: { ...layout.shape },
		}))).toEqual(layout);
	});
});

function createNativeW27Layout() {
	return createDenseScalarArrayLayout({
		id: 'test-native-w27-binary64',
		directionCount: 4374,
		positionCount: 48,
		wavelengthCount: 15,
	});
}
