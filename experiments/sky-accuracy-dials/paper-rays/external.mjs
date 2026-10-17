import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {createRun, identity, readRepository, checkedAbsolute, repositoryRoot, verifyRun, sha256} from '../io/files.mjs';
import {moments} from '../distant-horizon/aerosol-reference.mjs';
import {invoke} from '../distant-horizon/libradtran.mjs';
import {packet, reuseThird} from './packet.mjs';
import {releaseStaged} from './staging.mjs';

/** Explicit spherical physical case; maxscatters includes surface reflection.
 * @param {PaperRayPacket} p @param {PaperRayLibConfig} config @returns {Map<string,string>}
 */
function bundle(p, config) {
	const ray = p.rays[config.ray],
		m = ray.medium,
		zset = new Set([0, m.topAltitude]);
	for (const [height, count] of [
		[m.rayleighHeight, config.layers],
		[m.mieHeight, config.layers / 2],
	])
		for (let i = 1; i < count; i++)
			zset.add(-height * Math.log1p(-(1 - i / count) * -Math.expm1(-m.topAltitude / height)));
	const z = [...zset].sort((a, b) => b - a),
		phase = moments(m.g),
		files = new Map(),
		header = z.map((v) => v / 1000).join(' ');
	const sca = [header],
		abs = [header],
		index = [`${z[0] / 1000} NULL`];
	for (const c of config.channels) {
		sca.push(
			[
				p.centers[c],
				...z
					.slice(1)
					.map(
						(l, i) =>
							m.rayleigh[c] *
							m.rayleighHeight *
							(Math.exp(-l / m.rayleighHeight) - Math.exp(-z[i] / m.rayleighHeight)),
					),
			].join(' '),
		);
		abs.push([p.centers[c], ...z.slice(1).map(() => 0)].join(' '));
	}
	for (let i = 1; i < z.length; i++) {
		const l = z[i],
			u = z[i - 1],
			integral = m.mieHeight * (Math.exp(-l / m.mieHeight) - Math.exp(-u / m.mieHeight)),
			name = `aerosol-${i}.txt`;
		files.set(
			name,
			config.channels
				.map((c) => [p.centers[c], ((m.mie[c] * integral) / (u - l)) * 1000, m.albedo, ...phase].join(' '))
				.join('\n') + '\n',
		);
		index.push(`${l / 1000} ${name}`);
	}
	files.set('scattering.txt', sca.join('\n') + '\n');
	files.set('absorption.txt', abs.join('\n') + '\n');
	files.set('aerosols.txt', index.join('\n') + '\n');
	files.set(
		'atmosphere.txt',
		z
			.map(
				(v) =>
					`${v / 1000} ${1013 * Math.exp(-v / m.rayleighHeight)} 288 ${2.545818e19 * Math.exp(-v / m.rayleighHeight)}`,
			)
			.join('\n') + '\n',
	);
	files.set('wavelengths.txt', config.channels.map((c) => p.centers[c]).join('\n') + '\n');
	files.set(
		'solar.txt',
		config.channels.map((c) => `${p.centers[c]} ${1000 * m.sourceIrradiance[c]}`).join('\n') + '\n',
	);
	files.set(
		'grass.txt',
		config.channels.map((c) => `${p.centers[c]} ${config.black ? 0 : p.grass[c]}`).join('\n') + '\n',
	);
	files.set(
		'input.inp',
		[
			'data_files_path @LIBRADTRAN_DATA@/',
			'atmosphere_file atmosphere.txt',
			'source solar solar.txt per_nm',
			'wavelength_grid_file wavelengths.txt',
			'spline_file wavelengths.txt',
			'mol_tau_file sca scattering.txt',
			'mol_tau_file abs absorption.txt',
			'mol_abs_param none',
			'rayleigh_depol 0',
			'aerosol_default',
			'aerosol_file explicit aerosols.txt',
			`earth_radius ${m.radius / 1000}`,
			'albedo_file grass.txt',
			'zout 0',
			`sza ${(Math.acos(m.sourceDirection[2]) * 180) / Math.PI}`,
			'phi0 0',
			`umu ${-Math.sin((ray.elevation * Math.PI) / 180)}`,
			`phi ${ray.heading}`,
			'rte_solver mystic',
			'mc_spherical 1D',
			'mc_vroom off',
			...(config.importance ? ['mc_spectral_is 501'] : []),
			...(config.order > 0 ? [`mc_maxscatters ${config.order}`] : []),
			`mc_photons ${config.photons}`,
			`mc_randomseed ${100003 + 104729 * config.repeat}`,
			'output_user lambda uu',
			'quiet',
			'',
		].join('\n'),
	);
	files.set(
		'case.json',
		JSON.stringify({
			purpose: `${p.campaign.toUpperCase()} matched paper ray through diagnostic scattering orders`,
			geometry:
				'Fully spherical, observer0m, spectral Lambertian grass; photon interaction count includes surface reflections.',
			quantity: 'mc.rad.spc directional spectral radiance',
			units: 'nm and mW m^-2 sr^-1 nm^-1; report divides by1000',
			limitations: [
				'Order-limited runs are deliberate truncated diagnostic solutions, not all-order physical skies.',
				'Spectral importance uses a wavelength-independent phase, exactly matching this paper phase.',
				'Layer and sampling convergence are separately checked.',
			],
			config,
			ray,
			centers: p.centers,
			grass: p.grass,
			layerCount: z.length - 1,
			phaseMoments: phase,
		}),
	);
	return files;
}

