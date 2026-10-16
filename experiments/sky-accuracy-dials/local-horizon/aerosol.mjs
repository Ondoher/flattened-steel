import assert from 'node:assert/strict';
import path from 'node:path';
import {createServer} from 'node:http';
import {gunzipSync} from 'node:zlib';
import puppeteer from 'puppeteer';
import {createRun, identity, readRepository, verifyRun, checkedAbsolute} from '../io/files.mjs';
import {direct, boundary} from '../horizon-reference/math.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';

/** Measure a single physical aerosol-loading hypothesis and render controlled GPU comparisons.
 * @returns {Promise<void>} A new sealed evidence run. Missing/incompatible parents, failed numerical
 * controls or browser errors reject the operation; browser, server and owned scratch are retired.
 */
async function main() {
	const started = Date.now(), capture = 'tmp/experiments/sky-accuracy-dials/runs/00281-h34-h37-local';
	const qualification = 'tmp/experiments/sky-accuracy-dials/runs/00285-h37-qualify';
	const parents = [verifyRun(capture), verifyRun(qualification)];
	/** Read an authenticated parent artifact, retaining its exact identity.
	 * @param {string} root Repository-relative sealed parent. @param {string} file Artifact name.
	 * @returns {Buffer} Exact bytes; path/hash/size failures propagate and prevent interpretation.
	 */
	function input(root, file) { const p = root + '/' + file, bytes = readRepository(p); parents.push(identity(p, bytes)); return bytes; }
	const q = /** @type {LocalHorizonQualification} */ (JSON.parse(input(qualification, 'qualification.json').toString()));
	assert.equal(JSON.parse(input(qualification, 'sealed.json').toString()).state, 'accepted');
	assert.equal(q.source, capture); assert.equal(q.parentState, 'failed');
	const registration = /** @type {LocalHorizonRegistration} */ (JSON.parse(input(capture, 'registration.json').toString()));
	const prior = /** @type {LocalHorizonRayPacket} */ (JSON.parse(input(capture, 'independent-rays.json').toString()));
	const graph = /** @type {DialFileIdentity[]} */ (JSON.parse(input(capture, 'source-identities.json').toString()));
	for (const item of graph) readRepository(item.path, item);
	const boot = gunzipSync(input(capture, 'boot.js.gz')), probe = gunzipSync(input(capture, 'probe.js.gz'));
	const baselineImage = input(capture, 'reference-128.png');
	parents.push(identity('agents/topics/poc-experiments/engineering-studies/sky-accuracy-dials/flat-local-aerosol-results.md'));
	const fractions = [1, 0.75, 0.5, 0.25, 0];
	const run = createRun('h39-aerosol', {parents, operation: 'Independent N1 physical sensitivity: scale the existing aerosol profile amplitude at fixed scale height, albedo, phase, source, camera endpoints and display. Reuse qualified historical observer bundles only after exact dependency authentication.',
		parameters: {fractions, nodes: [64,128], imageFractions: [1,0.5,0], imageNodes: 64, maximumMilliseconds: 600000, brightnessThreshold: 0.01, numericalThreshold: 0.002, profile: 'f * exp(-h / 1200m); full profile amplitude, not a sharp altitude cutoff', ground: 'Existing scene lighting held fixed; sky sensitivity only', order: 1}});
	console.log(JSON.stringify({run: run.path}));
	let browser, server, failure = null;
	const events = [], cases = /** @type {LocalAerosolCase[]} */ ([]);
	const deadline = setTimeout(() => { failure=new Error('Owned aerosol job exceeded ten minutes'); void browser?.close(); }, 600000);
	try {
		run.progress('rays', 'Five physical aerosol amounts; independent 64/128-node rays.');
		for (const fraction of fractions) {
			const medium = {...registration.medium, mie: registration.medium.mie.map(x => x * fraction)};
			const rows = prior.rows.map((row,index) => {
				if(index%6===0) run.progress('rays','Aerosol '+fraction+', azimuth '+row.heading,index,prior.rows.length);
				const groups = Array.from({length:15}, (_,channel) => ({id:'h39',medium,origin:[0,0,5],direction:row.direction,channel,end:row.end}));
				const fine = groups.map(g => direct(g,128)), spectrum = fine.map(x => x.total);
				const coarse = groups.map(g => direct(g,64).total);
				const extended = groups.map(g => direct({...g,end:boundary(medium,g.origin,g.direction).distance},128).total);
				const refinement = Math.max(...spectrum.map((x,k) => Math.abs(x-coarse[k])/Math.max(1e-10,Math.abs(x))));
				assert.ok(refinement < 0.002, 'Physical ray quadrature did not converge');
				if (fraction === 1) assert.ok(spectrum.every((x,k) => Math.abs(x/row.reference[k]-1) < 1e-12), 'Baseline reproduction failed');
				return {heading:row.heading,elevation:row.elevation,direction:row.direction,end:row.end,spectrum,color:colorimetry(spectrum,'bin-integrated'),extendedColor:colorimetry(extended,'bin-integrated'),refinement,
					species:[0,1].map(s => fine.map(x => x.species[s])),bins:Array.from({length:6},(_,b) => fine.map(x => x.bins[b]))};
			});
			cases.push({fraction,medium,rows});
			run.progress('rays', 'Completed aerosol fraction '+fraction, cases.length, fractions.length);
		}
		run.write('rays.json', cases);
		run.write('summary.json', cases.map(item => ({fraction:item.fraction, rays:item.rows.map((row,index) => ({heading:row.heading,elevation:row.elevation,
			Y:row.color.luminanceCdPerM2,xy:row.color.xy,relativeY:row.color.luminanceCdPerM2/cases[0].rows[index].color.luminanceCdPerM2-1,
			speciesY:row.species.map(spectrum=>colorimetry(spectrum,'bin-integrated').luminanceCdPerM2),
			within50km:row.bins.slice(0,2).reduce((sum,spectrum)=>sum+colorimetry(spectrum,'bin-integrated').luminanceCdPerM2,0)/row.color.luminanceCdPerM2,
			extendedRelativeY:row.extendedColor.luminanceCdPerM2/row.color.luminanceCdPerM2-1,refinement:row.refinement})),
			ratios:['toward','cross','away'].map(heading=>{const find=e=>item.rows.find(r=>r.heading===heading&&r.elevation===e).color.luminanceCdPerM2;
				return {heading,horizonOver3:find(0.05)/find(3),horizonOver10:find(0.05)/find(10)};})})));
		const routes = new Map([['/boot.js',boot],['/probe.js',probe]]), sourceMap = new Map(graph.map(x => [x.path,x]));
		server = createServer((request,response) => {
			try {
				assert.equal(request.method,'GET'); const url = new URL(request.url,'http://127.0.0.1');
				if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
				let bytes, kind = 'text/javascript';
				if (url.pathname === '/') { bytes = Buffer.from('<!doctype html><meta charset="utf-8"><style>html,body{margin:0}#main-content{width:640px;height:560px}canvas{width:640px;height:480px;display:block}</style><div id="main-content"></div><script type="module" src="/boot.js"></script>'); kind='text/html'; }
				else if (routes.has(url.pathname)) bytes = routes.get(url.pathname);
				else {
					const prefix = ['/stellar-catalogs/','/presentation-filters/'].find(p => url.pathname.startsWith(p)); assert.ok(prefix,'Unexpected asset route');
					const p = 'server/flat32/data/' + decodeURIComponent(url.pathname.slice(prefix.length));
					const expected = sourceMap.get(p); assert.ok(expected,'Unregistered historical asset');
					bytes=readRepository(p,expected); kind=p.endsWith('.json')?'application/json':'application/octet-stream';
				}
				response.writeHead(200,{'Content-Type':kind,'Cache-Control':'no-store'}).end(bytes);
			} catch (error) { events.push(String(error)); response.writeHead(500).end(String(error)); }
		});
		await new Promise(resolve => server.listen(0,'127.0.0.1',resolve)); const address=server.address(); assert.ok(address && typeof address!=='string');
		browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,
			userDataDir:checkedAbsolute(path.join(run.scratchPath,'chrome-profile'),false),protocolTimeout:600000,
			args:['--enable-gpu','--enable-webgl','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});
		const page=await browser.newPage(); await page.setViewport({width:640,height:560,deviceScaleFactor:1});
		page.on('pageerror',error=>events.push(String(error)));
		run.progress('gpu', 'Start qualified baseline observer with fixed source/display.');
		await page.goto('http://127.0.0.1:'+address.port+'/',{waitUntil:'domcontentloaded'});
		await page.waitForFunction(()=>['ready','failed','atmosphere-failed'].includes(document.querySelector('.flat32-shell')?.getAttribute('data-flat32-state')),{timeout:240000});
		const state=await page.$eval('.flat32-shell',e=>({.../** @type {HTMLElement} */(e).dataset})); assert.equal(state.flat32State,'ready'); run.write('labels.json',state);
		await page.addScriptTag({type:'module',url:'http://127.0.0.1:'+address.port+'/probe.js'}); await page.waitForFunction(()=>Boolean(window.__localHorizon));
		const fresh=await page.evaluate(()=>window.__localHorizon.observe());
		assert.deepEqual(fresh.medium,registration.medium); assert.deepEqual(fresh.observation.facts.camera,registration.observation.facts.camera);
		assert.ok(!/swiftshader|software|llvmpipe/i.test(String(fresh.observation.facts.renderer))); assert.equal(fresh.order,1);
		run.write('compatibility.json',{qualifiedParent:qualification,originalCaptureState:'failed',authenticatedDependencies:graph.length,medium:fresh.medium,camera:fresh.observation.facts.camera,renderer:fresh.observation.facts.renderer,display:'Baseline uniforms/exposure/scene lighting remain fixed; only independent atmospheric transport is changed.'});
		run.write('aerosol-100.png',baselineImage);
		const images = [baselineImage];
		for (const fraction of [0.5,0]) {
			run.progress('image', 'Independent GPU image: aerosol fraction '+fraction);
			const item=cases.find(x=>x.fraction===fraction), result=await page.evaluate(m=>window.__localHorizon.compare(m,64),item.medium);
			const bytes=Buffer.from(result.image.split(',')[1],'base64'); images.push(bytes); run.write('aerosol-'+fraction*100+'.png',bytes);
			const parity=result.observation.rays.filter(r=>r.uv[0]===0.5).map(ray=>{
				const actual=ray.stages.slice(5,9).flat().slice(0,15),direction=ray.stages[3].slice(0,3),end=ray.stages[3][3];
				const expected=Array.from({length:15},(_,channel)=>direct({id:'gpu-check',medium:item.medium,origin:[0,0,5],direction,channel,end},128).total);
				return {elevation:ray.elevationDegrees,maximumRelative:Math.max(...actual.map((x,k)=>Math.abs(x-expected[k])/Math.max(1e-10,Math.abs(expected[k]))))};
			});
			assert.ok(parity.every(x=>x.maximumRelative<0.002),'GPU image failed independent CPU parity');
			run.write('aerosol-'+fraction*100+'-parity.json',parity);
		}
		const comparison=images.map((b,k)=>`<text x="${20+650*k}" y="52">${[100,50,0][k]}% aerosol, independent N1</text><image x="${20+650*k}" y="65" width="640" height="480" href="data:image/png;base64,${b.toString('base64')}"/>`).join('');
		run.write('comparison.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1970" height="605"><rect width="1970" height="605" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="26" font-size="20">San Jose closest: physical aerosol loading, fixed camera / source / exposure</text>${comparison}<text x="20" y="575">Only the existing aerosol profile amplitude changes; scale height 1.2 km, albedo 0.8 and phase g=0.7 remain fixed.</text><text x="20" y="596">Sky sensitivity at single-scattering order. Scene lighting stays fixed. The cache is an unchanged baseline, not a defect hypothesis.</text></g></svg>`);
	} catch (error) { failure=error; }
	finally {
		clearTimeout(deadline); await browser?.close().catch(error=>{failure??=error;}); if(server) await new Promise(resolve=>server.close(resolve));
		run.write('events.json',events); run.finish(failure?'failed':'accepted',{elapsedMilliseconds:Date.now()-started,cases:cases.length,failure:failure?String(failure):null});
	}
	verifyRun(run.path); assert.equal(JSON.parse(readRepository(run.path+'/sealed.json').toString()).state,'accepted'); console.log(run.path);
	if(failure) throw failure;
}

await main();
