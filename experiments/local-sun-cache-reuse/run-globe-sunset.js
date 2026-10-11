/// <reference path="../../server/flat32/features/shared-cache/types.d.ts" />
import path from 'node:path';
import {readFile, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {builtinModules} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {createProductionSharedCacheService, SHARED_PACKAGE_ROOT, SHARED_PACKAGE_REPORT, SHARED_PACKAGE_IDENTITY, SHARED_PACKAGE_SOLAR_INTERPOLATION} from '../../server/flat32/features/shared-cache/selection.js';
import {ExperimentRun} from './ExperimentRun.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';

const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Run a single ordinary spherical/distant scene at the selected central FOV.
 * @returns {Promise<void>} - Sealed PNG, source/asset identities and measured facts; disposable profile.
 */
async function main() {
	await requireHeavyExecution();
	const run = await ExperimentRun.create('globe-sunset'), profile = path.join(run.root, 'profile');
	let browser, host, failure = null;
	const consoleMessages = [], serverFailures = [];
	try {
		if (process.argv.length !== 2) throw new Error('This capture accepts no additional arguments.');
		await checkPath(repositoryRoot, SHARED_PACKAGE_ROOT);
		const service = await createProductionSharedCacheService(), files = [], warnings = [];
		const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/globe-sunset-browser.js');
		await checkPath(repositoryRoot, entry);
		const build = await rollup({input: entry, plugins: [nodeResolve({browser: true}), commonjs()], onwarn: (warning) => warnings.push({code: warning.code, message: warning.message})});
		let bundle;
		try {
			files.push(...build.watchFiles);
			bundle = (await build.generate({format: 'iife'})).output[0].code.replaceAll('process.env.NODE_ENV', JSON.stringify('production'));
		} finally {await build.close();}
		// Resolve the complete host service dependency graph without executing a second service.
		const hostBuild = await rollup({input: path.join(repositoryRoot, 'server/flat32/features/shared-cache/selection.js'), external: (id) => id.startsWith('node:') || builtinModules.includes(id), plugins: [nodeResolve(), commonjs()], onwarn: (warning) => warnings.push({code: warning.code, message: warning.message})});
		try {files.push(...hostBuild.watchFiles);} finally {await hostBuild.close();}
		for (const name of ['run-globe-sunset.js', 'ExperimentRun.js', 'run-boundary.js', 'heavy-execution-admission.js']) files.push(path.join(repositoryRoot, 'experiments/local-sun-cache-reuse', name));
		files.push(path.join(repositoryRoot, 'package-lock.json'), path.join(SHARED_PACKAGE_ROOT, SHARED_PACKAGE_REPORT.path));
		const routes = new Map([['/bundle.js', Buffer.from(bundle)]]), assetIdentities = new Map();
		const workerEntry = path.join(repositoryRoot, 'src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js');
		await checkPath(repositoryRoot, workerEntry);
		const workerBuild = await rollup({input: workerEntry, plugins: [nodeResolve({browser: true}), commonjs()], onwarn: (warning) => warnings.push({code: warning.code, message: warning.message})});
		try {
			files.push(...workerBuild.watchFiles);
			const worker = (await workerBuild.generate({format: 'es', inlineDynamicImports: true})).output[0].code;
			routes.set('/shared-cache-worker.js', Buffer.from(worker)); await run.write('shared-cache-worker.js', worker);
		} finally {await workerBuild.close();}
		const assetPackages = /** @type {const} */ ([
			['/stellar-catalogs/brightest-2000-stellar-package-v1/', 'server/flat32/data/brightest-2000-stellar-package-v1', ['manifest.json', 'catalog-roster.json', 'native15-packets.json', 'members-rgba32f.bin', 'spectra-r32f.bin']],
			['/presentation-filters/human-vision-filter-package-v1/', 'server/flat32/data/human-vision-filter-package-v1', ['manifest.json', 'native15-scotopic-weights.json']],
		]);
		for (const [urlRoot, diskRoot, names] of assetPackages) for (const name of names) {
			const file = path.join(repositoryRoot, diskRoot, name); await checkPath(repositoryRoot, file);
			routes.set(urlRoot + name, await readFile(file)); files.push(file);
		}
		const identities = [];
		for (const file of [...new Set(files)].filter((file) => !file.startsWith('\0')).sort()) {
			await checkPath(repositoryRoot, file); const bytes = await readFile(file);
			identities.push({path: path.relative(repositoryRoot, file).replaceAll('\\', '/'), byteLength: bytes.length, sha256: hash(bytes)});
		}
		await run.write('bundle.js', bundle);
		const html = '<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1024px;height:768px;overflow:hidden}.flat32-viewport{width:1024px;height:768px}.flat32-canvas{display:block;width:100%;height:100%}.flat32-scene-controls,.flat32-time-panel,#capture-result{display:none}</style><div id="main-content"></div><pre id="capture-result"></pre><script src="/bundle.js"></script>';
		await run.write('capture-host.html', html);
		await run.write('inputs.json', JSON.stringify({schema: 'local-sun-globe-sunset-comparison-v1', viewport: {width: 1024, height: 768}, horizontalFovDegrees: 60, colorModel: 'color-reset-slope-078-p2', cameraPolicy: 'Face resolved sunset azimuth at five degrees elevation.', observationPolicy: 'Ordinary San Jose June 20, 2024 sunset preset; resolve through production LocationTimeController.', package: {identity: SHARED_PACKAGE_IDENTITY, report: SHARED_PACKAGE_REPORT, solarInterpolation: SHARED_PACKAGE_SOLAR_INTERPOLATION}, derivation: {operation: 'Bundle unchanged production Flat32Application with contained caller selecting existing configuration and ordinary UI controls.', entry: path.relative(repositoryRoot, entry), inputs: identities, output: {path: 'bundle.js', sha256: hash(bundle)}, worker: {operation: 'Rollup production module Worker with inline dynamic imports; resolve existing Three decoder without changing its source.', entry: path.relative(repositoryRoot, workerEntry), output: {path: 'shared-cache-worker.js', sha256: hash(routes.get('/shared-cache-worker.js'))}}, htmlSha256: hash(html)}, node: process.version, warnings}, null, '\t'));
		host = createServer(async (request, response) => {
			try {
				const url = new URL(request.url, 'http://127.0.0.1');
				if (request.method !== 'GET') {response.writeHead(405).end(); return;}
				if (url.pathname === '/api/distant-sun-scene-cache') {
					const raw = url.searchParams.get('solarZenithDegrees');
					if (!raw || [...url.searchParams.keys()].some((key) => key !== 'solarZenithDegrees')) throw new Error('Invalid cache request.');
					response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(service.resolve(Number(raw), 'scene-caches/'))); return;
				}
				if (url.pathname.startsWith('/scene-caches/')) {
					const relative = decodeURIComponent(url.pathname.slice('/scene-caches/'.length)), asset = await service.resolveAsset(relative);
					assetIdentities.set(relative, {path: relative, byteLength: asset.byteLength, sha256: hash(asset.bytes)});
					response.setHeader('Content-Type', asset.contentType); response.end(asset.bytes); return;
				}
				const bytes = routes.get(url.pathname);
				if (bytes) {response.setHeader('Content-Type', url.pathname.endsWith('.js') ? 'text/javascript' : url.pathname.endsWith('.json') ? 'application/json' : 'application/octet-stream'); response.end(bytes);}
				else if (url.pathname === '/') {response.setHeader('Content-Type', 'text/html'); response.end(html);}
				else response.writeHead(404).end();
			} catch (error) {serverFailures.push({url: request.url, failure: String(error)}); response.writeHead(500).end(String(error));}
		});
		await new Promise((resolve, reject) => {host.once('error', reject); host.listen(0, '127.0.0.1', resolve);});
		const address = host.address(); if (!address || typeof address === 'string') throw new Error('Missing loopback address.');
		const args = ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling'];
		await checkPath(run.root, profile);
		const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
		browser = await puppeteer.launch({executablePath, headless: 'new', userDataDir: profile, protocolTimeout: 600000, args});
		await run.write('browser.json', JSON.stringify({version: await browser.version(), executablePath, executableSha256: hash(await readFile(executablePath)), args, profilePolicy: 'Fresh disposable profile removed before sealing'}, null, '\t'));
		const page = await browser.newPage();
		page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
		page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
		await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 1});
		await run.progress('capture', 'Preparing ordinary spherical/distant San Jose sunset with 60-degree horizontal FOV.');
		const start = performance.now();
		await page.goto(`http://127.0.0.1:${address.port}`, {waitUntil: 'domcontentloaded', timeout: 30000});
		await page.waitForFunction(() => ['complete', 'failed'].includes(document.getElementById('capture-result')?.dataset.state), {timeout: 540000, polling: 250});
		const facts = JSON.parse(await page.$eval('#capture-result', (element) => element.textContent));
		if (!facts.accepted) throw new Error(facts.failure);
		if (consoleMessages.some((message) => message.type === 'pageerror')) throw new Error('Browser page error.');
		const canvas = await page.$('#flat32-canvas'); if (!canvas) throw new Error('Missing capture canvas.');
		const bytes = await canvas.screenshot(); await run.write('san-jose-sunset.png', bytes);
		const result = {accepted: true, facts, browserMilliseconds: performance.now() - start, browser: await browser.version(), executablePath, launchArguments: args, consoleMessages, serverFailures, servedCacheAssets: [...assetIdentities.values()], artifact: {path: 'san-jose-sunset.png', byteLength: bytes.length, sha256: hash(bytes)}};
		await browser.close(); browser = undefined;
		await run.write('result.json', JSON.stringify(result, null, '\t'));
	} catch (error) {failure = String(error); await run.write('failure.json', JSON.stringify({failure, consoleMessages, serverFailures}));}
	finally {
		await browser?.close(); if (host) await new Promise((resolve) => host.close(resolve));
		await checkPath(run.root, profile); await rm(profile, {recursive: true, force: true});
		await run.finish(failure ? 'failed' : 'accepted', failure);
	}
	console.log(JSON.stringify({run: run.name, accepted: !failure, failure}));
	if (failure) process.exitCode = 1;
}
await main();
