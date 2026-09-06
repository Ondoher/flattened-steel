import {createHash} from 'node:crypto';
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/spectral-color-receptor-display-proof-v1.json' with {type: 'json'};
import PARAMETERS from '../fixtures/spectral-color-receptor-parameter-v1.json' with {type: 'json'};
import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with {type: 'json'};
import {ReceptorNormalDisplayTransform} from '../color/ReceptorNormalDisplayTransform.js';
import {createProjectionMatrix, normalizeLmsMatrix, parseCieLms} from '../color/ReceptorSpectralProjection.js';
import {deriveStage2bInputBridge} from '../color/Stage2bInputBridge.js';
import {parseCie1931} from '../color/NormalColorTransform.js';
import {assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual} from '../harness/lib/hashes.js';
import {buildStaticModuleClosure} from '../harness/lib/module-closure.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity} from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-spectral-color-receptor-display-proof.js';
const LMS_PATH = path.join(EXPERIMENT_ROOT, 'references', 'cie-2006-lms-2deg', 'CIE_lms_cf_2deg.csv');
const XYZ_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');

function requireCondition(value, message) { if (!value) throw new Error(message); }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function maximumAbsolute(left, right) { return Math.max(...left.map((value, index) => Math.abs(value - right[index]))); }
function maximumRelative(left, right) { return Math.max(...left.map((value, index) =>
	Math.abs(value - right[index]) / Math.max(1e-30, Math.abs(left[index]), Math.abs(right[index])))); }
function distance(left, right) { return Math.hypot(...left.map((value, index) => value - right[index])); }
function spread(values) { return Math.max(...values) - Math.min(...values); }
function circularDistance(left, right) { const delta = Math.abs(left - right) % 360; return Math.min(delta, 360 - delta); }
function warmth(linearRgb) { return (linearRgb[0] - linearRgb[2]) / Math.max(1e-15, linearRgb.reduce((sum, value) => sum + value, 0)); }

async function loadArtifact(specification, label) {
	const root = path.join(RUNS_ROOT, specification.runId);
	await lstat(root);
	await assertNoReparseEntries(root, label);
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === specification.runId
		&& manifest.conclusion === 'accepted'
		&& manifest.artifactSetSha256 === specification.artifactSetSha256,
	`${label} identity changed.`);
	const entry = manifest.artifacts.find((artifact) => artifact.path === specification.path);
	const bytes = await readFile(path.join(root, specification.path));
	requireCondition(entry?.sha256 === specification.sha256
		&& entry.byteLength === bytes.byteLength
		&& sha256(bytes) === specification.sha256, `${label} artifact changed.`);
	return {manifest, value: JSON.parse(bytes.toString('utf8'))};
}

async function loadLedger() {
	return loadArtifact({
		runId: FIXTURE.input.runId,
		artifactSetSha256: FIXTURE.input.artifactSetSha256,
		path: FIXTURE.input.ledgerPath,
		sha256: FIXTURE.input.ledgerSha256,
	}, 'Receptor-display ledger input');
}

function createTransform(ledger, lmsRows) {
	const rawMatrix = createProjectionMatrix(lmsRows, ledger.spectralBasis);
	const normalization = normalizeLmsMatrix(rawMatrix,
		PARAMETERS.absoluteNormalization.lmsToCie2015XyzF,
		PARAMETERS.absoluteNormalization.d65XyzRelative);
	return {
		normalization,
		transform: new ReceptorNormalDisplayTransform({
			projectionMatrix: normalization.matrix,
			channelScale: normalization.channelScale,
			lmsToXyzF: PARAMETERS.absoluteNormalization.lmsToCie2015XyzF,
			d65XyzRelative: PARAMETERS.absoluteNormalization.d65XyzRelative,
			exponent: PARAMETERS.primaryResponse.exponent,
			halfSaturationNumerator: PARAMETERS.primaryResponse.halfSaturation.cam16HalfSaturationNumerator,
		}),
	};
}

function neutralSweep(transform) {
	return Array.from({length: FIXTURE.synthetic.neutralSampleCount}, (_, index) => {
		const response = index / (FIXTURE.synthetic.neutralSampleCount - 1);
		return {response, output: transform.mapResponse([response, response, response])};
	});
}

