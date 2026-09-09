#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer';

import {CHROME_EXECUTABLE, OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const WIDTH = 3840;
const HEIGHT = 2160;
const SAMPLES_PER_PHASE = 12;
const INTERVAL_SEQUENCE = Object.freeze([30, 15, 30, 20, 30, 24, 30, 10, 30]);
const TARGET_UNIFORM = 'uTransportPathIntervalCount';

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

const sourceRoot = await realpath(SOURCE_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
if (!sourceRoot.startsWith(`${await realpath(REPOSITORY_ROOT)}${path.sep}`)) {
	throw new Error('Experiment source root escaped the repository.');
}
if (!outputRoot.startsWith(`${await realpath(path.join(REPOSITORY_ROOT, 'tmp'))}${path.sep}`)) {
	throw new Error('Experiment output root escaped the repository tmp root.');
}

const runsRoot = path.join(outputRoot, 'runs');
await mkdir(runsRoot, {recursive: true});
const runId = `${Date.now()}-s5-production-interval-sweep-4k`;
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
	'node experiments/gpu-resident-shared-block-cache/run-s5-production-interval-sweep.js\n',
);
await writeFile(
	path.join(run, 'inputs.json'),
	`${JSON.stringify(
		{
			schemaId: 'gpu-resident-shared-block-cache-production-interval-sweep-input-v1',
			applicationUrl:
				'http://127.0.0.1:8081/flat32/?diagnostic=spherical-reference-production-n4&performance=1',
			physicalDrawingBuffer: {width: WIDTH, height: HEIGHT},
			intervalSequence: INTERVAL_SEQUENCE,
			samplesPerPhase: SAMPLES_PER_PHASE,
			targetUniform: TARGET_UNIFORM,
		},
		null,
		2,
	)}\n`,
);
await recordProgress('initialize', 'Allocated immutable 4K production interval-sweep run.');

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

let browserResult;
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
		const observedRequestedValues = [];
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
				observedRequestedValues.push(value);
				return originalUniform1i.call(this, location, desiredIntervalCount ?? value);
			}
			return originalUniform1i.call(this, location, value);
		};

		window.__a32IntervalSweep = {
			setIntervalCount(value) {
				desiredIntervalCount = value;
				let liveLocationCount = 0;
				for (const entry of entries) {
					if (entry.context.isContextLost() || !entry.context.isProgram(entry.program)) continue;
					while (entry.context.getError() !== entry.context.NO_ERROR) {
						// Attribute only errors produced by this diagnostic setter.
					}
					const priorProgram = entry.context.getParameter(entry.context.CURRENT_PROGRAM);
					originalUseProgram.call(entry.context, entry.program);
					originalUniform1i.call(entry.context, entry.location, value);
					originalUseProgram.call(entry.context, priorProgram);
					const error = entry.context.getError();
					if (error !== entry.context.NO_ERROR) setterErrors.push({value, error});
					liveLocationCount += 1;
				}
				return liveLocationCount;
			},
			diagnostics() {
				return {
					desiredIntervalCount,
					locationCount: entries.length,
					observedRequestedValues: [...observedRequestedValues],
					setterErrors: [...setterErrors],
				};
			},
		};
	}, TARGET_UNIFORM);

	await recordProgress('load', 'Loading the unchanged production application and authenticated scene cache.');
	await page.goto(
		'http://127.0.0.1:8081/flat32/?diagnostic=spherical-reference-production-n4&performance=1',
		{waitUntil: 'networkidle2', timeout: 120_000},
	);
	await page.waitForFunction(
		() => {
			const shell = document.querySelector('.flat32-shell');
			return (
				shell?.dataset.flat32State === 'ready' &&
				shell?.dataset.flat32DistantSunCacheState === 'ready' &&
				window.__a32IntervalSweep?.diagnostics().locationCount > 0
			);
		},
		{timeout: 180_000},
	);
	await page.addStyleTag({
		content: '.flat32-scene-controls,.flat32-time-panel{visibility:hidden!important}',
	});

	const phases = [];
	const captures = new Map();
	for (let phaseIndex = 0; phaseIndex < INTERVAL_SEQUENCE.length; phaseIndex += 1) {
		const intervalCount = INTERVAL_SEQUENCE[phaseIndex];
		await recordProgress(
			'measure',
			`Measuring phase ${phaseIndex + 1} of ${INTERVAL_SEQUENCE.length}: Q${intervalCount}.`,
			{completed: phaseIndex, total: INTERVAL_SEQUENCE.length},
		);
		const marker = await page.evaluate(async (value) => {
			const locationCount = window.__a32IntervalSweep.setIntervalCount(value);
			await new Promise((resolve) => setTimeout(resolve, 2000));
			const samples = window.__flat32PerformanceSamples ?? [];
			return {
				locationCount,
				lastSampleId: Math.max(0, ...samples.map((sample) => sample.sampleId ?? 0)),
			};
		}, intervalCount);
		await page.waitForFunction(
			(markerSampleId, requiredCount) =>
				(window.__flat32PerformanceSamples ?? []).filter(
					(sample) =>
						sample.event === 'gpu-elapsed' &&
						sample.passName === 'algorithm32-runtime-shader' &&
						sample.sampleId > markerSampleId &&
						sample.gpuDuration !== null &&
						sample.disjoint !== true,
				).length >= requiredCount,
			{timeout: 120_000, polling: 100},
			marker.lastSampleId,
			SAMPLES_PER_PHASE,
		);
		const phase = await page.evaluate(
			(markerSampleId, requiredCount, value) => {
				const samples = (window.__flat32PerformanceSamples ?? [])
					.filter(
						(sample) =>
							sample.event === 'gpu-elapsed' &&
							sample.passName === 'algorithm32-runtime-shader' &&
							sample.sampleId > markerSampleId &&
							sample.gpuDuration !== null &&
							sample.disjoint !== true,
					)
					.slice(0, requiredCount);
				return {
					intervalCount: value,
					sampleIds: samples.map((sample) => sample.sampleId),
					gpuMilliseconds: samples.map((sample) => sample.gpuDuration.value * 1000),
				};
			},
			marker.lastSampleId,
			SAMPLES_PER_PHASE,
			intervalCount,
		);
		phases.push({...phase, locationCount: marker.locationCount, statistics: statistics(phase.gpuMilliseconds)});
		if (!captures.has(intervalCount)) {
			const canvas = await page.$('#flat32-canvas');
			if (canvas === null) throw new Error('Flat32 canvas disappeared before image capture.');
			const bytes = await canvas.screenshot({type: 'png'});
			const relativePath = `captures/q${intervalCount}-4k.png`;
			await mkdir(path.join(run, 'captures'), {recursive: true});
			await writeFile(path.join(run, relativePath), bytes);
			captures.set(intervalCount, {bytes, relativePath, sha256: sha256(bytes)});
		}
	}
	const baselineCapture = captures.get(30);
	if (!baselineCapture) throw new Error('Q30 baseline capture is missing.');
	const visualComparisons = {};
	for (const [intervalCount, capture] of captures) {
		visualComparisons[intervalCount] = await page.evaluate(
			async (baselineBase64, candidateBase64) => {
				const decode = async (base64) => {
					const image = new Image();
					image.src = `data:image/png;base64,${base64}`;
					await image.decode();
					const canvas = document.createElement('canvas');
					canvas.width = image.naturalWidth;
					canvas.height = image.naturalHeight;
					const context = canvas.getContext('2d', {willReadFrequently: true});
					context.drawImage(image, 0, 0);
					return {width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data};
				};
				const baseline = await decode(baselineBase64);
				const candidate = await decode(candidateBase64);
				if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
					throw new Error('Interval-sweep capture dimensions differ.');
				}
				let absoluteDifferenceSum = 0;
				let squaredDifferenceSum = 0;
				let maximumAbsoluteCodeDifference = 0;
				let differingPixelCount = 0;
				const histogram = new Uint32Array(256);
				for (let offset = 0; offset < baseline.pixels.length; offset += 4) {
					let pixelDiffers = false;
					for (let channel = 0; channel < 3; channel += 1) {
						const difference = Math.abs(baseline.pixels[offset + channel] - candidate.pixels[offset + channel]);
						absoluteDifferenceSum += difference;
						squaredDifferenceSum += difference * difference;
						maximumAbsoluteCodeDifference = Math.max(maximumAbsoluteCodeDifference, difference);
						histogram[difference] += 1;
						pixelDiffers ||= difference !== 0;
					}
					if (pixelDiffers) differingPixelCount += 1;
				}
				const channelCount = baseline.width * baseline.height * 3;
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
					width: baseline.width,
					height: baseline.height,
					maximumAbsoluteCodeDifference,
					meanAbsoluteCodeDifference: absoluteDifferenceSum / channelCount,
					rootMeanSquareCodeDifference: Math.sqrt(meanSquaredDifference),
					p95AbsoluteCodeDifference: percentileCodeDifference(0.95),
					p99AbsoluteCodeDifference: percentileCodeDifference(0.99),
					differingPixelCount,
					differingPixelFraction: differingPixelCount / (baseline.width * baseline.height),
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
			interceptor: window.__a32IntervalSweep.diagnostics(),
		};
	}, phases);
	browserResult.captures = Object.fromEntries(
		[...captures].map(([intervalCount, capture]) => [
			intervalCount,
			{path: capture.relativePath, byteLength: capture.bytes.byteLength, sha256: capture.sha256},
		]),
	);
	browserResult.visualComparisonsToQ30 = visualComparisons;
} finally {
	await browser.close();
}

