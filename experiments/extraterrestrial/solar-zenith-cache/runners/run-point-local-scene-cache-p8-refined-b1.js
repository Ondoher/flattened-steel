#!/usr/bin/env node

import {execFile} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-refined-b1.js';
const GRID_PARENT = '000563-point-local-scene-cache-p8-refined-grid';
const BASELINE_PARENT = '000545-point-local-scene-cache-b1-non-regression';
const THRESHOLD = 11.820391604126252;
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runB1RefinedGridBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/runB1PointLocalBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/quadratic48PositionDomain.js',
	'solar-zenith-cache/point-local-scene-cache/adaptiveTerminatorSolarZenithDomain.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const executeFile = promisify(execFile);

async function scoreTable(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const score=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1])).get('proposed');"
		+ "if(!score)throw new Error('B1 scorer returned no proposed model.');process.stdout.write(JSON.stringify(score));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 16 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

function tableText(result) {
	const wavelengths = Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index);
	const lines = [['model', 'time', 'grid_x', 'grid_y', ...wavelengths].join('\t')];
	for (let scene = 0; scene < result.sunStates.length; scene += 1) {
		for (let x = 0; x < 9; x += 1) for (let y = 0; y < 9; y += 1) {
			lines.push(['proposed', result.sunStates[scene].time, x, y,
				...result.spectra[scene][x * 9 + y].map((value) => Number(value).toPrecision(17))].join('\t'));
		}
	}
	return `${lines.join('\n')}\n`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [gridParent, baselineParent] = await Promise.all([
		verifyRun(GRID_PARENT), verifyRun(BASELINE_PARENT)]);
	requireCondition(gridParent.verified && gridParent.conclusion === 'accepted', 'Accepted refined-grid parent is unavailable.');
	requireCondition(baselineParent.verified && baselineParent.conclusion === 'accepted', 'Accepted B1 baseline parent is unavailable.');
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-refined-b1',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-refined-b1-inputs-v1', thresholdRmseMilliwatt: THRESHOLD,
			observable: 'unchanged B1 17 times x 81 directions x 31 scored wavelengths',
			physicalInputs: 'Direct40 B1', cache: 'quadratic48 x adaptiveZ188 x W27 x F68 x N4',
			viewIntegration: 'Q30', renderAllFiguresInFollowup: true},
		provenance: {schemaId: 'p8-refined-b1-provenance-v1', gridParent, baselineParent,
			operation: 'rerun the unchanged hard B1 observable through the P8-selected refined cache coordinates'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {gridParent, baselineParent}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runB1RefinedGridBrowser.js',
			exportName: 'runB1RefinedGridBrowser', browserDriver: 'chrome-cdp'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Real WebGL2 is required.');
		requireCondition(result.spectra.length === 17 && result.spectra.every((scene) => scene.length === 81
			&& scene.every((spectrum) => spectrum.length === 40
				&& spectrum.every((value) => Number.isFinite(value) && value >= 0))),
			'Refined B1 table is incomplete or invalid.');
		const tablePath = 'generated/b1-point-local-refined-direct40-w27-q30.tsv';
		await run.writeArtifact(tablePath, tableText(result));
		const absolute = path.join(run.runDirectory, ...tablePath.split('/'));
		const score = await scoreTable(absolute);
		const accepted = score.aggregate.rmseMilliwatt <= THRESHOLD;
		const evidence = {proofId: 'p8-refined-grid-b1-non-regression-v1', accepted,
			metric: 'spectral RMSE over 17 times x 81 directions x 31 wavelengths',
			units: 'mW m^-2 sr^-1 nm^-1', thresholdRmseMilliwatt: THRESHOLD,
			candidateAggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
			deltaFromThresholdMilliwatt: score.aggregate.rmseMilliwatt - THRESHOLD,
			perTime: score.conditionScores.map(({time, rmseMilliwatt, worst}) => ({time, rmseMilliwatt, worst})),
			table: {path: tablePath, sha256: await sha256File(absolute)}, gpu: result.gpu,
			domains: result.domains, ledgers: result.ledgers, sparseProbes: result.sparseProbes,
			wavelengthSummaries: result.wavelengthSummaries,
			claimBoundary: 'Hard Direct40 B1 non-regression for the P8-refined coordinates; no production promotion or resource ceiling.'};
		await run.writeJsonArtifact('evidence/refined-b1.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: accepted ? 'accepted' : 'rejected', result: evidence,
			report: `# ${run.runId}: refined-grid B1 non-regression\n\nConclusion: **${accepted ? 'accepted' : 'rejected'}**.\n\nAggregate RMSE: ${score.aggregate.rmseMilliwatt}; frozen ceiling: ${THRESHOLD}.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			accepted, candidateAggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
			deltaFromThresholdMilliwatt: evidence.deltaFromThresholdMilliwatt,
			perTime: evidence.perTime, domains: result.domains,
			ledgerRange: {minimumBlocks: Math.min(...result.ledgers.map((item) => item.retainedBlockCount)),
				maximumBlocks: Math.max(...result.ledgers.map((item) => item.retainedBlockCount)),
				maximumPackedW27Bytes: Math.max(...result.ledgers.map((item) => item.packedW27Bytes))}}, null, 2)}\n`);
		if (!accepted) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: refined-grid B1 execution failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
