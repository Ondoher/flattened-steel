import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {renderP6ViewQuadrature} from './P6ViewQuadratureRenderer.js';
import {traceP6ViewQuadraturePixel} from './p6ViewQuadratureTrace.js';

const VARIANTS = Object.freeze([
	Object.freeze({id: 'uniform-15-control', pathIntervalCount: 15,
		pathDistribution: 'uniform'}),
	Object.freeze({id: 'quadratic-15', pathIntervalCount: 15,
		pathDistribution: 'quadratic-near-observer'}),
	Object.freeze({id: 'quadratic-30', pathIntervalCount: 30,
		pathDistribution: 'quadratic-near-observer'}),
	Object.freeze({id: 'quadratic-60', pathIntervalCount: 60,
		pathDistribution: 'quadratic-near-observer'}),
]);

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`P6.4 render upload failed: ${path}.`);
}

function spectrumSummary(values) {
	const magnitude = values.reduce((sum, value) => sum + value, 0);
	return {magnitude, normalizedShape: values.map((value) => value / magnitude)};
}

export async function runP6ViewQuadratureBrowser() {
	const [payloadResponse, ledgerResponse] = await Promise.all([
		fetch('/p3/cache/solar-noon-native15-c4-w39.f32'),
		fetch('/p3/cache/solar-noon-packed-row-ledger.json'),
	]);
	if (!payloadResponse.ok || !ledgerResponse.ok) throw new Error('Canonical P3 cache is unavailable.');
	const payload = new Float32Array(await payloadResponse.arrayBuffer());
	const ledger = await ledgerResponse.json();
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const buildRequest = createPocBuildRequest({id: 'p6-view-quadrature-solar-noon-v1',
		scenePageDefinitions: [{id: 'p6-view-quadrature-frame', scene: solarNoon}]});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const pixels = [
		{label: 'blue-sky-control', screenX: 320, screenY: 80},
		{label: 'gray-band-focus', screenX: 320, screenY: 220},
		{label: 'ground-control', screenX: 320, screenY: 260},
	];
	const results = [];
	for (const variant of VARIANTS) {
		await globalThis.pointLocalProgress?.(`p6-view-${variant.id}:render`);
		const rendered = renderP6ViewQuadrature({gl, canvas, buildRequest,
			payload, ledger, luminanceLiftGamma: 1, displayMode: 'retained',
			pathIntervalCount: variant.pathIntervalCount,
			pathDistribution: variant.pathDistribution});
		await postImage(`/artifact/${variant.id}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		const traces = pixels.map((pixel) => traceP6ViewQuadraturePixel({
			...pixel, buildRequest, payload, ledger,
			pathIntervalCount: variant.pathIntervalCount,
			pathDistribution: variant.pathDistribution,
		}));
		results.push({...variant, rendered, traces,
			traceSummaries: Object.fromEntries(traces.map((trace) => [trace.label,
				{...spectrumSummary(trace.finalPathRadianceNative15),
					firstSample: {startDistanceMeters: trace.samples[0].startDistanceMeters,
						endDistanceMeters: trace.samples[0].endDistanceMeters,
						distanceMeters: trace.samples[0].distanceMeters,
						altitudeMeters: trace.samples[0].altitudeMeters,
						stepMeters: trace.samples[0].stepMeters}},
			]))});
	}
	return {schemaId: 'point-local-p6-view-quadrature-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		isolatedControls: {cache: 'unchanged run-000520 canonical solar-noon cache',
			changed: 'camera-path interval count and distance distribution only',
			retained: 'Geometry ray endpoint, Native48, Z180, F68, W39, N4, atmosphere, camera, black ground, display'},
		variants: results};
}

