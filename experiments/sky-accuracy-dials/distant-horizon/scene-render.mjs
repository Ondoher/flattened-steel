import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire, builtinModules} from 'node:module';
import path from 'node:path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {
	createProductionSharedCacheService,
	SHARED_PACKAGE_ROOT,
	SHARED_PACKAGE_REPORT,
	SHARED_PACKAGE_IDENTITY,
} from '../../../server/flat32/features/shared-cache/selection.js';
import {DistantSunSceneCacheCompilerInputs as Inputs} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheCompilerInputs.js';
import {DistantSunSceneCacheNumerics} from '../../../scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheNumerics.js';
import {
	createRun,
	identity,
	readRepository,
	repositoryRoot,
	resolveRepository,
	checkedAbsolute,
	sha256,
	verifyRun,
} from '../io/files.mjs';
import {gzipSync} from 'node:zlib';
import {originalPhase} from './toronto-phase.js';

const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Render matched production/candidate noon captures using the hardware GPU and unchanged application shader.
 * @returns {Promise<void>} Sealed images and provenance; failed runs retain their real state and owned resources are closed.
 */
async function main() {
	assert.equal(process.argv.length,3);
	const profile=process.argv[2];assert.ok(profile==='canonical'||profile==='toronto');
	const parents = /** @type {DialFileIdentity[]} */ ([]);
	checkedAbsolute(path.resolve(SHARED_PACKAGE_ROOT));
	const reportRelative = path
		.relative(repositoryRoot, path.join(SHARED_PACKAGE_ROOT, SHARED_PACKAGE_REPORT.path))
		.replaceAll('\\', '/');
	const reportBytes = readRepository(reportRelative, SHARED_PACKAGE_REPORT);
	parents.push(identity(reportRelative, reportBytes));
	const report = JSON.parse(reportBytes.toString());
	const configurationPath = path
		.relative(repositoryRoot, path.join(SHARED_PACKAGE_ROOT, report.configurations[0].path))
		.replaceAll('\\', '/');
	const configuration = JSON.parse(readRepository(configurationPath, report.configurations[0]).toString());
	parents.push(identity(configurationPath));
	const inputs = Inputs.createInputSet(Inputs.createQualifiedSanJoseNauticalScene(), {
		solarInterpolation: 'monotone-cubic',
		numericalPolicy: DistantSunSceneCacheNumerics.createAnchoredRadial(),
	});
	assert.equal(
		inputs.numericalIdentity,
		configuration.numericalIdentity,
		'Compiler controls must match the deployed package.',
	);
	const baseline = /** @type {DistantSunSceneCacheCompilerBuildRequest} */ ({
		...inputs.buildRequest,
		transportSpec: {
			...inputs.buildRequest.transportSpec,
			shaderProfile: {coordinateContract: 'scene-cache-receiver-local-v1'},
		},
	});
	const adapted = {...baseline,id:'attribution-scene-60',transportSpec:{...baseline.transportSpec,numerical:{...baseline.transportSpec.numerical,transportIntervalCount:60}}};
	const torontoParent='tmp/experiments/sky-accuracy-dials/runs/00310-h45-toronto-prod';
	parents.push(verifyRun(torontoParent),identity(torontoParent+'/control.json'));
	const material=profile==='toronto'?JSON.parse(readRepository(torontoParent+'/control.json').toString()).material:null;
	const control = /** @type {AttributionSceneControl} */ ({baseline, candidate: adapted,profile,material});
	const run = createRun(profile==='toronto'?'h53-scene-tor':'h53-scene-prod', {
		parents,
		operation:
			'Render matched original15 and normalized60 cache builds in the unchanged Flat32 production renderer, with canonical or Toronto optical material. Same camera, ground, source, view integration and display. Full recurrence fields and all15 wavelengths; no production edits.',
		parameters: {
			maximumMilliseconds: 1800000,
			maximumExtraRetainedBytes: 12 * 1024 ** 2,
			viewport: {width: 1024, height: 768},
			horizontalFovDegrees: 60,
			cameraPitchDegrees: 5,
			headingFromSunDegrees: 180,
			productionPackage: SHARED_PACKAGE_IDENTITY,
			control,
			parity: {channel: 7, maximumRelative: 0.0001, absoluteFloor: 1e-12},
			scope: 'Contained scene comparison only; transport15 to60 plus aerosol phase-mass normalization. Within each pair the optical material, receiver lighting and display remain fixed. No RMSE/twilight qualification or promotion.',
		},
	});
	const started = performance.now();
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>>|undefined} */ let browser;
	/** @type {ReturnType<typeof createServer>|undefined} */ let host;
	let failure = null;
	const consoleMessages = [],
		serverFailures = [],
		servedAssets = new Map(),
		files = [];
	try {
		const compilerPath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
		const original = readRepository(compilerPath).toString('utf8');
		const phasePath=resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').split(path.sep).join('/');
		let baselineSource=original.replaceAll('\r\n','\n');
		if(profile==='toronto'){
		 assert.equal(baselineSource.split(originalPhase).length,2);
		 baselineSource=`import {torontoPhaseGlsl} from '${phasePath}';\n`+baselineSource.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
		}
		const begin=baselineSource.indexOf('function scatterFragment('),end=baselineSource.indexOf('function transportFragment(',begin);
		assert.ok(begin>=0&&end>begin);
		let part=baselineSource.slice(begin,end);
		const needle="'sum += incomingRadiance * scattering * incomingRecord.w;'";
		assert.equal(part.split(needle).length,2);
		part=part.replace(needle,"'sum += incomingRadiance * scattering * incomingRecord.w; mieSum += incomingRadiance * medium.mieScattering * miePhase(outgoing,incoming) * incomingRecord.w; mieMass += miePhase(outgoing,incoming) * incomingRecord.w;'");
		assert.equal(part.split('float sum = 0.0;').length,2);assert.equal(part.split('outputValue = sum;').length,2);
		part=part.replace('float sum = 0.0;','float sum = 0.0; float mieSum=0.0; float mieMass=0.0;').replace('outputValue = sum;','outputValue = sum - mieSum + mieSum/max(mieMass,1e-12);');
		const transformed=baselineSource.slice(0,begin)+part+baselineSource.slice(end);
		run.write('baseline-compiler.js.gz',gzipSync(Buffer.from(baselineSource)));
		run.write('candidate-compiler.js.gz',gzipSync(Buffer.from(transformed)));
		run.write('transform.json',{parent:identity(compilerPath),profile,baselineSha256:sha256(baselineSource),candidateSha256:sha256(transformed),changes:['transportIntervalCount15to60','Mie phase mass normalized at each higher-order scatter pass'],atmosphereUnchangedWithinPair:true});
		const shim=resolveRepository('experiments/sky-accuracy-dials/distant-horizon/scene-compiler.js');
		const transformPlugin={name:'contained-scene-attribution',
		 /** Resolve derived compiler imports through their source owner. @param {string} source @param {string|undefined} importer */
		 async resolveId(source,importer){if(importer===shim&&source.startsWith('.'))return this.resolve(source,resolveRepository(compilerPath),{skipSelf:true});return null;},
		 /** Supply authenticated derived code without editing production. @param {string} id @returns {string|null} */
		 load(id){if(id===shim)return transformed;if(id===resolveRepository(compilerPath))return baselineSource;return null;}
		};
		const service = await createProductionSharedCacheService(),
			routes = new Map();
		/** Bundle one read-only entry and retain its exact source graph. @param {string} relative @param {boolean} browserBuild @returns {Promise<Buffer>} */
		async function bundle(relative, browserBuild = true) {
			resolveRepository(relative);
			const build = await rollup({
				input: path.join(repositoryRoot, relative),
				...(browserBuild ? {} : {external: (id) => id.startsWith('node:') || builtinModules.includes(id)}),
				plugins: [transformPlugin, nodeResolve({browser: browserBuild}), commonjs()],
				onwarn: (warning) => consoleMessages.push({type: 'bundle-warning', text: warning.message}),
			});
			try {
				files.push(...build.watchFiles);
				return Buffer.from(
					(await build.generate({format: 'es', inlineDynamicImports: true})).output[0].code.replaceAll(
						'process.env.NODE_ENV',
						JSON.stringify('production'),
					),
				);
			} finally {
				await build.close();
			}
		}
		run.progress('bundle', 'Build unchanged scene renderer and contained paired compiler graph.');
		const browserBundle = await bundle('experiments/sky-accuracy-dials/distant-horizon/scene-browser.js');
		routes.set('/bundle.js', browserBundle);
		run.write('bundle.js.gz', gzipSync(browserBundle));
		const worker = await bundle('src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheWorker.js');
		routes.set('/shared-cache-worker.js', worker);
		run.write('shared-cache-worker.js.gz', gzipSync(worker));
		await bundle('server/flat32/features/shared-cache/selection.js', false);
		for (const [url, disk, names] of [
			[
				'/stellar-catalogs/brightest-2000-stellar-package-v1/',
				'server/flat32/data/brightest-2000-stellar-package-v1',
				[
					'manifest.json',
					'catalog-roster.json',
					'native15-packets.json',
					'members-rgba32f.bin',
					'spectra-r32f.bin',
				],
			],
			[
				'/presentation-filters/human-vision-filter-package-v1/',
				'server/flat32/data/human-vision-filter-package-v1',
				['manifest.json', 'native15-scotopic-weights.json'],
			],
		])
			for (const name of names) {
				const relative = `${disk}/${name}`;
				routes.set(url + name, readRepository(relative));
				files.push(resolveRepository(relative));
			}
		const sources = [...new Set(files)]
			.filter((file) => !file.startsWith('\0'))
			.sort()
			.map((file) => identity(path.relative(repositoryRoot, file).replaceAll('\\', '/')));
		sources.push(identity('package-lock.json'));
		run.write('inputs.json', {control, configuration, sources, package: SHARED_PACKAGE_IDENTITY});
		const html =
			'<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:1024px;height:768px;overflow:hidden}.flat32-viewport{width:1024px;height:768px}.flat32-canvas{display:block;width:100%;height:100%}.flat32-scene-controls,.flat32-time-panel,#capture-result,#candidate-trigger{display:none}</style><div id="main-content"></div><pre id="capture-result"></pre><button id="candidate-trigger"></button><script type="module" src="/bundle.js"></script>';
		run.write('capture-host.html', html);
		host = createServer(async (request, response) => {
			try {
				const url = new URL(request.url, 'http://127.0.0.1');
				if (request.method === 'POST' && url.pathname === '/progress') {
					let body = '';
					for await (const chunk of request) {
						body += chunk;
						assert.ok(body.length < 8192);
					}
					const event = JSON.parse(body);
					run.progress('gpu', String(event.message), Number(event.completed), Number(event.total));
					response.writeHead(200).end();
					return;
				}
				assert.equal(request.method, 'GET');
				if (url.pathname === '/comparison-control') {
					response.setHeader('Content-Type', 'application/json');
					response.end(JSON.stringify(control));
					return;
				}
				if (url.pathname === '/api/distant-sun-scene-cache') {
					response.setHeader('Content-Type', 'application/json');
					response.end(
						JSON.stringify(
							service.resolve(Number(url.searchParams.get('solarZenithDegrees')), 'scene-caches/'),
						),
					);
					return;
				}
				if (url.pathname.startsWith('/scene-caches/')) {
					const relative = decodeURIComponent(url.pathname.slice(14)),
						asset = await service.resolveAsset(relative);
					servedAssets.set(relative, {
						path: relative,
						byteLength: asset.byteLength,
						sha256: sha256(asset.bytes),
					});
					response.setHeader('Content-Type', asset.contentType);
					response.end(asset.bytes);
					return;
				}
				if (url.pathname === '/') {
					response.setHeader('Content-Type', 'text/html');
					response.end(html);
					return;
				}
				const bytes = routes.get(url.pathname);
				if (!bytes) {
					response.writeHead(404).end();
					return;
				}
				response.setHeader(
					'Content-Type',
					url.pathname.endsWith('.js')
						? 'text/javascript'
						: url.pathname.endsWith('.json')
							? 'application/json'
							: 'application/octet-stream',
				);
				response.end(bytes);
			} catch (error) {
				serverFailures.push({url: request.url, error: String(error)});
				response.writeHead(500).end(String(error));
			}
		});
		await new Promise((resolve, reject) => {
			host.once('error', reject);
			host.listen(0, '127.0.0.1', () => resolve(undefined));
		});
		const address = host.address();
		assert.ok(address && typeof address !== 'string');
		const executable = checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		browser = await puppeteer.launch({
			executablePath: executable,
			headless: true,
			userDataDir: path.join(run.scratchPath, 'profile'),
			protocolTimeout: 1850000,
			args: [
				'--enable-gpu',
				'--enable-webgl',
				'--ignore-gpu-blocklist',
				'--use-angle=d3d11',
				'--disable-background-timer-throttling',
			],
		});
		run.write('browser.json', {
			version: await browser.version(),
			executable,
			sha256: sha256(await readFile(executable)),
			node: process.version,
		});
		const page = await browser.newPage();
		await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 1});
		page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text()}));
		page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
		run.progress('production', 'Load deployed app and exact San Jose solar-noon publication.');
		console.log(JSON.stringify({run:run.path,profile,phase:'starting'}));
		await page.goto(`http://127.0.0.1:${address.port}`, {waitUntil: 'domcontentloaded', timeout: 30000});
		/** Wait for the expected exact capture state or its actual failure. @param {string} expected @param {number} timeout @returns {Promise<unknown>} */
		async function wait(expected, timeout) {
			await page.waitForFunction(
				(state) => [state, 'failed'].includes(document.getElementById('capture-result')?.dataset.state),
				{timeout, polling: 250},
				expected,
			);
			const value = await page.$eval('pre#capture-result', (element) => ({
				state: element.dataset.state,
				facts: JSON.parse(element.textContent),
			}));
			assert.notEqual(value.state, 'failed', JSON.stringify(value.facts));
			return value.facts;
		}
		const production = await wait('production-ready', 240000),
			canvas = await page.$('#flat32-canvas');
		assert.ok(canvas);
		const productionPng = Buffer.from(await canvas.screenshot());
		run.write('deployed-noon.png', productionPng);
		run.write('deployed.json', production);
		run.progress('visual', `${run.path}/deployed-noon.png`);
		await page.$eval('button#candidate-trigger', (element) => element.click());
		const baselineFacts=await wait('baseline-ready',Math.max(1000,1800000-(performance.now()-started)));
		const baselinePng=Buffer.from(await canvas.screenshot());
		run.write('baseline-noon.png',baselinePng);run.write('baseline.json',baselineFacts);
		run.progress('visual',`${run.path}/baseline-noon.png`);
		console.log(JSON.stringify({run:run.path,profile,phase:'baseline-captured'}));
		await page.$eval('button#candidate-trigger',element=>element.click());
		const candidateFacts = await wait('candidate-ready', Math.max(1000, 1800000 - (performance.now() - started)));
		const candidatePng = Buffer.from(await canvas.screenshot());
		run.write('candidate-noon.png', candidatePng);
		run.write('candidate.json', candidateFacts);
		assert.ok(
			!serverFailures.length && !consoleMessages.some((m) => m.type === 'pageerror'),
			'Actual browser/asset failure.',
		);
		for (const source of sources) readRepository(source.path, source);
		await page.setViewport({width: 1536, height: 620, deviceScaleFactor: 1});
		await page.setContent(
			`<html><style>body{margin:0;background:white;color:#17212b;font:17px sans-serif}header{padding:12px}main{display:flex}section{width:768px}h3{margin:8px 14px}img{width:768px;height:576px;display:block}</style><header>San Jose solar noon, away from Sun - ${profile} atmosphere; production renderer and fixed display</header><main><section><h3>Original: 15 intervals</h3><img src="data:image/png;base64,${baselinePng.toString('base64')}"></section><section><h3>Candidate: 60 intervals + normalized Mie</h3><img src="data:image/png;base64,${candidatePng.toString('base64')}"></section></main></html>`,
			{waitUntil: 'load'},
		);
		run.write('comparison.png', Buffer.from(await page.screenshot({fullPage: true})));
		run.progress('visual', `${run.path}/comparison.png`);
		run.write('result.json', {
			accepted: true,
			production,baseline:baselineFacts,profile,
			candidate: candidateFacts,
			servedCacheAssets: [...servedAssets.values()],
			consoleMessages,
			serverFailures,
			elapsedMilliseconds: performance.now() - started,
			twilight: 'Current production remains untouched; noon capture does not qualify candidate twilight.',
		});
	} catch (error) {
		failure = String(error);
		run.write('failure.json', {failure, consoleMessages, serverFailures});
	} finally {
		await browser?.close();
		if (host) await new Promise((resolve) => host.close(resolve));
		run.cleanup();
		run.finish(failure ? 'failed' : 'accepted', {elapsedMilliseconds: performance.now() - started, failure});
	}
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, failure}));
	if (failure) process.exitCode = 1;
}
await main();
