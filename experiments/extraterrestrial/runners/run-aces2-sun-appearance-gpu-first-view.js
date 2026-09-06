#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
	readWorkingTreeStatus,
} from '../harness/lib/containment.js';
import {
	FIXED_SCENE_SCALE,
	buildReferenceGrid,
	collectBrunetonNonRegressionInputs,
	collectGpuMeasuredSamples,
	decodeRgba32f,
	encodeGpuRgba8Png,
	encodeReferenceGrid,
	evaluateBrunetonNonRegression,
	evaluateCtlOracleParity,
	evaluateOcioParity,
	evaluateOfficialTableProbe,
	evaluatePairDecision,
	evaluateSyntheticGrid,
	evaluateTrackedBrunetonGate,
	quantizeFinalRgba8,
} from '../harness/lib/aces-reference-decision.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
	sha256File,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
	toRepositoryRelativePath,
} from '../harness/lib/roots.js';
import {initializeRunRecord, resolveExistingRunDirectory, resolveRunRoots} from '../harness/lib/run-record.js';
import {
	collectWslExecutionIdentity,
	comparableWslExecutionIdentity,
	comparableWslToolchainIdentity,
	compileExrHelper,
	probeEncodingBranches,
	probeModelContinuity,
	probeOfficialGpuTables,
	probeOfficialTables,
	runCtlRuntimePreflight,
	setReferenceDecisionProgressReporter,
	transformCtlOracle,
	validateDecisionFixture,
	validateReferences,
	validateTrackedBrunetonFixture,
} from './run-aces2-sun-appearance-reference-decision.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-aces2-sun-appearance-gpu-first-view.js';
const PROOF_ID = 'aces2-sun-appearance-gpu-visual-candidate-v1';
const GPU_EVIDENCE_PROOF_ID = 'production-sun-appearance-gpu-visual-evidence-v1';
const RUN_SLUG = 'aces2-sun-appearance-gpu-first-view';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const DECISION_FIXTURE_PATH = path.join(
	EXPERIMENT_ROOT,
	'fixtures',
	'aces2-sun-appearance-gpu-visual-candidate-v1.json',
);
const COMPREHENSIVE_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-paired-v1.json');
const SCENE_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-gpu-visual-v1.json');
const STRICT_BRUNETON_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'bruneton-b1-sky-color-gate-v1.json');
const BRUNETON_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1');
const BRUNETON_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'bruneton-published-model.tsv');
const BRUNETON_GPU_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'algorithm32-current-production-gpu-j4.tsv');
const CIE_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'CIE_xyz_1931_2deg.csv');
const GPU_PORT_PROVENANCE_PATH = path.join(
	EXPERIMENT_ROOT,
	'references',
	'opencolorio-2.4.2',
	'aces2-gpu-port-provenance.json',
);
const GPU_PORT_LICENSE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'opencolorio-2.4.2', 'LICENSE-BSD-3-Clause.txt');
const GPU_PORT_FIXED_FUNCTION_SOURCE_PATH = path.join(
	EXPERIMENT_ROOT,
	'references',
	'opencolorio-2.4.2',
	'source',
	'src',
	'OpenColorIO',
	'ops',
	'fixedfunction',
	'FixedFunctionOpGPU.cpp',
);
const GPU_PORT_TRANSFORM_SOURCE_PATH = path.join(
	EXPERIMENT_ROOT,
	'references',
	'opencolorio-2.4.2',
	'source',
	'src',
	'OpenColorIO',
	'ops',
	'fixedfunction',
	'ACES2',
	'Transform.cpp',
);
const CHROME_CANDIDATES = [
	process.env.PRODUCTION_SUN_APPEARANCE_CHROME,
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const RESULT_BODY_LIMIT_BYTES = 256 * 1024 * 1024;
const HANDSHAKE_BODY_LIMIT_BYTES = 128 * 1024 * 1024;
const PROGRESS_BODY_LIMIT_BYTES = 32 * 1024;
const RETAINED_PROGRESS_RECEIPT_LIMIT = 64;
const BROWSER_LOG_LIMIT_BYTES = 16 * 1024 * 1024;
const INACTIVITY_TIMEOUT_MILLISECONDS = 75 * 60 * 1000;
const INACTIVITY_POLL_MILLISECONDS = 1000;
const ALLOWED_PROGRESS_STAGES = new Set([
	'same-run-gpu-evidence-start',
	'evidence-condition-start',
	'gpu-setup-start',
	'condition-heartbeat',
	'gpu-setup-complete',
	'sample-start',
	'sample-complete',
	'preview-start',
	'preview-complete',
	'output-contract-start',
	'output-contract-complete',
	'condition-start',
	'condition-complete',
	'evidence-condition-complete',
	'same-run-gpu-evidence-complete',
	'glsl-grid-start',
	'glsl-grid-complete',
	'candidate-preview-start',
	'candidate-preview-complete',
]);
const MAX_FRAME_PROBES = 2048;
const EXPECTED_CONDITION_COUNT = 8;
const EXPECTED_VIEWPORT_COUNT = 2;
const EXPECTED_SAMPLE_COUNT = 104;
const EXPECTED_PAIR_COUNT = 144;
const EXPECTED_PREVIEW_COUNT = 2;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const THREE_RUNTIME_PATHS = [
	'three/package.json',
	'three/build/three.core.js',
	'three/build/three.module.js',
	'three/examples/jsm/postprocessing/EffectComposer.js',
	'three/examples/jsm/postprocessing/MaskPass.js',
	'three/examples/jsm/postprocessing/Pass.js',
	'three/examples/jsm/postprocessing/RenderPass.js',
	'three/examples/jsm/postprocessing/ShaderPass.js',
	'three/examples/jsm/shaders/CopyShader.js',
];
const PROTECTED_ROOTS = [
	{
		id: 'complete-repository-src',
		repositoryRelativePath: 'src',
		absolutePath: path.join(REPOSITORY_ROOT, 'src'),
	},
	{
		id: 'sealed-experiment-baseline',
		repositoryRelativePath: 'experiments/extraterrestrial/baseline',
		absolutePath: path.join(EXPERIMENT_ROOT, 'baseline'),
	},
	{
		id: 'experiment-candidate',
		repositoryRelativePath: 'experiments/extraterrestrial/candidate',
		absolutePath: path.join(EXPERIMENT_ROOT, 'candidate'),
	},
	{
		id: 'flat32-script-surface',
		repositoryRelativePath: 'scripts/flat32',
		absolutePath: path.join(REPOSITORY_ROOT, 'scripts', 'flat32'),
	},
	{
		id: 'experiment-script-surface',
		repositoryRelativePath: 'scripts/experiments',
		absolutePath: path.join(REPOSITORY_ROOT, 'scripts', 'experiments'),
	},
];
const EXECUTED_CONTROL_PATHS = [
	'fixtures/aces2-sun-appearance-gpu-visual-candidate-v1.json',
	'fixtures/bruneton-b1-sky-color-gate-v1.json',
	'fixtures/production-sun-appearance-gpu-visual-v1.json',
	'fixtures/production-sun-appearance-paired-v1.json',
	'harness/lib/aces-reference-decision.js',
	'harness/lib/aces2-rec709-100nit-gpu.js',
	'harness/lib/aces2-rec709-100nit-parameters.js',
	'harness/lib/production-sun-appearance-gpu-visual-scene.js',
	'harness/production-sun-appearance-aces2-gpu-browser-entry.js',
	'reference-transforms/Aces2Official100NitGpuTableProbe.ctl',
	'references/opencolorio-2.4.2/aces2-gpu-port-provenance.json',
	'references/opencolorio-2.4.2/LICENSE-BSD-3-Clause.txt',
	'references/opencolorio-2.4.2/source/src/OpenColorIO/ops/fixedfunction/ACES2/Transform.cpp',
	'references/opencolorio-2.4.2/source/src/OpenColorIO/ops/fixedfunction/FixedFunctionOpGPU.cpp',
	'runners/run-aces2-sun-appearance-gpu-first-view.js',
	'runners/run-aces2-sun-appearance-reference-decision.js',
	'runners/verify-run.js',
];
const EXPECTED_NODE_CLOSURE_PATHS = [
	'harness/lib/aces-reference-decision.js',
	'harness/lib/atomic-files.js',
	'harness/lib/containment.js',
	'harness/lib/hashes.js',
	'harness/lib/module-closure.js',
	'harness/lib/roots.js',
	'harness/lib/run-record.js',
	'runners/run-aces2-sun-appearance-gpu-first-view.js',
	'runners/run-aces2-sun-appearance-reference-decision.js',
	'runners/verify-run.js',
];
const SERVED_CONTROL_PATHS = new Map([
	[
		'/harness/',
		new Set([
			'production-sun-appearance-aces2-gpu-browser-entry.js',
			'lib/aces2-rec709-100nit-gpu.js',
			'lib/aces2-rec709-100nit-parameters.js',
			'lib/production-sun-appearance-gpu-visual-scene.js',
		]),
	],
	[
		'/fixtures/',
		new Set(['aces2-sun-appearance-gpu-visual-candidate-v1.json', 'production-sun-appearance-gpu-visual-v1.json']),
	],
	['/node_modules/', new Set(THREE_RUNTIME_PATHS)],
]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function serializeError(error) {
	return {
		name: error?.name ?? 'Error',
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}

function readJson(filePath) {
	return readFile(filePath, 'utf8').then(JSON.parse);
}

function isLoopbackAddress(value) {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

function isExperimentPath(relativePath, policy) {
	const normalized = relativePath.replaceAll('\\', '/');
	const root = policy.trackedSourceRoot.replaceAll('\\', '/').replace(/\/$/u, '');
	return normalized === root || normalized.startsWith(`${root}/`);
}

async function captureProtectedState(policy) {
	const status = (await readWorkingTreeStatus())
		.filter((record) => record.paths.some((entry) => !isExperimentPath(entry, policy)))
		.map((record) => ({status: record.status, paths: [...record.paths]}))
		.sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
	return {tracked: await createProtectedTrackedInventory(policy), status};
}

async function verifyProtectedState(expected, policy) {
	const observed = await captureProtectedState(policy);
	assertFileInventoriesEqual(expected.tracked, observed.tracked, 'Protected tracked files');
	requireCondition(
		JSON.stringify(expected.status) === JSON.stringify(observed.status),
		'Protected working-tree state changed.',
	);
	return observed;
}

async function createProtectedRootInventories() {
	const records = [];
	for (const specification of PROTECTED_ROOTS) {
		const canonicalRoot = await assertExistingRealPathContained(
			REPOSITORY_ROOT,
			specification.absolutePath,
			`Protected root ${specification.id}`,
		);
		await assertNoReparseEntries(canonicalRoot, `Protected root ${specification.id}`);
		records.push({
			id: specification.id,
			repositoryRelativePath: specification.repositoryRelativePath,
			canonicalRoot,
			inventory: await createFileInventory(canonicalRoot),
		});
	}
	return records;
}

function assertProtectedRootInventoriesEqual(before, after) {
	requireCondition(before.length === after.length, 'Protected-root inventory count changed.');
	for (let index = 0; index < before.length; index += 1) {
		const expected = before[index];
		const observed = after[index];
		requireCondition(
			expected.id === observed.id &&
				expected.repositoryRelativePath === observed.repositoryRelativePath &&
				pathComparisonKey(expected.canonicalRoot) === pathComparisonKey(observed.canonicalRoot),
			`Protected-root identity changed at index ${index}.`,
		);
		assertFileInventoriesEqual(
			expected.inventory,
			observed.inventory,
			`Protected root ${expected.repositoryRelativePath} before/after ACES first-view run`,
		);
	}
}

async function createPlainExecutableIdentity(executablePath, label) {
	const absolutePath = path.resolve(executablePath);
	const stats = await lstat(absolutePath);
	requireCondition(stats.isFile() && !stats.isSymbolicLink(), `${label} is not a plain executable file.`);
	const canonicalPath = await realpath(absolutePath);
	requireCondition(
		pathComparisonKey(canonicalPath) === pathComparisonKey(absolutePath),
		`${label} resolves through a link or alternate path.`,
	);
	return {
		path: canonicalPath,
		bytes: stats.size,
		sha256: await sha256File(canonicalPath),
	};
}

function validateSnapshotManifest(manifest) {
	requireCondition(manifest?.schemaId === 'production-sun-appearance-snapshot-v1', 'Snapshot schema is invalid.');
	requireCondition(
		manifest.snapshotRoot === 'experiments/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
		'Snapshot root identity is invalid.',
	);
	requireCondition(
		manifest.source?.inventory?.aggregateSha256 === manifest.sealedInventory?.aggregateSha256,
		'Snapshot source and sealed aggregate disagree.',
	);
}

async function verifySnapshot() {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Production appearance snapshot');
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Production appearance snapshot');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	validateSnapshotManifest(manifest);
	const selected = await createSelectedFileInventory(
		SNAPSHOT_ROOT,
		manifest.sealedInventory.files.map((entry) => entry.path),
	);
	assertFileInventoriesEqual(manifest.sealedInventory, selected, 'Sealed production appearance snapshot');
	const complete = await createFileInventory(SNAPSHOT_ROOT, {
		include: (relativePath) => relativePath !== 'manifest.json',
	});
	assertFileInventoriesEqual(manifest.sealedInventory, complete, 'Complete production appearance snapshot');
	return {manifest, manifestSha256: await sha256File(SNAPSHOT_MANIFEST_PATH), inventory: complete};
}

async function findChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		try {
			const stats = await lstat(candidate);
			if (stats.isFile() && !stats.isSymbolicLink()) {
				const canonical = await realpath(candidate);
				if (pathComparisonKey(canonical) === pathComparisonKey(candidate)) return canonical;
			}
		} catch (error) {
			if (error?.code !== 'ENOENT') throw error;
		}
	}
	throw new Error('No plain installed Chrome executable was found; set PRODUCTION_SUN_APPEARANCE_CHROME.');
}

async function findLatestAcceptedGpuEvidenceRun() {
	const entries = await readdir(RUNS_ROOT, {withFileTypes: true});
	entries.sort((left, right) => compareStrings(right.name, left.name));
	for (const entry of entries) {
		if (!entry.isDirectory() || !/^[0-9]{6}-production-sun-appearance-gpu-visual-evidence$/u.test(entry.name))
			continue;
		try {
			const result = await readJson(path.join(RUNS_ROOT, entry.name, 'result.json'));
			if (
				result?.proofId === GPU_EVIDENCE_PROOF_ID &&
				result.state === 'terminal' &&
				result.conclusion === 'accepted' &&
				result.status === 'accepted'
			)
				return path.join(RUNS_ROOT, entry.name);
		} catch {
			// Partial or corrupt attempts are never prerequisites.
		}
	}
	throw new Error('No accepted full production GPU visual-evidence prerequisite exists.');
}

async function resolveGpuEvidencePrerequisite(selector, sceneFixtureSha256) {
	const runDirectory = selector
		? await resolveExistingRunDirectory(selector, resolveRunRoots())
		: await findLatestAcceptedGpuEvidenceRun();
	await assertExistingRealPathContained(RUNS_ROOT, runDirectory, 'GPU visual-evidence prerequisite');
	const verification = await verifyRun(runDirectory);
	requireCondition(
		verification.conclusion === 'accepted',
		'GPU visual-evidence prerequisite is not canonically accepted.',
	);
	const [result, gates] = await Promise.all([
		readJson(path.join(runDirectory, 'result.json')),
		readJson(path.join(runDirectory, 'evidence', 'gates.json')),
	]);
	requireCondition(
		result.proofId === GPU_EVIDENCE_PROOF_ID &&
			result.status === 'accepted' &&
			result.source === 'sealed-production-snapshot' &&
			result.executionBackend === 'gpu' &&
			result.fixture?.sha256 === sceneFixtureSha256 &&
			result.gates?.accepted === true,
		'GPU visual-evidence prerequisite identity differs from the accepted contract.',
	);
	requireCondition(
		Array.isArray(result.conditions) &&
			result.conditions.length === EXPECTED_CONDITION_COUNT &&
			result.conditions.reduce((sum, entry) => sum + entry.sampleCount, 0) === EXPECTED_SAMPLE_COUNT &&
			result.conditions.reduce((sum, entry) => sum + entry.pairCount, 0) === EXPECTED_PAIR_COUNT,
		'GPU visual-evidence prerequisite does not cover 8/104/144.',
	);
	for (const gate of [
		'completeLedger',
		'productionGpuPath',
		'browserExecutedClosure',
		'rawGpuOrdering',
		'outputContract',
		'float32Composition',
		'outputStageChain',
		'samplingAndVisibility',
		'cacheLookup',
		'requiredPreviews',
		'flatGeometryAndSource',
		'protectedInputs',
	]) {
		requireCondition(
			gates[gate]?.passes === true,
			`GPU visual-evidence prerequisite gate ${gate} is not accepted.`,
		);
	}
	requireCondition(gates.accepted === true, 'GPU visual-evidence prerequisite aggregate gate is not accepted.');
	return {
		runDirectory,
		runId: path.basename(runDirectory),
		verification,
		result,
		gates,
		resultSha256: await sha256File(path.join(runDirectory, 'result.json')),
		gatesSha256: await sha256File(path.join(runDirectory, 'evidence', 'gates.json')),
	};
}

function requireFiniteArray(value, length, label) {
	requireCondition(
		Array.isArray(value) && value.length === length && value.every(Number.isFinite),
		`${label} is invalid.`,
	);
}

function fixtureConditionRecords(fixture) {
	return [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', condition})),
	];
}

function expectedSampleOffsets(sceneFixture, configured, condition) {
	const apparentRadius = Number(condition.source?.apparentRadiusRadians);
	requireCondition(
		Number.isFinite(apparentRadius) && apparentRadius > 0,
		`${condition.id} apparent radius is invalid.`,
	);
	const offsets = new Map([
		['disk-center', 0],
		['inside-limb-zenithward', apparentRadius * sceneFixture.sampling.insideLimbRadiusFactor],
	]);
	for (const offsetDegrees of sceneFixture.sampling.circumsolarOffsetsDegrees) {
		for (const orientation of configured.radialOrientations) {
			offsets.set(
				`circumsolar-${String(offsetDegrees).replace('.', 'p')}-degrees-${orientation}`,
				(offsetDegrees * Math.PI) / 180,
			);
		}
	}
	return offsets;
}

function predictedQ8(mapperRgb, classification) {
	return mapperRgb.map((value) => {
		const encoded =
			classification === 'srgb-oetf-q8'
				? value <= 0.0031308
					? 12.92 * value
					: 1.055 * value ** (1 / 2.4) - 0.055
				: value;
		return Math.round(Math.max(0, Math.min(1, encoded)) * 255);
	});
}

function withinTolerance(left, right, tolerance) {
	const residual = Math.abs(left - right);
	return residual <= tolerance.absolute || residual <= tolerance.relative * Math.max(Math.abs(left), Math.abs(right));
}

function validateAuthoredFixtures({decisionFixture, comprehensiveFixture, sceneFixture, strictFixture, references}) {
	requireCondition(
		decisionFixture?.id === PROOF_ID &&
			decisionFixture.schemaVersion === PROOF_ID &&
			decisionFixture.proofId === PROOF_ID,
		'ACES GPU first-view fixture identity is invalid.',
	);
	requireCondition(decisionFixture.generatedInputReuse === false, 'ACES GPU fixture permits generated input reuse.');
	requireCondition(
		decisionFixture.comprehensiveDecisionFixtureId === comprehensiveFixture.id &&
			decisionFixture.acceptedGpuEvidenceProofId === GPU_EVIDENCE_PROOF_ID,
		'ACES GPU fixture prerequisite identities are invalid.',
	);
	const requiredGpuEvidenceGates = [
		'completeLedger',
		'productionGpuPath',
		'browserExecutedClosure',
		'rawGpuOrdering',
		'outputContract',
		'float32Composition',
		'outputStageChain',
		'samplingAndVisibility',
		'cacheLookup',
		'requiredPreviews',
		'flatGeometryAndSource',
		'protectedInputs',
	];
	requireCondition(
		JSON.stringify(decisionFixture.requiredGpuEvidenceGates) === JSON.stringify(requiredGpuEvidenceGates),
		'ACES GPU fixture does not bind the complete prerequisite gate inventory.',
	);
	requireCondition(
		decisionFixture.profile?.acesRelease === 'v2.0.0+2025.04.04' &&
			decisionFixture.profile.acesCommit === '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5' &&
			decisionFixture.profile.ocioRelease === '2.4.2' &&
			decisionFixture.profile.ocioCommit === '6918fad3f5d22ac3ef2397c754bf4268c2b58dd0' &&
			decisionFixture.profile.peakLuminanceNits === 100 &&
			decisionFixture.profile.limitingPrimaries === 'Rec.709/D65' &&
			decisionFixture.profile.displayEncoding === 'sRGB-piecewise' &&
			decisionFixture.profile.fixedSceneScale === FIXED_SCENE_SCALE,
		'ACES GPU fixed profile differs from the official selected path.',
	);
	for (const key of ['parameterTuning', 'exposureAdjustment', 'sourceSpecificRule', 'generatedOutputLut']) {
		requireCondition(decisionFixture.profile[key] === false, `ACES GPU fixture permits ${key}.`);
	}
	requireCondition(
		decisionFixture.parity?.expectedProbeCount === decisionFixture.parity?.probes?.length &&
			decisionFixture.parity.expectedProbeCount === 32 &&
			decisionFixture.parity.absoluteTolerance === 7e-6 &&
			decisionFixture.parity.relativeTolerance === 2e-5 &&
			decisionFixture.parity.maximumUlpDistance === 256 &&
			decisionFixture.parity.requireExactRgba8 === true,
		'ACES GPU direct parity probe contract is invalid.',
	);
	const probeIds = decisionFixture.parity.probes.map((probe) => probe.id);
	requireCondition(new Set(probeIds).size === probeIds.length, 'ACES GPU direct probe identities are not unique.');
	for (const probe of decisionFixture.parity.probes) {
		requireFiniteArray(probe.signedLinearRec709, 3, `ACES GPU direct probe ${probe.id}`);
	}
	requireCondition(
		decisionFixture.tableParity?.rowCountPerTable === 362 &&
			decisionFixture.tableParity.absoluteTolerance === 2e-5 &&
			decisionFixture.tableParity.requireExactOrderedPadding === true &&
			decisionFixture.tableParity.requireSeparateCuspAndUpperGammaInterpolation === true,
		'ACES GPU table parity contract is invalid.',
	);
	requireCondition(
		decisionFixture.comprehensiveGate?.requiredSameRunGpuSampleCount === EXPECTED_SAMPLE_COUNT &&
			decisionFixture.comprehensiveGate.requiredSameRunGpuRawOrderingPairCount === EXPECTED_PAIR_COUNT &&
			decisionFixture.comprehensiveGate.requiredBrunetonPairCount === 1377 &&
			Object.entries(decisionFixture.comprehensiveGate)
				.filter(([key]) => key.startsWith('require'))
				.every(([, value]) => value === true),
		'ACES GPU comprehensive first-view gate is incomplete.',
	);
	requireCondition(
		JSON.stringify(decisionFixture.previewConditionIds) ===
			JSON.stringify(['sunset-minus-10-minutes', 'flat-long']),
		'ACES GPU preview selection is invalid.',
	);
	requireCondition(
		decisionFixture.previewContract?.cpuAtmosphericGeneration === false &&
			decisionFixture.previewContract.cpuFullFrameDisplayTransform === false,
		'ACES GPU preview contract permits CPU full-frame work.',
	);
	const conditionRecords = fixtureConditionRecords(sceneFixture);
	requireCondition(
		sceneFixture?.schemaVersion === 'production-sun-appearance-gpu-visual-v1' &&
			sceneFixture.executionBackend === 'gpu' &&
			conditionRecords.length === EXPECTED_CONDITION_COUNT &&
			sceneFixture.viewports?.length === EXPECTED_VIEWPORT_COUNT &&
			sceneFixture.sampling?.requiredConditionCount === EXPECTED_CONDITION_COUNT &&
			sceneFixture.sampling.requiredViewportCount === EXPECTED_VIEWPORT_COUNT &&
			sceneFixture.sampling.requiredSampleCount === EXPECTED_SAMPLE_COUNT &&
			sceneFixture.sampling.requiredRawOrderingPairCount === EXPECTED_PAIR_COUNT,
		'GPU scene fixture does not freeze the exact 8/2/104/144 ledger.',
	);
	const previewIds = conditionRecords
		.filter(({condition}) => condition.requiredPreview === true)
		.map(({condition}) => condition.id);
	requireCondition(
		JSON.stringify(previewIds) === JSON.stringify(decisionFixture.previewConditionIds),
		'GPU scene and ACES preview fixture identities disagree.',
	);
	requireCondition(
		sceneFixture.provisionalGates?.noGeneratedInputReuse === true &&
			sceneFixture.provisionalGates.oneChromeProcessAtATime === true &&
			sceneFixture.provisionalGates.inactivityWatchdogOnly === true,
		'GPU scene fixture does not preserve serial no-reuse execution.',
	);
	return {
		decision: {passed: true, fixtureId: decisionFixture.id},
		comprehensive: validateDecisionFixture(comprehensiveFixture, references),
		strictBruneton: validateTrackedBrunetonFixture(strictFixture, references),
		scene: {passed: true, fixtureId: sceneFixture.id, previewIds},
	};
}

function validateGpuPortProvenance(provenance) {
	requireCondition(
		provenance?.schemaVersion === 'opencolorio-2.4.2-aces2-gpu-port-provenance-v1' &&
			provenance.release?.version === '2.4.2' &&
			provenance.release.commit === '6918fad3f5d22ac3ef2397c754bf4268c2b58dd0' &&
			provenance.sourceRoot === 'references/opencolorio-2.4.2/source',
		'ACES GPU port provenance identity is invalid.',
	);
	const sources = new Map(provenance.authoredSources?.map((source) => [source.path, source]));
	const fixedFunction = sources.get('src/OpenColorIO/ops/fixedfunction/FixedFunctionOpGPU.cpp');
	const transform = sources.get('src/OpenColorIO/ops/fixedfunction/ACES2/Transform.cpp');
	requireCondition(
		fixedFunction?.sizeBytes === 95702 &&
			fixedFunction.sha256 === '878164fc61129ee1e90e0bc03756c4a7b6bfaca041203e476be054d997e8255f' &&
			fixedFunction.repositoryPath ===
				'references/opencolorio-2.4.2/source/src/OpenColorIO/ops/fixedfunction/FixedFunctionOpGPU.cpp' &&
			transform?.sizeBytes === 57228 &&
			transform.sha256 === '36c16956138862bcf38a579397850cdc70a06a1ff668f4ed7ea69a712c1f5782' &&
			transform.repositoryPath ===
				'references/opencolorio-2.4.2/source/src/OpenColorIO/ops/fixedfunction/ACES2/Transform.cpp',
		'ACES GPU authored-source byte identities are invalid.',
	);
	requireCondition(
		provenance.license?.spdx === 'BSD-3-Clause' &&
			provenance.license.notice === 'Copyright Contributors to the OpenColorIO Project.' &&
			provenance.license.repositoryLicensePath === 'references/opencolorio-2.4.2/LICENSE-BSD-3-Clause.txt' &&
			provenance.license.repositoryLicenseSizeBytes === 1485 &&
			provenance.license.repositoryLicenseSha256 ===
				'82a40c52065ee968aa62015735e84378ac11425db7a233e6a2dcd2c83fc24276' &&
			provenance.license.upstreamWheelMember === 'opencolorio-2.4.2.dist-info/LICENSE' &&
			provenance.license.upstreamWheelMemberSizeBytes === 1511 &&
			provenance.license.upstreamWheelMemberSha256 ===
				'8850b0c83cd41d26ad0e080861d47ee00afb685386a459a1cbe8c347555621a7',
		'ACES GPU port license notice is invalid.',
	);
	for (const key of ['generatedInputReuse', 'tuning', 'exposure', 'sourceSpecificRule']) {
		requireCondition(provenance.semanticLimits?.[key] === false, `ACES GPU provenance permits ${key}.`);
	}
	return {
		passed: true,
		release: provenance.release,
		sources: provenance.authoredSources,
		license: provenance.license,
	};
}

async function verifyGpuPortAuthoredSources(provenance) {
	const records = new Map(provenance.authoredSources.map((record) => [record.path, record]));
	const specifications = [
		{
			label: 'OpenColorIO FixedFunctionOpGPU.cpp',
			filePath: GPU_PORT_FIXED_FUNCTION_SOURCE_PATH,
			record: records.get('src/OpenColorIO/ops/fixedfunction/FixedFunctionOpGPU.cpp'),
		},
		{
			label: 'OpenColorIO ACES2 Transform.cpp',
			filePath: GPU_PORT_TRANSFORM_SOURCE_PATH,
			record: records.get('src/OpenColorIO/ops/fixedfunction/ACES2/Transform.cpp'),
		},
	];
	const identities = [];
	for (const specification of specifications) {
		const canonicalPath = await assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			specification.filePath,
			specification.label,
		);
		const stats = await lstat(canonicalPath);
		requireCondition(stats.isFile() && !stats.isSymbolicLink(), `${specification.label} is not a plain file.`);
		const identity = {
			repositoryPath: toRepositoryRelativePath(canonicalPath),
			bytes: stats.size,
			sha256: await sha256File(canonicalPath),
		};
		requireCondition(
			identity.repositoryPath === `experiments/extraterrestrial/${specification.record.repositoryPath}` &&
				identity.bytes === specification.record.sizeBytes &&
				identity.sha256 === specification.record.sha256,
			`${specification.label} bytes differ from pinned provenance.`,
		);
		identities.push(identity);
	}
	return identities;
}

function validateOutputContract(contract, fixture, failures, label) {
	const classification = contract?.defaultFramebufferQ8?.classification;
	const expectedOfficialCtlEncoding =
		classification === 'identity-q8'
			? 'srgb-piecewise'
			: classification === 'srgb-oetf-q8'
				? 'none-renderer-supplies-srgb-oetf'
				: 'unresolved-reject';
	if (
		contract?.pngQ8?.classification !== classification ||
		!['identity-q8', 'srgb-oetf-q8'].includes(classification) ||
		contract.requiredOfficialCtlEncoding !== expectedOfficialCtlEncoding
	) {
		failures.push(`${label}:unresolved-or-disagreeing-classification`);
	}
	const sentinels = fixture.outputContract.sentinelLinearValues;
	if (
		!Array.isArray(contract?.rgba32f) ||
		!Array.isArray(contract?.defaultFramebufferRgba) ||
		!Array.isArray(contract?.pngDecodedRgba) ||
		contract.rgba32f.length !== sentinels.length ||
		contract.defaultFramebufferRgba.length !== sentinels.length ||
		contract.pngDecodedRgba.length !== sentinels.length
	) {
		failures.push(`${label}:incomplete-sentinel-ledger`);
		return classification;
	}
	for (let index = 0; index < sentinels.length; index += 1) {
		const floatRgba = contract.rgba32f[index];
		if (
			!Array.isArray(floatRgba) ||
			floatRgba.length !== 4 ||
			floatRgba.slice(0, 3).some((value) => !Object.is(Math.fround(value), Math.fround(sentinels[index]))) ||
			!Object.is(Math.fround(floatRgba[3]), Math.fround(1))
		) {
			failures.push(`${label}:sentinel-${index}:rgba32f`);
		}
		if (['identity-q8', 'srgb-oetf-q8'].includes(classification)) {
			const code = predictedQ8([sentinels[index]], classification)[0];
			for (const [stage, rgba] of [
				['framebuffer', contract.defaultFramebufferRgba[index]],
				['png', contract.pngDecodedRgba[index]],
			]) {
				if (
					!Array.isArray(rgba) ||
					rgba.length !== 4 ||
					rgba.slice(0, 3).some((value) => value !== code) ||
					rgba[3] !== 255
				) {
					failures.push(`${label}:sentinel-${index}:${stage}`);
				}
			}
		}
	}
	const residualName = classification === 'identity-q8' ? 'identityMaximumCodeResidual' : 'srgbMaximumCodeResidual';
	if (
		!['identity-q8', 'srgb-oetf-q8'].includes(classification) ||
		contract.defaultFramebufferQ8?.[residualName] !== 0 ||
		contract.pngQ8?.[residualName] !== 0
	) {
		failures.push(`${label}:nonzero-winning-transfer-residual`);
	}
	return classification;
}

function requireHardwareRenderer(renderer, label) {
	const facts = renderer?.webgl ?? renderer;
	const identity = [facts?.renderer, facts?.unmaskedRenderer, facts?.vendor, facts?.unmaskedVendor]
		.filter((value) => typeof value === 'string')
		.join(' | ');
	requireCondition(identity.length > 0, `${label} has no WebGL renderer identity.`);
	requireCondition(
		facts?.softwareRendererDetected !== true &&
			!/swiftshader|llvmpipe|lavapipe|software|\bwarp\b|microsoft basic render/iu.test(identity),
		`${label} resolved to a software renderer: ${identity}`,
	);
	return identity;
}

function emptyScienceFailures() {
	return {
		outputContract: [],
		composition: [],
		stageChain: [],
		sampling: [],
		cacheLookup: [],
		rawOrdering: [],
		crossViewport: [],
		preview: [],
		flatGeometry: [],
	};
}

function validateSameRunGpuEvidence(browserEvidence, sceneFixture, outputRoute) {
	requireCondition(
		browserEvidence?.schemaVersion === 'aces2-sun-appearance-same-run-gpu-evidence-v1' &&
			browserEvidence.fixtureId === sceneFixture.id &&
			browserEvidence.executionBackend === 'gpu' &&
			browserEvidence.cpuReferenceUsed === false &&
			browserEvidence.sourcePathConvergenceEvaluated === false,
		'Same-run GPU evidence boundary is malformed.',
	);
	const configuredRecords = fixtureConditionRecords(sceneFixture);
	requireCondition(
		Array.isArray(browserEvidence.conditions) && browserEvidence.conditions.length === configuredRecords.length,
		'Same-run GPU evidence condition ledger is incomplete.',
	);
	const configuredById = new Map(configuredRecords.map((record) => [record.condition.id, record]));
	const renderers = new Map();
	for (const record of browserEvidence.renderers ?? []) {
		requireCondition(!renderers.has(record.conditionId), `Duplicate renderer identity for ${record.conditionId}.`);
		renderers.set(record.conditionId, record.renderer);
	}
	requireCondition(renderers.size === EXPECTED_CONDITION_COUNT, 'Same-run hardware renderer ledger is incomplete.');
	const outputContracts = new Map();
	for (const record of browserEvidence.outputContracts ?? []) {
		requireCondition(
			!outputContracts.has(record.conditionId),
			`Duplicate output contract for ${record.conditionId}.`,
		);
		outputContracts.set(record.conditionId, record.outputContract);
	}
	requireCondition(
		outputContracts.size === EXPECTED_CONDITION_COUNT,
		'Same-run output-contract ledger is incomplete.',
	);
	const failures = emptyScienceFailures();
	const rowIds = new Set();
	const pairIds = new Set();
	const previewIds = [];
	const flatEntries = [];
	const classifications = new Set();
	const outputContractHashes = new Set();
	let sampleCount = 0;
	let pairCount = 0;
	const conditionIds = new Set();
	const hardwareIdentities = [];
	for (const condition of browserEvidence.conditions) {
		const configuredRecord = configuredById.get(condition.id);
		requireCondition(configuredRecord, `Same-run evidence contains unknown condition ${condition.id}.`);
		requireCondition(!conditionIds.has(condition.id), `Same-run evidence repeats condition ${condition.id}.`);
		conditionIds.add(condition.id);
		requireCondition(
			condition.family === configuredRecord.family,
			`${condition.id} family differs from its fixture.`,
		);
		hardwareIdentities.push({
			conditionId: condition.id,
			identity: requireHardwareRenderer(renderers.get(condition.id), condition.id),
		});
		const contract = outputContracts.get(condition.id);
		const classification = validateOutputContract(contract, sceneFixture, failures.outputContract, condition.id);
		classifications.add(classification);
		outputContractHashes.add(sha256(Buffer.from(JSON.stringify(contract), 'utf8')));
		const expectedOffsets = expectedSampleOffsets(sceneFixture, configuredRecord.condition, condition);
		requireCondition(
			condition.viewports?.length === EXPECTED_VIEWPORT_COUNT,
			`${condition.id} omitted a viewport.`,
		);
		const samplesByViewport = new Map();
		const viewportIds = new Set();
		for (const viewport of condition.viewports) {
			const authoredViewport = sceneFixture.viewports.find((entry) => entry.id === viewport.id);
			requireCondition(authoredViewport, `${condition.id} returned unknown viewport ${viewport.id}.`);
			requireCondition(!viewportIds.has(viewport.id), `${condition.id} repeated viewport ${viewport.id}.`);
			viewportIds.add(viewport.id);
			requireCondition(
				viewport.width === authoredViewport.widthPixels && viewport.height === authoredViewport.heightPixels,
				`${condition.id}/${viewport.id} dimensions differ from the fixture.`,
			);
			requireCondition(
				Array.isArray(viewport.samples) && viewport.samples.length === expectedOffsets.size,
				`${condition.id}/${viewport.id} sample ledger is incomplete.`,
			);
			const sampleById = new Map();
			for (const sample of viewport.samples) {
				const rowId = `${condition.id}:${viewport.id}:${sample.id}`;
				requireCondition(!rowIds.has(rowId), `Same-run GPU sample identity repeats ${rowId}.`);
				rowIds.add(rowId);
				sampleCount += 1;
				if (sampleById.has(sample.id) || !expectedOffsets.has(sample.id)) {
					failures.sampling.push(`${rowId}:duplicate-or-unexpected-id`);
				}
				sampleById.set(sample.id, sample);
				const expectedOffset = expectedOffsets.get(sample.id);
				if (
					!Number.isFinite(expectedOffset) ||
					Math.abs(sample.angularOffsetRadians - expectedOffset) > 1e-12
				) {
					failures.sampling.push(`${rowId}:angular-offset`);
				}
				if (sample.pixel?.x !== (viewport.width - 1) / 2 || sample.pixel?.y !== (viewport.height - 1) / 2) {
					failures.sampling.push(`${rowId}:noncentral-pixel`);
				}
				if (
					!Number.isFinite(sample.requestedRayAngularResidualRadians) ||
					sample.requestedRayAngularResidualRadians >
						sceneFixture.diagnosticTolerances.rayAngularResidualRadiansMaximum
				) {
					failures.sampling.push(`${rowId}:ray-residual`);
				}
				const subsamples = sample.rasterSubsamples;
				if (
					!Array.isArray(subsamples) ||
					subsamples.length !== sceneFixture.sampling.rasterSubsamplesPerPixel ||
					subsamples.some((value) => typeof value !== 'boolean')
				) {
					failures.sampling.push(`${rowId}:raster-subsamples`);
				} else {
					const coverage = subsamples.filter(Boolean).length / subsamples.length;
					if (Math.abs(sample.coverage - coverage) > sceneFixture.diagnosticTolerances.coverageAbsolute) {
						failures.sampling.push(`${rowId}:coverage`);
					}
					if (sample.id.startsWith('circumsolar-') && coverage !== 0) {
						failures.sampling.push(`${rowId}:circumsolar-coverage`);
					}
					if (sample.id === 'disk-center' && coverage <= 0) failures.sampling.push(`${rowId}:disk-coverage`);
				}
				const states = [
					sample.state?.sceneHit,
					sample.state?.pathValid,
					sample.state?.hasSceneEndpoint,
					sample.state?.hasGroundEndpoint,
				];
				if (
					states.some((value) => typeof value !== 'boolean') ||
					sample.state.pathValid !== true ||
					sample.state.sceneHit !== false ||
					sample.state.hasSceneEndpoint === true
				) {
					failures.sampling.push(`${rowId}:visibility-state`);
				}
				for (const [name, length] of [
					['completedCelestialCacheSpectrum', 15],
					['pathSpectrum', 15],
					['celestialSpectrum', 15],
					['preDisplaySpectrum', 15],
					['signedLinearRgb', 3],
					['mapperRgb', 3],
					['mapperRgba32f', 4],
					['mapperRgba16f', 4],
					['cieXyz', 3],
					['framebufferCodes', 3],
					['pngCodes', 3],
				]) {
					requireFiniteArray(sample.gpu?.[name], length, `${rowId} ${name}`);
				}
				requireCondition(
					[sample.gpu.directY, sample.gpu.directPathY, sample.gpu.directCelestialY].every(Number.isFinite),
					`${rowId} photopic evidence is invalid.`,
				);
				for (let channel = 0; channel < 15; channel += 1) {
					const expected = Math.fround(
						Math.fround(sample.gpu.pathSpectrum[channel]) +
							Math.fround(sample.gpu.celestialSpectrum[channel]),
					);
					if (!Object.is(expected, Math.fround(sample.gpu.preDisplaySpectrum[channel]))) {
						failures.composition.push(`${rowId}:channel-${channel}`);
					}
				}
				const mapper32 = sample.gpu.mapperRgba32f.slice(0, 3);
				const mapper16 = sample.gpu.mapperRgba16f.slice(0, 3);
				if (
					sample.gpu.mapperRgb.some(
						(value, channel) => !Object.is(Math.fround(value), Math.fround(mapper32[channel])),
					)
				) {
					failures.stageChain.push(`${rowId}:mapper-rgba32f-alias`);
				}
				for (let channel = 0; channel < 3; channel += 1) {
					if (
						!withinTolerance(
							mapper32[channel],
							mapper16[channel],
							sceneFixture.diagnosticTolerances.rgba16fVersusRgba32f,
						)
					) {
						failures.stageChain.push(`${rowId}:rgba16f-${channel}`);
					}
				}
				const predictedCodes = predictedQ8(mapper32, classification);
				if (
					JSON.stringify(sample.gpu.framebufferCodes) !== JSON.stringify(predictedCodes) ||
					JSON.stringify(sample.gpu.pngCodes) !== JSON.stringify(predictedCodes)
				) {
					failures.stageChain.push(`${rowId}:q8-chain`);
				}
				const lookup = sample.gpu.cacheLookup;
				if (condition.family === 'distant') {
					if (lookup?.bindingIdentity !== 'cache.celestial.sunTransport' || lookup.stencil?.valid !== true) {
						failures.cacheLookup.push(`${rowId}:distant-stencil`);
					} else {
						for (const name of [
							'receiverIndices',
							'directionIndices',
							'receiverWeights',
							'directionWeights',
						]) {
							requireFiniteArray(lookup.stencil[name], 2, `${rowId} ${name}`);
						}
					}
				} else if (lookup?.bindingIdentity !== 'cache.celestial.localSunRadiance' || lookup.stencil !== null) {
					failures.cacheLookup.push(`${rowId}:flat-lookup`);
				}
			}
			for (const expectedId of expectedOffsets.keys()) {
				if (!sampleById.has(expectedId))
					failures.sampling.push(`${condition.id}:${viewport.id}:${expectedId}:missing`);
			}
			samplesByViewport.set(viewport.id, sampleById);
			const comparisons = viewport.rawOrdering?.comparisons;
			requireCondition(
				Array.isArray(comparisons) && comparisons.length > 0,
				`${condition.id}/${viewport.id} has no pairs.`,
			);
			for (const comparison of comparisons) {
				const canonicalId = `${comparison.id}:gpu`;
				requireCondition(!pairIds.has(canonicalId), `Same-run raw pair identity repeats ${canonicalId}.`);
				pairIds.add(canonicalId);
				pairCount += 1;
				if (
					comparison.conditionId !== condition.id ||
					comparison.viewportId !== viewport.id ||
					!Number.isFinite(comparison.gpuDiskY) ||
					!Number.isFinite(comparison.gpuSkyY) ||
					!Number.isFinite(comparison.margin)
				) {
					throw new Error(`Malformed same-run raw pair ${comparison.id}.`);
				}
				if (comparison.gpuStrictlyOrdered !== true || !(comparison.margin > 0)) {
					failures.rawOrdering.push(canonicalId);
				}
			}
		}
		const viewportIdPair = sceneFixture.viewports.map((viewport) => viewport.id);
		for (const sampleId of expectedOffsets.keys()) {
			const left = samplesByViewport.get(viewportIdPair[0])?.get(sampleId);
			const right = samplesByViewport.get(viewportIdPair[1])?.get(sampleId);
			requireCondition(left && right, `${condition.id}/${sampleId} cross-viewport pair is missing.`);
			if (sampleId === 'disk-center' || sampleId.startsWith('circumsolar-')) {
				for (let channel = 0; channel < 15; channel += 1) {
					if (
						!withinTolerance(
							left.gpu.preDisplaySpectrum[channel],
							right.gpu.preDisplaySpectrum[channel],
							sceneFixture.diagnosticTolerances.crossViewportSpectrum,
						)
					) {
						failures.crossViewport.push(`${condition.id}:${sampleId}:channel-${channel}`);
					}
				}
			}
		}
		const previewExpected = configuredRecord.condition.requiredPreview === true;
		if ((condition.preview !== null) !== previewExpected) failures.preview.push(`${condition.id}:selection`);
		if (condition.preview !== null) {
			previewIds.push(condition.id);
			if (
				condition.preview.finite !== true ||
				condition.preview.width !== sceneFixture.viewports[0].widthPixels ||
				condition.preview.height !== sceneFixture.viewports[0].heightPixels ||
				condition.preview.encoding !== 'float32-le-base64'
			) {
				failures.preview.push(`${condition.id}:metadata`);
			}
		}
		if (condition.family === 'flat') {
			const center = condition.source?.centerMeters;
			requireFiniteArray(center, 3, `${condition.id} Flat center`);
			const centerResidual = Math.max(
				...center.map((value, index) =>
					Math.abs(value - configuredRecord.condition.expectedCenterMeters[index]),
				),
			);
			const radialResidual = Math.abs(
				condition.source.cacheRadialMaximumMeters - configuredRecord.condition.expectedCacheRadialMaximumMeters,
			);
			const sourceMatches =
				JSON.stringify(condition.source.surfaceRadiance) ===
					JSON.stringify(sceneFixture.flat.source.surfaceRadianceValues) &&
				condition.profile?.spectralBasisHash === sceneFixture.flat.source.spectralBasisHash;
			const passes = centerResidual <= 1e-6 && radialResidual <= 1e-6 && sourceMatches;
			flatEntries.push({
				conditionId: condition.id,
				distanceClass: configuredRecord.condition.distanceClass,
				distanceMeters: condition.source.distanceMeters,
				centerResidual,
				radialResidual,
				sourceMatches,
				passes,
			});
			if (!passes) failures.flatGeometry.push(condition.id);
		}
	}
	requireCondition(conditionIds.size === EXPECTED_CONDITION_COUNT, 'Same-run condition identities are incomplete.');
	requireCondition(
		sampleCount === EXPECTED_SAMPLE_COUNT &&
			rowIds.size === EXPECTED_SAMPLE_COUNT &&
			browserEvidence.sampleCount === EXPECTED_SAMPLE_COUNT,
		'Same-run GPU sample inventory is not exactly 104 unique rows.',
	);
	requireCondition(
		pairCount === EXPECTED_PAIR_COUNT && pairIds.size === EXPECTED_PAIR_COUNT,
		'Same-run GPU pair inventory is not exactly 144 unique viewport-qualified pairs.',
	);
	requireCondition(
		browserEvidence.rawOrdering?.comparisonCount === EXPECTED_PAIR_COUNT &&
			Array.isArray(browserEvidence.rawOrdering.comparisons),
		'Same-run aggregate raw-pair ledger is malformed.',
	);
	const aggregatePairIds = browserEvidence.rawOrdering.comparisons.map((comparison) => comparison.id);
	requireCondition(
		new Set(aggregatePairIds).size === EXPECTED_PAIR_COUNT && aggregatePairIds.every((id) => pairIds.has(id)),
		'Same-run aggregate raw-pair IDs differ from the per-viewport ledger.',
	);
	if (browserEvidence.rawOrdering.passed !== (failures.rawOrdering.length === 0)) {
		throw new Error('Same-run raw-ordering aggregate boolean is inconsistent with its complete ledger.');
	}
	requireCondition(
		JSON.stringify(previewIds) === JSON.stringify(['sunset-minus-10-minutes', 'flat-long']),
		'Same-run initial frame selection is not exactly the two authored preview IDs.',
	);
	const flatByClass = new Map(flatEntries.map((entry) => [entry.distanceClass, entry]));
	const flatOrdered =
		flatEntries.length === 3 &&
		flatByClass.get('close')?.distanceMeters < flatByClass.get('medium')?.distanceMeters &&
		flatByClass.get('medium')?.distanceMeters < flatByClass.get('long')?.distanceMeters;
	if (!flatOrdered) failures.flatGeometry.push('distance-class-order');
	if (classifications.size !== 1 || outputContractHashes.size !== 1) {
		failures.outputContract.push('cross-condition-contract-disagreement');
	}
	const measuredClassification = [...classifications][0];
	if (
		measuredClassification !== outputRoute?.classification ||
		outputRoute?.shaderEncodesSrgb !== (measuredClassification === 'identity-q8') ||
		outputRoute?.requiredOfficialCtlEncoding !==
			(measuredClassification === 'identity-q8' ? 'srgb-piecewise' : 'none-renderer-supplies-srgb-oetf')
	) {
		failures.outputContract.push('browser-output-route-disagrees-with-measurement');
	}
	const gate = (id, failureKeys, observed, required) => ({
		id,
		passed: failureKeys.every((key) => failures[key].length === 0),
		observed,
		required,
	});
	const gates = {
		completeLedger: {
			id: 'same-run-complete-8-condition-2-viewport-ledger',
			passed: true,
			observed: {
				conditionCount: conditionIds.size,
				sampleCount,
				uniqueRowIdCount: rowIds.size,
				pairCount,
				uniquePairIdCount: pairIds.size,
			},
			required: {
				conditionCount: 8,
				viewportCount: 2,
				sampleCount: 104,
				uniqueRowIdCount: 104,
				pairCount: 144,
				uniquePairIdCount: 144,
			},
		},
		productionGpuPath: {
			id: 'same-run-sealed-production-gpu-cache-and-shader-only',
			passed: true,
			observed: {executionBackend: 'gpu', cpuReferenceUsed: false, sourcePathConvergenceEvaluated: false},
			required: {executionBackend: 'gpu', cpuReferenceUsed: false, sourcePathConvergenceEvaluated: false},
		},
		hardwareWebgl: {
			id: 'same-run-identified-hardware-webgl-only',
			passed: hardwareIdentities.length === EXPECTED_CONDITION_COUNT,
			observed: {identities: hardwareIdentities},
			required: {conditionCount: EXPECTED_CONDITION_COUNT, softwareRenderer: false},
		},
		rawGpuOrdering: gate(
			'same-run-strict-gpu-disk-y-above-circumsolar-y',
			['rawOrdering'],
			{pairCount, uniquePairIdCount: pairIds.size, failedPairCount: failures.rawOrdering.length},
			{pairCount: EXPECTED_PAIR_COUNT, uniquePairIdCount: EXPECTED_PAIR_COUNT, failedPairCount: 0},
		),
		outputContract: gate(
			'same-run-exact-cross-condition-framebuffer-and-png-contract',
			['outputContract'],
			{
				classification: measuredClassification,
				uniqueContractHashCount: outputContractHashes.size,
				failureCount: failures.outputContract.length,
			},
			{uniqueContractHashCount: 1, exactSentinels: true, exactFramebufferPngAgreement: true},
		),
		float32Composition: gate(
			'same-run-exact-f32-path-plus-celestial',
			['composition'],
			{failureCount: failures.composition.length},
			{operation: sceneFixture.diagnosticTolerances.float32CompositionOperation, maximumUlp: 0, failureCount: 0},
		),
		outputStageChain: gate(
			'same-run-rgba32f-rgba16f-framebuffer-png-chain',
			['stageChain'],
			{failureCount: failures.stageChain.length},
			{exactPredictedFramebufferAndPngQ8: true, failureCount: 0},
		),
		samplingAndVisibility: gate(
			'same-run-exact-samples-rays-coverage-state-cross-fov',
			['sampling', 'crossViewport'],
			{samplingFailureCount: failures.sampling.length, crossViewportFailureCount: failures.crossViewport.length},
			{samplingFailureCount: 0, crossViewportFailureCount: 0},
		),
		cacheLookup: gate(
			'same-run-completed-cache-family-lookup',
			['cacheLookup'],
			{failureCount: failures.cacheLookup.length},
			{distantStencilValid: true, flatStencil: null, failureCount: 0},
		),
		requiredPreviews: gate(
			'same-run-two-in-memory-signed-linear-frames',
			['preview'],
			{previewIds, failureCount: failures.preview.length},
			{previewIds: ['sunset-minus-10-minutes', 'flat-long'], failureCount: 0},
		),
		flatGeometryAndSource: gate(
			'same-run-flat-source-placement-distance-identity',
			['flatGeometry'],
			{entries: flatEntries, distanceClassesStrictlyOrdered: flatOrdered},
			{conditionCount: 3, toleranceMeters: 1e-6, distanceClassesStrictlyOrdered: true},
		),
	};
	gates.accepted = Object.values(gates).every((entry) => entry.passed === true);
	return {gates, failures, rowIds: [...rowIds].sort(compareStrings), pairIds: [...pairIds].sort(compareStrings)};
}

function scanInMemoryFrames(frames, expectedConditionIds) {
	requireCondition(
		Array.isArray(frames) && frames.length === EXPECTED_PREVIEW_COUNT,
		'Same-run signed-frame count differs.',
	);
	const conditionIds = frames.map((frame) => frame.conditionId);
	requireCondition(
		JSON.stringify(conditionIds) === JSON.stringify(expectedConditionIds),
		'Same-run signed-frame identities differ from the authored preview selection.',
	);
	const probes = [];
	const summaries = [];
	let maximumNormalized = 0;
	for (const frame of frames) {
		requireCondition(
			frame.encoding === 'float32-le-base64' &&
				frame.channelOrder === 'RGBA' &&
				frame.rowOrigin === 'bottom-left' &&
				Number.isSafeInteger(frame.width) &&
				frame.width > 0 &&
				Number.isSafeInteger(frame.height) &&
				frame.height > 0 &&
				frame.byteLength === frame.width * frame.height * 16,
			`Same-run signed frame ${frame.conditionId} metadata is invalid.`,
		);
		const bytes = Buffer.from(frame.dataBase64, 'base64');
		requireCondition(
			bytes.byteLength === frame.byteLength,
			`${frame.conditionId} signed-frame byte count differs.`,
		);
		const pixelCount = frame.width * frame.height;
		const stride = Math.max(1, Math.floor(pixelCount / MAX_FRAME_PROBES));
		let probeCount = 0;
		let minimum = Number.POSITIVE_INFINITY;
		let maximum = Number.NEGATIVE_INFINITY;
		for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
			const offset = pixelIndex * 16;
			const sceneRgb = [bytes.readFloatLE(offset), bytes.readFloatLE(offset + 4), bytes.readFloatLE(offset + 8)];
			requireCondition(
				sceneRgb.every(Number.isFinite),
				`${frame.conditionId} signed frame contains non-finite RGB.`,
			);
			for (const value of sceneRgb) {
				minimum = Math.min(minimum, value);
				maximum = Math.max(maximum, value);
				maximumNormalized = Math.max(maximumNormalized, Math.abs(value) * FIXED_SCENE_SCALE);
			}
			if (pixelIndex % stride === 0 && probeCount < MAX_FRAME_PROBES) {
				probes.push({id: `${frame.conditionId}:${pixelIndex}`, sceneRgb});
				probeCount += 1;
			}
		}
		summaries.push({
			conditionId: frame.conditionId,
			family: frame.family,
			width: frame.width,
			height: frame.height,
			byteLength: bytes.byteLength,
			sha256: sha256(bytes),
			minimum,
			maximum,
			probeCount,
			retention: 'same-run-memory-only; raw frame is neither persisted nor reused for candidate preview',
		});
	}
	return {probes, summaries, maximumNormalized};
}

