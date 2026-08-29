#!/usr/bin/env node

import {execFile} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-b1-grid-axis.js';
const PARENT = '000564-point-local-scene-cache-p8-refined-b1';
const executeFile = promisify(execFile);
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/runB1GridAxisDiagnosticBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/nestedNearGround55PositionDomain.js',
	'solar-zenith-cache/point-local-scene-cache/nestedTerminatorSolarZenithDomain.js',
	'solar-zenith-cache/point-local-scene-cache/PointLocalGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };

async function score(result, filePath) {
	const source = "import{readFileSync}from'node:fs';import{loadKiderDataset}from'./scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const r=JSON.parse(readFileSync(process.argv[1]));const d=loadKiderDataset();const out={};for(const v of r.results){let s=0,n=0;for(let i=0;i<17;i++)for(let j=0;j<81;j++){const x=Math.floor(j/9),y=j%9,e=v.spectra[i][j]-d.conditions[i].grid[x][y][r.wavelengthIndex];s+=e*e;n++;}out[v.id]=Math.sqrt(s/n)*1000;}process.stdout.write(JSON.stringify(out));";
	const scored = await executeFile(process.execPath, ['--input-type=module', '-e', source, filePath],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 16 * 1024 * 1024});
	return JSON.parse(scored.stdout);
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'rejected', 'Rejected refined-B1 parent is unavailable.');
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-b1-grid-axis',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-b1-grid-axis-inputs-v1', parentRunId: PARENT,
			wavelengthNanometers: 477.5, variants: ['canonical', 'quadratic altitude only',
				'adaptive zenith only', 'nested candidate']},
		provenance: {schemaId: 'p8-b1-grid-axis-provenance-v1', parent,
			operation: 'score the worst refined-B1 wavelength while changing one coordinate grid at a time'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {parent}});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runB1GridAxisDiagnosticBrowser.js',
			exportName: 'runB1GridAxisDiagnosticBrowser', browserDriver: 'chrome-cdp'});
		const result = browser.result;
		requireCondition(result.gpu.api.includes('WebGL 2') && result.results.length === 4,
			'Complete real-WebGL2 axis output is required.');
		const rawPath = path.join(run.runDirectory, 'generated', 'axis-browser-result.json');
		await run.writeJsonArtifact('generated/axis-browser-result.json', result);
		const scores = await score(result, rawPath);
		const evidence = {proofId: 'p8-b1-grid-axis-diagnostic-v1', accepted: true,
			wavelengthNanometers: result.wavelengthNanometers, rmseMilliwatt: scores,
			variants: result.results.map(({spectra, ...rest}) => rest), gpu: result.gpu,
			claimBoundary: 'Single-wavelength diagnostic attribution only; no aggregate B1 acceptance.'};
		await run.writeJsonArtifact('evidence/b1-grid-axis.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
			report: `# ${run.runId}: P8 B1 grid-axis diagnostic\n\nConclusion: **accepted diagnostic evidence**.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			rmseMilliwatt: scores, variants: evidence.variants}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: grid-axis diagnostic failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
