#!/usr/bin/env node

import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {assertExistingRealPathContained, assertNoReparseEntries} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
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
	'node experiments/extraterrestrial/color-reset/runners/' + 'run-cr4a-native15-sunset-paper-visual-comparison.js';
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
	'experiments/extraterrestrial/color-reset/fixtures/' + 'cr4a-sunset-paper-visual-comparison-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const BROWSER_HARNESS_PATH = path.join(COLOR_RESET_ROOT, 'harness', 'cr4a-sunset-paper-visual-comparison-browser.js');
const SKY_IMAGE_RENDERER_PATH = path.join(COLOR_RESET_ROOT, 'rendering', 'Native15SkyImageRenderer.js');
const CACHE_RELATIVE_ROOT = 'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1';
const CACHE_ROOT = path.join(REPOSITORY_ROOT, ...CACHE_RELATIVE_ROOT.split('/'));
const FIXTURE_SHA256 = '92da0d4e3870f4f2e015fa553410d55f206ad1eef799e12af19b7fd3ffcba9f3';
const BROWSER_HARNESS_SHA256 = '9088771f6addf9db2cbaab0b949d60aab73fe9cbddd66157934ec88b3815a8e8';
const SKY_IMAGE_RENDERER_SHA256 = 'e362e4fdac4db0fdab60ad4d3cd1b728a0e1bd4f67e6dd6f273ce9f8266be9ef';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY = 'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const EXPECTED_TRANSPORT_ID = 'color-reset-cr2-q30-arbitrary-direction-safe4096-v2';
const EXPECTED_TRANSPORT_BATCH_CAPACITY = 4096;
const EXPECTED_RENDER_SCENES = Object.freeze([
	{id: 'z87-bridge', representativeBin: 87},
	{id: 'actual-sunset', representativeBin: 90},
]);
const RAW_FIELD_CONTRACTS = Object.freeze({
	'z87-aligned-dome': {sceneId: 'z87-bridge', imageKey: 'alignedDome', directionCount: 51468},
	'z87-aligned-swatch': {sceneId: 'z87-bridge', imageKey: 'swatch', directionCount: 589824},
	'actual-sunset-aligned-dome': {
		sceneId: 'actual-sunset',
		imageKey: 'alignedDome',
		directionCount: 51468,
	},
	'actual-sunset-geographic-dome': {
		sceneId: 'actual-sunset',
		imageKey: 'geographicDome',
		directionCount: 51468,
	},
	'actual-sunset-aligned-swatch': {
		sceneId: 'actual-sunset',
		imageKey: 'swatch',
		directionCount: 589824,
	},
});
const NATIVE15_CHANNEL_COUNT = 15;
const FLOAT32_BYTE_LENGTH = 4;
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const BROWSER_TIMEOUT_MILLISECONDS = 1_800_000;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function portablePath(value) {
	return value.split(path.sep).join('/');
}

