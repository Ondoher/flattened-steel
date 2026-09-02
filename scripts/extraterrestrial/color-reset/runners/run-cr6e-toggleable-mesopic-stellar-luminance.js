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
	'node scripts/extraterrestrial/color-reset/runners/run-cr6e-toggleable-mesopic-stellar-luminance.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr6e-toggleable-mesopic-stellar-luminance-v1.json';
const BASE_FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr6c-one-pixel-brightness-calibration-v2.json';
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr6e-toggleable-mesopic-stellar-luminance-browser.js';
const BRIGHTNESS_OWNER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/Cr6cOnePixelBrightnessCalibrationV2.js';
const REGISTRY_OWNER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/ViewPresentationFilterRegistry.js';
const FILTER_OWNER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/HumanLowLightChromaFilter.js';
const MESOPIC_OWNER_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/stellar/HumanMesopicLuminanceFilter.js';
const CIE_DATASET_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cie/CIE_sle_scotopic.csv';
const FROZEN_COLOR_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const BASE_FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...BASE_FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const BRIGHTNESS_OWNER_PATH = path.join(REPOSITORY_ROOT, ...BRIGHTNESS_OWNER_RELATIVE_PATH.split('/'));
const REGISTRY_OWNER_PATH = path.join(REPOSITORY_ROOT, ...REGISTRY_OWNER_RELATIVE_PATH.split('/'));
const FILTER_OWNER_PATH = path.join(REPOSITORY_ROOT, ...FILTER_OWNER_RELATIVE_PATH.split('/'));
const MESOPIC_OWNER_PATH = path.join(REPOSITORY_ROOT, ...MESOPIC_OWNER_RELATIVE_PATH.split('/'));
const CIE_DATASET_PATH = path.join(REPOSITORY_ROOT, ...CIE_DATASET_RELATIVE_PATH.split('/'));
const FROZEN_COLOR_PATH = path.join(REPOSITORY_ROOT, ...FROZEN_COLOR_RELATIVE_PATH.split('/'));
const RUNNER_PATH = path.join(REPOSITORY_ROOT, ...RUNNER_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr6e-toggleable-mesopic-stellar-luminance';
const FIXTURE_SHA256 = '0261174414412bbe8779394d668474790f68f23f4a2a2aa6f9b8d99069e574b5';
const HARNESS_SHA256 = '95d5105ccd2ef96a627f7afededb191eb7b24d34f5623bc34fca36c5a85b328e';
const BRIGHTNESS_OWNER_SHA256 = '63c2fca3ccc9887a398e803b1ca260e9be07d154a4f90738519d0ab084fa447d';
const REGISTRY_OWNER_SHA256 = '1839dd40f4f7750d2109f46febfa75fd66e64969ed0c54941043aa7fb163a4a5';
const FILTER_OWNER_SHA256 = '1f1878390c8bb5007c5e34ebaf2067f42e98e59aa8f339ccc477fb235c6643b9';
const MESOPIC_OWNER_SHA256 = 'd19f87ab3afcd8572d211b607760f2ff242c20bfff54e6f8cc11a725cab984a8';
const CIE_DATASET_SHA256 = '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759';
const FROZEN_COLOR_SHA256 = '7b8115c66bf0b37543f3bd2fe659f91c927648ee76f29f46725cdbb5c0818f8e';
const EXPECTED_PARENT = Object.freeze({
	runId: '000044-cr6-stellar-contrast-onset',
	conclusion: 'rejected',
	artifactSetSha256: '5d36ef15f32e37ef95addf4a3fe38d8ab8ff264c810386876a9d676f3875f2a7',
	manifestSha256: '9cfd19636942a9a63adf617551febbc5290317e3e559f0cb4527e2bc9524a27b',
	manifestByteLength: 20541,
});
const EXPECTED_REJECTED_GPU_CONTROL = Object.freeze({
	runId: '000045-cr6a-stellar-presentation-scale-bracket',
	conclusion: 'rejected',
	artifactSetSha256: '4db7e1ae90bd8af3745f9107a7be7df2bbd4dea1b57186f5e5688f9892f66a0b',
	manifestSha256: '390ebe7fa90a43841c887c2dddbce03a6246e79924ac87732082e328d5d325f3',
	manifestByteLength: 12301,
	resultSha256: '242b28d00e80a6bd90e4a104c6460586d211941b958382fba7d31b3bc7809508',
	resultByteLength: 1082398,
	soleFailedGate: 'controlQ1ExactParentReplay',
});
const EXPECTED_SCENE_IDS = Object.freeze([
	'sunset',
	'sunset-plus-10-minutes',
	'sunset-plus-30-minutes',
	'sunset-plus-60-minutes',
	'sunset-plus-90-minutes',
	'solar-zenith-108-below',
	'solar-zenith-108-above',
	'sunset-plus-120-minutes',
]);
const EXPECTED_ROW_IDS = Object.freeze([
	'physical-control',
	'moderate-chroma-control',
	'mesopic-half',
	'mesopic-full',
]);
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const BROWSER_TIMEOUT_MILLISECONDS = 600_000;

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function mergeFixture(base, increment) {
	return {
		...base,
		...increment,
		parent: base.parent,
		rejectedGpuControl: base.rejectedGpuControl,
		replayOracle: base.replayOracle,
		viewport: base.viewport,
		frozenSkyDisplay: base.frozenSkyDisplay,
		scenes: base.scenes,
		metrics: base.metrics,
		rows: increment.rows.map((row) => ({
			...row,
			multiplier: increment.presentation.brightnessMultiplier,
			effectiveBoundaryScale: increment.presentation.effectiveBoundaryScale,
		})),
	};
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

function parentArtifacts(fixture) {
	const selected = [
		fixture.parent.terminalResult,
		fixture.parent.analysis,
		fixture.parent.memberLedger,
		fixture.parent.fixedMemberTracks,
		fixture.parent.transitionAnalysis,
		...fixture.scenes.flatMap((scene) => [
			scene.skyField,
			scene.controlPng,
			scene.stellarScreenIndex,
			scene.sceneHitMask,
		]),
	];
	return [...new Map(selected.map((artifact) => [artifact.path, artifact])).values()];
}

function rejectedGpuControlArtifacts(fixture) {
	return [
		fixture.rejectedGpuControl.terminalResult,
		...fixture.rejectedGpuControl.fullFrames,
	];
}

function browserEvidencePaths(fixture) {
	return [
		fixture.outputs.evidence.replayLedger,
		fixture.outputs.evidence.fixedMemberAnalysis,
		fixture.outputs.evidence.transitionAnalysis,
	];
}

function allowedBrowserArtifacts(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder, ...browserEvidencePaths(fixture)];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === `${SCHEMA_PREFIX}-input-v1`,
		'CR6E fixture schema changed.',
	);
	requireCondition(
		fixture.experiment?.increment === 'CR6E' &&
			fixture.experiment.slug === 'cr6e-toggleable-mesopic-stellar-luminance',
		'CR6E experiment identity changed.',
	);
	requireCondition(
		typeof fixture.claimBoundary?.accepts === 'string' &&
			fixture.claimBoundary.doesNotAccept.includes('a solar filter') &&
			fixture.claimBoundary.doesNotAccept.includes('production adoption'),
		'CR6E claim boundary changed.',
	);
	requireCondition(
		fixture.baseFixture.path === BASE_FIXTURE_RELATIVE_PATH &&
			fixture.baseFixture.schemaId ===
				'algorithm32-color-reset-cr6c-one-pixel-brightness-calibration-input-v2' &&
			fixture.baseFixture.sha256 ===
				'443c0aff9c22990c136814c8021f1538fafe1ca5bef403823113cd5597792e4b',
		'CR6E base-fixture identity changed.',
	);
	requireCondition(
		fixture.parent.namespace === 'color-reset' &&
			fixture.parent.runId === EXPECTED_PARENT.runId &&
			fixture.parent.conclusion === EXPECTED_PARENT.conclusion &&
			fixture.parent.independentlyVerified === true &&
			fixture.parent.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256 &&
			fixture.parent.manifest.byteLength === EXPECTED_PARENT.manifestByteLength &&
			fixture.parent.manifest.sha256 === EXPECTED_PARENT.manifestSha256,
		'CR6E parent identity changed.',
	);
	requireCondition(
		exactJson(fixture.scenes.map(({id}) => id), EXPECTED_SCENE_IDS) &&
			exactJson(fixture.rows.map(({id}) => id), EXPECTED_ROW_IDS) &&
			fixture.rows.every(({multiplier}) => multiplier === 24),
		'CR6E row or scene order changed.',
	);
	requireCondition(
		fixture.presentation.brightnessMultiplier === 24 &&
			fixture.presentation.effectiveBoundaryScale === 1463996.1476640578 &&
			fixture.presentation.registryId === 'view-presentation-filter-registry-v1' &&
			fixture.presentation.luminanceFilterId === 'human-mesopic-luminance-v1' &&
			fixture.presentation.chromaFilterId === 'human-low-light-chroma-v1' &&
			fixture.presentation.implementedStage === 'source-linear' &&
			fixture.presentation.implementedTarget === 'stellar',
		'CR6E presentation equation or owner changed.',
	);
	requireCondition(
		fixture.rows.every((row) => row.filters.length === 2 &&
			row.filters[0].id === fixture.presentation.luminanceFilterId &&
			row.filters[0].order === 0 && row.filters[0].stage === 'source-linear' &&
			row.filters[1].id === fixture.presentation.chromaFilterId &&
			row.filters[1].order === 1 && row.filters[1].stage === 'source-linear') &&
			fixture.rows[0].filters.every(({enabled}) => !enabled) &&
			fixture.rows[1].filters[0].enabled === false && fixture.rows[1].filters[1].enabled === true &&
			fixture.rows[2].filters[0].parameters.maximumRodContribution === 0.5 &&
			fixture.rows[3].filters[0].parameters.maximumRodContribution === 1,
		'CR6E filter bracket changed.',
	);
	requireCondition(
		fixture.selectedBrightnessParent.runId ===
			'000049-cr6c-one-pixel-brightness-calibration-narrowed' &&
			fixture.selectedBrightnessParent.conclusion === 'accepted' &&
			fixture.selectedBrightnessParent.controlFrames.length === 8 &&
			fixture.chromaParent.runId === '000052-cr6d-toggleable-low-light-stellar-chroma' &&
			fixture.chromaParent.conclusion === 'accepted' &&
			fixture.chromaParent.controlFrames.length === 8 &&
			fixture.catalogParent.runId === '000047-cr6b-brightest-2000-catalog-proof' &&
			fixture.catalogParent.conclusion === 'accepted' &&
			fixture.cieScotopicDataset.sha256 === CIE_DATASET_SHA256,
		'CR6E selected brightness or catalog parent changed.',
	);
	requireCondition(
		fixture.frozenSkyDisplay.id === 'slope-078-p9' &&
			fixture.frozenSkyDisplay.sunsetAmplitude === 3.5 &&
			fixture.frozenSkyDisplay.sunsetTransitionIlluminanceLux === 980 &&
			fixture.frozenSkyDisplay.sunsetRolloffPower === 9 &&
			fixture.frozenSkyDisplay.adaptationPivotIlluminanceLux === 385 &&
			fixture.frozenSkyDisplay.adaptationFloorIlluminanceLux === 0.02 &&
			fixture.frozenSkyDisplay.adaptationSoftnessLogUnits === 0.1 &&
			fixture.frozenSkyDisplay.adaptationExponent === 0.78,
		'CR6E frozen Color changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 && fixture.viewport.heightPixels === 400 &&
			fixture.viewport.pixelCount === 256000,
		'CR6E viewport changed.',
	);
	const selected = parentArtifacts(fixture);
	requireCondition(
		selected.every((artifact) =>
			isArtifactPath(artifact.path) && isSha256(artifact.sha256) &&
			Number.isInteger(artifact.byteLength) && artifact.byteLength > 0 &&
			typeof artifact.schemaId === 'string'),
		'CR6E parent artifact declaration is incomplete.',
	);
	for (const artifact of [
		fixture.selectedBrightnessParent.terminalResult,
		...fixture.selectedBrightnessParent.controlFrames,
		fixture.chromaParent.terminalResult,
		...fixture.chromaParent.controlFrames,
		fixture.catalogParent.roster,
	]) {
		requireCondition(
			isArtifactPath(artifact.path) && isSha256(artifact.sha256) &&
				Number.isInteger(artifact.byteLength) && artifact.byteLength > 0,
			'CR6E accepted-parent artifact declaration is incomplete.',
		);
	}
	requireCondition(
		fixture.outputs.requestedImageUploadOrder.length === fixture.gates.requestedImageCount &&
			fixture.gates.requestedImageCount === 40 &&
			fixture.outputs.requestedImageUploadOrder.every(isArtifactPath) &&
			browserEvidencePaths(fixture).every(isArtifactPath),
		'CR6E output contract changed.',
	);
	requireCondition(
		fixture.gates.exactControlMaximumRgbCode === 0 &&
			fixture.gates.gpuCpuMaximumRgbCode === 1 &&
			fixture.gates.nonstellarRgbMustMatchControlExactly === true &&
			fixture.gates.twilightAnchorMinimumRgbCode === 2 &&
			fixture.gates.transitionMaximumPerMemberDeltaDifferenceCodes === 1 &&
			fixture.gates.allImagesBeforeScientificGates === true &&
			fixture.gates.requiredAngleBackend === 'D3D11',
		'CR6E gate or derivation contract changed.',
	);
	const below = fixture.scenes.find(({id}) => id === fixture.metrics.transition.belowSceneId);
	const above = fixture.scenes.find(({id}) => id === fixture.metrics.transition.aboveSceneId);
	requireCondition(
		Date.parse(above.timeIso) - Date.parse(below.timeIso) === 1 &&
			fixture.metrics.transition.maximumPerMemberDeltaDifferenceCodes ===
				fixture.gates.transitionMaximumPerMemberDeltaDifferenceCodes,
		'CR6E transition contract changed.',
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
	const canonical = await verifyOrdinaryCanonicalDirectory(resolved, 'CR6E parent run');
	assertLexicallyContained(runsRoot, canonical, 'CR6E parent run');
	await assertNoReparseEntries(canonical, 'CR6E parent run');
	return canonical;
}

async function verifyParent(fixture, selector, root) {
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.runId === EXPECTED_PARENT.runId &&
			terminal.conclusion === EXPECTED_PARENT.conclusion &&
			terminal.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256,
		'CR6E parent terminal identity changed.',
	);
	const manifestPath = path.join(root, fixture.parent.manifest.path);
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === fixture.parent.manifest.byteLength &&
			manifestSha256 === fixture.parent.manifest.sha256,
		'CR6E parent manifest file identity changed.',
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === EXPECTED_PARENT.runId &&
			manifest.conclusion === EXPECTED_PARENT.conclusion &&
			manifest.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		'CR6E parent manifest terminal facts changed.',
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = parentArtifacts(fixture);
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR6E parent manifest changed ${artifact.path}.`,
		);
		const target = path.join(root, ...artifact.path.split('/'));
		assertLexicallyContained(root, target, `CR6E parent ${artifact.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(target)) === artifact.sha256,
			`CR6E parent artifact changed ${artifact.path}.`,
		);
	}
	const parentResult = await readJson(path.join(root, fixture.parent.terminalResult.path));
	const failedGates = Object.entries(parentResult.gates ?? {})
		.filter(([, passed]) => passed === false)
		.map(([name]) => name);
	requireCondition(
		parentResult.schemaId === fixture.parent.terminalResult.schemaId &&
			parentResult.executionStatus === 'objective-gates-rejected-owner-review-not-authoritative' &&
			parentResult.accepted === false && parentResult.integrityPassed === true &&
			parentResult.scientificPassed === false &&
			exactJson(failedGates, ['darkOrderingAndColor']),
		'CR6E parent rejection boundary changed.',
	);
	return {
		schemaId: `${SCHEMA_PREFIX}-parent-verification-v2`,
		verified: true,
		explicitSelector: selector,
		namespace: fixture.parent.namespace,
		runId: terminal.runId,
		conclusion: terminal.conclusion,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		manifest: {...fixture.parent.manifest, sha256: manifestSha256, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		parentFailureLocalizedTo: failedGates,
		selectedArtifacts: selected,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			fixture.parent.manifest.path,
			...selected.map(({path: artifactPath}) => artifactPath),
		]),
	};
}

