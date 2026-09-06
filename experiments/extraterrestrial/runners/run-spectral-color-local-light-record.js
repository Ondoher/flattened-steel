import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import CONFIG from '../fixtures/spectral-color-local-light-record-v1.json' with { type: 'json' };
import { parseCie1931 } from '../color/NormalColorTransform.js';
import { assertNoReparseEntries, createProtectedTrackedInventory, loadContainmentPolicy } from '../harness/lib/containment.js';
import { assertFileInventoriesEqual } from '../harness/lib/hashes.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT, RUNS_ROOT, assertRepositoryIdentity } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-spectral-color-local-light-record.js';
const CIE_PATH = path.join(EXPERIMENT_ROOT, 'references', 'bruneton-step5-nonregression-v1', 'CIE_xyz_1931_2deg.csv');

function requireCondition(value, message) { if (!value) throw new Error(message); }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function within(actual, expected, tolerance) { return Math.abs(actual - expected) <= tolerance.derivedAbsolute + tolerance.derivedRelative * Math.max(Math.abs(actual), Math.abs(expected)); }

async function loadLedger() {
	const root = path.join(RUNS_ROOT, CONFIG.input.runId);
	await lstat(root);
	await assertNoReparseEntries(root, 'Local-light input run');
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	requireCondition(manifest.runId === CONFIG.input.runId && manifest.conclusion === 'accepted' && manifest.artifactSetSha256 === CONFIG.input.artifactSetSha256, 'Local-light input run identity changed.');
	const entry = manifest.artifacts.find((artifact) => artifact.path === CONFIG.input.ledgerPath);
	const bytes = await readFile(path.join(root, CONFIG.input.ledgerPath));
	requireCondition(entry?.sha256 === CONFIG.input.ledgerSha256 && bytes.byteLength === entry.byteLength && sha256(bytes) === entry.sha256, 'Local-light ledger identity changed.');
	return { ledger: JSON.parse(bytes.toString('utf8')), manifest };
}

function cieAt(cieRows, wavelength) {
	const lowerIndex = Math.floor(wavelength);
	const upperIndex = Math.ceil(wavelength);
	const lower = cieRows.get(lowerIndex);
	const upper = cieRows.get(upperIndex);
	requireCondition(lower && upper, `CIE table does not bracket ${wavelength} nm.`);
	if (lowerIndex === upperIndex) return lower;
	const fraction = wavelength - lowerIndex;
	return lower.map((value, index) => value + fraction * (upper[index] - value));
}

function photopicIlluminance(spectrum, basis, cieRows) {
	return spectrum.reduce((sum, value, index) => {
		const channel = basis.channels[index];
		return sum + value * channel.width.value * cieAt(cieRows, channel.center.value)[1] * 683;
	}, 0);
}

function visibleDiskFraction(elevationRadians, angularRadiusRadians) {
	const height = elevationRadians / angularRadiusRadians;
	if (height >= 1) return 1;
	if (height <= -1) return 0;
	return (Math.acos(-height) + height * Math.sqrt(1 - height ** 2)) / Math.PI;
}

