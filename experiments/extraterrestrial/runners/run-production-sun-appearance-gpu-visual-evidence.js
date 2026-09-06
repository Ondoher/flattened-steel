#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import path from 'node:path';

import {assertExistingRealPathContained, assertNoReparseEntries} from '../harness/lib/containment.js';
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
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from '../harness/lib/roots.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-production-sun-appearance-gpu-visual-evidence.js';
const PROOF_ID = 'production-sun-appearance-gpu-visual-evidence-v1';
const RUN_SLUG = 'production-sun-appearance-gpu-visual-evidence';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const HARNESS_PATH = path.join(EXPERIMENT_ROOT, 'harness', 'production-sun-appearance-gpu-visual-browser-entry.js');
const SCENE_MODULE_PATH = path.join(EXPERIMENT_ROOT, 'harness', 'lib', 'production-sun-appearance-gpu-visual-scene.js');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-gpu-visual-v1.json');
const FLAT_SOURCE_FIXTURE_PATH = path.join(
	EXPERIMENT_ROOT,
	'fixtures',
	'union-glacier-flat-local-closest-approach-v1.json',
);
const CHROME_CANDIDATES = [
	process.env.PRODUCTION_SUN_APPEARANCE_CHROME,
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const RESULT_BODY_LIMIT_BYTES = 256 * 1024 * 1024;
const PROGRESS_BODY_LIMIT_BYTES = 16 * 1024;
const RETAINED_PROGRESS_RECEIPT_LIMIT = 64;
const BROWSER_LOG_LIMIT_BYTES = 16 * 1024 * 1024;
const INACTIVITY_TIMEOUT_MILLISECONDS = 10 * 60 * 1000;
const INACTIVITY_POLL_MILLISECONDS = 1000;
const EXPECTED_CONDITION_COUNT = 8;
const EXPECTED_VIEWPORT_COUNT = 2;
const EXPECTED_SAMPLE_COUNT = 104;
const EXPECTED_PAIR_COUNT = 144;
const EXPECTED_PREVIEW_COUNT = 2;
const EXPECTED_BROWSER_SNAPSHOT_MODULE_COUNT = 139;
const EXPECTED_BROWSER_THREE_MODULE_COUNT = 8;
const EXPECTED_BROWSER_DEPENDENCY_FILE_COUNT = 150;
const EXPECTED_NODE_CLOSURE_PATHS = [
	'harness/lib/atomic-files.js',
	'harness/lib/containment.js',
	'harness/lib/hashes.js',
	'harness/lib/module-closure.js',
	'harness/lib/roots.js',
	'harness/lib/run-record.js',
	'runners/run-production-sun-appearance-gpu-visual-evidence.js',
	'runners/verify-run.js',
];
const EXECUTED_CONTROL_PATHS = [
	'fixtures/production-sun-appearance-gpu-visual-v1.json',
	'fixtures/union-glacier-flat-local-closest-approach-v1.json',
	'harness/lib/atomic-files.js',
	'harness/lib/containment.js',
	'harness/lib/hashes.js',
	'harness/lib/module-closure.js',
	'harness/lib/production-sun-appearance-gpu-visual-scene.js',
	'harness/lib/roots.js',
	'harness/lib/run-record.js',
	'harness/production-sun-appearance-gpu-visual-browser-entry.js',
	'package-lock.json',
	'package.json',
	'runners/run-production-sun-appearance-gpu-visual-evidence.js',
	'runners/verify-run.js',
];
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
const SERVED_THREE_RUNTIME_PATHS = THREE_RUNTIME_PATHS.filter((relativePath) => relativePath !== 'three/package.json');
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
];
const SERVED_CONTROL_PATHS = new Map([
	[
		'/harness/',
		new Set([
			'production-sun-appearance-gpu-visual-browser-entry.js',
			'lib/production-sun-appearance-gpu-visual-scene.js',
		]),
	],
	['/fixtures/', new Set(['production-sun-appearance-gpu-visual-v1.json'])],
	['/node_modules/', new Set(THREE_RUNTIME_PATHS)],
]);

/** Return a stable lexical string comparison. */
function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

/** Convert one thrown value into JSON-compatible evidence. */
function serializeError(error) {
	return {
		name: error?.name ?? 'Error',
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}

/** Reject execution when one required invariant is false. */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Return whether two shard identities are exact. */
function shardIdentityMatches(actual, expected) {
	return (
		actual?.id === expected.id &&
		actual?.family === expected.family &&
		actual?.conditionId === expected.conditionId &&
		actual?.conditionIndex === expected.conditionIndex &&
		actual?.conditionCount === expected.conditionCount
	);
}

/** Require one browser-provided shard identity to match its allocation. */
function requireShardIdentity(actual, expected, label) {
	requireCondition(shardIdentityMatches(actual, expected), `${label} shard identity differs from allocation.`);
}

/** Validate the authored fixture and form its exact ordered condition shards. */
function createConditionShards(fixture) {
	const ordered = [
		...(fixture.distant?.conditions ?? []).map((condition) => ({family: 'distant', condition})),
		...(fixture.flat?.conditions ?? []).map((condition) => ({family: 'flat', condition})),
	];
	requireCondition(fixture.id === 'production-sun-appearance-gpu-visual-v1', 'GPU visual fixture id differs.');
	requireCondition(fixture.proofId === PROOF_ID, 'GPU visual fixture proof id differs.');
	requireCondition(
		fixture.productionProfileId === 'algorithm32-native-production-default-v1',
		'GPU visual fixture production profile id differs.',
	);
	requireCondition(
		fixture.fixedSceneScale?.owner === 'BrunetonColorDisplayModel.DISPLAY_TONE_MAP_K' &&
			fixture.fixedSceneScale.variable === false &&
			fixture.fixedSceneScale.luminousEfficacyLumensPerWatt === 683 &&
			fixture.fixedSceneScale.referenceLuminanceMultiplier === 5 &&
			fixture.fixedSceneScale.value === 1 / (5 * 683),
		'GPU visual fixture does not freeze the production Figure-1 display constants.',
	);
	requireCondition(ordered.length === EXPECTED_CONDITION_COUNT, 'GPU visual fixture must contain 8 conditions.');
	requireCondition(
		fixture.viewports?.length === EXPECTED_VIEWPORT_COUNT &&
			fixture.sampling?.requiredViewportCount === EXPECTED_VIEWPORT_COUNT,
		'GPU visual fixture must contain both frozen viewports.',
	);
	requireCondition(
		fixture.sampling?.requiredSampleCount === EXPECTED_SAMPLE_COUNT &&
			fixture.sampling?.requiredRawOrderingPairCount === EXPECTED_PAIR_COUNT,
		'GPU visual fixture exact aggregate counts differ.',
	);
	requireCondition(
		fixture.outputContract?.requireExactCodeClassification === true &&
			fixture.outputContract?.requireDeterministicNoDitherClassification === true &&
			fixture.outputContract?.requireNormalFramebufferPngIdentity === true &&
			fixture.diagnosticTolerances?.sentinelRgba32fMaximumUlp === 0 &&
			fixture.diagnosticTolerances?.float32CompositionMaximumUlp === 0 &&
			fixture.diagnosticTolerances?.deterministicQuantizedCodesMustMatchExactly === true &&
			fixture.diagnosticTolerances?.normalFramebufferMaximumCodeResidual === 1 &&
			fixture.diagnosticTolerances?.flatObservationPlacementMeters === 1 &&
			fixture.diagnosticTolerances?.flatDerivedRadialIdentityMeters === 0.000001,
		'GPU visual fixture does not freeze its exact float/code gate contract.',
	);
	requireCondition(
		fixture.finalVerificationDeferred?.cpuReferenceAuthority === true &&
			fixture.finalVerificationDeferred?.sourcePathConvergence20Through1280 === true &&
			fixture.finalVerificationDeferred?.gpuCpuResidualQualification === true,
		'GPU fixture does not explicitly defer CPU/refined authority to final verification.',
	);
	requireCondition(
		fixture.flat?.conditions?.every(
			(condition) => condition.expectedCenterMeters?.[2] === fixture.flat.source?.heightMeters,
		) === true,
		'Flat authored center height differs from the frozen source height.',
	);
	const previewIds = ordered
		.filter(({condition}) => condition.requiredPreview === true)
		.map(({condition}) => condition.id);
	requireCondition(
		JSON.stringify(previewIds) === JSON.stringify(['sunset-minus-10-minutes', 'flat-long']),
		'GPU visual fixture must select exactly the two retained preview scenes.',
	);
	const expectedPartitions = new Map([
		['solar-noon', 'calibration'],
		['sunset-minus-30-minutes', 'holdout'],
		['sunset-minus-20-minutes', 'calibration'],
		['sunset-minus-10-minutes', 'holdout'],
		['sunset', 'calibration'],
		['flat-close', 'calibration'],
		['flat-medium', 'holdout'],
		['flat-long', 'calibration'],
	]);
	return ordered.map(({family, condition}, index) => {
		requireCondition(
			expectedPartitions.get(condition.id) === condition.partition,
			`Condition ${condition.id} changed its frozen calibration/holdout partition.`,
		);
		return {
			id: `condition-${String(index + 1).padStart(2, '0')}-${family}-${condition.id}`,
			family,
			conditionId: condition.id,
			conditionIndex: index + 1,
			conditionCount: ordered.length,
		};
	});
}

/** Require every duplicated Flat presentation fact to equal its canonical authored source fixture. */
function validateFlatSourceFixture(fixture, sourceFixture, sourceFixtureSha256) {
	const identity = fixture.flat?.sourceFixture;
	requireCondition(
		identity?.path === 'experiments/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json' &&
			identity.schemaVersion === sourceFixture.schemaVersion &&
			identity.sha256 === sourceFixtureSha256,
		'GPU visual Flat source-fixture identity differs from the canonical authored fixture.',
	);
	requireCondition(
		fixture.flat.source.sourceId === sourceFixture.source.sourceId &&
			fixture.flat.source.radiusMeters === sourceFixture.source.radiusMeters &&
			JSON.stringify(fixture.flat.source.surfaceRadianceValues) ===
				JSON.stringify(sourceFixture.source.surfaceRadianceValues),
		'GPU visual Flat source values differ from the canonical authored fixture.',
	);
	for (const condition of fixture.flat.conditions) {
		const sourceStateId = identity.stateMappings[condition.id];
		const sourceState = sourceFixture.states.find((state) => state.id === sourceStateId);
		requireCondition(sourceState, `Flat condition ${condition.id} has no canonical source state.`);
		requireCondition(
			JSON.stringify(condition.expectedCenterMeters) === JSON.stringify(sourceState.centerMeters) &&
				condition.expectedCacheRadialMaximumMeters === sourceState.cacheRadialMaximumMeters,
			`Flat condition ${condition.id} differs from canonical source state ${sourceStateId}.`,
		);
	}
	requireCondition(
		fixture.flat.geometry.topAltitudeMeters === sourceFixture.geometry.topAltitudeMeters &&
			fixture.flat.geometry.observerDomeApexMeters === sourceFixture.geometry.observerDomeApexMeters &&
			fixture.flat.geometry.observerDomeMaximumViewRayMeters ===
				sourceFixture.geometry.observerDomeMaxViewRayMeters,
		'GPU visual Flat geometry differs from the canonical authored fixture.',
	);
}

/** Find one exact installed Chrome executable without following a link. */
async function findChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		try {
			const stats = await lstat(candidate);
			if (!stats.isSymbolicLink() && stats.isFile()) {
				const canonical = await realpath(candidate);
				if (pathComparisonKey(canonical) === pathComparisonKey(candidate)) return canonical;
			}
		} catch (error) {
			if (error?.code !== 'ENOENT') throw error;
		}
	}
	throw new Error('No plain Chrome executable was found; set PRODUCTION_SUN_APPEARANCE_CHROME.');
}

