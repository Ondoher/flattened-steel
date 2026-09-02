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

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr0-control-smoke.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_PATH = path.join(COLOR_RESET_ROOT, 'fixtures', 'cr0-control-smoke-v1.json');
const CACHE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const FIXTURE_SHA256 = '1e8b71d0bb48d2ff35bdd8a8348c2c03f011965f47759d5fbe4501f3d776c1de';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY = 'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const EXPECTED_BINS = Object.freeze({
	'solar-noon': 14,
	'sunset-plus-60-minutes': 100,
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
		fixture.outputs.contactSheet,
		...fixture.outputs.differencePngs,
	];
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR0 control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1',
		'CR0 control snapshot schema changed.',
	);
	requireCondition(
		manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.fileCount === 147,
		'CR0 control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map((entry) => entry.path));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR0 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR0 snapshot and production closure');
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
			'color-reset/runners/run-cr0-control-smoke.js',
			'color-reset/harness/cr0-control-smoke-browser.js',
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
	requireCondition(threePackage.version === '0.180.0', 'CR0 requires the locked Three 0.180.0 package.');
	return {
		schemaId: 'algorithm32-color-reset-cr0-runtime-implementation-before-v1',
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
		schemaId: 'algorithm32-color-reset-cr0-runtime-implementation-after-v1',
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
		'CR0 runtime implementation',
	);
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR0 browser-served Three ESM closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 ===
			after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR0 package boundary changed while the browser was executing.',
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
		resolution.representativeSolarZenithDegrees === EXPECTED_BINS[scene.id],
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
		manifest.selection?.representativeSolarZenithDegrees === EXPECTED_BINS[scene.id],
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
	await assertNoReparseEntries(CACHE_ROOT, 'CR0 runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const reportDigest = await sha256File(reportPath);
	requireCondition(reportDigest === PACKAGE_REPORT_SHA256, 'CR0 package report changed.');
	const report = await readJson(reportPath);
	requireCondition(report.accepted === true && report.packageCount === 109, 'CR0 package report is not accepted.');
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR0 runtime cache catalog');
	const catalogDigest = await sha256File(catalogPath);
	requireCondition(catalogDigest === CATALOG_SHA256, 'CR0 runtime catalog changed.');
	requireCondition(catalogDigest === report.catalogSha256, 'CR0 report/catalog identities disagree.');
	const catalog = await readJson(catalogPath);
	const scenes = [];
	const packages = [];
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
		packages.push(await verifySelectedPackage(scene, resolution));
		scenes.push({
			...scene,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			sceneCacheAsset: resolution.asset,
		});
	}
	return {
		scenes,
		evidence: {
			schemaId: 'algorithm32-color-reset-cr0-cache-input-verification-v1',
			accepted: true,
			packageRoot: 'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1',
			packageReport: {path: 'package-report.json', sha256: reportDigest},
			catalog: {path: report.catalogPath, sha256: catalogDigest},
			packages,
		},
	};
}

function makeBrowserConfiguration(fixture, scenes) {
	const paths = new Set(fixture.outputs.individualPngs);
	const panelPath = (controlId, sceneId) => {
		const candidate = `captures/${controlId}-${sceneId}.png`;
		requireCondition(paths.has(candidate), `Fixture does not declare panel ${candidate}.`);
		return candidate;
	};
	const panels = scenes.flatMap((scene) =>
		fixture.displayControls.map((control) => ({
			sceneId: scene.id,
			sceneLabel: scene.label,
			controlId: control.id,
			controlLabel: control.label,
			artifactPath: panelPath(control.id, scene.id),
		})),
	);
	return {
		schemaId: 'algorithm32-color-reset-cr0-browser-config-v1',
		location: fixture.location,
		observer: fixture.observer,
		camera: fixture.camera,
		physicalControls: fixture.physicalControls,
		scenes,
		panels,
		differences: Object.fromEntries(
			scenes.map((scene) => [scene.id, `figures/absolute-difference-${scene.id}.png`]),
		),
		contactSheetPath: fixture.outputs.contactSheet,
	};
}

function elapsedMilliseconds(initializedAt, completedAt) {
	return Date.parse(completedAt) - Date.parse(initializedAt);
}

