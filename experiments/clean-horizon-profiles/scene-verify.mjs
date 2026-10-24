import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync,mkdirSync,rmSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import puppeteer from 'puppeteer';
import {PNG} from 'pngjs';
import {createRun,checked,identity,output,command} from './io.mjs';

const [gallery,transition,analysis]=process.argv.slice(2),json=p=>JSON.parse(readFileSync(checked(p),'utf8'));
const prior=readdirSync(checked(output+'/runs')).sort(),run=createRun('scene-verify','S5 closed evidence hashes, scene matrix, state transitions, gallery browser controls and local source typecheck',prior.map(n=>identity(output+'/runs/'+n+'/manifest.json')));
let failure,browser;const work=run.absolute+'/browser-work';
try{
 let artifacts=0,artifactBytes=0;const states={},durations=[];
 for(const name of prior){const p=output+'/runs/'+name,m=json(p+'/manifest.json');assert.ok(['accepted','rejected','failed','interrupted'].includes(m.state));assert.ok(!existsSync(checked(p)+'/work-browser'));states[m.state]=(states[m.state]??0)+1;
  run.progress('hash',name);for(const a of m.artifacts){const actual=identity(a.path);assert.equal(actual.sha256,a.sha256);assert.equal(actual.bytes,a.bytes);artifacts++;artifactBytes+=a.bytes;}
  for(const parent of m.parents??[])if(parent.path.startsWith(output+'/'))assert.equal(identity(parent.path).sha256,parent.sha256);
  const progress=readFileSync(checked(p+'/progress.jsonl'),'utf8').trim().split(/\r?\n/u).map(s=>JSON.parse(s));assert.equal(progress.at(-1).state,m.state);durations.push({name,seconds:m.elapsedSeconds});
 }
 const rows=json(gallery+'/comparisons.json'),variants=json(gallery+'/uncertainty.json');assert.equal(rows.length,10);assert.equal(variants.length,2);
 for(const time of ['noon','sunset'])for(const height of [5,100,500,2000,40000]){const row=rows.find(r=>r.time===time&&r.height===height);assert.ok(row);for(const model of ['arm','bruneton'])for(const display of ['native','fixed','low']){const png=PNG.sync.read(readFileSync(checked(gallery+'/'+row.id+'-'+model+'-'+display+'.png')));assert.equal(png.width,1024);assert.equal(png.height,576);}assert.ok(Object.values(row.stats).every(s=>s.maximumNativeReplayByteError<=1));}
 const transitions=json(transition+'/captures.json');assert.equal(transitions.length,6);assert.ok(transitions.every(v=>v.transitionComparison.maximumRgbByteError<=1));
 const physical=json(analysis+'/analysis.json');assert.equal(physical.reference.length,8);assert.equal(physical.sensitivity.length,10);assert.ok(physical.cacheSummaries.every(r=>r.maximumDirectTransmissionError<=.01));
 const typecheck=await command(run,'typecheck',['node_modules/typescript/bin/tsc','-p','experiments/clean-horizon-profiles/jsconfig.json']);assert.equal(typecheck.code,0,typecheck.stdout+typecheck.stderr);
 mkdirSync(work);mkdirSync(work+'/temp');browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:'new',userDataDir:work,env:{...process.env,TEMP:work+'/temp',TMP:work+'/temp'},args:['--disable-gpu']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto(pathToFileURL(checked(gallery+'/index.html')).href,{waitUntil:'load'});
 const result=await page.evaluate(async()=>{const counts=[];for(const mode of ['native','fixed','low']){const selector=/** @type {HTMLSelectElement} */(document.querySelector('#display'));selector.value=mode;selector.dispatchEvent(new Event('change'));await Promise.all([...document.images].map(img=>img.decode()));if([...document.images].some(img=>img.naturalWidth!==1024||img.naturalHeight!==576))throw Error('Missing gallery image');counts.push({mode,images:document.images.length});}const selector=/** @type {HTMLSelectElement} */(document.querySelector('#time'));selector.value='noon';selector.dispatchEvent(new Event('change'));const noon=[...document.querySelectorAll('article')].filter(n=>!n.hidden).length;selector.value='sunset';selector.dispatchEvent(new Event('change'));return{counts,noon,sunset:[...document.querySelectorAll('article')].filter(n=>!n.hidden).length};});
 assert.equal(errors.length,0);assert.equal(result.noon,5);assert.equal(result.sunset,7);assert.ok(result.counts.every(v=>v.images===24));
 run.write('verification.json',{states,artifacts,artifactBytes,durations,gallery,transition,analysis,conditions:10,primaryImages:20,uncertaintyImages:2,galleryControls:result,transitionMaximumRgbByteError:Math.max(...transitions.map(v=>v.transitionComparison.maximumRgbByteError)),typecheck:'passed',claim:'Requested illustrative image matrix and bounded checks complete. Optical discrepancy at 500m sunset remains. No five-seed confirmation, matched-order bound, complete measured atmosphere, full GPU-ray validation or standards-compliance claim.'});
 console.log(JSON.stringify({artifacts,artifactMiB:artifactBytes/1048576,conditions:10,transitions:'within one byte',galleryControls:result}));
}catch(error){failure=String(error);run.write('failure.json',{message:failure});}
finally{await browser?.close();if(existsSync(work)){const target=checked(run.path+'/browser-work');assert.equal(target,path.resolve(work));rmSync(target,{recursive:true});}run.finish(failure?'failed':'accepted',{failure});}
if(failure)process.exitCode=1;
