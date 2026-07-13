#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import {
	assertExistingRealPathContained,
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
	readWorkingTreeStatus,
} from '../harness/lib/containment.js';
import {
	DECISION_SEAM_DELTAS,
	CTL_OCIO_ABSOLUTE_TOLERANCE,
	FIXED_SCENE_SCALE,
	PROOF_ID,
	buildCtlOracleGrid,
	buildEncodingBranchProbes,
	buildOfficialTableBoundaryProbes,
	buildReferenceGrid,
	collectBrunetonNonRegressionInputs,
	collectMeasuredSamples,
	decodeRgba32f,
	encodeCandidatePng,
	encodeReferenceGrid,
	evaluateBrunetonNonRegression,
	evaluateCtlOracleParity,
	evaluateEncodingBranchProbes,
	evaluateModelContinuity,
	evaluateOfficialTableBoundaries,
	evaluateOfficialTableProbe,
	evaluateOcioParity,
	evaluatePairDecision,
	evaluateSyntheticGrid,
	evaluateTrackedBrunetonGate,
} from '../harness/lib/aces-reference-decision.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
	createSelectedFileInventory,
	sha256File,
} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
	toRepositoryRelativePath,
} from '../harness/lib/roots.js';
import {initializeRunRecord, resolveExistingRunDirectory, resolveRunRoots} from '../harness/lib/run-record.js';
import {verifyRun} from './verify-run.js';

const execFileAsync = promisify(execFile);
let referenceProgressReporter = async () => {};
const COMMAND = 'node scripts/extraterrestrial/runners/run-aces2-sun-appearance-reference-decision.js';
const PAIRED_PROOF_ID = 'production-sun-appearance-paired-diagnostic-v1';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'production-sun-appearance-paired-v1.json');
const STRICT_BRUNETON_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'bruneton-b1-sky-color-gate-v1.json');
const WRAPPER_PATH = path.join(EXPERIMENT_ROOT, 'reference-transforms', 'Rec709D65FixedScaleToACES2065-1.ctl');
const CPP_HELPER_PATH = path.join(EXPERIMENT_ROOT, 'tools', 'exr-rgba-f32.cpp');
const OCIO_HELPER_PATH = path.join(EXPERIMENT_ROOT, 'tools', 'aces-ocio-cross-check.py');
const ACES_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'aces-v2.0.0-2025.04.04');
const ACES_PACKAGE_ROOT = path.join(ACES_REFERENCE_ROOT, 'package');
const ACES_PROVENANCE_PATH = path.join(ACES_REFERENCE_ROOT, 'provenance.json');
const ACES_ASSET_PATH = path.join(ACES_REFERENCE_ROOT, 'aces_v2-0-0-2025-04-04.zip');
const CTL_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'ctl-1.5.3');
const CTL_PROVENANCE_PATH = path.join(CTL_REFERENCE_ROOT, 'provenance.json');
const CTL_SOURCE_ARCHIVE_PATH = path.join(CTL_REFERENCE_ROOT, 'ctl-a63c7ec4c1e3cc2c66df4fd8f2f083d9eb1c2f35.tar.gz');
const CTL_LICENSE_PATH = path.join(CTL_REFERENCE_ROOT, 'package', 'LICENSE');
const CTL_PATCH_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'ctl-1.5.3-f1c75-maxinst');
const CTL_PATCH_PROVENANCE_PATH = path.join(CTL_PATCH_REFERENCE_ROOT, 'provenance.json');
const CTL_PATCH_PATH = path.join(CTL_PATCH_REFERENCE_ROOT, 'f1c75-max-inst-count-semantic.patch');
const OCIO_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'opencolorio-2.4.2');
const OCIO_PROVENANCE_PATH = path.join(OCIO_REFERENCE_ROOT, 'provenance.json');
const BRUNETON_REFERENCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1');
const BRUNETON_PROVENANCE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'provenance.json');
const BRUNETON_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'bruneton-published-model.tsv');
const BRUNETON_GPU_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'algorithm32-current-production-gpu-j4.tsv');
const CIE_TABLE_PATH = path.join(BRUNETON_REFERENCE_ROOT, 'CIE_xyz_1931_2deg.csv');
const CTL_UNPATCHED_EXECUTABLE_PATH = path.join(OUTPUT_ROOT, 'tools', 'ctl-1.5.3-build', 'ctlrender', 'ctlrender');
const CTL_PATCHED_SOURCE_ROOT = path.join(OUTPUT_ROOT, 'tools', 'ctl-1.5.3-f1c75-maxinst-build', 'source');
const CTL_EXECUTABLE_PATH = path.join(OUTPUT_ROOT, 'tools', 'ctl-1.5.3-f1c75-maxinst-build', 'ctlrender', 'ctlrender');
const OCIO_INSTALL_ROOT = path.join(OUTPUT_ROOT, 'tools', 'opencolorio-2.4.2');
const OCIO_PYD_PATH = path.join(OCIO_INSTALL_ROOT, 'PyOpenColorIO', 'PyOpenColorIO.pyd');
const OCIO_INITIALIZER_PATH = path.join(OCIO_INSTALL_ROOT, 'PyOpenColorIO', '__init__.py');
const OCIO_DLL_PATH = path.join(OCIO_INSTALL_ROOT, 'PyOpenColorIO', 'bin', 'OpenColorIO_2_4.dll');
const OCIO_WHEEL_PATH = path.join(OCIO_REFERENCE_ROOT, 'opencolorio-2.4.2-cp310-cp310-win_amd64.whl');
const PYTHON_RUNTIME_ROOT = path.resolve('C:/Users/gande/AppData/Local/Programs/Python/Python310');
const PYTHON_EXECUTABLE_PATH = path.join(PYTHON_RUNTIME_ROOT, 'python.exe');
const EXPERIMENT_PACKAGE_LOCK_PATH = path.join(EXPERIMENT_ROOT, 'package-lock.json');
const CORE_LIBRARY_ROOT = path.join(ACES_PACKAGE_ROOT, 'aces-core', 'lib');
const AP0_TO_AP1_CTL_PATH = path.join(
	ACES_PACKAGE_ROOT,
	'aces-input-and-colorspaces',
	'ACEScg',
	'CSC.Academy.ACES_to_ACEScg.ctl',
);
const SRGB_OUTPUT_CTL_PATH = path.join(
	ACES_PACKAGE_ROOT,
	'aces-output',
	'd65',
	'srgb',
	'Output.Academy.Rec709-D65_100nit_in_Rec709-D65_sRGB-Piecewise.ctl',
);
const OFFICIAL_TABLE_PROBE_CTL_PATH = path.join(
	EXPERIMENT_ROOT,
	'reference-transforms',
	'Aces2Official100NitTableProbe.ctl',
);
const OFFICIAL_GPU_TABLE_PROBE_CTL_PATH = path.join(
	EXPERIMENT_ROOT,
	'reference-transforms',
	'Aces2Official100NitGpuTableProbe.ctl',
);
const OFFICIAL_GAMUT_PROBE_CTL_PATH = path.join(
	EXPERIMENT_ROOT,
	'reference-transforms',
	'Aces2Official100NitGamutProbe.ctl',
);
const OFFICIAL_MODEL_PROBE_CTL_PATH = path.join(
	EXPERIMENT_ROOT,
	'reference-transforms',
	'Aces2Official100NitModelProbe.ctl',
);
const OFFICIAL_SRGB_ENCODING_PROBE_CTL_PATH = path.join(
	EXPERIMENT_ROOT,
	'reference-transforms',
	'Aces2OfficialSrgbEncodingProbe.ctl',
);
const CONTROL_PATHS = Object.freeze([
	'containment-policy.json',
	'fixtures/production-sun-appearance-paired-v1.json',
	'fixtures/bruneton-b1-sky-color-gate-v1.json',
	'package.json',
	'package-lock.json',
	'harness/lib/aces-reference-decision.js',
	'reference-transforms/Aces2Official100NitGamutProbe.ctl',
	'reference-transforms/Aces2Official100NitGpuTableProbe.ctl',
	'reference-transforms/Aces2Official100NitModelProbe.ctl',
	'reference-transforms/Aces2Official100NitTableProbe.ctl',
	'reference-transforms/Aces2OfficialSrgbEncodingProbe.ctl',
	'reference-transforms/Rec709D65FixedScaleToACES2065-1.ctl',
	'references/aces-v2.0.0-2025.04.04/provenance.json',
	'references/ctl-1.5.3/provenance.json',
	'references/ctl-1.5.3-f1c75-maxinst/f1c75-max-inst-count-semantic.patch',
	'references/ctl-1.5.3-f1c75-maxinst/provenance.json',
	'references/opencolorio-2.4.2/provenance.json',
	'references/bruneton-step5-nonregression-v1/CIE_xyz_1931_2deg.csv',
	'references/bruneton-step5-nonregression-v1/algorithm32-current-production-gpu-j4.tsv',
	'references/bruneton-step5-nonregression-v1/bruneton-published-model.tsv',
	'references/bruneton-step5-nonregression-v1/provenance.json',
	'runners/run-aces2-sun-appearance-reference-decision.js',
	'runners/verify-run.js',
	'tools/aces-ocio-cross-check.py',
	'tools/exr-rgba-f32.cpp',
]);
const MAX_FRAME_PROBES = 2048;
let executedPythonIdentity = null;
let sealedPythonRuntimeInventory = null;
let sealedPythonRuntimeFiles = null;
let sealedOcioInstallFiles = null;

class TerminalRejection extends Error {
	constructor(message) {
		super(message);
		this.name = 'TerminalRejection';
	}
}

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function serializeError(error) {
	return {
		name: error?.name ?? 'Error',
		message: error?.message ?? String(error),
		stack: error?.stack ?? null,
	};
}

function readJson(filePath) {
	return readFile(filePath, 'utf8').then(JSON.parse);
}

function compareStrings(left, right) {
	return left < right ? -1 : left > right ? 1 : 0;
}

function windowsPathToWsl(filePath) {
	const resolved = path.resolve(filePath);
	const match = /^([A-Za-z]):\\(.*)$/u.exec(resolved);
	requireCondition(match, `Cannot map path to WSL: ${resolved}`);
	return `/mnt/${match[1].toLowerCase()}/${match[2].replaceAll('\\', '/')}`;
}

function pathComparisonKey(filePath) {
	return path.resolve(filePath).replaceAll('\\', '/').toLowerCase();
}

function sha256Text(value) {
	return createHash('sha256').update(value, 'utf8').digest('hex');
}

function normalizeWslText(value) {
	return value.replaceAll('\0', '').replaceAll('\r', '').trim();
}

function isExperimentWorkingTreePath(relativePath, policy) {
	const normalized = relativePath.replaceAll('\\', '/');
	const root = policy.trackedSourceRoot.replaceAll('\\', '/').replace(/\/$/u, '');
	return normalized === root || normalized.startsWith(`${root}/`);
}

async function captureProtectedWorkingTree(policy) {
	const status = (await readWorkingTreeStatus())
		.filter((record) => record.paths.some((entry) => !isExperimentWorkingTreePath(entry, policy)))
		.map((record) => ({status: record.status, paths: [...record.paths]}))
		.sort((left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)));
	const protectedStatusPaths = [
		...new Set(
			status.flatMap((record) => record.paths.filter((entry) => !isExperimentWorkingTreePath(entry, policy))),
		),
	].sort(compareStrings);
	const existingPaths = [];
	const missingPaths = [];
	for (const relativePath of protectedStatusPaths) {
		try {
			const stats = await lstat(path.join(REPOSITORY_ROOT, ...relativePath.split('/')));
			requireCondition(
				stats.isFile() && !stats.isSymbolicLink(),
				`Protected dirty path is not a regular file: ${relativePath}`,
			);
			existingPaths.push(relativePath);
		} catch (error) {
			if (error?.code !== 'ENOENT') throw error;
			missingPaths.push(relativePath);
		}
	}
	return {
		trackedFiles: await createProtectedTrackedInventory(policy),
		status,
		dirtyFiles: await createSelectedFileInventory(REPOSITORY_ROOT, existingPaths),
		missingPaths,
	};
}

async function verifyProtectedWorkingTree(expected, policy) {
	const observed = await captureProtectedWorkingTree(policy);
	assertFileInventoriesEqual(expected.trackedFiles, observed.trackedFiles, 'Protected tracked-file inventory');
	assertFileInventoriesEqual(expected.dirtyFiles, observed.dirtyFiles, 'Protected dirty-file inventory');
	requireCondition(
		JSON.stringify(expected.status) === JSON.stringify(observed.status) &&
			JSON.stringify(expected.missingPaths) === JSON.stringify(observed.missingPaths),
		'Protected working-tree status changed during the decision.',
	);
	return observed;
}

function parseWslDistributionVersions(value) {
	return normalizeWslText(value)
		.split('\n')
		.slice(1)
		.map((line) => /^\s*\*?\s*(.+?)\s+(?:Running|Stopped)\s+([12])\s*$/u.exec(line))
		.filter(Boolean)
		.map((match) => ({name: match[1].trim(), version: Number(match[2])}))
		.sort((left, right) => compareStrings(left.name, right.name));
}

function includePythonRuntimeFile(relativePath) {
	const normalized = relativePath.replaceAll('\\', '/');
	return !normalized.startsWith('Lib/site-packages/');
}

async function createPythonRuntimeInventory() {
	return createFileInventory(PYTHON_RUNTIME_ROOT, {include: includePythonRuntimeFile});
}

