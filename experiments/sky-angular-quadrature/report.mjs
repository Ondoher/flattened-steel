import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {gzipSync} from 'node:zlib';
import {createRun, identity, readRepository, verifyRun} from './io/files.mjs';
import {own} from './common.mjs';
import {horizonFigure, scalarFigure} from './render.mjs';
import {parseBoundaryTsv} from '../sky-accuracy-dials/analysis/boundary.mjs';
import {scoreBoundary, scoreDeltaIdentity, spectralDelta} from '../sky-accuracy-dials/analysis/metrics.mjs';

/** Authenticate a completed capture and decode exact little-endian spectra.
 * @param {string} root @param {AngularFileIdentity[]} parents @returns {AngularCapture}
 */
function capture(root, parents) {
	const seal = verifyRun(root),
		terminal = JSON.parse(readRepository(seal.path, undefined, 64 * 1024 ** 2).toString());
	assert.equal(terminal.state, 'accepted');
	parents.push(seal);
	const control = /** @type {AngularGpuControl} */ (JSON.parse(readRepository(`${root}/control.json`).toString()));
	const channels = control.channels.map((c) => {
		const metadata = /** @type {AngularCapturedChannel['metadata']} */ (
			JSON.parse(readRepository(`${root}/channel-${String(c).padStart(2, '0')}.json`).toString())
		);
		const b = readRepository(metadata.spectra.path, metadata.spectra);
		return {metadata, values: Float64Array.from({length: b.length / 8}, (_, i) => b.readDoubleLE(i * 8))};
	});
	return {seal, control, channels};
}

/** Map exact GPU scene/X/Y order into the canonical measurement time/Y/X/channel boundary.
 * @param {AngularCapture} input @returns {DialAnalysisBoundary}
 */
function boundary(input) {
	assert.equal(input.control.scenes.length, 17);
	assert.equal(input.channels.length, 40);
	const values = new Float64Array(17 * 81 * 40);
	for (const {metadata, values: source} of input.channels) {
		const c = metadata.channel,
			n = metadata.shape.rayCount;
		assert.equal(n, 17 * 81 + 9);
		for (let t = 0; t < 17; t++)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++) values[(t * 81 + y * 9 + x) * 40 + c] = source[3 * n + t * 81 + x * 9 + y];
	}
	return {
		configId: input.control.buildRequest.id,
		quantity: 'radiance',
		units: 'W m^-2 sr^-1 nm^-1',
		times: input.control.scenes.map((s) => s.time),
		channels: Array.from({length: 40}, (_, i) => i),
		rayIndices: Array.from({length: 81}, (_, i) => i),
		values,
		sourceIdentity: input.seal,
	};
}

/** Compare all measured cells, retain order changes and show spatial score cancellation.
 * @returns {void} Seals final scientific disposition; standards completion is separate.
 */
