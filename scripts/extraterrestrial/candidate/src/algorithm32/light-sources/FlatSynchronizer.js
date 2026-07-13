import AngleMath from '../utils/AngleMath.js';
import { durationInSeconds } from '../utils/durationValues.js';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 24 * 60 * 60;
const MINUTES_PER_DAY = 24 * 60;
const DEGREES_PER_ORBIT = 360;
const RADIANS_PER_DEGREE = Math.PI / 180;

/**
 * Resolve a positive modulo.
 *
 * @param {number} value - Supplies the value.
 * @param {number} divisor - Supplies the divisor.
 * @returns {number} The positive modulo result.
 */
function positiveModulo(value, divisor) {
	return ((value % divisor) + divisor) % divisor;
}

/**
 * Normalize an angle to `[-180, 180)`.
 *
 * @param {number} longitudeDegrees - Supplies the longitude in degrees.
 * @returns {number} The normalized longitude.
 */
function normalizeLongitude(longitudeDegrees) {
	const normalized = positiveModulo(longitudeDegrees + 180, DEGREES_PER_ORBIT) - 180;

	return Object.is(normalized, -0) ? 0 : normalized;
}

/**
 * Create a synchronized position packet.
 *
 * @param {{ mode: "world" | "closest", startLatitude: Angle, startLongitude: Angle, startTime: string, orbitAngle: Angle, elapsed: Duration }} request -
 * Supplies the position facts.
 * @returns {FlatSynchronizedPosition} The synchronized position packet.
 */
function createPositionPacket(request) {
	const startLongitudeDegrees = AngleMath.toDegrees(request.startLongitude);
	const orbitAngleDegrees = AngleMath.toDegrees(request.orbitAngle);
	const longitudeDegrees = normalizeLongitude(startLongitudeDegrees - orbitAngleDegrees);

	return {
		mode: request.mode,
		latitude: request.startLatitude,
		longitude: AngleMath.inDegrees(longitudeDegrees),
		startLatitude: request.startLatitude,
		startLongitude: request.startLongitude,
		startTime: request.startTime,
		orbitAngle: request.orbitAngle,
		elapsed: request.elapsed,
		orbitPeriod: durationInSeconds(SECONDS_PER_DAY),
	};
}

/**
 * Check whether a year is a leap year.
 *
 * @param {number} year - Supplies the year.
 * @returns {boolean} True when the year has 366 days.
 */
function isLeapYear(year) {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * Resolve a UTC day-of-year number.
 *
 * @param {Date} time - Supplies a UTC instant.
 * @returns {number} The one-based UTC day of year.
 */
function utcDayOfYear(time) {
	const start = Date.UTC(time.getUTCFullYear(), 0, 1);
	const current = Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());

	return Math.floor((current - start) / MILLISECONDS_PER_DAY) + 1;
}

/**
 * Resolve the NOAA-style fractional year angle for the UTC instant.
 *
 * @param {Date} time - Supplies a UTC instant.
 * @returns {number} The fractional year angle in radians.
 */
function fractionalYearRadians(time) {
	const dayOfYear = utcDayOfYear(time);
	const hour = time.getUTCHours()
		+ time.getUTCMinutes() / 60
		+ time.getUTCSeconds() / 3600
		+ time.getUTCMilliseconds() / 3600000;
	const yearDays = isLeapYear(time.getUTCFullYear()) ? 366 : 365;

	return 2 * Math.PI / yearDays * (dayOfYear - 1 + (hour - 12) / 24);
}

/**
 * Approximate solar declination for a fractional-year angle.
 *
 * @param {number} gamma - Supplies the fractional year angle in radians.
 * @returns {number} The solar declination in degrees.
 */
function solarDeclinationDegrees(gamma) {
	return (
		0.006918
		- 0.399912 * Math.cos(gamma)
		+ 0.070257 * Math.sin(gamma)
		- 0.006758 * Math.cos(2 * gamma)
		+ 0.000907 * Math.sin(2 * gamma)
		- 0.002697 * Math.cos(3 * gamma)
		+ 0.00148 * Math.sin(3 * gamma)
	) / RADIANS_PER_DEGREE;
}

