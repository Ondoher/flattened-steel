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

const COMMAND_PREFIX = 'node scripts/extraterrestrial/color-reset/runners/run-cr4b-sunset-pre-tone-exposure-bracket.js';
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
	'scripts/extraterrestrial/color-reset/fixtures/cr4b-sunset-pre-tone-exposure-bracket-v1.json';
const FIXTURE_PATH = path.join(REPOSITORY_ROOT, ...FIXTURE_RELATIVE_PATH.split('/'));
const HARNESS_RELATIVE_PATH =
	'scripts/extraterrestrial/color-reset/harness/cr4b-sunset-pre-tone-exposure-bracket-browser.js';
const HARNESS_PATH = path.join(REPOSITORY_ROOT, ...HARNESS_RELATIVE_PATH.split('/'));
const MODEL_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/color/Cr4bPreToneExposureColorDisplayModel.js';
const MODEL_PATH = path.join(REPOSITORY_ROOT, ...MODEL_RELATIVE_PATH.split('/'));
const FIXTURE_SHA256 = 'aaf3f43b76f4c39270efeb788ea2ed7b995906609c938a3fea974244b463df56';
const HARNESS_SHA256 = '695c8ccc66ef9e803c0f0757e44e790bd2aa618656e6d096ece24c5ad04ea138';
const MODEL_SHA256 = '126d6d4289ab824cf45c85ca38fd12bdf219ba9e555c3c133438751a89359df3';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const EXPECTED_PARENT_RUNS = Object.freeze({
	skyField: '000005-six-scene-visual-baseline',
	receiverLight: '000007-available-light-inventory',
	qualitativeStructure: '000019-native15-sunset-paper-visual-comparison',
});
const PARENT_ORDER = Object.freeze(['skyField', 'receiverLight', 'qualitativeStructure']);
const EXPECTED_CANDIDATES = Object.freeze([
	{id: 'pre-tone-2048', maximumGain: 2048},
	{id: 'pre-tone-4096', maximumGain: 4096},
	{id: 'pre-tone-8192', maximumGain: 8192},
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

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr4b-sunset-pre-tone-exposure-bracket-input-v1',
		'CR4B fixture schema changed.',
	);
	requireCondition(
		fixture.claimBoundary?.appearanceAcceptanceGate === false &&
			fixture.claimBoundary?.paperSimilarityMetric === false &&
			fixture.claimBoundary?.paperTarget === false &&
			fixture.claimBoundary?.physicalTransportReexecution === false &&
			fixture.claimBoundary?.preservationEligibilityGate === false,
		'CR4B diagnostic claim boundary changed.',
	);
	for (const [parentId, expectedRunId] of Object.entries(EXPECTED_PARENT_RUNS)) {
		const parent = fixture.parents?.[parentId];
		requireCondition(
			parent?.namespace === 'color-reset' && parent.runId === expectedRunId,
			`CR4B ${parentId} parent selector changed.`,
		);
	}
	requireCondition(
		fixture.parents.qualitativeStructure.role.includes('neither replay inputs nor candidate targets'),
		'CR4B qualitative-parent role changed.',
	);
	requireCondition(
		fixture.viewport.widthPixels === 640 &&
			fixture.viewport.heightPixels === 400 &&
			fixture.viewport.verticalFieldOfViewDegrees === 78,
		'CR4B viewport changed.',
	);
	requireCondition(
		fixture.scene.id === 'sunset' &&
			fixture.scene.timeIso === '2024-06-21T03:26:03.503Z' &&
			fixture.scene.totalHorizontalIlluminance?.units === 'lux' &&
			fixture.scene.totalHorizontalIlluminance.value === 1012.6643901353058,
		'CR4B sunset scene or receiver-light value changed.',
	);
	requireCondition(
		fixture.scene.field.byteLength === 4_096_000 &&
			fixture.scene.mask.byteLength === 256_000 &&
			fixture.scene.bruneton.byteLength === 66_620,
		'CR4B CR1 sunset input shape changed.',
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
		'CR4B receiver-light scalar contract changed.',
	);
	requireCondition(
		fixture.response.id === 'color-reset-cr4b-total-horizontal-illuminance-pre-tone-rational-gain-v1' &&
			fixture.response.operationSpace === 'signed projected linear sRGB before unchanged Bruneton exponential' &&
			fixture.response.transitionIlluminanceLux === 3 &&
			fixture.response.rolloffPower === 1.3 &&
			fixture.response.properties.preToneOrderingRequired === true &&
			fixture.response.properties.continuousValueAndSlope === true &&
			fixture.response.properties.hardIdentityCutoff === false &&
			fixture.response.properties.independentChannelCurve === false &&
			exactJson(
				fixture.response.candidates.map(({id, maximumGain}) => ({id, maximumGain})),
				EXPECTED_CANDIDATES,
			),
		'CR4B pre-tone response predeclaration changed.',
	);
	requireCondition(
		fixture.reportOnlyBrunetonPreservation?.evaluationOnly === true &&
			fixture.reportOnlyBrunetonPreservation?.gatesCandidateEligibility === false &&
			fixture.reportOnlyBrunetonPreservation?.suppressesImages === false &&
			fixture.reportOnlyBrunetonPreservation?.appearanceMeaning === 'none',
		'CR4B report-only preservation boundary changed.',
	);
	requireCondition(
		fixture.diagnostics.commonGain?.maximumSignedLinearRgbCrossProductError === 1e-8 &&
			fixture.diagnostics.preToneOrdering?.maximumIndependentCpuAbsoluteDifference === 1e-15 &&
			fixture.diagnostics.preToneOrdering?.requireDifferentFromPostToneAlternative === true,
		'CR4B common-gain or pre-tone-ordering proof threshold changed.',
	);
	const groupedImages = [
		...fixture.outputs.panels,
		...fixture.outputs.masks,
		...fixture.outputs.differences,
		...fixture.outputs.figures,
	];
	const images = outputImages(fixture);
	requireCondition(
		images.length === 12 && exactJson(images, groupedImages),
		'CR4B requested image order must be derived exactly from the declared output groups.',
	);
	requireCondition(
		new Set(images).size === images.length && images.every(isArtifactPath),
		'CR4B output paths must be unique contained artifact paths.',
	);
	requireCondition(
		images.every((artifactPath) => artifactPath.endsWith('.png')) &&
			images.at(-1) === fixture.outputs.decisionPlate,
		'CR4B decision plate must be the last declared PNG.',
	);
}