function absoluteInventoryMap(root, inventory) {
	return new Map(
		inventory.files.map((entry) => [pathComparisonKey(path.join(root, ...entry.path.split('/'))), entry.sha256]),
	);
}

function isolatedPythonEnvironment(temporaryDirectory) {
	const environment = {
		OCIO_PYTHON_LOAD_DLLS_FROM_PATH: '0',
		TEMP: temporaryDirectory,
		TMP: temporaryDirectory,
	};
	for (const key of ['COMSPEC', 'SystemRoot', 'WINDIR']) {
		if (process.env[key]) environment[key] = process.env[key];
	}
	return environment;
}

async function runProcess(executable, arguments_, options = {}) {
	await referenceProgressReporter({
		stage: 'reference-process-start',
		executable: path.basename(executable),
		argumentCount: arguments_.length,
	});
	const result = await execFileAsync(executable, arguments_, {
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		timeout: options.timeout ?? 0,
		windowsHide: true,
		env: options.env ?? process.env,
		cwd: options.cwd,
	});
	await referenceProgressReporter({
		stage: 'reference-process-complete',
		executable: path.basename(executable),
		argumentCount: arguments_.length,
	});
	return {stdout: result.stdout ?? '', stderr: result.stderr ?? ''};
}

async function runWsl(arguments_, options = {}) {
	return runProcess('wsl.exe', arguments_, options);
}

async function findLatestAcceptedPairedRun() {
	const entries = await readdir(RUNS_ROOT, {withFileTypes: true});
	entries.sort((left, right) => compareStrings(right.name, left.name));
	for (const entry of entries) {
		if (!entry.isDirectory() || !/^[0-9]{6}-production-sun-appearance-paired-diagnostic$/u.test(entry.name))
			continue;
		const runDirectory = path.join(RUNS_ROOT, entry.name);
		try {
			const result = await readJson(path.join(runDirectory, 'result.json'));
			if (
				result?.proofId === PAIRED_PROOF_ID &&
				result.state === 'terminal' &&
				result.conclusion === 'accepted' &&
				result.accepted === true
			)
				return runDirectory;
		} catch {
			// A partial or corrupt prior attempt is not an accepted input.
		}
	}
	throw new Error('No terminal accepted production Sun appearance paired diagnostic exists.');
}

async function resolvePairedEvidence(selector) {
	const runDirectory = selector
		? await resolveExistingRunDirectory(selector, resolveRunRoots())
		: await findLatestAcceptedPairedRun();
	await assertExistingRealPathContained(RUNS_ROOT, runDirectory, 'Paired diagnostic run');
	const verification = await verifyRun(runDirectory);
	requireCondition(verification.conclusion === 'accepted', 'Selected paired diagnostic is not accepted.');
	const [result, gates, browserEvidence, returnedArtifacts, artifactManifest, snapshotBefore] = await Promise.all([
		readJson(path.join(runDirectory, 'result.json')),
		readJson(path.join(runDirectory, 'evidence', 'gates.json')),
		readJson(path.join(runDirectory, 'evidence', 'browser-result.json')),
		readJson(path.join(runDirectory, 'evidence', 'returned-artifacts.json')),
		readJson(path.join(runDirectory, 'artifact-manifest.json')),
		readJson(path.join(runDirectory, 'evidence', 'snapshot-before.json')),
	]);
	requireCondition(
		result.proofId === PAIRED_PROOF_ID &&
			result.accepted === true &&
			gates.proofId === PAIRED_PROOF_ID &&
			gates.accepted === true,
		'Selected paired evidence does not pass its complete gate set.',
	);
	for (const gate of ['outputTransfer', 'pairs', 'convergence', 'rawOrdering', 'artifacts']) {
		requireCondition(gates[gate]?.passed === true, `Selected paired evidence gate ${gate} is not accepted.`);
	}
	if (result.measuredOutputEncoding === 'srgb') {
		throw new TerminalRejection(
			'Step 5.1 measured an automatic sRGB OETF. The frozen official sRGB-piecewise CTL would double encode, and no display-linear ACES output was frozen.',
		);
	}
	requireCondition(
		result.measuredOutputEncoding === 'direct' && gates.outputTransfer.measuredEncoding === 'direct',
		'Step 5.1 output encoding is missing or unresolved.',
	);
	if (result.requiredOfficialCtlEncoding !== undefined) {
		requireCondition(
			String(result.requiredOfficialCtlEncoding).toLowerCase() === 'srgb-piecewise',
			'Paired evidence requests an unfrozen official CTL encoding.',
		);
	}
	const fixtureControl = snapshotBefore.executedControls?.files?.find(
		(entry) => entry.path === 'fixtures/production-sun-appearance-paired-v1.json',
	);
	requireCondition(fixtureControl, 'Paired evidence does not seal the Step 5 decision fixture.');
	const currentFixtureSha256 = await sha256File(FIXTURE_PATH);
	requireCondition(
		fixtureControl.sha256 === currentFixtureSha256,
		'Paired evidence was produced from a different Step 5 decision fixture.',
	);
	return {
		runDirectory,
		runId: path.basename(runDirectory),
		verification,
		result,
		gates,
		browserEvidence,
		returnedArtifacts,
		artifactManifest,
		fixtureSha256: currentFixtureSha256,
		artifactManifestSha256: await sha256File(path.join(runDirectory, 'artifact-manifest.json')),
	};
}

function framePointers(evidence) {
	const frames = evidence.browserEvidence.fullFrameSignedLinearCaptures;
	requireCondition(
		Array.isArray(frames) && frames.length >= 2,
		'Paired evidence has fewer than two signed-float previews.',
	);
	const expected = [
		frames.find((frame) => frame.family === 'distant' && String(frame.conditionId).includes('minus-10')),
		frames.find((frame) => frame.family === 'flat' && String(frame.conditionId).includes('long')),
	];
	requireCondition(
		expected.every(Boolean),
		'Paired evidence lacks the frozen distant minus-10 or Flat long preview.',
	);
	return expected;
}

async function loadFrame(evidence, pointer) {
	const artifactPath = pointer.artifact;
	requireCondition(
		typeof artifactPath === 'string' && /^frames\/[a-zA-Z0-9._-]+\.rgba32f$/u.test(artifactPath),
		`Float-frame artifact path is invalid: ${artifactPath}`,
	);
	const declared = evidence.returnedArtifacts.artifacts?.find(
		(entry) => entry.artifactPath === artifactPath && entry.kind === 'float32-frame',
	);
	requireCondition(declared, `Float-frame artifact is not declared: ${artifactPath}`);
	const manifestEntry = evidence.artifactManifest.artifacts.find((entry) => entry.path === artifactPath);
	requireCondition(manifestEntry, `Float-frame artifact is absent from the terminal manifest: ${artifactPath}`);
	const width = Number(pointer.viewport?.width ?? pointer.width);
	const height = Number(pointer.viewport?.height ?? pointer.height);
	const channels = Number(pointer.channels ?? 4);
	requireCondition(
		Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0 && channels === 4,
		`Float-frame dimensions are invalid: ${artifactPath}`,
	);
	requireCondition(
		pointer.encoding === 'float32-le-base64' &&
			pointer.channelOrder === 'RGBA' &&
			(pointer.rowOrigin === 'bottom-left' || pointer.rowOrigin === 'top-left') &&
			pointer.finite === true,
		`Float-frame semantic contract is invalid: ${artifactPath}`,
	);
	const absolutePath = path.join(evidence.runDirectory, ...artifactPath.split('/'));
	await assertExistingRealPathContained(evidence.runDirectory, absolutePath, 'Paired float frame');
	const bytes = await readFile(absolutePath);
	requireCondition(bytes.byteLength === width * height * 16, `Float-frame byte count is invalid: ${artifactPath}`);
	requireCondition(
		(await sha256File(absolutePath)) === manifestEntry.sha256,
		`Float-frame digest changed: ${artifactPath}`,
	);
	return {pointer, artifactPath, absolutePath, width, height, channels, bytes};
}

function scanFrames(frames) {
	const probes = [];
	let maximumNormalized = 0;
	const summaries = [];
	for (const frame of frames) {
		const count = frame.width * frame.height;
		const stride = Math.max(1, Math.floor(count / MAX_FRAME_PROBES));
		let finite = true;
		let minimum = Number.POSITIVE_INFINITY;
		let maximum = Number.NEGATIVE_INFINITY;
		let sampled = 0;
		for (let index = 0; index < count; index += 1) {
			const offset = index * 16;
			const rgb = [
				frame.bytes.readFloatLE(offset),
				frame.bytes.readFloatLE(offset + 4),
				frame.bytes.readFloatLE(offset + 8),
			];
			for (const value of rgb) {
				finite &&= Number.isFinite(value);
				minimum = Math.min(minimum, value);
				maximum = Math.max(maximum, value);
				maximumNormalized = Math.max(maximumNormalized, Math.abs(value) * FIXED_SCENE_SCALE);
			}
			if (index % stride === 0 && sampled < MAX_FRAME_PROBES) {
				probes.push({id: `${frame.pointer.conditionId}:${index}`, sceneRgb: rgb});
				sampled += 1;
			}
		}
		requireCondition(finite, `Float-frame ${frame.artifactPath} contains non-finite RGB.`);
		summaries.push({
			conditionId: frame.pointer.conditionId,
			family: frame.pointer.family,
			artifactPath: frame.artifactPath,
			width: frame.width,
			height: frame.height,
			rowOrigin: frame.pointer.rowOrigin,
			minimum,
			maximum,
			probeCount: sampled,
		});
	}
	return {probes, maximumNormalized, summaries};
}

function validateDecisionFixture(fixture, references) {
	requireCondition(
		fixture.id === 'production-sun-appearance-paired-v1' &&
			fixture.schemaVersion === 'production-sun-appearance-paired-v1',
		'Step 5 decision fixture identity is invalid.',
	);
	requireCondition(
		fixture.fixedSceneScale?.value === FIXED_SCENE_SCALE,
		'Fixture fixed scene scale differs from the wrapper.',
	);
	requireCondition(fixture.fixedSceneScale?.variable === false, 'Fixture fixed scene scale must be immutable.');
	const candidate = fixture.candidate;
	requireCondition(
		candidate?.releaseTag === references.aces.release.tag,
		'Fixture ACES tag differs from provenance.',
	);
	requireCondition(
		candidate.releaseCommit === references.aces.release.commit,
		'Fixture ACES commit differs from provenance.',
	);
	requireCondition(
		candidate.tagObject === references.aces.release.tagObject,
		'Fixture ACES tag object differs from provenance.',
	);
	requireCondition(
		JSON.stringify(candidate.submodules) === JSON.stringify(references.aces.submodules),
		'Fixture ACES submodule identities differ from provenance.',
	);
	requireCondition(
		candidate.releaseAsset.name === references.aces.asset.name &&
			candidate.releaseAsset.sha256 === references.aces.asset.sha256 &&
			candidate.releaseAsset.sizeBytes === references.aces.asset.sizeBytes &&
			candidate.releaseAsset.githubAssetId === references.aces.asset.githubAssetId,
		'Fixture ACES release asset differs from provenance.',
	);
	requireCondition(
		candidate.creativeWhite === 'D65' && candidate.renderingTarget === '100-nit Rec.709/D65',
		'Fixture creative white or rendering target differs from the frozen candidate.',
	);
	const selectedOutputId = 'rec709-d65-100nit-srgb-piecewise';
	requireCondition(
		candidate.displayEncoding === 'deferred-until-output-contract-measurement' &&
			references.aces.referenceClosure?.selectedOutput ===
				`${selectedOutputId} when and only when Step 5.1 measures direct code storage; automatic sRGB OETF is terminal rejection`,
		'Fixture deferral or post-measurement provenance selection differs from the fail-closed Step 5 output contract.',
	);
	requireCondition(
		candidate.parameterTuningPermitted === false && candidate.alternateMapperComparisonPermitted === false,
		'Fixture permits an unfrozen candidate variation.',
	);
	requireCondition(
		candidate.officialCoreClamp?.ap1LowerLimit === references.aces.officialClampContract.ap1LowerLimit &&
			candidate.officialCoreClamp?.ap1UpperLimitFor100NitTarget ===
				references.aces.officialClampContract.ap1UpperLimitAt100Nits &&
			candidate.officialCoreClamp?.rHit === references.aces.officialClampContract.rHitAt100Nits &&
			candidate.officialCoreClamp?.forwardLimitMultiplier ===
				references.aces.officialClampContract.forwardLimitMultiplier,
		'Fixture official clamp constants differ from provenance.',
	);
	requireCondition(
		JSON.stringify(fixture.syntheticReferenceGrid?.seamDeltaMultipliers) === JSON.stringify(DECISION_SEAM_DELTAS),
		'Fixture seam delta multipliers differ from executable constants.',
	);
	requireCondition(
		fixture.syntheticReferenceGrid?.hueCount === 360 &&
			fixture.syntheticReferenceGrid?.includeOfficialHueKnotsAndWrap === true &&
			fixture.syntheticReferenceGrid?.includeGamutCusps === true &&
			fixture.syntheticReferenceGrid?.includeEncodingBranches === true &&
			fixture.syntheticReferenceGrid?.includeQuantizerHalfCodes === true,
		'Fixture omits a required Step 5.4 grid axis.',
	);
	requireCondition(
		JSON.stringify(fixture.syntheticReferenceGrid?.signedCubeMultipliers) === JSON.stringify([-2, -1, 0, 1, 2]) &&
			JSON.stringify(fixture.syntheticReferenceGrid?.hueLightnessLevels) ===
				JSON.stringify([2 ** -8, 0.18, 1, 16, 256, 1024, '2M']) &&
			JSON.stringify(fixture.syntheticReferenceGrid?.saturationMultipliers) ===
				JSON.stringify([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4]),
		'Fixture signed/hue/saturation grid constants differ from the executable grid.',
	);
	requireCondition(
		JSON.stringify(fixture.outputContract?.sentinelLinearValues) ===
			JSON.stringify([0, 1 / 255, 0.0031308, 0.018, 0.18, 0.5, 0.75, 1]),
		'Fixture output-encoding sentinels differ from the executable branch probes.',
	);
	requireCondition(
		fixture.syntheticReferenceGrid?.strictMonotonicDomain?.[0] === 0 &&
			fixture.syntheticReferenceGrid?.strictMonotonicDomain?.[1] === 1024,
		'Fixture strict monotonic domain differs from the official 100-nit forward domain.',
	);
	const limits = fixture.brunetonNonRegression;
	requireCondition(
		limits?.rgbRmseMaximum === 0.025415448635317905 &&
			limits?.meanUPrimeVPrimeDistanceMaximum === 0.00718644641935909 &&
			limits?.meanAbsoluteRelativeLuminanceErrorMaximum === 0.046603647487835945,
		'Fixture Bruneton non-regression bounds differ from the frozen run-235 values.',
	);
	return {
		passed: true,
		fixtureId: fixture.id,
		fixedSceneScale: FIXED_SCENE_SCALE,
		candidateId: candidate.id,
	};
}

