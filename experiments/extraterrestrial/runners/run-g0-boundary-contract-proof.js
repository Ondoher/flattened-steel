#!/usr/bin/env node

import { execFile } from 'node:child_process';
import {
	lstat,
	readFile,
} from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import {
	assertContainmentPreconditions,
	assertCreatablePathContained,
	assertExistingRealPathContained,
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	listTrackedFiles,
	loadContainmentPolicy,
	readSourceGitIdentity,
	verifyProtectedTrackedInventory,
} from '../harness/lib/containment.js';
import {
	canonicalJson,
	runG0ContractProof,
} from '../harness/lib/g0-contract.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	sha256File,
} from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import {
	REQUIRED_RUN_RECORDS,
	initializeRunRecord,
	normalizeRunSlug,
} from '../harness/lib/run-record.js';
import {
	BASELINE_MANIFEST_PATH,
	BASELINE_ROOT,
	BASELINE_SOURCE_ROOT,
	CANDIDATE_ROOT,
	CANDIDATE_SOURCE_ROOT,
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	PRODUCTION_SOURCE_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
	toRepositoryRelativePath,
} from '../harness/lib/roots.js';
import { captureDependencyState } from '../harness/lib/snapshot.js';

const execFileAsync = promisify(execFile);
const COMMAND =
	'node experiments/extraterrestrial/runners/run-g0-boundary-contract-proof.js';
const FIXTURE_PATH = path.join(
	EXPERIMENT_ROOT,
	'fixtures',
	'g0-synthetic-celestial-v1.json',
);
const DECISION_MANIFEST_PATH = path.join(
	EXPERIMENT_ROOT,
	'decisions',
	'g0-decision-manifest-v1.json',
);
const CELESTIAL_SCHEMA_PATH = path.join(
	EXPERIMENT_ROOT,
	'schemas',
	'celestial-contract-v1.schema.json',
);
const DECISION_SCHEMA_PATH = path.join(
	EXPERIMENT_ROOT,
	'schemas',
	'g0-decision-manifest-v1.schema.json',
);
const BASELINE_SMOKE_PATH = path.join(
	EXPERIMENT_ROOT,
	'harness',
	'probes',
	'g0-baseline-smoke.js',
);

function requireCondition(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

async function readJson(filePath, label) {
	try {
		return JSON.parse(await readFile(filePath, 'utf8'));
	} catch (error) {
		throw new Error(`${label} is not valid JSON: ${error.message}`);
	}
}

function inventorySummary(inventory) {
	return {
		schemaId: inventory.schemaId,
		fileCount: inventory.fileCount,
		totalBytes: inventory.totalBytes,
		aggregateSha256: inventory.aggregateSha256,
	};
}

function closureProjection(closure) {
	return {
		entries: closure.entries,
		files: closure.files,
		edges: closure.edges,
		bareResolutions: closure.bareResolutions,
	};
}

async function expectRejection(operation, label) {
	try {
		await operation();
	} catch {
		return true;
	}
	throw new Error(`${label} was not rejected.`);
}

async function gitCheckIgnored(repositoryRelativePath) {
	try {
		await execFileAsync(
			'git',
			[
				'-C',
				REPOSITORY_ROOT,
				'check-ignore',
				'-q',
				'--',
				repositoryRelativePath,
			],
			{
				encoding: 'utf8',
				windowsHide: true,
			},
		);
		return true;
	} catch (error) {
		if (error?.code === 1) {
			return false;
		}
		throw error;
	}
}

async function verifyContentReferences(decisionManifest) {
	const references = [
		...decisionManifest.schemas,
		...decisionManifest.fixtures,
	];
	const verified = [];
	for (const reference of references) {
		const absolutePath = path.join(
			REPOSITORY_ROOT,
			...reference.path.split('/'),
		);
		await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			absolutePath,
			`Content reference ${reference.id}`,
		);
		const observed = `sha256:${await sha256File(absolutePath)}`;
		requireCondition(
			observed === reference.sha256,
			`Content reference hash differs for ${reference.id}.`,
		);
		verified.push({
			id: reference.id,
			path: reference.path,
			sha256: observed,
		});
	}
	return verified;
}

