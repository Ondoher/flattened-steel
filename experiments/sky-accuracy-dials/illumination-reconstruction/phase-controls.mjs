import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,setup,pack,verifyRun,dot,miePhase,rayleighPhase} from './common.mjs';
import {phaseMoments,numericalMoments,convolution} from './phase-moments.mjs';
import {mixtureQuadrature} from './quadrature.mjs';

const r=registration(),run=createRun('h136-phase-proof',{parents:[verifyRun(base+'00660-h136-operator'),verifyRun(base+'00661-h136-operator')],operation:'Qualify known phase-only spherical convolution for an exact amplitude control variate. Endpoint/analytic phase moments are independently checked by polynomial Gauss integration; retained moment truncation and direct phase quadrature remain explicit. No atmosphere or cache light is fitted.',parameters:{maximumL:384,levels:[64,128,256,384],costIsGate:false,why:'Coarse operator quadrature has material phase-mass and source/phase-product error even after illumination reconstruction improves.'}});
try{
 const rows=[];
 for(const profile of ['paper','toronto'])for(const channel of [3,5,8]){
  run.progress('phase-moments',`${profile}/b${channel}`);const f=setup(r,profile,'node-89',channel),a=phaseMoments(f.px.table,384),numeric=numericalMoments(f.px.table,384),maximumDifference=Math.max(...a.map((v,i)=>Math.abs(v-numeric[i])));assert.ok(maximumDifference<=1e-7,'Independent physical phase moments');
  const angles=[1,.9999,.99,.9,0,-.8,-1,dot(f.px.sun,f.out)],values=angles.map(c=>({cosine:c,levels:[64,128,256,384].map(L=>({L,MM:convolution(a,a,c,L)})),RM:(1+.5*a[2]*(3*c*c-1)/2)/(4*Math.PI)}));
  const quadrature=[];if(channel===8){for(const n of [16,32]){let total=0,mass=0,count=0;for(const q of mixtureQuadrature(f,n)){if(count%8192===0)run.progress('phase-convolution',`${profile}/b${channel} n${n} ${count}`);total+=q.w*miePhase(f.px.table,dot(q.d,f.px.sun))*miePhase(f.px.table,dot(q.d,f.out));mass+=q.w*rayleighPhase(dot(q.d,f.px.sun))*miePhase(f.px.table,dot(q.d,f.out));count++;}quadrature.push({n,count,MM:total,RM:mass});}}
  rows.push({profile,channel,maximumDifference,moments:a,values,quadrature});console.log(JSON.stringify({profile,channel,maximumDifference,actualAngle:values.at(-1),quadrature}));
 }
 run.write('rows.json.gz',pack(rows));run.finish('accepted',{phaseCases:rows.length,momentCheckedThrough:384,materialFitted:false});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(e){run.finish('failed',{failure:String(e)});throw e;}verifyRun(run.path);
