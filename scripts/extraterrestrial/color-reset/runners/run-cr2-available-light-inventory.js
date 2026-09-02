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

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr2-available-light-inventory.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_PATH = path.join(COLOR_RESET_ROOT, 'fixtures', 'cr2-available-light-inventory-v1.json');
const CACHE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);
const PARENT_RUN_ID = '000005-six-scene-visual-baseline';
const PARENT_ARTIFACT_SET_SHA256 = '2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc';
const PARENT_MANIFEST_SHA256 = '3ba1199191f6b9dd825b0475c7d329a4b0be84e441db655d354bdce234f6949b';
const PARENT_RUN_DIRECTORY = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	PARENT_RUN_ID,
);
const PARENT_MANIFEST_PATH = path.join(PARENT_RUN_DIRECTORY, 'artifact-manifest.json');
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const FIXTURE_SHA256 = '873086fe8dfdfe7db11f08aa0b9048f9d4e8dc605dd8d75ec9b146fc34b259d2';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY = 'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const EXPECTED_SCENES = Object.freeze([
	{id: 'solar-noon', timeIso: '2024-06-20T20:08:00.000Z', status: 'ready', bin: 14},
	{id: 'sunset-minus-60-minutes', timeIso: '2024-06-21T02:26:03.503Z', status: 'ready', bin: 79},
	{id: 'sunset-minus-10-minutes', timeIso: '2024-06-21T03:16:03.503Z', status: 'ready', bin: 88},
	{id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z', status: 'ready', bin: 90},
	{id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z', status: 'ready', bin: 92},
	{id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z', status: 'ready', bin: 100},
	{id: 'sunset-plus-120-minutes', timeIso: '2024-06-21T05:26:03.503Z', status: 'dark', bin: null},
]);
const EXPECTED_IMAGES = Object.freeze([
	'figures/cr2-direct-diffuse-illuminance.png',
	'figures/cr2-native15-spectral-strips.png',
	'figures/cr2-horizon-zenith-background.png',
	'figures/cr2-annotated-cr1-baseline.png',
]);
const EXPECTED_RAW_RADIANCES = Object.freeze(EXPECTED_SCENES.map(
	(scene) => `data/receiver-diffuse-radiance-${scene.id}.f32le`,
));
const PARENT_ARTIFACTS = Object.freeze({
	contactSheet: {
		path: 'figures/cr1-six-scene-visual-baseline.png',
		sha256: '990c10625d66528902a7503fe4bb485713916c3bf9e3458071aeb9bf9f31b1f1',
	},
	renderAnalysis: {
		path: 'evidence/render-analysis.json',
		sha256: 'd5525a54248d61c0f6606e8371181e569c9f6926e7729c555e906cb0286e01fe',
	},
	fieldDiagnostics: {
		path: 'evidence/field-diagnostics.json',
		sha256: '6f4f5440a8d38424047bf3fd4ef434261ab5b32cdac29b062192b538a9ebd87b',
	},
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function percentile(entries, requested) {
	return entries?.find((entry) => entry.percentile === requested)?.value ?? null;
}

function probe(scene, id) {
	return scene.field?.probes?.find((entry) => entry.id === id)?.luminance ?? null;
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr2-available-light-inventory-input-v1',
		'CR2 fixture schema changed.',
	);
	requireCondition(fixture.scenes?.length === EXPECTED_SCENES.length, 'CR2 scene count changed.');
	for (let index = 0; index < EXPECTED_SCENES.length; index += 1) {
		const expected = EXPECTED_SCENES[index];
		const actual = fixture.scenes[index];
		requireCondition(
			actual?.id === expected.id &&
				actual.timeIso === expected.timeIso &&
				actual.cacheExpectation?.status === expected.status &&
				(expected.status === 'dark' ||
					actual.cacheExpectation.representativeSolarZenithDegrees === expected.bin),
			`CR2 scene ${index} changed identity, order, time, or cache expectation.`,
		);
	}
	requireCondition(
		fixture.parentControl?.runId === PARENT_RUN_ID &&
			fixture.parentControl.artifactSetSha256 === PARENT_ARTIFACT_SET_SHA256,
		'CR2 parent-control identity changed.',
	);
	for (const [key, expected] of Object.entries(PARENT_ARTIFACTS)) {
		requireCondition(
			fixture.parentControl[key]?.path === expected.path &&
				fixture.parentControl[key]?.sha256 === expected.sha256,
			`CR2 parent artifact ${key} changed.`,
		);
	}
	requireCondition(
		JSON.stringify(fixture.outputs?.images) === JSON.stringify(EXPECTED_IMAGES) &&
			JSON.stringify(fixture.outputs?.rawDiffuseRadiances) === JSON.stringify(EXPECTED_RAW_RADIANCES),
		'CR2 output declarations changed.',
	);
	requireCondition(
		fixture.measurement?.spectralChannelCount === 15 &&
			fixture.measurement.spectralQuantity === 'spectral-irradiance-density' &&
			fixture.measurement.spectralUnits === 'W m^-2 nm^-1' &&
			fixture.measurement.diffuse?.quadrature?.sampleCount === 4096 &&
			fixture.measurement.diffuse.quadrature.muSampleCount === 64 &&
			fixture.measurement.diffuse.quadrature.azimuthSampleCount === 64 &&
			fixture.measurement.repeatCount === 2,
		'CR2 measurement contract changed.',
	);
	const artifacts = [...fixture.outputs.rawDiffuseRadiances, ...fixture.outputs.images];
	requireCondition(
		artifacts.length === 11 && new Set(artifacts).size === artifacts.length,
		'CR2 requires exactly eleven unique browser artifacts.',
	);
}

async function verifyParentControl() {
	await assertNoReparseEntries(PARENT_RUN_DIRECTORY, 'CR2 parent control run');
	const summary = await verifyColorResetRun(PARENT_RUN_ID);
	requireCondition(
		summary.verified === true &&
			summary.conclusion === 'accepted' &&
			summary.artifactSetSha256 === PARENT_ARTIFACT_SET_SHA256,
		'CR2 parent run is not the accepted immutable CR1 control.',
	);
	const manifestFacts = await lstat(PARENT_MANIFEST_PATH);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink(),
		'CR2 parent manifest is not an ordinary file.',
	);
	const manifestSha256 = await sha256File(PARENT_MANIFEST_PATH);
	requireCondition(manifestSha256 === PARENT_MANIFEST_SHA256, 'CR2 parent manifest changed.');
	const manifest = await readJson(PARENT_MANIFEST_PATH);
	const byPath = new Map(manifest.artifacts.map((entry) => [entry.path, entry]));
	const artifacts = {};
	for (const [key, expected] of Object.entries(PARENT_ARTIFACTS)) {
		const artifact = byPath.get(expected.path);
		requireCondition(
			artifact?.sha256 === expected.sha256 && Number.isSafeInteger(artifact.byteLength),
			`CR2 parent artifact ${expected.path} changed.`,
		);
		artifacts[key] = {...expected, byteLength: artifact.byteLength};
	}
	const analysis = await readJson(path.join(PARENT_RUN_DIRECTORY, PARENT_ARTIFACTS.renderAnalysis.path));
	requireCondition(
		analysis.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1' &&
			analysis.scenes?.length === EXPECTED_SCENES.length,
		'CR2 parent render analysis changed schema or scene count.',
	);
	const fields = analysis.scenes.map((scene, index) => {
		requireCondition(scene.sceneId === EXPECTED_SCENES[index].id, 'CR2 parent scene order changed.');
		const record = {
			sceneId: scene.sceneId,
			label: scene.label,
			solarZenithDegrees: scene.solarZenithDegrees,
			cacheStatus: scene.cacheStatus,
			cacheIdentity: scene.cacheIdentity,
			currentDirectSourceProxy: scene.frames?.['production-lift']?.brightnessProxy,
			backgroundMedianLuminance: percentile(scene.field?.percentiles, 50),
			horizonMedianLuminance: percentile(scene.field?.regions?.horizonBand?.percentiles, 50),
			upperSkyMedianLuminance: percentile(scene.field?.regions?.upperSky?.percentiles, 50),
			zenithLuminance: probe(scene, 'zenith'),
		};
		requireCondition(
			[
				record.solarZenithDegrees,
				record.backgroundMedianLuminance,
				record.horizonMedianLuminance,
				record.upperSkyMedianLuminance,
				record.zenithLuminance,
				record.currentDirectSourceProxy?.value,
			].every(Number.isFinite),
			`CR2 parent scene ${scene.sceneId} lacks finite field context.`,
		);
		return record;
	});
	return {
		evidence: {
			schemaId: 'algorithm32-color-reset-cr2-parent-control-verification-v1',
			namespace: 'color-reset',
			runPath: `tmp/extraterrestrial/color-reset/runs/${PARENT_RUN_ID}`,
			summary,
			manifest: {
				path: `tmp/extraterrestrial/color-reset/runs/${PARENT_RUN_ID}/artifact-manifest.json`,
				sha256: manifestSha256,
				artifactSetSha256: manifest.artifactSetSha256,
			},
			artifacts,
			fields,
		},
		browserParent: {
			runId: PARENT_RUN_ID,
			artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			contactSheetUrl: `/parent/${PARENT_ARTIFACTS.contactSheet.path}`,
			contactSheetPath: PARENT_ARTIFACTS.contactSheet.path,
			contactSheetSha256: PARENT_ARTIFACTS.contactSheet.sha256,
			contactSheetWidth: analysis.contactSheet.width,
			contactSheetHeight: analysis.contactSheet.height,
			contactSheetLabelHeight: analysis.contactSheet.labelHeight,
			renderAnalysis: PARENT_ARTIFACTS.renderAnalysis,
			fieldDiagnostics: PARENT_ARTIFACTS.fieldDiagnostics,
			fields,
		},
	};
}

function assertParentControlUnchanged(before, after) {
	requireCondition(
		before.manifest.sha256 === after.manifest.sha256 &&
			before.manifest.artifactSetSha256 === after.manifest.artifactSetSha256 &&
			JSON.stringify(before.artifacts) === JSON.stringify(after.artifacts) &&
			JSON.stringify(before.fields) === JSON.stringify(after.fields),
		'CR2 parent control changed while it was used.',
	);
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR2 control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.fileCount === 147,
		'CR2 control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map((entry) => entry.path));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR2 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR2 snapshot and production closure');
	return {
		schemaId: 'algorithm32-color-reset-control-snapshot-verification-v1',
		accepted: true,
		manifestPath: 'scripts/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
		manifestSha256: manifestHash,
		inventory: snapshotInventory,
		productionSelection,
	};
}

