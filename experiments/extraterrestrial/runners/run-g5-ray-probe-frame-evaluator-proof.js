#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { CelestialFrameEvaluator } from '../candidate/src/algorithm32/caches/celestial/CelestialFrameEvaluator.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';
const COMMAND = 'node experiments/extraterrestrial/runners/run-g5-ray-probe-frame-evaluator-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'g5-ray-probe-frame-evaluator-v1.json');
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const zero = (count) => new Float64Array(count);
async function rejected(operation) { try { await operation(); } catch { return true; } return false; }
function packet(values, provenance) { return createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values, provenanceIdentity: provenance }); }
function report(runId, proof) { return `# ${runId}: G5 ray-probe frame evaluator proof\n\nConclusion: **accepted**\n\n- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.\n- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.\n\nThis proof establishes only internal CPU ray-probe celestial evaluation and one-time spectral composition.\n`; }
async function main() {
	const run = await initializeRunRecord({ slug: 'g5-ray-probe-frame-evaluator-proof', command: COMMAND, inputs: { schemaId: 'g5-ray-probe-proof-inputs-v1', fixture: 'experiments/extraterrestrial/fixtures/g5-ray-probe-frame-evaluator-v1.json' }, provenance: { schemaId: 'g5-ray-probe-proof-provenance-v1', repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' }, environment: { schemaId: 'g5-ray-probe-proof-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, references: { schemaId: 'g5-ray-probe-proof-references-v1', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	try {
		const policy = await assertContainmentPreconditions(); const before = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'G5 fixture'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const evaluator = new CelestialFrameEvaluator({ spectralBasis: NATIVE_15_SPECTRAL_BASIS });
		const sunCache = { queryGeometrySun(_query, direction) { return direction[0] > 0 ? { classification: 'clear', values: Float64Array.from(fixture.sunRadiance) } : { classification: 'out-of-support', values: zero(15) }; } };
		const starCache = { queryMember(memberId) { if (memberId !== 'star-alpha') throw new RangeError('unknown'); return { classification: 'clear', values: Float64Array.from(fixture.starIrradiance) }; } };
		const pathRadiance = packet(fixture.pathRadiance, 'g5-path'); const geometryQueryPacket = { queryStateFingerprint: 'g5-ray-probe-query-v1', receiverPositionModelMeters: [0, 0, 6361000] };
		const result = evaluator.evaluate({ pathRadiance, geometryQueryPacket, rayProbe: { pixelSolidAngleSteradians: fixture.pixelSolidAngleSteradians, sunSamples: fixture.sunSamples, pointSamples: fixture.pointSamples }, sunCache, starCache });
		const assertions = []; const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const expectedCelestial = fixture.sunRadiance.map((value, index) => value * 0.5 + fixture.starIrradiance[index] * 0.5);
		assert(result.celestialRadiance.values.every((value, index) => value === expectedCelestial[index]), 'Only visible, in-support ray-probe samples contribute Sun-disk and point celestial radiance.');
		assert(result.pathRadiance === pathRadiance && result.pathRadiance.values.every((value, index) => value === fixture.pathRadiance[index]), 'Path radiance is retained unchanged.');
		assert(result.preDisplayRadiance.values.every((value, index) => value === fixture.pathRadiance[index] + expectedCelestial[index]), 'Pre-display radiance adds celestial radiance exactly once.');
		assert(result.celestialRadiance.quantity === SPECTRAL_QUANTITIES.RADIANCE_DENSITY && result.preDisplayRadiance.quantity === SPECTRAL_QUANTITIES.RADIANCE_DENSITY, 'Celestial and pre-display packets retain spectral radiance units.');
		assert(await rejected(() => evaluator.evaluate({ pathRadiance, geometryQueryPacket, rayProbe: { pixelSolidAngleSteradians: 1, sunSamples: [{ ...fixture.sunSamples[0], weight: 0.2 }], pointSamples: [] }, sunCache, starCache })), 'Unnormalized Sun probe weights reject.');
		assert(await rejected(() => evaluator.evaluate({ pathRadiance, geometryQueryPacket, rayProbe: { pixelSolidAngleSteradians: 0, sunSamples: [], pointSamples: [] }, sunCache, starCache })), 'Zero pixel solid angle rejects.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g5-ray-probe-frame-evaluator-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await verifyProtectedTrackedInventory(before, policy); const proof = { proofId: 'g5-ray-probe-frame-evaluator-v1', accepted: true, assertions, negativeControls: [{ id: 1, rejected: true }, { id: 2, rejected: true }], containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/g5-ray-probe-proof.json', proof); await run.writeJsonArtifact('evidence/g5-fixture.json', fixture); await run.writeJsonArtifact('evidence/g5-source.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}` }); const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, accepted: true, assertionCount: assertions.length, negativeControlCount: 2 }, report: report(run.runId, proof) }); process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) { const serialized = { name: error.name, message: error.message, stack: error.stack }; try { await run.writeJsonArtifact('evidence/failure.json', serialized); const manifest = await run.finalize({ conclusion: 'failed', result: { accepted: false, error: serialized }, report: `# ${run.runId}: G5 proof\n\nConclusion: **failed**\n\n${serialized.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: serialized }, null, 2)}\n`); } catch {} process.exitCode = 1; }
}
await main();
