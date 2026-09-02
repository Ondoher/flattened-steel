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
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {
	COLOR_RESET_RUNS_ROOT,
	initializeColorResetRunRecord,
	resolveColorResetRunRoots,
} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND_PREFIX =
	'node scripts/extraterrestrial/color-reset/runners/run-cr4g-slope-limited-nautical-response-bracket.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr4g-slope-limited-nautical-response-bracket-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4g-slope-limited-nautical-response-bracket-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const CONTROL_MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
const CONTROL_MODEL_PATH = path.join(REPOSITORY_ROOT, ...CONTROL_MODEL_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4g-slope-limited-nautical-response-bracket';

const FIXTURE_SHA256 = 'cef1510b9f04896d0291f152114681e3818eeda8af120db1beb1cfa1055005e0';
const HARNESS_SHA256 = '48b5f3c6ca9ac910758cf18b35a7ef8f2cc9a22040c08acc1cff462fd6e8e96c';
const MODEL_SHA256 = '7b8115c66bf0b37543f3bd2fe659f91c927648ee76f29f46725cdbb5c0818f8e';
const CONTROL_MODEL_SHA256 = '36e66141a2aa820c7696ad100f1d71685efd02768c23b22a77a7573b8746c70d';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const UPLOAD_LIMIT_BYTES = 128 * 1024 * 1024;

const EXPECTED_PARENTS = Object.freeze({
	cr1: Object.freeze({
		runId: '000005-six-scene-visual-baseline',
		artifactSetSha256: '2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc',
		manifestSha256: '3ba1199191f6b9dd825b0475c7d329a4b0be84e441db655d354bdce234f6949b',
		analysisSchemaId: 'algorithm32-color-reset-cr1-browser-result-v1',
	}),
	cr4f: Object.freeze({
		runId: '000032-cr4f-fine-twilight-cadence',
		artifactSetSha256: '60e01c9cd2b26579f5c83cc0904f29b920493000a497019c5f2b0f6b2cf21042',
		manifestSha256: '97b42405a154405eab3603ea56e91d493249ce9304e999d2d06abbce5a01260e',
		analysisSchemaId: 'algorithm32-color-reset-cr4f-fine-twilight-cadence-browser-result-v1',
	}),
});
const EXPECTED_SCENE_IDS = Object.freeze([
	'sunset',
	'sunset-plus-10-minutes',
	'sunset-plus-20-minutes',
	'sunset-plus-30-minutes',
	'sunset-plus-45-minutes',
	'sunset-plus-60-minutes',
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
		value === value.replaceAll('\\', '/') &&
		!path.posix.isAbsolute(value) &&
		!value.split('/').includes('..')
	);
}

function outputImages(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder];
}

function responseIds(fixture) {
	return [fixture.response.control.id, ...fixture.response.candidates.map(({id}) => id)];
}

