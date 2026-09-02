const MILLISECONDS_PER_DAY = 86_400_000;
const UNIX_EPOCH_JULIAN_DATE = 2_440_587.5;
const ARCSECONDS_TO_RADIANS = Math.PI / (180 * 3_600);

function clamp(value, minimum, maximum) {
	return Math.max(minimum, Math.min(maximum, value));
}

function normalizeRadians(value) {
	const normalized = value % (Math.PI * 2);
	return normalized < 0 ? normalized + Math.PI * 2 : normalized;
}

function precessCatalogDirection(catalogDirection, julianCenturiesSinceJ2000) {
	const [x, y, zValue] = catalogDirection;
	const length = Math.hypot(x, y, zValue);
	const direction = [x / length, y / length, zValue / length];
	const rightAscension = normalizeRadians(Math.atan2(direction[1], direction[0]));
	const declination = Math.asin(clamp(direction[2], -1, 1));
	const t = julianCenturiesSinceJ2000;
	const t2 = t * t;
	const t3 = t2 * t;
	const t4 = t3 * t;
	const t5 = t4 * t;
	const zeta = (2.650545 + 2306.083227 * t + 0.2988499 * t2 + 0.01801828 * t3 - 0.000005971 * t4 - 0.0000003173 * t5) * ARCSECONDS_TO_RADIANS;
	const z = (-2.650545 + 2306.077181 * t + 1.0927348 * t2 + 0.01826837 * t3 - 0.000028596 * t4 - 0.0000002904 * t5) * ARCSECONDS_TO_RADIANS;
	const theta = (2004.191903 * t - 0.4294934 * t2 - 0.04182264 * t3 - 0.000007089 * t4 - 0.0000001274 * t5) * ARCSECONDS_TO_RADIANS;
	const shiftedRightAscension = rightAscension + zeta;
	const a = Math.cos(declination) * Math.sin(shiftedRightAscension);
	const b = Math.cos(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) - Math.sin(theta) * Math.sin(declination);
	const c = Math.sin(theta) * Math.cos(declination) * Math.cos(shiftedRightAscension) + Math.cos(theta) * Math.sin(declination);
	const meanRightAscension = normalizeRadians(Math.atan2(a, b) + z);
	const meanDeclination = Math.asin(clamp(c, -1, 1));
	const cosineDeclination = Math.cos(meanDeclination);
	return [
		cosineDeclination * Math.cos(meanRightAscension),
		cosineDeclination * Math.sin(meanRightAscension),
		Math.sin(meanDeclination),
	];
}

export function cr6hCatalogDirectionToLocalEnu(catalogDirection, timeIso, location) {
	const milliseconds = Date.parse(timeIso);
	if (!Number.isFinite(milliseconds)) throw new RangeError('CR6H observation time is invalid.');
	const julianDate = milliseconds / MILLISECONDS_PER_DAY + UNIX_EPOCH_JULIAN_DATE;
	const zeroHoursJulianDate = Math.floor(julianDate - 0.5) + 0.5;
	const daysAtZeroHoursSinceJ2000 = zeroHoursJulianDate - 2_451_545;
	const hoursSinceZero = (julianDate - zeroHoursJulianDate) * 24;
	const t = (julianDate - 2_451_545) / 36_525;
	const mean = precessCatalogDirection(catalogDirection, t);
	const rightAscension = Math.atan2(mean[1], mean[0]);
	const declination = Math.asin(clamp(mean[2], -1, 1));
	const gmstHours = 6.697375 + 0.065707485828 * daysAtZeroHoursSinceJ2000 + 1.0027379 * hoursSinceZero + 0.0854103 * t + 0.0000258 * t * t;
	const localMeanSiderealTime = normalizeRadians(gmstHours * Math.PI / 12 + location.longitudeDegrees * Math.PI / 180);
	const hourAngle = normalizeRadians(localMeanSiderealTime - rightAscension);
	const latitude = location.latitudeDegrees * Math.PI / 180;
	const cosineDeclination = Math.cos(declination);
	const east = -cosineDeclination * Math.sin(hourAngle);
	const north = Math.sin(declination) * Math.cos(latitude) - cosineDeclination * Math.cos(hourAngle) * Math.sin(latitude);
	const up = Math.sin(declination) * Math.sin(latitude) + cosineDeclination * Math.cos(hourAngle) * Math.cos(latitude);
	const length = Math.hypot(east, north, up);
	return [east / length, north / length, up / length];
}

