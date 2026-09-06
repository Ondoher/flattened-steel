#!/usr/bin/env node

import path from 'node:path';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {buildSceneInventoryLedger} from '../point-local-scene-cache/buildInventoryLedger.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';
import {POINT_LOCAL_SCENE_CACHE_CONTRACT as CONTRACT} from '../point-local-scene-cache/sceneCacheContract.js';
import {MISSING_CACHE_SCENES} from '../point-local-scene-cache/sixSceneDefinitions.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p7-six-scene-compiler.js';
const PARENT = '000531-point-local-scene-cache-p7-scene-objects';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP7SixSceneCompilerBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/sixSceneDefinitions.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified, 'P7 parent is unavailable.');
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p7-six-scene-compiler',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p7-six-scene-compiler-inputs-v1', wavelengths: 15,
			sceneCacheIdentities: MISSING_CACHE_SCENES.map((scene) => scene.cacheIdentity)},
		provenance: {schemaId: 'point-local-p7-six-scene-compiler-provenance-v1', parent,
			canonicalCompiler: await verifyRun('000520-point-local-scene-cache-p3-compiler'),
			operation: 'reuse the accepted point-local N4 compiler to emit four additional independently loadable Native15 W39 scene caches'},
		environment: {schemaId: 'point-local-p7-six-scene-compiler-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p7-six-scene-compiler-references-v1', parent}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP7SixSceneCompilerBrowser.js',
			exportName: 'runP7SixSceneCompilerBrowser', uploadLimitBytes: 32 * 1024 * 1024});
		requireCondition(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer), 'Real WebGL2 is required.');
		const outputs = [];
		for (let cacheIndex = 0; cacheIndex < MISSING_CACHE_SCENES.length; cacheIndex += 1) {
			const scene = MISSING_CACHE_SCENES[cacheIndex];
			const ledger = buildSceneInventoryLedger(scene);
			const layers = Array.from({length: 15}, (_unused, wavelengthIndex) =>
				browser.uploads.get(`/artifact/cache-${cacheIndex}-layer-${wavelengthIndex}.f32`));
			const layerBytes = ledger.retainedBlockCount * 9126 * 4;
			requireCondition(layers.every((layer) => layer?.length === layerBytes),
				`${scene.id} does not supply all exact-size wavelength layers.`);
			const payload = Buffer.concat(layers);
			const payloadPath = `cache/${scene.id}-native15-c4-w39.f32`;
			const ledgerPath = `cache/${scene.id}-packed-row-ledger.json`;
			await run.writeArtifact(payloadPath, payload);
			await run.writeJsonArtifact(ledgerPath, ledger);
			const payloadSha256 = await sha256File(path.join(run.runDirectory, ...payloadPath.split('/')));
			const manifestPath = `cache/${scene.id}-cache-manifest.json`;
			await run.writeJsonArtifact(manifestPath, {schemaId: CONTRACT.packedLayout.manifestSchemaId,
				cacheIdentity: scene.cacheIdentity, sceneSunState: {id: scene.id,
					timeIso: scene.timeIso, directionToSourceUpEastNorth: scene.directionToSourceUpEastNorth},
				sceneSupport: scene.support, semantic: CONTRACT.semantic, domains: CONTRACT.domains,
				numericalControls: CONTRACT.construction,
				layout: {format: 'R32F', width: 9126, height: ledger.retainedBlockCount, layers: 15,
					logicalBytes: payload.length, ordering: 'wavelength-major; packed row; outgoing direction fastest'},
				packedRowLedger: ledgerPath, payload: {path: payloadPath, sha256: payloadSha256},
				derivation: {parentRunId: PARENT, operation: 'selected point-local J1-J4 rows from shared wavelength solve'}});
			outputs.push({sceneId: scene.id, payloadPath, ledgerPath, manifestPath,
				logicalBytes: payload.length, payloadSha256});
		}
		requireCondition(browser.result.wavelengths.length === 15
			&& browser.result.wavelengths.every((wavelength) => wavelength.compiledCaches.length === 4
				&& wavelength.finalLiveFieldBytes === 0),
			'All wavelength schedules emit four caches and release solver fields.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p7-six-scene-compiler-proof-v1',
			accepted: true, claimBoundary: 'four incremental scene caches; no appearance claim',
			outputs, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted', result: {accepted: true, ...proof},
			report: `# ${run.runId}: four incremental scene caches\n\nConclusion: **accepted**.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, ...proof}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: incremental compiler failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
