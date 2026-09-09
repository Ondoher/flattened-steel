#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const EXPECTED_ARTIFACTS = Object.freeze([
	'artifact-manifest.json',
	'block-authentication.json',
	'browser-result.json',
	'command.txt',
	'environment.json',
	'inputs.json',
	'progress.jsonl',
	'provenance.json',
	'result.json',
	'route-lookups.json',
	'route-summary.json',
]);

const fail = (value, message) => {
	if (!value) throw new Error(message);
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function main() {
	const runId = process.argv[2];
	fail(/^\d+-s9-whole-route-capacity$/u.test(runId ?? ''), 'Supply one S9.1 whole-route capacity run ID.');
	const outputRoot = await realpath(OUTPUT_ROOT);
	const expectedRunDirectory = path.join(outputRoot, 'runs', runId);
	const runDirectory = await realpath(expectedRunDirectory);
	const runInformation = await lstat(expectedRunDirectory);
	fail(isWithin(outputRoot, runDirectory), 'S9.1 run escapes the experiment output root.');
	fail(
		runInformation.isDirectory() &&
			!runInformation.isSymbolicLink() &&
			runDirectory.toLowerCase() === expectedRunDirectory.toLowerCase(),
		'S9.1 run crosses a symlink, junction, or reparse boundary.',
	);
	const names = (await readdir(runDirectory)).sort();
	fail(JSON.stringify(names) === JSON.stringify(EXPECTED_ARTIFACTS), 'S9.1 run artifact set is incomplete or unexpected.');
	for (const name of names) {
		const information = await lstat(path.join(runDirectory, name));
		fail(information.isFile() && !information.isSymbolicLink(), `Invalid S9.1 artifact: ${name}`);
	}

	const manifest = JSON.parse(await readFile(path.join(runDirectory, 'artifact-manifest.json'), 'utf8'));
	fail(
		manifest.schemaId === 'gpu-resident-shared-block-cache-s9-artifact-manifest-v1',
		'Unexpected S9.1 artifact-manifest schema.',
	);
	const expectedManifestPaths = names.filter((name) => name !== 'artifact-manifest.json');
	fail(
		JSON.stringify(manifest.artifacts.map((artifact) => artifact.path)) === JSON.stringify(expectedManifestPaths),
		'S9.1 artifact manifest paths differ from the run.',
	);
	for (const artifact of manifest.artifacts) {
		const bytes = await readFile(path.join(runDirectory, artifact.path));
		fail(bytes.byteLength === artifact.byteLength, `${artifact.path} length differs from its manifest.`);
		fail(sha256(bytes) === artifact.sha256, `${artifact.path} identity differs from its manifest.`);
	}
	fail(
		sha256(Buffer.from(JSON.stringify(manifest.artifacts))) === manifest.artifactSetSha256,
		'S9.1 artifact-set identity is invalid.',
	);

	const inputs = JSON.parse(await readFile(path.join(runDirectory, 'inputs.json'), 'utf8'));
	fail(inputs.schemaId === 'gpu-resident-shared-block-cache-s9-capacity-input-v1', 'Unexpected S9.1 input schema.');
	const controlPath = path.join(REPOSITORY_ROOT, ...inputs.control.path.split('/'));
	const controlBytes = await readFile(controlPath);
	fail(controlBytes.byteLength === inputs.control.byteLength, 'S9 control length changed after the run.');
	fail(sha256(controlBytes) === inputs.control.sha256, 'S9 control identity changed after the run.');
	const control = JSON.parse(controlBytes);
	fail(
		control.schemaId === 'gpu-resident-shared-block-cache-s9-animation-contract-v1',
		'Unexpected S9 animation control schema.',
	);

	const route = JSON.parse(await readFile(path.join(runDirectory, 'route-summary.json'), 'utf8'));
	fail(route.schemaId === 'gpu-resident-shared-block-cache-s9-route-summary-v1', 'Unexpected route-summary schema.');
	fail(route.sceneCount === 61 && route.minimumDegrees === 30 && route.maximumDegrees === 90, 'Route scene range changed.');
	fail(route.uniqueBlockCount === 62 && route.uniqueBlockIndices.length === 62, 'Route block count changed.');
	fail(route.encodedBytes === 363647002 && route.decodedBytes === 966128640, 'Route byte totals changed.');
	fail(route.fallback.accepted === true && route.fallback.maximumAdjacentUnionBlocks <= 24, 'Sliding fallback is invalid.');
	fail(route.adjacent.length === 60, 'Route adjacent transition evidence is incomplete.');

	const lookups = JSON.parse(await readFile(path.join(runDirectory, 'route-lookups.json'), 'utf8'));
	fail(lookups.scenes.length === 61, 'Route lookup scene count changed.');
	const knownBlocks = new Set(route.uniqueBlockIndices);
	for (const [ordinal, scene] of lookups.scenes.entries()) {
		fail(scene.degrees === 30 + ordinal, 'Route lookup degrees are not consecutive.');
		fail(scene.segments.length > 0, `Route scene ${scene.degrees} has no segments.`);
		fail(
			scene.requiredBlockIndices.every((block) => knownBlocks.has(block)) &&
				scene.segments.every((segment) => knownBlocks.has(segment.blockIndex)),
			`Route scene ${scene.degrees} references an unknown block.`,
		);
	}

	const authentication = JSON.parse(
		await readFile(path.join(runDirectory, 'block-authentication.json'), 'utf8'),
	);
	fail(authentication.blocks.length === 62, 'Block-authentication evidence is incomplete.');
	fail(
		authentication.blocks.reduce((total, block) => total + block.encodedByteLength, 0) === 363647002,
		'Authenticated encoded-byte total changed.',
	);
	fail(
		authentication.blocks.reduce((total, block) => total + block.decodedByteLength, 0) === 966128640,
		'Authenticated decoded-byte total changed.',
	);
	fail(
		authentication.blocks.every(
			(block) =>
				knownBlocks.has(block.blockIndex) &&
				/^[a-f0-9]{64}$/u.test(block.encodedSha256) &&
				/^[a-f0-9]{64}$/u.test(block.decodedSha256),
		),
		'Block-authentication identities are incomplete.',
	);

	const browser = JSON.parse(await readFile(path.join(runDirectory, 'browser-result.json'), 'utf8'));
	const result = JSON.parse(await readFile(path.join(runDirectory, 'result.json'), 'utf8'));
	fail(
		result.schemaId === 'gpu-resident-shared-block-cache-s9-capacity-result-v1' &&
			result.runId === runId &&
			result.accepted === true &&
			result.conclusion === 'accepted',
		'S9.1 terminal result is not accepted.',
	);
	if (result.selectedPreparationPath === 'whole-route-gpu-resident') {
		fail(
			result.wholeRouteGpuResidency.accepted === true &&
				browser.accepted === true &&
				browser.wholeRouteAllocated === true &&
				browser.uploadedBlockCount === 62 &&
				browser.uploadedBytes === 966128640 &&
				browser.mismatchCount === 0 &&
				browser.contextLost === false,
			'Whole-route GPU-resident result is incomplete.',
		);
	} else {
		fail(
			result.selectedPreparationPath === 'decoded-cpu-pool-with-24-layer-sliding-gpu-window' &&
				result.wholeRouteGpuResidency.accepted === false &&
				browser.wholeRouteAllocated === false &&
				result.fallback.accepted === true,
			'Fallback preparation result is incomplete.',
		);
	}
	fail(
		result.playbackBoundary.encodedTransfer === 'none' &&
			result.playbackBoundary.zstandardDecode === 'none' &&
			result.playbackBoundary.inverseShuffle === 'none' &&
			result.playbackBoundary.blockAuthentication === 'none' &&
			result.playbackBoundary.sceneLookupConstruction === 'none',
		'S9.1 playback preparation boundary is incomplete.',
	);

	const progress = (await readFile(path.join(runDirectory, 'progress.jsonl'), 'utf8'))
		.trim()
		.split('\n')
		.map((line) => JSON.parse(line));
	fail(progress.length > 0, 'S9.1 progress is empty.');
	fail(progress.at(-1).state === 'accepted' && progress.at(-1).phase === 'terminal', 'S9.1 progress did not close accepted.');

	process.stdout.write(
		`${JSON.stringify(
			{
				runId,
				accepted: true,
				selectedPreparationPath: result.selectedPreparationPath,
				artifactCount: names.length,
				artifactSetSha256: manifest.artifactSetSha256,
			},
			null,
			2,
		)}\n`,
	);
}

await main();
