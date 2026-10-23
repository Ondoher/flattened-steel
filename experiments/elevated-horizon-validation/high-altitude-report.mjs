import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createRun, identity, checked, output} from './io.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {physical} from './physics.mjs';
import {buildInput} from './high-altitude-inputs.mjs';

const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const names = readdirSync(checked(output + '/runs')).filter((n) =>
	/^\d{5}-high-(baseline|altitude|angular|source|transport|reference|ref-fine)$/u.test(n),
);
const paths = names
	.map((n) => output + '/runs/' + n)
	.filter((p) => {
		try {
			return read(p + '/manifest.json').state === 'accepted';
		} catch {
			return false;
		}
	});
const run = createRun(
	'high-report',
	'Authenticate high-altitude convergence evidence and compare spectral/photometric horizon probes with independent spherical MYSTIC.',
	[
		...paths.map((p) => identity(p + '/manifest.json')),
		identity(output + '/runs/00008-app-inspect/manifest.json'),
		identity(output + '/runs/00008-app-inspect/gpu-probe.json'),
		identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
	],
);
let failure;
try {
	let artifacts = 0,
		bytes = 0;
	const gpu = [],
		refs = [];
	for (const p of paths) {
		const manifest = read(p + '/manifest.json');
		for (const a of manifest.artifacts) {
			const actual = identity(a.path);
			assert.equal(actual.sha256, a.sha256);
			assert.equal(actual.bytes, a.bytes);
			artifacts++;
			bytes += a.bytes;
		}
		if (p.endsWith('-reference') || p.endsWith('-ref-fine')) {
			const cases = read(p + '/readings.json'),
				m = physical(),
				installation = read('scripts/libradtran/installation.json');
			for (const r of cases) {
				const tool = read(r.tool + '/manifest.json');
				assert.equal(tool.status, 'succeeded');
				assert.equal(tool.solver.sha256, installation.expectedSha256);
				const deck = readFileSync(checked(r.tool + '/execution/input.inp'), 'utf8');
				const option = (n) =>
					deck
						.split(/\r?\n/u)
						.find((s) => s.startsWith(n + ' '))
						?.slice(n.length + 1);
				assert.equal(option('rte_solver'), 'mystic');
				assert.equal(option('mc_spherical'), '1D');
				assert.equal(option('mc_vroom'), 'off');
				assert.equal(Number(option('zout')), r.config.altitude / 1000);
				assert.equal(Number(option('albedo')), 0);
				assert.equal(Number(option('earth_radius')), 6360);
				assert.equal(option('mol_abs_param'), 'none');
				assert.ok(!/pseudospherical|mc_refraction/u.test(deck));
				assert.ok(Math.abs(Number(option('umu')) + Math.sin((r.config.elevation * Math.PI) / 180)) < 1e-12);
				assert.ok(Math.abs(Number(option('sza')) - m.zenithDegrees) < 1e-10);
				assert.equal(Number(option('phi')), 180);
				const mol = readFileSync(checked(r.tool + '/execution/scattering.txt'), 'utf8')
					.trim()
					.split(/\r?\n/u)
					.map((s) => s.trim().split(/\s+/u).map(Number));
				assert.ok(mol[0].includes(r.config.altitude / 1000));
				assert.equal(mol.length, 16);
				for (let c = 0; c < 15; c++)
					assert.ok(
						Math.abs(
							mol[c + 1].slice(1).reduce((s, x) => s + x, 0) -
								m.rayleigh[c] * m.rayleighHeight * -Math.expm1(-m.topAltitude / m.rayleighHeight),
						) < 1e-12,
					);
			}
			refs.push({path: p, rows: cases});
		} else {
			const data = read(p + '/results.json');
			// The browser control crosses JSON, which canonicalizes negative zero.
			assert.deepEqual(read(p + '/control.json').request, JSON.parse(JSON.stringify(buildInput(data.variant))));
			gpu.push({path: p, ...data});
		}
	}
	const full = (name) => gpu.filter((g) => g.variant === name && g.results.length === 15).at(-1);
	const baseline = full('baseline');
	assert.ok(baseline);
	const best = (name) => full(name) ?? gpu.filter((g) => g.variant === name).at(-1);
	const reference = refs.find((r) => r.path.endsWith('-high-reference'));
	assert.ok(reference);
	const fine = refs.find((r) => r.path.endsWith('-high-ref-fine'));
	assert.ok(fine);
	const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
	const half = (a) => {
		const m = mean(a);
		return 4.30265273 * Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1) / a.length);
	};
	const color = (s) => colorimetry(s, 'bin-integrated');
	const sample = (g, h, off, q, order = 3) =>
		g.results.map(
			(c) => c.readings.find((r) => r.altitude === h && r.offset === off && r.intervals === q).values[order],
		);
	const rows = [];
	for (const h of [30000, 40000])
		for (const off of [-1, -0.1, -0.02, 0.02, 0.1, 1]) {
			const selected = reference.rows.filter((r) => r.config.altitude === h && r.config.offset === off);
			assert.equal(selected.length, 3);
			const spectrum = Array.from({length: 15}, (_, c) => mean(selected.map((r) => r.spectrum[c])));
			const refColor = color(spectrum),
				production = [30, 120, 480].map((q) => {
					const spectrum = sample(baseline, h, off, q);
					return {intervals: q, spectrum, color: color(spectrum)};
				});
			rows.push({
				altitude: h,
				offset: off,
				reference: {
					spectrum,
					color: refColor,
					halfWidthY95: half(selected.map((r) => color(r.spectrum).luminanceCdPerM2)),
				},
				production,
				relativeY: production[1].color.luminanceCdPerM2 / refColor.luminanceCdPerM2 - 1,
				spectralResidual: spectrum.map((v, c) => ({
					channel: c,
					relative: production[1].spectrum[c] / v - 1,
					halfWidth95: half(selected.map((r) => r.spectrum[c])),
					aboveSignalFloor: v > 0.01 * Math.max(...spectrum),
				})),
			});
		}
	const contrast = (a, b) => (a - b) / (a + b);
	const contrasts = [];
	for (const h of [30000, 40000])
		for (const d of [0.02, 0.1, 1]) {
			const a = rows.find((r) => r.altitude === h && r.offset === d),
				b = rows.find((r) => r.altitude === h && r.offset === -d);
			const paired = [0, 1, 2].map((i) =>
				contrast(
					color(
						reference.rows.find(
							(r) => r.config.altitude === h && r.config.offset === d && r.config.repeat === i,
						).spectrum,
					).luminanceCdPerM2,
					color(
						reference.rows.find(
							(r) => r.config.altitude === h && r.config.offset === -d && r.config.repeat === i,
						).spectrum,
					).luminanceCdPerM2,
				),
			);
			contrasts.push({
				altitude: h,
				delta: d,
				reference: mean(paired),
				halfWidth95: half(paired),
				replicates: paired,
				production: a.production.map((v, i) => ({
					intervals: v.intervals,
					value: contrast(v.color.luminanceCdPerM2, b.production[i].color.luminanceCdPerM2),
				})),
			});
		}
	const sensitivities = [];
	for (const variant of ['altitude', 'angular', 'source', 'transport']) {
		const candidate = best(variant);
		assert.ok(candidate);
		for (const h of [10000, 30000, 40000]) {
			const spectral = [];
			for (const c of candidate.results)
				for (const off of [-1, -0.1, -0.02, 0.02, 0.1, 1]) {
					const get = (g, q) =>
						g.results
							.find((x) => x.channel === c.channel)
							.readings.find((r) => r.altitude === h && r.offset === off && r.intervals === q).values[3];
					spectral.push({
						channel: c.channel,
						offset: off,
						relative: get(candidate, 120) / get(baseline, 120) - 1,
					});
				}
			const photometric =
				candidate.results.length === 15
					? [-1, -0.1, -0.02, 0.02, 0.1, 1].map((off) => ({
							offset: off,
							relative:
								color(sample(candidate, h, off, 120)).luminanceCdPerM2 /
									color(sample(baseline, h, off, 120)).luminanceCdPerM2 -
								1,
						}))
					: null;
			sensitivities.push({
				variant,
				altitude: h,
				parent: candidate.path,
				channels: candidate.results.map((r) => r.channel),
				spectral,
				photometric,
			});
		}
	}
	const layer = [];
	for (const h of [30000, 40000])
		for (const off of [-0.1, 0.1]) {
			const pairs = fine.rows
				.filter((r) => r.config.altitude === h && r.config.offset === off)
				.map((r) => {
					const b = reference.rows.find(
						(x) =>
							x.config.altitude === h && x.config.offset === off && x.config.repeat === r.config.repeat,
					);
					return color(r.spectrum).luminanceCdPerM2 / color(b.spectrum).luminanceCdPerM2 - 1;
				});
			assert.equal(pairs.length, 3);
			layer.push({altitude: h, offset: off, meanRelative: mean(pairs), halfWidth95: half(pairs), pairs});
		}
	const calibration = [];
	const installed = read(output + '/runs/00008-app-inspect/gpu-probe.json');
	for (const q of [30, 120])
		for (const [i, off] of [-1, -0.1, -0.02, 0.02, 0.1, 1].entries())
			for (let c = 0; c < 15; c++) {
				const actual = installed.snapshots.find((s) => s.intervals === q).data[(i * 15 + c) * 4];
				calibration.push({
					intervals: q,
					offset: off,
					channel: c,
					relative: sample(baseline, 10000, off, q)[c] / actual - 1,
				});
			}
	assert.ok(
		Math.max(...calibration.map((c) => Math.abs(c.relative))) < 0.0001,
		'Readout must agree with actual installed GPU within0.01%.',
	);
	const viewSensitivity = [];
	for (const h of [10000, 30000, 40000])
		for (const off of [-1, -0.1, -0.02, 0.02, 0.1, 1]) {
			const a = color(sample(baseline, h, off, 30)).luminanceCdPerM2,
				b = color(sample(baseline, h, off, 120)).luminanceCdPerM2,
				c = color(sample(baseline, h, off, 480)).luminanceCdPerM2;
			viewSensitivity.push({altitude: h, offset: off, from30to120: b / a - 1, from120to480: c / b - 1});
		}
	const data = {
		rows,
		contrasts,
		sensitivities,
		layer,
		calibration,
		viewSensitivity,
		verified: {artifacts, bytes},
		sources: paths,
		limits: [
			'Scalar all-order MYSTIC versus GPU N4; order tail not independently isolated.',
			'CPU final-view reconstruction calibrated against installed GPU at10km, not an actual30/40km app render.',
			'Altitude refinement halves spacing below45km; upper nodes unchanged. Angular/source/recurrence refinements screen three visible channels only.',
			'Three-replicate empirical intervals omit systematic/model uncertainty. No measured real atmosphere validated.',
			'Current production package coverage and mesh remain unchanged.',
		],
	};
	run.write('analysis.json', data);
	run.write(
		'brightness.csv',
		'height,offset,referenceY,reference95HalfWidth,production30Y,production120Y,production480Y,relative120\n' +
			rows
				.map((r) =>
					[
						r.altitude,
						r.offset,
						r.reference.color.luminanceCdPerM2,
						r.reference.halfWidthY95,
						...r.production.map((v) => v.color.luminanceCdPerM2),
						r.relativeY,
					].join(','),
				)
				.join('\n') +
			'\n',
	);
	let html =
		'<meta charset="utf-8"><title>High-altitude horizon checks</title><style>body{background:#20252c;color:white;font:16px sans-serif;max-width:1000px;margin:24px auto}img{max-width:100%}table{width:100%;table-layout:fixed;text-align:center}</style><h1>High-altitude horizon samples</h1><p>Bruneton atmosphere, San Jose noon, anti-Sun, black ground. Same fixed production p2 display context. These are sparse angular strips, not app scenes; nearest registered rays fill rows without invented smoothing. Sky above, ground below; image center is the true geometric limb.</p>';
	const display = new ColorResetSlope078P2ColorDisplayModel(),
		lux = physical().capture.physicalLux;
	for (const h of [30000, 40000]) {
		const alt = full('altitude');
		assert.ok(alt);
		const columns = ['Current grid Q30', 'Current grid Q120', 'Refined altitude Q120', 'libRadtran'];
		const image = new PNG({width: 880, height: 400});
		for (let y = 0; y < 400; y++)
			for (let x = 0; x < 880; x++) {
				const off = 1 - (2 * (y + 0.5)) / 400,
					row = rows
						.filter((r) => r.altitude === h)
						.sort((a, b) => Math.abs(a.offset - off) - Math.abs(b.offset - off))[0],
					col = Math.floor(x / 220);
				const rgb =
					col < 2
						? row.production[col].color.rgb
						: col === 2
							? color(sample(alt, h, row.offset, 120)).rgb
							: row.reference.color.rgb;
				const mapped = display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (rgb), lux);
				for (let c = 0; c < 3; c++) image.data[(y * 880 + x) * 4 + c] = Math.round(255 * mapped[c]);
				image.data[(y * 880 + x) * 4 + 3] = 255;
			}
		run.write('horizon-' + h + 'm.png', PNG.sync.write(image));
		html +=
			'<h2>' +
			h / 1000 +
			' km</h2><table><tr>' +
			columns.map((c) => '<td>' + c + '</td>').join('') +
			'</tr></table><img src="horizon-' +
			h +
			'm.png">';
	}
	run.write('comparison.html', html);
	run.finish('accepted', {
		artifacts,
		referenceCases: refs.reduce((s, r) => s + r.rows.length, 0),
		calibrationMaximumRelative: Math.max(...calibration.map((c) => Math.abs(c.relative))),
	});
} catch (e) {
	failure = String(e);
	run.finish('failed', {failure});
}
if (failure) throw new Error(failure);
