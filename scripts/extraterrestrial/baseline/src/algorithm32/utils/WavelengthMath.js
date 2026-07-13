const NANOMETERS_PER_MICROMETER = 1000;
const NANOMETERS = 'nanometers';
const MICROMETERS = 'micrometers';

/**
 * Create a wavelength packet in micrometers.
 *
 * @param {number} value - Supplies the wavelength value.
 * @returns {Wavelength} The wavelength packet.
 */
function inMicrometers(value) {
	return {
		value,
		units: MICROMETERS,
	};
}

/**
 * Create a wavelength packet in nanometers.
 *
 * @param {number} value - Supplies the wavelength value.
 * @returns {Wavelength} The wavelength packet.
 */
function inNanometers(value) {
	return {
		value,
		units: NANOMETERS,
	};
}

/**
 * Return a wavelength packet value in nanometers.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @returns {number} The wavelength in nanometers.
 */
function toNanometers(wavelength) {
	if (wavelength.units === MICROMETERS) {
		return wavelength.value * NANOMETERS_PER_MICROMETER;
	}

	return wavelength.value;
}

/**
 * Return a wavelength packet value in micrometers.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @returns {number} The wavelength in micrometers.
 */
function toMicrometers(wavelength) {
	if (wavelength.units === NANOMETERS) {
		return wavelength.value / NANOMETERS_PER_MICROMETER;
	}

	return wavelength.value;
}

/**
 * Add two wavelength packets and return the result in the left packet's units.
 *
 * @param {Wavelength} left - Supplies the left wavelength packet.
 * @param {Wavelength} right - Supplies the right wavelength packet.
 * @returns {Wavelength} The summed wavelength packet.
 */
function add(left, right) {
	return {
		value: left.units === MICROMETERS ? left.value + toMicrometers(right) : left.value + toNanometers(right),
		units: left.units,
	};
}

/**
 * Subtract one wavelength packet from another and return the result in the left packet's units.
 *
 * @param {Wavelength} left - Supplies the left wavelength packet.
 * @param {Wavelength} right - Supplies the right wavelength packet.
 * @returns {Wavelength} The difference wavelength packet.
 */
function subtract(left, right) {
	return {
		value: left.units === MICROMETERS ? left.value - toMicrometers(right) : left.value - toNanometers(right),
		units: left.units,
	};
}

/**
 * Scale a wavelength packet by a scalar factor.
 *
 * @param {Wavelength} wavelength - Supplies the wavelength packet.
 * @param {number} factor - Supplies the scalar factor.
 * @returns {Wavelength} The scaled wavelength packet.
 */
function scale(wavelength, factor) {
	return {
		value: wavelength.value * factor,
		units: wavelength.units,
	};
}

/**
 * Assert that a wavelength packet uses the production wavelength unit contract.
 *
 * @param {unknown} wavelength - Supplies the candidate wavelength packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {void}
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
