import {
	acceptPixelDistance,
	acceptPixelSize,
	createPixelDistance,
	createPixelSize,
	pixelSizeToShaderValue,
} from '../PixelMath.js';

describe('PixelMath', () => {
	it('creates unit-bearing pixel sizes and shader-boundary values', () => {
		const size = createPixelSize(640, 480);

		expect(size).toEqual({ width: 640, height: 480, units: 'pixels' });
		expect(pixelSizeToShaderValue(size)).toEqual([640, 480]);
	});

	it('creates non-negative unit-bearing pixel distances', () => {
		expect(createPixelDistance(1.5)).toEqual({ value: 1.5, units: 'pixels' });
		expect(acceptPixelDistance({ value: 0, units: 'pixels' }))
			.toEqual({ value: 0, units: 'pixels' });
	});

	it('rejects unitless, raw, and extended compatibility shapes', () => {
		expect(() => acceptPixelSize([640, 480])).toThrowError(/units/);
		expect(() => acceptPixelSize({ width: 640, height: 480 })).toThrowError(/units/);
		expect(() => acceptPixelSize({
			width: 640,
			height: 480,
			units: 'pixels',
			pixelRatio: 1,
		})).toThrowError(/exactly/);
		expect(() => acceptPixelDistance(1)).toThrowError(/pixels/);
		expect(() => acceptPixelDistance({ value: 1, units: 'pixels', legacy: true }))
			.toThrowError(/exactly/);
	});
});