async function verifyAcceptedParent(declaration, selector, root, artifacts, label) {
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true && terminal.runId === declaration.runId &&
			terminal.conclusion === 'accepted' &&
			terminal.artifactSetSha256 === declaration.artifactSetSha256,
		`${label} terminal identity changed.`,
	);
	const manifestPath = path.join(root, declaration.manifest.path);
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === declaration.manifest.byteLength &&
			manifestSha256 === declaration.manifest.sha256,
		`${label} manifest identity changed.`,
	);
	const manifest = await readJson(manifestPath);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const artifact of artifacts) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`${label} manifest changed ${artifact.path}.`,
		);
		const target = path.join(root, ...artifact.path.split('/'));
		assertLexicallyContained(root, target, `${label} ${artifact.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(target)) === artifact.sha256,
			`${label} artifact changed ${artifact.path}.`,
		);
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-accepted-parent-verification-v1`,
		verified: true,
		explicitSelector: selector,
		namespace: declaration.namespace,
		runId: terminal.runId,
		conclusion: terminal.conclusion,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		manifest: {...declaration.manifest, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		selectedArtifacts: artifacts,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			declaration.manifest.path,
			...artifacts.map(({path: artifactPath}) => artifactPath),
		]),
	};
}

function assertAcceptedParentUnchanged(before, after, label) {
	requireCondition(
		before.runId === after.runId && before.conclusion === after.conclusion &&
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
	return true;
}

async function verifyRejectedGpuControl(fixture, selector, root) {
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.runId === EXPECTED_REJECTED_GPU_CONTROL.runId &&
			terminal.conclusion === EXPECTED_REJECTED_GPU_CONTROL.conclusion &&
			terminal.artifactSetSha256 === EXPECTED_REJECTED_GPU_CONTROL.artifactSetSha256,
		'CR6E rejected GPU control terminal identity changed.',
	);
	const declaration = fixture.rejectedGpuControl;
	const manifestPath = path.join(root, declaration.manifest.path);
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === declaration.manifest.byteLength &&
			manifestSha256 === declaration.manifest.sha256,
		'CR6E rejected GPU control manifest file identity changed.',
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === EXPECTED_REJECTED_GPU_CONTROL.runId &&
			manifest.conclusion === EXPECTED_REJECTED_GPU_CONTROL.conclusion &&
			manifest.artifactSetSha256 === EXPECTED_REJECTED_GPU_CONTROL.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		'CR6E rejected GPU control manifest terminal facts changed.',
	);
	const selected = rejectedGpuControlArtifacts(fixture);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR6E rejected GPU control manifest changed ${artifact.path}.`,
		);
		const target = path.join(root, ...artifact.path.split('/'));
		assertLexicallyContained(root, target, `CR6E rejected GPU control ${artifact.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(target)) === artifact.sha256,
			`CR6E rejected GPU control artifact changed ${artifact.path}.`,
		);
	}
	const rejectedResult = await readJson(path.join(root, declaration.terminalResult.path));
	const failedGates = Object.entries(rejectedResult.gates ?? {})
		.filter(([, passed]) => passed === false)
		.map(([name]) => name);
	requireCondition(
		rejectedResult.schemaId === declaration.terminalResult.schemaId &&
			rejectedResult.executionStatus ===
				'objective-gates-rejected-owner-review-not-authoritative' &&
			rejectedResult.accepted === false && rejectedResult.integrityPassed === true &&
			rejectedResult.scientificPassed === false &&
			exactJson(failedGates, [EXPECTED_REJECTED_GPU_CONTROL.soleFailedGate]),
		'CR6E rejected GPU control failure boundary changed.',
	);
	return {
		schemaId: `${SCHEMA_PREFIX}-rejected-gpu-control-verification-v2`,
		verified: true,
		explicitSelector: selector,
		namespace: declaration.namespace,
		runId: terminal.runId,
		conclusion: terminal.conclusion,
		repositoryRelativePath: path.relative(REPOSITORY_ROOT, root).replaceAll('\\', '/'),
		manifest: {...declaration.manifest, sha256: manifestSha256, verified: true},
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		soleFailedGate: failedGates[0],
		selectedArtifacts: selected,
		selectedArtifactInventory: await createSelectedFileInventory(root, [
			declaration.manifest.path,
			...selected.map(({path: artifactPath}) => artifactPath),
		]),
	};
}

