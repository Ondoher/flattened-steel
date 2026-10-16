import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {checkedAbsolute, createRun, identity, readRepository, repositoryRoot, verifyRun} from './io/files.mjs';
import {runGpu} from './gpu/host.mjs';
import {verifyRun as verifyParent} from '../sky-angular-quadrature/io/files.mjs';
import {browserSources} from '../sky-accuracy-dials/execution.mjs';
import {parseBoundaryTsv} from '../sky-accuracy-dials/analysis/boundary.mjs';
import {scoreBoundary} from '../sky-accuracy-dials/analysis/metrics.mjs';
import {horizonFigure, scalarFigure} from '../sky-angular-quadrature/render.mjs';

const parent = 'tmp/experiments/sky-angular-quadrature/runs/00007-q2-base-full';
const compiler = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const browser = 'experiments/sky-angular-quadrature/gpu/browser.js';
const maximumMilliseconds = 15 * 60 * 1000;

/** Decode authenticated little-endian binary64 channel data.
 * @param {AngularFileIdentity} record @returns {Float64Array}
 */
function decode(record) {
	const bytes = readRepository(record.path, record);
	assert.equal(bytes.length % 8, 0);
	return Float64Array.from({length: bytes.length / 8}, (_, i) => bytes.readDoubleLE(i * 8));
}

/** Map GPU scene/X/Y order to the canonical time/Y/X/channel measurement boundary.
 * @param {AngularGpuControl} control @param {readonly AngularCapturedChannel[]} channels
 * @param {AngularFileIdentity} sourceIdentity @returns {DialAnalysisBoundary}
 */
function boundary(control, channels, sourceIdentity) {
	assert.equal(control.scenes.length, 17);
	assert.equal(channels.length, 40);
	assert.deepEqual(
		channels.map((c) => c.metadata.channel),
		Array.from({length: 40}, (_, i) => i),
	);
	const values = new Float64Array(17 * 81 * 40);
	for (const {metadata, values: source} of channels) {
		const n = metadata.shape.rayCount;
		assert.equal(n, 17 * 81 + 9);
		assert.equal(source.length, 4 * n);
		for (let t = 0; t < 17; t++)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++)
					values[(t * 81 + y * 9 + x) * 40 + metadata.channel] = source[3 * n + t * 81 + x * 9 + y];
	}
	return {
		configId: control.buildRequest.id,
		quantity: 'radiance',
		units: 'W m^-2 sr^-1 nm^-1',
		times: control.scenes.map((s) => s.time),
		channels: Array.from({length: 40}, (_, i) => i),
		rayIndices: Array.from({length: 81}, (_, i) => i),
		values,
		sourceIdentity,
	};
}

/** Qualify immutable baseline reuse, run the one-factor GPU candidate and score all paper cells.
 * @returns {Promise<void>} Seals success or failure; rejects unsuccessful execution without altering parent evidence.
 */
