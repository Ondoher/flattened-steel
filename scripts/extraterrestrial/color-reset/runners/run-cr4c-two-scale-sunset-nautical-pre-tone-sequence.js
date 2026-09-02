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
	'node scripts/extraterrestrial/color-reset/runners/run-cr4c-two-scale-sunset-nautical-pre-tone-sequence.js';
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
	'scripts/extraterrestrial/color-reset/fixtures/cr4c-two-scale-sunset-nautical-pre-tone-sequence-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4c-two-scale-sunset-nautical-pre-tone-sequence-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/color/Cr4cTwoScalePreToneExposureColorDisplayModel.js';
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const SCHEMA_PREFIX = 'algorithm32-color-reset-cr4c-two-scale-sunset-nautical-pre-tone-sequence';

const FIXTURE_SHA256 = 'e408e258bc221c6b5e496e8b1f5897fc0860b9e4dffb029b4d85198bfcf4f9d0';
const HARNESS_SHA256 = 'e6df96d20e08decaa86397cfad0696c5a93f66ca9be309fbffab02f628a13793';
const MODEL_SHA256 = '36e66141a2aa820c7696ad100f1d71685efd02768c23b22a77a7573b8746c70d';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const EXPECTED_PARENT_RUNS = Object.freeze({
	skyField: '000005-six-scene-visual-baseline',
	receiverLight: '000007-available-light-inventory',
	qualitativeStructure: '000019-native15-sunset-paper-visual-comparison',
	selectedBracket: '000020-sunset-pre-tone-exposure-bracket',
	rejectedChronology: '000021-sunset-nautical-pre-tone-sequence',
});
const PARENT_ORDER = Object.freeze([
	'skyField',
	'receiverLight',
	'qualitativeStructure',
	'selectedBracket',
	'rejectedChronology',
]);
const EXPECTED_SCENE_IDS = Object.freeze(['sunset', 'sunset-plus-10-minutes', 'sunset-plus-60-minutes']);
const EXPECTED_BRIGHT_CONTROL_IDS = Object.freeze(['solar-noon', 'sunset-minus-60-minutes', 'sunset-minus-10-minutes']);
const EXPECTED_SELECTED_CANDIDATE = Object.freeze({
	id: 'pre-tone-two-scale',
	sunsetAmplitude: 3.5,
	sunsetTransitionIlluminanceLux: 980,
	sunsetRolloffPower: 9,
	nauticalAmplitude: 5300,
	nauticalTransitionIlluminanceLux: 1,
	nauticalRolloffPower: 3,
});
const EXPECTED_PARENT_SELECTED_CANDIDATE = Object.freeze({
	id: 'pre-tone-4096',
	maximumGain: 4096,
	transitionIlluminanceLux: 3,
	rolloffPower: 1.3,
	sunsetGain: 3.1143751192082494,
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
		fixture.schemaId === 'algorithm32-color-reset-cr4c-two-scale-sunset-nautical-pre-tone-sequence-input-v1',
		'CR4C fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.boundedResponseRevision === true &&
			fixture.claimBoundary?.paperSimilarityMetric === false &&
			fixture.claimBoundary?.paperTarget === false &&
			fixture.claimBoundary?.physicalTransportReexecution === false &&
			fixture.claimBoundary?.structureDiagnosticGatesCandidate === false &&
			fixture.claimBoundary?.brightControlMetricsGateCandidate === false &&
			fixture.claimBoundary?.rejectedChronologyMetricsGateCandidate === false &&
			fixture.claimBoundary?.productionClaim === false,
		'CR4C two-scale revision claim boundary changed.',
	);
	for (const [parentId, expectedRunId] of Object.entries(EXPECTED_PARENT_RUNS)) {
		const parent = fixture.parents?.[parentId];
		requireCondition(
			parent?.namespace === 'color-reset' && parent.runId === expectedRunId,
			`CR4C ${parentId} parent declaration changed.`,
		);
	}
	requireCondition(
		fixture.parents.qualitativeStructure.role.includes('Qualitative method provenance only') &&
			fixture.parents.selectedBracket.role.includes('appearanceAccepted remains false') &&
			fixture.parents.rejectedChronology.role.includes('Read-only rejected diagnostic parent') &&
			fixture.parents.rejectedChronology.conclusion === 'rejected',
		'CR4C parent claim roles changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4C viewport changed.',
	);
	requireCondition(
		exactJson(
			fixture.scenes.map(({id}) => id),
			EXPECTED_SCENE_IDS,
		),
		'CR4C scene order changed.',
	);
	for (const scene of fixture.scenes) {
		requireCondition(
			scene.totalHorizontalIlluminance?.units === 'lux' &&
				Number.isFinite(scene.totalHorizontalIlluminance.value) &&
				scene.totalHorizontalIlluminance.value >= 0 &&
				Number.isFinite(scene.expectedCandidateGain) &&
				scene.expectedCandidateGain >= 1,
			`CR4C ${scene.id} receiver-light or gain declaration is invalid.`,
		);
		requireCondition(
			scene.field.byteLength === 4_096_000 &&
				scene.mask.byteLength === 256_000 &&
				Number.isFinite(scene.bruneton.byteLength),
			`CR4C ${scene.id} CR1 replay shape changed.`,
		);
		requireCondition(
			scene.diffuseHorizontalPacket?.basisHash ===
				'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891' &&
				scene.diffuseHorizontalPacket.channelCount === 15 &&
				scene.diffuseHorizontalPacket.units === 'W m^-2 nm^-1' &&
				Number.isFinite(scene.diffuseHorizontalPacket.integratedIrradianceWm2) &&
				scene.diffuseHorizontalPacket.integratedIrradianceWm2 > 0 &&
				Number.isFinite(scene.diffuseHorizontalPacket.structureScale) &&
				scene.diffuseHorizontalPacket.structureScale > 0,
			`CR4C ${scene.id} diffuse structural declaration changed.`,
		);
	}
	requireCondition(
		fixture.receiverLightScalar.quantity === 'photopic total horizontal illuminance' &&
			fixture.receiverLightScalar.units === 'lux' &&
			fixture.receiverLightScalar.sameValueForEveryPixel === true &&
			fixture.receiverLightScalar.sameValueForEveryRgbChannel === true &&
			fixture.receiverLightScalar.namedTimeInput === false &&
			fixture.receiverLightScalar.solarZenithInput === false &&
			fixture.receiverLightScalar.sourceKindInput === false &&
			fixture.receiverLightScalar.imageDerived === false,
		'CR4C receiver-light scalar contract changed.',
	);
	requireCondition(
		fixture.response.id === 'color-reset-cr4c-two-scale-total-horizontal-illuminance-pre-tone-gain-v1' &&
			fixture.response.operationSpace === 'signed projected linear sRGB before unchanged Bruneton exponential' &&
			fixture.response.properties?.finiteForNonnegativeIlluminance === true &&
			fixture.response.properties?.analyticForNonnegativeIlluminance === true &&
			fixture.response.properties?.monotonicNonincreasing === true &&
			fixture.response.properties?.derivativeAtZeroPerLux === 0 &&
			fixture.response.properties?.hardIdentityCutoff === false &&
			fixture.response.properties?.namedSceneBranch === false &&
			exactJson(
				Object.fromEntries(
					Object.keys(EXPECTED_SELECTED_CANDIDATE).map((key) => [
						key,
						fixture.response.selectedCandidate[key],
					]),
				),
				EXPECTED_SELECTED_CANDIDATE,
			),
		'CR4C selected two-scale pre-tone response changed.',
	);
	requireCondition(
		fixture.structureDiagnostic.id === 'color-reset-cr4c-equal-36-w-m-2-independent-structure-v1' &&
			fixture.structureDiagnostic.targetDiffuseSkyIrradiance?.value === 36 &&
			fixture.structureDiagnostic.targetDiffuseSkyIrradiance?.units === 'W m^-2' &&
			fixture.structureDiagnostic.independentPerScene === true &&
			fixture.structureDiagnostic.candidateExposure === false &&
			fixture.structureDiagnostic.brightnessTarget === false &&
			fixture.structureDiagnostic.appearanceTarget === false &&
			fixture.structureDiagnostic.gatesCandidate === false,
		'CR4C structure-only diagnostic boundary changed.',
	);
	requireCondition(
		fixture.diagnostics.analyticResponseProof?.minimumIlluminanceLux === 0 &&
			fixture.diagnostics.analyticResponseProof?.maximumIlluminanceLux === 200_000 &&
			fixture.diagnostics.analyticResponseProof?.positiveLogSampleCount === 4096 &&
			fixture.diagnostics.analyticResponseProof?.expectedDerivativeAtZeroPerLux === 0 &&
			Number.isFinite(fixture.diagnostics.analyticResponseProof?.maximumDerivativeAbsoluteError) &&
			Number.isFinite(fixture.diagnostics.analyticResponseProof?.maximumDerivativeRelativeError),
		'CR4C analytic response proof contract changed.',
	);
	requireCondition(
		fixture.diagnostics.brightControlReportOnly?.gatesCandidate === false &&
			fixture.diagnostics.rejectedChronologyComparison?.gatesCandidate === false &&
			fixture.diagnostics.rejectedChronologyComparison?.requireExactImageAndMetricProvenance === true &&
			fixture.diagnostics.chronologyMedianConvention ===
				'true median: percentile(sortedValues, 50) over inclusive percentile points 0 through 100',
		'CR4C report-only or true-median diagnostic contract changed.',
	);
	requireCondition(
		exactJson(
			fixture.brightControls.map(({id}) => id),
			EXPECTED_BRIGHT_CONTROL_IDS,
		) &&
			fixture.brightControls.every(
				(control) =>
					control.totalHorizontalIlluminance?.units === 'lux' &&
					Number.isFinite(control.totalHorizontalIlluminance.value) &&
					control.totalHorizontalIlluminance.value >= 0 &&
					Number.isFinite(control.expectedCandidateGain) &&
					control.expectedCandidateGain >= 1,
			),
		'CR4C bright-control report-only inputs changed.',
	);
	const groupedImages = [
		...fixture.outputs.controls,
		...fixture.outputs.candidates,
		...fixture.outputs.structureDiagnostics,
		...fixture.outputs.masks,
		...fixture.outputs.differences,
		...fixture.outputs.figures,
	];
	const images = outputImages(fixture);
	requireCondition(
		images.length === 17 && exactJson(images, groupedImages),
		'CR4C requested image order must contain the exact 17 declared grouped images.',
	);
	requireCondition(
		new Set(images).size === images.length && images.every(isArtifactPath),
		'CR4C output paths must be unique contained artifact paths.',
	);
	requireCondition(
		images.every((artifactPath) => artifactPath.endsWith('.png')) &&
			images.at(-1) === fixture.outputs.decisionPlate,
		'CR4C decision plate must be the final declared PNG.',
	);
}

