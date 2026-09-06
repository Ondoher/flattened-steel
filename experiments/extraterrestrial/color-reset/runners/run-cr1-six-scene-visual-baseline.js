#!/usr/bin/env node

import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';

import {assertNoReparseEntries} from '../../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256File,
} from '../../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {resolveDistantSunSceneCache} from '../controls/production-v1/src/flat32/DistantSunSceneCacheResolver.js';
import {createDistantSunSceneState} from '../controls/production-v1/src/flat32/DistantSunSceneState.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND = 'node experiments/extraterrestrial/color-reset/runners/run-cr1-six-scene-visual-baseline.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_PATH = path.join(COLOR_RESET_ROOT, 'fixtures', 'cr1-six-scene-visual-baseline-v1.json');
const CACHE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const FIXTURE_SHA256 = '3b3c73fcca0cd9f921affaf900d3816bfda86d5182720415f41b9ac641d2abdc';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY = 'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const PARENT_RUN_ID = '000004-control-smoke';
const PARENT_ARTIFACT_SET_SHA256 = '89b6974ba3ccff64f4efc3e8d7c219de99fb5fb099918c21d0a0098cc4be8dfb';
const PARENT_RUN_DIRECTORY = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	PARENT_RUN_ID,
);
const PARENT_MANIFEST_PATH = path.join(PARENT_RUN_DIRECTORY, 'artifact-manifest.json');
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const DARK_ZERO_TOLERANCE = 1e-12;
const PROBE_DIRECTION_TOLERANCE = 1e-12;
const PROBE_ANGULAR_TOLERANCE_RADIANS = 1e-7;
const EXPECTED_SCENES = Object.freeze([
	{id: 'solar-noon', timeIso: '2024-06-20T20:08:00.000Z', status: 'ready', bin: 14},
	{id: 'sunset-minus-60-minutes', timeIso: '2024-06-21T02:26:03.503Z', status: 'ready', bin: 79},
	{id: 'sunset-minus-10-minutes', timeIso: '2024-06-21T03:16:03.503Z', status: 'ready', bin: 88},
	{id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z', status: 'ready', bin: 90},
	{id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z', status: 'ready', bin: 92},
	{id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z', status: 'ready', bin: 100},
	{id: 'sunset-plus-120-minutes', timeIso: '2024-06-21T05:26:03.503Z', status: 'dark', bin: null},
]);
const PARENT_PANELS = Object.freeze({
	'solar-noon/bruneton': {
		path: 'captures/bruneton-solar-noon.png',
		sha256: '39e7aa96ffae52f0d2f2b9868e3429ed43d483ada5b1bf40fe06b312a51f1a95',
	},
	'solar-noon/production-lift': {
		path: 'captures/production-lift-solar-noon.png',
		sha256: '39e7aa96ffae52f0d2f2b9868e3429ed43d483ada5b1bf40fe06b312a51f1a95',
	},
	'sunset-plus-60-minutes/bruneton': {
		path: 'captures/bruneton-sunset-plus-60-minutes.png',
		sha256: 'e1093a93f878f5289c1e475b278d1b79a2c5504f6c0763a8a599167c81f6b96a',
	},
	'sunset-plus-60-minutes/production-lift': {
		path: 'captures/production-lift-sunset-plus-60-minutes.png',
		sha256: 'd0ad4a97d49dcd8224d854a2670d24602341f42cca3253baa09e63f9b51e9128',
	},
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function artifactPaths(fixture) {
	return [
		...fixture.outputs.individualPngs,
		fixture.outputs.plot,
		fixture.outputs.contactSheet,
		...fixture.outputs.rawFields,
		...fixture.outputs.hitMasks,
	];
}

function imageArtifactPaths(fixture) {
	return [...fixture.outputs.individualPngs, fixture.outputs.plot, fixture.outputs.contactSheet];
}

function expectedPanelPath(sceneId, panelKind) {
	if (panelKind === 'bruneton' || panelKind === 'production-lift') {
		return `captures/${panelKind}-${sceneId}.png`;
	}
	if (panelKind === 'pre-display-luminance') {
		return `diagnostics/pre-display-luminance-${sceneId}.png`;
	}
	return `diagnostics/black-saturation-masks-${sceneId}.png`;
}

function expectedRawFieldPath(sceneId) {
	return `data/pre-display-linear-rgb-y-${sceneId}.f32le`;
}

function expectedHitMaskPath(sceneId) {
	return `data/scene-hit-mask-${sceneId}.r8`;
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr1-six-scene-visual-baseline-input-v1',
		'CR1 fixture schema changed.',
	);
	requireCondition(fixture.scenes?.length === EXPECTED_SCENES.length, 'CR1 scene count changed.');
	for (let index = 0; index < EXPECTED_SCENES.length; index += 1) {
		const expected = EXPECTED_SCENES[index];
		const actual = fixture.scenes[index];
		requireCondition(
			actual?.id === expected.id &&
				actual.timeIso === expected.timeIso &&
				actual.cacheExpectation?.status === expected.status &&
				(expected.status === 'dark' ||
					actual.cacheExpectation.representativeSolarZenithDegrees === expected.bin),
			`CR1 scene ${index} changed identity, order, time, or cache expectation.`,
		);
	}
	requireCondition(
		fixture.parentControl?.runId === PARENT_RUN_ID &&
			fixture.parentControl.artifactSetSha256 === PARENT_ARTIFACT_SET_SHA256,
		'CR1 parent-control identity changed.',
	);
	for (const [key, expected] of Object.entries(PARENT_PANELS)) {
		requireCondition(
			fixture.parentControl.overlappingPanelSha256?.[key] === expected.sha256,
			`CR1 parent panel ${key} changed.`,
		);
	}
	requireCondition(
		fixture.displayControls?.length === 2 &&
			fixture.displayControls[0]?.id === 'bruneton' &&
			fixture.displayControls[1]?.id === 'production-lift',
		'CR1 display-control order changed.',
	);
	const expectedPngs = EXPECTED_SCENES.flatMap((scene) =>
		['bruneton', 'production-lift', 'pre-display-luminance', 'black-saturation-masks'].map(
			(kind) => expectedPanelPath(scene.id, kind),
		),
	);
	requireCondition(
		JSON.stringify(fixture.outputs?.individualPngs) === JSON.stringify(expectedPngs),
		'CR1 individual PNG declarations changed.',
	);
	requireCondition(
		JSON.stringify(fixture.outputs?.rawFields) ===
			JSON.stringify(EXPECTED_SCENES.map((scene) => expectedRawFieldPath(scene.id))),
		'CR1 raw-field declarations changed.',
	);
	requireCondition(
		JSON.stringify(fixture.outputs?.hitMasks) ===
			JSON.stringify(EXPECTED_SCENES.map((scene) => expectedHitMaskPath(scene.id))),
		'CR1 hit-mask declarations changed.',
	);
	requireCondition(
		fixture.outputs.plot === 'figures/cr1-field-luminance-summary.png' &&
			fixture.outputs.contactSheet === 'figures/cr1-six-scene-visual-baseline.png',
		'CR1 summary-image declarations changed.',
	);
	const artifacts = artifactPaths(fixture);
	requireCondition(
		artifacts.length === 44 && new Set(artifacts).size === artifacts.length,
		'CR1 requires exactly 44 unique browser artifacts.',
	);
}

async function verifyParentControl() {
	await assertNoReparseEntries(PARENT_RUN_DIRECTORY, 'CR1 parent control run');
	const summary = await verifyColorResetRun(PARENT_RUN_ID);
	requireCondition(
		summary.verified === true &&
			summary.conclusion === 'accepted' &&
			summary.artifactSetSha256 === PARENT_ARTIFACT_SET_SHA256,
		'CR1 parent run is not the accepted immutable control.',
	);
	const manifestFacts = await lstat(PARENT_MANIFEST_PATH);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink(),
		'CR1 parent manifest is not an ordinary file.',
	);
	const manifest = await readJson(PARENT_MANIFEST_PATH);
	const artifacts = new Map(manifest.artifacts.map((entry) => [entry.path, entry]));
	const panels = [];
	for (const [key, expected] of Object.entries(PARENT_PANELS)) {
		const artifact = artifacts.get(expected.path);
		requireCondition(
			artifact?.sha256 === expected.sha256 && Number.isSafeInteger(artifact.byteLength),
			`CR1 parent artifact ${expected.path} changed.`,
		);
		panels.push({key, path: expected.path, byteLength: artifact.byteLength, sha256: artifact.sha256});
	}
	return {
		schemaId: 'algorithm32-color-reset-cr1-parent-control-verification-v1',
		namespace: 'color-reset',
		runPath: `tmp/extraterrestrial/color-reset/runs/${PARENT_RUN_ID}`,
		summary,
		manifest: {
			path: `tmp/extraterrestrial/color-reset/runs/${PARENT_RUN_ID}/artifact-manifest.json`,
			sha256: await sha256File(PARENT_MANIFEST_PATH),
			artifactSetSha256: manifest.artifactSetSha256,
		},
		panels,
	};
}

function assertParentControlUnchanged(before, after) {
	requireCondition(
		before.manifest.sha256 === after.manifest.sha256 &&
			before.manifest.artifactSetSha256 === after.manifest.artifactSetSha256 &&
			JSON.stringify(before.panels) === JSON.stringify(after.panels),
		'CR1 parent control changed while it was used.',
	);
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR1 control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1',
		'CR1 control snapshot schema changed.',
	);
	requireCondition(
		manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.fileCount === 147,
		'CR1 control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map((entry) => entry.path));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR1 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR1 snapshot and production closure');
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
			'color-reset/runners/run-cr1-six-scene-visual-baseline.js',
			'color-reset/harness/cr1-six-scene-visual-baseline-browser.js',
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
	const implementationInventory = await createSelectedFileInventory(
		EXPERIMENT_ROOT,
		implementationClosure.files,
	);
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
	const threeServedInventory = await createSelectedFileInventory(
		THREE_ROOT,
		threeServedClosure.files,
	);
	const threePackagePath = path.join(THREE_ROOT, 'package.json');
	const threePackage = await readJson(threePackagePath);
	requireCondition(threePackage.version === '0.180.0', 'CR1 requires the locked Three 0.180.0 package.');
	return {
		schemaId: 'algorithm32-color-reset-cr1-runtime-implementation-before-v1',
		implementation: {
			closure: implementationClosure,
			inventory: implementationInventory,
		},
		browserDependencies: {
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			servedClosure: threeServedClosure,
			servedInventory: threeServedInventory,
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
		schemaId: 'algorithm32-color-reset-cr1-runtime-implementation-after-v1',
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

function assertRuntimeImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR1 runtime implementation',
	);
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR1 browser-served Three ESM closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 ===
			after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR1 package boundary changed while the browser was executing.',
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
		resolution.representativeSolarZenithDegrees ===
			scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} resolved the wrong one-degree bin.`,
	);
	const assetRootPrefix = '/cache/';
	requireCondition(
		resolution.asset.assetRoot.startsWith(assetRootPrefix),
		`${scene.id} cache asset root is outside the browser cache mount.`,
	);
	const packageRelative = resolution.asset.assetRoot.slice(assetRootPrefix.length).replace(/\/$/u, '');
	const packageDirectory = path.join(CACHE_ROOT, ...packageRelative.split('/'));
	assertLexicallyContained(CACHE_ROOT, packageDirectory, `${scene.id} package`);
	const manifestPath = path.join(packageDirectory, resolution.asset.loadRequest.manifestPath);
	assertLexicallyContained(packageDirectory, manifestPath, `${scene.id} manifest`);
	const manifestDigest = await sha256File(manifestPath);
	requireCondition(
		manifestDigest === resolution.asset.loadRequest.manifestSha256,
		`${scene.id} manifest SHA-256 changed.`,
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.cacheIdentity === resolution.asset.loadRequest.cacheIdentity,
		`${scene.id} manifest cache identity changed.`,
	);
	requireCondition(
		manifest.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY,
		`${scene.id} numerical identity changed.`,
	);
	requireCondition(
		manifest.selection?.representativeSolarZenithDegrees ===
			scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} manifest bin selection changed.`,
	);
	const ledgerPath = path.join(packageDirectory, manifest.ledgerPath);
	assertLexicallyContained(packageDirectory, ledgerPath, `${scene.id} ledger`);
	const ledgerFacts = await lstat(ledgerPath);
	requireCondition(ledgerFacts.isFile() && !ledgerFacts.isSymbolicLink(), `${scene.id} ledger is invalid.`);
	const ledgerDigest = await sha256File(ledgerPath);
	requireCondition(ledgerDigest === manifest.ledgerSha256, `${scene.id} ledger SHA-256 changed.`);
	const [exactSeamPayload, logicalToUniqueIndex] = await Promise.all([
		verifyPackageFile(packageDirectory, manifest.exactSeamPayload, `${scene.id} exact-seam payload`),
		verifyPackageFile(packageDirectory, manifest.logicalToUniqueIndex, `${scene.id} logical index`),
	]);
	return {
		sceneId: scene.id,
		timeIso: scene.timeIso,
		status: 'ready',
		requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
		representativeSolarZenithDegrees: resolution.representativeSolarZenithDegrees,
		cacheIdentity: manifest.cacheIdentity,
		packageRelativePath: packageRelative,
		manifest: {
			path: resolution.asset.loadRequest.manifestPath,
			sha256: manifestDigest,
		},
		ledger: {
			path: manifest.ledgerPath,
			byteLength: ledgerFacts.size,
			sha256: ledgerDigest,
		},
		exactSeamPayload,
		logicalToUniqueIndex,
		numericalIdentity: manifest.numericalIdentity,
	};
}

async function resolveAndVerifyCacheInputs(fixture) {
	await assertNoReparseEntries(CACHE_ROOT, 'CR1 runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const reportDigest = await sha256File(reportPath);
	requireCondition(reportDigest === PACKAGE_REPORT_SHA256, 'CR1 package report changed.');
	const report = await readJson(reportPath);
	requireCondition(report.accepted === true && report.packageCount === 109, 'CR1 package report is not accepted.');
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR1 runtime cache catalog');
	const catalogDigest = await sha256File(catalogPath);
	requireCondition(catalogDigest === CATALOG_SHA256, 'CR1 runtime catalog changed.');
	requireCondition(catalogDigest === report.catalogSha256, 'CR1 report/catalog identities disagree.');
	const catalog = await readJson(catalogPath);
	const scenes = [];
	const packages = [];
	const selections = [];
	for (const scene of fixture.scenes) {
		const observation = {
			instant: scene.timeIso,
			location: {
				latitude: {value: fixture.location.latitudeDegrees, units: 'degrees'},
				longitude: {value: fixture.location.longitudeDegrees, units: 'degrees'},
			},
		};
		const sceneState = createDistantSunSceneState({
			observation,
			observerHeight: {value: fixture.observer.heightMeters, units: 'meters'},
			observerUpDirection: fixture.observer.upDirection,
		});
		const resolution = resolveDistantSunSceneCache(catalog, sceneState.solarZenithDegrees, '/cache/');
		requireCondition(
			resolution.status === scene.cacheExpectation.status,
			`${scene.id} cache status differs from its fixture expectation.`,
		);
		if (resolution.status === 'ready') {
			const verifiedPackage = await verifySelectedPackage(scene, resolution);
			packages.push(verifiedPackage);
			selections.push(verifiedPackage);
			scenes.push({
				...scene,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				directionToSourceModel: sceneState.directionToSourceModel,
				cacheStatus: 'ready',
				cacheIdentity: resolution.asset.loadRequest.cacheIdentity,
				sceneCacheAsset: resolution.asset,
			});
			continue;
		}
		requireCondition(
			resolution.status === 'dark' &&
				sceneState.solarZenithDegrees >= catalog.darkFromSolarZenithDegrees &&
				!('asset' in resolution),
			`${scene.id} did not resolve the shared texture-free dark state.`,
		);
		const darkSelection = {
			sceneId: scene.id,
			timeIso: scene.timeIso,
			status: 'dark',
			requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
			darkFromSolarZenithDegrees: catalog.darkFromSolarZenithDegrees,
			cacheContributionId: 'cache-distant-sun-dark',
			textureBindingCount: 0,
		};
		selections.push(darkSelection);
		scenes.push({
			...scene,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			cacheStatus: 'dark',
		});
	}
	return {
		scenes,
		evidence: {
			schemaId: 'algorithm32-color-reset-cr1-cache-input-verification-v1',
			accepted: true,
			packageRoot: 'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1',
			packageReport: {path: 'package-report.json', sha256: reportDigest},
			catalog: {path: report.catalogPath, sha256: catalogDigest},
			darkFromSolarZenithDegrees: catalog.darkFromSolarZenithDegrees,
			packages,
			selections,
		},
	};
}

function makeBrowserConfiguration(fixture, scenes) {
	const paths = new Set(fixture.outputs.individualPngs);
	const panels = scenes.flatMap((scene) => [
		{sceneId: scene.id, panelKind: 'bruneton', controlId: 'bruneton', artifactPath: expectedPanelPath(scene.id, 'bruneton'), label: `${scene.label} - Unchanged Bruneton`},
		{sceneId: scene.id, panelKind: 'production-lift', controlId: 'production-lift', artifactPath: expectedPanelPath(scene.id, 'production-lift'), label: `${scene.label} - Current production lift`},
		{sceneId: scene.id, panelKind: 'pre-display-luminance', artifactPath: expectedPanelPath(scene.id, 'pre-display-luminance'), label: `${scene.label} - Pre-display luminance`},
		{sceneId: scene.id, panelKind: 'black-saturation-masks', artifactPath: expectedPanelPath(scene.id, 'black-saturation-masks'), label: `${scene.label} - Black/saturation masks`},
	]);
	for (const panel of panels) {
		requireCondition(paths.has(panel.artifactPath), `Fixture does not declare panel ${panel.artifactPath}.`);
	}
	const parentReplayPanels = Object.entries(PARENT_PANELS).map(([key, parent]) => {
		const [sceneId, controlId] = key.split('/');
		return {
			sceneId,
			controlId,
			artifactPath: expectedPanelPath(sceneId, controlId),
			parentArtifactPath: parent.path,
		};
	});
	return {
		schemaId: 'algorithm32-color-reset-cr1-browser-config-v1',
		location: fixture.location,
		observer: fixture.observer,
		camera: fixture.camera,
		displayControls: fixture.displayControls,
		diagnostics: fixture.diagnostics,
		physicalControls: fixture.physicalControls,
		outputs: fixture.outputs,
		scenes,
		panels,
		parentReplayPanels,
	};
}

function elapsedMilliseconds(initializedAt, completedAt) {
	return Date.parse(completedAt) - Date.parse(initializedAt);
}

function makeProgress(run, browser, fixture) {
	const pngPaths = new Set(imageArtifactPaths(fixture));
	const pngUploads = browser.uploads.filter((entry) => pngPaths.has(entry.path));
	const firstImage = pngUploads
		.slice()
		.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt))[0];
	const plate = browser.uploads.find((entry) => entry.path === fixture.outputs.contactSheet);
	requireCondition(firstImage && plate, 'CR1 progress events are incomplete.');
	const firstImageElapsedMilliseconds = elapsedMilliseconds(run.initializedAt, firstImage.completedAt);
	const decisionPlateElapsedMilliseconds = elapsedMilliseconds(run.initializedAt, plate.completedAt);
	return {
		schemaId: 'algorithm32-color-reset-progress-v1',
		runId: run.runId,
		initializedAt: run.initializedAt,
		firstImage: {
			artifactPath: firstImage.path,
			completedAt: firstImage.completedAt,
			elapsedMilliseconds: firstImageElapsedMilliseconds,
			targetMilliseconds: 180000,
			targetMet: firstImageElapsedMilliseconds <= 180000,
		},
		decisionPlate: {
			artifactPath: plate.path,
			completedAt: plate.completedAt,
			elapsedMilliseconds: decisionPlateElapsedMilliseconds,
			targetMilliseconds: 600000,
			targetMet: decisionPlateElapsedMilliseconds <= 600000,
		},
		browserProgressEvents: browser.progressEvents,
	};
}