function validateTrackedBrunetonFixture(fixture, references) {
	requireCondition(
		fixture.schemaId === 'bruneton-b1-sky-color-gate-v1',
		'Tracked Bruneton fixture identity is invalid.',
	);
	requireCondition(
		fixture.oracle?.rowCount === 1377 &&
			fixture.comparison?.times === 17 &&
			fixture.comparison?.directionsPerTime === 81 &&
			fixture.comparison?.sunDisk === 'excluded' &&
			fixture.comparison?.spectralProjection === 'CIE 1931 2-degree XYZ; 683 lm/W; XYZ to linear sRGB' &&
			fixture.comparison?.displayTransform ===
				'channel-wise Bruneton Figure-1 exponential K=1/(5*683), written directly' &&
			fixture.oracle?.canonicalTsvSha256 ===
				references.bruneton.sources?.publishedModels?.containedCanonicalSha256,
		'Tracked Bruneton fixture is not bound to the checksum-sealed atmosphere-only table.',
	);
	requireCondition(
		JSON.stringify(fixture.requirements) ===
			JSON.stringify({
				displayRgbRmseMaximum: 1 / 255,
				maximumDisplayChannelError: 4 / 255,
				meanDeltaUvMaximum: 0.002,
				maximumDeltaUvMaximum: 0.005,
				meanRelativeLuminanceErrorMaximum: 0.05,
				maximumAbsoluteMeanDisplayChannelBias: 1 / 255,
			}),
		'Tracked Bruneton gate thresholds differ from the frozen strict contract.',
	);
	return {passed: true, fixtureId: fixture.schemaId, rowCount: fixture.oracle.rowCount};
}

async function validateReferences() {
	await Promise.all([
		assertNoReparseEntries(ACES_PACKAGE_ROOT, 'Pinned ACES release package'),
		assertNoReparseEntries(OCIO_INSTALL_ROOT, 'Pinned OCIO installation'),
		assertExistingRealPathContained(OUTPUT_ROOT, CTL_UNPATCHED_EXECUTABLE_PATH, 'Unpatched CTL negative control'),
		assertExistingRealPathContained(OUTPUT_ROOT, CTL_EXECUTABLE_PATH, 'Pinned patched ctlrender executable'),
		assertExistingRealPathContained(EXPERIMENT_ROOT, WRAPPER_PATH, 'Step 5.3 CTL wrapper'),
		assertExistingRealPathContained(EXPERIMENT_ROOT, SRGB_OUTPUT_CTL_PATH, 'Official sRGB output CTL'),
		assertExistingRealPathContained(EXPERIMENT_ROOT, AP0_TO_AP1_CTL_PATH, 'Official AP0-to-AP1 CTL'),
		assertExistingRealPathContained(EXPERIMENT_ROOT, OFFICIAL_TABLE_PROBE_CTL_PATH, 'Official table probe CTL'),
		assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			OFFICIAL_GPU_TABLE_PROBE_CTL_PATH,
			'Official GPU table probe CTL',
		),
		assertExistingRealPathContained(EXPERIMENT_ROOT, OFFICIAL_GAMUT_PROBE_CTL_PATH, 'Official gamut probe CTL'),
		assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			OFFICIAL_MODEL_PROBE_CTL_PATH,
			'Official model-stage probe CTL',
		),
		assertExistingRealPathContained(
			EXPERIMENT_ROOT,
			OFFICIAL_SRGB_ENCODING_PROBE_CTL_PATH,
			'Official sRGB encoding probe CTL',
		),
		assertNoReparseEntries(BRUNETON_REFERENCE_ROOT, 'Contained Bruneton non-regression reference'),
	]);
	const [aces, ctl, ctlPatch, ocio, bruneton] = await Promise.all([
		readJson(ACES_PROVENANCE_PATH),
		readJson(CTL_PROVENANCE_PATH),
		readJson(CTL_PATCH_PROVENANCE_PATH),
		readJson(OCIO_PROVENANCE_PATH),
		readJson(BRUNETON_PROVENANCE_PATH),
	]);
	requireCondition(aces.release?.tag === 'v2.0.0+2025.04.04', 'ACES release tag is not frozen.');
	requireCondition(
		aces.release?.commit === '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5',
		'ACES release commit is not frozen.',
	);
	requireCondition(ctl.release?.commit === 'a63c7ec4c1e3cc2c66df4fd8f2f083d9eb1c2f35', 'CTL commit is not frozen.');
	requireCondition(
		ctlPatch.base?.commit === ctl.release.commit &&
			ctlPatch.upstreamFix?.commit === 'f1c75e0d6a08b46e4eccc1fe0cf62e250e9fbd8b' &&
			ctlPatch.upstreamFix?.tree === '4377d23dee8d67940fa561a039790aa5587f00c2',
		'Patched CTL runtime is not bound to the sealed base and official f1c75 fix.',
	);
	requireCondition(
		ctlPatch.requiredPreflight?.floatParity?.absolute === CTL_OCIO_ABSOLUTE_TOLERANCE &&
			ctlPatch.requiredPreflight?.floatParity?.relative === 0.00002 &&
			ctlPatch.requiredPreflight?.floatParity?.maximumUlp === 256 &&
			ctlPatch.requiredPreflight?.exactFinalQ8 === true,
		'Patched CTL preflight tolerance or exact-Q8 contract differs from the frozen policy.',
	);
	requireCondition(
		ctlPatch.requiredPreflight?.unpatchedNegativeControl ===
			'The sealed unpatched ctl-1.5.3 executable must reproduce the sealed no-output crash phenotype for the unchanged wrapper plus official ACES v2 sRGB-piecewise ODT. This old/new executable differential is not, by itself, a direct instruction-guard diagnosis.',
		'Unpatched CTL negative-control claim differs from the frozen narrow contract.',
	);
	requireCondition(
		JSON.stringify(ctlPatch.requiredPreflight?.inputRecords) ===
			JSON.stringify([
				{id: 'black', rgb: [0, 0, 0]},
				{id: 'neutral-0.18-after-scale', rgb: [614.7000122070312, 614.7000122070312, 614.7000122070312]},
				{id: 'red-1-after-scale', rgb: [3415, 0, 0]},
				{id: 'signed-warm', rgb: [3415, 853.75, -341.5]},
				{id: 'neutral-1024-after-scale', rgb: [3496960, 3496960, 3496960]},
			]) &&
			ctlPatch.requiredPreflight?.knownPatchedOutput?.absoluteTolerance === 1e-7 &&
			JSON.stringify(ctlPatch.requiredPreflight?.knownPatchedOutput?.rgba) ===
				JSON.stringify([
					[0, 0, 0, 1],
					[0.349189430475235, 0.3491891920566559, 0.3491891622543335, 1],
					[0.7698673009872437, 0.09199769049882889, 0.04260057955980301, 1],
					[0.7238746881484985, 0.4538552761077881, 6.832741661355612e-8, 1],
					[0.9999999403953552, 0.9999998211860657, 0.9999999403953552, 1],
				]),
		'Patched CTL known five-record preflight differs from the frozen executable contract.',
	);
	requireCondition(ocio.release?.version === '2.4.2', 'OCIO version is not frozen.');
	requireCondition(
		ocio.executionPolicy?.authoritySubset ===
			'Every sealed paired scalar diagnostic input plus frozen signed, neutral, clamp, seam, and hue/saturation anchors is run through both CTL and OCIO.' &&
			ocio.executionPolicy?.exhaustiveUse ===
				'Only after bounded CTL-to-OCIO float and exact-Q8 parity passes, the sealed OCIO implementation may evaluate frame-derived probes, the exhaustive synthetic grid, and the 2,754 matched Bruneton rows.',
		'OCIO provenance does not authorize the frozen bounded-authority/exhaustive evaluation split.',
	);
	const hashes = {
		acesReleaseAsset: await sha256File(ACES_ASSET_PATH),
		ctlUnpatchedExecutable: await sha256File(CTL_UNPATCHED_EXECUTABLE_PATH),
		ctlExecutable: await sha256File(CTL_EXECUTABLE_PATH),
		ctlSourceArchive: await sha256File(CTL_SOURCE_ARCHIVE_PATH),
		ctlLicense: await sha256File(CTL_LICENSE_PATH),
		ctlPatch: await sha256File(CTL_PATCH_PATH),
		ocioWheel: await sha256File(OCIO_WHEEL_PATH),
		ocioInitializer: await sha256File(OCIO_INITIALIZER_PATH),
		ocioPyd: await sha256File(OCIO_PYD_PATH),
		ocioDll: await sha256File(OCIO_DLL_PATH),
		wrapper: await sha256File(WRAPPER_PATH),
		selectedOutputCtl: await sha256File(SRGB_OUTPUT_CTL_PATH),
		ap0ToAp1Ctl: await sha256File(AP0_TO_AP1_CTL_PATH),
		officialTableProbe: await sha256File(OFFICIAL_TABLE_PROBE_CTL_PATH),
		officialGamutProbe: await sha256File(OFFICIAL_GAMUT_PROBE_CTL_PATH),
		officialModelProbe: await sha256File(OFFICIAL_MODEL_PROBE_CTL_PATH),
		officialSrgbEncodingProbe: await sha256File(OFFICIAL_SRGB_ENCODING_PROBE_CTL_PATH),
		brunetonTable: await sha256File(BRUNETON_TABLE_PATH),
		brunetonGpuTable: await sha256File(BRUNETON_GPU_TABLE_PATH),
		cieTable: await sha256File(CIE_TABLE_PATH),
	};
	const [ctlBaseSourceInventory, ctlPatchedSourceInventory, pythonRuntimeInventory, ocioInstallInventory] =
		await Promise.all([
			createFileInventory(path.join(CTL_REFERENCE_ROOT, 'package')),
			createFileInventory(CTL_PATCHED_SOURCE_ROOT),
			createPythonRuntimeInventory(),
			createFileInventory(OCIO_INSTALL_ROOT),
		]);
	hashes.ctlBaseSourceAggregate = ctlBaseSourceInventory.aggregateSha256;
	hashes.ctlPatchedSourceAggregate = ctlPatchedSourceInventory.aggregateSha256;
	hashes.pythonRuntimeAggregate = pythonRuntimeInventory.aggregateSha256;
	hashes.ocioInstallAggregate = ocioInstallInventory.aggregateSha256;
	requireCondition(
		hashes.acesReleaseAsset === aces.asset.sha256,
		'ACES release asset digest differs from provenance.',
	);
	requireCondition(
		hashes.ctlUnpatchedExecutable === ctl.build.executable.sha256,
		'Unpatched ctlrender negative-control digest differs from provenance.',
	);
	requireCondition(
		hashes.ctlExecutable === ctlPatch.build.executable.sha256,
		'Patched ctlrender executable digest differs from provenance.',
	);
	requireCondition(
		hashes.ctlSourceArchive === ctl.source.sha256,
		'CTL source archive digest differs from provenance.',
	);
	requireCondition(
		hashes.ctlLicense === ctl.license.sha256 && hashes.ctlLicense === ctlPatch.license.sha256,
		'CTL base or patched-toolchain license digest differs from provenance.',
	);
	requireCondition(
		hashes.ctlPatch === ctlPatch.semanticPatch.sha256,
		'CTL semantic patch digest differs from provenance.',
	);
	for (const entry of ctlPatch.semanticPatch.changedFiles) {
		const basePath = path.join(CTL_REFERENCE_ROOT, 'package', ...entry.path.split('/'));
		requireCondition(
			(await sha256File(basePath)) === entry.baseSha256,
			`CTL semantic patch base differs from provenance: ${entry.path}`,
		);
	}
	requireCondition(
		ctlBaseSourceInventory.fileCount === ctlPatch.build.sourceConstruction.baseFileCount &&
			ctlBaseSourceInventory.aggregateSha256 === ctlPatch.build.sourceConstruction.baseAggregateSha256 &&
			ctlPatchedSourceInventory.fileCount === ctlPatch.build.sourceConstruction.patchedFileCount &&
			ctlPatchedSourceInventory.aggregateSha256 === ctlPatch.build.sourceConstruction.patchedAggregateSha256,
		'CTL base or patched complete source-tree inventory differs from provenance.',
	);
	const changedSourceHashes = new Map(
		ctlPatch.semanticPatch.changedFiles.map((entry) => [entry.path, entry.patchedSha256]),
	);
	for (let index = 0; index < ctlBaseSourceInventory.files.length; index += 1) {
		const baseEntry = ctlBaseSourceInventory.files[index];
		const patchedEntry = ctlPatchedSourceInventory.files[index];
		requireCondition(baseEntry.path === patchedEntry?.path, 'Patched CTL source tree changes the base path set.');
		const expectedSha256 = changedSourceHashes.get(baseEntry.path) ?? baseEntry.sha256;
		requireCondition(
			patchedEntry.sha256 === expectedSha256,
			`Patched CTL source tree has an undeclared or incorrect change: ${baseEntry.path}`,
		);
	}
	requireCondition(
		pathComparisonKey(ocio.pythonRuntime?.installRoot) === pathComparisonKey(PYTHON_RUNTIME_ROOT) &&
			ocio.pythonRuntime?.executable === path.basename(PYTHON_EXECUTABLE_PATH) &&
			(await sha256File(PYTHON_EXECUTABLE_PATH)) === ocio.pythonRuntime?.executableSha256 &&
			pythonRuntimeInventory.fileCount === ocio.pythonRuntime?.fileCount &&
			pythonRuntimeInventory.totalBytes === ocio.pythonRuntime?.totalBytes &&
			pythonRuntimeInventory.aggregateSha256 === ocio.pythonRuntime?.aggregateSha256,
		'Pinned CPython runtime or standard-library closure differs from OCIO provenance.',
	);
	requireCondition(hashes.ocioWheel === ocio.wheel.sha256, 'OCIO wheel digest differs from provenance.');
	requireCondition(
		ocioInstallInventory.fileCount === ocio.completeInstallInventory?.fileCount &&
			ocioInstallInventory.totalBytes === ocio.completeInstallInventory?.totalBytes &&
			ocioInstallInventory.aggregateSha256 === ocio.completeInstallInventory?.aggregateSha256,
		'Complete pinned OCIO installation differs from provenance.',
	);
	for (const entry of ocio.installedExecutionClosure) {
		const absolutePath = path.join(OCIO_INSTALL_ROOT, ...entry.path.split('/'));
		requireCondition(
			(await sha256File(absolutePath)) === entry.sha256,
			`OCIO installed execution file digest differs from provenance: ${entry.path}`,
		);
	}
	for (const entry of [...aces.license.files, ...aces.referenceClosure.libraries]) {
		const absolutePath = path.join(ACES_REFERENCE_ROOT, ...entry.path.split('/'));
		requireCondition(
			(await sha256File(absolutePath)) === entry.sha256,
			`Pinned ACES file digest differs from provenance: ${entry.path}`,
		);
	}
	const selected = aces.referenceClosure.outputCandidates.find(
		(entry) => entry.id === 'rec709-d65-100nit-srgb-piecewise',
	);
	requireCondition(
		hashes.selectedOutputCtl === selected?.sha256,
		'Official sRGB output CTL digest differs from provenance.',
	);
	requireCondition(
		hashes.brunetonTable === bruneton.sources?.publishedModels?.containedCanonicalSha256,
		'Contained Bruneton model digest differs from provenance.',
	);
	requireCondition(
		hashes.brunetonGpuTable === bruneton.sources?.productionGpu?.sha256,
		'Contained production GPU table digest differs from provenance.',
	);
	requireCondition(
		hashes.cieTable === bruneton.sources?.cie1931?.sha256,
		'Contained CIE table digest differs from provenance.',
	);
	sealedPythonRuntimeInventory = pythonRuntimeInventory;
	sealedPythonRuntimeFiles = absoluteInventoryMap(PYTHON_RUNTIME_ROOT, pythonRuntimeInventory);
	sealedOcioInstallFiles = absoluteInventoryMap(OCIO_INSTALL_ROOT, ocioInstallInventory);
	return {
		aces,
		ctl,
		ctlPatch,
		ocio,
		bruneton,
		hashes,
		pythonRuntimeInventory,
		ocioInstallInventory,
	};
}

