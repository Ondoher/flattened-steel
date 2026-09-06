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
	'node experiments/extraterrestrial/color-reset/runners/run-cr4k-minimal-deep-twilight-lift.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/fixtures/cr4k-minimal-deep-twilight-lift-v1.json';
const HARNESS_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/harness/cr4k-minimal-deep-twilight-lift-browser.js';
const MODEL_RELATIVE_PATH =
	'experiments/extraterrestrial/color-reset/color/Cr4iAnchorPreservingShoulderColorDisplayModel.js';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4k-minimal-deep-twilight-lift';
const UPLOAD_LIMIT_BYTES = 128 * 1024 * 1024;

// These authored pins are filled only after the fixture, model, and browser
// harness have passed static checks. The runner itself is captured by the
// immutable implementation closure and therefore does not self-pin.
const FIXTURE_SHA256 = 'e96c340f1be4d56f48142416fe1acafc14922520559451b1c6e61a744d4ae754';
const HARNESS_SHA256 = '11bc5ffba75299e8194700d2b3935ab2ac32d2da3bc25fe96dbf150a9d195084';
const MODEL_SHA256 = '7ccc67dddc741d1871eb8f9fde7e418fdf0f13e5419ad0bd5b576e99c153b896';

const EXPECTED_PARENT_RUNS = Object.freeze({
	cr1: Object.freeze({
		runId: '000005-six-scene-visual-baseline',
		artifactSetSha256: '2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc',
		manifestSha256: '3ba1199191f6b9dd825b0475c7d329a4b0be84e441db655d354bdce234f6949b',
	}),
	cr2: Object.freeze({
		runId: '000007-available-light-inventory',
		artifactSetSha256: 'dcd6cdd8146094d05427ad180af7fccefdbaa67e290d1b5f21e6a0d4b03697ba',
		manifestSha256: 'f0790db92f9e39d1bc2c735572928d34b5698b0123524a56845b571d4f27b226',
	}),
	cr4h: Object.freeze({
		runId: '000034-cr4h-low-sun-cadence-acquisition',
		artifactSetSha256: '92b779126f25e6b0b0bfa43e1efaf6ec684b5776bd708f187959ef977907155f',
		manifestSha256: 'a6de83a6a54928542389a2aa5ebdf4bbf5e31270cb24b92649cfce2c76888d13',
	}),
	cr4f: Object.freeze({
		runId: '000032-cr4f-fine-twilight-cadence',
		artifactSetSha256: '60e01c9cd2b26579f5c83cc0904f29b920493000a497019c5f2b0f6b2cf21042',
		manifestSha256: '97b42405a154405eab3603ea56e91d493249ce9304e999d2d06abbce5a01260e',
	}),
	cr4i: Object.freeze({
		runId: '000035-cr4i-smooth-bruneton-shoulder-check',
		conclusion: 'rejected',
		artifactSetSha256: 'd5d7273e8200bd15070db6bf17d2acefe65908c2762d6e2cff12ca1d859aea38',
		manifestSha256: 'e908b5f0290c09c8ad55c0b5bdf9731a0e258e496ea158553c505a4f7cb8d052',
	}),
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

function isSha256(value) {
	return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
}

function isArtifactPath(value) {
	return typeof value === 'string' && value.length > 0 &&
		value === value.replaceAll('\\', '/') && !path.posix.isAbsolute(value) &&
		!value.split('/').includes('..');
}

function responseIds(fixture) {
	return fixture.response.rows.map(({id}) => id);
}

function outputImages(fixture) {
	return [...fixture.outputs.requestedImageUploadOrder];
}

function parentArtifacts(fixture, parentId) {
	const artifacts = [fixture.parents[parentId].analysis];
	if (parentId === 'cr4i') artifacts.push(...fixture.scenes.map(({controlPng}) => controlPng));
	for (const scene of fixture.scenes) {
		if (scene.parentId === parentId) artifacts.push(scene.field, scene.mask);
	}
	return [...new Map(artifacts.map((artifact) => [artifact.path, artifact])).values()];
}

function verifyFixtureContract(fixture) {
	requireCondition(fixture.schemaId === SCHEMA_PREFIX + '-input-v1', 'CR4K fixture schema changed.');
	requireCondition(!JSON.stringify(fixture).includes('PENDING_'), 'CR4K fixture contains unresolved pins.');
	requireCondition(
		fixture.claimBoundary?.fieldReplayOnly === true &&
		fixture.claimBoundary.physicalTransportExecution === false &&
		fixture.claimBoundary.cacheExecution === false &&
		fixture.claimBoundary.appearanceAcceptanceGate === false &&
		fixture.claimBoundary.appearanceAccepted === false &&
		fixture.claimBoundary.automaticCandidateSelection === false &&
		fixture.claimBoundary.perSceneColorTuning === false &&
		fixture.claimBoundary.chromaticCorrection === false &&
		fixture.claimBoundary.suppliedPhotographsRuntimeInput === false &&
		fixture.claimBoundary.suppliedPhotographsQuantitativeOracle === false &&
		fixture.claimBoundary.productionClaim === false,
		'CR4K claim boundary changed.',
	);
	for (const parentId of ['cr1', 'cr2', 'cr4h', 'cr4f', 'cr4i']) {
		const parent = fixture.parents[parentId];
		const expected = EXPECTED_PARENT_RUNS[parentId];
		const expectedConclusion = expected.conclusion ?? 'accepted';
		requireCondition(
			parent.namespace === 'color-reset' && parent.runId === expected.runId &&
			parent.conclusion === expectedConclusion && parent.artifactSetSha256 === expected.artifactSetSha256 &&
			parent.manifest.path === 'artifact-manifest.json' && parent.manifest.sha256 === expected.manifestSha256 &&
			Number.isSafeInteger(parent.manifest.byteLength) && parent.manifest.byteLength > 0,
			'CR4K ' + parentId + ' parent identity changed.',
		);
		for (const artifact of parentArtifacts(fixture, parentId)) {
			requireCondition(
				isArtifactPath(artifact.path) && Number.isSafeInteger(artifact.byteLength) &&
				artifact.byteLength > 0 && isSha256(artifact.sha256),
				'CR4K ' + parentId + ' artifact declaration is invalid.',
			);
		}
	}
	requireCondition(fixture.viewport.widthPixels === 640 && fixture.viewport.heightPixels === 400, 'CR4K viewport changed.');
	requireCondition(fixture.scenes.length === 12, 'CR4K requires twelve scenes.');
	requireCondition(exactJson(fixture.scenes.map(({id}) => id), fixture.presentation.sceneOrder), 'CR4K scene order changed.');
	requireCondition(fixture.response.rows.length === 3, 'CR4K requires three response rows.');
	requireCondition(exactJson(responseIds(fixture), ['slope-078-p9-control', 'deep-lift-015', 'deep-lift-030']), 'CR4K response order changed.');
	requireCondition(exactJson(responseIds(fixture), fixture.presentation.responseOrder), 'CR4K presentation response order changed.');
	for (const row of fixture.response.rows) {
		requireCondition(
			row.kind === 'smooth-response' && row.sunsetAmplitude === 3.5 &&
			row.sunsetTransitionIlluminanceLux === 980 && row.sunsetRolloffPower === 9 &&
			row.adaptationFloorIlluminanceLux === 0.02 && row.adaptationSoftnessLogUnits === 0.1 &&
			row.adaptationExponent === 0.78 && row.adaptationPivotIlluminanceLux > 0,
			'CR4K response constants changed for ' + row.id + '.',
		);
	}
	requireCondition(
		fixture.response.rows[0].adaptationPivotIlluminanceLux === 385 &&
		fixture.response.rows[1].adaptationPivotIlluminanceLux === 439.8971145541154 &&
		fixture.response.rows[2].adaptationPivotIlluminanceLux === 502.62200361827666,
		'CR4K pivot bracket changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			['cr1', 'cr4h', 'cr4f'].includes(scene.parentId) &&
			scene.sourcePrefix === '/' + scene.parentId + '/' &&
			['cr2', 'cr4h', 'cr4f'].includes(scene.receiverLightParentId) &&
			(scene.parentId === 'cr1' ? scene.receiverLightParentId === 'cr2' : scene.receiverLightParentId === scene.parentId) &&
			Number.isFinite(scene.solarElevationDegrees) && Number.isFinite(scene.solarZenithDegrees) &&
			Number.isFinite(scene.totalHorizontalIlluminance.value) &&
			scene.totalHorizontalIlluminance.value >= 0 && scene.totalHorizontalIlluminance.units === 'lux' &&
			scene.field.byteLength === 4_096_000 && scene.mask.byteLength === 256_000 &&
			scene.controlPng.path.startsWith('captures/cr4i-slope-078-p9-control-') &&
			scene.controlPng.path.endsWith('.png'),
			'CR4K scene contract changed for ' + scene.id + '.',
		);
	}
	const expectedImages = [
		...responseIds(fixture).flatMap((id) => fixture.outputs.frames[id]),
		...responseIds(fixture).map((id) => fixture.outputs.cadences[id]),
		fixture.outputs.twilightComparison,
		fixture.outputs.amplifiedDifferences,
		fixture.outputs.clippingMasks,
		fixture.outputs.diagnostic,
	];
	requireCondition(
		expectedImages.length === 43 && new Set(expectedImages).size === 43 &&
		expectedImages.every(isArtifactPath) && exactJson(expectedImages, outputImages(fixture)),
		'CR4K requires exactly 43 unique frame-first images.',
	);
	requireCondition(
		exactJson(fixture.diagnostics.strictRegionalCadenceSceneIds, fixture.presentation.twilightComparisonSceneIds) &&
		exactJson(fixture.diagnostics.strictRegionalCadenceSceneIds, ['sunset', 'sunset-plus-10-minutes', 'sunset-plus-20-minutes', 'sunset-plus-30-minutes', 'sunset-plus-45-minutes', 'sunset-plus-60-minutes']) &&
		fixture.diagnostics.candidatePreSunset.lastOffsetMinutes === 0,
		'CR4K qualification cadence changed.',
	);
	requireCondition(
		fixture.qualitativeReferences.ownerSuppliedNauticalTwilightPhotographs.role === 'qualitative appearance context only' &&
		fixture.claimBoundary.suppliedPhotographsRuntimeInput === false &&
		fixture.claimBoundary.suppliedPhotographsQuantitativeOracle === false,
		'CR4K photograph boundary changed.',
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
	const declaration = fixture.parents[parentId];
	const expected = EXPECTED_PARENT_RUNS[parentId];
	const expectedConclusion = expected.conclusion ?? 'accepted';
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true && terminal.conclusion === expectedConclusion &&
		terminal.runId === expected.runId && terminal.artifactSetSha256 === expected.artifactSetSha256,
		`CR4K requires the selected verified ${parentId} parent.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
		manifestFacts.size === declaration.manifest.byteLength && manifestSha256 === expected.manifestSha256,
		`CR4K ${parentId} manifest identity changed.`,
	);
	const manifest = await readJson(manifestPath);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = parentArtifacts(fixture, parentId);
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR4K ${parentId} manifest identity changed for ${artifact.path}.`,
		);
		const filePath = path.join(root, ...artifact.path.split('/'));
		const facts = await lstat(filePath);
		requireCondition(facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength, `CR4K ${parentId} artifact changed for ${artifact.path}.`);
		requireCondition((await sha256File(filePath)) === artifact.sha256, `CR4K ${parentId} artifact hash changed for ${artifact.path}.`);
	}
	return {
		schemaId: `${SCHEMA_PREFIX}-${parentId}-parent-verification-v1`,
		verified: true,
		explicitSelector: selector,
		runId: terminal.runId,
		slug: terminal.slug,
		conclusion: terminal.conclusion,
		artifactSetSha256: terminal.artifactSetSha256,
		artifactCount: terminal.artifactCount,
		artifactBytes: terminal.artifactBytes,
		manifest: {...declaration.manifest, verified: true},
		selectedArtifacts: selected,
		selectedArtifactInventory: await createSelectedFileInventory(root, ['artifact-manifest.json', ...selected.map(({path: artifactPath}) => artifactPath)]),
	};
}