/** Validate the sealed snapshot manifest's identity and equality claim. */
function validateSnapshotManifest(manifest) {
	requireCondition(
		manifest?.schemaId === 'production-sun-appearance-snapshot-v1',
		'Production appearance snapshot manifest schema is invalid.',
	);
	requireCondition(
		manifest.snapshotRoot === 'experiments/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
		'Production appearance snapshot root identity is invalid.',
	);
	requireCondition(
		manifest.source?.inventory?.aggregateSha256 === manifest.sealedInventory?.aggregateSha256,
		'Production source and sealed snapshot hashes disagree.',
	);
}

/** Recompute and verify every sealed snapshot byte. */
async function verifySnapshot() {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Production appearance snapshot');
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Production appearance snapshot');
	const manifest = JSON.parse(await readFile(SNAPSHOT_MANIFEST_PATH, 'utf8'));
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

/** Build and fingerprint the exact Node executable closure used by this runner. */
async function createNodeExecutableClosure() {
	const descriptor = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: ['runners/run-production-sun-appearance-gpu-visual-evidence.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: ALLOWED_NODE_BUILTINS,
	});
	requireCondition(
		JSON.stringify(descriptor.files) === JSON.stringify(EXPECTED_NODE_CLOSURE_PATHS),
		`Node executable closure differs from its exact authored list: ${JSON.stringify(descriptor.files)}.`,
	);
	const inventory = await createSelectedFileInventory(EXPERIMENT_ROOT, descriptor.files);
	return {
		descriptor,
		descriptorSha256: sha256(Buffer.from(JSON.stringify(descriptor), 'utf8')),
		inventory,
	};
}

/** Inventory every complete production or historical source root protected during this run. */
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

/** Require all protected roots to retain their exact identities and complete byte inventories. */
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
			`Protected root ${expected.repositoryRelativePath} before/after GPU visual run`,
		);
	}
}

/** Require one served root to be a real contained directory. */
async function assertServedRoot(root, label) {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, root, label);
	const stats = await lstat(root);
	requireCondition(stats.isDirectory(), `${label} is not a directory.`);
	return realpath(root);
}

/** Return a bounded content type for one served extension. */
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

/** Create one nonce-bound browser entry for one exact condition process. */
function browserIndex(resultNonce, executionShard) {
	return `<!doctype html>
<meta charset="utf-8">
<title>Production Sun appearance GPU visual evidence</title>
<pre id="result">pending</pre>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
const target = document.querySelector('#result');
const resultNonce = ${JSON.stringify(resultNonce)};
const executionShard = ${JSON.stringify(executionShard)};
let progressSequence = 0;
const postJson = async (pathname, value) => {
	const response = await fetch(pathname, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-sun-gpu-visual-nonce': resultNonce,
			'x-sun-gpu-visual-shard-id': executionShard.id,
		},
		body: JSON.stringify(value),
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(pathname + ' submission failed with HTTP ' + response.status + '.');
};
const reportProgress = async (event) => {
	progressSequence += 1;
	await postJson('/progress', {
		schemaVersion: 'production-sun-appearance-gpu-visual-progress-v1',
		sequence: progressSequence,
		executionShard,
		...event,
	});
};
try {
	const {runProductionSunAppearanceGpuVisualScene} = await import('/harness/production-sun-appearance-gpu-visual-browser-entry.js');
	const fixture = await (await fetch('/fixtures/production-sun-appearance-gpu-visual-v1.json', {cache: 'no-store'})).json();
	const value = await runProductionSunAppearanceGpuVisualScene(fixture, reportProgress, executionShard);
	await postJson('/result', value);
	target.textContent = 'submitted';
} catch (error) {
	await postJson('/result', {executionShard, error: {name: error.name, message: error.message, stack: error.stack}});
}
</script>`;
}

