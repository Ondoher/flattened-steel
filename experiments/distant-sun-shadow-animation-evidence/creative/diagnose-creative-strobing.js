#!/usr/bin/env node

import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

import puppeteer from 'puppeteer';

import {ArtifactManifest} from '../../../scripts/animation-evidence/ArtifactManifest.js';
import {CHROME_EXECUTABLE, REPOSITORY_ROOT} from '../consts.js';
import {CreativeRunFiles} from './node/CreativeRunFiles.js';

const parentRunId = '1788974488678-creative-animation';
const outputRootRelative = 'tmp/experiments/distant-sun-shadow-animation-evidence/runs';

/** @param {number[]} values @param {number} fraction @returns {number} */
function percentile(values, fraction) {
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}

/** @param {readonly object[]} frames @param {string} region @param {readonly object[]} trace */
function analyzeRegion(frames, region, trace) {
	const rows = [];
	for (let index = 1; index < frames.length; index += 1) {
		const before = frames[index - 1][region].meanLuma;
		const after = frames[index][region].meanLuma;
		rows.push({
			frameIndex: index,
			animationSeconds: trace[index].animationSeconds,
			solarZenithDegrees: trace[index].solarZenithDegrees,
			modeChanged: trace[index].modeChanged,
			cacheIdentity: trace[index].cacheIdentity,
			lumaBefore: before,
			lumaAfter: after,
			absoluteStep: Math.abs(after - before),
		});
	}
	const changed = rows.filter((row) => row.modeChanged);
	const stable = rows.filter((row) => !row.modeChanged);
	const mean = (items) => items.reduce((sum, row) => sum + row.absoluteStep, 0) / items.length;
	const top = [...rows].sort((left, right) => right.absoluteStep - left.absoluteStep).slice(0, 40);
	const curvatureRows = [];
	for (let index = 1; index < frames.length - 1; index += 1) {
		const precedingStep = frames[index][region].meanLuma - frames[index - 1][region].meanLuma;
		const followingStep = frames[index + 1][region].meanLuma - frames[index][region].meanLuma;
		curvatureRows.push({
			frameIndex: index,
			animationSeconds: trace[index].animationSeconds,
			solarZenithDegrees: trace[index].solarZenithDegrees,
			cacheBoundaryAdjacent: trace[index].modeChanged || trace[index + 1].modeChanged,
			directionReversed: Math.sign(precedingStep) !== Math.sign(followingStep),
			precedingStep,
			followingStep,
			absoluteCurvature: Math.abs(followingStep - precedingStep),
		});
	}
	const boundaryCurvature = curvatureRows.filter((row) => row.cacheBoundaryAdjacent);
	const stableCurvature = curvatureRows.filter((row) => !row.cacheBoundaryAdjacent);
	const topCurvature = [...curvatureRows]
		.sort((left, right) => right.absoluteCurvature - left.absoluteCurvature)
		.slice(0, 40);
	const curvatureMean = (items) =>
		items.reduce((sum, row) => sum + row.absoluteCurvature, 0) / items.length;
	return {
		region,
		cacheTransitionCount: changed.length,
		meanAbsoluteStepAtCacheTransition: mean(changed),
		meanAbsoluteStepWithoutCacheTransition: mean(stable),
		medianAbsoluteStepAtCacheTransition: percentile(
			changed.map((row) => row.absoluteStep),
			0.5,
		),
		medianAbsoluteStepWithoutCacheTransition: percentile(
			stable.map((row) => row.absoluteStep),
			0.5,
		),
		p95AbsoluteStepAtCacheTransition: percentile(
			changed.map((row) => row.absoluteStep),
			0.95,
		),
		p95AbsoluteStepWithoutCacheTransition: percentile(
			stable.map((row) => row.absoluteStep),
			0.95,
		),
		top40CacheTransitionCount: top.filter((row) => row.modeChanged).length,
		topSteps: top,
		oscillation: {
			meanAbsoluteCurvatureAtCacheBoundary: curvatureMean(boundaryCurvature),
			meanAbsoluteCurvatureWithoutCacheBoundary: curvatureMean(stableCurvature),
			p95AbsoluteCurvatureAtCacheBoundary: percentile(
				boundaryCurvature.map((row) => row.absoluteCurvature),
				0.95,
			),
			p95AbsoluteCurvatureWithoutCacheBoundary: percentile(
				stableCurvature.map((row) => row.absoluteCurvature),
				0.95,
			),
			top40CacheBoundaryCount: topCurvature.filter((row) => row.cacheBoundaryAdjacent).length,
			top40DirectionReversalCount: topCurvature.filter((row) => row.directionReversed).length,
			topCurvature,
		},
	};
}