function makeProgress(run, browser, fixture) {
	const panelPaths = new Set(fixture.outputs.individualPngs);
	const panelUploads = browser.uploads.filter((entry) => panelPaths.has(entry.path));
	const firstImage = panelUploads
		.slice()
		.sort((left, right) => Date.parse(left.completedAt) - Date.parse(right.completedAt))[0];
	const plate = browser.uploads.find((entry) => entry.path === fixture.outputs.contactSheet);
	requireCondition(firstImage && plate, 'CR0 progress events are incomplete.');
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
	return {
		...browserResult,
		panels: browserResult.panels.map(attach),
		differences: browserResult.differences.map(attach),
		contactSheet: attach(browserResult.contactSheet),
	};
}

function makePanelIdentityEvidence({renderAnalysis, fixture, cacheInputs}) {
	const fixtureScenes = new Map(fixture.scenes.map((scene) => [scene.id, scene]));
	const renderedScenes = new Map(renderAnalysis.scenes.map((scene) => [scene.sceneId, scene]));
	const cachePackages = new Map(
		cacheInputs.evidence.packages.map((entry) => [entry.sceneId, entry]),
	);
	return {
		schemaId: 'algorithm32-color-reset-cr0-panel-identities-v1',
		fixture: {
			path: 'scripts/extraterrestrial/color-reset/fixtures/cr0-control-smoke-v1.json',
			sha256: FIXTURE_SHA256,
		},
		controlSnapshot: {
			manifestPath:
				'scripts/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
			manifestSha256: SNAPSHOT_MANIFEST_SHA256,
			inventorySha256: SNAPSHOT_INVENTORY_SHA256,
		},
		panels: renderAnalysis.panels.map((panel) => {
			const fixtureScene = fixtureScenes.get(panel.sceneId);
			const renderedScene = renderedScenes.get(panel.sceneId);
			const cachePackage = cachePackages.get(panel.sceneId);
			const frame = renderedScene?.frames?.[panel.controlId];
			requireCondition(
				fixtureScene && renderedScene && cachePackage && frame,
				`Panel identity inputs are incomplete for ${panel.sceneId}/${panel.controlId}.`,
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
				cache: {
					cacheIdentity: cachePackage.cacheIdentity,
					numericalIdentity: cachePackage.numericalIdentity,
					representativeSolarZenithDegrees:
						cachePackage.representativeSolarZenithDegrees,
					manifestSha256: cachePackage.manifest.sha256,
				},
					displayOperation: {
					controlId: panel.controlId,
					controlLabel: panel.controlLabel,
					colorId: frame.colorId,
					runtimeSourceHash: frame.diagnostics?.runtime?.sourceHash ?? null,
				},
				runtimeEnvironment: {
					...renderAnalysis.runtimeEnvironment,
					browserUserAgent: renderAnalysis.software.browserUserAgent,
					threeRevision: renderAnalysis.software.threeRevision,
					webgl: renderedScene.gpu,
				},
			};
		}),
		contactSheet: {
			...renderAnalysis.contactSheet,
			panelArtifactPaths: renderAnalysis.panels.map((panel) => panel.artifactPath),
		},
	};
}

