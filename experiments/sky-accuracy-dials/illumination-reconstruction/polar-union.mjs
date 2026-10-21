import assert from 'node:assert/strict';
import {make} from '../structured-incoming/factory.mjs';
import {cells,geometryProof} from '../phase-cells/geometry.mjs';
import {models,phases} from './common.mjs';
import {augmented} from '../reconstruction-mechanisms/refinement-mesh.mjs';

/** Retain every original and previously added node, adding the remaining rings
 * of the same128-ring proposal. Azimuth resolution stays64: this isolates polar
 * refinement from the azimuth densification that worsened the adverse witness.
 * @param {any} f @param {number[]} scores @returns {any} */
export function polarUnion(f,scores) {
 return polarUnionFromPrior(f,augmented(f,scores,'targeted'));
}

/** Identical union construction from an explicitly matched prior construction.
 * Repeated physical grids must provide their own previously qualified twelve
 * rings instead of borrowing construction1 directions by index.
 * @param {any} f @param {any} prior @returns {any} */
export function polarUnionFromPrior(f,prior) {
 const old=f.g,n=old.config.phi;
 const proposal=make({...old.config,id:'polar-union-proposal',mu:128},f.t,f.px.radius,old.placement);
 const entries=old.rings.map((meta,index)=>({origin:'original',index,meta})),added=[];
 for(let i=0;i<proposal.rings.length;i++) {
  const meta=proposal.rings[i];
  if(old.rings.some(r=>Math.abs(r.m-meta.m)<1e-12))continue;
  const retained=prior.parameters.chosen.findIndex(c=>c.i===i);
  if(retained>=0) {
   assert.deepEqual(proposal.nodes.slice(i*n,(i+1)*n),prior.added.slice(retained*n,(retained+1)*n));
   entries.push({origin:'reused',index:retained,meta});
  }else {
   entries.push({origin:'fresh',index:added.length/n,meta});
   added.push(...proposal.nodes.slice(i*n,(i+1)*n));
  }
 }
 entries.sort((a,b)=>a.meta.m-b.meta.m);
 const directions=entries.flatMap(e=>e.origin==='original'?old.nodes.slice(e.index*n,(e.index+1)*n):e.origin==='reused'?prior.added.slice(e.index*n,(e.index+1)*n):added.slice(e.index*n,(e.index+1)*n));
 const g={...old,id:'polar-union-original-plus128',config:{...old.config,mu:entries.length},rings:entries.map(e=>e.meta),nodes:directions,count:directions.length,weights:Array(directions.length).fill(1),quadratureWeightsQualified:false};
 const mesh=cells(g),field={...f,g,mesh};field.bases=models(field);field.sourcePhases=directions.map(d=>phases(f.px,d));
 assert.equal(entries.filter(e=>e.origin==='original').length,old.rings.length);
 assert.equal(entries.filter(e=>e.origin==='reused').length,12);
 return {field,prior,entries,added,proof:geometryProof(mesh),parameters:{proposalRings:128,actualRings:entries.length,azimuthPerRing:n,nodes:g.count,retainedOriginal:old.count,retainedAdded:prior.added.length,newRays:added.length,allocation:'Fixed full128-ring physical proposal union; no outgoing/reference/error fitting',quadratureWeightsReused:false}};
}

/** @param {any} union @param {number[][]} original @param {number[][]} reused
 * @param {number[][]} fresh @returns {number[][]} */
export function assembleUnion(union,original,reused,fresh) {
 const n=union.field.g.config.phi;
 return union.entries.flatMap(e=>(e.origin==='original'?original:e.origin==='reused'?reused:fresh).slice(e.index*n,(e.index+1)*n));
}
