#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fail = (value, message) => { if (!value) throw new Error(message); };

async function main() {
	const runId = process.argv[2];
	fail(/^[0-9]+-s3-atlas-host-smoke$/u.test(runId ?? ''), 'Supply one S3 smoke run ID.');
	const directory = path.join(OUTPUT_ROOT, 'runs', runId);
	const expected = ['command.txt', 'inputs.json', 'provenance.json', 'environment.json', 'progress.jsonl', 'browser-result.json', 'result.json'];
	for (const name of expected) fail((await stat(path.join(directory, name))).isFile(), `S3 run is missing ${name}.`);
	const inputs = JSON.parse(await readFile(path.join(directory, 'inputs.json'), 'utf8'));
	const control = await readFile(path.join(REPOSITORY_ROOT, ...inputs.control.path.split('/')));
	fail(sha256(control) === inputs.control.sha256, 'S3 control identity changed.');
	const result = JSON.parse(await readFile(path.join(directory, 'result.json'), 'utf8'));
	fail(result.accepted === true && result.browser.atlasShaderCompiled === true && result.browser.commonProbeContract === true, 'S3 result is not accepted atlas shader and common-probe evidence.');
	fail(result.browser.maximumTextureSize >= 4058 && result.browser.maximumArrayLayers >= 24, 'S3 browser does not satisfy frozen atlas capacity.');
	const progress = await readFile(path.join(directory, 'progress.jsonl'), 'utf8');
	fail(progress.includes('"state":"accepted"'), 'S3 progress does not close terminally.');
	process.stdout.write(`${JSON.stringify({runId, accepted: true, artifactCount: (await readdir(directory)).length}, null, 2)}\n`);
}

await main();
