import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {samplePartialSource,exactPartialTransport} from './segment-transport.mjs';
import {normalizedPartialField,densityPartialSample,densityPartialExact,densityPartialFinite} from './partial-density.mjs';

const roots=(process.argv[2]??'').split(',').filter(Boolean).map(x=>x.startsWith(base)?x:base+x),extra=(process.argv[3]??'').split(',').filter(Boolean).map(x=>x.startsWith(base)?x:base+x),reference=base+'00742-h138-history-fp',ref=read(reference+'/summary.json'),fields=[{id:'native',field:ownedPartialField(roots,[0,1875,3125,4375])}];if(extra.length)fields.push({id:'midpoint-refined',field:ownedPartialField([...roots,...extra],[0,937.5,1875,2500,3125,3750,4375])});
const run=createRun('h138-density',{
 parents:[verifyRun(reference),verifyRun(base+'00745-h138-spatial'),...fields.flatMap(x=>x.field.parents)],
 operation:'Follow the resolved altitude-interpolation mechanism in745 through the registered radial0-4375m partial-L2 path. Compare actual owned physical-source linear interpolation with species-density-normalized interpolation of exactly the same source rows. Retain independent exact-column Gauss64/128 and unchanged finite60/120/240 controls. Density is removed at storage and restored once at each query, never added twice. This is an attribution derivative, not an admitted global policy.',
 parameters:{roots,extra,channel:8,sourceZenithDegrees:89.5,segmentMeters:[0,4375],speciesScaleHeights:[8000,1200],storage:'Float32 physical or normalized payload',costIsGate:false},
});
try{
 const results=fields.map(({id,field})=>{run.progress('density-partial-transport',id);assert.deepEqual(field.physical,ref.physical);const normalized=normalizedPartialField(field),nodeChecks=field.altitudes.map(h=>{const a=samplePartialSource(field,h),b=densityPartialSample(normalized,h),relative=Math.max(...a.map((x,s)=>Math.abs(x-b[s])/x));assert.ok(relative<=1e-7);return {h,physical:a,restored:b,relative};}),plain=exactPartialTransport(field,128),a=densityPartialExact(normalized,64),b=densityPartialExact(normalized,128),bias=b.map((x,s)=>2*Math.abs(x-a[s]));assert.ok(bias.every((x,s)=>x<=1e-8*b[s]));
  const compare=value=>[...value,value[0]+value[1]].map((x,s)=>{const interval=ref.intervals[s+4];return {component:['lastR','lastM','total'][s],value:x,reference:interval,relativeDifference:x/interval.mean-1,insideReportedInterval:x>=interval.lower&&x<=interval.upper};});return {id,sourceAltitudes:field.altitudes,nodeChecks,plain:compare(plain),densityNormalized:compare(b),gaussBias:bias,finite:[60,120,240].map(n=>({n,values:densityPartialFinite(normalized,n)}))};
 });
 const summary={results,reference:identity(reference+'/summary.json'),scope:'One-wavelength atmospheric partial-L2 attribution. Original source rows/physical medium are unchanged. Normalization is not a global cache policy and has no higher-order/ground/twilight/B1 qualification. Independent reference intervals retain statistical and finite-column qualifications; actual GPU normalized transport is separate.'};run.write('summary.json',summary);run.finish('accepted',{diagnosticOnly:true,fields:fields.length});console.log(JSON.stringify({run:run.path,...summary,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