/** Return whether one HTTP peer is loopback-local. */
function isLoopbackAddress(value) {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

/** Validate one bounded liveness-only browser progress record. */
function validateProgressEvent(value, progressState, expectedShard) {
	requireCondition(
		value?.schemaVersion === 'production-sun-appearance-gpu-visual-progress-v1',
		'GPU visual progress schema is invalid.',
	);
	requireCondition(
		Number.isSafeInteger(value.sequence) && value.sequence === progressState.lastSequence + 1,
		'GPU visual progress sequence is not contiguous.',
	);
	requireShardIdentity(value.executionShard, expectedShard, 'GPU visual progress');
	const stages = new Set([
		'output-contract-start',
		'output-contract-complete',
		'condition-start',
		'gpu-setup-start',
		'condition-heartbeat',
		'gpu-setup-complete',
		'sample-start',
		'sample-complete',
		'preview-start',
		'preview-complete',
		'condition-complete',
	]);
	requireCondition(stages.has(value.stage), `Unsupported GPU visual progress stage ${String(value.stage)}.`);
	if (value.stage === 'condition-heartbeat') {
		requireCondition(
			Number.isSafeInteger(value.heartbeatSequence) &&
				value.heartbeatSequence === progressState.lastHeartbeatSequence + 1,
			'GPU cache heartbeat sequence is not contiguous.',
		);
		requireCondition(
			Number.isFinite(value.workCompleted) && value.workCompleted > progressState.lastHeartbeatWorkCompleted,
			'GPU cache heartbeat did not report strictly advancing measurable work.',
		);
		requireCondition(
			Number.isFinite(value.phaseDurationMilliseconds) &&
				value.phaseDurationMilliseconds > progressState.lastHeartbeatDurationMilliseconds,
			'GPU cache heartbeat duration did not advance.',
		);
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

/** Retain a bounded first/last progress window and one chain digest without capping liveness. */
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
	}
	if (progressState.first.length < RETAINED_PROGRESS_RECEIPT_LIMIT / 2) {
		progressState.first.push(receipt);
	} else {
		progressState.last.push(receipt);
		if (progressState.last.length > RETAINED_PROGRESS_RECEIPT_LIMIT / 2) progressState.last.shift();
	}
}

/** Return the immutable bounded progress-summary shape persisted with the shard. */
function progressSummary(progressState) {
	return {
		schemaVersion: 'production-sun-appearance-gpu-visual-progress-summary-v1',
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

/** Return one concise terminal progress line. */
function progressLogLine(value) {
	const prefix = `[sun-gpu-visual:${value.executionShard.id}]`;
	if (value.stage === 'condition-heartbeat') {
		return `${prefix} GPU cache heartbeat ${value.heartbeatSequence}\n`;
	}
	if (value.stage === 'sample-complete') {
		return `${prefix} ${value.viewportId} sample ${value.sampleIndex}/${value.sampleCount} complete\n`;
	}
	return `${prefix} ${value.stage}\n`;
}

/** Read one bounded JSON request body. */
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

/** Start one loopback-only, nonce-bound server for one exact isolated browser shard. */
async function startServer(indexHtml, resultNonce, expectedShard) {
	const roots = new Map([
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/snapshot/', SNAPSHOT_ROOT],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const canonicalRoots = new Map();
	for (const [prefix, root] of roots) {
		canonicalRoots.set(prefix, await assertServedRoot(root, `HTTP root ${prefix}`));
	}
	const servedFiles = new Map();
	const progressState = {
		count: 0,
		lastSequence: 0,
		lastHeartbeatSequence: 0,
		lastHeartbeatWorkCompleted: -1,
		lastHeartbeatDurationMilliseconds: -1,
		chainSha256: '0'.repeat(64),
		first: [],
		last: [],
	};
	let lastActivityEpochMilliseconds = Date.now();
	let submissionStarted = false;
	let resolveSubmission;
	const resultPromise = new Promise((resolve) => {
		resolveSubmission = resolve;
	});
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
			if (url.pathname === '/progress' || url.pathname === '/result') {
				requireCondition(request.method === 'POST', 'Evidence endpoints require POST.');
				requireCondition(
					request.headers['x-sun-gpu-visual-nonce'] === resultNonce,
					'Evidence nonce is invalid.',
				);
				requireCondition(
					request.headers['x-sun-gpu-visual-shard-id'] === expectedShard.id,
					'Evidence shard header is invalid.',
				);
				if (url.pathname === '/progress') {
					requireCondition(!submissionStarted, 'Progress is closed after result submission begins.');
					const {body, value} = await readJsonBody(request, PROGRESS_BODY_LIMIT_BYTES);
					validateProgressEvent(value, progressState, expectedShard);
					const receipt = {
						receivedAt: new Date().toISOString(),
						byteLength: body.byteLength,
						sha256: sha256(body),
						event: value,
					};
					recordProgressReceipt(progressState, receipt);
					lastActivityEpochMilliseconds = Date.now();
					response.writeHead(204, {'cache-control': 'no-store'});
					response.end();
					process.stdout.write(progressLogLine(value));
					return;
				}
				requireCondition(!submissionStarted, 'Result endpoint accepts exactly one submission.');
				submissionStarted = true;
				const {body, value} = await readJsonBody(request, RESULT_BODY_LIMIT_BYTES);
				requireShardIdentity(value.executionShard, expectedShard, 'GPU visual result');
				lastActivityEpochMilliseconds = Date.now();
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
		progressReceipts: () => progressSummary(progressState),
		servedFiles: () =>
			[...servedFiles.values()].sort((left, right) => compareStrings(left.requestPath, right.requestPath)),
		close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
	};
}

/** Collect one child stream without permitting unbounded browser log output. */
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

/** Launch one exact hidden Chrome child for one exact condition. */
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

/** Wait indefinitely while valid progress keeps the shard's inactivity lease alive. */
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
		throw new Error(`Chrome made no valid progress for ${outcome.inactiveMilliseconds} ms.`);
	}
	if (outcome.kind === 'premature-exit') {
		throw new Error(`Chrome exited before result submission: ${JSON.stringify(outcome.exit)}.`);
	}
	return outcome.submission;
}

/** Terminate one completed or failed exact child and await process closure. */
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

/** Return the contained, network-disabled headless browser arguments. */
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

/** Execute and clean one condition before the caller may start the next process. */
async function executeConditionShard({runDirectory, chromePath, shard, resultNonce, indexHtml}) {
	const profileDirectory = path.join(runDirectory, `browser-profile-${shard.id}`);
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
		await assertExistingRealPathContained(runDirectory, profileDirectory, `${shard.id} Chrome profile`);
		server = await startServer(indexHtml, resultNonce, shard);
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
		if (server !== null) await server.close();
		if (profileCreated) {
			await assertExistingRealPathContained(runDirectory, profileDirectory, `${shard.id} profile cleanup`);
			await assertNoReparseEntries(profileDirectory, `${shard.id} Chrome profile cleanup tree`);
			await rm(profileDirectory, {recursive: true, force: false, maxRetries: 5, retryDelay: 100});
		}
	}
	return {
		shard,
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
	};
}

/** Validate the complete set and byte identity of modules actually served to one browser shard. */
function validateServedBrowserClosure(execution, snapshotInventory, controlsInventory, threeInventory) {
	const files = execution.servedFiles;
	requireCondition(
		Array.isArray(files) && files.length === EXPECTED_BROWSER_DEPENDENCY_FILE_COUNT + 1,
		`${execution.shard.id} served-browser closure count differs.`,
	);
	const requestPaths = new Set();
	const snapshotEntries = new Map(snapshotInventory.files.map((entry) => [entry.path, entry]));
	const controlEntries = new Map(controlsInventory.files.map((entry) => [entry.path, entry]));
	const threeEntries = new Map(threeInventory.files.map((entry) => [entry.path, entry]));
	const groupedPaths = new Map([
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
			`${execution.shard.id} contains malformed served-file evidence.`,
		);
		requireCondition(!requestPaths.has(file.requestPath), `${execution.shard.id} served a duplicate request path.`);
		requestPaths.add(file.requestPath);
		if (file.requestPath === '/') {
			requireCondition(
				file.root === 'generated-browser-index' &&
					file.relativePath === 'index.html' &&
					file.sha256 === execution.indexHtmlSha256,
				`${execution.shard.id} browser-index identity differs.`,
			);
			continue;
		}
		const prefix = [...groupedPaths.keys()].find((candidate) => file.requestPath.startsWith(candidate));
		requireCondition(prefix && file.root === prefix, `${execution.shard.id} served an unknown dependency root.`);
		requireCondition(file.requestPath === `${prefix}${file.relativePath}`, 'Served path/relative-path mismatch.');
		groupedPaths.get(prefix).push(file.relativePath);
		let expected;
		if (prefix === '/snapshot/') expected = snapshotEntries.get(file.relativePath);
		else if (prefix === '/node_modules/') expected = threeEntries.get(file.relativePath);
		else expected = controlEntries.get(`${prefix.slice(1)}${file.relativePath}`);
		requireCondition(
			expected && expected.bytes === file.byteLength && expected.sha256 === file.sha256,
			`${execution.shard.id} served bytes outside the sealed inventories: ${file.requestPath}.`,
		);
	}
	for (const paths of groupedPaths.values()) paths.sort(compareStrings);
	requireCondition(
		groupedPaths.get('/snapshot/').length === EXPECTED_BROWSER_SNAPSHOT_MODULE_COUNT,
		`${execution.shard.id} did not serve the complete 139-module production snapshot closure.`,
	);
	requireCondition(
		JSON.stringify(groupedPaths.get('/harness/')) ===
			JSON.stringify([
				'lib/production-sun-appearance-gpu-visual-scene.js',
				'production-sun-appearance-gpu-visual-browser-entry.js',
			]),
		`${execution.shard.id} served harness closure differs.`,
	);
	requireCondition(
		JSON.stringify(groupedPaths.get('/fixtures/')) ===
			JSON.stringify(['production-sun-appearance-gpu-visual-v1.json']),
		`${execution.shard.id} served fixture closure differs.`,
	);
	requireCondition(
		groupedPaths.get('/node_modules/').length === EXPECTED_BROWSER_THREE_MODULE_COUNT &&
			JSON.stringify(groupedPaths.get('/node_modules/')) ===
				JSON.stringify([...SERVED_THREE_RUNTIME_PATHS].sort(compareStrings)),
		`${execution.shard.id} served Three closure differs.`,
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
		dependencyFileCount: dependencies.length,
		snapshotModuleCount: groupedPaths.get('/snapshot/').length,
		harnessModuleCount: groupedPaths.get('/harness/').length,
		fixtureFileCount: groupedPaths.get('/fixtures/').length,
		threeModuleCount: groupedPaths.get('/node_modules/').length,
		dependencyClosureSha256: sha256(Buffer.from(JSON.stringify(dependencies), 'utf8')),
	};
}

/** Return one fixture condition by exact shard identity. */
function fixtureCondition(fixture, shard) {
	const condition = fixture[shard.family]?.conditions?.find((entry) => entry.id === shard.conditionId);
	requireCondition(condition, `${shard.id} has no fixture condition.`);
	return condition;
}

/** Return the expected sample and pair counts for one condition. */
function expectedConditionCounts(fixture, condition) {
	const diskCount = 2;
	const orientationCount = condition.radialOrientations.length;
	const skyCount = fixture.sampling.circumsolarOffsetsDegrees.length * orientationCount;
	return {
		samplesPerViewport: diskCount + skyCount,
		sampleCount: (diskCount + skyCount) * fixture.viewports.length,
		pairCount: diskCount * skyCount * fixture.viewports.length,
	};
}

/** Require one finite numeric array of exact length. */
function requireFiniteArray(value, length, label) {
	requireCondition(
		Array.isArray(value) && value.length === length && value.every(Number.isFinite),
		`${label} is invalid.`,
	);
}

/** Return the standard sRGB output-transfer value for one linear scalar. */
function srgbEncode(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** Quantize one mapper RGB triplet under the measured output-transfer classification. */
function predictedQ8(mapperRgb, classification) {
	return mapperRgb.map((value) => {
		const encoded = classification === 'srgb-oetf-q8' ? srgbEncode(value) : value;
		return Math.round(Math.max(0, Math.min(1, encoded)) * 255);
	});
}

/** Return the largest RGB code residual from one expected triplet. */
function maximumRgbCodeResidual(actualRgba, expectedRgb) {
	if (!Array.isArray(actualRgba) || actualRgba.length !== 4) return Number.POSITIVE_INFINITY;
	return Math.max(...expectedRgb.map((expected, index) => Math.abs(actualRgba[index] - expected)));
}

/** Return whether two complete RGBA code rows are byte-identical. */
function rgbaCodesEqual(left, right) {
	return (
		Array.isArray(left) &&
		Array.isArray(right) &&
		left.length === 4 &&
		right.length === 4 &&
		left.every((value, index) => value === right[index])
	);
}

/** Require one exact ledger of unsigned 8-bit RGBA rows. */
function requireRgba8Rows(rows, length, label) {
	requireCondition(Array.isArray(rows) && rows.length === length, `${label} row count differs.`);
	for (const row of rows) {
		requireCondition(
			Array.isArray(row) &&
				row.length === 4 &&
				row.every((value) => Number.isInteger(value) && value >= 0 && value <= 255),
			`${label} contains a non-RGBA8 row.`,
		);
	}
}

/** Fail operationally when the output-measurement apparatus did not establish its boundary. */
function validateOutputProbeOperational(result, execution, fixture) {
	const label = execution.shard.id;
	const outputContract = result.outputContract;
	const sentinelValues = fixture.outputContract.sentinelLinearValues;
	requireCondition(outputContract !== null && typeof outputContract === 'object', `${label} output probe is absent.`);
	requireCondition(
		JSON.stringify(outputContract.sentinelValues) === JSON.stringify(sentinelValues),
		`${label} output probe used another sentinel input ledger.`,
	);
	requireCondition(
		Array.isArray(outputContract.rgba32f) && outputContract.rgba32f.length === sentinelValues.length,
		`${label} float sentinel ledger is incomplete.`,
	);
	for (let index = 0; index < sentinelValues.length; index += 1) {
		const row = outputContract.rgba32f[index];
		requireCondition(
			Array.isArray(row) &&
				row.length === 4 &&
				row.every(Number.isFinite) &&
				row.slice(0, 3).every((value) => Object.is(Math.fround(value), Math.fround(sentinelValues[index]))) &&
				Object.is(Math.fround(row[3]), Math.fround(1)),
			`${label} float sentinel draw did not reproduce its authored RGBA value.`,
		);
	}
	requireRgba8Rows(
		outputContract.deterministicNoDitherDefaultFramebufferRgba,
		sentinelValues.length,
		`${label} deterministic framebuffer sentinel`,
	);
	requireRgba8Rows(
		outputContract.deterministicNoDitherPngDecodedRgba,
		sentinelValues.length,
		`${label} deterministic PNG sentinel`,
	);
	requireRgba8Rows(
		outputContract.defaultFramebufferRgba,
		sentinelValues.length,
		`${label} normal framebuffer sentinel`,
	);
	requireRgba8Rows(outputContract.pngDecodedRgba, sentinelValues.length, `${label} normal PNG sentinel`);
	requireCondition(
		outputContract.drawControl?.fullscreenTriangle === true &&
			outputContract.drawControl.frustumCulled === false &&
			outputContract.drawControl.programDiagnostics?.programAvailable === true &&
			outputContract.drawControl.programDiagnostics?.runnable === true &&
			outputContract.drawControl.webglError === 0 &&
			outputContract.drawControl.allFloatAlphaOne === true &&
			outputContract.drawControl.nonzeroFloatRgbCount === sentinelValues.filter((value) => value !== 0).length,
		`${label} output probe draw/program control failed.`,
	);
	requireCondition(
		outputContract.dither?.deterministicEnabledBeforeDraw === false &&
			outputContract.dither.deterministicEnabledAfterDraw === false &&
			outputContract.dither.normalEnabledBeforeDraw === outputContract.dither.initiallyEnabled &&
			outputContract.dither.normalEnabledAfterDraw === outputContract.dither.initiallyEnabled &&
			outputContract.dither.restoredEnabled === outputContract.dither.initiallyEnabled,
		`${label} output probe did not disable and restore DITHER exactly.`,
	);
	const webgl = result.renderer?.webgl;
	const contextAttributes = webgl?.contextAttributes;
	requireCondition(
		contextAttributes?.preserveDrawingBuffer === true &&
			contextAttributes.antialias === false &&
			contextAttributes.alpha === true,
		`${label} browser ignored the required WebGL context attributes.`,
	);
	requireCondition(
		webgl.defaultFramebufferBits?.red === 8 &&
			webgl.defaultFramebufferBits.green === 8 &&
			webgl.defaultFramebufferBits.blue === 8 &&
			webgl.defaultFramebufferBits.alpha === 8,
		`${label} default framebuffer is not the required RGBA8 boundary.`,
	);
	requireCondition(
		webgl.ditherEnabled === outputContract.dither.initiallyEnabled,
		`${label} production rendering did not retain the measured normal DITHER state.`,
	);
	const displayConstants = result.displayConstants;
	requireCondition(
		displayConstants?.conversionKind === 'cie-xyz-to-linear-srgb-paper-figure1-tone-map' &&
			displayConstants.outputColorSpace === 'linear-srgb' &&
			displayConstants.demoGammaPowerOmitted === true &&
			displayConstants.demoWhitePointOmitted === true &&
			Array.isArray(displayConstants.xyzToLinearSrgbMatrix) &&
			displayConstants.xyzToLinearSrgbMatrix.length === 3 &&
			displayConstants.xyzToLinearSrgbMatrix.every(
				(row) => Array.isArray(row) && row.length === 3 && row.every(Number.isFinite),
			) &&
			displayConstants.maxLuminousEfficacy?.value === fixture.fixedSceneScale.luminousEfficacyLumensPerWatt &&
			displayConstants.maxLuminousEfficacy.units === 'lumens-per-watt' &&
			displayConstants.brunetonComparisonToneMapExposureScale ===
				fixture.fixedSceneScale.referenceLuminanceMultiplier &&
			displayConstants.paperFigure1ToneMapK === fixture.fixedSceneScale.value,
		`${label} production Figure-1 display constants differ from the frozen fixture.`,
	);
}

/** Return the deterministic no-DITHER output boundary without permitted normal-frame variability. */
function deterministicOutputContractIdentity(outputContract) {
	return {
		sentinelValues: outputContract.sentinelValues,
		probeInputStage: outputContract.probeInputStage,
		rgba32f: outputContract.rgba32f,
		deterministicNoDitherDefaultFramebufferRgba: outputContract.deterministicNoDitherDefaultFramebufferRgba,
		deterministicNoDitherPngDecodedRgba: outputContract.deterministicNoDitherPngDecodedRgba,
		deterministicNoDitherDefaultFramebufferQ8: outputContract.deterministicNoDitherDefaultFramebufferQ8,
		deterministicNoDitherPngQ8: outputContract.deterministicNoDitherPngQ8,
		requiredOfficialCtlEncoding: outputContract.requiredOfficialCtlEncoding,
		dither: outputContract.dither,
		drawControl: {
			fullscreenTriangle: outputContract.drawControl.fullscreenTriangle,
			frustumCulled: outputContract.drawControl.frustumCulled,
			programAvailable: outputContract.drawControl.programDiagnostics.programAvailable,
			diagnosticsAvailable: outputContract.drawControl.programDiagnostics.diagnosticsAvailable,
			runnable: outputContract.drawControl.programDiagnostics.runnable,
			webglError: outputContract.drawControl.webglError,
			allFloatAlphaOne: outputContract.drawControl.allFloatAlphaOne,
			nonzeroFloatRgbCount: outputContract.drawControl.nonzeroFloatRgbCount,
		},
	};
}

/** Return whether two numerical values satisfy one absolute-or-relative tolerance. */
function withinTolerance(left, right, tolerance) {
	const residual = Math.abs(left - right);
	return residual <= tolerance.absolute || residual <= tolerance.relative * Math.max(Math.abs(left), Math.abs(right));
}

/** Return the exact expected sample-id to angular-offset map for one condition. */
function expectedSampleOffsets(fixture, configured, condition) {
	const offsets = new Map([
		['disk-center', 0],
		['inside-limb-zenithward', condition.source.apparentRadiusRadians * fixture.sampling.insideLimbRadiusFactor],
	]);
	for (const offsetDegrees of fixture.sampling.circumsolarOffsetsDegrees) {
		for (const orientation of configured.radialOrientations) {
			offsets.set(
				`circumsolar-${String(offsetDegrees).replace('.', 'p')}-degrees-${orientation}`,
				(offsetDegrees * Math.PI) / 180,
			);
		}
	}
	return offsets;
}

/** Return one complete scientific-gate observation packet for a structurally complete condition. */
function evaluateConditionScience(result, condition, configured, fixture) {
	const failures = {
		outputContract: [],
		composition: [],
		stageChain: [],
		sampling: [],
		cacheLookup: [],
		rawOrdering: [],
		crossViewport: [],
		preview: [],
	};
	const outputContract = result.outputContract;
	const sentinelValues = fixture.outputContract.sentinelLinearValues;
	const classification = outputContract.deterministicNoDitherDefaultFramebufferQ8?.classification;
	const expectedOfficialCtlEncoding =
		classification === 'identity-q8'
			? 'srgb-piecewise'
			: classification === 'srgb-oetf-q8'
				? 'none-renderer-supplies-srgb-oetf'
				: 'unresolved-reject';
	const normalFramebufferMaximumCodeResidual = outputContract.dither?.initiallyEnabled
		? fixture.diagnosticTolerances.normalFramebufferMaximumCodeResidual
		: 0;
	if (
		condition.family === 'distant' &&
		condition.source.apparentRadiusRadians !== fixture.distant.sunAngularRadiusRadians
	) {
		failures.sampling.push(`${condition.id}:distant-authored-angular-radius`);
	}
	if (
		outputContract.requiredOfficialCtlEncoding === 'unresolved-reject' ||
		outputContract.deterministicNoDitherDefaultFramebufferQ8?.classification !==
			outputContract.deterministicNoDitherPngQ8?.classification ||
		!['identity-q8', 'srgb-oetf-q8'].includes(classification) ||
		outputContract.requiredOfficialCtlEncoding !== expectedOfficialCtlEncoding
	) {
		failures.outputContract.push('unsupported-or-unresolved-deterministic-classification');
	}
	if (['identity-q8', 'srgb-oetf-q8'].includes(classification)) {
		for (let sentinelIndex = 0; sentinelIndex < sentinelValues.length; sentinelIndex += 1) {
			const sentinel = sentinelValues[sentinelIndex];
			const expectedCode = predictedQ8([sentinel], classification)[0];
			for (const [stage, rgba] of [
				[
					'deterministic-default-framebuffer',
					outputContract.deterministicNoDitherDefaultFramebufferRgba[sentinelIndex],
				],
				['deterministic-png', outputContract.deterministicNoDitherPngDecodedRgba[sentinelIndex]],
			]) {
				if (rgba.slice(0, 3).some((value) => value !== expectedCode) || rgba[3] !== 255) {
					failures.outputContract.push(`sentinel-${sentinelIndex}:${stage}`);
				}
			}
			const normalFramebuffer = outputContract.defaultFramebufferRgba[sentinelIndex];
			const normalPng = outputContract.pngDecodedRgba[sentinelIndex];
			if (
				!rgbaCodesEqual(normalFramebuffer, normalPng) ||
				normalFramebuffer[3] !== 255 ||
				maximumRgbCodeResidual(normalFramebuffer, [expectedCode, expectedCode, expectedCode]) >
					normalFramebufferMaximumCodeResidual
			) {
				failures.outputContract.push(`sentinel-${sentinelIndex}:normal-framebuffer-envelope`);
			}
		}
	}
	const winningResidualName =
		classification === 'identity-q8' ? 'identityMaximumCodeResidual' : 'srgbMaximumCodeResidual';
	if (
		!['identity-q8', 'srgb-oetf-q8'].includes(classification) ||
		outputContract.deterministicNoDitherDefaultFramebufferQ8?.[winningResidualName] !== 0 ||
		outputContract.deterministicNoDitherPngQ8?.[winningResidualName] !== 0
	) {
		failures.outputContract.push('sentinel-winning-transfer-residual-is-not-exact-zero');
	}
	const expectedOffsets = expectedSampleOffsets(fixture, configured, condition);
	const samplesByViewport = new Map();
	for (const viewport of condition.viewports) {
		const sampleById = new Map();
		for (const sample of viewport.samples) {
			requireCondition(
				Number.isFinite(sample.coverage),
				`${condition.id}:${viewport.id}:${sample.id} sample coverage is invalid.`,
			);
			const rowId = `${condition.id}:${viewport.id}:${sample.id}`;
			if (sampleById.has(sample.id) || !expectedOffsets.has(sample.id)) {
				failures.sampling.push(`${rowId}:duplicate-or-unexpected-id`);
			}
			sampleById.set(sample.id, sample);
			const expectedOffset = expectedOffsets.get(sample.id);
			if (!Number.isFinite(expectedOffset) || Math.abs(sample.angularOffsetRadians - expectedOffset) > 1e-12) {
				failures.sampling.push(`${rowId}:angular-offset`);
			}
			if (sample.pixel?.x !== (viewport.width - 1) / 2 || sample.pixel?.y !== (viewport.height - 1) / 2) {
				failures.sampling.push(`${rowId}:noncentral-pixel`);
			}
			if (
				!Number.isFinite(sample.requestedRayAngularResidualRadians) ||
				sample.requestedRayAngularResidualRadians >
					fixture.diagnosticTolerances.rayAngularResidualRadiansMaximum
			) {
				failures.sampling.push(`${rowId}:ray-residual`);
			}
			const subsamples = sample.rasterSubsamples;
			if (
				!Array.isArray(subsamples) ||
				subsamples.length !== 4 ||
				subsamples.some((value) => typeof value !== 'boolean')
			) {
				failures.sampling.push(`${rowId}:raster-subsamples`);
			} else {
				const expectedCoverage = subsamples.filter(Boolean).length / 4;
				if (Math.abs(sample.coverage - expectedCoverage) > fixture.diagnosticTolerances.coverageAbsolute) {
					failures.sampling.push(`${rowId}:coverage`);
				}
				if (sample.id.startsWith('circumsolar-') && expectedCoverage !== 0) {
					failures.sampling.push(`${rowId}:circumsolar-coverage`);
				}
				if ((sample.id === 'disk-center' || sample.id.startsWith('inside-limb')) && expectedCoverage <= 0) {
					failures.sampling.push(`${rowId}:disk-sample-coverage`);
				}
			}
			const stateValues = [
				sample.state?.sceneHit,
				sample.state?.pathValid,
				sample.state?.hasSceneEndpoint,
				sample.state?.hasGroundEndpoint,
			];
			if (
				stateValues.some((value) => typeof value !== 'boolean') ||
				sample.state?.pathValid !== true ||
				sample.state?.sceneHit !== false ||
				sample.state?.hasSceneEndpoint === true ||
				(sample.state?.pathValid === true &&
					sample.state?.hasSceneEndpoint === true &&
					sample.state?.hasGroundEndpoint === true)
			) {
				failures.sampling.push(`${rowId}:visibility-or-endpoint-state`);
			}
			for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
				const expectedComposition = Math.fround(
					Math.fround(sample.gpu.pathSpectrum[channelIndex]) +
						Math.fround(sample.gpu.celestialSpectrum[channelIndex]),
				);
				if (!Object.is(expectedComposition, Math.fround(sample.gpu.preDisplaySpectrum[channelIndex]))) {
					failures.composition.push(`${rowId}:channel-${channelIndex}`);
				}
			}
			if (
				![...sample.gpu.cieXyz, sample.gpu.directY, sample.gpu.directPathY, sample.gpu.directCelestialY].every(
					Number.isFinite,
				)
			) {
				failures.composition.push(`${rowId}:nonfinite-xyz-or-y`);
			}
			const mapper32 = sample.gpu.mapperRgba32f.slice(0, 3);
			const mapper16 = sample.gpu.mapperRgba16f.slice(0, 3);
			if (
				!Object.is(Math.fround(sample.gpu.mapperRgba32f[3]), Math.fround(1)) ||
				!Object.is(Math.fround(sample.gpu.mapperRgba16f[3]), Math.fround(1))
			) {
				failures.stageChain.push(`${rowId}:mapper-alpha`);
			}
			if (
				sample.gpu.mapperRgb.some(
					(value, channelIndex) => !Object.is(Math.fround(value), Math.fround(mapper32[channelIndex])),
				)
			) {
				failures.stageChain.push(`${rowId}:mapper-rgba32f-alias`);
			}
			for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
				if (
					!withinTolerance(
						mapper32[channelIndex],
						mapper16[channelIndex],
						fixture.diagnosticTolerances.rgba16fVersusRgba32f,
					)
				) {
					failures.stageChain.push(`${rowId}:rgba16f-channel-${channelIndex}`);
				}
			}
			const predictedCodes = predictedQ8(mapper32, classification);
			if (
				!rgbaCodesEqual(sample.defaultFramebufferRgba, sample.pngCenterRgba) ||
				JSON.stringify(sample.gpu.framebufferCodes) !==
					JSON.stringify(sample.defaultFramebufferRgba.slice(0, 3)) ||
				JSON.stringify(sample.gpu.pngCodes) !== JSON.stringify(sample.pngCenterRgba.slice(0, 3)) ||
				sample.defaultFramebufferRgba?.[3] !== 255 ||
				maximumRgbCodeResidual(sample.defaultFramebufferRgba, predictedCodes) >
					normalFramebufferMaximumCodeResidual
			) {
				failures.stageChain.push(`${rowId}:normal-framebuffer-q8-envelope`);
			}
			if (condition.family === 'distant' && sample.gpu.cacheLookup.stencil?.valid !== true) {
				failures.cacheLookup.push(`${rowId}:invalid-distant-stencil`);
			}
		}
		for (const expectedSampleId of expectedOffsets.keys()) {
			if (!sampleById.has(expectedSampleId)) {
				failures.sampling.push(`${condition.id}:${viewport.id}:${expectedSampleId}:missing`);
			}
		}
		samplesByViewport.set(viewport.id, sampleById);
		for (const comparison of viewport.rawOrdering.comparisons) {
			const diskSample = sampleById.get(comparison.diskSampleId);
			const skySample = sampleById.get(comparison.skySampleId);
			const expectedComparisonId = `${condition.id}:${viewport.id}:${comparison.diskSampleId}>${comparison.skySampleId}`;
			if (
				!diskSample ||
				!skySample ||
				!(comparison.diskSampleId === 'disk-center' || comparison.diskSampleId.startsWith('inside-limb')) ||
				!comparison.skySampleId.startsWith('circumsolar-') ||
				comparison.id !== expectedComparisonId ||
				comparison.conditionId !== condition.id ||
				comparison.family !== condition.family ||
				comparison.viewportId !== viewport.id ||
				comparison.metric !== 'gpu-direct-photopic-Y'
			) {
				failures.rawOrdering.push(`${comparison.id}:invalid-pair-membership`);
				continue;
			}
			const diskCoverage = diskSample.coverage;
			const diskDirectCelestialY = diskSample.gpu.directCelestialY;
			const gpuDiskY = diskSample.gpu.directY;
			const gpuSkyY = skySample.gpu.directY;
			const expectedDiskEvidenceValid = diskCoverage > 0 && diskDirectCelestialY > 0;
			const expectedMargin = gpuDiskY - gpuSkyY;
			const expectedStrictOrdering = expectedDiskEvidenceValid && gpuDiskY > gpuSkyY;
			if (
				!Object.is(comparison.diskCoverage, diskCoverage) ||
				!Object.is(comparison.diskDirectCelestialY, diskDirectCelestialY) ||
				!Object.is(comparison.gpuDiskY, gpuDiskY) ||
				!Object.is(comparison.gpuSkyY, gpuSkyY) ||
				comparison.diskEvidenceValid !== expectedDiskEvidenceValid ||
				comparison.diskEvidenceValid !== true ||
				!(comparison.diskCoverage > 0) ||
				!(comparison.diskDirectCelestialY > 0) ||
				comparison.gpuStrictlyOrdered !== expectedStrictOrdering ||
				comparison.gpuStrictlyOrdered !== true ||
				!Object.is(comparison.margin, expectedMargin) ||
				!(comparison.margin > 0) ||
				!(gpuDiskY > gpuSkyY)
			) {
				failures.rawOrdering.push(
					`${comparison.id}:${comparison.diskEvidenceValid ? 'order' : 'missing-disk-evidence'}`,
				);
			}
		}
	}
	const [firstViewport, secondViewport] = fixture.viewports.map((viewport) => viewport.id);
	for (const sampleId of expectedOffsets.keys()) {
		const left = samplesByViewport.get(firstViewport)?.get(sampleId);
		const right = samplesByViewport.get(secondViewport)?.get(sampleId);
		if (!left || !right) continue;
		const gated = sampleId === 'disk-center' || sampleId.startsWith('circumsolar-');
		if (gated) {
			for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
				if (
					!withinTolerance(
						left.gpu.preDisplaySpectrum[channelIndex],
						right.gpu.preDisplaySpectrum[channelIndex],
						fixture.diagnosticTolerances.crossViewportSpectrum,
					)
				) {
					failures.crossViewport.push(`${condition.id}:${sampleId}:channel-${channelIndex}`);
				}
			}
		}
	}
	if (condition.preview !== null && condition.preview.finite !== true) {
		failures.preview.push(`${condition.id}:nonfinite-full-frame-preview`);
	}
	return {
		outputEncodingClassification: classification,
		failureCounts: Object.fromEntries(Object.entries(failures).map(([key, values]) => [key, values.length])),
		failures,
		passes: Object.values(failures).every((values) => values.length === 0),
	};
}

