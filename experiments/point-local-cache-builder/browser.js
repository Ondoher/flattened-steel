import {compileDistantSunSceneCacheWavelength} from './compiler.js';

/** Calls the capability host with bounded progress or completion information.
 * @param {string} route - Host route.
 * @param {unknown} value - Serializable payload.
 * @returns {Promise<void>} - Completion after host acceptance.
 */
async function post(route, value) {
	const response = await fetch(new URL(route, import.meta.url), {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify(value),
	});
	if (!response.ok) throw new Error('Host rejected control message.');
}

/** Executes current production shaders once per selected wavelength on a shared GPU context.
 * @returns {Promise<void>} - Completion or reported failure with GPU cleanup.
 */
async function run() {
	let gl;
	try {
		const response = await fetch(new URL('control', import.meta.url));
		if (!response.ok) throw new Error('Missing control.');
		const {jobs} = await response.json();
		gl = document.createElement('canvas').getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: 'high-performance',
		});
		if (!gl) throw new Error('WebGL2 unavailable.');
		const started = performance.now();
		const results = [];
		for (const [jobIndex, job] of jobs.entries()) {
			const wavelengths = [];
			for (const wavelengthIndex of job.wavelengths) {
				await post('progress', {message: `${job.id}: wavelength ${wavelengthIndex} started`});
				const result = await compileDistantSunSceneCacheWavelength({
					gl,
					buildRequest: job.buildRequest,
					wavelengthIndex,
					compileSceneCaches: true,
					sceneCacheRequests: [{cacheIdentity: job.id, ledger: job.ledger}],
					reportProgress: async () => {},
					onSceneCacheTile: async ({firstPackedRow, values}) => {
						const upload = await fetch(
							new URL(`tile/${jobIndex}/${wavelengthIndex}/${firstPackedRow}`, import.meta.url),
							{method: 'POST', body: values.buffer},
						);
						if (!upload.ok) throw new Error('Host rejected cache tile.');
					},
				});
				wavelengths.push(result);
				await post('progress', {message: `${job.id}: wavelength ${wavelengthIndex} complete`});
			}
			results.push({id: job.id, wavelengths});
		}
		const debug = gl.getExtension('WEBGL_debug_renderer_info');
		await post('complete', {
			accepted: true,
			jobs: results,
			elapsedMilliseconds: performance.now() - started,
			gpu: {
				api: gl.getParameter(gl.VERSION),
				renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
			},
			userAgent: navigator.userAgent,
		});
	} catch (error) {
		await post('complete', {accepted: false, error: error instanceof Error ? error.stack : String(error)});
	} finally {
		gl?.getExtension('WEBGL_lose_context')?.loseContext();
	}
}
await run();
