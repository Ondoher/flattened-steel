#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-regression-diagnostics.js';
const PARENT = '000543-point-local-scene-cache-b1-production-order-reference';
const BASELINE = '000539-point-local-scene-cache-b1-regression-diagnostics';
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runB1RegressionDiagnosticsBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/runB1PointLocalBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function modelMap(result) {
	const models = new Map();
	for (const ground of ['grass', 'black']) for (let order = 1; order <= 4; order += 1) {
		models.set(`${ground}-j-through-${order}`, result.orders[ground][order - 1]);
	}
	for (const [name, spectra] of Object.entries(result.quadratures)) models.set(name, spectra);
	return models;
}

function tableText(models) {
	const wavelengths = Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index);
	const times = Array.from({length: 17}, (_unused, index) => {
		const minutes = 9 * 60 + 30 + index * 15;
		return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
	});
	const lines = [['model', 'time', 'grid_x', 'grid_y', ...wavelengths].join('\t')];
	for (const [model, scenes] of models) for (let sceneIndex = 0; sceneIndex < 17; sceneIndex += 1) {
		for (let gridX = 0; gridX < 9; gridX += 1) for (let gridY = 0; gridY < 9; gridY += 1) {
			const spectrum = scenes[sceneIndex][gridX * 9 + gridY];
			lines.push([model, times[sceneIndex], gridX, gridY,
				...spectrum.map((value) => Number(value).toPrecision(17))].join('\t'));
		}
	}
	return `${lines.join('\n')}\n`;
}

async function scoreTable(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const scores=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1]));"
		+ "process.stdout.write(JSON.stringify(Object.fromEntries(scores)));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 32 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

function summarizeScores(scores) {
	return Object.fromEntries(Object.entries(scores).map(([model, score]) => [model, {
		aggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
		perTime: score.conditionScores.map(({time, rmseMilliwatt, worst}) => ({time, rmseMilliwatt, worst})),
	}]));
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'accepted',
		'Accepted current-Algorithm32 order reference is unavailable.');
	const baseline = await verifyRun(BASELINE);
	requireCondition(baseline.verified && baseline.conclusion === 'accepted',
		'Accepted pre-correction B1 diagnostic baseline is unavailable.');
	const baselinePath = path.resolve('tmp/extraterrestrial/runs', BASELINE, 'evidence/diagnostics.json');
	const baselineEvidence = JSON.parse(await readFile(baselinePath, 'utf8'));
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-b1-regression-diagnostics',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-b1-regression-diagnostics-inputs-v1', parentRunId: PARENT,
			baselineRunId: BASELINE, correction: 'binary32-safe exact-ground distant-source visibility',
			orderBoundaries: [1, 2, 3, 4], grounds: ['B1 grass', 'canonical black'],
			viewQuadratures: ['quadratic 30', 'uniform 40', 'quadratic 240'],
			worstResidual: {time: '11:00', gridX: 3, gridY: 6, wavelengthNanometers: 477.5}},
		provenance: {schemaId: 'point-local-b1-regression-diagnostics-provenance-v1', parent, baseline,
			baselineEvidence: {path: 'evidence/diagnostics.json', sha256: await sha256File(baselinePath)},
			operation: 'repeat the complete mapping, order, ground, quadrature, and sparse-reconstruction ladder after correcting exact-ground source visibility under binary32 roundoff'},
		environment: {schemaId: 'point-local-b1-regression-diagnostics-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-b1-regression-diagnostics-references-v1', parent, baseline}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runB1RegressionDiagnosticsBrowser.js',
			exportName: 'runB1RegressionDiagnosticsBrowser'});
		requireCondition(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer), 'Real WebGL2 is required.');
		requireCondition(browser.result.mappingAudits.every((audit) => audit.sourceAxisError <= 2e-15
			&& audit.maximumCosineDifference <= 2e-15), 'B1 observation mapping does not close analytically.');
		const models = modelMap(browser.result);
		const tablePath = 'generated/b1-regression-diagnostic-models.tsv';
		await run.writeArtifact(tablePath, tableText(models));
		const absoluteTablePath = path.join(run.runDirectory, ...tablePath.split('/'));
		const scores = summarizeScores(await scoreTable(absoluteTablePath));
		const candidate = scores.q30.aggregateRmseMilliwatt;
		requireCondition(Number.isFinite(candidate), 'Corrected diagnostic Q30 score is not finite.');
		const firstJ1Sample = browser.result.reconstruction.find((item) => item.order === 1
			&& item.sampleIndex === 0 && item.wavelengthIndex === 10);
		requireCondition(firstJ1Sample !== undefined, 'Corrected diagnostic lacks the focused first J1 sample.');
		const boundaryTaps = firstJ1Sample.tapValues.filter((tap) => tap.altitudeIndex === 0);
		requireCondition(boundaryTaps.length > 0 && boundaryTaps.every((tap) => tap.value > 0),
			'Above-horizon exact-ground J1 taps remain zero after the boundary correction.');
		const baselineAggregates = Object.fromEntries(Object.entries(baselineEvidence.scores)
			.map(([name, score]) => [name, score.aggregateRmseMilliwatt]));
		const aggregateChanges = Object.fromEntries(Object.entries(scores).map(([name, score]) => [name,
			score.aggregateRmseMilliwatt - baselineAggregates[name]]));
		const evidence = {proofId: 'point-local-b1-regression-diagnostics-v1', accepted: true,
			parentRunId: PARENT, baselineRunId: BASELINE,
			tablePath, tableSha256: await sha256File(absoluteTablePath),
			gpu: browser.result.gpu, mappingAudits: browser.result.mappingAudits,
			scores, baselineAggregates, aggregateChanges,
			exactGroundBoundary: {focusedSample: firstJ1Sample, allAboveHorizonJ1TapsPositive: true},
			reconstruction: browser.result.reconstruction,
			solver: {summaryCount: browser.result.solverSummaries.length,
				maximumAccumulationResidual: Math.max(...browser.result.solverSummaries.map((item) => item.maximumAccumulationResidual)),
				peakLiveFieldBytes: Math.max(...browser.result.solverSummaries.map((item) => item.peakLiveFieldBytes)),
				allReleased: browser.result.solverSummaries.every((item) => item.finalLiveFieldBytes === 0)},
			claimBoundary: 'Exact-ground visibility correction plus repeated B1 mapping, cumulative-order, ground, view-quadrature, and sparse reconstruction attribution; no production promotion'};
		await run.writeJsonArtifact('evidence/diagnostics.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
			report: `# ${run.runId}: B1 exact-ground boundary correction diagnostics\n\nConclusion: **accepted diagnostic evidence**.\n\nThe complete ladder was repeated after the binary32-safe exact-ground source-visibility correction. See evidence/diagnostics.json.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			aggregates: Object.fromEntries(Object.entries(scores).map(([name, score]) => [name, score.aggregateRmseMilliwatt])),
			mappingMaximum: Math.max(...browser.result.mappingAudits.map((audit) => audit.maximumCosineDifference))}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: B1 regression diagnostics failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
