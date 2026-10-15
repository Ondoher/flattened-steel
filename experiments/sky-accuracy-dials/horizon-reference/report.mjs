import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun, identity, readRepository, verifyRun, storage} from '../io/files.mjs';
import {readParent, requireUnusedStage} from '../hypotheses/common.mjs';
import {direct, estimate, unit, boundary, dot} from './math.mjs';

const ciePath = 'references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv';

/** Project a declared piecewise-constant spectral basis using exact integration of the original linear CIE table.
 * @param {readonly number[]} wavelengths @param {number} width @returns {HorizonReferenceProjector} Fixed D65 matrix and shared exposure; invalid spectra fail assertions.
 */
function projector(wavelengths, width) {
	const table = readRepository(ciePath)
		.toString()
		.trim()
		.split(/\r?\n/)
		.map((l) => l.split(',').map(Number));
	const weights = wavelengths.map((w) => {
		const a = w - width / 2,
			b = w + width / 2,
			edges = [
				a,
				...Array.from(
					{length: Math.max(0, Math.ceil(b) - Math.floor(a) - 1)},
					(_, i) => Math.floor(a) + 1 + i,
				).filter((x) => x > a && x < b),
				b,
			],
			sum = [0, 0, 0];
		for (let k = 1; k < edges.length; k++)
			for (let c = 0; c < 3; c++) {
				const samples = edges.slice(k - 1, k + 1).map((x) => {
					const lo = Math.max(360, Math.min(829, Math.floor(x))),
						f = x - lo;
					return table[lo - 360][c + 1] * (1 - f) + table[lo + 1 - 360][c + 1] * f;
				});
				sum[c] += ((samples[0] + samples[1]) * (edges[k] - edges[k - 1])) / 2;
			}
		return sum.map((x) => 683 * x);
	});
	return (spectrum) => {
		assert.equal(spectrum.length, wavelengths.length);
		assert.ok(spectrum.every((x) => Number.isFinite(x) && x >= -1e-12));
		const xyz = [0, 0, 0];
		for (let i = 0; i < spectrum.length; i++) for (let c = 0; c < 3; c++) xyz[c] += weights[i][c] * spectrum[i];
		const sum = xyz.reduce((s, x) => s + x, 0),
			rgb = [
				[12831 / 3959, -329 / 214, -1974 / 3959],
				[-851781 / 878810, 1648619 / 878810, 36519 / 878810],
				[705 / 12673, -2585 / 12673, 705 / 667],
			].map((r) => dot(r, xyz));
		const encoded = rgb.map((x) => {
			const y = 1 - Math.exp(-Math.max(0, x) / 6000);
			return Math.round(255 * (y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055));
		});
		return {xyz, xyY: [sum ? xyz[0] / sum : 0, sum ? xyz[1] / sum : 0, xyz[1]], css: `rgb(${encoded.join(',')})`};
	};
}

/** Project complete spectral batch vectors before estimating chromaticity uncertainty.
 * @param {readonly HorizonReferenceBatch[]} batches @param {readonly number[]} indices @param {number} metric
 * @param {HorizonReferenceProjector} project @returns {HorizonReferenceColorEstimate} Mean-spectrum color and marginal sampling intervals.
 */
function batchColor(batches, indices, metric, project) {
	const spectra = Array.from({length: 16}, (_, batch) =>
		indices.map((group) => {
			const row = batches.find((r) => r.group === group && r.batch === batch);
			assert.ok(row);
			return row.means[metric];
		}),
	);
	const colors = spectra.map((s) => project(s).xyY),
		mean = indices.map((_, i) => spectra.reduce((s, a) => s + a[i], 0) / 16);
	return {color: project(mean), uncertainty: [0, 1, 2].map((c) => estimate(colors.map((a) => a[c])))};
}

/** Reduce authenticated reference runs without new transport/GPU work, and retain compact figures and explicit qualification limits.
 * @returns {void} New sealed report; invalid input, scope, budget or parity fails and is retained before rethrow.
 */
