#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { CpuStarPointSetCache } from '../candidate/src/algorithm32/caches/celestial/CpuStarPointSetCache.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g3-cpu-star-transport-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'g3-cpu-star-transport-v1.json');

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function zero(count) { return new Float64Array(count); }
function maxRelativeError(actual, expected) {
	return Math.max(...actual.map((value, index) => {
		const absolute = Math.abs(value - expected[index]);
		return absolute <= 1e-22 ? 0 : absolute / Math.max(Math.abs(expected[index]), 1e-22);
	}));
}
function maxNormalizedInterpolationError(actual, expected, relativeBound, absoluteBound) {
	return Math.max(...actual.map((value, index) => Math.abs(value - expected[index]) / Math.max(absoluteBound, relativeBound * Math.abs(expected[index]))));
}

function directionForCoordinate(geometry, h, u) {
	const domain = geometry.describeCelestialContributionDomain();
	const radius = domain.groundRadiusMeters + h;
	const muHorizon = -Math.sqrt(Math.max(0, 1 - (domain.groundRadiusMeters / radius) ** 2));
	const mu = muHorizon + u * (1 - muHorizon);
	return [Math.sqrt(Math.max(0, 1 - mu * mu)), 0, mu];
}

function receiverForAltitude(geometry, h) {
	const domain = geometry.describeCelestialContributionDomain();
	return [0, 0, domain.groundRadiusMeters + h];
}

function independentDirect(geometry, atmosphere, sourceValues, receiver, direction) {
	const stencil = geometry.resolveCelestialDirectionStencil(receiver, direction);
	if (stencil.classification !== 'clear') return zero(sourceValues.length);
	const sample = geometry.resolveCelestialBuildSample({ h: stencil.h, u: stencil.u }, { sourceId: 'independent-direct' });
	const transmittance = atmosphere.integrateOpticalDepth(sample.atmospherePath).transmittance.values;
	return Float64Array.from(sourceValues, (value, index) => value * transmittance[index]);
}

function report(runId, proof) {
	return [
		`# ${runId}: G3 CPU star transport proof`, '', 'Conclusion: **accepted**', '',
		`- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`,
		`- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`,
		`- Predeclared maximum relative interpolation bound: ${proof.relativeInterpolationBound}.`,
		`- Observed maximum normalized interpolation error: ${proof.observedMaximumNormalizedInterpolationError}.`, '',
		'This proof establishes candidate CPU transported star irradiance only. It does not establish Sun transport, rasterization, visibility, shader, or GPU behavior.', '',
	].join('\n');
}

async function expectRejection(operation, label) { try { await operation(); } catch { return true; } throw new Error(`${label} was not rejected.`); }

