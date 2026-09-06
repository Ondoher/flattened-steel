#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {fitSensorToXyz} from '../color/RelativeCameraSpectralProfile.js';
import {NATIVE_15_SPECTRAL_BASIS} from '../production-snapshots/sun-appearance-step-5-v1/src/algorithm32/profiles/native-15/native-15-profile.js';
import {
	assertNoReparseEntries,
	createProtectedTrackedInventory,
	loadContainmentPolicy,
} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, sha256File} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {
	EXPERIMENT_NODE_MODULES_ROOT,
	EXPERIMENT_PACKAGE_PATH,
	EXPERIMENT_ROOT,
	REPOSITORY_ROOT,
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-camera-color-model-d5-t5.js';
const SOURCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'camera-colorimetric-t5-v1');
const ORACLE_PATH = path.join(EXPERIMENT_ROOT, 'tools', 'camera-t5-colorimetric-oracle.py');
const PYTHON_PATH = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'tools', 'colour-0.4.6', 'Scripts', 'python.exe');
const DEPENDENCIES = [
	{runId: '000373-camera-t5-colorimetric-prerequisite', artifactSetSha256: '8249584487fa29fc8d819792188c8df5ec2ed56aaeb4fb720f7d69b1895531f1'},
	{runId: '000375-camera-color-model-d4-t4', artifactSetSha256: '04ccb783237087984ea0c000f5b21f7d98e781fed1bccbb268d65a957a6a8afb'},
];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function maximumAbsoluteDifference(left, right) {
	requireCondition(left.length === right.length, 'Compared vectors have different lengths.');
	return left.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - right[index])), 0);
}

function matrixMaximumAbsoluteDifference(left, right) {
	return left.reduce((maximum, row, index) => Math.max(maximum, maximumAbsoluteDifference(row, right[index])), 0);
}

