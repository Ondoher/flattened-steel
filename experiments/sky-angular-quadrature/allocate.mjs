import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';
import {own} from './common.mjs';
import {horizonCandidates} from './math.mjs';
import {scalarFigure} from './render.mjs';
import {parseBoundaryTsv} from '../sky-accuracy-dials/analysis/boundary.mjs';
import {scoreBoundary} from '../sky-accuracy-dials/analysis/metrics.mjs';

const started = performance.now();
/** @type {AngularFileIdentity[]} */ const parents = [];
const base = /** @type {AngularChannelHeader} */ (
	own('tmp/experiments/sky-angular-quadrature/runs/00004-q2-base-pilot', 'channel-16.json', parents)
);
const cand = /** @type {AngularChannelHeader} */ (
	own('tmp/experiments/sky-angular-quadrature/runs/00005-q2-cand-pilot', 'channel-16.json', parents)
);
assert.equal(base.fieldChecks[0].pureSha256, cand.fieldChecks[0].pureSha256, 'J1 changed.');
const root = 'tmp/experiments/sky-accuracy-dials/runs/00000-inputs';
const measurement = identity(`${root}/measurements.tsv`),
	baseline = identity(`${root}/native51-cpu.tsv`),
	published = identity('references/results/experiments/b1-directional-sky-radiance/published-models.tsv');
parents.push(measurement, baseline, published);
const measured = parseBoundaryTsv(readRepository(measurement.path, measurement).toString(), {
	sourceIdentity: measurement,
	configId: 'paper-measurement',
});
const old = parseBoundaryTsv(readRepository(baseline.path, baseline).toString(), {
	sourceIdentity: baseline,
	configId: 'native51-current-retained',
	modelId: 'native51-cpu-q30',
});
const score = scoreBoundary(old, measured);
const allocation = {
	maximumMilliseconds: 1800000,
	jobs: {'baseline-full': 600000, 'candidate-full': 1080000, 'refinement-pilot': 120000},
	refinement: horizonCandidates([12], 48)[0],
	thresholds: {
		currentRetainedRmse: score.aggregateRmseMilliwatt,
		brunetonPublishedRounded: 11.3,
		libradtranPublishedRounded: 11.5,
	},
	measuredPilot: {
		baselineMilliseconds: 11658,
		candidateMilliseconds: 19726,
		baselinePeakLogicalGpuBytes: base.compilerReport.peakLiveFieldBytes,
		candidatePeakLogicalGpuBytes: cand.compilerReport.peakLiveFieldBytes,
		j1Exact: true,
	},
	estimate: {
		baselineFullMilliseconds: 300000,
		candidateFullMilliseconds: 800000,
		refinementMilliseconds: 45000,
		explanation:
			'Pilot already executes all51x180 positions and all4374 outgoing nodes. More scenes expand sparse extraction and binary64 view evaluation, not recurrence fields. Caps include setup, cleanup and spectral variation; aggregate30min prevents multi-hour execution.',
	},
	retainedBytes: 64 * 1024 ** 2,
	scratchBytes: 1024 ** 3,
	fullRuns:
		'One paired baseline/candidate capture of40channels x17times x81benchmark rays plus9horizon witnesses; reuse pilot data for pilot claims only.',
	acceptance:
		'Candidate must match/improve frozen current RMSE and report published/reproduced paper comparisons separately. No isolated libRadtran gain grants adoption.',
	refinementScope:
		'One independent finer incoming inventory at channel16 on the same full recurrence closure; full spectral convergence is not inferred from that one wavelength.',
};
const run = createRun('q2-allocation', {
	parents,
	operation:
		'Freeze measured post-pilot allocation, full-paper thresholds and independent refinement before full candidate scoring.',
	parameters: {noAtmosphereRetuning: true, j1Invariant: true},
});
try {
	run.write('allocation.json', allocation);
	run.write('baseline-score.json', score);
	const rows = Array.from({length: 9}, (_, i) => ({
		label: `${[0.05, 3, 20][Math.floor(i / 3)]}° / heading${[0, 90, 180][i % 3]}°`,
		baseline: base.compilerReport.pureRaySpectra.reduce((s, v) => s + v[81 + i], 0),
		candidate: cand.compilerReport.pureRaySpectra.reduce((s, v) => s + v[81 + i], 0),
	}));
	run.write(
		'pilot.svg',
		scalarFigure(rows, 'Q2 pilot: separately integrated pure-order sum at548nm; full color pending'),
	);
	run.finish('accepted', {
		elapsedMilliseconds: performance.now() - started,
		currentRetainedRmse: score.aggregateRmseMilliwatt,
		j1Exact: true,
	});
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, score: score.aggregateRmseMilliwatt}));
} catch (error) {
	run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
	throw error;
}