function attachArtifactIdentities(browserResult, uploads) {
	const uploadsByPath = new Map(uploads.map((entry) => [entry.path, entry]));
	const attach = (record) => {
		const upload = uploadsByPath.get(record.artifactPath);
		requireCondition(upload, `Browser result has no upload identity for ${record.artifactPath}.`);
		requireCondition(
			record.byteLength === upload.byteLength,
			`Browser and server byte lengths disagree for ${record.artifactPath}.`,
		);
		return {...record, sha256: upload.sha256, completedAt: upload.completedAt};
	};
	requireCondition(
		Array.isArray(browserResult.panels) &&
			Array.isArray(browserResult.rawFields) &&
			Array.isArray(browserResult.hitMasks) &&
			Array.isArray(browserResult.scenes),
		'CR1 browser result omits panels, raw fields, hit masks, or scenes.',
	);
	const hitMasks = browserResult.hitMasks.map(attach);
	const hitMasksByScene = new Map(hitMasks.map((entry) => [entry.sceneId, entry]));
	return {
		...browserResult,
		panels: browserResult.panels.map(attach),
		rawFields: browserResult.rawFields.map(attach),
		hitMasks,
		scenes: browserResult.scenes.map((scene) => {
			const originalMask = browserResult.hitMasks.find(
				(entry) => entry.sceneId === scene.sceneId,
			);
			const hitMask = hitMasksByScene.get(scene.sceneId);
			requireCondition(
				originalMask &&
					hitMask &&
					JSON.stringify(scene.hitMask) === JSON.stringify(originalMask),
				`CR1 scene ${scene.sceneId} does not reference its retained hit-mask record.`,
			);
			return {...scene, hitMask};
		}),
		plot: attach(browserResult.plot),
		contactSheet: attach(browserResult.contactSheet),
	};
}

