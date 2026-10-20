import {outgoing} from './extra-math.mjs';
import assert from 'node:assert/strict';
import {createRun,verifyRun,identity,storage} from '../io/files.mjs';
import {base,registration,field,read,models,coordinates,pack} from './common.mjs';
import {physical,miePhase,rayleighPhase,dot} from './physics.mjs';
import {interval,mean} from './analysis.mjs';

const parents=process.argv.slice(2);assert.ok(parents.length>0);storage();const r=registration(),run=createRun('h123-int-azimuth',{parents:parents.map(s=>verifyRun(base+s)),operation:'Reuse identical physical L1 nodes/interior queries and their original full-support sampling densities. Rotate only eventual outgoing local azimuth by90/180degrees at unchanged elevation. Integrate the changed phase law without borrowing original-direction J2 truth.',parameters:{rotations:[90,180],normalization:'Original physical-direction J2/floor scale only; not error percent relative to the unmeasured new-direction truth.',reference:'No retained matched physical J2 reference for these outgoing directions. No total-error or protection verdict.'}}),all=[];
try{for(const parent of parents){const root=base+parent;
 for(const old of read(root+'/rows.json.gz').filter(x=>x.model==='midpoint')){
  const {profile,target,channel}=old,f=field(r,{profile,target,channel,k:.5}),p=physical(f),x=read(root+`/${profile}-${target}-b${channel}.json.gz`),qs=read(root+`/${profile}-${target}-queries.json.gz`).qs,bs=models(f);
  for(const degrees of [90,180]){const out=outgoing(f,x,qs,old,degrees,t=>run.progress('outgoing-phase-only',t));for(const z of out){z.queryParent=identity(root+`/${profile}-${target}-queries.json.gz`);z.lightParent=identity(root+`/${profile}-${target}-b${channel}.json.gz`);}all.push(...out);
  }
 }
}run.write('rows.json.gz',pack(all));run.write('summary.json',all.map(({batches,...x})=>x));run.finish('accepted',{fields:all.length,newIllumination:0,newPhysicalReference:0,reservedUnexposed:8});}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);console.log(JSON.stringify({run:run.path,storage:storage()}));