function main() {
	const started = performance.now();
	/** @type {AngularFileIdentity[]} */ const parents = [];
	const base = capture(process.argv[2], parents),
		cand = capture(process.argv[3], parents),
		ref = capture(process.argv[4], parents);
	const allocation = /** @type {AngularAllocation} */ (
		own('tmp/experiments/sky-angular-quadrature/runs/00006-q2-allocation', 'allocation.json', parents)
	);
	const measurement = identity('tmp/experiments/sky-accuracy-dials/runs/00000-inputs/measurements.tsv');
	parents.push(measurement);
	const measured = parseBoundaryTsv(readRepository(measurement.path, measurement).toString(), {
		configId: 'paper-measurement',
		sourceIdentity: measurement,
	});
	const b = boundary(base),
		c = boundary(cand),
		bs = scoreBoundary(b, measured),
		cs = scoreBoundary(c, measured),
		delta = spectralDelta(b, c);
	const scored = {times: b.times, rayIndices: b.rayIndices, channels: Array.from({length: 31}, (_, i) => i)};
	own('tmp/experiments/sky-angular-quadrature/runs/00010-q2-space-amend', 'amendment.json', parents);
	const identityResult = scoreDeltaIdentity(b, measured, delta);
	// Score delta identity also records the broader transported40; acceptance uses exactly0-30.
	const changes = [];
	let j1Exact = true,
		maximumSourceJ1Relative = 0;
	for (let channel = 0; channel < 40; channel++) {
		const bc = base.channels[channel],
			cc = cand.channels[channel];
		j1Exact &&= bc.metadata.fieldChecks[0].pureSha256 === cc.metadata.fieldChecks[0].pureSha256;
		const bp = bc.metadata.compilerReport.pureRaySpectra,
			cp = cc.metadata.compilerReport.pureRaySpectra;
		for (let t = 0; t < 17; t++)
			for (let x = 0; x < 9; x++)
				for (let y = 0; y < 9; y++) {
					const i = t * 81 + x * 9 + y,
						k = (t * 81 + y * 9 + x) * 40 + channel,
						residual = b.values[k] - measured.values[k],
						d = delta.values[k];
					const pure = bp.map((v, o) => cp[o][i] - v[i]),
						grouping = d - pure.reduce((s, v) => s + v, 0);
					maximumSourceJ1Relative = Math.max(
						maximumSourceJ1Relative,
						Math.abs(pure[0]) / Math.max(1e-12, bp[0][i]),
					);
					if (channel <= 30)
						changes.push({
							time: b.times[t],
							x,
							y,
							channel,
							baseline: b.values[k],
							candidate: c.values[k],
							residual,
							delta: d,
							deltaSSE: 2 * residual * d + d * d,
							pureOrderDeltas: pure,
							reconstructionGroupingDelta: grouping,
						});
				}
	}
	assert.ok(j1Exact && maximumSourceJ1Relative === 0, 'Incoming-only intervention altered first order.');
	const sum = changes.reduce((s, r) => s + r.deltaSSE, 0),
		difference = cs.squaredError - bs.squaredError;
	assert.ok(Math.abs(sum - difference) < 1e-9 * Math.max(1, Math.abs(sum)), 'Scored0-30 SSE identity failed.');
	const refinement = ref.channels[0],
		pilot = capture('tmp/experiments/sky-angular-quadrature/runs/00005-q2-cand-pilot', parents).channels[0];
	assert.equal(refinement.metadata.fieldChecks[0].pureSha256, pilot.metadata.fieldChecks[0].pureSha256);
	const refinementRelative = Array.from(
		refinement.values,
		(v, i) => (v - pilot.values[i]) / Math.max(1e-12, Math.abs(v)),
	);
	const horizon = Array.from({length: 9}, (_, i) =>
		base.channels.map((ch) => ch.values[3 * ch.metadata.shape.rayCount + 17 * 81 + i]),
	);
	const horizonCandidate = Array.from({length: 9}, (_, i) =>
		cand.channels.map((ch) => ch.values[3 * ch.metadata.shape.rayCount + 17 * 81 + i]),
	);
	const published = identity('references/results/experiments/b1-directional-sky-radiance/published-models.tsv');
	parents.push(published);
	const publishedText = readRepository(published.path, published).toString();
	const modelIds = [
		...new Set(
			publishedText
				.trim()
				.split(/\r?\n/)
				.slice(1)
				.map((l) => l.split('\t')[0]),
		),
	];
	const publishedScores = modelIds
		.filter((name) => /bruneton|elek|libradtran/i.test(name))
		.map((modelId) => ({
			modelId,
			score: scoreBoundary(
				parseBoundaryTsv(publishedText, {configId: modelId, modelId, sourceIdentity: published}),
				measured,
			),
		}));
	const passesCurrent = cs.aggregateRmseMilliwatt <= bs.aggregateRmseMilliwatt;
	const passesRetained = cs.aggregateRmseMilliwatt <= allocation.thresholds.currentRetainedRmse;
	const publishedTarget = Math.min(
		...publishedScores.filter((s) => /bruneton|elek/i.test(s.modelId)).map((s) => s.score.aggregateRmseMilliwatt),
	);
	assert.ok(Number.isFinite(publishedTarget), 'Selected paper comparator is missing.');
	const passesPublished = cs.aggregateRmseMilliwatt <= publishedTarget;
	const disposition =
		passesCurrent && passesRetained && passesPublished
			? 'retain-for-production-design-review'
			: 'reject-full-cache-adoption';
	const run = createRun('q3-q4-report', {
		parents,
		operation:
			'Score the complete paper boundary0-30 from40 transported point wavelengths, map signed spatial/SSE and separately integrated pure-order changes, check J1 invariance and one-channel angular refinement, and render fixed-exposure horizon comparisons.',
		parameters: {
			scoreSelection: scored,
			publishedAuthority: published,
			acceptance:
				'Match/improve current and retained paper RMSE; report published comparisons. No physical-parameter tuning.',
			projection: 'CIE1931 Direct40 point trapezoids360-818.25nm; fixed exposure, sRGB OETF,D65,no adaptation.',
		},
	});
	try {
		run.write('paper-scores.json', {
			baseline: bs,
			candidate: cs,
			publishedScores,
			retainedThreshold: allocation.thresholds.currentRetainedRmse,
			passesCurrent,
			passesRetained,
			passesPublished,
			publishedTarget,
			disposition,
		});
		run.write('cancellation.json', {
			transported40Identity: identityResult,
			scored31Identity: {sumFromCells: sum, scoreDifference: difference},
			positiveSseChange: changes.filter((r) => r.deltaSSE > 0).reduce((s, r) => s + r.deltaSSE, 0),
			negativeSseChange: changes.filter((r) => r.deltaSSE < 0).reduce((s, r) => s + r.deltaSSE, 0),
			j1Exact,
			maximumSourceJ1Relative,
			refinement: {
				channel: 16,
				maximumCumulativeRelative: Math.max(...refinementRelative.map(Math.abs)),
				relative: refinementRelative,
				scope: 'One point wavelength and one benchmark state plus9horizon rays; not full spectral N4 error certification.',
			},
			scope: 'Measurement residuals include reference/input/model uncertainty. Opposing SSE changes do not by themselves identify a second faulty calculation. Pure-ray sum differs from cumulative reconstruction through nonlinear interpolation; grouping delta is retained separately.',
		});
		run.write(
			'spatial.csv.gz',
			gzipSync(
				Buffer.from(
					'time,x,y,channel,baseline,candidate,residual,delta,delta_sse,delta_j1,delta_j2,delta_j3,delta_j4,grouping_delta\n' +
						changes
							.map((r) =>
								[
									r.time,
									r.x,
									r.y,
									r.channel,
									r.baseline,
									r.candidate,
									r.residual,
									r.delta,
									r.deltaSSE,
									...r.pureOrderDeltas,
									r.reconstructionGroupingDelta,
								].join(','),
							)
							.join('\n') +
						'\n',
				),
				{level: 9},
			),
		);
		run.write('horizon-spectra.json', {
			baseline: horizon,
			candidate: horizonCandidate,
			wavelengths: base.control.buildRequest.transportSpec.domains.spectrum.channels.map(
				(c) => c.centerNanometers,
			),
			units: 'W m^-2 sr^-1 nm^-1',
		});
		run.write(
			'horizon.svg',
			horizonFigure(
				horizon,
				horizonCandidate,
				base.control.buildRequest.transportSpec.domains.spectrum.channels.map((c) => c.centerNanometers),
			),
		);
		run.write(
			'scores.svg',
			scalarFigure(
				bs.conditions.map((b, i) => ({
					label: b.time,
					baseline: b.rmseMilliwatt,
					candidate: cs.conditions[i].rmseMilliwatt,
				})),
				'Full paper RMSE by time (mW m^-2 sr^-1 nm^-1; lower is better)',
				'Spectral radiance RMSE, mW m^-2 sr^-1 nm^-1; lower is better',
			),
		);
		const cells = Array.from({length: 17 * 81}, (_, i) => {
			const selected = changes.filter((r) => r.time === b.times[Math.floor(i / 81)] && r.y * 9 + r.x === i % 81);
			return selected.reduce((s, r) => s + r.deltaSSE, 0);
		});
		const maximum = Math.max(...cells.map(Math.abs));
		run.write(
			'spatial.svg',
			`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="900"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="25">Paper spatial SSE change: red worse, blue better; common absolute scale, channels0-30.</text>${b.times
				.map(
					(time, t) =>
						`<text x="${20 + (t % 5) * 215}" y="${55 + Math.floor(t / 5) * 210}">${time}</text>${Array.from(
							{length: 81},
							(_, i) => {
								const v = cells[t * 81 + i],
									a = Math.sqrt(Math.abs(v) / maximum),
									p = Math.round(255 * (1 - a));
								return `<rect x="${20 + (t % 5) * 215 + (i % 9) * 20}" y="${65 + Math.floor(t / 5) * 210 + Math.floor(i / 9) * 20}" width="19" height="19" fill="rgb(${v > 0 ? 255 : p},${p},${v < 0 ? 255 : p})"/>`;
							},
						).join('')}`,
				)
				.join('')}</g></svg>`,
		);
		run.write(
			'conclusion.md',
			`# Angular quadrature result\n\nScientific disposition: **${disposition}**. Full paper RMSE: ${bs.aggregateRmseMilliwatt.toFixed(6)} â†’ ${cs.aggregateRmseMilliwatt.toFixed(6)} mW m^-2 sr^-1 nm^-1. J1 exact: ${j1Exact}. Largest sampled one-wavelength refinement change: ${(100 * Math.max(...refinementRelative.map(Math.abs))).toFixed(4)}%.\n\nThe screened component calculation improved without changing physical inputs. The full-score result is a separate adoption gate. See paper-scores.json, cancellation.json, spatial.csv.gz and fixed-exposure horizon.svg. The retained paper receiver-local backend and app source-aligned H33 setup are distinct; this experiment does not certify the production app horizon or a matched libRadtran N4 oracle. Standards completion is recorded separately in the topic status.\n`,
		);
		run.finish('accepted', {
			elapsedMilliseconds: performance.now() - started,
			disposition,
			baselineRmse: bs.aggregateRmseMilliwatt,
			candidateRmse: cs.aggregateRmseMilliwatt,
		});
		verifyRun(run.path);
		console.log(
			JSON.stringify({
				run: run.path,
				disposition,
				baseline: bs.aggregateRmseMilliwatt,
				candidate: cs.aggregateRmseMilliwatt,
			}),
		);
	} catch (error) {
		run.finish('failed', {elapsedMilliseconds: performance.now() - started, message: String(error)});
		throw error;
	}
}
main();