function makePanelIdentityEvidence({renderAnalysis, fixture, cacheInputs}) {
	const fixtureScenes = new Map(fixture.scenes.map((scene) => [scene.id, scene]));
	const renderedScenes = new Map(renderAnalysis.scenes.map((scene) => [scene.sceneId, scene]));
	const cacheSelections = new Map(
		cacheInputs.evidence.selections.map((entry) => [entry.sceneId, entry]),
	);
	return {
		schemaId: 'algorithm32-color-reset-cr1-panel-identities-v1',
		fixture: {
			path: 'experiments/extraterrestrial/color-reset/fixtures/cr1-six-scene-visual-baseline-v1.json',
			sha256: FIXTURE_SHA256,
		},
		controlSnapshot: {
			manifestPath:
				'experiments/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
			manifestSha256: SNAPSHOT_MANIFEST_SHA256,
			inventorySha256: SNAPSHOT_INVENTORY_SHA256,
		},
		panels: renderAnalysis.panels.map((panel) => {
			const fixtureScene = fixtureScenes.get(panel.sceneId);
			const renderedScene = renderedScenes.get(panel.sceneId);
			const cacheSelection = cacheSelections.get(panel.sceneId);
			const frame = panel.controlId ? renderedScene?.frames?.[panel.controlId] : null;
			requireCondition(
				fixtureScene && renderedScene && cacheSelection,
				`Panel identity inputs are incomplete for ${panel.sceneId}/${panel.panelKind}.`,
			);
			return {
				...panel,
				scene: {
					id: fixtureScene.id,
					label: fixtureScene.label,
					timeIso: fixtureScene.timeIso,
					solarZenithDegrees: renderedScene.solarZenithDegrees,
					directionToSourceModel: renderedScene.directionToSourceModel,
				},
				camera: fixture.camera,
				physicalControls: fixture.physicalControls,
				cache: cacheSelection,
				displayOrDiagnosticOperation: {
					panelKind: panel.panelKind,
					controlId: panel.controlId ?? null,
					colorId: panel.colorId ?? frame?.colorId ?? renderedScene.field?.colorId ?? null,
					runtimeSourceHash:
						panel.shaderSourceHash ??
						frame?.diagnostics?.runtime?.sourceHash ??
						renderedScene.field?.diagnostics?.runtime?.sourceHash ??
						null,
				},
				runtimeEnvironment: {
					...renderAnalysis.runtimeEnvironment,
					browserUserAgent: renderAnalysis.software.browserUserAgent,
					threeRevision: renderAnalysis.software.threeRevision,
					webgl: renderedScene.gpu,
				},
			};
		}),
		plot: renderAnalysis.plot,
		contactSheet: {
			...renderAnalysis.contactSheet,
			panelArtifactPaths: renderAnalysis.panels.map((panel) => panel.artifactPath),
		},
	};
}

