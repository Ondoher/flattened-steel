import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,pack,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {normalizedPartialField} from './partial-density.mjs';
import {segmentResident,segmentResidentSource,finitePartialTransport} from './segment-transport.mjs';
import {partialPchipFinite,partialPchipExact,partialPchipKernel} from './partial-pchip-transport.mjs';

const native=['00725-h136-source-row','00738-h138-source-row','00740-h138-source-row','00743-h138-source-row'],extra=['00746-h138-source-row','00750-h138-source-row','00755-h138-source-row'],fields=[{id:'native',field:ownedPartialField(native.map(x=>base+x),[0,1875,3125,4375])},{id:'refined',field:ownedPartialField([...native,...extra].map(x=>base+x),[0,937.5,1875,2500,3125,3750,4375])}],run=createRun('h138-pchip-gpu',{
 parents:[verifyRun(base+'00767-h138-pchip'),verifyRun(base+'00760-h138-density-gpu'),...fields.flatMap(x=>x.field.parents)],operation:'Validate fixed normalized altitude PCHIP in the actual hardware partial-path source sampler. Query the same complete source textures with the original angular sampler, derive slopes from sampled values at each actual outgoing direction and restore species density once. Compare both species with independent binary64 finite PCHIP transport, and the unchanged scalar with its own physical-linear control. This is a numerical implementation proof, independent of physical admission.',
 parameters:{sourceHeights:fields.map(x=>({id:x.id,heights:x.field.altitudes})),intervals:[60,120,240],finiteRelativeTolerance:1e-4,observer:'Ground radial up,0-4375m',profile:'paper',channel:8,costIsGate:false},
});let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),f=setup(registration(),'paper','node-89',8),results=[];
 for(const {id,field}of fields){const normalized=normalizedPartialField(field),exact=partialPchipExact(normalized,128);for(const n of [60,120,240]){
  run.progress('normalized-cubic-hardware',`${id} intervals${n}`);const kernel=partialPchipKernel(f,field.altitudes,n),start=Date.now(),gpu=await page.evaluate(segmentResident,{...kernel,widthJ:field.widthJ,rows:field.rows.length,widthL:1,outputRows:1,rayleigh:normalized.rayleigh,mie:normalized.mie,sum:field.sum,directions:field.rows.flatMap(()=>[0,0,1,0]),residentSource:segmentResidentSource()});run.write(`${id}-n${n}-raw.json.gz`,pack(gpu));
  const finite=partialPchipFinite(normalized,n),plain=finitePartialTransport(field,n).reduce((a,b)=>a+b,0),split=gpu.split.slice(0,2),scalar=gpu.scalar[0],finiteRelative=Math.max(...split.map((x,s)=>Math.abs(x-finite[s])/finite[s])),scalarControlRelative=Math.abs(scalar-plain)/plain,item={id,n,split,scalar,finite,plain,exact,finiteRelative,scalarControlRelative,pathDiscretizationRelative:finite.map((x,s)=>(x-exact[s])/exact[s]),renderer:gpu.renderer,ownedTextureBytes:gpu.ownedTextureBytes,milliseconds:Date.now()-start};run.write(`${id}-n${n}.json`,item);assert.ok(split.every(x=>Number.isFinite(x)&&x>=0)&&Number.isFinite(scalar)&&scalar>=0);assert.ok(finiteRelative<=1e-4&&scalarControlRelative<=1e-4);results.push(item);console.log(JSON.stringify(item));
 }}
 await browser.close();browser=null;run.write('summary.json',{results,qualifiedFiniteArithmetic:true,scope:'Actual own-source normalized-cubic partial transport at one wavelength/SZA/native upward direction. This verifies implementation only, not physical improvement, other directions, later orders, global cache, Toronto, B1 or scenes.'});run.finish('accepted',{qualifiedFiniteArithmetic:true});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
