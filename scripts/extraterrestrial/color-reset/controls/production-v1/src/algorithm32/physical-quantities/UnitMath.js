import {ValueValidation} from '../validation/ValueValidation.js';

/**
 * Called by this module to create independently owned metadata for one compatible unit family.
 *
 * @param {string} canonicalUnits - The canonical unit spelling.
 * @param {readonly string[]} supportedUnits - The supported unit spellings.
 * @returns {UnitFamilyContract} - The unit-family metadata.
 *
 */
function family(canonicalUnits, supportedUnits) {
	return {
		canonicalUnits,
		supportedUnits: [...supportedUnits],
	};
}

/**
 * Called by this module to create conversion metadata for one unit spelling.
 *
 * @param {string} family - The physical-family identity.
 * @param {number} scale - The scale into the family's canonical units.
 * @returns {UnitConversion} - The unit-conversion metadata.
 *
 */
function conversion(family, scale) {
	return {family, scale};
}

/**
 * Conversion metadata keyed by supported unit spelling.
 *
 * @type {Readonly<Record<string, UnitConversion>>}
 */
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
	1: conversion('dimensionless', 1),
	pixels: conversion('pixel', 1),
	bytes: conversion('storage', 1),
	kibibytes: conversion('storage', 1024),
	mebibytes: conversion('storage', 1024 * 1024),
};

/**
 * Called by this module to accept an exact unit-value definition and create an independently owned packet.
 *
 * @template {string} TUnits
 * @param {UnitValue<TUnits>} definition - The value and its units.
 * @returns {UnitValue<TUnits>} - The unit-bearing packet.
 * @throws {TypeError} - When the definition lacks the exact finite value and non-empty unit contract.
 */
function createUnitValue(definition) {
	if (definition === null || typeof definition !== 'object' || Array.isArray(definition)) {
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
	const checkedUnits = /** @type {TUnits} */ (ValueValidation.requiredString(candidate.units, 'UnitValue.units'));
	return {
		value: checkedValue,
		units: checkedUnits,
	};
}

/**
 * Called by this module to assert the exact public unit-value shape.
 *
 * @param {unknown} value - The candidate packet.
 * @param {string} [label] - The diagnostic label.
 * @returns {UnitValue} - The accepted packet.
 * @throws {TypeError} - When the candidate lacks the exact finite value and non-empty unit contract.
 */
function assertUnitValue(value, label = 'UnitValue') {
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

	ValueValidation.requiredString(candidate.units, `${label}.units`);
	return /** @type {UnitValue} */ (value);
}

/**
 * Called by this module to test whether a value conforms to the unit-value contract without throwing.
 *
 * @param {unknown} value - The candidate packet.
 * @returns {boolean} - True when the packet is valid.
 *
 */
function isUnitValue(value) {
	try {
		assertUnitValue(value);
		return true;
	} catch (_error) {
		return false;
	}
}

/**
 * Called by this module to copy an accepted unit value into an independently owned packet.
 *
 * @param {unknown} value - The candidate packet.
 * @param {string} [label] - The diagnostic label.
 * @returns {UnitValue} - The independently owned copy.
 * @throws {TypeError} - When the candidate is not a valid unit value.
 */
function copyUnitValue(value, label = 'UnitValue') {
	const checked = assertUnitValue(value, label);
	return createUnitValue(checked);
}

/**
 * Called by this module to convert one unit value to compatible target units. Unknown but identical unit spellings produce a copy. A conversion between unknown units or different physical families fails loudly.
 *
 * @template {string} TargetUnits
 * @param {unknown} value - The source packet.
 * @param {TargetUnits} targetUnits - The requested units.
 * @param {string} [label] - The diagnostic label.
 * @returns {UnitValue<TargetUnits>} - The converted packet.
 * @throws {TypeError} - When the source is invalid or the requested conversion is incompatible.
 */
function convertUnitValue(value, targetUnits, label = 'UnitValue') {
	const checked = assertUnitValue(value, label);
	const checkedTargetUnits = /** @type {TargetUnits} */ (ValueValidation.requiredString(targetUnits, 'targetUnits'));

	if (checked.units === checkedTargetUnits) {
		return createUnitValue({
			value: checked.value,
			units: checkedTargetUnits,
		});
	}

	const source = UNIT_CONVERSIONS[checked.units];
	const target = UNIT_CONVERSIONS[checkedTargetUnits];

	if (!source || !target || source.family !== target.family) {
		throw new TypeError(`${label} units ${checked.units} cannot convert to ${checkedTargetUnits}.`);
	}

	return createUnitValue({
		value: (checked.value * source.scale) / target.scale,
		units: checkedTargetUnits,
	});
}

/**
 * Called by this module to normalize one unit value to a caller-selected canonical unit spelling.
 *
 * @template {string} CanonicalUnits
 * @param {unknown} value - The source packet.
 * @param {CanonicalUnits} canonicalUnits - The canonical unit spelling.
 * @param {string} [label] - The diagnostic label.
 * @returns {UnitValue<CanonicalUnits>} - The normalized packet.
 * @throws {TypeError} - When the source is invalid or the requested conversion is incompatible.
 */
function normalizeUnitValue(value, canonicalUnits, label = 'UnitValue') {
	return convertUnitValue(value, canonicalUnits, label);
}

/** Unit-family, unit-value, conversion, copying, and normalization operations. */
export const UnitMath = {
	assertUnitValue,
	conversion,
	convertUnitValue,
	copyUnitValue,
	createUnitValue,
	family,
	isUnitValue,
	normalizeUnitValue,
};