function assertParentUnchanged(before, after) {
	requireCondition(
		before.runId === after.runId && before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes,
		'CR6E parent terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR6E selected parent artifacts',
	);
	return true;
}

function assertRejectedGpuControlUnchanged(before, after) {
	requireCondition(
		before.runId === after.runId && before.conclusion === after.conclusion &&
			before.manifest.sha256 === after.manifest.sha256 &&
			before.artifactSetSha256 === after.artifactSetSha256 &&
			before.artifactCount === after.artifactCount &&
			before.artifactBytes === after.artifactBytes &&
			before.soleFailedGate === after.soleFailedGate,
		'CR6E rejected GPU control terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR6E rejected GPU control selected artifacts',
	);
	return true;
}

async function verifyAuthoredInputs() {
	const [
		fixtureSha256,
		baseFixtureSha256,
		harnessSha256,
		brightnessOwnerSha256,
		registryOwnerSha256,
		filterOwnerSha256,
		mesopicOwnerSha256,
		cieDatasetSha256,
		frozenColorSha256,
		runnerSha256,
	] =
		await Promise.all([
			sha256File(FIXTURE_PATH),
			sha256File(BASE_FIXTURE_PATH),
			sha256File(HARNESS_PATH),
			sha256File(BRIGHTNESS_OWNER_PATH),
			sha256File(REGISTRY_OWNER_PATH),
			sha256File(FILTER_OWNER_PATH),
			sha256File(MESOPIC_OWNER_PATH),
			sha256File(CIE_DATASET_PATH),
			sha256File(FROZEN_COLOR_PATH),
			sha256File(RUNNER_PATH),
		]);
	requireCondition(
		fixtureSha256 === FIXTURE_SHA256 && harnessSha256 === HARNESS_SHA256 &&
			baseFixtureSha256 ===
				'443c0aff9c22990c136814c8021f1538fafe1ca5bef403823113cd5597792e4b' &&
			brightnessOwnerSha256 === BRIGHTNESS_OWNER_SHA256 &&
			registryOwnerSha256 === REGISTRY_OWNER_SHA256 &&
			filterOwnerSha256 === FILTER_OWNER_SHA256 &&
			mesopicOwnerSha256 === MESOPIC_OWNER_SHA256 &&
			cieDatasetSha256 === CIE_DATASET_SHA256 &&
			frozenColorSha256 === FROZEN_COLOR_SHA256,
		'CR6E pinned fixture, harness, registry/filter owner, brightness owner, or frozen Color changed.',
	);
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		baseFixture: {path: BASE_FIXTURE_RELATIVE_PATH, sha256: baseFixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		brightnessOwner: {
			path: BRIGHTNESS_OWNER_RELATIVE_PATH,
			sha256: brightnessOwnerSha256,
			id: 'stellar-one-pixel-brightness-calibration-v2',
		},
		registryOwner: {path: REGISTRY_OWNER_RELATIVE_PATH, sha256: registryOwnerSha256},
		filterOwner: {path: FILTER_OWNER_RELATIVE_PATH, sha256: filterOwnerSha256},
		mesopicOwner: {path: MESOPIC_OWNER_RELATIVE_PATH, sha256: mesopicOwnerSha256},
		cieScotopicDataset: {path: CIE_DATASET_RELATIVE_PATH, sha256: cieDatasetSha256},
		frozenColor: {path: FROZEN_COLOR_RELATIVE_PATH, sha256: frozenColorSha256},
		runner: {
			path: RUNNER_RELATIVE_PATH,
			sha256: runnerSha256,
			identityRole: 'observed identity; static-closure inventory is compared before and after execution',
		},
	};
}

