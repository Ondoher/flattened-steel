#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p2-accumulator.js';
const PARENT = '000517-point-local-scene-cache-p1-inventory';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/runP2Browser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/sceneCacheContract.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'accepted', 'P1 parent is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p2-accumulator',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p2-inputs-v1', wavelengthIndex: 7,
			centerNanometers: 595, sceneBlockCounts: [618, 617], outgoingCount: 9126},
		provenance: {schemaId: 'point-local-p2-provenance-v1', parent,
			operation: 'reuse the complete actual-point N4 solver and replace observer projection with direct GPU accumulation of selected local altitude/solar-zenith rows'},
		environment: {schemaId: 'point-local-p2-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p2-references-v1', parent,
			solverEvidence: await verifyRun('000508-san-jose-nautical-zp3-gpu-recurrence')},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP2Browser.js',
			exportName: 'runP2Browser', uploadLimitBytes: 32 * 1024 * 1024});
		const {result} = browser;
		const expectedBlocks = [618, 617];
		const expectedBytes = expectedBlocks.map((blocks) => blocks * 9126 * 4);
		const uploads = expectedBlocks.map((_unused, index) =>
			browser.uploads.get(`/artifact/cache-${index}-wavelength-7.f32`));
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'P2 executed on real WebGL2 through ANGLE D3D11.');
		check(uploads.every((value, index) => value?.length === expectedBytes[index]),
			'One wavelength emitted each exact P1 packed-row count.');
		check(result.result.compiledCaches.every((cache, index) => cache.packedRowCount === expectedBlocks[index]
			&& cache.logicalBytes === expectedBytes[index] && cache.finite && cache.nonnegative),
			'Every emitted scalar is finite and nonnegative.');
		check(result.result.accumulationProbes.length === 8
			&& result.result.accumulationProbes.every((probe) =>
				probe.cumulative === Math.fround(probe.previous + probe.pure)),
			'Cumulative probes equal binary32 J1 + J2 + J3 + J4 accumulation at every order.');
		const passInputs = Object.fromEntries(result.result.timings.map((pass) => [pass.id, pass.inputFields]));
		check(!Object.values(passInputs).flat().some((id) => /^C4|cumulative/iu.test(id)),
			'No cumulative field feeds recurrence.');
		check(result.result.finalLiveFieldBytes === 0
			&& result.result.ledger.filter((item) => item.operation === 'release').every((item) => item.isTextureAfterDelete === false),
			'All tracked temporary solver resources release after last use.');
		for (let index = 0; index < uploads.length; index += 1) {
			await run.writeArtifact(`cache/cache-${index}-wavelength-7.f32`, uploads[index]);
		}
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const proof = {proofId: 'point-local-scene-cache-p2-proof-v1', accepted: true,
			claimBoundary: 'one 595 nm wavelength selected-row accumulation; not a Native15 cache or runtime render',
			assertions, browser: result};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P2', accepted: true, proofId: proof.proofId,
				packedRowCounts: expectedBlocks, layerBytes: expectedBytes},
			report: `# ${run.runId}: P2 selected-row GPU accumulator\n\nConclusion: **accepted**.\n\n`
				+ `One 595 nm layer emitted ${expectedBlocks.join(' and ')} rows; ${assertions.length} assertions passed.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, packedRowCounts: expectedBlocks,
			layerBytes: expectedBytes}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P2', accepted: false,
			error: error.message}, report: `# ${run.runId}: P2 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

