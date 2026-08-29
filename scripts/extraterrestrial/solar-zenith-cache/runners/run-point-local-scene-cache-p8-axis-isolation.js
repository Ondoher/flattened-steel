#!/usr/bin/env node

import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-axis-isolation.js';
const PARENT = '000561-point-local-scene-cache-p8-interpolation-oracle';
const PARENT_ARTIFACT = 'evidence/interpolation-oracle.json';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/b1PointLocalInputs.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

function relativeL2(candidate, oracle) {
	let truth = 0, error = 0;
	for (let index = 0; index < candidate.length; index += 1) {
		truth += oracle[index] ** 2;
		error += (candidate[index] - oracle[index]) ** 2;
	}
	return truth === 0 ? (error === 0 ? 0 : null) : Math.sqrt(error / truth);
}

function attributionFigure(rows) {
	const width = 1120, height = 520, left = 215, top = 65, plot = 780;
	const maximum = Math.max(...rows.flatMap((row) => [row.positionRelativeL2,
		row.outgoingRelativeL2, row.combinedRelativeL2])) * 1.08;
	const colors = ['#2c7fb8', '#f03b20', '#756bb1'];
	const body = rows.map((row, index) => {
		const y = top + index * 65;
		const bars = [row.positionRelativeL2, row.outgoingRelativeL2, row.combinedRelativeL2]
			.map((value, bar) => `<rect x="${left}" y="${y + bar * 13}" width="${plot * value / maximum}" height="10" fill="${colors[bar]}"/>`).join('');
		return `<text x="${left - 10}" y="${y + 23}" text-anchor="end">${row.id}</text>${bars}`;
	}).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="14" fill="#111"><text x="560" y="28" text-anchor="middle" font-size="20">P8 held-out error attribution by grid axis</text><rect x="280" y="40" width="16" height="10" fill="${colors[0]}"/><text x="302" y="50">altitude + solar zenith</text><rect x="500" y="40" width="16" height="10" fill="${colors[1]}"/><text x="522" y="50">W27 outgoing</text><rect x="680" y="40" width="16" height="10" fill="${colors[2]}"/><text x="702" y="50">combined</text>${body}</g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'rejected', 'Sealed rejected interpolation parent is unavailable.');
	const parentPath = path.join(RUNS_ROOT, PARENT, ...PARENT_ARTIFACT.split('/'));
	const parentEvidence = JSON.parse(await readFile(parentPath, 'utf8'));
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-axis-isolation',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-axis-isolation-inputs-v1', parentRunId: PARENT,
			operation: 'hold shifted altitude/solar-zenith nodes fixed and replace only W39 with W27',
			renderRegardlessOfOutcome: true},
		provenance: {schemaId: 'p8-axis-isolation-provenance-v1', parent,
			parentArtifact: {path: PARENT_ARTIFACT, sha256: await sha256File(parentPath)},
			derivation: 'canonical W27 -> shifted W27 isolates position axes; shifted W27 -> shifted W39 isolates outgoing axis'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {parent}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP8InterpolationOracleBrowser.js',
			exportName: 'runP8AxisIsolationBrowser', browserDriver: 'chrome-cdp'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && !/swiftshader|software/iu.test(result.gpu.renderer),
			'Real WebGL2 is required.');
		const rows = parentEvidence.browserResult.comparisons.map((parentCase) => {
			const middle = result.cases.find((item) => item.id === parentCase.id);
			requireCondition(middle?.cumulative.length === 15, `Axis result is missing ${parentCase.id}.`);
			const canonical = parentCase.cumulative.map((item) => item.candidate);
			const shiftedW27 = middle.cumulative.map((item) => item.value);
			const shiftedW39 = parentCase.cumulative.map((item) => item.oracle);
			return {id: parentCase.id,
				positionRelativeL2: relativeL2(canonical, shiftedW27),
				outgoingRelativeL2: relativeL2(shiftedW27, shiftedW39),
				combinedRelativeL2: relativeL2(canonical, shiftedW39),
				spectralSums: {canonicalW27: canonical.reduce((a, b) => a + b, 0),
					shiftedW27: shiftedW27.reduce((a, b) => a + b, 0),
					shiftedW39: shiftedW39.reduce((a, b) => a + b, 0)}};
		});
		await run.writeArtifact('figures/heldout-axis-attribution.svg', attributionFigure(rows));
		const evidence = {proofId: 'p8-heldout-axis-isolation-v1', accepted: true,
			parentRunId: PARENT, rows, browserResult: result,
			figure: 'figures/heldout-axis-attribution.svg',
			claimBoundary: 'Diagnostic axis attribution only; it does not replace or weaken the rejected parent thresholds.'};
		await run.writeJsonArtifact('evidence/axis-isolation.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
			report: `# ${run.runId}: P8 interpolation-axis isolation\n\nConclusion: **accepted diagnostic evidence**.\n\nThe rejected parent thresholds remain unchanged.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256, rows}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: P8 axis isolation failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

