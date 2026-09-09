#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const WIDTH = 1920;
const HEIGHT = 1080;
const TARGET_UNIFORM = 'uTransportPathIntervalCount';
const SCENES = Object.freeze([
	Object.freeze({id: 'sunset-minus-30m', offsetMinutes: -30, intent: 'near sunset, source above horizon'}),
	Object.freeze({id: 'sunset-minus-10m', offsetMinutes: -10, intent: 'immediate pre-sunset'}),
	Object.freeze({id: 'sunset', offsetMinutes: 0, intent: 'sunset'}),
	Object.freeze({id: 'sunset-plus-20m', offsetMinutes: 20, intent: 'civil twilight'}),
	Object.freeze({id: 'sunset-plus-40m', offsetMinutes: 40, intent: 'late civil / early nautical twilight'}),
	Object.freeze({id: 'sunset-plus-60m', offsetMinutes: 60, intent: 'nautical twilight'}),
	Object.freeze({id: 'sunset-plus-90m', offsetMinutes: 90, intent: 'astronomical twilight boundary'}),
	Object.freeze({id: 'sunset-plus-120m', offsetMinutes: 120, intent: 'post-astronomical configured dark control'}),
]);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fileIdentity = async (absolutePath) => {
	const bytes = await readFile(absolutePath);
	return {byteLength: bytes.byteLength, sha256: sha256(bytes)};
};
const classifyZenith = (degrees) => {
	if (degrees < 90) return 'daylight / pre-sunset';
	if (degrees < 96) return 'civil twilight';
	if (degrees < 102) return 'nautical twilight';
	if (degrees < 108) return 'astronomical twilight';
	return 'configured dark range';
};
const expectedSunsetLabel = (offsetMinutes) => {
	if (offsetMinutes === 0) return 'Sunset';
	const absoluteMinutes = Math.abs(offsetMinutes);
	const hours = Math.trunc(absoluteMinutes / 60);
	const minutes = absoluteMinutes % 60;
	const offsetText = [hours > 0 ? `${hours}h` : '', minutes > 0 ? `${minutes}m` : '']
		.filter(Boolean)
		.join(' ');
	return `Sunset ${offsetMinutes > 0 ? '+' : '-'}${offsetText}`;
};

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
if (!outputRoot.startsWith(`${await realpath(path.join(repositoryRoot, 'tmp'))}${path.sep}`)) {
	throw new Error('Experiment output root escaped the repository tmp root.');
}
const runsRoot = path.join(outputRoot, 'runs');
await mkdir(runsRoot, {recursive: true});
const runId = `${Date.now()}-s5-q24-lighting-regime-visuals`;
const run = path.join(runsRoot, runId);
await mkdir(run);
await mkdir(path.join(run, 'captures'));
await mkdir(path.join(run, 'comparisons'));
const progressPath = path.join(run, 'progress.jsonl');
let progress = '';
const recordProgress = async (phase, message, extra = {}) => {
	progress += `${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...extra})}\n`;
	await writeFile(progressPath, progress);
};
await writeFile(
	path.join(run, 'command.txt'),
	'node experiments/gpu-resident-shared-block-cache/run-s5-q24-lighting-regime-visuals.js\n',
);
await writeFile(
	path.join(run, 'inputs.json'),
	`${JSON.stringify(
		{
			schemaId: 'gpu-resident-shared-block-cache-q24-lighting-visual-input-v1',
			location: 'San Jose',
			referenceQuadrature: 'Q30 quadratic-near-observer',
			candidateQuadrature: 'Q24 quadratic-near-observer',
			viewport: {width: WIDTH, height: HEIGHT},
			scenes: SCENES,
		},
		null,
		2,
	)}\n`,
);
await recordProgress('initialize', 'Allocated immutable Q24 lighting-regime visual run.');

const browser = await puppeteer.launch({
	headless: true,
	executablePath: CHROME_EXECUTABLE,
	protocolTimeout: 900_000,
	args: [
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		'--disable-background-timer-throttling',
		`--window-size=${WIDTH},${HEIGHT}`,
	],
});

