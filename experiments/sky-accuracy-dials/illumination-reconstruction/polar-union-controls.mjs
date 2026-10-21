import assert from 'node:assert/strict';
import {createRun,storage} from '../io/files.mjs';
import {base,registration,read,setup,targets,pack,verifyRun,direction} from './common.mjs';
import {augmented} from '../reconstruction-mechanisms/refinement-mesh.mjs';
import {polarUnion,polarUnionFromPrior} from './polar-union.mjs';
import {polar2DModel} from './azimuth-cubic.mjs';

const root=base+'00705-h137-polar-all',cases=[...targets,...['node-90','dev-2','dev-5','held-6']];
const run=createRun('h137-union-proof',{
 parents:[verifyRun(root)],
 operation:'Verify that taking the complete128-ring proposal union makes final physical directions independent of which twelve proposal rings were previously selected. Compare targeted, uniform and reversed-score priors, exact saved construction1 parameters and manufactured fixed-direction nodal values. This is geometry/implementation identity, not additional physical accuracy or later-order qualification.',
 parameters:{cases,profile:'paper',channel:3,variants:['targeted','uniform','reversed-scores'],manufactureQueries:32,costIsGate:false,prediction:'Every prior twelve-ring choice is a subset of the full proposal; it determines reuse bookkeeping, not the final geometry or exact-node interpolation.'},
});
try {
 const rows=[];
 for(const target of cases){
  run.progress('union-identity',target);
  const isTransfer=['node-90','dev-2','dev-5','held-6'].includes(target),source=base+(isTransfer?'00670-h137-transfer':'00654-h135-profile'),r=isTransfer?read(base+'00543-h92-broad-reg/registration.json.gz'):registration(),f=setup(r,'paper',target,3),scores=read(source+`/paper-${target}-allocation.json`).scores;
  const original=polarUnion(f,scores),variants=[original,polarUnionFromPrior(f,augmented(f,scores,'uniform')),polarUnionFromPrior(f,augmented(f,[...scores].reverse(),'targeted'))];
  assert.deepEqual(original.parameters,read(root+`/paper-${target}-b3.json.gz`).parameters);
  const values=original.field.g.nodes.map(d=>[1+.2*d[2]+.1*d[0]*d[0],.5+.15*d[1]*d[1]]),zero=values.map(()=>[0,0]);
  for(const v of variants){assert.deepEqual(v.field.g.nodes,original.field.g.nodes);assert.deepEqual(v.field.sourcePhases,original.field.sourcePhases);}
  for(let i=0;i<32;i++){
   const d=direction(original.field,-1+2*(i+.5)/32,(i*1.618033988749895)%(2*Math.PI)),expected=polar2DModel(original.field,d,values,zero);
   for(const variant of variants)assert.deepEqual(polar2DModel(variant.field,d,values,zero),expected);
  }
  rows.push({target,nodes:original.parameters.nodes,geometryIdentical:true,manufactureQueries:32,priorChoicesAffectReuseOnly:true,proof:original.proof});
 }
 run.write('rows.json.gz',pack(rows));run.write('summary.json',{cases:rows.length,variants:3,geometryIdentical:true,priorChoicesAffectReuseOnly:true,scope:'Fixed full-proposal union identity on exposed construction1 geometries; no new physical reference or higher-order accuracy claim.'});
 run.finish('accepted',{cases:rows.length,geometryIdentical:true});console.log(JSON.stringify({run:run.path,rows:rows.map(({proof,...rest})=>rest),storage:storage()}));
}catch(error){run.finish('failed',{failure:String(error)});throw error;}
verifyRun(run.path);
