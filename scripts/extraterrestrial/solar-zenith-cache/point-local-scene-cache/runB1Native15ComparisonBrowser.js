import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {
	B1_DIRECT40_TO_NATIVE15_INDICES,
	B1_NATIVE15_CENTERS_NANOMETERS,
	B1_SUN_STATES,
	createB1PointLocalNative15BuildRequest,
} from './b1PointLocalInputs.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {createB1DiskDirection, integrateB1Direction} from './runB1PointLocalBrowser.js';

export async function runB1Native15ComparisonBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createB1PointLocalNative15BuildRequest();
	const ledgers = B1_SUN_STATES.map(buildSceneInventoryLedger);
	const sceneCacheRequests = B1_SUN_STATES.map((state, index) => ({
		cacheIdentity: `${state.id}-point-local-native15-w27-f68-n4-q30-v1`,
		ledger: ledgers[index],
	}));
	const altitudeNodes = buildRequest.transportSpec.domains.position.nodes.map((node) => node.altitudeMeters);
	const directions = Array.from({length: 81}, (_unused, index) =>
		createB1DiskDirection(Math.floor(index / 9), index % 9));
	const native15Spectra = B1_SUN_STATES.map(() =>
		Array.from({length: 81}, () => Array(15).fill(0)));
	const sparseProbes = [];
	const wavelengthSummaries = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`b1-native15-wavelength-${wavelengthIndex}:start`);
		const channel = buildRequest.transportSpec.domains.spectrum.channels[wavelengthIndex];
		const extinction = (altitude) => channel.rayleighScatteringPerMeter * Math.exp(-altitude / 8000)
			+ channel.mieExtinctionPerMeter * Math.exp(-altitude / 1200);
		const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
			compileSceneCaches: true, sceneCacheRequests,
			reportProgress: async (stage) =>
				globalThis.pointLocalProgress?.(`b1-native15-${wavelengthIndex}:${stage}`),
			onSceneCacheLayer: async ({cacheIndex, values}) => {
				for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
					native15Spectra[cacheIndex][directionIndex][wavelengthIndex] = integrateB1Direction({
						values, ledger: ledgers[cacheIndex], altitudeNodes,
						state: B1_SUN_STATES[cacheIndex], localDirection: directions[directionIndex], extinction,
					});
				}
				if ([0, 8, 16].includes(cacheIndex) && [0, 7, 14].includes(wavelengthIndex)) {
					sparseProbes.push({cacheIndex, wavelengthIndex, first: values[0],
						middle: values[Math.floor(values.length / 2)], last: values.at(-1)});
				}
			},
		});
		wavelengthSummaries.push({wavelengthIndex, centerNanometers: channel.centerNanometers,
			peakLiveFieldBytes: result.peakLiveFieldBytes, finalLiveFieldBytes: result.finalLiveFieldBytes,
			compiledCacheCount: result.compiledCaches.length,
			maximumCacheValue: Math.max(...result.compiledCaches.map((item) => item.maximum))});
	}
	const reconstructedDirect40Spectra = native15Spectra.map((scene) => scene.map((spectrum) =>
		B1_DIRECT40_TO_NATIVE15_INDICES.map((nativeIndex) => spectrum[nativeIndex])));
	return {
		schemaId: 'b1-point-local-native15-w27-q30-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		sunStates: B1_SUN_STATES,
		native15CentersNanometers: B1_NATIVE15_CENTERS_NANOMETERS,
		projectionIndices: B1_DIRECT40_TO_NATIVE15_INDICES,
		native15Spectra,
		reconstructedDirect40Spectra,
		sparseProbes,
		wavelengthSummaries,
		inputChannels: buildRequest.transportSpec.domains.spectrum.channels,
		ledgers: ledgers.map((ledger) => ({sceneId: ledger.sceneId,
			retainedBlockCount: ledger.retainedBlockCount})),
	};
}
