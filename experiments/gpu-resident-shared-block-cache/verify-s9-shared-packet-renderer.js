#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const DEFAULT_RUN_ID = '1788917159050-s9-shared-packet-renderer';
const fail = (value, message) => {
	if (!value) throw new Error(message);
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
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
		fail(!information.isSymbolicLink(), `S9.2 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `S9.2 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

const closeTo = (actual, expected, tolerance = 1e-10) => Math.abs(actual - expected) <= tolerance;

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'Experiment output escaped repository tmp.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^[0-9]+-s9-shared-packet-renderer$/u.test(runId), 'Invalid S9.2 run id.');
const expectedRun = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRun);
fail(runRoot.toLowerCase() === expectedRun.toLowerCase() && isWithin(outputRoot, runRoot), 'S9.2 run escaped its output root.');
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S9.2 run root is a symlink.');

const [resultBytes, manifestBytes, progressBytes, provenanceBytes] = await Promise.all([
	readFile(path.join(runRoot, 'result.json')),
	readFile(path.join(runRoot, 'artifact-manifest.json')),
	readFile(path.join(runRoot, 'progress.jsonl')),
	readFile(path.join(runRoot, 'provenance.json')),
]);
const result = JSON.parse(resultBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
fail(result.schemaId === 'gpu-resident-shared-block-cache-s9-shared-packet-renderer-result-v1', 'Unexpected S9.2 result schema.');
fail(result.runId === runId && result.accepted === true, 'S9.2 result is not accepted.');
fail(manifest.schemaId === 'gpu-resident-shared-block-cache-s9-renderer-artifact-manifest-v1', 'Unexpected S9.2 manifest schema.');
fail(provenance.schemaId === 'gpu-resident-shared-block-cache-s9-renderer-provenance-v1', 'Unexpected S9.2 provenance schema.');

const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S9.2 artifact identities changed.');
fail(
	sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256,
	'S9.2 artifact-set identity changed.',
);
const terminalEvents = progressBytes
	.toString('utf8')
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line))
	.filter((event) => event.state);
fail(terminalEvents.length === 1 && terminalEvents[0].state === 'accepted', 'S9.2 terminal state is not uniquely accepted.');

const atlas = result.packetAtlas;
fail(atlas.accepted === true && atlas.mismatchCount === 0 && atlas.contextLost === false, 'S9.2 packet atlas did not pass.');
fail(atlas.probeCount === 248, 'S9.2 exact packet probe count changed.');
fail(
	atlas.atlas.format === 'RGBA32F' &&
		atlas.atlas.width === 648 &&
		atlas.atlas.height === 1728 &&
		atlas.atlas.layers === 62 &&
		atlas.atlas.bytes === 1_110_786_048,
	'S9.2 packet atlas shape changed.',
);
fail(atlas.uploads.length === 62, 'S9.2 upload count changed.');
fail(
	atlas.uploads.every((upload, slot) => upload.slot === slot && upload.packetBytes === 17_915_904),
	'S9.2 packet-layer publication changed.',
);
fail(
	atlas.uploads.reduce((sum, upload) => sum + upload.decodedBytes, 0) === 966_128_640,
	'S9.2 decoded source bytes changed.',
);
fail(atlas.metadata.maximumPackedRows === 662, 'S9.2 maximum packed-row count changed.');

fail(result.preparation.sceneCount === 61 && result.preparation.uniqueBlockCount === 62, 'S9.2 route shape changed.');
fail(
	result.preparation.encodedBytes === 363_647_002 && result.preparation.decodedBytes === 966_128_640,
	'S9.2 route byte totals changed.',
);
fail(result.visualComparisons.length === 3, 'S9.2 visual-control count changed.');
for (const comparison of result.visualComparisons) {
	fail(comparison.baseline.path !== comparison.candidate.path, `${comparison.id} did not retain both render paths.`);
	fail(comparison.comparison.width === 1920 && comparison.comparison.height === 1080, `${comparison.id} dimensions changed.`);
	fail(comparison.comparison.maximumAbsoluteCodeDifference <= 2, `${comparison.id} exceeded maximum display error.`);
	fail(comparison.comparison.p99AbsoluteCodeDifference <= 1, `${comparison.id} exceeded p99 display error.`);
}

