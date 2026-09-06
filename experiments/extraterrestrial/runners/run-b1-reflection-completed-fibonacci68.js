#!/usr/bin/env node

import {execFile} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {promisify} from 'node:util';

import {
	CAPTURE_TIMES,
	loadKiderDataset,
	parseSpectraTsv,
	scoreModels,
} from '../../experiments/b1-directional-sky-radiance/benchmark.js';
import {initializeRunRecord} from '../harness/lib/run-record.js';
import {sha256File} from '../harness/lib/atomic-files.js';
import {
	assertFileInventoriesEqual,
	createFileInventory,
} from '../harness/lib/hashes.js';
import {
	OUTPUT_ROOT,
	REPOSITORY_ROOT,
	assertRepositoryIdentity,
} from '../harness/lib/roots.js';
import {verifyRun} from './verify-run.js';

const executeFile = promisify(execFile);
const COMMAND = 'node experiments/extraterrestrial/runners/run-b1-reflection-completed-fibonacci68.js';
const VARIANT = 'reflection-completed-ordinary-68';
const PROFILE_FAMILY = 'paper-reflection-completed-ordinary-68';
const INCOMING_DOMAIN = 'b1-reflection-completed-ordinary-fibonacci-68-v1';
const B1_ROOT = path.join(REPOSITORY_ROOT, 'scripts', 'experiments', 'b1-directional-sky-radiance');
const ALGORITHM32_ROOT = path.join(REPOSITORY_ROOT, 'src', 'algorithm32');
const BASELINE_ROOT = path.join(
	REPOSITORY_ROOT,
	'tmp',
	'algorithm32-frame-parity',
	'043-production-retained-parity-j4-all17',
	'b1-directional-sky-radiance',
	'gpu',
);
const BASELINE_TABLE_SHA256 = '50a6df87d73bf0b7979faa21675ecdb50099f4be02229313ab65518727bcd486';
const RETAINED_FIB68_TABLE_SHA256 = 'd366ba11a0697aa471f8a822da9ccc9964a67bfcfb18cad0764de62a33583a7f';
const FIGURES = Object.freeze([
	'b1-aggregate-rmse.svg',
	'b1-per-time-rmse.svg',
	'b1-figure5-algorithm32-10h15-z41.png',
	'b1-figure5-algorithm32-11h15-z31.png',
	'b1-figure5-algorithm32-13h15-z21.png',
	'b1-figure5-relative-error-domes.svg',
]);

function requireCondition(value, message) {
	if (!value) throw new Error(message);
}

function scoreTable(tablePath) {
	const scores = scoreModels(loadKiderDataset(), parseSpectraTsv(tablePath));
	const score = scores.get('proposed');
	requireCondition(score, `B1 table has no proposed model: ${tablePath}`);
	return score;
}

function comparisonRecord(baseline, candidate) {
	const perTime = CAPTURE_TIMES.map((time, index) => {
		const base = baseline.conditionScores[index].rmseMilliwatt;
		const next = candidate.conditionScores[index].rmseMilliwatt;
		return {
			time,
			fibonacci34RmseMilliwatt: base,
			fibonacci68RmseMilliwatt: next,
			deltaMilliwatt: next - base,
			percentChange: ((next - base) / base) * 100,
			outcome: next < base ? 'improved' : next > base ? 'worsened' : 'unchanged',
		};
	});
	const baselineAggregate = baseline.aggregate.rmseMilliwatt;
	const candidateAggregate = candidate.aggregate.rmseMilliwatt;
	return {
		schemaId: 'b1-fibonacci34-vs-reflection-completed-fibonacci68-v1',
		metric: 'spectral RMSE over 17 times x 81 directions x 31 scored wavelengths',
		units: 'mW m^-2 sr^-1 nm^-1',
		baseline: {
			quadrature: 'ordinary-fibonacci-34',
			aggregateRmseMilliwatt: baselineAggregate,
			tableSha256: BASELINE_TABLE_SHA256,
		},
		candidate: {
			quadrature: VARIANT,
			aggregateRmseMilliwatt: candidateAggregate,
		},
		aggregateDeltaMilliwatt: candidateAggregate - baselineAggregate,
		aggregatePercentChange: ((candidateAggregate - baselineAggregate) / baselineAggregate) * 100,
		improvedConditionCount: perTime.filter((item) => item.outcome === 'improved').length,
		worsenedConditionCount: perTime.filter((item) => item.outcome === 'worsened').length,
		unchangedConditionCount: perTime.filter((item) => item.outcome === 'unchanged').length,
		perTime,
		figure5: perTime.filter((item) => ['10:15', '11:15', '13:15'].includes(item.time)),
	};
}