function selectedArtifacts(fixture, parentId) {
	if (parentId === 'skyField') {
		return [fixture.parents.skyField.analysis, fixture.scene.field, fixture.scene.mask, fixture.scene.bruneton];
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
			const canonical = await verifyOrdinaryCanonicalDirectory(resolved, `CR4B ${parentId} parent`);
			assertLexicallyContained(canonicalRunsRoot, canonical, `CR4B ${parentId} parent`);
			await assertNoReparseEntries(canonical, `CR4B ${parentId} parent`);
			return [parentId, canonical];
		}),
	);
	const directories = Object.fromEntries(entries);
	requireCondition(
		new Set(Object.values(directories).map(pathComparisonKey)).size === PARENT_ORDER.length,
		'CR4B explicit parent selectors must resolve to three distinct contained runs.',
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
		`${label} must be the explicitly selected, independently verified terminal accepted run.`,
	);
	const manifestPath = path.join(root, 'artifact-manifest.json');
	const manifestSha256 = await sha256File(manifestPath);
	requireCondition(manifestSha256 === specification.manifestSha256, `${label} manifest changed.`);
	const manifest = await readJson(manifestPath);
	requireCondition(
		manifest.runId === specification.runId &&
			manifest.conclusion === 'accepted' &&
			manifest.artifactSetSha256 === specification.artifactSetSha256,
		`${label} accepted terminal identity changed.`,
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
	const [skyField, receiverLight, qualitativeStructure] = await Promise.all([
		verifyParent({
			root: parentDirectories.skyField,
			selector: selectors.skyField,
			specification: fixture.parents.skyField,
			selected: selectedArtifacts(fixture, 'skyField'),
			label: 'CR4B CR1 sky-field',
		}),
		verifyParent({
			root: parentDirectories.receiverLight,
			selector: selectors.receiverLight,
			specification: fixture.parents.receiverLight,
			selected: selectedArtifacts(fixture, 'receiverLight'),
			label: 'CR4B CR2 receiver-light',
		}),
		verifyParent({
			root: parentDirectories.qualitativeStructure,
			selector: selectors.qualitativeStructure,
			specification: fixture.parents.qualitativeStructure,
			selected: selectedArtifacts(fixture, 'qualitativeStructure'),
			label: 'CR4B CR4A qualitative-structure',
		}),
	]);

	const [cr1Analysis, cr2Analysis, cr4aAnalysis] = await Promise.all([
		readJson(path.join(parentDirectories.skyField, ...fixture.parents.skyField.analysis.path.split('/'))),
		readJson(path.join(parentDirectories.receiverLight, ...fixture.parents.receiverLight.analysis.path.split('/'))),
		readJson(
			path.join(
				parentDirectories.qualitativeStructure,
				...fixture.parents.qualitativeStructure.analysis.path.split('/'),
			),
		),
	]);
	requireCondition(
		cr1Analysis.schemaId === 'algorithm32-color-reset-cr1-browser-result-v1',
		'CR4B CR1 analysis schema changed.',
	);
	const cr1Scene = cr1Analysis.scenes.find(({sceneId}) => sceneId === fixture.scene.id);
	const cr1Field = cr1Analysis.rawFields.find(({artifactPath}) => artifactPath === fixture.scene.field.path);
	const cr1Mask = cr1Analysis.hitMasks.find(({artifactPath}) => artifactPath === fixture.scene.mask.path);
	const cr1Bruneton = cr1Analysis.panels.find(({artifactPath}) => artifactPath === fixture.scene.bruneton.path);
	requireCondition(
		cr1Scene?.sceneId === 'sunset' &&
			cr1Field?.byteLength === fixture.scene.field.byteLength &&
			cr1Field?.sha256 === fixture.scene.field.sha256 &&
			cr1Mask?.byteLength === fixture.scene.mask.byteLength &&
			cr1Mask?.sha256 === fixture.scene.mask.sha256 &&
			cr1Mask?.equality?.allEqual === true &&
			cr1Bruneton?.byteLength === fixture.scene.bruneton.byteLength &&
			cr1Bruneton?.sha256 === fixture.scene.bruneton.sha256,
		'CR4B CR1 sunset field, mask, or Bruneton identity changed.',
	);

	requireCondition(
		cr2Analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR4B CR2 analysis schema changed.',
	);
	const cr2Scene = cr2Analysis.scenes.find(({sceneId}) => sceneId === fixture.scene.id);
	const illuminance = cr2Scene?.measurement?.photopic?.totalHorizontal?.illuminance;
	requireCondition(
		illuminance?.units === fixture.scene.totalHorizontalIlluminance.units &&
			illuminance.value === fixture.scene.totalHorizontalIlluminance.value,
		'CR4B CR2 sunset receiver-light value changed.',
	);

	requireCondition(
		cr4aAnalysis.schemaId === 'algorithm32-color-reset-cr4a-native15-sunset-paper-analysis-v1' &&
			cr4aAnalysis.acceptedForIntegrityEvaluation === true &&
			cr4aAnalysis.appearanceAccepted === false &&
			cr4aAnalysis.objectiveAccuracyClaim === false &&
			cr4aAnalysis.paperSimilarityMetric === null,
		'CR4B CR4A parent exceeded its accepted qualitative-only claim boundary.',
	);

	return {
		skyField: {
			...skyField,
			replay: {sceneId: cr1Scene.sceneId, field: cr1Field, mask: cr1Mask, bruneton: cr1Bruneton},
		},
		receiverLight: {
			...receiverLight,
			replay: {sceneId: cr2Scene.sceneId, totalHorizontalIlluminance: illuminance, exact: true},
		},
		qualitativeStructure: {
			...qualitativeStructure,
			role: fixture.parents.qualitativeStructure.role,
			analysisClaim: {
				acceptedForIntegrityEvaluation: true,
				appearanceAccepted: false,
				objectiveAccuracyClaim: false,
				paperSimilarityMetric: null,
			},
		},
	};
}

