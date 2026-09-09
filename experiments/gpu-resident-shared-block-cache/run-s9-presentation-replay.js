#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const CONTROL_RELATIVE_PATH =
	'experiments/gpu-resident-shared-block-cache/controls/s9-trace-driven-animation-contract.json';
const RUN_SLUG = 's9-presentation-replay';
const OUTPUT_FRAME_COUNT = 1200;
const OUTPUT_FPS = 60;
const DURATION_MICROSECONDS = 20_000_000;
const TRACE_PARENTS = Object.freeze([
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

async function requireRealDirectory(absolutePath, label) {
	const expected = path.resolve(absolutePath);
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(
		information.isDirectory() &&
			!information.isSymbolicLink() &&
			actual.toLowerCase() === expected.toLowerCase(),
		`${label} must be a real directory without a reparse boundary.`,
	);
	return actual;
}

async function requireContainedFile(root, relativePath, label) {
	fail(
		typeof relativePath === 'string' &&
			!path.isAbsolute(relativePath) &&
			!relativePath.includes('\\') &&
			relativePath.split('/').every((segment) => segment && segment !== '.' && segment !== '..'),
		`Unsafe ${label} path.`,
	);
	const rootReal = await requireRealDirectory(root, `${label} root`);
	const expected = path.join(rootReal, ...relativePath.split('/'));
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(
		isWithin(rootReal, actual) &&
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
		fail(!information.isSymbolicLink(), `Unexpected S9.4 symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Unexpected S9.4 run entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

function idealState(slotIndex, fovDegrees) {
	const progress = slotIndex / (OUTPUT_FRAME_COUNT - 1);
	const solarZenithDegrees = 90 - 60 * Math.sin(Math.PI * progress);
	const solarAzimuthDegrees = 90 + 180 * progress;
	const zenith = (solarZenithDegrees * Math.PI) / 180;
	const azimuth = (solarAzimuthDegrees * Math.PI) / 180;
	const directionToSunUpEastNorth = [
		Math.cos(zenith),
		Math.sin(zenith) * Math.sin(azimuth),
		Math.sin(zenith) * Math.cos(azimuth),
	];
	return {
		scenarioProgress: progress,
		solarZenithDegrees,
		solarAzimuthDegrees,
		directionToSunUpEastNorth,
		cameraTargetUpEastNorth: [...directionToSunUpEastNorth],
		cacheSceneDegrees: Math.max(30, Math.min(90, Math.floor(solarZenithDegrees + 0.5))),
		qualityIntervalCount: 10,
		cameraVerticalFieldOfViewDegrees: fovDegrees,
	};
}

function createIdealMapping(fovDegrees) {
	return Array.from({length: OUTPUT_FRAME_COUNT}, (_, slotIndex) => ({
		slotIndex,
		timestampMicroseconds: Math.round((slotIndex * 1_000_000) / OUTPUT_FPS),
		mappingKind: 'ideal-equation',
		mappingEquationId: 's9-ideal-progress-slot-index-over-1199-v1',
		sourceFrameId: null,
		heldFromPreviousSlot: false,
		state: idealState(slotIndex, fovDegrees),
	}));
}

function traceState(frame, fovDegrees) {
	return {
		scenarioProgress: frame.scenarioProgress,
		solarZenithDegrees: frame.solarZenithDegrees,
		solarAzimuthDegrees: frame.solarAzimuthDegrees,
		directionToSunUpEastNorth: [...frame.directionToSunUpEastNorth],
		cameraTargetUpEastNorth: [...frame.cameraTargetUpEastNorth],
		cacheSceneDegrees: frame.cacheSceneDegrees,
		qualityIntervalCount: frame.qualityIntervalCount,
		cameraVerticalFieldOfViewDegrees: fovDegrees,
	};
}

function createTraceMapping(frames, parent) {
	fail(frames[0]?.frameId === 0 && frames[0]?.animationCallbackMicroseconds === 0, `${parent.id} trace lacks frame zero.`);
	let sourceIndex = 0;
	let previousSourceFrameId = null;
	return Array.from({length: OUTPUT_FRAME_COUNT}, (_, slotIndex) => {
		const timestampMicroseconds = Math.round((slotIndex * 1_000_000) / OUTPUT_FPS);
		while (
			sourceIndex + 1 < frames.length &&
			frames[sourceIndex + 1].animationCallbackMicroseconds <= timestampMicroseconds
		) {
			sourceIndex += 1;
		}
		const frame = frames[sourceIndex];
		const entry = {
			slotIndex,
			timestampMicroseconds,
			mappingKind: 'trace-latest-frame-at-or-before-slot',
			mappingEquationId: 's9-trace-latest-callback-not-after-slot-v1',
			sourceTrace: {runId: parent.runId, path: parent.trace.path, sha256: parent.trace.sha256},
			sourceFrameId: frame.frameId,
			sourceAnimationCallbackMicroseconds: frame.animationCallbackMicroseconds,
			heldFromPreviousSlot: previousSourceFrameId === frame.frameId,
			measuredFrameAdvance: previousSourceFrameId === null ? 0 : frame.frameId - previousSourceFrameId,
			state: traceState(frame, parent.fovDegrees),
		};
		previousSourceFrameId = frame.frameId;
		return entry;
	});
}

function summarizeTraceMapping(mapping, measuredFrameCount) {
	const runs = [];
	for (const entry of mapping) {
		const active = runs.at(-1);
		if (active?.sourceFrameId === entry.sourceFrameId) active.slotCount += 1;
		else runs.push({sourceFrameId: entry.sourceFrameId, firstSlotIndex: entry.slotIndex, slotCount: 1});
	}
	const sourceFrameIds = new Set(mapping.map((entry) => entry.sourceFrameId));
	return {
		slotCount: mapping.length,
		uniqueSourceFrameCount: sourceFrameIds.size,
		unusedMeasuredFrameCount: measuredFrameCount - sourceFrameIds.size,
		heldSlotCount: mapping.filter((entry) => entry.heldFromPreviousSlot).length,
		sourceAdvanceCount: mapping.filter((entry) => entry.measuredFrameAdvance > 0).length,
		maximumMeasuredFrameAdvance: Math.max(...mapping.map((entry) => entry.measuredFrameAdvance)),
		maximumConsecutiveSourceSlots: Math.max(...runs.map((run) => run.slotCount)),
		longestMappedVisibleHoldMicroseconds: Math.round(
			(Math.max(...runs.map((run) => run.slotCount)) * 1_000_000) / OUTPUT_FPS,
		),
		firstSourceFrameId: mapping[0].sourceFrameId,
		lastSourceFrameId: mapping.at(-1).sourceFrameId,
		lastSourceAnimationCallbackMicroseconds: mapping.at(-1).sourceAnimationCallbackMicroseconds,
	};
}

const serializeJsonLines = (entries) => Buffer.from(`${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`);

async function main() {
	const repositoryRoot = await requireRealDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await requireRealDirectory(SOURCE_ROOT, 'Experiment source root');
	fail(isWithin(repositoryRoot, sourceRoot), 'Experiment source root escaped the repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await requireRealDirectory(OUTPUT_ROOT, 'Experiment output root');
	fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
	await mkdir(path.join(outputRoot, 'runs'), {recursive: true});
	const runsRoot = await requireRealDirectory(path.join(outputRoot, 'runs'), 'Experiment runs root');
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(runsRoot, runId);
	await mkdir(runDirectory);
	await mkdir(path.join(runDirectory, 'mappings'));
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	const progress = async (phase, message, count, state) => {
		await appendFile(
			progressPath,
			`${JSON.stringify({
				timestamp: new Date().toISOString(),
				phase,
				...(count ? {completed: count.completed, total: count.total} : {}),
				message,
				...(state ? {state} : {}),
			})}\n`,
			'utf8',
		);
	};
	try {
		await progress('initialize', 'Initializing deterministic dual-FOV S9.4 replay mapping.');
		const controlPath = await requireContainedFile(repositoryRoot, CONTROL_RELATIVE_PATH, 'S9 control');
		const controlBytes = await readFile(controlPath);
		const control = JSON.parse(controlBytes);
		fail(control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1', 'S9 control changed.');
		fail(
			control.replay.outputWidth === 3840 &&
				control.replay.outputHeight === 2160 &&
				control.replay.outputFramesPerSecond === OUTPUT_FPS &&
				control.replay.outputFrameCount === OUTPUT_FRAME_COUNT &&
				control.replay.outputDurationMicroseconds === DURATION_MICROSECONDS,
			'S9.4 replay control changed.',
		);
		await Promise.all([
			writeFile(
				path.join(runDirectory, 'command.txt'),
				'node experiments/gpu-resident-shared-block-cache/run-s9-presentation-replay.js\n',
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'inputs.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-replay-input-v1',
						control: {path: CONTROL_RELATIVE_PATH, byteLength: controlBytes.byteLength, sha256: sha256(controlBytes)},
						traceParents: TRACE_PARENTS,
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			),
			writeFile(
				path.join(runDirectory, 'environment.json'),
				`${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length}, null, 2)}\n`,
				{flag: 'wx'},
			),
		]);

		const variants = [];
		for (const [index, parent] of TRACE_PARENTS.entries()) {
			await progress('mapping', `Authenticating and mapping ${parent.id}.`, {
				completed: index,
				total: TRACE_PARENTS.length,
			});
			const [resultBytes, traceBytes] = await Promise.all([
				readFile(await requireContainedFile(repositoryRoot, parent.result.path, `${parent.id} result`)),
				readFile(await requireContainedFile(repositoryRoot, parent.trace.path, `${parent.id} trace`)),
			]);
			fail(
				resultBytes.byteLength === parent.result.byteLength && sha256(resultBytes) === parent.result.sha256,
				`${parent.id} result identity changed.`,
			);
			fail(
				traceBytes.byteLength === parent.trace.byteLength && sha256(traceBytes) === parent.trace.sha256,
				`${parent.id} trace identity changed.`,
			);
			const result = JSON.parse(resultBytes);
			fail(
				result.accepted === true &&
					result.runId === parent.runId &&
					result.configuration.cameraVerticalFieldOfViewDegrees === parent.fovDegrees,
				`${parent.id} accepted result facts changed.`,
			);
			const frames = traceBytes
				.toString('utf8')
				.trim()
				.split('\n')
				.map((line) => JSON.parse(line));
			const ideal = createIdealMapping(parent.fovDegrees);
			const trace = createTraceMapping(frames, parent);
			const repeatedIdealBytes = serializeJsonLines(createIdealMapping(parent.fovDegrees));
			const repeatedTraceBytes = serializeJsonLines(createTraceMapping(frames, parent));
			const idealBytes = serializeJsonLines(ideal);
			const mappedTraceBytes = serializeJsonLines(trace);
			fail(idealBytes.equals(repeatedIdealBytes), `${parent.id} ideal mapping is nondeterministic.`);
			fail(mappedTraceBytes.equals(repeatedTraceBytes), `${parent.id} trace mapping is nondeterministic.`);
			const idealPath = `mappings/${parent.id}-ideal.jsonl`;
			const tracePath = `mappings/${parent.id}-trace.jsonl`;
			await Promise.all([
				writeFile(path.join(runDirectory, ...idealPath.split('/')), idealBytes, {flag: 'wx'}),
				writeFile(path.join(runDirectory, ...tracePath.split('/')), mappedTraceBytes, {flag: 'wx'}),
			]);
			variants.push({
				id: parent.id,
				fovDegrees: parent.fovDegrees,
				parent: {runId: parent.runId, result: parent.result, trace: parent.trace},
				ideal: {path: idealPath, byteLength: idealBytes.byteLength, sha256: sha256(idealBytes), slotCount: ideal.length},
				trace: {
					path: tracePath,
					byteLength: mappedTraceBytes.byteLength,
					sha256: sha256(mappedTraceBytes),
					...summarizeTraceMapping(trace, frames.length),
				},
			});
			await progress('mapping', `Completed deterministic ${parent.id} mappings.`, {
				completed: index + 1,
				total: TRACE_PARENTS.length,
			});
		}

		const summary = {
			schemaId: 'gpu-resident-shared-block-cache-s9-replay-summary-v1',
			output: {
				width: control.replay.outputWidth,
				height: control.replay.outputHeight,
				framesPerSecond: OUTPUT_FPS,
				frameCount: OUTPUT_FRAME_COUNT,
				durationMicroseconds: DURATION_MICROSECONDS,
				lastSlotTimestampMicroseconds: Math.round(((OUTPUT_FRAME_COUNT - 1) * 1_000_000) / OUTPUT_FPS),
			},
			variants,
		};
		await writeFile(path.join(runDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, {
			flag: 'wx',
		});
		const result = {
			...summary,
			schemaId: 'gpu-resident-shared-block-cache-s9-presentation-replay-result-v1',
			runId,
			accepted: true,
			claimBoundary:
				'Deterministic dual-FOV replay mappings only. No frame rendering, interpolation, encoding, or performance measurement occurs in S9.4.',
		};
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {
			flag: 'wx',
		});
		await writeFile(
			path.join(runDirectory, 'provenance.json'),
			`${JSON.stringify(
				{
					schemaId: 'gpu-resident-shared-block-cache-s9-replay-provenance-v1',
					operation:
						'Authenticate the accepted 78-degree and 55-degree S9.3 traces; map each onto 1,200 rounded 60 Hz timestamps using the latest measured callback not after each slot; construct an independent ideal state at slotIndex/1199; retain every source identity and mapping hash.',
					parents: TRACE_PARENTS,
					sourceIdentities: {
						runner: {
							path: 'experiments/gpu-resident-shared-block-cache/run-s9-presentation-replay.js',
							sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
						},
						control: {path: CONTROL_RELATIVE_PATH, sha256: sha256(controlBytes)},
					},
				},
				null,
				2,
			)}\n`,
			{flag: 'wx'},
		);
		await progress('terminal', 'Accepted deterministic dual-FOV S9.4 replay mappings.', undefined, 'accepted');
		const artifacts = await collectArtifacts(runDirectory);
		await writeFile(
			path.join(runDirectory, 'artifact-manifest.json'),
			`${JSON.stringify(
				{
					schemaId: 'gpu-resident-shared-block-cache-s9-replay-artifact-manifest-v1',
					artifacts,
					artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))),
				},
				null,
				2,
			)}\n`,
			{flag: 'wx'},
		);
		process.stdout.write(`${JSON.stringify({runId, runDirectory, accepted: true, artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))), summary}, null, 2)}\n`);
	} catch (error) {
		try {
			await writeFile(
				path.join(runDirectory, 'result.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-presentation-replay-result-v1',
						runId,
						accepted: false,
						error: {
							name: error instanceof Error ? error.name : 'Error',
							message: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
						},
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			);
		} catch {
			// Preserve any result already published before a later failure.
		}
		await progress(
			'terminal',
			`S9.4 failed: ${error instanceof Error ? error.message : String(error)}`,
			undefined,
			'failed',
		).catch(() => undefined);
		try {
			const artifacts = await collectArtifacts(runDirectory);
			await writeFile(
				path.join(runDirectory, 'artifact-manifest.json'),
				`${JSON.stringify(
					{
						schemaId: 'gpu-resident-shared-block-cache-s9-replay-artifact-manifest-v1',
						artifacts,
						artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts))),
					},
					null,
					2,
				)}\n`,
				{flag: 'wx'},
			);
		} catch {
			// The primary failure remains authoritative.
		}
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