async function verifyInitializedRun(run) {
	requireCondition(
		normalizeRunSlug('G0 boundary + contract proof')
			=== 'g0-boundary-contract-proof',
		'Run slug normalization is not canonical.',
	);
	requireCondition(
		/^[0-9]{6}-g0-boundary-contract-proof$/u.test(run.runId),
		'Allocated run identity is not canonical.',
	);
	for (const relativePath of REQUIRED_RUN_RECORDS) {
		const info = await lstat(
			path.join(run.runDirectory, ...relativePath.split('/')),
		);
		requireCondition(
			info.isFile() && !info.isSymbolicLink(),
			`Initialized run record is not a regular file: ${relativePath}`,
		);
	}
	await expectRejection(
		() => lstat(path.join(run.runDirectory, 'artifact-manifest.json')),
		'A terminal manifest before proof work',
	);
	return true;
}

async function executeBaselineSmoke() {
	const { stdout, stderr } = await execFileAsync(
		process.execPath,
		[BASELINE_SMOKE_PATH],
		{
			cwd: EXPERIMENT_ROOT,
			encoding: 'utf8',
			maxBuffer: 16 * 1024 * 1024,
			windowsHide: true,
		},
	);
	requireCondition(
		stderr.trim() === '',
		`Baseline smoke emitted stderr: ${stderr.trim()}`,
	);
	const result = JSON.parse(stdout);
	requireCondition(result.accepted === true, 'Baseline smoke was not accepted.');
	return result;
}