let results = [];
let environment;
try {
	const page = await browser.newPage();
	await page.setViewport({width: WIDTH, height: HEIGHT, deviceScaleFactor: 1});
	await page.evaluateOnNewDocument((targetUniform) => {
		const prototype = WebGL2RenderingContext.prototype;
		const originalGetUniformLocation = prototype.getUniformLocation;
		const originalUniform1i = prototype.uniform1i;
		const originalUseProgram = prototype.useProgram;
		const entries = [];
		const targetLocations = new WeakSet();
		let desiredIntervalCount = null;
		const setterErrors = [];
		prototype.getUniformLocation = function (program, name) {
			const location = originalGetUniformLocation.call(this, program, name);
			if (name === targetUniform && location !== null) {
				targetLocations.add(location);
				entries.push({context: this, program, location});
			}
			return location;
		};
		prototype.uniform1i = function (location, value) {
			if (targetLocations.has(location)) {
				return originalUniform1i.call(this, location, desiredIntervalCount ?? value);
			}
			return originalUniform1i.call(this, location, value);
		};
		window.__a32VisualQuadrature = {
			set(value) {
				desiredIntervalCount = value;
				let liveCount = 0;
				for (const entry of entries) {
					if (entry.context.isContextLost() || !entry.context.isProgram(entry.program)) continue;
					while (entry.context.getError() !== entry.context.NO_ERROR) {
						// Attribute only errors produced after this point to the setter.
					}
					const prior = entry.context.getParameter(entry.context.CURRENT_PROGRAM);
					originalUseProgram.call(entry.context, entry.program);
					originalUniform1i.call(entry.context, entry.location, value);
					originalUseProgram.call(entry.context, prior);
					const error = entry.context.getError();
					if (error !== entry.context.NO_ERROR) setterErrors.push({value, error});
					liveCount += 1;
				}
				return liveCount;
			},
			diagnostics() {
				return {desiredIntervalCount, locationCount: entries.length, setterErrors: [...setterErrors]};
			},
		};
	}, TARGET_UNIFORM);
	await recordProgress('load', 'Loading production Flat32 before selecting San Jose sunset regimes.');
	await page.goto('http://127.0.0.1:8081/flat32/?diagnostic=spherical-sunset-facing-production-n4', {
		waitUntil: 'networkidle2',
		timeout: 120_000,
	});
	const waitReady = async (expectedLocation, expectedTime) => {
		await page.waitForFunction(
			(location, time) => {
				const shell = document.querySelector('.flat32-shell');
				return (
					shell?.dataset.flat32State === 'ready' &&
					shell?.dataset.flat32Location === location &&
					shell?.dataset.flat32Time === time &&
					['ready', 'dark'].includes(shell?.dataset.flat32DistantSunCacheState) &&
					window.__a32VisualQuadrature?.diagnostics().locationCount > 0
				);
			},
			{timeout: 240_000, polling: 250},
			expectedLocation,
			expectedTime,
		);
	};
	await page.waitForFunction(
		() => document.querySelector('.flat32-shell')?.dataset.flat32State === 'ready',
		{timeout: 180_000},
	);
	await page.evaluate(() => {
		const button = document.querySelector('#flat32-location-control');
		button.click();
		button.click();
	});
	await waitReady('San Jose', 'Flat 0');
	await page.addStyleTag({
		content: '.flat32-scene-controls,.flat32-time-panel{visibility:hidden!important}',
	});

	const canvas = await page.$('#flat32-canvas');
	if (canvas === null) throw new Error('Flat32 canvas is unavailable.');
	const plates = [];
	for (let sceneIndex = 0; sceneIndex < SCENES.length; sceneIndex += 1) {
		const scene = SCENES[sceneIndex];
		await recordProgress(
			'render',
			`Rendering ${scene.id} (${sceneIndex + 1} of ${SCENES.length}) at Q30 and Q24.`,
			{completed: sceneIndex, total: SCENES.length},
		);
		await page.evaluate((offsetMinutes) => {
			const sunset = document.querySelector('button[data-flat32-globe-time="2"]');
			const selector =
				offsetMinutes >= 0
					? 'button[data-flat32-minute-offset="10"]'
					: 'button[data-flat32-minute-offset="-10"]';
			const offset = document.querySelector(selector);
			sunset.click();
			for (let step = 0; step < Math.abs(offsetMinutes) / 10; step += 1) offset.click();
		}, scene.offsetMinutes);
		await new Promise((resolve) => setTimeout(resolve, 700));
		const expectedTime = expectedSunsetLabel(scene.offsetMinutes);
		await waitReady('San Jose', expectedTime);
		const sceneFacts = await page.evaluate(() => {
			const shell = document.querySelector('.flat32-shell');
			return {
				location: shell.dataset.flat32Location,
				time: shell.dataset.flat32Time,
				solarZenithDegrees: Number(shell.dataset.flat32SolarZenithDegrees),
				cacheState: shell.dataset.flat32DistantSunCacheState,
			};
		});
		const capture = async (intervalCount) => {
			const liveCount = await page.evaluate((value) => window.__a32VisualQuadrature.set(value), intervalCount);
			await new Promise((resolve) => setTimeout(resolve, 1200));
			const bytes = await canvas.screenshot({type: 'png'});
			const relativePath = `captures/${scene.id}-q${intervalCount}.png`;
			await writeFile(path.join(run, relativePath), bytes);
			return {bytes, liveCount, path: relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes)};
		};
		const q30 = await capture(30);
		const q24 = await capture(24);
		await page.evaluate(() => window.__a32VisualQuadrature.set(30));
		const comparison = await page.evaluate(
			async (q30Base64, q24Base64, title, subtitle) => {
				const decode = async (base64) => {
					const image = new Image();
					image.src = `data:image/png;base64,${base64}`;
					await image.decode();
					return image;
				};
				const [reference, candidate] = await Promise.all([decode(q30Base64), decode(q24Base64)]);
				const read = (image) => {
					const surface = document.createElement('canvas');
					surface.width = image.naturalWidth;
					surface.height = image.naturalHeight;
					const context = surface.getContext('2d', {willReadFrequently: true});
					context.drawImage(image, 0, 0);
					return context.getImageData(0, 0, surface.width, surface.height);
				};
				const referenceData = read(reference);
				const candidateData = read(candidate);
				const differenceData = new ImageData(referenceData.width, referenceData.height);
				let absoluteSum = 0;
				let squaredSum = 0;
				let maximum = 0;
				const histogram = new Uint32Array(256);
				for (let offset = 0; offset < referenceData.data.length; offset += 4) {
					for (let channel = 0; channel < 3; channel += 1) {
						const difference = Math.abs(referenceData.data[offset + channel] - candidateData.data[offset + channel]);
						absoluteSum += difference;
						squaredSum += difference * difference;
						maximum = Math.max(maximum, difference);
						histogram[difference] += 1;
						differenceData.data[offset + channel] = Math.min(255, difference * 64);
					}
					differenceData.data[offset + 3] = 255;
				}
				const channelCount = referenceData.width * referenceData.height * 3;
				const percentile = (fraction) => {
					const target = Math.ceil(channelCount * fraction);
					let cumulative = 0;
					for (let value = 0; value < histogram.length; value += 1) {
						cumulative += histogram[value];
						if (cumulative >= target) return value;
					}
					return 255;
				};
				const panelWidth = 800;
				const panelHeight = 450;
				const plate = document.createElement('canvas');
				plate.width = panelWidth * 3;
				plate.height = panelHeight + 92;
				const context = plate.getContext('2d');
				context.fillStyle = '#10151d';
				context.fillRect(0, 0, plate.width, plate.height);
				context.fillStyle = '#f4f7fb';
				context.font = '26px system-ui, sans-serif';
				context.fillText(title, 18, 34);
				context.fillStyle = '#aebbd0';
				context.font = '17px system-ui, sans-serif';
				context.fillText(subtitle, 18, 62);
				context.drawImage(reference, 0, 92, panelWidth, panelHeight);
				context.drawImage(candidate, panelWidth, 92, panelWidth, panelHeight);
				const differenceCanvas = document.createElement('canvas');
				differenceCanvas.width = differenceData.width;
				differenceCanvas.height = differenceData.height;
				differenceCanvas.getContext('2d').putImageData(differenceData, 0, 0);
				context.drawImage(differenceCanvas, panelWidth * 2, 92, panelWidth, panelHeight);
				for (const [index, label] of ['Q30 reference', 'Q24 candidate', 'absolute RGB difference ×64'].entries()) {
					context.fillStyle = 'rgba(6,10,16,0.82)';
					context.fillRect(index * panelWidth + 12, 104, 310, 38);
					context.fillStyle = '#ffffff';
					context.font = '18px system-ui, sans-serif';
					context.fillText(label, index * panelWidth + 24, 130);
				}
				const meanSquared = squaredSum / channelCount;
				return {
					plateBase64: plate.toDataURL('image/png').split(',')[1],
					metrics: {
						maximumAbsoluteCodeDifference: maximum,
						meanAbsoluteCodeDifference: absoluteSum / channelCount,
						rootMeanSquareCodeDifference: Math.sqrt(meanSquared),
						p95AbsoluteCodeDifference: percentile(0.95),
						p99AbsoluteCodeDifference: percentile(0.99),
						peakSignalToNoiseRatioDecibels:
							meanSquared === 0 ? null : 10 * Math.log10((255 * 255) / meanSquared),
					},
				};
			},
			q30.bytes.toString('base64'),
			q24.bytes.toString('base64'),
			`${scene.id}: ${sceneFacts.solarZenithDegrees.toFixed(3)}° solar zenith`,
			`${scene.intent}; ${classifyZenith(sceneFacts.solarZenithDegrees)}; cache ${sceneFacts.cacheState}`,
		);
		const plateBytes = Buffer.from(comparison.plateBase64, 'base64');
		const platePath = `comparisons/${scene.id}-q30-vs-q24.png`;
		await writeFile(path.join(run, platePath), plateBytes);
		plates.push({path: platePath, bytes: plateBytes});
		results.push({
			...scene,
			...sceneFacts,
			regime: classifyZenith(sceneFacts.solarZenithDegrees),
			q30: {path: q30.path, byteLength: q30.byteLength, sha256: q30.sha256},
			q24: {path: q24.path, byteLength: q24.byteLength, sha256: q24.sha256},
			comparison: {...comparison.metrics, plate: platePath, plateSha256: sha256(plateBytes)},
			liveUniformCount: Math.min(q30.liveCount, q24.liveCount),
		});
	}
	const overview = await page.evaluate(async (plateInputs) => {
		const decode = async (base64) => {
			const image = new Image();
			image.src = `data:image/png;base64,${base64}`;
			await image.decode();
			return image;
		};
		const images = await Promise.all(plateInputs.map((entry) => decode(entry.base64)));
		const width = 1800;
		const rowHeight = Math.round((width / 2400) * 542);
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = rowHeight * images.length;
		const context = canvas.getContext('2d');
		images.forEach((image, index) => context.drawImage(image, 0, index * rowHeight, width, rowHeight));
		return canvas.toDataURL('image/png').split(',')[1];
	}, plates.map((plate) => ({base64: plate.bytes.toString('base64')})));
	const overviewBytes = Buffer.from(overview, 'base64');
	await writeFile(path.join(run, 'q30-vs-q24-lighting-regimes-overview.png'), overviewBytes);
	environment = await page.evaluate(() => {
		const canvas = document.querySelector('#flat32-canvas');
		const context = canvas.getContext('webgl2');
		const debug = context.getExtension('WEBGL_debug_renderer_info');
		return {
			gpu: {
				vendor: debug ? context.getParameter(debug.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR),
				renderer: debug
					? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
					: context.getParameter(context.RENDERER),
			},
			webglError: context.getError(),
			interceptor: window.__a32VisualQuadrature.diagnostics(),
		};
	});
} finally {
	await browser.close();
}

