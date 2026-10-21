import assert from 'node:assert/strict';
import {createRun,identity,storage} from '../io/files.mjs';
import {base,read,verifyRun} from './common.mjs';
import {ownedPartialField} from './partial-field.mjs';
import {gauss} from '../interior-illumination/physics.mjs';
import {samplePartialSource,radialTau} from './segment-transport.mjs';
import {normalizedPartialField,densityPartialSample} from './partial-density.mjs';
import {pairedPhysicalValues} from './partial-paired-reference.mjs';

const root=base+'00751-h138-paired-cpu',parent=read(root+'/summary.json'),queries=read(root+'/queries.json.gz'),light=read(root+'/light-v64-c256.json.gz').light,roots=['00725-h136-source-row','00738-h138-source-row','00740-h138-source-row','00743-h138-source-row'].map(x=>base+x),field=ownedPartialField(roots,[0,1875,3125,4375]),normalized=normalizedPartialField(field),run=createRun('h138-cell-split',{
 parents:[verifyRun(root),verifyRun(base+'00752-h138-paired-note'),...field.parents],operation:'Attribute the already measured vertical partial-L2 discrepancy to the three fixed native altitude cells without tracing any new physical light. Split the retained paired-reference physical/proxy contributions by their actual outer-event height; split each known proxy integral at the same boundaries. Retain correlated32-batch covariance and verify cell sums reproduce the original reference and candidate totals. Both incoming origins remain combined within each last-scattering species.',
 parameters:{physical:field.physical,cells:[[0,1875],[1875,3125],[3125,4375]],count:queries.count,seed:queries.seed,view:'Radial up/zenith; Sun elevation0.5degree; physical path0-4375m',reference:'Paired direct-L1 binary6464/256 with physical and normalized known-integral controls',costIsGate:false},
});

/** @param {boolean} density @param {number} cell @param {number} n
 * @returns {number[]} */
function cellIntegral(density,cell,n){const q=gauss(n),a=field.altitudes[cell],span=field.altitudes[cell+1]-a,out=[0,0];for(let j=0;j<n;j++){const h=a+span*q.nodes[j],v=density?densityPartialSample(normalized,h):samplePartialSource(field,h),w=span*q.weights[j]*Math.exp(-radialTau(field.physical,h));v.forEach((x,s)=>out[s]+=x*w);}return out;}
/** @param {number[][]} batches @returns {any} */
function stats(batches){const vectors=batches.map(x=>[...x,x[0]+x[1]]),mean=[0,1,2].map(s=>vectors.reduce((a,v)=>a+v[s],0)/32),threeSE=mean.map((m,s)=>3*Math.sqrt(vectors.reduce((a,v)=>a+(v[s]-m)**2,0)/(32*31)));return {mean,threeSE};}

try{
 const physical=pairedPhysicalValues(field.physical,queries,light),count=queries.count,batchSize=count/32,rows=[];
 for(let cell=0;cell<3;cell++){
  run.progress('paired-altitude-attribution',`cell${cell}`);const lower=field.altitudes[cell],upper=field.altitudes[cell+1],integrals={physical:cellIntegral(false,cell,128),normalized:cellIntegral(true,cell,128)},estimates={};
  for(const id of ['physical','normalized']){const batches=Array.from({length:32},()=>[0,0]);for(let i=0;i<count;i++){const h=queries.queries[i*4+3];if(h<lower||h>=upper)continue;for(let s=0;s<2;s++)batches[Math.floor(i/batchSize)][s]+=(physical[i][s]-queries.proxies[id][i*2+s]*queries.weights[i])/batchSize;}const detail=stats(batches),base=integrals[id],total=[...base,base[0]+base[1]],mean=total.map((x,s)=>x+detail.mean[s]);estimates[id]={mean,threeSE:detail.threeSE,batches,wholePathNumericalSensitivity:parent.allowances[id]};}
  const components=[0,1,2].map(s=>{const lo=Math.min(...['physical','normalized'].map(id=>estimates[id].mean[s]-estimates[id].threeSE[s]-parent.allowances[id][s])),hi=Math.max(...['physical','normalized'].map(id=>estimates[id].mean[s]+estimates[id].threeSE[s]+parent.allowances[id][s]));return {component:['lastR/all-origins','lastM/all-origins','total'][s],reference:{lower:Math.max(0,lo),upper:hi},candidates:['physical','normalized'].map(id=>{const v=integrals[id],value=s<2?v[s]:v[0]+v[1];return {id,value,signedErrorRange:[value-hi,value-lo]};})};});rows.push({cell,lower,upper,integrals,estimates,components});
 }
 for(const id of ['physical','normalized'])for(let s=0;s<2;s++){assert.ok(Math.abs(rows.reduce((a,x)=>a+x.integrals[id][s],0)-parent.baseIntegrals[id][s])<=1e-15);assert.ok(Math.abs(rows.reduce((a,x)=>a+x.estimates[id].mean[s],0)-parent.comparisons[id].intervals[s].mean)<=1e-15);}
 const tsv=['lower_m\tupper_m\tcomponent\tvariant\tcandidate\tsigned_error_lower\tsigned_error_upper',...rows.flatMap(row=>row.components.flatMap(c=>c.candidates.map(x=>[row.lower,row.upper,c.component,x.id,x.value,...x.signedErrorRange].join('\t'))))].join('\n')+'\n';run.write('cell-errors.tsv',tsv);run.write('summary.json',{rows,reference:identity(root+'/summary.json'),cellSumsReproduceParent:true,scope:'Vertical0-4375m one-wavelength pure-L2 attribution at Sun elevation0.5degree. Statistical/sensitivity ranges retain covariance; per-cell allowances conservatively reuse the whole-path numerical sensitivities. Physical horizon views, full paths, later orders and B1 remain separate.'});run.finish('accepted',{cells:rows.length});console.log(JSON.stringify({run:run.path,rows:rows.map(({estimates,...row})=>row),storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}verifyRun(run.path);
