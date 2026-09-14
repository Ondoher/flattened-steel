import {randomUUID, randomBytes} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer';
import express from 'express';
import registerFlat32Routes from '../../../server/flat32-router.js';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import Files from './DistantSunSharedCacheGenerationFiles.js';
import SharedService from '../../../server/flat32/features/shared-cache/DistantSunSharedCachePackageService.js';
import Oracle from './DistantSunSharedRuntimeOracle.js';
import {createDistantSunSceneCachePackageService} from '../../../server/flat32/DistantSunSceneCachePackageService.js';

const repository = fileURLToPath(new URL('../../../', import.meta.url));
const files = new Files(repository);
const performanceOnly = process.argv.includes('--performance');
const motionOnly = process.argv.includes('--motion');
const lifecycleOnly = process.argv.includes('--lifecycle');
const rollout = process.argv.includes('--rollout');
const darkStart = process.argv.includes('--dark-start');
const dual = process.argv.includes('--dual');
const recordingParent = process.argv.find((argument) => argument.startsWith('--record='))?.slice(9);
const full = process.argv.includes('--full') || performanceOnly;
const correctnessOnly = process.argv.includes('--correctness');
const candidateRoot = process.argv.find((argument) => argument.startsWith('--package-root='))?.slice(15);
const candidateHash = process.argv.find((argument) => argument.startsWith('--package-sha256='))?.slice(17);
const selectedProfile = process.argv.find((argument) => argument.startsWith('--profile='))?.slice(10);
const solarInterpolation =
	process.argv.find((argument) => argument.startsWith('--solar-interpolation='))?.slice(22) ?? 'linear';
if (!['linear', 'monotone-cubic'].includes(solarInterpolation))
	throw new RangeError('Unsupported solar interpolation.');
if (candidateRoot || candidateHash || selectedProfile) {
	if (!candidateRoot || !/^[a-f0-9]{64}$/u.test(candidateHash ?? '') || selectedProfile !== 'native15-n4-q30') {
		throw new Error(
			'Candidate qualification requires --package-root, --package-sha256 and --profile=native15-n4-q30.',
		);
	}
	if (rollout) throw new Error('Candidate selection cannot use the deployed rollout route.');
}
const parent =
	candidateRoot ??
	'tmp/production-algorithm32/distant-sun-shared-block-cache/runs/2026-09-10T14-57-40-947Z-f747d2ec-9571-474f-89e6-b0783bbf3752/published/7e80317f53c79d0d5a30ebc006630213a2e758008c62a3abb14d2534a8cc2b99';
const report = candidateRoot
	? {
			path: 'package-set.json',
			byteLength: (await files.read(`${parent}/package-set.json`)).byteLength,
			sha256: candidateHash,
		}
	: {
			path: 'package-set.json',
			byteLength: 3268,
			sha256: 'eee22091d2f1deb8e992f22be47243a07e7f4bc9462d25ee89683352cca19069',
		};
const run = `tmp/production-algorithm32/distant-sun-shared-block-cache/qualification/${new Date().toISOString().replace(/[:.]/gu, '-')}-${randomUUID()}`;
await files.directory(run);
const profile = await files.directory(`${run}/browser-profile`);
const sourcePath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSharedRuntimeQualificationBrowser.js';
const prefix = `/${randomBytes(18).toString('hex')}/`;
const productionRouter = express();
if (rollout) await registerFlat32Routes(null, productionRouter, {getRouterRoot: () => prefix.slice(0, -1)});
const shared = await new SharedService(await files.resolve(parent)).load(report);
const dense = await createDistantSunSceneCachePackageService();
const oracle = await new Oracle().load(files, parent, report, Boolean(candidateRoot));
const oracles = new Map();
const bundle = await rollup({
	input: await files.resolve(sourcePath),
	plugins: [
		{
			name: 'qualification-browser-environment',
			transform: (code) => ({
				code: code.replaceAll('process.env.NODE_ENV', JSON.stringify('production')),
				map: null,
			}),
		},
		nodeResolve({browser: true}),
		/** @type {SharedQualificationCommonJsFactory} */ (/** @type {unknown} */ (commonjs))(),
	],
	onwarn: (warning) => {
		if (!['CIRCULAR_DEPENDENCY', 'THIS_IS_UNDEFINED'].includes(warning.code)) throw new Error(warning.message);
	},
});
let bundleArtifact;
try {
	const {output} = await bundle.generate({format: 'es', inlineDynamicImports: true});
	bundleArtifact = await files.write(`${run}/qualification.js`, Buffer.from(output[0].code));
} finally {
	await bundle.close();
}
const html =
	'<!doctype html><meta charset="utf-8"><style>html,body,#main-content,.flat32-shell{margin:0;width:100%;height:100%;overflow:hidden}.flat32-viewport{position:fixed;inset:0}canvas{width:100%;height:100%;display:block}.flat32-shell> :not(.flat32-viewport){display:none}</style><div id="main-content"></div><script type="module" src="qualification.js"></script>';
