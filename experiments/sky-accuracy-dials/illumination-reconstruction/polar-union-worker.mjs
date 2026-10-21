import {parentPort,workerData} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {base,registration,read,setup,retained,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {fastModel} from './fast-model.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';
import {absoluteChange} from './physical-decisions.mjs';

if(!parentPort)throw Error('Polar physical worker requires its owned parent');
const port=parentPort,{root,test,levels}=workerData,{profile,target,channel}=test;
const progress=message=>port.postMessage({type:'progress',message});
progress('Preparing unchanged prior and new-polar model inputs');
const isTransfer=['node-90','dev-2','dev-5','held-6'].includes(target),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile');
const r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),f=setup(r,profile,target,channel);
const priorPacket=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),packet=read(root+`/${profile}-${target}-b${channel}.json.gz`);
const scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,original=isTransfer?priorPacket.nodes:retained(profile,target,channel).x.nodes;
const union=polarUnion(f,scores),old=assemble(union.prior,original,priorPacket.added);
const next=assembleUnion(union,original.n256,priorPacket.added.n256,packet.fresh.n256);
const row=read(root+'/rows.json.gz').find(x=>x.profile===profile&&x.target===target&&x.channel===channel);
const models=[{name:'biRaw',field:union.prior.field,nodes:old.n256},{name:'polarUnion',field:union.field,nodes:next}].map(x=>({...x,sample:fastModel(x.field,x.nodes)}));
const qs=read(priorRoot+`/${profile}-${target}-queries.json.gz`).qs.slice(0,128),pointChecks=[];
for(const model of models) {
 const zero=model.nodes.map(()=>[0,0]);let maximum=0;
 for(const q of qs){const a=model.sample(q.d),b=polar2DModel(model.field,q.d,model.nodes,zero).values;for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));}
 assert.ok(maximum<1e-10,'Polar-union specialization versus interval implementation');pointChecks.push({model:model.name,maximum});
}
const results=[];
for(const n of levels) {
 const sums=Object.fromEntries(models.map(m=>[m.name,[0,0]])),mass=[0,0],started=Date.now();let count=0;
 for(const q of piecewiseQuadrature(union.field,n)) {
  if(count%65536===0)progress(`n${n} ${count}`);
  const p=f.px,mu=dot(q.d,f.out),pr=rayleighPhase(mu),pm=miePhase(p.table,mu),w=[q.w*p.br*Math.exp(-p.h/8000)*pr,q.w*p.bm*p.ssa*Math.exp(-p.h/1200)*pm];
  mass[0]+=q.w*pr;mass[1]+=q.w*pm;
  for(const model of models){const light=model.sample(q.d);for(let s=0;s<2;s++)sums[model.name][s]+=w[s]*(light[0]+light[1]);}count++;
 }
 const normalized=Object.fromEntries(models.map(m=>[m.name,sums[m.name].reduce((s,x)=>s+x,0)/row.scale]));
 const previous=results.at(-1),change=previous?Object.fromEntries(models.map(m=>[m.name,Math.abs(normalized[m.name]-previous.normalized[m.name])])):null;
 const item={n,count,sums,mass,normalized,change,milliseconds:Date.now()-started};results.push(item);
 port.postMessage({type:'level',value:item});
}
const last=results.at(-1),sun=read(f.parent.path).packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===channel);
const sunControl={value:sun.result.fine.normalized/row.scale,bias:2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/row.scale+2e-5*Math.abs(sun.result.fine.normalized/row.scale)};
const decisions={};
const previousIntegral=isTransfer?read(base+`00680-h137-op-phys/${profile}-${target}-b${channel}-decision.json`).biRaw:null;
const oldQuadBias=2*last.change.biRaw+2e-12;
const priorIntegralOverlap=previousIntegral?Math.abs(last.normalized.biRaw-previousIntegral.value)<=oldQuadBias+previousIntegral.quadBias:null;
for(const model of models) {
 const a=row.results[model.name],raw=interval(a.bins.map(b=>b.mE+b.rE),a.envelopes.m+a.envelopes.r),half=raw.half*2.46/2.04;
 const error={...raw,half,lo:raw.mean-half-raw.bias,hi:raw.mean+half+raw.bias};
 const value=last.normalized[model.name],quadBias=2*last.change[model.name]+2e-12;
 const delta={lo:sunControl.value-value-sunControl.bias-quadBias,hi:sunControl.value-value+sunControl.bias+quadBias};
 const gain=absoluteChange(error,delta),lower=-gain.upper,upper=-gain.lower;
 const precision=quadBias<=1e-5&&priorIntegralOverlap!==false;
 decisions[model.name]={lower,upper,passed:precision&&upper<=.001,rejected:precision&&lower>.001,inconclusive:!precision||lower<=.001&&upper>.001,error,value,quadBias,quadraturePrecision:quadBias<=1e-5,priorIntegralOverlap,control:sunControl};
}
port.postMessage({type:'result',value:{...test,scale:row.scale,results,decisions,pointChecks,priorIntegralOverlap,priorIntegralDifference:previousIntegral?last.normalized.biRaw-previousIntegral.value:null,parameters:union.parameters,scope:'Exposed local pure J2, retained independent query light and original finite envelopes; no recurrence or new fresh tuple.'}});
port.close();