function responseCube(transform) {
	const steps = FIXTURE.synthetic.responseCubeSteps;
	const rows = [];
	for (let l = 0; l < steps; l += 1) for (let m = 0; m < steps; m += 1) for (let s = 0; s < steps; s += 1) {
		const response = [l, m, s].map((value) => value / (steps - 1));
		const output = transform.mapResponse(response);
		const expectedEquivalent = response.map((value) =>
			output.relativeY + output.gamutScale * (value - output.relativeY));
		let continuityDistance = 0;
		for (let axis = 0; axis < 3; axis += 1) {
			const perturbed = [...response];
			perturbed[axis] = Math.min(1, perturbed[axis] + FIXTURE.synthetic.continuityPerturbation);
			continuityDistance = Math.max(continuityDistance,
				distance(output.encodedSrgb, transform.mapResponse(perturbed).encodedSrgb));
		}
		rows.push({response, output, expectedEquivalent, continuityDistance});
	}
	return rows;
}

function measuredRows(transform, bridge) {
	const byKey = new Map(bridge.rows.map((row) => [row.key, row]));
	return FIXTURE.calibrationRows.map((key) => {
		const input = byKey.get(key);
		requireCondition(input, `Missing calibration input ${key}.`);
		return {
			key,
			adaptingLuminanceCdPerSquareMeter: input.adaptingLuminanceCdPerSquareMeter,
			output: transform.transformSpectrum(input.spectralRadiance,
				input.adaptingLuminanceCdPerSquareMeter),
		};
	});
}

