#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CanonicalAtmosphere } from '../candidate/src/algorithm32/atmospheres/CanonicalAtmosphere.js';
import { CpuSunDiskRadianceCache } from '../candidate/src/algorithm32/caches/celestial/CpuSunDiskRadianceCache.js';
import { CANONICAL_ATMOSPHERE_CONSTANTS } from '../candidate/src/algorithm32/constants/Algorithm32CanonicalData.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { DistantSunLightSource } from '../candidate/src/algorithm32/light-sources/DistantSunLightSource.js';
import { NATIVE_15_SPECTRAL_BASIS } from '../candidate/src/algorithm32/profiles/native-15-profile.js';
import { SPECTRAL_QUANTITIES, SPECTRAL_UNITS, createSpectralPacket } from '../candidate/src/algorithm32/quantities/index.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-g4-cpu-sun-disk-transport-proof.js';
const FIXTURE_PATH = path.join(EXPERIMENT_ROOT, 'fixtures', 'g4-cpu-sun-disk-transport-v1.json');

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function zero(count) { return new Float64Array(count); }
function maxRelativeError(actual, expected) { return Math.max(...actual.map((value, index) => { const absolute = Math.abs(value - expected[index]); return absolute <= 1e-22 ? 0 : absolute / Math.max(Math.abs(expected[index]), 1e-22); })); }
function maxNormalizedError(actual, expected, relativeBound, absoluteBound) { return Math.max(...actual.map((value, index) => Math.abs(value - expected[index]) / Math.max(absoluteBound, relativeBound * Math.abs(expected[index])))); }

