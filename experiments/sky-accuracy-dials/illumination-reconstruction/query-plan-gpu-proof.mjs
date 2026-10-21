import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {launch} from '../geometry-incoming/common.mjs';
import {assertIdleGpu} from '../structured-incoming/runtime.mjs';
import {base,registration,read,setup,retained,pack,verifyRun,dot,miePhase,rayleighPhase} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {queryContext,prepareQuery,plannedModel} from './query-plan.mjs';
import {queryUpload,queryShader,queryResident} from './query-plan-gpu.mjs';

const cases=['node-89','dev-2'].flatMap(target=>['paper','toronto'].map(profile=>({target,profile,channel:8})));
const run=createRun('h136-query-gpu',{
 parents:['00722-h136-query-plan','00720-h137-polar-qual','00705-h137-polar-all'].map(name=>verifyRun(base+name)),
 operation:'Evaluate the same geometry-prepared positive Hermite function on the hardware GPU. Preserve CPU support fallbacks, active source-phase restoration and raw manufactured controls. Compare every retained query component against binary64 and bound its contribution under the actual outgoing physical kernel. This implementation proof is not a new physical, higher-order or full-cache qualification.',
 parameters:{cases,queriesPerField:4096,relativeTolerance:2e-5,negligibleKernelNormalizedTolerance:2e-8,rawManufactures:['constant','smooth-positive'],rawRelativeTolerance:2e-5,costIsGate:false},
});
let browser,failure;
try{
 assertIdleGpu(run.path);browser=await launch(run);const page=await browser.newPage(),renderer=await page.evaluate(queryResident,{action:'init',shader:queryShader()}),rows=[];
 for(const test of cases){
  const {target,profile,channel}=test,isTransfer=target==='dev-2',r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),f=setup(r,profile,target,channel),p=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,union=polarUnion(f,scores),original=isTransfer?p.nodes:retained(profile,target,channel).x.nodes,fresh=read(base+`00705-h137-polar-all/${profile}-${target}-b${channel}.json.gz`).fresh;
  const nodes=assembleUnion(union,original.n256,p.added.n256,fresh.n256),qs=read(priorRoot+`/${profile}-${target}-queries.json.gz`).qs,ds=[...qs.slice(0,4096).map(q=>q.d),...union.field.g.nodes.filter((_,i)=>i%257===0),f.px.sun,f.px.sun.map(x=>-x),[0,0,1],[0,0,-1],[1,0,0]],context=queryContext(union.field),model=plannedModel(union.field,nodes),plans=ds.map(d=>prepareQuery(context,d)),beta=[f.px.br*Math.exp(-f.px.h/8000),f.px.bm*f.px.ssa*Math.exp(-f.px.h/1200)],cpu=plans.map(plan=>model.evaluate(plan));
  // Fixed numerical scale uses the unchanged original4096 inputs and quadrature.
  const scale=original.n256.reduce((sum,v,i)=>{const mu=dot(f.g.nodes[i],f.out);return sum+f.g.weights[i]*(beta[0]*rayleighPhase(mu)+beta[1]*miePhase(f.px.table,mu))*(v[0]+v[1]);},0);
  run.progress('prepared-query-GPU',`${profile}/${target} ${plans.length} queries`);const started=Date.now(),gpu=await page.evaluate(queryResident,queryUpload(union.field,plans,model)),milliseconds=Date.now()-started;let maximum=0,weightedMaximum=0,integralDifference=0;
  for(let i=0;i<plans.length;i++)for(let s=0;s<2;s++){
   const value=gpu[i*4+s],reference=cpu[i][s];assert.ok(Number.isFinite(value)&&value>=0);const difference=Math.abs(value-reference),relative=difference/Math.max(Math.abs(reference),1e-25),mu=dot(ds[i],f.out),kernel=beta[0]*rayleighPhase(mu)+beta[1]*miePhase(f.px.table,mu),weighted=4*Math.PI*kernel*difference/scale;
   maximum=Math.max(maximum,relative);weightedMaximum=Math.max(weightedMaximum,weighted);assert.ok(relative<=2e-5||weighted<=2e-8,'Prepared GPU source interpolation differs materially from binary64');
   if(i<4096)integralDifference+=kernel*difference/qs[i].pdf/4096/scale;
  }
  const raw=[];
  for(const kind of ['constant','smooth-positive']){
   const values=union.field.g.nodes.map(d=>kind==='constant'?[2,3]:[1+.2*d[2]+.1*d[0]**2,.5+.1*d[1]**2]),fn=plannedModel(union.field,values,[false,false]),rawGPU=await page.evaluate(queryResident,queryUpload(union.field,plans,fn,[false,false]));let error=0;
   for(let i=0;i<plans.length;i++){const reference=fn.evaluate(plans[i]);for(let s=0;s<2;s++){assert.ok(Number.isFinite(rawGPU[i*4+s])&&rawGPU[i*4+s]>=0);error=Math.max(error,Math.abs(rawGPU[i*4+s]-reference[s])/Math.max(Math.abs(reference[s]),1e-25));}}
   assert.ok(error<=2e-5);raw.push({kind,error});
  }
  rows.push({...test,queries:plans.length,fallbacks:plans.filter(p=>p.fallback).length,maximum,weightedMaximum,integralDifference,milliseconds,raw});console.log(JSON.stringify(rows.at(-1)));run.write(`${profile}-${target}.json.gz`,pack({test,ds,cpu,gpu,scale,raw}));
 }
 await page.evaluate(queryResident,{action:'close'});await browser.close();browser=null;
 run.write('summary.json',{rows,renderer,scope:'Finite hardware point/integral-discrepancy proof against the unchanged binary64 interpolation. No independent physical light, actual later-order field or observer/B1 claim.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){failure=error;}finally{await browser?.close().catch(error=>failure??=error);if(failure)run.finish('failed',{failure:String(failure)});}
verifyRun(run.path);if(failure)throw failure;
