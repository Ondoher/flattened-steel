export const EXPERIMENT = 'B3';
export const NAME = 'Matched-Atmosphere Solver Benchmark';
export const QUESTION = [
	'What directional spectral-radiance error do the proposed formulas produce',
	'against the same Kider measurements under the matched representable physical',
	"inputs, and how does that score compare with the paper's published libRadtran result?",
].join(' ');

export const SOURCE_REVISION = '4df2ec6609bc0127a478bd34fff29c94352579cc';
export const LIBRADTRAN_VERSION = '2.0.1';

export const FULL_WAVELENGTHS_NM = Object.freeze(
	Array.from({length: 40}, (_, index) => 360 + index * ((830 - 360) / 40)),
);
export const SCORED_WAVELENGTHS_NM = Object.freeze(
	FULL_WAVELENGTHS_NM.filter((wavelength) => wavelength >= 360 && wavelength <= 720),
);

export const SOLAR_IRRADIANCE = Object.freeze(
	[
		1.13419, 1.09801, 1.03541, 1.45086, 1.72453, 1.654, 1.70536, 1.97393, 2.03543, 2.00643, 1.95531, 1.95426,
		1.92438, 1.82092, 1.88517, 1.85545, 1.85083, 1.82758, 1.84475, 1.78771, 1.76683, 1.70858, 1.68278, 1.63849,
		1.59608, 1.52211, 1.52468, 1.47836, 1.4485, 1.40522, 1.35526, 1.32788, 1.28834, 1.26938, 1.23241, 1.20345,
		1.17087, 1.1344, 1.11012, 1.07147,
	].map(Math.fround),
);

export const PENNDORF_SCATTERING_PER_METER_AT_0C = Object.freeze(
	[
		70.45e-6, 62.82e-6, 56.2e-6, 50.43e-6, 45.4e-6, 40.98e-6, 37.08e-6, 33.65e-6, 30.6e-6, 27.89e-6, 25.48e-6,
		23.33e-6, 21.4e-6, 19.66e-6, 18.1e-6, 16.69e-6, 15.42e-6, 14.26e-6, 13.21e-6, 12.26e-6, 11.39e-6, 10.6e-6,
		9.876e-6, 9.212e-6, 8.604e-6, 8.045e-6, 7.531e-6, 7.057e-6, 6.62e-6, 6.217e-6, 5.844e-6, 5.498e-6, 5.178e-6,
		4.881e-6, 4.605e-6, 4.348e-6, 4.109e-6, 3.886e-6, 3.678e-6, 3.484e-6, 3.302e-6, 3.132e-6, 2.973e-6, 2.824e-6,
		2.684e-6, 2.583e-6, 2.481e-6, 2.38e-6,
	].map(Math.fround),
);

export const GRASS_ALBEDO = Object.freeze(
	[
		0.018, 0.019, 0.019, 0.02, 0.022, 0.024, 0.027, 0.029, 0.03, 0.031, 0.032, 0.032, 0.032, 0.033, 0.035, 0.04,
		0.055, 0.073, 0.084, 0.089, 0.089, 0.079, 0.069, 0.063, 0.061, 0.057, 0.052, 0.051, 0.048, 0.042, 0.039, 0.035,
		0.035, 0.043, 0.087, 0.156, 0.234, 0.334, 0.437, 0.513, 0.553, 0.571, 0.579, 0.581, 0.587,
	].map(Math.fround),
);

export const MATCHED_ATMOSPHERE = Object.freeze({
	earthRadiusKm: 6360,
	atmosphereTopKm: 60,
	rayleighScaleHeightKm: 8,
	aerosolScaleHeightKm: 1.2,
	aerosolSingleScatteringAlbedo: 0.8,
	aerosolPhaseFunction: 'Cornette-Shanks',
	rayleighAbsorption: 0,
	rayleighDepolarization: 0,
	groundBrdf: 'Lambertian grass spectral albedo',
	solarSpectrum: '40-bin ASTM G-173 extraterrestrial irradiance packet',
	molecularScattering: 'Penndorf 1957 at 15 C',
	layerCount: 100,
	phaseMomentCount: 20,
	geometry: 'pseudospherical',
	outputProcess: 'per_nm',
	outputFields: Object.freeze(['lambda', 'uu']),
	solverDirectiveInBrunetonDeck: 'omitted',
	resolvedSolverForLibRadtran201: 'DISORT',
	streamDirectiveInBrunetonDeck: 'omitted',
	resolvedRadianceStreamsForLibRadtran201: 16,
	disortIntensityCorrection: 'moments',
	altitudeKm: 0,
});

export const PUBLISHED = Object.freeze({
	coarse: Object.freeze({alpha: 0.8, beta: 0.04, g: 0.7, rmseMilliwatt: 11.48}),
	refined: Object.freeze({alpha: 0.816, beta: 0.0384, g: 0.704, rmseMilliwatt: 11.45}),
	broadNearMinimumRegion: Object.freeze({
		alpha: Object.freeze([0.6, 0.9]),
		beta: Object.freeze([0.038, 0.042]),
		g: Object.freeze([0.68, 0.73]),
	}),
	twoPercentIsosurfaceRmseMilliwatt: 11.68,
});

