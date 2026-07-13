/** Canonical B1 capture times. */
export const CAPTURE_TIMES = Object.freeze(
	Array.from({length: 17}, (_, index) => {
		const minutes = 9 * 60 + 30 + index * 15;
		return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	}),
);

/** Canonical B1 spectral-coordinate contract. */
export const SPECTRUM = Object.freeze({
	size: 40,
	minimumNm: 360,
	maximumNm: 830,
	spacingNm: (830 - 360) / 40,
	scoreMinimumNm: 360,
	scoreMaximumNm: 720,
	scoreSampleCount: 31,
	sourceMinimumNm: 350,
	sourceMaximumNm: 2500,
	sourceSampleCount: 2151,
});

/**
 * Called by sample-direction construction to map one square coordinate to the unit disk.
 *
 * @param {number} horizontalCoordinate - The normalized horizontal coordinate.
 * @param {number} verticalCoordinate - The normalized vertical coordinate.
 * @returns {{radius: number, azimuth: number}} - The concentric-disk coordinate.
 */
function toUnitDisk(horizontalCoordinate, verticalCoordinate) {
	const horizontal = 2 * horizontalCoordinate - 1;
	const vertical = 2 * verticalCoordinate - 1;
	let radius;
	let azimuth;
	if (horizontal > -vertical) {
		if (horizontal > vertical) {
			radius = horizontal;
			azimuth = (Math.PI / 4) * (vertical / horizontal);
		} else {
			radius = vertical;
			azimuth = (Math.PI / 4) * (2 - horizontal / vertical);
		}
	} else if (horizontal < vertical) {
		radius = -horizontal;
		azimuth = (Math.PI / 4) * (4 + vertical / horizontal);
	} else {
		radius = -vertical;
		azimuth = vertical !== 0 ? (Math.PI / 4) * (6 - horizontal / vertical) : 0;
	}
	return {radius, azimuth};
}

/**
 * Call this function to resolve one canonical B1 sample direction.
 *
 * @param {number} gridX - The horizontal grid coordinate.
 * @param {number} gridY - The vertical grid coordinate.
 * @returns {{zenithRadians: number, azimuthRadians: number, zenithDegrees: number, azimuthDegrees: number}} - The sample direction angles.
 */
export function getSampleDirection(gridX, gridY) {
	if (![gridX, gridY].every((value) => Number.isInteger(value) && value >= 0 && value < 9)) {
		throw new RangeError('Direction grid coordinates must be integers from 0 through 8.');
	}
	const {radius, azimuth} = toUnitDisk((gridX + 0.5) / 9, (gridY + 0.5) / 9);
	const zenith = Math.acos(1 - radius * radius);
	return Object.freeze({
		zenithRadians: zenith,
		azimuthRadians: azimuth,
		zenithDegrees: (zenith * 180) / Math.PI,
		azimuthDegrees: (azimuth * 180) / Math.PI,
	});
}

/**
 * Call this function to reproduce Bruneton's retained solar-vector calculation for one B1 capture time.
 *
 * @param {string} time - The local EDT capture time.
 * @returns {{utcTime: string, zenithDegrees: number, theoreticalAzimuthDegrees: number}} - The theoretical solar direction.
 */
export function computeTheoreticalSunDirection(time) {
	const [localHour, minutes] = time.split(':').map(Number);
	const year = 2013;
	const month = 5;
	const day = 27;
	const utcHour = localHour + 4;
	const decimalHours = utcHour + minutes / 60;
	const auxiliaryOne = Math.trunc((month - 14) / 12);
	const auxiliaryTwo =
		Math.trunc((1461 * (year + 4800 + auxiliaryOne)) / 4) +
		Math.trunc((367 * (month - 2 - 12 * auxiliaryOne)) / 12) -
		Math.trunc((3 * Math.trunc((year + 4900 + auxiliaryOne) / 100)) / 4) +
		day -
		32075;
	const elapsedJulianDays = Number(auxiliaryTwo) - 0.5 + decimalHours / 24 - 2451545;
	const omega = 2.1429 - 0.0010394594 * elapsedJulianDays;
	const meanLongitude = 4.895063 + 0.017202791698 * elapsedJulianDays;
	const meanAnomaly = 6.24006 + 0.0172019699 * elapsedJulianDays;
	const eclipticLongitude =
		meanLongitude +
		0.03341607 * Math.sin(meanAnomaly) +
		0.00034894 * Math.sin(2 * meanAnomaly) -
		0.0001134 -
		0.0000203 * Math.sin(omega);
	const eclipticObliquity = 0.4090928 - 6.214e-9 * elapsedJulianDays + 0.0000396 * Math.cos(omega);
	const sinEclipticLongitude = Math.sin(eclipticLongitude);
	let rightAscension = Math.atan2(Math.cos(eclipticObliquity) * sinEclipticLongitude, Math.cos(eclipticLongitude));
	if (rightAscension < 0) rightAscension += 2 * Math.PI;
	const declination = Math.asin(Math.sin(eclipticObliquity) * sinEclipticLongitude);
	const meanSiderealTime = 6.6974243242 + 0.0657098283 * elapsedJulianDays + decimalHours;
	const longitudeDegrees = -76.48163;
	const latitudeRadians = (42.44337 * Math.PI) / 180;
	const localMeanSiderealTime = ((meanSiderealTime * 15 + longitudeDegrees) * Math.PI) / 180;
	const hourAngle = localMeanSiderealTime - rightAscension;
	let zenith = Math.acos(
		Math.cos(latitudeRadians) * Math.cos(hourAngle) * Math.cos(declination) +
			Math.sin(declination) * Math.sin(latitudeRadians),
	);
	let azimuth = Math.atan2(
		-Math.sin(hourAngle),
		Math.tan(declination) * Math.cos(latitudeRadians) - Math.sin(latitudeRadians) * Math.cos(hourAngle),
	);
	if (azimuth < 0) azimuth += 2 * Math.PI;
	zenith += (6371.01 / 149597890) * Math.sin(zenith);
	return Object.freeze({
		utcTime: `${String(utcHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
		zenithDegrees: (zenith * 180) / Math.PI,
		theoreticalAzimuthDegrees: (azimuth * 180) / Math.PI,
	});
}
