import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PNG} from 'pngjs';
import {checked, createRun, identity} from './io.mjs';
import {gainAt} from './display.mjs';
import {makeMask, rawDistribution, readLayer, render, summarize} from './metrics.mjs';
const parent = process.argv[2]; assert.ok(parent);
const manifest = JSON.parse(readFileSync(checked(parent + '/manifest.json'), 'utf8')); assert.equal(manifest.state, 'accepted');
const data = JSON.parse(readFileSync(checked(parent + '/results.json'), 'utf8')), controls = JSON.parse(readFileSync(checked(parent + '/registered-controls.json'), 'utf8'));
const run = createRun('calibrate', 'Register geometric masks, baseline/frozen controls and guard criteria before evaluating candidates', [identity(parent + '/manifest.json')]);
try {
	const guards = {bandHalfWidthDegrees: 3, sunGuardDegrees: .6, whiteThresholdByte: 250, pilotMinimumWhiteReduction: .5, pilotMinimumLowerBrightnessRelativeFrozen: .5, pilotMinimumContrastRelativeFrozen: .5, pilotMinimumChromaRelativeFrozen: .5, nightSourceFluxRelative: [.9, 1.1], daylightMaximumByteDifference: 2, daylightMinimumMatchedFraction: .999, note: 'These are comparison guards, not measured appearance ground truth. Frozen exposure is a diagnostic, not ideal exposure.'};
	run.write('guards.json', guards); const rows = [], frozenLux = data.cases.find(c => c.id === 'sj40-p30').meterLux, frozenGain = gainAt(frozenLux, controls.baseline.curve);
	for (const facts of data.cases) {
		const hdr = readLayer(parent, facts.id), mask = makeMask(facts, guards), gain = gainAt(facts.meterLux, controls.baseline.curve);
		const native = PNG.sync.read(readFileSync(checked(parent + '/' + facts.id + '-native.png'))), frozen = PNG.sync.read(readFileSync(checked(parent + '/' + facts.id + '-frozen30.png')));
		run.write(facts.id + '-mask.u8', mask); run.write(facts.id + '-native.png', PNG.sync.write(native)); run.write(facts.id + '-frozen30.png', PNG.sync.write(frozen));
		rows.push({id: facts.id, meterLux: facts.meterLux, gain, frozenGain, native: summarize(native, mask), frozen: summarize(frozen, mask), raw: rawDistribution(hdr, mask), hdrReplayQualified: facts.parity.replayQualified});
	}
	run.write('calibration.json', {parent, guards, frozenLux, frozenGain, cases: rows});
	run.write('comparison.html', '<meta charset="utf-8"><title>Twilight exposure baseline</title><style>body{background:#171b22;color:white;font:16px sans-serif}section{margin:32px auto;max-width:1600px}.pair{display:flex}figure{margin:4px;width:50%}img{width:100%}</style>' + rows.map(row => `<section><h2>${row.id}</h2><div class="pair"><figure><figcaption>Production exposure</figcaption><img src="${row.id}-native.png"></figure><figure><figcaption>Exposure held at +30 minutes</figcaption><img src="${row.id}-frozen30.png"></figure></div></section>`).join(''));
	run.finish('accepted', {caseCount: rows.length, frozenGain, pilot50: rows.find(r => r.id === 'sj40-p50')});
} catch (error) {run.write('failure.json', {error: String(error)}); run.finish('failed', {error: String(error)}); process.exitCode = 1;}
