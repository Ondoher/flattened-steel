import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {checkedAbsolute, createRun, identity, readRepository, repositoryRoot, verifyRun} from '../io/files.mjs';
import {runGpu} from './host.mjs';
import {browserSources} from '../execution.mjs';
import {parseBoundaryTsv} from '../analysis/boundary.mjs';
import {scoreBoundary} from '../analysis/metrics.mjs';
import {scalarFigure,writePaperFigures} from './figures.mjs';
import {sha256} from '../io/files.mjs';

const parent = 'tmp/experiments/sky-angular-quadrature/runs/00007-q2-base-full';
const compiler = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const browser = 'experiments/sky-angular-quadrature/gpu/browser.js';
const maximumMilliseconds = 60 * 60 * 1000;

/** Authenticate the accepted foreign run without granting write access to its root.
 * @returns {DialFileIdentity} Exact immutable parent seal.
 */
function verifyBaseline(){
 const bytes=readRepository(parent+'/sealed.json',undefined,64*1024**2),seal=JSON.parse(bytes.toString());
 assert.equal(seal.schemaId,'sky-angular-run-seal-v1');assert.equal(seal.run,parent);assert.equal(seal.state,'accepted');assert.equal(seal.heartbeatFailure,null);assert.equal(seal.sourceFailures.length,0);assert.equal(seal.cleanup.absent,true);assert.equal(seal.cleanup.owner,parent);
 for(const artifact of seal.artifacts){assert.ok(artifact.path.startsWith(parent+'/'));readRepository(artifact.path,artifact,64*1024**2);}
 return identity(parent+'/sealed.json',bytes);
}

/** Decode authenticated little-endian binary64 channel data.
 * @param {DialFileIdentity} record @returns {Float64Array}
 */
function decode(record) {
	const bytes = readRepository(record.path, record);
	assert.equal(bytes.length % 8, 0);
	return Float64Array.from({length: bytes.length / 8}, (_, i) => bytes.readDoubleLE(i * 8));
}

/** Map GPU scene/X/Y order to the canonical time/Y/X/channel measurement boundary.
 * @param {B1GpuControl} control @param {readonly B1CapturedChannel[]} channels
 * @param {DialFileIdentity} sourceIdentity @returns {DialAnalysisBoundary}
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

/** Qualify immutable baseline reuse, run the two-change GPU candidate and score all paper cells.
 * @returns {Promise<void>} Seals success or failure; rejects unsuccessful execution without altering parent evidence.
 */
