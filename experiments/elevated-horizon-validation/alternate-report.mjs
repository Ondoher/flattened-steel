import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {PNG} from 'pngjs';
import {checked, identity, createRun} from './io.mjs';
import {channels, physical} from './physics.mjs';
import {xyzToRgb, ciePath} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';

const cie = readFileSync(checked(ciePath), 'utf8')
	.trim()
	.split(/\r?\n/u)
	.map((s) => s.split(',').map(Number));
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const variance = (a) => (a.length < 2 ? 0 : a.reduce((s, v) => s + (v - mean(a)) ** 2, 0) / (a.length - 1));
const half = (a) =>
	a.length < 2 ? null : (a.length >= 6 ? 2.57058184 : 4.30265273) * Math.sqrt(variance(a) / a.length);

/** Integrate reconstructed within-bin radiance times the original piecewise-linear CIE table. */
export function sampledColor(reading) {
	const xyz = [0, 0, 0];
	for (let c = 0; c < 15; c++) {
		const points = reading.samples.map((s, i) => ({...s, radiance: reading.values[i]})).filter((s) => s.c === c);
		assert.ok(points.length);
		const radiance = (w) =>
			points.reduce(
				(sum, p, i) =>
					sum +
					p.radiance *
						points.reduce(
							(product, q, j) =>
								i === j ? product : (product * (w - q.wavelength)) / (p.wavelength - q.wavelength),
							1,
						),
				0,
			);
		let low = Math.max(360, channels[c].center.value - channels[c].width.value / 2);
		const high = Math.min(830, channels[c].center.value + channels[c].width.value / 2);
		while (low < high - 1e-10) {
			const end = Math.min(high, Math.floor(low + 1e-9) + 1);
			for (const [node, weight] of [
				[-Math.sqrt(3 / 5), 5 / 18],
				[0, 4 / 9],
				[Math.sqrt(3 / 5), 5 / 18],
			]) {
				const w = (low + end) / 2 + (node * (end - low)) / 2,
					lower = Math.floor(w),
					upper = Math.ceil(w),
					t = w - lower;
				for (let axis = 0; axis < 3; axis++)
					xyz[axis] +=
						683 *
						radiance(w) *
						(end - low) *
						weight *
						(cie[lower - 360][axis + 1] * (1 - t) + cie[upper - 360][axis + 1] * t);
			}
			low = end;
		}
	}
	return {xyz, rgb: xyzToRgb(xyz), Y: xyz[1]};
}

