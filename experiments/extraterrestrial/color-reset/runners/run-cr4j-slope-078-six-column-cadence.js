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
	'node experiments/extraterrestrial/color-reset/runners/run-cr4j-slope-078-six-column-cadence.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/fixtures/cr4j-slope-078-six-column-cadence-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const FIXTURE_INVENTORY_PATH = 'color-reset/fixtures/cr4j-slope-078-six-column-cadence-v1.json';
const HARNESS_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/harness/cr4j-slope-078-six-column-cadence-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4j-slope-078-six-column-cadence';

const FIXTURE_SHA256 = '7b99f658c410071b0f167f497e78a44bb50661ca9b748398d37667d413846771';
const HARNESS_SHA256 = 'a892d00155fd4e1e7d465a669e1db85b93276cb8413965576c68ccb7a3840cdd';
const EXPECTED_PARENT_RUN_ID = '000035-cr4i-smooth-bruneton-shoulder-check';
const EXPECTED_PARENT_ARTIFACT_SET_SHA256 =
	'd5d7273e8200bd15070db6bf17d2acefe65908c2762d6e2cff12ca1d859aea38';
const EXPECTED_PARENT_MANIFEST_SHA256 =
	'e908b5f0290c09c8ad55c0b5bdf9731a0e258e496ea158553c505a4f7cb8d052';
