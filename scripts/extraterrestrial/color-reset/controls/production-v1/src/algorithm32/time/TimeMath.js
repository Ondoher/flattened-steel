/**
 * Called by this module to create one duration packet from seconds.
 *
 * @param {number} value - The elapsed seconds.
 * @returns {Duration} - The duration packet.
 *
 */
function durationInSeconds(value) {
	return {value, units: 'seconds'};
}

/**
 * Called by this module to convert milliseconds into a duration packet.
 *
 * @param {number} milliseconds - The elapsed milliseconds.
 * @returns {Duration} - The duration packet.
 *
 */
function durationFromMilliseconds(milliseconds) {
	return durationInSeconds(milliseconds / 1000);
}

/**
 * Called by this module to convert nanoseconds into a duration packet.
 *
 * @param {number} nanoseconds - The elapsed nanoseconds.
 * @returns {Duration} - The duration packet.
 *
 */
function durationFromNanoseconds(nanoseconds) {
	return durationInSeconds(nanoseconds / 1000000000);
}

/**
 * Called by this module to read a monotonic millisecond clock when available, with epoch milliseconds as the fallback.
 *
 * @returns {number} - The current time in milliseconds.
 *
 */
function nowMilliseconds() {
	return globalThis.performance?.now?.() ?? Date.now();
}

/** Time conversion and clock methods. */
export const TimeMath = {
	durationFromMilliseconds,
	durationFromNanoseconds,
	durationInSeconds,
	nowMilliseconds,
};
