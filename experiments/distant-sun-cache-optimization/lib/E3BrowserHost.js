import {spawn} from 'node:child_process';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';

/** Execute the contained E3 browser recurrence and accept only bounded staging uploads. */
export default class E3BrowserHost {
	/** @type {string} */ _chromePath;
	/** @type {string} */ _repositoryRoot;
	/** @type {number} */ _timeoutMilliseconds;

	/**
	 * @param {string} chromePath - Explicit local Chrome executable.
	 * @param {string} repositoryRoot - Canonical repository root available through the allowlisted server.
	 * @param {number} [timeoutMilliseconds] - Hard bounded browser execution deadline.
	 */
	constructor(chromePath, repositoryRoot, timeoutMilliseconds = 900_000) {
		this._chromePath = chromePath;
		this._repositoryRoot = repositoryRoot;
		this._timeoutMilliseconds = timeoutMilliseconds;
	}

	/**
	 * Run one browser-owned, all-wavelength recurrence against prepared staging owners.
	 *
	 * @param {string} scratchDirectory - Open run-local scratch directory.
	 * @param {Record<string, unknown>} control - JSON-safe GPU build and scene-ledger request facts.
	 * @param {readonly E3BoundedStaging[]} staging - One preallocated target per control scene.
	 * @param {(event: Record<string, unknown>) => Promise<void>} progress - Durable host progress relay.
	 * @returns {Promise<Record<string, unknown>>} - Browser result with bounded resource evidence.
	 */
	async run(scratchDirectory, control, staging, progress) {
		await lstat(this._chromePath);
		const repositoryRoot = await realpath(this._repositoryRoot);
		const profilePath = path.join(scratchDirectory, 'e3-chrome-profile');
		await mkdir(profilePath);
		const browserDocument = this._browserDocument();
		const server = createServer(async (request, response) => {
			try {
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				const pathname = decodeURIComponent(url.pathname);
				if (pathname === '/') return this._respond(response, 200, 'text/html; charset=utf-8', browserDocument);
				if (pathname === '/control.json') return this._respondJson(response, control);
				if (pathname === '/progress' && request.method === 'POST') {
					await progress(await this._readJson(request, 65_536));
					return this._respond(response, 204, 'text/plain; charset=utf-8', '');
				}
				const layer = pathname.match(/^\/artifact\/layer\/([0-9]+)\/scene\/([0-9]+)$/u);
				if (layer && request.method === 'POST') {
					const wavelengthIndex = Number(layer[1]);
					const sceneIndex = Number(layer[2]);
					if (!Number.isInteger(wavelengthIndex) || wavelengthIndex < 0 || wavelengthIndex >= staging[0]?.channelCount) {
						throw new RangeError('E3 browser requested a wavelength outside the declared staging range.');
					}
					const target = staging[sceneIndex];
					if (!target) throw new RangeError('E3 browser requested a scene outside the declared staging range.');
					const bytes = await this._readBody(request, 16 * 1024 * 1024);
					if (bytes.byteLength % Float32Array.BYTES_PER_ELEMENT !== 0) throw new TypeError('E3 browser uploaded an unaligned Float32 layer.');
					await target.writeLogicalLayer(wavelengthIndex, new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Float32Array.BYTES_PER_ELEMENT));
					return this._respond(response, 204, 'text/plain; charset=utf-8', '');
				}
				if (!pathname.startsWith('/repository/') || pathname.includes('..')) throw new Error('E3 browser requested an unsupported path.');
				const target = await realpath(path.resolve(repositoryRoot, pathname.slice('/repository/'.length)));
				if (!target.startsWith(`${repositoryRoot}${path.sep}`)) throw new Error('E3 browser path escapes the repository root.');
				const information = await lstat(target);
				if (!information.isFile() || information.isSymbolicLink()) throw new Error('E3 browser target is not a real file.');
				return this._respond(response, 200, this._contentType(target), await readFile(target));
			} catch (error) {
				return this._respond(response, 500, 'text/plain; charset=utf-8', error instanceof Error ? error.message : String(error));
			}
		});
		try {
			await new Promise((resolve, reject) => {
				server.once('error', reject);
				server.listen(0, '127.0.0.1', resolve);
			});
			const address = server.address();
			if (!address || typeof address === 'string') throw new Error('E3 browser host did not bind a loopback port.');
			return await this._executeBrowser(`http://127.0.0.1:${address.port}/`, profilePath);
		} finally {
			await new Promise((resolve) => server.close(resolve));
			await rm(profilePath, {recursive: true, force: true, maxRetries: 20, retryDelay: 250});
		}
	}

	/** @returns {string} - E3-only browser page. */
	_browserDocument() {
		return '<!doctype html><meta charset="utf-8"><pre id="result">pending</pre>' +
			'<script type="module">const result=document.querySelector("#result");globalThis.e3GeneratorProgress=(event)=>fetch("/progress",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(event)});' +
			'try{const module=await import("/repository/experiments/distant-sun-cache-optimization/browser/e3-bounded-generator-browser.js");result.textContent=JSON.stringify(await module.runE3BoundedGeneratorBrowser());}catch(error){result.textContent=JSON.stringify({error:{name:error.name,message:error.message,stack:error.stack}});}</script>';
	}

	/** @param {string} url - Loopback browser page. @param {string} profilePath - New isolated Chrome profile. @returns {Promise<Record<string, unknown>>} - Browser result. */
	async _executeBrowser(url, profilePath) {
		const child = spawn(this._chromePath, ['--headless=new', '--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-software-rasterizer', '--disable-breakpad', '--disable-crash-reporter', '--disable-component-update', '--disable-background-networking', '--remote-debugging-port=0', '--no-first-run', `--user-data-dir=${profilePath}`, url], {windowsHide: true});
		const deadline = Date.now() + this._timeoutMilliseconds;
		try {
			const port = await this._waitForPort(profilePath, deadline);
			const target = await this._waitForTarget(port, url, deadline);
			const socket = new WebSocket(target.webSocketDebuggerUrl);
			await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
			let nextId = 1;
			const pending = new Map();
			socket.addEventListener('message', (event) => {
				const message = JSON.parse(event.data);
				const request = pending.get(message.id);
				if (!request) return;
				pending.delete(message.id);
				if (message.error) request.reject(new Error(message.error.message));
				else request.resolve(message.result);
			});
			const command = (method, params = {}) => new Promise((resolve, reject) => { const id = nextId++; pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params})); });
			await command('Runtime.enable');
			let content = 'pending';
			while (Date.now() < deadline) {
				const value = await command('Runtime.evaluate', {expression: "document.querySelector('#result')?.textContent ?? 'pending'", returnByValue: true});
				content = value.result?.value ?? 'pending';
				if (content !== 'pending') break;
				await new Promise((resolve) => setTimeout(resolve, 1_000));
			}
			socket.close();
			if (content === 'pending') throw new Error('E3 browser did not finish before its deadline.');
			const result = JSON.parse(content);
			if (result.error) throw new Error(`${result.error.name}: ${result.error.message}\n${result.error.stack ?? ''}`);
			return result;
		} finally {
			if (child.exitCode === null) { child.kill(); await new Promise((resolve) => child.once('exit', resolve)); }
		}
	}

	/** @param {string} profilePath - Chrome profile. @param {number} deadline - Deadline epoch. @returns {Promise<number>} - DevTools port. */
	async _waitForPort(profilePath, deadline) {
		while (Date.now() < deadline) {
			try { const port = Number((await readFile(path.join(profilePath, 'DevToolsActivePort'), 'utf8')).split(/\r?\n/u)[0]); if (Number.isInteger(port)) return port; } catch {}
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		throw new Error('E3 Chrome did not publish its DevTools port.');
	}

	/** @param {number} port - DevTools port. @param {string} url - Expected page URL. @param {number} deadline - Deadline epoch. @returns {Promise<Record<string, string>>} - Matching DevTools page target. */
	async _waitForTarget(port, url, deadline) {
		while (Date.now() < deadline) {
			const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()).catch(() => []);
			const target = targets.find((candidate) => candidate.type === 'page' && candidate.url === url);
			if (target?.webSocketDebuggerUrl) return target;
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		throw new Error('E3 Chrome did not publish its compiler page target.');
	}

	/** @param {import('node:http').IncomingMessage} request - Bounded body source. @param {number} maximumBytes - Exclusive bound. @returns {Promise<Buffer>} - Complete body. */
	async _readBody(request, maximumBytes) {
		const chunks = [];
		let length = 0;
		for await (const chunk of request) { length += chunk.length; if (length > maximumBytes) throw new RangeError('E3 browser upload exceeds the declared staging bound.'); chunks.push(chunk); }
		return Buffer.concat(chunks);
	}

	/** @param {import('node:http').IncomingMessage} request - JSON request. @param {number} maximumBytes - Exclusive JSON bound. @returns {Promise<Record<string, unknown>>} - Parsed event. */
	async _readJson(request, maximumBytes) { return JSON.parse((await this._readBody(request, maximumBytes)).toString('utf8')); }
	/** @param {string} target - Repository file. @returns {string} - Safe content type. */
	_contentType(target) { return target.endsWith('.js') ? 'text/javascript; charset=utf-8' : target.endsWith('.json') ? 'application/json; charset=utf-8' : 'application/octet-stream'; }
	/** @param {import('node:http').ServerResponse} response - Response target. @param {number} status - HTTP status. @param {string} type - Content type. @param {string|Buffer} body - Response body. */
	_respond(response, status, type, body) { response.writeHead(status, {'content-type': type}); response.end(body); }
	/** @param {import('node:http').ServerResponse} response - Response target. @param {unknown} value - JSON-safe response. */
	_respondJson(response, value) { this._respond(response, 200, 'application/json; charset=utf-8', `${JSON.stringify(value)}\n`); }
}
