import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {queries} from '../interior-illumination/proposal.mjs';
import {base,read,setup,channels,pack,verifyRun,identity,activeTraining} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {lightBias} from '../reconstruction-mechanisms/metrics.mjs';
import {pool} from '../reconstruction-mechanisms/decisions.mjs';
import {pairedProtection} from './protection.mjs';

const selected=process.argv[2]?.split(',')??['node-90','dev-2','dev-5','held-6'],N=8192,seed=684729187,r=read(base+'00543-h92-broad-reg/registration.json.gz');
assert.ok(selected.every(t=>r.targets.some(x=>x.id===t)&&!['node-89','reserved-out-1','held-0','held-1','held-2','held-3'].includes(t)));
storage();const run=createRun('h137-transfer',{parents:[verifyRun(base+'00658-h135-confirm'),verifyRun(base+'00543-h92-broad-reg')],operation:'Frozen L1-only reconstruction transfer to already exposed geometries beyond the six original fields. Independent nodal and interior light; native original nodes alone select polar refinement. Two fixed representations; no new held-out geometry or later-order claim.',parameters:{targets:selected,channels,N,seed,batches:32,bootstrap:2000,candidates:['biRaw','biDense'],selection:'Fixed initial transfer: below-Sun ground, elevated/daytime, elevated/twilight and higher-altitude tangent witnesses. Exposed H92 evidence, not fresh physical tuples.',costIsGate:false}});let browser,failure;
try{
 const rows=[];assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const target of selected)for(const profile of ['paper','toronto']){
  const scores=activeTraining(r,profile,target,s=>run.progress('transfer-native-curvature',s));run.write(`${profile}-${target}-allocation.json`,{scores});
  const qs=queries(setup(r,profile,target,3),N,seed);run.write(`${profile}-${target}-queries.json.gz`,pack({qs,N,seed}));
  for(const channel of channels){
   const f=setup(r,profile,target,channel),polar=augmented(f,scores,'targeted'),dense=refineAzimuth(polar.field),angular={},nodes={},added={},extra={},timings={};
   run.write(`${profile}-${target}-b${channel}-parents.json`,{field:f.parent,reference:identity(r.reference.path)});
   for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){
    const combined=[...f.g.nodes,...polar.added,...dense.added,...qs.map(q=>q.d)],got=await evaluate(page,run,f.px,combined,Number(nv),Number(nc),`${profile}/${target}/b${channel} transfer`);let at=0;
    nodes[key]=got.values.slice(at,at+=f.g.nodes.length);added[key]=got.values.slice(at,at+=polar.added.length);extra[key]=got.values.slice(at,at+=dense.added.length);angular[key]=got.values.slice(at);timings[key]=got.milliseconds;
   }
   const pn=assemble(polar,nodes,added),dn=assembleAzimuth(dense,pn,extra),pe=pn.n256.map((_,i)=>lightBias(pn,i)),de=dn.n256.map((_,i)=>lightBias(dn,i)),a=customAssess(f,qs,nodes,angular,{original:linearPredictor(f),biRaw:d=>polar2DModel(polar.field,d,pn.n256,pe),biDense:d=>polar2DModel(dense.field,d,dn.n256,de)},s=>run.progress('transfer-assessment',s)),protection=Object.fromEntries(['biRaw','biDense'].map(n=>[n,pairedProtection(a,n)]));
   rows.push({...a,protection});run.write(`${profile}-${target}-b${channel}.json.gz`,pack({physical:f.px,nodes,added,extra,angular,timings,parameters:polar.parameters,azimuth:dense.parameters,parent:f.parent}));
   console.log(JSON.stringify({profile,target,channel,ratios:Object.fromEntries(['biRaw','biDense'].map(n=>[n,a.comparisons[n].absoluteRatio])),components:Object.fromEntries(['biRaw','biDense'].map(n=>[n,a.comparisons[n].protected])),protection}));
  }
 }
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('rows.json.gz',pack(rows));run.write('summary.json',{fields:rows.length,N,seed,profiles:['paper','toronto'].flatMap(p=>['biRaw','biDense'].map(n=>pool(rows,p,n))),scope:'Exposed transfer; broad retained independent physical reference has its original finite precision. No H97 fresh tuple exposed.'});run.finish('accepted',{fields:rows.length,N,seed,freshUnexposed:8});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
