#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {
	buildSceneInventoryLedger,
	lookupPackedRow,
	proveLedgerClosure,
} from '../point-local-scene-cache/buildInventoryLedger.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from '../point-local-scene-cache/sceneCacheContract.js';
import {
	beginContainedEvidence,
	finishContainedEvidence,
	readJson,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p1-inventory.js';
const parentRunId = process.argv[2];
if (!/^\d{6}-point-local-scene-cache-p0-contract$/u.test(parentRunId ?? '')) {
	throw new Error('P1 requires the exact accepted P0 run id as its sole argument.');
}
const COMMAND = `node scripts/extraterrestrial/${ENTRY} ${parentRunId}`;
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js',
	'solar-zenith-cache/point-local-scene-cache/runEvidence.js'];

function report(runId, summaries, closure) {
	const lines = summaries.map((item) => `- ${item.sceneId}: ${item.blocks} blocks; `
		+ `W39 ${item.w39MiB.toFixed(6)} MiB; W27 ${item.w27MiB.toFixed(6)} MiB.`);
	return `# ${runId}: point-local scene-cache P1\n\nConclusion: **accepted**.\n\n`
		+ `${lines.join('\n')}\n\nThe dense proof exercised ${closure.queryCount.toLocaleString('en-US')} `
		+ 'reachable local queries per scene and found every altitude/zenith stencil tap.\n';
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parentVerification = await verifyRun(parentRunId);
	const parentResult = await readJson(path.join(RUNS_ROOT, parentRunId, 'result.json'));
	if (!parentVerification.verified || parentResult.phase !== 'P0'
		|| parentResult.accepted !== true) throw new Error('P0 parent is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p1-inventory', command: COMMAND,
		inputs: {schemaId: 'point-local-p1-inputs-v1', parentRunId,
			contractSchemaId: CONTRACT.schemaId, scenes: CONTRACT.scenes.map((scene) => scene.id)},
		provenance: {schemaId: 'point-local-p1-provenance-v1', parent: parentVerification,
			operation: 'derive the full ground-clear visible cap at every altitude support interval, close it over both altitude and Z180 interpolation stencils, and pack retained local altitude/zenith blocks deterministically'},
		environment: {schemaId: 'point-local-p1-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch},
		references: {schemaId: 'point-local-p1-references-v1', parent: parentVerification,
			priorCensus: await verifyRun('000498-san-jose-nautical-zenith-culling-memory')},
	});
	try {
		const evidence = [];
		let commonClosure = null;
		for (const scene of CONTRACT.scenes) {
			const ledger = buildSceneInventoryLedger(scene);
			const closure = proveLedgerClosure(ledger, scene);
			commonClosure ??= closure;
			if (ledger.rows.length !== 48 || ledger.retainedBlockCount !== closure.packedRoundTripCount) {
				throw new Error(`${scene.id} inventory is incomplete.`);
			}
			for (const row of ledger.rows) {
				const first = lookupPackedRow(ledger, row.altitudeIndex, row.retainedZenith.firstIndex);
				const last = lookupPackedRow(ledger, row.altitudeIndex, row.retainedZenith.lastIndex);
				if (first !== row.packed.firstRow || last !== first + row.packed.rowCount - 1) {
					throw new Error(`${scene.id} packed row does not round-trip.`);
				}
			}
			evidence.push({scene, ledger, closure});
			await run.writeJsonArtifact(`evidence/${scene.id}-packed-row-ledger.json`, ledger);
			await run.writeJsonArtifact(`evidence/${scene.id}-closure-proof.json`, closure);
		}
		if (evidence[0].ledger === evidence[1].ledger
			|| evidence[0].ledger.cacheIdentity === evidence[1].ledger.cacheIdentity) {
			throw new Error('Scene inventories were not built independently.');
		}
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const summaries = evidence.map(({scene, ledger}) => ({
			sceneId: scene.id, cacheIdentity: scene.cacheIdentity,
			blocks: ledger.retainedBlockCount,
			completeZenithPageCount: ledger.retainedZenithIndices.length,
			w39Bytes: ledger.memory.packedRows.W39.bytes,
			w39MiB: ledger.memory.packedRows.W39.MiB,
			w27Bytes: ledger.memory.packedRows.W27.bytes,
			w27MiB: ledger.memory.packedRows.W27.MiB,
			fullW39Bytes: ledger.memory.fullRectangular.W39.bytes,
			fullW27Bytes: ledger.memory.fullRectangular.W27.bytes,
		}));
		const proof = {proofId: 'point-local-scene-cache-p1-proof-v1', accepted: true,
			claimBoundary: 'analytic and dense geometry/stencil inventory closure plus exact logical byte counts; no N4 field construction, interpolation accuracy, texture allocation, or driver-memory claim',
			assertions: [
				'Every retained block key is only altitude index plus local-solar-zenith index.',
				'All outgoing directions and Native15 channels are retained inside every block.',
				'Every densely sampled reachable query has its complete 2x2 altitude/zenith stencil.',
				'Every packed row round-trips bijectively and deterministic offsets are contiguous.',
				'Missing blocks throw and never reconstruct as spectral zero.',
				'Solar-noon and nautical inventories are independent scene-cache products.',
				'W39 POC and W27 successor byte counts are reported without selecting a limit.',
				'Production inventories and immutable parents remain unchanged.',
			], summaries,
			closureByScene: Object.fromEntries(evidence.map(({scene, closure}) => [scene.id, closure]))};
		await run.writeJsonArtifact('evidence/memory-summary.json', {schemaId: 'point-local-p1-memory-summary-v1', summaries});
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/derivation.json', {schemaId: 'point-local-p1-derivation-v1',
			parent: parentVerification, operation: run.runId + ': ' + 'visible spherical-cap support -> interpolation closure -> packed-row offsets -> exact R32F bytes',
			outputs: evidence.map(({scene}) => `${scene.id}-packed-row-ledger.json`)});
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P1', proofId: proof.proofId, accepted: true, summaries},
			report: report(run.runId, summaries, commonClosure)});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, summaries}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P1', accepted: false,
			error: error.message}, report: `# ${run.runId}: P1 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

