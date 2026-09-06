#!/usr/bin/env node

import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-p8-owner-decision.js';
const RUNS = Object.freeze({
	previousClosure: '000568-point-local-scene-cache-p8-closure',
	direct40B1: '000545-point-local-scene-cache-b1-non-regression',
	matchedNative15B1: '000558-previous-model-b1-native15-comparison',
	fairFigures: '000559-fair-native15-comparison-figures',
	shiftedDiagnostic: '000561-point-local-scene-cache-p8-interpolation-oracle',
	axisDiagnostic: '000562-point-local-scene-cache-p8-axis-isolation',
	refinedGridDiagnostic: '000563-point-local-scene-cache-p8-refined-grid',
	refinedB1Rejection: '000564-point-local-scene-cache-p8-refined-b1',
	refinedB1Figures: '000567-point-local-scene-cache-p8-refined-b1-figures',
});

function figure() {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="430" viewBox="0 0 1080 430"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="540" y="35" text-anchor="middle" font-size="24">P8 owner decision</text><rect x="70" y="80" width="410" height="215" rx="8" fill="#e5f5e0" stroke="#238b45" stroke-width="3"/><text x="275" y="118" text-anchor="middle" font-size="21">Selected current grid</text><text x="275" y="154" text-anchor="middle" font-size="17">Native48 / Z180 / W27</text><text x="275" y="190" text-anchor="middle" font-size="16">Direct40 B1: 11.5540</text><text x="275" y="222" text-anchor="middle" font-size="16">Matched Native15: 12.2931</text><text x="275" y="263" text-anchor="middle" font-size="17" fill="#238b45">P8 ACCEPTED</text><rect x="600" y="80" width="410" height="215" rx="8" fill="#f0f0f0" stroke="#777" stroke-width="2"/><text x="805" y="118" text-anchor="middle" font-size="21">Shifted/refined grids</text><text x="805" y="158" text-anchor="middle" font-size="16">Retained as diagnostic evidence</text><text x="805" y="190" text-anchor="middle" font-size="16">Not an external physical oracle</text><text x="805" y="222" text-anchor="middle" font-size="16">Refined B1 candidate remains rejected</text><text x="805" y="263" text-anchor="middle" font-size="17" fill="#555">NON-BLOCKING</text><path d="M480 188 L600 188" stroke="#333" stroke-width="2" marker-end="url(#arrow)"/><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#333"/></marker></defs><text x="540" y="345" text-anchor="middle" font-size="17">Reopen grid-convergence work only for a specific visible twilight defect</text><text x="540" y="378" text-anchor="middle" font-size="17">or when an over-resolved/external twilight reference is available.</text></g></svg>`;
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parents = {};
	for (const [name, id] of Object.entries(RUNS)) {
		const verified = await verifyRun(id);
		if (!verified.verified) throw new Error(`Owner-decision parent is unavailable: ${id}.`);
		parents[name] = verified;
	}
	const run = await initializeRunRecord({slug: 'point-local-scene-cache-p8-owner-decision',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {schemaId: 'p8-owner-decision-inputs-v1', parentRuns: RUNS,
			ownerDirection: 'retain current B1-qualified grid; shifted-grid tests are diagnostic and non-blocking',
			renderRegardlessOfDecision: true},
		provenance: {schemaId: 'p8-owner-decision-provenance-v1', parents,
			operation: 'supersede run 000568 promotion interpretation without modifying its immutable evidence; select the canonical grid under the owner-chosen external-accuracy boundary'},
		environment: {node: process.version, platform: process.platform, architecture: process.arch},
		references: {parents}});
	const evidence = {proofId: 'point-local-scene-cache-p8-owner-decision-v1',
		phaseComplete: true, candidateAccepted: true, conclusion: 'accepted',
		selectedCandidate: {position: 'algorithm32-native-48-position-v2',
			solarZenith: 'uniform-solar-zenith-cell-centers-180x1-degree-v1',
			outgoing: 'W27', incoming: 'reflection-completed F68', scatteringOrder: 4,
			viewQuadrature: 'Q30'},
		externalAccuracy: {direct40B1RmseMilliwatt: 11.554012538468113,
			direct40CeilingMilliwatt: 11.820391604126252,
			matchedNative15RmseMilliwatt: 12.293121003109862,
			matchedPreviousNative15RmseMilliwatt: 12.586323005727962},
		diagnosticReclassification: {shiftedGridIsPhysicalOracle: false,
			meaning: 'sensitivity to coordinate-node placement within the same solver',
			promotionEffect: 'non-blocking', refinedGridStatus: 'rejected by unchanged B1',
			reopenWhen: ['a specific twilight defect remains visible',
				'a successively over-resolved reference demonstrates convergence',
				'external twilight spectral measurements become available']},
		supersedesDecisionInterpretationOf: RUNS.previousClosure,
		preservation: 'Every earlier accepted, rejected, failed, diagnostic, and figure run remains immutable.',
		nextPhase: 'P9 physical resources and lifecycle is ready; this decision does not itself authorize production promotion.'};
	await run.writeArtifact('figures/p8-owner-decision.svg', figure());
	await run.writeJsonArtifact('evidence/p8-owner-decision.json', evidence);
	await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, [ENTRY]));
	const terminal = await run.finalize({conclusion: 'accepted', result: evidence,
		report: `# ${run.runId}: P8 owner decision\n\nPhase status: **complete and accepted**.\n\nThe current Native48/Z180/W27 grid remains selected. Shifted-grid evidence is non-blocking diagnostic evidence, and the refined grid remains rejected by B1.\n`});
	process.stdout.write(`${JSON.stringify({runId: run.runId,
		artifactSetSha256: terminal.artifactSetSha256, ...evidence}, null, 2)}\n`);
}

await main();

