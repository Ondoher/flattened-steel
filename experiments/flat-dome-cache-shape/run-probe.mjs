import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {cases, controlCases, medium, validationCases} from './physical.mjs';
import {direct} from './direct.mjs';
import {fragment, executeGpu} from './reference.mjs';
import {createRun, identity, checked} from './io.mjs';

const all = process.argv.includes('--all');
const validation = process.argv.includes('--validation');
const run = createRun(all ? 'm3-probe-dev' : validation ? 'm3-probe-val' : 'm1-probe-pilot', [
	identity('tmp/experiments/flat-dome-cache-shape/runs/00002-m1-contract/manifest.json'),
	identity('experiments/sky-accuracy-dials/horizon-reference/gpu.mjs'),
]);
/** @type {HorizonReferenceBatch[]} */
const batches = [];
let browser;
let failure;
try {
	const selected = all
		? [...cases(), ...controlCases()]
		: validation
			? validationCases()
			: cases(true).filter((item) => item.altitude === 1000 && item.view === 'sunward');
	const channels =
		all || validation || process.argv.includes('--spectrum') ? Array.from({length: 15}, (_, i) => i) : [6];
	const physical = channels.flatMap((channel) =>
		selected.filter((item) => item.end - item.entry > 1e-7).map((item) => ({item, channel})),
	);
	const directRows = [];
	for (let index = 0; index < physical.length; index++) {
		const {item, channel} = physical[index];
		directRows.push({id: item.id, channel, values: [64, 128, 256].map((n) => direct(item, channel, n))});
		if (index % 128 === 0) {
			run.progress('direct-convergence', `Checking independent direct integration ${index}/${physical.length}.`);
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	}
	for (const row of directRows) {
		assert.ok(
			Math.abs(row.values[1] - row.values[2]) / Math.max(row.values[2], 1e-30) < 0.001,
			`Direct integration unconverged: ${row.id}`,
		);
	}
	run.write('direct.json', {channels, rows: directRows});
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({
		headless: 'new',
		userDataDir: profile,
		protocolTimeout: 86400000,
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-background-timer-throttling',
		],
	});
	const page = await browser.newPage();
	await page.exposeFunction('retainBatch', (batch) => {
		batches.push(batch);
		run.progress('probe', `profile=${batch.profile}, group=${batch.group}, batch=${batch.batch}`, {
			completed: batches.length,
		});
	});
	const shader = fragment();
	run.write('kernel.glsl', shader);
	const groups = physical.map(({item, channel}) => ({
		id: item.id,
		medium: {
			...medium,
			geometry: /** @type {const} */ ('flat'),
			sourceKind: /** @type {const} */ ('finite'),
			sourcePosition: [item.sourceRadius, 0, 4828032],
		},
		origin: item.origin.map((v, k) => v + item.entry * item.direction[k]),
		direction: item.direction,
		channel,
		end: item.end - item.entry,
	}));
	const request = {
		groups,
		paths: 8192,
		maximumMilliseconds: 86400000,
		profiles: [{name: 'cap', batches: 8, quadrature: 128, roulette: 8, seed: 0x52800000}],
	};
	run.write('registration.json', {
		request,
		channels,
		selected,
		seedPolicy:
			'Disjoint initial path-state ranges: seed+(group*batches+batch)*paths; campaign range checked below2^32. No group*2^22 wrap at large group counts.',
		controlVariate:
			'Final reference uses converged direct J1 plus independently sampled pure J2-J4; raw sampled J1 and cumulative values are retained for independent checks.',
		scope: 'Full cap-boundary and independent J1 checks; per-order and cumulative reference with per-case sampling intervals. Vacuum cases have analytically empty integration domains.',
	});
	if (request.profiles[0].seed + groups.length * request.profiles[0].batches * request.paths >= 2 ** 32) {
		throw new Error(
			'Reference path-state namespace would wrap; split the campaign into disjoint registered ranges.',
		);
	}
	const telemetry = await page.evaluate(executeGpu, shader, request);
	run.write('batches.json', batches);
	run.progress('reduction', 'Reducing retained independent order batches with linear-time group indexing.');
	/** @type {Map<number, HorizonReferenceBatch[]>} */
	const byGroup = new Map();
	for (const batch of batches) {
		if (!byGroup.has(batch.group)) {
			byGroup.set(batch.group, []);
		}
		byGroup.get(batch.group).push(batch);
	}
	const rows = physical.map(({item, channel}, group) => {
		const sourceBatches = byGroup.get(group);
		const observations = sourceBatches.map((batch) => batch.means[1]);
		const mean = observations.reduce((sum, value) => sum + value, 0) / observations.length;
		const se = Math.sqrt(
			observations.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
				(observations.length * (observations.length - 1)),
		);
		const target = directRows[group].values[2];
		const orderBatches = sourceBatches.map((batch) => [target, ...batch.means.slice(2, 5)]);
		const pureOrders = Array.from(
			{length: 4},
			(_, order) => orderBatches.reduce((sum, batch) => sum + batch[order], 0) / observations.length,
		);
		const totalBatches = orderBatches.map((batch) => batch.reduce((sum, value) => sum + value, 0));
		const total = totalBatches.reduce((sum, value) => sum + value, 0) / totalBatches.length;
		const totalHalfWidth95 =
			2.365 *
			Math.sqrt(
				totalBatches.reduce((sum, value) => sum + (value - total) ** 2, 0) /
					(totalBatches.length * (totalBatches.length - 1)),
			);
		return {
			id: item.id,
			channel,
			firstOrder: mean,
			direct: target,
			halfWidth95: se * 2.365,
			relativeDifference: target > 0 ? (mean - target) / target : 0,
			pureOrders,
			total,
			totalHalfWidth95,
			orderBatches,
		};
	});
	for (const item of selected.filter((item) => item.end - item.entry <= 1e-7)) {
		for (const channel of channels) {
			rows.push({
				id: item.id,
				channel,
				firstOrder: 0,
				direct: 0,
				halfWidth95: 0,
				relativeDifference: 0,
				pureOrders: [0, 0, 0, 0],
				total: 0,
				totalHalfWidth95: 0,
				orderBatches: Array.from({length: 8}, () => [0, 0, 0, 0]),
			});
		}
	}
	run.write('results.json', {telemetry, rows});
	for (const row of rows) {
		assert.ok(
			Math.abs(row.firstOrder - row.direct) <= 4 * row.halfWidth95 + 0.002 * row.direct,
			`Independent GPU J1 differs: ${row.id}`,
		);
	}
	console.log(
		JSON.stringify({
			run: run.root,
			telemetry,
			cases: selected.length,
			channels: channels.length,
			rows: rows.length,
			maximumJ1RelativeDifference: Math.max(...rows.map((row) => Math.abs(row.relativeDifference))),
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
			: 'Independent GPU cap J1 pilot matches converged direct calculations within sampling uncertainty.',
	});
}
if (failure) {
	throw failure;
}
