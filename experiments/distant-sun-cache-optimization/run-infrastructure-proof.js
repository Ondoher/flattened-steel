#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {cp, lstat, mkdir, mkdtemp, readFile, rename, rm, stat, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {EXPERIMENT_OUTPUT_ROOT, REPOSITORY_ROOT} from './consts.js';
import CacheOptimizationContracts from './lib/CacheOptimizationContracts.js';
import CacheOptimizationContainedFiles from './lib/CacheOptimizationContainedFiles.js';
import ExperimentRun from './lib/ExperimentRun.js';
import ExperimentRunAllocation from './lib/ExperimentRunAllocation.js';
import ExperimentRunHeartbeat from './lib/ExperimentRunHeartbeat.js';
import ExperimentRunTerminalPublisher from './lib/ExperimentRunTerminalPublisher.js';
import {verifySealedRun} from './verify-run.js';

const {acceptConclusion} = CacheOptimizationContracts;
const {isWithin, requireContainedRealFile, requireContainedRealPath, requireRealDirectory, sha256File} =
	CacheOptimizationContainedFiles;

const COMMAND = 'node experiments/distant-sun-cache-optimization/run-infrastructure-proof.js';

/**
 * Require one operation to reject and return its stable diagnostic identity.
 *
 * @param {string} label - Stable proof-case identity.
 * @param {CacheOptimizationAsyncOperation} operation - Operation expected to reject.
 * @returns {Promise<CacheOptimizationInfrastructureRejection>} - Rejection evidence.
 */
async function expectRejection(label, operation) {
	try {
		await operation();
	} catch (error) {
		return {label, rejected: true, name: error?.name ?? typeof error, message: error?.message ?? String(error)};
	}
	throw new Error(`${label} unexpectedly completed.`);
}

/**
 * Build the common initialization record for an infrastructure proof run.
 *
 * @param {string} slug - Descriptive run slug.
 * @param {string} purpose - Run-specific proof purpose.
 * @returns {Promise<CacheOptimizationExperimentRunDefinition>} - Pinned initialization record.
 */
async function runDefinition(slug, purpose) {
	const implementation = await Promise.all(
		[
			'experiments/distant-sun-cache-optimization/run-infrastructure-proof.js',
			'experiments/distant-sun-cache-optimization/consts.js',
			'experiments/distant-sun-cache-optimization/types.d.ts',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRun.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunAllocation.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunHeartbeat.js',
			'experiments/distant-sun-cache-optimization/lib/ExperimentRunTerminalPublisher.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContainedFiles.js',
			'experiments/distant-sun-cache-optimization/lib/CacheOptimizationContracts.js',
			'experiments/distant-sun-cache-optimization/verify-run.js',
		].map(async (relativePath) => {
			const target = await requireContainedRealFile(REPOSITORY_ROOT, relativePath, relativePath);
			return {path: relativePath, byteLength: (await stat(target)).size, sha256: await sha256File(target)};
		}),
	);
	const designPath =
		'agents/topics/poc-experiments/engineering-studies/distant-sun-cache-optimization/design.md';
	const designTarget = await requireContainedRealFile(REPOSITORY_ROOT, designPath, 'Experiment design');
	return {
		slug,
		command: COMMAND,
		inputs: {schemaId: 'distant-sun-cache-optimization-infrastructure-inputs-v1', purpose},
		provenance: {
			schemaId: 'distant-sun-cache-optimization-infrastructure-provenance-v1',
			operation: purpose,
			implementation,
		},
		environment: {
			schemaId: 'distant-sun-cache-optimization-infrastructure-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			cpuModel: os.cpus()[0]?.model ?? null,
		},
		references: {
			schemaId: 'distant-sun-cache-optimization-infrastructure-references-v1',
			design: {path: designPath, byteLength: (await stat(designTarget)).size, sha256: await sha256File(designTarget)},
		},
	};
}

