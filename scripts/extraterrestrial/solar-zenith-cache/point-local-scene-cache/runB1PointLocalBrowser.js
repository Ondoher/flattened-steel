import {createActualPointSourceFrame, expressWorldDirectionInActualPointFrame} from
	'../san-jose-nautical-cache-poc/geometry/ActualPointCoordinates.js';
import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {B1_SUN_STATES, createB1PointLocalBuildRequest, resolveB1W27Stencil} from './b1PointLocalInputs.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';

const BOTTOM_RADIUS = 6360000;
const TOP_RADIUS = 6420000;
const DIRECTION_COUNT = 4374;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const normalize = (v) => { const length = Math.hypot(...v); return v.map((x) => x / length); };

function positiveSphereRoot(origin, direction, radius) {
	const projection = dot(origin, direction);
	const discriminant = projection * projection - (dot(origin, origin) - radius * radius);
	if (discriminant < 0) return Infinity;
	const root = Math.sqrt(Math.max(0, discriminant));
	const roots = [-projection - root, -projection + root];
	return roots.find((value) => value > 1e-3) ?? Infinity;
}

export function createB1DiskDirection(gridX, gridY) {
	const horizontal = 2 * (gridX + 0.5) / 9 - 1;
	const vertical = 2 * (gridY + 0.5) / 9 - 1;
	let radius, azimuth;
	if (horizontal > -vertical) {
		if (horizontal > vertical) { radius = horizontal; azimuth = Math.PI / 4 * vertical / horizontal; }
		else { radius = vertical; azimuth = Math.PI / 4 * (2 - horizontal / vertical); }
	} else if (horizontal < vertical) {
		radius = -horizontal; azimuth = Math.PI / 4 * (4 + vertical / horizontal);
	} else {
		radius = -vertical; azimuth = vertical !== 0 ? Math.PI / 4 * (6 - horizontal / vertical) : 0;
	}
	const zenith = Math.acos(1 - radius * radius);
	return [Math.sin(zenith) * Math.cos(azimuth), Math.sin(zenith) * Math.sin(azimuth), Math.cos(zenith)];
}

export function createB1ObserverGeometry(state, localDirection) {
	const theta = state.zenithDegrees * Math.PI / 180;
	const sunAzimuth = state.fittedAzimuthDegrees * Math.PI / 180;
	const up = [Math.sin(theta), 0, Math.cos(theta)];
	const sourceTangent = normalize([0, 0, 1].map((value, index) => value - Math.cos(theta) * up[index]));
	const sourceCross = normalize(cross(up, sourceTangent));
	const sourceHorizontal = [Math.cos(sunAzimuth), Math.sin(sunAzimuth), 0];
	const sourcePerpendicular = [-Math.sin(sunAzimuth), Math.cos(sunAzimuth), 0];
	const alongSource = dot(localDirection, sourceHorizontal);
	const acrossSource = dot(localDirection, sourcePerpendicular);
	const direction = normalize([0, 1, 2].map((axis) => localDirection[2] * up[axis]
		+ alongSource * sourceTangent[axis] + acrossSource * sourceCross[axis]));
	return {origin: up.map((value) => value * BOTTOM_RADIUS), direction};
}

function linearStencil(nodes, value) {
	if (value <= nodes[0]) return [[0, 1]];
	if (value >= nodes.at(-1)) return [[nodes.length - 1, 1]];
	let upper = 1;
	while (nodes[upper] < value) upper += 1;
	const lower = upper - 1, fraction = (value - nodes[lower]) / (nodes[upper] - nodes[lower]);
	return [[lower, 1 - fraction], [upper, fraction]];
}

function packedRow(ledger, altitudeIndex, zenithIndex) {
	const row = ledger.rows[altitudeIndex];
	if (!row || zenithIndex < row.retainedZenith.firstIndex || zenithIndex > row.retainedZenith.lastIndex) {
		throw new RangeError(`B1 lookup outside packed support at altitude ${altitudeIndex}, zenith ${zenithIndex}.`);
	}
	return row.packed.firstRow + zenithIndex - row.retainedZenith.firstIndex;
}

export function resolveB1CacheQuery({ledger, altitudeNodes, solarZenithNodes = null, point, direction}) {
	const frame = createActualPointSourceFrame({point, directionToSource: [0, 0, 1]});
	const altitudes = linearStencil(altitudeNodes, frame.radiusMeters - BOTTOM_RADIUS);
	const zeniths = linearStencil(solarZenithNodes
		?? Array.from({length: 180}, (_unused, index) => index + 0.5), frame.solarZenithDegrees);
	const outgoing = resolveB1W27Stencil(expressWorldDirectionInActualPointFrame(frame, direction));
	const taps = [];
	for (const [altitudeIndex, altitudeWeight] of altitudes) for (const [zenithIndex, zenithWeight] of zeniths) {
		const row = packedRow(ledger, altitudeIndex, zenithIndex);
		for (let index = 0; index < outgoing.indices.length; index += 1) {
			taps.push({altitudeIndex, zenithIndex, packedRow: row,
				directionIndex: outgoing.indices[index],
				weight: altitudeWeight * zenithWeight * outgoing.weights[index]});
		}
	}
	return {frame, altitudes, zeniths, outgoing, taps};
}

