import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {checked, createRun, identity} from './io.mjs';
import {makeMask, rawDistribution, readLayer, render, summarize} from './metrics.mjs';
import {response} from './candidates.mjs';
import {gainAt} from './display.mjs';

const parent = process.argv[2];
const registry = JSON.parse(readFileSync(checked(parent + '/registered-campaign.json'), 'utf8'));
const capture = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8'));
const calibration = JSON.parse(readFileSync(checked(registry.calibrationPath + '/calibration.json'), 'utf8'));
const controls = JSON.parse(readFileSync(checked(parent + '/registered-controls.json'), 'utf8'));
const curve = controls.baseline.curve, guards = calibration.guards;
const cases = capture.cases.map(f => ({...f, source: parent}));
for (const reused of registry.reuse) {
	const facts = JSON.parse(readFileSync(checked(reused.source + '/' + reused.id + '.json'), 'utf8'));
	cases.push({...facts, id: reused.as, sourceId: reused.id, source: reused.source});
}
cases.sort((a, b) => a.id.localeCompare(b.id));
const run = createRun('regressions', 'Evaluate frozen M2 candidates on the complete M3 registry without tuning; retain all changes and direct GPU parity', [identity(parent + '/manifest.json'), identity(registry.calibrationPath + '/manifest.json'), identity(registry.screenPath + '/manifest.json'), identity(registry.baselinePath + '/manifest.json')]);
try {
	assert.equal(cases.length, registry.cases.length + registry.reuse.length);
	assert.ok(cases.every(c => c.parity.replayQualified), 'Unqualified HDR requires direct GPU evidence');
	run.write('registry.json', registry);
	const rows = [], gpuChecks = [], sources = [];
	for (const [index, facts] of cases.entries()) {
		run.progress('evaluate', facts.id, {completed: index, total: cases.length});
		const sourceId = facts.sourceId ?? facts.id, hdr = readLayer(facts.source, sourceId);
		const mask = makeMask(facts, guards), native = PNG.sync.read(readFileSync(checked(facts.source + '/' + sourceId + '-native.png')));
		run.write(facts.id + '-mask.u8', mask);
		run.write(facts.id + '-native.png', PNG.sync.write(native));
		const frozen = PNG.sync.read(readFileSync(checked(facts.source + '/' + sourceId + '-frozen30.png')));
		run.write(facts.id + '-frozen30.png', PNG.sync.write(frozen));
		const nativeMetrics = summarize(native, mask), frozenMetrics = summarize(frozen, mask);
		const variants = [];
		for (const candidate of registry.candidates) {
			const selected = response(candidate, facts.meterLux, {p90: 0, rms: 0}, curve, {height: facts.spec.height, mode: facts.spec.mode});
			const image = render(hdr, facts.width, facts.height, selected.gain, facts.toneMapK);
			const metrics = summarize(image, mask);
			let changed = 0, maximum = 0;
			for (let i = 0; i < image.data.length; i++) if (i % 4 !== 3) {const difference = Math.abs(image.data[i] - native.data[i]); maximum = Math.max(maximum, difference); if (difference > 2) changed++;}
			const row = {case: facts.id, candidate: candidate.id, source: facts.source, meterLux: facts.meterLux, nativeGain: facts.parity.gain, ...selected, metrics, native: nativeMetrics, frozen: frozenMetrics,
				nativeDifference: {maximumByteError: maximum, fractionAboveTwo: changed / (facts.width * facts.height * 3)}, lowerRelativeNative: nativeMetrics.lowerMedian ? metrics.lowerMedian / nativeMetrics.lowerMedian : null,
				lowerRelativeFrozen: frozenMetrics.lowerMedian ? metrics.lowerMedian / frozenMetrics.lowerMedian : null,
				daylight: facts.spec.time === 'noon', genuineNight: facts.spec.minutes === 180,
				nightSkyFluxRatio: null, nightSkyVisibleRatio: null, nightSourceFluxRatio: null, nightSourceVisibleRatio: null, twilightSource: null, flags: []};
			if (row.daylight && row.nativeDifference.fractionAboveTwo > .001) row.flags.push('daylight-change');
			if (row.genuineNight) {
				assert.ok(facts.sunElevationDegrees < -18);
				row.nightSkyFluxRatio = nativeMetrics.skySumY ? metrics.skySumY / nativeMetrics.skySumY : null;
				row.nightSkyVisibleRatio = nativeMetrics.skyVisiblePixels ? metrics.skyVisiblePixels / nativeMetrics.skyVisiblePixels : null;
				if (!(row.nightSkyFluxRatio >= .9 && row.nightSkyFluxRatio <= 1.1 && row.nightSkyVisibleRatio >= .9)) row.flags.push('night-sky-change');
				const stars = readLayer(facts.source, sourceId, 1);
				const nativeStars = summarize(render(stars, facts.width, facts.height, facts.parity.gain, facts.toneMapK), mask);
				const selectedStars = summarize(render(stars, facts.width, facts.height, selected.gain, facts.toneMapK), mask);
				row.nightSourceFluxRatio = nativeStars.skySumY ? selectedStars.skySumY / nativeStars.skySumY : null;
				row.nightSourceVisibleRatio = nativeStars.skyVisiblePixels ? selectedStars.skyVisiblePixels / nativeStars.skyVisiblePixels : null;
				if (!(row.nightSourceFluxRatio >= .9 && row.nightSourceFluxRatio <= 1.1 && row.nightSourceVisibleRatio >= .9)) row.flags.push('night-source-change');
			}
			if (!row.genuineNight && facts.spec.layers.includes(1)) {
				const stars = readLayer(facts.source, sourceId, 1);
				const nativeStars = summarize(render(stars, facts.width, facts.height, facts.parity.gain, facts.toneMapK), mask);
				const selectedStars = summarize(render(stars, facts.width, facts.height, selected.gain, facts.toneMapK), mask);
				row.twilightSource = {nativeVisiblePixels: nativeStars.skyVisiblePixels, visiblePixels: selectedStars.skyVisiblePixels, fluxRatio: nativeStars.skySumY ? selectedStars.skySumY / nativeStars.skySumY : null};
				if (nativeStars.skyVisiblePixels >= 5 && selectedStars.skyVisiblePixels === 0) row.flags.push('all-visible-twilight-stars-lost');
			}
			if (!row.daylight && !row.genuineNight && row.lowerRelativeNative !== null && row.lowerRelativeNative < .5) row.flags.push('inspect-darker-lower-scene');
			for (const timing of facts.variantTimings ?? []) if (timing.id.startsWith(candidate.id + '-proof-') || (candidate.gpuReferenceId && timing.id.startsWith(candidate.gpuReferenceId + '-proof-') && Math.abs(timing.effectiveLux - selected.effectiveLux) < 1e-10)) {
				const gpu = PNG.sync.read(readFileSync(checked(facts.source + '/' + sourceId + '-' + timing.id + '.png')));
				let max = 0, bad = 0;
				for (let i = 0; i < image.data.length; i++) if (i % 4 !== 3) {const error = Math.abs(image.data[i] - gpu.data[i]); max = Math.max(max, error); if (error > 1) bad++;}
				gpuChecks.push({case: facts.id, candidate: candidate.id, repeat: timing.id, maximumByteError: max, fractionAboveOne: bad / (facts.width * facts.height * 3), milliseconds: timing.milliseconds, qualified: bad / (facts.width * facts.height * 3) <= .001});
			}
			run.write(facts.id + '-' + candidate.id + '.png', PNG.sync.write(image)); rows.push(row); variants.push(row);
		}
		sources.push({id: facts.id, sourceId, source: facts.source, facts, distribution: rawDistribution(hdr, mask), native: nativeMetrics, frozen: frozenMetrics});
	}
	const anchors = rows.filter(r => r.daylight || r.genuineNight);
	const summary = registry.candidates.map(candidate => ({candidate: candidate.id, anchorFailures: anchors.filter(r => r.candidate === candidate.id && r.flags.length).map(r => ({case: r.case, flags: r.flags})), darkerCases: rows.filter(r => r.candidate === candidate.id && r.flags.includes('inspect-darker-lower-scene')).map(r => r.case)}));
	run.write('results.json', {parent, registry, sources, rows, gpuChecks, summary});
	run.write('summary.csv', 'case,candidate,meterLux,nativeGain,gain,nativeBandWhite,bandWhite,bandContrast,bandChroma,lowerMedian,lowerRelativeNative,lowerRelativeFrozen,flags\n' + rows.map(r => [r.case, r.candidate, r.meterLux, r.nativeGain, r.gain, r.native.bandWhiteFraction, r.metrics.bandWhiteFraction, r.metrics.bandContrast, r.metrics.bandMeanChroma, r.metrics.lowerMedian, r.lowerRelativeNative, r.lowerRelativeFrozen, r.flags.join('|')].join(',')).join('\n') + '\n');
	run.write('comparison.html', '<meta charset="utf-8"><title>Twilight regression comparisons</title><style>body{background:#171b22;color:#eee;font:16px sans-serif}.row{display:flex;overflow:auto}figure{margin:4px;min-width:360px}img{width:360px}table{border-collapse:collapse}td,th{padding:4px 12px;border:1px solid #666}</style><h1>Frozen curve candidates — M3</h1><p>Native / fixed +30 gain / half lift / matched lift. Physical optics, pose and FOV match within each row. Exact metrics: <a href="summary.csv">CSV</a>.</p>' + sources.map(s => '<section><h2>' + s.id + '</h2><p>' + s.facts.state.locationLabel + ' / ' + s.facts.state.modeKind + ' / ' + s.facts.state.observation.instant + ' / ' + s.facts.spec.height + ' m / ' + s.facts.camera.fov + '° / E=' + s.facts.meterLux + ' lux</p><div class="row">' + ['native', 'frozen30', ...registry.candidates.map(c => c.id)].map(id => `<figure><figcaption>${id}</figcaption><a href="${s.id}-${id}.png"><img loading="lazy" src="${s.id}-${id}.png"></a></figure>`).join('') + '</div><table><tr><th>Response</th><th>Gain</th><th>White band</th><th>Lower median</th></tr>' + rows.filter(r => r.case === s.id).map(r => `<tr><td>${r.candidate}</td><td>${r.gain.toFixed(3)}</td><td>${r.metrics.bandWhiteFraction === null ? 'no band in view' : (100 * r.metrics.bandWhiteFraction).toFixed(2) + '%'}</td><td>${r.metrics.lowerMedian.toFixed(4)}</td></tr>`).join('') + '</table></section>').join(''));
	assert.ok(gpuChecks.length > 0 && gpuChecks.every(c => c.qualified), 'Direct GPU candidate parity failed');
	run.finish('accepted', {caseCount: cases.length, summary, directGpuChecks: gpuChecks.length});
} catch (error) {run.write('failure.json', {error: String(error), stack: error.stack}); run.finish('failed', {error: String(error)}); process.exitCode = 1;}
