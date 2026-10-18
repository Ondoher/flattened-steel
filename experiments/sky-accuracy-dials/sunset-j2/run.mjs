import assert from 'node:assert/strict';
import path from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';
import {rollup} from 'rollup';
import puppeteer from 'puppeteer';
import {createRun,readRepository,verifyRun,identity,resolveRepository,checkedAbsolute,sha256,storage} from '../io/files.mjs';
import {inputs,source,compilerPath,parent} from './control.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {angular} from '../distant-horizon/attribution-reference.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {phase,illumination} from '../horizon-reference/math.mjs';
import {aerosolPhase} from '../horizon/aerosol-optics.mjs';
import {sourceFrame,dot} from '../numerics/math.js';
import {render} from '../distant-horizon/attribution-common.mjs';

const entry='experiments/sky-accuracy-dials/sunset-j2/browser.mjs';
/** Read JSON, optionally losslessly compressed. @param {string} p @returns {any} */
const read=p=>JSON.parse((p.endsWith('.gz')?gunzipSync(readRepository(p)):readRepository(p)).toString());

/** Identical discrete scattering sum in binary64 from recorded L1 values.
 * @param {any} control @param {any} target @param {number} channel @param {number[]} L
 * @returns {any} Species terms and a per-incoming-direction ledger.
 */
function sum(control,target,channel,L){
 const m=control.medium,table=control.material.phaseTables[channel],axes=sourceFrame(target.point),local=axes.map(a=>dot(a,target.direction)),br=m.rayleigh[channel]*Math.exp(-target.altitude/8000),bm=m.mie[channel]*control.material.albedos[channel]*Math.exp(-target.altitude/1200),incoming=control.request.transportSpec.domains.incoming;
 const terms=incoming.unitVectors.map((v,i)=>{const c=Math.max(-1,Math.min(1,dot(local,v))),p=phase(c,.7),pm=table?aerosolPhase(table,c):p[1],w=incoming.integrationWeightsSteradians[i];return {index:i,local:v,L1:L[i],rayleighWeight:br*p[0]*w,mieWeight:bm*pm*w,mass:pm*w};});
 const mass=terms.reduce((a,t)=>a+t.mass,0),rayleigh=terms.reduce((a,t)=>a+t.L1*t.rayleighWeight,0),mie=terms.reduce((a,t)=>a+t.L1*t.mieWeight,0)/mass;
 return {J2:rayleigh+mie,rayleigh,mie,mieMass:mass,terms:terms.map(t=>({...t,weight:t.rayleighWeight+t.mieWeight/mass,contribution:t.L1*(t.rayleighWeight+t.mieWeight/mass)}))};
}

/** Validated independent local kernel; later events do not change its N1/N2 tallies.
 * @param {any} table @param {number} ssa @returns {{shader:string,proof:any}}
 */
function localKernel(table,ssa){
 return kernel(table,ssa);
}

/** Reduce immutable compiler/reference packets into a conditional attribution ledger.
 * @param {any} control @param {any} compiled @param {any[]} records @returns {any[]}
 */
