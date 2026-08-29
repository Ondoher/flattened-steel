#!/usr/bin/env node

import path from 'node:path';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p7-scene-objects.js';
const PARENT = '000530-point-local-scene-cache-p6-q30-qualification';
const CACHE_RUN = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6Quadratic30QualificationRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/runP7SceneObjectsBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parent, cache] = await Promise.all([verifyRun(PARENT), verifyRun(CACHE_RUN)]);
	requireCondition(parent.verified && cache.verified, 'Required accepted evidence is unavailable.');
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p7-scene-objects',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p7-scene-objects-inputs-v1',
			pathCounts: [30, 60], scenes: ['solar-noon', 'nautical-twilight'],
			objectPolicy: 'opaque-black analytic ground-anchored boxes', renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p7-scene-objects-provenance-v1', parent,
			canonicalCache: cache, operation: 'intersect camera rays with four ground-anchored 3D boxes at 2.5, 7, 16, and 32 km and use the nearest hit as Geometry path termination'},
		environment: {schemaId: 'point-local-p7-scene-objects-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p7-scene-objects-references-v1', parent, canonicalCache: cache}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP7SceneObjectsBrowser.js',
			exportName: 'runP7SceneObjectsBrowser', uploadLimitBytes: 12 * 1024 * 1024,
			servedRoots: {'/p3/': path.join(RUNS_ROOT, CACHE_RUN)}});
		const images = [];
		for (const render of browser.result.renders) {
			const buffer = browser.uploads.get(`/artifact/${render.id}.png`);
			requireCondition(buffer?.length > 100, `${render.id} was not uploaded.`);
			const artifactPath = `captures/${render.id}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({id: render.id, path: artifactPath, bytes: buffer.length});
		}
		await run.writeJsonArtifact('evidence/scene-object-analysis.json', browser.result);
		requireCondition(images.length === 4, 'All four scene-object images must be preserved.');
		requireCondition(browser.result.renders.every(({rendered}) =>
			rendered.webglErrors.length === 0 && rendered.resources.cacheDeleted),
			'Every scene-object render must complete and release its cache texture.');
		requireCondition(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer), 'Real WebGL2 is required.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p7-scene-objects-proof-v1',
			accepted: true, claimBoundary: 'visual Geometry-shortened object coverage only',
			sceneObjects: browser.result.sceneObjects, images, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P7 scene-object first look', ...proof},
			report: `# ${run.runId}: P7 scene-object first look\n\nConclusion: **accepted visual execution**.\n\nAll four images were preserved before gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, ...proof}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P7 scene-object first look failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
