import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {checked, createRun, identity, releaseBrowserWork, root, source} from './io.mjs';
import {installProbe} from './browser.mjs';
import {encodeChannel, flipRows, gainAt} from './display.mjs';
import {campaign} from './campaign.mjs';
import {response} from './candidates.mjs';
import {refinement} from './refinement.mjs';

const phase = process.argv[2] ?? 'baseline';
const registry = phase === 'refine' ? refinement(process.argv[3]) : phase === 'campaign' || phase === 'resume' ? campaign(phase === 'resume' ? process.argv[3] : null) : null;
const controls = JSON.parse(readFileSync(checked(source + '/controls.json'), 'utf8'));
const inputs = ['AGENTS.md', source + '/AGENTS.md', 'src/flat32/Flat32Atmosphere.js', 'src/flat32/Flat32ProductionSelections.js', 'src/flat32/Flat32Application.js', 'src/flat32/Algorithm32Runtime.js', 'src/flat32/Flat32View.js', 'src/flat32/ModeController.js', 'src/algorithm32/implementation/color-reset-slope-078-p2/consts.js', 'src/algorithm32/implementation/color-reset-slope-078-p9/ColorResetSlope078P9ColorDisplayModel.js', 'src/algorithm32/implementation/bruneton-color/BrunetonColorDisplayModel.js', 'server/flat32/features/shared-cache/selection.js', 'dist/flat32/flat32.js', `server/flat32/data/shared-block/${controls.baseline.packageIdentity}/package-set.json`];
const parents = inputs.map(identity);
if (registry) for (const parent of [registry.baselinePath, registry.calibrationPath, registry.screenPath]) parents.push(identity(parent + '/manifest.json'));
if (registry) for (const parent of new Set(registry.reuse.map(r => r.source))) if (!parents.some(p => p.path === parent + '/manifest.json')) parents.push(identity(parent + '/manifest.json'));
if (registry?.refinementParent) parents.push(identity(registry.refinementParent + '/manifest.json'));
const run = createRun(phase === 'baseline' ? 'baseline' : 'matrix', 'Capture actual production-derived pre-gain linear RGBA32F and native display images with frozen physical inputs', parents);
const cases = /** @type {TwilightCase[]} */ (phase === 'baseline' ? [
	{id: 'sj40-p30', location: 0, mode: 'spherical-distant', height: 40000, time: 'sunset', minutes: 30, layers: [0, 1, 2]},
	{id: 'sj40-p40', location: 0, mode: 'spherical-distant', height: 40000, time: 'sunset', minutes: 40, layers: [0, 1, 2]},
	{id: 'sj40-p50', location: 0, mode: 'spherical-distant', height: 40000, time: 'sunset', minutes: 50, layers: [0, 1, 2]},
	{id: 'sj40-day', location: 0, mode: 'spherical-distant', height: 40000, time: 'noon', layers: [0]},
	{id: 'sj40-night', location: 0, mode: 'spherical-distant', height: 40000, time: 'sunset', minutes: 180, layers: [0, 1, 2]},
] : registry?.cases ?? JSON.parse(readFileSync(checked(process.argv[3]), 'utf8')));
if (registry) run.write('registered-campaign.json', registry);
run.write('registered-cases.json', cases);
run.write('registered-controls.json', controls);
if (phase === 'baseline') for (const name of ['result.json', 'sunset-plus30-native.png', 'sunset-plus40-native.png', 'sunset-plus40-fixed30.png', 'sunset-plus50-native.png', 'sunset-plus50-fixed30.png']) {
	const parent = '.codex-tmp/flat32-twilight-exposure/captures-01/' + name;
	const id = identity(parent); run.write('parents/' + name, readFileSync(checked(parent))); run.write('parents/' + name + '.identity.json', id);
}

