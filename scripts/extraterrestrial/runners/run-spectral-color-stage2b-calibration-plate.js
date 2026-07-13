import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import OUTPUT_FIXTURE from '../fixtures/spectral-color-stage2b-output-proof-v1.json' with { type: 'json' };
import FIXTURE from '../fixtures/spectral-color-stage2b-calibration-plate-v1.json' with { type: 'json' };
import { deriveStage2bInputBridge } from '../color/Stage2bInputBridge.js';
import { Stage2bNormalDisplayTransform } from '../color/Stage2bNormalDisplayTransform.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node scripts/extraterrestrial/runners/run-spectral-color-stage2b-calibration-plate.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const BRIDGE_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'spectral-color-stage2b-reference-bridge-v1.json');
const OUTPUT_FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'spectral-color-stage2b-output-proof-v1.json');
const requireCondition = (value, message) => { if (!value) throw new Error(message); };
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

async function loadLedger() {
	const root = path.join(RUNS_ROOT, BRIDGE_FIXTURE.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Stage 2B calibration input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(
		manifest.runId === BRIDGE_FIXTURE.input.runId
		&& manifest.conclusion === 'accepted'
		&& manifest.artifactSetSha256 === BRIDGE_FIXTURE.input.artifactSetSha256,
		'Stage 2B calibration input identity changed.',
	);
	const entry = manifest.artifacts.find((artifact) => artifact.path === BRIDGE_FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, BRIDGE_FIXTURE.input.ledgerPath));
	requireCondition(
		entry?.sha256 === BRIDGE_FIXTURE.input.ledgerSha256
		&& bytes.byteLength === entry.byteLength
		&& sha256(bytes) === entry.sha256,
		'Stage 2B calibration ledger identity changed.',
	);
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

async function assertFrozenFixtures() {
	const [bridgeBytes, outputBytes] = await Promise.all([
		readFile(BRIDGE_FIXTURE_PATH),
		readFile(OUTPUT_FIXTURE_PATH),
	]);
	requireCondition(sha256(bridgeBytes) === FIXTURE.bridgeFixture.sha256, 'The frozen Stage 2B bridge fixture changed.');
	requireCondition(sha256(outputBytes) === FIXTURE.outputFixture.sha256, 'The frozen Stage 2B output fixture changed.');
}

function selectCalibration(bridge, transform) {
	const inventory = new Map(bridge.rows.map((row) => [row.key, row]));
	const calibrationKeys = [...BRIDGE_FIXTURE.calibrationRows];
	const calibrationSet = new Set(calibrationKeys);
	const heldOutKeys = [...inventory.keys()].filter((key) => !calibrationSet.has(key)).sort();
	requireCondition(inventory.size === FIXTURE.expectedInventoryCount, 'The accepted eligible inventory must contain 25 unique rows.');
	requireCondition(calibrationSet.size === FIXTURE.expectedCalibrationCount, 'The calibration set must contain nine unique rows.');
	requireCondition(calibrationKeys.every((key) => inventory.has(key)), 'Every frozen calibration row must exist in the accepted inventory.');
	requireCondition(heldOutKeys.length === FIXTURE.expectedHeldOutCount, 'The complement must contain exactly sixteen held-out rows.');
	requireCondition(calibrationKeys.length + heldOutKeys.length === inventory.size, 'Calibration and held-out rows must form an exact disjoint union.');
	const rows = calibrationKeys.map((key) => {
		const input = inventory.get(key);
		return {
			key: input.key,
			family: input.family,
			conditionId: input.conditionId,
			series: input.series,
			visibleFraction: input.visibleFraction,
			visibleProjectedSolidAngleSteradians: input.visibleProjectedSolidAngleSteradians,
			spectralRadiance: input.spectralRadiance,
			spectralIrradiance: input.spectralIrradiance,
			radianceXyz: input.radianceXyz,
			irradianceXyz: input.irradianceXyz,
			adaptingLuminanceCdPerSquareMeter: input.adaptingLuminanceCdPerSquareMeter,
			cam16: input.cam16,
			display: transform.transformAppearance(input.cam16),
		};
	});
	return { rows, heldOutKeys };
}

function escapeXml(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function displayLabel(row) {
	const labels = {
		'noon-minus-60': 'Noon -60 min',
		noon: 'Solar noon',
		'noon-plus-60': 'Noon +60 min',
		'sunset-minus-60': 'Sunset -60 min',
		'sunset-minus-30': 'Sunset -30 min',
		sunset: 'Sunset',
		closest: 'Closest',
		'farthest-minus-30': 'Farthest -30 min',
		'farthest-plus-10': 'Farthest +10 min',
	};
	return labels[row.conditionId] ?? row.conditionId;
}

function familyLabel(family) {
	return family === 'spherical-distant' ? 'SAN JOSE / SPHERICAL / DISTANT' : 'FLAT / LOCAL';
}

function cssRgb(rgb) {
	return `rgb(${rgb.map((value) => `${(100 * value).toFixed(8)}%`).join(', ')})`;
}

function renderSvg(rows) {
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
		return `<g data-calibration-key="${escapeXml(row.key)}">`
			+ `<rect x="${originX + 4}" y="${originY + 4}" width="${config.cellWidthPixels - 8}" height="${config.cellHeightPixels - 8}" rx="12" fill="${config.cellBackground}" stroke="${config.cellBorder}"/>`
			+ `<text x="${centerX}" y="${originY + 29}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13" font-weight="600" letter-spacing="1">${familyLabel(row.family)}</text>`
			+ `<circle cx="${centerX}" cy="${centerY}" r="${config.diskRadiusPixels}" fill="${cssRgb(row.display.output.encodedSrgb)}"/>`
			+ `<text x="${centerX}" y="${originY + 221}" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="19" font-weight="600">${escapeXml(displayLabel(row))}</text>`
			+ '</g>';
	}).join('');
	const footerY = config.headerHeightPixels + rowCount * config.cellHeightPixels + 33;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.widthPixels}" height="${height}" viewBox="0 0 ${config.widthPixels} ${height}">`
		+ `<rect width="100%" height="100%" fill="${config.background}"/>`
		+ `<text x="${config.widthPixels / 2}" y="43" text-anchor="middle" fill="${config.primaryText}" font-family="Segoe UI, sans-serif" font-size="28" font-weight="650">Stage 2B Normal — calibration subset</text>`
		+ `<text x="${config.widthPixels / 2}" y="76" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="15">Nine isolated disk-color swatches · 100-nit D65 Rec.709/sRGB target · no glare or bloom</text>`
		+ cells
		+ `<text x="${config.widthPixels / 2}" y="${footerY}" text-anchor="middle" fill="${config.secondaryText}" font-family="Segoe UI, sans-serif" font-size="13">Identical centered swatch geometry; condition-specific transported spectra and support-derived adaptation. Held-out rows are not rendered.</text>`
		+ '</svg>';
}

