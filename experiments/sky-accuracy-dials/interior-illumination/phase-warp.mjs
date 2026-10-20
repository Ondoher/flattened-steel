import assert from 'node:assert/strict';
import {miePhase,rayleighPhase} from './physics.mjs';

/** Positive source-phase coordinate between the same original polar rings.
 * Azimuthal donors and one-ring/support fallbacks are unchanged. No L or reference
 * value selects a weight. Species refers to the origin of the incoming L1 light.
 * @param {any} b @param {any} p @param {number} species @returns {any} */
export function phaseWarp(b,p,species){
 const phase=species===0?rayleighPhase:m=>miePhase(p.table,m);
 const stencil=(m,phi)=>{
  const original=b.stencil(m,phi),groups=new Map();
  for(const [i,w]of original){const ring=b.mesh.list[i].ring;groups.set(ring,(groups.get(ring)??0)+w);}
  const rings=[...groups.keys()].sort((a,b)=>a-b);
  if(rings.length!==2)return original;
  const [lo,hi]=rings,a=phase(b.rings[lo].m),z=phase(b.rings[hi].m),value=phase(m);
  if(Math.abs(z-a)<1e-15||groups.get(lo)<1e-14||groups.get(hi)<1e-14)return original;
  const t=(value-a)/(z-a);
  if(t<0||t>1||!Number.isFinite(t))return original;
  const next=original.map(([i,w])=>[i,w*(b.mesh.list[i].ring===lo?(1-t)/groups.get(lo):t/groups.get(hi))]);
  assert.ok(next.every(([i,w])=>w>=0&&Number.isFinite(w)));
  assert.ok(Math.abs(next.reduce((s,[i,w])=>s+w,0)-1)<1e-11);
  return next;
 };
 return {...b,mode:b.mode+'-source-phase-'+species,stencil,polar:[...new Set([...b.polar,...(species===1&&p.table?p.table.mu:[])])].sort((a,b)=>a-b)};
}
