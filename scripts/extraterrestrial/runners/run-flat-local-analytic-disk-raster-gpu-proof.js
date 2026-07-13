#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {createServer} from 'node:http';
import {lstat, mkdir, readFile, realpath, rm} from 'node:fs/promises';
import path from 'node:path';

import {assertExistingRealPathContained, assertNoReparseEntries} from '../harness/lib/containment.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256,
	sha256File,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	assertLexicallyContained,
	assertRepositoryIdentity,
	isPathContained,
	pathComparisonKey,
} from '../harness/lib/roots.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {verifyRun} from './verify-run.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-flat-local-analytic-disk-raster-gpu-proof.js';
const PROOF_ID = 'flat-local-analytic-disk-raster-gpu-proof-v1';
const RUN_SLUG = 'flat-local-analytic-disk-raster-gpu-proof';
const SNAPSHOT_ROOT = path.join(EXPERIMENT_ROOT, 'production-snapshots', 'sun-appearance-step-5-v1');
const SNAPSHOT_MANIFEST_PATH = path.join(SNAPSHOT_ROOT, 'manifest.json');
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', `${PROOF_ID}.json`);
const SOURCE_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'union-glacier-flat-local-closest-approach-v1.json');
const BROWSER_ENTRY_PATH = path.join(
	EXPERIMENT_ROOT,
	'harness',
	'flat-local-analytic-disk-raster-gpu-proof-browser-entry.js',
);
const SCENE_MODULE_PATH = path.join(
	EXPERIMENT_ROOT,
	'harness',
	'lib',
	'flat-local-analytic-disk-raster-gpu-proof-scene.js',
);
const RESULT_BODY_LIMIT_BYTES = 64 * 1024 * 1024;
const PROGRESS_BODY_LIMIT_BYTES = 16 * 1024;
const BROWSER_LOG_LIMIT_BYTES = 16 * 1024 * 1024;
const RETAINED_PROGRESS_RECEIPT_LIMIT = 96;
const INACTIVITY_TIMEOUT_MILLISECONDS = 10 * 60 * 1000;
const INACTIVITY_POLL_MILLISECONDS = 1000;
const CHROME_TERMINATION_TIMEOUT_MILLISECONDS = 15000;
const SERVER_CLOSE_TIMEOUT_MILLISECONDS = 5000;
const EXPECTED_SNAPSHOT_MODULE_COUNT = 139;
const EXPECTED_CLEAR_PIXEL_COUNT = 2 * 2 * 5 * 25;
const EXPECTED_BLOCKER_PIXEL_COUNT = 2 * 25;
const EXPECTED_EVALUATION_PIXEL_COUNT = EXPECTED_CLEAR_PIXEL_COUNT + EXPECTED_BLOCKER_PIXEL_COUNT;
const EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT = 1;
const EXPECTED_TOTAL_EVIDENCE_PIXEL_COUNT = EXPECTED_EVALUATION_PIXEL_COUNT + EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT;
const EXPECTED_SETUP_IDS = ['flat-medium', 'flat-long', 'flat-close-control', 'distant-sun-control'];
const EXPECTED_CLEAR_CAPTURE_ORDER = ['flat-medium', 'flat-long'].flatMap((conditionId) =>
	['original-wide', 'original-tight'].flatMap((viewportId) =>
		[0, 0.25, 0.5, 0.75, 1].map((phaseOffsetPixels) => `${conditionId}|${viewportId}|${phaseOffsetPixels}`),
	),
);
const EXPECTED_CLEAR_CAPTURE_KEYS = new Set(EXPECTED_CLEAR_CAPTURE_ORDER);
const EXPECTED_BLOCKER_CAPTURE_ORDER = [
	'flat-medium|original-tight|0.5|full-blocker',
	'flat-medium|original-tight|0.5|edge-blocker',
];
const EXPECTED_BLOCKER_CAPTURE_KEYS = new Set(EXPECTED_BLOCKER_CAPTURE_ORDER);
const EXPECTED_BACKWARD_CONTROL_KEY = 'flat-medium|original-tight|anti-source-optical-axis';
const EXPECTED_ORACLE_CAPTURE_ORDER = [
	...EXPECTED_CLEAR_CAPTURE_ORDER.slice(0, 10).map((key) => ({kind: 'clear', key, rows: 5})),
	...EXPECTED_BLOCKER_CAPTURE_ORDER.map((key) => ({kind: 'blocker', key, rows: 5})),
	{kind: 'backward', key: EXPECTED_BACKWARD_CONTROL_KEY, rows: 1},
	...EXPECTED_CLEAR_CAPTURE_ORDER.slice(10).map((key) => ({kind: 'clear', key, rows: 5})),
];
const EXPECTED_FLAT_BINDING_VALUE_KEYS = [
	'cache.celestial.localSunRadiance',
	'cache.cumulativeScatteringDensity',
	'runtime.depthTexture',
	'runtime.sceneColorTexture',
	'runtime.sceneHitTexture',
	'runtime.viewportSize',
];
const EXPECTED_DISTANT_BINDING_VALUE_KEYS = [
	'cache.celestial.sunTransport',
	'cache.cumulativeScatteringDensity',
	'runtime.depthTexture',
	'runtime.sceneColorTexture',
	'runtime.sceneHitTexture',
	'runtime.viewportSize',
];
const EXPECTED_PROOF_REQUIRES = [
	'runtime.initialState',
	'geometry.reconstructViewRay',
	'geometry.finiteCelestialAtmosphereSegment',
	'atmosphere.sampleMedium',
	'cache.sampleFlatFiniteSunRadiance',
	'celestial.evaluateRadiance',
	'composition.composeSpectralRadiance',
	'color.composeSceneColor',
	'color.encodeOutput',
];
const EXPECTED_REQUIRED_GATES = [
	'hardware-webgl2',
	'shader-compile-link',
	'exact-conic-versus-independent-subdivision',
	'stable-conic-coefficients-and-forward-half-space',
	'affine-oracle-and-production-ray-direction-parity',
	'raw-coverage-and-clamp-observability',
	'bounded-five-by-five-tile',
	'phase-continuity-and-one-pixel-shift',
	'tile-solid-angle-energy',
	'coverage-normalized-spectral-parity',
	'empty-and-full-coverage',
	'full-blocker-suppression',
	'edge-blocker-geometric-denominator',
	'fallback-activation-and-bounded-transport',
	'exact-diagnostic-readout-state-restoration',
	'unchanged-cache-source-and-path',
	'single-pre-display-composition',
	'no-new-gpu-resource-or-binding',
	'flat-close-non-regression',
	'distant-family-non-regression',
];
const EXPECTED_TOLERANCES = {
	analyticCoverageVersusFineOracleAbsolute: 0.006,
	fineVersusCoarseOracleAbsolute: 0.006,
	tileCoverageVersusOracleAbsolute: 0.025,
	coverageRangeEpsilon: 0.000002,
	rawCoverageRangeEpsilon: 0.00002,
	coverageClampResidualAbsolute: 0.00002,
	conicCoefficientAbsolute: 2e-7,
	conicCoefficientRelative: 0.002,
	conicDeterminantAbsolute: 1e-14,
	conicDeterminantRelative: 0.01,
	conicAxisAbsolute: 0.000002,
	conicAxisRelative: 0.00001,
	maximumConicConditionNumber: 100,
	rayDirectionComponentAbsolute: 0.000002,
	rayDirectionAngularRadians: 0.000005,
	backwardSourceAxisDotMaximum: -0.999999,
	phaseEndpointShiftCoverageAbsolute: 0.012,
	phaseTileSolidAngleEnergyRelative: 0.006,
	coverageNormalizedSpectralAbsolute: 0.01,
	coverageNormalizedSpectralRelative: 0.006,
	candidateCompositionAbsolute: 0.000001,
	unchangedPathAndCacheAbsolute: 0,
	fullCoverageMinimum: 0.999,
	emptyCoverageMaximum: 0.000002,
	blockedCelestialAbsolute: 0,
	maximumAdditionalCandidateTransportEvaluations: 1,
	maximumTotalProofTransportEvaluationsPerPixel: 4,
	flatPlacementAbsoluteMeters: 1,
	maximumShaderSourceGrowthBytes: 35000,
	maximumProgramPreparationMilliseconds: 30000,
};
const CHROME_CANDIDATES = [
	process.env.FLAT_LOCAL_ANALYTIC_RASTER_CHROME,
	'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
	'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);
const EXPECTED_NODE_CLOSURE_PATHS = [
	'harness/lib/atomic-files.js',
	'harness/lib/containment.js',
	'harness/lib/hashes.js',
	'harness/lib/module-closure.js',
	'harness/lib/roots.js',
	'harness/lib/run-record.js',
	'runners/run-flat-local-analytic-disk-raster-gpu-proof.js',
	'runners/verify-run.js',
];
const EXECUTED_CONTROL_PATHS = [
	'fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json',
	'fixtures/union-glacier-flat-local-closest-approach-v1.json',
	'harness/flat-local-analytic-disk-raster-gpu-proof-browser-entry.js',
	'harness/lib/atomic-files.js',
	'harness/lib/containment.js',
	'harness/lib/flat-local-analytic-disk-raster-gpu-proof-scene.js',
	'harness/lib/flat-local-analytic-disk-raster-oracle.js',
	'harness/lib/flat-local-analytic-disk-raster.js',
	'harness/lib/hashes.js',
	'harness/lib/module-closure.js',
	'harness/lib/roots.js',
	'harness/lib/run-record.js',
	'package-lock.json',
	'package.json',
	'runners/run-flat-local-analytic-disk-raster-gpu-proof.js',
	'runners/verify-run.js',
];
const THREE_RUNTIME_PATHS = [
	'three/package.json',
	'three/build/three.core.js',
	'three/build/three.module.js',
	'three/examples/jsm/postprocessing/EffectComposer.js',
	'three/examples/jsm/postprocessing/MaskPass.js',
	'three/examples/jsm/postprocessing/Pass.js',
	'three/examples/jsm/postprocessing/RenderPass.js',
	'three/examples/jsm/postprocessing/ShaderPass.js',
	'three/examples/jsm/shaders/CopyShader.js',
];
const SERVED_THREE_RUNTIME_PATHS = THREE_RUNTIME_PATHS.filter((value) => value !== 'three/package.json');
const SERVED_CONTROL_PATHS = new Map([
	[
		'/harness/',
		new Set([
			'flat-local-analytic-disk-raster-gpu-proof-browser-entry.js',
			'lib/flat-local-analytic-disk-raster-gpu-proof-scene.js',
			'lib/flat-local-analytic-disk-raster-oracle.js',
			'lib/flat-local-analytic-disk-raster.js',
		]),
	],
	['/fixtures/', new Set(['flat-local-analytic-disk-raster-gpu-proof-v1.json'])],
	['/node_modules/', new Set(SERVED_THREE_RUNTIME_PATHS)],
]);
const PROTECTED_ROOTS = [
	{id: 'complete-production-src', relativePath: 'src', absolutePath: path.join(REPOSITORY_ROOT, 'src')},
	{
		id: 'sealed-experiment-baseline',
		relativePath: 'scripts/extraterrestrial/baseline',
		absolutePath: path.join(EXPERIMENT_ROOT, 'baseline'),
	},
	{
		id: 'experiment-candidate',
		relativePath: 'scripts/extraterrestrial/candidate',
		absolutePath: path.join(EXPERIMENT_ROOT, 'candidate'),
	},
	{
		id: 'flat32-script-surface',
		relativePath: 'scripts/flat32',
		absolutePath: path.join(REPOSITORY_ROOT, 'scripts', 'flat32'),
	},
	{
		id: 'experiment-script-surface',
		relativePath: 'scripts/experiments',
		absolutePath: path.join(REPOSITORY_ROOT, 'scripts', 'experiments'),
	},
];
const ALLOWED_NODE_BUILTINS = [
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
];
let activeChromeChild = null;
let receivedTerminationSignal = null;

/** Return a stable lexical string comparison. */
function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

/** Convert one thrown value into JSON-compatible evidence. */
function serializeError(error) {
	return {name: error?.name ?? 'Error', message: error?.message ?? String(error), stack: error?.stack ?? null};
}

/** Reject execution when one required invariant is false. */
function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

/** Return whether one scalar is finite and inside an inclusive range. */
function finiteInRange(value, minimum, maximum) {
	return Number.isFinite(value) && value >= minimum && value <= maximum;
}

/** Return the maximum absolute component residual between equal arrays. */
function maximumAbsoluteResidual(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return Number.POSITIVE_INFINITY;
	return left.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])), 0);
}

/** Return whether one scalar meets a combined absolute and relative bound. */
function withinMixedTolerance(actual, expected, absoluteTolerance, relativeTolerance) {
	return (
		Number.isFinite(actual) &&
		Number.isFinite(expected) &&
		Math.abs(actual - expected) <= absoluteTolerance + relativeTolerance * Math.abs(expected)
	);
}

/** Return one vector's angle after finite unit normalization. */
function vectorAngle(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right) || left.length !== 3 || right.length !== 3) {
		return Number.POSITIVE_INFINITY;
	}
	const leftLength = Math.hypot(...left);
	const rightLength = Math.hypot(...right);
	if (!(leftLength > 0) || !(rightLength > 0)) return Number.POSITIVE_INFINITY;
	const cosine = left.reduce((sum, value, index) => sum + value * right[index], 0) / (leftLength * rightLength);
	return Math.acos(Math.max(-1, Math.min(1, cosine)));
}

/** Return the normalized dot product of two finite nonzero vectors. */
function normalizedDot(left, right) {
	const leftLength = Math.hypot(...left);
	const rightLength = Math.hypot(...right);
	if (!(leftLength > 0) || !(rightLength > 0)) return Number.NaN;
	return sum(left.map((value, index) => value * right[index])) / (leftLength * rightLength);
}

/** Validate the exact authored proof fixture before allocating browser work. */
function validateFixture(fixture, sourceFixtureBytes) {
	requireCondition(fixture?.id === PROOF_ID && fixture.schemaVersion === PROOF_ID, 'Proof fixture identity differs.');
	requireCondition(fixture.proofId === PROOF_ID, 'Proof fixture proof id differs.');
	requireCondition(
		fixture.claimBoundary ===
			'Contained hardware-GPU qualification of one exact screen-space conic raster for the Flat/local uniform finite Sun. It authorizes no production change and invokes no separate CPU N4 atmospheric-scattering/cache lane, refined source-path convergence, or CPU full-frame render. The sealed distant-Sun GPU control retains its normal 2,145-scalar binary64 celestial reference helper for support-mask and logical-field construction. Final CPU/GPU transport parity remains deferred.',
		'Proof fixture claim boundary differs.',
	);
	requireCondition(fixture.executionBackend === 'hardware-gpu', 'Proof fixture must require hardware GPU execution.');
	requireCondition(
		fixture.productionProfileId === 'algorithm32-native-production-default-v1',
		'Proof fixture production profile differs.',
	);
	requireCondition(
		JSON.stringify(fixture.sealedProductionSnapshot) ===
			JSON.stringify({
				root: 'scripts/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
				manifest: 'scripts/extraterrestrial/production-snapshots/sun-appearance-step-5-v1/manifest.json',
				requiredSchemaVersion: 'production-sun-appearance-snapshot-v1',
			}),
		'Proof fixture snapshot contract differs.',
	);
	requireCondition(
		fixture.sourceFixture?.path ===
			'scripts/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json' &&
			fixture.sourceFixture.schemaVersion === 'union-glacier-flat-local-closest-approach-v1',
		'Proof fixture source authority path or schema differs.',
	);
	requireCondition(
		fixture.sourceFixture?.sha256 === sha256(sourceFixtureBytes),
		'Flat source fixture bytes differ from the proof fixture authority.',
	);
	const sourceFixture = JSON.parse(sourceFixtureBytes.toString('utf8'));
	requireCondition(
		sourceFixture.schemaVersion === fixture.sourceFixture.schemaVersion,
		'Flat source fixture schema differs.',
	);
	requireCondition(
		fixture.sceneScale?.value === sourceFixture.sceneScaleMetersPerUnit &&
			fixture.sceneScale.units === 'meters-per-scene-unit' &&
			fixture.flat.source.sourceId === sourceFixture.source.sourceId &&
			fixture.flat.source.radiusMeters === sourceFixture.source.radiusMeters &&
			fixture.flat.source.heightMeters === sourceFixture.states[0].centerMeters[2] &&
			fixture.flat.source.referenceDistanceMeters === 4800000 &&
			fixture.flat.geometry.topAltitudeMeters === sourceFixture.geometry.topAltitudeMeters &&
			fixture.flat.geometry.observerDomeApexMeters === sourceFixture.geometry.observerDomeApexMeters &&
			fixture.flat.geometry.observerDomeMaximumViewRayMeters ===
				sourceFixture.geometry.observerDomeMaxViewRayMeters,
		'Proof fixture duplicates differ from the hashed Flat source fixture.',
	);
	const sourceStates = new Map(sourceFixture.states.map((state) => [state.id, state]));
	for (const condition of [...fixture.flat.qualificationConditions, fixture.flat.closeNonRegressionControl]) {
		const sourceState = sourceStates.get(condition.sourceStateId);
		requireCondition(
			sourceState !== undefined &&
				JSON.stringify(condition.expectedCenterMeters) === JSON.stringify(sourceState.centerMeters),
			`${condition.id} center differs from hashed source state ${condition.sourceStateId}.`,
		);
	}
	requireCondition(
		JSON.stringify(fixture.flat.location) ===
			JSON.stringify({
				latitudeDegrees: -79.768036,
				longitudeDegrees: -83.261666,
				dateBasis: '2024-12-14T12:00:00.000Z',
				observerMeters: [0, 0, 5],
			}),
		'Proof fixture Flat location differs.',
	);
	requireCondition(
		JSON.stringify(fixture.flat.qualificationConditions.map((value) => value.id)) ===
			JSON.stringify(['flat-medium', 'flat-long']),
		'Proof fixture must contain exactly Flat medium and long.',
	);
	requireCondition(
		JSON.stringify(
			fixture.flat.qualificationConditions.map(({id, sourceStateId, flatAngleDegrees, distanceClass}) => ({
				id,
				sourceStateId,
				flatAngleDegrees,
				distanceClass,
			})),
		) ===
			JSON.stringify([
				{id: 'flat-medium', sourceStateId: 'flat-90', flatAngleDegrees: 90, distanceClass: 'medium'},
				{id: 'flat-long', sourceStateId: 'flat-180', flatAngleDegrees: 180, distanceClass: 'long'},
			]) &&
			JSON.stringify({
				id: fixture.flat.closeNonRegressionControl.id,
				sourceStateId: fixture.flat.closeNonRegressionControl.sourceStateId,
				flatAngleDegrees: fixture.flat.closeNonRegressionControl.flatAngleDegrees,
				distanceClass: fixture.flat.closeNonRegressionControl.distanceClass,
			}) ===
				JSON.stringify({
					id: 'flat-close-control',
					sourceStateId: 'flat-0',
					flatAngleDegrees: 0,
					distanceClass: 'close',
				}),
		'Proof fixture Flat condition semantics differ.',
	);
	requireCondition(
		JSON.stringify(fixture.viewports) ===
			JSON.stringify([
				{id: 'original-wide', widthPixels: 641, heightPixels: 401, verticalFovDegrees: 78, devicePixelRatio: 1},
				{
					id: 'original-tight',
					widthPixels: 961,
					heightPixels: 541,
					verticalFovDegrees: 50,
					devicePixelRatio: 1,
				},
			]),
		'Proof fixture viewports differ from the frozen wide/tight pair.',
	);
	requireCondition(
		JSON.stringify(fixture.distantNonRegressionControl) ===
			JSON.stringify({
				id: 'distant-sun-control',
				instant: '2024-06-21T03:16:03.503Z',
				location: {latitudeDegrees: 37.3382, longitudeDegrees: -121.8863, observerHeightMeters: 5},
				sunAngularRadiusRadians: 0.004675,
			}),
		'Proof fixture distant control differs.',
	);
	requireCondition(
		fixture.tile.widthPixels === 5 &&
			fixture.tile.heightPixels === 5 &&
			fixture.tile.centerPixelMustBeOpticalAxis === true &&
			fixture.tile.rowOrigin === 'bottom-left' &&
			JSON.stringify(fixture.tile.sourceCenterHorizontalPhaseOffsetsPixels) ===
				JSON.stringify([0, 0.25, 0.5, 0.75, 1]),
		'Proof fixture tile or phases differ.',
	);
	requireCondition(
		JSON.stringify(
			fixture.tile.blockerControls.map(({id, conditionId, viewportId, phaseOffsetPixels, kind}) => ({
				id,
				conditionId,
				viewportId,
				phaseOffsetPixels,
				kind,
			})),
		) ===
			JSON.stringify([
				{
					id: 'full-blocker',
					conditionId: 'flat-medium',
					viewportId: 'original-tight',
					phaseOffsetPixels: 0.5,
					kind: 'full-tile-camera-facing-plane',
				},
				{
					id: 'edge-blocker',
					conditionId: 'flat-medium',
					viewportId: 'original-tight',
					phaseOffsetPixels: 0.5,
					kind: 'source-centered-half-plane-edge',
				},
			]),
		'Proof fixture must contain the fixed full and edge blockers.',
	);
	requireCondition(
		JSON.stringify(fixture.tile.backwardHalfSpaceControl) ===
			JSON.stringify({
				id: 'anti-source-optical-axis',
				conditionId: 'flat-medium',
				viewportId: 'original-tight',
				aimPolicy: 'anti-source-optical-axis',
				widthPixels: 1,
				heightPixels: 1,
			}),
		'Proof fixture backward-half-space control differs.',
	);
	const qualificationClassificationCount =
		(2 * 2 * 5 + fixture.tile.blockerControls.length) *
		5 *
		5 *
		(fixture.oracle.fineSubdivisionAxisCount ** 2 + fixture.oracle.coarseSubdivisionAxisCount ** 2);
	const backwardHalfSpaceControlClassificationCount =
		fixture.tile.backwardHalfSpaceControl.widthPixels *
		fixture.tile.backwardHalfSpaceControl.heightPixels *
		(fixture.oracle.fineSubdivisionAxisCount ** 2 + fixture.oracle.coarseSubdivisionAxisCount ** 2);
	requireCondition(
		fixture.oracle.algorithm === 'independent-float64-forward-ray-sphere-fixed-subdivision-v1' &&
			fixture.oracle.fineSubdivisionAxisCount === 512 &&
			fixture.oracle.coarseSubdivisionAxisCount === 256 &&
			fixture.oracle.usesConicCompletion === false &&
			fixture.oracle.usesCandidateCircleOverlap === false &&
			fixture.oracle.qualificationClassificationCount === qualificationClassificationCount &&
			fixture.oracle.backwardHalfSpaceControlClassificationCount ===
				backwardHalfSpaceControlClassificationCount &&
			fixture.oracle.classificationCountUpperBound ===
				qualificationClassificationCount + backwardHalfSpaceControlClassificationCount &&
			fixture.oracle.allocationPolicy === 'scalar-inner-loop-no-per-sample-heap-allocation',
		'Proof fixture oracle contract or fixed work bound differs.',
	);
	requireCondition(
		fixture.executionPolicy.oneChromeProcessAtATime === true &&
			fixture.executionPolicy.softwareRendererRejected === true &&
			fixture.executionPolicy.separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneForbidden === true &&
			JSON.stringify(fixture.executionPolicy.normalGpuPathDistantCelestialCpuReferenceHelper) ===
				JSON.stringify({
					allowed: true,
					classId: 'DistantSunCelestialCpuCache',
					scalarCount: 2145,
					purpose: 'support-mask-and-logical-field-construction',
				}) &&
			fixture.executionPolicy.inactivityTimeoutMilliseconds === INACTIVITY_TIMEOUT_MILLISECONDS &&
			fixture.executionPolicy.absoluteProgressTimeout === null &&
			fixture.executionPolicy.allocateRunOnlyAfterExplicitAuthorization === true,
		'Proof fixture execution policy differs.',
	);
	requireCondition(
		JSON.stringify(fixture.tolerances) === JSON.stringify(EXPECTED_TOLERANCES),
		'Proof fixture tolerance contract differs.',
	);
	requireCondition(
		JSON.stringify(fixture.requiredGates) === JSON.stringify(EXPECTED_REQUIRED_GATES),
		'Proof fixture required-gate inventory differs.',
	);
	requireCondition(
		JSON.stringify(fixture.finalVerificationDeferred) ===
			JSON.stringify({
				binary64N4AndCache: true,
				refinedSourcePathConvergence: true,
				pairedProductionCpuGpuRecord: true,
			}),
		'Proof fixture final-verification deferral differs.',
	);
}