function makeRecord(ledger, requested, cieRows) {
	const conditionId = requested.key.split('/')[1];
	const condition = ledger.spherical.conditions.find((candidate) => candidate.id === conditionId);
	requireCondition(condition, `Missing condition ${requested.key}.`);
	requireCondition(condition.timeIso === requested.timeIso, `Exact time changed for ${requested.key}.`);
	const sample = condition.samples.find((candidate) => candidate.role === CONFIG.sampleRole);
	requireCondition(sample?.colorInputEligibility === CONFIG.eligibility, `No eligible disk-center spectrum for ${requested.key}.`);
	const directionNorm = Math.hypot(...condition.sunDirectionModel);
	requireCondition(Math.abs(directionNorm - 1) <= CONFIG.tolerances.directionNormAbsolute, `Sun direction is not normalized for ${requested.key}.`);
	const visibleFraction = visibleDiskFraction(condition.solarElevationRadians, CONFIG.sphericalAngularRadiusRadians);
	const visibleProjectedSolidAngleSteradians = visibleFraction * Math.PI * Math.sin(CONFIG.sphericalAngularRadiusRadians) ** 2;
	const spectralIrradiance = sample.celestialRadiance.map((value) => value * visibleProjectedSolidAngleSteradians);
	const Ev = photopicIlluminance(spectralIrradiance, ledger.spectralBasis, cieRows);
	return {
		key: requested.key,
		timeIso: condition.timeIso,
		geometry: {
			sunDirectionModel: condition.sunDirectionModel,
			solarElevationRadians: condition.solarElevationRadians,
			horizonMinimumZ: condition.horizonMinimumZ,
			angularRadiusRadians: CONFIG.sphericalAngularRadiusRadians,
			visibleFraction,
			visibleProjectedSolidAngleSteradians,
		},
		transportedDirectSpectralRadiance: {
			quantity: ledger.radianceQuantity,
			units: ledger.radianceUnits,
			basisHash: ledger.spectralBasis.contentHash,
			values: sample.celestialRadiance,
		},
		directSpectralIrradiance: {
			quantity: 'spectral-irradiance-density',
			units: 'W m^-2 nm^-1',
			basisHash: ledger.spectralBasis.contentHash,
			values: spectralIrradiance,
		},
		photopicDirectIlluminance: { value: Ev, units: 'lux' },
		adaptingLuminanceProxy: { value: Math.max(Ev / Math.PI, CONFIG.adaptationFloorCdPerSquareMeter), units: 'cd m^-2', equation: 'max(E_v / pi, 1e-6 cd m^-2)' },
	};
}

function analyze(ledger, records) {
	const assertions = [];
	const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
	check(ledger.acquisition.recoveredRunId === CONFIG.input.algorithm32AcquisitionRunId && ledger.acquisition.recoveredArtifactSetSha256 === CONFIG.input.algorithm32AcquisitionArtifactSetSha256, 'The ledger traces to the pinned direct Algorithm32 acquisition run.');
	check(ledger.spherical.atmosphereSetupCount === 1, 'The spherical atmosphere was initialized once for the complete exact-time acquisition.');
	check(records.length === 4 && new Set(records.map((record) => record.key)).size === 4, 'Exactly four distinct contextual-review conditions are recorded.');
	check(records.every((record) => record.transportedDirectSpectralRadiance.values.length === 15 && record.directSpectralIrradiance.values.length === 15), 'Every condition retains native-15 radiance and irradiance spectra.');
	check(records.every((record) => record.transportedDirectSpectralRadiance.values.every((value) => Number.isFinite(value) && value >= 0) && record.directSpectralIrradiance.values.every((value) => Number.isFinite(value) && value >= 0)), 'Every retained spectral value is finite and nonnegative.');
	check(records.every((record) => Number.isFinite(record.photopicDirectIlluminance.value) && record.photopicDirectIlluminance.value > 0 && Number.isFinite(record.adaptingLuminanceProxy.value) && record.adaptingLuminanceProxy.value > 0), 'Every condition has finite positive E_v and L_A.');
	check(records.every((record) => within(record.adaptingLuminanceProxy.value, record.photopicDirectIlluminance.value / Math.PI, CONFIG.tolerances)), 'Every L_A equals E_v / pi with the inactive floor.');
	check(records.every((record) => record.geometry.visibleFraction > 0 && record.geometry.visibleFraction <= 1), 'The solar disk has positive bounded visible support in all four conditions.');
	const byKey = new Map(records.map((record) => [record.key, record]));
	check(byKey.get('spherical-distant/noon').photopicDirectIlluminance.value > byKey.get('spherical-distant/sunset-minus-30').photopicDirectIlluminance.value && byKey.get('spherical-distant/sunset-minus-30').photopicDirectIlluminance.value > byKey.get('spherical-distant/sunset-minus-10').photopicDirectIlluminance.value && byKey.get('spherical-distant/sunset-minus-10').photopicDirectIlluminance.value > byKey.get('spherical-distant/sunset').photopicDirectIlluminance.value, 'Direct photopic illuminance decreases strictly from noon through exact sunset.');
	return assertions;
}

