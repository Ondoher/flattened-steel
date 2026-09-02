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
	'node scripts/extraterrestrial/color-reset/runners/run-cr4d-bright-low-sun-preservation-replay.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr4d-bright-low-sun-preservation-replay-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4d-bright-low-sun-preservation-replay-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4d-bright-low-sun-preservation-replay';

const FIXTURE_SHA256 = '7911db7a7ddddc827e07fd294eb4eee7b75b4bed9d36682d78792644859bcf36';
const HARNESS_SHA256 = 'bd377e808741cadbebad8022a422aa17cd9f6e1c8e0af26eef4286b716fb9f31';
const MODEL_SHA256 = '36e66141a2aa820c7696ad100f1d71685efd02768c23b22a77a7573b8746c70d';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const EXPECTED_PARENT_RUNS = Object.freeze({
	skyField: '000005-six-scene-visual-baseline',
	receiverLight: '000007-available-light-inventory',
	acceptedCr4cRevision: '000022-cr4c-two-scale-sunset-nautical-pre-tone-sequence',
});
const PARENT_ORDER = Object.freeze(['skyField', 'receiverLight', 'acceptedCr4cRevision']);
const EXPECTED_SCENE_IDS = Object.freeze([
	'solar-noon',
	'sunset-minus-60-minutes',
	'sunset-minus-10-minutes',
	'sunset',
]);
const EXPECTED_ENVELOPE_SCENE_IDS = Object.freeze(['solar-noon', 'sunset-minus-60-minutes', 'sunset-minus-10-minutes']);
const EXPECTED_SELECTED_CANDIDATE = Object.freeze({
	id: 'pre-tone-two-scale',
	sunsetAmplitude: 3.5,
	sunsetTransitionIlluminanceLux: 980,
	sunsetRolloffPower: 9,
	nauticalAmplitude: 5300,
	nauticalTransitionIlluminanceLux: 1,
	nauticalRolloffPower: 3,
});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
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

function nearlyEqual(left, right, absoluteTolerance, relativeTolerance = 0) {
	if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
	return Math.abs(left - right) <= Math.max(absoluteTolerance, relativeTolerance * Math.max(1, Math.abs(right)));
}

