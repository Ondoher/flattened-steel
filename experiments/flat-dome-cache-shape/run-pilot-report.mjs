import {readFileSync} from 'node:fs';
import path from 'node:path';
import {PNG} from 'pngjs';
import {createRun, identity, repository} from './io.mjs';
import {color, errors} from './color.mjs';

const cache = 'tmp/experiments/flat-dome-cache-shape/runs/00008-m2-cache-pilot';
const probe = 'tmp/experiments/flat-dome-cache-shape/runs/00012-m1-probe-pilot';
const lib = 'tmp/experiments/flat-dome-cache-shape/runs/00011-m2-lib-guide';
const run = createRun('m2-pilot-report', [
	identity(`${cache}/manifest.json`),
	identity(`${probe}/manifest.json`),
	identity(`${lib}/manifest.json`),
	identity('references/downloads/cie-1931-2deg/CIE_xyz_1931_2deg.csv'),
]);
const read = (relative) => JSON.parse(readFileSync(path.join(repository, relative), 'utf8'));
try {
	const reference = read(`${probe}/results.json`);
	const guides = read(`${lib}/readings.json`);
	const rows = [];
	for (const count of [2, 4]) {
		const candidate = read(`${cache}/candidate-${count}.json`);
		for (const guide of guides) {
			const cached = candidate.results.find((row) => row.id === guide.id);
			const independent = reference.rows
				.filter((row) => row.id === guide.id)
				.sort((a, b) => a.channel - b.channel);
			const spectra = [
				Array.from({length: 15}, (_, c) => cached.orders.reduce((sum, order) => sum + order[c], 0)),
				independent.map((row) => row.pureOrders.reduce((sum, v) => sum + v, 0)),
				guide.spectrum,
			];
			rows.push({
				count,
				id: guide.id,
				spectra,
				colors: spectra.map((spectrum) => color(spectrum)),
				probeError: errors(spectra[0], spectra[1]),
				libGuideDifference: errors(spectra[0], spectra[2]),
				metadata: candidate.metadata,
				libraryScope: guide.physicalMatch,
			});
		}
	}
	const width = 720;
	const rowHeight = 72;
	for (const exposure of [0.06, 0.48]) {
		const image = new PNG({width, height: rows.length * rowHeight});
		for (let row = 0; row < rows.length; row++) {
			for (let method = 0; method < 3; method++) {
				const rgb = color(rows[row].spectra[method], exposure).rgb;
				for (let y = row * rowHeight; y < (row + 1) * rowHeight; y++) {
					for (let x = (method * width) / 3; x < ((method + 1) * width) / 3; x++) {
						const index = (y * width + x) * 4;
						image.data[index] = rgb[0];
						image.data[index + 1] = rgb[1];
						image.data[index + 2] = rgb[2];
						image.data[index + 3] = 255;
					}
				}
			}
		}
		run.write(`swatches-${exposure}.png`, PNG.sync.write(image));
	}
	run.write('results.json', {
		rows,
		display:
			'Fixed CIE bin integration, D65 linear-sRGB matrix, common exposure 0.06; secondary common exposure0.48; no method normalization.',
		scope: 'Pilot at1km/three clearances, N2/N4; not the final count recommendation. libRadtran is a local-height slab/parallel/all-orders guide, not matched finite-cap J4 truth.',
	});
	run.write(
		'accuracy.csv',
		'count,id,spectral_error_percent,luminance_error_percent,deltaE76,retained_bytes,build_ms\n' +
			rows
				.map((row) =>
					[
						row.count,
						row.id,
						100 * row.probeError.relativeSpectral,
						100 * row.probeError.luminanceRelative,
						row.probeError.deltaE76,
						row.metadata.retainedFieldBytes,
						row.metadata.buildMilliseconds,
					].join(','),
				)
				.join('\n') +
			'\n',
	);
	const table = rows
		.map(
			(row) =>
				`<tr><td>${row.count}</td><td>${row.id}</td>${row.colors.map((c) => `<td><div style="width:150px;height:72px;background:rgb(${c.rgb.join(',')})"></div><small>${c.rgb.join(', ')}</small></td>`).join('')}<td>${(100 * row.probeError.relativeSpectral).toFixed(3)}%</td><td>${row.probeError.deltaE76.toFixed(3)}</td></tr>`,
		)
		.join('\n');
	run.write(
		'index.html',
		`<!doctype html><html lang="en"><meta charset="utf-8"><title>Flat dome cache pilot</title><style>body{background:#121212;color:#f2f2f2;font:16px system-ui;padding:24px}td,th{padding:10px;border:1px solid #777}table{border-collapse:collapse}a{color:#abd3fa}img{max-width:100%}</style><h1>Flat dome cache pilot: N=2 and N=4</h1><p>All rows: altitude1km, sunward elevation30 degrees; distance fractions0.01,0.25,0.75 of maximum Euclidean cap clearance. Primary colors share exposure0.06. The native guide uses locally matched slab/parallel illumination and all orders; differences from finite-cap/J4 physics are explicitly not interpolation error.</p><p><a href="accuracy.csv">Accuracy CSV</a> | <a href="results.json">Raw spectra, metrics and scope</a></p><table><tr><th>Slices</th><th>Physical case</th><th>New cache J1-J4</th><th>Independent probe J1-J4</th><th>libRadtran guide, all orders</th><th>Spectral error vs probe</th><th>Delta E76</th></tr>${table}</table><h2>Higher common exposure:0.48</h2><p>Same rows/column order; all methods use the same eightfold exposure.</p><img src="swatches-0.48.png" alt="Six rows of actual cache, independent-probe, and libRadtran guide color swatches"><p>Field payload: N2 ${(rows[0].metadata.retainedFieldBytes / 1048576).toFixed(2)} MiB; N4 ${(rows[3].metadata.retainedFieldBytes / 1048576).toFixed(2)} MiB. Compilation and first-use query compilation are separate from per-field construction; this pilot is not an idle repeated performance qualification.</p></html>`,
	);
	run.finish('accepted', {
		message:
			'Actual three-method pilot swatches and numerical errors generated from finalized physical outputs; comparison limits retained.',
		rows: rows.length,
	});
	console.log(
		JSON.stringify({
			run: run.root,
			rows: rows.map((row) => ({
				count: row.count,
				id: row.id,
				spectralPercent: row.probeError.relativeSpectral * 100,
			})),
		}),
	);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
