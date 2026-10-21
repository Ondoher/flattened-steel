import assert from 'node:assert/strict';
import {parentPort,workerData} from 'node:worker_threads';
import {base,registration,read,setup,retained,miePhase,rayleighPhase,dot} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {assemble} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {fastModel} from './fast-model.mjs';
import {piecewiseQuadrature} from './piecewise-quadrature.mjs';
import {physicalTotal} from './polar-total.mjs';

if(!parentPort)throw Error('Polar precision worker requires its owned parent');
const port=parentPort,{root,parent,test,nextOrder}=workerData,{profile,target,channel}=test,progress=message=>port.postMessage({type:'progress',message});
progress('Load immutable previous levels and unchanged model inputs');
const history=read(parent+'/rows.json.gz').find(a=>a.profile===profile&&a.target===target&&a.channel===channel);assert.ok(history);
const isTransfer=['node-90','dev-2','dev-5','held-6'].includes(target),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),f=setup(r,profile,target,channel);
const prior=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),packet=read(root+`/${profile}-${target}-b${channel}.json.gz`),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,original=isTransfer?prior.nodes:retained(profile,target,channel).x.nodes,union=polarUnion(f,scores),old=assemble(union.prior,original,prior.added),next=assembleUnion(union,original.n256,prior.added.n256,packet.fresh.n256);
assert.deepEqual(history.parameters,union.parameters);assert.deepEqual(packet.physical,f.px);assert.ok(history.results.at(-1).n<nextOrder);
const row=read(root+'/rows.json.gz').find(a=>a.profile===profile&&a.target===target&&a.channel===channel);assert.equal(row.scale,history.scale);
const models=[{name:'biRaw',sample:fastModel(union.prior.field,old.n256)},{name:'polarUnion',sample:fastModel(union.field,next)}],sums={biRaw:[0,0],polarUnion:[0,0]},mass=[0,0],started=Date.now();let count=0;
for(const q of piecewiseQuadrature(union.field,nextOrder)){
 if(count%65536===0)progress(`n${nextOrder} ${count}`);
 const p=f.px,mu=dot(q.d,f.out),pr=rayleighPhase(mu),pm=miePhase(p.table,mu),w=[q.w*p.br*Math.exp(-p.h/8000)*pr,q.w*p.bm*p.ssa*Math.exp(-p.h/1200)*pm];mass[0]+=q.w*pr;mass[1]+=q.w*pm;
 for(const model of models){const light=model.sample(q.d);for(let s=0;s<2;s++)sums[model.name][s]+=w[s]*(light[0]+light[1]);}count++;
}
const previous=history.results.at(-1),normalized=Object.fromEntries(models.map(m=>[m.name,sums[m.name].reduce((s,x)=>s+x,0)/row.scale])),change=Object.fromEntries(models.map(m=>[m.name,Math.abs(normalized[m.name]-previous.normalized[m.name])])),item={n:nextOrder,count,sums,mass,normalized,change,milliseconds:Date.now()-started},decisions={};
for(const model of models){const oldDecision=history.decisions[model.name],quadBias=2*change[model.name]+2e-12,source={value:normalized[model.name],quadBias,control:oldDecision.control,priorIntegralOverlap:oldDecision.priorIntegralOverlap};decisions[model.name]=physicalTotal({...row,results:{...row.results,polarUnion:row.results[model.name]}},source);}
port.postMessage({type:'result',value:{...test,scale:row.scale,results:[...history.results,item],decisions,parameters:union.parameters,pointChecks:history.pointChecks,previousParent:parent,scope:'One new numerical integration level; prior light/query/model data and completed lower levels reused exactly.'}});port.close();
