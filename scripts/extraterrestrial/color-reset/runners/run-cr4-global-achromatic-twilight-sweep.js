#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
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
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr4-global-achromatic-twilight-sweep.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const FIXTURE_PATH = path.join(
	COLOR_RESET_ROOT,
	'fixtures',
	'cr4-global-achromatic-twilight-sweep-v1.json',
);
const CR1_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	'000005-six-scene-visual-baseline',
);
const CR2_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	'000007-available-light-inventory',
);
const FIXTURE_SHA256 = '079b8d583575e695c62dff4c9f366dd411544999a29671bb9dad05c80c61a86c';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const EXPECTED_SCENE_IDS = Object.freeze([
	'solar-noon',
	'sunset-minus-60-minutes',
	'sunset-minus-10-minutes',
	'sunset',
	'sunset-plus-10-minutes',
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

function outputImages(fixture) {
	return [...fixture.outputs.panels, ...fixture.outputs.differences, ...fixture.outputs.figures];
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4-global-achromatic-twilight-sweep-input-v1',
		'CR4 fixture schema changed.',
	);
	requireCondition(
		fixture.parents.skyField.namespace === 'color-reset' &&
			fixture.parents.receiverLight.namespace === 'color-reset',
		'CR4 non-default parent namespace changed.',
	);
	requireCondition(
		exactJson(fixture.scenes.map(({id}) => id), EXPECTED_SCENE_IDS),
		'CR4 scene order changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 && fixture.viewport.heightPixels === 400,
		'CR4 viewport changed.',
	);
	requireCondition(
		fixture.receiverLightScalar.quantity === 'photopic total horizontal illuminance' &&
			fixture.receiverLightScalar.units === 'lux' &&
			fixture.receiverLightScalar.sameValueForEveryPixel === true &&
			fixture.receiverLightScalar.namedTimeInput === false &&
			fixture.receiverLightScalar.solarZenithInput === false &&
			fixture.receiverLightScalar.sourceKindInput === false,
		'CR4 receiver-light scalar contract changed.',
	);
	requireCondition(
		fixture.response.transitionIlluminanceLux === 68 &&
			fixture.response.rolloffPower === 4 &&
			exactJson(
				fixture.response.candidates.map(({id, maximumGain}) => ({id, maximumGain})),
				[
					{id: 'restrained-256', maximumGain: 256},
					{id: 'balanced-512', maximumGain: 512},
					{id: 'strong-1024', maximumGain: 1024},
				],
			) &&
			fixture.response.properties.continuousValueAndSlope === true &&
			fixture.response.properties.hardIdentityCutoff === false,
		'CR4 response predeclaration changed.',
	);
	requireCondition(
		fixture.brunetonPreservationEnvelope.fixedBeforeExecution === true &&
			fixture.brunetonPreservationEnvelope.evaluationOnly === true &&
			fixture.brunetonPreservationEnvelope.applicability.minimumIlluminanceLux === 1000 &&
			fixture.brunetonPreservationEnvelope.applicability.namedSceneInput === false &&
			fixture.brunetonPreservationEnvelope.minimumQualifiedCandidateCount === 1,
		'CR4 Bruneton preservation envelope changed.',
	);
	const images = outputImages(fixture);
	requireCondition(images.length === 52, 'CR4 must declare exactly 52 images.');
	requireCondition(new Set(images).size === images.length, 'CR4 image paths must be unique.');
	requireCondition(
		images.at(-1) === fixture.outputs.contactSheet,
		'CR4 contact sheet must be the final declared image.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(Number.isFinite(scene.totalHorizontalIlluminanceLux) && scene.totalHorizontalIlluminanceLux >= 0, `CR4 ${scene.id} scalar is invalid.`);
		requireCondition(scene.field.byteLength === 4096000, `CR4 ${scene.id} field length changed.`);
		requireCondition(scene.mask.byteLength === 256000, `CR4 ${scene.id} mask length changed.`);
	}
}

function selectedCr1Artifacts(fixture) {
	const selected = [fixture.parents.skyField.analysis];
	for (const scene of fixture.scenes) {
		selected.push(scene.field, scene.mask, scene.bruneton, scene.productionLift);
	}
	return selected;
}

async function verifyParent({root, specification, selected, label}) {
	await assertNoReparseEntries(root, `${label} parent run`);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestHash = await sha256File(manifestPath);
	requireCondition(manifestHash === specification.manifestSha256, `${label} manifest changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(manifest.runId === specification.runId, `${label} run id changed.`);
	requireCondition(manifest.conclusion === 'accepted', `${label} parent is not accepted.`);
	requireCondition(manifest.artifactSetSha256 === specification.artifactSetSha256, `${label} artifact set changed.`);
	const byPath = new Map(manifest.artifacts.map((artifact) => [artifact.path, artifact]));
	const artifacts = [];
	for (const expected of selected) {
		const recorded = byPath.get(expected.path);
		requireCondition(recorded, `${label} manifest omits ${expected.path}.`);
		requireCondition(
			recorded.byteLength === expected.byteLength && recorded.sha256 === expected.sha256,
			`${label} manifest identity changed for ${expected.path}.`,
		);
		const actualHash = await sha256File(path.join(root, expected.path));
		requireCondition(actualHash === expected.sha256, `${label} artifact changed: ${expected.path}.`);
		artifacts.push({...expected});
	}
	return {
		namespace: specification.namespace,
		runId: specification.runId,
		manifestSha256: manifestHash,
		artifactSetSha256: manifest.artifactSetSha256,
		selectedArtifacts: artifacts,
	};
}

async function verifyParents(fixture) {
	const [skyField, receiverLight] = await Promise.all([
		verifyParent({
			root: CR1_ROOT,
			specification: fixture.parents.skyField,
			selected: selectedCr1Artifacts(fixture),
			label: 'CR4 CR1',
		}),
		verifyParent({
			root: CR2_ROOT,
			specification: fixture.parents.receiverLight,
			selected: [fixture.parents.receiverLight.analysis],
			label: 'CR4 CR2',
		}),
	]);
	const analysis = await readJson(path.join(CR2_ROOT, fixture.parents.receiverLight.analysis.path));
	const byScene = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const scalarReplay = fixture.scenes.map((scene) => {
		const parent = byScene.get(scene.id);
		const value = parent?.measurement?.photopic?.totalHorizontal?.illuminance;
		requireCondition(value?.units === 'lux', `CR4 CR2 scalar units changed for ${scene.id}.`);
		requireCondition(value.value === scene.totalHorizontalIlluminanceLux, `CR4 CR2 scalar value changed for ${scene.id}.`);
		return {sceneId: scene.id, value: value.value, units: value.units, exact: true};
	});
	return {skyField, receiverLight: {...receiverLight, scalarReplay}};
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR4 control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4 control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4 snapshot and production closure');
	return {manifestSha256: manifestHash, inventory: snapshotInventory, productionSelection};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4-global-achromatic-twilight-sweep.js',
			'color-reset/harness/cr4-global-achromatic-twilight-sweep-browser.js',
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
		entryFiles: ['harness/cr4-global-achromatic-twilight-sweep-browser.js'],
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
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4 implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4 browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageLockSha256 === after.packageLockSha256,
		'CR4 package boundary changed during execution.',
	);
}

function attachArtifactIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	return {
		...result,
		images: result.images.map((image) => ({...image, ...byPath.get(image.artifactPath)})),
	};
}

function elapsedMilliseconds(start, end) {
	return new Date(end).getTime() - new Date(start).getTime();
}

function makeProgress(run, browser, fixture) {
	const first = browser.uploads[0];
	const plate = browser.uploads.find(({path: artifactPath}) => artifactPath === fixture.outputs.contactSheet);
	return {
		schemaId: 'algorithm32-color-reset-cr4-progress-v1',
		initializedAt: run.initializedAt,
		firstImage: first ? {artifactPath: first.path, completedAt: first.completedAt, elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, first.completedAt), targetMilliseconds: 180000} : null,
		decisionPlate: plate ? {artifactPath: plate.path, completedAt: plate.completedAt, elapsedMilliseconds: elapsedMilliseconds(run.initializedAt, plate.completedAt), targetMilliseconds: 600000} : null,
	};
}

function everyRecord(records, predicate) {
	return Array.isArray(records) && records.length > 0 && records.every(predicate);
}

function evaluateGates({analysis, browser, fixture, progress}) {
	const expectedImages = outputImages(fixture);
	const actualImages = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const parity = analysis.scenes.flatMap((scene) =>
		scene.candidates.map((candidate) => candidate.cpuGpuParity.encodedSky),
	);
	const replays = analysis.scenes.map((scene) => scene.controls.bruneton.cpuReplay);
	const isPreservationControl = (scene) =>
		scene.totalHorizontalIlluminanceLux >=
		fixture.brunetonPreservationEnvelope.applicability.minimumIlluminanceLux;
	const preservation = analysis.scenes
		.filter(isPreservationControl)
		.flatMap((scene) => scene.candidates.map((candidate) => candidate.preservation));
	const qualifiedCandidates = fixture.response.candidates.filter((candidate) =>
		analysis.scenes
			.filter(isPreservationControl)
			.every((scene) => {
				const record = scene.candidates.find(({candidateId}) => candidateId === candidate.id);
				return (
					record?.preservation?.maximumAbsoluteRgbCodeDifference <=
						record?.preservation?.envelope?.maximumAbsoluteRgbCodeDifference &&
					record?.preservation?.rgbCodeRmse <= record?.preservation?.envelope?.rgbCodeRmse
				);
			}),
	).map(({id}) => id);
	const twilight = analysis.scenes.filter((scene) => !isPreservationControl(scene));
	const parentCopies = analysis.images.filter(({kind}) => kind === 'parent-control-copy');
	const responseDiagnostics = analysis.response?.curveDiagnostics ?? [];
	const allCandidates = analysis.scenes.flatMap((scene) => scene.candidates);
	const noCandidateWebglErrors = allCandidates.every(
		(candidate) => candidate.gpu.contextLost === false && candidate.gpu.errors.length === 0,
	);
	const gates = {
		browserResultSchema: analysis.schemaId === 'algorithm32-color-reset-cr4-browser-result-v1',
		allRequestedImagesWritten: exactJson(actualImages, expectedImages),
		contactSheetUploadedLast: actualImages.at(-1) === fixture.outputs.contactSheet,
		allImagesPrecedeGateEvaluation:
			analysis.allDeclaredImagesUploaded === true &&
			browser.uploads.length === expectedImages.length &&
			exactJson(analysis.uploadOrder, expectedImages),
		noBrowserServerErrors: browser.serverErrors.length === 0,
		webgl2ContextHealthy: analysis.gpu?.api === 'WebGL2' && analysis.gpu.contextLost === false,
		actualD3d11Backend: /direct3d11|d3d11/iu.test(analysis.gpu?.renderer ?? ''),
		noWebglErrors:
			Array.isArray(analysis.gpu?.startupErrors) && analysis.gpu.startupErrors.length === 0 &&
			Array.isArray(analysis.gpu?.terminalErrors) && analysis.gpu.terminalErrors.length === 0 &&
			noCandidateWebglErrors,
		parentControlsCopiedExactly:
			parentCopies.length === fixture.scenes.length * 2 &&
			parentCopies.every((image) =>
				image.parent?.verified === true &&
				image.sha256 === image.parent.sha256 &&
				image.byteLength === image.parent.byteLength,
			),
		receiverScalarReplayedExactly: analysis.receiverLightScalar?.allFixtureValuesExact === true,
		brunetonCpuParentReplay: everyRecord(replays, (record) => record.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.parentBrunetonReplay.maximumAbsoluteRgbCodeDifference && record.rgbCodeRmse <= fixture.diagnostics.parentBrunetonReplay.maximumRgbCodeRmse),
		candidateGpuCpuParity: everyRecord(parity, (record) => record.maximumAbsoluteRgbCodeDifference <= fixture.diagnostics.gpuCpuParity.maximumAbsoluteRgbCodeDifference && record.rgbCodeRmse <= fixture.diagnostics.gpuCpuParity.maximumRgbCodeRmse),
		responseFiniteMonotonicContinuous:
			everyRecord(responseDiagnostics, (record) =>
				record.finite === true &&
				record.monotonicNonincreasing === true &&
				record.maximumPositiveGainStep === 0 &&
				record.maximumPositiveDerivative <= 0 &&
				record.derivativeAtZeroPerLux === 0,
			) &&
			fixture.response.properties.continuousValueAndSlope === true &&
			fixture.response.properties.hardIdentityCutoff === false,
		oneScalarOneEquation:
			exactJson(analysis.receiverLightScalar, {
				...fixture.receiverLightScalar,
				verification: analysis.receiverLightScalar.verification,
				allFixtureValuesExact: true,
			}) &&
			analysis.response?.id === fixture.response.id &&
			analysis.response?.equation === fixture.response.equation &&
			analysis.response?.operationSpace === fixture.response.operationSpace,
		achromaticBeforeClip:
			analysis.achromaticBeforeClip === true &&
			analysis.achromaticityProof?.passed === true &&
			analysis.achromaticityProof?.tolerance ===
				fixture.diagnostics.achromaticity.maximumUnclippedCrossProductError &&
			allCandidates.every(
				(candidate) =>
					candidate.achromaticity.maximumCrossProductError <=
					fixture.diagnostics.achromaticity.maximumUnclippedCrossProductError,
			),
		preservationMetricsFinite: everyRecord(preservation, (record) => Number.isFinite(record.maximumAbsoluteRgbCodeDifference) && Number.isFinite(record.rgbCodeRmse)),
		minimumPreservingCandidateCount: qualifiedCandidates.length >= fixture.brunetonPreservationEnvelope.minimumQualifiedCandidateCount,
		twilightEffectVisibleNumerically: everyRecord(
			twilight,
			(scene) => scene.candidates.every(
				(candidate) =>
					candidate.preservation.rgbCodeRmse >=
					fixture.diagnostics.twilight.minimumCandidateVsBrunetonRgbCodeRmse,
			),
		),
		twilightBlackAndSaturationBounded:
			analysis.candidateSummary.every(
				(candidate) => candidate.twilightSaturationPassed && candidate.plus60Visible,
			),
		chronologicalMedianStrictlyFalling: analysis.candidateSummary.every(
			(candidate) => candidate.strictlyFallingMedianFromSunset,
		),
		firstImageTimeTarget: progress.firstImage !== null && progress.firstImage.elapsedMilliseconds <= progress.firstImage.targetMilliseconds,
		decisionPlateTimeTarget: progress.decisionPlate !== null && progress.decisionPlate.elapsedMilliseconds <= progress.decisionPlate.targetMilliseconds,
	};
	const integrityNames = [
		'browserResultSchema', 'allRequestedImagesWritten', 'contactSheetUploadedLast',
		'allImagesPrecedeGateEvaluation', 'noBrowserServerErrors', 'webgl2ContextHealthy',
		'actualD3d11Backend', 'noWebglErrors', 'parentControlsCopiedExactly',
		'receiverScalarReplayedExactly', 'brunetonCpuParentReplay', 'candidateGpuCpuParity',
		'firstImageTimeTarget', 'decisionPlateTimeTarget',
	];
	const integrityPassed = integrityNames.every((name) => gates[name]);
	const scientificPassed = Object.entries(gates)
		.filter(([name]) => !integrityNames.includes(name))
		.every(([, passed]) => passed);
	return {gates, integrityPassed, scientificPassed, accepted: integrityPassed && scientificPassed, qualifiedCandidates};
}

function makePanelIdentities(analysis, fixture) {
	const scenes = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	return {
		schemaId: 'algorithm32-color-reset-cr4-panel-identities-v1',
		responseId: fixture.response.id,
		panels: analysis.images.filter(({artifactPath}) => artifactPath.startsWith('captures/')).map((image) => ({
			artifactPath: image.artifactPath,
			sceneId: image.sceneId,
			panelId: image.controlId ?? image.candidateId,
			totalHorizontalIlluminanceLux:
				scenes.get(image.sceneId).totalHorizontalIlluminanceLux,
			gain: image.candidateId
				? scenes.get(image.sceneId).candidates.find(
					({candidateId}) => candidateId === image.candidateId,
				).gain
				: null,
			byteLength: image.byteLength,
			sha256: image.sha256,
		})),
	};
}

function makeImageDerivations(analysis, fixture, implementationBefore) {
	const imagesByPath = new Map(analysis.images.map((image) => [image.artifactPath, image]));
	const scenes = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const fixtureIdentity = {
		path: 'scripts/extraterrestrial/color-reset/fixtures/cr4-global-achromatic-twilight-sweep-v1.json',
		sha256: FIXTURE_SHA256,
	};
	const receiverAnalysisIdentity = {
		role: 'receiver-light-scalar source',
		...fixture.parents.receiverLight,
		...fixture.parents.receiverLight.analysis,
	};
	delete receiverAnalysisIdentity.analysis;
	const implementationIdentity = {
		candidateModelPath:
			'scripts/extraterrestrial/color-reset/color/Cr4GlobalAchromaticTwilightColorDisplayModel.js',
		browserHarnessPath:
			'scripts/extraterrestrial/color-reset/harness/cr4-global-achromatic-twilight-sweep-browser.js',
		staticClosureAggregateSha256: implementationBefore.implementationInventory.aggregateSha256,
		productionControlSnapshotManifestSha256: SNAPSHOT_MANIFEST_SHA256,
		productionControlSnapshotInventorySha256: SNAPSHOT_INVENTORY_SHA256,
	};
	const artifactIdentity = (artifactPath) => {
		const image = imagesByPath.get(artifactPath);
		return image ? {artifactPath, byteLength: image.byteLength, sha256: image.sha256} : {artifactPath};
	};
	const sceneFieldIdentity = (scene) => ({
		role: 'CR1 pre-display linear RGBY field',
		namespace: fixture.parents.skyField.namespace,
		runId: fixture.parents.skyField.runId,
		...scene.inputs.field,
	});
	const sceneMaskIdentity = (scene) => ({
		role: 'CR1 sky/geometry evaluation mask',
		namespace: fixture.parents.skyField.namespace,
		runId: fixture.parents.skyField.runId,
		...scene.inputs.mask,
	});
	const allSceneFieldsAndMasks = () => analysis.scenes.flatMap((scene) => [
		sceneFieldIdentity(scene),
		sceneMaskIdentity(scene),
	]);
	const derive = (image) => {
		const scene = image.sceneId ? scenes.get(image.sceneId) : null;
		const common = {
			artifactPath: image.artifactPath,
			kind: image.kind,
			sceneId: image.sceneId ?? null,
			candidateId: image.candidateId ?? null,
			result: {byteLength: image.byteLength, sha256: image.sha256},
		};
		if (image.kind === 'parent-control-copy') {
			return {
				...common,
				parentInputs: [{
					role: 'accepted CR1 control PNG',
					namespace: fixture.parents.skyField.namespace,
					runId: fixture.parents.skyField.runId,
					...image.parent,
				}],
				operation: 'Byte-exact copy of the accepted CR1 control PNG.',
				implementation: 'browser fetch verification followed by unmodified binary upload',
				materialParameters: {controlId: image.controlId},
			};
		}
		if (image.kind === 'webgl2-rgba32f-candidate-replay') {
			const candidate = scene.candidates.find(({candidateId}) => candidateId === image.candidateId);
			return {
				...common,
				parentInputs: [
					sceneFieldIdentity(scene),
					receiverAnalysisIdentity,
				],
				qualificationInputs: [sceneMaskIdentity(scene)],
				operation: fixture.response.equation,
				implementation: {
					...implementationIdentity,
					fragmentSourceSha256: candidate.gpu.fragmentSourceSha256,
				},
				materialParameters: {
					totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
					curve: candidate.curve,
					gain: candidate.gain,
					viewport: fixture.viewport,
				},
			};
		}
		if (image.kind === 'amplified-absolute-rgb-code-difference') {
			const candidate = scene.candidates.find(
				({candidateId}) => candidateId === image.candidateId,
			);
			return {
				...common,
				parentInputs: [
					sceneFieldIdentity(scene),
					receiverAnalysisIdentity,
				],
				operation:
					'For each RGB code, render independent CPU Bruneton and CR4 values from the same float32 field, then output min(255, abs(candidateCode - brunetonCode) * amplification).',
				implementation: {
					...implementationIdentity,
					cpuModels: ['BrunetonColorDisplayModel', 'Cr4GlobalAchromaticTwilightColorDisplayModel'],
					quantization: 'round(clamp(displayChannel, 0, 1) * 255)',
				},
				materialParameters: {
					amplification: image.amplification,
					totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
					curve: candidate.curve,
					gain: candidate.gain,
				},
			};
		}
		if (image.kind === 'response-curves') {
			return {
				...common,
				parentInputs: [fixtureIdentity],
				operation:
					'Sample the one CR4 response equation for each fixed G row over the declared logarithmic illuminance domain and draw gain plus analytic derivative diagnostics.',
				implementation: implementationIdentity,
				materialParameters: {
					response: fixture.response,
					plot: fixture.diagnostics.curvePlot,
				},
			};
		}
		if (image.kind === 'bruneton-preservation') {
			return {
				...common,
				parentInputs: [
					fixtureIdentity,
					receiverAnalysisIdentity,
					...allSceneFieldsAndMasks(),
				],
				operation:
					'Independently CPU-render and quantize Bruneton and each CR4 row, compare RGB codes only where the CR1 sky mask is zero, and plot maximum absolute difference and RMSE against the receiver-light-indexed envelope.',
				implementation: implementationIdentity,
				materialParameters: {
					response: fixture.response,
					preservationEnvelope: fixture.brunetonPreservationEnvelope,
					plot: fixture.diagnostics.preservationPlot,
				},
			};
		}
		if (image.kind === 'black-saturation-summary') {
			return {
				...common,
				parentInputs: [
					...fixture.outputs.panels.map(artifactIdentity),
					...analysis.scenes.map(sceneMaskIdentity),
				],
				operation:
					'For every persisted control and candidate PNG, count all-zero and any-255 RGB predicates only where the corresponding CR1 sky mask is zero, divide by sky-pixel count, and draw both fractions.',
				implementation: implementationIdentity,
				materialParameters: {plot: fixture.diagnostics.blackSaturationPlot},
			};
		}
		const panelParents = fixture.outputs.panels.map(artifactIdentity);
		return {
			...common,
			parentInputs: [fixtureIdentity, ...panelParents],
			operation:
				'Lay out the 30 declared control and candidate panel pixel arrays in fixture order, then add fixed scene, illuminance, and row labels.',
			implementation: implementationIdentity,
			materialParameters: {
				panelOrder: fixture.outputs.panels,
				viewport: {width: image.width, height: image.height},
			},
		};
	};
	return {
		schemaId: 'algorithm32-color-reset-cr4-image-derivations-v1',
		parents: fixture.parents,
		response: fixture.response,
		differenceAmplification: fixture.diagnostics.differenceAmplification,
		images: analysis.images.map(derive),
	};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR4 accepts no arguments.');
	const fixture = await readJson(FIXTURE_PATH);
	const run = await initializeColorResetRunRecord({
		slug: 'global-achromatic-twilight-sweep',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr4-inputs-v1',
			increment: 'CR4',
			fixture: 'scripts/extraterrestrial/color-reset/fixtures/cr4-global-achromatic-twilight-sweep-v1.json',
			fixtureSha256: FIXTURE_SHA256,
			parents: fixture.parents,
			receiverLightScalar: fixture.receiverLightScalar,
			response: fixture.response,
			brunetonPreservationEnvelope: fixture.brunetonPreservationEnvelope,
			outputImages: outputImages(fixture),
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr4-provenance-v1',
			operation: 'Rehydrate accepted CR1 pre-display fields and CR2 total-horizontal receiver illuminance, replay unchanged Bruneton and production controls, render three predeclared global-achromatic responses through independent CPU and WebGL2 implementations, and write every image before gates.',
			implementation: [
				'scripts/extraterrestrial/color-reset/color/Cr4GlobalAchromaticTwilightColorDisplayModel.js',
				'scripts/extraterrestrial/color-reset/harness/cr4-global-achromatic-twilight-sweep-browser.js',
				'scripts/extraterrestrial/color-reset/runners/run-cr4-global-achromatic-twilight-sweep.js',
			],
			physicalInput: 'unchanged CR1 W27/Q30/Native15 pre-display field; no atmospheric or cache execution',
			derivation: fixture.response.equation,
			exclusions: ['no physical-field change', 'no per-channel curve', 'no hard Bruneton cutoff', 'no gamut shoulder', 'no appearance selection', 'no production change'],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr4-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr4-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#bright-scene-preservation',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr4---test-the-smallest-twilight-display-adjustment',
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
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
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		requireCondition(await sha256File(FIXTURE_PATH) === FIXTURE_SHA256, 'CR4 fixture changed after predeclaration.');
		verifyFixtureContract(fixture);
		parentsBefore = await verifyParents(fixture);
		await run.writeJsonArtifact('evidence/parents-before.json', parentsBefore);
		await run.writeJsonArtifact('evidence/control-snapshot-verification.json', await verifyControlSnapshot());
		implementationBefore = await captureImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', implementationBefore);
		protectedBefore = {algorithm32: await createFileInventory(ALGORITHM32_ROOT), flat32: await createFileInventory(FLAT32_ROOT)};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		await run.writeJsonArtifact('browser/config.json', fixture);

		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr4-global-achromatic-twilight-sweep-browser.js',
			exportName: 'runCr4GlobalAchromaticTwilightSweepBrowser',
			servedRoots: {'/cr1/': CR1_ROOT, '/cr2/': CR2_ROOT},
			allowedArtifactPaths: outputImages(fixture),
			uploadLimitBytes: 64 * 1024 * 1024,
			timeoutMilliseconds: 900000,
		});
		const analysis = {
			...attachArtifactIdentities(browser.result, browser.uploads),
			runtimeEnvironment: browser.runtimeEnvironment,
		};
		await run.writeJsonArtifact('evidence/analysis.json', analysis);
		await run.writeJsonArtifact('evidence/panel-identities.json', makePanelIdentities(analysis, fixture));
		await run.writeJsonArtifact(
			'evidence/image-derivations.json',
			makeImageDerivations(analysis, fixture, implementationBefore),
		);

		implementationAfter = await captureImplementationAfter(implementationBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', implementationAfter);
		assertImplementationUnchanged(implementationBefore, implementationAfter);
		parentsAfter = await verifyParents(fixture);
		await run.writeJsonArtifact('evidence/parents-after.json', parentsAfter);
		requireCondition(exactJson(parentsBefore, parentsAfter), 'CR4 parent evidence changed during execution.');
		protectedAfter = {algorithm32: await createFileInventory(ALGORITHM32_ROOT), flat32: await createFileInventory(FLAT32_ROOT)};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		assertFileInventoriesEqual(protectedBefore.algorithm32, protectedAfter.algorithm32, 'CR4 protected Algorithm32 source');
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4 protected Flat32 source');

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress});
		const conclusion = !decision.integrityPassed ? 'failed' : decision.accepted ? 'accepted' : 'rejected';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr4-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			scientificPassed: decision.scientificPassed,
			ownerAppearanceReviewRequired: true,
			appearanceCandidateAccepted: false,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			qualifiedPreservationCandidates: decision.qualifiedCandidates,
			progress,
			parents: parentsAfter,
			outputs: analysis.images,
			protectedSourceUnchanged: true,
			parentsUnchanged: true,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4 global achromatic twilight sweep`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All 30 control/candidate panels, 18 amplified difference images, three diagnostic figures, and the decision plate were written before any gate was evaluated.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			`Preservation-qualified rows: ${decision.qualifiedCandidates.join(', ') || 'none'}.`,
			'',
			'Owner appearance review remains mandatory. This run does not select or accept a final CR4 appearance candidate.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const verification = await verifyColorResetRun(run.runId);
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion, artifactSetSha256: manifest.artifactSetSha256, independentlyVerified: verification.verified, qualifiedCandidates: decision.qualifiedCandidates, gates: decision.gates, progress}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', {
					schemaId: 'algorithm32-color-reset-cr4-progress-v1',
					initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(),
					error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr4-failure-v1',
				error: {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null},
				implementationBeforeRecorded: implementationBefore !== null,
				implementationAfterRecorded: implementationAfter !== null,
				parentsBeforeRecorded: parentsBefore !== null,
				parentsAfterRecorded: parentsAfter !== null,
				protectedBeforeRecorded: protectedBefore !== null,
				protectedAfterRecorded: protectedAfter !== null,
			});
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {schemaId: 'algorithm32-color-reset-cr4-failed-result-v1', accepted: false, integrityPassed: false, ownerAppearanceReviewRequired: true, error: error instanceof Error ? error.message : String(error)},
				report: `# ${run.runId}: CR4 global achromatic twilight sweep\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
