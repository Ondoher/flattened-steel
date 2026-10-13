import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import os from 'node:os';
import {rollup, VERSION as rollupVersion} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {babel} from '@rollup/plugin-babel';
import {transformSync, version as babelVersion} from '@babel/core';
import puppeteer from 'puppeteer';
import {LocalSunNormalizationControls} from '../normalization/LocalSunNormalizationControls.js';
import {LocalSunGpuQualification} from '../gpu/LocalSunGpuQualification.js';

/** Offline, serialized ordinary-application qualification with immutable evidence and existing host limits. */
export class LocalSunP4Qualification {
	/** Repository-identity and real-path authority.
	 *
	 * @type {LocalSunNormalizationControls}
	 */ _paths = new LocalSunNormalizationControls();
	/** Existing owned-process sampler, reused without a new native helper.
	 *
	 * @type {LocalSunGpuQualification}
	 */ _monitor = new LocalSunGpuQualification();
	/** Call this method to run one bounded actual application job in a new immutable run.
	 *
	 * @param {SupportedCacheScatteringOrder} order - Qualified scattering order.
	 * @param {string} serial - New five-digit run serial.
	 * @returns {Promise<string>} - New passed run path, or preserved failed run.
	 */
	async run(order, serial) {
		if (![1, 2, 4].includes(order) || !/^\d{5}$/.test(serial))
			throw new RangeError('Qualified order and new five-digit serial required.');
		const relative = 'tmp/production-local-sun-cache-promotion/runs/' + serial + '-p4-application';
		const root = this._paths.checkedPath(relative);
		if (existsSync(root)) throw new Error('Immutable P4 run already exists.');
		if (os.freemem() < 4 * 1024 ** 3) throw new Error('Four GiB execution reserve required.');
		mkdirSync(root, {recursive: true});
		const started = performance.now(),
			samples = [],
			diagnostics = [],
			parents = [];
		let browser, server, interval, deadline, failure;
		try {
			const environment = {
				name: 'proof-production-environment',
				/** Called by offline bundling to resolve the installed application environment constant.
				 *
				 * @param {string} code - Module JavaScript source.
				 * @param {string} id - Exact module path.
				 * @returns {LocalSunP4EnvironmentTransformResult} - Transformed JavaScript or no applicable substitution.
				 */ transform(code, id) {
					if (!code.includes('process.env.NODE_ENV')) return null;
					const result = transformSync(code, {
						filename: id,
						babelrc: false,
						configFile: false,
						presets: ['@babel/preset-react'],
						plugins: [
							/** Called by Babel setup to supply the bounded environment substitution visitor. */ ({
								types,
							}) => ({
								visitor: {
									/** Called by Babel to replace only the exact NODE_ENV member expression. */ MemberExpression(
										path,
									) {
										if (path.matchesPattern('process.env.NODE_ENV'))
											path.replaceWith(types.stringLiteral('production'));
									},
								},
							}),
						],
					});
					return {code: result.code, map: null};
				},
			};
			const bundle = await rollup({
				input: this._paths.checkedPath(
					'scripts/algorithm32/local-sun-cache/application/LocalSunP4BrowserProof.js',
				),
				plugins: [
					environment,
					nodeResolve({browser: true}),
					/**
					 *
					 * @type {LocalSunP4CommonJsFactory}
					 */ (
						/**
						 *
						 * @type {unknown}
						 */ (commonjs)
					)(),
					babel({
						babelHelpers: 'bundled',
						babelrc: false,
						configFile: false,
						presets: ['@babel/preset-react'],
						extensions: ['.js', '.jsx'],
						exclude: 'node_modules/**',
					}),
				],
				onwarn: /** Called by bundling to reject unaccounted build warnings. */ (warning) => {
					if (warning.code !== 'CIRCULAR_DEPENDENCY') throw new Error(warning.message);
				},
			});
			let source;
			try {
				source = (await bundle.generate({format: 'iife', name: 'LocalSunP4Proof', inlineDynamicImports: true}))
					.output[0].code;
			} finally {
				await bundle.close();
			}
			for (const file of bundle.watchFiles) {
				const path = file.replaceAll('\\', '/').split('/flattened-steel/')[1];
				if (path && (path.startsWith('src/') || path.startsWith('scripts/')))
					parents.push({path, sha256: this._paths.hash(path)});
			}
			for (const path of [
				'scripts/algorithm32/local-sun-cache/application/LocalSunP4Qualification.js',
				'scripts/algorithm32/local-sun-cache/gpu/LocalSunGpuQualification.js',
				'scripts/algorithm32/local-sun-cache/normalization/LocalSunNormalizationControls.js',
				'package-lock.json',
				'server/flat32/data/brightest-2000-stellar-package-v1/manifest.json',
				'server/flat32/data/human-vision-filter-package-v1/manifest.json',
			])
				parents.push({path, sha256: this._paths.hash(path)});
			writeFileSync(root + '/bundle.js', source, {flag: 'wx'});
			const controlsPath =
				'src/algorithm32/implementation/flat-earth/fixtures/local-sun-p4-celestial-controls.json';
			parents.push({path: controlsPath, sha256: this._paths.hash(controlsPath)});
			writeFileSync(
				root + '/inputs.json',
				JSON.stringify(
					{
						order,
						serial,
						parents,
						operation:
							'Explicit ordinary compact candidate; actual user controls, exact receiver/celestial publication, canonical reuse and resource completion. No new numerical tolerance or physical-accuracy claim.',
						limits: {
							freeMemoryReserveBytes: 4 * 1024 ** 3,
							ownedProcessCeilingBytes: 8 * 1024 ** 3,
							maximumMilliseconds: 600000,
						},
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			server = createServer(
				/** Called by the owned loopback server to serve only checked qualification inputs. */ (
					incoming,
					response,
				) => {
					try {
						const url = new URL(incoming.url ?? '/', 'http://127.0.0.1');
						if (incoming.method !== 'GET') {
							response.writeHead(405).end();
							return;
						}
						if (url.pathname === '/') {
							response
								.writeHead(200, {'Content-Type': 'text/html'})
								.end('<!doctype html><html><body><script src="/bundle.js"></script></body></html>');
							return;
						}
						if (url.pathname === '/bundle.js') {
							response.writeHead(200, {'Content-Type': 'application/javascript'}).end(source);
							return;
						}
						if (url.pathname === '/controls.json') {
							response
								.writeHead(200, {'Content-Type': 'application/json'})
								.end(readFileSync(this._paths.checkedPath(controlsPath)));
							return;
						}
						if (url.pathname === '/favicon.ico') {
							response.writeHead(204).end();
							return;
						}
						const prefix = url.pathname.startsWith('/catalog/')
							? '/catalog/'
							: url.pathname.startsWith('/vision/')
								? '/vision/'
								: null;
						if (!prefix) {
							response.writeHead(404).end();
							return;
						}
						const path =
							'server/flat32/data/' +
							(prefix === '/catalog/'
								? 'brightest-2000-stellar-package-v1/'
								: 'human-vision-filter-package-v1/') +
							decodeURIComponent(url.pathname.slice(prefix.length));
						const file = this._paths.checkedPath(path);
						response
							.writeHead(200, {
								'Content-Type': path.endsWith('.json')
									? 'application/json'
									: 'application/octet-stream',
							})
							.end(readFileSync(file));
					} catch (error) {
						diagnostics.push(String(error));
						response.writeHead(404).end();
					}
				},
			);
			await new Promise(
				/** Called by server startup to resolve the assigned loopback port. */ (resolveListen) =>
					server.listen(0, '127.0.0.1', resolveListen),
			);
			browser = await puppeteer.launch({
				executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
				headless: 'new',
				userDataDir: this._paths.checkedPath('.codex-tmp/local-sun-p4/' + serial),
				args: [
					'--enable-gpu',
					'--use-angle=d3d11',
					'--ignore-gpu-blocklist',
					'--disable-background-timer-throttling',
				],
				protocolTimeout: 600000,
			});
			const page = await browser.newPage();
			await page.setViewport({width: 512, height: 512, deviceScaleFactor: 1});
			page.on(
				'pageerror',
				/** Called by Chrome diagnostics to record actual page failures. */ (error) =>
					diagnostics.push(String(error)),
			);
			page.on(
				'console',
				/** Called by Chrome diagnostics to record console errors. */ (message) => {
					if (message.type() === 'error') diagnostics.push(message.text());
				},
			);
			const sample =
				/** Called by the host monitor to record and enforce execution resource guards.
				 *
				 * @returns {void} - Owned browser closed when an execution guard fails.
				 */ () => {
					const record = {
						elapsedMilliseconds: performance.now() - started,
						freeBytes: os.freemem(),
						ownedProcessBytes: this._monitor.sampleOwnedProcessBytes(browser.process().pid),
					};
					samples.push(record);
					console.log(
						'P4 ' +
							Math.round(record.elapsedMilliseconds / 1000) +
							's free=' +
							record.freeBytes +
							' owned=' +
							record.ownedProcessBytes,
					);
					if (record.freeBytes < 4 * 1024 ** 3 || record.ownedProcessBytes > 8 * 1024 ** 3) {
						failure = new Error('P4 execution resource guard exceeded.');
						void browser.close();
					}
				};
			sample();
			if (failure) throw failure;
			interval = setInterval(sample, 10000);
			deadline = setTimeout(
				/** Called by the job deadline to close only the owned browser. */ () => {
					failure = new Error('P4 ten-minute job deadline exceeded.');
					void browser.close();
				},
				600000,
			);
			const address = server.address();
			if (typeof address !== 'object' || address === null)
				throw new Error('Owned proof server address unavailable.');
			await page.goto('http://127.0.0.1:' + address.port + '/', {waitUntil: 'load', timeout: 60000});
			const result = await page.evaluate(
				/** Called by Chrome evaluation to run the genuine ordinary application proof. */ async (
					selectedOrder,
				) => await new globalThis.LocalSunP4Proof.LocalSunP4BrowserProof().run(selectedOrder),
				order,
			);
			if (failure) throw failure;
			if (
				result.state !== 'passed' ||
				result.rows.length !== 4 ||
				!result.cleanupComplete ||
				!result.cameraOnlyReuse
			)
				throw new Error('Ordinary P4 browser assertions incomplete.');
			for (const parent of parents)
				if (this._paths.hash(parent.path) !== parent.sha256)
					throw new Error('P4 source changed during the job: ' + parent.path);
			const images = [];
			const rows = result.rows.map(
				/** Called by artifact persistence to preserve each actual canvas image and row. */ (row) => {
					if (!row.imageDataUrl?.startsWith('data:image/png;base64,'))
						throw new Error('Actual scene image missing.');
					const name = row.action + '.png';
					writeFileSync(
						root + '/' + name,
						Buffer.from(row.imageDataUrl.slice('data:image/png;base64,'.length), 'base64'),
						{flag: 'wx'},
					);
					images.push(name);
					const {imageDataUrl, ...record} = row;
					return record;
				},
			);
			writeFileSync(
				root + '/result.json',
				JSON.stringify(
					{...result, rows, hostElapsedMilliseconds: performance.now() - started, samples, diagnostics},
					null,
					2,
				),
				{flag: 'wx'},
			);
			writeFileSync(
				root + '/manifest.json',
				JSON.stringify(
					{
						schema: 'local-sun-p4-application-proof-v1',
						state: 'passed',
						order,
						serial,
						parents,
						tools: {
							node: process.version,
							browser: await browser.version(),
							rollup: rollupVersion,
							babel: babelVersion,
						},
						artifacts: ['inputs.json', 'bundle.js', 'result.json', ...images].map(
							/** Called by manifest assembly to identify each immutable artifact. */ (path) => ({
								path,
								sha256: this._paths.hash(relative + '/' + path),
							}),
						),
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			console.log('PASSED ' + relative);
			return relative;
		} catch (error) {
			writeFileSync(
				root + '/manifest.json',
				JSON.stringify(
					{
						schema: 'local-sun-p4-application-proof-v1',
						state: 'failed',
						order,
						serial,
						parents,
						error: String(error),
						samples,
						diagnostics,
					},
					null,
					2,
				),
				{flag: 'wx'},
			);
			throw error;
		} finally {
			clearInterval(interval);
			clearTimeout(deadline);
			await browser?.close();
			server?.closeAllConnections();
			await new Promise(
				/** Called by teardown to await owned server closure. */ (done) =>
					server ? server.close(done) : done(),
			);
		}
	}
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
	await new LocalSunP4Qualification().run(
		/**
		 *
		 * @type {SupportedCacheScatteringOrder}
		 */ (Number(process.argv[2])),
		process.argv[3],
	);
}
