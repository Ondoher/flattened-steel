#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { BRIGHT_STAR_CATALOG_V50, parseBrightStarCatalogV50, selectBrightestBrightStarCatalogMembers } from '../catalogs/bright-star-catalog-v50.js';
import { loadPicklesV1998, loadSvoJohnsonFilter } from '../catalogs/stellar-photometry-inputs.js';
import { StellarCelestialSource } from '../candidate/src/algorithm32/caches/celestial/StellarCelestialSource.js';
import { StellarSpectralPhotometry } from '../candidate/src/algorithm32/caches/celestial/StellarSpectralPhotometry.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-stellar-photometry-b-band-reconstruction-experiment.js';
const SPEED_OF_LIGHT_METERS_PER_SECOND = 299792458;
const paths = Object.freeze({
	catalog: path.join(EXPERIMENT_ROOT, 'catalogs', 'bright-star-catalog-v50.tsv'),
	templates: path.join(EXPERIMENT_ROOT, 'catalogs', 'pickles-v1998', 'dat.tar.gz'),
	b: path.join(EXPERIMENT_ROOT, 'catalogs', 'svo-johnson', 'generic-johnson-b.xml'),
	v: path.join(EXPERIMENT_ROOT, 'catalogs', 'svo-johnson', 'generic-johnson-v.xml'),
});

function requireCondition(value, message) { if (!value) throw new Error(message); }

function responseAt(filter, wavelengthNanometers) {
	let upper = 1;
	while (upper < filter.wavelengthNanometers.length && filter.wavelengthNanometers[upper] < wavelengthNanometers) upper += 1;
	if (upper === filter.wavelengthNanometers.length) return filter.transmission.at(-1);
	const lower = upper - 1;
	const fraction = (wavelengthNanometers - filter.wavelengthNanometers[lower]) / (filter.wavelengthNanometers[upper] - filter.wavelengthNanometers[lower]);
	return filter.transmission[lower] + (filter.transmission[upper] - filter.transmission[lower]) * fraction;
}

/** Independently integrate the published native bins with the energy-counter filter response. */
function bandMagnitude(packet, filter) {
	let weightedFlux = 0;
	let responseWeight = 0;
	for (let channelIndex = 0; channelIndex < NATIVE_15_SPECTRAL_BASIS.channels.length; channelIndex += 1) {
		const channel = NATIVE_15_SPECTRAL_BASIS.channels[channelIndex];
		const lower = channel.center.value - channel.width.value / 2;
		const upper = channel.center.value + channel.width.value / 2;
		for (let filterIndex = 1; filterIndex < filter.wavelengthNanometers.length; filterIndex += 1) {
			const a = Math.max(lower, filter.wavelengthNanometers[filterIndex - 1]);
			const b = Math.min(upper, filter.wavelengthNanometers[filterIndex]);
			if (b <= a) continue;
			const responseIntegral = (responseAt(filter, a) + responseAt(filter, b)) * (b - a) / 2;
			weightedFlux += packet.values[channelIndex] * responseIntegral;
			responseWeight += responseIntegral;
		}
	}
	const zeroPointFluxDensity = filter.zeroPointJy * 1e-26 * SPEED_OF_LIGHT_METERS_PER_SECOND / (filter.pivotWavelengthNanometers * 1e-9) ** 2 * 1e-9;
	return -2.5 * Math.log10(weightedFlux / responseWeight / zeroPointFluxDensity);
}

function percentile(sortedValues, fraction) {
	if (sortedValues.length === 0) throw new RangeError('Cannot calculate a percentile of no values.');
	const coordinate = (sortedValues.length - 1) * fraction;
	const lower = Math.floor(coordinate);
	const upper = Math.ceil(coordinate);
	return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (coordinate - lower);
}

function summarize(residuals) {
	const signed = residuals.map((item) => item.residualMagnitude).sort((left, right) => left - right);
	const absolute = residuals.map((item) => Math.abs(item.residualMagnitude)).sort((left, right) => left - right);
	return Object.freeze({
		count: residuals.length,
		meanSignedMagnitude: residuals.reduce((sum, item) => sum + item.residualMagnitude, 0) / residuals.length,
		medianSignedMagnitude: percentile(signed, 0.5),
		medianAbsoluteMagnitude: percentile(absolute, 0.5),
		p90AbsoluteMagnitude: percentile(absolute, 0.9),
		p95AbsoluteMagnitude: percentile(absolute, 0.95),
		maximumAbsoluteMagnitude: absolute.at(-1),
	});
}