async function captureImplementationBefore() {
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr6e-toggleable-mesopic-stellar-luminance.js',
			'color-reset/harness/cr6e-toggleable-mesopic-stellar-luminance-browser.js',
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
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-before-v2`,
		implementation: {
			closure,
			inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, closure.files),
		},
		packageBoundary: {
			packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
			packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
		},
	};
}

async function captureImplementationAfter(before) {
	return {
		schemaId: `${SCHEMA_PREFIX}-runtime-implementation-after-v2`,
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementation.closure.files,
		),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR6E runtime implementation',
	);
	requireCondition(
		before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR6E package boundary changed during execution.',
	);
	return true;
}

function makeBrowserConfiguration(
	fixture,
	parent,
	selectedBrightnessParent,
	chromaParent,
	catalogParent,
	authoredInputs,
) {
	return {
		...fixture,
		browserParent: {
			prefix: '/parent/',
			runId: parent.runId,
			conclusion: parent.conclusion,
			artifactSetSha256: parent.artifactSetSha256,
			manifest: parent.manifest,
		},
		browserSelectedBrightness: {
			prefix: '/selected-brightness/',
			runId: selectedBrightnessParent.runId,
			artifactSetSha256: selectedBrightnessParent.artifactSetSha256,
		},
		browserChroma: {
			prefix: '/chroma/',
			runId: chromaParent.runId,
			artifactSetSha256: chromaParent.artifactSetSha256,
		},
		browserCatalog: {
			prefix: '/catalog/',
			runId: catalogParent.runId,
			artifactSetSha256: catalogParent.artifactSetSha256,
		},
		implementation: {
			runner: authoredInputs.runner,
			harness: authoredInputs.harness,
			brightnessOwner: authoredInputs.brightnessOwner,
			registryOwner: authoredInputs.registryOwner,
			filterOwner: authoredInputs.filterOwner,
			mesopicOwner: authoredInputs.mesopicOwner,
			cieScotopicDataset: authoredInputs.cieScotopicDataset,
			frozenColor: authoredInputs.frozenColor,
		},
	};
}

function elapsedMilliseconds(start, end) {
	return Date.parse(end) - Date.parse(start);
}

function makeProgress(run, browser, fixture) {
	const firstImage = browser.progressEvents.find(({stage}) => stage === 'image-1') ?? null;
	const decisionPlate = browser.progressEvents.find(({stage}) => stage === 'decision-plate-complete') ?? null;
	const allImages = browser.progressEvents.find(({stage}) => stage === 'all-images-complete') ?? null;
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v2`,
		initializedAt: run.initializedAt,
		firstImage: firstImage === null ? null : {
			completedAt: firstImage.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, firstImage.completedAt),
			targetMilliseconds: 180_000,
		},
		decisionPlate: decisionPlate === null ? null : {
			completedAt: decisionPlate.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, decisionPlate.completedAt),
			targetMilliseconds: 600_000,
		},
		allImages: allImages === null ? null : {
			completedAt: allImages.completedAt,
			elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, allImages.completedAt),
		},
		requestedImageCount: fixture.gates.requestedImageCount,
		browserProgressEvents: browser.progressEvents,
	};
}