function makeDerivedImageEvidence({
	renderAnalysis,
	fixture,
	runtimeImplementationBefore,
}) {
	const browserModule = runtimeImplementationBefore.implementation.inventory.files.find(
		(entry) => entry.path === 'color-reset/harness/cr1-six-scene-visual-baseline-browser.js',
	);
	requireCondition(browserModule, 'CR1 browser module is absent from its implementation inventory.');
	return {
		schemaId: 'algorithm32-color-reset-cr1-artifact-derivations-v1',
		implementation: {
			path: browserModule.path,
			sha256: browserModule.sha256,
			closureAggregateSha256:
				runtimeImplementationBefore.implementation.inventory.aggregateSha256,
			threeServedAggregateSha256:
				runtimeImplementationBefore.browserDependencies.servedInventory.aggregateSha256,
			threePackageJsonSha256:
				runtimeImplementationBefore.browserDependencies.threePackage.packageJsonSha256,
			experimentPackageLockSha256:
				runtimeImplementationBefore.packageBoundary.packageLockSha256,
			browserTool: {
				...renderAnalysis.software,
				...renderAnalysis.runtimeEnvironment,
			},
		},
		panels: renderAnalysis.panels.map((panel) => ({
			artifact: {
				path: panel.artifactPath,
				byteLength: panel.byteLength,
				sha256: panel.sha256,
			},
			parents:
				panel.panelKind === 'pre-display-luminance'
					? [
						renderAnalysis.rawFields.find((field) => field.sceneId === panel.sceneId),
						renderAnalysis.hitMasks.find((mask) => mask.sceneId === panel.sceneId),
					]
					: panel.panelKind === 'black-saturation-masks'
						? renderAnalysis.panels.filter(
							(candidate) =>
								candidate.sceneId === panel.sceneId &&
								['bruneton', 'production-lift'].includes(candidate.panelKind),
						).concat([
							renderAnalysis.hitMasks.find((mask) => mask.sceneId === panel.sceneId),
						])
						: [{sceneId: panel.sceneId, cacheIdentity: panel.cacheIdentity, colorId: panel.colorId}],
			operation:
				panel.panelKind === 'pre-display-luminance'
					? 'Map geometry-separated pre-display photopic Y through the fixed log10 heatmap.'
					: panel.panelKind === 'black-saturation-masks'
						? 'Apply the declared exact black/saturation predicates to sky display codes.'
						: 'Render the exact Q30 scene field through the selected unchanged production Color control.',
			implementation: {
				browserModulePath: browserModule.path,
				browserModuleSha256: browserModule.sha256,
				runtimeShaderSourceHash: panel.shaderSourceHash ?? null,
			},
			parameters: {
				sceneId: panel.sceneId,
				camera: fixture.camera,
				physicalControls: fixture.physicalControls,
				diagnostics: fixture.diagnostics,
			},
		})),
		rawFields: renderAnalysis.rawFields.map((field) => ({
			artifact: {path: field.artifactPath, byteLength: field.byteLength, sha256: field.sha256},
			populationMask: renderAnalysis.hitMasks.find((mask) => mask.sceneId === field.sceneId),
			operation: 'Read the contained RGBA32F diagnostic target as top-down little-endian linear RGB and photopic Y.',
			parameters: fixture.diagnostics.preDisplayField,
		})),
		hitMasks: renderAnalysis.hitMasks.map((mask) => ({
			artifact: {path: mask.artifactPath, byteLength: mask.byteLength, sha256: mask.sha256},
			parents: [{sceneId: mask.sceneId, source: mask.derivation.source}],
			operation: mask.derivation.operation,
			parameters: {
				contract: fixture.diagnostics.sceneHitMask,
				encoding: mask.encoding,
				retainedCapture: mask.retainedCapture,
				equality: mask.equality,
				counts: mask.counts,
			},
		})),
		plot: {
			artifact: {
				path: renderAnalysis.plot.artifactPath,
				byteLength: renderAnalysis.plot.byteLength,
				sha256: renderAnalysis.plot.sha256,
			},
			parents: renderAnalysis.rawFields
				.concat(renderAnalysis.hitMasks)
				.map((field) => ({path: field.artifactPath, sha256: field.sha256})),
			operation: 'Plot fixed field percentiles, regions, and geometry-derived directional probes.',
		},
		contactSheet: {
			artifact: {
				path: renderAnalysis.contactSheet.artifactPath,
				byteLength: renderAnalysis.contactSheet.byteLength,
				sha256: renderAnalysis.contactSheet.sha256,
			},
			parents: renderAnalysis.panels.map((panel) => ({
				path: panel.artifactPath,
				sha256: panel.sha256,
			})),
			operation:
				'Draw seven chronological scene rows and four stable labeled panel columns without resampling.',
			parameters: {
				rowSceneOrder: fixture.scenes.map((scene) => scene.id),
				columnPanelOrder: ['bruneton', 'production-lift', 'pre-display-luminance', 'black-saturation-masks'],
				panelWidthPixels: fixture.camera.widthPixels,
				panelHeightPixels: fixture.camera.heightPixels,
				labelHeightPixels: 38,
			},
		},
		parentReplay: {
			parents: Object.entries(PARENT_PANELS).map(([key, panel]) => ({
				namespace: 'color-reset', runId: PARENT_RUN_ID, key, ...panel,
			})),
			operation: 'Decode parent and current PNGs to normalized top-down RGBA8 and compare every channel code.',
			results: renderAnalysis.parentReplay,
		},
	};
}

function makeFieldDiagnostics(renderAnalysis, fixture) {
	return {
		schemaId: 'algorithm32-color-reset-cr1-field-diagnostics-v1',
		preDisplayContract: fixture.diagnostics.preDisplayField,
		hitMaskContract: fixture.diagnostics.sceneHitMask,
		heatmapContract: fixture.diagnostics.heatmap,
		maskContract: fixture.diagnostics.combinedMask,
		probeContract: fixture.diagnostics.directionalProbes,
		chromaticityAuthority: renderAnalysis.chromaticityAuthority,
		scenes: renderAnalysis.scenes.map((scene) => ({
			sceneId: scene.sceneId,
			cacheStatus: scene.cacheStatus,
			hitMask: scene.hitMask,
			displayDifference: scene.displayDifference,
			field: scene.field,
			masks: scene.masks,
		})),
		parentReplay: renderAnalysis.parentReplay,
	};
}

function installedRuntime(value) {
	return Boolean(
		value?.status === 'installed' &&
			value.runtime?.status === 'ready' &&
			/^fnv1a32:[a-f0-9]{8}$/u.test(value.runtime.sourceHash ?? '') &&
			value.runtime.renderErrorCount === 0 &&
			value.runtime.lastRenderError === null &&
			value.runtime.frameCount >= 1,
	);
}

function finiteVector(value, length) {
	return Array.isArray(value) && value.length === length && value.every(Number.isFinite);
}

function percentileValue(entries, requestedPercentile) {
	return entries?.find((entry) => entry.percentile === requestedPercentile)?.value;
}

function valuesWithinTolerance(values, tolerance) {
	return finiteVector(values, 3) && values.every((value) => Math.abs(value) <= tolerance);
}

function validLinearChromaticity(value) {
	return (
		value === null ||
		(value !== undefined &&
			['x', 'y', 'X', 'Y', 'Z'].every((component) => Number.isFinite(value[component])))
	);
}

function zeroRawRegion(region) {
	const maximumLuminance = percentileValue(region?.percentiles, 100);
	return Boolean(
		region?.pixelCount > 0 &&
			region.finitePixelCount === region.pixelCount &&
			region.nonfiniteRgbPixelCount === 0 &&
			region.zeroLuminancePixelCount === region.pixelCount &&
			Number.isFinite(maximumLuminance) &&
			Math.abs(maximumLuminance) <= DARK_ZERO_TOLERANCE &&
			valuesWithinTolerance(region.meanLinearRgb, DARK_ZERO_TOLERANCE),
	);
}

function blackDisplayRegion(region) {
	return Boolean(
		region?.pixelCount > 0 &&
			region.blackPixelCount === region.pixelCount &&
			region.saturatedPixelCount === 0 &&
			region.blackPixelFraction === 1 &&
			region.saturatedPixelFraction === 0,
	);
}

