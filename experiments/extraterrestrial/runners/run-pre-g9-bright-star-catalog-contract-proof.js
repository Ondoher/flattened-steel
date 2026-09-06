#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
	BRIGHT_STAR_CATALOG_V50,
	canonicalDirectionFromCatalogCoordinate,
	createCatalogPointPlacementStates,
	createCatalogPointSourceDefinitions,
	parseBrightStarCatalogV50,
	selectBrightestBrightStarCatalogMembers,
} from '../catalogs/bright-star-catalog-v50.js';
import { SphericalEarthGeometry } from '../candidate/src/algorithm32/geometries/SphericalEarthGeometry.js';
import { assertContainmentPreconditions, assertExistingRealPathContained, assertNoReparseEntries, createProtectedTrackedInventory, verifyProtectedTrackedInventory } from '../harness/lib/containment.js';
import { sha256File } from '../harness/lib/atomic-files.js';
import { buildStaticModuleClosure } from '../harness/lib/module-closure.js';
import { initializeRunRecord } from '../harness/lib/run-record.js';
import { EXPERIMENT_NODE_MODULES_ROOT, EXPERIMENT_PACKAGE_PATH, EXPERIMENT_ROOT } from '../harness/lib/roots.js';

const COMMAND = 'node experiments/extraterrestrial/runners/run-pre-g9-bright-star-catalog-contract-proof.js';
const CATALOG_PATH = path.join(EXPERIMENT_ROOT, 'catalogs', 'bright-star-catalog-v50.tsv');
const CATALOG_SHA256 = 'sha256:d79223194f938533b4a4b7d832249d8661cf7adda088a8a0ec44039d3baab759';
const ROTATION_PERIOD_SECONDS = 86164.0905;