async function main() {
	const run = await initializeRunRecord({
		slug: 'stellar-photometry-b-band-reconstruction-experiment',
		command: COMMAND,
		inputs: {
			question: 'Do V-scaled, B-minus-V-selected native-15 stellar packets independently reconstruct catalog Johnson B magnitudes?',
			catalog: 'BSC V/50 selected 500-member roster',
			photometry: 'Pickles V1998 shapes; SVO Generic/Johnson B and V Vega/Pogson energy-counter responses',
			acceptancePolicy: 'The bracketed two-band policy must reconstruct both catalog B and V magnitudes within binary64 numerical precision.',
		},
		provenance: { experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { node: process.version, platform: process.platform },
		references: { canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all(Object.entries(paths).map(([key, value]) => assertExistingRealPathContained(EXPERIMENT_ROOT, value, `B-band experiment ${key}`)));
		await assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree');
		const hashes = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, value]) => [key, `sha256:${await sha256File(value)}`])));
		const members = selectBrightestBrightStarCatalogMembers(parseBrightStarCatalogV50(await readFile(paths.catalog, 'utf8')));
		const [templates, johnsonB, johnsonV] = await Promise.all([loadPicklesV1998(paths.templates), loadSvoJohnsonFilter(paths.b), loadSvoJohnsonFilter(paths.v)]);
		const photometry = new StellarSpectralPhotometry({ templates, johnsonB, johnsonV, inputIdentity: hashes });
		const source = new StellarCelestialSource({ catalog: BRIGHT_STAR_CATALOG_V50, members, stellarSpectralPhotometry: photometry });
		const packets = source.createTransportMembers();
		const residuals = packets.map((entry, index) => {
			const member = members[index];
			const targetBMagnitude = member.visualMagnitude + member.bMinusV;
			const reconstructedBMagnitude = bandMagnitude(entry.sourceIrradiance, johnsonB);
			const reconstructedVMagnitude = bandMagnitude(entry.sourceIrradiance, johnsonV);
			return Object.freeze({ memberId: member.memberId, hr: member.hr, spectralType: member.spectralType, templateId: entry.templateId, templateSelection: entry.templateSelection, visualMagnitude: member.visualMagnitude, bMinusV: member.bMinusV, targetBMagnitude, reconstructedBMagnitude, reconstructedVMagnitude, residualMagnitude: reconstructedBMagnitude - targetBMagnitude, vResidualMagnitude: reconstructedVMagnitude - member.visualMagnitude });
		});
		requireCondition(residuals.length === 500 && residuals.every((item) => Number.isFinite(item.residualMagnitude) && Number.isFinite(item.vResidualMagnitude)), 'All 500 materialized packets must yield finite independent B and V reconstructions.');
		requireCondition(Math.max(...residuals.map((item) => Math.abs(item.vResidualMagnitude))) <= 1e-10, 'Independent V reconstruction must retain the existing exact V-band calibration.');
		requireCondition(Math.max(...residuals.map((item) => Math.abs(item.residualMagnitude))) <= 1e-10, 'Independent B reconstruction must satisfy the catalog B = V + (B-V) constraint.');
		const summary = summarize(residuals);
		const bySelection = Object.fromEntries([...new Set(residuals.map((item) => item.templateSelection))].sort().map((selection) => [selection, summarize(residuals.filter((item) => item.templateSelection === selection))]));
		const worst = [...residuals].sort((left, right) => Math.abs(right.residualMagnitude) - Math.abs(left.residualMagnitude)).slice(0, 25);
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-stellar-photometry-b-band-reconstruction-experiment.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util', 'node:zlib'] });
		const after = await verifyProtectedTrackedInventory(before, policy);
		const result = { experimentId: 'stellar-photometry-b-band-reconstruction-v1', inputHashes: hashes, zeroPointConvention: { b: { filterId: johnsonB.id, detectorType: 'energy-counter', magnitudeSystem: 'Vega/Pogson', zeroPointJy: johnsonB.zeroPointJy, pivotWavelengthNanometers: johnsonB.pivotWavelengthNanometers }, v: { filterId: johnsonV.id, detectorType: 'energy-counter', magnitudeSystem: 'Vega/Pogson', zeroPointJy: johnsonV.zeroPointJy, pivotWavelengthNanometers: johnsonV.pivotWavelengthNanometers } }, summary, bySelection, worstResiduals: worst, containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/b-band-reconstruction.json', { ...result, residuals });
		const manifest = await run.finalize({ conclusion: 'accepted', result, report: `# ${run.runId}: Stellar B-band reconstruction experiment\n\nConclusion: **accepted**\n\nThe bracketed Pickles policy reconstructs both catalog B and V magnitudes within binary64 numerical precision.\n` });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', summary, artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const detail = { name: error.name, message: error.message, stack: error.stack };
		try { const manifest = await run.finalize({ conclusion: 'failed', result: { error: detail }, report: `# ${run.runId}: Stellar B-band reconstruction experiment\n\nConclusion: **failed**\n\n${detail.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', error: detail, artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
