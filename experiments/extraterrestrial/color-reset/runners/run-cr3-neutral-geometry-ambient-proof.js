#!/usr/bin/env node

import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {inflateSync} from 'node:zlib';

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
	assertLexicallyContained,
	assertRepositoryIdentity,
} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND =
	'node experiments/extraterrestrial/color-reset/runners/run-cr3-neutral-geometry-ambient-proof.js';
const COLOR_RESET_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'extraterrestrial', 'color-reset');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const FLAT32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'flat32');
const PRODUCTION_SOURCE_ROOT = path.join(REPOSITORY_ROOT, 'src');
const THREE_ROOT = path.join(EXPERIMENT_NODE_MODULES_ROOT, 'three');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const SNAPSHOT_ROOT = path.join(COLOR_RESET_ROOT, 'controls', 'production-v1');
const SNAPSHOT_SOURCE_ROOT = path.join(SNAPSHOT_ROOT, 'src');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'snapshot-manifest.json');
const FIXTURE_PATH = path.join(
	COLOR_RESET_ROOT,
	'fixtures',
	'cr3-neutral-geometry-ambient-proof-v1.json',
);
const FIXTURE_SHA256 = 'b26f78e871556f9de7666aa1a0898bb0802d687801bceb3cdcf53bf2bade0f9c';
const SNAPSHOT_MANIFEST_SHA256 = '31eb9ffa0f893b15871f7c027670fe37ab92ed14bae98c20763bb5958844a7d5';
const SNAPSHOT_INVENTORY_SHA256 = 'c3dd659d7fe82c33f6c6bef252e3c716eaa450616028af69083c700ce40d3e84';
const UPLOAD_LIMIT_BYTES = 64 * 1024 * 1024;
const NATIVE15_BASIS_HASH = 'sha256:a03a3c7f45d9bd4ff8adf6482e9d1aac1acd72423758ecf797ac24f6dffba891';
const CR2_QUADRATURE_ID = 'color-reset-cr2-receiver-diffuse-mu64-azimuth64-primary-v1';
const BRUNETON_COLOR_ID = 'bruneton-figure1-display';
const FRAME_MODES = Object.freeze(['direct-only', 'diffuse-only', 'combined']);
const EXPECTED_SCENES = Object.freeze([
	{id: 'solar-noon', timeIso: '2024-06-20T20:08:00.000Z'},
	{id: 'sunset', timeIso: '2024-06-21T03:26:03.503Z'},
	{id: 'sunset-plus-10-minutes', timeIso: '2024-06-21T03:36:03.503Z'},
	{id: 'sunset-plus-60-minutes', timeIso: '2024-06-21T04:26:03.503Z'},
]);
const EXPECTED_RAW_LINEAR_FIELDS = Object.freeze(EXPECTED_SCENES.map(
	(scene) => `data/cr3-predisplay-linear-rgb-y-${scene.id}.f32le`,
));
const EXPECTED_GEOMETRY_MASK = 'data/cr3-neutral-geometry-mask.r8';
const EXPECTED_IMAGES = Object.freeze([
	...FRAME_MODES.flatMap((mode) => EXPECTED_SCENES.map(
		(scene) => `captures/cr3-${mode}-${scene.id}.png`,
	)),
	'figures/cr3-fixed-scale-predisplay-response.png',
	'figures/cr3-linear-additivity-and-spectral-probes.png',
	'figures/cr3-neutral-geometry-ambient-proof.png',
]);
const EXPECTED_BROWSER_ARTIFACTS = Object.freeze([
	...EXPECTED_RAW_LINEAR_FIELDS,
	EXPECTED_GEOMETRY_MASK,
	...EXPECTED_IMAGES,
]);
const CONTACT_SHEET_PATH = 'figures/cr3-neutral-geometry-ambient-proof.png';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const RECEIVER_PARENT = Object.freeze({
	runId: '000007-available-light-inventory',
	artifactSetSha256: 'dcd6cdd8146094d05427ad180af7fccefdbaa67e290d1b5f21e6a0d4b03697ba',
	manifestSha256: 'f0790db92f9e39d1bc2c735572928d34b5698b0123524a56845b571d4f27b226',
	artifacts: Object.freeze({
		result: {
			path: 'result.json',
			sha256: 'c688d932718f13cf969be79c3d7c6c2f8549104cfc7f58bb387447625e206123',
		},
		proof: {
			path: 'evidence/proof.json',
			sha256: '42534fe7ed93b54f2c5182bd2532166af903163c9f7296e0c549d0519e220f85',
		},
		measurementAnalysis: {
			path: 'evidence/measurement-analysis.json',
			sha256: '99cc785895bf84edd57072eb95951eb916af2ec37d49eae25abd148e34545a47',
		},
		imageDerivations: {
			path: 'evidence/image-derivations.json',
			sha256: 'c77ac79668a39163e84312881c8974636a053df8155b2521cab3d08408b93613',
		},
	}),
});
const RECEIVER_PARENT_DIRECTORY = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	RECEIVER_PARENT.runId,
);
const RECEIVER_PARENT_MANIFEST_PATH = path.join(RECEIVER_PARENT_DIRECTORY, 'artifact-manifest.json');

const SKY_PARENT = Object.freeze({
	runId: '000005-six-scene-visual-baseline',
	artifactSetSha256: '2f7b49dd239fcaf5399c65bfebc59195458edf0b82910cf9987e341b76a615fc',
	manifestSha256: '3ba1199191f6b9dd825b0475c7d329a4b0be84e441db655d354bdce234f6949b',
});
const SKY_PARENT_DIRECTORY = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'extraterrestrial',
	'color-reset',
	'runs',
	SKY_PARENT.runId,
);
const SKY_PARENT_MANIFEST_PATH = path.join(SKY_PARENT_DIRECTORY, 'artifact-manifest.json');

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

async function readJson(filePath) {
	return JSON.parse(await readFile(filePath, 'utf8'));
}

