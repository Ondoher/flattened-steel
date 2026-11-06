/**
 * Locale-neutral Gregorian calendar date, independent of an instant or time zone.
 */
type CalendarDate = {
	/**
	 * Gregorian year from 1 through 9999 in the first-pass editor.
	 */
	year: number;
	/**
	 * One-based month from 1 through 12.
	 */
	month: number;
	/**
	 * One-based day valid for the selected month and year.
	 */
	day: number;
};

/**
 * Locale-neutral 24-hour clock value with minute precision and no selected time zone.
 */
type ClockTime = {
	/**
	 * Hour from 0 through 23.
	 */
	hour: number;
	/**
	 * Minute from 0 through 59.
	 */
	minute: number;
};

/**
 * Absolute instant represented as integer milliseconds since 1970-01-01T00:00:00Z, as in Date.getTime().
 */
type EpochTimestamp = number;

/**
 * Derived device-local calendar and clock parts for editing or display.
 */
type LocalDateTimeParts = {
	/**
	 * Gregorian calendar date at the device's local offset for the instant.
	 */
	date: CalendarDate;
	/**
	 * Minute-precision local clock time.
	 */
	time: ClockTime;
};
