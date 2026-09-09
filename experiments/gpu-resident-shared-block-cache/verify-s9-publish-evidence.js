#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {ALL_FORMATS, EncodedPacketSink, FilePathSource, Input} from 'mediabunny';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const DEFAULT_RUN_ID = '1788926658377-s9-published-evidence';
const EXPECTED_PARENT_SETS = Object.freeze({
	trace78: 'd7d5a46042ea00124b50bcdb2b7ef4f68130dec8aa7242996ccc4adba8f265b4',
	trace55: 'f2e4389e35999bfeab88e5ca0fb26bf05a3b5209158eb23d4a228faba8469589',
	replay: 'db3b6283a0e37c9ddeb79be0f447b22367e25499e71aa928ec2c9ff423419105',
	video: '07c014ba6d0e029b4dc0c35721e013a5b4d662d585bd1c17fbea10fe6d745b01',
});
const FOVS = Object.freeze([
	Object.freeze({id: 'fov78', degrees: 78, held: 746, maximumHold: 4, jumps: 0}),
	Object.freeze({id: 'fov55', degrees: 55, held: 733, maximumHold: 3, jumps: 1}),
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
	const artifacts = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `S9.6 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) artifacts.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `S9.6 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			artifacts.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return artifacts;
}

function parseJsonLines(bytes, label) {
	fail(bytes.toString('utf8').endsWith('\n'), `${label} lacks a terminal newline.`);
	return bytes
		.toString('utf8')
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
}

async function inspectMp4(absolutePath) {
	const input = new Input({source: new FilePathSource(absolutePath, {maxCacheSize: 8 * 1024 * 1024}), formats: ALL_FORMATS});
	try {
		fail(await input.canRead(), 'Mediabunny could not read an S9.6 MP4.');
		const track = fail(await input.getPrimaryVideoTrack(), 'S9.6 MP4 lacks a primary video track.');
		const sink = new EncodedPacketSink(track);
		let packetCount = 0;
		let previousTimestamp = -1;
		for await (const packet of sink.packets(undefined, undefined, {metadataOnly: true})) {
			fail(packet.microsecondTimestamp > previousTimestamp, 'S9.6 MP4 timestamps are not monotonic.');
			previousTimestamp = packet.microsecondTimestamp;
			packetCount += 1;
		}
		return {
			mimeType: await input.getMimeType(),
			durationSeconds: await input.computeDuration(),
			width: await track.getDisplayWidth(),
			height: await track.getDisplayHeight(),
			codec: await track.getCodec(),
			packetCount,
		};
	} finally {
		input.dispose();
	}
}

function pngDimensions(bytes) {
	fail(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Invalid PNG signature.');
	return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^[0-9]+-s9-published-evidence$/u.test(runId), 'Invalid S9.6 run id.');
const expectedRunRoot = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRunRoot);
fail(runRoot.toLowerCase() === expectedRunRoot.toLowerCase() && isWithin(outputRoot, runRoot), 'S9.6 run escaped output root.');
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S9.6 run root is a symlink.');

const [resultBytes, manifestBytes, progressBytes, provenanceBytes] = await Promise.all([
	readFile(path.join(runRoot, 'result.json')),
	readFile(path.join(runRoot, 'artifact-manifest.json')),
	readFile(path.join(runRoot, 'progress.jsonl')),
	readFile(path.join(runRoot, 'provenance.json')),
]);
const result = JSON.parse(resultBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
fail(result.schemaId === 'gpu-resident-shared-block-cache-s9-published-evidence-result-v1', 'Unexpected S9.6 result schema.');
fail(result.runId === runId && result.accepted === true, 'S9.6 result is not accepted.');
fail(
	manifest.schemaId === 'gpu-resident-shared-block-cache-s9-published-evidence-artifact-manifest-v1',
	'Unexpected S9.6 artifact-manifest schema.',
);
fail(
	provenance.schemaId === 'gpu-resident-shared-block-cache-s9-published-evidence-provenance-v1',
	'Unexpected S9.6 provenance schema.',
);
const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S9.6 artifact identities changed.');
fail(sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256, 'S9.6 artifact-set identity changed.');
const terminals = parseJsonLines(progressBytes, 'S9.6 progress').filter((event) => event.state);
fail(terminals.length === 1 && terminals[0].state === 'accepted', 'S9.6 terminal state is not uniquely accepted.');
fail(!artifacts.some((artifact) => artifact.path.startsWith('browser-profile/')), 'S9.6 retained a disposable browser profile.');
fail(
	result.configuration.width === 3840 &&
		result.configuration.height === 2160 &&
		result.configuration.framesPerSecond === 60 &&
		result.configuration.frameCount === 1200 &&
		result.configuration.durationSeconds === 20,
	'S9.6 publication configuration changed.',
);
fail(result.ownerConclusion.includes('smooth enough'), 'S9.6 owner acceptance is missing.');
fail(result.knownDeferredQualityIssue.includes('too-gray horizon'), 'S9.6 deferred visual issue is missing.');

for (const [key, expectedSet] of Object.entries(EXPECTED_PARENT_SETS)) {
	fail(result.parents[key].artifactSetSha256 === expectedSet, `${key} parent identity changed.`);
}
for (const copy of result.copiedArtifacts) {
	const [source, target] = await Promise.all([
		readFile(await requireContainedFile(repositoryRoot, copy.sourcePath, 'S9.6 parent source')),
		readFile(await requireContainedFile(runRoot, copy.path, 'S9.6 copied artifact')),
	]);
	fail(
		source.byteLength === copy.byteLength && target.byteLength === copy.byteLength && sha256(source) === copy.sha256 && sha256(target) === copy.sha256,
		`S9.6 copy identity failed: ${copy.path}`,
	);
}

const verified = [];
for (const expected of FOVS) {
	const diagnostic = fail(result.diagnostics.find((entry) => entry.id === expected.id), `${expected.id} diagnostic missing.`);
	const [timelineBytes, traceBytes, idealBytes, mappedTraceBytes, htmlBytes] = await Promise.all([
		readFile(path.join(runRoot, 'diagnostics', `${expected.id}-timeline.jsonl`)),
		readFile(path.join(runRoot, 'traces', `${expected.id}.jsonl`)),
		readFile(path.join(runRoot, 'mappings', `${expected.id}-ideal.jsonl`)),
		readFile(path.join(runRoot, 'mappings', `${expected.id}-trace.jsonl`)),
		readFile(path.join(runRoot, 'diagnostics', `${expected.id}.html`)),
	]);
	const timeline = parseJsonLines(timelineBytes, `${expected.id} timeline`);
	const frames = parseJsonLines(traceBytes, `${expected.id} trace`);
	const ideal = parseJsonLines(idealBytes, `${expected.id} ideal mapping`);
	const mappedTrace = parseJsonLines(mappedTraceBytes, `${expected.id} trace mapping`);
	const framesById = new Map(frames.map((frame) => [frame.frameId, frame]));
	fail(timeline.length === 1200 && ideal.length === 1200 && mappedTrace.length === 1200, `${expected.id} slot count changed.`);
	for (const [index, entry] of timeline.entries()) {
		const mapping = mappedTrace[index];
		const frame = fail(framesById.get(mapping.sourceFrameId), `${expected.id} timeline source frame is missing.`);
		fail(
			entry.slotIndex === index &&
				entry.timestampMicroseconds === Math.round((index * 1_000_000) / 60) &&
				entry.fovDegrees === expected.degrees &&
				entry.sourceFrameId === mapping.sourceFrameId &&
				entry.heldFromPreviousSlot === mapping.heldFromPreviousSlot &&
				entry.gpuElapsedMicroseconds === frame.gpuElapsedMicroseconds &&
				JSON.stringify(entry.traceState) === JSON.stringify(mapping.state) &&
				JSON.stringify(entry.idealState) === JSON.stringify(ideal[index].state),
			`${expected.id} timeline entry ${index} changed.`,
		);
		fail(entry.markers.includes('held-presentation-slot') === entry.heldFromPreviousSlot, `${expected.id} held marker changed.`);
	}
	fail(timeline.filter((entry) => entry.heldFromPreviousSlot).length === expected.held, `${expected.id} hold count changed.`);
	fail(Math.max(...timeline.map((entry) => entry.holdGroupSlotCount)) === expected.maximumHold, `${expected.id} maximum hold changed.`);
	fail(timeline.filter((entry) => entry.measuredFrameAdvance > 1).length === expected.jumps, `${expected.id} jump count changed.`);
	fail(diagnostic.summary.cacheTransitionCount === 121, `${expected.id} cache transition count changed.`);
	const html = htmlBytes.toString('utf8');
	fail(
		html.includes('too-gray horizon') &&
			html.includes('smooth enough') &&
			html.includes(result.parents.replay.runId) &&
			html.includes(result.parents.video.runId),
		`${expected.id} diagnostic disclosure or provenance is missing.`,
	);
	fail(diagnostic.inspections.length === 3, `${expected.id} browser inspection count changed.`);
	for (const inspection of diagnostic.inspections) {
		for (const kind of ['ideal', 'trace']) {
			const media = inspection.browser[kind];
			fail(media.width === 3840 && media.height === 2160 && Math.abs(media.duration - 20) < 0.001 && media.readyState >= 2, `${expected.id} ${kind} browser decode changed.`);
		}
		const png = await readFile(path.join(runRoot, ...inspection.screenshot.split('/')));
		const dimensions = pngDimensions(png);
		fail(dimensions.width === 1920 && dimensions.height === 1080, `${expected.id} diagnostic screenshot dimensions changed.`);
	}
	const videos = [];
	for (const kind of ['ideal', 'trace']) {
		const inspected = await inspectMp4(path.join(runRoot, 'videos', `${expected.id}-${kind}.mp4`));
		fail(
			inspected.width === 3840 &&
				inspected.height === 2160 &&
				Math.abs(inspected.durationSeconds - 20) < 0.001 &&
				inspected.packetCount === 1200 &&
				inspected.mimeType === 'video/mp4; codecs="avc1.640034"',
			`${expected.id}-${kind} independent MP4 inspection changed.`,
		);
		videos.push({kind, ...inspected});
	}
	verified.push({id: expected.id, summary: diagnostic.summary, videos, browserInspectionCount: diagnostic.inspections.length});
}

process.stdout.write(`${JSON.stringify({runId, accepted: true, artifactSetSha256: manifest.artifactSetSha256, verified}, null, 2)}\n`);
