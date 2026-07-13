import {
	STELLAR_CATALOG_FRAME_ID,
	STELLAR_LOCAL_FRAME_ID,
	STELLAR_TIME_MODEL_ID,
	requireFiniteNumber,
	requireUnitDirection,
} from './contracts.js';

const J2000_JULIAN_DATE = 2451545.0;
const DAYS_PER_JULIAN_CENTURY = 36525;
const ARCSECONDS_TO_RADIANS = Math.PI / (180 * 3600);
const TWO_PI = 2 * Math.PI;

function normalizeRadians(value) {
	const remainder = value % TWO_PI;
	return remainder < 0 ? remainder + TWO_PI : remainder;
}

function julianDateFromUtcInstant(instant) {
	if (typeof instant !== 'string') {
		throw new TypeError('Observation instant must be an ISO-8601 string.');
	}
	const milliseconds = Date.parse(instant);
	if (!Number.isFinite(milliseconds)) {
		throw new RangeError(`Observation instant is invalid: ${instant}`);
	}
	return milliseconds / 86400000 + 2440587.5;
}

function directionFromRightAscensionDeclination(rightAscension, declination) {
	const cosineDeclination = Math.cos(declination);
	return Object.freeze([
		cosineDeclination * Math.cos(rightAscension),
		cosineDeclination * Math.sin(rightAscension),
		Math.sin(declination),
	]);
}

function rightAscensionDeclinationFromDirection(direction) {
	const accepted = requireUnitDirection(direction, 'catalog direction');
	return Object.freeze({
		rightAscensionRadians: normalizeRadians(Math.atan2(accepted[1], accepted[0])),
		declinationRadians: Math.asin(Math.max(-1, Math.min(1, accepted[2]))),
	});
}

/**
 * Precess an FK5/J2000 mean direction to the mean equator and equinox of date.
 *
 * This contained implementation uses the IAU 2000 three-angle polynomial from
 * USNO Circular 179, equation 5.11. It is a deliberately mean-place transform:
 * nutation, aberration, proper motion, and refraction are outside this profile.
 */
export function precessFk5J2000ToMeanOfDate(direction, julianDateTtApproximation) {
	requireFiniteNumber(julianDateTtApproximation, 'Approximate TT Julian date');
	const {rightAscensionRadians, declinationRadians} =
		rightAscensionDeclinationFromDirection(direction);
	const t = (julianDateTtApproximation - J2000_JULIAN_DATE)
		/ DAYS_PER_JULIAN_CENTURY;
	const t2 = t * t;
	const t3 = t2 * t;
	const t4 = t3 * t;
	const t5 = t4 * t;
	const zeta = (
		2.650545
		+ 2306.083227 * t
		+ 0.2988499 * t2
		+ 0.01801828 * t3
		- 0.000005971 * t4
		- 0.0000003173 * t5
	) * ARCSECONDS_TO_RADIANS;
	const z = (
		-2.650545
		+ 2306.077181 * t
		+ 1.0927348 * t2
		+ 0.01826837 * t3
		- 0.000028596 * t4
		- 0.0000002904 * t5
	) * ARCSECONDS_TO_RADIANS;
	const theta = (
		2004.191903 * t
		- 0.4294934 * t2
		- 0.04182264 * t3
		- 0.000007089 * t4
		- 0.0000001274 * t5
	) * ARCSECONDS_TO_RADIANS;
	const shiftedRightAscension = rightAscensionRadians + zeta;
	const a = Math.cos(declinationRadians) * Math.sin(shiftedRightAscension);
	const b = Math.cos(theta) * Math.cos(declinationRadians)
		* Math.cos(shiftedRightAscension)
		- Math.sin(theta) * Math.sin(declinationRadians);
	const c = Math.sin(theta) * Math.cos(declinationRadians)
		* Math.cos(shiftedRightAscension)
		+ Math.cos(theta) * Math.sin(declinationRadians);
	return directionFromRightAscensionDeclination(
		normalizeRadians(Math.atan2(a, b) + z),
		Math.asin(Math.max(-1, Math.min(1, c))),
	);
}