let origin, browser;
const requests = [],
	consoleMessages = [];
const server = createServer(async (request, response) => {
	try {
		if (request.method !== 'GET' || `http://${request.headers.host}` !== origin) {
			response.writeHead(403).end();
			return;
		}
		const url = new URL(request.url, origin);
		if (url.pathname === '/favicon.ico') {
			response.writeHead(204).end();
			return;
		}
		if (!url.pathname.startsWith(prefix)) {
			response.writeHead(404).end();
			return;
		}
		const route = decodeURIComponent(url.pathname.slice(prefix.length));
		if (rollout && (route === 'api/shared' || route.startsWith('scene-caches/'))) {
			request.url = route === 'api/shared' ? `/api/distant-sun-scene-cache${url.search}` : `/${route}`;
			productionRouter(request, response, (error) => {
				response.writeHead(error ? 500 : 404).end();
			});
			return;
		}
		const send = (body, type = 'application/json', immutable = false) => {
			response.writeHead(200, {
				'content-type': type,
				'content-length': Buffer.byteLength(body),
				'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-store',
			});
			response.end(body);
		};
		if (route === '') {
			send(html, 'text/html');
			return;
		}
		if (route.startsWith('oracle/')) {
			const id = route.slice('oracle/'.length);
			if (!oracles.has(id)) {
				const value = await oracle.block(id);
				const bytes = Buffer.from(JSON.stringify(value));
				await files.write(`${run}/oracle-${files.hash(id)}.json`, bytes);
				oracles.set(id, bytes);
			}
			send(oracles.get(id));
			return;
		}
		if (route === 'api/shared' || route === 'api/dense') {
			const degrees = Number(url.searchParams.get('solarZenithDegrees'));
			const selection =
				route === 'api/shared'
					? shared.resolve(degrees, `${prefix}scene-caches/`)
					: dense.resolve(degrees, `${prefix}dense-caches/`);
			if (selection.cacheFormat === 'algorithm32-distant-sun-shared-block-v1') {
				/** @type {Flat32SharedCacheAssetSelection} */ (selection.asset).solarInterpolation =
					/** @type {DistantSunSolarInterpolationMethod} */ (solarInterpolation);
			}
			if (
				dual &&
				selection.cacheFormat === 'algorithm32-distant-sun-shared-block-v1' &&
				selection.status === 'ready'
			)
				/** @type {Flat32SharedCacheAssetSelection} */ (selection.asset).transitionQualification = {
					evidenceId: `qualification-candidate:${run}`,
					targetId: 'NVIDIA GeForce RTX 2060 / Chrome 153 / ANGLE D3D11',
					maximumBytes: 859963392,
				};
			send(JSON.stringify(selection));
			return;
		}
		if (route.startsWith('scene-caches/')) {
			const asset = await shared.resolveAsset(route.slice('scene-caches/'.length));
			send(asset.bytes, asset.contentType, true);
			return;
		}
		let file;
		if (route.startsWith('dense-caches/'))
			file = (await dense.resolveAsset(route.slice('dense-caches/'.length))).path;
		else if (route === 'qualification.js') file = await files.resolve(bundleArtifact.path);
		else if (route === 'shared-cache-worker.js') file = await files.resolve('dist/flat32/shared-cache-worker.js');
		else if (route.startsWith('stellar-catalogs/brightest-2000-stellar-package-v1/'))
			file = await files.resolve('server/flat32/data/' + route.slice('stellar-catalogs/'.length));
		else if (route.startsWith('presentation-filters/human-vision-filter-package-v1/'))
			file = await files.resolve('server/flat32/data/' + route.slice('presentation-filters/'.length));
		else {
			response.writeHead(404).end();
			return;
		}
		const facts = await stat(file);
		response.writeHead(200, {
			'content-type': file.endsWith('.js')
				? 'text/javascript'
				: file.endsWith('.json')
					? 'application/json'
					: 'application/octet-stream',
			'content-length': facts.size,
			'cache-control': 'no-store',
		});
		createReadStream(file)
			.on('error', () => response.destroy())
			.pipe(response);
	} catch (error) {
		response
			.writeHead(400, {'content-type': 'application/json'})
			.end(JSON.stringify({error: 'Qualification asset unavailable.'}));
		console.error(error.message);
	}
});
const implementation = [];
for (const name of [
	'qualify-shared-runtime.js',
	'DistantSunSharedRuntimeOracle.js',
	'DistantSunSharedRuntimeQualificationBrowser.js',
]) {
	const source = `scripts/algorithm32/solar-zenith-cache/${name}`,
		bytes = await files.read(source);
	implementation.push({path: source, byteLength: bytes.length, sha256: files.hash(bytes)});
}
for (const source of [
	'server/flat32/features/shared-cache/DistantSunSharedCachePackageService.js',
	'server/flat32/features/shared-cache/selection.js',
	'server/flat32-router.js',
	'dist/flat32/shared-cache-worker.js',
]) {
	const bytes = await files.read(source);
	implementation.push({path: source, byteLength: bytes.length, sha256: files.hash(bytes)});
}
let result = {
	accepted: false,
	phase: 'starting',
	parent: {root: parent, report},
	bundle: bundleArtifact,
	run,
	implementation,
	tools: {node: process.version},
	parameters: {
		profile: selectedProfile ?? 'native15-n4-q30',
		solarInterpolation,
		nativeChannels: 15,
		scatteringOrder: 4,
		viewIntervals: 30,
		devicePixelRatio: 1,
		argv: process.argv.slice(2),
	},
};
try {
	await new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(undefined)));
	const address = server.address();
	if (typeof address === 'string' || !address) throw new Error('Qualification listener address is unavailable.');
	origin = `http://127.0.0.1:${address.port}`;
	browser = await puppeteer.launch({
		headless: 'new',
		userDataDir: profile,
		executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
		protocolTimeout: 300000,
		args: [
			'--enable-gpu',
			'--enable-webgl',
			'--ignore-gpu-blocklist',
			'--use-angle=d3d11',
			'--disable-background-timer-throttling',
			'--window-size=1280,720',
		],
	});
	const page = await browser.newPage();
	await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
	page.on('console', (message) => {
		consoleMessages.push({type: message.type(), text: message.text()});
		if (message.type() === 'error') console.error(message.text());
	});
	page.on('pageerror', (error) => {
		consoleMessages.push({type: 'pageerror', text: error.message});
		console.error(error.message);
	});
	page.on('request', (request) => {
		requests.push({url: new URL(request.url()).pathname.replace(prefix, '/'), time: performance.now()});
	});
	await page.goto(origin + prefix, {waitUntil: 'load'});
	await page.waitForFunction(() => Boolean(globalThis.sharedQualification));
	console.log(JSON.stringify({run, phase: 'browser-ready'}));
	const started = performance.now();
	result.initial = await page.evaluate(
		(dark) => globalThis.sharedQualification.start('shared', dark ? 108.001 : 90),
		darkStart,
	);
	if (darkStart && (result.initial.cache.gpuBytes !== 0 || result.initial.transport.requests !== 0))
		throw new Error('Initial darkness requested cache block data.');
	result.coldMilliseconds = performance.now() - started;
	console.log(
		JSON.stringify({phase: 'shared-ready', coldMilliseconds: result.coldMilliseconds, state: result.initial}),
	);
	if (lifecycleOnly) {
		result.lifecycle = await page.evaluate(() => globalThis.sharedQualification.lifecycle());
		await page.evaluate(() => {
			const gl = globalThis.sharedQualification._application._sceneRuntime.renderer.getContext();
			for (const name of [
				'deleteBuffer',
				'deleteVertexArray',
				'deleteTexture',
				'deleteProgram',
				'deleteFramebuffer',
				'deleteRenderbuffer',
			]) {
				const original = gl[name].bind(gl);
				gl[name] = (...args) => {
					original(...args);
					if (gl.getError() !== gl.NO_ERROR) console.error(new Error(`Disposal ${name}`).stack);
				};
			}
			globalThis.sharedQualification.dispose();
		});
		result.accepted = true;
		result.phase = 'lifecycle-complete';
	} else if (motionOnly || recordingParent) {
		await page.setViewport({width: 3840, height: 2160, deviceScaleFactor: 1});
		result.motion = [];
		let trace;
		if (recordingParent) {
			const bytes = await files.read(`${recordingParent}/result.json`);
			trace = JSON.parse(bytes.toString('utf8'));
			if (!trace.accepted || !trace.motion?.length)
				throw new Error('Recording requires an accepted measured motion parent.');
			result.traceParent = {
				path: `${recordingParent}/result.json`,
				byteLength: bytes.length,
				sha256: files.hash(bytes),
			};
		}
		for (const fov of [78, 55]) {
			await page.evaluate((fov) => {
				const camera = globalThis.sharedQualification._application._sceneRuntime.camera;
				camera.fov = fov;
				camera.updateProjectionMatrix();
			}, fov);
			await page.evaluate(() => globalThis.sharedQualification.measure(8));
			for (const [index, degrees] of [90.2, 90.3, 91, 92, 93, 92, 91, 90, 20].entries()) {
				const started = performance.now();
				let transition,
					failed = false;
				try {
					transition = await page.evaluate(
						(degrees) => globalThis.sharedQualification.transition(degrees),
						degrees,
					);
				} catch (error) {
					if (degrees !== 20) throw error;
					failed = true;
				}
				const evidence = {
					fov,
					degrees,
					failed,
					transition,
					elapsedMilliseconds: performance.now() - started,
					measurement: await page.evaluate(() => globalThis.sharedQualification.measure(8)),
				};
				if (recordingParent) {
					const imageName = `frame-${fov}-${index}.png`;
					evidence.image = await files.write(`${run}/${imageName}`, await page.screenshot({type: 'png'}));
					const measured = trace.motion.filter((item) => item.fov === fov)[index];
					if (measured?.degrees !== degrees)
						throw new Error('Recording order differs from its measured parent.');
					evidence.presentationMilliseconds =
						measured.elapsedMilliseconds +
						measured.measurement.durations.reduce((sum, value) => sum + value, 0);
				}
				result.motion.push(evidence);
				console.log(
					JSON.stringify({
						phase: recordingParent ? 'recorded' : 'motion',
						fov,
						degrees,
						failed,
						milliseconds: evidence.elapsedMilliseconds,
					}),
				);
			}
		}
		if (recordingParent) {
			const frames = result.motion.map((item) => ({
				image: item.image.path.split('/').at(-1),
				duration: item.presentationMilliseconds,
				fov: item.fov,
				degrees: item.degrees,
			}));
			const replay = `<!doctype html><meta charset="utf-8"><title>Measured shared-cache motion replay</title><style>body{margin:0;background:#111;color:white;font:16px sans-serif}img{width:100%;height:95vh;object-fit:contain}</style><p id="label"></p><img id="frame"><script>const frames=${JSON.stringify(frames)};let i=0;function show(){const f=frames[i++%frames.length];document.getElementById('label').textContent='Measured holds; Q30; FOV '+f.fov+'; solar zenith '+f.degrees;document.getElementById('frame').src=f.image;setTimeout(show,f.duration)}show();</script>`;
			result.replay = await files.write(`${run}/replay.html`, Buffer.from(replay));
		}
		result.accepted = result.motion.every(
			(item) =>
				item.measurement.state.glError === 0 &&
				item.measurement.state.coherence.failures.length === 0 &&
				item.failed === (!dual && item.degrees === 20),
		);
		result.phase = recordingParent ? 'recording-complete' : 'motion-complete';
	} else {
		if (!performanceOnly) result.probes = [await page.evaluate(() => globalThis.sharedQualification.probe())];
		const sharedPixels = new Map();
		if (full) sharedPixels.set(90, await page.evaluate(() => globalThis.sharedQualification.pixels()));
		result.transitions = [];
		for (const degrees of [90, 91, 90, 91]) {
			const transition = await page.evaluate(
				(degrees) => globalThis.sharedQualification.transition(degrees),
				degrees,
			);
			result.transitions.push(transition);
			console.log(JSON.stringify({phase: 'transition', degrees, milliseconds: transition.elapsedMilliseconds}));
			if (!performanceOnly) result.probes.push(await page.evaluate(() => globalThis.sharedQualification.probe()));
		}
		if (full) sharedPixels.set(91, await page.evaluate(() => globalThis.sharedQualification.pixels()));
		result.measurement = await page.evaluate(() => globalThis.sharedQualification.measure(24));
		await files.write(`${run}/shared.png`, await page.screenshot({type: 'png'}));
		if (full) {
			if (!correctnessOnly) {
				await page.setViewport({width: 3840, height: 2160, deviceScaleFactor: 1});
				await page.evaluate(
					() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
				);
				result.native4k78 = await page.evaluate(() => globalThis.sharedQualification.measure(80));
				if (result.native4k78.state.drawingBuffer.join('x') !== '3840x2160')
					throw new Error('Native 4K drawing buffer mismatch.');
				await files.write(`${run}/native-4k-fov78.png`, await page.screenshot({type: 'png'}));
				await page.evaluate(() => {
					const camera = globalThis.sharedQualification._application._sceneRuntime.camera;
					camera.fov = 55;
					camera.updateProjectionMatrix();
				});
				result.native4k55 = await page.evaluate(() => globalThis.sharedQualification.measure(80));
				await files.write(`${run}/native-4k-fov55.png`, await page.screenshot({type: 'png'}));
				console.log(JSON.stringify({phase: 'native-4k-measured'}));
			}
			if (!performanceOnly) {
				result.lifecycle = await page.evaluate(() => globalThis.sharedQualification.lifecycle());
				console.log(JSON.stringify({phase: 'lifecycle-complete'}));
				result.inventory = await page.evaluate(() => globalThis.sharedQualification.completeInventory());
				console.log(JSON.stringify({phase: 'all89-gpu-oracle-complete'}));
			}
			await page.evaluate(() => globalThis.sharedQualification.dispose());
			await page.setViewport({width: 1280, height: 720, deviceScaleFactor: 1});
			await page.evaluate(() => globalThis.sharedQualification.start('dense'));
			result.comparisons = [];
			for (const degrees of [90, 91]) {
				if (degrees !== 90)
					await page.evaluate((degrees) => globalThis.sharedQualification.transition(degrees), degrees);
				const control = await page.evaluate(() => globalThis.sharedQualification.pixels());
				const candidate = sharedPixels.get(degrees),
					a = Buffer.from(candidate.base64, 'base64'),
					b = Buffer.from(control.base64, 'base64');
				if (candidate.width !== control.width || candidate.height !== control.height || a.length !== b.length)
					throw new Error('Rendered control dimensions mismatch.');
				let differing = 0,
					maximum = 0,
					total = 0;
				for (let index = 0; index < a.length; index++) {
					const delta = Math.abs(a[index] - b[index]);
					if (delta) differing++;
					maximum = Math.max(maximum, delta);
					total += delta;
				}
				const comparison = {
					degrees,
					dimensions: [control.width, control.height],
					candidateSha256: files.hash(a),
					controlSha256: files.hash(b),
					differingChannels: differing,
					maximumByteDifference: maximum,
					meanByteDifference: total / a.length,
				};
				result.comparisons.push(comparison);
				await files.write(`${run}/shared-${degrees}.rgba`, a);
				await files.write(`${run}/dense-${degrees}.rgba`, b);
				console.log(JSON.stringify({phase: 'rendered-comparison', ...comparison}));
				if (maximum > 1)
					throw new Error('Rendered candidate differs by more than one display quantization step.');
			}
			if (performanceOnly) {
				await page.setViewport({width: 3840, height: 2160, deviceScaleFactor: 1});
				await page.evaluate(
					() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
				);
				result.denseNative4k78 = await page.evaluate(() => globalThis.sharedQualification.measure(80));
				await page.evaluate(() => {
					const camera = globalThis.sharedQualification._application._sceneRuntime.camera;
					camera.fov = 55;
					camera.updateProjectionMatrix();
				});
				result.denseNative4k55 = await page.evaluate(() => globalThis.sharedQualification.measure(80));
			}
		}
		result.accepted = result.transitions.every(
			(item) =>
				item.after.sameRuntime &&
				item.after.sameHandle &&
				item.after.glError === 0 &&
				item.after.coherence.failures.length === 0 &&
				JSON.stringify(item.after.direction) === JSON.stringify(item.after.geometryDirection),
		);
		result.phase = full ? 'combined-complete' : 'smoke-complete';
	}
	result.browser = await browser.version();
} catch (error) {
	result.error = error.stack;
	console.error(error.stack);
} finally {
	await browser?.close();
	server.closeAllConnections();
	await new Promise((resolve) => server.close(resolve));
	result.requests = requests;
	result.console = consoleMessages;
	const unexpectedErrors = consoleMessages.filter(
		(message) =>
			message.type === 'error' ||
			message.type === 'pageerror' ||
			/WebGL: INVALID_|WebGL: OUT_OF_MEMORY/u.test(message.text),
	);
	if (unexpectedErrors.length) {
		result.accepted = false;
		result.error = `Unexpected browser errors: ${unexpectedErrors.length}`;
	}
	const artifact = await files.write(`${run}/result.json`, Buffer.from(JSON.stringify(result, null, 2) + '\n'));
	console.log(JSON.stringify({accepted: result.accepted, artifact, run}));
}
if (!result.accepted) process.exitCode = 1;
