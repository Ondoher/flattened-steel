import {createPocBuildRequest} from '../compiler/createPocBuildRequest.js';
import {createNearGroundExtended55PositionDomain} from
	'../domains/nearGroundExtended55PositionDomain.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../fixtures/sanJoseScatteringSceneSequence.js';
import {renderScenePage} from '../runtime/ScenePageRuntimeRenderer.js';
import {executeZp3GpuRecurrence} from './Zp3GpuRecurrence.js';

async function postBinary(url, view) {
	const body = view instanceof ArrayBuffer
		? view
		: view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(url, {method: 'POST', body});
	if (!response.ok) throw new Error(`Artifact upload failed: ${url} ${response.status}.`);
}

/** Isolate the solar-noon near-ground scene-page extension. */
export async function runSolarNoonNearGroundBrowser() {
	const reportProgress = async (stage) => {
		if (typeof globalThis.nearGroundProgress === 'function') {
			await globalThis.nearGroundProgress(stage);
		}
	};
	const scene = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find(
		(candidate) => candidate.id === 'solar-noon');
	if (!scene) throw new Error('Solar-noon scene is unavailable.');
	const positionDomain = createNearGroundExtended55PositionDomain();
	const buildRequest = createPocBuildRequest({
		id: 'san-jose-solar-noon-near-ground-55-build-v1',
		scenePageDefinitions: [{
			id: 'solar-noon-native15-c4-near-ground-55-page-v1',
			scene,
			positionDomain,
		}],
	});
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 400;
	const gl = canvas.getContext('webgl2', {
		alpha: false, antialias: false, depth: false, stencil: false,
		preserveDrawingBuffer: true, powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const layers = new Array(15);
	let validity = null;
	const wavelengthResults = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await reportProgress(`wavelength-${wavelengthIndex}:start`);
		const recurrence = await executeZp3GpuRecurrence({
			gl,
			buildRequest,
			wavelengthIndex,
			compileScenePages: true,
			reportProgress,
			onScenePageLayer: async ({values, validity: layerValidity}) => {
				layers[wavelengthIndex] = values;
				if (validity === null) validity = layerValidity;
				else if (validity.some(
					(value, index) => value !== layerValidity[index])) {
					throw new Error('Validity changed by wavelength.');
				}
				await postBinary(`/artifact/page-layer/${wavelengthIndex}`, values);
			},
		});
		wavelengthResults.push({
			wavelength: recurrence.wavelength,
			compiledPage: recurrence.compiledPages[0],
			peakLiveFieldBytes: recurrence.peakLiveFieldBytes,
			finalLiveFieldBytes: recurrence.finalLiveFieldBytes,
			timings: recurrence.timings,
		});
		await reportProgress(`wavelength-${wavelengthIndex}:complete`);
	}
	await postBinary('/artifact/validity', validity);
	const rendered = renderScenePage({
		gl,
		canvas,
		buildRequest,
		wavelengthLayers: layers,
		celestialMatrix: new Uint16Array(640 * 400),
		celestialPalette: new Float32Array(15),
		paletteEntryCount: 1,
		luminanceLiftGamma: 1,
		maximumLuminanceGain: 32768,
		analyticSunEnabled: true,
	});
	const png = await fetch(rendered.imagePngDataUrl).then((response) =>
		response.arrayBuffer());
	await postBinary('/artifact/render', png);
	delete rendered.imagePngDataUrl;
	await reportProgress('render-complete');
	return {
		schemaId: 'san-jose-solar-noon-near-ground-55-result-v1',
		scene,
		positionDomain,
		page: {
			id: buildRequest.scenePageRequests[0].id,
			width: 9126,
			height: positionDomain.count,
			layers: 15,
			logicalBytes: 9126 * positionDomain.count * 15 * 4,
			validCount: validity.reduce((sum, value) => sum + value, 0),
			invalidCount: validity.reduce((sum, value) => sum + (value ? 0 : 1), 0),
		},
		wavelengthResults,
		rendered,
		invariants: {
			solverPositionDomain: 'algorithm32-native-48-position-v2',
			pageChangeOnly: 'insert 1.7, 10, 50, 100, 250, 500, and 1000 meter rows',
			transport: 'unchanged actual-point N4',
			sceneCameraSunDisplay: 'byte-identical configuration identity to run-000511 solar noon',
		},
		gpu: {
			api: gl.getParameter(gl.VERSION),
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		},
	};
}