async function main() {
	const started = performance.now();
	// Reject an aliased executable before allocating any evidence or scratch.
	checkedAbsolute(process.execPath);
	const parentSeal = verifyParent(parent);
	assert.equal(JSON.parse(readRepository(parentSeal.path, parentSeal, 64 * 1024 ** 2).toString()).state, 'accepted');
	/** @type {AngularGpuControl} */
	const control = JSON.parse(readRepository(`${parent}/control.json`).toString());
	assert.deepEqual(
		control.channels,
		Array.from({length: 40}, (_, i) => i),
	);
	assert.equal(control.horizonWitness, true);
	const oldExecution = JSON.parse(readRepository(`${parent}/execution.json`).toString()).execution;
	const closure = browserSources([browser, compiler]);
	for (const source of oldExecution.servedSources) readRepository(source.path, source);
	assert.deepEqual(
		closure.map((r) => ({path: r.path, sha256: r.sha256})).sort((a, b) => a.path.localeCompare(b.path)),
		oldExecution.servedSources
			.map((r) => ({path: r.path, sha256: r.sha256}))
			.sort((a, b) => a.path.localeCompare(b.path)),
	);
	const baseline = control.channels.map((channel) => {
		/** @type {AngularCapturedMetadata} */
		const metadata = JSON.parse(
			readRepository(`${parent}/channel-${String(channel).padStart(2, '0')}.json`).toString(),
		);
		return {metadata, values: decode(metadata.spectra)};
	});
	const measurement = identity('tmp/experiments/sky-accuracy-dials/runs/00000-inputs/measurements.tsv');
	const measured = parseBoundaryTsv(readRepository(measurement.path, measurement).toString(), {
		configId: 'paper-measurement',
		sourceIdentity: measurement,
	});
	const baseBoundary = boundary(control, baseline, parentSeal);
	const baseScore = scoreBoundary(baseBoundary, measured);
	assert.ok(baseScore.fullRegisteredBoundary && baseScore.sampleCount === 42687);
	assert.ok(
		Math.abs(baseScore.aggregateRmseMilliwatt - 11.622914028288646) < 1e-10,
		'Saved baseline score differs beyond floating-point summation tolerance.',
	);
	const compilerIdentity = identity(compiler);
	const hostParent = identity('experiments/sky-angular-quadrature/gpu/host.mjs');
	const run = createRun('paper-rmse', {
		parents: [parentSeal, measurement, hostParent, ...closure],
		operation:
			'Qualify unchanged paper baseline by fresh exact GPU channel16 parity; force only legacy inter-order altitude selection for all40 channels; map N4 to canonical paper cells and compute RMSE.',
		parameters: {
			control,
			maximumMilliseconds,
			newRetainedLimitBytes: 20 * 1024 ** 2,
			hostAdaptation:
				'Only owned scratch boundary changes from sky-angular-quadrature to sky-altitude-reconstruction.',
			parity: 'Exact all four cumulative spectra and J1-J4 sparse pure/cumulative hashes at channel16.',
			invariance: 'Exact J1/J2 pure and cumulative sparse hashes at every candidate wavelength.',
			benchmark:
				'Native51/Direct40/source20/transport40/F68/Q30 paper grass, ozone disabled; distinct from production-noon controls.',
		},
	});
	let failure = null;
	/** @type {AngularCapturedChannel[]} */ const candidate = [];
	const horizon = Array.from({length: 9}, () => []);
	const baselineHorizon = Array.from({length: 9}, (_, i) =>
		baseline.map((c) => c.values[3 * c.metadata.shape.rayCount + 17 * 81 + i]),
	);
	/** @type {AngularScalarRow[]} */ const progressRows = [];
	try {
		run.write('control.json', control);
		const original = readRepository(compiler, compilerIdentity).toString();
		const from = 'const positionStencilSource = sourceAligned',
			to = 'const positionStencilSource = true';
		assert.equal(original.split(from).length, 2);
		const derivedPath = `${run.path}/nearest-paper-compiler.js`;
		const originalImport = "'./DistantSunSceneCacheNumerics.js'";
		const derivedImport = `'${path.posix.relative(path.posix.dirname(derivedPath), 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js')}'`;
		assert.equal(original.split(originalImport).length, 2);
		const derived = original.replace(from, to).replace(originalImport, derivedImport);
		assert.equal(derived.replace(to, from).replace(derivedImport, originalImport), original);
		const variant = run.write('nearest-paper-compiler.js', derived, {
			parents: [compilerIdentity],
			operation:
				'Two exact reversible substitutions: select legacy altitude branch; relocate the unchanged relative Numerics import.',
			parameters: {
				substitutions: [
					[from, to],
					[originalImport, derivedImport],
				],
			},
		});
		run.write('derivation.json', {compilerIdentity, variant, from, to, originalImport, derivedImport, hostParent});
		/** Run one hardware-GPU job in its own scratch child; all failures remain evidence.
		 * @param {string} label @param {AngularGpuControl} recipe @param {AngularFileIdentity[]} sources
		 * @param {string} entry @param {(channel: SkyGpuChannel) => Promise<void>} onChannel
		 * @returns {Promise<void>}
		 */
		async function execute(label, recipe, sources, entry, onChannel) {
			const scratchDirectory = path.join(run.scratchPath, label);
			mkdirSync(scratchDirectory);
			checkedAbsolute(scratchDirectory);
			const timeoutMilliseconds = Math.floor(maximumMilliseconds - (performance.now() - started));
			assert.ok(timeoutMilliseconds >= 1000, 'Aggregate execution allocation exhausted.');
			run.progress(label, `Starting ${label} on hardware GPU.`);
			const execution = await runGpu({
				repositoryRoot,
				scratchDirectory,
				chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
				control: recipe,
				sourceIdentities: sources,
				browserModulePath: browser,
				compilerModulePath: entry,
				timeoutMilliseconds,
				readSource: async (file) => {
					const record = sources.find((s) => s.path === file);
					assert.ok(record);
					return readRepository(file, record);
				},
				onProgress: async (event) => {
					run.guard();
					run.progress(event.phase, event.message, event.completed, event.total);
				},
				onChannel,
			});
			run.write(`${label}-execution.json`, execution);
			assert.ok(execution.executionSucceeded, execution.failure ?? 'GPU execution failed.');
		}
		await execute('qualification', {...control, channels: [16]}, closure, compiler, async (channel) => {
			const previous = baseline[16];
			assert.deepEqual(channel.values, previous.values, 'Baseline cumulative GPU parity failed.');
			assert.deepEqual(channel.fieldChecks, previous.metadata.fieldChecks, 'Baseline sparse GPU parity failed.');
			assert.deepEqual(channel.shape, previous.metadata.shape);
			run.write('baseline-parity.json', {
				channel: 16,
				exact: true,
				scalarCount: channel.values.length,
				fieldChecks: channel.fieldChecks,
				reusedSeal: parentSeal,
				servedSources: closure,
			});
		});
		const candidateClosure = closure.map((s) => (s.path === compiler ? variant : s));
		await execute('candidate', control, candidateClosure, variant.path, async (channel) => {
			const c = channel.channel,
				previous = baseline[c];
			assert.equal(c, candidate.length, 'Candidate channels arrived out of order.');
			assert.deepEqual(channel.shape, previous.metadata.shape);
			for (let order = 0; order < 2; order++)
				assert.deepEqual(
					channel.fieldChecks[order],
					previous.metadata.fieldChecks[order],
					'J1/J2 invariance failed.',
				);
			const report = /** @type {AngularGpuReport} */ (channel.compilerReport);
			assert.ok(
				report.pureRaySpectra.length === 4 &&
					report.pureRaySpectra.every(
						(v) => v.length === channel.shape.rayCount && v.every((x) => Number.isFinite(x) && x >= 0),
					),
			);
			const stem = `channel-${String(c).padStart(2, '0')}`,
				bytes = Buffer.alloc(channel.values.length * 8);
			channel.values.forEach((value, i) => bytes.writeDoubleLE(value, i * 8));
			const spectra = run.write(`${stem}.f64`, bytes),
				{values, ...header} = channel;
			const metadata = {...header, compilerReport: report, spectra};
			run.write(`${stem}.json`, metadata);
			candidate.push({metadata, values});
			for (let i = 0; i < 9; i++) horizon[i].push(values[3 * channel.shape.rayCount + 17 * 81 + i]);
			progressRows.push({
				label: `${control.buildRequest.transportSpec.domains.spectrum.channels[c].centerNanometers}nm`,
				baseline: baselineHorizon[3][c],
				candidate: horizon[3][c],
			});
			if (candidate.length % 10 === 0) {
				const image = run.write(
					`progress-${candidate.length}.svg`,
					scalarFigure(
						progressRows,
						'Legacy altitude selection: paper-profile N4 spectral progress, 3-degree source-facing witness',
					),
				);
				run.progress('visual', image.path, candidate.length, 40);
				console.log(JSON.stringify({completed: candidate.length, total: 40, image: image.path}));
			}
		});
		const inputIdentity = run.write(
			'candidate-inventory.json',
			candidate.map((c) => c.metadata.spectra),
		);
		const candBoundary = boundary(control, candidate, inputIdentity),
			candScore = scoreBoundary(candBoundary, measured);
		assert.ok(candScore.fullRegisteredBoundary && candScore.sampleCount === 42687);
		const delta = candScore.aggregateRmseMilliwatt - baseScore.aggregateRmseMilliwatt;
		const cells = [];
		for (let t = 0; t < 17; t++)
			for (let ray = 0; ray < 81; ray++) {
				let change = 0;
				for (let c = 0; c < 31; c++) {
					const i = (t * 81 + ray) * 40 + c;
					const residual = baseBoundary.values[i] - measured.values[i],
						d = candBoundary.values[i] - baseBoundary.values[i];
					change += 2 * residual * d + d * d;
				}
				cells.push({time: control.scenes[t].time, x: ray % 9, y: Math.floor(ray / 9), deltaSSE: change});
			}
		const sum = cells.reduce((s, c) => s + c.deltaSSE, 0);
		assert.ok(
			Math.abs(sum - (candScore.squaredError - baseScore.squaredError)) <= 1e-9 * Math.max(1, Math.abs(sum)),
		);
		const scores = {
			baseline: baseScore,
			candidate: candScore,
			delta,
			percent: (100 * delta) / baseScore.aggregateRmseMilliwatt,
			matchesOrImproves: delta <= 0,
			j1J2ExactAllChannels: true,
			baselineReuse: parentSeal,
			scope: 'Paper benchmark policy comparison, not the Native48/Native15 noon screenshot; no twilight qualification or production promotion.',
		};
		run.write('paper-scores.json', scores);
		run.write('spatial.json', {
			cells,
			sumDeltaSSE: sum,
			positive: cells.filter((c) => c.deltaSSE > 0).reduce((s, c) => s + c.deltaSSE, 0),
			negative: cells.filter((c) => c.deltaSSE < 0).reduce((s, c) => s + c.deltaSSE, 0),
		});
		run.write(
			'scores.svg',
			scalarFigure(
				baseScore.conditions.map((b, i) => ({
					label: b.time,
					baseline: b.rmseMilliwatt,
					candidate: candScore.conditions[i].rmseMilliwatt,
				})),
				'Full paper RMSE by time: production versus legacy altitude selection',
				'RMSE mW m^-2 sr^-1 nm^-1; lower is better',
			),
		);
		run.write(
			'horizon.svg',
			horizonFigure(
				baselineHorizon,
				horizon,
				control.buildRequest.transportSpec.domains.spectrum.channels.map((c) => c.centerNanometers),
			)
				.replace('angular candidate', 'legacy altitude candidate')
				.replaceAll('horizon2048', 'legacy-bin'),
		);
		console.log(
			JSON.stringify({
				run: run.path,
				baseline: baseScore.aggregateRmseMilliwatt,
				candidate: candScore.aggregateRmseMilliwatt,
				delta,
				percent: scores.percent,
			}),
		);
	} catch (error) {
		failure = {message: String(error), stack: error.stack};
	}
	run.cleanup();
	const seal = run.finish(failure ? 'failed' : 'accepted', {
		elapsedMilliseconds: performance.now() - started,
		failure,
		completedChannels: candidate.length,
	});
	verifyRun(run.path);
	assert.equal(JSON.parse(readRepository(seal.path).toString()).state, 'accepted', JSON.stringify(failure));
}