function evaluateGates({browserResult, browser, fixture, progress}) {
	const expectedArtifacts = new Set(artifactPaths(fixture));
	const expectedImages = new Set(imageArtifactPaths(fixture));
	const actualArtifacts = new Set(browser.uploads.map((entry) => entry.path));
	const actualImages = new Set(
		browser.uploads.filter((entry) => entry.path.endsWith('.png')).map((entry) => entry.path),
	);
	const expectedSceneIds = fixture.scenes.map((scene) => scene.id);
	const sceneIds = browserResult.scenes.map((scene) => scene.sceneId);
	const expectedPanelKeys = new Set(
		fixture.scenes.flatMap((scene) =>
			['bruneton', 'production-lift', 'pre-display-luminance', 'black-saturation-masks'].map(
				(kind) => `${scene.id}/${kind}`,
			),
		),
	);
	const panelKeys = new Set(
		browserResult.panels.map((panel) => `${panel.sceneId}/${panel.panelKind}`),
	);
	const frames = browserResult.scenes.flatMap((scene) => [
		scene.frames?.bruneton,
		scene.frames?.['production-lift'],
	]);
	const fields = browserResult.scenes.map((scene) => scene.field);
	const correctModels = browserResult.scenes.every(
		(scene) =>
			scene.frames?.bruneton?.colorId === 'bruneton-figure1-display' &&
			scene.frames?.['production-lift']?.colorId ===
				'bruneton-source-derived-global-luminance-lift-v2' &&
			scene.field?.colorId === fixture.diagnostics.preDisplayField.colorId,
	);
	const correctDimensions = browserResult.panels.every(
		(panel) =>
			panel.width === fixture.camera.widthPixels && panel.height === fixture.camera.heightPixels,
	);
	const groundEndpoints = frames.every((frame) => frame?.geometryProbe?.hitRgba?.[0] === 255);
	const noWebglErrors = frames
		.map((frame) => frame?.webglErrors)
		.concat(fields.map((field) => field?.webglErrors))
		.every((errors) => Array.isArray(errors) && errors.length === 0);
	const contextsHealthy = frames
		.map((frame) => frame?.contextLost)
		.concat(fields.map((field) => field?.contextLost))
		.every((lost) => lost === false);
	const installedRuntimes =
		frames.every((frame) => installedRuntime(frame?.diagnostics)) &&
		fields.every((field) => installedRuntime(field?.diagnostics));
	const cacheReuse = browserResult.scenes.every(
		(scene) =>
			scene.cacheReuse?.initialCachePublished === true &&
			scene.cacheReuse.controllerAfterLift === true &&
			scene.cacheReuse.residentAfterLift === true &&
			scene.cacheReuse.controllerAfterDiagnostic === true &&
			scene.cacheReuse.residentAfterDiagnostic === true,
	);
	const readyCaches = browserResult.scenes
		.filter((scene) => scene.cacheStatus === 'ready')
		.every(
			(scene) =>
				typeof scene.cacheIdentity === 'string' &&
				scene.cacheIdentity.startsWith('algorithm32-distant-sun-scene-cache-sha256:') &&
				scene.cacheRuntime?.bindingCount > 0 &&
				scene.cacheRuntime.contributionId !== 'cache-distant-sun-dark',
		);
	const dark = browserResult.scenes.find(
		(scene) => scene.sceneId === 'sunset-plus-120-minutes',
	);
	const darkState = Boolean(
		dark?.cacheStatus === 'dark' &&
			dark.cacheIdentity === 'algorithm32-distant-sun-shared-dark-v1' &&
			dark.cacheRuntime?.contributionId === 'cache-distant-sun-dark' &&
			dark.cacheRuntime?.bindingCount === 0,
	);
	const rawByteLength = fixture.camera.widthPixels * fixture.camera.heightPixels * 4 * 4;
	const hitMaskByteLength = fixture.camera.widthPixels * fixture.camera.heightPixels;
	const rawFieldSceneIds = new Set(browserResult.rawFields.map((field) => field.sceneId));
	const hitMaskSceneIds = new Set(browserResult.hitMasks.map((mask) => mask.sceneId));
	const rawFieldsComplete =
		browserResult.rawFields.length === 7 &&
		rawFieldSceneIds.size === expectedSceneIds.length &&
		browserResult.rawFields.every(
			(field) =>
				expectedSceneIds.includes(field.sceneId) &&
				field.artifactPath === expectedRawFieldPath(field.sceneId) &&
				field.byteLength === rawByteLength &&
				field.width === fixture.camera.widthPixels &&
				field.height === fixture.camera.heightPixels &&
				field.storage === fixture.diagnostics.preDisplayField.storage &&
				field.populationHitMaskArtifactPath === expectedHitMaskPath(field.sceneId) &&
				/^[a-f0-9]{64}$/u.test(field.sha256),
		);
	const hitMasksComplete =
		browserResult.hitMasks.length === 7 &&
		hitMaskSceneIds.size === expectedSceneIds.length &&
		browserResult.hitMasks.every((mask) => {
			const scene = browserResult.scenes.find((entry) => entry.sceneId === mask.sceneId);
			const counts = [
				mask.counts?.bruneton,
				mask.counts?.['production-lift'],
				mask.counts?.diagnostic,
			];
			return Boolean(
				expectedSceneIds.includes(mask.sceneId) &&
					mask.artifactPath === expectedHitMaskPath(mask.sceneId) &&
					mask.byteLength === hitMaskByteLength &&
					mask.width === fixture.camera.widthPixels &&
					mask.height === fixture.camera.heightPixels &&
					mask.storage === fixture.diagnostics.sceneHitMask.storage &&
					mask.encoding?.sky === 0 &&
					mask.encoding?.geometry === 255 &&
					mask.retainedCapture === 'pre-display-diagnostic' &&
					mask.derivation?.source === fixture.diagnostics.sceneHitMask.source &&
					mask.derivation?.operation === fixture.diagnostics.sceneHitMask.derivation &&
					mask.equality?.brunetonVsProductionLift === true &&
					mask.equality?.brunetonVsDiagnostic === true &&
					mask.equality?.productionLiftVsDiagnostic === true &&
					mask.equality?.allEqual === true &&
					mask.nondegenerate === true &&
					counts.every(
						(count) =>
							Number.isInteger(count?.skyPixelCount) &&
							Number.isInteger(count?.geometryPixelCount) &&
							count.noncanonicalPixelCount === 0 &&
							count.skyPixelCount + count.geometryPixelCount === hitMaskByteLength &&
							count.skyPixelCount === scene?.field?.skyPixelCount &&
							count.geometryPixelCount === scene?.field?.geometryPixelCount,
					) &&
					/^[a-f0-9]{64}$/u.test(mask.sha256) &&
					scene?.hitMask?.artifactPath === mask.artifactPath &&
					scene.hitMask.sha256 === mask.sha256,
			);
		});
	const finiteFields = browserResult.scenes.every(
		(scene) =>
			scene.gpu?.extColorBufferFloat === true &&
			scene.field?.storage === fixture.diagnostics.preDisplayField.storage &&
			scene.field?.nonfiniteRgbPixelCount === 0 &&
			scene.field?.finiteRgbPixelCount ===
				fixture.camera.widthPixels * fixture.camera.heightPixels &&
			scene.field.skyPixelCount + scene.field.geometryPixelCount ===
				fixture.camera.widthPixels * fixture.camera.heightPixels,
	);
	const diagnosticEvidenceComplete = browserResult.scenes.every((scene) => {
		const field = scene.field;
		return Boolean(
			Array.isArray(field?.percentiles) &&
				field.percentiles.length === fixture.diagnostics.preDisplayField.percentiles.length &&
				field.percentiles.every(
					(entry, index) =>
						entry.percentile === fixture.diagnostics.preDisplayField.percentiles[index] &&
						Number.isFinite(entry.value),
				) &&
				Array.isArray(field.meanLinearRgb) &&
				field.meanLinearRgb.length === 3 &&
				field.meanLinearRgb.every(Number.isFinite) &&
				validLinearChromaticity(field.chromaticity) &&
				['fullSky', 'horizonBand', 'upperSky'].every((regionId) => {
					const region = field.regions?.[regionId];
					return Boolean(
						region?.pixelCount > 0 &&
							region.finitePixelCount === region.pixelCount &&
							region.nonfiniteRgbPixelCount === 0 &&
							Number.isInteger(region.zeroLuminancePixelCount) &&
							finiteVector(region.meanLinearRgb, 3) &&
							validLinearChromaticity(region.chromaticity) &&
							Array.isArray(region.percentiles) &&
							region.percentiles.length ===
								fixture.diagnostics.preDisplayField.percentiles.length &&
							region.percentiles.every(
								(entry, index) =>
									entry.percentile ===
										fixture.diagnostics.preDisplayField.percentiles[index] &&
									Number.isFinite(entry.value),
							),
					);
				}) &&
				Array.isArray(field.probes) &&
				field.probes.length === fixture.diagnostics.directionalProbes.length &&
				field.probes.every(
					(probe, index) =>
						probe.id === fixture.diagnostics.directionalProbes[index].id &&
						probe.finite === true &&
						Number.isFinite(probe.luminance),
				) &&
				Number.isFinite(scene.displayDifference?.rmseRgbCodes) &&
				Number.isInteger(scene.masks?.geometryPixelCount) &&
				Number.isInteger(scene.masks?.bruneton?.blackSkyPixelCount) &&
				Number.isInteger(scene.masks?.['production-lift']?.blackSkyPixelCount),
		);
	});
	const exactDirectionalProbeEvidence = browserResult.scenes.every((scene) =>
		scene.field.probes.every((probe) =>
			Boolean(
				probe.sampling?.kind === 'one-by-one-principal-ray' &&
					probe.sampling.viewport?.width === 1 &&
					probe.sampling.viewport?.height === 1 &&
					probe.sampling.viewport?.units === 'pixels' &&
					probe.sampling.pixel?.x === 0 &&
					probe.sampling.pixel?.yFromBottom === 0 &&
					JSON.stringify(probe.sampling.textureCoordinates) === JSON.stringify([0.5, 0.5]) &&
					typeof probe.sampling.reconstruction === 'string' &&
					probe.sampling.reconstruction.length > 0 &&
					finiteVector(probe.targetDirectionScene, 3) &&
					finiteVector(probe.targetDirectionModel, 3) &&
					finiteVector(probe.reconstructedDirectionScene, 3) &&
					finiteVector(probe.reconstructedDirectionModel, 3) &&
					JSON.stringify(probe.directionScene) ===
						JSON.stringify(probe.reconstructedDirectionScene) &&
					JSON.stringify(probe.directionModel) ===
						JSON.stringify(probe.reconstructedDirectionModel) &&
					Number.isFinite(probe.maximumAbsoluteDirectionComponentError) &&
					probe.maximumAbsoluteDirectionComponentError <= PROBE_DIRECTION_TOLERANCE &&
					Number.isFinite(probe.angularErrorRadians) &&
					probe.angularErrorRadians <= PROBE_ANGULAR_TOLERANCE_RADIANS &&
					Number.isFinite(probe.angularErrorDegrees) &&
					probe.angularErrorDegrees <=
						PROBE_ANGULAR_TOLERANCE_RADIANS * 180 / Math.PI &&
					finiteVector(probe.linearRgb, 3) &&
					validLinearChromaticity(probe.chromaticity) &&
					Array.isArray(probe.hitRgba) &&
					probe.hitRgba.length === 4 &&
					[0, 255].includes(probe.hitRgba[0]) &&
					probe.geometryHit === (probe.hitRgba[0] === 255),
			),
		),
	);
	const noDisplayCodeChromaticity = frames.every((frame) =>
		['fullSky', 'horizonBand', 'upperSky'].every(
			(regionId) =>
				frame?.skyStats?.[regionId] &&
				!Object.prototype.hasOwnProperty.call(frame.skyStats[regionId], 'chromaticity'),
		),
	);
	const darkMaximumLuminance = percentileValue(dark?.field?.percentiles, 100);
	const darkRawFieldIsZero = Boolean(
		dark &&
			Number.isFinite(darkMaximumLuminance) &&
			Math.abs(darkMaximumLuminance) <= DARK_ZERO_TOLERANCE &&
			dark.field.zeroLuminanceSkyPixelCount === dark.field.skyPixelCount &&
			valuesWithinTolerance(dark.field.meanLinearRgb, DARK_ZERO_TOLERANCE) &&
			['fullSky', 'horizonBand', 'upperSky'].every((regionId) =>
				zeroRawRegion(dark.field.regions?.[regionId]),
			) &&
			dark.field.probes.every(
				(probe) =>
					probe.finite === true &&
					valuesWithinTolerance(probe.linearRgb, DARK_ZERO_TOLERANCE) &&
					Number.isFinite(probe.luminance) &&
					Math.abs(probe.luminance) <= DARK_ZERO_TOLERANCE,
			),
	);
	const darkDisplaysAreBlackAndUnsaturated = Boolean(
		dark &&
			['bruneton', 'production-lift'].every((controlId) => {
				const frame = dark.frames?.[controlId];
				const mask = dark.masks?.[controlId];
				return (
					['fullSky', 'horizonBand', 'upperSky'].every((regionId) =>
						blackDisplayRegion(frame?.skyStats?.[regionId]),
					) &&
					mask?.blackSkyPixelCount === dark.field.skyPixelCount &&
					mask.saturatedSkyPixelCount === 0
				);
			}),
	);
	const cpuReplayEvidenceComplete = browserResult.scenes.every((scene) =>
		['bruneton', 'production-lift'].every((controlId) => {
			const replay = scene.field?.cpuDisplayReplay?.[controlId];
			return Boolean(
				replay &&
					replay.population === 'sky-only from full SceneInputCapture hit mask' &&
					replay.skyPixelCount === scene.field.skyPixelCount &&
					replay.skippedGeometryPixelCount === scene.field.geometryPixelCount &&
					replay.nonfinitePredictionPixelCount === 0 &&
					Number.isFinite(replay.maximumAbsoluteChannelDifference) &&
					Number.isInteger(replay.overOneCodePixelCount) &&
					Number.isInteger(replay.differingPixelCount) &&
					Number.isFinite(replay.rmseRgbCodes),
			);
		}),
	);
	const cpuReplayWithinOneCode =
		cpuReplayEvidenceComplete &&
		browserResult.scenes.every((scene) =>
			['bruneton', 'production-lift'].every((controlId) => {
				const replay = scene.field.cpuDisplayReplay[controlId];
				return (
					replay.maximumAbsoluteChannelDifference <= 1 && replay.overOneCodePixelCount === 0
				);
			}),
		);
	const parentKeys = new Set(Object.keys(PARENT_PANELS));
	const parentReplayComplete =
		browserResult.parentReplay.length === parentKeys.size &&
		browserResult.parentReplay.every(
			(replay) =>
				parentKeys.has(`${replay.sceneId}/${replay.controlId}`) &&
				replay.width === fixture.camera.widthPixels &&
				replay.height === fixture.camera.heightPixels &&
				Number.isInteger(replay.rgbaDifferingPixelCount) &&
				Number.isFinite(replay.maximumAbsoluteChannelDifference) &&
				Number.isFinite(replay.rmseRgbaCodes),
		);
	const exactParentReplay =
		parentReplayComplete &&
		browserResult.parentReplay.every(
			(replay) =>
				replay.exactRgba === true &&
				replay.rgbaDifferingPixelCount === 0 &&
				replay.maximumAbsoluteChannelDifference === 0 &&
				replay.rmseRgbaCodes === 0,
		);
	const actualD3d11 = browserResult.scenes.every((scene) =>
		/(?:d3d11|direct3d11)/iu.test(scene.gpu?.renderer ?? ''),
	);
	const browserIdentityRecorded =
		/^[a-f0-9]{64}$/u.test(
			browserResult.runtimeEnvironment?.chromeExecutable?.sha256 ?? '',
		) &&
		typeof browserResult.runtimeEnvironment?.browserVersion?.product === 'string' &&
		browserResult.runtimeEnvironment.requestedAngleBackend === 'd3d11';
	const chromaticityAuthorityRecorded = Boolean(
		typeof browserResult.chromaticityAuthority?.source === 'string' &&
			browserResult.chromaticityAuthority.source.length > 0 &&
			typeof browserResult.chromaticityAuthority.operation === 'string' &&
			browserResult.chromaticityAuthority.operation.length > 0 &&
			['xyzToLinearSrgbMatrix', 'linearSrgbToXyzMatrix'].every((matrixName) => {
				const matrix = browserResult.chromaticityAuthority[matrixName];
				return (
					Array.isArray(matrix) &&
					matrix.length === 3 &&
					matrix.every(
						(row) =>
							Array.isArray(row) && row.length === 3 && row.every(Number.isFinite),
					)
				);
			}),
	);
	const gates = {
		browserResultSchema:
			browserResult.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		allRequestedArtifactsWritten:
			expectedArtifacts.size === actualArtifacts.size &&
			[...expectedArtifacts].every((entry) => actualArtifacts.has(entry)),
		allRequestedImagesWritten:
			expectedImages.size === actualImages.size &&
			[...expectedImages].every((entry) => actualImages.has(entry)),
		sevenScenesInDeclaredOrder: JSON.stringify(sceneIds) === JSON.stringify(expectedSceneIds),
		twentyEightStablePanels:
			browserResult.panels.length === expectedPanelKeys.size &&
			[...expectedPanelKeys].every((entry) => panelKeys.has(entry)),
		panelDimensions: correctDimensions,
		contactSheetUploadedLast: browser.uploads.at(-1)?.path === fixture.outputs.contactSheet,
		controlModelIdentities: correctModels,
		sphericalGroundEndpoints: groundEndpoints,
		noWebglErrors,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		contextsHealthy,
		actualD3d11Backend: actualD3d11,
		browserIdentityRecorded,
		chromaticityAuthorityRecorded,
		noDisplayCodeChromaticity,
		installedRuntimes,
		cacheIdentityAndReuse: cacheReuse && readyCaches,
		textureFreeInstalledDarkState: darkState,
		darkStateProducesZeroFieldAndBlackSky:
			darkRawFieldIsZero && darkDisplaysAreBlackAndUnsaturated,
		rawFieldsComplete,
		hitMasksComplete,
		finiteRgba32fFields: finiteFields,
		fieldDiagnosticEvidenceComplete: diagnosticEvidenceComplete,
		exactOneByOneDirectionalProbeEvidence: exactDirectionalProbeEvidence,
		cpuReplayEvidenceComplete,
		parentReplayEvidenceComplete: parentReplayComplete,
		artifactHashesRecorded: browserResult.panels
			.concat(
				browserResult.rawFields,
				browserResult.hitMasks,
				[browserResult.plot, browserResult.contactSheet],
			)
			.every((entry) => /^[a-f0-9]{64}$/u.test(entry.sha256)),
		cpuDisplayReplayWithinOneCode: cpuReplayWithinOneCode,
		exactParentPixelReplay: exactParentReplay,
		firstImageTimeTarget: progress.firstImage.targetMet,
		decisionPlateTimeTarget: progress.decisionPlate.targetMet,
	};
	const integrityGateNames = [
		'browserResultSchema',
		'allRequestedArtifactsWritten',
		'allRequestedImagesWritten',
		'sevenScenesInDeclaredOrder',
		'twentyEightStablePanels',
		'panelDimensions',
		'contactSheetUploadedLast',
		'controlModelIdentities',
		'sphericalGroundEndpoints',
		'noWebglErrors',
		'noBrowserServerErrors',
		'contextsHealthy',
		'actualD3d11Backend',
		'browserIdentityRecorded',
		'chromaticityAuthorityRecorded',
		'noDisplayCodeChromaticity',
		'installedRuntimes',
		'cacheIdentityAndReuse',
		'textureFreeInstalledDarkState',
		'darkStateProducesZeroFieldAndBlackSky',
		'rawFieldsComplete',
		'hitMasksComplete',
		'finiteRgba32fFields',
		'fieldDiagnosticEvidenceComplete',
		'exactOneByOneDirectionalProbeEvidence',
		'cpuReplayEvidenceComplete',
		'cpuDisplayReplayWithinOneCode',
		'parentReplayEvidenceComplete',
		'artifactHashesRecorded',
	];
	const integrityPassed = integrityGateNames.every((name) => gates[name]);
	return {
		gates,
		integrityPassed,
		accepted: integrityPassed && Object.values(gates).every(Boolean),
	};
}

