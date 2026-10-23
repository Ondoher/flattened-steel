import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createRun, identity, checked, output} from './io.mjs';
import {physical, ray, directTransmission} from './physics.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const full = output + '/runs/00003-reference-full',
	fine = output + '/runs/00004-reference-fine',
	gpu = output + '/runs/00008-app-inspect';
const confirms = readdirSync(checked(output + '/runs'))
	.filter((n) => n.endsWith('-ref-confirm'))
	.map((n) => output + '/runs/' + n)
	.filter((p) => existsSync(checked(p) + '/manifest.json') && read(p + '/manifest.json').state === 'accepted');
const parents = [full, fine, gpu, ...confirms].map((p) => identity(p + '/manifest.json'));
parents.push(
	identity('experiments/sky-accuracy-dials/horizon/diagnosis-color.mjs'),
	identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
);
const run = createRun(
	'baseline-report',
	'Matched installed GPU N4 versus independent all-order native-bin radiance; actual app depth/compositing audit.',
	parents,
);
let failure;
try {
	for (const parent of [full, fine, gpu, ...confirms]) {
		const m = read(parent + '/manifest.json');
		assert.equal(m.state, 'accepted');
		for (const expected of m.artifacts) assert.equal(identity(expected.path).sha256, expected.sha256);
	}
	const baseline = read(full + '/readings.json'),
		refinement = read(fine + '/readings.json');
	const readings = [...baseline, ...confirms.flatMap((p) => read(p + '/readings.json'))],
		probe = read(gpu + '/gpu-probe.json');
	const medium = physical(),
		horizon = (-Math.acos(medium.radius / (medium.radius + 10000)) * 180) / Math.PI;
	const mean = (values) => values.reduce((s, x) => s + x, 0) / values.length;
	const half = (values) => {
		const n = values.length,
			m = mean(values),
			t = n === 3 ? 4.30265273 : n === 6 ? 2.57058184 : n === 4 ? 3.18244631 : 2.77644511;
		return t * Math.sqrt(values.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1) / n);
	};
	const rows = probe.views.map((view, i) => {
		const selected = readings.filter((r) => Math.abs(r.config.elevation - view.elevation) < 1e-10);
		assert.ok(selected.length >= 3);
		const spectrum = Array.from({length: 15}, (_, c) => mean(selected.map((r) => r.spectrum[c]))),
			reference = colorimetry(spectrum, 'bin-integrated');
		const production = probe.snapshots.map((s) => {
			const spectrum = Array.from({length: 15}, (_, c) => s.data[(i * 15 + c) * 4]);
			return {
				intervals: s.intervals,
				spectrum,
				transmittance: Array.from({length: 15}, (_, c) => s.data[(i * 15 + c) * 4 + 1]),
				color: colorimetry(spectrum, 'bin-integrated'),
			};
		});
		const direct = directTransmission(medium, view);
		return {
			view,
			n: selected.length,
			reference: {
				spectrum,
				color: reference,
				halfWidthY95: half(selected.map((r) => colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2)),
			},
			production,
			direct,
			relativeY: production[0].color.luminanceCdPerM2 / reference.luminanceCdPerM2 - 1,
			spectralResidual: spectrum.map((value, c) => ({
				channel: c,
				reference: value,
				halfWidth95: half(selected.map((r) => r.spectrum[c])),
				production30: production[0].spectrum[c],
				relative: production[0].spectrum[c] / value - 1,
				aboveSignalFloor: value > 0.01 * Math.max(...spectrum),
			})),
			viewRefinementRelativeY: production[1].color.luminanceCdPerM2 / production[0].color.luminanceCdPerM2 - 1,
		};
	});
	const contrasts = [0.02, 0.1, 1].map((delta) => {
		const above = rows.find((r) => Math.abs(r.view.elevation - horizon - delta) < 1e-9),
			below = rows.find((r) => Math.abs(r.view.elevation - horizon + delta) < 1e-9),
			c = (a, b) => (a - b) / (a + b);
		const paired = [];
		for (const r of readings.filter((r) => Math.abs(r.config.elevation - above.view.elevation) < 1e-9)) {
			const b = readings.find(
				(b) =>
					b.config.repeat === r.config.repeat && Math.abs(b.config.elevation - below.view.elevation) < 1e-9,
			);
			assert.ok(b);
			paired.push(
				c(
					colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2,
					colorimetry(b.spectrum, 'bin-integrated').luminanceCdPerM2,
				),
			);
		}
		return {
			delta,
			reference: c(above.reference.color.luminanceCdPerM2, below.reference.color.luminanceCdPerM2),
			halfWidth95: half(paired),
			production30: c(above.production[0].color.luminanceCdPerM2, below.production[0].color.luminanceCdPerM2),
			production120: c(above.production[1].color.luminanceCdPerM2, below.production[1].color.luminanceCdPerM2),
			replicates: paired,
		};
	});
	const layer = [-0.1, 0.1].map((offset) => {
		const e = horizon + offset,
			coarse = baseline.filter((r) => Math.abs(r.config.elevation - e) < 1e-9),
			f = refinement.filter((r) => Math.abs(r.config.elevation - e) < 1e-9),
			delta = f.map(
				(r) =>
					colorimetry(r.spectrum, 'bin-integrated').luminanceCdPerM2 /
						colorimetry(coarse.find((c) => c.config.repeat === r.config.repeat).spectrum, 'bin-integrated')
							.luminanceCdPerM2 -
					1,
			);
		return {offset, meanRelativeChange: mean(delta), halfWidth95: half(delta), paired: delta};
	});
	const col = probe.column,
		transform = (m, v) => Array.from({length: 4}, (_, r) => v.reduce((s, x, c) => s + x * m[c * 4 + r], 0)),
		normalize = (v) => v.map((x) => x / Math.hypot(...v));
	const column = Array.from({length: col.height}, (_, y) => {
		const v = transform(probe.camera.inverseProjection, [col.x * 2 - 1, ((y + 0.5) / col.height) * 2 - 1, 1, 1]),
			eye = normalize(v.slice(0, 3).map((x) => x / v[3])),
			scene = normalize(transform(probe.camera.inverseView, [...eye, 0]).slice(0, 3)),
			physical = normalize([0, 1, 2].map((k) => probe.basis.reduce((s, b, j) => s + b[k] * scene[j], 0)));
		const elevation = (Math.asin(physical[2]) * 180) / Math.PI,
			base = y * 15 * 4,
			hit = col.transport[base + 3] > 0.5,
			length = col.transport[base + 2];
		return {
			y,
			elevation,
			analytic: ray(elevation),
			hit,
			length,
			spectrum: Array.from({length: 15}, (_, c) => col.transport[base + c * 4]),
			transmittance: Array.from({length: 15}, (_, c) => col.transport[base + c * 4 + 1]),
			input: col.sceneInput.slice(y * 4, y * 4 + 3),
			pathRgb: col.pathRgb.slice(y * 4, y * 4 + 3),
			groundRgb: col.groundRgb.slice(y * 4, y * 4 + 3),
			display: col.final.slice(y * 4, y * 4 + 3),
		};
	});
	const maskMismatch = column
		.filter((r) => r.hit !== r.analytic.ground)
		.map((r) => ({y: r.y, elevation: r.elevation, hit: r.hit, analytic: r.analytic.ground}));
	const boundary = column.findIndex((r) => !r.hit),
		pixelStep = column[boundary + 1].elevation - column[boundary].elevation;
	const model = new ColorResetSlope078P2ColorDisplayModel();
	let maximumCompositeError = 0;
	for (const r of column) {
		const expected = model.linearSrgbToDisplayRgb(
			r.pathRgb.map((x, c) => x + r.groundRgb[c]),
			{value: probe.lux, units: 'lux'},
		);
		maximumCompositeError = Math.max(maximumCompositeError, ...expected.map((x, c) => Math.abs(x - r.display[c])));
	}
	const endpoints = [-0.1, -1].map((offset) => {
		const target = horizon + offset,
			selected = column.reduce((a, b) =>
				Math.abs(a.elevation - target) < Math.abs(b.elevation - target) ? a : b,
			);
		assert.ok(selected.hit);
		const view = {...ray(selected.elevation), length: selected.length},
			direct = directTransmission(medium, view);
		return {
			...selected,
			direct,
			transmittanceRelativeError: selected.transmittance.map(
				(x, c) => x / Math.max(direct.transmittance[c], 1e-30) - 1,
			),
			groundContributionFraction: selected.groundRgb.map((x, c) => x / (x + Math.max(0, selected.pathRgb[c]))),
		};
	});
	const data = {
		horizon,
		rows,
		contrasts,
		layer,
		column: {pixelStep, boundary, maskMismatch, maximumCompositeError, endpoints},
		limitations: [
			'Native15 bin-average coefficient/source model held piecewise constant per bin, not a continuous-spectrum real-atmosphere accuracy claim.',
			'Installed GPU cache contains cumulative N4 only; common-order tail not measured.',
			'Empirical repeated-seed intervals and layer controls do not bound every systematic effect.',
			'Controlled black-ground spectral comparison; actual green RGB compositing evaluated separately.',
		],
	};
	run.write('analysis.json', data);
	run.write('actual-column.json', column);
	run.write(
		'brightness.csv',
		'elevationDegrees,ground,referenceY,halfWidth95,productionQ30Y,productionQ120Y,relativeY\n' +
			rows
				.map((r) =>
					[
						r.view.elevation,
						r.view.ground,
						r.reference.color.luminanceCdPerM2,
						r.reference.halfWidthY95,
						r.production[0].color.luminanceCdPerM2,
						r.production[1].color.luminanceCdPerM2,
						r.relativeY,
					].join(','),
				)
				.join('\n') +
			'\n',
	);
	const image = new PNG({width: 480, height: 400}),
		near = rows.slice(0, 6);
	for (let y = 0; y < image.height; y++) {
		const e = horizon + 1 - (2 * (y + 0.5)) / image.height,
			selected = near.reduce((a, b) => (Math.abs(a.view.elevation - e) < Math.abs(b.view.elevation - e) ? a : b));
		for (let x = 0; x < image.width; x++) {
			const rgb = model.linearSrgbToDisplayRgb(
				x < 240 ? selected.production[0].color.rgb : selected.reference.color.rgb,
				{value: probe.lux, units: 'lux'},
			);
			for (let c = 0; c < 3; c++) image.data[(y * image.width + x) * 4 + c] = Math.round(255 * rgb[c]);
			image.data[(y * image.width + x) * 4 + 3] = 255;
		}
	}
	run.write('comparison.png', PNG.sync.write(image));

	const pairs = [rows[1], rows[4]];
	let paths = '';
	for (let panel = 0; panel < 2; panel++) {
		const row = pairs[panel],
			left = 70 + panel * 500,
			top = 55,
			width = 420,
			height = 250,
			peak = 0.19;
		const curves = [row.reference.spectrum, row.production[0].spectrum];
		const x = (c) => left + (c / 14) * width,
			y = (value) => top + height - (value / peak) * height;
		paths += `<path d="M${left},${top}V${top + height}H${left + width}" fill="none" stroke="#444"/>`;
		curves.forEach((values, j) => {
			paths += `<path d="${values.map((value, c) => (c ? 'L' : 'M') + x(c) + ',' + y(value)).join(' ')}" fill="none" stroke="${['#cc5500', '#0066bb'][j]}" stroke-width="2"/>`;
		});
		paths += `<text x="${left}" y="30">${panel ? '0.1 degree above' : '0.1 degree below'} the geometric horizon</text><text x="${left}" y="330">375.7</text><text x="${left + width - 35}" y="330">814.3 nm</text>`;
	}
	run.write(
		'spectra.svg',
		`<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="390"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="14">${paths}<text x="15" y="55">0.19</text><text x="45" y="305">0</text><text x="70" y="360">Orange: libRadtran all orders; blue: production GPU N4. Spectral radiance in W m^-2 sr^-1 nm^-1.</text><text x="70" y="382">Native15 bin-average densities; lines connect sampled bins for presentation only.</text></g></svg>`,
	);
	run.write(
		'comparison.html',
		'<meta charset="utf-8"><title>Matched 10 km horizon</title><style>body{font:16px sans-serif;background:#20252c;color:white}img{max-width:100%}table{width:480px;text-align:center}</style><table><tr><th>Production GPU N4</th><th>libRadtran all orders</th></tr></table><img src="comparison.png"><p>True horizon at the middle. From 1 degree above to 1 degree below; nearest registered ray, no blur or fitted exposure. Black ground; common bin-integrated CIE and production p2 conversion, ' +
			probe.lux.toFixed(1) +
			' lux. Sparse sampled strip, not a scene photograph. Actual app ground lighting is evaluated separately.</p><a href="brightness.csv">Brightness data</a> | <a href="analysis.json">Spectra, contrast and compositing</a>',
	);
	assert.ok(maximumCompositeError < 0.0001, 'Actual GPU color composition must replay consistently');
	console.log(
		JSON.stringify({
			contrasts,
			layer,
			maximumCompositeError,
			maskMismatch,
			maximumRelativeY: Math.max(...rows.slice(0, 6).map((r) => Math.abs(r.relativeY))),
		}),
	);
} catch (error) {
	failure = String(error);
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) throw new Error(failure);
