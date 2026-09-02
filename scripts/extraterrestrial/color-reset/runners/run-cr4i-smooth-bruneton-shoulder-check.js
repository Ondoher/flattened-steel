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
	'node scripts/extraterrestrial/color-reset/runners/run-cr4i-smooth-bruneton-shoulder-check.js';
const RUNNER_RELATIVE_PATH = COMMAND_PREFIX.slice('node '.length);
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/fixtures/cr4i-smooth-bruneton-shoulder-check-v1.json';
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4i-smooth-bruneton-shoulder-check-browser.js';
const MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4iAnchorPreservingShoulderColorDisplayModel.js';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4i-smooth-bruneton-shoulder-check';
const UPLOAD_LIMIT_BYTES = 128 * 1024 * 1024;

// These authored pins are filled only after the fixture, model, and browser
// harness have passed static checks. The runner itself is captured by the
// immutable implementation closure and therefore does not self-pin.
const FIXTURE_SHA256 = 'cda920c69c40119833bb74c342766674d71c12bcca26fe44f2a668affd7f4135';
const HARNESS_SHA256 = 'd2ff01d756da58c2a250ccec0c203e56f45737ff08a04c72305b4362da3ca9cf';
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
	for (const scene of fixture.scenes) {
		if (scene.parentId === parentId) artifacts.push(scene.field, scene.mask);
	}
	return [...new Map(artifacts.map((artifact) => [artifact.path, artifact])).values()];
}

