#!/usr/bin/env node

import {execFile} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-full-model-comparison.js';
const PARENT = '000545-point-local-scene-cache-b1-non-regression';
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

async function renderComparison({candidatePath, measurementPath, publishedModelsPath, provenance}) {
	const source = String.raw`
import {parseSpectraTsv} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';
import {computeB1Scores,parseMeasurementPacketBoundary,renderB1PerTimeFigure} from './scripts/experiments/generate-benchmark-figures.js';
import {readFileSync} from 'node:fs';
const candidatePath=process.argv[1],measurementPath=process.argv[2],publishedModelsPath=process.argv[3];
const provenance=JSON.parse(process.argv[4]);
const measurements=parseMeasurementPacketBoundary(readFileSync(measurementPath,'utf8'),measurementPath);
const publishedScores=computeB1Scores(measurements,parseSpectraTsv(publishedModelsPath));
const candidateModels=parseSpectraTsv(candidatePath);
if(candidateModels.size!==1||!candidateModels.has('proposed'))throw new Error('Candidate table must contain exactly proposed.');
const candidateScore=computeB1Scores(measurements,candidateModels,['proposed']).get('proposed');
const svg=renderB1PerTimeFigure(publishedScores,candidateScore,provenance);
process.stdout.write(JSON.stringify({svg:Buffer.from(svg).toString('base64'),candidateScore}));`;
	const result = await executeFile(process.execPath,
		['--input-type=module', '-e', source, candidatePath, measurementPath, publishedModelsPath,
			JSON.stringify(provenance)],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 16 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'accepted',
		'Sealed accepted B1 candidate is unavailable.');
	const candidatePath = path.join(RUNS_ROOT, PARENT, 'generated',
		'b1-point-local-direct40-w27-q30.tsv');
	const measurementPath = path.resolve('references/results/experiments/b1-directional-sky-radiance',
		'measurement-boundary.tsv');
	const publishedModelsPath = path.resolve('references/results/experiments/b1-directional-sky-radiance',
		'published-models.tsv');
	const [candidateSha256, measurementSha256, publishedModelsSha256] = await Promise.all([
		sha256File(candidatePath), sha256File(measurementPath), sha256File(publishedModelsPath)]);
	const provenance = {
		profileFamily: 'point-local-direct40-w27-f68-n4-q30',
		candidateLabel: 'Point-local solar-zenith cache',
		selectedMaximumScatteringOrder: 4,
		measurements: {path: 'references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv',
			sha256: measurementSha256},
		publishedModels: {path: 'references/results/experiments/b1-directional-sky-radiance/published-models.tsv',
			sha256: publishedModelsSha256},
		algorithm32Boundary: {runId: PARENT,
			path: 'generated/b1-point-local-direct40-w27-q30.tsv', sha256: candidateSha256,
			identity: 'point-local solar-zenith Direct40/W27/F68/N4/Q30 accepted B1 boundary'},
	};
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-b1-full-model-comparison',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-b1-full-model-comparison-inputs-v1', parentRunId: PARENT,
			candidateSha256, measurementSha256, publishedModelsSha256,
			target: 'canonical full-model b1-per-time-rmse.svg layout'},
		provenance: {schemaId: 'point-local-b1-full-model-comparison-provenance-v1', parent,
			operation: 'render the canonical B1 per-time full-model comparison with the sealed accepted point-local candidate as the selected Algorithm32 series'},
		environment: {schemaId: 'point-local-b1-full-model-comparison-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch},
		references: {schemaId: 'point-local-b1-full-model-comparison-references-v1', parent,
			measurementSha256, publishedModelsSha256},
	});
	try {
		const rendered = await renderComparison({candidatePath, measurementPath, publishedModelsPath, provenance});
		const bytes = Buffer.from(rendered.svg, 'base64');
		const figurePath = 'figures/b1-per-time-rmse.svg';
		await run.writeArtifact(figurePath, bytes);
		const figureSha256 = await sha256File(path.join(run.runDirectory, ...figurePath.split('/')));
		const evidence = {schemaId: 'point-local-b1-full-model-comparison-evidence-v1', accepted: true,
			parentRunId: PARENT, candidateSha256, candidateAggregateRmseMilliwatt:
				rendered.candidateScore.aggregateRmseMilliwatt,
			figure: {path: figurePath, byteLength: bytes.length, sha256: figureSha256}, provenance};
		await run.writeJsonArtifact('evidence/full-model-comparison.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, [ENTRY]));
		const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
			report: `# ${run.runId}: B1 full-model per-time comparison\n\nConclusion: **accepted**.\n\nThe canonical full-model per-time comparison was rendered from sealed run ${PARENT}.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, ...evidence}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: B1 full-model comparison failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
