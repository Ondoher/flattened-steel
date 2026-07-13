#!/usr/bin/env node

import path from 'node:path';
import PROFILE from '../fixtures/camera-color-baseline-profile-v1.json' with {type: 'json'};
import {CameraColorModel} from '../color/CameraColorModel.js';
import {deriveCameraColorProfile} from '../color/CameraColorProfile.js';
import {
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
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-camera-color-model-d4-t4.js';
const GAINS = [1, 2, 4, 8, 16];
const ADC_BITS = [10, 12];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function exactTriplet(left, right) {
	return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function maximumAbsolute(values) {
	return Math.max(...values.map(Math.abs));
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'camera-color-model-d4-t4',
		command: COMMAND,
		inputs: {
			baseProfile: 'scripts/extraterrestrial/fixtures/camera-color-baseline-profile-v1.json',
			postWellGains: GAINS,
			isoLabels: [100, 200, 400, 800, 1600],
			adcBits: ADC_BITS,
			noise: 'disabled',
		},
		provenance: {
			purpose: 'Qualify post-well gain, ADC ordering, quantization, and deterministic noise-off behavior.',
			method: 'Analytic neutral spectra below raw full well, CameraColorProfile traced derivations, exact upstream identity, and half-code ADC bounds.',
			claimLimit: 'Simplified relative gain and uniform round-to-nearest ADC only; no named-camera ISO, noise, black drift, nonlinear ADC, or stochastic claim.',
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
		const policy = await loadContainmentPolicy();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		const baseModel = new CameraColorModel(PROFILE);
		const unitTrace = baseModel.traceRadiance(Array(15).fill(1));
		const unitPeak = Math.max(...unitTrace.photoelectrons);
		const spectrumAtWellFraction = (fraction) => Array(15).fill(
			fraction * PROFILE.device.fullWellElectrons / unitPeak,
		);
		const stimuli = [
			{id: 'gain-linear', spectrum: spectrumAtWellFraction(0.04)},
			{id: 'gain-adc-boundary', spectrum: spectrumAtWellFraction(0.75)},
		];

		const gainRows = [];
		let upstreamMismatchCount = 0;
		let gainEquationMaximumAbsoluteError = 0;
		let publicTraceMismatchCount = 0;
		for (const gain of GAINS) {
			const profile = gain === PROFILE.capture.postWellGain
				? PROFILE
				: deriveCameraColorProfile(PROFILE, {
					profileId: `generic-phone-post-well-gain-${gain}-v1`,
					path: 'capture.postWellGain',
					value: gain,
					derivation: {caseId: 'E-ISO', relativeGain: gain},
				});
			const model = new CameraColorModel(profile);
			for (const stimulus of stimuli) {
				const baseline = baseModel.traceRadiance(stimulus.spectrum);
				const trace = model.traceRadiance(stimulus.spectrum);
				const publicValue = model.radianceToDisplayRgb(stimulus.spectrum);
				if (!exactTriplet(trace.sensorPhotonIntegrals, baseline.sensorPhotonIntegrals)
					|| !exactTriplet(trace.photoelectrons, baseline.photoelectrons)
					|| !exactTriplet(trace.clippedElectrons, baseline.clippedElectrons)
					|| trace.rawClipped.some((value, index) => value !== baseline.rawClipped[index])) {
					upstreamMismatchCount += 1;
				}
				const expected = trace.clippedElectrons.map((value) => Math.min(1, Math.max(0,
					(value - profile.device.blackLevelElectrons) / profile.device.fullWellElectrons * gain,
				)));
				gainEquationMaximumAbsoluteError = Math.max(
					gainEquationMaximumAbsoluteError,
					maximumAbsolute(trace.normalizedPostGain.map((value, index) => value - expected[index])),
				);
				if (!exactTriplet(publicValue, trace.encodedSrgb)) publicTraceMismatchCount += 1;
				gainRows.push({
					profileId: profile.profileId,
					stimulusId: stimulus.id,
					gain,
					photoelectrons: trace.photoelectrons,
					rawClipped: trace.rawClipped,
					normalizedPostGain: trace.normalizedPostGain,
					adcCodes: trace.adcCodes,
					adcClipped: trace.adcClipped,
				});
			}
		}

		const adcStimuli = [0.001, 0.01, 0.1, 0.5, 0.999].map((fraction) => ({
			id: `adc-${fraction}`,
			spectrum: spectrumAtWellFraction(fraction / PROFILE.capture.postWellGain),
		}));
		const adcRows = [];
		let adcUpstreamMismatchCount = 0;
		let adcDownstreamMismatchCount = 0;
		let adcMaximumNormalizedQuantizationError = 0;
		let adcMaximumHalfCodeRatio = 0;
		for (const bits of ADC_BITS) {
			const profile = bits === PROFILE.device.adcBits
				? PROFILE
				: deriveCameraColorProfile(PROFILE, {
					profileId: `generic-phone-adc-${bits}-bit-v1`,
					path: 'device.adcBits',
					value: bits,
					derivation: {caseId: 'E-ADC', adcBits: bits},
				});
			const model = new CameraColorModel(profile);
			for (const stimulus of adcStimuli) {
				const baseline = baseModel.traceRadiance(stimulus.spectrum);
				const trace = model.traceRadiance(stimulus.spectrum);
				if (!exactTriplet(trace.photoelectrons, baseline.photoelectrons)
					|| !exactTriplet(trace.clippedElectrons, baseline.clippedElectrons)
					|| !exactTriplet(trace.normalizedPostGain, baseline.normalizedPostGain)) {
					adcUpstreamMismatchCount += 1;
				}
				if (!exactTriplet(trace.whiteBalanced, baseline.whiteBalanced)
					|| !exactTriplet(trace.xyzD65, baseline.xyzD65)
					|| !exactTriplet(trace.encodedSrgb, baseline.encodedSrgb)) {
					adcDownstreamMismatchCount += 1;
				}
				const maximumCode = 2 ** bits - 1;
				const errors = trace.adcCodes.map((code, index) => Math.abs(
					code / maximumCode - trace.normalizedPostGain[index],
				));
				const maximumError = Math.max(...errors);
				adcMaximumNormalizedQuantizationError = Math.max(adcMaximumNormalizedQuantizationError, maximumError);
				adcMaximumHalfCodeRatio = Math.max(adcMaximumHalfCodeRatio, maximumError / (0.5 / maximumCode));
				adcRows.push({
					profileId: profile.profileId,
					stimulusId: stimulus.id,
					adcBits: bits,
					adcMaximumCode: maximumCode,
					normalizedPostGain: trace.normalizedPostGain,
					adcCodes: trace.adcCodes,
					maximumNormalizedQuantizationError: maximumError,
				});
			}
		}

		const repeatSpectrum = spectrumAtWellFraction(0.37);
		const repeatA = baseModel.traceRadiance(repeatSpectrum);
		const repeatB = baseModel.traceRadiance(repeatSpectrum);
		const deterministicByteIdentity = JSON.stringify(repeatA) === JSON.stringify(repeatB);
		const gainAdcClippedCounts = GAINS.map((gain) => gainRows.filter((row) => row.gain === gain)
			.reduce((sum, row) => sum + row.adcClipped.filter(Boolean).length, 0));
		const assertions = [];
		const check = (value, message) => {
			requireCondition(value, message);
			assertions.push(message);
		};
		check(upstreamMismatchCount === 0, 'Post-well gain leaves sensor response, photoelectrons, full-well clipping, and raw clip masks byte-identical.');
		check(gainEquationMaximumAbsoluteError <= 1e-15, `Post-well gain follows the declared equation (${gainEquationMaximumAbsoluteError}).`);
		check(gainAdcClippedCounts.every((count, index) => index === 0 || count >= gainAdcClippedCounts[index - 1]), 'ADC-clipped channel counts are nondecreasing with gain.');
		check(adcUpstreamMismatchCount === 0, 'ADC bit depth leaves every upstream capture and pre-ADC value byte-identical.');
		check(adcDownstreamMismatchCount === 0, 'Diagnostic ADC bit depth does not alter floating WB, matrix, development, or output values.');
		check(adcMaximumHalfCodeRatio <= 1 + 1e-12, `Every ADC error is within one-half code (${adcMaximumHalfCodeRatio} half-code ratio).`);
		check(publicTraceMismatchCount === 0, 'Every gain-profile public result equals its trace terminal value.');
		check(deterministicByteIdentity, 'Repeated deterministic noise-off traces are byte-identical.');

		const proof = {
			proofId: 'camera-color-model-d4-t4-v1',
			accepted: true,
			assertions,
			summary: {
				gainProfileCount: GAINS.length,
				adcProfileCount: ADC_BITS.length,
				gainStimulusEvaluations: gainRows.length,
				adcStimulusEvaluations: adcRows.length,
				upstreamMismatchCount,
				adcUpstreamMismatchCount,
				adcDownstreamMismatchCount,
				publicTraceMismatchCount,
				gainEquationMaximumAbsoluteError,
				adcMaximumNormalizedQuantizationError,
				adcMaximumHalfCodeRatio,
				gainAdcClippedCounts,
				deterministicByteIdentity,
			},
			claimLimit: 'Post-well gain and uniform round-to-nearest ADC mechanics with noise disabled.',
		};
		await run.writeJsonArtifact('evidence/gain-cases.json', {schemaId: 'camera-d4-gain-cases-v1', rows: gainRows});
		await run.writeJsonArtifact('evidence/adc-cases.json', {schemaId: 'camera-d4-adc-cases-v1', rows: adcRows});
		await run.writeJsonArtifact('evidence/d4-t4-proof.json', proof);

		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-camera-color-model-d4-t4.js',
				'color/CameraColorModel.js',
				'color/CameraColorProfile.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: [
				'node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util',
			],
		});
		const protectedAfter = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(protectedBefore, protectedAfter, 'Camera Color D4/T4 protected inventory');
		proof.containment = {
			protectedFiles: protectedAfter.fileCount,
			closureFileCount: closure.files.length,
			runnerSha256: await sha256File(import.meta.filename),
			modelSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorModel.js')),
			profileSha256: await sha256File(path.join(EXPERIMENT_ROOT, 'color', 'CameraColorProfile.js')),
		};
		const manifest = await run.finalize({
			conclusion: 'accepted',
			result: proof,
			report: `# ${run.runId}: Camera Color D4/T4\n\nConclusion: **accepted**.\n\nPost-well gains ${GAINS.join(', ')} and ${ADC_BITS.join('/')}-bit ADC profiles preserve all owned upstream boundaries, obey gain and half-code equations, retain public/trace parity, and repeat byte-identically with noise disabled.\n`,
		});
		process.stdout.write(`${JSON.stringify({
			runId: run.runId,
			conclusion: 'accepted',
			artifactSetSha256: manifest.artifactSetSha256,
			summary: proof.summary,
		}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {error: detail},
				report: `# ${run.runId}: Camera Color D4/T4\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
