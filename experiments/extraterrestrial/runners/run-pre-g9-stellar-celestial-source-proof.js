#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { BRIGHT_STAR_CATALOG_V50, parseBrightStarCatalogV50, selectBrightestBrightStarCatalogMembers } from '../catalogs/bright-star-catalog-v50.js';
import { CelestialRuntimeParticipant } from '../candidate/src/algorithm32/caches/celestial/CelestialRuntimeParticipant.js';
import { StellarCelestialSource } from '../candidate/src/algorithm32/caches/celestial/StellarCelestialSource.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-pre-g9-stellar-celestial-source-proof.js';
const CATALOG_PATH = path.join(EXPERIMENT_ROOT, 'catalogs', 'bright-star-catalog-v50.tsv');
const ROTATION_PERIOD_SECONDS = 86164.0905;

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function vectorDistance(left, right) { return Math.hypot(...left.map((value, index) => value - right[index])); }
function rotationZ(angle) { const c = Math.cos(angle); const s = Math.sin(angle); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
function canonicalDirection(member) { const c = Math.cos(member.latitudeRadians); return [c * Math.cos(member.longitudeRadians), c * Math.sin(member.longitudeRadians), Math.sin(member.latitudeRadians)]; }
function sunDefinition() { return { sourceId: 'proof-sun', sourceKind: 'extended', placementKind: 'distant-direction', depth: 'infinite', sourceDefinitionFingerprint: 'stellar-source-proof-sun-v1', placementProviderContractFingerprint: 'stellar-source-proof-sun-provider-v1', placementProviderContract: { frameId: 'celestial-rh-v1', originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', timeScale: 'unix-seconds' }, support: { kind: 'uniform-disk', angularRadiusRadians: 0.0047 } }; }
function sunPlacement(epoch) { return { sourceId: 'proof-sun', direction: [0, 0, 1], frameId: 'celestial-rh-v1', originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', epoch, placementProviderContractFingerprint: 'stellar-source-proof-sun-provider-v1', placementStateFingerprint: `stellar-source-proof-sun:${epoch.value}` }; }
async function rejects(operation) { try { await operation(); } catch { return true; } return false; }

function report(runId, proof) {
	return [
		`# ${runId}: Stellar celestial source proof`, '', 'Conclusion: **accepted**', '',
		`- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`,
		`- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`,
		`- Source: ${proof.sourceIdentity.sourceId}; members: ${proof.sourceIdentity.memberCount}.`, '',
		'This proof accepts the catalog-owned definition/placement source boundary only. It does not construct stellar spectra or cache payloads, raster points, or qualify Flat-dome projection.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The stellar celestial source proof accepts no command-line arguments.');
	const run = await initializeRunRecord({
		slug: 'pre-g9-stellar-celestial-source-proof', command: COMMAND,
		inputs: { schemaId: 'stellar-celestial-source-inputs-v1', catalog: 'experiments/extraterrestrial/catalogs/bright-star-catalog-v50.tsv', selectedCount: 500 },
		provenance: { schemaId: 'stellar-celestial-source-provenance-v1', catalog: BRIGHT_STAR_CATALOG_V50, repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { schemaId: 'stellar-celestial-source-environment-v1', node: process.version, platform: process.platform, architecture: process.arch },
		references: { schemaId: 'stellar-celestial-source-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, CATALOG_PATH, 'Bright Star Catalog input'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const catalogSha256 = `sha256:${await sha256File(CATALOG_PATH)}`;
		requireCondition(catalogSha256 === BRIGHT_STAR_CATALOG_V50.sourceSha256, 'Bright Star Catalog source checksum changed.');
		const members = selectBrightestBrightStarCatalogMembers(parseBrightStarCatalogV50(await readFile(CATALOG_PATH, 'utf8')));
		const source = new StellarCelestialSource({ catalog: BRIGHT_STAR_CATALOG_V50, members });
		const participant = new CelestialRuntimeParticipant({ sources: [source] });
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		const identity = source.describeStaticIdentity();
		assert(identity.kind === 'catalog-point-set' && identity.memberCount === 500 && identity.catalogId === BRIGHT_STAR_CATALOG_V50.catalogId, 'StellarCelestialSource owns one 500-member BSC catalog identity.');
		assert(participant.describe().pointSourceIds.join(',') === source.sourceId && participant.describe().cacheSourceIds.length === 0, 'The runtime participant exposes the placement-only stellar source in its explicit point-source slot.');
		assert(typeof source.buildCacheFragments === 'undefined', 'The placement-only stellar source exposes no fabricated cache fragment or radiometry.');
		const epoch = Object.freeze({ value: 0, units: 'seconds', timeScale: 'unix-seconds' });
		const definitions = participant.describePointSourceDefinitions();
		const placements = participant.createPointPlacementStates({ epoch });
		assert(definitions.length === 500 && placements.length === 500 && definitions.every((definition, index) => definition.sourceId === placements[index].sourceId), 'Geometry-facing definitions and placements are obtained only through the runtime stellar-source interface.');
		assert(definitions.every((definition) => definition.sourceKind === 'point' && definition.support.kind === 'point' && definition.placementProviderContract.frameId === 'celestial-rh-v1'), 'Every catalog member has an explicit point-support canonical-frame definition.');
		const overhead = members[0];
		const geometry = new SphericalEarthGeometry({ bottomRadius: { value: 6360000, units: 'meters' }, topRadius: { value: 6420000, units: 'meters' }, celestialContributionDomain: { frames: { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', modelFromBody: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] } } });
		const query = geometry.prepareCelestialContributionQuery({ generationId: 'stellar-source-proof-generation-v1', runtimeCompatibilityFingerprint: 'stellar-source-proof-runtime-v1' }, [...definitions, sunDefinition()], [...placements, sunPlacement(epoch)], { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', timeScale: 'unix-seconds', epoch, bodyFromCelestial: rotationZ(0), geographicReceiver: { latitudeRadians: overhead.latitudeRadians, longitudeRadians: overhead.longitudeRadians, altitude: { value: 0, units: 'meters' } } });
		const overheadMember = query.layerQueries.starField.members.find((member) => member.sourceId === overhead.memberId);
		assert(Math.abs(overheadMember.stencil.u - 1) <= 2e-15 && vectorDistance(overheadMember.directionToSourceModel, canonicalDirection(overhead)) <= 2e-15, 'Spherical geometry consumes the source placement and preserves the Unix-epoch overhead alignment.');
		const rotatedEpoch = Object.freeze({ value: ROTATION_PERIOD_SECONDS / 4, units: 'seconds', timeScale: 'unix-seconds' });
		const rotatedPlacements = participant.createPointPlacementStates({ epoch: rotatedEpoch });
		const rotatedQuery = geometry.prepareCelestialContributionQuery({ generationId: 'stellar-source-proof-generation-v1', runtimeCompatibilityFingerprint: 'stellar-source-proof-runtime-v1' }, [...definitions, sunDefinition()], [...rotatedPlacements, sunPlacement(rotatedEpoch)], { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', timeScale: 'unix-seconds', epoch: rotatedEpoch, bodyFromCelestial: rotationZ(-Math.PI / 2), geographicReceiver: { latitudeRadians: overhead.latitudeRadians, longitudeRadians: overhead.longitudeRadians, altitude: { value: 0, units: 'meters' } } });
		const rotatedMember = rotatedQuery.layerQueries.starField.members.find((member) => member.sourceId === overhead.memberId);
		assert(source.describeStaticIdentity().catalogFingerprint === identity.catalogFingerprint && placements[0].placementStateFingerprint !== rotatedPlacements[0].placementStateFingerprint && vectorDistance(overheadMember.directionToSourceModel, rotatedMember.directionToSourceModel) > 1, 'An epoch/body-rotation refresh changes live placement while retaining the source catalog identity.');
		const negativeControls = [
			await rejects(() => source.describePointSourceDefinitions({ celestialFrameId: 'wrong-frame' })),
			await rejects(() => source.createPointPlacementStates({ epoch: { value: 0, units: 'milliseconds', timeScale: 'unix-seconds' } })),
			await rejects(() => new StellarCelestialSource({ catalog: BRIGHT_STAR_CATALOG_V50, members: members.slice(0, 499) })),
		];
		requireCondition(negativeControls.every(Boolean), 'One or more stellar-source negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-pre-g9-stellar-celestial-source-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'stellar-celestial-source-v1', accepted: true, catalogSha256, sourceIdentity: identity, assertions, negativeControls: negativeControls.map((rejected, index) => ({ id: index + 1, rejected })), containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/stellar-celestial-source-proof.json', proof);
		await run.writeJsonArtifact('evidence/stellar-celestial-source-definitions.json', definitions);
		const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, assertionCount: assertions.length, negativeControlCount: negativeControls.length, memberCount: identity.memberCount }, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try { await run.writeJsonArtifact('evidence/failure.json', serialized); const manifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'stellar-celestial-source-v1', error: serialized }, report: `# ${run.runId}: Stellar celestial source proof\n\nConclusion: **failed**\n\n${serialized.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: serialized }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