function parentArtifacts(fixture, parentId) {
	const parent = fixture.parents[parentId];
	const selected = [parent.analysis];
	for (const scene of fixture.scenes) {
		if ((parentId === 'cr1' && scene.sourcePrefix === '/cr1/') ||
			(parentId === 'cr4f' && scene.sourcePrefix === '/cr4f/')) {
			selected.push(scene.field, scene.mask);
		}
		if (parentId === 'cr4f') selected.push(scene.control);
	}
	return [...new Map(selected.map((artifact) => [artifact.path, artifact])).values()];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === `${SCHEMA_PREFIX}-input-v1`,
		'CR4G fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.fieldReplayOnly === true &&
			fixture.claimBoundary.physicalTransportExecution === false &&
			fixture.claimBoundary.cacheExecution === false &&
			fixture.claimBoundary.appearanceAcceptanceGate === false &&
			fixture.claimBoundary.appearanceAccepted === false &&
			fixture.claimBoundary.perSceneColorTuning === false &&
			fixture.claimBoundary.automaticCandidateSelection === false &&
			fixture.claimBoundary.productionClaim === false,
		'CR4G claim boundary changed.',
	);
	for (const parentId of ['cr1', 'cr4f']) {
		const parent = fixture.parents?.[parentId];
		const expected = EXPECTED_PARENTS[parentId];
		requireCondition(
			parent?.namespace === 'color-reset' &&
				parent.runId === expected.runId &&
				parent.conclusion === 'accepted' &&
				parent.artifactSetSha256 === expected.artifactSetSha256 &&
				parent.manifest?.path === 'artifact-manifest.json' &&
				parent.manifest.sha256 === expected.manifestSha256,
			`CR4G ${parentId} parent declaration changed.`,
		);
		for (const descriptor of [parent.manifest, parent.analysis, ...parentArtifacts(fixture, parentId)]) {
			requireCondition(
				isArtifactPath(descriptor?.path) &&
					Number.isSafeInteger(descriptor.byteLength) &&
					descriptor.byteLength > 0 &&
					isSha256(descriptor.sha256),
				`CR4G ${parentId} artifact declaration is invalid.`,
			);
		}
	}
	requireCondition(
		fixture.viewport?.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4G viewport changed.',
	);
	requireCondition(
		fixture.scenes?.length === EXPECTED_SCENE_IDS.length &&
		exactJson(fixture.scenes.map(({id}) => id), EXPECTED_SCENE_IDS) &&
		exactJson(fixture.presentation?.sceneOrder, EXPECTED_SCENE_IDS),
		'CR4G scene chronology changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			(scene.sourcePrefix === '/cr1/' || scene.sourcePrefix === '/cr4f/') &&
				Number.isFinite(scene.solarZenithDegrees) &&
				Number.isFinite(scene.solarElevationDegrees) &&
				scene.totalHorizontalIlluminance?.units === 'lux' &&
				Number.isFinite(scene.totalHorizontalIlluminance.value) &&
				scene.totalHorizontalIlluminance.value >= 0 &&
				scene.field.byteLength === 4_096_000 &&
				scene.mask.byteLength === 256_000,
			`CR4G scene declaration changed for ${scene.id}.`,
		);
	}
	requireCondition(
		fixture.response?.control?.id === 'cr4c-control' &&
			fixture.response.candidates?.length === 3 &&
			exactJson(fixture.presentation?.responseOrder, responseIds(fixture)),
		'CR4G response bracket changed.',
	);
	for (const candidate of fixture.response.candidates) {
		requireCondition(
			candidate.adaptationExponent > 0 && candidate.adaptationExponent < 1,
			`CR4G ${candidate.id} exponent is outside the declared slope boundary.`,
		);
	}
	const responseProof = fixture.diagnostics?.responseProof;
	requireCondition(
		Number.isFinite(responseProof?.minimumIlluminanceLux) &&
			responseProof.minimumIlluminanceLux > 0 &&
			Number.isFinite(responseProof.maximumIlluminanceLux) &&
			responseProof.maximumIlluminanceLux > responseProof.minimumIlluminanceLux &&
			Number.isSafeInteger(responseProof.positiveLogSampleCount) &&
			responseProof.positiveLogSampleCount >= 2 &&
			responseProof.deepElasticityMaximumIlluminanceLux ===
				fixture.scenes.find(({id}) => id === 'sunset-plus-20-minutes')
					?.totalHorizontalIlluminance.value &&
			Number.isFinite(responseProof.maximumElasticityExcess) &&
			responseProof.maximumElasticityExcess >= 0 &&
			Number.isFinite(responseProof.maximumHighLightGainExcess) &&
			responseProof.maximumHighLightGainExcess >= 0,
		'CR4G response-proof declaration changed or is invalid.',
	);
	const expectedImages = [
		...responseIds(fixture).flatMap((id) => fixture.outputs.frames[id]),
		...responseIds(fixture).map((id) => fixture.outputs.chronologies[id]),
		fixture.outputs.diagnostic,
		fixture.outputs.decisionPlate,
	];
	requireCondition(
		expectedImages.length === 30 &&
			exactJson(outputImages(fixture), expectedImages) &&
			new Set(expectedImages).size === expectedImages.length &&
			expectedImages.every(isArtifactPath),
		'CR4G requires exactly thirty unique images in frame-first order.',
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

async function verifyParent({fixture, parentId, root, selector}) {
	const specification = fixture.parents[parentId];
	const expected = EXPECTED_PARENTS[parentId];
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.conclusion === 'accepted' &&
			terminal.runId === expected.runId &&
			terminal.artifactSetSha256 === expected.artifactSetSha256,
		`CR4G requires the explicitly selected accepted ${parentId} parent.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === specification.manifest.byteLength,
		`CR4G ${parentId} manifest file identity changed.`,
	);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === expected.manifestSha256, `CR4G ${parentId} manifest changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === expected.runId &&
			manifest.conclusion === 'accepted' &&
			manifest.artifactSetSha256 === expected.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		`CR4G ${parentId} terminal manifest identity changed.`,
	);
	const selected = parentArtifacts(fixture, parentId);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR4G ${parentId} manifest identity changed for ${artifact.path}.`,
		);
		const artifactPath = path.join(root, ...artifact.path.split('/'));
		const facts = await lstat(artifactPath);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength,
			`CR4G ${parentId} artifact file identity changed for ${artifact.path}.`,
		);
		requireCondition((await sha256File(artifactPath)) === artifact.sha256, `CR4G ${parentId} artifact changed: ${artifact.path}.`);
	}
	const analysis = await readJson(path.join(root, ...specification.analysis.path.split('/')));
	requireCondition(
		analysis.schemaId === expected.analysisSchemaId &&
			(parentId === 'cr1' || analysis.renderComplete === true),
		`CR4G ${parentId} analysis schema or declared render state changed.`,
	);
	if (parentId === 'cr4f') {
		requireCondition(
			analysis.integrityGateEvaluated === false &&
				analysis.appearanceAccepted === false &&
				exactJson(analysis.scenes?.map(({sceneId}) => sceneId), EXPECTED_SCENE_IDS),
			'CR4G CR4F claim boundary or scene order changed.',
		);
		for (const scene of fixture.scenes) {
			const parentScene = analysis.scenes.find(({sceneId}) => sceneId === scene.id);
			requireCondition(
				parentScene?.totalHorizontalIlluminance?.units === 'lux' &&
					parentScene.totalHorizontalIlluminance.value === scene.totalHorizontalIlluminance.value &&
					Math.abs(parentScene.solarZenithDegrees - scene.solarZenithDegrees) <= 1e-6 &&
					Math.abs(parentScene.solarElevationDegrees - scene.solarElevationDegrees) <= 1e-6,
				`CR4G CR4F receiver-light or angle evidence changed for ${scene.id}.`,
			);
		}
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-${parentId}-parent-verification-v1`,
		verified: true,
		explicitSelector: selector,
		runId: terminal.runId,
		slug: terminal.slug,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		conclusion: terminal.conclusion,
		manifest: {...specification.manifest, sha256: manifestSha256, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		selectedArtifacts: selected,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...selected.map(({path: artifactPath}) => artifactPath),
		]),
		analysis: {
			...specification.analysis,
			schemaId: analysis.schemaId,
			verified: true,
		},
	};
}