function selectedArtifacts(fixture, parentId) {
	if (parentId === 'skyField') {
		return [
			fixture.parents.skyField.analysis,
			...fixture.scenes.flatMap((scene) => [scene.field, scene.mask, scene.bruneton]),
		];
	}
	if (parentId === 'selectedBracket') {
		return [fixture.parents.selectedBracket.analysis, fixture.parents.selectedBracket.selectedSunsetPanel];
	}
	if (parentId === 'rejectedChronology') {
		return [fixture.parents.rejectedChronology.analysis, ...fixture.parents.rejectedChronology.candidates];
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
			const canonical = await verifyOrdinaryCanonicalDirectory(resolved, `CR4C ${parentId} parent`);
			assertLexicallyContained(canonicalRunsRoot, canonical, `CR4C ${parentId} parent`);
			await assertNoReparseEntries(canonical, `CR4C ${parentId} parent`);
			return [parentId, canonical];
		}),
	);
	const directories = Object.fromEntries(entries);
	requireCondition(
		new Set(Object.values(directories).map(pathComparisonKey)).size === PARENT_ORDER.length,
		'CR4C explicit parent selectors must resolve to five distinct contained runs.',
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

function integrateDiffuseHorizontal(sceneMeasurement) {
	const packet = sceneMeasurement?.measurement?.packets?.diffuseHorizontal;
	const channels = sceneMeasurement?.measurement?.spectralBasis?.channels;
	requireCondition(
		packet?.kind === 'algorithm32-spectral-packet' &&
			packet.quantity === 'spectral-irradiance-density' &&
			packet.units === 'W m^-2 nm^-1' &&
			packet.semantics === 'contiguous-wavelength-bin-average' &&
			Array.isArray(packet.values) &&
			Array.isArray(channels) &&
			packet.values.length === 15 &&
			channels.length === 15,
		`CR4C ${sceneMeasurement?.sceneId ?? 'unknown scene'} diffuse packet shape changed.`,
	);
	let integratedIrradianceWm2 = 0;
	for (let index = 0; index < packet.values.length; index += 1) {
		const value = packet.values[index];
		const width = channels[index]?.width;
		requireCondition(
			Number.isFinite(value) && width?.units === 'nanometers' && Number.isFinite(width.value),
			`CR4C ${sceneMeasurement.sceneId} diffuse packet contains an invalid channel.`,
		);
		integratedIrradianceWm2 += value * width.value;
	}
	return {packet, integratedIrradianceWm2, structureScale: 36 / integratedIrradianceWm2};
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
				label: `CR4C ${parentId}`,
			}),
		]),
	);
	const verified = Object.fromEntries(verifiedEntries);
	const [cr1Analysis, cr2Analysis, cr4aAnalysis, cr4bAnalysis, rejectedCr4cAnalysis] = await Promise.all([
		readJson(path.join(parentDirectories.skyField, ...fixture.parents.skyField.analysis.path.split('/'))),
		readJson(path.join(parentDirectories.receiverLight, ...fixture.parents.receiverLight.analysis.path.split('/'))),
		readJson(
			path.join(
				parentDirectories.qualitativeStructure,
				...fixture.parents.qualitativeStructure.analysis.path.split('/'),
			),
		),
		readJson(
			path.join(parentDirectories.selectedBracket, ...fixture.parents.selectedBracket.analysis.path.split('/')),
		),
		readJson(
			path.join(
				parentDirectories.rejectedChronology,
				...fixture.parents.rejectedChronology.analysis.path.split('/'),
			),
		),
	]);
	requireCondition(
		cr1Analysis.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		'CR4C CR1 analysis schema changed.',
	);
	requireCondition(
		cr2Analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR4C CR2 analysis schema changed.',
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
			`CR4C CR1 replay identity changed for ${scene.id}.`,
		);
		cr1Replay.push({sceneId: scene.id, field, mask, bruneton});

		const cr2Scene = cr2Analysis.scenes.find(({sceneId}) => sceneId === scene.id);
		const total = cr2Scene?.measurement?.photopic?.totalHorizontal?.illuminance;
		const integrated = integrateDiffuseHorizontal(cr2Scene);
		requireCondition(
			total?.units === scene.totalHorizontalIlluminance.units &&
				total.value === scene.totalHorizontalIlluminance.value,
			`CR4C CR2 receiver-light value changed for ${scene.id}.`,
		);
		requireCondition(
			integrated.packet.basisHash === scene.diffuseHorizontalPacket.basisHash &&
				integrated.packet.contentHash === scene.diffuseHorizontalPacket.contentHash &&
				nearlyEqual(
					integrated.integratedIrradianceWm2,
					scene.diffuseHorizontalPacket.integratedIrradianceWm2,
					fixture.diagnostics.expectedValueAbsoluteError,
					fixture.diagnostics.structureScaleRelativeError,
				) &&
				nearlyEqual(
					integrated.structureScale,
					scene.diffuseHorizontalPacket.structureScale,
					fixture.diagnostics.expectedValueAbsoluteError,
					fixture.diagnostics.structureScaleRelativeError,
				),
			`CR4C CR2 structural normalization changed for ${scene.id}.`,
		);
		cr2Replay.push({
			sceneId: scene.id,
			totalHorizontalIlluminance: total,
			diffuseHorizontalPacket: {
				basisHash: integrated.packet.basisHash,
				contentHash: integrated.packet.contentHash,
				integratedIrradianceWm2: integrated.integratedIrradianceWm2,
				structureScale: integrated.structureScale,
			},
			exact: true,
		});
	}

	requireCondition(
		cr4aAnalysis.schemaId === 'algorithm32-color-reset-cr4a-native15-sunset-paper-analysis-v1' &&
			cr4aAnalysis.acceptedForIntegrityEvaluation === true &&
			cr4aAnalysis.appearanceAccepted === false &&
			cr4aAnalysis.objectiveAccuracyClaim === false &&
			cr4aAnalysis.paperSimilarityMetric === null,
		'CR4C CR4A parent exceeded its qualitative-only claim boundary.',
	);
	requireCondition(
		cr4bAnalysis.schemaId === 'algorithm32-color-reset-cr4b-browser-result-v1' &&
			cr4bAnalysis.renderComplete === true &&
			cr4bAnalysis.appearanceAccepted === false &&
			cr4bAnalysis.paperSimilarityMetric === null,
		'CR4C CR4B selected-bracket parent claim boundary changed.',
	);
	const selected = cr4bAnalysis.candidates.find(
		(candidate) => candidate.candidateId === EXPECTED_PARENT_SELECTED_CANDIDATE.id,
	);
	requireCondition(
		selected?.gpu?.artifactPath === fixture.parents.selectedBracket.selectedSunsetPanel.path &&
			selected.gain === EXPECTED_PARENT_SELECTED_CANDIDATE.sunsetGain &&
			exactJson(selected.curve, {
				id: EXPECTED_PARENT_SELECTED_CANDIDATE.id,
				maximumGain: EXPECTED_PARENT_SELECTED_CANDIDATE.maximumGain,
				transitionIlluminanceLux: EXPECTED_PARENT_SELECTED_CANDIDATE.transitionIlluminanceLux,
				rolloffPower: EXPECTED_PARENT_SELECTED_CANDIDATE.rolloffPower,
			}),
		'CR4C provisional CR4B selected row changed.',
	);
	requireCondition(
		rejectedCr4cAnalysis.schemaId === 'algorithm32-color-reset-cr4c-browser-result-v1' &&
			rejectedCr4cAnalysis.renderComplete === true &&
			rejectedCr4cAnalysis.appearanceAccepted === false &&
			rejectedCr4cAnalysis.paperSimilarityMetric === null &&
			rejectedCr4cAnalysis.chronology?.allStrictlyDecreasing === false,
		'CR4C rejected chronology parent claim boundary changed.',
	);
	const rejectedCandidatePaths = new Set(
		(rejectedCr4cAnalysis.uploadedImages ?? []).map((artifact) => artifact.artifactPath ?? artifact.path),
	);
	requireCondition(
		fixture.parents.rejectedChronology.candidates.every(({path: artifactPath}) =>
			rejectedCandidatePaths.has(artifactPath),
		),
		'CR4C rejected chronology parent omitted a declared candidate image.',
	);
	const rejectedChronology = {
		medianConvention: fixture.parents.rejectedChronology.chronology.medianConvention,
		allStrictlyDecreasing: rejectedCr4cAnalysis.chronology.allStrictlyDecreasing,
		regions: rejectedCr4cAnalysis.chronology.regions.map(({regionId, values}) => ({regionId, values})),
	};
	requireCondition(
		exactJson(rejectedChronology, fixture.parents.rejectedChronology.chronology),
		'CR4C rejected chronology parent medians changed.',
	);
	return {
		skyField: {...verified.skyField, replay: cr1Replay},
		receiverLight: {...verified.receiverLight, replay: cr2Replay},
		qualitativeStructure: {
			...verified.qualitativeStructure,
			role: fixture.parents.qualitativeStructure.role,
			analysisClaim: {
				acceptedForIntegrityEvaluation: true,
				appearanceAccepted: false,
				objectiveAccuracyClaim: false,
				paperSimilarityMetric: null,
			},
		},
		selectedBracket: {
			...verified.selectedBracket,
			role: fixture.parents.selectedBracket.role,
			selectedCandidate: {
				candidateId: selected.candidateId,
				curve: selected.curve,
				gain: selected.gain,
				artifactPath: selected.gpu.artifactPath,
			},
			appearanceAccepted: false,
		},
		rejectedChronology: {
			...verified.rejectedChronology,
			role: fixture.parents.rejectedChronology.role,
			conclusion: 'rejected',
			chronology: rejectedChronology,
			candidates: fixture.parents.rejectedChronology.candidates,
			appearanceAccepted: false,
		},
	};
}

