import assert from 'node:assert/strict';
import {cells,geometryProof} from '../phase-cells/geometry.mjs';
import {models,phases,direction} from './common.mjs';

/** Double each ring's azimuth samples while preserving every old physical node.
 * Each sector gets all adjacent midpoints and one larger end-cap midpoint;
 * equal-cap ties alternate by ring index. No oracle/outgoing/material fit.
 * @param {any} f @returns {any} */
export function refineAzimuth(f){
 const old=f.g,n=old.config.phi,rows=f.bases.H100.rings,nodes=[],entries=[],added=[];
 for(let j=0;j<rows.length;j++){
  const row=rows[j],list=[];
  for(const s of row.sectors){
   const ids=s.indices,phis=s.phis;
   for(const i of ids)list.push({old:true,index:i,d:old.nodes[i],phi:Math.atan2(old.nodes[i].reduce((a,x,k)=>a+x*old.frame.v[k],0),old.nodes[i].reduce((a,x,k)=>a+x*old.frame.u[k],0))});
   const left=row.sectors.indexOf(s),bounds=old.rings[j].breaks,a=bounds[left],b=bounds[left+1],capLeft=phis[0]-a,capRight=b-phis.at(-1),mids=phis.slice(1).map((p,i)=>(p+phis[i])/2);
   mids.push(capLeft>capRight||(Math.abs(capLeft-capRight)<1e-12&&j%2===0)?(a+phis[0])/2:(b+phis.at(-1))/2);
   assert.equal(mids.length,ids.length);
   for(const p of mids){const d=direction(f,row.m,p),index=added.length;added.push(d);list.push({old:false,index,d,phi:p});}
  }
  for(const e of list){if(e.phi<0)e.phi+=2*Math.PI;}
  list.sort((a,b)=>a.phi-b.phi);assert.equal(list.length,2*n);
  for(const e of list){nodes.push(e.d);entries.push({old:e.old,index:e.index});}
 }
 const g={...old,id:old.id+'-az2',config:{...old.config,phi:2*n},nodes,count:nodes.length,weights:Array(nodes.length).fill(1),quadratureWeightsQualified:false},mesh=cells(g),field={...f,g,mesh};field.bases=models(field);field.sourcePhases=nodes.map(d=>phases(f.px,d));
 assert.equal(added.length,old.count);return {field,added,entries,proof:geometryProof(mesh),parameters:{oldNodes:old.count,newNodes:nodes.length,allOriginalNodesPreserved:true,selection:'Each physical sector: adjacent midpoints plus larger cap midpoint, ring-parity tie break',originalQuadratureWeightsReused:false}};
}

/** @param {any} mesh @param {any} old @param {any} added @returns {any} */
export function assembleAzimuth(mesh,old,added){return Object.fromEntries(['n32','n64','n256'].map(k=>[k,mesh.entries.map(e=>e.old?old[k][e.index]:added[k][e.index])]));}