/** Recompute and verify every sealed production snapshot byte. */
async function verifySnapshot() {
	await assertExistingRealPathContained(EXPERIMENT_ROOT, SNAPSHOT_ROOT, 'Sealed production snapshot');
	await assertNoReparseEntries(SNAPSHOT_ROOT, 'Sealed production snapshot');
	const manifest = JSON.parse(await readFile(SNAPSHOT_MANIFEST_PATH, 'utf8'));
	requireCondition(manifest.schemaId === 'production-sun-appearance-snapshot-v1', 'Snapshot schema differs.');
	requireCondition(
		manifest.snapshotRoot === 'scripts/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
		'Snapshot root identity differs.',
	);
	requireCondition(
		manifest.source?.inventory?.aggregateSha256 === manifest.sealedInventory?.aggregateSha256,
		'Snapshot source and seal identities differ.',
	);
	const selected = await createSelectedFileInventory(
		SNAPSHOT_ROOT,
		manifest.sealedInventory.files.map((entry) => entry.path),
	);
	assertFileInventoriesEqual(manifest.sealedInventory, selected, 'Sealed snapshot selected inventory');
	const complete = await createFileInventory(SNAPSHOT_ROOT, {
		include: (relativePath) => relativePath !== 'manifest.json',
	});
	assertFileInventoriesEqual(manifest.sealedInventory, complete, 'Sealed snapshot complete inventory');
	return {manifest, inventory: complete, manifestSha256: await sha256File(SNAPSHOT_MANIFEST_PATH)};
}

/** Inventory all explicitly protected production, historical, and candidate roots. */
async function createProtectedInventories() {
	const result = [];
	for (const specification of PROTECTED_ROOTS) {
		const canonicalRoot = await assertExistingRealPathContained(
			REPOSITORY_ROOT,
			specification.absolutePath,
			`Protected root ${specification.id}`,
		);
		await assertNoReparseEntries(canonicalRoot, `Protected root ${specification.id}`);
		result.push({...specification, canonicalRoot, inventory: await createFileInventory(canonicalRoot)});
	}
	return result;
}

/** Require all protected root inventories to remain byte-identical. */
function assertProtectedInventoriesEqual(before, after) {
	requireCondition(before.length === after.length, 'Protected root count changed.');
	for (let index = 0; index < before.length; index += 1) {
		const expected = before[index];
		const actual = after[index];
		requireCondition(
			expected.id === actual.id &&
				pathComparisonKey(expected.canonicalRoot) === pathComparisonKey(actual.canonicalRoot),
			`Protected root identity changed at index ${index}.`,
		);
		assertFileInventoriesEqual(expected.inventory, actual.inventory, `Protected root ${expected.id}`);
	}
}

/** Build and fingerprint the exact Node executable closure. */
async function createNodeExecutableClosure() {
	const descriptor = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: ['runners/run-flat-local-analytic-disk-raster-gpu-proof.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: ALLOWED_NODE_BUILTINS,
	});
	requireCondition(
		JSON.stringify(descriptor.files) === JSON.stringify(EXPECTED_NODE_CLOSURE_PATHS),
		`Node executable closure differs: ${JSON.stringify(descriptor.files)}.`,
	);
	return {
		descriptor,
		descriptorSha256: sha256(Buffer.from(JSON.stringify(descriptor), 'utf8')),
		inventory: await createSelectedFileInventory(EXPERIMENT_ROOT, descriptor.files),
	};
}

/** Canonicalize and fingerprint one regular executable file. */
async function createExecutableIdentity(executablePath, label) {
	const requestedPath = path.resolve(executablePath);
	const lexicalStats = await lstat(requestedPath);
	requireCondition(lexicalStats.isFile() && !lexicalStats.isSymbolicLink(), `${label} is not a plain regular file.`);
	const canonicalPath = await realpath(requestedPath);
	const canonicalStats = await lstat(canonicalPath);
	requireCondition(
		canonicalStats.isFile() && !canonicalStats.isSymbolicLink(),
		`${label} canonical path is not a plain regular file.`,
	);
	return {
		requestedPath,
		path: canonicalPath,
		bytes: canonicalStats.size,
		sha256: await sha256File(canonicalPath),
	};
}

/** Require two executable identity packets to be exactly equal. */
function assertExecutableIdentityEqual(before, after, label) {
	requireCondition(
		pathComparisonKey(after.requestedPath) === pathComparisonKey(before.requestedPath) &&
			pathComparisonKey(after.path) === pathComparisonKey(before.path) &&
			after.bytes === before.bytes &&
			after.sha256 === before.sha256,
		`${label} executable identity changed.`,
	);
}

/** Recompute and compare every protected executable/control identity after browser work. */
async function verifyProtectedAfter(before) {
	const snapshot = await verifySnapshot();
	const [production, controls, three, nodeExecutableClosure, protectedRoots] = await Promise.all([
		createSelectedFileInventory(
			REPOSITORY_ROOT,
			snapshot.manifest.sealedInventory.files.map((entry) => entry.path),
		),
		createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS),
		createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS),
		createNodeExecutableClosure(),
		createProtectedInventories(),
	]);
	const [nodeExecutable, chromeExecutable] = await Promise.all([
		createExecutableIdentity(before.nodeExecutable.requestedPath, 'Node executable after execution'),
		createExecutableIdentity(before.chromeExecutable.requestedPath, 'Chrome executable after execution'),
	]);
	requireCondition(snapshot.manifestSha256 === before.snapshot.manifestSha256, 'Snapshot manifest changed.');
	assertFileInventoriesEqual(before.snapshot.inventory, snapshot.inventory, 'Sealed snapshot after execution');
	assertFileInventoriesEqual(before.production, production, 'Protected production source after execution');
	assertFileInventoriesEqual(before.controls, controls, 'Executed controls after execution');
	assertFileInventoriesEqual(before.three, three, 'Three runtime after execution');
	assertFileInventoriesEqual(
		before.nodeExecutableClosure.inventory,
		nodeExecutableClosure.inventory,
		'Node executable closure after execution',
	);
	requireCondition(
		before.nodeExecutableClosure.descriptorSha256 === nodeExecutableClosure.descriptorSha256,
		'Node executable closure descriptor changed.',
	);
	assertProtectedInventoriesEqual(before.protectedRoots, protectedRoots);
	assertExecutableIdentityEqual(before.nodeExecutable, nodeExecutable, 'Node');
	assertExecutableIdentityEqual(before.chromeExecutable, chromeExecutable, 'Chrome');
	return {
		snapshot,
		production,
		controls,
		three,
		nodeExecutableClosure,
		protectedRoots,
		nodeExecutable,
		chromeExecutable,
	};
}

/** Return whether one HTTP peer is loopback-local. */
function isLoopbackAddress(value) {
	return value === '127.0.0.1' || value === '::1' || value === '::ffff:127.0.0.1';
}

/** Return a bounded content type for one served file. */
function contentType(filePath) {
	switch (path.extname(filePath).toLowerCase()) {
		case '.js':
			return 'text/javascript; charset=utf-8';
		case '.json':
			return 'application/json; charset=utf-8';
		default:
			return 'application/octet-stream';
	}
}

/** Read one bounded JSON request body. */
async function readJsonBody(request, limitBytes) {
	const declaredLength = Number(request.headers['content-length'] ?? 0);
	requireCondition(
		Number.isFinite(declaredLength) && declaredLength >= 0 && declaredLength <= limitBytes,
		'HTTP request exceeds its declared byte bound.',
	);
	const chunks = [];
	let byteLength = 0;
	for await (const chunk of request) {
		byteLength += chunk.byteLength;
		if (byteLength > limitBytes) throw new RangeError('HTTP request exceeds its streamed byte bound.');
		chunks.push(chunk);
	}
	if (request.headers['content-length'] !== undefined) {
		requireCondition(byteLength === declaredLength, 'HTTP body byte count differs from Content-Length.');
	}
	const body = Buffer.concat(chunks, byteLength);
	return {body, value: JSON.parse(body.toString('utf8'))};
}

/** Return the nonce-bound browser document for this one-process focused proof. */
function browserIndex(resultNonce) {
	return `<!doctype html>
<meta charset="utf-8">
<title>Flat local analytic disk raster GPU proof</title>
<pre id="result">pending</pre>
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
const target = document.querySelector('#result');
const nonce = ${JSON.stringify(resultNonce)};
let sequence = 0;
const postJson = async (pathname, value) => {
	const response = await fetch(pathname, {
		method: 'POST',
		headers: {'content-type': 'application/json', 'x-flat-raster-proof-nonce': nonce},
		body: JSON.stringify(value),
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(pathname + ' failed with HTTP ' + response.status + '.');
};
const reportProgress = async (event) => {
	sequence += 1;
	await postJson('/progress', {
		schemaVersion: 'flat-local-analytic-disk-raster-progress-v1',
		sequence,
		...event,
	});
};
try {
	await reportProgress({stage: 'browser-start'});
	const {runFlatLocalAnalyticDiskRasterGpuProof} = await import('/harness/flat-local-analytic-disk-raster-gpu-proof-browser-entry.js');
	const fixture = await (await fetch('/fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json', {cache: 'no-store'})).json();
	const value = await runFlatLocalAnalyticDiskRasterGpuProof(fixture, reportProgress);
	await reportProgress({stage: 'browser-complete'});
	await postJson('/result', value);
	target.textContent = 'submitted';
} catch (error) {
	await postJson('/result', {error: {name: error.name, message: error.message, stack: error.stack}});
}
</script>`;
}

/** Validate one bounded liveness progress event and its measurable work fields. */
function validateProgressEvent(value, state) {
	requireCondition(
		value?.schemaVersion === 'flat-local-analytic-disk-raster-progress-v1',
		'Browser progress schema differs.',
	);
	requireCondition(
		Number.isSafeInteger(value.sequence) && value.sequence === state.lastSequence + 1,
		'Browser progress sequence is not contiguous.',
	);
	const stages = new Set([
		'browser-start',
		'gpu-setup-start',
		'gpu-cache-heartbeat',
		'gpu-setup-complete',
		'phase-start',
		'oracle-row-complete',
		'phase-complete',
		'browser-complete',
	]);
	requireCondition(stages.has(value.stage), `Unsupported progress stage ${String(value.stage)}.`);
	if (value.stage === 'browser-start') {
		requireCondition(!state.browserStarted && value.sequence === 1, 'Browser start is duplicated or out of order.');
		state.browserStarted = true;
	} else {
		requireCondition(
			state.browserStarted && !state.browserCompleted,
			'Progress occurred outside browser lifetime.',
		);
	}
	if (value.stage === 'gpu-setup-start') {
		const expectedConditionId = EXPECTED_SETUP_IDS[state.setupIndex];
		const requiredCaptureScheduleIndex = [
			0,
			13,
			EXPECTED_ORACLE_CAPTURE_ORDER.length,
			EXPECTED_ORACLE_CAPTURE_ORDER.length,
		][state.setupIndex];
		requireCondition(
			value.conditionId === expectedConditionId &&
				state.activeSetup === null &&
				state.activeClearCapture === null &&
				state.captureScheduleIndex === requiredCaptureScheduleIndex &&
				state.completedSetups.size === state.setupIndex,
			`GPU setup start differs from expected ${String(expectedConditionId)}.`,
		);
		state.activeSetup = value.conditionId;
	}
	if (value.stage === 'gpu-cache-heartbeat') {
		requireCondition(value.conditionId === state.activeSetup, 'GPU cache heartbeat is outside its active setup.');
		const prior = state.heartbeatByCondition.get(value.conditionId) ?? {
			sequence: 0,
			workCompleted: -1,
			phaseDurationMilliseconds: -1,
		};
		requireCondition(
			Number.isSafeInteger(value.heartbeatSequence) && value.heartbeatSequence === prior.sequence + 1,
			`${value.conditionId} heartbeat sequence is not contiguous.`,
		);
		requireCondition(
			Number.isFinite(value.workCompleted) && value.workCompleted > prior.workCompleted,
			`${value.conditionId} heartbeat work did not advance.`,
		);
		requireCondition(
			Number.isFinite(value.phaseDurationMilliseconds) &&
				value.phaseDurationMilliseconds > prior.phaseDurationMilliseconds,
			`${value.conditionId} heartbeat duration did not advance.`,
		);
		state.heartbeatByCondition.set(value.conditionId, {
			sequence: value.heartbeatSequence,
			workCompleted: value.workCompleted,
			phaseDurationMilliseconds: value.phaseDurationMilliseconds,
		});
	}
	if (value.stage === 'gpu-setup-complete') {
		requireCondition(
			value.conditionId === state.activeSetup &&
				Number.isFinite(value.durationMilliseconds) &&
				value.durationMilliseconds >= 0,
			'GPU setup completion is invalid or out of order.',
		);
		state.completedSetups.add(value.conditionId);
		state.activeSetup = null;
		state.setupIndex += 1;
	}
	const clearKey = `${value.conditionId}|${value.viewportId}|${value.phaseOffsetPixels}`;
	if (value.stage === 'phase-start') {
		const expectedCapture = EXPECTED_ORACLE_CAPTURE_ORDER[state.captureScheduleIndex];
		requireCondition(
			expectedCapture?.kind === 'clear' &&
				expectedCapture.key === clearKey &&
				EXPECTED_CLEAR_CAPTURE_KEYS.has(clearKey) &&
				state.completedSetups.has(value.conditionId) &&
				state.activeSetup === null &&
				state.activeClearCapture === null &&
				!state.clearCaptures.has(clearKey),
			`Clear phase start is duplicated or unknown: ${clearKey}.`,
		);
		state.clearCaptures.set(clearKey, {rows: 0, completed: false});
		state.activeClearCapture = clearKey;
	}
	if (value.stage === 'oracle-row-complete') {
		const isBackwardHalfSpaceControl = value.backwardHalfSpaceControlId !== undefined;
		const actualKind = isBackwardHalfSpaceControl
			? 'backward'
			: value.blockerId === undefined
				? 'clear'
				: 'blocker';
		const actualKey = isBackwardHalfSpaceControl
			? `${value.conditionId}|${value.viewportId}|${value.backwardHalfSpaceControlId}`
			: value.blockerId === undefined
				? clearKey
				: `${clearKey}|${value.blockerId}`;
		const expectedCapture = EXPECTED_ORACLE_CAPTURE_ORDER[state.captureScheduleIndex];
		requireCondition(
			expectedCapture?.kind === actualKind &&
				expectedCapture.key === actualKey &&
				state.activeSetup === null &&
				Number.isSafeInteger(value.rowIndex) &&
				Number.isSafeInteger(value.rowCount) &&
				value.rowIndex >= 1 &&
				value.rowIndex <= value.rowCount &&
				value.rowCount === expectedCapture.rows,
			'Oracle row progress is invalid.',
		);
		if (isBackwardHalfSpaceControl) {
			requireCondition(
				actualKey === EXPECTED_BACKWARD_CONTROL_KEY &&
					state.completedSetups.has(value.conditionId) &&
					state.backwardHalfSpaceControl === null &&
					state.activeClearCapture === null &&
					value.rowIndex === 1,
				`Backward-half-space oracle work is duplicated or unknown: ${actualKey}.`,
			);
			state.backwardHalfSpaceControl = {key: actualKey, rows: 1};
			state.captureScheduleIndex += 1;
		} else if (value.blockerId === undefined) {
			const capture = state.clearCaptures.get(clearKey);
			requireCondition(
				state.activeClearCapture === clearKey &&
					capture !== undefined &&
					!capture.completed &&
					value.rowIndex === capture.rows + 1,
				`Clear oracle row is duplicated or out of order: ${clearKey} row ${value.rowIndex}.`,
			);
			capture.rows = value.rowIndex;
		} else {
			requireCondition(
				EXPECTED_BLOCKER_CAPTURE_KEYS.has(actualKey) &&
					state.completedSetups.has(value.conditionId) &&
					state.activeClearCapture === null,
				`Blocker oracle capture is unknown: ${actualKey}.`,
			);
			const capture = state.blockerCaptures.get(actualKey) ?? {rows: 0};
			requireCondition(
				value.rowIndex === capture.rows + 1,
				`Blocker oracle row is duplicated or out of order: ${actualKey} row ${value.rowIndex}.`,
			);
			capture.rows = value.rowIndex;
			state.blockerCaptures.set(actualKey, capture);
			if (capture.rows === expectedCapture.rows) state.captureScheduleIndex += 1;
		}
	}
	if (value.stage === 'phase-complete') {
		const capture = state.clearCaptures.get(clearKey);
		const expectedCapture = EXPECTED_ORACLE_CAPTURE_ORDER[state.captureScheduleIndex];
		requireCondition(
			expectedCapture?.kind === 'clear' &&
				expectedCapture.key === clearKey &&
				state.activeClearCapture === clearKey &&
				EXPECTED_CLEAR_CAPTURE_KEYS.has(clearKey) &&
				capture !== undefined &&
				capture.rows === 5 &&
				!capture.completed,
			`Clear phase completion is invalid: ${clearKey}.`,
		);
		capture.completed = true;
		state.activeClearCapture = null;
		state.captureScheduleIndex += 1;
	}
	if (value.stage === 'browser-complete') {
		requireCondition(
			state.setupIndex === EXPECTED_SETUP_IDS.length &&
				state.activeSetup === null &&
				state.activeClearCapture === null &&
				state.captureScheduleIndex === EXPECTED_ORACLE_CAPTURE_ORDER.length &&
				state.clearCaptures.size === EXPECTED_CLEAR_CAPTURE_KEYS.size &&
				[...state.clearCaptures.values()].every((capture) => capture.rows === 5 && capture.completed) &&
				state.blockerCaptures.size === EXPECTED_BLOCKER_CAPTURE_KEYS.size &&
				[...state.blockerCaptures.values()].every((capture) => capture.rows === 5) &&
				state.backwardHalfSpaceControl?.key === EXPECTED_BACKWARD_CONTROL_KEY &&
				state.backwardHalfSpaceControl.rows === 1,
			'Browser completed before the exact authored work schedule.',
		);
		state.browserCompleted = true;
	}
	state.lastSequence = value.sequence;
}

/** Retain a bounded progress window and an unbounded chain identity. */
function recordProgressReceipt(state, receipt) {
	state.count += 1;
	state.chainSha256 = sha256(
		Buffer.from(`${state.chainSha256}\0${receipt.sha256}\0${receipt.event.sequence}`, 'utf8'),
	);
	if (state.first.length < RETAINED_PROGRESS_RECEIPT_LIMIT / 2) state.first.push(receipt);
	else {
		state.last.push(receipt);
		if (state.last.length > RETAINED_PROGRESS_RECEIPT_LIMIT / 2) state.last.shift();
	}
}

