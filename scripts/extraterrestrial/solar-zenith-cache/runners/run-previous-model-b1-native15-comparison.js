#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {B1_DIRECT40_TO_NATIVE15_INDICES, B1_SUN_STATES} from '../point-local-scene-cache/b1PointLocalInputs.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-previous-model-b1-native15-comparison.js';
const PREVIOUS_DIRECT40_RUN = '000479-b1-reflection-completed-fibonacci68-full-figures';
const POINT_DIRECT40_RUN = '000545-point-local-scene-cache-b1-non-regression';
const POINT_NATIVE15_RUN = '000549-point-local-scene-cache-b1-native15-retention';
const SOURCE_GPU_RUN = '000556-previous-model-b1-native15-comparison';
const SOURCES = [ENTRY,'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js'];
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

async function scoreTable(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const score=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1])).get('proposed');"
		+ "if(!score)throw new Error('B1 scorer returned no proposed model.');process.stdout.write(JSON.stringify(score));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024, windowsHide: true});
	return JSON.parse(result.stdout);
}

function tableText(spectra) {
	const wavelengths = Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index);
	const lines = [['model', 'time', 'grid_x', 'grid_y', ...wavelengths.map(String)].join('\t')];
	for (let sceneIndex = 0; sceneIndex < B1_SUN_STATES.length; sceneIndex += 1) {
		for (let gridX = 0; gridX < 9; gridX += 1) for (let gridY = 0; gridY < 9; gridY += 1) {
			const sourceIndex = gridY * 9 + gridX;
			lines.push(['proposed', B1_SUN_STATES[sceneIndex].time, gridX, gridY,
				...spectra[sceneIndex][sourceIndex].map((value) => Number(value).toPrecision(17))].join('\t'));
		}
	}
	return `${lines.join('\n')}\n`;
}

function duplicateConsistency(spectra) {
	let maximumAbsolute = {value: -1};
	for (let sceneIndex = 0; sceneIndex < spectra.length; sceneIndex += 1) {
		for (let directionIndex = 0; directionIndex < spectra[sceneIndex].length; directionIndex += 1) {
			const spectrum = spectra[sceneIndex][directionIndex];
			for (let left = 0; left < 40; left += 1) for (let right = left + 1; right < 40; right += 1) {
				if (B1_DIRECT40_TO_NATIVE15_INDICES[left] !== B1_DIRECT40_TO_NATIVE15_INDICES[right]) continue;
				const value = Math.abs(spectrum[left] - spectrum[right]);
				if (value > maximumAbsolute.value) maximumAbsolute = {value,
					time: B1_SUN_STATES[sceneIndex].time, directionIndex,
					leftWavelengthNanometers: 360 + 11.75 * left,
					rightWavelengthNanometers: 360 + 11.75 * right};
			}
		}
	}
	return maximumAbsolute;
}