/** Validate one complete GPU-only browser condition result. */
function validateConditionResult(execution, fixture) {
	requireCondition(execution.failure === null, `${execution.shard.id} failed: ${execution.failure?.message}.`);
	requireCondition(execution.receipt !== null, `${execution.shard.id} returned no result receipt.`);
	const result = execution.value;
	if (result?.error) throw new Error(`${execution.shard.id} browser error: ${result.error.message}`);
	requireShardIdentity(result?.executionShard, execution.shard, 'Browser result');
	requireCondition(
		result.schemaVersion === 'production-sun-appearance-gpu-visual-browser-shard-v1',
		`${execution.shard.id} browser schema differs.`,
	);
	requireCondition(
		result.executionBackend === 'gpu' &&
			result.cpuReferenceUsed === false &&
			result.sourcePathConvergenceEvaluated === false,
		`${execution.shard.id} did not preserve the GPU-only provisional boundary.`,
	);
	const outputContract = result.outputContract;
	requireCondition(
		outputContract &&
			outputContract.deterministicNoDitherDefaultFramebufferQ8 &&
			outputContract.deterministicNoDitherPngQ8 &&
			outputContract.defaultFramebufferQ8 &&
			outputContract.pngQ8,
		`${execution.shard.id} output-contract evidence is structurally incomplete.`,
	);
	requireCondition(
		result.renderer?.webgl?.softwareRendererDetected === false &&
			typeof result.renderer.webgl.unmaskedRenderer === 'string' &&
			result.renderer.webgl.unmaskedRenderer.trim() !== '' &&
			typeof result.renderer.webgl.unmaskedVendor === 'string' &&
			result.renderer.webgl.unmaskedVendor.trim() !== '',
		`${execution.shard.id} did not execute on an identified hardware WebGL renderer.`,
	);
	validateOutputProbeOperational(result, execution, fixture);
	const condition = result.condition;
	const configured = fixtureCondition(fixture, execution.shard);
	requireCondition(
		condition.id === execution.shard.conditionId && condition.family === execution.shard.family,
		`${execution.shard.id} returned another condition.`,
	);
	const expected = expectedConditionCounts(fixture, configured);
	requireCondition(
		condition.profile?.id === fixture.productionProfileId &&
			typeof condition.profile.spectralBasisHash === 'string',
		`${execution.shard.id} production profile evidence is malformed.`,
	);
	requireCondition(
		condition.viewports?.length === EXPECTED_VIEWPORT_COUNT,
		`${execution.shard.id} omitted a viewport.`,
	);
	let sampleCount = 0;
	let pairCount = 0;
	const viewportIds = new Set();
	for (const viewport of condition.viewports) {
		const configuredViewport = fixture.viewports.find((entry) => entry.id === viewport.id);
		requireCondition(configuredViewport, `${execution.shard.id} returned unknown viewport ${viewport.id}.`);
		requireCondition(!viewportIds.has(viewport.id), `${execution.shard.id} returned a duplicate viewport.`);
		viewportIds.add(viewport.id);
		requireCondition(
			viewport.width === configuredViewport.widthPixels && viewport.height === configuredViewport.heightPixels,
			`${execution.shard.id} viewport dimensions differ.`,
		);
		requireCondition(
			viewport.samples?.length === expected.samplesPerViewport,
			`${execution.shard.id} sample ledger is incomplete.`,
		);
		sampleCount += viewport.samples.length;
		requireCondition(
			viewport.rawOrdering?.comparisons?.length > 0,
			`${execution.shard.id} raw ordering is absent.`,
		);
		pairCount += viewport.rawOrdering.comparisons.length;
		for (const sample of viewport.samples) {
			requireFiniteArray(sample.gpu?.completedCelestialCacheSpectrum, 15, `${execution.shard.id} cache spectrum`);
			requireFiniteArray(sample.gpu?.pathSpectrum, 15, `${execution.shard.id} path spectrum`);
			requireFiniteArray(sample.gpu?.celestialSpectrum, 15, `${execution.shard.id} celestial spectrum`);
			requireFiniteArray(sample.gpu?.preDisplaySpectrum, 15, `${execution.shard.id} pre-display spectrum`);
			requireFiniteArray(sample.gpu?.signedLinearRgb, 3, `${execution.shard.id} signed RGB`);
			requireFiniteArray(sample.gpu?.mapperRgb, 3, `${execution.shard.id} mapper RGB`);
			requireFiniteArray(sample.gpu?.mapperRgba32f, 4, `${execution.shard.id} RGBA32F mapper stage`);
			requireFiniteArray(sample.gpu?.mapperRgba16f, 4, `${execution.shard.id} RGBA16F mapper stage`);
			requireFiniteArray(sample.gpu?.cieXyz, 3, `${execution.shard.id} CIE XYZ`);
			requireCondition(
				[sample.gpu?.directY, sample.gpu?.directPathY, sample.gpu?.directCelestialY].every(Number.isFinite),
				`${execution.shard.id} direct Y evidence is invalid.`,
			);
			requireFiniteArray(sample.gpu?.framebufferCodes, 3, `${execution.shard.id} framebuffer codes`);
			requireFiniteArray(sample.gpu?.pngCodes, 3, `${execution.shard.id} PNG codes`);
			const lookup = sample.gpu.cacheLookup;
			if (execution.shard.family === 'distant') {
				requireCondition(
					lookup?.bindingIdentity === 'cache.celestial.sunTransport' &&
						typeof lookup.stencil?.valid === 'boolean',
					`${execution.shard.id} distant cache/stencil identity is invalid.`,
				);
				requireFiniteArray(lookup.stencil.receiverIndices, 2, 'Distant receiver indices');
				requireFiniteArray(lookup.stencil.directionIndices, 2, 'Distant direction indices');
				requireFiniteArray(lookup.stencil.receiverWeights, 2, 'Distant receiver weights');
				requireFiniteArray(lookup.stencil.directionWeights, 2, 'Distant direction weights');
			} else {
				requireCondition(
					lookup?.bindingIdentity === 'cache.celestial.localSunRadiance' && lookup.stencil === null,
					`${execution.shard.id} Flat cache identity or no-stencil declaration is invalid.`,
				);
			}
		}
		for (const comparison of viewport.rawOrdering.comparisons) {
			requireCondition(
				typeof comparison.id === 'string' &&
					comparison.conditionId === condition.id &&
					comparison.family === condition.family &&
					comparison.viewportId === viewport.id &&
					typeof comparison.diskSampleId === 'string' &&
					typeof comparison.skySampleId === 'string' &&
					comparison.metric === 'gpu-direct-photopic-Y' &&
					typeof comparison.gpuStrictlyOrdered === 'boolean' &&
					typeof comparison.diskEvidenceValid === 'boolean' &&
					Number.isFinite(comparison.margin) &&
					Number.isFinite(comparison.gpuDiskY) &&
					Number.isFinite(comparison.gpuSkyY) &&
					Number.isFinite(comparison.diskCoverage) &&
					Number.isFinite(comparison.diskDirectCelestialY),
				`${execution.shard.id} raw-ordering comparison is malformed.`,
			);
		}
	}
	requireCondition(sampleCount === expected.sampleCount, `${execution.shard.id} sample count differs.`);
	requireCondition(pairCount === expected.pairCount, `${execution.shard.id} pair count differs.`);
	requireCondition(
		(condition.preview !== null) === (configured.requiredPreview === true),
		`${execution.shard.id} preview selection differs from fixture.`,
	);
	if (condition.preview !== null) {
		requireCondition(
			condition.preview.width === fixture.viewports[0].widthPixels &&
				condition.preview.height === fixture.viewports[0].heightPixels,
			`${execution.shard.id} preview viewport differs.`,
		);
	}
	requireCondition(
		condition.cacheLookupContract?.bindingRequirement?.valueKey ===
			(execution.shard.family === 'distant'
				? 'cache.celestial.sunTransport'
				: 'cache.celestial.localSunRadiance'),
		`${execution.shard.id} production binding requirement differs.`,
	);
	const science = evaluateConditionScience(result, condition, configured, fixture);
	return {result, condition, configured, sampleCount, pairCount, science};
}

