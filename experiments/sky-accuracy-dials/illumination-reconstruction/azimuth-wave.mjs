import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,pack,identity,verifyRun} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polarModel} from '../reconstruction-mechanisms/polar-cubic.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from '../reconstruction-mechanisms/custom-metrics.mjs';
import {lightBias,compare} from '../reconstruction-mechanisms/metrics.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {directPhysical} from './physical-decisions.mjs';

const source=process.argv[2],selected=process.argv[3]?.split(',');assert.ok(source);storage();
const root=base+source,r=registration(),sourceRows=read(root+'/rows.json.gz'),run=createRun('h135-azimuth',{parents:[verifyRun(root)],operation:'Follow the measured polar-only cancellation defect with one positive within-sector azimuth-Hermite extension. Original geometry, source phase, physical inputs and added-node placement stay fixed. Reuse accepted physical light; no coefficient fitting or held-out exposure.',parameters:{selected:selected??'all36',prediction:'Positive amplitude curvature in azimuth reduces the residual left by polar-only interpolation; exact linear-control and phase-times-constant limits must pass.',costIsGate:false,lightTraces:0}});
try{
 const rows=[],controls=[];
 for(const saved of sourceRows){
  if(selected&&!selected.includes(saved.target))continue;
  const {profile,target,channel}=saved,f=setup(r,profile,target,channel),old=retained(profile,target,channel),packet=read(root+`/${profile}-${target}-b${channel}.json.gz`),qs=read(root+`/${profile}-${target}-queries.json.gz`).qs,allocation=read(root+`/${profile}-${target}-allocation.json`),z=augmented(f,allocation.scores,'targeted'),nodes=assemble(z,old.x.nodes,packet.added),oldErrors=old.x.nodes.n256.map((_,i)=>lightBias(old.x.nodes,i)),errors=nodes.n256.map((_,i)=>lightBias(nodes,i));
  const control={profile,target,channel,linearParity:0,constantAmplitudeRelative:0,nodalRelative:0};
  for(const q of qs.slice(0,32)){
   const a=polarModel(f,q.d,old.x.nodes.n256,oldErrors),b=polar2DModel(f,q.d,old.x.nodes.n256,oldErrors,[true,true],true,false);
   for(let s=0;s<2;s++)control.linearParity=Math.max(control.linearParity,Math.abs(a.values[s]-b.values[s])/Math.max(Math.abs(a.values[s]),1e-25));
   const constant=f.sourcePhases.map(p=>[p[0],3*p[1]]),zero=constant.map(()=>[0,0]),v=polar2DModel(f,q.d,constant,zero),uv=polarModel(f,q.d,constant,zero);
   for(let s=0;s<2;s++)control.constantAmplitudeRelative=Math.max(control.constantAmplitudeRelative,Math.abs(v.values[s]-uv.values[s])/Math.max(Math.abs(uv.values[s]),1e-25));
  }
  for(const i of [0,31,1024,2048,4095]){const v=polar2DModel(f,f.g.nodes[i],old.x.nodes.n256,oldErrors);for(let s=0;s<2;s++)control.nodalRelative=Math.max(control.nodalRelative,Math.abs(v.values[s]-old.x.nodes.n256[i][s])/Math.max(Math.abs(old.x.nodes.n256[i][s]),1e-25));}
  assert.ok(control.linearParity<1e-12&&control.constantAmplitudeRelative<1e-12&&control.nodalRelative<1e-9);controls.push(control);
  const predictors={original:linearPredictor(f),polar:(d,n,e)=>polarModel(f,d,n,e),biOriginal:(d,n,e)=>polar2DModel(f,d,n,e),biCombined:(d)=>polar2DModel(z.field,d,nodes.n256,errors)};
  const a=customAssess(f,qs,old.x.nodes,packet.angular,predictors,s=>run.progress('azimuth-assessment',s));assert.deepEqual(a.results.original,saved.results.original);assert.deepEqual(a.results.polar,saved.results.cubicFactored);
  const physical=directPhysical(f,qs,packet.angular,a);
  for(const x of Object.values(physical.models)){
   const cap=Math.max(Math.abs(x.physical.lo),Math.abs(x.physical.hi)),upper=Math.min(x.vsSun.upper,cap);
   x.vsSunWithAbsoluteCap={...x.vsSun,upper,absoluteCandidateCap:cap,passed:upper<=.001,rejected:x.vsSun.lower>.001,inconclusive:x.vsSun.lower<=.001&&upper>.001,scope:'Also use |new error|-|control error| <= |new error|; no assumed control truth sign.'};
  }
  rows.push({...a,physicalDirect:physical,againstPolarDensity:compare(saved.results.combined,a.results.biCombined),parent:identity(root+`/${profile}-${target}-b${channel}.json.gz`)});
  console.log(JSON.stringify({profile,target,channel,ratios:{original:a.comparisons.biOriginal.absoluteRatio,dense:a.comparisons.biCombined.absoluteRatio},physical:{error:physical.models.biCombined.physical.mean,original:physical.models.biCombined.vsOriginal.passed,sun:physical.models.biCombined.vsSunWithAbsoluteCap.passed}}));
 }
 run.write('controls.json',controls);run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,profiles:['paper','toronto'].flatMap(p=>['biOriginal','biCombined'].map(n=>pool(rows,p,n))),physical:rows.map(x=>({profile:x.profile,target:x.target,channel:x.channel,models:x.physicalDirect.models})),newLight:0,freshUnexposed:8});
 run.finish('accepted',{fields:rows.length,controls:controls.length,newLight:0,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