/**
 * Approximate the equation of time.
 *
 * @param {number} gamma - Supplies the fractional year angle in radians.
 * @returns {number} The equation of time in minutes.
 */
function equationOfTime(gamma) {
	return 229.18 * (
		0.000075
		+ 0.001868 * Math.cos(gamma)
		- 0.032077 * Math.sin(gamma)
		- 0.014615 * Math.cos(2 * gamma)
		- 0.040849 * Math.sin(2 * gamma)
	);
}

/**
 * Create the UTC world anchor for the target date.
 *
 * @param {Date} targetTime - Supplies the target instant.
	 * @returns {{ startLatitude: Angle, startLongitude: Angle, startTime: Date }}
 * The world anchor packet.
 */
function createWorldAnchor(targetTime) {
	const dateNoonUtc = new Date(Date.UTC(
		targetTime.getUTCFullYear(),
		targetTime.getUTCMonth(),
		targetTime.getUTCDate(),
		12,
		0,
		0,
		0,
	));
	const gamma = fractionalYearRadians(dateNoonUtc);
	const startLatitude = solarDeclinationDegrees(gamma);
	const equationOfTimeMinutes = equationOfTime(gamma);
	const solarNoonUtcMinutes = MINUTES_PER_DAY / 2 - equationOfTimeMinutes;
	const startTime = new Date(Date.UTC(
		targetTime.getUTCFullYear(),
		targetTime.getUTCMonth(),
		targetTime.getUTCDate(),
		0,
		0,
		0,
		0,
	) + solarNoonUtcMinutes * 60 * 1000);

	return {
		startLatitude: AngleMath.inDegrees(startLatitude),
		startLongitude: AngleMath.inDegrees(0),
		startTime,
	};
}

/**
 * Convert one canonical ISO timestamp into a Date.
 *
 * @param {string} value - Supplies the ISO timestamp.
 * @param {string} errorMessage - Supplies the failure message.
 * @returns {Date} The resolved Date.
 */
function dateFromIsoTimestamp(value, errorMessage) {
	if (typeof value !== 'string') {
		throw new TypeError(errorMessage);
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
		throw new TypeError(errorMessage);
	}

	return date;
}

/**
 * Resolve a closest-approach latitude/longitude packet.
 *
 * @param {{ latitude: Angle, longitude: Angle }} value -
 * Supplies the closest-approach point.
 * @returns {readonly [number, number]} The latitude/longitude in degrees.
 */
function closestPointFrom(value) {
	AngleMath.assertAngle(value?.latitude, 'FlatSynchronizer closest latitude');
	AngleMath.assertAngle(value?.longitude, 'FlatSynchronizer closest longitude');
	const latitudeDegrees = AngleMath.toDegrees(value.latitude);
	const longitudeDegrees = AngleMath.toDegrees(value.longitude);

	return [
		latitudeDegrees,
		normalizeLongitude(longitudeDegrees),
	];
}

/**
 * Resolve flat-world Sun synchronization facts for app-owned local Sun setup.
 */
export class FlatSynchronizer {
	/**
	 * Store the selected calibration mode.
	 *
	 * @type {string | null}
	 */
	_calibrationMode = null;

	/**
	 * Fail loudly when position resolution is requested before calibration.
	 *
	 * @returns {void}
	 */
	_assertWorldMode() {
		if (this._calibrationMode !== 'world') {
			throw new Error('FlatSynchronizer.getPosition requires calibrateToWorld() first.');
		}
	}

	/**
	 * Select world-synchronized calibration.
	 *
	 * @returns {FlatSynchronizer} This synchronizer for chaining.
	 */
	calibrateToWorld() {
		this._calibrationMode = 'world';

		return this;
	}

	/**
	 * Resolve the synchronized flat Sun latitude/longitude for an instant.
	 *
	 * World mode anchors the daily orbit at the latitude where the standard Sun
	 * is overhead for the UTC date and longitude `0`. The anchor time is
	 * Greenwich apparent solar noon, estimated with the equation of time. The
	 * returned longitude then follows one clockwise 24-hour orbit from that
	 * anchor.
	 *
	 * @param {string} time - Supplies the target instant as an ISO timestamp.
	 * @returns {FlatSynchronizedPosition} The synchronized position packet.
	 */
	getPosition(time) {
		this._assertWorldMode();
		const targetTime = dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getPosition requires a valid ISO timestamp.',
		);
		const anchor = createWorldAnchor(targetTime);
		const elapsedMilliseconds = targetTime.getTime() - anchor.startTime.getTime();
		const orbitAngleDegrees = positiveModulo(
			elapsedMilliseconds / MILLISECONDS_PER_DAY * DEGREES_PER_ORBIT,
			DEGREES_PER_ORBIT,
		);

