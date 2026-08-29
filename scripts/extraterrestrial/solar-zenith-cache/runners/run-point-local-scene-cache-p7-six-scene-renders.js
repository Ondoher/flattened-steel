#!/usr/bin/env node

import path from 'node:path';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p7-six-scene-renders.js';
const BASE = '000520-point-local-scene-cache-p3-compiler';
const EXTRA = '000532-point-local-scene-cache-p7-six-scene-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP7SixSceneRendersBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/sixSceneDefinitions.js',
	'solar-zenith-cache/point-local-scene-cache/P6Quadratic30QualificationRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (value, message) => { if (!value) throw new Error(message); };

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [base, extra] = await Promise.all([verifyRun(BASE), verifyRun(EXTRA)]);
	requireCondition(base.verified && extra.verified, 'Six-scene cache inputs are unavailable.');
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p7-six-scene-renders',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p7-six-scene-renders-inputs-v1', sceneCount: 6,
			pathIntegration: 'quadratic 30', sceneObjects: false, renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p7-six-scene-renders-provenance-v1',
			baseCaches: base, incrementalCaches: extra,
			operation: 'render the six requested San Jose Sun states with their point-local Native15 W39 caches and Q30 live view integration'},
		environment: {schemaId: 'point-local-p7-six-scene-renders-environment-v1',
			node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p7-six-scene-renders-references-v1', base, extra}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP7SixSceneRendersBrowser.js',
			exportName: 'runP7SixSceneRendersBrowser', uploadLimitBytes: 12 * 1024 * 1024,
			servedRoots: {'/base/': path.join(RUNS_ROOT, BASE), '/extra/': path.join(RUNS_ROOT, EXTRA)}});
		const images = [];
		for (const render of browser.result.renders) {
			const buffer = browser.uploads.get(`/artifact/${render.sceneId}.png`);
			requireCondition(buffer?.length > 100, `${render.sceneId} image was not uploaded.`);
			const artifactPath = `captures/${render.sceneId}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({sceneId: render.sceneId, timeLabel: render.timeLabel,
				path: artifactPath, bytes: buffer.length});
		}
		await run.writeJsonArtifact('evidence/six-scene-render-analysis.json', browser.result);
		requireCondition(images.length === 6, 'All six requested images must be preserved.');
		requireCondition(browser.result.renders.every(({rendered}) =>
			rendered.webglErrors.length === 0 && rendered.resources.cacheDeleted),
			'Every scene must render without WebGL errors and release its cache texture.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		const proof = {proofId: 'point-local-scene-cache-p7-six-scene-renders-proof-v1',
			accepted: true, claimBoundary: 'requested unconditional scattering renders; no appearance gate',
			images, measurements: browser.result.renders.map(({sceneId, timeLabel,
				solarElevationDegrees, displayGamma, rendered}) => ({sceneId, timeLabel,
				solarElevationDegrees, displayGamma, image: rendered.image})), gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted', result: {accepted: true, ...proof},
			report: `# ${run.runId}: six-scene Q30 renders\n\nConclusion: **accepted execution**. All six images were preserved.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, ...proof}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: six-scene renders failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
