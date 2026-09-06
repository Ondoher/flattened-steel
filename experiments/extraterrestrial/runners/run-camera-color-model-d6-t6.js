#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {compileCameraColorProfile} from '../color/CameraColorProfile.js';
import {applyCameraDevelopment} from '../color/CameraDevelopment.js';
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
	RUNS_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-camera-color-model-d6-t6.js';
const D5 = {
	runId: '000376-camera-color-model-d5-t5',
	artifactSetSha256: '12e756b300ddeb73b472a28aa8e588cb6807de77f2b0bc5119f6ffe4cc279330',
};

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function exactValue(left, right) {
	return JSON.stringify(left) === JSON.stringify(right);
}

function clampTriplet(values, minimum, maximum) {
	return values.map((value, index) => Math.min(maximum[index], Math.max(minimum[index], value)));
}

function createBoundaryDiagnosticProfile() {
	const profile = structuredClone(PROFILE);
	profile.profileId = 'camera-development-identity-boundary-diagnostic-v1';
	profile.claimLimit = 'Authored identity-development boundary diagnostic only; no camera or appearance claim.';
	profile.parents.push({runId: D5.runId, artifactSetSha256: D5.artifactSetSha256});
	profile.color.whiteBalanceId = 'identity-boundary-diagnostic';
	profile.color.whiteBalanceMultipliers = [1, 1, 1];
	profile.color.whiteBalanceMinimum = [-10, -10, -10];
	profile.color.whiteBalanceMaximum = [10, 10, 10];
	profile.color.sensorToXyzD65Matrix3x3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
	profile.color.xyzToLinearRec709D65Matrix3x3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
	profile.color.characterization = 'Authored identity matrices for development-boundary diagnostics.';
	return compileCameraColorProfile(profile);
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'camera-color-model-d6-t6',
		command: COMMAND,
		inputs: {
			dependency: D5,
			developmentInterface: 'camera-development-v1',
			operator: 'identity-clamp',
			linearBounds: {minimum: [0, 0, 0], maximum: [1, 1, 1]},
			appearanceDecision: 'none',
		},
		provenance: {
			purpose: 'Qualify the versioned identity development boundary without selecting a photographic look.',
			method: 'Direct analytic boundary vectors plus spectral and normalized-raw model traces through the same identity-clamp implementation.',
			claimLimit: 'Identity/no-tone development and Rec.709 boundary clamp only; no photographic appearance, tone, gamut, glare, or named-camera claim.',
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			testingPlan: 'agents/topics/extraterrestrial/camera-controls-testing-plan.md',
			inventory: 'agents/topics/extraterrestrial/camera-control-test-inventory.md',
			developmentPlan: 'agents/topics/extraterrestrial/camera-controls-development-plan.md',
		},
	});

	try {
		await assertRepositoryIdentity();
		const dependencyRoot = path.join(RUNS_ROOT, D5.runId);
		await assertNoReparseEntries(dependencyRoot, D5.runId);
		const dependencyManifest = JSON.parse(await readFile(path.join(dependencyRoot, 'artifact-manifest.json'), 'utf8'));
		requireCondition(dependencyManifest.conclusion === 'accepted', 'D5/T5 dependency is not accepted.');
		requireCondition(dependencyManifest.artifactSetSha256 === D5.artifactSetSha256, 'D5/T5 dependency changed.');
		const policy = await loadContainmentPolicy();
		const protectedBefore = await createProtectedTrackedInventory(policy);

		const development = PROFILE.development;
		const directCases = [
			{id: 'zero', value: [0, 0, 0], interior: true},
			{id: 'dark-weak-blue', value: [0.01, 0.02, 0.04], interior: true},
			{id: 'middle-neutral', value: [0.18, 0.18, 0.18], interior: true},
			{id: 'saturated-interior', value: [0.9, 0.5, 0.1], interior: true},
			{id: 'exact-upper', value: [1, 1, 1], interior: true},
			{id: 'lower-boundary', value: [-0.25, 0.25, 0.5], interior: false},
			{id: 'upper-boundary', value: [0.25, 1.25, 2], interior: false},
			{id: 'mixed-boundary', value: [-1, 0.4, 4], interior: false},
		];
		const directRows = directCases.map((item) => {
			const actual = applyCameraDevelopment(development, item.value);
			const expected = clampTriplet(item.value, development.linearMinimum, development.linearMaximum);
			return {...item, actual, expected, exact: exactValue(actual, expected)};
		});

		const baseModel = new CameraColorModel(PROFILE);
		const spectralCases = [
			{id: 'spectral-zero', spectrum: Array(15).fill(0)},
			{id: 'spectral-flat-low', spectrum: Array(15).fill(1e-6)},
			{id: 'spectral-sloped', spectrum: Array.from({length: 15}, (_, index) => (index + 1) * 2e-4)},
			...Array.from({length: 15}, (_, impulse) => ({
				id: `spectral-impulse-${impulse}`,
				spectrum: Array.from({length: 15}, (_, index) => index === impulse ? 1e-3 : 0),
			})),
		];
		const spectralRows = [];
		let spectralIdentityMismatchCount = 0;
		let spectralPublicMismatchCount = 0;
		let earlierBoundaryMutationCount = 0;
		const earlierKeys = [
			'sensorPhotonIntegrals', 'lensFactor', 'electronScale', 'photoelectrons',
			'clippedElectrons', 'rawClipped', 'rawClipChannelCount', 'fullWellFraction',
			'normalizedPostGain', 'adcMaximumCode', 'adcCodes', 'adcClipped',
			'whiteBalanced', 'xyzD65', 'preDevelopmentLinearRec709D65',
		];
		for (const item of spectralCases) {
			const first = baseModel.traceRadiance(item.spectrum);
			const earlierSnapshot = Object.fromEntries(earlierKeys.map((key) => [key, structuredClone(first[key])]));
			const direct = applyCameraDevelopment(development, first.preDevelopmentLinearRec709D65);
			const second = baseModel.traceRadiance(item.spectrum);
			if (!exactValue(first.developedLinearRec709D65, direct)) spectralIdentityMismatchCount += 1;
			if (!exactValue(baseModel.radianceToDisplayRgb(item.spectrum), first.encodedSrgb)
				|| !exactValue(baseModel.radianceToLinearOutput(item.spectrum), first.developedLinearRec709D65)) {
				spectralPublicMismatchCount += 1;
			}
			for (const key of earlierKeys) {
				if (!exactValue(earlierSnapshot[key], first[key]) || !exactValue(first[key], second[key])) {
					earlierBoundaryMutationCount += 1;
				}
			}
			spectralRows.push({
				id: item.id,
				preDevelopmentLinearRec709D65: first.preDevelopmentLinearRec709D65,
				developedLinearRec709D65: first.developedLinearRec709D65,
				encodedSrgb: first.encodedSrgb,
			});
		}

		const diagnosticModel = new CameraColorModel(createBoundaryDiagnosticProfile());
		const normalizedRawRows = directCases.filter((item) => item.value.every((value) => value >= 0)).map((item) => {
			const trace = diagnosticModel.traceNormalizedRaw(item.value);
			return {
				id: item.id,
				interior: item.interior,
				normalizedRaw: item.value,
				preDevelopmentLinearRec709D65: trace.preDevelopmentLinearRec709D65,
				developedLinearRec709D65: trace.developedLinearRec709D65,
				encodedSrgb: trace.encodedSrgb,
				exactIdentity: exactValue(trace.preDevelopmentLinearRec709D65, trace.developedLinearRec709D65),
			};
		});
		const darkWeakBlue = normalizedRawRows.find((row) => row.id === 'dark-weak-blue');

		let unsupportedOperatorRejected = false;
		try {
			applyCameraDevelopment({...development, operator: 'unfrozen-filmic-look'}, [0.1, 0.2, 0.3]);
		} catch (error) {
			unsupportedOperatorRejected = /Unsupported development operator/u.test(error.message);
		}
		const monotonicRamp = Array.from({length: 101}, (_, index) => index / 100);
		const monotonicOutputs = monotonicRamp.map((value) => applyCameraDevelopment(development, [value, value, value])[0]);
		const monotonic = monotonicOutputs.every((value, index) => index === 0 || value >= monotonicOutputs[index - 1]);

		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(development.interfaceId === 'camera-development-v1', 'The profile selects the versioned camera-development-v1 interface.');
		check(directRows.every((row) => row.exact), 'Every direct identity-clamp boundary case equals the analytic result exactly.');
		check(directRows.filter((row) => row.interior).every((row) => exactValue(row.value, row.actual)), 'Every in-range value passes through identity development exactly.');
		check(spectralIdentityMismatchCount === 0, 'Every spectral trace uses the same identity development operation exactly once.');
		check(spectralPublicMismatchCount === 0, 'Public linear/display results equal their trace terminals for every spectral case.');
		check(earlierBoundaryMutationCount === 0, 'Development leaves every earlier capture-through-pre-development boundary unchanged and repeatable.');
		check(normalizedRawRows.filter((row) => row.interior).every((row) => row.exactIdentity), 'The normalized-raw diagnostic path shares exact in-range identity development.');
		check(unsupportedOperatorRejected, 'An unfrozen non-identity operator is rejected by the development interface.');
		check(monotonic, 'The identity-clamp development ramp is monotonic.');
		check(darkWeakBlue.encodedSrgb[2] > darkWeakBlue.encodedSrgb[1]
			&& darkWeakBlue.encodedSrgb[1] > darkWeakBlue.encodedSrgb[0]
			&& Math.max(...darkWeakBlue.encodedSrgb) < 0.25, 'The retained dark weak-blue diagnostic remains dark and blue-ordered without becoming an appearance failure.');

		const proof = {
			proofId: 'camera-color-model-d6-t6-v1',
			accepted: true,
			assertions,
			summary: {
				directCaseCount: directRows.length,
				spectralCaseCount: spectralRows.length,
				normalizedRawCaseCount: normalizedRawRows.length,
				spectralIdentityMismatchCount,
				spectralPublicMismatchCount,
				earlierBoundaryMutationCount,
				unsupportedOperatorRejected,
				monotonic,
				darkWeakBlueDiagnostic: darkWeakBlue,
			},
			appearanceDisposition: 'Diagnostic only. Dark/weak-blue identity output does not reject qualified capture or select a development look.',
			claimLimit: 'Versioned identity-clamp development ownership and isolation only.',
		};
		await run.writeJsonArtifact('evidence/direct-development-cases.json', {schemaId: 'camera-d6-direct-development-v1', rows: directRows});
		await run.writeJsonArtifact('evidence/spectral-identity-cases.json', {schemaId: 'camera-d6-spectral-identity-v1', rows: spectralRows});
		await run.writeJsonArtifact('evidence/normalized-raw-identity-cases.json', {schemaId: 'camera-d6-normalized-raw-identity-v1', rows: normalizedRawRows});
		await run.writeJsonArtifact('evidence/d6-t6-proof.json', proof);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-camera-color-model-d6-t6.js',
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
		assertFileInventoriesEqual(protectedBefore, protectedAfter, 'Camera Color D6/T6 protected inventory');
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
			report: `# ${run.runId}: Camera Color D6/T6\n\nConclusion: **accepted**.\n\nThe versioned identity-clamp development operator exactly preserves all in-range values, analytically clamps only the declared Rec.709 boundary, leaves every earlier stage unchanged, and is shared by spectral and normalized-raw paths. The dark weak-blue result remains a diagnostic; no look is selected.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, summary: proof.summary}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {error: detail}, report: `# ${run.runId}: Camera Color D6/T6\n\nConclusion: **failed**.\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