/** Start one loopback-only nonce-bound static and evidence server. */
async function startServer(indexHtml, resultNonce) {
	const roots = new Map([
		['/harness/', path.join(EXPERIMENT_ROOT, 'harness')],
		['/snapshot/', SNAPSHOT_ROOT],
		['/fixtures/', path.join(EXPERIMENT_ROOT, 'fixtures')],
		['/node_modules/', EXPERIMENT_NODE_MODULES_ROOT],
	]);
	const canonicalRoots = new Map();
	for (const [prefix, root] of roots) {
		canonicalRoots.set(prefix, await assertExistingRealPathContained(EXPERIMENT_ROOT, root, `HTTP ${prefix}`));
	}
	const servedFiles = new Map();
	const progressState = {
		count: 0,
		lastSequence: 0,
		chainSha256: '0'.repeat(64),
		first: [],
		last: [],
		heartbeatByCondition: new Map(),
		browserStarted: false,
		browserCompleted: false,
		setupIndex: 0,
		activeSetup: null,
		activeClearCapture: null,
		captureScheduleIndex: 0,
		completedSetups: new Set(),
		clearCaptures: new Map(),
		blockerCaptures: new Map(),
		backwardHalfSpaceControl: null,
	};
	let lastActivityEpochMilliseconds = Date.now();
	let resultStarted = false;
	let serverClosing = false;
	let resolveResult;
	const resultPromise = new Promise((resolve) => {
		resolveResult = resolve;
	});
	const recordServed = (record) => {
		requireCondition(!serverClosing, 'Served-file evidence is fenced after server closure starts.');
		const prior = servedFiles.get(record.requestPath);
		if (prior && (prior.sha256 !== record.sha256 || prior.byteLength !== record.byteLength)) {
			throw new Error(`Served bytes changed during execution: ${record.requestPath}.`);
		}
		servedFiles.set(record.requestPath, record);
	};
	const serverConnections = new Set();
	const activeHandlers = new Set();
	const server = createServer((request, response) => {
		const handlerPromise = (async () => {
			try {
				requireCondition(!serverClosing, 'HTTP request arrived after server closure started.');
				requireCondition(isLoopbackAddress(request.socket.remoteAddress), 'HTTP peer is not loopback-local.');
				const url = new URL(request.url ?? '/', 'http://127.0.0.1');
				if (url.pathname === '/progress' || url.pathname === '/result') {
					requireCondition(request.method === 'POST', 'Evidence endpoints require POST.');
					requireCondition(
						request.headers['x-flat-raster-proof-nonce'] === resultNonce,
						'Evidence nonce differs.',
					);
					if (url.pathname === '/progress') {
						requireCondition(!resultStarted, 'Progress is closed after result submission starts.');
						const {body, value} = await readJsonBody(request, PROGRESS_BODY_LIMIT_BYTES);
						requireCondition(!serverClosing, 'Progress body completed after server closure started.');
						validateProgressEvent(value, progressState);
						const receipt = {
							receivedAt: new Date().toISOString(),
							byteLength: body.byteLength,
							sha256: sha256(body),
							event: value,
						};
						recordProgressReceipt(progressState, receipt);
						lastActivityEpochMilliseconds = Date.now();
						response.writeHead(204, {'cache-control': 'no-store'});
						response.end();
						process.stdout.write(`[flat-raster-proof] ${value.stage}\n`);
						return;
					}
					requireCondition(!resultStarted, 'Result endpoint accepts exactly one submission.');
					resultStarted = true;
					const {body, value} = await readJsonBody(request, RESULT_BODY_LIMIT_BYTES);
					requireCondition(!serverClosing, 'Result body completed after server closure started.');
					lastActivityEpochMilliseconds = Date.now();
					response.writeHead(204, {'cache-control': 'no-store'});
					response.end();
					resolveResult({
						value,
						receipt: {
							receivedAt: new Date().toISOString(),
							byteLength: body.byteLength,
							sha256: sha256(body),
						},
					});
					return;
				}
				if (url.pathname === '/') {
					requireCondition(request.method === 'GET', 'Browser index requires GET.');
					const body = Buffer.from(indexHtml, 'utf8');
					recordServed({
						requestPath: '/',
						root: 'generated-browser-index',
						relativePath: 'index.html',
						byteLength: body.byteLength,
						sha256: sha256(body),
					});
					response.writeHead(200, {'cache-control': 'no-store', 'content-type': 'text/html; charset=utf-8'});
					response.end(body);
					return;
				}
				requireCondition(request.method === 'GET', 'Static browser files require GET.');
				const pathname = decodeURIComponent(url.pathname);
				requireCondition(!pathname.includes('\\') && !pathname.includes('\0'), 'Unsafe browser request path.');
				const route = [...canonicalRoots.entries()].find(([prefix]) => pathname.startsWith(prefix));
				requireCondition(route !== undefined, 'Browser requested an unsupported root.');
				const [prefix, canonicalRoot] = route;
				const relativePath = pathname.slice(prefix.length);
				requireCondition(
					relativePath.length > 0 &&
						!relativePath.split('/').includes('..') &&
						!path.posix.isAbsolute(relativePath),
					'Unsafe browser relative path.',
				);
				const allowed = SERVED_CONTROL_PATHS.get(prefix);
				if (allowed !== undefined) {
					requireCondition(
						allowed.has(relativePath),
						`Browser requested a file outside its closure: ${pathname}.`,
					);
				}
				const target = assertLexicallyContained(
					canonicalRoot,
					path.join(canonicalRoot, ...relativePath.split('/')),
					'Browser request',
				);
				const stats = await lstat(target);
				requireCondition(stats.isFile() && !stats.isSymbolicLink(), 'Browser request is not a plain file.');
				const canonicalTarget = await realpath(target);
				requireCondition(
					pathComparisonKey(canonicalTarget) === pathComparisonKey(target) &&
						isPathContained(canonicalRoot, canonicalTarget),
					'Browser request escaped its real root.',
				);
				const body = await readFile(canonicalTarget);
				recordServed({
					requestPath: pathname,
					root: prefix,
					relativePath,
					byteLength: body.byteLength,
					sha256: sha256(body),
				});
				response.writeHead(200, {'cache-control': 'no-store', 'content-type': contentType(canonicalTarget)});
				response.end(body);
			} catch (error) {
				if (!response.headersSent) {
					response.writeHead(404, {
						'cache-control': 'no-store',
						'content-type': 'text/plain; charset=utf-8',
					});
				}
				response.end(error?.message ?? String(error));
			}
		})();
		activeHandlers.add(handlerPromise);
		void handlerPromise.then(
			() => activeHandlers.delete(handlerPromise),
			() => activeHandlers.delete(handlerPromise),
		);
	});
	server.on('connection', (connection) => {
		serverConnections.add(connection);
		connection.once('close', () => serverConnections.delete(connection));
	});
	await new Promise((resolve, reject) => {
		server.once('error', reject);
		server.listen(0, '127.0.0.1', resolve);
	});
	const address = server.address();
	requireCondition(address && typeof address === 'object', 'Loopback server acquired no address.');
	return {
		url: `http://127.0.0.1:${address.port}/`,
		resultPromise,
		lastActivityEpochMilliseconds: () => lastActivityEpochMilliseconds,
		servedFiles: () =>
			[...servedFiles.values()].sort((left, right) => compareStrings(left.requestPath, right.requestPath)),
		progressSummary: () => ({
			schemaVersion: 'flat-local-analytic-disk-raster-progress-summary-v1',
			acceptedReceiptCount: progressState.count,
			lastSequence: progressState.lastSequence,
			chainSha256: progressState.chainSha256,
			retainedReceiptLimit: RETAINED_PROGRESS_RECEIPT_LIMIT,
			firstReceipts: progressState.first,
			lastReceipts: progressState.last,
			heartbeats: [...progressState.heartbeatByCondition.entries()].map(([conditionId, value]) => ({
				conditionId,
				...value,
			})),
			finalState: {
				browserStarted: progressState.browserStarted,
				browserCompleted: progressState.browserCompleted,
				setupIndex: progressState.setupIndex,
				activeSetup: progressState.activeSetup,
				activeClearCapture: progressState.activeClearCapture,
				captureScheduleIndex: progressState.captureScheduleIndex,
				completedSetups: [...progressState.completedSetups],
				clearCaptures: [...progressState.clearCaptures.entries()].map(([key, value]) => ({key, ...value})),
				blockerCaptures: [...progressState.blockerCaptures.entries()].map(([key, value]) => ({key, ...value})),
				backwardHalfSpaceControl: progressState.backwardHalfSpaceControl,
			},
		}),
		close: async () => {
			serverClosing = true;
			const mutatingHandlers = [...activeHandlers];
			const closePromise = new Promise((resolve) => {
				server.close((error) =>
					resolve(
						error === undefined || error === null
							? {kind: 'closed'}
							: {kind: 'close-error', error: serializeError(error)},
					),
				);
			});
			const destroyedConnectionCount = serverConnections.size;
			server.closeAllConnections?.();
			for (const connection of serverConnections) connection.destroy();
			let timeoutId;
			const outcome = await Promise.race([
				Promise.all([closePromise, Promise.allSettled(mutatingHandlers)]).then(
					([closeOutcome]) => closeOutcome,
				),
				new Promise((resolve) => {
					timeoutId = setTimeout(() => resolve({kind: 'close-timeout'}), SERVER_CLOSE_TIMEOUT_MILLISECONDS);
				}),
			]);
			clearTimeout(timeoutId);
			if (outcome.kind !== 'closed') server.unref();
			return {
				...outcome,
				closureFenceSet: serverClosing,
				drainedMutatingHandlerCount: mutatingHandlers.length,
				remainingActiveHandlerCount: activeHandlers.size,
				destroyedConnectionCount,
				remainingConnectionCount: serverConnections.size,
			};
		},
	};
}

/** Collect one browser stream without permitting unbounded log output. */
function collectBoundedBrowserStream(stream, label) {
	const chunks = [];
	let byteLength = 0;
	let overflow = false;
	stream.on('data', (chunk) => {
		byteLength += chunk.byteLength;
		if (!overflow && byteLength <= BROWSER_LOG_LIMIT_BYTES) chunks.push(chunk);
		else overflow = true;
	});
	return () => {
		requireCondition(!overflow, `${label} exceeded ${BROWSER_LOG_LIMIT_BYTES} bytes.`);
		return Buffer.concat(chunks).toString('utf8');
	};
}

/** Find and hash the exact installed Chrome executable. */
async function findChrome() {
	for (const candidate of CHROME_CANDIDATES) {
		try {
			const stats = await lstat(candidate);
			if (stats.isFile() && !stats.isSymbolicLink()) return realpath(candidate);
		} catch {
			// Continue through the fixed candidate list.
		}
	}
	throw new Error('No supported Chrome executable was found.');
}

/** Return contained, network-disabled, hardware-GPU-only Chrome arguments. */
function chromeArguments(profileDirectory, url) {
	return [
		'--headless=new',
		`--user-data-dir=${profileDirectory}`,
		`--disk-cache-dir=${path.join(profileDirectory, 'cache')}`,
		'--enable-gpu',
		'--enable-webgl',
		'--ignore-gpu-blocklist',
		'--disable-software-rasterizer',
		'--disable-dev-shm-usage',
		'--disable-background-networking',
		'--disable-breakpad',
		'--disable-component-update',
		'--disable-crash-reporter',
		'--disable-default-apps',
		'--disable-gpu-shader-disk-cache',
		'--disable-sync',
		'--metrics-recording-only',
		'--no-first-run',
		url,
	];
}

/** Launch one exact hidden Chrome child. */
function launchChrome(chromePath, arguments_) {
	const child = spawn(chromePath, arguments_, {stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true});
	const readStdout = collectBoundedBrowserStream(child.stdout, 'Chrome stdout');
	const readStderr = collectBoundedBrowserStream(child.stderr, 'Chrome stderr');
	const exitPromise = new Promise((resolve) => {
		child.once('error', (error) => resolve({kind: 'spawn-error', error: serializeError(error)}));
		child.once('close', (code, signal) => resolve({kind: 'exit', code, signal}));
	});
	return {child, launchedAt: new Date().toISOString(), exitPromise, readStdout, readStderr};
}

/** Wait indefinitely while valid measurable progress renews the inactivity lease. */
async function awaitBrowserSubmission(launched, server) {
	let intervalId;
	const inactivityPromise = new Promise((resolve) => {
		intervalId = setInterval(() => {
			const inactiveMilliseconds = Date.now() - server.lastActivityEpochMilliseconds();
			if (inactiveMilliseconds > INACTIVITY_TIMEOUT_MILLISECONDS) {
				resolve({kind: 'inactivity', inactiveMilliseconds});
			}
		}, INACTIVITY_POLL_MILLISECONDS);
	});
	const outcome = await Promise.race([
		server.resultPromise.then((submission) => ({kind: 'submission', submission})),
		launched.exitPromise.then((exit) => ({kind: 'premature-exit', exit})),
		inactivityPromise,
	]);
	clearInterval(intervalId);
	if (outcome.kind === 'inactivity') {
		throw new Error(`Chrome made no valid progress for ${outcome.inactiveMilliseconds} ms.`);
	}
	if (outcome.kind === 'premature-exit') {
		throw new Error(`Chrome exited before result submission: ${JSON.stringify(outcome.exit)}.`);
	}
	return outcome.submission;
}

/** Terminate one completed or failed browser child and await closure. */
async function terminateChrome(launched) {
	const terminationRequested = launched.child.exitCode === null && launched.child.signalCode === null;
	const sigtermAccepted = terminationRequested ? launched.child.kill('SIGTERM') : null;
	let timeoutId;
	let outcome = await Promise.race([
		launched.exitPromise,
		new Promise((resolve) => {
			timeoutId = setTimeout(() => resolve({kind: 'timeout'}), CHROME_TERMINATION_TIMEOUT_MILLISECONDS);
		}),
	]);
	clearTimeout(timeoutId);
	if (outcome.kind !== 'timeout') {
		return {
			...outcome,
			terminationRequested,
			sigtermAccepted,
			gracefulTerminationTimedOut: false,
			forcedKill: false,
			terminalExitConfirmed: outcome.kind === 'exit',
		};
	}
	const sigkillAccepted = launched.child.kill('SIGKILL');
	let forcedTimeoutId;
	const forcedOutcome = await Promise.race([
		launched.exitPromise,
		new Promise((resolve) => {
			forcedTimeoutId = setTimeout(() => resolve({kind: 'timeout'}), CHROME_TERMINATION_TIMEOUT_MILLISECONDS);
		}),
	]);
	clearTimeout(forcedTimeoutId);
	return forcedOutcome.kind === 'timeout'
		? {
				kind: 'termination-timeout',
				terminationRequested,
				sigtermAccepted,
				gracefulTerminationTimedOut: true,
				forcedKill: true,
				sigkillAccepted,
				terminalExitConfirmed: false,
			}
		: {
				...forcedOutcome,
				terminationRequested,
				sigtermAccepted,
				gracefulTerminationTimedOut: true,
				forcedKill: true,
				sigkillAccepted,
				terminalExitConfirmed: forcedOutcome.kind === 'exit',
			};
}

/** Execute the one-browser focused proof and clean its generated profile after confirmed process exit. */
async function executeBrowser(runDirectory, chromePath, indexHtml, resultNonce) {
	const profileDirectory = path.join(runDirectory, 'browser-profile');
	const startedAtEpochMilliseconds = Date.now();
	let server = null;
	let launched = null;
	let submission = null;
	let failure = null;
	let exit = null;
	let profileCreated = false;
	let progressSummary = null;
	let servedFiles = [];
	let serverClose = null;
	let profileRemoved = false;
	let profileRetained = false;
	let browserStreamsDetached = false;
	let requiresPartialUnfinalized = false;
	const partialUnfinalizedReasons = [];
	try {
		await mkdir(profileDirectory, {recursive: false});
		profileCreated = true;
		await assertExistingRealPathContained(runDirectory, profileDirectory, 'Chrome profile');
		server = await startServer(indexHtml, resultNonce);
		launched = launchChrome(chromePath, chromeArguments(profileDirectory, server.url));
		activeChromeChild = launched.child;
		try {
			submission = await awaitBrowserSubmission(launched, server);
		} catch (error) {
			failure = error;
		} finally {
			exit = await terminateChrome(launched);
			const expectedRequestedSigtermExit =
				exit.kind === 'exit' &&
				exit.terminationRequested === true &&
				exit.sigtermAccepted === true &&
				exit.code === null &&
				exit.signal === 'SIGTERM' &&
				exit.gracefulTerminationTimedOut === false &&
				exit.forcedKill === false &&
				exit.terminalExitConfirmed === true;
			if (!expectedRequestedSigtermExit) {
				failure ??= new Error(
					`Chrome did not reach the exact requested SIGTERM exit: ${JSON.stringify(exit)}.`,
				);
			}
		}
	} catch (error) {
		failure ??= error;
	} finally {
		if (server !== null) {
			try {
				serverClose = await server.close();
			} catch (error) {
				serverClose = {kind: 'close-exception', error: serializeError(error)};
			}
			progressSummary = server.progressSummary();
			servedFiles = server.servedFiles();
			if (
				serverClose.kind !== 'closed' ||
				serverClose.closureFenceSet !== true ||
				serverClose.remainingActiveHandlerCount !== 0 ||
				serverClose.remainingConnectionCount !== 0
			) {
				failure ??= new Error(`Loopback server closure was not confirmed: ${JSON.stringify(serverClose)}.`);
				requiresPartialUnfinalized = true;
				partialUnfinalizedReasons.push('loopback-server-closure-unconfirmed');
			}
		}
		const chromeTerminalExitConfirmed = launched === null || exit?.terminalExitConfirmed === true;
		if (!chromeTerminalExitConfirmed) {
			requiresPartialUnfinalized = true;
			partialUnfinalizedReasons.push('chrome-process-terminality-unconfirmed');
		}
		if (profileCreated && chromeTerminalExitConfirmed) {
			try {
				await assertExistingRealPathContained(runDirectory, profileDirectory, 'Chrome profile cleanup');
				await assertNoReparseEntries(profileDirectory, 'Chrome profile cleanup');
				await rm(profileDirectory, {recursive: true, force: false, maxRetries: 5, retryDelay: 100});
				profileRemoved = true;
			} catch (error) {
				failure ??= error;
				requiresPartialUnfinalized = true;
				profileRetained = true;
				partialUnfinalizedReasons.push('chrome-profile-cleanup-failed');
			}
		} else if (profileCreated) {
			profileRetained = true;
		}
		if (launched !== null && !chromeTerminalExitConfirmed) {
			launched.child.stdout.destroy();
			launched.child.stderr.destroy();
			launched.child.unref();
			browserStreamsDetached = true;
		}
		activeChromeChild = null;
	}
	let stdout = '';
	let stderr = '';
	if (launched !== null) {
		try {
			stdout = launched.readStdout();
			stderr = launched.readStderr();
		} catch (error) {
			failure ??= error;
		}
	}
	return {
		startedAt: new Date(startedAtEpochMilliseconds).toISOString(),
		completedAt: new Date().toISOString(),
		wallDurationMilliseconds: Date.now() - startedAtEpochMilliseconds,
		pid: launched?.child.pid ?? null,
		launchedAt: launched?.launchedAt ?? null,
		exit,
		serverClose,
		profileRemoved,
		profileRetained,
		browserStreamsDetached,
		requiresPartialUnfinalized,
		partialUnfinalizedReasons,
		failure: failure === null ? null : serializeError(failure),
		receipt: submission?.receipt ?? null,
		value: submission?.value ?? null,
		progressSummary,
		servedFiles,
		stdout,
		stderr,
		indexHtmlSha256: sha256(Buffer.from(indexHtml, 'utf8')),
	};
}

/** Require the submitted browser result to follow the complete exact progress state machine. */
function validateFinalProgressSummary(summary) {
	requireCondition(
		summary?.schemaVersion === 'flat-local-analytic-disk-raster-progress-summary-v1' &&
			Number.isInteger(summary.acceptedReceiptCount) &&
			summary.acceptedReceiptCount > 0 &&
			summary.lastSequence === summary.acceptedReceiptCount &&
			/^[a-f0-9]{64}$/u.test(summary.chainSha256) &&
			summary.finalState?.browserStarted === true &&
			summary.finalState.browserCompleted === true &&
			summary.finalState.setupIndex === EXPECTED_SETUP_IDS.length &&
			summary.finalState.activeSetup === null &&
			summary.finalState.activeClearCapture === null &&
			summary.finalState.captureScheduleIndex === EXPECTED_ORACLE_CAPTURE_ORDER.length &&
			arraysExactlyEqual(summary.finalState.completedSetups, EXPECTED_SETUP_IDS),
		'Browser progress did not reach the exact terminal schedule.',
	);
	const clear = summary.finalState.clearCaptures;
	const blockers = summary.finalState.blockerCaptures;
	requireCondition(
		Array.isArray(clear) &&
			clear.length === EXPECTED_CLEAR_CAPTURE_KEYS.size &&
			arraysExactlyEqual(
				clear.map((entry) => entry.key),
				EXPECTED_CLEAR_CAPTURE_ORDER,
			) &&
			new Set(clear.map((entry) => entry.key)).size === EXPECTED_CLEAR_CAPTURE_KEYS.size &&
			clear.every(
				(entry) => EXPECTED_CLEAR_CAPTURE_KEYS.has(entry.key) && entry.rows === 5 && entry.completed === true,
			) &&
			Array.isArray(blockers) &&
			blockers.length === EXPECTED_BLOCKER_CAPTURE_KEYS.size &&
			arraysExactlyEqual(
				blockers.map((entry) => entry.key),
				EXPECTED_BLOCKER_CAPTURE_ORDER,
			) &&
			new Set(blockers.map((entry) => entry.key)).size === EXPECTED_BLOCKER_CAPTURE_KEYS.size &&
			blockers.every((entry) => EXPECTED_BLOCKER_CAPTURE_KEYS.has(entry.key) && entry.rows === 5) &&
			summary.finalState.backwardHalfSpaceControl?.key === EXPECTED_BACKWARD_CONTROL_KEY &&
			summary.finalState.backwardHalfSpaceControl.rows === 1,
		'Browser progress capture ledger is incomplete.',
	);
}

/** Validate every byte actually served to the browser against sealed inventories. */
function validateServedBrowserClosure(execution, snapshotInventory, controlsInventory, threeInventory) {
	const expectedDependencyCount = EXPECTED_SNAPSHOT_MODULE_COUNT + 4 + 1 + SERVED_THREE_RUNTIME_PATHS.length;
	requireCondition(
		Array.isArray(execution.servedFiles) && execution.servedFiles.length === expectedDependencyCount + 1,
		'Served browser closure count differs.',
	);
	const snapshotEntries = new Map(snapshotInventory.files.map((entry) => [entry.path, entry]));
	const controlEntries = new Map(controlsInventory.files.map((entry) => [entry.path, entry]));
	const threeEntries = new Map(threeInventory.files.map((entry) => [entry.path, entry]));
	const requestPaths = new Set();
	const grouped = new Map([
		['/snapshot/', []],
		['/harness/', []],
		['/fixtures/', []],
		['/node_modules/', []],
	]);
	for (const file of execution.servedFiles) {
		requireCondition(
			typeof file.requestPath === 'string' &&
				typeof file.relativePath === 'string' &&
				Number.isSafeInteger(file.byteLength) &&
				file.byteLength >= 0 &&
				/^[a-f0-9]{64}$/u.test(file.sha256),
			'Malformed served-browser evidence.',
		);
		requireCondition(!requestPaths.has(file.requestPath), `Duplicate served path ${file.requestPath}.`);
		requestPaths.add(file.requestPath);
		if (file.requestPath === '/') {
			requireCondition(
				file.root === 'generated-browser-index' &&
					file.relativePath === 'index.html' &&
					file.sha256 === execution.indexHtmlSha256,
				'Generated browser index identity differs.',
			);
			continue;
		}
		const prefix = [...grouped.keys()].find((candidate) => file.requestPath.startsWith(candidate));
		requireCondition(prefix !== undefined && file.root === prefix, 'Served dependency root differs.');
		requireCondition(file.requestPath === `${prefix}${file.relativePath}`, 'Served path identity differs.');
		grouped.get(prefix).push(file.relativePath);
		let expected;
		if (prefix === '/snapshot/') expected = snapshotEntries.get(file.relativePath);
		else if (prefix === '/node_modules/') expected = threeEntries.get(file.relativePath);
		else expected = controlEntries.get(`${prefix.slice(1)}${file.relativePath}`);
		requireCondition(
			expected?.bytes === file.byteLength && expected.sha256 === file.sha256,
			`Served bytes differ from sealed input ${file.requestPath}.`,
		);
	}
	for (const paths of grouped.values()) paths.sort(compareStrings);
	requireCondition(
		grouped.get('/snapshot/').length === EXPECTED_SNAPSHOT_MODULE_COUNT,
		'Served snapshot module count differs.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/harness/')) ===
			JSON.stringify(
				[
					'flat-local-analytic-disk-raster-gpu-proof-browser-entry.js',
					'lib/flat-local-analytic-disk-raster-gpu-proof-scene.js',
					'lib/flat-local-analytic-disk-raster-oracle.js',
					'lib/flat-local-analytic-disk-raster.js',
				].sort(compareStrings),
			),
		'Served proof harness closure differs.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/fixtures/')) ===
			JSON.stringify(['flat-local-analytic-disk-raster-gpu-proof-v1.json']),
		'Served proof fixture closure differs.',
	);
	requireCondition(
		JSON.stringify(grouped.get('/node_modules/')) ===
			JSON.stringify([...SERVED_THREE_RUNTIME_PATHS].sort(compareStrings)),
		'Served Three closure differs.',
	);
	const dependencies = execution.servedFiles
		.filter((file) => file.requestPath !== '/')
		.map(({requestPath, root, relativePath, byteLength, sha256: fileSha256}) => ({
			requestPath,
			root,
			relativePath,
			byteLength,
			sha256: fileSha256,
		}));
	return {
		dependencyFileCount: dependencies.length,
		snapshotModuleCount: grouped.get('/snapshot/').length,
		harnessModuleCount: grouped.get('/harness/').length,
		fixtureFileCount: grouped.get('/fixtures/').length,
		threeModuleCount: grouped.get('/node_modules/').length,
		dependencyClosureSha256: sha256(Buffer.from(JSON.stringify(dependencies), 'utf8')),
		paths: Object.fromEntries(grouped),
	};
}

