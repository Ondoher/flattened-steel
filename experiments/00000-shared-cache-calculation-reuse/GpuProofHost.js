import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';

/** Capability-scoped local host for bounded sequential GPU jobs. */
export default class GpuProofHost {
	/** Called by request handling to read a bounded body.
	 * @param {SharedGenerationIncomingMessage} request - Incoming request.
	 * @param {number} maximum - Maximum byte count.
	 * @returns {Promise<Buffer>} - Complete bounded body.
	 */
	async _body(request, maximum) {
		const chunks = [];
		let count = 0;
		for await (const chunk of request) {
			count += chunk.length;
			if (count > maximum) throw new Error('Body limit exceeded.');
			chunks.push(chunk);
		}
		return Buffer.concat(chunks, count);
	}

	/** Call this method to execute supplied jobs and close the browser and host on every outcome.
	 * @param {CacheReuseHostOptions} options - Run-owned sources, input jobs, tile sink, and cancellation.
	 * @returns {Promise<CacheReuseGpuResult>} - Browser measurements after validated completion.
	 */
	async run(options) {
		const {run, jobs, sources, acceptTile, signal} = options;
		signal.throwIfAborted();
		const prefix = '/' + randomBytes(24).toString('hex') + '/';
		let origin = '';
		let settle, fail;
		const completed = new Promise((resolve, reject) => {
			settle = resolve;
			fail = reject;
		});
		completed.catch(() => {});
		let inflight = Promise.resolve();
		const server = createServer((request, response) => {
			inflight = inflight
				.then(async () => {
					const reply = (status, type, body) => {
						response.writeHead(status, {'content-type': type, 'cache-control': 'no-store'});
						response.end(body);
					};
					try {
						if (
							`http://${request.headers.host}` !== origin ||
							(request.headers.origin && request.headers.origin !== origin)
						)
							return reply(403, 'text/plain', 'Forbidden.');
						const url = new URL(request.url, origin);
						if (!url.pathname.startsWith(prefix) || url.search)
							return reply(404, 'text/plain', 'Not found.');
						const route = url.pathname.slice(prefix.length);
						if (request.method === 'GET' && route === '')
							return reply(
								200,
								'text/html',
								'<!doctype html><script type="module" src="./browser.js"></script>',
							);
						if (request.method === 'GET' && sources.has(route))
							return reply(200, 'text/javascript', sources.get(route));
						if (request.method === 'GET' && route === 'control')
							return reply(200, 'application/json', JSON.stringify({jobs}));
						signal.throwIfAborted();
						const tile = /^tile\/(\d+)\/(\d+)\/(\d+)$/u.exec(route);
						if (request.method === 'POST' && tile) {
							const [job, channel, row] = tile.slice(1).map(Number);
							if (!jobs[job] || !jobs[job].wavelengths.includes(channel))
								throw new Error('Invalid tile job.');
							await acceptTile(job, channel, row, await this._body(request, 64 * 4374 * 4));
							return reply(204, 'text/plain', '');
						}
						if (request.method === 'POST' && (route === 'progress' || route === 'complete')) {
							const value = JSON.parse(
								(await this._body(request, route === 'progress' ? 65536 : 8 * 1024 * 1024)).toString(
									'utf8',
								),
							);
							if (route === 'progress') run.progress({phase: 'gpu', message: String(value.message)});
							else if (value.accepted === true && value.jobs?.length === jobs.length) settle(value);
							else fail(new Error('GPU proof failed: ' + String(value.error)));
							return reply(204, 'text/plain', '');
						}
						return reply(404, 'text/plain', 'Not found.');
					} catch (error) {
						fail(error);
						reply(500, 'text/plain', 'Proof failed.');
					}
				})
				.catch(fail);
		});
		let child;
		const abort = () => fail(signal.reason ?? new Error('Cancelled.'));
		signal.addEventListener('abort', abort, {once: true});
		const timer = setTimeout(
			() => fail(new Error('GPU proof deadline exceeded.')),
			options.maximumMilliseconds ?? 3600000,
		);
		try {
			await new Promise((resolve, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', () => resolve(undefined));
			});
			const address = server.address();
			if (!address || typeof address === 'string') throw new Error('Host did not allocate a port.');
			origin = `http://127.0.0.1:${address.port}`;
			const profile = await run.files.directory(`${run.root}/chrome-profile`);
			child = spawn(
				process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
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
			child.once('error', fail);
			child.once('exit', () => fail(new Error('Browser exited before completion.')));
			run.progress({phase: 'gpu', message: `Browser launched for ${jobs.length} jobs.`});
			return await completed;
		} finally {
			clearTimeout(timer);
			signal.removeEventListener('abort', abort);
			if (child?.pid && child.exitCode === null) {
				const exited = new Promise((resolve) => child.once('exit', resolve));
				child.kill();
				await exited;
			}
			server.closeAllConnections();
			await new Promise((resolve) => server.close(resolve));
			await inflight;
			run.progress({
				phase: 'host-cleanup',
				message: JSON.stringify({
					listening: server.listening,
					browserStopped: !child?.pid || child.exitCode !== null || child.signalCode !== null,
				}),
			});
		}
	}
}