function summarizeGrid(grid, measuredSamples, frameScan, brunetonInputs) {
	const recordIds = grid.records.map((record) => record.id);
	requireCondition(
		new Set(recordIds).size === recordIds.length,
		'Comprehensive ACES reference-grid IDs are not unique.',
	);
	return {
		schemaVersion: 'aces2-sun-appearance-gpu-first-view-reference-grid-v1',
		recordCount: grid.records.length,
		uniqueRecordIdCount: new Set(recordIds).size,
		measuredSampleCount: measuredSamples.length,
		frameProbeCount: frameScan.probes.length,
		directPortProbeCount: grid.records.filter(
			(record) => record.kind === 'measured-frame-probe' && /^frame:[a-z][a-z0-9-]*$/u.test(record.id),
		).length,
		brunetonPairCount: brunetonInputs.pairs.length,
		brunetonTransformInputCount: brunetonInputs.records.length,
		measuredMaximumNormalized: grid.measuredMaximumNormalized,
		twoTimesMeasuredMaximumNormalized: grid.twoM,
		fixedSceneScale: FIXED_SCENE_SCALE,
		frameSummaries: frameScan.summaries,
		kindCounts: Object.fromEntries(
			[...new Set(grid.records.map((record) => record.kind))]
				.sort(compareStrings)
				.map((kind) => [kind, grid.records.filter((record) => record.kind === kind).length]),
		),
		recordIdDigest: sha256(Buffer.from(recordIds.join('\n'), 'utf8')),
	};
}