function assertParentUnchanged(before, after, label) {
	requireCondition(
		before.runId === after.runId && before.artifactSetSha256 === after.artifactSetSha256 &&
		before.artifactCount === after.artifactCount && before.artifactBytes === after.artifactBytes &&
		before.manifest.sha256 === after.manifest.sha256,
		`${label} terminal identity changed during CR4K.`,
	);
	assertFileInventoriesEqual(before.selectedArtifactInventory, after.selectedArtifactInventory, `${label} selected artifacts`);
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH), sha256File(HARNESS_PATH), sha256File(MODEL_PATH),
	]);
	requireCondition(isSha256(FIXTURE_SHA256) && isSha256(HARNESS_SHA256) && isSha256(MODEL_SHA256), 'CR4K authored SHA-256 pins are not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4K fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4K browser harness changed after predeclaration.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4K Color model changed after predeclaration.');
	return {
		schemaId: `${SCHEMA_PREFIX}-authored-input-identities-v1`,
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		model: {path: MODEL_RELATIVE_PATH, sha256: modelSha256},
	};
}

async function captureImplementation() {
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4k-minimal-deep-twilight-lift.js',
			'color-reset/harness/cr4k-minimal-deep-twilight-lift-browser.js',
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
	requireCondition(exactJson(before.closure, after.closure), 'CR4K implementation closure changed during execution.');
	requireCondition(exactJson(before.packageBoundary, after.packageBoundary), 'CR4K package boundary changed during execution.');
	assertFileInventoriesEqual(before.inventory, after.inventory, 'CR4K implementation closure');
	return true;
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const expected = outputImages(fixture);
	const images = browser.uploads.filter(({path: artifactPath}) => expected.includes(artifactPath));
	const first = images[0] ?? null;
	const plate = images.find(({path: artifactPath}) => artifactPath === fixture.outputs.twilightComparison) ?? null;
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

function verifyBrowserArtifactIdentities(analysis, browser, fixture) {
	const byPath = new Map(browser.uploads.map((upload) => [upload.path, upload]));
	for (const image of analysis.uploadedImages ?? []) {
		const upload = byPath.get(image.artifactPath);
		requireCondition(upload?.byteLength === image.byteLength && upload.sha256 === image.sha256, `CR4K browser/server identity differs for ${image.artifactPath}.`);
	}
	requireCondition(exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), outputImages(fixture)), 'CR4K browser upload order changed.');
}

