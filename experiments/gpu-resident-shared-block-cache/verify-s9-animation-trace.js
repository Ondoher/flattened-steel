#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const DEFAULT_RUN_ID = '1788918482263-s9-animation-trace';
const FRAME_BUDGET_MICROSECONDS = 1_000_000 / 60;
const fail = (value, message) => {
	if (!value) throw new Error(message);
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const closeTo = (actual, expected, tolerance = 1e-9) => Math.abs(actual - expected) <= tolerance;
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const percentile = (values, fraction) => {
	const sorted = [...values].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};
const isWithin = (root, target) => {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

async function collectArtifacts(root, relative = '') {
	const entries = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `S9.3 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `S9.3 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^[0-9]+-s9-animation-trace$/u.test(runId), 'Invalid S9.3 run id.');
const expectedRun = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRun);
fail(runRoot.toLowerCase() === expectedRun.toLowerCase() && isWithin(outputRoot, runRoot), 'S9.3 run escaped its output root.');
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S9.3 run root is a symlink.');

const [resultBytes, manifestBytes, progressBytes, provenanceBytes, traceBytes, summaryBytes, inputsBytes] =
	await Promise.all([
		readFile(path.join(runRoot, 'result.json')),
		readFile(path.join(runRoot, 'artifact-manifest.json')),
		readFile(path.join(runRoot, 'progress.jsonl')),
		readFile(path.join(runRoot, 'provenance.json')),
		readFile(path.join(runRoot, 'trace.jsonl')),
		readFile(path.join(runRoot, 'summary.json')),
		readFile(path.join(runRoot, 'inputs.json')),
	]);
const result = JSON.parse(resultBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
const retainedSummary = JSON.parse(summaryBytes);
const inputs = JSON.parse(inputsBytes);
const frames = traceBytes
	.toString('utf8')
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line));

fail(result.schemaId === 'gpu-resident-shared-block-cache-s9-animation-trace-result-v1', 'Unexpected S9.3 result schema.');
fail(result.runId === runId && result.accepted === true, 'S9.3 result is not accepted.');
fail(manifest.schemaId === 'gpu-resident-shared-block-cache-s9-animation-trace-artifact-manifest-v1', 'Unexpected S9.3 manifest schema.');
fail(provenance.schemaId === 'gpu-resident-shared-block-cache-s9-animation-trace-provenance-v1', 'Unexpected S9.3 provenance schema.');
fail(inputs.schemaId === 'gpu-resident-shared-block-cache-s9-trace-input-v1', 'Unexpected S9.3 input schema.');

const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S9.3 artifact identities changed.');
fail(
	sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256,
	'S9.3 artifact-set identity changed.',
);
const terminalEvents = progressBytes
	.toString('utf8')
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line))
	.filter((event) => event.state);
fail(terminalEvents.length === 1 && terminalEvents[0].state === 'accepted', 'S9.3 terminal state is not uniquely accepted.');
fail(
	artifacts.every((artifact) => !/\.(png|jpe?g|webm|mp4|mkv|mov)$/iu.test(artifact.path)),
	'S9.3 timed evidence unexpectedly contains recording or image artifacts.',
);

fail(result.configuration.durationMicroseconds === 20_000_000, 'S9.3 duration changed.');
fail(
	result.configuration.viewport.width === 3840 && result.configuration.viewport.height === 2160,
	'S9.3 viewport changed.',
);
fail(result.configuration.cameraVerticalFieldOfViewDegrees === 78, 'S9.3 vertical FOV changed.');
fail(result.configuration.qualityIntervalCount === 10, 'S9.3 quality changed.');
fail(result.configuration.recordingOrImageReadback === false, 'S9.3 readback boundary changed.');
fail(
	result.preparation.sceneCount === 61 &&
		result.preparation.uniqueBlockCount === 62 &&
		result.preparation.encodedBytes === 363_647_002 &&
		result.preparation.decodedBytes === 966_128_640 &&
		result.preparation.packetAtlas.bytes === 1_110_786_048,
	'S9.3 preparation facts changed.',
);
fail(result.trace.byteLength === traceBytes.byteLength && result.trace.sha256 === sha256(traceBytes), 'S9.3 trace identity changed.');
fail(JSON.stringify(result.summary) === JSON.stringify(retainedSummary), 'S9.3 retained summary diverged from the result.');
fail(frames.length === result.summary.submittedFrameCount && frames.length > 10, 'S9.3 frame count changed.');

