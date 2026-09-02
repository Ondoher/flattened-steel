#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {assertFileInventoriesEqual, createFileInventory, sha256File} from '../../harness/lib/hashes.js';
import {REPOSITORY_ROOT, assertRepositoryIdentity} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr7-integrated-color-reset-sequence.js';
const FIXTURE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cr7-integrated-color-reset-sequence-v1.json';
const HARNESS_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/harness/cr7-integrated-color-reset-sequence-browser.js';
const RUNS_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'color-reset', 'runs');

function repositoryPath(relativePath) { return path.join(REPOSITORY_ROOT, ...relativePath.split('/')); }
function requireCondition(condition, message) { if (!condition) throw new Error(message); }

async function artifact(runId, artifactPath, prefix) {
	const manifest = JSON.parse(await readFile(path.join(RUNS_ROOT, runId, 'artifact-manifest.json'), 'utf8'));
	const record = manifest.artifacts.find(({path: candidate}) => candidate === artifactPath);
	requireCondition(record, `${runId} lacks ${artifactPath}.`);
	return {...record, url: `${prefix}${artifactPath}`};
}

async function protectedInventory() {
	return {
		algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')),
		flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32')),
	};
}

async function main() {
	const fixture = JSON.parse(await readFile(repositoryPath(FIXTURE_RELATIVE_PATH), 'utf8'));
	const run = await initializeColorResetRunRecord({slug: fixture.experiment.slug, command: COMMAND, inputs: {fixture: FIXTURE_RELATIVE_PATH, parents: fixture.parents}, provenance: {purpose: 'CR7 integrated static composition', selectedState: fixture.selectedState}, environment: {node: process.version, platform: process.platform}, references: {plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md'}});
	let finalizationStarted = false;
	try {
		await assertRepositoryIdentity();
		const before = await protectedInventory();
		await run.writeJsonArtifact('evidence/protected-sources-before.json', before);
		for (const [key, runId] of Object.entries(fixture.parents).filter(([key]) => key.endsWith('RunId'))) {
			const verification = await verifyColorResetRun(runId);
			requireCondition(verification.verified && verification.artifactSetSha256 === fixture.parents[key.replace('RunId', 'ArtifactSetSha256')], `CR7 parent ${runId} changed.`);
		}
		const presentationConfig = JSON.parse(await readFile(path.join(RUNS_ROOT, fixture.parents.presentationRunId, 'browser', 'configuration.json'), 'utf8'));
		const scenes = [{
			id: 'solar-noon',
			totalHorizontalIlluminanceLux: 117240.44327776447,
			parentPng: await artifact(fixture.parents.ambientRunId, 'captures/cr3-combined-solar-noon.png', '/ambient/'),
			rawGeometry: null,
		}];
		for (const scene of presentationConfig.scenes) {
			const shared = fixture.sharedGeometryScenes.includes(scene.id);
			scenes.push({
				id: scene.id,
				totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
				parentPng: await artifact(fixture.parents.presentationRunId, `captures/cr6e-mesopic-half-${scene.id}-final-composite.png`, '/presentation/'),
				rawGeometry: shared ? await artifact(fixture.parents.ambientRunId, `data/cr3-predisplay-linear-rgb-y-${scene.id}.f32le`, '/ambient/') : null,
			});
		}
		const configuration = {
			...fixture,
			frozenSkyDisplay: presentationConfig.frozenSkyDisplay,
			scenes,
			inputs: {geometryMask: await artifact(fixture.parents.ambientRunId, 'data/cr3-neutral-geometry-mask.r8', '/ambient/')},
		};
		await run.writeJsonArtifact('browser/configuration.json', configuration);
		const uploadOrder = scenes.map(({id}) => `${fixture.outputs.framePrefix}${id}.png`).concat([fixture.outputs.contactSheet, fixture.outputs.differenceSheet]);
		const browser = await executeColorResetBrowser({run, modulePath: '/lane/harness/cr7-integrated-color-reset-sequence-browser.js', exportName: 'runCr7IntegratedColorResetSequenceBrowser', servedRoots: {'/ambient/': path.join(RUNS_ROOT, fixture.parents.ambientRunId), '/presentation/': path.join(RUNS_ROOT, fixture.parents.presentationRunId)}, allowedArtifactPaths: uploadOrder, uploadLimitBytes: 100 * 1024 * 1024, timeoutMilliseconds: 300000});
		requireCondition(JSON.stringify(browser.result.uploadOrder) === JSON.stringify(uploadOrder), 'CR7 upload order changed.');
		const composed = browser.result.stats.filter(({composed}) => composed);
		const uncomposed = browser.result.stats.filter(({composed}) => !composed);
		const means = fixture.sharedGeometryScenes.map((sceneId) => composed.find((record) => record.sceneId === sceneId).geometryMeanCode);
		const after = await protectedInventory();
		for (const key of Object.keys(before)) assertFileInventoriesEqual(before[key], after[key], `CR7 protected ${key}`);
		const gates = {
			parentsVerified: true,
			frameCount: scenes.length === fixture.gates.integratedFrameCount,
			allImagesBeforeGates: browser.uploads.length === uploadOrder.length,
			sharedGeometrySceneCount: composed.length === fixture.gates.sharedGeometrySceneCount,
			geometryMateriallyPresent: composed.reduce((sum, record) => sum + record.changedGeometryPixelCount, 0) >= fixture.gates.minimumChangedGeometryPixels,
			changesLocalizedToGeometry: composed.every(({changedNonGeometryPixelCount}) => changedNonGeometryPixelCount <= fixture.gates.maximumChangedNonGeometryPixels),
			geometryNotClipped: composed.every(({saturatedGeometryFraction}) => saturatedGeometryFraction <= fixture.gates.maximumSaturatedGeometryFraction),
			geometryStrictlyDims: means[0] > means[1] && means[1] > means[2],
			uncomposedExactReplay: uncomposed.every(({exactParentReplay}) => exactParentReplay === true),
			transitionInputsRetained: uncomposed.some(({sceneId}) => sceneId === 'solar-zenith-108-below') && uncomposed.some(({sceneId}) => sceneId === 'solar-zenith-108-above'),
			protectedSourcesUnchanged: true,
		};
		const accepted = Object.values(gates).every(Boolean);
		const proof = {schemaId: 'algorithm32-color-reset-cr7-integrated-sequence-proof-v1', accepted, appearanceAccepted: false, ownerAppearanceDecisionRequired: true, gates, parents: fixture.parents, selectedState: fixture.selectedState, stats: browser.result.stats, outputs: {uploadOrder}, implementation: {fixture: {path: FIXTURE_RELATIVE_PATH, sha256: await sha256File(repositoryPath(FIXTURE_RELATIVE_PATH))}, harness: {path: HARNESS_RELATIVE_PATH, sha256: await sha256File(repositoryPath(HARNESS_RELATIVE_PATH))}, runner: {path: COMMAND.slice('node '.length), sha256: await sha256File(repositoryPath(COMMAND.slice('node '.length)))}}, claimBoundary: 'Static integration over exact accepted component artifacts; no production or unsampled animation claim.'};
		await run.writeJsonArtifact(fixture.outputs.proof, proof);
		finalizationStarted = true;
		const conclusion = accepted ? 'accepted' : 'rejected';
		const manifest = await run.finalize({conclusion, result: proof, report: `# ${run.runId}: CR7 integrated sequence\n\nConclusion: **${conclusion}** objective evidence; explicit owner appearance approval remains required.\n\nGeometry mean codes: ${means.join(', ')}.\n`});
		const verification = await verifyColorResetRun(run.runId); requireCondition(verification.verified, 'CR7 terminal verification failed.');
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion, artifactSetSha256: manifest.artifactSetSha256, independentlyVerified: true, gates, stats: proof.stats}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) { await run.writeJsonArtifact('evidence/failure.json', {message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null}); await run.finalize({conclusion: 'failed', result: {error: error instanceof Error ? error.message : String(error)}, report: `# ${run.runId}: CR7 failed\n\n${error instanceof Error ? error.message : String(error)}\n`}); }
		throw error;
	}
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