const byInterval = Object.fromEntries(
	[...new Set(INTERVAL_SEQUENCE)].map((intervalCount) => {
		const values = browserResult.phases
			.filter((phase) => phase.intervalCount === intervalCount)
			.flatMap((phase) => phase.gpuMilliseconds);
		return [intervalCount, statistics(values)];
	}),
);
const productionMean = byInterval[30].meanGpuMilliseconds;
const comparisons = Object.fromEntries(
	Object.entries(byInterval).map(([intervalCount, measurement]) => [
		intervalCount,
		{
			meanGpuMilliseconds: measurement.meanGpuMilliseconds,
			fpsCeiling: 1000 / measurement.meanGpuMilliseconds,
			speedupOverQ30: productionMean / measurement.meanGpuMilliseconds,
			millisecondsSaved: productionMean - measurement.meanGpuMilliseconds,
		},
	]),
);
const accepted =
	browserResult.shell.flat32State === 'ready' &&
	browserResult.shell.flat32DistantSunCacheState === 'ready' &&
	browserResult.drawingBuffer.width === WIDTH &&
	browserResult.drawingBuffer.height === HEIGHT &&
	browserResult.webglError === 0 &&
	browserResult.interceptor.setterErrors.length === 0 &&
	browserResult.phases.every(
		(phase) => phase.locationCount > 0 && phase.gpuMilliseconds.length === SAMPLES_PER_PHASE,
	) &&
	browserResult.interceptor.observedRequestedValues.includes(30);