function verifyBrowserArtifactIdentities(analysis, browser, fixture) {
	const byPath = new Map(browser.uploads.map((upload) => [upload.path, upload]));
	const declared = [...analysis.uploadedImages, ...analysis.uploadedEvidence];
	for (const artifact of declared) {
		const upload = byPath.get(artifact.artifactPath);
		requireCondition(
			upload?.byteLength === artifact.byteLength && upload.sha256 === artifact.sha256,
			`CR6E browser/server identity differs for ${artifact.artifactPath}.`,
		);
	}
	requireCondition(
		exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), allowedBrowserArtifacts(fixture)),
		'CR6E browser upload order changed.',
	);
}

function evaluateGates({analysis, browser, fixture, progress, immutable}) {
	const byRow = new Map(analysis.rows.map((row) => [row.rowId, row]));
	const control = byRow.get('physical-control');
	const moderate = byRow.get('moderate-chroma-control');
	const half = byRow.get('mesopic-half');
	const full = byRow.get('mesopic-full');
	const onsetSceneId = fixture.metrics.progressiveSceneIds.onset;
	const laterSceneId = fixture.metrics.progressiveSceneIds.later;
	const earlyIds = new Set(fixture.metrics.earlyNoRobustSceneIds);
	const darkIds = new Set(fixture.metrics.darkSceneIds);
	const allScenes = analysis.rows.flatMap((row) => row.scenes);
	const rowAndSceneExact =
		exactJson(analysis.rowOrder, EXPECTED_ROW_IDS) &&
		exactJson(analysis.sceneOrder, EXPECTED_SCENE_IDS) &&
		analysis.rows.every((row) =>
			exactJson(row.scenes.map(({sceneId}) => sceneId), EXPECTED_SCENE_IDS));
	const imageDerivationsComplete =
		analysis.imageDerivations.length === 40 &&
		analysis.imageDerivations.every((entry) =>
			Array.isArray(entry.parents) && entry.parents.length > 0 &&
			typeof entry.operation === 'string' && entry.operation.length > 0 &&
			entry.implementation && entry.materialParameters &&
			entry.result?.artifactPath === entry.artifactPath && isSha256(entry.result.sha256));
	const evidenceDerivationsComplete =
		['replayLedger', 'fixedMemberAnalysis', 'transitionAnalysis'].every((key) => {
			const derivation = analysis.evidenceDerivations?.[key];
			return derivation && derivation.operation && derivation.implementation &&
				derivation.result?.artifactPath && isSha256(derivation.result.sha256);
		});
	const transitionRows = analysis.transitionAnalysis.rows;
	const candidateRows = [half, full];
	const relationshipExact = candidateRows.every((row) => row.scenes.every((scene) =>
		scene.representatives.every((member) => {
			const expected = member.sourceLinearLuminance + member.rodWeight *
				(member.scotopicLuminance - member.sourceLinearLuminance);
			return member.rodWeight >= 0 && member.rodWeight <= 1 &&
				Math.abs(member.filteredLinearLuminance - expected) <= 1e-8;
		})));
	const halfBySceneAndMember = new Map(half.scenes.flatMap((scene) =>
		scene.representatives.map((member) => [`${scene.sceneId}|${member.memberId}`, member])));
	const orderedResponse = full.scenes.every((scene) =>
		scene.representatives.every((member) => {
			const middle = halfBySceneAndMember.get(`${scene.sceneId}|${member.memberId}`);
			if (!middle) return false;
			return member.scotopicPhotopicRatio >= 1
				? member.filteredLinearLuminance + 1e-12 >= middle.filteredLinearLuminance &&
					middle.filteredLinearLuminance + 1e-12 >= member.sourceLinearLuminance
				: member.filteredLinearLuminance <= middle.filteredLinearLuminance + 1e-12 &&
					middle.filteredLinearLuminance <= member.sourceLinearLuminance + 1e-12;
		}));
	const gates = {
		browserSchema:
			analysis.schemaId === `${SCHEMA_PREFIX}-browser-result-v1` &&
			analysis.fixedMemberAnalysis.schemaId ===
				'algorithm32-color-reset-cr6e-fixed-member-analysis-v1' &&
			analysis.transitionAnalysis.schemaId ===
				'algorithm32-color-reset-cr6e-transition-analysis-v1',
		claimBoundaryPreserved:
			analysis.appearanceAccepted === false &&
			analysis.automaticCandidateSelection === false &&
			analysis.productionClaim === false &&
			exactJson(analysis.claimBoundary, fixture.claimBoundary),
		renderCompletedBeforeScientificGates:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.scientificGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true &&
			analysis.allDeclaredBrowserEvidenceUploaded === true,
		imageCountAndOrder:
			analysis.requestedImageCount === 40 && analysis.uploadedImageCount === 40 &&
			exactJson(analysis.imageUploadOrder, fixture.outputs.requestedImageUploadOrder) &&
			exactJson(
				browser.uploads.slice(0, 40).map(({path: artifactPath}) => artifactPath),
				fixture.outputs.requestedImageUploadOrder,
			),
		rowSceneAndEquationExact:
			rowAndSceneExact &&
			analysis.presentationOwner.registryId === fixture.presentation.registryId &&
			analysis.presentationOwner.luminanceFilterId === fixture.presentation.luminanceFilterId &&
			analysis.presentationOwner.chromaFilterId === fixture.presentation.chromaFilterId &&
			analysis.presentationOwner.multiplier === 24 &&
			analysis.presentationOwner.equation === fixture.presentation.operation &&
			analysis.rows.every((row, index) =>
				row.multiplier === fixture.rows[index].multiplier &&
				row.effectiveBoundaryScale === fixture.rows[index].effectiveBoundaryScale &&
				exactJson(row.filters, fixture.rows[index].filters)),
		parentAuthenticatedAndImmutable: immutable.parent,
		selectedBrightnessParentAuthenticatedAndImmutable: immutable.selectedBrightnessParent,
		chromaParentAuthenticatedAndImmutable: immutable.chromaParent,
		catalogParentAuthenticatedAndImmutable: immutable.catalogParent,
		implementationImmutable: immutable.implementation,
		protectedSourceImmutable: immutable.protected,
		allDerivationsRecorded: imageDerivationsComplete && evidenceDerivationsComplete,
		progressContract:
			progress.firstImage !== null && progress.decisionPlate !== null && progress.allImages !== null &&
			progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds &&
			progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
		webgl2D3d11Healthy:
			typeof analysis.gpu.api === 'string' && /WebGL 2\.0/iu.test(analysis.gpu.api) &&
			analysis.gpu.d3d11 === true && analysis.gpu.extColorBufferFloat === true &&
			analysis.gpu.contextLost === false && analysis.gpu.terminalWebglErrors.length === 0 &&
			allScenes.every((scene) => scene.gpuNonfiniteValueCount === 0 && scene.cpuNonfiniteValueCount === 0),
		physicalControlExactSelectedQ24Replay:
			control.scenes.every((scene) =>
				scene.maximumDisabledLinearScalarDifference === 0 &&
				scene.gpuControlParentComparison.maximumRgbCodeDifference === 0 &&
				scene.gpuControlParentComparison.differingChannelCount === 0),
		gpuCpuWithinOneCode:
			allScenes.every((scene) =>
				scene.gpuCpuComparison.maximumRgbCodeDifference <= fixture.gates.gpuCpuMaximumRgbCode),
		nonstellarPixelsExactControl:
			fixture.gates.nonstellarRgbMustMatchControlExactly === true &&
			allScenes.every((scene) =>
				scene.nonoccupiedControlComparison.differingRgbChannelCount === 0 &&
				scene.nonoccupiedControlComparison.maximumRgbCodeDifference === 0),
		moderateControlExactCr6dReplay:
			moderate.scenes.every((scene) =>
				scene.chromaParentComparison.maximumRgbCodeDifference === 0 &&
				scene.chromaParentComparison.differingChannelCount === 0),
		photopicScenesExactModerateControl:
			candidateRows.every((row) => row.scenes.slice(0, 3).every((scene) =>
				scene.chromaParentComparison.maximumRgbCodeDifference === 0)),
		cieScotopicPhotopicRelationshipExact: relationshipExact,
		halfAndFullResponsesOrdered: orderedResponse,
		candidateActuallyChangesDarkStellarOutput:
			candidateRows.every((row) => row.scenes.slice(3).some((scene) =>
				scene.chromaParentComparison.differingChannelCount > 0)),
		earlyCadenceHasNoRobustStars:
			allScenes.filter(({sceneId}) => earlyIds.has(sceneId))
				.every(({robustPixelCount}) => robustPixelCount === fixture.gates.earlyRobustCount),
		brightStarOnsetAtPlus30Preserved:
			analysis.rows.every((row) => {
				const scene = row.scenes.find(
					({sceneId}) => sceneId === fixture.metrics.twilightAnchor.sceneId,
				);
				const anchor = scene.representatives.find(
					({memberId}) => memberId === fixture.metrics.twilightAnchor.memberId,
				);
				return anchor?.maximumAbsoluteDeltaRgbCode >=
					fixture.gates.twilightAnchorMinimumRgbCode && anchor.robust === true;
			}),
		progressiveSampledOnset:
			analysis.rows.every((row) => {
				const onset = row.scenes.find(({sceneId}) => sceneId === onsetSceneId);
				const later = row.scenes.find(({sceneId}) => sceneId === laterSceneId);
				return onset.robustPixelCount > 0 &&
					onset.robustPixelCount < onset.occupiedPixelCount &&
					later.robustPixelCount >= onset.robustPixelCount;
			}),
		darkHasNoSaturationOrWhiteCollapse:
			allScenes.filter(({sceneId}) => darkIds.has(sceneId)).every((scene) =>
				scene.saturatedStellarPixelCount === 0 && scene.exactWhiteStellarPixelCount === 0),
		transitionGeometryAndDisplayContinuity:
			analysis.transitionAnalysis.parentGeometryInheritedExact === true &&
			analysis.transitionAnalysis.timestampSeparationMilliseconds === 1 &&
			transitionRows.every((row) =>
				row.projectedPixelMismatchCount === 0 &&
				row.robustMembershipMismatchCount === 0 &&
				row.maximumPerStarDisplayedDeltaRgbCodeDifference <=
					fixture.gates.transitionMaximumPerMemberDeltaDifferenceCodes &&
				row.withinDeclaredBoundary === true),
	};
	const integrityGateNames = [
		'browserSchema',
		'claimBoundaryPreserved',
		'renderCompletedBeforeScientificGates',
		'imageCountAndOrder',
		'rowSceneAndEquationExact',
		'parentAuthenticatedAndImmutable',
		'selectedBrightnessParentAuthenticatedAndImmutable',
		'chromaParentAuthenticatedAndImmutable',
		'catalogParentAuthenticatedAndImmutable',
		'implementationImmutable',
		'protectedSourceImmutable',
		'allDerivationsRecorded',
		'progressContract',
		'webgl2D3d11Healthy',
	];
	const integrityPassed = integrityGateNames.every((name) => gates[name] === true);
	const scientificPassed = Object.entries(gates)
		.filter(([name]) => !integrityGateNames.includes(name))
		.every(([, passed]) => passed === true);
	return {
		gates,
		integrityGateNames,
		integrityPassed,
		scientificPassed,
		accepted: integrityPassed && scientificPassed,
	};
}

