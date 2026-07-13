import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import FIXTURE from '../fixtures/spectral-color-stage2-isolated-disk-v1.json' with { type: 'json' };
import { NormalColorTransform, parseCie1931 } from '../color/NormalColorTransform.js';
import { BrunetonColorDisplayModel } from '../candidate/src/algorithm32/color/BrunetonColorDisplayModel.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/index.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { CANDIDATE_ROOT, EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-stage2-isolated-disk.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const BRUNETON_PATH = path.join(CANDIDATE_ROOT, 'src', 'algorithm32', 'color', 'BrunetonColorDisplayModel.js');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const maximumAbsoluteDifference = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
const maximumRelativeDifference = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index]) / Math.max(1, Math.abs(value), Math.abs(right[index]))));

async function loadInputLedger() {
	const runRoot = path.join(RUNS_ROOT, FIXTURE.input.runId); await lstat(runRoot); await assertNoReparseEntries(runRoot, 'Stage 2 input run');
	const manifest = JSON.parse(await readFile(path.join(runRoot, 'artifact-manifest.json'), 'utf8')); requireCondition(manifest.runId === FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === FIXTURE.input.artifactSetSha256, 'Stage 2 input run identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === FIXTURE.input.ledgerPath); requireCondition(entry?.sha256 === FIXTURE.input.ledgerSha256, 'Stage 2 ledger manifest identity changed.');
	const bytes = await readFile(path.join(runRoot, FIXTURE.input.ledgerPath)); requireCondition(bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Stage 2 ledger bytes do not match the immutable manifest.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function selectedSamples(ledger) {
	const samples = [];
	for (const family of [ledger.spherical, ledger.flat]) for (const condition of family.conditions) {
		const sample = condition.samples.find((candidate) => candidate.role === FIXTURE.input.sampleRole);
		if (!sample || sample.colorInputEligibility !== FIXTURE.input.eligibility) continue;
		samples.push({ family: family.family, conditionId: condition.id, series: condition.series, ...(condition.timeIso === undefined ? {} : { timeIso: condition.timeIso }), ...(condition.unwrappedAngleDegrees === undefined ? {} : { unwrappedAngleDegrees: condition.unwrappedAngleDegrees }), values: sample[FIXTURE.input.spectrum], retainedDerived: sample.derived[FIXTURE.input.spectrum] });
	}
	return samples;
}

function asPacket(sample) {
	return createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: sample.values, provenanceIdentity: `stage2:${sample.family}:${sample.conditionId}` });
}

function encodedHex(rgb) { return `#${rgb.map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, '0')).join('')}`; }
function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

function renderSvg(rows, lane, title) {
	const config = FIXTURE.render; const columns = 7; const count = rows.length; const width = columns * config.cellWidthPixels; const rowCount = Math.ceil(count / columns); const height = 48 + rowCount * config.cellHeightPixels;
	const cells = rows.map((row, index) => { const column = index % columns; const line = Math.floor(index / columns); const x = column * config.cellWidthPixels; const y = 48 + line * config.cellHeightPixels; const rgb = lane === 'laneA' ? row.laneA.encodedSrgb : row.laneB.displayRgb; const secondary = lane === 'laneA' ? `${row.laneA.mappedLuminanceNitsUnbounded.toFixed(1)} nit; g=${row.laneA.gamutScale.toFixed(3)}` : `spread=${(Math.max(...rgb) - Math.min(...rgb)).toExponential(2)}`; return `<g transform="translate(${x} ${y})"><rect width="${config.cellWidthPixels}" height="${config.cellHeightPixels}" fill="black"/><circle cx="${config.cellWidthPixels / 2}" cy="${config.diskRadiusPixels + 6}" r="${config.diskRadiusPixels}" fill="${encodedHex(rgb)}"/><text x="${config.cellWidthPixels / 2}" y="${config.diskRadiusPixels * 2 + 20}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="11">${escapeXml(row.conditionId)}</text><text x="${config.cellWidthPixels / 2}" y="${config.diskRadiusPixels * 2 + 35}" text-anchor="middle" fill="#aaa" font-family="sans-serif" font-size="9">${escapeXml(secondary)}</text></g>`; }).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#111"/><text x="18" y="30" fill="white" font-family="sans-serif" font-size="18">${escapeXml(title)}</text>${cells}</svg>`;
}

function csv(rows) {
	const header = ['family','condition_id','series','input_Y_cd_m2','input_x','input_y','mapped_Y_nits','gamut_scale','laneA_R','laneA_G','laneA_B','laneB_R','laneB_G','laneB_B'];
	return `${[header.join(','), ...rows.map((row) => [row.family,row.conditionId,row.series,row.laneA.inputLuminanceCdPerSquareMeter,...row.laneA.inputChromaticityXy,row.laneA.mappedLuminanceNitsUnbounded,row.laneA.gamutScale,...row.laneA.encodedSrgb,...row.laneB.displayRgb].join(','))].join('\n')}\n`;
}

function analyze(rows, transform, brunetonSourceHashBefore, brunetonSourceHashAfter) {
	const assertions = []; const check = (value, message) => { requireCondition(value, message); assertions.push(message); }; const tolerance = FIXTURE.tolerances;
	check(rows.length === FIXTURE.input.expectedSampleCount, 'The laboratory contains all 25 eligible isolated disk spectra.'); check(brunetonSourceHashBefore === brunetonSourceHashAfter, 'Lane B source remains byte-for-byte unchanged.');
	let maximumProjectionXyzAbsolute = 0; let maximumChromaticityShift = 0; let maximumLaneBLinearAbsolute = 0; let maximumLaneBLinearRelative = 0; let laneAExactWhiteCount = 0; let laneBExactWhiteCount = 0; let maximumGamutCompression = 0;
	for (const row of rows) {
		maximumProjectionXyzAbsolute = Math.max(maximumProjectionXyzAbsolute, maximumAbsoluteDifference(row.laneA.inputXyz, row.retainedDerived.xyz)); maximumChromaticityShift = Math.max(maximumChromaticityShift, maximumAbsoluteDifference(row.laneA.inputChromaticityXy, row.laneA.mappedChromaticityXy)); maximumLaneBLinearAbsolute = Math.max(maximumLaneBLinearAbsolute, maximumAbsoluteDifference(row.laneB.linearSrgb, row.retainedDerived.signedLinearSrgb)); maximumLaneBLinearRelative = Math.max(maximumLaneBLinearRelative, maximumRelativeDifference(row.laneB.linearSrgb, row.retainedDerived.signedLinearSrgb));
		check(row.laneA.encodedSrgb.every((value) => Number.isFinite(value) && value >= -tolerance.rgbBoundsAbsolute && value <= 1 + tolerance.rgbBoundsAbsolute), `${row.family}/${row.conditionId} lane A is finite and display-bounded.`); check(row.laneA.gamutMappedLinearSrgb.every((value) => value >= -tolerance.rgbBoundsAbsolute && value <= 1 + tolerance.rgbBoundsAbsolute), `${row.family}/${row.conditionId} joint gamut output is bounded without channel clipping.`); check(maximumAbsoluteDifference(row.laneA.inputChromaticityXy, row.laneA.mappedChromaticityXy) <= tolerance.chromaticityAbsolute, `${row.family}/${row.conditionId} luminance mapping preserves projected chromaticity.`);
		if (row.laneA.encodedSrgb.every((value) => value === 1)) laneAExactWhiteCount += 1; if (row.laneB.displayRgb.every((value) => value === 1)) laneBExactWhiteCount += 1; maximumGamutCompression = Math.max(maximumGamutCompression, 1 - row.laneA.gamutScale);
	}
	check(maximumProjectionXyzAbsolute <= 1e-6, 'Lane A reproduces the retained native-15 CIE XYZ projection.'); check(maximumLaneBLinearRelative <= tolerance.laneBIdentityRelative, 'Lane B reproduces the retained Bruneton signed-linear RGB projection within a scale-aware identity bound.'); check(laneAExactWhiteCount === 0, 'Lane A has no exact-white disk plateau.');
	const neutralLevels = [1e4,1e5,1e6,1e7,1e8,1e9].map((Y) => transform.transformXyz([0.95047 * Y, Y, 1.08883 * Y])); check(neutralLevels.every((value) => Math.max(...value.encodedSrgb) - Math.min(...value.encodedSrgb) <= tolerance.neutralEncodedSpread), 'D65 neutral sweeps remain neutral.'); check(neutralLevels.every((value, index) => index === 0 || value.mappedLuminanceNitsUnbounded > neutralLevels[index - 1].mappedLuminanceNitsUnbounded + tolerance.lightnessMonotonicAbsolute), 'Lane A lightness mapping is strictly increasing over the disk range.');
	const warmRows = rows.filter((row) => row.series.includes('sunset') || row.series.includes('farthest')); check(warmRows.every((row) => Math.max(...row.laneA.encodedSrgb) - Math.min(...row.laneA.encodedSrgb) > 1e-4), 'Every warm sunset/farthest disk retains encoded channel distinction.');
	return { accepted: true, assertions, summary: { sampleCount: rows.length, laneAExactWhiteCount, laneBExactWhiteCount, maximumProjectionXyzAbsolute, maximumLaneBLinearAbsolute, maximumLaneBLinearRelative, maximumChromaticityShift, maximumGamutCompression, inputLuminanceRangeCdPerSquareMeter: [Math.min(...rows.map((row) => row.laneA.inputLuminanceCdPerSquareMeter)), Math.max(...rows.map((row) => row.laneA.inputLuminanceCdPerSquareMeter))], laneAMappedLuminanceRangeNits: [Math.min(...rows.map((row) => row.laneA.mappedLuminanceNitsUnbounded)), Math.max(...rows.map((row) => row.laneA.mappedLuminanceNitsUnbounded))] } };
}

async function main() {
	const run = await initializeRunRecord({ slug: 'spectral-color-stage2-isolated-disk', command: COMMAND, inputs: { fixture: 'scripts/extraterrestrial/fixtures/spectral-color-stage2-isolated-disk-v1.json', measuredInputRunId: FIXTURE.input.runId, scope: 'spectral-to-color only; no atmosphere, cache, geometry, or obstruction execution' }, provenance: { experiment: 'scripts/extraterrestrial', laneA: 'scripts/extraterrestrial/color/NormalColorTransform.js', laneB: 'unchanged contained candidate BrunetonColorDisplayModel' }, environment: { node: process.version, platform: process.platform }, references: { canonicalPlan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md', normalPlan: 'agents/topics/extraterrestrial/normal-mode-test-plan.md' } });
	try {
		await assertRepositoryIdentity(); const policy = await loadContainmentPolicy(); const before = await createProtectedTrackedInventory(policy); await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{ ledger, manifest: inputManifest }, cieText, brunetonSourceBefore] = await Promise.all([loadInputLedger(), readFile(CIE_PATH, 'utf8'), readFile(BRUNETON_PATH)]); const transform = new NormalColorTransform({ cieRows: parseCie1931(cieText), spectralBasis: ledger.spectralBasis, ...FIXTURE.laneA }); const bruneton = new BrunetonColorDisplayModel();
		const rows = selectedSamples(ledger).map((sample) => { const packet = asPacket(sample); return { ...sample, laneA: transform.transformSpectrum(sample.values), laneB: { linearSrgb: bruneton.radianceToLinearSrgb(packet), displayRgb: bruneton.radianceToDisplayRgb(packet) } }; }); const brunetonSourceAfter = await readFile(BRUNETON_PATH); const proofAnalysis = analyze(rows, transform, sha256(brunetonSourceBefore), sha256(brunetonSourceAfter));
		const result = { schemaId: 'spectral-color-stage2-isolated-disk-result-v1', input: { runId: inputManifest.runId, artifactSetSha256: inputManifest.artifactSetSha256, ledgerSha256: FIXTURE.input.ledgerSha256 }, laneA: transform.describe(), laneB: bruneton.describeDisplayConversion(), rows };
		await run.writeJsonArtifact('evidence/stage2-isolated-disk.json', result); await run.writeArtifact('evidence/stage2-isolated-disk.csv', csv(rows)); await run.writeArtifact('renders/lane-a-all.svg', renderSvg(rows, 'laneA', 'Stage 2 lane A — isolated transported disks')); await run.writeArtifact('renders/lane-b-all.svg', renderSvg(rows, 'laneB', 'Stage 2 lane B — frozen Bruneton comparison'));
		for (const family of ['spherical-distant','flat-local']) { const selected = rows.filter((row) => row.family === family); await run.writeArtifact(`renders/lane-a-${family}.svg`, renderSvg(selected, 'laneA', `Stage 2 lane A — ${family}`)); await run.writeArtifact(`renders/lane-b-${family}.svg`, renderSvg(selected, 'laneB', `Stage 2 lane B — ${family}`)); }
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-stage2-isolated-disk.js', 'color/NormalColorTransform.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process','node:crypto','node:fs','node:fs/promises','node:module','node:os','node:path','node:url','node:util'] }); const after = await createProtectedTrackedInventory(policy); assertFileInventoriesEqual(before, after, 'Stage 2 protected inventory');
		const proof = { proofId: 'spectral-color-stage2-isolated-disk-v1', accepted: true, assertions: proofAnalysis.assertions, summary: proofAnalysis.summary, outputs: { numeric: 'evidence/stage2-isolated-disk.json', csv: 'evidence/stage2-isolated-disk.csv', laneARender: 'renders/lane-a-all.svg', laneBRender: 'renders/lane-b-all.svg' }, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } }; await run.writeJsonArtifact('evidence/stage2-proof.json', proof);
		const summary = proof.summary; const artifactManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stage 2 isolated disk Color laboratory\n\nConclusion: **accepted for the fixed diagnostic lane**.\n\nAll ${summary.sampleCount} eligible transported disk spectra were read from manifest-verified Stage 1 data without atmosphere, cache, geometry, or obstruction execution. Lane A preserved projected chromaticity through its continuous luminance map, applied one joint same-luminance gamut operation, remained bounded, and produced no exact-white disks. Frozen lane B produced ${summary.laneBExactWhiteCount} exact-white disks.\n\nLane A mapped the measured ${summary.inputLuminanceRangeCdPerSquareMeter[0]}–${summary.inputLuminanceRangeCdPerSquareMeter[1]} cd/m² range to ${summary.laneAMappedLuminanceRangeNits[0]}–${summary.laneAMappedLuminanceRangeNits[1]} unbounded display nits before gamut/display encoding. This accepts the diagnostic laboratory and its traceability gates; it does not yet claim that the selected fixed mapping is the final population-average Normal appearance.\n` }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: artifactManifest.artifactSetSha256, summary }, null, 2)}\n`);
	} catch (error) { const detail = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 2 isolated disk Color laboratory\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {} process.exitCode = 1; }
}

await main();
