/**
 * Create one duration packet from seconds.
 *
 * @param {number} value - Supplies elapsed seconds.
 * @returns {Duration} The duration packet.
 */
export function durationInSeconds(value) {
	return { value, units: 'seconds' };
}

/**
 * Convert milliseconds into a duration packet.
 *
 * @param {number} milliseconds - Supplies elapsed milliseconds.
 * @returns {Duration} The duration packet.
 */
export function durationFromMilliseconds(milliseconds) {
	return durationInSeconds(milliseconds / 1000);
}

/**
 * Convert nanoseconds into a duration packet.
 *
 * @param {number} nanoseconds - Supplies elapsed nanoseconds.
 * @returns {Duration} The duration packet.
 */
export function durationFromNanoseconds(nanoseconds) {
	return durationInSeconds(nanoseconds / 1000000000);
}
