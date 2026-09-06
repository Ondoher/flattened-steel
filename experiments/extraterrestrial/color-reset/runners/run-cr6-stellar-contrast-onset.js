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
	'node experiments/extraterrestrial/color-reset/runners/run-cr6-stellar-contrast-onset.js';
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
	'experiments/extraterrestrial/color-reset/fixtures/cr6-stellar-contrast-onset-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/harness/cr6-stellar-contrast-onset-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const FROZEN_COLOR_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
const FROZEN_COLOR_PATH = path.join(REPOSITORY_ROOT, ...FROZEN_COLOR_RELATIVE_PATH.split('/'));
const DIAGNOSTIC_MODEL_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/stellar/Cr6StellarContrastDiagnosticColorDisplayModel.js';
const DIAGNOSTIC_MODEL_PATH = path.join(REPOSITORY_ROOT, ...DIAGNOSTIC_MODEL_RELATIVE_PATH.split('/'));
const CACHE_ROOT = path.join(
	REPOSITORY_ROOT,
	'server',
	'flat32',
	'data',
	'one-degree-bin-covered-runtime-packages-20260830-1',
);
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr6-stellar-contrast-onset';
const FIXTURE_SHA256 = '80d5667381ed4b1762b514510db18d3481e7ab7eabc85bfc3c67ffb33c6efbd3';
// Finalized after the independently authored browser harness is settled.
const HARNESS_SHA256 = '4d9689be0cbb3066ef214bdbfc9679078e46c79de3267a5f78ada08ab13a9627';
const FROZEN_COLOR_SHA256 = '7b8115c66bf0b37543f3bd2fe659f91c927648ee76f29f46725cdbb5c0818f8e';
const DIAGNOSTIC_MODEL_SHA256 = '06002ea3f1d4ef63ddf8554565f45cdf45bb8fb988c103bf9dda96e08e16e965';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const PACKAGE_REPORT_SHA256 = 'ee83a234ba4106fd02aa61b4c81241ddadb4effda994325f074b6ffc5168138a';
const CATALOG_SHA256 = '2dbf92ad616c5461954fc15f8eb1654c49f4b1e3ddbd948aa7bda7a40c76d7ac';
const EXPECTED_NUMERICAL_IDENTITY =
	'algorithm32-native48-z180-w27-f68-native15-n4-q30-ozone-v1';
const UPLOAD_LIMIT_BYTES = 128 * 1024 * 1024;
const BROWSER_TIMEOUT_MILLISECONDS = 1_200_000;

