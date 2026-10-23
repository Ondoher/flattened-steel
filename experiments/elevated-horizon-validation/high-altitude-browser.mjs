import {compileDistantSunSceneCacheWavelength} from '../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';

/** Rebuild complete fields on real WebGL2 hardware; retain requested probes and release all resources. */
globalThis['highAltitudeExecute'] = async function (control) {
	const canvas = document.createElement('canvas');
	const gl = canvas.getContext('webgl2', {antialias: false});
	if (!gl) throw new Error('WebGL2 unavailable');
	const outputs = [];
	try {
		for (const channel of control.channels) {
			const orders = [];
			const report = await compileDistantSunSceneCacheWavelength({
				gl,
				buildRequest: control.request,
				wavelengthIndex: channel,
				reportProgress: async (stage) => globalThis['highAltitudeProgress'](String(stage)),
				fieldProbeCoordinates: Object.fromEntries([1, 2, 3, 4].map((i) => ['J' + i, control.coordinates])),
				onFieldProbes: async (r) => {
					if (/^J[1-4]$/.test(r.fieldId)) orders.push(r.values.map((v) => v.value));
				},
			});
			if (orders.length !== 4 || gl.getError() !== gl.NO_ERROR) throw new Error('Incomplete or failed GPU probe');
			await globalThis['highAltitudeChannel']({channel, orders, report});
			outputs.push({channel, report});
		}
		const ext = gl.getExtension('WEBGL_debug_renderer_info');
		return {
			outputs,
			renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
			maximumTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
		};
	} finally {
		gl.getExtension('WEBGL_lose_context')?.loseContext();
	}
};
