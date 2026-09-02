#!/usr/bin/env node

import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {assertNoReparseEntries} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {resolveExistingRunDirectory} from '../../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	pathComparisonKey,
} from '../../harness/lib/roots.js';
import {resolveDistantSunSceneCache} from '../controls/production-v1/src/flat32/DistantSunSceneCacheResolver.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {
	COLOR_RESET_RUNS_ROOT,
	initializeColorResetRunRecord,
	resolveColorResetRunRoots,
} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND_PREFIX =
	'node scripts/extraterrestrial/color-reset/runners/run-cr4f-fine-twilight-cadence.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr4f-fine-twilight-cadence-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4f-fine-twilight-cadence-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const CACHE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4f-fine-twilight-cadence';

const FIXTURE_SHA256 = 'e001b51f8981cf9562c07dab2ab1990230dea11a74d3941dd280154a392d9818';
const HARNESS_SHA256 = '995af5358f891f5330a1bb601f1d03b1f44241627e075cf202b0c913639122bb';
const MODEL_SHA256 = '36e66141a2aa820c7696ad100f1d71685efd02768c23b22a77a7573b8746c70d';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY =
	'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const EXPECTED_PARENT_RUN_ID = '000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence';
const EXPECTED_PARENT_ARTIFACT_SET_SHA256 =
	'4952c7b4781999885a44e9495d9566c6f4f8f3f0e6f6679fbd93a9fdb3cde656';
const EXPECTED_PARENT_MANIFEST_SHA256 =
	'72cc7b93125a05036c0f315a36d69cd1fdd78bc7951e846b64149f2c6cae97ac';
