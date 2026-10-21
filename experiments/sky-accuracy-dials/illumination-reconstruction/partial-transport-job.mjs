import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,setup,pack,read,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {segmentKernel,segmentResidentSource,segmentResident,exactPartialTransport,finitePartialTransport} from './segment-transport.mjs';

// Explicit immutable source rows are required. The fourth optional argument is
// the cache-free reference run; omit it to produce the numerical pilot alone.
const roots=(process.argv[2]??'').split(',').filter(Boolean).map(x=>x.startsWith(base)?x:base+x),extraRoots=(process.argv[3]??'').split(',').filter(Boolean).map(x=>x.startsWith(base)?x:base+x),reference=process.argv[4],native=ownedPartialField(roots,[0,1875,3125,4375]),fields=[{id:'native',field:native}];
if(extraRoots.length)fields.push({id:'midpoint-refined',field:ownedPartialField([...roots,...extraRoots],[0,937.5,1875,2500,3125,3750,4375])});
const parents=fields.flatMap(x=>x.field.parents);if(reference)parents.push(verifyRun(reference.startsWith(base)?reference:base+reference));
const run=createRun('h138-partial',{
 parents,operation:'Transport complete owned atmospheric J2 source rows along the registered ground-up radial0-4375m segment. Compare unchanged finite60 operator with120/240 and independent exact-column Gauss64/128 transport of the same piecewise-linear cached source. Native versus midpoint-refined source support separates spatial-stencil sensitivity. J2 includes scattering density already; do not multiply it twice. Optional independent two-event physical comparison retains sampling and finite-column uncertainty.',
 parameters:{profiles:['paper'],channel:8,solarZenithDegrees:89.5,sourceRows:fields.map(x=>({id:x.id,altitudes:x.field.altitudes,roots:x.field.rows.map(r=>r.root)})),intervals:[60,120,240],origin:[0,0,0],localDirection:[0,0,1],segmentMeters:[0,4375],groundAlbedo:0,cpuFiniteTolerance:1e-4,scalarSplitTolerance:2e-5,costIsGate:false},
});let browser,failure;
try{
 const f=setup(registration(),'paper','node-89',8),results=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();
 for(const {id,field}of fields){
  run.write(`${id}-owned-field.json.gz`,pack(field));const exact64=exactPartialTransport(field,64),exact128=exactPartialTransport(field,128),exactBias=exact128.map((x,s)=>2*Math.abs(x-exact64[s]));assert.ok(exactBias.every((x,s)=>x<=1e-8*exact128[s]),'Same-field reference unresolved');
  for(const n of [60,120,240]){
   run.progress('own-field-partial-transport',`${id} intervals${n}`);const kernel=segmentKernel(f,field.altitudes,n),started=Date.now(),gpu=await page.evaluate(segmentResident,{...kernel,widthJ:field.widthJ,rows:field.rows.length,widthL:1,outputRows:1,rayleigh:field.rayleigh,mie:field.mie,sum:field.sum,directions:field.rows.flatMap(()=>[0,0,1,0]),residentSource:segmentResidentSource()}),finite=finitePartialTransport(field,n),split=gpu.split.slice(0,2),scalar=gpu.scalar[0],finiteRelative=Math.max(...split.map((x,s)=>Math.abs(x-finite[s])/finite[s])),scalarRelative=Math.abs(scalar-split[0]-split[1])/scalar;
   const item={id,n,split,scalar,finite,exact128,exactBias,finiteRelative,scalarRelative,pathDiscretization:split.map((x,s)=>x-exact128[s]),pathDiscretizationRelative:split.map((x,s)=>(x-exact128[s])/exact128[s]),milliseconds:Date.now()-started,renderer:gpu.renderer,ownedTextureBytes:gpu.ownedTextureBytes,parent:kernel.parent};run.write(`${id}-n${n}.json`,item);assert.ok(split.every(x=>Number.isFinite(x)&&x>=0)&&Number.isFinite(scalar)&&scalar>=0);assert.ok(finiteRelative<=1e-4,'Own-field GPU/finite mismatch');assert.ok(scalarRelative<=2e-5,'Own-field scalar/species mismatch');results.push(item);console.log(JSON.stringify(item));
  }
 }
 await browser.close();browser=null;
 const fine=results.filter(x=>x.n===240),spatial=fine.length===2?fine[1].exact128.map((x,s)=>({native:fine[0].exact128[s],midpointRefined:x,change:x-fine[0].exact128[s],relativeChange:(x-fine[0].exact128[s])/fine[0].exact128[s]})):null;
 let physicalComparison=null;if(reference){const refRoot=reference.startsWith(base)?reference:base+reference,ref=read(refRoot+'/summary.json');assert.deepEqual(ref.physical,native.physical);physicalComparison=fine.map(item=>{const value=[...item.exact128,item.exact128[0]+item.exact128[1]];return {id:item.id,reference:identity(refRoot+'/summary.json'),components:value.map((x,s)=>{const interval=ref.intervals[s+4];return {component:['lastR','lastM','total'][s],cachedSameFieldExactTransport:x,reference:interval,relativeDifference:x/interval.mean-1,insideReportedInterval:x>=interval.lower&&x<=interval.upper};})};});}
 run.write('summary.json',{results,spatial,physicalComparison,sourceParents:fields.flatMap(x=>x.field.rows.map(row=>identity(row.root+'/summary.json'))),scope:'Partial atmospheric pure-L2 at one wavelength. Native/midpoint change is spatial interpolation sensitivity, not proof that the refined source is physical truth. Independent physical comparison retains Monte Carlo and finite-column sensitivity; no complete-cache protection is claimed.'});run.finish('accepted',{finiteOperatorQualified:true,spatialCompared:spatial!==null});console.log(JSON.stringify({run:run.path,spatial,physicalComparison,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
