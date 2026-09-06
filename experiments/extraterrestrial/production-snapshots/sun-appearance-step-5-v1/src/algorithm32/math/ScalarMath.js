/**
 * Called by this module to check whether a value is a finite number.
 *
 * @param {unknown} value - Supplies the value to inspect.
 * @returns {boolean} - True when the value is a finite number.
 */
function isFiniteNumber(value) {
	return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Called by this module to clamp a number to an inclusive range.
 *
 * @param {number} value - Supplies the value to clamp.
 * @param {number} min - Supplies the inclusive lower bound.
 * @param {number} max - Supplies the inclusive upper bound.
 * @returns {number} - The clamped value.
 */
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Called by this module to wrap a value into the half-open range [min, max).
 *
 * @param {number} value - The value to wrap.
 * @param {number} min - The inclusive lower bound.
 * @param {number} max - The exclusive upper bound.
 * @returns {number} - The wrapped value.
 *
 */
function wrap(value, min, max) {
	const size = max - min;

	return ((((value - min) % size) + size) % size) + min;
}

/**
 * Called by this module to check whether a number is inside a range.
 *
 * @param {number} value - Supplies the value to inspect.
 * @param {number} min - Supplies the lower bound.
 * @param {number} max - Supplies the upper bound.
 * @param {RangeOptions} [options] - Supplies call-local range behavior.
 * @returns {boolean} - True when the value is inside the requested range.
 */
function inRange(value, min, max, options = {}) {
	const inclusive = options.inclusive !== false;

	if (inclusive) {
		return value >= min && value <= max;
	}

	return value > min && value < max;
}

/**
 * Called by this module to check whether two numbers are equal within a tolerance.
 *
 * @param {number} left - Supplies the first value.
 * @param {number} right - Supplies the second value.
 * @param {ToleranceOptions} [options] - Supplies call-local tolerance behavior.
 * @returns {boolean} - True when the values differ by no more than epsilon.
 */
function nearlyEqual(left, right, options = {}) {
	const epsilon = options.epsilon ?? Number.EPSILON;

	return Math.abs(left - right) <= epsilon;
}

/**
 * Called by this module to linearly interpolate between two values.
 *
 * @param {number} start - Supplies the value returned when amount is zero.
 * @param {number} endValue - Supplies the value returned when amount is one.
 * @param {number} amount - Supplies the interpolation amount.
 * @returns {number} - The interpolated value.
 */
function lerp(start, endValue, amount) {
	return start + (endValue - start) * amount;
}

/**
 * Called by this module to format a number using deterministic precision and trimming options. It returns the value from the first satisfied branch, otherwise the operation's final fallback.
 *
 * @param {number} value - Supplies the value to format.
 * @param {NumberFormatOptions} [options] - Supplies call-local formatting
 * behavior.
 * @returns {string} - The formatted number.
 */
function formatNumber(value, options = {}) {
	const precision = options.precision ?? 6;
	const formatted = value.toFixed(precision);

	if (options.trim === false) {
		return formatted;
	}

	return formatted.includes('.') ? formatted.replace(/\.?0+$/, '') : formatted;
}

/** General scalar arithmetic, range, comparison, and formatting operations. */
export default {
	clamp,
	formatNumber,
	inRange,
	isFiniteNumber,
	lerp,
	nearlyEqual,
	wrap,
};
