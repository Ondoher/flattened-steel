import {mkdirSync} from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import {cases, controlCases, transportDirections, validationCases} from './physical.mjs';
import {diskRadius} from './geometry.mjs';
import {topology} from './topology.mjs';
import {gauss} from './math.mjs';
import {candidateShader} from './candidate-shader.mjs';
import {executeCandidate} from './gpu.mjs';
import {createRun, identity, checked} from './io.mjs';

const sweep = process.argv.includes('--sweep');
const countArgument = process.argv.indexOf('--counts');
const counts = countArgument >= 0 ? process.argv[countArgument + 1].split(',').map(Number) : sweep ? [2, 4, 8, 16, 32, 64] : [2, 4];
const repeatsArgument = process.argv.indexOf('--repeats');
const repeats = repeatsArgument >= 0 ? Number(process.argv[repeatsArgument + 1]) : 1;
const refineArgument = process.argv.indexOf('--refine');
const refine = refineArgument >= 0 ? process.argv[refineArgument + 1] : '';
const run = createRun(refine ? `m3-refine-${refine}` : sweep ? 'm3-cache-sweep' : 'm2-cache-pilot', [identity('tmp/experiments/flat-dome-cache-shape/runs/00002-m1-contract/manifest.json'), identity('tmp/experiments/flat-dome-cache-shape/runs/00004-m1-probe-pilot/manifest.json')]);
let browser;
let failure;
try {
	const angular = refine === 'angle' ? transportDirections(12, 16) : transportDirections();
	const betaCount = refine === 'beta' ? 33 : 17;
	const selected = refine ? [...cases(), ...controlCases()] : sweep ? [...cases(), ...validationCases(), ...controlCases()] : cases(true);
	const prepareStart = performance.now();
	const datasets = (sweep && !refine ? [0.375, 0.5, 0.625] : [0.5]).flatMap((fraction) => counts.flatMap((count) => Array.from({length: repeats}, (_, repeat) => ({label: `n${count}-s${Math.round(fraction * 1000)}-r${repeat}`, layout: topology(count, diskRadius * fraction, betaCount), cases: selected.filter((item) => Math.abs(item.sourceRadius - diskRadius * fraction) < 1e-7)}))));
	const preparationMilliseconds = performance.now() - prepareStart;
	const shaders = candidateShader(angular, gauss(refine === 'path' ? 48 : 24), gauss(64), betaCount);
	run.write('build.glsl', shaders.build);
	run.write('view.glsl', shaders.view);
	run.write('registration.json', {counts, repeats, refine, betaCount, pathNodes: refine === 'path' ? 48 : 24, angular, datasets, preparationMilliseconds, timingSeries: 'Cumulative-retention series: pure fields retained for verification, then freed; resident cumulative-only values are independently checked. All primary counts share this ownership policy.', parentChange: 'The M2 pilot replaced cube directions with 96 horizon-focused Gauss/azimuth incoming directions. Before the full sweep, add two exact polar outgoing addresses with zero incoming weight; every primary count shares these 98 addresses and the same 96-direction integral. No finite-weight tangent rays are introduced. Explicit refine variants are diagnostic controls, excluded from the primary count series.'});
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({headless: 'new', userDataDir: profile, protocolTimeout: 86400000, args: ['--enable-gpu', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--disable-background-timer-throttling']});
	const page = await browser.newPage();
	await page.exposeFunction('retainBuildProgress', (event) => {
		run.progress('cache', `N=${event.count}, order=${event.order}, nodes=${event.completed}/${event.total}`, event);
	});
	await page.exposeFunction('retainCandidate', (result) => {
		run.write(`candidate-${result.metadata.label}.json`, result);
		console.log(JSON.stringify({run: run.id, ...result.metadata}));
	});
	await page.exposeFunction('retainCandidateFailure', (result) => {
		run.write('gpu-query-diagnostics.json', result);
	});
	run.progress('compile-build', `Preparing ${datasets.length} actual cache builds; validation outputs remain separate from development selection.`);
	const telemetry = await page.evaluate(executeCandidate, {shaders, directionCount: angular.length, datasets});
	run.write('telemetry.json', {preparationMilliseconds, ...telemetry});
	console.log(JSON.stringify({run: run.root, telemetry}));
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => { failure ??= error; });
	run.finish(failure ? 'failed' : 'accepted', {message: failure ? String(failure) : 'Requested cap-aware cache builds, cumulative-retention checks, and physical view queries completed; accuracy report remains separately scoped.', counts, repeats});
}
if (failure) {
	throw failure;
}