function evaluateResponse(row, response, analysis, fixture) {
	const proof = analysis.responseProofs.find((entry) => entry.responseId === response.responseId);
	const chronology = analysis.chronology.find((entry) => entry.responseId === response.responseId);
	const pivot = analysis.pivotProofs.find((entry) => entry.responseId === response.responseId);
	const cpuGpuParity = response.scenes.every((scene) =>
		scene.cpuGpuParity.encodedSky.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.maximumCpuGpuRgbCodeDifference &&
		scene.cpuGpuParity.encodedAll.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.maximumCpuGpuRgbCodeDifference &&
		scene.cpuGpuParity.floatSky.nonfiniteValueCount === 0 && scene.gpu.nonfiniteValueCount === 0 &&
		scene.gpu.errors.length === 0 && scene.gpu.contextLost === false,
	);
	const responseMath = proof?.finite === true && proof.positive === true &&
		proof.monotonicNonincreasing === true && proof.derivativeNonpositive === true &&
		proof.continuouslyDifferentiableByConstruction === true &&
		proof.highLightGainExcess <= fixture.diagnostics.responseProof.maximumHighLightGainExcess;
	const pivotMath = pivot?.pivotResidualLux <= fixture.diagnostics.pivotProof.maximumPivotResidualLux &&
		pivot.deepGainRatioResidual <= fixture.diagnostics.pivotProof.maximumDeepGainRatioResidual;
	const controlReplay = row.eligibility !== 'control' || response.scenes.every((scene) =>
		scene.controlDifference.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.controlReplay.maximumRgbCodeDifference &&
		scene.controlDifference.rgbCodeRmse <= fixture.diagnostics.controlReplay.maximumRgbCodeRmse &&
		scene.controlDifferenceAll.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.controlReplay.maximumRgbCodeDifference &&
		scene.controlDifferenceAll.rgbCodeRmse <= fixture.diagnostics.controlReplay.maximumRgbCodeRmse
	);
	const preSunsetRecords = row.eligibility !== 'candidate' ? [] : response.scenes
		.filter((scene) => scene.offsetMinutes <= fixture.diagnostics.candidatePreSunset.lastOffsetMinutes)
		.map((scene) => ({
			sceneId: scene.sceneId,
			offsetMinutes: scene.offsetMinutes,
			observedSky: scene.controlDifference,
			observedAll: scene.controlDifferenceAll,
			passes:
				scene.controlDifference.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.candidatePreSunset.maximumRgbCodeDifferenceFromControl &&
				scene.controlDifference.rgbCodeRmse <= fixture.diagnostics.candidatePreSunset.maximumRgbCodeRmseFromControl &&
				scene.controlDifferenceAll.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.candidatePreSunset.maximumRgbCodeDifferenceFromControl &&
				scene.controlDifferenceAll.rgbCodeRmse <= fixture.diagnostics.candidatePreSunset.maximumRgbCodeRmseFromControl,
		}));
	const preSunsetPreservation = preSunsetRecords.every(({passes}) => passes);
	const chronologyPass = chronology?.allStrictlyDecreasing === true &&
		exactJson(chronology.sceneIds, fixture.diagnostics.strictRegionalCadenceSceneIds) &&
		chronology.regions.every(({values, strictlyDecreasing}) =>
			strictlyDecreasing === true && values.length === fixture.diagnostics.strictRegionalCadenceSceneIds.length &&
			values.every((value, index) => index === 0 || value < values[index - 1]));
	const clippingRecords = response.scenes
		.filter((scene) => fixture.diagnostics.strictRegionalCadenceSceneIds.includes(scene.sceneId))
		.map((scene) => {
			const whole = scene.regions.find(({regionId}) => regionId === 'whole-sky');
			return {
				sceneId: scene.sceneId,
				blackSkyPixelCount: whole.blackSkyPixelCount,
				blackSkyPixelFraction: whole.blackSkyPixelFraction,
				saturatedSkyPixelCount: whole.saturatedSkyPixelCount,
				saturatedSkyPixelFraction: whole.saturatedSkyPixelFraction,
				passes:
					whole.blackSkyPixelFraction <= fixture.diagnostics.maximumTwilightBlackSkyFraction &&
					whole.saturatedSkyPixelFraction <= fixture.diagnostics.maximumTwilightSaturatedSkyFraction,
			};
		});
	const clipping = clippingRecords.every(({passes}) => passes);
	return {
		responseId: response.responseId,
		eligibility: row.eligibility,
		cpuGpuParity,
		responseMath,
		pivotMath,
		controlReplay,
		preSunsetPreservation,
		preSunsetRecords,
		chronology: chronologyPass,
		clipping,
		clippingRecords,
		passed: cpuGpuParity && responseMath && pivotMath && controlReplay && preSunsetPreservation && chronologyPass && clipping,
	};
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged, implementationUnchanged, protectedUnchanged}) {
	const responseById = new Map(analysis.responses.map((response) => [response.responseId, response]));
	const responseFacts = fixture.response.rows.map((row) => evaluateResponse(row, responseById.get(row.id), analysis, fixture));
	const expected = outputImages(fixture);
	const actual = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const gates = {
		browserSchema: analysis.schemaId === SCHEMA_PREFIX + '-browser-result-v1',
		claimBoundaryPreserved:
			analysis.appearanceAccepted === false && analysis.automaticCandidateSelection === false &&
			analysis.productionClaim === false && analysis.photographsUsedAsRuntimeInput === false &&
			analysis.photographsUsedAsQuantitativeOracle === false,
		renderCompletedBeforeGates:
			analysis.renderComplete === true && analysis.integrityGateEvaluated === false &&
			analysis.scientificGateEvaluated === false && analysis.allDeclaredImagesUploaded === true,
		allFortyThreeImagesWrittenInOrder: actual.length === 43 && exactJson(actual, expected),
		allThirtySixFramesWrittenFirst: exactJson(actual.slice(0, 36), responseIds(fixture).flatMap((id) => fixture.outputs.frames[id])),
		allThreeCadencesFollowFrames: exactJson(actual.slice(36, 39), responseIds(fixture).map((id) => fixture.outputs.cadences[id])),
		allCadenceSourceRectanglesPixelExact:
			analysis.cadenceEmbeddings?.length === 3 && analysis.cadenceEmbeddings.every((cadence) =>
				cadence.embeddings.length === 12 && cadence.embeddings.every((embedding) =>
					embedding.exact === true && embedding.differingChannelCount === 0 &&
					embedding.maximumAbsoluteChannelDifference === 0 &&
					embedding.comparedChannelCount === 640 * 400 * 4)),
		diagnosticWrittenLast: actual.at(-1) === fixture.outputs.diagnostic,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded:
			isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) &&
			typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		d3d11HardwareReplay:
			browser.runtimeEnvironment?.requestedAngleBackend === 'd3d11' &&
			typeof analysis.gpu?.renderer === 'string' && /(?:Direct3D11|D3D11)/iu.test(analysis.gpu.renderer) &&
			!/(?:SwiftShader|Microsoft Basic Render Driver|software renderer)/iu.test(analysis.gpu.renderer),
		exactOrders: exactJson(analysis.sceneOrder, fixture.presentation.sceneOrder) && exactJson(analysis.responseOrder, responseIds(fixture)),
		allParentInputsVerifiedByBrowser:
			analysis.scenes.length === 12 && analysis.scenes.every((scene) =>
				scene.evidence.field.verified === true && scene.evidence.mask.verified === true &&
				scene.evidence.controlPng.verified === true),
		allDerivationsRecorded: analysis.imageDerivations.length === 43 && analysis.panelIdentities.length === 43,
		gpuHealthy:
			analysis.gpu.extColorBufferFloat === true && analysis.gpu.errors.length === 0 &&
			analysis.gpu.contextLost === false,
		inheritedMinusFiveToSunsetJoinReportedOnly:
			analysis.inheritedJoin.length === 3 && analysis.inheritedJoin.every((record) => record.reportOnly === true),
		photographBoundaryPreserved:
			fixture.claimBoundary.suppliedPhotographsRuntimeInput === false &&
			fixture.claimBoundary.suppliedPhotographsQuantitativeOracle === false,
		parentsRemainedImmutable: parentsUnchanged,
		implementationRemainedImmutable: implementationUnchanged,
		protectedSourceRemainedImmutable: protectedUnchanged,
		firstImageTimeTarget:
			progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget:
			progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityPassed = Object.values(gates).every(Boolean);
	const allResponsesPassed = responseFacts.every(({passed}) => passed);
	return {
		gates,
		responseFacts,
		integrityPassed,
		allResponsesPassed,
		accepted: integrityPassed && allResponsesPassed,
	};
}

