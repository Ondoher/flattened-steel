import {compileDistantSunSceneCacheWavelength} from './DistantSunSceneCacheGpuCompiler.js';

/** Read all four pure production recurrence orders at the declared field probes. */
export async function runOfflineCompilerBrowser() {
	const control = await (await fetch('/control.json')).json();
	const gl = document
		.createElement('canvas')
		.getContext('webgl2', {antialias: false, powerPreference: 'high-performance'});
	if (!gl) throw new Error('Recurrence proof requires WebGL2.');
	const reports = [];
	for (const [index, request] of control.requests.entries()) {
		const fields = {};
		const fieldIds = request.fields ?? ['J1', 'J2', 'J3', 'J4'];
		const report = await compileDistantSunSceneCacheWavelength({
			gl,
			buildRequest: request.buildRequest,
			wavelengthIndex: request.channel,
			compileSceneCaches: false,
			fieldProbeCoordinates: Object.fromEntries(fieldIds.map((field) => [field, request.coordinates])),
			reportProgress: async (stage) => globalThis.offlineCompilerProgress?.(`${index}:${stage}`),
			onFieldProbes: async ({fieldId, values}) => {
				fields[fieldId] = values;
			},
		});
		const values = new Float32Array(fieldIds.flatMap((field) => fields[field].map((entry) => entry.value)));
		const response = await fetch(`/artifact/layer-${index}.f32`, {method: 'POST', body: values.buffer});
		if (!response.ok) throw new Error('Recurrence readback upload failed.');
		reports.push(report);
	}
	return {reports};
}
