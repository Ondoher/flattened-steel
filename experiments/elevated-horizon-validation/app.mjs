import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createWriteStream, readFileSync} from 'node:fs';
import {physical, ray} from './physics.mjs';
import puppeteer from 'puppeteer';
import {createRun, source, root, identity} from './io.mjs';

const run = createRun('app-inspect', 'Inspect actual production GPU shader, scene/depth and 10 km camera geometry.', [
	identity('dist/flat32/flat32.js'),
	identity('server/flat32/features/shared-cache/selection.js'),
]);
let failure, browser;
const log = createWriteStream(run.absolute + '/server.log', {flags: 'wx'});
const server = spawn(process.execPath, [source + '/serve.mjs'], {
	cwd: root,
	windowsHide: true,
	stdio: ['ignore', 'pipe', 'pipe'],
});
server.stdout.pipe(log);
server.stderr.pipe(log);
try {
	for (let i = 0; i < 100; i++) {
		try {
			if ((await fetch('http://127.0.0.1:8097/flat32/')).ok) break;
		} catch {}
		await new Promise((r) => setTimeout(r, 200));
	}
	browser = await puppeteer.launch({
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		headless: 'new',
		protocolTimeout: 600000,
		userDataDir: run.absolute + '/browser-profile',
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-background-timer-throttling',
		],
	});
	const page = await browser.newPage();
	await page.setViewport({width: 1024, height: 576, deviceScaleFactor: 1});
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	await page.goto('http://127.0.0.1:8097/flat32/', {waitUntil: 'domcontentloaded', timeout: 0});
	await page.waitForFunction(() => typeof window['__flat32Cleanup'] === 'function', {timeout: 90000});
	const cdp = await page.target().createCDPSession(),
		fn = await cdp.send('Runtime.evaluate', {expression: 'window.__flat32Cleanup'}),
		props = await cdp.send('Runtime.getProperties', {objectId: fn.result.objectId}),
		receiver = props.internalProperties.find((p) => p.name === '[[BoundThis]]').value;
	await cdp.send('Runtime.callFunctionOn', {
		objectId: receiver.objectId,
		functionDeclaration: 'function(){globalThis.proofApplication=this;}',
	});
	const ready = () =>
		page.waitForFunction(
			() => {
				const a = globalThis['proofApplication'];
				return (
					document.querySelector('.flat32-shell')['dataset'].flat32State === 'ready' &&
					!a._locationTimeRefreshTimer &&
					a._state.observation.instant === a._publishedState?.observation.instant &&
					a._state.observerHeight.value === a._publishedState?.observerHeight.value
				);
			},
			{timeout: 600000},
		);
	await ready();
	for (const [selector, value] of [
		['#flat32-location-control', '0'],
		['#flat32-elevation-control', '10000'],
	]) {
		await page.select(selector, value);
		await ready();
	}
	await page.evaluate(() => document.querySelector('button[data-flat32-globe-time="1"]')['click']());
	await ready();
	await page.evaluate(async () => {
		const a = globalThis['proofApplication'],
			m = a._modeController._activeRuntime._mode,
			c = a._sceneRuntime.camera;
		const d = m.geometry.expressCelestialDirectionInScene(m.geometry.configuration.directionToSource);
		const horizontal = Math.hypot(d[0], d[2]),
			el = (5 * Math.PI) / 180;
		c.lookAt(
			c.position.x - (d[0] / horizontal) * Math.cos(el),
			c.position.y + Math.sin(el),
			c.position.z - (d[2] / horizontal) * Math.cos(el),
		);
		c.updateMatrixWorld(true);
		a._sceneRuntime.requestRender();
		for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
	});
	const facts = await page.evaluate(() => {
		const a = globalThis['proofApplication'],
			r = a._modeController._activeRuntime,
			s = a._sceneRuntime,
			build = r._shaderHandle._buildResult,
			pass = r._composer.passes.find((p) =>
				p._material?.fragmentShader?.includes('ShaderState state = createInitialShaderState'),
			);
		globalThis['proofPass'] = pass;
		return {
			state: a._publishedState,
			runtimeKeys: Object.keys(r),
			buildKeys: Object.keys(build),
			passKeys: Object.keys(pass),
			uniforms: Object.fromEntries(
				Object.entries(pass.uniforms).map(([k, u]) => [
					k,
					{
						kind: u.value?.constructor?.name,
						value: typeof u.value === 'number' ? u.value : u.value?.toArray?.(),
					},
				]),
			),
			fragment: pass._material.fragmentShader,
			vertex: pass._material.vertexShader,
			sceneKeys: Object.keys(s),
			renderer: s.renderer
				.getContext()
				.getParameter(
					s.renderer.getContext().getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL,
				),
			error: s.renderer.getContext().getError(),
		};
	});
	run.write('fragment.glsl', facts.fragment);
	delete facts.fragment;
	run.write('facts.json', facts);
	run.write('scene.png', await (await page.$('canvas')).screenshot());

	const medium = physical(),
		horizon = (-Math.acos(medium.radius / (medium.radius + 10000)) * 180) / Math.PI;
	const views = [-1, -0.1, -0.02, 0.02, 0.1, 1].map((o) => ray(horizon + o)).concat([ray(0), ray(20)]);
	const probeSource = readFileSync(root + '/' + source + '/gpu-probe.js', 'utf8');
	const probe = /** @type {HorizonGpuProbeData} */ (
		await page.evaluate(
			probeSource.replace('export function gpuProbe', 'function gpuProbe') +
				'\ngpuProbe(' +
				JSON.stringify(views) +
				')',
		)
	);
	assert.ok(probe.snapshots.every((s) => s.data.every(Number.isFinite) && s.data.some((x) => x > 0)));
	run.write('gpu-probe.json', probe);
	run.write('controlled-probe.glsl', probe.controlledShader);
	assert.deepEqual(errors, []);
	assert.equal(facts.error, 0);
	await page.evaluate(() => window['__flat32Cleanup']());
} catch (error) {
	failure = String(error);
} finally {
	if (browser) await browser.close();
	server.kill();
	await new Promise((resolve) => server.once('close', resolve));
	await new Promise((resolve) => log.end(resolve));
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) throw new Error(failure);
