import ScalarMath from './ScalarMath.js';

/** Degrees to radians constant. */
const DEGREES_TO_RADIANS = Math.PI / 180;
/** Radians to degrees constant. */
const RADIANS_TO_DEGREES = 180 / Math.PI;
/** Degrees constant. */
const DEGREES = 'degrees';
/** Radians constant. */
const RADIANS = 'radians';

/**
 * Called by this module to create an angle packet in degrees.
 *
 * @param {number} value - Supplies the angle value.
 * @returns {Angle} - The angle packet.
 */
function inDegrees(value) {
	return {
		value,
		units: DEGREES,
	};
}

/**
 * Called by this module to create an angle packet in radians.
 *
 * @param {number} value - Supplies the angle value.
 * @returns {Angle} - The angle packet.
 */
function inRadians(value) {
	return {
		value,
		units: RADIANS,
	};
}

/**
 * Called by this module to return an angle packet value in radians. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Angle} angle - Supplies the angle packet.
 * @returns {number} - The angle in radians.
 */
function toRadians(angle) {
	if (angle.units === DEGREES) {
		return angle.value * DEGREES_TO_RADIANS;
	}

	return angle.value;
}

/**
 * Called by this module to return an angle packet value in degrees. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {Angle} angle - Supplies the angle packet.
 * @returns {number} - The angle in degrees.
 */
function toDegrees(angle) {
	if (angle.units === RADIANS) {
		return angle.value * RADIANS_TO_DEGREES;
	}

	return angle.value;
}

/**
 * Called by this module to add two angle packets and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Angle} left - Supplies the left angle packet.
 * @param {Angle} right - Supplies the right angle packet.
 * @returns {Angle} - The summed angle packet.
 */
function add(left, right) {
	return {
		value: left.units === RADIANS ? left.value + toRadians(right) : left.value + toDegrees(right),
		units: left.units,
	};
}

/**
 * Called by this module to subtract one angle packet from another and return the result in the left packet's units. Conditional result values are selected from the accepted input and current state.
 *
 * @param {Angle} left - Supplies the left angle packet.
 * @param {Angle} right - Supplies the right angle packet.
 * @returns {Angle} - The difference angle packet.
 */
function subtract(left, right) {
	return {
		value: left.units === RADIANS ? left.value - toRadians(right) : left.value - toDegrees(right),
		units: left.units,
	};
}

/**
 * Called by this module to scale an angle packet by a scalar factor.
 *
 * @param {Angle} angle - Supplies the angle packet.
 * @param {number} factor - Supplies the scalar factor.
 * @returns {Angle} - The scaled angle packet.
 */
function scale(angle, factor) {
	return {
		value: angle.value * factor,
		units: angle.units,
	};
}

/**
 * Called by this module to assert that an angle packet uses the production angle unit contract.
 *
 * @param {unknown} angle - Supplies the candidate angle packet.
 * @param {string} [label] - Supplies the error label.
 * @returns {void} -
 * @throws {TypeError} - When an accepted value does not satisfy the required type or shape.
 */
function assertAngle(angle, label = 'angle') {
	if (!angle || typeof angle !== 'object') {
		throw new TypeError(`${label} must be a unit-bearing angle packet.`);
	}
	const candidate = /** @type {{ value?: unknown, units?: unknown }} */ (angle);

	if (!Number.isFinite(candidate.value)) {
		throw new TypeError(`${label}.value must be finite.`);
	}

	if (candidate.units !== RADIANS && candidate.units !== DEGREES) {
		throw new TypeError(`${label}.units must be "radians" or "degrees".`);
	}
}

/**
 * Called by this module to wrap an angle in radians.
 *
 * @param {number} radians - Supplies the angle in radians.
 * @param {AngleWrapOptions} [options] - Supplies call-local wrap bounds.
 * @returns {number} - The wrapped angle in radians.
 */
function wrapRadians(radians, options = {}) {
	return ScalarMath.wrap(radians, options.min ?? 0, options.max ?? Math.PI * 2);
}

/**
 * Called by this module to wrap an angle in degrees.
 *
 * @param {number} degrees - Supplies the angle in degrees.
 * @param {AngleWrapOptions} [options] - Supplies call-local wrap bounds.
 * @returns {number} - The wrapped angle in degrees.
 */
function wrapDegrees(degrees, options = {}) {
	return ScalarMath.wrap(degrees, options.min ?? 0, options.max ?? 360);
}

/** Angle conversion, arithmetic, and wrapping operations. */
export default {
	add,
	assertAngle,
	inDegrees,
	inRadians,
	scale,
	subtract,
	toDegrees,
	toRadians,
	wrapDegrees,
	wrapRadians,
};