function float32OrderedBits(value) {
	const buffer = new ArrayBuffer(4);
	const view = new DataView(buffer);
	view.setFloat32(0, Math.fround(value), false);
	const bits = view.getUint32(0, false);
	return (bits & 0x80000000) !== 0 ? 0x80000000 - (bits & 0x7fffffff) : 0x80000000 + bits;
}

function evaluateGlslParity({records, ctl, glsl, codes, decisionFixture, comprehensiveFixture}) {
	requireCondition(
		records.length === ctl.length && ctl.length === glsl.length,
		'GLSL float grid length differs from CTL.',
	);
	requireCondition(codes.byteLength === records.length * 4, 'GLSL actual-code grid length differs from CTL.');
	const floatGate = evaluateOcioParity(ctl, glsl, comprehensiveFixture);
	const tolerance = decisionFixture.parity;
	const waiverMultiplier = Number(comprehensiveFixture.diagnosticTolerances?.nearZeroUlpWaiverMultiplier ?? 8);
	let alphaMismatchCount = 0;
	let codeMismatchCount = 0;
	let nonFiniteCount = 0;
	let valueFailureCount = 0;
	let ulpFailureCount = 0;
	let maximumAbsoluteError = 0;
	let maximumRelativeError = 0;
	let maximumUlp = 0;
	const failedRecordIds = new Set();
	const examples = [];
	for (let index = 0; index < records.length; index += 1) {
		let recordFailed = false;
		for (let channel = 0; channel < 3; channel += 1) {
			const expected = ctl[index][channel];
			const actual = glsl[index][channel];
			if (!(Number.isFinite(expected) && Number.isFinite(actual))) {
				nonFiniteCount += 1;
				valueFailureCount += 1;
				recordFailed = true;
				continue;
			}
			const error = Math.abs(expected - actual);
			const scale = Math.max(Math.abs(expected), Math.abs(actual));
			const permitted = tolerance.absoluteTolerance + tolerance.relativeTolerance * scale;
			const ulp = Math.abs(float32OrderedBits(expected) - float32OrderedBits(actual));
			maximumAbsoluteError = Math.max(maximumAbsoluteError, error);
			maximumRelativeError = Math.max(maximumRelativeError, scale > 0 ? error / scale : 0);
			maximumUlp = Math.max(maximumUlp, ulp);
			if (error > permitted) {
				valueFailureCount += 1;
				recordFailed = true;
			}
			if (
				ulp > tolerance.maximumUlpDistance &&
				!(
					Math.abs(expected) <= waiverMultiplier * permitted &&
					Math.abs(actual) <= waiverMultiplier * permitted
				)
			) {
				ulpFailureCount += 1;
				recordFailed = true;
			}
		}
		if (!Object.is(Math.fround(glsl[index][3]), Math.fround(ctl[index][3]))) {
			alphaMismatchCount += 1;
			recordFailed = true;
		}
		const expectedCodes = quantizeFinalRgba8(ctl[index]);
		const actualCodes = Array.from(codes.subarray(index * 4, index * 4 + 4));
		if (expectedCodes.some((value, channel) => value !== actualCodes[channel])) {
			codeMismatchCount += 1;
			recordFailed = true;
		}
		if (recordFailed) {
			failedRecordIds.add(records[index].id);
			if (examples.length < 64) {
				examples.push({
					recordId: records[index].id,
					expected: ctl[index],
					actual: glsl[index],
					expectedCodes,
					actualCodes,
				});
			}
		}
	}
	const requiredCatIds = decisionFixture.parity.requiredBradfordCatProbeIds.map((id) => `frame:${id}`);
	const recordIds = new Set(records.map((record) => record.id));
	const catFailures = requiredCatIds.filter((id) => !recordIds.has(id) || failedRecordIds.has(id));
	const neutralIds = records.filter((record) => record.kind === 'neutral').map((record) => record.id);
	const neutralFailures = neutralIds.filter((id) => failedRecordIds.has(id));
	const seamIds = records.filter((record) => record.kind === 'continuity-seam').map((record) => record.id);
	const seamFailures = seamIds.filter((id) => failedRecordIds.has(id));
	return {
		passed:
			floatGate.passed &&
			alphaMismatchCount === 0 &&
			codeMismatchCount === 0 &&
			nonFiniteCount === 0 &&
			valueFailureCount === 0 &&
			ulpFailureCount === 0 &&
			catFailures.length === 0 &&
			neutralFailures.length === 0 &&
			seamFailures.length === 0,
		recordCount: records.length,
		float: {
			...floatGate,
			absoluteTolerance: tolerance.absoluteTolerance,
			relativeTolerance: tolerance.relativeTolerance,
			maximumUlpAllowed: tolerance.maximumUlpDistance,
			maximumAbsoluteError,
			maximumRelativeError,
			maximumUlp,
			nonFiniteCount,
			valueFailureCount,
			ulpFailureCount,
			alphaMismatchCount,
		},
		actualDefaultFramebufferQ8: {
			passed: codeMismatchCount === 0,
			mismatchCount: codeMismatchCount,
			stage: 'actual default-framebuffer RGBA8 readback after the measured output route',
		},
		catProbes: {passed: catFailures.length === 0, requiredIds: requiredCatIds, failures: catFailures},
		exactNeutrals: {passed: neutralFailures.length === 0, probeCount: neutralIds.length, failures: neutralFailures},
		seams: {passed: seamFailures.length === 0, probeCount: seamIds.length, failures: seamFailures},
		failedRecordCount: failedRecordIds.size,
		examples,
	};
}

