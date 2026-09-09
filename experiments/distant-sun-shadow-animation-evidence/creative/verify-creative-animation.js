#!/usr/bin/env node

import {appendFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import puppeteer from 'puppeteer';

import {ArtifactManifest} from '../../../scripts/animation-evidence/ArtifactManifest.js';
import {CHROME_EXECUTABLE, REPOSITORY_ROOT} from '../consts.js';
import {CreativeArtifactWriter} from './node/CreativeArtifactWriter.js';
import {CreativeMp4Inspection} from './node/CreativeMp4Inspection.js';
import {CreativeRunFiles} from './node/CreativeRunFiles.js';

/**
 * Called by the verifier to parse one contained JSON record.
 *
 * @param {string} root - Validated directory containing the record.
 * @param {string} relativePath - Contained record path.
 * @returns {Promise<Record<string, unknown>>} - Parsed nonarray JSON object.
 */
async function readRecord(root, relativePath) {
	const snapshot = await CreativeRunFiles.readSnapshot(root, relativePath);
	const value = JSON.parse(Buffer.from(snapshot.bytes).toString('utf8'));
	if (!value || typeof value !== 'object' || Array.isArray(value))
		throw new Error(`Expected JSON object: ${relativePath}.`);
	return value;
}

/**
 * Called by the parent verifier to require an exact artifact identity present in the authenticated manifest.
 *
 * @param {CreativeNodeFileIdentity} identity - Identity referenced by a parent result.
 * @param {CreativeVerificationParentManifest} manifest - Validated complete parent manifest.
 * @returns {void} - Accepted exact manifest membership.
 */
function requireManifestIdentity(identity, manifest) {
	if (!identity || typeof identity !== 'object') throw new Error('Parent artifact identity is missing.');
	const retained = manifest.artifacts.find((candidate) => candidate.path === identity.path);
	if (!retained || retained.byteLength !== identity.byteLength || retained.sha256 !== identity.sha256) {
		throw new Error(`Parent result artifact differs from its manifest: ${identity.path}.`);
	}
}

/**
 * Called by verification to authenticate an accepted full-video parent and its scene trace.
 *
 * @param {string} repositoryRoot - Validated repository boundary.
 * @param {string} parentRunId - Exact immutable creative-animation parent identifier.
 * @returns {Promise<CreativeVerificationParent>} - Authenticated read-only parent and decoded checkpoint requests.
 */
async function inspectParent(repositoryRoot, parentRunId) {
	const directory = await CreativeRunFiles.requireRealPath(
		CreativeRunFiles.resolve(
			repositoryRoot,
			`tmp/experiments/distant-sun-shadow-animation-evidence/runs/${parentRunId}`,
		),
	);
	const manifest = /** @type {CreativeVerificationParentManifest} */ (
		await readRecord(directory, 'artifact-manifest.json')
	);
	const expectedExclusions = ['artifact-manifest.json', 'browser-profile', 'browser-temp'];
	if (
		manifest.schemaId !== 'distant-sun-creative-animation-artifact-manifest-v1' ||
		manifest.state !== 'accepted' ||
		manifest.runId !== parentRunId ||
		JSON.stringify(manifest.excludedPaths) !== JSON.stringify(expectedExclusions) ||
		!Array.isArray(manifest.artifacts) ||
		!/^[a-f0-9]{64}$/u.test(manifest.artifactSetSha256)
	) {
		throw new Error('Parent creative run is not a compatible accepted immutable artifact set.');
	}
	const artifactPaths = new Set();
	for (const artifact of manifest.artifacts) {
		if (
			!artifact ||
			!Number.isSafeInteger(artifact.byteLength) ||
			artifact.byteLength < 0 ||
			!/^[a-f0-9]{64}$/u.test(artifact.sha256) ||
			artifactPaths.has(artifact.path)
		) {
			throw new Error('Parent manifest contains an invalid or duplicate artifact identity.');
		}
		artifactPaths.add(artifact.path);
		await CreativeRunFiles.requireRealPath(CreativeRunFiles.resolve(directory, artifact.path));
	}
	await ArtifactManifest.verify(directory, manifest, expectedExclusions);
	const result = /** @type {CreativeVerificationParentResult} */ (await readRecord(directory, 'result.json'));
	if (
		result.schemaId !== 'distant-sun-creative-animation-result-v1' ||
		result.runId !== parentRunId ||
		result.state !== 'accepted' ||
		result.mode !== 'video' ||
		result.width !== 3840 ||
		result.height !== 2160 ||
		!Array.isArray(result.captures) ||
		result.captures.length < 3
	) {
		throw new Error('Parent must be an accepted native-4K full video with original lossless checkpoints.');
	}
	requireManifestIdentity(result.video, manifest);
	requireManifestIdentity(result.trace, manifest);
	if (result.video.path !== 'captures/creative-full-day.mp4' || result.trace.path !== 'scene-trace.json') {
		throw new Error('Parent video or trace path differs from the capture contract.');
	}
	const trace = /** @type {CreativeVerificationParentTrace} */ (await readRecord(directory, result.trace.path));
	if (
		trace.schemaId !== 'the-hours-scene-trace-v1' ||
		trace.framesPerSecond !== 30 ||
		trace.durationSeconds !== 60 ||
		trace.seed !== 3202609 ||
		!Array.isArray(trace.frames) ||
		trace.frames.length !== 1800
	) {
		throw new Error('Parent scene trace does not contain the complete deterministic sixty-second replay.');
	}
	let previousInstant = -Infinity;
	for (const [frameIndex, frame] of trace.frames.entries()) {
		const instant = Date.parse(frame.instant);
		if (
			!Number.isFinite(frame.animationSeconds) ||
			Math.abs(frame.animationSeconds - frameIndex / 30) > 0.000002 ||
			!Number.isFinite(instant) ||
			instant <= previousInstant
		) {
			throw new Error(`Parent replay trace timing is invalid at frame ${frameIndex}.`);
		}
		previousInstant = instant;
	}
	const metadata = await readRecord(directory, 'video-metadata.json');
	if (
		metadata.frameCount !== 1800 ||
		metadata.durationSeconds !== 60 ||
		metadata.byteLength !== result.video.byteLength
	) {
		throw new Error('Parent encoder metadata does not describe the complete video.');
	}
	const renderResult = await readRecord(directory, 'render-result.json');
	if (renderResult.webglError !== 0 || renderResult.contextLost !== false)
		throw new Error('Parent render retained a WebGL failure.');
	/** @type {CreativeVerificationCheckpoint[]} */
	const checkpoints = [];
	const seenFrames = new Set();
	for (const capture of result.captures) {
		requireManifestIdentity(capture, manifest);
		const match = /^captures\/the-hours-frame-(\d{4})\.png$/u.exec(capture.path);
		if (!match) throw new Error('Parent lossless capture lacks its exact presentation-frame identity.');
		const frameIndex = Number(match[1]);
		if (frameIndex >= 1800 || seenFrames.has(frameIndex))
			throw new Error('Parent capture frame index is invalid or duplicated.');
		seenFrames.add(frameIndex);
		const capturePath = await CreativeRunFiles.requireRealPath(CreativeRunFiles.resolve(directory, capture.path));
		checkpoints.push({frameIndex, sourceCapture: capture, sourceCaptureUrl: pathToFileURL(capturePath).href});
	}
	if (!seenFrames.has(0)) throw new Error('Parent must retain frame zero for native star preservation inspection.');
	if (!seenFrames.has(1799)) checkpoints.push({frameIndex: 1799});
	checkpoints.sort((left, right) => left.frameIndex - right.frameIndex);
	const videoPath = await CreativeRunFiles.requireRealPath(CreativeRunFiles.resolve(directory, result.video.path));
	return {
		directory,
		manifest,
		manifestIdentity: (await CreativeRunFiles.readSnapshot(directory, 'artifact-manifest.json')).identity,
		result,
		trace,
		videoPath,
		browserConfiguration: {videoUrl: pathToFileURL(videoPath).href, checkpoints},
	};
}

/**
 * Call this function to independently verify a full creative MP4 and publish decoded evidence in a new run.
 *
 * @returns {Promise<void>} - Closed verification manifest, with nonzero process status on failure.
 */
async function main() {
	if (process.argv.length === 3 && process.argv[2] === '--help') {
		process.stdout.write(
			'Usage: node experiments/distant-sun-shadow-animation-evidence/creative/verify-creative-animation.js <timestamp>-creative-animation\nThe accepted full-video parent is read-only. Decoded native-4K checkpoints and verification records are written to a new creative-video-verification run.\n',
		);
		return;
	}
	const parentRunId = process.argv[2];
	if (process.argv.length !== 3 || !/^[0-9]+-creative-animation$/u.test(parentRunId ?? '')) {
		throw new Error('Supply exactly one completed creative-animation run identifier.');
	}
	const repositoryRoot = await CreativeRunFiles.requireRealPath(REPOSITORY_ROOT);
	await CreativeRunFiles.readSnapshot(repositoryRoot, 'AGENTS.md');
	const runsRoot = await CreativeRunFiles.ensureDirectory(
		repositoryRoot,
		'tmp/experiments/distant-sun-shadow-animation-evidence/runs',
	);
	const runId = `${Date.now()}-creative-video-verification`;
	const runDirectory = CreativeRunFiles.resolve(runsRoot, runId);
	await mkdir(runDirectory);
	await CreativeRunFiles.requireRealPath(runDirectory);
	await CreativeRunFiles.ensureDirectory(runDirectory, 'captures');
	const browserProfile = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-profile');
	const browserTemporary = await CreativeRunFiles.ensureDirectory(runDirectory, 'browser-temp');
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	/** @type {CreativeNodeProgress} */
	let current = {phase: 'initialize', message: 'Initializing independent creative video verification.'};
	let progressTail = Promise.resolve();
	/** @type {unknown} */
	let progressFailure;
	/**
	 * Called by verification and browser inspection to append a flushed ordered progress event.
	 *
	 * @param {CreativeNodeProgress} event - Current countable verification activity.
	 * @param {CreativeNodeTerminalState} [state] - Terminal state when closing this run.
	 * @returns {Promise<void>} - Closed progress append.
	 */
	const progress = async (event, state) => {
		if (
			!event ||
			typeof event.phase !== 'string' ||
			typeof event.message !== 'string' ||
			event.phase.length > 80 ||
			event.message.length > 2000
		) {
			throw new Error('Verification progress payload is invalid.');
		}
		current = event;
		const line = {timestamp: new Date().toISOString(), ...event, ...(state ? {state} : {})};
		const append = progressTail.then(() => appendFile(progressPath, `${JSON.stringify(line)}\n`, 'utf8'));
		progressTail = append.catch((error) => {
			progressFailure = error;
		});
		await append;
		process.stdout.write(`${JSON.stringify(line)}\n`);
	};
	const heartbeat = setInterval(() => void progress(current).catch(() => undefined), 30_000);
	const captures = new CreativeArtifactWriter(runDirectory, {mode: 'preview', width: 3840, height: 2160});
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>> | undefined} */
	let browser;
	/** @type {CreativeVerificationParent | undefined} */
	let parent;
	/** @type {CreativeVerificationDemux | undefined} */
	let demuxed;
	/** @type {CreativeVerificationBrowserResult | undefined} */
	let inspected;
	/** @type {CreativeNodeTerminalState} */
	let state = 'failed';
	/** @type {unknown} */
	let failure;
	let interrupted = false;
	/** @type {Record<string, unknown>[]} */
	const browserMessages = [];
	/**
	 * Called by process interruption to release the browser and finish a terminal record.
	 *
	 * @returns {void} - Browser inspection interruption requested.
	 */
	const interrupt = () => {
		interrupted = true;
		if (browser) void browser.close().catch(() => undefined);
	};
	process.once('SIGINT', interrupt);
	process.once('SIGTERM', interrupt);
	try {
		await progress(current);
		process.stdout.write(`${JSON.stringify({runId, runDirectory, parentRunId})}\n`);
		await CreativeRunFiles.writeJson(runDirectory, 'command.json', {
			executable: process.execPath,
			arguments: [
				'experiments/distant-sun-shadow-animation-evidence/creative/verify-creative-animation.js',
				parentRunId,
			],
		});
		await progress({
			phase: 'authenticate-parent',
			message: 'Verifying all parent artifact hashes, exact replay coverage, and immutable paths.',
		});
		parent = await inspectParent(repositoryRoot, parentRunId);
		const moduleRoot = 'experiments/gpu-resident-shared-block-cache/node_modules/mediabunny';
		const moduleEntry = `${moduleRoot}/dist/modules/src/index.js`;
		const sourcePaths = [
			'experiments/distant-sun-shadow-animation-evidence/creative/verify-creative-animation.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node-types.d.ts',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeRunFiles.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeArtifactWriter.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeMp4Inspection.js',
			'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeVideoInspection.js',
			'scripts/animation-evidence/ArtifactManifest.js',
			'experiments/gpu-resident-shared-block-cache/verify-s9-deterministic-video.js',
			'experiments/gpu-resident-shared-block-cache/browser/s9-deterministic-render-browser.js',
			'experiments/gpu-resident-shared-block-cache/package-lock.json',
			`${moduleRoot}/package.json`,
			`${moduleRoot}/LICENSE`,
			...(await CreativeRunFiles.listFiles(repositoryRoot, `${moduleRoot}/dist/modules/src`)),
		];
		const sourceIdentities = [];
		for (const relativePath of sourcePaths)
			sourceIdentities.push((await CreativeRunFiles.readSnapshot(repositoryRoot, relativePath)).identity);
		await CreativeRunFiles.writeJson(runDirectory, 'inputs.json', {
			parent: {
				runId: parentRunId,
				manifest: parent.manifestIdentity,
				artifactSetSha256: parent.manifest.artifactSetSha256,
				video: parent.result.video,
				trace: parent.result.trace,
			},
			implementation: sourceIdentities,
			operation:
				'Reuse ArtifactManifest verification and the S9 Mediabunny demux and browser seek approach; inspect full packet timing and exact decoded presentation checkpoints.',
		});
		const mediabunnyModuleUrl = pathToFileURL(
			await CreativeRunFiles.requireRealPath(CreativeRunFiles.resolve(repositoryRoot, moduleEntry)),
		).href;
		await progress({
			phase: 'demux-video',
			message: 'Demuxing and verifying all 1800 encoded packets at thirty frames per second.',
		});
		demuxed = await CreativeMp4Inspection.inspect(parent.videoPath, mediabunnyModuleUrl);
		await CreativeRunFiles.writeJson(runDirectory, 'demux.json', demuxed);
		if (interrupted) throw new Error('Video verification interrupted before browser inspection.');
		await writeFile(
			path.join(runDirectory, 'inspection.html'),
			'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Creative video inspection</title></head><body style="margin:0;background:#000"></body></html>\n',
			{flag: 'wx'},
		);
		await progress({phase: 'launch-decoder', message: 'Opening the immutable MP4 in a contained Chrome decoder.'});
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
				'--disable-breakpad',
				'--disable-crash-reporter',
				'--noerrdialogs',
				'--no-first-run',
				'--no-default-browser-check',
				`--crash-dumps-dir=${browserTemporary}`,
				`--disk-cache-dir=${path.join(browserProfile, 'cache')}`,
			],
		});
		await CreativeRunFiles.writeJson(runDirectory, 'environment.json', {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			browserVersion: await browser.version(),
			browserUserAgent: await browser.userAgent(),
			chromeExecutable: CHROME_EXECUTABLE,
			browserProfile: 'browser-profile',
			browserTemporary: 'browser-temp',
		});
		const page = await browser.newPage();
		await page.setViewport({width: 960, height: 540, deviceScaleFactor: 1});
		await page.exposeFunction('__creativeVerifyCapture', captures.capture.bind(captures));
		await page.exposeFunction('__creativeVerifyProgress', progress);
		page.on('console', (message) => {
			if (browserMessages.length < 1000)
				browserMessages.push({kind: 'console', type: message.type(), text: message.text().slice(0, 4000)});
		});
		page.on('pageerror', (error) => browserMessages.push({kind: 'pageerror', message: error.message}));
		await page.goto(pathToFileURL(path.join(runDirectory, 'inspection.html')).href, {
			waitUntil: 'load',
			timeout: 60_000,
		});
		const inspectionModule = pathToFileURL(
			await CreativeRunFiles.requireRealPath(
				CreativeRunFiles.resolve(
					repositoryRoot,
					'experiments/distant-sun-shadow-animation-evidence/creative/node/CreativeVideoInspection.js',
				),
			),
		).href;
		inspected = await page.evaluate(
			async (moduleUrl, configuration) => {
				const {CreativeVideoInspection} = await import(moduleUrl);
				return CreativeVideoInspection.inspect(configuration);
			},
			inspectionModule,
			parent.browserConfiguration,
		);
		if (!inspected) throw new Error('Browser did not return decoded video inspection results.');
		await CreativeRunFiles.writeJson(runDirectory, 'decoded-inspection.json', inspected);
		const nativeStars = inspected.checkpoints.find(
			(checkpoint) => checkpoint.frameIndex === 0,
		)?.nativeStarPreservation;
		if (!nativeStars?.accepted) {
			throw new Error(
				`Opening native stars were lost or substantially reduced by encoding: ${JSON.stringify(nativeStars)}.`,
			);
		}
		if (captures.captures.length !== parent.browserConfiguration.checkpoints.length)
			throw new Error('Decoded inspection capture count is incomplete.');
		if (progressFailure) throw progressFailure;
		await progress({
			phase: 'reverify-parent',
			message: 'Rehashing the parent artifact set after read-only browser decoding.',
		});
		await ArtifactManifest.verify(parent.directory, parent.manifest, parent.manifest.excludedPaths);
		const manifestAfter = await CreativeRunFiles.readSnapshot(parent.directory, 'artifact-manifest.json');
		if (manifestAfter.identity.sha256 !== parent.manifestIdentity.sha256)
			throw new Error('Parent manifest changed during verification.');
		await CreativeRunFiles.writeJson(runDirectory, 'provenance.json', {
			operation:
				'Authenticate parent evidence; demux every packet using installed Mediabunny; seek exact compositor-reported presentation frames in Chrome; save native-4K decoded PNGs; compare aligned RGB samples with lossless source checkpoints; authenticate the unchanged parent again.',
			parentRunId,
			parentArtifactSetSha256: parent.manifest.artifactSetSha256,
			parentVideo: parent.result.video,
			implementationIdentityArtifact: 'inputs.json',
			containerInspectionArtifact: 'demux.json',
			decodedInspectionArtifact: 'decoded-inspection.json',
			captures: captures.captures,
			comparison: {
				sampleWidth: 480,
				sampleHeight: 270,
				maximumMeanAbsoluteRgbDifference: 15,
				actualFrameTimestampToleranceSeconds: 0.000002,
				nativeStarPreservation: nativeStars,
			},
			claimBoundary:
				'All encoded frame metadata is checked. Representative exact frames, including the final frame, are decoded and retained for visual inspection; this is not a claim that every pixel of every frame was visually reviewed.',
		});
		state = 'accepted';
	} catch (error) {
		failure = error;
		state = interrupted ? 'interrupted' : 'failed';
	} finally {
		clearInterval(heartbeat);
		process.removeListener('SIGINT', interrupt);
		process.removeListener('SIGTERM', interrupt);
		for (const result of await Promise.allSettled([browser?.close(), captures.close()])) {
			if (result.status === 'rejected') {
				failure ??= result.reason;
				state = interrupted ? 'interrupted' : 'failed';
			}
		}
		await progressTail;
		await CreativeRunFiles.writeJson(runDirectory, 'browser-messages.json', browserMessages);
		await CreativeRunFiles.writeJson(runDirectory, 'result.json', {
			schemaId: 'distant-sun-creative-video-verification-v1',
			runId,
			parentRunId,
			state,
			parentArtifactSetSha256: parent?.manifest.artifactSetSha256,
			parentVideo: parent?.result.video,
			container: demuxed
				? {
						width: demuxed.width,
						height: demuxed.height,
						durationSeconds: demuxed.durationSeconds,
						framesPerSecond: demuxed.framesPerSecond,
						frameCount: demuxed.frameCount,
						codec: demuxed.codec,
					}
				: undefined,
			decodedCheckpointCount: inspected?.checkpoints.length ?? 0,
			captures: captures.captures,
			...(failure
				? {
						error: {
							name: failure instanceof Error ? failure.name : 'Error',
							message: failure instanceof Error ? failure.message : String(failure),
							stack: failure instanceof Error ? failure.stack : undefined,
						},
					}
				: {}),
		});
		await progress(
			{
				phase: 'terminal',
				message:
					state === 'accepted'
						? 'Independent packet, decoded frame, and immutable parent checks passed.'
						: `Video verification ${state}: ${failure instanceof Error ? failure.message : String(failure)}.`,
			},
			state,
		);
		await progressTail;
		const excludedPaths = ['artifact-manifest.json', 'browser-profile', 'browser-temp'];
		const manifest = await ArtifactManifest.create(runDirectory, excludedPaths);
		await CreativeRunFiles.writeJson(runDirectory, 'artifact-manifest.json', {
			schemaId: 'distant-sun-creative-video-verification-artifact-manifest-v1',
			runId,
			state,
			excludedPaths,
			...manifest,
		});
		process.stdout.write(
			`${JSON.stringify({runId, runDirectory, parentRunId, state, artifactSetSha256: manifest.artifactSetSha256, decodedCheckpointCount: captures.captures.length})}\n`,
		);
	}
	if (failure) {
		process.exitCode = interrupted ? 130 : 1;
		process.stderr.write(`${failure instanceof Error ? failure.stack : String(failure)}\n`);
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
