import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import OUTPUT_FIXTURE from '../fixtures/spectral-color-stage2b-output-proof-v1.json' with { type: 'json' };
import FIXTURE from '../fixtures/spectral-color-stage3-calibration-context-v1.json' with { type: 'json' };
import { CAM16_DIM_SURROUND, forwardCam16 } from '../color/Cam16Reference.js';
import { deriveStage2bInputBridge, projectNativeSpectrum } from '../color/Stage2bInputBridge.js';
import { Stage2bPreserveColorfulnessTransform } from '../color/Stage2bColorfulnessCandidates.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-spectral-color-stage3-calibration-context.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));

async function assertFrozenFixtures() {
	for (const record of [FIXTURE.bridgeFixture, FIXTURE.outputFixture, FIXTURE.candidateFixture]) {
		const bytes = await readFile(path.join(EXPERIMENT_ROOT, ...record.path.split('/').slice(2)));
		requireCondition(sha256(bytes) === record.sha256, `Frozen fixture changed: ${record.path}.`);
	}
}

async function loadLedger() {
	const root = path.join(RUNS_ROOT, BRIDGE_FIXTURE.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Stage 3 context input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === BRIDGE_FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === BRIDGE_FIXTURE.input.artifactSetSha256, 'Stage 3 context input identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === BRIDGE_FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, BRIDGE_FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === BRIDGE_FIXTURE.input.ledgerSha256 && bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Stage 3 context ledger identity changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function sourceAppearance(absoluteXyz, adaptingLuminanceCdPerSquareMeter) {
	const source = BRIDGE_FIXTURE.sourceViewingCondition;
	const referenceWhite = source.referenceWhiteToAdaptingLuminanceRatio * adaptingLuminanceCdPerSquareMeter;
	return forwardCam16({
		xyz: absoluteXyz.map((value) => 100 * value / referenceWhite),
		whiteXyz: source.whiteChromaticityXyzRelative,
		adaptingLuminanceCdPerSquareMeter,
		backgroundRelativeY: source.backgroundRelativeY,
		surround: CAM16_DIM_SURROUND,
		discountIlluminant: source.discountIlluminant,
	});
}

function transformSpectrum(values, context, ledger, cieRows, transform) {
	requireCondition(Array.isArray(values) && values.length === ledger.spectralBasis.channels.length, 'Context spectrum must retain the native basis.');
	const xyz = projectNativeSpectrum(values, ledger.spectralBasis, cieRows);
	const cam16 = sourceAppearance(xyz, context.adaptingLuminanceCdPerSquareMeter);
	return { spectrum: [...values], xyz, cam16, display: transform.transformAppearance(cam16) };
}

function maximumCompositionResidual(sample) {
	let maximum = 0;
	for (let index = 0; index < sample.preDisplayRadiance.length; index += 1) {
		const expected = sample.pathRadiance[index] + sample.celestialRadiance[index];
		maximum = Math.max(maximum, Math.abs(sample.preDisplayRadiance[index] - expected) / Math.max(1, Math.abs(expected), Math.abs(sample.preDisplayRadiance[index])));
	}
	return maximum;
}

function buildRows(ledger, bridge, cieRows, transform) {
	const inventory = new Map(bridge.rows.map((row) => [row.key, row]));
	const conditions = new Map();
	for (const family of [ledger.spherical, ledger.flat]) for (const condition of family.conditions) conditions.set(`${family.family}/${condition.id}`, { family: family.family, condition });
	const calibrationKeys = [...BRIDGE_FIXTURE.calibrationRows];
	const calibrationSet = new Set(calibrationKeys);
	const heldOutKeys = [...inventory.keys()].filter((key) => !calibrationSet.has(key)).sort();
	requireCondition(inventory.size === FIXTURE.expectedInventoryCount && calibrationSet.size === FIXTURE.expectedCalibrationCount && heldOutKeys.length === FIXTURE.expectedHeldOutCount, 'The frozen 9/16 split must cover the 25-row inventory.');
	const rows = calibrationKeys.map((key) => {
		const context = inventory.get(key);
		const source = conditions.get(key);
		requireCondition(context && source, `Missing calibration context: ${key}.`);
		const center = source.condition.samples.find((sample) => sample.role === 'disk-center');
		requireCondition(center?.colorInputEligibility === BRIDGE_FIXTURE.input.eligibility, `Missing eligible disk center: ${key}.`);
		const circumsolarSamples = source.condition.samples.filter((sample) => sample.role === 'circumsolar-sky');
		requireCondition(circumsolarSamples.length === FIXTURE.circumsolar.offsetDegrees.length * FIXTURE.circumsolar.directions.length, `Incomplete circumsolar matrix: ${key}.`);
		const circumsolar = circumsolarSamples.map((sample) => {
			const match = /^circumsolar-(0\.5|1|2)-(zenithward|equalElevationPositive|horizonward|equalElevationNegative)$/u.exec(sample.id);
			requireCondition(match, `Unexpected circumsolar sample id: ${sample.id}.`);
			const eligible = sample.colorInputEligibility === BRIDGE_FIXTURE.input.eligibility;
			return { id: sample.id, offsetDegrees: Number(match[1]), direction: match[2], eligibility: sample.colorInputEligibility, blocked: !eligible, ...(eligible ? { path: transformSpectrum(sample.pathRadiance, context, ledger, cieRows, transform) } : {}) };
		});
		return {
			key,
			family: source.family,
			conditionId: source.condition.id,
			series: source.condition.series,
			adaptingLuminanceCdPerSquareMeter: context.adaptingLuminanceCdPerSquareMeter,
			directDisk: { spectrum: context.spectralRadiance, xyz: context.radianceXyz, cam16: context.cam16, display: transform.transformAppearance(context.cam16) },
			center: {
				compositionMaximumRelativeResidual: maximumCompositionResidual(center),
				path: transformSpectrum(center.pathRadiance, context, ledger, cieRows, transform),
				composed: transformSpectrum(center.preDisplayRadiance, context, ledger, cieRows, transform),
			},
			circumsolar,
		};
	});
	return { rows, heldOutKeys };
}

function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function cssRgb(rgb) { return `rgb(${rgb.map((value) => `${(100 * value).toFixed(8)}%`).join(', ')})`; }
function point(cx, cy, radius, degrees) { const radians = degrees * Math.PI / 180; return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)]; }
function annularSector(cx, cy, innerRadius, outerRadius, startDegrees, endDegrees) {
	const outerStart = point(cx, cy, outerRadius, startDegrees);
	const outerEnd = point(cx, cy, outerRadius, endDegrees);
	const innerEnd = point(cx, cy, innerRadius, endDegrees);
	const innerStart = point(cx, cy, innerRadius, startDegrees);
	return `M ${outerStart[0]} ${outerStart[1]} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd[0]} ${outerEnd[1]} L ${innerEnd[0]} ${innerEnd[1]} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart[0]} ${innerStart[1]} Z`;
}
function familyLabel(family) { return family === 'spherical-distant' ? 'SAN JOSE / SPHERICAL / DISTANT' : 'FLAT / LOCAL'; }
function displayLabel(conditionId) { return ({ 'noon-minus-60': 'Noon -60 min', noon: 'Solar noon', 'noon-plus-60': 'Noon +60 min', 'sunset-minus-60': 'Sunset -60 min', 'sunset-minus-30': 'Sunset -30 min', sunset: 'Sunset', closest: 'Closest', 'farthest-minus-30': 'Farthest -30 min', 'farthest-plus-10': 'Farthest +10 min' })[conditionId] ?? conditionId; }

