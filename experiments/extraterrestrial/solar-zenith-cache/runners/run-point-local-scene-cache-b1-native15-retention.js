#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-native15-retention.js';
const PARENT = '000545-point-local-scene-cache-b1-non-regression';
const THRESHOLD = 11.820391604126252;
const DIRECT40_SCORE = 11.554012538468113;
const DIRECT40_TABLE = 'generated/b1-point-local-direct40-w27-q30.tsv';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runB1Native15ComparisonBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/runB1PointLocalBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

async function scoreCandidate(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const score=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1])).get('proposed');"
		+ "if(!score)throw new Error('B1 scorer returned no proposed model.');process.stdout.write(JSON.stringify(score));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024, windowsHide: true});
	return JSON.parse(result.stdout);
}

function tableText(result, spectra, wavelengths, model = 'proposed') {
	const lines = [['model', 'time', 'grid_x', 'grid_y', ...wavelengths.map(String)].join('\t')];
	for (let sceneIndex = 0; sceneIndex < result.sunStates.length; sceneIndex += 1) {
		for (let gridX = 0; gridX < 9; gridX += 1) for (let gridY = 0; gridY < 9; gridY += 1) {
			const directionIndex = gridX * 9 + gridY;
			lines.push([model, result.sunStates[sceneIndex].time, gridX, gridY,
				...spectra[sceneIndex][directionIndex].map((value) => Number(value).toPrecision(17))].join('\t'));
		}
	}
	return `${lines.join('\n')}\n`;
}

function parseDirect40(text) {
	const lines = text.trim().split(/\r?\n/u);
	const header = lines.shift().split('\t');
	requireCondition(header.length === 44, 'Direct40 parent table has an unexpected schema.');
	return new Map(lines.map((line) => {
		const fields = line.split('\t');
		return [`${fields[1]}:${fields[2]}:${fields[3]}`, fields.slice(4).map(Number)];
	}));
}

