import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRun, identity, checked, output, command} from './io.mjs';
import {physical, channels, ray} from './physics.mjs';

const read = (p) => JSON.parse(readFileSync(checked(p), 'utf8'));
const names = [
	'00001-solver-doctor',
	'00002-reference-pilot',
	'00003-reference-full',
	'00004-reference-fine',
	'00006-app-inspect',
	'00008-app-inspect',
	'00009-solver-doctor',
	'00010-ref-confirm',
	'00011-ref-aerosol50',
	'00014-ref-aerosol0',
	'00015-ref-glow',
	'00017-ref-geometry',
	'00018-profile-report',
	'00019-baseline-report',
];
const run = createRun(
	'final-verify',
	'Authenticate external solver evidence, matched inputs, actual GPU paths/compositing and profile controls; verify frozen source without modifying parent runs.',
	names.map((n) => identity(output + '/runs/' + n + '/manifest.json')),
);
let failure;
try {
	let artifacts = 0,
		cases = 0,
		toolSeconds = 0;
	const medium = physical(),
		installation = read('scripts/libradtran/installation.json');
	for (const name of names) {
		const parent = output + '/runs/' + name,
			manifest = read(parent + '/manifest.json');
		assert.equal(manifest.state, 'accepted');
		for (const file of manifest.artifacts) {
			const actual = identity(file.path);
			assert.equal(actual.sha256, file.sha256);
			assert.equal(actual.bytes, file.bytes);
			artifacts++;
		}
		if (!manifest.artifacts.some((a) => a.path === parent + '/readings.json')) continue;
		for (const reading of read(parent + '/readings.json')) {
			cases++;
			toolSeconds += reading.seconds;
			const tool = read(reading.tool + '/manifest.json');
			assert.equal(tool.status, 'succeeded');
			assert.equal(tool.solver.sha256, installation.expectedSha256);
			const deck = readFileSync(checked(reading.tool + '/execution/input.inp'), 'utf8');
			for (const option of [
				'mc_spherical 1D',
				'mc_vroom off',
				'zout 10',
				'earth_radius 6360',
				'mol_abs_param none',
			])
				assert.ok(deck.split(/\r?\n/u).includes(option));
			assert.ok(!deck.includes('pseudospherical') && !deck.includes('mc_refraction'));
			const tau = readFileSync(checked(reading.tool + '/execution/scattering.txt'), 'utf8')
				.trim()
				.split(/\r?\n/u)
				.map((s) => s.split(/\s+/u).map(Number));
			assert.ok(tau[0].includes(10));
			const solar = readFileSync(checked(reading.tool + '/execution/solar.txt'), 'utf8')
				.trim()
				.split(/\r?\n/u)
				.map((s) => s.split(/\s+/u).map(Number));
			for (const [i, c] of reading.config.channels.entries()) {
				const column = tau[i + 1].slice(1).reduce((s, x) => s + x, 0),
					expected = name.includes('geometry')
						? 0
						: medium.rayleigh[c] *
							medium.rayleighHeight *
							-Math.expm1(-medium.topAltitude / medium.rayleighHeight);
				assert.ok(Math.abs(column - expected) < 1e-12);
				assert.equal(solar[i][0], channels[c].center.value);
				assert.ok(Math.abs(solar[i][1] / 1000 - medium.sourceIrradiance[c]) < 1e-12);
			}
		}
	}
	const vacuum = read(output + '/runs/00017-ref-geometry/readings.json');
	assert.ok(vacuum[0].geometry.ground && !vacuum[1].geometry.ground);
	assert.ok(vacuum[1].spectrum.every((x) => x === 0));
	const view = ray(vacuum[0].config.elevation),
		point = [0, view.direction[1] * view.length, medium.radius + 10000 + view.direction[2] * view.length],
		normal = point.map((x) => x / medium.radius),
		mu = normal.reduce((s, x, c) => s + x * medium.sourceDirection[c], 0);
	for (const [i, c] of vacuum[0].config.channels.entries())
		assert.ok(Math.abs(vacuum[0].spectrum[i] / ((medium.sourceIrradiance[c] * mu) / Math.PI) - 1) < 1e-4);
	const baseline = read(output + '/runs/00019-baseline-report/analysis.json');
	assert.equal(baseline.column.maskMismatch.length, 0);
	assert.ok(baseline.column.maximumCompositeError < 1e-4);
	assert.ok(baseline.rows.every((r) => r.n === 6));
	assert.ok(
		baseline.rows
			.slice(0, 6)
			.every(
				(r) =>
					Math.abs(r.relativeY) < 0.05 &&
					r.reference.halfWidthY95 / r.reference.color.luminanceCdPerM2 < 0.02,
			),
	);
	assert.ok(baseline.contrasts.every((r) => r.halfWidth95 < 0.01 && Math.abs(r.production30 - r.reference) < 0.03));
	assert.ok(baseline.layer.every((r) => Math.abs(r.meanRelativeChange) + r.halfWidth95 < 0.01));
	for (const endpoint of baseline.column.endpoints) {
		assert.ok(Math.abs(endpoint.transmittanceRelativeError[6]) < 0.01);
		assert.ok(endpoint.groundContributionFraction.every((x) => x < 0.03));
	}
	const packagePath =
		'server/flat32/data/shared-block/f2c37c079d41f212a3905b4cccb18c0da84766ad374324c9ae8734b4ba1b4b42/package-set.json';
	assert.equal(identity(packagePath).sha256, 'a157fb905ccb8d15e03ce33e722554eddf2038c6965026c3ba310212e1e19b56');
	const selection = readFileSync(checked('server/flat32/features/shared-cache/selection.js'), 'utf8');
	assert.ok(selection.includes(read(packagePath).packageSetIdentity));
	const typecheck = await command(run, 'typecheck', [
		'node_modules/typescript/bin/tsc',
		'-p',
		'experiments/elevated-horizon-validation/jsconfig.json',
	]);
	assert.equal(typecheck.code, 0, typecheck.stdout + typecheck.stderr);
	const sizes = [];
	const walk = (p) => {
		for (const entry of readdirSync(checked(p), {withFileTypes: true})) {
			const file = p + '/' + entry.name;
			if (entry.isDirectory()) walk(file);
			else sizes.push(statSync(checked(file)).size);
		}
	};
	walk(output);
	const spectra = baseline.rows.map((row) => ({
		elevation: row.view.elevation,
		maximumRelativeBandResidual: Math.max(
			...row.spectralResidual.filter((r) => r.aboveSignalFloor).map((r) => Math.abs(r.relative)),
		),
	}));
	run.write('verification.json', {
		accepted: true,
		artifactsAuthenticated: artifacts,
		successfulScientificCases: cases,
		toolInvocationSeconds: toolSeconds,
		retainedBytes: sizes.reduce((s, x) => s + x, 0),
		vacuum: {ground: vacuum[0].spectrum, sky: vacuum[1].spectrum, groundMu: mu},
		spectra,
		baseline: {
			maximumRelativeY: Math.max(...baseline.rows.slice(0, 6).map((r) => Math.abs(r.relativeY))),
			maximumCompositeError: baseline.column.maximumCompositeError,
			geometryMaskMismatches: 0,
		},
		limitations: [
			'Empirical noise/layer controls are not formal correctness bounds.',
			'Initial runs recorded a finalization-time source inventory; actual copied CLI/worker, executed cases, parameter exports and solver identities remain authoritative. Later runs snapshot experiment source at start.',
			'Production final cache retains cumulative N4 only: no order-resolved rebuild was earned by the observed small residual.',
			'One earlier report has a terminal progress event but no manifest because sandbox Git metadata lookup failed; it remains incomplete and is not consumed.',
			'No validation of actual San Jose atmosphere, arbitrary other azimuths/heights, sunset, real spectral ground reflectance or object lighting is claimed.',
		],
	});
	console.log(
		JSON.stringify({
			artifacts,
			cases,
			toolSeconds,
			retainedMiB: sizes.reduce((s, x) => s + x, 0) / 1048576,
			spectra,
		}),
	);
} catch (error) {
	failure = String(error);
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) throw new Error(failure);