const EXPECTED_SCENES = Object.freeze([
	Object.freeze({id: 'sunset-minus-60-minutes', row: 0, column: 0}),
	Object.freeze({id: 'sunset-minus-45-minutes', row: 0, column: 1}),
	Object.freeze({id: 'sunset-minus-30-minutes', row: 0, column: 2}),
	Object.freeze({id: 'sunset-minus-20-minutes', row: 0, column: 3}),
	Object.freeze({id: 'sunset-minus-10-minutes', row: 0, column: 4}),
	Object.freeze({id: 'sunset-minus-5-minutes', row: 0, column: 5}),
	Object.freeze({id: 'sunset', row: 1, column: 0}),
	Object.freeze({id: 'sunset-plus-10-minutes', row: 1, column: 1}),
	Object.freeze({id: 'sunset-plus-20-minutes', row: 1, column: 2}),
	Object.freeze({id: 'sunset-plus-30-minutes', row: 1, column: 3}),
	Object.freeze({id: 'sunset-plus-45-minutes', row: 1, column: 4}),
	Object.freeze({id: 'sunset-plus-60-minutes', row: 1, column: 5}),
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

function expectedDimensions(fixture) {
	const layout = fixture.presentation.layout;
	return {
		width:
			layout.outerPaddingPixels * 2 +
			layout.columnCount * fixture.viewport.widthPixels +
			(layout.columnCount - 1) * layout.columnGapPixels,
		height:
			layout.outerPaddingPixels * 2 +
			layout.titleHeightPixels +
			layout.rowCount * (layout.panelLabelHeightPixels + fixture.viewport.heightPixels) +
			(layout.rowCount - 1) * layout.rowGapPixels,
	};
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4j-slope-078-six-column-cadence-input-v1',
		'CR4J fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.presentationOnly === true &&
			fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.appearanceAccepted === false &&
			fixture.claimBoundary?.physicalTransportReexecution === false &&
			fixture.claimBoundary?.colorResponseReexecution === false &&
			fixture.claimBoundary?.sourcePixelModification === false &&
			fixture.claimBoundary?.scientificClaim === false &&
			fixture.claimBoundary?.productionClaim === false,
		'CR4J claim boundary changed.',
	);
	requireCondition(
		fixture.parent?.namespace === 'color-reset' &&
			fixture.parent.runId === EXPECTED_PARENT_RUN_ID &&
			fixture.parent.conclusion === 'rejected' &&
			fixture.parent.artifactSetSha256 === EXPECTED_PARENT_ARTIFACT_SET_SHA256 &&
			fixture.parent.manifest?.path === 'artifact-manifest.json' &&
			fixture.parent.manifest.byteLength === 18730 &&
			fixture.parent.manifest.sha256 === EXPECTED_PARENT_MANIFEST_SHA256,
		'CR4J verified rejected parent declaration changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4J viewport changed.',
	);
	requireCondition(
		exactJson(
			fixture.scenes.map(({id, row, column}) => ({id, row, column})),
			EXPECTED_SCENES,
		),
		'CR4J scene order or grid placement changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			Number.isFinite(scene.solarElevationDegrees) &&
				scene.totalHorizontalIlluminance?.units === 'lux' &&
				Number.isFinite(scene.totalHorizontalIlluminance.value) &&
				scene.totalHorizontalIlluminance.value >= 0 &&
			isArtifactPath(scene.source?.path) &&
				scene.source.path.startsWith('captures/cr4i-slope-078-p9-control-') &&
				scene.source.path.endsWith('.png') &&
				Number.isInteger(scene.source.byteLength) &&
				scene.source.byteLength > 0 &&
				isSha256(scene.source.sha256),
			`CR4J ${scene.id} source identity changed.`,
		);
	}
	requireCondition(
		new Set(fixture.scenes.map((scene) => scene.source.path)).size === 12,
		'CR4J must identify twelve distinct source PNGs.',
	);
	const layout = fixture.presentation.layout;
	const dimensions = expectedDimensions(fixture);
	requireCondition(
		layout.columnCount === 6 &&
			layout.rowCount === 2 &&
			dimensions.width === layout.expectedWidthPixels &&
			dimensions.height === layout.expectedHeightPixels &&
			dimensions.width === 3940 &&
			dimensions.height === 986,
		'CR4J 6-column by 2-row layout changed.',
	);
	const images = outputImages(fixture);
	requireCondition(
		images.length === 1 &&
			images[0] === fixture.outputs.cadence &&
			images[0] === 'figures/cr4j-slope-078-six-column-cadence.png' &&
			isArtifactPath(images[0]),
		'CR4J output contract changed.',
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

async function resolveParentDirectory(selector) {
	const canonicalRunsRoot = await verifyOrdinaryCanonicalDirectory(
		COLOR_RESET_RUNS_ROOT,
		'Color-reset runs root',
	);
	const resolved = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
	const canonical = await verifyOrdinaryCanonicalDirectory(resolved, 'CR4J parent');
	assertLexicallyContained(canonicalRunsRoot, canonical, 'CR4J parent');
	await assertNoReparseEntries(canonical, 'CR4J parent');
	return canonical;
}

async function verifyParent(fixture, root, selector) {
	await assertNoReparseEntries(root, 'CR4J parent run');
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.conclusion === 'rejected' &&
			terminal.runId === fixture.parent.runId &&
			terminal.artifactSetSha256 === fixture.parent.artifactSetSha256,
		'CR4J parent must be the explicitly selected, independently verified rejected CR4I run.',
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	requireCondition(
		manifestFacts.isFile() &&
			!manifestFacts.isSymbolicLink() &&
			manifestFacts.size === fixture.parent.manifest.byteLength,
		'CR4J parent manifest file identity changed.',
	);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === fixture.parent.manifest.sha256, 'CR4J parent manifest changed.');
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === fixture.parent.runId &&
			manifest.conclusion === fixture.parent.conclusion &&
			manifest.artifactSetSha256 === fixture.parent.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		'CR4J parent terminal manifest identity changed.',
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const scene of fixture.scenes) {
		const expected = scene.source;
		const recorded = byPath.get(expected.path);
		requireCondition(
			recorded?.byteLength === expected.byteLength && recorded?.sha256 === expected.sha256,
			`CR4J parent manifest identity changed for ${expected.path}.`,
		);
		const artifactPath = path.join(root, ...expected.path.split('/'));
		const facts = await lstat(artifactPath);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === expected.byteLength,
			`CR4J parent artifact file identity changed for ${expected.path}.`,
		);
		requireCondition(
			(await sha256File(artifactPath)) === expected.sha256,
			`CR4J parent artifact changed: ${expected.path}.`,
		);
	}
	return {
		namespace: fixture.parent.namespace,
		explicitSelector: selector,
		runId: terminal.runId,
		slug: terminal.slug,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		conclusion: terminal.conclusion,
		manifest: {...fixture.parent.manifest},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		role: fixture.parent.role,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...fixture.scenes.map((scene) => scene.source.path),
		]),
	};
}