function outputImages(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4d-bright-low-sun-preservation-replay-input-v1',
		'CR4D fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.paperSimilarityMetric === false &&
			fixture.claimBoundary?.paperTarget === false &&
			fixture.claimBoundary?.physicalTransportReexecution === false &&
			fixture.claimBoundary?.legacyEnvelopeWidened === false &&
			fixture.claimBoundary?.sunsetPreservationGatesCandidate === false &&
			fixture.claimBoundary?.productionClaim === false,
		'CR4D claim boundary changed.',
	);
	for (const [parentId, expectedRunId] of Object.entries(EXPECTED_PARENT_RUNS)) {
		const parent = fixture.parents?.[parentId];
		requireCondition(
			parent?.namespace === 'color-reset' && parent.runId === expectedRunId,
			`CR4D ${parentId} parent declaration changed.`,
		);
	}
	requireCondition(
		fixture.parents.acceptedCr4cRevision.conclusion === 'accepted' &&
			fixture.parents.acceptedCr4cRevision.artifactSetSha256 ===
				'4952c7b4781999885a44e9495d9566c6f4f8f3f0e6f6679fbd93a9fdb3cde656' &&
			fixture.parents.acceptedCr4cRevision.role.includes('exact sunset pixel-continuity parent') &&
			fixture.parents.acceptedCr4cRevision.role.includes('appearanceAccepted remains false'),
		'CR4D accepted CR4C parent declaration changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4D viewport changed.',
	);
	requireCondition(
		exactJson(
			fixture.scenes.map(({id}) => id),
			EXPECTED_SCENE_IDS,
		),
		'CR4D scene order changed.',
	);
	requireCondition(
		fixture.receiverLightScalar.quantity === 'photopic total horizontal illuminance' &&
			fixture.receiverLightScalar.units === 'lux' &&
			fixture.receiverLightScalar.sameValueForEveryPixel === true &&
			fixture.receiverLightScalar.sameValueForEveryRgbChannel === true &&
			fixture.receiverLightScalar.namedTimeInput === false &&
			fixture.receiverLightScalar.solarZenithInput === false &&
			fixture.receiverLightScalar.sourceKindInput === false &&
			fixture.receiverLightScalar.imageDerived === false,
		'CR4D receiver-light scalar contract changed.',
	);
	requireCondition(
		fixture.response.id === 'color-reset-cr4c-two-scale-total-horizontal-illuminance-pre-tone-gain-v1' &&
			fixture.response.operationSpace === 'signed projected linear sRGB before unchanged Bruneton exponential' &&
			fixture.response.unchangedFromAcceptedCr4c === true &&
			exactJson(
				Object.fromEntries(
					Object.keys(EXPECTED_SELECTED_CANDIDATE).map((key) => [
						key,
						fixture.response.selectedCandidate[key],
					]),
				),
				EXPECTED_SELECTED_CANDIDATE,
			),
		'CR4D accepted two-scale response changed.',
	);
	const envelope = fixture.legacyReceiverLightEnvelope;
	requireCondition(
		envelope.id === 'color-reset-cr4-legacy-receiver-light-bruneton-preservation-envelope-v1' &&
			exactJson(envelope.qualifiedSceneIds, EXPECTED_ENVELOPE_SCENE_IDS) &&
			exactJson(envelope.reportOnlySceneIds, ['sunset']) &&
			envelope.originalApplicability?.minimumIlluminanceLux === 1000 &&
			envelope.originalApplicability?.evaluationOnly === true &&
			envelope.originalApplicability?.namedSceneInput === false &&
			envelope.maximumAbsoluteRgbCodeDifference?.daylightFloorCodes === 1 &&
			envelope.maximumAbsoluteRgbCodeDifference?.lowSunRelaxationCodes === 4 &&
			envelope.maximumAbsoluteRgbCodeDifference?.scaleIlluminanceLux === 2000 &&
			envelope.maximumAbsoluteRgbCodeDifference?.power === 2 &&
			envelope.rgbCodeRmse?.daylightFloorCodes === 0.2 &&
			envelope.rgbCodeRmse?.lowSunRelaxationCodes === 0.8 &&
			envelope.rgbCodeRmse?.scaleIlluminanceLux === 2000 &&
			envelope.rgbCodeRmse?.power === 2 &&
			envelope.unchangedFromLegacy === true &&
			envelope.widenedAfterObservation === false,
		'CR4D legacy receiver-light envelope changed.',
	);
	for (const scene of fixture.scenes) {
		const gatesEnvelope = EXPECTED_ENVELOPE_SCENE_IDS.includes(scene.id);
		requireCondition(
			scene.totalHorizontalIlluminance?.units === 'lux' &&
				Number.isFinite(scene.totalHorizontalIlluminance.value) &&
				scene.totalHorizontalIlluminance.value >= 0 &&
				Number.isFinite(scene.expectedCandidateGain) &&
				scene.expectedCandidateGain >= 1 &&
				scene.field.byteLength === 4_096_000 &&
				scene.mask.byteLength === 256_000 &&
				Number.isFinite(scene.bruneton.byteLength),
			`CR4D ${scene.id} replay declaration changed.`,
		);
		requireCondition(
			scene.preservation?.qualification === (gatesEnvelope ? 'gate' : 'report-only') &&
				Number.isFinite(scene.preservation.maximumAbsoluteRgbCodeDifferenceCeiling) &&
				Number.isFinite(scene.preservation.rgbCodeRmseCeiling) &&
				Number.isFinite(scene.preservation.expectedObservedMaximumAbsoluteRgbCodeDifference) &&
				Number.isFinite(scene.preservation.offlineApproximateObservedRgbCodeRmse),
			`CR4D ${scene.id} preservation declaration changed.`,
		);
	}
	requireCondition(
		fixture.diagnostics.acceptedCr4cSunsetContinuity?.maximumAbsoluteRgbCodeDifference === 0 &&
			fixture.diagnostics.acceptedCr4cSunsetContinuity?.maximumRgbCodeRmse === 0 &&
			fixture.diagnostics.acceptedCr4cSunsetContinuity?.maximumDifferingPixelCount === 0 &&
			Number.isFinite(fixture.diagnostics.expectedGainAbsoluteError) &&
			fixture.diagnostics.offlineMetricApproximation.gatesCandidate === false,
		'CR4D continuity or metric-reporting diagnostics changed.',
	);
	const groupedImages = [
		...fixture.outputs.controls,
		...fixture.outputs.candidates,
		...fixture.outputs.differences,
		...fixture.outputs.deltaMasks,
		...fixture.outputs.figures,
	];
	const images = outputImages(fixture);
	requireCondition(
		images.length === 18 && exactJson(images, groupedImages),
		'CR4D requested image order must contain the exact eighteen declared grouped images.',
	);
	requireCondition(
		new Set(images).size === images.length &&
			images.every((artifactPath) => isArtifactPath(artifactPath) && artifactPath.endsWith('.png')) &&
			images.at(-1) === fixture.outputs.decisionPlate,
		'CR4D image paths or final decision-plate order changed.',
	);
}

