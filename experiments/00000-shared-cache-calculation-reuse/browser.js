import {compileDistantSunSceneCacheWavelength, openSession, closeSession} from './compiler.js';

const base = new URL('.', import.meta.url);
/** Called by the runner to deliver bounded control messages.
 * @param {string} route - Capability-scoped route.
 * @param {unknown} value - JSON message.
 * @returns {Promise<void>} - Completion after host acceptance.
 */
async function post(route, value) {
	const response = await fetch(new URL(route, base), {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify(value),
	});
	if (!response.ok) throw new Error('Host rejected ' + route);
}

let gl;
try {
	const response = await fetch(new URL('control', base));
	if (!response.ok) throw new Error('Control unavailable.');
	const control = await response.json();
	gl = document.createElement('canvas').getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'high-performance',
	});
	if (!gl) throw new Error('WebGL2 unavailable.');
	const started = performance.now();
	const session = openSession(gl, 512 * 1024 * 1024);
	const jobs = [];
	for (const [jobIndex, job] of control.jobs.entries()) {
		const jobStarted = performance.now();
		const wavelengths = [];
		for (const wavelengthIndex of job.wavelengths) {
			session.prepare();
			const result = await compileDistantSunSceneCacheWavelength({
				gl,
				buildRequest: job.buildRequest,
				wavelengthIndex,
				compileSceneCaches: true,
				sceneCacheRequests: [{cacheIdentity: job.id, ledger: job.ledger}],
				reportProgress: async (stage) => {
					if (stage === 'programs-compiled' || stage.endsWith(':J4'))
						await post('progress', {message: `${job.id} wavelength ${wavelengthIndex}: ${stage}`});
				},
				onSceneCacheTile: async ({firstPackedRow, values}) => {
					const delivery = await fetch(
						new URL(`tile/${jobIndex}/${wavelengthIndex}/${firstPackedRow}`, base),
						{method: 'POST', body: values.buffer},
					);
					if (!delivery.ok) throw new Error('Tile rejected.');
				},
			});
			session.boundary();
			wavelengths.push(result);
		}
		jobs.push({id: job.id, elapsedMilliseconds: performance.now() - jobStarted, wavelengths});
		await post('progress', {message: `Completed ${job.id}.`});
	}
	const stats = {...session.stats};
	closeSession();
	await post('complete', {
		accepted: true,
		jobs,
		stats,
		finalResidentBytes: session.stats.residentBytes,
		elapsedMilliseconds: performance.now() - started,
		userAgent: navigator.userAgent,
		gpu: gl.getParameter(gl.RENDERER),
	});
} catch (error) {
	closeSession();
	await post('complete', {accepted: false, error: error.stack ?? String(error)});
} finally {
	gl?.getExtension('WEBGL_lose_context')?.loseContext();
}