/**
 * Recompute a scratch fixture's artifact identities after a deliberate mutation.
 *
 * @param {string} fixture - Absolute disposable fixture directory.
 * @returns {Promise<void>} - Completion after the scratch manifest is replaced.
 */
async function resealScratchFixture(fixture) {
	const manifestPath = path.join(fixture, 'artifact-manifest.json');
	const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
	manifest.artifacts = await Promise.all(
		manifest.artifacts.map(async (artifact) => {
			const target = await requireContainedRealFile(fixture, artifact.path, artifact.path);
			return {path: artifact.path, byteLength: (await stat(target)).size, sha256: await sha256File(target)};
		}),
	);
	manifest.artifactSetSha256 = createHash('sha256').update(JSON.stringify(manifest.artifacts)).digest('hex');
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

/**
 * Execute the focused self-verifying run-infrastructure proof.
 *
 * @returns {Promise<void>} - Completion after terminal proof publication.
 */
async function main() {
	const proof = await ExperimentRun.create(
		await runDefinition('c0-infrastructure-proof', 'Prove C0 run containment, allocation, sealing, and verification boundaries.'),
	);
	let proofFinalized = false;
	try {
		const checks = [];
		checks.push(
			await expectRejection('constructor capability', () =>
				// @ts-expect-error The proof intentionally omits the private construction capability.
				Promise.resolve(new ExperimentRun({runId: proof.runId, runDirectory: proof.runDirectory})),
			),
		);
		for (const candidate of [
			'../escape.txt',
			'nested\\escape.txt',
			'.hidden',
			'evidence/.hidden',
			path.resolve(proof.runDirectory, 'absolute.txt'),
		]) {
			checks.push(await expectRejection(`artifact path ${candidate}`, () => proof.writeArtifact(candidate, 'invalid')));
		}
		const writerTarget = await mkdtemp(path.join(EXPERIMENT_OUTPUT_ROOT, 'writer-reparse-'));
		const writerJunction = path.join(proof.runDirectory, 'external-reparse-boundary');
		await symlink(writerTarget, writerJunction, 'junction');
		try {
			checks.push(
				await expectRejection('artifact external reparse boundary', () =>
					proof.writeArtifact('external-reparse-boundary/missing/value.txt', 'invalid'),
				),
			);
			checks.push(
				await expectRejection('artifact prevalidation external side effect', () =>
					lstat(path.join(writerTarget, 'missing')),
				),
			);
			const externalProgress = path.join(writerTarget, 'external-progress.jsonl');
			const progressPath = path.join(proof.runDirectory, 'progress.jsonl');
			const progressBackup = path.join(proof.runDirectory, 'progress-proof-backup.jsonl');
			await writeFile(externalProgress, '');
			await rename(progressPath, progressBackup);
			let progressReparseCreated = false;
			try {
				await symlink(writerTarget, progressPath, 'junction');
				progressReparseCreated = true;
				checks.push(
					await expectRejection('progress artifact reparse boundary', () =>
						proof.progress('infrastructure-proof', 'This event must not escape.'),
					),
				);
				if ((await readFile(externalProgress, 'utf8')) !== '') {
					throw new Error('Rejected progress append changed the external target.');
				}
			} finally {
				if (progressReparseCreated) await rm(progressPath);
				await rename(progressBackup, progressPath);
			}
		let scheduledHeartbeat;
		const heartbeatFailure = new Error('Injected heartbeat append failure.');
		const heartbeat = new ExperimentRunHeartbeat(
			() => Promise.reject(heartbeatFailure),
			(callback) => {
				scheduledHeartbeat = callback;
				return () => undefined;
			},
		);
		heartbeat.start();
		const triggerHeartbeat = /** @type {(() => void) | undefined} */ (scheduledHeartbeat);
		if (!triggerHeartbeat) throw new Error('Heartbeat scheduler did not retain its callback.');
		triggerHeartbeat();
		checks.push(await expectRejection('heartbeat append failure surfaced once', () => heartbeat.stop()));
		await heartbeat.stop();
		} finally {
			await rm(writerJunction);
			await rm(writerTarget, {recursive: true});
		}
		const cyclic = {};
		cyclic.self = cyclic;
		/** @type {CacheOptimizationInvalidJsonCase[]} */
		const invalidJsonCases = [
			['undefined JSON', undefined],
			['nested undefined JSON', {value: undefined}],
			['nonfinite JSON', {value: Number.POSITIVE_INFINITY}],
			['cyclic JSON', cyclic],
		];
		for (const [label, value] of invalidJsonCases) {
			checks.push(
				await expectRejection(label, () =>
					proof.writeJsonArtifact(`invalid-${checks.length}.json`, /** @type {any} */ (value)),
				),
			);
		}
		checks.push(await expectRejection('unsupported terminal conclusion', () => Promise.resolve(acceptConclusion('invalid'))));

		const runsRoot = await requireRealDirectory(path.join(EXPERIMENT_OUTPUT_ROOT, 'runs'), 'Experiment runs root');
		const lockPath = path.join(runsRoot, '.run-allocation-lock');
		await mkdir(lockPath);
		try {
			checks.push(
				await expectRejection('allocation lock contention', async () =>
					ExperimentRun.create(await runDefinition('unexpected-lock-bypass', 'This run must never allocate.')),
				),
			);
		} finally {
			await rm(lockPath, {recursive: true});
		}
		/** @type {CacheOptimizationExperimentRunIdentity | undefined} */
		let failedAllocationIdentity;
		const failingAllocation = new ExperimentRunAllocation(async (counterPath, _temporaryCounterPath, next) => {
			const runId = `${String(next).padStart(6, '0')}-injected-allocation-failure`;
			failedAllocationIdentity = {runId, runDirectory: path.join(path.dirname(counterPath), runId)};
			throw new Error('Injected counter-publication failure.');
		});
		checks.push(
			await expectRejection('allocation-local rollback', () =>
				failingAllocation.allocate('injected-allocation-failure'),
			),
		);
		if (!failedAllocationIdentity) throw new Error('Allocation failure hook did not observe an identity.');
		checks.push(
			await expectRejection('allocation orphan absence', () => lstat(failedAllocationIdentity.runDirectory)),
		);
		const preexistingScratchLeaf = path.join(proof.runDirectory, 'preexisting-scratch-leaf');
		await proof.writeArtifact('preexisting-scratch-leaf/marker.txt', 'preserve');
		checks.push(
			await expectRejection('scratch leaf exclusive ownership', () =>
				proof.createScratchDirectory('preexisting-scratch-leaf'),
			),
		);
		checks.push(
			await expectRejection('scratch unowned leaf removal', () =>
				proof.removeScratchDirectory('preexisting-scratch-leaf'),
			),
		);
		if ((await readFile(path.join(preexistingScratchLeaf, 'marker.txt'), 'utf8')) !== 'preserve') {
			throw new Error('Rejected scratch acquisition changed the pre-existing leaf.');
		}

		const publicationDirectory = await proof.createScratchDirectory('terminal-publication-proof');
		const publicationTarget = path.join(publicationDirectory, 'artifact-manifest.json');
		let publicationPendingPath;
		const failingPublisher = new ExperimentRunTerminalPublisher(async (pendingPath, value, options) => {
			publicationPendingPath = pendingPath;
			await writeFile(pendingPath, value.slice(0, 8), options);
			throw new Error('Injected terminal publication write failure.');
		});
		checks.push(
			await expectRejection('atomic terminal publication failure', () =>
				failingPublisher.publish(publicationTarget, 'complete terminal bytes'),
			),
		);
		checks.push(await expectRejection('failed publication terminal path absence', () => lstat(publicationTarget)));
		if (!publicationPendingPath) throw new Error('Terminal publisher did not expose its owned pending path.');
		checks.push(
			await expectRejection('failed publication owned pending cleanup', () => lstat(publicationPendingPath)),
		);
		let failedCleanupPendingPath;
		const cleanupFailingPublisher = new ExperimentRunTerminalPublisher(
			async (pendingPath, value, options) => {
				failedCleanupPendingPath = pendingPath;
				await writeFile(pendingPath, value.slice(0, 8), options);
				throw new Error('Injected terminal publication write failure.');
			},
			rename,
			async () => {
				throw new Error('Injected terminal publication cleanup failure.');
			},
		);
		const cleanupFailure = await expectRejection('terminal publication preserves cleanup failure', () =>
			cleanupFailingPublisher.publish(publicationTarget, 'complete terminal bytes'),
		);
		if (cleanupFailure.name !== 'AggregateError' || !failedCleanupPendingPath) {
			throw new Error('Terminal publisher did not preserve both publication and cleanup failures.');
		}
		checks.push(cleanupFailure);
		let successCleanupCalled = false;
		const successPublisher = new ExperimentRunTerminalPublisher(writeFile, rename, async () => {
			successCleanupCalled = true;
			throw new Error('Successful publication must not invoke pending cleanup.');
		});
		await successPublisher.publish(publicationTarget, 'complete terminal bytes');
		if (successCleanupCalled || (await readFile(publicationTarget, 'utf8')) !== 'complete terminal bytes') {
			throw new Error('Successful terminal publication did not preserve its committed target.');
		}
		await proof.removeScratchDirectory('terminal-publication-proof');

		const subject = await ExperimentRun.create(
			await runDefinition(
				'c0-infrastructure-subject',
				'Provide a sealed subject for immutability and verifier failure proofs.',
			),
		);
		let subjectFinalized = false;
		/** @type {CacheOptimizationArtifactManifest | undefined} */
		let subjectManifest;
		try {
			checks.push(
				await expectRejection('terminal run identity mismatch', () =>
					subject.finalize({
						conclusion: 'accepted',
						result: {
							schemaId: 'distant-sun-cache-optimization-infrastructure-subject-v1',
							runId: '000000-wrong-run',
							conclusion: 'accepted',
							accepted: true,
						},
						report: 'invalid',
					}),
				),
			);
			await subject.writeJsonArtifact('evidence/subject.json', {accepted: true});
			subjectManifest = await subject.finalize({
				conclusion: 'accepted',
				result: {
					schemaId: 'distant-sun-cache-optimization-infrastructure-subject-v1',
					runId: subject.runId,
					conclusion: 'accepted',
					accepted: true,
				},
				report: `# ${subject.runId}\n\nConclusion: **accepted**.\n`,
			});
			subjectFinalized = true;
		} catch (error) {
			if (!subjectFinalized) {
				await subject.finalize({
					conclusion: 'failed',
					result: {
						schemaId: 'distant-sun-cache-optimization-infrastructure-subject-v1',
						runId: subject.runId,
						conclusion: 'failed',
						accepted: false,
						error: {name: error?.name ?? typeof error, message: error?.message ?? String(error)},
					},
					report: `# ${subject.runId}\n\nConclusion: **failed**.\n`,
				});
			}
			throw error;
		}
		if (!subjectManifest) throw new Error('Infrastructure subject ended without a terminal manifest.');
		checks.push(await expectRejection('post-seal write', () => subject.writeArtifact('late.txt', 'late')));
		checks.push(
			await expectRejection('repeated finalization', () =>
				subject.finalize({
					conclusion: 'accepted',
					result: {
						schemaId: 'distant-sun-cache-optimization-infrastructure-subject-v1',
						runId: subject.runId,
						conclusion: 'accepted',
						accepted: true,
					},
					report: 'late',
				}),
			),
		);

		const scratchRoot = await mkdtemp(path.join(EXPERIMENT_OUTPUT_ROOT, 'infrastructure-proof-'));
		try {
			const targetDirectory = path.join(scratchRoot, 'target');
			await mkdir(targetDirectory);
			await writeFile(path.join(targetDirectory, 'value.txt'), 'value');
			await symlink(targetDirectory, path.join(scratchRoot, 'junction'), 'junction');
			checks.push(
				await expectRejection('reparse containment boundary', () =>
					requireContainedRealPath(scratchRoot, 'junction/value.txt', 'Junction fixture'),
				),
			);

			for (const kind of [
				'corrupt',
				'missing',
				'extra',
				'bad-progress-timestamp',
				'bad-progress-count',
				'heartbeat-gap',
				'bad-finalized-at',
			]) {
				const fixture = path.join(scratchRoot, kind);
				await cp(subject.runDirectory, fixture, {recursive: true, errorOnExist: true});
				if (kind === 'corrupt') await writeFile(path.join(fixture, 'result.json'), '{"corrupt":true}\n');
				if (kind === 'missing') await rm(path.join(fixture, 'report.md'));
				if (kind === 'extra') await writeFile(path.join(fixture, 'extra.txt'), 'extra');
				if (kind.startsWith('bad-progress') || kind === 'heartbeat-gap') {
					const progressPath = path.join(fixture, 'progress.jsonl');
					const events = (await readFile(progressPath, 'utf8'))
						.trim()
						.split(/\r?\n/u)
						.map((line) => JSON.parse(line));
					if (kind === 'bad-progress-timestamp') events[0].timestamp = 'not-a-timestamp';
					if (kind === 'bad-progress-count') {
						events[0].completed = 2;
						events[0].total = 1;
					}
					if (kind === 'heartbeat-gap') {
						events[1].timestamp = new Date(Date.parse(events[0].timestamp) + 30_001).toISOString();
					}
					await writeFile(progressPath, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`);
					await resealScratchFixture(fixture);
				}
				if (kind === 'bad-finalized-at') {
					const manifestPath = path.join(fixture, 'artifact-manifest.json');
					const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
					manifest.finalizedAt = 'not-a-timestamp';
					await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
				}
				checks.push(
					await expectRejection(`${kind} sealed artifact set`, () => verifySealedRun(fixture, subject.runId)),
				);
			}
		} finally {
			const outputRoot = await requireRealDirectory(EXPERIMENT_OUTPUT_ROOT, 'Experiment output root');
			if (!isWithin(outputRoot, scratchRoot) || path.dirname(scratchRoot) !== outputRoot) {
				throw new Error('Infrastructure scratch cleanup escaped the output root.');
			}
			await rm(scratchRoot, {recursive: true});
		}

		/** @type {CacheOptimizationTerminalResult} */
		const result = {
			schemaId: 'distant-sun-cache-optimization-infrastructure-proof-v1',
			runId: proof.runId,
			conclusion: 'accepted',
			accepted: true,
			subject: {
				runId: subject.runId,
				artifactSetSha256: subjectManifest.artifactSetSha256,
			},
			checks,
		};
		await proof.writeJsonArtifact('evidence/checks.json', result);
		const manifest = await proof.finalize({
			conclusion: 'accepted',
			result,
			report: `# ${proof.runId}\n\nConclusion: **accepted**.\n\nPassed ${checks.length} run-infrastructure checks.\n`,
		});
		proofFinalized = true;
		process.stdout.write(
			`${JSON.stringify({runId: proof.runId, subjectRunId: subject.runId, checkCount: checks.length, artifactSetSha256: manifest.artifactSetSha256}, null, 2)}\n`,
		);
	} catch (error) {
		if (!proofFinalized) {
			await proof.finalize({
				conclusion: 'failed',
				result: {
					schemaId: 'distant-sun-cache-optimization-infrastructure-proof-v1',
					runId: proof.runId,
					conclusion: 'failed',
					accepted: false,
					error: {name: error?.name ?? typeof error, message: error?.message ?? String(error)},
				},
				report: `# ${proof.runId}\n\nConclusion: **failed**.\n`,
			});
		}
		throw error;
	}
}

await main();
