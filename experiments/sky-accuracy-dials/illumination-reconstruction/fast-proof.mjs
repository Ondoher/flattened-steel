import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,registration,setup,retained,channels,targets,pack,verifyRun} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {fastModel} from './fast-model.mjs';

const run=createRun('h136-fast-proof',{parents:[verifyRun(base+'00654-h135-profile'),verifyRun(base+'00657-h135-az-grid')],operation:'Independent point-evaluation implementation parity for repeated continuous quadrature. Same frozen reconstruction; precomputed phase-free node values and ring bounds. No new atmospheric truth or accuracy threshold.',parameters:{fields:36,models:2,queriesPerField:1024,nodalCasesPerModel:32,tolerance:1e-10}});
try{
 const r=registration(),rows=[];let maximum=0,count=0;
 for(const target of targets)for(const profile of ['paper','toronto']){
  const qs=read(base+`00654-h135-profile/${profile}-${target}-queries.json.gz`).qs.slice(0,1024),scores=read(base+`00654-h135-profile/${profile}-${target}-allocation.json`).scores;
  for(const channel of channels){
   const f=setup(r,profile,target,channel),old=retained(profile,target,channel),p=read(base+`00654-h135-profile/${profile}-${target}-b${channel}.json.gz`),z=augmented(f,scores,'targeted'),pn=assemble(z,old.x.nodes,p.added),a=read(base+`00657-h135-az-grid/${profile}-${target}-b${channel}.json.gz`),dense=refineAzimuth(z.field),dn=assembleAzimuth(dense,pn,a.added);
   for(const [name,g,nodes]of [['raw',z.field,pn.n256],['dense',dense.field,dn.n256]]){
    const fast=fastModel(g,nodes),errors=nodes.map(()=>[0,0]),directions=[...qs.map(q=>q.d),...Array.from({length:32},(_,i)=>g.g.nodes[Math.floor(i*g.g.count/32)])];let error=0;run.progress('point-parity',`${profile}/${target}/b${channel} ${name}`);
    const start=Date.now();for(const d of directions){const a=fast(d),b=polar2DModel(g,d,nodes,errors).values;for(let s=0;s<2;s++)error=Math.max(error,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));count++;}
    maximum=Math.max(maximum,error);rows.push({profile,target,channel,name,count:directions.length,error,milliseconds:Date.now()-start});assert.ok(error<=1e-10,'Specialized point model changed reconstruction');
   }
  }
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,count,maximum,tolerance:1e-10,scope:'Point/selected-node parity of an implementation optimization, not new physical accuracy.'});run.finish('accepted',{cases:rows.length,count,maximum});console.log(JSON.stringify({run:run.path,maximum,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