function parseBrowserResult(html) {
	const marker = '<pre id="result">';
	const start = html.indexOf(marker) + marker.length;
	const finish = html.indexOf('</pre>', start);
	requireCondition(start >= marker.length && finish > start, 'Source GPU browser DOM has no result payload.');
	return JSON.parse(html.slice(start, finish));
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [pointDirect, pointNative, sourceGpuRun] = await Promise.all([
		verifyRun(POINT_DIRECT40_RUN), verifyRun(POINT_NATIVE15_RUN), verifyRun(SOURCE_GPU_RUN)]);
	requireCondition(pointDirect.verified && pointDirect.conclusion === 'accepted', 'Point-local Direct40 run is unavailable.');
	requireCondition(pointNative.verified && pointNative.conclusion === 'rejected', 'Point-local Native15 run is unavailable.');
	requireCondition(sourceGpuRun.verified && sourceGpuRun.conclusion === 'failed', 'Sealed completed GPU source is unavailable.');
	const previousDirectPath = path.join(RUNS_ROOT, PREVIOUS_DIRECT40_RUN, 'generated',
		'b1-directional-sky-radiance', 'gpu', 'algorithm32-current-production-gpu-j4.tsv');
	const pointDirectPath = path.join(RUNS_ROOT, POINT_DIRECT40_RUN, 'generated',
		'b1-point-local-direct40-w27-q30.tsv');
	const pointNativePath = path.join(RUNS_ROOT, POINT_NATIVE15_RUN, 'generated',
		'b1-point-local-native15-reconstructed-direct40-w27-q30.tsv');
	const pointNativeEvidencePath = path.join(RUNS_ROOT, POINT_NATIVE15_RUN, 'evidence', 'b1-native15-retention.json');
	const sourceBrowserPath = path.join(RUNS_ROOT, SOURCE_GPU_RUN, 'browser', 'dom.html');
	const [pointNativeEvidence, previousDirectSha256, pointDirectSha256, pointNativeSha256,
		sourceBrowserHtml, sourceBrowserSha256] = await Promise.all([
		readFile(pointNativeEvidencePath, 'utf8').then(JSON.parse), sha256File(previousDirectPath),
		sha256File(pointDirectPath), sha256File(pointNativePath), readFile(sourceBrowserPath,'utf8'), sha256File(sourceBrowserPath)]);
	requireCondition(previousDirectSha256 === 'd366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f',
		'Pinned legacy previous Direct40 table drifted.');
	const previousDirect = {runId: PREVIOUS_DIRECT40_RUN, legacyRunFormat: true,
		verifiedByPinnedTableSha256: previousDirectSha256, conclusion: 'accepted'};
	const run = await initializeRunRecord({slug: 'previous-model-b1-native15-comparison',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'previous-model-b1-native15-comparison-inputs-v1',
			previousDirect40RunId: PREVIOUS_DIRECT40_RUN, pointDirect40RunId: POINT_DIRECT40_RUN,
			pointNative15RunId: POINT_NATIVE15_RUN, conditions: B1_SUN_STATES.map(({time}) => time),
			incoming: 'reflection-completed F68', outgoing: 'W27', scatteringOrder: 4,
			native15Rule: 'identical run-000549 bin-average physical inputs and canonical piecewise hold'},
		provenance: {schemaId: 'previous-model-b1-native15-comparison-provenance-v1',
			parents: {previousDirect, pointDirect, pointNative, sourceGpuRun},
			operation: 'recover the complete 34-build GPU payload sealed by the post-disposal-metadata failure, verify its Direct40 reproduction and duplicate-slot equality, and score the algebraically equivalent Native15-plus-piecewise-hold boundary',
			sourceGpuPayload:{runId:SOURCE_GPU_RUN,path:'browser/dom.html',sha256:sourceBrowserSha256},
			controls: {previousDirect40: {path: previousDirectPath, sha256: previousDirectSha256},
				pointDirect40: {path: pointDirectPath, sha256: pointDirectSha256},
				pointNative15: {path: pointNativePath, sha256: pointNativeSha256}}},
		environment: {schemaId: 'previous-model-b1-native15-comparison-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {previousDirect, pointDirect, pointNative, sourceGpuRun}});
	try {
		const generated = parseBrowserResult(sourceBrowserHtml);
		requireCondition(generated.schemaId === 'previous-model-direct40-native15-browser-v1',
			'Source GPU payload has the wrong schema.');
		const nativeControl = generated.profiles.find((profile) =>
			profile.native15Control.spectralMode === 'native15-equivalent').native15Control;
		requireCondition(JSON.stringify(nativeControl.nativeChannels)
			=== JSON.stringify(pointNativeEvidence.projection.inputChannels),
			'Previous-model profile does not carry the exact point-local Native15 physical inputs.');
		for (const [label, spectra] of [['Direct40', generated.direct40], ['Native15', generated.native15Equivalent]]) {
			requireCondition(spectra.length === 17 && spectra.every((scene) => scene.length === 81
				&& scene.every((spectrum) => spectrum.length === 40
					&& spectrum.every((value) => Number.isFinite(value) && value >= 0))),
				`${label} snapshot output is incomplete.`);
		}
		const consistency = duplicateConsistency(generated.native15Equivalent);
		requireCondition(consistency.value === 0, `Duplicated Native15 physical slots diverged by ${consistency.value}.`);
		const directReproductionPath = 'generated/b1-previous-model-snapshot-direct40.tsv';
		const tablePath = 'generated/b1-previous-model-native15-reconstructed-direct40.tsv';
		await run.writeArtifact(directReproductionPath, tableText(generated.direct40));
		await run.writeArtifact(tablePath, tableText(generated.native15Equivalent));
		const tableAbsolute = path.join(run.runDirectory, ...tablePath.split('/'));
		const directReproductionAbsolute = path.join(run.runDirectory, ...directReproductionPath.split('/'));
		const [tableSha256,directReproductionSha256,previousNativeScore,previousDirectReproductionScore,
			previousDirectScore,pointDirectScore,pointNativeScore] = await Promise.all([
			sha256File(tableAbsolute),sha256File(directReproductionAbsolute),scoreTable(tableAbsolute),
			scoreTable(directReproductionAbsolute),scoreTable(previousDirectPath),scoreTable(pointDirectPath),scoreTable(pointNativePath)]);
		const directReproductionDelta=previousDirectReproductionScore.aggregate.rmseMilliwatt-previousDirectScore.aggregate.rmseMilliwatt;
		requireCondition(Math.abs(directReproductionDelta) <= 1e-6,
			`Contained snapshot did not reproduce the previous Direct40 score: delta ${directReproductionDelta}.`);
		const matrix = {previousAlgorithm32: {direct40: previousDirectScore.aggregate.rmseMilliwatt,
			native15: previousNativeScore.aggregate.rmseMilliwatt,
			native15Penalty: previousNativeScore.aggregate.rmseMilliwatt - previousDirectScore.aggregate.rmseMilliwatt},
		pointLocal: {direct40: pointDirectScore.aggregate.rmseMilliwatt,
			native15: pointNativeScore.aggregate.rmseMilliwatt,
			native15Penalty: pointNativeScore.aggregate.rmseMilliwatt - pointDirectScore.aggregate.rmseMilliwatt}};
		const fairGatePassed = matrix.pointLocal.native15 <= matrix.previousAlgorithm32.native15;
		const evidence = {proofId: 'previous-model-b1-native15-fair-comparison-v1', accepted: fairGatePassed,
			metric: 'spectral RMSE over 17 times x 81 directions x 31 scored wavelengths',
			units: 'mW m^-2 sr^-1 nm^-1', matrix,
			matchedNative15DeltaPointLocalMinusPrevious: matrix.pointLocal.native15 - matrix.previousAlgorithm32.native15,
			matchedDirect40DeltaPointLocalMinusPrevious: matrix.pointLocal.direct40 - matrix.previousAlgorithm32.direct40,
			penaltyDifferencePointLocalMinusPrevious: matrix.pointLocal.native15Penalty - matrix.previousAlgorithm32.native15Penalty,
			previousNative15PerTime: previousNativeScore.conditionScores,
			direct40Reproduction: {score:previousDirectReproductionScore.aggregate.rmseMilliwatt,
				deltaFromSealedPrevious:directReproductionDelta,path:directReproductionPath,sha256:directReproductionSha256},
			duplicateSlotConsistency: consistency, physicalInputIdentity: nativeControl,
			table: {path: tablePath, sha256: tableSha256}, gpu:generated.gpu, profiles:generated.profiles,
			sourceGpuPayload:{runId:SOURCE_GPU_RUN,path:'browser/dom.html',sha256:sourceBrowserSha256,
				completion:'34 complete cache outputs; source run failed only while reading context identity after disposal'},
			claimBoundary: 'Matched spectral-accuracy comparison only. The duplicated 40-slot execution proves the Native15-plus-hold result but makes no Native15 memory, GPU-work, or timing claim.'};
		await run.writeJsonArtifact('evidence/fair-native15-comparison.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: fairGatePassed ? 'accepted' : 'rejected', result: evidence,
			report: `# ${run.runId}: fair previous-model Native15 comparison\n\nConclusion: **${fairGatePassed ? 'accepted' : 'rejected'}**.\n\nPrevious Native15 RMSE: ${matrix.previousAlgorithm32.native15}.\n\nPoint-local Native15 RMSE: ${matrix.pointLocal.native15}.\n`});
		process.stdout.write(`${JSON.stringify({runId:run.runId,artifactSetSha256:terminal.artifactSetSha256,...evidence},null,2)}\n`);
		if (!fairGatePassed) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message:error.message,stack:error.stack});
		await run.finalize({conclusion:'failed',result:{accepted:false,error:error.message},
			report:`# Previous-model Native15 comparison failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
