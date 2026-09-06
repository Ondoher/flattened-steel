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
	'node experiments/extraterrestrial/color-reset/runners/run-cr6c-one-pixel-brightness-calibration-narrowed.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/fixtures/cr6c-one-pixel-brightness-calibration-v2.json';
const HARNESS_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/harness/cr6c-one-pixel-brightness-calibration-browser-v2.js';
const SCALE_OWNER_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/stellar/Cr6cOnePixelBrightnessCalibrationV2.js';
const FROZEN_COLOR_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/color/Cr4gSlopeLimitedPreToneExposureColorDisplayModel.js';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const SCALE_OWNER_PATH = path.join(REPOSITORY_ROOT, ...SCALE_OWNER_RELATIVE_PATH.split('/'));
const FROZEN_COLOR_PATH = path.join(REPOSITORY_ROOT, ...FROZEN_COLOR_RELATIVE_PATH.split('/'));
const RUNNER_PATH = path.join(REPOSITORY_ROOT, ...RUNNER_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr6c-one-pixel-brightness-calibration';
const FIXTURE_SHA256 = '443c0aff9c22990c136814c8021f1538fafe1ca5bef403823113cd5597792e4b';
const HARNESS_SHA256 = '1adfbed3e9152c44565e1b83f16c0a41a7166a17bc691144bba5f56eeda37346';
const SCALE_OWNER_SHA256 = '63c2fca3ccc9887a398e803b1ca260e9be07d154a4f90738519d0ab084fa447d';
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
const EXPECTED_ROW_IDS = Object.freeze(['q1-control', 'q24-narrowed', 'q32-upper']);
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const BROWSER_TIMEOUT_MILLISECONDS = 600_000;

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
		fixture.schemaId === `${SCHEMA_PREFIX}-input-v2`,
		'CR6C fixture schema changed.',
	);
	requireCondition(
		fixture.experiment?.increment === 'CR6C' &&
			fixture.experiment.slug === 'cr6c-one-pixel-brightness-calibration-narrowed',
		'CR6C experiment identity changed.',
	);
	requireCondition(
		fixture.claimBoundary?.presentationBrightnessEvidenceOnly === true &&
			fixture.claimBoundary.sourceIrradianceFrozen === true &&
			fixture.claimBoundary.sourceSpectralRatiosFrozen === true &&
			fixture.claimBoundary.atmosphericTransportFrozen === true &&
			fixture.claimBoundary.e8ProjectionFrozen === true &&
			fixture.claimBoundary.geometryAndMasksFrozen === true &&
			fixture.claimBoundary.collisionGroupsFrozen === true &&
			fixture.claimBoundary.skyLinearRgbFrozen === true &&
			fixture.claimBoundary.skyColorControlFrozen === true &&
			fixture.claimBoundary.onePixelOccupancyFrozen === true &&
			fixture.claimBoundary.stellarVisibilityFrozenAtOne === true &&
			fixture.claimBoundary.noThreshold === true &&
			fixture.claimBoundary.noTimeOrSolarAngleBranch === true &&
			fixture.claimBoundary.noAutomaticSelection === true &&
			fixture.claimBoundary.atmosphereMayChangeOnlyInSeparateIncrement === true &&
			fixture.claimBoundary.productionClaim === false,
		'CR6C claim boundary changed.',
	);
	requireCondition(
		fixture.parent.namespace === 'color-reset' &&
			fixture.parent.runId === EXPECTED_PARENT.runId &&
			fixture.parent.conclusion === EXPECTED_PARENT.conclusion &&
			fixture.parent.independentlyVerified === true &&
			fixture.parent.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256 &&
			fixture.parent.manifest.byteLength === EXPECTED_PARENT.manifestByteLength &&
			fixture.parent.manifest.sha256 === EXPECTED_PARENT.manifestSha256,
		'CR6C parent identity changed.',
	);
	requireCondition(
		fixture.replayOracle?.parentFinalCompositeAuthorship.includes('CPU-authored') &&
			typeof fixture.replayOracle.cpuQ1Control === 'string' &&
			typeof fixture.replayOracle.gpuQ1Parity === 'string',
		'CR6C replay-oracle boundary changed.',
	);
	requireCondition(
		fixture.rejectedGpuControl.namespace === 'color-reset' &&
			fixture.rejectedGpuControl.runId === EXPECTED_REJECTED_GPU_CONTROL.runId &&
			fixture.rejectedGpuControl.conclusion === EXPECTED_REJECTED_GPU_CONTROL.conclusion &&
			fixture.rejectedGpuControl.independentlyVerified === true &&
			fixture.rejectedGpuControl.artifactSetSha256 ===
				EXPECTED_REJECTED_GPU_CONTROL.artifactSetSha256 &&
			fixture.rejectedGpuControl.soleFailedGate ===
				EXPECTED_REJECTED_GPU_CONTROL.soleFailedGate &&
			fixture.rejectedGpuControl.manifest.byteLength ===
				EXPECTED_REJECTED_GPU_CONTROL.manifestByteLength &&
			fixture.rejectedGpuControl.manifest.sha256 ===
				EXPECTED_REJECTED_GPU_CONTROL.manifestSha256 &&
			fixture.rejectedGpuControl.terminalResult.byteLength ===
				EXPECTED_REJECTED_GPU_CONTROL.resultByteLength &&
			fixture.rejectedGpuControl.terminalResult.sha256 ===
				EXPECTED_REJECTED_GPU_CONTROL.resultSha256,
		'CR6C rejected GPU control identity changed.',
	);
	requireCondition(
		exactJson(fixture.scenes.map(({id}) => id), EXPECTED_SCENE_IDS) &&
			exactJson(fixture.rows.map(({id}) => id), EXPECTED_ROW_IDS) &&
			exactJson(fixture.rows.map(({multiplier}) => multiplier), [1, 24, 32]),
		'CR6C row or scene order changed.',
	);
	requireCondition(
		fixture.presentation.identity === 'stellar-one-pixel-brightness-calibration-v2' &&
			fixture.presentation.scaleOwner.id === 'stellar-one-pixel-brightness-calibration-v2' &&
			fixture.presentation.scaleOwner.path === SCALE_OWNER_RELATIVE_PATH &&
			fixture.presentation.baseIrradianceToBoundaryRadianceScale === 60999.839486002405 &&
			fixture.presentation.operation ===
				'finalLinearRgb_q(p) = skyLinearRgb_000044(p) + q * gpuTransportedStarLinearRgb_000044(p)' &&
			fixture.presentation.sourceIrradianceAltered === false &&
			fixture.presentation.transportAltered === false,
		'CR6C presentation equation or owner changed.',
	);
	requireCondition(
		fixture.rows.every((row) =>
			row.effectiveBoundaryScale === fixture.presentation.baseIrradianceToBoundaryRadianceScale * row.multiplier),
		'CR6C effective boundary scale changed.',
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
		'CR6C frozen Color changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 && fixture.viewport.heightPixels === 400 &&
			fixture.viewport.pixelCount === 256000,
		'CR6C viewport changed.',
	);
	const selected = parentArtifacts(fixture);
	requireCondition(
		selected.every((artifact) =>
			isArtifactPath(artifact.path) && isSha256(artifact.sha256) &&
			Number.isInteger(artifact.byteLength) && artifact.byteLength > 0 &&
			typeof artifact.schemaId === 'string'),
		'CR6C parent artifact declaration is incomplete.',
	);
	const rejectedSelected = rejectedGpuControlArtifacts(fixture);
	requireCondition(
		fixture.rejectedGpuControl.fullFrames.length === 24 &&
			rejectedSelected.every((artifact) =>
				isArtifactPath(artifact.path) && isSha256(artifact.sha256) &&
				Number.isInteger(artifact.byteLength) && artifact.byteLength > 0),
		'CR6C rejected GPU control artifact declaration is incomplete.',
	);
	requireCondition(
		fixture.outputs.requestedImageUploadOrder.length === fixture.gates.requestedImageCount &&
			fixture.gates.requestedImageCount === 30 &&
			fixture.outputs.requestedImageUploadOrder.every(isArtifactPath) &&
			browserEvidencePaths(fixture).every(isArtifactPath),
		'CR6C output contract changed.',
	);
	requireCondition(
		fixture.derivationContract.preserveAllRowsRegardlessOfResult === true &&
			fixture.gates.cpuQ1ParentMaximumRgbCode === 0 &&
			fixture.gates.gpuQ1CpuMaximumRgbCode === 1 &&
			fixture.gates.gpuQ1ParentMaximumRgbCode === 1 &&
			fixture.gates.gpuCpuMaximumRgbCode === 1 &&
			fixture.gates.nonoccupiedRgbMustMatchQ1Exactly === true &&
			fixture.gates.twilightAnchorCandidateMinimumRgbCode === 2 &&
			fixture.gates.topBrightnessQuartileMedianDeltaYStrictlyAboveBottom === true &&
			fixture.gates.transitionInheritedGeometryMustRemainExact === true &&
			fixture.gates.transitionProjectedPixelsMustRemainExact === true &&
			fixture.gates.transitionRobustMembershipMustRemainExact === true &&
			fixture.gates.transitionMaximumPerMemberDeltaDifferenceCodes === 1 &&
			fixture.gates.allImagesBeforeScientificGates === true &&
			fixture.gates.requiredAngleBackend === 'D3D11',
		'CR6C gate or derivation contract changed.',
	);
	requireCondition(
		exactJson(fixture.metrics.brightnessOrdering, {
			memberDomain: 'parent candidate-independent fixed cohort',
			rankingField: 'parent preDisplayBrightnessRanking brightnessQuartile',
			topQuartile: 0,
			bottomQuartile: 3,
			sceneId: 'sunset-plus-120-minutes',
			statistic: 'median deltaEncodedLuminanceCodes',
			requiredRelationship: 'top strictly greater than bottom',
		}) && fixture.metrics.fixedMemberDarkSceneId === fixture.metrics.brightnessOrdering.sceneId,
		'CR6C fixed-cohort brightness-ordering definition changed.',
	);
	const below = fixture.scenes.find(({id}) => id === fixture.metrics.transition.belowSceneId);
	const above = fixture.scenes.find(({id}) => id === fixture.metrics.transition.aboveSceneId);
	requireCondition(
		Date.parse(above.timeIso) - Date.parse(below.timeIso) === 1 &&
			fixture.metrics.transition.maximumPerMemberDeltaDifferenceCodes ===
				fixture.gates.transitionMaximumPerMemberDeltaDifferenceCodes,
		'CR6C transition contract changed.',
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
	const canonical = await verifyOrdinaryCanonicalDirectory(resolved, 'CR6C parent run');
	assertLexicallyContained(runsRoot, canonical, 'CR6C parent run');
	await assertNoReparseEntries(canonical, 'CR6C parent run');
	return canonical;
}

