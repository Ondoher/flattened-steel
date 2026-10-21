import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,pack,verifyRun} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {queryContext,prepareQuery,plannedModel} from './query-plan.mjs';
import {fastModel} from './fast-model.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';

const cases=['node-89','dev-2'].flatMap(target=>['paper','toronto'].map(profile=>({target,profile,channel:8})));
const run=createRun('h136-query-plan',{
 parents:[verifyRun(base+'00720-h137-polar-qual'),verifyRun(base+'00705-h137-polar-all')],
 operation:'Prove geometry-only pointer preparation and affine-normalized Hermite intervals against the preserved positive two-axis reconstruction. Keep physical support fallbacks explicit. This enables sharing geometry across compatible wavelengths without changing light, coefficients or source-phase rules. No new physical trace or higher-order accuracy claim.',
 parameters:{cases,queriesPerField:4096,tolerance:1e-10,rawManufactures:['constant','smooth-positive'],costIsGate:false},
});
try {
 const rows=[];
 for(const test of cases){
  const {target,profile,channel}=test,isTransfer=target==='dev-2',r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),f=setup(r,profile,target,channel),p=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,union=polarUnion(f,scores),original=isTransfer?p.nodes:retained(profile,target,channel).x.nodes,fresh=read(base+`00705-h137-polar-all/${profile}-${target}-b${channel}.json.gz`).fresh;
  const nodes=assembleUnion(union,original.n256,p.added.n256,fresh.n256),qs=read(priorRoot+`/${profile}-${target}-queries.json.gz`).qs,ds=[...qs.slice(0,4096).map(q=>q.d),...union.field.g.nodes.filter((_,i)=>i%257===0),f.px.sun,f.px.sun.map(x=>-x),[0,0,1],[0,0,-1],[1,0,0]],context=queryContext(union.field),planned=plannedModel(union.field,nodes),old=fastModel(union.field,nodes),started=Date.now(),plans=[];let maximum=0;
  for(let i=0;i<ds.length;i++){if(i%512===0)run.progress('prepared-query-parity',`${profile}/${target} ${i}/${ds.length}`);const plan=prepareQuery(context,ds[i]),a=planned.evaluate(plan),b=old(ds[i]);plans.push(plan);for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));}
  assert.ok(maximum<=1e-10,'Prepared normalized source interpolation changes the preserved function');
  const raw=[];
  for(const kind of ['constant','smooth-positive']){const values=union.field.g.nodes.map(d=>kind==='constant'?[2,3]:[1+.2*d[2]+.1*d[0]**2,.5+.1*d[1]**2]),fn=plannedModel(union.field,values,[false,false]),zero=values.map(()=>[0,0]);let error=0;for(const plan of plans.filter((_,i)=>i%17===0)){const a=fn.evaluate(plan),b=polar2DModel(union.field,plan.d,values,zero,[false,false]).values;for(let s=0;s<2;s++)error=Math.max(error,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));}assert.ok(error<=1e-10);raw.push({kind,error});}
  rows.push({...test,queries:ds.length,maximum,fallbacks:plans.filter(p=>p.fallback).length,milliseconds:Date.now()-started,raw});console.log(JSON.stringify(rows.at(-1)));
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{rows,scope:'CPU geometry/normalized-interpolation specialization only. GPU evaluation, throughput and actual higher-order fields remain unqualified.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