/** Return every clear phase capture with its authored identity. */
function clearCaptures(result) {
	return result.flatConditions.flatMap((condition) =>
		condition.viewports.flatMap((viewport) =>
			viewport.phases.map((capture) => ({
				condition,
				viewport,
				capture,
				key: `${condition.id}|${viewport.id}|${capture.phaseOffsetPixels}`,
			})),
		),
	);
}

/** Return every blocker capture with its authored identity. */
function blockerCaptures(result) {
	return result.flatConditions.flatMap((condition) =>
		condition.blockerControls.map((capture) => ({
			condition,
			capture,
			key: `${condition.id}|${capture.viewportId}|${capture.phaseOffsetPixels}|${capture.id}`,
		})),
	);
}

/** Return one clear capture by exact condition, viewport, and phase. */
function findClearCapture(captures, conditionId, viewportId, phaseOffsetPixels) {
	return captures.find(
		(entry) =>
			entry.condition.id === conditionId &&
			entry.viewport.id === viewportId &&
			entry.capture.phaseOffsetPixels === phaseOffsetPixels,
	);
}

/** Return one tile pixel by its local coordinate. */
function localPixel(capture, localX, localY) {
	return capture.pixels.find((pixel) => pixel.local.x === localX && pixel.local.y === localY);
}

/** Return one scalar sum over an array. */
function sum(values) {
	return values.reduce((total, value) => total + value, 0);
}

/** Return whether a value is one exact-length finite numerical vector. */
function isFiniteVector(value, length) {
	return Array.isArray(value) && value.length === length && value.every(Number.isFinite);
}

/** Return whether two numerical arrays have exact element identity. */
function arraysExactlyEqual(left, right) {
	return (
		Array.isArray(left) &&
		Array.isArray(right) &&
		left.length === right.length &&
		left.every((value, index) => Object.is(value, right[index]))
	);
}

/** Return whether two spectra agree within the frozen spectral tolerance. */
function spectraWithinTolerance(left, right, tolerance) {
	return (
		isFiniteVector(left, 15) &&
		isFiniteVector(right, 15) &&
		left.every((value, index) =>
			withinMixedTolerance(
				value,
				right[index],
				tolerance.coverageNormalizedSpectralAbsolute,
				tolerance.coverageNormalizedSpectralRelative,
			),
		)
	);
}

/** Return one channel-wise sum of a raw tile spectrum times exact pixel solid angle. */
function recomputeSpectralEnergy(pixels, spectrumKey) {
	const energy = new Array(15).fill(0);
	for (const pixel of pixels) {
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			energy[channelIndex] += pixel[spectrumKey][channelIndex] * pixel.solidAngleSteradians;
		}
	}
	return energy;
}

/** Recompute every producer summary used by classification from the 25 raw rows. */
function recomputeCaptureSummary(capture) {
	const pixels = capture.pixels;
	const analyticSupportedSolidAngleSteradians = sum(
		pixels.map((pixel) => pixel.analyticCoverage * pixel.solidAngleSteradians),
	);
	const oracleSupportedSolidAngleSteradians = sum(
		pixels.map((pixel) => pixel.fineOracle.coverage * pixel.solidAngleSteradians),
	);
	const candidateSpectralEnergy = recomputeSpectralEnergy(pixels, 'candidateCelestialSpectrum');
	const productionSpectralEnergy = recomputeSpectralEnergy(pixels, 'productionCelestialSpectrum');
	return {
		analyticCoverageSum: sum(pixels.map((pixel) => pixel.analyticCoverage)),
		fineOracleCoverageSum: sum(pixels.map((pixel) => pixel.fineOracle.coverage)),
		coarseOracleCoverageSum: sum(pixels.map((pixel) => pixel.coarseOracle.coverage)),
		legacyGeometricHitFractionSum: sum(pixels.map((pixel) => pixel.legacyGeometricHitFraction)),
		analyticSupportedSolidAngleSteradians,
		oracleSupportedSolidAngleSteradians,
		candidateSpectralEnergy,
		productionSpectralEnergy,
		coverageNormalizedCandidateSpectrum:
			analyticSupportedSolidAngleSteradians > 0
				? candidateSpectralEnergy.map((value) => value / analyticSupportedSolidAngleSteradians)
				: null,
		coverageNormalizedProductionSpectrum:
			analyticSupportedSolidAngleSteradians > 0
				? productionSpectralEnergy.map((value) => value / analyticSupportedSolidAngleSteradians)
				: null,
		fallbackPixelCount: pixels.filter((pixel) => pixel.fallbackUsed).length,
		analyticPositiveLegacyZeroPixelCount: pixels.filter(
			(pixel) => pixel.analyticCoverage > 0 && pixel.diskHitCount === 0,
		).length,
		maximumCandidateTransportEvaluationCount: Math.max(
			...pixels.map((pixel) => pixel.candidateTransportEvaluationCount),
		),
		maximumTotalProofTransportEvaluationCount: Math.max(
			...pixels.map((pixel) => pixel.totalProofTransportEvaluationCount),
		),
		maximumAbsoluteCoverageClampResidual: Math.max(...pixels.map((pixel) => Math.abs(pixel.coverageClampResidual))),
		maximumConicConditionNumber: Math.max(...pixels.map((pixel) => pixel.conicOracle.conditionNumber)),
	};
}

/** Return whether the producer summary exactly matches the raw-row recomputation. */
function captureSummaryExactlyMatches(actual, expected) {
	const scalarKeys = [
		'analyticCoverageSum',
		'fineOracleCoverageSum',
		'coarseOracleCoverageSum',
		'legacyGeometricHitFractionSum',
		'analyticSupportedSolidAngleSteradians',
		'oracleSupportedSolidAngleSteradians',
		'fallbackPixelCount',
		'analyticPositiveLegacyZeroPixelCount',
		'maximumCandidateTransportEvaluationCount',
		'maximumTotalProofTransportEvaluationCount',
		'maximumAbsoluteCoverageClampResidual',
		'maximumConicConditionNumber',
	];
	return (
		actual !== null &&
		typeof actual === 'object' &&
		scalarKeys.every((key) => Object.is(actual[key], expected[key])) &&
		arraysExactlyEqual(actual.candidateSpectralEnergy, expected.candidateSpectralEnergy) &&
		arraysExactlyEqual(actual.productionSpectralEnergy, expected.productionSpectralEnergy) &&
		(actual.coverageNormalizedCandidateSpectrum === null
			? expected.coverageNormalizedCandidateSpectrum === null
			: arraysExactlyEqual(
					actual.coverageNormalizedCandidateSpectrum,
					expected.coverageNormalizedCandidateSpectrum,
				)) &&
		(actual.coverageNormalizedProductionSpectrum === null
			? expected.coverageNormalizedProductionSpectrum === null
			: arraysExactlyEqual(
					actual.coverageNormalizedProductionSpectrum,
					expected.coverageNormalizedProductionSpectrum,
				))
	);
}

/** Return one spectrum's total nonnegative evidence magnitude. */
function spectrumMagnitude(values) {
	return Array.isArray(values) && values.every(Number.isFinite)
		? values.reduce((total, value) => total + Math.abs(value), 0)
		: Number.POSITIVE_INFINITY;
}

/** Return the relative spread of one scalar list around its maximum magnitude. */
function relativeSpread(values) {
	if (!Array.isArray(values) || values.length === 0 || !values.every(Number.isFinite)) {
		return Number.POSITIVE_INFINITY;
	}
	const minimum = Math.min(...values);
	const maximum = Math.max(...values);
	return (maximum - minimum) / Math.max(Math.abs(maximum), 1e-30);
}

/** Return one compact gate record. */
function gate(id, passes, observed, required) {
	return {id, passes, observed, required};
}

/** Validate one raw browser row before any scientific arithmetic. */
function validatePixelShape(pixel, expectedLocal, expectedAbsolute, fixture, identity) {
	requireCondition(
		pixel?.local?.x === expectedLocal.x &&
			pixel.local.y === expectedLocal.y &&
			pixel?.pixel?.x === expectedAbsolute.x &&
			pixel.pixel.y === expectedAbsolute.y,
		`${identity} pixel coordinate/order differs from the frozen bottom-left row-major grid.`,
	);
	for (const key of [
		'pathSpectrum',
		'pathSpectrumAfterCandidateReadouts',
		'cacheSpectrum',
		'cacheSpectrumAfterCandidateReadouts',
		'productionCelestialSpectrum',
		'productionPreDisplaySpectrum',
		'candidateCelestialSpectrum',
		'candidatePreDisplaySpectrum',
	]) {
		requireCondition(isFiniteVector(pixel[key], 15), `${identity}/${key} is not one finite Native-15 packet.`);
	}
	for (const key of [
		'productionNormalRgba',
		'candidateNormalRgba',
		'productionDirectY',
		'candidateDirectY',
		'diskHitMask',
		'visibleTransportMask',
	]) {
		requireCondition(isFiniteVector(pixel[key], 4), `${identity}/${key} is not one finite four-value readout.`);
	}
	for (const key of ['unnormalizedRayDirection', 'productionRayDirection', 'oracleRayDirection']) {
		requireCondition(isFiniteVector(pixel[key], 3), `${identity}/${key} is not one finite direction.`);
	}
	for (const key of ['conicValid', 'conicForward', 'fallbackUsed', 'centerBlocked']) {
		requireCondition(typeof pixel[key] === 'boolean', `${identity}/${key} is not a Boolean readout.`);
	}
	requireCondition(
		isFiniteVector(pixel?.conicCoefficients?.linearTerm, 2) &&
			isFiniteVector(pixel?.conicCoefficients?.hessian, 3) &&
			isFiniteVector(pixel.conicCenterPixels, 2),
		`${identity} conic vector packet is malformed.`,
	);
	for (const key of [
		'analyticCoverage',
		'conicMapDeterminant',
		'legacyGeometricHitFraction',
		'legacyVisibleTransportFraction',
		'diskHitCount',
		'visibleTransportCount',
		'candidateTransportEvaluationCount',
		'totalProofTransportEvaluationCount',
		'appliedScale',
		'candidateCompositionResidual',
		'productionCompositionResidual',
		'conicCenterSupport',
		'rawAnalyticCoverage',
		'coverageClampResidual',
		'signedMappedArea',
		'coneTangentSquared',
		'axisAtEllipseCenter',
		'forwardPolygonVertexCount',
		'solidAngleSteradians',
	]) {
		requireCondition(Number.isFinite(pixel[key]), `${identity}/${key} is non-finite.`);
	}
	for (const key of ['constantTerm', 'hessianDeterminant']) {
		requireCondition(
			Number.isFinite(pixel.conicCoefficients[key]),
			`${identity}/conicCoefficients.${key} is non-finite.`,
		);
	}
	for (const key of ['base', 'pixelX', 'pixelY', 'minimumOnPixel', 'maximumOnPixel']) {
		requireCondition(Number.isFinite(pixel.conicAxis?.[key]), `${identity}/conicAxis.${key} is non-finite.`);
	}
	for (const [oracleName, expectedAxis] of [
		['fineOracle', fixture.oracle.fineSubdivisionAxisCount],
		['coarseOracle', fixture.oracle.coarseSubdivisionAxisCount],
	]) {
		const oracle = pixel[oracleName];
		requireCondition(
			oracle?.axisCount === expectedAxis &&
				oracle.sampleCount === expectedAxis * expectedAxis &&
				Number.isInteger(oracle.hitCount) &&
				finiteInRange(oracle.hitCount, 0, oracle.sampleCount) &&
				Number.isFinite(oracle.coverage) &&
				oracle.coverage === oracle.hitCount / oracle.sampleCount &&
				oracle.classification === 'independent-float64-forward-ray-sphere-fixed-subdivision',
			`${identity}/${oracleName} did not execute the exact frozen subdivision authority.`,
		);
	}
	requireCondition(
		pixel.conicOracle?.ellipse !== null &&
			Number.isFinite(pixel.conicOracle?.conditionNumber) &&
			Number.isFinite(pixel.conicOracle?.constantTerm) &&
			Number.isFinite(pixel.conicOracle?.hessianDeterminant) &&
			Number.isFinite(pixel.conicOracle?.coneTangentSquared) &&
			isFiniteVector(pixel.conicOracle?.linearTerm, 2) &&
			isFiniteVector(pixel.conicOracle?.hessian, 3) &&
			['base', 'pixelX', 'pixelY', 'minimumOnPixel', 'maximumOnPixel'].every((key) =>
				Number.isFinite(pixel.conicOracle?.axis?.[key]),
			) &&
			isFiniteVector(pixel.conicOracle?.ellipse?.centerPixels, 2) &&
			isFiniteVector(pixel.conicOracle?.ellipse?.cholesky, 3) &&
			Number.isFinite(pixel.conicOracle?.ellipse?.centerSupport) &&
			Number.isFinite(pixel.conicOracle?.ellipse?.mapDeterminant) &&
			Number.isFinite(pixel.conicOracle?.ellipse?.axisAtEllipseCenter),
		`${identity}/conicOracle is malformed or incomplete.`,
	);
}

/** Validate one exact 5x5 capture identity and its row-major raw ledger. */
function validateCaptureGrid(capture, viewport, phaseOffsetPixels, fixture, identity) {
	const centerPixel = {
		x: Math.floor(viewport.widthPixels / 2),
		y: Math.floor(viewport.heightPixels / 2),
	};
	const expectedTile = {
		x: centerPixel.x - 2,
		y: centerPixel.y - 2,
		width: 5,
		height: 5,
	};
	requireCondition(
		capture?.tile?.x === expectedTile.x &&
			capture.tile.y === expectedTile.y &&
			capture.tile.width === expectedTile.width &&
			capture.tile.height === expectedTile.height &&
			capture.phaseOffsetPixels === phaseOffsetPixels &&
			capture.oracle?.algorithm === fixture.oracle.algorithm &&
			capture.oracle?.viewport?.width === viewport.widthPixels &&
			capture.oracle?.viewport?.height === viewport.heightPixels &&
			capture.oracle?.sourceRadiusMeters === fixture.flat.source.radiusMeters &&
			Array.isArray(capture.pixels) &&
			capture.pixels.length === 25,
		`${identity} capture/tile/oracle identity differs.`,
	);
	requireCondition(
		isFiniteVector(capture.sourceTextureCoordinates, 2) &&
			arraysExactlyEqual(capture.sourceTextureCoordinates, [
				(centerPixel.x + 0.5 + phaseOffsetPixels) / viewport.widthPixels,
				(centerPixel.y + 0.5) / viewport.heightPixels,
			]),
		`${identity} source-center texture coordinate differs.`,
	);
	for (let pixelIndex = 0; pixelIndex < 25; pixelIndex += 1) {
		const local = {x: pixelIndex % 5, y: Math.floor(pixelIndex / 5)};
		validatePixelShape(
			capture.pixels[pixelIndex],
			local,
			{x: expectedTile.x + local.x, y: expectedTile.y + local.y},
			fixture,
			`${identity}/${local.x},${local.y}`,
		);
	}
}

/** Validate the one-pixel anti-source forward-half-space negative control. */
function validateBackwardHalfSpaceControl(control, fixture) {
	const specification = fixture.tile.backwardHalfSpaceControl;
	const viewport = fixture.viewports.find((value) => value.id === specification.viewportId);
	const condition = fixture.flat.qualificationConditions.find((value) => value.id === specification.conditionId);
	const centerPixel = {
		x: Math.floor(viewport.widthPixels / 2),
		y: Math.floor(viewport.heightPixels / 2),
	};
	requireCondition(
		control?.id === specification.id &&
			control.conditionId === specification.conditionId &&
			control.viewportId === specification.viewportId &&
			control.aimPolicy === specification.aimPolicy &&
			control.widthPixels === 1 &&
			control.heightPixels === 1 &&
			arraysExactlyEqual(control.aimTextureCoordinates, [
				(centerPixel.x + 0.5) / viewport.widthPixels,
				(centerPixel.y + 0.5) / viewport.heightPixels,
			]) &&
			control.tile?.x === centerPixel.x &&
			control.tile.y === centerPixel.y &&
			control.tile.width === 1 &&
			control.tile.height === 1 &&
			control.oracle?.algorithm === fixture.oracle.algorithm &&
			control.oracle?.viewport?.width === viewport.widthPixels &&
			control.oracle?.viewport?.height === viewport.heightPixels &&
			arraysExactlyEqual(control.oracle?.rayOriginMeters, fixture.flat.location.observerMeters) &&
			arraysExactlyEqual(control.oracle?.sourceCenterMeters, condition.expectedCenterMeters) &&
			control.oracle?.sourceRadiusMeters === fixture.flat.source.radiusMeters &&
			Array.isArray(control.pixels) &&
			control.pixels.length === 1,
		'Backward-half-space control identity or one-pixel ledger differs.',
	);
	validatePixelShape(control.pixels[0], {x: 0, y: 0}, centerPixel, fixture, EXPECTED_BACKWARD_CONTROL_KEY);
	return control;
}

/** Validate the browser result ledger before interpreting numerical observations. */
function validateBrowserResultShape(result, fixture) {
	requireCondition(result?.error === undefined, `Browser reported an error: ${result?.error?.message ?? 'unknown'}.`);
	requireCondition(
		result.schemaVersion === 'flat-local-analytic-disk-raster-gpu-browser-proof-v1' &&
			result.fixtureId === fixture.id,
		'Browser proof result identity differs.',
	);
	requireCondition(
		result.executionBackend === 'hardware-gpu' &&
			result.separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneUsed === false &&
			result.normalGpuPathDistantCelestialCpuReferenceHelperUsed === true,
		'Browser proof used a forbidden or unknown execution path.',
	);
	requireCondition(result.claimLimits === fixture.claimBoundary, 'Browser proof claim boundary differs.');
	requireCondition(
		result.renderer?.threeRevision === '180' &&
			result.renderer.outputColorSpace === 'srgb' &&
			result.renderer.toneMapping === 0 &&
			typeof result.renderer.unmaskedVendor === 'string' &&
			result.renderer.unmaskedVendor.length > 0 &&
			typeof result.renderer.unmaskedRenderer === 'string' &&
			result.renderer.unmaskedRenderer.length > 0 &&
			Array.isArray(result.webglErrors),
		'Browser renderer contract or hardware identity is incomplete.',
	);
	requireCondition(
		JSON.stringify(result.flatConditions.map((condition) => condition.id)) ===
			JSON.stringify(['flat-medium', 'flat-long']),
		'Browser Flat condition ledger differs.',
	);
	for (const condition of result.flatConditions) {
		const expectedCondition = fixture.flat.qualificationConditions.find((value) => value.id === condition.id);
		requireCondition(
			expectedCondition !== undefined,
			`${condition.id} is not an authored qualification condition.`,
		);
		requireCondition(
			condition.executionBackend === 'gpu' &&
				condition.separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneUsed === false &&
				condition.normalGpuPathCelestialCpuReferenceHelperUsed === false &&
				condition.sourcePathConvergenceUsed === false,
			`${condition.id} used a forbidden execution path.`,
		);
		requireCondition(
			JSON.stringify(condition.viewports.map((viewport) => viewport.id)) ===
				JSON.stringify(['original-wide', 'original-tight']),
			`${condition.id} viewport ledger differs.`,
		);
		for (const viewport of condition.viewports) {
			const expectedViewport = fixture.viewports.find((value) => value.id === viewport.id);
			requireCondition(
				expectedViewport !== undefined &&
					viewport.widthPixels === expectedViewport.widthPixels &&
					viewport.heightPixels === expectedViewport.heightPixels &&
					viewport.verticalFovDegrees === expectedViewport.verticalFovDegrees &&
					viewport.devicePixelRatio === expectedViewport.devicePixelRatio &&
					viewport.drawingBufferSize?.widthPixels === expectedViewport.widthPixels &&
					viewport.drawingBufferSize?.heightPixels === expectedViewport.heightPixels &&
					viewport.tile.width === 5 &&
					viewport.tile.height === 5 &&
					JSON.stringify(viewport.phases.map((capture) => capture.phaseOffsetPixels)) ===
						JSON.stringify([0, 0.25, 0.5, 0.75, 1]),
				`${condition.id}/${viewport.id} phase ledger differs.`,
			);
			for (const capture of viewport.phases) {
				validateCaptureGrid(
					capture,
					expectedViewport,
					capture.phaseOffsetPixels,
					fixture,
					`${condition.id}/${viewport.id}/${capture.phaseOffsetPixels}`,
				);
			}
		}
	}
	const blockers = blockerCaptures(result);
	requireCondition(
		JSON.stringify(blockers.map((entry) => entry.key).sort(compareStrings)) ===
			JSON.stringify([...EXPECTED_BLOCKER_CAPTURE_KEYS].sort(compareStrings)) &&
			blockers.every((entry) => entry.capture.pixels.length === 25),
		'Browser blocker ledger differs.',
	);
	for (const entry of blockers) {
		const expectedControl = fixture.tile.blockerControls.find((value) => value.id === entry.capture.id);
		const expectedViewport = fixture.viewports.find((value) => value.id === entry.capture.viewportId);
		requireCondition(
			expectedControl !== undefined &&
				expectedViewport !== undefined &&
				entry.capture.kind === expectedControl.kind &&
				entry.capture.phaseOffsetPixels === expectedControl.phaseOffsetPixels,
			`${entry.key} blocker identity differs.`,
		);
		validateCaptureGrid(entry.capture, expectedViewport, expectedControl.phaseOffsetPixels, fixture, entry.key);
	}
	const clear = clearCaptures(result);
	requireCondition(
		clear.length === EXPECTED_CLEAR_CAPTURE_KEYS.size &&
			new Set(clear.map((entry) => entry.key)).size === EXPECTED_CLEAR_CAPTURE_KEYS.size &&
			clear.every((entry) => EXPECTED_CLEAR_CAPTURE_KEYS.has(entry.key)),
		'Browser clear-capture ledger differs.',
	);
	const mediumCondition = result.flatConditions.find((condition) => condition.id === 'flat-medium');
	const longCondition = result.flatConditions.find((condition) => condition.id === 'flat-long');
	requireCondition(
		longCondition.backwardHalfSpaceControl === null,
		'Backward-half-space control must occur only in the authored Flat medium runtime.',
	);
	const backwardHalfSpaceControl = validateBackwardHalfSpaceControl(
		mediumCondition.backwardHalfSpaceControl,
		fixture,
	);
	requireCondition(
		result.closeControl?.id === fixture.flat.closeNonRegressionControl.id &&
			Number.isFinite(result.closeControl.analyticCoverage) &&
			isFiniteVector(result.closeControl.legacy, 4) &&
			Number.isFinite(result.closeControl.appliedScale) &&
			isFiniteVector(result.closeControl.productionCelestialSpectrum, 15) &&
			isFiniteVector(result.closeControl.candidateCelestialSpectrum, 15) &&
			result.closeControl.drawingBufferSize?.widthPixels === fixture.viewports[0].widthPixels &&
			result.closeControl.drawingBufferSize?.heightPixels === fixture.viewports[0].heightPixels &&
			arraysExactlyEqual(result.closeControl.centerReadCoordinatePixels, [
				Math.floor(fixture.viewports[0].widthPixels / 2),
				Math.floor(fixture.viewports[0].heightPixels / 2),
			]),
		'Flat-close control is malformed.',
	);
	requireCondition(
		result.distantControl?.id === fixture.distantNonRegressionControl.id &&
			isFiniteVector(result.distantControl.centerFramebufferRgba, 4) &&
			isFiniteVector(result.distantControl.celestialSpectrum, 15) &&
			typeof result.distantControl.flatRasterProofUniformAbsent === 'boolean' &&
			typeof result.distantControl.flatRasterProofSourceAbsent === 'boolean' &&
			typeof result.distantControl.readoutContribution?.id === 'string' &&
			Number.isInteger(result.distantControl.readoutContribution.uniformCount) &&
			Number.isInteger(result.distantControl.readoutContribution.textureCount) &&
			Number.isInteger(result.distantControl.readoutContribution.bindingRequirementCount) &&
			typeof result.distantControl.normalGpuPathCelestialCpuReferenceHelper?.used === 'boolean' &&
			typeof result.distantControl.normalGpuPathCelestialCpuReferenceHelper.classId === 'string' &&
			Number.isInteger(result.distantControl.normalGpuPathCelestialCpuReferenceHelper.scalarCount) &&
			typeof result.distantControl.normalGpuPathCelestialCpuReferenceHelper.purpose === 'string' &&
			typeof result.distantControl.normalGpuPathCelestialCpuReferenceHelper.disclosureBasis === 'string' &&
			result.distantControl.drawingBufferSize?.widthPixels === fixture.viewports[0].widthPixels &&
			result.distantControl.drawingBufferSize?.heightPixels === fixture.viewports[0].heightPixels &&
			arraysExactlyEqual(result.distantControl.centerReadCoordinatePixels, [
				Math.floor(fixture.viewports[0].widthPixels / 2),
				Math.floor(fixture.viewports[0].heightPixels / 2),
			]) &&
			Array.isArray(result.distantControl.bindingValueKeys),
		'Distant non-regression control is malformed.',
	);
	return {clear, blockers, backwardHalfSpaceControl};
}

