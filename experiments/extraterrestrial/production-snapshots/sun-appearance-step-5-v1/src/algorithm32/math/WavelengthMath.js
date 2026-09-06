/** Nanometers per micrometer constant. */
const NANOMETERS_PER_MICROMETER = 1000;
/** Nanometers constant. */
const NANOMETERS = 'nanometers';
/** Micrometers constant. */
const MICROMETERS = 'micrometers';

/**
 * Called by this module to create a wavelength packet in micrometers.
 *
 * @param {number} value - Supplies the wavelength value.
 * @returns {Wavelength} - The wavelength packet.
 */
function inMicrometers(value) {
	return {
		value,
		units: MICROMETERS,
	};
}

/**
 * Called by this module to create a wavelength packet in nanometers.
 *
 * @param {number} value - Supplies the wavelength value.
 * @returns {Wavelength} - The wavelength packet.
 */
function inNanometers(value) {
	return {
		value,
		units: NANOMETERS,
	};
}

/**
 * Called by this module to return a wavelength packet value in nanometers. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @returns {number} - The wavelength in nanometers.
 */
function toNanometers(wavelength) {
	if (wavelength.units === MICROMETERS) {
		return wavelength.value * NANOMETERS_PER_MICROMETER;
	}

	return wavelength.value;
}

/**
 * Called by this module to return a wavelength packet value in micrometers. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @returns {number} - The wavelength in micrometers.
 */
function toMicrometers(wavelength) {
	if (wavelength.units === NANOMETERS) {
		return wavelength.value / NANOMETERS_PER_MICROMETER;
	}

	return wavelength.value;
}

/**
 * Called by this module to add two wavelength packets and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Wavelength} left - Supplies the left wavelength packet.
 * @param {Wavelength} right - Supplies the right wavelength packet.
 * @returns {Wavelength} - The summed wavelength packet.
 */
function add(left, right) {
	return {
		value: left.units === MICROMETERS ? left.value + toMicrometers(right) : left.value + toNanometers(right),
		units: left.units,
	};
}

/**
 * Called by this module to subtract one wavelength packet from another and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Wavelength} left - Supplies the left wavelength packet.
 * @param {Wavelength} right - Supplies the right wavelength packet.
 * @returns {Wavelength} - The difference wavelength packet.
 */
function subtract(left, right) {
	return {
		value: left.units === MICROMETERS ? left.value - toMicrometers(right) : left.value - toNanometers(right),
		units: left.units,
	};
}

/**
 * Called by this module to scale a wavelength packet by a scalar factor.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @param {number} factor - Supplies the scalar factor.
 * @returns {Wavelength} - The scaled wavelength packet.
 */
function scale(wavelength, factor) {
	return {
		value: wavelength.value * factor,
		units: wavelength.units,
	};
}

/**
 * Called by this module to assert that a wavelength packet uses the production wavelength unit contract.
 *
 * @param {unknown} wavelength - Supplies the candidate wavelength packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertWavelength(wavelength, label = 'wavelength') {
	if (!wavelength || typeof wavelength !== 'object') {
		throw new TypeError(`${label} must be a unit-bearing wavelength packet.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (wavelength);

	if (!Number.isFinite(candidate.value)) {
		throw new TypeError(`${label}.value must be finite.`);
	}

	if (candidate.units !== NANOMETERS && candidate.units !== MICROMETERS) {
		throw new TypeError(`${label}.units must be "nanometers" or "micrometers".`);
	}
}

export default {
	add,
	assertWavelength,
	inMicrometers,
	inNanometers,
	scale,
	subtract,
	toMicrometers,
	toNanometers,
};
