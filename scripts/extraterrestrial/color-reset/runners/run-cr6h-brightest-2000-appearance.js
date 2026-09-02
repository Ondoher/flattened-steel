#!/usr/bin/env node

import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';

import {assertFileInventoriesEqual, createFileInventory, sha256File} from '../../harness/lib/hashes.js';
import {REPOSITORY_ROOT, assertRepositoryIdentity} from '../../harness/lib/roots.js';
import {executeColorResetBrowser} from '../harness/color-reset-browser-run.js';
import {initializeColorResetRunRecord} from '../harness/color-reset-run-record.js';
import {verifyColorResetRun} from './verify-color-reset-run.js';

const COMMAND = 'node scripts/extraterrestrial/color-reset/runners/run-cr6h-brightest-2000-appearance.js';
const FIXTURE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cr6h-brightest-2000-appearance-v1.json';
const HARNESS_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/harness/cr6h-brightest-2000-appearance-browser.js';
const OWNER_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/stellar/Cr6hBrightest2000Appearance.js';
const BASE_FIXTURE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cr6-stellar-contrast-onset-v1.json';
const CIE_RELATIVE_PATH = 'scripts/extraterrestrial/color-reset/fixtures/cie/CIE_sle_scotopic.csv';
const RUNS_ROOT = path.join(REPOSITORY_ROOT, 'tmp', 'extraterrestrial', 'color-reset', 'runs');

function repositoryPath(relativePath) { return path.join(REPOSITORY_ROOT, ...relativePath.split('/')); }
function requireCondition(condition, message) { if (!condition) throw new Error(message); }

async function manifestArtifact(runId, artifactPath, urlPrefix) {
	const root = path.join(RUNS_ROOT, runId);
	const manifest = JSON.parse(await readFile(path.join(root, 'artifact-manifest.json'), 'utf8'));
	const record = manifest.artifacts.find(({path: candidate}) => candidate === artifactPath);
	requireCondition(record, `${runId} lacks ${artifactPath}.`);
	return {...record, url: `${urlPrefix}${artifactPath}`};
}

async function protectedInventory() {
	return {
		algorithm32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'algorithm32')),
		flat32: await createFileInventory(path.join(REPOSITORY_ROOT, 'src', 'flat32')),
	};
}

function compareProtected(before, after) {
	for (const key of Object.keys(before)) assertFileInventoriesEqual(before[key], after[key], `CR6H protected ${key}`);
}

