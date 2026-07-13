import {PixelMath} from '../PixelMath.js';

describe('PixelMath', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates unit-bearing pixel sizes and shader-boundary values', /** Called by Jasmine to exercise the named behavior. */ () => {
		const size = PixelMath.createPixelSize(640, 480);
		const second = PixelMath.createPixelSize(640, 480);

		expect(size).toEqual({width: 640, height: 480, units: 'pixels'});
		expect(second).not.toBe(size);
		expect(PixelMath.pixelSizeToShaderValue(size)).toEqual([640, 480]);
	});

	it('creates non-negative unit-bearing pixel distances', /** Called by Jasmine to exercise the named behavior. */ () => {
		const distance = PixelMath.createPixelDistance(1.5);
		expect(distance).toEqual({value: 1.5, units: 'pixels'});
		expect(PixelMath.createPixelDistance(1.5)).not.toBe(distance);
		expect(PixelMath.acceptPixelDistance({value: 0, units: 'pixels'})).toEqual({value: 0, units: 'pixels'});
	});

	it('defaults only omitted pixel packets and returns accepted copies', /** Called by Jasmine to exercise the named behavior. */ () => {
		const sizeFallback = {width: 4, height: 3, units: 'pixels'};
		const distanceFallback = {value: 2, units: 'pixels'};
		const size = PixelMath.sizeOrDefault(undefined, sizeFallback, 'size');
		const distance = PixelMath.distanceOrDefault(undefined, distanceFallback, 'distance');

		expect(size).toEqual(sizeFallback);
		expect(size).not.toBe(sizeFallback);
		expect(distance).toEqual(distanceFallback);
		expect(distance).not.toBe(distanceFallback);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.sizeOrDefault(null, sizeFallback, 'size'),
		).toThrowError(TypeError);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.distanceOrDefault(null, distanceFallback, 'distance'),
		).toThrowError(TypeError);
	});

	it('normalizes optional positive viewport dimensions', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(PixelMath.viewportCountOrDefault(undefined, 'viewport')).toBe(1);
		expect(PixelMath.viewportCountOrDefault(7.9, 'viewport')).toBe(7);
		expect(PixelMath.viewportCountOrDefault(0.5, 'viewport')).toBe(1);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.viewportCountOrDefault(0, 'viewport'),
		).toThrowError(RangeError);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.viewportCountOrDefault(Number.POSITIVE_INFINITY, 'viewport'),
		).toThrowError(RangeError);
	});

	it('rejects unitless, raw, and extended compatibility shapes', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.acceptPixelSize([640, 480]),
		).toThrowError(/units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.acceptPixelSize({width: 640, height: 480}),
		).toThrowError(/units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () =>
				PixelMath.acceptPixelSize({
					width: 640,
					height: 480,
					units: 'pixels',
					pixelRatio: 1,
				}),
		).toThrowError(/exactly/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.acceptPixelDistance(1),
		).toThrowError(/pixels/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => PixelMath.acceptPixelDistance({value: 1, units: 'pixels', legacy: true}),
		).toThrowError(/exactly/);
	});
});
