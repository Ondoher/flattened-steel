import {createSanJoseNauticalPocBuildRequest} from '../san-jose-nautical-cache-poc/index.js';
import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {MISSING_CACHE_SCENES} from './sixSceneDefinitions.js';

async function postBinary(path, view) {
	const body = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(path, {method: 'POST', body});
	if (!response.ok) throw new Error(`Upload failed: ${path}.`);
}

export async function runP7SixSceneCompilerBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSanJoseNauticalPocBuildRequest();
	const sceneCacheRequests = MISSING_CACHE_SCENES.map((scene) => ({
		cacheIdentity: scene.cacheIdentity, ledger: buildSceneInventoryLedger(scene)}));
	const wavelengths = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`six-scene-cache-wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({gl, buildRequest, wavelengthIndex,
			compileSceneCaches: true, sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
			onSceneCacheLayer: async ({cacheIndex, values}) => postBinary(
				`/artifact/cache-${cacheIndex}-layer-${wavelengthIndex}.f32`, values)});
		wavelengths.push(result);
	}
	return {schemaId: 'point-local-p7-six-scene-compiler-browser-v1',
		gpu: {api: gl.getParameter(gl.VERSION), renderer: debug
			? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		ledgers: sceneCacheRequests.map((request) => ({cacheIdentity: request.cacheIdentity,
			retainedBlockCount: request.ledger.retainedBlockCount})), wavelengths};
}
