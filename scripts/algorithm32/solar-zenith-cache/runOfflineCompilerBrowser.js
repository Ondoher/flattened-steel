import {compileDistantSunSceneCacheWavelength} from './DistantSunSceneCacheGpuCompiler.js';
import {DistantSunSceneCacheCompilerInputs} from './DistantSunSceneCacheCompilerInputs.js';

/**
 * Called by the offline compiler page to upload one completed wavelength layer.
 *
 * @param {number} wavelengthIndex - The Native15 wavelength-layer index.
 * @param {Float32Array} values - The complete logical-W27 packed layer.
 * @returns {Promise<void>} - Completion after the host accepts the immutable layer bytes.
 */
async function uploadLayer(wavelengthIndex, values) {
	const body = values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength);
	const response = await fetch(`/artifact/layer-${wavelengthIndex}.f32`, {method: 'POST', body});
	if (!response.ok) {
		throw new Error(`Offline compiler layer ${wavelengthIndex} upload failed.`);
	}
}

/**
 * Call this function in a WebGL2 browser to compile every Native15 wavelength for the selected scene.
 *
 * @returns {Promise<Readonly<Record<string, unknown>>>} - GPU identity, timings, shapes, and wavelength results.
 */
export async function runOfflineCompilerBrowser() {
	const control = await fetch('/control.json').then((response) => response.json());
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'high-performance',
	});
	if (!gl) {
		throw new Error('The offline distant-Sun compiler requires WebGL2.');
	}

	const inputSet = DistantSunSceneCacheCompilerInputs.createInputSet(control.scene, control);
	const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
	const wavelengths = [];
	const started = performance.now();

	for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
		await globalThis.offlineCompilerProgress?.(`wavelength-${wavelengthIndex}:start`);
		const result = await compileDistantSunSceneCacheWavelength({
			gl,
			buildRequest: inputSet.buildRequest,
			wavelengthIndex,
			compileSceneCaches: true,
			sceneCacheRequests: [
				{
					cacheIdentity: inputSet.scene.sceneSun.id,
					ledger: inputSet.ledger.toRecord(),
				},
			],
			reportProgress: async (stage) => globalThis.offlineCompilerProgress?.(stage),
			onSceneCacheLayer: async ({values}) => uploadLayer(wavelengthIndex, values),
		});
		wavelengths.push(result);
		await globalThis.offlineCompilerProgress?.(`wavelength-${wavelengthIndex}:complete`);
	}

	return {
		schemaId: 'algorithm32-distant-sun-offline-browser-result-v1',
		compilerIdentity: inputSet.compilerIdentity,
		numericalIdentity: inputSet.numericalIdentity,
		sceneSun: inputSet.scene.sceneSun,
		gpu: {
			api: gl.getParameter(gl.VERSION),
			renderer: debugRenderer
				? gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL)
				: gl.getParameter(gl.RENDERER),
		},
		capabilities: {
			maximumTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
			maximumArrayTextureLayers: gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS),
		},
		elapsedMilliseconds: performance.now() - started,
		retainedBlockCount: inputSet.ledger.retainedBlockCount,
		wavelengths,
	};
}
