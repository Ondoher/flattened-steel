import assert from 'node:assert/strict';
import {readFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {cases, medium} from './physical.mjs';
import {capHeight} from './geometry.mjs';
import {executeGpu} from './reference.mjs';
import {createRun, identity, repository} from './io.mjs';
import {acceptedRuns} from './evidence.mjs';

const {fragment} = await import(
	pathToFileURL(path.join(repository, 'experiments/sky-accuracy-dials/horizon-reference/gpu.mjs')).href
);
const away = process.argv.includes('--away');
const native = away
	? acceptedRuns('m3-guide-merged').at(-1)
	: 'tmp/experiments/flat-dome-cache-shape/runs/00016-m2-lib-guide';
assert.ok(native, 'Complete the corrected native guide matrix before its shared-physics proof.');
const run = createRun(away ? 'm3-away-proof' : 'm3-guide-proof', [
	identity(`${native}/manifest.json`),
	identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs'),
]);
let browser;
let failure;
const batches = [];
try {
	const selected = cases(true).filter(
		(item) => item.altitude === 1000 && item.view === (away ? 'away-low' : 'sunward'),
	);
	const readings = JSON.parse(readFileSync(path.join(repository, native, 'readings.json'), 'utf8'));
	const groups = Array.from({length: 15}, (_, channel) =>
		selected.map((item) => {
			const delta = [item.sourceRadius - item.origin[0], -item.origin[1], 4828032 - item.origin[2]];
			const distance = Math.hypot(...delta);
			return {
				id: item.id,
				channel,
				origin: item.origin,
				direction: item.direction,
				end: (capHeight(Math.hypot(...item.origin.slice(0, 2))) - item.origin[2]) / item.direction[2],
				medium: {
					...medium,
					geometry: /** @type {const} */ ('flat'),
					sourceKind: /** @type {const} */ ('parallel'),
					sourceDirection: delta.map((v) => v / distance),
					sourceIrradiance: medium.sourceIrradiance.map((v) => v * (4800000 / distance) ** 2),
					topAltitude: capHeight(Math.hypot(...item.origin.slice(0, 2))),
				},
			};
		}),
	).flat();
	const shader = fragment()
		.replace(
			'uniform float endDistance,sourceScale,referenceDistance;',
			'uniform float endDistance,sourceScale,referenceDistance,guideTop;',
		)
		.replace('100000.0-x.z', 'guideTop-x.z');
	run.write('kernel.glsl', shader);
	const request = {
		groups,
		paths: 8192,
		maximumMilliseconds: 86400000,
		profiles: [{name: 'plane-all-orders', batches: 8, quadrature: 128, roulette: 8, seed: 0x21800000}],
	};
	run.write('registration.json', {
		request,
		physicalMatch:
			'Same locally matched parallel source, optical coefficients, exponential local-height slab, phase, observer, direction and all-orders estimator as the native pilot. Native discretizes layers; probe integrates continuous exponentials.',
	});
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	browser = await puppeteer.launch({
		headless: 'new',
		userDataDir: profile,
		protocolTimeout: 86400000,
		args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11'],
	});
	const page = await browser.newPage();
	await page.exposeFunction('retainBatch', (batch) => {
		batches.push(batch);
		run.progress('control', `group=${batch.group}, batch=${batch.batch}`);
	});
	const telemetry = await page.evaluate(executeGpu, shader, request);
	run.write('batches.json', batches);
	const results = groups.map((group, index) => {
		const values = batches.filter((batch) => batch.group === index).map((batch) => batch.means[0]);
		const mean = values.reduce((s, v) => s + v, 0) / values.length;
		const half =
			2.365 * Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length * (values.length - 1)));
		const nativeRow = readings.find((r) => r.id === group.id);
		const actual = nativeRow.spectrum[group.channel];
		const nativeHalf = 1.96 * nativeRow.standardError[group.channel];
		return {
			id: group.id,
			channel: group.channel,
			probe: mean,
			probeHalf95: half,
			native: actual,
			nativeHalf95: nativeHalf,
			relativeDifference: (actual - mean) / mean,
			withinCombinedFourIntervals: Math.abs(actual - mean) <= 4 * (half + nativeHalf) + 0.002 * mean,
		};
	});
	run.write('results.json', {
		telemetry,
		results,
		scope: 'Matched shared-physics slab/all-orders check, not an exact finite-cap reference.',
	});
	assert.ok(
		results.every((r) => r.withinCombinedFourIntervals),
		'A native guide/probe shared-physics control exceeds its registered uncertainty check.',
	);
	console.log(
		JSON.stringify({
			run: run.root,
			controls: results.length,
			maximumRelativeDifference: Math.max(...results.map((r) => Math.abs(r.relativeDifference))),
			telemetry,
		}),
	);
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => {
		failure ??= error;
	});
	run.finish(failure ? 'failed' : 'accepted', {
		message: failure
			? String(failure)
			: 'Actual native/probe shared-physics slab controls agree within the stated sampling check.',
	});
}
if (failure) {
	throw failure;
}
