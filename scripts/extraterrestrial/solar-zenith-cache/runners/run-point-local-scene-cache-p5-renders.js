#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p5-renders.js';
const PARENT = '000522-point-local-scene-cache-p4-runtime';
const CACHE_RUN = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/PointLocalSceneCacheRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/runP5Browser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, cacheBefore] = await Promise.all([verifyRun(PARENT), verifyRun(CACHE_RUN)]);
	requireCondition(parentBefore.verified && cacheBefore.verified, 'P4 or P3 parent is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p5-renders',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p5-inputs-v1', renderOrder: ['solar-noon', 'nautical-twilight'],
			renderRegardlessOfAppearance: true, width: 640, height: 400},
		provenance: {schemaId: 'point-local-p5-provenance-v1', parent: parentBefore,
			cacheParent: cacheBefore,
			operation: 'load each complete P3 point-local scene cache as the sole density provider, retain Geometry termination and 15-interval camera integration, render solar noon then nautical twilight unconditionally, and compare fixed horizon/source-axis summaries with preserved runs'},
		environment: {schemaId: 'point-local-p5-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p5-references-v1', parent: parentBefore,
			cacheParent: cacheBefore, comparisons: await Promise.all([
				'000511-san-jose-five-scene-actual-point-scattering',
				'000513-san-jose-solar-noon-near-ground-page',
				'000515-san-jose-solar-noon-validity-aware-runtime',
				'000493-san-jose-nautical-twilight-ozone-f68-w39-preview',
				'000497-san-jose-nautical-twilight-actual-point-j1-control',
				'000509-san-jose-nautical-actual-point-cache-poc',
			].map((id) => verifyRun(id)))},
	});
	try {
		const roots = (id) => path.join(RUNS_ROOT, id);
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP5Browser.js',
			exportName: 'runP5Browser', uploadLimitBytes: 8 * 1024 * 1024,
			servedRoots: {'/p3/': roots(CACHE_RUN),
				'/r511/': roots('000511-san-jose-five-scene-actual-point-scattering'),
				'/r513/': roots('000513-san-jose-solar-noon-near-ground-page'),
				'/r515/': roots('000515-san-jose-solar-noon-validity-aware-runtime'),
				'/r493/': roots('000493-san-jose-nautical-twilight-ozone-f68-w39-preview'),
				'/r497/': roots('000497-san-jose-nautical-twilight-actual-point-j1-control'),
				'/r509/': roots('000509-san-jose-nautical-actual-point-cache-poc')}});
		// Preserve requested images before applying any operational gate.
		const images = ['solar-noon', 'nautical-twilight'].map((sceneId) => ({sceneId,
			buffer: browser.uploads.get(`/artifact/${sceneId}.png`)}));
		for (const image of images) {
			requireCondition(image.buffer?.length > 100, `${image.sceneId} PNG was not uploaded.`);
			await run.writeArtifact(`captures/${image.sceneId}.png`, image.buffer);
		}
		const candidateImages = Object.fromEntries(browser.result.renders.map((render) =>
			[render.sceneId, render.rendered.image]));
		const solarRow220 = candidateImages['solar-noon'].horizonRows['220'];
		const nauticalAxis = candidateImages['nautical-twilight'].sourceAxis;
		const visualComparison = {
			schemaId: 'point-local-scene-cache-p5-visual-comparison-v1',
			candidate: candidateImages,
			solarNoonRow220: {
				candidateMeanRgb: solarRow220,
				historicalMeanRgb: {
					run000511: [12.10, 9.49, 7.89],
					run000513: [145.43, 144.62, 141.62],
					run000515: [80.52, 86.31, 91.74],
				},
				provenance:
					'Canonical row-220 summaries owned by the active topic and runs 000511, 000513, and 000515; candidate measured directly from the P5 framebuffer.',
			},
			nauticalSourceAxis: {
				candidate: {...nauticalAxis,
					flankMean: (nauticalAxis.leftFlank + nauticalAxis.rightFlank) / 2,
					centerMinusFlankMean: nauticalAxis.center
						- (nauticalAxis.leftFlank + nauticalAxis.rightFlank) / 2},
				historical: {
					run000493: 'preserved ozone/F68/W39 N4 source-axis depression control',
					run000497: {actualPointJ1CenterFlankDeficitClosurePercent: 97.20795},
					run000509: 'preserved observer-projected Native15 N4 plausibility render',
				},
				provenance:
					'Runs 000493, 000497, and 000509 remain immutable comparison evidence; P5 applies no subjective threshold.',
			},
		};
		await run.writeJsonArtifact('evidence/visual-comparison.json', visualComparison);
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.renderOrder.join(',') === 'solar-noon,nautical-twilight',
			'Solar noon renders first and nautical twilight second.');
		check(browser.result.renders.every((render) => render.rendered.image.width === 640
			&& render.rendered.image.height === 400 && render.rendered.image.nonBlackPixelCount > 0),
			'Both unconditional 640x400 images contain visible output.');
		check(browser.result.renders.every((render) => render.rendered.webglErrors.length === 0
			&& render.rendered.resources.cacheDeleted),
			'Both renders complete without WebGL errors and release their scene cache.');
		check(browser.result.renders.every((render) =>
			render.rendered.cacheProvider === 'complete point-local P3 scene cache only'
			&& !render.rendered.observerProjectionUsed && !render.rendered.validityMaskUsed
			&& !render.rendered.additiveActualPointCorrectionUsed),
			'No observer page, validity mask, or additive actual-point correction participates.');
		check(browser.result.renders.every((render) => render.rendered.pathIntervalCount === 15),
			'Geometry termination feeds the unchanged 15-interval camera integrator.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore)
			&& JSON.stringify(await verifyRun(CACHE_RUN)) === JSON.stringify(cacheBefore),
			'P4 and P3 parents remain immutable during rendering.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const proof = {proofId: 'point-local-scene-cache-p5-proof-v1', accepted: true,
			claimBoundary: 'operational first-look plausibility renders only; images are preserved without subjective or accuracy gate',
			assertions, result: browser.result,
			images: images.map((image) => ({sceneId: image.sceneId,
				path: `captures/${image.sceneId}.png`, bytes: image.buffer.length}))};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P5', accepted: true, proofId: proof.proofId, images: proof.images,
				metrics: Object.fromEntries(browser.result.renders.map((render) =>
					[render.sceneId, render.rendered.image]))},
			report: `# ${run.runId}: P5 solar-noon and nautical renders\n\nConclusion: **accepted operational execution**.\n\n`
				+ proof.images.map((image) => `- ${image.sceneId}: ${image.bytes} PNG bytes`).join('\n')
				+ '\n\nBoth images were preserved before operational gates; no subjective or accuracy gate was applied.\n'});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, images: proof.images,
			metrics: Object.fromEntries(browser.result.renders.map((render) =>
				[render.sceneId, render.rendered.image]))}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {phase: 'P5', accepted: false,
			error: error.message}, report: `# ${run.runId}: P5 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