function selectedArtifacts(fixture, parentId) {
	if (parentId === 'skyField') {
		return [
			fixture.parents.skyField.analysis,
			...fixture.scenes.flatMap((scene) => [scene.field, scene.mask, scene.bruneton]),
		];
	}
	if (parentId === 'acceptedCr4cRevision') {
		return [fixture.parents.acceptedCr4cRevision.analysis, fixture.parents.acceptedCr4cRevision.sunsetPanel];
	}
	return [fixture.parents[parentId].analysis];
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
	const canonicalRunsRoot = await verifyOrdinaryCanonicalDirectory(COLOR_RESET_RUNS_ROOT, 'Color-reset runs root');
	const entries = await Promise.all(
		PARENT_ORDER.map(async (parentId) => {
			const selector = selectors[parentId];
			const resolved = await resolveExistingRunDirectory(selector, resolveColorResetRunRoots());
			const canonical = await verifyOrdinaryCanonicalDirectory(resolved, `CR4D ${parentId} parent`);
			assertLexicallyContained(canonicalRunsRoot, canonical, `CR4D ${parentId} parent`);
			await assertNoReparseEntries(canonical, `CR4D ${parentId} parent`);
			return [parentId, canonical];
		}),
	);
	const directories = Object.fromEntries(entries);
	requireCondition(
		new Set(Object.values(directories).map(pathComparisonKey)).size === PARENT_ORDER.length,
		'CR4D explicit parent selectors must resolve to three distinct contained runs.',
	);
	return directories;
}

async function verifyParent({root, selector, specification, selected, label}) {
	await assertNoReparseEntries(root, `${label} parent run`);
	const terminal = await verifyColorResetRun(root);
	const expectedConclusion = specification.conclusion ?? 'accepted';
	requireCondition(
		terminal.verified === true &&
			terminal.conclusion === expectedConclusion &&
			terminal.runId === specification.runId &&
			terminal.artifactSetSha256 === specification.artifactSetSha256,
		`${label} must be the explicitly selected, independently verified terminal ${expectedConclusion} run.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === specification.manifestSha256, `${label} manifest changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === specification.runId &&
			manifest.conclusion === expectedConclusion &&
			manifest.artifactSetSha256 === specification.artifactSetSha256,
		`${label} terminal identity changed.`,
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const verifiedArtifacts = [];
	for (const expected of selected) {
		requireCondition(isArtifactPath(expected.path), `${label} selected an invalid artifact path.`);
		const recorded = byPath.get(expected.path);
		requireCondition(recorded !== undefined, `${label} manifest omits ${expected.path}.`);
		requireCondition(
			recorded.byteLength === expected.byteLength && recorded.sha256 === expected.sha256,
			`${label} manifest identity changed for ${expected.path}.`,
		);
		const actualSha256 = await sha256File(path.join(root, ...expected.path.split('/')));
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
		manifestSha256,
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			'artifact-manifest.json',
			...verifiedArtifacts.map(({path: artifactPath}) => artifactPath),
		]),
		selectedArtifacts: verifiedArtifacts,
	};
}

