import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {cases, medium} from './physical.mjs';
import {direct} from './direct.mjs';
import {fragment, executeGpu} from './reference.mjs';
import {createRun, identity, checked} from './io.mjs';

const run = createRun('m1-probe-pilot', [identity('tmp/experiments/flat-dome-cache-shape/runs/00002-m1-contract/manifest.json'), identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs')]);
/** @type {HorizonReferenceBatch[]} */
const batches = [];
let browser;
let failure;
try {
	const selected = cases(true).filter((item) => item.altitude === 1000 && item.view === 'sunward');
	const channel = 6;
	const directRows = selected.map((item) => ({id: item.id, values: [64, 128, 256].map((n) => direct(item, channel, n))}));
	for (const row of directRows) {
		assert.ok(Math.abs(row.values[1] - row.values[2]) / Math.max(row.values[2], 1e-30) < 0.001, `Direct integration unconverged: ${row.id}`);
	}
	run.write('direct.json', {channel, rows: directRows});
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({headless: 'new', userDataDir: profile, protocolTimeout: 86400000, args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling']});
	const page = await browser.newPage();
	await page.exposeFunction('retainBatch', (batch) => {
		batches.push(batch);
		run.progress('probe', `profile=${batch.profile}, group=${batch.group}, batch=${batch.batch}`, {completed: batches.length});
	});
	const shader = fragment();
	run.write('kernel.glsl', shader);
	const groups = selected.map((item) => ({id: item.id, medium: {...medium, geometry: /** @type {const} */ ('flat'), sourceKind: /** @type {const} */ ('finite'), sourcePosition: [item.sourceRadius, 0, 4828032]}, origin: item.origin, direction: item.direction, channel, end: item.end}));
	const request = {groups, paths: 8192, maximumMilliseconds: 86400000, profiles: [{name: 'cap', batches: 8, quadrature: 128, roulette: 8, seed: 0x52800000}]};
	run.write('registration.json', {request, scope: 'GPU cap-boundary and independent J1 check at three non-grid clearances, one wavelength. Higher-order outputs recorded but not yet accepted for cache accuracy.'});
	const telemetry = await page.evaluate(executeGpu, shader, request);
	run.write('batches.json', batches);
	const rows = selected.map((item, group) => {
		const observations = batches.filter((batch) => batch.group === group).map((batch) => batch.means[1]);
		const mean = observations.reduce((sum, value) => sum + value, 0) / observations.length;
		const se = Math.sqrt(observations.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (observations.length * (observations.length - 1)));
		const target = directRows[group].values[2];
		return {id: item.id, firstOrder: mean, direct: target, halfWidth95: se * 2.365, relativeDifference: (mean - target) / target, pureOrders: Array.from({length: 4}, (_, order) => batches.filter((batch) => batch.group === group).reduce((sum, batch) => sum + batch.means[order + 1], 0) / observations.length)};
	});
	run.write('results.json', {telemetry, rows});
	for (const row of rows) {
		assert.ok(Math.abs(row.firstOrder - row.direct) <= 4 * row.halfWidth95 + 0.002 * row.direct, `Independent GPU J1 differs: ${row.id}`);
	}
	console.log(JSON.stringify({run: run.root, telemetry, rows}));
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => { failure ??= error; });
	run.finish(failure ? 'failed' : 'accepted', {message: failure ? String(failure) : 'Independent GPU cap J1 pilot matches converged direct calculations within sampling uncertainty.'});
}
if (failure) {
	throw failure;
}
