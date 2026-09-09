#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const DEFAULT_RUN_ID = '1788919958694-s9-presentation-replay';
const CONTROL_RELATIVE_PATH =
	'experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json';
const OUTPUT_FRAME_COUNT = 1200;
const OUTPUT_FPS = 60;
const EXPECTED_PARENTS = Object.freeze([
	Object.freeze({
		id: 'fov78',
		fovDegrees: 78,
		runId: '1788918482263-s9-animation-trace',
		result: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788918482263-s9-animation-trace/result.json',
			byteLength: 175_520,
			sha256: 'cae0c4a85f94e494ffb2cd9668fccd791f51ecd80d091062b6779758104ce6bc',
		}),
		trace: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788918482263-s9-animation-trace/trace.jsonl',
			byteLength: 431_926,
			sha256: '45962ebe7ae821cecc54f04f9383fe02fa012815bed0aade06ce0b34389a6579',
		}),
	}),
	Object.freeze({
		id: 'fov55',
		fovDegrees: 55,
		runId: '1788919164368-s9-animation-trace-fov55',
		result: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919164368-s9-animation-trace-fov55/result.json',
			byteLength: 179_921,
			sha256: 'e093515fb30186b95952c868bcfc64151b71fd8fda65a92b894af26c5cf8eb96',
		}),
		trace: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919164368-s9-animation-trace-fov55/trace.jsonl',
			byteLength: 449_101,
			sha256: 'dabc69596ccee619eb8b4488eed2038d6f7fd6b18cf31d9fb75c8d05f0635685',
		}),
	}),
]);