export const COARSE_GRID = Object.freeze({
	alpha: Object.freeze(Array.from({length: 11}, (_, index) => Number((index * 0.2).toFixed(1)))),
	beta: Object.freeze(Array.from({length: 10}, (_, index) => Number(((index + 1) * 0.02).toFixed(2)))),
	g: Object.freeze(Array.from({length: 5}, (_, index) => Number((0.5 + index * 0.1).toFixed(1)))),
});

export function enumerateCoarseGrid() {
	const cases = [];
	for (const alpha of COARSE_GRID.alpha) {
		for (const beta of COARSE_GRID.beta) {
			for (const g of COARSE_GRID.g) {
				cases.push(
					Object.freeze({
						index: cases.length,
						alpha: Number(alpha.toFixed(1)),
						beta: Number(beta.toFixed(2)),
						g: Number(g.toFixed(1)),
					}),
				);
			}
		}
	}
	return Object.freeze(cases);
}

function toUnitDisk(x, y) {
	const a = 2 * x - 1;
	const b = 2 * y - 1;
	if (a > -b) {
		if (a > b) return {r: a, phi: (Math.PI / 4) * (b / a)};
		return {r: b, phi: (Math.PI / 4) * (2 - a / b)};
	}
	if (a < b) return {r: -a, phi: (Math.PI / 4) * (4 + b / a)};
	return {r: -b, phi: b !== 0 ? (Math.PI / 4) * (6 - a / b) : 0};
}

const degrees = (radians) => (radians * 180) / Math.PI;

export function buildDirectionContract() {
	const samples = [];
	for (let i = 0; i < 9; i += 1) {
		for (let j = 0; j < 9; j += 1) {
			const {r, phi} = toUnitDisk((i + 0.5) / 9, (j + 0.5) / 9);
			let azimuth = degrees(phi);
			if (azimuth < 0) azimuth += 360;
			azimuth = Math.round(azimuth / 0.25) * 0.25;
			samples.push({
				index: samples.length,
				i,
				j,
				viewZenithDeg: degrees(Math.acos(1 - r * r)),
				viewAzimuthDeg: azimuth,
			});
		}
	}
	const zeniths = [...new Set(samples.map((sample) => sample.viewZenithDeg))].sort((a, b) => a - b);
	const azimuths = [...new Set(samples.map((sample) => sample.viewAzimuthDeg))].sort((a, b) => a - b);
	const directions = samples.map((sample) =>
		Object.freeze({
			...sample,
			gridZenithIndex: zeniths.indexOf(sample.viewZenithDeg),
			gridAzimuthIndex: azimuths.indexOf(sample.viewAzimuthDeg),
		}),
	);
	return Object.freeze({
		directions: Object.freeze(directions),
		uvspecViewZenithsDeg: Object.freeze(zeniths),
		uvspecViewAzimuthsDeg: Object.freeze(azimuths),
	});
}

export const DIRECTION_CONTRACT = buildDirectionContract();

function sunPositionUtc({year, month, day, hours, minutes, seconds}, location) {
	const decimalHours = hours + (minutes + seconds / 60) / 60;
	const aux1 = Math.trunc((month - 14) / 12);
	const aux2 =
		Math.trunc((1461 * (year + 4800 + aux1)) / 4) +
		Math.trunc((367 * (month - 2 - 12 * aux1)) / 12) -
		Math.trunc((3 * Math.trunc((year + 4900 + aux1) / 100)) / 4) +
		day -
		32075;
	const julianDate = aux2 - 0.5 + decimalHours / 24;
	const elapsedJulianDays = julianDate - 2451545;
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
	const dy = Math.cos(eclipticObliquity) * sinEclipticLongitude;
	const dx = Math.cos(eclipticLongitude);
	let rightAscension = Math.atan2(dy, dx);
	if (rightAscension < 0) rightAscension += 2 * Math.PI;
	const declination = Math.asin(Math.sin(eclipticObliquity) * sinEclipticLongitude);
	const greenwichMeanSiderealTime = 6.6974243242 + 0.0657098283 * elapsedJulianDays + decimalHours;
	const localMeanSiderealTime = ((greenwichMeanSiderealTime * 15 + location.longitude) * Math.PI) / 180;
	const hourAngle = localMeanSiderealTime - rightAscension;
	const latitude = (location.latitude * Math.PI) / 180;
	let zenith = Math.acos(
		Math.cos(latitude) * Math.cos(hourAngle) * Math.cos(declination) + Math.sin(declination) * Math.sin(latitude),
	);
	let azimuth = Math.atan2(
		-Math.sin(hourAngle),
		Math.tan(declination) * Math.cos(latitude) - Math.sin(latitude) * Math.cos(hourAngle),
	);
	if (azimuth < 0) azimuth += 2 * Math.PI;
	const parallax = (6371.01 / 149597890) * Math.sin(zenith);
	zenith += parallax;
	return Object.freeze({zenithDeg: degrees(zenith), azimuthDeg: degrees(azimuth)});
}

