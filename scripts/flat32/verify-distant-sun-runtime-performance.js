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

function positiveInteger(name, fallback) {
	const value = Number(optionalArgument(name, String(fallback)));
	if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive integer.`);
	return value;
}

function positiveNumber(name, fallback) {
	const value = Number(optionalArgument(name, String(fallback)));
	if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number.`);
	return value;
}

function sha256(bytes) {
	return createHash('sha256').update(bytes).digest('hex');
}

const repositoryRoot = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const evidenceRoot = await realpath(path.join(repositoryRoot, 'tmp', 'extraterrestrial'));
const outputDirectory = path.resolve(argument('--output'));
if (!outputDirectory.startsWith(`${evidenceRoot}${path.sep}`)) {
	throw new Error('Flat32 performance proof output must remain under tmp/extraterrestrial.');
}
try {
	await stat(outputDirectory);
	throw new Error('Flat32 performance proof output already exists; evidence is immutable.');
} catch (error) {
	if (error.code !== 'ENOENT') throw error;
}
await mkdir(outputDirectory);
if ((await realpath(outputDirectory)) !== outputDirectory || (await lstat(outputDirectory)).isSymbolicLink()) {
	throw new Error('Flat32 performance proof output must resolve exactly and must not be a link.');
}

const applicationUrl = new URL(argument('--url'));
applicationUrl.searchParams.set('performance', '1');
const viewportWidth = positiveInteger('--width', 1920);
const viewportHeight = positiveInteger('--height', 1080);
const deviceScaleFactor = positiveNumber('--device-scale-factor', 2);
const sampleFrameCount = positiveInteger('--sample-frames', 12);
const warmupGpuSampleCount = positiveInteger('--warmup-gpu-samples', 6);
const maximumMeanFrameMilliseconds = positiveNumber('--maximum-mean-frame-ms', 1000 / 30);
const maximumP95FrameMilliseconds = positiveNumber('--maximum-p95-frame-ms', 50);
const browser = await puppeteer.launch({
	headless: true,
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
await page.setViewport({width: viewportWidth, height: viewportHeight, deviceScaleFactor});
const consoleMessages = [];
const requests = [];
let readyAt = null;
page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
page.on('request', (request) => requests.push({url: request.url(), startedAt: performance.now()}));
const started = performance.now();
let facts;
let browserVersion;
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
	readyAt = performance.now();
	browserVersion = await browser.version();
	facts = await page.evaluate(
		async (requestedFrameCount, requestedWarmupGpuSampleCount) => {
			const shell = document.querySelector('.flat32-shell');
			const canvas = document.querySelector('#flat32-canvas');
			const context = canvas?.getContext('webgl2');
			if (!shell || !canvas || !context)
				throw new Error('Flat32 performance proof requires its live WebGL2 shell.');
			if (shell.dataset.flat32State !== 'ready') {
				throw new Error(`Flat32 did not publish the atmosphere: ${shell.textContent}`);
			}
			const rendererExtension = context.getExtension('WEBGL_debug_renderer_info');

			context.finish();
			const samples = [];
			for (let sampleIndex = 0; sampleIndex < requestedFrameCount; sampleIndex += 1) {
				const firstFrame = Number(canvas.dataset.flat32AtmosphereFrameCount ?? 0);
				const sampleStarted = performance.now();
				while (Number(canvas.dataset.flat32AtmosphereFrameCount ?? 0) === firstFrame) {
					await new Promise((resolve) => requestAnimationFrame(resolve));
				}
				context.finish();
				const completedFrames = Number(canvas.dataset.flat32AtmosphereFrameCount ?? 0) - firstFrame;
				const elapsedMilliseconds = performance.now() - sampleStarted;
				samples.push({
					completedFrames,
					elapsedMilliseconds,
					millisecondsPerFrame: elapsedMilliseconds / completedFrames,
				});
			}
			const performanceDeadline = performance.now() + 30_000;
			while (
				(window.__flat32PerformanceSamples ?? []).filter(
					(sample) => sample.event === 'gpu-elapsed' && sample.passName === 'algorithm32-runtime-shader',
				).length <
					requestedFrameCount + requestedWarmupGpuSampleCount &&
				performance.now() < performanceDeadline
			) {
				await new Promise((resolve) => requestAnimationFrame(resolve));
			}

			return {
				shell: {...shell.dataset},
				canvas: {...canvas.dataset},
				drawingBuffer: {width: context.drawingBufferWidth, height: context.drawingBufferHeight},
				gpu: {
					vendor: rendererExtension
						? context.getParameter(rendererExtension.UNMASKED_VENDOR_WEBGL)
						: context.getParameter(context.VENDOR),
					renderer: rendererExtension
						? context.getParameter(rendererExtension.UNMASKED_RENDERER_WEBGL)
						: context.getParameter(context.RENDERER),
				},
				samples,
				performanceSamples: window.__flat32PerformanceSamples ?? [],
				webglError: context.getError(),
			};
		},
		sampleFrameCount,
		warmupGpuSampleCount,
	);
} finally {
	await browser.close();
}

const sortedFrameMilliseconds = facts.samples.map((sample) => sample.millisecondsPerFrame).sort((a, b) => a - b);
const gpuPassMilliseconds = facts.performanceSamples
	.filter((sample) => sample.event === 'gpu-elapsed' && sample.gpuDuration !== null && sample.disjoint !== true)
	.reduce((groups, sample) => {
		const values = groups[sample.passName] ?? [];
		values.push(sample.gpuDuration.value * 1000);
		groups[sample.passName] = values;
		return groups;
	}, {});
const allRuntimeGpuMilliseconds = gpuPassMilliseconds['algorithm32-runtime-shader'] ?? [];
const runtimeGpuMilliseconds = allRuntimeGpuMilliseconds.slice(-sampleFrameCount);
const sortedRuntimeGpuMilliseconds = [...runtimeGpuMilliseconds].sort((left, right) => left - right);
const meanRuntimeGpuMilliseconds =
	runtimeGpuMilliseconds.reduce((sum, value) => sum + value, 0) / runtimeGpuMilliseconds.length;
const p95RuntimeGpuMilliseconds =
	sortedRuntimeGpuMilliseconds[Math.max(0, Math.ceil(sortedRuntimeGpuMilliseconds.length * 0.95) - 1)];
const meanFrameMilliseconds =
	facts.samples.reduce((sum, sample) => sum + sample.millisecondsPerFrame, 0) / facts.samples.length;
const p95FrameMilliseconds = sortedFrameMilliseconds[Math.max(0, Math.ceil(sortedFrameMilliseconds.length * 0.95) - 1)];
const physicalWidth = Math.floor(viewportWidth * deviceScaleFactor);
const physicalHeight = Math.floor(viewportHeight * deviceScaleFactor);
const softwareRenderer = /basic render driver|software|swiftshader/iu.test(facts.gpu.renderer);
const accepted =
	facts.shell.flat32State === 'ready' &&
	facts.shell.flat32DistantSunCacheState === 'ready' &&
	facts.canvas.flat32RenderPath === 'algorithm32' &&
	facts.drawingBuffer.width === physicalWidth &&
	facts.drawingBuffer.height === physicalHeight &&
	facts.samples.every((sample) => sample.completedFrames > 0 && Number.isFinite(sample.millisecondsPerFrame)) &&
	runtimeGpuMilliseconds.length >= sampleFrameCount &&
	Number.isFinite(meanRuntimeGpuMilliseconds) &&
	meanRuntimeGpuMilliseconds <= maximumMeanFrameMilliseconds &&
	p95RuntimeGpuMilliseconds <= maximumP95FrameMilliseconds &&
	!softwareRenderer &&
	facts.webglError === 0 &&
	meanFrameMilliseconds <= maximumMeanFrameMilliseconds;
const sourceFiles = [
	'scripts/flat32/verify-distant-sun-runtime-performance.js',
	'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js',
	'src/algorithm32/atmospheric-transport/Algorithm32Transport.js',
	'src/flat32/SphericalDistantMode.js',
];
const sourceIdentities = {};
for (const sourceFile of sourceFiles) {
	const bytes = await readFile(path.join(repositoryRoot, ...sourceFile.split('/')));
	sourceIdentities[sourceFile] = {byteLength: bytes.length, sha256: sha256(bytes)};
}
const report = {
	schemaId: 'flat32-distant-sun-runtime-performance-proof-v2',
	accepted,
	applicationUrl: applicationUrl.href,
	elapsedMilliseconds: performance.now() - started,
	browserVersion,
	configuration: {
		viewport: {width: viewportWidth, height: viewportHeight, units: 'css-pixels'},
		deviceScaleFactor,
		physicalDrawingBuffer: {width: physicalWidth, height: physicalHeight, units: 'pixels'},
		sampleFrameCount,
		maximumMeanFrameMilliseconds,
		maximumP95FrameMilliseconds,
		warmupGpuSampleCount,
	},
	measurements: {
		meanFrameMilliseconds,
		medianFrameMilliseconds: sortedFrameMilliseconds[Math.floor(sortedFrameMilliseconds.length / 2)],
		p95FrameMilliseconds,
		completedFramesPerSecond: 1000 / meanFrameMilliseconds,
		samples: facts.samples,
		gpuPassMilliseconds,
		warmupRuntimeGpuMilliseconds: allRuntimeGpuMilliseconds.slice(0, -sampleFrameCount),
		meanRuntimeGpuMilliseconds,
		p95RuntimeGpuMilliseconds,
	},
	facts,
	requestsAfterReady: requests.filter((request) => request.startedAt >= readyAt),
	consoleMessages,
	derivation: {
		operation:
			'load the namespaced Flat32 application, wait for its exact distant-Sun cache publication, synchronize WebGL before and after each completed application frame, and enforce named-hardware frame-time limits',
		implementation: 'scripts/flat32/verify-distant-sun-runtime-performance.js',
		sourceIdentities,
	},
};
await writeFile(path.join(outputDirectory, 'verification-report.json'), `${JSON.stringify(report, null, 2)}\n`);
if (!accepted) {
	throw new Error(
		`Flat32 distant-Sun runtime performance proof failed: GPU mean ${meanRuntimeGpuMilliseconds.toFixed(3)} ms, GPU p95 ${p95RuntimeGpuMilliseconds.toFixed(3)} ms, renderer ${facts.gpu.renderer}.`,
	);
}
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
