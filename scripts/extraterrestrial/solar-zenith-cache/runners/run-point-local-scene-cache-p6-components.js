#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-components.js';
const PARENT = '000526-point-local-scene-cache-p6-radial-diagnostic';
const CONTROL_CACHE = '000520-point-local-scene-cache-p3-compiler';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6ComponentGpuRecurrence.js',
	'solar-zenith-cache/point-local-scene-cache/runP6ComponentBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, controlBefore] = await Promise.all([
		verifyRun(PARENT), verifyRun(CONTROL_CACHE),
	]);
	requireCondition(parentBefore.verified && controlBefore.verified,
		'P6.1 traces or Native48 control cache are not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-components',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-component-inputs-v1',
			scene: 'San Jose solar noon', radialDomain: 'Native48 control',
			tracePixels: ['blue-sky-control', 'gray-band-focus', 'ground-control'],
			orders: [1, 2, 3, 4], finalEventComponents: ['Rayleigh', 'Mie'],
			wavelengths: 15, renderChartsRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p6-component-provenance-v1',
			parent: parentBefore, controlCache: controlBefore,
			operation: 'rerun the unchanged Native48/Z180/F68/W39/N4 solar-noon recurrence with sparse RG32F final-scatter separation; reconstruct each P6.1 path sample and integrate J1-J4 Rayleigh/Mie contributions through the unchanged camera transmittance'},
		environment: {schemaId: 'point-local-p6-component-environment-v1',
			node: process.version, platform: process.platform,
			architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-component-references-v1',
			p6RadialDiagnostic: parentBefore, native48Cache: controlBefore},
	});
	try {
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6ComponentBrowser.js',
			exportName: 'runP6ComponentBrowser', uploadLimitBytes: 8 * 1024 * 1024,
			servedRoots: {'/p6diag/': path.join(RUNS_ROOT, PARENT)}});
		const images = [];
		// Preserve every component chart before applying reconstruction gates.
		for (const analysis of browser.result.analyses) {
			const name = `${analysis.label}-components`;
			const buffer = browser.uploads.get(`/artifact/${name}.png`);
			requireCondition(buffer?.length > 100, `${name} chart was not uploaded.`);
			const artifactPath = `captures/${name}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({name, path: artifactPath, bytes: buffer.length});
		}
		await run.writeJsonArtifact('evidence/component-analysis.json', {
			schemaId: 'point-local-p6-component-analysis-v1',
			queries: browser.result.queries,
			analyses: browser.result.analyses,
		});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(browser.result.gpu.api.includes('WebGL 2')
			&& !/swiftshader|software/iu.test(browser.result.gpu.renderer),
			'P6.2 executes on real WebGL2.');
		check(images.length === 3,
			'All three component charts are preserved before numerical gates.');
		check(browser.result.wavelengths.length === 15
			&& browser.result.wavelengths.every((wavelength) =>
				wavelength.finalLiveFieldBytes === 0),
			'All Native15 schedules complete and release tracked fields.');
		check(browser.result.analyses.every((analysis) =>
			Number.isFinite(analysis.maximumDensityRelativeResidual)
			&& analysis.maximumDensityRelativeResidual <= 0.005
			&& analysis.maximumPathRelativeResidual <= 0.005),
			'Separated components reconstruct cached density and complete path radiance within the established 0.5% binary32 relative policy.');
		check(browser.result.analyses.every((analysis) =>
			Math.abs(analysis.rayleighShare + analysis.mieShare - 1) <= 1e-12
			&& Math.abs(analysis.shares.reduce((sum, order) => sum + order.total, 0) - 1) <= 1e-12),
			'Order and final-event component shares close to unity.');
		check(JSON.stringify(await verifyRun(PARENT)) === JSON.stringify(parentBefore)
			&& JSON.stringify(await verifyRun(CONTROL_CACHE)) === JSON.stringify(controlBefore),
			'P6.1 traces and Native48 cache remain immutable.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const summary = Object.fromEntries(browser.result.analyses.map((analysis) => [
			analysis.label,
			{rayleighShare: analysis.rayleighShare, mieShare: analysis.mieShare,
				orders: analysis.shares,
				maximumDensityRelativeResidual: analysis.maximumDensityRelativeResidual,
				maximumPathRelativeResidual: analysis.maximumPathRelativeResidual},
		]));
		const proof = {proofId: 'point-local-scene-cache-p6-component-proof-v1',
			accepted: true,
			claimBoundary: 'sparse final-scatter component attribution at three retained solar-noon pixels; not a model correction or final resolution choice',
			assertions, summary, images, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.2', accepted: true, summary, images},
			report: `# ${run.runId}: P6.2 scattering components\n\nConclusion: **accepted diagnostic execution**.\n\nAll three component charts were preserved before gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, summary, images}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed',
			result: {phase: 'P6.2', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.2 failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