async function failureProgress(run, error) {
	const browserEvidence = error?.browserEvidence ?? null;
	const uploads = Array.isArray(browserEvidence?.uploads) ? browserEvidence.uploads : [];
	const pngUploads = uploads
		.filter((entry) => entry.path?.endsWith('.png') && typeof entry.completedAt === 'string')
		.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt));
	const firstImage = pngUploads[0] ?? null;
	const decisionPlate = uploads.find(
		(entry) => entry.path === 'figures/cr1-six-scene-visual-baseline.png',
	) ?? null;
	const timedArtifact = (entry, targetMilliseconds) => {
		if (!entry) return null;
		const elapsed = elapsedMilliseconds(run.initializedAt, entry.completedAt);
		return {
			artifactPath: entry.path,
			completedAt: entry.completedAt,
			elapsedMilliseconds: elapsed,
			targetMilliseconds,
			targetMet: elapsed <= targetMilliseconds,
		};
	};
	return {
		schemaId: 'algorithm32-color-reset-progress-v1',
		runId: run.runId,
		initializedAt: run.initializedAt,
		failedAt: new Date().toISOString(),
		error: error instanceof Error ? error.message : String(error),
		firstImage: timedArtifact(firstImage, 180000),
		decisionPlate: timedArtifact(decisionPlate, 600000),
		browserProgressEvents: browserEvidence?.progressEvents ?? [],
	};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR1 accepts no arguments.');
	const outputImages = EXPECTED_SCENES.flatMap((scene) => [
		expectedPanelPath(scene.id, 'bruneton'),
		expectedPanelPath(scene.id, 'production-lift'),
		expectedPanelPath(scene.id, 'pre-display-luminance'),
		expectedPanelPath(scene.id, 'black-saturation-masks'),
	]).concat([
		'figures/cr1-field-luminance-summary.png',
		'figures/cr1-six-scene-visual-baseline.png',
	]);
	const rawFields = EXPECTED_SCENES.map((scene) => expectedRawFieldPath(scene.id));
	const hitMasks = EXPECTED_SCENES.map((scene) => expectedHitMaskPath(scene.id));
	const run = await initializeColorResetRunRecord({
		slug: 'six-scene-visual-baseline',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr1-inputs-v1',
			increment: 'CR1',
			fixture: 'experiments/extraterrestrial/color-reset/fixtures/cr1-six-scene-visual-baseline-v1.json',
			fixtureSha256: FIXTURE_SHA256,
			parentControl: {
				namespace: 'color-reset',
				runId: PARENT_RUN_ID,
				artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			},
			controlSnapshot: 'experiments/extraterrestrial/color-reset/controls/production-v1',
			controlSnapshotManifestSha256: SNAPSHOT_MANIFEST_SHA256,
			cachePackageRoot:
				'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1',
			scenes: EXPECTED_SCENES,
			viewport: {widthPixels: 640, heightPixels: 400, verticalFieldOfViewDegrees: 78},
			outputImages,
			rawFields,
			hitMasks,
			browserUploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr1-provenance-v1',
			operation:
				'Render the seven fixed scenes through unchanged Bruneton and current production lift, capture the common pre-display linear RGBY field and full-resolution scene hit mask, derive fixed diagnostics, replay the four immutable CR0 controls, and assemble the chronological plate before gates.',
			implementation: [
				'experiments/extraterrestrial/color-reset/runners/run-cr1-six-scene-visual-baseline.js',
				'experiments/extraterrestrial/color-reset/harness/color-reset-browser-run.js',
				'experiments/extraterrestrial/color-reset/harness/cr1-six-scene-visual-baseline-browser.js',
			],
			physicalInput:
				'qualified one-degree Native48/Z180/W27/F68/Native15/N4 caches, shared texture-free dark state, spherical ground, and Q30 quadratic-near-observer transport',
			colorControls: [
				'contained byte-identical BrunetonColorDisplayModel',
				'contained byte-identical BrunetonSourceLuminanceLiftColorDisplayModel',
			],
			derivations: [
				'pre-display Y = max(0, 0.2126 R + 0.7152 G + 0.0722 B)',
				'full-resolution top-down R8 scene hit mask retained after byte-equal control/diagnostic capture comparison',
				'exact one-by-one principal-ray Sun-center, sunward-horizon, and true-zenith probes',
				'fixed log10 luminance heatmap and geometry-separated display-code masks',
				'decoded top-down RGBA8 replay against color-reset/000004-control-smoke',
			],
			exclusions: [
				'no cache, transport, ozone, source-radiometry, Q30, or ground change',
				'no new appearance operation, exposure tuning, stars, disk, or scene objects',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr1-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr1-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan:
				'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr1---establish-the-complete-visual-baseline',
			cacheStatus: 'agents/topics/algorithm32/production/README.md',
			parentControl: `tmp/extraterrestrial/color-reset/runs/${PARENT_RUN_ID}`,
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let protectedBefore = null;
	let protectedAfter = null;
	let protectedAfterWritten = false;
	let runtimeBefore = null;
	let runtimeAfter = null;
	let runtimeAfterWritten = false;
	let parentBefore = null;
	let parentAfter = null;
	let parentAfterWritten = false;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		const fixtureDigest = await sha256File(FIXTURE_PATH);
		requireCondition(fixtureDigest === FIXTURE_SHA256, 'CR1 fixture changed.');
		const fixture = await readJson(FIXTURE_PATH);
		verifyFixtureContract(fixture);

		runtimeBefore = await captureRuntimeImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', runtimeBefore);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		parentBefore = await verifyParentControl();
		await run.writeJsonArtifact('evidence/parent-control-before.json', parentBefore);
		await run.writeJsonArtifact(
			'evidence/control-snapshot-verification.json',
			await verifyControlSnapshot(),
		);
		const browserClosure = await buildStaticModuleClosure({
			candidateRoot: COLOR_RESET_ROOT,
			entryFiles: ['harness/cr1-six-scene-visual-baseline-browser.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		});
		await run.writeJsonArtifact('evidence/browser-module-closure.json', browserClosure);
		const cacheInputs = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification.json', cacheInputs.evidence);
		await run.writeJsonArtifact(
			'browser/config.json',
			makeBrowserConfiguration(fixture, cacheInputs.scenes),
		);

		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr1-six-scene-visual-baseline-browser.js',
			exportName: 'runCr1SixSceneVisualBaselineBrowser',
			servedRoots: {'/cache/': CACHE_ROOT, '/parent/': PARENT_RUN_DIRECTORY},
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			allowedArtifactPaths: artifactPaths(fixture),
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: 900_000,
		});
		runtimeAfter = await captureRuntimeImplementationAfter(runtimeBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', runtimeAfter);
		runtimeAfterWritten = true;
		assertRuntimeImplementationUnchanged(runtimeBefore, runtimeAfter);

		const renderAnalysis = {
			...attachArtifactIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		const panelIdentities = makePanelIdentityEvidence({renderAnalysis, fixture, cacheInputs});
		await run.writeJsonArtifact('evidence/panel-identities.json', panelIdentities);
		await run.writeJsonArtifact('evidence/render-analysis.json', renderAnalysis);
		const fieldDiagnostics = makeFieldDiagnostics(renderAnalysis, fixture);
		await run.writeJsonArtifact('evidence/field-diagnostics.json', fieldDiagnostics);
		await run.writeJsonArtifact(
			'evidence/image-derivations.json',
			makeDerivedImageEvidence({
				renderAnalysis,
				fixture,
				runtimeImplementationBefore: runtimeBefore,
			}),
		);

		parentAfter = await verifyParentControl();
		await run.writeJsonArtifact('evidence/parent-control-after.json', parentAfter);
		parentAfterWritten = true;
		assertParentControlUnchanged(parentBefore, parentAfter);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		protectedAfterWritten = true;
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR1 protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			protectedBefore.flat32,
			protectedAfter.flat32,
			'CR1 protected Flat32 source',
		);

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			browserResult: renderAnalysis,
			browser,
			fixture,
			progress,
		});
		const conclusion = !decision.integrityPassed
			? 'failed'
			: decision.accepted
				? 'accepted'
				: 'rejected';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr1-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			claimBoundary:
				'Complete shape-matched visual and numerical baseline only; no twilight appearance, ambient-light mechanism, stellar appearance, or new Color candidate is accepted.',
			gates: decision.gates,
			progress,
			parentControl: {
				runId: PARENT_RUN_ID,
				artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
				replay: renderAnalysis.parentReplay,
			},
			cacheSelections: cacheInputs.evidence.selections,
			displayDifferences: renderAnalysis.scenes.map((scene) => ({
				sceneId: scene.sceneId,
				displayDifference: scene.displayDifference,
			})),
			outputs: {
				panels: renderAnalysis.panels,
				rawFields: renderAnalysis.rawFields,
				hitMasks: renderAnalysis.hitMasks,
				plot: renderAnalysis.plot,
				contactSheet: renderAnalysis.contactSheet,
			},
			protectedSourceUnchanged: true,
			parentControlUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR1 six-scene visual baseline`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			decision.integrityPassed
				? 'All seven fixed scenes, four stable image rows, seven RGBA32F fields, seven full-resolution R8 hit masks, the luminance plot, and the chronological plate completed before replay, timing, and diagnostic gates.'
				: 'The render or evidence path failed an integrity gate; every completed image, raw field, hit mask, and partial artifact remains preserved.',
			'',
			...Object.entries(decision.gates).map(
				([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`,
			),
			'',
			'Appearance defects are CR1 findings and do not by themselves reject this baseline.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					gates: decision.gates,
					progress,
					parentReplay: renderAnalysis.parentReplay,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			const runtimeAudit = {beforeRecorded: runtimeBefore !== null, afterRecorded: runtimeAfterWritten, matches: null, error: null};
			if (runtimeBefore !== null && !runtimeAfterWritten) {
				try {
					runtimeAfter = await captureRuntimeImplementationAfter(runtimeBefore);
					await run.writeJsonArtifact('evidence/runtime-implementation-after.json', runtimeAfter);
					runtimeAfterWritten = true;
					runtimeAudit.afterRecorded = true;
				} catch (auditError) {
					runtimeAudit.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (runtimeBefore && runtimeAfter) {
				try {
					assertRuntimeImplementationUnchanged(runtimeBefore, runtimeAfter);
					runtimeAudit.matches = true;
				} catch (auditError) {
					runtimeAudit.matches = false;
					runtimeAudit.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			const parentAudit = {beforeRecorded: parentBefore !== null, afterRecorded: parentAfterWritten, matches: null, error: null};
			if (parentBefore !== null && !parentAfterWritten) {
				try {
					parentAfter = await verifyParentControl();
					await run.writeJsonArtifact('evidence/parent-control-after.json', parentAfter);
					parentAfterWritten = true;
					parentAudit.afterRecorded = true;
				} catch (auditError) {
					parentAudit.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (parentBefore && parentAfter) {
				try {
					assertParentControlUnchanged(parentBefore, parentAfter);
					parentAudit.matches = true;
				} catch (auditError) {
					parentAudit.matches = false;
					parentAudit.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			const protectedAudit = {beforeRecorded: protectedBefore !== null, afterRecorded: protectedAfterWritten, matches: null, error: null};
			if (!protectedAfterWritten) {
				try {
					protectedAfter = {
						algorithm32: await createFileInventory(ALGORITHM32_ROOT),
						flat32: await createFileInventory(FLAT32_ROOT),
					};
					await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
					protectedAfterWritten = true;
					protectedAudit.afterRecorded = true;
				} catch (auditError) {
					protectedAudit.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (protectedBefore && protectedAfter) {
				try {
					assertFileInventoriesEqual(protectedBefore.algorithm32, protectedAfter.algorithm32, 'CR1 protected Algorithm32 source');
					assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR1 protected Flat32 source');
					protectedAudit.matches = true;
				} catch (auditError) {
					protectedAudit.matches = false;
					protectedAudit.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr1-failure-v1',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : null,
				browserEvidenceErrors: error?.evidenceErrors ?? [],
				browserCleanupErrors: error?.cleanupErrors ?? [],
				runtimeAudit,
				parentAudit,
				protectedAudit,
			});
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', await failureProgress(run, error));
			}
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {accepted: false, error: error instanceof Error ? error.message : String(error)},
				report: `# ${run.runId}: CR1 six-scene visual baseline failed\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
