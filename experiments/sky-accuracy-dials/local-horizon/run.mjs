import assert from 'node:assert/strict';
import path from 'node:path';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {createRun,identity,readRepository,resolveRepository,checkedAbsolute,verifyRun,storage} from '../io/files.mjs';
import {direct,proofs,boundary} from '../horizon-reference/math.mjs';
import {colorimetry,colorControls} from '../horizon/diagnosis-color.mjs';
const commonjs=createRequire(import.meta.url)('@rollup/plugin-commonjs');

/** Capture current local production and a cache-free reference on the hardware GPU.
 * @returns {Promise<void>} Seals all results, including a failed attempt; browser/server/scratch retire on every path.
 */
async function main(){
	const start=Date.now(),parents=[],events=[],sources=new Map();
	const plan='agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/flat-local-horizon-plan.md';
	parents.push(identity(plan));
	for(const name of ['00267-h21-h26-ref','00270-h27-brightness'])parents.push(verifyRun('tmp/experiments/sky-accuracy-dials/runs/'+name));
	const run=createRun('h34-h37-local',{parents,operation:'Fresh current app bundle; unchanged local cache transport versus independently generated finite-source N1 transport, with common ray/domain/display. CPU binary64 qualification; GPU actual images. No production-correctness assumption.',parameters:{maximumMilliseconds:600000,viewport:[640,480],quadrature:[64,128],spectralFloor:1e-10,tolerances:{luminanceRelative:0.02,ratioRelative:0.02,xyAbsolute:0.002,spectrumRelative:0.02},storageBefore:storage()}});
	console.log(JSON.stringify({run:run.path}));
	let browser,server,failure=null;
	const deadline=setTimeout(()=>{failure=new Error('Owned capture exceeded ten-minute job limit');void browser?.close();},600000);
	try{
		const routes=new Map();
		const startup=`window.__horizonApplication = application;
application._initialModeKind = 'flat-local';
const hc=application._locationTimeController,hs=hc.start.bind(hc);
hc.start=()=>{let s=hs();s=hc.nextLocation(hc.nextLocation(s));return hc.selectTime(s,0);};
window.__flat32Cleanup = application.dispose.bind(application);`;
		/** Bundle fresh read-only source and retain exact inputs. @param {string} entry @returns {Promise<Buffer>} */
		async function bundle(entry){
			const build=await rollup({input:resolveRepository(entry),plugins:[{name:'local-capture-selection',resolveId(id){return ['@polylith/features','@polylith/config'].includes(id)?'\0contained-empty-registration':null;},load(id){return id==='\0contained-empty-registration'?'export {};':null;},transform(code,id){
				if(id.replaceAll('\\','/').endsWith('/src/flat32/Flat32Bootstrap.js')){
					const needle='window.__flat32Cleanup = application.dispose.bind(application);';assert.equal(code.split(needle).length,2);return code.replace(needle,startup);
				}if(id.replaceAll('\\','/').endsWith('/src/algorithm32/rendering-runtime/three/ShaderRuntimePass.js')){
					const needle='this._scene.add(this._mesh);';assert.equal(code.split(needle).length,2);return code.replace(needle,needle+'\n(window.__horizonPasses ??= []).push(this);');
				}return null;
			}},nodeResolve({browser:true}),commonjs()],onwarn:w=>events.push(w.message)});
			try{for(const file of build.watchFiles){if(file.includes('\0')){events.push('Bundler-generated virtual module: '+file);continue;}
				const p=path.relative(path.dirname(resolveRepository('package.json')),file).replaceAll('\\','/');sources.set(p,identity(p));}
				return Buffer.from((await build.generate({format:'es',inlineDynamicImports:true})).output[0].code.replaceAll('process.env.NODE_ENV',JSON.stringify('production')));
			}finally{await build.close();}
		}
		run.progress('bundle','Bundle current bootstrap and independent observer.');
		const boot=await bundle('src/flat32/Flat32Bootstrap.js'),probe=await bundle('experiments/sky-accuracy-dials/local-horizon/browser.js');
		routes.set('/boot.js',boot);routes.set('/probe.js',probe);
		run.write('boot.js.gz',gzipSync(boot));run.write('probe.js.gz',gzipSync(probe));run.write('startup-transform.json',{target:'src/flat32/Flat32Bootstrap.js',startup});
		const html='<!doctype html><meta charset="utf-8"><style>html,body{margin:0}#main-content{width:640px;height:560px}canvas{width:640px;height:480px;display:block}</style><div id="main-content"></div><script type="module" src="/boot.js"></script>';
		server=createServer((request,response)=>{try{
			assert.equal(request.method,'GET');const url=new URL(request.url,'http://127.0.0.1');
			if(url.pathname==='/favicon.ico'){response.writeHead(204).end();return;}
			let bytes,kind='text/javascript';
			if(url.pathname==='/'){bytes=Buffer.from(html);kind='text/html';}
			else if(routes.has(url.pathname))bytes=routes.get(url.pathname);
			else{
				const prefix=url.pathname.startsWith('/stellar-catalogs/')?'/stellar-catalogs/':url.pathname.startsWith('/presentation-filters/')?'/presentation-filters/':null;
				assert.ok(prefix,'Unexpected asset route '+url.pathname);
				const p='server/flat32/data/'+decodeURIComponent(url.pathname.slice(prefix.length));bytes=readRepository(p);sources.set(p,identity(p,bytes));kind=p.endsWith('.json')?'application/json':'application/octet-stream';
			}response.writeHead(200,{'Content-Type':kind,'Cache-Control':'no-store'}).end(bytes);
		}catch(error){events.push(String(error));response.writeHead(500).end(String(error));}});
		await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');
		const chrome=checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe'));
		const profile=checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false);
		browser=await puppeteer.launch({executablePath:chrome,headless:true,userDataDir:profile,protocolTimeout:600000,args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
		const page=await browser.newPage();await page.setViewport({width:640,height:560,deviceScaleFactor:1});
		page.on('pageerror',e=>events.push(String(e)));page.on('console',e=>{if(e.type()==='error')events.push(e.text().slice(0,3000));});
		run.progress('application','Build current compact local N1 cache on hardware GPU.');
		await page.goto(`http://127.0.0.1:${address.port}/`,{waitUntil:'domcontentloaded'});
		await page.waitForFunction(()=>['ready','failed','atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.getAttribute('data-flat32-state')),{timeout:480000});
		const labels=await page.$eval('.flat32-shell',e=>({.../** @type {HTMLElement} */(e).dataset}));run.write('labels.json',labels);assert.equal(labels.flat32State,'ready',JSON.stringify(labels));assert.equal(labels.flat32Location,'San Jose');
		await page.addScriptTag({type:'module',url:`http://127.0.0.1:${address.port}/probe.js`});await page.waitForFunction(()=>Boolean(window.__localHorizon));
		const registration=await page.evaluate(()=>window.__localHorizon.observe());
		assert.equal(registration.order,1,'Unchanged app N1 required; a different order needs its separately matched reference');
		assert.ok(!/swiftshader|software|llvmpipe/i.test(String(registration.observation.facts.renderer)));
		const image=registration.baseline;delete registration.baseline;
		run.write('baseline.png',Buffer.from(image.split(',')[1],'base64'));run.write('registration.json',registration);
		run.write('production.glsl.gz',gzipSync(registration.observation.shader));
		const m=registration.medium;assert.equal(m.g,0.7);assert.equal(m.albedo,0.8);
		run.progress('qualification','Binary64 independent N1 ray refinement and manufactured controls.');
		const control={transport:proofs([m,{...m,geometry:'spherical',topAltitude:60000}]),color:colorControls()};
		const rows=registration.readings.flatMap(h=>h.rays.map(ray=>{
			const direction=ray.stages[3].slice(0,3),end=ray.stages[3][3],origin=[0,0,5];
			const spectra=[64,128].map(n=>Array.from({length:15},(_,channel)=>direct({id:h.heading,medium:m,origin,direction,channel,end},n).total));
			const infinite=Array.from({length:15},(_,channel)=>direct({id:h.heading,medium:m,origin,direction,channel,end:boundary(m,origin,direction).distance},128).total);
			const app=ray.stages.slice(5,9).flat().slice(0,15),reference=spectra[1];
			return {heading:h.heading,elevation:ray.elevationDegrees,direction,end,app,reference,infinite,
				appColor:colorimetry(app,'bin-integrated'),referenceColor:colorimetry(reference,'bin-integrated'),infiniteColor:colorimetry(infinite,'bin-integrated'),
				refinement:Math.max(...reference.map((x,k)=>Math.abs(spectra[0][k]-x)/Math.max(1e-10,x)))};
		}));run.write('independent-rays.json',{control,rows});
		for(const nodes of [64,128]){
			run.progress('image',`Independent ${nodes}-node GPU N1 using unchanged camera/domain/display.`);
			const result=await page.evaluate((medium,n)=>window.__localHorizon.compare(medium,n),m,nodes);
			run.write(`reference-${nodes}.png`,Buffer.from(result.image.split(',')[1],'base64'));
			run.write(`reference-${nodes}-rays.json`,{facts:result.observation.facts,rays:result.observation.rays});
			run.write(`reference-${nodes}.glsl.gz`,gzipSync(result.observation.shader));
		}
		run.write('tool.json',{node:process.version,nodePath:process.execPath,chrome,version:await browser.version(),elapsedMilliseconds:Date.now()-start});
	}catch(error){failure=error;}
	finally{
		clearTimeout(deadline);await browser?.close().catch(e=>{failure??=e;});if(server)await new Promise(resolve=>server.close(resolve));
		run.write('events.json',events);run.write('source-identities.json',[...sources.values()]);
		run.finish(failure?'failed':'accepted',{elapsedMilliseconds:Date.now()-start,failure:failure?String(failure):null});verifyRun(run.path);
		const terminal=/** @type {LocalHorizonRecoverySeal} */(JSON.parse(readRepository(run.path+'/sealed.json').toString()));
		if(!failure&&terminal.state!=='accepted')failure=new Error('Finalizer rejected source/progress integrity; inspect the immutable seal before qualifying any artifacts.');
		console.log(JSON.stringify({run:run.path,elapsedMilliseconds:Date.now()-start,failure:failure?String(failure):null}));
	}if(failure)throw failure;
}

await main();