async function compileExrHelper(run, compilerTemporaryDirectory, logs) {
	const outputPath = path.join(run.runDirectory, 'work', 'exr-rgba-f32');
	const result = await runWsl([
		'env',
		`TMPDIR=${windowsPathToWsl(compilerTemporaryDirectory)}`,
		'c++',
		'-std=c++17',
		'-O2',
		'-pipe',
		windowsPathToWsl(CPP_HELPER_PATH),
		'-o',
		windowsPathToWsl(outputPath),
		'-I/usr/include/OpenEXR',
		'-pthread',
		'-I/usr/include/Imath',
		'-lOpenEXR-3_1',
		'-lOpenEXRUtil-3_1',
		'-lOpenEXRCore-3_1',
		'-lIex-3_1',
		'-lIlmThread-3_1',
		'-lImath-3_1',
	]);
	logs.push({id: 'compile-exr-helper', ...result});
	return outputPath;
}

async function hashWslFile(filePath, label) {
	const realPath = (await runWsl(['readlink', '-f', filePath])).stdout.trim();
	requireCondition(realPath.startsWith('/'), `${label} real path is unresolved.`);
	const digest = await runWsl(['sha256sum', '--', realPath]);
	const sha256 = /^([a-f0-9]{64})\s+/u.exec(digest.stdout)?.[1];
	requireCondition(sha256, `${label} digest is unresolved.`);
	return {path: realPath, sha256};
}

async function resolveCompilerProgram(programName) {
	const reported = (await runWsl(['c++', `-print-prog-name=${programName}`])).stdout.trim();
	requireCondition(reported.length > 0, `WSL compiler program ${programName} is unresolved.`);
	const resolved = reported.startsWith('/') ? reported : (await runWsl(['which', reported])).stdout.trim();
	return {name: programName, ...(await collectWslDynamicClosure(resolved, `WSL compiler program ${programName}`))};
}

async function resolveWslProgram(programName) {
	const resolved = (await runWsl(['which', programName])).stdout.trim();
	requireCondition(resolved.startsWith('/'), `WSL process utility ${programName} is unresolved.`);
	return {name: programName, ...(await collectWslDynamicClosure(resolved, `WSL process utility ${programName}`))};
}

async function hashWslFiles(filePaths, label) {
	const digests = [];
	for (let start = 0; start < filePaths.length; start += 100) {
		const output = await runWsl(['sha256sum', '--', ...filePaths.slice(start, start + 100)], {
			timeout: 120000,
		});
		digests.push(
			...output.stdout
				.trim()
				.split(/\r?\n/u)
				.map((line) => {
					const match = /^([a-f0-9]{64})\s+(.+)$/u.exec(line);
					requireCondition(match, `Cannot parse ${label} digest: ${line}`);
					return {path: match[2], sha256: match[1]};
				}),
		);
	}
	return digests;
}

async function collectCompilerDependencyClosure(compilerTemporaryDirectory) {
	const dependencyResult = await runWsl([
		'env',
		`TMPDIR=${windowsPathToWsl(compilerTemporaryDirectory)}`,
		'c++',
		'-std=c++17',
		'-O2',
		'-pipe',
		'-pthread',
		'-I/usr/include/OpenEXR',
		'-I/usr/include/Imath',
		'-M',
		windowsPathToWsl(CPP_HELPER_PATH),
	]);
	const flattened = dependencyResult.stdout.replace(/\\\r?\n/gu, ' ');
	const separator = flattened.indexOf(':');
	requireCondition(separator >= 0, 'WSL compiler dependency output is malformed.');
	const dependencyPaths = [
		...new Set(
			flattened
				.slice(separator + 1)
				.trim()
				.split(/\s+/u)
				.filter((entry) => entry.startsWith('/')),
		),
	].sort(compareStrings);
	requireCondition(dependencyPaths.length > 0, 'WSL compiler dependency closure is empty.');
	return hashWslFiles(dependencyPaths, 'WSL compiler dependency');
}

async function collectWslDynamicClosure(executablePath, label = 'WSL executable') {
	const executableWslPath = executablePath.startsWith('/') ? executablePath : windowsPathToWsl(executablePath);
	const [executableDigest, ldd] = await Promise.all([
		runWsl(['sha256sum', '--', executableWslPath]),
		runWsl(['ldd', executableWslPath]),
	]);
	const executableSha256 = /^([a-f0-9]{64})\s+/u.exec(executableDigest.stdout)?.[1];
	requireCondition(executableSha256, `Cannot hash WSL executable ${executableWslPath}.`);
	requireCondition(!ldd.stdout.includes('not found'), `${label} has an unresolved dynamic library.`);
	const libraryPaths = [
		...new Set(
			ldd.stdout.split(/\r?\n/u).flatMap((line) => {
				const match = /(?:=>\s+)?(\/[^\s]+)(?:\s|$)/u.exec(line);
				return match ? [match[1]] : [];
			}),
		),
	].sort(compareStrings);
	const libraries = [];
	for (const libraryPath of libraryPaths) {
		const digest = await runWsl(['sha256sum', '--', libraryPath]);
		const match = /^([a-f0-9]{64})\s+/u.exec(digest.stdout);
		requireCondition(match, `Cannot hash WSL dynamic library ${libraryPath}.`);
		libraries.push({path: libraryPath, sha256: match[1]});
	}
	return {executable: executableWslPath, executableSha256, ldd: ldd.stdout, libraries};
}

async function collectWslExecutionIdentity(exrHelperPath, ctlProvenance, compilerTemporaryDirectory) {
	// Start the default distribution before reading the Windows-side list. The
	// raw list is evidence, but its volatile STATE column is not an identity.
	await runWsl(['true']);
	const [
		distributionList,
		distributionNames,
		wslStatus,
		osRelease,
		uname,
		compilerVersion,
		compilerPathResult,
		compilerSearchDirectories,
		compilerSpecs,
	] = await Promise.all([
		runProcess('wsl.exe', ['--list', '--verbose']),
		runProcess('wsl.exe', ['--list', '--quiet']),
		runProcess('wsl.exe', ['--status']),
		runWsl(['cat', '/etc/os-release']),
		runWsl(['uname', '-a']),
		runWsl(['c++', '--version']),
		runWsl(['which', 'c++']),
		runWsl(['c++', '-print-search-dirs']),
		runWsl(['c++', '-dumpspecs']),
	]);
	const compilerPath = compilerPathResult.stdout.trim();
	requireCondition(compilerPath.startsWith('/'), 'WSL compiler path is unresolved.');
	const compilerDriver = await collectWslDynamicClosure(compilerPath, 'WSL compiler driver');
	const compilerPrograms = await Promise.all(
		['cc1plus', 'as', 'collect2', 'ld'].map((programName) => resolveCompilerProgram(programName)),
	);
	const processUtilities = await Promise.all(
		['env', 'prlimit', 'timeout'].map((programName) => resolveWslProgram(programName)),
	);
	requireCondition(
		osRelease.stdout.includes('PRETTY_NAME="Ubuntu 24.04.4 LTS"') &&
			uname.stdout.toLowerCase().includes('microsoft'),
		`WSL distribution differs from ${ctlProvenance.build.environment}.`,
	);
	const expectedPackages = {
		...ctlProvenance.build.packages,
		...ctlProvenance.build.exrHelperCompilerPackages,
	};
	const packages = {};
	for (const [packageName, expectedVersion] of Object.entries(expectedPackages)) {
		const version = (await runWsl(['dpkg-query', '-W', '-f=${Version}', packageName])).stdout.trim();
		requireCondition(version === expectedVersion, `WSL package ${packageName} differs from pinned provenance.`);
		packages[packageName] = version;
	}
	const verifiedPackages = Object.keys(expectedPackages).sort(compareStrings);
	const packageVerification = await runWsl(['dpkg', '--verify', ...verifiedPackages]);
	requireCondition(
		packageVerification.stdout.trim() === '',
		'WSL compiler/OpenEXR/Imath package files fail dpkg verification.',
	);
	const compilerDependencies = await collectCompilerDependencyClosure(compilerTemporaryDirectory);
	const normalizedDistributionNames = normalizeWslText(distributionNames.stdout)
		.split('\n')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.sort(compareStrings);
	const normalizedWslStatus = normalizeWslText(wslStatus.stdout);
	const defaultDistribution = /^Default Distribution:\s*(.+)$/mu.exec(normalizedWslStatus)?.[1];
	requireCondition(defaultDistribution, 'Default WSL distribution identity is unresolved.');
	const distributionVersions = parseWslDistributionVersions(distributionList.stdout);
	requireCondition(
		distributionVersions.length === normalizedDistributionNames.length &&
			distributionVersions.every(({name}) => normalizedDistributionNames.includes(name)),
		'WSL distribution version identities are incomplete.',
	);
	const defaultDistributionVersion = distributionVersions.find(({name}) => name === defaultDistribution)?.version;
	requireCondition(
		defaultDistributionVersion === 2,
		'The pinned CTL toolchain requires the default distribution to use WSL2.',
	);
	return {
		distributionList: distributionList.stdout,
		distributions: normalizedDistributionNames,
		distributionVersions,
		wslStatus: normalizedWslStatus,
		defaultDistribution,
		osRelease: osRelease.stdout,
		uname: uname.stdout.trim(),
		compiler: {
			version: compilerVersion.stdout,
			...compilerDriver,
			programs: compilerPrograms,
			searchDirectories: compilerSearchDirectories.stdout,
			specsSha256: sha256Text(compilerSpecs.stdout),
		},
		processUtilities,
		packages,
		compilerDependencies,
		packageVerification: {
			command: `dpkg --verify ${verifiedPackages.join(' ')}`,
			output: packageVerification.stdout,
		},
		ctlrenderUnpatched: await collectWslDynamicClosure(CTL_UNPATCHED_EXECUTABLE_PATH),
		ctlrender: await collectWslDynamicClosure(CTL_EXECUTABLE_PATH),
		exrHelper: exrHelperPath === null ? null : await collectWslDynamicClosure(exrHelperPath),
	};
}

