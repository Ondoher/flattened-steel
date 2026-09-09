#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const SAMPLES_PER_PHASE = 12;
const RESOLUTION_SEQUENCE = Object.freeze([
	Object.freeze({width: 3840, height: 2160, label: 'native-4k'}),
	Object.freeze({width: 1920, height: 1080, label: 'half-linear-1080p'}),
	Object.freeze({width: 3840, height: 2160, label: 'native-4k'}),
	Object.freeze({width: 2560, height: 1440, label: 'two-thirds-linear-1440p'}),
	Object.freeze({width: 3840, height: 2160, label: 'native-4k'}),
]);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const percentile = (values, fraction) => values[Math.max(0, Math.ceil(values.length * fraction) - 1)];
const statistics = (input) => {
	const values = [...input].sort((left, right) => left - right);
	return {
		sampleCount: values.length,
		meanGpuMilliseconds: values.reduce((sum, value) => sum + value, 0) / values.length,
		medianGpuMilliseconds: percentile(values, 0.5),
		p95GpuMilliseconds: percentile(values, 0.95),
		minimumGpuMilliseconds: values[0],
		maximumGpuMilliseconds: values.at(-1),
		gpuMilliseconds: values,
	};
};
const sourceIdentity = async (absolutePath) => {
	const bytes = await readFile(absolutePath);
	return {byteLength: bytes.byteLength, sha256: sha256(bytes)};
};

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
if (!outputRoot.startsWith(`${await realpath(path.join(repositoryRoot, 'tmp'))}${path.sep}`)) {
	throw new Error('Experiment output root escaped the repository tmp root.');
}
const runsRoot = path.join(outputRoot, 'runs');
await mkdir(runsRoot, {recursive: true});
const runId = `${Date.now()}-s5-production-resolution-sweep`;
const run = path.join(runsRoot, runId);
await mkdir(run);
const progressPath = path.join(run, 'progress.jsonl');
let progress = '';
const recordProgress = async (phase, message, extra = {}) => {
	progress += `${JSON.stringify({timestamp: new Date().toISOString(), phase, message, ...extra})}\n`;
	await writeFile(progressPath, progress);
};

await writeFile(
	path.join(run, 'command.txt'),
	'node experiments/gpu-resident-shared-block-cache/run-s5-production-resolution-sweep.js\n',
);
await writeFile(
	path.join(run, 'inputs.json'),
	`${JSON.stringify(
		{
			schemaId: 'gpu-resident-shared-block-cache-production-resolution-sweep-input-v1',
			applicationUrl:
				'http://127.0.0.1:8081/flat32/?diagnostic=spherical-reference-production-n4&performance=1',
			presentationTarget: {width: 3840, height: 2160},
			resolutionSequence: RESOLUTION_SEQUENCE,
			samplesPerPhase: SAMPLES_PER_PHASE,
			pathQuadrature: 'unchanged qualified Q30 quadratic-near-observer',
		},
		null,
		2,
	)}\n`,
);
await recordProgress('initialize', 'Allocated immutable production Q30 resolution-sweep run.');

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
		'--window-size=3840,2160',
	],
});