const expectedTimes = [0, 5, 10, 15, 20];
fail(result.arbitraryScenarioStates.length === expectedTimes.length, 'S9.2 arbitrary-time count changed.');
for (const [index, state] of result.arbitraryScenarioStates.entries()) {
	fail(state.elapsedSeconds === expectedTimes[index], 'S9.2 arbitrary-time ordering changed.');
	const scenarioProgress = state.elapsedSeconds / 20;
	const expectedZenith = 90 - 60 * Math.sin(Math.PI * scenarioProgress);
	const expectedAzimuth = 90 + 180 * scenarioProgress;
	fail(closeTo(state.progress, scenarioProgress), 'S9.2 scenario progress changed.');
	fail(closeTo(state.solarZenithDegrees, expectedZenith), 'S9.2 scenario zenith changed.');
	fail(closeTo(state.solarAzimuthDegrees, expectedAzimuth), 'S9.2 scenario azimuth changed.');
	fail(
		state.selectedCacheDegrees === Math.max(30, Math.min(90, Math.floor(expectedZenith + 0.5))),
		'S9.2 hard nearest-degree selection changed.',
	);
	fail(state.qualityIntervalCount === 10, 'S9.2 diagnostic quality changed.');
	fail(
		state.celestial?.sunScreenCenterPixels?.length === 2 &&
			state.celestial.expectedSunScreenCenterPixels?.length === 2 &&
			closeTo(state.celestial.sunScreenCenterPixels[0], 960, 1) &&
			closeTo(state.celestial.sunScreenCenterPixels[1], 540, 1) &&
			state.celestial.sunScreenCenterErrorPixels <= 1,
		`S9.2 scenario ${state.elapsedSeconds}s did not publish the Sun at screen center.`,
	);
	fail(
		state.celestial.dirtyReason === null &&
			state.celestial.frameCountAfterPublication > state.frameCountBeforePublication,
		`S9.2 scenario ${state.elapsedSeconds}s did not complete celestial publication.`,
	);
	fail(
		state.directionToSunModel.every((value, directionIndex) =>
			closeTo(value, state.celestial.placementDirectionToSunModel[directionIndex], 1e-12),
		),
		`S9.2 scenario ${state.elapsedSeconds}s celestial direction diverged from its cache direction.`,
	);
	const capture = artifacts.find((artifact) => artifact.path === state.capture.path);
	fail(
		capture?.byteLength === state.capture.byteLength && capture.sha256 === state.capture.sha256,
		`S9.2 scenario capture ${state.capture.path} changed.`,
	);
}
fail(new Set(result.arbitraryScenarioStates.map((state) => state.capture.sha256)).size === 5, 'S9.2 scenario captures are not distinct.');
fail(
	result.browser.drawingBuffer.width === 1920 &&
		result.browser.drawingBuffer.height === 1080 &&
		result.browser.webglError === 0 &&
		result.browser.contextLost === false,
	'S9.2 browser boundary changed.',
);
fail(
	result.browser.shaderHook.transformedShaders > 0 &&
		result.browser.shaderHook.linkedPrograms > 0 &&
		result.browser.shaderHook.boundDraws > 0 &&
		result.browser.shaderHook.transformErrors.length === 0,
	'S9.2 integrated shader evidence changed.',
);

for (const source of Object.values(provenance.sourceIdentities)) {
	const bytes = await readFile(path.join(repositoryRoot, ...source.path.split('/')));
	fail(sha256(bytes) === source.sha256, `S9.2 source identity changed: ${source.path}`);
}

process.stdout.write(
	`${JSON.stringify({runId, accepted: true, artifactSetSha256: manifest.artifactSetSha256, packetAtlasBytes: atlas.atlas.bytes, exactProbeCount: atlas.probeCount, visualComparisons: result.visualComparisons.map((entry) => ({id: entry.id, maximumAbsoluteCodeDifference: entry.comparison.maximumAbsoluteCodeDifference, p99AbsoluteCodeDifference: entry.comparison.p99AbsoluteCodeDifference})), arbitraryScenarioTimesSeconds: expectedTimes}, null, 2)}\n`,
);