function comparableWslToolchainIdentity(identity) {
	return {
		distributions: identity.distributions,
		distributionVersions: identity.distributionVersions,
		defaultDistribution: identity.defaultDistribution,
		osRelease: identity.osRelease,
		uname: identity.uname,
		compiler: {
			version: identity.compiler.version,
			executable: identity.compiler.executable,
			executableSha256: identity.compiler.executableSha256,
			libraries: identity.compiler.libraries,
			programs: identity.compiler.programs.map(({name, executable, executableSha256, libraries}) => ({
				name,
				executable,
				executableSha256,
				libraries,
			})),
			searchDirectories: identity.compiler.searchDirectories,
			specsSha256: identity.compiler.specsSha256,
		},
		processUtilities: identity.processUtilities.map(({name, executable, executableSha256, libraries}) => ({
			name,
			executable,
			executableSha256,
			libraries,
		})),
		packages: identity.packages,
		compilerDependencies: identity.compilerDependencies,
		packageVerification: identity.packageVerification,
		ctlrenderUnpatched: {
			executable: identity.ctlrenderUnpatched.executable,
			executableSha256: identity.ctlrenderUnpatched.executableSha256,
			libraries: identity.ctlrenderUnpatched.libraries,
		},
		ctlrender: {
			executable: identity.ctlrender.executable,
			executableSha256: identity.ctlrender.executableSha256,
			libraries: identity.ctlrender.libraries,
		},
	};
}

function comparableWslExecutionIdentity(identity) {
	return {
		...comparableWslToolchainIdentity(identity),
		exrHelper: {
			executable: identity.exrHelper.executable,
			executableSha256: identity.exrHelper.executableSha256,
			libraries: identity.exrHelper.libraries,
		},
	};
}

async function rawToExr(helperPath, rawPath, width, height, exrPath, logs, id) {
	const result = await runWsl([
		windowsPathToWsl(helperPath),
		'write',
		windowsPathToWsl(rawPath),
		String(width),
		String(height),
		windowsPathToWsl(exrPath),
	]);
	logs.push({id: `${id}:raw-to-exr`, ...result});
}

async function exrToRaw(helperPath, exrPath, rawPath, logs, id) {
	const result = await runWsl([
		windowsPathToWsl(helperPath),
		'read',
		windowsPathToWsl(exrPath),
		windowsPathToWsl(rawPath),
	]);
	logs.push({id: `${id}:exr-to-raw`, ...result});
}

async function runCtl(inputExr, outputExr, scripts, logs, id) {
	const result = await runWsl(
		[
			'prlimit',
			'--core=0',
			'--',
			'env',
			`CTL_MODULE_PATH=${windowsPathToWsl(CORE_LIBRARY_ROOT)}`,
			windowsPathToWsl(CTL_EXECUTABLE_PATH),
			'-quiet',
			'-format',
			'exr32',
			...scripts.flatMap((script) => ['-ctl', windowsPathToWsl(script)]),
			windowsPathToWsl(inputExr),
			windowsPathToWsl(outputExr),
		],
		{timeout: 0, cwd: path.dirname(outputExr)},
	);
	logs.push({id, ...result});
}

async function pathExists(filePath) {
	try {
		await lstat(filePath);
		return true;
	} catch (error) {
		if (error?.code === 'ENOENT') return false;
		throw error;
	}
}

function quantizeQ8(value) {
	return Number.isFinite(value) ? Math.round(255 * Math.max(0, Math.min(1, value))) : null;
}

async function runCtlRuntimePreflight(run, helperPath, ctlPatch, fixture, logs) {
	const records = ctlPatch.requiredPreflight.inputRecords.map((entry) => ({
		id: `ctl-preflight-${entry.id}`,
		sceneRgb: entry.rgb,
	}));
	const base = path.join(run.runDirectory, 'work', 'ctl-runtime-preflight');
	const rawInput = `${base}-input.rgba32f`;
	const inputExr = `${base}-input.exr`;
	const negativeOutputExr = `${base}-unpatched-negative.exr`;
	const positiveOutputExr = `${base}-patched-positive.exr`;
	const positiveOutputRaw = `${base}-patched-positive.rgba32f`;
	const ocioOutputRaw = `${base}-ocio-positive.rgba32f`;
	await run.writeArtifact('work/ctl-runtime-preflight-input.rgba32f', encodeReferenceGrid(records));
	await rawToExr(helperPath, rawInput, records.length, 1, inputExr, logs, 'ctl-runtime-preflight');

	let negativeFailure = null;
	try {
		await runWsl(
			[
				'prlimit',
				'--core=0',
				'--',
				'timeout',
				'--signal=TERM',
				'--kill-after=5s',
				'30s',
				'env',
				`CTL_MODULE_PATH=${windowsPathToWsl(CORE_LIBRARY_ROOT)}`,
				windowsPathToWsl(CTL_UNPATCHED_EXECUTABLE_PATH),
				'-quiet',
				'-format',
				'exr32',
				'-ctl',
				windowsPathToWsl(WRAPPER_PATH),
				'-ctl',
				windowsPathToWsl(SRGB_OUTPUT_CTL_PATH),
				windowsPathToWsl(inputExr),
				windowsPathToWsl(negativeOutputExr),
			],
			{timeout: 60000, cwd: path.dirname(negativeOutputExr)},
		);
	} catch (error) {
		negativeFailure = {
			...serializeError(error),
			code: error?.code ?? null,
			signal: error?.signal ?? null,
			killed: error?.killed ?? false,
			stdout: error?.stdout ?? '',
			stderr: error?.stderr ?? '',
		};
	}
	const negativeOutputExists = await pathExists(negativeOutputExr);
	const expectedCrashSignature = /timeout: the monitored command dumped core/iu;
	requireCondition(
		negativeFailure !== null &&
			negativeFailure.killed === false &&
			!['124', '137', 124, 137].includes(negativeFailure.code) &&
			expectedCrashSignature.test(negativeFailure.stderr) &&
			!negativeOutputExists,
		'Unpatched CTL 1.5.3 did not reproduce the frozen no-output crash phenotype.',
	);
	logs.push({id: 'ctl-runtime-preflight:unpatched-negative', failedAsRequired: true, ...negativeFailure});

	await runCtl(
		inputExr,
		positiveOutputExr,
		[WRAPPER_PATH, SRGB_OUTPUT_CTL_PATH],
		logs,
		'ctl-runtime-preflight:patched-positive',
	);
	await exrToRaw(helperPath, positiveOutputExr, positiveOutputRaw, logs, 'ctl-runtime-preflight:patched-positive');
	const ctlOutput = decodeRgba32f(await readFile(positiveOutputRaw), records.length);
	const knownOutput = ctlPatch.requiredPreflight.knownPatchedOutput;
	let knownOutputMaximumAbsoluteError = 0;
	let knownOutputFailureCount = 0;
	for (let index = 0; index < ctlOutput.length; index += 1) {
		for (let channel = 0; channel < 4; channel += 1) {
			const error = Math.abs(ctlOutput[index][channel] - knownOutput.rgba[index][channel]);
			knownOutputMaximumAbsoluteError = Math.max(knownOutputMaximumAbsoluteError, error);
			if (!Number.isFinite(error) || error > knownOutput.absoluteTolerance) knownOutputFailureCount += 1;
		}
	}
	await runPinnedOcio(
		rawInput,
		records.length,
		1,
		ocioOutputRaw,
		'final',
		logs,
		'ctl-runtime-preflight:ocio-positive',
	);
	const ocioOutput = decodeRgba32f(await readFile(ocioOutputRaw), records.length);
	const floatParity = evaluateOcioParity(ctlOutput, ocioOutput, fixture);
	let q8MismatchCount = 0;
	for (let index = 0; index < records.length; index += 1) {
		for (let channel = 0; channel < 3; channel += 1) {
			if (quantizeQ8(ctlOutput[index][channel]) !== quantizeQ8(ocioOutput[index][channel])) {
				q8MismatchCount += 1;
			}
		}
	}
	const passed = knownOutputFailureCount === 0 && floatParity.passed && q8MismatchCount === 0;
	requireCondition(passed, 'Patched CTL known-result, OCIO float, or exact-Q8 preflight failed.');
	return {
		passed,
		recordCount: records.length,
		unpatchedNegative: {
			passed: true,
			claimLimit:
				'This control reproduces the sealed old-executable no-output crash phenotype; the exact source differential and patched-tool provenance carry the instruction-cap attribution.',
			timeoutSeconds: 30,
			expectedFailureSignature: 'timeout: the monitored command dumped core',
			coreDumpPolicy: 'prlimit --core=0',
			workingDirectory: toRepositoryRelativePath(path.dirname(negativeOutputExr)),
			outputCreated: negativeOutputExists,
			failure: negativeFailure,
		},
		patchedKnownResult: {
			passed: knownOutputFailureCount === 0,
			maximumAbsoluteError: knownOutputMaximumAbsoluteError,
			tolerance: knownOutput.absoluteTolerance,
			failureCount: knownOutputFailureCount,
		},
		ctlVersusOcioFloat: floatParity,
		finalQ8: {passed: q8MismatchCount === 0, mismatchCount: q8MismatchCount},
	};
}

async function runPinnedOcio(rawInput, width, height, outputRaw, mode, logs, id) {
	requireCondition(
		sealedPythonRuntimeInventory !== null &&
			sealedPythonRuntimeFiles instanceof Map &&
			sealedOcioInstallFiles instanceof Map,
		'Python and OCIO inventories were not sealed before execution.',
	);
	const pythonRuntimeBefore = await createPythonRuntimeInventory();
	assertFileInventoriesEqual(
		sealedPythonRuntimeInventory,
		pythonRuntimeBefore,
		'Pre-launch Python runtime inventory',
	);
	const bootstrap = [
		'import runpy,sys',
		`sys.path.insert(0,${JSON.stringify(OCIO_INSTALL_ROOT)})`,
		`sys.argv=[${JSON.stringify(OCIO_HELPER_PATH)},*sys.argv[1:]]`,
		`runpy.run_path(${JSON.stringify(OCIO_HELPER_PATH)},run_name='__main__')`,
	].join(';');
	const ocioResult = await runProcess(
		PYTHON_EXECUTABLE_PATH,
		['-I', '-S', '-B', '-c', bootstrap, rawInput, String(width), String(height), outputRaw, mode],
		{
			timeout: 0,
			env: isolatedPythonEnvironment(path.dirname(outputRaw)),
		},
	);
	const ocioExecution = JSON.parse(ocioResult.stdout);
	requireCondition(ocioExecution.ocioVersion === '2.4.2', 'Executed OCIO version is not 2.4.2.');
	requireCondition(
		/^3\.10\.1\b/u.test(ocioExecution.pythonVersion) &&
			pathComparisonKey(ocioExecution.pythonExecutable) === pathComparisonKey(PYTHON_EXECUTABLE_PATH) &&
			ocioExecution.pythonFlags?.isolated === 1 &&
			ocioExecution.pythonFlags?.noSite === 1 &&
			ocioExecution.pythonFlags?.noUserSite === 1 &&
			ocioExecution.pythonFlags?.dontWriteBytecode === 1,
		'Executed OCIO Python runtime is not the isolated frozen CPython 3.10.1 runtime.',
	);
	const expectedPythonPath = [
		OCIO_INSTALL_ROOT,
		path.join(PYTHON_RUNTIME_ROOT, 'python310.zip'),
		path.join(PYTHON_RUNTIME_ROOT, 'DLLs'),
		path.join(PYTHON_RUNTIME_ROOT, 'Lib'),
		PYTHON_RUNTIME_ROOT,
	].map(pathComparisonKey);
	requireCondition(
		JSON.stringify(ocioExecution.pythonPath.map(pathComparisonKey)) === JSON.stringify(expectedPythonPath),
		'Isolated Python search-path roots differ from the sealed runtime contract.',
	);
	const helperKey = pathComparisonKey(OCIO_HELPER_PATH);
	const helperSha256 = await sha256File(OCIO_HELPER_PATH);
	const importArtifacts = [];
	for (const artifact of ocioExecution.pythonImportArtifacts) {
		const artifactKey = pathComparisonKey(artifact.path);
		const roles = [...artifact.roles].sort(compareStrings);
		requireCondition(
			roles.length > 0 && roles.every((role) => role === 'module' || role === 'cache'),
			`Python reported an invalid import-artifact role: ${artifact.path}`,
		);
		const expectedSha256 =
			artifactKey === helperKey
				? helperSha256
				: (sealedPythonRuntimeFiles.get(artifactKey) ?? sealedOcioInstallFiles.get(artifactKey));
		if (artifact.exists) {
			requireCondition(expectedSha256, `Python imported an unsealed file: ${artifact.path}`);
			const observedSha256 = await sha256File(artifact.path);
			requireCondition(observedSha256 === expectedSha256, `Python imported a changed file: ${artifact.path}`);
			importArtifacts.push({path: artifact.path, roles, exists: true, sha256: observedSha256});
		} else {
			requireCondition(
				roles.every((role) => role === 'cache') && !expectedSha256,
				`Python reported a missing module or sealed cache artifact: ${artifact.path}`,
			);
			importArtifacts.push({path: artifact.path, roles, exists: false, sha256: null});
		}
	}
	const loadedOcioDllSha256 = await sha256File(ocioExecution.loadedOcioDllPath);
	requireCondition(
		pathComparisonKey(ocioExecution.loadedOcioDllPath) === pathComparisonKey(OCIO_DLL_PATH) &&
			loadedOcioDllSha256 === sealedOcioInstallFiles.get(pathComparisonKey(OCIO_DLL_PATH)),
		'The loaded native OCIO library differs from the sealed installation.',
	);
	const currentPythonIdentity = {
		path: ocioExecution.pythonExecutable,
		version: ocioExecution.pythonVersion,
		flags: ocioExecution.pythonFlags,
		searchPath: ocioExecution.pythonPath,
		importArtifacts,
		loadedOcioDll: {path: ocioExecution.loadedOcioDllPath, sha256: loadedOcioDllSha256},
	};
	if (executedPythonIdentity === null) executedPythonIdentity = currentPythonIdentity;
	else {
		requireCondition(
			JSON.stringify(executedPythonIdentity) === JSON.stringify(currentPythonIdentity),
			'Python executable identity changed between pinned OCIO evaluations.',
		);
	}
	requireCondition(ocioExecution.mode === mode, `Executed OCIO mode differs from ${mode}.`);
	requireCondition(
		pathComparisonKey(ocioExecution.modulePath) === pathComparisonKey(OCIO_INITIALIZER_PATH) &&
			pathComparisonKey(ocioExecution.extensionPath) === pathComparisonKey(OCIO_PYD_PATH),
		'Python imported an OCIO module outside the sealed installation.',
	);
	logs.push({id, ...ocioResult});
	return ocioExecution;
}