const EXPECTED_RESPONSE = Object.freeze({
	id: 'pre-tone-two-scale',
	sunsetAmplitude: 3.5,
	sunsetTransitionIlluminanceLux: 980,
	sunsetRolloffPower: 9,
	nauticalAmplitude: 5300,
	nauticalTransitionIlluminanceLux: 1,
	nauticalRolloffPower: 3,
});
const EXPECTED_SCENES = Object.freeze([
	Object.freeze({id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z', offsetMinutes: 0, mode: 'parent', bin: 90}),
	Object.freeze({id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z', offsetMinutes: 10, mode: 'parent', bin: 92}),
	Object.freeze({id: 'sunset-plus-20-minutes', timeIso: '2024-06-21T03:46:03.503Z', offsetMinutes: 20, mode: 'live', bin: 93}),
	Object.freeze({id: 'sunset-plus-30-minutes', timeIso: '2024-06-21T03:56:03.503Z', offsetMinutes: 30, mode: 'live', bin: 95}),
	Object.freeze({id: 'sunset-plus-45-minutes', timeIso: '2024-06-21T04:11:03.503Z', offsetMinutes: 45, mode: 'live', bin: 97}),
	Object.freeze({id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z', offsetMinutes: 60, mode: 'parent', bin: 100}),
]);
const EXPECTED_LIVE_CACHE_IDENTITIES = Object.freeze({
	'sunset-plus-20-minutes': Object.freeze({
		bin: 93,
		cacheIdentity:
			'algorithm32-distant-sun-scene-cache-sha256:46b89795e3873b17812a95087b62615c285fa68e0a1ace586e09d4eae1d45341',
		manifestSha256: '8fa254dbbf27ff8fcabda8918473da246780350f0023e158a2368393ea2c3482',
	}),
	'sunset-plus-30-minutes': Object.freeze({
		bin: 95,
		cacheIdentity:
			'algorithm32-distant-sun-scene-cache-sha256:0052e520dd09c964bf807fad012b9f17028c88ec3dc846c4c6d41b9d0f91f9bf',
		manifestSha256: '81033b7286298fe130f7e64d8d03757f18ac23ea31cd995142223b3f4881b031',
	}),
	'sunset-plus-45-minutes': Object.freeze({
		bin: 97,
		cacheIdentity:
			'algorithm32-distant-sun-scene-cache-sha256:28e04cd466f9abc5a9a8cf53e1f5cb2a51d57528c588624357d913b456c8869a',
		manifestSha256: '2926403cc5d9e66898393cf123649bfd6bf5c5b9769465c4bff6a3ce7bdeeb85',
	}),
});
const UPLOAD_LIMIT_BYTES = 128 * 1024 * 1024;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function isSha256(value) {
	return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isArtifactPath(value) {
	return (
		typeof value === 'string' &&
		value.length > 0 &&
		value === value.replaceAll('\\', '/') &&
		!path.posix.isAbsolute(value) &&
		!value.split('/').includes('..')
	);
}

function nearlyEqual(left, right, absoluteTolerance = 1e-9, relativeTolerance = 1e-12) {
	return (
		Number.isFinite(left) &&
		Number.isFinite(right) &&
		Math.abs(left - right) <=
			Math.max(absoluteTolerance, relativeTolerance * Math.max(Math.abs(left), Math.abs(right)))
	);
}

function outputImages(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder];
}

function liveArtifacts(fixture) {
	return [
		...fixture.outputs.fields,
		...fixture.outputs.masks,
		...fixture.outputs.receiverRadiances,
	];
}

function allowedBrowserArtifacts(fixture) {
	return [...outputImages(fixture), ...liveArtifacts(fixture)];
}

function expectedStackDimensions(fixture) {
	const layout = fixture.presentation.layout;
	return {
		width: layout.outerPaddingPixels * 2 + fixture.viewport.widthPixels,
		height:
			layout.outerPaddingPixels * 2 +
			layout.titleHeightPixels +
			fixture.scenes.length *
				(layout.sceneLabelHeightPixels + fixture.viewport.heightPixels) +
			(fixture.scenes.length - 1) * layout.rowGapPixels,
	};
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4f-fine-twilight-cadence-input-v1',
		'CR4F fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.appearanceAccepted === false &&
			fixture.claimBoundary?.chronologyGate === false &&
			fixture.claimBoundary?.continuityGate === false &&
			fixture.claimBoundary?.continuityClaim === false &&
			fixture.claimBoundary?.imageInterpolation === false &&
			fixture.claimBoundary?.illuminanceInterpolation === false &&
			fixture.claimBoundary?.perSceneColorTuning === false &&
			fixture.claimBoundary?.productionClaim === false,
		'CR4F owner-review claim boundary changed.',
	);
	const parent = fixture.parents?.acceptedCr4c;
	requireCondition(
		parent?.namespace === 'color-reset' &&
			parent.runId === EXPECTED_PARENT_RUN_ID &&
			parent.conclusion === 'accepted' &&
			parent.artifactSetSha256 === EXPECTED_PARENT_ARTIFACT_SET_SHA256 &&
			parent.manifest?.path === 'artifact-manifest.json' &&
			parent.manifest.sha256 === EXPECTED_PARENT_MANIFEST_SHA256 &&
			parent.responseId === fixture.response?.id &&
			parent.endpointEntries?.length === 3,
		'CR4F accepted CR4C parent declaration changed.',
	);
	for (const descriptor of [parent.manifest, parent.analysis]) {
		requireCondition(
			isArtifactPath(descriptor?.path) &&
				Number.isSafeInteger(descriptor.byteLength) &&
				descriptor.byteLength > 0 &&
				isSha256(descriptor.sha256),
			'CR4F parent manifest or analysis identity is invalid.',
		);
	}
	for (const endpoint of parent.endpointEntries) {
		requireCondition(
			EXPECTED_SCENES.some(({id, mode}) => id === endpoint.sceneId && mode === 'parent') &&
				isArtifactPath(endpoint.candidate?.path) &&
				Number.isSafeInteger(endpoint.candidate.byteLength) &&
				isSha256(endpoint.candidate.sha256) &&
				Number.isFinite(endpoint.totalHorizontalIlluminanceLux) &&
				Number.isFinite(endpoint.gain),
			`CR4F parent endpoint declaration changed for ${endpoint.sceneId}.`,
		);
	}
	requireCondition(
		fixture.cacheCatalog?.root ===
			'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1' &&
			fixture.cacheCatalog.path ===
				'distant-sun-runtime-catalog-2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac.json' &&
			fixture.cacheCatalog.sha256 === CATALOG_SHA256,
		'CR4F cache catalog changed.',
	);
	requireCondition(
		fixture.viewport?.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78 &&
			fixture.physicalControls?.spectralChannelCount === 15 &&
			fixture.physicalControls.cacheNumericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			fixture.physicalControls.maximumScatteringOrder === 4 &&
			fixture.physicalControls.pathIntervalCount === 30 &&
			fixture.physicalControls.sceneObjects === false &&
			fixture.physicalControls.celestialSourcesEnabled === false,
		'CR4F fixed camera or physical controls changed.',
	);
	requireCondition(
		fixture.response?.id ===
			'color-reset-cr4c-two-scale-total-horizontal-illuminance-pre-tone-gain-v1' &&
			exactJson(
				Object.fromEntries(
					Object.keys(EXPECTED_RESPONSE).map((key) => [key, fixture.response.selectedCandidate?.[key]]),
				),
				EXPECTED_RESPONSE,
			),
		'CR4F accepted two-scale response changed.',
	);
	requireCondition(fixture.scenes?.length === EXPECTED_SCENES.length, 'CR4F scene count changed.');
	for (let index = 0; index < EXPECTED_SCENES.length; index += 1) {
		const expected = EXPECTED_SCENES[index];
		const scene = fixture.scenes[index];
		requireCondition(
			scene?.id === expected.id &&
				scene.timeIso === expected.timeIso &&
				scene.offsetMinutes === expected.offsetMinutes &&
				scene.mode === expected.mode &&
				scene.cacheExpectation?.status === 'ready' &&
				scene.cacheExpectation.representativeSolarZenithDegrees === expected.bin &&
				isArtifactPath(scene.output?.image),
			`CR4F scene ${index} changed identity, chronology, mode, cache bin, or image output.`,
		);
		if (scene.mode === 'parent') {
			requireCondition(
				isArtifactPath(scene.parentCandidate?.path) &&
					isSha256(scene.parentCandidate.sha256) &&
					Number.isFinite(scene.totalHorizontalIlluminance?.value) &&
					Number.isFinite(scene.expectedGain?.value),
				`CR4F parent scene ${scene.id} changed.`,
			);
			continue;
		}
		const expectedCache = EXPECTED_LIVE_CACHE_IDENTITIES[scene.id];
		requireCondition(
			scene.cacheExpectation.cacheIdentity === expectedCache.cacheIdentity &&
				scene.cacheExpectation.manifestSha256 === expectedCache.manifestSha256 &&
				isArtifactPath(scene.cacheExpectation.assetPath) &&
				isArtifactPath(scene.cacheExpectation.manifestPath) &&
				Number.isSafeInteger(scene.cacheExpectation.packageByteLength) &&
				isArtifactPath(scene.output.fieldPath) &&
				isArtifactPath(scene.output.maskPath) &&
				isArtifactPath(scene.output.rawReceiverRadiancePath),
			`CR4F live scene ${scene.id} cache or retained-output declaration changed.`,
		);
	}
	const dimensions = expectedStackDimensions(fixture);
	requireCondition(
		dimensions.width === fixture.presentation.layout.expectedWidthPixels &&
			dimensions.height === fixture.presentation.layout.expectedHeightPixels &&
			dimensions.width === 688 &&
			dimensions.height === 2972,
		'CR4F single-column stack dimensions changed.',
	);
	requireCondition(
		exactJson(fixture.presentation.sceneOrder, EXPECTED_SCENES.map(({id}) => id)) &&
			exactJson(fixture.outputs.individuals, fixture.scenes.map((scene) => scene.output.image)) &&
			fixture.outputs.stack === 'figures/cr4f-fine-twilight-cadence.png' &&
			exactJson(outputImages(fixture), [...fixture.outputs.individuals, fixture.outputs.stack]),
		'CR4F scene or image-output order changed.',
	);
	const artifacts = allowedBrowserArtifacts(fixture);
	requireCondition(
		artifacts.length === 16 &&
			new Set(artifacts).size === artifacts.length &&
			artifacts.every(isArtifactPath),
		'CR4F requires exactly sixteen unique contained browser artifacts.',
	);
}

async function verifyOrdinaryCanonicalDirectory(directory, label) {
	const absolute = path.resolve(directory);
	const facts = await lstat(absolute);
	requireCondition(facts.isDirectory() && !facts.isSymbolicLink(), `${label} is not an ordinary directory.`);
	const canonical = await realpath(absolute);
	requireCondition(
		pathComparisonKey(canonical) === pathComparisonKey(absolute),
		`${label} traverses a link or junction.`,
	);
	return canonical;
}

async function resolveParentDirectory(selector) {
	const runsRoot = await verifyOrdinaryCanonicalDirectory(COLOR_RESET_RUNS_ROOT, 'Color-reset runs root');
	const resolved = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
	const canonical = await verifyOrdinaryCanonicalDirectory(resolved, 'CR4F accepted CR4C parent');
	assertLexicallyContained(runsRoot, canonical, 'CR4F accepted CR4C parent');
	await assertNoReparseEntries(canonical, 'CR4F accepted CR4C parent');
	return canonical;
}

function parentSelectedArtifacts(fixture) {
	return [
		fixture.parents.acceptedCr4c.analysis,
		...fixture.parents.acceptedCr4c.endpointEntries.map(({candidate}) => candidate),
	];
}

async function verifyParent({fixture, root, selector}) {
	const specification = fixture.parents.acceptedCr4c;
	await assertNoReparseEntries(root, 'CR4F accepted CR4C parent run');
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.conclusion === 'accepted' &&
			terminal.runId === EXPECTED_PARENT_RUN_ID &&
			terminal.artifactSetSha256 === EXPECTED_PARENT_ARTIFACT_SET_SHA256,
		'CR4F requires the explicitly selected, independently verified accepted CR4C parent.',
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	requireCondition(
		manifestFacts.isFile() &&
			!manifestFacts.isSymbolicLink() &&
			manifestFacts.size === specification.manifest.byteLength,
		'CR4F parent manifest file identity changed.',
	);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === EXPECTED_PARENT_MANIFEST_SHA256, 'CR4F parent manifest changed.');
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === EXPECTED_PARENT_RUN_ID &&
			manifest.conclusion === 'accepted' &&
			manifest.artifactSetSha256 === EXPECTED_PARENT_ARTIFACT_SET_SHA256 &&
			Array.isArray(manifest.artifacts),
		'CR4F parent terminal identity changed.',
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = parentSelectedArtifacts(fixture);
	for (const expected of selected) {
		const recorded = byPath.get(expected.path);
		requireCondition(
			recorded?.byteLength === expected.byteLength && recorded.sha256 === expected.sha256,
			`CR4F parent manifest identity changed for ${expected.path}.`,
		);
		const artifactPath = path.join(root, ...expected.path.split('/'));
		const facts = await lstat(artifactPath);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === expected.byteLength,
			`CR4F parent artifact file identity changed for ${expected.path}.`,
		);
		requireCondition(
			(await sha256File(artifactPath)) === expected.sha256,
			`CR4F parent artifact changed: ${expected.path}.`,
		);
	}
	const analysis = await readJson(
		path.join(root, ...specification.analysis.path.split('/')),
	);
	requireCondition(
		analysis.schemaId === 'algorithm32-color-reset-cr4c-two-scale-browser-result-v1' &&
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.appearanceAccepted === false &&
			analysis.response?.id === specification.responseId,
		'CR4F parent response evidence changed its schema or claim boundary.',
	);
	for (const [key, value] of Object.entries(EXPECTED_RESPONSE)) {
		requireCondition(
			analysis.response.selectedCandidate?.[key] === value,
			`CR4F parent selected response changed ${key}.`,
		);
	}
	const endpointEvidence = [];
	for (const endpoint of specification.endpointEntries) {
		const scene = analysis.scenes?.find(({sceneId}) => sceneId === endpoint.sceneId);
		const fixtureScene = fixture.scenes.find(({id}) => id === endpoint.sceneId);
		const uploaded = analysis.uploadedImages?.find(
			(image) => (image.artifactPath ?? image.path) === endpoint.candidate.path,
		);
		requireCondition(
			scene?.sceneId === endpoint.sceneId &&
				fixtureScene !== undefined &&
				scene.timeIso === fixtureScene.timeIso &&
				nearlyEqual(
					scene.totalHorizontalIlluminance?.value,
					endpoint.totalHorizontalIlluminanceLux,
					1e-12,
				) &&
				nearlyEqual(scene.gain, endpoint.gain, 1e-12) &&
				uploaded?.byteLength === endpoint.candidate.byteLength &&
				uploaded.sha256 === endpoint.candidate.sha256,
			`CR4F parent endpoint response evidence changed for ${endpoint.sceneId}.`,
		);
		endpointEvidence.push({
			sceneId: endpoint.sceneId,
			timeIso: fixtureScene.timeIso,
			solarZenithDegrees: fixtureScene.solarZenithDegrees,
			solarElevationDegrees: fixtureScene.solarElevationDegrees,
			solarAngleAuthority: 'exact CR4F timestamped scene fixture',
			totalHorizontalIlluminance: {...scene.totalHorizontalIlluminance},
			gain: scene.gain,
			gainDerivativePerLux: scene.gainDerivativePerLux,
			candidate: {...endpoint.candidate},
			exact: true,
		});
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-parent-verification-v1`,
		verified: true,
		namespace: specification.namespace,
		explicitSelector: selector,
		runId: terminal.runId,
		slug: terminal.slug,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		conclusion: terminal.conclusion,
		manifest: {...specification.manifest, sha256: manifestSha256, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...selected.map(({path: artifactPath}) => artifactPath),
		]),
		selectedArtifacts: selected.map((artifact) => ({...artifact})),
		response: analysis.response,
		endpointEvidence,
	};
}

function assertParentUnchanged(before, after) {
	requireCondition(
		before.runId === after.runId &&
			before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes &&
			exactJson(before.endpointEvidence, after.endpointEvidence),
		'CR4F accepted CR4C parent terminal or response evidence changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR4F accepted CR4C selected artifacts',
	);
	return true;
}

async function verifyControlSnapshot() {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifestSha256 === SNAPSHOT_MANIFEST_SHA256,
		'CR4F production control snapshot manifest changed.',
	);
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4F production control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4F snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4F snapshot and production closure');
	return {
		schemaId: `${SCHEMA_PREFIX}-control-snapshot-verification-v1`,
		accepted: true,
		manifestPath:
			'scripts/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
		manifestSha256,
		snapshotInventory,
		productionSelection,
	};
}

function assertControlSnapshotUnchanged(before, after) {
	requireCondition(
		before.manifestSha256 === after.manifestSha256,
		'CR4F production control snapshot manifest changed during execution.',
	);
	assertFileInventoriesEqual(before.snapshotInventory, after.snapshotInventory, 'CR4F snapshot source');
	assertFileInventoriesEqual(
		before.productionSelection,
		after.productionSelection,
		'CR4F selected production source',
	);
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(MODEL_PATH),
	]);
	requireCondition(isSha256(FIXTURE_SHA256), 'CR4F fixture SHA-256 pin is not finalized.');
	requireCondition(isSha256(HARNESS_SHA256), 'CR4F browser-harness SHA-256 pin is not finalized.');
	requireCondition(isSha256(MODEL_SHA256), 'CR4F Color-model SHA-256 pin is not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4F fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4F browser harness changed after predeclaration.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4F accepted CR4C Color model changed.');
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		model: {path: MODEL_RELATIVE_PATH, sha256: modelSha256},
	};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4f-fine-twilight-cadence.js',
			'color-reset/harness/cr4f-fine-twilight-cadence-browser.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
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
		],
	});
	const threeClosure = await buildStaticModuleClosure({
		candidateRoot: THREE_ROOT,
		entryFiles: [
			'build/three.module.js',
			'examples/jsm/postprocessing/EffectComposer.js',
			'examples/jsm/postprocessing/RenderPass.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	const threePackagePath = path.join(THREE_ROOT, 'package.json');
	const threePackage = await readJson(threePackagePath);
	requireCondition(threePackage.version === '0.180.0', 'CR4F requires locked Three 0.180.0.');
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-before-v1`,
		implementation: {
			closure: implementationClosure,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, implementationClosure.files),
		},
		browserDependencies: {
			servedClosure: threeClosure,
			servedInventory: await createSelectedFileInventory(THREE_ROOT, threeClosure.files),
			threePackage: {
				version: threePackage.version,
				packageJsonSha256: await sha256File(threePackagePath),
			},
		},
		packageBoundary: {
			packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
			packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
		},
	};
}

async function captureImplementationAfter(before) {
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-after-v1`,
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementation.closure.files,
		),
		threeServedInventory: await createSelectedFileInventory(
			THREE_ROOT,
			before.browserDependencies.servedClosure.files,
		),
		threePackageJsonSha256: await sha256File(path.join(THREE_ROOT, 'package.json')),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR4F runtime implementation',
	);
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR4F browser-served Three closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 ===
			after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR4F package boundary changed during execution.',
	);
	return true;
}

async function verifySelectedPackage(scene, resolution) {
	const expected = scene.cacheExpectation;
	requireCondition(resolution.status === 'ready', `${scene.id} did not resolve a ready cache.`);
	requireCondition(
		resolution.representativeSolarZenithDegrees === expected.representativeSolarZenithDegrees &&
			resolution.asset.loadRequest.cacheIdentity === expected.cacheIdentity &&
			resolution.asset.loadRequest.manifestSha256 === expected.manifestSha256,
		`${scene.id} resolved the wrong one-degree package.`,
	);
	requireCondition(resolution.asset.assetRoot.startsWith('/cache/'), `${scene.id} cache root is invalid.`);
	const packageRelativePath = resolution.asset.assetRoot.slice('/cache/'.length);
	requireCondition(packageRelativePath === expected.assetPath, `${scene.id} cache asset path changed.`);
	const packageDirectory = path.join(CACHE_ROOT, ...packageRelativePath.replace(/\/$/u, '').split('/'));
	assertLexicallyContained(CACHE_ROOT, packageDirectory, `${scene.id} cache package`);
	await assertNoReparseEntries(packageDirectory, `${scene.id} cache package`);
	const manifestPath = path.join(packageDirectory, resolution.asset.loadRequest.manifestPath);
	assertLexicallyContained(packageDirectory, manifestPath, `${scene.id} cache manifest`);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		resolution.asset.loadRequest.manifestPath === expected.manifestPath &&
			manifestSha256 === expected.manifestSha256,
		`${scene.id} cache manifest changed.`,
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.cacheIdentity === expected.cacheIdentity &&
			manifest.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			manifest.selection?.representativeSolarZenithDegrees ===
				expected.representativeSolarZenithDegrees &&
			manifest.selection.minimumInputDegrees === expected.minimumInputDegrees &&
			manifest.selection.maximumInputExclusiveDegrees === expected.maximumInputExclusiveDegrees,
		`${scene.id} cache manifest contract changed.`,
	);
	const inventory = await createFileInventory(packageDirectory);
	requireCondition(
		inventory.fileCount === 4 && inventory.totalBytes === expected.packageByteLength,
		`${scene.id} cache package inventory changed.`,
	);
	return {
		sceneId: scene.id,
		timeIso: scene.timeIso,
		requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
		representativeSolarZenithDegrees: resolution.representativeSolarZenithDegrees,
		minimumInputDegrees: manifest.selection.minimumInputDegrees,
		maximumInputExclusiveDegrees: manifest.selection.maximumInputExclusiveDegrees,
		cacheIdentity: manifest.cacheIdentity,
		numericalIdentity: manifest.numericalIdentity,
		packageRelativePath,
		manifest: {
			path: resolution.asset.loadRequest.manifestPath,
			byteLength: inventory.files.find(({path: relativePath}) => relativePath === resolution.asset.loadRequest.manifestPath)?.bytes,
			sha256: manifestSha256,
		},
		packageInventory: inventory,
	};
}

async function resolveAndVerifyCacheInputs(fixture) {
	await assertNoReparseEntries(CACHE_ROOT, 'CR4F runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const packageReportSha256 = await sha256File(reportPath);
	requireCondition(packageReportSha256 === PACKAGE_REPORT_SHA256, 'CR4F package report changed.');
	const report = await readJson(reportPath);
	requireCondition(report.accepted === true && report.packageCount === 109, 'CR4F package report is not accepted.');
	requireCondition(report.catalogPath === fixture.cacheCatalog.path, 'CR4F package-report catalog path changed.');
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR4F cache catalog');
	const catalogFacts = await lstat(catalogPath);
	const catalogSha256 = await sha256File(catalogPath);
	requireCondition(
		catalogFacts.isFile() &&
			!catalogFacts.isSymbolicLink() &&
			catalogFacts.size === fixture.cacheCatalog.byteLength &&
			catalogSha256 === CATALOG_SHA256 &&
			catalogSha256 === report.catalogSha256,
		'CR4F cache catalog identity changed.',
	);
	const catalog = await readJson(catalogPath);
	const browserScenes = [];
	const packages = [];
	for (const scene of fixture.scenes) {
		if (scene.mode !== 'live') {
			browserScenes.push({...scene});
			continue;
		}
		const sceneState = createDistantSunSceneState({
			observation: {
				instant: scene.timeIso,
				location: {
					latitude: {value: fixture.location.latitudeDegrees, units: 'degrees'},
					longitude: {value: fixture.location.longitudeDegrees, units: 'degrees'},
				},
			},
			observerHeight: {value: fixture.observer.heightMeters, units: 'meters'},
			observerUpDirection: fixture.observer.upDirection,
		});
		requireCondition(
			nearlyEqual(sceneState.solarZenithDegrees, scene.solarZenithDegrees, 1e-6) &&
				nearlyEqual(90 - sceneState.solarZenithDegrees, scene.solarElevationDegrees, 1e-6),
			`${scene.id} exact scene-state solar angle changed.`,
		);
		const resolution = resolveDistantSunSceneCache(
			catalog,
			sceneState.solarZenithDegrees,
			'/cache/',
		);
		const selection = await verifySelectedPackage(scene, resolution);
		packages.push(selection);
		browserScenes.push({
			...scene,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			solarElevationDegrees: 90 - sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			cacheStatus: 'ready',
			cacheIdentity: selection.cacheIdentity,
			cacheSelectionEvidence: {
				sceneId: selection.sceneId,
				requestedSolarZenithDegrees: selection.requestedSolarZenithDegrees,
				representativeSolarZenithDegrees: selection.representativeSolarZenithDegrees,
				cacheIdentity: selection.cacheIdentity,
				manifest: selection.manifest,
			},
			sceneCacheAsset: resolution.asset,
		});
	}
	return {
		browserScenes,
		evidence: {
			schemaId: `${SCHEMA_PREFIX}-cache-input-verification-v1`,
			accepted: true,
			packageRoot: fixture.cacheCatalog.root,
			packageReport: {path: 'package-report.json', sha256: packageReportSha256},
			catalog: {
				path: report.catalogPath,
				byteLength: catalogFacts.size,
				sha256: catalogSha256,
			},
			packages,
			selections: packages.map(({packageInventory, ...selection}) => selection),
		},
	};
}

function assertCacheInputsUnchanged(before, after) {
	requireCondition(
		before.packageReport.sha256 === after.packageReport.sha256 &&
			exactJson(before.catalog, after.catalog) &&
			before.packages.length === after.packages.length,
		'CR4F cache catalog boundary changed during execution.',
	);
	for (let index = 0; index < before.packages.length; index += 1) {
		const left = before.packages[index];
		const right = after.packages[index];
		const {packageInventory: leftInventory, ...leftFacts} = left;
		const {packageInventory: rightInventory, ...rightFacts} = right;
		requireCondition(exactJson(leftFacts, rightFacts), `CR4F cache selection ${left.sceneId} changed.`);
		assertFileInventoriesEqual(leftInventory, rightInventory, `CR4F ${left.sceneId} cache package`);
	}
	return true;
}

function makeBrowserConfiguration(fixture, cacheInputs) {
	return {
		...fixture,
		scenes: cacheInputs.browserScenes,
	};
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const imageUploads = browser.uploads.filter(({path: artifactPath}) =>
		outputImages(fixture).includes(artifactPath),
	);
	const first = imageUploads[0] ?? null;
	const stack = imageUploads.find(({path: artifactPath}) => artifactPath === fixture.outputs.stack) ?? null;
	const timed = (entry, targetMilliseconds) => entry === null ? null : {
		artifactPath: entry.path,
		completedAt: entry.completedAt,
		elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, entry.completedAt),
		targetMilliseconds,
	};
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: timed(first, 180_000),
		decisionPlate: timed(stack, 600_000),
		allRequestedImages: imageUploads.length === outputImages(fixture).length
			? {
				count: imageUploads.length,
				completedAt: imageUploads.at(-1).completedAt,
				elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, imageUploads.at(-1).completedAt),
			}
			: null,
	};
}

function expectedGain(illuminanceLux) {
	const hill = (amplitude, transition, power) => {
		const ratio = illuminanceLux / transition;
		if (!Number.isFinite(ratio)) return 0;
		if (ratio > 1) {
			const inversePower = (1 / ratio) ** power;
			return amplitude * inversePower / (1 + inversePower);
		}
		return amplitude / (1 + ratio ** power);
	};
	return 1 +
		hill(EXPECTED_RESPONSE.sunsetAmplitude, EXPECTED_RESPONSE.sunsetTransitionIlluminanceLux, EXPECTED_RESPONSE.sunsetRolloffPower) +
		hill(EXPECTED_RESPONSE.nauticalAmplitude, EXPECTED_RESPONSE.nauticalTransitionIlluminanceLux, EXPECTED_RESPONSE.nauticalRolloffPower);
}

function uploadedByPath(browser) {
	return new Map(browser.uploads.map((upload) => [upload.path, upload]));
}

function verifyBrowserArtifactIdentities(analysis, browser, fixture) {
	const server = uploadedByPath(browser);
	for (const image of analysis.uploadedImages ?? []) {
		const upload = server.get(image.artifactPath);
		requireCondition(
			upload?.byteLength === image.byteLength && upload.sha256 === image.sha256,
			`CR4F browser/server image identity differs for ${image.artifactPath}.`,
		);
	}
	for (const scene of analysis.scenes.filter(({mode}) => mode === 'live')) {
		for (const record of [scene.field, scene.mask, scene.receiverRadiance]) {
			const upload = server.get(record.artifactPath);
			requireCondition(
				upload?.byteLength === record.byteLength && upload.sha256 === record.sha256,
				`CR4F browser/server retained-data identity differs for ${record.artifactPath}.`,
			);
		}
	}
	const expected = allowedBrowserArtifacts(fixture).slice().sort();
	const actual = browser.uploads.map(({path: artifactPath}) => artifactPath).slice().sort();
	requireCondition(exactJson(actual, expected), 'CR4F browser uploads differ from the sixteen declared artifacts.');
	return true;
}

function evaluateGates({analysis, browser, fixture, progress, parentUnchanged, cacheUnchanged, snapshotUnchanged}) {
	const expectedImages = outputImages(fixture);
	const imageUploads = browser.uploads.filter(({path: artifactPath}) => expectedImages.includes(artifactPath));
	const actualImageOrder = imageUploads.map(({path: artifactPath}) => artifactPath);
	const sceneById = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const server = uploadedByPath(browser);
	const dimensions = expectedStackDimensions(fixture);
	const endpointById = new Map(
		fixture.parents.acceptedCr4c.endpointEntries.map((endpoint) => [endpoint.sceneId, endpoint]),
	);
	const exactParentCopies = fixture.scenes.filter(({mode}) => mode === 'parent').every((scene) => {
		const endpoint = endpointById.get(scene.id);
		const actual = sceneById.get(scene.id);
		const upload = server.get(scene.output.image);
		return endpoint !== undefined &&
			actual?.parentCandidate?.verified === true &&
			actual.parentCandidate.sha256 === endpoint.candidate.sha256 &&
			actual.output?.sha256 === endpoint.candidate.sha256 &&
			upload?.sha256 === endpoint.candidate.sha256 &&
			upload.byteLength === endpoint.candidate.byteLength;
	});
	const liveSceneIntegrity = fixture.scenes.filter(({mode}) => mode === 'live').every((scene) => {
		const actual = sceneById.get(scene.id);
		const expectedCache = EXPECTED_LIVE_CACHE_IDENTITIES[scene.id];
		return actual?.mode === 'live' &&
			nearlyEqual(actual.solarZenithDegrees, scene.solarZenithDegrees, 1e-6) &&
			nearlyEqual(actual.solarElevationDegrees, scene.solarElevationDegrees, 1e-6) &&
			actual.totalHorizontalIlluminance?.units === 'lux' &&
			Number.isFinite(actual.totalHorizontalIlluminance.value) &&
			actual.totalHorizontalIlluminance.value >= 0 &&
			nearlyEqual(actual.gain, expectedGain(actual.totalHorizontalIlluminance.value), 1e-9) &&
			actual.cache?.identity === expectedCache.cacheIdentity &&
			actual.field?.artifactPath === scene.output.fieldPath &&
			actual.field.byteLength === fixture.retainedLiveArtifacts.field.byteLengthPerScene &&
			actual.mask?.artifactPath === scene.output.maskPath &&
			actual.mask.byteLength === fixture.retainedLiveArtifacts.sceneHitMask.byteLengthPerScene &&
			actual.mask.skyPixelCount > 0 &&
			actual.mask.geometryPixelCount > 0 &&
			actual.mask.noncanonicalPixelCount === 0 &&
			actual.receiverRadiance?.artifactPath === scene.output.rawReceiverRadiancePath &&
			actual.receiverRadiance.byteLength === fixture.retainedLiveArtifacts.receiverDiffuseRadiance.byteLengthPerScene &&
			actual.receiverLight?.schemaId === 'algorithm32-color-reset-cr2-scene-measurement-v1' &&
			actual.gpu?.errors?.length === 0 &&
			actual.gpu.contextLost === false &&
			actual.acquisitionWebglErrors?.length === 0 &&
			actual.acquisitionContextLost === false &&
			actual.gpuCpuParity?.encodedSky?.maximumAbsoluteDifference <= 1 &&
			Number.isFinite(actual.gpuCpuParity?.floatSky?.maximumAbsoluteDifference);
	});
	const exactEmbeddings = analysis.stack?.embeddings?.length === fixture.scenes.length &&
		analysis.stack.embeddings.every(({comparison}) =>
			comparison?.exact === true &&
			comparison.differingChannelCount === 0 &&
			comparison.maximumAbsoluteChannelDifference === 0 &&
			comparison.comparedChannelCount === fixture.viewport.widthPixels * fixture.viewport.heightPixels * 4,
		);
	const gates = {
		browserResultSchema:
			analysis.schemaId === 'algorithm32-color-reset-cr4f-fine-twilight-cadence-browser-result-v1',
		ownerReviewBoundary:
			analysis.appearanceAccepted === false &&
			analysis.ownerAppearanceReviewRequired === true &&
			analysis.continuityAccepted === false &&
			analysis.continuityGateEvaluated === false &&
			fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.continuityGate === false,
		renderCompletedBeforeRunnerGates:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true &&
			analysis.allDeclaredArtifactsUploaded === true,
		allSixteenArtifactsWritten:
			browser.uploads.length === allowedBrowserArtifacts(fixture).length &&
			new Set(browser.uploads.map(({path: artifactPath}) => artifactPath)).size === allowedBrowserArtifacts(fixture).length,
		allSevenImagesWrittenInOrder:
			imageUploads.length === expectedImages.length && exactJson(actualImageOrder, expectedImages),
		stackUploadedAfterIndividuals:
			actualImageOrder.at(-1) === fixture.outputs.stack &&
			exactJson(analysis.imageUploadOrder, expectedImages),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		parentResponseAuthenticated:
			analysis.parent?.analysis?.verified === true &&
			analysis.parent.analysis.sha256 === fixture.parents.acceptedCr4c.analysis.sha256 &&
			analysis.parent.verification?.verified === true,
		exactParentEndpointCopies: exactParentCopies,
		exactSceneOrder: exactJson(analysis.scenes.map(({sceneId}) => sceneId), EXPECTED_SCENES.map(({id}) => id)),
		liveNative15Q30AcquisitionComplete: liveSceneIntegrity,
		gpuReplayHealthy:
			analysis.gpuReplay?.extColorBufferFloat === true &&
			analysis.gpuReplay.startupErrors?.length === 0 &&
			analysis.gpuReplay.terminalErrors?.length === 0 &&
			isSha256(analysis.gpuReplay.fragmentSourceSha256),
		exactStackDimensions:
			analysis.stack?.width === dimensions.width && analysis.stack?.height === dimensions.height,
		sourcePanelsEmbeddedExactly: exactEmbeddings,
		parentRunRemainedImmutable: parentUnchanged,
		cacheInputsRemainedImmutable: cacheUnchanged,
		controlSnapshotRemainedImmutable: snapshotUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	return {gates, integrityPassed: Object.values(gates).every(Boolean), accepted: Object.values(gates).every(Boolean)};
}

async function main() {
	const [parentSelector, ...extraArguments] = process.argv.slice(2);
	if (!parentSelector || parentSelector.trim() === '' || extraArguments.length !== 0) {
		throw new Error(`Usage: ${COMMAND_PREFIX} <explicit-accepted-CR4C-run-id-or-contained-path>`);
	}
	const command = `${COMMAND_PREFIX} ${JSON.stringify(parentSelector)}`;
	const fixture = await readJson(FIXTURE_PATH);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4f-fine-twilight-cadence',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4F fine sunset-to-nautical cadence owner review',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitAcceptedCr4cParentSelector: parentSelector,
			parent: fixture.parents.acceptedCr4c,
			cacheCatalog: fixture.cacheCatalog,
			scenes: fixture.scenes,
			outputArtifacts: allowedBrowserArtifacts(fixture),
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Copy three authenticated accepted CR4C endpoint PNGs byte-for-byte; acquire the exact plus-20, plus-30, and plus-45 Native15/N4/Q30/ozone fields and CR2 receiver light through catalog-selected one-degree caches; replay the unchanged CR4C two-scale pre-tone response on GPU; compose one labeled 1:1 chronological stack.',
			implementation: [HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, MODEL_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			physicalInput: fixture.physicalControls,
			exclusions: [
				'no image or illuminance interpolation',
				'no per-scene Color tuning',
				'no Bruneton comparison panels',
				'no chronology or continuity acceptance gate',
				'no appearance acceptance',
				'no production change',
			],
		},
		environment: {
			schemaId: `${SCHEMA_PREFIX}-environment-v1`,
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			browserTimeoutMilliseconds: 900_000,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			acceptedCr4c: 'tmp/extraterrestrial/color-reset/runs/000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#accepted-cr4c-two-scale-boundary',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let implementationBefore = null;
	let implementationAfter = null;
	let protectedBefore = null;
	let protectedAfter = null;
	let parentBefore = null;
	let parentAfter = null;
	let parentDirectoryBefore = null;
	let parentDirectoryAfter = null;
	let cacheBefore = null;
	let cacheAfter = null;
	let snapshotBefore = null;
	let snapshotAfter = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4F color-reset implementation');
		verifyFixtureContract(fixture);
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		parentDirectoryBefore = await resolveParentDirectory(parentSelector);
		parentBefore = await verifyParent({fixture, root: parentDirectoryBefore, selector: parentSelector});
		await run.writeJsonArtifact('evidence/parent-before.json', parentBefore);
		cacheBefore = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification-before.json', cacheBefore.evidence);
		snapshotBefore = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-before.json', snapshotBefore);
		implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		const browserConfiguration = makeBrowserConfiguration(fixture, cacheBefore);
		await run.writeJsonArtifact('browser/configuration.json', browserConfiguration);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4f-fine-twilight-cadence-browser.js',
			exportName: 'runCr4fFineTwilightCadenceBrowser',
			servedRoots: {'/parent/': parentDirectoryBefore, '/cache/': CACHE_ROOT},
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			allowedArtifactPaths: allowedBrowserArtifacts(fixture),
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: 900_000,
		});
		const analysis = {
			...browser.result,
			runtimeEnvironment: browser.runtimeEnvironment,
			serverUploads: browser.uploads,
		};
		verifyBrowserArtifactIdentities(analysis, browser, fixture);
		await run.writeJsonArtifact(fixture.outputs.analysis, analysis);
		await run.writeJsonArtifact(fixture.outputs.panelIdentities, analysis.panelIdentities);
		await run.writeJsonArtifact(fixture.outputs.imageDerivations, analysis.imageDerivations);
		await run.writeJsonArtifact('evidence/receiver-light.json', {
			schemaId: `${SCHEMA_PREFIX}-receiver-light-v1`,
			scenes: analysis.scenes.filter(({mode}) => mode === 'live').map((scene) => ({
				sceneId: scene.sceneId,
				totalHorizontalIlluminance: scene.totalHorizontalIlluminance,
				measurement: scene.receiverLight,
				rawReceiverRadiance: scene.receiverRadiance,
			})),
		});

		implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertImplementationUnchanged(implementationBefore, implementationAfter);
		parentDirectoryAfter = await resolveParentDirectory(parentSelector);
		requireCondition(
			pathComparisonKey(parentDirectoryBefore) === pathComparisonKey(parentDirectoryAfter),
			'CR4F explicit parent selector resolved differently after rendering.',
		);
		parentAfter = await verifyParent({fixture, root: parentDirectoryAfter, selector: parentSelector});
		await run.writeJsonArtifact('evidence/parent-after.json', parentAfter);
		const parentUnchanged = assertParentUnchanged(parentBefore, parentAfter);
		cacheAfter = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification-after.json', cacheAfter.evidence);
		const cacheUnchanged = assertCacheInputsUnchanged(cacheBefore.evidence, cacheAfter.evidence);
		snapshotAfter = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-after.json', snapshotAfter);
		const snapshotUnchanged = assertControlSnapshotUnchanged(snapshotBefore, snapshotAfter);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		assertFileInventoriesEqual(protectedBefore.algorithm32, protectedAfter.algorithm32, 'CR4F protected Algorithm32 source');
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4F protected Flat32 source');
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact(fixture.outputs.progress, progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			parentUnchanged,
			cacheUnchanged,
			snapshotUnchanged,
		});
		const conclusion = decision.accepted ? 'accepted' : 'failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			continuityAccepted: false,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			progress,
			parent: parentAfter,
			cache: cacheAfter.evidence,
			outputs: analysis.uploadedImages,
			protectedSourceUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4F fine twilight cadence`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All six new-color images and the one-column stack were written before runner gates. Parent endpoints are byte-exact accepted CR4C PNGs; only plus 20, plus 30, and plus 45 minutes execute live Native15/Q30 acquisition and the unchanged response.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'Appearance and continuous animation remain unaccepted; this run is a static owner-review cadence.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(
			independent.verified === true &&
			independent.conclusion === conclusion &&
			independent.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4F terminal run failed independent verification.',
		);
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: independent.verified,
			appearanceAccepted: false,
			outputs: analysis.uploadedImages,
			gates: decision.gates,
			progress,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact(fixture.outputs.progress, {
					schemaId: `${SCHEMA_PREFIX}-progress-v1`,
					initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(),
					error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: `${SCHEMA_PREFIX}-failure-v1`,
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : null,
				},
				implementationBeforeRecorded: implementationBefore !== null,
				implementationAfterRecorded: implementationAfter !== null,
				parentBeforeRecorded: parentBefore !== null,
				parentAfterRecorded: parentAfter !== null,
				cacheBeforeRecorded: cacheBefore !== null,
				cacheAfterRecorded: cacheAfter !== null,
				protectedBeforeRecorded: protectedBefore !== null,
				protectedAfterRecorded: protectedAfter !== null,
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: `${SCHEMA_PREFIX}-failed-result-v1`,
					accepted: false,
					integrityPassed: false,
					appearanceAccepted: false,
					continuityAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4F fine twilight cadence\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
