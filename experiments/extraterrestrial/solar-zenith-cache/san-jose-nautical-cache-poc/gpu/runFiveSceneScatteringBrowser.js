import {createPocBuildRequest} from '../compiler/createPocBuildRequest.js';
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

function displayGamma(scene) {
	return scene.id === 'sunset-plus-10-minutes' ? 0.125 : 1;
}

/** Build five compatible actual-point pages and render the requested sequence. */
export async function runFiveSceneScatteringBrowser() {
	const reportProgress = async (stage) => {
		if (typeof globalThis.fiveSceneProgress === 'function') {
			await globalThis.fiveSceneProgress(stage);
		}
	};
	const buildRequest = createPocBuildRequest({
		id: 'san-jose-five-scene-actual-point-cache-build-v1',
		scenePageDefinitions: SAN_JOSE_SCATTERING_SCENE_SEQUENCE.map((scene) => ({
			id: `${scene.id}-native15-c4-page-v1`,
			scene,
		})),
	});
	const pageCount = buildRequest.scenePageRequests.length;
	const wavelengthLayers = Array.from({length: pageCount}, () => new Array(15));
	const validity = new Array(pageCount).fill(null);
	const wavelengthResults = [];
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 400;
	const gl = canvas.getContext('webgl2', {
		alpha: false, antialias: false, depth: false, stencil: false,
		preserveDrawingBuffer: true, powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await reportProgress(`wavelength-${wavelengthIndex}:start`);
		const recurrence = await executeZp3GpuRecurrence({
			gl,
			buildRequest,
			wavelengthIndex,
			compileScenePages: true,
			reportProgress,
			onScenePageLayer: async ({pageIndex, values, validity: layerValidity}) => {
				wavelengthLayers[pageIndex][wavelengthIndex] = values;
				if (validity[pageIndex] === null) validity[pageIndex] = layerValidity;
				else if (validity[pageIndex].some(
					(value, index) => value !== layerValidity[index])) {
					throw new Error(`Page ${pageIndex} validity changed by wavelength.`);
				}
				await postBinary(
					`/artifact/page-layer/${pageIndex}/${wavelengthIndex}`,
					values,
				);
			},
		});
		wavelengthResults.push({
			wavelength: recurrence.wavelength,
			compiledPages: recurrence.compiledPages,
			peakLiveFieldBytes: recurrence.peakLiveFieldBytes,
			finalLiveFieldBytes: recurrence.finalLiveFieldBytes,
			timings: recurrence.timings,
		});
		await reportProgress(`wavelength-${wavelengthIndex}:complete`);
	}
	for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
		await postBinary(`/artifact/validity/${pageIndex}`, validity[pageIndex]);
	}
	const zeroMatrix = new Uint16Array(640 * 400);
	const zeroPalette = new Float32Array(15);
	const renders = [];
	for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
		const page = buildRequest.scenePageRequests[pageIndex];
		const gamma = displayGamma(page.scene);
		await reportProgress(`render-${page.scene.id}:start`);
		const rendered = renderScenePage({
			gl,
			canvas,
			buildRequest,
			wavelengthLayers: wavelengthLayers[pageIndex],
			celestialMatrix: zeroMatrix,
			celestialPalette: zeroPalette,
			paletteEntryCount: 1,
			luminanceLiftGamma: gamma,
			maximumLuminanceGain: 32768,
			scenePageIndex: pageIndex,
			analyticSunEnabled: true,
		});
		const png = await fetch(rendered.imagePngDataUrl).then((response) =>
			response.arrayBuffer());
		await postBinary(`/artifact/render/${page.scene.id}`, png);
		delete rendered.imagePngDataUrl;
		renders.push({
			pageIndex,
			pageId: page.id,
			scene: page.scene,
			displayGamma: gamma,
			rendered,
		});
		await reportProgress(`render-${page.scene.id}:complete`);
	}
	return {
		schemaId: 'san-jose-five-scene-actual-point-scattering-result-v1',
		buildRequest: {
			id: buildRequest.id,
			pageIds: buildRequest.scenePageRequests.map((page) => page.id),
			pageCount,
		},
		wavelengthResults,
		pages: buildRequest.scenePageRequests.map((page, pageIndex) => ({
			pageIndex,
			pageId: page.id,
			sceneId: page.scene.id,
			validCount: validity[pageIndex].reduce((sum, value) => sum + value, 0),
			invalidCount: validity[pageIndex].reduce(
				(sum, value) => sum + (value ? 0 : 1), 0),
			logicalBytes: 9126 * 48 * 15 * 4,
		})),
		renders,
		invariants: {
			transport: 'same Native48/Z180/F68/W39/Native15 actual-point N4 solve',
			camera: 'fixed synchronized-sunset bearing, 5-degree elevation, 78-degree vertical FOV',
			display: 'production source-luminance-lift control; gamma one while source-lit and 0.125 after geometric sunset',
			celestial: 'analytic uniform distant-Sun disk only; stars omitted for scattering focus',
		},
		gpu: {
			api: gl.getParameter(gl.VERSION),
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		},
	};
}