function assertParentsUnchanged(before, after) {
	for (const parentId of Object.keys(EXPECTED_PARENT_RUNS)) {
		assertParentSnapshotUnchanged(before[parentId], after[parentId], `CR4B ${parentId} parent`);
	}
	return true;
}

async function verifyControlSnapshot() {
	const manifestSha256 = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestSha256 === SNAPSHOT_MANIFEST_SHA256, 'CR4B production control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256,
		'CR4B production control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map(({path: relativePath}) => relativePath));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR4B snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR4B snapshot and production closure');
	return {manifestSha256, inventory: snapshotInventory, productionSelection};
}

async function verifyAuthoredInputs() {
	const [fixtureSha256, harnessSha256, modelSha256] = await Promise.all([
		sha256File(FIXTURE_PATH),
		sha256File(HARNESS_PATH),
		sha256File(MODEL_PATH),
	]);
	requireCondition(fixtureSha256 === FIXTURE_SHA256, 'CR4B fixture changed after predeclaration.');
	requireCondition(harnessSha256 === HARNESS_SHA256, 'CR4B browser harness identity changed.');
	requireCondition(modelSha256 === MODEL_SHA256, 'CR4B Color model identity changed.');
	return {
		schemaId: 'algorithm32-color-reset-cr4b-authored-input-identities-v1',
		fixture: {path: FIXTURE_RELATIVE_PATH, sha256: fixtureSha256},
		harness: {path: HARNESS_RELATIVE_PATH, sha256: harnessSha256},
		model: {path: MODEL_RELATIVE_PATH, sha256: modelSha256},
	};
}