/** Execute one preserved external case and authenticate its actual staged bytes.
 * @param {DialRun} run @param {PaperRayPacket} p @param {PaperRayLibConfig} config
 * @returns {Promise<PaperRayLibReading>}
 */
async function solve(run, p, config) {
	const files = bundle(p, config),
		directory = checkedAbsolute(path.join(run.scratchPath, config.id), false);
	mkdirSync(directory);
	let n = 0;
	for (const [name, contents] of files) {
		writeFileSync(path.join(directory, name), contents, {flag: 'wx'});
		if (++n % 32 === 0) run.progress('stage', `${config.id}: ${n}/${files.size} files`);
	}
	run.progress('solve', `${config.id}: MYSTIC prefix${config.order || 'all'}, ${config.photons} photons`);
	const started = performance.now(),
		launch = await invoke(directory, 300);
	run.write(config.id + '-launch.json', launch);
	const allocated = launch.stdout.match(/libRadtran run: (.+)/)?.[1].trim();
	assert.ok(allocated, launch.stderr);
	const toolRun = path.relative(repositoryRoot, checkedAbsolute(allocated)).replaceAll('\\', '/');
	assert.ok(toolRun.startsWith('.codex-tmp/libradtran/runs/'));
	const mp = toolRun + '/manifest.json',
		manifest = /** @type {HorizonLibManifest} */ (JSON.parse(readRepository(mp).toString()));
	assert.equal(launch.code, 0, launch.stderr);
	assert.equal(manifest.status, 'succeeded');
	for (const [name, contents] of files) {
		const a = manifest.artifacts.find((a) => a.path === 'case/' + name);
		assert.ok(a);
		assert.equal(a.sha256, sha256(contents));
	}
	const artifact = manifest.artifacts.find((a) => a.path === 'execution/mc.rad.spc');
	assert.ok(artifact);
	const raw = identity(toolRun + '/' + artifact.path),
		bytes = readRepository(raw.path, artifact.sha256),
		rows = bytes
			.toString()
			.trim()
			.split(/\r?\n/)
			.filter((s) => s.trim() && !s.startsWith('#'))
			.map((s) => s.trim().split(/\s+/).map(Number));
	assert.equal(rows.length, config.channels.length);
	const spectrum = rows.map((r, i) => {
		assert.ok(r.length >= 5 && r.every(Number.isFinite) && r[4] >= 0);
		assert.ok(Math.abs(r[0] - p.centers[config.channels[i]]) < 0.001);
		return r[4] / 1000;
	});
	const reading = {config, spectrum, toolRun, elapsedMilliseconds: performance.now() - started, raw};
	run.write(config.id + '-raw.txt', bytes, {
		parents: [identity(mp), raw],
		operation: 'Authenticated MYSTIC raw spectral radiance, retained in original mW units.',
	});
	run.write(config.id + '-input.json', {
		manifest: identity(mp),
		metadata: JSON.parse(files.get('case.json')),
		inputDeck: files.get('input.inp'),
		inputFiles: manifest.artifacts.filter((a) => a.path.startsWith('case/')),
		inputFilesAuthenticated: true,
	});
	run.write(config.id + '-reading.json', reading);
	run.write(config.id + '-stderr.txt', readRepository(toolRun + '/stderr.txt'));
	const released = releaseStaged(run, directory, files);
	run.write(config.id + '-staged-cleanup.json', {
		...released,
		copiedInputsAuthenticated: true,
		toolManifest: identity(mp),
		reason: 'Release completed owned staging after tool-copy authentication, keeping final cleanup short enough to maintain progress heartbeats.',
	});
	console.log(JSON.stringify({case: config.id, milliseconds: reading.elapsedMilliseconds, spectrum}));
	return reading;
}