function compareRepresentations(result, directRows) {
	let allSquared = 0, scoredSquared = 0, allCount = 0, scoredCount = 0;
	let maximumAbsolute = {milliwatt: -1};
	const perTime = [];
	for (let sceneIndex = 0; sceneIndex < result.sunStates.length; sceneIndex += 1) {
		let timeSquared = 0, timeCount = 0;
		for (let gridX = 0; gridX < 9; gridX += 1) for (let gridY = 0; gridY < 9; gridY += 1) {
			const directionIndex = gridX * 9 + gridY;
			const direct = directRows.get(`${result.sunStates[sceneIndex].time}:${gridX}:${gridY}`);
			requireCondition(direct?.length === 40, 'Direct40 parent table is incomplete.');
			const reconstructed = result.reconstructedDirect40Spectra[sceneIndex][directionIndex];
			for (let wavelengthIndex = 0; wavelengthIndex < 40; wavelengthIndex += 1) {
				const difference = reconstructed[wavelengthIndex] - direct[wavelengthIndex];
				const square = difference * difference;
				allSquared += square; allCount += 1;
				if (wavelengthIndex <= 30) {
					scoredSquared += square; scoredCount += 1;
					timeSquared += square; timeCount += 1;
				}
				const milliwatt = Math.abs(difference) * 1000;
				if (milliwatt > maximumAbsolute.milliwatt) maximumAbsolute = {milliwatt,
					time: result.sunStates[sceneIndex].time, gridX, gridY,
					wavelengthNanometers: 360 + 11.75 * wavelengthIndex,
					direct40: direct[wavelengthIndex], native15Reconstructed: reconstructed[wavelengthIndex]};
			}
		}
		perTime.push({time: result.sunStates[sceneIndex].time,
			scored31RmseMilliwatt: Math.sqrt(timeSquared / timeCount) * 1000});
	}
	return {all40RmseMilliwatt: Math.sqrt(allSquared / allCount) * 1000,
		scored31RmseMilliwatt: Math.sqrt(scoredSquared / scoredCount) * 1000,
		maximumAbsolute, perTime};
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'accepted', 'Accepted Direct40 parent is unavailable.');
	const direct40Path = path.join(RUNS_ROOT, PARENT, ...DIRECT40_TABLE.split('/'));
	const scorerPath = path.join(process.cwd(), 'scripts', 'experiments',
		'b1-directional-sky-radiance', 'benchmark.js');
	const [direct40Text, direct40Sha256, scorerSha256] = await Promise.all([
		readFile(direct40Path, 'utf8'), sha256File(direct40Path), sha256File(scorerPath)]);
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-b1-native15-retention',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-b1-native15-retention-inputs-v1', parentRunId: PARENT,
			thresholdRmseMilliwatt: THRESHOLD,
			spectralRepresentation: 'Native15 equal-width 360-830 nm bin-average physical inputs',
			reconstruction: 'canonical B1 piecewise-constant Direct40 hold', incoming: 'reflection-completed F68',
			outgoing: 'W27', scatteringOrder: 4, viewQuadrature: 'quadratic-near-observer Q30',
			observable: '17 times x 81 directions x 31 scored wavelengths'},
		provenance: {schemaId: 'point-local-b1-native15-retention-provenance-v1', parent,
			operation: 'average Direct40 physical inputs into canonical Native15 bins, execute actual GPU scene-cache recurrence at 15 channels, reconstruct Direct40 coordinates by canonical piecewise-constant hold, and score unchanged B1 boundary',
			direct40Parent: {runId: PARENT, tablePath: DIRECT40_TABLE, tableSha256: direct40Sha256},
			readOnlyScoringOracle: {path: 'scripts/experiments/b1-directional-sky-radiance/benchmark.js', sha256: scorerSha256}},
		environment: {schemaId: 'point-local-b1-native15-retention-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-b1-native15-retention-references-v1', parent}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runB1Native15ComparisonBrowser.js',
			exportName: 'runB1Native15ComparisonBrowser'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Real WebGL2 is required.');
		requireCondition(result.native15Spectra.length === 17
			&& result.native15Spectra.every((scene) => scene.length === 81
				&& scene.every((spectrum) => spectrum.length === 15
					&& spectrum.every((value) => Number.isFinite(value) && value >= 0))),
			'Browser did not return the complete finite nonnegative Native15 table.');
		requireCondition(result.reconstructedDirect40Spectra.every((scene) => scene.length === 81
			&& scene.every((spectrum) => spectrum.length === 40 && spectrum.every(Number.isFinite))),
			'Browser did not return the complete reconstructed Direct40 table.');
		const nativePath = 'generated/b1-point-local-native15-w27-q30.tsv';
		const reconstructedPath = 'generated/b1-point-local-native15-reconstructed-direct40-w27-q30.tsv';
		const directWavelengths = Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index);
		await run.writeArtifact(nativePath, tableText(result, result.native15Spectra,
			result.native15CentersNanometers, 'point-local-native15'));
		await run.writeArtifact(reconstructedPath, tableText(result, result.reconstructedDirect40Spectra,
			directWavelengths));
		const nativeAbsolute = path.join(run.runDirectory, ...nativePath.split('/'));
		const reconstructedAbsolute = path.join(run.runDirectory, ...reconstructedPath.split('/'));
		const [nativeSha256, reconstructedSha256, score] = await Promise.all([
			sha256File(nativeAbsolute), sha256File(reconstructedAbsolute), scoreCandidate(reconstructedAbsolute)]);
		const representation = compareRepresentations(result, parseDirect40(direct40Text));
		const gatePassed = score.aggregate.rmseMilliwatt <= THRESHOLD;
		const evidence = {proofId: 'point-local-scene-cache-b1-native15-retention-v1', accepted: gatePassed,
			metric: 'spectral RMSE over 17 times x 81 directions x 31 scored wavelengths',
			units: 'mW m^-2 sr^-1 nm^-1', thresholdRmseMilliwatt: THRESHOLD,
			direct40AggregateRmseMilliwatt: DIRECT40_SCORE,
			candidateAggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
			deltaFromDirect40Milliwatt: score.aggregate.rmseMilliwatt - DIRECT40_SCORE,
			deltaFromThresholdMilliwatt: score.aggregate.rmseMilliwatt - THRESHOLD,
			perTime: score.conditionScores.map(({time, rmseMilliwatt, worst}) => ({time, rmseMilliwatt, worst})),
			representationDifferenceFromDirect40: representation,
			tables: {native15: {path: nativePath, sha256: nativeSha256},
				reconstructedDirect40: {path: reconstructedPath, sha256: reconstructedSha256},
				direct40Parent: {runId: PARENT, path: DIRECT40_TABLE, sha256: direct40Sha256}},
			projection: {native15CentersNanometers: result.native15CentersNanometers,
				direct40ToNative15Indices: result.projectionIndices, inputChannels: result.inputChannels},
			gpu: result.gpu, ledgers: result.ledgers, sparseProbes: result.sparseProbes,
			wavelengthSummaries: result.wavelengthSummaries,
			readOnlyScoringOracle: {path: 'scripts/experiments/b1-directional-sky-radiance/benchmark.js', sha256: scorerSha256},
			claimBoundary: 'Actual Native15 point-local B1 retention only; no Bruneton-score, interpolation, resource, display, or production-promotion claim'};
		await run.writeJsonArtifact('evidence/b1-native15-retention.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const report = `# ${run.runId}: point-local Native15 B1 retention\n\nConclusion: **${gatePassed ? 'accepted' : 'rejected'}**.\n\nNative15 aggregate RMSE: ${score.aggregate.rmseMilliwatt} mW m^-2 sr^-1 nm^-1.\n\nDirect40 parent: ${DIRECT40_SCORE} mW m^-2 sr^-1 nm^-1.\n\nFrozen threshold: ${THRESHOLD} mW m^-2 sr^-1 nm^-1.\n`;
		const terminal = await run.finalize({conclusion: gatePassed ? 'accepted' : 'rejected', result: evidence, report});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			...evidence}, null, 2)}\n`);
		if (!gatePassed) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: Native15 B1 execution failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