function renderSvg(rows) {
	const config = FIXTURE.render;
	const rowCount = Math.ceil(rows.length / config.columns);
	const height = config.headerHeightPixels + rowCount * config.cellHeightPixels + config.footerHeightPixels;
	const angles = { zenithward: [-135, -45], equalElevationPositive: [-45, 45], horizonward: [45, 135], equalElevationNegative: [135, 225] };
	const cells = rows.map((row, index) => {
		const column = index % config.columns;
		const line = Math.floor(index / config.columns);
		const originX = column * config.cellWidthPixels;
		const originY = config.headerHeightPixels + line * config.cellHeightPixels;
		const cx = originX + config.cellWidthPixels / 2;
		const cy = originY + 145;
		const sectors = FIXTURE.circumsolar.offsetDegrees.flatMap((offset, ringIndex) => FIXTURE.circumsolar.directions.map((direction) => {
			const sample = row.circumsolar.find((candidate) => candidate.offsetDegrees === offset && candidate.direction === direction);
			const [start, end] = angles[direction];
			const fill = sample.blocked ? 'url(#blockedHatch)' : cssRgb(sample.path.display.output.encodedSrgb);
			return `<path d="${annularSector(cx, cy, config.ringBoundariesPixels[ringIndex], config.ringBoundariesPixels[ringIndex + 1], start, end)}" fill="${fill}" stroke="#1d232c" stroke-width="1" data-sample-id="${sample.id}"/>`;
		})).join('');
		return `<g data-calibration-key="${escapeXml(row.key)}"><rect x="${originX + 4}" y="${originY + 4}" width="${config.cellWidthPixels - 8}" height="${config.cellHeightPixels - 8}" rx="12" fill="${config.cellBackground}" stroke="${config.cellBorder}"/><text x="${cx}" y="${originY + 28}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13" font-weight="600" letter-spacing="1">${familyLabel(row.family)}</text>${sectors}<circle cx="${cx}" cy="${cy}" r="${config.diskRadiusPixels}" fill="${cssRgb(row.center.composed.display.output.encodedSrgb)}" stroke="${cssRgb(row.directDisk.display.output.encodedSrgb)}" stroke-width="3"/><text x="${cx}" y="${originY + 283}" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="19" font-weight="600">${escapeXml(displayLabel(row.conditionId))}</text></g>`;
	}).join('');
	const footerY = config.headerHeightPixels + rowCount * config.cellHeightPixels + 33;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.widthPixels}" height="${height}" viewBox="0 0 ${config.widthPixels} ${height}"><defs><pattern id="blockedHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#090b0f"/><rect width="2" height="8" fill="#4b515b"/></pattern></defs><rect width="100%" height="100%" fill="${config.background}"/><text x="${config.widthPixels / 2}" y="43" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="28" font-weight="650">Stage 3 candidate — recorded circumsolar context</text><text x="${config.widthPixels / 2}" y="76" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="15">Center fill: recorded path + direct · rim: direct only · rings: atmosphere-only samples at 0.5°, 1°, and 2°</text>${cells}<text x="${config.widthPixels / 2}" y="${footerY}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13">Z = zenithward · H = horizonward · hatched = ground-blocked · piecewise-constant sample sectors, no interpolation</text></svg>`;
}