function assertParentSnapshotUnchanged(before, after, label) {
	requireCondition(
		before.runId === after.runId &&
			before.conclusion === after.conclusion &&
			before.manifestSha256 === after.manifestSha256 &&
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

async function verifyParents(fixture, parentDirectories, selectors) {
	const verifiedEntries = await Promise.all(
		PARENT_ORDER.map(async (parentId) => [
			parentId,
			await verifyParent({
				root: parentDirectories[parentId],
				selector: selectors[parentId],
				specification: fixture.parents[parentId],
				selected: selectedArtifacts(fixture, parentId),
				label: `CR4D ${parentId}`,
			}),
		]),
	);
	const verified = Object.fromEntries(verifiedEntries);
	const [cr1Analysis, cr2Analysis, acceptedCr4cAnalysis] = await Promise.all([
		readJson(path.join(parentDirectories.skyField, ...fixture.parents.skyField.analysis.path.split('/'))),
		readJson(path.join(parentDirectories.receiverLight, ...fixture.parents.receiverLight.analysis.path.split('/'))),
		readJson(
			path.join(
				parentDirectories.acceptedCr4cRevision,
				...fixture.parents.acceptedCr4cRevision.analysis.path.split('/'),
			),
		),
	]);
	requireCondition(
		cr1Analysis.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		'CR4D CR1 analysis schema changed.',
	);
	requireCondition(
		cr2Analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR4D CR2 analysis schema changed.',
	);
	const cr1Replay = [];
	const cr2Replay = [];
	for (const scene of fixture.scenes) {
		const cr1Scene = cr1Analysis.scenes.find(({sceneId}) => sceneId === scene.id);
		const field = cr1Analysis.rawFields.find(({artifactPath}) => artifactPath === scene.field.path);
		const mask = cr1Analysis.hitMasks.find(({artifactPath}) => artifactPath === scene.mask.path);
		const bruneton = cr1Analysis.panels.find(({artifactPath}) => artifactPath === scene.bruneton.path);
		requireCondition(
			cr1Scene?.sceneId === scene.id &&
				field?.byteLength === scene.field.byteLength &&
				field?.sha256 === scene.field.sha256 &&
				mask?.byteLength === scene.mask.byteLength &&
				mask?.sha256 === scene.mask.sha256 &&
				mask?.equality?.allEqual === true &&
				bruneton?.byteLength === scene.bruneton.byteLength &&
				bruneton?.sha256 === scene.bruneton.sha256,
			`CR4D CR1 replay identity changed for ${scene.id}.`,
		);
		cr1Replay.push({sceneId: scene.id, field, mask, bruneton});

		const cr2Scene = cr2Analysis.scenes.find(({sceneId}) => sceneId === scene.id);
		const total = cr2Scene?.measurement?.photopic?.totalHorizontal?.illuminance;
		requireCondition(
			total?.units === scene.totalHorizontalIlluminance.units &&
				total.value === scene.totalHorizontalIlluminance.value,
			`CR4D CR2 receiver-light value changed for ${scene.id}.`,
		);
		cr2Replay.push({sceneId: scene.id, totalHorizontalIlluminance: total, exact: true});
	}
	requireCondition(
		acceptedCr4cAnalysis.schemaId === 'algorithm32-color-reset-cr4c-two-scale-browser-result-v1' &&
			acceptedCr4cAnalysis.renderComplete === true &&
			acceptedCr4cAnalysis.appearanceAccepted === false &&
			acceptedCr4cAnalysis.boundedResponseRevision === true &&
			acceptedCr4cAnalysis.paperSimilarityMetric === null &&
			exactJson(
				{
					id: acceptedCr4cAnalysis.response?.id,
					selectedCandidate: acceptedCr4cAnalysis.response?.selectedCandidate,
				},
				{
					id: fixture.response.id,
					selectedCandidate: fixture.response.selectedCandidate,
				},
			),
		'CR4D accepted CR4C response parent changed.',
	);
	const acceptedSunset = acceptedCr4cAnalysis.scenes.find(({sceneId}) => sceneId === 'sunset');
	const acceptedSunsetPanel = acceptedCr4cAnalysis.candidates.find(
		({artifactPath}) => artifactPath === fixture.parents.acceptedCr4cRevision.sunsetPanel.path,
	);
	const sunsetFixture = fixture.scenes.find(({id}) => id === 'sunset');
	requireCondition(
		acceptedSunset?.field?.sha256 === sunsetFixture.field.sha256 &&
			acceptedSunset.mask?.sha256 === sunsetFixture.mask.sha256 &&
			nearlyEqual(
				acceptedSunset.gain,
				sunsetFixture.expectedCandidateGain,
				fixture.diagnostics.expectedGainAbsoluteError,
			) &&
			acceptedSunsetPanel?.byteLength === fixture.parents.acceptedCr4cRevision.sunsetPanel.byteLength &&
			acceptedSunsetPanel.sha256 === fixture.parents.acceptedCr4cRevision.sunsetPanel.sha256,
		'CR4D accepted CR4C sunset continuity parent changed.',
	);
	return {
		skyField: {...verified.skyField, replay: cr1Replay},
		receiverLight: {...verified.receiverLight, replay: cr2Replay},
		acceptedCr4cRevision: {
			...verified.acceptedCr4cRevision,
			role: fixture.parents.acceptedCr4cRevision.role,
			response: acceptedCr4cAnalysis.response,
			sunset: {
				sceneId: acceptedSunset.sceneId,
				gain: acceptedSunset.gain,
				field: acceptedSunset.field,
				mask: acceptedSunset.mask,
				panel: acceptedSunsetPanel,
			},
			appearanceAccepted: false,
		},
	};
}

function assertParentsUnchanged(before, after) {
	for (const parentId of PARENT_ORDER) {
		assertParentSnapshotUnchanged(before[parentId], after[parentId], `CR4D ${parentId} parent`);
	}
	return true;
}

async function verifyControlSnapshot() {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestSha256 === SNAPSHOT_MANIFEST_SHA256, 'CR4D production control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4D production control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {include: (relativePath) => selectedPaths.has(relativePath)}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4D snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4D snapshot and production closure');
	return {manifestSha256, inventory: snapshotInventory, productionSelection};
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(MODEL_PATH),
	]);
	requireCondition(FIXTURE_SHA256.length === 64, 'CR4D fixture SHA-256 pin is not finalized.');
	requireCondition(HARNESS_SHA256.length === 64, 'CR4D browser-harness SHA-256 pin is not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4D fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4D browser harness identity changed.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4D Color model identity changed.');
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
			'color-reset/runners/run-cr4d-bright-low-sun-preservation-replay.js',
			'color-reset/harness/cr4d-bright-low-sun-preservation-replay-browser.js',
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
		entryFiles: ['harness/cr4d-bright-low-sun-preservation-replay-browser.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	return {
		implementationClosure,
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, implementationClosure.files),
		browserClosure,
		browserInventory: await createSelectedFileInventory(COLOR_RESET_ROOT, browserClosure.files),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