function cross(left, right) {
	return [
		left[1] * right[2] - left[2] * right[1],
		left[2] * right[0] - left[0] * right[2],
		left[0] * right[1] - left[1] * right[0],
	];
}

function normalize(vector) {
	const length = Math.hypot(...vector);
	return vector.map((value) => value / length);
}

function dot(left, right) {
	return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

export function cr6hProjectCatalogDirection(catalogDirection, scene, configuration) {
	const localEnu = cr6hCatalogDirectionToLocalEnu(
		catalogDirection,
		scene.timeIso,
		configuration.location,
	);
	if (!(localEnu[2] > 0)) return {aboveLocalHorizon: false, insideViewport: false, localEnu};
	const azimuth = configuration.camera.viewAzimuthDegrees * Math.PI / 180;
	const elevation = configuration.camera.viewElevationDegrees * Math.PI / 180;
	const horizontal = Math.cos(elevation);
	const forward = normalize([
		Math.sin(azimuth) * horizontal,
		Math.sin(elevation),
		-Math.cos(azimuth) * horizontal,
	]);
	const right = normalize(cross(forward, [0, 1, 0]));
	const trueUp = normalize(cross(right, forward));
	const world = [localEnu[0], localEnu[2], -localEnu[1]];
	const depth = dot(world, forward);
	if (!(depth > 0)) return {aboveLocalHorizon: true, insideViewport: false, localEnu};
	const verticalTangent = Math.tan(configuration.camera.verticalFieldOfViewDegrees * Math.PI / 360);
	const horizontalTangent = verticalTangent
		* configuration.viewport.widthPixels / configuration.viewport.heightPixels;
	const ndc = [
		dot(world, right) / (depth * horizontalTangent),
		dot(world, trueUp) / (depth * verticalTangent),
	];
	const screen = [
		(ndc[0] + 1) * 0.5 * configuration.viewport.widthPixels,
		(1 - ndc[1]) * 0.5 * configuration.viewport.heightPixels,
	];
	const insideViewport = screen[0] >= 0 && screen[0] < configuration.viewport.widthPixels
		&& screen[1] >= 0 && screen[1] < configuration.viewport.heightPixels;
	return {
		aboveLocalHorizon: true,
		insideViewport,
		localEnu,
		ndc,
		projectedTopLeftPixel: insideViewport ? [Math.floor(screen[0]), Math.floor(screen[1])] : null,
	};
}

export function createCr6hTransmittanceInterpolator(ledgerScenes) {
	const samples = ledgerScenes.flatMap((scene) => scene.members
		.filter((member) => member.localDirectionEastNorthUp[2] > 0)
		.map((member) => ({
			up: member.localDirectionEastNorthUp[2],
			values: member.inferredViewPathTransmittance,
		}))
		.filter(({values}) => Array.isArray(values) && values.length === 15));
	samples.sort((left, right) => left.up - right.up);
	if (samples.length < 100) throw new Error('CR6H lacks authenticated transmittance samples.');
	return (up) => {
		if (up <= samples[0].up) return [...samples[0].values];
		if (up >= samples.at(-1).up) return [...samples.at(-1).values];
		let lowerIndex = 0;
		let upperIndex = samples.length - 1;
		while (upperIndex - lowerIndex > 1) {
			const middle = Math.floor((lowerIndex + upperIndex) / 2);
			if (samples[middle].up <= up) lowerIndex = middle;
			else upperIndex = middle;
		}
		const lower = samples[lowerIndex];
		const upper = samples[upperIndex];
		const fraction = (up - lower.up) / (upper.up - lower.up);
		return lower.values.map((value, channel) =>
			value * (1 - fraction) + upper.values[channel] * fraction);
	};
}