function csv(rows) {
	const header = ['key', 'sample', 'offset_degrees', 'direction', 'eligibility', 'R', 'G', 'B'];
	const lines = [header.join(',')];
	for (const row of rows) {
		lines.push([row.key, 'direct-disk', '', '', 'eligible', ...row.directDisk.display.output.encodedSrgb].join(','));
		lines.push([row.key, 'center-path', 0, 'center', 'eligible', ...row.center.path.display.output.encodedSrgb].join(','));
		lines.push([row.key, 'center-composed', 0, 'center', 'eligible', ...row.center.composed.display.output.encodedSrgb].join(','));
		for (const sample of row.circumsolar) lines.push([row.key, sample.id, sample.offsetDegrees, sample.direction, sample.eligibility, ...(sample.blocked ? ['', '', ''] : sample.path.display.output.encodedSrgb)].join(','));
	}
	return `${lines.join('\n')}\n`;
}

function analyze(rows, heldOutKeys, svg) {
	const assertions = [];
	const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
	const displays = rows.flatMap((row) => [row.directDisk.display, row.center.path.display, row.center.composed.display, ...row.circumsolar.filter((sample) => !sample.blocked).map((sample) => sample.path.display)]);
	const maxCompositionResidual = Math.max(...rows.map((row) => row.center.compositionMaximumRelativeResidual));
	check(rows.length === FIXTURE.expectedCalibrationCount && heldOutKeys.length === FIXTURE.expectedHeldOutCount, 'Exactly nine calibration rows are contextualized and sixteen remain held out.');
	check(maxCompositionResidual <= FIXTURE.tolerances.compositionRelative, 'Every center spectrum retains recorded path-plus-direct composition identity.');
	check(displays.every((display) => display.output.encodedSrgb.every((value) => Number.isFinite(value) && value >= -FIXTURE.tolerances.rgbBoundsAbsolute && value <= 1 + FIXTURE.tolerances.rgbBoundsAbsolute)), 'Every eligible disk, composed center, and circumsolar output is finite and display-bounded.');
	check(rows.every((row) => row.circumsolar.length === 12), 'Every condition retains the complete twelve-ray circumsolar inventory.');
	const exactWhiteCount = displays.filter((display) => display.output.encodedSrgb.every((value) => value === 1)).length;
	check(exactWhiteCount === 0, 'No contextualized sample maps to exact white.');
	const keys = [...svg.matchAll(/data-calibration-key="([^"]+)"/gu)].map((match) => match[1]);
	check(keys.length === rows.length && keys.every((key, index) => key === rows[index].key), 'The context plate contains exactly the ordered calibration identities.');
	check(keys.every((key) => !heldOutKeys.includes(key)), 'No held-out identity or output appears in the context plate.');
	const diskSkyDistances = rows.map((row) => {
		const nearest = row.circumsolar.filter((sample) => sample.offsetDegrees === 0.5 && !sample.blocked);
		const mean = [0, 1, 2].map((channel) => nearest.reduce((sum, sample) => sum + sample.path.display.output.encodedSrgb[channel], 0) / nearest.length);
		return { key: row.key, encodedDistance: distance(row.center.composed.display.output.encodedSrgb, mean), validNearestSampleCount: nearest.length };
	});
	return { assertions, summary: { calibrationCount: rows.length, heldOutCount: heldOutKeys.length, heldOutIdentitySha256: sha256(`${heldOutKeys.join('\n')}\n`), transformedSampleCount: displays.length, blockedSampleCount: rows.flatMap((row) => row.circumsolar).filter((sample) => sample.blocked).length, maximumCompositionRelativeResidual: maxCompositionResidual, exactWhiteCount, diskToNearestSkyEncodedDistances: diskSkyDistances } };
}

