#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

import {sha256File} from '../harness/lib/atomic-files.js';
import {assertNoReparseEntries} from '../harness/lib/containment.js';
import {assertFileInventoriesEqual, createFileInventory} from '../harness/lib/hashes.js';
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
import {
	BRUNETON_GLOBAL_EXPOSURE_CURVE_ID,
	BrunetonGlobalExposureCurve,
} from '../stellar-screen-palette/BrunetonGlobalExposureCurve.js';
import {
	NATIVE15_BRUNETON_EXPOSURE_CONTRACT,
	Native15BrunetonExposureEvaluator,
} from '../stellar-screen-palette/Native15BrunetonExposureEvaluator.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-bruneton-global-exposure-tuning.js';
const PALETTE_RUN = {id: '000411-stellar-screen-palette-indexed-gpu-resource-proof', hash: 'ebca4daac3175e4486db60c51b6cef0cd64207c934cff7aeff13efe6b7a3cfe0'};
const SPHERICAL_RUN = {id: '000424-stellar-ferwerda-sunset-facing-solar-noon-sunset-plus-three-hours', hash: 'bb25bb1e23d4953ebcc20e8d1d9078bf24680dfcd75939bb732645a8358d324b'};
const FLAT_RUN = {id: '000440-production-step7c-live-environment-review', hash: '7a71eb81bf6cf9971c2fef88b784a0eeb4c2c92a494c5fdd6e562839edda429c'};
const VISUAL_ORACLE_RUN = {id: '000435-sun-layer-screen-palette-three-scenes', hash: '15a983c091886402d6a5a3cd0110f9c02b6682697513ec90c267ac59d6c026b0'};
const BRIGHT_THRESHOLD = 5;
const DARK_THRESHOLD = 0.001;
const PEAK_BYTE_CEILING = 235;
const CANDIDATE_EXPOSURES = [1, 2, 4, 8, 10.50268593548108, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 24576, 32768, 49152, 65536];

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function crc32(bytes) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function pngChunk(type, data = Buffer.alloc(0)) { const name = Buffer.from(type); const length = Buffer.alloc(4); const checksum = Buffer.alloc(4); length.writeUInt32BE(data.length); checksum.writeUInt32BE(crc32(Buffer.concat([name, data]))); return Buffer.concat([length, name, data, checksum]); }
function encodePng(width, height, rgbaTopDown) { const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6; const stride = width * 4; const rows = Buffer.alloc((stride + 1) * height); for (let y = 0; y < height; y += 1) { rows[y * (stride + 1)] = 0; rgbaTopDown.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride); } return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(rows, {level: 9})), pngChunk('IEND')]); }
function averageRanks(values) { const sorted = values.map((value, index) => ({value, index})).sort((a, b) => a.value - b.value); const ranks = new Array(values.length); for (let start = 0; start < sorted.length;) { let end = start + 1; while (end < sorted.length && sorted[end].value === sorted[start].value) end += 1; const rank = (start + end - 1) / 2; for (let index = start; index < end; index += 1) ranks[sorted[index].index] = rank; start = end; } return ranks; }
function correlation(left, right) { const a = averageRanks(left); const b = averageRanks(right); const meanA = a.reduce((sum, value) => sum + value, 0) / a.length; const meanB = b.reduce((sum, value) => sum + value, 0) / b.length; let numerator = 0; let squareA = 0; let squareB = 0; for (let index = 0; index < a.length; index += 1) { const da = a[index] - meanA; const db = b[index] - meanB; numerator += da * db; squareA += da * da; squareB += db * db; } const denominator = Math.sqrt(squareA * squareB); return denominator === 0 ? 0 : numerator / denominator; }
async function readVerifiedRun(runIdentity) { const root = path.join(RUNS_ROOT, runIdentity.id); const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8')); requireCondition(manifest.artifactSetSha256 === runIdentity.hash, `${runIdentity.id} artifact set changed.`); return {root, manifest}; }
async function productionInventory() { return {algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')), flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32'))}; }