function exactValue(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function identityMatrix3() {
	return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
}

function runOracle(payload) {
	return new Promise((resolve, reject) => {
		const child = spawn(PYTHON_PATH, [ORACLE_PATH], {
			cwd: REPOSITORY_ROOT,
			windowsHide: true,
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		const stdout = [];
		const stderr = [];
		child.stdout.on('data', (chunk) => stdout.push(chunk));
		child.stderr.on('data', (chunk) => stderr.push(chunk));
		child.on('error', reject);
		child.on('close', (code) => {
			const stderrText = Buffer.concat(stderr).toString();
			if (code !== 0) {
				reject(new Error(`T5 oracle failed (${code}): ${stderrText}`));
				return;
			}
			resolve({value: JSON.parse(Buffer.concat(stdout).toString()), stderr: stderrText});
		});
		child.stdin.end(JSON.stringify(payload));
	});
}

async function verifyDependency({runId, artifactSetSha256}) {
	const runRoot = path.join(RUNS_ROOT, runId);
	await assertNoReparseEntries(runRoot, runId);
	const manifest = JSON.parse(await readFile(path.join(runRoot, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.conclusion === 'accepted', `${runId} is not accepted.`);
	requireCondition(manifest.artifactSetSha256 === artifactSetSha256, `${runId} artifact set changed.`);
	return {runId, artifactSetSha256};
}

function createColorProfile(oracle, illuminant, {identityMatrix = false} = {}) {
	const result = structuredClone(PROFILE);
	const white = oracle.perfectDiffuserChecks[illuminant];
	result.profileId = `generic-relative-color-${illuminant.toLowerCase()}-${identityMatrix ? 'identity' : 'characterized'}-v1`;
	result.claimLimit = 'Generic relative raw-color boundary profile using the retained rawtoaces response characterization; physical capture remains the unchanged baseline diagnostic.';
	result.parents.push({
		runId: DEPENDENCIES[0].runId,
		artifactSetSha256: DEPENDENCIES[0].artifactSetSha256,
		path: 'evidence/colorimetric-oracle.json',
	});
	result.color.whiteBalanceId = `cie-${illuminant.toLowerCase()}-perfect-diffuser-native15-v1`;
	result.color.whiteBalanceMultipliers = white.whiteBalanceMultipliersNative15;
	result.color.whiteBalanceMinimum = [0, 0, 0];
	result.color.whiteBalanceMaximum = [1, 1, 1];
	result.color.sensorToXyzD65Matrix3x3 = identityMatrix
		? identityMatrix3()
		: oracle.fit.sensorToXyzD65Matrix;
	result.color.characterization = identityMatrix
		? 'Diagnostic identity matrix; no camera claim.'
		: 'rawtoaces 190-patch D55 fit to official CIE D65 XYZ; independent Ohta D55/D65/D75 validation';
	return compileCameraColorProfile(result);
}

async function main() {
	const nativeBins = NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => ({
		id: channel.id,
		centerNanometers: channel.center.value,
		widthNanometers: channel.width.value,
	}));
	const run = await initializeRunRecord({
		slug: 'camera-color-model-d5-t5',
		command: COMMAND,
		inputs: {
			dependencies: DEPENDENCIES,
			fit: '190 rawtoaces D55 rows to D65 XYZ',
			validation: '24 independent Ohta patches under each of D55, D65, and D75',
			profiles: ['CIE D55 WB', 'CIE D65 WB', 'CIE D75 WB', 'identity matrix diagnostic'],
			excluded: ['Illuminant A', 'development look', 'named-camera fidelity'],
		},
		provenance: {
			purpose: 'Implement and qualify the raw-color boundary, CIE-derived WB profiles, and pluggable characterization matrix inside CameraColorModel.',
			method: 'The public spectral path and direct normalized-raw trace share one color-stage implementation; exact independent oracle rows qualify WB/matrix while spectral traces qualify upstream isolation.',
			claimLimit: 'Generic relative-color mechanics before development; no absolute sensor or named-camera claim.',
		},
		environment: {node: process.version, platform: process.platform, python: '3.10.1', colour: '0.4.6', numpy: '2.2.6'},
		references: {
			testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md',
			inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md',
			developmentPlan: 'agents/topics/extraterrestrial/camera-controls-development-plan.md',
		},
	});

	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(SOURCE_ROOT, 'T5 source root');
		const policy = await loadContainmentPolicy();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		const dependencyEvidence = [];
		for (const dependency of DEPENDENCIES) dependencyEvidence.push(await verifyDependency(dependency));
		const oracleExecution = await runOracle({sourceRoot: SOURCE_ROOT, nativeBins});
		const oracle = oracleExecution.value;

		const trainingIndices = Array.from({length: oracle.fit.rows.length}, (_, index) => index);
		const jsMatrix = fitSensorToXyz(
			oracle.fit.rows.map((row) => row.camera1nm),
			oracle.fit.rows.map((row) => row.targetXyzD65),
			trainingIndices,
		);
		const matrixFitMaximumAbsoluteError = matrixMaximumAbsoluteDifference(
			jsMatrix,
			oracle.fit.sensorToXyzD65Matrix,
		);

		const profiles = Object.fromEntries(['D55', 'D65', 'D75'].map((illuminant) => [
			illuminant,
			createColorProfile(oracle, illuminant),
		]));
		const models = Object.fromEntries(Object.entries(profiles).map(([key, profile]) => [key, new CameraColorModel(profile)]));
		const validationRows = [];
		let whiteBalanceMaximumAbsoluteError = 0;
		let matrixProjectionMaximumAbsoluteError = 0;
		for (const illuminant of ['D55', 'D65', 'D75']) {
			const model = models[illuminant];
			const perfect = oracle.perfectDiffuserChecks[illuminant];
			const perfectTrace = model.traceNormalizedRaw(perfect.rawNormalizedNative15);
			whiteBalanceMaximumAbsoluteError = Math.max(
				whiteBalanceMaximumAbsoluteError,
				maximumAbsoluteDifference(perfectTrace.whiteBalanced, [1, 1, 1]),
			);
			for (const expected of oracle.validation[illuminant].rows) {
				const actual = model.traceNormalizedRaw(expected.rawNormalizedNative15);
				whiteBalanceMaximumAbsoluteError = Math.max(
					whiteBalanceMaximumAbsoluteError,
					maximumAbsoluteDifference(actual.whiteBalanced, expected.cameraNative15),
				);
				matrixProjectionMaximumAbsoluteError = Math.max(
					matrixProjectionMaximumAbsoluteError,
					maximumAbsoluteDifference(actual.xyzD65, expected.predictedXyzNative15),
				);
				validationRows.push({
					id: expected.id,
					illuminant,
					rawNormalizedNative15: expected.rawNormalizedNative15,
					whiteBalanced: actual.whiteBalanced,
					expectedWhiteBalanced: expected.cameraNative15,
					xyzD65: actual.xyzD65,
					expectedXyzD65: expected.predictedXyzNative15,
				});
			}
		}

		const isolationSpectrum = Array.from({length: 15}, (_, index) => 2e-4 * (index + 1));
		const isolationTraces = Object.fromEntries(Object.entries(models).map(([name, model]) => [name, model.traceRadiance(isolationSpectrum)]));
		const upstreamKeys = [
			'sensorPhotonIntegrals', 'lensFactor', 'electronScale', 'photoelectrons',
			'clippedElectrons', 'rawClipped', 'rawClipChannelCount', 'fullWellFraction',
			'normalizedPostGain', 'adcMaximumCode', 'adcCodes', 'adcClipped',
		];
		const d55Trace = isolationTraces.D55;
		let wbUpstreamMismatchCount = 0;
		for (const trace of Object.values(isolationTraces)) {
			for (const key of upstreamKeys) if (!exactValue(trace[key], d55Trace[key])) wbUpstreamMismatchCount += 1;
		}
		const wbOutputDistinct = !exactValue(isolationTraces.D55.whiteBalanced, isolationTraces.D65.whiteBalanced)
			&& !exactValue(isolationTraces.D65.whiteBalanced, isolationTraces.D75.whiteBalanced);

		const identityModel = new CameraColorModel(createColorProfile(oracle, 'D55', {identityMatrix: true}));
		const characterizedTrace = models.D55.traceRadiance(isolationSpectrum);
		const identityTrace = identityModel.traceRadiance(isolationSpectrum);
		const matrixUpstreamKeys = [...upstreamKeys, 'whiteBalanced'];
		const matrixUpstreamMismatchCount = matrixUpstreamKeys.filter((key) => !exactValue(
			characterizedTrace[key], identityTrace[key],
		)).length;
		const matrixOutputDistinct = !exactValue(characterizedTrace.xyzD65, identityTrace.xyzD65);
		const publicTraceMismatchCount = Object.values(models).filter((model) => !exactValue(
			model.radianceToDisplayRgb(isolationSpectrum),
			model.traceRadiance(isolationSpectrum).encodedSrgb,
		)).length;

		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(matrixFitMaximumAbsoluteError <= 1e-12, `JavaScript and the independent 190-row least-squares matrix agree (${matrixFitMaximumAbsoluteError}).`);
		check(whiteBalanceMaximumAbsoluteError <= 1e-12, `CIE-derived WB reproduces oracle camera rows and perfect neutral (${whiteBalanceMaximumAbsoluteError}).`);
		check(matrixProjectionMaximumAbsoluteError <= 1e-12, `CameraColorModel matrix projection reproduces all 72 oracle rows (${matrixProjectionMaximumAbsoluteError}).`);
		check(wbUpstreamMismatchCount === 0, 'Changing WB profiles leaves every capture, clipping, gain, and ADC boundary byte-identical.');
		check(wbOutputDistinct, 'D55, D65, and D75 WB profiles produce distinct post-raw channel values for the diagnostic spectrum.');
		check(matrixUpstreamMismatchCount === 0, 'Changing characterization matrix leaves all values through white balance byte-identical.');
		check(matrixOutputDistinct, 'The characterized and diagnostic identity matrices produce distinct XYZ values.');
		check(publicTraceMismatchCount === 0, 'Every public spectral result equals the shared trace terminal value.');
		check(validationRows.length === 72, 'All 72 independent validation rows execute through the model raw-color boundary.');

		const compiledProfiles = Object.fromEntries(Object.entries(profiles).map(([name, profile]) => [name, profile]));
		const proof = {
			proofId: 'camera-color-model-d5-t5-v1',
			accepted: true,
			assertions,
			summary: {
				trainingPatchCount: oracle.fit.rows.length,
				validationRowCount: validationRows.length,
				matrixFitMaximumAbsoluteError,
				whiteBalanceMaximumAbsoluteError,
				matrixProjectionMaximumAbsoluteError,
				wbUpstreamMismatchCount,
				matrixUpstreamMismatchCount,
				publicTraceMismatchCount,
				validationMetrics: Object.fromEntries(['D55', 'D65', 'D75'].map((name) => [name, oracle.validation[name].metrics])),
				combinedValidationMetrics: oracle.combinedValidationMetrics,
			},
			claimLimit: 'Generic relative raw-color WB and characterization through the shared CameraColorModel stage; identity development remains unchanged.',
		};
		await run.writeJsonArtifact('evidence/dependency-audit.json', {schemaId: 'camera-d5-dependencies-v1', dependencies: dependencyEvidence});
		await run.writeJsonArtifact('evidence/colorimetric-oracle.json', oracle);
		if (oracleExecution.stderr.trim()) await run.writeArtifact('evidence/oracle-stderr.txt', oracleExecution.stderr);
		await run.writeJsonArtifact('evidence/compiled-color-profiles.json', {schemaId: 'camera-d5-compiled-color-profiles-v1', profiles: compiledProfiles});
		await run.writeJsonArtifact('evidence/validation-rows.json', {schemaId: 'camera-d5-validation-rows-v1', rows: validationRows});
		await run.writeJsonArtifact('evidence/isolation-traces.json', {schemaId: 'camera-d5-isolation-v1', spectrum: isolationSpectrum, traces: isolationTraces, identityTrace});
		await run.writeJsonArtifact('evidence/d5-t5-proof.json', proof);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-camera-color-model-d5-t5.js',
				'color/CameraColorModel.js',
				'color/CameraColorProfile.js',
				'color/RelativeCameraSpectralProfile.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
			],
		});
		const protectedAfter = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(protectedBefore, protectedAfter, 'Camera Color D5/T5 protected inventory');
		proof.containment = {
			protectedFiles: protectedAfter.fileCount,
			closureFileCount: closure.files.length,
			runnerSha256: await sha256File(import.meta.filename),
			oracleSha256: await sha256File(ORACLE_PATH),
			modelSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorModel.js')),
			profileSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorProfile.js')),
		};
		const combined = oracle.combinedValidationMetrics;
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: proof,
			report: `# ${run.runId}: Camera Color D5/T5\n\nConclusion: **accepted**.\n\n- 190-row independent fit parity: ${matrixFitMaximumAbsoluteError}.\n- WB parity across D55/D65/D75: ${whiteBalanceMaximumAbsoluteError}.\n- Matrix parity across 72 independent rows: ${matrixProjectionMaximumAbsoluteError}.\n- Native-15 versus 1 nm validation Delta E 2000 mean / p95 / maximum: ${combined.deltaE2000Native15Versus1nmMean} / ${combined.deltaE2000Native15Versus1nmP95} / ${combined.deltaE2000Native15Versus1nmMaximum}.\n\nCapture through ADC remains isolated from WB; characterization remains isolated from capture through WB. Identity development is unchanged.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: Camera Color D5/T5\n\nConclusion: **failed**.\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