const result = {
	schemaId: 'gpu-resident-shared-block-cache-production-interval-sweep-result-v1',
	runId,
	accepted,
	claimBoundary:
		'Performance characterization only. Q30 is the qualified production quadrature; lower interval counts are unqualified diagnostic variants and are not production recommendations.',
	configuration: {
		application: 'live production Flat32 Algorithm32 shader with one uniform-only diagnostic override',
		physicalDrawingBuffer: {width: WIDTH, height: HEIGHT},
		intervalSequence: INTERVAL_SEQUENCE,
		samplesPerPhase: SAMPLES_PER_PHASE,
	},
	measurements: {byInterval, comparisons, phases: browserResult.phases},
	browser: browserResult,
	derivation: {
		operation:
			'interleaved live production full-pass GPU timer queries while overriding only uTransportPathIntervalCount',
		sourceIdentities: {
			runner: await sourceIdentity(import.meta.filename),
			productionBundle: await sourceIdentity(path.join(REPOSITORY_ROOT, 'dist', 'flat32', 'flat32.js')),
			transport: await sourceIdentity(
				path.join(REPOSITORY_ROOT, 'src', 'algorithm32', 'atmospheric-transport', 'Algorithm32Transport.js'),
			),
		},
	},
};
await writeFile(path.join(run, 'browser-result.json'), `${JSON.stringify(browserResult, null, 2)}\n`);
await writeFile(path.join(run, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(
	path.join(run, 'environment.json'),
	`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, gpu: browserResult.gpu}, null, 2)}\n`,
);
await writeFile(
	path.join(run, 'provenance.json'),
	`${JSON.stringify(result.derivation, null, 2)}\n`,
);
await recordProgress(
	'terminal',
	accepted ? 'Accepted the interleaved 4K interval sweep.' : 'The 4K interval sweep failed a prerequisite.',
	{completed: INTERVAL_SEQUENCE.length, total: INTERVAL_SEQUENCE.length, state: accepted ? 'accepted' : 'failed'},
);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!accepted) process.exitCode = 1;
