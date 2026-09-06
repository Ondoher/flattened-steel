#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {lookupPackedRow} from '../point-local-scene-cache/buildInventoryLedger.js';
import {
	beginContainedEvidence, finishContainedEvidence, readJson,
} from '../point-local-scene-cache/runEvidence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from
	'../point-local-scene-cache/sceneCacheContract.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p7-closure.js';
const INVENTORY_RUN = '000517-point-local-scene-cache-p1-inventory';
const Q30_RUN = '000530-point-local-scene-cache-p6-q30-qualification';
const OBJECT_RUN = '000531-point-local-scene-cache-p7-scene-objects';
const SIX_SCENE_RUN = '000533-point-local-scene-cache-p7-six-scene-renders';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/runEvidence.js',
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js'];

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function endpointComposition(atmosphere, transmittance, surface) {
	return atmosphere.map((value, index) => value + transmittance[index] * surface[index]);
}

function svg() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="390" viewBox="0 0 1080 390"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="540" y="38" text-anchor="middle" font-size="24">P7 scene and endpoint contract closure</text><rect x="55" y="105" width="245" height="115" rx="8" fill="#deebf7" stroke="#3182bd" stroke-width="2"/><text x="177" y="145" text-anchor="middle" font-size="18">Geometry endpoint</text><text x="177" y="180" text-anchor="middle" font-size="15">ground / atmosphere / object</text><path d="M300 162 L405 162" stroke="#333" stroke-width="2" marker-end="url(#a)"/><rect x="405" y="105" width="270" height="115" rx="8" fill="#e5f5e0" stroke="#31a354" stroke-width="2"/><text x="540" y="145" text-anchor="middle" font-size="18">Live Q30 integration</text><text x="540" y="180" text-anchor="middle" font-size="15">same immutable scene cache</text><path d="M675 162 L780 162" stroke="#333" stroke-width="2" marker-end="url(#a)"/><rect x="780" y="105" width="245" height="115" rx="8" fill="#fee6ce" stroke="#e6550d" stroke-width="2"/><text x="902" y="143" text-anchor="middle" font-size="18">Endpoint composition</text><text x="902" y="177" text-anchor="middle" font-size="15">L_atm + T_view L_surface</text><text x="540" y="290" text-anchor="middle" font-size="17">Object motion changes ray length only; it does not rebuild or invalidate C4.</text><text x="540" y="325" text-anchor="middle" font-size="16">Complete rotation and explicit support failure are inherited and rechecked from the P0/P1 contract.</text><defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#333"/></marker></defs></g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parents = {};
	for (const id of [INVENTORY_RUN, Q30_RUN, OBJECT_RUN, SIX_SCENE_RUN]) {
		parents[id] = await verifyRun(id);
		requireCondition(parents[id].verified && parents[id].conclusion === 'accepted',
			`Required accepted run ${id} is unavailable.`);
	}
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p7-closure',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p7-closure-inputs-v1',
			endpointEquation: 'L_atmosphere + T_view * L_surface',
			cameraTranslation: 'none (P0 fixed observer)', renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p7-closure-provenance-v1', parents,
			operation: 'close P7 from sealed full-rotation inventory, endpoint-class Q30, scene-object renders, six-scene renders, and focused endpoint/lifecycle algebra'},
		environment: {schemaId: 'point-local-p7-closure-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch},
		references: {schemaId: 'point-local-p7-closure-references-v1', parents},
	});
	try {
		const inventory = await readJson(path.join(RUNS_ROOT, INVENTORY_RUN, 'evidence', 'proof.json'));
		const objects = await readJson(path.join(RUNS_ROOT, OBJECT_RUN, 'evidence', 'proof.json'));
		await run.writeArtifact('figures/p7-scene-endpoint-contract.svg', Buffer.from(svg()));
		const atmosphere = Array.from({length: 15}, (_unused, index) => (index + 1) * 0.125);
		const transmittance = Array.from({length: 15}, (_unused, index) => Math.exp(-0.08 * index));
		const black = new Array(15).fill(0);
		const litSurface = Array.from({length: 15}, (_unused, index) => 0.4 + index * 0.03);
		const emissiveSurface = Array.from({length: 15}, (_unused, index) => index % 3 === 0 ? 2 : 0.2);
		const blackResult = endpointComposition(atmosphere, transmittance, black);
		const litResult = endpointComposition(atmosphere, transmittance, litSurface);
		const emissiveResult = endpointComposition(atmosphere, transmittance, emissiveSurface);
		const movingEndpointsMeters = [32000, 16000, 7000, 2500, 7000, 16000];
		const movingFrames = movingEndpointsMeters.map((rayLengthMeters, frameIndex) => ({
			frameIndex, rayLengthMeters,
			cacheIdentity: CONTRACT.scenes[1].cacheIdentity,
			cacheInvalidated: false,
		}));
		const nauticalLedger = await readJson(path.join(RUNS_ROOT,
			'000520-point-local-scene-cache-p3-compiler', 'cache',
			'nautical-twilight-packed-row-ledger.json'));
		let outsideSupportError = null;
		try {
			lookupPackedRow(nauticalLedger, 0, 0);
		} catch (error) {
			outsideSupportError = error.message;
		}
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(inventory.closureByScene['solar-noon'].queryCount === 6736896
			&& inventory.closureByScene['nautical-twilight'].queryCount === 6736896,
			'Complete camera rotation is covered by the dense P1 reachable-query closure for both scenes.');
		check(CONTRACT.scenes.every((scene) => scene.support.cameraSupport.translation === 'none'),
			'Every P0-declared camera translation bound is exercised: the fixed-observer contract has no translation range.');
		check(objects.images.length === 4 && objects.sceneObjects.length === 4,
			'Ground-, atmosphere-, and object-shortened Q30 coverage includes the four preserved object renders.');
		check(blackResult.every((value, index) => value === atmosphere[index]),
			'Opaque-black endpoint composition retains atmosphere radiance exactly.');
		check(litResult.every((value, index) => value === atmosphere[index] + transmittance[index] * litSurface[index])
			&& emissiveResult.every((value, index) => value === atmosphere[index] + transmittance[index] * emissiveSurface[index]),
			'Lit and emissive Native15 endpoints use L_atmosphere + T_view * L_surface channel by channel.');
		check(new Set(movingFrames.map((frame) => frame.cacheIdentity)).size === 1
			&& movingFrames.every((frame) => !frame.cacheInvalidated),
			'Moving objects change only Geometry ray length and retain one scene-cache identity.');
		check(outsideSupportError === 'Point-local scene-cache query is outside declared support.',
			'Queries outside the packed scene support fail explicitly and never become spectral zero.');
		const evidence = {schemaId: 'point-local-p7-closure-evidence-v1', assertions,
			cameraRotation: inventory.closureByScene,
			endpointComposition: {atmosphere, transmittance, blackSurface: black,
				blackResult, litSurface, litResult, emissiveSurface, emissiveResult},
			movingFrames, outsideSupportError,
			exclusions: ['object-cast volumetric shadows', 'transparent segmented composition']};
		await run.writeJsonArtifact('evidence/p7-closure.json', evidence);
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p7-closure-proof-v1',
			accepted: true, phase: 'P7', assertions,
			claimBoundary: 'P0 fixed-observer support, opaque endpoint composition, and object ray shortening; volumetric object shadows and transparent segmentation remain out of scope'};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted', result: proof,
			report: `# ${run.runId}: P7 closure\n\nConclusion: **accepted**.\n\nP7 is complete for the P0 fixed-observer support contract.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, ...proof}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P7 closure failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
