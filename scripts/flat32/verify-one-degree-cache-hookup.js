import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';

function argument(name) {
	const index = process.argv.indexOf(name);
	if (index < 0 || index + 1 >= process.argv.length) throw new Error(`${name} is required.`);
	return process.argv[index + 1];
}

function optionalArgument(name, fallback) {
	const index = process.argv.indexOf(name);
	return index < 0 ? fallback : argument(name);
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Flat32 hookup proof output must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputDirectory);
	throw new Error('Flat32 hookup proof output already exists; evidence is immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory || (await lstat(outputDirectory)).isSymbolicLink()) {
	throw new Error('Flat32 hookup proof output must resolve exactly and must not be a link.');
}

const applicationUrl = new URL(argument('--url'));
const serverImplementation = optionalArgument(
	'--server-implementation',
	'scripts/flat32/serve-distant-sun-scene-caches.js',
);
const browser = await puppeteer.launch({
	headless: true,
	args: [
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		'--disable-background-timer-throttling',
		'--window-size=1024,768',
	],
});
const page = await browser.newPage();
await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 1});
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
const started = performance.now();
let facts;
try {
	await page.goto(applicationUrl.href, {waitUntil: 'networkidle2', timeout: 120_000});
	await page.waitForSelector('.flat32-shell', {timeout: 30_000});
	await page.waitForFunction(
		() => {
			const state = document.querySelector('.flat32-shell')?.dataset.flat32State;
			return state === 'ready' || state === 'atmosphere-failed';
		},
		{timeout: 900_000, polling: 250},
	);
	facts = await page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		const canvas = document.querySelector('#flat32-canvas');
		const context = canvas?.getContext('webgl2');
		return {
			shell: {...shell.dataset},
			status: document.querySelector('#flat32-status')?.textContent ?? '',
			error: document.querySelector('#flat32-error')?.textContent ?? '',
			atmosphere: document.querySelector('.flat32-atmosphere-state')?.textContent ?? '',
			renderer: context?.getParameter(context.RENDERER) ?? null,
			webglError: context?.getError() ?? null,
		};
	});
	await page.screenshot({path: path.join(outputDirectory, 'flat32-one-degree-cache-hookup.png')});
} finally {
	await browser.close();
}

const accepted =
	facts.shell.flat32State === 'ready' &&
	facts.shell.flat32DistantSunCacheState === 'ready' &&
	facts.shell.flat32AtmospherePairing === 'spherical/distant' &&
	Number.isFinite(Number(facts.shell.flat32SolarZenithDegrees)) &&
	facts.webglError === 0;
const screenshotBytes = await readFile(path.join(outputDirectory, 'flat32-one-degree-cache-hookup.png'));
const report = {
	schemaId: 'flat32-one-degree-cache-hookup-proof-v1',
	accepted,
	applicationUrl: applicationUrl.href,
	elapsedMilliseconds: performance.now() - started,
	facts,
	consoleMessages,
	artifacts: {
		screenshot: {
			path: 'flat32-one-degree-cache-hookup.png',
			byteLength: screenshotBytes.length,
			sha256: sha256(screenshotBytes),
		},
	},
	derivation: {
		operation:
			'load Flat32, resolve one scalar solar zenith, validate/upload its exact offline package, preflight, and capture the atomically published frame',
		implementation: 'scripts/flat32/verify-one-degree-cache-hookup.js',
		serverImplementation,
	},
};
await writeFile(path.join(outputDirectory, 'verification-report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!accepted) throw new Error(`Flat32 one-degree cache hookup proof failed: ${facts.error || facts.status}`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