async function transformCtlProbe(run, helperPath, records, scripts, logs, stem) {
	const base = path.join(run.runDirectory, 'work', stem);
	const rawInput = `${base}-input.rgba32f`;
	const inputExr = `${base}-input.exr`;
	const outputExr = `${base}-output.exr`;
	const outputRaw = `${base}-output.rgba32f`;
	await run.writeArtifact(`work/${stem}-input.rgba32f`, encodeReferenceGrid(records));
	await rawToExr(helperPath, rawInput, records.length, 1, inputExr, logs, stem);
	await runCtl(inputExr, outputExr, scripts, logs, `${stem}:official-ctl`);
	await exrToRaw(helperPath, outputExr, outputRaw, logs, stem);
	return decodeRgba32f(await readFile(outputRaw), records.length);
}

async function transformCtlProbeChunks(run, helperPath, records, scripts, logs, stem, concurrency) {
	requireCondition(Number.isSafeInteger(concurrency) && concurrency > 0, 'CTL chunk concurrency is invalid.');
	const chunkSize = Math.ceil(records.length / concurrency);
	const chunks = [];
	for (let startIndex = 0; startIndex < records.length; startIndex += chunkSize) {
		const chunkIndex = chunks.length;
		const chunkRecords = records.slice(startIndex, Math.min(records.length, startIndex + chunkSize));
		const chunkStem = `${stem}-chunk-${String(chunkIndex).padStart(2, '0')}`;
		const base = path.join(run.runDirectory, 'work', chunkStem);
		const rawInput = `${base}-input.rgba32f`;
		const inputExr = `${base}-input.exr`;
		const outputExr = `${base}-output.exr`;
		const outputRaw = `${base}-output.rgba32f`;
		await run.writeArtifact(`work/${chunkStem}-input.rgba32f`, encodeReferenceGrid(chunkRecords));
		await rawToExr(helperPath, rawInput, chunkRecords.length, 1, inputExr, logs, chunkStem);
		chunks.push({
			chunkIndex,
			startIndex,
			recordCount: chunkRecords.length,
			inputExr,
			outputExr,
			outputRaw,
			logs: [],
		});
	}
	const executions = await Promise.allSettled(
		chunks.map((chunk) =>
			runCtl(
				chunk.inputExr,
				chunk.outputExr,
				scripts,
				chunk.logs,
				`${stem}:official-ctl:chunk-${chunk.chunkIndex}`,
			),
		),
	);
	for (const chunk of chunks) logs.push(...chunk.logs);
	const failedExecution = executions.find((execution) => execution.status === 'rejected');
	if (failedExecution) throw failedExecution.reason;
	const output = [];
	for (const chunk of chunks) {
		await exrToRaw(helperPath, chunk.outputExr, chunk.outputRaw, logs, `${stem}:chunk-${chunk.chunkIndex}`);
		output.push(...decodeRgba32f(await readFile(chunk.outputRaw), chunk.recordCount));
	}
	return {
		output,
		execution: {
			strategy: 'contiguous-index chunks through independent sealed ctl-1.5.3 plus f1c75 child processes',
			requestedConcurrency: concurrency,
			actualChunkCount: chunks.length,
			resourcePolicy: {
				maximumChildProcesses: concurrency,
				perChildTimeoutMilliseconds: 1800000,
				stack: 'WSL process default; the sealed f1c75 toolchain patch repairs the instruction guard, not stack size',
				coreDump: 'prlimit --core=0 for every CTL child',
				workingDirectory: 'the run-contained directory owning each output EXR',
				addressSpace: 'WSL host default; no authored memory cap',
				internalThreading: 'none; the sealed ctl-1.5.3 base source declares no thread support',
			},
			mergeOrder: 'ascending original record index',
			chunks: chunks.map(({chunkIndex, startIndex, recordCount}) => ({chunkIndex, startIndex, recordCount})),
		},
	};
}

async function transformCtlOracle(run, helperPath, records, logs, concurrency = 4) {
	const finalTransform = await transformCtlProbeChunks(
		run,
		helperPath,
		records,
		[WRAPPER_PATH, SRGB_OUTPUT_CTL_PATH],
		logs,
		'ctl-oracle-final',
		concurrency,
	);
	const ap1Transform = await transformCtlProbeChunks(
		run,
		helperPath,
		records,
		[WRAPPER_PATH, AP0_TO_AP1_CTL_PATH],
		logs,
		'ctl-oracle-ap1',
		concurrency,
	);
	const rawInput = path.join(run.runDirectory, 'work', 'ctl-oracle-ocio-input.rgba32f');
	const finalRaw = path.join(run.runDirectory, 'work', 'ctl-oracle-ocio-final.rgba32f');
	const ap1Raw = path.join(run.runDirectory, 'work', 'ctl-oracle-ocio-ap1.rgba32f');
	await run.writeArtifact('work/ctl-oracle-ocio-input.rgba32f', encodeReferenceGrid(records));
	const finalExecution = await runPinnedOcio(
		rawInput,
		records.length,
		1,
		finalRaw,
		'final',
		logs,
		'ctl-oracle:pinned-ocio-final',
	);
	const ap1Execution = await runPinnedOcio(
		rawInput,
		records.length,
		1,
		ap1Raw,
		'ap1',
		logs,
		'ctl-oracle:pinned-ocio-ap1',
	);
	return {
		ctl: finalTransform.output,
		ctlAp1: ap1Transform.output,
		ocio: decodeRgba32f(await readFile(finalRaw), records.length),
		ocioAp1: decodeRgba32f(await readFile(ap1Raw), records.length),
		execution: {
			ctlFinal: finalTransform.execution,
			ctlAp1: ap1Transform.execution,
			ocioFinal: finalExecution,
			ocioAp1: ap1Execution,
		},
	};
}

async function transformExhaustiveOcio(run, records, logs) {
	const rawInput = path.join(run.runDirectory, 'work', 'reference-grid-input.rgba32f');
	const finalRaw = path.join(run.runDirectory, 'work', 'reference-grid-ocio-final.rgba32f');
	const ap1Raw = path.join(run.runDirectory, 'work', 'reference-grid-ocio-ap1.rgba32f');
	await run.writeArtifact('work/reference-grid-input.rgba32f', encodeReferenceGrid(records));
	const finalExecution = await runPinnedOcio(
		rawInput,
		records.length,
		1,
		finalRaw,
		'final',
		logs,
		'exhaustive-grid:pinned-ocio-final',
	);
	const ap1Execution = await runPinnedOcio(
		rawInput,
		records.length,
		1,
		ap1Raw,
		'ap1',
		logs,
		'exhaustive-grid:pinned-ocio-ap1',
	);
	return {
		final: decodeRgba32f(await readFile(finalRaw), records.length),
		ap1: decodeRgba32f(await readFile(ap1Raw), records.length),
		execution: {final: finalExecution, ap1: ap1Execution},
	};
}

function jsonSafeRows(rows) {
	return rows.map((row) => row.map((value) => (Number.isFinite(value) ? value : null)));
}

async function probeOfficialTables(run, helperPath, logs, concurrency = 4) {
	const cuspRecords = Array.from({length: 362}, (_, index) => ({
		id: `official-cusp-table-row:${index}`,
		kind: 'official-cusp-table-row',
		sceneRgb: [index, 0, 0],
	}));
	const reachRecords = Array.from({length: 362}, (_, index) => ({
		id: `official-reach-table-row:${index}`,
		kind: 'official-reach-table-row',
		sceneRgb: [index, 1, 0],
	}));
	const tableRecords = [...cuspRecords, ...reachRecords];
	const tableTransform = await transformCtlProbeChunks(
		run,
		helperPath,
		tableRecords,
		[OFFICIAL_TABLE_PROBE_CTL_PATH],
		logs,
		'official-table',
		concurrency,
	);
	const outputRows = tableTransform.output;
	const tableRows = {
		cuspRows: outputRows.slice(0, cuspRecords.length),
		reachRows: outputRows.slice(cuspRecords.length),
	};
	const tableGate = evaluateOfficialTableProbe(tableRows);
	if (tableGate.nonFiniteCount > 0) {
		return {
			table: tableGate,
			boundaries: {
				passed: false,
				evaluated: false,
				reason: 'Official table output is non-finite; boundary inputs cannot be constructed.',
				probeCount: 0,
				boundaryCount: 0,
				nonFiniteCount: tableGate.nonFiniteCount,
				failedBoundaryCount: 0,
			},
			tableRows: {
				cuspRows: jsonSafeRows(tableRows.cuspRows),
				reachRows: jsonSafeRows(tableRows.reachRows),
			},
			boundaryProbeCount: 0,
			tableExecution: tableTransform.execution,
		};
	}

	const boundaryRecords = buildOfficialTableBoundaryProbes(tableRows);
	const boundaryTransform = await transformCtlProbeChunks(
		run,
		helperPath,
		boundaryRecords,
		[OFFICIAL_GAMUT_PROBE_CTL_PATH],
		logs,
		'official-boundary',
		concurrency,
	);
	return {
		table: tableGate,
		boundaries: evaluateOfficialTableBoundaries(boundaryRecords, boundaryTransform.output),
		tableRows: {
			cuspRows: jsonSafeRows(tableRows.cuspRows),
			reachRows: jsonSafeRows(tableRows.reachRows),
		},
		boundaryProbeCount: boundaryRecords.length,
		tableExecution: tableTransform.execution,
		boundaryExecution: boundaryTransform.execution,
	};
}

async function probeOfficialGpuTables(run, helperPath, logs, concurrency = 4) {
	const records = [
		...Array.from({length: 362}, (_, index) => ({
			id: `official-gpu-cusp-table-row:${index}`,
			kind: 'official-gpu-cusp-table-row',
			sceneRgb: [index, 0, 0],
		})),
		...Array.from({length: 362}, (_, index) => ({
			id: `official-gpu-reach-table-row:${index}`,
			kind: 'official-gpu-reach-table-row',
			sceneRgb: [index, 1, 0],
		})),
	];
	const transformed = await transformCtlProbeChunks(
		run,
		helperPath,
		records,
		[OFFICIAL_GPU_TABLE_PROBE_CTL_PATH],
		logs,
		'official-gpu-table',
		concurrency,
	);
	return {
		cuspRows: transformed.output.slice(0, 362),
		reachRows: transformed.output.slice(362),
		execution: transformed.execution,
	};
}

async function probeModelContinuity(run, helperPath, records, logs) {
	const requiredSeams = new Set(['negative-blue', 'upper-gamut-color', 'official-forward-limit']);
	const seamRecords = records.filter((record) => requiredSeams.has(record.seamId));
	const output = await transformCtlProbe(
		run,
		helperPath,
		seamRecords,
		[WRAPPER_PATH, OFFICIAL_MODEL_PROBE_CTL_PATH],
		logs,
		'official-model-continuity',
	);
	return evaluateModelContinuity(seamRecords, output);
}

async function probeEncodingBranches(run, helperPath, fixture, logs) {
	const records = buildEncodingBranchProbes(fixture);
	const output = await transformCtlProbe(
		run,
		helperPath,
		records,
		[OFFICIAL_SRGB_ENCODING_PROBE_CTL_PATH],
		logs,
		'official-srgb-encoding-branches',
	);
	return evaluateEncodingBranchProbes(records, output);
}

