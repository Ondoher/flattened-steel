import path from 'node:path';
import {createServer} from 'node:http';
import {readFile, rm} from 'node:fs/promises';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {createRequire} from 'node:module';
import {ExperimentRun} from './ExperimentRun.js';
import {repositoryRoot, checkPath, hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';

/** Build and capture the selected-production sky control in a new run.
 * @returns {Promise<void>} - Completion with sealed evidence.
 */
async function main() {
	await requireHeavyExecution();
	// The package exposes a callable CommonJS entry; NodeNext misclassifies its ESM declarations.
	const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');
	const run = await ExperimentRun.create('control-v0');
	let browser;
	let host;
	let failure = null;
	const profile = path.join(run.root, 'profile');
	try {
		const entry = path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/control-browser.js');
		await checkPath(repositoryRoot, entry);
		const bundle = await rollup({input: entry, plugins: [nodeResolve({browser: true}), commonjs()]});
		let code;
		let inputs;
		try {
			code = (await bundle.generate({format: 'iife'})).output[0].code.replaceAll(
				'process.env.NODE_ENV',
				JSON.stringify('production'),
			);
			inputs = bundle.watchFiles;
		} finally {
			await bundle.close();
		}
		const identities = [];
		inputs.push(
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/ExperimentRun.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/capture-control.js'),
			path.join(repositoryRoot, 'experiments/local-sun-cache-reuse/heavy-execution-admission.js'),
			path.join(repositoryRoot, 'package-lock.json'),
		);
		for (const input of [...new Set(inputs)].filter((value) => !value.startsWith('\0'))) {
			await checkPath(repositoryRoot, input);
			const bytes = await readFile(input);
			identities.push({
				path: path.relative(repositoryRoot, input).replaceAll('\\', '/'),
				byteLength: bytes.length,
				sha256: hash(bytes),
			});
		}
		await run.write('bundle.js', code);
		await run.write(
			'inputs.json',
			`${JSON.stringify({schema: 'local-sun-control-inputs-v1', command: 'node experiments/local-sun-cache-reuse/capture-control.js', operation: 'Bundle read-only production facade and experiment renderer, construct selected N4 cache, render Flat 0 sky.', inputs: identities, virtualModules: inputs.filter((value) => value.startsWith('\0')), bundleSha256: hash(code)}, null, '\t')}\n`,
		);
		host = createServer((request, response) => {
			response.writeHead(request.url === '/' || request.url === '/bundle.js' ? 200 : 404, {
				'content-type': request.url === '/bundle.js' ? 'text/javascript' : 'text/html',
			});
			response.end(
				request.url === '/bundle.js'
					? code
					: '<!doctype html><html><title>V0 control</title><script src="/bundle.js"></script></html>',
			);
		});
		await new Promise((resolve, reject) => {
			host.once('error', reject);
			host.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = host.address();
		if (!address || typeof address === 'string') throw new Error('No loopback address.');
		await checkPath(run.root, profile);
		const executablePath =
			process.env.LOCAL_SUN_CACHE_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
		const args = [
			'--enable-gpu',
			'--use-angle=d3d11',
			'--ignore-gpu-blocklist',
			'--disable-background-timer-throttling',
		];
		browser = await puppeteer.launch({
			executablePath,
			headless: 'new',
			userDataDir: profile,
			args,
		});
		await run.write(
			'browser.json',
			`${JSON.stringify({version: await browser.version(), executablePath, executableSha256: hash(await readFile(executablePath)), args, headless: 'new', node: process.version, profilePolicy: 'fresh temporary profile; removed after browser closure before run sealing'}, null, '\t')}\n`,
		);
		const page = await browser.newPage();
		page.setDefaultTimeout(0);
		await page.setViewport({width: 720, height: 414, deviceScaleFactor: 1});
		page.on('console', (message) => {
			console.log(message.text());
			void run.progress('browser', message.text());
		});
		page.on('pageerror', (error) => {
			console.log(String(error));
			void run.progress('browser-error', String(error));
		});
		await page.goto(`http://127.0.0.1:${address.port}/`, {waitUntil: 'load'});
		await run.progress('cache', 'Building full selected production cache.');
		/** @type {LocalSunControlCapture} */
		const result = JSON.parse(
			await page.evaluate(() =>
				/** @type {LocalSunControlBridge} */ (/** @type {unknown} */ (globalThis)).localSunControl(),
			),
		);
		const image = result.image;
		delete result.image;
		await run.write('flat-0.png', Buffer.from(image.slice(image.indexOf(',') + 1), 'base64'));
		await run.write('result.json', `${JSON.stringify(result, null, '\t')}\n`);
	} catch (error) {
		failure = String(error.stack ?? error);
	} finally {
		try {
			await browser?.close();
			await checkPath(run.root, profile);
			await rm(profile, {recursive: true, force: true});
		} catch (error) {
			failure ??= `Browser cleanup failed: ${String(error)}`;
		}
		try {
			if (host?.listening)
				await new Promise((resolve, reject) =>
					host.close((error) => (error ? reject(error) : resolve(undefined))),
				);
		} catch (error) {
			failure ??= `Host cleanup failed: ${String(error)}`;
		}
	}
	await run.finish(failure ? 'failed' : 'accepted', failure);
	console.log(JSON.stringify({run: run.name, failure}));
	if (failure) process.exitCode = 1;
}

await main();
