/**
 * Call this function to validate Gregorian calendar parts without converting them to an instant.
 *
 * @param {CalendarDate} date - Calendar parts to validate.
 * @returns {boolean} - Whether the date exists within years 1 through 9999.
 */
export function isCalendarDate({year, month, day}) {
	if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) {
		return false;
	}
	let leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	let days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	return Number.isInteger(day) && day >= 1 && day <= days[month - 1];
}

/**
 * Call this function to parse the canonical YYYY-MM-DD text representation.
 *
 * @param {string} text - Date text using YYYY-MM-DD.
 * @returns {CalendarDate|null} - Valid calendar parts, or null for incomplete or invalid input.
 */
export function parseCalendarDate(text) {
	let parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
	if (!parts) {
		return null;
	}
	let date = {year: Number(parts[1]), month: Number(parts[2]), day: Number(parts[3])};
	return isCalendarDate(date) ? date : null;
}

/**
 * Call this function to format calendar parts as canonical YYYY-MM-DD text.
 *
 * @param {CalendarDate} date - Accepted Gregorian calendar date.
 * @returns {string} - YYYY-MM-DD text without locale or time-zone interpretation.
 */
export function formatCalendarDate({year, month, day}) {
	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
