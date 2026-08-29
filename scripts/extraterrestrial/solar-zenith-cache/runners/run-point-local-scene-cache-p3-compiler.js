#!/usr/bin/env node

import path from 'node:path';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {buildSceneInventoryLedger} from '../point-local-scene-cache/buildInventoryLedger.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from '../point-local-scene-cache/sceneCacheContract.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p3-compiler.js';
const PARENT = '000519-point-local-scene-cache-p2-accumulator';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/runP3Browser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parentBefore = await verifyRun(PARENT);
	requireCondition(parentBefore.verified && parentBefore.conclusion === 'accepted', 'P2 parent is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p3-compiler',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p3-inputs-v1', wavelengths: 15,
			sceneCacheIdentities: CONTRACT.scenes.map((scene) => scene.cacheIdentity)},
		provenance: {schemaId: 'point-local-p3-provenance-v1', parent: parentBefore,
			operation: 'execute 15 independent wavelength schedules through selected-row J1+J2+J3+J4 accumulation and concatenate wavelength-major R32F scene-cache payloads'},
		environment: {schemaId: 'point-local-p3-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p3-references-v1', parent: parentBefore,
			contractRun: await verifyRun('000516-point-local-scene-cache-p0-contract'),
			ledgerRun: await verifyRun('000517-point-local-scene-cache-p1-inventory')},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP3Browser.js',
			exportName: 'runP3Browser', uploadLimitBytes: 32 * 1024 * 1024});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer),
			'P3 executed all schedules on real WebGL2.');
		check(browser.result.wavelengths.length === 15
			&& browser.result.wavelengths.every((wavelength, index) =>
				wavelength.wavelength.index === index && wavelength.compiledCaches.length === 2),
			'All 15 Native15 wavelength schedules emitted both scene caches.');
		check(browser.result.wavelengths.every((wavelength) =>
			wavelength.compiledCaches.every((cache, index) =>
				cache.packedRowCount === [618, 617][index] && cache.finite && cache.nonnegative)),
			'Every wavelength uses the same finite, nonnegative logical inventory.');
		check(browser.result.wavelengths.every((wavelength) => wavelength.finalLiveFieldBytes === 0),
			'Every wavelength schedule releases all tracked solver temporaries.');
		const outputs = [];
		for (let cacheIndex = 0; cacheIndex < CONTRACT.scenes.length; cacheIndex += 1) {
			const scene = CONTRACT.scenes[cacheIndex];
			const ledger = buildSceneInventoryLedger(scene);
			const layers = Array.from({length: 15}, (_unused, wavelengthIndex) =>
				browser.uploads.get(`/artifact/cache-${cacheIndex}-layer-${wavelengthIndex}.f32`));
			const layerBytes = ledger.retainedBlockCount * 9126 * 4;
			check(layers.every((layer) => layer?.length === layerBytes),
				`${scene.id} supplies all exact-size wavelength layers.`);
			const payload = Buffer.concat(layers);
			const expectedBytes = ledger.memory.packedRows.W39.bytes;
			check(payload.length === expectedBytes,
				`${scene.id} payload size matches exact P1 arithmetic.`);
			const payloadPath = `cache/${scene.id}-native15-c4-w39.f32`;
			const ledgerPath = `cache/${scene.id}-packed-row-ledger.json`;
			await run.writeArtifact(payloadPath, payload);
			await run.writeJsonArtifact(ledgerPath, ledger);
			const payloadSha256 = await sha256File(path.join(run.runDirectory, ...payloadPath.split('/')));
			const manifest = {
				schemaId: CONTRACT.packedLayout.manifestSchemaId,
				cacheIdentity: scene.cacheIdentity,
				sceneSunState: {id: scene.id, timeIso: scene.timeIso,
					directionToSourceUpEastNorth: scene.directionToSourceUpEastNorth},
				sceneSupport: scene.support,
				semantic: CONTRACT.semantic,
				domains: CONTRACT.domains,
				numericalControls: CONTRACT.construction,
				layout: {format: 'R32F', x: 'W39 outgoing direction',
					y: 'packed altitude/solar-zenith row', z: 'Native15 wavelength layer',
					width: 9126, height: ledger.retainedBlockCount, layers: 15,
					logicalBytes: payload.length, ordering: 'wavelength-major; packed row; outgoing direction fastest'},
				packedRowLedger: ledgerPath,
				payload: {path: payloadPath, sha256: payloadSha256},
				derivation: {parentRunId: PARENT,
					operation: 'per wavelength, accumulate selected point-local pure J1-J4 rows; concatenate Native15 layers'},
			};
			const manifestPath = `cache/${scene.id}-cache-manifest.json`;
			await run.writeJsonArtifact(manifestPath, manifest);
			outputs.push({sceneId: scene.id, cacheIdentity: scene.cacheIdentity,
				payloadPath, payloadSha256, logicalBytes: payload.length,
				ledgerPath, manifestPath});
		}
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore),
			'P2 parent remains immutable while another scene cache is added.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const proof = {proofId: 'point-local-scene-cache-p3-proof-v1', accepted: true,
			claimBoundary: 'complete uncompressed Native15 W39 cache compilation; no runtime lookup or visual plausibility claim',
			assertions, outputs, browser: browser.result};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P3', accepted: true, proofId: proof.proofId, outputs},
			report: `# ${run.runId}: P3 Native15 scene-cache compiler\n\nConclusion: **accepted**.\n\n`
				+ outputs.map((output) => `- ${output.sceneId}: ${output.logicalBytes} bytes, SHA-256 ${output.payloadSha256}`).join('\n') + '\n'});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, outputs}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P3', accepted: false,
			error: error.message}, report: `# ${run.runId}: P3 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

