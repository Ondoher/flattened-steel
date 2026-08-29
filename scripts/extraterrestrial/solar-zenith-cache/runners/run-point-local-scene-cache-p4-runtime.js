#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p4-runtime.js';
const PARENT = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/PointLocalSceneCacheRuntime.js',
	'solar-zenith-cache/point-local-scene-cache/runP4Browser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parentBefore = await verifyRun(PARENT);
	requireCondition(parentBefore.verified && parentBefore.conclusion === 'accepted', 'P3 parent is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p4-runtime',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p4-inputs-v1', parentRunId: PARENT,
			cacheIdentity: 'san-jose-solar-noon-point-local-c4-native15-n4-v1'},
		provenance: {schemaId: 'point-local-p4-provenance-v1', parent: parentBefore,
			operation: 'load and bind the sealed P3 cache, construct actual-point altitude/mu_s/local-outgoing stencils, perform packed Native15 GPU lookups, and retain the outer 15-sample Geometry-length schedule'},
		environment: {schemaId: 'point-local-p4-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p4-references-v1', parent: parentBefore},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP4Browser.js',
			exportName: 'runP4Browser',
			servedRoots: {'/p3/': path.join(RUNS_ROOT, PARENT)},
			uploadLimitBytes: 1024});
		const result = browser.result;
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.cacheProvider === 'one complete P3 point-local scene cache'
			&& result.manifestIdentity === 'san-jose-solar-noon-point-local-c4-native15-n4-v1',
			'One complete sealed P3 cache loads and binds as the sole provider.');
		check(result.exact.tapCount === 1 && result.exact.weightSum === 1,
			'An exact altitude/zenith/direction node resolves one exact packed texel.');
		check(result.offGrid.tapCount > 1 && result.offGrid.tapCount <= 16
			&& Math.abs(result.offGrid.weightSum - 1) < 1e-12,
			'An off-grid actual point resolves at most 16 taps whose weights sum to one.');
		check(result.comparisons.every((comparison) => comparison.maximumAbsoluteError <= 1e-7),
			'GPU packed-cache reconstruction agrees with the CPU-addressed Native15 values.');
		check(result.unsupportedFailure?.includes('outside declared support'),
			'Unsupported local states fail explicitly instead of clamping or returning spectral zero.');
		check(result.observerProjectionUsed === false && result.validityMaskUsed === false,
			'No observer projection or validity mask participates in lookup.');
		check(result.pathIntegration.pathSampleCount === 15
			&& result.pathIntegration.native15ChannelCount === 15
			&& result.pathIntegration.finite && result.pathIntegration.nonnegative,
			'The unchanged 15-sample outer path schedule retains a finite Native15 spectrum.');
		check(result.pathIntegration.sampleDistancesMeters.every((distance, index) =>
			distance === result.pathIntegration.geometryRayLengthMeters * (index + 0.5) / 15),
			'Algorithm32 sample distances remain derived solely from Geometry ray length.');
		check(result.resources.textureDeleted && result.resources.framebufferDeleted,
			'Runtime cache and framebuffer resources release after the proof.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore),
			'The sealed P3 cache remains immutable during runtime consumption.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const proof = {proofId: 'point-local-scene-cache-p4-proof-v1', accepted: true,
			claimBoundary: 'manufactured runtime addressing and complete-cache binding; not a scene render or accuracy qualification',
			assertions, result};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P4', accepted: true, proofId: proof.proofId,
				exactTapCount: result.exact.tapCount, offGridTapCount: result.offGrid.tapCount},
			report: `# ${run.runId}: P4 point-local runtime lookup\n\nConclusion: **accepted**.\n\n`
				+ `${assertions.length} manufactured binding, addressing, interpolation, and lifecycle assertions passed.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256,
			exactTapCount: result.exact.tapCount, offGridTapCount: result.offGrid.tapCount,
			maximumAbsoluteErrors: result.comparisons.map((value) => value.maximumAbsoluteError)}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P4', accepted: false,
			error: error.message}, report: `# ${run.runId}: P4 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

