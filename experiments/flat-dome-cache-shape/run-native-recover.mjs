import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {createRun, checked, identity, repository} from './io.mjs';
import {medium} from './physical.mjs';

const parent = 'tmp/experiments/flat-dome-cache-shape/runs/00018-m3-lib-guide';
const read = (filename) => JSON.parse(readFileSync(checked(path.join(repository, filename)), 'utf8'));
const run = createRun('m3-guide-recover', [identity(`${parent}/manifest.json`)]);
try {
	const registration = read(`${parent}/registration.json`);
	const readings = [];
	for (const [index, item] of registration.selected.entries()) {
		const launch = read(`${parent}/launch-${index}.json`);
		assert.equal(launch.code, 0, `Native process failed: ${item.id}`);
		const tool = checked(/^libRadtran run: (.+)$/m.exec(launch.stdout)[1].trim(), path.join(repository, parent));
		const filename = checked(path.join(tool, 'execution/mc.rad.spc'), tool);
		const stdname = checked(path.join(tool, 'execution/mc.rad.std.spc'), tool);
		const raw = readFileSync(filename, 'utf8')
			.trim()
			.split(/\r?\n/)
			.map((line) => line.trim().split(/\s+/).map(Number));
		const sigma = readFileSync(stdname, 'utf8')
			.trim()
			.split(/\r?\n/)
			.map((line) => Number(line.trim().split(/\s+/).at(-1)) / 1000);
		assert.equal(raw.length, 15);
		assert.equal(sigma.length, 15);
		const rawSpectrum = raw.map((row, c) => {
			assert.ok(Math.abs(row[0] - medium.wavelengths[c]) < 0.002 && Number.isFinite(row.at(-1)));
			return row.at(-1) / 1000;
		});
		const roundoffTolerance = Math.max(...rawSpectrum.map(Math.abs), 1e-30) * 1e-12;
		assert.ok(
			rawSpectrum.every((v) => v >= -roundoffTolerance),
			`Substantial negative native estimator: ${item.id}`,
		);
		const standardError = sigma.map((v) => (Number.isFinite(v) && v >= 0 ? v : null));
		readings.push({
			id: item.id,
			spectrum: rawSpectrum.map((v) => Math.max(0, v)),
			rawSpectrum,
			standardError,
			unavailableUncertaintyChannels: standardError.flatMap((v, c) => (v === null ? [c] : [])),
			roundedNegativeChannels: rawSpectrum.flatMap((v, c) => (v < 0 ? [c] : [])),
			roundoffTolerance,
			physicalMatch: [
				'Local-height plane-parallel slab, not finite cap.',
				'Locally matched collimated source, not finite point source.',
				'All scattering orders, not J4.',
			],
			derivation: {
				operation:
					'Normalize only negative values below1e-12 of this actual spectrum peak, preserving signed raw values. Native undefined standard deviations become explicit unavailable values, not zero or fabricated confidence.',
				raw: identity(path.relative(repository, filename)),
				standard: identity(path.relative(repository, stdname)),
			},
		});
		if (index % 32 === 0) {
			run.progress(
				'reduction',
				`Recovering authenticated completed native outputs ${index}/${registration.selected.length}.`,
			);
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}
	run.write('readings.json', readings);
	run.finish('accepted', {
		message:
			'Actual native spectra recovered without rerunning physical cases; negligible signed roundoff and unavailable native uncertainty remain explicit.',
		cases: readings.length,
		withUnavailableSigma: readings.filter((r) => r.unavailableUncertaintyChannels.length).length,
		withSignedRoundoff: readings.filter((r) => r.roundedNegativeChannels.length).length,
	});
	console.log(run.root);
} catch (error) {
	run.write('failure.json', {error: String(error), stack: error.stack});
	run.finish('failed', {message: String(error)});
	throw error;
}