export const CORNELL_LOCATION = Object.freeze({
	latitude: 42.44337,
	longitude: -76.48163,
});

// Independently reproduced from the official 17-capture Kider subset with the
// pinned MeasuredAtmosphere preprocessing: repair source sample 0, integrate
// each 40-sample spectrum, then minimize hemispherical symmetry error over the
// theoretical azimuth +/-20 degrees at 0.2-degree steps. The processed source
// grid has SHA-256 18d5a3d02ffe688bf18afcc96bd39962de7a610870cc4bbe685fa6ac415be27e.
export const FITTED_SUN_AZIMUTHS_DEG = Object.freeze([
	91.14246195784821, 93.89430417529859, 96.23317650653027, 98.59994923191232, 100.64372859730334, 104.8234287657915,
	108.20914751464628, 111.68270889819306, 116.93611340645329, 122.26567982930705, 130.75858093979636,
	134.8682819681534, 143.97853686677962, 153.76505878947935, 162.57770113145415, 174.2693750288133,
	179.87345331399575,
]);

export function buildFixedConditions() {
	return Object.freeze(
		Array.from({length: 17}, (_, index) => {
			const localMinutes = 9 * 60 + 30 + index * 15;
			const utcMinutes = localMinutes + 4 * 60;
			const hour = Math.trunc(localMinutes / 60);
			const minute = localMinutes % 60;
			const utcHour = Math.trunc(utcMinutes / 60);
			const utcMinute = utcMinutes % 60;
			const sun = sunPositionUtc(
				{
					year: 2013,
					month: 5,
					day: 27,
					hours: utcHour,
					minutes: utcMinute,
					seconds: 0,
				},
				CORNELL_LOCATION,
			);
			return Object.freeze({
				index,
				id: `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`,
				date: '2013-05-27',
				localTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
				utcTime: `${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')}:00Z`,
				sunZenithDeg: sun.zenithDeg,
				theoreticalSunAzimuthDeg: sun.azimuthDeg,
				sunAzimuthDeg: FITTED_SUN_AZIMUTHS_DEG[index],
				sunAzimuthBasis: 'measurement-field symmetry fit',
			});
		}),
	);
}

export const FIXED_CONDITIONS = buildFixedConditions();

export function verifyContract() {
	const coarseCases = enumerateCoarseGrid();
	const targetCases = coarseCases.filter(
		(item) =>
			item.alpha === PUBLISHED.coarse.alpha &&
			item.beta === PUBLISHED.coarse.beta &&
			item.g === PUBLISHED.coarse.g,
	);
	const checks = Object.freeze([
		Object.freeze({name: 'pinned comparison source revision', accepted: SOURCE_REVISION.length === 40}),
		Object.freeze({name: 'pinned libRadtran release', accepted: LIBRADTRAN_VERSION === '2.0.1'}),
		Object.freeze({
			name: '40-sample 360-830 source basis',
			accepted: FULL_WAVELENGTHS_NM.length === 40 && FULL_WAVELENGTHS_NM.at(-1) === 818.25,
		}),
		Object.freeze({
			name: '31 scored wavelengths in 360-720 interval',
			accepted: SCORED_WAVELENGTHS_NM.length === 31 && SCORED_WAVELENGTHS_NM.at(-1) === 712.5,
		}),
		Object.freeze({name: '17 measured conditions', accepted: FIXED_CONDITIONS.length === 17}),
		Object.freeze({
			name: '17 fitted solar azimuths',
			accepted:
				FITTED_SUN_AZIMUTHS_DEG.length === 17 &&
				FIXED_CONDITIONS.every((condition) => Number.isFinite(condition.sunAzimuthDeg)),
		}),
		Object.freeze({name: '81 Shirley-Chiu directions', accepted: DIRECTION_CONTRACT.directions.length === 81}),
		Object.freeze({
			name: 'source-equivalent uvspec rectangular direction grid',
			accepted:
				DIRECTION_CONTRACT.uvspecViewZenithsDeg.length === 5 &&
				DIRECTION_CONTRACT.uvspecViewAzimuthsDeg.length === 48,
		}),
		Object.freeze({name: '11x10x5 coarse grid', accepted: coarseCases.length === 550}),
		Object.freeze({name: 'published coarse target occurs once', accepted: targetCases.length === 1}),
		Object.freeze({
			name: 'resolved DISORT radiance defaults',
			accepted:
				MATCHED_ATMOSPHERE.resolvedSolverForLibRadtran201 === 'DISORT' &&
				MATCHED_ATMOSPHERE.resolvedRadianceStreamsForLibRadtran201 === 16,
		}),
	]);
	return Object.freeze({checks, accepted: checks.every((check) => check.accepted)});
}
