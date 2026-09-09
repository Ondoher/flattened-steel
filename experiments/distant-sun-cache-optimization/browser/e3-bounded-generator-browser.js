// @ts-expect-error The contained E3 loopback host owns this allowlisted production compiler URL.
import {compileDistantSunSceneCacheWavelength} from '/repository/scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/**
 * Upload one bounded projected scene layer to the E3 staging host.
 *
 * @param {number} wavelengthIndex - Native15 wavelength ordinal.
 * @param {number} sceneIndex - Control scene-ledger ordinal.
 * @param {Float32Array} values - Exact logical-W27 packed layer values.
 * @returns {Promise<void>} - Completion after the host persistently scatters the layer.
 */
async function uploadLayer(wavelengthIndex, sceneIndex, values) {
	const body = /** @type {ArrayBuffer} */ (values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength));
	const response = await fetch(`/artifact/layer/${wavelengthIndex}/scene/${sceneIndex}`, {method: 'POST', body});
	if (!response.ok) throw new Error(`E3 layer upload ${wavelengthIndex}/${sceneIndex} failed with HTTP ${response.status}.`);
}

/**
 * Compile every accepted ledger through one full GPU recurrence per wavelength.
 * The host supplies only immutable controls and accepts bounded layer writes; it
 * never exposes a production package directory for mutation.
 *
 * @returns {Promise<Readonly<Record<string, unknown>>>} - Browser/GPU measurements and per-wavelength results.
 */
export async function runE3BoundedGeneratorBrowser() {
	const response = await fetch('/control.json', {cache: 'no-store'});
	if (!response.ok) throw new Error(`E3 control request failed with HTTP ${response.status}.`);
	const control = await response.json();
	if (!Number.isInteger(control.channelCount) || control.channelCount < 1 || !Array.isArray(control.sceneCacheRequests)) {
		throw new TypeError('E3 control is missing bounded wavelength or ledger facts.');
	}
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('E3 bounded generation requires WebGL2.');
	const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
	const wavelengths = [];
	const started = performance.now();
	try {
		for (let wavelengthIndex = 0; wavelengthIndex < control.channelCount; wavelengthIndex += 1) {
			await globalThis.e3GeneratorProgress?.({phase: 'compute', wavelengthIndex, state: 'start'});
			const result = await compileDistantSunSceneCacheWavelength({
				gl,
				buildRequest: control.buildRequest,
				wavelengthIndex,
				compileSceneCaches: true,
				sceneCacheRequests: control.sceneCacheRequests,
				reportProgress: async (stage) => globalThis.e3GeneratorProgress?.({phase: 'compute', wavelengthIndex, stage}),
				onSceneCacheLayer: async ({cacheIndex, values}) => uploadLayer(wavelengthIndex, cacheIndex, values),
			});
			wavelengths.push(result);
			await globalThis.e3GeneratorProgress?.({phase: 'compute', wavelengthIndex, state: 'complete'});
		}
		return {
			schemaId: 'distant-sun-cache-optimization-e3-browser-v1',
			gpu: {
				api: gl.getParameter(gl.VERSION),
				renderer: debugRenderer ? gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			},
			elapsedMilliseconds: performance.now() - started,
			wavelengths,
		};
	} finally {
		canvas.remove();
	}
}
