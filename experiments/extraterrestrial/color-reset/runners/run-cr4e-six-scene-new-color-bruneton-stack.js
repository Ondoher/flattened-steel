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
	'node experiments/extraterrestrial/color-reset/runners/run-cr4e-six-scene-new-color-bruneton-stack.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/fixtures/cr4e-six-scene-new-color-bruneton-stack-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/harness/cr4e-six-scene-new-color-bruneton-stack-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4e-six-scene-new-color-bruneton-stack';

const FIXTURE_SHA256 = '76c39e18d83e7bc242713db607df0fb6a4db331f0fd4f8ab74bcd69df5354462';
const HARNESS_SHA256 = '98b373dc1f349c10883781be6dd0872dbe4f96fee795caf72d7e6762acc88a68';
const EXPECTED_PARENT_RUNS = Object.freeze({
	brightLowSun: '000025-cr4d-bright-low-sun-preservation-replay',
	twilightSequence: '000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence',
});
const PARENT_ORDER = Object.freeze(['brightLowSun', 'twilightSequence']);
const EXPECTED_SCENES = Object.freeze([
	Object.freeze({id: 'solar-noon', timeIso: '2024-06-20T20:08:00.000Z', parentId: 'brightLowSun'}),
	Object.freeze({id: 'sunset-minus-60-minutes', timeIso: '2024-06-21T02:26:03.503Z', parentId: 'brightLowSun'}),
	Object.freeze({id: 'sunset-minus-10-minutes', timeIso: '2024-06-21T03:16:03.503Z', parentId: 'brightLowSun'}),
	Object.freeze({id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z', parentId: 'brightLowSun'}),
	Object.freeze({id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z', parentId: 'twilightSequence'}),
	Object.freeze({id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z', parentId: 'twilightSequence'}),
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

function selectedArtifacts(fixture, parentId) {
	return fixture.scenes
		.filter((scene) => scene.parentId === parentId)
		.flatMap((scene) => [scene.newColor, scene.bruneton]);
}

function expectedStackDimensions(fixture) {
	const layout = fixture.presentation.layout;
	return {
		width:
			layout.outerPaddingPixels * 2 +
			fixture.viewport.widthPixels * 2 +
			layout.columnGapPixels,
		height:
			layout.outerPaddingPixels * 2 +
			layout.titleHeightPixels +
			layout.columnHeaderHeightPixels +
			fixture.scenes.length *
				(layout.sceneLabelHeightPixels + fixture.viewport.heightPixels) +
			(fixture.scenes.length - 1) * layout.rowGapPixels,
	};
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4e-six-scene-new-color-bruneton-stack-input-v1',
		'CR4E fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.presentationOnly === true &&
			fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.appearanceAccepted === false &&
			fixture.claimBoundary?.physicalTransportReexecution === false &&
			fixture.claimBoundary?.colorResponseReexecution === false &&
			fixture.claimBoundary?.sourcePixelModification === false &&
			fixture.claimBoundary?.paperSimilarityMetric === false &&
			fixture.claimBoundary?.productionClaim === false,
		'CR4E claim boundary changed.',
	);
	for (const [parentId, expectedRunId] of Object.entries(EXPECTED_PARENT_RUNS)) {
		const parent = fixture.parents?.[parentId];
		requireCondition(
			parent?.namespace === 'color-reset' &&
				parent.runId === expectedRunId &&
				parent.conclusion === 'accepted' &&
				isSha256(parent.artifactSetSha256) &&
				parent.manifest?.path === 'artifact-manifest.json' &&
				Number.isInteger(parent.manifest.byteLength) &&
				parent.manifest.byteLength > 0 &&
				isSha256(parent.manifest.sha256) &&
				parent.role.includes('appearanceAccepted remains false'),
			`CR4E ${parentId} parent declaration changed.`,
		);
	}
	requireCondition(
		fixture.parents.brightLowSun.artifactSetSha256 ===
			'4ce2f0ae986a5c317ad49d5075bfa0ab7ef24257029ebb245a9f0849f0a6fedd' &&
			fixture.parents.brightLowSun.manifest.sha256 ===
				'e112b207bbb7df43474d3c807b4e9761e6cd627447ef952d2673776164b7128e' &&
			fixture.parents.twilightSequence.artifactSetSha256 ===
				'4952c7b4781999885a44e9495d9566c6f4f8f3f0e6f6679fbd93a9fdb3cde656' &&
			fixture.parents.twilightSequence.manifest.sha256 ===
				'72cc7b93125a05036c0f315a36d69cd1fdd78bc7951e846b64149f2c6cae97ac',
		'CR4E accepted parent identities changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4E viewport changed.',
	);
	requireCondition(
		exactJson(
			fixture.scenes.map(({id, timeIso, parentId}) => ({id, timeIso, parentId})),
			EXPECTED_SCENES,
		),
		'CR4E scene chronology or source-parent routing changed.',
	);
	for (const scene of fixture.scenes) {
		for (const panelId of ['newColor', 'bruneton']) {
			const panel = scene[panelId];
			requireCondition(
				isArtifactPath(panel?.path) &&
					panel.path.endsWith('.png') &&
					Number.isInteger(panel.byteLength) &&
					panel.byteLength > 0 &&
					isSha256(panel.sha256),
				`CR4E ${scene.id}/${panelId} source identity changed.`,
			);
		}
	}
	const sourceKeys = fixture.scenes.flatMap((scene) =>
		['newColor', 'bruneton'].map(
			(panelId) => `${scene.parentId}:${scene[panelId].path}`,
		),
	);
	requireCondition(new Set(sourceKeys).size === 12, 'CR4E must identify twelve distinct parent paths.');
	requireCondition(
		exactJson(
			fixture.presentation.columns.map(({id, side}) => ({id, side})),
			[
				{id: 'new-color', side: 'left'},
				{id: 'bruneton', side: 'right'},
			],
		),
		'CR4E column order must remain new color left and Bruneton right.',
	);
	const dimensions = expectedStackDimensions(fixture);
	requireCondition(
		dimensions.width === fixture.presentation.layout.expectedWidthPixels &&
			dimensions.height === fixture.presentation.layout.expectedHeightPixels &&
			dimensions.width === 1348 &&
			dimensions.height === 2864,
		'CR4E stack dimensions changed.',
	);
	const images = outputImages(fixture);
	requireCondition(
		images.length === 1 &&
			images[0] === fixture.outputs.stack &&
			isArtifactPath(images[0]) &&
			images[0].endsWith('.png'),
		'CR4E output contract must contain exactly the one requested review stack.',
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

async function resolveParentDirectories(selectors) {
	const canonicalRunsRoot = await verifyOrdinaryCanonicalDirectory(
		COLOR_RESET_RUNS_ROOT,
		'Color-reset runs root',
	);
	const entries = await Promise.all(
		PARENT_ORDER.map(async (parentId) => {
			const selector = selectors[parentId];
			const resolved = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
			const canonical = await verifyOrdinaryCanonicalDirectory(
				resolved,
				`CR4E ${parentId} parent`,
			);
			assertLexicallyContained(canonicalRunsRoot, canonical, `CR4E ${parentId} parent`);
			await assertNoReparseEntries(canonical, `CR4E ${parentId} parent`);
			return [parentId, canonical];
		}),
	);
	const directories = Object.fromEntries(entries);
	requireCondition(
		new Set(Object.values(directories).map(pathComparisonKey)).size === PARENT_ORDER.length,
		'CR4E explicit parent selectors must resolve to two distinct contained runs.',
	);
	return directories;
}

async function verifyParent({root, selector, specification, selected, label}) {
	await assertNoReparseEntries(root, `${label} parent run`);
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.conclusion === 'accepted' &&
			terminal.runId === specification.runId &&
			terminal.artifactSetSha256 === specification.artifactSetSha256,
		`${label} must be the explicitly selected, independently verified accepted run.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	requireCondition(
		manifestFacts.isFile() &&
			!manifestFacts.isSymbolicLink() &&
			manifestFacts.size === specification.manifest.byteLength,
		`${label} manifest file identity changed.`,
	);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === specification.manifest.sha256, `${label} manifest changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === specification.runId &&
			manifest.conclusion === 'accepted' &&
			manifest.artifactSetSha256 === specification.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		`${label} terminal manifest identity changed.`,
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const verifiedArtifacts = [];
	for (const expected of selected) {
		const recorded = byPath.get(expected.path);
		requireCondition(recorded !== undefined, `${label} manifest omits ${expected.path}.`);
		requireCondition(
			recorded.byteLength === expected.byteLength && recorded.sha256 === expected.sha256,
			`${label} manifest identity changed for ${expected.path}.`,
		);
		const artifactPath = path.join(root, ...expected.path.split('/'));
		const artifactFacts = await lstat(artifactPath);
		requireCondition(
			artifactFacts.isFile() &&
				!artifactFacts.isSymbolicLink() &&
				artifactFacts.size === expected.byteLength,
			`${label} artifact file identity changed for ${expected.path}.`,
		);
		const actualSha256 = await sha256File(artifactPath);
		requireCondition(actualSha256 === expected.sha256, `${label} artifact changed: ${expected.path}.`);
		verifiedArtifacts.push({...expected});
	}
	return {
		namespace: specification.namespace,
		explicitSelector: selector,
		runId: terminal.runId,
		slug: terminal.slug,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		conclusion: terminal.conclusion,
		manifest: {...specification.manifest},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		role: specification.role,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...verifiedArtifacts.map(({path: artifactPath}) => artifactPath),
		]),
		selectedArtifacts: verifiedArtifacts,
	};
}

async function verifyParents(fixture, parentDirectories, selectors) {
	const entries = await Promise.all(
		PARENT_ORDER.map(async (parentId) => [
			parentId,
			await verifyParent({
				root: parentDirectories[parentId],
				selector: selectors[parentId],
				specification: fixture.parents[parentId],
				selected: selectedArtifacts(fixture, parentId),
				label: `CR4E ${parentId}`,
			}),
		]),
	);
	return Object.fromEntries(entries);
}

function assertParentSnapshotUnchanged(before, after, label) {
	requireCondition(
		before.runId === after.runId &&
			before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes,
		`${label} terminal identity changed during execution.`,
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		`${label} selected artifacts`,
	);
}

function assertParentsUnchanged(before, after) {
	for (const parentId of PARENT_ORDER) {
		assertParentSnapshotUnchanged(before[parentId], after[parentId], `CR4E ${parentId} parent`);
	}
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
	]);
	requireCondition(isSha256(FIXTURE_SHA256), 'CR4E fixture SHA-256 pin is not finalized.');
	requireCondition(isSha256(HARNESS_SHA256), 'CR4E browser-harness SHA-256 pin is not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4E fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4E browser harness identity changed.');
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
			'color-reset/runners/run-cr4e-six-scene-new-color-bruneton-stack.js',
			'color-reset/harness/cr4e-six-scene-new-color-bruneton-stack-browser.js',
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
		entryFiles: ['harness/cr4e-six-scene-new-color-bruneton-stack-browser.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	return {
		implementationClosure,
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			implementationClosure.files,
		),
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
			before.implementationClosure.files,
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
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4E implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4E browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageLockSha256 === after.packageLockSha256,
		'CR4E package boundary changed during execution.',
	);
}

function attachUploadIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const uploadedImages = result.uploadedImages.map((image) => {
		const upload = byPath.get(image.artifactPath);
		requireCondition(upload !== undefined, `CR4E browser result omitted upload ${image.artifactPath}.`);
		return {...image, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	return {...result, uploadedImages};
}

function attachOutputIdentity(records, uploads, label) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	return records.map((record) => {
		const upload = byPath.get(record.artifactPath);
		requireCondition(upload !== undefined, `CR4E ${label} references unknown output ${record.artifactPath}.`);
		return {
			...record,
			output: {path: upload.path, byteLength: upload.byteLength, sha256: upload.sha256},
		};
	});
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const first = browser.uploads[0] ?? null;
	const plate = browser.uploads.find(({path: artifactPath}) => artifactPath === fixture.outputs.stack) ?? null;
	const timed = (entry, targetMilliseconds) =>
		entry === null
			? null
			: {
					artifactPath: entry.path,
					completedAt: entry.completedAt,
					elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, entry.completedAt),
					targetMilliseconds,
				};
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: timed(first, 180_000),
		decisionPlate: timed(plate, 600_000),
		allRequestedImages:
			browser.uploads.length === outputImages(fixture).length && browser.uploads.length > 0
				? {
						count: browser.uploads.length,
						completedAt: browser.uploads.at(-1).completedAt,
						elapsedMilliseconds: elapsedMilliseconds(
							run.initializedAt,
							browser.uploads.at(-1).completedAt,
						),
					}
				: null,
	};
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged}) {
	const expectedImages = outputImages(fixture);
	const actualImages = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const dimensions = expectedStackDimensions(fixture);
	const sceneById = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const sourcesAuthenticated = fixture.scenes.every((expected) => {
		const actual = sceneById.get(expected.id);
		return (
			actual?.parentId === expected.parentId &&
			actual.newColor?.source?.verified === true &&
			actual.newColor.source.path === expected.newColor.path &&
			actual.newColor.source.byteLength === expected.newColor.byteLength &&
			actual.newColor.source.sha256 === expected.newColor.sha256 &&
			actual.bruneton?.source?.verified === true &&
			actual.bruneton.source.path === expected.bruneton.path &&
			actual.bruneton.source.byteLength === expected.bruneton.byteLength &&
			actual.bruneton.source.sha256 === expected.bruneton.sha256
		);
	});
	const exactPixelEmbeddings = analysis.scenes.every(
		(scene) =>
			scene.newColor?.embedding?.exact === true &&
			scene.newColor.embedding.differingChannelCount === 0 &&
			scene.newColor.embedding.maximumAbsoluteChannelDifference === 0 &&
			scene.newColor.embedding.comparedChannelCount === 640 * 400 * 4 &&
			scene.bruneton?.embedding?.exact === true &&
			scene.bruneton.embedding.differingChannelCount === 0 &&
			scene.bruneton.embedding.maximumAbsoluteChannelDifference === 0 &&
			scene.bruneton.embedding.comparedChannelCount === 640 * 400 * 4,
	);
	const exactColumnPlacement = analysis.scenes.every(
		(scene) =>
			scene.newColor?.columnId === 'new-color' &&
			scene.newColor.side === 'left' &&
			scene.newColor.placement?.x === 24 &&
			scene.bruneton?.columnId === 'bruneton' &&
			scene.bruneton.side === 'right' &&
			scene.bruneton.placement?.x === 684,
	);
	const gates = {
		browserResultSchema:
			analysis.schemaId ===
			'algorithm32-color-reset-cr4e-six-scene-new-color-bruneton-stack-browser-result-v1',
		presentationOnlyBoundary:
			analysis.presentationOnly === true &&
			analysis.physicalTransportReexecuted === false &&
			analysis.colorResponseReexecuted === false &&
			fixture.claimBoundary.presentationOnly === true,
		appearanceRemainsUnaccepted:
			analysis.appearanceAccepted === false &&
			analysis.ownerAppearanceReviewRequired === true &&
			fixture.claimBoundary.appearanceAcceptanceGate === false,
		renderCompletedBeforeRunnerGates:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true,
		allRequestedImagesWritten:
			browser.uploads.length === expectedImages.length && exactJson(actualImages, expectedImages),
		decisionPlateUploadedLast: actualImages.at(-1) === fixture.outputs.stack,
		browserUploadOrderExact:
			exactJson(analysis.imageUploadOrder, expectedImages) &&
			analysis.uploadedImages.length === expectedImages.length,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		browserParentsAuthenticated: PARENT_ORDER.every((parentId) => {
			const actual = analysis.parents?.[parentId];
			const expected = fixture.parents[parentId];
			return (
				actual?.verified === true &&
				actual.namespace === expected.namespace &&
				actual.runId === expected.runId &&
				actual.conclusion === expected.conclusion &&
				actual.artifactSetSha256 === expected.artifactSetSha256 &&
				actual.manifest?.verified === true &&
				actual.manifest.byteLength === expected.manifest.byteLength &&
				actual.manifest.sha256 === expected.manifest.sha256 &&
				actual.selectedArtifactCount === selectedArtifacts(fixture, parentId).length
			);
		}),
		twelveSourcePngsAuthenticated: sourcesAuthenticated,
		exactSceneOrder: exactJson(
			analysis.scenes.map(({sceneId}) => sceneId),
			EXPECTED_SCENES.map(({id}) => id),
		),
		newColorLeftBrunetonRight:
			exactJson(analysis.layout?.columns, fixture.presentation.columns) && exactColumnPlacement,
		exactPanelDimensions:
			analysis.layout?.panelWidth === 640 && analysis.layout?.panelHeight === 400,
		exactStackDimensions:
			analysis.layout?.width === dimensions.width &&
			analysis.layout?.height === dimensions.height &&
			analysis.uploadedImages[0]?.width === dimensions.width &&
			analysis.uploadedImages[0]?.height === dimensions.height,
		twelvePanelsRecorded: analysis.panelIdentities?.length === 12,
		sourcePixelsEmbeddedExactly: exactPixelEmbeddings,
		derivedOutputIdentityRecorded:
			analysis.outputIdentity?.artifactPath === fixture.outputs.stack &&
			analysis.outputIdentity.byteLength === browser.uploads[0]?.byteLength &&
			analysis.outputIdentity.sha256 === browser.uploads[0]?.sha256 &&
			isSha256(analysis.outputIdentity.sha256),
		parentRunsRemainImmutable: parentsUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null &&
			progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null &&
			progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	return {
		gates,
		integrityPassed: Object.values(gates).every(Boolean),
		accepted: Object.values(gates).every(Boolean),
	};
}

async function main() {
	const selectorArguments = process.argv.slice(2);
	if (
		selectorArguments.length !== PARENT_ORDER.length ||
		selectorArguments.some((value) => value.trim() === '')
	) {
		throw new Error(
			`Usage: ${COMMAND_PREFIX} <explicit-accepted-CR4D-run-id-or-contained-path> ` +
				'<explicit-accepted-CR4C-run-id-or-contained-path>',
		);
	}
	const parentSelectors = Object.fromEntries(
		PARENT_ORDER.map((parentId, index) => [parentId, selectorArguments[index]]),
	);
	const command = [COMMAND_PREFIX, ...selectorArguments.map((selector) => JSON.stringify(selector))].join(' ');
	const fixture = await readJson(FIXTURE_PATH);
	const images = outputImages(fixture);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4e-six-scene-new-color-bruneton-stack',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4E owner-review presentation',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: parentSelectors,
			parents: fixture.parents,
			viewport: fixture.viewport,
			presentation: fixture.presentation,
			scenes: fixture.scenes,
			outputImages: images,
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Losslessly decode twelve hash-authenticated accepted parent PNGs; place the accepted two-scale new color at left and unchanged Bruneton at right without scaling in six chronological rows; add labels outside the panel bounds; encode one new immutable review stack.',
			implementation: [HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			derivation:
				'Each output panel region is exact decoded RGBA from its declared parent PNG. Only the surrounding labels, background, borders, and layout are new.',
			physicalInput:
				'accepted Native15/Q30 CR4C and CR4D PNG artifacts only; no atmosphere, cache, transport, or Color execution',
			exclusions: [
				'no physical-field change or replay',
				'no Color response execution or adjustment',
				'no per-scene grading',
				'no image scaling or interpolation',
				'no paper metric or target',
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
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			design: 'agents/topics/extraterrestrial/color-reset-design.md#cr4d-bright-range-result',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#immediate-next-step',
			brightLowSun:
				'tmp/extraterrestrial/color-reset/runs/000025-cr4d-bright-low-sun-preservation-replay',
			twilightSequence:
				'tmp/extraterrestrial/color-reset/runs/000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let implementationBefore = null;
	let implementationAfter = null;
	let protectedBefore = null;
	let protectedAfter = null;
	let parentsBefore = null;
	let parentsAfter = null;
	let parentDirectoriesBefore = null;
	let parentDirectoriesAfter = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		verifyFixtureContract(fixture);
		parentDirectoriesBefore = await resolveParentDirectories(parentSelectors);
		parentsBefore = await verifyParents(fixture, parentDirectoriesBefore, parentSelectors);
		await run.writeJsonArtifact('evidence/parents-before.json', parentsBefore);
		implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		await run.writeJsonArtifact('browser/configuration.json', fixture);

		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4e-six-scene-new-color-bruneton-stack-browser.js',
			exportName: 'runCr4eSixSceneNewColorBrunetonStackBrowser',
			servedRoots: {
				'/bright/': parentDirectoriesBefore.brightLowSun,
				'/twilight/': parentDirectoriesBefore.twilightSequence,
			},
			allowedArtifactPaths: images,
			uploadLimitBytes: 64 * 1024 * 1024,
			timeoutMilliseconds: 900_000,
		});
		const analysis = {
			...attachUploadIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		const panelIdentities = attachOutputIdentity(
			analysis.panelIdentities,
			browser.uploads,
			'panel identities',
		);
		const imageDerivations = attachOutputIdentity(
			analysis.imageDerivations,
			browser.uploads,
			'image derivations',
		);
		await run.writeJsonArtifact('evidence/analysis.json', analysis);
		await run.writeJsonArtifact('evidence/panel-identities.json', panelIdentities);
		await run.writeJsonArtifact('evidence/image-derivations.json', imageDerivations);

		implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertImplementationUnchanged(implementationBefore, implementationAfter);
		parentDirectoriesAfter = await resolveParentDirectories(parentSelectors);
		requireCondition(
			PARENT_ORDER.every(
				(parentId) =>
					pathComparisonKey(parentDirectoriesBefore[parentId]) ===
					pathComparisonKey(parentDirectoriesAfter[parentId]),
			),
			'CR4E explicit parent selectors resolved differently during execution.',
		);
		parentsAfter = await verifyParents(fixture, parentDirectoriesAfter, parentSelectors);
		await run.writeJsonArtifact('evidence/parents-after.json', parentsAfter);
		const parentsUnchanged = assertParentsUnchanged(parentsBefore, parentsAfter);
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR4E protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			protectedBefore.flat32,
			protectedAfter.flat32,
			'CR4E protected Flat32 source',
		);

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged});
		const conclusion = decision.accepted ? 'accepted' : 'failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			presentationOnly: true,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			progress,
			parents: parentsAfter,
			outputs: analysis.uploadedImages,
			protectedSourceUnchanged: true,
			parentsUnchanged,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4E six-scene new-color / Bruneton review stack`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'The complete six-row, two-column PNG was written before runner-owned gates were evaluated. New color is left and unchanged Bruneton is right in every row.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'Every 640 x 400 panel region replays the decoded parent RGBA pixels exactly. This accepts only the presentation derivation and does not accept the candidate appearance.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		requireCondition(
			independentVerification.verified === true &&
				independentVerification.conclusion === conclusion &&
				independentVerification.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4E terminal run failed independent verification.',
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
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
				implementationBeforeRecorded: implementationBefore !== null,
				implementationAfterRecorded: implementationAfter !== null,
				parentsBeforeRecorded: parentsBefore !== null,
				parentsAfterRecorded: parentsAfter !== null,
				parentDirectoriesBeforeResolved: parentDirectoriesBefore !== null,
				parentDirectoriesAfterResolved: parentDirectoriesAfter !== null,
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
					presentationOnly: true,
					appearanceAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4E six-scene review stack\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
