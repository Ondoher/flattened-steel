import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {renderP6RadialDiagnostic} from './P6RadialDiagnosticRenderer.js';
import {createP6RadialBuildRequest} from './p6RadialBuildRequest.js';
import {traceP6Pixel} from './p6RadialTrace.js';

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`Image upload failed: ${path}.`);
}

async function loadCache(prefix, payloadName, ledgerName) {
	const [payloadResponse, ledgerResponse] = await Promise.all([
		fetch(`${prefix}${payloadName}`), fetch(`${prefix}${ledgerName}`),
	]);
	if (!payloadResponse.ok || !ledgerResponse.ok) throw new Error('Diagnostic cache fetch failed.');
	return {payload: new Float32Array(await payloadResponse.arrayBuffer()),
		ledger: await ledgerResponse.json()};
}

async function executeVariant({gl, canvas, id, buildRequest, payload, ledger}) {
	const displays = [];
	for (const displayMode of ['retained', 'linear-quarter-exposure', 'chromaticity']) {
		await globalThis.pointLocalProgress?.(`p6-diagnostic-${id}-${displayMode}:render`);
		const rendered = renderP6RadialDiagnostic({gl, canvas, buildRequest,
			payload, ledger, luminanceLiftGamma: 1, displayMode});
		await postImage(`/artifact/${id}-${displayMode}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		displays.push({displayMode, rendered});
	}
	const pixels = [
		{label: 'blue-sky-control', screenX: 320, screenY: 80},
		{label: 'gray-band-focus', screenX: 320, screenY: 220},
		{label: 'ground-control', screenX: 320, screenY: 260},
	];
	const traces = pixels.map((pixel) => traceP6Pixel({
		...pixel, buildRequest, payload, ledger,
	}));
	return {id, positionDomain: buildRequest.transportSpec.domains.position,
		ledgerBlockCount: ledger.retainedBlockCount, displays, traces};
}

export async function runP6RadialDiagnosticBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const controlRequest = createPocBuildRequest({
		id: 'p6-control-runtime-v1',
		scenePageDefinitions: [{id: 'p6-control-solar-noon', scene: solarNoon}],
	});
	const radialRequest = createP6RadialBuildRequest();
	await globalThis.pointLocalProgress?.('p6-diagnostic-control:load');
	const controlCache = await loadCache('/p3/cache/',
		'solar-noon-native15-c4-w39.f32', 'solar-noon-packed-row-ledger.json');
	const control = await executeVariant({gl, canvas, id: 'native48-control',
		buildRequest: controlRequest, ...controlCache});
	await globalThis.pointLocalProgress?.('p6-diagnostic-radial:load');
	const radialCache = await loadCache('/p6/cache/',
		'solar-noon-p6-radial-native15-c4-w39.f32',
		'solar-noon-p6-radial-packed-row-ledger.json');
	const radial = await executeVariant({gl, canvas, id: 'quadratic48-radial',
		buildRequest: radialRequest, ...radialCache});
	return {schemaId: 'point-local-p6-radial-diagnostic-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		variants: [control, radial],
		isolatedControls: {scene: 'San Jose solar noon', wavelengths: 'Native15',
			solarZenith: 'Z180', incoming: 'F68', outgoing: 'W39', maximumOrder: 4,
			atmosphere: 'unchanged including ozone', camera: 'unchanged',
			pathIntervals: 15, changed: '48-node altitude distribution only'},
	};
}

