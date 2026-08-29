import {createPocBuildRequest} from '../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_NAUTICAL_SCENE} from '../san-jose-nautical-cache-poc/fixtures/sanJoseNauticalScene.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from '../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {renderPointLocalSceneCache} from './PointLocalSceneCacheRenderer.js';

async function postBinary(path, buffer) {
	const response = await fetch(path, {method: 'POST', body: buffer});
	if (!response.ok) throw new Error(`Render upload failed: ${path}.`);
}

function analyzePixels(pixels, width, height) {
	const rowMean = (screenY) => {
		const out = [0, 0, 0];
		for (let x = 0; x < width; x += 1) {
			const index = (screenY * width + x) * 4;
			for (let channel = 0; channel < 3; channel += 1) out[channel] += pixels[index + channel];
		}
		return out.map((value) => value / width);
	};
	const band = (x0, x1, y0, y1) => {
		let sum = 0, count = 0;
		for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
			const index = (y * width + x) * 4;
			sum += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
			count += 1;
		}
		return sum / count;
	};
	return {horizonRows: Object.fromEntries([180, 200, 220, 240].map((y) => [y, rowMean(y)])),
		sourceAxis: {center: band(300, 340, 190, 240), leftFlank: band(220, 260, 190, 240),
			rightFlank: band(380, 420, 190, 240)}};
}

async function analyzeImage(url) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Historical image fetch failed: ${url}.`);
	const bitmap = await createImageBitmap(await response.blob());
	const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
	const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0);
	const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
	bitmap.close();
	return {width: canvas.width, height: canvas.height, ...analyzePixels(pixels, canvas.width, canvas.height)};
}

export async function runP5Browser() {
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const buildRequest = createPocBuildRequest({id: 'point-local-p5-two-scene-runtime-v1',
		scenePageDefinitions: [
			{id: 'solar-noon-runtime-frame', scene: solarNoon},
			{id: 'nautical-twilight-runtime-frame', scene: SAN_JOSE_NAUTICAL_SCENE},
		]});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const definitions = [
		{sceneId: 'solar-noon', scenePageIndex: 0, gamma: 1},
		{sceneId: 'nautical-twilight', scenePageIndex: 1, gamma: 0.125},
	];
	const renders = [];
	for (const definition of definitions) {
		await globalThis.pointLocalProgress?.(`p5-${definition.sceneId}:load`);
		const [ledgerResponse, payloadResponse] = await Promise.all([
			fetch(`/p3/cache/${definition.sceneId}-packed-row-ledger.json`),
			fetch(`/p3/cache/${definition.sceneId}-native15-c4-w39.f32`),
		]);
		if (!ledgerResponse.ok || !payloadResponse.ok) throw new Error(`${definition.sceneId} P3 cache fetch failed.`);
		const ledger = await ledgerResponse.json();
		const payload = new Float32Array(await payloadResponse.arrayBuffer());
		await globalThis.pointLocalProgress?.(`p5-${definition.sceneId}:render`);
		const rendered = renderPointLocalSceneCache({gl, canvas, buildRequest,
			payload, ledger, luminanceLiftGamma: definition.gamma,
			scenePageIndex: definition.scenePageIndex});
		const png = await fetch(rendered.imagePngDataUrl).then((response) => response.arrayBuffer());
		await postBinary(`/artifact/${definition.sceneId}.png`, png);
		delete rendered.imagePngDataUrl;
		renders.push({sceneId: definition.sceneId, ledgerBlockCount: ledger.retainedBlockCount,
			displayGamma: definition.gamma, rendered});
		await globalThis.pointLocalProgress?.(`p5-${definition.sceneId}:complete`);
	}
	return {schemaId: 'point-local-scene-cache-p5-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		renderOrder: renders.map((render) => render.sceneId), renders,
		invariants: {cacheProvider: 'one complete point-local P3 scene cache at a time',
			observerProjection: false, validityMask: false, additiveActualPointCorrection: false,
			geometryRayLengthAndPathIntervals: 'unchanged 15-interval camera integration'},
	};
}
