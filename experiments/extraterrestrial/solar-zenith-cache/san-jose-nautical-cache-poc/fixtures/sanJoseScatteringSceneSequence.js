const LATITUDE_DEGREES = 37.3382;
const LONGITUDE_DEGREES = -121.8863;
const SUNSET_MILLISECONDS = Date.parse('2024-06-21T03:26:03.503Z');

function normalize(vector) {
	const length = Math.hypot(...vector);
	return vector.map((value) => value / length);
}

/** Retained NOAA-style solar direction calculation used by run 000466. */
export function calculateSanJoseSolarDirection(timeIso) {
	const latitudeRadians = LATITUDE_DEGREES * Math.PI / 180;
	const time = new Date(timeIso);
	const yearStart = Date.UTC(time.getUTCFullYear(), 0, 1);
	const dateStart = Date.UTC(
		time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());
	const dayOfYear = Math.floor((dateStart - yearStart) / 86400000) + 1;
	const utcHours = time.getUTCHours() + time.getUTCMinutes() / 60
		+ time.getUTCSeconds() / 3600 + time.getUTCMilliseconds() / 3600000;
	const gamma = 2 * Math.PI / 366
		* (dayOfYear - 1 + (utcHours - 12) / 24);
	const declination = 0.006918 - 0.399912 * Math.cos(gamma)
		+ 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma)
		+ 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma)
		+ 0.00148 * Math.sin(3 * gamma);
	const equationOfTimeMinutes = 229.18 * (0.000075
		+ 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
		- 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
	const trueSolarMinutes = ((utcHours * 60 + equationOfTimeMinutes
		+ 4 * LONGITUDE_DEGREES) % 1440 + 1440) % 1440;
	const hourAngle = (trueSolarMinutes / 4 - 180) * Math.PI / 180;
	return Object.freeze(normalize([
		Math.sin(latitudeRadians) * Math.sin(declination)
			+ Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle),
		-Math.cos(declination) * Math.sin(hourAngle),
		Math.sin(declination) * Math.cos(latitudeRadians)
			- Math.cos(declination) * Math.sin(latitudeRadians) * Math.cos(hourAngle),
	]));
}

function createScene({id, timeLabel, timeIso, direction = null}) {
	const sourceDirection = direction ?? calculateSanJoseSolarDirection(timeIso);
	return Object.freeze({
		id,
		timeLabel,
		location: Object.freeze({
			name: 'San Jose',
			latitudeDegrees: LATITUDE_DEGREES,
			longitudeDegrees: LONGITUDE_DEGREES,
		}),
		timeIso,
		directionToSourceUpEastNorth: sourceDirection,
		solarElevationDegrees: Math.asin(sourceDirection[0]) * 180 / Math.PI,
		observer: Object.freeze({
			heightMeters: 1.7,
			upDirectionUpEastNorth: Object.freeze([1, 0, 0]),
		}),
		camera: Object.freeze({
			viewAzimuthDegrees: -59.99625193137896,
			viewElevationDegrees: 5,
			verticalFieldOfViewDegrees: 78,
			viewport: Object.freeze({width: 640, height: 400}),
		}),
		parents: Object.freeze({
			timingAndCameraRunId:
				'000466-bruneton-source-luminance-lift-spherical-comparison',
		}),
	});
}

export const SAN_JOSE_SCATTERING_SCENE_SEQUENCE = Object.freeze([
	createScene({
		id: 'sunset-plus-10-minutes',
		timeLabel: '10 minutes after sunset',
		timeIso: new Date(SUNSET_MILLISECONDS + 10 * 60000).toISOString(),
	}),
	createScene({
		id: 'sunset',
		timeLabel: 'Sunset',
		timeIso: new Date(SUNSET_MILLISECONDS).toISOString(),
		direction: Object.freeze([
			0.0007345177958817672,
			-0.8659924602538107,
			0.500056516073093,
		]),
	}),
	createScene({
		id: 'sunset-minus-10-minutes',
		timeLabel: '10 minutes before sunset',
		timeIso: new Date(SUNSET_MILLISECONDS - 10 * 60000).toISOString(),
	}),
	createScene({
		id: 'sunset-minus-one-hour',
		timeLabel: 'One hour before sunset',
		timeIso: new Date(SUNSET_MILLISECONDS - 60 * 60000).toISOString(),
	}),
	createScene({
		id: 'solar-noon',
		timeLabel: 'Solar noon',
		timeIso: '2024-06-20T20:08:00.000Z',
	}),
]);

export default SAN_JOSE_SCATTERING_SCENE_SEQUENCE;
