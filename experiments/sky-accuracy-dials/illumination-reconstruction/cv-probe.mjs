import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,pack,verifyRun,miePhase,rayleighPhase,dot,phases} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {mixtureQuadrature} from './quadrature.mjs';
import {amplitudeControl} from './cv-math.mjs';
import {reference} from '../reconstruction-mechanisms/metrics.mjs';

const selected=[['paper','node-89',8],['toronto','reserved-out-1',8]],levels=process.argv[2]?.split(',').map(Number)??[4,8,16,32],r=registration(),run=createRun('h136-cv-operator',{parents:[verifyRun(base+'00661-h136-operator'),verifyRun(base+'00664-h136-phase-proof')],operation:'Test exact known-phase/amplitude control variates against the unchanged reconstructed-light integral. Integrate analytic source/outgoing phase mass and symmetry-odd term separately; refine only the residual. No new light or fitted correction.',parameters:{selected,levels,candidates:['raw','dense'],costIsGate:false,prediction:'Removing known source/outgoing phase concentration from the numerical residual improves convergence without changing its limiting integral.'}});
try{
 const rows=[];
 for(const [profile,target,channel]of selected){const f=setup(r,String(profile),String(target),Number(channel)),old=retained(String(profile),String(target),Number(channel)),root=base+'00654-h135-profile',a=read(root+`/${profile}-${target}-b${channel}.json.gz`),scores=read(root+`/${profile}-${target}-allocation.json`).scores,polar=augmented(f,scores,'targeted'),pn=assemble(polar,old.x.nodes,a.added),d=read(base+`00657-h135-az-grid/${profile}-${target}-b${channel}.json.gz`),dense=refineAzimuth(polar.field),dn=assembleAzimuth(dense,pn,d.added),scale=reference(f).scale,pe=pn.n256.map(()=>[0,0]),de=dn.n256.map(()=>[0,0]),models={raw:(d)=>polar2DModel(polar.field,d,pn.n256,pe).values,dense:(d)=>polar2DModel(dense.field,d,dn.n256,de).values},controls=Object.fromEntries(Object.entries(models).map(([k,m])=>[k,amplitudeControl(f,m)])),results=[];
  for(const n of levels){const sums={raw:[0,0,0,0],dense:[0,0,0,0]},rawSums={raw:0,dense:0},start=Date.now();let count=0;
   for(const q of mixtureQuadrature(f,n)){if(count%2048===0)run.progress('CV-operator',`${profile}/${target}/b${channel} order${n} sample${count}`);const src=phases(f.px,q.d),dest=[rayleighPhase(dot(q.d,f.out)),miePhase(f.px.table,dot(q.d,f.out))];for(const name of ['raw','dense']){const L=models[name](q.d),c=controls[name],A=c.coefficients(q.d);for(let t=0;t<2;t++)for(let s=0;s<2;s++){const i=t*2+s,w=q.w*c.beta[t]*dest[t];sums[name][i]+=w*(L[s]-src[s]*A[i]);rawSums[name]+=w*L[s];}}count++;}
   const normalized=Object.fromEntries(['raw','dense'].map(k=>[k,sums[k].reduce((s,x,i)=>s+x+controls[k].analytic[i],0)/scale])),previous=results.at(-1),item={n,count,normalized,rawNormalized:Object.fromEntries(Object.entries(rawSums).map(([k,v])=>[k,v/scale])),change:previous?Object.fromEntries(['raw','dense'].map(k=>[k,Math.abs(normalized[k]-previous.normalized[k])])):null,phaseTail:Object.fromEntries(['raw','dense'].map(k=>[k,controls[k].phaseTailEnvelope/scale])),milliseconds:Date.now()-start};results.push(item);run.write(`${profile}-${target}-b${channel}-n${n}.json`,item);console.log(JSON.stringify({profile,target,channel,...item}));
  }
  rows.push({profile,target,channel,scale,levels:results,controls:Object.fromEntries(Object.entries(controls).map(([k,v])=>[k,{anchors:v.anchors,convolutions:v.convolutions,analytic:v.analytic,phaseTailEnvelope:v.phaseTailEnvelope}]))});
 }
 run.write('rows.json.gz',pack(rows));run.finish('accepted',{cases:rows.length,levels,physicalInputsUnchanged:true});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