async function captureRuntimeImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr2-available-light-inventory.js',
			'color-reset/harness/cr2-available-light-inventory-browser.js',
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
	requireCondition(threePackage.version === '0.180.0', 'CR2 requires locked Three 0.180.0.');
	return {
		schemaId: 'algorithm32-color-reset-cr2-runtime-implementation-before-v1',
		implementation: {closure: implementationClosure, inventory: implementationInventory},
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
		schemaId: 'algorithm32-color-reset-cr2-runtime-implementation-after-v1',
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
		'CR2 runtime implementation',
	);
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR2 browser-served Three ESM closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 === after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR2 package boundary changed while the browser was executing.',
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
		`${scene.id} resolved the wrong one-degree bin.`,
	);
	requireCondition(resolution.asset.assetRoot.startsWith('/cache/'), `${scene.id} cache root is invalid.`);
	const packageRelative = resolution.asset.assetRoot.slice('/cache/'.length).replace(/\/$/u, '');
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
		manifest.cacheIdentity === resolution.asset.loadRequest.cacheIdentity &&
			manifest.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			manifest.selection?.representativeSolarZenithDegrees ===
				scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} cache manifest identity changed.`,
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
		manifest: {path: resolution.asset.loadRequest.manifestPath, sha256: manifestDigest},
		ledger: {path: manifest.ledgerPath, byteLength: ledgerFacts.size, sha256: ledgerDigest},
		exactSeamPayload,
		logicalToUniqueIndex,
		numericalIdentity: manifest.numericalIdentity,
	};
}

async function resolveAndVerifyCacheInputs(fixture) {
	await assertNoReparseEntries(CACHE_ROOT, 'CR2 runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const reportDigest = await sha256File(reportPath);
	requireCondition(reportDigest === PACKAGE_REPORT_SHA256, 'CR2 package report changed.');
	const report = await readJson(reportPath);
	requireCondition(report.accepted === true && report.packageCount === 109, 'CR2 package report is not accepted.');
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR2 runtime cache catalog');
	const catalogDigest = await sha256File(catalogPath);
	requireCondition(
		catalogDigest === CATALOG_SHA256 && catalogDigest === report.catalogSha256,
		'CR2 runtime catalog changed.',
	);
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
			schemaId: 'algorithm32-color-reset-cr2-cache-input-verification-v1',
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

function makeBrowserConfiguration(fixture, scenes, parentControl) {
	return {
		schemaId: 'algorithm32-color-reset-cr2-browser-config-v1',
		location: fixture.location,
		observer: fixture.observer,
		camera: fixture.camera,
		physicalControls: fixture.physicalControls,
		measurement: fixture.measurement,
		diagnostics: fixture.diagnostics,
		outputs: fixture.outputs,
		scenes,
		parentControl,
	};
}

function elapsedMilliseconds(initializedAt, completedAt) {
	return Date.parse(completedAt) - Date.parse(initializedAt);
}

function makeProgress(run, browser, fixture) {
	const imagePaths = new Set(fixture.outputs.images);
	const images = browser.uploads
		.filter((entry) => imagePaths.has(entry.path))
		.slice()
		.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt));
	const firstImage = images[0];
	const decisionPlate = browser.uploads.find(
		(entry) => entry.path === fixture.outputs.annotatedContactSheet,
	);
	requireCondition(firstImage && decisionPlate, 'CR2 progress artifacts are incomplete.');
	const firstImageElapsedMilliseconds = elapsedMilliseconds(run.initializedAt, firstImage.completedAt);
	const decisionPlateElapsedMilliseconds = elapsedMilliseconds(
		run.initializedAt,
		decisionPlate.completedAt,
	);
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
			artifactPath: decisionPlate.path,
			completedAt: decisionPlate.completedAt,
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
		requireCondition(upload, `CR2 browser result has no upload identity for ${record.artifactPath}.`);
		requireCondition(
			record.byteLength === upload.byteLength,
			`CR2 browser/server byte lengths differ for ${record.artifactPath}.`,
		);
		return {...record, sha256: upload.sha256, completedAt: upload.completedAt};
	};
	requireCondition(
		Array.isArray(browserResult.images) &&
			Array.isArray(browserResult.rawDiffuseRadiances) &&
			Array.isArray(browserResult.scenes),
		'CR2 browser result omits images, raw radiances, or scenes.',
	);
	return {
		...browserResult,
		images: browserResult.images.map(attach),
		rawDiffuseRadiances: browserResult.rawDiffuseRadiances.map(attach),
	};
}

function finiteNonnegativeVector(values, length) {
	return Array.isArray(values) &&
		values.length === length &&
		values.every((value) => Number.isFinite(value) && value >= 0);
}

function packetValid(packet, basisHash) {
	return packet?.kind === 'algorithm32-spectral-packet' &&
		packet.quantity === 'spectral-irradiance-density' &&
		packet.units === 'W m^-2 nm^-1' &&
		packet.semantics === 'contiguous-wavelength-bin-average' &&
		packet.basisHash === basisHash &&
		typeof packet.contentHash === 'string' &&
		typeof packet.provenanceIdentity === 'string' &&
		finiteNonnegativeVector(packet.values, 15);
}

function valuesWithinEquation(actual, expected, absoluteFloor = 1e-12, relative = 1e-10) {
	return actual.length === expected.length && actual.every((value, index) =>
		Math.abs(value - expected[index]) <= absoluteFloor + relative * Math.max(Math.abs(value), Math.abs(expected[index])),
	);
}

function allZero(values, tolerance) {
	return values.every((value) => Math.abs(value) <= tolerance);
}

function installedRuntime(value) {
	return value?.status === 'installed' &&
		value.runtime?.status === 'ready' &&
		value.runtime.renderErrorCount === 0 &&
		value.runtime.lastRenderError === null;
}

function evaluateGates({analysis, browser, fixture, progress, cacheInputs}) {
	const expectedUploads = [...fixture.outputs.rawDiffuseRadiances, ...fixture.outputs.images];
	const selections = new Map(cacheInputs.evidence.selections.map((entry) => [entry.sceneId, entry]));
	const stability = fixture.measurement.stability;
	const integrityGates = {
		browserResultSchema:
			analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		allRequestedArtifactsWritten:
			browser.uploads.length === expectedUploads.length &&
			JSON.stringify(browser.uploads.map((entry) => entry.path)) === JSON.stringify(expectedUploads),
		allRequestedImagesWritten:
			analysis.images.length === EXPECTED_IMAGES.length &&
			JSON.stringify(analysis.images.map((entry) => entry.artifactPath)) === JSON.stringify(EXPECTED_IMAGES),
		contactSheetUploadedLast:
			browser.uploads.at(-1)?.path === fixture.outputs.annotatedContactSheet,
		sevenScenesInDeclaredOrder:
			analysis.scenes.length === EXPECTED_SCENES.length &&
			analysis.scenes.every((scene, index) =>
				scene.sceneId === EXPECTED_SCENES[index].id &&
				scene.timeIso === EXPECTED_SCENES[index].timeIso &&
				scene.cacheStatus === EXPECTED_SCENES[index].status,
			),
		rawRadiancesComplete:
			analysis.rawDiffuseRadiances.length === EXPECTED_RAW_RADIANCES.length &&
			analysis.rawDiffuseRadiances.every((record, index) =>
				record.sceneId === EXPECTED_SCENES[index].id &&
				record.artifactPath === EXPECTED_RAW_RADIANCES[index] &&
				record.byteLength === 4096 * 15 * 4 &&
				record.directionCount === 4096 &&
				record.channelCount === 15 &&
				record.storage === 'little-endian float32, direction-major then Native15 channel',
			),
		artifactHashesRecorded:
			[...analysis.images, ...analysis.rawDiffuseRadiances].every(
				(record) => /^[0-9a-f]{64}$/u.test(record.sha256) && Number.isSafeInteger(record.byteLength),
			),
		parentContactSheetPreserved:
			analysis.parentContactSheet?.sourceSha256 === PARENT_ARTIFACTS.contactSheet.sha256 &&
			analysis.parentContactSheet?.sourceWidth === 2560 &&
			analysis.parentContactSheet?.sourceHeight === 3066 &&
			analysis.parentContactSheet?.leftRectangleExact === true &&
			analysis.parentContactSheet?.leftRectangleDifferingPixelCount === 0,
		noWebglErrors:
			analysis.scenes.every((scene) => Array.isArray(scene.webglErrors) && scene.webglErrors.length === 0),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		contextsHealthy: analysis.scenes.every((scene) => scene.contextLost === false),
		actualD3d11Backend:
			analysis.scenes.every((scene) =>
				typeof scene.gpu?.renderer === 'string' &&
				scene.gpu.renderer.includes('Direct3D11') &&
				!scene.gpu.renderer.includes('Microsoft Basic Render Driver') &&
				scene.gpu.maximumTextureSize >= 4096,
			),
		installedRuntimes: analysis.scenes.every((scene) => installedRuntime(scene.runtimeDiagnostics)),
		cacheIdentityAndStatus:
			analysis.scenes.every((scene) => {
				const selection = selections.get(scene.sceneId);
				return selection?.status === scene.cacheStatus &&
					(scene.cacheStatus === 'dark'
						? scene.cacheIdentity === 'algorithm32-distant-sun-shared-dark-v1' &&
							scene.cacheRuntime?.bindingCount === 0
						: scene.cacheIdentity === selection.cacheIdentity && scene.cacheRuntime?.bindingCount === 2);
			}),
	};

	const measurementIntegrity = analysis.scenes.map((scene) => {
		const measurement = scene.measurement;
		const basisHash = measurement?.spectralBasis?.contentHash;
		const packets = measurement?.packets ?? {};
		const packetNames = [
			'directNormal',
			'directHorizontal',
			'diffuseHorizontal',
			'totalHorizontal',
			'diffuseRepeat',
			'diffuseRotated',
			'diffuseProduction32',
		];
		const factor = measurement?.orientation?.horizontalProjectionFactor;
		return {
			sceneId: scene.sceneId,
			basis:
				measurement?.spectralBasis?.channelCount === 15 &&
				measurement.spectralBasis.channels?.length === 15 &&
				measurement.spectralBasis.channels.every((channel) =>
					channel.center?.units === 'nanometers' &&
					channel.width?.units === 'nanometers' &&
					Number.isFinite(channel.center.value) &&
					Number.isFinite(channel.width.value) &&
					channel.width.value > 0,
				),
			packets: packetNames.every((name) => packetValid(packets[name], basisHash)),
			directProjection:
				Number.isFinite(factor) && factor >= 0 && factor <= 1 &&
				valuesWithinEquation(
					packets.directHorizontal?.values ?? [],
					(packets.directNormal?.values ?? []).map((value) => value * factor),
				),
			totalEquation: valuesWithinEquation(
				packets.totalHorizontal?.values ?? [],
				(packets.directHorizontal?.values ?? []).map(
					(value, index) => value + packets.diffuseHorizontal.values[index],
				),
			),
			photopic:
				['directNormal', 'directHorizontal', 'diffuseHorizontal', 'totalHorizontal'].every((name) =>
					Number.isFinite(measurement?.photopic?.[name]?.illuminance?.value) &&
					measurement.photopic[name].illuminance.units === 'lux' &&
					Number.isFinite(measurement.photopic[name].equivalentLuminance?.value) &&
					measurement.photopic[name].equivalentLuminance.units === 'cd m^-2',
				),
			quadrature:
				measurement?.quadrature?.primary?.sampleCount === 4096 &&
				measurement.quadrature.primary.muSampleCount === 64 &&
				measurement.quadrature.primary.azimuthSampleCount === 64 &&
				Math.abs(measurement.quadrature.primary.weightSumSteradians - Math.PI) <= 1e-12 &&
				measurement.quadrature.rotated?.sampleCount === 4096 &&
				Math.abs(measurement.quadrature.rotated.weightSumSteradians - Math.PI) <= 1e-12 &&
				measurement.quadrature.productionCrossCheck?.sampleCount === 32,
			colorUnchanged:
				measurement?.colorState?.unchanged === true &&
				measurement.colorState.before?.colorId === 'bruneton-figure1-display' &&
				JSON.stringify(measurement.colorState.before) === JSON.stringify(measurement.colorState.after),
		};
	});
	integrityGates.measurementSchemasAndUnits = measurementIntegrity.every(
		(record) => record.basis && record.packets && record.directProjection &&
			record.totalEquation && record.photopic && record.quadrature,
	);
	integrityGates.colorStateUnchanged = measurementIntegrity.every((record) => record.colorUnchanged);

	const scientificByScene = analysis.scenes.map((scene) => {
		const measurement = scene.measurement;
		const repeat = measurement.stability.integratedPrimaryRepeat;
		const repeatChannelsPass = measurement.packets.diffuseHorizontal.values.every((value, index) =>
			Math.abs(value - measurement.packets.diffuseRepeat.values[index]) <=
				stability.repeatAbsoluteIrradianceFloor +
				stability.repeatRelativeIrradianceDifference *
					Math.max(Math.abs(value), Math.abs(measurement.packets.diffuseRepeat.values[index])),
		);
		const rotation = measurement.stability.rotation;
		const rotationChannelsPass = rotation.channels.every((channel) =>
			channel.significant
				? channel.symmetricRelativeDifference <=
					stability.rotationMaximumSymmetricRelativeChannelDifference
				: channel.absoluteDifference <=
					stability.rotationMaximumAbsoluteSubfloorChannelDifference,
		);
		return {
			sceneId: scene.sceneId,
			directProxyReplay:
				measurement.photopic.directProxyAbsoluteDifference <=
					stability.directProxyMaximumAbsoluteDifferenceCdPerSquareMeter,
			repeat:
				repeatChannelsPass &&
				Number.isFinite(repeat.maximumAbsoluteDifference) &&
				Number.isFinite(repeat.maximumRelativeDifference),
			rotation:
				rotation.photopic.symmetricRelativeDifference <=
					stability.rotationMaximumSymmetricRelativePhotopicDifference &&
				rotationChannelsPass,
		};
	});
	const byScene = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const plus10 = byScene.get('sunset-plus-10-minutes');
	const plus60 = byScene.get('sunset-plus-60-minutes');
	const sunset = byScene.get('sunset');
	const dark = byScene.get('sunset-plus-120-minutes');
	const diffuseLux = (scene) => scene.measurement.photopic.diffuseHorizontal.illuminance.value;
	const readyDiffuseMatchesField = analysis.scenes
		.filter((scene) => scene.cacheStatus === 'ready' && scene.parentField.backgroundMedianLuminance > 0)
		.every((scene) => diffuseLux(scene) > 0);
	const postSunsetDirectZero = [plus10, plus60].every((scene) =>
		allZero(scene.measurement.packets.directNormal.values, stability.darkMaximumAbsoluteValue),
	);
	const darkZero = [
		'directNormal',
		'directHorizontal',
		'diffuseHorizontal',
		'totalHorizontal',
		'diffuseRepeat',
		'diffuseRotated',
		'diffuseProduction32',
	].every((name) => allZero(dark.measurement.packets[name].values, stability.darkMaximumAbsoluteValue)) &&
		dark.parentField.backgroundMedianLuminance === 0 &&
		dark.parentField.horizonMedianLuminance === 0 &&
		dark.parentField.zenithLuminance === 0;
	const scientificGates = {
		directProxyReplaysParent: scientificByScene.every((record) => record.directProxyReplay),
		independentRepeatStable: scientificByScene.every((record) => record.repeat),
		rotatedQuadratureStable: scientificByScene.every((record) => record.rotation),
		diffusePresentWithReadySkyField: readyDiffuseMatchesField,
		postSunsetDirectSupportIsZero: postSunsetDirectZero,
		twilightDiffuseDistinguishesTenAndSixtyMinutes:
			diffuseLux(plus10) > diffuseLux(plus60) && diffuseLux(plus60) > 0,
		twilightDiffuseFallsChronologically:
			diffuseLux(sunset) > diffuseLux(plus10) && diffuseLux(plus10) > diffuseLux(plus60),
		declaredDarkStateExactlyZero: darkZero,
		firstImageTimeTarget: progress.firstImage.targetMet,
		decisionPlateTimeTarget: progress.decisionPlate.targetMet,
	};
	const integrityPassed = Object.values(integrityGates).every(Boolean);
	const accepted = integrityPassed && Object.values(scientificGates).every(Boolean);
	return {
		integrityPassed,
		accepted,
		gates: {...integrityGates, ...scientificGates},
		measurementIntegrity,
		scientificByScene,
	};
}

function makeImageDerivations(analysis, fixture) {
	return {
		schemaId: 'algorithm32-color-reset-cr2-image-derivations-v1',
		parent: {
			runId: PARENT_RUN_ID,
			artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
			artifacts: PARENT_ARTIFACTS,
		},
		images: analysis.images.map((image) => ({
			artifactPath: image.artifactPath,
			sha256: image.sha256,
			byteLength: image.byteLength,
			kind: image.kind,
			operation: image.derivation,
			measurementSchema: analysis.schemaId,
			fixtureSha256: FIXTURE_SHA256,
		})),
		rawDiffuseRadiances: analysis.rawDiffuseRadiances.map((record) => ({
			...record,
			derivation:
				'unchanged common Q30 path radiance at each primary 64x64 receiver quadrature direction, packed direction-major then Native15 channel as f32le',
		})),
		measurementEquations: fixture.measurement,
	};
}

async function failureProgress(run, error, completedBrowser = null) {
	const browserEvidence = error?.browserEvidence ?? completedBrowser;
	const uploads = browserEvidence?.uploads ?? [];
	const imageSet = new Set(EXPECTED_IMAGES);
	const firstImage = uploads
		.filter((entry) => imageSet.has(entry.path))
		.slice()
		.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt))[0] ?? null;
	const decisionPlate = uploads.find((entry) => entry.path === EXPECTED_IMAGES.at(-1)) ?? null;
	const timed = (record, targetMilliseconds) => record === null ? null : {
		artifactPath: record.path,
		completedAt: record.completedAt,
		elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, record.completedAt),
		targetMilliseconds,
		targetMet: elapsedMilliseconds(run.initializedAt, record.completedAt) <= targetMilliseconds,
	};
	return {
		schemaId: 'algorithm32-color-reset-progress-v1',
		runId: run.runId,
		initializedAt: run.initializedAt,
		failedAt: new Date().toISOString(),
		error: error instanceof Error ? error.message : String(error),
		firstImage: timed(firstImage, 180000),
		decisionPlate: timed(decisionPlate, 600000),
		browserProgressEvents: browserEvidence?.progressEvents ?? [],
	};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR2 accepts no arguments.');
	const run = await initializeColorResetRunRecord({
		slug: 'available-light-inventory',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr2-inputs-v1',
			increment: 'CR2',
			fixture: 'scripts/extraterrestrial/color-reset/fixtures/cr2-available-light-inventory-v1.json',
			fixtureSha256: FIXTURE_SHA256,
			parentControl: {
				namespace: 'color-reset',
				runId: PARENT_RUN_ID,
				artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
				manifestSha256: PARENT_MANIFEST_SHA256,
			},
			controlSnapshot: 'scripts/extraterrestrial/color-reset/controls/production-v1',
			controlSnapshotManifestSha256: SNAPSHOT_MANIFEST_SHA256,
			cachePackageRoot:
				'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1',
			scenes: EXPECTED_SCENES,
			measurement: {
				direct: 'configured direct-normal plus local-horizontal center-direction projection',
				diffuse:
					'common Q30 sky radiance integrated on a 64 x 64 midpoint mu/azimuth upper-hemisphere grid',
				rotationSensitivity: 'same 64 x 64 grid rotated by one half azimuth cell',
				productionCrossCheck: 'frozen 32-direction Hammersley receiver-light quadrature',
			},
			outputImages: EXPECTED_IMAGES,
			rawDiffuseRadiances: EXPECTED_RAW_RADIANCES,
			browserUploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr2-provenance-v1',
			operation:
				'Measure separate unit-bearing Native15 direct-normal, direct-horizontal, cosine-weighted diffuse-horizontal, and total-horizontal receiver irradiance across the seven fixed CR1 scenes without changing Color, then render all four declared diagnostic figures before gates.',
			implementation: [
				'scripts/extraterrestrial/color-reset/runners/run-cr2-available-light-inventory.js',
				'scripts/extraterrestrial/color-reset/harness/color-reset-browser-run.js',
				'scripts/extraterrestrial/color-reset/harness/cr2-available-light-inventory-browser.js',
				'scripts/extraterrestrial/color-reset/lighting/Cr2ReceiverDiffuseQuadrature.js',
				'scripts/extraterrestrial/color-reset/lighting/Cr2ReceiverDiffuseTransportShader.js',
				'scripts/extraterrestrial/color-reset/lighting/Cr2ReceiverDiffuseTransportSampler.js',
				'scripts/extraterrestrial/color-reset/lighting/Cr2ReceiverLightMeasurement.js',
			],
			physicalInput:
				'qualified one-degree Native48/Z180/W27/F68/Native15/N4 caches, shared texture-free dark state, spherical ground, and Q30 quadratic-near-observer transport',
			derivations: [
				'direct-horizontal(lambda) = direct-normal(lambda) * max(0, dot(localUp, sourceCenterDirection))',
				'diffuse-horizontal(lambda) = integral over upper hemisphere of sky radiance(lambda, omega) * max(0, dot(localUp, omega)) dOmega',
				'total-horizontal(lambda) = direct-horizontal(lambda) + diffuse-horizontal(lambda)',
				'photopic illuminance = 683 * sum spectral irradiance density * wavelength-bin width * CIE 1931 y-bar',
			],
			exclusions: [
				'no Color publication, exposure adjustment, or new display candidate',
				'no cache, transport, ozone, source-radiometry, Q30, ground, star, or scene-object change',
				'no claim of continuity at 108 degrees from the seven fixed scenes',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr2-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr2-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan:
				'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr2---measure-the-light-that-remains-at-twilight',
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
	let browser = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		const fixtureDigest = await sha256File(FIXTURE_PATH);
		requireCondition(fixtureDigest === FIXTURE_SHA256, 'CR2 fixture changed.');
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
		await run.writeJsonArtifact('evidence/parent-control-before.json', parentBefore.evidence);
		await run.writeJsonArtifact(
			'evidence/control-snapshot-verification.json',
			await verifyControlSnapshot(),
		);
		const browserClosure = await buildStaticModuleClosure({
			candidateRoot: COLOR_RESET_ROOT,
			entryFiles: ['harness/cr2-available-light-inventory-browser.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		});
		await run.writeJsonArtifact('evidence/browser-module-closure.json', browserClosure);
		const cacheInputs = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification.json', cacheInputs.evidence);
		await run.writeJsonArtifact(
			'browser/config.json',
			makeBrowserConfiguration(fixture, cacheInputs.scenes, parentBefore.browserParent),
		);

		browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr2-available-light-inventory-browser.js',
			exportName: 'runCr2AvailableLightInventoryBrowser',
			servedRoots: {'/cache/': CACHE_ROOT, '/parent/': PARENT_RUN_DIRECTORY},
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			allowedArtifactPaths: [
				...fixture.outputs.rawDiffuseRadiances,
				...fixture.outputs.images,
			],
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: 900_000,
		});

		runtimeAfter = await captureRuntimeImplementationAfter(runtimeBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', runtimeAfter);
		runtimeAfterWritten = true;
		assertRuntimeImplementationUnchanged(runtimeBefore, runtimeAfter);
		const analysis = {
			...attachArtifactIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		await run.writeJsonArtifact('evidence/measurement-analysis.json', analysis);
		await run.writeJsonArtifact(
			'evidence/image-derivations.json',
			makeImageDerivations(analysis, fixture),
		);

		parentAfter = await verifyParentControl();
		await run.writeJsonArtifact('evidence/parent-control-after.json', parentAfter.evidence);
		parentAfterWritten = true;
		assertParentControlUnchanged(parentBefore.evidence, parentAfter.evidence);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		protectedAfterWritten = true;
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR2 protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			protectedBefore.flat32,
			protectedAfter.flat32,
			'CR2 protected Flat32 source',
		);

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, cacheInputs});
		const conclusion = !decision.integrityPassed
			? 'failed'
			: decision.accepted
				? 'accepted'
				: 'rejected';
		const sceneInventory = analysis.scenes.map((scene) => ({
			sceneId: scene.sceneId,
			timeIso: scene.timeIso,
			solarZenithDegrees: scene.solarZenithDegrees,
			cacheStatus: scene.cacheStatus,
			directNormalLux: scene.measurement.photopic.directNormal.illuminance.value,
			directHorizontalLux: scene.measurement.photopic.directHorizontal.illuminance.value,
			diffuseHorizontalLux: scene.measurement.photopic.diffuseHorizontal.illuminance.value,
			totalHorizontalLux: scene.measurement.photopic.totalHorizontal.illuminance.value,
			parentBackgroundMedianCdPerSquareMeter: scene.parentField.backgroundMedianLuminance,
			parentHorizonMedianCdPerSquareMeter: scene.parentField.horizonMedianLuminance,
			parentZenithCdPerSquareMeter: scene.parentField.zenithLuminance,
			rotationPhotopicSymmetricRelativeDifference:
				scene.measurement.stability.rotation.photopic.symmetricRelativeDifference,
			repeatMaximumAbsoluteDifference:
				scene.measurement.stability.integratedPrimaryRepeat.maximumAbsoluteDifference,
		}));
		const proof = {
			schemaId: 'algorithm32-color-reset-cr2-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			claimBoundary:
				'Receiver-light inventory only. CR2 accepts no Color candidate, ambient-light bridge, twilight appearance, stellar behavior, or continuity claim at the 108-degree cache transition.',
			gates: decision.gates,
			measurementIntegrity: decision.measurementIntegrity,
			scientificByScene: decision.scientificByScene,
			progress,
			parentControl: {
				runId: PARENT_RUN_ID,
				artifactSetSha256: PARENT_ARTIFACT_SET_SHA256,
				manifestSha256: PARENT_MANIFEST_SHA256,
			},
			cacheSelections: cacheInputs.evidence.selections,
			scenes: sceneInventory,
			outputs: {
				rawDiffuseRadiances: analysis.rawDiffuseRadiances,
				images: analysis.images,
				figures: analysis.figures,
			},
			protectedSourceUnchanged: true,
			parentControlUnchanged: true,
			colorStateUnchanged: decision.gates.colorStateUnchanged,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const reportRows = sceneInventory.map((scene) =>
			`| ${scene.sceneId} | ${scene.directNormalLux.toExponential(6)} | ${scene.diffuseHorizontalLux.toExponential(6)} | ${scene.totalHorizontalLux.toExponential(6)} | ${scene.parentBackgroundMedianCdPerSquareMeter.toExponential(6)} |`,
		);
		const report = [
			`# ${run.runId}: CR2 available-light inventory`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All seven raw 4096-direction Native15 fields and all four requested figures were written before scientific gates.',
			'',
			'| Scene | Direct-normal lux | Diffuse-horizontal lux | Total-horizontal lux | CR1 sky p50 cd/m^2 |',
			'| --- | ---: | ---: | ---: | ---: |',
			...reportRows,
			'',
			...Object.entries(decision.gates).map(
				([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`,
			),
			'',
			'Claim boundary: receiver-light measurement only; no new Color or appearance result is accepted here.',
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
					gates: decision.gates,
					progress,
					scenes: sceneInventory,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			const runtimeAudit = {
				beforeRecorded: runtimeBefore !== null,
				afterRecorded: runtimeAfterWritten,
				matches: null,
				error: null,
			};
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

			const parentAudit = {
				beforeRecorded: parentBefore !== null,
				afterRecorded: parentAfterWritten,
				matches: null,
				error: null,
			};
			if (parentBefore !== null && !parentAfterWritten) {
				try {
					parentAfter = await verifyParentControl();
					await run.writeJsonArtifact('evidence/parent-control-after.json', parentAfter.evidence);
					parentAfterWritten = true;
					parentAudit.afterRecorded = true;
				} catch (auditError) {
					parentAudit.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (parentBefore && parentAfter) {
				try {
					assertParentControlUnchanged(parentBefore.evidence, parentAfter.evidence);
					parentAudit.matches = true;
				} catch (auditError) {
					parentAudit.matches = false;
					parentAudit.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}

			const protectedAudit = {
				beforeRecorded: protectedBefore !== null,
				afterRecorded: protectedAfterWritten,
				matches: null,
				error: null,
			};
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
					assertFileInventoriesEqual(
						protectedBefore.algorithm32,
						protectedAfter.algorithm32,
						'CR2 protected Algorithm32 source',
					);
					assertFileInventoriesEqual(
						protectedBefore.flat32,
						protectedAfter.flat32,
						'CR2 protected Flat32 source',
					);
					protectedAudit.matches = true;
				} catch (auditError) {
					protectedAudit.matches = false;
					protectedAudit.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}

			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr2-failure-v1',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : null,
				browserEvidenceErrors: error?.evidenceErrors ?? [],
				browserCleanupErrors: error?.cleanupErrors ?? [],
				runtimeAudit,
				parentAudit,
				protectedAudit,
			});
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', await failureProgress(run, error, browser));
			}
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {accepted: false, error: error instanceof Error ? error.message : String(error)},
				report:
					`# ${run.runId}: CR2 available-light inventory failed\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