const EXPECTED_PARENTS = Object.freeze({
	cr1: Object.freeze({runId: '000005-six-scene-visual-baseline', conclusion: 'accepted'}),
	cr2: Object.freeze({runId: '000007-available-light-inventory', conclusion: 'accepted'}),
	cr4f: Object.freeze({runId: '000032-cr4f-fine-twilight-cadence', conclusion: 'accepted'}),
	cr4g: Object.freeze({runId: '000033-cr4g-slope-limited-nautical-response-bracket', conclusion: 'accepted'}),
	cr4k: Object.freeze({runId: '000037-cr4k-minimal-deep-twilight-lift', conclusion: 'rejected'}),
});
const EXPECTED_SCENES = Object.freeze([
	Object.freeze({id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z', status: 'ready', representative: 90}),
	Object.freeze({id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z', status: 'ready', representative: 92}),
	Object.freeze({id: 'sunset-plus-30-minutes', timeIso: '2024-06-21T03:56:03.503Z', status: 'ready', representative: 95}),
	Object.freeze({id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z', status: 'ready', representative: 100}),
	Object.freeze({id: 'sunset-plus-90-minutes', timeIso: '2024-06-21T04:56:03.503Z', status: 'ready', representative: 104}),
	Object.freeze({id: 'solar-zenith-108-below', timeIso: '2024-06-21T05:24:58.209Z', status: 'ready', representative: 108}),
	Object.freeze({id: 'solar-zenith-108-above', timeIso: '2024-06-21T05:24:58.210Z', status: 'dark'}),
	Object.freeze({id: 'sunset-plus-120-minutes', timeIso: '2024-06-21T05:26:03.503Z', status: 'dark'}),
]);

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
		!path.posix.isAbsolute(value) &&
		!value.split('/').includes('..') &&
		value === value.replaceAll('\\', '/')
	);
}

function imageArtifactPaths(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder];
}

function expandDataPath(pattern, sceneId) {
	return pattern.replace('{sceneId}', sceneId);
}

function dataArtifactPaths(fixture) {
	return fixture.scenes.flatMap(({id}) =>
		Object.values(fixture.outputs.perSceneDataPathPatterns).map((pattern) => expandDataPath(pattern, id)),
	);
}

function browserEvidencePaths(fixture) {
	return [
		fixture.outputs.evidence.memberLedger,
		fixture.outputs.evidence.fixedMemberTracks,
		fixture.outputs.evidence.transitionAnalysis,
	];
}

function allowedBrowserArtifacts(fixture) {
	return [...imageArtifactPaths(fixture), ...dataArtifactPaths(fixture), ...browserEvidencePaths(fixture)];
}

function selectedParentArtifacts(fixture, parentId) {
	const parent = fixture.parents[parentId];
	const selected = [parent.analysis];
	for (const scene of fixture.scenes) {
		if (scene.skyField?.parentId === parentId) selected.push(scene.skyField);
		if (scene.sceneHitMask?.parentId === parentId) selected.push(scene.sceneHitMask);
	}
	if (parentId === 'cr4k') selected.push(...parent.controlPngs);
	return [...new Map(selected.map((artifact) => [artifact.path, artifact])).values()];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === `${SCHEMA_PREFIX}-input-v1`,
		'CR6 fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.singleCandidate === true &&
			fixture.claimBoundary.physicalSkyFrozen === true &&
			fixture.claimBoundary.ambientBehaviorFrozen === true &&
			fixture.claimBoundary.stellarSourceRadiometryFrozen === true &&
			fixture.claimBoundary.runtimeContrastThreshold === false &&
			fixture.claimBoundary.skyRetuning === false &&
			fixture.claimBoundary.automaticCandidateSelection === false &&
			fixture.claimBoundary.productionClaim === false,
		'CR6 claim boundary changed.',
	);
	requireCondition(
		exactJson(
			fixture.scenes.map(({id, timeIso, cacheExpectation}) => ({
				id,
				timeIso,
				status: cacheExpectation.status,
				...(cacheExpectation.status === 'ready'
					? {representative: cacheExpectation.representativeSolarZenithDegrees}
					: {}),
			})),
			EXPECTED_SCENES,
		),
		'CR6 scene order, times, or ready/dark expectations changed.',
	);
	requireCondition(
		Object.keys(EXPECTED_PARENTS).every((parentId) => {
			const expected = EXPECTED_PARENTS[parentId];
			const actual = fixture.parents[parentId];
			return (
				actual?.namespace === 'color-reset' &&
				actual.runId === expected.runId &&
				actual.conclusion === expected.conclusion &&
				isSha256(actual.artifactSetSha256) &&
				isSha256(actual.manifest?.sha256) &&
				isSha256(actual.analysis?.sha256)
			);
		}),
		'CR6 parent identities changed.',
	);
	requireCondition(
		fixture.physicalControls.cacheNumericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			fixture.physicalControls.maximumScatteringOrder === 4 &&
			fixture.physicalControls.pathIntervalCount === 30 &&
			fixture.physicalControls.pathSampleDistribution === 'quadratic-near-observer-v1' &&
			fixture.physicalControls.darkFromSolarZenithDegrees === 108,
		'CR6 physical controls changed.',
	);
	requireCondition(
		fixture.frozenSkyDisplay.id === 'slope-078-p9' &&
			fixture.frozenSkyDisplay.sunsetAmplitude === 3.5 &&
			fixture.frozenSkyDisplay.sunsetTransitionIlluminanceLux === 980 &&
			fixture.frozenSkyDisplay.sunsetRolloffPower === 9 &&
			fixture.frozenSkyDisplay.adaptationPivotIlluminanceLux === 385 &&
			fixture.frozenSkyDisplay.adaptationFloorIlluminanceLux === 0.02 &&
			fixture.frozenSkyDisplay.adaptationSoftnessLogUnits === 0.1 &&
			fixture.frozenSkyDisplay.adaptationExponent === 0.78 &&
			fixture.frozenSkyDisplay.starAndSkyShareOneDisplayEvaluation === true,
		'CR6 frozen slope-078/p9 response changed.',
	);
	requireCondition(
		fixture.stellarCandidate.presentationIdentity === 'stellar-one-pixel-presentation-000435-v1' &&
			fixture.stellarCandidate.catalog.memberCount === 500 &&
			fixture.stellarCandidate.catalog.spectralChannelCount === 15 &&
			fixture.stellarCandidate.runtimeVisibilityFactor === 1 &&
			fixture.stellarCandidate.backgroundContrastIsDiagnosticOnly === true,
		'CR6 frozen stellar candidate changed.',
	);
	const below = fixture.scenes.find(({id}) => id === fixture.transitionBracket.belowSceneId);
	const above = fixture.scenes.find(({id}) => id === fixture.transitionBracket.aboveSceneId);
	requireCondition(
		Date.parse(above.timeIso) - Date.parse(below.timeIso) === 1 &&
			below.solarZenithDegrees < 108 &&
			above.solarZenithDegrees >= 108 &&
			fixture.transitionBracket.requiredTimestampSeparationMilliseconds === 1,
		'CR6 consecutive-millisecond transition bracket changed.',
	);
	const images = imageArtifactPaths(fixture);
	const data = dataArtifactPaths(fixture);
	const evidence = browserEvidencePaths(fixture);
	requireCondition(
		images.length === fixture.gates.requestedImageCount && images.length === 38 &&
			data.length === fixture.scenes.length * 4 && evidence.length === 3,
		'CR6 declared browser artifact counts changed.',
	);
	const allPaths = [...images, ...data, ...evidence, fixture.outputs.evidence.analysis];
	requireCondition(
		new Set(allPaths).size === allPaths.length && allPaths.every(isArtifactPath),
		'CR6 artifact paths are duplicated or unsafe.',
	);
	const layout = fixture.presentation.layout;
	const cadenceWidth =
		layout.outerPaddingPixels * 2 +
		layout.finalCompositeCadence.columnCount * layout.panelWidthPixels +
		(layout.finalCompositeCadence.columnCount - 1) * layout.columnGapPixels;
	const cadenceHeight =
		layout.outerPaddingPixels * 2 + layout.titleHeightPixels +
		layout.finalCompositeCadence.rowCount * (layout.panelLabelHeightPixels + layout.panelHeightPixels) +
		(layout.finalCompositeCadence.rowCount - 1) * layout.rowGapPixels;
	const matrixHeight =
		layout.outerPaddingPixels * 2 + layout.titleHeightPixels +
		layout.completeDecisionMatrix.rowCount * (layout.panelLabelHeightPixels + layout.panelHeightPixels) +
		(layout.completeDecisionMatrix.rowCount - 1) * layout.rowGapPixels;
	requireCondition(
		cadenceWidth === layout.finalCompositeCadence.expectedWidthPixels &&
			cadenceHeight === layout.finalCompositeCadence.expectedHeightPixels &&
			cadenceWidth === layout.completeDecisionMatrix.expectedWidthPixels &&
			matrixHeight === layout.completeDecisionMatrix.expectedHeightPixels,
		'CR6 native-pixel presentation dimensions disagree with their equations.',
	);
}

async function verifyOrdinaryCanonicalDirectory(directory, label) {
	const absolute = path.resolve(directory);
	const facts = await lstat(absolute);
	requireCondition(facts.isDirectory() && !facts.isSymbolicLink(), `${label} is not an ordinary directory.`);
	const canonical = await realpath(absolute);
	requireCondition(pathComparisonKey(canonical) === pathComparisonKey(absolute), `${label} traverses a link or junction.`);
	return canonical;
}

async function resolveParentDirectory(selector, label) {
	const runsRoot = await verifyOrdinaryCanonicalDirectory(COLOR_RESET_RUNS_ROOT, 'Color-reset runs root');
	const resolved = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
	const canonical = await verifyOrdinaryCanonicalDirectory(resolved, label);
	assertLexicallyContained(runsRoot, canonical, label);
	await assertNoReparseEntries(canonical, label);
	return canonical;
}

async function verifyParent({fixture, parentId, selector, root}) {
	const specification = fixture.parents[parentId];
	const expected = EXPECTED_PARENTS[parentId];
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.runId === expected.runId &&
			terminal.conclusion === expected.conclusion &&
			terminal.artifactSetSha256 === specification.artifactSetSha256,
		`CR6 ${parentId} terminal identity changed.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === specification.manifest.byteLength &&
			manifestSha256 === specification.manifest.sha256,
		`CR6 ${parentId} manifest file identity changed.`,
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === expected.runId &&
			manifest.conclusion === expected.conclusion &&
			manifest.artifactSetSha256 === specification.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		`CR6 ${parentId} manifest terminal facts changed.`,
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = selectedParentArtifacts(fixture, parentId);
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR6 ${parentId} manifest changed ${artifact.path}.`,
		);
		const artifactPath = path.join(root, ...artifact.path.split('/'));
		const facts = await lstat(artifactPath);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(artifactPath)) === artifact.sha256,
			`CR6 ${parentId} artifact changed ${artifact.path}.`,
		);
	}
	const analysis = await readJson(path.join(root, ...specification.analysis.path.split('/')));
	const expectedAnalysisSchemas = {
		cr1: 'algorithm32-color-reset-cr1-browser-result-v1',
		cr2: 'algorithm32-color-reset-cr2-browser-result-v1',
		cr4f: 'algorithm32-color-reset-cr4f-fine-twilight-cadence-browser-result-v1',
		cr4g: 'algorithm32-color-reset-cr4g-slope-limited-nautical-response-bracket-browser-result-v1',
		cr4k: 'algorithm32-color-reset-cr4k-minimal-deep-twilight-lift-browser-result-v1',
	};
	requireCondition(
		analysis.schemaId === expectedAnalysisSchemas[parentId],
		`CR6 ${parentId} analysis schema authority changed.`,
	);
	if (parentId === 'cr1') {
		requireCondition(
			analysis.scenes?.length === 7 && analysis.panels?.length === 28 &&
			analysis.rawFields?.length === 7 && analysis.hitMasks?.length === 7 &&
			analysis.contactSheet?.artifactPath === 'figures/cr1-six-scene-visual-baseline.png',
			'CR6 CR1 render authority changed.',
		);
	} else if (parentId === 'cr2') {
		requireCondition(
			analysis.scenes?.length === 7 && Array.isArray(analysis.errors) && analysis.errors.length === 0,
			'CR6 CR2 measurement authority changed.',
		);
	} else {
		requireCondition(analysis.renderComplete === true, `CR6 ${parentId} analysis render authority changed.`);
	}
	if (parentId === 'cr4g') {
		const row = analysis.responses?.find(({responseId}) => responseId === 'slope-078');
		requireCondition(
			row !== undefined && row.curve?.sunsetRolloffPower === 9 && row.curve?.adaptationExponent === 0.78,
			'CR6 CR4G slope-078/p9 authority changed.',
		);
	}
	if (parentId === 'cr4k') {
		requireCondition(
			analysis.renderComplete === true && analysis.responseOrder?.includes('slope-078-p9-control'),
			'CR6 CR4K authenticated no-change control is missing.',
		);
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-parent-verification-v1`,
		verified: true,
		parentId,
		explicitSelector: selector,
		namespace: specification.namespace,
		runId: terminal.runId,
		slug: terminal.slug,
		conclusion: terminal.conclusion,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		manifest: {...specification.manifest, sha256: manifestSha256, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		selectedArtifacts: selected.map((artifact) => ({...artifact})),
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...selected.map(({path: artifactPath}) => artifactPath),
		]),
	};
}

function assertParentUnchanged(before, after, parentId) {
	requireCondition(
		before.runId === after.runId && before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount && before.artifactBytes === after.artifactBytes,
		`CR6 ${parentId} terminal identity changed during execution.`,
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		`CR6 ${parentId} selected artifacts`,
	);
	return true;
}

async function verifyControlSnapshot(fixture) {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifestSha256 === SNAPSHOT_MANIFEST_SHA256 &&
			manifestSha256 === fixture.productionControlSnapshot.manifest.sha256,
		'CR6 production control snapshot manifest changed.',
	);
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.aggregateSha256 === fixture.productionControlSnapshot.inventorySha256,
		'CR6 production control snapshot identity changed.',
	);
	const byPath = new Map(manifest.inventory.files.map((entry) => [entry.path, entry]));
	for (const required of fixture.productionControlSnapshot.requiredFiles) {
		const inventoryPath = required.path.startsWith('src/')
			? required.path.slice('src/'.length)
			: required.path;
		const recorded = byPath.get(inventoryPath);
		requireCondition(
			recorded?.bytes === required.byteLength && recorded.sha256 === required.sha256,
			`CR6 production snapshot required file changed: ${required.path}.`,
		);
	}
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {include: (relativePath) => selectedPaths.has(relativePath)}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR6 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR6 snapshot and production closure');
	return {
		schemaId: `${SCHEMA_PREFIX}-control-snapshot-verification-v1`,
		accepted: true,
		manifestPath: fixture.productionControlSnapshot.manifest.path,
		manifestSha256,
		snapshotInventory,
		productionSelection,
	};
}

function assertControlSnapshotUnchanged(before, after) {
	requireCondition(before.manifestSha256 === after.manifestSha256, 'CR6 control snapshot changed during execution.');
	assertFileInventoriesEqual(before.snapshotInventory, after.snapshotInventory, 'CR6 snapshot source');
	assertFileInventoriesEqual(before.productionSelection, after.productionSelection, 'CR6 selected production source');
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, frozenColorSha256, diagnosticModelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(FROZEN_COLOR_PATH),
		sha256File(DIAGNOSTIC_MODEL_PATH),
	]);
	requireCondition(
		[FIXTURE_SHA256, HARNESS_SHA256, FROZEN_COLOR_SHA256, DIAGNOSTIC_MODEL_SHA256].every(isSha256),
		'CR6 authored SHA-256 pins are not finalized.',
	);
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR6 fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR6 browser harness changed after settlement.');
	requireCondition(frozenColorSha256 === FROZEN_COLOR_SHA256, 'CR6 frozen slope-078 implementation changed.');
	requireCondition(diagnosticModelSha256 === DIAGNOSTIC_MODEL_SHA256, 'CR6 diagnostic display model changed after settlement.');
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		frozenColor: {path: FROZEN_COLOR_RELATIVE_PATH, sha256: frozenColorSha256},
		diagnosticModel: {path: DIAGNOSTIC_MODEL_RELATIVE_PATH, sha256: diagnosticModelSha256},
	};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr6-stellar-contrast-onset.js',
			'color-reset/harness/cr6-stellar-contrast-onset-browser.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http',
			'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
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
	requireCondition(threePackage.version === '0.180.0', 'CR6 requires locked Three 0.180.0.');
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-before-v1`,
		implementation: {
			closure: implementationClosure,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, implementationClosure.files),
		},
		browserDependencies: {
			servedClosure: threeClosure,
			servedInventory: await createSelectedFileInventory(THREE_ROOT, threeClosure.files),
			threePackage: {version: threePackage.version, packageJsonSha256: await sha256File(threePackagePath)},
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
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, before.implementation.closure.files),
		threeServedInventory: await createSelectedFileInventory(THREE_ROOT, before.browserDependencies.servedClosure.files),
		threePackageJsonSha256: await sha256File(path.join(THREE_ROOT, 'package.json')),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(before.implementation.inventory, after.implementationInventory, 'CR6 runtime implementation');
	assertFileInventoriesEqual(before.browserDependencies.servedInventory, after.threeServedInventory, 'CR6 browser-served Three closure');
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 === after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR6 package boundary changed during execution.',
	);
	return true;
}

