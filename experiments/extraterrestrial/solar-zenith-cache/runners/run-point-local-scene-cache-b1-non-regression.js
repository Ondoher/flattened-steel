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

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-non-regression.js';
const PARENT = '000544-point-local-scene-cache-b1-regression-diagnostics';
const BASELINE = '000479-b1-reflection-completed-fibonacci68-full-figures';
const THRESHOLD = 11.820391604126252;
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runB1PointLocalBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/buildInventoryLedger.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const executeFile = promisify(execFile);

async function scoreCandidate(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const score=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1])).get('proposed');"
		+ "if(!score)throw new Error('B1 scorer returned no proposed model.');process.stdout.write(JSON.stringify(score));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024, windowsHide: true});
	return JSON.parse(result.stdout);
}

function tableText(result) {
	const wavelengths = Array.from({length: 40}, (_unused, index) => 360 + 11.75 * index);
	const lines = [['model', 'time', 'grid_x', 'grid_y', ...wavelengths.map((value) => `${value}`)].join('\t')];
	for (let sceneIndex = 0; sceneIndex < result.sunStates.length; sceneIndex += 1) {
		for (let gridX = 0; gridX < 9; gridX += 1) for (let gridY = 0; gridY < 9; gridY += 1) {
			const directionIndex = gridX * 9 + gridY;
			lines.push(['proposed', result.sunStates[sceneIndex].time, gridX, gridY,
				...result.spectra[sceneIndex][directionIndex].map((value) => Number(value).toPrecision(17))].join('\t'));
		}
	}
	return `${lines.join('\n')}\n`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const scorerPath = path.join(process.cwd(), 'scripts', 'experiments',
		'b1-directional-sky-radiance', 'benchmark.js');
	const scorerSha256 = await sha256File(scorerPath);
	const parent = await verifyRun(PARENT);
	const baselineRoot = path.join(RUNS_ROOT, BASELINE);
	const baselineResultPath = path.join(baselineRoot, 'result.json');
	const baselineTablePath = path.join(baselineRoot, 'generated', 'b1-directional-sky-radiance',
		'gpu', 'algorithm32-current-production-gpu-j4.tsv');
	const [baselineResult, baselineResultSha256, baselineTableSha256] = await Promise.all([
		readFile(baselineResultPath, 'utf8').then(JSON.parse), sha256File(baselineResultPath), sha256File(baselineTablePath)]);
	requireCondition(parent.verified, 'P7 parent is unavailable.');
	requireCondition(baselineResult.comparison.candidate.aggregateRmseMilliwatt === THRESHOLD
		&& baselineTableSha256 === 'd366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f',
		'Frozen legacy B1 baseline identity or score drifted.');
	const baseline = {runId: BASELINE, legacyRunFormat: true, resultSha256: baselineResultSha256,
		tablePath: path.relative(process.cwd(), baselineTablePath).replaceAll('\\', '/'), tableSha256: baselineTableSha256,
		aggregateRmseMilliwatt: THRESHOLD};
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-b1-non-regression',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-b1-non-regression-inputs-v1', baselineRunId: BASELINE,
			thresholdRmseMilliwatt: THRESHOLD, wavelengths: 'Direct40', incoming: 'reflection-completed F68',
			outgoing: 'W27', scatteringOrder: 4, viewQuadrature: 'quadratic-near-observer Q30',
			boundaryCorrection: 'binary32-safe exact-ground source visibility and inward transport rejection',
			observable: '17 times x 81 directions x 31 scored wavelengths'},
		provenance: {schemaId: 'point-local-b1-non-regression-provenance-v1', parent, baseline,
			operation: 'stream Direct40 through the actual-point point-local N4 scene-cache compiler, packed lookup, Geometry atmosphere endpoint, and Q30 view integration; score unchanged B1 measurement boundary',
			readOnlyScoringOracle: {path: 'scripts/experiments/b1-directional-sky-radiance/benchmark.js', sha256: scorerSha256}},
		environment: {schemaId: 'point-local-b1-non-regression-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-b1-non-regression-references-v1', parent, baseline}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runB1PointLocalBrowser.js',
			exportName: 'runB1PointLocalBrowser'});
		requireCondition(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer), 'Real WebGL2 is required.');
		requireCondition(browser.result.spectra.length === 17
			&& browser.result.spectra.every((scene) => scene.length === 81
				&& scene.every((spectrum) => spectrum.length === 40
					&& spectrum.every(Number.isFinite))), 'Browser did not return the complete finite B1 table.');
		const tablePath = 'generated/b1-point-local-direct40-w27-q30.tsv';
		await run.writeArtifact(tablePath, tableText(browser.result));
		const absoluteTablePath = path.join(run.runDirectory, ...tablePath.split('/'));
		const tableSha256 = await sha256File(absoluteTablePath);
		const score = await scoreCandidate(absoluteTablePath);
		const gatePassed = score.aggregate.rmseMilliwatt <= THRESHOLD;
		const evidence = {proofId: 'point-local-scene-cache-b1-non-regression-v1', accepted: gatePassed,
			metric: 'spectral RMSE over 17 times x 81 directions x 31 scored wavelengths',
			units: 'mW m^-2 sr^-1 nm^-1', thresholdRmseMilliwatt: THRESHOLD,
			candidateAggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
			deltaMilliwatt: score.aggregate.rmseMilliwatt - THRESHOLD, tablePath, tableSha256,
			perTime: score.conditionScores.map(({time, rmseMilliwatt, worst}) => ({time, rmseMilliwatt, worst})),
			gpu: browser.result.gpu, ledgers: browser.result.ledgers,
			readOnlyScoringOracle: {path: 'scripts/experiments/b1-directional-sky-radiance/benchmark.js', sha256: scorerSha256},
			sparseProbes: browser.result.sparseProbes,
			wavelengthSummaries: browser.result.wavelengthSummaries,
			claimBoundary: 'Direct40 point-local B1 non-regression only; no Native15, Bruneton-score, image, resource, or production-promotion claim'};
		await run.writeJsonArtifact('evidence/b1-score.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const report = `# ${run.runId}: point-local B1 non-regression\n\nConclusion: **${gatePassed ? 'accepted' : 'rejected'}**.\n\nCandidate aggregate RMSE: ${score.aggregate.rmseMilliwatt} mW m^-2 sr^-1 nm^-1.\n\nFrozen current-Algorithm32 threshold: ${THRESHOLD} mW m^-2 sr^-1 nm^-1.\n\nDelta: ${evidence.deltaMilliwatt} mW m^-2 sr^-1 nm^-1.\n`;
		const terminal = await run.finalize({conclusion: gatePassed ? 'accepted' : 'rejected',
			result: evidence, report});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			...evidence}, null, 2)}\n`);
		if (!gatePassed) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: point-local B1 execution failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
