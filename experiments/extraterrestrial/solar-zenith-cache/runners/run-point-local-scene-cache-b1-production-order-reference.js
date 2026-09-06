#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {sha256File} from '../../harness/lib/hashes.js';
import {initializeRunRecord} from '../../harness/lib/run-record.js';
import {verifyRun} from '../../runners/verify-run.js';
import {beginContainedEvidence, finishContainedEvidence} from '../point-local-scene-cache/runEvidence.js';

const ENTRY = 'solar-zenith-cache/runners/run-point-local-scene-cache-b1-production-order-reference.js';
const PARENT = '000541-point-local-scene-cache-b1-production-order-reference';
const DIAGNOSTIC_PARENT = '000539-point-local-scene-cache-b1-regression-diagnostics';
const executeFile = promisify(execFile);
const requireCondition = (condition, message) => { if (!condition) throw new Error(message); };
const SOURCES = [ENTRY];
const ORDERS = [1, 2, 3, 4];

function summarizeScore(score) {
	return {
		aggregateRmseMilliwatt: score.aggregate.rmseMilliwatt,
		perTime: score.conditionScores.map(({time, rmseMilliwatt, worst}) => ({time, rmseMilliwatt, worst})),
	};
}

function focusedValue(tableText) {
	const rows = tableText.trimEnd().split('\n').map((line) => line.split('\t'));
	const header = rows[0];
	const wavelengthColumn = header.indexOf('lambda_10');
	const row = rows.slice(1).find((columns) => columns[1] === '11:00'
		&& columns[2] === '3' && columns[3] === '6');
	requireCondition(wavelengthColumn >= 0 && row !== undefined,
		'Generated production table lacks the focused 11:00/(3,6)/477.5 nm value.');
	return Number(row[wavelengthColumn]);
}

async function scoreTable(tablePath) {
	const source = "import {loadKiderDataset,parseSpectraTsv,scoreModels} from './scripts/experiments/b1-directional-sky-radiance/benchmark.js';"
		+ "const score=scoreModels(loadKiderDataset(),parseSpectraTsv(process.argv[1])).get('proposed');"
		+ "if(!score)throw new Error('B1 scorer returned no proposed model.');process.stdout.write(JSON.stringify(score));";
	const result = await executeFile(process.execPath, ['--input-type=module', '-e', source, tablePath],
		{cwd: process.cwd(), windowsHide: true, maxBuffer: 32 * 1024 * 1024});
	return JSON.parse(result.stdout);
}

