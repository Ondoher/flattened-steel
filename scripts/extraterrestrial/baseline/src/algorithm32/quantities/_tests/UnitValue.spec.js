import {
	UNIT_FAMILIES,
	assertUnitValue,
	convertUnitValue,
	createUnitValue,
} from '../UnitValue.js';

describe('UnitValue', () => {
	it('creates a typed packet with exactly value and units', () => {
		const value = createUnitValue({ value: 2, units: 'meters' });

		expect(value).toEqual({ value: 2, units: 'meters' });
		expect(Object.keys(value).sort()).toEqual(['units', 'value']);
		expect(Object.isFrozen(value)).toBeFalse();
		expect(assertUnitValue(value)).toBe(value);
	});

	it('normalizes only within declared compatible families', () => {
		expect(convertUnitValue(createUnitValue({ value: 1.5, units: 'kilometers' }), 'meters'))
			.toEqual({ value: 1500, units: 'meters' });
		expect(convertUnitValue(createUnitValue({ value: 0.4, units: 'micrometers' }), 'nanometers'))
			.toEqual({ value: 400, units: 'nanometers' });
		expect(convertUnitValue(createUnitValue({ value: 1, units: 'mebibytes' }), 'bytes'))
			.toEqual({ value: 1048576, units: 'bytes' });
		expect(convertUnitValue(createUnitValue({ value: 1, units: 'km^-1' }), 'm^-1'))
			.toEqual({ value: 0.001, units: 'm^-1' });
		expect(UNIT_FAMILIES.STORAGE.canonicalUnits).toBe('bytes');
		expect(UNIT_FAMILIES.INVERSE_DISTANCE.canonicalUnits).toBe('m^-1');
		expect(UNIT_FAMILIES.RAYLEIGH_COEFFICIENT_SCALE.canonicalUnits)
			.toBe('m^-1 micrometers^4');
	});

	it('retains arbitrary explicit units when no conversion is requested', () => {
		const coefficient = createUnitValue({ value: 1.2e-6, units: 'custom-unit' });

		expect(coefficient).toEqual({ value: 1.2e-6, units: 'custom-unit' });
		expect(convertUnitValue(coefficient, 'custom-unit')).toEqual(coefficient);
	});

	it('rejects missing units, non-finite values, extra fields, and cross-family conversion', () => {
		expect(() => /** @type {any} */ (createUnitValue)(2, 'meters'))
			.toThrowError(/requires \{ value, units \}/);
		expect(() => createUnitValue({ value: 2 })).toThrowError(/exactly value and units/);
		expect(() => createUnitValue({ value: Number.POSITIVE_INFINITY, units: 'meters' }))
			.toThrowError(/finite/);
		expect(() => assertUnitValue({ value: 2, units: 'meters', note: 'extra' }))
			.toThrowError(/exactly value and units/);
		expect(() => convertUnitValue(createUnitValue({ value: 1, units: 'meters' }), 'radians'))
			.toThrowError(/cannot convert/);
	});
});