async function main() {
	const [cr1Selector, cr2Selector, cr4hSelector, cr4fSelector, cr4iSelector, ...extraArguments] = process.argv.slice(2);
	if (!cr1Selector || !cr2Selector || !cr4hSelector || !cr4fSelector || !cr4iSelector || extraArguments.length !== 0) {
		throw new Error('Usage: ' + COMMAND_PREFIX + ' <explicit-CR1-run> <explicit-CR2-run> <explicit-CR4H-run> <explicit-CR4F-run> <explicit-CR4I-run>');
	}
	const selectors = {cr1: cr1Selector, cr2: cr2Selector, cr4h: cr4hSelector, cr4f: cr4fSelector, cr4i: cr4iSelector};
	const parentIds = Object.keys(selectors);
	const fixture = await readJson(FIXTURE_PATH);
	verifyFixtureContract(fixture);
	const command = COMMAND_PREFIX + ' ' + parentIds.map((id) => JSON.stringify(selectors[id])).join(' ');
	const run = await initializeColorResetRunRecord({
		slug: 'cr4k-minimal-deep-twilight-lift',
		command,
		inputs: {
			schemaId: SCHEMA_PREFIX + '-inputs-v1',
			increment: 'CR4K minimal deep-twilight pivot lift',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: selectors,
			parents: fixture.parents,
			responses: fixture.response.rows,
			scenes: fixture.scenes,
			outputArtifacts: outputImages(fixture),
		},
		provenance: {
			schemaId: SCHEMA_PREFIX + '-provenance-v1',
			operation: 'Replay twelve authenticated RGBY fields through the exact slope-078/p9 response and two pivot-only deep-twilight lifts; authenticate the rejected-but-verified CR4I control PNGs; write all 43 images before gates.',
			implementation: [RUNNER_RELATIVE_PATH, HARNESS_RELATIVE_PATH, MODEL_RELATIVE_PATH, FIXTURE_RELATIVE_PATH],
			parents: fixture.parents,
			responseEquation: fixture.response.familyEquation,
			pivotEquation: fixture.response.pivotEquation,
			exclusions: ['no transport/cache execution', 'no field or illuminance interpolation', 'no chromatic correction', 'no per-scene tuning', 'owner photographs are qualitative-only and are not inputs', 'no automatic appearance selection', 'no production change'],
		},
		environment: {
			schemaId: SCHEMA_PREFIX + '-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			browserTimeoutMilliseconds: 600_000,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		references: {
			schemaId: SCHEMA_PREFIX + '-references-v1',
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			cr4h: 'tmp/extraterrestrial/color-reset/runs/000034-cr4h-low-sun-cadence-acquisition',
			cr4f: 'tmp/extraterrestrial/color-reset/runs/000032-cr4f-fine-twilight-cadence',
			cr4i: 'tmp/extraterrestrial/color-reset/runs/000035-cr4i-smooth-bruneton-shoulder-check',
			ownerPhotographs: 'conversation-only qualitative context; no file/runtime/metric dependency',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md',
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	const state = {
		parentRootsBefore: null,
		parentRootsAfter: null,
		parentsBefore: null,
		parentsAfter: null,
		implementationBefore: null,
		implementationAfter: null,
		protectedBefore: null,
		protectedAfter: null,
	};
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4K implementation');
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		state.parentRootsBefore = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await resolveParentDirectory(selectors[parentId], 'CR4K ' + parentId.toUpperCase() + ' parent'),
		])));
		state.parentsBefore = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, root: state.parentRootsBefore[parentId], selector: selectors[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-before.json', state.parentsBefore);
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
			modulePath: '/lane/harness/cr4k-minimal-deep-twilight-lift-browser.js',
			exportName: 'runCr4kMinimalDeepTwilightLiftBrowser',
			servedRoots: {
				'/cr1/': state.parentRootsBefore.cr1,
				'/cr4h/': state.parentRootsBefore.cr4h,
				'/cr4f/': state.parentRootsBefore.cr4f,
				'/cr4i/': state.parentRootsBefore.cr4i,
			},
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
		state.parentRootsAfter = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await resolveParentDirectory(selectors[parentId], 'CR4K ' + parentId.toUpperCase() + ' parent after render'),
		])));
		for (const parentId of parentIds) {
			requireCondition(
				pathComparisonKey(state.parentRootsBefore[parentId]) === pathComparisonKey(state.parentRootsAfter[parentId]),
				'CR4K ' + parentId + ' selector changed resolution.',
			);
		}
		state.parentsAfter = Object.fromEntries(await Promise.all(parentIds.map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, root: state.parentRootsAfter[parentId], selector: selectors[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-after.json', state.parentsAfter);
		const parentsUnchanged = parentIds.every((parentId) =>
			assertParentUnchanged(state.parentsBefore[parentId], state.parentsAfter[parentId], 'CR4K ' + parentId + ' parent'));
		state.protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(state.protectedBefore.algorithm32, state.protectedAfter.algorithm32, 'CR4K protected Algorithm32 source');
		assertFileInventoriesEqual(state.protectedBefore.flat32, state.protectedAfter.flat32, 'CR4K protected Flat32 source');
		const protectedUnchanged = true;
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			parentsUnchanged,
			implementationUnchanged,
			protectedUnchanged,
		});
		const conclusion = decision.accepted ? 'accepted' : decision.integrityPassed ? 'rejected' : 'failed';
		const proof = {
			schemaId: SCHEMA_PREFIX + '-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			allResponsesPassed: decision.allResponsesPassed,
			appearanceAccepted: false,
			automaticCandidateSelection: false,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			responseFacts: decision.responseFacts,
			progress,
			parents: state.parentsAfter,
			outputs: analysis.uploadedImages,
			inheritedJoin: analysis.inheritedJoin,
			qualitativeReferenceBoundary: fixture.qualitativeReferences,
			protectedSourceUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			'# ' + run.runId + ': CR4K minimal deep-twilight lift',
			'',
			'Conclusion: **' + conclusion + '**.',
			'',
			'All 36 full-resolution frames, three native six-column cadence plates, the 3-by-6 twilight comparison, amplified difference plate, clipping-mask plate, and response/regional-median diagnostic were written before runner gates.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => '- ' + (passed ? 'PASS' : 'FAIL') + ' integrity: ' + name),
			'',
			...decision.responseFacts.map((fact) => '- ' + (fact.passed ? 'PASS' : 'FAIL') + ' ' + fact.responseId + ': CPU/GPU=' + fact.cpuGpuParity + ', response=' + fact.responseMath + ', pivot=' + fact.pivotMath + ', control-replay=' + fact.controlReplay + ', pre-sunset=' + fact.preSunsetPreservation + ', twilight-chronology=' + fact.chronology + ', clipping=' + fact.clipping),
			'',
			'The known minus-five-minute-to-sunset p9 rebound is report-only. The owner photographs are qualitative appearance context only. Appearance remains unaccepted and no row is selected automatically.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(
			independent.verified === true && independent.conclusion === conclusion &&
			independent.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4K terminal run failed independent verification.',
		);
		process.stdout.write(JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: independent.verified,
			appearanceAccepted: false,
			responseFacts: decision.responseFacts,
			gates: decision.gates,
			progress,
			outputs: analysis.uploadedImages,
		}, null, 2) + '\n');
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', {
					schemaId: SCHEMA_PREFIX + '-progress-v1',
					initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(),
					error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: SCHEMA_PREFIX + '-failure-v1',
				error: {
					name: error instanceof Error ? error.name : 'Error',
					message: error instanceof Error ? error.message : String(error),
					stack: error instanceof Error ? error.stack : null,
				},
				state: Object.fromEntries(Object.entries(state).map(([key, value]) => [key, value !== null])),
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {
					schemaId: SCHEMA_PREFIX + '-failed-result-v1',
					accepted: false,
					integrityPassed: false,
					appearanceAccepted: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: '# ' + run.runId + ': CR4K minimal deep-twilight lift\n\nConclusion: **failed**.\n\n' + (error instanceof Error ? error.message : String(error)) + '\n',
			});
		}
		throw error;
	}
}

await main();
