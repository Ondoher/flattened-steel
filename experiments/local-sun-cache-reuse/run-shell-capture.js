import path from 'node:path';
import {readFile,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {ExperimentRun} from './ExperimentRun.js';
import {readParent} from './parent-evidence.js';
import {repositoryRoot,checkPath,hash} from './run-boundary.js';
import {requireHeavyExecution} from './heavy-execution-admission.js';
import {unculledShellLayout} from './shell-omission.js';

/** Build and capture a new shell candidate through the public production renderer.
 * @returns {Promise<void>} - Closed immutable first-image attempt.
 */
async function main() {
	await requireHeavyExecution();
	const run=await ExperimentRun.create('p3-shell-v3a');
	let browser,host,failure=null;
	const profile=path.join(run.root,'profile');
	try {
		const controlsParent=await readParent('00018-controls','controls.json');
		const layoutParent=await readParent(process.argv[2] ?? '00049-p3-shell-proof','layout.json');
		const gatesParent=await readParent(layoutParent.run,'gates.json');
		const controls=JSON.parse(new TextDecoder().decode(controlsParent.bytes));
		const stateId=process.argv.find(value=>value.startsWith('--state='))?.slice('--state='.length) ?? 'flat-0';
		if(!['flat-0','flat-45','flat-90','flat-135','flat-180'].includes(stateId))throw new Error('Unknown frozen visual cadence state.');
		const selectionParents=[];
		if(stateId==='flat-90') {
			const selection=await readParent('00281-p3-selection','selection.json'),selectedLayout=await readParent('00281-p3-selection','layout.json');
			if(selectedLayout.artifactSha256!==layoutParent.artifactSha256 || JSON.parse(new TextDecoder().decode(selection.bytes)).holdout!=='flat-90')throw new Error('Flat90 evaluation requires the pre-holdout frozen numerical selection.');
			selectionParents.push(selection,selectedLayout);
		}
		/** @type {LocalSunShellCaptureRequest} */
		const recipe={state:controls.states.find((/** @type {{id:string}} */ s)=>s.id===stateId),
			layout:JSON.parse(new TextDecoder().decode(layoutParent.bytes)),diagnostic:false,cooperative:process.argv.includes('--cooperative'),transport:process.argv.includes('--column48') ? 'column48-tail64' : process.argv.includes('--square48') ? 'square48-tail64' : process.argv.includes('--square120') ? 'square120-tail64' : 'uniform120',incoming:process.argv[4]==='control' ? 'control' : process.argv[4]==='partitioned-midpoint48' ? 'partitioned-midpoint48' : 'partitioned'};
		if(!recipe.state)throw new Error('Frozen state absent.');
		recipe.runtime=process.argv.includes('--runtime');
		recipe.fieldProbe=process.argv.includes('--field-probe');
		if(process.argv.includes('--unculled'))recipe.layout=unculledShellLayout(recipe.layout);
		if(process.argv[3]) {
			const order=Number(process.argv[3]);
			if(![1,2,3,4].includes(order))throw new Error('Invalid diagnostic scattering order.');
			recipe.state={...recipe.state,execution:{...recipe.state.execution,maximumScatteringOrder:/** @type {SupportedCacheScatteringOrder} */(order)}};
		}
		await run.write('recipe.json',JSON.stringify(recipe,null,'\t'));
		await run.write('gates.json',gatesParent.bytes);
		const entry=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/shell-browser.js');
		await checkPath(repositoryRoot,entry);
		const commonjs=createRequire(import.meta.url)('@rollup/plugin-commonjs');
		const warnings=[];
		const bundle=await rollup({input:entry,plugins:[nodeResolve({browser:true}),commonjs()],onwarn(w){warnings.push({code:w.code,message:w.message});}});
		let code,inputs;
		try {code=(await bundle.generate({format:'iife'})).output[0].code.replaceAll('process.env.NODE_ENV',JSON.stringify('production'));inputs=bundle.watchFiles;}
		finally {await bundle.close();}
		let workerCode='';
		if(recipe.cooperative) {
			const workerEntry=path.join(repositoryRoot,'experiments/local-sun-cache-reuse/shell-phase-worker.js');await checkPath(repositoryRoot,workerEntry);
			const workerBundle=await rollup({input:workerEntry,plugins:[nodeResolve({browser:true}),commonjs()],onwarn(w){warnings.push({code:w.code,message:w.message});}});
			try {workerCode=(await workerBundle.generate({format:'iife'})).output[0].code;inputs.push(...workerBundle.watchFiles);} finally {await workerBundle.close();}
			await run.write('phase-worker.bundle.js',workerCode);
		}
		const identities=[];
		for(const input of [...new Set([...inputs, path.join(repositoryRoot,'experiments/local-sun-cache-reuse/run-shell-capture.js'),
			path.join(repositoryRoot,'experiments/local-sun-cache-reuse/ExperimentRun.js'),path.join(repositoryRoot,'experiments/local-sun-cache-reuse/parent-evidence.js'),
			path.join(repositoryRoot,'experiments/local-sun-cache-reuse/heavy-execution-admission.js'),
			path.join(repositoryRoot,'experiments/local-sun-cache-reuse/run-boundary.js'),path.join(repositoryRoot,'experiments/local-sun-cache-reuse/shell-omission.js'),path.join(repositoryRoot,'package-lock.json')])].filter(v=>!v.startsWith('\0'))) {
			await checkPath(repositoryRoot,input);const bytes=await readFile(input);
			identities.push({path:path.relative(repositoryRoot,input).replaceAll('\\','/'),bytes:bytes.length,sha256:hash(bytes)});
		}
		await run.write('bundle.js',code);
		await run.write('inputs.json',JSON.stringify({schema:'shell-capture-inputs-v1',command:process.argv.slice(1),
			parents:[controlsParent,layoutParent,gatesParent,...selectionParents].map(({bytes,...identity})=>identity),inputs:identities,
			bundleSha256:hash(code),workerBundleSha256:workerCode ? hash(workerCode) : null,warnings,operation:'Fresh current-grid and Euclidean shell-layout builds at the explicitly selected identical frozen development state; public renderer and exact-state receivers; complete cumulative readback and CPU/GPU rays',
			parameters:recipe,limitations:'No reuse or video; no independent physical-accuracy claim; current per-state cylinder versus declared fixed candidate cylinder are distinct construction policies.'},null,'\t'));
		host=createServer((request,response)=>{
			const found=request.url==='/' || request.url==='/bundle.js' || request.url==='/phase-worker.js' && workerCode.length>0;
			response.writeHead(found?200:404,{'content-type':request.url?.endsWith('.js')?'text/javascript':'text/html'});
			response.end(!found?'':request.url==='/bundle.js'?code:request.url==='/phase-worker.js'?workerCode:'<!doctype html><script src="/bundle.js"></script>');
		});
		await new Promise((resolve,reject)=>{host.once('error',reject);host.listen(0,'127.0.0.1',()=>resolve(undefined));});
		const address=host.address();if(!address || typeof address==='string')throw new Error('No loopback.');
		await checkPath(run.root,profile);
		const executablePath=process.env.LOCAL_SUN_CACHE_CHROME_EXECUTABLE ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
		const args=['--enable-gpu','--use-angle=d3d11','--ignore-gpu-blocklist','--disable-background-timer-throttling'];
		browser=await puppeteer.launch({executablePath,headless:'new',userDataDir:profile,args,protocolTimeout:1800000});
		await run.write('browser.json',JSON.stringify({version:await browser.version(),executablePath,executableSha256:hash(await readFile(executablePath)),args,node:process.version,
			profilePolicy:'Disposable new profile, removed before sealing'},null,'\t'));
		const page=await browser.newPage();page.setDefaultTimeout(0);
		await page.setViewport({width:720,height:414,deviceScaleFactor:1});
		page.on('console',m=>{console.log(m.text());void run.progress('browser',m.text());});
		page.on('pageerror',e=>{console.log(String(e));void run.progress('browser-error',String(e));});
		await page.goto(`http://127.0.0.1:${address.port}/`,{waitUntil:'load'});
		/** @type {LocalSunShellHostCapture} */
		const result=JSON.parse(await page.evaluate(recipe=>/** @type {LocalSunShellBrowserBridge} */(/** @type {unknown} */(globalThis)).shellCapture(recipe),recipe));
		if(result.results.length!==2)throw new Error('Missing control/candidate.');
		const images=[];
		for(const [i,r] of result.results.entries()) {
			const bytes=Buffer.from(r.image.split(',')[1],'base64');
			await run.write(i===0?'control.png':'candidate.png',bytes);images.push(PNG.sync.read(bytes));
		}
		const plate=new PNG({width:2160,height:414});let maximum=0;
		for(let y=0;y<414;y++)for(let x=0;x<720;x++)for(let c=0;c<4;c++){
			const index=(y*720+x)*4+c,a=images[0].data[index],b=images[1].data[index];
			plate.data[(y*2160+x)*4+c]=a;plate.data[(y*2160+x+720)*4+c]=b;
			plate.data[(y*2160+x+1440)*4+c]=c===3?255:Math.min(255,50*Math.abs(a-b));
			if(c<3)maximum=Math.max(maximum,Math.abs(a-b));
		}
		await run.write('comparison.png',PNG.sync.write(plate));
		await run.write('result.json',JSON.stringify({...result,results:result.results.map(({image,...facts})=>facts),
			display:{panels:'left=current-grid fresh; middle=shell-layout fresh; right=50x absolute RGB-byte difference; exact receiver measurements per build',maximumAbsoluteByteDifference:maximum}},null,'\t'));
		if(result.glErrors.length || result.results.some(r=>r.field.nonfinite || r.field.negative))throw new Error('Invalid rendering/field values.');
	} catch(error) {failure=error instanceof Error ? error.stack ?? error.message : String(error);}
	finally {
		try {await browser?.close();await checkPath(run.root,profile);const resolved=path.resolve(profile);
			if(!resolved.startsWith(path.resolve(run.root)+path.sep))throw new Error('Profile cleanup escape.');
			await rm(resolved,{recursive:true,force:true});}
		catch(error){failure ??=String(error);}
		try {if(host?.listening)await new Promise((resolve,reject)=>host.close(e=>e?reject(e):resolve(undefined)));}
		catch(error){failure ??=String(error);}
	}
	await run.finish(failure?'failed':'accepted',failure);
	console.log(JSON.stringify({run:run.name,failure}));if(failure)process.exitCode=1;
}
await main();
