import {ValueValidation} from '../ValueValidation.js';

describe('ValueValidation', /** Called by Jasmine to register the named test suite. */ () => {
	it('accepts non-empty strings and positive safe integers', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(ValueValidation.requiredString('value', 'test value')).toBe('value');
		expect(ValueValidation.positiveInteger(3, 'test count')).toBe(3);
	});

	it('rejects empty strings and non-positive integers', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.requiredString(' ', 'test value'),
		).toThrowError(TypeError, 'test value must be a non-empty string.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.positiveInteger(0, 'test count'),
		).toThrowError(RangeError, 'test count must be a positive safe integer.');
	});

	it('recognizes typed arrays but excludes DataView', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(ValueValidation.isTypedArray(new Float32Array(1))).toBeTrue();
		expect(ValueValidation.isTypedArray(new DataView(new ArrayBuffer(4)))).toBeFalse();
		expect(ValueValidation.isTypedArray([1])).toBeFalse();
	});

	it('uses a finite-number fallback only when the value is omitted', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(ValueValidation.finiteNumberOrDefault(undefined, 4, 'test value')).toBe(4);
		expect(ValueValidation.finiteNumberOrDefault(0, 4, 'test value')).toBe(0);
		expect(ValueValidation.finiteNumberOrDefault(-2.5, 4, 'test value')).toBe(-2.5);
	});

	it('rejects non-number and non-finite finite-number requests', /** Called by Jasmine to exercise the named behavior. */ () => {
		for (const value of [null, '3', Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			expect(
				/**
				 * Called by Jasmine to invoke the operation whose outcome is asserted.
				 * @returns - The callback result returned to its caller.
				 */ () => ValueValidation.finiteNumberOrDefault(value, 4, 'test value'),
			).toThrowError(TypeError, 'test value must be finite.');
		}
	});

	it('defaults booleans, strings, and positive integers only when omitted', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(ValueValidation.booleanOrDefault(undefined, true, 'enabled')).toBeTrue();
		expect(ValueValidation.booleanOrDefault(false, true, 'enabled')).toBeFalse();
		expect(ValueValidation.stringOrDefault(undefined, 'fallback', 'name')).toBe('fallback');
		expect(ValueValidation.optionalString(undefined, 'name')).toBeUndefined();
		expect(ValueValidation.positiveIntegerOrDefault(undefined, 4, 'count')).toBe(4);
		expect(ValueValidation.requiredStringOrDefault(undefined, 'fallback', 'name')).toBe('fallback');
	});

	it('preserves the validation diagnostics of defaulted values', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.booleanOrDefault(null, true, 'enabled'),
		).toThrowError(TypeError, 'enabled must be boolean.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.stringOrDefault('', 'fallback', 'name'),
		).toThrowError(TypeError, 'name must be a nonempty string.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.optionalString(null, 'name'),
		).toThrowError(TypeError, 'name must be a nonempty string.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.positiveIntegerOrDefault(0, 4, 'count'),
		).toThrowError(RangeError, 'count must be a positive integer.');
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => ValueValidation.requiredStringOrDefault('', 'fallback', 'name'),
		).toThrowError(TypeError, 'name must be a non-empty string.');
	});
});
