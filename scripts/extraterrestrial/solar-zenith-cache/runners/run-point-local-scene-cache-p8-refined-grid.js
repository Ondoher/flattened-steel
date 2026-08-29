#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-refined-grid.js';
const PARENTS = Object.freeze(['000561-point-local-scene-cache-p8-interpolation-oracle',
	'000562-point-local-scene-cache-p8-axis-isolation']);
const THRESHOLDS = Object.freeze({spectrumL2DenominatorFloor: 1e-12,
	aggregateCumulativeRelativeL2: 0.1, worstCaseCumulativeFlooredRelativeL2: 0.25,
	aggregateInternalFlooredRelativeL2: 0.2});
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

function metric(pairs, floor = 0) {
	let truth = 0, error = 0;
	for (const pair of pairs) {
		truth += pair.oracle ** 2;
		error += (pair.candidate - pair.oracle) ** 2;
	}
	const truthNorm = Math.sqrt(truth), errorNorm = Math.sqrt(error);
	return {truthL2: truthNorm, errorL2: errorNorm,
		relativeL2: errorNorm / Math.max(truthNorm, floor)};
}

function figure(cases) {
	const width = 1080, height = 510, left = 220, top = 65, plot = 760;
	const maximum = Math.max(0.25, ...cases.map((item) => item.metric.relativeL2)) * 1.1;
	const body = cases.map((item, index) => {
		const y = top + index * 62, bar = plot * item.metric.relativeL2 / maximum;
		return `<text x="${left - 10}" y="${y + 22}" text-anchor="end">${item.id}</text><rect x="${left}" y="${y}" width="${bar}" height="30" fill="${item.metric.relativeL2 <= 0.25 ? '#238b45' : '#cb181d'}"/><text x="${left + bar + 8}" y="${y + 22}">${(item.metric.relativeL2 * 100).toFixed(3)}%</text>`;
	}).join('');
	const gate = left + plot * 0.25 / maximum;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="15" fill="#111"><text x="540" y="30" text-anchor="middle" font-size="20">P8 refined-grid held-out Native15 error</text>${body}<line x1="${gate}" y1="${top - 10}" x2="${gate}" y2="${top + cases.length * 62 - 20}" stroke="#111" stroke-dasharray="6 5"/><text x="${gate + 6}" y="${top - 16}">frozen 25% case gate</text></g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parents = [];
	for (const id of PARENTS) {
		const parent = await verifyRun(id);
		requireCondition(parent.verified, `Required parent ${id} is unavailable.`);
		parents.push(parent);
	}
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-refined-grid',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-refined-grid-inputs-v1', parents: PARENTS, thresholds: THRESHOLDS,
			candidate: 'quadratic altitude 48 x adaptive terminator solar zenith x W27 x Native15',
			oracle: 'midpoint-shifted matching coordinates x W39 x Native15',
			renderRegardlessOfGate: true},
		provenance: {schemaId: 'p8-refined-grid-provenance-v1', parents,
			operation: 'replace only the rejected position grids identified by run 000562, preserve W27/F68/N4 and compare every Native15 channel at held-out shifted nodes'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {parents}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
			exportName: 'runP8RefinedGridBrowser', browserDriver: 'chrome-cdp'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Real WebGL2 is required.');
		requireCondition(result.comparisons.length === 6
			&& result.comparisons.every((item) => item.cumulative.length === 15),
			'The refined-grid comparison is incomplete.');
		const cases = result.comparisons.map((item) => ({id: item.id,
			metric: metric(item.cumulative, THRESHOLDS.spectrumL2DenominatorFloor)}));
		const aggregate = metric(result.comparisons.flatMap((item) => item.cumulative));
		const internal = metric(result.comparisons.flatMap((item) => Object.values(item.internal).flat()),
			THRESHOLDS.spectrumL2DenominatorFloor);
		const checks = [{id: 'aggregate-cumulative', observed: aggregate.relativeL2,
			threshold: THRESHOLDS.aggregateCumulativeRelativeL2,
			passed: aggregate.relativeL2 <= THRESHOLDS.aggregateCumulativeRelativeL2},
		...cases.map((item) => ({id: `case-${item.id}`, observed: item.metric.relativeL2,
			threshold: THRESHOLDS.worstCaseCumulativeFlooredRelativeL2,
			passed: item.metric.relativeL2 <= THRESHOLDS.worstCaseCumulativeFlooredRelativeL2})),
		{id: 'aggregate-internal', observed: internal.relativeL2,
			threshold: THRESHOLDS.aggregateInternalFlooredRelativeL2,
			passed: internal.relativeL2 <= THRESHOLDS.aggregateInternalFlooredRelativeL2}];
		const accepted = checks.every((check) => check.passed);
		await run.writeArtifact('figures/refined-grid-heldout-error.svg', figure(cases));
		const evidence = {proofId: 'p8-refined-grid-heldout-v1', accepted, thresholds: THRESHOLDS,
			checks, aggregate, internal, cases, browserResult: result,
			figure: 'figures/refined-grid-heldout-error.svg', claimBoundary: result.claimBoundary};
		await run.writeJsonArtifact('evidence/refined-grid.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: accepted ? 'accepted' : 'rejected', result: evidence,
			report: `# ${run.runId}: P8 refined-grid qualification\n\nConclusion: **${accepted ? 'accepted' : 'rejected'}**.\n\nThe figure is preserved regardless of the gate.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			accepted, domains: result.domains, aggregate, internal, cases, checks}, null, 2)}\n`);
		if (!accepted) process.exitCode = 2;
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P8 refined-grid execution failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

