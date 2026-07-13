#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import LEDGER_FIXTURE from '../fixtures/spectral-color-stage1-ledger-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile, deriveCameraColorProfile} from '../color/CameraColorProfile.js';
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

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-color-model-d7-t7.js';
const PLANCK_CONSTANT = 6.62607015e-34;
const SPEED_OF_LIGHT = 299792458;
const SOURCE_ROOT = path.join(EXPERIMENT_ROOT, 'references', 'camera-colorimetric-t5-v1');
const ORACLE_PATH = path.join(EXPERIMENT_ROOT, 'tools', 'camera-t5-colorimetric-oracle.py');
const PYTHON_PATH = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'tools', 'colour-0.4.6', 'Scripts', 'python.exe');
const D6 = {
	runId: '000378-camera-color-model-d6-t6',
	artifactSetSha256: 'b4e3df1903b362891e02cb9345d1255b4f07e06899d18d9eee466922e5edebb4',
};

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function clamp(value, minimum, maximum) {
	return Math.min(maximum, Math.max(minimum, value));
}

function multiplyMatrixVector(matrix, vector) {
	return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function encodeSrgb(value) {
	const bounded = clamp(value, 0, 1);
	return bounded <= 0.0031308 ? 12.92 * bounded : 1.055 * bounded ** (1 / 2.4) - 0.055;
}

function maximumRelativeDifference(left, right) {
	return left.reduce((maximum, value, index) => Math.max(
		maximum,
		Math.abs(value - right[index]) / Math.max(Math.abs(right[index]), 1e-30),
	), 0);
}

function exactValue(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function numericMaximumAbsoluteDifference(left, right) {
	if (typeof left === 'number' && typeof right === 'number') return Math.abs(left - right);
	if (Array.isArray(left) && Array.isArray(right) && left.length === right.length) {
		return left.reduce((maximum, value, index) => Math.max(
			maximum,
			numericMaximumAbsoluteDifference(value, right[index]),
		), 0);
	}
	return exactValue(left, right) ? 0 : Number.POSITIVE_INFINITY;
}

function manualTrace(profile, spectrum) {
	const sensorPhotonIntegrals = multiplyMatrixVector(profile.response.matrix3x15, spectrum);
	const lensFactor = Math.PI / (4 * profile.capture.apertureFNumber ** 2)
		* profile.device.opticalTransmission * profile.capture.filterTransmission;
	const electronScale = lensFactor * profile.device.pixelAreaSquareMeters
		* profile.capture.shutterSeconds / (PLANCK_CONSTANT * SPEED_OF_LIGHT);
	const photoelectrons = sensorPhotonIntegrals.map((value) => value * electronScale);
	const clippedElectrons = photoelectrons.map((value) => clamp(value, 0, profile.device.fullWellElectrons));
	const rawClipped = photoelectrons.map((value) => value >= profile.device.fullWellElectrons);
	const normalizedPostGain = clippedElectrons.map((value) => clamp(
		(value - profile.device.blackLevelElectrons) / profile.device.fullWellElectrons * profile.capture.postWellGain,
		0,
		1,
	));
	const adcMaximumCode = 2 ** profile.device.adcBits - 1;
	const adcCodes = normalizedPostGain.map((value) => Math.round(value * adcMaximumCode));
	const adcClipped = normalizedPostGain.map((value) => value >= 1);
	const whiteBalanced = normalizedPostGain.map((value, index) => clamp(
		value * profile.color.whiteBalanceMultipliers[index],
		profile.color.whiteBalanceMinimum[index],
		profile.color.whiteBalanceMaximum[index],
	));
	const xyzD65 = multiplyMatrixVector(profile.color.sensorToXyzD65Matrix3x3, whiteBalanced);
	const preDevelopmentLinearRec709D65 = multiplyMatrixVector(profile.color.xyzToLinearRec709D65Matrix3x3, xyzD65);
	const developedLinearRec709D65 = preDevelopmentLinearRec709D65.map((value, index) => clamp(
		value,
		profile.development.linearMinimum[index],
		profile.development.linearMaximum[index],
	));
	const encodedSrgb = developedLinearRec709D65.map(encodeSrgb);
	return {
		sensorPhotonIntegrals,
		lensFactor,
		electronScale,
		photoelectrons,
		clippedElectrons,
		rawClipped,
		rawClipChannelCount: rawClipped.filter(Boolean).length,
		fullWellFraction: photoelectrons.map((value) => value / profile.device.fullWellElectrons),
		normalizedPostGain,
		adcMaximumCode,
		adcCodes,
		adcClipped,
		whiteBalanced,
		xyzD65,
		preDevelopmentLinearRec709D65,
		developedLinearRec709D65,
		encodedSrgb,
	};
}

function compileVariant(profileId, changes, parent = D6) {
	const result = structuredClone(PROFILE);
	result.profileId = profileId;
	result.parents.push({runId: parent.runId, artifactSetSha256: parent.artifactSetSha256});
	for (const [owner, fields] of Object.entries(changes)) Object.assign(result[owner], fields);
	return compileCameraColorProfile(result);
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
				reject(new Error(`D7 color-profile oracle failed (${code}): ${stderrText}`));
				return;
			}
			resolve({value: JSON.parse(Buffer.concat(stdout).toString()), stderr: stderrText});
		});
		child.stdin.end(JSON.stringify(payload));
	});
}

