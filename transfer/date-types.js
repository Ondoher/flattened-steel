/**
 * Use this to represents a date as three separate fields, this is not time zone
 * specific
 *
 * @typedef {Object} DateDetails
 * @property {Number} year the specified year
 * @property {Number} month the specified 1 based month
 * @property {Number} day the specified day of the month
 */

/**
 * Use this to specify a range of dates
 *
 * @typedef {Object} DateRange
 * @property {DateDetails} start the stating day of the range
 * @property {DateDetails} end the ending date of the range
 */

/**
 * Use this to specify a range of time stamps
 *
 * @typedef {Object} TimeRange
 * @property {Number} start
 * @property {Number} end
 */

/**
 * When parsing a date in a time zone, these values will be abstracted
 *
 * @typedef {Object} DateParts
 * @property {Number} year the year for the timezone
 * @property {Number} month the 1 based the month in the timezone
 * @property {Number} day the day of the month in the timezone
 * @property {Number} hour the hour in the timezone
 * @property {Number} minute the minute in the tome zone
 * @property {Number} second the seconds in the timezone
 * @property {String} separator this is the separator between date parts in a
 * short date
 * @property {String} timeZoneName a string in the form of [+-]##:## that is
 * the offset of the timezone on the date
 */

export {};
