import {buildSceneInventoryLedger} from './buildInventoryLedger.js';
import {executeZp3GpuRecurrence} from './PointLocalGpuRecurrence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from './sceneCacheContract.js';
import {createSelectedW27BuildRequest} from './selectedW27BuildRequest.js';

async function postBinary(path, view) {
	const body = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(path, {method: 'POST', body});
	if (!response.ok) throw new Error(`Upload failed: ${path}.`);
}

export async function runP9W27AssetBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createSelectedW27BuildRequest();
	const scene = CONTRACT.scenes.find((item) => item.id === 'nautical-twilight');
	const ledger = buildSceneInventoryLedger(scene);
	const request = {cacheIdentity: scene.cacheIdentity, ledger};
	const wavelengths = [];
	const started = performance.now();
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`p9-w27-wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({
			gl, buildRequest, wavelengthIndex, compileSceneCaches: true,
			sceneCacheRequests: [request],
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
			onSceneCacheLayer: async ({values}) => {
				await postBinary(`/artifact/w27-layer-${wavelengthIndex}.f32`, values);
			},
		});
		wavelengths.push(result);
		await globalThis.pointLocalProgress?.(`p9-w27-wavelength-${wavelengthIndex}:complete`);
	}
	return {
		schemaId: 'point-local-p9-w27-asset-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)},
		capabilities: {maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maximumArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
			maximum3dTextureSize: gl.getParameter(gl.MAX_3D_TEXTURE_SIZE)},
		elapsedMilliseconds: performance.now() - started,
		ledgerSummary: {retainedBlockCount: ledger.retainedBlockCount,
			logicalBytes: ledger.memory.packedRows.W27.bytes},
		wavelengths,
	};
}
