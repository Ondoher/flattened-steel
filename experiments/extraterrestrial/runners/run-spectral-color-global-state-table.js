import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import BRIDGE_FIXTURE from '../fixtures/spectral-color-stage2b-reference-bridge-v1.json' with { type: 'json' };
import { deriveStage2bInputBridge } from '../color/Stage2bInputBridge.js';
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-spectral-color-global-state-table.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');
const VISUAL_STATE_KEYS = Object.freeze([
	'spherical-distant/noon',
	'spherical-distant/sunset-minus-30',
	'spherical-distant/sunset-minus-10',
	'spherical-distant/sunset',
]);

function requireCondition(value, message) { if (!value) throw new Error(message); }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }

async function loadLedger() {
	const root = path.join(RUNS_ROOT, BRIDGE_FIXTURE.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Global-state input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === BRIDGE_FIXTURE.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === BRIDGE_FIXTURE.input.artifactSetSha256, 'Global-state input run identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === BRIDGE_FIXTURE.input.ledgerPath);
	const bytes = await readFile(path.join(root, BRIDGE_FIXTURE.input.ledgerPath));
	requireCondition(entry?.sha256 === BRIDGE_FIXTURE.input.ledgerSha256 && bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Global-state ledger identity changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function stateRow(row, partition) {
	return {
		key: row.key,
		partition,
		visibleFraction: row.visibleFraction,
		visibleProjectedSolidAngleSteradians: row.visibleProjectedSolidAngleSteradians,
		spectralIrradianceWattsPerSquareMeterPerMeter: row.spectralIrradiance,
		photopicDirectIlluminanceLux: row.irradianceXyz[1],
		adaptingLuminanceCdPerSquareMeter: row.adaptingLuminanceCdPerSquareMeter,
		cam16: {
			FL: row.cam16.viewingState.FL,
			n: row.cam16.viewingState.n,
			z: row.cam16.viewingState.z,
			Nbb: row.cam16.viewingState.Nbb,
			Ncb: row.cam16.viewingState.Ncb,
			D: row.cam16.viewingState.D,
			J: row.cam16.J,
			Q: row.cam16.Q,
			M: row.cam16.M,
			hDegrees: row.cam16.h,
		},
	};
}

function csv(rows) {
	const header = ['key', 'partition', 'visible_fraction', 'solid_angle_sr', 'Ev_lux', 'LA_cd_m2', 'FL', 'n', 'z', 'Nbb', 'Ncb', 'D', 'J', 'Q', 'M', 'h_deg'];
	const values = rows.map((row) => [row.key, row.partition, row.visibleFraction, row.visibleProjectedSolidAngleSteradians, row.photopicDirectIlluminanceLux, row.adaptingLuminanceCdPerSquareMeter, row.cam16.FL, row.cam16.n, row.cam16.z, row.cam16.Nbb, row.cam16.Ncb, row.cam16.D, row.cam16.J, row.cam16.Q, row.cam16.M, row.cam16.hDegrees]);
	return `${[header, ...values].map((record) => record.join(',')).join('\n')}\n`;
}

function analyze(bridge, rowsByKey, calibrationRows, visualRows) {
	const assertions = [];
	const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
	const finiteState = (row) => [row.visibleFraction, row.visibleProjectedSolidAngleSteradians, row.photopicDirectIlluminanceLux, row.adaptingLuminanceCdPerSquareMeter, ...Object.values(row.cam16)].every(Number.isFinite);
	check(calibrationRows.length === 9 && new Set(calibrationRows.map((row) => row.key)).size === 9, 'The table contains exactly the frozen nine calibration observations.');
	check(calibrationRows.every(finiteState), 'Every calibration state and appearance correlate is finite.');
	check(calibrationRows.every((row) => row.spectralIrradianceWattsPerSquareMeterPerMeter.length === 15 && row.spectralIrradianceWattsPerSquareMeterPerMeter.every((value) => Number.isFinite(value) && value >= 0)), 'Every calibration row retains one finite nonnegative native-15 irradiance spectrum.');
	check(calibrationRows.every((row) => Math.abs(row.adaptingLuminanceCdPerSquareMeter - Math.max(row.photopicDirectIlluminanceLux / Math.PI, BRIDGE_FIXTURE.sourceViewingCondition.adaptationFloorCdPerSquareMeter)) <= 1e-12 * Math.max(1, row.adaptingLuminanceCdPerSquareMeter)), 'Every L_A is the declared max(E_v / pi, floor) derivation.');
	check(calibrationRows.every((row) => row.photopicDirectIlluminanceLux > 0 && row.adaptingLuminanceCdPerSquareMeter > BRIDGE_FIXTURE.sourceViewingCondition.adaptationFloorCdPerSquareMeter), 'The diagnostic adaptation floor is inactive for every calibration observation.');
	const sunset = ['spherical-distant/sunset-minus-60', 'spherical-distant/sunset-minus-30', 'spherical-distant/sunset'].map((key) => rowsByKey.get(key));
	check(sunset.every(Boolean) && sunset[0].irradianceXyz[1] > sunset[1].irradianceXyz[1] && sunset[1].irradianceXyz[1] > sunset[2].irradianceXyz[1], 'Spherical direct photopic illuminance decreases strictly from sunset minus 60 to minus 30 to sunset.');
	const noon = ['spherical-distant/noon-minus-60', 'spherical-distant/noon', 'spherical-distant/noon-plus-60'].map((key) => rowsByKey.get(key));
	check(noon.every(Boolean) && noon[1].irradianceXyz[1] > noon[0].irradianceXyz[1] && noon[1].irradianceXyz[1] > noon[2].irradianceXyz[1], 'Spherical noon has greater direct photopic illuminance than both one-hour neighbors.');
	check(visualRows.length === VISUAL_STATE_KEYS.length && visualRows.every(finiteState), 'All four declared visual-review conditions have finite global states.');
	for (const property of ['photopicDirectIlluminanceLux', 'adaptingLuminanceCdPerSquareMeter']) check(new Set(visualRows.map((row) => row[property])).size === visualRows.length, `The four visual-review conditions retain distinct ${property}.`);
	check(new Set(visualRows.map((row) => row.cam16.Q)).size === visualRows.length, 'The dynamic global state does not normalize the four visual-review disk brightness Q values to one value.');
	const allRows = [...rowsByKey.values()];
	check(allRows.length === BRIDGE_FIXTURE.input.expectedSampleCount, 'The bridge reconciles all 25 eligible input rows before selecting calibration evidence.');
	return {
		assertions,
		summary: {
			calibrationCount: calibrationRows.length,
			visualStateCheckCount: visualRows.length,
			illuminanceRangeLux: [Math.min(...calibrationRows.map((row) => row.photopicDirectIlluminanceLux)), Math.max(...calibrationRows.map((row) => row.photopicDirectIlluminanceLux))],
			adaptingLuminanceRangeCdPerSquareMeter: [Math.min(...calibrationRows.map((row) => row.adaptingLuminanceCdPerSquareMeter)), Math.max(...calibrationRows.map((row) => row.adaptingLuminanceCdPerSquareMeter))],
			FLRange: [Math.min(...calibrationRows.map((row) => row.cam16.FL)), Math.max(...calibrationRows.map((row) => row.cam16.FL))],
			QRange: [Math.min(...calibrationRows.map((row) => row.cam16.Q)), Math.max(...calibrationRows.map((row) => row.cam16.Q))],
			visualStateKeys: VISUAL_STATE_KEYS,
			q0: bridge.q0,
			qMaster: bridge.qMaster,
		},
	};
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'spectral-color-global-state-table',
		command: COMMAND,
		inputs: { fixture: 'experiments/extraterrestrial/fixtures/spectral-color-stage2b-reference-bridge-v1.json', measuredInputRunId: BRIDGE_FIXTURE.input.runId, calibrationRows: BRIDGE_FIXTURE.calibrationRows, visualStateChecks: VISUAL_STATE_KEYS, scope: 'existing spectral ledger to global Color state; no atmosphere, cache, framebuffer, image, or held-out display transform' },
		provenance: { observer: 'official contained CIE 1931 2-degree table', adaptation: 'visible direct spectral irradiance; E_v / pi equivalent-diffuse proxy', appearance: 'verified Li et al. 2017 CAM16 implementation and frozen Stage 2B source condition' },
		environment: { node: process.version, platform: process.platform },
		references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#revised-reasonable-normal-global-plan', research: 'agents/topics/extraterrestrial/normal-color-stage2b-reference-research.md' },
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const bridge = deriveStage2bInputBridge({ ledger, fixture: BRIDGE_FIXTURE, cieRows: parseCie1931(cieText) });
		const rowsByKey = new Map(bridge.rows.map((row) => [row.key, row]));
		const calibrationRows = BRIDGE_FIXTURE.calibrationRows.map((key) => stateRow(rowsByKey.get(key), 'calibration'));
		const visualRows = VISUAL_STATE_KEYS.map((key) => stateRow(rowsByKey.get(key), BRIDGE_FIXTURE.calibrationRows.includes(key) ? 'calibration' : 'state-check-only'));
		const proofAnalysis = analyze(bridge, rowsByKey, calibrationRows, visualRows);
		const result = { schemaId: 'spectral-color-global-state-table-result-v1', input: { runId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: BRIDGE_FIXTURE.input.ledgerSha256 }, configuration: { spectralToPhotopic: 'CIE 1931 ybar bin-center * bin-width * 683 lm/W', adaptingLuminance: 'max(E_v / pi, 1e-6 cd/m2)', white: BRIDGE_FIXTURE.sourceViewingCondition.whiteChromaticityXyzRelative, surround: BRIDGE_FIXTURE.sourceViewingCondition.surround, backgroundRelativeY: BRIDGE_FIXTURE.sourceViewingCondition.backgroundRelativeY, discountIlluminant: BRIDGE_FIXTURE.sourceViewingCondition.discountIlluminant }, calibrationRows, visualStateChecks: visualRows };
		await run.writeJsonArtifact('evidence/global-color-state-table.json', result);
		await run.writeArtifact('evidence/global-color-state-table.csv', csv(calibrationRows));
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-global-state-table.js', 'color/Stage2bInputBridge.js', 'color/Cam16Reference.js', 'color/NormalColorTransform.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Global-state protected inventory');
		const proof = { proofId: 'spectral-color-global-state-table-v1', accepted: true, assertions: proofAnalysis.assertions, summary: proofAnalysis.summary, remaining: ['referenced Q_t to J_t brightness/chroma coupling', 'numerical output-transform proof', 'four-frame full-context review'], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/global-color-state-proof.json', proof);
		const finalManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Global Color state table\n\nConclusion: **accepted for the reasonable-global state derivation**.\n\nThe frozen ledger produced ${proof.summary.calibrationCount} calibration states without atmosphere execution, cache work, framebuffer analysis, or image generation. Direct illuminance spans ${proof.summary.illuminanceRangeLux[0]} to ${proof.summary.illuminanceRangeLux[1]} lux; equivalent-diffuse L_A spans ${proof.summary.adaptingLuminanceRangeCdPerSquareMeter[0]} to ${proof.summary.adaptingLuminanceRangeCdPerSquareMeter[1]} cd/m2. All four declared visual-review states remain distinct, including CAM16 Q.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Global Color state table\n\nConclusion: **failed**.\n\n${detail.message}\n` });
			process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`);
		} catch {}
		process.exitCode = 1;
	}
}

await main();
