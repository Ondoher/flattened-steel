import assert from 'node:assert/strict';
import {mkdirSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {PNG} from 'pngjs';
import {createRun, checked, identity, repository, sourceRoot} from './io.mjs';
import {transportDirections} from './physical.mjs';
import {topology} from './topology.mjs';
import {gauss} from './math.mjs';
import {candidateShader} from './candidate-shader.mjs';
import {executeCandidate} from './gpu.mjs';
import {sceneShaders} from './scene-shader.mjs';
import {sceneSettings, sceneQueries} from './scene-settings.mjs';
import {verifyScene} from './scene-verification.mjs';

const final = process.argv.includes('--final');
const parity = process.argv.includes('--parity');
const run = createRun(parity ? 'r1-three-cache' : final ? 'r4-three-final' : 'r3-three-pilot', [
	identity('tmp/experiments/flat-dome-cache-shape/runs/00042-m4-verification/manifest.json'),
	identity('agents/topics/poc-experiments/engineering-studies/flat-dome-cache-shape/scene-render-plan.md'),
	...[
		'src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js',
		'src/algorithm32/rendering-runtime/three/SceneInputCapture.js',
		'src/algorithm32/implementation/flat-earth/FlatGeometryShaderContributor.js',
		'node_modules/three/package.json',
	].map(identity),
]);
let browser;
let failure;
try {
	const settings = sceneSettings();
	const layout = topology(12, Number(settings.sourceRadius));
	const base = candidateShader(transportDirections(), gauss(24), gauss(64));
	const adapted = sceneShaders(
		base,
		/** @type {number[][]} */ (settings.colorWeights),
		/** @type {number[]} */ (settings.groundSpectrum),
	);
	/** @type {DomeSceneRequest} */
	const request = {
		layout,
		shaders: {...base, ...adapted},
		queries: sceneQueries(/** @type {number[]} */ (settings.origin)),
		groundSpectrum: /** @type {number[]} */ (settings.groundSpectrum),
		groundRgb: /** @type {number[]} */ (settings.groundColor['rgb']),
		origin: /** @type {number[]} */ (settings.origin),
		diskRadius: Number(settings.diskRadius),
		distanceInside: 5000,
		width: final ? 1280 : 320,
		height: final ? 720 : 180,
		final,
		stage: parity ? 'cache' : final ? 'final' : 'pilot',
	};
	run.write('registration.json', {
		settings,
		parity,
		final,
		tolerance: {portRelative: 1e-4, portAbsolute: 1e-9, cumulativeRelative: 1e-4, displayCodeValue: 1},
		lineage:
			'Unchanged actual production ShaderRuntimePass imported into browser bundle. Camera reconstruction adapted from FlatGeometryShaderContributor. Cache physics/GLSL reused from candidate-shader. FP32 scene-hit distance replaces byte packing; finite circular mesh replaces rectangular/raycast-only ground. Legacy slab, observer dome and sky-ray cutoff are not used.',
		request,
	});
	for (const [name, source] of Object.entries(request.shaders)) {
		run.write(`${name}.glsl`, source);
	}
	const bundle = await rollup({
		input: checked(path.join(sourceRoot, 'scene-entry.mjs')),
		plugins: [
			{
				name: 'experiment-runtime-alias',
				resolveId(id) {
					return id === 'dome-runtime-pass'
						? checked(path.join(repository, 'src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js'))
						: null;
				},
			},
			nodeResolve(),
		],
		onwarn(warning) {
			if (warning.code !== 'CIRCULAR_DEPENDENCY') {
				run.progress('bundle-warning', warning.message);
			}
		},
	});
	await bundle.write({file: path.join(run.root, 'scene-bundle.js'), format: 'iife'});
	await bundle.close();
	run.write(
		'index.html',
		'<!doctype html><meta charset="utf-8"><title>Flat dome Three.js integration</title><body style="margin:0;background:#000"><script src="scene-bundle.js"></script>',
	);
	const profile = path.join(run.root, 'browser');
	mkdirSync(profile);
	checked(profile, run.root);
	browser = await puppeteer.launch({
		headless: 'new',
		userDataDir: profile,
		protocolTimeout: 86400000,
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-background-timer-throttling',
		],
	});
	const page = await browser.newPage();
	const browserErrors = [];
	page.on('pageerror', (error) => browserErrors.push(String(error)));
	page.on('console', (message) => {
		if (message.type() === 'error') {
			browserErrors.push(message.text());
		}
	});
	await page.exposeFunction('domeProgress', (phase, message, counts) => run.progress(phase, message, counts));
	await page.exposeFunction('domeArtifact', (name, value) => {
		if (name.endsWith('.png')) {
			const png = new PNG({width: value.width, height: value.height});
			png.data = Buffer.from(value.rgba);
			run.write(name, PNG.sync.write(png));
		} else {
			run.write(name, value);
		}
	});
	/** @type {{results: DomeCachedRay[]}|undefined} */
	let raw;
	if (parity) {
		await page.exposeFunction('retainBuildProgress', (event) =>
			run.progress('raw-baseline', `Order${event.order}: ${event.completed}/${event.total}`),
		);
		await page.exposeFunction('retainCandidate', (result) => {
			raw = result;
			run.write('raw-query.json', result);
		});
		await page.exposeFunction('retainCandidateFailure', (result) => run.write('raw-failure.json', result));
		await page.evaluate(executeCandidate, {
			shaders: base,
			directionCount: 98,
			datasets: [{label: 'scene-parity', layout, cases: request.queries}],
		});
	}
	await page.goto(pathToFileURL(path.join(run.root, 'index.html')).href);
	const telemetry = /** @type {DomeSceneTelemetry} */ (
		await page.evaluate((inputs) => window.domeScene.execute(inputs), request)
	);
	run.write('telemetry.json', telemetry);
	if (!parity) {
		run.write('scene-verification.json', verifyScene(telemetry, request));
	}
	if (parity) {
		assert.ok(raw, 'Raw baseline result must exist before comparing Three queries.');
		const three = JSON.parse(readFileSync(path.join(run.root, 'three-query.json'), 'utf8'));
		let maximumRelative = 0,
			maximumAbsolute = 0;
		for (const row of three) {
			const baseline = raw.results.find((item) => item.id === row.id);
			for (let order = 0; order < 4; order++) {
				for (let channel = 0; channel < 15; channel++) {
					const expected = baseline.orders[order][channel],
						actual = row.orders[order][channel];
					const difference = Math.abs(actual - expected);
					maximumAbsolute = Math.max(maximumAbsolute, difference);
					maximumRelative = Math.max(maximumRelative, difference / Math.max(1e-9, Math.abs(expected)));
					assert.ok(
						Number.isFinite(actual) && actual >= 0 && difference <= 1e-9 + 1e-4 * Math.abs(expected),
						`Three/raw parity: ${row.id} J${order + 1} channel${channel}`,
					);
				}
			}
		}
		run.write('parity.json', {cases: three.length, maximumRelative, maximumAbsolute});
	}
	run.write('browser-errors.json', browserErrors);
	const cleanup = JSON.parse(readFileSync(path.join(run.root, 'cleanup.json'), 'utf8'));
	assert.equal(cleanup.after.textures, 0, 'Completed scene must release owned textures.');
	assert.equal(cleanup.after.geometries, 0, 'Completed scene must release owned geometries.');
	assert.equal(browserErrors.length, 0, browserErrors.join('\n'));
	console.log(
		JSON.stringify({
			run: run.root,
			stage: request.stage,
			identity: telemetry.identity,
			frames: telemetry.frames.length,
		}),
	);
} catch (error) {
	failure = error;
	run.write('failure.json', {error: String(error), stack: error.stack});
} finally {
	await browser?.close().catch((error) => {
		failure ??= error;
	});
	run.finish(failure ? 'failed' : 'accepted', {
		message: failure ? String(failure) : 'Requested Three cache/scene stage completed with retained evidence.',
		parity,
		final,
	});
}
if (failure) {
	throw failure;
}
