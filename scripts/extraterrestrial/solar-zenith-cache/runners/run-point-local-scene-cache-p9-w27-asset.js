#!/usr/bin/env node

import path from 'node:path';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {buildSceneInventoryLedger} from '../point-local-scene-cache/buildInventoryLedger.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from
	'../point-local-scene-cache/runEvidence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from
	'../point-local-scene-cache/sceneCacheContract.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p9-w27-asset.js';
const PARENT = '000569-point-local-scene-cache-p8-owner-decision';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP9W27AssetBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/selectedW27BuildRequest.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'accepted', 'Accepted P8 parent is unavailable.');
	const scene = CONTRACT.scenes.find((item) => item.id === 'nautical-twilight');
	const ledger = buildSceneInventoryLedger(scene);
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p9-w27-asset',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p9-w27-asset-inputs-v1',
			candidate: 'Native48/Z180/W27/F68/N4/Q30', sceneId: scene.id,
			format: 'R32F', channels: 15},
		provenance: {schemaId: 'point-local-p9-w27-asset-provenance-v1', parent,
			operation: 'compile all selected Native15 W27 packed rows through the accepted point-local J1-J4 recurrence'},
		environment: {schemaId: 'point-local-p9-w27-asset-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p9-w27-asset-references-v1', parent,
			inventory: await verifyRun('000517-point-local-scene-cache-p1-inventory')},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP9W27AssetBrowser.js',
			exportName: 'runP9W27AssetBrowser', uploadLimitBytes: 16 * 1024 * 1024});
		const expectedLayerBytes = ledger.retainedBlockCount * 4374 * 4;
		const layers = Array.from({length: 15}, (_unused, index) =>
			browser.uploads.get(`/artifact/w27-layer-${index}.f32`));
		requireCondition(layers.every((layer) => layer?.length === expectedLayerBytes),
			'Every W27 wavelength layer must have the exact packed size.');
		const payload = Buffer.concat(layers);
		requireCondition(payload.length === ledger.memory.packedRows.W27.bytes,
			'Complete W27 payload size must match P1 arithmetic.');
		const payloadPath = `cache/${scene.id}-native15-c4-w27.f32`;
		const ledgerPath = `cache/${scene.id}-packed-row-ledger.json`;
		await run.writeArtifact(payloadPath, payload);
		await run.writeJsonArtifact(ledgerPath, ledger);
		const payloadSha256 = await sha256File(path.join(run.runDirectory, ...payloadPath.split('/')));
		const manifest = {schemaId: 'point-local-scene-cache-manifest-v2',
			cacheIdentity: `${scene.cacheIdentity}-w27-selected-p9-v1`, sceneSunState: scene,
			semantic: CONTRACT.semantic, domains: {...CONTRACT.domains,
				outgoing: CONTRACT.domains.outgoingSuccessor}, numericalControls: CONTRACT.construction,
			layout: {format: 'R32F', width: 4374, height: ledger.retainedBlockCount,
				layers: 15, logicalBytes: payload.length,
				ordering: 'wavelength-major; packed row; W27 outgoing direction fastest'},
			packedRowLedger: ledgerPath, payload: {path: payloadPath, sha256: payloadSha256},
			derivation: {parentRunId: PARENT,
				operation: 'selected Native15 W27 J1+J2+J3+J4 packed-row compilation'}};
		await run.writeJsonArtifact(`cache/${scene.id}-cache-manifest.json`, manifest);
		const assertions = [
			'All 15 selected Native15 W27 wavelength schedules completed on real WebGL2.',
			'The complete payload matches the exact 617 x 4374 x 15 x 4 byte ledger.',
			'Every compiled scalar is finite and nonnegative.',
			'Every wavelength schedule released all tracked transient solver fields.',
		];
		requireCondition(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer), assertions[0]);
		requireCondition(browser.result.wavelengths.length === 15
			&& browser.result.wavelengths.every((item) => item.compiledCaches[0].finite
				&& item.compiledCaches[0].nonnegative), assertions[2]);
		requireCondition(browser.result.wavelengths.every((item) => item.finalLiveFieldBytes === 0), assertions[3]);
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p9-w27-asset-proof-v1', accepted: true,
			claimBoundary: 'complete selected uncompressed W27 asset and construction timings; lifecycle measurement follows separately',
			assertions, output: {sceneId: scene.id, payloadPath, payloadSha256,
				logicalBytes: payload.length, ledgerPath}, browser: browser.result};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted', result: {phase: 'P9 asset', ...proof},
			report: `# ${run.runId}: selected W27 cache asset\n\nConclusion: **accepted**.\n\n- Payload: ${payload.length} bytes\n- SHA-256: ${payloadSha256}\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, output: proof.output,
			gpu: browser.result.gpu, elapsedMilliseconds: browser.result.elapsedMilliseconds}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: selected W27 cache build failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
