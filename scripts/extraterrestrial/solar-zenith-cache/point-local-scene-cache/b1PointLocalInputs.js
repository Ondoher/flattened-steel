import {createNative48PositionDomain} from
	'../san-jose-nautical-cache-poc/domains/native48PositionDomain.js';
import {createReflectionCompletedFibonacci68Domain} from
	'../san-jose-nautical-cache-poc/domains/reflectionCompletedFibonacci68Domain.js';
import {createSolarZenith180Domain} from
	'../san-jose-nautical-cache-poc/domains/solarZenith180Domain.js';
import {createAdaptiveTerminatorSolarZenithDomain} from
	'./adaptiveTerminatorSolarZenithDomain.js';
import {createQuadratic48PositionDomain} from './quadratic48PositionDomain.js';

const FACE_WIDTH = 27;
const CELL_WIDTH = FACE_WIDTH - 1;
const FACE_NODE_COUNT = FACE_WIDTH * FACE_WIDTH;
const DIRECTION_COUNT = 6 * FACE_NODE_COUNT;
const FACES = Object.freeze([
	[[1, 0, 0], [0, 1, 0], [0, 0, 1]],
	[[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
	[[0, 1, 0], [-1, 0, 0], [0, 0, 1]],
	[[0, -1, 0], [1, 0, 0], [0, 0, 1]],
	[[0, 0, 1], [1, 0, 0], [0, 1, 0]],
	[[0, 0, -1], [-1, 0, 0], [0, 1, 0]],
].map(([normal, uAxis, vAxis]) => Object.freeze({normal, uAxis, vAxis})));

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (v) => { const length = Math.hypot(...v); return v.map((x) => x / length); };
const flatten = (face, u, v) => face * FACE_NODE_COUNT + v * FACE_WIDTH + u;

export function createB1W27DirectionDomain() {
	const unitVectors = Object.freeze(Array.from({length: DIRECTION_COUNT}, (_unused, index) => {
		const faceIndex = Math.floor(index / FACE_NODE_COUNT);
		const local = index % FACE_NODE_COUNT;
		const v = Math.floor(local / FACE_WIDTH);
		const u = local % FACE_WIDTH;
		const face = FACES[faceIndex];
		return Object.freeze(normalize([0, 1, 2].map((component) =>
			face.normal[component] + face.uAxis[component] * (2 * u - CELL_WIDTH) / CELL_WIDTH
				+ face.vAxis[component] * (2 * v - CELL_WIDTH) / CELL_WIDTH)));
	}));
	const center = CELL_WIDTH / 2;
	return Object.freeze({id: 'b1-contained-cubed-sphere-w27-v1', frame: 'actual-point-source-relative',
		faceWidth: FACE_WIDTH, directionCount: DIRECTION_COUNT, unitVectors,
		positiveFaceCenterIndices: Object.freeze({positiveX: flatten(0, center, center),
			positiveY: flatten(2, center, center), positiveZ: flatten(4, center, center)})});
}

export function resolveB1W27Stencil(direction) {
	const unit = normalize(direction);
	let faceIndex = 0;
	for (let index = 1; index < FACES.length; index += 1) {
		if (dot(unit, FACES[index].normal) > dot(unit, FACES[faceIndex].normal)) faceIndex = index;
	}
	const face = FACES[faceIndex];
	const denominator = dot(unit, face.normal);
	const coordinate = (axis) => Math.max(0, Math.min(CELL_WIDTH,
		(dot(unit, axis) / denominator + 1) * CELL_WIDTH / 2));
	const u = coordinate(face.uAxis);
	const v = coordinate(face.vAxis);
	const u0 = Math.floor(u), v0 = Math.floor(v);
	const u1 = Math.min(u0 + 1, CELL_WIDTH), v1 = Math.min(v0 + 1, CELL_WIDTH);
	const fu = u - u0, fv = v - v0;
	const raw = [[u0, v0, (1 - fu) * (1 - fv)], [u1, v0, fu * (1 - fv)],
		[u0, v1, (1 - fu) * fv], [u1, v1, fu * fv]];
	const combined = new Map();
	for (const [ui, vi, weight] of raw) if (weight > 0) {
		const index = flatten(faceIndex, ui, vi);
		combined.set(index, (combined.get(index) ?? 0) + weight);
	}
	return {indices: [...combined.keys()], weights: [...combined.values()]};
}

const SOLAR_IRRADIANCE = Object.freeze([
	1.13419,1.09801,1.03541,1.45086,1.72453,1.654,1.70536,1.97393,2.03543,2.00643,
	1.95531,1.95426,1.92438,1.82092,1.88517,1.85545,1.85083,1.82758,1.84475,1.78771,
	1.76683,1.70858,1.68278,1.63849,1.59608,1.52211,1.52468,1.47836,1.4485,1.40522,
	1.35526,1.32788,1.28834,1.26938,1.23241,1.20345,1.17087,1.1344,1.11012,1.07147,
]);
const PENNDORF = Object.freeze([
	70.45e-6,62.82e-6,56.2e-6,50.43e-6,45.4e-6,40.98e-6,37.08e-6,33.65e-6,30.6e-6,27.89e-6,25.48e-6,23.33e-6,
	21.4e-6,19.66e-6,18.1e-6,16.69e-6,15.42e-6,14.26e-6,13.21e-6,12.26e-6,11.39e-6,10.6e-6,9.876e-6,9.212e-6,
	8.604e-6,8.045e-6,7.531e-6,7.057e-6,6.62e-6,6.217e-6,5.844e-6,5.498e-6,5.178e-6,4.881e-6,4.605e-6,
	4.348e-6,4.109e-6,3.886e-6,3.678e-6,3.484e-6,3.302e-6,3.132e-6,2.973e-6,2.824e-6,2.684e-6,2.583e-6,2.481e-6,2.38e-6,
]);
const GRASS = Object.freeze([
	0.018,0.019,0.019,0.02,0.022,0.024,0.027,0.029,0.03,0.031,0.032,0.032,0.032,0.033,0.035,0.04,0.055,
	0.073,0.084,0.089,0.089,0.079,0.069,0.063,0.061,0.057,0.052,0.051,0.048,0.042,0.039,0.035,0.035,
	0.043,0.087,0.156,0.234,0.334,0.437,0.513,0.553,0.571,0.579,0.581,0.587,
]);
function interpolate(values, minimum, maximum, coordinate) {
	const p = (Math.max(minimum, Math.min(maximum, coordinate)) - minimum) * (values.length - 1) / (maximum - minimum);
	const low = Math.floor(p), high = Math.min(values.length - 1, low + 1), f = p - low;
	return values[low] * (1 - f) + values[high] * f;
}

export const B1_DIRECT40_WAVELENGTHS_NANOMETERS = Object.freeze(
	Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index),
);
export const B1_NATIVE15_CENTERS_NANOMETERS = Object.freeze(
	Array.from({length: 15}, (_unused, index) => 360 + (index + 0.5) * (470 / 15)),
);
export const B1_DIRECT40_TO_NATIVE15_INDICES = Object.freeze(
	Array.from({length: 40}, (_unused, index) => Math.min(14, Math.floor(3 * index / 8))),
);

export function createB1Direct40Channels({groundAlbedoScale = 1} = {}) {
	if (!Number.isFinite(groundAlbedoScale) || groundAlbedoScale < 0) {
		throw new RangeError('B1 ground albedo scale must be finite and nonnegative.');
	}
	return B1_DIRECT40_WAVELENGTHS_NANOMETERS.map((centerNanometers, index) => ({
		centerNanometers,
		sourceIrradianceDensityWattsPerSquareMeterPerNanometer: SOLAR_IRRADIANCE[index],
		rayleighScatteringPerMeter: interpolate(PENNDORF, 360, 830, centerNanometers) * 273.16 / (273.16 + 15),
		mieExtinctionPerMeter: 0.04 * (centerNanometers / 1000) ** -0.8 / 1200,
		groundAlbedo: interpolate(GRASS, 360, 800, centerNanometers) * groundAlbedoScale,
	}));
}

export const B1_SUN_STATES = Object.freeze([
	['09:30',48.93794688168912,91.14246195784821],['09:45',46.208826302122404,93.89430417529859],
	['10:00',43.5080686512456,96.23317650653027],['10:15',40.84600718432722,98.59994923191232],
	['10:30',38.23521556629407,100.64372859730334],['10:45',35.691221383967786,104.8234287657915],
	['11:00',33.23342195045843,108.20914751464628],['11:15',30.886221441278117,111.68270889819306],
	['11:30',28.6803513716398,116.93611340645329],['11:45',26.65419890757803,122.26567982930705],
	['12:00',24.85469403287468,130.75858093979636],['12:15',23.336871257149493,134.8682819681534],
	['12:30',22.160769064673403,143.97853686677962],['12:45',21.384402520503635,153.76505878947935],
	['13:00',21.05302520512781,162.57770113145415],['13:15',21.187917283518857,174.2693750288133],
	['13:30',21.78023114746797,179.87345331399575],
].map(([time, zenithDegrees, fittedAzimuthDegrees]) => Object.freeze({time, zenithDegrees, fittedAzimuthDegrees,
	id: `b1-${time.replace(':', '')}`, cacheIdentity: `b1-${time.replace(':', '')}-point-local-direct40-w27-n4-v1`,
	observerSolarZenithDegrees: zenithDegrees, support: Object.freeze({bottomRadiusMeters: 6360000,
		topRadiusMeters: 6420000, observer: Object.freeze({heightMeters: 0})})})));

export function createB1PointLocalBuildRequest({groundAlbedoScale = 1} = {}) {
	if (!Number.isFinite(groundAlbedoScale) || groundAlbedoScale < 0) {
		throw new RangeError('B1 ground albedo scale must be finite and nonnegative.');
	}
	const spectrum = Object.freeze({id: 'b1-direct40-contained-v1', channelCount: 40,
		channels: Object.freeze(createB1Direct40Channels({groundAlbedoScale})
			.map((channel) => Object.freeze(channel)))});
	const domains = Object.freeze({position: createNative48PositionDomain(), solarZenith: createSolarZenith180Domain(),
		incoming: createReflectionCompletedFibonacci68Domain(), outgoing: createB1W27DirectionDomain(), spectrum});
	return Object.freeze({id: `b1-point-local-direct40-w27-f68-n4-q30-ground-${groundAlbedoScale}-v1`, transportSpec: Object.freeze({
		id: 'b1-point-local-paper-profile-transport-v1', domains,
		atmosphere: Object.freeze({ozone: Object.freeze({crossSectionTable: Object.freeze({minimumNanometers: 360,
			spacingNanometers: 11.75, values: Object.freeze(Array(40).fill(0))})})}),
		numerical: Object.freeze({transportIntervalCount: 40, sourcePathTransmittanceIntervalCount: 20,
			viewPathIntervalCount: 30, maximumScatteringOrder: 4})})});
}

/** Create the P8-refined Direct40 B1 request without changing physical inputs. */
export function createB1PointLocalRefinedBuildRequest({groundAlbedoScale = 1} = {}) {
	const base = createB1PointLocalBuildRequest({groundAlbedoScale});
	const domains = Object.freeze({...base.transportSpec.domains,
		position: createQuadratic48PositionDomain(),
		solarZenith: createAdaptiveTerminatorSolarZenithDomain()});
	return Object.freeze({...base, id: `b1-point-local-refined-direct40-w27-f68-n4-q30-ground-${groundAlbedoScale}-v1`,
		transportSpec: Object.freeze({...base.transportSpec,
			id: 'b1-point-local-refined-paper-profile-transport-v1', domains})});
}

export function createB1PointLocalNative15BuildRequest({groundAlbedoScale = 1} = {}) {
	if (!Number.isFinite(groundAlbedoScale) || groundAlbedoScale < 0) {
		throw new RangeError('B1 ground albedo scale must be finite and nonnegative.');
	}
	const channels = createB1Native15Channels({groundAlbedoScale});
	const spectrum = Object.freeze({id: 'b1-native15-bin-average-from-direct40-inputs-v1', channelCount: 15,
		semantics: 'equal-weight bin-average physical inputs over canonical B1 membership',
		channels});
	const domains = Object.freeze({position: createNative48PositionDomain(), solarZenith: createSolarZenith180Domain(),
		incoming: createReflectionCompletedFibonacci68Domain(), outgoing: createB1W27DirectionDomain(), spectrum});
	return Object.freeze({id: `b1-point-local-native15-w27-f68-n4-q30-ground-${groundAlbedoScale}-v1`,
		transportSpec: Object.freeze({id: 'b1-point-local-paper-profile-native15-transport-v1', domains,
			atmosphere: Object.freeze({ozone: Object.freeze({crossSectionTable: Object.freeze({minimumNanometers: 360,
				spacingNanometers: 470 / 15, values: Object.freeze(Array(15).fill(0))})})}),
			numerical: Object.freeze({transportIntervalCount: 40, sourcePathTransmittanceIntervalCount: 20,
				viewPathIntervalCount: 30, maximumScatteringOrder: 4})})});
}

export function createB1Native15Channels({groundAlbedoScale = 1} = {}) {
	if (!Number.isFinite(groundAlbedoScale) || groundAlbedoScale < 0) {
		throw new RangeError('B1 ground albedo scale must be finite and nonnegative.');
	}
	const directChannels = createB1Direct40Channels({groundAlbedoScale});
	const bins = B1_NATIVE15_CENTERS_NANOMETERS.map((centerNanometers) => ({centerNanometers,
		sourceIrradianceDensityWattsPerSquareMeterPerNanometer: 0,
		rayleighScatteringPerMeter: 0, mieExtinctionPerMeter: 0, groundAlbedo: 0, count: 0}));
	for (let index = 0; index < directChannels.length; index += 1) {
		const bin = bins[B1_DIRECT40_TO_NATIVE15_INDICES[index]];
		const channel = directChannels[index];
		bin.sourceIrradianceDensityWattsPerSquareMeterPerNanometer +=
			channel.sourceIrradianceDensityWattsPerSquareMeterPerNanometer;
		bin.rayleighScatteringPerMeter += channel.rayleighScatteringPerMeter;
		bin.mieExtinctionPerMeter += channel.mieExtinctionPerMeter;
		bin.groundAlbedo += channel.groundAlbedo;
		bin.count += 1;
	}
	return Object.freeze(bins.map(({count, ...bin}) => Object.freeze(Object.fromEntries(
		Object.entries(bin).map(([key, value]) => [key, key === 'centerNanometers' ? value : value / count]),
	))));
}
