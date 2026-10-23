import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdirSync} from 'node:fs';
import {createRun, identity, checked, command, source, root} from './io.mjs';
import {physical, channels, ray, bundle} from './physics.mjs';

const fine = process.argv[2] === 'fine';
const run = createRun(
	fine ? 'high-ref-fine' : 'high-reference',
	'Fully spherical independent high-altitude horizon spectra, production Native15 bin inputs, black ground.',
	[
		identity('scripts/libradtran/installation.json'),
		identity('experiments/sky-accuracy-dials/distant-horizon/toronto-direct.mjs'),
	],
);
const readings = [];
let failure;
try {
	const configs = [];
	for (const altitude of [30000, 40000]) {
		const m = {...physical(), observerAltitude: altitude};
		const limb = (-Math.acos(m.radius / (m.radius + altitude)) * 180) / Math.PI;
		for (const offset of fine ? [-0.1, 0.1] : [-1, -0.1, -0.02, 0.02, 0.1, 1])
			for (let repeat = 0; repeat < 3; repeat++)
				configs.push({
					altitude,
					offset,
					elevation: limb + offset,
					id: altitude + '-' + offset + '-' + repeat,
					repeat,
					channels: channels.map((_, i) => i),
					layers: fine ? 512 : 256,
					epsilon: 1,
					vroomOff: true,
					photons: fine ? 200000 : 100000,
					azimuth: 180,
				});
	}
	run.write('registration.json', {
		configs,
		medium: physical(),
		interpretation:
			'Fully spherical MYSTIC all orders. Native bin-average coefficients and source are piecewise constant; sample labels identify those bins. Compare against N4 with truncation caveat. No measured atmosphere assertion.',
	});
	for (const [i, config] of configs.entries()) {
		run.progress('solver', config.id, {completed: i, total: configs.length});
		const m = {...physical(), observerAltitude: config.altitude};
		const exported = bundle(m, config),
			relative = 'cases/' + config.id,
			directory = run.path + '/' + relative;
		mkdirSync(root + '/' + directory, {recursive: true});
		for (const [name, bytes] of exported.files) run.write(relative + '/' + name, bytes);
		run.write('proof-' + config.id + '.json', exported.proof);
		mkdirSync(run.absolute + '/tools', {recursive: true});
		const before = new Set(readdirSync(checked(run.path + '/tools')));
		const result = await command(
			run,
			config.id,
			[source + '/cli.js', 'run', '--case', checked(directory), '--timeout-seconds', '1200'],
			{HORIZON_TOOL_PARENT: run.absolute},
		);
		assert.equal(result.code, 0, result.stdout + result.stderr);
		const child = readdirSync(checked(run.path + '/tools')).find((n) => !before.has(n));
		assert.ok(child);
		const tool = run.path + '/tools/' + child,
			manifest = JSON.parse(readFileSync(checked(tool + '/manifest.json'), 'utf8'));
		assert.equal(manifest.status, 'succeeded');
		const rows = readFileSync(checked(tool + '/execution/mc.rad.spc'), 'utf8')
			.trim()
			.split(/\r?\n/u)
			.map((s) => s.trim().split(/\s+/u).map(Number));
		assert.equal(rows.length, 15);
		const spectrum = rows.map((r, c) => {
			assert.ok(Math.abs(r[0] - channels[c].center.value) < 0.002);
			assert.ok(Number.isFinite(r.at(-1)) && r.at(-1) >= 0);
			return r.at(-1) / 1000;
		});
		const reading = {
			config,
			tool,
			spectrum,
			seconds: result.seconds,
			geometry: ray(config.elevation, config.altitude),
		};
		readings.push(reading);
		run.write('reading-' + config.id + '.json', reading);
		console.log(JSON.stringify({id: config.id, completed: i + 1, total: configs.length}));
	}
	run.write('readings.json', readings);
} catch (e) {
	failure = String(e);
}
run.finish(failure ? 'failed' : 'accepted', {failure, cases: readings.length});
if (failure) throw new Error(failure);
