#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-figures.js';
const argument = (name, fallback) => {
	const index = process.argv.indexOf(name);
	return index === -1 ? fallback : process.argv[index + 1];
};
const PARENT = argument('--parent', '000545-point-local-scene-cache-b1-non-regression');
const CANDIDATE_RELATIVE = argument('--candidate-relative',
	'generated/b1-point-local-direct40-w27-q30.tsv');
const RUN_SLUG = argument('--slug', 'point-local-scene-cache-b1-figures');
const ALLOW_REJECTED = process.argv.includes('--allow-rejected');
const BASELINE = '000479-b1-reflection-completed-fibonacci68-full-figures';
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const xml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function chartSvg({title, subtitle, series, aggregate = false}) {
	const width = 1100, height = 620, left = 90, right = 35, top = 75, bottom = 90;
	const values = series.flatMap((item) => item.values);
	const maximum = Math.ceil(Math.max(...values, 1) / 5) * 5;
	const plotWidth = width - left - right, plotHeight = height - top - bottom;
	const x = (index, count) => left + (count === 1 ? plotWidth / 2 : index * plotWidth / (count - 1));
	const y = (value) => top + plotHeight * (1 - value / maximum);
	const grid = Array.from({length: 6}, (_unused, index) => {
		const value = maximum * index / 5;
		return `<line x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}" stroke="#ddd"/><text x="${left-12}" y="${y(value)+4}" text-anchor="end">${value.toFixed(0)}</text>`;
	}).join('');
	let body;
	if (aggregate) {
		const barWidth = 180;
		body = series.map((item, index) => { const bx = left + 190 + index * 390; const by = y(item.values[0]);
			return `<rect x="${bx}" y="${by}" width="${barWidth}" height="${top+plotHeight-by}" fill="${item.color}"/><text x="${bx+barWidth/2}" y="${by-10}" text-anchor="middle">${item.values[0].toFixed(6)}</text><text x="${bx+barWidth/2}" y="${height-bottom+28}" text-anchor="middle">${xml(item.label)}</text>`; }).join('');
	} else {
		body = series.map((item) => `<polyline fill="none" stroke="${item.color}" stroke-width="3" points="${item.values.map((value,index)=>`${x(index,item.values.length)},${y(value)}`).join(' ')}"/>`).join('');
		body += series[0].times.map((time, index) => `<text x="${x(index,series[0].times.length)}" y="${height-bottom+24}" text-anchor="middle" transform="rotate(45 ${x(index,series[0].times.length)} ${height-bottom+24})">${time}</text>`).join('');
		body += series.map((item,index)=>`<line x1="${left+index*300}" y1="${height-25}" x2="${left+35+index*300}" y2="${height-25}" stroke="${item.color}" stroke-width="4"/><text x="${left+45+index*300}" y="${height-20}">${xml(item.label)}</text>`).join('');
	}
	return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${xml(title)}</title><desc>${xml(subtitle)}</desc><style>text{font-family:Arial,sans-serif;fill:#222;font-size:13px}</style><text x="${left}" y="35" font-size="24" font-weight="bold">${xml(title)}</text><text x="${left}" y="58">${xml(subtitle)}</text>${grid}<line x1="${left}" y1="${top}" x2="${left}" y2="${height-bottom}" stroke="#222"/><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}" stroke="#222"/>${body}<text x="18" y="${top+plotHeight/2}" transform="rotate(-90 18 ${top+plotHeight/2})" text-anchor="middle">RMSE (mW m^-2 sr^-1 nm^-1)</text></svg>`;
}

async function renderFigure5(candidatePath, baselinePath, candidateRunId) {
	const source = String.raw`
import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';
import {FIGURE5_SCENES,loadPublishedFigure5Panels,renderAlgorithm32Figure5Panel,renderFigure5ComparisonSvg} from './scripts/experiments/b1-directional-sky-radiance/figure5.js';
const candidatePath=process.argv[1],baselinePath=process.argv[2],candidateRunId=process.argv[3];
const dataset=loadKiderDataset();
const candidate=parseSpectraTsv(candidatePath).get('proposed');
const baseline=parseSpectraTsv(baselinePath).get('proposed');
const candidateScore=scoreModels(dataset,new Map([['proposed',candidate]])).get('proposed');
const baselineScore=scoreModels(dataset,new Map([['proposed',baseline]])).get('proposed');
const panels=FIGURE5_SCENES.map(scene=>renderAlgorithm32Figure5Panel(candidate.get(scene.time),dataset.conditions.find(item=>item.time===scene.time).grid,scene));
const comparison=renderFigure5ComparisonSvg(loadPublishedFigure5Panels(),panels,{generator:'contained point-local B1 figure derivative',observable:'B1 Figure 5 directional 360-720 nm band-integrated relative error',candidateRunId,candidateBoundary:candidatePath});
process.stdout.write(JSON.stringify({candidateScore,baselineScore,files:Object.fromEntries(panels.map((panel,index)=>['b1-figure5-algorithm32-'+FIGURE5_SCENES[index].fileTime+'-z'+FIGURE5_SCENES[index].roundedSolarZenithDegrees+'.png',panel.png.toString('base64')]).concat([['b1-figure5-relative-error-domes.svg',Buffer.from(comparison).toString('base64')]]))}));`;
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, candidatePath, baselinePath, candidateRunId],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 16 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && (parent.conclusion === 'accepted' || ALLOW_REJECTED),
		'Sealed B1 candidate parent is unavailable.');
	const candidatePath = path.join(RUNS_ROOT, PARENT, ...CANDIDATE_RELATIVE.split('/'));
	const baselinePath = path.join(RUNS_ROOT, BASELINE, 'generated', 'b1-directional-sky-radiance', 'gpu',
		'algorithm32-current-production-gpu-j4.tsv');
	const [candidateSha256, baselineSha256] = await Promise.all([sha256File(candidatePath), sha256File(baselinePath)]);
	const run = await initializeRunRecord({slug: RUN_SLUG,
		command: `node scripts/extraterrestrial/${ENTRY} --parent ${PARENT} --candidate-relative ${CANDIDATE_RELATIVE} --slug ${RUN_SLUG}${ALLOW_REJECTED ? ' --allow-rejected' : ''}`,
		inputs: {schemaId: 'point-local-b1-figures-inputs-v1', parentRunId: PARENT, candidateSha256,
			baselineRunId: BASELINE, baselineSha256, requestedFigures: 'complete B1 six-figure set'},
		provenance: {schemaId: 'point-local-b1-figures-provenance-v1', parent,
			operation: 'derive all standard B1 RMSE and Figure 5 visuals from the sealed Direct40 candidate table'},
		environment: {schemaId: 'point-local-b1-figures-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch},
		references: {schemaId: 'point-local-b1-figures-references-v1', parent}});
	try {
		const rendered = await renderFigure5(candidatePath, baselinePath, PARENT);
		const candidate = rendered.candidateScore;
		const baseline = rendered.baselineScore;
		const times = candidate.conditionScores.map((item) => item.time);
		const perTime = chartSvg({title: 'B1 per-time spectral RMSE',
			subtitle: 'Point-local Direct40/W27/F68/N4/Q30 candidate versus accepted current Algorithm32 B1 baseline',
			series: [{label: 'Point-local candidate', color: '#c43d2f', times,
				values: candidate.conditionScores.map((item) => item.rmseMilliwatt)},
			{label: 'Current Algorithm32 baseline', color: '#2869a8', times,
				values: baseline.conditionScores.map((item) => item.rmseMilliwatt)}]});
		const aggregate = chartSvg({title: 'B1 aggregate spectral RMSE',
			subtitle: 'Lower is better; promotion threshold is the accepted current Algorithm32 baseline', aggregate: true,
			series: [{label: 'Point-local candidate', color: '#c43d2f', values: [candidate.aggregate.rmseMilliwatt]},
				{label: 'Current Algorithm32 baseline', color: '#2869a8', values: [baseline.aggregate.rmseMilliwatt]}]});
		const files = {'b1-per-time-rmse.svg': Buffer.from(perTime), 'b1-aggregate-rmse.svg': Buffer.from(aggregate),
			...Object.fromEntries(Object.entries(rendered.files).map(([name, base64]) => [name, Buffer.from(base64, 'base64')]))};
		requireCondition(Object.keys(files).length === 6, 'Complete B1 figure set must contain six artifacts.');
		const figures = [];
		for (const [name, bytes] of Object.entries(files)) {
			await run.writeArtifact(`figures/${name}`, bytes);
			figures.push({name, byteLength: bytes.length, sha256: await sha256File(path.join(run.runDirectory, 'figures', name))});
		}
		await run.writeJsonArtifact('evidence/figure-set.json', {schemaId: 'point-local-b1-complete-figure-set-v1',
			accepted: true, parentRunId: PARENT, candidateSha256, baselineRunId: BASELINE, baselineSha256,
			candidateAggregateRmseMilliwatt: candidate.aggregate.rmseMilliwatt,
			baselineAggregateRmseMilliwatt: baseline.aggregate.rmseMilliwatt, figures});
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, [ENTRY]));
		const terminal = await run.finalize({conclusion: 'accepted', result: {accepted: true, parentRunId: PARENT, figures},
			report: `# ${run.runId}: complete B1 figures\n\nConclusion: **accepted**.\n\nAll six requested B1 figures were derived from sealed run ${PARENT}. The parent numerical gate is accepted.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256, figures}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: B1 figure generation failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