async function captureImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr4b-sunset-pre-tone-exposure-bracket.js',
			'color-reset/harness/cr4b-sunset-pre-tone-exposure-bracket-browser.js',
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
		entryFiles: ['harness/cr4b-sunset-pre-tone-exposure-bracket-browser.js'],
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
	assertFileInventoriesEqual(before.implementationInventory, after.implementationInventory, 'CR4B implementation');
	assertFileInventoriesEqual(before.browserInventory, after.browserInventory, 'CR4B browser closure');
	requireCondition(
		before.packageJsonSha256 === after.packageJsonSha256 && before.packageLockSha256 === after.packageLockSha256,
		'CR4B package boundary changed during execution.',
	);
}

function attachUploadIdentities(result, uploads) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const uploadedImages = result.uploadedImages.map((image) => {
		const artifactPath = image.artifactPath ?? image.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4B browser result omitted upload ${artifactPath}.`);
		return {...image, artifactPath, byteLength: upload.byteLength, sha256: upload.sha256};
	});
	return {...result, uploadedImages};
}

function attachEvidenceImageIdentities(evidence, uploads, label) {
	const byPath = new Map(uploads.map((upload) => [upload.path, upload]));
	const records = Array.isArray(evidence) ? evidence : (evidence?.panels ?? evidence?.images);
	requireCondition(Array.isArray(records), `CR4B ${label} records are missing.`);
	const attached = records.map((record) => {
		const artifactPath = record.artifactPath ?? record.path;
		const upload = byPath.get(artifactPath);
		requireCondition(upload !== undefined, `CR4B ${label} references unknown image ${artifactPath}.`);
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
		schemaId: 'algorithm32-color-reset-cr4b-progress-v1',
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

function finiteMetric(record, keys) {
	return keys.every((key) => Number.isFinite(record?.[key]));
}

function evaluateGates({analysis, browser, fixture, progress, parentsUnchanged}) {
	const expectedImages = outputImages(fixture);
	const actualImages = browser.uploads.map(({path: artifactPath}) => artifactPath);
	const candidates = analysis.candidates ?? [];
	const expectedCandidateIds = fixture.response.candidates.map(({id}) => id);
	const actualCandidateIds = candidates.map(({candidateId, id}) => candidateId ?? id);
	const candidateById = new Map(candidates.map((candidate) => [candidate.candidateId ?? candidate.id, candidate]));
	const parentReplay = analysis.scene?.brunetonCpuReplay ?? analysis.scene?.control?.cpuReplay;
	const candidateParity = candidates.map((candidate) => candidate.cpuGpuParity);
	const encodedParity = candidateParity.map((parity) => parity?.encodedSky ?? parity?.encodedRgb);
	const linearParity = candidateParity.map((parity) => parity?.floatSky ?? parity?.linearSky);
	const reportedPreservation = candidates.map((candidate) => candidate.candidateVsBruneton ?? candidate.preservation);
	const expectedGainsExact = fixture.response.candidates.every((candidate) => {
		const actual = candidateById.get(candidate.id);
		return (
			actual !== undefined &&
			Math.abs(actual.gain - candidate.expectedSunsetGain) <=
				fixture.diagnostics.curveProof.maximumExpectedGainAbsoluteError
		);
	});
	const allGpuErrors = [
		...(analysis.gpu?.startupErrors ?? []),
		...(analysis.gpu?.terminalErrors ?? []),
		...(analysis.gpu?.errors ?? []),
		...candidates.flatMap((candidate) => candidate.gpu?.errors ?? []),
	];
	const responseProof = analysis.responseProof ?? [];
	const gates = {
		browserResultSchema: analysis.schemaId === 'algorithm32-color-reset-cr4b-browser-result-v1',
		renderCompletedBeforeRunnerGates: analysis.renderComplete === true && analysis.integrityGateEvaluated === false,
		appearanceRemainsUnaccepted:
			analysis.appearanceAccepted === false && fixture.claimBoundary.appearanceAcceptanceGate === false,
		allRequestedImagesWritten: exactJson(actualImages, expectedImages),
		browserUploadOrderExact:
			exactJson(analysis.imageUploadOrder, expectedImages) &&
			exactJson(analysis.uploadOrder, expectedImages) &&
			analysis.uploadedImages.length === expectedImages.length,
		decisionPlateUploadedLast: actualImages.at(-1) === fixture.outputs.decisionPlate,
		allImagesPrecedeGateEvaluation:
			analysis.renderComplete === true &&
			analysis.integrityGateEvaluated === false &&
			analysis.allDeclaredImagesUploaded === true &&
			browser.uploads.length === expectedImages.length,
		noBrowserServerErrors: browser.serverErrors.length === 0,
		webgl2ContextHealthy: analysis.gpu?.api === 'WebGL2' && analysis.gpu?.contextLost === false,
		actualD3d11Backend: /direct3d11|d3d11/iu.test(analysis.gpu?.renderer ?? ''),
		noWebglErrors: allGpuErrors.length === 0,
		exactCandidateOrder: exactJson(actualCandidateIds, expectedCandidateIds),
		browserParentsAuthenticated:
			analysis.parents?.skyField?.runId === fixture.parents.skyField.runId &&
			analysis.parents?.skyField?.analysis?.verified === true &&
			analysis.parents?.skyField?.analysis?.sha256 === fixture.parents.skyField.analysis.sha256 &&
			analysis.parents?.receiverLight?.runId === fixture.parents.receiverLight.runId &&
			analysis.parents?.receiverLight?.analysis?.verified === true &&
			analysis.parents?.receiverLight?.analysis?.sha256 === fixture.parents.receiverLight.analysis.sha256 &&
			analysis.parents?.qualitativeStructure?.runId === fixture.parents.qualitativeStructure.runId &&
			analysis.parents?.qualitativeStructure?.analysis?.verified === true &&
			analysis.parents?.qualitativeStructure?.analysis?.sha256 ===
				fixture.parents.qualitativeStructure.analysis.sha256 &&
			analysis.parents?.verification?.cr2?.value === fixture.scene.totalHorizontalIlluminance.value &&
			analysis.parents?.verification?.cr4a?.appearanceAccepted === false &&
			analysis.parents?.verification?.cr4a?.paperSimilarityMetric === null,
		receiverScalarReplayedExactly:
			analysis.scene?.totalHorizontalIlluminance?.units === fixture.scene.totalHorizontalIlluminance.units &&
			analysis.scene?.totalHorizontalIlluminance?.value === fixture.scene.totalHorizontalIlluminance.value,
		cr1InputsAuthenticated:
			analysis.scene?.field?.sha256 === fixture.scene.field.sha256 &&
			analysis.scene?.field?.byteLength === fixture.scene.field.byteLength &&
			analysis.scene?.mask?.sha256 === fixture.scene.mask.sha256 &&
			analysis.scene?.mask?.byteLength === fixture.scene.mask.byteLength &&
			analysis.scene?.bruneton?.sha256 === fixture.scene.bruneton.sha256 &&
			analysis.scene?.bruneton?.byteLength === fixture.scene.bruneton.byteLength,
		parentBrunetonReplay:
			parentReplay !== undefined &&
			parentReplay.maximumAbsoluteRgbCodeDifference <=
				fixture.diagnostics.parentBrunetonReplay.maximumAbsoluteRgbCodeDifference &&
			parentReplay.rgbCodeRmse <= fixture.diagnostics.parentBrunetonReplay.maximumRgbCodeRmse,
		candidateGpuCpuEncodedParity:
			encodedParity.length === EXPECTED_CANDIDATES.length &&
			encodedParity.every(
				(record) =>
					record?.maximumAbsoluteRgbCodeDifference <=
						fixture.diagnostics.gpuCpuParity.maximumAbsoluteRgbCodeDifference &&
					record?.rgbCodeRmse <= fixture.diagnostics.gpuCpuParity.maximumRgbCodeRmse,
			),
		candidateGpuCpuLinearParity:
			linearParity.length === EXPECTED_CANDIDATES.length &&
			linearParity.every(
				(record) =>
					record?.nonfiniteValueCount === 0 &&
					record?.maximumAbsoluteRgbDifference <=
						fixture.diagnostics.gpuCpuParity.maximumAbsoluteLinearRgbDifference &&
					record?.rgbRmse <= fixture.diagnostics.gpuCpuParity.maximumLinearRgbRmse,
			),
		preToneOrderingProved:
			analysis.preToneOrderingProof?.passed === true &&
			candidates.length === EXPECTED_CANDIDATES.length &&
			candidates.every(
				(candidate) =>
					Number.isFinite(candidate.preToneOrdering?.maximumIndependentCpuAbsoluteDifference) &&
					candidate.preToneOrdering.maximumIndependentCpuAbsoluteDifference <=
						fixture.diagnostics.preToneOrdering.maximumIndependentCpuAbsoluteDifference &&
					Number.isFinite(candidate.preToneOrdering?.maximumPostToneAlternativeDifference) &&
					(!fixture.diagnostics.preToneOrdering.requireDifferentFromPostToneAlternative ||
						candidate.preToneOrdering.maximumPostToneAlternativeDifference > 0) &&
					Number.isInteger(candidate.preToneOrdering?.signedNegativeInputValueCount) &&
					candidate.preToneOrdering.signedNegativeInputValueCount >= 0 &&
					candidate.commonGainProof?.oneScalarForEveryPixelAndChannel === true &&
					Number.isFinite(candidate.commonGainProof?.maximumSignedLinearRgbCrossProductError) &&
					candidate.commonGainProof.maximumSignedLinearRgbCrossProductError <=
						fixture.diagnostics.commonGain.maximumSignedLinearRgbCrossProductError,
			),
		responseFiniteMonotonicContinuous:
			responseProof.length === EXPECTED_CANDIDATES.length &&
			exactJson(
				responseProof.map(({candidateId}) => candidateId),
				expectedCandidateIds,
			) &&
			responseProof.every(
				(record) =>
					record.finite === true &&
					record.monotonicNonincreasing === true &&
					record.derivativeNonpositive === true &&
					record.continuousValueAndSlopeByAnalyticContract === true &&
					record.derivativeAtZeroPerLux === 0 &&
					record.maximumDerivativeAbsoluteError <=
						fixture.diagnostics.curveProof.maximumDerivativeAbsoluteError &&
					record.maximumDerivativeRelativeError <=
						fixture.diagnostics.curveProof.maximumDerivativeRelativeError,
			) &&
			fixture.response.properties.hardIdentityCutoff === false,
		expectedSunsetGainsExact: expectedGainsExact,
		oneScalarOneEquation:
			analysis.oneScalarCommonChannels?.passed === true &&
			analysis.response?.id === fixture.response.id &&
			analysis.response?.equation === fixture.response.equation &&
			analysis.response?.operationSpace === fixture.response.operationSpace &&
			analysis.receiverLightScalar?.sameValueForEveryPixel === true &&
			analysis.receiverLightScalar?.sameValueForEveryRgbChannel === true &&
			analysis.receiverLightScalar?.verifiedExactFromCr2 === true,
		reportOnlyPreservationMetricsFinite:
			reportedPreservation.length === EXPECTED_CANDIDATES.length &&
			reportedPreservation.every((record) =>
				finiteMetric(record, ['maximumAbsoluteRgbCodeDifference', 'rgbCodeRmse']),
			),
		preservationDoesNotGateEligibility:
			fixture.reportOnlyBrunetonPreservation.gatesCandidateEligibility === false &&
			analysis.preservationMetricsGateCandidateEligibility === false &&
			candidates.every((candidate) => candidate.candidateVsBruneton?.gatesCandidateEligibility === false),
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
		'exactCandidateOrder',
		'browserParentsAuthenticated',
		'receiverScalarReplayedExactly',
		'cr1InputsAuthenticated',
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
	return {
		gates,
		integrityPassed,
		diagnosticPassed,
		accepted: integrityPassed && diagnosticPassed,
		reportOnlyPreservation: reportedPreservation,
	};
}

async function main() {
	const selectorArguments = process.argv.slice(2);
	if (selectorArguments.length !== PARENT_ORDER.length || selectorArguments.some((value) => value.trim() === '')) {
		throw new Error(
			`Usage: ${COMMAND_PREFIX} <explicit-CR1-run-id-or-contained-path> ` +
				'<explicit-CR2-run-id-or-contained-path> <explicit-CR4A-run-id-or-contained-path>',
		);
	}
	const parentSelectors = Object.fromEntries(
		PARENT_ORDER.map((parentId, index) => [parentId, selectorArguments[index]]),
	);
	const command = [COMMAND_PREFIX, ...selectorArguments.map((selector) => JSON.stringify(selector))].join(' ');
	const fixture = await readJson(FIXTURE_PATH);
	const images = outputImages(fixture);
	const run = await initializeColorResetRunRecord({
		slug: 'sunset-pre-tone-exposure-bracket',
		command,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr4b-inputs-v1',
			increment: 'CR4B',
			fixture: FIXTURE_RELATIVE_PATH,
			fixtureSha256: FIXTURE_SHA256,
			explicitParentSelectors: parentSelectors,
			parents: fixture.parents,
			scene: fixture.scene,
			receiverLightScalar: fixture.receiverLightScalar,
			response: fixture.response,
			reportOnlyBrunetonPreservation: fixture.reportOnlyBrunetonPreservation,
			outputImages: images,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr4b-provenance-v1',
			operation:
				'Rehydrate the accepted CR1 signed projected linear-RGB sunset field and mask, replay accepted CR2 total-horizontal receiver illuminance, apply three predeclared scene-global achromatic exposure rows before the unchanged Bruneton exponential, and write every requested image before runner-owned gates.',
			implementation: [MODEL_RELATIVE_PATH, HARNESS_RELATIVE_PATH, FIXTURE_RELATIVE_PATH, RUNNER_RELATIVE_PATH],
			physicalInput:
				'unchanged accepted CR1 W27/Q30/Native15 sunset pre-display field; no atmosphere, cache, or transport execution',
			derivation: fixture.response.operation,
			qualitativeRationale:
				'accepted CR4A structure analysis only; no paper pixel is replayed, measured, scored, or used as a target',
			exclusions: [
				'no physical-field change',
				'no post-tone gain',
				'no independent channel curve',
				'no gamut or luminance shoulder',
				'no paper metric or brightness target',
				'no preservation eligibility decision',
				'no appearance selection',
				'no production change',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr4b-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900_000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr4b-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md#cr4a-sunset-reference-boundary',
			plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr4b---bracket-one-pre-tone-exposure-response',
			cr1: 'tmp/extraterrestrial/color-reset/runs/000005-six-scene-visual-baseline',
			cr2: 'tmp/extraterrestrial/color-reset/runs/000007-available-light-inventory',
			cr4a: 'tmp/extraterrestrial/color-reset/runs/000019-native15-sunset-paper-visual-comparison',
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
			modulePath: '/lane/harness/cr4b-sunset-pre-tone-exposure-bracket-browser.js',
			exportName: 'runCr4bSunsetPreToneExposureBracketBrowser',
			servedRoots: {
				'/cr1/': parentDirectoriesBefore.skyField,
				'/cr2/': parentDirectoriesBefore.receiverLight,
				'/cr4a/': parentDirectoriesBefore.qualitativeStructure,
			},
			allowedArtifactPaths: images,
			uploadLimitBytes: 64 * 1024 * 1024,
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
			'CR4B explicit parent selectors resolved differently during execution.',
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
			'CR4B protected Algorithm32 source',
		);
		assertFileInventoriesEqual(protectedBefore.flat32, protectedAfter.flat32, 'CR4B protected Flat32 source');

		const progress = makeProgress(run, browser, fixture);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({analysis, browser, fixture, progress, parentsUnchanged});
		const conclusion = !decision.integrityPassed ? 'failed' : decision.accepted ? 'accepted' : 'rejected';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr4b-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			diagnosticPassed: decision.diagnosticPassed,
			appearanceAccepted: false,
			ownerAppearanceReviewRequired: true,
			preservationEligibilityDecision: false,
			paperSimilarityMetric: null,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			reportOnlyPreservation: decision.reportOnlyPreservation,
			progress,
			parents: parentsAfter,
			outputs: analysis.uploadedImages,
			protectedSourceUnchanged: true,
			parentsUnchanged,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR4B sunset pre-tone exposure bracket`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All twelve requested control, candidate, diagnostic, and figure PNGs were written before runner-owned gates were evaluated.',
			'',
			...Object.entries(decision.gates).map(([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`),
			'',
			'Candidate-versus-Bruneton sunset preservation values are report-only. They do not qualify or reject a row and have no appearance meaning in this increment.',
			'',
			'CR4A is retained only as qualitative structural rationale. No paper image metric, resemblance score, brightness target, or model ranking was calculated.',
			'',
			'Owner appearance review remains mandatory. This run does not select or accept a CR4B appearance row.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		requireCondition(
			independentVerification.verified === true &&
				independentVerification.conclusion === conclusion &&
				independentVerification.artifactSetSha256 === manifest.artifactSetSha256,
			'CR4B terminal run failed independent verification.',
		);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					appearanceAccepted: false,
					preservationEligibilityDecision: false,
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
					schemaId: 'algorithm32-color-reset-cr4b-progress-v1',
					initializedAt: run.initializedAt,
					failedAt: new Date().toISOString(),
					error: error instanceof Error ? error.message : String(error),
				});
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr4b-failure-v1',
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
					schemaId: 'algorithm32-color-reset-cr4b-failed-result-v1',
					accepted: false,
					integrityPassed: false,
					appearanceAccepted: false,
					preservationEligibilityDecision: false,
					error: error instanceof Error ? error.message : String(error),
				},
				report: `# ${run.runId}: CR4B sunset pre-tone exposure bracket\n\nConclusion: **failed**.\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