function evaluateGpuTableParity({official, browserTables, decisionFixture}) {
	const tolerance = decisionFixture.tableParity.absoluteTolerance;
	requireCondition(
		official.cuspRows?.length === 362 &&
			official.reachRows?.length === 362 &&
			browserTables?.cuspJmGammaHue?.length === 362 * 4 &&
			browserTables.reach?.length === 362,
		'Official or GLSL ACES table evidence is incomplete.',
	);
	let nonFiniteCount = 0;
	let mismatchCount = 0;
	let maximumAbsoluteError = 0;
	const examples = [];
	for (let index = 0; index < 362; index += 1) {
		const officialCusp = official.cuspRows[index];
		const actualCusp = browserTables.cuspJmGammaHue.slice(index * 4, index * 4 + 4);
		const expectedCusp = [officialCusp[1], officialCusp[2], officialCusp[3], officialCusp[0]];
		const expectedReach = official.reachRows[index][2];
		const actualReach = browserTables.reach[index];
		const values = [...expectedCusp, ...actualCusp, expectedReach, actualReach];
		if (!values.every(Number.isFinite)) nonFiniteCount += 1;
		const errors = [
			...expectedCusp.map((value, channel) => Math.abs(value - actualCusp[channel])),
			Math.abs(expectedReach - actualReach),
		];
		const rowMaximum = Math.max(...errors);
		maximumAbsoluteError = Math.max(maximumAbsoluteError, rowMaximum);
		if (rowMaximum > tolerance || !Number.isFinite(rowMaximum)) {
			mismatchCount += 1;
			if (examples.length < 32)
				examples.push({index, expectedCusp, actualCusp, expectedReach, actualReach, errors});
		}
	}
	const expectedLimitJ = official.reachRows[1][1];
	const expectedForwardLimit = official.reachRows[1][3];
	const scalarResiduals = {
		limitJ: Math.abs(expectedLimitJ - browserTables.limitJ),
		forwardLimit: Math.abs(expectedForwardLimit - browserTables.forwardLimit),
	};
	const range = [0, 1];
	for (let index = 1; index < 361; index += 1) {
		const hue = official.cuspRows[index][0];
		const wrapped = ((hue % 360) + 360) % 360;
		const position = Math.trunc((wrapped / 360) * 362);
		const delta = index - position;
		range[0] = Math.min(range[0], delta);
		range[1] = Math.max(range[1], delta + 1);
	}
	const rangePassed = JSON.stringify(browserTables.hueSearchRange) === JSON.stringify(range);
	const lookupContractPassed =
		browserTables.lookupContract?.cuspJm ===
			'full padded binary search initialized by wrapped floor(h*360/360)+1; normalized interval weight' &&
		browserTables.lookupContract?.upperHullGamma ===
			'narrowed padded binary search initialized by wrapped floor(h*362/360)+1; unnormalized h-h_lo weight';
	const paddingResidual = Math.max(
		...Array.from({length: 3}, (_, channel) =>
			Math.max(
				Math.abs(browserTables.cuspJmGammaHue[channel] - browserTables.cuspJmGammaHue[360 * 4 + channel]),
				Math.abs(browserTables.cuspJmGammaHue[361 * 4 + channel] - browserTables.cuspJmGammaHue[4 + channel]),
			),
		),
		Math.abs(browserTables.cuspJmGammaHue[3] + 360 - browserTables.cuspJmGammaHue[360 * 4 + 3]),
		Math.abs(browserTables.cuspJmGammaHue[361 * 4 + 3] - 360 - browserTables.cuspJmGammaHue[7]),
		Math.abs(browserTables.reach[0] - browserTables.reach[360]),
		Math.abs(browserTables.reach[361] - browserTables.reach[1]),
	);
	const scalarPassed = Object.values(scalarResiduals).every((value) => Number.isFinite(value) && value <= tolerance);
	return {
		passed:
			nonFiniteCount === 0 &&
			mismatchCount === 0 &&
			scalarPassed &&
			rangePassed &&
			lookupContractPassed &&
			paddingResidual <= tolerance,
		rowCountPerTable: 362,
		tolerance,
		nonFiniteCount,
		mismatchCount,
		maximumAbsoluteError,
		scalarResiduals,
		scalarPassed,
		hueSearchRange: {passed: rangePassed, expected: range, actual: browserTables.hueSearchRange},
		lookupContract: {passed: lookupContractPassed, actual: browserTables.lookupContract},
		orderedPadding: {passed: paddingResidual <= tolerance, maximumResidual: paddingResidual},
		examples,
	};
}

function outputRouteGate(outputRoute) {
	const direct =
		outputRoute?.classification === 'identity-q8' &&
		outputRoute.requiredOfficialCtlEncoding === 'srgb-piecewise' &&
		outputRoute.shaderEncodesSrgb === true;
	const rendererOetf =
		outputRoute?.classification === 'srgb-oetf-q8' &&
		outputRoute.requiredOfficialCtlEncoding === 'none-renderer-supplies-srgb-oetf' &&
		outputRoute.shaderEncodesSrgb === false;
	return {
		passed: direct || rendererOetf,
		measured: outputRoute,
		officialReferenceEncoding: 'sRGB-piecewise',
		actualCodePolicy:
			'Identity framebuffer: shader emits sRGB-piecewise. Renderer sRGB OETF: shader emits display-linear so the framebuffer supplies the one and only OETF.',
		doubleEncoding: false,
	};
}

function referenceResponseDenied(reason, gates) {
	return {
		schemaVersion: 'aces2-glsl-evaluation-input-v1',
		authorized: false,
		reason,
		gates,
	};
}