async function captureImplementationAfter(before) {
	return {
		implementationInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, before.implementationClosure.files),
		browserInventory: await createSelectedFileInventory(COLOR_RESET_ROOT, before.browserClosure.files),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4D implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4D browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 && before.packageLockSha256 === after.packageLockSha256,
		'CR4D package boundary changed during execution.',
	);
}

function attachUploadIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const uploadedImages = result.uploadedImages.map((image) => {
		const artifactPath = image.artifactPath ?? image.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4D browser result omitted upload ${artifactPath}.`);
		return {...image, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	return {...result, uploadedImages};
}

function attachEvidenceImageIdentities(evidence, uploads, label) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const records = Array.isArray(evidence) ? evidence : (evidence?.panels ?? evidence?.images);
	requireCondition(Array.isArray(records), `CR4D ${label} records are missing.`);
	const attached = records.map((record) => {
		const artifactPath = record.artifactPath ?? record.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4D ${label} references unknown image ${artifactPath}.`);
		return {...record, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	if (Array.isArray(evidence)) return attached;
	if (Array.isArray(evidence.panels)) return {...evidence, panels: attached};
	return {...evidence, images: attached};
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const first = browser.uploads[0];
	const plate = browser.uploads.find(({path: artifactPath}) => artifactPath === fixture.outputs.decisionPlate);
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v1`,
		initializedAt: run.initializedAt,
		firstImage: first
			? {
					artifactPath: first.path,
					completedAt: first.completedAt,
					elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, first.completedAt),
					targetMilliseconds: 180_000,
				}
			: null,
		decisionPlate: plate
			? {
					artifactPath: plate.path,
					completedAt: plate.completedAt,
					elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, plate.completedAt),
					targetMilliseconds: 600_000,
				}
			: null,
		allRequestedImages:
			browser.uploads.length === outputImages(fixture).length
				? {
						count: browser.uploads.length,
						completedAt: browser.uploads.at(-1).completedAt,
						elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, browser.uploads.at(-1).completedAt),
					}
				: null,
	};
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged}) {
	const expectedImages = outputImages(fixture);
	const actualImages = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const sceneResults = analysis.scenes ?? [];
	const allGpuErrors = [...(analysis.gpu?.errors ?? []), ...sceneResults.flatMap((scene) => scene.gpu?.errors ?? [])];
	const sunset = sceneResults.find(({sceneId}) => sceneId === 'sunset');
	const qualified = sceneResults.filter(({sceneId}) => EXPECTED_ENVELOPE_SCENE_IDS.includes(sceneId));
	const preservationMetricsFinite = sceneResults.every(
		(result) =>
			Number.isInteger(result.candidateVsBruneton?.maximumAbsoluteRgbCodeDifference) &&
			result.candidateVsBruneton.maximumAbsoluteRgbCodeDifference >= 0 &&
			Number.isFinite(result.candidateVsBruneton?.rgbCodeRmse) &&
			result.candidateVsBruneton.rgbCodeRmse >= 0,
	);
	const deltaMasksComplete = sceneResults.every((result) => {
		const counts = result.deltaMask?.counts;
		const values = counts ? Object.values(counts) : [];
		return (
			values.length === 8 &&
			values.every((value) => Number.isInteger(value) && value >= 0) &&
			values.reduce((sum, value) => sum + value, 0) ===
				fixture.viewport.widthPixels * fixture.viewport.heightPixels
		);
	});
	const gates = {
		browserResultSchema:
			analysis.schemaId === 'algorithm32-color-reset-cr4d-bright-low-sun-preservation-browser-result-v1',
		renderCompletedBeforeRunnerGates: analysis.renderComplete === true && analysis.integrityGateEvaluated === false,
		appearanceRemainsUnaccepted:
			analysis.appearanceAccepted === false && fixture.claimBoundary.appearanceAcceptanceGate === false,
		allRequestedImagesWritten:
			browser.uploads.length === expectedImages.length && exactJson(actualImages, expectedImages),
		browserUploadOrderExact:
			exactJson(analysis.imageUploadOrder ?? analysis.uploadOrder, expectedImages) &&
			analysis.uploadedImages.length === expectedImages.length,
		decisionPlateUploadedLast: actualImages.at(-1) === fixture.outputs.decisionPlate,
		allImagesPrecedeGateEvaluation:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		webgl2ContextHealthy: analysis.gpu?.api === 'WebGL2' && analysis.gpu?.contextLost === false,
		actualD3d11Backend: /direct3d11|d3d11/iu.test(analysis.gpu?.renderer ?? ''),
		noWebglErrors: allGpuErrors.length === 0,
		exactSceneOrder: exactJson(
			sceneResults.map((scene) => scene.sceneId ?? scene.id),
			EXPECTED_SCENE_IDS,
		),
		browserParentsAuthenticated: PARENT_ORDER.every((parentId) => {
			const actual = analysis.parents?.[parentId];
			const expected = fixture.parents[parentId];
			return (
				actual?.namespace === expected.namespace &&
				actual.runId === expected.runId &&
				actual.artifactSetSha256 === expected.artifactSetSha256 &&
				actual.manifestSha256 === expected.manifestSha256 &&
				actual.analysis?.verified === true &&
				actual.analysis.sha256 === expected.analysis.sha256
			);
		}),
		acceptedCr4cSunsetParentAuthenticated:
			analysis.parents?.acceptedCr4cRevision?.sunsetPanel?.verified === true &&
			analysis.parents.acceptedCr4cRevision.sunsetPanel.sha256 ===
				fixture.parents.acceptedCr4cRevision.sunsetPanel.sha256 &&
			analysis.parents.acceptedCr4cRevision.sunsetPanel.byteLength ===
				fixture.parents.acceptedCr4cRevision.sunsetPanel.byteLength,
		cr1InputsAuthenticated: sceneResults.every((result, index) => {
			const scene = fixture.scenes[index];
			return (
				result.field?.sha256 === scene.field.sha256 &&
				result.field?.byteLength === scene.field.byteLength &&
				result.mask?.sha256 === scene.mask.sha256 &&
				result.mask?.byteLength === scene.mask.byteLength &&
				result.bruneton?.sha256 === scene.bruneton.sha256 &&
				result.bruneton?.byteLength === scene.bruneton.byteLength
			);
		}),
		receiverScalarsReplayedExactly: sceneResults.every((result, index) => {
			const expected = fixture.scenes[index].totalHorizontalIlluminance;
			const actual = result.totalHorizontalIlluminance;
			return actual?.units === expected.units && actual.value === expected.value;
		}),
		parentBrunetonReplay: sceneResults.every(
			(result) =>
				result.parentBrunetonReplay?.maximumAbsoluteRgbCodeDifference <=
					fixture.diagnostics.parentBrunetonReplay.maximumAbsoluteRgbCodeDifference &&
				result.parentBrunetonReplay?.rgbCodeRmse <= fixture.diagnostics.parentBrunetonReplay.maximumRgbCodeRmse,
		),
		candidateGpuCpuEncodedParity: sceneResults.every(
			(result) =>
				result.candidateGpuCpuParity?.encodedSky?.maximumAbsoluteRgbCodeDifference <=
					fixture.diagnostics.candidateGpuCpuParity.maximumAbsoluteRgbCodeDifference &&
				result.candidateGpuCpuParity?.encodedSky?.rgbCodeRmse <=
					fixture.diagnostics.candidateGpuCpuParity.maximumRgbCodeRmse,
		),
		candidateGpuCpuLinearParity: sceneResults.every(
			(result) =>
				result.candidateGpuCpuParity?.floatSky?.nonfiniteValueCount === 0 &&
				result.candidateGpuCpuParity?.floatSky?.maximumAbsoluteRgbDifference <=
					fixture.diagnostics.candidateGpuCpuParity.maximumAbsoluteLinearRgbDifference &&
				result.candidateGpuCpuParity?.floatSky?.rgbRmse <=
					fixture.diagnostics.candidateGpuCpuParity.maximumLinearRgbRmse,
		),
		expectedCandidateGainsExact: sceneResults.every((result, index) =>
			nearlyEqual(
				result.gain,
				fixture.scenes[index].expectedCandidateGain,
				fixture.diagnostics.expectedGainAbsoluteError,
			),
		),
		legacyEnvelopeIdentityExact:
			exactJson(analysis.legacyReceiverLightEnvelope, fixture.legacyReceiverLightEnvelope) &&
			fixture.legacyReceiverLightEnvelope.unchangedFromLegacy === true &&
			fixture.legacyReceiverLightEnvelope.widenedAfterObservation === false,
		qualifiedEnvelopeAppliesToExactThree:
			qualified.length === EXPECTED_ENVELOPE_SCENE_IDS.length &&
			exactJson(
				qualified.map(({sceneId}) => sceneId),
				EXPECTED_ENVELOPE_SCENE_IDS,
			) &&
			qualified.every((result) => {
				const expected = fixture.scenes.find(({id}) => id === result.sceneId);
				return (
					result.preservation?.qualification === 'gate' &&
					result.preservation.gatesCandidate === true &&
					nearlyEqual(
						result.preservation.envelope?.maximumAbsoluteRgbCodeDifference,
						expected.preservation.maximumAbsoluteRgbCodeDifferenceCeiling,
						1e-12,
					) &&
					nearlyEqual(
						result.preservation.envelope?.rgbCodeRmse,
						expected.preservation.rgbCodeRmseCeiling,
						1e-12,
					)
				);
			}),
		qualifiedEnvelopePassed: qualified.every(
			(result) =>
				result.preservation?.passed === true &&
				result.candidateVsBruneton?.maximumAbsoluteRgbCodeDifference <=
					result.preservation.envelope.maximumAbsoluteRgbCodeDifference &&
				result.candidateVsBruneton?.rgbCodeRmse <= result.preservation.envelope.rgbCodeRmse,
		),
		sunsetMetricsReportOnly:
			sunset?.preservation?.qualification === 'report-only' &&
			sunset.preservation.gatesCandidate === false &&
			sunset.preservation.passed === true &&
			fixture.claimBoundary.sunsetPreservationGatesCandidate === false &&
			exactJson(fixture.legacyReceiverLightEnvelope.reportOnlySceneIds, ['sunset']),
		preservationMetricsFinite,
		sunsetPixelsReplayAcceptedCr4cExactly:
			analysis.sunsetPixelContinuity?.maximumAbsoluteRgbCodeDifference <=
				fixture.diagnostics.acceptedCr4cSunsetContinuity.maximumAbsoluteRgbCodeDifference &&
			analysis.sunsetPixelContinuity?.rgbCodeRmse <=
				fixture.diagnostics.acceptedCr4cSunsetContinuity.maximumRgbCodeRmse &&
			analysis.sunsetPixelContinuity?.differingPixelCount <=
				fixture.diagnostics.acceptedCr4cSunsetContinuity.maximumDifferingPixelCount &&
			exactJson(analysis.sunsetPixelContinuity, sunset?.sunsetPixelContinuity),
		deltaMasksComplete,
		oneScalarOneShader:
			exactJson(analysis.response, fixture.response) &&
			analysis.shaderIdentity?.uniqueFragmentSourceHashCount === 1 &&
			analysis.shaderIdentity?.programCompiledOnceAndReusedForAllScenes === true &&
			analysis.shaderIdentity?.responseConfigurationChangedAcrossScenes === false &&
			analysis.shaderIdentity?.onlyResponseStateUniformChangedAcrossScenes === 'uTotalHorizontalIlluminanceLux' &&
			analysis.shaderIdentity?.sameFragmentSourceAcrossScenes === true &&
			Array.isArray(analysis.shaderIdentity?.sceneFragmentSourceHashes) &&
			analysis.shaderIdentity.sceneFragmentSourceHashes.length === fixture.scenes.length,
		noPaperMetricOrTarget:
			fixture.claimBoundary.paperSimilarityMetric === false &&
			fixture.claimBoundary.paperTarget === false &&
			analysis.paperSimilarityMetric == null &&
			analysis.paperTarget == null,
		parentRunsRemainImmutable: parentsUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null &&
			progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null &&
			progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityNames = [
		'browserResultSchema',
		'renderCompletedBeforeRunnerGates',
		'appearanceRemainsUnaccepted',
		'allRequestedImagesWritten',
		'browserUploadOrderExact',
		'decisionPlateUploadedLast',
		'allImagesPrecedeGateEvaluation',
		'noBrowserServerErrors',
		'webgl2ContextHealthy',
		'actualD3d11Backend',
		'noWebglErrors',
		'exactSceneOrder',
		'browserParentsAuthenticated',
		'acceptedCr4cSunsetParentAuthenticated',
		'cr1InputsAuthenticated',
		'receiverScalarsReplayedExactly',
		'parentBrunetonReplay',
		'candidateGpuCpuEncodedParity',
		'candidateGpuCpuLinearParity',
		'expectedCandidateGainsExact',
		'legacyEnvelopeIdentityExact',
		'sunsetPixelsReplayAcceptedCr4cExactly',
		'deltaMasksComplete',
		'oneScalarOneShader',
		'noPaperMetricOrTarget',
		'parentRunsRemainImmutable',
		'firstImageTimeTarget',
		'decisionPlateTimeTarget',
	];
	const integrityPassed = integrityNames.every((name) => gates[name]);
	const preservationPassed = [
		'qualifiedEnvelopeAppliesToExactThree',
		'qualifiedEnvelopePassed',
		'sunsetMetricsReportOnly',
		'preservationMetricsFinite',
	].every((name) => gates[name]);
	return {
		gates,
		integrityPassed,
		preservationPassed,
		accepted: integrityPassed && preservationPassed,
	};
}

async function main() {
	const selectorArguments = process.argv.slice(2);
	if (selectorArguments.length !== PARENT_ORDER.length || selectorArguments.some((value) => value.trim() === '')) {
		throw new Error(
			`Usage: ${COMMAND_PREFIX} <explicit-CR1-run-id-or-contained-path> ` +
				'<explicit-CR2-run-id-or-contained-path> <explicit-accepted-CR4C-run-id-or-contained-path>',
		);
	}
	const parentSelectors = Object.fromEntries(
		PARENT_ORDER.map((parentId, index) => [parentId, selectorArguments[index]]),
	);
	const command = [COMMAND_PREFIX, ...selectorArguments.map((selector) => JSON.stringify(selector))].join(' ');
	const fixture = await readJson(FIXTURE_PATH);
	const images = outputImages(fixture);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4d-bright-low-sun-preservation-replay',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4D',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: parentSelectors,
			parents: fixture.parents,
			scenes: fixture.scenes,
			receiverLightScalar: fixture.receiverLightScalar,
			response: fixture.response,
			legacyReceiverLightEnvelope: fixture.legacyReceiverLightEnvelope,
			diagnostics: fixture.diagnostics,
			outputImages: images,
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Rehydrate four accepted CR1 signed projected linear-RGB sky fields and masks, replay exact CR2 receiver-light values, apply the accepted CR4C two-scale pre-tone response unchanged, and render all eighteen preservation images before runner-owned gates.',
			implementation: [MODEL_RELATIVE_PATH, HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			physicalInput:
				'unchanged accepted CR1 W27/Q30/Native15 pre-display fields; no atmosphere, cache, or transport execution',
			derivation: fixture.response.operation,
			preservationEnvelope: fixture.legacyReceiverLightEnvelope,
			exclusions: [
				'no physical-field change',
				'no independent scene grading',
				'no post-tone gain',
				'no independent channel curve',
				'no gamut or luminance shoulder',
				'no paper metric or target',
				'no widening of the legacy preservation envelope',
				'no sunset preservation gate or replacement envelope',
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
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900_000,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v1`,
			design: 'agents/topics/extraterrestrial/color-reset-design.md#bright-scene-preservation',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr4d---recheck-the-bright-and-low-sun-preservation-range',
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			acceptedCr4cRevision:
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
		await run.writeJsonArtifact('evidence/control-snapshot-verification.json', await verifyControlSnapshot());
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
			modulePath: '/lane/harness/cr4d-bright-low-sun-preservation-replay-browser.js',
			exportName: 'runCr4dBrightLowSunPreservationReplayBrowser',
			servedRoots: {
				'/cr1/': parentDirectoriesBefore.skyField,
				'/cr2/': parentDirectoriesBefore.receiverLight,
				'/cr4c/': parentDirectoriesBefore.acceptedCr4cRevision,
			},
			allowedArtifactPaths: images,
			uploadLimitBytes: 96 * 1024 * 1024,
			timeoutMilliseconds: 900_000,
		});
		const analysis = {
			...attachUploadIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		const panelIdentities = attachEvidenceImageIdentities(
			analysis.panelIdentities,
			browser.uploads,
			'panel identities',
		);
		const imageDerivations = attachEvidenceImageIdentities(
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
			'CR4D explicit parent selectors resolved differently during execution.',
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
			'CR4D protected Algorithm32 source',
		);
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4D protected Flat32 source');

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged});
		const conclusion = !decision.integrityPassed ? 'failed' : decision.accepted ? 'accepted' : 'rejected';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			preservationPassed: decision.preservationPassed,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			brightLowSunPreservationReplay: true,
			paperSimilarityMetric: null,
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
			`# ${run.runId}: CR4D bright / low-Sun preservation replay`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All eighteen requested Bruneton, candidate, x8 difference, black/saturation delta-mask, plot, and decision-plate PNGs were written before runner-owned gates were evaluated.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'The unchanged legacy receiver-light envelope gates only solar noon, one hour before sunset, and ten minutes before sunset. It was not widened after observation.',
			'',
			'Sunset is rendered and reported but does not gate preservation because the revision intentionally changes it and no owner-approved replacement sunset envelope exists. Appearance acceptance remains false.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		requireCondition(
			independentVerification.verified === true &&
				independentVerification.conclusion === conclusion &&
				independentVerification.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4D terminal run failed independent verification.',
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					appearanceAccepted: false,
					brightLowSunPreservationReplay: true,
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
					appearanceAccepted: false,
					brightLowSunPreservationReplay: true,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4D bright / low-Sun preservation replay\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
