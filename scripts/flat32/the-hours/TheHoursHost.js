import {createHash} from 'node:crypto';
import {PolylithServer} from '@polylith/server';
import {readFile, open, lstat, realpath, readdir} from 'node:fs/promises';
import path from 'node:path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import puppeteer from 'puppeteer';
import Files from '../../algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js';
import {DISTANT_SUN_SHARED_CACHE_DECODER_SHA256} from '../../../src/algorithm32/implementation/distant-sun/cache/consts.js';
import {TheHoursAssetService} from '../../../server/flat32/features/the-hours-proof/index.js';

/** Loopback-only proof host; outputs and browser profile belong to one new run. */
export class TheHoursHost {
	/** Creates a host without opening a socket or launching a browser.
	 *
	 * @param {TheHoursHostConfiguration} configuration - Active output and authenticated package capabilities.
	 */
	constructor(configuration) {
		this._run = configuration.run;
		this._inputs = configuration.inputs;
		this._files = new Files(this._run.repositoryRoot);
		this._assets = new Map();
		this._assetService = new TheHoursAssetService({run: this._run, inputs: this._inputs, assets: this._assets});
		this._source = new Map();
		this._chunkIndex = 0;
		this._videoFinalized = false;
	}

	/** Called by build and asset delivery to retain exact ordinary repository source identities.
	 *
	 * @param {string} relative - Repository-owned input path.
	 * @returns {Promise<string>} - Checked absolute path.
	 */
	async _input(relative) {
		if (!relative.split('/').every((part) => /^@?[a-zA-Z0-9_.-]+$/u.test(part) && part !== '.' && part !== '..'))
			throw new Error(`Uncontained repository input: ${relative}`);
		let absolute = path.resolve(this._run.repositoryRoot);
		for (const part of relative.split('/')) {
			absolute = path.join(absolute, part);
			const facts = await lstat(absolute);
			if (
				facts.isSymbolicLink() ||
				(!facts.isFile() && !facts.isDirectory()) ||
				(await realpath(absolute)).toLowerCase() !== absolute.toLowerCase()
			)
				throw new Error('Repository input resolves through an alias.');
		}
		const bytes = await readFile(absolute);
		this._source.set(relative, {
			path: relative,
			byteLength: bytes.length,
			sha256: createHash('sha256').update(bytes).digest('hex'),
		});
		return absolute;
	}

	/** Called by startup to bundle production modules exclusively inside the active run.
	 *
	 * @param {string} input - Repository-owned module entry.
	 * @param {string} output - New run-relative bundle artifact.
	 * @returns {Promise<void>} - Exact source inventory and bundle persisted.
	 */
	async _bundle(input, output) {
		const bundle = await rollup({
			input: await this._input(input),
			plugins: [
				{
					name: 'production-browser-environment',
					transform: (code) => ({
						code: code.replaceAll('process.env.NODE_ENV', JSON.stringify('production')),
						map: null,
					}),
				},
				nodeResolve({browser: true}),
				/** @type {SharedQualificationCommonJsFactory} */ (/** @type {unknown} */ (commonjs))(),
			],
			onwarn: (warning) => {
				if (warning.code !== 'CIRCULAR_DEPENDENCY') throw new Error(warning.message);
			},
		});
		try {
			for (const absolute of bundle.watchFiles) {
				if (absolute.startsWith('\0')) continue;
				const relative = path.relative(this._run.repositoryRoot, absolute).replaceAll('\\', '/');
				if (relative.startsWith('../') || relative.startsWith('experiments/') || relative.startsWith('tmp/'))
					throw new Error('The Hours bundle imports an unauthorized runtime dependency.');
				await this._input(relative);
			}
			const generated = await bundle.generate({format: 'es', inlineDynamicImports: true});
			if (generated.output.length !== 1 || generated.output[0].type !== 'chunk')
				throw new Error('Unexpected proof bundle assets.');
			await this._run.write(output, generated.output[0].code);
		} finally {
			await bundle.close();
		}
	}

	/** Called by startup to register a production asset package and its declared artifacts.
	 *
	 * @param {string} route - Exact public package route.
	 * @param {string} root - Ordinary repository package directory.
	 * @returns {Promise<void>} - Read-only route allowlist recorded.
	 */
	async _package(route, root) {
		const manifest = await this._input(`${root}/manifest.json`);
		this._assets.set(`${route}/manifest.json`, manifest);
		const value = JSON.parse(await readFile(manifest, 'utf8'));
		for (const artifact of value.artifacts ? Object.values(value.artifacts) : [value.artifact]) {
			if (!/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/u.test(artifact.path))
				throw new Error('Invalid production asset path.');
			const absolute = await this._input(`${root}/${artifact.path}`);
			const bytes = await readFile(absolute);
			if (
				bytes.length !== artifact.byteLength ||
				createHash('sha256').update(bytes).digest('hex') !== artifact.sha256
			)
				throw new Error('Production asset package identity mismatch.');
			this._assets.set(`${route}/${artifact.path}`, absolute);
		}
	}