async function collectBoundaryEvidence(run) {
	const roots = await assertRepositoryIdentity();
	const policy = await assertContainmentPreconditions();
	const [
		baselineManifest,
		fixture,
		decisionManifest,
		celestialSchema,
		decisionSchema,
	] = await Promise.all([
		readJson(BASELINE_MANIFEST_PATH, 'Baseline manifest'),
		readJson(FIXTURE_PATH, 'G0 celestial fixture'),
		readJson(DECISION_MANIFEST_PATH, 'G0 decision manifest'),
		readJson(CELESTIAL_SCHEMA_PATH, 'Celestial contract schema'),
		readJson(DECISION_SCHEMA_PATH, 'Decision-manifest schema'),
	]);

	const [
		protectedBefore,
		sourceBefore,
		baselineBefore,
		candidateBefore,
		sourceGitBefore,
		contentReferences,
		dependencyState,
		trackedFiles,
		outputRootIgnored,
	] = await Promise.all([
		createProtectedTrackedInventory(policy),
		createFileInventory(PRODUCTION_SOURCE_ROOT),
		createFileInventory(BASELINE_SOURCE_ROOT),
		createFileInventory(CANDIDATE_SOURCE_ROOT),
		readSourceGitIdentity(),
		verifyContentReferences(decisionManifest),
		captureDependencyState(policy),
		listTrackedFiles(),
		gitCheckIgnored('tmp/extraterrestrial/.g0-ignore-probe'),
	]);

	assertFileInventoriesEqual(
		baselineManifest.source.inventory,
		sourceBefore,
		'Sealed source checkpoint',
	);
	assertFileInventoriesEqual(
		baselineManifest.source.inventory,
		baselineBefore,
		'Sealed baseline',
	);
	assertFileInventoriesEqual(
		baselineManifest.source.inventory,
		candidateBefore,
		'Initial candidate',
	);
	assertFileInventoriesEqual(
		baselineManifest.protectedTrackedFiles,
		protectedBefore,
		'Snapshot protected-file inventory',
	);
	requireCondition(
		canonicalJson(sourceGitBefore) === canonicalJson(baselineManifest.source.git),
		'Source Git identity differs from the sealed checkpoint.',
	);
	requireCondition(
		canonicalJson(dependencyState)
			=== canonicalJson(baselineManifest.dependencies),
		'Experiment dependency closure differs from the sealed checkpoint.',
	);
	requireCondition(
		outputRootIgnored,
		'tmp/extraterrestrial is not ignored by Git.',
	);
	const generatedOutputUntracked = !trackedFiles.some((file) => (
		file === 'tmp/extraterrestrial'
		|| file.startsWith('tmp/extraterrestrial/')
	));
	requireCondition(
		generatedOutputUntracked,
		'Generated extraterrestrial output is present in source control.',
	);

	const candidateClosure = await buildStaticModuleClosure({
		candidateRoot: CANDIDATE_SOURCE_ROOT,
		entryFiles: baselineManifest.runnableBoundary.entryFiles,
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	requireCondition(
		canonicalJson(closureProjection(candidateClosure))
			=== canonicalJson({
				entries: baselineManifest.runnableBoundary.entryFiles,
				files: baselineManifest.runnableBoundary.closureFiles,
				edges: baselineManifest.runnableBoundary.importEdges,
				bareResolutions:
					baselineManifest.runnableBoundary.bareResolutions,
			}),
		'Candidate runnable closure differs from the sealed manifest.',
	);
	const proofClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'harness/probes/g0-baseline-smoke.js',
			'runners/create-g0-snapshot.js',
			'runners/run-g0-boundary-contract-proof.js',
			'runners/verify-run.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process',
			'node:crypto',
			'node:fs',
			'node:fs/promises',
			'node:module',
			'node:os',
			'node:path',
			'node:url',
			'node:util',
		],
	});

	const sourceEscapeRejected = await expectRejection(
		() => assertCreatablePathContained(
			EXPERIMENT_ROOT,
			path.join(REPOSITORY_ROOT, 'src', 'algorithm32'),
			'Prohibited production write',
		),
		'Production source write escape',
	);
	const outputEscapeRejected = await expectRejection(
		() => assertCreatablePathContained(
			OUTPUT_ROOT,
			path.join(EXPERIMENT_ROOT, 'generated-output'),
			'Prohibited generated-output write',
		),
		'Generated-output source-root escape',
	);
	await Promise.all([
		assertCreatablePathContained(
			EXPERIMENT_ROOT,
			DECISION_MANIFEST_PATH,
			'Experiment source/control write',
		),
		assertCreatablePathContained(
			OUTPUT_ROOT,
			path.join(RUNS_ROOT, run.runId, 'evidence', 'probe.json'),
			'Experiment generated-output write',
		),
		assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree'),
		assertNoReparseEntries(BASELINE_ROOT, 'Sealed baseline tree'),
		assertNoReparseEntries(CANDIDATE_ROOT, 'Candidate tree'),
	]);
	requireCondition(
		sourceEscapeRejected && outputEscapeRejected,
		'Path escape controls did not reject both destination classes.',
	);

	const baselineSmoke = await executeBaselineSmoke();

	const [
		sourceAfter,
		baselineAfter,
		candidateAfter,
		protectedAfter,
		sourceGitAfter,
	] = await Promise.all([
		createFileInventory(PRODUCTION_SOURCE_ROOT),
		createFileInventory(BASELINE_SOURCE_ROOT),
		createFileInventory(CANDIDATE_SOURCE_ROOT),
		verifyProtectedTrackedInventory(protectedBefore, policy),
		readSourceGitIdentity(),
	]);
	assertFileInventoriesEqual(sourceBefore, sourceAfter, 'Production source');
	assertFileInventoriesEqual(baselineBefore, baselineAfter, 'Sealed baseline');
	assertFileInventoriesEqual(candidateBefore, candidateAfter, 'Initial candidate');
	requireCondition(
		canonicalJson(sourceGitBefore) === canonicalJson(sourceGitAfter),
		'Source Git identity changed during G0 proof work.',
	);

	const containmentEvidence = {
		schemaVersion: 'g0-containment-evidence-v1',
		sourceRoot: 'experiments/extraterrestrial',
		outputRoot: 'tmp/extraterrestrial',
		baselineImmutable: true,
		baselineProbesPassed: baselineSmoke.accepted === true,
		candidateByteIdentical:
			candidateAfter.aggregateSha256 === baselineAfter.aggregateSha256,
		contentReferencesVerified:
			contentReferences.length
				=== decisionManifest.schemas.length + decisionManifest.fixtures.length,
		dependencyClosureContained:
			candidateClosure.files.length > 0 && proofClosure.files.length > 0,
		generatedOutputUntracked,
		immutableRunProtocolVerified: await verifyInitializedRun(run),
		outputRootIgnored,
		outputWritesContained: outputEscapeRejected,
		protectedFingerprintsUnchanged:
			protectedAfter.aggregateSha256 === protectedBefore.aggregateSha256,
		sourceWritesContained: sourceEscapeRejected,
		symlinkAndJunctionEscapesRejected: true,
	};

	const boundaryEvidence = {
		schemaId: 'algorithm32-extraterrestrial-g0-boundary-evidence-v1',
		roots: {
			repository: toRepositoryRelativePath(roots.repositoryRoot) || '.',
			source: toRepositoryRelativePath(roots.productionSourceRoot),
			experiment: toRepositoryRelativePath(roots.experimentRoot),
			baseline: toRepositoryRelativePath(BASELINE_SOURCE_ROOT),
			candidate: toRepositoryRelativePath(CANDIDATE_SOURCE_ROOT),
			output: toRepositoryRelativePath(roots.outputRoot),
		},
		sourceGit: sourceGitAfter,
		inventories: {
			source: inventorySummary(sourceAfter),
			baseline: inventorySummary(baselineAfter),
			candidate: inventorySummary(candidateAfter),
			protectedBefore: inventorySummary(protectedBefore),
			protectedAfter: inventorySummary(protectedAfter),
		},
		baselineManifest: {
			path: toRepositoryRelativePath(BASELINE_MANIFEST_PATH),
			sha256: await sha256File(BASELINE_MANIFEST_PATH),
			schemaId: baselineManifest.schemaId,
			createdAt: baselineManifest.createdAt,
			excludedCopiedFiles:
				baselineManifest.runnableBoundary.excludedFileCount,
		},
		dependencies: {
			direct: dependencyState.directDependencies.map(({ name, version }) => ({
				name,
				version,
			})),
			controlFiles: dependencyState.controlFiles,
		},
		closures: {
			candidate: {
				entryCount: candidateClosure.entries.length,
				fileCount: candidateClosure.files.length,
				edgeCount: candidateClosure.edges.length,
				bareResolutionCount: candidateClosure.bareResolutions.length,
			},
			proof: {
				entries: proofClosure.entries,
				fileCount: proofClosure.files.length,
				edgeCount: proofClosure.edges.length,
				nodeBuiltins: proofClosure.nodeBuiltins,
				bareResolutionCount: proofClosure.bareResolutions.length,
			},
		},
		contentReferences,
		baselineSmoke,
		containmentEvidence,
	};

	return {
		baselineManifest,
		fixture,
		decisionManifest,
		celestialSchema,
		decisionSchema,
		containmentEvidence,
		boundaryEvidence,
	};
}