/** Compare Flat source identity, placement, and distance class against authored facts. */
function validateFlatCondition(condition, configured, fixture) {
	if (condition.family !== 'flat') return null;
	const expectedCenter = configured.expectedCenterMeters;
	const actualCenter = condition.source.centerMeters;
	requireFiniteArray(actualCenter, 3, `${condition.id} actual center`);
	const centerMaximumAbsoluteResidualMeters = Math.max(
		...actualCenter.map((value, index) => Math.abs(value - expectedCenter[index])),
	);
	const cacheRadialMaximumAbsoluteResidualMeters = Math.abs(
		condition.source.cacheRadialMaximumMeters - configured.expectedCacheRadialMaximumMeters,
	);
	const derivedCacheRadialMaximumMeters = Math.hypot(actualCenter[0], actualCenter[1]);
	const derivedCacheRadialIdentityResidualMeters = Math.abs(
		condition.source.cacheRadialMaximumMeters - derivedCacheRadialMaximumMeters,
	);
	const surfaceRadianceMatches =
		JSON.stringify(condition.source.surfaceRadiance) === JSON.stringify(fixture.flat.source.surfaceRadianceValues);
	const radiusMatches = condition.source.radiusMeters === fixture.flat.source.radiusMeters;
	const passes =
		centerMaximumAbsoluteResidualMeters <= fixture.diagnosticTolerances.flatObservationPlacementMeters &&
		cacheRadialMaximumAbsoluteResidualMeters <= fixture.diagnosticTolerances.flatObservationPlacementMeters &&
		derivedCacheRadialIdentityResidualMeters <= fixture.diagnosticTolerances.flatDerivedRadialIdentityMeters &&
		radiusMatches &&
		surfaceRadianceMatches &&
		condition.profile.spectralBasisHash === fixture.flat.source.spectralBasisHash;
	return {
		conditionId: condition.id,
		distanceClass: configured.distanceClass,
		distanceMeters: condition.source.distanceMeters,
		centerMaximumAbsoluteResidualMeters,
		cacheRadialMaximumAbsoluteResidualMeters,
		derivedCacheRadialMaximumMeters,
		derivedCacheRadialIdentityResidualMeters,
		radiusMatches,
		actualRadiusMeters: condition.source.radiusMeters,
		expectedRadiusMeters: fixture.flat.source.radiusMeters,
		surfaceRadianceMatches,
		spectralBasisMatches: condition.profile.spectralBasisHash === fixture.flat.source.spectralBasisHash,
		passes,
	};
}

