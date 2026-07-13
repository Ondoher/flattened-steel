import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/spectral-color-rgb-range-proof-v1.json' with { type: 'json' };
import PARAMETERS from '../fixtures/spectral-color-receptor-parameter-v1.json' with { type: 'json' };
import BRIDGE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import { BrightnessSelectedRgbRangeTransform } from '../color/BrightnessSelectedRgbRangeTransform.js';
import { createProjectionMatrix, parseCieLms } from '../color/ReceptorSpectralProjection.js';
import { deriveStage2bInputBridge } from '../color/Stage2bInputBridge.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-rgb-range-proof.js';
const LMS_PATH = path.join(EXPERIMENT_ROOT, 'references', 'cie-2006-lms-2deg', 'CIE_lms_cf_2deg.csv');
const XYZ_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const maximumAbsolute = (values) => Math.max(...values.map(Math.abs));
const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));
const warmth = (rgb) => (rgb[0] - rgb[2]) / Math.max(1e-15, rgb.reduce((sum, value) => sum + value, 0));

async function loadLedger() {
	const root = path.join(RUNS_ROOT, FIXTURE.input.runId); await lstat(root); await assertNoReparseEntries(root, 'RGB-range ledger input');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === FIXTURE.input.runId && manifest.conclusion === 'accepted'
		&& manifest.artifactSetSha256 === FIXTURE.input.artifactSetSha256, 'Ledger identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === FIXTURE.input.ledgerSha256 && entry.byteLength === bytes.byteLength
		&& sha256(bytes) === entry.sha256, 'Ledger artifact changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function analyze(transform, rows) {
	const checks = []; const t = FIXTURE.tolerances;
	const check = (passed, message, detail) => checks.push({ passed, message, ...(detail === undefined ? {} : { detail }) });
	const outputs = rows.map((row) => row.output);
	check(outputs.every((output) => [...output.lms, ...output.sourceXyz, ...output.signedLinearRec709,
		...output.linearRec709, ...output.encodedSrgb, ...output.range.blackThresholds,
		...output.range.whiteThresholds].every(Number.isFinite)), 'Every measured intermediate and threshold is finite.');
	check(outputs.every((output) => output.linearRec709.every((value) => value >= -t.boundsAbsolute
		&& value <= 1 + t.boundsAbsolute)), 'Every measured RGB-range output is bounded.');
	const neutralErrors = []; const monotonicErrors = []; const crossingErrors = [];
	for (const row of rows) {
		const state = row.output.range; let previous = -Infinity;
		for (let index = 0; index < FIXTURE.synthetic.neutralSteps; index += 1) {
			const multiplier = index / (FIXTURE.synthetic.neutralSteps - 1) * 4;
			const mapped = transform.mapLinearRgb(Array(3).fill(state.midpoint * multiplier), row.LA).linearRec709;
			neutralErrors.push(maximumAbsolute(mapped.map((value) => value - mapped[0])));
		}
		for (let index = 0; index < FIXTURE.synthetic.channelSteps; index += 1) {
			const fraction = index / (FIXTURE.synthetic.channelSteps - 1);
			const exponent = Math.log10(FIXTURE.synthetic.channelMinimumMidpointMultiple)
				+ fraction * Math.log10(FIXTURE.synthetic.channelMaximumMidpointMultiple / FIXTURE.synthetic.channelMinimumMidpointMultiple);
			const response = transform.respond(state.midpoint * 10 ** exponent, state.midpoint);
			monotonicErrors.push(previous === -Infinity ? 0 : previous - response); previous = response;
		}
		crossingErrors.push(Math.abs(transform.respond(state.blackThresholds[0], state.midpoint) - FIXTURE.range.blackResponse));
		crossingErrors.push(Math.abs(transform.respond(state.whiteThresholds[0], state.midpoint) - FIXTURE.range.whiteResponse));
	}
	const maximumNeutralError = Math.max(...neutralErrors); const maximumMonotonicViolation = Math.max(...monotonicErrors); const maximumCrossingError = Math.max(...crossingErrors);
	check(maximumNeutralError <= t.neutralAbsolute, 'Equal standard linear RGB inputs remain neutral through every selected range.', maximumNeutralError);
	check(maximumMonotonicViolation <= t.strictMonotonicAbsolute, 'Each selected RGB range is monotonic over twelve orders of midpoint-relative input.', maximumMonotonicViolation);
	check(maximumCrossingError <= t.crossingAbsolute, 'Selected black and white thresholds reproduce the declared one-percent and ninety-nine-percent responses.', maximumCrossingError);
	check(rows.every((row, index) => index === 0 || row.output.range.midpoint < rows[index - 1].output.range.midpoint), 'Recorded local brightness selects strictly decreasing range thresholds from noon through sunset.', rows.map((row) => row.output.range.midpoint));
	const minimumDistance = Math.min(...rows.flatMap((row, index) => rows.slice(index + 1).map((other) => distance(row.output.encodedSrgb, other.output.encodedSrgb))));
	check(minimumDistance >= t.minimumMeasuredEncodedDistance, 'All four measured disk outputs remain distinct.', minimumDistance);
	const displayWarmth = rows.map((row) => warmth(row.output.encodedSrgb));
	check(displayWarmth.every((value, index) => index === 0 || value > displayWarmth[index - 1] + t.minimumWarmOrderingDelta), 'Noon through sunset retains strictly increasing RGB warmth.', displayWarmth);
	check(outputs.every((output) => !output.encodedSrgb.every((value) => value === 1)), 'No measured disk output is exact white.');
	check(outputs.every((output) => !output.encodedSrgb.every((value) => value === 0)), 'No measured disk output is exact black.');
	return { accepted: checks.every((entry) => entry.passed), checks, summary: {
		checkCount: checks.length, passedCheckCount: checks.filter((entry) => entry.passed).length,
		measuredCount: rows.length, maximumNeutralError, maximumMonotonicViolation, maximumCrossingError,
		minimumMeasuredEncodedDistance: minimumDistance,
		exactWhiteCount: outputs.filter((output) => output.encodedSrgb.every((value) => value === 1)).length,
		exactBlackCount: outputs.filter((output) => output.encodedSrgb.every((value) => value === 0)).length,
		whiteLimitedChannelCount: outputs.reduce((sum, output) => sum + output.whiteLimited.filter(Boolean).length, 0),
		visual: Object.fromEntries(rows.map((row, index) => [row.key, { LA: row.LA,
			midpoint: row.output.range.midpoint, blackThresholds: row.output.range.blackThresholds,
			whiteThresholds: row.output.range.whiteThresholds, sourceLinearRec709: row.output.signedLinearRec709,
			linearRec709: row.output.linearRec709, encodedSrgb: row.output.encodedSrgb,
			warmth: displayWarmth[index] }]))
	} };
}