function createReport(runId, proof, boundary) {
	const assertionSummary =
		`${proof.summary.acceptedAssertionCount}/${proof.summary.assertionCount}`;
	const negativeAccepted =
		proof.negativeControls.filter(({ accepted }) => accepted).length;
	return [
		`# ${runId}: G0 boundary and contract proof`,
		'',
		`Conclusion: **${proof.status}**`,
		'',
		proof.claimBoundary,
		'',
		`- Contract assertions: ${assertionSummary} accepted.`,
		`- Classified negative controls: ${negativeAccepted}/${proof.summary.negativeControlCount} accepted.`,
		`- Production/baseline/candidate files: ${boundary.inventories.source.fileCount}.`,
		`- Byte-identical aggregate: ${boundary.inventories.source.aggregateSha256}.`,
		`- Candidate runtime closure: ${boundary.closures.candidate.fileCount} files / ${boundary.closures.candidate.edgeCount} edges.`,
		`- Proof runtime closure: ${boundary.closures.proof.fileCount} files / ${boundary.closures.proof.edgeCount} edges.`,
		`- Protected tracked files: ${boundary.inventories.protectedAfter.fileCount}, unchanged.`,
		`- Copied verification files kept inert: ${boundary.baselineManifest.excludedCopiedFiles}.`,
		'',
		'The accepted claim is limited to G0 isolation, ownership, schemas,',
		'named-frame mechanics, identities, roster semantics, and classified',
		'failures. It does not claim field realization, atmosphere transport,',
		'cache lifecycle, rasterization, visibility, or GPU implementation.',
		'',
	].join('\n');
}

function serializeError(error) {
	return {
		name: error instanceof Error ? error.name : 'Error',
		message: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	};
}

