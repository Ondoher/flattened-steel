import {compileDistantSunSceneCacheWavelength} from './DistantSunSceneCacheGpuCompiler.js';

/** Production common-field recurrence browser executor. */
export default class DistantSunSharedCacheGeneratorBrowser {
	/**
	 * Capability-scoped loopback base URL supplied by the host module location.
	 *
	 * @type {URL}
	 */ _base = new URL('.', import.meta.url);

	/**
	 * Delivers bounded JSON control-plane information to the capability-scoped host.
	 *
	 * @param {string} route - Host-owned route.
	 * @param {unknown} value - JSON-safe data.
	 * @returns {Promise<void>} - Completion after acceptance.
	 */
	async _post(route, value) {
		const response = await fetch(new URL(route, this._base), {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(value),
		});
		if (!response.ok) throw new Error('Generation host rejected progress or completion.');
	}

	/**
	 * Call this method to run the authenticated host's complete Native15 generation request.
	 * Unavailable GPU capabilities, invalid control input, failed readback, or rejected host delivery aborts execution; the host must abandon the run.
	 *
	 * @returns {Promise<void>} - Completion after the host accepts the GPU result.
	 */
	async run() {
		let gl = null;
		try {
			const response = await fetch(new URL('control', this._base), {cache: 'no-store'});
			if (!response.ok) throw new Error('Generation control is unavailable.');
			const control = await response.json();
			const canvas = document.createElement('canvas');
			gl = canvas.getContext('webgl2', {
				alpha: false,
				antialias: false,
				depth: false,
				stencil: false,
				powerPreference: 'high-performance',
			});
			if (!gl) throw new Error('Production shared generation requires WebGL2.');
			const debug = gl.getExtension('WEBGL_debug_renderer_info');
			const started = performance.now();
			const wavelengths = [];
			for (let wavelengthIndex = 0; wavelengthIndex < 15; wavelengthIndex += 1) {
				const result = await compileDistantSunSceneCacheWavelength({
					gl,
					buildRequest: control.buildRequest,
					wavelengthIndex,
					compileSceneCaches: true,
					sceneCacheRequests: [{cacheIdentity: 'production-shared-union', ledger: control.unionLedger}],
					reportProgress: (stage) => this._post('progress', {wavelengthIndex, stage}),
					onSceneCacheTile: async ({firstPackedRow, values}) => {
						const upload = await fetch(new URL(`tile/${wavelengthIndex}/${firstPackedRow}`, this._base), {
							method: 'POST',
							body: values.buffer,
						});
						if (!upload.ok) throw new Error('The host rejected a generation tile.');
					},
				});
				wavelengths.push(result);
			}
			await this._post('complete', {
				accepted: true,
				elapsedMilliseconds: performance.now() - started,
				wavelengths,
				userAgent: navigator.userAgent,
				gpu: {
					api: gl.getParameter(gl.VERSION),
					renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
				},
				maximumReadbackBytes: 64 * 4374 * 4,
				unionAccumulatorBytes: 2 * control.unionLedger.retainedBlockCount * 4374 * 4,
			});
		} catch (error) {
			await this._post('complete', {
				accepted: false,
				error: error instanceof Error ? error.message : String(error),
			});
		} finally {
			gl?.getExtension('WEBGL_lose_context')?.loseContext();
		}
	}
}