function analyze({transform, neutral, cube, measured, metamer}) {
	const t = FIXTURE.proofGates;
	const checks = [];
	const check = (passed, message, detail = undefined) => checks.push(detail === undefined
		? {passed, message}
		: {passed, message, detail});
	const allOutputs = [...neutral.map((row) => row.output), ...cube.map((row) => row.output), ...measured.map((row) => row.output)];
	check(allOutputs.every((output) => [
		...output.response, ...output.xyzRelative, ...output.signedLinearRec709,
		...output.linearRec709, ...output.encodedSrgb, ...output.mappedResponseEquivalent,
	].every(Number.isFinite)), 'Every synthetic and measured intermediate is finite.');
	check(allOutputs.every((output) => output.linearRec709.every((value) =>
		value >= -t.boundsAbsolute && value <= 1 + t.boundsAbsolute)
		&& output.encodedSrgb.every((value) => value >= -t.boundsAbsolute && value <= 1 + t.boundsAbsolute)),
	'Every mapped linear and encoded output is display-bounded.');
	const neutralSpread = Math.max(...neutral.map((row) => spread(row.output.linearRec709)));
	const neutralAbsolute = Math.max(...neutral.map((row) => maximumAbsolute(
		row.output.linearRec709, [row.response, row.response, row.response])));
	check(neutralSpread <= t.neutralMaximumSpread && neutralAbsolute <= t.neutralMaximumAbsolute,
	'D65-neutral response remains neutral and maps linearly from black to peak white.', {neutralSpread, neutralAbsolute});
	const neutralMonotonic = neutral.every((row, index) => index === 0
		|| row.output.relativeY >= neutral[index - 1].output.relativeY - t.strictMonotonicAbsolute);
	check(neutralMonotonic && neutral.at(-1).output.relativeY > neutral[0].output.relativeY,
	'Neutral display luminance is monotonic and nonconstant.');
	const responseRoundTrip = Math.max(...cube.map((row) =>
		maximumAbsolute(row.output.mappedResponseEquivalent, row.expectedEquivalent)));
	check(responseRoundTrip <= t.responseRoundTripMaximumAbsolute,
	'The gamut boundary is exactly one neutral-directed scaling in receptor coordinates.', responseRoundTrip);
	const hueErrors = cube.filter((row) => row.output.inputOpponent.magnitude > FIXTURE.synthetic.neutralHueThreshold
		&& row.output.outputOpponent.magnitude > FIXTURE.synthetic.neutralHueThreshold)
		.map((row) => circularDistance(row.output.inputOpponent.degrees, row.output.outputOpponent.degrees));
	const maximumHueError = Math.max(0, ...hueErrors);
	check(maximumHueError <= t.hueMaximumDegrees,
	'Nonneutral synthetic responses preserve receptor-opponent hue through gamut containment.', maximumHueError);
	const maximumContinuityDistance = Math.max(...cube.map((row) => row.continuityDistance));
	check(maximumContinuityDistance <= t.continuityMaximumEncodedDistance,
	'The response-to-display transform is continuous under the declared perturbation.', maximumContinuityDistance);
	const metamerLeft = transform.transformSpectrum(metamer.left, 100);
	const metamerRight = transform.transformSpectrum(metamer.right, 100);
	const metamerDifference = maximumAbsolute(metamerLeft.encodedSrgb, metamerRight.encodedSrgb);
	check(metamerDifference <= t.metamerEncodedMaximumAbsolute,
	'The accepted spectral metamers remain identical through display encoding.', metamerDifference);
	const minimumMeasuredDistance = Math.min(...measured.flatMap((row, index) =>
		measured.slice(index + 1).map((other) => distance(row.output.encodedSrgb, other.output.encodedSrgb))));
	check(minimumMeasuredDistance >= t.minimumMeasuredEncodedDistance,
	'Every calibration observation retains a distinct float display output.', minimumMeasuredDistance);
	const plateauPairs = measured.flatMap((row, index) => measured.slice(index + 1).map((other) => ({
		left: row.key,
		right: other.key,
		maximumInputRelative: maximumRelative(row.output.normalizedLms, other.output.normalizedLms),
		maximumChannelDifference: maximumAbsolute(row.output.encodedSrgb, other.output.encodedSrgb),
	})));
	const materiallyCollapsedPairs = plateauPairs.filter((pair) =>
		pair.maximumInputRelative >= t.materialInputMaximumRelative
		&& pair.maximumChannelDifference <= t.plateauChannelAbsolute);
	const nearEquivalentPairs = plateauPairs.filter((pair) =>
		pair.maximumInputRelative < t.materialInputMaximumRelative
		&& pair.maximumChannelDifference <= t.plateauChannelAbsolute);
	check(materiallyCollapsedPairs.length === 0,
	'No materially different calibration receptor inputs share an unexplained encoded-float plateau.',
	materiallyCollapsedPairs);
	const byKey = new Map(measured.map((row) => [row.key, row]));
	const sunset = ['spherical-distant/sunset-minus-60', 'spherical-distant/sunset-minus-30', 'spherical-distant/sunset']
		.map((key) => byKey.get(key));
	const brightness = sunset.map((row) => row.output.relativeY);
	const warmthValues = sunset.map((row) => warmth(row.output.linearRec709));
	check(brightness[0] > brightness[1] && brightness[1] > brightness[2],
	'Spherical display luminance decreases from sunset minus 60 to minus 30 to sunset.', brightness);
	check(warmthValues[1] > warmthValues[0] + t.minimumWarmOrderingDelta
		&& warmthValues[2] > warmthValues[1] + t.minimumWarmOrderingDelta,
	'Spherical red-versus-blue dominance increases from sunset minus 60 to minus 30 to sunset.', warmthValues);
	const exactWhiteCount = measured.filter((row) => row.output.encodedSrgb.every((value) => value === 1)).length;
	check(exactWhiteCount === 0, 'No calibration output is exact white.', exactWhiteCount);
	return {
		checks,
		accepted: checks.every((entry) => entry.passed),
		summary: {
			checkCount: checks.length,
			passedCheckCount: checks.filter((entry) => entry.passed).length,
			neutralSampleCount: neutral.length,
			responseCubeSampleCount: cube.length,
			calibrationCount: measured.length,
			boundaryLimitedCubeCount: cube.filter((row) => row.output.gamutLimited).length,
			boundaryLimitedCalibrationCount: measured.filter((row) => row.output.gamutLimited).length,
			zeroScaleCubeCount: cube.filter((row) => row.output.gamutScale === 0).length,
			minimumMeasuredEncodedDistance: minimumMeasuredDistance,
			maximumHueErrorDegrees: maximumHueError,
			maximumContinuityEncodedDistance: maximumContinuityDistance,
			maximumResponseRoundTripAbsolute: responseRoundTrip,
			metamerEncodedMaximumAbsolute: metamerDifference,
			exactWhiteCalibrationCount: exactWhiteCount,
			materiallyCollapsedPairs,
			nearEquivalentPairs,
			sunsetBrightness: brightness,
			sunsetWarmth: warmthValues,
		},
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'spectral-color-receptor-display-proof',
		command: COMMAND,
		inputs: {
			fixture: 'experiments/extraterrestrial/fixtures/spectral-color-receptor-display-proof-v1.json',
			measuredInputRunId: FIXTURE.input.runId,
			metamerInputRunId: FIXTURE.metamerInput.runId,
			calibrationRows: FIXTURE.calibrationRows,
			scope: 'calibration-only numerical receptor-to-display qualification; no atmosphere, cache, framebuffer, image, or held-out display transform',
		},
		provenance: {
			observer: 'CIE 2006 LMS 2-degree energy fundamentals',
			response: 'n=0.74 Naka-Rushton with declared CAM16 F_L half-saturation placement',
			display: 'CIE 170-2 LMS/XYZ_F, D65-normalized 100-nit Rec.709, same-luminance neutral gamut boundary',
		},
		environment: {node: process.version, platform: process.platform},
		references: {
			plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#receptor-response-normal-plan',
			research: 'agents/topics/extraterrestrial/receptor-response-parameter-research.md',
		},
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{manifest: ledgerManifest, value: ledger}, metamerArtifact, lmsBytes, xyzBytes] = await Promise.all([
			loadLedger(),
			loadArtifact(FIXTURE.metamerInput, 'Receptor-display metamer input'),
			readFile(LMS_PATH),
			readFile(XYZ_PATH),
		]);
		requireCondition(sha256(lmsBytes) === PARAMETERS.spectralObserver.datasetSha256,
			'Pinned LMS dataset identity changed.');
		const {normalization, transform} = createTransform(ledger, parseCieLms(lmsBytes.toString('utf8')));
		const bridge = deriveStage2bInputBridge({ledger, fixture: BRIDGE_FIXTURE,
			cieRows: parseCie1931(xyzBytes.toString('utf8'))});
		const neutral = neutralSweep(transform);
		const cube = responseCube(transform);
		const measured = measuredRows(transform, bridge);
		const analysis = analyze({transform, neutral, cube, measured,
			metamer: metamerArtifact.value.metamer});
		const evidence = {
			schemaId: 'spectral-color-receptor-display-proof-result-v1',
			input: {
				runId: ledgerManifest.runId,
				artifactSetSha256: ledgerManifest.artifactSetSha256,
				ledgerSha256: FIXTURE.input.ledgerSha256,
				metamerRunId: metamerArtifact.manifest.runId,
				metamerArtifactSetSha256: metamerArtifact.manifest.artifactSetSha256,
			},
			configuration: FIXTURE,
			transform: transform.describe(),
			normalization: {
				d65Lms: normalization.d65Lms,
				channelScale: normalization.channelScale,
				projectionMatrix: normalization.matrix,
			},
			measured,
			syntheticSummary: analysis.summary,
			checks: analysis.checks,
			claimLimit: FIXTURE.claim,
		};
		await run.writeJsonArtifact('evidence/receptor-display-proof.json', evidence);
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: [
				'runners/run-spectral-color-receptor-display-proof.js',
				'color/ReceptorNormalDisplayTransform.js',
				'color/ReceptorSpectralProjection.js',
				'color/Stage2bInputBridge.js',
				'color/NormalColorTransform.js',
				'color/Cam16Reference.js',
			],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises',
				'node:module', 'node:os', 'node:path', 'node:url', 'node:util'],
		});
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Receptor display protected inventory');
		const proof = {
			proofId: 'spectral-color-receptor-display-proof-v1',
			accepted: analysis.accepted,
			checks: analysis.checks,
			summary: analysis.summary,
			transform: transform.describe(),
			claimLimit: FIXTURE.claim,
			remaining: analysis.accepted
				? ['freeze candidate identity', 'live four-frame exact-time Algorithm32 atmospheric review', 'held-out observer-proxy decision']
				: ['revise or reject the fixed receptor/display bridge without fitting images'],
			containment: {protectedFiles: after.fileCount,
				closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length},
		};
		await run.writeJsonArtifact('evidence/receptor-display-acceptance.json', proof);
		const conclusion = analysis.accepted ? 'accepted' : 'rejected';
		const terminal = await run.finalize({
			conclusion,
			result: proof,
			report: `# ${run.runId}: Receptor display proof\n\nConclusion: **${conclusion} for the calibration-only numerical receptor/display bridge**.\n\n${analysis.summary.passedCheckCount}/${analysis.summary.checkCount} predeclared checks passed across ${analysis.summary.neutralSampleCount} neutral samples, ${analysis.summary.responseCubeSampleCount} response-cube samples, the accepted metamer pair, and ${analysis.summary.calibrationCount} measured calibration spectra. No atmosphere, cache, framebuffer, image, or held-out display transform was executed.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion,
			artifactSetSha256: terminal.artifactSetSha256, summary: analysis.summary,
			failedChecks: analysis.checks.filter((entry) => !entry.passed)}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error.name, message: error.message, stack: error.stack};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({conclusion: 'failed', result: {error: detail},
				report: `# ${run.runId}: Receptor display proof\n\nConclusion: **failed**.\n\n${detail.message}\n`});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed',
				artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
