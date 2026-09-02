#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {assertFileInventoriesEqual, createFileInventory, sha256File} from '../../harness/lib/hashes.js';
import {REPOSITORY_ROOT, assertRepositoryIdentity} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {buildCr6gRuntimePackage} from '../stellar/Cr6gBrightest2000RuntimePackage.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr6g-brightest-2000-runtime-capacity.js';
const FIXTURE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cr6g-brightest-2000-runtime-capacity-v1.json';
const HARNESS_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/harness/cr6g-brightest-2000-runtime-capacity-browser.js';
const BUILDER_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/stellar/Cr6gBrightest2000RuntimePackage.js';
const RUNS_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'color-reset', 'runs');

function repositoryPath(relativePath) {
	return path.join(REPOSITORY_ROOT, ...relativePath.split('/'));
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function protectedInventory() {
	return {
		algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')),
		flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32')),
	};
}

function compareProtected(before, after) {
	for (const key of Object.keys(before)) {
		assertFileInventoriesEqual(before[key], after[key], `CR6G protected ${key}`);
	}
}

async function main() {
	const fixture = JSON.parse(await readFile(repositoryPath(FIXTURE_RELATIVE_PATH), 'utf8'));
	const run = await initializeColorResetRunRecord({
		slug: fixture.experiment.slug,
		command: COMMAND,
		inputs: {fixture: FIXTURE_RELATIVE_PATH, parents: fixture.parents},
		provenance: {purpose: fixture.experiment.question, runtime: fixture.runtime},
		environment: {node: process.version, platform: process.platform},
		references: {plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md'},
	});
	let finalizationStarted = false;
	try {
		await assertRepositoryIdentity();
		const before = await protectedInventory();
		await run.writeJsonArtifact('evidence/protected-sources-before.json', before);
		const [rosterVerification, spectraVerification] = await Promise.all([
			verifyColorResetRun(fixture.parents.rosterRunId),
			verifyColorResetRun(fixture.parents.spectraRunId),
		]);
		requireCondition(rosterVerification.verified && spectraVerification.verified, 'CR6G parent verification failed.');
		requireCondition(rosterVerification.artifactSetSha256 === fixture.parents.rosterArtifactSetSha256, 'CR6G roster parent changed.');
		requireCondition(spectraVerification.artifactSetSha256 === fixture.parents.spectraArtifactSetSha256, 'CR6G spectra parent changed.');
		const rosterPath = path.join(RUNS_ROOT, fixture.parents.rosterRunId, ...fixture.parents.rosterArtifactPath.split('/'));
		const spectraPath = path.join(RUNS_ROOT, fixture.parents.spectraRunId, ...fixture.parents.spectraArtifactPath.split('/'));
		requireCondition(await sha256File(rosterPath) === fixture.parents.rosterSha256, 'CR6G roster artifact changed.');
		const [roster, spectraArtifact] = await Promise.all([
			readFile(rosterPath, 'utf8').then(JSON.parse),
			readFile(spectraPath, 'utf8').then(JSON.parse),
		]);
		const started = performance.now();
		const runtimePackage = buildCr6gRuntimePackage({members: roster.members, packets: spectraArtifact.packets});
		const buildMilliseconds = performance.now() - started;
		await run.writeArtifact(fixture.outputs.membersBinary, Buffer.from(runtimePackage.memberTexels.buffer));
		await run.writeArtifact(fixture.outputs.spectraBinary, Buffer.from(runtimePackage.spectraTexels.buffer));
		const membersPath = path.join(run.runDirectory, ...fixture.outputs.membersBinary.split('/'));
		const spectraBinaryPath = path.join(run.runDirectory, ...fixture.outputs.spectraBinary.split('/'));
		const memberIdentity = {path: fixture.outputs.membersBinary, url: `/run/${fixture.outputs.membersBinary}`, byteLength: runtimePackage.memberTexels.byteLength, sha256: await sha256File(membersPath)};
		const spectraIdentity = {path: fixture.outputs.spectraBinary, url: `/run/${fixture.outputs.spectraBinary}`, byteLength: runtimePackage.spectraTexels.byteLength, sha256: await sha256File(spectraBinaryPath)};
		const packageManifest = {
			schemaId: 'algorithm32-color-reset-cr6g-runtime-package-manifest-v1',
			contract: runtimePackage.contract,
			parents: fixture.parents,
			memberIds: runtimePackage.memberIds,
			artifacts: {members: memberIdentity, spectra: spectraIdentity},
			buildMilliseconds,
			replacementSeam: 'ordered immutable memberIds plus separate RGBA32F member and R32F Native15 payloads',
		};
		await run.writeJsonArtifact(fixture.outputs.packageManifest, packageManifest);
		await run.writeJsonArtifact('browser/config.json', {
			...fixture,
			browserInput: {members: memberIdentity, spectra: spectraIdentity},
		});
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6g-brightest-2000-runtime-capacity-browser.js',
			exportName: 'runCr6gBrightest2000RuntimeCapacityBrowser',
			servedRoots: {'/run/': run.runDirectory},
			allowedArtifactPaths: [fixture.outputs.diagnosticImage],
			uploadLimitBytes: 4 * 1024 * 1024,
			timeoutMilliseconds: 180000,
		});
		const after = await protectedInventory();
		compareProtected(before, after);
		const totalPayloadBytes = memberIdentity.byteLength + spectraIdentity.byteLength;
		const gates = {
			parentsVerified: true,
			memberCount: runtimePackage.memberIds.length === fixture.runtime.memberCount,
			memberPayloadBytes: memberIdentity.byteLength === 2000 * 4 * 4,
			spectraPayloadBytes: spectraIdentity.byteLength === 2000 * 15 * 4,
			totalPayloadBounded: totalPayloadBytes <= fixture.runtime.maximumTotalPayloadBytes,
			browserCompleted: browser.result.renderComplete === true,
			webgl2Capacity: browser.result.facts.maximumTextureSize >= 2000,
			gpuSamplesExact: browser.result.facts.sampleExact === true,
			gpuSampleCount: browser.result.facts.sampleCount === 28,
			webglErrorFree: browser.result.facts.webglErrorCount === 0,
			diagnosticWrittenBeforeGates: browser.uploads.length === 1,
			protectedSourcesUnchanged: true,
		};
		for (const [name, passed] of Object.entries(gates)) requireCondition(passed, `CR6G gate failed: ${name}`);
		const proof = {
			schemaId: 'algorithm32-color-reset-cr6g-runtime-capacity-proof-v1',
			accepted: true,
			gates,
			parents: fixture.parents,
			package: packageManifest,
			browser: browser.result,
			summary: {memberCount: 2000, totalPayloadBytes, buildMilliseconds, renderer: browser.result.facts.renderer},
			implementation: {
				fixture: {path: FIXTURE_RELATIVE_PATH, sha256: await sha256File(repositoryPath(FIXTURE_RELATIVE_PATH))},
				builder: {path: BUILDER_RELATIVE_PATH, sha256: await sha256File(repositoryPath(BUILDER_RELATIVE_PATH))},
				harness: {path: HARNESS_RELATIVE_PATH, sha256: await sha256File(repositoryPath(HARNESS_RELATIVE_PATH))},
				runner: {path: COMMAND.slice('node '.length), sha256: await sha256File(repositoryPath(COMMAND.slice('node '.length)))},
			},
			claimBoundary: 'Contained 2,000-member package capacity, upload, sampled float32 readback, and replacement seam; no appearance or production claim.',
		};
		await run.writeJsonArtifact(fixture.outputs.proof, proof);
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: CR6G runtime capacity\n\nConclusion: **accepted**.\n\nThe exact 2,000-member package occupies ${totalPayloadBytes} bytes and passes WebGL2 upload plus sampled float32 readback on ${browser.result.facts.renderer}.\n`});
		const verification = await verifyColorResetRun(run.runId);
		requireCondition(verification.verified, 'CR6G terminal verification failed.');
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, independentlyVerified: true, summary: proof.summary, gates}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			await run.writeJsonArtifact('evidence/failure.json', {message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null});
			await run.finalize({conclusion: 'failed', result: {error: error instanceof Error ? error.message : String(error)}, report: `# ${run.runId}: CR6G failed\n\n${error instanceof Error ? error.message : String(error)}\n`});
		}
		throw error;
	}
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
	process.exitCode = 1;
});