function directionForCoordinate(geometry, h, u) {
	const domain = geometry.describeCelestialContributionDomain();
	const radius = domain.groundRadiusMeters + h;
	const muHorizon = -Math.sqrt(Math.max(0, 1 - (domain.groundRadiusMeters / radius) ** 2));
	const mu = muHorizon + u * (1 - muHorizon);
	return [Math.sqrt(Math.max(0, 1 - mu * mu)), 0, mu];
}
function receiverForAltitude(geometry, h) { const domain = geometry.describeCelestialContributionDomain(); return [0, 0, domain.groundRadiusMeters + h]; }
function placement(state, fixture) { return { sourceId: fixture.sourceId, direction: state.sunDirection, frameId: state.observationState.celestialFrameId, originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', epoch: state.observationState.epoch, placementProviderContractFingerprint: 'sha256:g4-provider-v1', placementStateFingerprint: `sha256:g4-${state.stateId}-v1` }; }
function diskSolidAngle(radius) { return 2 * Math.PI * (1 - Math.cos(radius)); }
function independentDirect(geometry, atmosphere, sourceRadiance, receiver, direction) {
	const stencil = geometry.resolveCelestialDirectionStencil(receiver, direction);
	if (stencil.classification !== 'clear') return zero(sourceRadiance.length);
	const sample = geometry.resolveCelestialBuildSample({ h: stencil.h, u: stencil.u }, { sourceId: 'independent-direct' });
	const transmittance = atmosphere.integrateOpticalDepth(sample.atmospherePath).transmittance.values;
	return Float64Array.from(sourceRadiance, (value, index) => value * transmittance[index]);
}
async function expectRejection(operation, label) { try { await operation(); } catch { return true; } throw new Error(`${label} was not rejected.`); }
function report(runId, proof) {
	return [`# ${runId}: G4 CPU shared-Sun disk transport proof`, '', 'Conclusion: **accepted**', '', `- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`, `- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`, `- Predeclared maximum relative interpolation bound: ${proof.relativeInterpolationBound}.`, `- Observed maximum normalized interpolation error: ${proof.observedMaximumNormalizedInterpolationError}.`, '', 'This proof establishes camera-independent transported Sun-disk radiance derived from the existing atmospheric Sun only. It does not render or compose a disk, introduce another Sun owner, apply scene visibility, use shaders, or use GPU resources.', ''].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The G4 CPU Sun-disk transport proof accepts no command-line arguments.');
	const run = await initializeRunRecord({ slug: 'g4-cpu-sun-disk-transport-proof', command: COMMAND, inputs: { schemaId: 'g4-cpu-sun-proof-inputs-v1', fixture: 'experiments/extraterrestrial/fixtures/g4-cpu-sun-disk-transport-v1.json' }, provenance: { schemaId: 'g4-cpu-sun-proof-provenance-v1', repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' }, environment: { schemaId: 'g4-cpu-sun-proof-environment-v1', node: process.version, platform: process.platform, architecture: process.arch, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, references: { schemaId: 'g4-cpu-sun-proof-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' } });
	try {
		const policy = await assertContainmentPreconditions();
		const protectedBefore = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, FIXTURE_PATH, 'G4 fixture'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const fixture = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'));
		const geometry = new SphericalEarthGeometry(fixture.geometry);
		const atmosphere = new CanonicalAtmosphere({ constants: CANONICAL_ATMOSPHERE_CONSTANTS, spectralBasis: NATIVE_15_SPECTRAL_BASIS });
		const sourceIrradiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: fixture.sourceIrradianceValues, provenanceIdentity: 'g4-synthetic:shared-atmospheric-sun' });
		const atmosphericSun = new DistantSunLightSource({ directionToLight: [1, 0, 0], sourceIrradiance, angularRadius: { value: fixture.angularRadiusRadians, units: 'radians' } });
		const cache = new CpuSunDiskRadianceCache({ geometry, atmosphere, sourceId: fixture.sourceId, atmosphericSun });
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const sourceRadiance = Float64Array.from(fixture.sourceIrradianceValues, (value) => value / diskSolidAngle(fixture.angularRadiusRadians));
		assert(cache.sourceRadiance.values.every((value, index) => Math.abs(value - sourceRadiance[index]) <= 1e-22), 'The cache derives uniform disk radiance from the existing atmospheric Sun irradiance and angular radius.');
		const domain = geometry.describeCelestialContributionDomain();
		let exactMaximum = 0;
		let worstExact = null;
		for (const h of domain.altitudeNodesMeters) for (const u of domain.uNodes) {
			const receiver = receiverForAltitude(geometry, h);
			const direction = directionForCoordinate(geometry, h, u);
			const cached = cache.query(receiver, direction, direction).values;
			const direct = independentDirect(geometry, atmosphere, sourceRadiance, receiver, direction);
			const exactError = maxRelativeError(cached, direct);
			if (exactError > exactMaximum) { exactMaximum = exactError; worstExact = { h, u, maximumCachedValue: Math.max(...cached), maximumDirectValue: Math.max(...direct) }; }
		}
		assert(exactMaximum <= 1e-12, `Every exact \`(h, u)\` node matches independent binary64 direct Sun-disk transport (observed relative ${exactMaximum}; worst ${JSON.stringify(worstExact)}).`);
		let interpolationMaximum = 0;
		for (const probe of fixture.offNodeProbes) {
			const receiver = receiverForAltitude(geometry, probe.h);
			const direction = directionForCoordinate(geometry, probe.h, probe.u);
			interpolationMaximum = Math.max(interpolationMaximum, maxNormalizedError(cache.query(receiver, direction, direction).values, independentDirect(geometry, atmosphere, sourceRadiance, receiver, direction), fixture.relativeInterpolationBound, fixture.absoluteInterpolationBound));
		}
		assert(interpolationMaximum <= 1, `Stratified off-node probes meet the predeclared mixed interpolation bound (observed normalized ${interpolationMaximum}).`);
		const queries = fixture.states.map((state) => geometry.prepareCelestialContributionQuery(fixture.generationDescriptor, fixture.sourceDefinitions, [placement(state, fixture)], state.observationState));
		const [full, partial, empty] = queries;
		const fullResult = cache.queryGeometrySun(full, full.layerQueries.sun.directionToSourceModel);
		const partialResult = cache.queryGeometrySun(partial, partial.layerQueries.sun.directionToSourceModel);
		const emptyResult = cache.queryGeometrySun(empty, empty.layerQueries.sun.directionToSourceModel);
		assert(fullResult.support.classification === 'full' && fullResult.classification === 'clear' && partialResult.support.classification === 'partial' && partialResult.classification === 'clear' && emptyResult.support.classification === 'empty' && emptyResult.classification === 'empty-support', 'Geometry-owned full, partial horizon-crossing, and empty Sun support all use the same shared atmospheric Sun.');
		const partialBelowHorizon = cache.queryGeometrySun(partial, [-0.11, Math.sqrt(1 - 0.11 ** 2), 0]);
		const outsideSupport = cache.queryGeometrySun(full, [Math.cos(0.06), Math.sin(0.06), 0]);
		assert(partialBelowHorizon.classification === 'ground-horizon' && partialBelowHorizon.values.every((value) => value === 0) && outsideSupport.classification === 'out-of-support' && outsideSupport.values.every((value) => value === 0), 'Ground-blocked and out-of-disk directions return exact zero before interpolation.');
		const changedIrradiance = createSpectralPacket({ basis: NATIVE_15_SPECTRAL_BASIS, quantity: SPECTRAL_QUANTITIES.IRRADIANCE_DENSITY, units: SPECTRAL_UNITS.IRRADIANCE_DENSITY, values: fixture.sourceIrradianceValues.map((value) => value * 1.01), provenanceIdentity: 'g4-synthetic:shared-atmospheric-sun-changed' });
		const changedSun = new DistantSunLightSource({ directionToLight: [1, 0, 0], sourceIrradiance: changedIrradiance, angularRadius: { value: fixture.angularRadiusRadians, units: 'radians' } });
		const changedCache = new CpuSunDiskRadianceCache({ geometry, atmosphere, sourceId: fixture.sourceId, atmosphericSun: changedSun });
		assert(changedCache.fieldIdentity !== cache.fieldIdentity && cache.fieldIdentity === cache.fieldIdentity, 'Shared Sun radiometry changes the field identity while live placement and camera state do not.');
		const negativeControls = [await expectRejection(() => cache.queryGeometrySun({ layerQueries: { sun: { ...full.layerQueries.sun, sourceId: 'another-sun' } } }, full.layerQueries.sun.directionToSourceModel), 'Second Sun source'), await expectRejection(() => cache.queryGeometrySun({ layerQueries: { sun: { ...full.layerQueries.sun, angularSupport: { ...full.layerQueries.sun.angularSupport, angularRadiusRadians: 0.04 } } } }, full.layerQueries.sun.directionToSourceModel), 'Mismatched Sun support')];
		requireCondition(negativeControls.every(Boolean), 'One or more G4 negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-g4-cpu-sun-disk-transport-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		requireCondition(closure.files.every((file) => !file.startsWith('../') && !file.includes('/baseline/')), 'G4 runner closure escaped the experiment candidate surface.');
		const protectedAfter = await verifyProtectedTrackedInventory(protectedBefore, policy);
		const proof = { proofId: 'g4-cpu-sun-disk-transport-v1', accepted: true, assertions, negativeControls: negativeControls.map((rejected, index) => ({ id: index + 1, rejected })), exactMaximumRelativeError: exactMaximum, observedMaximumNormalizedInterpolationError: interpolationMaximum, relativeInterpolationBound: fixture.relativeInterpolationBound, absoluteInterpolationBound: fixture.absoluteInterpolationBound, fieldIdentity: cache.fieldIdentity, sourceRadianceHash: cache.sourceRadiance.contentHash, containment: { protectedFiles: protectedAfter.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/g4-cpu-sun-proof.json', proof);
		await run.writeJsonArtifact('evidence/g4-fixture.json', fixture);
		await run.writeJsonArtifact('evidence/g4-shared-sun-identity.json', { fixtureSha256: `sha256:${await sha256File(FIXTURE_PATH)}`, atmosphericSun: atmosphericSun.describe(), sourceRadianceHash: cache.sourceRadiance.contentHash });
		const terminalManifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, accepted: true, assertionCount: assertions.length, negativeControlCount: negativeControls.length, exactMaximumRelativeError: exactMaximum, interpolationMaximumNormalizedError: interpolationMaximum, relativeInterpolationBound: fixture.relativeInterpolationBound, absoluteInterpolationBound: fixture.absoluteInterpolationBound }, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: terminalManifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try { await run.writeJsonArtifact('evidence/failure.json', serialized); const terminalManifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'g4-cpu-sun-disk-transport-v1', accepted: false, error: serialized }, report: `# ${run.runId}: G4 CPU shared-Sun disk transport proof\n\nConclusion: **failed**\n\n${serialized.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: terminalManifest.artifactSetSha256, error: serialized }, null, 2)}\n`); } catch (finalizationError) { process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'partial-unfinalized', error: serialized, finalizationError: String(finalizationError) }, null, 2)}\n`); }
		process.exitCode = 1;
	}
}

await main();
