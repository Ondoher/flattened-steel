#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {ALL_FORMATS, EncodedPacketSink, FilePathSource, Input} from 'mediabunny';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const DEFAULT_RUN_ID = '1788923711177-s9-deterministic-video';
const EXPECTED_OUTPUTS = Object.freeze([
	Object.freeze({
		id: 'fov78-ideal',
		fovDegrees: 78,
		mappingKind: 'ideal-equation',
		mapping: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay/mappings/fov78-ideal.jsonl',
			byteLength: 703_950,
			sha256: 'c4c636e818db90b4add8e2d78a27c02c8ec25d6424123a39be4a965edd4801aa',
		}),
	}),
	Object.freeze({
		id: 'fov78-trace',
		fovDegrees: 78,
		mappingKind: 'trace-latest-frame-at-or-before-slot',
		mapping: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay/mappings/fov78-trace.jsonl',
			byteLength: 1_082_770,
			sha256: '695d90555e90c9c56cd8253a5c5554e1d04f2aeff704ce892d17b440f2de80a3',
		}),
	}),
	Object.freeze({
		id: 'fov55-ideal',
		fovDegrees: 55,
		mappingKind: 'ideal-equation',
		mapping: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay/mappings/fov55-ideal.jsonl',
			byteLength: 703_950,
			sha256: '4959590587f70199e4cb680d76d9eb137477030b32601cfea035ac6f3f65a9e9',
		}),
	}),
	Object.freeze({
		id: 'fov55-trace',
		fovDegrees: 55,
		mappingKind: 'trace-latest-frame-at-or-before-slot',
		mapping: Object.freeze({
			path: 'tmp/experiments/gpu-resident-shared-block-cache/runs/1788919958694-s9-presentation-replay/mappings/fov55-trace.jsonl',
			byteLength: 1_097_383,
			sha256: '7616e0adf671da921c8315f7232c7c44b97f601fb975a92cb33b1cf32248543a',
		}),
	}),
]);
const CHECKPOINT_SLOTS = [0, 300, 600, 900, 1199];
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
		fail(!information.isSymbolicLink(), `S9.5 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `S9.5 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

const parseJsonLines = (bytes, label) => {
	fail(bytes.toString('utf8').endsWith('\n'), `${label} lacks its terminal newline.`);
	return bytes
		.toString('utf8')
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
};

function pngDimensions(bytes, label) {
	fail(bytes.byteLength > 24, `${label} is too small.`);
	fail(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${label} is not PNG.`);
	fail(bytes.toString('ascii', 12, 16) === 'IHDR', `${label} lacks PNG IHDR.`);
	return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function inspectMp4(absolutePath) {
	const input = new Input({source: new FilePathSource(absolutePath, {maxCacheSize: 8 * 1024 * 1024}), formats: ALL_FORMATS});
	try {
		fail(await input.canRead(), 'Mediabunny could not read an S9.5 MP4.');
		const videoTrack = fail(await input.getPrimaryVideoTrack(), 'S9.5 MP4 lacks a primary video track.');
		const sink = new EncodedPacketSink(videoTrack);
		const packets = [];
		for await (const packet of sink.packets(undefined, undefined, {metadataOnly: true})) {
			packets.push({
				type: packet.type,
				timestampMicroseconds: packet.microsecondTimestamp,
				durationMicroseconds: packet.microsecondDuration,
				byteLength: packet.byteLength,
			});
		}
		return {
			mimeType: await input.getMimeType(),
			durationSeconds: await input.computeDuration(),
			width: await videoTrack.getDisplayWidth(),
			height: await videoTrack.getDisplayHeight(),
			codec: await videoTrack.getCodec(),
			canDecode: await videoTrack.canDecode(),
			packets,
		};
	} finally {
		input.dispose();
	}
}

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^[0-9]+-s9-deterministic-video$/u.test(runId), 'Invalid S9.5 run id.');
const expectedRunRoot = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRunRoot);
fail(
	runRoot.toLowerCase() === expectedRunRoot.toLowerCase() && isWithin(outputRoot, runRoot),
	'S9.5 run escaped its output root.',
);
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S9.5 run root is a symlink.');

const [resultBytes, manifestBytes, progressBytes, provenanceBytes, inputsBytes] = await Promise.all([
	readFile(path.join(runRoot, 'result.json')),
	readFile(path.join(runRoot, 'artifact-manifest.json')),
	readFile(path.join(runRoot, 'progress.jsonl')),
	readFile(path.join(runRoot, 'provenance.json')),
	readFile(path.join(runRoot, 'inputs.json')),
]);
const result = JSON.parse(resultBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
const inputs = JSON.parse(inputsBytes);
fail(result.schemaId === 'gpu-resident-shared-block-cache-s9-deterministic-video-result-v1', 'Unexpected S9.5 result schema.');
fail(result.runId === runId && result.accepted === true, 'S9.5 result is not accepted.');
fail(
	manifest.schemaId === 'gpu-resident-shared-block-cache-s9-deterministic-video-artifact-manifest-v1',
	'Unexpected S9.5 manifest schema.',
);
fail(
	provenance.schemaId === 'gpu-resident-shared-block-cache-s9-deterministic-video-provenance-v1',
	'Unexpected S9.5 provenance schema.',
);
fail(inputs.schemaId === 'gpu-resident-shared-block-cache-s9-video-input-v1', 'Unexpected S9.5 input schema.');

const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S9.5 artifact identities changed.');
fail(sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256, 'S9.5 artifact-set identity changed.');
const terminalEvents = parseJsonLines(progressBytes, 'S9.5 progress').filter((event) => event.state);
fail(terminalEvents.length === 1 && terminalEvents[0].state === 'accepted', 'S9.5 terminal state is not uniquely accepted.');
fail(!artifacts.some((artifact) => artifact.path.startsWith('browser-profile/')), 'S9.5 retained its disposable browser profile.');

fail(
	result.configuration.viewport.width === 3840 &&
		result.configuration.viewport.height === 2160 &&
		result.configuration.framesPerSecond === 60 &&
		result.configuration.frameCount === 1200 &&
		result.configuration.durationSeconds === 20 &&
		result.configuration.qualityIntervalCount === 10 &&
		JSON.stringify(result.configuration.checkpointSlots) === JSON.stringify(CHECKPOINT_SLOTS),
	'S9.5 output configuration changed.',
);
const selection = result.configuration.encoderSelection;
fail(
	selection.schemaId === 'gpu-resident-shared-block-cache-s9-webcodecs-selection-v1' &&
		selection.selectedCandidateId === 'avc-high-5.2-prefer-hardware' &&
		selection.selectedConfig.codec === 'avc1.640034' &&
		selection.selectedConfig.width === 3840 &&
		selection.selectedConfig.height === 2160 &&
		selection.selectedConfig.bitrate === 40_000_000 &&
		selection.selectedConfig.framerate === 60 &&
		selection.selectedConfig.latencyMode === 'quality' &&
		selection.outcomes[0].configured === true &&
		selection.outcomes[0].outputCount === 1 &&
		selection.outcomes[0].decoderConfig.codedWidth === 3840 &&
		selection.outcomes[0].decoderConfig.codedHeight === 2160,
	'S9.5 WebCodecs selection changed.',
);
fail(
	result.configuration.container.kind === 'fragmented-mp4' &&
		result.configuration.container.minimumFragmentDurationSeconds === 1,
	'S9.5 container selection changed.',
);
fail(
	result.configuration.muxer.name === 'mediabunny' &&
		result.configuration.muxer.version === '1.55.7' &&
		result.configuration.muxer.license === 'MPL-2.0',
	'S9.5 muxer identity changed.',
);
fail(
	result.preparation.sceneCount === 61 &&
		result.preparation.uniqueBlockCount === 62 &&
		result.preparation.encodedBytes === 363_647_002 &&
		result.preparation.decodedBytes === 966_128_640 &&
		result.preparation.packetAtlas.bytes === 1_110_786_048,
	'S9.5 preparation facts changed.',
);

const retainedBundle = await readFile(path.join(runRoot, 'dependencies', 'mediabunny-1.55.7.min.mjs'));
const retainedLicense = await readFile(path.join(runRoot, 'dependencies', 'mediabunny-1.55.7-LICENSE.txt'));
const retainedPackage = JSON.parse(
	await readFile(path.join(runRoot, 'dependencies', 'mediabunny-1.55.7-package.json'), 'utf8'),
);
fail(
	sha256(retainedBundle) === result.configuration.muxer.bundleSha256 &&
		sha256(retainedLicense) === result.configuration.muxer.licenseSha256 &&
		retainedPackage.name === 'mediabunny' &&
		retainedPackage.version === '1.55.7' &&
		retainedPackage.license === 'MPL-2.0',
	'S9.5 retained muxer package changed.',
);

fail(result.videos.length === EXPECTED_OUTPUTS.length, 'S9.5 video count changed.');
const verifiedVideos = [];
for (const expected of EXPECTED_OUTPUTS) {
	const video = fail(result.videos.find((candidate) => candidate.id === expected.id), `Missing ${expected.id}.`);
	fail(
		video.fovDegrees === expected.fovDegrees &&
			video.mappingKind === expected.mappingKind &&
			JSON.stringify(video.mapping) === JSON.stringify(expected.mapping),
		`${expected.id} mapping identity changed.`,
	);
	const mappingBytes = await readFile(await requireContainedFile(repositoryRoot, expected.mapping.path, `${expected.id} mapping`));
	fail(
		mappingBytes.byteLength === expected.mapping.byteLength && sha256(mappingBytes) === expected.mapping.sha256,
		`${expected.id} source mapping changed.`,
	);
	const mapping = parseJsonLines(mappingBytes, `${expected.id} source mapping`);
	const expectedHeldSlots = mapping.filter((entry) => entry.heldFromPreviousSlot).length;
	const expectedSourceStates = mapping.filter(
		(entry) => entry.mappingKind === 'ideal-equation' || !entry.heldFromPreviousSlot,
	).length;
	fail(
		video.frameCount === 1200 &&
			video.renderedSourceStateCount === expectedSourceStates &&
			video.heldOutputSlotCount === expectedHeldSlots &&
			video.maximumSunScreenCenterErrorPixels <= 1 &&
			video.browser.drawingBuffer.width === 3840 &&
			video.browser.drawingBuffer.height === 2160 &&
			video.browser.webglError === 0 &&
			video.browser.contextLost === false,
		`${expected.id} render closure changed.`,
	);
	fail(video.video.transport.maximumBufferedBytes <= 4 * 1024 * 1024, `${expected.id} exceeded its transport bound.`);
	fail(
		video.video.transport.batchCount === video.video.batchCount && video.video.batchCount > 0,
		`${expected.id} transport batch accounting changed.`,
	);
	const videoPath = await requireContainedFile(runRoot, video.video.path, `${expected.id} MP4`);
	const videoBytes = await readFile(videoPath);
	fail(
		videoBytes.byteLength === video.video.byteLength && sha256(videoBytes) === video.video.sha256,
		`${expected.id} MP4 identity changed.`,
	);
	fail(videoBytes.toString('ascii', 4, 8) === 'ftyp', `${expected.id} does not begin with an MP4 ftyp box.`);
	const packetTraceBytes = await readFile(await requireContainedFile(runRoot, video.packetTrace.path, `${expected.id} packet trace`));
	fail(
		packetTraceBytes.byteLength === video.packetTrace.byteLength &&
			sha256(packetTraceBytes) === video.packetTrace.sha256,
		`${expected.id} packet trace identity changed.`,
	);
	const packetTrace = parseJsonLines(packetTraceBytes, `${expected.id} packet trace`);
	fail(packetTrace.length === 1200 && video.packetTrace.packetCount === 1200, `${expected.id} packet count changed.`);
	for (const [packetIndex, packet] of packetTrace.entries()) {
		fail(packet.packetIndex === packetIndex, `${expected.id} packet index changed.`);
		fail(
			packet.timestampMicroseconds === Math.round((packetIndex * 1_000_000) / 60),
			`${expected.id} packet timestamp changed at ${packetIndex}.`,
		);
		fail(packet.durationMicroseconds === 16_666, `${expected.id} packet duration changed.`);
		fail(packet.type === (packetIndex % 60 === 0 ? 'key' : 'delta'), `${expected.id} keyframe policy changed.`);
		fail(packet.byteLength > 0, `${expected.id} packet ${packetIndex} is empty.`);
	}
	fail(
		video.packetTrace.keyPacketCount === 20 &&
			video.packetTrace.encodedPayloadBytes === packetTrace.reduce((sum, packet) => sum + packet.byteLength, 0),
		`${expected.id} encoded payload accounting changed.`,
	);

	fail(video.captures.length === CHECKPOINT_SLOTS.length, `${expected.id} checkpoint count changed.`);
	for (const [captureIndex, capture] of video.captures.entries()) {
		fail(capture.slotIndex === CHECKPOINT_SLOTS[captureIndex], `${expected.id} checkpoint slot changed.`);
		fail(
			capture.pixelProbe.width === 16 &&
				capture.pixelProbe.height === 9 &&
				capture.pixelProbe.nonBlackPixelCount === 144 &&
				capture.pixelProbe.meanRgbCodeValue > 0,
			`${expected.id} checkpoint ${capture.slotIndex} is blank.`,
		);
		const captureBytes = await readFile(await requireContainedFile(runRoot, capture.path, `${expected.id} checkpoint`));
		fail(
			captureBytes.byteLength === capture.byteLength && sha256(captureBytes) === capture.sha256,
			`${expected.id} checkpoint ${capture.slotIndex} identity changed.`,
		);
		const dimensions = pngDimensions(captureBytes, `${expected.id} checkpoint ${capture.slotIndex}`);
		fail(dimensions.width === 3840 && dimensions.height === 2160, `${expected.id} checkpoint dimensions changed.`);
	}
	fail(new Set(video.captures.map((capture) => capture.sha256)).size === 5, `${expected.id} checkpoints are not distinct.`);
	fail(
		video.inspection.videoWidth === 3840 &&
			video.inspection.videoHeight === 2160 &&
			video.inspection.durationSeconds === 20 &&
			video.inspection.seeks.length === 3 &&
			video.inspection.seeks.every((seek) => seek.readyState === 4 && seek.resolvedSeconds === seek.requestedSeconds),
		`${expected.id} browser decode/seek inspection changed.`,
	);

	const demuxed = await inspectMp4(videoPath);
	fail(
		demuxed.width === 3840 &&
			demuxed.height === 2160 &&
			demuxed.durationSeconds === 20 &&
			demuxed.codec === 'avc' &&
			demuxed.mimeType === 'video/mp4; codecs="avc1.640034"' &&
			typeof demuxed.canDecode === 'boolean' &&
			demuxed.packets.length === 1200,
		`${expected.id} independent MP4 inspection failed: ${JSON.stringify({...demuxed, packets: demuxed.packets.length})}`,
	);
	for (const [packetIndex, packet] of demuxed.packets.entries()) {
		const retained = packetTrace[packetIndex];
		fail(packet.type === retained.type, `${expected.id} demuxed packet type changed.`);
		fail(
			Math.abs(packet.timestampMicroseconds - retained.timestampMicroseconds) <= 1 &&
				Math.abs(packet.durationMicroseconds - retained.durationMicroseconds) <= 1 &&
				packet.byteLength === retained.byteLength,
			`${expected.id} demuxed packet ${packetIndex} diverged from the retained trace.`,
		);
	}
	verifiedVideos.push({
		id: expected.id,
		byteLength: video.video.byteLength,
		sha256: video.video.sha256,
		frameCount: demuxed.packets.length,
		renderedSourceStateCount: video.renderedSourceStateCount,
		heldOutputSlotCount: video.heldOutputSlotCount,
		checkpointCount: video.captures.length,
	});
}

for (const source of Object.values(provenance.sourceIdentities)) {
	const bytes = await readFile(await requireContainedFile(repositoryRoot, source.path, 'S9.5 source'));
	fail(sha256(bytes) === source.sha256, `S9.5 source identity changed: ${source.path}`);
}
fail(
	inputs.s94Parent.runId === '1788919958694-s9-presentation-replay' &&
		JSON.stringify(inputs.outputs) === JSON.stringify(EXPECTED_OUTPUTS),
	'S9.5 retained inputs changed.',
);

process.stdout.write(
	`${JSON.stringify(
		{
			runId,
			accepted: true,
			artifactSetSha256: manifest.artifactSetSha256,
			codec: selection.selectedConfig.codec,
			muxer: result.configuration.muxer,
			videos: verifiedVideos,
		},
		null,
		2,
	)}\n`,
);