/** Reject an unusable GPU/program apparatus before any scientific classification. */
function validateOperationalBrowserApparatus(result) {
	requireCondition(
		result.renderer.isWebGL2 === true &&
			result.renderer.softwareRendererDetected === false &&
			result.webglErrors.length === 0,
		'Hardware WebGL2 apparatus is unavailable or reported a GL error.',
	);
	const programOwners = [
		...result.flatConditions.map((condition) => ({
			id: condition.id,
			program: condition.shader?.program,
			setupDurationMilliseconds: condition.setupDurationMilliseconds,
			programPreparationMilliseconds: condition.programPreparationMilliseconds,
		})),
		result.closeControl,
		result.distantControl,
	];
	for (const owner of programOwners) {
		const program = owner.program;
		requireCondition(
			program?.programAvailable === true &&
				program.runnable === true &&
				typeof program.programLog === 'string' &&
				typeof program.vertexShaderLog === 'string' &&
				typeof program.fragmentShaderLog === 'string' &&
				Number.isFinite(owner.setupDurationMilliseconds) &&
				owner.setupDurationMilliseconds >= 0 &&
				Number.isFinite(owner.programPreparationMilliseconds) &&
				owner.programPreparationMilliseconds >= 0,
			`${owner.id} did not provide one linked runnable proof program.`,
		);
	}
}