function summarize(entries, exposure) {
	const evaluator = new Native15BrunetonExposureEvaluator();
	const evaluated = entries.map((spectrum) => evaluator.evaluate(spectrum, exposure));
	const visible = evaluated.filter(({byteRgb}) => Math.max(...byteRgb) > 0);
	const pureWhite = evaluated.filter(({byteRgb}) => byteRgb.every((value) => value === 255));
	const clipped = evaluated.filter(({byteRgb}) => byteRgb.some((value) => value === 255));
	const distinct = new Set(visible.map(({byteRgb}) => byteRgb.join(',')));
	return {
		exposure,
		visibleCount: visible.length,
		pureWhiteCount: pureWhite.length,
		clippedChannelPixelCount: clipped.length,
		maximumByte: Math.max(...evaluated.flatMap(({byteRgb}) => byteRgb)),
		distinctVisibleRgbCount: distinct.size,
		rankCorrelation: correlation(evaluated.map(({linearLuminance}) => linearLuminance), evaluated.map(({byteLuminance}) => byteLuminance)),
		entries: evaluated,
	};
}

function renderMatrix(matrix, summaries, width, height) {
	const rgba = Buffer.alloc(width * height * 4);
	for (let pixel = 0; pixel < matrix.length; pixel += 1) {
		const entry = matrix[pixel];
		const rgb = entry === 0 ? [0, 0, 0] : summaries.entries[entry - 1].byteRgb;
		rgba[pixel * 4] = rgb[0]; rgba[pixel * 4 + 1] = rgb[1]; rgba[pixel * 4 + 2] = rgb[2]; rgba[pixel * 4 + 3] = 255;
	}
	return encodePng(width, height, rgba);
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'bruneton-global-exposure-curve-tuning', command: COMMAND,
		inputs: {schemaId: 'bruneton-global-exposure-tuning-input-v1', parentRuns: [PALETTE_RUN, SPHERICAL_RUN, FLAT_RUN, VISUAL_ORACLE_RUN], curve: {id: BRUNETON_GLOBAL_EXPOSURE_CURVE_ID, brightThreshold: BRIGHT_THRESHOLD, darkThreshold: DARK_THRESHOLD}, candidateExposures: CANDIDATE_EXPOSURES, visualOracle: {representedStars: 32, peakByte: PEAK_BYTE_CEILING}, peakByteCeiling: PEAK_BYTE_CEILING},
		provenance: {purpose: 'Select the smallest bounded global Bruneton exposure endpoint that reveals the accepted stellar palette without white collapse while leaving qualified bright scenes at exact exposure one.', operation: 'immutable native-15 palette -> Bruneton E8 projection -> candidate global exposure inside Figure-1 exponential -> RGBA8 metrics and render; recorded received-light controls -> analytic curve plateau checks', claimLimit: 'Contained tuning diagnostic; star-only unit-transmittance upper bound and recorded bright controls; no production implementation or full integrated visual acceptance.'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch},
		references: {activeTopic: 'agents/topics/active-topic.md', design: 'agents/topics/extraterrestrial/stellar-screen-palette-design.md', runProtocol: 'agents/topics/extraterrestrial/stage-12-implementation-topic.md#immutable-run-records'},
	});
	try {
		await assertRepositoryIdentity();
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const before = await productionInventory();
		const paletteParent = await readVerifiedRun(PALETTE_RUN);
		const sphericalParent = await readVerifiedRun(SPHERICAL_RUN);
		const flatParent = await readVerifiedRun(FLAT_RUN);
		await readVerifiedRun(VISUAL_ORACLE_RUN);
		const config = JSON.parse(await readFile(path.join(paletteParent.root, 'browser', 'config.json'), 'utf8'));
		const paletteBytes = await readFile(path.join(paletteParent.root, 'browser', 'fixed-palette.f32'));
		const matrixBytes = await readFile(path.join(paletteParent.root, 'browser', 'fixed-matrix.u16'));
		const palette = new Float32Array(paletteBytes.buffer, paletteBytes.byteOffset, paletteBytes.byteLength / 4);
		const matrix = new Uint16Array(matrixBytes.buffer, matrixBytes.byteOffset, matrixBytes.byteLength / 2);
		const entryCount = config.products.fixed.paletteEntryCount;
		requireCondition(palette.length === entryCount * 15 && entryCount > 1, 'The parent palette shape is invalid.');
		const entries = Array.from({length: entryCount - 1}, (_, entry) => Array.from(palette.slice((entry + 1) * 15, (entry + 2) * 15)));
		const spherical = JSON.parse(await readFile(path.join(sphericalParent.root, 'evidence', 'diffuse-data-adapted-full-scene-review.json'), 'utf8'));
		const flat = JSON.parse(await readFile(path.join(flatParent.root, 'result.json'), 'utf8'));
		const preservationControls = [
			{id: 'san-jose-solar-noon', luminance: spherical.conditions['solar-noon'].directAdaptingLuminanceProxy.value},
			{id: 'san-jose-sunrise-sunset-boundary', luminance: spherical.conditions.sunset.directAdaptingLuminanceProxy.value},
			{id: 'union-glacier-flat-local-flat-180', luminance: flat.evidence.ferwerda['union-glacier-flat-local-flat-180'].brightnessProxyCdPerSquareMeter},
		];
		const candidates = CANDIDATE_EXPOSURES.map((exposure) => summarize(entries, exposure));
		const eligible = candidates.filter((candidate) => candidate.maximumByte <= PEAK_BYTE_CEILING && candidate.pureWhiteCount === 0 && candidate.clippedChannelPixelCount === 0 && candidate.rankCorrelation >= 0.99);
		eligible.sort((left, right) => right.visibleCount - left.visibleCount || right.distinctVisibleRgbCount - left.distinctVisibleRgbCount || right.exposure - left.exposure);
		const selected = eligible[0] ?? null;
		requireCondition(selected !== null, 'No candidate preserves stellar highlight headroom and rank.');
		const curve = new BrunetonGlobalExposureCurve({brightThreshold: BRIGHT_THRESHOLD, darkThreshold: DARK_THRESHOLD, maximumExposure: selected.exposure});
		const preservation = preservationControls.map((control) => ({...control, exposure: curve.derive(control.luminance)}));
		const curveSamples = [0, 0.0001, 0.001, 0.003, 0.01, 0.03, 0.1, 0.3, 1, 2, 3, 4, 5, 10, 38.03611664763064, 963.9629451914163, 33496.75245260507].map((luminance) => ({luminance, exposure: curve.derive(luminance)}));
		const baseline = candidates.find((candidate) => candidate.exposure === 1);
		await run.writeArtifact('renders/stars-baseline.png', renderMatrix(matrix, baseline, config.products.fixed.viewport.width, config.products.fixed.viewport.height));
		await run.writeArtifact('renders/stars-selected-dark-exposure.png', renderMatrix(matrix, selected, config.products.fixed.viewport.width, config.products.fixed.viewport.height));
		await run.writeJsonArtifact('evidence/tuning.json', {schemaId: 'bruneton-global-exposure-tuning-evidence-v1', curve: {...curve.configuration, id: BRUNETON_GLOBAL_EXPOSURE_CURVE_ID}, evaluator: NATIVE15_BRUNETON_EXPOSURE_CONTRACT, preservationControls: preservation, curveSamples, candidates: candidates.map(({entries: ignored, ...candidate}) => candidate), selected: (({entries: ignored, ...candidate}) => candidate)(selected), parentIdentities: {palette: PALETTE_RUN, spherical: SPHERICAL_RUN, flat: FLAT_RUN, visualOracle: VISUAL_ORACLE_RUN}});
		await run.writeArtifact('evidence/candidates.csv', `exposure,visibleCount,pureWhiteCount,clippedChannelPixelCount,maximumByte,distinctVisibleRgbCount,rankCorrelation\n${candidates.map((candidate) => [candidate.exposure, candidate.visibleCount, candidate.pureWhiteCount, candidate.clippedChannelPixelCount, candidate.maximumByte, candidate.distinctVisibleRgbCount, candidate.rankCorrelation].join(',')).join('\n')}\n`);
		await run.writeJsonArtifact('evidence/derivation.json', {schemaId: 'bruneton-global-exposure-tuning-derivation-v1', parents: [{runId: PALETTE_RUN.id, artifact: 'browser/fixed-palette.f32', sha256: await sha256File(path.join(paletteParent.root, 'browser', 'fixed-palette.f32'))}, {runId: PALETTE_RUN.id, artifact: 'browser/fixed-matrix.u16', sha256: await sha256File(path.join(paletteParent.root, 'browser', 'fixed-matrix.u16'))}, {runId: SPHERICAL_RUN.id, artifact: 'evidence/diffuse-data-adapted-full-scene-review.json', sha256: await sha256File(path.join(sphericalParent.root, 'evidence', 'diffuse-data-adapted-full-scene-review.json'))}, {runId: FLAT_RUN.id, artifact: 'result.json', sha256: await sha256File(path.join(flatParent.root, 'result.json'))}, {runId: VISUAL_ORACLE_RUN.id, artifact: 'artifact-manifest.json', artifactSetSha256: VISUAL_ORACLE_RUN.hash, borrowedMetrics: {representedStars: 32, peakByte: PEAK_BYTE_CEILING}}], operation: 'parent native-15 spectra and matrix -> exact contained Bruneton global-exposure evaluator -> candidate metrics and selected PNG; parent receiver-local luminance controls -> smooth log curve -> exact-unity plateau checks; accepted visual-oracle population and peak -> bounded selection gates', implementation: {curve: 'scripts/extraterrestrial/stellar-screen-palette/BrunetonGlobalExposureCurve.js', evaluator: 'scripts/extraterrestrial/stellar-screen-palette/Native15BrunetonExposureEvaluator.js', runner: 'scripts/extraterrestrial/runners/run-bruneton-global-exposure-tuning.js'}, resultIdentityOwner: 'artifact-manifest.json'});
		const assertions = [
			[selected.visibleCount >= 32, 'The selected dark exposure represents at least the accepted 32-star reference population.'],
			[selected.maximumByte <= PEAK_BYTE_CEILING, `The selected stellar peak remains at or below byte ${PEAK_BYTE_CEILING}.`],
			[selected.pureWhiteCount === 0 && selected.clippedChannelPixelCount === 0, 'No selected stellar pixel is pure white or clips any channel.'],
			[selected.rankCorrelation >= 0.99, 'The selected eight-bit stellar brightness rank correlation is at least 0.99.'],
			[preservation.every((control) => control.exposure === 1), 'San Jose noon, sunrise/sunset boundary, and Union Glacier Flat 180 retain exact Bruneton exposure one.'],
			[curve.derive(0) === selected.exposure && curve.derive(BRIGHT_THRESHOLD) === 1, 'The smooth curve has exact finite dark and Bruneton endpoints.'],
		];
		for (const [passed, message] of assertions) requireCondition(passed, message);
		const closure = await buildStaticModuleClosure({candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-bruneton-global-exposure-tuning.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib']});
		const after = await productionInventory();
		assertFileInventoriesEqual(before.algorithm32, after.algorithm32, 'Algorithm32 production inventory');
		assertFileInventoriesEqual(before.flat32, after.flat32, 'Flat32 production inventory');
		const proof = {proofId: 'bruneton-global-exposure-curve-tuning-v1', accepted: true, selectedExposure: selected.exposure, selectedMetrics: (({entries: ignored, ...candidate}) => candidate)(selected), curve: {...curve.configuration, id: BRUNETON_GLOBAL_EXPOSURE_CURVE_ID}, preservationControls: preservation, assertions: assertions.map(([, message]) => message), claimLimit: 'Contained star-only unit-transmittance tuning plus recorded bright-scene plateau controls; integrated atmosphere/scene visual review remains required.', containment: {algorithm32Files: after.algorithm32.fileCount, flat32Files: after.flat32.fileCount, closureFiles: closure.files.length, closureEdges: closure.edges.length}};
		const manifest = await run.finalize({conclusion: 'accepted', result: proof, report: `# ${run.runId}: Bruneton global-exposure curve tuning\n\nConclusion: **accepted as contained tuning evidence**.\n\nSelected maximum exposure: ${selected.exposure}. It represents ${selected.visibleCount}/${entries.length} stellar entries, peaks at byte ${selected.maximumByte}, produces no white or clipped stellar pixel, and retains brightness-rank correlation ${selected.rankCorrelation}. All three bright-scene controls remain at exact exposure one. Integrated atmospheric and scene visual qualification remains open.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256, selectedExposure: selected.exposure, selectedMetrics: proof.selectedMetrics}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined};
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({conclusion: 'rejected', result: {proofId: 'bruneton-global-exposure-curve-tuning-v1', accepted: false, error: detail}, report: `# ${run.runId}: Bruneton global-exposure curve tuning\n\nConclusion: **rejected**.\n\n${detail.message}\n`}); process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'rejected', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`); } catch (finalizationError) { process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`); }
		process.exitCode = 1;
	}
}

await main();