async function failureProgress(run, error) {
	return {
		schemaId: `${SCHEMA_PREFIX}-progress-v2`,
		initializedAt: run.initializedAt,
		failedAt: new Date().toISOString(),
		error: error instanceof Error ? error.message : String(error),
	};
}

async function main() {
	const [parentSelector, selectedBrightnessSelector, chromaSelector, catalogSelector, ...extraArguments] =
		process.argv.slice(2);
	if (!parentSelector || !selectedBrightnessSelector || !chromaSelector || !catalogSelector || extraArguments.length !== 0) {
		throw new Error(
			`${COMMAND_PREFIX} <explicit-CR6-parent-run> <explicit-CR6C-selected-run> <explicit-CR6D-chroma-run> <explicit-CR6B-catalog-run>`,
		);
	}
	const [baseFixture, incrementFixture] = await Promise.all([
		readJson(BASE_FIXTURE_PATH),
		readJson(FIXTURE_PATH),
	]);
	const fixture = mergeFixture(baseFixture, incrementFixture);
	verifyFixtureContract(fixture);
	const command =
		`${COMMAND_PREFIX} ${JSON.stringify(parentSelector)} ${JSON.stringify(selectedBrightnessSelector)} ${JSON.stringify(chromaSelector)} ${JSON.stringify(catalogSelector)}`;
	const run = await initializeColorResetRunRecord({
		slug: 'cr6e-toggleable-mesopic-stellar-luminance',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR6E toggleable mesopic stellar luminance approximation',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			baseFixture: fixture.baseFixture,
			explicitParentSelector: parentSelector,
			parent: fixture.parent,
			explicitSelectedBrightnessSelector: selectedBrightnessSelector,
			selectedBrightnessParent: fixture.selectedBrightnessParent,
			explicitChromaSelector: chromaSelector,
			chromaParent: fixture.chromaParent,
			explicitCatalogSelector: catalogSelector,
			catalogParent: fixture.catalogParent,
			replayOracle: fixture.replayOracle,
			rows: fixture.rows,
			scenes: fixture.scenes,
			presentation: fixture.presentation,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			outputArtifacts: [...allowedBrowserArtifacts(fixture), fixture.outputs.evidence.analysis],
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Authenticate CR6 raw sky/geometry/transported Native15 evidence, CR6C q=24, CR6D moderate chroma, CR6B magnitudes, and CIE scotopic efficiency; derive physical-sky adaptation; render four ordered-filter rows and 40 images before gates; requalify q=24 onset, clipping, transition, containment, and toggle relationships.',
			implementation: [
				RUNNER_RELATIVE_PATH,
				HARNESS_RELATIVE_PATH,
				BASE_FIXTURE_RELATIVE_PATH,
				BRIGHTNESS_OWNER_RELATIVE_PATH,
				REGISTRY_OWNER_RELATIVE_PATH,
				FILTER_OWNER_RELATIVE_PATH,
				MESOPIC_OWNER_RELATIVE_PATH,
				CIE_DATASET_RELATIVE_PATH,
				FROZEN_COLOR_RELATIVE_PATH,
				FIXTURE_RELATIVE_PATH,
			],
			parent: fixture.parent,
			selectedBrightnessParent: fixture.selectedBrightnessParent,
			chromaParent: fixture.chromaParent,
			catalogParent: fixture.catalogParent,
			replayOracle: fixture.replayOracle,
			rows: fixture.rows,
			compositionEquation: fixture.presentation.operation,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			exclusions: [
				'no source irradiance, spectrum, catalog, collision, geometry, mask, transport, sky, Color, q=24, or one-pixel occupancy change',
				'no final framebuffer, temporal adaptation, moonlight, light pollution, or automatic enable input',
				'no solar filter',
				'no automatic row selection',
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
			parent: 'tmp/extraterrestrial/color-reset/runs/000044-cr6-stellar-contrast-onset',
			selectedBrightnessParent:
				'tmp/extraterrestrial/color-reset/runs/000049-cr6c-one-pixel-brightness-calibration-narrowed',
			chromaParent:
				'tmp/extraterrestrial/color-reset/runs/000052-cr6d-toggleable-low-light-stellar-chroma',
			catalogParent:
				'tmp/extraterrestrial/color-reset/runs/000047-cr6b-brightest-2000-catalog-proof',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#mesopic-stellar-luminance-filter-introduced-by-cr6e',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr6e---add-a-toggleable-mesopic-stellar-luminance-option',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	const state = {};
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR6E implementation');
		state.authoredInputs = await verifyAuthoredInputs();
		await run.writeJsonArtifact('evidence/authored-input-identities.json', state.authoredInputs);
		state.parentRootBefore = await resolveParentDirectory(parentSelector);
		state.parentBefore = await verifyParent(fixture, parentSelector, state.parentRootBefore);
		await run.writeJsonArtifact('evidence/parent-before.json', state.parentBefore);
		state.selectedBrightnessRootBefore =
			await resolveParentDirectory(selectedBrightnessSelector);
		state.selectedBrightnessBefore = await verifyAcceptedParent(
			fixture.selectedBrightnessParent,
			selectedBrightnessSelector,
			state.selectedBrightnessRootBefore,
			[
				fixture.selectedBrightnessParent.terminalResult,
				...fixture.selectedBrightnessParent.controlFrames,
			],
			'CR6E selected-brightness parent',
		);
		await run.writeJsonArtifact(
			'evidence/selected-brightness-parent-before.json',
			state.selectedBrightnessBefore,
		);
		state.chromaRootBefore = await resolveParentDirectory(chromaSelector);
		state.chromaBefore = await verifyAcceptedParent(
			fixture.chromaParent,
			chromaSelector,
			state.chromaRootBefore,
			[fixture.chromaParent.terminalResult, ...fixture.chromaParent.controlFrames],
			'CR6E chroma parent',
		);
		await run.writeJsonArtifact('evidence/chroma-parent-before.json', state.chromaBefore);
		state.catalogRootBefore = await resolveParentDirectory(catalogSelector);
		state.catalogBefore = await verifyAcceptedParent(
			fixture.catalogParent,
			catalogSelector,
			state.catalogRootBefore,
			[fixture.catalogParent.roster],
			'CR6E catalog parent',
		);
		await run.writeJsonArtifact('evidence/catalog-parent-before.json', state.catalogBefore);
		state.implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', state.implementationBefore);
		state.protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', state.protectedBefore);
		const browserConfiguration = makeBrowserConfiguration(
			fixture,
			state.parentBefore,
			state.selectedBrightnessBefore,
			state.chromaBefore,
			state.catalogBefore,
			state.authoredInputs,
		);
		await run.writeJsonArtifact('browser/configuration.json', browserConfiguration);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6e-toggleable-mesopic-stellar-luminance-browser.js',
			exportName: 'runCr6eToggleableMesopicStellarLuminanceBrowser',
			servedRoots: {
				'/parent/': state.parentRootBefore,
				'/selected-brightness/': state.selectedBrightnessRootBefore,
				'/chroma/': state.chromaRootBefore,
				'/catalog/': state.catalogRootBefore,
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
		await run.writeJsonArtifact('evidence/evidence-derivations.json', analysis.evidenceDerivations);

		state.implementationAfter = await captureImplementationAfter(state.implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', state.implementationAfter);
		const implementationUnchanged = assertImplementationUnchanged(
			state.implementationBefore,
			state.implementationAfter,
		);
		state.parentRootAfter = await resolveParentDirectory(parentSelector);
		requireCondition(
			pathComparisonKey(state.parentRootBefore) === pathComparisonKey(state.parentRootAfter),
			'CR6E parent selector resolved differently after execution.',
		);
		state.parentAfter = await verifyParent(fixture, parentSelector, state.parentRootAfter);
		await run.writeJsonArtifact('evidence/parent-after.json', state.parentAfter);
		const parentUnchanged = assertParentUnchanged(state.parentBefore, state.parentAfter);
		state.selectedBrightnessRootAfter =
			await resolveParentDirectory(selectedBrightnessSelector);
		requireCondition(
			pathComparisonKey(state.selectedBrightnessRootBefore) ===
				pathComparisonKey(state.selectedBrightnessRootAfter),
			'CR6E selected-brightness selector resolved differently after execution.',
		);
		state.selectedBrightnessAfter = await verifyAcceptedParent(
			fixture.selectedBrightnessParent,
			selectedBrightnessSelector,
			state.selectedBrightnessRootAfter,
			[
				fixture.selectedBrightnessParent.terminalResult,
				...fixture.selectedBrightnessParent.controlFrames,
			],
			'CR6E selected-brightness parent',
		);
		await run.writeJsonArtifact(
			'evidence/selected-brightness-parent-after.json',
			state.selectedBrightnessAfter,
		);
		const selectedBrightnessUnchanged = assertAcceptedParentUnchanged(
			state.selectedBrightnessBefore,
			state.selectedBrightnessAfter,
			'CR6E selected-brightness parent',
		);
		state.chromaRootAfter = await resolveParentDirectory(chromaSelector);
		requireCondition(
			pathComparisonKey(state.chromaRootBefore) === pathComparisonKey(state.chromaRootAfter),
			'CR6E chroma selector resolved differently after execution.',
		);
		state.chromaAfter = await verifyAcceptedParent(
			fixture.chromaParent,
			chromaSelector,
			state.chromaRootAfter,
			[fixture.chromaParent.terminalResult, ...fixture.chromaParent.controlFrames],
			'CR6E chroma parent',
		);
		await run.writeJsonArtifact('evidence/chroma-parent-after.json', state.chromaAfter);
		const chromaUnchanged = assertAcceptedParentUnchanged(
			state.chromaBefore,
			state.chromaAfter,
			'CR6E chroma parent',
		);
		state.catalogRootAfter = await resolveParentDirectory(catalogSelector);
		requireCondition(
			pathComparisonKey(state.catalogRootBefore) === pathComparisonKey(state.catalogRootAfter),
			'CR6E catalog selector resolved differently after execution.',
		);
		state.catalogAfter = await verifyAcceptedParent(
			fixture.catalogParent,
			catalogSelector,
			state.catalogRootAfter,
			[fixture.catalogParent.roster],
			'CR6E catalog parent',
		);
		await run.writeJsonArtifact('evidence/catalog-parent-after.json', state.catalogAfter);
		const catalogUnchanged = assertAcceptedParentUnchanged(
			state.catalogBefore,
			state.catalogAfter,
			'CR6E catalog parent',
		);
		state.protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(
			state.protectedBefore.algorithm32,
			state.protectedAfter.algorithm32,
			'CR6E protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			state.protectedBefore.flat32,
			state.protectedAfter.flat32,
			'CR6E protected Flat32 source',
		);
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			immutable: {
				parent: parentUnchanged,
				selectedBrightnessParent: selectedBrightnessUnchanged,
				chromaParent: chromaUnchanged,
				catalogParent: catalogUnchanged,
				implementation: implementationUnchanged,
				protected: true,
			},
		});
		const conclusion = decision.accepted
			? 'accepted'
			: decision.integrityPassed
				? 'rejected'
				: 'failed';
		const executionStatus = decision.accepted
			? 'objective-gates-passed-owner-review-pending'
			: decision.integrityPassed
				? 'objective-gates-rejected-owner-review-not-authoritative'
				: 'integrity-failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			executionStatus,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			scientificPassed: decision.scientificPassed,
			appearanceAccepted: false,
			ownerAppearanceDecisionRequired: true,
			automaticCandidateSelection: false,
			productionClaim: false,
			claimBoundary: fixture.claimBoundary,
			replayOracle: fixture.replayOracle,
			gates: decision.gates,
			integrityGateNames: decision.integrityGateNames,
			progress,
			parent: state.parentAfter,
			selectedBrightnessParent: state.selectedBrightnessAfter,
			chromaParent: state.chromaAfter,
			catalogParent: state.catalogAfter,
			presentationOwner: analysis.presentationOwner,
			rows: analysis.rows,
			fixedMemberAnalysis: analysis.fixedMemberAnalysis,
			transitionAnalysis: analysis.transitionAnalysis,
			evidenceDerivations: analysis.evidenceDerivations,
			outputs: {
				images: analysis.uploadedImages,
				evidence: analysis.uploadedEvidence,
			},
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR6E toggleable mesopic stellar luminance`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All 32 final composites, four native cadence plates, the native 8-by-4 decision matrix, and three diagnostics were written before scientific gates. Every row retains q=24 and one-pixel occupancy.',
			'',
			'Physical and CR6D moderate controls are authenticated exact replays. Candidate rows apply only CIE-scotopic-weighted steady-state luminance before the accepted moderate chroma filter; slope-078/p9 and Color remain frozen.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) =>
				`- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'No row is selected automatically. Appearance remains an explicit owner decision.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(
			independent.verified === true && independent.conclusion === conclusion &&
				independent.artifactSetSha256 === manifest.artifactSetSha256,
			'CR6E terminal run failed independent verification.',
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
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', await failureProgress(run, error));
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: `${SCHEMA_PREFIX}-failure-v1`,
				failedAt: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack ?? null : null,
			});
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: `${SCHEMA_PREFIX}-failure-result-v1`, accepted: false},
				report: `# ${run.runId}: CR6E toggleable mesopic stellar luminance\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