function reduce(control,compiled,records){
 const rows=[];
 for(const c of control.channels)for(const target of control.targets){
  const channel=compiled.readings.find(d=>d.channel===c),j1=channel.fields.find(d=>d.fieldId==='J1'),j2=channel.fields.find(d=>d.fieldId==='J2');
  const record=records.find(r=>r.channel===c&&r.id===target.id),f68=record.angular.find(r=>r.rule==='F68'),f64=record.angular.find(r=>r.rule==='F68-view64'),refined32=record.angular.find(r=>r.rule==='importance32'),refined64=record.angular.find(r=>r.rule==='importance64');
  const Lcontinuous=f68.samples.incident.map(v=>v[0]+v[1]),B=sum(control,target,c,Lcontinuous),isNode=target.kind==='node';
  const native=isNode?j2.exact.find(x=>x.id===target.id).values[0]:j2.reconstructed.find(x=>x.id===target.id).value;
  const nativeN1=isNode?j1.exact.find(x=>x.id===target.id).values[0]:j1.reconstructed.find(x=>x.id===target.id).value;
  const A=isNode?sum(control,target,c,channel.fields.find(d=>d.fieldId==='L1').exact.find(x=>x.id===target.id).values):null;
  const top=A?A.terms.map((t,i)=>({...t,directL1:Lcontinuous[i],directContribution:B.terms[i].contribution,delta:t.contribution-B.terms[i].contribution})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)):[];
  const main=record.batches.filter(b=>b.profile==='main'),paired=record.batches.filter(b=>b.profile==='control64');assert.equal(main.length,32);assert.equal(paired.length,8);
  const mean=k=>main.reduce((s,b)=>s+b.means[k],0)/32,width=k=>halfWidth(main.map(b=>b.means[k])),monteCarlo={J1:mean(1),J2:mean(2),J1Half95:width(1),J2Half95:width(2),relativeJ2Half95:width(2)/mean(2),quadrature64Relative:paired.reduce((s,b)=>s+b.means[2],0)/main.slice(0,8).reduce((s,b)=>s+b.means[2],0)-1};
  const sun=illumination({...control.medium,sourceDirection:[0,0,1]},target.point,c,128),p=phase(target.direction[2],.7),table=control.material.phaseTables[c],pm=table?aerosolPhase(table,target.direction[2]):p[1];
  const directN1=sun[3]*(control.medium.rayleigh[c]*Math.exp(-target.altitude/8000)*p[0]+control.medium.mie[c]*control.material.albedos[c]*Math.exp(-target.altitude/1200)*pm);
  rows.push({channel:c,wavelength:control.request.transportSpec.domains.spectrum.channels[c].centerNanometers,id:target.id,kind:target.kind,altitude:target.altitude,native,nativeN1,A,B,C:refined64?.J2??null,angular32:refined32?.J2??null,angularRelative:refined64?refined32.J2/refined64.J2-1:null,path64Relative:f64.J2/f68.J2-1,monteCarlo,directN1,directN1MonteCarloRelative:directN1?monteCarlo.J1/directN1-1:null,nativeOverMC:native/monteCarlo.J2,continuousF68OverMC:B.J2/monteCarlo.J2,refinedOverMC:refined64?refined64.J2/monteCarlo.J2:null,replayRelative:A?A.J2/native-1:null,incidentDelta:A?A.J2-B.J2:null,angularDelta:refined64?B.J2-refined64.J2:null,topDirections:top.slice(0,12),J2PrecisionMet:monteCarlo.relativeJ2Half95<=.05});
 }
 return rows;
}

/** Reviewable ratio bars and incoming-direction attribution, not three-band sky colors.
 * @param {DialRun} run @param {any[]} rows @returns {Promise<void>}
 */
async function figures(run,rows){
 const height=120+rows.length*130;
 const ratios=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="30" font-size="23">Sunset J2: where does the excess enter?</text><text x="25" y="57">All bars divided by independent local J2. Red stored/reconstructed; orange same F68 with continuous L1; green refined angular.</text><text x="25" y="82">Three wavelengths only; local source density W m^-3 sr^-1 nm^-1. No full-spectrum color claim.</text>${rows.map((r,i)=>{const top=115+130*i,values=[r.nativeOverMC,r.continuousF68OverMC,r.refinedOverMC],maximum=Math.max(1,...values.filter(v=>v!==null))*1.08,x=v=>330+v/maximum*800;return `<text x="15" y="${top+8}">${r.id}, ${r.wavelength.toFixed(1)}nm</text><text x="15" y="${top+31}" font-size="12">MC J2 ${r.monteCarlo.J2.toExponential(3)} +/-${r.monteCarlo.J2Half95.toExponential(2)}</text><path d="M${x(1)} ${top-10}V${top+90}" stroke="#222" stroke-dasharray="4 3"/>${values.map((v,j)=>v===null?'':`<rect x="330" y="${top+j*28}" width="${Math.max(0,x(v)-330)}" height="20" fill="${['#bd3442','#d38422','#3a884c'][j]}"/><text x="${x(v)+6}" y="${top+j*28+16}">${v.toFixed(3)}x</text>`).join('')}`;}).join('')}</g></svg>`;
 const nodeRows=rows.filter(r=>r.kind==='node'),directionHeight=100+nodeRows.length*210;
 const directions=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${directionHeight}"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif"><text x="25" y="30" font-size="22">Largest incoming L1 contributions to the J2 difference</text><text x="25" y="56">Each panel: top six signed native-minus-continuous contributions, with fixed normalized F68 weights.</text>${nodeRows.map((r,i)=>`<text x="25" y="${90+210*i}" font-size="18">${r.id}, ${r.wavelength.toFixed(1)}nm</text>${r.topDirections.slice(0,6).map((t,j)=>`<text x="40" y="${118+210*i+j*25}">dir${t.index}, local mu=${t.local[2].toFixed(5)}; native L1=${t.L1.toExponential(3)}, direct=${t.directL1.toExponential(3)}; delta J2=${t.delta.toExponential(3)}</text>`).join('')}`).join('')}</g></svg>`;
 await render(run,[{name:'components',svg:ratios,width:1200,height},{name:'incoming',svg:directions,width:1200,height:directionHeight}]);
}