export function sampleB1Density(values, ledger, altitudeNodes, point, direction,
	solarZenithNodes = null) {
	const query = resolveB1CacheQuery({ledger, altitudeNodes, solarZenithNodes, point, direction});
	return query.taps.reduce((sum, tap) => sum + tap.weight
		* values[tap.packedRow * DIRECTION_COUNT + tap.directionIndex], 0);
}

export function integrateB1Direction({values, ledger, altitudeNodes, state, localDirection, extinction,
	solarZenithNodes = null, intervalCount = 30, distribution = 'quadratic-near-observer'}) {
	const {origin, direction} = createB1ObserverGeometry(state, localDirection);
	const lengthMeters = positiveSphereRoot(origin, direction, TOP_RADIUS);
	let radiance = 0, transmittance = 1;
	for (let index = 0; index < intervalCount; index += 1) {
		const u0 = index / intervalCount, u1 = (index + 1) / intervalCount;
		const start = distribution === 'uniform' ? lengthMeters * u0 : lengthMeters * u0 * u0;
		const end = distribution === 'uniform' ? lengthMeters * u1 : lengthMeters * u1 * u1;
		const step = end - start, distance = (start + end) * 0.5;
		const point = origin.map((value, axis) => value + direction[axis] * distance);
		transmittance *= Math.exp(-0.5 * extinction(frameAltitude(point)) * step);
		radiance += transmittance * sampleB1Density(values, ledger, altitudeNodes, point, direction,
			solarZenithNodes) * step;
		transmittance *= Math.exp(-0.5 * extinction(frameAltitude(point)) * step);
	}
	return radiance;
}

const frameAltitude = (point) => Math.max(0, Math.hypot(...point) - BOTTOM_RADIUS);

export async function runB1PointLocalBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createB1PointLocalBuildRequest();
	const ledgers = B1_SUN_STATES.map(buildSceneInventoryLedger);
	const sceneCacheRequests = B1_SUN_STATES.map((state, index) => ({cacheIdentity: state.cacheIdentity,
		ledger: ledgers[index]}));
	const altitudeNodes = buildRequest.transportSpec.domains.position.nodes.map((node) => node.altitudeMeters);
	const directions = Array.from({length: 81}, (_unused, index) => createB1DiskDirection(Math.floor(index / 9), index % 9));
	const spectra = B1_SUN_STATES.map(() => Array.from({length: 81}, () => Array(40).fill(0)));
	const sparseProbes = [];
	const wavelengthSummaries = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`b1-wavelength-${wavelengthIndex}:start`);
		const channel = buildRequest.transportSpec.domains.spectrum.channels[wavelengthIndex];
		const extinction = (altitude) => channel.rayleighScatteringPerMeter * Math.exp(-altitude / 8000)
			+ channel.mieExtinctionPerMeter * Math.exp(-altitude / 1200);
		const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
			compileSceneCaches: true, sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(`b1-${wavelengthIndex}:${stage}`),
			onSceneCacheLayer: async ({cacheIndex, values}) => {
				for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
					spectra[cacheIndex][directionIndex][wavelengthIndex] = integrateB1Direction({values,
						ledger: ledgers[cacheIndex], altitudeNodes, state: B1_SUN_STATES[cacheIndex],
						localDirection: directions[directionIndex], extinction});
				}
				if ([0, 8, 16].includes(cacheIndex) && [0, 20, 39].includes(wavelengthIndex)) {
					sparseProbes.push({cacheIndex, wavelengthIndex, first: values[0],
						middle: values[Math.floor(values.length / 2)], last: values.at(-1)});
				}
			}});
		wavelengthSummaries.push({wavelengthIndex, centerNanometers: channel.centerNanometers,
			peakLiveFieldBytes: result.peakLiveFieldBytes, finalLiveFieldBytes: result.finalLiveFieldBytes,
			compiledCacheCount: result.compiledCaches.length,
			maximumCacheValue: Math.max(...result.compiledCaches.map((item) => item.maximum))});
	}
	return {schemaId: 'b1-point-local-direct40-w27-q30-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		sunStates: B1_SUN_STATES, spectra, sparseProbes, wavelengthSummaries,
		ledgers: ledgers.map((ledger) => ({sceneId: ledger.sceneId, retainedBlockCount: ledger.retainedBlockCount}))};
}