async function verifyPackageFile(packageDirectory, descriptor, label) {
	const target = path.join(packageDirectory, ...descriptor.path.split('/'));
	assertLexicallyContained(packageDirectory, target, label);
	const facts = await lstat(target);
	requireCondition(facts.isFile() && !facts.isSymbolicLink() && facts.size === descriptor.byteLength, `${label} file identity changed.`);
	const digest = await sha256File(target);
	requireCondition(digest === descriptor.sha256, `${label} SHA-256 changed.`);
	return {path: descriptor.path, byteLength: facts.size, sha256: digest};
}

async function verifyReadyPackage(scene, resolution) {
	requireCondition(
		resolution.status === 'ready' &&
			resolution.representativeSolarZenithDegrees === scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} resolved the wrong ready cache.`,
	);
	requireCondition(resolution.asset.assetRoot.startsWith('/cache/'), `${scene.id} cache root escaped /cache/.`);
	const packageRelativePath = resolution.asset.assetRoot.slice('/cache/'.length).replace(/\/$/u, '');
	const packageDirectory = path.join(CACHE_ROOT, ...packageRelativePath.split('/'));
	assertLexicallyContained(CACHE_ROOT, packageDirectory, `${scene.id} package`);
	await assertNoReparseEntries(packageDirectory, `${scene.id} package`);
	const manifestPath = path.join(packageDirectory, resolution.asset.loadRequest.manifestPath);
	assertLexicallyContained(packageDirectory, manifestPath, `${scene.id} manifest`);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === resolution.asset.loadRequest.manifestSha256, `${scene.id} manifest SHA-256 changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.cacheIdentity === resolution.asset.loadRequest.cacheIdentity &&
			manifest.numericalIdentity === EXPECTED_NUMERICAL_IDENTITY &&
			manifest.selection?.representativeSolarZenithDegrees === scene.cacheExpectation.representativeSolarZenithDegrees,
		`${scene.id} manifest contract changed.`,
	);
	const ledgerPath = path.join(packageDirectory, manifest.ledgerPath);
	assertLexicallyContained(packageDirectory, ledgerPath, `${scene.id} ledger`);
	const ledgerFacts = await lstat(ledgerPath);
	const ledgerSha256 = await sha256File(ledgerPath);
	requireCondition(
		ledgerFacts.isFile() && !ledgerFacts.isSymbolicLink() && ledgerSha256 === manifest.ledgerSha256,
		`${scene.id} ledger changed.`,
	);
	const [exactSeamPayload, logicalToUniqueIndex] = await Promise.all([
		verifyPackageFile(packageDirectory, manifest.exactSeamPayload, `${scene.id} exact seam payload`),
		verifyPackageFile(packageDirectory, manifest.logicalToUniqueIndex, `${scene.id} logical index`),
	]);
	return {
		sceneId: scene.id,
		timeIso: scene.timeIso,
		status: 'ready',
		requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
		representativeSolarZenithDegrees: resolution.representativeSolarZenithDegrees,
		cacheIdentity: manifest.cacheIdentity,
		numericalIdentity: manifest.numericalIdentity,
		packageRelativePath,
		manifest: {path: resolution.asset.loadRequest.manifestPath, sha256: manifestSha256},
		ledger: {path: manifest.ledgerPath, byteLength: ledgerFacts.size, sha256: ledgerSha256},
		exactSeamPayload,
		logicalToUniqueIndex,
		packageInventory: await createFileInventory(packageDirectory),
	};
}

