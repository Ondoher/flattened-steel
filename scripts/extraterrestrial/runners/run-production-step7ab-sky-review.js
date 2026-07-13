import {createServer} from 'node:http';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const applicationRoot = resolve(repositoryRoot, 'dist/flat32');
const outputRoot = resolve(
	repositoryRoot,
	'tmp/extraterrestrial/production-integration/step7ab-sky-review-v5',
);
const contentTypes = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript'};

async function waitForReady(page) {
	await page.waitForFunction(
		() =>
			document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready' &&
			document.querySelector('#flat32-canvas')?.dataset.flat32RenderPath === 'algorithm32',
		{timeout: 600000, polling: 1000},
	);
}

async function transition(page, selector) {
	const before = await page.evaluate(() => ({
		location: document.querySelector('#flat32-location-control')?.textContent?.trim(),
		time: document.querySelector('#flat32-time-value')?.textContent?.trim(),
		basis: document.querySelector('#flat32-time-basis-control')?.textContent?.trim(),
		setup: document.querySelector('.flat32-shell')?.dataset.flat32AtmosphereSetupDurationMilliseconds,
	}));
	await page.$eval(selector, (button) => button.click());
	await page.waitForFunction(
		(previous) => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32State === 'ready' &&
				shell.dataset.flat32AtmosphereSetupDurationMilliseconds !== previous.setup
			);
		},
		{timeout: 600000, polling: 500},
		before,
	);
	await new Promise((resolveWait) => setTimeout(resolveWait, 1500));
}

async function stateFacts(page) {
	return page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		const canvas = document.querySelector('#flat32-canvas');
		return {
			mode: shell?.dataset.flat32Mode,
			location: document.querySelector('#flat32-location-control')?.textContent?.trim(),
			time: document.querySelector('#flat32-time-value')?.textContent?.trim(),
			brightnessProxyCdPerSquareMeter: Number(canvas?.dataset.flat32ColorBrightnessProxy),
			pairing: shell?.dataset.flat32AtmospherePairing,
			maximumOrder: shell?.dataset.flat32AtmosphereMaximumOrder,
		};
	});
}

async function capture(page, id) {
	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	const path = resolve(outputRoot, `${id}.png`);
	const facts = await stateFacts(page);
	await page.evaluate(() => {
		for (const selector of ['.flat32-scene-controls', '.flat32-time-panel', '.flat32-panel']) {
			const element = document.querySelector(selector);
			if (element instanceof HTMLElement) element.style.visibility = 'hidden';
		}
	});
	await canvas.screenshot({path, type: 'png'});
	return {...facts, path, bytes: (await stat(path)).size};
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

await mkdir(outputRoot, {recursive: false});
await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const port = typeof address === 'object' && address !== null ? address.port : 0;
const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 900000,
	defaultViewport: {width: 640, height: 400, deviceScaleFactor: 1},
	args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
});

try {
	const page = await browser.newPage();
	const pageErrors = [];
	page.setDefaultTimeout(600000);
	page.on('pageerror', (error) => pageErrors.push(error.message));

	await page.goto(`http://127.0.0.1:${port}/?diagnostic=spherical-reference-ferwerda-n4`, {
		waitUntil: 'domcontentloaded',
		timeout: 600000,
	});
	await waitForReady(page);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		if ((await page.$eval('#flat32-location-control', (control) => control.textContent?.trim())) === 'San Jose') {
			break;
		}
		await transition(page, '#flat32-location-control');
	}
	if ((await page.$eval('#flat32-time-basis-control', (control) => control.textContent?.trim())) === 'Use Globe Time') {
		await transition(page, '#flat32-time-basis-control');
	}
	await transition(page, '[data-flat32-globe-time="2"]');
	for (let hour = 0; hour < 3; hour += 1) await transition(page, '[data-flat32-hour-offset="1"]');
	const sphericalSunsetPlusThreeHours = await capture(
		page,
		'spherical-san-jose-sunset-plus-three-hours-ferwerda-000435-control',
	);

	await page.goto(`http://127.0.0.1:${port}/?diagnostic=spherical-reference-bruneton-n4`, {
		waitUntil: 'domcontentloaded',
		timeout: 600000,
	});
	await waitForReady(page);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		if ((await page.$eval('#flat32-location-control', (control) => control.textContent?.trim())) === 'San Jose') break;
		await transition(page, '#flat32-location-control');
	}
	if ((await page.$eval('#flat32-time-basis-control', (control) => control.textContent?.trim())) === 'Use Globe Time') {
		await transition(page, '#flat32-time-basis-control');
	}
	await transition(page, '[data-flat32-globe-time="2"]');
	for (let hour = 0; hour < 3; hour += 1) await transition(page, '[data-flat32-hour-offset="1"]');
	const sphericalBrunetonControl = await capture(
		page,
		'spherical-san-jose-sunset-plus-three-hours-bruneton-control',
	);

	await page.goto(`http://127.0.0.1:${port}/?diagnostic=flat180-wide-n4`, {
		waitUntil: 'domcontentloaded',
		timeout: 600000,
	});
	await waitForReady(page);
	await new Promise((resolveWait) => setTimeout(resolveWait, 1500));
	const flatLocal = await capture(page, 'flat-local-flat-180');

	if (pageErrors.length > 0) throw new Error(`Flat32 page errors: ${pageErrors.join(' | ')}`);
	const evidence = {sphericalSunsetPlusThreeHours, sphericalBrunetonControl, flatLocal};
	await writeFile(resolve(outputRoot, 'review.json'), `${JSON.stringify(evidence, null, 2)}\n`, {flag: 'wx'});
	process.stdout.write(`${JSON.stringify({outputRoot, evidence}, null, 2)}\n`);
} finally {
	await browser.close();
	await new Promise((resolveClose) => server.close(resolveClose));
}