function comparisonSvg(comparison) {
	const width = 1060;
	const height = 500;
	const left = 70;
	const top = 55;
	const chartWidth = 950;
	const chartHeight = 350;
	const maximum = Math.max(
		...comparison.perTime.flatMap((item) => [item.fibonacci34RmseMilliwatt, item.fibonacci68RmseMilliwatt]),
	) * 1.08;
	const x = (index) => left + (index / (comparison.perTime.length - 1)) * chartWidth;
	const y = (value) => top + chartHeight - (value / maximum) * chartHeight;
	const polyline = (key) => comparison.perTime.map((item, index) => `${x(index)},${y(item[key])}`).join(' ');
	const labels = comparison.perTime.map((item, index) =>
		`<text x="${x(index)}" y="${top + chartHeight + 24}" text-anchor="middle" font-size="11">${item.time}</text>`,
	).join('');
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="white"/>
<text x="${left}" y="27" font-family="sans-serif" font-size="20">B1 spectral RMSE: ordinary Fibonacci-34 vs reflection-completed Fibonacci-68</text>
<line x1="${left}" y1="${top + chartHeight}" x2="${left + chartWidth}" y2="${top + chartHeight}" stroke="#444"/>
<line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" stroke="#444"/>
<polyline points="${polyline('fibonacci34RmseMilliwatt')}" fill="none" stroke="#a13c32" stroke-width="3"/>
<polyline points="${polyline('fibonacci68RmseMilliwatt')}" fill="none" stroke="#2869a8" stroke-width="3"/>
${labels}
<text x="${left}" y="${height - 28}" font-family="sans-serif" font-size="14" fill="#a13c32">Fibonacci-34: ${comparison.baseline.aggregateRmseMilliwatt.toFixed(6)}</text>
<text x="${left + 310}" y="${height - 28}" font-family="sans-serif" font-size="14" fill="#2869a8">Reflection-completed Fibonacci-68: ${comparison.candidate.aggregateRmseMilliwatt.toFixed(6)}</text>
<text x="${left + 705}" y="${height - 28}" font-family="sans-serif" font-size="14">${comparison.improvedConditionCount}/17 times improve</text>
<text transform="translate(18 ${top + chartHeight / 2}) rotate(-90)" font-family="sans-serif" font-size="13">RMSE (mW m^-2 sr^-1 nm^-1)</text>
</svg>`;
}

function report(runId, comparison) {
	const rows = comparison.perTime.map((item) =>
		`| ${item.time} | ${item.fibonacci34RmseMilliwatt.toFixed(6)} | ${item.fibonacci68RmseMilliwatt.toFixed(6)} | ${item.deltaMilliwatt.toFixed(6)} | ${item.outcome} |`,
	).join('\n');
	const figureLinks = FIGURES.map((name) => `- [${name}](generated/b1-directional-sky-radiance/gpu/figures/${name})`).join('\n');
	return `# ${runId}: B1 reflection-completed Fibonacci-68

Conclusion: **accepted as a complete B1 execution and figure set**.

Reflection completion changes aggregate B1 RMSE from ${comparison.baseline.aggregateRmseMilliwatt.toFixed(6)} to ${comparison.candidate.aggregateRmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1 (${comparison.aggregatePercentChange.toFixed(3)}%). It improves ${comparison.improvedConditionCount} of 17 conditions and worsens ${comparison.worsenedConditionCount}.

[Direct Fibonacci-34/Fibonacci-68 comparison](figures/b1-fibonacci34-vs-fibonacci68-rmse.svg)

## Standard B1 figures

${figureLinks}

## Per-time comparison

| time | F34 | reflected F68 | delta | outcome |
| --- | ---: | ---: | ---: | --- |
${rows}

The only numerical change is the incoming quadrature: each ordinary Fibonacci-34 direction is paired with its source-plane reflection and each pair receives the original half weight. Physical atmosphere, source, J4 order, W27 outgoing grid, and path integration settings are unchanged.
`;
}

async function main() {
	await assertRepositoryIdentity();
	const baselineTable = path.join(BASELINE_ROOT, 'algorithm32-current-production-gpu-j4.tsv');
	requireCondition(await sha256File(baselineTable) === BASELINE_TABLE_SHA256, 'Immutable Fibonacci-34 B1 table changed.');
	const before = {
		algorithm32: await createFileInventory(ALGORITHM32_ROOT),
		b1: await createFileInventory(B1_ROOT),
	};
	const run = await initializeRunRecord({
		slug: 'b1-reflection-completed-fibonacci68-full-figures',
		command: COMMAND,
		inputs: {
			schemaId: 'b1-reflection-completed-fibonacci68-inputs-v1',
			backend: 'gpu-production-shaders-r32f',
			conditions: [...CAPTURE_TIMES],
			maximumScatteringOrder: 4,
			incomingDirectionVariant: VARIANT,
			baseline: {path: path.relative(REPOSITORY_ROOT, BASELINE_ROOT), tableSha256: BASELINE_TABLE_SHA256},
		},
		provenance: {
			schemaId: 'b1-reflection-completed-fibonacci68-provenance-v1',
			operation: 'official B1 GPU generator; replace only incoming ordinary Fibonacci-34 with its reflected half-weight completion; score all 17 conditions; emit all standard B1 figures',
			implementation: 'scripts/experiments/b1-directional-sky-radiance/generate-production-boundary.js',
			containedRunner: 'experiments/extraterrestrial/runners/run-b1-reflection-completed-fibonacci68.js',
			productionMutation: false,
		},
		environment: {schemaId: 'b1-reflection-completed-fibonacci68-environment-v1', node: process.version, platform: process.platform, architecture: process.arch},
		references: {
			schemaId: 'b1-reflection-completed-fibonacci68-references-v1',
			measurementBoundarySha256: 'a751d56dc0d8deb87958cbc9e811204a38f2b86101c732109c3503dfcfedad74',
			publishedModelsSha256: '4e11e9ebc6c8cf2eb85e608d86a750b827a17d13582f4b89f035b71824b204f4',
			retainedFibonacci68TableSha256: RETAINED_FIB68_TABLE_SHA256,
		},
	});
	await run.writeArtifact(
		'work/staging/ledger.txt',
		'Official B1 generator staging root; transient child directories are removed after publication.\n',
	);

	try {
		const test = await executeFile(process.execPath, [
			'--test',
			'--test-isolation=none',
			path.join(B1_ROOT, 'production-profile.test.js'),
			path.join(B1_ROOT, 'generate-production-boundary.test.js'),
			path.join(B1_ROOT, 'ProductionProgressCacheBackend.test.js'),
			path.join(B1_ROOT, 'ProductionRun.test.js'),
			path.join(B1_ROOT, 'compare-production-backends.test.js'),
			path.join(B1_ROOT, 'OutgoingDirectionDiagnosticDomain.test.js'),
		], {
			cwd: REPOSITORY_ROOT,
			windowsHide: true,
			timeout: 180000,
			maxBuffer: 32 * 1024 * 1024,
		});
		await run.writeArtifact('logs/b1-tests.stdout.log', test.stdout);
		await run.writeArtifact('logs/b1-tests.stderr.log', test.stderr);

		const generatedRoot = path.join(run.runDirectory, 'generated');
		const generation = await executeFile(process.execPath, [
			path.join(B1_ROOT, 'generate-production-boundary.js'),
			'--backend', 'gpu',
			'--orders', '4',
			'--incoming-direction-variant', VARIANT,
			'--output-root', generatedRoot,
			'--staging-root', path.join(run.runDirectory, 'work', 'staging'),
			'--progress-log', path.join(run.runDirectory, 'logs', 'b1-gpu-progress.log'),
		], {
			cwd: REPOSITORY_ROOT,
			windowsHide: true,
			timeout: 20 * 60 * 1000,
			maxBuffer: 64 * 1024 * 1024,
		});
		await run.writeArtifact('logs/generation.stdout.log', generation.stdout);
		await run.writeArtifact('logs/generation.stderr.log', generation.stderr);

		const resultRoot = path.join(generatedRoot, 'b1-directional-sky-radiance', 'gpu');
		const manifest = JSON.parse(await readFile(path.join(resultRoot, 'manifest.json'), 'utf8'));
		requireCondition(manifest.status === 'COMPLETE', 'B1 generation did not complete.');
		requireCondition(manifest.incomingDirectionVariant === VARIANT, 'Wrong B1 incoming quadrature.');
		requireCondition(manifest.profileFamily === PROFILE_FAMILY, 'Wrong B1 profile family.');
		requireCondition(JSON.stringify(manifest.conditions) === JSON.stringify(CAPTURE_TIMES), 'B1 condition set changed.');
		requireCondition(JSON.stringify(manifest.orders) === '[4]', 'B1 order changed.');
		const provenance = JSON.parse(await readFile(path.join(resultRoot, 'algorithm32-current-production-gpu-j4-provenance.json'), 'utf8'));
		requireCondition(provenance.numericalControls.incidentDirectionCount === 68, 'B1 did not use 68 incoming directions.');
		requireCondition(provenance.numericalControls.incomingDirectionDomain === INCOMING_DOMAIN, 'B1 incoming-domain identity changed.');
		requireCondition(provenance.rowCount === 17 * 81 && provenance.spectralChannelCount === 40, 'B1 boundary dimensions changed.');

		const figureRecords = [];
		for (const name of FIGURES) {
			const source = path.join(resultRoot, 'figures', name);
			const bytes = await readFile(source);
			requireCondition(bytes.byteLength > 0, `Empty B1 figure: ${name}`);
			await run.writeArtifact(`figures/${name}`, bytes);
			figureRecords.push({name, byteLength: bytes.byteLength, sha256: await sha256File(source)});
		}

		const candidateTable = path.join(resultRoot, 'algorithm32-current-production-gpu-j4.tsv');
		const candidateTableSha256 = await sha256File(candidateTable);
		const comparison = comparisonRecord(scoreTable(baselineTable), scoreTable(candidateTable));
		comparison.candidate.tableSha256 = candidateTableSha256;
		comparison.reproducesRetainedFibonacci68 = candidateTableSha256 === RETAINED_FIB68_TABLE_SHA256;
		comparison.figures = figureRecords;
		await run.writeJsonArtifact('evidence/fib34-vs-fib68-comparison.json', comparison);
		await run.writeArtifact('figures/b1-fibonacci34-vs-fibonacci68-rmse.svg', comparisonSvg(comparison));

		const after = {
			algorithm32: await createFileInventory(ALGORITHM32_ROOT),
			b1: await createFileInventory(B1_ROOT),
		};
		assertFileInventoriesEqual(before.algorithm32, after.algorithm32, 'Algorithm32 read-only inventory');
		assertFileInventoriesEqual(before.b1, after.b1, 'B1 harness read-only inventory');
		await run.writeJsonArtifact('evidence/read-only-inventories.json', {before, after});

		const finalManifest = await run.finalize({
			conclusion: 'accepted',
			result: {
				proofId: 'b1-reflection-completed-fibonacci68-full-figures-v1',
				accepted: true,
				comparison,
				generatedResultRoot: 'generated/b1-directional-sky-radiance/gpu',
			},
			report: report(run.runId, comparison),
		});
		const verification = await verifyRun(run.runDirectory);
		requireCondition(verification.verified && verification.artifactSetSha256 === finalManifest.artifactSetSha256, 'Final immutable-run verification failed.');
		process.stdout.write(`${JSON.stringify({runId: run.runId, conclusion: 'accepted', artifactSetSha256: finalManifest.artifactSetSha256, comparison}, null, 2)}\n`);
	} catch (error) {
		const detail = {name: error?.name ?? 'Error', message: error?.message ?? String(error), stack: error?.stack ?? null};
		try {
			await run.writeJsonArtifact('evidence/failure.json', detail);
			const manifest = await run.finalize({
				conclusion: 'failed',
				result: {proofId: 'b1-reflection-completed-fibonacci68-full-figures-v1', accepted: false, error: detail},
				report: `# ${run.runId}: B1 reflection-completed Fibonacci-68\n\nConclusion: **failed**.\n\n${detail.message}\n`,
			});
			process.stderr.write(`${JSON.stringify({runId: run.runId, conclusion: 'failed', artifactSetSha256: manifest.artifactSetSha256, error: detail}, null, 2)}\n`);
		} catch (finalizationError) {
			process.stderr.write(`${JSON.stringify({conclusion: 'unsealed-failure', error: detail, finalizationError: String(finalizationError)}, null, 2)}\n`);
		}
		process.exitCode = 1;
	}
}

await main();