/** Classify the complete focused proof without tuning any authored value. */
function classifyBrowserResult(result, fixture, sourceFixture) {
	const {clear, blockers, backwardHalfSpaceControl} = validateBrowserResultShape(result, fixture);
	const backwardHalfSpacePixel = backwardHalfSpaceControl.pixels[0];
	validateOperationalBrowserApparatus(result);
	const tolerance = fixture.tolerances;
	const allCaptures = [
		...clear.map((entry) => ({...entry, kind: 'clear'})),
		...blockers.map((entry) => ({...entry, kind: entry.capture.kind})),
	];
	const allPixelEntries = allCaptures.flatMap((entry) =>
		entry.capture.pixels.map((pixel) => ({entry, pixel, id: `${entry.key}|${pixel.local.x}|${pixel.local.y}`})),
	);

	let maximumCoverageOracleResidual = 0;
	let maximumOracleConvergenceResidual = 0;
	let maximumTileCoverageResidual = 0;
	let coverageFailureCount = 0;
	let rawCoverageFailureCount = 0;
	let maximumClampResidual = 0;
	let conicFailureCount = 0;
	let maximumConicNormalizedResidual = 0;
	let maximumConicMapNormalizedResidual = 0;
	let maximumConicConditionNumber = 0;
	let rayFailureCount = 0;
	let maximumRayComponentResidual = 0;
	let maximumRayAngularResidual = 0;
	let transportFailureCount = 0;
	let maximumObservedCandidateTransportEvaluationCount = 0;
	let maximumObservedTotalProofTransportEvaluationCount = 0;
	let fallbackActivationCount = 0;
	let clearFallbackActivationCount = 0;
	let blockedFallbackPixelCount = 0;
	let candidateIdentityFailureCount = 0;
	let compositionFailureCount = 0;
	let readoutStateFailureCount = 0;
	let unchangedPathCacheFailureCount = 0;
	let emptyPixelCount = 0;
	let partialPixelCount = 0;
	let fullClearPixelCount = 0;
	let oracleSampleCount = 0;
	let outerRingFailureCount = 0;
	let summaryRecomputationFailureCount = 0;
	let rowIdentityFailureCount = 0;
	const expectedCacheSpectrum = sourceFixture.source.surfaceRadianceValues.map(Math.fround);
	const recomputedSummaries = new Map();

	for (const entry of allCaptures) {
		const summary = recomputeCaptureSummary(entry.capture);
		recomputedSummaries.set(entry.capture, summary);
		if (!captureSummaryExactlyMatches(entry.capture.summary, summary)) {
			summaryRecomputationFailureCount += 1;
		}
		const tileResidual = Math.abs(summary.analyticCoverageSum - summary.fineOracleCoverageSum);
		maximumTileCoverageResidual = Math.max(maximumTileCoverageResidual, tileResidual);
		if (tileResidual > tolerance.tileCoverageVersusOracleAbsolute) coverageFailureCount += 1;
		if (JSON.stringify(entry.capture.readoutStateBefore) !== JSON.stringify(entry.capture.readoutStateAfter)) {
			readoutStateFailureCount += 1;
		}
		if (
			entry.capture.readoutStateBefore.mode !== 0 ||
			entry.capture.readoutStateBefore.renderToScreen !== true ||
			entry.capture.readoutStateBefore.targetScissorTest !== false ||
			entry.capture.readoutStateBefore.rendererTargetIsNull !== true ||
			entry.capture.readoutStateBefore.rendererTargetIsReadBuffer !== false ||
			entry.capture.readoutStateBefore.rendererTargetIsDiagnosticTarget !== false ||
			typeof entry.capture.readoutStateBefore.readBufferUuid !== 'string' ||
			entry.capture.readoutStateBefore.readBufferUuid.length === 0 ||
			typeof entry.capture.readoutStateBefore.diagnosticTargetUuid !== 'string' ||
			entry.capture.readoutStateBefore.diagnosticTargetUuid.length === 0 ||
			entry.capture.readoutStateBefore.readBufferUuid === entry.capture.readoutStateBefore.diagnosticTargetUuid
		) {
			readoutStateFailureCount += 1;
		}
	}
	const backwardSummary = recomputeCaptureSummary(backwardHalfSpaceControl);
	if (!captureSummaryExactlyMatches(backwardHalfSpaceControl.summary, backwardSummary)) {
		summaryRecomputationFailureCount += 1;
	}
	if (
		JSON.stringify(backwardHalfSpaceControl.readoutStateBefore) !==
			JSON.stringify(backwardHalfSpaceControl.readoutStateAfter) ||
		backwardHalfSpaceControl.readoutStateBefore.mode !== 0 ||
		backwardHalfSpaceControl.readoutStateBefore.renderToScreen !== true ||
		backwardHalfSpaceControl.readoutStateBefore.targetScissorTest !== false ||
		backwardHalfSpaceControl.readoutStateBefore.rendererTargetIsNull !== true ||
		backwardHalfSpaceControl.readoutStateBefore.rendererTargetIsReadBuffer !== false ||
		backwardHalfSpaceControl.readoutStateBefore.rendererTargetIsDiagnosticTarget !== false ||
		typeof backwardHalfSpaceControl.readoutStateBefore.readBufferUuid !== 'string' ||
		backwardHalfSpaceControl.readoutStateBefore.readBufferUuid.length === 0 ||
		typeof backwardHalfSpaceControl.readoutStateBefore.diagnosticTargetUuid !== 'string' ||
		backwardHalfSpaceControl.readoutStateBefore.diagnosticTargetUuid.length === 0 ||
		backwardHalfSpaceControl.readoutStateBefore.readBufferUuid ===
			backwardHalfSpaceControl.readoutStateBefore.diagnosticTargetUuid
	) {
		readoutStateFailureCount += 1;
	}
	const exactRowIds = new Set();
	for (const {entry, pixel, id} of allPixelEntries) {
		if (exactRowIds.has(id)) rowIdentityFailureCount += 1;
		exactRowIds.add(id);
		const expectedX = entry.capture.tile.x + pixel.local.x;
		const expectedY = entry.capture.tile.y + pixel.local.y;
		if (pixel.pixel.x !== expectedX || pixel.pixel.y !== expectedY) rowIdentityFailureCount += 1;
	}
	requireCondition(
		summaryRecomputationFailureCount === 0 &&
			rowIdentityFailureCount === 0 &&
			exactRowIds.size === EXPECTED_EVALUATION_PIXEL_COUNT &&
			readoutStateFailureCount === 0,
		'Browser row ledger, producer summaries, or diagnostic readout state is internally inconsistent.',
	);

	for (const {entry, pixel} of allPixelEntries) {
		maximumObservedCandidateTransportEvaluationCount = Math.max(
			maximumObservedCandidateTransportEvaluationCount,
			pixel.candidateTransportEvaluationCount,
		);
		maximumObservedTotalProofTransportEvaluationCount = Math.max(
			maximumObservedTotalProofTransportEvaluationCount,
			pixel.totalProofTransportEvaluationCount,
		);
		oracleSampleCount += pixel.fineOracle.sampleCount + pixel.coarseOracle.sampleCount;
		const coverageResidual = Math.abs(pixel.analyticCoverage - pixel.fineOracle.coverage);
		const convergenceResidual = Math.abs(pixel.fineOracle.coverage - pixel.coarseOracle.coverage);
		maximumCoverageOracleResidual = Math.max(maximumCoverageOracleResidual, coverageResidual);
		maximumOracleConvergenceResidual = Math.max(maximumOracleConvergenceResidual, convergenceResidual);
		if (
			!finiteInRange(
				pixel.analyticCoverage,
				-tolerance.coverageRangeEpsilon,
				1 + tolerance.coverageRangeEpsilon,
			) ||
			coverageResidual > tolerance.analyticCoverageVersusFineOracleAbsolute ||
			convergenceResidual > tolerance.fineVersusCoarseOracleAbsolute
		) {
			coverageFailureCount += 1;
		}
		maximumClampResidual = Math.max(maximumClampResidual, Math.abs(pixel.coverageClampResidual));
		const rawCoverageFromMappedArea = pixel.signedMappedArea / pixel.conicMapDeterminant;
		if (
			!finiteInRange(
				pixel.rawAnalyticCoverage,
				-tolerance.rawCoverageRangeEpsilon,
				1 + tolerance.rawCoverageRangeEpsilon,
			) ||
			!Number.isFinite(pixel.signedMappedArea) ||
			pixel.signedMappedArea < -tolerance.rawCoverageRangeEpsilon ||
			!Number.isFinite(pixel.conicMapDeterminant) ||
			pixel.conicMapDeterminant <= 0 ||
			!withinMixedTolerance(
				pixel.rawAnalyticCoverage,
				rawCoverageFromMappedArea,
				tolerance.rawCoverageRangeEpsilon,
				0,
			) ||
			Math.abs(pixel.coverageClampResidual) > tolerance.coverageClampResidualAbsolute ||
			Math.abs(pixel.analyticCoverage - (pixel.rawAnalyticCoverage + pixel.coverageClampResidual)) >
				tolerance.coverageRangeEpsilon
		) {
			rawCoverageFailureCount += 1;
		}

		const oracleConic = pixel.conicOracle;
		const actualCoefficientValues = [
			pixel.conicCoefficients.constantTerm,
			...pixel.conicCoefficients.linearTerm,
			...pixel.conicCoefficients.hessian,
		];
		const expectedCoefficientValues = [oracleConic.constantTerm, ...oracleConic.linearTerm, ...oracleConic.hessian];
		let pixelConicPasses =
			pixel.conicValid === true &&
			pixel.conicForward === true &&
			oracleConic.ellipse !== null &&
			Number.isFinite(oracleConic.conditionNumber) &&
			oracleConic.conditionNumber <= tolerance.maximumConicConditionNumber &&
			oracleConic.axis.minimumOnPixel > 0 &&
			pixel.conicAxis.minimumOnPixel > 0;
		maximumConicConditionNumber = Math.max(maximumConicConditionNumber, oracleConic.conditionNumber);
		for (let index = 0; index < actualCoefficientValues.length; index += 1) {
			const actual = actualCoefficientValues[index];
			const expected = expectedCoefficientValues[index];
			const denominator =
				tolerance.conicCoefficientAbsolute + tolerance.conicCoefficientRelative * Math.abs(expected);
			maximumConicNormalizedResidual = Math.max(
				maximumConicNormalizedResidual,
				Math.abs(actual - expected) / denominator,
			);
			pixelConicPasses &&= withinMixedTolerance(
				actual,
				expected,
				tolerance.conicCoefficientAbsolute,
				tolerance.conicCoefficientRelative,
			);
		}
		pixelConicPasses &&= withinMixedTolerance(
			pixel.conicCoefficients.hessianDeterminant,
			oracleConic.hessianDeterminant,
			tolerance.conicDeterminantAbsolute,
			tolerance.conicDeterminantRelative,
		);
		for (const key of ['base', 'pixelX', 'pixelY', 'minimumOnPixel', 'maximumOnPixel']) {
			pixelConicPasses &&= withinMixedTolerance(
				pixel.conicAxis[key],
				oracleConic.axis[key],
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			);
		}
		for (let index = 0; index < 2; index += 1) {
			pixelConicPasses &&= withinMixedTolerance(
				pixel.conicCenterPixels[index],
				oracleConic.ellipse.centerPixels[index],
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			);
		}
		pixelConicPasses &&= withinMixedTolerance(
			pixel.conicCenterSupport,
			oracleConic.ellipse.centerSupport,
			tolerance.conicAxisAbsolute,
			tolerance.conicAxisRelative,
		);
		pixelConicPasses &&= withinMixedTolerance(
			pixel.conicMapDeterminant,
			oracleConic.ellipse.mapDeterminant,
			tolerance.conicDeterminantAbsolute,
			tolerance.conicDeterminantRelative,
		);
		pixelConicPasses &&= withinMixedTolerance(
			pixel.axisAtEllipseCenter,
			oracleConic.ellipse.axisAtEllipseCenter,
			tolerance.conicAxisAbsolute,
			tolerance.conicAxisRelative,
		);
		pixelConicPasses &&=
			Number.isInteger(pixel.forwardPolygonVertexCount) &&
			finiteInRange(pixel.forwardPolygonVertexCount, 0, 6) &&
			(oracleConic.axis.minimumOnPixel > 0 && pixel.conicAxis.minimumOnPixel > 0
				? pixel.forwardPolygonVertexCount === 4
				: true);
		for (const [actual, expected, absolute, relative] of [
			[
				pixel.conicCenterPixels[0],
				oracleConic.ellipse.centerPixels[0],
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			],
			[
				pixel.conicCenterPixels[1],
				oracleConic.ellipse.centerPixels[1],
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			],
			[
				pixel.conicCenterSupport,
				oracleConic.ellipse.centerSupport,
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			],
			[
				pixel.conicMapDeterminant,
				oracleConic.ellipse.mapDeterminant,
				tolerance.conicDeterminantAbsolute,
				tolerance.conicDeterminantRelative,
			],
			[
				pixel.axisAtEllipseCenter,
				oracleConic.ellipse.axisAtEllipseCenter,
				tolerance.conicAxisAbsolute,
				tolerance.conicAxisRelative,
			],
		]) {
			maximumConicMapNormalizedResidual = Math.max(
				maximumConicMapNormalizedResidual,
				Math.abs(actual - expected) / (absolute + relative * Math.abs(expected)),
			);
		}
		pixelConicPasses &&= withinMixedTolerance(
			pixel.coneTangentSquared,
			oracleConic.coneTangentSquared,
			tolerance.conicCoefficientAbsolute,
			tolerance.conicCoefficientRelative,
		);
		if (!pixelConicPasses) conicFailureCount += 1;

		for (const direction of [pixel.unnormalizedRayDirection, pixel.productionRayDirection]) {
			const componentResidual = maximumAbsoluteResidual(direction, pixel.oracleRayDirection);
			const angularResidual = vectorAngle(direction, pixel.oracleRayDirection);
			maximumRayComponentResidual = Math.max(maximumRayComponentResidual, componentResidual);
			maximumRayAngularResidual = Math.max(maximumRayAngularResidual, angularResidual);
			if (
				componentResidual > tolerance.rayDirectionComponentAbsolute ||
				angularResidual > tolerance.rayDirectionAngularRadians
			) {
				rayFailureCount += 1;
			}
		}

		const diskHitCount = pixel.diskHitCount;
		const visibleCount = pixel.visibleTransportCount;
		const hitMaskSum = sum(pixel.diskHitMask);
		const visibleMaskSum = sum(pixel.visibleTransportMask);
		let transportPasses =
			Number.isInteger(diskHitCount) &&
			Number.isInteger(visibleCount) &&
			finiteInRange(diskHitCount, 0, 4) &&
			finiteInRange(visibleCount, 0, 4) &&
			pixel.diskHitMask.every((value) => value === 0 || value === 1) &&
			pixel.visibleTransportMask.every((value) => value === 0 || value === 1) &&
			hitMaskSum === diskHitCount &&
			visibleMaskSum === visibleCount &&
			pixel.visibleTransportMask.every((value, index) => value <= pixel.diskHitMask[index]) &&
			pixel.legacyGeometricHitFraction === diskHitCount * 0.25 &&
			pixel.legacyVisibleTransportFraction === visibleCount * 0.25 &&
			Number.isInteger(pixel.candidateTransportEvaluationCount) &&
			Number.isInteger(pixel.totalProofTransportEvaluationCount) &&
			finiteInRange(pixel.candidateTransportEvaluationCount, 0, 1) &&
			finiteInRange(pixel.totalProofTransportEvaluationCount, 0, 4) &&
			pixel.candidateTransportEvaluationCount <= tolerance.maximumAdditionalCandidateTransportEvaluations &&
			pixel.totalProofTransportEvaluationCount <= tolerance.maximumTotalProofTransportEvaluationsPerPixel;
		if (diskHitCount > 0) {
			const expectedScale = pixel.analyticCoverage / (diskHitCount * 0.25);
			transportPasses &&=
				Math.abs(pixel.appliedScale - expectedScale) <= tolerance.rawCoverageRangeEpsilon * 4 &&
				pixel.fallbackUsed === false &&
				pixel.candidateTransportEvaluationCount === 0 &&
				pixel.totalProofTransportEvaluationCount === visibleCount;
			for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
				if (
					!Object.is(
						pixel.candidateCelestialSpectrum[channelIndex],
						Math.fround(
							Math.fround(pixel.productionCelestialSpectrum[channelIndex]) *
								Math.fround(pixel.appliedScale),
						),
					)
				) {
					candidateIdentityFailureCount += 1;
				}
			}
		} else if (pixel.analyticCoverage > tolerance.emptyCoverageMaximum) {
			if (pixel.centerBlocked) {
				blockedFallbackPixelCount += 1;
				transportPasses &&=
					pixel.fallbackUsed === false &&
					pixel.candidateTransportEvaluationCount === 0 &&
					pixel.totalProofTransportEvaluationCount === 0 &&
					spectrumMagnitude(pixel.candidateCelestialSpectrum) <= tolerance.blockedCelestialAbsolute;
			} else {
				fallbackActivationCount += 1;
				if (entry.kind === 'clear') clearFallbackActivationCount += 1;
				transportPasses &&=
					pixel.fallbackUsed === true &&
					pixel.candidateTransportEvaluationCount === 1 &&
					pixel.totalProofTransportEvaluationCount === 1 &&
					spectrumMagnitude(pixel.candidateCelestialSpectrum) > 0;
			}
		} else {
			transportPasses &&=
				pixel.fallbackUsed === false &&
				pixel.candidateTransportEvaluationCount === 0 &&
				pixel.totalProofTransportEvaluationCount === visibleCount &&
				spectrumMagnitude(pixel.candidateCelestialSpectrum) <= tolerance.blockedCelestialAbsolute;
		}
		if (!transportPasses) transportFailureCount += 1;

		let pixelCompositionPasses =
			Math.abs(pixel.candidateCompositionResidual) <= tolerance.candidateCompositionAbsolute &&
			Math.abs(pixel.productionCompositionResidual) <= tolerance.candidateCompositionAbsolute;
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			pixelCompositionPasses &&=
				Object.is(
					pixel.candidatePreDisplaySpectrum[channelIndex],
					Math.fround(
						Math.fround(pixel.pathSpectrum[channelIndex]) +
							Math.fround(pixel.candidateCelestialSpectrum[channelIndex]),
					),
				) &&
				Object.is(
					pixel.productionPreDisplaySpectrum[channelIndex],
					Math.fround(
						Math.fround(pixel.pathSpectrum[channelIndex]) +
							Math.fround(pixel.productionCelestialSpectrum[channelIndex]),
					),
				);
		}
		if (!pixelCompositionPasses) compositionFailureCount += 1;
		if (
			maximumAbsoluteResidual(pixel.pathSpectrum, pixel.pathSpectrumAfterCandidateReadouts) >
				tolerance.unchangedPathAndCacheAbsolute ||
			maximumAbsoluteResidual(pixel.cacheSpectrum, pixel.cacheSpectrumAfterCandidateReadouts) >
				tolerance.unchangedPathAndCacheAbsolute ||
			maximumAbsoluteResidual(pixel.cacheSpectrum, expectedCacheSpectrum) > 0
		) {
			unchangedPathCacheFailureCount += 1;
		}
		if (pixel.analyticCoverage <= tolerance.emptyCoverageMaximum) emptyPixelCount += 1;
		else if (pixel.analyticCoverage >= tolerance.fullCoverageMinimum) fullClearPixelCount += 1;
		else partialPixelCount += 1;
	}
	const qualificationOracleSampleCount = oracleSampleCount;
	const backwardOracleSampleCount =
		backwardHalfSpacePixel.fineOracle.sampleCount + backwardHalfSpacePixel.coarseOracle.sampleCount;
	oracleSampleCount += backwardOracleSampleCount;
	maximumObservedCandidateTransportEvaluationCount = Math.max(
		maximumObservedCandidateTransportEvaluationCount,
		backwardHalfSpacePixel.candidateTransportEvaluationCount,
	);
	maximumObservedTotalProofTransportEvaluationCount = Math.max(
		maximumObservedTotalProofTransportEvaluationCount,
		backwardHalfSpacePixel.totalProofTransportEvaluationCount,
	);
	const backwardSourceAxis = backwardHalfSpaceControl.oracle.sourceCenterMeters.map(
		(value, index) => value - backwardHalfSpaceControl.oracle.rayOriginMeters[index],
	);
	const backwardOracleSourceAxisDot = normalizedDot(backwardHalfSpacePixel.oracleRayDirection, backwardSourceAxis);
	const backwardProductionSourceAxisDot = normalizedDot(
		backwardHalfSpacePixel.productionRayDirection,
		backwardSourceAxis,
	);
	const backwardPreDisplayMatchesPath = [
		backwardHalfSpacePixel.productionPreDisplaySpectrum,
		backwardHalfSpacePixel.candidatePreDisplaySpectrum,
	].every((spectrum) =>
		spectrum.every((value, channelIndex) =>
			Object.is(value, Math.fround(backwardHalfSpacePixel.pathSpectrum[channelIndex])),
		),
	);
	const backwardHalfSpacePasses =
		backwardHalfSpacePixel.conicValid === true &&
		backwardHalfSpacePixel.conicForward === false &&
		backwardHalfSpacePixel.conicOracle.ellipse !== null &&
		backwardHalfSpacePixel.conicAxis.maximumOnPixel < 0 &&
		backwardHalfSpacePixel.conicOracle.axis.maximumOnPixel < 0 &&
		backwardHalfSpacePixel.forwardPolygonVertexCount === 0 &&
		backwardHalfSpacePixel.rawAnalyticCoverage === 0 &&
		backwardHalfSpacePixel.analyticCoverage === 0 &&
		backwardHalfSpacePixel.signedMappedArea === 0 &&
		backwardHalfSpacePixel.coverageClampResidual === 0 &&
		backwardHalfSpacePixel.fineOracle.coverage === 0 &&
		backwardHalfSpacePixel.fineOracle.hitCount === 0 &&
		backwardHalfSpacePixel.coarseOracle.coverage === 0 &&
		backwardHalfSpacePixel.coarseOracle.hitCount === 0 &&
		backwardHalfSpacePixel.diskHitCount === 0 &&
		backwardHalfSpacePixel.visibleTransportCount === 0 &&
		backwardHalfSpacePixel.diskHitMask.every((value) => value === 0) &&
		backwardHalfSpacePixel.visibleTransportMask.every((value) => value === 0) &&
		backwardHalfSpacePixel.fallbackUsed === false &&
		backwardHalfSpacePixel.centerBlocked === false &&
		backwardHalfSpacePixel.candidateTransportEvaluationCount === 0 &&
		backwardHalfSpacePixel.totalProofTransportEvaluationCount === 0 &&
		backwardHalfSpacePixel.appliedScale === 0 &&
		backwardHalfSpacePixel.productionCelestialSpectrum.every((value) => value === 0) &&
		backwardHalfSpacePixel.candidateCelestialSpectrum.every((value) => value === 0) &&
		arraysExactlyEqual(
			backwardHalfSpacePixel.pathSpectrumAfterCandidateReadouts,
			backwardHalfSpacePixel.pathSpectrum,
		) &&
		arraysExactlyEqual(
			backwardHalfSpacePixel.cacheSpectrumAfterCandidateReadouts,
			backwardHalfSpacePixel.cacheSpectrum,
		) &&
		arraysExactlyEqual(backwardHalfSpacePixel.cacheSpectrum, expectedCacheSpectrum) &&
		backwardHalfSpacePixel.candidateCompositionResidual === 0 &&
		backwardHalfSpacePixel.productionCompositionResidual === 0 &&
		backwardPreDisplayMatchesPath &&
		backwardOracleSourceAxisDot <= tolerance.backwardSourceAxisDotMaximum &&
		backwardProductionSourceAxisDot <= tolerance.backwardSourceAxisDotMaximum &&
		backwardOracleSampleCount === fixture.oracle.backwardHalfSpaceControlClassificationCount;
	requireCondition(
		qualificationOracleSampleCount === fixture.oracle.qualificationClassificationCount &&
			oracleSampleCount === fixture.oracle.classificationCountUpperBound,
		'Browser oracle work total differs from the frozen qualification plus backward-control classifications.',
	);
	for (const entry of clear) {
		for (const pixel of entry.capture.pixels) {
			if (pixel.local.x === 0 || pixel.local.x === 4 || pixel.local.y === 0 || pixel.local.y === 4) {
				if (
					pixel.analyticCoverage > tolerance.emptyCoverageMaximum ||
					pixel.fineOracle.coverage > tolerance.emptyCoverageMaximum
				) {
					outerRingFailureCount += 1;
				}
			}
		}
	}

	let maximumEndpointShiftResidual = 0;
	let maximumOracleEndpointShiftResidual = 0;
	let maximumPhaseCoverageSpread = 0;
	let unmatchedEndpointBoundaryFailureCount = 0;
	for (const condition of result.flatConditions) {
		for (const viewport of condition.viewports) {
			const first = viewport.phases.find((capture) => capture.phaseOffsetPixels === 0);
			const last = viewport.phases.find((capture) => capture.phaseOffsetPixels === 1);
			for (let localY = 0; localY < 5; localY += 1) {
				for (let localX = 1; localX < 5; localX += 1) {
					const shifted = localPixel(last, localX, localY);
					const original = localPixel(first, localX - 1, localY);
					maximumEndpointShiftResidual = Math.max(
						maximumEndpointShiftResidual,
						Math.abs(shifted.analyticCoverage - original.analyticCoverage),
					);
					maximumOracleEndpointShiftResidual = Math.max(
						maximumOracleEndpointShiftResidual,
						Math.abs(shifted.fineOracle.coverage - original.fineOracle.coverage),
					);
				}
				for (const boundaryPixel of [localPixel(first, 4, localY), localPixel(last, 0, localY)]) {
					if (
						boundaryPixel.analyticCoverage > tolerance.emptyCoverageMaximum ||
						boundaryPixel.fineOracle.coverage > tolerance.emptyCoverageMaximum
					) {
						unmatchedEndpointBoundaryFailureCount += 1;
					}
				}
			}
			const coverageSums = viewport.phases.map((capture) => recomputedSummaries.get(capture).analyticCoverageSum);
			maximumPhaseCoverageSpread = Math.max(
				maximumPhaseCoverageSpread,
				Math.max(...coverageSums) - Math.min(...coverageSums),
			);
		}
	}

	let maximumEnergyRelativeSpread = 0;
	let maximumSupportedSolidAngleRelativeResidual = 0;
	let invalidOrNonpositiveEnergyChannelCount = 0;
	let spectralParityFailureCount = 0;
	let maximumNormalizedSpectrumResidual = 0;
	for (const condition of result.flatConditions) {
		const conditionCaptures = clear
			.filter((entry) => entry.condition.id === condition.id)
			.map((entry) => entry.capture);
		for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
			const channelEnergies = conditionCaptures.map(
				(capture) => recomputedSummaries.get(capture).candidateSpectralEnergy[channelIndex],
			);
			invalidOrNonpositiveEnergyChannelCount += channelEnergies.filter(
				(value) => !Number.isFinite(value) || value <= 0,
			).length;
			maximumEnergyRelativeSpread = Math.max(maximumEnergyRelativeSpread, relativeSpread(channelEnergies));
		}
		const reference = recomputedSummaries.get(conditionCaptures[0]).coverageNormalizedCandidateSpectrum;
		for (const capture of conditionCaptures) {
			const summary = recomputedSummaries.get(capture);
			maximumSupportedSolidAngleRelativeResidual = Math.max(
				maximumSupportedSolidAngleRelativeResidual,
				Math.abs(summary.analyticSupportedSolidAngleSteradians - summary.oracleSupportedSolidAngleSteradians) /
					Math.max(Math.abs(summary.oracleSupportedSolidAngleSteradians), 1e-30),
			);
			const spectrum = summary.coverageNormalizedCandidateSpectrum;
			if (!Array.isArray(reference) || !Array.isArray(spectrum)) {
				spectralParityFailureCount += 1;
				continue;
			}
			for (let channelIndex = 0; channelIndex < 15; channelIndex += 1) {
				const residual = Math.abs(spectrum[channelIndex] - reference[channelIndex]);
				maximumNormalizedSpectrumResidual = Math.max(maximumNormalizedSpectrumResidual, residual);
				if (
					!withinMixedTolerance(
						spectrum[channelIndex],
						reference[channelIndex],
						tolerance.coverageNormalizedSpectralAbsolute,
						tolerance.coverageNormalizedSpectralRelative,
					)
				) {
					spectralParityFailureCount += 1;
				}
			}
		}
	}

	const clearBlockerReference = findClearCapture(clear, 'flat-medium', 'original-tight', 0.5).capture;
	const fullBlocker = blockers.find((entry) => entry.capture.id === 'full-blocker').capture;
	const edgeBlocker = blockers.find((entry) => entry.capture.id === 'edge-blocker').capture;
	let fullBlockerFailureCount = 0;
	let edgeBlockerFailureCount = 0;
	let edgeVisibleDropPixelCount = 0;
	let edgeBlockedHitPixelCount = 0;
	let edgeRetainedHitPixelCount = 0;
	let edgeBlockedFallbackPixelCount = 0;
	let edgeRetainedFallbackPixelCount = 0;
	let fullBlockedFallbackPixelCount = 0;
	for (let pixelIndex = 0; pixelIndex < 25; pixelIndex += 1) {
		const rowPixel = clearBlockerReference.pixels[pixelIndex];
		const clearPixel = localPixel(clearBlockerReference, rowPixel.local.x, rowPixel.local.y);
		const fullPixel = fullBlocker.pixels[pixelIndex];
		const edgePixel = edgeBlocker.pixels[pixelIndex];
		const geometricFullPasses =
			fullPixel.diskHitCount === clearPixel.diskHitCount &&
			JSON.stringify(fullPixel.diskHitMask) === JSON.stringify(clearPixel.diskHitMask) &&
			Math.abs(fullPixel.analyticCoverage - clearPixel.analyticCoverage) <= tolerance.coverageRangeEpsilon &&
			(fullPixel.diskHitCount > 0
				? Math.abs(fullPixel.appliedScale - clearPixel.appliedScale) <= tolerance.rawCoverageRangeEpsilon * 4
				: fullPixel.appliedScale === 0);
		if (
			!geometricFullPasses ||
			fullPixel.visibleTransportCount !== 0 ||
			fullPixel.visibleTransportMask.some((value) => value !== 0) ||
			spectrumMagnitude(fullPixel.productionCelestialSpectrum) > tolerance.blockedCelestialAbsolute ||
			spectrumMagnitude(fullPixel.candidateCelestialSpectrum) > tolerance.blockedCelestialAbsolute ||
			(fullPixel.analyticCoverage > tolerance.emptyCoverageMaximum &&
				fullPixel.diskHitCount === 0 &&
				fullPixel.centerBlocked !== true)
		) {
			fullBlockerFailureCount += 1;
		}
		if (
			fullPixel.analyticCoverage > tolerance.emptyCoverageMaximum &&
			fullPixel.diskHitCount === 0 &&
			fullPixel.centerBlocked === true &&
			fullPixel.fallbackUsed === false &&
			fullPixel.candidateTransportEvaluationCount === 0 &&
			fullPixel.totalProofTransportEvaluationCount === 0
		) {
			fullBlockedFallbackPixelCount += 1;
		}
		const geometricEdgePasses =
			edgePixel.diskHitCount === clearPixel.diskHitCount &&
			JSON.stringify(edgePixel.diskHitMask) === JSON.stringify(clearPixel.diskHitMask) &&
			Math.abs(edgePixel.analyticCoverage - clearPixel.analyticCoverage) <= tolerance.coverageRangeEpsilon;
		const expectedScaleMatches =
			edgePixel.diskHitCount > 0 || edgePixel.centerBlocked === false
				? Math.abs(edgePixel.appliedScale - clearPixel.appliedScale) <= tolerance.rawCoverageRangeEpsilon * 4
				: edgePixel.appliedScale === 0;
		if (edgePixel.visibleTransportCount < clearPixel.visibleTransportCount) edgeVisibleDropPixelCount += 1;
		if (edgePixel.visibleTransportCount !== 0 && edgePixel.visibleTransportCount !== edgePixel.diskHitCount) {
			edgeBlockerFailureCount += 1;
		}
		if (edgePixel.analyticCoverage > tolerance.emptyCoverageMaximum && edgePixel.local.x <= 2) {
			if (
				edgePixel.visibleTransportCount === 0 &&
				edgePixel.visibleTransportMask.every((value) => value === 0) &&
				(edgePixel.diskHitCount > 0 || edgePixel.centerBlocked === true) &&
				spectrumMagnitude(edgePixel.productionCelestialSpectrum) <= tolerance.blockedCelestialAbsolute &&
				spectrumMagnitude(edgePixel.candidateCelestialSpectrum) <= tolerance.blockedCelestialAbsolute
			) {
				if (edgePixel.diskHitCount > 0) edgeBlockedHitPixelCount += 1;
				else if (
					edgePixel.fallbackUsed === false &&
					edgePixel.candidateTransportEvaluationCount === 0 &&
					edgePixel.totalProofTransportEvaluationCount === 0 &&
					clearPixel.fallbackUsed === true
				) {
					edgeBlockedFallbackPixelCount += 1;
				}
			} else {
				edgeBlockerFailureCount += 1;
			}
		}
		if (edgePixel.analyticCoverage > tolerance.emptyCoverageMaximum && edgePixel.local.x >= 3) {
			if (
				edgePixel.visibleTransportCount === edgePixel.diskHitCount &&
				edgePixel.centerBlocked === false &&
				arraysExactlyEqual(edgePixel.visibleTransportMask, edgePixel.diskHitMask) &&
				spectraWithinTolerance(
					edgePixel.productionCelestialSpectrum,
					clearPixel.productionCelestialSpectrum,
					tolerance,
				) &&
				spectraWithinTolerance(
					edgePixel.candidateCelestialSpectrum,
					clearPixel.candidateCelestialSpectrum,
					tolerance,
				)
			) {
				if (edgePixel.diskHitCount > 0) edgeRetainedHitPixelCount += 1;
				else if (
					edgePixel.fallbackUsed === true &&
					edgePixel.candidateTransportEvaluationCount === 1 &&
					edgePixel.totalProofTransportEvaluationCount === 1 &&
					clearPixel.fallbackUsed === true
				) {
					edgeRetainedFallbackPixelCount += 1;
				}
			} else {
				edgeBlockerFailureCount += 1;
			}
		}
		if (!geometricEdgePasses || !expectedScaleMatches || edgePixel.visibleTransportCount > edgePixel.diskHitCount) {
			edgeBlockerFailureCount += 1;
		}
	}
	const clearEnergyMagnitude = spectrumMagnitude(
		recomputedSummaries.get(clearBlockerReference).candidateSpectralEnergy,
	);
	const edgeEnergyMagnitude = spectrumMagnitude(recomputedSummaries.get(edgeBlocker).candidateSpectralEnergy);
	const edgeEnergyReduced = edgeEnergyMagnitude > 0 && edgeEnergyMagnitude < clearEnergyMagnitude;

	let sourceFailureCount = 0;
	let cacheIdentityFailureCount = 0;
	let bindingInventoryFailureCount = 0;
	let shaderProgramFailureCount = 0;
	let resourceFailureCount = 0;
	let maximumProgramPreparationMilliseconds = 0;
	let maximumContributionFootprintBytes = 0;
	const contributionHashes = new Set();
	const flatResourceIdentities = new Set();
	const flatSourceDefinitionHashes = new Set();
	const flatDomainIdentities = new Set();
	const flatBindingInventoryHashes = new Set();
	for (const condition of result.flatConditions) {
		const authoredCondition = fixture.flat.qualificationConditions.find((value) => value.id === condition.id);
		const authoredState = sourceFixture.states.find((value) => value.id === authoredCondition.sourceStateId);
		const recomputedCenterResidualMeters = Math.hypot(
			...condition.source.centerMeters.map(
				(value, index) => value - authoredCondition.expectedCenterMeters[index],
			),
		);
		const recomputedRadialMaximumMeters = Math.hypot(
			condition.source.centerMeters[0],
			condition.source.centerMeters[1],
		);
		if (
			!isFiniteVector(condition.source.centerMeters, 3) ||
			!arraysExactlyEqual(condition.source.expectedCenterMeters, authoredCondition.expectedCenterMeters) ||
			!arraysExactlyEqual(condition.source.centerMeters, authoredState.centerMeters) ||
			!Number.isFinite(condition.source.centerResidualMeters) ||
			condition.source.centerResidualMeters !== recomputedCenterResidualMeters ||
			recomputedCenterResidualMeters > tolerance.flatPlacementAbsoluteMeters ||
			condition.source.radiusMeters !== sourceFixture.source.radiusMeters ||
			maximumAbsoluteResidual(condition.source.surfaceRadiance, sourceFixture.source.surfaceRadianceValues) > 0 ||
			condition.pathProfile.id !== fixture.productionProfileId ||
			condition.pathProfile.maximumScatteringOrder !== 4 ||
			condition.pathProfile.viewPathIntervalCount !== 15 ||
			condition.pathProfile.sourcePathIntervalCount !== 20
		) {
			sourceFailureCount += 1;
		}
		const cacheIdentity = condition.cacheIdentity;
		const descriptor = cacheIdentity?.descriptor;
		flatResourceIdentities.add(cacheIdentity?.resourceIdentity);
		flatSourceDefinitionHashes.add(cacheIdentity?.sourceDefinitionHash);
		flatDomainIdentities.add(descriptor?.domainIdentity);
		flatBindingInventoryHashes.add(sha256(Buffer.from(JSON.stringify(condition.bindingValueKeys), 'utf8')));
		if (
			cacheIdentity?.schemaVersion !== 'flat-finite-sun-cache-proof-identity-v1' ||
			cacheIdentity.identityPresent !== true ||
			cacheIdentity.backendMatchesRuntime !== true ||
			cacheIdentity.schedulerMatchesRuntime !== true ||
			cacheIdentity.sourceMatchesConfiguredModel !== true ||
			cacheIdentity.geometryMatchesConfiguredModel !== true ||
			!/^sha256:[a-f0-9]{64}$/u.test(cacheIdentity.resourceIdentity ?? '') ||
			!/^sha256:[a-f0-9]{64}$/u.test(cacheIdentity.sourceDefinitionHash ?? '') ||
			cacheIdentity.sourceId !== fixture.flat.source.sourceId ||
			cacheIdentity.profileId !== fixture.productionProfileId ||
			cacheIdentity.sourceRadiusMeters !== sourceFixture.source.radiusMeters ||
			cacheIdentity.sourceDistanceMeters !== condition.source.distanceMeters ||
			!Number.isFinite(cacheIdentity.configuredCacheRadialMaximumMeters) ||
			!Number.isFinite(cacheIdentity.derivedHorizontalCenterRadiusMeters) ||
			Math.abs(cacheIdentity.configuredCacheRadialMaximumMeters - recomputedRadialMaximumMeters) > 0.000001 ||
			Math.abs(cacheIdentity.derivedHorizontalCenterRadiusMeters - recomputedRadialMaximumMeters) > 0.000001 ||
			Math.abs(cacheIdentity.configuredCacheRadialMaximumMeters - authoredState.cacheRadialMaximumMeters) >
				0.000001 ||
			descriptor?.sourceId !== fixture.flat.source.sourceId ||
			!/^sha256:[a-f0-9]{64}$/u.test(descriptor?.domainIdentity ?? '') ||
			descriptor?.storage?.format !== 'R32F' ||
			descriptor?.storage?.width !== 1 ||
			descriptor?.storage?.height !== 1 ||
			descriptor?.storage?.layers !== 15 ||
			descriptor?.channelCount !== 15 ||
			descriptor?.quantity !== 'spectral-radiance-density' ||
			descriptor?.units !== 'W m^-2 sr^-1 nm^-1' ||
			descriptor?.valueKey !== 'cache.celestial.localSunRadiance'
		) {
			cacheIdentityFailureCount += 1;
		}
		if (!arraysExactlyEqual(condition.bindingValueKeys, EXPECTED_FLAT_BINDING_VALUE_KEYS)) {
			bindingInventoryFailureCount += 1;
		}
		const program = condition.shader.program;
		maximumProgramPreparationMilliseconds = Math.max(
			maximumProgramPreparationMilliseconds,
			condition.programPreparationMilliseconds,
		);
		if (
			!Number.isFinite(condition.setupDurationMilliseconds) ||
			condition.setupDurationMilliseconds < 0 ||
			!Number.isFinite(condition.programPreparationMilliseconds) ||
			condition.programPreparationMilliseconds < 0 ||
			program.programAvailable !== true ||
			program.runnable !== true ||
			typeof program.programLog !== 'string' ||
			typeof program.vertexShaderLog !== 'string' ||
			typeof program.fragmentShaderLog !== 'string' ||
			condition.programPreparationMilliseconds > tolerance.maximumProgramPreparationMilliseconds ||
			condition.shader.containsProofContribution !== true ||
			condition.shader.unnormalizedRay.present !== true ||
			condition.shader.unnormalizedRay.containsNormalize !== false ||
			condition.shader.unnormalizedRay.containsHomogeneousDivide !== false ||
			condition.shader.unnormalizedRay.usesInverseProjectionXyz !== true ||
			condition.shader.unnormalizedRay.usesInverseViewDirectionWZero !== true ||
			condition.shader.unnormalizedRay.usesGeometryFrame !== true
		) {
			shaderProgramFailureCount += 1;
		}
		const contribution = condition.contribution;
		maximumContributionFootprintBytes = Math.max(
			maximumContributionFootprintBytes,
			contribution.assembledContributionFootprintBytes,
		);
		contributionHashes.add(sha256(Buffer.from(JSON.stringify(contribution), 'utf8')));
		const proofPass = condition.composerPasses.find((pass) => pass.hasProofUniform);
		const exactComposerPasses =
			JSON.stringify(
				condition.composerPasses.map((pass) => ({
					constructorName: pass.constructorName,
					needsSwap: pass.needsSwap,
					renderToScreen: pass.renderToScreen,
					hasProofUniform: pass.hasProofUniform,
				})),
			) ===
			JSON.stringify([
				{constructorName: 'RenderPass', needsSwap: false, renderToScreen: false, hasProofUniform: false},
				{
					constructorName: 'SceneInputCapture',
					needsSwap: false,
					renderToScreen: false,
					hasProofUniform: false,
				},
				{
					constructorName: 'ShaderRuntimePass',
					needsSwap: false,
					renderToScreen: true,
					hasProofUniform: true,
				},
			]);
		const expectedSourceBlocks = [
			{
				kind: 'function',
				id: 'proof-flat-local-analytic-disk-raster-functions',
				slot: 'diagnosticOutput',
				order: 10,
			},
			{
				kind: 'main-hook',
				id: 'proof-flat-local-analytic-disk-raster-main',
				slot: 'diagnosticOutput',
				order: 10,
			},
		];
		const expectedUniformSource = 'uniform int uFlatLocalAnalyticRasterMode;';
		const expectedFootprintBytes =
			contribution.sourceBlocks.reduce((total, block) => total + block.bytes, 0) +
			contribution.uniformDeclarations.reduce((total, uniform) => total + uniform.bytes, 0) +
			5;
		if (
			contribution.id !== 'proof-flat-local-analytic-disk-raster' ||
			contribution.owner !== 'color' ||
			!arraysExactlyEqual(contribution.requires, EXPECTED_PROOF_REQUIRES) ||
			contribution.uniformCount !== 1 ||
			contribution.textureCount !== 0 ||
			contribution.bindingRequirementCount !== 0 ||
			contribution.sourceBlocks.length !== 2 ||
			contribution.sourceBlocks.some(
				(block, index) =>
					block.kind !== expectedSourceBlocks[index].kind ||
					block.id !== expectedSourceBlocks[index].id ||
					block.slot !== expectedSourceBlocks[index].slot ||
					block.order !== expectedSourceBlocks[index].order ||
					!Number.isInteger(block.bytes) ||
					block.bytes <= 0 ||
					block.occurrenceCount !== 1 ||
					!/^[a-f0-9]{64}$/u.test(block.sha256),
			) ||
			contribution.uniformDeclarations.length !== 1 ||
			contribution.uniformDeclarations[0].name !== 'uFlatLocalAnalyticRasterMode' ||
			contribution.uniformDeclarations[0].type !== 'int' ||
			contribution.uniformDeclarations[0].valueKey !== 'proof.flatLocalAnalyticRasterMode' ||
			contribution.uniformDeclarations[0].bytes !== Buffer.byteLength(expectedUniformSource, 'utf8') ||
			contribution.uniformDeclarations[0].sha256 !== sha256(Buffer.from(expectedUniformSource, 'utf8')) ||
			contribution.uniformDeclarations[0].occurrenceCount !== 1 ||
			contribution.authoredSourceLengthBytes !==
				contribution.sourceBlocks.reduce((total, block) => total + block.bytes, 0) ||
			contribution.assemblySeparatorBytes !== 5 ||
			contribution.assemblyFootprintModel !==
				'exact-utf8-blocks-plus-uniform-declaration-plus-runtime-assembler-join-separators' ||
			contribution.assembledContributionFootprintBytes !== expectedFootprintBytes ||
			!Number.isFinite(contribution.assembledContributionFootprintBytes) ||
			contribution.assembledContributionFootprintBytes > tolerance.maximumShaderSourceGrowthBytes ||
			contribution.diagnostics.proofId !== PROOF_ID ||
			contribution.diagnostics.coverage !== 'exact-affine-screen-conic-circle-convex-quad-overlap' ||
			contribution.diagnostics.quarterRayReuse !== true ||
			contribution.diagnostics.maximumAdditionalTransportEvaluations !== 1 ||
			contribution.diagnostics.declaresGpuResources !== false ||
			contribution.diagnostics.fallbackTransportRay !== 'finite-source-center' ||
			contribution.diagnostics.fallbackVisibilitySample !== 'current-output-pixel-center-scene-hit' ||
			!exactComposerPasses ||
			proofPass === undefined ||
			proofPass.index !== condition.composerPasses.length - 1 ||
			proofPass.needsSwap !== false ||
			proofPass.renderToScreen !== true ||
			condition.composerPasses.some((pass) => pass.needsSwap !== false)
		) {
			resourceFailureCount += 1;
		}
	}
	for (const control of [result.closeControl, result.distantControl]) {
		maximumProgramPreparationMilliseconds = Math.max(
			maximumProgramPreparationMilliseconds,
			control.programPreparationMilliseconds,
		);
		if (control.programPreparationMilliseconds > tolerance.maximumProgramPreparationMilliseconds) {
			shaderProgramFailureCount += 1;
		}
	}

	const close = result.closeControl;
	const closeExpectedCandidateSpectrum = close.productionCelestialSpectrum.map((value) =>
		Math.fround(Math.fround(value) * Math.fround(close.appliedScale)),
	);
	const closeSpectrumPasses = close.candidateCelestialSpectrum.every((value, index) =>
		Object.is(value, closeExpectedCandidateSpectrum[index]),
	);
	const closePasses =
		close.id === 'flat-close-control' &&
		close.analyticCoverage >= tolerance.fullCoverageMinimum &&
		arraysExactlyEqual(close.legacy, [1, 1, 4, 4]) &&
		Object.is(close.appliedScale, close.analyticCoverage) &&
		close.legacy[2] === 4 &&
		close.legacy[3] === 4 &&
		closeSpectrumPasses &&
		spectrumMagnitude(close.productionCelestialSpectrum) > 0;
	const distant = result.distantControl;
	const distantDescriptor = distant.cacheIdentity?.descriptor;
	const distantPasses =
		distant.id === 'distant-sun-control' &&
		distant.flatRasterProofUniformAbsent === true &&
		distant.flatRasterProofSourceAbsent === true &&
		Array.isArray(distant.centerFramebufferRgba) &&
		distant.centerFramebufferRgba.length === 4 &&
		distant.centerFramebufferRgba.every((value) => Number.isInteger(value) && finiteInRange(value, 0, 255)) &&
		distant.centerFramebufferRgba[3] === 255 &&
		distant.centerFramebufferRgba.slice(0, 3).some((value) => value > 0) &&
		distant.celestialSpectrum.every((value) => value >= 0) &&
		distant.celestialSpectrum.some((value) => value > 0) &&
		distant.readoutContribution?.id === 'proof-distant-sun-celestial-readout' &&
		distant.readoutContribution.uniformCount === 1 &&
		distant.readoutContribution.textureCount === 0 &&
		distant.readoutContribution.bindingRequirementCount === 0 &&
		distant.normalGpuPathCelestialCpuReferenceHelper?.used === true &&
		distant.normalGpuPathCelestialCpuReferenceHelper.classId === 'DistantSunCelestialCpuCache' &&
		distant.normalGpuPathCelestialCpuReferenceHelper.scalarCount === 2145 &&
		distant.normalGpuPathCelestialCpuReferenceHelper.purpose === 'support-mask-and-logical-field-construction' &&
		distant.normalGpuPathCelestialCpuReferenceHelper.disclosureBasis ===
			'sealed-normal-gpu-builder-contract-and-runtime-descriptor' &&
		arraysExactlyEqual(distant.bindingValueKeys, EXPECTED_DISTANT_BINDING_VALUE_KEYS) &&
		distant.cacheIdentity?.schemaVersion === 'distant-sun-cache-proof-identity-v1' &&
		distant.cacheIdentity.identityPresent === true &&
		/^sha256:[a-f0-9]{64}$/u.test(distant.cacheIdentity.resourceIdentity ?? '') &&
		distant.cacheIdentity.sourceId === 'distant-sun' &&
		distantDescriptor?.id === 'algorithm32-distant-sun-celestial-cache-v1' &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.contentHash ?? '') &&
		distantDescriptor?.valueKey === 'cache.celestial.sunTransport' &&
		distantDescriptor?.storage?.format === 'R32F' &&
		distantDescriptor?.storage?.width === 11 &&
		distantDescriptor?.storage?.height === 13 &&
		distantDescriptor?.storage?.layers === 15 &&
		distantDescriptor?.logicalField?.id === 'algorithm32-distant-sun-celestial-transport-v1' &&
		distantDescriptor?.logicalField?.sourceId === 'distant-sun' &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.logicalField?.sourceDefinitionHash ?? '') &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.logicalField?.domainIdentity ?? '') &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.logicalField?.atmosphereTransportIdentity ?? '') &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.logicalField?.numericalIdentity ?? '') &&
		distantDescriptor?.logicalField?.shape?.directionCount === 11 &&
		distantDescriptor?.logicalField?.shape?.receiverCount === 13 &&
		distantDescriptor?.logicalField?.shape?.channelCount === 15 &&
		distantDescriptor?.logicalField?.quantity === 'spectral-radiance-density' &&
		distantDescriptor?.logicalField?.units === 'W m^-2 sr^-1 nm^-1' &&
		/^sha256:[a-f0-9]{64}$/u.test(distantDescriptor?.logicalField?.contentHash ?? '');

	const gateRecords = [
		gate(
			'hardware-webgl2',
			result.renderer.isWebGL2 === true &&
				result.renderer.softwareRendererDetected === false &&
				typeof result.renderer.unmaskedVendor === 'string' &&
				result.renderer.unmaskedVendor.length > 0 &&
				typeof result.renderer.unmaskedRenderer === 'string' &&
				result.renderer.unmaskedRenderer.length > 0 &&
				result.webglErrors.length === 0,
			{renderer: result.renderer, webglErrors: result.webglErrors},
			{isWebGL2: true, softwareRendererDetected: false, webglErrors: []},
		),
		gate(
			'shader-compile-link',
			shaderProgramFailureCount === 0,
			{failureCount: shaderProgramFailureCount, maximumProgramPreparationMilliseconds},
			{failureCount: 0, maximumProgramPreparationMilliseconds: tolerance.maximumProgramPreparationMilliseconds},
		),
		gate(
			'exact-conic-versus-independent-subdivision',
			coverageFailureCount === 0 && summaryRecomputationFailureCount === 0,
			{
				failureCount: coverageFailureCount,
				maximumCoverageOracleResidual,
				maximumOracleConvergenceResidual,
				maximumTileCoverageResidual,
				summaryRecomputationFailureCount,
			},
			{
				pixelAbsolute: tolerance.analyticCoverageVersusFineOracleAbsolute,
				oracleConvergenceAbsolute: tolerance.fineVersusCoarseOracleAbsolute,
				tileAbsolute: tolerance.tileCoverageVersusOracleAbsolute,
			},
		),
		gate(
			'stable-conic-coefficients-and-forward-half-space',
			conicFailureCount === 0 && backwardHalfSpacePasses,
			{
				failureCount: conicFailureCount,
				maximumConicNormalizedResidual,
				maximumConicMapNormalizedResidual,
				maximumConicConditionNumber,
				backwardHalfSpace: {
					passes: backwardHalfSpacePasses,
					conicValid: backwardHalfSpacePixel.conicValid,
					conicForward: backwardHalfSpacePixel.conicForward,
					gpuAxisMaximumOnPixel: backwardHalfSpacePixel.conicAxis.maximumOnPixel,
					oracleAxisMaximumOnPixel: backwardHalfSpacePixel.conicOracle.axis.maximumOnPixel,
					forwardPolygonVertexCount: backwardHalfSpacePixel.forwardPolygonVertexCount,
					analyticCoverage: backwardHalfSpacePixel.analyticCoverage,
					fineOracleCoverage: backwardHalfSpacePixel.fineOracle.coverage,
					coarseOracleCoverage: backwardHalfSpacePixel.coarseOracle.coverage,
					oracleSourceAxisDot: backwardOracleSourceAxisDot,
					productionSourceAxisDot: backwardProductionSourceAxisDot,
					oracleClassificationCount: backwardOracleSampleCount,
				},
			},
			{
				failureCount: 0,
				maximumConditionNumber: tolerance.maximumConicConditionNumber,
				forwardAxisPositiveForQualificationRows: true,
				backwardControl: {
					conicValid: true,
					conicForward: false,
					axisMaximumOnPixel: 'negative',
					forwardPolygonVertexCount: 0,
					coverageAndTransport: 0,
					sourceAxisDotMaximum: tolerance.backwardSourceAxisDotMaximum,
				},
			},
		),
		gate(
			'affine-oracle-and-production-ray-direction-parity',
			rayFailureCount === 0,
			{failureCount: rayFailureCount, maximumRayComponentResidual, maximumRayAngularResidual},
			{
				componentAbsolute: tolerance.rayDirectionComponentAbsolute,
				angularRadians: tolerance.rayDirectionAngularRadians,
			},
		),
		gate(
			'raw-coverage-and-clamp-observability',
			rawCoverageFailureCount === 0,
			{failureCount: rawCoverageFailureCount, maximumClampResidual},
			{failureCount: 0, maximumClampResidual: tolerance.coverageClampResidualAbsolute},
		),
		gate(
			'bounded-five-by-five-tile',
			allPixelEntries.length === EXPECTED_EVALUATION_PIXEL_COUNT &&
				exactRowIds.size === EXPECTED_EVALUATION_PIXEL_COUNT &&
				rowIdentityFailureCount === 0 &&
				summaryRecomputationFailureCount === 0 &&
				qualificationOracleSampleCount === fixture.oracle.qualificationClassificationCount &&
				outerRingFailureCount === 0,
			{
				clearPixelCount: EXPECTED_CLEAR_PIXEL_COUNT,
				blockerPixelCount: EXPECTED_BLOCKER_PIXEL_COUNT,
				total: allPixelEntries.length,
				uniqueRowCount: exactRowIds.size,
				rowIdentityFailureCount,
				summaryRecomputationFailureCount,
				qualificationOracleSampleCount,
				backwardControlPixelCount: EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT,
				totalEvidencePixelCount: EXPECTED_TOTAL_EVIDENCE_PIXEL_COUNT,
				oracleSampleCount,
				outerRingFailureCount,
			},
			{
				qualificationTileRows: EXPECTED_EVALUATION_PIXEL_COUNT,
				backwardControlRows: EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT,
				qualificationOracleSampleCount: fixture.oracle.qualificationClassificationCount,
				totalOracleSampleCount: fixture.oracle.classificationCountUpperBound,
				outerRingEmpty: true,
				cpuFullFrame: false,
			},
		),
		gate(
			'phase-continuity-and-one-pixel-shift',
			maximumEndpointShiftResidual <= tolerance.phaseEndpointShiftCoverageAbsolute &&
				maximumOracleEndpointShiftResidual <= tolerance.phaseEndpointShiftCoverageAbsolute &&
				maximumPhaseCoverageSpread <= tolerance.tileCoverageVersusOracleAbsolute &&
				unmatchedEndpointBoundaryFailureCount === 0 &&
				summaryRecomputationFailureCount === 0,
			{
				maximumEndpointShiftResidual,
				maximumOracleEndpointShiftResidual,
				maximumPhaseCoverageSpread,
				unmatchedEndpointBoundaryFailureCount,
			},
			{
				maximumEndpointShiftResidual: tolerance.phaseEndpointShiftCoverageAbsolute,
				maximumPhaseCoverageSpread: tolerance.tileCoverageVersusOracleAbsolute,
			},
		),
		gate(
			'tile-solid-angle-energy',
			maximumEnergyRelativeSpread <= tolerance.phaseTileSolidAngleEnergyRelative &&
				maximumSupportedSolidAngleRelativeResidual <= tolerance.phaseTileSolidAngleEnergyRelative &&
				invalidOrNonpositiveEnergyChannelCount === 0 &&
				summaryRecomputationFailureCount === 0,
			{
				maximumEnergyRelativeSpread,
				maximumSupportedSolidAngleRelativeResidual,
				invalidOrNonpositiveEnergyChannelCount,
				summaryRecomputationFailureCount,
			},
			{maximumRelativeResidual: tolerance.phaseTileSolidAngleEnergyRelative},
		),
		gate(
			'coverage-normalized-spectral-parity',
			spectralParityFailureCount === 0 &&
				candidateIdentityFailureCount === 0 &&
				summaryRecomputationFailureCount === 0,
			{
				failureCount: spectralParityFailureCount,
				candidateIdentityFailureCount,
				summaryRecomputationFailureCount,
				maximumAbsoluteResidual: maximumNormalizedSpectrumResidual,
			},
			{
				failureCount: 0,
				absolute: tolerance.coverageNormalizedSpectralAbsolute,
				relative: tolerance.coverageNormalizedSpectralRelative,
			},
		),
		gate(
			'empty-and-full-coverage',
			emptyPixelCount > 0 && partialPixelCount > 0 && closePasses,
			{emptyPixelCount, partialPixelCount, fullClearPixelCount, closeCoverage: close.analyticCoverage},
			{
				emptyPixelCountMinimum: 1,
				partialPixelCountMinimum: 1,
				closeCoverageMinimum: tolerance.fullCoverageMinimum,
			},
		),
		gate(
			'full-blocker-suppression',
			fullBlockerFailureCount === 0 &&
				fullBlockedFallbackPixelCount > 0 &&
				fullBlocker.pixels.some((pixel) => pixel.analyticCoverage > 0),
			{failureCount: fullBlockerFailureCount, fullBlockedFallbackPixelCount},
			{failureCount: 0, positiveAnalyticCoverageRetained: true, celestialAbsolute: 0},
		),
		gate(
			'edge-blocker-geometric-denominator',
			edgeBlockerFailureCount === 0 &&
				edgeVisibleDropPixelCount > 0 &&
				edgeBlockedHitPixelCount > 0 &&
				edgeRetainedHitPixelCount > 0 &&
				edgeBlockedFallbackPixelCount > 0 &&
				edgeRetainedFallbackPixelCount > 0 &&
				edgeEnergyReduced,
			{
				failureCount: edgeBlockerFailureCount,
				edgeVisibleDropPixelCount,
				edgeBlockedHitPixelCount,
				edgeRetainedHitPixelCount,
				edgeBlockedFallbackPixelCount,
				edgeRetainedFallbackPixelCount,
				clearEnergyMagnitude,
				edgeEnergyMagnitude,
			},
			{
				failureCount: 0,
				blockedHitPixelCountMinimum: 1,
				retainedHitPixelCountMinimum: 1,
				blockedFallbackPixelCountMinimum: 1,
				retainedFallbackPixelCountMinimum: 1,
				positiveReducedEnergy: true,
			},
		),
		gate(
			'fallback-activation-and-bounded-transport',
			transportFailureCount === 0 &&
				maximumObservedCandidateTransportEvaluationCount <=
					tolerance.maximumAdditionalCandidateTransportEvaluations &&
				maximumObservedTotalProofTransportEvaluationCount <=
					tolerance.maximumTotalProofTransportEvaluationsPerPixel &&
				fallbackActivationCount > 0 &&
				clearFallbackActivationCount > 0 &&
				blockedFallbackPixelCount > 0 &&
				fullBlockedFallbackPixelCount > 0 &&
				edgeBlockedFallbackPixelCount > 0 &&
				edgeRetainedFallbackPixelCount > 0,
			{
				failureCount: transportFailureCount,
				fallbackActivationCount,
				clearFallbackActivationCount,
				blockedFallbackPixelCount,
				fullBlockedFallbackPixelCount,
				edgeBlockedFallbackPixelCount,
				edgeRetainedFallbackPixelCount,
				maximumObservedCandidateTransportEvaluationCount,
				maximumObservedTotalProofTransportEvaluationCount,
			},
			{
				failureCount: 0,
				fallbackActivationCountMinimum: 1,
				candidateAdditionalMaximum: 1,
				totalDuplicatedProofMaximum: 4,
				fallbackVisibilitySample: 'current-output-pixel-center-scene-hit',
			},
		),
		gate(
			'exact-diagnostic-readout-state-restoration',
			readoutStateFailureCount === 0,
			{failureCount: readoutStateFailureCount},
			{
				failureCount: 0,
				exactBeforeAfter: true,
				initialMode: 0,
				rendererTargetRestored: true,
				readBufferAndDiagnosticTargetIdentityRetained: true,
			},
		),
		gate(
			'unchanged-cache-source-and-path',
			unchangedPathCacheFailureCount === 0 &&
				sourceFailureCount === 0 &&
				cacheIdentityFailureCount === 0 &&
				bindingInventoryFailureCount === 0 &&
				flatResourceIdentities.size === 1 &&
				flatSourceDefinitionHashes.size === 1 &&
				flatDomainIdentities.size === 1 &&
				flatBindingInventoryHashes.size === 1,
			{
				pathCacheFailureCount: unchangedPathCacheFailureCount,
				sourceFailureCount,
				cacheIdentityFailureCount,
				bindingInventoryFailureCount,
				uniqueResourceIdentityCount: flatResourceIdentities.size,
				uniqueSourceDefinitionHashCount: flatSourceDefinitionHashes.size,
				uniqueDomainIdentityCount: flatDomainIdentities.size,
				uniqueBindingInventoryCount: flatBindingInventoryHashes.size,
			},
			{failureCount: 0, cacheSpectrum: 'exact-authored-binary32', sourceSpectrum: 'exact-authored-binary64'},
		),
		gate(
			'single-pre-display-composition',
			compositionFailureCount === 0,
			{failureCount: compositionFailureCount},
			{failureCount: 0, absolute: tolerance.candidateCompositionAbsolute},
		),
		gate(
			'no-new-gpu-resource-or-binding',
			resourceFailureCount === 0 && contributionHashes.size === 1,
			{
				failureCount: resourceFailureCount,
				uniqueContributionHashCount: contributionHashes.size,
				maximumContributionFootprintBytes,
			},
			{
				textureCount: 0,
				bindingRequirementCount: 0,
				maximumContributionFootprintBytes: tolerance.maximumShaderSourceGrowthBytes,
			},
		),
		gate(
			'flat-close-non-regression',
			closePasses,
			{
				analyticCoverage: close.analyticCoverage,
				legacy: close.legacy,
				appliedScale: close.appliedScale,
				productionCelestialMagnitude: spectrumMagnitude(close.productionCelestialSpectrum),
				spectrumPasses: closeSpectrumPasses,
			},
			{
				analyticCoverageMinimum: tolerance.fullCoverageMinimum,
				legacy: [1, 1, 4, 4],
				appliedScaleMatchesAnalyticCoverage: true,
				positiveProduction: true,
				candidateMatchesScaledProduction: true,
			},
		),
		gate(
			'distant-family-non-regression',
			distantPasses,
			{
				flatRasterProofUniformAbsent: distant.flatRasterProofUniformAbsent,
				flatRasterProofSourceAbsent: distant.flatRasterProofSourceAbsent,
				framebuffer: distant.centerFramebufferRgba,
				drawingBufferSize: distant.drawingBufferSize,
				centerReadCoordinatePixels: distant.centerReadCoordinatePixels,
				celestialSpectrumMagnitude: spectrumMagnitude(distant.celestialSpectrum),
				readoutContribution: distant.readoutContribution,
				normalGpuPathCelestialCpuReferenceHelper: distant.normalGpuPathCelestialCpuReferenceHelper,
			},
			{
				flatRasterProofUniformAbsent: true,
				flatRasterProofSourceAbsent: true,
				exactViewportAndReadCoordinate: true,
				positiveLiveCelestialSpectrum: true,
				resourceFreeReadout: true,
			},
		),
	];
	requireCondition(
		JSON.stringify(gateRecords.map((record) => record.id)) === JSON.stringify(fixture.requiredGates),
		'Classifier gate order differs from the frozen fixture inventory.',
	);
	return {
		schemaVersion: 1,
		proofId: PROOF_ID,
		gates: gateRecords,
		accepted: gateRecords.every((record) => record.passes === true),
		observations: {
			qualificationEvaluationPixelCount: allPixelEntries.length,
			backwardControlPixelCount: EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT,
			evaluationPixelCount: EXPECTED_TOTAL_EVIDENCE_PIXEL_COUNT,
			qualificationUniqueRowCount: exactRowIds.size,
			uniqueRowCount: exactRowIds.size + EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT,
			clearCaptureCount: clear.length,
			blockerCaptureCount: blockers.length,
			oracleClassificationCount: oracleSampleCount,
			oracleClassificationCountUpperBound: fixture.oracle.classificationCountUpperBound,
			maximumObservedCandidateTransportEvaluationCount,
			maximumObservedTotalProofTransportEvaluationCount,
			candidateAdditionalTransportMeaning: 'new evaluations added after unchanged production control',
			totalProofTransportMeaning: 'unchanged production visible evaluations plus candidate fallback evaluation',
			normalGpuPathDistantCelestialCpuReferenceHelper: distant.normalGpuPathCelestialCpuReferenceHelper,
		},
	};
}