function exactJson(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function ordinaryManifestArtifact(byPath, expected, label) {
	const artifact = byPath.get(expected.path);
	requireCondition(
		artifact?.sha256 === expected.sha256 && Number.isSafeInteger(artifact.byteLength),
		`${label} ${expected.path} changed.`,
	);
	return {...expected, byteLength: artifact.byteLength};
}

function fixtureSceneMap(fixture) {
	return new Map(fixture.scenes.map((scene) => [scene.id, scene]));
}

function verifyFixtureContract(fixture) {
	requireCondition(
		fixture.schemaId === 'algorithm32-color-reset-cr3-neutral-geometry-ambient-proof-input-v1' &&
			fixture.increment === 'CR3',
		'CR3 fixture schema or increment changed.',
	);
	requireCondition(fixture.scenes?.length === EXPECTED_SCENES.length, 'CR3 scene count changed.');
	for (let index = 0; index < EXPECTED_SCENES.length; index += 1) {
		const expected = EXPECTED_SCENES[index];
		const actual = fixture.scenes[index];
		requireCondition(
			actual?.id === expected.id &&
				actual.timeIso === expected.timeIso &&
				actual.cacheStatus === 'ready' &&
				Number.isFinite(actual.solarZenithDegrees) &&
				Array.isArray(actual.directionToSourceModel) &&
				actual.directionToSourceModel.length === 3,
			`CR3 scene ${index} changed identity, order, time, or physical state.`,
		);
	}
	requireCondition(
		fixture.parentReceiverLight?.runId === RECEIVER_PARENT.runId &&
			fixture.parentReceiverLight.artifactSetSha256 === RECEIVER_PARENT.artifactSetSha256 &&
			fixture.parentReceiverLight.artifactManifest?.sha256 === RECEIVER_PARENT.manifestSha256 &&
			fixture.parentReceiverLight.result?.sha256 === RECEIVER_PARENT.artifacts.result.sha256 &&
			fixture.parentReceiverLight.proof?.sha256 === RECEIVER_PARENT.artifacts.proof.sha256 &&
			fixture.parentReceiverLight.measurementAnalysis?.sha256 ===
				RECEIVER_PARENT.artifacts.measurementAnalysis.sha256,
		'CR3 receiver-light parent identity changed.',
	);
	requireCondition(
		fixture.skyControl?.runId === SKY_PARENT.runId &&
			fixture.skyControl.artifactSetSha256 === SKY_PARENT.artifactSetSha256 &&
			fixture.skyControl.artifactManifest?.sha256 === SKY_PARENT.manifestSha256 &&
			fixture.skyControl.colorId === BRUNETON_COLOR_ID,
		'CR3 sky-control identity changed.',
	);
	requireCondition(
		fixture.incidentLight?.basisContentHash === NATIVE15_BASIS_HASH &&
			fixture.incidentLight.channelCount === 15 &&
			fixture.incidentLight.quadrature?.id === CR2_QUADRATURE_ID &&
			fixture.incidentLight.quadrature.sampleCount === 4096 &&
			fixture.incidentLight.quadrature.muSampleCount === 64 &&
			fixture.incidentLight.quadrature.azimuthSampleCount === 64,
		'CR3 incident-light basis or quadrature changed.',
	);
	requireCondition(
		fixture.material?.id === 'neutral-lambertian-reflectance-018-native15-v1' &&
			fixture.material.basisContentHash === NATIVE15_BASIS_HASH &&
			fixture.material.channelCount === 15 &&
			fixture.material.reflectanceValues?.length === 15 &&
			fixture.material.reflectanceValues.every((value) => value === 0.18),
		'CR3 neutral material changed.',
	);
	requireCondition(
		exactJson(
			fixture.surfaceResponse?.modeDefinitions?.map((mode) => mode.id),
			FRAME_MODES,
		),
		'CR3 lighting-mode order changed.',
	);
	requireCondition(
		exactJson(fixture.outputs?.rawLinearFields, EXPECTED_RAW_LINEAR_FIELDS) &&
			fixture.outputs.geometryMask === EXPECTED_GEOMETRY_MASK &&
			exactJson(fixture.outputs.imageUploadOrder, EXPECTED_IMAGES) &&
			fixture.outputs.contactSheet === CONTACT_SHEET_PATH &&
			fixture.outputs.rawLinearFieldByteLengthEach === 12_288_000 &&
			fixture.neutralGeometry?.mask?.expectedByteLength === 256_000 &&
			fixture.outputs.evidence?.includes('evidence/png-sky-backplate-verification.json'),
		'CR3 browser-output contract changed.',
	);
	requireCondition(
		fixture.neutralGeometry?.sphere?.geometryImplementation === 'THREE.SphereGeometry' &&
			fixture.neutralGeometry.sphere.widthSegments === 32 &&
			fixture.neutralGeometry.sphere.heightSegments === 16 &&
			fixture.neutralGeometry.sphere.expectedEmittedVertexCount === 561 &&
			fixture.neutralGeometry.plane.expectedEmittedVertexCount === 4 &&
			fixture.neutralGeometry.plane.renderHeightOffsetMeters === 0 &&
			fixture.surfaceResponse?.evaluationDomain?.expectedTotalEvaluatedVertexCountPerScene === 565,
		'CR3 fixed tessellation or evaluated-vertex contract changed.',
	);
	requireCondition(
		fixture.presentation?.primary?.colorId === BRUNETON_COLOR_ID &&
			fixture.presentation.primary.surfacePathApproximation.includes('no additional atmosphere path') &&
			fixture.presentation.contactSheet?.columnCount === 4 &&
			fixture.presentation.contactSheet.rowCount === 3,
		'CR3 presentation boundary changed.',
	);
	requireCondition(
		fixture.observer?.upDirectionScene?.[1] === 1 &&
			fixture.observer?.upDirectionModel?.[2] === 1 &&
			fixture.neutralGeometry?.normalTransform?.includes(
				'geometry.expressCelestialDirectionInScene',
			) &&
			fixture.incidentLight.quadrature.directionDefinition.includes('receiver-local frame'),
		'CR3 observer-local direction-frame contract changed.',
	);
	requireCondition(
		EXPECTED_BROWSER_ARTIFACTS.length === 20 &&
			new Set(EXPECTED_BROWSER_ARTIFACTS).size === EXPECTED_BROWSER_ARTIFACTS.length,
		'CR3 browser artifacts are not exactly twenty unique paths.',
	);
}

async function verifyPinnedControlFiles(fixture) {
	const declarations = [
		{
			path: 'experiments/extraterrestrial/color-reset/fixtures/cr3-neutral-geometry-ambient-proof-v1.json',
			sha256: FIXTURE_SHA256,
		},
		fixture.parentReceiverLight.inputFixture,
		fixture.parentReceiverLight.quadratureImplementation,
		fixture.skyControl.colorImplementation,
		fixture.skyControl.colorConstants,
	];
	const files = [];
	for (const declaration of declarations) {
		requireCondition(
			typeof declaration?.path === 'string' && typeof declaration.sha256 === 'string',
			'CR3 fixture omits a pinned control file identity.',
		);
		const target = path.join(REPOSITORY_ROOT, ...declaration.path.split('/'));
		assertLexicallyContained(REPOSITORY_ROOT, target, `CR3 pinned control ${declaration.path}`);
		const facts = await lstat(target);
		requireCondition(
			facts.isFile() && !facts.isSymbolicLink(),
			`CR3 pinned control ${declaration.path} is not an ordinary file.`,
		);
		const sha256 = await sha256File(target);
		requireCondition(sha256 === declaration.sha256, `CR3 pinned control ${declaration.path} changed.`);
		files.push({path: declaration.path, byteLength: facts.size, sha256});
	}
	return {
		schemaId: 'algorithm32-color-reset-cr3-pinned-control-files-v1',
		files,
	};
}

function scanFloat32Radiance(bytes, label) {
	requireCondition(bytes.byteLength === 4096 * 15 * 4, `${label} has the wrong byte length.`);
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let minimum = Number.POSITIVE_INFINITY;
	let maximum = Number.NEGATIVE_INFINITY;
	for (let offset = 0; offset < bytes.byteLength; offset += 4) {
		const value = view.getFloat32(offset, true);
		requireCondition(Number.isFinite(value) && value >= 0, `${label} contains invalid radiance.`);
		minimum = Math.min(minimum, value);
		maximum = Math.max(maximum, value);
	}
	return {valueCount: bytes.byteLength / 4, minimum, maximum, finite: true, nonnegative: true};
}

function packetMatchesFixture(packet, expectedHash) {
	return packet?.kind === 'algorithm32-spectral-packet' &&
		packet.quantity === 'spectral-irradiance-density' &&
		packet.units === 'W m^-2 nm^-1' &&
		packet.semantics === 'contiguous-wavelength-bin-average' &&
		packet.basisHash === NATIVE15_BASIS_HASH &&
		packet.contentHash === expectedHash &&
		Array.isArray(packet.values) &&
		packet.values.length === 15 &&
		packet.values.every((value) => Number.isFinite(value) && value >= 0);
}

async function verifyReceiverLightParent(fixture) {
	await assertNoReparseEntries(RECEIVER_PARENT_DIRECTORY, 'CR3 receiver-light parent run');
	const summary = await verifyColorResetRun(RECEIVER_PARENT.runId);
	requireCondition(
		summary.verified === true &&
			summary.conclusion === 'accepted' &&
			summary.artifactSetSha256 === RECEIVER_PARENT.artifactSetSha256,
		'CR3 receiver-light parent is not the accepted immutable CR2 run.',
	);
	const manifestFacts = await lstat(RECEIVER_PARENT_MANIFEST_PATH);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink(),
		'CR3 receiver-light parent manifest is not an ordinary file.',
	);
	const manifestSha256 = await sha256File(RECEIVER_PARENT_MANIFEST_PATH);
	requireCondition(
		manifestSha256 === RECEIVER_PARENT.manifestSha256,
		'CR3 receiver-light parent manifest changed.',
	);
	const manifest = await readJson(RECEIVER_PARENT_MANIFEST_PATH);
	const byPath = new Map(manifest.artifacts.map((entry) => [entry.path, entry]));
	const artifacts = {};
	for (const [key, expected] of Object.entries(RECEIVER_PARENT.artifacts)) {
		artifacts[key] = ordinaryManifestArtifact(byPath, expected, 'CR3 receiver-light parent artifact');
	}
	const result = await readJson(path.join(RECEIVER_PARENT_DIRECTORY, RECEIVER_PARENT.artifacts.result.path));
	const proof = await readJson(path.join(RECEIVER_PARENT_DIRECTORY, RECEIVER_PARENT.artifacts.proof.path));
	const analysis = await readJson(
		path.join(RECEIVER_PARENT_DIRECTORY, RECEIVER_PARENT.artifacts.measurementAnalysis.path),
	);
	requireCondition(
		result.accepted === true &&
			result.integrityPassed === true &&
			proof.accepted === true &&
			proof.integrityPassed === true &&
			analysis.schemaId === 'algorithm32-color-reset-cr2-browser-result-v1',
		'CR3 receiver-light parent result, proof, or analysis is not accepted.',
	);
	const analysisScenes = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const rawByScene = new Map(analysis.rawDiffuseRadiances.map((record) => [record.sceneId, record]));
	const scenes = [];
	for (const fixtureScene of fixture.scenes) {
		const scene = analysisScenes.get(fixtureScene.id);
		const raw = rawByScene.get(fixtureScene.id);
		requireCondition(scene && raw, `CR3 receiver parent omits ${fixtureScene.id}.`);
		requireCondition(
			scene.timeIso === fixtureScene.timeIso &&
				scene.cacheStatus === fixtureScene.cacheStatus &&
				scene.cacheIdentity === fixtureScene.cacheIdentity &&
				Math.abs(scene.solarZenithDegrees - fixtureScene.solarZenithDegrees) <= 1e-12 &&
				exactJson(scene.directionToSourceModel, fixtureScene.directionToSourceModel),
			`CR3 receiver parent scene ${fixtureScene.id} changed physical identity.`,
		);
		requireCondition(
			raw.artifactPath === fixtureScene.rawDiffuseRadiance.path &&
				raw.byteLength === fixtureScene.rawDiffuseRadiance.byteLength &&
				raw.sha256 === fixtureScene.rawDiffuseRadiance.sha256 &&
				raw.quadratureId === CR2_QUADRATURE_ID &&
				raw.directionCount === 4096 &&
				raw.channelCount === 15 &&
				raw.basisContentHash === NATIVE15_BASIS_HASH,
			`CR3 receiver parent raw field ${fixtureScene.id} changed.`,
		);
		const rawArtifact = ordinaryManifestArtifact(
			byPath,
			fixtureScene.rawDiffuseRadiance,
			'CR3 receiver-light raw artifact',
		);
		const rawBytes = await readFile(path.join(RECEIVER_PARENT_DIRECTORY, raw.artifactPath));
		const rawScan = scanFloat32Radiance(rawBytes, `CR3 receiver field ${fixtureScene.id}`);
		const measurement = scene.measurement;
		requireCondition(
			measurement?.schemaId === 'algorithm32-color-reset-cr2-scene-measurement-v1' &&
				measurement.spectralBasis?.contentHash === NATIVE15_BASIS_HASH &&
				measurement.spectralBasis.channelCount === 15 &&
				measurement.quadrature?.primary?.id === CR2_QUADRATURE_ID &&
				measurement.quadrature.primary.sampleCount === 4096,
			`CR3 receiver measurement ${fixtureScene.id} changed basis or quadrature.`,
		);
		const packets = measurement.packets;
		requireCondition(
			packetMatchesFixture(packets.directNormal, fixtureScene.directNormalPacketContentHash) &&
				packetMatchesFixture(packets.directHorizontal, fixtureScene.directHorizontalPacketContentHash) &&
				packetMatchesFixture(packets.diffuseHorizontal, fixtureScene.diffuseHorizontalPacketContentHash) &&
				packetMatchesFixture(packets.totalHorizontal, fixtureScene.totalHorizontalPacketContentHash),
			`CR3 receiver packets ${fixtureScene.id} changed.`,
		);
		requireCondition(
			measurement.photopic.directNormal.illuminance.value === fixtureScene.directNormalLux &&
				measurement.photopic.directHorizontal.illuminance.value === fixtureScene.directHorizontalLux &&
				measurement.photopic.diffuseHorizontal.illuminance.value === fixtureScene.diffuseHorizontalLux &&
				measurement.photopic.totalHorizontal.illuminance.value === fixtureScene.totalHorizontalLux &&
				measurement.colorState?.unchanged === true,
			`CR3 receiver photopic labels or Color state ${fixtureScene.id} changed.`,
		);
		scenes.push({
			sceneId: fixtureScene.id,
			timeIso: fixtureScene.timeIso,
			solarZenithDegrees: fixtureScene.solarZenithDegrees,
			cacheStatus: fixtureScene.cacheStatus,
			cacheIdentity: fixtureScene.cacheIdentity,
			directionToSourceModel: fixtureScene.directionToSourceModel,
			measurement,
			rawRadiance: {
				...rawArtifact,
				url: `/cr2/${raw.artifactPath}`,
				layout: raw.layout,
				storage: raw.storage,
				quantity: raw.quantity,
				units: raw.units,
				semantics: raw.semantics,
				quadratureId: raw.quadratureId,
				directionCount: raw.directionCount,
				channelCount: raw.channelCount,
				basisContentHash: raw.basisContentHash,
				scan: rawScan,
			},
		});
	}
	return {
		evidence: {
			schemaId: 'algorithm32-color-reset-cr3-receiver-parent-verification-v1',
			namespace: 'color-reset',
			runPath: `tmp/extraterrestrial/color-reset/runs/${RECEIVER_PARENT.runId}`,
			summary,
			manifest: {
				path: `tmp/extraterrestrial/color-reset/runs/${RECEIVER_PARENT.runId}/artifact-manifest.json`,
				sha256: manifestSha256,
				artifactSetSha256: manifest.artifactSetSha256,
			},
			artifacts,
			scenes,
		},
		browserParent: {
			runId: RECEIVER_PARENT.runId,
			artifactSetSha256: RECEIVER_PARENT.artifactSetSha256,
			manifestSha256,
			artifactRouteRoot: '/cr2/',
			measurementAnalysis: {
				...artifacts.measurementAnalysis,
				schemaId: 'algorithm32-color-reset-cr2-browser-result-v1',
				url: `/cr2/${artifacts.measurementAnalysis.path}`,
			},
			scenes,
		},
	};
}