/** Read-only post-seal verifier.
 * @param {string} root
 * @returns {{verified:string,microbatchCount:number,reportedBatches:number,sourceAndPhysicsMatched:boolean,rows:any[],storage:DialStorage}} Recomputed qualification receipt.
 */
function verify(root){
 verifyRun(root);verifyRun(parent);const control=read(root+'/control.json.gz'),compiled=read(root+'/compiler-probes.json.gz'),records=read(root+'/independent-records.json.gz'),rows=reduce(control,compiled,records);assert.deepEqual(rows,read(root+'/analysis.json').rows);
 const original=read(parent+'/control.json');for(const key of ['request','integrationSpec','material','medium'])assert.deepEqual(control[key],original[key]);assert.deepEqual(control.scenes,[original.scenes[0]]);assert.deepEqual(control.channels,[3,5,8]);
 const compiler=gunzipSync(readRepository(root+'/compiler.js.gz')).toString().replace("await globalThis['__h67Observe']({gl,fieldId,resource,common});","if(fieldId.startsWith('J'))await globalThis['__h61Observe']({gl,fieldId,resource,common});");assert.equal(sha256(compiler),sha256(gunzipSync(readRepository(parent+'/k0.35/compiler.js.gz'))));
 let microbatchCount=0;for(const channel of control.channels){
  const packets=read(root+`/microbatches-${channel}.json.gz`);assert.equal(packets.length,1280);microbatchCount+=packets.length;
  for(let group=0;group<4;group++)for(const profile of ['main','control64']){
   const set=packets.filter(p=>p.group===group&&p.profile===profile),count=profile==='main'?256:64;assert.equal(set.length,count);assert.deepEqual(set.map(p=>p.batch),Array.from({length:count},(_,i)=>i));
   const record=records.find(r=>r.channel===channel&&r.id===control.targets[group].id);assert.ok(record);
   for(let batch=0;batch<count/8;batch++){const selected=set.slice(batch*8,batch*8+8),means=selected[0].means.map((_,i)=>selected.reduce((s,p)=>s+p.means[i],0)/8),reported=record.batches.find(b=>b.profile===profile&&b.batch===batch);assert.deepEqual(reported.means,means);}
  }
 }
 assert.equal(compiled.readings.length,3);assert.equal(rows.length,12);for(const r of rows){assert.ok(Number.isFinite(r.native)&&r.native>=0&&r.monteCarlo.J2>0);if(r.A)assert.ok(Math.abs(r.replayRelative)<.001,`F68 reconstruction mismatch ${r.id} ${r.replayRelative}`);}
 const result={verified:root,microbatchCount,reportedBatches:records.reduce((s,r)=>s+r.batches.length,0),sourceAndPhysicsMatched:true,rows:rows.map(r=>({id:r.id,channel:r.channel,nativeOverMC:r.nativeOverMC,continuousF68OverMC:r.continuousF68OverMC,refinedOverMC:r.refinedOverMC,replayRelative:r.replayRelative,precision:r.monteCarlo.relativeJ2Half95,path64:r.path64Relative,angular32:r.angularRelative})),storage:storage()};console.log(JSON.stringify(result));return result;
}