/** Build a reviewable derivative from finalized individual cases, including live campaign progress. */
async function report() {
	const paths = process.argv.slice(2);
	assert.ok(paths.length);
	const inputs = [],
		parents = [identity(ciePath)];
	for (const p of paths) {
		for (const name of readdirSync(checked(p)).filter((n) => n.startsWith('reading-') && n.endsWith('.json'))) {
			const parent = identity(p + '/' + name),
				reading = JSON.parse(readFileSync(checked(parent.path), 'utf8'));
			const toolManifest = identity(reading.tool + '/manifest.json'),
				m = JSON.parse(readFileSync(checked(toolManifest.path), 'utf8'));
			assert.equal(m.status, 'succeeded');
			const raw = m.artifacts.find((a) => a.path === 'execution/mc.rad.spc');
			assert.equal(identity(reading.tool + '/' + raw.path).sha256, raw.sha256);
			parents.push(parent, toolManifest, identity(reading.tool + '/' + raw.path));
			inputs.push({...reading, parent: parent.path, color: sampledColor(reading)});
		}
	}
	const run = createRun(
		'opac-report',
		'Reconstruct spectral color, paired contrasts and fixed-exposure sparse horizon strips from successful native cases.',
		parents,
	);
	let failure;
	try {
		const groups = [];
		for (const name of [...new Set(inputs.map((r) => r.config.name))])
			for (const altitude of [5, 10000, 500, 2000])
				for (const scene of ['noon', 'pre10', 'sunset'])
					for (const layers of [256, 512])
						for (const humidity of [50, 80])
							for (const order of [1, 2, 4]) {
								const selected = inputs.filter(
									(r) =>
										r.config.name === name &&
										r.config.altitude === altitude &&
										r.config.humidity === humidity &&
										r.config.order === order &&
										r.config.layers === layers &&
										(r.config.scene ?? 'noon') === scene,
								);
								if (!selected.length) continue;
								const rows = [...new Set(selected.map((r) => r.config.offset ?? r.config.separation))]
									.sort((a, b) => a - b)
									.map((offset) => {
										const readings = selected.filter(
											(r) => (r.config.offset ?? r.config.separation) === offset,
										);
										return {
											offset,
											kind:
												readings[0].config.offset === undefined
													? 'solar-separation'
													: 'horizon-offset',
											repeats: readings.map((r) => r.config.repeat),
											samples: readings.length,
											Y: mean(readings.map((r) => r.color.Y)),
											halfWidthY95: half(readings.map((r) => r.color.Y)),
											rgb: [0, 1, 2].map((c) => mean(readings.map((r) => r.color.rgb[c]))),
											spectrum: channels.map((_, c) => mean(readings.map((r) => r.spectrum[c]))),
											readings: readings.map((r) => r.parent),
										};
									});
								const contrasts = [];
								for (const delta of [0.02, 0.1, 1]) {
									const above = selected
											.filter((r) => r.config.offset === delta)
											.sort((a, b) => a.config.repeat - b.config.repeat),
										below = selected.filter((r) => r.config.offset === -delta);
									const vectors = above.flatMap((a) => {
										const b = below.find((r) => r.config.repeat === a.config.repeat);
										return b ? [(a.color.Y - b.color.Y) / (a.color.Y + b.color.Y)] : [];
									});
									if (vectors.length >= 3)
										contrasts.push({
											delta,
											value: mean(vectors),
											halfWidth95: half(vectors),
											vectors,
											repeatIds: above
												.filter((a) => below.some((b) => b.config.repeat === a.config.repeat))
												.map((a) => a.config.repeat),
										});
								}
								groups.push({name, altitude, scene, layers, humidity, order, rows, contrasts});
							}
		for (const g of groups) {
			const baseline = groups.find(
				(b) =>
					b.name === 'bruneton' &&
					b.altitude === g.altitude &&
					b.scene === g.scene &&
					b.humidity === 50 &&
					b.order === 2,
			);
			if (!baseline) continue;
			for (const c of g.contrasts) {
				const b = baseline.contrasts.find((x) => x.delta === c.delta);
				if (!b) continue;
				const paired =
					c.repeatIds.length === b.repeatIds.length && c.repeatIds.every((r) => b.repeatIds.includes(r))
						? c.vectors.map((v, i) => v - b.vectors[b.repeatIds.indexOf(c.repeatIds[i])])
						: null;
				Object.assign(c, {
					baselineDifference: c.value - b.value,
					differenceHalfWidth95: paired
						? half(paired)
						: 4.30265273 *
							(Math.sqrt(variance(c.vectors) / c.vectors.length) +
								Math.sqrt(variance(b.vectors) / b.vectors.length)),
					pairedDifferences: paired,
					differenceMethod: paired
						? 'Empirical paired replicate differences retain measured covariance; no assumed seed cancellation.'
						: 'Covariance-agnostic sum of standard errors; conservative Cauchy bound.',
				});
			}
		}
		run.write('analysis.json', {
			groups,
			inputs,
			differenceIntervals:
				'Actual solver seeds repeat by cohort across models. Match replicate IDs and estimate variance of differences directly, preserving covariance. Same seeds do not imply zero variance. No independence assumption is made.',
			colorimetry:
				'Within each source bin, reconstruct L(lambda) with the degree(q-1) polynomial through q Gaussian samples. Integrate L times the original piecewise-linear CIE table exactly per 1nm segment by three-point Gaussian quadrature. q=2 versus q=4 bounds retained spectral reconstruction sensitivity.',
			liveCampaignParents: paths.filter((p) => !readdirSync(checked(p)).includes('manifest.json')),
			productionUnchanged: true,
		});
		run.write(
			'brightness.csv',
			'profile,altitude,scene,layers,humidity,quadrature,directionKind,offset,Y,halfWidth95,samples\n' +
				groups
					.flatMap((g) =>
						g.rows.map((r) =>
							[
								g.name,
								g.altitude,
								g.scene,
								g.layers,
								g.humidity,
								g.order,
								r.kind,
								r.offset,
								r.Y,
								r.halfWidthY95,
								r.samples,
							].join(','),
						),
					)
					.join('\n') +
				'\n',
		);
		const model = new ColorResetSlope078P2ColorDisplayModel(),
			lux = physical().capture.physicalLux.value;
		let html =
			'<meta charset="utf-8"><title>Published atmosphere profile comparison</title><style>body{background:#20252c;color:white;font:16px sans-serif;max-width:1100px;margin:24px auto}img{max-width:100%}table{width:100%;table-layout:fixed;text-align:center}td{padding:8px}</style><h1>Published aerosol presets: libRadtran horizon colors</h1><p>Common molecular atmosphere, black-ground feedback and fixed production p2 display exposure. Sparse sampled directions, not full scene renders. The geometric horizon is at the middle; nearest registered rays fill rows without blending. Presets are the published OPAC-derived libRadtran mass recipes, not exact original OPAC number-density profiles.</p>';
		for (const altitude of [5, 10000]) {
			const selected = groups.filter(
				(g) =>
					g.altitude === altitude &&
					g.scene === 'noon' &&
					g.humidity === 50 &&
					g.order === 2 &&
					g.rows.filter((r) => r.samples >= 3).length === 6,
			);
			if (!selected.length) continue;
			const image = new PNG({width: selected.length * 220, height: 400});
			for (let y = 0; y < 400; y++)
				for (let x = 0; x < image.width; x++) {
					const g = selected[Math.floor(x / 220)],
						offset = 1 - ((y + 0.5) / 400) * 2;
					const row = [...g.rows].sort(
						(a, b) => Math.abs(a.offset - offset) - Math.abs(b.offset - offset),
					)[0];
					const rgb = model.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (row.rgb), {
						value: lux,
						units: 'lux',
					});
					for (let c = 0; c < 3; c++) image.data[(y * image.width + x) * 4 + c] = Math.round(rgb[c] * 255);
					image.data[(y * image.width + x) * 4 + 3] = 255;
				}
			run.write('horizon-' + altitude + 'm.png', PNG.sync.write(image));
			html += `<h2>${altitude} m observer</h2><table><tr>${selected.map((g) => `<td>${g.name.replaceAll('_', ' ')}</td>`).join('')}</tr></table><img src="horizon-${altitude}m.png">`;
		}
		for (const altitude of [500, 2000])
			for (const scene of ['noon', 'pre10', 'sunset']) {
				const selected = groups.filter(
					(g) =>
						g.altitude === altitude &&
						g.scene === scene &&
						g.humidity === 50 &&
						g.order === 2 &&
						g.rows.every((r) => r.samples >= 3),
				);
				if (selected.length < 2) continue;
				const offsets = selected[0].rows
					.map((r) => r.offset)
					.filter((offset) => selected.every((g) => g.rows.some((r) => r.offset === offset)));
				const image = new PNG({width: selected.length * 220, height: offsets.length * 100});
				const context = scene === 'noon' ? lux : 1530.324582979362;
				for (let y = 0; y < image.height; y++)
					for (let x = 0; x < image.width; x++) {
						const g = selected[Math.floor(x / 220)],
							row = g.rows.find((r) => r.offset === offsets[Math.floor(y / 100)]);
						const rgb = model.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */ (row.rgb), {
							value: context,
							units: 'lux',
						});
						for (let c = 0; c < 3; c++)
							image.data[(y * image.width + x) * 4 + c] = Math.round(rgb[c] * 255);
						image.data[(y * image.width + x) * 4 + 3] = 255;
					}
				const file = `directions-${altitude}-${scene}.png`;
				run.write(file, PNG.sync.write(image));
				html += `<h2>${altitude} m, ${scene}</h2><table><tr>${selected.map((g) => `<td>${g.name.replaceAll('_', ' ')}</td>`).join('')}</tr></table><img src="${file}"><p>Independent directional swatches, not a continuous image. Rows top to bottom: ${offsets
					.map((offset) => {
						const r = selected[0].rows.find((r) => r.offset === offset);
						return r.kind + ' ' + offset + ' degrees';
					})
					.join(
						'; ',
					)}. Shared fixed display context ${context.toFixed(2)} lux; dusk uses the retained baseline sunset context for both times/profiles, without fitting.</p>`;
			}
		html +=
			'<p>The full 5m/10km horizon strips sample offsets +1,+.1,+.02,-.02,-.1,-1 degrees. Other swatch rows are labelled beside their figure. Sharp bands reflect sparse sampling, not measured transition widths. Numerical results and uncertainty remain selectable in <a href="brightness.csv">CSV</a> and <a href="analysis.json">analysis JSON</a>. Color appearance alone does not validate a real atmospheric case.</p>';
		run.write('comparison.html', html);
		run.finish('accepted', {
			groups: groups.length,
			cases: inputs.length,
		});
	} catch (error) {
		failure = String(error);
		run.finish('failed', {failure});
	}
	if (failure) throw new Error(failure);
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/alternate-report.mjs')) await report();
