import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, existsSync, rmSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {createRun, checked, identity, command} from './io.mjs';

const [flat, globe] = process.argv.slice(2);
const json = p => JSON.parse(readFileSync(checked(p), 'utf8'));
const heights = [50, 40, 30, 20, 10], fovs = [20, 35];
const run = createRun('water-heights', 'Verify and publish GreenSea Flat/Globe50-10m elevation series', [flat, globe].map(p => identity(p + '/manifest.json')));
const work = run.absolute + '/browser';
let browser, failure;
try {
	for (const parent of [flat, globe]) {
		const manifest = json(parent + '/manifest.json');
		assert.equal(manifest.state, 'accepted');
		for (const artifact of manifest.artifacts) assert.equal(identity(artifact.path).sha256, artifact.sha256);
	}
	const fc = json(flat + '/control.json'), gc = json(globe + '/control.json');
	assert.deepEqual(fc.profile, gc.profile);
	assert.deepEqual(fc.groundTexture, gc.groundTexture);
	assert.equal(fc.groundTexture.id, 'green-sea-static-v1');
	assert.deepEqual(fc.heights, heights);
	assert.deepEqual(gc.views.map(v => v.height), heights);
	for (const control of [fc, gc]) {
		assert.deepEqual(control.objectHeights, heights);
		assert.deepEqual(control.objectFovs, fovs);
		assert.deepEqual(control.objectHeadings, [20]);
		assert.deepEqual(control.retainedObjectIndices, [5, 6]);
	}
	const rows = [];
	for (const height of heights) for (const fov of fovs) for (const [mode, parent] of [['flat', flat], ['globe', globe]]) {
		const pair = [];
		for (const visible of [true, false]) {
			const id = 'h' + height + '-yaw20-fov' + fov + (visible ? '-objects' : '-hidden');
			const frame = json(parent + '/objects-' + id + '.json');
			const encoded = readFileSync(checked(parent + '/objects-' + id + '.png64'), 'utf8');
			assert.ok(encoded.startsWith('data:image/png;base64,'));
			const bytes = Buffer.from(encoded.split(',')[1], 'base64'), png = PNG.sync.read(bytes);
			assert.deepEqual([png.width, png.height], [2048, 1152]);
			assert.equal(frame.id, id);
			assert.equal(frame.height.value, height);
			assert.equal(frame.state.observerHeight.value, height);
			assert.equal(frame.state.modeKind, mode === 'flat' ? 'flat-local' : 'spherical-distant');
			assert.equal(frame.state.locationIndex, 0);
			assert.equal(frame.camera.fov, fov);
			assert.equal(frame.state.cameraFieldOfViewDegrees, fov);
			assert.ok(Math.abs(frame.camera.position[1] * 1000 - height) < 1e-8);
			assert.equal(frame.profile, fc.profile.id);
			assert.equal(frame.state.reviewObjectsEnabled, visible);
			assert.equal(frame.objects.length, 6);
			assert.ok(frame.objects.every(o => o.visible === (visible && [5, 6].includes(Number(o.name.split('-').at(-1))))));
			assert.deepEqual(frame.retainedObjectIndices, [5, 6]);
			assert.equal(frame.yawDegreesFromMinusZ, 20);
			const pitch = mode === 'flat' ? 0 : -Math.acos(6360000 / (6360000 + height)) * 180 / Math.PI;
			assert.ok(Math.abs(frame.camera.pitchDegrees - pitch) < 1e-10);
			assert.equal(frame.glError, 0);
			assert.deepEqual(frame.viewport.canvas, [2048, 1152]);
			assert.deepEqual(frame.viewport.composer, [2048, 1152]);
			const material = frame.groundTexture;
			assert.equal(material.id, fc.groundTexture.id);
			assert.equal(material.color.sha256, fc.groundTexture.color.sha256);
			assert.equal(material.normal.sha256, fc.groundTexture.normal.sha256);
			assert.equal(material.vertexPositionsAndIndicesUnchanged, true);
			assert.equal(material.colorAttached, true);
			assert.equal(material.normalAttached, true);
			assert.equal(material.materialType, 'MeshLambertMaterial');
			assert.equal(material.tileWidthMeters, 100);
			assert.equal(material.normalStrength, 0.6);
			run.write(mode + '-' + id + '.png', bytes);
			run.write(mode + '-' + id + '.json', frame);
			pair.push({png, frame});
		}
		const [a, b] = pair;
		assert.deepEqual(a.frame.camera, b.frame.camera);
		assert.equal(a.frame.lux, b.frame.lux);
		assert.deepEqual(a.frame.objects.map(o => ({name: o.name, position: o.position, size: o.size})), b.frame.objects.map(o => ({name: o.name, position: o.position, size: o.size})));
		let changed = 0, maximum = 0, nonblack = 0;
		for (let i = 0; i < a.png.data.length; i += 4) {
			const d = Math.max(...[0, 1, 2].map(c => Math.abs(a.png.data[i + c] - b.png.data[i + c])));
			maximum = Math.max(maximum, d);
			if (d > 1) changed++;
			if (a.png.data[i] || a.png.data[i + 1] || a.png.data[i + 2]) nonblack++;
		}
		assert.ok(nonblack > 2048 * 1152 * 0.9);
		assert.ok(changed > 0);
		assert.ok(a.frame.objects.some(o => o.visible && o.inFrustum));
		rows.push({height, fov, mode, pixelsChangedByMoreThanOne: changed, maximumRgbByteDifference: maximum, parent: identity(parent + '/objects-h' + height + '-yaw20-fov' + fov + '-objects.png64')});
	}
	run.write('comparison.json', {heights, fovs, rows, groundTexture: fc.groundTexture, profile: fc.profile.id, operation: 'Native PNG data URLs decoded byte-for-byte; same scene/material settings except requested elevation and corresponding horizon pitch. Matching all-hidden object controls retained.', scope: 'Static GreenSea material trial. Flat/local ClosestN1 versus Globe/distant noonN1-4 retain different source geometry/native adaptation. No reflective-water model, displacement, new atmosphere/cache or Bruneton score claim.'});
	run.write('index.html', `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>GreenSea elevation comparison</title><style>body{font:16px system-ui;background:#17222d;color:#eef;margin:24px}a{color:#9df}label{display:inline-block;margin:0 20px 12px 0}select{font:inherit}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{display:block;width:100%;height:auto}@media(max-width:1050px){.pair{grid-template-columns:1fr}}</style><h1>GreenSea:50m down to10m</h1><p>San Jose, same ARM atmosphere, original back two objects, horizon centered. Native2048x1152; click either image for full size.</p><label>Elevation <select id="height">${heights.map(h => `<option value="${h}">${h}m</option>`).join('')}</select></label><label>Vertical FOV <select id="fov">${fovs.map(f => `<option value="${f}">${f} degrees</option>`).join('')}</select></label><label><input type="checkbox" id="hidden"> Hide objects for comparison</label><div class="pair">${[['flat', 'Flat/local - Closest'], ['globe', 'Globe/distant - Noon']].map(([mode, label]) => `<article><h2>${label}</h2><a class="full" data-mode="${mode}" href="${mode}-h50-yaw20-fov20-objects.png"><img id="${mode}" src="${mode}-h50-yaw20-fov20-objects.png" alt="${label},GreenSea,50m"></a><p><a class="metadata" data-mode="${mode}" href="${mode}-h50-yaw20-fov20-objects.json">Metadata</a></p></article>`).join('')}</div><p>GreenSea color and normal maps on the existing matte ground:100m-wide repeating tiles, normal strength0.6. Static appearance only; repetition and fixed photographic lighting remain visible. Ground geometry/atmosphere are unchanged. Flat/localN1 and GlobeN1-4 retain different source geometry/native exposure.</p><p>Texture: Keith333, <a href="https://opengameart.org/content/water-batch-of-15-seamless-textures-with-normalmaps">OpenGameArt</a>, CC BY3.0; original images scaled/repeated as color/normal maps. <a href="comparison.json">Conditions and derivation</a>.</p><script>function update(){const h=document.querySelector('#height').value,f=document.querySelector('#fov').value,suffix=document.querySelector('#hidden').checked?'hidden':'objects';for(const mode of ['flat','globe']){const id=mode+'-h'+h+'-yaw20-fov'+f+'-'+suffix;document.getElementById(mode).src=id+'.png';document.getElementById(mode).alt=mode+',GreenSea,'+h+'m,'+f+'degree FOV';document.querySelector('a.full[data-mode="'+mode+'"]').href=id+'.png';document.querySelector('a.metadata[data-mode="'+mode+'"]').href=id+'.json';}}for(const id of ['height','fov','hidden'])document.getElementById(id).onchange=update;</script>`);
	mkdirSync(work); mkdirSync(work + '/temp');
	browser = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: work, env: {...process.env, TEMP: work + '/temp', TMP: work + '/temp'}, args: ['--disable-gpu']});
	const page = await browser.newPage(), errors = [];
	page.on('pageerror', e => errors.push(String(e)));
	await page.goto(pathToFileURL(checked(run.path + '/index.html')).href, {waitUntil: 'load'});
	const checks = await page.evaluate(async () => {
		const height = /** @type {HTMLSelectElement} */(document.querySelector('#height')), fov = /** @type {HTMLSelectElement} */(document.querySelector('#fov')), hidden = /** @type {HTMLInputElement} */(document.querySelector('#hidden')), result = [];
		for (const h of [...height.options]) for (const f of [...fov.options]) for (const value of [false, true]) {
			height.value = h.value; fov.value = f.value; hidden.checked = value; height.dispatchEvent(new Event('change'));
			const images = ['flat', 'globe'].map(id => /** @type {HTMLImageElement} */(document.getElementById(id)));
			await Promise.all(images.map(i => i.decode()));
			result.push({height: Number(h.value), fov: Number(f.value), hidden: value, sizes: images.map(i => [i.naturalWidth, i.naturalHeight]), sourceNamesMatch: images.every(i => i.src.endsWith('-h' + h.value + '-yaw20-fov' + f.value + (value ? '-hidden' : '-objects') + '.png'))});
		}
		return result;
	});
	assert.equal(checks.length, 20);
	assert.ok(checks.every(c => c.sourceNamesMatch && c.sizes.every(s => s[0] === 2048 && s[1] === 1152)));
	assert.deepEqual(errors, []);
	const types = await command(run, 'typecheck', ['node_modules/typescript/bin/tsc', '-p', 'experiments/clean-horizon-profiles/jsconfig.json']);
	assert.equal(types.code, 0, types.stdout + types.stderr);
	run.write('verification.json', {rows, browserChecks: checks, errors, typecheck: 'passed', primaryFrames: 20, hiddenControls: 20, scope: 'Actual height/FOV/material/geometry/visibility and native image checks; no new reference accuracy or performance benchmark.'});
	console.log(JSON.stringify({report: run.path + '/index.html', primaryFrames: 20}));
} catch (error) {
	failure = String(error); run.write('failure.json', {failure}); console.error(error);
} finally {
	await browser?.close();
	if (existsSync(work)) rmSync(checked(run.path + '/browser'), {recursive: true});
}
run.finish(failure ? 'failed' : 'accepted', {failure});
if (failure) process.exitCode = 1;
