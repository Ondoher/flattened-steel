#!/usr/bin/env node

import path from 'node:path';

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {RUNS_ROOT} from '../../harness/lib/roots.js';
import {verifyRun} from '../../runners/verify-run.js';
import {executeContainedBrowser} from '../point-local-scene-cache/browserRunHarness.js';
import {
	beginContainedEvidence, finishContainedEvidence,
} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p6-radial-diagnostic.js';
const CONTROL_RUN = '000520-point-local-scene-cache-p3-compiler';
const BUILD_RUN = '000525-point-local-scene-cache-p6-radial-build';
const PARENT = '000524-point-local-scene-cache-p5-renders';
const SOURCES = [ENTRY,
	'solar-zenith-cache/point-local-scene-cache/P6RadialDiagnosticRenderer.js',
	'solar-zenith-cache/point-local-scene-cache/runP6RadialDiagnosticBrowser.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialTrace.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialBuildRequest.js',
	'solar-zenith-cache/point-local-scene-cache/p6RadialDomain.js',
	'solar-zenith-cache/point-local-scene-cache/browserRunHarness.js'];

function requireCondition(value, message) { if (!value) throw new Error(message); }

function normalizedShape(values) {
	const sum = values.reduce((total, value) => total + value, 0);
	return values.map((value) => sum > 0 ? value / sum : 0);
}

function spectralComparison(control, candidate) {
	const controlShape = normalizedShape(control);
	const candidateShape = normalizedShape(candidate);
	return {control, candidate, controlShape, candidateShape,
		maximumAbsoluteShapeChange: Math.max(...controlShape.map((value, index) =>
			Math.abs(value - candidateShape[index]))),
		integratedMagnitudeRatio: candidate.reduce((sum, value) => sum + value, 0)
			/ control.reduce((sum, value) => sum + value, 0)};
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const [parentBefore, controlBefore, buildBefore] = await Promise.all([
		verifyRun(PARENT), verifyRun(CONTROL_RUN), verifyRun(BUILD_RUN),
	]);
	requireCondition(parentBefore.verified && controlBefore.verified && buildBefore.verified,
		'P5, control-cache, or P6 radial-build evidence is not accepted.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-p6-radial-diagnostic',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'point-local-p6-radial-diagnostic-inputs-v1',
			variants: ['Native48 control', 'quadratic near-ground 48-node radial'],
			displays: ['retained', 'linear-quarter-exposure', 'chromaticity'],
			tracePixels: ['blue-sky-control', 'gray-band-focus', 'ground-control'],
			renderRegardlessOfGate: true},
		provenance: {schemaId: 'point-local-p6-radial-diagnostic-provenance-v1',
			parent: parentBefore, controlCache: controlBefore, radialCache: buildBefore,
			operation: 'render control and fixed-count radial redistribution under identical scattering/camera controls; preserve retained and display-neutral images; trace every midpoint path sample at three focused pixels'},
		environment: {schemaId: 'point-local-p6-radial-diagnostic-environment-v1',
			node: process.version, platform: process.platform,
			architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-p6-radial-diagnostic-references-v1',
			p5: parentBefore, controlCache: controlBefore, radialCache: buildBefore},
	});
	try {
		const roots = (id) => path.join(RUNS_ROOT, id);
		const browser = await executeContainedBrowser({run,
			modulePath: '/lane/point-local-scene-cache/runP6RadialDiagnosticBrowser.js',
			exportName: 'runP6RadialDiagnosticBrowser', uploadLimitBytes: 8 * 1024 * 1024,
			servedRoots: {'/p3/': roots(CONTROL_RUN), '/p6/': roots(BUILD_RUN)}});
		const imageNames = browser.result.variants.flatMap((variant) =>
			variant.displays.map((display) => `${variant.id}-${display.displayMode}`));
		const images = [];
		// Preserve all six images before applying any operational checks.
		for (const name of imageNames) {
			const buffer = browser.uploads.get(`/artifact/${name}.png`);
			requireCondition(buffer?.length > 100, `${name} image was not uploaded.`);
			const artifactPath = `captures/${name}.png`;
			await run.writeArtifact(artifactPath, buffer);
			images.push({name, path: artifactPath, bytes: buffer.length});
		}
		const [control, radial] = browser.result.variants;
		const traceComparisons = Object.fromEntries(control.traces.map((trace, index) => [
			trace.label,
			spectralComparison(trace.finalPathRadianceNative15,
				radial.traces[index].finalPathRadianceNative15),
		]));
		await run.writeJsonArtifact('evidence/path-traces.json', {
			schemaId: 'point-local-p6-radial-path-traces-v1',
			control: control.traces,
			radial: radial.traces,
			comparisons: traceComparisons,
		});
		const assertions = [];
		const check = (value, message) => { requireCondition(value, message); assertions.push(message); };
		check(images.length === 6, 'All control and candidate images were preserved unconditionally.');
		check(browser.result.variants.every((variant) => variant.displays.every((display) =>
			display.rendered.webglErrors.length === 0 && display.rendered.resources.cacheDeleted)),
			'Every retained and display-neutral render completed without WebGL errors.');
		check(control.traces.length === 3 && radial.traces.length === 3
			&& [...control.traces, ...radial.traces].every((trace) => trace.samples.length === 15),
			'All focused pixels record every one of the 15 camera-path samples.');
		check(JSON.stringify(await verifyRun(CONTROL_RUN)) === JSON.stringify(controlBefore)
			&& JSON.stringify(await verifyRun(BUILD_RUN)) === JSON.stringify(buildBefore),
			'Both source caches remain immutable during diagnosis.');
		const sourceIdentities = await finishContainedEvidence(state, SOURCES);
		const visualMetrics = Object.fromEntries(browser.result.variants.map((variant) => [
			variant.id,
			Object.fromEntries(variant.displays.map((display) =>
				[display.displayMode, display.rendered.image])),
		]));
		const proof = {proofId: 'point-local-scene-cache-p6-radial-diagnostic-proof-v1',
			accepted: true,
			claimBoundary: 'causal radial/display diagnostic; no physical-accuracy or final-domain claim',
			assertions, isolatedControls: browser.result.isolatedControls,
			images, visualMetrics, traceComparisons, gpu: browser.result.gpu};
		await run.writeJsonArtifact('evidence/source-identities.json', sourceIdentities);
		await run.writeJsonArtifact('evidence/proof.json', proof);
		const terminal = await run.finalize({conclusion: 'accepted',
			result: {phase: 'P6.1-diagnostic', accepted: true, images,
				visualMetrics, traceComparisons},
			report: `# ${run.runId}: P6.1 radial and display diagnostic\n\nConclusion: **accepted diagnostic execution**.\n\nAll six requested control/candidate images were preserved before operational gates.\n`});
		process.stdout.write(`${JSON.stringify({runId: run.runId, accepted: true,
			artifactSetSha256: terminal.artifactSetSha256, images,
			visualMetrics, traceComparisons}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed',
			result: {phase: 'P6.1-diagnostic', accepted: false, error: error.message},
			report: `# ${run.runId}: P6.1 diagnostic failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();

