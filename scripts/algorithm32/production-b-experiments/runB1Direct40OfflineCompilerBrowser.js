import {compileDistantSunSceneCacheWavelength} from '../solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

function createFullProfileLedger(buildRequest) {
	const rows = buildRequest.transportSpec.domains.position.nodes.map((node, altitudeIndex) => ({
		altitudeIndex,
		altitude: {value: node.altitudeMeters, units: 'meters'},
		firstSolarZenithIndex: 0,
		lastSolarZenithIndex: 0,
		firstPackedRow: altitudeIndex,
		packedRowCount: 1,
	}));
	return {
		schemaId: 'algorithm32-b1-direct40-full-profile-ledger-v1',
		rows,
		retainedBlockCount: rows.length,
	};
}

async function uploadLayer(wavelengthIndex, values) {
	const body = values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength);
	const response = await fetch(`/artifact/layer-${wavelengthIndex}.f32`, {method: 'POST', body});
	if (!response.ok) throw new Error(`B1 direct-40 compiler layer ${wavelengthIndex} upload failed.`);
}

/** Compile one exact B1 condition through the production GPU recurrence. */
export async function runOfflineCompilerBrowser() {
	const control = await fetch('/control.json').then((response) => response.json());
	const buildRequest = control.buildRequest;

	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('The B1 direct-40 offline compiler requires WebGL2.');
	const debugRenderer = gl.getExtension('WEBGL_debug_renderer_info');
	const ledger = createFullProfileLedger(buildRequest);
	const wavelengths = [];
	const started = performance.now();

	for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
		await globalThis.offlineCompilerProgress?.(`wavelength-${wavelengthIndex}:start`);
		const result = await compileDistantSunSceneCacheWavelength({
			gl,
			buildRequest,
			wavelengthIndex,
			compileSceneCaches: true,
			sceneCacheRequests: [{cacheIdentity: control.profileIdentity.id, ledger}],
			reportProgress: async (stage) => globalThis.offlineCompilerProgress?.(stage),
			onSceneCacheLayer: async ({values}) => uploadLayer(wavelengthIndex, values),
		});
		wavelengths.push(result);
		await globalThis.offlineCompilerProgress?.(`wavelength-${wavelengthIndex}:complete`);
	}

	return {
		schemaId: 'algorithm32-b1-direct40-offline-browser-result-v1',
		compilerIdentity: control.compilerIdentity,
		profileIdentity: control.profileIdentity,
		numericalIdentity: control.numericalIdentity,
		condition: control.condition,
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
		retainedBlockCount: ledger.retainedBlockCount,
		wavelengths,
	};
}