async function verifyParent(fixture, selector, root) {
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.runId === EXPECTED_PARENT.runId &&
			terminal.conclusion === EXPECTED_PARENT.conclusion &&
			terminal.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256,
		'CR6C parent terminal identity changed.',
	);
	const manifestPath = path.join(root, fixture.parent.manifest.path);
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === fixture.parent.manifest.byteLength &&
			manifestSha256 === fixture.parent.manifest.sha256,
		'CR6C parent manifest file identity changed.',
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === EXPECTED_PARENT.runId &&
			manifest.conclusion === EXPECTED_PARENT.conclusion &&
			manifest.artifactSetSha256 === EXPECTED_PARENT.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		'CR6C parent manifest terminal facts changed.',
	);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = parentArtifacts(fixture);
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR6C parent manifest changed ${artifact.path}.`,
		);
		const target = path.join(root, ...artifact.path.split('/'));
		assertLexicallyContained(root, target, `CR6C parent ${artifact.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(target)) === artifact.sha256,
			`CR6C parent artifact changed ${artifact.path}.`,
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
		'CR6C parent rejection boundary changed.',
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

async function verifyRejectedGpuControl(fixture, selector, root) {
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true &&
			terminal.runId === EXPECTED_REJECTED_GPU_CONTROL.runId &&
			terminal.conclusion === EXPECTED_REJECTED_GPU_CONTROL.conclusion &&
			terminal.artifactSetSha256 === EXPECTED_REJECTED_GPU_CONTROL.artifactSetSha256,
		'CR6C rejected GPU control terminal identity changed.',
	);
	const declaration = fixture.rejectedGpuControl;
	const manifestPath = path.join(root, declaration.manifest.path);
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
			manifestFacts.size === declaration.manifest.byteLength &&
			manifestSha256 === declaration.manifest.sha256,
		'CR6C rejected GPU control manifest file identity changed.',
	);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === EXPECTED_REJECTED_GPU_CONTROL.runId &&
			manifest.conclusion === EXPECTED_REJECTED_GPU_CONTROL.conclusion &&
			manifest.artifactSetSha256 === EXPECTED_REJECTED_GPU_CONTROL.artifactSetSha256 &&
			Array.isArray(manifest.artifacts),
		'CR6C rejected GPU control manifest terminal facts changed.',
	);
	const selected = rejectedGpuControlArtifacts(fixture);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR6C rejected GPU control manifest changed ${artifact.path}.`,
		);
		const target = path.join(root, ...artifact.path.split('/'));
		assertLexicallyContained(root, target, `CR6C rejected GPU control ${artifact.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength &&
				(await sha256File(target)) === artifact.sha256,
			`CR6C rejected GPU control artifact changed ${artifact.path}.`,
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
		'CR6C rejected GPU control failure boundary changed.',
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
		'CR6C parent terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR6C selected parent artifacts',
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
		'CR6C rejected GPU control terminal identity changed during execution.',
	);
	assertFileInventoriesEqual(
		before.selectedArtifactInventory,
		after.selectedArtifactInventory,
		'CR6C rejected GPU control selected artifacts',
	);
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, scaleOwnerSha256, frozenColorSha256, runnerSha256] =
		await Promise.all([
			sha256File(FIXTURE_PATH),
			sha256File(HARNESS_PATH),
			sha256File(SCALE_OWNER_PATH),
			sha256File(FROZEN_COLOR_PATH),
			sha256File(RUNNER_PATH),
		]);
	requireCondition(
		fixtureSha256 === FIXTURE_SHA256 && harnessSha256 === HARNESS_SHA256 &&
			scaleOwnerSha256 === SCALE_OWNER_SHA256 && frozenColorSha256 === FROZEN_COLOR_SHA256,
		'CR6C pinned fixture, browser harness, scale owner, or frozen Color changed.',
	);
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v2`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		scaleOwner: {
			path: SCALE_OWNER_RELATIVE_PATH,
			sha256: scaleOwnerSha256,
			id: 'stellar-one-pixel-brightness-calibration-v2',
		},
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
			'color-reset/runners/run-cr6c-one-pixel-brightness-calibration-narrowed.js',
			'color-reset/harness/cr6c-one-pixel-brightness-calibration-browser-v2.js',
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
		'CR6C runtime implementation',
	);
	requireCondition(
		before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR6C package boundary changed during execution.',
	);
	return true;
}

function makeBrowserConfiguration(fixture, parent, rejectedGpuControl, authoredInputs) {
	return {
		...fixture,
		browserParent: {
			prefix: '/parent/',
			runId: parent.runId,
			conclusion: parent.conclusion,
			artifactSetSha256: parent.artifactSetSha256,
			manifest: parent.manifest,
		},
		browserRejectedGpuControl: {
			prefix: '/rejected-gpu-control/',
			runId: rejectedGpuControl.runId,
			conclusion: rejectedGpuControl.conclusion,
			artifactSetSha256: rejectedGpuControl.artifactSetSha256,
			manifest: rejectedGpuControl.manifest,
		},
		implementation: {
			runner: authoredInputs.runner,
			harness: authoredInputs.harness,
			scaleOwner: authoredInputs.scaleOwner,
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
			`CR6C browser/server identity differs for ${artifact.artifactPath}.`,
		);
	}
	requireCondition(
		exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), allowedBrowserArtifacts(fixture)),
		'CR6C browser upload order changed.',
	);
}

function evaluateGates({analysis, browser, fixture, progress, immutable}) {
	const byRow = new Map(analysis.rows.map((row) => [row.rowId, row]));
	const control = byRow.get('q1-control');
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
		analysis.imageDerivations.length === 30 &&
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
	const fixedRows = analysis.fixedMemberAnalysis.rows;
	const transitionRows = analysis.transitionAnalysis.rows;
	const gates = {
		browserSchema:
			analysis.schemaId === `${SCHEMA_PREFIX}-browser-result-v2` &&
			analysis.fixedMemberAnalysis.schemaId ===
				'algorithm32-color-reset-cr6c-fixed-member-analysis-v1' &&
			analysis.transitionAnalysis.schemaId ===
				'algorithm32-color-reset-cr6c-transition-analysis-v1',
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
			analysis.requestedImageCount === 30 && analysis.uploadedImageCount === 30 &&
			exactJson(analysis.imageUploadOrder, fixture.outputs.requestedImageUploadOrder) &&
			exactJson(
				browser.uploads.slice(0, 30).map(({path: artifactPath}) => artifactPath),
				fixture.outputs.requestedImageUploadOrder,
			),
		rowSceneAndEquationExact:
			rowAndSceneExact &&
			analysis.presentationOwner.id === fixture.presentation.scaleOwner.id &&
			exactJson(analysis.presentationOwner.multipliers, [1, 24, 32]) &&
			analysis.presentationOwner.equation === fixture.presentation.operation &&
			analysis.rows.every((row, index) =>
				row.multiplier === fixture.rows[index].multiplier &&
				row.effectiveBoundaryScale === fixture.rows[index].effectiveBoundaryScale),
		parentAuthenticatedAndImmutable: immutable.parent,
		rejectedGpuControlAuthenticatedAndImmutable: immutable.rejectedGpuControl,
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
		cpuQ1ExactCpuAuthoredParentReplay:
			control.scenes.every((scene) =>
				scene.cpuQ1ParentComparison.maximumRgbCodeDifference ===
					fixture.gates.cpuQ1ParentMaximumRgbCode &&
					scene.cpuQ1ParentComparison.differingChannelCount === 0),
		gpuQ1WithinOneCodeOfCpuAndParent:
			control.scenes.every((scene) =>
				scene.gpuQ1CpuComparison.maximumRgbCodeDifference <=
					fixture.gates.gpuQ1CpuMaximumRgbCode &&
				scene.gpuQ1ParentComparison.maximumRgbCodeDifference <=
					fixture.gates.gpuQ1ParentMaximumRgbCode),
		gpuCpuWithinOneCode:
			allScenes.every((scene) =>
				scene.gpuCpuComparison.maximumRgbCodeDifference <= fixture.gates.gpuCpuMaximumRgbCode),
		nonoccupiedPixelsExactQ1:
			fixture.gates.nonoccupiedRgbMustMatchQ1Exactly === true &&
			allScenes.every((scene) =>
				scene.nonoccupiedQ1Comparison.differingRgbChannelCount === 0 &&
				scene.nonoccupiedQ1Comparison.maximumRgbCodeDifference === 0),
		earlyCadenceHasNoRobustStars:
			allScenes.filter(({sceneId}) => earlyIds.has(sceneId))
				.every(({robustPixelCount}) => robustPixelCount === fixture.gates.earlyRobustCount),
		candidateBrightStarOnsetAtPlus30:
			analysis.rows.slice(1).every((row) => {
				const scene = row.scenes.find(
					({sceneId}) => sceneId === fixture.metrics.twilightAnchor.sceneId,
				);
				const anchor = scene.representatives.find(
					({memberId}) => memberId === fixture.metrics.twilightAnchor.memberId,
				);
				return anchor?.maximumAbsoluteDeltaRgbCode >=
					fixture.gates.twilightAnchorCandidateMinimumRgbCode && anchor.robust === true;
			}),
		progressiveSampledOnset:
			analysis.rows.slice(1).every((row) => {
				const onset = row.scenes.find(({sceneId}) => sceneId === onsetSceneId);
				const later = row.scenes.find(({sceneId}) => sceneId === laterSceneId);
				return onset.robustPixelCount > 0 &&
					onset.robustPixelCount < onset.occupiedPixelCount &&
					later.robustPixelCount >= onset.robustPixelCount;
			}),
		darkHasNoSaturationOrWhiteCollapse:
			allScenes.filter(({sceneId}) => darkIds.has(sceneId)).every((scene) =>
				scene.saturatedStellarPixelCount === 0 && scene.exactWhiteStellarPixelCount === 0),
		darkBrightnessOrdering:
			fixture.gates.topBrightnessQuartileMedianDeltaYStrictlyAboveBottom === true &&
			exactJson(
				analysis.fixedMemberAnalysis.brightnessOrdering,
				fixture.metrics.brightnessOrdering,
			) &&
			fixedRows.every((row) =>
				row.topBrightnessQuartileMedianDeltaY8 > row.bottomBrightnessQuartileMedianDeltaY8),
		robustVisibleColorRelationship:
			fixedRows.every((row) =>
				row.robustMemberCount >= fixture.metrics.colorRelationship.minimumMemberCount &&
				Number.isFinite(row.robustColorAxisPearsonCorrelation) &&
				row.robustColorAxisPearsonCorrelation > 0),
		transitionGeometryAndDisplayContinuity:
			fixture.gates.transitionInheritedGeometryMustRemainExact === true &&
			fixture.gates.transitionProjectedPixelsMustRemainExact === true &&
			fixture.gates.transitionRobustMembershipMustRemainExact === true &&
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
		'rejectedGpuControlAuthenticatedAndImmutable',
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
	const [parentSelector, rejectedGpuControlSelector, ...extraArguments] = process.argv.slice(2);
	if (!parentSelector || !rejectedGpuControlSelector || extraArguments.length !== 0) {
		throw new Error(
			`${COMMAND_PREFIX} <explicit-CR6-parent-run> <explicit-historical-CR6A-GPU-control-run>`,
		);
	}
	const fixture = await readJson(FIXTURE_PATH);
	verifyFixtureContract(fixture);
	const command =
		`${COMMAND_PREFIX} ${JSON.stringify(parentSelector)} ${JSON.stringify(rejectedGpuControlSelector)}`;
	const run = await initializeColorResetRunRecord({
		slug: 'cr6c-one-pixel-brightness-calibration-narrowed',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v2`,
			increment: 'CR6C reference-anchored one-pixel stellar brightness calibration',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelector: parentSelector,
			parent: fixture.parent,
			explicitRejectedGpuControlSelector: rejectedGpuControlSelector,
			rejectedGpuControl: fixture.rejectedGpuControl,
			replayOracle: fixture.replayOracle,
			rows: fixture.rows,
			scenes: fixture.scenes,
			presentation: fixture.presentation,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			outputArtifacts: [...allowedBrowserArtifacts(fixture), fixture.outputs.evidence.analysis],
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v2`,
			operation:
				'Authenticate immutable CR6 run 000044 and historical CR6A GPU evidence; reconstruct each sparse transported stellar RGB field from canonical actual representatives and authoritative GPU projection; compose unchanged exact parent sky plus q times stellar RGB for q=1,24,32 on RGBA32F WebGL2; independently replay on CPU; retain exact q=1 parent/parity controls; require sunset and plus-10 to remain star-free; require the eligible V=0.08 anchor to cross the renderer-confidence boundary by plus 30 in both candidate rows; and write all 30 images before scientific gates.',
			implementation: [
				RUNNER_RELATIVE_PATH,
				HARNESS_RELATIVE_PATH,
				SCALE_OWNER_RELATIVE_PATH,
				FROZEN_COLOR_RELATIVE_PATH,
				FIXTURE_RELATIVE_PATH,
			],
			parent: fixture.parent,
			rejectedGpuControl: fixture.rejectedGpuControl,
			replayOracle: fixture.replayOracle,
			rows: fixture.rows,
			compositionEquation: fixture.presentation.operation,
			frozenSkyDisplay: fixture.frozenSkyDisplay,
			exclusions: [
				'no source irradiance, spectrum, catalog, collision, geometry, mask, transport, E8 projection, sky, Color, one-pixel occupancy, or visibility-factor change',
				'no time, scene, solar-zenith, cache-state, pixel, channel, background, magnitude, star-count, camera, viewport, or framebuffer input to q',
				'no automatic row selection',
				'no production change',
			],
		},
		environment: {
			schemaId: `${SCHEMA_PREFIX}-environment-v2`,
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			browserTimeoutMilliseconds: BROWSER_TIMEOUT_MILLISECONDS,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		references: {
			schemaId: `${SCHEMA_PREFIX}-references-v2`,
			parent: 'tmp/extraterrestrial/color-reset/runs/000044-cr6-stellar-contrast-onset',
			rejectedGpuControl:
				'tmp/extraterrestrial/color-reset/runs/000045-cr6a-stellar-presentation-scale-bracket',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#cr6c-one-pixel-brightness-calibration-boundary',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr6c---calibrate-one-pixel-stellar-brightness',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	const state = {};
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR6C implementation');
		state.authoredInputs = await verifyAuthoredInputs();
		await run.writeJsonArtifact('evidence/authored-input-identities.json', state.authoredInputs);
		state.parentRootBefore = await resolveParentDirectory(parentSelector);
		state.parentBefore = await verifyParent(fixture, parentSelector, state.parentRootBefore);
		await run.writeJsonArtifact('evidence/parent-before.json', state.parentBefore);
		state.rejectedGpuControlRootBefore =
			await resolveParentDirectory(rejectedGpuControlSelector);
		state.rejectedGpuControlBefore = await verifyRejectedGpuControl(
			fixture,
			rejectedGpuControlSelector,
			state.rejectedGpuControlRootBefore,
		);
		await run.writeJsonArtifact(
			'evidence/rejected-gpu-control-before.json',
			state.rejectedGpuControlBefore,
		);
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
			state.rejectedGpuControlBefore,
			state.authoredInputs,
		);
		await run.writeJsonArtifact('browser/configuration.json', browserConfiguration);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6c-one-pixel-brightness-calibration-browser-v2.js',
			exportName: 'runCr6cOnePixelBrightnessCalibrationBrowser',
			servedRoots: {
				'/parent/': state.parentRootBefore,
				'/rejected-gpu-control/': state.rejectedGpuControlRootBefore,
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
			'CR6C parent selector resolved differently after execution.',
		);
		state.parentAfter = await verifyParent(fixture, parentSelector, state.parentRootAfter);
		await run.writeJsonArtifact('evidence/parent-after.json', state.parentAfter);
		const parentUnchanged = assertParentUnchanged(state.parentBefore, state.parentAfter);
		state.rejectedGpuControlRootAfter =
			await resolveParentDirectory(rejectedGpuControlSelector);
		requireCondition(
			pathComparisonKey(state.rejectedGpuControlRootBefore) ===
				pathComparisonKey(state.rejectedGpuControlRootAfter),
			'CR6C rejected GPU control selector resolved differently after execution.',
		);
		state.rejectedGpuControlAfter = await verifyRejectedGpuControl(
			fixture,
			rejectedGpuControlSelector,
			state.rejectedGpuControlRootAfter,
		);
		await run.writeJsonArtifact(
			'evidence/rejected-gpu-control-after.json',
			state.rejectedGpuControlAfter,
		);
		const rejectedGpuControlUnchanged = assertRejectedGpuControlUnchanged(
			state.rejectedGpuControlBefore,
			state.rejectedGpuControlAfter,
		);
		state.protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(
			state.protectedBefore.algorithm32,
			state.protectedAfter.algorithm32,
			'CR6C protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			state.protectedBefore.flat32,
			state.protectedAfter.flat32,
			'CR6C protected Flat32 source',
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
				rejectedGpuControl: rejectedGpuControlUnchanged,
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
			schemaId: `${SCHEMA_PREFIX}-proof-v2`,
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
			rejectedGpuControl: state.rejectedGpuControlAfter,
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
			`# ${run.runId}: CR6C one-pixel stellar brightness calibration`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All 24 final composites, three native cadence plates, the native 8-by-3 decision matrix, and both diagnostics were written before scientific gates. The only candidate parameter is the fixed scene/camera/channel-independent one-pixel brightness multiplier q in {1,24,32}.',
			'',
			'Run 000044 parent PNGs are CPU-authored. CPU q=1 exact-parent reproduction and GPU q=1 one-code parity are evaluated separately. Candidate rows change only the global one-pixel brightness calibration; the accepted slope-078/p9 atmosphere remains frozen.',
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
			'CR6C terminal run failed independent verification.',
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
				schemaId: `${SCHEMA_PREFIX}-failure-v2`,
				failedAt: new Date().toISOString(),
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack ?? null : null,
			});
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: `${SCHEMA_PREFIX}-failure-result-v2`, accepted: false},
				report: `# ${run.runId}: CR6C one-pixel stellar brightness calibration\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
