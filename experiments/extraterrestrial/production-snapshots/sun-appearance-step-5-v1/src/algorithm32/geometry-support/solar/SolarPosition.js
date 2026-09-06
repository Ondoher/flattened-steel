import AngleMath from '../../math/AngleMath.js';

/** Milliseconds in one mean solar day. */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
/** Minutes in one mean solar day. */
const MINUTES_PER_DAY = 24 * 60;
/** Degrees in one complete orbit. */
const DEGREES_PER_ORBIT = 360;
/** Radians represented by one degree. */
const RADIANS_PER_DEGREE = Math.PI / 180;

/**
 * Called by SolarPosition to normalize an angular cycle to a positive value.
 *
 * @param {number} value - The angular value.
 * @param {number} divisor - The complete cycle.
 * @returns {number} - The normalized value.
 */
function positiveModulo(value, divisor) {
	return ((value % divisor) + divisor) % divisor;
}

/**
 * Called by SolarPosition to normalize longitude to `[-180, 180)`.
 *
 * @param {number} longitudeDegrees - The longitude in degrees.
 * @returns {number} - The canonical longitude in degrees.
 */
function normalizeLongitudeDegrees(longitudeDegrees) {
	const normalizedLongitude = positiveModulo(longitudeDegrees + 180, DEGREES_PER_ORBIT) - 180;

	return Object.is(normalizedLongitude, -0) ? 0 : normalizedLongitude;
}

/**
 * Called by SolarPosition to require an exact canonical UTC instant.
 *
 * @param {string} instant - The candidate ISO-8601 instant.
 * @returns {Date} - The accepted UTC date.
 * @throws {TypeError} - When the instant is not exact canonical ISO-8601 UTC.
 */
function dateFromCanonicalInstant(instant) {
	if (typeof instant !== 'string') {
		throw new TypeError('SolarPosition requires an exact canonical ISO-8601 UTC instant.');
	}
	const date = new Date(instant);
	if (Number.isNaN(date.getTime()) || date.toISOString() !== instant) {
		throw new TypeError('SolarPosition requires an exact canonical ISO-8601 UTC instant.');
	}

	return date;
}

/**
 * Called by SolarPosition to determine whether one Gregorian year is a leap year.
 *
 * @param {number} year - The UTC year.
 * @returns {boolean} - Whether the year contains 366 days.
 */
function isLeapYear(year) {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Called by SolarPosition to resolve the one-based UTC day of year.
 *
 * @param {Date} date - The accepted UTC instant.
 * @returns {number} - The one-based day of year.
 */
function utcDayOfYear(date) {
	const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
	const dateStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

	return Math.floor((dateStart - yearStart) / MILLISECONDS_PER_DAY) + 1;
}

/**
 * Called by SolarPosition to resolve the retained NOAA-style fractional-year angle.
 *
 * @param {Date} date - The accepted UTC instant.
 * @returns {number} - The fractional-year angle in radians.
 */
function fractionalYearRadians(date) {
	const dayOfYear = utcDayOfYear(date);
	const fractionalHour =
		date.getUTCHours() +
		date.getUTCMinutes() / 60 +
		date.getUTCSeconds() / 3600 +
		date.getUTCMilliseconds() / 3600000;
	const daysInYear = isLeapYear(date.getUTCFullYear()) ? 366 : 365;

	return ((2 * Math.PI) / daysInYear) * (dayOfYear - 1 + (fractionalHour - 12) / 24);
}

/**
 * Called by SolarPosition to approximate solar declination with the retained production formula.
 *
 * @param {number} fractionalYearAngle - The fractional-year angle in radians.
 * @returns {number} - The declination in degrees.
 */
function solarDeclinationDegrees(fractionalYearAngle) {
	return (
		(0.006918 -
			0.399912 * Math.cos(fractionalYearAngle) +
			0.070257 * Math.sin(fractionalYearAngle) -
			0.006758 * Math.cos(2 * fractionalYearAngle) +
			0.000907 * Math.sin(2 * fractionalYearAngle) -
			0.002697 * Math.cos(3 * fractionalYearAngle) +
			0.00148 * Math.sin(3 * fractionalYearAngle)) /
		RADIANS_PER_DEGREE
	);
}

/**
 * Called by SolarPosition to approximate the equation of time with the retained production formula.
 *
 * @param {number} fractionalYearAngle - The fractional-year angle in radians.
 * @returns {number} - The equation of time in minutes.
 */
function equationOfTimeMinutes(fractionalYearAngle) {
	return (
		229.18 *
		(0.000075 +
			0.001868 * Math.cos(fractionalYearAngle) -
			0.032077 * Math.sin(fractionalYearAngle) -
			0.014615 * Math.cos(2 * fractionalYearAngle) -
			0.040849 * Math.sin(2 * fractionalYearAngle))
	);
}

/** Shared standard-Sun geographic position operations. */
export const SolarPosition = {
	/**
	 * Call this method to resolve the Greenwich apparent-solar-noon anchor for an instant's UTC date.
	 *
	 * @param {string} instant - The exact canonical UTC instant.
	 * @returns {SolarWorldAnchor} - The date's world solar anchor.
	 */
	resolveWorldAnchor(instant) {
		const targetDate = dateFromCanonicalInstant(instant);
		const noonUtc = new Date(
			Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 12),
		);
		const fractionalYearAngle = fractionalYearRadians(noonUtc);
		const declinationDegrees = solarDeclinationDegrees(fractionalYearAngle);
		const solarNoonUtcMinutes = MINUTES_PER_DAY / 2 - equationOfTimeMinutes(fractionalYearAngle);
		const anchorMilliseconds =
			Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()) +
			solarNoonUtcMinutes * 60 * 1000;

		return {
			latitude: AngleMath.inDegrees(declinationDegrees),
			longitude: AngleMath.inDegrees(0),
			instant: new Date(anchorMilliseconds).toISOString(),
		};
	},

	/**
	 * Call this method to resolve the approximate subsolar geographic location for one instant.
	 *
	 * @param {string} instant - The exact canonical UTC instant.
	 * @returns {GeographicLocation} - The subsolar latitude and longitude.
	 */
	resolveSubsolarLocation(instant) {
		const targetDate = dateFromCanonicalInstant(instant);
		const anchor = this.resolveWorldAnchor(instant);
		const elapsedMilliseconds = targetDate.getTime() - new Date(anchor.instant).getTime();
		const orbitAngleDegrees = positiveModulo(
			(elapsedMilliseconds / MILLISECONDS_PER_DAY) * DEGREES_PER_ORBIT,
			DEGREES_PER_ORBIT,
		);

		return {
			latitude: anchor.latitude,
			longitude: AngleMath.inDegrees(normalizeLongitudeDegrees(-orbitAngleDegrees)),
		};
	},
};
