import {createPocBuildRequest} from
	'../san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js';
import {SAN_JOSE_NAUTICAL_SCENE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseNauticalScene.js';
import {SAN_JOSE_SCATTERING_SCENE_SEQUENCE} from
	'../san-jose-nautical-cache-poc/fixtures/sanJoseScatteringSceneSequence.js';
import {renderP6Quadratic30Qualification} from './P6Quadratic30QualificationRenderer.js';
import {traceP6QuadratureQualificationPixel} from './p6QuadratureQualificationTrace.js';

const OBJECT_SHORTENING = Object.freeze({enabled: true, distanceMeters: 10000,
	screenRect: Object.freeze([220, 120, 420, 300]), endpoint: 'opaque black'});

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
	if (!response.ok) throw new Error(`P6.5 image upload failed: ${path}.`);
}

function compareSpectra(candidate, reference) {
	const candidateMagnitude = candidate.reduce((sum, value) => sum + value, 0);
	const referenceMagnitude = reference.reduce((sum, value) => sum + value, 0);
	const candidateShape = candidate.map((value) => value / candidateMagnitude);
	const referenceShape = reference.map((value) => value / referenceMagnitude);
	return {candidateMagnitude, referenceMagnitude,
		magnitudeRelativeError: Math.abs(candidateMagnitude - referenceMagnitude)
			/ Math.max(Math.abs(referenceMagnitude), 1e-30),
		maximumAbsoluteShapeDifference: Math.max(...candidateShape.map((value, index) =>
			Math.abs(value - referenceShape[index]))),
		candidateNative15: candidate, referenceNative15: reference};
}

function qualifyRay({id, scenePageIndex, screenX, screenY, maximumVisibleLengthMeters,
	buildRequest, payload, ledger}) {
	const common = {label: id, screenX, screenY, buildRequest, payload, ledger,
		scenePageIndex, maximumVisibleLengthMeters};
	// The trace reads page zero; construct a one-page view for the requested scene.
	const pageBuildRequest = {...buildRequest,
		scenePageRequests: [buildRequest.scenePageRequests[scenePageIndex]]};
	const candidate = traceP6QuadratureQualificationPixel({...common,
		buildRequest: pageBuildRequest, pathIntervalCount: 30,
		pathDistribution: 'quadratic-near-observer'});
	const reference = traceP6QuadratureQualificationPixel({...common,
		buildRequest: pageBuildRequest, pathIntervalCount: 960,
		pathDistribution: 'uniform'});
	return {id, sceneId: pageBuildRequest.scenePageRequests[0].scene.id,
		screen: {x: screenX, y: screenY}, maximumVisibleLengthMeters,
		candidate: {lengthMeters: candidate.lengthMeters, groundHit: candidate.groundHit,
			objectHit: candidate.objectHit, firstSample: candidate.samples[0]},
		reference: {lengthMeters: reference.lengthMeters, groundHit: reference.groundHit,
			objectHit: reference.objectHit, firstSample: reference.samples[0]},
		comparison: compareSpectra(candidate.finalPathRadianceNative15,
			reference.finalPathRadianceNative15)};
}

export async function runP6Quadratic30QualificationBrowser() {
	const solarNoon = SAN_JOSE_SCATTERING_SCENE_SEQUENCE.find((scene) => scene.id === 'solar-noon');
	const buildRequest = createPocBuildRequest({id: 'p6-q30-qualification-two-scene-v1',
		scenePageDefinitions: [
			{id: 'p6-q30-solar-noon', scene: solarNoon},
			{id: 'p6-q30-nautical', scene: SAN_JOSE_NAUTICAL_SCENE},
		]});
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, preserveDrawingBuffer: true,
		powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const renders = [];
	const rayQualifications = [];
	const render = async ({id, scenePageIndex, payload, ledger, count, gamma, objectShortening}) => {
		await globalThis.pointLocalProgress?.(`p6-q30-${id}:render`);
		const rendered = renderP6Quadratic30Qualification({gl, canvas, buildRequest,
			payload, ledger, scenePageIndex, luminanceLiftGamma: gamma,
			pathIntervalCount: count, pathDistribution: 'quadratic-near-observer',
			objectShortening});
		await postImage(`/artifact/${id}.png`, rendered.imagePngDataUrl);
		delete rendered.imagePngDataUrl;
		renders.push({id, scenePageIndex, rendered});
	};
	const solar = await loadCache('solar-noon');
	await render({id: 'solar-noon-q30', scenePageIndex: 0, ...solar, count: 30, gamma: 1});
	await render({id: 'solar-noon-q60', scenePageIndex: 0, ...solar, count: 60, gamma: 1});
	await render({id: 'object-10km-q30', scenePageIndex: 0, ...solar, count: 30,
		gamma: 1, objectShortening: OBJECT_SHORTENING});
	await render({id: 'object-10km-q60', scenePageIndex: 0, ...solar, count: 60,
		gamma: 1, objectShortening: OBJECT_SHORTENING});
	for (const definition of [
		{id: 'solar-upward', screenX: 320, screenY: 80},
		{id: 'solar-horizon', screenX: 320, screenY: 220},
		{id: 'solar-ground-hit', screenX: 320, screenY: 260},
		...([100, 1000, 10000, 50000].flatMap((maximumVisibleLengthMeters) => [
			{id: `solar-horizon-object-${maximumVisibleLengthMeters}m`, screenX: 320,
				screenY: 220, maximumVisibleLengthMeters},
			{id: `solar-upward-object-${maximumVisibleLengthMeters}m`, screenX: 320,
				screenY: 80, maximumVisibleLengthMeters},
		])),
	]) rayQualifications.push(qualifyRay({...definition, scenePageIndex: 0,
		buildRequest, ...solar}));
	const nautical = await loadCache('nautical-twilight');
	await render({id: 'nautical-q30', scenePageIndex: 1, ...nautical, count: 30, gamma: 0.125});
	await render({id: 'nautical-q60', scenePageIndex: 1, ...nautical, count: 60, gamma: 0.125});
	for (const definition of [
		{id: 'nautical-upward', screenX: 320, screenY: 80},
		{id: 'nautical-horizon', screenX: 320, screenY: 220},
		{id: 'nautical-ground-hit', screenX: 320, screenY: 260},
	]) rayQualifications.push(qualifyRay({...definition, scenePageIndex: 1,
		buildRequest, ...nautical}));
	return {schemaId: 'point-local-p6-q30-qualification-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		candidate: {pathIntervalCount: 30, distribution: 't=L*u^2 piecewise midpoint'},
		reference: {fullFrame: 'quadratic 60', sparse: 'uniform 960'},
		objectShortening: OBJECT_SHORTENING,
		renders, rayQualifications};
}

