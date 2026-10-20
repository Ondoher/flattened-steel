import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {queries} from '../interior-illumination/proposal.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,registration,read,setup,retained,channels,targets,pack,verifyRun,identity,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,reference} from '../reconstruction-mechanisms/metrics.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {directPhysical} from './physical-decisions.mjs';
import {pairedProtection,sunProtection} from './protection.mjs';

const selected=process.argv[2]?.split(',')??targets,N=Number(process.argv[3]??32768),seed=684729183;assert.ok(selected.every(t=>targets.includes(t)));assert.ok(N>=32768&&N%512===0);storage();
const r=registration(),root=base+'00654-h135-profile',denseRoot=base+'00657-h135-az-grid',run=createRun('h135-confirm',{parents:[verifyRun(root),verifyRun(denseRoot),verifyRun(base+'00655-h135-azimuth'),verifyRun(base+'00656-h135-amp-grid')],operation:'Disjoint-stream confirmation of frozen two-dimensional amplitude interpolation on raw-curvature4864 and azimuth-refined9728 grids. Reuse all exact physical node values; trace new angular truth only. Frozen paired absolute-error bootstrap and separately widened independent MC-control/direct-candidate protection retain physical compatibility and uncertainty.',parameters:{targets:selected,channels,N,seed,candidates:['biRaw','biDense'],batches:32,bootstrap:2000,costIsGate:false,MCControlStudentFactor:2.46,freshExposed:false}});let browser,failure;
try{
 const rows=[],checks=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const target of selected)for(const profile of ['paper','toronto']){
  const qs=queries(setup(r,profile,target,3),N,seed),scores=read(root+`/${profile}-${target}-allocation.json`).scores;run.write(`${profile}-${target}-queries.json.gz`,pack({qs,seed,N}));
  for(const channel of channels){
   const f=setup(r,profile,target,channel),old=retained(profile,target,channel),prior=read(root+`/${profile}-${target}-b${channel}.json.gz`),oldDense=read(denseRoot+`/${profile}-${target}-b${channel}.json.gz`),polar=augmented(f,scores,'targeted'),polarNodes=assemble(polar,old.x.nodes,prior.added),dense=refineAzimuth(polar.field),denseNodes=assembleAzimuth(dense,polarNodes,oldDense.added),angular={},timings={};
   assert.deepEqual(prior.physical,f.px);assert.deepEqual(oldDense.parameters,dense.parameters);
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const a=await evaluate(page,run,f.px,qs.map(q=>q.d),Number(nv),Number(nc),`${profile}/${target}/b${channel} confirm${N}`);angular[key]=a.values;timings[key]=a.milliseconds;}
   for(const i of [Math.floor(qs.length*.31),Math.floor(qs.length*.67)]){run.progress('independent-binary64',`${profile}/${target}/b${channel} sample${i}`);const cpu=direct(f.px,qs[i].d,64,256),gpu=angular.n256[i],difference=Math.abs(cpu[0]-gpu[0])+Math.abs(cpu[1]-gpu[1]),error=difference/Math.max(cpu[0]+cpu[1],1e-25),p=f.px,kernel=p.br*Math.exp(-p.h/8000)*rayleighPhase(dot(qs[i].d,f.out))+p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(qs[i].d,f.out)),weightedError=kernel*difference/qs[i].pdf/reference(f).scale;checks.push({profile,target,channel,i,d:qs[i].d,cpu,gpu,error,weightedError,criterion:'relative<=2e-5 or normalized full-integrand absolute discrepancy<=2e-8 for negligible dark light'});assert.ok(error<=2e-5||weightedError<=2e-8,'GPU/binary64 material direct-light calibration');}
   const pe=polarNodes.n256.map((_,i)=>lightBias(polarNodes,i)),de=denseNodes.n256.map((_,i)=>lightBias(denseNodes,i)),predictors={original:linearPredictor(f),biRaw:(d)=>polar2DModel(polar.field,d,polarNodes.n256,pe),biDense:(d)=>polar2DModel(dense.field,d,denseNodes.n256,de)},a=customAssess(f,qs,old.x.nodes,angular,predictors,s=>run.progress('confirmation-assessment',s)),physical=directPhysical(f,qs,angular,a),protection=Object.fromEntries(['biRaw','biDense'].map(n=>[n,{original:pairedProtection(a,n),sun:sunProtection(f,a,n)}]));
   rows.push({...a,physicalDirect:physical,protection,parent:old.parents,seed});run.write(`${profile}-${target}-b${channel}.json.gz`,pack({physical:f.px,angular,timings,nodeParents:[identity(root+`/${profile}-${target}-b${channel}.json.gz`),identity(denseRoot+`/${profile}-${target}-b${channel}.json.gz`)]}));
   console.log(JSON.stringify({profile,target,channel,ratios:{raw:a.comparisons.biRaw.absoluteRatio,dense:a.comparisons.biDense.absoluteRatio},protection:Object.fromEntries(Object.entries(protection).map(([n,p])=>[n,{original:p.original.passed,sun:p.sun.passed,originalRejected:p.original.rejected,sunRejected:p.sun.rejected}]))}));
  }
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('checks.json',checks);run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,N,seed,profiles:['paper','toronto'].flatMap(p=>['biRaw','biDense'].map(n=>pool(rows,p,n))),protection:rows.map(x=>({profile:x.profile,target:x.target,channel:x.channel,protection:x.protection})),binary64Checks:checks.length,freshUnexposed:8});run.finish('accepted',{fields:rows.length,N,seed,binary64Checks:checks.length,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