function longCsv(records, basis) {
	const rows = [['condition_key', 'time_iso', 'wavelength_center_nm', 'wavelength_width_nm', 'radiance_W_m-2_sr-1_nm-1', 'irradiance_W_m-2_nm-1', 'visible_fraction', 'visible_solid_angle_sr', 'Ev_lux', 'LA_cd_m-2']];
	for (const record of records) for (let index = 0; index < basis.channels.length; index += 1) rows.push([record.key, record.timeIso, basis.channels[index].center.value, basis.channels[index].width.value, record.transportedDirectSpectralRadiance.values[index], record.directSpectralIrradiance.values[index], record.geometry.visibleFraction, record.geometry.visibleProjectedSolidAngleSteradians, record.photopicDirectIlluminance.value, record.adaptingLuminanceProxy.value]);
	return `${rows.map((row) => row.join(',')).join('\n')}\n`;
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'spectral-color-local-light-record',
		command: COMMAND,
		inputs: { fixture: 'experiments/extraterrestrial/fixtures/spectral-color-local-light-record-v1.json', sourceRunId: CONFIG.input.runId, conditions: CONFIG.conditions },
		provenance: { transport: 'direct GPU Algorithm32 acquisition retained by accepted Stage 1 ledger', derivation: 'analytic visible disk support; E_lambda = L_lambda * Omega_visible; CIE 1931 photopic E_v; L_A = E_v / pi' },
		environment: { node: process.version, platform: process.platform },
		references: { plan: 'agents/topics/extraterrestrial/spectral-color-transform-experiment-plan.md#revised-reasonable-normal-global-plan' },
	});
	try {
		await assertRepositoryIdentity();
		const policy = await loadContainmentPolicy();
		const before = await createProtectedTrackedInventory(policy);
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment tree');
		const [{ ledger, manifest }, cieText] = await Promise.all([loadLedger(), readFile(CIE_PATH, 'utf8')]);
		const cieRows = parseCie1931(cieText);
		const records = CONFIG.conditions.map((condition) => makeRecord(ledger, condition, cieRows));
		const assertions = analyze(ledger, records);
		const evidence = {
			schemaId: 'spectral-color-local-light-record-v1',
			source: { postVerificationRunId: manifest.runId, artifactSetSha256: manifest.artifactSetSha256, ledgerSha256: CONFIG.input.ledgerSha256, algorithm32AcquisitionRunId: ledger.acquisition.recoveredRunId, algorithm32AcquisitionArtifactSetSha256: ledger.acquisition.recoveredArtifactSetSha256 },
			identity: { spectralBasis: ledger.spectralBasis, sourceHash: ledger.spherical.sourceHash, atmospherePhysicalProfileHash: ledger.spherical.physicalProfileHash, shaderSourceHash: ledger.spherical.shaderSourceHash, profileHash: ledger.profileHash },
			reuseContract: 'Consume the matching exact-time record for Color iteration; do not rerun Algorithm32 merely to rederive local light and do not substitute a neighboring condition.',
			records,
		};
		await run.writeJsonArtifact('evidence/local-light-record.json', evidence);
		await run.writeArtifact('evidence/local-light-record.csv', longCsv(records, ledger.spectralBasis));
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-spectral-color-local-light-record.js', 'color/NormalColorTransform.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await createProtectedTrackedInventory(policy);
		assertFileInventoriesEqual(before, after, 'Local-light protected inventory');
		const proof = { proofId: 'spectral-color-local-light-record-v1', accepted: true, assertions, summary: { conditionCount: records.length, conditionKeys: records.map((record) => record.key), illuminanceLux: Object.fromEntries(records.map((record) => [record.key, record.photopicDirectIlluminance.value])), adaptingLuminanceCdPerSquareMeter: Object.fromEntries(records.map((record) => [record.key, record.adaptingLuminanceProxy.value])), visibleFraction: Object.fromEntries(records.map((record) => [record.key, record.geometry.visibleFraction])) }, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/local-light-proof.json', proof);
		const finalManifest = await run.finalize({ conclusion: 'accepted', result: proof, report: `# ${run.runId}: Exact-time local-light record\n\nConclusion: **accepted**.\n\nThe four reusable local-light states were materialized from the manifest-verified Stage 1 ledger, which traces to direct Algorithm32 acquisition run ${ledger.acquisition.recoveredRunId}. Algorithm32 was not rerun because the exact-time physical measurements already exist.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, summary: proof.summary }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { await run.writeJsonArtifact('evidence/failure.json', detail); const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Exact-time local-light record\n\nConclusion: **failed**.\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