function makeDerivedImageEvidence({
	renderAnalysis,
	fixture,
	panelIdentities,
	runtimeImplementationBefore,
}) {
	const panels = new Map(
		renderAnalysis.panels.map((panel) => [`${panel.sceneId}/${panel.controlId}`, panel]),
	);
	const browserModule = runtimeImplementationBefore.implementation.inventory.files.find(
		(entry) => entry.path === 'color-reset/harness/cr0-control-smoke-browser.js',
	);
	requireCondition(browserModule, 'CR0 browser module is absent from its implementation inventory.');
	return {
		schemaId: 'algorithm32-color-reset-cr0-image-derivations-v1',
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
		panels: panelIdentities.panels.map((panel) => ({
			artifact: {
				path: panel.artifactPath,
				byteLength: panel.byteLength,
				sha256: panel.sha256,
			},
			parents: {
				fixture: panelIdentities.fixture,
				controlSnapshot: panelIdentities.controlSnapshot,
				cache: panel.cache,
			},
			operation:
				'Load the exact prebuilt scene cache, integrate one Q30 spherical camera-ray field with the declared scene geometry, project Native15 through the selected production Color model, and encode the WebGL framebuffer as PNG.',
			implementation: {
				browserModulePath: browserModule.path,
				browserModuleSha256: browserModule.sha256,
				runtimeShaderSourceHash: panel.displayOperation.runtimeSourceHash,
				browserTool: panel.runtimeEnvironment,
			},
			parameters: {
				scene: panel.scene,
				camera: panel.camera,
				physicalControls: panel.physicalControls,
				displayOperation: panel.displayOperation,
			},
		})),
		differences: renderAnalysis.differences.map((difference) => {
			const bruneton = panels.get(`${difference.sceneId}/bruneton`);
			const productionLift = panels.get(`${difference.sceneId}/production-lift`);
			requireCondition(
				bruneton && productionLift,
				`CR0 difference parents are missing for ${difference.sceneId}.`,
			);
			return {
				artifact: {
					path: difference.artifactPath,
					byteLength: difference.byteLength,
					sha256: difference.sha256,
				},
				parents: [
					{path: bruneton.artifactPath, sha256: bruneton.sha256},
					{path: productionLift.artifactPath, sha256: productionLift.sha256},
				],
				operation:
					'For each bottom-up framebuffer pixel and RGB channel, write abs(brunetonCode - productionLiftCode); write alpha 255; flip rows exactly once for top-down PNG encoding.',
				parameters: {
					widthPixels: fixture.camera.widthPixels,
					heightPixels: fixture.camera.heightPixels,
					channelType: 'unsigned 8-bit framebuffer code',
					alphaCode: 255,
				},
				metrics: {
					maximumAbsoluteChannelDifference:
						difference.maximumAbsoluteChannelDifference,
					meanAbsoluteRgbDifference: difference.meanAbsoluteRgbDifference,
					rmseRgbCodes: difference.rmseRgbCodes,
					differingPixelCount: difference.differingPixelCount,
					overOneCodePixelCount: difference.overOneCodePixelCount,
					boundingBox: difference.boundingBox,
				},
			};
		}),
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
				'Decode the four panel PNG data URLs and draw an ordered two-column by two-row labeled Canvas plate without resampling.',
			parameters: {
				rowSceneOrder: fixture.scenes.map((scene) => scene.id),
				columnControlOrder: fixture.displayControls.map((control) => control.id),
				panelWidthPixels: fixture.camera.widthPixels,
				panelHeightPixels: fixture.camera.heightPixels,
				labelHeightPixels: 34,
				backgroundCss: '#111',
				labelCss: '#fff',
			},
		},
	};
}

