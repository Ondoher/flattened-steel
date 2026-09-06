#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {P6_AEROSOL_VARIANTS} from '../point-local-scene-cache/p6AerosolBuildRequest.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-aerosol-sweep.js';
const PARENT = '000527-point-local-scene-cache-p6-components';
const TRACE_RUN = '000526-point-local-scene-cache-p6-radial-diagnostic';
const CACHE_RUN = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6AerosolGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/runP6AerosolSweepBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/p6AerosolBuildRequest.js',
	'solar-zenith-cache/point-local-scene-cache/P6RadialDiagnosticRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, traceBefore, cacheBefore] = await Promise.all([
		verifyRun(PARENT), verifyRun(TRACE_RUN), verifyRun(CACHE_RUN),
	]);
	requireCondition(parentBefore.verified && traceBefore.verified && cacheBefore.verified,
		'P6.2, P6.1 traces, or Native48 cache evidence is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-aerosol-sweep',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-aerosol-sweep-inputs-v1',
			variants: P6_AEROSOL_VARIANTS,
			canonicalMieAngstromBeta: 0.04,
			scatteringAndExtinctionScaledTogether: true,
			renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p6-aerosol-sweep-provenance-v1',
			parent: parentBefore, traces: traceBefore, native48Cache: cacheBefore,
			operation: 'independently rebuild complete solar-noon Native48/Z180/F68/W39/N4 caches at aerosol multipliers 0, 0.25, 0.5, and 1; scale Mie scattering and extinction together; render each cache and retain sparse J1-J4 Rayleigh/Mie path attribution'},
		environment: {schemaId: 'point-local-p6-aerosol-sweep-environment-v1',
			node: process.version, platform: process.platform,
			architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-aerosol-sweep-references-v1',
			p6Components: parentBefore, p6Traces: traceBefore, native48Cache: cacheBefore},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6AerosolSweepBrowser.js',
			exportName: 'runP6AerosolSweepBrowser', uploadLimitBytes: 8 * 1024 * 1024,
			servedRoots: {'/p6diag/': path.join(RUNS_ROOT, TRACE_RUN),
				'/p3/': path.join(RUNS_ROOT, CACHE_RUN)}});
		const images = [];
		// Preserve every sweep image before applying any numerical or trend gate.
		for (const variant of browser.result.variants) {
			const buffer = browser.uploads.get(`/artifact/${variant.id}.png`);
			requireCondition(buffer?.length > 100, `${variant.id} image was not uploaded.`);
			const artifactPath = `captures/${variant.id}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({id: variant.id, multiplier: variant.multiplier,
				path: artifactPath, bytes: buffer.length});
		}
		const measurements = browser.result.variants.map((variant) => {
			const byLabel = Object.fromEntries(variant.analyses.map((analysis) =>
				[analysis.label, analysis]));
			const row220 = variant.rendered.image.horizonRows['220'];
			return {id: variant.id, multiplier: variant.multiplier,
				mieAngstromBeta: variant.mieAngstromBeta,
				row220MeanRgb: row220,
				row220ChannelRange: Math.max(...row220) - Math.min(...row220),
				grayBand: byLabel['gray-band-focus'],
				blueSky: byLabel['blue-sky-control'],
				ground: byLabel['ground-control'],
				image: variant.rendered.image};
		});
		await run.writeJsonArtifact('evidence/aerosol-sweep-analysis.json', {
			schemaId: 'point-local-p6-aerosol-sweep-analysis-v1',
			isolatedControls: browser.result.isolatedControls,
			measurements,
		});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer),
			'P6.3 executes every build on real WebGL2.');
		check(images.length === P6_AEROSOL_VARIANTS.length,
			'All four aerosol renders are preserved before gates.');
		check(browser.result.variants.map((variant) => variant.multiplier).join(',')
			=== P6_AEROSOL_VARIANTS.map((variant) => variant.multiplier).join(','),
			'The sweep executes the frozen aerosol multipliers in order.');
		check(browser.result.variants.every((variant) => variant.schedules.length === 15
			&& variant.schedules.every((schedule) => schedule.compiledCache.finite
				&& schedule.compiledCache.nonnegative
				&& schedule.finalLiveFieldBytes === 0)),
			'Every complete Native15 cache is finite, nonnegative, and releases tracked fields.');
		check(measurements.every((measurement) =>
			[measurement.grayBand, measurement.blueSky, measurement.ground].every((analysis) =>
				analysis.maximumDensityRelativeResidual <= 0.005
				&& analysis.maximumPathRelativeResidual <= 0.005)),
			'Sparse components reconstruct every sweep cache and path within the established 0.5% relative policy.');
		check(browser.result.variants.every((variant) =>
			variant.rendered.webglErrors.length === 0
			&& variant.rendered.resources.cacheDeleted),
			'Every complete cache renders and releases without WebGL errors.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore)
			&& JSON.stringify(await verifyRun(TRACE_RUN)) === JSON.stringify(traceBefore)
			&& JSON.stringify(await verifyRun(CACHE_RUN)) === JSON.stringify(cacheBefore),
			'All source evidence remains immutable during the sweep.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const summary = measurements.map((measurement) => ({
			id: measurement.id, multiplier: measurement.multiplier,
			mieAngstromBeta: measurement.mieAngstromBeta,
			row220MeanRgb: measurement.row220MeanRgb,
			row220ChannelRange: measurement.row220ChannelRange,
			grayBandRayleighShare: measurement.grayBand.rayleighShare,
			grayBandMieShare: measurement.grayBand.mieShare,
			grayBandOrderShares: measurement.grayBand.shares,
			grayBandNative15: measurement.grayBand.referenceNative15,
			blueSkyNative15: measurement.blueSky.referenceNative15,
		}));
		const proof = {proofId: 'point-local-scene-cache-p6-aerosol-sweep-proof-v1',
			accepted: true,
			claimBoundary: 'isolated aerosol-loading causal sweep; no physical aerosol value or production correction selected',
			assertions, summary, images, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.3', accepted: true, summary, images},
			report: `# ${run.runId}: P6.3 aerosol-loading sweep\n\nConclusion: **accepted diagnostic execution**.\n\nAll four renders were preserved before gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, summary, images}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed',
			result: {phase: 'P6.3', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.3 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

