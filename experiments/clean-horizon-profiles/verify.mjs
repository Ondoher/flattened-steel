import assert from 'node:assert/strict';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import {PNG} from 'pngjs';
import {createRun, checked, identity, output, command} from './io.mjs';

const previousRuns = readdirSync(checked(output + '/runs')).sort();
const run = createRun('verify', 'Verify closed evidence, scientific result boundaries, source types and image artifacts', previousRuns.map(name => identity(output + '/runs/' + name + '/manifest.json')));
let failure;
try {
	const states = {}, hashes = [], durations = [];
	let bytes = 0;
	for (const name of previousRuns) {
		const path = output + '/runs/' + name;
		const manifest = JSON.parse(readFileSync(checked(path + '/manifest.json'), 'utf8'));
		assert.ok(['accepted', 'rejected', 'failed', 'interrupted'].includes(manifest.state));
		states[manifest.state] = (states[manifest.state] ?? 0) + 1;
		durations.push({name, seconds: manifest.elapsedSeconds});
		for (const expected of manifest.artifacts) {
			const actual = identity(expected.path);
			assert.equal(actual.bytes, expected.bytes); assert.equal(actual.sha256, expected.sha256);
			bytes += actual.bytes; hashes.push(actual);
		}
		const progress = readFileSync(checked(path + '/progress.jsonl'), 'utf8').trim().split(/\r?\n/u).map(line => JSON.parse(line));
		assert.equal(progress.at(-1).state, manifest.state);
	}
	const report = JSON.parse(readFileSync(checked(output + '/runs/00020-control-report/analysis.json'), 'utf8'));
	assert.equal(report.rows.length, 4);
	assert.ok(report.differences.every(row => row.difference > 0 && row.halfWidth95 > 0));
	const images = [5, 500].map(height => {
		const path = output + '/runs/00020-control-report/colors-' + height + 'm.png';
		const png = PNG.sync.read(readFileSync(checked(path)));
		assert.equal(png.height, 256); assert.equal(png.width, height === 5 ? 768 : 512);
		assert.ok(png.data.some(value => value > 0 && value < 255));
		return identity(path);
	});
	const paired = JSON.parse(readFileSync(checked(output + '/runs/00023-surface-paired/surface-cases.json'), 'utf8'));
	const candidate = paired.find(row => row.date === '2023-12-05' && row.time === '19:31:54');
	assert.equal(candidate.pairedGreenOpticalSamples, 5);
	assert.ok(candidate.dryAmbientDensityExtinction529PerKm > 0.0014 && candidate.dryAmbientDensityExtinction529PerKm < 0.0017);
	assert.ok(candidate.weather.rh_mean.mean > candidate.surface.RH_Neph_Dry.mean);
	const typecheck = await command(run, 'typecheck', ['node_modules/typescript/bin/tsc', '-p', 'experiments/clean-horizon-profiles/jsconfig.json']);
	assert.equal(typecheck.code, 0, typecheck.stdout + typecheck.stderr);
	const retained = directory => readdirSync(checked(directory), {withFileTypes: true}).reduce((sum, entry) => sum + (entry.isDirectory() ? retained(directory + '/' + entry.name) : statSync(checked(directory + '/' + entry.name)).size), 0);
	run.write('verified-identities.json', hashes);
	run.write('verification.json', {states, verifiedArtifacts: hashes.length, verifiedArtifactBytes: bytes,
		retainedBytesBeforeVerification: previousRuns.reduce((sum, name) => sum + retained(output + '/runs/' + name), 0),
		durations, summedRunSeconds: durations.reduce((sum, item) => sum + item.seconds, 0), images,
		typecheck: 'passed', scientificDisposition: 'M1 input-feasibility result only. Controls show opportunity; no ARM/ATom full ambient aerosol profile or scene finalist is qualified. No candidate M2 comparison, M3 adapter, M4 scene, finite-pixel ranking or production-change claim.'});
	console.log(JSON.stringify({states, artifacts: hashes.length, retainedArtifactMiB: bytes / 1048576}));
} catch (error) {failure = String(error); run.write('failure.json', {message: failure});}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) process.exitCode = 1;
