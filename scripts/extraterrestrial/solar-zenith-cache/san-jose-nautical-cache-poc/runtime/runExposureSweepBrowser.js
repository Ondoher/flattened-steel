import {createSanJoseNauticalPocBuildRequest} from '../index.js';
import {renderScenePage} from './ScenePageRuntimeRenderer.js';

const VARIANTS = Object.freeze([
	Object.freeze({id: 'control-gamma-0125', luminanceLiftGamma: 0.125}),
	Object.freeze({id: 'mild-gamma-0200', luminanceLiftGamma: 0.2}),
	Object.freeze({id: 'medium-gamma-0300', luminanceLiftGamma: 0.3}),
	Object.freeze({id: 'dark-gamma-0400', luminanceLiftGamma: 0.4}),
]);

async function fetchArrayBuffer(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}.`);
	return response.arrayBuffer();
}

async function postDataUrl(url, dataUrl) {
	const response = await fetch(dataUrl);
	const upload = await fetch(url, {method: 'POST', body: await response.arrayBuffer()});
	if (!upload.ok) throw new Error(`Could not upload ${url}: ${upload.status}.`);
}

/** Render a display-only sweep from the sealed run-000509 scene page. */
export async function runExposureSweepBrowser() {
	const report = async (stage) => {
		if (typeof globalThis.exposureProgress === 'function') {
			await globalThis.exposureProgress(stage);
		}
	};
	const [pageBuffer, matrixBuffer, paletteBuffer] = await Promise.all([
		fetchArrayBuffer('/cache/san-jose-sunset-plus-one-hour-native15-c4-page-v1.f32'),
		fetchArrayBuffer('/celestial/sunset-plus-one-hour-matrix.u16'),
		fetchArrayBuffer('/celestial/sunset-plus-one-hour-palette.f32'),
	]);
	const scalars = new Float32Array(pageBuffer);
	const layerScalarCount = 9126 * 48;
	if (scalars.length !== layerScalarCount * 15) {
		throw new Error('Source scene-page scalar count changed.');
	}
	const wavelengthLayers = Array.from({length: 15}, (_unused, index) =>
		scalars.subarray(index * layerScalarCount, (index + 1) * layerScalarCount));
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 400;
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: true,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSanJoseNauticalPocBuildRequest();
	const variants = [];
	for (const variant of VARIANTS) {
		await report(`${variant.id}:start`);
		const rendered = renderScenePage({
			gl,
			canvas,
			buildRequest,
			wavelengthLayers,
			celestialMatrix: new Uint16Array(matrixBuffer),
			celestialPalette: new Float32Array(paletteBuffer),
			paletteEntryCount: 44,
			luminanceLiftGamma: variant.luminanceLiftGamma,
			maximumLuminanceGain: 32768,
		});
		await postDataUrl(`/artifact/render/${variant.id}`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		variants.push({...variant, rendered});
		await report(`${variant.id}:complete`);
	}
	return {
		schemaId: 'san-jose-nautical-display-only-exposure-sweep-v1',
		sourceCacheRun: '000509-san-jose-nautical-actual-point-cache-poc',
		invariants: {
			cachePayload: 'byte-identical sealed input',
			transport: 'unchanged',
			celestial: 'run-000493 screen palette',
			toneMap: 'Bruneton Figure-1 exponential unchanged',
			maximumLuminanceGain: 32768,
		},
		changedParameter: 'source-luminance-lift gamma only',
		variants,
		gpu: {
			api: gl.getParameter(gl.VERSION),
			vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
		},
	};
}

export {VARIANTS as EXPOSURE_SWEEP_VARIANTS};
