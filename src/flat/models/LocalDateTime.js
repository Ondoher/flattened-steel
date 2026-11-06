/**
 * Call this function to interpret validated entry parts in the device's local time zone.
 * Native Date resolution applies at clock changes until explicit time-zone policy is introduced.
 *
 * @param {CalendarDate} date - Valid Gregorian calendar date.
 * @param {ClockTime} time - Valid minute-precision clock time.
 * @returns {EpochTimestamp} - Milliseconds since the Unix epoch, with seconds and milliseconds cleared.
 */
export function toLocalTimestamp({year, month, day}, {hour, minute}) {
	let value = new Date(0);
	value.setFullYear(year, month - 1, day);
	value.setHours(hour, minute, 0, 0);
	return value.getTime();
}

/**
 * Call this function to derive editable calendar and clock parts from the shared instant.
 *
 * @param {EpochTimestamp} timestamp - Milliseconds since the Unix epoch.
 * @returns {LocalDateTimeParts} - Device-local parts for presentation without changing the stored timestamp.
 */
export function getLocalDateTimeParts(timestamp) {
	let value = new Date(timestamp);
	return {
		date: {year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate()},
		time: {hour: value.getHours(), minute: value.getMinutes()},
	};
}