function diagnosticPath(fixture) {
	return typeof fixture.outputs.luminanceDiagnostic === 'string'
		? fixture.outputs.luminanceDiagnostic
		: fixture.outputs.luminanceDiagnostic?.path;
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function pngFacts(bytes, label) {
	requireCondition(bytes.length >= 33, `${label} is too short to be a PNG.`);
	requireCondition(bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${label} has an invalid PNG signature.`);
	requireCondition(bytes.toString('ascii', 12, 16) === 'IHDR', `${label} has no leading IHDR chunk.`);
	return {
		widthPixels: bytes.readUInt32BE(16),
		heightPixels: bytes.readUInt32BE(20),
		bitDepthPerComponent: bytes[24],
		colorType: bytes[25],
		compressionMethod: bytes[26],
		filterMethod: bytes[27],
		interlaceMethod: bytes[28],
	};
}

function paperDeclarations(fixture) {
	return [
		...fixture.figure9SunriseSwatches.panels.map((panel) => ({
			...panel,
			artifactPath: panel.outputPath,
			kind: 'paper-figure9-sunrise',
			widthPixels: 1024,
			heightPixels: 576,
		})),
		...fixture.figure1LowSunDomes.panels.map((panel) => ({
			...panel,
			artifactPath: panel.outputPath,
			kind: 'paper-figure1-z87',
			widthPixels: 256,
			heightPixels: 256,
		})),
	];
}

function browserUploadPaths(fixture) {
	return [
		...fixture.outputs.oursCleanPanels.map(({path: artifactPath}) => artifactPath),
		diagnosticPath(fixture),
		...fixture.outputs.rawFields.map(({path: artifactPath}) => artifactPath),
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
		fixture.outputs.sceneMeasurements,
	];
}

function expectedBrowserUploadOrder(fixture) {
	const rawById = new Map(fixture.outputs.rawFields.map((field) => [field.id, field.path]));
	const imageById = new Map(fixture.outputs.oursCleanPanels.map((image) => [image.id, image.path]));
	return [
		imageById.get('z87-absolute-dome'),
		rawById.get('z87-aligned-dome'),
		imageById.get('z87-normalized-swatch'),
		rawById.get('z87-aligned-swatch'),
		imageById.get('actual-sunset-absolute-dome'),
		rawById.get('actual-sunset-aligned-dome'),
		imageById.get('actual-sunset-geographic-dome'),
		rawById.get('actual-sunset-geographic-dome'),
		diagnosticPath(fixture),
		imageById.get('actual-sunset-normalized-swatch'),
		rawById.get('actual-sunset-aligned-swatch'),
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
		fixture.outputs.sceneMeasurements,
	];
}

function requestedImagePaths(fixture) {
	return [
		...paperDeclarations(fixture).map(({artifactPath}) => artifactPath),
		...fixture.outputs.oursCleanPanels.map(({path: artifactPath}) => artifactPath),
		diagnosticPath(fixture),
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
	];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4a-sunset-paper-visual-comparison-input-v1',
		'CR4A fixture schema changed.',
	);
	requireCondition(
		fixture.experiment?.id === 'CR4A' &&
			fixture.experiment?.slug === 'sunset-paper-visual-comparison' &&
			fixture.experiment?.kind === 'qualitative-control-inventory' &&
			fixture.experiment?.candidate === null &&
			fixture.experiment?.frozenBeforeExecution === true,
		'CR4A experiment boundary changed.',
	);
	const renderScenes = fixture.scenes.filter(({renderInThisControl}) => renderInThisControl);
	requireCondition(
		exactJson(
			renderScenes.map((scene) => ({
				id: scene.id,
				representativeBin: scene.cacheExpectation?.representativeSolarZenithDegrees,
			})),
			EXPECTED_RENDER_SCENES,
		),
		'CR4A rendered scene identities or exact cache bins changed.',
	);
	requireCondition(
		fixture.algorithm32Control.cache.compatibilityIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			fixture.algorithm32Control.cache.spectralBasis === 'production Native15' &&
			fixture.algorithm32Control.cache.spectralChannelCount === NATIVE15_CHANNEL_COUNT &&
			fixture.algorithm32Control.cache.cameraPathQuadrature === 'Q30 quadratic-near-observer' &&
			fixture.algorithm32Control.cache.exactSceneCacheRequired === true &&
			fixture.algorithm32Control.cache.ozone === true,
		'CR4A Native15/Q30 exact-cache contract changed.',
	);
	requireCondition(
		fixture.outputs.paperSwatchPanels.length === 8 &&
			fixture.outputs.paperDomePanels.length === 9 &&
			fixture.outputs.oursCleanPanels.length === 5 &&
			fixture.outputs.rawFields.length === 5,
		'CR4A output cardinality changed.',
	);
	requireCondition(
		exactJson(
			paperDeclarations(fixture).map(({artifactPath}) => artifactPath),
			[...fixture.outputs.paperSwatchPanels, ...fixture.outputs.paperDomePanels],
		),
		'CR4A exact paper-panel output order changed.',
	);
	requireCondition(
		fixture.parents?.paperReferenceInventory?.namespace === 'color-reset' &&
			fixture.parents.paperReferenceInventory.runId === '000016-paper-sunset-reference-inventory' &&
			exactJson(
				fixture.parents.paperReferenceInventory.copyArtifacts,
				paperDeclarations(fixture).map(({artifactPath}) => artifactPath),
			),
		'CR4A explicit paper-parent or 17-panel copy boundary changed.',
	);
	requireCondition(
		exactJson(
			fixture.outputs.rawFields.map(({id}) => id),
			Object.keys(RAW_FIELD_CONTRACTS),
		),
		'CR4A raw Native15 field order changed.',
	);
	for (const rawField of fixture.outputs.rawFields) {
		const contract = RAW_FIELD_CONTRACTS[rawField.id];
		requireCondition(
			rawField.directionCount === contract.directionCount &&
				rawField.channelCount === NATIVE15_CHANNEL_COUNT &&
				rawField.valueCount === contract.directionCount * NATIVE15_CHANNEL_COUNT &&
				rawField.scalarType === 'float32' &&
				rawField.byteOrder === 'little-endian' &&
				rawField.byteLength === contract.directionCount * NATIVE15_CHANNEL_COUNT * FLOAT32_BYTE_LENGTH,
			`CR4A raw-field contract changed for ${rawField.id}.`,
		);
	}
	requireCondition(
		exactJson(fixture.outputs.requestedImageUploadOrder, [
			'captures/ours-z87-absolute-dome.png',
			'captures/ours-z87-paper-normalized-swatch.png',
			'captures/ours-actual-sunset-absolute-dome.png',
			'captures/ours-actual-sunset-geographic-dome.png',
			diagnosticPath(fixture),
			'captures/ours-actual-sunset-paper-normalized-swatch.png',
			fixture.outputs.paperSwatchColumn,
			fixture.outputs.paperDomeColumn,
			fixture.outputs.decisionPlate,
		]),
		'CR4A nine-image browser upload order changed.',
	);
	requireCondition(
		diagnosticPath(fixture) === 'diagnostics/ours-actual-sunset-pre-display-luminance.png' &&
			fixture.outputs.luminanceDiagnostic.widthPixels === 256 &&
			fixture.outputs.luminanceDiagnostic.heightPixels === 256 &&
			fixture.outputs.compositeImages.length === 3,
		'CR4A diagnostic or composite-image declaration changed.',
	);
	const allPaths = [
		...requestedImagePaths(fixture),
		...fixture.outputs.rawFields.map(({path: artifactPath}) => artifactPath),
		fixture.outputs.sceneMeasurements,
	];
	requireCondition(
		allPaths.every((value) => typeof value === 'string' && value.length > 0) &&
			new Set(allPaths).size === allPaths.length,
		'CR4A output paths are invalid or duplicated.',
	);
	requireCondition(
		fixture.integrityGates.integrityOnly === true &&
			fixture.integrityGates.evaluateAfterAllRequestedImagesAreWritten === true &&
			fixture.claimBoundary.objectiveAccuracyClaim === false &&
			fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.similarityMetricGate === false &&
			fixture.claimBoundary.rmseGate === false,
		'CR4A integrity-only claim boundary changed.',
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

async function snapshotPaperParent(selector, fixture, includeBytes = false) {
	const declaredParent = fixture.parents.paperReferenceInventory;
	const parentDirectory = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
	const canonicalRunsRoot = await verifyOrdinaryCanonicalDirectory(COLOR_RESET_RUNS_ROOT, 'Color-reset runs root');
	const canonicalParent = await verifyOrdinaryCanonicalDirectory(parentDirectory, 'CR4A paper parent');
	assertLexicallyContained(canonicalRunsRoot, canonicalParent, 'CR4A paper parent');
	await assertNoReparseEntries(canonicalParent, 'CR4A paper parent');
	const verification = await verifyColorResetRun(canonicalParent);
	requireCondition(
		verification.verified === true &&
			verification.conclusion === 'accepted' &&
			verification.slug === 'paper-sunset-reference-inventory' &&
			verification.runId === declaredParent.runId &&
			verification.artifactCount === declaredParent.artifactCount &&
			verification.artifactBytes === declaredParent.artifactBytes &&
			verification.artifactSetSha256 === declaredParent.artifactSetSha256,
		'CR4A paper parent must be a terminal accepted paper-sunset-reference-inventory run.',
	);
	const manifestPath = path.join(canonicalParent, 'artifact-manifest.json');
	const [manifest, proof, inventory, panelIdentities] = await Promise.all([
		readJson(manifestPath),
		readJson(path.join(canonicalParent, 'evidence', 'proof.json')),
		readJson(path.join(canonicalParent, 'evidence', 'reference-inventory.json')),
		readJson(path.join(canonicalParent, 'evidence', 'panel-identities.json')),
	]);
	requireCondition(
		manifest.conclusion === 'accepted' &&
			manifest.artifactSetSha256 === verification.artifactSetSha256 &&
			(await sha256File(manifestPath)) === declaredParent.manifest.sha256,
		'CR4A paper parent manifest is not the independently verified accepted terminal state.',
	);
	requireCondition(
		proof.schemaId === 'algorithm32-color-reset-cr4a-paper-reference-proof-v1' &&
			proof.accepted === true &&
			proof.integrityPassed === true &&
			proof.paperOnly === true &&
			proof.appearanceAccepted === false &&
			proof.objectiveAccuracyClaim === false,
		'CR4A paper parent proof is not the accepted integrity-only paper inventory.',
	);
	requireCondition(
		inventory.schemaId === 'algorithm32-color-reset-cr4a-paper-reference-inventory-v1' &&
			(await sha256File(path.join(canonicalParent, ...declaredParent.referenceInventory.path.split('/')))) ===
				declaredParent.referenceInventory.sha256,
		'CR4A paper parent reference inventory identity changed.',
	);
	requireCondition(
		panelIdentities.schemaId === 'algorithm32-color-reset-cr4a-paper-panel-identities-v1' &&
			panelIdentities.paperPanels?.length === 17 &&
			(await sha256File(path.join(canonicalParent, ...declaredParent.panelIdentities.path.split('/')))) ===
				declaredParent.panelIdentities.sha256 &&
			(await sha256File(path.join(canonicalParent, ...declaredParent.proof.path.split('/')))) ===
				declaredParent.proof.sha256 &&
			(await sha256File(path.join(canonicalParent, ...declaredParent.imageDerivations.path.split('/')))) ===
				declaredParent.imageDerivations.sha256,
		'CR4A paper parent panel-identity inventory changed.',
	);
	const artifactByPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const identityByPath = new Map(panelIdentities.paperPanels.map((panel) => [panel.artifactPath, panel]));
	const panels = [];
	for (const declaration of paperDeclarations(fixture)) {
		const artifact = artifactByPath.get(declaration.artifactPath);
		const identity = identityByPath.get(declaration.artifactPath);
		requireCondition(
			artifact?.byteLength === declaration.byteLength &&
				artifact?.sha256 === declaration.sha256 &&
				identity?.byteLength === declaration.byteLength &&
				identity?.sha256 === declaration.sha256 &&
				identity?.modelId === declaration.modelId,
			`CR4A parent paper panel identity changed for ${declaration.artifactPath}.`,
		);
		const absolutePath = path.join(canonicalParent, ...declaration.artifactPath.split('/'));
		await assertExistingRealPathContained(
			canonicalParent,
			absolutePath,
			`CR4A parent paper panel ${declaration.artifactPath}`,
		);
		const bytes = await readFile(absolutePath);
		const png = pngFacts(bytes, `CR4A parent paper panel ${declaration.artifactPath}`);
		requireCondition(
			bytes.byteLength === declaration.byteLength &&
				sha256(bytes) === declaration.sha256 &&
				png.widthPixels === declaration.widthPixels &&
				png.heightPixels === declaration.heightPixels,
			`CR4A parent paper panel bytes changed for ${declaration.artifactPath}.`,
		);
		panels.push({declaration, png, ...(includeBytes ? {bytes} : {})});
	}
	const selectedPaths = [
		declaredParent.manifest.path,
		declaredParent.proof.path,
		declaredParent.referenceInventory.path,
		declaredParent.panelIdentities.path,
		declaredParent.imageDerivations.path,
		...declaredParent.copyArtifacts,
	];
	return {
		parentDirectory: canonicalParent,
		panels,
		evidence: {
			schemaId: 'algorithm32-color-reset-cr4a-paper-parent-snapshot-v1',
			runNamespace: 'color-reset',
			explicitSelector: selector,
			runId: verification.runId,
			repositoryRelativePath: portablePath(path.relative(REPOSITORY_ROOT, canonicalParent)),
			conclusion: verification.conclusion,
			manifestSha256: await sha256File(manifestPath),
			artifactSetSha256: verification.artifactSetSha256,
			artifactCount: verification.artifactCount,
			selectedArtifactInventory: await createSelectedFileInventory(canonicalParent, selectedPaths),
			paperPanelCount: panels.length,
		},
	};
}

function assertPaperParentUnchanged(before, after) {
	requireCondition(
		before.runId === after.runId &&
			before.conclusion === after.conclusion &&
			before.manifestSha256 === after.manifestSha256 &&
			before.artifactSetSha256 === after.artifactSetSha256,
		'CR4A paper parent terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR4A paper parent selected artifacts',
	);
}

async function materializePaperPanels(run, parent) {
	const records = [];
	for (const panel of parent.panels) {
		await run.writeArtifact(panel.declaration.artifactPath, panel.bytes);
		records.push({
			kind: 'byte-exact-copy-from-accepted-color-reset-parent',
			modelId: panel.declaration.modelId,
			modelLabel: panel.declaration.modelLabel,
			objectName: panel.declaration.objectName ?? null,
			artifactPath: panel.declaration.artifactPath,
			byteLength: panel.declaration.byteLength,
			sha256: panel.declaration.sha256,
			png: panel.png,
			parentRunId: parent.evidence.runId,
			parentArtifactPath: panel.declaration.artifactPath,
			completedAt: new Date().toISOString(),
		});
	}
	return records;
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR4A control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.fileCount === 147,
		'CR4A control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map((entry) => entry.path));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4A control snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4A snapshot and production closure');
	return {
		schemaId: 'algorithm32-color-reset-control-snapshot-verification-v1',
		accepted: true,
		manifestPath: 'experiments/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
		manifestSha256: manifestHash,
		inventory: snapshotInventory,
		productionSelection,
	};
}

async function captureRuntimeImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4a-native15-sunset-paper-visual-comparison.js',
			'color-reset/harness/cr4a-sunset-paper-visual-comparison-browser.js',
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
	const threeServedClosure = await buildStaticModuleClosure({
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
	requireCondition(threePackage.version === '0.180.0', 'CR4A requires locked Three 0.180.0.');
	return {
		schemaId: 'algorithm32-color-reset-cr4a-runtime-implementation-before-v1',
		implementation: {
			closure: implementationClosure,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, implementationClosure.files),
		},
		fixture: {
			path: FIXTURE_RELATIVE_PATH,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, [
				'color-reset/fixtures/cr4a-sunset-paper-visual-comparison-v1.json',
			]),
		},
		browserDependencies: {
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			servedClosure: threeServedClosure,
			servedInventory: await createSelectedFileInventory(THREE_ROOT, threeServedClosure.files),
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

async function captureRuntimeImplementationAfter(before) {
	return {
		schemaId: 'algorithm32-color-reset-cr4a-runtime-implementation-after-v1',
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementation.closure.files,
		),
		fixtureInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.fixture.inventory.files.map(({path: relativePath}) => relativePath),
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

function assertRuntimeImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR4A runtime implementation',
	);
	assertFileInventoriesEqual(before.fixture.inventory, after.fixtureInventory, 'CR4A fixture');
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR4A browser-served Three closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 === after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR4A package boundary changed during execution.',
	);
}

async function verifyPackageFile(packageDirectory, descriptor, label) {
	const target = path.join(packageDirectory, ...descriptor.path.split('/'));
	assertLexicallyContained(packageDirectory, target, label);
	const facts = await lstat(target);
	requireCondition(facts.isFile() && !facts.isSymbolicLink(), `${label} is not an ordinary file.`);
	requireCondition(facts.size === descriptor.byteLength, `${label} byte length changed.`);
	const digest = await sha256File(target);
	requireCondition(digest === descriptor.sha256, `${label} SHA-256 changed.`);
	return {path: descriptor.path, byteLength: facts.size, sha256: digest};
}

async function verifySelectedPackage(scene, resolution) {
	requireCondition(resolution.status === 'ready', `${scene.id} did not resolve a ready cache.`);
	requireCondition(
		resolution.representativeSolarZenithDegrees === scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} resolved the wrong one-degree cache bin.`,
	);
	requireCondition(resolution.asset.assetRoot.startsWith('/cache/'), `${scene.id} cache root is invalid.`);
	const packageRelativePath = resolution.asset.assetRoot.slice('/cache/'.length).replace(/\/$/u, '');
	const packageDirectory = path.join(CACHE_ROOT, ...packageRelativePath.split('/'));
	assertLexicallyContained(CACHE_ROOT, packageDirectory, `${scene.id} cache package`);
	await verifyOrdinaryCanonicalDirectory(packageDirectory, `${scene.id} cache package`);
	await assertNoReparseEntries(packageDirectory, `${scene.id} cache package`);
	const manifestRelativePath = resolution.asset.loadRequest.manifestPath;
	const manifestPath = path.join(packageDirectory, manifestRelativePath);
	assertLexicallyContained(packageDirectory, manifestPath, `${scene.id} cache manifest`);
	const manifestDigest = await sha256File(manifestPath);
	requireCondition(
		manifestDigest === resolution.asset.loadRequest.manifestSha256,
		`${scene.id} cache manifest SHA-256 changed.`,
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.cacheIdentity === resolution.asset.loadRequest.cacheIdentity &&
			manifest.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			manifest.selection?.representativeSolarZenithDegrees ===
				scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} exact Native15/Q30 cache identity changed.`,
	);
	const ledgerPath = path.join(packageDirectory, ...manifest.ledgerPath.split('/'));
	assertLexicallyContained(packageDirectory, ledgerPath, `${scene.id} cache ledger`);
	const ledgerFacts = await lstat(ledgerPath);
	requireCondition(ledgerFacts.isFile() && !ledgerFacts.isSymbolicLink(), `${scene.id} cache ledger is invalid.`);
	const ledgerDigest = await sha256File(ledgerPath);
	requireCondition(ledgerDigest === manifest.ledgerSha256, `${scene.id} cache ledger changed.`);
	const [exactSeamPayload, logicalToUniqueIndex] = await Promise.all([
		verifyPackageFile(packageDirectory, manifest.exactSeamPayload, `${scene.id} exact-seam payload`),
		verifyPackageFile(packageDirectory, manifest.logicalToUniqueIndex, `${scene.id} logical-to-unique index`),
	]);
	const selectedRelativePaths = [
		`${packageRelativePath}/${manifestRelativePath}`,
		`${packageRelativePath}/${manifest.ledgerPath}`,
		`${packageRelativePath}/${exactSeamPayload.path}`,
		`${packageRelativePath}/${logicalToUniqueIndex.path}`,
	];
	return {
		sceneId: scene.id,
		timeIso: scene.timeIso,
		status: 'ready',
		requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
		representativeSolarZenithDegrees: resolution.representativeSolarZenithDegrees,
		cacheIdentity: manifest.cacheIdentity,
		packageRelativePath,
		manifest: {path: manifestRelativePath, sha256: manifestDigest},
		ledger: {path: manifest.ledgerPath, byteLength: ledgerFacts.size, sha256: ledgerDigest},
		exactSeamPayload,
		logicalToUniqueIndex,
		numericalIdentity: manifest.numericalIdentity,
		selectedRelativePaths,
	};
}

function vectorMaximumAbsoluteDifference(left, right) {
	return Math.max(...left.map((value, index) => Math.abs(value - right[index])));
}

async function resolveAndVerifyCacheInputs(fixture) {
	await verifyOrdinaryCanonicalDirectory(CACHE_ROOT, 'CR4A runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const reportDigest = await sha256File(reportPath);
	requireCondition(reportDigest === PACKAGE_REPORT_SHA256, 'CR4A package report changed.');
	const report = await readJson(reportPath);
	requireCondition(
		report.schemaId === 'algorithm32-distant-sun-bin-covered-runtime-package-set-v1' &&
			report.accepted === true &&
			report.packageCount === 109,
		'CR4A package report is not the accepted 109-package inventory.',
	);
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR4A runtime catalog');
	const catalogDigest = await sha256File(catalogPath);
	requireCondition(
		catalogDigest === CATALOG_SHA256 && catalogDigest === report.catalogSha256,
		'CR4A runtime catalog changed.',
	);
	const catalog = await readJson(catalogPath);
	const scenes = [];
	const packages = [];
	for (const scene of fixture.scenes.filter(({renderInThisControl}) => renderInThisControl)) {
		const observation = {
			instant: scene.timeIso,
			location: {
				latitude: {value: fixture.location.latitudeDegrees, units: 'degrees'},
				longitude: {value: fixture.location.longitudeDegrees, units: 'degrees'},
			},
		};
		const sceneState = createDistantSunSceneState({
			observation,
			observerHeight: {value: fixture.location.observerAltitudeMeters, units: 'meters'},
			observerUpDirection: [0, 0, 1],
		});
		requireCondition(
			Math.abs(sceneState.solarZenithDegrees - scene.solarZenithDegrees) <= 1e-9,
			`${scene.id} recomputed solar zenith changed.`,
		);
		requireCondition(
			vectorMaximumAbsoluteDifference(sceneState.directionToSourceModel, scene.directionToSourceLocal) <= 1e-12,
			`${scene.id} recomputed source direction changed.`,
		);
		const resolution = resolveDistantSunSceneCache(catalog, sceneState.solarZenithDegrees, '/cache/');
		const verifiedPackage = await verifySelectedPackage(scene, resolution);
		packages.push(verifiedPackage);
		scenes.push({
			...scene,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			cacheStatus: 'ready',
			cacheIdentity: resolution.asset.loadRequest.cacheIdentity,
			sceneCacheAsset: resolution.asset,
		});
	}
	requireCondition(
		exactJson(
			packages.map(({representativeSolarZenithDegrees}) => representativeSolarZenithDegrees),
			[87, 90],
		),
		'CR4A must select only the z87 and actual-sunset z90 packages.',
	);
	const selectedRelativePaths = [
		'package-report.json',
		report.catalogPath,
		...packages.flatMap((entry) => entry.selectedRelativePaths),
	];
	const selectedInventory = await createSelectedFileInventory(CACHE_ROOT, selectedRelativePaths);
	return {
		scenes,
		selectedRelativePaths,
		evidence: {
			schemaId: 'algorithm32-color-reset-cr4a-cache-input-verification-v1',
			accepted: true,
			packageRoot: CACHE_RELATIVE_ROOT,
			packageReport: {path: 'package-report.json', sha256: reportDigest},
			catalog: {path: report.catalogPath, sha256: catalogDigest},
			packages: packages.map(({selectedRelativePaths: ignored, ...entry}) => entry),
			selections: packages.map(({sceneId, representativeSolarZenithDegrees, cacheIdentity}) => ({
				sceneId,
				representativeSolarZenithDegrees,
				cacheIdentity,
			})),
			selectedInventory,
		},
	};
}

function makeBrowserConfiguration(fixture, resolvedScenes) {
	const resolvedById = new Map(resolvedScenes.map((scene) => [scene.id, scene]));
	return {
		...fixture,
		scenes: fixture.scenes.map((scene) => {
			if (!scene.renderInThisControl) return scene;
			const resolved = resolvedById.get(scene.id);
			requireCondition(resolved, `CR4A browser cache selection is missing ${scene.id}.`);
			return resolved;
		}),
	};
}

function attachUploadIdentities(browser) {
	return {
		...browser.result,
		uploads: browser.uploads,
		progressEvents: browser.progressEvents,
		requests: browser.requests,
		serverErrors: browser.serverErrors,
		runtimeEnvironment: browser.runtimeEnvironment,
	};
}

async function verifyPng(runDirectory, declaration) {
	const absolutePath = path.join(runDirectory, ...declaration.artifactPath.split('/'));
	await assertExistingRealPathContained(runDirectory, absolutePath, `CR4A image ${declaration.artifactPath}`);
	const bytes = await readFile(absolutePath);
	const png = pngFacts(bytes, `CR4A image ${declaration.artifactPath}`);
	requireCondition(
		png.widthPixels === declaration.widthPixels &&
			png.heightPixels === declaration.heightPixels &&
			png.bitDepthPerComponent === 8 &&
			(png.colorType === 2 || png.colorType === 6),
		`CR4A image contract changed for ${declaration.artifactPath}.`,
	);
	if (declaration.sha256) {
		requireCondition(
			bytes.byteLength === declaration.byteLength && sha256(bytes) === declaration.sha256,
			`CR4A exact image copy changed for ${declaration.artifactPath}.`,
		);
	}
	return {
		artifactPath: declaration.artifactPath,
		byteLength: bytes.byteLength,
		sha256: sha256(bytes),
		png,
	};
}

async function verifyAllImages(run, fixture, paperPanels, browserAnalysis) {
	const compositeByPath = new Map(fixture.outputs.compositeImages.map((image) => [image.path, image]));
	const declarations = [
		...paperPanels.map((panel) => ({
			artifactPath: panel.artifactPath,
			widthPixels: panel.png.widthPixels,
			heightPixels: panel.png.heightPixels,
			byteLength: panel.byteLength,
			sha256: panel.sha256,
		})),
		...fixture.outputs.oursCleanPanels.map((image) => ({
			artifactPath: image.path,
			widthPixels: image.widthPixels,
			heightPixels: image.heightPixels,
		})),
		{
			artifactPath: diagnosticPath(fixture),
			widthPixels: fixture.outputs.luminanceDiagnostic.widthPixels,
			heightPixels: fixture.outputs.luminanceDiagnostic.heightPixels,
		},
		{
			artifactPath: fixture.outputs.paperSwatchColumn,
			widthPixels: compositeByPath.get(fixture.outputs.paperSwatchColumn).widthPixels,
			heightPixels: compositeByPath.get(fixture.outputs.paperSwatchColumn).heightPixels,
		},
		{
			artifactPath: fixture.outputs.paperDomeColumn,
			widthPixels: compositeByPath.get(fixture.outputs.paperDomeColumn).widthPixels,
			heightPixels: compositeByPath.get(fixture.outputs.paperDomeColumn).heightPixels,
		},
		{
			artifactPath: fixture.outputs.decisionPlate,
			widthPixels: compositeByPath.get(fixture.outputs.decisionPlate).widthPixels,
			heightPixels: compositeByPath.get(fixture.outputs.decisionPlate).heightPixels,
		},
	];
	requireCondition(
		browserAnalysis.columns.swatch.width === compositeByPath.get(fixture.outputs.paperSwatchColumn).widthPixels &&
			browserAnalysis.columns.swatch.height ===
				compositeByPath.get(fixture.outputs.paperSwatchColumn).heightPixels &&
			browserAnalysis.columns.dome.width === compositeByPath.get(fixture.outputs.paperDomeColumn).widthPixels &&
			browserAnalysis.columns.dome.height === compositeByPath.get(fixture.outputs.paperDomeColumn).heightPixels &&
			browserAnalysis.columns.decisionPlate.width ===
				compositeByPath.get(fixture.outputs.decisionPlate).widthPixels &&
			browserAnalysis.columns.decisionPlate.height ===
				compositeByPath.get(fixture.outputs.decisionPlate).heightPixels,
		'CR4A browser composite dimensions differ from the frozen fixture.',
	);
	requireCondition(declarations.length === 26, 'CR4A must validate exactly 26 requested PNGs.');
	const records = [];
	for (const declaration of declarations) records.push(await verifyPng(run.runDirectory, declaration));
	requireCondition(
		exactJson(
			records.map(({artifactPath}) => artifactPath),
			requestedImagePaths(fixture),
		),
		'CR4A requested image verification order changed.',
	);
	return records;
}

async function verifyRawFields(run, fixture, browserAnalysis, browserUploads) {
	const sceneById = new Map(browserAnalysis.sceneMeasurements.scenes.map((scene) => [scene.sceneId, scene]));
	const uploadByPath = new Map(browserUploads.map((upload) => [upload.path, upload]));
	const records = [];
	for (const declaration of fixture.outputs.rawFields) {
		const contract = RAW_FIELD_CONTRACTS[declaration.id];
		const scene = sceneById.get(contract.sceneId);
		const image = scene?.images?.[contract.imageKey];
		const upload = uploadByPath.get(declaration.path);
		const expectedByteLength = contract.directionCount * NATIVE15_CHANNEL_COUNT * FLOAT32_BYTE_LENGTH;
		requireCondition(
			image?.directionCount === contract.directionCount &&
				image.transport?.implementationId === EXPECTED_TRANSPORT_ID &&
				image.transport?.batchCapacity === EXPECTED_TRANSPORT_BATCH_CAPACITY &&
				image.transport?.batchCount === Math.ceil(contract.directionCount / image.transport.batchCapacity) &&
				upload?.byteLength === expectedByteLength &&
				upload?.sha256 === image.hashes?.pathRadianceNative15F32,
			`CR4A raw Native15 field identity changed for ${declaration.id}.`,
		);
		const absolutePath = path.join(run.runDirectory, ...declaration.path.split('/'));
		await assertExistingRealPathContained(run.runDirectory, absolutePath, `CR4A raw field ${declaration.id}`);
		requireCondition((await sha256File(absolutePath)) === upload.sha256, `${declaration.id} run bytes changed.`);
		records.push({
			id: declaration.id,
			artifactPath: declaration.path,
			layout: declaration.layout,
			scalarType: 'float32',
			channelCount: NATIVE15_CHANNEL_COUNT,
			directionCount: contract.directionCount,
			valueCount: contract.directionCount * NATIVE15_CHANNEL_COUNT,
			byteLength: upload.byteLength,
			sha256: upload.sha256,
			completedAt: upload.completedAt,
			transport: image.transport,
			fieldHash: image.hashes.pathRadianceNative15F32,
			projectionId: image.projectionId,
			basisHash: image.basisHash,
			projectionIdE8: image.projectionIdE8,
			hashes: image.hashes,
			statistics: image.statistics.pathRadiance,
			imageDerivation: image.derivation,
		});
	}
	return records;
}

function imageIdentityMap(images) {
	return new Map(images.map((image) => [image.artifactPath, image]));
}

function uploadIdentityMap(uploads) {
	return new Map(uploads.map((upload) => [upload.path, upload]));
}

function makeReferenceInventory(fixture, parentEvidence, paperPanels, verifiedImages) {
	const byPath = imageIdentityMap(verifiedImages);
	return {
		schemaId: 'algorithm32-color-reset-cr4a-native15-paper-reference-inventory-v1',
		claimBoundary: fixture.claimBoundary,
		parent: parentEvidence,
		paperPanels: paperPanels.map((panel) => ({
			...panel,
			resultIdentity: byPath.get(panel.artifactPath),
		})),
		copyArtifactOrder: paperPanels.map(({artifactPath}) => artifactPath),
	};
}

function makePanelIdentities(fixture, verifiedImages, rawFields, browserUploads) {
	const uploads = uploadIdentityMap(browserUploads);
	return {
		schemaId: 'algorithm32-color-reset-cr4a-native15-panel-identities-v1',
		images: verifiedImages.map((image) => ({
			...image,
			completedAt: uploads.get(image.artifactPath)?.completedAt ?? null,
		})),
		rawFields,
		measurements: uploads.get(fixture.outputs.sceneMeasurements),
	};
}

function makeImageDerivations(
	fixture,
	parentEvidence,
	paperPanels,
	verifiedImages,
	rawFields,
	browserAnalysis,
	cacheEvidence,
	implementationBefore,
) {
	const byPath = imageIdentityMap(verifiedImages);
	const rawById = new Map(rawFields.map((field) => [field.id, field]));
	const implementationIdentity = {
		aggregateSha256: implementationBefore.implementation.inventory.aggregateSha256,
		files: implementationBefore.implementation.inventory.files,
	};
	const runnerIdentity = implementationBefore.implementation.inventory.files.find(
		({path: relativePath}) =>
			relativePath === 'color-reset/runners/run-cr4a-native15-sunset-paper-visual-comparison.js',
	);
	requireCondition(runnerIdentity, 'CR4A runner implementation identity is missing.');
	const images = paperPanels.map((panel) => ({
		artifactPath: panel.artifactPath,
		parentInputs: [
			{
				runNamespace: 'color-reset',
				runId: parentEvidence.runId,
				artifactPath: panel.parentArtifactPath,
				byteLength: panel.byteLength,
				sha256: panel.sha256,
			},
		],
		operation: 'Copy the exact authenticated PNG bytes from the explicit accepted paper-parent run.',
		implementation: {runner: runnerIdentity, operation: 'ImmutableRunRecord.writeArtifact'},
		materialParameters: {transformation: null, decode: false, resample: false},
		resultIdentity: byPath.get(panel.artifactPath),
	}));
	const rawForImage = new Map([
		['z87-normalized-swatch', 'z87-aligned-swatch'],
		['actual-sunset-normalized-swatch', 'actual-sunset-aligned-swatch'],
		['z87-absolute-dome', 'z87-aligned-dome'],
		['actual-sunset-absolute-dome', 'actual-sunset-aligned-dome'],
		['actual-sunset-geographic-dome', 'actual-sunset-geographic-dome'],
	]);
	for (const declaration of fixture.outputs.oursCleanPanels) {
		const raw = rawById.get(rawForImage.get(declaration.id));
		const rawContract = RAW_FIELD_CONTRACTS[raw.id];
		const sceneMeasurement = browserAnalysis.sceneMeasurements.scenes.find(
			({sceneId}) => sceneId === rawContract.sceneId,
		);
		images.push({
			artifactPath: declaration.path,
			parentInputs: [raw, cacheEvidence.selections.find(({sceneId}) => sceneId === rawContract.sceneId)],
			operation: declaration.id.endsWith('normalized-swatch')
				? 'Project Q30 Native15 path radiance through the production Bruneton linear-sRGB rows, apply one scene-wide 36 W/m^2 diffuse-sky normalization, replace the direct solar disk with transmitted direct radiance under the same scale, apply the Bruneton exponential display equation, then deterministic Figure 9 Floyd-Steinberg RGB8 diffusion.'
				: 'Project Q30 Native15 path radiance through the production Bruneton linear-sRGB rows, apply no normalization or direct disk, then apply the unchanged Bruneton exponential display equation and current Uint8 quantization.',
			implementation: implementationIdentity,
			materialParameters: {
				renderContract: declaration.id.endsWith('normalized-swatch')
					? fixture.renderContracts.normalizedSwatches
					: fixture.renderContracts.absoluteDomes,
				browserRuntime: browserAnalysis.runtimeEnvironment,
				sceneMeasurement,
			},
			resultIdentity: byPath.get(declaration.path),
		});
	}
	images.push({
		artifactPath: diagnosticPath(fixture),
		parentInputs: [rawById.get('actual-sunset-aligned-dome')],
		operation:
			'Project the actual-sunset aligned Native15 dome to pre-display linear sRGB, compute Rec.709 luminance, and encode the fixed -6 to +5 log10 cd/m^2 false-color diagnostic.',
		implementation: implementationIdentity,
		materialParameters: fixture.renderContracts.luminanceDiagnostic,
		resultIdentity: byPath.get(diagnosticPath(fixture)),
	});
	for (const artifactPath of [
		fixture.outputs.paperSwatchColumn,
		fixture.outputs.paperDomeColumn,
		fixture.outputs.decisionPlate,
	]) {
		images.push({
			artifactPath,
			parentInputs:
				artifactPath === fixture.outputs.paperSwatchColumn
					? [
							...fixture.outputs.paperSwatchPanels.map((value) => byPath.get(value)),
							...fixture.outputs.oursCleanPanels
								.filter(({id}) => id.endsWith('normalized-swatch'))
								.map(({path: value}) => byPath.get(value)),
						]
					: artifactPath === fixture.outputs.paperDomeColumn
						? [
								...fixture.outputs.paperDomePanels.map((value) => byPath.get(value)),
								byPath.get('captures/ours-z87-absolute-dome.png'),
								byPath.get('captures/ours-actual-sunset-absolute-dome.png'),
							]
						: [
								byPath.get('reference/figure9-sunrise-bruneton.png'),
								byPath.get('reference/figure1-z87-bruneton.png'),
								...fixture.outputs.oursCleanPanels
									.filter(({id}) => id !== 'actual-sunset-geographic-dome')
									.map(({path: value}) => byPath.get(value)),
								byPath.get(diagnosticPath(fixture)),
							],
			operation:
				'Compose authenticated decoded panels and external labels on integer Canvas2D coordinates without changing any paper source pixels; encode the complete qualitative plate as PNG.',
			implementation: implementationIdentity,
			materialParameters: {claimBoundary: fixture.claimBoundary, numericalComparison: null},
			resultIdentity: byPath.get(artifactPath),
		});
	}
	const rawDerivations = rawFields.map((field) => ({
		artifactPath: field.artifactPath,
		parentInputs: [cacheEvidence.selections.find(({sceneId}) => sceneId === RAW_FIELD_CONTRACTS[field.id].sceneId)],
		operation:
			'Sample the exact installed scene cache for the declared arbitrary projection directions with unchanged Q30 quadratic-near-observer camera-path transport; serialize direction-major Native15 Float32 readback bytes.',
		implementation: implementationIdentity,
		materialParameters: {
			directionCount: field.directionCount,
			channelCount: field.channelCount,
			layout: field.layout,
			projectionId: field.projectionId,
			basisHash: field.basisHash,
			projectionIdE8: field.projectionIdE8,
			hashes: field.hashes,
			transport: field.transport,
		},
		resultIdentity: {
			artifactPath: field.artifactPath,
			byteLength: field.byteLength,
			sha256: field.sha256,
		},
	}));
	return {
		schemaId: 'algorithm32-color-reset-cr4a-native15-image-derivations-v1',
		claimBoundary: fixture.claimBoundary,
		images,
		rawFields: rawDerivations,
	};
}

function elapsedMilliseconds(start, end) {
	return Date.parse(end) - Date.parse(start);
}

function makeProgress(run, fixture, paperPanels, browser) {
	const uploads = uploadIdentityMap(browser.uploads);
	const firstPaper = paperPanels[0];
	const firstBrowserImage = browser.uploads.find((upload) => requestedImagePaths(fixture).includes(upload.path));
	const decisionPlate = uploads.get(fixture.outputs.decisionPlate);
	const lastRequestedImage = browser.uploads
		.filter((upload) => requestedImagePaths(fixture).includes(upload.path))
		.at(-1);
	requireCondition(
		firstPaper && firstBrowserImage && decisionPlate && lastRequestedImage,
		'CR4A progress artifacts are incomplete.',
	);
	return {
		schemaId: 'algorithm32-color-reset-cr4a-native15-progress-v1',
		initializedAt: run.initializedAt,
		firstRequestedImage: {
			artifactPath: firstPaper.artifactPath,
			completedAt: firstPaper.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstPaper.completedAt),
			targetMilliseconds: 180000,
		},
		firstAlgorithm32Image: {
			artifactPath: firstBrowserImage.path,
			completedAt: firstBrowserImage.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstBrowserImage.completedAt),
			targetMilliseconds: 600000,
		},
		decisionPlate: {
			artifactPath: decisionPlate.path,
			completedAt: decisionPlate.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, decisionPlate.completedAt),
			targetMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
		},
		allRequestedImages: {
			count: requestedImagePaths(fixture).length,
			completedAt: lastRequestedImage.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, lastRequestedImage.completedAt),
		},
		browserEvents: browser.progressEvents,
	};
}

function finiteNonnegativeValues(values, expectedLength) {
	return (
		Array.isArray(values) &&
		values.length === expectedLength &&
		values.every((value) => Number.isFinite(value) && value >= 0)
	);
}

function evaluateIntegrityGates({
	fixture,
	parentBefore,
	parentAfter,
	cacheInputs,
	cacheAfter,
	controlSnapshot,
	paperPanels,
	browser,
	browserAnalysis,
	verifiedImages,
	rawFields,
	progress,
	gateEvaluationStartedAt,
}) {
	const expectedUploads = expectedBrowserUploadOrder(fixture);
	const imagePaths = requestedImagePaths(fixture);
	const imageByPath = imageIdentityMap(verifiedImages);
	const sceneMeasurements = browserAnalysis.sceneMeasurements;
	const sceneById = new Map(sceneMeasurements.scenes.map((scene) => [scene.sceneId, scene]));
	const allCompletionTimes = [
		...paperPanels.map(({completedAt}) => completedAt),
		...browser.uploads.map(({completedAt}) => completedAt),
	];
	const gates = {
		fixtureIdentityPinned:
			fixture.schemaId === 'algorithm32-color-reset-cr4a-sunset-paper-visual-comparison-input-v1',
		integrityOnlyScope:
			fixture.integrityGates.integrityOnly === true &&
			fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.rmseGate === false &&
			fixture.claimBoundary.similarityMetricGate === false,
		explicitAcceptedPaperParent:
			parentBefore.runId === parentAfter.runId &&
			parentBefore.conclusion === 'accepted' &&
			parentBefore.artifactSetSha256 === parentAfter.artifactSetSha256,
		exactSeventeenPaperCopies:
			paperPanels.length === 17 &&
			paperPanels.every((panel) => {
				const image = imageByPath.get(panel.artifactPath);
				return image?.byteLength === panel.byteLength && image?.sha256 === panel.sha256;
			}),
		controlSnapshotPinned: controlSnapshot.accepted === true,
		onlyZ87AndZ90ExactCachesSelected:
			exactJson(
				cacheInputs.evidence.selections.map(
					({representativeSolarZenithDegrees}) => representativeSolarZenithDegrees,
				),
				[87, 90],
			) &&
			cacheInputs.evidence.packages.every(
				(cachePackage) => cachePackage.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY,
			),
		selectedRuntimeInputsUnchanged:
			cacheInputs.evidence.selectedInventory.aggregateSha256 === cacheAfter.aggregateSha256,
		browserResultSchema:
			browserAnalysis.schemaId === 'algorithm32-color-reset-cr4a-browser-result-v1' &&
			browserAnalysis.renderComplete === true &&
			browserAnalysis.integrityGateEvaluated === false &&
			browserAnalysis.appearanceAccepted === false &&
			browserAnalysis.claim ===
				'complete qualitative-comparison image acquisition; gate evaluation remains runner-owned',
		allDeclaredBrowserUploadsWritten:
			browser.uploads.length === expectedUploads.length &&
			exactJson(
				browser.uploads.map(({path: artifactPath}) => artifactPath),
				expectedUploads,
			) &&
			exactJson(browserAnalysis.imageUploadOrder, fixture.outputs.requestedImageUploadOrder) &&
			exactJson(
				browserAnalysis.rawFieldUploadOrder,
				fixture.outputs.rawFields.map(({path: artifactPath}) => artifactPath),
			) &&
			browserAnalysis.requestedImageCount === 9 &&
			browserAnalysis.uploadedImageCount === 9,
		allTwentySixPngsDecoded:
			verifiedImages.length === 26 &&
			exactJson(
				verifiedImages.map(({artifactPath}) => artifactPath),
				imagePaths,
			),
		allFiveNative15FieldsAuthenticated:
			rawFields.length === 5 &&
			rawFields.every(
				(field) =>
					field.byteLength === field.directionCount * NATIVE15_CHANNEL_COUNT * FLOAT32_BYTE_LENGTH &&
					field.sha256 === field.fieldHash &&
					field.transport.implementationId === EXPECTED_TRANSPORT_ID &&
					field.transport.batchCapacity === EXPECTED_TRANSPORT_BATCH_CAPACITY,
			),
		exactNative15SceneMeasurements:
			sceneMeasurements.schemaId === 'algorithm32-color-reset-cr4a-native15-scene-measurements-v1' &&
			exactJson(
				sceneMeasurements.scenes.map(({sceneId}) => sceneId),
				['z87-bridge', 'actual-sunset'],
			) &&
			[...sceneById.values()].every(
				(scene) =>
					scene.contextLost === false &&
					scene.webglErrors.length === 0 &&
					finiteNonnegativeValues(
						scene.measurement.spectralDiffuseHorizontalIrradiance,
						NATIVE15_CHANNEL_COUNT,
					) &&
					Number.isFinite(scene.measurement.integratedDiffuseHorizontalWattsPerSquareMeter) &&
					scene.measurement.integratedDiffuseHorizontalWattsPerSquareMeter > 0,
			),
		firstImageProgressEvent: browser.progressEvents.some(({stage}) => stage === 'first-image'),
		decisionPlateProgressEvent: browser.progressEvents.some(({stage}) => stage === 'decision-plate'),
		progressRecorded:
			progress.firstRequestedImage.elapsedMilliseconds >= 0 &&
			progress.firstAlgorithm32Image.elapsedMilliseconds >= 0 &&
			progress.decisionPlate.elapsedMilliseconds >= 0,
		allRequestedOutputsPrecedeGates: allCompletionTimes.every(
			(completedAt) => Date.parse(completedAt) <= Date.parse(gateEvaluationStartedAt),
		),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		noPaperMetricOrAppearanceDecision:
			!('metrics' in browserAnalysis) &&
			!('rmse' in browserAnalysis) &&
			fixture.claimBoundary.objectiveAccuracyClaim === false,
	};
	return {gates, accepted: Object.values(gates).every(Boolean)};
}

async function failureProgress(run, fixture, error) {
	const browserEvidence = error?.browserEvidence;
	const uploads = browserEvidence?.uploads ?? [];
	return {
		schemaId: 'algorithm32-color-reset-cr4a-native15-progress-v1',
		initializedAt: run.initializedAt,
		failedAt: new Date().toISOString(),
		completedUploads: uploads,
		completedRequestedImageCount: uploads.filter((upload) => requestedImagePaths(fixture).includes(upload.path))
			.length,
		error: error instanceof Error ? error.message : String(error),
	};
}

async function main() {
	if (process.argv.length !== 3 || process.argv[2].trim() === '') {
		throw new Error('Usage: ' + COMMAND_PREFIX + ' <explicit-accepted-paper-parent-run-id-or-contained-path>');
	}
	const parentSelector = process.argv[2];
	const fixture = await readJson(FIXTURE_PATH);
	const command = `${COMMAND_PREFIX} ${JSON.stringify(parentSelector)}`;
	const run = await initializeColorResetRunRecord({
		slug: 'native15-sunset-paper-visual-comparison',
		command,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-inputs-v1',
			increment: 'CR4A-native15-sunset-paper-visual-comparison',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitPaperParentSelector: parentSelector,
			renderScenes: EXPECTED_RENDER_SCENES,
			cacheBins: [87, 90],
			requestedImages: requestedImagePaths(fixture),
			rawFields: fixture.outputs.rawFields,
			claimBoundary: fixture.claimBoundary,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-provenance-v1',
			operation:
				'Authenticate and byte-copy 17 paper panels from one explicit accepted color-reset parent, render z87 and actual San Jose sunset with their exact Native15/Q30 caches, and compose labeled qualitative paper-reference columns.',
			implementation: [
				'experiments/extraterrestrial/color-reset/runners/run-cr4a-native15-sunset-paper-visual-comparison.js',
				'experiments/extraterrestrial/color-reset/harness/cr4a-sunset-paper-visual-comparison-browser.js',
				'experiments/extraterrestrial/color-reset/rendering/Native15BatchedSkyTransportSampler.js',
				'experiments/extraterrestrial/color-reset/rendering/Native15SkyImageRenderer.js',
				'experiments/extraterrestrial/color-reset/rendering/PaperSkyImageProjection.js',
			],
			transformations: [
				'byte-exact accepted-parent paper-panel copy',
				'exact Q30 arbitrary-direction Native15 transport',
				'production Bruneton Native15 linear-sRGB projection',
				'exact Figure 1 and Figure 9 raster contracts',
				'labeled Canvas2D qualitative composition',
			],
			exclusions: [
				'no paper pixel RMSE',
				'no paper similarity or resemblance score',
				'no model ranking',
				'no appearance acceptance',
				'no production promotion',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-references-v1',
			paperParent: {
				runNamespace: 'color-reset',
				explicitSelector: parentSelector,
			},
			paper: fixture.paper.paperUrl,
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
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
	let cacheInputs = null;
	let cacheAfter = null;
	let paperPanels = [];
	let browser = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4A color-reset implementation');
		requireCondition(
			(await sha256File(FIXTURE_PATH)) === FIXTURE_SHA256,
			'CR4A fixture changed after predeclaration.',
		);
		requireCondition(
			(await sha256File(BROWSER_HARNESS_PATH)) === BROWSER_HARNESS_SHA256,
			'CR4A browser harness changed after predeclaration.',
		);
		requireCondition(
			(await sha256File(SKY_IMAGE_RENDERER_PATH)) === SKY_IMAGE_RENDERER_SHA256,
			'CR4A Native15 sky-image renderer changed after predeclaration.',
		);
		verifyFixtureContract(fixture);

		implementationBefore = await captureRuntimeImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		const controlSnapshot = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-verification.json', controlSnapshot);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-inputs-before.json', {
			schemaId: 'algorithm32-color-reset-cr4a-protected-inputs-before-v1',
			productionSource: protectedBefore,
		});

		const loadedParent = await snapshotPaperParent(parentSelector, fixture, true);
		parentBefore = loadedParent.evidence;
		await run.writeJsonArtifact('evidence/paper-parent-before.json', parentBefore);
		cacheInputs = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-inputs-before.json', cacheInputs.evidence);
		paperPanels = await materializePaperPanels(run, loadedParent);

		await run.writeJsonArtifact(
			'browser/configuration.json',
			makeBrowserConfiguration(fixture, cacheInputs.scenes),
		);
		browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4a-sunset-paper-visual-comparison-browser.js',
			exportName: 'runCr4aSunsetPaperVisualComparison',
			servedRoots: {'/cache/': CACHE_ROOT, '/run/': run.runDirectory},
			importMap: implementationBefore.browserDependencies.importMap,
			allowedArtifactPaths: browserUploadPaths(fixture),
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
		});

		const browserAnalysis = attachUploadIdentities(browser);
		requireCondition(
			browserAnalysis.schemaId === 'algorithm32-color-reset-cr4a-browser-result-v1',
			'CR4A browser returned an unexpected result schema.',
		);
		const verifiedImages = await verifyAllImages(run, fixture, paperPanels, browserAnalysis);
		const rawFields = await verifyRawFields(run, fixture, browserAnalysis, browser.uploads);
		const measurementUpload = browser.uploads.find(
			({path: artifactPath}) => artifactPath === fixture.outputs.sceneMeasurements,
		);
		requireCondition(measurementUpload, 'CR4A scene-measurement upload is missing.');
		const expectedMeasurementBytes = Buffer.from(JSON.stringify(browserAnalysis.sceneMeasurements, null, 2) + '\n');
		requireCondition(
			measurementUpload.byteLength === expectedMeasurementBytes.byteLength &&
				measurementUpload.sha256 === sha256(expectedMeasurementBytes),
			'CR4A uploaded scene measurements differ from the returned browser record.',
		);

		await run.writeJsonArtifact(
			fixture.outputs.referenceInventory,
			makeReferenceInventory(fixture, parentBefore, paperPanels, verifiedImages),
		);
		await run.writeJsonArtifact(
			fixture.outputs.panelIdentities,
			makePanelIdentities(fixture, verifiedImages, rawFields, browser.uploads),
		);
		await run.writeJsonArtifact(
			fixture.outputs.imageDerivations,
			makeImageDerivations(
				fixture,
				parentBefore,
				paperPanels,
				verifiedImages,
				rawFields,
				browserAnalysis,
				cacheInputs.evidence,
				implementationBefore,
			),
		);
		await run.writeJsonArtifact(fixture.outputs.analysis, {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-analysis-v1',
			acceptedForIntegrityEvaluation: true,
			appearanceAccepted: false,
			objectiveAccuracyClaim: false,
			paperSimilarityMetric: null,
			fixture: {path: FIXTURE_RELATIVE_PATH, sha256: FIXTURE_SHA256},
			claimBoundary: fixture.claimBoundary,
			paperParent: parentBefore,
			cacheSelections: cacheInputs.evidence.selections,
			browser: browserAnalysis,
			verifiedImages,
			rawFields,
		});

		implementationAfter = await captureRuntimeImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertRuntimeImplementationUnchanged(implementationBefore, implementationAfter);
		parentAfter = (await snapshotPaperParent(parentSelector, fixture, false)).evidence;
		await run.writeJsonArtifact('evidence/paper-parent-after.json', parentAfter);
		assertPaperParentUnchanged(parentBefore, parentAfter);
		cacheAfter = await createSelectedFileInventory(CACHE_ROOT, cacheInputs.selectedRelativePaths);
		await run.writeJsonArtifact('evidence/cache-inputs-after.json', {
			schemaId: 'algorithm32-color-reset-cr4a-cache-inputs-after-v1',
			selectedInventory: cacheAfter,
		});
		assertFileInventoriesEqual(
			cacheInputs.evidence.selectedInventory,
			cacheAfter,
			'CR4A selected runtime cache inputs',
		);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-inputs-after.json', {
			schemaId: 'algorithm32-color-reset-cr4a-protected-inputs-after-v1',
			productionSource: protectedAfter,
		});
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR4A protected Algorithm32 source',
		);
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4A protected Flat32 source');

		const progress = makeProgress(run, fixture, paperPanels, browser);
		await run.writeJsonArtifact(fixture.outputs.progress, progress);
		progressWritten = true;
		const gateEvaluationStartedAt = new Date().toISOString();
		const decision = evaluateIntegrityGates({
			fixture,
			parentBefore,
			parentAfter,
			cacheInputs,
			cacheAfter,
			controlSnapshot,
			paperPanels,
			browser,
			browserAnalysis,
			verifiedImages,
			rawFields,
			progress,
			gateEvaluationStartedAt,
		});
		const conclusion = decision.accepted ? 'accepted' : 'failed';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.accepted,
			appearanceAccepted: false,
			objectiveAccuracyClaim: false,
			paperSimilarityMetric: null,
			gateEvaluationStartedAt,
			gates: decision.gates,
			claimBoundary: fixture.claimBoundary,
			paperParent: {
				runNamespace: 'color-reset',
				runId: parentBefore.runId,
				artifactSetSha256: parentBefore.artifactSetSha256,
				manifestSha256: parentBefore.manifestSha256,
			},
			cacheSelections: cacheInputs.evidence.selections,
			outputs: {images: verifiedImages, rawFields, sceneMeasurements: measurementUpload},
			progress,
			paperParentUnchanged: true,
			implementationUnchanged: true,
			protectedProductionInputsUnchanged: true,
			selectedRuntimeCacheInputsUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4A Native15 sunset paper visual comparison`,
			'',
			`Conclusion: **${conclusion}** (integrity only).`,
			'',
			'All 17 exact paper panels, five current Native15/Q30 panels, the luminance diagnostic, three labeled figures, and five raw Native15 fields were written before integrity gates were evaluated.',
			'',
			`Explicit paper parent: color-reset/${parentBefore.runId} (${parentBefore.artifactSetSha256}).`,
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'This run makes no paper-image RMSE, similarity, resemblance, model-ranking, measurement-equivalence, appearance-acceptance, objective-accuracy, or production-promotion claim.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					paperParentRunId: parentBefore.runId,
					imageCount: verifiedImages.length,
					rawFieldCount: rawFields.length,
					gates: decision.gates,
					progress,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			const audits = {
				implementation: {
					beforeRecorded: implementationBefore !== null,
					afterRecorded: implementationAfter !== null,
					matches: null,
				},
				paperParent: {
					beforeRecorded: parentBefore !== null,
					afterRecorded: parentAfter !== null,
					matches: null,
				},
				selectedRuntimeCache: {
					beforeRecorded: cacheInputs !== null,
					afterRecorded: cacheAfter !== null,
					matches: null,
				},
				protectedProduction: {
					beforeRecorded: protectedBefore !== null,
					afterRecorded: protectedAfter !== null,
					matches: null,
				},
			};
			if (implementationBefore) {
				try {
					if (!implementationAfter) {
						implementationAfter = await captureRuntimeImplementationAfter(implementationBefore);
						await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
						audits.implementation.afterRecorded = true;
					}
					assertRuntimeImplementationUnchanged(implementationBefore, implementationAfter);
					audits.implementation.matches = true;
				} catch (auditError) {
					audits.implementation.matches = false;
					audits.implementation.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (parentBefore) {
				try {
					if (!parentAfter) {
						parentAfter = (await snapshotPaperParent(parentSelector, fixture, false)).evidence;
						await run.writeJsonArtifact('evidence/paper-parent-after.json', parentAfter);
						audits.paperParent.afterRecorded = true;
					}
					assertPaperParentUnchanged(parentBefore, parentAfter);
					audits.paperParent.matches = true;
				} catch (auditError) {
					audits.paperParent.matches = false;
					audits.paperParent.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (cacheInputs) {
				try {
					if (!cacheAfter) {
						cacheAfter = await createSelectedFileInventory(CACHE_ROOT, cacheInputs.selectedRelativePaths);
						await run.writeJsonArtifact('evidence/cache-inputs-after.json', {
							schemaId: 'algorithm32-color-reset-cr4a-cache-inputs-after-v1',
							selectedInventory: cacheAfter,
						});
						audits.selectedRuntimeCache.afterRecorded = true;
					}
					assertFileInventoriesEqual(
						cacheInputs.evidence.selectedInventory,
						cacheAfter,
						'CR4A selected runtime cache inputs',
					);
					audits.selectedRuntimeCache.matches = true;
				} catch (auditError) {
					audits.selectedRuntimeCache.matches = false;
					audits.selectedRuntimeCache.error =
						auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			try {
				if (!protectedAfter) {
					protectedAfter = {
						algorithm32: await createFileInventory(ALGORITHM32_ROOT),
						flat32: await createFileInventory(FLAT32_ROOT),
					};
					await run.writeJsonArtifact('evidence/protected-inputs-after.json', {
						schemaId: 'algorithm32-color-reset-cr4a-protected-inputs-after-v1',
						productionSource: protectedAfter,
					});
					audits.protectedProduction.afterRecorded = true;
				}
				if (protectedBefore) {
					assertFileInventoriesEqual(
						protectedBefore.algorithm32,
						protectedAfter.algorithm32,
						'CR4A protected Algorithm32 source',
					);
					assertFileInventoriesEqual(
						protectedBefore.flat32,
						protectedAfter.flat32,
						'CR4A protected Flat32 source',
					);
					audits.protectedProduction.matches = true;
				}
			} catch (auditError) {
				audits.protectedProduction.matches = false;
				audits.protectedProduction.error =
					auditError instanceof Error ? auditError.message : String(auditError);
			}
			if (!progressWritten) {
				await run.writeJsonArtifact(fixture.outputs.progress, await failureProgress(run, fixture, error));
				progressWritten = true;
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-failure-v1',
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : null,
				},
				audits,
				completedPaperPanelCount: paperPanels.length,
				completedBrowserUploads: error?.browserEvidence?.uploads ?? browser?.uploads ?? [],
				claimBoundary: fixture.claimBoundary,
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: 'algorithm32-color-reset-cr4a-native15-sunset-paper-failed-result-v1',
					accepted: false,
					integrityPassed: false,
					appearanceAccepted: false,
					objectiveAccuracyClaim: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report:
					`# ${run.runId}: CR4A Native15 sunset paper visual comparison\n\n` +
					`Conclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
