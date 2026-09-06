import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import OUTPUT_FIXTURE from '../fixtures/spectral-color-stage2b-output-proof-v1.json' with { type: 'json' };
import FIXTURE from '../fixtures/spectral-color-stage2b-colorfulness-candidates-v1.json' with { type: 'json' };
import { deriveStage2bInputBridge } from '../color/Stage2bInputBridge.js';
import { Stage2bNormalDisplayTransform } from '../color/Stage2bNormalDisplayTransform.js';
import { Stage2bPreserveColorfulnessTransform, chromaticityPreservingControl } from '../color/Stage2bColorfulnessCandidates.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-spectral-color-stage2b-colorfulness-candidates.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const BRIDGE_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'spectral-color-stage2b-reference-bridge-v1.json');
const OUTPUT_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'spectral-color-stage2b-output-proof-v1.json');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const distance = (left, right) => Math.hypot(...left.map((value, index) => value - right[index]));
const hueDifference = (left, right) => { const delta = Math.abs(left - right) % 360; return Math.min(delta, 360 - delta); };
const chromaticity = (xyz) => { const sum = xyz.reduce((total, value) => total + value, 0); return [xyz[0] / sum, xyz[1] / sum]; };
const redDominance = (rgb) => rgb[0] - Math.max(rgb[1], rgb[2]);

async function assertFrozenFixtures() {
	const [bridgeBytes, outputBytes] = await Promise.all([readFile(BRIDGE_FIXTURE_PATH), readFile(OUTPUT_FIXTURE_PATH)]);
	requireCondition(sha256(bridgeBytes) === FIXTURE.bridgeFixture.sha256, 'The frozen Stage 2B bridge fixture changed.');
	requireCondition(sha256(outputBytes) === FIXTURE.outputFixture.sha256, 'The frozen Stage 2B output fixture changed.');
}

async function loadLedger() {
	const root = path.join(RUNS_ROOT, BRIDGE_FIXTURE.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Stage 2B colorfulness input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === BRIDGE_FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === BRIDGE_FIXTURE.input.artifactSetSha256, 'Stage 2B colorfulness input identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === BRIDGE_FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, BRIDGE_FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === BRIDGE_FIXTURE.input.ledgerSha256 && bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Stage 2B colorfulness ledger identity changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function selectRows(bridge, baseline, candidate) {
	const inventory = new Map(bridge.rows.map((row) => [row.key, row]));
	const calibrationKeys = [...BRIDGE_FIXTURE.calibrationRows];
	const calibrationSet = new Set(calibrationKeys);
	const heldOutKeys = [...inventory.keys()].filter((key) => !calibrationSet.has(key)).sort();
	requireCondition(inventory.size === FIXTURE.expectedInventoryCount, 'The eligible inventory must contain 25 unique rows.');
	requireCondition(calibrationSet.size === FIXTURE.expectedCalibrationCount && calibrationKeys.every((key) => inventory.has(key)), 'The frozen calibration set must contain nine valid unique rows.');
	requireCondition(heldOutKeys.length === FIXTURE.expectedHeldOutCount && calibrationKeys.length + heldOutKeys.length === inventory.size, 'The calibration and held-out sets must be an exact disjoint union.');
	const rows = calibrationKeys.map((key) => {
		const input = inventory.get(key);
		const baselineDisplay = baseline.transformAppearance(input.cam16);
		const candidateDisplay = candidate.transformAppearance(input.cam16);
		const control = chromaticityPreservingControl({
			absoluteXyz: input.radianceXyz,
			targetQ: candidateDisplay.desired.Q,
			outputViewingCondition: BRIDGE_FIXTURE.outputViewingCondition,
			bisectionIterations: OUTPUT_FIXTURE.bisectionIterations,
		});
		return {
			key: input.key,
			family: input.family,
			conditionId: input.conditionId,
			series: input.series,
			visibleFraction: input.visibleFraction,
			radianceXyz: input.radianceXyz,
			inputChromaticityXy: chromaticity(input.radianceXyz),
			adaptingLuminanceCdPerSquareMeter: input.adaptingLuminanceCdPerSquareMeter,
			cam16: input.cam16,
			baselineDisplay,
			candidateDisplay,
			chromaticityControl: control,
		};
	});
	return { rows, heldOutKeys };
}

function syntheticRows(candidate) {
	const rows = [];
	for (const qFraction of FIXTURE.synthetic.qFractions) {
		for (const M of FIXTURE.synthetic.colorfulness) {
			for (const h of FIXTURE.synthetic.huesDegrees) {
				rows.push({ qFraction, M, h, result: candidate.transformAppearance({ Q: qFraction * candidate.qMaster, M, h }) });
			}
		}
	}
	return rows;
}

function escapeXml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
function cssRgb(rgb) { return `rgb(${rgb.map((value) => `${(100 * value).toFixed(8)}%`).join(', ')})`; }
function familyLabel(family) { return family === 'spherical-distant' ? 'SAN JOSE / SPHERICAL / DISTANT' : 'FLAT / LOCAL'; }
function displayLabel(conditionId) {
	return ({
		'noon-minus-60': 'Noon -60 min', noon: 'Solar noon', 'noon-plus-60': 'Noon +60 min',
		'sunset-minus-60': 'Sunset -60 min', 'sunset-minus-30': 'Sunset -30 min', sunset: 'Sunset',
		closest: 'Closest', 'farthest-minus-30': 'Farthest -30 min', 'farthest-plus-10': 'Farthest +10 min',
	})[conditionId] ?? conditionId;
}

function renderSvg(rows, { title, subtitle, selectRgb }) {
	const config = FIXTURE.render;
	const rowCount = Math.ceil(rows.length / config.columns);
	const height = config.headerHeightPixels + rowCount * config.cellHeightPixels + config.footerHeightPixels;
	const cells = rows.map((row, index) => {
		const column = index % config.columns;
		const line = Math.floor(index / config.columns);
		const originX = column * config.cellWidthPixels;
		const originY = config.headerHeightPixels + line * config.cellHeightPixels;
		const centerX = originX + config.cellWidthPixels / 2;
		const centerY = originY + 112;
		return `<g data-calibration-key="${escapeXml(row.key)}"><rect x="${originX + 4}" y="${originY + 4}" width="${config.cellWidthPixels - 8}" height="${config.cellHeightPixels - 8}" rx="12" fill="${config.cellBackground}" stroke="${config.cellBorder}"/><text x="${centerX}" y="${originY + 29}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13" font-weight="600" letter-spacing="1">${familyLabel(row.family)}</text><circle cx="${centerX}" cy="${centerY}" r="${config.diskRadiusPixels}" fill="${cssRgb(selectRgb(row))}"/><text x="${centerX}" y="${originY + 221}" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="19" font-weight="600">${escapeXml(displayLabel(row.conditionId))}</text></g>`;
	}).join('');
	const footerY = config.headerHeightPixels + rowCount * config.cellHeightPixels + 33;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.widthPixels}" height="${height}" viewBox="0 0 ${config.widthPixels} ${height}"><rect width="100%" height="100%" fill="${config.background}"/><text x="${config.widthPixels / 2}" y="43" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="28" font-weight="650">${escapeXml(title)}</text><text x="${config.widthPixels / 2}" y="76" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="15">${escapeXml(subtitle)}</text>${cells}<text x="${config.widthPixels / 2}" y="${footerY}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13">Identical centered geometry · calibration rows only · held-out rows not transformed or rendered</text></svg>`;
}

