import {appendFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {dirname, extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const REPOSITORY_ROOT = resolve('.');
const CONTENT_TYPES = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json'};

export class FrameParityGpuHost {
	constructor({progressLogPath}) {
		this._server = null;
		this._browser = null;
		this._page = null;
		this._progressLogPath = progressLogPath;
		mkdirSync(dirname(progressLogPath), {recursive: true});
		writeFileSync(progressLogPath, `[Frame GPU progress] host created ${new Date().toISOString()}\n`, 'utf8');
	}

	_recordProgress(message) {
		appendFileSync(this._progressLogPath, `${new Date().toISOString()} ${message}\n`, 'utf8');
	}

	_createServer() {
		return createServer(async (request, response) => {
			try {
				if (request.url === '/favicon.ico') {
					response.writeHead(204).end();
					return;
				}
				if (request.url === '/' || request.url?.startsWith('/?')) {
					response.writeHead(200, {'Content-Type': 'text/html'});
					response.end(`<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script>
</head><body><script type="module">
import {disposeGpuSession, generateGpuCondition, initializeGpuSession} from '/scripts/experiments/algorithm32-frame-parity/retained-frame-gpu-browser.js';
globalThis.frameParityDisposeGpuSession = disposeGpuSession;
globalThis.frameParityGenerateGpuCondition = generateGpuCondition;
globalThis.frameParityInitializeGpuSession = initializeGpuSession;
globalThis.frameParityGpuReady = true;
</script></body></html>`);
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

	async open() {
		this._server = this._createServer();
		await new Promise((resolveListen) => this._server.listen(0, '127.0.0.1', resolveListen));
		const address = this._server.address();
		const port = typeof address === 'object' && address !== null ? address.port : 0;
		this._recordProgress('[Frame GPU progress] browser launch started');
		this._browser = await puppeteer.launch({
			headless: 'new',
			protocolTimeout: 900000,
			defaultViewport: {width: 64, height: 64, deviceScaleFactor: 1},
			args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
		});
		this._page = await this._browser.newPage();
		this._page.setDefaultTimeout(900000);
		this._page.on('console', (message) => {
			if (message.type() === 'error' || message.text().startsWith('[Frame GPU progress]')) {
				process.stderr.write(`[Frame GPU browser] ${message.text()}\n`);
				this._recordProgress(message.text());
			}
		});
		await this._page.goto(`http://127.0.0.1:${port}/`, {waitUntil: 'networkidle0', timeout: 900000});
		await this._page.waitForFunction(() => globalThis.frameParityGpuReady === true, {timeout: 900000});
		await this._page.evaluate(() => globalThis.frameParityInitializeGpuSession());
		this._recordProgress('[Frame GPU progress] shared WebGL session initialized');
	}

	async generateCondition(request) {
		if (!this._page) throw new Error('FrameParityGpuHost must be opened before generation.');
		const startedAt = Date.now();
		const heartbeat = setInterval(() => {
			const message = `[Frame GPU liveness] ${request.time} J${request.maximumScatteringOrder} active for ${Math.round((Date.now() - startedAt) / 1000)}s`;
			process.stderr.write(`${message}\n`);
			this._recordProgress(message);
		}, 15000);
		try {
			return await this._page.evaluate(
				async (conditionRequest) => globalThis.frameParityGenerateGpuCondition(conditionRequest),
				request,
			);
		} finally {
			clearInterval(heartbeat);
		}
	}

	async close() {
		if (this._page) await this._page.evaluate(() => globalThis.frameParityDisposeGpuSession());
		const browser = this._browser;
		const server = this._server;
		this._page = null;
		this._browser = null;
		this._server = null;
		if (browser) await browser.close();
		if (server) await new Promise((resolveClose) => server.close(resolveClose));
	}
}
