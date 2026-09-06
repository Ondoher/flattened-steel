import {createServer} from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const applicationRoot = resolve(repositoryRoot, 'dist/flat32');
const outputRoot = resolve(repositoryRoot, 'tmp/extraterrestrial/production-integration/san-jose-exposure-sequence');
const contentTypes = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript'};

/** Wait for one installed Algorithm32 frame after an application transition. */
async function waitForReady(page) {
	await page.waitForFunction(
		() =>
			document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready' &&
			document.querySelector('#flat32-canvas')?.dataset.flat32RenderPath === 'algorithm32',
		{timeout: 600000, polling: 1000},
	);
}

/** Click one application control and wait for its debounced replacement transaction. */
async function transition(page, selector) {
	const previousSignature = await page.evaluate(() => ({
		location: document.querySelector('#flat32-location-control')?.textContent?.trim(),
		time: document.querySelector('#flat32-time-value')?.textContent?.trim(),
		basis: document.querySelector('#flat32-time-basis-control')?.textContent?.trim(),
		setupDuration: document.querySelector('.flat32-shell')?.dataset.flat32AtmosphereSetupDurationMilliseconds,
	}));
	process.stdout.write(`transition:start:${selector}:${JSON.stringify(previousSignature)}\n`);
	await page.evaluate((acceptedSelector) => {
		const control = document.querySelector(acceptedSelector);
		if (!(control instanceof HTMLButtonElement)) {
			throw new Error(`Missing Flat32 transition control: ${acceptedSelector}`);
		}
		control.click();
	}, selector);
	await page.waitForFunction(
		(previous) => {
			const current = {
				location: document.querySelector('#flat32-location-control')?.textContent?.trim(),
				time: document.querySelector('#flat32-time-value')?.textContent?.trim(),
				basis: document.querySelector('#flat32-time-basis-control')?.textContent?.trim(),
			};
			return (
				current.location !== previous.location ||
				current.time !== previous.time ||
				current.basis !== previous.basis
			);
		},
		{timeout: 600000, polling: 100},
		previousSignature,
	);
	await waitForReady(page);
	await page.waitForFunction(
		(previousSetupDuration) => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32State === 'ready' &&
				shell.dataset.flat32AtmosphereSetupDurationMilliseconds !== previousSetupDuration
			);
		},
		{timeout: 600000, polling: 250},
		previousSignature.setupDuration,
	);
	await new Promise((resolveWait) => setTimeout(resolveWait, 2500));
	process.stdout.write(`transition:complete:${selector}\n`);
}

/** Capture one named San Jose state and return its visible application facts. */
async function captureState(page, id) {
	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	const output = resolve(outputRoot, `${id}.png`);
	await canvas.screenshot({path: output, type: 'png'});
	return page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		return {
			location: document.querySelector('#flat32-location-control')?.textContent?.trim(),
			time: document.querySelector('#flat32-time-value')?.textContent?.trim(),
			pairing: shell?.dataset.flat32AtmospherePairing,
			maximumOrder: shell?.dataset.flat32AtmosphereMaximumOrder,
			setupDurationMilliseconds: shell?.dataset.flat32AtmosphereSetupDurationMilliseconds,
		};
	});
}

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

await mkdir(outputRoot, {recursive: true});
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;
const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 900000,
	defaultViewport: {width: 960, height: 540, deviceScaleFactor: 1},
	args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});

try {
	const page = await browser.newPage();
	const pageErrors = [];
	page.setDefaultTimeout(600000);
	page.on('pageerror', (error) => pageErrors.push(error.message));
	await page.goto(`http://127.0.0.1:${port}/?diagnostic=spherical-wide-n4`, {
		waitUntil: 'domcontentloaded',
		timeout: 600000,
	});
	await waitForReady(page);

	for (let locationAttempt = 0; locationAttempt < 3; locationAttempt += 1) {
		const location = await page.$eval('#flat32-location-control', (control) => control.textContent?.trim());
		if (location === 'San Jose') break;
		await transition(page, '#flat32-location-control');
	}
	const selectedLocation = await page.$eval('#flat32-location-control', (control) => control.textContent?.trim());
	if (selectedLocation !== 'San Jose') throw new Error('Flat32 could not select the San Jose location preset.');
	const basis = await page.$eval('#flat32-time-basis-control', (control) => control.textContent?.trim());
	if (basis === 'Use Globe Time') {
		await transition(page, '#flat32-time-basis-control');
	}

	const selectedTime = await page.$eval('#flat32-time-value', (control) => control.textContent?.trim());
	if (!selectedTime?.includes('Solar noon')) {
		await transition(page, '[data-flat32-globe-time="1"]');
	}
	const evidence = {solarNoon: await captureState(page, 'solar-noon')};
	await transition(page, '[data-flat32-globe-time="2"]');
	evidence.sunset = await captureState(page, 'sunset');
	for (const minutes of [10, 20, 30]) {
		await transition(page, '[data-flat32-minute-offset="-10"]');
		evidence[`sunsetMinus${minutes}`] = await captureState(page, `sunset-minus-${minutes}`);
	}
	if (pageErrors.length > 0) throw new Error(`Flat32 page errors: ${pageErrors.join(' | ')}`);
	await writeFile(resolve(outputRoot, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
	process.stdout.write(`${JSON.stringify({outputRoot, evidence}, null, 2)}\n`);
} finally {
	await browser.close();
	await new Promise((resolveClose) => server.close(resolveClose));
}