function createReferenceAuthority({
	run,
	exrHelperPath,
	decisionFixture,
	comprehensiveFixture,
	sceneFixture,
	strictFixture,
	brunetonInputs,
	logs,
}) {
	let requestStarted = false;
	let previewAuthorizationStarted = false;
	let state = null;
	const requestEvaluation = async (payload) => {
		requireCondition(!requestStarted, 'Reference authority accepts exactly one same-run GPU request.');
		requestStarted = true;
		requireCondition(
			payload && typeof payload === 'object' && !Array.isArray(payload),
			'Reference request is invalid.',
		);
		const sameRunGpu = validateSameRunGpuEvidence(payload.browserEvidence, sceneFixture, payload.outputRoute);
		const route = outputRouteGate(payload.outputRoute);
		const prerequisiteGates = {sameRunGpu: sameRunGpu.gates, outputRoute: route};
		if (!sameRunGpu.gates.accepted || !route.passed) {
			state = {
				authorized: false,
				reason: 'same-run-gpu-science-or-output-route-rejected',
				browserEvidence: payload.browserEvidence,
				sameRunGpu,
				outputRoute: payload.outputRoute,
			};
			return referenceResponseDenied(state.reason, prerequisiteGates);
		}
		const measuredSamples = collectGpuMeasuredSamples(payload.browserEvidence, comprehensiveFixture);
		requireCondition(
			measuredSamples.length === EXPECTED_SAMPLE_COUNT,
			'Same-run measured-sample extraction is incomplete.',
		);
		const frameScan = scanInMemoryFrames(payload.frames, decisionFixture.previewConditionIds);
		const directProbes = decisionFixture.parity.probes.map((probe) => ({
			id: probe.id,
			sceneRgb: probe.signedLinearRec709,
		}));
		const grid = buildReferenceGrid({
			measuredSamples,
			frameProbes: [...directProbes, ...frameScan.probes],
			frameMaximumNormalized: frameScan.maximumNormalized,
			brunetonInputs,
			fixture: comprehensiveFixture,
		});
		const gridSummary = summarizeGrid(grid, measuredSamples, frameScan, brunetonInputs);
		requireCondition(
			gridSummary.directPortProbeCount === decisionFixture.parity.expectedProbeCount,
			'Comprehensive grid omitted one or more direct ACES GPU probes.',
		);
		requireCondition(
			gridSummary.brunetonPairCount === 1377 && gridSummary.measuredSampleCount === EXPECTED_SAMPLE_COUNT,
			'Comprehensive grid omitted same-run GPU samples or Bruneton pairs.',
		);
		const oracle = await transformCtlOracle(run, exrHelperPath, grid.records, logs, 1);
		const ctlOcioAuthority = evaluateCtlOracleParity({
			records: grid.records,
			ctl: oracle.ctl,
			ocio: oracle.ocio,
			ctlAp1: oracle.ctlAp1,
			ocioAp1: oracle.ocioAp1,
			fixture: comprehensiveFixture,
		});
		ctlOcioAuthority.execution = oracle.execution;
		const encodingBranches = await probeEncodingBranches(run, exrHelperPath, comprehensiveFixture, logs);
		const modelContinuity = await probeModelContinuity(run, exrHelperPath, grid.records, logs);
		const officialTables = await probeOfficialTables(run, exrHelperPath, logs, 1);
		const officialGpuTables = await probeOfficialGpuTables(run, exrHelperPath, logs, 1);
		const officialGpuTableShape = evaluateOfficialTableProbe({
			cuspRows: officialGpuTables.cuspRows.map((row) => [row[0], row[1], row[2], row[0]]),
			reachRows: officialGpuTables.reachRows,
		});
		const synthetic = evaluateSyntheticGrid(grid.records, oracle.ctl, oracle.ctlAp1, comprehensiveFixture);
		const pairs = evaluatePairDecision({
			records: grid.records,
			ctl: oracle.ctl,
			measuredSamples,
			rawOrdering: payload.browserEvidence.rawOrdering,
			fixture: comprehensiveFixture,
			requiredLanes: ['gpu'],
		});
		const brunetonNonRegression = evaluateBrunetonNonRegression(
			grid.records,
			oracle.ctl,
			brunetonInputs,
			comprehensiveFixture,
		);
		const trackedBrunetonGate = evaluateTrackedBrunetonGate(brunetonInputs, strictFixture);
		const gates = {
			proofId: PROOF_ID,
			sameRunGpu: sameRunGpu.gates,
			outputRoute: route,
			ctlOcioAuthority,
			encodingBranches,
			modelContinuity,
			synthetic,
			officialTables: {
				passed: officialTables.table.passed && officialTables.boundaries.passed && officialGpuTableShape.passed,
				table: officialTables.table,
				boundaries: officialTables.boundaries,
				gpuProbeShape: officialGpuTableShape,
			},
			pairs,
			brunetonNonRegression,
			trackedBrunetonGate,
		};
		gates.accepted = Object.entries(gates)
			.filter(
				([key, gate]) =>
					!['proofId', 'accepted'].includes(key) && gate.affectsOfflineCandidateAcceptance !== false,
			)
			.every(([, gate]) => gate.passed === true || gate.accepted === true);
		state = {
			authorized: gates.accepted,
			reason: gates.accepted ? null : 'official-reference-decision-rejected',
			browserEvidence: payload.browserEvidence,
			outputRoute: payload.outputRoute,
			sameRunGpu,
			measuredSamples,
			frameScan,
			grid,
			gridSummary,
			oracle,
			officialGpuTables,
			officialTables,
			gates,
		};
		if (!gates.accepted) return referenceResponseDenied(state.reason, gates);
		const input = encodeReferenceGrid(grid.records);
		return {
			schemaVersion: 'aces2-glsl-evaluation-input-v1',
			authorized: true,
			pixelCount: grid.records.length,
			rgba32fBase64: input.toString('base64'),
			inputByteLength: input.byteLength,
			recordIdDigest: gridSummary.recordIdDigest,
			oracleValuesDisclosed: false,
		};
	};
	const authorizePreviews = async (payload) => {
		requireCondition(!previewAuthorizationStarted, 'Preview authority accepts exactly one GLSL result.');
		previewAuthorizationStarted = true;
		requireCondition(
			state !== null && state.authorized === true,
			'GLSL evaluation preceded reference authorization.',
		);
		requireCondition(
			payload?.transformId === 'aces2-rec709-d65-100nit-srgb-piecewise-direct-glsl-v1' &&
				payload.profile?.acesRelease === 'v2.0.0+2025.04.04' &&
				payload.profile?.acesCommit === '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5' &&
				payload.profile?.peakLuminance === 100 &&
				payload.profile?.limitingPrimaries === 'Rec.709/D65' &&
				payload.profile?.encoding === 'sRGB-piecewise' &&
				payload.profile?.fixedSceneScale === FIXED_SCENE_SCALE,
			'Browser ACES GPU transform profile identity is invalid.',
		);
		const hardwareIdentity = requireHardwareRenderer(payload.webgl, 'ACES GPU transform');
		const glslPayload = payload.glsl;
		requireCondition(
			glslPayload?.schemaVersion === 'aces2-glsl-evaluation-output-v1' &&
				glslPayload.pixelCount === state.grid.records.length &&
				glslPayload.floatEncoding === 'float32-le-rgba-base64' &&
				glslPayload.codeEncoding === 'rgba8-base64' &&
				JSON.stringify(glslPayload.outputRoute) === JSON.stringify(state.outputRoute),
			'Browser GLSL evaluation identity is invalid.',
		);
		const floatBytes = Buffer.from(glslPayload.floatBase64, 'base64');
		const codeBytes = Buffer.from(glslPayload.codesBase64, 'base64');
		requireCondition(
			floatBytes.byteLength === glslPayload.floatByteLength &&
				floatBytes.byteLength === state.grid.records.length * 16 &&
				codeBytes.byteLength === glslPayload.codeByteLength &&
				codeBytes.byteLength === state.grid.records.length * 4,
			'Browser GLSL float or code byte count is invalid.',
		);
		const glsl = decodeRgba32f(floatBytes, state.grid.records.length);
		const parity = evaluateGlslParity({
			records: state.grid.records,
			ctl: state.oracle.ctl,
			glsl,
			codes: codeBytes,
			decisionFixture,
			comprehensiveFixture,
		});
		const tables = evaluateGpuTableParity({
			official: state.officialGpuTables,
			browserTables: payload.tables,
			decisionFixture,
		});
		const pairs = evaluatePairDecision({
			records: state.grid.records,
			ctl: glsl,
			measuredSamples: state.measuredSamples,
			rawOrdering: state.browserEvidence.rawOrdering,
			fixture: comprehensiveFixture,
			requiredLanes: ['gpu'],
		});
		const brunetonNonRegression = evaluateBrunetonNonRegression(
			state.grid.records,
			glsl,
			brunetonInputs,
			comprehensiveFixture,
		);
		const gates = {
			proofId: PROOF_ID,
			referenceAccepted: {passed: state.gates.accepted === true},
			hardwareWebgl: {passed: true, identity: hardwareIdentity},
			glslFloatAndActualQ8: parity,
			officialGpuTables: tables,
			pairs,
			brunetonNonRegression,
		};
		gates.accepted = Object.entries(gates)
			.filter(([key]) => !['proofId', 'accepted'].includes(key))
			.every(([, gate]) => gate.passed === true);
		state.glsl = {payload: glslPayload, float: glsl, codes: codeBytes, gates};
		return {
			schemaVersion: 'aces2-preview-authorization-v1',
			authorized: gates.accepted,
			reason: gates.accepted ? null : 'real-webgl-glsl-or-science-gate-rejected',
			gates,
			persistedViewsAuthorized: gates.accepted,
		};
	};
	return {
		requestEvaluation,
		authorizePreviews,
		state: () => state,
		requestStarted: () => requestStarted,
		previewAuthorizationStarted: () => previewAuthorizationStarted,
	};
}

function contentType(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case '.js':
			return 'text/javascript; charset=utf-8';
		case '.json':
			return 'application/json; charset=utf-8';
		default:
			return 'application/octet-stream';
	}
}

async function assertServedRoot(root, label) {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, root, label);
	const stats = await lstat(root);
	requireCondition(stats.isDirectory(), `${label} is not a directory.`);
	return realpath(root);
}

async function readJsonBody(request, limitBytes) {
	const declaredLength = Number(request.headers['content-length'] ?? 0);
	requireCondition(
		Number.isFinite(declaredLength) && declaredLength >= 0 && declaredLength <= limitBytes,
		'HTTP request exceeds its declared byte bound.',
	);
	const chunks = [];
	let byteLength = 0;
	for await (const chunk of request) {
		byteLength += chunk.byteLength;
		if (byteLength > limitBytes) throw new RangeError('HTTP request exceeds its streamed byte bound.');
		chunks.push(chunk);
	}
	if (request.headers['content-length'] !== undefined) {
		requireCondition(byteLength === declaredLength, 'HTTP body byte count differs from Content-Length.');
	}
	const body = Buffer.concat(chunks, byteLength);
	return {body, value: JSON.parse(body.toString('utf8'))};
}

function browserIndex(resultNonce) {
	return `<!doctype html>
<meta charset="utf-8">
<title>ACES 2 Sun appearance GPU first view</title>
<pre id="result">pending</pre>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
const target = document.querySelector('#result');
const resultNonce = ${JSON.stringify(resultNonce)};
let progressSequence = 0;
const postJson = async (pathname, value) => {
	const response = await fetch(pathname, {
		method: 'POST',
		headers: {'content-type': 'application/json', 'x-aces-first-view-nonce': resultNonce},
		body: JSON.stringify(value),
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(pathname + ' submission failed with HTTP ' + response.status + '.');
	if (response.status === 204) return null;
	return response.json();
};
const reportProgress = async (event) => {
	progressSequence += 1;
	await postJson('/progress', {
		schemaVersion: 'aces2-sun-appearance-gpu-first-view-progress-v1',
		sequence: progressSequence,
		...event,
	});
};
try {
	const {runAces2SunAppearanceGpuVisualCandidate} = await import('/harness/production-sun-appearance-aces2-gpu-browser-entry.js');
	const [decisionFixture, sceneFixture] = await Promise.all([
		fetch('/fixtures/aces2-sun-appearance-gpu-visual-candidate-v1.json', {cache: 'no-store'}).then((response) => response.json()),
		fetch('/fixtures/production-sun-appearance-gpu-visual-v1.json', {cache: 'no-store'}).then((response) => response.json()),
	]);
	const value = await runAces2SunAppearanceGpuVisualCandidate({
		decisionFixture,
		sceneFixture,
		reportProgress,
		requestGlslEvaluation: (payload) => postJson('/reference', payload),
		authorizePreviews: (payload) => postJson('/authorize', payload),
	});
	await postJson('/result', value);
	target.textContent = 'submitted';
} catch (error) {
	await postJson('/result', {error: {name: error.name, message: error.message, stack: error.stack}});
}
</script>`;
}

function validateProgressEvent(value, progressState) {
	requireCondition(
		value?.schemaVersion === 'aces2-sun-appearance-gpu-first-view-progress-v1',
		'ACES first-view progress schema is invalid.',
	);
	requireCondition(
		Number.isSafeInteger(value.sequence) && value.sequence === progressState.lastSequence + 1,
		'ACES first-view progress sequence is not contiguous.',
	);
	requireCondition(ALLOWED_PROGRESS_STAGES.has(value.stage), 'ACES first-view progress stage is not authored.');
	if (value.stage === 'evidence-condition-start' || value.stage === 'candidate-preview-start') {
		progressState.heartbeatResetRequired = true;
	}
	if (value.stage === 'condition-heartbeat') {
		if (progressState.heartbeatResetRequired) {
			requireCondition(value.heartbeatSequence === 1, 'A new GPU scene heartbeat must restart at sequence one.');
			requireCondition(
				Number.isFinite(value.workCompleted) && value.workCompleted > 0,
				'A new GPU scene heartbeat reported no advancing work.',
			);
			requireCondition(
				Number.isFinite(value.phaseDurationMilliseconds) && value.phaseDurationMilliseconds > 0,
				'A new GPU scene heartbeat duration did not advance.',
			);
		} else {
			requireCondition(
				Number.isSafeInteger(value.heartbeatSequence) &&
					value.heartbeatSequence === progressState.lastHeartbeatSequence + 1,
				'GPU cache heartbeat sequence is not contiguous inside one scene.',
			);
			requireCondition(
				Number.isFinite(value.workCompleted) && value.workCompleted > progressState.lastHeartbeatWorkCompleted,
				'GPU cache heartbeat did not report strictly advancing work.',
			);
			requireCondition(
				Number.isFinite(value.phaseDurationMilliseconds) &&
					value.phaseDurationMilliseconds > progressState.lastHeartbeatDurationMilliseconds,
				'GPU cache heartbeat duration did not advance.',
			);
		}
	}
	for (const key of [
		'durationMilliseconds',
		'phaseDurationMilliseconds',
		'gpuSetupAndCacheBuildMilliseconds',
		'totalDurationMilliseconds',
	]) {
		if (value[key] !== undefined) {
			requireCondition(Number.isFinite(value[key]) && value[key] >= 0, `Progress ${key} is invalid.`);
		}
	}
}

function recordProgressReceipt(progressState, receipt) {
	progressState.count += 1;
	progressState.lastSequence = receipt.event.sequence;
	progressState.chainSha256 = sha256(
		Buffer.from(`${progressState.chainSha256}\0${receipt.sha256}\0${receipt.event.sequence}`, 'utf8'),
	);
	if (receipt.event.stage === 'condition-heartbeat') {
		progressState.lastHeartbeatSequence = receipt.event.heartbeatSequence;
		progressState.lastHeartbeatWorkCompleted = receipt.event.workCompleted;
		progressState.lastHeartbeatDurationMilliseconds = receipt.event.phaseDurationMilliseconds;
		progressState.heartbeatResetRequired = false;
	}
	if (progressState.first.length < RETAINED_PROGRESS_RECEIPT_LIMIT / 2) progressState.first.push(receipt);
	else {
		progressState.last.push(receipt);
		if (progressState.last.length > RETAINED_PROGRESS_RECEIPT_LIMIT / 2) progressState.last.shift();
	}
}

function progressSummary(progressState) {
	return {
		schemaVersion: 'aces2-sun-appearance-gpu-first-view-progress-summary-v1',
		acceptedReceiptCount: progressState.count,
		lastSequence: progressState.lastSequence,
		lastHeartbeatSequence: progressState.lastHeartbeatSequence,
		lastHeartbeatWorkCompleted: progressState.lastHeartbeatWorkCompleted,
		lastHeartbeatDurationMilliseconds: progressState.lastHeartbeatDurationMilliseconds,
		chainSha256: progressState.chainSha256,
		retainedReceiptLimit: RETAINED_PROGRESS_RECEIPT_LIMIT,
		firstReceipts: progressState.first,
		lastReceipts: progressState.last,
	};
}

function progressLogLine(value) {
	if (value.stage === 'condition-heartbeat')
		return `[aces-first-view] GPU cache heartbeat ${value.heartbeatSequence}\n`;
	if (value.stage === 'sample-complete') {
		return `[aces-first-view] ${value.viewportId} sample ${value.sampleIndex}/${value.sampleCount} complete\n`;
	}
	return `[aces-first-view] ${value.stage}\n`;
}

