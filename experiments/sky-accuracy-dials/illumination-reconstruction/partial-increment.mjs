import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {exactPartialTransport} from './segment-transport.mjs';
import {normalizedPartialField,densityPartialExact} from './partial-density.mjs';

// All four native support rows are mandatory. Optional completed midpoints
// change the declared stencil; they never substitute for missing native data.
const nativeRoots=['00725-h136-source-row','00738-h138-source-row','00740-h138-source-row','00743-h138-source-row'],extras=(process.argv[2]??'00746-h138-source-row').split(',').filter(Boolean),extraHeights=extras.map(root=>read(base+root+'/summary.json').height),allowed=[937.5,2500,3750];assert.ok(extraHeights.every(x=>allowed.includes(x)));assert.equal(new Set(extraHeights).size,extraHeights.length);const heights=[0,1875,3125,4375,...extraHeights].sort((a,b)=>a-b),field=ownedPartialField([...nativeRoots,...extras].map(x=>base+x),heights),reference=base+'00752-h138-paired-note',ref=read(reference+'/summary.json'),run=createRun('h138-increment',{
 parents:[verifyRun(reference),verifyRun(base+'00747-h138-density'),verifyRun(base+'00748-h138-partial-cpu'),...field.parents],operation:'Measure an incremental altitude-stencil refinement as the registered midpoint rows finish. Preserve all mandatory native support and insert only explicitly completed own-source midpoint rows; no missing row is filled. Integrate physical-linear and density-normalized stencils independently with exact radial columns, compare both against the same frozen paired-reference interval, and retain the full seven-row endpoint as unfinished until all registered midpoints exist.',
 parameters:{nativeRoots,extras,heights,registeredMidpoints:allowed,allRegisteredMidpointsComplete:extras.length===3,channel:8,sourceZenithDegrees:89.5,segmentMeters:[0,4375],costIsGate:false},
});
try{
 const normalized=normalizedPartialField(field),results=[];
 for(const id of ['physical-linear','density-normalized']){run.progress('incremental-source-transport',id);const a=id==='physical-linear'?exactPartialTransport(field,64):densityPartialExact(normalized,64),b=id==='physical-linear'?exactPartialTransport(field,128):densityPartialExact(normalized,128),bias=b.map((x,s)=>2*Math.abs(x-a[s]));assert.ok(bias.every((x,s)=>x<=1e-8*b[s]));const values=[...b,b[0]+b[1]],comparison=values.map((value,s)=>{const interval=ref.components[s].physicalReference;return {component:ref.components[s].component,value,reference:{lower:interval.lower,upper:interval.upper},relativeErrorRange:[value/interval.upper-1,value/interval.lower-1],insideCommonReportedInterval:value>=interval.lower&&value<=interval.upper};});results.push({id,comparison,gaussBias:bias});}
 const summary={heights,extras,allRegisteredMidpointsComplete:extras.length===3,results,reference:identity(reference+'/summary.json'),scope:'Incremental source-altitude sensitivity in a single-wavelength partial atmospheric L2 path; all underlying source rows come from their own L1. Statistical reference/sensitivity interval, not deterministic physical protection. No actual hardware transport, global cache, later orders, image or B1 claim.'};run.write('summary.json',summary);run.finish('accepted',{allRegisteredMidpointsComplete:summary.allRegisteredMidpointsComplete});console.log(JSON.stringify({run:run.path,...summary,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
