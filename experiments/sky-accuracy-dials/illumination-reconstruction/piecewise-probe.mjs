import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {reference} from '../reconstruction-mechanisms/metrics.mjs';

const selected=process.argv[3]?process.argv[3].split(',').map(x=>{const [p,t,c]=x.split(':');return [p,t,Number(c)];}):[['paper','node-89',8],['toronto','reserved-out-1',8]],levels=process.argv[2]?.split(',').map(Number)??[2,4,8],r=registration(),run=createRun('h136-piecewise',{parents:[verifyRun(base+'00654-h135-profile'),verifyRun(base+'00657-h135-az-grid')],operation:'Independent quadrature split at actual reconstruction knots, physical sector curves and outgoing phase knots/tangencies of the actual two-axis reconstructed light. Diagnose continuous-operator convergence before full-cache propagation; same-model integral is distinct from physical truth.',parameters:{selected,levels,grids:[4864,9728],costIsGate:false,source:'No new light; authenticated original and added nodes.'}});
try{
 const rows=[];
 for(const [profile,target,channel]of selected){const f=setup(r,String(profile),String(target),Number(channel)),old=retained(String(profile),String(target),Number(channel)),root=base+'00654-h135-profile',a=read(root+`/${profile}-${target}-b${channel}.json.gz`),scores=read(root+`/${profile}-${target}-allocation.json`).scores,polar=augmented(f,scores,'targeted'),pn=assemble(polar,old.x.nodes,a.added),d=read(base+`00657-h135-az-grid/${profile}-${target}-b${channel}.json.gz`),dense=refineAzimuth(polar.field),dn=assembleAzimuth(dense,pn,d.added),scale=reference(f).scale,results=[];
  for(const n of levels){const sums={raw:[0,0],dense:[0,0]},masses=[0,0],start=Date.now();let count=0;
   const pe=pn.n256.map(()=>[0,0]),de=dn.n256.map(()=>[0,0]);
   for(const q of piecewiseQuadrature(dense.field,n)){if(count%1024===0)run.progress('continuous-operator',`${profile}/${target}/b${channel} order${n} sample${count}`);const p=f.px,m=dot(q.d,f.out),pr=rayleighPhase(m),pm=miePhase(p.table,m),weights=[q.w*p.br*Math.exp(-p.h/8000)*pr,q.w*p.bm*p.ssa*Math.exp(-p.h/1200)*pm];masses[0]+=q.w*pr;masses[1]+=q.w*pm;const v=polar2DModel(polar.field,q.d,pn.n256,pe),w=polar2DModel(dense.field,q.d,dn.n256,de);for(let s=0;s<2;s++){sums.raw[s]+=weights[s]*(v.values[0]+v.values[1]);sums.dense[s]+=weights[s]*(w.values[0]+w.values[1]);}count++;}
   const previous=results.at(-1),normalized=Object.fromEntries(Object.entries(sums).map(([k,v])=>[k,(v[0]+v[1])/scale])),change=previous?Object.fromEntries(Object.keys(sums).map(k=>[k,Math.abs(normalized[k]-previous.normalized[k])])):null,item={n,count,sums,masses,normalized,change,milliseconds:Date.now()-start};results.push(item);run.write(`${profile}-${target}-b${channel}-n${n}.json`,item);console.log(JSON.stringify({profile,target,channel,...item}));
  }
  rows.push({profile,target,channel,scale,levels:results,scope:'Actual reconstructed-light integral; convergence and phase mass do not establish physical accuracy.'});
 }
 run.write('rows.json.gz',pack(rows));run.finish('accepted',{cases:rows.length,levels,physicalTruth:false});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