let browserResult;
try {
	const page = await browser.newPage();
	await page.setViewport({width: 3840, height: 2160, deviceScaleFactor: 1});
	await recordProgress('load', 'Loading unchanged production Q30 application and authenticated cache.');
	await page.goto(
		'http://127.0.0.1:8081/flat32/?diagnostic=spherical-reference-production-n4&performance=1',
		{waitUntil: 'networkidle2', timeout: 120_000},
	);
	await page.waitForFunction(
		() => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32State === 'ready' && shell?.dataset.flat32DistantSunCacheState === 'ready'
			);
		},
		{timeout: 180_000},
	);
	await page.addStyleTag({
		content: '.flat32-scene-controls,.flat32-time-panel{visibility:hidden!important}',
	});

	const phases = [];
	const captures = new Map();
	for (let phaseIndex = 0; phaseIndex < RESOLUTION_SEQUENCE.length; phaseIndex += 1) {
		const resolution = RESOLUTION_SEQUENCE[phaseIndex];
		await recordProgress(
			'measure',
			`Measuring phase ${phaseIndex + 1} of ${RESOLUTION_SEQUENCE.length}: ${resolution.width}x${resolution.height}.`,
			{completed: phaseIndex, total: RESOLUTION_SEQUENCE.length},
		);
		await page.setViewport({...resolution, deviceScaleFactor: 1});
		await page.waitForFunction(
			(width, height) => {
				const context = document.querySelector('#flat32-canvas')?.getContext('webgl2');
				return context?.drawingBufferWidth === width && context?.drawingBufferHeight === height;
			},
			{timeout: 30_000},
			resolution.width,
			resolution.height,
		);
		const markerSampleId = await page.evaluate(async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
			return Math.max(0, ...(window.__flat32PerformanceSamples ?? []).map((sample) => sample.sampleId ?? 0));
		});
		await page.waitForFunction(
			(marker, requiredCount) =>
				(window.__flat32PerformanceSamples ?? []).filter(
					(sample) =>
						sample.event === 'gpu-elapsed' &&
						sample.passName === 'algorithm32-runtime-shader' &&
						sample.sampleId > marker &&
						sample.gpuDuration !== null &&
						sample.disjoint !== true,
				).length >= requiredCount,
			{timeout: 120_000, polling: 100},
			markerSampleId,
			SAMPLES_PER_PHASE,
		);
		const gpuMilliseconds = await page.evaluate(
			(marker, requiredCount) =>
				(window.__flat32PerformanceSamples ?? [])
					.filter(
						(sample) =>
							sample.event === 'gpu-elapsed' &&
							sample.passName === 'algorithm32-runtime-shader' &&
							sample.sampleId > marker &&
							sample.gpuDuration !== null &&
							sample.disjoint !== true,
					)
					.slice(0, requiredCount)
					.map((sample) => sample.gpuDuration.value * 1000),
			markerSampleId,
			SAMPLES_PER_PHASE,
		);
		phases.push({...resolution, gpuMilliseconds, statistics: statistics(gpuMilliseconds)});
		if (!captures.has(resolution.label)) {
			const canvas = await page.$('#flat32-canvas');
			if (canvas === null) throw new Error('Flat32 canvas disappeared before image capture.');
			const bytes = await canvas.screenshot({type: 'png'});
			const relativePath = `captures/${resolution.label}.png`;
			await mkdir(path.join(run, 'captures'), {recursive: true});
			await writeFile(path.join(run, relativePath), bytes);
			captures.set(resolution.label, {bytes, relativePath, sha256: sha256(bytes)});
		}
	}
	const baselineCapture = captures.get('native-4k');
	if (!baselineCapture) throw new Error('Native 4K baseline capture is missing.');
	const visualComparisons = {};
	for (const [label, capture] of captures) {
		visualComparisons[label] = await page.evaluate(
			async (baselineBase64, candidateBase64) => {
				const decode = async (base64) => {
					const image = new Image();
					image.src = `data:image/png;base64,${base64}`;
					await image.decode();
					return image;
				};
				const baselineImage = await decode(baselineBase64);
				const candidateImage = await decode(candidateBase64);
				const pixels = (image, width, height) => {
					const canvas = document.createElement('canvas');
					canvas.width = width;
					canvas.height = height;
					const context = canvas.getContext('2d', {willReadFrequently: true});
					context.imageSmoothingEnabled = true;
					context.imageSmoothingQuality = 'high';
					context.drawImage(image, 0, 0, width, height);
					return context.getImageData(0, 0, width, height).data;
				};
				const width = baselineImage.naturalWidth;
				const height = baselineImage.naturalHeight;
				const baseline = pixels(baselineImage, width, height);
				const candidate = pixels(candidateImage, width, height);
				let absoluteDifferenceSum = 0;
				let squaredDifferenceSum = 0;
				let maximumAbsoluteCodeDifference = 0;
				let differingPixelCount = 0;
				const histogram = new Uint32Array(256);
				for (let offset = 0; offset < baseline.length; offset += 4) {
					let pixelDiffers = false;
					for (let channel = 0; channel < 3; channel += 1) {
						const difference = Math.abs(baseline[offset + channel] - candidate[offset + channel]);
						absoluteDifferenceSum += difference;
						squaredDifferenceSum += difference * difference;
						maximumAbsoluteCodeDifference = Math.max(maximumAbsoluteCodeDifference, difference);
						histogram[difference] += 1;
						pixelDiffers ||= difference !== 0;
					}
					if (pixelDiffers) differingPixelCount += 1;
				}
				const channelCount = width * height * 3;
				const percentileCodeDifference = (fraction) => {
					const target = Math.ceil(channelCount * fraction);
					let cumulative = 0;
					for (let difference = 0; difference < histogram.length; difference += 1) {
						cumulative += histogram[difference];
						if (cumulative >= target) return difference;
					}
					return 255;
				};
				const meanSquaredDifference = squaredDifferenceSum / channelCount;
				return {
					baseline: {width, height},
					candidate: {width: candidateImage.naturalWidth, height: candidateImage.naturalHeight},
					upscale: 'browser Canvas2D high-quality smoothing to native 4K dimensions',
					maximumAbsoluteCodeDifference,
					meanAbsoluteCodeDifference: absoluteDifferenceSum / channelCount,
					rootMeanSquareCodeDifference: Math.sqrt(meanSquaredDifference),
					p95AbsoluteCodeDifference: percentileCodeDifference(0.95),
					p99AbsoluteCodeDifference: percentileCodeDifference(0.99),
					differingPixelCount,
					differingPixelFraction: differingPixelCount / (width * height),
					peakSignalToNoiseRatioDecibels:
						meanSquaredDifference === 0 ? null : 10 * Math.log10((255 * 255) / meanSquaredDifference),
				};
			},
			baselineCapture.bytes.toString('base64'),
			capture.bytes.toString('base64'),
		);
	}

	browserResult = await page.evaluate((measuredPhases) => {
		const canvas = document.querySelector('#flat32-canvas');
		const context = canvas?.getContext('webgl2');
		const rendererInfo = context?.getExtension('WEBGL_debug_renderer_info');
		const shell = document.querySelector('.flat32-shell');
		return {
			phases: measuredPhases,
			shell: {
				flat32State: shell?.dataset.flat32State,
				flat32DistantSunCacheState: shell?.dataset.flat32DistantSunCacheState,
			},
			drawingBuffer: {width: context?.drawingBufferWidth, height: context?.drawingBufferHeight},
			gpu: {
				vendor: rendererInfo
					? context.getParameter(rendererInfo.UNMASKED_VENDOR_WEBGL)
					: context?.getParameter(context.VENDOR),
				renderer: rendererInfo
					? context.getParameter(rendererInfo.UNMASKED_RENDERER_WEBGL)
					: context?.getParameter(context.RENDERER),
			},
			webglError: context?.getError(),
		};
	}, phases);
	browserResult.captures = Object.fromEntries(
		[...captures].map(([label, capture]) => [
			label,
			{path: capture.relativePath, byteLength: capture.bytes.byteLength, sha256: capture.sha256},
		]),
	);
	browserResult.visualComparisonsToNative4k = visualComparisons;
} finally {
	await browser.close();
}

