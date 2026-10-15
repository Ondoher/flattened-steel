import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, readdirSync} from 'node:fs';
import {
	createRun,
	identity,
	readRepository,
	repositoryRoot,
	resolveRepository,
	sha256,
	storage,
	verifyRun,
} from '../io/files.mjs';
import {readParent, requireUnusedStage, pinProductionClosure} from '../hypotheses/common.mjs';
import {bounds, along, altitude, dot, unit} from '../horizon-audit/math.mjs';
import {direct, estimate} from '../horizon-reference/math.mjs';
import {colorimetry, ciePath} from '../horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {BrunetonColorDisplayModel} from '../../../src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js';
import {continuous, midpoint, sampler, frameError, ownedPacket} from './math.mjs';

/** Read a specific immutable Git blob, never checkout historical code or alter the repository.
 * @param {string} revision Explicit migration revision selector.
 * @param {string} file Repository-relative source path.
 * @returns {HorizonMigrationGitSource} Original source bytes and commit/blob/hash identities; missing Git data rejects before run allocation.
 */
function gitSource(revision, file) {
	const options = {cwd: repositoryRoot, windowsHide: true, timeout: 10000, maxBuffer: 4 * 1024 ** 2};
	const commit = execFileSync('git', ['rev-parse', revision], options).toString().trim();
	const blob = execFileSync('git', ['rev-parse', commit + ':' + file], options)
		.toString()
		.trim();
	const bytes = execFileSync('git', ['cat-file', 'blob', blob], options);
	return {commit, path: file, blob, sha256: sha256(bytes), byteLength: bytes.length, source: bytes.toString()};
}

/** Maximum relative spectral discrepancy, with a fixed small denominator for zero channels.
 * @param {readonly number[]} a First spectrum.
 * @param {readonly number[]} b Comparison spectrum.
 * @returns {number} Relative maximum, not a reference uncertainty estimate.
 */
function relative(a, b) {
	return Math.max(...a.map((x, c) => Math.abs(x - b[c]) / Math.max(1e-12, Math.abs(b[c]))));
}

/** Signed spectral residual and its equal-channel RMS.
 * @param {readonly number[]} value Candidate spectrum.
 * @param {readonly number[]} reference Matched reference spectrum.
 * @returns {number} Spectral RMS in W/(m2 sr nm); no full benchmark claim.
 */
function rms(value, reference) {
	return Math.sqrt(value.reduce((s, v, c) => s + (v - reference[c]) ** 2, 0) / value.length);
}

/** Project a complete Native15 spectrum with independent integrated original CIE weights.
 * @param {readonly number[]} spectrum Native15 bin-average spectral radiance.
 * @returns {HorizonColorReading} Signed color and physical luminance, without exposure.
 */
function color(spectrum) {
	return colorimetry(Array.from(spectrum), 'bin-integrated');
}

/** sRGB output transfer used only for the explicit display alternative.
 * @param {number} value Bounded linear channel.
 * @returns {number} Encoded display channel.
 */
function encode(value) {
	return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;
}

/** Execute the registered retained-data and sparse continuous migration package.
 * @returns {void} Prints a new accepted run; failures are sealed and thrown, never overwritten or silently retried.
 */
