#!/usr/bin/env node

import {stat} from 'node:fs/promises';
import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence, readJson} from
	'../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p9-resources-lifecycle.js';
const ASSET_RUN = '000572-point-local-scene-cache-p9-w27-asset';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP9LifecycleBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js',
	'solar-zenith-cache/point-local-scene-cache/runEvidence.js'];
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

function chart(memory) {
	const rows = [
		['Payload / steady', memory.steadyResidentTexelBytes, '#3182bd'],
		['Atomic transition', memory.transitionResidentTexelBytes, '#31a354'],
		['Transition + staging', memory.transitionIncludingStagingBytes, '#e6550d'],
	];
	const maximum = Math.max(...rows.map((row) => row[1]));
	const bars = rows.map(([label, bytes, color], index) => {
		const y = 90 + index * 90;
		const width = 650 * bytes / maximum;
		return '<text x="55" y="' + (y + 22) + '" font-size="16">' + label
			+ '</text><rect x="250" y="' + y + '" width="' + width
			+ '" height="34" fill="' + color + '"/><text x="' + (260 + width)
			+ '" y="' + (y + 23) + '" font-size="15">'
			+ (bytes / 2 ** 20).toFixed(3) + ' MiB</text>';
	}).join('');
	return '<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="420" viewBox="0 0 1050 420">'
		+ '<rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111">'
		+ '<text x="525" y="35" text-anchor="middle" font-size="24">P9 selected W27 resource ledger</text>'
		+ bars
		+ '<text x="525" y="380" text-anchor="middle" font-size="15">Exact texel/staging bytes; WebGL does not expose opaque driver overhead.</text>'
		+ '</g></svg>';
}

function externalTimings(progress) {
	const times = new Map(progress.map((item) => [item.stage, item.time]));
	const duration = (start, complete) => {
		const a = times.get(`p9-lifecycle:${start}`);
		const b = times.get(`p9-lifecycle:${complete}`);
		return Number.isFinite(a) && Number.isFinite(b) ? b - a : null;
	};
	return {
		loadMilliseconds: duration('load-start', 'load-complete'),
		uploadAMilliseconds: duration('upload-a-start', 'upload-a-complete'),
		uploadBMilliseconds: duration('upload-b-start', 'upload-b-complete'),
		frameKernelBatchMilliseconds: duration('frame-kernel-start', 'frame-kernel-complete'),
		contextCycleMilliseconds: duration('context-cycle-start', 'context-cycle-complete'),
		restoreUploadMilliseconds: duration('restore-upload-start', 'restore-upload-complete'),
	};
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const asset = await verifyRun(ASSET_RUN);
	requireCondition(asset.verified && asset.conclusion === 'accepted', 'Accepted W27 asset is unavailable.');
	const assetRoot = path.join(RUNS_ROOT, ASSET_RUN);
	const assetProof = await readJson(path.join(assetRoot, 'evidence', 'proof.json'));
	const payloadPath = path.join(assetRoot, 'cache', 'nautical-twilight-native15-c4-w27.f32');
	const ledgerPath = path.join(assetRoot, 'cache', 'nautical-twilight-packed-row-ledger.json');
	const manifestPath = path.join(assetRoot, 'cache', 'nautical-twilight-cache-manifest.json');
	const sizes = await Promise.all([payloadPath, ledgerPath, manifestPath].map(async (item) => (await stat(item)).size));
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p9-resources-lifecycle',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p9-resources-inputs-v1', assetRunId: ASSET_RUN,
			cacheLayout: [4374, 617, 15], format: 'R32F'},
		provenance: {schemaId: 'point-local-p9-resources-provenance-v1', parent: asset,
			operation: 'load, upload, publish, replace, fail, supersede, context-restore, sample, and dispose the complete selected W27 asset'},
		environment: {schemaId: 'point-local-p9-resources-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p9-resources-references-v1', asset},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP9LifecycleBrowser.js',
			exportName: 'runP9LifecycleBrowser', uploadLimitBytes: 2 * 1024 * 1024,
			servedRoots: {'/asset/': assetRoot}});
		const result = browser.result;
		const wallClockTimings = externalTimings(browser.progress);
		await run.writeArtifact('figures/p9-resource-ledger.svg', Buffer.from(chart(result.memory)));
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'The complete resource proof executed on real WebGL2.');
		check(result.payloadBytes === 161925480 && result.memory.steadyResidentTexelBytes === 161925480,
			'Complete payload and steady texel residency are exactly 161,925,480 bytes.');
		check(result.memory.transitionResidentTexelBytes === 323850960
			&& result.memory.transitionIncludingStagingBytes === 485776440,
			'Atomic transition and transition-plus-staging byte peaks are recorded exactly.');
		check(result.failurePreservation.activeBefore === result.failurePreservation.activeAfter
			&& result.failurePreservation.abandonedDeleted,
			'Failed replacement preserves the active cache and releases the abandoned candidate.');
		check(result.atomicReplacement.previousDeletedAfterPublication
			&& result.atomicReplacement.probeBefore === result.atomicReplacement.probeAfter,
			'Complete replacement publishes atomically before deleting the previous cache.');
		check(result.supersession.supersededDeleted && result.contextRestoration.restored
			&& result.contextRestoration.restoredProbe === result.probes.initialProbe
			&& result.disposal.deleted,
			'Supersession, context restoration from the immutable asset, and disposal preserve the cache value.');
		const resourceLedger = {schemaId: 'point-local-p9-resource-ledger-v1',
			asset: {completeAssetBytes: sizes.reduce((sum, value) => sum + value, 0),
				packedPayloadBytes: sizes[0], ledgerBytes: sizes[1], manifestBytes: sizes[2]},
			constructionMilliseconds: assetProof.browser.elapsedMilliseconds,
			...result.memory, browserVirtualClockTimings: result.timings,
			wallClockTimings, gpu: result.gpu,
			hardwareSupportDecision: {namedHardware: result.gpu.renderer,
				supportedUncompressedSteadyBytes: result.memory.steadyResidentTexelBytes,
				supportedAtomicTransitionTexelBytes: result.memory.transitionResidentTexelBytes,
				generalDriverBudgetSelected: false,
				reason: 'WebGL proves allocation and exact texel lower bounds but does not expose opaque driver overhead; one RTX 2060 is not a general supported-hardware class.'}};
		await run.writeJsonArtifact('evidence/resource-ledger.json', resourceLedger);
		await run.writeJsonArtifact('evidence/lifecycle.json', result);
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p9-resources-lifecycle-proof-v1',
			accepted: true, phase: 'P9', assertions,
			claimBoundary: 'named RTX 2060/D3D11 WebGL2 allocation, timing, and lifecycle; opaque driver overhead and a general hardware ceiling remain unobservable/unselected'};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted', result: proof,
			report: `# ${run.runId}: P9 resources and lifecycle\n\nConclusion: **accepted on the named RTX 2060**.\n\n- Steady texels: ${result.memory.steadyResidentTexelBytes} bytes\n- Atomic transition texels: ${result.memory.transitionResidentTexelBytes} bytes\n- Transition plus staging: ${result.memory.transitionIncludingStagingBytes} bytes\n- Opaque driver overhead: not exposed by WebGL\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, proof, resourceLedger}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P9 resources/lifecycle failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
