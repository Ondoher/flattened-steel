#!/usr/bin/env node

import {execFile} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-native15-figures.js';
const PARENT = '000549-point-local-scene-cache-b1-native15-retention';
const DIRECT40 = '000545-point-local-scene-cache-b1-non-regression';
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const xml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function chartSvg({title, subtitle, series, aggregate = false}) {
	const width = 1100, height = 620, left = 90, right = 35, top = 75, bottom = 90;
	const maximum = Math.ceil(Math.max(...series.flatMap((item) => item.values), 1) / 5) * 5;
	const plotWidth = width - left - right, plotHeight = height - top - bottom;
	const x = (index, count) => left + (count === 1 ? plotWidth / 2 : index * plotWidth / (count - 1));
	const y = (value) => top + plotHeight * (1 - value / maximum);
	const grid = Array.from({length: 6}, (_unused, index) => { const value = maximum * index / 5;
		return `<line x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}" stroke="#ddd"/><text x="${left-12}" y="${y(value)+4}" text-anchor="end">${value.toFixed(0)}</text>`; }).join('');
	let body;
	if (aggregate) {
		const barWidth = 160;
		body = series.map((item, index) => { const bx = left + 160 + index * 330, by = y(item.values[0]);
			return `<rect x="${bx}" y="${by}" width="${barWidth}" height="${top+plotHeight-by}" fill="${item.color}"/><text x="${bx+barWidth/2}" y="${by-10}" text-anchor="middle">${item.values[0].toFixed(6)}</text><text x="${bx+barWidth/2}" y="${height-bottom+28}" text-anchor="middle">${xml(item.label)}</text>`; }).join('');
	} else {
		body = series.map((item) => `<polyline fill="none" stroke="${item.color}" stroke-width="3" points="${item.values.map((value,index)=>`${x(index,item.values.length)},${y(value)}`).join(' ')}"/>`).join('');
		body += series[0].times.map((time, index) => `<text x="${x(index,series[0].times.length)}" y="${height-bottom+24}" text-anchor="middle" transform="rotate(45 ${x(index,series[0].times.length)} ${height-bottom+24})">${time}</text>`).join('');
		body += series.map((item,index)=>`<line x1="${left+index*330}" y1="${height-25}" x2="${left+35+index*330}" y2="${height-25}" stroke="${item.color}" stroke-width="4"/><text x="${left+45+index*330}" y="${height-20}">${xml(item.label)}</text>`).join('');
	}
	return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${xml(title)}</title><desc>${xml(subtitle)}</desc><style>text{font-family:Arial,sans-serif;fill:#222;font-size:13px}</style><text x="${left}" y="35" font-size="24" font-weight="bold">${xml(title)}</text><text x="${left}" y="58">${xml(subtitle)}</text>${grid}<line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}" stroke="#222"/><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#222"/>${body}<text x="18" y="${top+plotHeight/2}" transform="rotate(-90 18 ${top+plotHeight/2})" text-anchor="middle">RMSE (mW m^-2 sr^-1 nm^-1)</text></svg>`;
}

async function render(candidatePath, directPath, measurementPath, publishedPath, provenance) {
	const source = String.raw`
import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';
import {FIGURE5_SCENES,loadPublishedFigure5Panels,renderAlgorithm32Figure5Panel,renderFigure5ComparisonSvg} from './scripts/experiments/b1-directional-sky-radiance/figure5.js';
import {computeB1Scores,parseMeasurementPacketBoundary,renderB1PerTimeFigure} from './scripts/experiments/generate-benchmark-figures.js';
import {readFileSync} from 'node:fs';
const candidatePath=process.argv[1],directPath=process.argv[2],measurementPath=process.argv[3],publishedPath=process.argv[4],provenance=JSON.parse(process.argv[5]);
const dataset=loadKiderDataset(), candidateModels=parseSpectraTsv(candidatePath), directModels=parseSpectraTsv(directPath);
const candidate=scoreModels(dataset,candidateModels).get('proposed'), direct=scoreModels(dataset,directModels).get('proposed');
const panels=FIGURE5_SCENES.map(scene=>renderAlgorithm32Figure5Panel(candidateModels.get('proposed').get(scene.time),dataset.conditions.find(item=>item.time===scene.time).grid,scene));
const dome=renderFigure5ComparisonSvg(loadPublishedFigure5Panels(),panels,{generator:'contained Native15 B1 figure derivative',observable:'B1 Figure 5 directional 360-720 nm band-integrated relative error',candidateRunId:'${PARENT}',candidateBoundary:candidatePath});
const measurements=parseMeasurementPacketBoundary(readFileSync(measurementPath,'utf8'),measurementPath);
const publishedScores=computeB1Scores(measurements,parseSpectraTsv(publishedPath));
const candidateScore=computeB1Scores(measurements,candidateModels,['proposed']).get('proposed');
const full=renderB1PerTimeFigure(publishedScores,candidateScore,provenance);
process.stdout.write(JSON.stringify({candidate,direct,files:Object.fromEntries(panels.map((panel,index)=>['b1-figure5-algorithm32-'+FIGURE5_SCENES[index].fileTime+'-z'+FIGURE5_SCENES[index].roundedSolarZenithDegrees+'.png',panel.png.toString('base64')]).concat([['b1-figure5-relative-error-domes.svg',Buffer.from(dome).toString('base64')],['b1-full-model-per-time-rmse.svg',Buffer.from(full).toString('base64')]]))}));`;
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source,
		candidatePath, directPath, measurementPath, publishedPath, JSON.stringify(provenance)],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 24 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parent, directParent] = await Promise.all([verifyRun(PARENT), verifyRun(DIRECT40)]);
	requireCondition(parent.verified && parent.conclusion === 'rejected', 'Sealed rejected Native15 parent is unavailable.');
	requireCondition(directParent.verified && directParent.conclusion === 'accepted', 'Direct40 control is unavailable.');
	const candidatePath = path.join(RUNS_ROOT, PARENT, 'generated', 'b1-point-local-native15-reconstructed-direct40-w27-q30.tsv');
	const directPath = path.join(RUNS_ROOT, DIRECT40, 'generated', 'b1-point-local-direct40-w27-q30.tsv');
	const measurementPath = path.resolve('references/results/experiments/b1-directional-sky-radiance', 'measurement-boundary.tsv');
	const publishedPath = path.resolve('references/results/experiments/b1-directional-sky-radiance', 'published-models.tsv');
	const [candidateSha256, directSha256, measurementSha256, publishedSha256] = await Promise.all([
		sha256File(candidatePath), sha256File(directPath), sha256File(measurementPath), sha256File(publishedPath)]);
	const provenance = {profileFamily: 'point-local-native15-w27-f68-n4-q30', candidateLabel: 'Point-local Native15 cache',
		selectedMaximumScatteringOrder: 4,
		measurements: {path: 'references/results/experiments/b1-directional-sky-radiance/measurement-boundary.tsv', sha256: measurementSha256},
		publishedModels: {path: 'references/results/experiments/b1-directional-sky-radiance/published-models.tsv', sha256: publishedSha256},
		algorithm32Boundary: {runId: PARENT, path: 'generated/b1-point-local-native15-reconstructed-direct40-w27-q30.tsv', sha256: candidateSha256,
			identity: 'rejected point-local Native15/W27/F68/N4/Q30 B1 boundary'}};
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-b1-native15-figures',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-b1-native15-figures-inputs-v1', parentRunId: PARENT,
			direct40RunId: DIRECT40, candidateSha256, directSha256, requestedFigures: 'complete six-figure B1 set plus canonical full-model comparison'},
		provenance: {schemaId: 'point-local-b1-native15-figures-provenance-v1', parent, directParent,
			operation: 'unconditionally derive all standard B1 figures and canonical full-model comparison from rejected Native15 table'},
		environment: {schemaId: 'point-local-b1-native15-figures-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch}, references: {parent, directParent}});
	try {
		const rendered = await render(candidatePath, directPath, measurementPath, publishedPath, provenance);
		const times = rendered.candidate.conditionScores.map((item) => item.time);
		const files = {'b1-per-time-rmse.svg': Buffer.from(chartSvg({title: 'B1 per-time spectral RMSE',
			subtitle: 'Actual Native15 candidate versus accepted Direct40 point-local control', series: [
				{label: 'Native15 candidate', color: '#c43d2f', times, values: rendered.candidate.conditionScores.map((item)=>item.rmseMilliwatt)},
				{label: 'Direct40 control', color: '#2869a8', times, values: rendered.direct.conditionScores.map((item)=>item.rmseMilliwatt)}]})),
		'b1-aggregate-rmse.svg': Buffer.from(chartSvg({title: 'B1 aggregate spectral RMSE',
			subtitle: 'Native15 misses the frozen 11.820392 threshold; lower is better', aggregate: true, series: [
				{label: 'Native15 candidate', color: '#c43d2f', values: [rendered.candidate.aggregate.rmseMilliwatt]},
				{label: 'Direct40 control', color: '#2869a8', values: [rendered.direct.aggregate.rmseMilliwatt]}]})),
		...Object.fromEntries(Object.entries(rendered.files).map(([name, value])=>[name,Buffer.from(value,'base64')]))};
		requireCondition(Object.keys(files).length === 7, 'Expected six standard figures plus full-model comparison.');
		const figures = [];
		for (const [name, bytes] of Object.entries(files)) {
			await run.writeArtifact(`figures/${name}`, bytes);
			figures.push({name, byteLength: bytes.length, sha256: await sha256File(path.join(run.runDirectory,'figures',name))});
		}
		const evidence = {schemaId: 'point-local-b1-native15-figure-set-v1', accepted: true,
			parentConclusion: 'rejected', parentRunId: PARENT, direct40RunId: DIRECT40,
			candidateAggregateRmseMilliwatt: rendered.candidate.aggregate.rmseMilliwatt,
			direct40AggregateRmseMilliwatt: rendered.direct.aggregate.rmseMilliwatt, figures, provenance};
		await run.writeJsonArtifact('evidence/figure-set.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, [ENTRY]));
		const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
			report: `# ${run.runId}: Native15 B1 figures\n\nConclusion: **accepted derivative evidence**.\n\nAll figures were preserved despite the parent numerical rejection.\n`});
		process.stdout.write(`${JSON.stringify({runId:run.runId,artifactSetSha256:terminal.artifactSetSha256,...evidence},null,2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json',{message:error.message,stack:error.stack});
		await run.finalize({conclusion:'failed',result:{accepted:false,error:error.message},report:`# Native15 B1 figures failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