function assertParentsUnchanged(before, after) {
	for (const parentId of PARENT_ORDER) {
		assertParentSnapshotUnchanged(before[parentId], after[parentId], `CR4C ${parentId} parent`);
	}
	return true;
}

async function verifyControlSnapshot() {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestSha256 === SNAPSHOT_MANIFEST_SHA256, 'CR4C production control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4C production control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {include: (relativePath) => selectedPaths.has(relativePath)}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4C snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4C snapshot and production closure');
	return {manifestSha256, inventory: snapshotInventory, productionSelection};
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(MODEL_PATH),
	]);
	requireCondition(FIXTURE_SHA256.length === 64, 'CR4C fixture SHA-256 pin is not finalized.');
	requireCondition(HARNESS_SHA256.length === 64, 'CR4C browser-harness SHA-256 pin is not finalized.');
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4C fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4C browser harness identity changed.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4C Color model identity changed.');
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
			'color-reset/runners/run-cr4c-two-scale-sunset-nautical-pre-tone-sequence.js',
			'color-reset/harness/cr4c-two-scale-sunset-nautical-pre-tone-sequence-browser.js',
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
		entryFiles: ['harness/cr4c-two-scale-sunset-nautical-pre-tone-sequence-browser.js'],
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
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4C implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4C browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 && before.packageLockSha256 === after.packageLockSha256,
		'CR4C package boundary changed during execution.',
	);
}

function attachUploadIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const uploadedImages = result.uploadedImages.map((image) => {
		const artifactPath = image.artifactPath ?? image.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4C browser result omitted upload ${artifactPath}.`);
		return {...image, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	return {...result, uploadedImages};
}

function attachEvidenceImageIdentities(evidence, uploads, label) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const records = Array.isArray(evidence) ? evidence : (evidence?.panels ?? evidence?.images);
	requireCondition(Array.isArray(records), `CR4C ${label} records are missing.`);
	const attached = records.map((record) => {
		const artifactPath = record.artifactPath ?? record.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4C ${label} references unknown image ${artifactPath}.`);
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
	const chronology = analysis.chronology;
	const gates = {
		browserResultSchema: analysis.schemaId === 'algorithm32-color-reset-cr4c-two-scale-browser-result-v1',
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
		browserParentsAuthenticated: PARENT_ORDER.every(
			(parentId) =>
				analysis.parents?.[parentId]?.runId === fixture.parents[parentId].runId &&
				analysis.parents?.[parentId]?.analysis?.verified === true &&
				analysis.parents?.[parentId]?.analysis?.sha256 === fixture.parents[parentId].analysis.sha256,
		),
		rejectedParentImagesAuthenticated:
			analysis.parents?.rejectedChronology?.conclusion === 'rejected' &&
			analysis.parents?.rejectedChronology?.candidates?.length === 3 &&
			analysis.parents.rejectedChronology.candidates.every((actual, index) => {
				const expected = fixture.parents.rejectedChronology.candidates[index];
				return (
					actual.path === expected.path &&
					actual.byteLength === expected.byteLength &&
					actual.sha256 === expected.sha256 &&
					actual.verified === true
				);
			}),
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
				fixture.diagnostics.expectedValueAbsoluteError,
			),
		),
		structureScalesExact: sceneResults.every((result, index) =>
			nearlyEqual(
				result.structure?.scale,
				fixture.scenes[index].diffuseHorizontalPacket.structureScale,
				fixture.diagnostics.expectedValueAbsoluteError,
				fixture.diagnostics.structureScaleRelativeError,
			),
		),
		candidateChronologyStrictlyDimming:
			chronology?.allStrictlyDecreasing === true &&
			chronology?.medianConvention === fixture.diagnostics.chronologyMedianConvention &&
			Array.isArray(chronology.regions) &&
			chronology.regions.length === fixture.diagnostics.chronologyRegions.length &&
			chronology.regions.every((region) => region.strictlyDecreasing === true),
		blackAndSaturationBounded: sceneResults.every(
			(result) =>
				result.display?.blackSkyPixelFraction <= fixture.diagnostics.blackSkyPixelFractionCeiling &&
				result.display?.saturatedSkyPixelFraction <= fixture.diagnostics.saturatedSkyPixelFractionCeiling,
		),
		oneScalarOneShader:
			analysis.response?.id === fixture.response.id &&
			analysis.response?.selectedCandidate?.id === fixture.response.selectedCandidate.id &&
			analysis.shaderIdentity?.uniqueFragmentSourceHashCount === 1 &&
			analysis.shaderIdentity?.programCompiledOnceAndReusedForAllScenes === true &&
			analysis.shaderIdentity?.responseConfigurationChangedAcrossScenes === false &&
			analysis.shaderIdentity?.onlyResponseStateUniformChangedAcrossScenes === 'uTotalHorizontalIlluminanceLux' &&
			analysis.shaderIdentity?.sameFragmentSourceAcrossScenes === true &&
			analysis.shaderIdentity?.differsFromRejectedCr4bFragmentSource === true,
		analyticResponseProved:
			analysis.analyticResponseProof?.passed === true &&
			analysis.analyticResponseProof?.finite === true &&
			analysis.analyticResponseProof?.monotonicNonincreasing === true &&
			analysis.analyticResponseProof?.derivativeNonpositive === true &&
			analysis.analyticResponseProof?.derivativeAtZeroPerLux === 0 &&
			analysis.analyticResponseProof?.analyticEquationProof?.noBranch === true,
		brightControlMetricsReportOnly:
			analysis.brightControlMetrics?.length === fixture.brightControls.length &&
			analysis.brightControlMetrics.every(
				(record, index) =>
					record.sceneId === fixture.brightControls[index].id &&
					record.gatesCandidate === false &&
					nearlyEqual(
						record.gain,
						fixture.brightControls[index].expectedCandidateGain,
						fixture.diagnostics.brightControlReportOnly.expectedGainAbsoluteError,
					),
			),
		rejectedChronologyComparisonIsReadOnly:
			analysis.rejectedChronologyComparison?.parentRunId === fixture.parents.rejectedChronology.runId &&
			analysis.rejectedChronologyComparison?.gatesCandidate === false &&
			exactJson(
				analysis.rejectedChronologyComparison?.parentChronology,
				fixture.parents.rejectedChronology.chronology,
			),
		structureDiagnosticRemainsNoncandidate:
			analysis.structureDiagnostic?.id === fixture.structureDiagnostic.id &&
			analysis.structureDiagnostic?.gatesCandidate === false &&
			fixture.structureDiagnostic.candidateExposure === false &&
			fixture.structureDiagnostic.brightnessTarget === false,
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
		'rejectedParentImagesAuthenticated',
		'cr1InputsAuthenticated',
		'receiverScalarsReplayedExactly',
		'parentBrunetonReplay',
		'candidateGpuCpuEncodedParity',
		'candidateGpuCpuLinearParity',
		'parentRunsRemainImmutable',
		'firstImageTimeTarget',
		'decisionPlateTimeTarget',
	];
	const integrityPassed = integrityNames.every((name) => gates[name]);
	const diagnosticPassed = Object.entries(gates)
		.filter(([name]) => !integrityNames.includes(name))
		.every(([, passed]) => passed);
	return {gates, integrityPassed, diagnosticPassed, accepted: integrityPassed && diagnosticPassed};
}

