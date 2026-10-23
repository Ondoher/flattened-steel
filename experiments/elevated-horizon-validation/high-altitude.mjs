import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun, identity, source, root, checked} from './io.mjs';
import {buildInput, viewPlan, evaluateView, geometryProof} from './high-altitude-inputs.mjs';

const compiler = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
const variant = process.argv[2] ?? 'baseline';
assert.ok(['baseline', 'altitude', 'angular', 'transport', 'source'].includes(variant));
const channels = process.argv[3] === 'full' ? Array.from({length: 15}, (_, i) => i) : [2, 6, 9];
const request = buildInput(variant),
	plan = viewPlan(request);
const run = createRun(
	'high-' + variant,
	'High-altitude horizon resolution: complete production recurrence, isolated refinements and sparse N1-N4 view probes.',
	[
		identity(compiler),
		identity('src/algorithm32/implementation/distant-sun/cache/DistantSunScatteringAccuracy.js'),
		identity('src/algorithm32/sampling-domains/position/spherical-native/SphericalNativePositionDomain.js'),
		identity('experiments/sky-accuracy-dials/numerics/math.js'),
		identity('server/flat32/features/shared-cache/selection.js'),
	],
);
let browser, failure;
const results = [];
try {
	run.write('control.json', {
		variant,
		channels,
		request,
		scope: '10km control and30/40km anti-Sun noon, black boundary, no refraction, production optics. Altitude refinement inserts midpoint nodes below45km; original upper nodes preserved.',
		view: 'Binary64 reconstruction of Float32 cumulative GPU fields; exact runtime row-dependent Sun035, monotone-cubic solar, linear altitude and Q30/Q120/Q480 midpoint view equations. Not an actual app scene or package activation.',
	});
	run.write('view-plan.json.gz', gzipSync(Buffer.from(JSON.stringify(plan))));
	run.write('geometry.json', geometryProof());
	const bundle = await rollup({
		input: checked(source + '/high-altitude-browser.mjs'),
		plugins: [
			{
				name: 'contained-convergence-control',
				transform(code, id) {
					if (id.replaceAll('\\', '/') !== root.replaceAll('\\', '/') + '/' + compiler) return null;
					const guard = "if (accuracy !== 'legacy' && intervals !== 60)";
					assert.equal(code.split(guard).length, 2);
					// Only the offline diagnostic admits120 while retaining corrected aerosol normalization and Sun035.
					return {
						code: code.replace(
							guard,
							"if (accuracy !== 'legacy' && intervals !== 60 && intervals !== 120)",
						),
						map: null,
					};
				},
			},
		],
	});
	let code;
	try {
		code = (await bundle.generate({format: 'iife'})).output[0].code;
	} finally {
		await bundle.close();
	}
	run.write('browser.js.gz', gzipSync(Buffer.from(code)));
	browser = await puppeteer.launch({
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		headless: 'new',
		userDataDir: run.absolute + '/browser-profile',
		protocolTimeout: 1800000,
		args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling'],
	});
	const page = await browser.newPage(),
		errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.exposeFunction('highAltitudeProgress', (stage) => run.progress('gpu', String(stage)));
	await page.exposeFunction('highAltitudeChannel', (r) => {
		assert.equal(r.orders.length, 4);
		assert.ok(
			r.orders.every((o) => o.length === plan.coordinates.length && o.every((x) => Number.isFinite(x) && x >= 0)),
		);
		const readings = evaluateView(plan, r.orders, r.channel);
		run.write('channel-' + r.channel + '.json.gz', gzipSync(Buffer.from(JSON.stringify({...r, readings}))));
		results.push({channel: r.channel, readings, report: r.report});
		run.progress('channel', 'Completed ' + variant + ' channel ' + r.channel, {
			completed: results.length,
			total: channels.length,
		});
		console.log(JSON.stringify({variant, channel: r.channel, completed: results.length, total: channels.length}));
	});
	await page.addScriptTag({content: code});
	const facts = await page.evaluate((c) => globalThis['highAltitudeExecute'](c), {
		request,
		channels,
		coordinates: plan.coordinates,
	});
	assert.deepEqual(errors, []);
	assert.equal(results.length, channels.length);
	run.write('results.json', {variant, results, facts});
} catch (e) {
	failure = String(e);
} finally {
	await browser?.close();
	run.finish(failure ? 'failed' : 'accepted', {failure, variant, channels, completed: results.length});
}
if (failure) throw new Error(failure);