async function createCandidatePreviews(run, frames, logs) {
	const captures = [];
	for (const frame of frames) {
		const safeId = `${frame.pointer.family}-${frame.pointer.conditionId}`
			.replace(/[^a-z0-9-]+/giu, '-')
			.toLowerCase();
		const outputRaw = path.join(run.runDirectory, 'work', `${safeId}-aces-srgb.rgba32f`);
		await runPinnedOcio(
			frame.absolutePath,
			frame.width,
			frame.height,
			outputRaw,
			'final',
			logs,
			`${safeId}:pinned-ocio-after-ctl-parity`,
		);
		const output = decodeRgba32f(await readFile(outputRaw), frame.width * frame.height);
		requireCondition(
			output.every((pixel) => pixel.slice(0, 3).every(Number.isFinite)),
			`Candidate preview ${safeId} is non-finite.`,
		);
		const png = encodeCandidatePng(output, frame.width, frame.height, frame.pointer.rowOrigin);
		const artifactPath = `captures/${safeId}-aces2-srgb.png`;
		await run.writeArtifact(artifactPath, png);
		captures.push({
			conditionId: frame.pointer.conditionId,
			family: frame.pointer.family,
			inputPairedArtifact: frame.artifactPath,
			width: frame.width,
			height: frame.height,
			rowOrigin: 'top-left',
			encoding:
				'8-bit final sRGB-piecewise codes from pinned OCIO after bounded official-CTL float/Q8 parity; direct storage',
			artifactPath,
		});
	}
	return captures;
}

function reportText(runId, conclusion, evidence) {
	return `# ${runId}: pinned ACES 2 Sun-appearance reference decision

Conclusion: **${conclusion}**

- Paired prerequisite: \`${evidence.pairedRunId}\`, terminal accepted and reverified.
- Output contract: direct code storage; official sRGB-piecewise CTL selected. Automatic sRGB OETF would reject to prevent double encoding.
- Synthetic grid: ${evidence.gridRecordCount} values through signed coordinates, measured inputs, neutrals, hue/saturation sweeps, clamp boundaries, and seams.
- Bounded official CTL / pinned OCIO authority gate: ${evidence.gates.ctlOracle.passed ? 'accepted' : 'rejected'} across ${evidence.gates.ctlOracle.recordCount} frozen records; max final absolute error ${evidence.gates.ctlOracle.finalFloat.maximumAbsoluteError}; exact Q8 mismatches ${evidence.gates.ctlOracle.finalQ8.mismatchCount}.
- Exhaustive evaluator: pinned OCIO only after the CTL authority gate; ${evidence.gates.exhaustiveImplementation.recordCount} records.
- Encoding/Q8 branches: ${evidence.gates.encodingBranches.passed ? 'accepted' : 'rejected'}; model J/M/h continuity: ${evidence.gates.modelContinuity.passed ? 'accepted' : 'rejected'}.
- Finite, clamp, tone-order, and continuity gates on the exhaustive grid: ${evidence.gates.synthetic.passed ? 'accepted' : 'rejected'}.
- Exact pinned-core hue/cusp/reach tables and boundaries: ${evidence.gates.officialTables.passed ? 'accepted' : 'rejected'}; ${evidence.gates.officialTables.table.rowCount} table rows and ${evidence.gates.officialTables.boundaries.probeCount} two-sided probes.
- Sealed disk/sky ordering and Q8 gate: ${evidence.gates.pairs.passed ? 'accepted' : 'rejected'} across ${evidence.gates.pairs.comparisonCount} transformed observations.
- Matched Bruneton non-regression: ${evidence.gates.brunetonNonRegression.passed ? 'accepted' : 'rejected'} across ${evidence.gates.brunetonNonRegression.pairCount} exact run-235 spectral pairs; transformed display RGB RMSE ${evidence.gates.brunetonNonRegression.metrics.rgbRmse}, physical mean u-prime/v-prime distance ${evidence.gates.brunetonNonRegression.metrics.meanUPrimeVPrimeDistance}, and physical mean absolute relative luminance error ${evidence.gates.brunetonNonRegression.metrics.meanAbsoluteRelativeLuminanceError}. Transformed target u-prime/v-prime and luminance metrics are reported separately without misusing the physical bounds.
- Tracked strict Bruneton sky-color gate: ${evidence.gates.trackedBrunetonGate.passed ? 'accepted' : 'rejected'} and reported separately from the offline candidate non-regression decision.
- Candidate previews: ${evidence.captures.length}; emitted only after all numerical gates passed.
- Claim limit: this is the one frozen 100-nit Rec.709/D65 ACES 2 reference decision, not a mapper comparison or production implementation.
`;
}

async function buildHashedRuntimeClosure() {
	const closure = await buildStaticModuleClosure({
		candidateRoot: EXPERIMENT_ROOT,
		entryFiles: ['runners/run-aces2-sun-appearance-reference-decision.js'],
		packageJsonPath: EXPERIMENT_PACKAGE_PATH,
		nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
		allowedNodeBuiltins: [
			'node:child_process',
			'node:crypto',
			'node:fs',
			'node:fs/promises',
			'node:module',
			'node:os',
			'node:path',
			'node:url',
			'node:util',
			'node:zlib',
		],
	});
	return {
		...closure,
		fileInventory: await createSelectedFileInventory(EXPERIMENT_ROOT, closure.files),
		packageJsonSha256: await sha256File(EXPERIMENT_PACKAGE_PATH),
		packageLockSha256: await sha256File(EXPERIMENT_PACKAGE_LOCK_PATH),
	};
}

async function verifyPostExecutionIdentity(seal) {
	const evidence = {};
	if (seal.controlsBefore) {
		evidence.controls = await createSelectedFileInventory(EXPERIMENT_ROOT, CONTROL_PATHS);
		requireCondition(
			JSON.stringify(seal.controlsBefore) === JSON.stringify(evidence.controls),
			'Executed Step 5.3/5.4 controls changed during the decision.',
		);
	}
	if (seal.referencesBefore) {
		evidence.provenance = await validateReferences();
		requireCondition(
			JSON.stringify(seal.referencesBefore.hashes) === JSON.stringify(evidence.provenance.hashes),
			'Pinned executable/reference hashes changed during the decision.',
		);
	}
	if (seal.acesInventoryBefore) {
		evidence.acesPackage = await createFileInventory(ACES_PACKAGE_ROOT);
		requireCondition(
			JSON.stringify(seal.acesInventoryBefore) === JSON.stringify(evidence.acesPackage),
			'Pinned ACES package changed during the decision.',
		);
	}
	if (seal.paired) {
		evidence.pairedVerification = await verifyRun(seal.paired.runDirectory);
		requireCondition(
			evidence.pairedVerification.artifactSetSha256 === seal.paired.verification.artifactSetSha256 &&
				(await sha256File(path.join(seal.paired.runDirectory, 'artifact-manifest.json'))) ===
					seal.paired.artifactManifestSha256,
			'Paired prerequisite changed during the decision.',
		);
	}
	if (seal.runtimeClosureBefore) {
		evidence.runtimeClosure = await buildHashedRuntimeClosure();
		requireCondition(
			JSON.stringify(seal.runtimeClosureBefore) === JSON.stringify(evidence.runtimeClosure),
			'Executed static module closure or dependency lock changed during the decision.',
		);
	}
	if (seal.protectedBefore && seal.containmentPolicy) {
		evidence.protectedWorkingTree = await verifyProtectedWorkingTree(seal.protectedBefore, seal.containmentPolicy);
	}
	if ((seal.wslToolchainBefore || seal.wslExecutionBefore) && seal.ctlProvenance) {
		evidence.wslExecution = await collectWslExecutionIdentity(
			seal.exrHelperPath ?? null,
			seal.ctlProvenance,
			seal.compilerTemporaryDirectory,
		);
		if (seal.wslToolchainBefore) {
			requireCondition(
				JSON.stringify(comparableWslToolchainIdentity(seal.wslToolchainBefore)) ===
					JSON.stringify(comparableWslToolchainIdentity(evidence.wslExecution)),
				'WSL compiler, package, header, ctlrender, or library identity changed after its pre-compile seal.',
			);
		}
		if (seal.wslExecutionBefore) {
			requireCondition(
				JSON.stringify(comparableWslExecutionIdentity(seal.wslExecutionBefore)) ===
					JSON.stringify(comparableWslExecutionIdentity(evidence.wslExecution)),
				'WSL compiler, package, executable, or dynamic-library execution closure changed during the decision.',
			);
		}
	}
	if (executedPythonIdentity !== null) {
		evidence.pythonExecution = {
			...executedPythonIdentity,
			executableSha256: await sha256File(executedPythonIdentity.path),
			importArtifacts: await Promise.all(
				executedPythonIdentity.importArtifacts.map(async (entry) => ({
					...entry,
					sha256: entry.exists ? await sha256File(entry.path) : null,
					exists: await pathExists(entry.path),
				})),
			),
			loadedOcioDll: {
				path: executedPythonIdentity.loadedOcioDll.path,
				sha256: await sha256File(executedPythonIdentity.loadedOcioDll.path),
			},
		};
		requireCondition(
			evidence.pythonExecution.executableSha256 === seal.referencesBefore?.ocio.pythonRuntime.executableSha256 &&
				JSON.stringify(evidence.pythonExecution.importArtifacts) ===
					JSON.stringify(executedPythonIdentity.importArtifacts) &&
				JSON.stringify(evidence.pythonExecution.loadedOcioDll) ===
					JSON.stringify(executedPythonIdentity.loadedOcioDll),
			'Python executable, imported artifacts, or loaded OCIO library changed during pinned OCIO evaluation.',
		);
	}
	return evidence;
}

// The first-view GPU runner reuses this exact sealed numerical authority in the
// same process. Importing this module does not allocate or execute a run because
// main remains guarded by the entry-point identity check below.
export {
	collectWslExecutionIdentity,
	comparableWslExecutionIdentity,
	comparableWslToolchainIdentity,
	compileExrHelper,
	probeEncodingBranches,
	probeOfficialGpuTables,
	probeModelContinuity,
	probeOfficialTables,
	runCtlRuntimePreflight,
	transformCtlOracle,
	transformExhaustiveOcio,
	validateDecisionFixture,
	validateReferences,
	validateTrackedBrunetonFixture,
};

export function setReferenceDecisionProgressReporter(reporter) {
	referenceProgressReporter = typeof reporter === 'function' ? reporter : async () => {};
}

