import { requiredString } from '../descriptors/descriptorSupport.js';

/**
 * Create public family metadata.
 *
 * @param {string} canonicalUnits - Supplies canonical units.
 * @param {readonly string[]} supportedUnits - Supplies supported spellings.
 * @returns {UnitFamilyDescriptor} The family metadata.
 */
function family(canonicalUnits, supportedUnits) {
	return {
		canonicalUnits,
		supportedUnits: [...supportedUnits],
	};
}

/**
 * Create one internal conversion entry.
 *
 * @param {string} family - Supplies physical-family identity.
 * @param {number} scale - Supplies scale into canonical family units.
 * @returns {Readonly<{ family: string, scale: number }>} The conversion entry.
 */
function conversion(family, scale) {
	return { family, scale };
}

/**
 * Describe the unit families that have explicit conversion support.
 *
 * UnitValue itself accepts any stable non-empty unit spelling. Conversion is
 * deliberately narrower: values may only convert within one declared family.
 */
export const UNIT_FAMILIES = {
	DISTANCE: family('meters', ['meters', 'kilometers']),
	INVERSE_DISTANCE: family('m^-1', ['m^-1', 'km^-1']),
	RAYLEIGH_COEFFICIENT_SCALE: family(
		'm^-1 micrometers^4',
		['m^-1 micrometers^4'],
	),
	WAVELENGTH: family('nanometers', ['nanometers', 'micrometers']),
	ANGLE: family('radians', ['radians', 'degrees']),
	SOLID_ANGLE: family('steradians', ['steradians']),
	INVERSE_SOLID_ANGLE: family('sr^-1', ['sr^-1']),
	DURATION: family('seconds', ['seconds']),
	SCENE_DISTANCE: family('scene-units', ['scene-units']),
	SCENE_SCALE: family('meters-per-scene-unit', ['meters-per-scene-unit']),
	DIMENSIONLESS: family('1', ['1']),
	PIXEL: family('pixels', ['pixels']),
	STORAGE: family('bytes', ['bytes', 'kibibytes', 'mebibytes']),
};

const UNIT_CONVERSIONS = {
	meters: conversion('distance', 1),
	kilometers: conversion('distance', 1000),
	'm^-1': conversion('inverse-distance', 1),
	'km^-1': conversion('inverse-distance', 0.001),
	'm^-1 micrometers^4': conversion('rayleigh-coefficient-scale', 1),
	nanometers: conversion('wavelength', 1),
	micrometers: conversion('wavelength', 1000),
	radians: conversion('angle', 1),
	degrees: conversion('angle', Math.PI / 180),
	steradians: conversion('solid-angle', 1),
	'sr^-1': conversion('inverse-solid-angle', 1),
	seconds: conversion('duration', 1),
	'scene-units': conversion('scene-distance', 1),
	'meters-per-scene-unit': conversion('scene-scale', 1),
	'1': conversion('dimensionless', 1),
	pixels: conversion('pixel', 1),
	bytes: conversion('storage', 1),
	kibibytes: conversion('storage', 1024),
	mebibytes: conversion('storage', 1024 * 1024),
};

/**
 * Create one scalar with units carried as data.
 *
 * @template {string} TUnits
 * @param {UnitValue<TUnits>} definition - Supplies a value and its units.
 * @returns {UnitValue<TUnits>} The packet.
 */
export function createUnitValue(definition) {
	if (definition === null
		|| typeof definition !== 'object'
		|| Array.isArray(definition)) {
		throw new TypeError('UnitValue requires { value, units }.');
	}

	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (definition);
	const keys = Object.keys(candidate).sort();
	if (keys.length !== 2 || keys[0] !== 'units' || keys[1] !== 'value') {
		throw new TypeError('UnitValue must have exactly value and units properties.');
	}

	if (!Number.isFinite(candidate.value)) {
		throw new TypeError('UnitValue.value must be finite.');
	}

	const checkedValue = /** @type {number} */ (candidate.value);
	const checkedUnits = /** @type {TUnits} */ (
		requiredString(candidate.units, 'UnitValue.units')
	);
	return {
		value: checkedValue,
		units: checkedUnits,
	};
}

/**
 * Assert the exact public UnitValue shape.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {UnitValue} The packet.
 */
export function assertUnitValue(value, label = 'UnitValue') {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError(`${label} must be an object with value and units.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (value);

	const keys = Object.keys(candidate).sort();
	if (keys.length !== 2 || keys[0] !== 'units' || keys[1] !== 'value') {
		throw new TypeError(`${label} must have exactly value and units properties.`);
	}

	if (!Number.isFinite(candidate.value)) {
		throw new TypeError(`${label}.value must be finite.`);
	}

	requiredString(candidate.units, `${label}.units`);
	return /** @type {UnitValue} */ (value);
}

/**
 * Test whether a value conforms to UnitValue without throwing.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @returns {boolean} True when the packet is valid.
 */
export function isUnitValue(value) {
	try {
		assertUnitValue(value);
		return true;
	} catch (_error) {
		return false;
	}
}

/**
 * Copy an existing UnitValue into an owned packet.
 *
 * @param {unknown} value - Supplies the candidate packet.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {UnitValue} The copy.
 */
export function copyUnitValue(value, label = 'UnitValue') {
	const checked = assertUnitValue(value, label);
	return createUnitValue(checked);
}

/**
 * Convert one UnitValue to compatible target units.
 *
 * Unknown but identical unit spellings may be copied. A conversion between
 * unknown units or different physical families fails loudly.
 *
 * @template {string} TargetUnits
 * @param {unknown} value - Supplies the source packet.
 * @param {TargetUnits} targetUnits - Supplies requested units.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {UnitValue<TargetUnits>} The converted packet.
 */
export function convertUnitValue(value, targetUnits, label = 'UnitValue') {
	const checked = assertUnitValue(value, label);
	const checkedTargetUnits = /** @type {TargetUnits} */ (
		requiredString(targetUnits, 'targetUnits')
	);

	if (checked.units === checkedTargetUnits) {
		return createUnitValue({
			value: checked.value,
			units: checkedTargetUnits,
		});
	}

	const conversions = /** @type {Record<string, Readonly<{
	 * family: string,
	 * scale: number,
	 * }>>} */ (UNIT_CONVERSIONS);
	const source = conversions[checked.units];
	const target = conversions[checkedTargetUnits];

	if (!source || !target || source.family !== target.family) {
		throw new TypeError(
			`${label} units ${checked.units} cannot convert to ${checkedTargetUnits}.`,
		);
	}

	return createUnitValue({
		value: checked.value * source.scale / target.scale,
		units: checkedTargetUnits,
	});
}

/**
 * Normalize one UnitValue to a caller-selected canonical unit spelling.
 *
 * @template {string} CanonicalUnits
 * @param {unknown} value - Supplies the source packet.
 * @param {CanonicalUnits} canonicalUnits - Supplies the canonical unit spelling.
 * @param {string} [label] - Supplies a diagnostic label.
 * @returns {UnitValue<CanonicalUnits>} The normalized packet.
 */
export function normalizeUnitValue(value, canonicalUnits, label = 'UnitValue') {
	return convertUnitValue(value, canonicalUnits, label);
}
