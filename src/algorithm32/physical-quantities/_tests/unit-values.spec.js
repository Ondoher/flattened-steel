import {UNIT_FAMILIES} from '../consts.js';
import {UnitMath} from '../UnitMath.js';

describe('UnitMath', /** Called by Jasmine to register the named test suite. */ () => {
	it('creates independently owned family metadata and canonical conversion entries', /** Called by Jasmine to exercise the named behavior. */ () => {
		const supportedUnits = ['meters'];
		const family = UnitMath.family('meters', supportedUnits);

		supportedUnits.push('kilometers');
		expect(family).toEqual({canonicalUnits: 'meters', supportedUnits: ['meters']});
		expect(UnitMath.conversion('distance', 1000)).toEqual({family: 'distance', scale: 1000});
	});

	it('creates a typed packet with exactly value and units', /** Called by Jasmine to exercise the named behavior. */ () => {
		const definition = {value: 2, units: 'meters'};
		const value = UnitMath.createUnitValue(definition);

		expect(value).toEqual({value: 2, units: 'meters'});
		expect(value).not.toBe(definition);
		expect(Object.keys(value).sort()).toEqual(['units', 'value']);
		expect(Object.isFrozen(value)).toBeFalse();
		expect(UnitMath.assertUnitValue(value)).toBe(value);
	});

	it('recognizes, copies, and normalizes unit-bearing packets', /** Called by Jasmine to exercise the named behavior. */ () => {
		const source = UnitMath.createUnitValue({value: 2, units: 'kilometers'});
		const copy = UnitMath.copyUnitValue(source);

		expect(UnitMath.isUnitValue(source)).toBeTrue();
		expect(UnitMath.isUnitValue({value: Number.NaN, units: 'meters'})).toBeFalse();
		expect(copy).toEqual(source);
		expect(copy).not.toBe(source);
		expect(UnitMath.normalizeUnitValue(source, 'meters')).toEqual({value: 2000, units: 'meters'});
	});

	it('normalizes only within declared compatible families', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			UnitMath.convertUnitValue(UnitMath.createUnitValue({value: 1.5, units: 'kilometers'}), 'meters'),
		).toEqual({
			value: 1500,
			units: 'meters',
		});
		expect(
			UnitMath.convertUnitValue(UnitMath.createUnitValue({value: 0.4, units: 'micrometers'}), 'nanometers'),
		).toEqual({
			value: 400,
			units: 'nanometers',
		});
		expect(UnitMath.convertUnitValue(UnitMath.createUnitValue({value: 1, units: 'mebibytes'}), 'bytes')).toEqual({
			value: 1048576,
			units: 'bytes',
		});
		expect(UnitMath.convertUnitValue(UnitMath.createUnitValue({value: 1, units: 'km^-1'}), 'm^-1')).toEqual({
			value: 0.001,
			units: 'm^-1',
		});
		expect(UNIT_FAMILIES.STORAGE.canonicalUnits).toBe('bytes');
		expect(UNIT_FAMILIES.INVERSE_DISTANCE.canonicalUnits).toBe('m^-1');
		expect(UNIT_FAMILIES.RAYLEIGH_COEFFICIENT_SCALE.canonicalUnits).toBe('m^-1 micrometers^4');
	});

	it('retains arbitrary explicit units when no conversion is requested', /** Called by Jasmine to exercise the named behavior. */ () => {
		const coefficient = UnitMath.createUnitValue({value: 1.2e-6, units: 'custom-unit'});
		const copy = UnitMath.convertUnitValue(coefficient, 'custom-unit');

		expect(coefficient).toEqual({value: 1.2e-6, units: 'custom-unit'});
		expect(copy).toEqual(coefficient);
		expect(copy).not.toBe(coefficient);
	});

	it('rejects missing units, non-finite values, extra fields, and cross-family conversion', /** Called by Jasmine to exercise the named behavior. */ () => {
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => /** @type {any} */ (UnitMath.createUnitValue)(2, 'meters'),
		).toThrowError(/requires \{ value, units \}/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => UnitMath.createUnitValue(/** @type {any} */ ({value: 2})),
		).toThrowError(/exactly value and units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => UnitMath.createUnitValue({value: Number.POSITIVE_INFINITY, units: 'meters'}),
		).toThrowError(/finite/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => UnitMath.assertUnitValue({value: 2, units: 'meters', note: 'extra'}),
		).toThrowError(/exactly value and units/);
		expect(
			/**
			 * Called by Jasmine to invoke the operation whose outcome is asserted.
			 * @returns - The callback result returned to its caller.
			 */ () => UnitMath.convertUnitValue(UnitMath.createUnitValue({value: 1, units: 'meters'}), 'radians'),
		).toThrowError(/cannot convert/);
	});
});
