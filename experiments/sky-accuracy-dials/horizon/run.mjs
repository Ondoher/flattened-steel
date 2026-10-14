import assert from 'node:assert/strict';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {createRun, identity, readRepository, resolveRepository, checkedAbsolute, sha256, verifyRun} from '../io/files.mjs';
import {createProductionSharedCacheService, SHARED_PACKAGE_IDENTITY} from '../../../server/flat32/features/shared-cache/selection.js';

const sourceRoot = 'experiments/sky-accuracy-dials/horizon';
const packageRoot = `server/flat32/data/shared-block/${SHARED_PACKAGE_IDENTITY}`;
const maximumMilliseconds = 480000;
const maximumEvidenceBytes = 16 * 1024 ** 2;

/** Run one bounded paired observation using the ordinary installed cache owners.
 * All output is owned by a fresh immutable experiment run; setup/execution failures
 * are sealed and rethrown after browser shutdown and scratch cleanup.
 * @returns {Promise<void>} Complete after sealed evidence verification.
 */
async function main() {
	const started = Date.now();
	const parents = new Map();
	for (const name of ['package.json', 'package-lock.json', `${sourceRoot}/browser.js`, `${sourceRoot}/run.mjs`,
		'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-diagnosis-plan.md',
		`${packageRoot}/package-set.json`, 'server/flat32/features/shared-cache/selection.js']) parents.set(name, identity(name));
	const recipe = {parents: [...parents.values()], operation: 'H1 paired current-cache stage readback with ordinary San Jose controls; preserve original shader and borrow its exact uniforms/cache textures.',
		parameters: {maximumMilliseconds, maximumEvidenceBytes, elevationsDegrees: [0.05, 0.25, 1, 3, 10, 20], screenX: [0.2, 0.5, 0.8], viewport: [640, 480],
			prediction: 'If gray originates only after display, pre-display RGB retains orange while display chroma falls. If both are gray, investigate transport/cache/physical inputs next. Geometry may amplify either effect.',
			stop: 'One browser job, no automatic retry, ten-minute absolute deadline; no production fix or field regeneration.'}};
	const run = createRun('horizon-stages', recipe);
	console.log(JSON.stringify({run: run.path, started: new Date(started).toISOString()}));
	let browser = null;
	let server = null;
	let failure = null;
	let writtenBytes = 0;
	const events = [];
	const observed = [];
	/** Write bounded new evidence with complete current input identities.
	 * @param {string} name Exclusive artifact name.
	 * @param {unknown} data JSON-compatible value or exact bytes.
	 * @returns {DialFileIdentity} Identity of the new artifact.
	 */
	function write(name, data) {
		const bytes = Buffer.isBuffer(data) ? data : Buffer.from(JSON.stringify(data));
		assert.ok(writtenBytes + bytes.length <= maximumEvidenceBytes, 'H1 retained evidence limit.');
		const record = run.write(name, bytes, {...recipe, parents: [...parents.values()]});
		writtenBytes += bytes.length;
		return record;
	}
	const timer = setTimeout(() => {failure = new Error('H1 ten-minute deadline reached.'); void browser?.close();}, maximumMilliseconds);
	try {
		write('package.json', recipe);
		run.progress('setup', 'Bundle observation code and authenticate the selected production cache service.');
		const bundle = await rollup({input: resolveRepository(`${sourceRoot}/browser.js`), plugins: [nodeResolve()], onwarn: (warning) => events.push({kind: 'rollup', message: warning.message})});
		const generated = await bundle.generate({format: 'iife'});
		await bundle.close();
		const probeCode = generated.output[0].code;
		const probePath = checkedAbsolute(path.join(run.scratchPath, 'probe.js'), false);
		writeFileSync(probePath, probeCode, {flag: 'wx'});
		write('probe-bundle.js.gz', gzipSync(Buffer.from(probeCode)));
		const service = await createProductionSharedCacheService();
		const startup = `window.__horizonApplication = application;
const controller = application._locationTimeController;
const originalStart = controller.start.bind(controller);
const originalSelectTime = controller.selectTime.bind(controller);
controller.selectTime = (state, index) => new URLSearchParams(location.search).get('horizonCase') === 'distant' ? controller.selectGlobeTime(state, 1) : originalSelectTime(state, index);
controller.start = () => {
 const initial = originalStart();
 const state = controller.nextLocation(controller.nextLocation(initial));
 return new URLSearchParams(location.search).get('horizonCase') === 'local' ? controller.selectTime(state, 0) : controller.selectGlobeTime(state, 1);
};
window.__flat32Cleanup = application.dispose.bind(application);`;
		const snapshots = new Set();
		server = createServer(async (request, response) => {
			try {
				assert.equal(request.method, 'GET');
				const url = new URL(request.url, 'http://127.0.0.1');
				if (url.pathname === '/favicon.ico') {response.writeHead(204).end(); return;}
				let bytes;
				let contentType = 'application/octet-stream';
				if (url.pathname === '/api/distant-sun-scene-cache') {
					bytes = Buffer.from(JSON.stringify(service.resolve(Number(url.searchParams.get('solarZenithDegrees')), '/scene-caches/')));
					contentType = 'application/json';
				} else if (url.pathname.startsWith('/scene-caches/')) {
					const relative = decodeURIComponent(url.pathname.slice('/scene-caches/'.length));
					const asset = await service.resolveAsset(relative);
					bytes = asset.bytes; contentType = asset.contentType;
					parents.set(`${packageRoot}/${relative}`, identity(`${packageRoot}/${relative}`, bytes));
				} else if (url.pathname === '/probe.js') {bytes = Buffer.from(probeCode); contentType = 'text/javascript';}
				else {
					const relative = url.pathname.startsWith('/stellar-catalogs/') ? `server/flat32/data/${decodeURIComponent(url.pathname.slice('/stellar-catalogs/'.length))}`
						: url.pathname.startsWith('/presentation-filters/') ? `server/flat32/data/${decodeURIComponent(url.pathname.slice('/presentation-filters/'.length))}`
						: `dist/flat32/${url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1))}`;
					bytes = readRepository(relative);
					parents.set(relative, identity(relative, bytes));
					contentType = relative.endsWith('.js') ? 'text/javascript' : relative.endsWith('.html') ? 'text/html' : relative.endsWith('.css') ? 'text/css' : 'application/json';
					if (relative.endsWith('.js') && !snapshots.has(relative)) {
						write(`inputs/${path.basename(relative)}.gz`, gzipSync(bytes)); snapshots.add(relative);
					}
					if (relative === 'dist/flat32/flat32.js') {
						const source = bytes.toString('utf8');
						assert.equal(source.split('window.__flat32Cleanup = application.dispose.bind(application);').length, 2);
						bytes = Buffer.from(source.replace('window.__flat32Cleanup = application.dispose.bind(application);', startup));
						const text = bytes.toString('utf8');
						const start = text.indexOf('class ShaderRuntimePass');
						const point = text.indexOf('this._scene.add(this._mesh);', start);
						assert.ok(start >= 0 && point > start);
						const end = point + 'this._scene.add(this._mesh);'.length;
						bytes = Buffer.from(text.slice(0, end) + '\n(window.__horizonPasses ??= []).push(this);\n' + text.slice(end));
					}
				}
				response.writeHead(200, {'Content-Type': contentType, 'Cache-Control': 'no-store'}).end(bytes);
			} catch (error) {events.push({kind: 'http-error', url: request.url, message: String(error)}); response.writeHead(500).end(String(error));}
		});
		await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
		const address = server.address();
		assert.ok(address && typeof address !== 'string');
		const profilePath = checkedAbsolute(path.join(run.scratchPath, 'chrome-profile'), false);
		mkdirSync(profilePath);
		const executablePath = checkedAbsolute(path.resolve(process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'));
		const executableBytes = readFileSync(executablePath);
		write('tool.json', {node: process.version, chrome: {path: executablePath, sha256: sha256(executableBytes), byteLength: executableBytes.length}, bundleSha256: sha256(probeCode), startupInjection: startup});
		browser = await puppeteer.launch({executablePath, headless: true, userDataDir: profilePath, protocolTimeout: maximumMilliseconds,
			args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling']});
		const page = await browser.newPage();
		await page.setViewport({width: 640, height: 480, deviceScaleFactor: 1});
		page.on('pageerror', (error) => events.push({kind: 'page-error', message: String(error)}));
		page.on('console', (message) => {if (message.type() === 'error') events.push({kind: 'console-error', message: message.text().slice(0, 4000)});});
		for (const mode of ['distant', 'local']) {
			run.guard();
			run.progress(mode, `Prepare San Jose ${mode === 'local' ? 'Flat closest' : 'solar noon'} with ordinary physical selections.`);
			const query = mode === 'local' ? '?diagnostic=flat0-default-n1&horizonCase=local' : '?horizonCase=distant';
			await page.goto(`http://127.0.0.1:${address.port}/${query}`, {waitUntil: 'domcontentloaded', timeout: 60000});
			await page.waitForFunction(() => ['ready', 'atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.getAttribute('data-flat32-state')), {timeout: Math.max(1, maximumMilliseconds - (Date.now() - started))});
			const labels = await page.$eval('.flat32-shell', (shell) => ({.../** @type {HTMLElement} */ (shell).dataset}));
			write(`${mode}-labels.json`, labels);
			assert.equal(labels.flat32State, 'ready', JSON.stringify(labels));
			assert.equal(labels.flat32Location, 'San Jose');
			await page.addScriptTag({url: `http://127.0.0.1:${address.port}/probe.js`});
			const result = await page.evaluate(() => window.__observeHorizon());
			write(`${mode}-shader.glsl.gz`, gzipSync(Buffer.from(result.shader)));
			write(`${mode}-probe.glsl.gz`, gzipSync(Buffer.from(result.probeShader)));
			write(`${mode}-observation.json`, {facts: result.facts, rays: result.rays});
			observed.push({mode, rays: result.rays.length, elapsedMilliseconds: Date.now() - started});
			console.log(JSON.stringify(observed.at(-1)));
			if (failure) throw failure;
		}
		write('browser.json', {version: await browser.version(), observed});
	} catch (error) {failure = error;}
	finally {
		clearTimeout(timer);
		await browser?.close().catch((error) => {failure ??= error;});
		if (server) await new Promise((resolve) => server.close(resolve));
		write('events.json', events);
		write('input-identities.json', [...parents.values()]);
		const result = {observed, elapsedMilliseconds: Date.now() - started, writtenBytes, failure: failure ? String(failure) : null};
		run.finish(failure ? 'failed' : 'accepted', result);
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, ...result}));
	}
	if (failure) throw failure;
}

await main();