function evaluateGates({browserResult, browser, fixture, progress}) {
	const expectedUploads = new Set(artifactPaths(fixture));
	const actualUploads = new Set(browser.uploads.map((entry) => entry.path));
	const solarNoonDifference = browserResult.differences.find((entry) => entry.sceneId === 'solar-noon');
	const correctModels = browserResult.scenes.every(
		(scene) =>
			scene.frames.bruneton.colorId === 'bruneton-figure1-display' &&
			scene.frames['production-lift'].colorId === 'bruneton-source-derived-global-luminance-lift-v2',
	);
	const correctDimensions = browserResult.scenes.every((scene) =>
		Object.values(scene.frames).every(
			(frame) =>
				frame.summary.width === fixture.camera.widthPixels &&
				frame.summary.height === fixture.camera.heightPixels,
		),
	);
	const groundEndpoints = browserResult.scenes.every((scene) =>
		Object.values(scene.frames).every((frame) => frame.geometryProbe.hitRgba[0] === 255),
	);
	const noWebglErrors = browserResult.scenes.every((scene) =>
		Object.values(scene.frames).every((frame) => frame.webglErrors.length === 0),
	);
	const contextsHealthy = browserResult.scenes.every((scene) =>
		Object.values(scene.frames).every((frame) => frame.contextLost === false),
	);
	const exactCachesReused = browserResult.scenes.every(
		(scene) =>
			scene.cacheReuse?.initialExactCachePublished === true &&
			scene.cacheReuse?.controllerIdentityPreserved === true &&
			scene.cacheReuse?.residentCacheIdentityPreserved === true,
	);
	const actualD3d11 = browserResult.scenes.every((scene) =>
		/(?:d3d11|direct3d11)/iu.test(scene.gpu?.renderer ?? ''),
	);
	const browserIdentityRecorded =
		typeof browserResult.runtimeEnvironment?.chromeExecutable?.sha256 === 'string' &&
		/^[a-f0-9]{64}$/u.test(browserResult.runtimeEnvironment.chromeExecutable.sha256) &&
		typeof browserResult.runtimeEnvironment?.browserVersion?.product === 'string' &&
		browserResult.runtimeEnvironment.requestedAngleBackend === 'd3d11';
	const installedRuntimes = browserResult.scenes.every((scene) =>
		Object.values(scene.frames).every(
			(frame) =>
				frame.diagnostics?.status === 'installed' &&
				frame.diagnostics?.runtime?.status === 'ready' &&
				/^fnv1a32:[a-f0-9]{8}$/u.test(
					frame.diagnostics?.runtime?.sourceHash ?? '',
				) &&
				frame.diagnostics?.runtime?.renderErrorCount === 0 &&
				frame.diagnostics?.runtime?.lastRenderError === null &&
				frame.diagnostics?.runtime?.frameCount >= 1,
		),
	);
	const solarNoonScene = browserResult.scenes.find((scene) => scene.sceneId === 'solar-noon');
	const twilightScene = browserResult.scenes.find(
		(scene) => scene.sceneId === 'sunset-plus-60-minutes',
	);
	const requiredVisibleControlPanels = Boolean(
		solarNoonScene &&
		Object.values(solarNoonScene.frames).every(
			(frame) => frame.summary.nonBlackPixelCount > 0,
		) &&
		twilightScene?.frames['production-lift'].summary.nonBlackPixelCount > 0,
	);
	const gates = {
		allRequestedImagesWritten:
			expectedUploads.size === actualUploads.size &&
			[...expectedUploads].every((artifactPath) => actualUploads.has(artifactPath)),
		fourPanelsAndTwoDifferences:
			browserResult.panels.length === 4 && browserResult.differences.length === 2,
		panelDimensions: correctDimensions,
		controlModelIdentities: correctModels,
		sphericalGroundEndpoint: groundEndpoints,
		noWebglErrors,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		contextsHealthy,
		actualD3d11Backend: actualD3d11,
		browserIdentityRecorded,
		exactCachesReusedAcrossColorReplacement: exactCachesReused,
		installedRuntimes,
		requiredVisibleControlPanels,
		artifactHashesRecorded: browserResult.panels
			.concat(browserResult.differences, [browserResult.contactSheet])
			.every((entry) => /^[a-f0-9]{64}$/u.test(entry.sha256)),
		solarNoonProductionLiftRetainsBrunetonWithinOneCode:
			solarNoonDifference?.maximumAbsoluteChannelDifference <= 1 &&
			solarNoonDifference?.overOneCodePixelCount === 0,
		differenceMetricsRecorded: browserResult.differences.every(
			(entry) =>
				Number.isFinite(entry.rmseRgbCodes) &&
				Number.isFinite(entry.differingPixelFraction) &&
				Number.isInteger(entry.maximumAbsoluteChannelDifference),
		),
		firstImageTimeTarget: progress.firstImage.targetMet,
		decisionPlateTimeTarget: progress.decisionPlate.targetMet,
	};
	const integrityGateNames = [
		'allRequestedImagesWritten',
		'fourPanelsAndTwoDifferences',
		'panelDimensions',
		'controlModelIdentities',
		'sphericalGroundEndpoint',
		'noWebglErrors',
		'noBrowserServerErrors',
		'contextsHealthy',
		'actualD3d11Backend',
		'browserIdentityRecorded',
		'exactCachesReusedAcrossColorReplacement',
		'installedRuntimes',
		'requiredVisibleControlPanels',
		'artifactHashesRecorded',
		'differenceMetricsRecorded',
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
		(entry) => entry.path === 'figures/cr0-control-smoke-contact-sheet.png',
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
	if (process.argv.length !== 2) throw new Error('CR0 accepts no arguments.');
	const run = await initializeColorResetRunRecord({
		slug: 'control-smoke',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr0-inputs-v1',
			increment: 'CR0',
			fixture: 'scripts/extraterrestrial/color-reset/fixtures/cr0-control-smoke-v1.json',
			fixtureSha256: FIXTURE_SHA256,
			controlSnapshot: 'scripts/extraterrestrial/color-reset/controls/production-v1',
			controlSnapshotManifestSha256: SNAPSHOT_MANIFEST_SHA256,
			cachePackageRoot:
				'server/flat32/data/one-degree-bin-covered-runtime-packages-20260830-1',
			scenes: [
				{sceneId: 'solar-noon', timeIso: '2024-06-20T20:08:00.000Z'},
				{sceneId: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z'},
			],
			viewport: {widthPixels: 640, heightPixels: 400, verticalFieldOfViewDegrees: 78},
			outputImages: [
				'captures/bruneton-solar-noon.png',
				'captures/production-lift-solar-noon.png',
				'captures/bruneton-sunset-plus-60-minutes.png',
				'captures/production-lift-sunset-plus-60-minutes.png',
				'figures/cr0-control-smoke-contact-sheet.png',
				'figures/absolute-difference-solar-noon.png',
				'figures/absolute-difference-sunset-plus-60-minutes.png',
			],
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr0-provenance-v1',
			operation:
				'Render the current exact-cache Q30 sky through unchanged Bruneton and the current production source-luminance lift; derive absolute per-channel framebuffer differences and one labeled two-by-two plate.',
			implementation: [
				'scripts/extraterrestrial/color-reset/runners/run-cr0-control-smoke.js',
				'scripts/extraterrestrial/color-reset/harness/color-reset-browser-run.js',
				'scripts/extraterrestrial/color-reset/harness/cr0-control-smoke-browser.js',
			],
			physicalInput:
				'qualified one-degree Native48/Z180/W27/F68/Native15/N4 cache with spherical ground and Q30 quadratic-near-observer live transport',
			colorControls: [
				'contained byte-identical BrunetonColorDisplayModel',
				'contained byte-identical BrunetonSourceLuminanceLiftColorDisplayModel',
			],
			differenceEquation: 'difference[channel] = abs(brunetonFramebufferCode[channel] - productionLiftFramebufferCode[channel])',
			exclusions: [
				'no cache rebuild or retuning',
				'no color candidate',
				'no exposure tuning',
				'no scene objects',
				'no celestial stars or disk contribution',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr0-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr0-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr0---reproduce-two-controls-quickly',
			cacheStatus: 'agents/topics/algorithm32/production/README.md',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let protectedBefore = null;
	let protectedBeforeWritten = false;
	let protectedAfter = null;
	let protectedAfterWritten = false;
	let runtimeImplementationBefore = null;
	let runtimeImplementationBeforeWritten = false;
	let runtimeImplementationAfter = null;
	let runtimeImplementationAfterWritten = false;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		runtimeImplementationBefore = await captureRuntimeImplementationBefore();
		await run.writeJsonArtifact(
			'evidence/runtime-implementation-before.json',
			runtimeImplementationBefore,
		);
		runtimeImplementationBeforeWritten = true;
		const fixtureDigest = await sha256File(FIXTURE_PATH);
		requireCondition(fixtureDigest === FIXTURE_SHA256, 'CR0 fixture changed.');
		const fixture = await readJson(FIXTURE_PATH);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		protectedBeforeWritten = true;
		const controlSnapshot = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-verification.json', controlSnapshot);
		const browserClosure = await buildStaticModuleClosure({
			candidateRoot: COLOR_RESET_ROOT,
			entryFiles: ['harness/cr0-control-smoke-browser.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		});
		await run.writeJsonArtifact('evidence/browser-module-closure.json', browserClosure);
		const cacheInputs = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification.json', cacheInputs.evidence);
		const browserConfiguration = makeBrowserConfiguration(fixture, cacheInputs.scenes);
		await run.writeJsonArtifact('browser/config.json', browserConfiguration);
		const expectedImageArtifacts = artifactPaths(fixture);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr0-control-smoke-browser.js',
			exportName: 'runCr0ControlSmokeBrowser',
			servedRoots: {'/cache/': CACHE_ROOT},
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			allowedArtifactPaths: expectedImageArtifacts,
			timeoutMilliseconds: 900_000,
		});
		runtimeImplementationAfter = await captureRuntimeImplementationAfter(
			runtimeImplementationBefore,
		);
		await run.writeJsonArtifact(
			'evidence/runtime-implementation-after.json',
			runtimeImplementationAfter,
		);
		runtimeImplementationAfterWritten = true;
		assertRuntimeImplementationUnchanged(
			runtimeImplementationBefore,
			runtimeImplementationAfter,
		);
		const renderAnalysis = {
			...attachArtifactIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		const panelIdentities = makePanelIdentityEvidence({
			renderAnalysis,
			fixture,
			cacheInputs,
		});
		await run.writeJsonArtifact('evidence/panel-identities.json', panelIdentities);
		await run.writeJsonArtifact('evidence/render-analysis.json', renderAnalysis);
		await run.writeJsonArtifact(
			'evidence/image-derivations.json',
			makeDerivedImageEvidence({
				renderAnalysis,
				fixture,
				panelIdentities,
				runtimeImplementationBefore,
			}),
		);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		protectedAfterWritten = true;
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR0 protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			protectedBefore.flat32,
			protectedAfter.flat32,
			'CR0 protected Flat32 source',
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
			schemaId: 'algorithm32-color-reset-cr0-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			claimBoundary:
				'Infrastructure/control reproduction only; no twilight appearance or new Color mechanism is accepted.',
			gates: decision.gates,
			progress,
			cacheSelections: cacheInputs.evidence.packages.map((entry) => ({
				sceneId: entry.sceneId,
				solarZenithDegrees: entry.requestedSolarZenithDegrees,
				representativeSolarZenithDegrees: entry.representativeSolarZenithDegrees,
				cacheIdentity: entry.cacheIdentity,
			})),
			differences: renderAnalysis.differences,
			outputs: {
				panels: renderAnalysis.panels,
				contactSheet: renderAnalysis.contactSheet,
			},
			protectedSourceUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR0 control smoke`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			decision.integrityPassed
				? 'Four byte-identified current exact-cache/current-model control frames, two derived absolute-difference frames, and the labeled two-by-two plate passed integrity checks after every image was written.'
				: 'The render or evidence path failed an integrity gate; every completed and partial artifact remains preserved.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'This is an infrastructure and reproduction result only. It introduces no Color candidate and makes no twilight appearance claim.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({
			conclusion,
			result: proof,
			report,
		});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					gates: decision.gates,
					progress,
					differences: renderAnalysis.differences,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			let runtimeImplementationAudit = {
				beforeRecorded: runtimeImplementationBeforeWritten,
				afterRecorded: runtimeImplementationAfterWritten,
				matches: null,
				error: null,
			};
			if (runtimeImplementationBefore !== null && !runtimeImplementationAfterWritten) {
				try {
					runtimeImplementationAfter = await captureRuntimeImplementationAfter(
						runtimeImplementationBefore,
					);
					await run.writeJsonArtifact(
						'evidence/runtime-implementation-after.json',
						runtimeImplementationAfter,
					);
					runtimeImplementationAfterWritten = true;
					runtimeImplementationAudit.afterRecorded = true;
				} catch (implementationInventoryError) {
					runtimeImplementationAudit.error =
						implementationInventoryError instanceof Error
							? implementationInventoryError.message
							: String(implementationInventoryError);
				}
			}
			if (runtimeImplementationBefore !== null && runtimeImplementationAfter !== null) {
				try {
					assertRuntimeImplementationUnchanged(
						runtimeImplementationBefore,
						runtimeImplementationAfter,
					);
					runtimeImplementationAudit.matches = true;
				} catch (implementationComparisonError) {
					runtimeImplementationAudit.matches = false;
					runtimeImplementationAudit.error ??=
						implementationComparisonError instanceof Error
							? implementationComparisonError.message
							: String(implementationComparisonError);
				}
			}
			let protectedSourceAudit = {
				beforeRecorded: protectedBeforeWritten,
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
					protectedSourceAudit.afterRecorded = true;
				} catch (inventoryError) {
					protectedSourceAudit.error =
						inventoryError instanceof Error ? inventoryError.message : String(inventoryError);
				}
			}
			if (protectedBefore !== null && protectedAfter !== null) {
				try {
					assertFileInventoriesEqual(
						protectedBefore.algorithm32,
						protectedAfter.algorithm32,
						'CR0 protected Algorithm32 source',
					);
					assertFileInventoriesEqual(
						protectedBefore.flat32,
						protectedAfter.flat32,
						'CR0 protected Flat32 source',
					);
					protectedSourceAudit.matches = true;
				} catch (inventoryComparisonError) {
					protectedSourceAudit.matches = false;
					protectedSourceAudit.error ??=
						inventoryComparisonError instanceof Error
							? inventoryComparisonError.message
							: String(inventoryComparisonError);
				}
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr0-failure-v1',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : null,
				browserEvidenceErrors: error?.evidenceErrors ?? [],
				browserCleanupErrors: error?.cleanupErrors ?? [],
				runtimeImplementationAudit,
				protectedSourceAudit,
			});
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', await failureProgress(run, error));
			}
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					accepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR0 control smoke failed\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
