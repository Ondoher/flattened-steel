import {PolylithServer} from '@polylith/server';
import {ProductionGpuAssetService} from '../../../server/flat32/features/production-gpu-proof/index.js';
import {appendFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {basename, dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

import puppeteer from 'puppeteer';
import B1Direct40CacheAssetVerifier from '../../algorithm32/production-b-experiments/B1Direct40CacheAssetVerifier.js';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/** Browser lifecycle that executes B1 conditions through production GPU shaders. */
export class ProductionGpuHost {
	/**
	 * Creates an unopened GPU browser lifecycle.
	 *
	 * @param {{progressLogPath?: string, assetSetDirectory?: string, diagnosticAssetDirectory?: string, diagnosticCondition?: {id: string, localTime: string, fittedAzimuthDegrees: number}, productionRevision?: string}} [options] - Verified canonical asset set or one verified diagnostic asset, plus an optional independently pollable progress log.
	 */
	constructor(options = {}) {
		this._server = null;
		this._browser = null;
		this._page = null;
		this._progressLogPath = options.progressLogPath ?? null;
		this._assetSetDirectory = options.assetSetDirectory ?? null;
		this._diagnosticAssetDirectory = options.diagnosticAssetDirectory ?? null;
		this._diagnosticCondition = options.diagnosticCondition ?? null;
		this._productionRevision = options.productionRevision ?? null;
		this._assetSet = null;
		this._assetSetProvenance = null;
		if (this._progressLogPath) {
			mkdirSync(dirname(this._progressLogPath), {recursive: true});
			writeFileSync(
				this._progressLogPath,
				`[B1 GPU progress] host created ${new Date().toISOString()}\n`,
				'utf8',
			);
		}
	}

	/** @returns {object | null} - Independently verified source provenance for the complete asset set. */
	get assetSetProvenance() {
		return this._assetSetProvenance;
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

	/** Called by the registered loopback adapter to translate one bounded asset request.
	 *
	 * @param {import('node:http').IncomingMessage} request - Loopback transport request.
	 * @param {import('node:http').ServerResponse} response - Transport response owner.
	 * @returns {Promise<void>} - Delivered input or a stable rejection.
	 */
	async _serve(request, response) {
		try {
			if (request.method !== 'GET') {
				response.writeHead(405).end();
				return;
			}
			if (request.url === '/favicon.ico') {
				response.writeHead(204).end();
				return;
			}
			if (request.url === '/' || request.url?.startsWith('/?')) {
				response.writeHead(200, {'Content-Type': 'text/html'}).end(this._entryDocument());
				return;
			}
			const relativePath = decodeURIComponent(request.url?.split('?')[0] ?? '').replace(/^\/+/, '');
			const asset = await this._assetService.read(relativePath);
			response.writeHead(200, {'Content-Type': asset.contentType}).end(asset.bytes);
		} catch (error) {
			console.error('Production GPU asset request failed.', error);
			response.writeHead(error instanceof RangeError ? 403 : 404).end();
		}
	}

	/** Called by open to activate the proof route through the repository server lifecycle.
	 *
	 * @returns {Promise<import('node:http').Server>} - Unopened repository-owned listener.
	 */
	async _createServer() {
		this._assetService = new ProductionGpuAssetService({
			repositoryRoot: REPOSITORY_ROOT,
			allowedDirectories: [
				'src/algorithm32/',
				'scripts/algorithm32/',
				'scripts/experiments/b1-directional-sky-radiance/',
				'node_modules/three/',
				...this._assetSet.assets.map((asset) => asset.assetRoot.slice(1)),
			],
		});
		this._polylith = new PolylithServer({}, []);
		await this._polylith.create([
			{
				getRouterRoot: () => '/',
				router: async (_application, router) => {
					router.all('*', (request, response) => {
						void this._serve(request, response);
					});
					return true;
				},
			},
		]);
		return this._polylith.server;
	}

	/**
	 * Call this method to start one browser that is reused across requested conditions.
	 *
	 * @returns {Promise<void>} - Completion after the browser module is ready.
	 */
	async open() {
		if (this._page) return;
		const canonicalInput = this._assetSetDirectory !== null;
		const diagnosticInput = this._diagnosticAssetDirectory !== null || this._diagnosticCondition !== null;
		if (
			!this._productionRevision ||
			canonicalInput === diagnosticInput ||
			(diagnosticInput && (!this._diagnosticAssetDirectory || !this._diagnosticCondition))
		) {
			throw new Error(
				'ProductionGpuHost requires one canonical asset set or one complete diagnostic asset descriptor.',
			);
		}
		const verified = canonicalInput
			? await B1Direct40CacheAssetVerifier.verifySet({
					setDirectory: this._assetSetDirectory,
					productionRevision: this._productionRevision,
				})
			: await B1Direct40CacheAssetVerifier.verifyAsset({
					assetDirectory: this._diagnosticAssetDirectory,
					condition: this._diagnosticCondition,
					productionRevision: this._productionRevision,
				});
		const verifiedAssets = canonicalInput ? verified.assets : [verified];
		const verifiedSetIdentity = canonicalInput
			? verified.manifest.setIdentity
			: `algorithm32-b1-direct40-diagnostic-sha256:${verified.manifestSha256}`;
		for (const asset of verifiedAssets) {
			const relativeAssetRoot = relative(REPOSITORY_ROOT, asset.assetDirectory);
			if (!relativeAssetRoot || relativeAssetRoot.startsWith('..') || relativeAssetRoot.includes(':')) {
				throw new Error('B1 direct-40 asset must remain below the repository root.');
			}
		}
		const compilerIdentities = new Set(verifiedAssets.map((asset) => asset.manifest.derivation.compilerIdentity));
		if (compilerIdentities.size !== 1) {
			throw new Error('B1 direct-40 asset set must use one compiler identity.');
		}
		this._assetSetProvenance = Object.freeze({
			schemaId: 'algorithm32-b1-verified-asset-inputs-v1',
			productionRevision: this._productionRevision,
			compilerIdentity: [...compilerIdentities][0],
			assetSetIdentity: verifiedSetIdentity,
			assetSet: canonicalInput ? verified.manifest : null,
			assetSetManifest: canonicalInput
				? Object.freeze({name: basename(verified.manifestPath), sha256: verified.manifestSha256})
				: null,
			diagnostic: !canonicalInput,
			assets: Object.freeze(
				verifiedAssets.map((asset) =>
					Object.freeze({
						condition: asset.manifest.condition.localTime,
						assetIdentity: asset.manifest.assetIdentity,
						manifestSha256: asset.manifestSha256,
						profileId: asset.manifest.profile.id,
						profileContentHash: asset.manifest.profile.contentHash,
					}),
				),
			),
		});
		this._assetSet = {
			setIdentity: verifiedSetIdentity,
			productionRevision: this._productionRevision,
			diagnostic: !canonicalInput,
			assets: verifiedAssets.map((asset) => ({
				condition: canonicalInput
					? verified.manifest.assets.find(
							(candidate) => candidate.assetIdentity === asset.manifest.assetIdentity,
						).condition
					: this._diagnosticCondition,
				assetRoot: `/${relative(REPOSITORY_ROOT, asset.assetDirectory).split(sep).join('/')}/`,
				manifestPath: basename(asset.manifestPath),
				manifestSha256: asset.manifestSha256,
				assetIdentity: asset.manifest.assetIdentity,
				profile: asset.manifest.profile,
				positionDomain: asset.manifest.domains.position.selection ?? 'native48',
				directionToSource: asset.manifest.condition.directionToSource,
			})),
		};
		this._recordProgress('[B1 GPU progress] browser launch started');
		this._server = await this._createServer();
		await new Promise((resolveListen) => this._server.listen(0, '127.0.0.1', resolveListen));
		const address = this._server.address();
		const port = typeof address === 'object' && address !== null ? address.port : 0;
		this._browser = await puppeteer.launch({
			headless: 'new',
			protocolTimeout: 900000,
			defaultViewport: {width: 64, height: 64, deviceScaleFactor: 1},
			executablePath: process.env.CHROME_PATH ?? puppeteer.executablePath('chrome'),
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				...(process.platform === 'win32' ? ['--use-angle=d3d11'] : []),
			],
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
		await this._page.evaluate((assetSet) => globalThis.algorithm32B1InitializeGpuSession(assetSet), this._assetSet);
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
		const asset = this._assetSet?.assets.find((candidate) => candidate.condition.localTime === request.time);
		if (!asset) throw new Error(`Verified B1 asset set does not cover condition ${request.time}.`);
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
				{...request, asset, assetSetIdentity: this._assetSet.setIdentity},
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
			const cleanup = await this._page.evaluate(() => globalThis.algorithm32B1DisposeGpuSession());
			if (
				cleanup?.complete !== true ||
				(cleanup.alreadyDisposed !== true &&
					(cleanup.contextLossRequested !== true ||
						cleanup.backendDisposed !== true ||
						cleanup.rendererDisposed !== true ||
						cleanup.canvasRemoved !== true))
			) {
				throw new Error('B1 GPU session did not confirm complete resource and context cleanup.');
			}
			this._recordProgress(`[B1 GPU progress] session cleanup verified ${JSON.stringify(cleanup)}`);
			await this._page.evaluate(() => globalThis.algorithm32B1DisposeJ2AngularGpuSession?.());
		}
		const browser = this._browser;
		const server = this._server;
		this._page = null;
		this._browser = null;
		this._server = null;
		this._assetSet = null;
		this._assetService = null;
		this._polylith = null;
		this._assetSetProvenance = null;
		if (browser) {
			await browser.close();
			this._recordProgress('[B1 GPU progress] browser closed');
		}
		if (server) {
			await new Promise((resolveClose) => server.close(resolveClose));
			this._recordProgress('[B1 GPU progress] module server closed');
		}
	}
}