let previousCacheDegrees = null;
for (const [index, frame] of frames.entries()) {
	fail(frame.frameId === index, `S9.3 frame ${index} id changed.`);
	fail(
		index === 0 ? frame.animationCallbackMicroseconds === 0 : frame.animationCallbackMicroseconds > frames[index - 1].animationCallbackMicroseconds,
		`S9.3 frame ${index} callback ordering changed.`,
	);
	const elapsed = Math.min(20_000_000, frame.animationCallbackMicroseconds);
	const expectedProgress = elapsed / 20_000_000;
	const expectedZenith = 90 - 60 * Math.sin(Math.PI * expectedProgress);
	const expectedAzimuth = 90 + 180 * expectedProgress;
	fail(frame.requestedElapsedMicroseconds === elapsed, `S9.3 frame ${index} requested time changed.`);
	fail(closeTo(frame.scenarioProgress, expectedProgress), `S9.3 frame ${index} progress changed.`);
	fail(closeTo(frame.solarZenithDegrees, expectedZenith), `S9.3 frame ${index} zenith changed.`);
	fail(closeTo(frame.solarAzimuthDegrees, expectedAzimuth), `S9.3 frame ${index} azimuth changed.`);
	fail(
		frame.directionToSunUpEastNorth.length === 3 &&
			frame.cameraTargetUpEastNorth.every((value, directionIndex) =>
				closeTo(value, frame.directionToSunUpEastNorth[directionIndex]),
			),
		`S9.3 frame ${index} camera/Sun direction changed.`,
	);
	fail(
		closeTo(Math.hypot(...frame.directionToSunUpEastNorth), 1, 1e-12),
		`S9.3 frame ${index} direction is not normalized.`,
	);
	const expectedCache = Math.max(30, Math.min(90, Math.floor(expectedZenith + 0.5)));
	fail(frame.cacheSceneDegrees === expectedCache, `S9.3 frame ${index} cache selection changed.`);
	fail(frame.qualityIntervalCount === 10, `S9.3 frame ${index} quality changed.`);
	fail(
		frame.cpuSubmissionEndMicroseconds >= frame.cpuSubmissionStartMicroseconds,
		`S9.3 frame ${index} CPU timing changed.`,
	);
	fail(
		frame.gpuTimerOutcome === 'complete' &&
			frame.gpuTimerDisjoint === false &&
			Number.isFinite(frame.gpuElapsedMicroseconds) &&
			frame.gpuElapsedMicroseconds > 0,
		`S9.3 frame ${index} GPU timing did not close.`,
	);
	fail(
		frame.sunScreenCenterPixels.length === 2 &&
			closeTo(frame.sunScreenCenterPixels[0], 1920, 1) &&
			closeTo(frame.sunScreenCenterPixels[1], 1080, 1) &&
			frame.sunScreenCenterErrorPixels <= 1,
		`S9.3 frame ${index} Sun was not centered.`,
	);
	const changed = frame.cacheSceneDegrees !== previousCacheDegrees;
	fail(frame.cacheEvents.length === (changed ? 1 : 0), `S9.3 frame ${index} cache-event closure changed.`);
	if (changed) {
		const event = frame.cacheEvents[0];
		fail(
			event.type === 'scene-selection' &&
				event.fromDegrees === previousCacheDegrees &&
				event.toDegrees === frame.cacheSceneDegrees &&
				event.sceneOrdinal === frame.cacheSceneDegrees - 30 &&
				event.publication === 'whole-route-resident-metadata-switch',
			`S9.3 frame ${index} cache event changed.`,
		);
	}
	previousCacheDegrees = frame.cacheSceneDegrees;
}
fail(frames.at(-1).animationCallbackMicroseconds >= 20_000_000, 'S9.3 trace did not cover 20 seconds.');
fail(frames.at(-1).scenarioProgress === 1 && frames.at(-1).cacheSceneDegrees === 90, 'S9.3 final state changed.');

const intervals = frames.slice(1).map(
	(frame, index) => frame.animationCallbackMicroseconds - frames[index].animationCallbackMicroseconds,
);
const cpuValues = frames.map(
	(frame) => frame.cpuSubmissionEndMicroseconds - frame.cpuSubmissionStartMicroseconds,
);
const gpuValues = frames.map((frame) => frame.gpuElapsedMicroseconds);
const worstOnePercentCount = Math.max(1, Math.ceil(intervals.length * 0.01));
const worstOnePercentIntervals = [...intervals]
	.sort((left, right) => right - left)
	.slice(0, worstOnePercentCount);
const expectedPresentationSlotCount =
	Math.floor(frames.at(-1).animationCallbackMicroseconds / FRAME_BUDGET_MICROSECONDS) + 1;