async function main() {
	const run = await initializeRunRecord({ slug: 'spectral-color-rgb-range-proof', command: COMMAND,
		inputs: { fixture: 'scripts/extraterrestrial/fixtures/spectral-color-rgb-range-proof-v1.json', sourceRunId: FIXTURE.input.runId,
			scope: 'four measured disk spectra plus synthetic neutral/range checks; no atmosphere execution, framebuffer, or image' },
		provenance: { projection: 'CIE 2006 2-degree LMS to CIE 2015 XYZ_F to standard linear Rec.709',
			range: 'condition-wide midpoint from recorded L_A and analytic full solar-disk support; Naka-Rushton n=0.74 independently over integrated RGB channels' },
		environment: { node: process.version, platform: process.platform },
		references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md' } });
	try {
		await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await createProtectedTrackedInventory(policy); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{ ledger, manifest }, lmsText, xyzText] = await Promise.all([loadLedger(), readFile(LMS_PATH, 'utf8'), readFile(XYZ_PATH, 'utf8')]);
		const transform = new BrightnessSelectedRgbRangeTransform({ projectionMatrix: createProjectionMatrix(parseCieLms(lmsText), ledger.spectralBasis),
			lmsToXyzF: PARAMETERS.absoluteNormalization.lmsToCie2015XyzF, exponent: FIXTURE.range.exponent,
			fullDiskSolidAngleSteradians: Math.PI * Math.sin(FIXTURE.sphericalAngularRadiusRadians) ** 2,
			blackResponse: FIXTURE.range.blackResponse, whiteResponse: FIXTURE.range.whiteResponse });
		requireCondition(transform.describe().id === FIXTURE.transformId, 'Transform identity changed.');
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE, cieRows: parseCie1931(xyzText) }); const byKey = new Map(bridge.rows.map((row) => [row.key, row]));
		const rows = FIXTURE.conditions.map((key) => { const input = byKey.get(key); requireCondition(input, `Missing measured row ${key}.`); return { key, LA: input.adaptingLuminanceCdPerSquareMeter, spectrum: input.spectralRadiance, output: transform.transformSpectrum(input.spectralRadiance, input.adaptingLuminanceCdPerSquareMeter) }; });
		const analysis = analyze(transform, rows); await run.writeJsonArtifact('evidence/rgb-range.json', { schemaId: 'spectral-color-rgb-range-result-v1', input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: FIXTURE.input.ledgerSha256 }, configuration: FIXTURE, transform: transform.describe(), rows });
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-rgb-range-proof.js','color/BrightnessSelectedRgbRangeTransform.js','color/ReceptorSpectralProjection.js','color/Stage2bInputBridge.js','color/Cam16Reference.js','color/NormalColorTransform.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util'] });
		const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'RGB-range protected inventory');
		const proof = { proofId: 'spectral-color-rgb-range-v1', accepted: analysis.accepted, checks: analysis.checks, summary: analysis.summary,
			claimLimit: 'Numerical qualification of the minimal RGB-range formulation only; no Normal appearance or full-frame claim.',
			remaining: analysis.accepted ? ['four-frame full-context review'] : ['resolve failed numerical gates'], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/rgb-range-proof.json', proof); const conclusion = proof.accepted ? 'accepted' : 'rejected'; const finalManifest = await run.finalize({ conclusion, result: proof, report: `# ${run.runId}: Brightness-selected RGB-range proof\n\nConclusion: **${conclusion} for the minimal numerical RGB-range formulation**.\n\n${analysis.summary.passedCheckCount}/${analysis.summary.checkCount} gates passed. Standard spectral integration precedes one condition-wide RGB range; no atmosphere, framebuffer, or image was executed.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion, artifactSetSha256: finalManifest.artifactSetSha256, summary: proof.summary, failedChecks: proof.checks.filter((entry) => !entry.passed) }, null, 2)}\n`); if (!proof.accepted) process.exitCode = 1;
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: RGB-range proof\n\nConclusion: **failed**.\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; }
}

await main();
