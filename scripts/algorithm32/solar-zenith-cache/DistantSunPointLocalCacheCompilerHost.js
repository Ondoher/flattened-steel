import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {rm} from 'node:fs/promises';
import {SHARED_GENERATION_SOURCE_ROOT, DISTANT_SUN_SCATTERING_ACCURACY_SOURCE} from './consts.js';

/** Capability-scoped loopback host for one variable point-local compiler execution. */
export default class DistantSunPointLocalCacheCompilerHost {
	/**
	 * Called by compilation to select Chrome's platform or explicitly configured graphics backend.
	 *
	 * @param {string} profile - Fresh, contained browser-profile directory.
	 * @param {string} url - Capability-scoped loopback compilation URL.
	 * @param {string} [backend] - Operator selection; software rendering is explicitly opt-in.
	 * @returns {string[]} - Browser arguments without disabling the process sandbox.
	 */
	_browserArguments(profile, url, backend = process.env.FLAT_CACHE_BROWSER_BACKEND) {
		let selected = backend ?? (process.platform === 'win32' ? 'd3d11' : 'auto');
		let graphics = [];
		if (selected === 'swiftshader') {
			graphics = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
		} else if (['d3d11', 'gl', 'vulkan'].includes(selected)) {
			graphics = [`--use-angle=${selected}`, '--disable-software-rasterizer'];
		} else if (selected !== 'auto') {
			throw new RangeError('Unsupported FLAT_CACHE_BROWSER_BACKEND; use auto, swiftshader, gl, vulkan or d3d11.');
		}
		return [
			'--headless=new',
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			...graphics,
			'--no-first-run',
			'--disable-background-networking',
			`--user-data-dir=${profile}`,
			url,
		];
	}

	_respond(response, status, contentType, body) {
		response.writeHead(status, {'content-type': contentType, 'cache-control': 'no-store'});
		response.end(body);
	}

	async _body(request, maximumBytes) {
		const chunks = [];
		let length = 0;
		for await (const chunk of request) {
			length += chunk.length;
			if (length > maximumBytes) {
				throw new RangeError('Point-local compiler request exceeds its byte bound.');
			}
			chunks.push(chunk);
		}
		return Buffer.concat(chunks, length);
	}

