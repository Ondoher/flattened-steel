import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_NAUTICAL_SCENE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseNauticalScene.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {renderP6Quadratic30Qualification} from './P6Quadratic30QualificationRenderer.js';

const SCENE_OBJECTS = Object.freeze([
	Object.freeze({id: 'near-left', distanceMeters: 2500, lateralMeters: -650,
		widthMeters: 500, depthMeters: 500, heightMeters: 450}),
	Object.freeze({id: 'middle-right', distanceMeters: 7000, lateralMeters: 850,
		widthMeters: 900, depthMeters: 700, heightMeters: 900}),
	Object.freeze({id: 'far-left', distanceMeters: 16000, lateralMeters: -1800,
		widthMeters: 1800, depthMeters: 1200, heightMeters: 1600}),
	Object.freeze({id: 'far-right', distanceMeters: 32000, lateralMeters: 2600,
		widthMeters: 2400, depthMeters: 1800, heightMeters: 2600}),
]);

async function loadCache(sceneId) {
	const [payloadResponse, ledgerResponse] = await Promise.all([
		fetch(`/p3/cache/${sceneId}-native15-c4-w39.f32`),
		fetch(`/p3/cache/${sceneId}-packed-row-ledger.json`),
	]);
	if (!payloadResponse.ok || !ledgerResponse.ok) throw new Error(`${sceneId} cache is unavailable.`);
	return {payload: new Float32Array(await payloadResponse.arrayBuffer()),
		ledger: await ledgerResponse.json()};
}

async function postImage(path, dataUrl) {
	const bytes = await fetch(dataUrl).then((response) => response.arrayBuffer());
	const response = await fetch(path, {method: 'POST', body: bytes});
	if (!response.ok) throw new Error(`Scene-object image upload failed: ${path}.`);
}

export async function runP7SceneObjectsBrowser() {
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const buildRequest = createPocBuildRequest({id: 'p7-scene-objects-two-scene-v1',
		scenePageDefinitions: [
			{id: 'p7-objects-solar-noon', scene: solarNoon},
			{id: 'p7-objects-nautical', scene: SAN_JOSE_NAUTICAL_SCENE},
		]});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renders = [];
	for (const definition of [
		{id: 'solar-noon-objects-q30', sceneId: 'solar-noon', scenePageIndex: 0, count: 30, gamma: 1},
		{id: 'solar-noon-objects-q60', sceneId: 'solar-noon', scenePageIndex: 0, count: 60, gamma: 1},
		{id: 'nautical-objects-q30', sceneId: 'nautical-twilight', scenePageIndex: 1, count: 30, gamma: 0.125},
		{id: 'nautical-objects-q60', sceneId: 'nautical-twilight', scenePageIndex: 1, count: 60, gamma: 0.125},
	]) {
		await globalThis.pointLocalProgress?.(`p7-${definition.id}:load`);
		const cache = await loadCache(definition.sceneId);
		const rendered = renderP6Quadratic30Qualification({gl, canvas, buildRequest,
			...cache, scenePageIndex: definition.scenePageIndex,
			luminanceLiftGamma: definition.gamma, pathIntervalCount: definition.count,
			pathDistribution: 'quadratic-near-observer', sceneObjects: SCENE_OBJECTS});
		await postImage(`/artifact/${definition.id}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		renders.push({...definition, rendered});
	}
	return {schemaId: 'point-local-p7-scene-objects-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		sceneObjects: SCENE_OBJECTS, renders};
}