async function startServer(indexHtml, resultNonce, authority) {
	const roots = new Map([
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/snapshot/', SNAPSHOT_ROOT],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const canonicalRoots = new Map();
	for (const [prefix, root] of roots) canonicalRoots.set(prefix, await assertServedRoot(root, `HTTP root ${prefix}`));
	const servedFiles = new Map();
	const progressState = {
		count: 0,
		lastSequence: 0,
		lastHeartbeatSequence: 0,
		lastHeartbeatWorkCompleted: -1,
		lastHeartbeatDurationMilliseconds: -1,
		heartbeatResetRequired: true,
		chainSha256: '0'.repeat(64),
		first: [],
		last: [],
	};
	let lastActivityEpochMilliseconds = Date.now();
	let terminalSubmissionStarted = false;
	let referenceSubmissionStarted = false;
	let authorizationSubmissionStarted = false;
	let resolveSubmission;
	const resultPromise = new Promise((resolve) => {
		resolveSubmission = resolve;
	});
	const noteActivity = () => {
		lastActivityEpochMilliseconds = Date.now();
	};
	const recordServedFile = (record) => {
		const prior = servedFiles.get(record.requestPath);
		if (prior && (prior.sha256 !== record.sha256 || prior.byteLength !== record.byteLength)) {
			throw new Error(`Served bytes changed during execution: ${record.requestPath}`);
		}
		servedFiles.set(record.requestPath, record);
	};
	const server = createServer(async (request, response) => {
		try {
			requireCondition(isLoopbackAddress(request.socket.remoteAddress), 'Browser request is not loopback-local.');
			const url = new URL(request.url ?? '/', 'http://127.0.0.1');
			if (['/progress', '/reference', '/authorize', '/result'].includes(url.pathname)) {
				requireCondition(request.method === 'POST', 'ACES first-view endpoints require POST.');
				requireCondition(
					request.headers['x-aces-first-view-nonce'] === resultNonce,
					'ACES first-view nonce is invalid.',
				);
				if (url.pathname === '/progress') {
					requireCondition(!terminalSubmissionStarted, 'Progress is closed after result submission begins.');
					const {body, value} = await readJsonBody(request, PROGRESS_BODY_LIMIT_BYTES);
					validateProgressEvent(value, progressState);
					const receipt = {
						receivedAt: new Date().toISOString(),
						byteLength: body.byteLength,
						sha256: sha256(body),
						event: value,
					};
					recordProgressReceipt(progressState, receipt);
					noteActivity();
					response.writeHead(204, {'cache-control': 'no-store'});
					response.end();
					process.stdout.write(progressLogLine(value));
					return;
				}
				if (url.pathname === '/reference') {
					requireCondition(!referenceSubmissionStarted, 'Reference endpoint accepts exactly one submission.');
					requireCondition(
						!authorizationSubmissionStarted && !terminalSubmissionStarted,
						'Reference request is out of order.',
					);
					referenceSubmissionStarted = true;
					const {value} = await readJsonBody(request, HANDSHAKE_BODY_LIMIT_BYTES);
					noteActivity();
					const returned = await authority.requestEvaluation(value);
					noteActivity();
					const body = Buffer.from(JSON.stringify(returned), 'utf8');
					response.writeHead(200, {'cache-control': 'no-store', 'content-type': 'application/json'});
					response.end(body);
					return;
				}
				if (url.pathname === '/authorize') {
					requireCondition(referenceSubmissionStarted, 'Preview authorization preceded reference authority.');
					requireCondition(
						!authorizationSubmissionStarted,
						'Preview authorization accepts exactly one submission.',
					);
					requireCondition(!terminalSubmissionStarted, 'Preview authorization followed terminal submission.');
					authorizationSubmissionStarted = true;
					const {value} = await readJsonBody(request, HANDSHAKE_BODY_LIMIT_BYTES);
					noteActivity();
					const returned = await authority.authorizePreviews(value);
					noteActivity();
					const body = Buffer.from(JSON.stringify(returned), 'utf8');
					response.writeHead(200, {'cache-control': 'no-store', 'content-type': 'application/json'});
					response.end(body);
					return;
				}
				requireCondition(!terminalSubmissionStarted, 'Result endpoint accepts exactly one submission.');
				terminalSubmissionStarted = true;
				const {body, value} = await readJsonBody(request, RESULT_BODY_LIMIT_BYTES);
				noteActivity();
				response.writeHead(204, {'cache-control': 'no-store'});
				response.end();
				resolveSubmission({
					value,
					receipt: {receivedAt: new Date().toISOString(), byteLength: body.byteLength, sha256: sha256(body)},
				});
				return;
			}
			if (url.pathname === '/') {
				requireCondition(request.method === 'GET', 'Browser index requires GET.');
				const body = Buffer.from(indexHtml, 'utf8');
				recordServedFile({
					requestPath: '/',
					root: 'generated-browser-index',
					relativePath: 'index.html',
					byteLength: body.byteLength,
					sha256: sha256(body),
				});
				response.writeHead(200, {'cache-control': 'no-store', 'content-type': 'text/html; charset=utf-8'});
				response.end(body);
				return;
			}
			requireCondition(request.method === 'GET', 'Static browser files require GET.');
			const pathname = decodeURIComponent(url.pathname);
			requireCondition(!pathname.includes('\\') && !pathname.includes('\0'), 'Unsafe browser request path.');
			const route = [...canonicalRoots.entries()].find(([prefix]) => pathname.startsWith(prefix));
			requireCondition(route, 'Unsupported browser request root.');
			const [prefix, canonicalRoot] = route;
			const relativePath = pathname.slice(prefix.length);
			requireCondition(
				relativePath.length > 0 &&
					!relativePath.split('/').includes('..') &&
					!path.posix.isAbsolute(relativePath),
				'Unsafe browser relative path.',
			);
			const allowedPaths = SERVED_CONTROL_PATHS.get(prefix);
			if (allowedPaths) {
				requireCondition(
					allowedPaths.has(relativePath),
					`Browser request is outside served closure: ${pathname}`,
				);
			}
			const target = assertLexicallyContained(
				canonicalRoot,
				path.join(canonicalRoot, ...relativePath.split('/')),
				'Browser request file',
			);
			const stats = await lstat(target);
			requireCondition(stats.isFile() && !stats.isSymbolicLink(), 'Browser request is not a plain file.');
			const canonicalTarget = await realpath(target);
			requireCondition(
				pathComparisonKey(canonicalTarget) === pathComparisonKey(target) &&
					isPathContained(canonicalRoot, canonicalTarget),
				'Browser request resolves outside its real root.',
			);
			const body = await readFile(canonicalTarget);
			recordServedFile({
				requestPath: pathname,
				root: prefix,
				relativePath,
				byteLength: body.byteLength,
				sha256: sha256(body),
			});
			response.writeHead(200, {'cache-control': 'no-store', 'content-type': contentType(canonicalTarget)});
			response.end(body);
		} catch (error) {
			response.writeHead(404, {'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8'});
			response.end(error?.message ?? String(error));
		}
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	requireCondition(address && typeof address === 'object', 'Browser server acquired no address.');
	return {
		url: `http://127.0.0.1:${address.port}/`,
		resultPromise,
		lastActivityEpochMilliseconds: () => lastActivityEpochMilliseconds,
		noteActivity,
		progressReceipts: () => progressSummary(progressState),
		servedFiles: () =>
			[...servedFiles.values()].sort((left, right) => compareStrings(left.requestPath, right.requestPath)),
		close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
	};
}

function collectBoundedBrowserStream(stream, label) {
	const chunks = [];
	let byteLength = 0;
	let overflow = false;
	stream.on('data', (chunk) => {
		byteLength += chunk.byteLength;
		if (!overflow && byteLength <= BROWSER_LOG_LIMIT_BYTES) chunks.push(chunk);
		else overflow = true;
	});
	return () => {
		requireCondition(!overflow, `${label} exceeded ${BROWSER_LOG_LIMIT_BYTES} bytes.`);
		return Buffer.concat(chunks).toString('utf8');
	};
}

function launchChrome(chromePath, arguments_) {
	const child = spawn(chromePath, arguments_, {stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true});
	const readStdout = collectBoundedBrowserStream(child.stdout, 'Chrome stdout');
	const readStderr = collectBoundedBrowserStream(child.stderr, 'Chrome stderr');
	const exitPromise = new Promise((resolve) => {
		child.once('error', (error) => resolve({kind: 'spawn-error', error: serializeError(error)}));
		child.once('close', (code, signal) => resolve({kind: 'exit', code, signal}));
	});
	return {child, launchedAt: new Date().toISOString(), exitPromise, readStdout, readStderr};
}

async function awaitBrowserSubmission(launched, server) {
	let intervalId;
	const inactivityPromise = new Promise((resolve) => {
		intervalId = setInterval(() => {
			const inactiveMilliseconds = Date.now() - server.lastActivityEpochMilliseconds();
			if (inactiveMilliseconds > INACTIVITY_TIMEOUT_MILLISECONDS) {
				resolve({kind: 'inactivity', inactiveMilliseconds});
			}
		}, INACTIVITY_POLL_MILLISECONDS);
	});
	const outcome = await Promise.race([
		server.resultPromise.then((submission) => ({kind: 'submission', submission})),
		launched.exitPromise.then((exit) => ({kind: 'premature-exit', exit})),
		inactivityPromise,
	]);
	clearInterval(intervalId);
	if (outcome.kind === 'inactivity') {
		throw new Error(
			`Chrome and same-run reference authority made no valid progress for ${outcome.inactiveMilliseconds} ms.`,
		);
	}
	if (outcome.kind === 'premature-exit') {
		throw new Error(`Chrome exited before result submission: ${JSON.stringify(outcome.exit)}.`);
	}
	return outcome.submission;
}

async function terminateChrome(launched) {
	if (launched.child.exitCode === null && launched.child.signalCode === null) launched.child.kill('SIGTERM');
	let timeoutId;
	let outcome = await Promise.race([
		launched.exitPromise,
		new Promise((resolve) => {
			timeoutId = setTimeout(() => resolve({kind: 'termination-timeout'}), 15000);
		}),
	]);
	clearTimeout(timeoutId);
	if (outcome.kind === 'termination-timeout') {
		launched.child.kill('SIGKILL');
		outcome = await launched.exitPromise;
	}
	return outcome;
}

function chromeArguments(profileDirectory, url) {
	return [
		'--headless=new',
		`--user-data-dir=${profileDirectory}`,
		`--disk-cache-dir=${path.join(profileDirectory, 'cache')}`,
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--disable-software-rasterizer',
		'--disable-dev-shm-usage',
		'--disable-background-networking',
		'--disable-breakpad',
		'--disable-component-update',
		'--disable-crash-reporter',
		'--disable-default-apps',
		'--disable-gpu-shader-disk-cache',
		'--disable-sync',
		'--metrics-recording-only',
		'--no-first-run',
		url,
	];
}

async function executeBrowser({runDirectory, chromePath, authority}) {
	const profileDirectory = path.join(runDirectory, 'browser-profile-aces2-first-view');
	const resultNonce = randomBytes(32).toString('hex');
	const indexHtml = browserIndex(resultNonce);
	const startedAtEpochMilliseconds = Date.now();
	let server = null;
	let launched = null;
	let submission = null;
	let failure = null;
	let exit = null;
	let profileCreated = false;
	try {
		await mkdir(profileDirectory, {recursive: false});
		profileCreated = true;
		await assertExistingRealPathContained(runDirectory, profileDirectory, 'ACES first-view Chrome profile');
		server = await startServer(indexHtml, resultNonce, authority);
		setReferenceDecisionProgressReporter(async () => server.noteActivity());
		launched = launchChrome(chromePath, chromeArguments(profileDirectory, server.url));
		try {
			submission = await awaitBrowserSubmission(launched, server);
		} catch (error) {
			failure = error;
		} finally {
			exit = await terminateChrome(launched);
		}
	} catch (error) {
		failure ??= error;
	} finally {
		setReferenceDecisionProgressReporter(null);
		if (server !== null) await server.close();
		if (profileCreated) {
			await assertExistingRealPathContained(runDirectory, profileDirectory, 'ACES first-view profile cleanup');
			await assertNoReparseEntries(profileDirectory, 'ACES first-view profile cleanup tree');
			await rm(profileDirectory, {recursive: true, force: false, maxRetries: 5, retryDelay: 100});
		}
	}
	return {
		startedAt: new Date(startedAtEpochMilliseconds).toISOString(),
		completedAt: new Date().toISOString(),
		wallDurationMilliseconds: Date.now() - startedAtEpochMilliseconds,
		pid: launched?.child.pid ?? null,
		launchedAt: launched?.launchedAt ?? null,
		exit,
		failure: failure ? serializeError(failure) : null,
		receipt: submission?.receipt ?? null,
		value: submission?.value ?? null,
		progressReceipts: server?.progressReceipts() ?? null,
		servedFiles: server?.servedFiles() ?? [],
		stdout: launched?.readStdout() ?? '',
		stderr: launched?.readStderr() ?? '',
		indexHtmlSha256: sha256(Buffer.from(indexHtml, 'utf8')),
		chromeProcessCount: launched === null ? 0 : 1,
		inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
		absoluteTimeoutMilliseconds: null,
	};
}

const ALLOWED_NODE_BUILTINS = [
	'node:child_process',
	'node:crypto',
	'node:fs',
	'node:fs/promises',
	'node:http',
	'node:module',
	'node:os',
	'node:path',
	'node:url',
	'node:util',
	'node:zlib',
];

async function createRuntimeClosure() {
	const descriptor = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: ['runners/run-aces2-sun-appearance-gpu-first-view.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: ALLOWED_NODE_BUILTINS,
	});
	requireCondition(
		JSON.stringify(descriptor.files) === JSON.stringify(EXPECTED_NODE_CLOSURE_PATHS),
		`ACES first-view Node closure differs from its exact authored list: ${JSON.stringify(descriptor.files)}.`,
	);
	const inventory = await createSelectedFileInventory(EXPERIMENT_ROOT, descriptor.files);
	return {
		descriptor,
		descriptorSha256: sha256(Buffer.from(JSON.stringify(descriptor), 'utf8')),
		inventory,
	};
}

async function createControlInventory(runtimeClosure) {
	const paths = [...runtimeClosure.descriptor.files, ...EXECUTED_CONTROL_PATHS, 'package.json', 'package-lock.json'];
	return createSelectedFileInventory(EXPERIMENT_ROOT, [...new Set(paths)].sort(compareStrings));
}

async function createThreeInventory() {
	return createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS);
}

function validateServedBrowserClosure(execution, snapshotInventory, controlsInventory, threeInventory) {
	const files = execution.servedFiles;
	const snapshotEntries = new Map(snapshotInventory.files.map((entry) => [entry.path, entry]));
	const controlEntries = new Map(controlsInventory.files.map((entry) => [entry.path, entry]));
	const threeEntries = new Map(threeInventory.files.map((entry) => [entry.path, entry]));
	const expectedHarness = [
		'lib/aces2-rec709-100nit-gpu.js',
		'lib/aces2-rec709-100nit-parameters.js',
		'lib/production-sun-appearance-gpu-visual-scene.js',
		'production-sun-appearance-aces2-gpu-browser-entry.js',
	].sort(compareStrings);
	const expectedFixtures = [
		'aces2-sun-appearance-gpu-visual-candidate-v1.json',
		'production-sun-appearance-gpu-visual-v1.json',
	].sort(compareStrings);
	const expectedThree = THREE_RUNTIME_PATHS.filter((entry) => entry !== 'three/package.json').sort(compareStrings);
	const expectedDependencyCount =
		snapshotInventory.fileCount + expectedHarness.length + expectedFixtures.length + expectedThree.length;
	requireCondition(
		Array.isArray(files) && files.length === expectedDependencyCount + 1,
		'ACES first-view served-browser closure count differs from the sealed expected closure.',
	);
	const requestPaths = new Set();
	const grouped = new Map([
		['/harness/', []],
		['/snapshot/', []],
		['/fixtures/', []],
		['/node_modules/', []],
	]);
	for (const file of files) {
		requireCondition(
			typeof file.requestPath === 'string' &&
				typeof file.relativePath === 'string' &&
				Number.isSafeInteger(file.byteLength) &&
				file.byteLength >= 0 &&
				/^[a-f0-9]{64}$/u.test(file.sha256),
			'Malformed served-browser file evidence.',
		);
		requireCondition(!requestPaths.has(file.requestPath), `Browser served duplicate path ${file.requestPath}.`);
		requestPaths.add(file.requestPath);
		if (file.requestPath === '/') {
			requireCondition(
				file.root === 'generated-browser-index' &&
					file.relativePath === 'index.html' &&
					file.sha256 === execution.indexHtmlSha256,
				'Generated browser-index identity differs.',
			);
			continue;
		}
		const prefix = [...grouped.keys()].find((candidate) => file.requestPath.startsWith(candidate));
		requireCondition(prefix && file.root === prefix, `Browser served an unknown root: ${file.requestPath}.`);
		requireCondition(file.requestPath === `${prefix}${file.relativePath}`, 'Served path identity is inconsistent.');
		grouped.get(prefix).push(file.relativePath);
		let expected;
		if (prefix === '/snapshot/') expected = snapshotEntries.get(file.relativePath);
		else if (prefix === '/node_modules/') expected = threeEntries.get(file.relativePath);
		else expected = controlEntries.get(`${prefix.slice(1)}${file.relativePath}`);
		requireCondition(
			expected && expected.bytes === file.byteLength && expected.sha256 === file.sha256,
			`Browser served bytes outside the sealed inventories: ${file.requestPath}.`,
		);
	}
	for (const values of grouped.values()) values.sort(compareStrings);
	requireCondition(
		JSON.stringify(grouped.get('/snapshot/')) ===
			JSON.stringify(snapshotInventory.files.map((entry) => entry.path)),
		'Browser did not execute the complete sealed production snapshot closure.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/harness/')) === JSON.stringify(expectedHarness),
		'Browser harness closure differs from the exact ACES first-view closure.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/fixtures/')) === JSON.stringify(expectedFixtures),
		'Browser fixture closure differs from the exact authored inputs.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/node_modules/')) === JSON.stringify(expectedThree),
		'Browser Three closure differs from the exact pinned runtime.',
	);
	const dependencies = files
		.filter((file) => file.requestPath !== '/')
		.map((file) => ({
			requestPath: file.requestPath,
			root: file.root,
			relativePath: file.relativePath,
			byteLength: file.byteLength,
			sha256: file.sha256,
		}));
	return {
		passed: true,
		dependencyFileCount: dependencies.length,
		snapshotModuleCount: grouped.get('/snapshot/').length,
		harnessModuleCount: grouped.get('/harness/').length,
		fixtureFileCount: grouped.get('/fixtures/').length,
		threeModuleCount: grouped.get('/node_modules/').length,
		dependencyClosureSha256: sha256(Buffer.from(JSON.stringify(dependencies), 'utf8')),
		files,
	};
}