	/** Called by the loopback listener to serve only authenticated inputs and this run's bundles.
	 *
	 * @param {import('node:http').IncomingMessage} request - Loopback request.
	 * @param {import('node:http').ServerResponse} response - Response owner.
	 * @returns {Promise<void>} - Exact bounded route delivered or rejected.
	 */
	async _serve(request, response) {
		try {
			if (request.method !== 'GET') {
				response.writeHead(405).end();
				return;
			}
			const route = new URL(request.url, this._origin).pathname;
			if (route === '/') {
				response.setHeader('Content-Type', 'text/html');
				response.end(
					'<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block;width:100%;height:100%}</style><canvas></canvas>',
				);
				return;
			}
			const asset = await this._assetService.read(route);
			if (!asset) {
				response.writeHead(404).end();
				return;
			}
			response.setHeader('Content-Type', asset.contentType);
			response.end(asset.bytes);
		} catch (error) {
			console.error('The Hours asset request failed.', error);
			response.writeHead(400, {'Content-Type': 'application/json'}).end('{"error":"asset-request-failed"}');
		}
	}

	/** Called by the video bridge to append one bounded sequential batch exactly once.
	 *
	 * @param {number} index - Next expected batch index.
	 * @param {string} encoded - Base64 batch from the browser.
	 * @returns {Promise<void>} - Complete bytes persisted.
	 */
	async _videoChunk(index, encoded) {
		if (index !== this._chunkIndex || this._videoFinalized || encoded.length > 5_592_408)
			throw new Error('Invalid or repeated video batch.');
		const bytes = Buffer.from(encoded, 'base64');
		if (!bytes.length || bytes.length > 4 * 1024 * 1024) throw new Error('Video batch exceeds its bound.');
		if (!this._video) {
			const directory = await this._run.directory('recording');
			this._video = await open(path.join(directory, 'original-workflow.mp4'), 'wx');
		}
		await this._video.writeFile(bytes);
		this._chunkIndex += 1;
	}

	/** Called by the video bridge to close and synchronize the output once.
	 *
	 * @returns {Promise<void>} - Durable closed video artifact.
	 */
	async _videoFinalize() {
		if (!this._video || this._videoFinalized) throw new Error('Video is empty or already finalized.');
		await this._video.sync();
		await this._video.close();
		this._video = null;
		this._videoFinalized = true;
	}

