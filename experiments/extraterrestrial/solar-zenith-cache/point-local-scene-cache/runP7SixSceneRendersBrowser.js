import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {renderP6Quadratic30Qualification} from './P6Quadratic30QualificationRenderer.js';
import {SIX_SCENE_FIXTURES} from './sixSceneDefinitions.js';

const BASE_SCENES = new Set(['sunset-plus-one-hour', 'solar-noon']);
const cacheName = (sceneId) => sceneId === 'sunset-plus-one-hour' ? 'nautical-twilight' : sceneId;

async function loadCache(sceneId) {
	const root = BASE_SCENES.has(sceneId) ? '/base/' : '/extra/';
	const name = cacheName(sceneId);
	const [payloadResponse, ledgerResponse] = await Promise.all([
		fetch(`${root}cache/${name}-native15-c4-w39.f32`),
		fetch(`${root}cache/${name}-packed-row-ledger.json`),
	]);
	if (!payloadResponse.ok || !ledgerResponse.ok) throw new Error(`${sceneId} cache is unavailable.`);
	return {payload: new Float32Array(await payloadResponse.arrayBuffer()),
		ledger: await ledgerResponse.json()};
}

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`Six-scene image upload failed: ${path}.`);
}

export async function runP7SixSceneRendersBrowser() {
	const buildRequest = createPocBuildRequest({id: 'p7-six-scene-renders-v1',
		scenePageDefinitions: SIX_SCENE_FIXTURES.map((scene) => ({
			id: `${scene.id}-point-local-cache-v1`, scene}))});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renders = [];
	for (let scenePageIndex = 0; scenePageIndex < SIX_SCENE_FIXTURES.length; scenePageIndex += 1) {
		const scene = SIX_SCENE_FIXTURES[scenePageIndex];
		await globalThis.pointLocalProgress?.(`six-scene-render-${scene.id}:load`);
		const cache = await loadCache(scene.id);
		const gamma = scene.solarElevationDegrees < 0 ? 0.125 : 1;
		const rendered = renderP6Quadratic30Qualification({gl, canvas, buildRequest,
			...cache, scenePageIndex, luminanceLiftGamma: gamma,
			pathIntervalCount: 30, pathDistribution: 'quadratic-near-observer'});
		await postImage(`/artifact/${scene.id}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		renders.push({scenePageIndex, sceneId: scene.id, timeLabel: scene.timeLabel
			?? '1 hour after sunset', timeIso: scene.timeIso,
			solarElevationDegrees: scene.solarElevationDegrees, displayGamma: gamma, rendered});
	}
	return {schemaId: 'point-local-p7-six-scene-renders-browser-v1',
		integration: {count: 30, distribution: 't=L*u^2 piecewise midpoint'},
		display: 'gamma 1 while source-lit; 0.125 after geometric sunset', renders,
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)}};
}