async function main() {
	if (process.argv.length > 3) {
		throw new Error('Usage: run-aces2-sun-appearance-reference-decision.js [paired-run-id]');
	}
	const selector = process.argv[2] ?? null;
	const run = await initializeRunRecord({
		slug: 'aces2-sun-appearance-reference-decision',
		command: selector ? `${COMMAND} ${selector}` : COMMAND,
		inputs: {
			schemaId: PROOF_ID,
			pairedDiagnostic: selector ?? 'latest-terminal-accepted-production-sun-appearance-paired-diagnostic-v1',
			fixture: toRepositoryRelativePath(FIXTURE_PATH),
			candidate: 'ACES v2.0.0+2025.04.04 / 100-nit Rec.709-D65 / sRGB-piecewise / fixed K',
		},
		provenance: {
			experiment: 'scripts/extraterrestrial',
			acesReleaseCommit: '35e1e6ac2c26ec75433547d5d0a3a881f39bd9f5',
			ctlCommit: 'a63c7ec4c1e3cc2c66df4fd8f2f083d9eb1c2f35',
			ctlToolchainPatchCommit: 'f1c75e0d6a08b46e4eccc1fe0cf62e250e9fbd8b',
			ocioCommit: '6918fad3f5d22ac3ef2397c754bf4268c2b58dd0',
		},
		environment: {
			node: process.version,
			platform: process.platform,
			architecture: process.arch,
			ctlRuntime: 'sealed CTL 1.5.3 base plus the exact official f1c75 instruction-guard repair under WSL2',
			ctlStackPolicy: 'WSL process default; no authored stack override',
			ctlCorePolicy: 'prlimit --core=0 with a run-contained working directory',
			ocioRuntime: 'pinned PyOpenColorIO 2.4.2 CPython 3.10 wheel',
		},
		references: {
			acesProvenance: toRepositoryRelativePath(ACES_PROVENANCE_PATH),
			ctlProvenance: toRepositoryRelativePath(CTL_PROVENANCE_PATH),
			ctlToolchainPatchProvenance: toRepositoryRelativePath(CTL_PATCH_PROVENANCE_PATH),
			ocioProvenance: toRepositoryRelativePath(OCIO_PROVENANCE_PATH),
			brunetonProvenance: toRepositoryRelativePath(BRUNETON_PROVENANCE_PATH),
			selectedOutput: toRepositoryRelativePath(SRGB_OUTPUT_CTL_PATH),
			officialTableProbe: toRepositoryRelativePath(OFFICIAL_TABLE_PROBE_CTL_PATH),
			officialGamutProbe: toRepositoryRelativePath(OFFICIAL_GAMUT_PROBE_CTL_PATH),
			selectionRule: 'direct storage -> sRGB-piecewise CTL; automatic sRGB OETF -> terminal rejection',
		},
	});
	const logs = [];
	const executionSeal = {};
	try {
		await assertRepositoryIdentity();
		const containmentPolicy = await loadContainmentPolicy();
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree');
		executionSeal.containmentPolicy = containmentPolicy;
		const protectedBefore = await captureProtectedWorkingTree(containmentPolicy);
		executionSeal.protectedBefore = protectedBefore;
		const runtimeClosureBefore = await buildHashedRuntimeClosure();
		executionSeal.runtimeClosureBefore = runtimeClosureBefore;
		const controlsBefore = await createSelectedFileInventory(EXPERIMENT_ROOT, CONTROL_PATHS);
		executionSeal.controlsBefore = controlsBefore;
		const referencesBefore = await validateReferences();
		executionSeal.referencesBefore = referencesBefore;
		const acesInventoryBefore = await createFileInventory(ACES_PACKAGE_ROOT);
		executionSeal.acesInventoryBefore = acesInventoryBefore;
		const paired = await resolvePairedEvidence(selector);
		executionSeal.paired = paired;
		const [fixture, strictBrunetonFixture, brunetonText, brunetonProductionText, cieText] = await Promise.all([
			readJson(FIXTURE_PATH),
			readJson(STRICT_BRUNETON_FIXTURE_PATH),
			readFile(BRUNETON_TABLE_PATH, 'utf8'),
			readFile(BRUNETON_GPU_TABLE_PATH, 'utf8'),
			readFile(CIE_TABLE_PATH, 'utf8'),
		]);
		const fixtureValidation = validateDecisionFixture(fixture, referencesBefore);
		const strictBrunetonFixtureValidation = validateTrackedBrunetonFixture(strictBrunetonFixture, referencesBefore);
		const brunetonInputs = collectBrunetonNonRegressionInputs({
			brunetonText,
			productionText: brunetonProductionText,
			cieText,
		});
		const measuredSamples = collectMeasuredSamples(paired.browserEvidence, fixture);
		const frames = await Promise.all(framePointers(paired).map((pointer) => loadFrame(paired, pointer)));
		const frameScan = scanFrames(frames);
		const grid = buildReferenceGrid({
			measuredSamples,
			frameProbes: frameScan.probes,
			frameMaximumNormalized: frameScan.maximumNormalized,
			brunetonInputs,
			fixture,
		});
		const ctlOracleRecords = buildCtlOracleGrid(grid.records);
		await run.writeJsonArtifact('evidence/paired-prerequisite.json', {
			runId: paired.runId,
			verification: paired.verification,
			artifactManifestSha256: paired.artifactManifestSha256,
			fixtureSha256: paired.fixtureSha256,
			result: paired.result,
			gateSummary: Object.fromEntries(
				['outputTransfer', 'pairs', 'convergence', 'rawOrdering', 'artifacts'].map((key) => [
					key,
					paired.gates[key].passed,
				]),
			),
		});
		await run.writeJsonArtifact('evidence/reference-identity-before.json', {
			controls: controlsBefore,
			runtimeClosure: runtimeClosureBefore,
			protectedWorkingTree: protectedBefore,
			acesPackage: acesInventoryBefore,
			provenance: referencesBefore,
			fixtureValidation,
			strictBrunetonFixtureValidation,
		});
		await run.writeJsonArtifact('evidence/reference-grid-summary.json', {
			schemaId: 'aces2-sun-appearance-reference-grid-v1',
			recordCount: grid.records.length,
			ctlOracleRecordCount: ctlOracleRecords.length,
			measuredSampleCount: measuredSamples.length,
			frameProbeCount: frameScan.probes.length,
			brunetonPairCount: brunetonInputs.pairs.length,
			brunetonTransformInputCount: brunetonInputs.records.length,
			measuredMaximumNormalized: grid.measuredMaximumNormalized,
			twoTimesMeasuredMaximumNormalized: grid.twoM,
			fixedSceneScale: FIXED_SCENE_SCALE,
			frameSummaries: frameScan.summaries,
			kindCounts: Object.fromEntries(
				[...new Set(grid.records.map((record) => record.kind))]
					.sort(compareStrings)
					.map((kind) => [kind, grid.records.filter((record) => record.kind === kind).length]),
			),
		});

		// Creating the EXR adapter is generated run output; all authored source stays
		// inside scripts/extraterrestrial and every executable output stays in this run.
		await run.writeArtifact('work/build-root.txt', `${run.runId}\n`);
		const compilerTemporaryDirectory = path.join(run.runDirectory, 'work', 'compiler-tmp');
		await mkdir(compilerTemporaryDirectory, {recursive: false});
		executionSeal.compilerTemporaryDirectory = compilerTemporaryDirectory;
		executionSeal.ctlProvenance = referencesBefore.ctl;
		const wslToolchainBefore = await collectWslExecutionIdentity(
			null,
			referencesBefore.ctl,
			compilerTemporaryDirectory,
		);
		executionSeal.wslToolchainBefore = wslToolchainBefore;
		await run.writeJsonArtifact('evidence/wsl-toolchain-identity-before-compile.json', wslToolchainBefore);
		const exrHelperPath = await compileExrHelper(run, compilerTemporaryDirectory, logs);
		const exrHelperSha256 = await sha256File(exrHelperPath);
		const wslExecutionBefore = await collectWslExecutionIdentity(
			exrHelperPath,
			referencesBefore.ctl,
			compilerTemporaryDirectory,
		);
		requireCondition(
			JSON.stringify(comparableWslToolchainIdentity(wslToolchainBefore)) ===
				JSON.stringify(comparableWslToolchainIdentity(wslExecutionBefore)),
			'WSL compiler, package, header, ctlrender, or library identity changed while compiling the EXR helper.',
		);
		executionSeal.exrHelperPath = exrHelperPath;
		executionSeal.wslExecutionBefore = wslExecutionBefore;
		await run.writeJsonArtifact('evidence/wsl-execution-closure-before.json', wslExecutionBefore);
		const ctlRuntimePreflight = await runCtlRuntimePreflight(
			run,
			exrHelperPath,
			referencesBefore.ctlPatch,
			fixture,
			logs,
		);
		await run.writeJsonArtifact('evidence/ctl-runtime-preflight.json', ctlRuntimePreflight);
		const ctlOracle = await transformCtlOracle(run, exrHelperPath, ctlOracleRecords, logs);
		const ctlOracleGate = evaluateCtlOracleParity({
			records: ctlOracleRecords,
			ctl: ctlOracle.ctl,
			ocio: ctlOracle.ocio,
			ctlAp1: ctlOracle.ctlAp1,
			ocioAp1: ctlOracle.ocioAp1,
			fixture,
		});
		ctlOracleGate.execution = ctlOracle.execution;
		await run.writeJsonArtifact('evidence/ctl-ocio-authority-gate.json', ctlOracleGate);
		if (!ctlOracleGate.passed) {
			throw new TerminalRejection(
				'Bounded official CTL versus pinned OCIO float/Q8 authority gate failed; exhaustive OCIO evaluation is not authorized.',
			);
		}
		const encodingBranches = await probeEncodingBranches(run, exrHelperPath, fixture, logs);
		const modelContinuity = await probeModelContinuity(run, exrHelperPath, grid.records, logs);
		const officialTableProbes = await probeOfficialTables(run, exrHelperPath, logs);
		await run.writeJsonArtifact('evidence/official-table-probes.json', {
			schemaId: 'aces2-official-100nit-table-boundary-probes-v1',
			table: officialTableProbes.table,
			tableRows: officialTableProbes.tableRows,
			tableExecution: officialTableProbes.tableExecution,
			boundaries: officialTableProbes.boundaries,
			boundaryExecution: officialTableProbes.boundaryExecution ?? null,
		});
		const exhaustive = await transformExhaustiveOcio(run, grid.records, logs);
		const brunetonNonRegression = evaluateBrunetonNonRegression(
			grid.records,
			exhaustive.final,
			brunetonInputs,
			fixture,
		);
		const gates = {
			proofId: PROOF_ID,
			ctlRuntimePreflight,
			outputContract: {
				passed: true,
				measuredRendererEncoding: 'direct',
				selectedOfficialEncoding: 'sRGB-piecewise',
				automaticSrgbPolicy: 'terminal rejection; no frozen display-linear CTL and no double encoding',
			},
			ctlOracle: ctlOracleGate,
			exhaustiveImplementation: {
				passed: true,
				implementation: 'Pinned PyOpenColorIO 2.4.2 ACES 2 built-ins',
				authority: 'Authorized only by the preceding bounded official-CTL float and exact-Q8 gate.',
				recordCount: grid.records.length,
				execution: exhaustive.execution,
			},
			encodingBranches,
			modelContinuity,
			synthetic: evaluateSyntheticGrid(grid.records, exhaustive.final, exhaustive.ap1, fixture),
			officialTables: {
				passed: officialTableProbes.table.passed && officialTableProbes.boundaries.passed,
				table: officialTableProbes.table,
				boundaries: {
					passed: officialTableProbes.boundaries.passed,
					probeCount: officialTableProbes.boundaries.probeCount,
					boundaryCount: officialTableProbes.boundaries.boundaryCount,
					nonFiniteCount: officialTableProbes.boundaries.nonFiniteCount,
					failedBoundaryCount: officialTableProbes.boundaries.failedBoundaryCount,
				},
			},
			pairs: evaluatePairDecision({
				records: grid.records,
				ctl: exhaustive.final,
				measuredSamples,
				rawOrdering: paired.gates.rawOrdering,
				fixture,
			}),
			brunetonNonRegression,
			trackedBrunetonGate: evaluateTrackedBrunetonGate(brunetonInputs, strictBrunetonFixture),
		};
		gates.accepted = Object.entries(gates)
			.filter(([key, gate]) => key !== 'proofId' && gate.affectsOfflineCandidateAcceptance !== false)
			.every(([, gate]) => gate.passed === true);
		await run.writeJsonArtifact('evidence/gates.json', gates);
		await run.writeJsonArtifact('evidence/tool-logs.json', {logs});

		let captures = [];
		if (gates.accepted) {
			captures = await createCandidatePreviews(run, frames, logs);
			requireCondition(
				captures.length === 2,
				'Accepted numerical result did not emit both frozen candidate previews.',
			);
			await run.writeJsonArtifact('evidence/candidate-previews.json', {
				createdAfterNumericalAcceptance: true,
				captures,
			});
			await run.writeJsonArtifact('evidence/tool-logs-after-previews.json', {logs});
		}

		const identityAfter = await verifyPostExecutionIdentity(executionSeal);
		await run.writeJsonArtifact('evidence/runtime-closure.json', identityAfter.runtimeClosure);
		await run.writeJsonArtifact('evidence/reference-identity-after.json', {
			controls: identityAfter.controls,
			protectedWorkingTree: identityAfter.protectedWorkingTree,
			acesPackage: identityAfter.acesPackage,
			provenance: identityAfter.provenance,
			exrHelperSha256,
			pairedVerification: identityAfter.pairedVerification,
			wslExecution: identityAfter.wslExecution,
			pythonExecution: identityAfter.pythonExecution,
		});
		const conclusion = gates.accepted ? 'accepted' : 'rejected';
		const reportEvidence = {
			pairedRunId: paired.runId,
			gridRecordCount: grid.records.length,
			gates,
			captures,
		};
		const terminalManifest = await run.finalize({
			conclusion,
			result: {
				proofId: PROOF_ID,
				accepted: gates.accepted,
				pairedRunId: paired.runId,
				measuredRendererEncoding: 'direct',
				selectedOfficialCtlEncoding: 'sRGB-piecewise',
				gridRecordCount: grid.records.length,
				ctlOracleRecordCount: ctlOracleRecords.length,
				officialTableRowCount: officialTableProbes.table.rowCount,
				officialTableBoundaryProbeCount: officialTableProbes.boundaryProbeCount,
				brunetonPairCount: brunetonInputs.pairs.length,
				candidatePreviewCount: captures.length,
			},
			report: reportText(run.runId, conclusion, reportEvidence),
		});
		process.stdout.write(
			`${JSON.stringify(
				{
					runId: run.runId,
					conclusion,
					pairedRunId: paired.runId,
					candidatePreviews: captures.map((entry) => entry.artifactPath),
					artifactSetSha256: terminalManifest.artifactSetSha256,
				},
				null,
				2,
			)}\n`,
		);
		if (!gates.accepted) process.exitCode = 2;
	} catch (error) {
		const primaryDetail = serializeError(error);
		let postExecutionIdentity = null;
		let postExecutionIdentityError = null;
		try {
			postExecutionIdentity = await verifyPostExecutionIdentity(executionSeal);
		} catch (identityError) {
			postExecutionIdentityError = serializeError(identityError);
		}
		const detail =
			postExecutionIdentityError === null
				? primaryDetail
				: {
						name: 'PostExecutionIdentityError',
						message: `Post-execution containment/reference verification failed after: ${primaryDetail.message}`,
						primaryError: primaryDetail,
						postExecutionIdentityError,
					};
		try {
			await run.writeJsonArtifact('evidence/failure-identity-after.json', {
				verified: postExecutionIdentityError === null,
				identity: postExecutionIdentity,
				error: postExecutionIdentityError,
			});
			await run.writeJsonArtifact('evidence/failure.json', detail);
			if (logs.length > 0) await run.writeJsonArtifact('evidence/failure-tool-logs.json', {logs});
			const conclusion =
				postExecutionIdentityError === null && error instanceof TerminalRejection ? 'rejected' : 'failed';
			const terminalManifest = await run.finalize({
				conclusion,
				result: {proofId: PROOF_ID, accepted: false, error: detail},
				report: `# ${run.runId}: pinned ACES 2 Sun-appearance reference decision\n\nConclusion: **${conclusion}**\n\n${detail.message}\n`,
			});
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion,
						error: detail,
						artifactSetSha256: terminalManifest.artifactSetSha256,
					},
					null,
					2,
				)}\n`,
			);
		} catch (finalizationError) {
			process.stderr.write(
				`${JSON.stringify(
					{
						runId: run.runId,
						conclusion: 'partial-unfinalized',
						error: detail,
						finalizationError: serializeError(finalizationError),
					},
					null,
					2,
				)}\n`,
			);
		}
		process.exitCode = postExecutionIdentityError === null && error instanceof TerminalRejection ? 2 : 1;
	}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	await main();
}
