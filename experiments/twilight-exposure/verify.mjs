import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {checked, createRun, identity, output, root} from './io.mjs';
import {gainAt} from './display.mjs';
import {response} from './candidates.mjs';

const parent = process.argv[2], results = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8'));
const run = createRun('verify', 'Verify complete immutable evidence lineage, unchanged optical parents, strict pixel parity, anchors and measured response overhead', [identity(parent + '/manifest.json')]);
try {
	const seen = new Set(), verified = [], production = new Map();
	function verifyManifest(relative) {
		if (seen.has(relative)) return;
		seen.add(relative);
		const manifest = JSON.parse(readFileSync(checked(relative), 'utf8'));
		assert.ok(['accepted', 'failed'].includes(manifest.state), relative);
		if (relative === parent + '/manifest.json') assert.equal(manifest.state, 'accepted');
		let bytes = 0;
		for (const item of manifest.artifacts) {
			assert.ok(item.path.startsWith(relative.slice(0, -'manifest.json'.length)));
			assert.deepEqual(identity(item.path), item, item.path); bytes += item.bytes;
		}
		for (const item of manifest.parents) {
			assert.deepEqual(identity(item.path), item, item.path);
			if (item.path.endsWith('/manifest.json') && item.path.startsWith(output + '/')) verifyManifest(item.path);
			if (item.path.startsWith('src/') || item.path.startsWith('server/') || item.path.startsWith('dist/')) {
				if (production.has(item.path)) assert.equal(production.get(item.path), item.sha256);
				production.set(item.path, item.sha256);
			}
		}
		const directory = relative.slice(0, -'/manifest.json'.length);
		assert.ok(!existsSync(root + '/' + directory + '/work-browser'));
		const events = readFileSync(checked(directory + '/progress.jsonl'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
		const gaps = events.slice(1).map((e, i) => (Date.parse(e.timestamp) - Date.parse(events[i].timestamp)) / 1000);
		assert.ok(gaps.every(x => x <= 31), 'Missing progress heartbeat: ' + directory);
		verified.push({path: relative, state: manifest.state, artifacts: manifest.artifacts.length, bytes, elapsedSeconds: manifest.elapsedSeconds, maximumProgressGapSeconds: Math.max(0, ...gaps)});
	}
	verifyManifest(parent + '/manifest.json');
	assert.ok(results.sources.every(s => s.facts.parity.replayQualified && s.facts.glError === 0));
	assert.equal(results.sources.length, results.registry.cases.length + results.registry.reuse.length);
	for (const source of results.sources) {
		const f = source.facts;
		assert.equal(f.state.locationLabel, source.id.startsWith('ug') ? 'Union Glacier' : 'San Jose');
		assert.equal(f.state.observerHeight.value, f.spec.height);
		if (f.state.modeKind === 'spherical-distant' && f.spec.time === 'sunset') assert.equal(Math.round(f.state.globeHourOffset * 60), f.spec.minutes ?? 0);
	}
	assert.ok(results.gpuChecks.length >= 9 && results.gpuChecks.every(c => c.qualified));
	const night = results.rows.filter(r => r.genuineNight), daylight = results.rows.filter(r => r.daylight);
	assert.equal(night.length, results.registry.candidates.length * results.sources.filter(s => s.facts.spec.minutes === 180).length);
	assert.ok(night.every(r => r.nightSourceFluxRatio >= .9 && r.nightSourceFluxRatio <= 1.1 && r.nightSourceVisibleRatio >= .9));
	assert.ok(daylight.every(r => r.nativeDifference.fractionAboveTwo <= .001));
	const calibration = JSON.parse(readFileSync(checked(results.registry.calibrationPath + '/calibration.json'), 'utf8'));
	const acceptance = [];
	for (const selected of results.registry.candidates) {
		for (const minute of [30, 40, 50]) {
			const row = results.rows.find(r => r.candidate === selected.id && r.case === 'sj40000-p' + minute);
			const frozen = calibration.cases.find(c => c.id === 'sj40-p' + minute).frozen;
			assert.ok(row.metrics.lowerMedian >= .5 * frozen.lowerMedian && row.metrics.bandContrast >= .5 * frozen.bandContrast && row.metrics.bandMeanChroma >= .5 * frozen.bandMeanChroma);
			if (minute === 50) assert.ok(row.metrics.bandWhiteFraction <= .5 * row.native.bandWhiteFraction);
		}
		const selectedRows = results.rows.filter(r => r.candidate === selected.id);
		assert.ok(selectedRows.every(r => !r.flags.includes('all-visible-twilight-stars-lost')));
		if (selected.kind === 'altitude-curve-lift') for (const row of selectedRows) {
			const facts = results.sources.find(s => s.id === row.case).facts;
			if (facts.spec.height <= selected.heightStartMeters || facts.spec.mode === 'flat-local') assert.equal(row.effectiveLux, row.meterLux);
		}
		acceptance.push({candidate: selected.id, originalPilotGuards: true, twilightAllVisibleStarsGuard: true, ordinaryAndFlatNativeFunction: selected.kind === 'altitude-curve-lift'});
	}
	const groups = new Map();
	for (const source of results.sources) {
		const f = source.facts, key = [f.state.locationIndex, f.state.modeKind, f.state.observation.instant, f.state.flatTimeIndex, f.spec.height].join('|');
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(source);
	}
	const poseGainInvariantGroups = [];
	for (const [key, sources] of groups) if (sources.length > 1) {
		const lux = sources.map(s => s.facts.meterLux), spread = Math.max(...lux) - Math.min(...lux);
		assert.ok(spread <= 1e-9 * Math.max(1, ...lux));
		poseGainInvariantGroups.push({key, cases: sources.map(s => s.id), meterLuxSpread: spread});
	}
	const controls = JSON.parse(readFileSync(checked(results.parent + '/registered-controls.json'), 'utf8')), curve = controls.baseline.curve;
	const values = results.sources.map(s => s.facts.meterLux), timings = [];
	const responseChecks = [];
	for (const selected of results.registry.candidates) for (const height of [5, 2000, 10000, 17500, 25000, 32500, 40000]) {
		let prior = 0;
		for (let i = 0; i <= 2400; i++) {
			const lux = i === 0 ? 0 : 10 ** (-12 + (i - 1) * 19 / 2399), gain = response(selected, lux, {p90: 0, rms: 0}, curve, {height, mode: 'spherical-distant'}).gain;
			assert.ok(Number.isFinite(gain) && gain > 0 && lux * gain >= prior - 1e-8 * Math.max(1, prior)); prior = lux * gain;
			if (selected.kind === 'altitude-curve-lift' && height <= selected.heightStartMeters) assert.equal(gain, gainAt(lux, curve));
		}
		responseChecks.push({candidate: selected.id, height, points: 2401, finitePositiveMonotoneBrightness: true});
	}
	for (const selected of [null, ...results.registry.candidates]) {
		const repeats = [];
		for (let trial = 0; trial < 5; trial++) {
			let checksum = 0; const count = 200000, start = performance.now();
			for (let i = 0; i < count; i++) checksum += selected ? response(selected, values[i % values.length], {p90: 0, rms: 0}, curve, {height: results.sources[i % values.length].facts.spec.height, mode: results.sources[i % values.length].facts.spec.mode}).gain : gainAt(values[i % values.length], curve);
			repeats.push({milliseconds: performance.now() - start, count, checksum});
		}
		timings.push({candidate: selected?.id ?? 'native', repeats, medianNanosecondsPerResponse: repeats.map(r => r.milliseconds * 1e6 / r.count).sort((a, b) => a - b)[2]});
	}
	const frameTimes = results.sources.filter(s => s.facts.variantTimings?.some(v => v.id.includes('-proof-'))).map(s => ({case: s.id, width: s.facts.width, height: s.facts.height, viewIntervals: s.facts.viewIntervals, variants: s.facts.variantTimings.filter(v => v.id.includes('-proof-'))}));
	let serverClosed = false;
	try {await fetch('http://127.0.0.1:8103/flat32/', {signal: AbortSignal.timeout(1000)});} catch {serverClosed = true;}
	assert.ok(serverClosed, 'Owned asset server still listening');
	const priorRunStates = readdirSync(checked(output + '/runs')).filter(n => n !== run.path.split('/').at(-1)).map(n => {
		const manifest = JSON.parse(readFileSync(checked(output + '/runs/' + n + '/manifest.json'), 'utf8'));
		return {run: n, state: manifest.state};
	});
	run.write('verification.json', {accepted: true, verified, unchangedProductionParents: [...production].map(([path, sha256]) => ({path, sha256})), caseCount: results.sources.length, acceptance, directGpuChecks: results.gpuChecks, dayCount: daylight.length, nightCount: night.length, poseGainInvariantGroups, responseChecks, timings, frameTimes, process: {memory: process.memoryUsage(), resources: process.resourceUsage()}, serverClosed, priorRunStates,
		limitations: 'GPU variant milliseconds include command submission, blocking framebuffer readback and browser work, not isolated timer-query GPU cost. Samples are interleaved on the same retained physical scene; no full app interaction/FPS claim. CPU loops are Node microbenchmarks; candidate response can be computed once per changed illumination state and adds no image pass or physical cache. Peak memory is verifier process only, not Chrome capture peak.'});
	run.finish('accepted', {verifiedManifests: verified.length, caseCount: results.sources.length});
} catch (error) {run.write('failure.json', {error: String(error), stack: error.stack}); run.finish('failed', {error: String(error)}); process.exitCode = 1;}
