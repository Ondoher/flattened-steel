#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {appendFile, lstat, mkdir, readFile, readdir, realpath, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {OUTPUT_ROOT, REPOSITORY_ROOT, SOURCE_ROOT} from './consts.js';

const executeFile = promisify(execFile);
const RUN_SLUG = 's6-final-audit';
const CHECKS = Object.freeze([
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

async function realDirectory(target, label) {
	const expected = path.resolve(target);
	const actual = await realpath(expected);
	const information = await lstat(expected);
	fail(information.isDirectory() && !information.isSymbolicLink() && actual.toLowerCase() === expected.toLowerCase(), `${label} is not a real directory.`);
	return actual;
}

async function collectArtifacts(root, relative = '') {
	const artifacts = [];
	for (const name of (await readdir(path.join(root, relative))).sort()) {
		const childRelative = relative ? `${relative}/${name}` : name;
		if (childRelative === 'artifact-manifest.json') continue;
		const absolute = path.join(root, ...childRelative.split('/'));
		const information = await lstat(absolute);
		fail(!information.isSymbolicLink(), `Unexpected S6 symlink: ${childRelative}`);
		if (information.isDirectory()) artifacts.push(...(await collectArtifacts(root, childRelative)));
		else {
			const bytes = await readFile(absolute);
			artifacts.push({path: childRelative, byteLength: bytes.byteLength, sha256: sha256(bytes)});
		}
	}
	return artifacts;
}

async function main() {
	const repositoryRoot = await realDirectory(REPOSITORY_ROOT, 'Repository root');
	const sourceRoot = await realDirectory(SOURCE_ROOT, 'Experiment source root');
	fail(isWithin(repositoryRoot, sourceRoot), 'Experiment source escaped repository.');
	await mkdir(OUTPUT_ROOT, {recursive: true});
	const outputRoot = await realDirectory(OUTPUT_ROOT, 'Experiment output root');
	await mkdir(path.join(outputRoot, 'runs'), {recursive: true});
	const runsRoot = await realDirectory(path.join(outputRoot, 'runs'), 'Runs root');
	const runId = `${Date.now()}-${RUN_SLUG}`;
	const runDirectory = path.join(runsRoot, runId);
	await mkdir(runDirectory);
	const progressPath = path.join(runDirectory, 'progress.jsonl');
	await writeFile(progressPath, '', {flag: 'wx'});
	const progress = async (phase, message, completed, total, state) =>
		appendFile(progressPath, `${JSON.stringify({timestamp: new Date().toISOString(), phase, ...(completed === undefined ? {} : {completed, total}), message, ...(state ? {state} : {})})}\n`);
	try {
		await progress('initialize', 'Initializing the independent S6 final evidence audit.');
		const outcomes = [];
		for (const [index, check] of CHECKS.entries()) {
			await progress('verify', `Running ${check.id}.`, index, CHECKS.length);
			const verifierPath = path.join(sourceRoot, check.verifier);
			const sourceBytes = await readFile(verifierPath);
			const {stdout, stderr} = await executeFile(process.execPath, [verifierPath, ...check.args], {
				cwd: repositoryRoot,
				maxBuffer: 32 * 1024 * 1024,
			});
			fail(stderr.trim() === '', `${check.id} wrote unexpected stderr: ${stderr}`);
			const parsed = JSON.parse(stdout);
			fail(parsed.accepted === true, `${check.id} did not accept its evidence.`);
			outcomes.push({
				id: check.id,
				command: [process.execPath, `experiments/gpu-resident-shared-block-cache/${check.verifier}`, ...check.args],
				verifier: {path: `experiments/gpu-resident-shared-block-cache/${check.verifier}`, sha256: sha256(sourceBytes)},
				stdoutSha256: sha256(Buffer.from(stdout)),
				result: parsed,
			});
			await progress('verify', `Accepted ${check.id}.`, index + 1, CHECKS.length);
		}

		const result = {
			schemaId: 'gpu-resident-shared-block-cache-s6-final-audit-result-v1',
			runId,
			accepted: true,
			classification: 'accepted-contained-experiment-evidence',
			checks: outcomes,
			findings: {
				exactSpectralSamples: 'S4 exact Float32 probes and S9.2 RGBA packet probes pass with zero mismatches.',
				lifecycleSafety: 'Corrupt, missing, failed-upload, and stale-publication controls preserve last-good state.',
				boundedResidency: 'The switching proof remains within 24 blocks; the 20-second prepared route separately qualifies a 62-layer resident packet atlas on the reference GPU.',
				noHiddenDenseAtlasPath: 'The shared-block path publishes authenticated block slots and row metadata. Complete dense-scene reconstruction and tiled upload occur only in the explicitly declared S5 comparison baseline.',
				animation: 'Both native-4K trace variants retain complete GPU timing and deterministic held-frame replay; owner review accepts the result as smooth enough for the intended large-display use.',
			},
			limitations: [
				'Sunrise and sunset appear somewhat off overall; the often-too-gray horizon is the clearest symptom and is deferred.',
				'S8 spectral qualification, reconstruction, packetized-integration, preset, and Auto-policy candidates remain deferred.',
				'S9.7 temporal cache interpolation remains deferred.',
				'Browser timing is qualifying evidence; physical display scanout was not externally captured.',
			],
			rejectedOrSupersededAlternatives: [
				'Scalar R32F live lookup: rejected because manual bilinear spectral reconstruction did not complete the bounded 4K workload.',
				'Non-preserved WebGL held-frame encoding: superseded after black-frame visual inspection.',
				'Persistent browser upload stream and unsplit muxer writes: superseded by bounded discrete batches.',
			],
		};
		await Promise.all([
			writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'checks.json'), `${JSON.stringify(outcomes, null, 2)}\n`, {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'command.txt'), 'node experiments/gpu-resident-shared-block-cache/run-s6-final-audit.js\n', {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'environment.json'), `${JSON.stringify({node: process.version, platform: process.platform, architecture: process.arch, logicalCpuCount: os.cpus().length}, null, 2)}\n`, {flag: 'wx'}),
			writeFile(path.join(runDirectory, 'provenance.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s6-final-audit-provenance-v1', operation: 'Execute the complete canonical verifier set in fresh Node processes; require every check to accept; retain verifier identities, commands, output identities, classification, limitations, and rejected alternatives.', sourceIdentities: {runner: {path: 'experiments/gpu-resident-shared-block-cache/run-s6-final-audit.js', sha256: sha256(await readFile(fileURLToPath(import.meta.url)))}}}, null, 2)}\n`, {flag: 'wx'}),
		]);
		await progress('terminal', 'Accepted the independent S6 final evidence audit.', undefined, undefined, 'accepted');
		const artifacts = await collectArtifacts(runDirectory);
		const artifactSetSha256 = sha256(Buffer.from(JSON.stringify(artifacts)));
		await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s6-final-audit-artifact-manifest-v1', artifacts, artifactSetSha256}, null, 2)}\n`, {flag: 'wx'});
		process.stdout.write(`${JSON.stringify({runId, accepted: true, artifactSetSha256, checkCount: outcomes.length, classification: result.classification}, null, 2)}\n`);
	} catch (error) {
		await writeFile(path.join(runDirectory, 'result.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s6-final-audit-result-v1', runId, accepted: false, error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined}}, null, 2)}\n`, {flag: 'wx'}).catch(() => undefined);
		await progress('terminal', `S6 audit failed: ${error instanceof Error ? error.message : String(error)}`, undefined, undefined, 'failed').catch(() => undefined);
		const artifacts = await collectArtifacts(runDirectory).catch(() => []);
		await writeFile(path.join(runDirectory, 'artifact-manifest.json'), `${JSON.stringify({schemaId: 'gpu-resident-shared-block-cache-s6-final-audit-artifact-manifest-v1', artifacts, artifactSetSha256: sha256(Buffer.from(JSON.stringify(artifacts)))}, null, 2)}\n`, {flag: 'wx'}).catch(() => undefined);
		throw error;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
