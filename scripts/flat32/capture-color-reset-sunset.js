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

function optionalIntegerArgument(name, fallback) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? fallback : Number(argument(name));
	if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a nonnegative integer.`);
	return value;
}

function optionalPositiveIntegerArgument(name, fallback) {
	const value = optionalIntegerArgument(name, fallback);
	if (value === 0) throw new RangeError(`${name} must be positive.`);
	return value;
}

function optionalNumberArgument(name, fallback) {
	const index = process.argv.indexOf(name);
	const value = index < 0 ? fallback : Number(argument(name));
	if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
	return value;
}

function optionalStringArgument(name, fallback) {
	const index = process.argv.indexOf(name);
	return index < 0 ? fallback : argument(name);
}

function timeLabel(preset, offsetMinutes) {
	const base = preset === 'solar-noon' ? 'Solar noon' : preset === 'sunrise' ? 'Sunrise' : 'Sunset';
	if (offsetMinutes === 0) return base;
	const roundedMinutes = Math.round(Math.abs(offsetMinutes));
	const hours = Math.trunc(roundedMinutes / 60);
	const minutes = roundedMinutes % 60;
	const suffix = [hours > 0 ? `${hours}h` : '', minutes > 0 ? `${minutes}m` : ''].filter(Boolean).join(' ');
	return `${base} ${offsetMinutes > 0 ? '+' : '-'}${suffix}`;
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Flat32 Color Reset captures must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputDirectory);
	throw new Error('Flat32 Color Reset capture output already exists; evidence is immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory || (await lstat(outputDirectory)).isSymbolicLink()) {
	throw new Error('Flat32 Color Reset capture output must resolve exactly and must not be a link.');
}

const applicationUrl = new URL(argument('--url'));
const offsetHours = optionalIntegerArgument('--offset-hours', 0);
const offsetMinutes = optionalNumberArgument('--offset-minutes', offsetHours * 60);
const globePreset = optionalStringArgument('--globe-preset', 'sunset');
if (!['sunrise', 'solar-noon', 'sunset'].includes(globePreset)) {
	throw new RangeError('--globe-preset must be sunrise, solar-noon, or sunset.');
}
const atmosphereShader = optionalStringArgument('--atmosphere-shader', 'enabled');
if (!['enabled', 'bypassed'].includes(atmosphereShader)) {
	throw new RangeError('--atmosphere-shader must be enabled or bypassed.');
}
const expectedTimeLabel = timeLabel(globePreset, offsetMinutes);
const viewportWidth = optionalPositiveIntegerArgument('--width', 1450);
const viewportHeight = optionalPositiveIntegerArgument('--height', 900);
const browser = await puppeteer.launch({
	headless: 'new',
	protocolTimeout: 900_000,
	args: [
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		'--disable-background-timer-throttling',
		`--window-size=${viewportWidth},${viewportHeight}`,
	],
});
const page = await browser.newPage();
await page.setViewport({width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1});
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));

let facts;
try {
	await page.goto(applicationUrl.href, {waitUntil: 'networkidle2', timeout: 120_000});
	process.stderr.write('capture: application loaded; waiting for initial ready state\n');
	await page.waitForFunction(() => document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready', {
		timeout: 900_000,
		polling: 250,
	});
	process.stderr.write('capture: initial state ready; selecting requested sunset state\n');
	await page.evaluate(
		({requestedOffsetMinutes, requestedGlobePreset}) => {
			const shell = document.querySelector('.flat32-shell');
			const location = shell?.querySelector('#flat32-location-control');
			const timeBasis = shell?.querySelector('#flat32-time-basis-control');
			const presetIndex = {sunrise: 0, 'solar-noon': 1, sunset: 2}[requestedGlobePreset];
			const preset = shell?.querySelector(`button[data-flat32-globe-time="${presetIndex}"]`);
			const minuteOffset = shell?.querySelector('button[data-flat32-minute-offset="10"]');
			if (!(location instanceof HTMLButtonElement)) throw new Error('Flat32 location control is unavailable.');
			if (!(timeBasis instanceof HTMLButtonElement)) throw new Error('Flat32 time-basis control is unavailable.');
			if (!(preset instanceof HTMLButtonElement)) throw new Error('Flat32 globe-time preset is unavailable.');
			if (!(minuteOffset instanceof HTMLButtonElement))
				throw new Error('Flat32 minute-offset control is unavailable.');
			location.click();
			location.click();
			timeBasis.click();
			preset.click();
			if (requestedOffsetMinutes !== 0) {
				minuteOffset.dataset.flat32MinuteOffset = String(requestedOffsetMinutes);
				minuteOffset.click();
			}
		},
		{requestedOffsetMinutes: offsetMinutes, requestedGlobePreset: globePreset},
	);
	await page.waitForFunction(
		(requestedTimeLabel) => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32Location === 'San Jose' &&
				shell.dataset.flat32Time === requestedTimeLabel &&
				shell.dataset.flat32State === 'setting-up-atmosphere'
			);
		},
		{timeout: 30_000, polling: 50},
		expectedTimeLabel,
	);
	process.stderr.write('capture: requested state entered setup; waiting for atmosphere readiness\n');
	await page.waitForFunction(
		(requestedTimeLabel) => {
			const shell = document.querySelector('.flat32-shell');
			const canvas = document.querySelector('#flat32-canvas');
			return (
				shell?.dataset.flat32Location === 'San Jose' &&
				shell.dataset.flat32Time === requestedTimeLabel &&
				shell.dataset.flat32State === 'ready' &&
				canvas?.dataset.flat32RenderPath === 'algorithm32' &&
				canvas.dataset.flat32StellarGenerationCompletion === 'complete'
			);
		},
		{timeout: 900_000, polling: 250},
		expectedTimeLabel,
	);
	process.stderr.write('capture: requested atmosphere ready\n');
	if (atmosphereShader === 'bypassed') {
		await page.evaluate(() => {
			const control = document.querySelector('#flat32-atmosphere-control');
			if (!(control instanceof HTMLButtonElement)) {
				throw new Error('Flat32 atmosphere control is unavailable.');
			}
			control.click();
		});
		await page.waitForFunction(
			() => {
				const shell = document.querySelector('.flat32-shell');
				const canvas = document.querySelector('#flat32-canvas');
				return (
					shell?.dataset.flat32AtmosphereShader === 'bypassed' &&
					canvas?.dataset.flat32RenderPath === 'direct-three'
				);
			},
			{timeout: 30_000, polling: 50},
		);
		process.stderr.write('capture: atmosphere bypassed; direct Three scene selected\n');
	}
	await page.addStyleTag({content: '.flat32-scene-controls,.flat32-time-panel{display:none!important}'});
	await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	await page.screenshot({path: path.join(outputDirectory, 'page.png')});
	await canvas.screenshot({path: path.join(outputDirectory, 'canvas.png')});
	facts = await page.evaluate(() => {
		const shell = document.querySelector('.flat32-shell');
		const canvas = document.querySelector('#flat32-canvas');
		const context = canvas?.getContext('webgl2');
		return {
			shell: shell ? {...shell.dataset} : null,
			canvas: canvas ? {...canvas.dataset} : null,
			webglError: context?.getError() ?? null,
		};
	});
} finally {
	await browser.close();
}

const pageBytes = await readFile(path.join(outputDirectory, 'page.png'));
const canvasBytes = await readFile(path.join(outputDirectory, 'canvas.png'));
const report = {
	schemaId: 'flat32-production-color-reset-sunset-capture-v2',
	applicationUrl: applicationUrl.href,
	requestedColorModel: applicationUrl.searchParams.get('colorModel'),
	requestedStellarCatalog: applicationUrl.searchParams.get('stellarCatalog'),
	selectedColorModel: facts?.shell?.flat32ColorModel ?? null,
	selectedStellarCatalog: facts?.shell?.flat32StellarCatalog ?? null,
	selectedPresentationFilters: facts?.shell?.flat32PresentationFilters?.split(',').filter(Boolean) ?? [],
	offsetHours,
	offsetMinutes,
	globePreset,
	requestedAtmosphereShader: atmosphereShader,
	viewport: {width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1},
	facts,
	consoleMessages,
	artifacts: {
		page: {path: 'page.png', byteLength: pageBytes.length, sha256: sha256(pageBytes)},
		canvas: {path: 'canvas.png', byteLength: canvasBytes.length, sha256: sha256(canvasBytes)},
	},
};
await writeFile(path.join(outputDirectory, 'capture-report.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
