import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,pack,verifyRun,identity} from './common.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {executeGpu} from '../horizon-reference/gpu.mjs';
import {j2Kernel} from '../structured-incoming/j2-kernel.mjs';
import {halfWidth} from '../distant-horizon/libradtran.mjs';

const batches=Number(process.argv[2]??4096),seed=Number(process.argv[3]??837465207);assert.ok(batches>=4096&&batches%32===0);storage();const r=registration(),selected=[{profile:'paper',target:'reserved-out-1',channels:[3,5,8]},{profile:'toronto',target:'node-89',channels:[8]}],run=createRun('h135-phys-ref',{parents:[verifyRun(base+'00658-h135-confirm'),verifyRun(base+'00613-h114-held2-ref'),verifyRun(base+'00525-h93-j2-proof')],operation:'Refine only the independent pure-J2 physical-reference drivers of complete-Sun protection uncertainty. Proven unchanged first-two-event estimator with post-J2 roulette; no candidate data influence physical histories. Retain full new batches and original references separately.',parameters:{selected,batches,controlBatches:128,paths:1024,seed,mainQuadrature:128,controlQuadrature:64,roulette:2,costIsGate:false}});let browser,failure,packets=[],active;
try{
 const references=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();await page.exposeFunction('retainBatch',b=>{packets.push({...b,...active});if(b.batch%16===0)run.progress('physical-J2',`${active.profile}/${active.target}/b${active.channel} ${b.profile} batch${b.batch}`);});
 for(const selectedCase of selected){const p=r.profiles.find(x=>x.id===selectedCase.profile),t=r.targets.find(x=>x.id===selectedCase.target);assert.ok(p&&t);
  for(const channel of selectedCase.channels){active={atmosphere:p.id,target:t.id,channel};let groupSeed=seed;for(const ch of JSON.stringify([p.id,t.point,t.direction]))groupSeed=Math.imul(groupSeed^ch.charCodeAt(0),16777619)>>>0;
   const generated=j2Kernel(p.control.material.phaseTables[channel],p.control.material.albedos[channel]);run.write(`kernel-${p.id}-${channel}.json.gz`,pack({shader:generated.shader}));const telemetry=await page.evaluate(executeGpu,generated.shader,{groups:[{id:t.id,origin:t.point,direction:t.direction,medium:{...p.control.medium,sourceDirection:[0,0,1]},channel,end:-1}],paths:1024,profiles:[{name:'main',batches,quadrature:128,roulette:2,seed:groupSeed},{name:'control64',batches:128,quadrature:64,roulette:2,seed:groupSeed}],maximumMilliseconds:3600000});
   const saved=packets.filter(x=>x.atmosphere===p.id&&x.target===t.id&&x.channel===channel),main=saved.filter(x=>x.profile==='main'),control=saved.filter(x=>x.profile==='control64');
   assert.equal(main.length,batches);assert.equal(control.length,128);run.write(`batches-${p.id}-${channel}.json.gz`,pack(saved));
   const block=batches/32,aggregate=k=>Array.from({length:32},(_,i)=>main.slice(i*block,(i+1)*block).reduce((s,x)=>s+x.means[k],0)/block),total=aggregate(2),rayleighBatches=aggregate(12),mieBatches=aggregate(13),mean=total.reduce((s,x)=>s+x,0)/32,half95=halfWidth(total),quadratureChange=control.reduce((s,x)=>s+x.means[2],0)/main.slice(0,128).reduce((s,x)=>s+x.means[2],0)-1,rayleigh=rayleighBatches.reduce((s,x)=>s+x,0)/32,mie=mieBatches.reduce((s,x)=>s+x,0)/32;
   assert.ok(Math.abs((rayleigh+mie)/mean-1)<1e-5);
   references.push({profile:p.id,id:t.id,channel,mean,half95,relativeHalf95:half95/mean,quadratureChange,batches:total,rayleighBatches,mieBatches,rayleigh,mie,seed:groupSeed,qualified:mean>0&&half95/mean<=.05&&Math.abs(quadratureChange)<=.01,sourceBatchArtifact:identity(run.path+`/batches-${p.id}-${channel}.json.gz`),qualifiedIndices:[2,12,13],localQuantity:'Independent cache-free pure atmospheric J2; black boundary; not viewed radiance.',pooling:'New independent fixed wave, not pooled with old references.'});
   run.write(`telemetry-${p.id}-${channel}.json`,telemetry);
   run.write(`references-through-${p.id}-${channel}.json.gz`,pack(references));console.log(JSON.stringify({profile:p.id,target:t.id,channel,mean,relativeHalf95:half95/mean,quadratureChange}));
  }
 }
 await browser.close();browser=null;run.write('references.json.gz',pack(references));run.finish('accepted',{references:references.length,qualified:references.every(x=>x.qualified),newHistories:selected.reduce((s,x)=>s+x.channels.length,0)*(batches+128)*1024});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