/** Convert one returned data URL or float frame into one immutable artifact pointer. */
async function extractConditionArtifacts(run, condition, runtimeEvidence) {
	const records = [];
	const safeId = condition.id.replace(/[^a-z0-9-]/gu, '-');
	const shaderBytes = Buffer.from(condition.shaderSource, 'utf8');
	const shaderPath = `shaders/${safeId}.glsl`;
	await run.writeArtifact(shaderPath, shaderBytes);
	records.push({
		relativePath: shaderPath,
		sha256: sha256(shaderBytes),
		bytes: shaderBytes.byteLength,
		mediaType: 'text/x-glsl',
		role: 'assembled-production-gpu-fragment-shader',
		conditionId: condition.id,
	});
	let preview = null;
	if (condition.preview !== null) {
		const frameBytes = Buffer.from(condition.preview.dataBase64, 'base64');
		requireCondition(
			frameBytes.byteLength ===
				condition.preview.width * condition.preview.height * condition.preview.channels * 4,
			`${condition.id} float preview byte count differs.`,
		);
		const framePath = `captures/${safeId}-signed-linear.rgba32f`;
		await run.writeArtifact(framePath, frameBytes);
		const framePointer = {
			relativePath: framePath,
			sha256: sha256(frameBytes),
			bytes: frameBytes.byteLength,
			mediaType: 'application/x-float32-rgba',
			role: 'full-frame-signed-linear-rgba32f',
			conditionId: condition.id,
		};
		records.push(framePointer);
		const pngDataUrl = condition.preview.productionMapperPngDataUrl;
		requireCondition(
			typeof pngDataUrl === 'string' && pngDataUrl.startsWith('data:image/png;base64,'),
			'Preview PNG is absent.',
		);
		const pngBytes = Buffer.from(pngDataUrl.slice(pngDataUrl.indexOf(',') + 1), 'base64');
		requireCondition(
			pngBytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE),
			'Preview PNG signature is invalid.',
		);
		const pngPath = `captures/${safeId}-production-mapper.png`;
		await run.writeArtifact(pngPath, pngBytes);
		const pngPointer = {
			relativePath: pngPath,
			sha256: sha256(pngBytes),
			bytes: pngBytes.byteLength,
			mediaType: 'image/png',
			role: 'full-frame-production-mapper-png',
			conditionId: condition.id,
		};
		records.push(pngPointer);
		preview = {
			...Object.fromEntries(
				Object.entries(condition.preview).filter(
					([key]) => key !== 'dataBase64' && key !== 'productionMapperPngDataUrl',
				),
			),
			frameArtifact: framePointer,
			pngArtifact: pngPointer,
		};
	}
	return {
		records,
		condition: {
			...Object.fromEntries(
				Object.entries(condition).filter(([key]) => key !== 'shaderSource' && key !== 'preview'),
			),
			shaderArtifact: records[0],
			preview,
			runtimeEvidence,
		},
	};
}

/** Verify the exact snapshot, production, controls, dependencies, protected roots, and Chrome bytes. */
async function verifyProtectedAfter(before) {
	const snapshot = await verifySnapshot();
	assertFileInventoriesEqual(before.snapshot.inventory, snapshot.inventory, 'Snapshot before/after GPU visual run');
	requireCondition(before.snapshot.manifestSha256 === snapshot.manifestSha256, 'Snapshot manifest mutated.');
	const production = await createSelectedFileInventory(
		REPOSITORY_ROOT,
		before.snapshot.manifest.sealedInventory.files.map((entry) => entry.path),
	);
	assertFileInventoriesEqual(before.production, production, 'Production before/after GPU visual run');
	const controls = await createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS);
	assertFileInventoriesEqual(before.controls, controls, 'Controls before/after GPU visual run');
	const three = await createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS);
	assertFileInventoriesEqual(before.three, three, 'Three before/after GPU visual run');
	const nodeExecutableClosure = await createNodeExecutableClosure();
	requireCondition(
		before.nodeExecutableClosure.descriptorSha256 === nodeExecutableClosure.descriptorSha256,
		'Node executable static-closure descriptor changed during the GPU visual run.',
	);
	assertFileInventoriesEqual(
		before.nodeExecutableClosure.inventory,
		nodeExecutableClosure.inventory,
		'Node executable closure before/after GPU visual run',
	);
	const protectedRoots = await createProtectedRootInventories();
	assertProtectedRootInventoriesEqual(before.protectedRoots, protectedRoots);
	const chromeExecutable = {
		path: await realpath(before.chromeExecutable.path),
		sha256: await sha256File(before.chromeExecutable.path),
	};
	requireCondition(
		pathComparisonKey(before.chromeExecutable.path) === pathComparisonKey(chromeExecutable.path) &&
			before.chromeExecutable.sha256 === chromeExecutable.sha256,
		'Canonical Chrome executable path or bytes changed during the GPU visual run.',
	);
	return {snapshot, production, controls, three, nodeExecutableClosure, protectedRoots, chromeExecutable};
}

/** Persist one operational shard record without treating progress as science evidence. */
async function persistShardExecution(run, execution) {
	const root = `evidence/shards/${execution.shard.id}`;
	await run.writeArtifact(`browser/shards/${execution.shard.id}/chrome-stdout.txt`, execution.stdout);
	await run.writeArtifact(`browser/shards/${execution.shard.id}/chrome-stderr.txt`, execution.stderr);
	await run.writeJsonArtifact(`${root}/completion.json`, {
		schemaId: 'production-sun-appearance-gpu-visual-shard-completion-v1',
		executionShard: execution.shard,
		strategy: 'serial-one-exact-chrome-process-per-condition-with-inactivity-only-watchdog-v1',
		startedAt: execution.startedAt,
		completedAt: execution.completedAt,
		wallDurationMilliseconds: execution.wallDurationMilliseconds,
		pid: execution.pid,
		launchedAt: execution.launchedAt,
		exit: execution.exit,
		failure: execution.failure,
		resultReceipt: execution.receipt,
		inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
		fixedWallTimeout: null,
		indexHtmlSha256: execution.indexHtmlSha256,
	});
	await run.writeJsonArtifact(`${root}/progress.json`, {
		schemaId: 'production-sun-appearance-gpu-visual-progress-receipts-v1',
		claimBoundary: 'Operational liveness receipts only; no partial receipt is scientific evidence.',
		receipts: execution.progressReceipts,
	});
	await run.writeJsonArtifact(`${root}/served-browser-files.json`, {
		schemaId: 'production-sun-appearance-gpu-visual-served-files-v1',
		files: execution.servedFiles,
	});
}

/** Return the concise immutable report. */
function reportText(runId, conclusion, gates) {
	return `# ${runId}: production Sun appearance GPU visual evidence

Conclusion: **${conclusion}**

- Complete ledger: ${gates.completeLedger.passes ? 'accepted' : 'rejected'}; ${gates.completeLedger.observed.sampleCount} samples and ${gates.completeLedger.observed.pairCount} disk/circumsolar pairs.
- Production GPU path: ${gates.productionGpuPath.passes ? 'accepted' : 'rejected'}; no CPU cache, CPU evaluator, or refined convergence executed.
- Hardware renderer: ${gates.hardwareRenderer.passes ? 'accepted' : 'rejected'}; ${gates.hardwareRenderer.observed.uniqueIdentityHashCount} exact renderer identity.
- Raw GPU ordering: ${gates.rawGpuOrdering.passes ? 'accepted' : 'rejected'}; ${gates.rawGpuOrdering.observed.validDiskEvidencePairCount} valid disk-side pairs and ${gates.rawGpuOrdering.observed.failedPairCount} failed of ${gates.rawGpuOrdering.observed.pairCount}.
- Output contract: ${gates.outputContract.passes ? 'accepted' : 'rejected'}; deterministic transfer failures ${gates.outputContract.observed.failureCount}.
- Output stage chain: ${gates.outputStageChain.passes ? 'accepted' : 'rejected'}; ${gates.outputStageChain.observed.failureCount} failed rows.
- Sampling and cross-FOV: ${gates.samplingAndVisibility.passes ? 'accepted' : 'rejected'}; ${gates.samplingAndVisibility.observed.samplingFailureCount} sampling and ${gates.samplingAndVisibility.observed.crossViewportFailureCount} cross-viewport failures.
- Cache lookup: ${gates.cacheLookup.passes ? 'accepted' : 'rejected'}; ${gates.cacheLookup.observed.failureCount} failed rows.
- Flat source/geometry identity: ${gates.flatGeometryAndSource.passes ? 'accepted' : 'rejected'}; ${gates.flatGeometryAndSource.observed.entries.length} retained Flat conditions.
- Preview evidence: ${gates.requiredPreviews.passes ? 'accepted' : 'rejected'}; exactly ${gates.requiredPreviews.observed.previewCount} retained scenes.
- Claim boundary: provisional GPU-only visual verification. CPU/refined authority remains deferred to final verification.
`;
}