async function main() {
	if (process.argv.length !== 2) throw new Error('The G3 CPU transport proof accepts no command-line arguments.');
	const run = await initializeRunRecord({
		slug: 'g3-cpu-star-transport-proof', command: COMMAND,
		inputs: { schemaId: 'g3-cpu-star-proof-inputs-v1', fixture: 'experiments/extraterrestrial/fixtures/g3-cpu-star-transport-v1.json' },
		provenance: { schemaId: 'g3-cpu-star-proof-provenance-v1', repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { schemaId: 'g3-cpu-star-proof-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
		references: { schemaId: 'g3-cpu-star-proof-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'G3 fixture'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const geometry = new SphericalEarthGeometry(fixture.geometry);
		const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
		const members = fixture.members.map((member) => ({ memberId: member.memberId, sourceIrradiance: createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: member.values, provenanceIdentity: `g3-synthetic:${member.memberId}` }) }));
		const cache = new CpuStarPointSetCache({ geometry, atmosphere, members });
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const domain = geometry.describeCelestialContributionDomain();
		let exactMaximum = 0;
		for (const h of domain.altitudeNodesMeters) for (const u of domain.uNodes) {
			const receiver = receiverForAltitude(geometry, h);
			const direction = directionForCoordinate(geometry, h, u);
			for (const member of members) {
				const cached = cache.queryMember(member.memberId, receiver, direction).values;
				const direct = independentDirect(geometry, atmosphere, member.sourceIrradiance.values, receiver, direction);
				exactMaximum = Math.max(exactMaximum, maxRelativeError(cached, direct));
			}
		}
		assert(exactMaximum <= 1e-12, 'Every exact `(h, u)` node matches independent binary64 direct transport.');
		let interpolationMaximum = 0;
		let worstInterpolation = null;
		for (const probe of fixture.offNodeProbes) {
			const receiver = receiverForAltitude(geometry, probe.h);
			const direction = directionForCoordinate(geometry, probe.h, probe.u);
			for (const member of members) {
				const cached = cache.queryMember(member.memberId, receiver, direction).values;
				const direct = independentDirect(geometry, atmosphere, member.sourceIrradiance.values, receiver, direction);
				const relativeError = maxNormalizedInterpolationError(cached, direct, fixture.relativeInterpolationBound, fixture.absoluteInterpolationBound);
				if (relativeError > interpolationMaximum) {
					interpolationMaximum = relativeError;
					worstInterpolation = { ...probe, memberId: member.memberId, relativeError, maximumDirectValue: Math.max(...direct), maximumCachedValue: Math.max(...cached) };
				}
			}
		}
		assert(interpolationMaximum <= 1, `Stratified off-node probes meet the predeclared mixed interpolation bound (observed normalized ${interpolationMaximum}; relative ${fixture.relativeInterpolationBound}; absolute ${fixture.absoluteInterpolationBound}; worst ${JSON.stringify(worstInterpolation)}).`);
		const receiver = receiverForAltitude(geometry, 1000);
		const horizon = cache.queryMember('star-alpha', receiver, [0, 0, -1]);
		assert(horizon.classification === 'ground-horizon' && horizon.values.every((value) => value === 0), 'Below-horizon point directions return exact spectral zero without interpolation leakage.');
		const clearDirection = directionForCoordinate(geometry, 1000, 0.75);
		const packet = cache.queryPointSet(receiver, { 'star-alpha': clearDirection, 'star-beta': clearDirection });
		assert(packet.aggregate.every((value, index) => value === packet.members[0].values[index] + packet.members[1].values[index]), 'Aggregate point-set values equal the channel-wise sum of retained members.');
		const changedMembers = members.map((member, index) => index === 0 ? { ...member, sourceIrradiance: createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: member.sourceIrradiance.values.map((value) => value * 1.01), provenanceIdentity: 'g3-synthetic:star-alpha-changed' }) } : member);
		const changed = new CpuStarPointSetCache({ geometry, atmosphere, members: changedMembers });
		assert(changed.fieldIdentity !== cache.fieldIdentity, 'Member radiometry changes the transported-field identity.');
		assert(cache.fieldIdentity === cache.fieldIdentity, 'Placement-only and camera-only state do not enter the transported-field identity.');
		const negativeControls = [
			await expectRejection(() => cache.queryMember('unknown-star', receiver, clearDirection), 'Unknown member'),
			await expectRejection(() => new CpuStarPointSetCache({ geometry, atmosphere, members: [{ memberId: 'bad', sourceIrradiance: createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.RADIANCE_DENSITY, units: SPECTRAL_UNITS.RADIANCE_DENSITY, values: fixture.members[0].values, provenanceIdentity: 'g3-invalid-radiance' }) }] }), 'Radiance used as point irradiance'),
		];
		requireCondition(negativeControls.every(Boolean), 'One or more G3 negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g3-cpu-star-transport-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		requireCondition(closure.files.every((file) => !file.startsWith('../') && !file.includes('/baseline/')), 'G3 runner closure escaped the experiment candidate surface.');
		const protectedAfter = await verifyProtectedTrackedInventory(protectedBefore, policy);
		const proof = { proofId: 'g3-cpu-star-transport-v1', accepted: true, assertions, negativeControls: negativeControls.map((rejected, index) => ({ id: index + 1, rejected })), exactMaximumRelativeError: exactMaximum, observedMaximumNormalizedInterpolationError: interpolationMaximum, relativeInterpolationBound: fixture.relativeInterpolationBound, absoluteInterpolationBound: fixture.absoluteInterpolationBound, fieldIdentity: cache.fieldIdentity, containment: { protectedFiles: protectedAfter.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/g3-cpu-star-proof.json', proof);
		await run.writeJsonArtifact('evidence/g3-fixture.json', fixture);
		await run.writeJsonArtifact('evidence/g3-source-identities.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}`, runner: 'experiments/extraterrestrial/runners/run-g3-cpu-star-transport-proof.js' });
		const terminalManifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, accepted: true, assertionCount: assertions.length, negativeControlCount: negativeControls.length, exactMaximumRelativeError: exactMaximum, interpolationMaximumNormalizedError: interpolationMaximum, relativeInterpolationBound: fixture.relativeInterpolationBound, absoluteInterpolationBound: fixture.absoluteInterpolationBound }, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: terminalManifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try { await run.writeJsonArtifact('evidence/failure.json', serialized); const terminalManifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'g3-cpu-star-transport-v1', accepted: false, error: serialized }, report: `# ${run.runId}: G3 CPU star transport proof\n\nConclusion: **failed**\n\n${serialized.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: terminalManifest.artifactSetSha256, error: serialized }, null, 2)}\n`); } catch (finalizationError) { process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'partial-unfinalized', error: serialized, finalizationError: String(finalizationError) }, null, 2)}\n`); }
		process.exitCode = 1;
	}
}

await main();