	/** Call this method to prepare pinned bundles and actual Chrome without changing deployed assets.
	 *
	 * @param {number} width - Native capture width.
	 * @param {number} height - Native capture height.
	 * @returns {Promise<void>} - Browser and exact source inventory ready.
	 */
	async start(width, height) {
		for (const name of await readdir(await this._files.resolve('scripts/flat32/the-hours'))) {
			if (/\.(?:js|json|ts|md)$/u.test(name)) await this._input(`scripts/flat32/the-hours/${name}`);
		}
		await this._input('package.json');
		await this._input('package-lock.json');
		await this._input('scripts/algorithm32/solar-zenith-cache/DistantSunSharedCacheGenerationFiles.js');
		await this._run.writeJson('command.json', {
			node: process.version,
			arguments: process.argv.slice(1),
			derivation:
				'Production module assembly with NODE_ENV=production; exact original clock/camera/geometry; actual one-second GPU diffuse/adaptation endpoints; production monotone cubic environment; exact-time direct light; original AVC recording workflow.',
		});
		const decoder = await this._input('node_modules/three/examples/jsm/libs/zstddec.module.js');
		if (
			createHash('sha256')
				.update(await readFile(decoder))
				.digest('hex') !== DISTANT_SUN_SHARED_CACHE_DECODER_SHA256
		)
			throw new Error('Unqualified cache decoder.');
		await this._bundle('scripts/flat32/the-hours/browser-entry.js', 'browser.js');
		await this._bundle(
			'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js',
			'shared-cache-worker.js',
		);
		this._assets.set('/mediabunny.js', await this._input('node_modules/mediabunny/dist/bundles/mediabunny.mjs'));
		await this._package(
			'/stellar-catalogs/brightest-2000-stellar-package-v1',
			'server/flat32/data/brightest-2000-stellar-package-v1',
		);
		await this._package(
			'/presentation-filters/human-vision-filter-package-v1',
			'server/flat32/data/human-vision-filter-package-v1',
		);
		await this._run.writeJson('repository-inputs.json', [...this._source.values()]);
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
		this._server = this._polylith.server;
		await new Promise((resolve, reject) => {
			this._server.once('error', reject);
			this._server.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = this._server.address();
		if (!address || typeof address === 'string') throw new Error('Loopback listener unavailable.');
		this._origin = `http://127.0.0.1:${address.port}`;
		const browserTemporary = await this._run.directory('browser-temp');
		this._browser = await puppeteer.launch({
			headless: 'new',
			executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
			userDataDir: await this._run.directory('profile'),
			env: {...process.env, TEMP: browserTemporary, TMP: browserTemporary},
			protocolTimeout: 3600000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-background-timer-throttling',
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--noerrdialogs',
			],
		});
		this._page = await this._browser.newPage();
		await this._page.setViewport({width, height, deviceScaleFactor: 1});
		this._page.on('console', (message) => console.log(`browser: ${message.text()}`));
		this._page.on('pageerror', (error) => console.log(`browser-error: ${error.message}`));
		await this._page.exposeFunction('__theHoursProgress', (value) => this._run.progress(value));
		await this._page.exposeFunction('__theHoursCapture', async (slot, encoded) => {
			if (!Number.isInteger(slot) || slot < 0 || slot >= 1800 || encoded.length > 64 * 1024 * 1024)
				throw new Error('Invalid PNG bridge input.');
			await this._run.write(`frames/${String(slot).padStart(4, '0')}.png`, Buffer.from(encoded, 'base64'));
			return {slot};
		});
		await this._page.exposeFunction('__theHoursWriteJson', (relative, value) => {
			if (relative !== 'lighting-samples.json') throw new Error('Invalid JSON bridge path.');
			return this._run.writeJson(relative, value);
		});
		await this._page.exposeFunction('__theHoursVideoChunk', this._videoChunk.bind(this));
		await this._page.exposeFunction('__theHoursVideoFinalize', this._videoFinalize.bind(this));
		await this._page.goto(this._origin, {waitUntil: 'load'});
	}

	/** Call this method to exercise actual target allocation and production GLSL.
	 *
	 * @returns {Promise<TheHoursGpuProofResult>} - Actual admitted GPU and color evidence.
	 */
	proof() {
		return this._page.evaluate(async () => {
			const moduleUrl = '/browser.js';
			const {TheHoursGpuProof} = await import(moduleUrl);
			const proof = new TheHoursGpuProof();
			return {budget: proof.budget(), color: proof.color()};
		});
	}

	/** Call this method to record a configured original production scene through normal owners.
	 *
	 * @param {TheHoursBrowserConfiguration} configuration - Authenticated controls and measured admission.
	 * @returns {Promise<TheHoursBrowserResult>} - Complete physical and native source trace.
	 */
	record(configuration) {
		return this._page.evaluate(async (value) => {
			const moduleUrl = '/browser.js';
			const {TheHoursBrowser} = await import(moduleUrl);
			const session = new TheHoursBrowser(value);
			try {
				await session.prepare();
				return await session.record();
			} finally {
				session.dispose();
			}
		}, configuration);
	}

	/** Call this method to replay exact native PNGs through the original reusable media workflow.
	 *
	 * @param {TheHoursReplayConfiguration} configuration - Retained source and declared encoding candidate.
	 * @returns {Promise<TheHoursReplayResult>} - Exact native replay and complete media facts.
	 */
	reencode(configuration) {
		return this._page.evaluate(async (value) => {
			const moduleUrl = '/browser.js';
			const {TheHoursReplayBrowser} = await import(moduleUrl);
			return new TheHoursReplayBrowser(value).record();
		}, configuration);
	}

	/** Call this method to exercise complete production scene publication with actual measured receiver light.
	 *
	 * @param {TheHoursBrowserConfiguration} configuration - Authenticated native candidate and actual target admission.
	 * @returns {Promise<TheHoursSceneTraversalResult>} - All 109 coherent native publications.
	 */
	qualifyScenes(configuration) {
		return this._page.evaluate(async (value) => {
			const moduleUrl = '/browser.js';
			const {TheHoursBrowser} = await import(moduleUrl);
			const session = new TheHoursBrowser(value);
			try {
				await session.prepare();
				return await session.qualifyScenes();
			} finally {
				session.dispose();
			}
		}, configuration);
	}

	/** Call this method to release browser, video and listener before run sealing.
	 *
	 * @returns {Promise<void>} - External writers closed.
	 */
	async dispose() {
		await this._browser?.close();
		if (this._video) {
			await this._video.close();
			this._video = null;
		}
		if (this._server) await new Promise((resolve) => this._server.close(resolve));
	}
}
