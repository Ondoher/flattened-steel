import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRun, checked, identity, output, command, source} from './io.mjs';
import {physical, channels, ray} from './physics.mjs';
import {optical, recipe, profileNames, inventory, baselineInventory} from './profile-model.mjs';
import {sampledColor} from './alternate-report.mjs';
import {colorimetry} from '../sky-accuracy-dials/horizon/diagnosis-color.mjs';
import {readCdf} from './profile-cdf.mjs';

const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const finalReport = process.argv[2];
assert.ok(finalReport?.startsWith(output + '/runs/'));
const runs = output + '/runs/';
const names = [
	'00022-profile-acquire',
	'00023-profile-acquire',
	'00024-opac-inventory',
	'00025-opac-pilot',
	'00026-opac-screen',
	'00030-opac-followup',
	'00031-opac-fine',
	'00032-opac-controls',
	'00034-opac-mid',
	'00035-opac-glow',
	'00036-opac-paths',
	'00041-opac-phase',
	'00045-opac-spectral',
	...readdirSync(checked(runs)).filter((n) => /-opac-(pre10|sunset)$/u.test(n)),
];
const paths = [...new Set([...names.map((n) => runs + n), finalReport])];
const run = createRun(
	'opac-verify',
	'Authenticate published-profile evidence, replay input/spectral/color contracts and preserve explicit precision/scene limitations.',
	paths.map((p) => identity(p + '/manifest.json')),
);
let failure;
try {
	const medium = physical(),
		installation = read('scripts/libradtran/installation.json');
	let artifacts = 0,
		cases = 0,
		toolSeconds = 0,
		checkedBytes = 0;
	const semantics = [];
	for (const parent of paths) {
		const manifest = read(parent + '/manifest.json');
		assert.equal(manifest.state, 'accepted');
		run.progress('authenticate', parent, {completed: paths.indexOf(parent), total: paths.length});
		for (const file of manifest.artifacts) {
			const actual = identity(file.path);
			assert.equal(actual.sha256, file.sha256);
			assert.equal(actual.bytes, file.bytes);
			artifacts++;
			checkedBytes += file.bytes;
			if (artifacts % 300 === 0) run.progress('hash', 'Authenticated retained artifacts', {completed: artifacts});
		}
		if (!manifest.artifacts.some((a) => a.path === parent + '/readings.json')) continue;
		for (const reading of read(parent + '/readings.json')) {
			const config = reading.config,
				tool = read(reading.tool + '/manifest.json');
			assert.equal(tool.status, 'succeeded');
			assert.equal(tool.solver.sha256, installation.expectedSha256);
			const deck = readFileSync(checked(reading.tool + '/execution/input.inp'), 'utf8');
			const option = (name) =>
				deck
					.split(/\r?\n/u)
					.find((s) => s.startsWith(name + ' '))
					?.slice(name.length + 1);
			assert.equal(option('rte_solver'), 'mystic');
			assert.equal(option('mc_spherical'), '1D');
			assert.equal(option('mc_vroom'), 'off');
			assert.equal(Number(option('zout')), config.altitude / 1000);
			assert.equal(Number(option('earth_radius')), 6360);
			assert.equal(option('mol_abs_param'), 'none');
			assert.equal(Number(option('albedo')), 0);
			assert.equal(Number(option('mc_randomseed')), 100003 + config.repeat * 104729);
			assert.ok(Math.abs(Number(option('umu')) + Math.sin((config.elevation * Math.PI) / 180)) < 1e-12);
			assert.ok(Math.abs(Number(option('sza')) - (config.zenith ?? medium.zenithDegrees)) < 1e-10);
			assert.equal(Number(option('phi')), config.azimuth);
			assert.ok(!/pseudospherical|mc_refraction|aerosol_modify/u.test(deck));
			const molecular = readFileSync(checked(reading.tool + '/execution/scattering.txt'), 'utf8')
				.trim()
				.split(/\r?\n/u)
				.map((s) => s.trim().split(/\s+/u).map(Number));
			assert.ok(molecular[0].includes(config.altitude / 1000));
			const solar = readFileSync(checked(reading.tool + '/execution/solar.txt'), 'utf8')
				.trim()
				.split(/\r?\n/u)
				.map((s) => s.trim().split(/\s+/u).map(Number));
			const raw = readFileSync(checked(reading.tool + '/execution/mc.rad.spc'), 'utf8')
				.trim()
				.split(/\r?\n/u)
				.map((s) => s.trim().split(/\s+/u).map(Number));
			assert.equal(raw.length, reading.samples.length);
			assert.equal(molecular.length, reading.samples.length + 1);
			for (const [i, sample] of reading.samples.entries()) {
				const expected =
					medium.rayleigh[sample.c] *
					medium.rayleighHeight *
					-Math.expm1(-medium.topAltitude / medium.rayleighHeight);
				assert.ok(Math.abs(molecular[i + 1].slice(1).reduce((s, x) => s + x, 0) - expected) < 1e-12);
				assert.equal(solar[i][0], sample.wavelength);
				assert.ok(Math.abs(solar[i][1] / 1000 - medium.sourceIrradiance[sample.c]) < 1e-12);
				assert.equal(raw[i].length, 5);
				assert.ok(Math.abs(raw[i][0] - sample.wavelength) < 0.002);
				assert.ok(Math.abs(raw[i][4] / 1000 - reading.values[i]) < 1e-15);
			}
			if (profileNames.includes(config.name)) {
				const r = recipe(config.name);
				assert.equal(readFileSync(checked(reading.tool + '/execution/species.txt'), 'utf8'), r.text);
				assert.equal(option('aerosol_species_file'), 'species.txt ' + r.species.join(' '));
				for (const s of r.species)
					assert.equal(
						identity(reading.tool + '/execution/' + s + '.mie.cdf').sha256,
						createHash('sha256').update(optical(s, config.humidity).bytes).digest('hex'),
					);
			} else {
				const cdf = readCdf(readFileSync(checked(reading.tool + '/execution/toronto.material.cdf')));
				for (let i = 0; i < reading.samples.length; i++)
					assert.equal(cdf.value('ext', i + 1, 0), medium.mie[reading.samples[i].c] * 1000);
				if (config.name === 'molecular')
					assert.ok(
						readFileSync(checked(reading.tool + '/execution/species.txt'), 'utf8')
							.trim()
							.split(/\r?\n/u)
							.every((s) => Number(s.trim().split(/\s+/u)[1]) === 0),
					);
			}
			const view = ray(config.elevation, config.altitude);
			if (config.offset !== undefined) assert.equal(view.ground, config.offset < 0);
			cases++;
			toolSeconds += reading.seconds;
			semantics.push({
				name: config.name,
				altitude: config.altitude,
				scene: config.scene ?? 'noon',
				order: config.order,
				source: reading.tool,
			});
		}
	}
	const samples = channels.flatMap((c, i) =>
		[-1, 1].map((x) => ({
			c: i,
			wavelength: c.center.value + (x * c.width.value) / (2 * Math.sqrt(3)),
			weight: 0.5,
		})),
	);
	const equal = sampledColor({samples, values: samples.map(() => 1)}),
		expected = colorimetry(Array(15).fill(1), 'bin-integrated');
	const colorControl = Math.max(...equal.xyz.map((x, i) => Math.abs(x / expected.xyz[i] - 1)));
	assert.ok(colorControl < 1e-12);
	const final = read(finalReport + '/analysis.json');
	assert.equal(final.inputs.length, 309);
	assert.ok(final.liveCampaignParents.length === 0);
	for (const g of final.groups) {
		for (const c of g.contrasts) {
			assert.ok(c.vectors.length >= 3 && c.repeatIds.length === c.vectors.length);
			if (c.pairedDifferences)
				assert.ok(
					Math.abs(
						c.pairedDifferences.reduce((s, v) => s + v, 0) / c.pairedDifferences.length -
							c.baselineDifference,
					) < 1e-12,
				);
		}
	}
	const properties = {baseline: baselineInventory(), profiles: profileNames.map((n) => inventory(n))};
	const saved = read(runs + '00036-opac-paths/inventory.json');
	assert.deepEqual(properties, saved);
	const compatibilitySources = [
		'src/flat32/Flat32Atmosphere.js',
		'src/algorithm32/implementation/canonical-atmosphere/CanonicalAtmosphere.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js',
		'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js',
	].map(identity);
	const atmosphereSource = readFileSync(checked(compatibilitySources[1].path), 'utf8'),
		compilerSource = readFileSync(checked(compatibilitySources[2].path), 'utf8');
	assert.ok(atmosphereSource.includes('exp(-altitudeMeters / ATMOSPHERE_MIE_SCALE_HEIGHT_METERS)'));
	assert.ok(compilerSource.includes('exp(-altitudeMeters / MIE_SCALE_HEIGHT)'));
	run.write('scene-compatibility.json', {
		sources: compatibilitySources,
		finding:
			'The selected runtime medium and scene-cache compiler configure one exponential aerosol density and a global Mie phase/SSA description. A full published mixture changes species proportions, scattering/absorption spectra and phase with height.',
		consequence:
			'The existing profile-only configuration cannot faithfully render this layered preset. A new layered medium/height-dependent phase implementation across builder and runtime is separate work; no fitted exponential/phase lobe, new alternate GPU cache, full app render or production promotion is claimed.',
		futurePossibility:
			'The atmosphere-contributor architecture can be extended; this is a limitation of the selected configuration, not proof that a faithful implementation is impossible.',
		cost: 'No alternate GPU cache build was performed; its implementation/build/runtime costs remain unmeasured.',
	});
	const types = await command(run, 'types', ['node_modules/typescript/bin/tsc', '-p', source + '/jsconfig.json']);
	assert.equal(types.code, 0, types.stderr + types.stdout);
	const scripts = readdirSync(checked(source)).filter((n) => n.endsWith('.mjs') || n.endsWith('.js'));
	for (const script of scripts) {
		const check = await command(run, 'syntax-' + script, ['--check', source + '/' + script]);
		assert.equal(check.code, 0, check.stderr);
	}
	const python = spawnSync(
		'python',
		[
			'-c',
			"import ast,pathlib; [ast.parse(p.read_text(encoding='utf-8'),filename=str(p)) for p in pathlib.Path('experiments/elevated-horizon-validation').glob('*.py')];print('Python AST syntax passed')",
		],
		{encoding: 'utf8', windowsHide: true},
	);
	run.write('python-syntax.log', python.stdout + python.stderr);
	assert.equal(python.status, 0);
	const files = [];
	const walk = (p) => {
		for (const e of readdirSync(checked(p), {withFileTypes: true})) {
			const child = p + '/' + e.name;
			if (e.isDirectory()) walk(child);
			else {
				files.push({bytes: statSync(checked(child)).size});
				if (files.length % 300 === 0)
					run.progress('storage', 'Count retained bytes', {completed: files.length});
			}
		}
	};
	walk(output);
	run.write('verification.json', {
		artifacts,
		checkedBytes,
		cases,
		toolInvocationSeconds: toolSeconds,
		colorControlMaximumRelativeError: colorControl,
		retainedBytes: files.reduce((s, f) => s + f.bytes, 0),
		typesPassed: true,
		syntaxPassed: true,
		spectralSourceAndInputReplayPassed: true,
		immutableParentsAuthenticated: true,
		properties,
		scientificCases: semantics,
		limits: [
			'Three-replicate empirical intervals do not guarantee rare-history coverage or physical-model correctness.',
			'5m dark-ground absolute radiance does not meet a 1% convergence claim; contrast improvement remains resolved.',
			'Published angular table detail preserved exactly; underlying Mie-table compression uncertainty remains.',
			'No faithful production layered-medium/altitude-dependent phase configuration exists in this lane; no alternate GPU cache/full app scene or B1 score is claimed.',
			'No real San Jose aerosol/thermodynamic observation has been validated.',
		],
	});
	run.finish('accepted', {cases, artifacts, toolInvocationSeconds: toolSeconds});
} catch (error) {
	failure = String(error);
	run.finish('failed', {failure});
}
if (failure) throw new Error(failure);