let browser = null, server = null, logs = '', failure = null;
const results = [], pageErrors = [];
let frozenLux = registry?.frozenLux ?? null;
try {
	run.progress('serve', 'Starting owned read-only production asset server');
	server = spawn(process.execPath, [source + '/serve.mjs'], {cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
	server.stdout.on('data', b => {logs += b;}); server.stderr.on('data', b => {logs += b;});
	server.on('error', error => {failure = error;});
	for (let attempt = 0;; attempt++) {
		if (failure) throw failure;
		try {if ((await fetch('http://127.0.0.1:8103/flat32/')).ok) break;} catch {}
		assert.ok(attempt < 90, 'Server did not start'); await new Promise(r => setTimeout(r, 1000));
	}
	browser = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 600000, userDataDir: run.absolute + '/work-browser', args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling']});
	run.write('environment.json', {browser: await browser.version(), node: process.version, port: 8103, ephemeralBrowserProfile: 'work-browser removed after browser close and before sealing'});
	const page = await browser.newPage(); await page.setCacheEnabled(false); await page.setViewport({width: 1024, height: 576, deviceScaleFactor: 1}); page.on('pageerror', error => pageErrors.push(String(error)));
	await page.goto('http://127.0.0.1:8103/flat32/', {waitUntil: 'domcontentloaded', timeout: 90000});
	await page.waitForFunction(() => typeof window['__flat32Cleanup'] === 'function', {timeout: 90000});
	const cdp = await page.target().createCDPSession(), cleanup = await cdp.send('Runtime.evaluate', {expression: 'window.__flat32Cleanup'}), properties = await cdp.send('Runtime.getProperties', {objectId: cleanup.result.objectId});
	const receiver = properties.internalProperties.find(p => p.name === '[[BoundThis]]').value;
	await cdp.send('Runtime.callFunctionOn', {objectId: receiver.objectId, functionDeclaration: 'function(){globalThis.proofApplication=this;}'});
	const ready = async () => {
		await page.waitForFunction(() => {const a = globalThis['proofApplication'];return document.querySelector('.flat32-shell').getAttribute('data-flat32-state') === 'ready' && !a._locationTimeRefreshTimer && a._publishedState?.observation.instant === a._state?.observation.instant && a._publishedState?.modeKind === a._state?.modeKind && a._publishedState?.observerHeight.value === a._state?.observerHeight.value;}, {timeout: 600000});
	};
	await ready(); await page.evaluate(installProbe);
	if (registry?.experimentHeightMeters) await page.evaluate(height => {
		const a = globalThis['proofApplication'], original = a.setObserverHeight.bind(a);
		// Experiment-only valid intermediate height inside the existing 0–40 km cache.
		// Retain the ordinary state/publication path; extend only this owned page's preset setter.
		a.setObserverHeight = value => {if (value.value === height) a._commitState({...a._state, observerHeight: {value: height, units: 'meters'}}, false); else original(value);};
		const option = document.createElement('option'); option.value = String(height); option.textContent = 'Experiment ' + height + ' m'; document.querySelector('#flat32-elevation-control').appendChild(option);
	}, registry.experimentHeightMeters);
	const choose = async (selector, value) => {await page.evaluate(({selector, value}) => {const item = /** @type {HTMLSelectElement} */ (document.querySelector(selector)); item.value = String(value); item.dispatchEvent(new Event('change', {bubbles: true}));}, {selector, value}); await ready();};
	const click = async (selector) => {await page.evaluate(selector => /** @type {HTMLElement} */ (document.querySelector(selector)).click(), selector); await ready();};
	for (const [index, spec] of cases.entries()) {
		run.progress('prepare', spec.id, {completed: index, total: cases.length});
		await choose('#flat32-location-control', spec.location);
		if (await page.evaluate(kind => globalThis['proofApplication']._state.modeKind !== kind, spec.mode)) await click('#flat32-mode-control');
		if (spec.mode === 'spherical-distant') {
			if (await page.evaluate(() => globalThis['proofApplication']._state.timeBasis === 'flat')) await click('#flat32-time-basis-control');
			const time = spec.time === 'noon' ? 1 : 2;
			await page.evaluate(({time, minutes}) => {const a = globalThis['proofApplication']; a._transitionLocationTime(state => {let next = a._locationTimeController.selectGlobeTime(state, time); if (minutes) next = a._locationTimeController.adjustGlobeMinuteOffset(next, minutes); return next;});}, {time, minutes: spec.minutes ?? 0}); await ready();
		} else await click('button[data-flat32-time="' + (spec.time === 'flat180' ? 4 : 0) + '"]');
		await choose('#flat32-elevation-control', spec.height); await choose('#flat32-fov-control', spec.fov ?? 50);
		await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await new Promise(r => setTimeout(r, 400));
		run.progress('capture', spec.id, {completed: index, total: cases.length});
		const data = await page.evaluate(spec => globalThis['twilightCapture'](spec), {...spec, resetHeading: spec.resetHeading ?? (index === 0 || spec.location !== cases[index - 1]?.location || spec.mode !== cases[index - 1]?.mode)});
		const {facts} = data; assert.equal(facts.width, 1024); assert.equal(facts.height, 576); assert.equal(facts.glError, 0); assert.equal(facts.state.observerHeight.value, spec.height); assert.equal(facts.state.modeKind, spec.mode);
		if (spec.time === 'sunset' && spec.minutes === 180) assert.ok(facts.sunElevationDegrees < -18, 'Night control is not genuine night');
		const native = flipRows(Buffer.from(data.native, 'base64'), 1024, 576, 4), png = new PNG({width: 1024, height: 576}); png.data = native; run.write(spec.id + '-native.png', PNG.sync.write(png));
		const hdr = flipRows(Buffer.from(data.layers['0'], 'base64'), 1024, 576, 16), floats = new Float32Array(hdr.buffer, hdr.byteOffset, hdr.byteLength / 4), gain = gainAt(facts.meterLux, controls.baseline.curve);
		let aboveOne = 0, maximum = 0; const reconstructed = new PNG({width: 1024, height: 576});
		for (let i = 0; i < native.length; i++) {
			if (i % 4 === 3) {reconstructed.data[i] = 255; continue;}
			const expected = encodeChannel(floats[i], gain, facts.toneMapK), error = Math.abs(expected - native[i]);
			reconstructed.data[i] = expected; maximum = Math.max(maximum, error); if (error > 1) aboveOne++;
		}
		const parity = {maximumByteError: maximum, fractionAboveOne: aboveOne / (1024 * 576 * 3), gain, replayQualified: aboveOne / (1024 * 576 * 3) <= .001};
		run.write(spec.id + '-reencoded.png', PNG.sync.write(reconstructed));
		for (const [layer, bytes] of Object.entries(data.layers)) run.write(spec.id + '-layer' + layer + '.f32', flipRows(Buffer.from(bytes, 'base64'), 1024, 576, 16));
		if (frozenLux === null) frozenLux = facts.meterLux;
		const requests = [{id: 'frozen30', effectiveLux: frozenLux}];
		if (spec.verifyCandidates && registry) for (let repeat = 0; repeat < 3; repeat++) {
			requests.push({id: 'native-proof-' + repeat, effectiveLux: facts.meterLux});
			for (const c of registry.candidates) requests.push({id: c.id + '-proof-' + repeat, effectiveLux: response(c, facts.meterLux, {p90: 0, rms: 0}, controls.baseline.curve, {height: spec.height, mode: spec.mode}).effectiveLux});
		}
		const variants = await page.evaluate(variants => globalThis['twilightVariants'](variants), requests);
		for (const variant of variants) {const image = new PNG({width: 1024, height: 576}); image.data = flipRows(Buffer.from(variant.pixels, 'base64'), 1024, 576, 4); run.write(spec.id + '-' + variant.id + '.png', PNG.sync.write(image));}
		const variantTimings = variants.map(({pixels, ...timing}) => timing);
		run.write(spec.id + '.json', {spec, ...facts, parity, variantTimings}); results.push({id: spec.id, spec, ...facts, parity, variantTimings});
		// A failed replay qualification selects direct original-shader GPU evidence,
		// not a weaker replay gate. Unqualified HDR is a diagnostic proxy only.
		assert.deepEqual(pageErrors, []); console.log(JSON.stringify({run: run.path, id: spec.id, meterLux: facts.meterLux, parity}));
		run.progress('captured', spec.id, {completed: index + 1, total: cases.length, parity});
	}
	for (const parent of parents) assert.equal(identity(parent.path).sha256, parent.sha256, 'Read-only parent changed: ' + parent.path);
	run.write('results.json', {accepted: true, evidenceRoute: 'direct-original-GPU; HDR replay qualifications are separate per case', frozenLux, cases: results, pageErrors});
	await page.evaluate(() => {globalThis['twilightDispose'](); window['__flat32Cleanup']();});
} catch (error) {failure = error; run.write('failure.json', {message: String(error), cases: results, pageErrors});}
finally {
	if (browser) await browser.close();
	if (server) {const exited = new Promise(resolve => server.once('exit', resolve)); server.kill(); await exited;}
	run.write('server.log', logs); releaseBrowserWork(run);
	run.finish(failure ? 'failed' : 'accepted', {caseCount: results.length, error: failure ? String(failure) : null});
}
if (failure) process.exitCode = 1;
