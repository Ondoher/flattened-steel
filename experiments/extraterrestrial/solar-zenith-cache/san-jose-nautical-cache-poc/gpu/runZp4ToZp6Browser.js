import {createSanJoseNauticalPocBuildRequest} from '../index.js';
import {renderScenePage} from '../runtime/ScenePageRuntimeRenderer.js';
import {executeZp3GpuRecurrence} from './Zp3GpuRecurrence.js';

async function postBinary(url, view) {
	const body = view instanceof ArrayBuffer
		? view
		: view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(url, {method: 'POST', body});
	if (!response.ok) throw new Error(`Artifact upload failed: ${url} ${response.status}.`);
}

/** Compile Native15, prove page-only consumption, and render unconditionally. */
export async function runZp4ToZp6Browser() {
	const reportProgress = async (stage) => {
		if (typeof globalThis.pocProgress === 'function') await globalThis.pocProgress(stage);
	};
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 400;
	const gl = canvas.getContext('webgl2', {
		alpha: false, antialias: false, depth: false, stencil: false,
		preserveDrawingBuffer: true, powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSanJoseNauticalPocBuildRequest();
	const wavelengthLayers = new Array(15);
	let validity = null;
	const wavelengthResults = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await reportProgress(`wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({
			gl, buildRequest, wavelengthIndex, compileScenePages: true,
			reportProgress,
			onScenePageLayer: async ({pageIndex, values, validity: layerValidity}) => {
				if (pageIndex !== 0) throw new Error('First POC expected one scene page.');
				wavelengthLayers[wavelengthIndex] = values;
				if (validity === null) validity = layerValidity;
				else if (validity.some((value, index) => value !== layerValidity[index])) {
					throw new Error('Scene-page validity changed between wavelengths.');
				}
				await postBinary(`/artifact/page-layer/${wavelengthIndex}`, values);
			},
		});
		wavelengthResults.push(result);
		await reportProgress(`wavelength-${wavelengthIndex}:complete`);
	}
	await postBinary('/artifact/validity', validity);
	const [matrixBuffer, paletteBuffer] = await Promise.all([
		fetch('/parent/sunset-plus-one-hour-matrix.u16').then((response) => response.arrayBuffer()),
		fetch('/parent/sunset-plus-one-hour-palette.f32').then((response) => response.arrayBuffer()),
	]);
	await reportProgress('runtime-page-upload');
	const runtime = renderScenePage({
		gl, canvas, buildRequest, wavelengthLayers,
		celestialMatrix: new Uint16Array(matrixBuffer),
		celestialPalette: new Float32Array(paletteBuffer),
		paletteEntryCount: 44,
	});
	const imageResponse = await fetch(runtime.imagePngDataUrl);
	await postBinary('/artifact/render', await imageResponse.arrayBuffer());
	delete runtime.imagePngDataUrl;
	await reportProgress('render-complete');
	return {
		schemaId: 'san-jose-nautical-actual-point-cache-poc-browser-result-v1',
		workPackages: ['ZP4', 'ZP5', 'ZP6'],
		page: {
			id: buildRequest.scenePageRequests[0].id,
			layout: {width: 9126, height: 48, layers: 15, format: 'R32F'},
			logicalBytes: 9126 * 48 * 15 * 4,
			validCount: validity.reduce((sum, value) => sum + value, 0),
			invalidCount: validity.length - validity.reduce((sum, value) => sum + value, 0),
		},
		wavelengths: wavelengthResults.map((result) => ({
			wavelength: result.wavelength,
			compiledPages: result.compiledPages,
			timings: result.timings,
			peakLiveFieldBytes: result.peakLiveFieldBytes,
			finalLiveFieldBytes: result.finalLiveFieldBytes,
		})),
		runtime,
		gpu: {
			api: gl.getParameter(gl.VERSION),
			shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		},
	};
}