function assertParentUnchanged(before, after) {
	requireCondition(
		before.runId === after.runId &&
			before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes,
		'CR4J parent terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(before.selectedArtifactInventory, after.selectedArtifactInventory, 'CR4J parent selected artifacts');
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
	]);
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4J fixture changed after pinning.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4J browser harness changed after pinning.');
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
	};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4j-slope-078-six-column-cadence.js',
			'color-reset/harness/cr4j-slope-078-six-column-cadence-browser.js',
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
	const browserClosure = await buildStaticModuleClosure({
		candidateRoot: COLOR_RESET_ROOT,
		entryFiles: ['harness/cr4j-slope-078-six-column-cadence-browser.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	return {
		implementationClosure,
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, [
			...implementationClosure.files,
			FIXTURE_INVENTORY_PATH,
		]),
		browserClosure,
		browserInventory: await createSelectedFileInventory(COLOR_RESET_ROOT, browserClosure.files),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

async function captureImplementationAfter(before) {
	return {
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementationInventory.files.map(({path: filePath}) => filePath),
		),
		browserInventory: await createSelectedFileInventory(
			COLOR_RESET_ROOT,
			before.browserClosure.files,
		),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4J implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4J browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageLockSha256 === after.packageLockSha256,
		'CR4J package boundary changed during execution.',
	);
	return true;
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function attachOutputIdentity(records, uploads, label) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	return records.map((record) => {
		const upload = byPath.get(record.artifactPath);
		requireCondition(upload !== undefined, `CR4J ${label} references unknown output ${record.artifactPath}.`);
		return {
			...record,
			output: {path: upload.path, byteLength: upload.byteLength, sha256: upload.sha256},
		};
	});
}

function attachBrowserOutputIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const uploadedImages = result.uploadedImages.map((image) => {
		const upload = byPath.get(image.artifactPath);
		requireCondition(upload !== undefined, `CR4J browser result omitted ${image.artifactPath}.`);
		return {...image, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	const output = byPath.get(result.outputIdentity.artifactPath);
	requireCondition(output !== undefined, 'CR4J browser result output identity is unknown.');
	return {
		...result,
		uploadedImages,
		outputIdentity: {
			...result.outputIdentity,
			byteLength: output.byteLength,
			sha256: output.sha256,
		},
		panelIdentities: attachOutputIdentity(result.panelIdentities, uploads, 'panel identities'),
		imageDerivations: attachOutputIdentity(result.imageDerivations, uploads, 'image derivations'),
	};
}

function makeProgress(run, browser, fixture) {
	const upload = browser.uploads[0] ?? null;
	const timed = (targetMilliseconds) =>
		upload === null
			? null
			: {
					artifactPath: upload.path,
					completedAt: upload.completedAt,
					elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, upload.completedAt),
					targetMilliseconds,
				};
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: timed(180_000),
		decisionPlate: timed(600_000),
		allRequestedImages:
			browser.uploads.length === outputImages(fixture).length
				? {
						count: browser.uploads.length,
						completedAt: upload.completedAt,
						elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, upload.completedAt),
					}
				: null,
	};
}