/** Return the serializable protected-input packet persisted before and after execution. */
function protectedEvidence(value) {
	return {
		snapshotManifestSha256: value.snapshot.manifestSha256,
		snapshotInventory: value.snapshot.inventory,
		productionSource: value.production,
		executedControls: value.controls,
		threeRuntime: value.three,
		nodeExecutableClosure: value.nodeExecutableClosure,
		protectedRoots: value.protectedRoots,
		nodeExecutable: value.nodeExecutable,
		chromeExecutable: value.chromeExecutable,
	};
}

/** Persist the complete bounded browser execution before interpreting its science. */
async function persistBrowserExecution(run, execution) {
	await run.writeJsonArtifact('browser/result-receipt.json', execution.receipt);
	await run.writeJsonArtifact('browser/raw-result.json', execution.value);
	await run.writeJsonArtifact('browser/progress.json', execution.progressSummary);
	await run.writeJsonArtifact('browser/served-files.json', execution.servedFiles);
	await run.writeJsonArtifact('browser/process.json', {
		startedAt: execution.startedAt,
		completedAt: execution.completedAt,
		wallDurationMilliseconds: execution.wallDurationMilliseconds,
		pid: execution.pid,
		launchedAt: execution.launchedAt,
		exit: execution.exit,
		serverClose: execution.serverClose,
		profileRemoved: execution.profileRemoved,
		profileRetained: execution.profileRetained,
		browserStreamsDetached: execution.browserStreamsDetached,
		requiresPartialUnfinalized: execution.requiresPartialUnfinalized,
		partialUnfinalizedReasons: execution.partialUnfinalizedReasons,
		failure: execution.failure,
		indexHtmlSha256: execution.indexHtmlSha256,
	});
	await run.writeArtifact('browser/stdout.txt', execution.stdout);
	await run.writeArtifact('browser/stderr.txt', execution.stderr);
}