async function main() {
	const nativeBins = NATIVE_15_SPECTRAL_BASIS.channels.map((channel) => ({
		id: channel.id,
		centerNanometers: channel.center.value,
		widthNanometers: channel.width.value,
	}));
	const run = await initializeRunRecord({
		slug: 'camera-color-model-d7-t7',
		command: COMMAND,
		inputs: {
			dependency: D6,
			interactionFamilies: ['X-RECIPROCITY', 'X-OPTICAL-PRODUCT', 'X-EXPOSURE-ISO', 'X-CLIP-WB', 'X-DOWNSTREAM-ISOLATION', 'X-DIRECT-COMPOSITION'],
			sunSpectrum: 'scripts/extraterrestrial/fixtures/spectral-color-stage1-ledger-v1.json#/flat/source/surfaceRadianceValues',
			nonFactorial: true,
		},
		provenance: {
			purpose: 'Qualify composition and required interactions across the complete CameraColorModel without fusing diagnostic boundaries.',
			method: 'Six frozen interaction families, tracked Sun spectrum, independent profile derivations, and a separately authored direct equation evaluator.',
			claimLimit: 'Deterministic on-axis generic-camera composition only; no secondary optics, named camera, stochastic noise, timelapse policy, HDR merge, glare, or appearance look.',
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
		await assertNoReparseEntries(SOURCE_ROOT, 'D7 color source root');
		const dependencyRoot = path.join(RUNS_ROOT, D6.runId);
		await assertNoReparseEntries(dependencyRoot, D6.runId);
		const dependencyManifest = JSON.parse(await readFile(path.join(dependencyRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(dependencyManifest.conclusion === 'accepted' && dependencyManifest.artifactSetSha256 === D6.artifactSetSha256, 'D6/T6 dependency changed.');
		const policy = await loadContainmentPolicy();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		const oracleExecution = await runOracle({sourceRoot: SOURCE_ROOT, nativeBins});
		const oracle = oracleExecution.value;

		const baseSpectrum = Array.from({length: 15}, (_, index) => 1e-4 * (index + 1));
		const sunSpectrum = LEDGER_FIXTURE.flat.source.surfaceRadianceValues;
		const baseModel = new CameraColorModel(PROFILE);
		const baseTrace = baseModel.traceRadiance(baseSpectrum);

		const reciprocityDefinitions = [
			{id: 'baseline', aperture: 2.2, shutterRatio: 1},
			{id: 'open-time-2', aperture: 2.2 * Math.sqrt(2), shutterRatio: 2},
			{id: 'closed-time-4', aperture: 4.4, shutterRatio: 4},
			{id: 'open-time-half', aperture: 2.2 / Math.sqrt(2), shutterRatio: 0.5},
		];
		const reciprocityRows = reciprocityDefinitions.map((item) => {
			const profile = item.id === 'baseline' ? PROFILE : compileVariant(`d7-reciprocity-${item.id}-v1`, {
				capture: {apertureFNumber: item.aperture, shutterSeconds: PROFILE.capture.shutterSeconds * item.shutterRatio},
			});
			const trace = new CameraColorModel(profile).traceRadiance(baseSpectrum);
			return {
				...item,
				profileId: profile.profileId,
				photoelectrons: trace.photoelectrons,
				rawClipped: trace.rawClipped,
				maximumRelativeError: maximumRelativeDifference(trace.photoelectrons, baseTrace.photoelectrons),
			};
		});

		const opticalDefinitions = [
			{id: 'f4-time2-od3.8', aperture: 4, shutterRatio: 2, opticalDensity: 3.8},
			{id: 'f8-time0.5-od5', aperture: 8, shutterRatio: 0.5, opticalDensity: 5},
		];
		const opticalRows = opticalDefinitions.map((item) => {
			const filterTransmission = 10 ** -item.opticalDensity;
			const directProfile = compileVariant(`d7-optical-direct-${item.id}-v1`, {
				capture: {
					apertureFNumber: item.aperture,
					shutterSeconds: PROFILE.capture.shutterSeconds * item.shutterRatio,
					filterTransmission,
				},
			});
			const apertureProfile = deriveCameraColorProfile(PROFILE, {
				profileId: `d7-optical-step-aperture-${item.id}-v1`, path: 'capture.apertureFNumber', value: item.aperture, derivation: {caseId: 'X-OPTICAL-PRODUCT'},
			});
			const shutterProfile = deriveCameraColorProfile(apertureProfile, {
				profileId: `d7-optical-step-shutter-${item.id}-v1`, path: 'capture.shutterSeconds', value: PROFILE.capture.shutterSeconds * item.shutterRatio, derivation: {caseId: 'X-OPTICAL-PRODUCT'},
			});
			const sequentialProfile = deriveCameraColorProfile(shutterProfile, {
				profileId: `d7-optical-sequential-${item.id}-v1`, path: 'capture.filterTransmission', value: filterTransmission, derivation: {caseId: 'X-OPTICAL-PRODUCT'},
			});
			const direct = new CameraColorModel(directProfile).traceRadiance(baseSpectrum);
			const sequential = new CameraColorModel(sequentialProfile).traceRadiance(baseSpectrum);
			const expectedFactor = item.shutterRatio * (2.2 / item.aperture) ** 2 * filterTransmission;
			const expected = baseTrace.photoelectrons.map((value) => value * expectedFactor);
			return {
				...item,
				filterTransmission,
				expectedFactor,
				directPhotoelectrons: direct.photoelectrons,
				sequentialPhotoelectrons: sequential.photoelectrons,
				expectedPhotoelectrons: expected,
				directExpectedMaximumRelativeError: maximumRelativeDifference(direct.photoelectrons, expected),
				directSequentialMaximumRelativeError: maximumRelativeDifference(direct.photoelectrons, sequential.photoelectrons),
			};
		});

		const sunBaseline = baseModel.traceRadiance(sunSpectrum);
		const od5Profile = compileVariant('d7-sun-od5-v1', {capture: {filterTransmission: 1e-5, postWellGain: 1}});
		const od5GainProfile = compileVariant('d7-sun-od5-gain100000-v1', {capture: {filterTransmission: 1e-5, postWellGain: 100000}});
		const sunOd5 = new CameraColorModel(od5Profile).traceRadiance(sunSpectrum);
		const sunOd5Gain = new CameraColorModel(od5GainProfile).traceRadiance(sunSpectrum);
		const exposureIso = {
			baseline: {fullWellFraction: sunBaseline.fullWellFraction, rawClipped: sunBaseline.rawClipped, adcClipped: sunBaseline.adcClipped},
			od5: {fullWellFraction: sunOd5.fullWellFraction, rawClipped: sunOd5.rawClipped, adcClipped: sunOd5.adcClipped},
			od5Gain100000: {fullWellFraction: sunOd5Gain.fullWellFraction, rawClipped: sunOd5Gain.rawClipped, adcClipped: sunOd5Gain.adcClipped},
			od5GainUpstreamExact: exactValue(sunOd5.photoelectrons, sunOd5Gain.photoelectrons)
				&& exactValue(sunOd5.clippedElectrons, sunOd5Gain.clippedElectrons)
				&& exactValue(sunOd5.rawClipped, sunOd5Gain.rawClipped),
		};

		const wbProfiles = {};
		const wbRows = [];
		for (const illuminant of ['D55', 'D65', 'D75']) {
			const perfect = oracle.perfectDiffuserChecks[illuminant];
			const profile = compileVariant(`d7-wb-${illuminant.toLowerCase()}-v1`, {
				color: {
					whiteBalanceId: `cie-${illuminant.toLowerCase()}-perfect-diffuser-native15-v1`,
					whiteBalanceMultipliers: perfect.whiteBalanceMultipliersNative15,
					sensorToXyzD65Matrix3x3: oracle.fit.sensorToXyzD65Matrix,
					characterization: 'D7 retained rawtoaces generic relative matrix',
				},
			});
			wbProfiles[illuminant] = profile;
			const trace = new CameraColorModel(profile).traceRadiance(sunSpectrum);
			wbRows.push({
				illuminant,
				whiteBalanceMultipliers: profile.color.whiteBalanceMultipliers,
				photoelectrons: trace.photoelectrons,
				rawClipped: trace.rawClipped,
				normalizedPostGain: trace.normalizedPostGain,
				whiteBalanced: trace.whiteBalanced,
			});
		}

		const identityMatrixProfile = compileVariant('d7-identity-matrix-diagnostic-v1', {
			color: {sensorToXyzD65Matrix3x3: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], characterization: 'D7 identity diagnostic'},
		});
		const characterizedTrace = baseModel.traceRadiance(baseSpectrum);
		const identityMatrixTrace = new CameraColorModel(identityMatrixProfile).traceRadiance(baseSpectrum);
		const throughWbKeys = [
			'sensorPhotonIntegrals', 'lensFactor', 'electronScale', 'photoelectrons',
			'clippedElectrons', 'rawClipped', 'rawClipChannelCount', 'fullWellFraction',
			'normalizedPostGain', 'adcMaximumCode', 'adcCodes', 'adcClipped', 'whiteBalanced',
		];
		const downstreamIsolation = {
			throughWhiteBalanceExact: throughWbKeys.every((key) => exactValue(characterizedTrace[key], identityMatrixTrace[key])),
			matrixOutputDistinct: !exactValue(characterizedTrace.xyzD65, identityMatrixTrace.xyzD65),
			identityDevelopmentExact: exactValue(
				characterizedTrace.developedLinearRec709D65,
				characterizedTrace.preDevelopmentLinearRec709D65.map((value) => clamp(value, 0, 1)),
			),
		};

		const compositionCases = [
			{id: 'baseline', profile: PROFILE, spectrum: baseSpectrum},
			...reciprocityDefinitions.slice(1).map((item) => ({
				id: `reciprocity/${item.id}`,
				profile: compileVariant(`d7-composition-reciprocity-${item.id}-v1`, {capture: {apertureFNumber: item.aperture, shutterSeconds: PROFILE.capture.shutterSeconds * item.shutterRatio}}),
				spectrum: baseSpectrum,
			})),
			...opticalDefinitions.map((item) => ({
				id: `optical/${item.id}`,
				profile: compileVariant(`d7-composition-optical-${item.id}-v1`, {capture: {apertureFNumber: item.aperture, shutterSeconds: PROFILE.capture.shutterSeconds * item.shutterRatio, filterTransmission: 10 ** -item.opticalDensity}}),
				spectrum: baseSpectrum,
			})),
			{id: 'sun/od5-gain100000', profile: od5GainProfile, spectrum: sunSpectrum},
			...Object.entries(wbProfiles).map(([illuminant, profile]) => ({id: `wb/${illuminant}`, profile, spectrum: sunSpectrum})),
			{id: 'matrix/identity', profile: identityMatrixProfile, spectrum: baseSpectrum},
		];
		const compositionRows = [];
		let compositionMaximumAbsoluteError = 0;
		let compositionDiscreteMismatchCount = 0;
		let publicTraceMismatchCount = 0;
		const numericKeys = [
			'sensorPhotonIntegrals', 'lensFactor', 'electronScale', 'photoelectrons',
			'clippedElectrons', 'fullWellFraction', 'normalizedPostGain', 'adcMaximumCode',
			'whiteBalanced', 'xyzD65', 'preDevelopmentLinearRec709D65',
			'developedLinearRec709D65', 'encodedSrgb',
		];
		const discreteKeys = ['rawClipped', 'rawClipChannelCount', 'adcCodes', 'adcClipped'];
		for (const item of compositionCases) {
			const model = new CameraColorModel(item.profile);
			const trace = model.traceRadiance(item.spectrum);
			const manual = manualTrace(item.profile, item.spectrum);
			let rowMaximum = 0;
			for (const key of numericKeys) rowMaximum = Math.max(rowMaximum, numericMaximumAbsoluteDifference(trace[key], manual[key]));
			const discreteMismatch = discreteKeys.filter((key) => !exactValue(trace[key], manual[key])).length;
			if (!exactValue(model.radianceToDisplayRgb(item.spectrum), trace.encodedSrgb)) publicTraceMismatchCount += 1;
			compositionMaximumAbsoluteError = Math.max(compositionMaximumAbsoluteError, rowMaximum);
			compositionDiscreteMismatchCount += discreteMismatch;
			compositionRows.push({id: item.id, profileId: item.profile.profileId, maximumAbsoluteError: rowMaximum, discreteMismatch});
		}

		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(reciprocityRows.every((row) => row.maximumRelativeError <= 1e-12
			&& exactValue(row.rawClipped, baseTrace.rawClipped)), 'X-RECIPROCITY preserves pre-clip electrons within 1e-12 and raw masks exactly.');
		check(opticalRows.every((row) => row.directExpectedMaximumRelativeError <= 1e-12 && row.directSequentialMaximumRelativeError <= 1e-12), 'X-OPTICAL-PRODUCT direct, analytic, and sequential forms agree within 1e-12.');
		check(sunBaseline.rawClipChannelCount === 3 && sunOd5.rawClipChannelCount === 0, 'X-EXPOSURE-ISO baseline Sun clips all raw channels while OD 5 clips none.');
		check(exposureIso.od5GainUpstreamExact && sunOd5Gain.adcClipped.every(Boolean), 'X-EXPOSURE-ISO gain preserves OD 5 raw capture and clips only at ADC/post-well boundaries.');
		check(wbRows.every((row) => exactValue(row.photoelectrons, wbRows[0].photoelectrons)
			&& exactValue(row.rawClipped, [true, true, true])
			&& exactValue(row.normalizedPostGain, [1, 1, 1])), 'X-CLIP-WB preserves fully clipped raw Sun and upstream capture under every WB preset.');
		check(downstreamIsolation.throughWhiteBalanceExact && downstreamIsolation.matrixOutputDistinct && downstreamIsolation.identityDevelopmentExact, 'X-DOWNSTREAM-ISOLATION preserves values through each owned boundary and changes only matrix output.');
		check(compositionMaximumAbsoluteError <= 1e-12 && compositionDiscreteMismatchCount === 0, `X-DIRECT-COMPOSITION matches the independent equation evaluator (${compositionMaximumAbsoluteError}; ${compositionDiscreteMismatchCount} discrete mismatches).`);
		check(publicTraceMismatchCount === 0, 'Every composed public display result equals its trace terminal value.');

		const proof = {
			proofId: 'camera-color-model-d7-t7-v1',
			accepted: true,
			assertions,
			summary: {
				interactionFamilyCount: 6,
				reciprocityCaseCount: reciprocityRows.length,
				opticalProductCaseCount: opticalRows.length,
				wbPresetCount: wbRows.length,
				compositionCaseCount: compositionRows.length,
				reciprocityMaximumRelativeError: Math.max(...reciprocityRows.map((row) => row.maximumRelativeError)),
				opticalMaximumRelativeError: Math.max(...opticalRows.flatMap((row) => [row.directExpectedMaximumRelativeError, row.directSequentialMaximumRelativeError])),
				sunBaselineFullWellFraction: sunBaseline.fullWellFraction,
				sunOd5FullWellFraction: sunOd5.fullWellFraction,
				compositionMaximumAbsoluteError,
				compositionDiscreteMismatchCount,
				publicTraceMismatchCount,
			},
			claimLimit: 'Non-factorial deterministic composition and interaction mechanics for the complete generic CameraColorModel.',
		};
		await run.writeJsonArtifact('evidence/reciprocity-cases.json', {schemaId: 'camera-d7-reciprocity-v1', rows: reciprocityRows});
		await run.writeJsonArtifact('evidence/optical-product-cases.json', {schemaId: 'camera-d7-optical-product-v1', rows: opticalRows});
		await run.writeJsonArtifact('evidence/exposure-iso-case.json', {schemaId: 'camera-d7-exposure-iso-v1', ...exposureIso});
		await run.writeJsonArtifact('evidence/clip-wb-cases.json', {schemaId: 'camera-d7-clip-wb-v1', rows: wbRows});
		await run.writeJsonArtifact('evidence/downstream-isolation.json', {schemaId: 'camera-d7-downstream-isolation-v1', ...downstreamIsolation});
		await run.writeJsonArtifact('evidence/direct-composition-cases.json', {schemaId: 'camera-d7-direct-composition-v1', rows: compositionRows});
		if (oracleExecution.stderr.trim()) await run.writeArtifact('evidence/oracle-stderr.txt', oracleExecution.stderr);
		await run.writeJsonArtifact('evidence/d7-t7-proof.json', proof);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-camera-color-model-d7-t7.js',
				'color/CameraColorModel.js',
				'color/CameraColorProfile.js',
				'color/CameraDevelopment.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
			],
		});
		const protectedAfter = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(protectedBefore, protectedAfter, 'Camera Color D7/T7 protected inventory');
		proof.containment = {
			protectedFiles: protectedAfter.fileCount,
			closureFileCount: closure.files.length,
			runnerSha256: await sha256File(import.meta.filename),
			modelSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorModel.js')),
			profileSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorProfile.js')),
			developmentSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraDevelopment.js')),
		};
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: proof,
			report: `# ${run.runId}: Camera Color D7/T7\n\nConclusion: **accepted**.\n\nAll six frozen interaction families pass. Reciprocity and optical products meet 1e-12, OD 5 separates raw recovery from post-well gain, WB cannot alter a fully clipped raw Sun, matrix/development boundaries remain isolated, and ${compositionRows.length} direct evaluations match the independent composed equations.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: Camera Color D7/T7\n\nConclusion: **failed**.\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
