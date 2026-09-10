import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {SHARED_GENERATION_SOURCE_ROOT} from './consts.js';

/** Capability-scoped loopback host and GPU-browser lifetime owner. */
export default class DistantSunSharedCacheGenerationHost {
	/**
	 * Sends a host response with no persistent caching.
	 *
	 * @param {SharedGenerationServerResponse} response - Outgoing host response.
	 * @param {number} status - HTTP status.
	 * @param {string} contentType - Explicit representation type.
	 * @param {string | Uint8Array} body - Complete response.
	 * @returns {void} - No return value.
	 */
	_respond(response, status, contentType, body) {
		response.writeHead(status, {'content-type': contentType, 'cache-control': 'no-store'});
		response.end(body);
	}

	/**
	 * Reads one bounded body without trusting Content-Length.
	 *
	 * @param {SharedGenerationIncomingMessage} request - Incoming host request.
	 * @param {number} maximumBytes - Maximum accepted body size.
	 * @returns {Promise<Buffer>} - Complete bounded body.
	 */
	async _body(request, maximumBytes) {
		const chunks = [];
		let length = 0;
		for await (const chunk of request) {
			length += chunk.length;
			if (length > maximumBytes) throw new Error('Generation body exceeds its bound.');
			chunks.push(chunk);
		}
		return Buffer.concat(chunks, length);
	}
	/**
	 * Call this method to execute the common-field compiler and await authenticated completion.
	 * Unsupported browser execution, invalid requests, timeout, I/O failure, or cancellation rejects after cleanup; callers must abandon the run.
	 *
	 * @param {SharedGenerationHostRequest} options - Run-owned files, browser, controls, staging, cancellation, and progress.
	 * @returns {Promise<SharedGenerationGpuResult>} - Complete browser diagnostics.
	 */
	async run(options) {
		options.signal.throwIfAborted();
		const maximumMilliseconds = options.maximumMilliseconds ?? 900000;
		if (!Number.isInteger(maximumMilliseconds) || maximumMilliseconds < 1 || maximumMilliseconds > 900000)
			throw new Error('The GPU host deadline must be between one millisecond and 15 minutes.');
		const prefix = `/${randomBytes(24).toString('hex')}/`;
		const sourceNames = ['DistantSunSharedCacheGeneratorBrowser.js', 'DistantSunSceneCacheGpuCompiler.js'];
		const sources = new Map();
		for (const name of sourceNames)
			sources.set(name, await options.files.read(`${SHARED_GENERATION_SOURCE_ROOT}/${name}`));
		const profile = await options.files.directory(`${options.runRoot}/chrome-profile`);
		let origin = '';
		let resolveResult;
		let rejectResult;
		const completed = new Promise((resolve, reject) => {
			resolveResult = resolve;
			rejectResult = reject;
		});
		completed.catch(() => {});
		const server = createServer(async (request, response) => {
			try {
				if (
					`http://${request.headers.host}` !== origin ||
					(request.headers.origin && request.headers.origin !== origin)
				)
					return this._respond(response, 403, 'text/plain', 'Forbidden.');
				const url = new URL(request.url, origin);
				if (!url.pathname.startsWith(prefix) || url.search)
					return this._respond(response, 404, 'text/plain', 'Not found.');
				const route = url.pathname.slice(prefix.length);
				if (request.method === 'GET' && route === '')
					return this._respond(
						response,
						200,
						'text/html',
						'<!doctype html><meta charset="utf-8"><script type="module">import Generator from "./DistantSunSharedCacheGeneratorBrowser.js";new Generator().run();</script>',
					);
				if (request.method === 'GET' && sources.has(route))
					return this._respond(response, 200, 'text/javascript', sources.get(route));
				if (request.method === 'GET' && route === 'control')
					return this._respond(
						response,
						200,
						'application/json',
						JSON.stringify({
							buildRequest: options.inventory.buildRequest,
							unionLedger: options.inventory.unionLedger,
						}),
					);
				options.signal.throwIfAborted();
				const tile = route.match(/^tile\/([0-9]+)\/([0-9]+)$/u);
				if (request.method === 'POST' && tile) {
					await options.staging.accept(
						Number(tile[1]),
						Number(tile[2]),
						await this._body(request, 64 * 4374 * 4),
					);
					return this._respond(response, 204, 'text/plain', '');
				}
				if (request.method === 'POST' && (route === 'progress' || route === 'complete')) {
					const value = JSON.parse(
						(await this._body(request, route === 'progress' ? 65536 : 2 * 1024 * 1024)).toString('utf8'),
					);
					if (route === 'progress') await options.progress(value);
					else if (
						value.accepted === true &&
						value.wavelengths?.length === 15 &&
						typeof value.userAgent === 'string' &&
						value.maximumReadbackBytes === 64 * 4374 * 4 &&
						value.unionAccumulatorBytes === options.inventory.coordinates.length * 4374 * 4 * 2
					)
						resolveResult(value);
					else rejectResult(new Error(`GPU generation failed: ${String(value.error)}`));
					return this._respond(response, 204, 'text/plain', '');
				}
				return this._respond(response, 404, 'text/plain', 'Not found.');
			} catch (error) {
				rejectResult(error);
				this._respond(response, 500, 'text/plain', 'Generation failed.');
			}
		});
		let child = null;
		const timer = setTimeout(
			() => rejectResult(new Error(`GPU generation exceeded its ${maximumMilliseconds}-millisecond deadline.`)),
			maximumMilliseconds,
		);
		const abort = () => rejectResult(options.signal.reason ?? new Error('Generation cancelled.'));
		options.signal.addEventListener('abort', abort, {once: true});
		try {
			await new Promise((resolve, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', () => resolve(undefined));
			});
			const address = server.address();
			if (!address || typeof address === 'string') throw new Error('Generation host did not allocate a port.');
			origin = `http://127.0.0.1:${address.port}`;
			options.signal.throwIfAborted();
			child = spawn(
				options.chromePath,
				[
					'--headless=new',
					'--enable-gpu',
					'--enable-webgl',
					'--ignore-gpu-blocklist',
					'--use-angle=d3d11',
					'--disable-software-rasterizer',
					'--no-first-run',
					'--disable-background-networking',
					`--user-data-dir=${profile}`,
					`${origin}${prefix}`,
				],
				{windowsHide: true, stdio: 'ignore'},
			);
			child.once('error', rejectResult);
			child.once('exit', () => rejectResult(new Error('The generation browser exited before completion.')));
			await options.progress({phase: 'browser-launched', processId: child.pid, hostPort: address.port});
			return await completed;
		} finally {
			clearTimeout(timer);
			options.signal.removeEventListener('abort', abort);
			if (child?.pid && child.exitCode === null) {
				child.kill();
				await new Promise((resolve) => child.once('exit', resolve));
			}
			server.closeAllConnections();
			await new Promise((resolve) => server.close(resolve));
		}
	}
}