/** Verify completed evidence and publish a labeled report without repeating GPU science.
 * @param {string} captureRun @returns {void} Seals a derived report or preserves its failure.
 */
function report(captureRun) {
	checkedAbsolute(process.execPath);
	const captureSeal = verifyRun(captureRun);
	const seal = JSON.parse(readRepository(captureSeal.path, captureSeal, 64 * 1024 ** 2).toString());
	assert.equal(seal.state, 'accepted');
	assert.equal(seal.result.completedChannels, 40);
	const scoresIdentity = identity(`${captureRun}/paper-scores.json`);
	const scores = JSON.parse(readRepository(scoresIdentity.path, scoresIdentity).toString());
	const spatialIdentity = identity(`${captureRun}/spatial.json`);
	const spatial = JSON.parse(readRepository(spatialIdentity.path, spatialIdentity).toString());
	const shared = [
		'experiments/sky-angular-quadrature/io/files.mjs',
		'experiments/sky-angular-quadrature/render.mjs',
		'experiments/sky-accuracy-dials/execution.mjs',
		'experiments/sky-accuracy-dials/io/files.mjs',
		'experiments/sky-accuracy-dials/analysis/boundary.mjs',
		'experiments/sky-accuracy-dials/analysis/metrics.mjs',
		'experiments/sky-accuracy-dials/horizon/diagnosis-color.mjs',
		'experiments/sky-accuracy-dials/continuation/capture/diagnostics.js',
		...browserSources([browser, compiler]).map((s) => s.path),
	]
		.filter((name, index, all) => all.indexOf(name) === index)
		.map((name) => identity(name));
	const run = createRun('paper-report', {
		parents: [captureSeal, scoresIdentity, spatialIdentity, ...shared],
		operation:
			'Verify accepted capture; retain shared implementation identities; summarize full paper scores/spatial SSE and correct inherited angular labels in a new derived witness image. No GPU computation or parent mutation.',
		parameters: {
			captureRun,
			benchmark: 'Same registered paper controls as capture',
			labelSubstitutions: [
				['angular candidate', 'legacy altitude candidate'],
				['horizon2048', 'legacy-bin'],
			],
			numericalSourceRevision: 'b5e7c2323457853b2697df7a51ea80e985e0e548; shared inputs remain unchanged',
		},
	});
	try {
		run.write(
			'shared-sources.json',
			shared.map((s) => ({...s, text: readRepository(s.path, s).toString()})),
		);
		const improved = scores.baseline.conditions.map((b, i) => ({
			time: b.time,
			baseline: b.rmseMilliwatt,
			candidate: scores.candidate.conditions[i].rmseMilliwatt,
			delta: scores.candidate.conditions[i].rmseMilliwatt - b.rmseMilliwatt,
		}));
		const summary = {
			baseline: scores.baseline.aggregateRmseMilliwatt,
			candidate: scores.candidate.aggregateRmseMilliwatt,
			delta: scores.delta,
			percent: scores.percent,
			improvedTimes: improved.filter((s) => s.delta < 0).length,
			worseTimes: improved.filter((s) => s.delta > 0).length,
			times: improved,
			improvedCells: spatial.cells.filter((c) => c.deltaSSE < 0).length,
			worseCells: spatial.cells.filter((c) => c.deltaSSE > 0).length,
			positiveDeltaSSE: spatial.positive,
			negativeDeltaSSE: spatial.negative,
			elapsedMilliseconds: seal.result.elapsedMilliseconds,
			cleanup: seal.cleanup,
			retainedCaptureBytes: seal.artifacts.reduce((sum, a) => sum + a.byteLength, 0) + captureSeal.byteLength,
		};
		assert.ok(summary.retainedCaptureBytes < 20 * 1024 ** 2);
		run.write('summary.json', summary);
		for (const file of ['horizon.svg', 'scores.svg']) {
			const source = identity(`${captureRun}/${file}`);
			const text = readRepository(source.path, source).toString();
			run.write(
				file,
				file === 'horizon.svg'
					? text
							.replace('angular candidate', 'legacy altitude candidate')
							.replaceAll('horizon2048', 'legacy-bin')
					: text,
				{
					parents: [source],
					operation:
						file === 'horizon.svg'
							? 'Replace inherited angular labels only; retain every numerical color and witness coordinate.'
							: 'Copy the exact complete score chart for the derived report.',
				},
			);
		}
		run.finish('accepted', summary);
		verifyRun(run.path);
		console.log(JSON.stringify({run: run.path, ...summary}));
	} catch (error) {
		run.finish('failed', {message: String(error)});
		throw error;
	}
}
if (process.argv[2] === 'report') report(process.argv[3]);
else await main();
