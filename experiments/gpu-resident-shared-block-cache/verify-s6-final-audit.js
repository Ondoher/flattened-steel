#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {lstat, readFile, readdir, realpath} from 'node:fs/promises';
import path from 'node:path';

import {OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const executeFile = promisify(execFile);
const DEFAULT_RUN_ID = '1788926996374-s6-final-audit';
const EXPECTED = Object.freeze([
	Object.freeze({id: 's3-browser-host', verifier: 'verify-s3-atlas-host-smoke.js', args: ['1788886953998-s3-atlas-host-smoke']}),
	Object.freeze({id: 's3-residency-model', verifier: 'verify-s3-residency-state.js', args: []}),
	Object.freeze({id: 's4-s5-core', verifier: 'verify-s4-s5-evidence.js', args: []}),
	Object.freeze({id: 's9-whole-route-capacity', verifier: 'verify-s9-whole-route-capacity.js', args: ['1788913194598-s9-whole-route-capacity']}),
	Object.freeze({id: 's9-packet-renderer', verifier: 'verify-s9-shared-packet-renderer.js', args: []}),
	Object.freeze({id: 's9-trace-fov78', verifier: 'verify-s9-animation-trace.js', args: []}),
	Object.freeze({id: 's9-trace-fov55', verifier: 'verify-s9-animation-trace-fov55.js', args: []}),
	Object.freeze({id: 's9-replay', verifier: 'verify-s9-presentation-replay.js', args: []}),
	Object.freeze({id: 's9-video', verifier: 'verify-s9-deterministic-video.js', args: []}),
	Object.freeze({id: 's9-publication', verifier: 'verify-s9-publish-evidence.js', args: []}),
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

async function collectArtifacts(root, relative = '') {
	const artifacts = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `S6 audit contains a symlink: ${childRelative}`);
		if (information.isDirectory()) artifacts.push(...(await collectArtifacts(root, childRelative)));
		else {
			const bytes = await readFile(absolute);
			artifacts.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return artifacts;
}

const repositoryRoot = await realpath(REPOSITORY_ROOT);
const sourceRoot = await realpath(SOURCE_ROOT);
const outputRoot = await realpath(OUTPUT_ROOT);
fail(isWithin(repositoryRoot, sourceRoot) && isWithin(path.join(repositoryRoot, 'tmp'), outputRoot), 'S6 roots escaped repository boundaries.');
const runId = process.argv[2] ?? DEFAULT_RUN_ID;
fail(/^\d+-s6-final-audit$/u.test(runId), 'Invalid S6 audit run ID.');
const expectedRunRoot = path.join(outputRoot, 'runs', runId);
const runRoot = await realpath(expectedRunRoot);
fail(runRoot.toLowerCase() === expectedRunRoot.toLowerCase() && isWithin(outputRoot, runRoot), 'S6 audit escaped output root.');
fail(!(await lstat(runRoot)).isSymbolicLink(), 'S6 audit root is a symlink.');

const [resultBytes, checksBytes, manifestBytes, progressBytes, provenanceBytes] = await Promise.all([
	readFile(path.join(runRoot, 'result.json')),
	readFile(path.join(runRoot, 'checks.json')),
	readFile(path.join(runRoot, 'artifact-manifest.json')),
	readFile(path.join(runRoot, 'progress.jsonl')),
	readFile(path.join(runRoot, 'provenance.json')),
]);
const result = JSON.parse(resultBytes);
const checks = JSON.parse(checksBytes);
const manifest = JSON.parse(manifestBytes);
const provenance = JSON.parse(provenanceBytes);
fail(result.schemaId === 'gpu-resident-shared-block-cache-s6-final-audit-result-v1', 'Unexpected S6 result schema.');
fail(result.runId === runId && result.accepted === true, 'S6 audit is not accepted.');
fail(result.classification === 'accepted-contained-experiment-evidence', 'S6 classification changed.');
fail(JSON.stringify(result.checks) === JSON.stringify(checks), 'S6 checks and result diverged.');
fail(checks.length === EXPECTED.length, 'S6 check count changed.');
fail(provenance.schemaId === 'gpu-resident-shared-block-cache-s6-final-audit-provenance-v1', 'Unexpected S6 provenance schema.');
const artifacts = await collectArtifacts(runRoot);
fail(JSON.stringify(artifacts) === JSON.stringify(manifest.artifacts), 'S6 audit artifact identities changed.');
fail(sha256(Buffer.from(JSON.stringify(artifacts))) === manifest.artifactSetSha256, 'S6 audit artifact-set identity changed.');
const terminalEvents = progressBytes
	.toString('utf8')
	.trim()
	.split('\n')
	.map((line) => JSON.parse(line))
	.filter((event) => event.state);
fail(terminalEvents.length === 1 && terminalEvents[0].state === 'accepted', 'S6 audit terminal state is not uniquely accepted.');
fail(result.findings.noHiddenDenseAtlasPath.includes('explicitly declared S5 comparison baseline'), 'S6 dense-path classification is missing.');
fail(result.limitations.some((value) => value.includes('too-gray horizon')), 'S6 horizon limitation is missing.');

const rerun = [];
for (const [index, expected] of EXPECTED.entries()) {
	const retained = checks[index];
	fail(retained.id === expected.id, `S6 check order changed at ${index}.`);
	const verifierPath = path.join(sourceRoot, expected.verifier);
	const verifierBytes = await readFile(verifierPath);
	fail(retained.verifier.sha256 === sha256(verifierBytes), `${expected.id} verifier identity changed.`);
	const {stdout, stderr} = await executeFile(process.execPath, [verifierPath, ...expected.args], {
		cwd: repositoryRoot,
		maxBuffer: 32 * 1024 * 1024,
	});
	fail(stderr.trim() === '', `${expected.id} rerun wrote unexpected stderr.`);
	const parsed = JSON.parse(stdout);
	fail(parsed.accepted === true, `${expected.id} rerun rejected its evidence.`);
	fail(sha256(Buffer.from(stdout)) === retained.stdoutSha256, `${expected.id} verifier output changed.`);
	rerun.push({id: expected.id, accepted: true});
}

process.stdout.write(`${JSON.stringify({runId, accepted: true, artifactSetSha256: manifest.artifactSetSha256, classification: result.classification, rerun}, null, 2)}\n`);
