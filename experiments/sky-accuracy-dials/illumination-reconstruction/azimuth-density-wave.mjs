import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {base,registration,read,setup,retained,channels,targets,pack,verifyRun,identity} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,compare} from '../reconstruction-mechanisms/metrics.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {directPhysical} from './physical-decisions.mjs';

const source=process.argv[2];assert.ok(source);storage();const root=base+source,r=registration(),run=createRun('h135-az-grid',{parents:[verifyRun(root),verifyRun(base+'00655-h135-azimuth')],operation:'Test remaining azimuth sampling error after positive two-dimensional amplitude reconstruction. Double each sector sampling, preserving all original4864nodes, exact physical boundaries and frozen polar allocation. Trace every new direction independently; no outgoing/reference selection.',parameters:{targets,channels,oldNodes:4864,newNodes:9728,seed:684729181,prediction:'Azimuth midpoint refinement reduces the remaining within-sector transport-amplitude error that changing interpolation alone did not remove.',costIsGate:false,freshExposed:false}});let browser,failure;
try{
 const rows=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const target of targets)for(const profile of ['paper','toronto']){
  const qs=read(root+`/${profile}-${target}-queries.json.gz`).qs,scores=read(root+`/${profile}-${target}-allocation.json`).scores;
  for(const channel of channels){
   const f=setup(r,profile,target,channel),old=retained(profile,target,channel),prior=read(root+`/${profile}-${target}-b${channel}.json.gz`),polar=augmented(f,scores,'targeted'),polarNodes=assemble(polar,old.x.nodes,prior.added),z=refineAzimuth(polar.field),added={},timings={};
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const a=await evaluate(page,run,f.px,z.added,Number(nv),Number(nc),`${profile}/${target}/b${channel} azimuth4864`);added[key]=a.values;timings[key]=a.milliseconds;}
   const nodes=assembleAzimuth(z,polarNodes,added),errors=nodes.n256.map((_,i)=>lightBias(nodes,i)),oldErrors=polarNodes.n256.map((_,i)=>lightBias(polarNodes,i)),predictors={original:linearPredictor(f),biRaw:(d)=>polar2DModel(polar.field,d,polarNodes.n256,oldErrors),biDense:(d)=>polar2DModel(z.field,d,nodes.n256,errors)};
   const a=customAssess(f,qs,old.x.nodes,prior.angular,predictors,s=>run.progress('azimuth-density-assessment',s)),physical=directPhysical(f,qs,prior.angular,a);
   rows.push({...a,physicalDirect:physical,againstRaw:compare(a.results.biRaw,a.results.biDense),parent:identity(root+`/${profile}-${target}-b${channel}.json.gz`)});
   run.write(`${profile}-${target}-b${channel}.json.gz`,pack({added,timings,parameters:z.parameters,proof:z.proof,physical:f.px,truthParent:identity(root+`/${profile}-${target}-b${channel}.json.gz`)}));
   console.log(JSON.stringify({profile,target,channel,ratio:a.comparisons.biDense.absoluteRatio,physical:physical.models.biDense.physical.mean,protected:a.comparisons.biDense.protected}));
  }
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,profiles:['paper','toronto'].flatMap(p=>['biRaw','biDense'].map(n=>pool(rows,p,n))),newAngularTruth:false,freshUnexposed:8});run.finish('accepted',{fields:rows.length,newNodesPerGrid:4864,finalNodes:9728,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