function assertParentUnchanged(before, after, label) {
	requireCondition(
		before.runId === after.runId &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes,
		`${label} terminal identity changed during execution.`,
	);
	assertFileInventoriesEqual(before.selectedArtifactInventory, after.selectedArtifactInventory, `${label} selected artifacts`);
	return true;
}

async function verifyControlSnapshot() {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestSha256 === SNAPSHOT_MANIFEST_SHA256, 'CR4G control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4G control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {include: (relativePath) => selectedPaths.has(relativePath)}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4G snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4G snapshot and production closure');
	return {schemaId: `${SCHEMA_PREFIX}-control-snapshot-verification-v1`, accepted: true, manifestSha256, snapshotInventory, productionSelection};
}

function assertControlSnapshotUnchanged(before, after) {
	requireCondition(before.manifestSha256 === after.manifestSha256, 'CR4G control snapshot changed during execution.');
	assertFileInventoriesEqual(before.snapshotInventory, after.snapshotInventory, 'CR4G snapshot source');
	assertFileInventoriesEqual(before.productionSelection, after.productionSelection, 'CR4G selected production source');
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256, controlModelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(MODEL_PATH),
		sha256File(CONTROL_MODEL_PATH),
	]);
	requireCondition(isSha256(FIXTURE_SHA256), 'CR4G fixture SHA-256 pin is not finalized.');
	requireCondition(isSha256(HARNESS_SHA256), 'CR4G browser-harness SHA-256 pin is not finalized.');
	requireCondition(isSha256(MODEL_SHA256), 'CR4G model SHA-256 pin is not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4G fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4G browser harness changed after predeclaration.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4G model changed after predeclaration.');
	requireCondition(controlModelSha256 === CONTROL_MODEL_SHA256, 'CR4G CR4C control model changed.');
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		model: {path: MODEL_RELATIVE_PATH, sha256: modelSha256},
		controlModel: {path: CONTROL_MODEL_RELATIVE_PATH, sha256: controlModelSha256},
	};
}