async function main() {
	const started = performance.now();
	// Reject an aliased executable before allocating any evidence or scratch.
	checkedAbsolute(process.execPath);
	const parentSeal = verifyBaseline();
	assert.equal(JSON.parse(readRepository(parentSeal.path, parentSeal, 64 * 1024 ** 2).toString()).state, 'accepted');
	/** @type {B1GpuControl} */
	const baselineControl = JSON.parse(readRepository(`${parent}/control.json`).toString());
	const control={...baselineControl,buildRequest:{...baselineControl.buildRequest,id:'b1-normalized60-direct40-n4-v1',transportSpec:{...baselineControl.buildRequest.transportSpec,numerical:{...baselineControl.buildRequest.transportSpec.numerical,transportIntervalCount:60}}},controls:{...baselineControl.controls,transportIntervals:60}};
	assert.deepEqual(
		control.channels,
		Array.from({length: 40}, (_, i) => i),
	);
	assert.equal(control.horizonWitness, true);
	const oldExecution = JSON.parse(readRepository(`${parent}/execution.json`).toString()).execution;
	const closure = browserSources([browser, compiler]);
	const sourceAmendments=[];
	for(const source of oldExecution.servedSources){
	 const current=closure.find(r=>r.path===source.path);assert.ok(current,'Missing former source');
	 if(current.sha256===source.sha256){readRepository(source.path,source);continue;}
	 assert.equal(source.path,'experiments/sky-accuracy-dials/numerics/profile.js');
	 const amended=readRepository(source.path,current).toString();
	 assert.equal(amended.split('[40, 60, 80, 160, 320]').length,2);
	 assert.equal(sha256(amended.replace('[40, 60, 80, 160, 320]','[40, 80, 160, 320]')),source.sha256);
	 sourceAmendments.push({before:source,after:current,operation:'Admit transport60; existing numerical counts unchanged.'});
	}
	assert.equal(closure.length,oldExecution.servedSources.length);
	assert.equal(sourceAmendments.length,1);
	const baseline = control.channels.map((channel) => {
		/** @type {B1CapturedMetadata} */
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
	const baseBoundary = boundary(baselineControl, baseline, parentSeal);
	const baseScore = scoreBoundary(baseBoundary, measured);
	assert.ok(baseScore.fullRegisteredBoundary && baseScore.sampleCount === 42687);
	assert.ok(
		Math.abs(baseScore.aggregateRmseMilliwatt - 11.622914028288646) < 1e-10,
		'Saved baseline score differs beyond floating-point summation tolerance.',
	);
	const compilerIdentity = identity(compiler);
	const hostParent = identity('experiments/sky-accuracy-dials/paper-b1/host.mjs');
	const run = createRun('h55-paper-b1', {
		parents: [parentSeal, measurement, hostParent, ...closure],
		operation:
			'Qualify saved paper baseline with fresh exact GPU channel16 parity; run normalized Mie phase mass plus transport60 across all40 paper wavelengths and17times; score B1 against original measurements and render dome comparisons.',
		parameters: {
			profile: {altitudes:51,incoming:68,outgoing:4374,spectrum:40,times:17,raysPerTime:81,sourceIntervals:20,baselineTransport:40,candidateTransport:60,viewIntervals:30},
			maximumMilliseconds,
			newRetainedLimitBytes: 20 * 1024 ** 2,
			hostAdaptation:
				'Owned scratch boundary changes to sky-accuracy-dials; benchmark browser remains read-only.',
			parity: 'Exact all four cumulative spectra and J1-J4 sparse pure/cumulative hashes at channel16.',
			invariance: 'Exact J1 field hashes and N1 viewed spectra at every candidate wavelength.',
			benchmark:
				'Native51/Direct40/source20/transport40/F68/Q30 paper grass, ozone disabled; distinct from production-noon controls.',
		},
	});
	let failure = null;
	/** @type {B1CapturedChannel[]} */ const candidate = [];
	const horizon = Array.from({length: 9}, () => []);
	const baselineHorizon = Array.from({length: 9}, (_, i) =>
		baseline.map((c) => c.values[3 * c.metadata.shape.rayCount + 17 * 81 + i]),
	);
	/** @type {B1ScalarRow[]} */ const progressRows = [];
	try {
		run.write('control.json', control);
		const original = readRepository(compiler, compilerIdentity).toString();
		const begin=original.indexOf('function scatterFragment('),end=original.indexOf('function transportFragment(',begin);assert.ok(begin>=0&&end>begin);
		let part=original.slice(begin,end);
		const massAddition=' mieSum += incomingRadiance * medium.mieScattering * miePhase(outgoing,incoming) * incomingRecord.w; mieMass += miePhase(outgoing,incoming) * incomingRecord.w;';
		const compensated='compensatedAdd(incomingRadiance * scattering * incomingRecord.w, sum, sumCompensation);';
		const before="'sum += incomingRadiance * scattering * incomingRecord.w;'",after="'sum += incomingRadiance * scattering * incomingRecord.w;"+massAddition+"'";
		assert.equal(part.split("'"+compensated+"'").length,2);
		assert.equal(part.split(before).length,2);assert.equal(part.split('float sum = 0.0;').length,2);assert.equal(part.split('outputValue = sum;').length,2);
		part=part.replace("'"+compensated+"'","'"+compensated+massAddition+"'").replace(before,after).replace('float sum = 0.0;','float sum = 0.0; float mieSum=0.0; float mieMass=0.0;').replace('outputValue = sum;','outputValue = sum - mieSum + mieSum/max(mieMass,1e-12);');
		const normalized=original.slice(0,begin)+part+original.slice(end);
		const derivedPath=run.path+'/normalized-paper-compiler.js';
		const originalImport="'./DistantSunSceneCacheNumerics.js'",derivedImport="'"+path.posix.relative(path.posix.dirname(derivedPath),'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js')+"'";
		assert.equal(normalized.split(originalImport).length,2);
		const derived=normalized.replace(originalImport,derivedImport);
		const variant=run.write('normalized-paper-compiler.js',derived,{parents:[compilerIdentity],operation:'Normalize only the discrete Mie mass in both higher-order scatterFragment angular-sum branches, preserving compensated total summation for the ground-enabled paper path; relocate the unchanged Numerics import. All physical inputs remain fixed.',parameters:{before,after,compensated,massAddition,originalImport,derivedImport}});
		run.write('derivation.json',{compilerIdentity,variant,sourceAmendments,hostParent,baselineNumerics:baselineControl.buildRequest.transportSpec.numerical,candidateNumerics:control.buildRequest.transportSpec.numerical});
		/** Run one hardware-GPU job in its own scratch child; all failures remain evidence.
		 * @param {string} label @param {B1GpuControl} recipe @param {DialFileIdentity[]} sources
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
		await execute('qualification', {...baselineControl, channels: [16]}, closure, compiler, async (channel) => {
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
			for (let order = 0; order < 1; order++)
				assert.deepEqual(
					channel.fieldChecks[order],
					previous.metadata.fieldChecks[order],
					'J1 invariance failed.',
				);
			assert.deepEqual(channel.values.slice(0,channel.shape.rayCount),previous.values.slice(0,previous.metadata.shape.rayCount),'N1 viewed spectra changed.');
			const report = /** @type {B1GpuReport} */ (channel.compilerReport);
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
						'Normalized60 selection: paper-profile N4 spectral progress, 3-degree source-facing witness',
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
			j1ExactAllChannels: true,
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
				'Full paper RMSE by time: paper baseline40 versus normalized60',
				'RMSE mW m^-2 sr^-1 nm^-1; lower is better',
			),
		);
		await writePaperFigures(run,baseBoundary,candBoundary,measured,baseScore,candScore);
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


await main();
