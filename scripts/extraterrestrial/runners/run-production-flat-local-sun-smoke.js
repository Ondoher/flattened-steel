import {createServer} from 'node:http';
import {appendFile, mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const applicationRoot = resolve(repositoryRoot, 'dist/flat32');
const outputRoot = resolve(repositoryRoot, 'tmp/extraterrestrial/production-integration/flat-local-sun-smoke');
const acceptedDiagnostics = [
	'flat180-default-n1',
	'flat180-wide-n4',
	'flat0-wide-n4',
	'flat135-wide-n4',
	'spherical-default-n1',
	'spherical-wide-n4',
];
const diagnostic = process.argv[2] ?? acceptedDiagnostics[0];
if (!acceptedDiagnostics.includes(diagnostic)) {
	throw new RangeError(`Diagnostic must be one of: ${acceptedDiagnostics.join(', ')}.`);
}
const output = resolve(outputRoot, `${diagnostic}.png`);
const logOutput = resolve(outputRoot, `${diagnostic}.log`);
await mkdir(outputRoot, {recursive: true});
await writeFile(logOutput, '');
/** @param {string} message */
const report = async (message) => {
	process.stdout.write(message);
	await appendFile(logOutput, message);
};
const contentTypes = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript'};
const server = createServer(async (request, response) => {
	try {
		const relativePath =
			request.url === '/' || request.url?.startsWith('/?')
				? 'index.html'
				: decodeURIComponent(request.url?.split('?')[0] ?? '').replace(/^\/+/, '');
		const path = resolve(applicationRoot, relativePath);
		if (path !== applicationRoot && !path.startsWith(`${applicationRoot}${sep}`)) {
			response.writeHead(403).end();
			return;
		}
		const file = await readFile(path);
		response.writeHead(200, {'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream'});
		response.end(file);
	} catch {
		response.writeHead(404).end();
	}
});

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;
const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 600000,
	defaultViewport: {width: 960, height: 540, deviceScaleFactor: 1},
	args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});

try {
	const page = await browser.newPage();
	const errors = [];
	page.setDefaultTimeout(600000);
	page.on('pageerror', (error) => {
		errors.push(error.message);
		void report(`pageerror:${error.message}\n`);
	});
	page.on('console', (message) => void report(`browser:${message.type()}:${message.text()}\n`));
	try {
		await page.goto(`http://127.0.0.1:${port}/?diagnostic=${diagnostic}`, {
			waitUntil: 'domcontentloaded',
			timeout: 5000,
		});
	} catch (error) {
		if (!(error instanceof Error) || error.name !== 'TimeoutError') throw error;
		await report('progress:navigation-continues-during-application-setup\n');
	}
	const deadline = Date.now() + 600000;
	let lastYieldCount = null;
	while (Date.now() < deadline) {
		let progress;
		try {
			progress = await page.evaluate(() => {
				const shell = document.querySelector('.flat32-shell');
				const canvas = document.querySelector('#flat32-canvas');
				return {
					state: shell?.dataset.flat32State,
					yieldCount: canvas?.dataset.flat32CacheYieldCount,
					renderPath: canvas?.dataset.flat32RenderPath,
					error: document.querySelector('#flat32-error')?.textContent,
				};
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!message.includes('Execution context was destroyed')) throw error;
			await report('progress:navigation-context-replaced\n');
			await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
			continue;
		}
		if (progress.yieldCount !== lastYieldCount) {
			await report(`progress:${JSON.stringify(progress)}\n`);
			lastYieldCount = progress.yieldCount;
		}
		if (progress.state === 'atmosphere-failed') {
			throw new Error(progress.error || 'Flat32 atmosphere setup failed.');
		}
		if (progress.state === 'ready' && progress.renderPath === 'algorithm32') break;
		await new Promise((resolveWait) => setTimeout(resolveWait, 5000));
	}
	if (Date.now() >= deadline)
		throw new Error('Flat/local N1 smoke did not reach a terminal state within ten minutes.');
	if (diagnostic === 'spherical-default-n1') {
		const switched = await page.evaluate(() => {
			const button = [...document.querySelectorAll('button')].find(
				(candidate) => candidate.textContent?.trim() === 'Use Globe Time',
			);
			button?.click();
			return button !== undefined;
		});
		if (!switched) throw new Error('Distant-Sun diagnostic could not select globe solar noon.');
		await page.waitForFunction(
			() =>
				document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready' &&
				document.querySelector('#flat32-canvas')?.dataset.flat32RenderPath === 'algorithm32' &&
				[...document.querySelectorAll('button')].some(
					(button) => button.textContent?.trim() === 'Use Flat Time',
				),
			{timeout: 600000, polling: 1000},
		);
	}
	await mkdir(outputRoot, {recursive: true});
	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	await canvas.screenshot({path: output, type: 'png'});
	const state = await page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		return {
			state: shell?.dataset.flat32State,
			pairing: shell?.dataset.flat32AtmospherePairing,
			maximumOrder: shell?.dataset.flat32AtmosphereMaximumOrder,
			setupDurationMilliseconds: shell?.dataset.flat32AtmosphereSetupDurationMilliseconds,
			error: document.querySelector('#flat32-error')?.textContent,
		};
	});
	if (errors.length > 0) throw new Error(`Flat32 page errors: ${errors.join(' | ')}`);
	await report(`${JSON.stringify({output, bytes: (await stat(output)).size, state}, null, 2)}\n`);
} finally {
	await browser.close();
	await new Promise((resolveClose) => server.close(resolveClose));
}
