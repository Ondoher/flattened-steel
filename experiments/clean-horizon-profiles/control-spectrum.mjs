import assert from 'node:assert/strict';
import {mkdirSync, readdirSync, readFileSync} from 'node:fs';
import {createRun, checked, identity, command, source} from './io.mjs';
import {physical, bundle, channels} from '../elevated-horizon-validation/physics.mjs';

const run = createRun('control-spectrum', 'M1 native15 baseline/molecular-only color opportunity; three fixed pilot replicates', [
	identity('experiments/elevated-horizon-validation/physics.mjs'),
	identity('scripts/libradtran/installation.json'),
	identity('tmp/experiments/clean-horizon-profiles/runs/00004-control-pilot/manifest.json'),
]);
const configs = [];
for (const height of [5, 500]) for (const model of ['bruneton', 'molecular']) for (const delta of [-0.1, 0.1]) for (let repeat = 0; repeat < 3; repeat++) {
	const horizon = -Math.acos(6360000 / (6360000 + height)) * 180 / Math.PI;
	configs.push({id: `${model}-${height}-${delta < 0 ? 'below' : 'above'}-${repeat}`, height, model, delta,
		elevation: horizon + delta, channels: Array.from({length: 15}, (_, i) => i),
		layers: 256, repeat, vroomOff: true, epsilon: 1, photons: 100000, surfaceAlbedo: 0, azimuth: 180});
}
run.write('registration.json', {configs, meaning: 'Fixed three-replicate opportunity pilot, not a finalist confirmation or finite-pixel sharpness ranking. Native15 bin-center physics; black-ground all-order fully spherical scalar MYSTIC; fixed noon source. Two sampled rays per height, not a continuous sky or app scene.'});
const readings = [];
let failure;
try {
	for (const [index, config] of configs.entries()) {
		run.progress('solver', config.id, {completed: index, total: configs.length});
		const medium = {...physical(), observerAltitude: config.height};
		if (config.model === 'molecular') medium.mie = medium.mie.map(() => 0);
		const exported = bundle(medium, config), relative = 'cases/' + config.id;
		// Evaluate at native-bin centers, with no wavelength spline introducing extra points.
		exported.files.set('input.inp', String(exported.files.get('input.inp')).replace(/^spline_file .*\r?\n/mu, ''));
		mkdirSync(run.absolute + '/' + relative, {recursive: true});
		for (const [name, bytes] of exported.files) run.write(relative + '/' + name, bytes);
		run.write('proof-' + config.id + '.json', exported.proof);
		mkdirSync(run.absolute + '/tools', {recursive: true});
		const before = new Set(readdirSync(run.absolute + '/tools'));
		const result = await command(run, config.id, [source + '/cli.js', 'run', '--case', checked(run.path + '/' + relative), '--timeout-seconds', '1200'], {HORIZON_TOOL_PARENT: run.absolute});
		assert.equal(result.code, 0, result.stdout + result.stderr);
		const child = readdirSync(run.absolute + '/tools').find(n => !before.has(n)); assert.ok(child);
		const tool = run.path + '/tools/' + child;
		const rows = readFileSync(checked(tool + '/execution/mc.rad.spc'), 'utf8').trim().split(/\r?\n/u).map(line => line.trim().split(/\s+/u).map(Number));
		assert.equal(rows.length, 15);
		const spectrum = rows.map((row, c) => {
			assert.ok(Math.abs(row[0] - channels[c].center.value) < 0.002 && Number.isFinite(row.at(-1)) && row.at(-1) >= 0);
			return row.at(-1) / 1000;
		});
		const item = {config, spectrum, tool, seconds: result.seconds};
		readings.push(item); run.write('reading-' + config.id + '.json', item);
		console.log(JSON.stringify({id: config.id, seconds: result.seconds}));
	}
	run.write('readings.json', readings);
} catch (error) { failure = String(error); run.write('failure.json', {message: failure}); }
run.finish(failure ? 'failed' : 'accepted', {cases: readings.length, failure});
if (failure) process.exitCode = 1;
