import assert from 'node:assert/strict';
import {createRun,identity,sha256,storage} from '../io/files.mjs';
import {edge,dot,column,altitude,rayleighPhase,miePhase} from '../interior-illumination/physics.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {partialHistories,historyHg,historyStatistics} from './partial-history.mjs';

const parent=base+'00742-h138-history-fp',p=read(parent+'/summary.json').physical,heights=[0,937.5,1875,2500,3125,3750,4375],count=131072,seed=684729243,run=createRun('h138-point-ref',{
 parents:[verifyRun(parent)],operation:'Cache-free physical pure-J2 density references at every pre-registered source-support altitude, exact radial-up outgoing direction. This isolates source construction from subsequent path/spatial interpolation in the partial-L2 diagnostic. Unrounded independent positive-event histories integrate the incoming sphere and first-scatter physical branch with exact mixture PDFs; no source cache is read. Freeze all seven heights and the seed before comparison. Retain batch means, deterministic history/contribution identities and calibration examples for reproducible compact evidence.',
 parameters:{physical:p,heights,sourceZenithDegrees:89.5,channel:8,outgoing:[0,0,1],count,seed,batches:32,columns:[128,256],units:'Pure-J2 density, last-scattering coefficients already included',costIsGate:false},
});

/** Independent physical single-event light times the last-scattering kernel.
 * There is no observer path or outer attenuation in this density reference.
 * @param {number[]} first @param {number[]} tail @param {number} nc
 * @returns {number[]} */
function pointValue(first,tail,nc){
 const d=first.slice(0,3),h0=first[3],t=tail[0],h=altitude(p.radius,h0,d[2],t),mu=dot(d,p.sun),sm=((p.radius+h0)*p.sun[2]+t*mu)/(p.radius+h),exit=edge(p.radius,p.top,h,sm);if(exit.ground)return [0,0,0,0];const weight=tail[1]*p.irradiance*Math.exp(-column(p,h0,d[2],t,nc)-column(p,h,sm,exit.length,nc)),a=[p.br*Math.exp(-h/8000)*rayleighPhase(mu),p.bm*p.ssa*Math.exp(-h/1200)*miePhase(null,mu)],b=[p.br*Math.exp(-h0/8000)*rayleighPhase(d[2]),p.bm*p.ssa*Math.exp(-h0/1200)*miePhase(null,d[2])];return [b[0]*a[0],b[0]*a[1],b[1]*a[0],b[1]*a[1]].map(x=>x*weight);
}

try{
 const original=partialHistories(p,count,seed,false),rows=[];
 for(const height of heights){
  run.progress('prepare-point-reference',`height${height}`);const first=[],tail=[];
  for(let i=0;i<count;i++){const d=original.first.slice(i*4,i*4+3),oldH=original.first[i*4+3],oldEnd=edge(p.radius,p.top,oldH,d[2]).length,u=Math.log1p(original.tail[i*4]/1000)/Math.log1p(oldEnd/1000),end=edge(p.radius,p.top,height,d[2]).length,span=Math.log1p(end/1000),t=1000*Math.expm1(u*span),pd=(1/(4*Math.PI)+historyHg(dot(d,p.sun))+historyHg(d[2]))/3;first.push(...d,height);tail.push(t,(t+1000)*span/pd);}
  const queryIdentity=sha256(JSON.stringify({first,tail})),levels=[],calibration=[],batchSize=count/32;
  for(const nc of [128,256]){const started=Date.now(),batches=[],values=[];
   for(let batch=0;batch<32;batch++){run.progress('binary64-point-reference',`height${height} column${nc} batch${batch+1}/32`);const sum=[0,0,0,0];for(let i=batch*batchSize;i<(batch+1)*batchSize;i++){if(i%4096===0)run.progress('binary64-point-reference',`height${height} column${nc} history${i}`);const q=first.slice(i*4,i*4+4),a=tail.slice(i*2,i*2+2),v=pointValue(q,a,nc);assert.ok(v.every(x=>Number.isFinite(x)&&x>=0));values.push(...v);v.forEach((x,s)=>sum[s]+=x);if(i%2048===1024)calibration.push({nc,i,first:q,tail:a,values:v});}batches.push(sum.map(x=>x/batchSize));}
   levels.push({nc,batches,statistics:historyStatistics(batches),contributionIdentity:sha256(JSON.stringify(values)),milliseconds:Date.now()-started});
  }
  const paired=historyStatistics(levels[1].batches.map((x,i)=>x.map((v,s)=>v-levels[0].batches[i][s]))),fine=levels[1].statistics,finiteSensitivity=paired.mean.map((x,s)=>2*(Math.abs(x)+paired.threeSE[s])),row={height,queryIdentity,count,seed,levels,calibration,paired,intervals:fine.mean.map((x,s)=>({mean:x,threeSE:fine.threeSE[s],finiteSensitivity:finiteSensitivity[s],lower:Math.max(0,x-fine.threeSE[s]-finiteSensitivity[s]),upper:x+fine.threeSE[s]+finiteSensitivity[s]}))};run.write(`height-${height}.json.gz`,pack(row));rows.push(row);console.log(JSON.stringify({height,intervals:row.intervals.slice(4)}));
 }
 run.write('summary.json',{physical:p,heights,count,seed,rows:rows.map(({calibration,...row})=>row),scope:'Cache-free local pure-J2 density at one wavelength. Statistical32-batch three-SE intervals plus empirical column sensitivity; no cache/source-row input, observer transport, full-order radiance, images or B1 qualification.'});run.finish('accepted',{pointReferences:heights.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