	/** Launch one isolated browser, stream its tiles, and release every host resource before settling. */
	async run(options) {
		options.signal.throwIfAborted();
		const maximumMilliseconds = options.maximumMilliseconds;
		if (
			maximumMilliseconds !== undefined &&
			(!Number.isSafeInteger(maximumMilliseconds) || maximumMilliseconds < 1 || maximumMilliseconds > 2147483647)
		) {
			throw new RangeError(
				'Explicit compiler deadline must fit the Node timer range (1 through 2147483647 milliseconds).',
			);
		}
		const prefix = `/${randomBytes(24).toString('hex')}/`;
		const sourceNames = [
			`${SHARED_GENERATION_SOURCE_ROOT}/DistantSunPointLocalCacheAerosolOptics.js`,
			`${SHARED_GENERATION_SOURCE_ROOT}/DistantSunPointLocalCacheCompilerBrowser.js`,
			`${SHARED_GENERATION_SOURCE_ROOT}/DistantSunSceneCacheGpuCompiler.js`,
			`${SHARED_GENERATION_SOURCE_ROOT}/DistantSunSceneCacheNumerics.js`,
			DISTANT_SUN_SCATTERING_ACCURACY_SOURCE,
		];
		const sources = new Map();
		for (const name of sourceNames) {
			sources.set(name, await options.files.read(name));
		}
		const profile = await options.files.directory(`${options.runRoot}/chrome-profile`);
		const expectedReadbackBytes = 64 * options.inventory.logicalDirectionCount * Float32Array.BYTES_PER_ELEMENT;
		const expectedAccumulatorBytes =
			2 *
			options.inventory.coordinates.length *
			options.inventory.logicalDirectionCount *
			Float32Array.BYTES_PER_ELEMENT;
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
				) {
					return this._respond(response, 403, 'text/plain', 'Forbidden.');
				}
				const url = new URL(request.url, origin);
				if (!url.pathname.startsWith(prefix) || url.search) {
					return this._respond(response, 404, 'text/plain', 'Not found.');
				}
				const route = url.pathname.slice(prefix.length);
				if (request.method === 'GET' && route === '') {
					return this._respond(
						response,
						200,
						'text/html',
						`<!doctype html><meta charset="utf-8"><script type="module">try{const {default:Compiler}=await import("./${SHARED_GENERATION_SOURCE_ROOT}/DistantSunPointLocalCacheCompilerBrowser.js");await new Compiler(new URL(".",location.href)).run();}catch(error){await fetch("./complete",{method:"POST",body:JSON.stringify({accepted:false,error:String(error)})});}</script>`,
					);
				}
				if (request.method === 'GET' && sources.has(route)) {
					return this._respond(response, 200, 'text/javascript', sources.get(route));
				}
				if (request.method === 'GET' && route === 'control') {
					return this._respond(
						response,
						200,
						'application/json',
						JSON.stringify({
							buildRequest: options.inventory.buildRequest,
							unionLedger: options.inventory.unionLedger,
							wavelengths: options.inventory.wavelengths,
							logicalDirectionCount: options.inventory.logicalDirectionCount,
						}),
					);
				}
				options.signal.throwIfAborted();
				const tile = route.match(/^tile\/([0-9]+)\/([0-9]+)$/u);
				if (request.method === 'POST' && tile) {
					await options.staging.accept(
						Number(tile[1]),
						Number(tile[2]),
						await this._body(request, expectedReadbackBytes),
					);
					return this._respond(response, 204, 'text/plain', '');
				}
				if (request.method === 'POST' && (route === 'progress' || route === 'complete')) {
					const value = JSON.parse(
						(await this._body(request, route === 'progress' ? 65536 : 2 * 1024 * 1024)).toString('utf8'),
					);
					if (route === 'progress') {
						await options.progress(value);
					} else if (
						value.accepted === true &&
						value.wavelengths?.length === options.inventory.channelCount &&
						typeof value.userAgent === 'string' &&
						value.maximumReadbackBytes === expectedReadbackBytes &&
						value.unionAccumulatorBytes === expectedAccumulatorBytes
					) {
						resolveResult(value);
					} else {
						rejectResult(new Error(`Point-local GPU compilation failed: ${String(value.error)}`));
					}
					return this._respond(response, 204, 'text/plain', '');
				}
				return this._respond(response, 404, 'text/plain', 'Not found.');
			} catch (error) {
				rejectResult(error);
				this._respond(response, 500, 'text/plain', 'Point-local compilation failed.');
			}
		});
		let child = null;
		const heartbeat = setInterval(() => {
			options.progress({phase: 'gpu-host-heartbeat'}).catch(rejectResult);
		}, 25000);
		const timer =
			maximumMilliseconds === undefined
				? undefined
				: setTimeout(
						() =>
							rejectResult(
								new Error(`Point-local GPU compilation exceeded ${maximumMilliseconds} milliseconds.`),
							),
						maximumMilliseconds,
					);
		const abort = () => rejectResult(options.signal.reason ?? new Error('Point-local compilation cancelled.'));
		options.signal.addEventListener('abort', abort, {once: true});
		try {
			await new Promise((resolve, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', () => resolve(undefined));
			});
			const address = server.address();
			if (!address || typeof address === 'string') {
				throw new Error('Point-local compiler host did not allocate a port.');
			}
			origin = `http://127.0.0.1:${address.port}`;
			options.signal.throwIfAborted();
			child = spawn(options.chromePath, this._browserArguments(profile, `${origin}${prefix}`), {
				windowsHide: true,
				stdio: 'ignore',
			});
			child.once('error', rejectResult);
			child.once('exit', () => rejectResult(new Error('Point-local compiler browser exited before completion.')));
			await options.progress({phase: 'browser-launched', processId: child.pid, hostPort: address.port});
			return await completed;
		} finally {
			clearInterval(heartbeat);
			clearTimeout(timer);
			options.signal.removeEventListener('abort', abort);
			if (child?.pid && child.exitCode === null) {
				child.kill();
				await new Promise((resolve) => child.once('exit', resolve));
			}
			server.closeAllConnections();
			await new Promise((resolve) => server.close(resolve));
			await rm(await options.files.resolve(`${options.runRoot}/chrome-profile`), {
				recursive: true,
				force: true,
				maxRetries: 5,
				retryDelay: 100,
			});
		}
	}
}