async function main() {
	const state = await beginContainedEvidence(ENTRY);
	const parent = await verifyRun(PARENT);
	requireCondition(parent.verified && parent.conclusion === 'failed',
		'Sealed B1 production-order source run is unavailable.');
	const diagnosticParent = await verifyRun(DIAGNOSTIC_PARENT);
	requireCondition(diagnosticParent.verified && diagnosticParent.conclusion === 'accepted',
		'Accepted B1 diagnostic parent is unavailable.');
	const parentEvidencePath = path.resolve('tmp/extraterrestrial/runs', DIAGNOSTIC_PARENT,
		'evidence/diagnostics.json');
	const parentEvidence = JSON.parse(await readFile(parentEvidencePath, 'utf8'));
	const sourceOutputRoot = path.resolve('tmp/extraterrestrial/runs', PARENT, 'generated', 'production',
		'b1-directional-sky-radiance', 'gpu');
	const sourceManifestPath = path.join(sourceOutputRoot, 'manifest.json');
	const sourceManifest = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
	requireCondition(sourceManifest.status === 'COMPLETE'
		&& ORDERS.every((order, index) => sourceManifest.orders[index] === order),
		'Source generator manifest is incomplete or has the wrong order ladder.');
	const run = await initializeRunRecord({
		slug: 'point-local-scene-cache-b1-production-order-reference',
		command: `node experiments/extraterrestrial/${ENTRY}`,
		inputs: {
			schemaId: 'point-local-b1-production-order-reference-inputs-v1',
			parentRunId: PARENT,
			diagnosticParentRunId: DIAGNOSTIC_PARENT,
			orders: ORDERS,
			incomingDirectionVariant: 'reflection-completed-ordinary-68',
			conditions: 'all 17 canonical B1 times',
			focusedResidual: {time: '11:00', gridX: 3, gridY: 6, wavelengthNanometers: 477.5},
		},
		provenance: {
			schemaId: 'point-local-b1-production-order-reference-provenance-v1',
			parent,
			diagnosticParent,
			parentEvidence: {runId: DIAGNOSTIC_PARENT, path: 'evidence/diagnostics.json',
				sha256: await sha256File(parentEvidencePath)},
			sourceGeneratorManifest: {runId: PARENT,
				path: 'generated/production/b1-directional-sky-radiance/gpu/manifest.json',
				sha256: await sha256File(sourceManifestPath)},
			operation: 'derive scores from the completed read-only current Algorithm32 GPU J1-through-J4 outputs preserved by the sealed packaging-failure predecessor and compare them with the point-local order ladder',
		},
		environment: {schemaId: 'point-local-b1-production-order-reference-environment-v1', node: process.version,
			platform: process.platform, architecture: process.arch, angle: 'd3d11'},
		references: {schemaId: 'point-local-b1-production-order-reference-references-v1', parent,
			diagnosticParent},
	});
	try {
		await run.writeArtifact('generated/production/manifest.json', await readFile(sourceManifestPath));

		const scores = {};
		const focusedValues = {};
		const tables = {};
		for (const order of ORDERS) {
			const tableName = `algorithm32-current-production-gpu-j${order}.tsv`;
			const tablePath = path.join(sourceOutputRoot, tableName);
			const tableText = await readFile(tablePath, 'utf8');
			const copiedTablePath = `generated/production/${tableName}`;
			await run.writeArtifact(copiedTablePath, tableText);
			const provenanceName = `algorithm32-current-production-gpu-j${order}-provenance.json`;
			await run.writeArtifact(`generated/production/${provenanceName}`,
				await readFile(path.join(sourceOutputRoot, provenanceName)));
			const score = await scoreTable(tablePath);
			scores[order] = summarizeScore(score);
			focusedValues[order] = focusedValue(tableText);
			tables[order] = {path: copiedTablePath, sha256: await sha256File(tablePath),
				sourceRunId: PARENT,
				sourcePath: `generated/production/b1-directional-sky-radiance/gpu/${tableName}`};
		}

		const pointLocalScores = Object.fromEntries(ORDERS.map((order) => [order,
			parentEvidence.scores[`grass-j-through-${order}`].aggregateRmseMilliwatt]));
		const evidence = {
			proofId: 'point-local-b1-production-order-reference-v1',
			accepted: true,
			parentRunId: PARENT,
			diagnosticParentRunId: DIAGNOSTIC_PARENT,
			currentAlgorithm32: {scores, focusedValues, tables},
			pointLocal: {aggregateRmseMilliwattByOrder: pointLocalScores},
			aggregateDifferencePointLocalMinusCurrent: Object.fromEntries(ORDERS.map((order) => [order,
				pointLocalScores[order] - scores[order].aggregateRmseMilliwatt])),
			claimBoundary: 'Current Algorithm32 cumulative-order B1 output comparison; this does not promote or alter either cache implementation.',
		};
		await run.writeJsonArtifact('evidence/production-order-reference.json', evidence);
		await run.writeJsonArtifact('evidence/source-identities.json', await finishContainedEvidence(state, SOURCES));
		const terminal = await run.finalize({
			conclusion: 'accepted',
			result: evidence,
			report: `# ${run.runId}: current Algorithm32 B1 order reference\n\nConclusion: **accepted diagnostic evidence**.\n\nThe read-only current Algorithm32 GPU boundary was executed at cumulative orders J1 through J4 with reflection-completed F68. See evidence/production-order-reference.json.\n`,
		});
		process.stdout.write(`${JSON.stringify({runId: run.runId, artifactSetSha256: terminal.artifactSetSha256,
			currentAlgorithm32Aggregates: Object.fromEntries(ORDERS.map((order) => [order, scores[order].aggregateRmseMilliwatt])),
			pointLocalAggregates: pointLocalScores, focusedValues}, null, 2)}\n`);
	} catch (error) {
		await run.writeJsonArtifact('evidence/failure.json', {message: error.message, stack: error.stack});
		await run.finalize({conclusion: 'failed', result: {accepted: false, error: error.message},
			report: `# ${run.runId}: current Algorithm32 B1 order reference failed\n\n${error.message}\n`});
		throw error;
	}
}

await main();
