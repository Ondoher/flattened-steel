/**
 * Call this function to validate clock parts independently of date, location, and time zone.
 *
 * @param {ClockTime} time - Clock parts to validate.
 * @returns {boolean} - Whether hour and minute are within a 24-hour clock.
 */
export function isClockTime({hour, minute}) {
	return Number.isInteger(hour) && hour >= 0 && hour < 24 && Number.isInteger(minute) && minute >= 0 && minute < 60;
}

/**
 * Call this function to parse the canonical 24-hour HH:mm text representation.
 *
 * @param {string} text - Time text using HH:mm.
 * @returns {ClockTime|null} - Valid clock parts, or null for incomplete or invalid input.
 */
export function parseClockTime(text) {
	let parts = /^(\d{2}):(\d{2})$/.exec(text.trim());
	if (!parts) {
		return null;
	}
	let time = {hour: Number(parts[1]), minute: Number(parts[2])};
	return isClockTime(time) ? time : null;
}

/**
 * Call this function to format accepted clock parts without time-zone conversion.
 *
 * @param {ClockTime} time - Accepted 24-hour clock value.
 * @returns {string} - HH:mm text.
 */
export function formatClockTime({hour, minute}) {
	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
