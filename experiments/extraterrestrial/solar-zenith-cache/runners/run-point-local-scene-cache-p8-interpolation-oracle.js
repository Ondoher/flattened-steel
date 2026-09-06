#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-interpolation-oracle.js';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/san-jose-nautical-cache-poc/compiler/createPocBuildRequest.js',
	'solar-zenith-cache/san-jose-nautical-cache-poc/domains/cubedSphereW39DirectionDomain.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const THRESHOLDS = Object.freeze({aggregateCumulativeRelativeL2: 0.1,
	worstCaseCumulativeRelativeL2: 0.25, aggregateInternalRelativeL2: 0.2});

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function relativeL2(pairs) {
	let truth = 0;
	let error = 0;
	for (const pair of pairs) {
		truth += pair.oracle ** 2;
		error += (pair.candidate - pair.oracle) ** 2;
	}
	return truth === 0 ? (error === 0 ? 0 : Number.POSITIVE_INFINITY) : Math.sqrt(error / truth);
}

function escapeXml(value) {
	return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function errorFigure(cases, thresholds) {
	const width = 1040, height = 500, left = 210, top = 55, plotWidth = 760;
	const maximum = Math.max(thresholds.worstCaseCumulativeRelativeL2,
		...cases.map((item) => item.relativeL2)) * 1.1;
	const rows = cases.map((item, index) => {
		const y = top + index * 62;
		const barWidth = plotWidth * item.relativeL2 / maximum;
		const pass = item.relativeL2 <= thresholds.worstCaseCumulativeRelativeL2;
		return `<text x="${left - 12}" y="${y + 22}" text-anchor="end">${escapeXml(item.id)}</text>`
			+ `<rect x="${left}" y="${y}" width="${barWidth}" height="30" fill="${pass ? '#2c7fb8' : '#d7301f'}"/>`
			+ `<text x="${left + barWidth + 8}" y="${y + 22}">${(item.relativeL2 * 100).toFixed(3)}%</text>`;
	}).join('');
	const gateX = left + plotWidth * thresholds.worstCaseCumulativeRelativeL2 / maximum;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="15" fill="#111">
<text x="${width / 2}" y="28" text-anchor="middle" font-size="20">P8 held-out cumulative spectral relative L2</text>
${rows}<line x1="${gateX}" y1="${top - 8}" x2="${gateX}" y2="${top + cases.length * 62 - 20}" stroke="#111" stroke-dasharray="6 5"/>
<text x="${gateX + 6}" y="${top - 14}">frozen ${(thresholds.worstCaseCumulativeRelativeL2 * 100).toFixed(0)}% case gate</text>
</g></svg>`;
}

function spectraFigure(comparisons) {
	const width = 1200, height = 760, margin = 70;
	const colors = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02'];
	const all = comparisons.flatMap((item) => item.cumulative.flatMap((pair) => [pair.candidate, pair.oracle]));
	const maximum = Math.max(...all, Number.MIN_VALUE);
	const panels = comparisons.map((item, panelIndex) => {
		const column = panelIndex % 2, row = Math.floor(panelIndex / 2);
		const x0 = margin + column * 565, y0 = 70 + row * 220;
		const panelWidth = 480, panelHeight = 150;
		const points = (key) => item.cumulative.map((pair, index) => {
			const x = x0 + index * panelWidth / (item.cumulative.length - 1);
			const y = y0 + panelHeight - pair[key] / maximum * panelHeight;
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		}).join(' ');
		return `<text x="${x0}" y="${y0 - 12}" font-size="16">${escapeXml(item.id)}</text>`
			+ `<rect x="${x0}" y="${y0}" width="${panelWidth}" height="${panelHeight}" fill="none" stroke="#bbb"/>`
			+ `<polyline points="${points('oracle')}" fill="none" stroke="#111" stroke-width="2"/>`
			+ `<polyline points="${points('candidate')}" fill="none" stroke="${colors[panelIndex]}" stroke-width="2" stroke-dasharray="5 3"/>`;
	}).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111">
<text x="${width / 2}" y="30" text-anchor="middle" font-size="20">P8 held-out Native15 cumulative spectra</text>
<line x1="420" y1="50" x2="460" y2="50" stroke="#111" stroke-width="2"/><text x="468" y="55">shifted W39 oracle</text>
<line x1="650" y1="50" x2="690" y2="50" stroke="#2c7fb8" stroke-width="2" stroke-dasharray="5 3"/><text x="698" y="55">canonical W27 interpolation</text>
${panels}</g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-interpolation-oracle',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-interpolation-oracle-inputs-v1', thresholds: THRESHOLDS,
			spectralBasis: 'Native15', candidate: 'Native48/Z180/W27/F68/N4',
			oracle: 'midpoint-shifted Native48/integer-shifted Z180/W39/F68/N4',
			states: ['near-ground day', 'low day horizon', 'near-ground terminator',
				'upper terminator', 'twilight horizon', 'weak-blue night'], renderRegardlessOfGate: true},
		provenance: {schemaId: 'p8-interpolation-oracle-provenance-v1',
			operation: 'execute independent canonical and shifted/refined Native15 GPU recurrences through J4, reconstruct canonical off-grid values, and compare with exact shifted-grid nodes before inspecting output'},
		environment: {schemaId: 'p8-interpolation-oracle-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'p8-interpolation-oracle-references-v1', direct40GateRun: '000545-point-local-scene-cache-b1-non-regression',
			native15GateRun: '000558-previous-model-b1-native15-comparison'}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
			exportName: 'runP8InterpolationOracleBrowser', browserDriver: 'chrome-cdp'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Real WebGL2 is required.');
		requireCondition(result.comparisons.length === 6
			&& result.comparisons.every((item) => item.cumulative.length === 15),
			'The complete six-case Native15 comparison was not returned.');
		const cases = result.comparisons.map((item) => ({id: item.id,
			relativeL2: relativeL2(item.cumulative)}));
		const aggregate = relativeL2(result.comparisons.flatMap((item) => item.cumulative));
		const internalAggregate = relativeL2(result.comparisons.flatMap((item) =>
			Object.values(item.internal).flat()));
		const gateChecks = [{id: 'aggregate-cumulative', observed: aggregate,
			threshold: THRESHOLDS.aggregateCumulativeRelativeL2, passed: aggregate <= THRESHOLDS.aggregateCumulativeRelativeL2},
		...cases.map((item) => ({id: `case-${item.id}`, observed: item.relativeL2,
			threshold: THRESHOLDS.worstCaseCumulativeRelativeL2,
			passed: item.relativeL2 <= THRESHOLDS.worstCaseCumulativeRelativeL2})),
		{id: 'aggregate-internal-L1-L3', observed: internalAggregate,
			threshold: THRESHOLDS.aggregateInternalRelativeL2,
			passed: internalAggregate <= THRESHOLDS.aggregateInternalRelativeL2}];
		const gatePassed = gateChecks.every((check) => check.passed);
		await run.writeArtifact('figures/heldout-relative-error.svg', errorFigure(cases, THRESHOLDS));
		await run.writeArtifact('figures/heldout-native15-spectra.svg', spectraFigure(result.comparisons));
		const evidence = {proofId: 'p8-heldout-interpolation-oracle-v1', accepted: gatePassed,
			thresholds: THRESHOLDS, gateChecks, aggregateCumulativeRelativeL2: aggregate,
			aggregateInternalRelativeL2: internalAggregate, cases, browserResult: result,
			figures: ['figures/heldout-relative-error.svg', 'figures/heldout-native15-spectra.svg'],
			claimBoundary: result.claimBoundary};
		await run.writeJsonArtifact('evidence/interpolation-oracle.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: gatePassed ? 'accepted' : 'rejected', result: evidence,
			report: `# ${run.runId}: P8 held-out interpolation oracle\n\nConclusion: **${gatePassed ? 'accepted' : 'rejected'}**.\n\nAll figures were preserved regardless of the gate.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId,
			artifactSetSha256: terminal.artifactSetSha256, accepted: gatePassed,
			aggregateCumulativeRelativeL2: aggregate, aggregateInternalRelativeL2: internalAggregate,
			cases, gateChecks}, null, 2)}\n`);
		if (!gatePassed) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P8 interpolation execution failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

