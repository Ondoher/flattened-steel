import {GeometryDirections} from '../GeometryDirections.js';
import {GeometryVisualRequestValues} from '../GeometryVisualRequestValues.js';

describe('Algorithm32 shared geometry values', /** Called by Jasmine to register the named test suite. */ () => {
	it('accepts and copies finite direction and Three-vector tuples', /** Called by Jasmine to exercise the named behavior. */ () => {
		const direction = [1, 2, 3];
		const acceptedDirection = GeometryDirections.directionTuple(direction, 'direction');
		const threeDirection = GeometryDirections.threeVectorTuple({x: 4, y: 5, z: 6}, 'Three direction');

		expect(acceptedDirection).toEqual([1, 2, 3]);
		expect(acceptedDirection).not.toBe(direction);
		expect(threeDirection).toEqual([4, 5, 6]);
	});

	it('preserves direction shape and numerical-degeneracy diagnostics', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryDirections.directionTuple([1, 2], 'direction'),
		).toThrowError(TypeError, 'direction must be a finite three-component vector.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryDirections.threeVectorTuple({x: 1, y: 2}, 'Three direction'),
		).toThrowError(TypeError, 'Three direction must be a Three-style vector.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryDirections.normalizeDirection([0, 0, 0], 'direction'),
		).toThrowError(RangeError, 'direction must be non-zero.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryDirections.normalizeTrustedDirection([0, 0, 0], 'direction'),
		).toThrowError(RangeError, 'direction must be non-zero.');
	});

	it('normalizes accepted and trusted directions in the retained order', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const normalized of [
			GeometryDirections.normalizeDirection([0, 3, 4], 'direction'),
			GeometryDirections.normalizeTrustedDirection([0, 3, 4], 'direction'),
		]) {
			expect(normalized[0]).toBe(0);
			expect(normalized[1]).toBeCloseTo(0.6, 15);
			expect(normalized[2]).toBeCloseTo(0.8, 15);
		}
	});

	it('normalizes visual display channels with fresh byte tuples', /** Called by Jasmine to exercise the named behavior. */ () => {
		const input = [12.4, -5, 300];
		const displayRgba = GeometryVisualRequestValues.displayRgbaOrNull(input);

		expect(GeometryVisualRequestValues.clampByte(-0.6)).toBe(0);
		expect(GeometryVisualRequestValues.clampByte(12.6)).toBe(13);
		expect(GeometryVisualRequestValues.clampByte(300)).toBe(255);
		expect(displayRgba).toEqual([12, 0, 255, 255]);
		expect(displayRgba).not.toBe(input);
		expect(GeometryVisualRequestValues.displayRgbaOrNull(undefined)).toBeNull();
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryVisualRequestValues.displayRgbaOrNull([1, Number.NaN, 3]),
		).toThrowError(TypeError, 'visualMaterialDisplayRgba must contain three or four finite channels.');
	});

	it('normalizes endpoint shadow requests with retained defaults and diagnostics', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(GeometryVisualRequestValues.endpointShadowOrNull(undefined)).toBeNull();
		expect(GeometryVisualRequestValues.endpointShadowOrNull(null)).toBeNull();
		expect(GeometryVisualRequestValues.endpointShadowOrNull({enabled: false})).toBeNull();
		expect(GeometryVisualRequestValues.endpointShadowOrNull({enabled: true})).toEqual({
			enabled: true,
			receiveShadow: true,
			shadowPolicy: 'geometry-ground-receives-source-shadow-map',
		});
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryVisualRequestValues.endpointShadowOrNull([]),
		).toThrowError(TypeError, 'shadow must be an object when supplied.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryVisualRequestValues.endpointShadowOrNull({enabled: 'yes'}),
		).toThrowError(TypeError, 'shadow.enabled must be boolean.');
	});

	it('resolves the visual material lighting policy', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(GeometryVisualRequestValues.materialLightingOrDefault(undefined)).toBe('basic');
		expect(GeometryVisualRequestValues.materialLightingOrDefault('lambert')).toBe('lambert');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => GeometryVisualRequestValues.materialLightingOrDefault('phong'),
		).toThrowError(RangeError, 'visualMaterialLighting must be "basic" or "lambert".');
	});
});
