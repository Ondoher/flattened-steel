import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {shader,resident,evaluate} from '../interior-illumination/gpu.mjs';
import {queries} from '../interior-illumination/proposal.mjs';
import {direct} from '../interior-illumination/physics.mjs';
import {base,read,setup,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {customAssess,linearPredictor} from './transfer-math.mjs';
import {lightBias,interval} from '../reconstruction-mechanisms/metrics.mjs';
import {pairedProtection} from './protection.mjs';

const profile='paper',target='node-90',channel=8,N=131072,seed=684729193,root=base+'00670-h137-transfer',r=read(base+'00543-h92-broad-reg/registration.json.gz'),run=createRun('h137-precision',{parents:[verifyRun(root)],operation:'Targeted disjoint-stream precision at the prespecified borderline complete-Sun transfer witness. All nodal light, allocation and reconstruction are unchanged; trace only new independent angular truth. No reference/model fitting.',parameters:{profile,target,channel,N,seed,batches:32,bootstrap:2000,costIsGate:false,driver:'Denser-grid complete-Sun protection upper0.00102437 around allowance0.001 on the initial8192 cloud.'}});let browser,failure;
try{
 const f=setup(r,profile,target,channel),old=read(root+`/${profile}-${target}-b${channel}.json.gz`),scores=read(root+`/${profile}-${target}-allocation.json`).scores,z=augmented(f,scores,'targeted'),pn=assemble(z,old.nodes,old.added),dense=refineAzimuth(z.field),dn=assembleAzimuth(dense,pn,old.extra),qs=queries(f,N,seed),angular={},timings={},checks=[];run.write('queries.json.gz',pack({qs,N,seed}));
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage();run.write('renderer.json',await page.evaluate(resident,{action:'init',shader:shader()}));
 for(const [key,nv,nc]of [['n32',32,128],['n64',64,128],['n256',64,256]]){const got=await evaluate(page,run,f.px,qs.map(q=>q.d),Number(nv),Number(nc),`${profile}/${target}/b${channel} transfer precision`);angular[key]=got.values;timings[key]=got.milliseconds;}
 for(const i of [Math.floor(.31*N),Math.floor(.67*N)]){const cpu=direct(f.px,qs[i].d,64,256),gpu=angular.n256[i],difference=cpu.reduce((s,x,k)=>s+Math.abs(x-gpu[k]),0),relative=difference/Math.max(cpu[0]+cpu[1],1e-25),p=f.px,kernel=p.br*Math.exp(-p.h/8000)*rayleighPhase(dot(qs[i].d,f.out))+p.bm*p.ssa*Math.exp(-p.h/1200)*miePhase(p.table,dot(qs[i].d,f.out)),scale=Math.max(Math.abs(f.ref.mean),4.742795497816345e-14),weighted=kernel*difference/qs[i].pdf/scale;assert.ok(relative<=2e-5||weighted<=2e-8);checks.push({i,cpu,gpu,relative,weighted});}
 const pe=pn.n256.map((_,i)=>lightBias(pn,i)),de=dn.n256.map((_,i)=>lightBias(dn,i)),a=customAssess(f,qs,old.nodes,angular,{original:linearPredictor(f),biRaw:d=>polar2DModel(z.field,d,pn.n256,pe),biDense:d=>polar2DModel(dense.field,d,dn.n256,de)},s=>run.progress('precision-assessment',s)),protection=Object.fromEntries(['biRaw','biDense'].map(name=>[name,pairedProtection(a,name)]));
 await page.evaluate(resident,{action:'close'});await browser.close();browser=null;run.write('light.json.gz',pack({physical:f.px,angular,timings,checks}));run.write('row.json.gz',pack({...a,protection}));run.write('summary.json',{profile,target,channel,N,seed,protection,errors:Object.fromEntries(['biRaw','biDense'].map(name=>[name,interval(a.results[name].bins.map(b=>b.mE+b.rE),a.results[name].envelopes.m+a.results[name].envelopes.r)])),scope:'New independent angular precision; complete-Sun shared-reference decision requires the separately converged model/control output difference.'});run.finish('accepted',{profile,target,channel,N,seed});console.log(JSON.stringify({run:run.path,protection,storage:storage()}));
}catch(e){failure=e;}finally{await browser?.close().catch(e=>failure??=e);if(failure)run.finish('failed',{failure:String(failure)});}verifyRun(run.path);if(failure)throw failure;