function main() {
	requireUnusedStage('h21-h26-report', true);
	const started = Date.now(),
		source = process.argv[2],
		fineRun = process.argv[3];
	assert.match(source, /^\d{5}-h21-h26-ref$/);
	assert.match(fineRun, /^\d{5}-h22-h26-qual$/);
	/** @type {DialFileIdentity[]} */ const parents = [];
	const inputs = /** @type {HorizonReferenceInputs} */ (readParent(source, 'inputs.json.gz', parents)),
		result = /** @type {HorizonReferenceResult} */ (readParent(source, 'results.json.gz', parents)),
		batches = /** @type {HorizonReferenceBatch[]} */ (readParent(source, 'confirmation-batches.json.gz', parents));
	const pilot = /** @type {HorizonReferencePilot} */ (readParent(source, 'pilot.json.gz', parents));
	const controls = /** @type {HorizonReferenceQualificationBatches} */ (
		readParent(source, 'qualification-batches.json.gz', parents)
	);
	const fineInputs = /** @type {HorizonReferenceQualificationInputs} */ (
			readParent(fineRun, 'inputs.json.gz', parents)
		),
		fine = /** @type {HorizonReferenceQualificationBatches} */ (readParent(fineRun, 'batches.json.gz', parents));
	const cpu = /** @type {(HorizonReferenceDirect[] | null)[]} */ (readParent(source, 'cpu.json.gz', parents));
	const old = /** @type {HorizonAuditRegistration} */ (
		readParent('00264-h16-h20-audit', 'registration.json', parents)
	);
	parents.push(identity(ciePath));
	const sourceSeal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + source),
		fineSeal = verifyRun('tmp/experiments/sky-accuracy-dials/runs/' + fineRun);
	parents.push(sourceSeal, fineSeal);
	const a = JSON.parse(readRepository(sourceSeal.path, sourceSeal).toString()).result,
		b = JSON.parse(readRepository(fineSeal.path, fineSeal).toString()).result,
		spent = a.elapsedMilliseconds + a.previousFailureMilliseconds + b.elapsedMilliseconds;
	assert.ok(spent < 1200000 && a.gpuAttempts + b.gpuAttempts === 2);
	const before = storage();
	const run = createRun('h21-h26-report', {
		parents,
		operation:
			'Batch-preserving CIE projection, cumulative order/distance attribution, exact retained-app joins, independent P2 comparisons, numerical qualification and source-proximity reductions.',
		parameters: {
			previousNumericalMilliseconds: spent,
			remainingMilliseconds: 1200000 - spent,
			exposure:
				'1-exp(-linearRGB/6000), fixed D65 XYZ-to-sRGB matrix then sRGB encoding; no per-case gain or white-balance fitting',
			cieInterpolation: 'Exact trapezoid integration of original 1nm piecewise-linear table inside declared bins',
			uncertainty: 'Marginal 95% Student intervals from 16 independent batches, sampling only',
			fullSolarLegHistory: false,
		},
	});
	const definition = identity(run.path + '/definition.json');
	/** Retain a derived record with authenticated ancestors and operation.
	 * @param {string} name @param {unknown} value @returns {DialFileIdentity} New artifact identity; invalid writes fail.
	 */
	function write(name, value) {
		return run.write(name, gzipSync(Buffer.from(JSON.stringify(value)), {level: 9}), {
			parents: [definition],
			operation:
				'Exact reduction of retained batch means or new sparse binary64 matched-ray evaluation, with no physical fitting.',
		});
	}
	try {
		const native = Array.from({length: 15}, (_, i) => 360 + ((i + 0.5) * 470) / 15),
			project = projector(native, 470 / 15),
			colors = [];
		for (const mode of ['local', 'distant'])
			for (const elevation of [0.05, 3, 20]) {
				const id = `${mode}-${elevation}-away`,
					indices = inputs.groups
						.map((g, i) => ({g, i}))
						.filter((x) => x.g.id === id)
						.map((x) => x.i);
				assert.equal(indices.length, 15);
				const after = batchColor(batches, indices, 0, project),
					first = batchColor(batches, indices, 1, project),
					beforeColor = batchColor(batches, indices, 5, project);
				const n4Spectra = indices.map((i) =>
						result.rows[i].metrics.slice(1, 5).reduce((s, m) => s + m.mean, 0),
					),
					farSpectrum = indices.map((i) =>
						[3, 4, 5].reduce((s, bin) => s + result.rows[i].metrics[14 + 8 * bin].mean, 0),
					),
					farBefore = indices.map((i) =>
						[3, 4, 5].reduce((s, bin) => s + result.rows[i].metrics[15 + 8 * bin].mean, 0),
					);
				const far = project(farSpectrum),
					farPre = project(farBefore),
					n4 = project(n4Spectra);
				colors.push({
					id,
					after,
					first,
					before: beforeColor,
					n4,
					far,
					farBefore: farPre,
					farLuminanceFraction: far.xyz[1] / after.color.xyz[1],
					tailLuminanceFraction: 1 - n4.xyz[1] / after.color.xyz[1],
					meanObserverWalkKilometers:
						project(indices.map((i) => result.rows[i].metrics[10].mean)).xyz[1] / after.color.xyz[1],
					meanObserverWalkOpticalDepth:
						project(indices.map((i) => result.rows[i].metrics[11].mean)).xyz[1] / after.color.xyz[1],
					maximumDepth: Math.max(...indices.map((i) => result.rows[i].maximumDepth)),
				});
			}
		const spectral = [];
		for (const mode of ['local', 'distant'])
			for (let k = 0; k < 2; k++) {
				const count = fineInputs.counts[k],
					indices = fine.groups
						.map((g, i) => ({g, i}))
						.filter((x) => x.g.id === `${mode}-fine${count}`)
						.map((x) => x.i),
					projectFine = projector(fineInputs.wavelengths[k], 470 / count);
				spectral.push({
					mode,
					count,
					total: batchColor(fine.rows, indices, 0, projectFine),
					first: batchColor(fine.rows, indices, 1, projectFine),
				});
			}
		const cpuParity = result.rows
			.filter((r) => cpu[r.group])
			.map((r) => {
				const ref = cpu[r.group][1].total,
					mean = r.metrics[1];
				return {
					id: r.id,
					channel: r.channel,
					cpu64: ref,
					mc: mean.mean,
					relative: mean.mean / ref - 1,
					standardErrors: (mean.mean - ref) / Math.max(1e-20, mean.standardError),
					cpuRefinement: cpu[r.group][0].total / ref - 1,
				};
			});
		const quadrature = [];
		for (let group = 0; group < 12; group++)
			quadrature.push({
				group,
				paired: estimate(
					Array.from({length: 16}, (_, batch) => {
						const low = pilot.batches.find(
								(r) => r.group === group && r.batch === batch && r.profile === 'pilot64',
							),
							high = pilot.batches.find(
								(r) => r.group === group && r.batch === batch && r.profile === 'pilot128',
							);
						assert.ok(low && high);
						return high.means[0] - low.means[0];
					}),
				),
			});
		const controlRows = controls.groups.map((g, group) => {
			const seed = controls.rows.filter((r) => r.group === group && r.profile === 'seed-control'),
				rr = controls.rows.filter((r) => r.group === group && r.profile === 'roulette-control'),
				base = result.rows.find((r) => r.id === g.id && r.channel === g.channel);
			assert.equal(seed.length, 16);
			assert.equal(rr.length, 16);
			return {
				id: g.id,
				independent: estimate(seed.map((r) => r.means[0])),
				confirmation: base.metrics[0],
				roulettePaired: estimate(rr.map((r, i) => r.means[0] - seed[i].means[0])),
			};
		});
		const p2 = [];
		for (const mode of [0, 1])
			for (const altitude of [5, 250])
				for (let k = 0; k < 3; k++) {
					const channel = [2, 7, 12][k],
						prior = inputs.qualification.angular.find((r) => r.mode === mode && r.altitude === altitude),
						reference = prior.reference.species.map((s) => s[k]),
						baseline = prior.baseline.species.map((s) => s[k]);
					let values;
					if (mode === 1) {
						const r = result.rows.find((r) => r.id === `p2-${altitude}` && r.channel === channel);
						values = [r.metrics[12], r.metrics[13]];
					} else {
						const group = fine.groups.findIndex(
								(g) => g.id === `local-p2-${altitude}` && g.channel === channel,
							),
							rows = fine.rows.filter((r) => r.group === group);
						values = [12, 13].map((c) => estimate(rows.map((r) => r.means[c])));
					}
					p2.push({
						mode,
						altitude,
						channel,
						independent: values,
						priorContinuous: reference,
						currentAngular: baseline,
						relativeCurrent: baseline.map((x, i) => x / values[i].mean - 1),
						relativePrior: reference.map((x, i) => x / values[i].mean - 1),
						scope: mode
							? 'Exact spherical black-ground N1 incoming and pure P2 source'
							: 'Infinite-slab local incoming, compared with the earlier finite-dome continuous P2 scope; endpoint differences remain identified',
					});
				}
		const app = [];
		for (let mode = 0; mode < 2; mode++)
			for (const elevation of [0.05, 3, 20]) {
				const observation = inputs.observations[mode],
					ray = observation.rays.find((r) => r.uv[0] === 0.5 && r.elevationDegrees === elevation);
				assert.ok(ray);
				const base = inputs.groups.find((g) => g.id === `${mode ? 'distant' : 'local'}-${elevation}-away`),
					v = unit(ray.stages[3].slice(0, 3)),
					m = base.medium,
					origin = base.origin;
				let end = boundary(m, origin, v).distance;
				if (!mode) {
					const physical = old.inputs[0],
						center = [0, 0, physical.domeCenterZ],
						delta = origin.map((x, i) => x - center[i]),
						B = dot(delta, v),
						C = dot(delta, delta) - physical.domeRadius ** 2;
					end = Math.min(end, C / (-B - Math.sqrt(B * B - C)));
				}
				const observed = ray.stages
						.slice(5, 9)
						.flat()
						.filter((_, i) => i !== 15)
						.slice(0, 15),
					matched = mode
						? result.rows
								.filter((r) => r.id === base.id)
								.map((r) => r.metrics.slice(1, 5).reduce((s, x) => s + x.mean, 0))
						: Array.from(
								{length: 15},
								(_, channel) => direct({...base, direction: v, end, channel}, 128).total,
							);
				// Saved distant rays differ by Float32 direction rounding; independently quantify N1 sensitivity, never call the join exact N4 parity.
				const roundedDirectionSensitivity = Array.from({length: 15}, (_, channel) => {
					const exact = direct({...base, direction: v, end, channel}, 64).total;
					return (
						exact /
							cpu[inputs.groups.findIndex((g) => g.id === base.id && g.channel === channel)][1].total -
						1
					);
				});
				app.push({
					mode,
					elevation,
					recordedDirection: ray.stages[3].slice(0, 3),
					normalizedDirection: v,
					end,
					recordedAppEnd: ray.stages[3][3],
					observed,
					matched,
					relative: observed.map((x, i) => x / matched[i] - 1),
					appColor: project(observed),
					referenceColor: project(matched),
					roundedDirectionSensitivity,
					scope: mode
						? 'App N4 minus independent N4; physical rays differ only by documented Float32 rounding, N1 sensitivity explicitly bounded; N4 angular sensitivity not separately certified'
						: 'App N1 minus independently integrated N1 at normalized retained physical direction and independently derived dome endpoint',
				});
				run.progress('report', 'Matched app comparison', app.length, 6);
			}
		const proximity = [];
		for (const elevation of [3, 20])
			for (const channel of [2, 6, 9]) {
				const rows = ['local', 'double', 'parallel'].map((mode) =>
					result.rows.find((r) => r.id === `${mode}-${elevation}-away` && r.channel === channel),
				);
				proximity.push({
					elevation,
					channel,
					total: rows.map((r) => r.metrics[0]),
					first: rows.map((r) => r.metrics[1]),
					relativeToOriginal: rows.map((r) => r.metrics[0].mean / rows[0].metrics[0].mean - 1),
					scope: 'Unattenuated observer irradiance fixed exactly; each finite source attenuated physically along its own source path',
				});
			}
		const summary = {
			colors,
			spectral,
			cpuParity,
			quadrature,
			controlRows,
			p2,
			app,
			proximity,
			precision: {
				resolved: result.rows.filter(
					(r) => r.metrics[0].halfWidth95 <= Math.max(1e-9, 0.01 * r.metrics[0].mean),
				).length,
				total: result.rows.length,
				maximumRelativeHalfWidth: Math.max(
					...result.rows.map((r) => r.metrics[0].halfWidth95 / r.metrics[0].mean),
				),
			},
			limits: [
				'Color is qualified for the declared Native15 source reconstruction; unknown within-bin solar structure is not recovered. Native30/60 refine analytic atmospheric coefficients under the same bin-integrated energy.',
				'Marginal sampling intervals are not simultaneous coverage or systematic-error bounds.',
				'History path length and optical depth cover the observer-side scattering walk, excluding the final direct-solar leg. Last-scatter bins and before/after attenuation are direct estimates.',
				'No live app capture, full N4 regeneration, modified physical fit or production changes.',
				'Matched libRadtran near-horizon output remains absent; no paper RMSE is generated.',
			],
			resources: {
				priorNumericalMilliseconds: spent,
				reportMilliseconds: Date.now() - started,
				storageBefore: before,
				storage: storage(),
			},
		};
		write('assessment.json.gz', summary);
		let svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="650" viewBox="0 0 1040 650"><rect width="1040" height="650" fill="#fff"/><g font-family="sans-serif" font-size="15" fill="#111"><text x="20" y="28">Independent horizon reference — fixed exposure, fixed D65 matrix</text><text x="20" y="51">Native15 solar bins; no fitted gain, atmosphere or white balance. Labels give CIE x,y.</text>';
		for (const [i, name] of ['Mode / elevation', 'Before final trip', 'N1', 'N1–N4', 'All orders'].entries())
			svg += `<text x="${20 + i * 205}" y="86">${name}</text>`;
		for (let row = 0; row < colors.length; row++) {
			const c = colors[row],
				y = 103 + row * 83;
			svg += `<text x="20" y="${y + 30}">${c.id}</text>`;
			for (const [k, color] of [c.before.color, c.first.color, c.n4, c.after.color].entries()) {
				const x = 225 + k * 205;
				svg += `<rect x="${x}" y="${y}" width="185" height="48" fill="${color.css}"/><text x="${x}" y="${y + 67}">${color.xyY
					.slice(0, 2)
					.map((x) => x.toFixed(4))
					.join(', ')}</text>`;
			}
		}
		svg += '</g></svg>';
		run.write('comparison.svg', svg, {
			parents: [definition],
			operation:
				'Fixed-exposure swatches from the retained mean spectra and exact CIE bin projection, with no per-case tuning.',
		});
		assert.ok(Date.now() - started + spent < 1200000);
		const seal = run.finish('accepted', {
			elapsedMilliseconds: Date.now() - started,
			previousNumericalMilliseconds: spent,
			gpuAttempts: 0,
		});
		assert.deepEqual(verifyRun(run.path), seal);
		console.log(
			JSON.stringify({
				run: run.path,
				seal,
				colors: colors.map((c) => ({
					id: c.id,
					first: c.first.color.xyY,
					total: c.after.color.xyY,
					farFraction: c.farLuminanceFraction,
					tail: c.tailLuminanceFraction,
				})),
				precision: summary.precision,
				milliseconds: Date.now() - started,
			}),
		);
	} catch (error) {
		run.finish('failed', {
			elapsedMilliseconds: Date.now() - started,
			previousNumericalMilliseconds: spent,
			gpuAttempts: 0,
			failure: String(error),
		});
		throw error;
	}
}
main();