/** Serial compiler, continuous-angular and local path-reference campaign.
 * @returns {Promise<void>}
 */
async function main(){
 const {control,parents}=inputs(),compilerSource=source();assert.ok(control.queries.length<=32);assert.equal(control.request.transportSpec.domains.position.nodes[0].altitudeMeters,0);
 const recipe={parents,operation:'H67 exact-node native L1-to-J2 algebra, independent continuous L1 at same F68, refined phase-importance angular integration, independent local J1/J2 Monte Carlo and off-grid cubic reconstruction. No production modification.',parameters:{channels:control.channels,controlHash:sha256(JSON.stringify(control)),controlArtifact:'control.json.gz',pathsPerDraw:1024,microbatchesPerReportedBatch:8,mainReportedBatches:32,controlReportedBatches:8,kernel:'Validated full path kernel; N1/N2 prefix tallies only for this attribution.'}};
 if(process.argv[2]==='preflight'){console.log(JSON.stringify({preflight:true,targets:control.targets,queryCount:control.queries.length,compilerBytes:compilerSource.length,storage:storage()}));return;}
 const run=createRun('h67-sunset-j2',recipe);let browser,failure=null;const records=[];
 try{
  run.write('control.json.gz',gzipSync(Buffer.from(JSON.stringify(control))));run.write('compiler.js.gz',gzipSync(Buffer.from(compilerSource)));
  const browserSource=readRepository(entry).toString()+`\nimport * as compiler from '${resolveRepository(compilerPath).replaceAll('\\','/')}';globalThis['__h67Execute']=c=>execute(c,compiler);`;
  const bundle=await rollup({input:resolveRepository(entry),plugins:[{name:'h67-contained',transform(code,id){if(path.resolve(id)===resolveRepository(compilerPath))return{code:compilerSource,map:null};if(path.resolve(id)===resolveRepository(entry))return{code:browserSource,map:null};return null;}}]});let code;try{code=(await bundle.generate({format:'iife'})).output[0].code;}finally{await bundle.close();}run.write('browser.js.gz',gzipSync(Buffer.from(code)));
  browser=await puppeteer.launch({executablePath:checkedAbsolute(path.resolve('C:/Program Files/Google/Chrome/Application/chrome.exe')),headless:true,userDataDir:checkedAbsolute(path.join(run.scratchPath,'gpu'),false),protocolTimeout:1800000,args:['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11','--disable-background-timer-throttling']});const page=await browser.newPage();await page.exposeFunction('__h67Progress',m=>run.progress('compiler',String(m)));await page.addScriptTag({content:code});
  const compiled=await page.evaluate(c=>globalThis['__h67Execute'](c),control);run.write('compiler-probes.json.gz',gzipSync(Buffer.from(JSON.stringify(compiled))));console.log(JSON.stringify({compiler:'complete',renderer:compiled.renderer}));
  const algebra=compiled.readings.flatMap(c=>control.targets.filter(t=>t.kind==='node').map(t=>{const L=c.fields.find(f=>f.fieldId==='L1').exact.find(x=>x.id===t.id).values,native=c.fields.find(f=>f.fieldId==='J2').exact.find(x=>x.id===t.id).values[0],value=sum(control,t,c.channel,L);return {id:t.id,channel:c.channel,native,binary64:value.J2,relative:value.J2/native-1};}));run.write('same-input-algebra.json',algebra);assert.ok(algebra.every(a=>Math.abs(a.relative)<.001),'Same-input J2 algebra must qualify before independent tracing.');
  const medium={...control.medium,sourceDirection:[0,0,1]};let channel=-1;const batches=[];
  const microbatches=[];await page.exposeFunction('retainBatch',b=>{microbatches.push({...b,channel});run.progress('independent',`channel${channel} point${b.group} ${b.profile} microbatch${b.batch+1}`);if(b.batch%8===7){const selected=microbatches.filter(p=>p.channel===channel&&p.group===b.group&&p.profile===b.profile&&Math.floor(p.batch/8)===Math.floor(b.batch/8));assert.equal(selected.length,8);batches.push({...b,channel,batch:Math.floor(b.batch/8),means:b.means.map((_,i)=>selected.reduce((s,p)=>s+p.means[i],0)/8),maximumDepth:Math.max(...selected.map(p=>p.maximumDepth))});}});
  for(channel of control.channels){
   const generated=localKernel(control.material.phaseTables[channel],control.material.albedos[channel]);run.write(`local-${channel}.glsl.gz`,gzipSync(Buffer.from(generated.shader)));run.write(`sampling-${channel}.json`,generated.proof);
   const groups=control.targets.map(t=>({id:t.id,origin:t.point,direction:t.direction,medium,channel,end:-1}));
   const telemetry=await page.evaluate(executeGpu,generated.shader,{groups,paths:1024,profiles:[{name:'main',batches:256,quadrature:128,roulette:8,seed:1610612736},{name:'control64',batches:64,quadrature:64,roulette:8,seed:1610612736}],maximumMilliseconds:900000});run.write(`telemetry-${channel}.json`,telemetry);run.write(`microbatches-${channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(microbatches.filter(b=>b.channel===channel)))));
   for(let group=0;group<control.targets.length;group++){
    const target=control.targets[group],rules=target.kind==='node'?['F68','importance32','importance64']:['F68'];
    const evaluated=await angular(page,run,control,medium,channel,target,rules,false);
    const record={channel,id:target.id,angular:evaluated,batches:batches.filter(b=>b.channel===channel&&b.group===group)};records.push(record);run.write(`reference-${channel}-${target.id}.json.gz`,gzipSync(Buffer.from(JSON.stringify(record))));console.log(JSON.stringify({channel,target:target.id,phase:'reference-complete'}));
   }
  }
  run.write('independent-records.json.gz',gzipSync(Buffer.from(JSON.stringify(records))));const rows=reduce(control,compiled,records);for(const r of rows)if(r.A)assert.ok(Math.abs(r.replayRelative)<.001,`Exact same-input J2 mismatch ${r.replayRelative}`);
  run.write('analysis.json',{rows,limits:['Three selected wavelengths and four local source-density targets; no full-spectrum color or paper RMSE claim.','Independent empirical sampling intervals and64/128/importance32/64 controls are qualifications, not formal model bounds.','Old no-shadow tangent proof is deliberately not applied at dusk; paired integration and independent local path estimates qualify the new continuous-angular calculation.','Exact-node input and angular substitutions are conditional on the other operator; off-grid values include combined reconstruction effects.']});
  run.write('summary.tsv',['channel\twavelength\ttarget\tnativeJ2\tcontinuousL1F68J2\trefinedJ2\tindependentJ2\tindependent95\tnativeOverIndependent\tinputDelta\tangularDelta',...rows.map(r=>[r.channel,r.wavelength,r.id,r.native,r.B.J2,r.C??'',r.monteCarlo.J2,r.monteCarlo.J2Half95,r.nativeOverMC,r.incidentDelta??'',r.angularDelta??''].join('\t'))].join('\n'));
  await browser.close();browser=null;await figures(run,rows);run.write('verification.json',{rows:12,channels:3,targets:4,batches:records.reduce((n,r)=>n+r.batches.length,0),exactAlgebraMaximum:Math.max(...rows.filter(r=>r.A).map(r=>Math.abs(r.replayRelative))),sourcePhysicsUnchanged:true,precision:rows.map(r=>({id:r.id,channel:r.channel,passed:r.J2PrecisionMet,relative95:r.monteCarlo.relativeJ2Half95}))});
 }catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,records:records.length});}
 verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null}));if(failure)throw failure;verify(run.path);
}

if(process.argv[2]==='verify'){
 const result=verify(process.argv[3]);if(process.argv[4]==='--record'){const run=createRun('h67-j2-verify',{parents:[verifyRun(process.argv[3]),identity('experiments/sky-accuracy-dials/sunset-j2/run.mjs')],operation:'Read-only H67 requalification of parent/source/physics, all3840 microbatches and480 reported aggregates, twelve source-density rows, exact-node algebra and numerical qualification summaries.'});let failure=null;try{run.write('verification.json',result);}catch(e){failure=e;}finally{run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null});}verifyRun(run.path);console.log(JSON.stringify({verificationRun:run.path}));if(failure)throw failure;}
}else await main();