function requireCondition(condition, message) { if (!condition) throw new Error(message); }
function vectorDistance(left, right) { return Math.hypot(...left.map((value, index) => value - right[index])); }
function rotationZ(angle) { const c = Math.cos(angle); const s = Math.sin(angle); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; }
function sunDefinition() {
	return {
		sourceId: 'proof-sun', sourceKind: 'extended', placementKind: 'distant-direction', depth: 'infinite',
		sourceDefinitionFingerprint: 'bright-star-catalog-proof-sun-v1', placementProviderContractFingerprint: 'bright-star-catalog-v50-provider-v1',
		placementProviderContract: { frameId: 'celestial-rh-v1', originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', timeScale: 'unix-seconds' },
		support: { kind: 'uniform-disk', angularRadiusRadians: 0.0047 },
	};
}
function sunPlacement(epoch) {
	return { sourceId: 'proof-sun', direction: [0, 0, 1], frameId: 'celestial-rh-v1', originConvention: 'observer-independent-infinite-direction', directionConvention: 'receiver-to-source', epoch, placementProviderContractFingerprint: 'bright-star-catalog-v50-provider-v1', placementStateFingerprint: `bright-star-catalog-proof-sun:${epoch.value}` };
}

async function expectRejection(operation) { try { await operation(); } catch { return true; } return false; }

function report(runId, proof) {
	return [
		`# ${runId}: Bright Star Catalog coordinate contract proof`, '', 'Conclusion: **accepted**', '',
		`- Parsed valid BSC V/50 J2000 records: ${proof.catalogRecordCount}.`,
		`- Selected roster: ${proof.selectedMemberCount} stars, Vmag ${proof.brightestMagnitude} through ${proof.faintestMagnitude}.`,
		`- Assertions: ${proof.assertions.length}/${proof.assertions.length} accepted.`,
		`- Negative controls: ${proof.negativeControls.length}/${proof.negativeControls.length} rejected.`, '',
		'This proof qualifies deterministic catalog ingestion, canonical placement records, and the Unix-epoch overhead invariant only. It does not claim calibrated 15-channel stellar spectra, atmospheric star transport, GPU rasterization, flat-dome projection, or observational sky accuracy.', '',
	].join('\n');
}

async function main() {
	if (process.argv.length !== 2) throw new Error('The Bright Star Catalog proof accepts no command-line arguments.');
	const run = await initializeRunRecord({
		slug: 'pre-g9-bright-star-catalog-contract-proof', command: COMMAND,
		inputs: { schemaId: 'bright-star-catalog-contract-inputs-v1', catalog: 'experiments/extraterrestrial/catalogs/bright-star-catalog-v50.tsv', catalogSha256: CATALOG_SHA256, selectedCount: 500 },
		provenance: { schemaId: 'bright-star-catalog-contract-provenance-v1', catalog: BRIGHT_STAR_CATALOG_V50, repository: '.', experiment: 'experiments/extraterrestrial', candidate: 'experiments/extraterrestrial/candidate' },
		environment: { schemaId: 'bright-star-catalog-contract-environment-v1', node: process.version, platform: process.platform, architecture: process.arch },
		references: { schemaId: 'bright-star-catalog-contract-references-v1', canonicalDesign: 'agents/topics/extraterrestrial/celestial-contribution-cache-design.md', canonicalPlan: 'agents/topics/extraterrestrial/promotion-plan.md' },
	});
	try {
		const policy = await assertContainmentPreconditions();
		const before = await createProtectedTrackedInventory(policy);
		await Promise.all([assertExistingRealPathContained(EXPERIMENT_ROOT, CATALOG_PATH, 'Bright Star Catalog input'), assertNoReparseEntries(EXPERIMENT_ROOT, 'Experiment source/control tree')]);
		const catalogSha256 = `sha256:${await sha256File(CATALOG_PATH)}`;
		requireCondition(catalogSha256 === CATALOG_SHA256, `Unexpected Bright Star Catalog checksum: ${catalogSha256}`);
		const records = parseBrightStarCatalogV50(await readFile(CATALOG_PATH, 'utf8'));
		const members = selectBrightestBrightStarCatalogMembers(records);
		const assertions = [];
		const assert = (condition, message) => { requireCondition(condition, message); assertions.push(message); };
		assert(records.length === 9096, 'The V/50 source yields the 9,096 valid star records documented by CDS.');
		assert(members.length === 500 && new Set(members.map((member) => member.memberId)).size === 500, 'The deterministic roster contains exactly 500 uniquely identified stars.');
		assert(members.every((member, index) => index === 0 || members[index - 1].visualMagnitude < member.visualMagnitude || (members[index - 1].visualMagnitude === member.visualMagnitude && members[index - 1].hr < member.hr)), 'Roster order is ascending V magnitude with ascending HR tie-break.');
		assert(members[0].hr === 2491 && members[0].visualMagnitude === -1.46 && members.at(-1).hr === 7590 && members.at(-1).visualMagnitude === 3.96, 'The checked V/50 source selects the expected bright and faint roster boundaries.');
		assert(members.every((member) => member.latitudeRadians >= -Math.PI / 2 && member.latitudeRadians <= Math.PI / 2 && member.longitudeRadians >= -Math.PI && member.longitudeRadians < Math.PI), 'Every selected coordinate obeys celestial-rh-v1 latitude/longitude bounds.');
		assert(members.every((member) => Math.abs(Math.hypot(...canonicalDirectionFromCatalogCoordinate(member)) - 1) <= 2e-15), 'Every selected catalog coordinate produces a unit canonical direction.');
		assert(members[0].relativeVBandFlux === 1 && members.every((member, index) => index === 0 || member.relativeVBandFlux <= members[index - 1].relativeVBandFlux), 'V magnitude produces a relative V-band ranking only, normalized to the selected brightest star.');
		const sourceDefinitions = createCatalogPointSourceDefinitions(members);
		const epoch = Object.freeze({ value: 0, units: 'seconds', timeScale: 'unix-seconds' });
		const placements = createCatalogPointPlacementStates(members, { epoch });
		assert(sourceDefinitions.length === 500 && placements.length === 500 && sourceDefinitions.every((definition, index) => definition.sourceId === placements[index].sourceId), 'The catalog produces matched static point definitions and live celestial-frame placement states.');
		const overhead = members[0];
		const geometry = new SphericalEarthGeometry({ bottomRadius: { value: 6360000, units: 'meters' }, topRadius: { value: 6420000, units: 'meters' }, celestialContributionDomain: { frames: { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', modelFromBody: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] } } });
		const query = geometry.prepareCelestialContributionQuery({ generationId: 'bright-star-catalog-proof-generation-v1', runtimeCompatibilityFingerprint: 'bright-star-catalog-proof-runtime-v1' }, [...sourceDefinitions, sunDefinition()], [...placements, sunPlacement(epoch)], { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', timeScale: 'unix-seconds', epoch, bodyFromCelestial: rotationZ(0), geographicReceiver: { latitudeRadians: overhead.latitudeRadians, longitudeRadians: overhead.longitudeRadians, altitude: { value: 0, units: 'meters' } } });
		const overheadMember = query.layerQueries.starField.members.find((member) => member.sourceId === overhead.memberId);
		assert(overheadMember.stencil.classification === 'clear' && Math.abs(overheadMember.stencil.u - 1) <= 2e-15 && vectorDistance(overheadMember.directionToSourceModel, canonicalDirectionFromCatalogCoordinate(overhead)) <= 2e-15, 'At the Unix epoch, equal catalog and terrestrial latitude/longitude put the corresponding star directly overhead.');
		const quarterEpoch = Object.freeze({ value: ROTATION_PERIOD_SECONDS / 4, units: 'seconds', timeScale: 'unix-seconds' });
		const rotated = geometry.prepareCelestialContributionQuery({ generationId: 'bright-star-catalog-proof-generation-v1', runtimeCompatibilityFingerprint: 'bright-star-catalog-proof-runtime-v1' }, [...sourceDefinitions, sunDefinition()], [...createCatalogPointPlacementStates(members, { epoch: quarterEpoch }), sunPlacement(quarterEpoch)], { celestialFrameId: 'celestial-rh-v1', bodyFrameId: 'body-fixed-rh-v1', modelFrameId: 'model-rh-v1', timeScale: 'unix-seconds', epoch: quarterEpoch, bodyFromCelestial: rotationZ(-Math.PI / 2), geographicReceiver: { latitudeRadians: overhead.latitudeRadians, longitudeRadians: overhead.longitudeRadians, altitude: { value: 0, units: 'meters' } } });
		const rotatedMember = rotated.layerQueries.starField.members.find((member) => member.sourceId === overhead.memberId);
		assert(vectorDistance(rotatedMember.directionToSourceModel, overheadMember.directionToSourceModel) > 1 && rotatedMember.stencil.u < 1, 'A live Rz(-thetaEarth) body transform changes placement without changing the fixed catalog roster.');
		const negativeControls = [
			await expectRejection(() => selectBrightestBrightStarCatalogMembers(members, 501)),
			await expectRejection(() => canonicalDirectionFromCatalogCoordinate({ latitudeRadians: 0, longitudeRadians: Math.PI })),
			await expectRejection(() => createCatalogPointPlacementStates(members, { epoch: { value: 0, units: 'milliseconds', timeScale: 'unix-seconds' } })),
		];
		requireCondition(negativeControls.every(Boolean), 'One or more catalog contract negative controls were accepted.');
		const closure = await buildStaticModuleClosure({ candidateRoot: EXPERIMENT_ROOT, entryFiles: ['runners/run-pre-g9-bright-star-catalog-contract-proof.js'], packageJsonPath: EXPERIMENT_PACKAGE_PATH, nodeModulesRoot: EXPERIMENT_NODE_MODULES_ROOT, allowedNodeBuiltins: ['node:child_process', 'node:crypto', 'node:fs', 'node:fs/promises', 'node:module', 'node:os', 'node:path', 'node:url', 'node:util'] });
		const after = await verifyProtectedTrackedInventory(before, policy);
		const proof = { proofId: 'bright-star-catalog-contract-v1', accepted: true, catalogSha256, catalogRecordCount: records.length, selectedMemberCount: members.length, brightestMagnitude: members[0].visualMagnitude, faintestMagnitude: members.at(-1).visualMagnitude, firstMember: members[0], lastMember: members.at(-1), assertions, negativeControls: negativeControls.map((rejected, index) => ({ id: index + 1, rejected })), containment: { protectedFiles: after.fileCount, closureFileCount: closure.files.length, closureEdgeCount: closure.edges.length } };
		await run.writeJsonArtifact('evidence/bright-star-catalog-contract.json', proof);
		await run.writeJsonArtifact('evidence/bright-star-catalog-members.json', members);
		const manifest = await run.finalize({ conclusion: 'accepted', result: { proofId: proof.proofId, assertionCount: assertions.length, negativeControlCount: negativeControls.length, selectedMemberCount: members.length }, report: report(run.runId, proof) });
		process.stdout.write(`${JSON.stringify({ runId: run.runId, conclusion: 'accepted', artifactSetSha256: manifest.artifactSetSha256 }, null, 2)}\n`);
	} catch (error) {
		const serialized = { name: error instanceof Error ? error.name : 'Error', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined };
		try { await run.writeJsonArtifact('evidence/failure.json', serialized); const manifest = await run.finalize({ conclusion: 'failed', result: { proofId: 'bright-star-catalog-contract-v1', error: serialized }, report: `# ${run.runId}: Bright Star Catalog contract proof\n\nConclusion: **failed**\n\n${serialized.message}\n` }); process.stderr.write(`${JSON.stringify({ runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: serialized }, null, 2)}\n`); } catch {}
		process.exitCode = 1;
	}
}

await main();