async function main() {
	const run = await initializeRunRecord({ slug: 'spectral-color-stage3-calibration-context', command: COMMAND, inputs: { fixture: 'experiments/extraterrestrial/fixtures/spectral-color-stage3-calibration-context-v1.json', measuredInputRunId: BRIDGE_FIXTURE.input.runId, scope: 'nine-row recorded circumsolar Color context; no atmosphere/cache/interpolation/held-out output' }, provenance: { candidate: 'Stage 2B preserve-M fixed-Q boundary', composition: 'recorded center path + celestial; atmosphere-only circumsolar rays', presentation: 'piecewise-constant direct sample sectors' }, environment: { node: process.version, platform: process.platform }, references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md', normalPlan: 'agents/topics/extraterrestrial/normal-mode-test-plan.md' } });
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		await assertFrozenFixtures();
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const cieRows = parseCie1931(cieText);
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE_FIXTURE, cieRows });
		const transform = new Stage2bPreserveColorfulnessTransform({ q0: bridge.q0, qMaster: bridge.qMaster, outputViewingCondition: BRIDGE_FIXTURE.outputViewingCondition, bisectionIterations: OUTPUT_FIXTURE.bisectionIterations });
		const { rows, heldOutKeys } = buildRows(ledger, bridge, cieRows, transform);
		const svg = renderSvg(rows);
		const proofAnalysis = analyze(rows, heldOutKeys, svg);
		const result = { schemaId: 'spectral-color-stage3-calibration-context-result-v1', input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: BRIDGE_FIXTURE.input.ledgerSha256 }, claimLimit: 'recorded sparse circumsolar context for calibration review; direct samples are not a reconstructed continuous sky field', transform: transform.describe(), rows };
		await run.writeJsonArtifact('evidence/stage3-calibration-context.json', result);
		await run.writeArtifact('evidence/stage3-calibration-context.csv', csv(rows));
		await run.writeArtifact('renders/stage3-calibration-context.svg', svg);
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-stage3-calibration-context.js', 'color/Cam16Reference.js', 'color/Stage2bInputBridge.js', 'color/Stage2bNormalDisplayTransform.js', 'color/Stage2bColorfulnessCandidates.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Stage 3 context protected inventory');
		const proof = { proofId: 'spectral-color-stage3-calibration-context-v1', accepted: true, state: 'generated-for-observer-proxy-context-review', assertions: proofAnalysis.assertions, summary: proofAnalysis.summary, outputs: { plate: 'renders/stage3-calibration-context.svg', numeric: 'evidence/stage3-calibration-context.json', csv: 'evidence/stage3-calibration-context.csv' }, remaining: ['observer-proxy contextual review', 'candidate decision', 'denser spatial field only after sparse-context acceptance'], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/stage3-calibration-context-proof.json', proof);
		const finalManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stage 3 calibration circumsolar context\n\nConclusion: **accepted as recorded-sample context evidence; observer-proxy decision pending**.\n\nThe preserve-M candidate was applied with one unchanged condition state to each direct disk, recorded path-plus-direct center, atmosphere-only center, and eligible circumsolar spectrum for exactly nine calibration conditions. The plate displays the twelve recorded 0.5-, 1-, and 2-degree rays as piecewise-constant sectors and marks ground-blocked sectors; it performs no interpolation or atmosphere/cache execution. All outputs are finite and bounded, no sample is exact white, and the held-out rows remain uncomputed and unpresented.\n\nThis sparse context is a review aid, not a continuous sky reconstruction.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, state: proof.state, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 3 calibration circumsolar context\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
