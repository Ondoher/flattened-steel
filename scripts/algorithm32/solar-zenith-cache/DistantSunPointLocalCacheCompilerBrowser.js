import {compileDistantSunSceneCacheWavelength} from './DistantSunSceneCacheGpuCompiler.js';

/** Browser-side single-context executor for a variable point-local scene union. */
export default class DistantSunPointLocalCacheCompilerBrowser {
	/** Run-scoped control capability supplied by the host. @type {URL} */ _base;

	/** Create a browser executor without deriving its control routes from source-module placement.
	 * @param {URL} [base] - Host-issued capability root; omission retains direct-module hosting.
	 */
	constructor(base = new URL('.', import.meta.url)) {
		this._base = base;
	}

	async _post(route, value) {
		const response = await fetch(new URL(route, this._base), {
			method: 'POST',
			headers: {'content-type': 'application/json'},
			body: JSON.stringify(value),
		});
		if (!response.ok) throw new Error('Point-local compiler host rejected a control message.');
	}

	/** Execute each selected spectral channel once and stream bounded union tiles to the host. */
	async run() {
		let gl = null;
		try {
			const response = await fetch(new URL('control', this._base), {cache: 'no-store'});
			if (!response.ok) throw new Error('Point-local compiler control is unavailable.');
			const control = await response.json();
			gl = document.createElement('canvas').getContext('webgl2', {
				alpha: false,
				antialias: false,
				depth: false,
				stencil: false,
				powerPreference: 'high-performance',
			});
			if (!gl) throw new Error('Point-local compilation requires WebGL2.');
			const debug = gl.getExtension('WEBGL_debug_renderer_info');
			const started = performance.now();
			const wavelengths = [];
			for (const [channel, wavelengthIndex] of control.wavelengths.entries()) {
				await this._post('progress', {phase: 'wavelength-start', channel, wavelengthIndex});
				const result = await compileDistantSunSceneCacheWavelength({
					gl,
					buildRequest: control.buildRequest,
					wavelengthIndex,
					compileSceneCaches: true,
					sceneCacheRequests: [{cacheIdentity: 'production-point-local-union', ledger: control.unionLedger}],
					reportProgress: (stage) =>
						this._post('progress', {phase: 'gpu-stage', channel, wavelengthIndex, stage}),
					onSceneCacheTile: async ({firstPackedRow, values}) => {
						const body = values.buffer.slice(values.byteOffset, values.byteOffset + values.byteLength);
						const upload = await fetch(new URL(`tile/${channel}/${firstPackedRow}`, this._base), {
							method: 'POST',
							body,
						});
						if (!upload.ok) throw new Error('Point-local compiler host rejected a cache tile.');
					},
				});
				wavelengths.push({channel, wavelengthIndex, result});
				await this._post('progress', {phase: 'wavelength-complete', channel, wavelengthIndex});
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
				maximumReadbackBytes: 64 * control.logicalDirectionCount * Float32Array.BYTES_PER_ELEMENT,
				unionAccumulatorBytes:
					2 *
					control.unionLedger.retainedBlockCount *
					control.logicalDirectionCount *
					Float32Array.BYTES_PER_ELEMENT,
			});
		} catch (error) {
			await this._post('complete', {
				accepted: false,
				error: error instanceof Error ? error.stack : String(error),
			});
		} finally {
			gl?.getExtension('WEBGL_lose_context')?.loseContext();
		}
	}
}
