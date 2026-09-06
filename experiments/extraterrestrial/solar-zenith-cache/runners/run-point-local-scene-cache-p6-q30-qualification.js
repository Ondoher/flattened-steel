#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from
	'../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-q30-qualification.js';
const PARENT = '000529-point-local-scene-cache-p6-view-quadrature';
const CACHE_RUN = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6Quadratic30QualificationRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/p6QuadratureQualificationTrace.js',
	'solar-zenith-cache/point-local-scene-cache/runP6Quadratic30QualificationBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, cacheBefore] = await Promise.all([verifyRun(PARENT), verifyRun(CACHE_RUN)]);
	requireCondition(parentBefore.verified && cacheBefore.verified, 'Parent evidence is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-q30-qualification',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-q30-qualification-inputs-v1',
			candidate: {count: 30, distribution: 't=L*u^2 piecewise midpoint'},
			fullFrameReference: {count: 60, distribution: 't=L*u^2 piecewise midpoint'},
			sparseReference: {count: 960, distribution: 'uniform piecewise midpoint'},
			thresholds: {magnitudeRelativeError: 0.02, maximumAbsoluteShapeDifference: 0.002},
			renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p6-q30-qualification-provenance-v1',
			parent: parentBefore, canonicalCache: cacheBefore,
			operation: 'qualify Q30 against Q60 images and uniform-960 sparse Native15 rays across solar noon, nautical twilight, ground, atmosphere-exit, and opaque-black object-shortened endpoints'},
		environment: {schemaId: 'point-local-p6-q30-qualification-environment-v1',
			node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-q30-qualification-references-v1',
			parent: parentBefore, canonicalCache: cacheBefore},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6Quadratic30QualificationBrowser.js',
			exportName: 'runP6Quadratic30QualificationBrowser', uploadLimitBytes: 12 * 1024 * 1024,
			servedRoots: {'/p3/': path.join(RUNS_ROOT, CACHE_RUN)}});
		const images = [];
		for (const render of browser.result.renders) {
			const buffer = browser.uploads.get(`/artifact/${render.id}.png`);
			requireCondition(buffer?.length > 100, `${render.id} image was not uploaded.`);
			const artifactPath = `captures/${render.id}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({id: render.id, path: artifactPath, bytes: buffer.length});
		}
		await run.writeJsonArtifact('evidence/q30-qualification-analysis.json', browser.result);
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(images.length === 6, 'All six requested images are preserved before numerical gates.');
		check(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer),
			'Qualification executes on real WebGL2.');
		check(browser.result.renders.every(({rendered}) => rendered.webglErrors.length === 0
			&& rendered.resources.cacheDeleted), 'Every render completes without WebGL errors and releases its cache texture.');
		check(browser.result.rayQualifications.every(({candidate, reference}) =>
			candidate.lengthMeters === reference.lengthMeters
			&& candidate.groundHit === reference.groundHit
			&& candidate.objectHit === reference.objectHit),
			'Q30 and uniform-960 use identical Geometry endpoints and endpoint classes.');
		check(browser.result.rayQualifications.every(({comparison}) =>
			comparison.magnitudeRelativeError <= 0.02),
			'Every Q30 sparse spectrum is within 2% magnitude of uniform-960.');
		check(browser.result.rayQualifications.every(({comparison}) =>
			comparison.maximumAbsoluteShapeDifference <= 0.002),
			'Every Q30 sparse spectrum is within 0.002 maximum normalized Native15 shape difference of uniform-960.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore)
			&& JSON.stringify(await verifyRun(CACHE_RUN)) === JSON.stringify(cacheBefore),
			'Parent and canonical cache runs remain immutable.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const worstMagnitude = browser.result.rayQualifications.reduce((worst, ray) =>
			ray.comparison.magnitudeRelativeError > worst.comparison.magnitudeRelativeError ? ray : worst);
		const worstShape = browser.result.rayQualifications.reduce((worst, ray) =>
			ray.comparison.maximumAbsoluteShapeDifference > worst.comparison.maximumAbsoluteShapeDifference ? ray : worst);
		const proof = {proofId: 'point-local-scene-cache-p6-q30-qualification-proof-v1',
			accepted: true, claimBoundary: 'Q30 sparse convergence and endpoint qualification; no production promotion',
			assertions, worstMagnitude: {id: worstMagnitude.id, value: worstMagnitude.comparison.magnitudeRelativeError},
			worstShape: {id: worstShape.id, value: worstShape.comparison.maximumAbsoluteShapeDifference},
			images, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.5', accepted: true, ...proof},
			report: `# ${run.runId}: P6.5 Q30 qualification\n\nConclusion: **accepted**.\n\nAll six images were preserved before gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256, ...proof}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P6.5', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.5 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