async function verifySkyParent(fixture) {
	await assertNoReparseEntries(SKY_PARENT_DIRECTORY, 'CR3 sky parent run');
	const summary = await verifyColorResetRun(SKY_PARENT.runId);
	requireCondition(
		summary.verified === true &&
			summary.conclusion === 'accepted' &&
			summary.artifactSetSha256 === SKY_PARENT.artifactSetSha256,
		'CR3 sky parent is not the accepted immutable CR1 run.',
	);
	const manifestFacts = await lstat(SKY_PARENT_MANIFEST_PATH);
	requireCondition(
		manifestFacts.isFile() && !manifestFacts.isSymbolicLink(),
		'CR3 sky parent manifest is not an ordinary file.',
	);
	const manifestSha256 = await sha256File(SKY_PARENT_MANIFEST_PATH);
	requireCondition(manifestSha256 === SKY_PARENT.manifestSha256, 'CR3 sky parent manifest changed.');
	const manifest = await readJson(SKY_PARENT_MANIFEST_PATH);
	const byPath = new Map(manifest.artifacts.map((entry) => [entry.path, entry]));
	const scenes = fixture.scenes.map((scene) => {
		const artifact = ordinaryManifestArtifact(
			byPath,
			scene.skyBackplate,
			'CR3 sky-parent backplate',
		);
		return {
			sceneId: scene.id,
			artifactPath: artifact.path,
			byteLength: artifact.byteLength,
			sha256: artifact.sha256,
			url: `/cr1/${artifact.path}`,
		};
	});
	return {
		evidence: {
			schemaId: 'algorithm32-color-reset-cr3-sky-parent-verification-v1',
			namespace: 'color-reset',
			runPath: `tmp/extraterrestrial/color-reset/runs/${SKY_PARENT.runId}`,
			summary,
			manifest: {
				path: `tmp/extraterrestrial/color-reset/runs/${SKY_PARENT.runId}/artifact-manifest.json`,
				sha256: manifestSha256,
				artifactSetSha256: manifest.artifactSetSha256,
			},
			scenes,
		},
		browserParent: {
			runId: SKY_PARENT.runId,
			artifactSetSha256: SKY_PARENT.artifactSetSha256,
			manifestSha256,
			artifactRouteRoot: '/cr1/',
			colorId: fixture.skyControl.colorId,
			scenes,
		},
	};
}

function assertParentUnchanged(before, after, label) {
	requireCondition(exactJson(before, after), `${label} changed while CR3 used it.`);
}

async function verifyControlSnapshot() {
	const manifestHash = await sha256File(SNAPSHOT_MANIFEST_PATH);
	requireCondition(manifestHash === SNAPSHOT_MANIFEST_SHA256, 'CR3 control snapshot manifest changed.');
	const manifest = await readJson(SNAPSHOT_MANIFEST_PATH);
	requireCondition(
		manifest.schemaId === 'algorithm32-color-reset-production-control-snapshot-v1' &&
			manifest.inventory?.aggregateSha256 === SNAPSHOT_INVENTORY_SHA256 &&
			manifest.inventory.fileCount === 147,
		'CR3 control snapshot identity changed.',
	);
	const selectedPaths = new Set(manifest.inventory.files.map((entry) => entry.path));
	const [snapshotInventory, productionSelection] = await Promise.all([
		createFileInventory(SNAPSHOT_SOURCE_ROOT),
		createFileInventory(PRODUCTION_SOURCE_ROOT, {
			include: (relativePath) => selectedPaths.has(relativePath),
		}),
	]);
	assertFileInventoriesEqual(manifest.inventory, snapshotInventory, 'Recorded CR3 snapshot');
	assertFileInventoriesEqual(snapshotInventory, productionSelection, 'CR3 snapshot and production closure');
	return {
		schemaId: 'algorithm32-color-reset-control-snapshot-verification-v1',
		accepted: true,
		manifestPath: 'experiments/extraterrestrial/color-reset/controls/production-v1/snapshot-manifest.json',
		manifestSha256: manifestHash,
		inventory: snapshotInventory,
		productionSelection,
	};
}

async function captureRuntimeImplementationBefore() {
	const implementationClosure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: [
			'color-reset/runners/run-cr3-neutral-geometry-ambient-proof.js',
			'color-reset/harness/cr3-neutral-geometry-ambient-proof-browser.js',
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
			'node:zlib',
		],
	});
	const implementationInventory = await createSelectedFileInventory(
		EXPERIMENT_ROOT,
		implementationClosure.files,
	);
	const threeServedClosure = await buildStaticModuleClosure({
		candidateRoot: THREE_ROOT,
		entryFiles: ['build/three.module.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
	});
	const threeServedInventory = await createSelectedFileInventory(
		THREE_ROOT,
		threeServedClosure.files,
	);
	const threePackagePath = path.join(THREE_ROOT, 'package.json');
	const threePackage = await readJson(threePackagePath);
	requireCondition(threePackage.version === '0.180.0', 'CR3 requires locked Three 0.180.0.');
	return {
		schemaId: 'algorithm32-color-reset-cr3-runtime-implementation-before-v1',
		implementation: {closure: implementationClosure, inventory: implementationInventory},
		browserDependencies: {
			importMap: {three: '/dependencies/three/build/three.module.js'},
			servedClosure: threeServedClosure,
			servedInventory: threeServedInventory,
			threePackage: {
				version: threePackage.version,
				packageJsonSha256: await sha256File(threePackagePath),
			},
		},
		packageBoundary: {
			packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
			packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
		},
	};
}

