import {createServer} from 'node:http';
import {mkdir, readFile, stat} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';

import puppeteer from 'puppeteer';
import {initializeRunRecord} from '../harness/lib/run-record.js';

const repositoryRoot = resolve(import.meta.dirname, '../../..');
const applicationRoot = resolve(repositoryRoot, 'dist/flat32');
const command = 'node experiments/extraterrestrial/runners/run-production-step7c-live-environment-review.js';
const run = await initializeRunRecord({
	slug: 'production-step7c-live-environment-review',
	command,
	inputs: {applicationRoot: 'dist/flat32', panelViewport: [640, 400], pairedViewport: [1280, 430], conditions: ['solar-noon', 'sunset', 'sunset-plus-one-hour', 'sunset-plus-two-hours', 'sunset-plus-three-hours', 'union-glacier-flat-local-flat-180']},
	provenance: {purpose: 'Review sunset-centered live receiver-environment Ferwerda output beside unchanged Bruneton controls.', implementation: 'experiments/extraterrestrial/runners/run-production-step7c-live-environment-review.js'},
	environment: {node: process.version, platform: process.platform, chrome: 'puppeteer-managed Chrome Headless'},
	references: {activeTopic: 'agents/topics/active-topic.md', productionPlan: 'agents/topics/extraterrestrial/stellar-screen-palette-production-port-plan.md'},
});
const outputRoot = run.runDirectory;
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
			celestialGenerationStatus: canvas?.dataset.flat32CelestialGenerationStatus ?? null,
			receiverEnvironmentDiagnostics: canvas?.dataset.flat32ReceiverEnvironmentDiagnostics
				? JSON.parse(canvas.dataset.flat32ReceiverEnvironmentDiagnostics)
				: null,
		};
	});
}

async function capture(page, id) {
	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	const path = resolve(outputRoot, 'captures', `${id}.png`);
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

async function configureSpherical(page, color) {
	await page.goto(`http://127.0.0.1:${port}/?diagnostic=spherical-sunset-facing-${color}-n4&receiverEnvironmentDiagnostics=1`, {waitUntil: 'domcontentloaded', timeout: 600000});
	await waitForReady(page);
	for (let attempt = 0; attempt < 3; attempt += 1) {
		if ((await page.$eval('#flat32-location-control', (control) => control.textContent?.trim())) === 'San Jose') break;
		await transition(page, '#flat32-location-control');
	}
	if ((await page.$eval('#flat32-time-basis-control', (control) => control.textContent?.trim())) === 'Use Globe Time') {
		await transition(page, '#flat32-time-basis-control');
	}
	if (color === 'bruneton' && (await stateFacts(page)).celestialGenerationStatus !== null) {
		throw new Error('Bruneton control unexpectedly installed visible celestial generation.');
	}
}

async function captureSeries(page, color) {
	await configureSpherical(page, color);
	const result = {};
	await transition(page, '[data-flat32-globe-time="1"]');
	result['solar-noon'] = await capture(page, `${color}-solar-noon`);
	await transition(page, '[data-flat32-globe-time="2"]');
	result.sunset = await capture(page, `${color}-sunset`);
	for (let hour = 1; hour <= 3; hour += 1) {
		await transition(page, '[data-flat32-hour-offset="1"]');
		result[`sunset-plus-${hour}-hour${hour === 1 ? '' : 's'}`] = await capture(page, `${color}-sunset-plus-${hour}-hour${hour === 1 ? '' : 's'}`);
	}
	return result;
}

async function captureFlatLocalUnionGlacier(page, color) {
	await page.goto(`http://127.0.0.1:${port}/?diagnostic=flat180-wide-n4-${color}&receiverEnvironmentDiagnostics=1`, {waitUntil: 'domcontentloaded', timeout: 600000});
	await waitForReady(page);
	const facts = await stateFacts(page);
	if (facts.location !== 'Union Glacier' || facts.pairing !== 'flat/local' || !facts.time.includes('Flat 180')) {
		throw new Error(`Flat/local review identity mismatch: ${JSON.stringify(facts)}`);
	}
	if (color === 'bruneton' && facts.celestialGenerationStatus !== null) {
		throw new Error('Flat/local Bruneton control unexpectedly installed visible celestial generation.');
	}
	return capture(page, `${color}-union-glacier-flat-local-flat-180`);
}

async function pairCapture(page, id, ferwerda, bruneton) {
	const [left, right] = await Promise.all([readFile(ferwerda.path), readFile(bruneton.path)]);
	await page.setViewport({width: 1280, height: 430, deviceScaleFactor: 1});
	await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;background:#111;color:white;font:16px sans-serif}.labels{height:30px;display:grid;grid-template-columns:1fr 1fr;text-align:center;align-items:center}.panels{display:flex}.panels img{display:block;width:640px;height:400px}</style><div class="labels"><span>Ferwerda — ${id}</span><span>Bruneton control — ${id}</span></div><div class="panels"><img src="data:image/png;base64,${left.toString('base64')}"><img src="data:image/png;base64,${right.toString('base64')}"></div>`);
	const path = resolve(outputRoot, 'captures', `paired-${id}.png`);
	await page.screenshot({path, type: 'png'});
	return {path, bytes: (await stat(path)).size, ferwerda, bruneton};
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

await mkdir(resolve(outputRoot, 'captures'), {recursive: false});
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

	const ferwerda = await captureSeries(page, 'ferwerda');
	const bruneton = await captureSeries(page, 'bruneton');
	ferwerda['union-glacier-flat-local-flat-180'] = await captureFlatLocalUnionGlacier(page, 'ferwerda');
	bruneton['union-glacier-flat-local-flat-180'] = await captureFlatLocalUnionGlacier(page, 'bruneton');
	if (pageErrors.length > 0) throw new Error(`Flat32 page errors: ${pageErrors.join(' | ')}`);
	const pairPage = await browser.newPage();
	const paired = {};
	for (const id of Object.keys(ferwerda)) paired[id] = await pairCapture(pairPage, id, ferwerda[id], bruneton[id]);
	await pairPage.close();
	const evidence = {camera: {spherical: 'sunset-centered, 25 degrees elevation', flatLocal: 'finite source centered at Union Glacier Flat 180'}, ferwerda, bruneton, paired};
	await run.writeJsonArtifact('evidence/review.json', evidence);
	const manifest = await run.finalize({
		conclusion: 'rejected',
		result: {accepted: false, evidence, reason: 'Review evidence only; the live appearance gate remains unresolved.'},
		report: `# ${run.runId}: sunset-centered production Step 7C comparison\n\nConclusion: **rejected as qualification; retained for visual review**.\n\nFive sunset-centered spherical/distant conditions and the source-centered Union Glacier Flat/local Flat 180 condition place production Ferwerda beside unchanged Bruneton.\n`,
	});
	process.stdout.write(`${JSON.stringify({runId: run.runId, outputRoot, artifactSetSha256: manifest.artifactSetSha256, evidence}, null, 2)}\n`);
} finally {
	await browser.close();
	await new Promise((resolveClose) => server.close(resolveClose));
}