function main() {
	const spent = requireUnusedStage('h28-h32-migrate', true),
		started = Date.now(),
		deadline = started + 600000 - spent - 30000,
		before = storage();
	/** @type {DialFileIdentity[]} */ const parents = [];
	const physical = /** @type {HorizonMigrationInput} */ (
		readParent('00264-h16-h20-audit', 'registration.json', parents)
	);
	const inputs = /** @type {HorizonMigrationBatches} */ (readParent('00267-h21-h26-ref', 'inputs.json.gz', parents));
	const batches = /** @type {readonly HorizonMigrationReadonly<HorizonReferenceBatch>[]} */ (
		readParent('00267-h21-h26-ref', 'confirmation-batches.json.gz', parents)
	);
	readParent('00269-h21-h26-report', 'assessment.json.gz', parents);
	const files = [
		'src/flat32/Flat32ColorDisplayModel.js',
		'src/algorithm32/implementation/spherical-earth/SphericalGeometryShaderContributor.js',
		'src/algorithm32/profiles/native-15/native-15-profile.js',
	];
	const history = files.flatMap((file) => ['cd9d8a44^', 'cd9d8a44'].map((revision) => gitSource(revision, file)));
	history.push(
		gitSource('cd9d8a44^', 'src/algorithm32/implementation/distant-sun/cache/DistantSunCache.js'),
		gitSource('cd9d8a44', 'src/algorithm32/implementation/distant-sun/cache/DistantSunSceneCache.js'),
	);
	const curve = gitSource(
		'cd9d8a44',
		'src/algorithm32/implementation/bruneton-source-luminance-lift-color/consts.js',
	);
	history.push(curve);
	const archivePath = resolveRepository('archives', '', false),
		legacyPath = resolveRepository('tmp/extraterrestrial', '', false);
	const availability = {
		legacyOutputPresent: existsSync(legacyPath),
		archiveEntries: existsSync(archivePath) ? readdirSync(archivePath) : [],
		authenticatedWhiteImage: false,
		authenticatedHistoricalN4Payload: false,
	};
	parents.push(
		identity(ciePath),
		identity(
			'agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/horizon-migration-regression-plan.md',
		),
		identity('agents/topics/production-algorithm32/caches/solar-zenith-cache-design.md'),
	);
	pinProductionClosure(
		[
			'src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js',
			'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js',
		],
		parents,
	);
	const run = createRun('h28-h32-migrate', {
		parents,
		operation:
			'Git-authenticated migration inventory, independent primary observer-column/actual-point controls, view quadrature attribution, retained batch N4 reference reduction and fixed-spectrum display replay.',
		parameters: {
			maximumMilliseconds: 600000,
			previousFailureMilliseconds: spent,
			preflightReservationMilliseconds: 30000,
			maximumRetainedBytes: 20 * 1024 ** 2,
			maximumGpuJobs: 1,
			usedGpuJobs: 0,
			elevations: [0.05, 3, 20],
			sourceCount: [16, 32],
			viewCounts: [15, 30, 60, 120],
			warning:
				'Observer-column continuous N1 is not the old discrete N4 implementation; all historical images/payloads remain unavailable unless authenticated.',
			factorial:
				'A = actual-point instead of observer-column N1; B = refined segmented view instead of uniform15. Register selection only after individual source/view screens in this run.',
		},
	});
	try {
		run.write('history.json', {
			history,
			availability,
			claim: 'Candidate code boundary only; no proven last-white/first-dark visual pair.',
		});
		run.write('inputs.json', {
			physical,
			groups: inputs.groups.filter(
				(g) => g.id.startsWith('distant-') && [0.05, 3, 20].some((e) => g.id === `distant-${e}-away`),
			),
			observation: inputs.observations[1],
		});
		const m = ownedPacket(physical.inputs[1]),
			observation = inputs.observations[1],
			lux = observation.facts.uniforms.uColorResetTotalHorizontalIlluminanceLux;
		assert.equal(m.geometry, 'spherical');
		assert.equal(m.sourceKind, 'parallel');
		assert.equal(m.g, 0.7);
		assert.equal(m.albedo, 0.8);
		const p2 = new ColorResetSlope078P2ColorDisplayModel(),
			bruneton = new BrunetonColorDisplayModel(),
			illuminance = {value: lux, units: /** @type {const} */ ('lux')};
		const rows = [0.05, 3, 20].map((elevation) => {
			assert.ok(Date.now() < deadline);
			run.guard();
			run.progress('primary', 'Evaluating registered distant ray ' + elevation);
			const g = inputs.groups.find((g) => g.id === `distant-${elevation}-away` && g.channel === 0);
			assert.ok(g);
			const v = Array.from(g.direction),
				o = Array.from(g.origin),
				end = bounds(m, o, v).distance;
			assert.deepEqual(m.sourceDirection, g.medium.sourceDirection);
			assert.deepEqual(m.rayleigh, g.medium.rayleigh);
			assert.deepEqual(m.mie, g.medium.mie);
			assert.deepEqual(m.sourceIrradiance, g.medium.sourceIrradiance);
			assert.ok(Math.abs(end / g.end - 1) < 1e-12);
			const actual = sampler(m, 'actual', 32),
				column = sampler(m, 'column', 32);
			const ref = continuous(m, o, v, end, actual, 32),
				coarse = continuous(m, o, v, end, sampler(m, 'actual', 16), 16);
			const oldLimit = continuous(m, o, v, end, column, 32),
				oldCoarse = continuous(m, o, v, end, sampler(m, 'column', 16), 16);
			const external = Array.from({length: 15}, (_, channel) => direct({...g, channel}, 128).total);
			const refinement = Math.max(relative(coarse, ref), relative(oldCoarse, oldLimit)),
				independentParity = relative(external, ref);
			assert.ok(refinement < 1e-5 && independentParity < 1e-5);
			const views = [15, 30, 60, 120].map((count) => ({
				count,
				actual: midpoint(m, o, v, end, actual, count, 2),
				column: midpoint(m, o, v, end, column, count, 2),
			}));
			const uniformActual = midpoint(m, o, v, end, actual, 15, 1),
				uniformColumn = midpoint(m, o, v, end, column, 15, 1);
			const rounded = observation.rays.find((r) => r.uv[0] === 0.5 && r.elevationDegrees === elevation);
			assert.ok(rounded);
			const app = rounded.stages.slice(5, 9).flat().slice(0, 15),
				recordedDirection = unit(rounded.stages[3].slice(0, 3));
			const roundedN1 = Array.from(
				{length: 15},
				(_, channel) =>
					direct(
						{
							...g,
							direction: recordedDirection,
							end: bounds(m, Array.from(g.origin), recordedDirection).distance,
							channel,
						},
						128,
					).total,
			);
			const indices = inputs.groups.flatMap((group, i) => (group.id === g.id ? [i] : []));
			assert.equal(indices.length, 15);
			const batchN4 = Array.from({length: 16}, (_, batch) =>
				indices.map((group) => {
					const row = batches.find(
						(r) => r.group === group && r.batch === batch && r.profile === 'confirmation',
					);
					assert.ok(row);
					return row.means.slice(1, 5).reduce((s, v) => s + v, 0);
				}),
			);
			const n4 = Array.from({length: 15}, (_, c) => estimate(batchN4.map((b) => b[c]))),
				n4Spectrum = n4.map((v) => v.mean);
			const n4Y = estimate(batchN4.map((b) => color(b).luminanceCdPerM2));
			const n4Orders = [1, 2, 3, 4].map((order) => {
				const spectra = Array.from({length: 16}, (_, batch) =>
					indices.map((group) => {
						const row = batches.find(
							(r) => r.group === group && r.batch === batch && r.profile === 'confirmation',
						);
						assert.ok(row);
						return row.means[order];
					}),
				);
				return {
					order,
					spectrum: Array.from({length: 15}, (_, c) => estimate(spectra.map((s) => s[c]))),
					Y: estimate(spectra.map((s) => color(s).luminanceCdPerM2)),
				};
			});
			const n1Sampling = relative(
				n4Orders[0].spectrum.map((v) => v.mean),
				ref,
			);
			const samples = [0, 1000, 10000, 50000, 100000]
				.filter((t) => t < end)
				.map((distance) => {
					const point = along(o, v, distance),
						r = Math.hypot(...point),
						mu = dot(point, m.sourceDirection) / r;
					return {
						distance,
						altitude: altitude(m, point),
						solarZenith: (Math.acos(mu) * 180) / Math.PI,
						sourceActual: actual(point, v),
						sourceColumn: column(point, v),
						frameError: frameError(m, point, v),
					};
				});
			assert.ok(Math.max(...samples.map((s) => s.frameError)) < 1e-12);
			const display = [
				{name: 'app-N4', spectrum: app},
				{name: 'reference-N4', spectrum: n4Spectrum},
				{name: 'actual-continuous-N1', spectrum: ref},
				{name: 'column-continuous-N1', spectrum: oldLimit},
			].map((item) => {
				const reading = color(item.spectrum),
					rgb = /** @type {[number,number,number]} */ (reading.rgb),
					tone = p2.linearSrgbToDisplayRgb(rgb, illuminance);
				return {
					...item,
					reading,
					p2: tone,
					explicitEncoded: tone.map(encode),
					bruneton: bruneton.linearSrgbToDisplayRgb(rgb),
				};
			});
			return {
				elevation,
				origin: o,
				direction: v,
				end,
				actual: ref,
				column: oldLimit,
				refinement,
				independentParity,
				views,
				uniformActual,
				uniformColumn,
				samples,
				reference: {n4, n4Y, n4Spectrum, n4Orders, n1Sampling},
				app: {
					spectrum: app,
					recordedDirection,
					N1RoundedDirectionSensitivity: relative(roundedN1, ref),
					spectralResidual: app.map((x, c) => x - n4Spectrum[c]),
					relativeY: color(app).luminanceCdPerM2 / n4Y.mean - 1,
					scope: 'N4 screening comparison at synthetic ray versus saved Float32 ray. N1 sensitivity is measured; N4 angular sensitivity is not certified.',
				},
				display,
			};
		});
		run.write('individual-screens.json', {rows});
		const selection = {
			A: 'Independent actual-point N1 instead of continuous observer-column approximation',
			B: 'Independently refined segmented integration instead of uniform15 midpoint view',
			reason: 'Historical migration introduced actual-point state; recorded gray-band repair changed view placement. These are independently evaluated in individual-screens.json before this factorial.',
			inputs: identity(run.path + '/individual-screens.json'),
			scope: 'Continuous N1 sensitivities, not discrete old/new N4 reproduction',
		};
		run.write('factorial-registration.json', selection);
		const factor = rows.map((r) => {
			const cells = [r.uniformColumn.spectrum, r.uniformActual.spectrum, r.column, r.actual],
				base = cells[0],
				ref = r.actual;
			const deltaA = cells[1].map((x, c) => x - base[c]),
				deltaB = cells[2].map((x, c) => x - base[c]),
				interaction = cells[3].map((x, c) => x - cells[1][c] - cells[2][c] + base[c]);
			const residual = base.map((x, c) => x - ref[c]),
				baseSSE = dot(residual, residual);
			const assessments = cells.map((cell) => {
				const d = cell.map((x, c) => x - base[c]),
					change = 2 * dot(residual, d) + dot(d, d),
					actualSSE = cell.reduce((s, x, c) => s + (x - ref[c]) ** 2, 0);
				assert.ok(Math.abs(change - (actualSSE - baseSSE)) < 1e-12);
				return {spectrum: cell, Y: color(cell).luminanceCdPerM2, rms: rms(cell, ref), deltaSSE: change};
			});
			return {
				elevation: r.elevation,
				cells: assessments,
				deltaA,
				deltaB,
				interaction,
				deltaDot: dot(deltaA, deltaB),
				scope: 'Shared independent N1 target; no N4 descendant regeneration. Opposing corrections alone are not proof of erroneous components cancelling.',
			};
		});
		run.write('assessment.json', {
			rows,
			factor,
			selection,
			availability,
			unsupported: [
				'No authenticated historical white screenshot or old N4 field at these rays',
				'No exact historical display reproduction: old adaptation/state unavailable',
				'No new discrete altitude/direction/solar interpolation node parity or full GPU branch qualification',
				'No full regenerated N4 intervention or matched libRadtran horizon output',
				'N4 app/reference angular-rounding sensitivity remains uncertified',
			],
			historicalScores: {
				metric: 'Historical B1 Kider RMSE, separate from current numerical-reference criterion',
				direct40: {before: 11.820391604126252, after: 11.554012538468113},
				native15: {before: 12.586323005727962, after: 12.293121003109862},
			},
		});
		const css = (/** @type {readonly number[]} */ v) =>
			`rgb(${v.map((x) => Math.round(255 * Math.max(0, Math.min(1, x)))).join(',')})`;
		const titles = ['App N4', 'Reference N4', 'Actual N1', 'Column N1'];
		run.write(
			'comparison.svg',
			`<svg xmlns="http://www.w3.org/2000/svg" width="850" height="340"><rect width="850" height="340" fill="white"/><g font-family="sans-serif" font-size="14"><text x="12" y="24">San Jose distant Sun; common p2 mapping, fixed noon gain, raw output shown.</text>${titles.map((t, c) => `<text x="${145 + c * 170}" y="55">${t}</text>`).join('')}${rows.map((r, i) => `<text x="10" y="${110 + i * 75}">${r.elevation} degrees</text>${r.display.map((d, c) => `<rect x="${145 + c * 170}" y="${75 + i * 75}" width="160" height="65" fill="${css(d.p2)}"/>`).join('')}`).join('')}<text x="10" y="325">Column N1 is a continuous positional control, not a reconstructed historical N4 render.</text></g></svg>`,
		);
		assert.ok(Date.now() < deadline);
		assert.ok(storage().retainedBytes - before.retainedBytes < 20 * 1024 ** 2);
		run.cleanup();
		const elapsedMilliseconds = Date.now() - started;
		run.finish('accepted', {
			elapsedMilliseconds,
			preflightReservationMilliseconds: 30000,
			gpuJobs: 0,
			previousFailureMilliseconds: spent,
		});
		verifyRun(run.path);
		console.log(
			JSON.stringify({
				run: run.path,
				elapsedMilliseconds,
				summary: rows.map((r) => ({
					elevation: r.elevation,
					Y: color(r.actual).luminanceCdPerM2,
					columnY: color(r.column).luminanceCdPerM2,
					uniformY: color(r.uniformActual.spectrum).luminanceCdPerM2,
					N4Y: r.reference.n4Y,
					appY: color(r.app.spectrum).luminanceCdPerM2,
				})),
			}),
		);
	} catch (error) {
		run.finish('failed', {
			elapsedMilliseconds: Date.now() - started,
			message: String(error),
			deadlineHit: Date.now() >= deadline,
		});
		throw error;
	}
}
main();
