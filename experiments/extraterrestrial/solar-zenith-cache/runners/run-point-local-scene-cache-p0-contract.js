#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from '../point-local-scene-cache/sceneCacheContract.js';
import {
	beginContainedEvidence,
	finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p0-contract.js';
const COMMAND = `node experiments/extraterrestrial/${ENTRY}`;
const SLUG = 'point-local-scene-cache-p0-contract';
const SOURCES = [
	ENTRY,
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js',
	'solar-zenith-cache/point-local-scene-cache/runEvidence.js',
	'solar-zenith-cache/point-local-scene-cache/README.md',
];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function report(runId, proof) {
	return `# ${runId}: point-local scene-cache P0\n\n`
		+ `Conclusion: **accepted**.\n\n`
		+ `${proof.assertions.length} contract and containment assertions passed. `
		+ 'The run freezes the first San Jose support envelope and two independent '
		+ 'scene-Sun cache identities; it builds no scattering values.\n';
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const historical = {};
	for (const runId of [
		'000498-san-jose-nautical-zenith-culling-memory',
		'000511-san-jose-five-scene-actual-point-scattering',
		'000513-san-jose-solar-noon-near-ground-page',
		'000515-san-jose-solar-noon-validity-aware-runtime',
	]) historical[runId] = await verifyRun(runId);
	const run = await initializeRunRecord({
		slug: SLUG, command: COMMAND,
		inputs: {schemaId: 'point-local-p0-inputs-v1', contractSchemaId: CONTRACT.schemaId},
		provenance: {schemaId: 'point-local-p0-provenance-v1',
			operation: 'freeze the selected point-local C4 semantic, domains, scene support, cache identities, schemas, and failure behavior'},
		environment: {schemaId: 'point-local-p0-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch},
		references: {schemaId: 'point-local-p0-references-v1', historical},
	});
	try {
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(CONTRACT.semantic.field === 'C4 = J1 + J2 + J3 + J4', 'C4 cumulative-density semantic is pinned through J4.');
		check(CONTRACT.semantic.coordinates.length === 4, 'Stored axes are altitude, local solar zenith, outgoing direction, and Native15 channel.');
		check(!CONTRACT.semantic.coordinates.some((axis) => axis.includes('camera')), 'Camera state is absent from stored axes.');
		check(CONTRACT.geometryBoundary.startsWith('Geometry supplies t_end unchanged'), 'Geometry ray termination remains unchanged.');
		check(CONTRACT.domains.altitude.count === 48 && CONTRACT.domains.solarZenith.count === 180, 'Native48 and provisional Z180 are pinned.');
		check(CONTRACT.domains.incoming.count === 68 && CONTRACT.domains.outgoingPoc.count === 9126, 'F68 and W39 POC domains are pinned.');
		check(CONTRACT.domains.outgoingSuccessor.count === 4374 && CONTRACT.domains.spectral.count === 15, 'W27 successor and Native15 domains are pinned.');
		check(CONTRACT.construction.maximumOrder === 4 && CONTRACT.construction.ozone.startsWith('enabled'), 'N4 and ozone construction controls are pinned.');
		check(CONTRACT.reconstruction.outOfSupport.includes('never substitute spectral zero'), 'Out-of-support lookup fails explicitly and cannot become spectral zero.');
		check(CONTRACT.scenes.length === 2 && new Set(CONTRACT.scenes.map((scene) => scene.cacheIdentity)).size === 2, 'Solar noon and nautical twilight have independent cache identities.');
		check(CONTRACT.scenes.every((scene) => scene.support.cameraSupport.orientation === 'complete unit sphere'), 'First support permits complete camera rotation at the fixed observer.');
		check(CONTRACT.scenes.every((scene) => scene.support.rayEndpointSupport.startsWith('arbitrary Geometry-shortened endpoint')), 'Arbitrary object-shortened endpoints are inside support.');
		for (const scene of CONTRACT.scenes) {
			check(Math.abs(Math.hypot(...scene.directionToSourceUpEastNorth) - 1) < 1e-14,
				`${scene.id} distant-Sun direction is unit length.`);
		}
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		assertions.push('Static closure, real paths, and production inventories satisfy containment.');
		const manifestSchema = {
			schemaId: CONTRACT.packedLayout.manifestSchemaId,
			required: ['cacheIdentity', 'sceneSunState', 'sceneSupport', 'semantic',
				'domains', 'numericalControls', 'packedRowLedgerIdentity',
				'payloadIdentity', 'derivation'],
		};
		const ledgerSchema = {
			schemaId: CONTRACT.packedLayout.ledgerSchemaId,
			rowKey: ['altitudeIndex', 'solarZenithIndex'],
			requiredPerAltitude: ['physicalAltitudeMeters', 'retainedZenithRange',
				'packedFirstRow', 'packedRowCount', 'supportAndHaloProvenance'],
		};
		const proof = {proofId: 'point-local-scene-cache-p0-proof-v1', accepted: true,
			claimBoundary: 'contract and first scene-support freeze only; no cache values or physical packing built',
			assertions};
		await run.writeJsonArtifact('evidence/contract.json', CONTRACT);
		await run.writeJsonArtifact('evidence/cache-manifest-schema.json', manifestSchema);
		await run.writeJsonArtifact('evidence/packed-row-ledger-schema.json', ledgerSchema);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P0', proofId: proof.proofId, accepted: true,
				sceneCacheIdentities: CONTRACT.scenes.map((scene) => scene.cacheIdentity)},
			report: report(run.runId, proof)});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, accepted: true}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P0', accepted: false,
			error: error.message}, report: `# ${run.runId}: P0 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

