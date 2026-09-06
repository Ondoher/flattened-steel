import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {B1_SUN_STATES, createB1PointLocalRefinedBuildRequest} from './b1PointLocalInputs.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {createB1DiskDirection, integrateB1Direction} from './runB1PointLocalBrowser.js';

/** Execute the unchanged Direct40 B1 boundary through the P8-refined cache grids. */
export async function runB1RefinedGridBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false,
		stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createB1PointLocalRefinedBuildRequest();
	const {position, solarZenith} = buildRequest.transportSpec.domains;
	const ledgers = B1_SUN_STATES.map((state) => buildSceneInventoryLedger(state,
		{positionDomain: position, solarZenithDomain: solarZenith, spectralCount: 40}));
	const sceneCacheRequests = B1_SUN_STATES.map((state, index) => ({cacheIdentity:
		`${state.cacheIdentity}-refined-grid-v1`, ledger: ledgers[index]}));
	const altitudeNodes = position.nodes.map((node) => node.altitudeMeters);
	const solarZenithNodes = solarZenith.nodes.map((node) => node.solarZenithDegrees);
	const directions = Array.from({length: 81}, (_unused, index) =>
		createB1DiskDirection(Math.floor(index / 9), index % 9));
	const spectra = B1_SUN_STATES.map(() => Array.from({length: 81}, () => Array(40).fill(0)));
	const sparseProbes = [];
	const wavelengthSummaries = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`b1-refined-${wavelengthIndex}:start`);
		const channel = buildRequest.transportSpec.domains.spectrum.channels[wavelengthIndex];
		const extinction = (altitude) => channel.rayleighScatteringPerMeter * Math.exp(-altitude / 8000)
			+ channel.mieExtinctionPerMeter * Math.exp(-altitude / 1200);
		const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
			compileSceneCaches: true, sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(`b1-refined-${wavelengthIndex}:${stage}`),
			onSceneCacheLayer: async ({cacheIndex, values}) => {
				for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
					spectra[cacheIndex][directionIndex][wavelengthIndex] = integrateB1Direction({values,
						ledger: ledgers[cacheIndex], altitudeNodes, solarZenithNodes,
						state: B1_SUN_STATES[cacheIndex], localDirection: directions[directionIndex], extinction});
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
	return {schemaId: 'b1-point-local-refined-direct40-w27-q30-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		domains: {position: position.id, positionCount: position.count,
			solarZenith: solarZenith.id, solarZenithCount: solarZenith.count,
			outgoing: buildRequest.transportSpec.domains.outgoing.id},
		sunStates: B1_SUN_STATES, spectra, sparseProbes, wavelengthSummaries,
		ledgers: ledgers.map((ledger) => ({sceneId: ledger.sceneId,
			retainedBlockCount: ledger.retainedBlockCount,
			packedW27Bytes: ledger.memory.packedRows.W27.bytes}))};
}
