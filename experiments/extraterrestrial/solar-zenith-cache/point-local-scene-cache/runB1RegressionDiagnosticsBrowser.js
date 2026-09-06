import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {B1_SUN_STATES, createB1PointLocalBuildRequest} from './b1PointLocalInputs.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {
	createB1DiskDirection,
	createB1ObserverGeometry,
	integrateB1Direction,
	resolveB1CacheQuery,
} from './runB1PointLocalBrowser.js';

const BOTTOM_RADIUS = 6360000;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const emptySpectra = () => B1_SUN_STATES.map(() => Array.from({length: 81}, () => Array(40).fill(0)));

function mappingAudit(directions) {
	return B1_SUN_STATES.map((state) => {
		const zenith = state.zenithDegrees * Math.PI / 180;
		const azimuth = state.fittedAzimuthDegrees * Math.PI / 180;
		const localSun = [Math.sin(zenith) * Math.cos(azimuth),
			Math.sin(zenith) * Math.sin(azimuth), Math.cos(zenith)];
		const transformedSun = createB1ObserverGeometry(state, localSun).direction;
		let maximumCosineDifference = 0;
		let nearest = null;
		for (let index = 0; index < directions.length; index += 1) {
			const actual = createB1ObserverGeometry(state, directions[index]).direction;
			const expectedCosine = dot(directions[index], localSun);
			const actualCosine = actual[2];
			maximumCosineDifference = Math.max(maximumCosineDifference, Math.abs(actualCosine - expectedCosine));
			if (nearest === null || actualCosine > nearest.cosineToSun) {
				nearest = {gridX: Math.floor(index / 9), gridY: index % 9, cosineToSun: actualCosine,
					angularSeparationDegrees: Math.acos(Math.max(-1, Math.min(1, actualCosine))) * 180 / Math.PI};
			}
		}
		return {time: state.time, transformedSun, sourceAxisError: Math.hypot(transformedSun[0], transformedSun[1], transformedSun[2] - 1),
			maximumCosineDifference, nearest};
	});
}

function variantValue(values, query, axis) {
	let selected = query.taps;
	if (axis !== null) {
		const key = axis === 'altitude' ? 'altitudeIndex' : axis === 'zenith' ? 'zenithIndex' : 'directionIndex';
		const groups = new Map();
		for (const tap of selected) groups.set(tap[key], (groups.get(tap[key]) ?? 0) + tap.weight);
		const retained = [...groups.entries()].sort((a, b) => b[1] - a[1])[0][0];
		selected = selected.filter((tap) => tap[key] === retained);
	}
	const total = selected.reduce((sum, tap) => sum + tap.weight, 0);
	return selected.reduce((sum, tap) => sum + tap.weight / total
		* values[tap.packedRow * 4374 + tap.directionIndex], 0);
}

function reconstructionAudit({values, ledger, altitudeNodes, state, direction, order, wavelengthIndex}) {
	const {origin, direction: worldDirection} = createB1ObserverGeometry(state, direction);
	const topProjection = dot(origin, worldDirection);
	const discriminant = topProjection * topProjection - (dot(origin, origin) - 6420000 ** 2);
	const lengthMeters = -topProjection + Math.sqrt(discriminant);
	return [0, 5, 15, 29].map((sampleIndex) => {
		const u0 = sampleIndex / 30, u1 = (sampleIndex + 1) / 30;
		const distanceMeters = lengthMeters * (u0 * u0 + u1 * u1) * 0.5;
		const point = origin.map((value, axis) => value + worldDirection[axis] * distanceMeters);
		const query = resolveB1CacheQuery({ledger, altitudeNodes, point, direction: worldDirection});
		const tapValues = query.taps.map((tap) => ({...tap,
			value: values[tap.packedRow * 4374 + tap.directionIndex]}));
		const full = variantValue(values, query, null);
		return {order, wavelengthIndex, sampleIndex, distanceMeters,
			altitudeMeters: query.frame.radiusMeters - BOTTOM_RADIUS,
			solarZenithDegrees: query.frame.solarZenithDegrees,
			full, nearestAltitude: variantValue(values, query, 'altitude'),
			nearestZenith: variantValue(values, query, 'zenith'),
			nearestOutgoing: variantValue(values, query, 'outgoing'), tapValues};
	});
}