/** Greenwich mean sidereal time using the USNO Circular 179 approximation. */
export function greenwichMeanSiderealTimeRadians(julianDateUtcAsUt1) {
	requireFiniteNumber(julianDateUtcAsUt1, 'UTC-as-UT1 Julian date');
	const julianDateZeroHours = Math.floor(julianDateUtcAsUt1 - 0.5) + 0.5;
	const hoursSinceZero = (julianDateUtcAsUt1 - julianDateZeroHours) * 24;
	const daysAtZero = julianDateZeroHours - J2000_JULIAN_DATE;
	const centuries = (julianDateUtcAsUt1 - J2000_JULIAN_DATE)
		/ DAYS_PER_JULIAN_CENTURY;
	const gmstHours = 6.697375
		+ 0.065707485828 * daysAtZero
		+ 1.0027379 * hoursSinceZero
		+ 0.0854103 * centuries
		+ 0.0000258 * centuries * centuries;
	return normalizeRadians(gmstHours * Math.PI / 12);
}

export function equatorialMeanOfDateToLocalEnu(
	meanOfDateDirection,
	observerLatitudeRadians,
	localMeanSiderealTimeRadians,
) {
	const accepted = requireUnitDirection(meanOfDateDirection, 'mean-of-date direction');
	requireFiniteNumber(observerLatitudeRadians, 'Observer latitude');
	requireFiniteNumber(localMeanSiderealTimeRadians, 'Local mean sidereal time');
	if (observerLatitudeRadians < -Math.PI / 2 || observerLatitudeRadians > Math.PI / 2) {
		throw new RangeError('Observer latitude is outside [-pi/2, pi/2].');
	}
	const rightAscension = Math.atan2(accepted[1], accepted[0]);
	const declination = Math.asin(Math.max(-1, Math.min(1, accepted[2])));
	const hourAngle = normalizeRadians(localMeanSiderealTimeRadians - rightAscension);
	const cosineDeclination = Math.cos(declination);
	const east = -cosineDeclination * Math.sin(hourAngle);
	const north = Math.sin(declination) * Math.cos(observerLatitudeRadians)
		- cosineDeclination * Math.cos(hourAngle) * Math.sin(observerLatitudeRadians);
	const up = Math.sin(declination) * Math.sin(observerLatitudeRadians)
		+ cosineDeclination * Math.cos(hourAngle) * Math.cos(observerLatitudeRadians);
	const length = Math.hypot(east, north, up);
	return Object.freeze([east / length, north / length, up / length]);
}

export function resolveCatalogDirectionAtObservation({
	direction,
	catalogFrameId,
	observation,
}) {
	if (catalogFrameId !== STELLAR_CATALOG_FRAME_ID) {
		throw new RangeError(`Unsupported stellar catalog frame: ${catalogFrameId}`);
	}
	if (observation === null || typeof observation !== 'object') {
		throw new TypeError('Stellar observation is required.');
	}
	const latitudeRadians = requireFiniteNumber(
		observation.latitudeRadians,
		'Observation latitude',
	);
	const longitudeRadians = requireFiniteNumber(
		observation.longitudeRadians,
		'Observation longitude',
	);
	if (longitudeRadians < -Math.PI || longitudeRadians > Math.PI) {
		throw new RangeError('Observation longitude is outside [-pi, pi].');
	}
	const julianDate = julianDateFromUtcInstant(observation.instant);
	const meanOfDateDirection = precessFk5J2000ToMeanOfDate(direction, julianDate);
	const greenwichMeanSiderealTime = greenwichMeanSiderealTimeRadians(julianDate);
	const localMeanSiderealTime = normalizeRadians(
		greenwichMeanSiderealTime + longitudeRadians,
	);
	const localDirection = equatorialMeanOfDateToLocalEnu(
		meanOfDateDirection,
		latitudeRadians,
		localMeanSiderealTime,
	);
	return Object.freeze({
		catalogFrameId,
		localFrameId: STELLAR_LOCAL_FRAME_ID,
		timeModelId: STELLAR_TIME_MODEL_ID,
		julianDateUtcAsUt1: julianDate,
		julianDateTtApproximation: julianDate,
		greenwichMeanSiderealTimeRadians: greenwichMeanSiderealTime,
		localMeanSiderealTimeRadians: localMeanSiderealTime,
		meanOfDateDirection,
		localDirectionEastNorthUp: localDirection,
	});
}

export const _test = Object.freeze({
	directionFromRightAscensionDeclination,
	julianDateFromUtcInstant,
	normalizeRadians,
});
