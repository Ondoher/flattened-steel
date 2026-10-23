import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {checked, createRun, identity} from './io.mjs';
import {readLayer, rawDistribution, render, summarize} from './metrics.mjs';
import {response} from './candidates.mjs';

const calibrationPath = process.argv[2];
const calibration = JSON.parse(readFileSync(checked(calibrationPath + '/calibration.json'), 'utf8'));
const parent = calibration.parent, original = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8'));
const controls = JSON.parse(readFileSync(checked(parent + '/registered-controls.json'), 'utf8')), curve = controls.baseline.curve;
const run = createRun('curve-screen', 'Register and screen isolated exposure-response candidates on qualified identical HDR images', [identity(calibrationPath + '/manifest.json'), identity(parent + '/manifest.json')]);
try {
	assert.ok(original.cases.every(c => c.parity.replayQualified), 'Unqualified inputs require direct GPU candidates, not offline images');
	const minimum = Math.min(...original.cases.filter(c => c.id.includes('-p')).map(c => c.meterLux).filter(x => x > 0));
	const shift = calibration.frozenLux - minimum, common = {taperStartLux: calibration.frozenLux * 4, taperEndLux: curve.adaptationPivotIlluminanceLux};
	const candidates = [
		...[[.5, 'curve-half'], [1, 'curve-match'], [2, 'curve-double']].map(([factor, id]) => ({id, kind: 'curve-lift', liftLux: Number(factor) * shift, activationLux: minimum / 100, ...common})),
		{id: 'meter-p90', kind: 'view-meter', statistic: 'p90', ...common},
		{id: 'meter-rms', kind: 'view-meter', statistic: 'rms', ...common},
		{id: 'shoulder', kind: 'highlight-shoulder'},
	];
	run.write('registered-candidates.json', {candidates, rationale: 'Curve lift scale is the measured p30-minus-p50 illuminance separation; activation is two decades below the faintest positive primary twilight input; daytime taper ends at the existing p2 pivot. Field meters use the same low-light window and exclude stellar/Sun direct radiance through the atmosphere-only layer. Highlight shoulder is isolated at native gain.'});
	const continuity = [];
	for (const candidate of candidates) {
		let previous = 0, valid = true, maximumGain = 0; const points = [];
		for (let i = 0; i <= 2400; i++) {
			const lux = i === 0 ? 0 : 10 ** (-12 + (i - 1) * 19 / 2399), value = response(candidate, lux, {p90: 0, rms: 0}, curve).gain, brightness = lux * value;
			valid &&= Number.isFinite(value) && value > 0 && brightness >= previous - 1e-8 * Math.max(1, previous); previous = brightness; maximumGain = Math.max(maximumGain, value);
			points.push({lux, gain: value, brightness});
		}
		continuity.push({id: candidate.id, valid, maximumGain}); run.write(candidate.id + '-curve.json', points);
	}
	run.write('continuity.json', continuity); const rows = [], full = [];
	for (const [index, facts] of original.cases.entries()) {
		run.progress('screen', facts.id, {completed: index, total: original.cases.length});
		const hdr = readLayer(parent, facts.id), mask = readFileSync(checked(calibrationPath + '/' + facts.id + '-mask.u8'));
		const distribution = facts.spec.layers.includes(2) ? rawDistribution(readLayer(parent, facts.id, 2), mask) : {p90: 0, rms: 0};
		const baseline = PNG.sync.read(readFileSync(checked(parent + '/' + facts.id + '-native.png')));
		run.write(facts.id + '-native.png', PNG.sync.write(baseline));
		run.write(facts.id + '-frozen30.png', readFileSync(checked(parent + '/' + facts.id + '-frozen30.png')));
		for (const candidate of candidates) {
			const selected = response(candidate, facts.meterLux, distribution, curve), image = render(hdr, facts.width, facts.height, selected.gain, facts.toneMapK, selected.shoulder);
			const metrics = summarize(image, mask); let mismatched = 0, maximum = 0;
			for (let i = 0; i < image.data.length; i++) if (i % 4 !== 3) {const d = Math.abs(image.data[i] - baseline.data[i]); maximum = Math.max(maximum, d); if (d > 2) mismatched++;}
			const row = {case: facts.id, candidate: candidate.id, ...selected, metrics, nativeDifference: {maximumByteError: maximum, fractionAboveTwo: mismatched / (facts.width * facts.height * 3)}};
			rows.push(row); run.write(facts.id + '-' + candidate.id + '.png', PNG.sync.write(image));
		}
		full.push({facts, atmosphereDistribution: distribution});
	}
	const verdicts = [];
	for (const candidate of candidates) {
		const criteria = {response: continuity.find(x => x.id === candidate.id).valid};
		for (const id of ['sj40-p30', 'sj40-p40', 'sj40-p50']) {
			const row = rows.find(r => r.case === id && r.candidate === candidate.id), control = calibration.cases.find(c => c.id === id);
			criteria[id + '-lower'] = row.metrics.lowerMedian >= control.frozen.lowerMedian * .5;
			criteria[id + '-contrast'] = row.metrics.bandContrast >= control.frozen.bandContrast * .5;
			criteria[id + '-chroma'] = row.metrics.bandMeanChroma >= control.frozen.bandMeanChroma * .5;
			if (id === 'sj40-p50') criteria.clipping = row.metrics.bandWhiteFraction <= control.native.bandWhiteFraction * .5;
		}
		const day = rows.find(r => r.case === 'sj40-day' && r.candidate === candidate.id), night = rows.find(r => r.case === 'sj40-night' && r.candidate === candidate.id), nativeNight = calibration.cases.find(c => c.id === 'sj40-night').native;
		criteria.daylight = day.nativeDifference.fractionAboveTwo <= .001;
		criteria.nightStars = nativeNight.skySumY > 0 && night.metrics.skySumY / nativeNight.skySumY >= .9 && night.metrics.skySumY / nativeNight.skySumY <= 1.1 && night.metrics.skyVisiblePixels / nativeNight.skyVisiblePixels >= .9;
		verdicts.push({id: candidate.id, advance: Object.values(criteria).every(Boolean), criteria});
	}
	run.write('results.json', {accepted: true, parent, calibrationPath, candidates, inputs: full, rows, verdicts});
	run.write('summary.csv', 'case,candidate,gain,bandWhiteFraction,bandContrast,bandMeanChroma,lowerMedian,skySumY\n' + rows.map(r => [r.case, r.candidate, r.gain, r.metrics.bandWhiteFraction, r.metrics.bandContrast, r.metrics.bandMeanChroma, r.metrics.lowerMedian, r.metrics.skySumY].join(',')).join('\n') + '\n');
	run.write('comparison.html', '<meta charset="utf-8"><title>Twilight candidate screen</title><style>body{background:#171b22;color:white;font:16px sans-serif}.row{display:flex;overflow:auto}figure{margin:4px;min-width:480px}img{width:480px}</style>' + original.cases.map(c => '<section><h2>' + c.id + '</h2><div class="row">' + ['native', 'frozen30', ...candidates.map(x => x.id)].map(id => `<figure><figcaption>${id}</figcaption><a href="${c.id}-${id}.png"><img src="${c.id}-${id}.png"></a></figure>`).join('') + '</div></section>').join(''));
	run.finish('accepted', {verdicts});
} catch (error) {run.write('failure.json', {error: String(error)}); run.finish('failed', {error: String(error)}); process.exitCode = 1;}