async function resolveAndVerifyCacheInputs(fixture) {
	await assertNoReparseEntries(CACHE_ROOT, 'CR6 runtime cache root');
	const reportPath = path.join(CACHE_ROOT, 'package-report.json');
	const reportSha256 = await sha256File(reportPath);
	requireCondition(reportSha256 === PACKAGE_REPORT_SHA256, 'CR6 package report changed.');
	const report = await readJson(reportPath);
	requireCondition(report.accepted === true && report.packageCount === 109, 'CR6 package report is not accepted.');
	const catalogPath = path.join(CACHE_ROOT, report.catalogPath);
	assertLexicallyContained(CACHE_ROOT, catalogPath, 'CR6 runtime catalog');
	const catalogSha256 = await sha256File(catalogPath);
	requireCondition(catalogSha256 === CATALOG_SHA256 && catalogSha256 === report.catalogSha256, 'CR6 runtime catalog changed.');
	const catalog = await readJson(catalogPath);
	const scenes = [];
	const packages = [];
	const selections = [];
	for (const scene of fixture.scenes) {
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
			Math.abs(sceneState.solarZenithDegrees - scene.solarZenithDegrees) <=
				fixture.transitionBracket.maximumRecomputedSolarZenithResidualDegrees,
			`${scene.id} recomputed solar zenith changed.`,
		);
		const resolution = resolveDistantSunSceneCache(catalog, sceneState.solarZenithDegrees, '/cache/');
		requireCondition(resolution.status === scene.cacheExpectation.status, `${scene.id} ready/dark status changed.`);
		if (resolution.status === 'ready') {
			const verified = await verifyReadyPackage(scene, resolution);
			packages.push(verified);
			selections.push(verified);
			scenes.push({
				...scene,
				solarZenithDegrees: sceneState.solarZenithDegrees,
				solarElevationDegrees: 90 - sceneState.solarZenithDegrees,
				directionToSourceModel: sceneState.directionToSourceModel,
				cacheStatus: 'ready',
				cacheIdentity: verified.cacheIdentity,
				cacheSelectionEvidence: {
					sceneId: verified.sceneId,
					requestedSolarZenithDegrees: verified.requestedSolarZenithDegrees,
					representativeSolarZenithDegrees: verified.representativeSolarZenithDegrees,
					cacheIdentity: verified.cacheIdentity,
					manifest: verified.manifest,
				},
				sceneCacheAsset: resolution.asset,
			});
			continue;
		}
		requireCondition(
			resolution.status === 'dark' && sceneState.solarZenithDegrees >= catalog.darkFromSolarZenithDegrees &&
				!('asset' in resolution) && scene.cacheExpectation.textureBindingCount === 0,
			`${scene.id} did not resolve the shared texture-free dark state.`,
		);
		const dark = {
			sceneId: scene.id,
			timeIso: scene.timeIso,
			status: 'dark',
			requestedSolarZenithDegrees: resolution.requestedSolarZenithDegrees,
			darkFromSolarZenithDegrees: catalog.darkFromSolarZenithDegrees,
			cacheContributionId: 'cache-distant-sun-dark',
			cacheIdentity: 'algorithm32-distant-sun-shared-dark-v1',
			textureBindingCount: 0,
		};
		selections.push(dark);
		scenes.push({
			...scene,
			solarZenithDegrees: sceneState.solarZenithDegrees,
			solarElevationDegrees: 90 - sceneState.solarZenithDegrees,
			directionToSourceModel: sceneState.directionToSourceModel,
			cacheStatus: 'dark',
			cacheIdentity: dark.cacheIdentity,
		});
	}
	return {
		scenes,
		evidence: {
			schemaId: `${SCHEMA_PREFIX}-cache-input-verification-v1`,
			accepted: true,
			packageRoot: path.relative(REPOSITORY_ROOT, CACHE_ROOT).replaceAll('\\', '/'),
			packageReport: {path: 'package-report.json', sha256: reportSha256},
			catalog: {path: report.catalogPath, sha256: catalogSha256},
			darkFromSolarZenithDegrees: catalog.darkFromSolarZenithDegrees,
			packages,
			selections,
		},
	};
}

function assertCacheInputsUnchanged(before, after) {
	requireCondition(
		before.packageReport.sha256 === after.packageReport.sha256 &&
			exactJson(before.catalog, after.catalog) && before.packages.length === after.packages.length &&
			exactJson(before.selections.map(({packageInventory, ...entry}) => entry), after.selections.map(({packageInventory, ...entry}) => entry)),
		'CR6 cache catalog or selection boundary changed during execution.',
	);
	for (let index = 0; index < before.packages.length; index += 1) {
		assertFileInventoriesEqual(before.packages[index].packageInventory, after.packages[index].packageInventory, `CR6 ${before.packages[index].sceneId} cache package`);
	}
	return true;
}

function makeBrowserConfiguration(fixture, cacheInputs, parents) {
	return {
		...fixture,
		scenes: cacheInputs.scenes,
		browserParents: Object.fromEntries(
			Object.entries(parents).map(([parentId, evidence]) => [parentId, {
				parentId,
				prefix: `/${parentId}/`,
				runId: evidence.runId,
				conclusion: evidence.conclusion,
				artifactSetSha256: evidence.artifactSetSha256,
				manifest: fixture.parents[parentId].manifest,
			}]),
		),
	};
}

function elapsedMilliseconds(start, end) {
	return Date.parse(end) - Date.parse(start);
}

function makeProgress(run, browser, fixture) {
	const imageEvents = browser.progressEvents.filter(({stage}) => stage.startsWith('image-'));
	const firstImage = imageEvents[0] ?? null;
	const plate = browser.progressEvents.find(({stage}) => stage === 'decision-plate-complete') ?? null;
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: firstImage === null ? null : {
			stage: firstImage.stage,
			completedAt: firstImage.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstImage.completedAt),
			targetMilliseconds: 180_000,
		},
		decisionPlate: plate === null ? null : {
			stage: plate.stage,
			completedAt: plate.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, plate.completedAt),
			targetMilliseconds: 600_000,
		},
		requestedImageCount: fixture.gates.requestedImageCount,
		browserProgressEvents: browser.progressEvents,
	};
}

