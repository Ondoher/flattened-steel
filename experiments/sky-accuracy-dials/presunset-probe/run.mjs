import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync,gunzipSync} from 'node:zlib';
import {existsSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {createRun,readRepository,identity,verifyRun,checkedAbsolute,resolveRepository,sha256} from '../io/files.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {boundary} from '../horizon-reference/math.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {colorimetry} from '../horizon/diagnosis-color.mjs';
import {gpu,reference} from '../twilight-reference/run.mjs';
import {ColorResetSlope078P2ColorDisplayModel} from '../../../src/algorithm32/implementation/color-reset-slope-078-p2/ColorResetSlope078P2ColorDisplayModel.js';
import {inputs,oldGpu,oldMain,oldFine} from './control.mjs';
import {direct} from './direct.mjs';
import {qualify} from './rounding.mjs';

/** Measure our independently coded continuous transport, never a cache replay.
 * @param {boolean} pilot @returns {Promise<void>} Qualified execution and retained batch moments.
 */
async function independent(pilot){
 const {control,parents}=inputs(),paths=pilot?2048:8192,channels=pilot?[3,5,8]:control.channels,profiles=pilot?[{name:'pilot',batches:4,quadrature:128,roulette:8,seed:71303168}]:[{name:'main',batches:24,quadrature:128,roulette:8,seed:268435456},{name:'control64',batches:8,quadrature:64,roulette:8,seed:268435456}];
 const reuseAt=process.argv.indexOf('--reuse'),reuseRoot=reuseAt<0?null:process.argv[reuseAt+1],reuseSeal=reuseRoot?verifyRun(reuseRoot):null;
 let previous;
 if(reuseRoot){assert.ok(!pilot);assert.deepEqual(JSON.parse(readRepository(reuseRoot+'/control.json').toString()),control);assert.deepEqual(JSON.parse(readRepository(reuseRoot+'/sampling.json').toString()),{paths,channels,profiles});previous=JSON.parse(readRepository(reuseRoot+'/sealed.json').toString());parents.push(reuseSeal);const definition=JSON.parse(readRepository(reuseRoot+'/definition.json').toString());for(const p of ['experiments/sky-accuracy-dials/horizon-reference/gpu.mjs','experiments/sky-accuracy-dials/distant-horizon/toronto-orders.mjs','experiments/sky-accuracy-dials/presunset-probe/direct.mjs'])assert.equal(identity(p).sha256,definition.sources.find(x=>x.path===p).sha256);}
 const run=createRun(pilot?'h65-ind-pilot':'h65-independent',{parents,operation:'H47 independent cache-free GPU Monte Carlo at exact H65 pre-sunset/sunset rays. Continuous exponential medium, Toronto analytic table inverse, pure orders1-4 and separate all-order compensated roulette estimate.',parameters:{paths,channels,profiles,parentControlHash:identity(oldGpu+'/control.json').sha256,newControlHash:sha256(JSON.stringify(control)),newControlArtifact:'control.json',targetY95:.03,targetBand95:.10}});
 let browser,failure=null,currentChannel=-1;const batches=[],telemetry=[],rounding=[];
 try{
  run.write('control.json',control);run.write('sampling.json',{paths,channels,profiles});
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--disable-software-rasterizer','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();
  await page.exposeFunction('retainBatch',b=>{const q=qualify(b.means);if(q.deficit>0)rounding.push({channel:currentChannel,profile:b.profile,group:b.group,batch:b.batch,...q});batches.push({channel:currentChannel,profile:b.profile,group:b.group,batch:b.batch,means:b.means.slice(0,5),maximumDepth:b.maximumDepth});run.progress('independent',`channel${currentChannel} ${b.profile} group${b.group} batch${b.batch}`);});
  for(const channel of channels){
   currentChannel=channel;const generated=kernel(control.material.phaseTables[channel],control.material.albedos[channel]);
   if(reuseRoot&&existsSync(resolveRepository(reuseRoot+`/batches-${channel}.json.gz`,'',false))&&existsSync(resolveRepository(reuseRoot+`/direct-${channel}.json`,'',false))){
    assert.equal(gunzipSync(readRepository(reuseRoot+`/shader-${channel}.glsl.gz`)).toString(),generated.shader);
    const old=JSON.parse(gunzipSync(readRepository(reuseRoot+`/batches-${channel}.json.gz`)).toString());assert.equal(old.length,192);for(const r of old){assert.equal(r.channel,channel);qualify(r.means);batches.push(r);}
    for(const name of [`batches-${channel}.json.gz`,`direct-${channel}.json`,`shader-${channel}.glsl.gz`,`phase-proof-${channel}.json`]){const record=previous.artifacts.find(a=>a.path===reuseRoot+'/'+name);assert.ok(record);run.write(name,readRepository(record.path,record),{parents:[reuseSeal,record],operation:'Reuse completed immutable wavelength with exact controls, physical inputs, random streams, transport shader and executor. Only order-rounding validation changed; no radiance values altered.'});}
    telemetry.push({channel,reused:true,parent:reuseRoot});run.progress('reuse',`Reused completed channel${channel}`);console.log(JSON.stringify({channel,reused:true}));continue;
   }
   run.write(`shader-${channel}.glsl.gz`,gzipSync(Buffer.from(generated.shader)));run.write(`phase-proof-${channel}.json`,generated.proof);
   const groups=control.scenes.flatMap(scene=>control.elevations.map(elevation=>{const theta=scene.zenith*Math.PI/180,e=elevation*Math.PI/180,a=control.azimuth*Math.PI/180,medium={...control.medium,sourceDirection:[Math.sin(theta),0,Math.cos(theta)]},origin=[0,0,medium.radius+5],direction=[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)];return {id:scene.id+'-'+elevation,medium,origin,direction,channel,end:boundary(medium,origin,direction).distance};}));
   const result=await page.evaluate(executeGpu,generated.shader,{groups,paths,profiles,maximumMilliseconds:1800000});telemetry.push({channel,...result});run.write(`batches-${channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(batches.filter(b=>b.channel===channel)))));if(!pilot){const proof=groups.map(g=>({id:g.id,channel,Q64:direct(g,control.material,64),Q128:direct(g,control.material,128)}));run.write(`direct-${channel}.json`,proof);run.progress('direct',`channel${channel} binary64 first-order control`);}console.log(JSON.stringify({channel,...result}));
  }
  run.write('rounding.json',{gamma16:16*2**-24/(1-16*2**-24),witnesses:rounding});run.write('batches.json.gz',gzipSync(Buffer.from(JSON.stringify(batches))));run.write('telemetry.json',telemetry);
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,batches:batches.length});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

/** Independent spectral means, pure/cumulative orders and paired quadrature responses.
 * @param {any[]} batches @param {any} control @returns {any[]}
 */
export function reduce(batches,control){
 return control.scenes.flatMap((scene,t)=>control.elevations.map((elevation,j)=>{
  const group=t*3+j,profiles=['main','control64'].map(profile=>{
   const count=profile==='main'?24:8,perBatch=Array.from({length:count},(_,b)=>control.channels.map(c=>{const x=batches.find(r=>r.channel===c&&r.profile===profile&&r.group===group&&r.batch===b);assert.ok(x);return x.means;}));
   const metrics=[{id:'N1',indices:[1]},{id:'N12',indices:[1,2]},{id:'N123',indices:[1,2,3]},{id:'N1234',indices:[1,2,3,4]},{id:'all',indices:[0]}].map(({id,indices})=>{
    const samples=perBatch.map(row=>row.map(m=>indices.reduce((s,k)=>s+m[k],0))),spectrum=control.channels.map((_,c)=>samples.reduce((s,v)=>s+v[c],0)/count);return {id,spectrum,color:colorimetry(spectrum,'bin-integrated'),bandHalfWidths95:control.channels.map((_,c)=>halfWidth(samples.map(v=>v[c]))),luminanceHalfWidth95:halfWidth(samples.map(v=>colorimetry(v,'bin-integrated').luminanceCdPerM2)),samples};
   });return {profile,metrics};
  });
  const main=profiles[0].metrics,coarse=profiles[1].metrics;for(let c=0;c<15;c++){for(let k=1;k<4;k++)assert.ok(main[k].spectrum[c]>=main[k-1].spectrum[c]);qualify([main[4].spectrum[c],...main.slice(0,4).map((m,i)=>m.spectrum[c]-(i?main[i-1].spectrum[c]:0))]);}
  const integrationControl=main.map((m,i)=>{const d=coarse[i].samples.map((v,b)=>colorimetry(v,'bin-integrated').luminanceCdPerM2-colorimetry(m.samples[b],'bin-integrated').luminanceCdPerM2);return {id:m.id,Y64Minus128:d.reduce((s,x)=>s+x,0)/d.length,pairedHalfWidth95:halfWidth(d)};});
  return {id:scene.id+'-'+elevation,scene,elevation,metrics:main,control:coarse,integrationControl};
 }));
}

/** Resolve new pre-sunset cache observations and reused exact H64 sunset observations.
 * @param {string} root @param {string} scene @param {number} elevation @returns {any[]}
 */
function caches(root,scene,elevation){
 const witnesses=JSON.parse(readRepository(root+'/k1/execution.json').toString()).witnesses,index=witnesses.findIndex(w=>w.scene===scene&&w.elevation===elevation&&w.intervals===30);assert.ok(index>=0);
 return [1,.35].map(k=>{const channels=Array.from({length:15},(_,c)=>JSON.parse(gunzipSync(readRepository(root+`/k${k}/channel-${c}.json.gz`)).toString())),cumulative=[0,1,2,3].map(o=>channels.map(c=>c.cumulative[o][index])),pure=[0,1,2,3].map(o=>channels.map(c=>c.native[o][index]));const view120=channels.map(c=>c.cumulative[3][index+1]);return {k,cumulative,pure,spectrum:cumulative[3],view120,viewRelativeY:colorimetry(view120,'bin-integrated').luminanceCdPerM2/colorimetry(cumulative[3],'bin-integrated').luminanceCdPerM2-1,color:colorimetry(cumulative[3],'bin-integrated')};});
}

/** Matched three-method images and order/reference diagnosis, without modifying parent evidence.
 * @param {string} own @param {string} preGpu @param {string} preRef @param {string} preFine @returns {Promise<void>}
 */
async function report(own,preGpu,preRef,preFine){
 const {control,parents}=inputs();for(const p of [own,preGpu,preRef,preFine])parents.push(verifyRun(p));
 const measured=JSON.parse(gunzipSync(readRepository(own+'/batches.json.gz')).toString()),ind=reduce(measured,control);
 const main=[...JSON.parse(readRepository(preRef+'/summary.json').toString()),...JSON.parse(readRepository(oldMain+'/summary.json').toString()).filter(r=>r.id.startsWith('sunset'))],fine=[...JSON.parse(readRepository(preFine+'/summary.json').toString()),...JSON.parse(readRepository(oldFine+'/summary.json').toString()).filter(r=>r.id.startsWith('sunset'))];
 const rows=ind.map(r=>{const cache=caches(r.scene.id==='sunset'?oldGpu:preGpu,r.scene.id,r.elevation),reference=main.find(x=>x.id===r.id);assert.ok(reference);return {...r,cache,reference,refined:fine.find(x=>x.id===r.id),independentAllOverReference:r.metrics[4].color.luminanceCdPerM2/reference.color.luminanceCdPerM2-1,independentTailFraction:1-r.metrics[3].color.luminanceCdPerM2/r.metrics[4].color.luminanceCdPerM2};});
 const run=createRun('h65-probe-report',{parents,operation:'H65 two-time comparison of independent pure/cumulative/all-order GPU estimates, corrected/focused cache probes and external all-order reference; fixed common sunset display, empirical uncertainty and paired quadrature controls.',parameters:{own,preGpu,preRef,preFine,oldGpu,oldMain,oldFine}});let failure=null,browser;
 try{
  const directControls=rows.map(r=>{const packets=Array.from({length:15},(_,c)=>JSON.parse(readRepository(own+`/direct-${c}.json`).toString()).find(x=>x.id===r.id));const Q64=packets.map(x=>x.Q64),Q128=packets.map(x=>x.Q128),color=colorimetry(Q128,'bin-integrated');return {id:r.id,Q64,Q128,color,Q64RelativeY:colorimetry(Q64,'bin-integrated').luminanceCdPerM2/color.luminanceCdPerM2-1,monteCarloRelativeY:r.metrics[0].color.luminanceCdPerM2/color.luminanceCdPerM2-1};});
  const quality=rows.map(r=>({id:r.id,metrics:r.metrics.map(m=>({id:m.id,Y95Relative:m.luminanceHalfWidth95/m.color.luminanceCdPerM2,targetYMet:m.luminanceHalfWidth95/m.color.luminanceCdPerM2<=.03,maxBand95Relative:Math.max(...m.bandHalfWidths95.map((h,c)=>h/m.spectrum[c]))})),integrationControl:r.integrationControl,viewRefinement:r.cache.map(c=>c.viewRelativeY),cacheCumulativeY:r.cache.map(c=>c.cumulative.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2)),cachePureY:r.cache.map(c=>c.pure.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2)),independentPureY:r.metrics.slice(0,4).map((m,i)=>m.color.luminanceCdPerM2-(i?r.metrics[i-1].color.luminanceCdPerM2:0))}));
  run.write('analysis.json',{rows,directControls,quality,rounding:JSON.parse(readRepository(own+'/rounding.json').toString()),limits:['Independent solver uses continuous-medium cache-free path transport; finite N4 and all-order roulette estimates differ.','External estimates are all orders; no fresh external N1 or exact intermediate-order separation.','Independent and external empirical intervals are sampling estimates, not formal model/geometry bounds.','GPU Float32 spherical geometry and optical quadrature are numerical limits; paired64/128 controls retained.','Common H64 sunset display context at both times; spectral swatches, not full-scene captures.']});
  const display=new ColorResetSlope078P2ColorDisplayModel(),rgb=s=>display.linearSrgbToDisplayRgb(/** @type {[number,number,number]} */([...colorimetry(s,'midpoint',false).rgb]),{value:control.scenes[0].displayLux,units:'lux'}).map(x=>Math.round(x*255));
  const methods=r=>[...r.cache.map(c=>({spectrum:c.spectrum,color:c.color,half:0})),...r.metrics.slice(3).map(m=>({spectrum:m.spectrum,color:m.color,half:m.luminanceHalfWidth95})),{spectrum:r.reference.meanSpectrum,color:r.reference.color,half:r.reference.luminanceHalfWidth95}];
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="${140+rows.length*145}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" fill="#111"><text x="20" y="28" font-size="22">Toronto: pre-sunset and sunset independent comparison</text><text x="20" y="52">Same rays and fixed sunset P2 display; Y cd/m2; +/- empirical95% sampling interval.</text>${['Corrected60 N1-N4','Focused60 N1-N4','Independent N1-N4','Independent all orders','libRadtran all orders'].map((s,i)=>`<text x="${160+i*270}" y="85">${s}</text>`).join('')}${rows.map((r,i)=>`<text x="15" y="${132+145*i}">${r.scene.id} ${r.elevation}deg</text>${methods(r).map((m,j)=>`<rect x="${155+j*270}" y="${100+i*145}" width="255" height="90" fill="rgb(${rgb(m.spectrum).join(',')})"/><text x="${155+j*270}" y="${213+i*145}">Y ${m.color.luminanceCdPerM2.toFixed(1)}${m.half?' +/-'+m.half.toFixed(1):''}</text>`).join('')}`).join('')}<text x="20" y="${130+rows.length*145}">5deg sideways from Sun; continuous-medium independent solver; no per-method exposure fitting.</text></g></svg>`;run.write('comparison.svg',svg);
  const spectra=`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="${100+rows.length*240}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="30" y="28" font-size="22">Spectral radiance: W m^-2 sr^-1 nm^-1</text><text x="30" y="53">Corrected magenta; focused orange; independent N4 dashed green/all solid green; libRadtran blue.</text>${rows.map((r,i)=>{const top=90+i*240,bottom=top+160,curves=[{s:r.cache[0].spectrum,c:'#b22561'},{s:r.cache[1].spectrum,c:'#ba7000'},{s:r.metrics[3].spectrum,c:'#278635',dash:true},{s:r.metrics[4].spectrum,c:'#278635',h:r.metrics[4].bandHalfWidths95},{s:r.reference.meanSpectrum,c:'#166ec1',h:r.reference.spectralHalfWidth95}],maximum=Math.max(...curves.flatMap(v=>v.s.map((x,c)=>x+(v.h?.[c]??0))))*1.05,x=c=>65+c/14*1200,y=v=>bottom-145*v/maximum;return `<text x="65" y="${top-8}">${r.id}; scale max ${maximum.toPrecision(4)}</text><path d="M65 ${top}V${bottom}H1265" stroke="#888" fill="none"/>${curves.map(v=>`<path d="${v.s.map((z,c)=>`${c?'L':'M'}${x(c)},${y(z)}`).join(' ')}" fill="none" stroke="${v.c}" stroke-width="2" ${v.dash?'stroke-dasharray="6 4"':''}/>${v.h?v.s.map((z,c)=>`<path d="M${x(c)} ${y(z+v.h[c])}V${y(Math.max(0,z-v.h[c]))}" stroke="${v.c}" opacity=".5"/>`).join(''):''}`).join('')}<text x="65" y="${bottom+22}">375.7 to814.3nm</text>`;}).join('')}</g></svg>`;run.write('spectra.svg',spectra);
  const orders=`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${110+rows.length*175}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="20" y="28" font-size="21">Cumulative-order luminance: corrected / focused / independent</text><text x="20" y="54">Each row gives N1, N1-2, N1-3, N1-4; external all-order total shown separately.</text>${rows.map((r,i)=>`<text x="20" y="${95+i*175}" font-size="18">${r.id}; external all orders Y ${r.reference.color.luminanceCdPerM2.toFixed(1)}</text>${[...r.cache.map(c=>c.cumulative),r.metrics.slice(0,4).map(m=>m.spectrum)].map((v,j)=>`<text x="35" y="${122+i*175+j*28}">${['Corrected60','Focused60','Independent'][j]}: ${v.map(s=>colorimetry(s,'bin-integrated').luminanceCdPerM2.toFixed(1)).join(' / ')}</text>`).join('')}`).join('')}</g></svg>`;run.write('orders.svg',orders);
  run.write('summary.tsv',['scene\televation\tcorrectedY\tfocusedY\tindependentN4Y\tindependentAllY\tindependentAll95\tlibradtranY\tlibradtran95\tindependentRelativeY\ttailFraction',...rows.map(r=>[r.scene.id,r.elevation,...r.cache.map(c=>c.color.luminanceCdPerM2),r.metrics[3].color.luminanceCdPerM2,r.metrics[4].color.luminanceCdPerM2,r.metrics[4].luminanceHalfWidth95,r.reference.color.luminanceCdPerM2,r.reference.luminanceHalfWidth95,r.independentAllOverReference,r.independentTailFraction].join('\t'))].join('\n'));
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'images'),false)});const page=await browser.newPage();for(const [name,width,height]of [['comparison',1540,140+rows.length*145],['spectra',1320,100+rows.length*240],['orders',1100,110+rows.length*175]]){await page.setViewport({width:Number(width),height:Number(height)});await page.setContent('<style>body{margin:0}</style>'+readRepository(run.path+'/'+name+'.svg').toString());run.write(name+'.png',await page.screenshot({type:'png'}));}
  console.log(JSON.stringify(rows.map(r=>({id:r.id,independentAll:r.metrics[4].color.luminanceCdPerM2,independent95:r.metrics[4].luminanceHalfWidth95,external:r.reference.color.luminanceCdPerM2,relative:r.independentAllOverReference,tail:r.independentTailFraction}))));
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const mode=process.argv[2];if(mode==='pilot'||mode==='independent')await independent(mode==='pilot');else if(mode==='gpu')await gpu(inputs(true),'h65-pre-gpu');else if(mode==='reference'||mode==='fine')await reference(mode==='fine'?'fine':'main',inputs(true),mode==='fine'?'h65-pre-fine':'h65-pre-ref');else if(mode==='report')await report(process.argv[3],process.argv[4],process.argv[5],process.argv[6]);else throw new Error('Select pilot, independent, gpu, reference, fine or report.');}