/** @param {readonly object[]} trace */
function analyzeLighting(trace) {
	const names = ['skyAmbientIntensity', 'groundBounceIntensity', 'directionalIntensity', 'ambientIntensity'];
	return names.map((name) => {
		const changed = [];
		const stable = [];
		for (let index = 1; index < trace.length; index += 1) {
			const step = Math.abs(trace[index].lighting[name] - trace[index - 1].lighting[name]);
			(trace[index].modeChanged ? changed : stable).push(step);
		}
		const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
		return {
			metric: name,
			meanStepAtCacheTransition: mean(changed),
			meanStepWithoutCacheTransition: mean(stable),
			p95StepAtCacheTransition: percentile(changed, 0.95),
			p95StepWithoutCacheTransition: percentile(stable, 0.95),
		};
	});
}

async function main() {
	const repositoryRoot = await CreativeRunFiles.requireRealPath(REPOSITORY_ROOT);
	const outputRoot = await CreativeRunFiles.ensureDirectory(repositoryRoot, outputRootRelative);
	const runId = `${Date.now()}-creative-strobing-diagnosis`;
	const runDirectory = await CreativeRunFiles.ensureDirectory(outputRoot, runId);
	const browserProfile = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-profile');
	const browserTemporary = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-temp');
	let browser;
	let lastProgress = Date.now();
	const progress = async (event) => {
		lastProgress = Date.now();
		await appendFile(
			path.join(runDirectory, 'progress.jsonl'),
			`${JSON.stringify({timestamp: new Date().toISOString(), ...event})}\n`,
			'utf8',
		);
	};
	const heartbeat = setInterval(() => {
		if (Date.now() - lastProgress >= 30_000)
			void progress({phase: 'active', message: 'Strobing diagnosis remains active.'});
	}, 10_000);
	try {
		await progress({phase: 'initialize', message: 'Allocated new creative strobing diagnosis run.'});
		process.stdout.write(`${JSON.stringify({runId, runDirectory})}\n`);
		const parentDirectory = await CreativeRunFiles.requireRealPath(
			CreativeRunFiles.resolve(repositoryRoot, `${outputRootRelative}/${parentRunId}`),
		);
		const manifest = JSON.parse(await readFile(path.join(parentDirectory, 'artifact-manifest.json'), 'utf8'));
		await ArtifactManifest.verify(parentDirectory, manifest, manifest.excludedPaths);
		const result = JSON.parse(await readFile(path.join(parentDirectory, 'result.json'), 'utf8'));
		const traceRecord = JSON.parse(await readFile(path.join(parentDirectory, 'scene-trace.json'), 'utf8'));
		if (
			manifest.state !== 'accepted' ||
			result.state !== 'accepted' ||
			result.runId !== parentRunId ||
			traceRecord.schemaId !== 'the-hours-scene-trace-v1' ||
			traceRecord.frames.length !== 1800
		)
			throw new Error('Strobing diagnosis parent is not the accepted complete creative film.');
		const videoPath = await CreativeRunFiles.requireRealPath(
			CreativeRunFiles.resolve(parentDirectory, result.video.path),
		);
		const sourcePaths = [
			'experiments/distant-sun-shadow-animation-evidence/creative/diagnose-creative-strobing.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeStrobingInspection.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeRunFiles.js',
			'experiments/distant-sun-shadow-animation-evidence/consts.js',
			'scripts/animation-evidence/ArtifactManifest.js',
		];
		const implementation = [];
		for (const sourcePath of sourcePaths)
			implementation.push((await CreativeRunFiles.readSnapshot(repositoryRoot, sourcePath)).identity);
		await CreativeRunFiles.writeJson(runDirectory, 'inputs.json', {
			parentRunId,
			parentArtifactSetSha256: manifest.artifactSetSha256,
			video: result.video,
			trace: result.trace,
			implementation,
		});
		await writeFile(
			path.join(runDirectory, 'inspection.html'),
			'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Strobing diagnosis</title></head><body></body></html>\n',
			{flag: 'wx'},
		);
		await progress({phase: 'launch-decoder', message: 'Launching contained Chrome video decoder.'});
		browser = await puppeteer.launch({
			headless: true,
			executablePath: CHROME_EXECUTABLE,
			userDataDir: browserProfile,
			protocolTimeout: 1_200_000,
			env: {...process.env, TEMP: browserTemporary, TMP: browserTemporary, TMPDIR: browserTemporary},
			args: [
				'--allow-file-access-from-files',
				'--enable-gpu',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-background-timer-throttling',
				'--disable-renderer-backgrounding',
				'--disable-background-networking',
				'--disable-component-update',
				'--no-first-run',
				'--no-default-browser-check',
				`--crash-dumps-dir=${browserTemporary}`,
				`--disk-cache-dir=${path.join(browserProfile, 'cache')}`,
			],
		});
		const page = await browser.newPage();
		await page.exposeFunction('__creativeStrobingProgress', progress);
		await page.goto(pathToFileURL(path.join(runDirectory, 'inspection.html')).href, {waitUntil: 'load'});
		const moduleUrl = pathToFileURL(
			await CreativeRunFiles.requireRealPath(
				CreativeRunFiles.resolve(
					repositoryRoot,
					'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeStrobingInspection.js',
				),
			),
		).href;
		const pixels = await page.evaluate(
			async (url, configuration) => {
				const {CreativeStrobingInspection} = await import(url);
				return CreativeStrobingInspection.inspect(configuration);
			},
			moduleUrl,
			{videoUrl: pathToFileURL(videoPath).href, frameCount: traceRecord.frames.length},
		);
		await CreativeRunFiles.writeJson(runDirectory, 'pixel-trace.json', pixels);
		const regionAnalysis = ['full', 'upper', 'horizon', 'lower'].map((region) =>
			analyzeRegion(pixels.frames, region, traceRecord.frames),
		);
		const diagnosis = {
			schemaId: 'distant-sun-creative-strobing-diagnosis-v1',
			parentRunId,
			frameCount: traceRecord.frames.length,
			cacheTransitionCount: traceRecord.frames.filter((frame) => frame.modeChanged).length,
			measurement: {width: pixels.width, height: pixels.height, colorSpace: 'encoded display RGB'},
			regionAnalysis,
			lightingTraceAnalysis: analyzeLighting(traceRecord.frames),
			claimBoundary:
				'This diagnosis correlates exact decoded-frame brightness with retained cache and lighting state. Correlation identifies the strongest candidate and guides isolation; it does not itself prove physical causation.',
		};
		await CreativeRunFiles.writeJson(runDirectory, 'diagnosis.json', diagnosis);
		await browser.close();
		browser = undefined;
		await ArtifactManifest.verify(parentDirectory, manifest, manifest.excludedPaths);
		await progress({phase: 'complete', message: 'Completed immutable parent strobing diagnosis.', state: 'accepted'});
		const created = await ArtifactManifest.create(runDirectory, [
			'artifact-manifest.json',
			'browser-profile',
			'browser-temp',
		]);
		await CreativeRunFiles.writeJson(runDirectory, 'artifact-manifest.json', {
			schemaId: 'distant-sun-creative-strobing-diagnosis-artifact-manifest-v1',
			runId,
			state: 'accepted',
			excludedPaths: ['artifact-manifest.json', 'browser-profile', 'browser-temp'],
			...created,
		});
		process.stdout.write(`${JSON.stringify({runId, state: 'accepted', diagnosis: 'diagnosis.json'})}\n`);
	} catch (error) {
		if (browser) await browser.close().catch(() => undefined);
		await progress({phase: 'failed', message: error.message, state: 'failed'}).catch(() => undefined);
		throw error;
	} finally {
		clearInterval(heartbeat);
	}
}

await main();