		return createPositionPacket({
			mode: 'world',
			startLatitude: anchor.startLatitude,
			startLongitude: anchor.startLongitude,
			startTime: anchor.startTime.toISOString(),
			orbitAngle: AngleMath.inDegrees(orbitAngleDegrees),
			elapsed: durationInSeconds(elapsedMilliseconds / MILLISECONDS_PER_SECOND),
		});
	}

	/**
	 * Resolve a position from a supplied closest-approach point and orbit angle.
	 *
	 * The supplied latitude/longitude identifies the closest-approach point.
	 * The returned longitude applies the same clockwise orbit convention as
	 * world mode, so positive angles move west from the closest longitude.
	 *
	 * @param {string} time - Supplies the target instant as an ISO timestamp.
	 * @param {{ latitude: Angle, longitude: Angle }} latLon -
	 * Supplies the closest-approach latitude/longitude.
	 * @param {Angle} angle - Supplies the clockwise orbit angle.
	 * @returns {FlatSynchronizedPosition} The synchronized position packet.
	 */
	getPositionFromClosest(time, latLon, angle) {
		const targetTime = dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getPositionFromClosest requires a valid ISO timestamp.',
		);
		const [closestLatitudeDegrees, closestLongitudeDegrees] = closestPointFrom(latLon);
		AngleMath.assertAngle(angle, 'FlatSynchronizer.getPositionFromClosest angle');
		const orbitAngleDegrees = positiveModulo(
			AngleMath.toDegrees(angle),
			DEGREES_PER_ORBIT,
		);
		const elapsedMilliseconds = orbitAngleDegrees / DEGREES_PER_ORBIT * MILLISECONDS_PER_DAY;

		return createPositionPacket({
			mode: 'closest',
			startLatitude: AngleMath.inDegrees(closestLatitudeDegrees),
			startLongitude: AngleMath.inDegrees(closestLongitudeDegrees),
			startTime: targetTime.toISOString(),
			orbitAngle: AngleMath.inDegrees(orbitAngleDegrees),
			elapsed: durationInSeconds(elapsedMilliseconds / MILLISECONDS_PER_SECOND),
		});
	}

	/**
	 * Resolve the orbit time from a date, closest-approach point, and angle.
	 *
	 * The supplied time provides the date used for the world seasonal latitude
	 * and Greenwich solar-noon anchor. The supplied longitude identifies when
	 * the flat Sun is closest to that location. The angle then offsets from that
	 * closest approach on the same clockwise 24-hour orbit.
	 *
	 * @param {string} time - Supplies the date basis as an ISO timestamp.
	 * @param {{ latitude: Angle, longitude: Angle }} latLon -
	 * Supplies the closest-approach latitude/longitude.
	 * @param {Angle} angle - Supplies the clockwise orbit angle.
	 * @returns {string} The resolved orbit time as an ISO timestamp.
	 */
	getTimeFromClosest(time, latLon, angle) {
		const closestTime = dateFromIsoTimestamp(
			time,
			'FlatSynchronizer.getTimeFromClosest requires a valid ISO timestamp.',
		);
		const [, closestLongitudeDegrees] = closestPointFrom(latLon);
		const anchor = createWorldAnchor(closestTime);
		AngleMath.assertAngle(angle, 'FlatSynchronizer.getTimeFromClosest angle');
		const orbitAngleDegrees = positiveModulo(
			AngleMath.toDegrees(angle) - closestLongitudeDegrees,
			DEGREES_PER_ORBIT,
		);
		const elapsedMilliseconds = orbitAngleDegrees / DEGREES_PER_ORBIT * MILLISECONDS_PER_DAY;

		return new Date(anchor.startTime.getTime() + elapsedMilliseconds).toISOString();
	}
}