/** Return a concise immutable terminal report. */
function reportText(runId, conclusion, classification, error) {
	if (error !== null) {
		return `# ${runId}: Flat/local analytic finite-disk GPU proof

Conclusion: **${conclusion}**

- Operational completion: failed before a scientific raster decision.
- Error: ${error.name}: ${error.message}
- Authorization boundary: no production mutation was authorized. Because apparatus or protected identity did not close, this run makes no unchanged-input or scientific raster claim.
- Execution boundary: no separate CPU N4 atmospheric-scattering/cache lane, refined source-path convergence, or CPU full-frame lane was authorized; the normal distant-GPU control may retain its disclosed bounded celestial reference helper.
`;
	}
	const rejectedGates = classification.gates.filter((record) => !record.passes).map((record) => record.id);
	const transportGate = classification.gates.find(
		(record) => record.id === 'fallback-activation-and-bounded-transport',
	);
	const distantGate = classification.gates.find((record) => record.id === 'distant-family-non-regression');
	return `# ${runId}: Flat/local analytic finite-disk GPU proof

Conclusion: **${conclusion}**

- Required gates: ${classification.gates.length - rejectedGates.length}/${classification.gates.length} accepted.
- Rejected gates: ${rejectedGates.length === 0 ? 'none' : rejectedGates.join(', ')}.
- Raw rows: ${classification.observations.uniqueRowCount} unique bounded pixels.
- Independent oracle work: ${classification.observations.oracleClassificationCount} direct binary64 ray/sphere classifications.
- Candidate transport accounting: observed maximum ${classification.observations.maximumObservedCandidateTransportEvaluationCount} additional and ${classification.observations.maximumObservedTotalProofTransportEvaluationCount} total duplicated evaluations per pixel; required maxima are 1 and 4; gate ${transportGate.passes ? 'accepted' : 'rejected'}.
- Execution contract: the normal distant-Sun GPU control is required to disclose its bounded 2,145-scalar binary64 celestial reference helper, and no separate CPU N4 atmospheric-scattering/cache, refined source-path, or CPU full-frame lane is permitted; distant-family gate ${distantGate.passes ? 'accepted' : 'rejected'}.
- Claim boundary: contained hardware-GPU Flat raster qualification only, with final protected identity closure; final CPU/reference verification remains deferred.
`;
}

/** Throw one recognizable interruption error after a handled process signal. */
function requireNotInterrupted() {
	if (receivedTerminationSignal === null) return;
	const error = new Error(`Proof interrupted by ${receivedTerminationSignal}.`);
	error.name = 'AbortError';
	throw error;
}

/** Allocate and execute the one immutable focused hardware-GPU proof. */
async function main() {
	if (process.argv.length !== 2) throw new Error('Flat analytic raster proof runner accepts no arguments.');
	receivedTerminationSignal = null;
	const run = await initializeRunRecord({
		slug: RUN_SLUG,
		command: COMMAND,
		inputs: {
			schemaId: PROOF_ID,
			fixture: 'scripts/extraterrestrial/fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json',
			sourceFixture: 'scripts/extraterrestrial/fixtures/union-glacier-flat-local-closest-approach-v1.json',
			snapshot: 'scripts/extraterrestrial/production-snapshots/sun-appearance-step-5-v1',
			browserApi: 'runFlatLocalAnalyticDiskRasterGpuProof(fixture, reportProgress)',
		},
		provenance: {
			experiment: 'scripts/extraterrestrial',
			executionBackend: 'hardware-gpu',
			execution: 'one isolated Chrome process; four serial GPU setups; bounded 5x5 readbacks',
		},
		environment: {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			browser: 'installed Chrome headless WebGL2 with software rasterizer disabled',
			maximumConcurrentChromeProcesses: 1,
			inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
			fixedWallTimeout: null,
		},
		references: {
			canonicalDesign: 'agents/topics/extraterrestrial/sun-disk-appearance-design.md',
			canonicalPlan: 'agents/topics/extraterrestrial/sun-disk-appearance-implementation-plan.md',
		},
	});
	const signalHandler = (signal) => {
		receivedTerminationSignal ??= signal;
		if (activeChromeChild?.exitCode === null && activeChromeChild?.signalCode === null) {
			activeChromeChild.kill('SIGTERM');
		}
	};
	const interruptHandler = () => signalHandler('SIGINT');
	const terminateHandler = () => signalHandler('SIGTERM');
	process.on('SIGINT', interruptHandler);
	process.on('SIGTERM', terminateHandler);
	let protectedBefore = null;
	let protectedAfter = null;
	let protectedAfterWritten = false;
	let protectedFinal = null;
	let classification = null;
	let terminalRequest;
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment implementation tree');
		const snapshot = await verifySnapshot();
		const [fixtureBytes, sourceFixtureBytes, chromePath] = await Promise.all([
			readFile(FIXTURE_PATH),
			readFile(SOURCE_FIXTURE_PATH),
			findChrome(),
		]);
		const fixture = JSON.parse(fixtureBytes.toString('utf8'));
		const sourceFixture = JSON.parse(sourceFixtureBytes.toString('utf8'));
		validateFixture(fixture, sourceFixtureBytes);
		await Promise.all([
			assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'Flat raster proof fixture'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, SOURCE_FIXTURE_PATH, 'Flat source fixture'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, BROWSER_ENTRY_PATH, 'Flat raster browser entry'),
			assertExistingRealPathContained(EXPERIMENT_ROOT, SCENE_MODULE_PATH, 'Flat raster scene module'),
		]);
		const [production, controls, three, nodeExecutableClosure, protectedRoots] = await Promise.all([
			createSelectedFileInventory(
				REPOSITORY_ROOT,
				snapshot.manifest.sealedInventory.files.map((entry) => entry.path),
			),
			createSelectedFileInventory(EXPERIMENT_ROOT, EXECUTED_CONTROL_PATHS),
			createSelectedFileInventory(EXPERIMENT_NODE_MODULES_ROOT, THREE_RUNTIME_PATHS),
			createNodeExecutableClosure(),
			createProtectedInventories(),
		]);
		const [nodeExecutable, chromeExecutable] = await Promise.all([
			createExecutableIdentity(process.execPath, 'Node executable before execution'),
			createExecutableIdentity(chromePath, 'Chrome executable before execution'),
		]);
		for (const [relativePath, bytes] of [
			['fixtures/flat-local-analytic-disk-raster-gpu-proof-v1.json', fixtureBytes],
			['fixtures/union-glacier-flat-local-closest-approach-v1.json', sourceFixtureBytes],
		]) {
			const inventoryEntry = controls.files.find((entry) => entry.path === relativePath);
			requireCondition(
				inventoryEntry?.bytes === bytes.byteLength && inventoryEntry.sha256 === sha256(bytes),
				`Loaded input bytes differ from protected control inventory: ${relativePath}.`,
			);
		}
		protectedBefore = {
			snapshot,
			production,
			controls,
			three,
			nodeExecutableClosure,
			protectedRoots,
			nodeExecutable,
			chromeExecutable,
		};
		await run.writeJsonArtifact('evidence/protected-before.json', protectedEvidence(protectedBefore));
		await run.writeJsonArtifact('evidence/input-authorities.json', {
			schemaVersion: 'flat-local-analytic-disk-raster-input-authorities-v1',
			proofId: PROOF_ID,
			fixtureSha256: sha256(fixtureBytes),
			fixtureBytes: fixtureBytes.byteLength,
			sourceFixtureSha256: sha256(sourceFixtureBytes),
			sourceFixtureBytes: sourceFixtureBytes.byteLength,
			snapshotManifestSha256: snapshot.manifestSha256,
		});
		await run.writeJsonArtifact('evidence/execution-plan.json', {
			schemaVersion: 'flat-local-analytic-disk-raster-execution-plan-v1',
			proofId: PROOF_ID,
			claimBoundary: fixture.claimBoundary,
			browserProcessCount: 1,
			maximumConcurrentChromeProcesses: 1,
			gpuSetupOrder: EXPECTED_SETUP_IDS,
			clearCaptureCount: EXPECTED_CLEAR_CAPTURE_KEYS.size,
			blockerCaptureCount: EXPECTED_BLOCKER_CAPTURE_KEYS.size,
			qualificationPixelRowCount: EXPECTED_EVALUATION_PIXEL_COUNT,
			backwardControlPixelRowCount: EXPECTED_BACKWARD_CONTROL_PIXEL_COUNT,
			totalEvidencePixelRowCount: EXPECTED_TOTAL_EVIDENCE_PIXEL_COUNT,
			oracleClassificationCount: fixture.oracle.classificationCountUpperBound,
			inactivityTimeoutMilliseconds: INACTIVITY_TIMEOUT_MILLISECONDS,
			absoluteProgressTimeout: null,
			expectedWallRuntimeMinutes: {minimum: 10, maximumTypical: 30},
			separateCpuN4AtmosphericCacheRefinedOrFullFrameLaneUsed: false,
			normalGpuPathDistantCelestialCpuReferenceHelper:
				fixture.executionPolicy.normalGpuPathDistantCelestialCpuReferenceHelper,
			generatedInputReuse: false,
			persistPreview: false,
		});
		requireNotInterrupted();
		const resultNonce = randomBytes(32).toString('hex');
		const indexHtml = browserIndex(resultNonce);
		await run.writeArtifact('browser/index.html', indexHtml);
		const execution = await executeBrowser(run.runDirectory, chromePath, indexHtml, resultNonce);
		if (execution.requiresPartialUnfinalized) {
			let executionPersistenceError = null;
			let partialArtifactError = null;
			try {
				await persistBrowserExecution(run, execution);
			} catch (error) {
				executionPersistenceError = serializeError(error);
			}
			try {
				await run.writeJsonArtifact('evidence/partial-unfinalized.json', {
					schemaVersion: 'flat-local-analytic-disk-raster-partial-unfinalized-v1',
					proofId: PROOF_ID,
					reason: 'Browser process, loopback server, or transient-profile cleanup did not close completely; ordinary immutable finalization was deliberately withheld.',
					reasons: execution.partialUnfinalizedReasons,
					pid: execution.pid,
					exit: execution.exit,
					serverClose: execution.serverClose,
					profileRetained: execution.profileRetained,
					browserStreamsDetached: execution.browserStreamsDetached,
					failure: execution.failure,
					executionPersistenceError,
				});
			} catch (error) {
				partialArtifactError = serializeError(error);
			}
			process.off('SIGINT', interruptHandler);
			process.off('SIGTERM', terminateHandler);
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'partial-unfinalized',
						reason: 'Browser/server terminality or transient-profile cleanup was not confirmed.',
						reasons: execution.partialUnfinalizedReasons,
						exit: execution.exit,
						serverClose: execution.serverClose,
						executionPersistenceError,
						partialArtifactError,
					},
					null,
					2,
				)}\n`,
			);
			process.exitCode = 1;
			return;
		}
		await persistBrowserExecution(run, execution);
		requireNotInterrupted();
		requireCondition(execution.failure === null, `Browser execution failed: ${execution.failure?.message}.`);
		requireCondition(
			execution.exit?.kind === 'exit' &&
				execution.exit.terminationRequested === true &&
				execution.exit.sigtermAccepted === true &&
				execution.exit.code === null &&
				execution.exit.signal === 'SIGTERM' &&
				execution.exit.terminalExitConfirmed === true &&
				execution.exit.forcedKill === false &&
				execution.exit.gracefulTerminationTimedOut === false &&
				execution.serverClose?.kind === 'closed' &&
				execution.serverClose.closureFenceSet === true &&
				execution.serverClose.remainingActiveHandlerCount === 0 &&
				execution.serverClose.remainingConnectionCount === 0 &&
				execution.profileRemoved === true &&
				execution.profileRetained === false &&
				execution.browserStreamsDetached === false,
			'Browser child and loopback server did not reach the exact requested graceful terminal state.',
		);
		requireCondition(
			execution.value !== null && execution.receipt !== null,
			'Browser submitted no complete result.',
		);
		validateFinalProgressSummary(execution.progressSummary);
		const servedClosure = validateServedBrowserClosure(
			execution,
			protectedBefore.snapshot.inventory,
			protectedBefore.controls,
			protectedBefore.three,
		);
		await run.writeJsonArtifact('evidence/served-browser-closure.json', servedClosure);
		protectedAfter = await verifyProtectedAfter(protectedBefore);
		await run.writeJsonArtifact('evidence/protected-after.json', protectedEvidence(protectedAfter));
		protectedAfterWritten = true;
		requireNotInterrupted();
		classification = classifyBrowserResult(execution.value, fixture, sourceFixture);
		await run.writeJsonArtifact('evidence/classification.json', classification);
		const conclusion = classification.accepted ? 'accepted' : 'rejected';
		terminalRequest = {
			conclusion,
			result: {
				proofId: PROOF_ID,
				accepted: classification.accepted,
				gateCount: classification.gates.length,
				acceptedGateCount: classification.gates.filter((record) => record.passes).length,
				rejectedGateIds: classification.gates.filter((record) => !record.passes).map((record) => record.id),
				uniqueRowCount: classification.observations.uniqueRowCount,
				oracleClassificationCount: classification.observations.oracleClassificationCount,
			},
			report: reportText(run.runId, conclusion, classification, null),
		};
	} catch (error) {
		const serialized = serializeError(error);
		const conclusion = receivedTerminationSignal === null ? 'failed' : 'interrupted';
		try {
			await run.writeJsonArtifact('evidence/failure.json', {
				...serialized,
				receivedTerminationSignal,
			});
		} catch (artifactError) {
			serialized.failureArtifactError = serializeError(artifactError);
		}
		if (protectedBefore !== null && !protectedAfterWritten) {
			try {
				protectedAfter = await verifyProtectedAfter(protectedBefore);
				await run.writeJsonArtifact('evidence/protected-after.json', protectedEvidence(protectedAfter));
				protectedAfterWritten = true;
			} catch (protectedError) {
				serialized.protectedAfterError = serializeError(protectedError);
			}
		}
		terminalRequest = {
			conclusion,
			result: {
				proofId: PROOF_ID,
				accepted: false,
				error: serialized,
				receivedTerminationSignal,
			},
			report: reportText(run.runId, conclusion, null, serialized),
		};
	}
	if (terminalRequest.conclusion === 'accepted' || terminalRequest.conclusion === 'rejected') {
		try {
			requireNotInterrupted();
			protectedFinal = await verifyProtectedAfter(protectedBefore);
			const protectedAfterPacket = protectedEvidence(protectedAfter);
			const protectedFinalPacket = protectedEvidence(protectedFinal);
			const protectedAfterSha256 = sha256(Buffer.from(JSON.stringify(protectedAfterPacket), 'utf8'));
			const protectedFinalSha256 = sha256(Buffer.from(JSON.stringify(protectedFinalPacket), 'utf8'));
			requireCondition(
				protectedFinalSha256 === protectedAfterSha256,
				'Final protected identity differs from the post-browser protected identity.',
			);
			await run.writeJsonArtifact('evidence/protected-final.json', {
				...protectedFinalPacket,
				protectedAfterSha256,
				protectedFinalSha256,
			});
			terminalRequest.result.finalProtectedEvidenceSha256 = protectedFinalSha256;
			requireNotInterrupted();
		} catch (error) {
			const serialized = serializeError(error);
			const conclusion = receivedTerminationSignal === null ? 'failed' : 'interrupted';
			try {
				await run.writeJsonArtifact('evidence/final-boundary-failure.json', {
					...serialized,
					receivedTerminationSignal,
				});
			} catch (artifactError) {
				serialized.failureArtifactError = serializeError(artifactError);
			}
			terminalRequest = {
				conclusion,
				result: {
					proofId: PROOF_ID,
					accepted: false,
					error: serialized,
					receivedTerminationSignal,
				},
				report: reportText(run.runId, conclusion, null, serialized),
			};
		}
	}
	let terminalManifest;
	try {
		terminalManifest = await run.finalize(terminalRequest);
	} catch (finalizationError) {
		process.off('SIGINT', interruptHandler);
		process.off('SIGTERM', terminateHandler);
		process.stderr.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion: 'partial-unfinalized',
					error: serializeError(finalizationError),
				},
				null,
				2,
			)}\n`,
		);
		process.exitCode = 1;
		return;
	}
	process.off('SIGINT', interruptHandler);
	process.off('SIGTERM', terminateHandler);
	try {
		const verification = await verifyRun(run.runDirectory);
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion: terminalRequest.conclusion,
					artifactSetSha256: terminalManifest.artifactSetSha256,
					verification,
				},
				null,
				2,
			)}\n`,
		);
		process.exitCode =
			terminalRequest.conclusion === 'accepted'
				? 0
				: terminalRequest.conclusion === 'rejected'
					? 2
					: terminalRequest.conclusion === 'interrupted'
						? 130
						: 1;
	} catch (verificationError) {
		process.stderr.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion: terminalRequest.conclusion,
					artifactSetSha256: terminalManifest.artifactSetSha256,
					postFinalizationVerificationError: serializeError(verificationError),
				},
				null,
				2,
			)}\n`,
		);
		process.exitCode = 1;
	}
}

await main();
