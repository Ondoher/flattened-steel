import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {direct,gauss} from '../interior-illumination/physics.mjs';
import {base,read,pack,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {radialTau,exactPartialTransport} from './segment-transport.mjs';
import {normalizedPartialField,densityPartialExact} from './partial-density.mjs';
import {pairedPartialQueries,pairedPhysicalValues} from './partial-paired-reference.mjs';
import {historyStatistics} from './partial-history.mjs';

const roots=['00725-h136-source-row','00738-h138-source-row','00740-h138-source-row','00743-h138-source-row'].map(x=>base+x),field=ownedPartialField(roots,[0,1875,3125,4375]),count=Number(process.argv[2]??16384),seed=684729251;assert.ok(Number.isInteger(count)&&count>=16384&&count%32===0);
const run=createRun('h138-paired-cpu',{
 parents:[verifyRun(base+'00742-h138-history-fp'),verifyRun(base+'00745-h138-spatial'),verifyRun(base+'00747-h138-density'),verifyRun(base+'00748-h138-partial-cpu'),...field.parents],
 operation:'Paired physical-reference precision at the actual native partial-L2 discrepancy, without fitting the candidate. Trace cache-free direct L1 at each sampled actual height/direction; subtract the known-integral owned incoming reconstruction with fixed coefficient1 as a variance control. Re-add its independent same-field path integral. Compare physical-source and density-normalized controls on identical queries, retain a raw cache-free estimate and the standalone742 history reference. No cache value replaces physical light. This controls reference variance only, not candidate construction.',
 parameters:{physical:field.physical,count,seed,batches:32,coefficient:1,levels:[[32,128],[64,128],[64,256]],segmentMeters:[0,4375],sourceZenithDegrees:89.5,channel:8,queries:'Frozen uniform/exponential outer and uniform/Sun-HG/view-HG incoming mixture; exact PDFs, unrounded binary64 events',arithmetic:'CPU binary64 independent direct integration while the only GPU builds midpoint source rows;64-query timing526ms makes this a bounded concurrent precision wave',costIsGate:false},
});

/** Known proxy-integral numerical sensitivity, propagated through positive
 * altitude stencils. The projection envelopes are empirical, not rigorous.
 * @param {boolean} normalized @returns {number[]} */
function proxyAllowance(normalized){
 const errors=field.rows.map(row=>{let scale,envelope;if(row.physical.h===0){const item=read(row.root+'/summary.json').rows.find(x=>x.channel===8);scale=item.scale;envelope=item.projectionEnvelope;}else{scale=read(row.root+'/input.json.gz').scale;envelope=read(row.root+'/summary.json').projection.at(-1).envelope;}return scale*envelope+1.1e-4*(row.rayleigh[field.upIndex]+row.mie[field.upIndex]);}),q=gauss(64),out=[0,0];
 for(let i=1;i<field.altitudes.length;i++){const a=field.altitudes[i-1],span=field.altitudes[i]-a;for(let j=0;j<q.nodes.length;j++){const t=q.nodes[j],h=a+span*t,w=span*q.weights[j]*Math.exp(-radialTau(field.physical,h));for(let s=0;s<2;s++){const H=[8000,1200][s],left=normalized?Math.exp((a-h)/H):1,right=normalized?Math.exp((field.altitudes[i]-h)/H):1;out[s]+=w*((1-t)*errors[i-1]*left+t*errors[i]*right);}}}return [...out,out[0]+out[1]];
}

/** @param {number[][]} values @returns {number[][]} */
function batchMeans(values){const n=count/32;return Array.from({length:32},(_,batch)=>{const sum=[0,0];for(let i=batch*n;i<(batch+1)*n;i++)values[i].forEach((x,s)=>sum[s]+=x);return sum.map(x=>x/n);});}
/** @param {number[][]} means @returns {any} */
function stats(means){return historyStatistics(means.map(x=>[x[0],0,x[1],0]));}

try{
 run.progress('prepare-paired-proxy',`${count} own-field queries`);const queries=pairedPartialQueries(field,count,seed);run.write('queries.json.gz',pack(queries));const baseIntegrals={physical:exactPartialTransport(field,128),normalized:densityPartialExact(normalizedPartialField(field),128)},allowances={physical:proxyAllowance(false),normalized:proxyAllowance(true)},levels=[];
 for(const [nv,nc]of [[32,128],[64,128],[64,256]]){
  const started=Date.now(),light=[];for(let i=0;i<count;i++){if(i%64===0)run.progress('binary64-variable-L1',`${nv}/${nc} query${i}/${count}`);const d=queries.queries.slice(i*4,i*4+3),h=queries.queries[i*4+3];light.push(direct({...field.physical,h},d,nv,nc));}
  const physical=pairedPhysicalValues(field.physical,queries,light),rawBatches=batchMeans(physical),variants={};
  for(const id of ['physical','normalized']){const proxy=Array.from({length:count},(_,i)=>[0,1].map(s=>queries.proxies[id][i*2+s]*queries.weights[i])),difference=physical.map((v,i)=>v.map((x,s)=>x-proxy[i][s])),batches=batchMeans(difference),summary=stats(batches),base=baseIntegrals[id],estimate=[base[0],base[1],base[0]+base[1]].map((x,s)=>x+summary.mean[s+4]);variants[id]={batches,statistics:summary,estimate,proxyStatistics:stats(batchMeans(proxy))};}
  const item={nv,nc,raw:stats(rawBatches),variants,milliseconds:Date.now()-started};run.write(`light-v${nv}-c${nc}.json.gz`,pack({light,item,queries:identity(run.path+'/queries.json.gz')}));levels.push(item);console.log(JSON.stringify({...item,variants:Object.fromEntries(Object.entries(variants).map(([id,v])=>[id,{estimate:v.estimate,threeSE:v.statistics.threeSE.slice(4)}]))}));
 }
 const fine=levels.at(-1),comparisons={};
 for(const id of ['physical','normalized']){const paired=levels.slice(0,-1).map(coarse=>stats(fine.variants[id].batches.map((x,i)=>x.map((v,s)=>v-coarse.variants[id].batches[i][s])))),finiteSensitivity=[0,1,2].map(s=>Math.max(...paired.map(x=>2*(Math.abs(x.mean[s+4])+x.threeSE[s+4])))),mean=fine.variants[id].estimate,threeSE=fine.variants[id].statistics.threeSE.slice(4),numericalSensitivity=allowances[id],intervals=mean.map((x,s)=>({mean:x,threeSE:threeSE[s],finiteSensitivity:finiteSensitivity[s],proxyNumericalSensitivity:numericalSensitivity[s],lower:Math.max(0,x-threeSE[s]-finiteSensitivity[s]-numericalSensitivity[s]),upper:x+threeSE[s]+finiteSensitivity[s]+numericalSensitivity[s]}));comparisons[id]={intervals,pairedFinite:paired,proxyIntegral:baseIntegrals[id],candidateRelativeDifference:baseIntegrals[id].concat(baseIntegrals[id][0]+baseIntegrals[id][1]).map((x,s)=>x/mean[s]-1)};}
 const closure=stats(fine.variants.physical.batches.map((x,i)=>x.map((v,s)=>v-fine.variants.normalized.batches[i][s]))),knownDifference=baseIntegrals.physical.map((x,s)=>x-baseIntegrals.normalized[s]),proxyClosure=[...knownDifference,knownDifference[0]+knownDifference[1]].map((x,s)=>({residual:x+closure.mean[s+4],threeSE:closure.threeSE[s+4],numericalSensitivity:allowances.physical[s]+allowances.normalized[s]}));
 const standalone=read(base+'00742-h138-history-fp/summary.json'),overlap=Object.fromEntries(Object.entries(comparisons).map(([id,v])=>[id,v.intervals.map((x,s)=>x.lower<=standalone.intervals[s+4].upper&&x.upper>=standalone.intervals[s+4].lower)])),summary={count,seed,physical:field.physical,baseIntegrals,allowances,levels:levels.map(({variants,...item})=>({...item,variants:Object.fromEntries(Object.entries(variants).map(([id,v])=>[id,{estimate:v.estimate,statistics:v.statistics}]))})),comparisons,proxyClosure,standaloneOverlap:overlap,closureCompatible:proxyClosure.every(x=>Math.abs(x.residual)<=x.threeSE+x.numericalSensitivity),scope:'Paired control-variate physical-reference precision for one-wavelength partial atmospheric L2. Physical light is cache-free; owned fields supply a fixed known-integral variance control only. Intervals retain sampling, finite-direct-integration and empirical proxy-integral sensitivities. No full observer, higher-order, external solver, image or B1 claim.'};
 run.write('summary.json',summary);run.finish('accepted',{closureCompatible:summary.closureCompatible,standaloneOverlap:overlap});console.log(JSON.stringify({run:run.path,comparisons,proxyClosure,standaloneOverlap:overlap,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
