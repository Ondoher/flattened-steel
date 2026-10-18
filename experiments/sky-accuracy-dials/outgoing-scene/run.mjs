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
import {normalized,compiler,facade,lookup,mapping} from './mapping.mjs';
import {LocationTimeController} from '../../../src/flat32/LocationTimeController.js';
import {originalPhase} from '../distant-horizon/toronto-phase.js';

const commonjs = createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Render contained deployed/corrected/focused captures with the matching cache-owned angular helper.
 * @returns {Promise<void>} Sealed images and provenance; failed runs retain their real state and owned resources are closed.
 */
async function main() {
	assert.ok(process.argv.length===3||process.argv.length===4);
	const profile=process.argv[2];assert.ok(['proof','network','noon-probe','noon','sunset','twilight','twilight60'].includes(profile));
	const atmosphereProfile=process.argv[3]??'canonical';assert.ok(['canonical','toronto'].includes(atmosphereProfile));
	if(atmosphereProfile==='toronto')assert.ok(['noon','sunset','twilight','twilight60'].includes(profile));
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
 numerical:{...inputs.buildRequest.transportSpec.numerical,transportIntervalCount:60},
		},
	});
	const adapted = {...baseline,id:'attribution-scene-60',transportSpec:{...baseline.transportSpec,numerical:{...baseline.transportSpec.numerical,transportIntervalCount:60}}};
    const times=new LocationTimeController();let selected=times.start();for(let i=0;i<2;i++)selected=times.nextLocation(selected);selected=times.selectGlobeTime(selected,(profile.startsWith('noon')||profile==='network')?1:2);if(profile==='twilight'||profile==='twilight60')selected=times.adjustGlobeMinuteOffset(selected,profile==='twilight60'?60:30);
    const torontoParent='tmp/experiments/sky-accuracy-dials/runs/00310-h45-toronto-prod';
    let material=null;
    if(atmosphereProfile==='toronto'){parents.push(verifyRun(torontoParent),identity(torontoParent+'/control.json'));material=JSON.parse(readRepository(torontoParent+'/control.json').toString()).material;assert.ok(material&&material.albedos.length===15&&material.phaseTables.length===15);}
    const originalRequest={...baseline,transportSpec:{...baseline.transportSpec,numerical:{...baseline.transportSpec.numerical,transportIntervalCount:15}}};
    const control={baseline,candidate:adapted,original:originalRequest,profile:atmosphereProfile,material,scene:(profile==='noon-probe'||profile==='network')?'noon':profile,probeOnly:profile==='noon-probe',mapping,observation:selected.observation};
    const parent=verifyRun('tmp/experiments/sky-accuracy-dials/runs/00398-h61-verify');
    parents.push(parent);
    if(profile==='twilight60')parents.push(verifyRun('tmp/experiments/sky-accuracy-dials/runs/00414-h62-verify'));
    const recipe={parents,operation:atmosphereProfile==='toronto'?'H63 matched Toronto phase/SSA scene capture: freshly built Original15, Corrected60 and H61 Focused60; canonical aerosol amount/extinction and San Jose geometry retained. Canonical deployed startup is not the Toronto baseline.':'H62 actual scene capture: Deployed Original15, Corrected60 and H61 Focused60; native48/15, all four orders, exact row-specific mapping. New contained bundles only.',parameters:{controlHash:sha256(JSON.stringify(control)),controlArtifact:'control.json',scene:profile,atmosphereProfile,mapping,initialScenesOnly:profile!=='twilight60',minutesAfterSunset:profile==='twilight60'?60:profile==='twilight'?30:profile==='sunset'?0:null}};
    const shortScene=profile==='twilight60'?'tw60':profile==='twilight'?'tw30':profile;
    const run=createRun(atmosphereProfile==='toronto'?'h63-tor-'+shortScene:'h62-'+profile,recipe);run.write('control.json',control);
	const started = performance.now();
	/** @type {Awaited<ReturnType<typeof puppeteer.launch>>|undefined} */ let browser;
	/** @type {ReturnType<typeof createServer>|undefined} */ let host;
	let failure = null;
	const consoleMessages = [],missingRequests=[],
		serverFailures = [],
		servedAssets = new Map(),
		files = [];
	try {
		const compilerPath = 'scripts/algorithm32/solar-zenith-cache/DistantSunSceneCacheGpuCompiler.js';
		let original = readRepository(compilerPath).toString('utf8').replaceAll('\r\n','\n');
        if(atmosphereProfile==='toronto'){
          const phasePath=resolveRepository('experiments/sky-accuracy-dials/distant-horizon/toronto-phase.js').split(path.sep).join('/');
          assert.equal(original.split(originalPhase).length,2);
          original=`import {torontoPhaseGlsl} from '${phasePath}';\n`+original.replace(originalPhase,'${torontoPhaseGlsl(wavelengthNanometers)}');
        }
        const baselineSource=compiler(normalized(original),1),transformed=compiler(normalized(original),mapping.k);
        const facadePath='src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCache.js',lookupPath='src/algorithm32/implementation/distant-sun/cache/DistantSunSharedCacheCubicLookup.js';
        const facadeSource=facade(readRepository(facadePath).toString()),lookupSource=lookup(readRepository(lookupPath).toString());
        run.write('baseline-compiler.js.gz',gzipSync(Buffer.from(baselineSource)));
        run.write('candidate-compiler.js.gz',gzipSync(Buffer.from(transformed)));
        if(atmosphereProfile==='toronto')run.write('original-compiler.js.gz',gzipSync(Buffer.from(original)));
        run.write('facade.js.gz',gzipSync(Buffer.from(facadeSource)));run.write('lookup.js.gz',gzipSync(Buffer.from(lookupSource)));
        run.write('transform.json',{parents:[identity(compilerPath),identity(facadePath),identity(lookupPath)],mapping,atmosphereProfile,materialHash:material?sha256(JSON.stringify(material)):null,originalSha256:sha256(original),baselineSha256:sha256(baselineSource),candidateSha256:sha256(transformed),facadeSha256:sha256(facadeSource),lookupSha256:sha256(lookupSource)});
        const shim=resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/compiler.js');
        const originalShim=resolveRepository('experiments/sky-accuracy-dials/outgoing-scene/original-compiler.js');
        const transformPlugin={name:'h62-contained-mapping',
          /** @param {string} source @param {string|undefined} importer */
          async resolveId(source,importer){if((importer===shim||importer===originalShim)&&source.startsWith('.'))return this.resolve(source,resolveRepository(compilerPath),{skipSelf:true});return null;},
          /** @param {string} id @returns {string|null} */
          load(id){if(id===shim)return transformed;if(id===originalShim)return original;if(id===resolveRepository(compilerPath))return baselineSource;if(id===resolveRepository(facadePath))return facadeSource;if(id===resolveRepository(lookupPath))return lookupSource;return null;}
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
		const browserBundle = await bundle('experiments/sky-accuracy-dials/outgoing-scene/browser.js');
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
		run.write('inputs.json', {controlHash:sha256(JSON.stringify(control)), configurationHash:sha256(JSON.stringify(configuration)), sources, package: SHARED_PACKAGE_IDENTITY});
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
 missingRequests.push({path:url.pathname,status:404});
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
				'--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows',
			],
		});
		run.write('browser.json', {
			version: await browser.version(),
			executable,
			sha256: sha256(await readFile(executable)),
			node: process.version,
		});
		const page = await browser.newPage();
		await page.setViewport({width: 1024, height: 768, deviceScaleFactor: 1});await page.bringToFront();
		page.on('console', (message) => consoleMessages.push({type: message.type(), text: message.text(),location:message.location()}));
		page.on('pageerror', (error) => consoleMessages.push({type: 'pageerror', text: error.message}));
		run.progress('production', `Load deployed startup atlas and frozen San Jose ${profile} observation.`);
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
        if(profile==='proof'){const proof=await wait('proof-ready',240000);run.write('proof.json',proof);return;}
        const production=await wait('production-ready',240000),canvas=await page.$('#flat32-canvas');assert.ok(canvas);
 if(profile==='network'){await new Promise(r=>setTimeout(r,500));assert.deepEqual(missingRequests,[{path:'/favicon.ico',status:404}]);assert.equal(serverFailures.length,0);run.write('network.json',{accepted:true,production,missingRequests,consoleMessages,serverFailures,servedAssets:[...servedAssets.values()],scope:'Read-only startup/route replay; no cache construction or new scene campaign.'});return;}
        if(profile==='noon-probe'){await page.$eval('button#candidate-trigger',e=>e.click());const baseline=await wait('baseline-ready',1800000);await page.$eval('button#candidate-trigger',e=>e.click());const focused=await wait('candidate-ready',1800000);run.write('packet-proof.json',{accepted:true,channel:7,production,baseline,focused});return;}
        const headings=profile==='noon'?[0,90,180]:[0];const captures=[];
        /** @param {string} variant */
        async function capture(variant){for(const heading of headings){
          run.progress('capture',`${variant} heading${heading}: warmup and12 timing samples.`);console.log(JSON.stringify({run:run.path,phase:'capture-start',variant,heading}));
          const facts=await page.evaluate(h=>globalThis['__h62View'](h),heading);
          const image=Buffer.from(await canvas.screenshot());const file=`${variant}-${heading}.png`;
          run.write(file,image);run.write(`${variant}-${heading}.json`,facts);captures.push({variant,heading,file,facts});run.progress('visual',`${run.path}/${file}`);console.log(JSON.stringify({run:run.path,capture:file}));
        }}
        let originalFacts=null;
        if(atmosphereProfile==='toronto'){
          await page.$eval('button#candidate-trigger',e=>e.click());
          originalFacts=await wait('original-ready',1800000);await capture('original');
        }else await capture('deployed');
        await page.$eval('button#candidate-trigger',e=>e.click());
        const baselineFacts=await wait('baseline-ready',1800000);await capture('corrected');
        const identityFacts=await page.evaluate(()=>globalThis['__h62Identity']());
        run.write('identity-180.png',Buffer.from(await canvas.screenshot()));run.write('identity.json',identityFacts);
        await page.$eval('button#candidate-trigger',e=>e.click());
        const candidateFacts=await wait('candidate-ready',1800000);await capture('focused');
        assert.ok(!serverFailures.length&&!consoleMessages.some(m=>m.type==='pageerror'),'Actual browser/asset failure.');
        for(const source of sources)readRepository(source.path,source);
        run.write('captures.json',captures);
		run.write('result.json', {
			accepted: true,
			production,original:originalFacts,baseline:baselineFacts,profile,atmosphereProfile,
			candidate: candidateFacts,
			servedCacheAssets: [...servedAssets.values()],
			consoleMessages,
			serverFailures,
			elapsedMilliseconds: performance.now() - started,
			scene:profile,mapping,missingRequests,scope:'Contained scene/runtime/twilight evidence; no production promotion.',
		});
	} catch (error) {
		failure = String(error);
		run.write('failure.json', {failure, consoleMessages, serverFailures});
	} finally {
		if(browser?.isConnected())await browser.close();
		if (host) await new Promise((resolve) => host.close(resolve));
		run.cleanup();
		run.finish(failure ? 'failed' : 'accepted', {elapsedMilliseconds: performance.now() - started, failure});
	}
	verifyRun(run.path);
	console.log(JSON.stringify({run: run.path, failure}));
	if (failure) process.exitCode = 1;
}
await main();