/** Allocate and execute one immutable GPU visual record. */
async function main() {
	if (process.argv.length !== 2) throw new Error('GPU visual evidence runner accepts no arguments.');
	const run = await initializeRunRecord({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {
			schemaId: PROOF_ID,
			fixture: 'experiments/extraterrestrial/fixtures/production-sun-appearance-gpu-visual-v1.json',
			snapshot: 'experiments/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
			browserApi: 'runProductionSunAppearanceGpuVisualScene(fixture, reportProgress, executionShard)',
		},
		provenance: {
			experiment: 'experiments/extraterrestrial',
			executionBackend: 'gpu',
			execution: 'eight serial isolated Chrome condition shards; no generated input reuse',
		},
		environment: {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			browser: 'installed Chrome headless WebGL2 / production GPU shader path',
			maximumConcurrentChromeProcesses: 1,
			inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
			fixedWallTimeout: null,
		},
		references: {
			canonicalDesign: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/sun-disk-appearance-implementation-plan.md',
		},
	});
	let protectedBefore = null;
	let protectedAfter = null;
	try {
		await assertRepositoryIdentity();
		const snapshotBefore = await verifySnapshot();
		const productionBefore = await createSelectedFileInventory(
			REPOSITORY_ROOT,
			snapshotBefore.manifest.sealedInventory.files.map((entry) => entry.path),
		);
		await Promise.all([
			assertExistingRealPathContained(EXPERIMENT_ROOT, HARNESS_PATH, 'GPU visual browser entry'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, SCENE_MODULE_PATH, 'GPU visual scene module'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'GPU visual fixture'),
		]);
		const [fixtureBytes, flatSourceFixtureBytes, chromePath] = await Promise.all([
			readFile(FIXTURE_PATH),
			readFile(FLAT_SOURCE_FIXTURE_PATH),
			findChrome(),
		]);
		const fixture = JSON.parse(fixtureBytes.toString('utf8'));
		const flatSourceFixture = JSON.parse(flatSourceFixtureBytes.toString('utf8'));
		validateFlatSourceFixture(fixture, flatSourceFixture, sha256(flatSourceFixtureBytes));
		const shards = createConditionShards(fixture);
		const controlsBefore = await createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS);
		const threeBefore = await createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS);
		const nodeExecutableClosureBefore = await createNodeExecutableClosure();
		const protectedRootsBefore = await createProtectedRootInventories();
		const chromeExecutableBefore = {path: chromePath, sha256: await sha256File(chromePath)};
		protectedBefore = {
			snapshot: snapshotBefore,
			production: productionBefore,
			controls: controlsBefore,
			three: threeBefore,
			nodeExecutableClosure: nodeExecutableClosureBefore,
			protectedRoots: protectedRootsBefore,
			chromeExecutable: chromeExecutableBefore,
		};
		await run.writeJsonArtifact('evidence/protected-before.json', {
			snapshotManifestSha256: snapshotBefore.manifestSha256,
			snapshotInventory: snapshotBefore.inventory,
			productionSource: productionBefore,
			executedControls: controlsBefore,
			threeRuntime: threeBefore,
			nodeExecutableClosure: nodeExecutableClosureBefore,
			protectedRoots: protectedRootsBefore,
			fixtureSha256: sha256(fixtureBytes),
			flatSourceFixtureSha256: sha256(flatSourceFixtureBytes),
			chromeExecutable: chromeExecutableBefore,
		});
		await run.writeJsonArtifact('evidence/execution-plan.json', {
			schemaId: 'production-sun-appearance-gpu-visual-execution-plan-v1',
			proofId: PROOF_ID,
			conditionCount: EXPECTED_CONDITION_COUNT,
			viewportCount: EXPECTED_VIEWPORT_COUNT,
			sampleCount: EXPECTED_SAMPLE_COUNT,
			pairCount: EXPECTED_PAIR_COUNT,
			previewCount: EXPECTED_PREVIEW_COUNT,
			maximumConcurrentChromeProcesses: 1,
			inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
			fixedWallTimeout: null,
			generatedInputReuse: false,
			shards,
		});
		const executions = [];
		const validatedByShardId = new Map();
		let operationalOutputContractHash = null;
		let operationalRendererIdentityHash = null;
		let operationalDisplayConstantsHash = null;
		for (const shard of shards) {
			const resultNonce = randomBytes(32).toString('hex');
			const indexHtml = browserIndex(resultNonce, shard);
			await run.writeArtifact(`browser/shards/${shard.id}/index.html`, indexHtml);
			const execution = await executeConditionShard({
				runDirectory: run.runDirectory,
				chromePath,
				shard,
				resultNonce,
				indexHtml,
			});
			executions.push(execution);
			await persistShardExecution(run, execution);
			if (execution.failure !== null) throw new Error(`${shard.id} failed: ${execution.failure.message}`);
			const validated = validateConditionResult(execution, fixture);
			const outputContractHash = sha256(
				Buffer.from(
					JSON.stringify(deterministicOutputContractIdentity(validated.result.outputContract)),
					'utf8',
				),
			);
			const rendererIdentityHash = sha256(
				Buffer.from(
					JSON.stringify({
						unmaskedVendor: validated.result.renderer.webgl.unmaskedVendor,
						unmaskedRenderer: validated.result.renderer.webgl.unmaskedRenderer,
						version: validated.result.renderer.webgl.version,
						shadingLanguageVersion: validated.result.renderer.webgl.shadingLanguageVersion,
						threeRevision: validated.result.renderer.three.revision,
					}),
					'utf8',
				),
			);
			const displayConstantsHash = sha256(Buffer.from(JSON.stringify(validated.result.displayConstants), 'utf8'));
			if (operationalOutputContractHash === null) operationalOutputContractHash = outputContractHash;
			if (operationalRendererIdentityHash === null) operationalRendererIdentityHash = rendererIdentityHash;
			if (operationalDisplayConstantsHash === null) operationalDisplayConstantsHash = displayConstantsHash;
			requireCondition(
				outputContractHash === operationalOutputContractHash,
				`${shard.id} deterministic no-DITHER output contract differs from an earlier condition shard.`,
			);
			requireCondition(
				rendererIdentityHash === operationalRendererIdentityHash,
				`${shard.id} hardware renderer identity differs from an earlier condition shard.`,
			);
			requireCondition(
				displayConstantsHash === operationalDisplayConstantsHash,
				`${shard.id} Figure-1 display constants differ from an earlier condition shard.`,
			);
			validatedByShardId.set(shard.id, validated);
		}
		protectedAfter = await verifyProtectedAfter(protectedBefore);
		await run.writeJsonArtifact('evidence/protected-after.json', {
			snapshotManifestSha256: protectedAfter.snapshot.manifestSha256,
			snapshotInventory: protectedAfter.snapshot.inventory,
			productionSource: protectedAfter.production,
			executedControls: protectedAfter.controls,
			threeRuntime: protectedAfter.three,
			nodeExecutableClosure: protectedAfter.nodeExecutableClosure,
			protectedRoots: protectedAfter.protectedRoots,
			chromeExecutable: protectedAfter.chromeExecutable,
		});
		const artifactPointers = [];
		const conditionPointers = [];
		const flatEntries = [];
		let sampleCount = 0;
		let pairCount = 0;
		let validDiskEvidencePairCount = 0;
		let previewCount = 0;
		const pairIds = new Set();
		const outputContractHashes = new Set();
		const displayConstantsHashes = new Set();
		const outputEncodingClassifications = new Set();
		const hardwareRendererIdentityHashes = new Set();
		const hardwareRendererObservations = [];
		const browserDependencyClosureHashes = new Set();
		const browserClosureObservations = [];
		const rowIds = new Set();
		const conditionScience = [];
		const scienceFailureCounts = {
			outputContract: 0,
			composition: 0,
			stageChain: 0,
			sampling: 0,
			cacheLookup: 0,
			rawOrdering: 0,
			crossViewport: 0,
			preview: 0,
		};
		for (const execution of executions) {
			const browserClosure = validateServedBrowserClosure(
				execution,
				protectedAfter.snapshot.inventory,
				protectedAfter.controls,
				protectedAfter.three,
			);
			browserDependencyClosureHashes.add(browserClosure.dependencyClosureSha256);
			browserClosureObservations.push({shardId: execution.shard.id, ...browserClosure});
			const validated = validatedByShardId.get(execution.shard.id);
			requireCondition(validated !== undefined, `${execution.shard.id} has no validated result.`);
			conditionScience.push({conditionId: validated.condition.id, ...validated.science});
			for (const [key, count] of Object.entries(validated.science.failureCounts)) {
				scienceFailureCounts[key] += count;
			}
			sampleCount += validated.sampleCount;
			pairCount += validated.pairCount;
			previewCount += validated.condition.preview === null ? 0 : 1;
			outputContractHashes.add(
				sha256(
					Buffer.from(
						JSON.stringify(deterministicOutputContractIdentity(validated.result.outputContract)),
						'utf8',
					),
				),
			);
			displayConstantsHashes.add(sha256(Buffer.from(JSON.stringify(validated.result.displayConstants), 'utf8')));
			outputEncodingClassifications.add(
				validated.result.outputContract.deterministicNoDitherDefaultFramebufferQ8.classification,
			);
			const rendererIdentity = {
				unmaskedVendor: validated.result.renderer.webgl.unmaskedVendor,
				unmaskedRenderer: validated.result.renderer.webgl.unmaskedRenderer,
				version: validated.result.renderer.webgl.version,
				shadingLanguageVersion: validated.result.renderer.webgl.shadingLanguageVersion,
				threeRevision: validated.result.renderer.three.revision,
			};
			hardwareRendererIdentityHashes.add(sha256(Buffer.from(JSON.stringify(rendererIdentity), 'utf8')));
			hardwareRendererObservations.push({
				conditionId: validated.condition.id,
				...rendererIdentity,
				softwareRendererDetected: validated.result.renderer.webgl.softwareRendererDetected,
			});
			for (const viewport of validated.condition.viewports) {
				for (const sample of viewport.samples) {
					const rowId = `${validated.condition.id}:${viewport.id}:${sample.id}`;
					requireCondition(!rowIds.has(rowId), `Duplicate sample row ${rowId}.`);
					rowIds.add(rowId);
				}
				for (const comparison of viewport.rawOrdering.comparisons) {
					requireCondition(!pairIds.has(comparison.id), `Duplicate raw ordering pair ${comparison.id}.`);
					pairIds.add(comparison.id);
					if (comparison.diskEvidenceValid === true) validDiskEvidencePairCount += 1;
				}
			}
			const flatEntry = validateFlatCondition(validated.condition, validated.configured, fixture);
			if (flatEntry !== null) flatEntries.push(flatEntry);
			const extracted = await extractConditionArtifacts(run, validated.condition, {
				renderer: validated.result.renderer,
				displayConstants: validated.result.displayConstants,
				outputContract: validated.result.outputContract,
				claimLimits: validated.result.claimLimits,
			});
			artifactPointers.push(...extracted.records);
			const conditionPath = `evidence/conditions/${validated.condition.id}.json`;
			const conditionBytes = Buffer.from(`${JSON.stringify(extracted.condition, null, 2)}\n`, 'utf8');
			await run.writeArtifact(conditionPath, conditionBytes);
			const pointer = {
				relativePath: conditionPath,
				sha256: sha256(conditionBytes),
				bytes: conditionBytes.byteLength,
				mediaType: 'application/json',
				role: 'complete-condition-gpu-evidence',
				conditionId: validated.condition.id,
			};
			artifactPointers.push(pointer);
			conditionPointers.push({
				conditionId: validated.condition.id,
				family: validated.condition.family,
				sampleCount: validated.sampleCount,
				pairCount: validated.pairCount,
				preview: validated.condition.preview !== null,
				sciencePasses: validated.science.passes,
				artifact: pointer,
			});
		}
		const flatByClass = new Map(flatEntries.map((entry) => [entry.distanceClass, entry]));
		const flatOrdered =
			flatEntries.length === 3 &&
			flatByClass.get('close')?.distanceMeters < flatByClass.get('medium')?.distanceMeters &&
			flatByClass.get('medium')?.distanceMeters < flatByClass.get('long')?.distanceMeters;
		const completeLedgerPasses =
			executions.length === EXPECTED_CONDITION_COUNT &&
			sampleCount === EXPECTED_SAMPLE_COUNT &&
			pairCount === EXPECTED_PAIR_COUNT &&
			rowIds.size === EXPECTED_SAMPLE_COUNT;
		const previewPasses = previewCount === EXPECTED_PREVIEW_COUNT;
		const browserClosurePasses =
			browserClosureObservations.length === EXPECTED_CONDITION_COUNT &&
			browserDependencyClosureHashes.size === 1 &&
			browserClosureObservations.every(
				(observation) =>
					observation.dependencyFileCount === EXPECTED_BROWSER_DEPENDENCY_FILE_COUNT &&
					observation.snapshotModuleCount === EXPECTED_BROWSER_SNAPSHOT_MODULE_COUNT &&
					observation.threeModuleCount === EXPECTED_BROWSER_THREE_MODULE_COUNT,
			);
		requireCondition(browserClosurePasses, 'Cross-shard browser executable closure is inconsistent.');
		const outputContractPasses =
			outputContractHashes.size === 1 &&
			displayConstantsHashes.size === 1 &&
			outputEncodingClassifications.size === 1 &&
			scienceFailureCounts.outputContract === 0;
		const gates = {
			schemaVersion: 1,
			proofId: PROOF_ID,
			completeLedger: {
				id: 'complete-8-condition-2-viewport-ledger',
				passes: completeLedgerPasses,
				observed: {
					conditionCount: executions.length,
					sampleCount,
					uniqueRowIdCount: rowIds.size,
					pairCount,
				},
				required: {
					conditionCount: EXPECTED_CONDITION_COUNT,
					viewportCount: EXPECTED_VIEWPORT_COUNT,
					sampleCount: EXPECTED_SAMPLE_COUNT,
					uniqueRowIdCount: EXPECTED_SAMPLE_COUNT,
					pairCount: EXPECTED_PAIR_COUNT,
				},
			},
			productionGpuPath: {
				id: 'sealed-production-gpu-cache-and-shader-only',
				passes: executions.every(
					(execution) =>
						execution.value?.executionBackend === 'gpu' &&
						execution.value?.cpuReferenceUsed === false &&
						execution.value?.sourcePathConvergenceEvaluated === false,
				),
				observed: {cpuReferenceUsed: false, sourcePathConvergenceEvaluated: false},
				required: {executionBackend: 'gpu'},
			},
			hardwareRenderer: {
				id: 'identified-hardware-webgl-renderer',
				passes:
					hardwareRendererObservations.length === EXPECTED_CONDITION_COUNT &&
					hardwareRendererIdentityHashes.size === 1 &&
					hardwareRendererObservations.every((observation) => observation.softwareRendererDetected === false),
				observed: {
					uniqueIdentityHashCount: hardwareRendererIdentityHashes.size,
					identityHashes: [...hardwareRendererIdentityHashes],
					conditions: hardwareRendererObservations,
				},
				required: {
					conditionCount: EXPECTED_CONDITION_COUNT,
					uniqueIdentityHashCount: 1,
					softwareRendererDetected: false,
				},
			},
			browserExecutedClosure: {
				id: 'exact-cross-shard-served-byte-and-snapshot-closure',
				passes: browserClosurePasses,
				observed: {
					uniqueDependencyClosureHashCount: browserDependencyClosureHashes.size,
					dependencyClosureHashes: [...browserDependencyClosureHashes],
					shards: browserClosureObservations,
				},
				required: {
					conditionCount: EXPECTED_CONDITION_COUNT,
					uniqueDependencyClosureHashCount: 1,
					dependencyFileCount: EXPECTED_BROWSER_DEPENDENCY_FILE_COUNT,
					snapshotModuleCount: EXPECTED_BROWSER_SNAPSHOT_MODULE_COUNT,
					threeModuleCount: EXPECTED_BROWSER_THREE_MODULE_COUNT,
				},
			},
			rawGpuOrdering: {
				id: 'strict-gpu-disk-y-above-circumsolar-y',
				passes:
					pairCount === EXPECTED_PAIR_COUNT &&
					pairIds.size === EXPECTED_PAIR_COUNT &&
					validDiskEvidencePairCount === EXPECTED_PAIR_COUNT &&
					scienceFailureCounts.rawOrdering === 0,
				observed: {
					pairCount,
					uniquePairIdCount: pairIds.size,
					validDiskEvidencePairCount,
					failedPairCount: scienceFailureCounts.rawOrdering,
					allStrictlyOrdered: scienceFailureCounts.rawOrdering === 0,
				},
				required: {
					pairCount: EXPECTED_PAIR_COUNT,
					uniquePairIdCount: EXPECTED_PAIR_COUNT,
					validDiskEvidencePairCount: EXPECTED_PAIR_COUNT,
					allStrictlyOrdered: true,
				},
			},
			outputContract: {
				id: 'deterministic-transfer-and-normal-framebuffer-output-contract',
				passes: outputContractPasses,
				observed: {
					uniqueContractHashCount: outputContractHashes.size,
					uniqueDisplayConstantsHashCount: displayConstantsHashes.size,
					displayConstantsHashes: [...displayConstantsHashes],
					classifications: [...outputEncodingClassifications],
					failureCount: scienceFailureCounts.outputContract,
				},
				required: {
					uniqueContractHashCount: 1,
					uniqueDisplayConstantsHashCount: 1,
					sentinelRgba32fMaximumUlp: fixture.diagnosticTolerances.sentinelRgba32fMaximumUlp,
					exactDeterministicWinningTransferCodeResidual: 0,
					normalFramebufferMaximumCodeResidual:
						fixture.diagnosticTolerances.normalFramebufferMaximumCodeResidual,
					exactNormalFramebufferPngRgbAndAlpha: true,
				},
			},
			float32Composition: {
				id: 'exact-f32-path-plus-celestial-equals-pre-display',
				passes: scienceFailureCounts.composition === 0,
				observed: {failureCount: scienceFailureCounts.composition},
				required: {
					operation: fixture.diagnosticTolerances.float32CompositionOperation,
					maximumUlp: fixture.diagnosticTolerances.float32CompositionMaximumUlp,
					failureCount: 0,
				},
			},
			outputStageChain: {
				id: 'rgba32f-rgba16f-normal-framebuffer-png-stage-chain',
				passes: scienceFailureCounts.stageChain === 0,
				observed: {failureCount: scienceFailureCounts.stageChain},
				required: {
					rgba16fTolerance: fixture.diagnosticTolerances.rgba16fVersusRgba32f,
					normalFramebufferMaximumCodeResidual:
						fixture.diagnosticTolerances.normalFramebufferMaximumCodeResidual,
					exactNormalFramebufferPngIdentity: true,
					failureCount: 0,
				},
			},
			samplingAndVisibility: {
				id: 'exact-samples-rays-coverage-state-and-cross-fov-contract',
				passes: scienceFailureCounts.sampling === 0 && scienceFailureCounts.crossViewport === 0,
				observed: {
					samplingFailureCount: scienceFailureCounts.sampling,
					crossViewportFailureCount: scienceFailureCounts.crossViewport,
				},
				required: {
					rayAngularResidualRadiansMaximum: fixture.diagnosticTolerances.rayAngularResidualRadiansMaximum,
					coverageAbsolute: fixture.diagnosticTolerances.coverageAbsolute,
					crossViewportSpectrum: fixture.diagnosticTolerances.crossViewportSpectrum,
					failureCount: 0,
				},
			},
			cacheLookup: {
				id: 'completed-cache-value-and-source-family-lookup-contract',
				passes: scienceFailureCounts.cacheLookup === 0,
				observed: {failureCount: scienceFailureCounts.cacheLookup},
				required: {distantStencilValid: true, flatStencil: null, failureCount: 0},
			},
			requiredPreviews: {
				id: 'two-retained-full-frame-scenes',
				passes: previewPasses && scienceFailureCounts.preview === 0,
				observed: {previewCount, nonfinitePreviewCount: scienceFailureCounts.preview},
				required: {previewCount: EXPECTED_PREVIEW_COUNT, nonfinitePreviewCount: 0},
			},
			flatGeometryAndSource: {
				id: 'flat-source-radiance-placement-and-distance-identity',
				passes: flatEntries.length === 3 && flatOrdered && flatEntries.every((entry) => entry.passes),
				observed: {entries: flatEntries, distanceClassesStrictlyOrdered: flatOrdered},
				required: {
					conditionCount: 3,
					observationPlacementToleranceMeters: fixture.diagnosticTolerances.flatObservationPlacementMeters,
					derivedRadialIdentityToleranceMeters: fixture.diagnosticTolerances.flatDerivedRadialIdentityMeters,
					distanceClassesStrictlyOrdered: true,
				},
			},
			protectedInputs: {
				id: 'exact-node-closure-and-complete-protected-root-identity',
				passes: true,
				observed: {
					snapshotAggregateSha256: protectedAfter.snapshot.inventory.aggregateSha256,
					nodeExecutableClosureSha256: protectedAfter.nodeExecutableClosure.descriptorSha256,
					nodeExecutableFileCount: protectedAfter.nodeExecutableClosure.inventory.fileCount,
					chromeExecutable: protectedAfter.chromeExecutable,
					protectedRoots: protectedAfter.protectedRoots.map((record) => ({
						id: record.id,
						repositoryRelativePath: record.repositoryRelativePath,
						fileCount: record.inventory.fileCount,
						aggregateSha256: record.inventory.aggregateSha256,
					})),
				},
				required: {
					beforeAfterExact: true,
					nodeExecutableFileCount: EXPECTED_NODE_CLOSURE_PATHS.length,
					completeProtectedRootCount: PROTECTED_ROOTS.length,
					chromeExecutableBeforeAfterExact: true,
				},
			},
			accepted: false,
		};
		await run.writeJsonArtifact('evidence/scientific-observations.json', {
			schemaVersion: 1,
			proofId: PROOF_ID,
			aggregateFailureCounts: scienceFailureCounts,
			conditions: conditionScience,
		});
		gates.accepted = Object.entries(gates)
			.filter(([key]) => !['schemaVersion', 'proofId', 'accepted'].includes(key))
			.every(([, gate]) => gate.passes === true);
		await run.writeJsonArtifact('evidence/gates.json', gates);
		await run.writeJsonArtifact('evidence/artifact-pointers.json', {
			schemaVersion: 1,
			proofId: PROOF_ID,
			artifacts: artifactPointers,
		});
		await run.writeJsonArtifact('evidence/runtime-closure.json', {
			schemaId: 'production-sun-appearance-gpu-visual-runtime-closure-v1',
			nodeExecutableBefore: protectedBefore.nodeExecutableClosure,
			nodeExecutableAfter: protectedAfter.nodeExecutableClosure,
			browserExecutedClosure: {
				uniqueDependencyClosureHashes: [...browserDependencyClosureHashes],
				shards: browserClosureObservations,
			},
		});
		const conclusion = gates.accepted ? 'accepted' : 'rejected';
		const terminalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: PROOF_ID,
				schemaVersion: 1,
				status: conclusion,
				source: 'sealed-production-snapshot',
				executionBackend: 'gpu',
				snapshot: {
					id: 'sun-appearance-step-5-v1',
					manifestSha256: protectedAfter.snapshot.manifestSha256,
					aggregateSha256: protectedAfter.snapshot.inventory.aggregateSha256,
				},
				fixture: {
					path: 'experiments/extraterrestrial/fixtures/production-sun-appearance-gpu-visual-v1.json',
					sha256: sha256(fixtureBytes),
				},
				conditions: conditionPointers,
				artifacts: {pointerManifest: 'evidence/artifact-pointers.json', count: artifactPointers.length},
				gates: {path: 'evidence/gates.json', accepted: gates.accepted},
				finalVerificationDeferred: fixture.finalVerificationDeferred,
			},
			report: reportText(run.runId, conclusion, gates),
		});
		const verification = await verifyRun(run.runDirectory);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					verified: verification.verified,
					artifactSetSha256: terminalManifest.artifactSetSha256,
				},
				null,
				2,
			)}\n`,
		);
		if (!gates.accepted) process.exitCode = 2;
	} catch (error) {
		const detail = serializeError(error);
		if (protectedBefore !== null && protectedAfter === null) {
			try {
				protectedAfter = await verifyProtectedAfter(protectedBefore);
				await run.writeJsonArtifact('evidence/failure-protected-after.json', protectedAfter);
			} catch (protectedError) {
				detail.protectedVerificationError = serializeError(protectedError);
			}
		}
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const terminalManifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: PROOF_ID, schemaVersion: 1, status: 'failed', error: detail},
				report: `# ${run.runId}: production Sun appearance GPU visual evidence\n\nConclusion: **failed**\n\n${detail.message}\n`,
			});
			const verification = await verifyRun(run.runDirectory);
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'failed',
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

main().catch((error) => {
	process.stderr.write(`GPU visual evidence initialization failed: ${error.stack ?? error}\n`);
	process.exitCode = 1;
});