function validateBrowserResult(result, authority, decisionFixture, sceneFixture) {
	if (result?.error) throw new Error(`Browser failed: ${result.error.message}`);
	requireCondition(
		result?.schemaVersion === 'aces2-sun-appearance-gpu-visual-candidate-browser-v1' &&
			result.decisionFixtureId === decisionFixture.id &&
			result.sceneFixtureId === sceneFixture.id &&
			result.generatedInputReuse === false,
		'Browser ACES first-view result identity is invalid.',
	);
	const state = authority.state();
	requireCondition(
		authority.requestStarted() && state !== null,
		'Browser did not invoke same-run reference authority.',
	);
	const accepted = state.glsl?.gates?.accepted === true;
	if (accepted) {
		requireCondition(
			authority.previewAuthorizationStarted(),
			'Accepted result omitted GLSL preview authorization.',
		);
		requireCondition(
			result.previewAuthorization?.authorized === true,
			'Accepted browser result lacks preview authorization.',
		);
		requireCondition(
			Array.isArray(result.previews) && result.previews.length === EXPECTED_PREVIEW_COUNT,
			'Accepted browser result lacks two GPU previews.',
		);
		const ids = result.previews.map((preview) => preview.conditionId);
		requireCondition(
			JSON.stringify(ids) === JSON.stringify(decisionFixture.previewConditionIds),
			'GPU preview IDs differ.',
		);
		for (const preview of result.previews) {
			requireCondition(
				Number.isSafeInteger(preview.width) &&
					preview.width > 0 &&
					Number.isSafeInteger(preview.height) &&
					preview.height > 0 &&
					preview.rowOrigin === 'bottom-left' &&
					preview.channelOrder === 'RGBA' &&
					preview.encoding === 'srgb-piecewise-rgba8-base64' &&
					preview.byteLength === preview.width * preview.height * 4 &&
					preview.scene?.executionBackend === 'gpu' &&
					preview.scene?.cpuReferenceUsed === false &&
					preview.scene?.sourcePathConvergenceEvaluated === false,
				`GPU preview ${preview.conditionId} metadata is invalid.`,
			);
			requireHardwareRenderer(preview.scene.renderer, `GPU preview rerender ${preview.conditionId}`);
			const codes = Buffer.from(preview.codesBase64, 'base64');
			requireCondition(codes.byteLength === preview.byteLength, `${preview.conditionId} GPU code count differs.`);
		}
	} else {
		requireCondition(
			Array.isArray(result.previews) && result.previews.length === 0,
			'Rejected browser result returned a preview.',
		);
		requireCondition(
			result.previewAuthorization?.authorized !== true,
			'Rejected browser result claims preview authorization.',
		);
	}
	return {accepted, state};
}

function sanitizedBrowserEvidence(result) {
	return {
		schemaVersion: result.schemaVersion,
		decisionFixtureId: result.decisionFixtureId,
		sceneFixtureId: result.sceneFixtureId,
		transformId: result.transformId ?? null,
		profile: result.profile ?? null,
		browserEvidence: result.browserEvidence,
		glsl:
			result.glsl == null
				? null
				: {
						schemaVersion: result.glsl.schemaVersion,
						pixelCount: result.glsl.pixelCount,
						packedWidth: result.glsl.packedWidth,
						packedHeight: result.glsl.packedHeight,
						floatEncoding: result.glsl.floatEncoding,
						floatByteLength: result.glsl.floatByteLength,
						floatSha256: sha256(Buffer.from(result.glsl.floatBase64, 'base64')),
						codeEncoding: result.glsl.codeEncoding,
						codeByteLength: result.glsl.codeByteLength,
						codesSha256: sha256(Buffer.from(result.glsl.codesBase64, 'base64')),
						outputRoute: result.glsl.outputRoute,
					},
		tables: result.tables ?? null,
		previewAuthorization: result.previewAuthorization,
		previews: (result.previews ?? []).map((preview) => ({
			conditionId: preview.conditionId,
			family: preview.family,
			width: preview.width,
			height: preview.height,
			rowOrigin: preview.rowOrigin,
			channelOrder: preview.channelOrder,
			encoding: preview.encoding,
			byteLength: preview.byteLength,
			codesSha256: sha256(Buffer.from(preview.codesBase64, 'base64')),
			outputRoute: preview.outputRoute,
			scene: preview.scene,
		})),
		claimBoundary: result.claimBoundary ?? null,
		generatedInputReuse: result.generatedInputReuse,
	};
}

async function verifyPostExecutionIdentity(executionSeal) {
	const [
		protectedState,
		protectedRoots,
		runtimeClosure,
		controls,
		snapshot,
		references,
		gpuPortProvenance,
		three,
		nodeExecutable,
		chromeExecutable,
	] = await Promise.all([
		verifyProtectedState(executionSeal.protectedBefore, executionSeal.containmentPolicy),
		createProtectedRootInventories(),
		createRuntimeClosure(),
		createControlInventory(executionSeal.runtimeClosureBefore),
		verifySnapshot(),
		validateReferences(),
		readJson(GPU_PORT_PROVENANCE_PATH),
		createThreeInventory(),
		createPlainExecutableIdentity(executionSeal.nodeExecutableBefore.path, 'Node executable'),
		createPlainExecutableIdentity(executionSeal.chromeExecutableBefore.path, 'Chrome executable'),
	]);
	assertProtectedRootInventoriesEqual(executionSeal.protectedRootsBefore, protectedRoots);
	assertFileInventoriesEqual(
		executionSeal.runtimeClosureBefore.inventory,
		runtimeClosure.inventory,
		'ACES first-view Node runtime closure before/after',
	);
	requireCondition(
		executionSeal.runtimeClosureBefore.descriptorSha256 === runtimeClosure.descriptorSha256,
		'ACES first-view Node closure descriptor changed during execution.',
	);
	assertFileInventoriesEqual(executionSeal.controlsBefore, controls, 'ACES first-view controls before/after');
	assertFileInventoriesEqual(executionSeal.threeBefore, three, 'Three runtime before/after ACES first-view run');
	requireCondition(
		JSON.stringify(executionSeal.nodeExecutableBefore) === JSON.stringify(nodeExecutable),
		'Canonical Node executable path or bytes changed during execution.',
	);
	requireCondition(
		JSON.stringify(executionSeal.chromeExecutableBefore) === JSON.stringify(chromeExecutable),
		'Canonical Chrome executable path or bytes changed during execution.',
	);
	assertFileInventoriesEqual(
		executionSeal.snapshotBefore.inventory,
		snapshot.inventory,
		'Sealed snapshot before/after',
	);
	requireCondition(
		executionSeal.snapshotBefore.manifestSha256 === snapshot.manifestSha256,
		'Sealed snapshot manifest changed during execution.',
	);
	requireCondition(
		JSON.stringify(executionSeal.referencesBefore.hashes) === JSON.stringify(references.hashes) &&
			executionSeal.referencesBefore.pythonRuntimeInventory.aggregateSha256 ===
				references.pythonRuntimeInventory.aggregateSha256 &&
			executionSeal.referencesBefore.ocioInstallInventory.aggregateSha256 ===
				references.ocioInstallInventory.aggregateSha256,
		'Pinned ACES/CTL/OCIO/Bruneton reference identity changed during execution.',
	);
	const gpuPortValidation = validateGpuPortProvenance(gpuPortProvenance);
	const gpuPortSources = await verifyGpuPortAuthoredSources(gpuPortProvenance);
	requireCondition(
		(await sha256File(GPU_PORT_PROVENANCE_PATH)) === executionSeal.gpuPortProvenanceSha256 &&
			(await sha256File(GPU_PORT_LICENSE_PATH)) === gpuPortProvenance.license.repositoryLicenseSha256,
		'ACES GPU port provenance changed during execution.',
	);
	requireCondition(
		JSON.stringify(gpuPortSources) === JSON.stringify(executionSeal.gpuPortSourcesBefore),
		'Contained OpenColorIO authored-source identities changed during execution.',
	);
	const prerequisite = await resolveGpuEvidencePrerequisite(
		executionSeal.prerequisite.runId,
		executionSeal.sceneFixtureSha256,
	);
	requireCondition(
		prerequisite.resultSha256 === executionSeal.prerequisite.resultSha256 &&
			prerequisite.gatesSha256 === executionSeal.prerequisite.gatesSha256 &&
			prerequisite.verification.artifactSetSha256 === executionSeal.prerequisite.verification.artifactSetSha256,
		'Accepted GPU-evidence prerequisite changed during ACES first-view execution.',
	);
	let wslExecution = null;
	let exrHelperSha256 = null;
	if (executionSeal.wslExecutionBefore) {
		exrHelperSha256 = await sha256File(executionSeal.exrHelperPath);
		requireCondition(
			exrHelperSha256 === executionSeal.exrHelperSha256,
			'Compiled EXR adapter bytes changed during ACES first-view execution.',
		);
		wslExecution = await collectWslExecutionIdentity(
			executionSeal.exrHelperPath,
			executionSeal.referencesBefore.ctl,
			executionSeal.compilerTemporaryDirectory,
		);
		requireCondition(
			JSON.stringify(comparableWslExecutionIdentity(executionSeal.wslExecutionBefore)) ===
				JSON.stringify(comparableWslExecutionIdentity(wslExecution)),
			'WSL/CTL/OCIO execution identity changed during ACES first-view execution.',
		);
	}
	return {
		protectedState,
		protectedRoots,
		runtimeClosure,
		controls,
		snapshot,
		references,
		gpuPortValidation,
		gpuPortSources,
		prerequisite,
		three,
		nodeExecutable,
		chromeExecutable,
		wslExecution,
		exrHelperSha256,
	};
}

async function persistGpuPreviews(run, previews) {
	const pointers = [];
	for (const preview of previews) {
		const codes = Buffer.from(preview.codesBase64, 'base64');
		requireCondition(
			codes.byteLength === preview.width * preview.height * 4,
			`${preview.conditionId} RGBA8 count differs.`,
		);
		const png = encodeGpuRgba8Png(codes, preview.width, preview.height, preview.rowOrigin);
		requireCondition(
			png.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
			'GPU preview PNG signature is invalid.',
		);
		const safeId = preview.conditionId.replace(/[^a-z0-9-]/gu, '-');
		const artifactPath = `captures/${safeId}-aces2-rec709-100nit-srgb.png`;
		await run.writeArtifact(artifactPath, png);
		pointers.push({
			conditionId: preview.conditionId,
			family: preview.family,
			artifactPath,
			sha256: sha256(png),
			bytes: png.byteLength,
			mediaType: 'image/png',
			width: preview.width,
			height: preview.height,
			sourceCodesSha256: sha256(codes),
			rowOrigin: preview.rowOrigin,
			colorEncoding: 'sRGB-piecewise final codes from actual GPU default-framebuffer readback',
			packaging:
				'lossless host-side PNG packaging only; no CPU display transform or full-frame atmospheric generation',
		});
	}
	requireCondition(
		JSON.stringify(pointers.map((pointer) => pointer.conditionId)) ===
			JSON.stringify(['sunset-minus-10-minutes', 'flat-long']),
		'Persisted GPU preview identities differ from the two authored scenes.',
	);
	return pointers;
}

function reportText(runId, conclusion, evidence) {
	return `# ${runId}: pinned ACES 2 GPU Sun-appearance first view

Conclusion: **${conclusion}**

- Prior GPU evidence prerequisite: ${evidence.prerequisiteRunId}; terminal identity only, with no generated frame or science artifact reused.
- Same-run scene evidence: ${evidence.sameRunSampleCount} unique hardware-GPU samples and ${evidence.sameRunPairCount} viewport-qualified raw pairs across 8 conditions and 2 viewports.
- Numerical authority: the complete ${evidence.gridRecordCount}-record grid ran independently through official ACES CTL and pinned OCIO, including all 1,377 Bruneton pairs.
- GLSL: ${evidence.glslAccepted ? 'accepted' : 'not accepted'} against official floats, absolute/relative/ULP bounds, exact actual-default-framebuffer Q8, tables, CAT/neutral/cusp/seam, pair/radial order, and Bruneton non-regression.
- Candidate views: ${evidence.previewCount}; persisted only after every same-run reference, GLSL, closure, hardware, and protected-input gate passed.
- Execution: one Chrome process, serial scene calls, hardware WebGL only, 75-minute inactivity lease, and no absolute elapsed-time cap.
- Deferred: production CPU/binary64 scene authority, refined 20..1280 convergence, CPU full-frame transform, final production qualification, and promotion.
`;
}

async function verifyFinalizedRun(runDirectory, terminalManifest, expectedConclusion) {
	const verification = await verifyRun(runDirectory);
	requireCondition(
		verification.verified === true &&
			verification.conclusion === expectedConclusion &&
			verification.artifactSetSha256 === terminalManifest.artifactSetSha256,
		'Canonical immutable-run verification disagrees with finalization.',
	);
	return verification;
}

async function preflightBeforeAllocation(selector) {
	await assertRepositoryIdentity();
	const sceneFixtureBytes = await readFile(SCENE_FIXTURE_PATH);
	const sceneFixture = JSON.parse(sceneFixtureBytes.toString('utf8'));
	const sceneFixtureSha256 = sha256(sceneFixtureBytes);
	const prerequisite = await resolveGpuEvidencePrerequisite(selector, sceneFixtureSha256);
	const chromePath = await findChrome();
	const [nodeExecutable, chromeExecutable] = await Promise.all([
		createPlainExecutableIdentity(process.execPath, 'Node executable'),
		createPlainExecutableIdentity(chromePath, 'Chrome executable'),
	]);
	return {sceneFixture, sceneFixtureSha256, prerequisite, chromePath, nodeExecutable, chromeExecutable};
}