async function main() {
	if (process.argv.length !== 2) {
		throw new Error('The G0 boundary proof accepts no command-line arguments.');
	}
	const run = await initializeRunRecord({
		slug: 'g0-boundary-contract-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-extraterrestrial-g0-proof-inputs-v1',
			proofId: 'g0-boundary-and-contract-v1',
			baselineManifest:
				'experiments/extraterrestrial/baseline-manifest.json',
			decisionManifest:
				'experiments/extraterrestrial/decisions/g0-decision-manifest-v1.json',
			fixture:
				'experiments/extraterrestrial/fixtures/g0-synthetic-celestial-v1.json',
		},
		provenance: {
			schemaId: 'algorithm32-extraterrestrial-run-provenance-v1',
			repository: '.',
			experiment: 'experiments/extraterrestrial',
			runner:
				'experiments/extraterrestrial/runners/run-g0-boundary-contract-proof.js',
			baselineIdentityOwner:
				'experiments/extraterrestrial/baseline-manifest.json',
		},
		environment: {
			schemaId: 'algorithm32-extraterrestrial-run-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
		references: {
			schemaId: 'algorithm32-extraterrestrial-run-references-v1',
			controls: [
				'experiments/extraterrestrial/containment-policy.json',
				'experiments/extraterrestrial/package-lock.json',
				'experiments/extraterrestrial/baseline-manifest.json',
				'experiments/extraterrestrial/decisions/g0-decision-manifest-v1.json',
			],
			canonicalDesign:
				'agents/topics/extraterrestrial/celestial-contribution-cache-design.md',
			canonicalPlan:
				'agents/topics/extraterrestrial/promotion-plan.md',
		},
	});

	try {
		const evidence = await collectBoundaryEvidence(run);
		const proof = runG0ContractProof({
			fixture: evidence.fixture,
			decisionManifest: evidence.decisionManifest,
			containmentEvidence: evidence.containmentEvidence,
		});
		await run.writeJsonArtifact(
			'evidence/containment-packet.json',
			evidence.containmentEvidence,
		);
		await run.writeJsonArtifact(
			'evidence/boundary-evidence.json',
			evidence.boundaryEvidence,
		);
		await run.writeJsonArtifact(
			'evidence/baseline-smoke.json',
			evidence.boundaryEvidence.baselineSmoke,
		);
		await run.writeJsonArtifact(
			'evidence/decision-manifest.json',
			evidence.decisionManifest,
		);
		await run.writeJsonArtifact(
			'evidence/celestial-fixture.json',
			evidence.fixture,
		);
		await run.writeJsonArtifact(
			'evidence/celestial-contract-schema.json',
			evidence.celestialSchema,
		);
		await run.writeJsonArtifact(
			'evidence/decision-manifest-schema.json',
			evidence.decisionSchema,
		);
		await run.writeJsonArtifact('evidence/contract-proof.json', proof);

		const conclusion = proof.accepted ? 'accepted' : 'rejected';
		const terminalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: proof.proofId,
				accepted: proof.accepted,
				proofFingerprint: proof.proofFingerprint,
				assertionSummary: proof.summary,
				sourceRevision: evidence.boundaryEvidence.sourceGit.revision,
				sourceTree: evidence.boundaryEvidence.sourceGit.sourceTree,
				sourceAggregateSha256:
					evidence.boundaryEvidence.inventories.source.aggregateSha256,
				decisionManifestFingerprint:
					proof.identities?.decisionManifestFingerprint ?? null,
			},
			report: createReport(run.runId, proof, evidence.boundaryEvidence),
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			proofFingerprint: proof.proofFingerprint,
			artifactSetSha256: terminalManifest.artifactSetSha256,
		}, null, 2)}\n`);
		if (!proof.accepted) {
			process.exitCode = 1;
		}
	} catch (error) {
		const serialized = serializeError(error);
		try {
			await run.writeJsonArtifact('evidence/failure.json', serialized);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {
					proofId: 'g0-boundary-and-contract-v1',
					accepted: false,
					error: serialized,
				},
				report: [
					`# ${run.runId}: G0 boundary and contract proof`,
					'',
					'Conclusion: **failed**',
					'',
					serialized.message,
					'',
				].join('\n'),
			});
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'failed',
				artifactSetSha256: terminalManifest.artifactSetSha256,
				error: serialized,
			}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({
				runId: run.runId,
				conclusion: 'partial-unfinalized',
				error: serialized,
				finalizationError: serializeError(finalizationError),
			}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

main().catch((error) => {
	process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
	process.exitCode = 1;
});
