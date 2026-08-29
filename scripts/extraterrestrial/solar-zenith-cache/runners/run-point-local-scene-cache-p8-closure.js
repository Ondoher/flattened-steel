#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-closure.js';
const RUNS = Object.freeze({
	canonicalDirect40: '000545-point-local-scene-cache-b1-non-regression',
	matchedNative15: '000558-previous-model-b1-native15-comparison',
	canonicalInterpolation: '000561-point-local-scene-cache-p8-interpolation-oracle',
	axisIsolation: '000562-point-local-scene-cache-p8-axis-isolation',
	refinedInterpolation: '000563-point-local-scene-cache-p8-refined-grid',
	refinedB1: '000564-point-local-scene-cache-p8-refined-b1',
	gridAxis: '000565-point-local-scene-cache-p8-b1-grid-axis',
	refinedFigures: '000567-point-local-scene-cache-p8-refined-b1-figures',
	brunetonContext: '000547-point-local-scene-cache-b1-full-model-comparison',
	aerosolControl: '000528-point-local-scene-cache-p6-aerosol-sweep',
	quadratureAndEndpoints: '000530-point-local-scene-cache-p6-q30-qualification',
	objectCoverage: '000531-point-local-scene-cache-p7-scene-objects',
	sixSceneCoverage: '000533-point-local-scene-cache-p7-six-scene-renders',
	ozoneAndRotationContext: '000497-san-jose-nautical-twilight-actual-point-j1-control',
});

function figure() {
	const rows = [
		['Canonical Direct40 B1', '11.5540 ≤ 11.8204', true],
		['Matched Native15 B1', '12.2931 ≤ 12.5863', true],
		['Canonical held-out field', '57.409% > 10%', false],
		['Refined held-out field', '0.783% ≤ 10%', true],
		['Refined Direct40 B1', '18.4781 > 11.8204', false],
	];
	const body = rows.map(([label, value, pass], index) => {
		const y = 85 + index * 72;
		return `<text x="70" y="${y + 24}" font-size="17">${label}</text><rect x="490" y="${y}" width="360" height="38" rx="4" fill="${pass ? '#238b45' : '#cb181d'}"/><text x="670" y="${y + 25}" text-anchor="middle" fill="white" font-size="16">${value}</text><text x="880" y="${y + 25}" font-size="17" fill="${pass ? '#238b45' : '#cb181d'}">${pass ? 'PASS' : 'REJECT'}</text>`;
	}).join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="510" viewBox="0 0 1040 510"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="520" y="34" text-anchor="middle" font-size="23">P8 terminal qualification matrix</text><text x="520" y="57" text-anchor="middle" font-size="14">No tested coordinate grid passes both physical B1 and held-out convergence gates</text>${body}</g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parents = {};
	for (const [name, id] of Object.entries(RUNS)) {
		const verified = await verifyRun(id);
		if (!verified.verified) throw new Error(`P8 closure parent is unavailable: ${id}.`);
		parents[name] = verified;
	}
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-closure',
		command: `node scripts/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-closure-inputs-v1', parentRuns: RUNS,
			decisionRule: 'a viable candidate must pass unchanged B1 and predeclared held-out convergence gates',
			renderRegardlessOfDecision: true},
		provenance: {schemaId: 'p8-closure-provenance-v1', parents,
			operation: 'assemble terminal P8 decision from sealed numerical, physical-control, scene-coverage, Bruneton-context, and unconditional-figure evidence'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch},
		references: {parents}});
	const matrix = [
		{id: 'canonical-direct40-b1', candidate: 11.554012538468113, ceiling: 11.820391604126252, passed: true},
		{id: 'canonical-matched-native15-b1', candidate: 12.293121003109862, ceiling: 12.586323005727962, passed: true},
		{id: 'canonical-heldout-cumulative', candidate: 0.574091402906241, ceiling: 0.1, passed: false},
		{id: 'refined-heldout-cumulative', candidate: 0.00782735258573031, ceiling: 0.1, passed: true},
		{id: 'refined-direct40-b1', candidate: 18.47808688506421, ceiling: 11.820391604126252, passed: false},
	];
	const evidence = {proofId: 'point-local-scene-cache-p8-terminal-v1', phaseComplete: true,
		candidateAccepted: false, conclusion: 'rejected', matrix,
		cause: 'The canonical grid meets physical B1 but is not held-out converged; the refined grid is held-out stable but regresses the unchanged physical B1 observable.',
		axisAttribution: {canonicalFailure: 'altitude and solar-zenith axes, not W27 outgoing density',
			maximumObservedW27Contribution: 0.020483743568753127,
			b1WorstChannel: {wavelengthNanometers: 477.5, canonicalRmseMilliwatt: 14.52036543893207,
				quadraticAltitudeOnly: 16.68982721435518, adaptiveZenithOnly: 24.778934730590578,
				nestedCandidate: 16.193188268852047}},
		retainedEvidence: {brunetonAggregateContextMilliwatt: 11.28323859,
			controls: ['ozone/source-facing actual-point J1', 'aerosol sweep', 'symmetry/rotation context',
				'Q30 endpoint classes', 'opaque-object shortening', 'six retained Sun scenes'],
			figures: {canonicalFairComparisonRun: '000559-fair-native15-comparison-figures',
				refinedRejectedB1Run: RUNS.refinedFigures}},
		deferredBecauseNoViableCandidate: ['additional astronomical render', 'new source-scaling rerun',
			'production lifecycle/resource qualification'],
		nextDesignBoundary: 'Resolve construction-grid convergence versus B1 physical accuracy before reopening P9; do not promote either tested grid.'};
	await run.writeArtifact('figures/p8-terminal-matrix.svg', figure());
	await run.writeJsonArtifact('evidence/p8-closure.json', evidence);
	await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, [ENTRY]));
	const terminal = await run.finalize({conclusion: 'rejected', result: evidence,
		report: `# ${run.runId}: P8 terminal qualification\n\nPhase status: **complete**. Candidate decision: **rejected**.\n\nNo tested grid passes both the unchanged B1 gate and held-out convergence gate.\n`});
	process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
		...evidence}, null, 2)}\n`);
}

await main();