async function main() {
	if (process.argv.length > 3) {
		throw new Error('Usage: run-aces2-sun-appearance-gpu-first-view.js [accepted-gpu-evidence-run-id]');
	}
	const selector = process.argv[2] ?? null;
	// This read-only prerequisite check deliberately precedes immutable-run
	// allocation. Invoking the lane before full GPU evidence accepts creates no
	// ACES run, browser profile, CTL output, or GPU resource.
	const preflight = await preflightBeforeAllocation(selector);
	const run = await initializeRunRecord({
		slug: RUN_SLUG,
		command: selector ? `${COMMAND} ${selector}` : COMMAND,
		inputs: {
			schemaId: PROOF_ID,
			acceptedGpuEvidenceRunId: preflight.prerequisite.runId,
			acceptedGpuEvidenceResultSha256: preflight.prerequisite.resultSha256,
			acceptedGpuEvidenceGatesSha256: preflight.prerequisite.gatesSha256,
			generatedPrerequisiteUse: 'terminal identity and gates only; no prior run artifact is a science input',
			decisionFixture: toRepositoryRelativePath(DECISION_FIXTURE_PATH),
			comprehensiveFixture: toRepositoryRelativePath(COMPREHENSIVE_FIXTURE_PATH),
			sceneFixture: toRepositoryRelativePath(SCENE_FIXTURE_PATH),
			sceneFixtureSha256: preflight.sceneFixtureSha256,
			candidate: 'ACES v2.0.0+2025.04.04 / 100-nit Rec.709-D65 / sRGB-piecewise / fixed K',
		},
		provenance: {
			experiment: 'experiments/extraterrestrial',
			acesReleaseCommit: '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5',
			ctlCommit: 'a63c7ec4c1e3cc2c66df4fd8f2f083d9eb1c2f35',
			ctlToolchainPatchCommit: 'f1c75e0d6a08b46e4eccc1fe0cf62e250e9fbd8b',
			ocioCommit: '6918fad3f5d22ac3ef2397c754bf4268c2b58dd0',
			gpuPort: toRepositoryRelativePath(GPU_PORT_PROVENANCE_PATH),
		},
		environment: {
			node: process.version,
			nodeExecutable: preflight.nodeExecutable,
			platform: process.platform,
			architecture: process.arch,
			browser: preflight.chromePath,
			browserExecutable: preflight.chromeExecutable,
			browserProcessCount: 1,
			sceneExecution: 'serial independent scene contexts in one Chrome process',
			inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
			absoluteTimeoutMilliseconds: null,
			ctlConcurrency: 1,
		},
		references: {
			gpuEvidencePrerequisite: preflight.prerequisite.runId,
			gpuEvidencePolicy:
				'canonical terminal result/gates identity prerequisite only; no generated science artifact input',
			gpuPortProvenance: toRepositoryRelativePath(GPU_PORT_PROVENANCE_PATH),
			officialTableProbe: 'experiments/extraterrestrial/reference-transforms/Aces2Official100NitGpuTableProbe.ctl',
			brunetonReference: toRepositoryRelativePath(BRUNETON_REFERENCE_ROOT),
		},
	});
	const logs = [];
	const executionSeal = {
		prerequisite: preflight.prerequisite,
		sceneFixtureSha256: preflight.sceneFixtureSha256,
		nodeExecutableBefore: preflight.nodeExecutable,
		chromeExecutableBefore: preflight.chromeExecutable,
	};
	try {
		await assertRepositoryIdentity();
		const containmentPolicy = await loadContainmentPolicy();
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree');
		executionSeal.containmentPolicy = containmentPolicy;
		executionSeal.protectedBefore = await captureProtectedState(containmentPolicy);
		executionSeal.protectedRootsBefore = await createProtectedRootInventories();
		executionSeal.runtimeClosureBefore = await createRuntimeClosure();
		executionSeal.controlsBefore = await createControlInventory(executionSeal.runtimeClosureBefore);
		executionSeal.snapshotBefore = await verifySnapshot();
		executionSeal.referencesBefore = await validateReferences();
		const gpuPortProvenance = await readJson(GPU_PORT_PROVENANCE_PATH);
		const gpuPortValidation = validateGpuPortProvenance(gpuPortProvenance);
		executionSeal.gpuPortProvenanceSha256 = await sha256File(GPU_PORT_PROVENANCE_PATH);
		executionSeal.gpuPortSourcesBefore = await verifyGpuPortAuthoredSources(gpuPortProvenance);
		requireCondition(
			(await sha256File(GPU_PORT_LICENSE_PATH)) === gpuPortProvenance.license.repositoryLicenseSha256,
			'Contained OpenColorIO license bytes differ from pinned provenance.',
		);
		executionSeal.threeBefore = await createThreeInventory();
		const [
			decisionFixture,
			comprehensiveFixture,
			sceneFixture,
			strictFixture,
			brunetonText,
			productionText,
			cieText,
		] = await Promise.all([
			readJson(DECISION_FIXTURE_PATH),
			readJson(COMPREHENSIVE_FIXTURE_PATH),
			readJson(SCENE_FIXTURE_PATH),
			readJson(STRICT_BRUNETON_FIXTURE_PATH),
			readFile(BRUNETON_TABLE_PATH, 'utf8'),
			readFile(BRUNETON_GPU_TABLE_PATH, 'utf8'),
			readFile(CIE_TABLE_PATH, 'utf8'),
		]);
		requireCondition(
			(await sha256File(SCENE_FIXTURE_PATH)) === preflight.sceneFixtureSha256,
			'GPU scene fixture changed after the accepted prerequisite was selected.',
		);
		const fixtureValidation = validateAuthoredFixtures({
			decisionFixture,
			comprehensiveFixture,
			sceneFixture,
			strictFixture,
			references: executionSeal.referencesBefore,
		});
		const brunetonInputs = collectBrunetonNonRegressionInputs({brunetonText, productionText, cieText});
		requireCondition(brunetonInputs.pairs.length === 1377, 'Contained Bruneton pairing is incomplete.');
		await run.writeJsonArtifact('evidence/prerequisite-identity.json', {
			proofId: GPU_EVIDENCE_PROOF_ID,
			runId: preflight.prerequisite.runId,
			verification: preflight.prerequisite.verification,
			resultSha256: preflight.prerequisite.resultSha256,
			gatesSha256: preflight.prerequisite.gatesSha256,
			fixtureSha256: preflight.sceneFixtureSha256,
			consumedFields: 'terminal result/gates identity only',
			consumedScienceArtifacts: false,
		});
		await run.writeJsonArtifact('evidence/source-identity-before.json', {
			controls: executionSeal.controlsBefore,
			runtimeClosure: executionSeal.runtimeClosureBefore,
			protectedWorkingTree: executionSeal.protectedBefore,
			protectedRoots: executionSeal.protectedRootsBefore,
			snapshot: executionSeal.snapshotBefore,
			three: executionSeal.threeBefore,
			nodeExecutable: executionSeal.nodeExecutableBefore,
			chromeExecutable: executionSeal.chromeExecutableBefore,
			fixtureValidation,
			gpuPortValidation,
			gpuPortSources: executionSeal.gpuPortSourcesBefore,
			gpuPortProvenanceSha256: executionSeal.gpuPortProvenanceSha256,
			referenceHashes: executionSeal.referencesBefore.hashes,
		});
		await run.writeArtifact('work/build-root.txt', `${run.runId}\n`);
		const compilerTemporaryDirectory = path.join(run.runDirectory, 'work', 'compiler-tmp');
		await mkdir(compilerTemporaryDirectory, {recursive: false});
		executionSeal.compilerTemporaryDirectory = compilerTemporaryDirectory;
		const wslToolchainBefore = await collectWslExecutionIdentity(
			null,
			executionSeal.referencesBefore.ctl,
			compilerTemporaryDirectory,
		);
		const exrHelperPath = await compileExrHelper(run, compilerTemporaryDirectory, logs);
		executionSeal.exrHelperPath = exrHelperPath;
		const exrHelperSha256 = await sha256File(exrHelperPath);
		executionSeal.exrHelperSha256 = exrHelperSha256;
		const wslExecutionBefore = await collectWslExecutionIdentity(
			exrHelperPath,
			executionSeal.referencesBefore.ctl,
			compilerTemporaryDirectory,
		);
		executionSeal.wslExecutionBefore = wslExecutionBefore;
		requireCondition(
			JSON.stringify(comparableWslToolchainIdentity(wslToolchainBefore)) ===
				JSON.stringify(comparableWslToolchainIdentity(wslExecutionBefore)),
			'WSL compiler/CTL identity changed while compiling the EXR adapter.',
		);
		const ctlRuntimePreflight = await runCtlRuntimePreflight(
			run,
			exrHelperPath,
			executionSeal.referencesBefore.ctlPatch,
			comprehensiveFixture,
			logs,
		);
		const authority = createReferenceAuthority({
			run,
			exrHelperPath,
			decisionFixture,
			comprehensiveFixture,
			sceneFixture,
			strictFixture,
			brunetonInputs,
			logs,
		});
		const browserExecution = await executeBrowser({
			runDirectory: run.runDirectory,
			chromePath: preflight.chromePath,
			authority,
		});
		requireCondition(
			browserExecution.failure === null,
			`ACES first-view browser failed: ${browserExecution.failure?.message}.`,
		);
		requireCondition(browserExecution.receipt !== null, 'ACES first-view browser returned no terminal receipt.');
		requireCondition(
			browserExecution.chromeProcessCount === 1,
			'ACES first-view did not use exactly one Chrome process.',
		);
		const browserClosure = validateServedBrowserClosure(
			browserExecution,
			executionSeal.snapshotBefore.inventory,
			executionSeal.controlsBefore,
			executionSeal.threeBefore,
		);
		const browserValidation = validateBrowserResult(
			browserExecution.value,
			authority,
			decisionFixture,
			sceneFixture,
		);
		const postIdentity = await verifyPostExecutionIdentity(executionSeal);
		const state = browserValidation.state;
		const gates = {
			proofId: PROOF_ID,
			acceptedGpuEvidencePrerequisite: {passed: true, runId: preflight.prerequisite.runId},
			noGeneratedScienceInputReuse: {
				passed: true,
				priorRunUse: 'terminal identity only',
				sameRunSceneSource: 'independent sealed-production GPU rerender',
			},
			ctlRuntimePreflight,
			referenceDecision: state?.gates ?? {
				passed: false,
				accepted: false,
				reason: state?.reason ?? 'reference-authority-not-reached',
			},
			glslDecision: state?.glsl?.gates ?? {
				passed: false,
				accepted: false,
				reason: 'GLSL evaluation not authorized',
			},
			browserExecutedClosure: browserClosure,
			serialHardwareExecution: {
				passed: browserExecution.chromeProcessCount === 1,
				chromeProcessCount: browserExecution.chromeProcessCount,
				scenePolicy: 'serial; each scene context is disposed and force-lost before the next',
				inactivityTimeoutMilliseconds: browserExecution.inactivityTimeoutMilliseconds,
				absoluteTimeoutMilliseconds: browserExecution.absoluteTimeoutMilliseconds,
			},
			protectedInputs: {
				passed: true,
				runtimeClosureSha256: postIdentity.runtimeClosure.descriptorSha256,
				runtimeClosureFileCount: postIdentity.runtimeClosure.inventory.fileCount,
				snapshotAggregateSha256: postIdentity.snapshot.inventory.aggregateSha256,
				prerequisiteArtifactSetSha256: postIdentity.prerequisite.verification.artifactSetSha256,
				nodeExecutable: postIdentity.nodeExecutable,
				chromeExecutable: postIdentity.chromeExecutable,
				threeAggregateSha256: postIdentity.three.aggregateSha256,
				gpuPortSources: postIdentity.gpuPortSources,
				protectedRoots: postIdentity.protectedRoots.map((record) => ({
					id: record.id,
					repositoryRelativePath: record.repositoryRelativePath,
					fileCount: record.inventory.fileCount,
					aggregateSha256: record.inventory.aggregateSha256,
				})),
				requiredRuntimeClosureFileCount: EXPECTED_NODE_CLOSURE_PATHS.length,
				requiredProtectedRootCount: PROTECTED_ROOTS.length,
				beforeAfterExact: true,
			},
			finalVerificationDeferred: {
				passed: true,
				productionCpuMirrorAndBinary64SceneAuthority: true,
				sourcePathConvergence20Through1280: true,
				cpuFullFramePreviewAndTransform: true,
				productionPromotion: true,
			},
		};
		gates.accepted =
			gates.acceptedGpuEvidencePrerequisite.passed &&
			gates.noGeneratedScienceInputReuse.passed &&
			gates.ctlRuntimePreflight.passed &&
			gates.referenceDecision.accepted === true &&
			gates.glslDecision.accepted === true &&
			gates.browserExecutedClosure.passed &&
			gates.serialHardwareExecution.passed &&
			gates.protectedInputs.passed &&
			gates.finalVerificationDeferred.passed;
		requireCondition(gates.accepted === browserValidation.accepted, 'Host/browser aggregate acceptance disagrees.');
		await run.writeJsonArtifact('evidence/ctl-runtime-preflight.json', ctlRuntimePreflight);
		await run.writeJsonArtifact('evidence/reference-grid-summary.json', state?.gridSummary ?? null);
		await run.writeJsonArtifact('evidence/reference-decision-gates.json', state?.gates ?? {reason: state?.reason});
		await run.writeJsonArtifact(
			'evidence/glsl-decision-gates.json',
			state?.glsl?.gates ?? {reason: 'not-authorized'},
		);
		await run.writeJsonArtifact('evidence/official-gpu-table-probes.json', {
			rows: state?.officialGpuTables ?? null,
			boundaries: state?.officialTables?.boundaries ?? null,
		});
		await run.writeJsonArtifact('evidence/browser-result.json', sanitizedBrowserEvidence(browserExecution.value));
		await run.writeJsonArtifact('evidence/browser-execution.json', {
			startedAt: browserExecution.startedAt,
			completedAt: browserExecution.completedAt,
			wallDurationMilliseconds: browserExecution.wallDurationMilliseconds,
			pid: browserExecution.pid,
			launchedAt: browserExecution.launchedAt,
			exit: browserExecution.exit,
			failure: browserExecution.failure,
			receipt: browserExecution.receipt,
			chromeProcessCount: browserExecution.chromeProcessCount,
			inactivityTimeoutMilliseconds: browserExecution.inactivityTimeoutMilliseconds,
			absoluteTimeoutMilliseconds: browserExecution.absoluteTimeoutMilliseconds,
			browserValuePersistedAt: 'evidence/browser-result.json',
			servedClosurePersistedAt: 'evidence/browser-executed-closure.json',
			progressPersistedAt: 'evidence/browser-progress.json',
			logsPersistedUnder: 'logs/',
		});
		await run.writeJsonArtifact('evidence/browser-progress.json', browserExecution.progressReceipts);
		await run.writeJsonArtifact('evidence/browser-executed-closure.json', browserClosure);
		await run.writeJsonArtifact('evidence/gates.json', gates);
		await run.writeJsonArtifact('evidence/tool-logs.json', {logs});
		await run.writeArtifact('logs/chrome-stdout.txt', browserExecution.stdout);
		await run.writeArtifact('logs/chrome-stderr.txt', browserExecution.stderr);
		await run.writeJsonArtifact('evidence/source-identity-after.json', {
			controls: postIdentity.controls,
			runtimeClosure: postIdentity.runtimeClosure,
			protectedWorkingTree: postIdentity.protectedState,
			protectedRoots: postIdentity.protectedRoots,
			snapshot: postIdentity.snapshot,
			three: postIdentity.three,
			nodeExecutable: postIdentity.nodeExecutable,
			chromeExecutable: postIdentity.chromeExecutable,
			referenceHashes: postIdentity.references.hashes,
			gpuPortValidation: postIdentity.gpuPortValidation,
			gpuPortSources: postIdentity.gpuPortSources,
			prerequisite: {
				runId: postIdentity.prerequisite.runId,
				resultSha256: postIdentity.prerequisite.resultSha256,
				gatesSha256: postIdentity.prerequisite.gatesSha256,
			},
			exrHelperSha256Before: exrHelperSha256,
			exrHelperSha256After: postIdentity.exrHelperSha256,
			wslToolchainBefore,
			wslExecutionBefore,
			wslExecutionAfter: postIdentity.wslExecution,
		});
		const finalIdentity = await verifyPostExecutionIdentity(executionSeal);
		await run.writeJsonArtifact('evidence/source-identity-final-before-preview.json', {
			verifiedAfterAllAuthorityAndEvidenceWrites: true,
			controls: finalIdentity.controls,
			runtimeClosure: finalIdentity.runtimeClosure,
			protectedWorkingTree: finalIdentity.protectedState,
			protectedRoots: finalIdentity.protectedRoots,
			snapshot: finalIdentity.snapshot,
			three: finalIdentity.three,
			nodeExecutable: finalIdentity.nodeExecutable,
			chromeExecutable: finalIdentity.chromeExecutable,
			referenceHashes: finalIdentity.references.hashes,
			gpuPortValidation: finalIdentity.gpuPortValidation,
			gpuPortSources: finalIdentity.gpuPortSources,
			prerequisite: {
				runId: finalIdentity.prerequisite.runId,
				resultSha256: finalIdentity.prerequisite.resultSha256,
				gatesSha256: finalIdentity.prerequisite.gatesSha256,
			},
			exrHelperSha256: finalIdentity.exrHelperSha256,
			wslExecution: finalIdentity.wslExecution,
		});
		let previews = [];
		if (gates.accepted) {
			previews = await persistGpuPreviews(run, browserExecution.value.previews);
			await run.writeJsonArtifact('evidence/candidate-previews.json', {
				createdAfterAllSameRunGatesAccepted: true,
				independentProductionGpuRerender: true,
				cpuFullFrameTransform: false,
				previews,
			});
		}
		const conclusion = gates.accepted ? 'accepted' : 'rejected';
		const reportEvidence = {
			prerequisiteRunId: preflight.prerequisite.runId,
			sameRunSampleCount: state?.sameRunGpu?.rowIds?.length ?? 0,
			sameRunPairCount: state?.sameRunGpu?.pairIds?.length ?? 0,
			gridRecordCount: state?.grid?.records?.length ?? 0,
			glslAccepted: state?.glsl?.gates?.accepted === true,
			previewCount: previews.length,
		};
		const terminalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: PROOF_ID,
				status: conclusion,
				accepted: gates.accepted,
				acceptedGpuEvidenceRunId: preflight.prerequisite.runId,
				generatedPriorRunScienceInputUsed: false,
				executionBackend: 'hardware-gpu',
				chromeProcessCount: 1,
				conditionCount: EXPECTED_CONDITION_COUNT,
				viewportCount: EXPECTED_VIEWPORT_COUNT,
				sameRunSampleCount: reportEvidence.sameRunSampleCount,
				sameRunRawOrderingPairCount: reportEvidence.sameRunPairCount,
				gridRecordCount: reportEvidence.gridRecordCount,
				brunetonPairCount: brunetonInputs.pairs.length,
				candidatePreviewCount: previews.length,
				candidatePreviews: previews.map((preview) => preview.artifactPath),
				finalVerificationDeferred: true,
			},
			report: reportText(run.runId, conclusion, reportEvidence),
		});
		const verification = await verifyFinalizedRun(run.runDirectory, terminalManifest, conclusion);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					verified: verification.verified,
					candidatePreviews: previews.map((preview) => preview.artifactPath),
					artifactSetSha256: terminalManifest.artifactSetSha256,
				},
				null,
				2,
			)}\n`,
		);
		if (!gates.accepted) process.exitCode = 2;
	} catch (error) {
		const primaryDetail = serializeError(error);
		let postExecutionIdentity = null;
		let postExecutionIdentityError = null;
		let postExecutionIdentityAttempted = false;
		let postExecutionIdentitySkippedReason = null;
		try {
			if (
				executionSeal.containmentPolicy &&
				executionSeal.protectedBefore &&
				executionSeal.protectedRootsBefore &&
				executionSeal.runtimeClosureBefore &&
				executionSeal.controlsBefore &&
				executionSeal.snapshotBefore &&
				executionSeal.referencesBefore &&
				executionSeal.gpuPortProvenanceSha256 &&
				executionSeal.gpuPortSourcesBefore &&
				executionSeal.threeBefore &&
				executionSeal.nodeExecutableBefore &&
				executionSeal.chromeExecutableBefore
			) {
				postExecutionIdentityAttempted = true;
				postExecutionIdentity = await verifyPostExecutionIdentity(executionSeal);
			} else {
				postExecutionIdentitySkippedReason = 'not-available-before-seal-completed';
			}
		} catch (identityError) {
			postExecutionIdentityError = serializeError(identityError);
		}
		const detail =
			postExecutionIdentityError === null
				? primaryDetail
				: {
						name: 'PostExecutionIdentityError',
						message: `Post-execution identity verification failed after: ${primaryDetail.message}`,
						primaryError: primaryDetail,
						postExecutionIdentityError,
					};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			await run.writeJsonArtifact('evidence/failure-identity-after.json', {
				attempted: postExecutionIdentityAttempted,
				verified:
					postExecutionIdentityAttempted &&
					postExecutionIdentity !== null &&
					postExecutionIdentityError === null,
				identity: postExecutionIdentity,
				error: postExecutionIdentityError,
				skippedReason: postExecutionIdentitySkippedReason,
			});
			if (logs.length > 0) await run.writeJsonArtifact('evidence/failure-tool-logs.json', {logs});
			const conclusion = 'failed';
			const terminalManifest = await run.finalize({
				conclusion,
				result: {proofId: PROOF_ID, status: conclusion, accepted: false, error: detail},
				report: `# ${run.runId}: pinned ACES 2 GPU Sun-appearance first view\n\nConclusion: **${conclusion}**\n\n${detail.message}\n`,
			});
			const verification = await verifyFinalizedRun(run.runDirectory, terminalManifest, conclusion);
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion,
						verified: verification.verified,
						error: detail,
						artifactSetSha256: terminalManifest.artifactSetSha256,
					},
					null,
					2,
				)}\n`,
			);
		} catch (finalizationError) {
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'partial-unfinalized',
						error: detail,
						finalizationError: serializeError(finalizationError),
					},
					null,
					2,
				)}\n`,
			);
		}
		process.exitCode = 1;
	}
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		process.stderr.write(`${JSON.stringify(serializeError(error), null, 2)}\n`);
		process.exitCode = 1;
	});
}