function csv(rows) {
	const header = ['key', 'input_x', 'input_y', 'input_Q', 'input_M', 'target_Q', 'baseline_M', 'candidate_M', 'candidate_boundary', 'candidate_R', 'candidate_G', 'candidate_B', 'control_gamut_scale', 'control_R', 'control_G', 'control_B'];
	return `${[header.join(','), ...rows.map((row) => [row.key, ...row.inputChromaticityXy, row.cam16.Q, row.cam16.M, row.candidateDisplay.desired.Q, row.baselineDisplay.output.M, row.candidateDisplay.output.M, row.candidateDisplay.boundaryLimited, ...row.candidateDisplay.output.encodedSrgb, row.chromaticityControl.gamutScale, ...row.chromaticityControl.output.encodedSrgb].join(','))].join('\n')}\n`;
}

function analyze({ bridge, candidate, rows, heldOutKeys, synthetic, artifacts }) {
	const t = FIXTURE.tolerances;
	const assertions = [];
	const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
	const allResults = [...rows.map((row) => row.candidateDisplay), ...synthetic.map((row) => row.result)];
	check(bridge.rows.length === FIXTURE.expectedInventoryCount && rows.length === FIXTURE.expectedCalibrationCount && heldOutKeys.length === FIXTURE.expectedHeldOutCount, 'The frozen 9/16 split covers the complete 25-row inventory.');
	check(candidate.describe().id === 'stage2b-normal-q-log-preserve-m-fixed-q-boundary-v1', 'The candidate uses the declared M-preserving, fixed-Q gamut policy.');
	check(allResults.every((result) => result.output.encodedSrgb.every((value) => Number.isFinite(value) && value >= -t.rgbBoundsAbsolute && value <= 1 + t.rgbBoundsAbsolute)), 'Every calibration and synthetic candidate output is finite and bounded.');
	const neutrals = synthetic.filter((row) => row.M === 0);
	const maximumNeutralSpread = Math.max(...neutrals.map((row) => Math.max(...row.result.output.encodedSrgb) - Math.min(...row.result.output.encodedSrgb)));
	check(maximumNeutralSpread <= t.neutralEncodedSpread, 'Synthetic neutral inputs remain neutral.');
	const maximumHueError = Math.max(...allResults.filter((result) => result.output.M > 1e-8).map((result) => result.roundTrip.hueErrorDegrees));
	check(maximumHueError <= t.hueDegrees, 'The candidate preserves CAM16 hue through output reconstruction.');
	for (const M of FIXTURE.synthetic.colorfulness) for (const h of FIXTURE.synthetic.huesDegrees) {
		const sequence = synthetic.filter((row) => row.M === M && row.h === h).sort((left, right) => left.qFraction - right.qFraction);
		check(sequence.every((row, index) => index === 0 || row.result.output.Q + 1e-10 >= sequence[index - 1].result.output.Q), `Mapped Q is nondecreasing for synthetic M=${M}, h=${h}.`);
	}
	let maximumContinuityDistance = 0;
	for (const row of rows) {
		const lower = candidate.transformAppearance({ Q: row.cam16.Q * (1 - 1e-5), M: row.cam16.M * (1 - 1e-5), h: row.cam16.h });
		const upper = candidate.transformAppearance({ Q: row.cam16.Q * (1 + 1e-5), M: row.cam16.M * (1 + 1e-5), h: row.cam16.h });
		maximumContinuityDistance = Math.max(maximumContinuityDistance, distance(lower.output.encodedSrgb, upper.output.encodedSrgb));
	}
	check(maximumContinuityDistance <= t.continuityEncodedDistance, 'Calibration perturbations remain continuous.');
	const warmRows = rows.filter((row) => row.series.includes('sunset') || row.series.includes('farthest'));
	const warmRedDominance = warmRows.map((row) => ({ key: row.key, rejected: redDominance(row.baselineDisplay.output.encodedSrgb), candidate: redDominance(row.candidateDisplay.output.encodedSrgb), control: redDominance(row.chromaticityControl.output.encodedSrgb) }));
	check(
		warmRedDominance.every((row) => row.candidate > row.rejected + t.redDominanceImprovement),
		`Every warm calibration row gains red dominance over the rejected M/Q policy: ${JSON.stringify(warmRedDominance)}.`,
	);
	const exactWhiteCount = rows.filter((row) => row.candidateDisplay.output.encodedSrgb.every((value) => value === 1)).length;
	check(exactWhiteCount === 0, 'No calibration candidate maps to exact white.');
	const distinctEncodedCount = new Set(rows.map((row) => row.candidateDisplay.output.encodedSrgb.map((value) => value.toFixed(9)).join(','))).size;
	check(distinctEncodedCount === rows.length, 'All nine calibration candidate outputs remain distinct at float precision.');
	const controlChromaticityErrors = rows.filter((row) => !row.chromaticityControl.gamutLimited).map((row) => distance(row.inputChromaticityXy, row.chromaticityControl.output.chromaticityXy));
	const maximumControlChromaticityError = Math.max(0, ...controlChromaticityErrors);
	check(maximumControlChromaticityError <= t.chromaticityAbsolute, 'The ungamut-limited diagnostic control preserves transported CIE chromaticity.');
	const expectedKeys = rows.map((row) => row.key);
	const artifactKeyLists = artifacts.map((artifact) => [...artifact.matchAll(/data-calibration-key="([^"]+)"/gu)].map((match) => match[1]));
	check(artifactKeyLists.every((keys) => keys.length === expectedKeys.length && keys.every((key, index) => key === expectedKeys[index])), 'Every visual artifact contains exactly the ordered calibration identity set.');
	check(artifactKeyLists.flat().every((key) => !heldOutKeys.includes(key)), 'No held-out identity or output appears in a visual artifact.');
	return {
		assertions,
		summary: {
			inventoryCount: bridge.rows.length,
			calibrationCount: rows.length,
			heldOutCount: heldOutKeys.length,
			heldOutIdentitySha256: sha256(`${heldOutKeys.join('\n')}\n`),
			syntheticCount: synthetic.length,
			maximumNeutralEncodedSpread: maximumNeutralSpread,
			maximumHueErrorDegrees: maximumHueError,
			maximumContinuityEncodedDistance: maximumContinuityDistance,
			exactWhiteCount,
			distinctEncodedCount,
			candidateBoundaryLimitedCount: rows.filter((row) => row.candidateDisplay.boundaryLimited).length,
			controlGamutLimitedCount: rows.filter((row) => row.chromaticityControl.gamutLimited).length,
			maximumControlChromaticityError,
			warmRedDominance,
		},
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'spectral-color-stage2b-colorfulness-candidates',
		command: COMMAND,
		inputs: { fixture: 'experiments/extraterrestrial/fixtures/spectral-color-stage2b-colorfulness-candidates-v1.json', measuredInputRunId: BRIDGE_FIXTURE.input.runId, scope: 'calibration-only M-preserving candidate and chromaticity control; no atmosphere/cache/held-out display output' },
		provenance: { brightness: 'accepted Stage 2B Q mastering curve', candidate: 'preserve source-condition CAM16 M', control: 'preserve transported CIE xy at target Q before same-Y D65 gamut intersection' },
		environment: { node: process.version, platform: process.platform },
		references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md', normalPlan: 'agents/topics/extraterrestrial/normal-mode-test-plan.md', research: 'agents/topics/extraterrestrial/normal-color-stage2b-reference-research.md' },
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		await assertFrozenFixtures();
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE_FIXTURE, cieRows: parseCie1931(cieText) });
		const common = { q0: bridge.q0, qMaster: bridge.qMaster, outputViewingCondition: BRIDGE_FIXTURE.outputViewingCondition, bisectionIterations: OUTPUT_FIXTURE.bisectionIterations };
		const baseline = new Stage2bNormalDisplayTransform(common);
		const candidate = new Stage2bPreserveColorfulnessTransform(common);
		const { rows, heldOutKeys } = selectRows(bridge, baseline, candidate);
		const synthetic = syntheticRows(candidate);
		const candidatePlate = renderSvg(rows, { title: 'Stage 2B candidate — preserve CAM16 M', subtitle: 'Accepted Q brightness curve · perceived colorfulness retained until the display boundary', selectRgb: (row) => row.candidateDisplay.output.encodedSrgb });
		const controlPlate = renderSvg(rows, { title: 'Stage 2B diagnostic — preserve transported chromaticity', subtitle: 'Same Q brightness target · CIE xy retained before any required same-luminance gamut intersection', selectRgb: (row) => row.chromaticityControl.output.encodedSrgb });
		const proofAnalysis = analyze({ bridge, candidate, rows, heldOutKeys, synthetic, artifacts: [candidatePlate, controlPlate] });
		const result = { schemaId: 'spectral-color-stage2b-colorfulness-candidates-result-v1', input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: BRIDGE_FIXTURE.input.ledgerSha256 }, claimLimit: 'calibration-only candidate comparison; observer-proxy decision pending; held-out display outputs not computed', baseline: baseline.describe(), candidate: candidate.describe(), control: 'CIE xy preserved at candidate target Q with same-luminance D65 gamut intersection if required', rows, synthetic };
		await run.writeJsonArtifact('evidence/stage2b-colorfulness-candidates.json', result);
		await run.writeArtifact('evidence/stage2b-colorfulness-candidates.csv', csv(rows));
		await run.writeArtifact('renders/preserve-m-candidate.svg', candidatePlate);
		await run.writeArtifact('renders/chromaticity-control.svg', controlPlate);
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-stage2b-colorfulness-candidates.js', 'color/Cam16Reference.js', 'color/Stage2bInputBridge.js', 'color/Stage2bNormalDisplayTransform.js', 'color/Stage2bColorfulnessCandidates.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Stage 2B colorfulness protected inventory');
		const proof = { proofId: 'spectral-color-stage2b-colorfulness-candidates-v1', accepted: true, state: 'generated-for-observer-proxy-review', assertions: proofAnalysis.assertions, summary: proofAnalysis.summary, outputs: { candidatePlate: 'renders/preserve-m-candidate.svg', controlPlate: 'renders/chromaticity-control.svg', numeric: 'evidence/stage2b-colorfulness-candidates.json', csv: 'evidence/stage2b-colorfulness-candidates.csv' }, remaining: ['observer-proxy comparison', 'candidate selection or rejection', 'full numerical requalification before held-out review'], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/stage2b-colorfulness-candidates-proof.json', proof);
		const finalManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Stage 2B colorfulness candidates\n\nConclusion: **accepted as calibration-only comparison evidence; observer-proxy decision pending**.\n\nThe rejected M/Q policy, an M-preserving candidate, and a transported-chromaticity diagnostic were recomputed from exactly nine calibration spectra while retaining the accepted Q brightness curve. The candidate passed ${proof.summary.syntheticCount} synthetic inputs, remained finite, bounded, neutral-stable, hue-stable, continuous, and distinct, and increased red dominance over the rejected policy for every warm calibration row. No held-out display output was computed or presented.\n\nThis run does not select the candidate or authorize held-out presentation.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, state: proof.state, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 2B colorfulness candidates\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