async function captureRuntimeImplementationAfter(before) {
	return {
		schemaId: 'algorithm32-color-reset-cr3-runtime-implementation-after-v1',
		implementationInventory: await createSelectedFileInventory(
			EXPERIMENT_ROOT,
			before.implementation.closure.files,
		),
		threeServedInventory: await createSelectedFileInventory(
			THREE_ROOT,
			before.browserDependencies.servedClosure.files,
		),
		threePackageJsonSha256: await sha256File(path.join(THREE_ROOT, 'package.json')),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

function assertRuntimeImplementationUnchanged(before, after) {
	assertFileInventoriesEqual(
		before.implementation.inventory,
		after.implementationInventory,
		'CR3 runtime implementation',
	);
	assertFileInventoriesEqual(
		before.browserDependencies.servedInventory,
		after.threeServedInventory,
		'CR3 browser-served Three ESM closure',
	);
	requireCondition(
		before.browserDependencies.threePackage.packageJsonSha256 === after.threePackageJsonSha256 &&
			before.packageBoundary.packageJsonSha256 === after.packageJsonSha256 &&
			before.packageBoundary.packageLockSha256 === after.packageLockSha256,
		'CR3 package boundary changed while the browser was executing.',
	);
}

function verifyLightingOwnership(browserClosure) {
	const ownerPath = 'lighting/Cr3NeutralLambertianLighting.js';
	requireCondition(
		browserClosure.files.includes(ownerPath),
		'CR3 browser closure does not contain the neutral Lambertian owner.',
	);
	const directImports = browserClosure.edges.filter((edge) => edge.from === ownerPath);
	const forbiddenImports = directImports.filter((edge) =>
		typeof edge.to === 'string' && (
			edge.to.startsWith('color/') ||
			edge.to.includes('/bruneton-color/') ||
			edge.to.includes('/ferwerda-color/') ||
			edge.to.includes('/bruneton-source-luminance-lift-color/')
		),
	);
	requireCondition(
		forbiddenImports.length === 0,
		'CR3 neutral Lambertian lighting imports a Color or display implementation.',
	);
	return {
		schemaId: 'algorithm32-color-reset-cr3-lighting-ownership-v1',
		accepted: true,
		ownerPath,
		directImports,
		forbiddenImports,
		boundary:
			'The physical Lambertian owner may import spectral basis, packet, and quadrature owners; Color and display imports are forbidden. Scene id may appear only in returned provenance identities and cannot alter numerical response.',
	};
}

function makeBrowserConfiguration(fixture, receiverParent, skyParent) {
	return {
		schemaId: 'algorithm32-color-reset-cr3-browser-config-v1',
		fixtureSha256: FIXTURE_SHA256,
		location: fixture.location,
		observer: fixture.observer,
		camera: fixture.camera,
		neutralGeometry: fixture.neutralGeometry,
		material: fixture.material,
		incidentLight: fixture.incidentLight,
		surfaceResponse: fixture.surfaceResponse,
		presentation: fixture.presentation,
		thresholds: fixture.thresholds,
		outputs: fixture.outputs,
		scenes: fixture.scenes,
		parentReceiverLight: receiverParent,
		skyControl: skyParent,
	};
}

function elapsedMilliseconds(initializedAt, completedAt) {
	return Date.parse(completedAt) - Date.parse(initializedAt);
}

function makeProgress(run, browser) {
	const firstImage = browser.uploads.find((entry) => entry.path === EXPECTED_IMAGES[0]);
	const decisionPlate = browser.uploads.find((entry) => entry.path === CONTACT_SHEET_PATH);
	requireCondition(firstImage && decisionPlate, 'CR3 progress artifacts are incomplete.');
	const firstImageElapsedMilliseconds = elapsedMilliseconds(run.initializedAt, firstImage.completedAt);
	const decisionPlateElapsedMilliseconds = elapsedMilliseconds(
		run.initializedAt,
		decisionPlate.completedAt,
	);
	return {
		schemaId: 'algorithm32-color-reset-progress-v1',
		runId: run.runId,
		initializedAt: run.initializedAt,
		firstImage: {
			artifactPath: firstImage.path,
			completedAt: firstImage.completedAt,
			elapsedMilliseconds: firstImageElapsedMilliseconds,
			targetMilliseconds: 180_000,
			targetMet: firstImageElapsedMilliseconds <= 180_000,
		},
		decisionPlate: {
			artifactPath: decisionPlate.path,
			completedAt: decisionPlate.completedAt,
			elapsedMilliseconds: decisionPlateElapsedMilliseconds,
			targetMilliseconds: 600_000,
			targetMet: decisionPlateElapsedMilliseconds <= 600_000,
		},
		browserProgressEvents: browser.progressEvents,
	};
}

function attachArtifactIdentities(browserResult, uploads) {
	const uploadsByPath = new Map(uploads.map((entry) => [entry.path, entry]));
	const attach = (record, label) => {
		const upload = uploadsByPath.get(record?.artifactPath);
		requireCondition(upload, `CR3 ${label} has no upload identity for ${record?.artifactPath}.`);
		requireCondition(
			record.byteLength === upload.byteLength,
			`CR3 ${label} browser/server byte lengths differ for ${record.artifactPath}.`,
		);
		return {...record, sha256: upload.sha256, completedAt: upload.completedAt};
	};
	requireCondition(
		Array.isArray(browserResult.images) &&
			Array.isArray(browserResult.rawLinearFields) &&
			Array.isArray(browserResult.scenes) &&
			browserResult.geometry?.mask,
		'CR3 browser result omits images, raw fields, scenes, or the geometry mask.',
	);
	return {
		...browserResult,
		images: browserResult.images.map((record) => attach(record, 'image')),
		rawLinearFields: browserResult.rawLinearFields.map((record) => attach(record, 'raw field')),
		geometry: {
			...browserResult.geometry,
			mask: attach(browserResult.geometry.mask, 'geometry mask'),
		},
	};
}

async function ordinaryRunArtifact(run, artifactPath, expectedByteLength, label) {
	const target = path.join(run.runDirectory, ...artifactPath.split('/'));
	assertLexicallyContained(run.runDirectory, target, label);
	const facts = await lstat(target);
	requireCondition(facts.isFile() && !facts.isSymbolicLink(), `${label} is not an ordinary file.`);
	requireCondition(facts.size === expectedByteLength, `${label} has the wrong byte length.`);
	return {target, bytes: await readFile(target), sha256: await sha256File(target)};
}

function crc32(bytes) {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function paethPredictor(left, up, upperLeft) {
	const estimate = left + up - upperLeft;
	const leftDistance = Math.abs(estimate - left);
	const upDistance = Math.abs(estimate - up);
	const upperLeftDistance = Math.abs(estimate - upperLeft);
	if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
	return upDistance <= upperLeftDistance ? up : upperLeft;
}

function decodeRgba8Png(bytes, expectedWidth, expectedHeight, label) {
	requireCondition(
		Buffer.isBuffer(bytes) &&
			bytes.byteLength >= 33 &&
			bytes.subarray(0, PNG_SIGNATURE.byteLength).equals(PNG_SIGNATURE),
		`${label} has an invalid PNG signature.`,
	);
	let offset = PNG_SIGNATURE.byteLength;
	let width = null;
	let height = null;
	let bitDepth = null;
	let colorType = null;
	let compressionMethod = null;
	let filterMethod = null;
	let interlaceMethod = null;
	let headerSeen = false;
	let endSeen = false;
	let chunkCount = 0;
	const compressedParts = [];
	while (offset < bytes.byteLength) {
		requireCondition(offset + 12 <= bytes.byteLength, `${label} has a truncated PNG chunk header.`);
		const length = bytes.readUInt32BE(offset);
		const chunkEnd = offset + 12 + length;
		requireCondition(chunkEnd <= bytes.byteLength, `${label} has a truncated PNG chunk body.`);
		const typeBytes = bytes.subarray(offset + 4, offset + 8);
		const type = typeBytes.toString('ascii');
		const data = bytes.subarray(offset + 8, offset + 8 + length);
		const expectedCrc = bytes.readUInt32BE(offset + 8 + length);
		const actualCrc = crc32(Buffer.concat([typeBytes, data]));
		requireCondition(actualCrc === expectedCrc, `${label} PNG chunk ${type} has an invalid CRC.`);
		chunkCount += 1;
		if (type === 'IHDR') {
			requireCondition(!headerSeen && chunkCount === 1 && length === 13, `${label} has an invalid IHDR.`);
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			bitDepth = data[8];
			colorType = data[9];
			compressionMethod = data[10];
			filterMethod = data[11];
			interlaceMethod = data[12];
			headerSeen = true;
		} else if (type === 'IDAT') {
			requireCondition(headerSeen && !endSeen, `${label} has an IDAT outside its PNG image body.`);
			compressedParts.push(data);
		} else if (type === 'IEND') {
			requireCondition(headerSeen && length === 0, `${label} has an invalid IEND.`);
			endSeen = true;
			offset = chunkEnd;
			break;
		}
		offset = chunkEnd;
	}
	requireCondition(headerSeen && endSeen && offset === bytes.byteLength, `${label} has an incomplete PNG structure.`);
	requireCondition(
		width === expectedWidth && height === expectedHeight,
		`${label} dimensions are ${width} x ${height}; expected ${expectedWidth} x ${expectedHeight}.`,
	);
	requireCondition(
		bitDepth === 8 &&
			colorType === 6 &&
			compressionMethod === 0 &&
			filterMethod === 0 &&
			interlaceMethod === 0,
		`${label} is not a non-interlaced 8-bit RGBA PNG.`,
	);
	requireCondition(compressedParts.length > 0, `${label} has no IDAT data.`);
	const bytesPerPixel = 4;
	const stride = width * bytesPerPixel;
	const packed = inflateSync(Buffer.concat(compressedParts));
	requireCondition(
		packed.byteLength === (stride + 1) * height,
		`${label} has an invalid decompressed scanline length.`,
	);
	const rgba = Buffer.alloc(stride * height);
	for (let y = 0; y < height; y += 1) {
		const packedRow = y * (stride + 1);
		const rgbaRow = y * stride;
		const filter = packed[packedRow];
		requireCondition(filter >= 0 && filter <= 4, `${label} uses unsupported PNG filter ${filter}.`);
		for (let byteIndex = 0; byteIndex < stride; byteIndex += 1) {
			const encoded = packed[packedRow + 1 + byteIndex];
			const left = byteIndex >= bytesPerPixel
				? rgba[rgbaRow + byteIndex - bytesPerPixel]
				: 0;
			const up = y > 0 ? rgba[rgbaRow - stride + byteIndex] : 0;
			const upperLeft = y > 0 && byteIndex >= bytesPerPixel
				? rgba[rgbaRow - stride + byteIndex - bytesPerPixel]
				: 0;
			const predictor = filter === 0
				? 0
				: filter === 1
					? left
					: filter === 2
						? up
						: filter === 3
							? Math.floor((left + up) / 2)
							: paethPredictor(left, up, upperLeft);
			rgba[rgbaRow + byteIndex] = (encoded + predictor) & 0xff;
		}
	}
	return {
		width,
		height,
		bitDepth,
		colorType,
		compressionMethod,
		filterMethod,
		interlaceMethod,
		chunkCount,
		idatChunkCount: compressedParts.length,
		rgba,
	};
}

async function ordinarySkyParentArtifact(scene, label) {
	const target = path.join(SKY_PARENT_DIRECTORY, ...scene.skyBackplate.path.split('/'));
	assertLexicallyContained(SKY_PARENT_DIRECTORY, target, label);
	const facts = await lstat(target);
	requireCondition(facts.isFile() && !facts.isSymbolicLink(), `${label} is not an ordinary file.`);
	requireCondition(
		facts.size === scene.skyBackplate.byteLength,
		`${label} has the wrong byte length.`,
	);
	const sha256 = await sha256File(target);
	requireCondition(sha256 === scene.skyBackplate.sha256, `${label} changed identity.`);
	return {target, bytes: await readFile(target), sha256};
}

function pngMetadata(decoded) {
	return {
		width: decoded.width,
		height: decoded.height,
		bitDepth: decoded.bitDepth,
		colorType: decoded.colorType,
		compressionMethod: decoded.compressionMethod,
		filterMethod: decoded.filterMethod,
		interlaceMethod: decoded.interlaceMethod,
		chunkCount: decoded.chunkCount,
		idatChunkCount: decoded.idatChunkCount,
	};
}

async function verifyPrimaryPngSkyBackplates(run, fixture, analysis) {
	const panel = fixture.presentation.panel;
	const contentWidth = panel.contentWidthPixels;
	const contentHeight = panel.contentHeightPixels;
	const headerHeight = panel.headerHeightPixels;
	requireCondition(
		panel.widthPixels === contentWidth &&
			panel.heightPixels === headerHeight + contentHeight &&
			contentWidth === fixture.camera.widthPixels &&
			contentHeight === fixture.camera.heightPixels,
		'CR3 primary PNG content/header geometry changed.',
	);
	const maskArtifact = await ordinaryRunArtifact(
		run,
		EXPECTED_GEOMETRY_MASK,
		fixture.neutralGeometry.mask.expectedByteLength,
		'CR3 independent PNG geometry mask',
	);
	const imageByPath = new Map(analysis.images.map((image) => [image.artifactPath, image]));
	const analysisSceneById = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const decodedBackplates = new Map();
	for (const scene of fixture.scenes) {
		const artifact = await ordinarySkyParentArtifact(
			scene,
			`CR3 independent PNG sky backplate ${scene.id}`,
		);
		const decoded = decodeRgba8Png(
			artifact.bytes,
			contentWidth,
			contentHeight,
			`CR3 independent PNG sky backplate ${scene.id}`,
		);
		decodedBackplates.set(scene.id, {artifact, decoded});
	}
	let comparedPixelCount = 0;
	for (const code of maskArtifact.bytes) {
		if (code === 0) comparedPixelCount += 1;
	}
	const frames = [];
	for (const mode of FRAME_MODES) {
		for (const expectedScene of EXPECTED_SCENES) {
			const artifactPath = `captures/cr3-${mode}-${expectedScene.id}.png`;
			const imageRecord = imageByPath.get(artifactPath);
			requireCondition(imageRecord, `CR3 independent PNG verifier cannot find ${artifactPath}.`);
			const primaryArtifact = await ordinaryRunArtifact(
				run,
				artifactPath,
				imageRecord.byteLength,
				`CR3 independent primary PNG ${mode} ${expectedScene.id}`,
			);
			const primary = decodeRgba8Png(
				primaryArtifact.bytes,
				panel.widthPixels,
				panel.heightPixels,
				`CR3 independent primary PNG ${mode} ${expectedScene.id}`,
			);
			const {artifact: backplateArtifact, decoded: backplate} = decodedBackplates.get(
				expectedScene.id,
			);
			let differingRgbaCodeCount = 0;
			let maximumRgbaCodeDifference = 0;
			for (let y = 0; y < contentHeight; y += 1) {
				for (let x = 0; x < contentWidth; x += 1) {
					const pixelIndex = y * contentWidth + x;
					if (maskArtifact.bytes[pixelIndex] !== 0) continue;
					const primaryOffset = ((y + headerHeight) * panel.widthPixels + x) * 4;
					const backplateOffset = pixelIndex * 4;
					for (let channel = 0; channel < 4; channel += 1) {
						const difference = Math.abs(
							primary.rgba[primaryOffset + channel] -
							backplate.rgba[backplateOffset + channel],
						);
						if (difference !== 0) differingRgbaCodeCount += 1;
						maximumRgbaCodeDifference = Math.max(maximumRgbaCodeDifference, difference);
					}
				}
			}
			const frame = analysisSceneById.get(expectedScene.id)?.frames?.[mode];
			frames.push({
				sceneId: expectedScene.id,
				mode,
				artifactPath,
				primaryPng: {
					byteLength: primaryArtifact.bytes.byteLength,
					sha256: primaryArtifact.sha256,
					...pngMetadata(primary),
				},
				backplatePng: {
					artifactPath: fixtureSceneMap(fixture).get(expectedScene.id).skyBackplate.path,
					byteLength: backplateArtifact.bytes.byteLength,
					sha256: backplateArtifact.sha256,
					...pngMetadata(backplate),
				},
				contentRectangle: {
					x: 0,
					y: headerHeight,
					width: contentWidth,
					height: contentHeight,
				},
				comparedPixelCount,
				comparedRgbaCodeCount: comparedPixelCount * 4,
				differingRgbaCodeCount,
				maximumRgbaCodeDifference,
				exact: differingRgbaCodeCount === 0,
				identityMatchesBrowserUpload:
					primaryArtifact.sha256 === imageRecord.sha256 &&
					primaryArtifact.bytes.byteLength === imageRecord.byteLength &&
					frame?.artifactPath === artifactPath,
				browserReportedExact:
					frame?.skyReplay?.passed === true &&
					frame.skyReplay.maximumOutsideMaskCodeDifference === 0,
			});
		}
	}
	return {
		schemaId: 'algorithm32-color-reset-cr3-independent-png-sky-replay-v1',
		accepted:
			maskArtifact.sha256 === analysis.geometry.mask.sha256 &&
			frames.length === FRAME_MODES.length * EXPECTED_SCENES.length &&
			frames.every((frame) => frame.exact && frame.identityMatchesBrowserUpload),
		operation:
			'Decode each uploaded non-interlaced RGBA8 primary PNG in Node, skip its declared label header, and compare every RGBA code in the 640 x 400 content rectangle whose top-down R8 geometry-mask code is zero with the corresponding decoded immutable CR1 Bruneton backplate code.',
		geometryMask: {
			artifactPath: EXPECTED_GEOMETRY_MASK,
			byteLength: maskArtifact.bytes.byteLength,
			sha256: maskArtifact.sha256,
			backplatePixelCount: comparedPixelCount,
		},
		contentRectangle: {x: 0, y: headerHeight, width: contentWidth, height: contentHeight},
		channelsCompared: ['R', 'G', 'B', 'A'],
		frames,
	};
}

async function verifyBrowserBinaryArtifacts(run, fixture, analysis) {
	const maskArtifact = await ordinaryRunArtifact(
		run,
		EXPECTED_GEOMETRY_MASK,
		fixture.neutralGeometry.mask.expectedByteLength,
		'CR3 uploaded geometry mask',
	);
	const maskCounts = {backplate: 0, plane: 0, sphere: 0, invalid: 0};
	for (const code of maskArtifact.bytes) {
		if (code === 0) maskCounts.backplate += 1;
		else if (code === 1) maskCounts.plane += 1;
		else if (code === 2) maskCounts.sphere += 1;
		else maskCounts.invalid += 1;
	}
	const maskMatchesBrowser =
		maskArtifact.sha256 === analysis.geometry.mask.sha256 &&
		exactJson(maskCounts, analysis.geometry.mask.counts) &&
		maskCounts.invalid === 0;

	const fields = [];
	for (let sceneIndex = 0; sceneIndex < EXPECTED_SCENES.length; sceneIndex += 1) {
		const expectedPath = EXPECTED_RAW_LINEAR_FIELDS[sceneIndex];
		const browserRecord = analysis.rawLinearFields[sceneIndex];
		const artifact = await ordinaryRunArtifact(
			run,
			expectedPath,
			fixture.outputs.rawLinearFieldByteLengthEach,
			`CR3 uploaded raw field ${EXPECTED_SCENES[sceneIndex].id}`,
		);
		const view = new DataView(
			artifact.bytes.buffer,
			artifact.bytes.byteOffset,
			artifact.bytes.byteLength,
		);
		let finite = true;
		let maximumAbsoluteDifference = 0;
		let maximumRelativeDifference = 0;
		let differingValueCount = 0;
		const pixelStride = FRAME_MODES.length * 4;
		for (let pixelIndex = 0; pixelIndex < 640 * 400; pixelIndex += 1) {
			const pixelBase = pixelIndex * pixelStride;
			for (let modeIndex = 0; modeIndex < FRAME_MODES.length; modeIndex += 1) {
				for (let channelIndex = 0; channelIndex < 4; channelIndex += 1) {
					const valueIndex = pixelBase + modeIndex * 4 + channelIndex;
					const value = view.getFloat32(valueIndex * 4, true);
					finite &&= Number.isFinite(value);
				}
			}
			for (let channelIndex = 0; channelIndex < 4; channelIndex += 1) {
				const direct = view.getFloat32((pixelBase + channelIndex) * 4, true);
				const diffuse = view.getFloat32((pixelBase + 4 + channelIndex) * 4, true);
				const combined = view.getFloat32((pixelBase + 8 + channelIndex) * 4, true);
				const absolute = Math.abs(combined - (direct + diffuse));
				const relative = absolute / Math.max(Math.abs(combined), Math.abs(direct + diffuse), 1e-30);
				maximumAbsoluteDifference = Math.max(maximumAbsoluteDifference, absolute);
				maximumRelativeDifference = Math.max(maximumRelativeDifference, relative);
				if (absolute !== 0) differingValueCount += 1;
			}
		}
		const browserDifference = browserRecord.analysis?.combinedDifference;
		const replaysBrowserAnalysis =
			browserDifference?.maximumAbsoluteDifference === maximumAbsoluteDifference &&
			browserDifference.maximumRelativeDifference === maximumRelativeDifference &&
			browserDifference.differingValueCount === differingValueCount;
		fields.push({
			sceneId: EXPECTED_SCENES[sceneIndex].id,
			artifactPath: expectedPath,
			byteLength: artifact.bytes.byteLength,
			sha256: artifact.sha256,
			finite,
			layout: fixture.outputs.rawLinearFieldLayout,
			additivity: {
				maximumAbsoluteDifference,
				maximumRelativeDifference,
				differingValueCount,
				replaysBrowserAnalysis,
				passed:
					maximumAbsoluteDifference <= fixture.thresholds.float32LinearFieldAbsoluteTolerance ||
					maximumRelativeDifference <= fixture.thresholds.float32LinearFieldRelativeTolerance,
			},
			identityMatchesBrowser:
				artifact.sha256 === browserRecord.sha256 &&
				artifact.bytes.byteLength === browserRecord.byteLength,
		});
	}
	return {
		schemaId: 'algorithm32-color-reset-cr3-binary-artifact-verification-v1',
		accepted:
			maskMatchesBrowser &&
			fields.every((field) =>
				field.finite &&
				field.identityMatchesBrowser &&
				field.additivity.replaysBrowserAnalysis,
			),
		layout:
			'pixel-major, then direct-only/diffuse-only/combined, then linear R/G/B and photopic Y; top-down little-endian float32',
		mask: {
			artifactPath: EXPECTED_GEOMETRY_MASK,
			byteLength: maskArtifact.bytes.byteLength,
			sha256: maskArtifact.sha256,
			counts: maskCounts,
			matchesBrowser: maskMatchesBrowser,
		},
		fields,
	};
}

function installedRuntime(value) {
	return value?.status === 'installed' &&
		value.runtime?.status === 'ready' &&
		value.runtime.renderErrorCount === 0 &&
		value.runtime.lastRenderError === null;
}

function finiteNonnegative(value) {
	return Number.isFinite(value) && value >= 0;
}

function proofComparisonPassed(record) {
	return record?.passed === true &&
		finiteNonnegative(record.maximumAbsoluteDifference ?? 0) &&
		finiteNonnegative(record.maximumRelativeDifference ?? 0);
}

function differenceWithin(record, absoluteTolerance, relativeTolerance) {
	return record?.exact === true || (
		finiteNonnegative(record?.maximumAbsoluteDifference) &&
		finiteNonnegative(record?.maximumRelativeDifference) &&
		(
			record.maximumAbsoluteDifference <= absoluteTolerance ||
			record.maximumRelativeDifference <= relativeTolerance
		)
	);
}

function planeReplayPassed(record, thresholds) {
	if (record?.exact === true) return true;
	const comparisons = record?.comparisons;
	return finiteNonnegative(comparisons?.directionProjectionFactor?.absoluteDifference) &&
		comparisons.directionProjectionFactor.absoluteDifference <=
			thresholds.directionProjectionFactorAbsoluteTolerance &&
		differenceWithin(
			comparisons?.directHorizontal,
			thresholds.directHorizontalReplayAbsoluteTolerance,
			thresholds.directHorizontalReplayRelativeTolerance,
		) &&
		differenceWithin(
			comparisons?.diffuseHorizontal,
			thresholds.horizontalDiffuseReplayAbsoluteTolerance,
			thresholds.horizontalDiffuseReplayRelativeTolerance,
		) &&
		differenceWithin(
			comparisons?.totalHorizontal,
			thresholds.totalHorizontalReplayAbsoluteTolerance,
			thresholds.totalHorizontalReplayRelativeTolerance,
		) &&
		comparisons?.expectedTotalEquation?.exact === true;
}

function frameContractPassed(frame, artifactPath, geometryMaskSha256) {
	return frame?.artifactPath === artifactPath &&
		frame.colorId === BRUNETON_COLOR_ID &&
		typeof frame.shaderSourceHash === 'string' &&
		frame.rendererLinearResponse?.finite === true &&
		Number.isSafeInteger(frame.rendererLinearResponse.pixelCount) &&
		frame.rendererLinearResponse.pixelCount > 0 &&
		frame.display?.finite === true &&
		frame.objectMask?.sha256 === geometryMaskSha256 &&
		frame.skyReplay?.passed === true &&
		frame.skyReplay.maximumOutsideMaskCodeDifference === 0;
}

function evaluateGates({
	analysis,
	browser,
	fixture,
	progress,
	lightingOwnership,
	binaryArtifactVerification,
	pngSkyBackplateVerification,
}) {
	const uploadedPaths = browser.uploads.map((entry) => entry.path);
	const sceneById = new Map(analysis.scenes.map((scene) => [scene.sceneId, scene]));
	const allFrames = analysis.scenes.flatMap((scene) =>
		FRAME_MODES.map((mode) => scene.frames?.[mode]),
	);
	const integrityGates = {
		browserResultSchema: analysis.schemaId === 'algorithm32-color-reset-cr3-browser-result-v1',
		allRequestedArtifactsWritten:
			browser.uploads.length === EXPECTED_BROWSER_ARTIFACTS.length &&
			exactJson(uploadedPaths, EXPECTED_BROWSER_ARTIFACTS),
		allRequestedImagesWritten:
			analysis.images.length === EXPECTED_IMAGES.length &&
			exactJson(analysis.images.map((entry) => entry.artifactPath), EXPECTED_IMAGES) &&
			analysis.images.every((entry) =>
				Number.isSafeInteger(entry.width) &&
				entry.width > 0 &&
				Number.isSafeInteger(entry.height) &&
				entry.height > 0 &&
				typeof entry.kind === 'string' &&
				typeof entry.derivation === 'string',
			) &&
			analysis.images.slice(0, 12).every((entry) =>
				entry.width === fixture.presentation.panel.widthPixels &&
				entry.height === fixture.presentation.panel.heightPixels,
			) &&
			analysis.images.at(-1).width === fixture.presentation.contactSheet.widthPixels &&
			analysis.images.at(-1).height === fixture.presentation.contactSheet.heightPixels,
		rawLinearFieldsComplete:
			analysis.rawLinearFields.length === EXPECTED_RAW_LINEAR_FIELDS.length &&
			exactJson(
				analysis.rawLinearFields.map((entry) => entry.artifactPath),
				EXPECTED_RAW_LINEAR_FIELDS,
			) &&
			analysis.rawLinearFields.every((entry, index) =>
				entry.sceneId === EXPECTED_SCENES[index].id &&
				entry.byteLength === fixture.outputs.rawLinearFieldByteLengthEach &&
				entry.valueCount === 640 * 400 * 3 * 4 &&
				entry.finite === true &&
				entry.layout === fixture.outputs.rawLinearFieldLayout &&
				typeof entry.derivation === 'string',
			),
		geometryMaskComplete:
			analysis.geometry.mask.artifactPath === EXPECTED_GEOMETRY_MASK &&
			analysis.geometry.mask.byteLength === fixture.neutralGeometry.mask.expectedByteLength &&
			analysis.geometry.mask.valuesValid === true &&
			typeof analysis.geometry.mask.derivation === 'string' &&
			analysis.geometry.mask.backplatePixelCount +
				analysis.geometry.mask.planePixelCount +
				analysis.geometry.mask.spherePixelCount === 640 * 400,
		artifactHashesRecorded:
			[...analysis.rawLinearFields, analysis.geometry.mask, ...analysis.images].every(
				(record) => /^[0-9a-f]{64}$/u.test(record.sha256) && Number.isSafeInteger(record.byteLength),
			),
		contactSheetUploadedLast: browser.uploads.at(-1)?.path === CONTACT_SHEET_PATH,
		fourScenesInDeclaredOrder:
			analysis.scenes.length === EXPECTED_SCENES.length &&
			exactJson(
				analysis.scenes.map((scene) => scene.sceneId),
				EXPECTED_SCENES.map((scene) => scene.id),
			),
		parentReceiverIdentity:
			analysis.parentReceiverLight?.runId === RECEIVER_PARENT.runId &&
			analysis.parentReceiverLight.artifactSetSha256 === RECEIVER_PARENT.artifactSetSha256,
		skyControlIdentity:
			analysis.skyControl?.runId === SKY_PARENT.runId &&
			analysis.skyControl.artifactSetSha256 === SKY_PARENT.artifactSetSha256 &&
			analysis.skyControl.colorId === BRUNETON_COLOR_ID,
		neutralMaterialIdentity:
			analysis.material?.id === fixture.material.id &&
			analysis.material.basisContentHash === NATIVE15_BASIS_HASH,
		geometryIdentity:
			analysis.geometry?.sphere?.id === fixture.neutralGeometry.sphere.id &&
			analysis.geometry?.plane?.id === fixture.neutralGeometry.plane.id &&
			analysis.geometry.mask.planePixelCount > 0 &&
			analysis.geometry.mask.spherePixelCount > 0,
		presentationIdentity:
			analysis.presentation?.id === fixture.presentation.primary.id &&
			analysis.presentation.colorId === BRUNETON_COLOR_ID,
		lightingOwnership: lightingOwnership.accepted === true,
		binaryArtifactLayoutAndIdentity: binaryArtifactVerification.accepted === true,
		independentPrimaryPngSkyReplay: pngSkyBackplateVerification.accepted === true,
		behaviorInputBoundary:
			analysis.surfaceResponseContract?.forbiddenBehaviorInputsAbsent === true,
		browserParentInputsReplayed:
			analysis.scenes.every((scene) =>
				scene.parentReplay?.passed === true &&
				scene.parentReplay.exact === true &&
				scene.parentReplay.freshPostPresentationRehydration === true &&
				scene.parentReplay.freshIncidentReplayExact === true &&
				scene.parentReplay.freshParentPacketSerializationExact === true &&
				scene.incidentStateUnchanged === true,
			),
		primaryFrameControlIntegrity:
			analysis.scenes.every((scene) =>
				FRAME_MODES.every((mode) =>
					frameContractPassed(
						scene.frames?.[mode],
						`captures/cr3-${mode}-${scene.sceneId}.png`,
						analysis.geometry.mask.sha256,
					),
				),
			) &&
			new Set(allFrames.map((frame) => frame?.colorId)).size === 1 &&
			new Set(allFrames.map((frame) => frame?.shaderSourceHash)).size === 1,
		noBrowserErrors:
			browser.serverErrors.length === 0 &&
			analysis.errors?.length === 0,
		allContextsHealthy: analysis.scenes.every((scene) =>
			scene.contextLost === false &&
			Array.isArray(scene.webglErrors) &&
			scene.webglErrors.length === 0 &&
			(scene.runtimeDiagnostics === undefined || installedRuntime(scene.runtimeDiagnostics)),
		),
		browserRuntimeHealthy:
			browser.runtimeEnvironment.requestedAngleBackend === 'd3d11' &&
			analysis.runtimeEnvironment?.webgl2 === true &&
			analysis.runtimeEnvironment.contextLost === false &&
			typeof analysis.runtimeEnvironment.renderer === 'string' &&
			analysis.runtimeEnvironment.renderer.includes('Direct3D11') &&
			!analysis.runtimeEnvironment.renderer.includes('Microsoft Basic Render Driver'),
	};

	const scientificByScene = [];
	for (const expected of EXPECTED_SCENES) {
		const scene = sceneById.get(expected.id);
		const fixtureScene = fixtureSceneMap(fixture).get(expected.id);
		const frames = scene?.frames;
		const frameChecks = {};
		for (const mode of FRAME_MODES) {
			const expectedPath = `captures/cr3-${mode}-${expected.id}.png`;
			frameChecks[mode] = frameContractPassed(
				frames?.[mode],
				expectedPath,
				analysis.geometry.mask.sha256,
			);
		}
		const directZeroExpected = expected.id === 'sunset-plus-10-minutes' ||
			expected.id === 'sunset-plus-60-minutes';
		const directMaximum = frames?.['direct-only']?.rendererLinearResponse?.maximumAbsoluteValue;
		const diffuseMaximumPhotopicLuminance =
			frames?.['diffuse-only']?.rendererLinearResponse?.maximumPhotopicLuminanceCdPerSquareMeter;
		const combinedMaximumPhotopicLuminance =
			frames?.combined?.rendererLinearResponse?.maximumPhotopicLuminanceCdPerSquareMeter;
		const postPresentationDirectValues =
			scene?.parentReplay?.actualIncidentInputsPostPresentation?.directNormalValues;
		const sourceFacingDirectRadianceValues =
			scene?.linearAdditivity?.probes?.sphereSourceFacing?.packets?.directRadiance?.values;
		const postPresentationDirectMaximum = Array.isArray(postPresentationDirectValues)
			? Math.max(...postPresentationDirectValues.map((value) => Math.abs(value)))
			: Number.NaN;
		scientificByScene.push({
			sceneId: expected.id,
			parentReplay: scene?.parentReplay?.passed === true && scene.parentReplay.exact === true,
			planeDiffuseReplay: planeReplayPassed(scene?.planeDiffuseReplay, fixture.thresholds),
			linearAdditivity:
				proofComparisonPassed(scene?.linearAdditivity?.spectral) &&
				proofComparisonPassed(scene?.linearAdditivity?.binary64LinearRgb) &&
				proofComparisonPassed(scene?.linearAdditivity?.float32LinearField),
			evaluationDomain:
				scene?.linearAdditivity?.spectral?.evaluatedVertexCount ===
					fixture.surfaceResponse.evaluationDomain.expectedTotalEvaluatedVertexCountPerScene &&
				scene?.linearAdditivity?.spectral?.vertexResponses?.evaluatedVertexCount ===
					fixture.surfaceResponse.evaluationDomain.expectedTotalEvaluatedVertexCountPerScene,
			incidentStateUnchanged: scene?.incidentStateUnchanged === true,
			frameContracts: Object.values(frameChecks).every(Boolean),
			objectMasksEqual: scene?.objectMasksEqual === true,
			colorAndShaderUnchanged:
				new Set(FRAME_MODES.map((mode) => frames?.[mode]?.colorId)).size === 1 &&
				new Set(FRAME_MODES.map((mode) => frames?.[mode]?.shaderSourceHash)).size === 1,
			directBehavior:
				finiteNonnegative(directMaximum) &&
				(directZeroExpected
					? Array.isArray(postPresentationDirectValues) &&
						postPresentationDirectMaximum ===
							fixture.thresholds.zeroDirectMaximumAbsoluteSpectralValue &&
						directMaximum === fixture.thresholds.zeroDirectMaximumAbsoluteRasterValue
					: Array.isArray(sourceFacingDirectRadianceValues) &&
						sourceFacingDirectRadianceValues.some((value) => value > 0) &&
						directMaximum > 0),
			diffuseBehavior:
				finiteNonnegative(diffuseMaximumPhotopicLuminance) &&
				diffuseMaximumPhotopicLuminance >
					fixture.thresholds.nonzeroDiffuseMinimumPhotopicLuminanceCdPerSquareMeter,
			combinedBehavior:
				finiteNonnegative(combinedMaximumPhotopicLuminance) &&
				combinedMaximumPhotopicLuminance >
					fixture.thresholds.nonzeroDiffuseMinimumPhotopicLuminanceCdPerSquareMeter,
			fixtureIdentity:
				scene?.solarZenithDegrees === fixtureScene.solarZenithDegrees &&
				scene?.cacheIdentity === fixtureScene.cacheIdentity,
		});
	}
	const scientificGates = {
		parentIncidentReplay: scientificByScene.every((scene) => scene.parentReplay),
		horizontalPlaneReplay: scientificByScene.every((scene) => scene.planeDiffuseReplay),
		linearDirectPlusDiffuseAdditivity: scientificByScene.every((scene) => scene.linearAdditivity),
		evaluatedVertexDomain: scientificByScene.every((scene) => scene.evaluationDomain),
		independentStoredFieldAdditivity:
			binaryArtifactVerification.fields.every((field) => field.additivity.passed),
		incidentIndependentOfPresentation: scientificByScene.every((scene) => scene.incidentStateUnchanged),
		allFrameContracts: scientificByScene.every((scene) => scene.frameContracts),
		geometryMasksStable: scientificByScene.every((scene) => scene.objectMasksEqual),
		brunetonColorAndShaderStable:
			scientificByScene.every((scene) => scene.colorAndShaderUnchanged) &&
			new Set(allFrames.map((frame) => frame?.colorId)).size === 1 &&
			new Set(allFrames.map((frame) => frame?.shaderSourceHash)).size === 1,
		directVisibilityFollowsGeometry: scientificByScene.every((scene) => scene.directBehavior),
		diffuseRemainsAvailable: scientificByScene.every((scene) => scene.diffuseBehavior),
		combinedRemainsAvailable: scientificByScene.every((scene) => scene.combinedBehavior),
		scenePhysicalIdentities: scientificByScene.every((scene) => scene.fixtureIdentity),
		diffusePlaneSequenceStrictlyFalls:
			analysis.sequence?.diffuseAndTotalPlaneStrictlyFalling === true,
		forbiddenBehaviorInputsAbsent:
			analysis.surfaceResponseContract?.forbiddenBehaviorInputsAbsent === true,
		progressTargetsMet: progress.firstImage.targetMet && progress.decisionPlate.targetMet,
	};
	const gates = {...integrityGates, ...scientificGates};
	const integrityPassed = Object.values(integrityGates).every(Boolean);
	return {
		gates,
		integrityGates,
		scientificGates,
		scientificByScene,
		integrityPassed,
		accepted: integrityPassed && Object.values(scientificGates).every(Boolean),
	};
}

function makeImageDerivations(analysis, fixture) {
	return {
		schemaId: 'algorithm32-color-reset-cr3-image-derivations-v1',
		fixture: {
			path: 'experiments/extraterrestrial/color-reset/fixtures/cr3-neutral-geometry-ambient-proof-v1.json',
			sha256: FIXTURE_SHA256,
		},
		parents: {
			receiverLight: {
				runId: RECEIVER_PARENT.runId,
				artifactSetSha256: RECEIVER_PARENT.artifactSetSha256,
			},
			skyControl: {
				runId: SKY_PARENT.runId,
				artifactSetSha256: SKY_PARENT.artifactSetSha256,
			},
		},
		operation:
			'Apply exact CR2 direct-normal packets and directional diffuse radiance fields to one fixed neutral 0.18 Lambertian sphere and plane, project completed spectral surface radiance through the exact snapshot Native15 E8/Bruneton presentation, and replace only the declared geometry-mask pixels of immutable CR1 sky backplates.',
		equations: fixture.surfaceResponse.equations,
		material: fixture.material,
		presentation: fixture.presentation,
		rawLinearFields: analysis.rawLinearFields,
		geometryMask: analysis.geometry.mask,
		images: analysis.images.map((image) => ({
			artifactPath: image.artifactPath,
			sha256: image.sha256,
			byteLength: image.byteLength,
			kind: image.kind,
			sceneId: image.sceneId ?? null,
			mode: image.mode ?? null,
			derivation: image.derivation,
		})),
	};
}

async function failureProgress(run, error, browserEvidence = null) {
	const timed = (entry, targetMilliseconds) => {
		if (!entry) return null;
		const elapsed = elapsedMilliseconds(run.initializedAt, entry.completedAt);
		return {
			artifactPath: entry.path,
			completedAt: entry.completedAt,
			elapsedMilliseconds: elapsed,
			targetMilliseconds,
			targetMet: elapsed <= targetMilliseconds,
		};
	};
	const failedBrowserEvidence = error?.browserEvidence ?? null;
	const uploads = browserEvidence?.uploads ?? failedBrowserEvidence?.uploads ?? [];
	const firstImage = uploads.find((entry) => EXPECTED_IMAGES.includes(entry.path));
	const decisionPlate = uploads.find((entry) => entry.path === CONTACT_SHEET_PATH);
	return {
		schemaId: 'algorithm32-color-reset-progress-v1',
		runId: run.runId,
		initializedAt: run.initializedAt,
		firstImage: timed(firstImage, 180_000),
		decisionPlate: timed(decisionPlate, 600_000),
		browserProgressEvents:
			browserEvidence?.progressEvents ?? failedBrowserEvidence?.progressEvents ?? [],
	};
}

async function main() {
	if (process.argv.length !== 2) throw new Error('CR3 accepts no arguments.');
	const run = await initializeColorResetRunRecord({
		slug: 'neutral-geometry-ambient-proof',
		command: COMMAND,
		inputs: {
			schemaId: 'algorithm32-color-reset-cr3-inputs-v1',
			increment: 'CR3',
			fixture: 'experiments/extraterrestrial/color-reset/fixtures/cr3-neutral-geometry-ambient-proof-v1.json',
			fixtureSha256: FIXTURE_SHA256,
			parentReceiverLight: {
				namespace: 'color-reset',
				runId: RECEIVER_PARENT.runId,
				artifactSetSha256: RECEIVER_PARENT.artifactSetSha256,
				manifestSha256: RECEIVER_PARENT.manifestSha256,
			},
			skyControl: {
				namespace: 'color-reset',
				runId: SKY_PARENT.runId,
				artifactSetSha256: SKY_PARENT.artifactSetSha256,
				manifestSha256: SKY_PARENT.manifestSha256,
			},
			scenes: EXPECTED_SCENES,
			modes: FRAME_MODES,
			browserArtifacts: EXPECTED_BROWSER_ARTIFACTS,
			browserUploadLimitBytes: UPLOAD_LIMIT_BYTES,
		},
		provenance: {
			schemaId: 'algorithm32-color-reset-cr3-provenance-v1',
			operation:
				'Apply exact immutable CR2 Native15 direct and directional-diffuse receiver light to fixed neutral Lambertian sphere and plane geometry, preserve immutable CR1 unchanged-Bruneton sky pixels outside the geometry mask, and emit every requested field and image before gates.',
			implementation: [
				'experiments/extraterrestrial/color-reset/runners/run-cr3-neutral-geometry-ambient-proof.js',
				'experiments/extraterrestrial/color-reset/harness/color-reset-browser-run.js',
				'experiments/extraterrestrial/color-reset/harness/cr3-neutral-geometry-ambient-proof-browser.js',
				'experiments/extraterrestrial/color-reset/lighting/Cr3NeutralLambertianLighting.js',
				'experiments/extraterrestrial/color-reset/color/Cr3NeutralSurfacePresentation.js',
			],
			physicalInput:
				'accepted CR2 4096-direction Native15 receiver radiance fields and exact direct-normal packets for four fixed San Jose scenes',
			derivations: [
				'E_direct(n,lambda) = E_directNormal(lambda) * max(0, dot(n, directionToSource))',
				'E_diffuse(n,lambda) = deltaMu * deltaPhi * sum_i L_i(lambda) * max(0, dot(n, omega_i))',
				'L_out(n,lambda) = 0.18 * (E_direct(n,lambda) + E_diffuse(n,lambda)) / pi',
				'combined pre-display linear RGB = direct pre-display linear RGB + diffuse pre-display linear RGB',
			],
			exclusions: [
				'no new Color, exposure, tone map, cache, transport, source, ground, star, or production change',
				'no display or photopic value feeds the incident-light or Lambertian evaluation',
				'no arbitrary BRDF, shadow, occlusion, interreflection, animation, or 108-degree continuity claim',
			],
		},
		environment: {
			schemaId: 'algorithm32-color-reset-cr3-environment-v1',
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			requestedAngleBackend: 'd3d11',
			browserTimeoutMilliseconds: 900_000,
		},
		references: {
			schemaId: 'algorithm32-color-reset-cr3-references-v1',
			design: 'agents/topics/extraterrestrial/color-reset-design.md',
			plan:
				'agents/topics/extraterrestrial/color-reset-experiment-plan.md#cr3---apply-measured-ambient-light-to-neutral-geometry',
			parentReceiverLight:
				`tmp/extraterrestrial/color-reset/runs/${RECEIVER_PARENT.runId}`,
			skyControl: `tmp/extraterrestrial/color-reset/runs/${SKY_PARENT.runId}`,
		},
	});
	let finalizationStarted = false;
	let progressWritten = false;
	let protectedBefore = null;
	let protectedAfter = null;
	let protectedAfterWritten = false;
	let runtimeBefore = null;
	let runtimeAfter = null;
	let runtimeAfterWritten = false;
	let receiverBefore = null;
	let receiverAfter = null;
	let receiverAfterWritten = false;
	let skyBefore = null;
	let skyAfter = null;
	let skyAfterWritten = false;
	let pinnedBefore = null;
	let pinnedAfter = null;
	let pinnedAfterWritten = false;
	let browser = null;
	let lightingOwnership = null;
	let fixture = null;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(COLOR_RESET_ROOT, 'Color-reset implementation');
		const fixtureDigest = await sha256File(FIXTURE_PATH);
		requireCondition(fixtureDigest === FIXTURE_SHA256, 'CR3 fixture changed.');
		fixture = await readJson(FIXTURE_PATH);
		verifyFixtureContract(fixture);

		runtimeBefore = await captureRuntimeImplementationBefore();
		await run.writeJsonArtifact('evidence/runtime-implementation-before.json', runtimeBefore);
		protectedBefore = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-before.json', protectedBefore);
		pinnedBefore = await verifyPinnedControlFiles(fixture);
		await run.writeJsonArtifact('evidence/pinned-control-files-before.json', pinnedBefore);
		receiverBefore = await verifyReceiverLightParent(fixture);
		await run.writeJsonArtifact(
			'evidence/receiver-parent-before.json',
			receiverBefore.evidence,
		);
		skyBefore = await verifySkyParent(fixture);
		await run.writeJsonArtifact('evidence/sky-parent-before.json', skyBefore.evidence);
		await run.writeJsonArtifact(
			'evidence/control-snapshot-verification.json',
			await verifyControlSnapshot(),
		);
		const browserClosure = await buildStaticModuleClosure({
			candidateRoot: COLOR_RESET_ROOT,
			entryFiles: ['harness/cr3-neutral-geometry-ambient-proof-browser.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		});
		await run.writeJsonArtifact('evidence/browser-module-closure.json', browserClosure);
		lightingOwnership = verifyLightingOwnership(browserClosure);
		await run.writeJsonArtifact('evidence/lighting-ownership.json', lightingOwnership);
		await run.writeJsonArtifact(
			'browser/config.json',
			makeBrowserConfiguration(
				fixture,
				receiverBefore.browserParent,
				skyBefore.browserParent,
			),
		);

		browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr3-neutral-geometry-ambient-proof-browser.js',
			exportName: 'runCr3NeutralGeometryAmbientProofBrowser',
			servedRoots: {
				'/cr2/': RECEIVER_PARENT_DIRECTORY,
				'/cr1/': SKY_PARENT_DIRECTORY,
			},
			importMap: {three: '/dependencies/three/build/three.module.js'},
			allowedArtifactPaths: EXPECTED_BROWSER_ARTIFACTS,
			uploadLimitBytes: UPLOAD_LIMIT_BYTES,
			timeoutMilliseconds: 900_000,
		});

		runtimeAfter = await captureRuntimeImplementationAfter(runtimeBefore);
		await run.writeJsonArtifact('evidence/runtime-implementation-after.json', runtimeAfter);
		runtimeAfterWritten = true;
		assertRuntimeImplementationUnchanged(runtimeBefore, runtimeAfter);
		let analysis = {
			...attachArtifactIdentities(browser.result, browser.uploads),
			browserServerRuntimeEnvironment: browser.runtimeEnvironment,
		};
		const binaryArtifactVerification = await verifyBrowserBinaryArtifacts(
			run,
			fixture,
			analysis,
		);
		await run.writeJsonArtifact(
			'evidence/binary-artifact-verification.json',
			binaryArtifactVerification,
		);
		const pngSkyBackplateVerification = await verifyPrimaryPngSkyBackplates(
			run,
			fixture,
			analysis,
		);
		await run.writeJsonArtifact(
			'evidence/png-sky-backplate-verification.json',
			pngSkyBackplateVerification,
		);
		analysis = {
			...analysis,
			binaryArtifactVerification,
			pngSkyBackplateVerification,
		};
		await run.writeJsonArtifact('evidence/surface-response-analysis.json', analysis);
		await run.writeJsonArtifact(
			'evidence/incident-input-replay.json',
			{
				schemaId: 'algorithm32-color-reset-cr3-incident-input-replay-v1',
				parentReceiverLight: analysis.parentReceiverLight,
				scenes: analysis.scenes.map((scene) => ({
					sceneId: scene.sceneId,
					parentReplay: scene.parentReplay,
					planeDiffuseReplay: scene.planeDiffuseReplay,
					incidentStateUnchanged: scene.incidentStateUnchanged,
				})),
			},
		);
		await run.writeJsonArtifact(
			'evidence/image-derivations.json',
			makeImageDerivations(analysis, fixture),
		);

		receiverAfter = await verifyReceiverLightParent(fixture);
		await run.writeJsonArtifact('evidence/receiver-parent-after.json', receiverAfter.evidence);
		receiverAfterWritten = true;
		assertParentUnchanged(receiverBefore.evidence, receiverAfter.evidence, 'CR3 receiver-light parent');
		skyAfter = await verifySkyParent(fixture);
		await run.writeJsonArtifact('evidence/sky-parent-after.json', skyAfter.evidence);
		skyAfterWritten = true;
		assertParentUnchanged(skyBefore.evidence, skyAfter.evidence, 'CR3 sky parent');
		pinnedAfter = await verifyPinnedControlFiles(fixture);
		await run.writeJsonArtifact('evidence/pinned-control-files-after.json', pinnedAfter);
		pinnedAfterWritten = true;
		assertParentUnchanged(pinnedBefore, pinnedAfter, 'CR3 pinned control files');
		protectedAfter = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			flat32: await createFileInventory(FLAT32_ROOT),
		};
		await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
		protectedAfterWritten = true;
		assertFileInventoriesEqual(
			protectedBefore.algorithm32,
			protectedAfter.algorithm32,
			'CR3 protected Algorithm32 source',
		);
		assertFileInventoriesEqual(
			protectedBefore.flat32,
			protectedAfter.flat32,
			'CR3 protected Flat32 source',
		);

		const progress = makeProgress(run, browser);
		await run.writeJsonArtifact('progress.json', progress);
		progressWritten = true;
		const decision = evaluateGates({
			analysis,
			browser,
			fixture,
			progress,
			lightingOwnership,
			binaryArtifactVerification,
			pngSkyBackplateVerification,
		});
		const conclusion = !decision.integrityPassed
			? 'failed'
			: decision.accepted
				? 'accepted'
				: 'rejected';
		const proof = {
			schemaId: 'algorithm32-color-reset-cr3-proof-v1',
			accepted: decision.accepted,
			integrityPassed: decision.integrityPassed,
			claimBoundary: fixture.claimBoundary,
			gates: decision.gates,
			integrityGates: decision.integrityGates,
			scientificGates: decision.scientificGates,
			scientificByScene: decision.scientificByScene,
			progress,
			parentReceiverLight: {
				runId: RECEIVER_PARENT.runId,
				artifactSetSha256: RECEIVER_PARENT.artifactSetSha256,
				manifestSha256: RECEIVER_PARENT.manifestSha256,
			},
			skyControl: {
				runId: SKY_PARENT.runId,
				artifactSetSha256: SKY_PARENT.artifactSetSha256,
				manifestSha256: SKY_PARENT.manifestSha256,
			},
			outputs: {
				rawLinearFields: analysis.rawLinearFields,
				geometryMask: analysis.geometry.mask,
				images: analysis.images,
				binaryArtifactVerification,
				pngSkyBackplateVerification,
			},
			protectedSourceUnchanged: true,
			parentControlsUnchanged: true,
			colorStateUnchanged: decision.scientificGates.brunetonColorAndShaderStable,
		};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const report = [
			`# ${run.runId}: CR3 neutral-geometry ambient proof`,
			'',
			`Conclusion: **${conclusion}**.`,
			'',
			'All four raw pre-display fields, the exact geometry mask, twelve individual scene frames, two diagnostics, and the chronological contact sheet were written before gates. Every persisted primary PNG was then independently decoded, its 38-pixel label header excluded, and its outside-mask 640 x 400 RGB codes compared with the pinned CR1 Bruneton backplate.',
			'',
			...Object.entries(decision.gates).map(
				([name, passed]) => `- ${passed ? 'PASS' : 'FAIL'}: ${name}`,
			),
			'',
			'Claim boundary: contained direct-plus-directional-diffuse neutral-Lambertian pre-display response only; no new Color, exposure, sky appearance, or production behavior is accepted.',
			'',
		].join('\n');
		finalizationStarted = true;
		const manifest = await run.finalize({conclusion, result: proof, report});
		const independentVerification = await verifyColorResetRun(run.runId);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					artifactSetSha256: manifest.artifactSetSha256,
					independentlyVerified: independentVerification.verified,
					gates: decision.gates,
					progress,
				},
				null,
				2,
			)}\n`,
		);
	} catch (error) {
		if (!finalizationStarted) {
			const audits = {
				runtime: {beforeRecorded: runtimeBefore !== null, afterRecorded: runtimeAfterWritten, matches: null, error: null},
				receiverParent: {beforeRecorded: receiverBefore !== null, afterRecorded: receiverAfterWritten, matches: null, error: null},
				skyParent: {beforeRecorded: skyBefore !== null, afterRecorded: skyAfterWritten, matches: null, error: null},
				pinnedControls: {beforeRecorded: pinnedBefore !== null, afterRecorded: pinnedAfterWritten, matches: null, error: null},
				protectedSource: {beforeRecorded: protectedBefore !== null, afterRecorded: protectedAfterWritten, matches: null, error: null},
			};
			if (runtimeBefore !== null && !runtimeAfterWritten) {
				try {
					runtimeAfter = await captureRuntimeImplementationAfter(runtimeBefore);
					await run.writeJsonArtifact('evidence/runtime-implementation-after.json', runtimeAfter);
					runtimeAfterWritten = true;
					audits.runtime.afterRecorded = true;
				} catch (auditError) {
					audits.runtime.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (runtimeBefore && runtimeAfter) {
				try {
					assertRuntimeImplementationUnchanged(runtimeBefore, runtimeAfter);
					audits.runtime.matches = true;
				} catch (auditError) {
					audits.runtime.matches = false;
					audits.runtime.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (receiverBefore !== null && fixture !== null && !receiverAfterWritten) {
				try {
					receiverAfter = await verifyReceiverLightParent(fixture);
					await run.writeJsonArtifact('evidence/receiver-parent-after.json', receiverAfter.evidence);
					receiverAfterWritten = true;
					audits.receiverParent.afterRecorded = true;
				} catch (auditError) {
					audits.receiverParent.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (receiverBefore && receiverAfter) {
				try {
					assertParentUnchanged(receiverBefore.evidence, receiverAfter.evidence, 'CR3 receiver-light parent');
					audits.receiverParent.matches = true;
				} catch (auditError) {
					audits.receiverParent.matches = false;
					audits.receiverParent.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (skyBefore !== null && fixture !== null && !skyAfterWritten) {
				try {
					skyAfter = await verifySkyParent(fixture);
					await run.writeJsonArtifact('evidence/sky-parent-after.json', skyAfter.evidence);
					skyAfterWritten = true;
					audits.skyParent.afterRecorded = true;
				} catch (auditError) {
					audits.skyParent.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (skyBefore && skyAfter) {
				try {
					assertParentUnchanged(skyBefore.evidence, skyAfter.evidence, 'CR3 sky parent');
					audits.skyParent.matches = true;
				} catch (auditError) {
					audits.skyParent.matches = false;
					audits.skyParent.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (pinnedBefore !== null && fixture !== null && !pinnedAfterWritten) {
				try {
					pinnedAfter = await verifyPinnedControlFiles(fixture);
					await run.writeJsonArtifact('evidence/pinned-control-files-after.json', pinnedAfter);
					pinnedAfterWritten = true;
					audits.pinnedControls.afterRecorded = true;
				} catch (auditError) {
					audits.pinnedControls.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (pinnedBefore && pinnedAfter) {
				try {
					assertParentUnchanged(pinnedBefore, pinnedAfter, 'CR3 pinned control files');
					audits.pinnedControls.matches = true;
				} catch (auditError) {
					audits.pinnedControls.matches = false;
					audits.pinnedControls.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (!protectedAfterWritten) {
				try {
					protectedAfter = {
						algorithm32: await createFileInventory(ALGORITHM32_ROOT),
						flat32: await createFileInventory(FLAT32_ROOT),
					};
					await run.writeJsonArtifact('evidence/protected-source-after.json', protectedAfter);
					protectedAfterWritten = true;
					audits.protectedSource.afterRecorded = true;
				} catch (auditError) {
					audits.protectedSource.error = auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			if (protectedBefore && protectedAfter) {
				try {
					assertFileInventoriesEqual(
						protectedBefore.algorithm32,
						protectedAfter.algorithm32,
						'CR3 protected Algorithm32 source',
					);
					assertFileInventoriesEqual(
						protectedBefore.flat32,
						protectedAfter.flat32,
						'CR3 protected Flat32 source',
					);
					audits.protectedSource.matches = true;
				} catch (auditError) {
					audits.protectedSource.matches = false;
					audits.protectedSource.error ??= auditError instanceof Error ? auditError.message : String(auditError);
				}
			}
			await run.writeJsonArtifact('evidence/failure.json', {
				schemaId: 'algorithm32-color-reset-cr3-failure-v1',
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : null,
				browserEvidenceErrors: error?.evidenceErrors ?? [],
				browserCleanupErrors: error?.cleanupErrors ?? [],
				audits,
			});
			if (!progressWritten) {
				await run.writeJsonArtifact('progress.json', await failureProgress(run, error, browser));
			}
			finalizationStarted = true;
			await run.finalize({
				conclusion: 'failed',
				result: {accepted: false, error: error instanceof Error ? error.message : String(error)},
				report:
					`# ${run.runId}: CR3 neutral-geometry ambient proof failed\n\n${error instanceof Error ? error.message : String(error)}\n`,
			});
		}
		throw error;
	}
}

await main();
