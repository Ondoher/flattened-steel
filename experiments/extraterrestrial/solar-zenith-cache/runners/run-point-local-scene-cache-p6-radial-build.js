#!/usr/bin/env node

import path from 'node:path';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {createP6RadialBuildRequest} from '../point-local-scene-cache/p6RadialBuildRequest.js';
import {buildP6RadialLedger} from '../point-local-scene-cache/p6RadialLedger.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-radial-build.js';
const PARENT = '000524-point-local-scene-cache-p5-renders';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6RadialGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/runP6RadialBuildBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialBuildRequest.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialDomain.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parentBefore = await verifyRun(PARENT);
	requireCondition(parentBefore.verified, 'P5 control run is not accepted.');
	const buildRequest = createP6RadialBuildRequest();
	const page = buildRequest.scenePageRequests[0];
	const ledger = buildP6RadialLedger({scene: page.scene,
		positionDomain: buildRequest.transportSpec.domains.position});
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-radial-build',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-radial-build-inputs-v1', wavelengths: 15,
			isolatedVariable: '48-node altitude distribution',
			altitudeOperation: 'altitude[i] = 60000 * (i / 47)^2'},
		provenance: {schemaId: 'point-local-p6-radial-build-provenance-v1',
			parent: parentBefore,
			operation: 'rebuild only the solar-noon point-local Native15 W39 C4 cache with a fixed-count quadratic near-ground altitude distribution; retain Z180, F68, W39, N4, atmosphere, camera, and numerical controls'},
		environment: {schemaId: 'point-local-p6-radial-build-environment-v1',
			node: process.version, platform: process.platform,
			architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-radial-build-references-v1',
			control: parentBefore, baselineCache: await verifyRun('000520-point-local-scene-cache-p3-compiler')},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6RadialBuildBrowser.js',
			exportName: 'runP6RadialBuildBrowser', uploadLimitBytes: 32 * 1024 * 1024});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.wavelengths.length === 15,
			'All Native15 wavelength schedules completed.');
		check(browser.result.wavelengths.every((result) =>
			result.compiledCaches.length === 1 && result.compiledCaches[0].finite
			&& result.compiledCaches[0].nonnegative),
			'Every radial-control layer is finite and nonnegative.');
		const layerBytes = ledger.retainedBlockCount * 9126 * 4;
		const layers = Array.from({length: 15}, (_unused, wavelengthIndex) =>
			browser.uploads.get(`/artifact/layer-${wavelengthIndex}.f32`));
		check(layers.every((layer) => layer?.length === layerBytes),
			'Every radial-control layer has the exact packed-row byte count.');
		const payload = Buffer.concat(layers);
		const payloadPath = 'cache/solar-noon-p6-radial-native15-c4-w39.f32';
		const ledgerPath = 'cache/solar-noon-p6-radial-packed-row-ledger.json';
		await run.writeArtifact(payloadPath, payload);
		await run.writeJsonArtifact(ledgerPath, ledger);
		const payloadSha256 = await sha256File(path.join(run.runDirectory, ...payloadPath.split('/')));
		const manifest = {schemaId: 'point-local-scene-cache-manifest-v1',
			cacheIdentity: ledger.cacheIdentity,
			sceneSunState: {id: page.scene.id, timeIso: page.scene.timeIso,
				directionToSourceUpEastNorth: page.scene.directionToSourceUpEastNorth},
			semantic: 'C4 = J1 + J2 + J3 + J4, Native15',
			positionDomain: buildRequest.transportSpec.domains.position,
			retainedControls: {solarZenith: 'Z180', incoming: 'F68', outgoing: 'W39',
				maximumOrder: 4, constructionIntervals: 15},
			layout: {format: 'R32F', width: 9126, height: ledger.retainedBlockCount,
				layers: 15, logicalBytes: payload.length,
				ordering: 'wavelength-major; packed row; outgoing direction fastest'},
			packedRowLedger: ledgerPath,
			payload: {path: payloadPath, sha256: payloadSha256},
			derivation: {parentRunId: PARENT,
				operation: 'isolated fixed-count radial redistribution and complete N4 rebuild'},
		};
		await run.writeJsonArtifact('cache/solar-noon-p6-radial-cache-manifest.json', manifest);
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', {
			proofId: 'point-local-scene-cache-p6-radial-build-proof-v1',
			accepted: true,
			claimBoundary: 'isolated radial-control cache construction only; no appearance or accuracy claim',
			assertions,
			positionDomain: browser.result.positionDomain,
			ledger: {retainedBlockCount: ledger.retainedBlockCount},
			payload: manifest.payload,
			browser: browser.result,
		});
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.1-build', accepted: true, payload: manifest.payload,
				retainedBlockCount: ledger.retainedBlockCount},
			report: `# ${run.runId}: P6.1 radial-control cache build\n\nConclusion: **accepted construction**.\n\n${payload.length} bytes; SHA-256 ${payloadSha256}.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, payload: manifest.payload,
			retainedBlockCount: ledger.retainedBlockCount}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed',
			result: {phase: 'P6.1-build', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.1 radial build failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