async function captureImplementation() {
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4g-slope-limited-nautical-response-bracket.js',
			'color-reset/harness/cr4g-slope-limited-nautical-response-bracket-browser.js',
		],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:http',
			'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
		],
	});
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-v1`,
		closure,
		inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, closure.files),
		packageBoundary: {
			packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
			packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
		},
	};
}

function assertImplementationUnchanged(before, after) {
	requireCondition(exactJson(before.closure, after.closure), 'CR4G implementation closure changed during execution.');
	requireCondition(exactJson(before.packageBoundary, after.packageBoundary), 'CR4G package boundary changed during execution.');
	assertFileInventoriesEqual(before.inventory, after.inventory, 'CR4G implementation closure');
	return true;
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const expected = outputImages(fixture);
	const images = browser.uploads.filter(({path: artifactPath}) => expected.includes(artifactPath));
	const first = images[0] ?? null;
	const plate = images.find(({path: artifactPath}) => artifactPath === fixture.outputs.decisionPlate) ?? null;
	const timed = (entry, targetMilliseconds) => entry === null ? null : ({
		artifactPath: entry.path,
		completedAt: entry.completedAt,
		elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, entry.completedAt),
		targetMilliseconds,
	});
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: timed(first, 180_000),
		decisionPlate: timed(plate, 600_000),
		allRequestedImages: images.length === expected.length ? {
			count: images.length,
			completedAt: images.at(-1).completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, images.at(-1).completedAt),
		} : null,
	};
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
			`CR4G browser/server image identity differs for ${image.artifactPath}.`,
		);
	}
	const expected = outputImages(fixture);
	const actual = browser.uploads.map(({path: artifactPath}) => artifactPath);
	requireCondition(exactJson(actual, expected), 'CR4G browser uploads differ from the declared frame-first order.');
	return true;
}

function responseRecords(analysis) {
	const records = analysis.responses ?? analysis.candidates;
	requireCondition(Array.isArray(records), 'CR4G browser result omitted response records.');
	return records;
}

function responseId(record) {
	return record.responseId ?? record.candidateId ?? record.id;
}

function chronologyPass(record, fixture) {
	const chronology = record.chronology;
	const expectedRegionIds = fixture.diagnostics.chronologyRegions.map(({id}) => id);
	return chronology?.allStrictlyDecreasing === true &&
		Array.isArray(chronology.regions) &&
		exactJson(chronology.regions.map(({regionId}) => regionId), expectedRegionIds) &&
		chronology.regions.every(({values, strictlyDecreasing}) =>
			strictlyDecreasing === true &&
			Array.isArray(values) &&
			values.length === EXPECTED_SCENE_IDS.length &&
			values.every(Number.isFinite) &&
			values.every((value, index) => index === 0 || value < values[index - 1]),
		);
}

function hasPlusThirtyToFortyFiveReversal(chronology) {
	return Array.isArray(chronology?.regions) && chronology.regions.length === 3 &&
		chronology.regions.every(({values}) =>
			Array.isArray(values) && values.length === EXPECTED_SCENE_IDS.length && values[4] > values[3],
		);
}

function clippingPass(record, fixture) {
	return Array.isArray(record.scenes) && record.scenes.length === EXPECTED_SCENE_IDS.length &&
		record.scenes.every((scene) =>
			Array.isArray(scene.regions) && scene.regions.length === 3 &&
			scene.regions.every((region) =>
				region.blackSkyPixelFraction <= fixture.diagnostics.maximumCandidateBlackSkyFraction &&
				region.saturatedSkyPixelFraction <= fixture.diagnostics.maximumCandidateSaturatedSkyFraction,
			),
		);
}

function elasticityPass(record, fixture) {
	const proof = record.responseProof ?? record.analyticResponseProof;
	const sampled = record.sampledResponse ?? proof;
	const candidate = fixture.response.candidates.find(({id}) => id === responseId(record));
	const declaration = fixture.diagnostics.responseProof;
	return candidate !== undefined &&
		sampled?.finite === true &&
		sampled.positive === true &&
		Number.isFinite(sampled.minimumGain) &&
		sampled.minimumGain > 0 &&
		sampled.monotonicNonincreasing === true &&
		sampled.derivativeNonpositive === true &&
		sampled.sampleCount === declaration.positiveLogSampleCount + 1 &&
		sampled.minimumPositiveIlluminanceLux === declaration.minimumIlluminanceLux &&
		sampled.maximumIlluminanceLux === declaration.maximumIlluminanceLux &&
		sampled.candidateDomainMaximumIlluminanceLux ===
			declaration.deepElasticityMaximumIlluminanceLux &&
		Number.isFinite(sampled.maximumCandidateDomainPositiveGainElasticity) &&
		sampled.maximumCandidateDomainPositiveGainElasticity < 1 &&
		sampled.maximumCandidateDomainPositiveGainElasticity <=
			candidate.adaptationExponent + declaration.maximumElasticityExcess &&
		Number.isFinite(sampled.gainAtMaximumIlluminance) &&
		Number.isFinite(sampled.highLightGainExcess) &&
		sampled.highLightGainExcess <= declaration.maximumHighLightGainExcess;
}

function cpuGpuPass(record, fixture) {
	return Array.isArray(record.scenes) && record.scenes.every((scene) => {
		const parity = scene.cpuGpuParity ?? scene.gpuCpuParity ?? scene.candidateGpuCpuParity;
		const encoded = parity?.encodedSky ?? parity?.encoded;
		const encodedAll = parity?.encodedAll;
		const floating = parity?.floatSky ?? parity?.float;
		return (encoded?.maximumAbsoluteRgbCodeDifference ?? encoded?.maximumAbsoluteDifference) <=
				fixture.diagnostics.maximumCpuGpuRgbCodeDifference &&
			(encodedAll?.maximumAbsoluteRgbCodeDifference ?? encodedAll?.maximumAbsoluteDifference) <=
				fixture.diagnostics.maximumCpuGpuRgbCodeDifference &&
			Number.isFinite(floating?.maximumAbsoluteRgbDifference ?? floating?.maximumAbsoluteDifference) &&
			floating?.nonfiniteValueCount === 0 &&
			scene.gpu?.errors?.length === 0 && scene.gpu.contextLost === false;
	});
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged, snapshotUnchanged, implementationUnchanged}) {
	const expectedImages = outputImages(fixture);
	const records = responseRecords(analysis);
	const byId = new Map(records.map((record) => [responseId(record), record]));
	const control = byId.get('cr4c-control');
	const candidateFacts = fixture.response.candidates.map((candidate) => {
		const record = byId.get(candidate.id);
		const chronology = record !== undefined && chronologyPass(record, fixture);
		const clipping = record !== undefined && clippingPass(record, fixture);
		const elasticity = record !== undefined && elasticityPass(record, fixture);
		const cpuGpuParity = record !== undefined && cpuGpuPass(record, fixture);
		return {
			candidateId: candidate.id,
			chronology,
			clipping,
			elasticity,
			cpuGpuParity,
			passed: chronology && clipping && elasticity && cpuGpuParity,
		};
	});
	const serverOrder = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const gates = {
		browserResultSchema: analysis.schemaId === `${SCHEMA_PREFIX}-browser-result-v1`,
		claimBoundaryPreserved:
			analysis.appearanceAccepted === false &&
			analysis.productionClaim === false &&
			fixture.claimBoundary.appearanceAcceptanceGate === false,
		renderCompletedBeforeRunnerGates:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.scientificGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true,
		allThirtyImagesWrittenInOrder:
			browser.uploads.length === expectedImages.length && exactJson(serverOrder, expectedImages),
		allFramesPrecedeFigures:
			exactJson(serverOrder.slice(0, 24), responseIds(fixture).flatMap((id) => fixture.outputs.frames[id])),
		decisionPlateWrittenLast: serverOrder.at(-1) === fixture.outputs.decisionPlate,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		d3d11HardwareReplay:
			browser.runtimeEnvironment?.requestedAngleBackend === 'd3d11' &&
			analysis.gpu?.d3d11CompatibleShaderSurface === true &&
			typeof analysis.gpu.renderer === 'string' &&
			/(?:Direct3D11|D3D11)/iu.test(analysis.gpu.renderer) &&
			!/(?:SwiftShader|Microsoft Basic Render Driver|software renderer)/iu.test(
				analysis.gpu.renderer,
			),
		exactResponseOrder:
			exactJson(records.map(responseId), responseIds(fixture)) &&
			exactJson(analysis.responseOrder, responseIds(fixture)) &&
			exactJson(analysis.sceneOrder, EXPECTED_SCENE_IDS) &&
			records.every((record) => exactJson(record.scenes?.map(({sceneId}) => sceneId), EXPECTED_SCENE_IDS)),
		controlReplayHealthy:
			control !== undefined &&
			analysis.controlParentReplayWithinOneCode === true &&
			hasPlusThirtyToFortyFiveReversal(analysis.controlParentChronology) &&
			hasPlusThirtyToFortyFiveReversal(control.chronology) &&
			control.scenes?.every((scene) => {
				const comparison =
					scene.controlParentReplay ?? scene.controlReplay ?? scene.parentControlReplay;
				return comparison?.sky?.maximumAbsoluteRgbCodeDifference <=
						fixture.diagnostics.maximumControlReplayRgbCodeDifference &&
					comparison?.all?.maximumAbsoluteRgbCodeDifference <=
						fixture.diagnostics.maximumControlReplayRgbCodeDifference;
			}),
		controlCpuGpuParity: control !== undefined && cpuGpuPass(control, fixture),
		allParentInputsVerifiedByBrowser:
			analysis.scenes?.length === EXPECTED_SCENE_IDS.length &&
			analysis.scenes.every((scene) =>
				scene.field?.verified === true &&
				scene.mask?.verified === true &&
				scene.control?.verified === true,
			),
		allImageDerivationsRecorded: analysis.imageDerivations?.length === expectedImages.length,
		allPanelIdentitiesRecorded: analysis.panelIdentities?.length >= expectedImages.length,
		gpuReplayHealthy:
			analysis.gpu?.extColorBufferFloat === true &&
			analysis.gpu.startupErrors?.length === 0 &&
			analysis.gpu.terminalErrors?.length === 0 &&
			analysis.gpu.errors?.length === 0 &&
			analysis.gpu.contextLost === false,
		parentsRemainedImmutable: parentsUnchanged,
		controlSnapshotRemainedImmutable: snapshotUnchanged,
		implementationRemainedImmutable: implementationUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityPassed = Object.values(gates).every(Boolean);
	const anyCandidatePassed = candidateFacts.some(({passed}) => passed);
	return {gates, candidateFacts, integrityPassed, anyCandidatePassed, accepted: integrityPassed && anyCandidatePassed};
}

async function main() {
	const [cr1Selector, cr4fSelector, ...extraArguments] = process.argv.slice(2);
	if (!cr1Selector || !cr4fSelector || extraArguments.length !== 0) {
		throw new Error(`Usage: ${COMMAND_PREFIX} <explicit-CR1-run-id-or-contained-path> <explicit-CR4F-run-id-or-contained-path>`);
	}
	const command = `${COMMAND_PREFIX} ${JSON.stringify(cr1Selector)} ${JSON.stringify(cr4fSelector)}`;
	const fixture = await readJson(FIXTURE_PATH);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4g-slope-limited-nautical-response-bracket',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4G slope-limited nautical response bracket',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: {cr1: cr1Selector, cr4f: cr4fSelector},
			parents: fixture.parents,
			responses: [fixture.response.control, ...fixture.response.candidates],
			scenes: fixture.scenes,
			outputArtifacts: outputImages(fixture),
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation: 'Replay six authenticated immutable Native15/Q30 signed projected linear RGBY fields through the rejected CR4C response control and three predeclared global slope-limited pre-tone responses; write every full-resolution frame and labeled review figure before runner gates.',
			implementation: [HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, MODEL_RELATIVE_PATH, CONTROL_MODEL_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			parents: fixture.parents,
			exclusions: ['no physical transport or cache execution', 'no field or illuminance interpolation', 'no per-scene tuning', 'no automatic appearance selection', 'no production change'],
		},
		environment: {
			schemaId: `${SCHEMA_PREFIX}-environment-v1`,
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			browserTimeoutMilliseconds: 600_000,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr4f: 'tmp/extraterrestrial/color-reset/runs/000032-cr4f-fine-twilight-cadence',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	const state = {
		implementationBefore: null, implementationAfter: null,
		protectedBefore: null, protectedAfter: null,
		parentRootsBefore: null, parentRootsAfter: null,
		parentsBefore: null, parentsAfter: null,
		snapshotBefore: null, snapshotAfter: null,
	};
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4G color-reset implementation');
		verifyFixtureContract(fixture);
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		state.parentRootsBefore = {
			cr1: await resolveParentDirectory(cr1Selector, 'CR4G CR1 parent'),
			cr4f: await resolveParentDirectory(cr4fSelector, 'CR4G CR4F parent'),
		};
		state.parentsBefore = {
			cr1: await verifyParent({fixture, parentId: 'cr1', root: state.parentRootsBefore.cr1, selector: cr1Selector}),
			cr4f: await verifyParent({fixture, parentId: 'cr4f', root: state.parentRootsBefore.cr4f, selector: cr4fSelector}),
		};
		await run.writeJsonArtifact('evidence/parents-before.json', state.parentsBefore);
		state.snapshotBefore = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-before.json', state.snapshotBefore);
		state.implementationBefore = await captureImplementation();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', state.implementationBefore);
		state.protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', state.protectedBefore);
		await run.writeJsonArtifact('browser/configuration.json', fixture);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4g-slope-limited-nautical-response-bracket-browser.js',
			exportName: 'runCr4gSlopeLimitedNauticalResponseBracketBrowser',
			servedRoots: {'/cr1/': state.parentRootsBefore.cr1, '/cr4f/': state.parentRootsBefore.cr4f},
			allowedArtifactPaths: outputImages(fixture),
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: 600_000,
		});
		const analysis = {...browser.result, runtimeEnvironment: browser.runtimeEnvironment, serverUploads: browser.uploads};
		verifyBrowserArtifactIdentities(analysis, browser, fixture);
		await run.writeJsonArtifact('evidence/analysis.json', analysis);
		await run.writeJsonArtifact('evidence/panel-identities.json', analysis.panelIdentities);
		await run.writeJsonArtifact('evidence/image-derivations.json', analysis.imageDerivations);
		state.implementationAfter = await captureImplementation();
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', state.implementationAfter);
		const implementationUnchanged = assertImplementationUnchanged(state.implementationBefore, state.implementationAfter);
		state.parentRootsAfter = {
			cr1: await resolveParentDirectory(cr1Selector, 'CR4G CR1 parent after render'),
			cr4f: await resolveParentDirectory(cr4fSelector, 'CR4G CR4F parent after render'),
		};
		for (const parentId of ['cr1', 'cr4f']) {
			requireCondition(
				pathComparisonKey(state.parentRootsBefore[parentId]) === pathComparisonKey(state.parentRootsAfter[parentId]),
				`CR4G ${parentId} selector resolved differently after rendering.`,
			);
		}
		state.parentsAfter = {
			cr1: await verifyParent({fixture, parentId: 'cr1', root: state.parentRootsAfter.cr1, selector: cr1Selector}),
			cr4f: await verifyParent({fixture, parentId: 'cr4f', root: state.parentRootsAfter.cr4f, selector: cr4fSelector}),
		};
		await run.writeJsonArtifact('evidence/parents-after.json', state.parentsAfter);
		const parentsUnchanged = ['cr1', 'cr4f'].every((parentId) =>
			assertParentUnchanged(state.parentsBefore[parentId], state.parentsAfter[parentId], `CR4G ${parentId} parent`),
		);
		state.snapshotAfter = await verifyControlSnapshot();
		await run.writeJsonArtifact('evidence/control-snapshot-after.json', state.snapshotAfter);
		const snapshotUnchanged = assertControlSnapshotUnchanged(state.snapshotBefore, state.snapshotAfter);
		state.protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(state.protectedBefore.algorithm32, state.protectedAfter.algorithm32, 'CR4G protected Algorithm32 source');
		assertFileInventoriesEqual(state.protectedBefore.flat32, state.protectedAfter.flat32, 'CR4G protected Flat32 source');
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged, snapshotUnchanged, implementationUnchanged});
		const conclusion = decision.accepted ? 'accepted' : decision.integrityPassed ? 'rejected' : 'failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			anyCandidatePassedScientificGates: decision.anyCandidatePassed,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			candidateFacts: decision.candidateFacts,
			progress,
			parents: state.parentsAfter,
			outputs: analysis.uploadedImages,
			protectedSourceUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4G slope-limited nautical response bracket`, '',
			`Conclusion: **${conclusion}**.`, '',
			'All 24 full-resolution frames and six labeled figures were written before runner gates. The physical RGBY fields, masks, receiver-light facts, and production sources remained immutable.', '',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'} integrity: ${name}`),
			'',
			...decision.candidateFacts.map((candidate) => `- ${candidate.passed ? 'PASS' : 'FAIL'} candidate ${candidate.candidateId}: chronology=${candidate.chronology}, clipping=${candidate.clipping}, elasticity=${candidate.elasticity}, cpuGpuParity=${candidate.cpuGpuParity}`),
			'',
			'Appearance remains unaccepted and requires owner review; no candidate was automatically selected or promoted.', '',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(
			independent.verified === true && independent.conclusion === conclusion &&
				independent.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4G terminal run failed independent verification.',
		);
		process.stdout.write(`${JSON.stringify({
			runId: run.runId, conclusion, artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: independent.verified, appearanceAccepted: false,
			candidateFacts: decision.candidateFacts, outputs: analysis.uploadedImages,
			gates: decision.gates, progress,
		}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', {
					schemaId: `${SCHEMA_PREFIX}-progress-v1`, initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(), error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: `${SCHEMA_PREFIX}-failure-v1`,
				error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null},
				state: Object.fromEntries(Object.entries(state).map(([key, value]) => [key, value !== null])),
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: `${SCHEMA_PREFIX}-failed-result-v1`, accepted: false, integrityPassed: false, appearanceAccepted: false, error: error instanceof Error ? error.message : String(error)},
				report: `# ${run.runId}: CR4G slope-limited nautical response bracket\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
