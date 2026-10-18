import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {kernel} from '../distant-horizon/toronto-orders.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';
import {read,launch,oldReferences} from './common.mjs';

const registrationRoot=process.argv[2],selection=process.argv[3]??'development';verifyRun(registrationRoot);const reg=read(registrationRoot+'/registration.json.gz'),targets=selection==='development'?reg.development:selection==='reserved'?reg.reserved:null;assert.ok(targets);
const run=createRun(selection==='development'?'h76-dev-ref':'h80-val-ref',{parents:[verifyRun(registrationRoot)],operation:'Matched cache-free full path estimator at new geometry; separately retain pure N2 total/Rayleigh/Mie means and shared-band histories, paired optical control. Reserved cases used only by explicit validation mode.',parameters:{selection,targets:targets.map(t=>t.id),paths:1024,mainBatches:256,reportedBatchSize:8,controlBatches:64,seedBases:{paper:1241513984,toronto:1342177280}}});
let browser,failure=null,channel=-1,profileId='',packets=[];const references=selection==='development'?oldReferences():[];
try{
 browser=await launch(run);const page=await browser.newPage();await page.exposeFunction('retainBatch',b=>{packets.push({...b,channel,profile:profileId,precisionProfile:b.profile});run.progress('reference',`${profileId} channel${channel} target${b.group} ${b.profile} batch${b.batch}`);});
 for(const profile of reg.profiles){profileId=profile.id;const c=profile.control;for(channel of reg.channels){
  const generated=kernel(c.material.phaseTables[channel],c.material.albedos[channel]);run.write(`${profileId}-kernel-${channel}.glsl.gz`,gzipSync(Buffer.from(generated.shader)));
  const groups=targets.map(t=>({id:t.id,origin:t.point,direction:t.direction,medium:{...c.medium,sourceDirection:[0,0,1]},channel,end:-1})),seed=profileId==='paper'?1241513984:1342177280;
  const telemetry=await page.evaluate(executeGpu,generated.shader,{groups,paths:1024,profiles:[{name:'main',batches:256,quadrature:128,roulette:8,seed},{name:'control64',batches:64,quadrature:64,roulette:8,seed}],maximumMilliseconds:1800000});run.write(`${profileId}-telemetry-${channel}.json`,telemetry);
  const set=packets.filter(p=>p.profile===profileId&&p.channel===channel);run.write(`${profileId}-batches-${channel}.json.gz`,gzipSync(Buffer.from(JSON.stringify(set))));
  for(let group=0;group<targets.length;group++){
   const main=set.filter(p=>p.group===group&&p.precisionProfile==='main'),control=set.filter(p=>p.group===group&&p.precisionProfile==='control64');assert.equal(main.length,256);assert.equal(control.length,64);const aggregate=k=>Array.from({length:32},(_,i)=>main.slice(i*8,i*8+8).reduce((s,b)=>s+b.means[k],0)/8),batches=aggregate(2),rayleighBatches=aggregate(12),mieBatches=aggregate(13),mean=batches.reduce((a,b)=>a+b,0)/32,half95=halfWidth(batches),quadratureChange=(control.reduce((s,b)=>s+b.means[2],0)/64)/(main.slice(0,64).reduce((s,b)=>s+b.means[2],0)/64)-1,rayleigh=rayleighBatches.reduce((a,b)=>a+b,0)/32,mie=mieBatches.reduce((a,b)=>a+b,0)/32;assert.ok(Math.abs((rayleigh+mie)/mean-1)<1e-5);
   references.push({profile:profileId,id:targets[group].id,channel,mean,half95,relativeHalf95:half95/mean,quadratureChange,qualified:mean>0&&half95/mean<=.05&&Math.abs(quadratureChange)<=.01,batches,rayleighBatches,mieBatches,rayleigh,mie,sourceBatchArtifact:`${profileId}-batches-${channel}.json.gz`,localQuantity:'Pure atmospheric J2 W m^-3 sr^-1 nm^-1; black boundary, not observer radiance.'});
  }
  console.log(JSON.stringify({profile:profileId,channel,completed:references.length}));
 }}
 run.write('references.json.gz',gzipSync(Buffer.from(JSON.stringify(references))));run.write('precision.json',references.map(r=>({profile:r.profile,id:r.id,channel:r.channel,relativeHalf95:r.relativeHalf95,quadratureChange:r.quadratureChange,qualified:r.qualified})));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);run.finish(failure?'failed':'accepted',{failure:failure?String(failure):null,referenceCount:references.length});}verifyRun(run.path);console.log(JSON.stringify({run:run.path,failure:failure?String(failure):null,storage:storage()}));if(failure)throw failure;