function evaluateGates({analysis, browser, fixture, progress, parentUnchanged, implementationUnchanged}) {
	const expectedImages = outputImages(fixture);
	const actualImages = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const dimensions = expectedDimensions(fixture);
	const exactEmbeddings = analysis.scenes.every(
		(scene) =>
			scene.embedding?.exact === true &&
			scene.embedding.differingChannelCount === 0 &&
			scene.embedding.maximumAbsoluteChannelDifference === 0 &&
			scene.embedding.comparedChannelCount === 640 * 400 * 4,
	);
	const sourcesAuthenticated = fixture.scenes.every((expected, index) => {
		const actual = analysis.scenes[index];
		return (
			actual?.sceneId === expected.id &&
			actual.source?.verified === true &&
			actual.source.path === expected.source.path &&
			actual.source.byteLength === expected.source.byteLength &&
			actual.source.sha256 === expected.source.sha256
		);
	});
	const scenePresentationFactsExact = fixture.scenes.every((expected, index) => {
		const actual = analysis.scenes[index];
		return (
			actual?.solarElevationDegrees === expected.solarElevationDegrees &&
			exactJson(actual.totalHorizontalIlluminance, expected.totalHorizontalIlluminance)
		);
	});
	const derivation = analysis.imageDerivations?.[0];
	const outputIdentityAttached = (record) =>
		record?.output?.path === fixture.outputs.cadence &&
		record.output.byteLength === browser.uploads[0]?.byteLength &&
		record.output.sha256 === browser.uploads[0]?.sha256;
	const gates = {
		browserResultSchema:
			analysis.schemaId ===
			'algorithm32-color-reset-cr4j-slope-078-six-column-cadence-browser-result-v1',
		presentationOnlyBoundary:
			analysis.presentationOnly === true &&
			analysis.physicalTransportReexecuted === false &&
			analysis.colorResponseReexecuted === false &&
			analysis.scientificClaimAdded === false,
		appearanceRemainsUnaccepted:
			analysis.appearanceAccepted === false && analysis.ownerAppearanceReviewRequired === true,
		renderCompletedBeforeRunnerGates:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true,
		allRequestedImagesWritten:
			browser.uploads.length === 1 && exactJson(actualImages, expectedImages),
		browserUploadOrderExact:
			exactJson(analysis.imageUploadOrder, expectedImages) && analysis.uploadedImages.length === 1,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		verifiedRejectedParentAuthenticated:
			analysis.parent?.verified === true &&
			analysis.parent.runId === fixture.parent.runId &&
			analysis.parent.conclusion === 'rejected' &&
			analysis.parent.artifactSetSha256 === fixture.parent.artifactSetSha256 &&
			analysis.parent.manifest?.verified === true &&
			analysis.parent.manifest.sha256 === fixture.parent.manifest.sha256 &&
			analysis.parent.selectedArtifactCount === 12,
		twelveSourcePngsAuthenticated: sourcesAuthenticated,
		sceneElevationAndReceiverLightPreserved: scenePresentationFactsExact,
		exactSceneOrderAndPlacement: exactJson(
			analysis.scenes.map(({sceneId: id, row, column}) => ({id, row, column})),
			EXPECTED_SCENES,
		),
		exactPanelDimensions:
			analysis.layout?.panelWidth === 640 && analysis.layout?.panelHeight === 400,
		exactCadenceDimensions:
			analysis.layout?.width === dimensions.width &&
			analysis.layout?.height === dimensions.height &&
			analysis.layout?.columnCount === 6 &&
			analysis.layout?.rowCount === 2 &&
			analysis.uploadedImages[0]?.width === dimensions.width &&
			analysis.uploadedImages[0]?.height === dimensions.height,
		twelvePanelsRecorded: analysis.panelIdentities?.length === 12,
		noResamplingOrSmoothing:
			derivation?.parameters?.imageSmoothingEnabled === false &&
			derivation.parameters.panelWidth === 640 &&
			derivation.parameters.panelHeight === 400,
		sourcePixelsEmbeddedExactly: exactEmbeddings,
		panelAndDerivationOutputIdentitiesRecorded:
			analysis.panelIdentities.every(outputIdentityAttached) &&
			analysis.imageDerivations.every(outputIdentityAttached),
		derivedOutputIdentityRecorded:
			analysis.outputIdentity?.artifactPath === fixture.outputs.cadence &&
			analysis.outputIdentity.byteLength === browser.uploads[0]?.byteLength &&
			analysis.outputIdentity.sha256 === browser.uploads[0]?.sha256 &&
			isSha256(analysis.outputIdentity.sha256),
		parentRunRemainsImmutable: parentUnchanged,
		implementationRemainsImmutable: implementationUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null &&
			progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null &&
			progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	return {gates, accepted: Object.values(gates).every(Boolean)};
}

async function main() {
	const selectorArguments = process.argv.slice(2);
	if (selectorArguments.length !== 1 || selectorArguments[0].trim() === '') {
		throw new Error(`Usage: ${COMMAND_PREFIX} <explicit-verified-CR4I-run-id-or-contained-path>`);
	}
	const parentSelector = selectorArguments[0];
	const command = `${COMMAND_PREFIX} ${JSON.stringify(parentSelector)}`;
	const fixture = await readJson(FIXTURE_PATH);
	const images = outputImages(fixture);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4j-slope-078-six-column-cadence',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4J presentation-only six-column cadence',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelector: parentSelector,
			parent: fixture.parent,
			viewport: fixture.viewport,
			presentation: fixture.presentation,
			scenes: fixture.scenes,
			outputImages: images,
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Decode twelve hash-authenticated CR4I slope-078/p9 PNGs and copy their RGBA pixels at 1:1 into one labeled six-column by two-row cadence PNG.',
			implementation: [HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			derivation:
				'Each panel region is exact decoded RGBA from its declared parent PNG; only labels, borders, background, and grid layout are new.',
			physicalInput:
				'verified CR4I slope-078/p9 control PNG artifacts only; no atmosphere, cache, transport, or Color execution',
			exclusions: [
				'no physical-field or Color replay',
				'no source-pixel scaling, interpolation, or grading',
				'no appearance or scientific acceptance',
				'no reinterpretation of the rejected CR4I candidate-family conclusion',
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
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			design: 'agents/topics/extraterrestrial/color-reset-design.md#cr4j-six-column-cadence-presentation-boundary',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr4j---present-the-complete-slope-078-cadence-in-six-columns',
			parent:
				'tmp/extraterrestrial/color-reset/runs/000035-cr4i-smooth-bruneton-shoulder-check',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		verifyFixtureContract(fixture);
		const parentDirectoryBefore = await resolveParentDirectory(parentSelector);
		const parentBefore = await verifyParent(fixture, parentDirectoryBefore, parentSelector);
		await run.writeJsonArtifact('evidence/parent-before.json', parentBefore);
		const implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		const protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		await run.writeJsonArtifact('browser/configuration.json', fixture);

		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4j-slope-078-six-column-cadence-browser.js',
			exportName: 'runCr4jSlope078SixColumnCadenceBrowser',
			servedRoots: {'/parent/': parentDirectoryBefore},
			allowedArtifactPaths: images,
			uploadLimitBytes: 64 * 1024 * 1024,
			timeoutMilliseconds: 900_000,
		});
		const analysis = {
			...attachBrowserOutputIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		await run.writeJsonArtifact('evidence/analysis.json', analysis);
		await run.writeJsonArtifact('evidence/panel-identities.json', analysis.panelIdentities);
		await run.writeJsonArtifact('evidence/image-derivations.json', analysis.imageDerivations);

		const implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		const implementationUnchanged = assertImplementationUnchanged(
			implementationBefore,
			implementationAfter,
		);
		const parentDirectoryAfter = await resolveParentDirectory(parentSelector);
		requireCondition(
			pathComparisonKey(parentDirectoryBefore) === pathComparisonKey(parentDirectoryAfter),
			'CR4J explicit parent selector resolved differently during execution.',
		);
		const parentAfter = await verifyParent(fixture, parentDirectoryAfter, parentSelector);
		await run.writeJsonArtifact('evidence/parent-after.json', parentAfter);
		const parentUnchanged = assertParentUnchanged(parentBefore, parentAfter);
		const protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		assertFileInventoriesEqual(protectedBefore.algorithm32, protectedAfter.algorithm32, 'CR4J protected Algorithm32 source');
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4J protected Flat32 source');

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			parentUnchanged,
			implementationUnchanged,
		});
		const conclusion = decision.accepted ? 'accepted' : 'failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.accepted,
			presentationOnly: true,
			appearanceAccepted: false,
			scientificClaimAdded: false,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			progress,
			parent: parentAfter,
			outputs: analysis.uploadedImages,
			protectedSourceUnchanged: true,
			parentUnchanged,
			implementationUnchanged,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4J slope-078 six-column cadence`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'The complete 6-column by 2-row cadence PNG was written before runner-owned gates. Every 640 x 400 panel region exactly replays its authenticated CR4I slope-078/p9 source RGBA pixels.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'This accepts only presentation integrity. It adds no appearance or scientific claim and does not reinterpret CR4I\'s rejected candidate-family conclusion.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		requireCondition(
			independentVerification.verified === true &&
				independentVerification.conclusion === conclusion &&
				independentVerification.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4J terminal run failed independent verification.',
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					presentationOnly: true,
					appearanceAccepted: false,
					output: analysis.uploadedImages[0],
					gates: decision.gates,
					progress,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', {
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
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: `${SCHEMA_PREFIX}-failed-result-v1`,
					accepted: false,
					integrityPassed: false,
					presentationOnly: true,
					appearanceAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4J slope-078 six-column cadence\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