const fail = (value, message) => {
	if (!value) throw new Error(message);
	return value;
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const isWithin = (root, target) => {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

async function requireContainedFile(root, relativePath, label) {
	fail(
		typeof relativePath === 'string' &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe ${label} path.`,
	);
	const expected = path.join(root, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(
		isWithin(root, actual) &&
			information.isFile() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} escaped or crossed a reparse boundary.`,
	);
	return actual;
}

async function collectArtifacts(root, relative = '') {
	const entries = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `S9.4 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `S9.4 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

const parseJsonLines = (bytes, label) => {
	const text = bytes.toString('utf8');
	fail(text.endsWith('\n'), `${label} lacks its terminal newline.`);
	return text
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
};

function expectedIdealEntry(slotIndex, fovDegrees) {
	const scenarioProgress = slotIndex / (OUTPUT_FRAME_COUNT - 1);
	const solarZenithDegrees = 90 - 60 * Math.sin(Math.PI * scenarioProgress);
	const solarAzimuthDegrees = 90 + 180 * scenarioProgress;
	const zenithRadians = (solarZenithDegrees * Math.PI) / 180;
	const azimuthRadians = (solarAzimuthDegrees * Math.PI) / 180;
	const directionToSunUpEastNorth = [
		Math.cos(zenithRadians),
		Math.sin(zenithRadians) * Math.sin(azimuthRadians),
		Math.sin(zenithRadians) * Math.cos(azimuthRadians),
	];
	return {
		slotIndex,
		timestampMicroseconds: Math.round((slotIndex * 1_000_000) / OUTPUT_FPS),
		mappingKind: 'ideal-equation',
		mappingEquationId: 's9-ideal-progress-slot-index-over-1199-v1',
		sourceFrameId: null,
		heldFromPreviousSlot: false,
		state: {
			scenarioProgress,
			solarZenithDegrees,
			solarAzimuthDegrees,
			directionToSunUpEastNorth,
			cameraTargetUpEastNorth: [...directionToSunUpEastNorth],
			cacheSceneDegrees: Math.max(30, Math.min(90, Math.floor(solarZenithDegrees + 0.5))),
			qualityIntervalCount: 10,
			cameraVerticalFieldOfViewDegrees: fovDegrees,
		},
	};
}

function expectedTraceEntries(frames, parent) {
	let latestIndex = 0;
	let previousFrameId = null;
	return Array.from({length: OUTPUT_FRAME_COUNT}, (_, slotIndex) => {
		const timestampMicroseconds = Math.round((slotIndex * 1_000_000) / OUTPUT_FPS);
		while (
			latestIndex + 1 < frames.length &&
			frames[latestIndex + 1].animationCallbackMicroseconds <= timestampMicroseconds
		) {
			latestIndex += 1;
		}
		const frame = frames[latestIndex];
		const entry = {
			slotIndex,
			timestampMicroseconds,
			mappingKind: 'trace-latest-frame-at-or-before-slot',
			mappingEquationId: 's9-trace-latest-callback-not-after-slot-v1',
			sourceTrace: {runId: parent.runId, path: parent.trace.path, sha256: parent.trace.sha256},
			sourceFrameId: frame.frameId,
			sourceAnimationCallbackMicroseconds: frame.animationCallbackMicroseconds,
			heldFromPreviousSlot: previousFrameId === frame.frameId,
			measuredFrameAdvance: previousFrameId === null ? 0 : frame.frameId - previousFrameId,
			state: {
				scenarioProgress: frame.scenarioProgress,
				solarZenithDegrees: frame.solarZenithDegrees,
				solarAzimuthDegrees: frame.solarAzimuthDegrees,
				directionToSunUpEastNorth: [...frame.directionToSunUpEastNorth],
				cameraTargetUpEastNorth: [...frame.cameraTargetUpEastNorth],
				cacheSceneDegrees: frame.cacheSceneDegrees,
				qualityIntervalCount: frame.qualityIntervalCount,
				cameraVerticalFieldOfViewDegrees: parent.fovDegrees,
			},
		};
		previousFrameId = frame.frameId;
		return entry;
	});
}

function expectedTraceSummary(mapping, measuredFrameCount) {
	const sourceRuns = [];
	for (const entry of mapping) {
		const current = sourceRuns.at(-1);
		if (current?.sourceFrameId === entry.sourceFrameId) current.slotCount += 1;
		else sourceRuns.push({sourceFrameId: entry.sourceFrameId, slotCount: 1});
	}
	const uniqueSourceFrameCount = new Set(mapping.map((entry) => entry.sourceFrameId)).size;
	const maximumConsecutiveSourceSlots = Math.max(...sourceRuns.map((run) => run.slotCount));
	return {
		slotCount: mapping.length,
		uniqueSourceFrameCount,
		unusedMeasuredFrameCount: measuredFrameCount - uniqueSourceFrameCount,
		heldSlotCount: mapping.filter((entry) => entry.heldFromPreviousSlot).length,
		sourceAdvanceCount: mapping.filter((entry) => entry.measuredFrameAdvance > 0).length,
		maximumMeasuredFrameAdvance: Math.max(...mapping.map((entry) => entry.measuredFrameAdvance)),
		maximumConsecutiveSourceSlots,
		longestMappedVisibleHoldMicroseconds: Math.round(
			(maximumConsecutiveSourceSlots * 1_000_000) / OUTPUT_FPS,
		),
		firstSourceFrameId: mapping[0].sourceFrameId,
		lastSourceFrameId: mapping.at(-1).sourceFrameId,
		lastSourceAnimationCallbackMicroseconds: mapping.at(-1).sourceAnimationCallbackMicroseconds,
	};
}

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^[0-9]+-s9-presentation-replay$/u.test(runId), 'Invalid S9.4 run id.');
const expectedRunRoot = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRunRoot);
fail(
	runRoot.toLowerCase() === expectedRunRoot.toLowerCase() && isWithin(outputRoot, runRoot),
	'S9.4 run escaped its output root.',
);
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S9.4 run root is a symlink.');

const [resultBytes, summaryBytes, manifestBytes, progressBytes, provenanceBytes, inputsBytes, controlBytes] =
	await Promise.all([
		readFile(path.join(runRoot, 'result.json')),
		readFile(path.join(runRoot, 'summary.json')),
		readFile(path.join(runRoot, 'artifact-manifest.json')),
		readFile(path.join(runRoot, 'progress.jsonl')),
		readFile(path.join(runRoot, 'provenance.json')),
		readFile(path.join(runRoot, 'inputs.json')),
		readFile(await requireContainedFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control')),
	]);
const result = JSON.parse(resultBytes);
const summary = JSON.parse(summaryBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
const inputs = JSON.parse(inputsBytes);
const control = JSON.parse(controlBytes);

fail(result.schemaId === 'gpu-resident-shared-block-cache-s9-presentation-replay-result-v1', 'Unexpected S9.4 result schema.');
fail(result.runId === runId && result.accepted === true, 'S9.4 result is not accepted.');
fail(summary.schemaId === 'gpu-resident-shared-block-cache-s9-replay-summary-v1', 'Unexpected S9.4 summary schema.');
fail(manifest.schemaId === 'gpu-resident-shared-block-cache-s9-replay-artifact-manifest-v1', 'Unexpected S9.4 manifest schema.');
fail(provenance.schemaId === 'gpu-resident-shared-block-cache-s9-replay-provenance-v1', 'Unexpected S9.4 provenance schema.');
fail(inputs.schemaId === 'gpu-resident-shared-block-cache-s9-replay-input-v1', 'Unexpected S9.4 input schema.');
fail(control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1', 'Unexpected S9 control schema.');
fail(
	JSON.stringify(result.output) === JSON.stringify(summary.output) &&
		JSON.stringify(result.variants) === JSON.stringify(summary.variants),
	'S9.4 result and retained summary diverged.',
);
fail(
	summary.output.width === 3840 &&
		summary.output.height === 2160 &&
		summary.output.framesPerSecond === OUTPUT_FPS &&
		summary.output.frameCount === OUTPUT_FRAME_COUNT &&
		summary.output.durationMicroseconds === 20_000_000 &&
		summary.output.lastSlotTimestampMicroseconds === 19_983_333,
	'S9.4 output contract changed.',
);
fail(
	control.replay.slotTimestampMicroseconds === 'round(slotIndex * 1000000 / 60)' &&
		control.replay.idealStateProgress === 'slotIndex / 1199' &&
		control.replay.traceMapping.includes('never interpolate'),
	'S9.4 mapping equations changed.',
);
fail(JSON.stringify(inputs.traceParents) === JSON.stringify(EXPECTED_PARENTS), 'S9.4 input parents changed.');
fail(JSON.stringify(provenance.parents) === JSON.stringify(EXPECTED_PARENTS), 'S9.4 provenance parents changed.');
fail(
	inputs.control.path === CONTROL_RELATIVE_PATH &&
		inputs.control.byteLength === controlBytes.byteLength &&
		inputs.control.sha256 === sha256(controlBytes),
	'S9.4 control identity changed.',
);

const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S9.4 artifact identities changed.');
fail(sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256, 'S9.4 artifact-set identity changed.');
fail(
	artifacts.every((artifact) => !/\.(png|jpe?g|webm|mp4|mkv|mov)$/iu.test(artifact.path)),
	'S9.4 mapping evidence unexpectedly contains image or video artifacts.',
);
const terminalEvents = parseJsonLines(progressBytes, 'S9.4 progress').filter((event) => event.state);
fail(terminalEvents.length === 1 && terminalEvents[0].state === 'accepted', 'S9.4 terminal state is not uniquely accepted.');

const verificationResults = [];
fail(summary.variants.length === EXPECTED_PARENTS.length, 'S9.4 variant count changed.');
for (const parent of EXPECTED_PARENTS) {
	const variant = fail(summary.variants.find((candidate) => candidate.id === parent.id), `Missing ${parent.id} variant.`);
	fail(
		variant.fovDegrees === parent.fovDegrees &&
			JSON.stringify(variant.parent) ===
				JSON.stringify({runId: parent.runId, result: parent.result, trace: parent.trace}),
		`${parent.id} identity changed.`,
	);
	const [parentResultBytes, parentTraceBytes, idealBytes, traceMappingBytes] = await Promise.all([
		readFile(await requireContainedFile(repositoryRoot, parent.result.path, `${parent.id} result`)),
		readFile(await requireContainedFile(repositoryRoot, parent.trace.path, `${parent.id} trace`)),
		readFile(await requireContainedFile(runRoot, variant.ideal.path, `${parent.id} ideal mapping`)),
		readFile(await requireContainedFile(runRoot, variant.trace.path, `${parent.id} trace mapping`)),
	]);
	fail(
		parentResultBytes.byteLength === parent.result.byteLength && sha256(parentResultBytes) === parent.result.sha256,
		`${parent.id} parent result identity changed.`,
	);
	fail(
		parentTraceBytes.byteLength === parent.trace.byteLength && sha256(parentTraceBytes) === parent.trace.sha256,
		`${parent.id} parent trace identity changed.`,
	);
	const parentResult = JSON.parse(parentResultBytes);
	fail(
		parentResult.accepted === true &&
			parentResult.runId === parent.runId &&
			parentResult.configuration.cameraVerticalFieldOfViewDegrees === parent.fovDegrees,
		`${parent.id} parent qualification changed.`,
	);
	const measuredFrames = parseJsonLines(parentTraceBytes, `${parent.id} parent trace`);
	fail(
		measuredFrames[0].frameId === 0 && measuredFrames[0].animationCallbackMicroseconds === 0,
		`${parent.id} parent trace lacks frame zero.`,
	);
	for (const [frameIndex, frame] of measuredFrames.entries()) {
		fail(frame.frameId === frameIndex, `${parent.id} parent frame ordering changed.`);
		if (frameIndex > 0) {
			fail(
				frame.animationCallbackMicroseconds > measuredFrames[frameIndex - 1].animationCallbackMicroseconds,
				`${parent.id} parent callback ordering changed.`,
			);
		}
	}
	const idealEntries = parseJsonLines(idealBytes, `${parent.id} ideal mapping`);
	const traceEntries = parseJsonLines(traceMappingBytes, `${parent.id} trace mapping`);
	const expectedIdealEntries = Array.from({length: OUTPUT_FRAME_COUNT}, (_, slotIndex) =>
		expectedIdealEntry(slotIndex, parent.fovDegrees),
	);
	const expectedMappedEntries = expectedTraceEntries(measuredFrames, parent);
	fail(
		JSON.stringify(idealEntries) === JSON.stringify(expectedIdealEntries),
		`${parent.id} ideal mapping does not reproduce the frozen equation.`,
	);
	fail(
		JSON.stringify(traceEntries) === JSON.stringify(expectedMappedEntries),
		`${parent.id} trace mapping is not latest-frame-at-or-before-slot exact.`,
	);
	fail(
		variant.ideal.slotCount === OUTPUT_FRAME_COUNT &&
			variant.ideal.byteLength === idealBytes.byteLength &&
			variant.ideal.sha256 === sha256(idealBytes),
		`${parent.id} ideal artifact identity changed.`,
	);
	const expectedSummary = expectedTraceSummary(expectedMappedEntries, measuredFrames.length);
	for (const [key, expectedValue] of Object.entries(expectedSummary)) {
		fail(variant.trace[key] === expectedValue, `${parent.id} trace summary changed at ${key}.`);
	}
	fail(
		variant.trace.byteLength === traceMappingBytes.byteLength && variant.trace.sha256 === sha256(traceMappingBytes),
		`${parent.id} trace mapping identity changed.`,
	);
	fail(
		traceEntries.every(
			(entry, slotIndex) =>
				entry.sourceAnimationCallbackMicroseconds <= entry.timestampMicroseconds &&
				(slotIndex === 0 ||
					entry.sourceFrameId === traceEntries[slotIndex - 1].sourceFrameId ||
					entry.sourceFrameId > traceEntries[slotIndex - 1].sourceFrameId),
		),
		`${parent.id} mapping concealed or reversed a measured jump.`,
	);
	verificationResults.push({
		id: parent.id,
		fovDegrees: parent.fovDegrees,
		measuredFrameCount: measuredFrames.length,
		mappedUniqueSourceFrameCount: expectedSummary.uniqueSourceFrameCount,
		heldSlotCount: expectedSummary.heldSlotCount,
		maximumConsecutiveSourceSlots: expectedSummary.maximumConsecutiveSourceSlots,
		longestMappedVisibleHoldMilliseconds: expectedSummary.longestMappedVisibleHoldMicroseconds / 1000,
		maximumMeasuredFrameAdvance: expectedSummary.maximumMeasuredFrameAdvance,
	});
}

for (const source of Object.values(provenance.sourceIdentities)) {
	const bytes = await readFile(await requireContainedFile(repositoryRoot, source.path, 'S9.4 source'));
	fail(sha256(bytes) === source.sha256, `S9.4 source identity changed: ${source.path}`);
}

process.stdout.write(
	`${JSON.stringify(
		{
			runId,
			accepted: true,
			artifactSetSha256: manifest.artifactSetSha256,
			output: summary.output,
			variants: verificationResults,
		},
		null,
		2,
	)}\n`,
);