export async function runB1RegressionDiagnosticsBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const directions = Array.from({length: 81}, (_unused, index) =>
		createB1DiskDirection(Math.floor(index / 9), index % 9));
	const audits = mappingAudit(directions);
	const orders = {grass: [emptySpectra(), emptySpectra(), emptySpectra(), emptySpectra()],
		black: [emptySpectra(), emptySpectra(), emptySpectra(), emptySpectra()]};
	const quadratures = {q30: emptySpectra(), uniform40: emptySpectra(), quadratic240: emptySpectra()};
	const reconstruction = [];
	const solverSummaries = [];
	for (const build of [{label: 'grass', scale: 1}, {label: 'black', scale: 0}]) {
		const buildRequest = createB1PointLocalBuildRequest({groundAlbedoScale: build.scale});
		const ledgers = B1_SUN_STATES.map(buildSceneInventoryLedger);
		const sceneCacheRequests = B1_SUN_STATES.map((state, index) => ({cacheIdentity: state.cacheIdentity,
			ledger: ledgers[index]}));
		const altitudeNodes = buildRequest.transportSpec.domains.position.nodes.map((node) => node.altitudeMeters);
		for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
			await globalThis.pointLocalProgress?.(`b1-diagnostic-${build.label}-${wavelengthIndex}:start`);
			const channel = buildRequest.transportSpec.domains.spectrum.channels[wavelengthIndex];
			const extinction = (altitude) => channel.rayleighScatteringPerMeter * Math.exp(-altitude / 8000)
				+ channel.mieExtinctionPerMeter * Math.exp(-altitude / 1200);
			const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
				compileSceneCaches: true, sceneCacheRequests,
				reportProgress: async (stage) => globalThis.pointLocalProgress?.(`b1-diagnostic-${build.label}-${wavelengthIndex}:${stage}`),
				onSceneCacheOrderLayer: async ({cacheIndex, order, values}) => {
					for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
						const common = {values, ledger: ledgers[cacheIndex], altitudeNodes,
							state: B1_SUN_STATES[cacheIndex], localDirection: directions[directionIndex], extinction};
						const q30 = integrateB1Direction(common);
						orders[build.label][order - 1][cacheIndex][directionIndex][wavelengthIndex] = q30;
						if (build.label === 'grass' && order === 4) {
							quadratures.q30[cacheIndex][directionIndex][wavelengthIndex] = q30;
							quadratures.uniform40[cacheIndex][directionIndex][wavelengthIndex] = integrateB1Direction({...common,
								intervalCount: 40, distribution: 'uniform'});
							quadratures.quadratic240[cacheIndex][directionIndex][wavelengthIndex] = integrateB1Direction({...common,
								intervalCount: 240, distribution: 'quadratic-near-observer'});
						}
					}
					if (build.label === 'grass' && cacheIndex === 6 && wavelengthIndex === 10
						&& (order === 1 || order === 4)) {
						reconstruction.push(...reconstructionAudit({values, ledger: ledgers[cacheIndex], altitudeNodes,
							state: B1_SUN_STATES[cacheIndex], direction: directions[3 * 9 + 6], order, wavelengthIndex}));
					}
				}, onSceneCacheLayer: async () => {}});
			solverSummaries.push({ground: build.label, wavelengthIndex,
				peakLiveFieldBytes: result.peakLiveFieldBytes, finalLiveFieldBytes: result.finalLiveFieldBytes,
				maximumAccumulationResidual: Math.max(...result.accumulationProbes.map((probe) => probe.absoluteResidual))});
		}
	}
	return {schemaId: 'b1-point-local-regression-diagnostics-browser-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		mappingAudits: audits, orders, quadratures, reconstruction, solverSummaries};
}

