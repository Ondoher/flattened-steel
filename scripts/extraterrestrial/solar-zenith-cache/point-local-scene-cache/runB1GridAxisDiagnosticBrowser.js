import {createSolarZenith180Domain} from
	'../san-jose-nautical-cache-poc/domains/solarZenith180Domain.js';
import {createNative48PositionDomain} from
	'../san-jose-nautical-cache-poc/domains/native48PositionDomain.js';
import {createAdaptiveTerminatorSolarZenithDomain} from './adaptiveTerminatorSolarZenithDomain.js';
import {B1_SUN_STATES, createB1PointLocalBuildRequest} from './b1PointLocalInputs.js';
import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {createNestedNearGround55PositionDomain} from './nestedNearGround55PositionDomain.js';
import {createNestedTerminatorSolarZenithDomain} from './nestedTerminatorSolarZenithDomain.js';
import {createQuadratic48PositionDomain} from './quadratic48PositionDomain.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {createB1DiskDirection, integrateB1Direction} from './runB1PointLocalBrowser.js';

function withDomains(base, id, position, solarZenith) {
	return {...base, id, transportSpec: {...base.transportSpec, id: `${base.transportSpec.id}-${id}`,
		domains: {...base.transportSpec.domains, position, solarZenith}}};
}

/** Isolate radial and solar-zenith grid changes at B1's worst 477.5 nm channel. */
export async function runB1GridAxisDiagnosticBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false,
		stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const base = createB1PointLocalBuildRequest();
	const variants = [
		['canonical', createNative48PositionDomain(), createSolarZenith180Domain()],
		['quadratic-altitude-only', createQuadratic48PositionDomain(), createSolarZenith180Domain()],
		['adaptive-zenith-only', createNative48PositionDomain(), createAdaptiveTerminatorSolarZenithDomain()],
		['nested-candidate', createNestedNearGround55PositionDomain(), createNestedTerminatorSolarZenithDomain()],
	].map(([id, position, solarZenith]) => ({id, position, solarZenith,
		request: withDomains(base, `b1-grid-axis-${id}`, position, solarZenith)}));
	const directions = Array.from({length: 81}, (_unused, index) =>
		createB1DiskDirection(Math.floor(index / 9), index % 9));
	const wavelengthIndex = 10;
	const results = [];
	for (const variant of variants) {
		const ledgers = B1_SUN_STATES.map((state) => buildSceneInventoryLedger(state,
			{positionDomain: variant.position, solarZenithDomain: variant.solarZenith, spectralCount: 40}));
		const sceneCacheRequests = B1_SUN_STATES.map((state, index) => ({cacheIdentity:
			`${state.cacheIdentity}-${variant.id}`, ledger: ledgers[index]}));
		const altitudeNodes = variant.position.nodes.map((node) => node.altitudeMeters);
		const solarZenithNodes = variant.solarZenith.nodes.map((node) => node.solarZenithDegrees);
		const spectra = B1_SUN_STATES.map(() => Array(81).fill(0));
		const channel = variant.request.transportSpec.domains.spectrum.channels[wavelengthIndex];
		const extinction = (altitude) => channel.rayleighScatteringPerMeter * Math.exp(-altitude / 8000)
			+ channel.mieExtinctionPerMeter * Math.exp(-altitude / 1200);
		await executeZp3GpuRecurrence({gl, buildRequest: variant.request, wavelengthIndex,
			compileSceneCaches: true, sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(`b1-axis-${variant.id}:${stage}`),
			onSceneCacheLayer: async ({cacheIndex, values}) => {
				for (let directionIndex = 0; directionIndex < directions.length; directionIndex += 1) {
					spectra[cacheIndex][directionIndex] = integrateB1Direction({values,
						ledger: ledgers[cacheIndex], altitudeNodes, solarZenithNodes,
						state: B1_SUN_STATES[cacheIndex], localDirection: directions[directionIndex], extinction});
				}
			}});
		results.push({id: variant.id, position: variant.position.id, positionCount: variant.position.count,
			solarZenith: variant.solarZenith.id, solarZenithCount: variant.solarZenith.count,
			ledgerBlockRange: [Math.min(...ledgers.map((item) => item.retainedBlockCount)),
				Math.max(...ledgers.map((item) => item.retainedBlockCount))], spectra});
	}
	return {schemaId: 'p8-b1-grid-axis-diagnostic-browser-v1', wavelengthIndex,
		wavelengthNanometers: 477.5, sunStates: B1_SUN_STATES.map((state) => state.time), results,
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)}};
}

