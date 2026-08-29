import {createSanJoseNauticalPocBuildRequest} from '../san-jose-nautical-cache-poc/index.js';
import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';

async function postBinary(path, view) {
	const body = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(path, {method: 'POST', body});
	if (!response.ok) throw new Error(`Upload failed: ${path}.`);
}

export async function runP3Browser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSanJoseNauticalPocBuildRequest();
	const sceneCacheRequests = CONTRACT.scenes.map((scene) => ({
		cacheIdentity: scene.cacheIdentity,
		ledger: buildSceneInventoryLedger(scene),
	}));
	const wavelengths = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`p3-wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({
			gl, buildRequest, wavelengthIndex, compileSceneCaches: true,
			sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
			onSceneCacheLayer: async ({cacheIndex, values}) => {
				await postBinary(`/artifact/cache-${cacheIndex}-layer-${wavelengthIndex}.f32`, values);
			},
		});
		wavelengths.push(result);
		await globalThis.pointLocalProgress?.(`p3-wavelength-${wavelengthIndex}:complete`);
	}
	return {
		schemaId: 'point-local-scene-cache-p3-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		ledgerSummaries: sceneCacheRequests.map((request) => ({
			cacheIdentity: request.cacheIdentity,
			retainedBlockCount: request.ledger.retainedBlockCount,
		})),
		wavelengths,
	};
}

