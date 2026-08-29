#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-view-quadrature.js';
const PARENT = '000528-point-local-scene-cache-p6-aerosol-sweep';
const CACHE_RUN = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6ViewQuadratureRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/p6ViewQuadratureTrace.js',
	'solar-zenith-cache/point-local-scene-cache/runP6ViewQuadratureBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

function compareSpectra(left, right) {
	const leftMagnitude = left.reduce((sum, value) => sum + value, 0);
	const rightMagnitude = right.reduce((sum, value) => sum + value, 0);
	const leftShape = left.map((value) => value / leftMagnitude);
	const rightShape = right.map((value) => value / rightMagnitude);
	return {magnitudeRatio: leftMagnitude / rightMagnitude,
		maximumAbsoluteShapeDifference: Math.max(...leftShape.map((value, index) =>
			Math.abs(value - rightShape[index])))};
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, cacheBefore] = await Promise.all([
		verifyRun(PARENT), verifyRun(CACHE_RUN),
	]);
	requireCondition(parentBefore.verified && cacheBefore.verified,
		'P6.3 or canonical cache evidence is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-view-quadrature',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-view-quadrature-inputs-v1',
			variants: [
				{id: 'uniform-15-control', count: 15, distribution: 'uniform'},
				{id: 'quadratic-15', count: 15, distribution: 'quadratic-near-observer'},
				{id: 'quadratic-30', count: 30, distribution: 'quadratic-near-observer'},
				{id: 'quadratic-60', count: 60, distribution: 'quadratic-near-observer'},
			],
			renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p6-view-quadrature-provenance-v1',
			parent: parentBefore, canonicalCache: cacheBefore,
			operation: 'reuse the exact canonical solar-noon cache and Geometry endpoint; compare the retained uniform 15 midpoint rule with correctly weighted piecewise midpoint rules whose distance boundaries follow t=L*u^2 at 15, 30, and 60 intervals'},
		environment: {schemaId: 'point-local-p6-view-quadrature-environment-v1',
			node: process.version, platform: process.platform,
			architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-view-quadrature-references-v1',
			p6AerosolSweep: parentBefore, canonicalCache: cacheBefore,
			p6PathTraces: await verifyRun('000526-point-local-scene-cache-p6-radial-diagnostic')},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6ViewQuadratureBrowser.js',
			exportName: 'runP6ViewQuadratureBrowser', uploadLimitBytes: 8 * 1024 * 1024,
			servedRoots: {'/p3/': path.join(RUNS_ROOT, CACHE_RUN)}});
		const images = [];
		// Preserve all quadrature renders before applying any operational or trend gate.
		for (const variant of browser.result.variants) {
			const buffer = browser.uploads.get(`/artifact/${variant.id}.png`);
			requireCondition(buffer?.length > 100, `${variant.id} image was not uploaded.`);
			const artifactPath = `captures/${variant.id}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({id: variant.id, path: artifactPath, bytes: buffer.length});
		}
		const measurements = browser.result.variants.map((variant) => ({
			id: variant.id,
			pathIntervalCount: variant.pathIntervalCount,
			pathDistribution: variant.pathDistribution,
			image: variant.rendered.image,
			traceSummaries: variant.traceSummaries,
			traces: variant.traces,
		}));
		const byId = Object.fromEntries(measurements.map((measurement) =>
			[measurement.id, measurement]));
		const focusedComparisons = {
			quadratic15ToControl: compareSpectra(
				byId['quadratic-15'].traces[1].finalPathRadianceNative15,
				byId['uniform-15-control'].traces[1].finalPathRadianceNative15),
			quadratic30To60: compareSpectra(
				byId['quadratic-30'].traces[1].finalPathRadianceNative15,
				byId['quadratic-60'].traces[1].finalPathRadianceNative15),
		};
		await run.writeJsonArtifact('evidence/view-quadrature-analysis.json', {
			schemaId: 'point-local-p6-view-quadrature-analysis-v1',
			isolatedControls: browser.result.isolatedControls,
			measurements,
			focusedComparisons,
		});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer),
			'P6.4 executes every render on real WebGL2.');
		check(images.length === 4, 'All four quadrature renders are preserved before gates.');
		check(browser.result.variants.every((variant) =>
			variant.rendered.webglErrors.length === 0
			&& variant.rendered.resources.cacheDeleted
			&& variant.traces.every((trace) =>
				trace.samples.length === variant.pathIntervalCount)),
			'Every render completes, releases the cache texture, and records its complete path stencil.');
		check(byId['uniform-15-control'].image.horizonRows['220']
			.every((value, index) => Math.abs(value
				- [148.7390625, 146.328125, 141.9390625][index]) <= 1e-9),
			'The uniform-15 control reproduces the accepted P5 row-220 result exactly.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore)
			&& JSON.stringify(await verifyRun(CACHE_RUN)) === JSON.stringify(cacheBefore),
			'P6.3 and the canonical cache remain immutable.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const summary = measurements.map((measurement) => ({
			id: measurement.id,
			pathIntervalCount: measurement.pathIntervalCount,
			pathDistribution: measurement.pathDistribution,
			row220MeanRgb: measurement.image.horizonRows['220'],
			grayBandMagnitude: measurement.traceSummaries['gray-band-focus'].magnitude,
			grayBandFirstSample: measurement.traceSummaries['gray-band-focus'].firstSample,
		}));
		const proof = {proofId: 'point-local-scene-cache-p6-view-quadrature-proof-v1',
			accepted: true,
			claimBoundary: 'isolated camera-path quadrature causal control; no final integration rule or production change selected',
			assertions, summary, focusedComparisons, images, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.4', accepted: true, summary,
				focusedComparisons, images},
			report: `# ${run.runId}: P6.4 view-path quadrature\n\nConclusion: **accepted diagnostic execution**.\n\nAll four renders were preserved before gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, summary,
			focusedComparisons, images}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed',
			result: {phase: 'P6.4', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.4 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