async function main() {
	const fixture = JSON.parse(await readFile(repositoryPath(FIXTURE_RELATIVE_PATH), 'utf8'));
	const baseFixture = JSON.parse(await readFile(repositoryPath(BASE_FIXTURE_RELATIVE_PATH), 'utf8'));
	const run = await initializeColorResetRunRecord({
		slug: fixture.experiment.slug,
		command: COMMAND,
		inputs: {fixture: FIXTURE_RELATIVE_PATH, parents: fixture.parents},
		provenance: {purpose: fixture.experiment.question, transportApproximation: fixture.transportApproximation},
		environment: {node: process.version, platform: process.platform},
		references: {plan: 'agents/topics/extraterrestrial/color-reset-experiment-plan.md'},
	});
	let finalizationStarted = false;
	try {
		await assertRepositoryIdentity();
		const before = await protectedInventory();
		await run.writeJsonArtifact('evidence/protected-sources-before.json', before);
		for (const [key, runId] of Object.entries(fixture.parents).filter(([key]) => key.endsWith('RunId'))) {
			const verification = await verifyColorResetRun(runId);
			const expectedHash = fixture.parents[key.replace('RunId', 'ArtifactSetSha256')];
			requireCondition(verification.verified && verification.artifactSetSha256 === expectedHash, `CR6H parent ${runId} failed verification.`);
		}
		const presentationConfigPath = path.join(RUNS_ROOT, fixture.parents.presentationRunId, 'browser', 'configuration.json');
		const presentationConfig = JSON.parse(await readFile(presentationConfigPath, 'utf8'));
		const selectedRow = presentationConfig.rows.find(({id}) => id === fixture.presentation.rowId);
		requireCondition(selectedRow, 'CR6H selected presentation row is missing.');
		const ledger = await manifestArtifact(fixture.parents.physicalRunId, 'evidence/cr6-member-ledger.json', '/cr6/');
		const roster = await manifestArtifact(fixture.parents.rosterRunId, 'data/cr6b-brightest-2000-roster.json', '/cr6b/');
		const packets = await manifestArtifact(fixture.parents.spectraRunId, 'data/cr6f-brightest-2000-native15-packets.json', '/cr6f/');
		const ciePath = repositoryPath(CIE_RELATIVE_PATH);
		const cieFacts = await stat(ciePath);
		const cie = {path: CIE_RELATIVE_PATH, url: '/lane/fixtures/cie/CIE_sle_scotopic.csv', byteLength: cieFacts.size, sha256: await sha256File(ciePath)};
		const scenes = [];
		for (const scene of presentationConfig.scenes) {
			scenes.push({
				id: scene.id,
				timeIso: scene.timeIso,
				totalHorizontalIlluminanceLux: scene.totalHorizontalIlluminanceLux,
				skyField: await manifestArtifact(fixture.parents.physicalRunId, scene.skyField.path, '/cr6/'),
				sceneHitMask: await manifestArtifact(fixture.parents.physicalRunId, scene.sceneHitMask.path, '/cr6/'),
				controlPng: await manifestArtifact(fixture.parents.presentationRunId, `captures/cr6e-mesopic-half-${scene.id}-final-composite.png`, '/cr6e/'),
			});
		}
		const configuration = {
			...fixture,
			location: baseFixture.location,
			camera: baseFixture.viewport,
			viewport: {widthPixels: 640, heightPixels: 400},
			frozenSkyDisplay: presentationConfig.frozenSkyDisplay,
			presentation: {registryId: presentationConfig.presentation.registryId, filters: selectedRow.filters},
			scenes,
			inputs: {ledger, roster, packets, cie},
		};
		await run.writeJsonArtifact('browser/configuration.json', configuration);
		const uploadOrder = scenes.flatMap(({id}) => [
			`${fixture.outputs.controlPrefix}${id}.png`,
			`${fixture.outputs.candidatePrefix}${id}.png`,
		]).concat([
			fixture.outputs.controlCadence,
			fixture.outputs.candidateCadence,
			fixture.outputs.decisionMatrix,
			fixture.outputs.countPlot,
		]);
		const browser = await executeColorResetBrowser({
			run,
			modulePath: '/lane/harness/cr6h-brightest-2000-appearance-browser.js',
			exportName: 'runCr6hBrightest2000AppearanceBrowser',
			servedRoots: {
				'/cr6/': path.join(RUNS_ROOT, fixture.parents.physicalRunId),
				'/cr6e/': path.join(RUNS_ROOT, fixture.parents.presentationRunId),
				'/cr6b/': path.join(RUNS_ROOT, fixture.parents.rosterRunId),
				'/cr6f/': path.join(RUNS_ROOT, fixture.parents.spectraRunId),
			},
			allowedArtifactPaths: uploadOrder,
			uploadLimitBytes: 80 * 1024 * 1024,
			timeoutMilliseconds: 300000,
		});
		requireCondition(JSON.stringify(browser.result.uploadOrder) === JSON.stringify(uploadOrder), 'CR6H upload order changed.');
		const stats = browser.result.stats;
		const byId = new Map(stats.map((record) => [record.sceneId, record]));
		const chronology = ['sunset', 'sunset-plus-10-minutes', 'sunset-plus-30-minutes', 'sunset-plus-60-minutes', 'sunset-plus-90-minutes'];
		const robustCounts = chronology.map((id) => byId.get(id).robustPixelCount);
		const after = await protectedInventory();
		compareProtected(before, after);
		const gates = {
			parentsVerified: true,
			memberCount: browser.result.memberCount === fixture.gates.memberCount,
			allImagesWrittenBeforeGates: browser.uploads.length === uploadOrder.length,
			sunsetOnset: byId.get('sunset').robustPixelCount <= fixture.gates.sunsetMaximumRobustStars,
			plus10Onset: byId.get('sunset-plus-10-minutes').robustPixelCount <= fixture.gates.plus10MaximumRobustStars,
			plus30Anchor: byId.get('sunset-plus-30-minutes').robustPixelCount >= fixture.gates.plus30MinimumRobustStars,
			progressiveOnset: robustCounts.every((value, index) => index === 0 || value >= robustCounts[index - 1]),
			darkAddedStars: byId.get('sunset-plus-60-minutes').addedRobustPixelCount >= fixture.gates.darkMinimumAddedRobustStars,
			onePixelFootprint: stats.every(({onePixelFootprint}) => onePixelFootprint),
			noSaturation: stats.every(({saturatedStellarPixelCount}) => saturatedStellarPixelCount <= fixture.gates.maximumSaturatedStellarPixels),
			noWhiteCollapse: stats.every(({exactWhiteStellarPixelCount}) => exactWhiteStellarPixelCount <= fixture.gates.maximumExactWhiteStellarPixels),
			transitionContinuous: Math.abs(byId.get('solar-zenith-108-below').robustPixelCount - byId.get('solar-zenith-108-above').robustPixelCount) <= 1,
			protectedSourcesUnchanged: true,
		};
		const accepted = Object.values(gates).every(Boolean);
		const proof = {
			schemaId: 'algorithm32-color-reset-cr6h-brightest-2000-appearance-proof-v1',
			accepted,
			appearanceAccepted: false,
			ownerAppearanceDecisionRequired: true,
			gates,
			parents: fixture.parents,
			stats,
			transportApproximation: fixture.transportApproximation,
			implementation: {
				fixture: {path: FIXTURE_RELATIVE_PATH, sha256: await sha256File(repositoryPath(FIXTURE_RELATIVE_PATH))},
				harness: {path: HARNESS_RELATIVE_PATH, sha256: await sha256File(repositoryPath(HARNESS_RELATIVE_PATH))},
				owner: {path: OWNER_RELATIVE_PATH, sha256: await sha256File(repositoryPath(OWNER_RELATIVE_PATH))},
				runner: {path: COMMAND.slice('node '.length), sha256: await sha256File(repositoryPath(COMMAND.slice('node '.length)))},
			},
			outputs: {uploadOrder},
			claimBoundary: fixture.transportApproximation.claimLimit,
		};
		await run.writeJsonArtifact(fixture.outputs.proof, proof);
		finalizationStarted = true;
		const conclusion = accepted ? 'accepted' : 'rejected';
		const manifest = await run.finalize({conclusion, result: proof, report: `# ${run.runId}: CR6H brightest-2,000 appearance\n\nConclusion: **${conclusion}** objective evidence; owner appearance decision remains required.\n\nAll ${uploadOrder.length} images precede gates. Robust chronology: ${robustCounts.join(', ')}.\n`});
		const verification = await verifyColorResetRun(run.runId);
		requireCondition(verification.verified, 'CR6H terminal verification failed.');
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion, artifactSetSha256: manifest.artifactSetSha256, independentlyVerified: true, gates, stats}, null, 2)}\n`);
	} catch (error) {
		if (!finalizationStarted) {
			await run.writeJsonArtifact('evidence/failure.json', {message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : null});
			await run.finalize({conclusion: 'failed', result: {error: error instanceof Error ? error.message : String(error)}, report: `# ${run.runId}: CR6H failed\n\n${error instanceof Error ? error.message : String(error)}\n`});
		}
		throw error;
	}
}

main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`); process.exitCode = 1; });