const byResolution = Object.fromEntries(
	[...new Set(RESOLUTION_SEQUENCE.map(({label}) => label))].map((label) => {
		const values = browserResult.phases
			.filter((phase) => phase.label === label)
			.flatMap((phase) => phase.gpuMilliseconds);
		return [label, statistics(values)];
	}),
);
const nativeMean = byResolution['native-4k'].meanGpuMilliseconds;
const comparisons = Object.fromEntries(
	Object.entries(byResolution).map(([label, measurement]) => [
		label,
		{
			meanGpuMilliseconds: measurement.meanGpuMilliseconds,
			fpsCeiling: 1000 / measurement.meanGpuMilliseconds,
			speedupOverNative4k: nativeMean / measurement.meanGpuMilliseconds,
			millisecondsSaved: nativeMean - measurement.meanGpuMilliseconds,
		},
	]),
);
const accepted =
	browserResult.shell.flat32State === 'ready' &&
	browserResult.shell.flat32DistantSunCacheState === 'ready' &&
	browserResult.drawingBuffer.width === 3840 &&
	browserResult.drawingBuffer.height === 2160 &&
	browserResult.webglError === 0 &&
	browserResult.phases.every((phase) => phase.gpuMilliseconds.length === SAMPLES_PER_PHASE);
const result = {
	schemaId: 'gpu-resident-shared-block-cache-production-resolution-sweep-result-v1',
	runId,
	accepted,
	claimBoundary:
		'Performance characterization of unchanged Q30 at alternative internal raster sizes. It does not implement or quality-qualify 4K upsampling, depth-aware reconstruction, or temporal reprojection.',
	configuration: {
		application: 'unchanged live production Flat32 Algorithm32 Q30 shader',
		presentationTarget: {width: 3840, height: 2160},
		resolutionSequence: RESOLUTION_SEQUENCE,
		samplesPerPhase: SAMPLES_PER_PHASE,
	},
	measurements: {byResolution, comparisons, phases: browserResult.phases},
	browser: browserResult,
	derivation: {
		operation: 'interleaved live production Q30 full-pass GPU timer queries at same-aspect internal raster sizes',
		sourceIdentities: {
			runner: await sourceIdentity(import.meta.filename),
			productionBundle: await sourceIdentity(path.join(repositoryRoot, 'dist', 'flat32', 'flat32.js')),
		},
	},
};
await writeFile(path.join(run, 'browser-result.json'), `${JSON.stringify(browserResult, null, 2)}\n`);
await writeFile(path.join(run, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(
	path.join(run, 'environment.json'),
	`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, gpu: browserResult.gpu}, null, 2)}\n`,
);
await writeFile(path.join(run, 'provenance.json'), `${JSON.stringify(result.derivation, null, 2)}\n`);
await recordProgress(
	'terminal',
	accepted ? 'Accepted the interleaved Q30 resolution sweep.' : 'The Q30 resolution sweep failed a prerequisite.',
	{completed: RESOLUTION_SEQUENCE.length, total: RESOLUTION_SEQUENCE.length, state: accepted ? 'accepted' : 'failed'},
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!accepted) process.exitCode = 1;