function verifyBrowserArtifactIdentities(analysis, browser, fixture) {
	const byPath = new Map(browser.uploads.map((upload) => [upload.path, upload]));
	const declared = [
		...(analysis.uploadedImages ?? []),
		...(analysis.uploadedDataArtifacts ?? []),
		...(analysis.uploadedEvidence ?? []),
	];
	for (const artifact of declared) {
		const upload = byPath.get(artifact.artifactPath);
		requireCondition(
			upload?.byteLength === artifact.byteLength && upload.sha256 === artifact.sha256,
			`CR6 browser/server identity differs for ${artifact.artifactPath}.`,
		);
	}
	requireCondition(
		exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), allowedBrowserArtifacts(fixture)),
		'CR6 browser upload order changed.',
	);
}

function flattenGpuErrors(analysis) {
	return analysis.scenes.flatMap((scene) => [
		...(scene.gpu?.modeErrors ?? []).flatMap(({webglErrors = []}) => webglErrors),
		...(scene.gpu?.replayErrors ?? []),
		...(scene.gpu?.terminalErrors ?? []),
	]);
}

function evaluateGates({analysis, browser, fixture, progress, immutable}) {
	const expectedImages = imageArtifactPaths(fixture);
	const expectedData = dataArtifactPaths(fixture);
	const expectedEvidence = browserEvidencePaths(fixture);
	const uploadPaths = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const sceneOrder = fixture.presentation.sceneOrder;
	const controlIds = new Set(fixture.gates.controlReplay.sharedCr4kSceneIds);
	const controlReplayRecords = analysis.scenes.filter(({sceneId}) => controlIds.has(sceneId));
	const gpuErrors = flattenGpuErrors(analysis);
	const fixed = analysis.fixedMemberTracks;
	const transition = analysis.transitionAnalysis;
	const candidateFacts = analysis.candidateEvidence;
	const frozenColorFacts = analysis.frozenColorEvidence;
	const fixedMetrics = fixed?.metrics;
	const darkMetrics = fixed?.darkSceneMetrics;
	const transitionMetrics = transition?.metrics;
	const transitionFacts = transition?.facts;
	const expectedMemberCount = fixture.stellarCandidate.catalog.memberCount;
	const expectedPaletteScalarCountPerScene =
		(expectedMemberCount + 1) * fixture.stellarCandidate.catalog.spectralChannelCount;
	const expectedPaletteScalarCount = expectedPaletteScalarCountPerScene * fixture.scenes.length;
	const expectedGpuProjectionMemberCoverageCount = expectedMemberCount * fixture.scenes.length;
	const memberLedgerEvidencePath = fixture.outputs.evidence.memberLedger;
	const memberLedgerEvidenceUpload = analysis.uploadedEvidence?.find(
		({artifactPath}) => artifactPath === memberLedgerEvidencePath,
	);
	const fixedTracksDerivation = analysis.evidenceDerivations?.fixedMemberTracks;
	const transitionDerivation = analysis.evidenceDerivations?.transitionAnalysis;
	const gates = {
		browserSchema:
			analysis.schemaId === `${SCHEMA_PREFIX}-browser-result-v2` &&
			analysis.fixedMemberTracks?.schemaId === 'algorithm32-color-reset-cr6-fixed-member-tracks-v2' &&
			analysis.transitionAnalysis?.schemaId === 'algorithm32-color-reset-cr6-transition-analysis-v2',
		claimBoundaryPreserved:
			analysis.appearanceAccepted === false && analysis.automaticCandidateSelection === false &&
			analysis.productionClaim === false && exactJson(analysis.claimBoundary, fixture.claimBoundary),
		renderCompletedBeforeScientificGates:
			analysis.renderComplete === true && analysis.scientificGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true,
		allThirtyEightImagesWrittenInOrder:
			analysis.requestedImageCount === 38 && analysis.uploadedImageCount === 38 &&
			exactJson(analysis.imageUploadOrder, expectedImages) &&
			exactJson(uploadPaths.slice(0, expectedImages.length), expectedImages),
		allRawDataWrittenAfterImages:
			exactJson(uploadPaths.slice(expectedImages.length, expectedImages.length + expectedData.length), expectedData) &&
			analysis.uploadedDataArtifacts?.length === expectedData.length,
		allBrowserEvidenceWrittenAfterData:
			exactJson(uploadPaths.slice(expectedImages.length + expectedData.length), expectedEvidence) &&
			analysis.uploadedEvidence?.length === expectedEvidence.length,
		allDerivationsRecorded:
			analysis.imageDerivations?.length === expectedImages.length &&
			analysis.dataDerivations?.length === expectedData.length &&
			analysis.panelIdentities?.length >= expectedImages.length &&
			typeof analysis.evidenceDerivations?.memberLedger?.projection === 'string' &&
			typeof analysis.evidenceDerivations?.memberLedger?.boundary === 'string' &&
			typeof analysis.evidenceDerivations?.memberLedger?.palette === 'string' &&
			fixedTracksDerivation?.parentMemberLedger?.artifactPath === memberLedgerEvidencePath &&
			fixedTracksDerivation?.parentMemberLedger?.schemaId ===
				'algorithm32-color-reset-cr6-member-ledger-v2' &&
			fixedTracksDerivation?.parentMemberLedger?.byteLength === memberLedgerEvidenceUpload?.byteLength &&
			fixedTracksDerivation?.parentMemberLedger?.sha256 === memberLedgerEvidenceUpload?.sha256 &&
			typeof fixedTracksDerivation?.selection === 'string' &&
			typeof fixedTracksDerivation?.brightnessRanking === 'string' &&
			typeof fixedTracksDerivation?.quartiles === 'string' &&
			typeof fixedTracksDerivation?.onsets === 'string' &&
			transitionDerivation?.parentMemberLedger?.artifactPath === memberLedgerEvidencePath &&
			transitionDerivation?.parentMemberLedger?.schemaId ===
				'algorithm32-color-reset-cr6-member-ledger-v2' &&
			transitionDerivation?.parentMemberLedger?.byteLength === memberLedgerEvidenceUpload?.byteLength &&
			transitionDerivation?.parentMemberLedger?.sha256 === memberLedgerEvidenceUpload?.sha256 &&
			typeof transitionDerivation?.operation === 'string',
		exactSceneOrder: exactJson(analysis.sceneOrder, sceneOrder),
		allScenesRecorded:
			analysis.scenes?.length === fixture.scenes.length &&
			analysis.scenes.every((scene, index) => scene.sceneId === sceneOrder[index] && scene.memberLedger?.length === 500),
		candidateEquationExact:
			candidateFacts?.equationIdentityExact === true && candidateFacts?.runtimeVisibilityFactor === 1,
		canonicalCollisionSumExact:
			candidateFacts?.canonicalCollisionMaximumRelativeDifference === 0 &&
			candidateFacts?.representativeMismatchCount === 0 &&
			candidateFacts?.orphanActualRepresentativePixelCount === 0 &&
			analysis.scenes.every((scene) =>
				scene.memberLedgerSummary?.canonicalCollisionPaletteBitMismatchGroupCount === 0 &&
				scene.memberLedgerSummary?.canonicalCollisionPaletteBitMismatchChannelCount === 0 &&
				scene.memberLedgerSummary?.representativeMismatchCount === 0 &&
				scene.memberLedgerSummary?.orphanActualRepresentativePixelCount === 0),
		canonicalWholePaletteBitExact:
			candidateFacts?.canonicalPaletteBitExact === true &&
			candidateFacts?.canonicalPaletteComparedScalarCount === expectedPaletteScalarCount &&
			candidateFacts?.completePaletteComparedValueCount === expectedPaletteScalarCount &&
			candidateFacts?.canonicalPaletteBitMismatchCount === 0 &&
			candidateFacts?.canonicalPaletteMaximumUlpDifference === 0 &&
			analysis.scenes.every((scene) => {
				const summary = scene.memberLedgerSummary;
				return (
					summary?.completePaletteBitExact === true &&
					summary?.completePaletteComparedValueCount === expectedPaletteScalarCountPerScene &&
					summary?.completePaletteBitMismatchValueCount === 0 &&
					summary?.completePaletteRelativeDifference === 0 &&
					summary?.canonicalPaletteComparedScalarCount === expectedPaletteScalarCountPerScene &&
					summary?.canonicalPaletteBitMismatchCount === 0 &&
					summary?.canonicalPaletteMaximumUlpDifference === 0
				);
			}),
		gpuMemberProjectionSetParity:
			candidateFacts?.gpuProjectionOccupiedPixelSetMismatchCount === 0 &&
			candidateFacts?.gpuProjectionRepresentativeIndexMismatchCount === 0 &&
			candidateFacts?.gpuProjectionNonfiniteValueCount === 0 &&
			candidateFacts?.gpuProjectionMemberCoverageCount ===
				expectedGpuProjectionMemberCoverageCount &&
			candidateFacts?.gpuProjectionGroupCount === analysis.scenes.reduce(
				(sum, scene) => sum + scene.memberLedgerSummary.actualOccupiedPixelCount,
				0,
			) &&
			analysis.scenes.every((scene) => {
				const summary = scene.memberLedgerSummary;
				const readback = scene.stellarGeneration?.memberProjectionReadback;
				return (
					summary?.gpuProjectionOccupiedPixelSetMismatchCount === 0 &&
					summary?.gpuProjectionRepresentativeIndexMismatchCount === 0 &&
					summary?.gpuProjectionNonfiniteValueCount === 0 &&
					summary?.gpuProjectionMemberCoverageCount === expectedMemberCount &&
					summary?.gpuProjectionGroupCount === summary?.actualOccupiedPixelCount &&
					readback?.authority === 'exact-active-gpu-stellar-geometry-member-readback-v1' &&
					readback?.memberCount === expectedMemberCount &&
					readback?.coveredMemberCount === expectedMemberCount &&
					readback?.geometryIdentity === scene.stellarGeneration?.geometryIdentity
				);
			}),
		noForbiddenPresentationInput:
			Array.isArray(candidateFacts?.forbiddenPresentationInputsObserved) &&
			candidateFacts.forbiddenPresentationInputsObserved.length === 0,
		sharedFrozenColorExact:
			frozenColorFacts?.curveExact === true && frozenColorFacts?.sharedStarAndSkyEvaluation === true &&
			frozenColorFacts?.extraExposureOrChromaticOperation === false &&
			exactJson(analysis.frozenSkyDisplay, fixture.frozenSkyDisplay),
		cpuGpuFramebufferParity:
			analysis.scenes.every((scene) =>
				scene.cpuGpuParity?.skyOnly?.maximumRgbCodeDifference <= fixture.gates.maximumCpuGpuRgbCodeDifference &&
				scene.cpuGpuParity?.finalComposite?.maximumRgbCodeDifference <= fixture.gates.maximumCpuGpuRgbCodeDifference),
		gpuStellarProjectionFeedsGpuFinal:
			analysis.scenes.every((scene) =>
				exactJson(scene.cpuGpuParity?.gpuParityPath, fixture.metrics.gpuParityPath) &&
				scene.cpuGpuParity?.gpuStellarProjectionFeedsGpuFinal === true &&
				scene.cpuGpuParity?.starProjection?.nonfiniteValueCount === 0 &&
				scene.cpuGpuParity?.starProjection?.comparedOccupiedPixelCount > 0),
		sharedCelestialConsumerEquivalence:
			candidateFacts?.starPositiveSunCoverageOverlapPixelCount ===
				fixture.gates.sharedCelestialConsumerEquivalence.maximumPositiveSunCoverageStellarPixelCount &&
			analysis.scenes.every((scene) =>
				scene.stellarDiagnostics?.starPositiveSunCoverageOverlapPixelCount === 0 &&
				scene.stellarDiagnostics?.sunCoverageOverlap?.starPositiveSunCoverageOverlapPixelCount === 0 &&
				scene.stellarDiagnostics?.sunCoverageOverlap?.maximumCoverageAtOccupiedStellarPixel === 0 &&
				Number.isFinite(scene.stellarDiagnostics?.sunCoverageOverlap?.positiveSunCoveragePixelCount)),
		controlReplay:
			controlReplayRecords.length === controlIds.size && controlReplayRecords.every((scene) =>
				scene.controlReplay?.available === true &&
				scene.controlReplay?.skyOnly?.maximumRgbCodeDifference <= fixture.gates.controlReplay.maximumRgbCodeDifference &&
				scene.controlReplay?.skyOnly?.rmse <= fixture.gates.controlReplay.maximumRgbCodeRmse),
		fixedCohortSufficient:
			fixedMetrics?.fixedCohortCount >= fixture.gates.minimumFixedCohortCount,
		progressiveOnsetIntervals:
			fixedMetrics?.distinctRobustOnsetIntervalCount >= fixture.gates.progressiveOnset.minimumDistinctRobustOnsetIntervals &&
			fixedMetrics?.laterRobustCrossingCount >= fixture.gates.progressiveOnset.minimumLaterRobustCrossingCount,
		brightnessOnsetOrdering:
			fixedMetrics?.topBrightnessQuartileMedianRobustOnsetIndex <= fixedMetrics?.bottomBrightnessQuartileMedianRobustOnsetIndex,
		conditionalNoRegression:
			fixedMetrics?.conditionalNoRegressionViolationCount === 0 &&
			fixed?.tracks?.every((track) => track.scenes?.every(({skyOnlyRgb8AtExactPixel}) =>
				Array.isArray(skyOnlyRgb8AtExactPixel) && skyOnlyRgb8AtExactPixel.length === 3)) === true,
		darkOrderingAndColor:
			darkMetrics?.sceneId === fixture.gates.darkSceneOrderingAndColor.sceneId &&
			darkMetrics?.robustFixedMemberCount >= fixture.gates.darkSceneOrderingAndColor.minimumRobustFixedMemberCount &&
			darkMetrics?.topBrightnessQuartileMedianDeltaY8 > darkMetrics?.bottomBrightnessQuartileMedianDeltaY8 &&
			Number.isFinite(darkMetrics?.sourceRedBlueQuartileMedianOrder?.red) &&
			Number.isFinite(darkMetrics?.sourceRedBlueQuartileMedianOrder?.blue) &&
			Number.isFinite(darkMetrics?.displayDeltaRedBlueQuartileMedianOrder?.red) &&
			Number.isFinite(darkMetrics?.displayDeltaRedBlueQuartileMedianOrder?.blue) &&
			darkMetrics.sourceRedBlueQuartileMedianOrder.red > darkMetrics.sourceRedBlueQuartileMedianOrder.blue &&
			darkMetrics.displayDeltaRedBlueQuartileMedianOrder.red > darkMetrics.displayDeltaRedBlueQuartileMedianOrder.blue &&
			darkMetrics?.exactWhiteStellarAddedPixelCount <= fixture.gates.darkSceneOrderingAndColor.maximumExactWhiteStellarAddedPixels &&
			darkMetrics?.distinctResolvedDisplayDeltaRgbTripleCount >= fixture.gates.darkSceneOrderingAndColor.minimumDistinctResolvedDisplayDeltaRgbTriples,
		transitionProjectionAndEligibilityExact:
			transitionFacts?.projectedPixelsExact === true && transitionFacts?.eligibilityExact === true &&
			transitionFacts?.collisionMembershipExact === true && transitionFacts?.sceneMaskExact === true &&
			transitionFacts?.presentationFactorExact === true,
		transitionPaletteAndDisplayStable:
			transitionMetrics?.maximumStarPaletteRelativeDifference <= fixture.gates.transition.maximumStarPaletteRelativeDifference &&
			transitionFacts?.robustMembershipExact === true &&
			transitionMetrics?.maximumPerStarDisplayedDeltaRgbCodeDifference <= fixture.gates.transition.maximumPerStarDisplayedDeltaRgbCodeDifference &&
			transitionMetrics?.maximumSkyOnlyRgbCodeDifference <= fixture.gates.transition.maximumSkyOnlyRgbCodeDifference,
		gpuHealthy:
			analysis.gpuSummary?.sceneCount === fixture.scenes.length &&
			analysis.gpuSummary.extColorBufferFloatEveryScene === true &&
			analysis.gpuSummary.contextLostAnyScene === false && gpuErrors.length === 0 &&
			analysis.gpuSummary.acquisitionWebglErrors?.length === 0 &&
			analysis.gpuSummary.terminalWebglErrors?.length === 0,
		d3d11HardwareExecution:
			browser.runtimeEnvironment?.requestedAngleBackend === 'd3d11' &&
			analysis.gpuSummary?.d3d11SceneCount === fixture.scenes.length &&
			analysis.gpuSummary.rendererValues?.every((value) =>
				/(?:Direct3D11|D3D11)/iu.test(value) && !/(?:SwiftShader|Microsoft Basic Render Driver|software renderer)/iu.test(value)),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		parentsRemainedImmutable: immutable.parents,
		cacheInputsRemainedImmutable: immutable.cache,
		controlSnapshotRemainedImmutable: immutable.snapshot,
		implementationRemainedImmutable: immutable.implementation,
		protectedSourceRemainedImmutable: immutable.protected,
		firstImageTimeTarget:
			progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityGateNames = [
		'browserSchema', 'claimBoundaryPreserved', 'renderCompletedBeforeScientificGates',
		'allThirtyEightImagesWrittenInOrder', 'allRawDataWrittenAfterImages',
		'allBrowserEvidenceWrittenAfterData', 'allDerivationsRecorded', 'exactSceneOrder',
		'allScenesRecorded', 'gpuHealthy', 'd3d11HardwareExecution', 'noBrowserServerErrors',
		'browserIdentityRecorded', 'parentsRemainedImmutable', 'cacheInputsRemainedImmutable',
		'controlSnapshotRemainedImmutable', 'implementationRemainedImmutable',
		'protectedSourceRemainedImmutable', 'firstImageTimeTarget', 'decisionPlateTimeTarget',
	];
	const integrityPassed = integrityGateNames.every((name) => gates[name] === true);
	const scientificPassed = Object.entries(gates)
		.filter(([name]) => !integrityGateNames.includes(name))
		.every(([, passed]) => passed === true);
	return {gates, integrityGateNames, integrityPassed, scientificPassed, accepted: integrityPassed && scientificPassed};
}

async function failureProgress(run, error) {
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		failedAt: new Date().toISOString(),
		error: error instanceof Error ? error.message : String(error),
	};
}

