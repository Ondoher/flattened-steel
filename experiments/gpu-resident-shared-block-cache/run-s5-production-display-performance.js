#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const percentile = (values, fraction) => values[Math.max(0, Math.ceil(values.length * fraction) - 1)];
const sourceIdentity = async (relativePath) => {
	const bytes = await readFile(path.join(REPOSITORY_ROOT, ...relativePath.split('/')));
	return {byteLength: bytes.byteLength, sha256: hash(bytes)};
};

const width = 3840;
const height = 2160;
const sampleCount = 12;
const outputRoot = await realpath(OUTPUT_ROOT);
const runsRoot = path.join(outputRoot, 'runs');
await mkdir(runsRoot, {recursive: true});
const runId = `${Date.now()}-s5-production-display-performance`;
const run = path.join(runsRoot, runId);
await mkdir(run);
const started = performance.now();
const browser = await puppeteer.launch({
	headless: true,
	protocolTimeout: 900_000,
	args: [
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--use-angle=d3d11',
		'--disable-background-timer-throttling',
		`--window-size=${width},${height}`,
	],
});
let facts;
try {
	const page = await browser.newPage();
	await page.setViewport({width, height, deviceScaleFactor: 1});
	await page.goto('http://127.0.0.1:8081/flat32/?diagnostic=spherical-reference-production-n4&performance=1', {
		waitUntil: 'networkidle2',
		timeout: 120_000,
	});
	await new Promise((resolve) => setTimeout(resolve, 30_000));
	facts = await page.evaluate(async (requestedSampleCount) => {
		const canvas = document.querySelector('#flat32-canvas');
		const context = canvas?.getContext('webgl2');
		if (!canvas || !context) throw new Error('The live production WebGL2 canvas is unavailable.');
		const extension = context.getExtension('WEBGL_debug_renderer_info');
		const shell = document.querySelector('.flat32-shell');
		return {
			shell: {
				flat32State: shell?.dataset.flat32State,
				flat32DistantSunCacheState: shell?.dataset.flat32DistantSunCacheState,
			},
			drawingBuffer: {width: context.drawingBufferWidth, height: context.drawingBufferHeight},
			gpu: {
				vendor: extension ? context.getParameter(extension.UNMASKED_VENDOR_WEBGL) : context.getParameter(context.VENDOR),
				renderer: extension ? context.getParameter(extension.UNMASKED_RENDERER_WEBGL) : context.getParameter(context.RENDERER),
			},
			webglError: context.getError(),
			performanceSamples: window.__flat32PerformanceSamples ?? [],
		};
	}, sampleCount);
} finally {
	await browser.close();
}

const gpuMilliseconds = facts.performanceSamples
	.filter(
		(sample) =>
			sample.event === 'gpu-elapsed' &&
			sample.passName === 'algorithm32-runtime-shader' &&
			sample.gpuDuration !== null &&
			sample.disjoint !== true,
	)
	.map((sample) => sample.gpuDuration.value * 1000)
	.slice(-sampleCount)
	.sort((left, right) => left - right);
const accepted =
	facts.shell.flat32State === 'ready' &&
	facts.shell.flat32DistantSunCacheState === 'ready' &&
	facts.drawingBuffer.width === width &&
	facts.drawingBuffer.height === height &&
	facts.webglError === 0 &&
	gpuMilliseconds.length >= sampleCount;
const result = {
	runId,
	accepted,
	configuration: {application: 'live production Flat32 Algorithm32 shader', physicalDrawingBuffer: {width, height}, sampleCount},
	measurements: {
		meanGpuMilliseconds: gpuMilliseconds.reduce((sum, value) => sum + value, 0) / gpuMilliseconds.length,
		medianGpuMilliseconds: percentile(gpuMilliseconds, 0.5),
		p95GpuMilliseconds: percentile(gpuMilliseconds, 0.95),
		gpuMilliseconds,
	},
	facts,
	derivation: {
		operation: 'live production application render-pass GPU elapsed measurement via EXT_disjoint_timer_query_webgl2',
		elapsedMilliseconds: performance.now() - started,
		sourceIdentities: {
			'dist/flat32/flat32.js': await sourceIdentity('dist/flat32/flat32.js'),
			'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js': await sourceIdentity('src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js'),
		},
	},
};
await writeFile(path.join(run, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
await writeFile(path.join(run, 'progress.jsonl'), `${JSON.stringify({timestamp: new Date().toISOString(), phase: 'terminal', message: 'Production-display timer-query measurement completed.', state: accepted ? 'accepted' : 'failed'})}\n`);
if (!accepted) throw new Error('Production display measurement did not meet its declared prerequisites.');
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