function verifyFixtureContract(fixture) {
	requireCondition(fixture.schemaId === `${SCHEMA_PREFIX}-input-v1`, 'CR4I fixture schema changed.');
	requireCondition(!JSON.stringify(fixture).includes('PENDING_'), 'CR4I fixture contains unresolved pins.');
	requireCondition(
		fixture.claimBoundary?.fieldReplayOnly === true &&
		fixture.claimBoundary.physicalTransportExecution === false &&
		fixture.claimBoundary.appearanceAcceptanceGate === false &&
		fixture.claimBoundary.appearanceAccepted === false &&
		fixture.claimBoundary.automaticCandidateSelection === false &&
		fixture.claimBoundary.perSceneColorTuning === false &&
		fixture.claimBoundary.productionClaim === false,
		'CR4I claim boundary changed.',
	);
	for (const parentId of ['cr1', 'cr2', 'cr4h', 'cr4f']) {
		const parent = fixture.parents[parentId];
		const expected = EXPECTED_PARENT_RUNS[parentId];
		requireCondition(
			parent.namespace === 'color-reset' && parent.runId === expected.runId &&
			parent.conclusion === 'accepted' && parent.artifactSetSha256 === expected.artifactSetSha256 &&
			parent.manifest.path === 'artifact-manifest.json' && parent.manifest.sha256 === expected.manifestSha256 &&
			Number.isSafeInteger(parent.manifest.byteLength) && parent.manifest.byteLength > 0,
			`CR4I ${parentId} parent identity changed.`,
		);
		for (const artifact of parentArtifacts(fixture, parentId)) {
			requireCondition(
				isArtifactPath(artifact.path) && Number.isSafeInteger(artifact.byteLength) &&
				artifact.byteLength > 0 && isSha256(artifact.sha256),
				`CR4I ${parentId} artifact declaration is invalid.`,
			);
		}
	}
	requireCondition(fixture.viewport.widthPixels === 640 && fixture.viewport.heightPixels === 400, 'CR4I viewport changed.');
	requireCondition(fixture.scenes.length === 12, 'CR4I requires twelve scenes.');
	requireCondition(
		exactJson(fixture.scenes.map(({id}) => id), fixture.presentation.sceneOrder),
		'CR4I scene order changed.',
	);
	requireCondition(fixture.response.rows.length === 5, 'CR4I requires five response rows.');
	requireCondition(exactJson(responseIds(fixture), fixture.presentation.responseOrder), 'CR4I response order changed.');
	requireCondition(fixture.presentation.mainDecisionSceneIds.length === 7, 'CR4I requires seven main-decision scenes.');
	const smoothRows = fixture.response.rows.filter(({kind}) => kind === 'smooth-response');
	requireCondition(
		fixture.response.rows[0].id === 'bruneton-control' && fixture.response.rows[0].kind === 'bruneton' &&
		smoothRows.length === 4 && smoothRows.every((row) =>
			row.adaptationExponent === 0.78 && row.adaptationFloorIlluminanceLux === 0.02 &&
			row.adaptationSoftnessLogUnits === 0.1 && row.sunsetAmplitude > 0 &&
			row.sunsetTransitionIlluminanceLux > 0 && row.sunsetRolloffPower > 1 &&
			row.adaptationPivotIlluminanceLux > 0),
		'CR4I response family changed.',
	);
	requireCondition(
		exactJson(fixture.diagnostics.strictRegionalCadenceCandidateIds, ['shoulder-p4', 'shoulder-p35', 'shoulder-p3']) &&
		exactJson(fixture.diagnostics.reportOnlyChronologyControlIds, ['slope-078-p9-control']) &&
		fixture.response.rows.find(({id}) => id === 'slope-078-p9-control')?.eligibility === 'report-only-control' &&
		fixture.diagnostics.strictRegionalCadenceCandidateIds.every((id) =>
			fixture.response.rows.find((row) => row.id === id)?.eligibility === 'candidate'),
		'CR4I chronology eligibility changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			['cr1', 'cr4h', 'cr4f'].includes(scene.parentId) &&
			scene.sourcePrefix === `/${scene.parentId}/` &&
			['cr2', 'cr4h', 'cr4f'].includes(scene.receiverLightParentId) &&
			(scene.parentId === 'cr1' ? scene.receiverLightParentId === 'cr2' : scene.receiverLightParentId === scene.parentId) &&
			Number.isFinite(scene.solarElevationDegrees) && Number.isFinite(scene.solarZenithDegrees) &&
			Number.isFinite(scene.totalHorizontalIlluminance.value) &&
			scene.totalHorizontalIlluminance.value >= 0 && scene.totalHorizontalIlluminance.units === 'lux' &&
			scene.field.byteLength === 4_096_000 && scene.mask.byteLength === 256_000,
			`CR4I scene contract changed for ${scene.id}.`,
		);
		const mustGate = scene.id === 'sunset-minus-60-minutes' || scene.solarElevationDegrees >= 5;
		requireCondition(
			scene.preservationQualification === (mustGate ? 'gate' : 'report-only'),
			`CR4I preservation applicability changed for ${scene.id}.`,
		);
	}
	const expectedImages = [
		...responseIds(fixture).flatMap((id) => fixture.outputs.frames[id]),
		...responseIds(fixture).map((id) => fixture.outputs.chronologies[id]),
		fixture.outputs.mainDecisionPlate,
		fixture.outputs.responsePlot,
		fixture.outputs.publicationPlot,
	];
	requireCondition(
		expectedImages.length === 68 && new Set(expectedImages).size === 68 &&
		expectedImages.every(isArtifactPath) && exactJson(expectedImages, outputImages(fixture)),
		'CR4I requires exactly 68 unique frame-first images.',
	);
	requireCondition(
		fixture.publicationReferences.koomen1952.horizontalPlaneIllumination.lux.length === 6 &&
		exactJson(fixture.publicationReferences.koomen1952.horizontalPlaneIllumination.validSolarElevationDegrees, [-9, 5]) &&
		fixture.publicationReferences.koomen1952.zenithLuminanceP90.luminanceCandelaPerSquareMeter.length === 8 &&
		exactJson(fixture.publicationReferences.koomen1952.zenithLuminanceP90.validSolarElevationDegrees, [-15, 5]) &&
		fixture.publicationReferences.patat2006.coefficients.length === 5,
		'CR4I publication reference data changed.',
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
	const terminal = await verifyColorResetRun(root);
	requireCondition(
		terminal.verified === true && terminal.conclusion === 'accepted' &&
		terminal.runId === expected.runId && terminal.artifactSetSha256 === expected.artifactSetSha256,
		`CR4I requires the selected accepted ${parentId} parent.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestFacts = await lstat(manifestPath);
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink() &&
		manifestFacts.size === declaration.manifest.byteLength && manifestSha256 === expected.manifestSha256,
		`CR4I ${parentId} manifest identity changed.`,
	);
	const manifest = await readJson(manifestPath);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const selected = parentArtifacts(fixture, parentId);
	for (const artifact of selected) {
		const recorded = byPath.get(artifact.path);
		requireCondition(
			recorded?.byteLength === artifact.byteLength && recorded.sha256 === artifact.sha256,
			`CR4I ${parentId} manifest identity changed for ${artifact.path}.`,
		);
		const filePath = path.join(root, ...artifact.path.split('/'));
		const facts = await lstat(filePath);
		requireCondition(facts.isFile() && !facts.isSymbolicLink() && facts.size === artifact.byteLength, `CR4I ${parentId} artifact changed for ${artifact.path}.`);
		requireCondition((await sha256File(filePath)) === artifact.sha256, `CR4I ${parentId} artifact hash changed for ${artifact.path}.`);
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
		`${label} terminal identity changed during CR4I.`,
	);
	assertFileInventoriesEqual(before.selectedArtifactInventory, after.selectedArtifactInventory, `${label} selected artifacts`);
	return true;
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH), sha256File(HARNESS_PATH), sha256File(MODEL_PATH),
	]);
	requireCondition(isSha256(FIXTURE_SHA256) && isSha256(HARNESS_SHA256) && isSha256(MODEL_SHA256), 'CR4I authored SHA-256 pins are not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4I fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4I browser harness changed after predeclaration.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4I Color model changed after predeclaration.');
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
			'color-reset/runners/run-cr4i-smooth-bruneton-shoulder-check.js',
			'color-reset/harness/cr4i-smooth-bruneton-shoulder-check-browser.js',
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
	requireCondition(exactJson(before.closure, after.closure), 'CR4I implementation closure changed during execution.');
	requireCondition(exactJson(before.packageBoundary, after.packageBoundary), 'CR4I package boundary changed during execution.');
	assertFileInventoriesEqual(before.inventory, after.inventory, 'CR4I implementation closure');
	return true;
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const expected = outputImages(fixture);
	const images = browser.uploads.filter(({path: artifactPath}) => expected.includes(artifactPath));
	const first = images[0] ?? null;
	const plate = images.find(({path: artifactPath}) => artifactPath === fixture.outputs.mainDecisionPlate) ?? null;
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
		requireCondition(upload?.byteLength === image.byteLength && upload.sha256 === image.sha256, `CR4I browser/server identity differs for ${image.artifactPath}.`);
	}
	requireCondition(exactJson(browser.uploads.map(({path: artifactPath}) => artifactPath), outputImages(fixture)), 'CR4I browser upload order changed.');
}

function preservationCeilings(illuminanceLux) {
	const factor = 1 / (1 + (illuminanceLux / 2000) ** 2);
	return {
		maximumAbsoluteRgbCodeDifference: 1 + 4 * factor,
		rgbCodeRmse: 0.2 + 0.8 * factor,
	};
}

function evaluateCandidate(row, response, analysis, fixture) {
	const bruneton = analysis.responses.find(({responseId}) => responseId === 'bruneton-control');
	const chronology = analysis.chronology.find(({responseId}) => response.responseId === responseId);
	const proof = analysis.responseProofs.find(({responseId}) => response.responseId === responseId);
	const anchors = analysis.anchorComparisons.find(({responseId}) => response.responseId === responseId);
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
	const anchorPreservation = anchors?.anchors.every((anchor) =>
		anchor.binary64GainResidual <= fixture.response.anchors.maximumBinary64GainResidual &&
		anchor.renderedSky.maximumAbsoluteRgbCodeDifference <= fixture.response.anchors.allowedRenderedMaximumRgbCodeDifference &&
		anchor.renderedSky.rgbCodeRmse <= fixture.response.anchors.allowedRenderedRgbCodeRmse,
	) === true;
	const chronologyPass = chronology?.allStrictlyDecreasing === true &&
		chronology.regions.every(({values, strictlyDecreasing}) =>
			strictlyDecreasing === true && values.length === fixture.scenes.length &&
			values.every((value, index) => index === 0 || value < values[index - 1]));
	const clippingRecords = response.scenes.map((scene) => {
		const whole = scene.regions.find(({regionId}) => regionId === 'whole-sky');
		const brunetonScene = bruneton.scenes.find(({sceneId}) => sceneId === scene.sceneId);
		const brunetonWhole = brunetonScene.regions.find(({regionId}) => regionId === 'whole-sky');
		const twilightAbsoluteGate =
			scene.offsetMinutes >= fixture.diagnostics.clippingPolicy.absoluteZeroBlackAndSaturationFromOffsetMinutesInclusive;
		const zeroAbsolute =
			whole.blackSkyPixelFraction <= fixture.diagnostics.maximumCandidateBlackSkyFraction &&
			whole.saturatedSkyPixelFraction <= fixture.diagnostics.maximumCandidateSaturatedSkyFraction;
		return {
			sceneId: scene.sceneId,
			offsetMinutes: scene.offsetMinutes,
			qualification: twilightAbsoluteGate ? 'absolute-zero-gate' : 'report-only',
			candidate: {
				blackSkyPixelCount: whole.blackSkyPixelCount,
				saturatedSkyPixelCount: whole.saturatedSkyPixelCount,
			},
			bruneton: {
				blackSkyPixelCount: brunetonWhole.blackSkyPixelCount,
				saturatedSkyPixelCount: brunetonWhole.saturatedSkyPixelCount,
			},
			deltaFromBruneton: {
				blackSkyPixelCount: whole.blackSkyPixelCount - brunetonWhole.blackSkyPixelCount,
				saturatedSkyPixelCount: whole.saturatedSkyPixelCount - brunetonWhole.saturatedSkyPixelCount,
			},
			passes: twilightAbsoluteGate ? zeroAbsolute : true,
		};
	});
	const clipping = clippingRecords.every(({passes}) => passes);
	const preservationRecords = response.scenes.map((scene) => {
		const ceilings = preservationCeilings(scene.totalHorizontalIlluminance.value);
		const hardGate = scene.preservationQualification === 'gate';
		const within = scene.brunetonDifference.sky.maximumAbsoluteRgbCodeDifference <= ceilings.maximumAbsoluteRgbCodeDifference &&
			scene.brunetonDifference.sky.rgbCodeRmse <= ceilings.rgbCodeRmse;
		return {
			sceneId: scene.sceneId,
			solarElevationDegrees: scene.solarElevationDegrees,
			totalHorizontalIlluminance: scene.totalHorizontalIlluminance,
			qualification: scene.preservationQualification,
			observed: scene.brunetonDifference.sky,
			ceilings,
			within,
			gatesCandidate: hardGate,
		};
	});
	const brightPreservation = preservationRecords.filter(({gatesCandidate}) => gatesCandidate).every(({within}) => within);
	const chronologyGatesCandidate = row.eligibility === 'candidate';
	const chronologyRequirement = chronologyGatesCandidate ? chronologyPass : true;
	const corePassed = cpuGpuParity && responseMath && anchorPreservation && clipping && brightPreservation;
	return {
		candidateId: response.responseId,
		eligibility: row.eligibility,
		chronologyGatesCandidate,
		cpuGpuParity,
		responseMath,
		anchorPreservation,
		chronology: chronologyPass,
		clipping,
		clippingRecords,
		brightPreservation,
		preservationRecords,
		corePassed,
		passed: corePassed && chronologyRequirement,
	};
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged, implementationUnchanged, protectedUnchanged}) {
	const responseById = new Map(analysis.responses.map((response) => [response.responseId, response]));
	const smoothFacts = fixture.response.rows.filter(({kind}) => kind === 'smooth-response')
		.map((row) => evaluateCandidate(row, responseById.get(row.id), analysis, fixture));
	const authority = smoothFacts.find(({candidateId}) => candidateId === fixture.response.anchors.authorityRowId);
	const broader = smoothFacts.filter(({eligibility}) => eligibility === 'candidate');
	const expected = outputImages(fixture);
	const actual = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const gates = {
		browserSchema: analysis.schemaId === `${SCHEMA_PREFIX}-browser-result-v1`,
		claimBoundaryPreserved: analysis.appearanceAccepted === false && analysis.automaticCandidateSelection === false && analysis.productionClaim === false,
		renderCompletedBeforeGates: analysis.renderComplete === true && analysis.integrityGateEvaluated === false && analysis.scientificGateEvaluated === false && analysis.allDeclaredImagesUploaded === true,
		allSixtyEightImagesWrittenInOrder: actual.length === 68 && exactJson(actual, expected),
		allSixtyFramesPrecedeFigures: exactJson(actual.slice(0, 60), responseIds(fixture).flatMap((id) => fixture.outputs.frames[id])),
		publicationPlotWrittenLast: actual.at(-1) === fixture.outputs.publicationPlot,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		browserIdentityRecorded: isSha256(browser.runtimeEnvironment?.chromeExecutable?.sha256) && typeof browser.runtimeEnvironment?.browserVersion?.product === 'string',
		d3d11HardwareReplay: browser.runtimeEnvironment?.requestedAngleBackend === 'd3d11' &&
			typeof analysis.gpu?.renderer === 'string' && /(?:Direct3D11|D3D11)/iu.test(analysis.gpu.renderer) &&
			!/(?:SwiftShader|Microsoft Basic Render Driver|software renderer)/iu.test(analysis.gpu.renderer),
		exactOrders: exactJson(analysis.sceneOrder, fixture.presentation.sceneOrder) && exactJson(analysis.responseOrder, responseIds(fixture)),
		allParentInputsVerifiedByBrowser: analysis.scenes.length === 12 && analysis.scenes.every((scene) => scene.evidence.field.verified === true && scene.evidence.mask.verified === true),
		allDerivationsRecorded: analysis.imageDerivations.length === 68 && analysis.panelIdentities.length === 68,
		gpuHealthy: analysis.gpu.extColorBufferFloat === true && analysis.gpu.errors.length === 0 && analysis.gpu.contextLost === false,
		publicationBoundaryPreserved: analysis.publicationComparison?.directional?.directionMatch === false && analysis.publicationComparison.directional.reportOnly === true,
		parentsRemainedImmutable: parentsUnchanged,
		implementationRemainedImmutable: implementationUnchanged,
		protectedSourceRemainedImmutable: protectedUnchanged,
		firstImageTimeTarget: progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget: progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityPassed = Object.values(gates).every(Boolean);
	const authorityPassed = authority?.corePassed === true;
	const anyBroaderCandidatePassed = broader.some(({passed}) => passed);
	return {
		gates,
		candidateFacts: smoothFacts,
		integrityPassed,
		authorityPassed,
		anyBroaderCandidatePassed,
		accepted: integrityPassed && authorityPassed && anyBroaderCandidatePassed,
	};
}

async function main() {
	const [cr1Selector, cr2Selector, cr4hSelector, cr4fSelector, ...extraArguments] = process.argv.slice(2);
	if (!cr1Selector || !cr2Selector || !cr4hSelector || !cr4fSelector || extraArguments.length !== 0) {
		throw new Error(`Usage: ${COMMAND_PREFIX} <explicit-CR1-run> <explicit-CR2-run> <explicit-CR4H-run> <explicit-CR4F-run>`);
	}
	const fixture = await readJson(FIXTURE_PATH);
	verifyFixtureContract(fixture);
	const command = `${COMMAND_PREFIX} ${JSON.stringify(cr1Selector)} ${JSON.stringify(cr2Selector)} ${JSON.stringify(cr4hSelector)} ${JSON.stringify(cr4fSelector)}`;
	const run = await initializeColorResetRunRecord({
		slug: 'cr4i-smooth-bruneton-shoulder-check',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4I smooth Bruneton shoulder check',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: {cr1: cr1Selector, cr2: cr2Selector, cr4h: cr4hSelector, cr4f: cr4fSelector},
			parents: fixture.parents,
			responses: fixture.response.rows,
			scenes: fixture.scenes,
			outputArtifacts: outputImages(fixture),
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation: 'Replay twelve authenticated RGBY fields through unchanged Bruneton and four global anchor-preserving q=.78 pre-tone responses; write all sixty-eight images before runner gates; compare only normalized physical receiver-light/raw-Y slopes with publication data.',
			implementation: [RUNNER_RELATIVE_PATH, HARNESS_RELATIVE_PATH, MODEL_RELATIVE_PATH, FIXTURE_RELATIVE_PATH],
			parents: fixture.parents,
			exclusions: ['no transport/cache execution', 'no field/illuminance interpolation', 'no display-RGB publication fit', 'no per-scene tuning', 'no automatic appearance selection', 'no production change'],
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
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			cr4h: 'tmp/extraterrestrial/color-reset/runs/000034-cr4h-low-sun-cadence-acquisition',
			cr4f: 'tmp/extraterrestrial/color-reset/runs/000032-cr4f-fine-twilight-cadence',
			koomen1952: fixture.publicationReferences.koomen1952.officialUrl,
			patat2006: fixture.publicationReferences.patat2006.officialPdfUrl,
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
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'CR4I implementation');
		await run.writeJsonArtifact('evidence/authored-input-identities.json', await verifyAuthoredInputs());
		state.parentRootsBefore = {
			cr1: await resolveParentDirectory(cr1Selector, 'CR4I CR1 parent'),
			cr2: await resolveParentDirectory(cr2Selector, 'CR4I CR2 parent'),
			cr4h: await resolveParentDirectory(cr4hSelector, 'CR4I CR4H parent'),
			cr4f: await resolveParentDirectory(cr4fSelector, 'CR4I CR4F parent'),
		};
		state.parentsBefore = Object.fromEntries(await Promise.all(['cr1', 'cr2', 'cr4h', 'cr4f'].map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, root: state.parentRootsBefore[parentId], selector: {cr1: cr1Selector, cr2: cr2Selector, cr4h: cr4hSelector, cr4f: cr4fSelector}[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-before.json', state.parentsBefore);
		state.implementationBefore = await captureImplementation();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', state.implementationBefore);
		state.protectedBefore = {algorithm32: await createFileInventory(ALGORITHM32_ROOT), flat32: await createFileInventory(FLAT32_ROOT)};
		await run.writeJsonArtifact('evidence/protected-source-before.json', state.protectedBefore);
		await run.writeJsonArtifact('browser/configuration.json', fixture);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4i-smooth-bruneton-shoulder-check-browser.js',
			exportName: 'runCr4iSmoothBrunetonShoulderCheckBrowser',
			servedRoots: {'/cr1/': state.parentRootsBefore.cr1, '/cr4h/': state.parentRootsBefore.cr4h, '/cr4f/': state.parentRootsBefore.cr4f},
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
			cr1: await resolveParentDirectory(cr1Selector, 'CR4I CR1 parent after render'),
			cr2: await resolveParentDirectory(cr2Selector, 'CR4I CR2 parent after render'),
			cr4h: await resolveParentDirectory(cr4hSelector, 'CR4I CR4H parent after render'),
			cr4f: await resolveParentDirectory(cr4fSelector, 'CR4I CR4F parent after render'),
		};
		for (const parentId of ['cr1', 'cr2', 'cr4h', 'cr4f']) {
			requireCondition(pathComparisonKey(state.parentRootsBefore[parentId]) === pathComparisonKey(state.parentRootsAfter[parentId]), `CR4I ${parentId} selector changed resolution.`);
		}
		state.parentsAfter = Object.fromEntries(await Promise.all(['cr1', 'cr2', 'cr4h', 'cr4f'].map(async (parentId) => [
			parentId,
			await verifyParent({fixture, parentId, root: state.parentRootsAfter[parentId], selector: {cr1: cr1Selector, cr2: cr2Selector, cr4h: cr4hSelector, cr4f: cr4fSelector}[parentId]}),
		])));
		await run.writeJsonArtifact('evidence/parents-after.json', state.parentsAfter);
		const parentsUnchanged = ['cr1', 'cr2', 'cr4h', 'cr4f'].every((parentId) => assertParentUnchanged(state.parentsBefore[parentId], state.parentsAfter[parentId], `CR4I ${parentId} parent`));
		state.protectedAfter = {algorithm32: await createFileInventory(ALGORITHM32_ROOT), flat32: await createFileInventory(FLAT32_ROOT)};
		await run.writeJsonArtifact('evidence/protected-source-after.json', state.protectedAfter);
		assertFileInventoriesEqual(state.protectedBefore.algorithm32, state.protectedAfter.algorithm32, 'CR4I protected Algorithm32 source');
		assertFileInventoriesEqual(state.protectedBefore.flat32, state.protectedAfter.flat32, 'CR4I protected Flat32 source');
		const protectedUnchanged = true;
		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged, implementationUnchanged, protectedUnchanged});
		const conclusion = decision.accepted ? 'accepted' : decision.integrityPassed ? 'rejected' : 'failed';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			authorityPassed: decision.authorityPassed,
			anyBroaderCandidatePassed: decision.anyBroaderCandidatePassed,
			appearanceAccepted: false,
			automaticCandidateSelection: false,
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
			`# ${run.runId}: CR4I smooth Bruneton shoulder check`, '',
			`Conclusion: **${conclusion}**.`, '',
			'All 60 full-resolution frames, five chronology plates, one seven-scene decision plate, one response/Bruneton metric plot, and one publication/raw-field plot were written before runner gates.', '',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'} integrity: ${name}`), '',
			...decision.candidateFacts.map((candidate) => `- ${candidate.passed ? 'PASS' : 'FAIL'} ${candidate.candidateId}: CPU/GPU=${candidate.cpuGpuParity}, response=${candidate.responseMath}, anchors=${candidate.anchorPreservation}, chronology=${candidate.chronology}, clipping=${candidate.clipping}, bright-preservation=${candidate.brightPreservation}`), '',
			'Publication curves are normalized physical context only. Appearance remains unaccepted and no row is selected automatically.', '',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independent = await verifyColorResetRun(run.runId);
		requireCondition(independent.verified === true && independent.conclusion === conclusion && independent.artifactSetSha256 === manifest.artifactSetSha256, 'CR4I terminal run failed independent verification.');
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion,
			artifactSetSha256: manifest.artifactSetSha256,
			independentlyVerified: independent.verified,
			appearanceAccepted: false,
			candidateFacts: decision.candidateFacts,
			gates: decision.gates,
			progress,
			outputs: analysis.uploadedImages,
		}, null, 2)}\n`);
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
				error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null},
				state: Object.fromEntries(Object.entries(state).map(([key, value]) => [key, value !== null])),
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: `${SCHEMA_PREFIX}-failed-result-v1`, accepted: false, integrityPassed: false, appearanceAccepted: false, error: error instanceof Error ? error.message : String(error)},
				report: `# ${run.runId}: CR4I smooth Bruneton shoulder check\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