async function main() {
	const [cr1Selector, cr2Selector, cr4fSelector, cr4gSelector, cr4kSelector, ...extraArguments] = process.argv.slice(2);
	if (!cr1Selector || !cr2Selector || !cr4fSelector || !cr4gSelector || !cr4kSelector || extraArguments.length !== 0) {
		throw new Error(`${COMMAND_PREFIX} <explicit-CR1-run> <explicit-CR2-run> <explicit-CR4F-run> <explicit-CR4G-run> <explicit-CR4K-run>`);
	}
	const selectors = {cr1: cr1Selector, cr2: cr2Selector, cr4f: cr4fSelector, cr4g: cr4gSelector, cr4k: cr4kSelector};
	const parentIds = Object.keys(selectors);
	const fixture = await readJson(FIXTURE_PATH);
	verifyFixtureContract(fixture);
	const command = `${COMMAND_PREFIX} ${parentIds.map((parentId) => JSON.stringify(selectors[parentId])).join(' ')}`;
	const run = await initializeColorResetRunRecord({
		slug: 'cr6-stellar-contrast-onset',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR6 progressive stellar contrast onset',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: selectors,
			parents: fixture.parents,
			scenes: fixture.scenes,
			candidate: fixture.stellarCandidate,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			outputArtifacts: [...allowedBrowserArtifacts(fixture), fixture.outputs.evidence.analysis],
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Execute eight exact-cache Native15/N4/Q30 spherical scenes sequentially with the frozen one-pixel stellar screen palette and slope-078/p9 shared Color; retain sky-only, normalized stellar diagnostic, final composite, local contrast, raw palette/index/field/mask evidence, all-member ledgers, fixed-member tracks, and the consecutive-millisecond 108-degree comparison; write every requested image before scientific gates.',
			implementation: [
				RUNNER_RELATIVE_PATH,
				HARNESS_RELATIVE_PATH,
				FROZEN_COLOR_RELATIVE_PATH,
				DIAGNOSTIC_MODEL_RELATIVE_PATH,
				FIXTURE_RELATIVE_PATH,
			],
			parents: fixture.parents,
			physicalControls: fixture.physicalControls,
			candidate: fixture.stellarCandidate,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			exclusions: [
				'no sky, cache, transport, ozone, Q30, ground, source-radiometry, catalog, or stellar-screen-palette retuning',
				'no clock, source-kind, solar-zenith, cache-state, local-background, framebuffer, star-count, or magnitude-threshold visibility input',
				'no fitted star count or psychophysical visibility threshold',
				'no automatic appearance acceptance',
				'no production change',
			],
		},
		environment: {
			schemaId: `${SCHEMA_PREFIX}-environment-v1`,
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			browserTimeoutMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			cr4f: 'tmp/extraterrestrial/color-reset/runs/000032-cr4f-fine-twilight-cadence',
			cr4g: 'tmp/extraterrestrial/color-reset/runs/000033-cr4g-slope-limited-nautical-response-bracket',
			cr4k: 'tmp/extraterrestrial/color-reset/runs/000037-cr4k-minimal-deep-twilight-lift',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#star-appearance-constraints',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr6---establish-progressive-star-onset',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	const state = {};
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR6 implementation');
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		state.parentRootsBefore = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await resolveParentDirectory(selectors[parentId], `CR6 ${parentId} parent`),
		])));
		state.parentsBefore = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, selector: selectors[parentId], root: state.parentRootsBefore[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-before.json', state.parentsBefore);
		state.cacheBefore = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification-before.json', state.cacheBefore.evidence);
		state.snapshotBefore = await verifyControlSnapshot(fixture);
		await run.writeJsonArtifact('evidence/control-snapshot-before.json', state.snapshotBefore);
		state.implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', state.implementationBefore);
		state.protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', state.protectedBefore);
		const browserConfiguration = makeBrowserConfiguration(fixture, state.cacheBefore, state.parentsBefore);
		await run.writeJsonArtifact('browser/configuration.json', browserConfiguration);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6-stellar-contrast-onset-browser.js',
			exportName: 'runCr6StellarContrastOnsetBrowser',
			servedRoots: {
				'/cr1/': state.parentRootsBefore.cr1,
				'/cr2/': state.parentRootsBefore.cr2,
				'/cr4f/': state.parentRootsBefore.cr4f,
				'/cr4g/': state.parentRootsBefore.cr4g,
				'/cr4k/': state.parentRootsBefore.cr4k,
				'/cache/': CACHE_ROOT,
			},
			importMap: {
				three: '/dependencies/three/build/three.module.js',
				'three/addons/': '/dependencies/three/examples/jsm/',
			},
			allowedArtifactPaths: allowedBrowserArtifacts(fixture),
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
		});
		const analysis = {
			...browser.result,
			runtimeEnvironment: browser.runtimeEnvironment,
			serverUploads: browser.uploads,
		};
		verifyBrowserArtifactIdentities(analysis, browser, fixture);
		await run.writeJsonArtifact(fixture.outputs.evidence.analysis, analysis);
		await run.writeJsonArtifact('evidence/panel-identities.json', analysis.panelIdentities);
		await run.writeJsonArtifact('evidence/image-derivations.json', analysis.imageDerivations);
		await run.writeJsonArtifact('evidence/data-derivations.json', analysis.dataDerivations);

		state.implementationAfter = await captureImplementationAfter(state.implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', state.implementationAfter);
		const implementationUnchanged = assertImplementationUnchanged(state.implementationBefore, state.implementationAfter);
		state.parentRootsAfter = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await resolveParentDirectory(selectors[parentId], `CR6 ${parentId} parent after execution`),
		])));
		for (const parentId of parentIds) {
			requireCondition(
				pathComparisonKey(state.parentRootsBefore[parentId]) === pathComparisonKey(state.parentRootsAfter[parentId]),
				`CR6 ${parentId} selector resolved differently after execution.`,
			);
		}
		state.parentsAfter = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, selector: selectors[parentId], root: state.parentRootsAfter[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-after.json', state.parentsAfter);
		const parentsUnchanged = parentIds.every((parentId) => assertParentUnchanged(state.parentsBefore[parentId], state.parentsAfter[parentId], parentId));
		state.cacheAfter = await resolveAndVerifyCacheInputs(fixture);
		await run.writeJsonArtifact('evidence/cache-input-verification-after.json', state.cacheAfter.evidence);
		const cacheUnchanged = assertCacheInputsUnchanged(state.cacheBefore.evidence, state.cacheAfter.evidence);
		state.snapshotAfter = await verifyControlSnapshot(fixture);
		await run.writeJsonArtifact('evidence/control-snapshot-after.json', state.snapshotAfter);
		const snapshotUnchanged = assertControlSnapshotUnchanged(state.snapshotBefore, state.snapshotAfter);
		state.protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(state.protectedBefore.algorithm32, state.protectedAfter.algorithm32, 'CR6 protected Algorithm32 source');
		assertFileInventoriesEqual(state.protectedBefore.flat32, state.protectedAfter.flat32, 'CR6 protected Flat32 source');
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			immutable: {
				parents: parentsUnchanged,
				cache: cacheUnchanged,
				snapshot: snapshotUnchanged,
				implementation: implementationUnchanged,
				protected: true,
			},
		});
		const conclusion = decision.accepted ? 'accepted' : decision.integrityPassed ? 'rejected' : 'failed';
		const executionStatus = decision.accepted
			? 'objective-gates-passed-owner-review-pending'
			: decision.integrityPassed
				? 'objective-gates-rejected-owner-review-not-authoritative'
				: 'integrity-failed';
		const cpuGpuProjectedPixelResidualCount = analysis.scenes.reduce(
			(sum, scene) => sum + scene.memberLedgerSummary.cpuGpuProjectedPixelMismatchCount,
			0,
		);
		const projectionDiagnostics = {
			authority: 'exact-active-gpu-stellar-geometry-member-readback-v1',
			gpuMemberCoverageCount: analysis.candidateEvidence.gpuProjectionMemberCoverageCount,
			gpuGroupCount: analysis.candidateEvidence.gpuProjectionGroupCount,
			gpuOccupiedPixelSetMismatchCount:
				analysis.candidateEvidence.gpuProjectionOccupiedPixelSetMismatchCount,
			gpuRepresentativeIndexMismatchCount:
				analysis.candidateEvidence.gpuProjectionRepresentativeIndexMismatchCount,
			gpuNonfiniteValueCount: analysis.candidateEvidence.gpuProjectionNonfiniteValueCount,
			cpuGpuProjectedPixelResidualCount,
			cpuProjectionRole: 'report-only binary64 residual diagnostic',
		};
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v2`,
			executionStatus,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			scientificPassed: decision.scientificPassed,
			appearanceAccepted: false,
			ownerAppearanceDecisionRequired: true,
			productionClaim: false,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			integrityGateNames: decision.integrityGateNames,
			candidateEvidence: analysis.candidateEvidence,
			projectionDiagnostics,
			evidenceDerivations: analysis.evidenceDerivations,
			progress,
			parents: state.parentsAfter,
			cache: state.cacheAfter.evidence,
			outputs: {
				images: analysis.uploadedImages,
				data: analysis.uploadedDataArtifacts,
				evidence: analysis.uploadedEvidence,
			},
			fixedMemberTracks: analysis.fixedMemberTracks,
			transitionAnalysis: analysis.transitionAnalysis,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR6 stellar contrast onset`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All 38 requested images, 32 per-scene raw data artifacts, and three browser-derived evidence records were written before runner scientific gates. The run tests the existing one-pixel stellar presentation through the unchanged slope-078/p9 shared Color; it adds no runtime contrast threshold or time/cache visibility switch.',
			'',
			`- Complete R32F palette proof: ${analysis.candidateEvidence.canonicalPaletteComparedScalarCount.toLocaleString('en-US')} scalars, ${analysis.candidateEvidence.canonicalPaletteBitMismatchCount} bit mismatches, maximum ULP ${analysis.candidateEvidence.canonicalPaletteMaximumUlpDifference}.`,
			`- GPU member projection proof: ${projectionDiagnostics.gpuMemberCoverageCount.toLocaleString('en-US')} members, ${projectionDiagnostics.gpuGroupCount} occupied groups, ${projectionDiagnostics.gpuOccupiedPixelSetMismatchCount} occupied-set mismatches, ${projectionDiagnostics.gpuRepresentativeIndexMismatchCount} representative mismatches.`,
			`- CPU projection residual (report-only): ${cpuGpuProjectedPixelResidualCount} one-or-more-pixel disagreements.`,
			`- Fixed cohort: ${analysis.fixedMemberTracks.metrics.fixedCohortCount} members.`,
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'Appearance remains an explicit owner decision. This static distant-Sun cadence makes no production, psychophysical, camera, or unsampled-animation claim.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(
			independent.verified === true && independent.conclusion === conclusion &&
				independent.artifactSetSha256 === manifest.artifactSetSha256,
			'CR6 terminal run failed independent verification.',
		);
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: independent.verified,
			appearanceAccepted: false,
			gates: decision.gates,
			progress,
			outputs: analysis.uploadedImages,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) await run.writeJsonArtifact('progress.json', await failureProgress(run, error));
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: `${SCHEMA_PREFIX}-failure-v1`,
				failedAt: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack ?? null : null,
			});
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: `${SCHEMA_PREFIX}-failure-result-v1`, accepted: false},
				report: `# ${run.runId}: CR6 stellar contrast onset\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
