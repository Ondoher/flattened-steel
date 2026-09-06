import {createPocBuildRequest} from '../compiler/createPocBuildRequest.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../fixtures/sanJoseScatteringSceneSequence.js';
import {renderScenePage} from './ScenePageRuntimeRenderer.js';

async function fetchBuffer(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}.`);
	return response.arrayBuffer();
}

async function uploadRender(id, dataUrl) {
	const png = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(`/artifact/render/${id}`, {method: 'POST', body: png});
	if (!response.ok) throw new Error(`Could not upload ${id}: ${response.status}.`);
}

/** Compare old and validity-aware lookup over the sealed Native48 noon page. */
export async function runSolarNoonValidityAwareBrowser() {
	const scene = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find(
		(candidate) => candidate.id === 'solar-noon');
	if (!scene) throw new Error('Solar-noon scene is unavailable.');
	const [pageBuffer, validityBuffer] = await Promise.all([
		fetchBuffer('/control/page.f32'),
		fetchBuffer('/control/validity.u8'),
	]);
	const scalars = new Float32Array(pageBuffer);
	const validityMask = new Uint8Array(validityBuffer);
	const layerScalarCount = 9126 * 48;
	if (scalars.length !== layerScalarCount * 15) {
		throw new Error('Control Native48 page scalar count changed.');
	}
	if (validityMask.length !== layerScalarCount) {
		throw new Error('Control Native48 validity count changed.');
	}
	const wavelengthLayers = Array.from({length: 15}, (_unused, index) =>
		scalars.subarray(index * layerScalarCount, (index + 1) * layerScalarCount));
	const buildRequest = createPocBuildRequest({
		id: 'san-jose-solar-noon-native48-validity-aware-runtime-v1',
		scenePageDefinitions: [{
			id: 'solar-noon-native15-c4-page-v1',
			scene,
		}],
	});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		preserveDrawingBuffer: true,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const common = {
		gl,
		canvas,
		buildRequest,
		wavelengthLayers,
		celestialMatrix: new Uint16Array(640 * 400),
		celestialPalette: new Float32Array(15),
		paletteEntryCount: 1,
		luminanceLiftGamma: 1,
		maximumLuminanceGain: 32768,
		analyticSunEnabled: true,
	};
	const control = renderScenePage(common);
	await uploadRender('control-unmasked', control.imagePngDataUrl);
	delete control.imagePngDataUrl;
	const candidate = renderScenePage({...common, validityMask});
	await uploadRender('candidate-validity-aware', candidate.imagePngDataUrl);
	delete candidate.imagePngDataUrl;
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	return {
		schemaId: 'san-jose-solar-noon-native48-validity-aware-runtime-result-v1',
		scene,
		page: {
			positionDomainId: buildRequest.scenePageRequests[0].domains.position.id,
			positionCount: 48,
			pageBytes: pageBuffer.byteLength,
			validityBytes: validityBuffer.byteLength,
			validCount: validityMask.reduce((sum, value) => sum + value, 0),
			invalidCount: validityMask.reduce(
				(sum, value) => sum + (value === 0 ? 1 : 0), 0),
		},
		control,
		candidate,
		changedVariable: 'runtime interpolation excludes invalid taps and renormalizes surviving weights',
		gpu: {
			api: gl.getParameter(gl.VERSION),
			vendor: debug
				? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
				: gl.getParameter(gl.VENDOR),
			renderer: debug
				? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER),
		},
	};
}
