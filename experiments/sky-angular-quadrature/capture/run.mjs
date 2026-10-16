import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire, builtinModules} from 'node:module';
import path from 'node:path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {
	createProductionSharedCacheService,
	SHARED_PACKAGE_ROOT,
	SHARED_PACKAGE_REPORT,
	SHARED_PACKAGE_IDENTITY,
} from '../../../server/flat32/features/shared-cache/selection.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
import {
	createRun,
	identity,
	readRepository,
	repositoryRoot,
	resolveRepository,
	checkedAbsolute,
	sha256,
	verifyRun,
} from '../io/files.mjs';
import {own} from '../common.mjs';

const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Render matched production/candidate noon captures using the hardware GPU and unchanged application shader.
 * @returns {Promise<void>} Sealed images and provenance; failed runs retain their real state and owned resources are closed.
 */
async function main() {
	assert.equal(process.argv.length, 2, 'This registered capture accepts no options.');
	const parents = /** @type {AngularFileIdentity[]} */ ([]);
	const registration = /** @type {AngularRegistration} */ (
		own('tmp/experiments/sky-angular-quadrature/runs/00002-q1-refine-reg', 'registration.json', parents)
	);
	const selection = /** @type {{selected:string}} */ (
		own('tmp/experiments/sky-angular-quadrature/runs/00003-q1-screen', 'assessment.json', parents)
	);
	const candidate = registration.candidates.find((c) => c.id === selection.selected);
	assert.ok(candidate?.frame === 'receiver');
	checkedAbsolute(path.resolve(SHARED_PACKAGE_ROOT));
	const reportRelative = path
		.relative(repositoryRoot, path.join(SHARED_PACKAGE_ROOT, SHARED_PACKAGE_REPORT.path))
		.replaceAll('\\', '/');
	const reportBytes = readRepository(reportRelative, SHARED_PACKAGE_REPORT);
	parents.push(identity(reportRelative, reportBytes));
	const report = JSON.parse(reportBytes.toString());
	const configurationPath = path
		.relative(repositoryRoot, path.join(SHARED_PACKAGE_ROOT, report.configurations[0].path))
		.replaceAll('\\', '/');
	const configuration = JSON.parse(readRepository(configurationPath, report.configurations[0]).toString());
	parents.push(identity(configurationPath));
	const inputs = Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), {
		solarInterpolation: 'monotone-cubic',
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
	});
	assert.equal(
		inputs.numericalIdentity,
		configuration.numericalIdentity,
		'Compiler controls must match the deployed package.',
	);
	const baseline = /** @type {DistantSunSceneCacheCompilerBuildRequest} */ ({
		...inputs.buildRequest,
		transportSpec: {
			...inputs.buildRequest.transportSpec,
			shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
		},
	});
	const adapted = {
		...baseline,
		id: `angular-production-noon-${candidate.id}`,
		transportSpec: {
			...baseline.transportSpec,
			domains: {
				...baseline.transportSpec.domains,
				incoming: {
					id: candidate.id,
					directionCount: candidate.directions.length,
					unitVectors: candidate.directions,
					integrationWeightsSteradians: candidate.weights,
				},
			},
		},
	};
	const control = /** @type {AngularHorizonControl} */ ({baseline, candidate: adapted});
	const run = createRun('q5-noon-capture', {
		parents,
		operation:
			'Capture unchanged deployed Flat32 noon, GPU-compile the selected incoming rule on production Native48/Native15 controls, publish a separately owned diagnostic atlas through the existing shader facade, and capture the same camera and display state.',
		parameters: {
			maximumMilliseconds: 600000,
			maximumExtraRetainedBytes: 16 * 1024 ** 2,
			viewport: {width: 1024, height: 768},
			horizontalFovDegrees: 60,
			cameraPitchDegrees: 5,
			headingFromSunDegrees: 90,
			productionPackage: SHARED_PACKAGE_IDENTITY,
			control,
			parity: {channel: 7, maximumRelative: 0.0001, absoluteFloor: 1e-12},
			scope: 'No production edit/promotion; Native15 adaptation is distinct from the original paper-score profile. Receiver lighting and display state remain fixed between captures. Twilight preservation is a future adoption gate, not tested by this noon-only run.',
		},
	});
	const started = performance.now();
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>>|undefined} */ let browser;
	/** @type {ReturnType<typeof createServer>|undefined} */ let host;
	let failure = null;
	const consoleMessages = [],
		serverFailures = [],
		servedAssets = new Map(),
		files = [];
	try {
		const service = await createProductionSharedCacheService(),
			routes = new Map();
		/** Bundle one read-only entry and retain its exact source graph. @param {string} relative @param {boolean} browserBuild @returns {Promise<Buffer>} */
		async function bundle(relative, browserBuild = true) {
			resolveRepository(relative);
			const build = await rollup({
				input: path.join(repositoryRoot, relative),
				...(browserBuild ? {} : {external: (id) => id.startsWith('node:') || builtinModules.includes(id)}),
				plugins: [nodeResolve({browser: browserBuild}), commonjs()],
				onwarn: (warning) => consoleMessages.push({type: 'bundle-warning', text: warning.message}),
			});
			try {
				files.push(...build.watchFiles);
				return Buffer.from(
					(await build.generate({format: 'es', inlineDynamicImports: true})).output[0].code.replaceAll(
						'process.env.NODE_ENV',
						JSON.stringify('production'),
					),
				);
			} finally {
				await build.close();
			}
		}
		run.progress('bundle', 'Build contained production renderer and exact compiler graph.');
		const browserBundle = await bundle('experiments/sky-angular-quadrature/capture/browser.js');
		routes.set('/bundle.js', browserBundle);
		run.write('bundle.js', browserBundle);
		const worker = await bundle('src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js');
		routes.set('/shared-cache-worker.js', worker);
		run.write('shared-cache-worker.js', worker);
		await bundle('server/flat32/features/shared-cache/selection.js', false);
		for (const [url, disk, names] of [
			[
				'/stellar-catalogs/brightest-2000-stellar-package-v1/',
				'server/flat32/data/brightest-2000-stellar-package-v1',
				[
					'manifest.json',
					'catalog-roster.json',
					'native15-packets.json',
					'members-rgba32f.bin',
					'spectra-r32f.bin',
				],
			],
			[
				'/presentation-filters/human-vision-filter-package-v1/',
				'server/flat32/data/human-vision-filter-package-v1',
				['manifest.json', 'native15-scotopic-weights.json'],
			],
		])
			for (const name of names) {
				const relative = `${disk}/${name}`;
				routes.set(url + name, readRepository(relative));
				files.push(resolveRepository(relative));
			}
		const sources = [...new Set(files)]
			.filter((file) => !file.startsWith('\0'))
			.sort()
			.map((file) => identity(path.relative(repositoryRoot, file).replaceAll('\\', '/')));
		sources.push(identity('package-lock.json'));
		run.write('inputs.json', {control, configuration, sources, package: SHARED_PACKAGE_IDENTITY});
		const html =
			'<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1024px;height:768px;overflow:hidden}.flat32-viewport{width:1024px;height:768px}.flat32-canvas{display:block;width:100%;height:100%}.flat32-scene-controls,.flat32-time-panel,#capture-result,#candidate-trigger{display:none}</style><div id="main-content"></div><pre id="capture-result"></pre><button id="candidate-trigger"></button><script type="module" src="/bundle.js"></script>';
		run.write('capture-host.html', html);
		host = createServer(async (request, response) => {
			try {
				const url = new URL(request.url, 'http://127.0.0.1');
				if (request.method === 'POST' && url.pathname === '/progress') {
					let body = '';
					for await (const chunk of request) {
						body += chunk;
						assert.ok(body.length < 8192);
					}
					const event = JSON.parse(body);
					run.progress('gpu', String(event.message), Number(event.completed), Number(event.total));
					response.writeHead(200).end();
					return;
				}
				assert.equal(request.method, 'GET');
				if (url.pathname === '/comparison-control') {
					response.setHeader('Content-Type', 'application/json');
					response.end(JSON.stringify(control));
					return;
				}
				if (url.pathname === '/api/distant-sun-scene-cache') {
					response.setHeader('Content-Type', 'application/json');
					response.end(
						JSON.stringify(
							service.resolve(Number(url.searchParams.get('solarZenithDegrees')), 'scene-caches/'),
						),
					);
					return;
				}
				if (url.pathname.startsWith('/scene-caches/')) {
					const relative = decodeURIComponent(url.pathname.slice(14)),
						asset = await service.resolveAsset(relative);
					servedAssets.set(relative, {
						path: relative,
						byteLength: asset.byteLength,
						sha256: sha256(asset.bytes),
					});
					response.setHeader('Content-Type', asset.contentType);
					response.end(asset.bytes);
					return;
				}
				if (url.pathname === '/') {
					response.setHeader('Content-Type', 'text/html');
					response.end(html);
					return;
				}
				const bytes = routes.get(url.pathname);
				if (!bytes) {
					response.writeHead(404).end();
					return;
				}
				response.setHeader(
					'Content-Type',
					url.pathname.endsWith('.js')
						? 'text/javascript'
						: url.pathname.endsWith('.json')
							? 'application/json'
							: 'application/octet-stream',
				);
				response.end(bytes);
			} catch (error) {
				serverFailures.push({url: request.url, error: String(error)});
				response.writeHead(500).end(String(error));
			}
		});
		await new Promise((resolve, reject) => {
			host.once('error', reject);
			host.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = host.address();
		assert.ok(address && typeof address !== 'string');
		const executable = checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		browser = await puppeteer.launch({
			executablePath: executable,
			headless: true,
			userDataDir: path.join(run.scratchPath, 'profile'),
			protocolTimeout: 650000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-background-timer-throttling',
			],
		});
		run.write('browser.json', {
			version: await browser.version(),
			executable,
			sha256: sha256(await readFile(executable)),
			node: process.version,
		});
		const page = await browser.newPage();
		await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 1});
		page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
		page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
		run.progress('production', 'Load current production app and exact San Jose solar-noon publication.');
		await page.goto(`http://127.0.0.1:${address.port}`, {waitUntil: 'domcontentloaded', timeout: 30000});
		/** Wait for the expected exact capture state or its actual failure. @param {string} expected @param {number} timeout @returns {Promise<unknown>} */
		async function wait(expected, timeout) {
			await page.waitForFunction(
				(state) => [state, 'failed'].includes(document.getElementById('capture-result')?.dataset.state),
				{timeout, polling: 250},
				expected,
			);
			const value = await page.$eval('pre#capture-result', (element) => ({
				state: element.dataset.state,
				facts: JSON.parse(element.textContent),
			}));
			assert.notEqual(value.state, 'failed', JSON.stringify(value.facts));
			return value.facts;
		}
		const production = await wait('production-ready', 240000),
			canvas = await page.$('#flat32-canvas');
		assert.ok(canvas);
		const productionPng = Buffer.from(await canvas.screenshot());
		run.write('production-noon.png', productionPng);
		run.write('production.json', production);
		run.progress('visual', `${run.path}/production-noon.png`);
		await page.$eval('button#candidate-trigger', (element) => element.click());
		const candidateFacts = await wait('candidate-ready', Math.max(1000, 600000 - (performance.now() - started)));
		const candidatePng = Buffer.from(await canvas.screenshot());
		run.write('candidate-noon.png', candidatePng);
		run.write('candidate.json', candidateFacts);
		assert.ok(
			!serverFailures.length && !consoleMessages.some((m) => m.type === 'pageerror'),
			'Actual browser/asset failure.',
		);
		for (const source of sources) readRepository(source.path, source);
		await page.setViewport({width: 1536, height: 620, deviceScaleFactor: 1});
		await page.setContent(
			`<html><style>body{margin:0;background:white;color:#17212b;font:17px sans-serif}header{padding:12px}main{display:flex}section{width:768px}h3{margin:8px 14px}img{width:768px;height:576px;display:block}</style><header>San Jose solar noon - actual production renderer; matched camera and fixed production display state</header><main><section><h3>Current production F68</h3><img src="data:image/png;base64,${productionPng.toString('base64')}"></section><section><h3>Experimental horizon2048 on production controls</h3><img src="data:image/png;base64,${candidatePng.toString('base64')}"></section></main></html>`,
			{waitUntil: 'load'},
		);
		run.write('comparison.png', Buffer.from(await page.screenshot({fullPage: true})));
		run.progress('visual', `${run.path}/comparison.png`);
		run.write('result.json', {
			accepted: true,
			production,
			candidate: candidateFacts,
			servedCacheAssets: [...servedAssets.values()],
			consoleMessages,
			serverFailures,
			elapsedMilliseconds: performance.now() - started,
			twilight: 'Current production remains untouched; noon capture does not qualify candidate twilight.',
		});
	} catch (error) {
		failure = String(error);
		run.write('failure.json', {failure, consoleMessages, serverFailures});
	} finally {
		await browser?.close();
		if (host) await new Promise((resolve) => host.close(resolve));
		run.cleanup();
		run.finish(failure ? 'failed' : 'accepted', {elapsedMilliseconds: performance.now() - started, failure});
	}
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, failure}));
	if (failure) process.exitCode = 1;
}
await main();