const summary = result.summary;
fail(summary.expectedPresentationSlotCount === expectedPresentationSlotCount, 'S9.3 presentation-slot total changed.');
fail(summary.missedPresentationSlots === expectedPresentationSlotCount - frames.length, 'S9.3 missed-slot count changed.');
fail(summary.longestVisibleHoldMicroseconds === Math.max(...intervals), 'S9.3 longest hold changed.');
fail(
	closeTo(
		summary.meanFramesPerSecond,
		((frames.length - 1) * 1_000_000) /
			(frames.at(-1).animationCallbackMicroseconds - frames[0].animationCallbackMicroseconds),
	),
	'S9.3 mean FPS changed.',
);
fail(
	closeTo(summary.onePercentLowFramesPerSecond, 1_000_000 / mean(worstOnePercentIntervals)),
	'S9.3 one-percent-low FPS changed.',
);
fail(closeTo(summary.callbackCadence.meanIntervalMicroseconds, mean(intervals)), 'S9.3 mean cadence changed.');
fail(summary.callbackCadence.medianIntervalMicroseconds === percentile(intervals, 0.5), 'S9.3 median cadence changed.');
fail(summary.callbackCadence.p95IntervalMicroseconds === percentile(intervals, 0.95), 'S9.3 p95 cadence changed.');
fail(summary.callbackCadence.p99IntervalMicroseconds === percentile(intervals, 0.99), 'S9.3 p99 cadence changed.');
fail(closeTo(summary.cpuSubmission.meanMicroseconds, mean(cpuValues)), 'S9.3 CPU mean changed.');
fail(closeTo(summary.gpuTimer.meanMicroseconds, mean(gpuValues)), 'S9.3 GPU mean changed.');
fail(summary.gpuTimer.medianMicroseconds === percentile(gpuValues, 0.5), 'S9.3 GPU median changed.');
fail(summary.gpuTimer.p95Microseconds === percentile(gpuValues, 0.95), 'S9.3 GPU p95 changed.');
fail(summary.gpuTimer.maximumMicroseconds === Math.max(...gpuValues), 'S9.3 GPU maximum changed.');
fail(
	summary.gpuTimer.completeFraction === 1 &&
		summary.gpuTimer.outcomeCounts.complete === frames.length &&
		summary.gpuTimer.drain.pendingQueryCount === 0,
	'S9.3 GPU query closure changed.',
);
const lateFrames = intervals.filter((interval) => interval > FRAME_BUDGET_MICROSECONDS * 1.5);
fail(summary.lateFrameCount === lateFrames.length && summary.hitches.length === lateFrames.length, 'S9.3 hitch count changed.');
fail(summary.skippedCacheDegreeFrameCount === 0, 'S9.3 skipped cache degrees changed.');
fail(
	summary.cacheTransitionCount === frames.filter((frame) => frame.cacheEvents.length > 0).length,
	'S9.3 cache-transition count changed.',
);

fail(
	result.browser.drawingBuffer.width === 3840 &&
		result.browser.drawingBuffer.height === 2160 &&
		result.browser.timerExtension === 'EXT_disjoint_timer_query_webgl2' &&
		result.browser.timerMaximumPendingQueries.production === 4 &&
		result.browser.timerMaximumPendingQueries.traceInstrumentation === 32 &&
		result.browser.webglError === 0 &&
		result.browser.contextLost === false,
	'S9.3 browser boundary changed.',
);
fail(
	result.browser.shaderHook.assetsInstalled === true &&
		result.browser.shaderHook.transformErrors.length === 0 &&
		result.browser.shaderHook.boundDraws > 0,
	'S9.3 shader integration changed.',
);

for (const source of Object.values(provenance.sourceIdentities)) {
	const bytes = await readFile(path.join(repositoryRoot, ...source.path.split('/')));
	fail(sha256(bytes) === source.sha256, `S9.3 source identity changed: ${source.path}`);
}
const parent = provenance.parents.s92SharedPacketRenderer;
const parentBytes = await readFile(path.join(repositoryRoot, ...parent.path.split('/')));
fail(
	parentBytes.byteLength === parent.byteLength && sha256(parentBytes) === parent.sha256,
	'S9.3 S9.2 parent identity changed.',
);

process.stdout.write(
	`${JSON.stringify(
		{
			runId,
			accepted: true,
			artifactSetSha256: manifest.artifactSetSha256,
			frameCount: frames.length,
			meanFramesPerSecond: summary.meanFramesPerSecond,
			onePercentLowFramesPerSecond: summary.onePercentLowFramesPerSecond,
			meanGpuMilliseconds: summary.gpuTimer.meanMicroseconds / 1000,
			meanCpuSubmissionMilliseconds: summary.cpuSubmission.meanMicroseconds / 1000,
			missedPresentationSlots: summary.missedPresentationSlots,
			longestVisibleHoldMilliseconds: summary.longestVisibleHoldMicroseconds / 1000,
			cacheTransitionComparison: summary.cacheTransitionComparison,
		},
		null,
		2,
	)}\n`,
);
