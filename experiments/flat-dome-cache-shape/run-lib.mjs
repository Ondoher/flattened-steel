import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {cases, medium} from './physical.mjs';
import {capHeight} from './geometry.mjs';
import {createRun, identity, checked, repository, sourceRoot} from './io.mjs';

const parentModule = 'experiments/sky-accuracy-dials/distant-horizon/toronto-direct.mjs';
const {directBundle} = await import(pathToFileURL(path.join(repository, parentModule)).href);
const all = process.argv.includes('--all');
const run = createRun(all ? 'm3-lib-guide' : 'm2-lib-guide', [identity(parentModule), identity('experiments/clean-horizon-profiles/cli.js'), identity('experiments/clean-horizon-profiles/worker.py'), identity('scripts/libradtran/installation.json')]);
const spectralImportance = process.argv.includes('--spectral-is');
const standardOutput = all || spectralImportance || process.argv.includes('--std');
/** @type {Record<string, unknown>[]} */
const readings = [];
let failure;
try {
	const selected = all ? cases() : cases(true).filter((item) => item.altitude === 1000 && item.view === 'sunward');
	const concurrency = all ? Math.min(4, os.availableParallelism()) : 1;
	const failures = [];
	run.write('registration.json', {selected, concurrency, photons: 30000, layers: 256, repeats: 1, physicalMatch: 'Locally matched collimated source and local-height horizontal slab; finite-cap, source-divergence and scattering-order mismatches explicitly retained. This is an actual libRadtran guide, not a matched dome J4 oracle.', parentChange: 'Contained existing CLI copied with lane/output identity changed; worker protocol preserved with the matching declared lane-parent boundary. Existing direct angular Cornette-Shanks optical-library generator read-only.'});
	const processCase = async (index) => {
		const item = selected[index];
		const delta = [item.sourceRadius - item.origin[0], -item.origin[1], 4828032 - item.origin[2]];
		const distance = Math.hypot(...delta);
		const sunDirection = delta.map((v) => v / distance);
		const elevation = Math.asin(item.direction[2]) * 180 / Math.PI;
		const empty = item.end - item.entry <= 1e-7;
		const observerAltitude = empty ? Math.max(5, item.altitude) : item.altitude;
		const nativeMedium = {...medium, geometry: 'flat', sourceKind: 'parallel', topAltitude: empty ? observerAltitude : capHeight(Math.hypot(item.origin[0], item.origin[1])), sourceDirection: sunDirection, sourceIrradiance: medium.sourceIrradiance.map((value) => value * (4800000 / distance) ** 2)};
		const config = {id: `cap-guide-${index}`, channels: Array.from({length: 15}, (_, c) => c), layers: 256, elevation, photons: 30000, repeat: 0, epsilon: 1, vroomOff: true};
		const material = {phaseTables: Array(15).fill(null), albedos: Array(15).fill(0.8), changedChannels: [], unsupportedCenters: []};
		// The inherited generator emits spherical template optics. The layer tables
		// are geometry-independent; this adapter explicitly selects the actual slab deck.
		const files = directBundle({...nativeMedium, geometry: 'spherical'}, config, material, false);
		let deck = String(files.get('input.inp'));
		deck = deck.replace('mc_spherical 1D', '').replace('zout 0.005', `zout ${observerAltitude / 1000}`).replace('phi 180', 'phi 0');
		if (spectralImportance) {
			deck += '\nmc_spectral_is 563.6666666666666\n';
		}
		if (standardOutput) {
			deck += '\nmc_std\n';
		}
		assert.ok(deck.includes('rte_solver mystic') && !deck.includes('mc_spherical'));
		files.set('input.inp', deck);
		// MYSTIC requires the exact output altitude in every physical layer table.
		const previousLevels = String(files.get('scattering.txt')).split(/\r?\n/)[0].trim().split(/\s+/).map((value) => Number(value) * 1000);
		const levels = [...new Set([...previousLevels.filter((z) => z <= nativeMedium.topAltitude), observerAltitude])].sort((a, b) => b - a);
		const header = levels.map((z) => z / 1000).join(' ');
		files.set('scattering.txt', [header, ...medium.wavelengths.map((wavelength, c) => [wavelength, ...levels.slice(1).map((lower, i) => medium.rayleigh[c] * 8000 * (Math.exp(-lower / 8000) - Math.exp(-levels[i] / 8000)))].join(' '))].join('\n') + '\n');
		files.set('absorption.txt', [header, ...medium.wavelengths.map((wavelength) => [wavelength, ...levels.slice(1).map(() => 0)].join(' '))].join('\n') + '\n');
		files.set('atmosphere.txt', levels.map((z) => `${z / 1000} ${1013 * Math.exp(-z / 8000)} 288 ${2.545818e19 * Math.exp(-z / 8000)}`).join('\n') + '\n');
		files.set('species.txt', levels.map((z, i) => `${z / 1000} ${i === 0 ? 0 : 1200 * (Math.exp(-z / 1200) - Math.exp(-levels[i - 1] / 1200)) / (levels[i - 1] - z)}`).join('\n') + '\n');
		const metadata = JSON.parse(String(files.get('case.json')));
		metadata.purpose = 'Actual libRadtran locally matched finite-dome guide; not an exact finite-cap/finite-point-source comparison.';
		metadata.geometry = `Plane-parallel exponential slab with local cap-height ${nativeMedium.topAltitude}m; observer ${item.altitude}m, local parallel-source direction and irradiance, black ground, all orders.`;
		metadata.limitations = ['Finite cap replaced by a local-height slab.', 'Finite point source replaced by a locally matched collimated source.', 'All scattering orders, not a pure J4 reference.', 'One photon replicate in this pilot; final confidence requires repetition.'];
		metadata.actualCase = item;
		metadata.medium = nativeMedium;
		metadata.explicitOutputAltitudeMeters = observerAltitude;
		metadata.emptyAtmosphereControl = empty ? 'Actual outward top-of-atmosphere solve; when requested altitude is below5m, equivalent vacuum guide uses5m to satisfy the legacy layer generator minimum grid.' : false;
		metadata.spectralImportance = spectralImportance ? 'Fixed Cornette-Shanks phase is wavelength-independent per species; spectral importance sampling therefore does not omit a varying phase. Raw standard deviations requested.' : 'Independent monochromatic native runs.';
		metadata.derivation = 'Generate authenticated layer/phase tables with the spherical template helper, remove mc_spherical, and set the actual slab observer and relative view direction explicitly.';
		files.set('case.json', JSON.stringify(metadata, null, 2));
		const caseRoot = path.join(run.root, `case-${index}`);
		mkdirSync(caseRoot);
		checked(caseRoot, run.root);
		for (const [name, contents] of files) {
			assert.ok(/^[a-zA-Z0-9._-]+$/.test(name));
			writeFileSync(path.join(caseRoot, name), contents, {flag: 'wx'});
		}
		run.progress('libRadtran', `Executing local-height guide ${index + 1}/${selected.length}.`);
		const outcome = await new Promise((resolve, reject) => {
			const child = spawn(process.execPath, [path.join(sourceRoot, 'cli.js'), 'run', '--case', caseRoot, '--timeout-seconds', '3600'], {cwd: repository, env: {...process.env, DOME_TOOL_PARENT: run.root}, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
			let stdout = '';
			let stderr = '';
			child.stdout.on('data', (v) => { stdout += v.toString(); });
			child.stderr.on('data', (v) => { stderr += v.toString(); });
			child.on('error', reject);
			child.on('close', (code) => resolve({code, stdout, stderr}));
		});
		run.write(`launch-${index}.json`, outcome);
		assert.equal(outcome.code, 0, outcome.stdout + outcome.stderr);
		const toolMatch = /^libRadtran run: (.+)$/m.exec(outcome.stdout);
		assert.ok(toolMatch, 'Child tool did not identify its own run.');
		const tool = checked(toolMatch[1].trim(), run.root);
		const spectrumFile = checked(path.join(tool, 'execution/mc.rad.spc'), run.root);
		const spectrum = readFileSync(spectrumFile, 'utf8').trim().split(/\r?\n/).map((line) => line.trim().split(/\s+/).map(Number));
		assert.equal(spectrum.length, 15);
		const values = spectrum.map((row, c) => {
			assert.ok(Math.abs(row[0] - medium.wavelengths[c]) < 0.002 && Number.isFinite(row.at(-1)) && row.at(-1) >= 0);
			return row.at(-1) / 1000;
		});
		const standardFile = path.join(tool, 'execution/mc.rad.std.spc');
		const standard = standardOutput ? readFileSync(checked(standardFile, run.root), 'utf8').trim().split(/\r?\n/).map((line) => Number(line.trim().split(/\s+/).at(-1)) / 1000) : null;
		if (standard) {
			assert.equal(standard.length, 15);
			assert.ok(standard.every((v) => Number.isFinite(v) && v >= 0));
		}
		const reading = {id: item.id, spectrum: values, standardError: standard, tool, physicalMatch: metadata.limitations, raw: identity(path.relative(repository, spectrumFile))};
		readings.push(reading);
		run.write(`reading-${index}.json`, reading);
		console.log(JSON.stringify({run: run.id, completed: readings.length, total: selected.length, id: item.id}));
	};
	let next = 0;
	await Promise.all(Array.from({length: concurrency}, async () => {
		for (;;) {
			const index = next++;
			if (index >= selected.length) break;
			try { await processCase(index); }
			catch (error) {
				const record = {index, id: selected[index].id, error: String(error)};
				failures.push(record);
				run.write(`case-failure-${index}.json`, record);
			}
		}
	}));
	run.write('readings.json', readings.sort((a, b) => String(a.id).localeCompare(String(b.id))));
	if (failures.length) throw new Error(`${failures.length} native guide cases failed; completed cases and all failures retained.`);
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack, completed: readings.length});
} finally {
	run.finish(failure ? 'failed' : 'accepted', {message: failure ? String(failure) : 'Requested actual15-channel local-height libRadtran guide spectra and standard errors retained; geometry/order mismatch explicitly reported.', completed: readings.length});
}
if (failure) {
	throw failure;
}
