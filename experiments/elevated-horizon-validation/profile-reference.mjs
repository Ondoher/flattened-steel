import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdirSync} from 'node:fs';
import {createRun, identity, checked, command, source, root} from './io.mjs';
import {physical, channels, bundle} from './physics.mjs';
import {optical, recipe, profileNames, acquisition} from './profile-model.mjs';
import {readCdf, writeCdf} from './profile-cdf.mjs';

const mode = process.argv[2] ?? 'pilot';
assert.ok(['pilot', 'screen', 'fine', 'confirm', 'controls', 'glow', 'humidity'].includes(mode));
const requested = process.argv[3]?.split(',') ?? (mode === 'pilot' ? ['continental_clean'] : profileNames);
assert.ok(requested.every((n) => [...profileNames, 'bruneton', 'molecular'].includes(n)));
const run = createRun('opac-' + mode, 'Published OPAC-derived preset radiance; fixed molecular/source/surface physics, 5 m and 10 km.', [
	identity(acquisition + '/manifest.json'), identity('scripts/libradtran/installation.json'),
	...requested.filter((n) => profileNames.includes(n)).map((n) => recipe(n).parent),
]);
const readings = [];
let failure;
try {
	const configs = [];
	const heights = mode === 'pilot' ? [10000] : mode === 'glow' ? [500] : [5, 10000];
	for (const name of requested) for (const altitude of heights) {
		const medium = {...physical(), observerAltitude: altitude};
		const horizon = -Math.acos(medium.radius / (medium.radius + altitude)) * 180 / Math.PI;
		const offsets = ['pilot', 'fine', 'humidity', 'confirm'].includes(mode) ? [-.1, .1] : [-1, -.1, -.02, .02, .1, 1];
		const directions = mode === 'glow' ? [1, 3, 10].map((separation) => ({elevation: 90 - medium.zenithDegrees + separation, azimuth: 0, separation, offset: undefined}))
			: offsets.map((offset) => ({elevation: horizon + offset, azimuth: 180, offset, separation: undefined}));
		for (const direction of directions) for (let repeat = 0; repeat < (mode === 'pilot' ? 1 : 3); repeat++) {
			configs.push({name, altitude, ...direction, repeat: repeat + (mode === 'confirm' ? 3 : 0),
				id: `${name}-${altitude}-${direction.offset ?? direction.separation}-${repeat}`,
				humidity: mode === 'humidity' ? 80 : 50, order: mode === 'fine' ? 4 : mode === 'pilot' ? 1 : 2,
				layers: mode === 'fine' ? 512 : 256, photons: mode === 'pilot' ? 10000 : mode === 'glow' ? 500000 : 100000,
				channels: mode === 'pilot' ? [2, 6, 9] : channels.map((_, i) => i), vroomOff: true, epsilon: 1});
		}
	}
	run.write('registration.json', {configs, baseline: physical(),
		interpretation: 'Published libRadtran OPAC-derived mass presets. Exact scalar F11 and humidity slices of official optical data; no fitted phase/vertical shape. Baseline molecular/native-bin source retained. Gaussian spectral quadrature is radiance-density sampling, not monochromatic values relabelled as bin energies.',
		phaseCaution: 'The compressed published direct angular tables have finite representation error; no new physical angular detail is invented.'});
	for (const [index, config] of configs.entries()) {
		run.progress('solver', config.id, {completed: index, total: configs.length});
		const medium = {...physical(), observerAltitude: config.altitude};
		if (config.name === 'molecular') medium.mie = medium.mie.map(() => 0);
		const exported = bundle(medium, config), files = exported.files;
		const gaussian = config.order === 1 ? [[0, 1]] : config.order === 2 ? [[-1 / Math.sqrt(3), .5], [1 / Math.sqrt(3), .5]]
			: [[-.8611363115940526, .1739274225687269], [-.3399810435848563, .3260725774312731], [.3399810435848563, .3260725774312731], [.8611363115940526, .1739274225687269]];
		const samples = config.channels.flatMap((c) => gaussian.map(([x, weight]) => ({c, wavelength: channels[c].center.value + x * channels[c].width.value / 2, weight})));
		const z = exported.proof.levels;
		files.set('wavelengths.txt', samples.map((s) => s.wavelength).join('\n') + '\n');
		files.set('solar.txt', samples.map((s) => `${s.wavelength} ${medium.sourceIrradiance[s.c] * 1000}`).join('\n') + '\n');
		files.set('scattering.txt', [z.map((x) => x / 1000).join(' '), ...samples.map((s) => [s.wavelength, ...z.slice(1).map((lower, i) => medium.rayleigh[s.c] * medium.rayleighHeight * (Math.exp(-lower / medium.rayleighHeight) - Math.exp(-z[i] / medium.rayleighHeight)))].join(' '))].join('\n') + '\n');
		files.set('absorption.txt', [z.map((x) => x / 1000).join(' '), ...samples.map((s) => [s.wavelength, ...z.slice(1).map(() => 0)].join(' '))].join('\n') + '\n');
		let deck = String(files.get('input.inp'));
		const proofs = [];
		if (profileNames.includes(config.name)) {
			const r = recipe(config.name);
			files.delete('toronto.material.cdf');
			files.set('species.txt', r.text);
			deck = deck.replace('aerosol_species_file species.txt toronto', 'aerosol_species_file species.txt ' + r.species.join(' '));
			for (const s of r.species) { const table = optical(s, config.humidity); files.set(s + '.mie.cdf', table.bytes); proofs.push(table.proof); }
		} else {
			const original = readCdf(files.get('toronto.material.cdf'));
			const count = original.value('ntheta', 1, 0, 0);
			const padded = [samples[0], ...samples, samples.at(-1)], nlam = padded.length;
			const base = physical();
			files.set('toronto.material.cdf', writeCdf({nlam, nhum: 1, nphamat: 1, nmommax: 1, nthetamax: count}, [
				{name: 'wavelen', dims: ['nlam'], type: 6, values: [samples[0].wavelength - .001, ...samples.map((s) => s.wavelength), samples.at(-1).wavelength + .001].map((w) => w / 1000)},
				{name: 'hum', dims: ['nhum'], type: 6, values: [0]},
				{name: 'ext', dims: ['nlam', 'nhum'], type: 6, values: padded.map((s) => base.mie[s.c] * 1000)},
				{name: 'ssa', dims: ['nlam', 'nhum'], type: 6, values: padded.map(() => medium.albedo)},
				{name: 'nmom', dims: ['nlam', 'nhum'], type: 4, values: padded.map(() => 0)},
				{name: 'ntheta', dims: ['nlam', 'nhum', 'nphamat'], type: 4, values: padded.map(() => count)},
				{name: 'theta', dims: ['nlam', 'nhum', 'nphamat', 'nthetamax'], type: 5, values: padded.flatMap(() => Array.from({length: count}, (_, j) => original.value('theta', 1, 0, 0, j)))},
				{name: 'phase', dims: ['nlam', 'nhum', 'nphamat', 'nthetamax'], type: 5, values: padded.flatMap(() => Array.from({length: count}, (_, j) => original.value('phase', 1, 0, 0, j)))},
			]));
			proofs.push({operation: 'Baseline native-bin extinction evaluated exactly at every quadrature node; no cross-bin coefficient interpolation. Analytic CS table unchanged; molecular-only uses zero species density.'});
		}
		files.set('input.inp', deck);
		files.set('case.json', JSON.stringify({purpose: 'Published alternate-profile horizon comparison; not a production promotion.',
			geometry: `Fully spherical, observer ${config.altitude} m, source parallel, view ${config.elevation} degrees elevation, azimuth ${config.azimuth}`,
			quantity: 'Diffuse directional spectral radiance, all scattering orders', units: 'Raw mW per nm per sr; readings divide by 1000 to W.',
			limitations: ['Black-ground feedback, scalar transport, no refraction or gas absorption.', 'Mass presets are explicitly OPAC-derived libRadtran variants, not exact OPAC original number profiles.', 'Native15 molecular/source values piecewise constant by bin; candidate optics use published wavelength tables.'], config, proofs}));
		const relative = 'cases/' + config.id, directory = run.path + '/' + relative;
		mkdirSync(root + '/' + directory, {recursive: true});
		for (const [name, bytes] of files) run.write(relative + '/' + name, bytes);
		run.write('proof-' + config.id + '.json', {config, samples, exported: exported.proof, optical: proofs});
		mkdirSync(run.absolute + '/tools', {recursive: true});
		const before = new Set(readdirSync(checked(run.path + '/tools')));
		const result = await command(run, config.id, [source + '/cli.js', 'run', '--case', checked(directory), '--timeout-seconds', '1200'], {HORIZON_TOOL_PARENT: run.absolute});
		assert.equal(result.code, 0, result.stdout + result.stderr);
		const child = readdirSync(checked(run.path + '/tools')).find((n) => !before.has(n)); assert.ok(child);
		const tool = run.path + '/tools/' + child;
		const manifest = JSON.parse(readFileSync(checked(tool + '/manifest.json'), 'utf8')); assert.equal(manifest.status, 'succeeded');
		const raw = readFileSync(checked(tool + '/execution/mc.rad.spc'), 'utf8');
		const rows = raw.trim().split(/\r?\n/u).map((line) => line.trim().split(/\s+/u).map(Number));
		assert.equal(rows.length, samples.length);
		const values = rows.map((row, i) => { assert.ok(Math.abs(row[0] - samples[i].wavelength) < .002 && Number.isFinite(row.at(-1)) && row.at(-1) >= 0); return row.at(-1) / 1000; });
		const spectrum = config.channels.map((c) => samples.reduce((sum, s, i) => sum + (s.c === c ? s.weight * values[i] : 0), 0));
		const reading = {config, tool, samples, values, spectrum, seconds: result.seconds};
		readings.push(reading); run.write('reading-' + config.id + '.json', reading);
		console.log(JSON.stringify({id: config.id, seconds: result.seconds, spectrum}));
	}
	run.write('readings.json', readings);
} catch (error) { failure = String(error); }
run.finish(failure ? 'failed' : 'accepted', {failure, cases: readings.length});
if (failure) throw new Error(failure);
