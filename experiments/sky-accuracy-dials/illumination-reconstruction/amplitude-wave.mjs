import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {base,registration,read,setup,retained,channels,targets,pack,verifyRun,identity} from './common.mjs';
import {amplitudeTraining} from './amplitude-training.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,compare} from '../reconstruction-mechanisms/metrics.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {directPhysical} from './physical-decisions.mjs';

const source=process.argv[2];assert.ok(source);storage();const root=base+source,r=registration(),run=createRun('h135-amp-grid',{parents:[verifyRun(root),verifyRun(base+'00655-h135-azimuth')],operation:'Follow amplitude interpolation gains by selecting added rings from active-profile phase-free amplitude curvature, rather than raw L1 curvature. Same768nodes, no coefficient/reference fit; reuse direct angular light and raw-curvature nodes exactly.',parameters:{targets,channels,extra:768,seed:684729181,prediction:'Allocate nodes to curvature of the interpolated amplitude, avoiding over-allocation to a known analytic source phase.',costIsGate:false,newAngularTruth:false,freshExposed:false}});let browser,failure;
try{
 const rows=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const target of targets)for(const profile of ['paper','toronto']){
  const scores=amplitudeTraining(r,profile,target,s=>run.progress('amplitude-training',s));run.write(`${profile}-${target}-allocation.json`,{scores,rule:'Active profile, phase-free native node amplitudes; normalized band/origin curvature, physical widths.'});
  const qs=read(root+`/${profile}-${target}-queries.json.gz`).qs;
  for(const channel of channels){
   const f=setup(r,profile,target,channel),old=retained(profile,target,channel),prior=read(root+`/${profile}-${target}-b${channel}.json.gz`),rawScore=read(root+`/${profile}-${target}-allocation.json`).scores,z=augmented(f,scores,'targeted'),raw=augmented(f,rawScore,'targeted'),rawNodes=assemble(raw,old.x.nodes,prior.added),rawErrors=rawNodes.n256.map((_,i)=>lightBias(rawNodes,i)),added={},timings={};
   assert.deepEqual(prior.physical,f.px);
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const a=await evaluate(page,run,f.px,z.added,Number(nv),Number(nc),`${profile}/${target}/b${channel} amplitude768`);added[key]=a.values;timings[key]=a.milliseconds;}
   const nodes=assemble(z,old.x.nodes,added),errors=nodes.n256.map((_,i)=>lightBias(nodes,i)),predictors={original:linearPredictor(f),biRaw:(d)=>polar2DModel(raw.field,d,rawNodes.n256,rawErrors),biAmplitude:(d)=>polar2DModel(z.field,d,nodes.n256,errors)};
   const a=customAssess(f,qs,old.x.nodes,prior.angular,predictors,s=>run.progress('amplitude-grid-assessment',s)),physical=directPhysical(f,qs,prior.angular,a);
   rows.push({...a,physicalDirect:physical,againstRaw:compare(a.results.biRaw,a.results.biAmplitude),parent:identity(root+`/${profile}-${target}-b${channel}.json.gz`)});
   run.write(`${profile}-${target}-b${channel}.json.gz`,pack({added,timings,parameters:z.parameters,proof:z.proof,physical:f.px,truthParent:identity(root+`/${profile}-${target}-b${channel}.json.gz`)}));
   console.log(JSON.stringify({profile,target,channel,ratio:a.comparisons.biAmplitude.absoluteRatio,physical:physical.models.biAmplitude.physical.mean,protected:a.comparisons.biAmplitude.protected}));
  }
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,profiles:['paper','toronto'].flatMap(p=>['biRaw','biAmplitude'].map(n=>pool(rows,p,n))),newAngularTruth:false,freshUnexposed:8});run.finish('accepted',{fields:rows.length,newNodesPerGrid:768,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
