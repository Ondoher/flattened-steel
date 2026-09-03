import {createServer} from 'node:http';
import {appendFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {dirname, extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const REPOSITORY_ROOT = resolve('.');
const CONTENT_TYPES = {
	'.css': 'text/css',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
};

/** Browser lifecycle that executes B1 conditions through production GPU shaders. */
export class ProductionGpuHost {
	/**
	 * Creates an unopened GPU browser lifecycle.
	 *
	 * @param {{progressLogPath?: string}} [options] - Optional independently pollable progress log.
	 */
	constructor(options = {}) {
		this._server = null;
		this._browser = null;
		this._page = null;
		this._progressLogPath = options.progressLogPath ?? null;
		if (this._progressLogPath) {
			mkdirSync(dirname(this._progressLogPath), {recursive: true});
			writeFileSync(
				this._progressLogPath,
				`[B1 GPU progress] host created ${new Date().toISOString()}\n`,
				'utf8',
			);
		}
	}

	/** @param {string} message - The progress message. @returns {void} - No value. */
	_recordProgress(message) {
		if (this._progressLogPath) {
			appendFileSync(this._progressLogPath, `${new Date().toISOString()} ${message}\n`, 'utf8');
		}
	}

	/**
	 * Called by the HTTP host to serve its module entry document.
	 *
	 * @returns {string} - The browser entry document.
	 */
	_entryDocument() {
		return `<!doctype html>
<html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script>
</head><body><script type="module">
import {disposeGpuSession, generateGpuCondition, initializeGpuSession} from '/scripts/experiments/b1-directional-sky-radiance/production-gpu-browser.js';
globalThis.algorithm32B1DisposeGpuSession = disposeGpuSession;
globalThis.algorithm32B1GenerateGpuCondition = generateGpuCondition;
globalThis.algorithm32B1InitializeGpuSession = initializeGpuSession;
globalThis.algorithm32B1GpuReady = true;
</script></body></html>`;
	}

	/** Load the legacy J2 diagnostic only when that separate lane requests it. */
	async _loadJ2AngularModule() {
		if (!this._page) throw new Error('ProductionGpuHost must be opened before J2 module loading.');
		await this._page.evaluate(async () => {
			if (globalThis.algorithm32B1InitializeJ2AngularGpuSession) return;
			const module = await import('/scripts/experiments/b1-directional-sky-radiance/j2-angular-gpu-browser.js');
			globalThis.algorithm32B1DisposeJ2AngularGpuSession = module.disposeJ2AngularGpuSession;
			globalThis.algorithm32B1GenerateJ2AngularCondition = module.generateJ2AngularCondition;
			globalThis.algorithm32B1GenerateJ2AngularScoreCondition = module.generateJ2AngularScoreCondition;
			globalThis.algorithm32B1InitializeJ2AngularGpuSession = module.initializeJ2AngularGpuSession;
		});
	}

	/**
	 * Called by open to create the repository-local static module server.
	 *
	 * @returns {import('node:http').Server} - The unopened server.
	 */
	_createServer() {
		return createServer(async (request, response) => {
			try {
				if (request.url === '/favicon.ico') {
					response.writeHead(204).end();
					return;
				}
				if (request.url === '/' || request.url?.startsWith('/?')) {
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(this._entryDocument());
					return;
				}
				const relativePath = decodeURIComponent(request.url?.split('?')[0] ?? '').replace(/^\/+/, '');
				const path = resolve(REPOSITORY_ROOT, relativePath);
				if (path !== REPOSITORY_ROOT && !path.startsWith(`${REPOSITORY_ROOT}${sep}`)) {
					response.writeHead(403).end();
					return;
				}
				const file = await readFile(path);
				response.writeHead(200, {'Content-Type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream'});
				response.end(file);
			} catch {
				response.writeHead(404).end();
			}
		});
	}

	/**
	 * Call this method to start one browser that is reused across requested conditions.
	 *
	 * @returns {Promise<void>} - Completion after the browser module is ready.
	 */
	async open() {
		if (this._page) return;
		this._recordProgress('[B1 GPU progress] browser launch started');
		this._server = this._createServer();
		await new Promise((resolveListen) => this._server.listen(0, '127.0.0.1', resolveListen));
		const address = this._server.address();
		const port = typeof address === 'object' && address !== null ? address.port : 0;
		this._browser = await puppeteer.launch({
			headless: 'new',
			protocolTimeout: 900000,
			defaultViewport: {width: 64, height: 64, deviceScaleFactor: 1},
			args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
		});
		this._page = await this._browser.newPage();
		this._recordProgress('[B1 GPU progress] browser launched');
		this._page.setDefaultTimeout(900000);
		this._page.on('console', (message) => {
			if (message.type() === 'error' || message.text().startsWith('[B1 GPU progress]')) {
				process.stderr.write(`[B1 GPU browser] ${message.text()}\n`);
				this._recordProgress(message.text());
			}
		});
		await this._page.goto(`http://127.0.0.1:${port}/`, {waitUntil: 'networkidle0', timeout: 900000});
		this._recordProgress('[B1 GPU progress] browser module page loaded');
		await this._page.waitForFunction(() => globalThis.algorithm32B1GpuReady === true, {timeout: 900000});
		await this._page.evaluate(() => globalThis.algorithm32B1InitializeGpuSession());
		this._recordProgress('[B1 GPU progress] shared WebGL session initialized');
	}

	/**
	 * Call this method to execute one condition in the retained browser.
	 *
	 * @param {{time: string, fittedAzimuthDegrees: number, maximumScatteringOrder: number, measureGpuCompletion?: boolean}} request - The condition request.
	 * @returns {Promise<{values: number[][], capabilities: object, shaderDiagnostics: unknown}>} - The GPU result.
	 */
	async generateCondition(request) {
		if (!this._page) throw new Error('ProductionGpuHost must be opened before generation.');
		const startedAt = Date.now();
		const heartbeat = setInterval(() => {
			const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
			const message = `[B1 GPU liveness] ${request.time} J${request.maximumScatteringOrder} active for ${elapsedSeconds}s`;
			process.stderr.write(`${message}\n`);
			this._recordProgress(message);
		}, 15000);
		try {
			return await this._page.evaluate(
				async (conditionRequest) => globalThis.algorithm32B1GenerateGpuCondition(conditionRequest),
				request,
			);
		} finally {
			clearInterval(heartbeat);
		}
	}

	/**
	 * Call this method to execute one bounded J2 angular-resolution condition.
	 *
	 * @param {{time: string, fittedAzimuthDegrees: number}} request - Benchmark Sun condition.
	 * @returns {Promise<object>} - Exact and reconstructed J2 measurements.
	 */
	async generateJ2AngularCondition(request) {
		if (!this._page) throw new Error('ProductionGpuHost must be opened before J2 angular generation.');
		await this._loadJ2AngularModule();
		await this._page.evaluate(() => globalThis.algorithm32B1InitializeJ2AngularGpuSession());
		return this._page.evaluate(
			async (conditionRequest) => globalThis.algorithm32B1GenerateJ2AngularCondition(conditionRequest),
			request,
		);
	}

	/**
	 * Call this method to execute one complete J2 angular score condition.
	 *
	 * @param {{time: string, fittedAzimuthDegrees: number}} request - Benchmark Sun condition.
	 * @returns {Promise<object>} - Pure-J2 view-path spectra for every candidate width.
	 */
	async generateJ2AngularScoreCondition(request) {
		if (!this._page) throw new Error('ProductionGpuHost must be opened before J2 angular score generation.');
		await this._loadJ2AngularModule();
		await this._page.evaluate(() => globalThis.algorithm32B1InitializeJ2AngularGpuSession());
		const startedAt = Date.now();
		const heartbeat = setInterval(() => {
			const message = `[B1 GPU liveness] ${request.time} J2 angular score active for ${Math.round((Date.now() - startedAt) / 1000)}s`;
			process.stderr.write(`${message}\n`);
			this._recordProgress(message);
		}, 15000);
		try {
			return await this._page.evaluate(
				async (conditionRequest) => globalThis.algorithm32B1GenerateJ2AngularScoreCondition(conditionRequest),
				request,
			);
		} finally {
			clearInterval(heartbeat);
		}
	}

	/**
	 * Call this method to replace the retained WebGL context without restarting
	 * the local browser or module host.
	 *
	 * @returns {Promise<void>} - Completion after the replacement session is ready.
	 */
	async recycleSession() {
		if (!this._page) throw new Error('ProductionGpuHost must be opened before recycling its session.');
		this._recordProgress('[B1 GPU progress] WebGL session recycle started');
		await this._page.evaluate(() => globalThis.algorithm32B1DisposeGpuSession());
		await this._page.evaluate(() => globalThis.algorithm32B1InitializeGpuSession());
		this._recordProgress('[B1 GPU progress] WebGL session recycle complete');
	}

	/**
	 * Call this method to close browser and server resources.
	 *
	 * @returns {Promise<void>} - Completion after all host resources close.
	 */
	async close() {
		if (this._page) {
			await this._page.evaluate(() => globalThis.algorithm32B1DisposeGpuSession());
			await this._page.evaluate(() => globalThis.algorithm32B1DisposeJ2AngularGpuSession?.());
		}
		const browser = this._browser;
		const server = this._server;
		this._page = null;
		this._browser = null;
		this._server = null;
		if (browser) await browser.close();
		if (server) await new Promise((resolveClose) => server.close(resolveClose));
	}
}
