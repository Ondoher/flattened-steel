import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,retained,verifyRun} from './common.mjs';
import {polarUnion,assembleUnion} from './polar-union.mjs';
import {queryContext,prepareQuery,plannedModel} from './query-plan.mjs';
import {ringQueries} from './query-ring-plan.mjs';
import {projectionGrid} from './harmonic-grid.mjs';

const cases=['node-89','dev-2'].flatMap(target=>['paper','toronto'].map(profile=>({target,profile,channel:8})));
const run=createRun('h136-ring-plan',{
 parents:['00722-h136-query-plan','00720-h137-polar-qual','00705-h137-polar-all'].map(name=>verifyRun(base+name)),
 operation:'Verify latitude-shared preparation against independent point preparation on actual continuous-projection quadrature locations and physical boundaries. The optimization changes no sampled illumination, Hermite equation, phase or support rule.',
 parameters:{cases,L:128,n:4,latitudeStride:61,azimuthsPerLatitude:64,tolerance:1e-10,costIsGate:false},
});
try{
 const rows=[];
 for(const test of cases){
  const {target,profile,channel}=test,isTransfer=target==='dev-2',r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),priorRoot=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),f=setup(r,profile,target,channel),p=read(priorRoot+`/${profile}-${target}-b${channel}.json.gz`),scores=read(priorRoot+`/${profile}-${target}-allocation.json`).scores,union=polarUnion(f,scores),original=isTransfer?p.nodes:retained(profile,target,channel).x.nodes,fresh=read(base+`00705-h137-polar-all/${profile}-${target}-b${channel}.json.gz`).fresh,nodes=assembleUnion(union,original.n256,p.added.n256,fresh.n256),context=queryContext(union.field),model=plannedModel(union.field,nodes);let maximum=0,count=0,latitudes=0;
  for(const row of projectionGrid(union.field,128,4)){
   const selected=latitudes++%61===0;if(!selected)continue;run.progress('ring-plan-parity',`${profile}/${target} latitude${latitudes}`);const prepare=ringQueries(union.field,context,row.mu);
   for(let j=0;j<64;j++){
    const p=prepare(2*Math.PI*(j+.314159)/64),reference=prepareQuery(context,p.d),a=model.evaluate(p),b=model.evaluate(reference);
    for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));count++;
   }
  }
  // Exact node cosines force the declared whole-query support fallback.
  for(const mu of [context.bases[0].rings[0].m,context.bases[0].rings.at(-1).m,context.bases[0].rings[42].m]){const prepare=ringQueries(union.field,context,mu);for(const phi of [0,.37,Math.PI,2*Math.PI-1e-9]){const plan=prepare(phi);assert.equal(plan.fallback,true);const a=model.evaluate(plan),b=model.evaluate(prepareQuery(context,plan.d));for(let s=0;s<2;s++)maximum=Math.max(maximum,Math.abs(a[s]-b[s])/Math.max(Math.abs(b[s]),1e-25));count++;}}
  assert.ok(maximum<=1e-10);rows.push({...test,count,latitudes,maximum});console.log(JSON.stringify(rows.at(-1)));
 }
 run.write('summary.json',{rows,scope:'CPU geometry preparation specialization only; actual GPU Fourier/projection and higher-order physical light remain separate.'});run.finish('accepted',{cases:rows.length});console.log(JSON.stringify({run:run.path,storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