const accepted =
	results.length === SCENES.length &&
	results.every((result) => result.liveUniformCount > 0 && Number.isFinite(result.solarZenithDegrees)) &&
	results.every(
		(result, index) => index === 0 || result.solarZenithDegrees > results[index - 1].solarZenithDegrees,
	) &&
	results.find((result) => result.id === 'sunset-plus-90m')?.regime === 'astronomical twilight' &&
	results.find((result) => result.id === 'sunset-plus-120m')?.cacheState === 'dark' &&
	environment.webglError === 0 &&
	environment.interceptor.setterErrors.length === 0;
const result = {
	schemaId: 'gpu-resident-shared-block-cache-q24-lighting-visual-result-v1',
	runId,
	accepted,
	claimBoundary:
		'Visual Q24 versus Q30 evidence across San Jose sunset regimes. This is display-space evidence, not spectral or physical qualification of Q24.',
	results,
	overview: {
		path: 'q30-vs-q24-lighting-regimes-overview.png',
		...(await fileIdentity(path.join(run, 'q30-vs-q24-lighting-regimes-overview.png'))),
	},
	environment,
	derivation: {
		operation:
			'load each scene through the production cache resolver, render Q30 and uniform-only Q24, compute 8-bit display differences, and produce amplified comparison plates',
		sourceIdentities: {
			runner: await fileIdentity(import.meta.filename),
			productionBundle: await fileIdentity(path.join(repositoryRoot, 'dist', 'flat32', 'flat32.js')),
		},
	},
};
await writeFile(path.join(run, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(path.join(run, 'environment.json'), `${JSON.stringify(environment, null, 2)}\n`);
await writeFile(path.join(run, 'provenance.json'), `${JSON.stringify(result.derivation, null, 2)}\n`);
await recordProgress(
	'terminal',
	accepted ? 'Accepted the Q24 multi-regime visual artifact run.' : 'The Q24 visual run failed a prerequisite.',
	{completed: results.length, total: SCENES.length, state: accepted ? 'accepted' : 'failed'},
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!accepted) process.exitCode = 1;