function csv(rows) {
	const header = ['key', 'visible_fraction', 'adapting_luminance_cd_m2', 'input_Q', 'input_M', 'input_h', 'mastering_t', 'boundary_limited', 'boundary_scale', 'R', 'G', 'B'];
	return `${[header.join(','), ...rows.map((row) => [
		row.key,
		row.visibleFraction,
		row.adaptingLuminanceCdPerSquareMeter,
		row.cam16.Q,
		row.cam16.M,
		row.cam16.h,
		row.display.masteringCoordinate,
		row.display.boundaryLimited,
		row.display.boundaryScale,
		...row.display.output.encodedSrgb,
	].join(','))].join('\n')}\n`;
}

function analyze({ bridge, transform, rows, heldOutKeys, artifacts }) {
	const assertions = [];
	const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
	check(bridge.rows.length === FIXTURE.expectedInventoryCount, 'The manifest-verified ledger supplies the complete 25-row eligible inventory.');
	check(rows.length === FIXTURE.expectedCalibrationCount, 'Exactly nine frozen calibration rows are transformed and rendered.');
	check(heldOutKeys.length === FIXTURE.expectedHeldOutCount, 'Exactly sixteen rows remain held out.');
	check(transform.describe().id === FIXTURE.expectedTransform.id, 'The frozen Stage 2B transform identity is unchanged.');
	check(Math.abs(bridge.q0 - FIXTURE.expectedTransform.q0) <= 1e-12, 'The frozen Q0 anchor is unchanged.');
	check(Math.abs(bridge.qMaster - FIXTURE.expectedTransform.qMaster) <= 1e-12, 'The frozen Qmaster anchor is unchanged.');
	check(rows.every((row) => row.display.output.encodedSrgb.every((value) => Number.isFinite(value) && value >= 0 && value <= 1)), 'Every calibration output is finite and display-bounded.');
	check(rows.every((row) => !row.display.output.encodedSrgb.every((value) => value === 1)), 'No calibration disk maps to exact white.');
	check(new Set(rows.map((row) => row.display.output.encodedSrgb.map((value) => value.toFixed(9)).join(','))).size === rows.length, 'All nine calibration outputs remain distinct at float precision.');
	const [numericArtifact, csvArtifact, svgArtifact] = artifacts;
	const artifactKeyLists = [
		JSON.parse(numericArtifact).rows.map((row) => row.key),
		csvArtifact.trim().split('\n').slice(1).map((line) => line.split(',')[0]),
		[...svgArtifact.matchAll(/data-calibration-key="([^"]+)"/gu)].map((match) => match[1]),
	];
	check(
		artifactKeyLists.every((keys) => keys.length === rows.length && keys.every((key, index) => key === rows[index].key)),
		'Every review artifact contains exactly the ordered nine-row calibration identity set.',
	);
	check(
		artifactKeyLists.flat().every((key) => !heldOutKeys.includes(key)),
		'No held-out row identity or output appears in a review artifact.',
	);
	const config = FIXTURE.render;
	const expectedCenters = rows.map((_, index) => ({
		x: (index % config.columns) * config.cellWidthPixels + config.cellWidthPixels / 2,
		y: config.headerHeightPixels + Math.floor(index / config.columns) * config.cellHeightPixels + 112,
	}));
	check(expectedCenters.every(({ x }) => x % config.cellWidthPixels === config.cellWidthPixels / 2), 'Every disk is horizontally centered in an equal-width cell.');
	return {
		assertions,
		summary: {
			inventoryCount: bridge.rows.length,
			calibrationCount: rows.length,
			heldOutCount: heldOutKeys.length,
			heldOutIdentitySha256: sha256(`${heldOutKeys.join('\n')}\n`),
			exactWhiteCount: rows.filter((row) => row.display.output.encodedSrgb.every((value) => value === 1)).length,
			distinctEncodedCount: new Set(rows.map((row) => row.display.output.encodedSrgb.map((value) => value.toFixed(9)).join(','))).size,
			boundaryLimitedCount: rows.filter((row) => row.display.boundaryLimited).length,
			encodedRange: [Math.min(...rows.flatMap((row) => row.display.output.encodedSrgb)), Math.max(...rows.flatMap((row) => row.display.output.encodedSrgb))],
			plateDimensionsPixels: [config.widthPixels, config.headerHeightPixels + Math.ceil(rows.length / config.columns) * config.cellHeightPixels + config.footerHeightPixels],
		},
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'spectral-color-stage2b-calibration-plate',
		command: COMMAND,
		inputs: {
			fixture: 'scripts/extraterrestrial/fixtures/spectral-color-stage2b-calibration-plate-v1.json',
			measuredInputRunId: BRIDGE_FIXTURE.input.runId,
			scope: 'nine-row calibration-only Color plate; no atmosphere, cache, geometry, obstruction, or held-out display output',
		},
		provenance: {
			bridge: FIXTURE.bridgeFixture,
			outputProofConfiguration: FIXTURE.outputFixture,
			observer: 'CIE 1931 2-degree / CIECAM16 N-P2-100 candidate',
		},
		environment: { node: process.version, platform: process.platform },
		references: {
			plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md',
			normalPlan: 'agents/topics/extraterrestrial/normal-mode-test-plan.md',
			research: 'agents/topics/extraterrestrial/normal-color-stage2b-reference-research.md',
		},
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		await assertFrozenFixtures();
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE_FIXTURE, cieRows: parseCie1931(cieText) });
		const transform = new Stage2bNormalDisplayTransform({
			q0: bridge.q0,
			qMaster: bridge.qMaster,
			outputViewingCondition: BRIDGE_FIXTURE.outputViewingCondition,
			bisectionIterations: OUTPUT_FIXTURE.bisectionIterations,
		});
		const { rows, heldOutKeys } = selectCalibration(bridge, transform);
		const numeric = JSON.stringify({
			schemaId: 'spectral-color-stage2b-calibration-result-v1',
			input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: BRIDGE_FIXTURE.input.ledgerSha256 },
			claimLimit: 'calibration-only presentation; observer-proxy decision pending; held-out outputs not computed or presented',
			transform: transform.describe(),
			rows,
		}, null, '\t') + '\n';
		const table = csv(rows);
		const plate = renderSvg(rows);
		const proofAnalysis = analyze({ bridge, transform, rows, heldOutKeys, artifacts: [numeric, table, plate] });
		await run.writeArtifact('evidence/stage2b-calibration.json', numeric);
		await run.writeArtifact('evidence/stage2b-calibration.csv', table);
		await run.writeArtifact('renders/stage2b-calibration.svg', plate);
		const closure = await buildStaticModuleClosure({
			candidateRoot: EXPERIMENT_ROOT,
			entryFiles: ['runners/run-spectral-color-stage2b-calibration-plate.js', 'color/Cam16Reference.js', 'color/Stage2bInputBridge.js', 'color/Stage2bNormalDisplayTransform.js'],
			packageJsonPath: EXPERIMENT_PACKAGE_PATH,
			nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT,
			allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'],
		});
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Stage 2B calibration protected inventory');
		const proof = {
			proofId: 'spectral-color-stage2b-calibration-plate-v1',
			accepted: true,
			state: 'generated-for-observer-proxy-review',
			assertions: proofAnalysis.assertions,
			summary: proofAnalysis.summary,
			outputs: {
				plate: 'renders/stage2b-calibration.svg',
				numeric: 'evidence/stage2b-calibration.json',
				csv: 'evidence/stage2b-calibration.csv',
			},
			remaining: ['observer-proxy calibration review', 'candidate freeze', 'held-out review'],
			containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length },
		};
		await run.writeJsonArtifact('evidence/stage2b-calibration-proof.json', proof);
		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: proof,
			report: `# ${run.runId}: Stage 2B calibration-only plate\n\nConclusion: **accepted as generated review evidence; observer-proxy decision pending**.\n\nThe frozen transform was recomputed from the manifest-verified Stage 1 ledger for exactly nine calibration rows. All nine outputs are finite, bounded, distinct at float precision, and non-white. The sixteen held-out rows were excluded from display transformation and review artifacts. The plate uses identical centered swatch geometry so this review isolates Color rather than apparent size or placement.\n\nThis run does not accept the candidate perceptually and does not authorize held-out presentation.\n`,
		});
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, state: proof.state, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stage 2B calibration-only plate\n\nConclusion: **failed**\n\n${detail.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
