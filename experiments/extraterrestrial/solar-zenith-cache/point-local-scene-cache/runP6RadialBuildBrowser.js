import {executeZp3GpuRecurrence} from './P6RadialGpuRecurrence.js';
import {createP6RadialBuildRequest} from './p6RadialBuildRequest.js';
import {buildP6RadialLedger} from './p6RadialLedger.js';

async function postBinary(path, view) {
	const body = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	const response = await fetch(path, {method: 'POST', body});
	if (!response.ok) throw new Error(`Upload failed: ${path}.`);
}

export async function runP6RadialBuildBrowser() {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {alpha: false, antialias: false,
		depth: false, stencil: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('WebGL2 is unavailable.');
	const debug = gl.getExtension('WEBGL_debug_renderer_info');
	const buildRequest = createP6RadialBuildRequest();
	const page = buildRequest.scenePageRequests[0];
	const ledger = buildP6RadialLedger({
		scene: page.scene,
		positionDomain: buildRequest.transportSpec.domains.position,
	});
	const sceneCacheRequests = [{cacheIdentity: ledger.cacheIdentity, ledger}];
	const wavelengths = [];
	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.pointLocalProgress?.(`p6-radial-wavelength-${wavelengthIndex}:start`);
		const result = await executeZp3GpuRecurrence({
			gl,
			buildRequest,
			wavelengthIndex,
			compileSceneCaches: true,
			sceneCacheRequests,
			reportProgress: async (stage) => globalThis.pointLocalProgress?.(stage),
			onSceneCacheLayer: async ({values}) => {
				await postBinary(`/artifact/layer-${wavelengthIndex}.f32`, values);
			},
		});
		wavelengths.push(result);
		await globalThis.pointLocalProgress?.(`p6-radial-wavelength-${wavelengthIndex}:complete`);
	}
	return {
		schemaId: 'point-local-p6-radial-build-browser-result-v1',
		gpu: {api: gl.getParameter(gl.VERSION),
			renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER)},
		positionDomain: buildRequest.transportSpec.domains.position,
		ledgerSummary: {retainedBlockCount: ledger.retainedBlockCount},
		wavelengths,
	};
}

