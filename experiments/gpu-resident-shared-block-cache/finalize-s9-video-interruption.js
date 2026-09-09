#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {appendFile, lstat, readFile, readdir, realpath, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {OUTPUT_ROOT} from './consts.js';

const EXPECTED_RUN_ID = '1788921937834-s9-deterministic-video';
const fail = (value, message) => {
	if (!value) throw new Error(message);
	return value;
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
		fail(!information.isSymbolicLink(), `Interrupted S9.5 run contains a symlink: ${childRelative}`);
		if (information.isDirectory()) entries.push(...(await collectArtifacts(root, childRelative)));
		else {
			fail(information.isFile(), `Interrupted S9.5 run contains an unsupported entry: ${childRelative}`);
			const bytes = await readFile(absolute);
			entries.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return entries;
}

const outputRoot = await realpath(OUTPUT_ROOT);
const runId = process.argv[2] ?? EXPECTED_RUN_ID;
fail(runId === EXPECTED_RUN_ID, 'This finalizer is restricted to the observed interrupted S9.5 run.');
const expectedRunRoot = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRunRoot);
fail(runRoot.toLowerCase() === expectedRunRoot.toLowerCase() && isWithin(outputRoot, runRoot), 'Run escaped output root.');
const profilePath = path.join(runRoot, 'browser-profile');
const profileReal = await realpath(profilePath);
fail(isWithin(runRoot, profileReal) && profileReal.toLowerCase() === profilePath.toLowerCase(), 'Profile escaped run root.');
await rm(profileReal, {recursive: true, force: true});

const progressPath = path.join(runRoot, 'progress.jsonl');
const progressBytes = await readFile(progressPath);
const events = progressBytes
	.toString('utf8')
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line));
fail(!events.some((event) => event.state), 'Interrupted run already has a terminal state.');
const observed = events.filter(
	(event) => event.phase === 'deterministic-render' && event.total === 1200 && event.completed === 60,
);
fail(observed.length >= 2, 'Interrupted run does not contain the observed 60-frame stall.');
const result = {
	schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-result-v1',
	runId,
	accepted: false,
	failureKind: 'bounded-observation-interruption',
	claimBoundary:
		'Diagnostic infrastructure evidence only. The first output accepted 60 render/encode submissions, then made no progress for more than three minutes at the first fragment/backpressure boundary. No MP4 bytes reached the host. The process was deliberately interrupted; encoder selection and exact pre-interruption source identities were not published and are not claimed.',
	observation: {
		outputId: 'fov78-ideal',
		lastCompletedSlotCount: 60,
		firstObservedAt: observed[0].timestamp,
		lastObservedAt: observed.at(-1).timestamp,
		videoFileCount: 0,
		retainedCaptureCount: 1,
	},
};
await writeFile(path.join(runRoot, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'});
await writeFile(
	path.join(runRoot, 'interruption-provenance.json'),
	`${JSON.stringify(
		{
			schemaId: 'gpu-resident-shared-block-cache-s9-video-interruption-provenance-v1',
			operation:
				'After terminating an unresponsive isolated S9.5 process, remove only its contained disposable browser profile, classify the retained progress/capture evidence, and publish a unique failed terminal state and manifest.',
			finalizer: {
				path: 'experiments/gpu-resident-shared-block-cache/finalize-s9-video-interruption.js',
				sha256: sha256(await readFile(fileURLToPath(import.meta.url))),
			},
		},
		null,
		2,
	)}\n`,
	{flag: 'wx'},
);
await appendFile(
	progressPath,
	`${JSON.stringify({
		timestamp: new Date().toISOString(),
		phase: 'terminal',
		message: 'Rejected after bounded observation of the first-fragment transport stall and explicit interruption.',
		state: 'failed',
	})}\n`,
	'utf8',
);
const artifacts = await collectArtifacts(runRoot);
const artifactSetSha256 = sha256(Buffer.from(JSON.stringify(artifacts)));
await writeFile(
	path.join(runRoot, 'artifact-manifest.json'),
	`${JSON.stringify(
		{
			schemaId: 'gpu-resident-shared-block-cache-s9-deterministic-video-artifact-manifest-v1',
			artifacts,
			artifactSetSha256,
		},
		null,
		2,
	)}\n`,
	{flag: 'wx'},
);
process.stdout.write(`${JSON.stringify({runId, accepted: false, artifactSetSha256}, null, 2)}\n`);