async function main() {
	const selectorArguments = process.argv.slice(2);
	if (selectorArguments.length !== PARENT_ORDER.length || selectorArguments.some((value) => value.trim() === '')) {
		throw new Error(
			`Usage: ${COMMAND_PREFIX} <explicit-CR1-run-id-or-contained-path> ` +
				'<explicit-CR2-run-id-or-contained-path> <explicit-CR4A-run-id-or-contained-path> ' +
				'<explicit-CR4B-run-id-or-contained-path> <explicit-rejected-CR4C-run-id-or-contained-path>',
		);
	}
	const parentSelectors = Object.fromEntries(
		PARENT_ORDER.map((parentId, index) => [parentId, selectorArguments[index]]),
	);
	const command = [COMMAND_PREFIX, ...selectorArguments.map((selector) => JSON.stringify(selector))].join(' ');
	const fixture = await readJson(FIXTURE_PATH);
	const images = outputImages(fixture);
	const run = await initializeColorResetRunRecord({
		slug: 'cr4c-two-scale-sunset-nautical-pre-tone-sequence',
		command,
		inputs: {
			schemaId: `${SCHEMA_PREFIX}-inputs-v1`,
			increment: 'CR4C two-scale revision',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: parentSelectors,
			parents: fixture.parents,
			scenes: fixture.scenes,
			receiverLightScalar: fixture.receiverLightScalar,
			response: fixture.response,
			structureDiagnostic: fixture.structureDiagnostic,
			brightControls: fixture.brightControls,
			diagnostics: fixture.diagnostics,
			outputImages: images,
		},
		provenance: {
			schemaId: `${SCHEMA_PREFIX}-provenance-v1`,
			operation:
				'Rehydrate three accepted CR1 signed projected linear-RGB sky fields and masks, replay exact CR2 receiver-light values, apply one frozen analytic two-scale pre-tone response, retain the rejected CR4C chronology as read-only comparison evidence, and render the exact seventeen-image contract before all runner-owned gates.',
			implementation: [MODEL_RELATIVE_PATH, HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			physicalInput:
				'unchanged accepted CR1 W27/Q30/Native15 pre-display fields; no atmosphere, cache, or transport execution',
			derivation: fixture.response.operation,
			structureDiagnostic: fixture.structureDiagnostic.equation,
			exclusions: [
				'no physical-field change',
				'no independent scene grading',
				'no post-tone gain',
				'no independent channel curve',
				'no gamut or luminance shoulder',
				'no paper metric or brightness target',
				'no bright-control image or candidate-eligibility gate',
				'no reinterpretation of the rejected CR4C parent',
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
			design: 'agents/topics/extraterrestrial/color-reset-design.md#cr4c-chronology-diagnosis',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr4c---carry-one-response-through-nautical-twilight',
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			cr4a: 'tmp/extraterrestrial/color-reset/runs/000019-native15-sunset-paper-visual-comparison',
			cr4b: 'tmp/extraterrestrial/color-reset/runs/000020-sunset-pre-tone-exposure-bracket',
			rejectedCr4c: 'tmp/extraterrestrial/color-reset/runs/000021-sunset-nautical-pre-tone-sequence',
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
			modulePath: '/lane/harness/cr4c-two-scale-sunset-nautical-pre-tone-sequence-browser.js',
			exportName: 'runCr4cTwoScaleSunsetNauticalPreToneSequenceBrowser',
			servedRoots: {
				'/cr1/': parentDirectoriesBefore.skyField,
				'/cr2/': parentDirectoriesBefore.receiverLight,
				'/cr4a/': parentDirectoriesBefore.qualitativeStructure,
				'/cr4b/': parentDirectoriesBefore.selectedBracket,
				'/cr4c-rejected/': parentDirectoriesBefore.rejectedChronology,
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
			'CR4C explicit parent selectors resolved differently during execution.',
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
			'CR4C protected Algorithm32 source',
		);
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4C protected Flat32 source');

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged});
		const conclusion = !decision.integrityPassed ? 'failed' : decision.accepted ? 'accepted' : 'rejected';
		const proof = {
			schemaId: `${SCHEMA_PREFIX}-proof-v1`,
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			diagnosticPassed: decision.diagnosticPassed,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			boundedResponseRevision: true,
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
			`# ${run.runId}: CR4C two-scale sunset-to-nautical pre-tone revision`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All seventeen requested control, candidate, structural-diagnostic, mask, difference, and figure PNGs were written before runner-owned gates were evaluated.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'The equal-36-W/m^2 row is independently normalized structure evidence only. It is not candidate exposure, a brightness target, or an appearance oracle.',
			'',
			'The rejected G=4096 images and medians are read-only comparison evidence. The revised two-scale row remains unaccepted pending owner appearance review.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		requireCondition(
			independentVerification.verified === true &&
				independentVerification.conclusion === conclusion &&
				independentVerification.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4C terminal run failed independent verification.',
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					appearanceAccepted: false,
					boundedResponseRevision: true,
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
					boundedResponseRevision: true,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4C two-scale sunset-to-nautical pre-tone revision\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
