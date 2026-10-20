import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,read,setup,pack,verifyRun,miePhase,rayleighPhase,dot} from './common.mjs';
import {augmented,assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {refineAzimuth,assembleAzimuth} from './azimuth-refinement.mjs';
import {fastModel} from './fast-model.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {absoluteChange} from './physical-decisions.mjs';
import {interval} from '../reconstruction-mechanisms/metrics.mjs';

const root=base+'00670-h137-transfer',r=read(base+'00543-h92-broad-reg/registration.json.gz'),inputs=read(root+'/rows.json.gz'),selected=process.argv[2]?inputs.filter(x=>process.argv[2].split(',').includes(`${x.profile}:${x.target}:${x.channel}`)):inputs,levels=[2,4],run=createRun('h137-op-phys',{parents:[verifyRun(root),verifyRun(base+'00675-h136-fast-proof')],operation:'Continuous model integral and paired physical control-variate protection against complete Sun4096 on the frozen exposed transfer panel. No new light/geometry exposure; retain covariance and finite quadrature/light envelopes. This diagnoses transfer accuracy before admitting a complete recurrence.',parameters:{cases:selected.map(x=>[x.profile,x.target,x.channel]),levels,StudentFactor:2.46,allowance:.001,costIsGate:false}});
try{
 const rows=[];
 for(const a of selected){
  const f=setup(r,a.profile,a.target,a.channel),scores=read(root+`/${a.profile}-${a.target}-allocation.json`).scores,x=read(root+`/${a.profile}-${a.target}-b${a.channel}.json.gz`),z=augmented(f,scores,'targeted'),pn=assemble(z,x.nodes,x.added),dense=refineAzimuth(z.field),dn=assembleAzimuth(dense,pn,x.extra),models=[{name:'biRaw',field:z.field,nodes:pn.n256},{name:'biDense',field:dense.field,nodes:dn.n256}].map(x=>({...x,sample:fastModel(x.field,x.nodes)})),qs=read(root+`/${a.profile}-${a.target}-queries.json.gz`).qs.slice(0,256),checks=[];
  for(const model of models){let maximum=0;const zero=model.nodes.map(()=>[0,0]);for(const q of qs){const u=model.sample(q.d),v=polar2DModel(model.field,q.d,model.nodes,zero).values;for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(u[s]-v[s])/Math.max(Math.abs(v[s]),1e-25));}assert.ok(maximum<1e-10);checks.push({name:model.name,maximum});}
  const results=[];
  for(const n of levels){
   const sums=Object.fromEntries(models.map(x=>[x.name,[0,0]])),masses=[0,0],started=Date.now();let count=0;
   for(const q of piecewiseQuadrature(dense.field,n)){
    if(count%16384===0)run.progress('transfer-operator',`${a.profile}/${a.target}/b${a.channel} n${n} ${count}`);
    const p=f.px,m=dot(q.d,f.out),pr=rayleighPhase(m),pm=miePhase(p.table,m),weights=[q.w*p.br*Math.exp(-p.h/8000)*pr,q.w*p.bm*p.ssa*Math.exp(-p.h/1200)*pm];masses[0]+=q.w*pr;masses[1]+=q.w*pm;
    for(const model of models){const v=model.sample(q.d);for(let s=0;s<2;s++)sums[model.name][s]+=weights[s]*(v[0]+v[1]);}count++;
   }
   const previous=results.at(-1),normalized=Object.fromEntries(Object.entries(sums).map(([name,v])=>[name,(v[0]+v[1])/a.scale])),change=previous?Object.fromEntries(models.map(x=>[x.name,Math.abs(normalized[x.name]-previous.normalized[x.name])])):null,item={n,count,sums,masses,normalized,change,milliseconds:Date.now()-started};results.push(item);run.write(`${a.profile}-${a.target}-b${a.channel}-n${n}.json`,item);
  }
  const last=results.at(-1),sun=read(f.parent.path).packets.find(x=>x.geometry==='sun-4096-p1'&&x.channel===a.channel);assert.ok(sun);const control={value:sun.result.fine.normalized/a.scale,bias:2*Math.abs(sun.result.sums[128].normalized-sun.result.sums[64].normalized)/a.scale+2e-5*Math.abs(sun.result.fine.normalized/a.scale)},decisions={};
  for(const model of models){const z=a.results[model.name],e=interval(z.bins.map(b=>b.mE+b.rE),z.envelopes.m+z.envelopes.r),half=e.half*2.46/2.04,error={...e,half,lo:e.mean-half-e.bias,hi:e.mean+half+e.bias},value=last.normalized[model.name],quadBias=2*last.change[model.name]+2e-12,delta={lo:control.value-value-control.bias-quadBias,hi:control.value-value+control.bias+quadBias},gain=absoluteChange(error,delta),lower=-gain.upper,upper=-gain.lower;decisions[model.name]={lower,upper,passed:upper<=.001,rejected:lower>.001,inconclusive:lower<=.001&&upper>.001,error,control,value,quadBias,quadraturePrecision:quadBias<=1e-5};}
  rows.push({profile:a.profile,target:a.target,channel:a.channel,scale:a.scale,levels:results,checks,decisions});run.write(`${a.profile}-${a.target}-b${a.channel}-decision.json`,decisions);console.log(JSON.stringify({profile:a.profile,target:a.target,channel:a.channel,decisions:Object.fromEntries(Object.entries(decisions).map(([k,v])=>[k,{lower:v.lower,upper:v.upper,passed:v.passed,rejected:v.rejected,precision:v.quadraturePrecision}]))}));
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,models:['biRaw','biDense'].map(name=>({name,passed:rows.filter(x=>x.decisions[name].passed).length,rejected:rows.filter(x=>x.decisions[name].rejected).length,inconclusive:rows.filter(x=>x.decisions[name].inconclusive).length})),scope:'Exposed black-boundary pure localJ2 only; original decisions preserved, finite empirical precision not a truncation certificate.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
