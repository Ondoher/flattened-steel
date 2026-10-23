import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdirSync} from 'node:fs';
import {createRun, identity, checked, command, source, root} from './io.mjs';
import {physical, channels, capturePath, ray, directTransmission, bundle} from './physics.mjs';

const mode = process.argv[2] ?? 'pilot';
assert.ok(['pilot', 'full', 'confirm', 'fine', 'aerosol50', 'aerosol0', 'glow', 'geometry'].includes(mode));
const run = createRun(
	'ref-' + mode,
	'Matched 10 km fully spherical MYSTIC anti-solar horizon; inspect both sky and ground rays.',
	[
		identity(capturePath),
		identity('scripts/libradtran/installation.json'),
		identity('experiments/sky-accuracy-dials/distant-horizon/toronto-direct.mjs'),
		identity('experiments/sky-accuracy-dials/distant-horizon/aerosol-reference.mjs'),
	],
);
let failure;
const readings = [];
try {
	const medium = physical();
	if (mode === 'geometry') {
		medium.rayleigh = medium.rayleigh.map(() => 0);
		medium.mie = medium.mie.map(() => 0);
	}
	if (mode === 'aerosol50' || mode === 'aerosol0')
		medium.mie = medium.mie.map((x) => x * (mode === 'aerosol50' ? 0.5 : 0));
	const horizon = (-Math.acos(medium.radius / (medium.radius + medium.observerAltitude)) * 180) / Math.PI;
	const profileControl = ['aerosol50', 'aerosol0'].includes(mode);
	const offsets =
		mode === 'glow'
			? []
			: ['pilot', 'fine', 'geometry'].includes(mode) || profileControl
				? [-0.1, 0.1]
				: [-1, -0.1, -0.02, 0.02, 0.1, 1];
	const elevations = [
		...offsets.map((x) => horizon + x),
		...(['pilot', 'fine', 'geometry'].includes(mode)
			? []
			: profileControl || mode === 'glow'
				? [89 - medium.zenithDegrees]
				: [0, 20]),
	];
	const selected = ['geometry', 'pilot'].includes(mode) ? [2, 6, 9] : channels.map((_, i) => i);
	const configs = elevations.flatMap((elevation, i) =>
		Array.from({length: ['pilot', 'geometry'].includes(mode) ? 1 : 3}, (_, repeat) => ({
			id: `${mode}-${i}-${repeat}`,
			elevation,
			channels: selected,
			layers: mode === 'fine' ? 512 : 256,
			repeat: repeat + (mode === 'confirm' ? 3 : 0),
			epsilon: 1,
			vroomOff: true,
			photons: mode === 'geometry' ? 1000 : mode === 'pilot' ? 20000 : 100000,
			surfaceAlbedo: mode === 'geometry' ? 1 : 0,
			azimuth: (profileControl || mode === 'glow') && i === elevations.length - 1 ? 0 : 180,
		})),
	);
	run.write('registration.json', {
		medium,
		horizon,
		configs,
		semantics:
			'Native15 piecewise constant bin-average optical/source model; monochromatic labels index independent per-bin density, integrate with bin/CIE weights.',
		interpretationThresholds: {contrast: 0.03, luminanceRelative: 0.05},
	});
	run.write(
		'direct-paths.json',
		elevations.map((e) => {
			const view = ray(e);
			return {...view, fine: directTransmission(medium, view), coarse: directTransmission(medium, view, 16384)};
		}),
	);
	for (const [index, config] of configs.entries()) {
		run.progress('solver', config.id, {completed: index, total: configs.length});
		const exported = bundle(medium, config),
			directory = run.path + '/cases/' + config.id;
		mkdirSync(root + '/' + directory, {recursive: true});
		for (const [name, bytes] of exported.files) run.write('cases/' + config.id + '/' + name, bytes);
		run.write('input-proof-' + config.id + '.json', exported.proof);
		mkdirSync(run.absolute + '/tools', {recursive: true});
		const before = new Set(readdirSync(checked(run.path + '/tools')).filter(Boolean));
		const result = await command(
			run,
			config.id,
			[source + '/cli.js', 'run', '--case', checked(directory), '--timeout-seconds', '1200'],
			{HORIZON_TOOL_PARENT: run.absolute},
		);
		assert.equal(result.code, 0, result.stdout + result.stderr);
		const child = readdirSync(checked(run.path + '/tools')).find((n) => !before.has(n));
		assert.ok(child);
		const tool = run.path + '/tools/' + child;
		const manifest = JSON.parse(readFileSync(checked(tool + '/manifest.json'), 'utf8'));
		assert.equal(manifest.status, 'succeeded');
		const raw = readFileSync(checked(tool + '/execution/mc.rad.spc'), 'utf8');
		const rows = raw
			.trim()
			.split(/\r?\n/u)
			.map((s) => s.trim().split(/\s+/u).map(Number));
		assert.equal(rows.length, selected.length);
		const spectrum = rows.map((r, i) => {
			assert.ok(Math.abs(r[0] - channels[selected[i]].center.value) < 0.002);
			assert.ok(Number.isFinite(r.at(-1)) && r.at(-1) >= 0);
			return r.at(-1) / 1000;
		});
		const reading = {
			config,
			tool,
			spectrum,
			seconds: result.seconds,
			geometry: {...ray(config.elevation), azimuth: config.azimuth},
		};
		readings.push(reading);
		run.write('reading-' + config.id + '.json', reading);
		console.log(JSON.stringify({id: config.id, seconds: result.seconds, spectrum}));
	}
	run.write('readings.json', readings);
} catch (error) {
	failure = String(error);
}
run.finish(failure ? 'failed' : 'accepted', {failure, cases: readings.length});
if (failure) throw new Error(failure);