/** Bounded external pilot or complete repeated prefix package, using the existing WSL tool.
 * @returns {Promise<void>} Every invocation and failed attempt remain immutable evidence.
 */
async function main() {
	const pilot = process.argv[2] === 'pilot',
		near = process.argv[2] === 'nearcheck';
	assert.ok(pilot || near || process.argv[2] === 'full');
	const p = packet(),
		channels = pilot || near ? [4, 12, 24] : Array.from({length: 40}, (_, i) => i);
	/** @type {PaperRayLibConfig[]} */ const configs = [];
	if (pilot) {
		for (const [id, order, importance, layers, ray] of [
			['n1-direct', 1, false, 128, 0],
			['n4-direct', 4, false, 128, 0],
			['n4-fine', 4, false, 256, 0],
			['n1-near', 1, false, 128, 2],
			['all-direct', 0, false, 128, 0],
		])
			configs.push({
				id: String(id),
				order: Number(order),
				importance: Boolean(importance),
				layers: Number(layers),
				ray: Number(ray),
				repeat: 0,
				photons: 20000,
				channels,
			});
	} else if (near)
		for (let repeat = 0; repeat < 2; repeat++)
			configs.push({
				id: `n1-near-s${repeat}`,
				ray: 2,
				order: 1,
				repeat,
				photons: 100000,
				layers: 128,
				importance: false,
				channels,
			});
	else
		for (let ray = 0; ray < (p.campaign === 'h58' ? 2 : 3); ray++)
			for (const order of [1, 2, 3, 4, 0])
				for (let repeat = 0; repeat < 4; repeat++)
					configs.push({
						id: `r${ray}-n${order}-s${repeat}`,
						ray,
						order,
						repeat,
						photons: 20000,
						layers: 128,
						importance: false,
						channels,
					});
	const reuse = p.campaign === 'h58' && !pilot && !near;
	const oldRoot = 'tmp/experiments/sky-accuracy-dials/runs/00361-h57-ref-data';
	if (reuse) reuseThird(p, oldRoot);
	const run = createRun(
		pilot ? `${p.campaign}-lib-pilot` : near ? `${p.campaign}-near-control` : `${p.campaign}-libradtran`,
		{
			parents: [
				...p.parents,
				identity('scripts/libradtran/cli.js'),
				identity('scripts/libradtran/worker.py'),
				identity('scripts/libradtran/installation.json'),
				identity('references/downloads/libradtran-2.0.1/libRadtran-2.0.1/libsrc_c/mystic.c'),
			],
			operation:
				'Matched fully spherical MYSTIC through-interaction1/2/3/4 and all orders, explicit paper Direct40 medium/source/grass, repeated independent seeds and authenticated actual inputs.',
			parameters: {
				reusedRay: reuse
					? {
							ray: 2,
							parent: oldRoot,
							operation:
								'Copy unchanged admitted reference readings for the exactly matching physical ray; original monitoring defect remains disclosed in parent.',
						}
					: null,
				pilot,
				near,
				concurrency: pilot ? 1 : 2,
				configs,
				orderConvention:
					'mc_maxscatters n; source counts surface reflection as an interaction; N1 independently validated before admission.',
			},
		},
	);
	/** @type {PaperRayLibReading[]} */ const readings = [];
	let failure = null;
	try {
		if (reuse) {
			const old = /** @type {PaperRayLibReading[]} */ (
				JSON.parse(readRepository(oldRoot + '/readings.json').toString())
			);
			readings.push(...old.filter((r) => r.config.ray === 2));
			assert.equal(readings.length, 20);
		}
		run.write('packet.json', {centers: p.centers, grass: p.grass, rays: p.rays, configs});
		run.write('ranking.json', p.ranking);
		let next = 0;
		async function worker() {
			while (next < configs.length) {
				const config = configs[next++];
				readings.push(await solve(run, p, config));
				run.progress(
					'cases',
					`${readings.length - (reuse ? 20 : 0)}/${configs.length} new cases complete${reuse ? '; 20 matching cases reused' : ''}`,
					readings.length - (reuse ? 20 : 0),
					configs.length,
				);
			}
		}
		const jobs = await Promise.allSettled(Array.from({length: pilot ? 1 : 2}, worker));
		for (const job of jobs) if (job.status === 'rejected') throw job.reason;
		run.write('readings.json', readings);
	} catch (e) {
		failure = e;
	}
	run.cleanup();
	run.finish(failure ? 'failed' : 'accepted', {failure: failure ? String(failure) : null, cases: readings.length});
	verifyRun(run.path);
	assert.equal(failure, null, String(failure));
	console.log(JSON.stringify({run: run.path, cases: readings.length}));
}
await main();
